import type { CartItem } from "../context/CartContext";

import { mergeCarts, needsMerging } from "./cartMerge";

export interface ReconcileResult {
  items: CartItem[];
  /** True when the server copy is behind the cart the shopper already has. */
  pushToServer: boolean;
}

/**
 * Pick one cart after a reload.
 * An empty server response must not discard items kept in localStorage, and an
 * empty local cart must not be posted over a server cart that still has items.
 * The same product is kept once; quantity is the higher of the two copies.
 */
export function reconcileLoadedCart(
  localItems: CartItem[],
  serverItems: CartItem[]
): ReconcileResult {
  if (localItems.length === 0 && serverItems.length === 0) {
    return { items: [], pushToServer: false };
  }

  if (localItems.length === 0) {
    return { items: serverItems, pushToServer: false };
  }

  if (serverItems.length === 0) {
    return { items: localItems, pushToServer: true };
  }

  const merged = mergeCarts(localItems, serverItems);
  return {
    items: merged,
    pushToServer: needsMerging(merged, serverItems),
  };
}

/**
 * Debounced sync must send the cart after React applies the update, not the
 * empty array captured when the timer was scheduled.
 */
export function selectCartSyncPayload(latestItems: CartItem[]): {
  items: CartItem[];
  clear: boolean;
} {
  return {
    items: latestItems,
    clear: latestItems.length === 0,
  };
}
