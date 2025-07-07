"use client";

import React from "react";
import { useCart } from "../context/CartContext";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

/**
 * Lightweight cart status component
 * Only shows when there are potential issues
 */
export function CartStatus() {
  const { cartItems, forceSyncWithServer, isLoading } = useCart();
  const [lastSyncAttempt, setLastSyncAttempt] = React.useState<number>(0);
  const [showStatus, setShowStatus] = React.useState(false);

  // Check if we should show the status (only when there might be issues)
  React.useEffect(() => {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Show status if:
    // - User just performed a sync (for 10 seconds)
    // - There are no items but we're in checkout (potential sync issue)
    const timeSinceSync = Date.now() - lastSyncAttempt;
    const shouldShow =
      (lastSyncAttempt > 0 && timeSinceSync < 10000) || // Show for 10s after sync
      (totalItems === 0 && window.location.pathname.includes("/checkout")); // Show in checkout if empty cart

    setShowStatus(shouldShow);
  }, [cartItems, lastSyncAttempt]);

  const handleManualSync = async () => {
    setLastSyncAttempt(Date.now());
    try {
      await forceSyncWithServer();
      console.log("✅ Manual cart sync completed");
    } catch (error) {
      console.error("❌ Manual cart sync failed:", error);
    }
  };

  // Hide in production unless there's an actual issue
  if (process.env.NODE_ENV === "production" && !showStatus) {
    return null;
  }

  // Show a minimal indicator in development or when there are issues
  if (!showStatus && process.env.NODE_ENV === "development") {
    return null; // Don't show anything by default in development either
  }

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isEmpty = totalItems === 0;
  const isInCheckout =
    typeof window !== "undefined" &&
    window.location.pathname.includes("/checkout");

  return (
    <div className="fixed bottom-4 left-4 p-3 bg-white border border-orange-300 rounded-lg shadow-md z-40 max-w-xs">
      <div className="flex items-center gap-2 text-sm">
        <AlertCircle className="h-4 w-4 text-orange-500" />
        <span className="text-gray-700">
          {isEmpty && isInCheckout
            ? "Cart appears empty in checkout"
            : `Cart: ${cartItems.length} items (${totalItems} total)`}
        </span>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={handleManualSync}
        disabled={isLoading}
        className="mt-2 w-full text-xs"
      >
        <RotateCcw className="h-3 w-3 mr-1" />
        {isLoading ? "Syncing..." : "Refresh Cart"}
      </Button>

      {lastSyncAttempt > 0 && Date.now() - lastSyncAttempt < 3000 && (
        <div className="text-xs text-green-600 mt-1">✅ Sync completed</div>
      )}
    </div>
  );
}
