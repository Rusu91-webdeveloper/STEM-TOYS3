// Service Worker for STEM TOYS E-commerce Platform
// Version: 1.0.0
// Cache Strategy: Network First with Cache Fallback

const CACHE_NAME = 'stem-toys-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';
const API_CACHE = 'api-v1.0.0';

// Cache configurations
const CACHE_CONFIGS = {
  static: {
    name: STATIC_CACHE,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    maxEntries: 100,
  },
  dynamic: {
    name: DYNAMIC_CACHE,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    maxEntries: 50,
  },
  api: {
    name: API_CACHE,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 30,
  },
};

// Critical assets to cache immediately
const CRITICAL_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/images/logo.png',
  '/images/placeholder.jpg',
];

// Static assets patterns
const STATIC_PATTERNS = [
  /\.(js|css|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2|ttf|otf)$/,
  /^\/_next\/static\//,
  /^\/images\//,
  /^\/fonts\//,
];

// API patterns
const API_PATTERNS = [
  /^\/api\/products/,
  /^\/api\/categories/,
  /^\/api\/cart/,
  /^\/api\/user/,
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_CONFIGS.static.name)
      .then((cache) => {
        console.log('[SW] Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache critical assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches
            if (!Object.values(CACHE_CONFIGS).some(config => config.name === cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // FIXED: Skip external domains (like utfs.io, vercel.live, etc.) to prevent image loading issues
  if (isExternalDomain(url.hostname)) {
    console.log('[SW] Skipping external domain:', url.hostname);
    return;
  }
  
  // FIXED: Skip authentication endpoints to prevent PKCE code verifier issues
  if (isAuthRequest(url.pathname)) {
    console.log('[SW] Skipping auth request:', url.pathname);
    return;
  }
  
  // FIXED: Skip external domains to prevent image loading and other issues
  if (isExternalDomain(url.hostname)) {
    console.log('[SW] Skipping external domain:', url.hostname);
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isApiRequest(url.pathname)) {
    event.respondWith(handleApiRequest(request));
  } else if (isPageRequest(url.pathname)) {
    event.respondWith(handlePageRequest(request));
  } else {
    event.respondWith(handleDefaultRequest(request));
  }
});

// Handle static assets (CSS, JS, images, fonts)
async function handleStaticAsset(request) {
  const cacheName = CACHE_CONFIGS.static.name;
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      
      return networkResponse;
    }
  } catch (error) {
    console.warn('[SW] Network failed for static asset:', request.url);
  }
  
  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return offline placeholder for images
  if (request.url.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/)) {
    return caches.match('/images/placeholder.jpg');
  }
  
  throw new Error('Static asset not found in cache');
}

// Handle API requests
async function handleApiRequest(request) {
  const cacheName = CACHE_CONFIGS.api.name;
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      
      return networkResponse;
    }
  } catch (error) {
    console.warn('[SW] Network failed for API request:', request.url);
  }
  
  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return offline API response
  return new Response(
    JSON.stringify({
      error: 'offline',
      message: 'You are offline. Please check your connection.',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    }
  );
}

// Handle page requests
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      return networkResponse;
    }
  } catch (error) {
    console.warn('[SW] Network failed for page request:', request.url);
  }
  
  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return offline page
  return caches.match('/offline');
}

// Handle default requests
async function handleDefaultRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      return networkResponse;
    }
  } catch (error) {
    console.warn('[SW] Network failed for request:', request.url);
  }
  
  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  throw new Error('Request not found in cache');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// Handle background sync
async function handleBackgroundSync() {
  try {
    // Get pending actions from IndexedDB
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        await processPendingAction(action);
        await removePendingAction(action.id);
      } catch (error) {
        console.error('[SW] Failed to process pending action:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/images/logo.png',
      badge: data.badge || '/images/badge.png',
      image: data.image,
      tag: data.tag || 'default',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'STEM TOYS', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  if (event.action) {
    // Handle notification action
    handleNotificationAction(event.action, event.notification.data);
  } else {
    // Default click behavior
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

// Helper functions
function isStaticAsset(pathname) {
  return STATIC_PATTERNS.some(pattern => pattern.test(pathname));
}

function isApiRequest(pathname) {
  return API_PATTERNS.some(pattern => pattern.test(pathname));
}

function isPageRequest(pathname) {
  return !isStaticAsset(pathname) && !isApiRequest(pathname) && !pathname.includes('.');
}

function isExternalDomain(hostname) {
  // Skip external domains to prevent image loading and other issues
  const externalDomains = [
    'utfs.io',
    'vercel.live',
    'vercel.app',
    'cloudinary.com',
    'images.unsplash.com',
    'cdn.jsdelivr.net',
    'unpkg.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'api.stripe.com',
    'js.stripe.com',
    'm.stripe.com',
    'checkout.stripe.com'
  ];
  
  return externalDomains.some(domain => hostname.includes(domain));
}

function isAuthRequest(pathname) {
  // Skip all authentication-related endpoints to prevent PKCE code verifier issues
  return pathname.startsWith('/api/auth') || 
         pathname.startsWith('/auth/') || 
         pathname.includes('/callback/') ||
         pathname.includes('/signin') ||
         pathname.includes('/signout') ||
         pathname.includes('/session');
}

// IndexedDB operations for offline actions
async function getPendingActions() {
  // This would interact with IndexedDB to get pending actions
  // For now, return empty array
  return [];
}

async function processPendingAction(action) {
  // Process pending action (e.g., cart updates, orders)
  console.log('[SW] Processing pending action:', action);
}

async function removePendingAction(actionId) {
  // Remove processed action from IndexedDB
  console.log('[SW] Removing pending action:', actionId);
}

function handleNotificationAction(action, data) {
  console.log('[SW] Handling notification action:', action, data);
  
  // Handle different notification actions
  switch (action) {
    case 'view':
      clients.openWindow(data.url || '/');
      break;
    case 'dismiss':
      // Action already dismissed
      break;
    default:
      console.log('[SW] Unknown notification action:', action);
  }
}

// Cache management utilities
async function cleanExpiredCaches() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const cacheTime = response.headers.get('sw-cache-time');
        if (cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          const maxAge = CACHE_CONFIGS[cacheName]?.maxAge || 24 * 60 * 60 * 1000;
          
          if (age > maxAge) {
            await cache.delete(request);
          }
        }
      }
    }
  }
}

// Periodic cache cleanup
setInterval(cleanExpiredCaches, 60 * 60 * 1000); // Every hour

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0].postMessage(stats);
      });
      break;
    default:
      console.log('[SW] Unknown message type:', event.data.type);
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    stats[cacheName] = {
      size: requests.length,
      requests: requests.map(req => req.url),
    };
  }
  
  return stats;
}

console.log('[SW] Service worker loaded successfully'); 