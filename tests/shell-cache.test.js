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
  // Q5: next free number at rebase. Date fix is v59 and export is v60, so this pin is v61 and stays renumberable.
  assert.match(sw, /const VERSION = 'aj-p0-v73'/);
  assert.match(sw, /\.\/session\.js/);
  assert.match(sw, /'\/session\.js': 1/);
  assert.match(session, /window\.AJ/);
  assert.equal(session.includes('import '), false);
  assert.equal(session.includes('export '), false);
});

test('firebase-client.js is a classic script between session.js and app.js and is precached', () => {
  const html = fs.readFileSync(path.join(ROOT, 'public/index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'public/sw.js'), 'utf8');
  const src = fs.readFileSync(path.join(ROOT, 'public/firebase-client.js'), 'utf8');
  const sessionAt = html.indexOf('src="session.js"');
  const clientAt = html.indexOf('src="firebase-client.js"');
  const appAt = html.indexOf('src="app.js"');
  assert.ok(sessionAt > 0 && clientAt > sessionAt && appAt > clientAt);
  assert.equal(/^\s*import\s/m.test(src), false);
  assert.equal(src.includes('export '), false);
  assert.match(src, /function loadFirebase/);
  assert.match(src, /flushOutbox/);
  assert.match(sw, /\.\/firebase-client\.js/);
  assert.match(sw, /'\/firebase-client\.js': 1/);
  // Q5: next free number at rebase. Date fix is v59 and export is v60, so this pin is v61 and stays renumberable.
  assert.match(sw, /const VERSION = 'aj-p0-v73'/);
  assert.equal(cacheControl('/firebase-client.js'), 'no-cache');
});

test('render.js is a classic script between firebase-client.js and app.js and is precached', () => {
  const html = fs.readFileSync(path.join(ROOT, 'public/index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'public/sw.js'), 'utf8');
  const src = fs.readFileSync(path.join(ROOT, 'public/render.js'), 'utf8');
  const clientAt = html.indexOf('src="firebase-client.js"');
  const foremenAt = html.indexOf('src="foremen.js"');
  const peopleAt = html.indexOf('src="people-dir.js"');
  const accountsAt = html.indexOf('src="accounts.js"');
  const accountsViewAt = html.indexOf('src="accounts-view.js"');
  const accountsWorkAt = html.indexOf('src="accounts-work.js"');
  const accountsPaymentAt = html.indexOf('src="accounts-payment.js"');
  const renderAt = html.indexOf('src="render.js"');
  const appAt = html.indexOf('src="app.js"');
  assert.ok(clientAt > 0 && foremenAt > clientAt && peopleAt > foremenAt && accountsAt > peopleAt && accountsViewAt > accountsAt && accountsWorkAt > accountsViewAt && accountsPaymentAt > accountsWorkAt && renderAt > accountsPaymentAt && appAt > renderAt);
  assert.match(sw, /\.\/accounts\.js/);
  assert.match(sw, /\.\/accounts-view\.js/);
  assert.match(sw, /\.\/accounts-work\.js/);
  assert.match(sw, /'\/accounts-work\.js': 1/);
  assert.match(sw, /\.\/accounts-payment\.js/);
  assert.match(sw, /'\/accounts-payment\.js': 1/);
  assert.match(sw, /'\/accounts\.js': 1/);
  assert.match(sw, /\.\/foremen\.js/);
  assert.match(sw, /'\/foremen\.js': 1/);
  assert.match(sw, /\.\/people-dir\.js/);
  assert.match(sw, /'\/people-dir\.js': 1/);
  assert.equal(cacheControl('/people-dir.js'), 'no-cache');
  assert.equal(/^\s*import\s/m.test(src), false);
  assert.equal(src.includes('export '), false);
  assert.match(src, /function render/);
  assert.match(src, /addEventListener\('click'/);
  assert.match(sw, /\.\/render\.js/);
  assert.match(sw, /'\/render\.js': 1/);
  // Q5: next free number at rebase. Date fix is v59 and export is v60, so this pin is v61 and stays renumberable.
  assert.match(sw, /const VERSION = 'aj-p0-v73'/);
  assert.equal(cacheControl('/render.js'), 'no-cache');
});
