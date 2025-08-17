import { useCart } from "../context/CartContext";
import type { CartItem } from "../context/CartContext";

/**
 * Custom hook for accessing and manipulating the shopping cart
 * This is a convenience wrapper around the CartContext
 */
export function useShoppingCart() {
  const cart = useCart();

  return {
    /**
     * All items currently in the cart
     */
    items: cart.cartItems,

    /**
     * Add a product to the cart
     */
    addItem: cart.addToCart,

    /**
     * Remove an item from the cart
     */
    removeItem: cart.removeFromCart,

    /**
     * Update the quantity of an item in the cart
     */
    updateItemQuantity: cart.updateQuantity,

    /**
     * Clear all items from the cart
     */
    clearCart: cart.clearCart,

    /**
     * Get the total price of all items in the cart
     */
    getTotal: cart.getCartTotal,

    /**
     * Get the total number of items in the cart
     */
    getCount: cart.getItemCount,

    /**
     * Check if the cart is empty
     */
    isEmpty: cart.cartItems.length === 0,

    /**
     * Get a specific item from the cart by its ID
     */
    getItem: (itemId: string) =>
      cart.cartItems.find(item => item.id === itemId),

    /**
     * Whether the cart is currently loading
     */
    isLoading: cart.isLoading,

    /**
     * Manually sync the cart with the server
     */
    syncWithServer: cart.syncWithServer,
  };
}

// Re-export the useCart hook for convenience
export { useCart };

export type { CartItem };
