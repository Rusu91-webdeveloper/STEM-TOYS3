// Service Worker for TechTots E-commerce PWA
// Version 1.0.0

const CACHE_NAME = 'techtots-v1.0.0';
const OFFLINE_URL = '/offline';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Define resources to cache with their strategies
const CACHE_CONFIG = {
  // Essential app shell (cache first)
  shell: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    urls: [
      '/',
      '/manifest.json',
      '/offline',
      // Add more shell resources
    ]
  },
  
  // Static assets (cache first)
  static: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    patterns: [
      /\/_next\/static\/.*/,
      /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      /\.(?:css|js)$/,
    ]
  },
  
  // API calls (network first with fallback)
  api: {
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    patterns: [
      /\/api\/.*/,
    ]
  },
  
  // Pages (stale while revalidate)
  pages: {
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    patterns: [
      /\/products\/.*/,
      /\/categories\/.*/,
      /\/blog\/.*/,
    ]
  }
};

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      
      // Cache shell resources
      try {
        await cache.addAll(CACHE_CONFIG.shell.urls);
        console.log('Shell resources cached successfully');
      } catch (error) {
        console.error('Failed to cache shell resources:', error);
      }
      
      // Skip waiting to activate immediately
      self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
      
      // Take control of all clients
      self.clients.claim();
    })()
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Skip POST requests for now (can be enhanced later)
  if (request.method !== 'GET') {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// Handle different types of requests
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Determine cache strategy based on request
    const strategy = determineStrategy(request);
    
    switch (strategy) {
      case CACHE_STRATEGIES.CACHE_FIRST:
        return await cacheFirst(request);
      
      case CACHE_STRATEGIES.NETWORK_FIRST:
        return await networkFirst(request);
      
      case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
        return await staleWhileRevalidate(request);
      
      case CACHE_STRATEGIES.NETWORK_ONLY:
        return await fetch(request);
      
      case CACHE_STRATEGIES.CACHE_ONLY:
        return await caches.match(request);
      
      default:
        return await networkFirst(request);
    }
  } catch (error) {
    console.error('Request failed:', error);
    return await handleOffline(request);
  }
}

// Determine caching strategy for a request
function determineStrategy(request) {
  const url = new URL(request.url);
  
  // Check static assets
  for (const pattern of CACHE_CONFIG.static.patterns) {
    if (pattern.test(url.pathname)) {
      return CACHE_CONFIG.static.strategy;
    }
  }
  
  // Check API calls
  for (const pattern of CACHE_CONFIG.api.patterns) {
    if (pattern.test(url.pathname)) {
      return CACHE_CONFIG.api.strategy;
    }
  }
  
  // Check pages
  for (const pattern of CACHE_CONFIG.pages.patterns) {
    if (pattern.test(url.pathname)) {
      return CACHE_CONFIG.pages.strategy;
    }
  }
  
  // Default to network first
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

// Cache first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const response = await fetch(request);
  
  if (response.status === 200) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  
  return response;
}

// Network first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Fetch in the background
  const fetchPromise = fetch(request).then(response => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Ignore network errors for background updates
  });
  
  // Return cached response immediately if available
  return cachedResponse || fetchPromise;
}

// Handle offline scenarios
async function handleOffline(request) {
  const url = new URL(request.url);
  
  // For navigation requests, serve offline page
  if (request.mode === 'navigate') {
    const offlineResponse = await caches.match(OFFLINE_URL);
    if (offlineResponse) {
      return offlineResponse;
    }
  }
  
  // For API requests, return offline response
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'You are currently offline. Please check your connection.'
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  
  // For other requests, try to find a cached version
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return a generic offline response
  return new Response(
    'You are currently offline. Please check your connection.',
    {
      status: 503,
      headers: {
        'Content-Type': 'text/plain',
      },
    }
  );
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle background sync tasks
  console.log('Background sync triggered');
  
  // You can implement specific sync logic here
  // For example, retry failed cart updates, order submissions, etc.
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icons/checkmark.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification('TechTots', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for client communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});

async function syncContent() {
  // Sync product data, prices, inventory, etc.
  console.log('Periodic sync triggered');
  
  try {
    // Example: sync critical product data
    const response = await fetch('/api/products/sync');
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put('/api/products/sync', response.clone());
    }
  } catch (error) {
    console.error('Periodic sync failed:', error);
  }
}

console.log('Service Worker loaded successfully'); 