const CACHE = 'aj-p0-v8';
const ASSETS = ['./index.html', './style.css', './ledger.js', './sync.js', './firebase-config.js', './app.js', './manifest.json', './icon.svg'];
const SHELL = { '/': 1, '/index.html': 1, '/style.css': 1, '/ledger.js': 1, '/sync.js': 1, '/firebase-config.js': 1, '/app.js': 1, '/manifest.json': 1, '/icon.svg': 1 };
function blockedHost(host) {
  return host === 'firestore.googleapis.com' || host.endsWith('.firestore.googleapis.com')
    || host === 'identitytoolkit.googleapis.com' || host.endsWith('.identitytoolkit.googleapis.com')
    || host === 'securetoken.googleapis.com' || host.endsWith('.securetoken.googleapis.com');
}
function isShell(url) {
  if (url.origin !== self.location.origin) return false;
  const path = url.pathname.length > 1 && url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
  if (path === '' || path === '/') return true;
  return SHELL[path.slice(path.lastIndexOf('/'))] === 1 || SHELL[path] === 1;
}
function isSdk(url) {
  return url.hostname === 'www.gstatic.com' && url.pathname.indexOf('/firebasejs/') === 0;
}
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (blockedHost(url.hostname) || (!isShell(url) && !isSdk(url))) return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy).catch(() => {})); }
    return res;
  })));
});
