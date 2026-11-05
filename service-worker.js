/* service-worker.js – Offline-Betrieb.
 * Beim Installieren werden alle App-Dateien gecacht. Danach gilt „stale-while-revalidate":
 * die App startet sofort aus dem Cache und lädt im Hintergrund neue Versionen nach.
 * Für ein sauberes Update aller Nutzer: CACHE-Version erhöhen.
 */
const CACHE = 'tabata-v9';
const ASSETS = [
  './', 'index.html', 'style.css', 'texts.js', 'app.js', 'views.js', 'exercises.js', 'illustrations.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' umgeht den HTTP-Cache des Hosters, damit wirklich die neuen Dateien gespeichert werden
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((a) => new Request(a, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  const network = fetch(req)
    .then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    })
    .catch(() => null);
  e.waitUntil(network);

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => cached || network.then((res) =>
      res || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))),
  );
});
