/* Mijn Meterstand - service worker
   Eigen cache-voorvoegsel: raakt nooit de opslag van andere apps op ron78nl.github.io aan. */
const PREFIX = "mtr-";
const CACHE  = PREFIX + "2";
const FILES  = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((namen) => Promise.all(
      namen.filter((n) => n.startsWith(PREFIX) && n !== CACHE).map((n) => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // P1-uitlezer e.d. nooit cachen
  const SCOPE = new URL(self.registration.scope).pathname;
  if (!url.pathname.startsWith(SCOPE)) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("./index.html", { ignoreSearch: true }))
    );
    return;
  }
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});
