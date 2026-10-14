/* Service worker : l'app fonctionne hors ligne une fois chargée.
   Incrémenter VERSION à chaque mise en ligne pour forcer la mise à jour du cache. */
const VERSION = 'ardoise-v2';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest',
  'src/styles.css', 'src/app.js',
  'src/games/skull-king/scoring.js', 'src/games/skull-king/rules-fr.js',
  'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Réseau d'abord (pour recevoir les mises à jour), cache en secours hors ligne.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request))
  );
});
