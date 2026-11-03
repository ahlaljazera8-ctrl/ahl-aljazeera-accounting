// Hosting must not leave the app shell in the browser HTTP cache for an hour.
// The same matcher the hosting emulator uses (minimatch, later rules win) is
// applied to firebase.json so a glob that misses index.html or app.js fails here.
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const minimatch = require('minimatch');

const ROOT = path.join(__dirname, '..');

function cacheControl(pathname) {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'firebase.json'), 'utf8'));
  let value = null;
  for (const rule of cfg.hosting.headers) {
    if (!minimatch(pathname, rule.source)) continue;
    const header = (rule.headers || []).find(h => h.key === 'Cache-Control');
    if (header) value = header.value;
  }
  return value;
}

test('firebase.json sets no-cache on the app shell and keeps sw.js no-cache', () => {
  for (const pathname of ['/', '/index.html', '/app.js', '/style.css', '/print.css', '/ledger.js', '/sync.js', '/sync-status.js', '/dom-safe.js', '/appcheck.js', '/firebase-config.js', '/manifest.json', '/icon.svg']) {
    assert.equal(cacheControl(pathname), 'no-cache', pathname);
  }
  assert.equal(cacheControl('/sw.js'), 'no-cache, max-age=0');
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'firebase.json'), 'utf8'));
  const security = cfg.hosting.headers.find(h => h.source === '**');
  assert.ok(security.headers.some(h => h.key === 'Content-Security-Policy'));
  assert.equal(security.headers.some(h => h.key === 'Cache-Control'), false);
  assert.equal(cacheControl('/session.js'), 'no-cache');
});

test('session.js is a classic script loaded before app.js and precached with the shell', () => {
  const html = fs.readFileSync(path.join(ROOT, 'public/index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'public/sw.js'), 'utf8');
  const session = fs.readFileSync(path.join(ROOT, 'public/session.js'), 'utf8');
  const sessionAt = html.indexOf('src="session.js"');
  const appAt = html.indexOf('src="app.js"');
  assert.ok(sessionAt > 0 && appAt > sessionAt);
  assert.equal(html.includes('type="module"'), false);
  assert.match(sw, /const VERSION = 'aj-p0-v33'/);
  assert.match(sw, /\.\/session\.js/);
  assert.match(sw, /'\/session\.js': 1/);
  assert.match(session, /window\.AJ/);
  assert.equal(session.includes('import '), false);
  assert.equal(session.includes('export '), false);
});
