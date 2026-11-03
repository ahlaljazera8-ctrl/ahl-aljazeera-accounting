const VERSION = 'aj-p0-v30';
const ASSETS = ['./index.html', './style.css', './print.css', './ledger.js', './sync.js', './sync-status.js', './dom-safe.js', './appcheck.js', './firebase-config.js', './app.js', './manifest.json', './icon.svg'];
const SHELL = { '/': 1, '/index.html': 1, '/style.css': 1, '/print.css': 1, '/ledger.js': 1, '/sync.js': 1, '/sync-status.js': 1, '/dom-safe.js': 1, '/appcheck.js': 1, '/firebase-config.js': 1, '/app.js': 1, '/manifest.json': 1, '/icon.svg': 1 };

function isShell(url) {
  if (url.origin !== self.location.origin) return false;
  const path = url.pathname.length > 1 && url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
  if (path === '' || path === '/') return true;
  const base = path.slice(path.lastIndexOf('/'));
  return SHELL[base] === 1 || SHELL[path] === 1;
}

self.addEventListener('install', e => { e.waitUntil(self.skipWaiting()); });

const healedClients = new Set();
async function healWindows() {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of windows) {
    if (healedClients.has(client.id)) continue;
    let url;
    try { url = new URL(client.url); } catch (err) { continue; }
    if (!url.protocol.startsWith('http')) continue;
    if (url.searchParams.get('sw') === VERSION) { healedClients.add(client.id); continue; }
    healedClients.add(client.id);
    url.searchParams.set('sw', VERSION);
    // Do not await navigate: waiting for it inside activate deadlocks the new page load.
    const nav = client.navigate && client.navigate(url.href);
    if (nav && nav.catch) nav.catch(() => {});
  }
}
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    const heal = keys.some(k => k !== VERSION);
    await Promise.all(keys.map(k => caches.delete(k)));
    try {
      await (await caches.open(VERSION)).addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })));
    } catch (err) {}
    await self.clients.claim();
    if (!heal) return;
    await healWindows();
    await new Promise(r => setTimeout(r, 400));
    await healWindows();
  })());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || !isShell(url)) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(e.request, { cache: 'no-cache' });
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      const hit = await caches.match(e.request);
      if (hit) return hit;
      throw err;
    }
  })());
});
