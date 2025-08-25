// Script to clear service worker cache
console.log("Clearing service worker cache...");

// Clear all caches
if ("caches" in window) {
  caches
    .keys()
    .then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log("Deleting cache:", cacheName);
          return caches.delete(cacheName);
        })
      );
    })
    .then(() => {
      console.log("All caches cleared successfully");
    })
    .catch(error => {
      console.error("Error clearing caches:", error);
    });
}

// Unregister service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      registration.unregister();
      console.log("Service worker unregistered");
    }
  });
}

console.log("Cache clearing script completed");
