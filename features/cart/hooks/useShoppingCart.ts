import { useCart } from "../context/CartContext";
import type { CartItem } from "../context/CartContext";

/**
 * Custom hook for accessing and manipulating the shopping cart
 * This is a convenience wrapper around the CartContext
 */
export function useShoppingCart() {
  const cart = useCart();

  return {
    items: cart.cartItems,
    addItem: cart.addToCart,
    removeItem: cart.removeFromCart,
    updateItemQuantity: cart.updateQuantity,
    clearCart: cart.clearCart,
    getTotal: cart.getCartTotal,
    getCount: cart.getItemCount,
    isEmpty: cart.cartItems.length === 0,
    getItem: (itemId: string) =>
      cart.cartItems.find(item => item.id === itemId),
    isLoading: cart.isLoading,
    syncWithServer: cart.syncWithServer,
  };
}

// Re-export the useCart hook for convenience
export { useCart };

export type { CartItem };
