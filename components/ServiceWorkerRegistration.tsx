"use client";

import { useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log("[SW] Service Worker registered successfully:", registration);

      // Handle service worker updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New service worker is available
              showUpdateNotification();
            }
          });
        }
      });

      // Handle service worker activation
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("[SW] New service worker activated");
        toast({
          title: "App Updated",
          description: "A new version of the app is now available.",
          duration: 3000,
        });
      });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener("message", event => {
        if (event.data && event.data.type === "CACHE_UPDATED") {
          console.log("[SW] Cache updated:", event.data.url);
        }
      });
    } catch (error) {
      console.error("[SW] Service Worker registration failed:", error);
    }
  };

  const showUpdateNotification = () => {
    toast({
      title: "Update Available",
      description: "A new version is available. Refresh to update.",
      action: (
        <button
          onClick={() => {
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: "SKIP_WAITING",
              });
            }
            window.location.reload();
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1 rounded text-sm"
        >
          Update Now
        </button>
      ),
      duration: 0, // Don't auto-dismiss
    });
  };

  return null; // This component doesn't render anything
}
