const CACHE_NAME = 'desert-rose-guitar-v2'

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all([
        // Delete old caches
        ...cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
        // Claim all clients immediately
        self.clients.claim()
      ])
    })
  )
})

// Fetch event - completely skip intercepting for now to avoid issues
self.addEventListener('fetch', (event) => {
  // Don't intercept anything - let browser handle all requests
  // This ensures modules load correctly
  return
})

