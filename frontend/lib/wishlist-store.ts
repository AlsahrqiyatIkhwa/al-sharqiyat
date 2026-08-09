'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import { getDeviceId } from '@/lib/device-id';
import { WishlistItem } from '@/types';

// De-dupes by productId, keeping the first occurrence — a defensive guard
// so a stale/replayed fetch response can never render the same product twice.
function dedupeByProduct(items: WishlistItem[]): WishlistItem[] {
  const seen = new Set<number>();
  const result: WishlistItem[] = [];
  for (const item of items) {
    if (seen.has(item.productId)) continue;
    seen.add(item.productId);
    result.push(item);
  }
  return result;
}

interface WishlistState {
  productIds: Set<number>;
  items: WishlistItem[];
  loaded: boolean;
  loading: boolean;
  pendingIds: Set<number>;
  fetchWishlist: () => Promise<void>;
  toggle: (productId: number) => Promise<void>;
  isWishlisted: (productId: number) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  productIds: new Set(),
  items: [],
  loaded: false,
  loading: false,
  // Tracks productIds with an in-flight add/remove request, so a rapid
  // double-click (or the same product's button rendered in two places,
  // e.g. a grid card and the detail page) can't fire two overlapping
  // requests for the same product.
  pendingIds: new Set(),

  fetchWishlist: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const deviceId = getDeviceId();
      const res = await api.get('/wishlist', { params: { deviceId } });
      const items: WishlistItem[] = dedupeByProduct(res.data.items);
      set({
        items,
        productIds: new Set(items.map((i) => i.productId)),
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  toggle: async (productId: number) => {
    // Already mid-request for this exact product — ignore the extra tap
    // instead of firing a second overlapping add/remove.
    if (get().pendingIds.has(productId)) return;

    const deviceId = getDeviceId();
    const isCurrentlyWishlisted = get().productIds.has(productId);

    // Optimistic update — feels instant, rolled back below on failure
    set((state) => {
      const nextIds = new Set(state.productIds);
      isCurrentlyWishlisted ? nextIds.delete(productId) : nextIds.add(productId);
      const nextPending = new Set(state.pendingIds);
      nextPending.add(productId);
      return {
        productIds: nextIds,
        pendingIds: nextPending,
        // Removing is safe to reflect immediately since we already have
        // the item locally. Adding needs the full product record from the
        // server, so that's synced in afterward rather than guessed here —
        // this is what keeps the list from ever showing a duplicate card.
        items: isCurrentlyWishlisted
          ? state.items.filter((i) => i.productId !== productId)
          : state.items,
      };
    });

    try {
      if (isCurrentlyWishlisted) {
        await api.delete(`/wishlist/${productId}`, { params: { deviceId } });
      } else {
        await api.post('/wishlist', { deviceId, productId });
        // Pull the authoritative list so the newly added product's full
        // details appear correctly, deduped, with no chance of a duplicate.
        const res = await api.get('/wishlist', { params: { deviceId } });
        const items: WishlistItem[] = dedupeByProduct(res.data.items);
        set({ items, productIds: new Set(items.map((i) => i.productId)) });
      }
    } catch {
      // Roll back on failure
      set((state) => {
        const nextIds = new Set(state.productIds);
        isCurrentlyWishlisted ? nextIds.add(productId) : nextIds.delete(productId);
        return { productIds: nextIds };
      });
      throw new Error('تعذر تحديث المفضلة');
    } finally {
      set((state) => {
        const nextPending = new Set(state.pendingIds);
        nextPending.delete(productId);
        return { pendingIds: nextPending };
      });
    }
  },

  isWishlisted: (productId: number) => get().productIds.has(productId),
}));
