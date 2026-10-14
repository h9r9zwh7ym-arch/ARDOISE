// Ardoise — service worker (même principe que Zeste et ASCEN) : l'app s'ouvre instantanément,
// avec ou sans réseau. Stratégie « cache d'abord, mise à jour en arrière-plan » : chaque fichier
// est servi depuis la copie locale, puis sa dernière version est téléchargée discrètement.
// Si un fichier a changé, la page est prévenue (« ardoise-updated ») et applique la mise à jour.
// Hors réseau, le téléchargement échoue en silence et rien ne casse.
const CACHE = 'ardoise-v5';
const CORE = [
  './', './index.html', './manifest.webmanifest',
  './src/styles.css', './src/app.js',
  './src/core/store.js', './src/core/scoring.js', './src/core/ui.js',
  './src/games/registry.js',
  './src/games/skull-king/index.js', './src/games/skull-king/scoring.js', './src/games/skull-king/rules-fr.js',
  './src/games/skyjo/index.js', './src/games/skyjo/scoring.js', './src/games/skyjo/rules-fr.js',
  './fonts/fraunces-latin.woff2', './fonts/manrope-latin.woff2',
  './icons/apple-touch-icon.png', './icons/icon-192.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    // Zeste, ASCEN et Ardoise partagent la même origine (h9r9zwh7ym-arch.github.io), donc le même
    // stockage de caches : on ne supprime que les anciens caches d'Ardoise, jamais ceux des autres apps.
    .then(keys => Promise.all(keys.filter(k => k.startsWith('ardoise-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// empreinte d'une réponse : ETag, sinon date de modification, sinon taille
const tag = r => r && (r.headers.get('etag') || r.headers.get('last-modified') || r.headers.get('content-length'));

// télécharge et met en cache ; prévient les pages ouvertes si le contenu a changé
async function refresh(req, key) {
  const cache = await caches.open(CACHE);
  const res = await fetch(req, { cache: 'no-cache' });
  if (!res || !res.ok) return res;
  const old = await cache.match(key);
  const oldTag = tag(old), newTag = tag(res);
  await cache.put(key, res.clone());
  if (old && oldTag && newTag && oldTag !== newTag) {
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(c => c.postMessage({ type: 'ardoise-updated' }));
  }
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const nav = req.mode === 'navigate';
  const key = nav ? './index.html' : req;
  e.respondWith((async () => {
    const hit = await caches.match(key, { ignoreSearch: nav });
    const update = refresh(nav ? new Request('./index.html') : req, key).catch(() => null);
    if (hit) { e.waitUntil(update); return hit; }
    // premier lancement : réseau, avec la copie en cache en dernier recours
    const res = await update;
    return res || (nav && await caches.match('./index.html')) || Response.error();
  })());
});

// la page demande une vérification (retour au premier plan) : on revérifie tous les fichiers de l'app
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'ardoise-check') {
    e.waitUntil(Promise.all(CORE.map(u => refresh(new Request(u), u === './' ? './index.html' : u).catch(() => null))));
  }
});
