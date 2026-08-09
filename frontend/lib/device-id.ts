const STORAGE_KEY = 'sharqiyat_device_id';

/**
 * Returns a stable, anonymous per-browser identifier used only to scope the
 * wishlist server-side (no accounts exist in this storefront). Generated
 * once with crypto.randomUUID() and persisted in localStorage — never sent
 * anywhere except the wishlist endpoints.
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';

  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
