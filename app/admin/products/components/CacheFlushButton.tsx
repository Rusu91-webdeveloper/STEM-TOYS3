"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CacheFlushButton() {
  const [loading, setLoading] = useState(false);

  async function flushCache() {
    if (!confirm("⚠️ This will clear ALL cached data. Are you sure?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/cache/flush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        alert("✅ Cache flushed successfully! Reloading...");
        window.location.reload();
      } else {
        throw new Error("Failed to flush cache");
      }
    } catch (error) {
      console.error("Failed to flush cache:", error);
      alert("❌ Failed to flush cache. Check console for errors.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={flushCache}
      disabled={loading}
      variant="destructive"
      size="sm"
    >
      {loading ? "Flushing..." : "🔥 Flush ALL Cache"}
    </Button>
  );
}

