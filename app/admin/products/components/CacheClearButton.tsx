"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CacheClearButton() {
  const [loading, setLoading] = useState(false);

  async function clearCache() {
    setLoading(true);
    try {
      await fetch("/api/admin/cache/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern: "products" }),
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to clear cache:", error);
      alert("Failed to clear cache");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={clearCache} disabled={loading} variant="outline">
      {loading ? "Clearing..." : "Clear Product Cache"}
    </Button>
  );
}
