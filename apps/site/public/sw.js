/* Retirement update for the legacy site worker. No fetch handler or client reload. */

const CACHE = "bc-site-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Exact ownership matters: other same-origin caches can contain game data.
    await caches.delete(CACHE).catch(() => {});
    await self.clients.claim().catch(() => {});
    await self.registration.unregister();
  })());
});
