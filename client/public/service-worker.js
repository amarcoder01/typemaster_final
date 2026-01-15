// TypeMasterAI Service Worker - PWA & Push Notifications
// Version info injected at build time by Vite
// In development, use timestamp as fallback
const BUILD_ID = (typeof __BUILD_ID__ !== 'undefined' && __BUILD_ID__ !== '__BUILD_ID__') 
  ? __BUILD_ID__ 
  : 'dev-' + Date.now().toString(36);
const BUILD_TIME = (typeof __BUILD_TIME__ !== 'undefined' && __BUILD_TIME__ !== '__BUILD_TIME__')
  ? __BUILD_TIME__
  : new Date().toISOString();
const CACHE_NAME = `typemaster-${BUILD_ID}`;
const urlsToCache = [
  '/',
  '/offline.html'
];

// Export version info for client detection
self.BUILD_ID = BUILD_ID;
self.BUILD_TIME = BUILD_TIME;

// Install Service Worker and cache resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing version:', BUILD_ID);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Install error:', error);
      })
      // Don't auto-skipWaiting - let the client control this
  );
});

// Activate Service Worker and clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating version:', BUILD_ID);
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete all caches that don't match current version
            if (cacheName.startsWith('typemaster-') && cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Enable navigation preload if supported
      (async () => {
        if ('navigationPreload' in self.registration) {
          try {
            await self.registration.navigationPreload.enable();
            console.log('[Service Worker] Navigation preload enabled');
          } catch (e) {
            console.warn('[Service Worker] Navigation preload not available:', e);
          }
        }
      })()
    ]).then(() => self.clients.claim())
  );
});

// Message handler for client communication
self.addEventListener('message', event => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skip waiting triggered by client');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      buildId: BUILD_ID,
      buildTime: BUILD_TIME,
      cacheName: CACHE_NAME
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[Service Worker] Clearing all caches...');
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('[Service Worker] All caches cleared');
        if (event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
    );
  }
});

// Determine caching strategy based on request type
function getCacheStrategy(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Navigation requests - Network First (always get fresh HTML)
  if (request.mode === 'navigate') {
    return 'network-first';
  }
  
  // Hashed assets (JS/CSS with hash in filename) - Cache First (immutable)
  if (pathname.match(/\.[a-f0-9]{8,}\.(js|css)$/i)) {
    return 'cache-first';
  }
  
  // Static assets (images, fonts) - Stale While Revalidate
  if (pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$/i)) {
    return 'stale-while-revalidate';
  }
  
  // Default - Network First
  return 'network-first';
}

// Cache First Strategy - for immutable assets
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
      return response;
    }
    
    // If response exists but not ok, return it anyway
    if (response) {
      return response;
    }
    
    // Fallback error response
    return new Response('Asset not available', { 
      status: 503, 
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    return new Response('Asset not available', { 
      status: 503, 
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Stale While Revalidate Strategy - serve cached, update in background
async function staleWhileRevalidate(request) {
  try {
    const cached = await caches.match(request);
    
    // Start fetch in background (don't await)
    const fetchPromise = fetch(request).then(response => {
      if (response && response.ok) {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, response.clone()).catch(() => {});
        }).catch(() => {});
      }
    }).catch(() => {});
    
    // Return cached response immediately if available
    if (cached) {
      // Revalidate in background (fire and forget)
      fetchPromise;
      return cached;
    }
    
    // If no cache, wait for network
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => {});
        return response;
      }
      // Return response even if not ok
      if (response) {
        return response;
      }
    } catch (e) {
      // Network failed
    }
    
    // Fallback error response
    return new Response('Asset not available', { 
      status: 503, 
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    return new Response('Asset not available', { 
      status: 503, 
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Network First Strategy - for dynamic content
// Supports navigation preload for faster page loads
async function networkFirst(request, preloadResponse) {
  try {
    // Use preload response if available (for navigation requests)
    let response = null;
    
    if (preloadResponse) {
      try {
        response = await preloadResponse;
      } catch (e) {
        // Preload failed, try regular fetch
        response = null;
      }
    }
    
    if (!response) {
      try {
        response = await fetch(request);
      } catch (e) {
        response = null;
      }
    }
    
    // Cache successful responses
    if (response && response.ok) {
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, response.clone()).catch(() => {});
      }).catch(() => {});
      return response;
    }
    
    // Return response even if not ok
    if (response) {
      return response;
    }
    
    // Network failed, try cache
    try {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }
    } catch (e) {
      // Cache match failed
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      try {
        const offlinePage = await caches.match('/offline.html');
        if (offlinePage) {
          return offlinePage;
        }
      } catch (e) {
        // Offline page not available
      }
    }
    
    // Fallback error response
    return new Response('Network error', { 
      status: 503, 
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    // Ultimate fallback
    return new Response('Network error', { 
      status: 503, 
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Fetch handler with strategy selection
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension and other protocols
  if (!event.request.url.startsWith('http')) return;
  
  // Skip API requests - let them fail naturally without service worker interference
  if (event.request.url.includes('/api/')) return;
  
  // Skip WebSocket requests
  if (event.request.url.includes('/ws')) return;
  
  // Skip Vite HMR requests in development
  if (event.request.url.includes('/__vite_hmr') || event.request.url.includes('@react-refresh')) {
    return; // Let these pass through without SW interference
  }

  const strategy = getCacheStrategy(event.request);
  
  // Wrap in try-catch to ensure we always respond
  try {
    let responsePromise;
    
    switch (strategy) {
      case 'cache-first':
        responsePromise = cacheFirst(event.request);
        break;
      case 'stale-while-revalidate':
        responsePromise = staleWhileRevalidate(event.request);
        break;
      case 'network-first':
      default:
        // Use navigation preload response if available
        responsePromise = networkFirst(event.request, event.preloadResponse);
        break;
    }
    
    // Ensure we always respond with a valid Response
    event.respondWith(
      responsePromise.then(response => {
        // Ensure response is valid
        if (!response || !(response instanceof Response)) {
          return fetch(event.request).catch(() => {
            return new Response('Service unavailable', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        }
        return response;
      }).catch(error => {
        console.error('[Service Worker] Fetch error:', error);
        // Fallback: try to fetch directly without caching
        return fetch(event.request).catch(() => {
          return new Response('Service unavailable', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
    );
  } catch (error) {
    console.error('[Service Worker] Fetch handler error:', error);
    // Ultimate fallback - fetch directly
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('Service unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
  }
});

// Push Notification Handler
self.addEventListener('push', event => {
  console.log('[Service Worker] Push notification received');
  
  let notificationData = {
    title: 'TypeMasterAI',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: []
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      const resolvedType = payload.type || payload?.data?.type;
      notificationData = {
        ...notificationData,
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        data: {
          url: payload.url || notificationData.data.url,
          timestamp: Date.now(),
          type: resolvedType,
          ...payload.data
        },
        tag: payload.tag || `notification-${Date.now()}`,
        requireInteraction: payload.requireInteraction || false
      };

      // Prefer server-provided actions when present
      if (Array.isArray(payload.actions) && payload.actions.length > 0) {
        notificationData.actions = payload.actions;
      } else {
        // Add context-specific actions
        if (resolvedType === 'daily_reminder') {
          notificationData.actions = [
            { action: 'start_test', title: 'Start Test', icon: '/icon-96x96.png' },
            { action: 'dismiss', title: 'Later' }
          ];
        } else if (resolvedType === 'streak_warning') {
          notificationData.actions = [
            { action: 'save_streak', title: 'Save Streak!', icon: '/icon-96x96.png' },
            { action: 'dismiss', title: 'Ignore' }
          ];
        } else if (resolvedType === 'race_invite') {
          notificationData.actions = [
            { action: 'join_race', title: 'Join Race', icon: '/icon-96x96.png' },
            { action: 'dismiss', title: 'Decline' }
          ];
        } else if (resolvedType === 'achievement_unlock') {
          notificationData.actions = [
            { action: 'view_achievement', title: 'View', icon: '/icon-96x96.png' }
          ];
        } else {
          notificationData.actions = [
            { action: 'view', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' }
          ];
        }
      }
    } catch (error) {
      console.error('[Service Worker] Error parsing push payload:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click:', event.action);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  const action = event.action;

  // Handle different actions
  if (action === 'dismiss') {
    // Just close the notification
    return;
  }

  // Track notification click
  if (event.notification.data?.notificationId) {
    fetch('/api/notifications/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        notificationId: event.notification.data.notificationId,
        action: action || 'default'
      })
    }).catch(err => console.error('[Service Worker] Failed to track click:', err));
  }

  // Determine target URL based on action
  let targetUrl = urlToOpen;
  if (action === 'start_test' || action === 'save_streak') {
    targetUrl = '/';
  } else if (action === 'join_race') {
    targetUrl = event.notification.data?.raceUrl || '/multiplayer';
  } else if (action === 'view_achievement') {
    targetUrl = '/profile';
  } else if (action === 'view') {
    targetUrl = urlToOpen;
  }

  // Open or focus window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if there's already a window open
        for (let client of windowClients) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle Push Subscription Changes (e.g., expired)
self.addEventListener('pushsubscriptionchange', event => {
  console.log('[Service Worker] Push subscription changed');
  
  // First fetch the VAPID public key from the server
  event.waitUntil(
    fetch('/api/notifications/vapid-public-key')
      .then(res => res.json())
      .then(({ publicKey }) => {
        if (!publicKey) {
          throw new Error('No VAPID public key available');
        }
        return self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
      })
      .then(subscription => {
        console.log('[Service Worker] Re-subscribed to push');
        return fetch('/api/notifications/update-subscription', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(subscription)
        });
      })
      .catch(error => {
        console.error('[Service Worker] Re-subscription failed:', error);
      })
  );
});

// Background Sync (for offline actions)
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-test-results') {
    event.waitUntil(syncTestResults());
  }
});

// Helper: Sync test results when online
async function syncTestResults() {
  try {
    const cache = await caches.open('pending-requests');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        await fetch(request.clone());
        await cache.delete(request);
      } catch (error) {
        console.error('[Service Worker] Failed to sync request:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Helper: Convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

console.log('[Service Worker] Loaded successfully, version:', BUILD_ID);
