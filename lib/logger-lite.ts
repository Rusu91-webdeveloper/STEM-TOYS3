"use client";

// Minimal browser-safe logger to avoid pulling in server-only deps
export const logger = {
  debug: (message: string, data?: any) =>
    console.debug("[DEBUG]", message, data ?? ""),
  info: (message: string, data?: any) =>
    console.log("[INFO]", message, data ?? ""),
  warn: (message: string, data?: any) =>
    console.warn("[WARN]", message, data ?? ""),
  error: (message: string, data?: any) =>
    console.error("[ERROR]", message, data ?? ""),
};

export default logger;
