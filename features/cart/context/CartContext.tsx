"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

import { useOptimizedSession } from "@/lib/auth/SessionContext";

import {
  fetchCart,
  saveCart,
  updateCartItemQuantity,
  removeCartItem,
  addItemToCart,
} from "../lib/cartApi";
import { debugCartState } from "../lib/cartSync";

// Define a specific type for CartItem based on our product structure
export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  isBook?: boolean;
  selectedLanguage?: string; // Language code for books (e.g., 'en', 'ro')
  slug?: string; // Add slug for MiniCart stock fetch
}

interface CartContextType {
  items: CartItem[]; // Updated to match MiniCart usage
  addToCart: (item: Omit<CartItem, "id">, quantity?: number) => void;
  removeItem: (
    itemId: string,
    variantId?: string,
    selectedLanguage?: string
  ) => void; // Updated signature
  updateItemQuantity: (
    itemId: string,
    quantity: number,
    variantId?: string,
    selectedLanguage?: string
  ) => void; // Updated signature
  clearCart: () => void;
  getTotal: () => number; // Updated to match MiniCart usage
  getItemCount: () => number;
  isLoading: boolean;
  isEmpty: boolean; // Added for MiniCart
  syncWithServer: () => Promise<void>;
  forceSyncWithServer: () => Promise<void>; // Force full synchronization
  loadCart: () => Promise<void>;

  // Bulk operations
  selectedItems: Set<string>;
  toggleItemSelection: (itemId: string) => void;
  selectAllItems: () => void;
  clearSelection: () => void;
  removeSelectedItems: () => void;
  updateSelectedItemsQuantity: (quantity: number) => void;
  moveSelectedToSavedForLater: () => void;
  savedForLaterItems: CartItem[];
  moveFromSavedForLater: (itemId: string) => void;
  removeSavedForLaterItem: (itemId: string) => void;
  clearSavedForLater: () => void;

  // For CartDrawer
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  cartCount: number;

  // Legacy aliases for backward compatibility
  cartItems: CartItem[];
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

// Export alias for MiniCart compatibility
export const useShoppingCart = useCart;

interface CartProviderProps {
  children: ReactNode;
}

// Helper function to create a unique ID for cart items
const getCartItemId = (
  productId: string,
  variantId?: string,
  selectedLanguage?: string
) => {
  let id = productId;
  if (variantId) {
    id += `_${variantId}`;
  }
  if (selectedLanguage) {
    id += `_${selectedLanguage}`;
  }
  return id;
};

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Changed from true to false for faster initial render
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [savedForLaterItems, setSavedForLaterItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false); // Add state for drawer
  const { status } = useOptimizedSession();
  const isAuthenticated = status === "authenticated";

  // Ref to track if a cart load is in progress to prevent loops
  const loadingInProgress = React.useRef(false);

  // Move loadCart outside useEffect so it can be exposed
  const loadCart = React.useCallback(async () => {
    if (status === "loading" || loadingInProgress.current) {
      return;
    }
    loadingInProgress.current = true;
    setIsLoading(true);
    try {
      const serverCart = await fetchCart();
      setCartItems(serverCart);
      debugCartState(serverCart, "Cart loaded from server");
    } catch (error) {
      console.error("❌ Failed to load cart from server:", error);
      setCartItems([]);
    } finally {
      setIsLoading(false);
      loadingInProgress.current = false;
    }
  }, [status]);

  // Load cart on initial mount and when auth state changes
  useEffect(() => {
    // Only load cart if authenticated, otherwise keep empty cart for faster loading
    if (isAuthenticated) {
      loadCart();
    } else {
      // For unauthenticated users, set loading to false immediately
      setIsLoading(false);
    }
  }, [isAuthenticated, status, loadCart]);

  // Sync cart with server (simplified)
  const syncWithServer = async () => {
    try {
      if (cartItems.length > 0) {
        await saveCart(cartItems);
      }
    } catch (error) {
      console.error("Failed to sync cart with server:", error);
    }
  };

  // Track sync operations to prevent infinite loops
  const syncInProgress = React.useRef(false);

  // Force full synchronization with server
  const forceSyncWithServer = React.useCallback(async () => {
    // Prevent multiple simultaneous sync operations
    if (syncInProgress.current) {
      return;
    }

    try {
      syncInProgress.current = true;
      setIsLoading(true);

      // Fetch server cart
      const serverCart = await fetchCart();

      debugCartState(serverCart, "Server Cart Fetched");
      debugCartState(cartItems, "Current Client Cart");

      // Smart sync logic: preserve client cart if server is empty
      if (serverCart.length === 0 && cartItems.length > 0) {
        console.warn(
          "🔄 [FORCE SYNC] Server cart is empty but client has items. Syncing client to server..."
        );

        // Save client cart to server
        const saveSuccess = await saveCart(cartItems);
        if (saveSuccess) {
          console.warn(
            "✅ [FORCE SYNC] Successfully synced client cart to server"
          );
          // Keep current client cart as it's now synced
          debugCartState(cartItems, "After Sync to Server");
        } else {
          console.error("❌ [FORCE SYNC] Failed to sync client cart to server");
          // Keep client cart anyway - don't lose user's items
          debugCartState(cartItems, "Keeping Client Cart Due to Sync Failure");
        }
      } else if (serverCart.length > 0 && cartItems.length === 0) {
        console.warn(
          "🔄 [FORCE SYNC] Client cart is empty but server has items. Using server cart..."
        );

        // Use server cart
        setCartItems(serverCart);
        debugCartState(serverCart, "After Using Server Cart");
      } else if (serverCart.length > 0 && cartItems.length > 0) {
        console.warn(
          "🔄 [FORCE SYNC] Both client and server have items. Merging intelligently..."
        );

        // Both have items - merge them intelligently
        const { mergeCarts } = await import("../lib/cartMerge");
        const mergedCart = mergeCarts(cartItems, serverCart);

        // Save merged cart to server
        const saveSuccess = await saveCart(mergedCart);
        if (saveSuccess) {
          setCartItems(mergedCart);
          console.warn("✅ [FORCE SYNC] Successfully merged and synced carts");
          debugCartState(mergedCart, "After Intelligent Merge");
        } else {
          // If merge save failed, prefer client cart (user's current session)
          console.error(
            "❌ [FORCE SYNC] Failed to save merged cart, keeping client cart"
          );
          debugCartState(
            cartItems,
            "Keeping Client Cart Due to Merge Save Failure"
          );
        }
      } else {
        // Both are empty - check if we can restore from localStorage as last resort
        if (typeof window !== "undefined") {
          try {
            const { loadCartFromStorage } = await import("../lib/cartStorage");
            const storageCart = loadCartFromStorage();

            if (storageCart && storageCart.length > 0) {
              console.warn(
                "🔄 [FORCE SYNC] Both carts empty, but found items in localStorage. Restoring..."
              );
              setCartItems(storageCart);
              // Try to save restored cart to server
              await saveCart(storageCart);
              debugCartState(storageCart, "Restored from localStorage");
            } else {
              console.warn(
                "ℹ️ [FORCE SYNC] Both client and server carts are empty, no localStorage backup"
              );
              setCartItems([]);
              debugCartState([], "Both Carts Empty");
            }
          } catch (storageError) {
            console.error(
              "❌ [FORCE SYNC] Failed to restore from localStorage:",
              storageError
            );
            setCartItems([]);
            debugCartState([], "Both Carts Empty - Storage Restore Failed");
          }
        } else {
          console.warn(
            "ℹ️ [FORCE SYNC] Both client and server carts are empty"
          );
          setCartItems([]);
          debugCartState([], "Both Carts Empty");
        }
      }
    } catch (error) {
      console.error(
        "❌ [FORCE SYNC] Failed to force sync cart with server:",
        error
      );
      // On error, keep the current client cart - don't lose user's items
      debugCartState(cartItems, "Keeping Client Cart Due to Sync Error");

      // As a last resort, try to restore from localStorage if current cart is empty
      if (cartItems.length === 0 && typeof window !== "undefined") {
        try {
          const { loadCartFromStorage } = await import("../lib/cartStorage");
          const storageCart = loadCartFromStorage();

          if (storageCart && storageCart.length > 0) {
            console.warn(
              "🔄 [FORCE SYNC] Emergency restore from localStorage after sync error"
            );
            setCartItems(storageCart);
            debugCartState(storageCart, "Emergency Restore from localStorage");
          }
        } catch (storageError) {
          console.error(
            "❌ [FORCE SYNC] Emergency localStorage restore also failed:",
            storageError
          );
        }
      }
    } finally {
      setIsLoading(false);
      syncInProgress.current = false;
    }
  }, [cartItems]); // Add cartItems as dependency so we can access current state

  const addToCart = async (
    itemToAdd: Omit<CartItem, "id">,
    quantity: number = 1
  ) => {
    const cartItemId = getCartItemId(
      itemToAdd.productId,
      itemToAdd.variantId,
      itemToAdd.selectedLanguage
    );

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === cartItemId);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      // Include slug if present
      return [
        ...prevItems,
        { ...itemToAdd, id: cartItemId, quantity, slug: itemToAdd.slug },
      ];
    });

    // Try to sync with server in the background
    try {
      if (itemToAdd.variantId) {
        // For items with variants, handle the server update asynchronously
        const existingItem = cartItems.find(item => item.id === cartItemId);
        if (existingItem) {
          await updateCartItemQuantity(
            cartItemId,
            existingItem.quantity + quantity
          );
        } else {
          await addItemToCart(itemToAdd);
        }
      }
    } catch (error) {
      console.error("Failed to sync item addition with server:", error);
    }
  };

  const removeItem = async (
    itemId: string,
    variantId?: string,
    selectedLanguage?: string
  ) => {
    // Generate the actual cart item ID if needed
    const cartItemId =
      variantId || selectedLanguage
        ? getCartItemId(itemId, variantId, selectedLanguage)
        : itemId;

    // First update the UI immediately
    setCartItems(prevItems => prevItems.filter(item => item.id !== cartItemId));

    // Then try to sync with server in the background
    try {
      await removeCartItem(cartItemId);
    } catch (error) {
      console.error("Error removing item from cart:", error);
      // Don't revert the UI, just log the error
    }
  };

  const removeFromCart = (itemId: string) => removeItem(itemId);

  const updateItemQuantity = async (
    itemId: string,
    quantity: number,
    variantId?: string,
    selectedLanguage?: string
  ) => {
    // Generate the actual cart item ID if needed
    const cartItemId =
      variantId || selectedLanguage
        ? getCartItemId(itemId, variantId, selectedLanguage)
        : itemId;

    // First update the UI immediately
    setCartItems(
      prevItems =>
        prevItems
          .map(
            item =>
              item.id === cartItemId
                ? { ...item, quantity: Math.max(0, quantity) }
                : item // Prevent negative quantity
          )
          .filter(item => item.quantity > 0) // Remove item if quantity is 0
    );

    // Then try to sync with server in the background
    try {
      if (quantity > 0) {
        await updateCartItemQuantity(cartItemId, quantity);
      } else {
        await removeCartItem(cartItemId);
      }
    } catch (error) {
      console.error("Error updating item quantity:", error);
    }
  };

  const updateQuantity = (itemId: string, quantity: number) =>
    updateItemQuantity(itemId, quantity);

  const clearCart = async () => {
    setCartItems([]);

    // Try to sync with server in the background
    try {
      await saveCart([]);
    } catch (error) {
      console.error("Failed to clear cart on server:", error);
    }
  };

  const getTotal = () =>
    cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const getCartTotal = () => getTotal();

  const getItemCount = () =>
    cartItems.reduce((count, item) => count + item.quantity, 0);

  const cartCount = getItemCount(); // Calculate cart count

  const isEmpty = cartItems.length === 0;

  // Bulk operations
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAllItems = () => {
    setSelectedItems(new Set(cartItems.map(item => item.id)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const removeSelectedItems = async () => {
    const itemsToRemove = Array.from(selectedItems);

    // Update UI immediately
    setCartItems(prev => prev.filter(item => !selectedItems.has(item.id)));
    clearSelection();

    // Sync with server in background
    for (const itemId of itemsToRemove) {
      try {
        await removeCartItem(itemId);
      } catch (error) {
        console.error(`Failed to remove item ${itemId} from server:`, error);
      }
    }
  };

  const updateSelectedItemsQuantity = async (quantity: number) => {
    const itemsToUpdate = cartItems.filter(item => selectedItems.has(item.id));

    if (quantity <= 0) {
      // Remove items if quantity is 0 or negative
      await removeSelectedItems();
      return;
    }

    // Update UI immediately
    setCartItems(prev =>
      prev.map(item =>
        selectedItems.has(item.id) ? { ...item, quantity } : item
      )
    );

    // Sync with server in background
    for (const item of itemsToUpdate) {
      try {
        await updateCartItemQuantity(item.id, quantity);
      } catch (error) {
        console.error(`Failed to update quantity for item ${item.id}:`, error);
      }
    }
  };

  const moveSelectedToSavedForLater = () => {
    const itemsToMove = cartItems.filter(item => selectedItems.has(item.id));

    // Add to saved for later (in memory only)
    setSavedForLaterItems(prev => {
      const existingIds = new Set(prev.map(item => item.id));
      const newItems = itemsToMove.filter(item => !existingIds.has(item.id));
      return [...prev, ...newItems];
    });

    // Remove from cart
    setCartItems(prev => prev.filter(item => !selectedItems.has(item.id)));
    clearSelection();

    console.warn("📦 Moved selected items to saved for later (ephemeral)");
  };

  const moveFromSavedForLater = (itemId: string) => {
    const itemToMove = savedForLaterItems.find(item => item.id === itemId);
    if (itemToMove) {
      setCartItems(prev => [...prev, itemToMove]);
      setSavedForLaterItems(prev => prev.filter(item => item.id !== itemId));
      console.warn("📦 Moved item from saved for later to cart (ephemeral)");
    }
  };

  const removeSavedForLaterItem = (itemId: string) => {
    setSavedForLaterItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearSavedForLater = () => {
    setSavedForLaterItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items: cartItems,
        addToCart,
        removeItem,
        updateItemQuantity,
        clearCart,
        getTotal,
        getItemCount,
        isLoading,
        isEmpty,
        syncWithServer,
        forceSyncWithServer,
        loadCart,
        selectedItems,
        toggleItemSelection,
        selectAllItems,
        clearSelection,
        removeSelectedItems,
        updateSelectedItemsQuantity,
        moveSelectedToSavedForLater,
        savedForLaterItems,
        moveFromSavedForLater,
        removeSavedForLaterItem,
        clearSavedForLater,
        isCartOpen,
        setIsCartOpen,
        cartCount,
        cartItems,
        removeFromCart,
        updateQuantity,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
