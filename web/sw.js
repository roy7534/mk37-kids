// Offline cache: the app keeps working without internet after the first visit.
const CACHE = 'mk37kids-v3';
const FILES = ['./', 'index.html', 'stickers.html', 'css/style.css', 'js/songs.js', 'js/phrases.js', 'js/audio.js', 'js/voice.js', 'js/input.js', 'js/art.js', 'js/app.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
// Network first (so updates arrive), cache fallback (so it works offline).
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
