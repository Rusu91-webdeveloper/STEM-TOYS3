"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  fetchCart,
  saveCart,
  updateCartItemQuantity,
  removeCartItem,
  addItemToCart,
} from "../lib/cartApi";
import { mergeCarts, needsMerging } from "../lib/cartMerge";
import { useSession } from "next-auth/react";

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

  // Legacy aliases for backward compatibility
  cartItems: CartItem[];
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [savedForLaterItems, setSavedForLaterItems] = useState<CartItem[]>([]);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const previousAuthState = React.useRef(isAuthenticated);
  const initialLoadComplete = React.useRef(false);
  const serverFetchTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Load cart with smart persistence logic
  useEffect(() => {
    // Only load from storage on first render
    if (!initialLoadComplete.current && typeof window !== "undefined") {
      // Import storage functions dynamically to avoid SSR issues
      import("../lib/cartStorage")
        .then(({ loadCartFromStorage, clearExpiredCarts }) => {
          // Clear any expired carts first
          clearExpiredCarts();

          // Load cart using smart logic
          const items = loadCartFromStorage();
          if (items.length > 0) {
            setCartItems(items);
          }

          // Mark initial load as complete
          initialLoadComplete.current = true;
        })
        .catch(error => {
          console.error("Failed to load cart storage:", error);
          // Fallback to old localStorage behavior
          const storedCart = localStorage.getItem("nextcommerce_cart");
          if (storedCart) {
            try {
              const localCart = JSON.parse(storedCart);
              setCartItems(localCart);
            } catch (error) {
              console.error("Failed to parse cart from localStorage:", error);
              localStorage.removeItem("nextcommerce_cart");
            }
          }
          initialLoadComplete.current = true;
        });
    }
  }, []);

  // Effect to handle auth state changes and cart merging
  useEffect(() => {
    // Skip if auth is still loading
    if (status === "loading") return;

    const handleAuthStateChange = async () => {
      try {
        // Check if auth state has changed
        if (previousAuthState.current !== isAuthenticated) {
          previousAuthState.current = isAuthenticated;

          if (isAuthenticated) {
            // User has logged in, we need to merge the carts
            // Don't block UI while merging, do it in background
            mergeCartsOnLogin().catch(error => {
              console.error("Error merging carts on login:", error);
            });
          }
        } else if (isAuthenticated && initialLoadComplete.current) {
          // Fetch from server in the background, without blocking the UI
          fetchCartFromServer(false).catch(error => {
            console.error("Error fetching cart from server:", error);
          });
        }
      } catch (error) {
        console.error("Error in auth state change handler:", error);
      }
    };

    // Start server fetch with a small delay to improve perceived performance
    if (serverFetchTimeout.current) {
      clearTimeout(serverFetchTimeout.current);
    }

    serverFetchTimeout.current = setTimeout(() => {
      handleAuthStateChange();
    }, 100); // Small delay to prioritize UI responsiveness

    return () => {
      // Clear timeout on cleanup
      if (serverFetchTimeout.current) {
        clearTimeout(serverFetchTimeout.current);
      }
    };
  }, [isAuthenticated, status]);

  // Function to merge local cart with server cart on login
  const mergeCartsOnLogin = async () => {
    if (!isAuthenticated) return;

    try {
      // Set loading state only if cart is empty
      if (cartItems.length === 0) {
        setIsLoading(true);
      }

      // Fetch server cart
      const serverCart = await fetchCart();

      // Check if carts need merging
      if (needsMerging(cartItems, serverCart)) {
        // Merge carts and update both local state and server
        const mergedCart = mergeCarts(cartItems, serverCart);
        setCartItems(mergedCart);
        await saveCart(mergedCart);
      } else if (serverCart.length > 0) {
        // If server cart exists but no merging needed, use server cart
        setCartItems(serverCart);
      }

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "nextcommerce_cart",
          JSON.stringify(serverCart.length > 0 ? serverCart : cartItems)
        );
      }
    } catch (error) {
      console.error("Failed to merge carts on login:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch cart from server
  const fetchCartFromServer = async (setLoadingState = true) => {
    if (setLoadingState) {
      setIsLoading(true);
    }

    try {
      // fetchCart already has its own timeout handling
      const serverCart = await fetchCart();

      // If server has items, use them
      if (serverCart.length > 0) {
        setCartItems(serverCart);

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("nextcommerce_cart", JSON.stringify(serverCart));
        }
      } else if (cartItems.length > 0) {
        // If local cart has items but server doesn't, sync to server
        await saveCart(cartItems);
      }
    } catch (error) {
      console.error("Failed to fetch cart from server:", error);
      // If the fetch fails, we still have the localStorage cart
      throw error;
    } finally {
      if (setLoadingState) {
        setIsLoading(false);
      }
    }
  };

  // Save cart using smart persistence logic
  useEffect(() => {
    if (
      initialLoadComplete.current &&
      !isLoading &&
      typeof window !== "undefined"
    ) {
      // Import storage functions dynamically
      import("../lib/cartStorage")
        .then(({ saveCartToStorage }) => {
          saveCartToStorage(cartItems);
        })
        .catch(error => {
          console.error("Failed to save cart storage:", error);
          // Fallback to old localStorage behavior
          if (
            cartItems.length > 0 ||
            localStorage.getItem("nextcommerce_cart")
          ) {
            localStorage.setItem(
              "nextcommerce_cart",
              JSON.stringify(cartItems)
            );
          }
        });
    }
  }, [cartItems, isLoading]);

  // Sync cart with server
  const syncWithServer = async () => {
    if (cartItems.length > 0) {
      try {
        await saveCart(cartItems);
      } catch (error) {
        console.error("Failed to sync cart with server:", error);
      }
    }
  };

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
      } else {
        return [...prevItems, { ...itemToAdd, id: cartItemId, quantity }];
      }
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

  // Updated removeItem function to match MiniCart signature
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
      const success = await removeCartItem(cartItemId);
      if (!success) {
        console.warn(
          `Failed to remove item ${cartItemId} from server, but removed from UI`
        );
      }
    } catch (error) {
      console.error("Error removing item from cart:", error);
      // Don't revert the UI, just log the error
    }
  };

  const removeFromCart = async (itemId: string) => {
    return removeItem(itemId);
  };

  // Updated updateItemQuantity function to match MiniCart signature
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
    if (quantity > 0) {
      try {
        const success = await updateCartItemQuantity(cartItemId, quantity);
        if (!success) {
          console.warn(
            `Failed to update quantity for item ${cartItemId}, but UI is updated`
          );
        }
      } catch (error) {
        console.error("Error updating item quantity:", error);
      }
    } else {
      try {
        const success = await removeCartItem(cartItemId);
        if (!success) {
          console.warn(
            `Failed to remove item ${cartItemId} from server, but removed from UI`
          );
        }
      } catch (error) {
        console.error("Error removing item from cart:", error);
      }
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    return updateItemQuantity(itemId, quantity);
  };

  const clearCart = async () => {
    setCartItems([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("nextcommerce_cart");
    }

    // Try to sync with server in the background
    try {
      await saveCart([]);
    } catch (error) {
      console.error("Failed to clear cart on server:", error);
    }
  };

  const getTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getCartTotal = () => {
    return getTotal();
  };

  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

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

    // Add to saved for later
    setSavedForLaterItems(prev => {
      const existingIds = new Set(prev.map(item => item.id));
      const newItems = itemsToMove.filter(item => !existingIds.has(item.id));
      return [...prev, ...newItems];
    });

    // Remove from cart
    setCartItems(prev => prev.filter(item => !selectedItems.has(item.id)));
    clearSelection();

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "nextcommerce_saved_for_later",
        JSON.stringify(savedForLaterItems)
      );
    }
  };

  const moveFromSavedForLater = (itemId: string) => {
    const itemToMove = savedForLaterItems.find(item => item.id === itemId);
    if (!itemToMove) return;

    // Add to cart
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === itemId);
      if (existingItem) {
        return prev.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + itemToMove.quantity }
            : item
        );
      } else {
        return [...prev, itemToMove];
      }
    });

    // Remove from saved for later
    setSavedForLaterItems(prev => prev.filter(item => item.id !== itemId));
  };

  const removeSavedForLaterItem = (itemId: string) => {
    setSavedForLaterItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearSavedForLater = () => {
    setSavedForLaterItems([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("nextcommerce_saved_for_later");
    }
  };

  // Load saved for later items from localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nextcommerce_saved_for_later");
      if (saved) {
        try {
          const items = JSON.parse(saved);
          setSavedForLaterItems(items);
        } catch (error) {
          console.error("Failed to parse saved for later items:", error);
          localStorage.removeItem("nextcommerce_saved_for_later");
        }
      }
    }
  }, []);

  // Save "saved for later" items to localStorage whenever they change
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "nextcommerce_saved_for_later",
        JSON.stringify(savedForLaterItems)
      );
    }
  }, [savedForLaterItems]);

  return (
    <CartContext.Provider
      value={{
        // New API for MiniCart
        items: cartItems,
        removeItem,
        updateItemQuantity,
        getTotal,
        isEmpty,

        // Bulk operations
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

        // Legacy API for backward compatibility
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getItemCount,
        isLoading,
        syncWithServer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
