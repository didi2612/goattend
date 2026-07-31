self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Passthrough fetch handler: required by browsers' installability
// criteria, but this app is dynamic (auth, live data), so requests
// always go to the network rather than a cache.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
