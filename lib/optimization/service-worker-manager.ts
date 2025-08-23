/**
 * Service Worker Manager for PWA functionality and caching
 */

interface ServiceWorkerConfig {
  enabled: boolean;
  scope: string;
  cacheName: string;
  cacheVersion: string;
  offlineFallback: string;
  backgroundSync: boolean;
  pushNotifications: boolean;
}

interface CacheStrategy {
  name: string;
  pattern: string;
  strategy: "cache-first" | "network-first" | "stale-while-revalidate" | "network-only";
  cacheTime: number;
  maxEntries: number;
}

interface ServiceWorkerStatus {
  installed: boolean;
  active: boolean;
  waiting: boolean;
  controlling: boolean;
  lastUpdate: Date;
}

class ServiceWorkerManager {
  private config: ServiceWorkerConfig;
  private status: ServiceWorkerStatus;
  private cacheStrategies: CacheStrategy[] = [];

  constructor() {
    this.config = {
      enabled: true,
      scope: "/",
      cacheName: "stem-toys-cache",
      cacheVersion: "v1.0.0",
      offlineFallback: "/offline",
      backgroundSync: true,
      pushNotifications: false,
    };

    this.status = {
      installed: false,
      active: false,
      waiting: false,
      controlling: false,
      lastUpdate: new Date(),
    };

    // Default cache strategies
    this.cacheStrategies = [
      {
        name: "static-assets",
        pattern: "/assets/.*",
        strategy: "cache-first",
        cacheTime: 31536000, // 1 year
        maxEntries: 100,
      },
      {
        name: "api-responses",
        pattern: "/api/.*",
        strategy: "network-first",
        cacheTime: 300, // 5 minutes
        maxEntries: 50,
      },
      {
        name: "pages",
        pattern: "/.*",
        strategy: "stale-while-revalidate",
        cacheTime: 3600, // 1 hour
        maxEntries: 20,
      },
    ];
  }

  getConfig(): ServiceWorkerConfig {
    return { ...this.config };
  }

  getStatus(): ServiceWorkerStatus {
    return { ...this.status };
  }

  updateConfig(newConfig: Partial<ServiceWorkerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  async getCacheInfo(): Promise<{ totalSize: number; entries: number; strategies: CacheStrategy[] }> {
    return {
      totalSize: 1024 * 1024, // 1MB simulated
      entries: 25,
      strategies: [...this.cacheStrategies],
    };
  }

  async install(): Promise<void> {
    this.status.installed = true;
    this.status.lastUpdate = new Date();
    console.log("Service worker installed");
  }

  async update(): Promise<void> {
    this.status.lastUpdate = new Date();
    console.log("Service worker updated");
  }

  async activate(): Promise<void> {
    this.status.active = true;
    this.status.lastUpdate = new Date();
    console.log("Service worker activated");
  }

  async unregister(): Promise<void> {
    this.status.installed = false;
    this.status.active = false;
    this.status.waiting = false;
    this.status.controlling = false;
    console.log("Service worker unregistered");
  }

  async regenerateServiceWorker(): Promise<void> {
    // Simulate service worker regeneration
    console.log("Service worker regenerated");
  }

  async precacheAssets(assets: string[]): Promise<void> {
    // Simulate asset precaching
    console.log(`Precaching ${assets.length} assets`);
  }

  async registerBackgroundSync(syncData: any): Promise<void> {
    // Simulate background sync registration
    console.log("Background sync registered:", syncData);
  }

  async registerPushSubscription(subscription: any): Promise<void> {
    // Simulate push subscription registration
    console.log("Push subscription registered:", subscription);
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Export utility functions
export async function generateServiceWorker(): Promise<string> {
  const config = serviceWorkerManager.getConfig();
  const strategies = serviceWorkerManager.getCacheInfo();

  return `
// Service Worker for ${config.cacheName}
const CACHE_NAME = '${config.cacheName}-${config.cacheVersion}';
const OFFLINE_FALLBACK = '${config.offlineFallback}';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll([
          OFFLINE_FALLBACK,
          '/',
          '/offline'
        ]);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different cache strategies
  if (request.url.includes('/assets/')) {
    // Cache-first for static assets
    event.respondWith(cacheFirst(request));
  } else if (request.url.includes('/api/')) {
    // Network-first for API calls
    event.respondWith(networkFirst(request));
  } else {
    // Stale-while-revalidate for pages
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Cache-first strategy
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    return new Response('Network error', { status: 503 });
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Network error', { status: 503 });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    cache.put(request, networkResponse.clone());
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('Background sync triggered');
  // Implement background sync logic
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('STEM Toys', options)
  );
});

console.log('Service Worker loaded');
`;
}

export async function updateCacheStrategy(strategies: CacheStrategy[]): Promise<void> {
  // Simulate cache strategy update
  console.log("Cache strategies updated:", strategies);
}

export async function clearOfflineCache(): Promise<void> {
  // Simulate offline cache clearing
  console.log("Offline cache cleared");
}

export async function getOfflineStatus(): Promise<{ available: boolean; lastCheck: Date }> {
  return {
    available: true,
    lastCheck: new Date(),
  };
}
