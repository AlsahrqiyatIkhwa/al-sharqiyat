'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartLine } from '@/types';

interface CartState {
  lines: CartLine[];
  addItem: (line: CartLine) => void;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  setCustomColorNote: (variantId: number, note: string) => void;
  clearCart: () => void;
  subtotal: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],

      addItem: (newLine) => {
        set((state) => {
          const existing = state.lines.find((l) => l.variantId === newLine.variantId);

          if (existing) {
            const nextQty = Math.min(existing.quantity + newLine.quantity, existing.maxStock);
            return {
              lines: state.lines.map((l) =>
                l.variantId === newLine.variantId ? { ...l, quantity: nextQty } : l
              ),
            };
          }

          return {
            lines: [...state.lines, { ...newLine, quantity: Math.min(newLine.quantity, newLine.maxStock) }],
          };
        });
      },

      removeItem: (variantId) => {
        set((state) => ({ lines: state.lines.filter((l) => l.variantId !== variantId) }));
      },

      updateQuantity: (variantId, quantity) => {
        set((state) => ({
          lines: state.lines
            .map((l) =>
              l.variantId === variantId
                ? { ...l, quantity: Math.max(1, Math.min(quantity, l.maxStock)) }
                : l
            )
            .filter((l) => l.quantity > 0),
        }));
      },

      setCustomColorNote: (variantId, note) => {
        set((state) => ({
          lines: state.lines.map((l) =>
            l.variantId === variantId ? { ...l, customColorNote: note } : l
          ),
        }));
      },

      clearCart: () => set({ lines: [] }),

      subtotal: () => get().lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),

      totalItems: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
    }),
    {
      name: 'al-sharqiyat-cart', // localStorage key
    }
  )
);
