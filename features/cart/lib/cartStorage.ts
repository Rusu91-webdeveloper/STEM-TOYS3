/**
 * Enhanced Cart Storage Management with Smart Persistence
 * Provides user control over cart persistence and better UX
 */

export interface CartStoragePreferences {
  persistenceMode: "session" | "persistent" | "smart" | "disabled";
  autoExpiry: number; // Hours until cart expires
  clearOnCheckout: boolean;
  clearOnLogout: boolean;
}

export interface CartStorageData {
  items: any[];
  timestamp: number;
  lastAccess: number;
  sessionId: string;
  preferences: CartStoragePreferences;
}

const STORAGE_KEY = "nextcommerce_cart";
const PREFERENCES_KEY = "nextcommerce_cart_preferences";
const SESSION_KEY = "nextcommerce_session_id";

// Default preferences for better UX
const DEFAULT_PREFERENCES: CartStoragePreferences = {
  persistenceMode: "smart", // Smart mode by default
  autoExpiry: 24, // 24 hours
  clearOnCheckout: true,
  clearOnLogout: false,
};

/**
 * Generate or get session ID
 */
function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = Date.now().toString() + Math.random().toString(36).substring(2);
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Get user's cart preferences
 */
export function getCartPreferences(): CartStoragePreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;

  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to parse cart preferences:", error);
  }

  return DEFAULT_PREFERENCES;
}

/**
 * Save user's cart preferences
 */
export function setCartPreferences(
  preferences: Partial<CartStoragePreferences>
): void {
  if (typeof window === "undefined") return;

  const current = getCartPreferences();
  const updated = { ...current, ...preferences };

  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save cart preferences:", error);
  }
}

/**
 * Check if cart data is expired
 */
function isCartExpired(
  cartData: CartStorageData,
  preferences: CartStoragePreferences
): boolean {
  const now = Date.now();
  const expiryMs = preferences.autoExpiry * 60 * 60 * 1000; // Convert hours to ms

  // Check both creation and last access time
  const timeSinceCreated = now - cartData.timestamp;
  const timeSinceAccess = now - cartData.lastAccess;

  return timeSinceCreated > expiryMs || timeSinceAccess > expiryMs;
}

/**
 * Check if we should persist cart based on mode and session
 */
function shouldPersistCart(
  preferences: CartStoragePreferences,
  sessionId: string,
  existingSessionId?: string
): boolean {
  switch (preferences.persistenceMode) {
    case "disabled":
      return false;
    case "session":
      return sessionId === existingSessionId; // Only persist within same session
    case "persistent":
      return true; // Always persist
    case "smart":
      // Smart mode: persist but with expiry and smart clearing
      return true;
    default:
      return false;
  }
}

/**
 * Load cart from storage with smart logic
 */
export function loadCartFromStorage(): any[] {
  if (typeof window === "undefined") return [];

  const preferences = getCartPreferences();
  const currentSessionId = getSessionId();

  // If persistence is disabled, return empty cart
  if (preferences.persistenceMode === "disabled") {
    return [];
  }

  try {
    // Try localStorage first
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const cartData: CartStorageData = JSON.parse(stored);

      // Check if cart is expired
      if (isCartExpired(cartData, preferences)) {
        console.log("Cart expired, clearing...");
        clearCartStorage();
        return [];
      }

      // Check if we should load this cart based on persistence mode
      if (
        !shouldPersistCart(preferences, currentSessionId, cartData.sessionId)
      ) {
        console.log("Cart session mismatch, not loading");
        return [];
      }

      // Update last access time
      cartData.lastAccess = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartData));

      return cartData.items || [];
    }

    // Fallback to session storage for session-only mode
    if (preferences.persistenceMode === "session") {
      const sessionStored = sessionStorage.getItem(STORAGE_KEY);
      if (sessionStored) {
        const items = JSON.parse(sessionStored);
        return items || [];
      }
    }
  } catch (error) {
    console.error("Failed to load cart from storage:", error);
    clearCartStorage(); // Clear corrupted data
  }

  return [];
}

/**
 * Save cart to storage with smart logic
 */
export function saveCartToStorage(items: any[]): void {
  if (typeof window === "undefined") return;

  const preferences = getCartPreferences();
  const currentSessionId = getSessionId();

  // If persistence is disabled, don't save anything
  if (preferences.persistenceMode === "disabled") {
    return;
  }

  const cartData: CartStorageData = {
    items,
    timestamp: Date.now(),
    lastAccess: Date.now(),
    sessionId: currentSessionId,
    preferences,
  };

  try {
    switch (preferences.persistenceMode) {
      case "session":
        // Session-only storage
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        break;

      case "persistent":
      case "smart":
        // Persistent storage with metadata
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cartData));
        break;
    }
  } catch (error) {
    console.error("Failed to save cart to storage:", error);
  }
}

/**
 * Clear cart storage
 */
export function clearCartStorage(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear cart storage:", error);
  }
}

/**
 * Clear expired carts (useful for cleanup)
 */
export function clearExpiredCarts(): void {
  const preferences = getCartPreferences();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const cartData: CartStorageData = JSON.parse(stored);
      if (isCartExpired(cartData, preferences)) {
        clearCartStorage();
      }
    }
  } catch (error) {
    console.error("Failed to clear expired cart:", error);
  }
}

/**
 * Get cart age information for UI display
 */
export function getCartAgeInfo(): { hoursOld: number; isOld: boolean } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const cartData: CartStorageData = JSON.parse(stored);
      const hoursOld = (Date.now() - cartData.timestamp) / (1000 * 60 * 60);
      return {
        hoursOld: Math.round(hoursOld * 10) / 10, // Round to 1 decimal
        isOld: hoursOld > 4, // Consider "old" after 4 hours
      };
    }
  } catch (error) {
    console.error("Failed to get cart age:", error);
  }
  return null;
}

/**
 * Development helper: Clear all cart data (useful during development)
 */
export function devClearAllCartData(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PREFERENCES_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    console.log("🧹 All cart data cleared for development");
  } catch (error) {
    console.error("Failed to clear all cart data:", error);
  }
}

// Expose dev helper globally in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).devClearCart = devClearAllCartData;
  console.log("🛠️ Development helper available: devClearCart()");
}
