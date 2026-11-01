// The service worker serves the app shell. It must not replay a failed response,
// a different query string, or a cached Firestore/Auth reply.
const http = require('http');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { openChrome, waitForPage } = require('./chrome-debug.js');

const ROOT = path.join(__dirname, '../public');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const badHits = new Map();

function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/style.css' && url.searchParams.has('v')) {
      res.writeHead(200, { 'content-type': 'text/css', 'cache-control': 'no-store' });
      res.end('QUERY' + url.searchParams.get('v'));
      return;
    }
    if (url.pathname === '/app.js' && url.searchParams.get('bad') === '1') {
      const n = (badHits.get(url.pathname) || 0) + 1;
      badHits.set(url.pathname, n);
      if (n === 1) {
        res.writeHead(500, { 'content-type': 'text/plain', 'cache-control': 'no-store' });
        res.end('CACHED500');
      } else {
        res.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-store' });
        res.end('FRESH');
      }
      return;
    }
    const file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('missing'); return;
    }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function kill(chrome) {
  if (chrome && chrome.pid) { try { process.kill(-chrome.pid, 'SIGKILL'); } catch (e) { try { chrome.kill('SIGKILL'); } catch (e2) {} } }
}

async function connect(port, chrome) {
  const tgt = await waitForPage(port, chrome);
  const ws = new WebSocket(tgt.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = () => reject(new Error('debugger socket failed')); });
  let id = 0; const pend = {};
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } };
  const send = (method, params = {}) => new Promise(resolve => { pend[++id] = resolve; ws.send(JSON.stringify({ id, method, params })); });
  const ev = async expression => {
    const res = await Promise.race([
      send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }),
      new Promise((_, no) => setTimeout(() => no(new Error('eval timed out')), 8000)),
    ]);
    const details = res.result && res.result.exceptionDetails;
    if (details) throw new Error(details.text || (details.exception && details.exception.description) || 'eval failed');
    return res.result.result.value;
  };
  await send('Page.enable');
  await send('Runtime.enable');
  return { send, ev, close: () => { try { ws.close(); } catch (e) {} } };
}

async function openControlled(session, origin) {
  await session.send('Page.navigate', { url: origin + '/index.html?role=owner' });
  assert.equal(await wait(session, `document.body && document.body.dataset.ready === '1'`, 20000), true, 'page ready');
  if (!(await wait(session, `navigator.serviceWorker.controller`, 8000))) {
    await session.send('Page.reload', {});
    assert.equal(await wait(session, `document.body && document.body.dataset.ready === '1' && navigator.serviceWorker.controller`, 20000), true, 'service worker controls the page');
  }
}

function wait(session, expr, ms) {
  const start = Date.now();
  return (async () => {
    while (Date.now() - start < ms) {
      try { if (await session.ev(expr)) return true; } catch (e) {}
      await sleep(200);
    }
    return false;
  })();
}

test('service worker does not serve a cached error or a different query', { timeout: 60000 }, async () => {
  badHits.clear();
  const server = await startServer();
  const { port } = server.address();
  const origin = 'http://127.0.0.1:' + port;
  const dir = '/tmp/aj-sw-' + port;
  const opened = await openChrome({ userDataDir: dir, detached: true });
  const chrome = opened.chrome;
  let session;
  try {
    session = await connect(opened.port, chrome);
    await openControlled(session, origin);
    const queries = await session.ev(`Promise.all(['1','2'].map(v => fetch('style.css?v=' + v).then(r => r.text())))`);
    assert.deepEqual(queries, ['QUERY1', 'QUERY2']);
    const first = await session.ev(`fetch('app.js?bad=1').then(r => r.text())`);
    const second = await session.ev(`fetch('app.js?bad=1').then(r => r.text())`);
    assert.equal(first, 'CACHED500');
    assert.equal(second, 'FRESH');
  } finally {
    if (session) session.close();
    kill(chrome);
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a shell file is refetched when the HTTP cache still holds the previous copy', { timeout: 60000 }, async () => {
  let generation = 0;
  const shellHits = [];
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/style.css') {
      generation += 1;
      shellHits.push({
        generation,
        cacheControl: String(req.headers['cache-control'] || ''),
        pragma: String(req.headers['pragma'] || ''),
      });
      res.writeHead(200, { 'content-type': 'text/css', 'cache-control': 'public, max-age=3600' });
      res.end('GEN' + generation);
      return;
    }
    const file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('missing'); return;
    }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
    const cacheControl = path.basename(file) === 'sw.js' ? 'no-cache, max-age=0' : 'no-cache';
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': cacheControl });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const origin = 'http://127.0.0.1:' + port;
  const dir = '/tmp/aj-sw-fresh-' + port;
  const opened = await openChrome({ userDataDir: dir, detached: true });
  const chrome = opened.chrome;
  let session;
  try {
    session = await connect(opened.port, chrome);
    await openControlled(session, origin);
    const before = shellHits.length;
    const first = await session.ev(`fetch('style.css').then(r => r.text())`);
    assert.ok(shellHits.length > before, 'style.css was served from the HTTP cache: ' + JSON.stringify(shellHits));
    const hit = shellHits[shellHits.length - 1];
    assert.equal(first, 'GEN' + hit.generation, 'the page kept an older stylesheet');
    assert.match(hit.cacheControl + ' ' + hit.pragma, /no-cache|max-age=0/, JSON.stringify(hit));
    const mid = shellHits.length;
    const second = await session.ev(`fetch('style.css').then(r => r.text())`);
    assert.ok(shellHits.length > mid, 'the second shell fetch did not reach the server');
    assert.equal(second, 'GEN' + shellHits[shellHits.length - 1].generation);
    assert.notEqual(first, second);
  } finally {
    if (session) session.close();
    kill(chrome);
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('service worker does not answer Firestore or Auth hosts from cache', { timeout: 60000 }, async () => {
  const server = await startServer();
  const { port } = server.address();
  const origin = 'http://127.0.0.1:' + port;
  const dir = '/tmp/aj-sw-host-' + port;
  const opened = await openChrome({ userDataDir: dir, detached: true });
  const chrome = opened.chrome;
  let session;
  try {
    session = await connect(opened.port, chrome);
    await openControlled(session, origin);
    const bodies = await session.ev(`(async () => {
      const hosts = ['https://firestore.googleapis.com/v1/poison', 'https://identitytoolkit.googleapis.com/v1/poison', 'https://securetoken.googleapis.com/v1/poison'];
      const cache = await caches.open('poison-api');
      for (const url of hosts) await cache.put(url, new Response('POISON', { status: 200 }));
      const out = [];
      for (const url of hosts) {
        try { out.push(await fetch(url).then(r => r.text())); }
        catch (e) { out.push('ERR'); }
      }
      return out;
    })()`);
    for (const body of bodies) assert.notEqual(body, 'POISON', 'cached API response was served: ' + JSON.stringify(bodies));
  } finally {
    if (session) session.close();
    kill(chrome);
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
