import type { CartItem } from "../context/CartContext";

/**
 * Merges two carts (local and server) into a single cart.
 * Resolves conflicts by keeping the item with the highest quantity.
 * If the same item exists in both carts, the quantities are combined.
 */
export function mergeCarts(
  localCart: CartItem[],
  serverCart: CartItem[]
): CartItem[] {
  // Create a map of local cart items for easy lookup
  const localCartMap = new Map<string, CartItem>();
  localCart.forEach(item => {
    localCartMap.set(item.id, item);
  });

  // Create a merged cart
  const mergedCart: CartItem[] = [];

  // First, add all server items
  serverCart.forEach(serverItem => {
    const localItem = localCartMap.get(serverItem.id);

    if (localItem) {
      // Item exists in both carts - use the higher quantity (avoid doubling)
      // This prevents duplication when syncing between local and server
      mergedCart.push({
        ...serverItem,
        quantity: Math.max(serverItem.quantity, localItem.quantity),
      });

      // Remove from local map to mark as processed
      localCartMap.delete(serverItem.id);
    } else {
      // Item only exists in server cart
      mergedCart.push(serverItem);
    }
  });

  // Add remaining local items (ones that didn't exist in server cart)
  localCartMap.forEach(localItem => {
    mergedCart.push(localItem);
  });

  return mergedCart;
}

/**
 * Compare server and local carts to determine if merging is needed.
 * Returns true if the carts are different and need to be merged.
 */
export function needsMerging(
  localCart: CartItem[],
  serverCart: CartItem[]
): boolean {
  if (localCart.length === 0 && serverCart.length === 0) {
    return false;
  }

  if (localCart.length !== serverCart.length) {
    return true;
  }

  // Create maps of items by ID for both carts
  const localItemsMap = new Map(localCart.map(item => [item.id, item]));
  const serverItemsMap = new Map(serverCart.map(item => [item.id, item]));

  // Check if all items match between carts
  for (const [id, localItem] of localItemsMap.entries()) {
    const serverItem = serverItemsMap.get(id);

    if (!serverItem) {
      return true; // Item in local but not in server
    }

    if (localItem.quantity !== serverItem.quantity) {
      return true; // Different quantities
    }
  }

  // Check if any server items aren't in local
  for (const id of serverItemsMap.keys()) {
    if (!localItemsMap.has(id)) {
      return true; // Item in server but not in local
    }
  }

  return false; // Carts are identical
}
