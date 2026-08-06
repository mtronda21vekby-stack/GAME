/* BlackCrown site service worker.
 *
 * Navigation is deliberately network-only with a small offline response. We do
 * not cache index.html because stale HTML can reference hashed JavaScript files
 * that no longer exist after a deployment, leaving Safari on a blank black page.
 */

const CACHE = "bc-site-v3";
const CACHE_PREFIX = "bc-site-";
const STATIC = ["/manifest.webmanifest"];

const OFFLINE_HTML = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <meta name="color-scheme" content="dark" />
  <title>BlackCrown — offline</title>
  <style>
    html,body{height:100%;margin:0;background:#000;color:#eefaff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    body{display:grid;place-items:center;padding:24px;box-sizing:border-box;text-align:center}
    main{max-width:520px}
    strong{display:block;font-size:28px;letter-spacing:-.04em}
    p{color:rgba(224,242,255,.68);line-height:1.55}
    button{min-height:46px;padding:0 18px;border:1px solid rgba(0,217,255,.44);border-radius:14px;background:rgba(0,92,118,.36);color:#eaffff;font-weight:800}
  </style>
</head>
<body>
  <main>
    <strong>BLACKCROWN</strong>
    <p>Нет соединения с сервером. Проверь интернет и повтори загрузку.</p>
    <button onclick="location.reload()">Повторить</button>
  </main>
</body>
</html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(async (cache) => {
        await Promise.all(
          STATIC.map(async (url) => {
            try {
              const response = await fetch(url, { cache: "reload" });
              if (response.ok) await cache.put(url, response);
            } catch {
              // Optional metadata must never block service-worker installation.
            }
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => (key.startsWith(CACHE_PREFIX) && key !== CACHE ? caches.delete(key) : undefined))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin || request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(
        () =>
          new Response(OFFLINE_HTML, {
            status: 503,
            headers: {
              "content-type": "text/html; charset=utf-8",
              "cache-control": "no-store",
            },
          })
      )
    );
    return;
  }

  const isHashedAsset = url.pathname.startsWith("/assets/");
  const isPwaAsset = url.pathname.startsWith("/pwa/");

  if (isHashedAsset || isPwaAsset) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        if (cached) return cached;

        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      })
    );
  }
});
