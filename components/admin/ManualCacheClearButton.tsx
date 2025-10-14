"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/**
 * Manual Cache Clear Button
 * 
 * Allows admins to manually clear all product caches when needed.
 * Use cases:
 * - After bulk product operations
 * - When data seems stale
 * - After importing products
 * - For immediate cache refresh
 */
export function ManualCacheClearButton() {
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const handleClearCache = async () => {
    setIsClearing(true);
    
    try {
      const response = await fetch("/api/admin/cache/clear-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to clear cache");
      }

      toast({
        title: "✅ Cache Cleared",
        description: `All product caches cleared successfully in ${data.duration}ms. Fresh data will load on next request.`,
        duration: 5000,
      });

      // Optional: Refresh the page to show fresh data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error("Error clearing cache:", error);
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to clear cache",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClearCache}
      disabled={isClearing}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isClearing ? "animate-spin" : ""}`} />
      {isClearing ? "Clearing Cache..." : "Clear Cache"}
    </Button>
  );
}

