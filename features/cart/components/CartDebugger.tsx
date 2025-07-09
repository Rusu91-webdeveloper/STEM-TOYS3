"use client";

import React from "react";
import { useCart } from "../context/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { debugCartState, refreshCartFromServer } from "../lib/cartSync";

/**
 * Development-only cart debugger component
 * Helps identify and resolve cart synchronization issues
 */
export function CartDebugger() {
  const { cartItems, forceSyncWithServer, syncWithServer } = useCart();
  const [isLoading, setIsLoading] = React.useState(false);
  const [lastSync, setLastSync] = React.useState<string | null>(null);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const handleForceSync = async () => {
    setIsLoading(true);
    try {
      await forceSyncWithServer();
      setLastSync(new Date().toLocaleTimeString());
      console.warn("🔄 Force sync completed");
    } catch (error) {
      console.error("Force sync failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegularSync = async () => {
    setIsLoading(true);
    try {
      await syncWithServer();
      setLastSync(new Date().toLocaleTimeString());
      console.warn("🔄 Regular sync completed");
    } catch (error) {
      console.error("Regular sync failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshFromServer = async () => {
    setIsLoading(true);
    try {
      await refreshCartFromServer();
      setLastSync(new Date().toLocaleTimeString());
      console.warn("🔄 Refresh from server completed");
    } catch (error) {
      console.error("Refresh from server failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebugCart = () => {
    debugCartState(cartItems, "Manual Debug");
  };

  const handleClearLocalStorage = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("nextcommerce_cart");
      console.warn("🧹 Local storage cart cleared");
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="text-sm font-semibold mb-2 text-gray-800">
        🛒 Cart Debugger (Dev)
      </div>

      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Items:</span>
          <Badge variant="secondary">{cartItems.length}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Total Qty:</span>
          <Badge variant="secondary">{totalItems}</Badge>
        </div>
        {lastSync && (
          <div className="flex justify-between">
            <span>Last Sync:</span>
            <span className="text-green-600">{lastSync}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1 mt-3">
        <Button
          size="sm"
          variant="outline"
          onClick={handleForceSync}
          disabled={isLoading}
          className="text-xs"
        >
          Force Sync
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRegularSync}
          disabled={isLoading}
          className="text-xs"
        >
          Sync
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRefreshFromServer}
          disabled={isLoading}
          className="text-xs"
        >
          Refresh
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleDebugCart}
          className="text-xs"
        >
          Debug
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-1 mt-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={handleClearLocalStorage}
          className="text-xs"
        >
          Clear Local
        </Button>
      </div>

      {isLoading && (
        <div className="text-xs text-blue-600 mt-2">⏳ Syncing...</div>
      )}
    </div>
  );
}
