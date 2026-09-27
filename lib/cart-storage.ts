/**
 * Shared ephemeral cart storage for all cart API routes
 * This ensures all cart endpoints use the same storage instance
 * Uses Node.js global scope to persist across module reloads
 */

import type { CartItem } from "@/features/cart";

// Use Node.js global scope to persist across module reloads in development
declare global {
  var __CART_STORAGE__: Map<string, CartItem[]> | undefined;
  var __CART_CLEANUP_INTERVAL__: NodeJS.Timeout | undefined;
  var __CART_MIGRATIONS__: Set<string> | undefined;
}

// Initialize migration tracking
function getGlobalMigrations(): Set<string> {
  if (!global.__CART_MIGRATIONS__) {
    global.__CART_MIGRATIONS__ = new Set<string>();
    console.log("🔄 [CART STORAGE] Migration tracking initialized");
  }
  return global.__CART_MIGRATIONS__;
}

// Initialize or get existing global storage
function getGlobalCartStorage(): Map<string, CartItem[]> {
  if (!global.__CART_STORAGE__) {
    global.__CART_STORAGE__ = new Map<string, CartItem[]>();
    console.log("🏪 [CART STORAGE] Global storage initialized");

    // Set up cleanup interval only once
    if (!global.__CART_CLEANUP_INTERVAL__) {
      global.__CART_CLEANUP_INTERVAL__ = setInterval(
        () => {
          const storage = global.__CART_STORAGE__;
          if (!storage) return;

          const maxSessions = 1000;
          const currentSize = storage.size;

          if (currentSize > maxSessions) {
            const sessionsToRemove = Math.floor(currentSize * 0.2);
            const sessionKeys = Array.from(storage.keys());

            for (let i = 0; i < sessionsToRemove; i++) {
              const sessionToRemove = sessionKeys[i];
              storage.delete(sessionToRemove);
              console.log(
                `🧹 [CART STORAGE] Cleaned up session: ${sessionToRemove}`
              );
            }

            console.log(
              `🧹 [CART STORAGE] Cleaned up ${sessionsToRemove} sessions. New size: ${storage.size}`
            );
          }
        },
        30 * 60 * 1000
      ); // 30 minutes

      global.__CART_CLEANUP_INTERVAL__.unref?.();
      console.log("🧹 [CART STORAGE] Cleanup interval established");
    }
  } else {
    console.log(
      `🏪 [CART STORAGE] Using existing global storage with ${global.__CART_STORAGE__.size} sessions`
    );
  }

  return global.__CART_STORAGE__;
}

// Export the global storage instance
export const SESSION_CART_STORAGE = getGlobalCartStorage();

// Migrate cart from session ID to email when user becomes authenticated
export function migrateCart(fromSessionId: string, toEmail: string): void {
  const migrations = getGlobalMigrations();
  const migrationKey = `${fromSessionId}->${toEmail}`;

  // Check if this migration has already been performed
  if (migrations.has(migrationKey)) {
    console.log(
      `🔄 [CART MIGRATION] Migration ${migrationKey} already performed, skipping`
    );
    return;
  }

  console.log(
    `🔄 [CART MIGRATION] Attempting to migrate from ${fromSessionId} to ${toEmail}`
  );
  console.log(
    `📊 [CART MIGRATION] Storage has ${SESSION_CART_STORAGE.size} sessions before migration`
  );

  // Safety check: Don't migrate if source and destination are the same
  if (fromSessionId === toEmail) {
    console.log(
      `⚠️ [CART MIGRATION] Source and destination are the same, skipping migration`
    );
    return;
  }

  const sessionCart = SESSION_CART_STORAGE.get(fromSessionId);
  const emailCart = SESSION_CART_STORAGE.get(toEmail);

  console.log(
    `📦 [CART MIGRATION] Session cart has: ${sessionCart?.length || 0} items`
  );
  console.log(
    `📦 [CART MIGRATION] Email cart has: ${emailCart?.length || 0} items`
  );

  if (sessionCart && sessionCart.length > 0) {
    if (emailCart && emailCart.length > 0) {
      // Merge carts - combine items, avoiding duplicates
      const mergedCart = [...emailCart];

      sessionCart.forEach(sessionItem => {
        const existingItem = mergedCart.find(
          item =>
            item.productId === sessionItem.productId &&
            item.variantId === sessionItem.variantId
        );

        if (existingItem) {
          // Update quantity to the higher value (assuming user wants to keep the latest)
          existingItem.quantity = Math.max(
            existingItem.quantity,
            sessionItem.quantity
          );
        } else {
          // Add new item
          mergedCart.push(sessionItem);
        }
      });

      SESSION_CART_STORAGE.set(toEmail, mergedCart);
      console.log(
        `🔄 [CART MIGRATION] Merged ${sessionCart.length} items from session to email cart (${mergedCart.length} total)`
      );
    } else {
      // Just move the session cart to email
      SESSION_CART_STORAGE.set(toEmail, sessionCart);
      console.log(
        `🔄 [CART MIGRATION] Moved ${sessionCart.length} items from session to email cart`
      );
    }

    // Clean up old session cart (only if different from email)
    if (fromSessionId !== toEmail) {
      SESSION_CART_STORAGE.delete(fromSessionId);
      console.log(
        `🗑️ [CART MIGRATION] Cleaned up session cart: ${fromSessionId}`
      );
    }
  } else {
    console.log(`ℹ️ [CART MIGRATION] No session cart to migrate`);
  }

  console.log(
    `📊 [CART MIGRATION] Storage has ${SESSION_CART_STORAGE.size} sessions after migration`
  );

  // Mark this migration as completed
  migrations.add(migrationKey);
  console.log(
    `✅ [CART MIGRATION] Migration ${migrationKey} marked as completed`
  );
}

export function readCartItems(cartId: string): CartItem[] {
  return SESSION_CART_STORAGE.get(cartId) ?? [];
}

export function writeCartItems(cartId: string, items: CartItem[]): void {
  SESSION_CART_STORAGE.set(cartId, items);
}

export {
  attachGuestCartCookie,
  getCartId,
  resolveCartRequest,
  type CartRequestContext,
} from "./cart-request";
