// Re-export components
export { CartProvider } from "./context/CartContext";
export { default as CartProviderWrapper } from "./components/CartProviderWrapper";
export { CartButton } from "./components/CartButton";
export { CartIcon } from "./components/CartIcon";
export { MiniCart } from "./components/MiniCart";
export { CheckoutTransition } from "./components/CheckoutTransition";

// Re-export contexts and hooks
export { useCart, useShoppingCart } from "./context/CartContext";
export {
  CheckoutTransitionProvider,
  useCheckoutTransition,
} from "./context/CheckoutTransitionContext";

// Re-export types
export type { CartItem } from "./context/CartContext";

// Re-export API functions
export {
  fetchCart,
  saveCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
} from "./lib/cartApi";
