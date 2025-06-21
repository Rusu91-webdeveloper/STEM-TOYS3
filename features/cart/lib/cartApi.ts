import type { CartItem } from "../context/CartContext";

/**
 * API functions for interacting with the cart backend
 */

// Default timeout for API requests (10 seconds)
const API_TIMEOUT_MS = 10000;

/**
 * Fetch the user's cart from the server
 */
export async function fetchCart(): Promise<CartItem[]> {
  try {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch("/api/cart", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    // Clear the timeout since the request completed
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch cart: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    // Handle abort/timeout specifically
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("Cart fetch request timed out after", API_TIMEOUT_MS, "ms");
      return []; // Return empty cart on timeout
    }

    console.error("Error fetching cart:", error);
    return [];
  }
}

/**
 * Save the entire cart to the server
 */
export async function saveCart(items: CartItem[]): Promise<boolean> {
  try {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(items),
      signal: controller.signal,
    });

    // Clear the timeout since the request completed
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to save cart: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    // Handle abort/timeout specifically
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("Cart save request timed out after", API_TIMEOUT_MS, "ms");
      return false;
    }

    console.error("Error saving cart:", error);
    return false;
  }
}

/**
 * Add a single item to the cart
 */
export async function addItemToCart(
  item: Omit<CartItem, "id">
): Promise<CartItem | null> {
  try {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch("/api/cart/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
      signal: controller.signal,
    });

    // Clear the timeout since the request completed
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to add item to cart: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    // Handle abort/timeout specifically
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("Add item request timed out after", API_TIMEOUT_MS, "ms");
      return null;
    }

    console.error("Error adding item to cart:", error);
    return null;
  }
}

/**
 * Update the quantity of an item in the cart
 */
export async function updateCartItemQuantity(
  itemId: string,
  quantity: number
): Promise<boolean> {
  try {
    console.log(`Updating item ${itemId} to quantity ${quantity}`);
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(`/api/cart/items/${itemId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity }),
      signal: controller.signal,
    });

    // Clear the timeout since the request completed
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Error updating item quantity: ${response.statusText}`);
      // For non-fatal errors, we'll return false but not throw
      // This allows the UI to continue working even if the server update fails
      return false;
    }

    const result = await response.json();
    console.log(`Update result:`, result);
    return true;
  } catch (error) {
    // Handle abort/timeout specifically
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error(
        "Update item request timed out after",
        API_TIMEOUT_MS,
        "ms"
      );
      return false;
    }

    console.error("Error updating item quantity:", error);
    // Return false instead of throwing to prevent UI disruption
    return false;
  }
}

/**
 * Remove an item from the cart
 */
export async function removeCartItem(itemId: string): Promise<boolean> {
  try {
    console.log(`Removing item ${itemId} from cart`);
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(`/api/cart/items/${itemId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    // Clear the timeout since the request completed
    clearTimeout(timeoutId);

    // Even if the server returns Not Found, we consider it a success
    // because the item is not in the cart, which is the desired end state
    if (!response.ok && response.status !== 404) {
      console.warn(`Server error removing item: ${response.statusText}`);
      // Return false but don't throw for non-fatal errors
      return false;
    }

    const result = await response.json();
    console.log(`Remove result:`, result);
    return true;
  } catch (error) {
    // Handle abort/timeout specifically
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error(
        "Remove item request timed out after",
        API_TIMEOUT_MS,
        "ms"
      );
      return false;
    }

    console.error("Error removing item from cart:", error);
    // Return false instead of throwing to prevent UI disruption
    return false;
  }
}
