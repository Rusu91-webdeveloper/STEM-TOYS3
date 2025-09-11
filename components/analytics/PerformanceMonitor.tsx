"use client";

import { useEffect } from "react";
import { initPerformanceTracking } from "@/lib/analytics/web-vitals";

interface PerformanceMonitorProps {
  enableConsoleLogging?: boolean;
  enableAPILogging?: boolean;
  apiEndpoint?: string;
}

export default function PerformanceMonitor({
  enableConsoleLogging = process.env.NODE_ENV === "development",
  enableAPILogging = false,
  apiEndpoint,
}: PerformanceMonitorProps) {
  useEffect(() => {
    // Initialize performance tracking
    initPerformanceTracking({
      sendToGA4: true,
      sendToConsole: enableConsoleLogging,
      sendToAPI: enableAPILogging,
      apiEndpoint,
    });
  }, [enableConsoleLogging, enableAPILogging, apiEndpoint]);

  // This component doesn't render anything
  return null;
}
