"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import {
  fetchCart,
  saveCart,
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

const getCartItemId = (
  productId: string,
  variantId?: string,
  selectedLanguage?: string
) => {
  if (variantId) {
    return `${productId}_${variantId}`;
  }
  if (selectedLanguage) {
    return `${productId}_${selectedLanguage}`;
  }
  return productId;
};

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [savedForLaterItems, setSavedForLaterItems] = useState<CartItem[]>([]);

  // Debouncing and batching for cart updates
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Set<string>>(new Set());
  const isInCheckoutRef = useRef(false);

  // Check if we're in checkout to prevent unnecessary syncs
  useEffect(() => {
    if (typeof window !== "undefined") {
      isInCheckoutRef.current =
        window.location.pathname.startsWith("/checkout");
    }
  }, []);

  // Debounced sync function to batch multiple updates
  const debouncedSync = React.useCallback(async () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      if (pendingUpdatesRef.current.size > 0 && !isInCheckoutRef.current) {
        try {
          await saveCart(cartItems);
          pendingUpdatesRef.current.clear();
        } catch (error) {
          console.error("Failed to sync cart with server:", error);
        }
      }
    }, 1000); // 1 second debounce
  }, [cartItems]);

  // Sync cart with server (simplified)
  const syncWithServer = async () => {
    try {
      if (cartItems.length > 0 && !isInCheckoutRef.current) {
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
                "ℹ️ [FORCE SYNC] All cart sources are empty - this is normal for new users"
              );
            }
          } catch (error) {
            console.error(
              "❌ [FORCE SYNC] Failed to restore from localStorage:",
              error
            );
          }
        }
      }
    } catch (error) {
      console.error("❌ [FORCE SYNC] Failed to sync with server:", error);
    } finally {
      syncInProgress.current = false;
      setIsLoading(false);
    }
  }, [cartItems]);

  // Load cart from server on mount
  const loadCart = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const serverCart = await fetchCart();
      setCartItems(serverCart);
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load cart when session changes
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addToCart = (
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

    // Add to pending updates and trigger debounced sync
    pendingUpdatesRef.current.add(cartItemId);
    debouncedSync();
  };

  const removeItem = (
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

    // Add to pending updates and trigger debounced sync
    pendingUpdatesRef.current.add(cartItemId);
    debouncedSync();
  };

  const removeFromCart = (itemId: string) => removeItem(itemId);

  const updateItemQuantity = (
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

    // Add to pending updates and trigger debounced sync
    pendingUpdatesRef.current.add(cartItemId);
    debouncedSync();
  };

  const updateQuantity = (itemId: string, quantity: number) =>
    updateItemQuantity(itemId, quantity);

  const clearCart = () => {
    setCartItems([]);
    setSelectedItems(new Set());
    
    // Clear pending updates and sync immediately
    pendingUpdatesRef.current.clear();
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    try {
      saveCart([]);
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  };

  const getTotal = () =>
    cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const getCartTotal = () => getTotal();

  const getItemCount = () =>
    cartItems.reduce((count, item) => count + item.quantity, 0);

  const cartCount = getItemCount();
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

  const removeSelectedItems = () => {
    const itemsToRemove = Array.from(selectedItems);
    setCartItems(prevItems =>
      prevItems.filter(item => !itemsToRemove.includes(item.id))
    );
    setSelectedItems(new Set());
    
    // Add to pending updates and trigger debounced sync
    itemsToRemove.forEach(itemId => pendingUpdatesRef.current.add(itemId));
    debouncedSync();
  };

  const updateSelectedItemsQuantity = (quantity: number) => {
    const itemsToUpdate = Array.from(selectedItems);
    setCartItems(prevItems =>
      prevItems.map(item =>
        itemsToUpdate.includes(item.id)
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      )
    );
    
    // Add to pending updates and trigger debounced sync
    itemsToUpdate.forEach(itemId => pendingUpdatesRef.current.add(itemId));
    debouncedSync();
  };

  const moveSelectedToSavedForLater = () => {
    const itemsToMove = cartItems.filter(item => selectedItems.has(item.id));
    setSavedForLaterItems(prev => [...prev, ...itemsToMove]);
    setCartItems(prevItems =>
      prevItems.filter(item => !selectedItems.has(item.id))
    );
    setSelectedItems(new Set());
    
    // Add to pending updates and trigger debounced sync
    itemsToMove.forEach(item => pendingUpdatesRef.current.add(item.id));
    debouncedSync();
  };

  const moveFromSavedForLater = (itemId: string) => {
    const itemToMove = savedForLaterItems.find(item => item.id === itemId);
    if (itemToMove) {
      setCartItems(prev => [...prev, itemToMove]);
      setSavedForLaterItems(prev =>
        prev.filter(item => item.id !== itemId)
      );
      
      // Add to pending updates and trigger debounced sync
      pendingUpdatesRef.current.add(itemId);
      debouncedSync();
    }
  };

  const removeSavedForLaterItem = (itemId: string) => {
    setSavedForLaterItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearSavedForLater = () => {
    setSavedForLaterItems([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const value: CartContextType = {
    items: cartItems,
    cartItems, // Legacy alias
    addToCart,
    removeItem,
    removeFromCart, // Legacy alias
    updateItemQuantity,
    updateQuantity, // Legacy alias
    clearCart,
    getTotal,
    getCartTotal, // Legacy alias
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
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
