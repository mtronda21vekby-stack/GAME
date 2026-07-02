const APP_VERSION = "v0.00.3-alpha-passive-sw";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", () => {
  // Passive mode: do not intercept requests. The game must always load from network.
});
