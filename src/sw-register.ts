// Register service worker for PWA
if ('serviceWorker' in navigator) {
	// First, unregister all existing service workers to clear old cache
	navigator.serviceWorker.getRegistrations().then((registrations) => {
		for (const registration of registrations) {
			registration.unregister()
		}
		
		// Clear all caches
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => caches.delete(cacheName))
			)
		}).then(() => {
			// Wait for page to be fully loaded before registering new SW
			window.addEventListener('load', () => {
				// Small delay to ensure page is fully loaded
				setTimeout(() => {
					navigator.serviceWorker
						.register('/sw.js', { scope: '/' })
						.then((registration) => {
							console.log('SW registered: ', registration)
							
							// Check for updates
							registration.addEventListener('updatefound', () => {
								const newWorker = registration.installing
								if (newWorker) {
									newWorker.addEventListener('statechange', () => {
										if (
											newWorker.state === 'installed' &&
											navigator.serviceWorker.controller
										) {
											// New service worker available, reload page
											window.location.reload()
										}
									})
								}
							})
						})
						.catch((registrationError) => {
							console.log('SW registration failed: ', registrationError)
						})
				}, 100)
			})
		})
	})
}

