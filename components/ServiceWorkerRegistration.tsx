"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Keep service worker out of localhost/dev to avoid cache side effects.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then(registrations => {
          registrations.forEach(registration => {
            void registration.unregister();
          });
        })
        .catch(error => {
          console.warn("[SW] Failed to unregister service worker in dev:", error);
        });
      return;
    }

    registerServiceWorker();
  }, []);

  const registerServiceWorker = async () => {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("[SW] Registering service worker...");
      }

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });

      if (process.env.NODE_ENV === "development") {
        console.log(
          "[SW] Service worker registered successfully:",
          registration
        );
      }

      // Handle service worker updates
      registration.addEventListener("updatefound", () => {
        if (process.env.NODE_ENV === "development") {
          console.log("[SW] Update found, installing new service worker...");
        }
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              if (process.env.NODE_ENV === "development") {
                console.log(
                  "[SW] New service worker installed, ready to activate"
                );
              }
            }
          });
        }
      });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener("message", event => {
        if (process.env.NODE_ENV === "development") {
          console.log("[SW] Message from service worker:", event.data);
        }

        // Ensure event.data exists before accessing properties
        if (event.data && event.data.type === "CACHE_UPDATED") {
          if (process.env.NODE_ENV === "development") {
            console.log("[SW] Cache updated, reloading page...");
          }
          window.location.reload();
        }
      });

      // Check if service worker is controlling the page
      if (navigator.serviceWorker.controller) {
        if (process.env.NODE_ENV === "development") {
          console.log("[SW] Service worker is controlling the page");
        }

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
