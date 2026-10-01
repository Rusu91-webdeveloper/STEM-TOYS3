"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import { trackAddToCart } from "@/lib/analytics/ga4";

import { fetchCart, saveCart } from "../lib/cartApi";
import {
  reconcileLoadedCart,
  selectCartSyncPayload,
} from "../lib/cartReconcile";
import { readCartStorage, saveCartToStorage } from "../lib/cartStorage";
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

export interface AddToCartItemInput extends Omit<CartItem, "id"> {
  stockQuantity?: number;
}

interface CartContextType {
  items: CartItem[]; // Updated to match MiniCart usage
  addToCart: (item: AddToCartItemInput, quantity?: number) => void;
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
  clearCart: () => Promise<void>;
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
  const cartItemsRef = useRef<CartItem[]>([]);
  const hydratedRef = useRef(false);
  const allowEmptyPersistRef = useRef(false);
  cartItemsRef.current = cartItems;

  // Check if we're in checkout to prevent unnecessary syncs
  useEffect(() => {
    if (typeof window !== "undefined") {
      isInCheckoutRef.current =
        window.location.pathname.startsWith("/checkout");
    }
  }, []);

  // Debounced sync reads the latest cart. The closure at schedule time is
  // often still empty, and posting that [] used to wipe the server cart.
  const debouncedSync = React.useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      if (pendingUpdatesRef.current.size === 0 || isInCheckoutRef.current) {
        return;
      }

      const payload = selectCartSyncPayload(cartItemsRef.current);
      try {
        await saveCart(payload.items, { clear: payload.clear });
        pendingUpdatesRef.current.clear();
      } catch (error) {
        console.error("Failed to sync cart with server:", error);
      }
    }, 1000);
  }, []);

  const syncWithServer = async () => {
    try {
      const latest = cartItemsRef.current;
      if (latest.length > 0 && !isInCheckoutRef.current) {
        await saveCart(latest);
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

  // Load the stored cart after mount so the first client render matches SSR.
  // Reading localStorage in useLayoutEffect updated the header badge during
  // hydration and threw React error #418 whenever the cart was non-empty.
  useEffect(() => {
    const stored = readCartStorage();
    if (stored.items.length > 0) {
      cartItemsRef.current = stored.items;
      setCartItems(stored.items);
      allowEmptyPersistRef.current = true;
    } else if (stored.explicitEmpty) {
      allowEmptyPersistRef.current = true;
      cartItemsRef.current = [];
    }
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const items = cartItemsRef.current;
    if (items.length > 0) {
      allowEmptyPersistRef.current = true;
      saveCartToStorage(items);
      return;
    }

    // The first paint is empty before hydration finishes writing. Only an
    // intentional empty cart (last item removed, or clear) is stored as [].
    if (!allowEmptyPersistRef.current) return;

    saveCartToStorage([]);
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    pendingUpdatesRef.current.clear();
    void saveCart([], { clear: true });
  }, [cartItems]);

  const loadCart = React.useCallback(async () => {
    try {
      if (cartItemsRef.current.length === 0) {
        setIsLoading(true);
      }
      const serverCart = await fetchCart();
      const stored = readCartStorage();
      const localCart =
        cartItemsRef.current.length > 0 ? cartItemsRef.current : stored.items;
      const explicitEmpty =
        cartItemsRef.current.length === 0 && stored.explicitEmpty;
      const reconciled = reconcileLoadedCart(localCart, serverCart, {
        explicitEmpty,
      });
      cartItemsRef.current = reconciled.items;
      setCartItems(reconciled.items);
      if (reconciled.items.length > 0) {
        allowEmptyPersistRef.current = true;
      }
      if (reconciled.pushToServer) {
        await saveCart(reconciled.items, {
          clear: reconciled.items.length === 0,
        });
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // **PERFORMANCE**: Defer cart loading to after hydration for better TTFB
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCart();
    }, 100);

    return () => clearTimeout(timer);
  }, [loadCart]);

  const addToCart = (itemToAdd: AddToCartItemInput, quantity: number = 1) => {
    const cartItemId = getCartItemId(
      itemToAdd.productId,
      itemToAdd.variantId,
      itemToAdd.selectedLanguage
    );
    const normalizedStockQuantity =
      itemToAdd.isBook || typeof itemToAdd.stockQuantity !== "number"
        ? null
        : Math.max(0, itemToAdd.stockQuantity);
    const prevItems = cartItemsRef.current;
    const existingItem = prevItems.find(item => item.id === cartItemId);

    if (normalizedStockQuantity !== null) {
      if (normalizedStockQuantity <= 0) {
        return;
      }

      if (existingItem && existingItem.quantity >= normalizedStockQuantity) {
        return;
      }
    }

    let nextItems: CartItem[];

    if (existingItem) {
      const nextQuantity = existingItem.quantity + quantity;
      const cappedQuantity =
        normalizedStockQuantity === null
          ? nextQuantity
          : Math.min(nextQuantity, normalizedStockQuantity);

      if (cappedQuantity === existingItem.quantity) {
        return;
      }

      nextItems = prevItems.map(item =>
        item.id === cartItemId ? { ...item, quantity: cappedQuantity } : item
      );
    } else {
      const normalizedQuantity =
        normalizedStockQuantity === null
          ? quantity
          : Math.min(quantity, normalizedStockQuantity);

      if (normalizedQuantity <= 0) {
        return;
      }

      const { stockQuantity: _stockQuantity, ...cartItemData } = itemToAdd;

      nextItems = [
        ...prevItems,
        {
          ...cartItemData,
          id: cartItemId,
          quantity: normalizedQuantity,
          slug: itemToAdd.slug,
        },
      ];
    }

    // Write the ref before scheduling sync. setState has not re-rendered yet,
    // and the debounce used to post the empty cart from the previous render.
    cartItemsRef.current = nextItems;
    setCartItems(nextItems);

    const addedQuantity =
      (nextItems.find(item => item.id === cartItemId)?.quantity ?? 0) -
      (existingItem?.quantity ?? 0);
    trackAddToCart({
      item_id: itemToAdd.productId,
      item_name: itemToAdd.name,
      category: itemToAdd.isBook ? "Cărți" : "",
      price: itemToAdd.price,
      quantity: addedQuantity,
      currency: "RON",
    });

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

    const nextItems = cartItemsRef.current.filter(
      item => item.id !== cartItemId
    );
    cartItemsRef.current = nextItems;
    setCartItems(nextItems);

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

    const nextItems = cartItemsRef.current
      .map(item =>
        item.id === cartItemId
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      )
      .filter(item => item.quantity > 0);
    cartItemsRef.current = nextItems;
    setCartItems(nextItems);

    pendingUpdatesRef.current.add(cartItemId);
    debouncedSync();
  };

  const updateQuantity = (itemId: string, quantity: number) =>
    updateItemQuantity(itemId, quantity);

  const clearCart = async () => {
    allowEmptyPersistRef.current = true;
    cartItemsRef.current = [];
    setCartItems([]);
    setSelectedItems(new Set());
    saveCartToStorage([]);

    pendingUpdatesRef.current.clear();
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

    const CART_CLEAR_TIMEOUT_MS = 2500;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        saveCart([], { clear: true }),
        new Promise<boolean>(resolve => {
          timeoutId = setTimeout(() => resolve(false), CART_CLEAR_TIMEOUT_MS);
        }),
      ]);
    } catch (error) {
      console.error("Failed to clear cart:", error);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
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
      setSavedForLaterItems(prev => prev.filter(item => item.id !== itemId));

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
  useEffect(
    () => () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    },
    []
  );

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
