"use client";

import { RefreshCw } from "lucide-react";

export function RetryButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors min-h-[48px] active:scale-95"
    >
      <RefreshCw className="w-5 h-5" />
      Try Again
    </button>
  );
}
