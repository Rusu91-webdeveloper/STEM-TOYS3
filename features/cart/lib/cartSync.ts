/**
 * Cart Synchronization Utilities
 * Handles cart state consistency between client storage, server cache, and UI
 */

import type { CartItem } from "../context/CartContext";
import { fetchCart, saveCart } from "./cartApi";

// Throttling mechanism to prevent rapid sync calls
let lastSyncTime = 0;
const SYNC_THROTTLE_MS = 2000; // 2 seconds minimum between sync calls

export interface CartSyncResult {
  items: CartItem[];
  hadChanges: boolean;
  errors: string[];
}

/**
 * Compare two cart item arrays to detect differences
 */
function compareCartItems(
  clientItems: CartItem[],
  serverItems: CartItem[]
): boolean {
  if (clientItems.length !== serverItems.length) {
    return false;
  }

  // Create maps for easier comparison
  const clientMap = new Map(clientItems.map(item => [item.id, item]));
  const serverMap = new Map(serverItems.map(item => [item.id, item]));

  // Check if all client items exist in server with same quantities
  for (const [id, clientItem] of clientMap) {
    const serverItem = serverMap.get(id);
    if (!serverItem || serverItem.quantity !== clientItem.quantity) {
      return false;
    }
  }

  return true;
}

/**
 * Synchronize cart between client and server
 * Returns the canonical cart state
 */
export async function synchronizeCart(
  clientItems: CartItem[],
  forceServerSync: boolean = false
): Promise<CartSyncResult> {
  const result: CartSyncResult = {
    items: clientItems,
    hadChanges: false,
    errors: [],
  };

  // Throttle sync calls to prevent server overload
  const now = Date.now();
  if (!forceServerSync && now - lastSyncTime < SYNC_THROTTLE_MS) {
    console.log(
      `🛡️ Sync throttled, ${SYNC_THROTTLE_MS - (now - lastSyncTime)}ms remaining`
    );
    return result;
  }
  lastSyncTime = now;

  try {
    // Fetch server cart
    const serverItems = await fetchCart();

    // If forcing server sync or client is empty, use server state
    if (forceServerSync || clientItems.length === 0) {
      if (serverItems.length > 0) {
        result.items = serverItems;
        result.hadChanges = clientItems.length !== serverItems.length;
      }
      return result;
    }

    // If server is empty but client has items, sync client to server
    if (serverItems.length === 0 && clientItems.length > 0) {
      const syncSuccess = await saveCart(clientItems);
      if (!syncSuccess) {
        result.errors.push("Failed to sync client cart to server");
      }
      return result;
    }

    // Compare carts for differences
    const cartsMatch = compareCartItems(clientItems, serverItems);

    if (!cartsMatch) {
      console.log("Cart mismatch detected:", {
        clientCount: clientItems.length,
        serverCount: serverItems.length,
        clientItems: clientItems.map(item => ({
          id: item.id,
          qty: item.quantity,
        })),
        serverItems: serverItems.map(item => ({
          id: item.id,
          qty: item.quantity,
        })),
      });

      // Merge carts intelligently
      const mergedItems = mergeCartItems(clientItems, serverItems);

      // Save merged cart to server
      const syncSuccess = await saveCart(mergedItems);
      if (syncSuccess) {
        result.items = mergedItems;
        result.hadChanges = true;
      } else {
        result.errors.push("Failed to save merged cart to server");
        // Fall back to server items if merge save failed
        result.items = serverItems;
        result.hadChanges = true;
      }
    }
  } catch (error) {
    console.error("Cart synchronization error:", error);
    result.errors.push(
      `Sync error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  return result;
}

/**
 * Merge two cart item arrays intelligently
 * Priority: client items for quantities, server items for existence
 */
function mergeCartItems(
  clientItems: CartItem[],
  serverItems: CartItem[]
): CartItem[] {
  const merged = new Map<string, CartItem>();

  // Add all server items first
  serverItems.forEach(item => {
    merged.set(item.id, { ...item });
  });

  // Update with client items (quantities take precedence)
  clientItems.forEach(clientItem => {
    const existing = merged.get(clientItem.id);
    if (existing) {
      // Use client quantity if the item exists in both
      merged.set(clientItem.id, {
        ...existing,
        quantity: clientItem.quantity,
        // Update other potentially changed fields from client
        selectedLanguage:
          clientItem.selectedLanguage || existing.selectedLanguage,
      });
    } else {
      // Add client-only items
      merged.set(clientItem.id, { ...clientItem });
    }
  });

  return Array.from(merged.values()).filter(item => item.quantity > 0);
}

/**
 * Clean up invalid cart items (deleted products, inactive items, etc.)
 */
export async function cleanupCart(items: CartItem[]): Promise<CartItem[]> {
  const validItems: CartItem[] = [];

  for (const item of items) {
    try {
      // Check if the item is valid by trying to fetch its details
      const response = await fetch(`/api/products/${item.productId}`);
      if (response.ok) {
        const productData = await response.json();
        if (productData.isActive) {
          validItems.push(item);
        } else {
          console.log(`Removing inactive product from cart: ${item.name}`);
        }
      } else {
        console.log(`Removing non-existent product from cart: ${item.name}`);
      }
    } catch (error) {
      console.error(`Error validating cart item ${item.id}:`, error);
      // Keep the item if we can't validate it (network issues, etc.)
      validItems.push(item);
    }
  }

  return validItems;
}

/**
 * Force a complete cart refresh from server
 */
export async function refreshCartFromServer(): Promise<CartItem[]> {
  try {
    const serverItems = await fetchCart();

    // Update localStorage to match server
    if (typeof window !== "undefined") {
      localStorage.setItem("nextcommerce_cart", JSON.stringify(serverItems));
    }

    return serverItems;
  } catch (error) {
    console.error("Failed to refresh cart from server:", error);
    return [];
  }
}

/**
 * Debug utility to log cart state
 */
export function debugCartState(
  clientItems: CartItem[],
  label: string = "Cart"
): void {
  if (process.env.NODE_ENV === "development") {
    console.group(`🛒 ${label} Debug Info`);
    console.log("Item count:", clientItems.length);
    console.log(
      "Total items:",
      clientItems.reduce((sum, item) => sum + item.quantity, 0)
    );
    console.log(
      "Items:",
      clientItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        isBook: item.isBook,
        language: item.selectedLanguage,
      }))
    );
    console.groupEnd();
  }
}
