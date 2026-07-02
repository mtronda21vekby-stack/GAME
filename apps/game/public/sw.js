const CACHE_NAME = "evofish-shell-v2";
const APP_VERSION = "v0.00.2-alpha-pwa2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function noStoreRequest(request) {
  return new Request(request.url, {
    method: request.method,
    headers: request.headers,
    mode: request.mode,
    credentials: request.credentials,
    redirect: request.redirect,
    referrer: request.referrer,
    cache: "reload"
  });
}

async function networkOnly(request) {
  const response = await fetch(noStoreRequest(request));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname === "/game/" ||
    url.pathname === "/game/index.html" ||
    url.pathname === "/game/manifest.webmanifest" ||
    url.pathname === "/game/sw.js" ||
    url.pathname.includes("/evofish/")
  ) {
    event.respondWith(networkOnly(request));
  }
});
