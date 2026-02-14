const CACHE='bc-site-v1';
const CORE=['/','/site/','/site/index.html','/site/assets/app.css','/site/assets/app.js','/site/assets/favicon.svg','/site/assets/grain.svg','/site/manifest.webmanifest','/site/privacy.html','/site/terms.html','/site/support.html'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.pathname.startsWith('/game/'))return;
e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('/site/index.html'))));});
