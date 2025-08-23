"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Re-enabled: Service worker registration is now working with OAuth
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      console.log("[SW] Registering service worker...");

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });

      console.log("[SW] Service worker registered successfully:", registration);

      // Handle service worker updates
      registration.addEventListener("updatefound", () => {
        console.log("[SW] Update found, installing new service worker...");
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[SW] New service worker installed, ready to activate");
            }
          });
        }
      });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener("message", event => {
        console.log("[SW] Message from service worker:", event.data);

        if (event.data.type === "CACHE_UPDATED") {
          console.log("[SW] Cache updated, reloading page...");
          window.location.reload();
        }
      });

      // Check if service worker is controlling the page
      if (navigator.serviceWorker.controller) {
        console.log("[SW] Service worker is controlling the page");

        // Send message to service worker to get cache stats
        navigator.serviceWorker.controller.postMessage({
          type: "GET_CACHE_STATS",
        });
      }
    } catch (error) {
      console.error("[SW] Failed to register service worker:", error);
    }
  };

  return null;
}
