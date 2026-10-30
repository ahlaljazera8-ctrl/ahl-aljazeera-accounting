// Coming back online must drain the outbox without a reload, the send button
// must do the same, and a pull that fails in flight must not reject unhandled
// or leave the header pill behind the real outbox.
// Emulators only. Never call production.
const fs = require('fs');
const http = require('http');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { initializeApp, deleteApp } = require('firebase/app');
const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { doc, setDoc, getDoc } = require('firebase/firestore');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

const ROOT = path.join(__dirname, '../../public');
const PROJECT = 'ahl-aljazeera-accounting';
const EMAIL = 'offline.reconnect@example.invalid';
const PASS = 'emulator-only-pass';
const DISPLAY = 'أحمد (تجريبي)';
const PROJECT_ID = 'p-reconnect';
function productionHost(url) {
  try {
    const host = new URL(url).hostname;
    return /(^|\.)googleapis\.com$/.test(host) || /(^|\.)firebaseio\.com$/.test(host);
  } catch (e) { return false; }
}

const CSP = [
  "default-src 'self'",
  "script-src 'self' https://www.gstatic.com https://apis.google.com",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://www.gstatic.com http://127.0.0.1:9099 http://127.0.0.1:8080",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "frame-src https://ahl-aljazeera-accounting.firebaseapp.com http://127.0.0.1:9099",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const sleep = ms => new Promise(r => setTimeout(r, ms));
let testEnv;
let server;
let origin;
let browser;
let uid;

function localHost(name) {
  const raw = process.env[name];
  if (!raw || !/^(127\.0\.0\.1|localhost):\d+$/.test(raw)) {
    throw new Error(name + ' must be a local emulator (refusing production). Got: ' + raw);
  }
  const [host, port] = raw.split(':');
  return { host, port: Number(port) };
}

function startServer() {
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    const rel = u.pathname === '/' ? '/index.html' : decodeURIComponent(u.pathname);
    const file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('missing'); return;
    }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
    res.writeHead(200, {
      'content-type': types[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-cache',
      'content-security-policy': CSP,
    });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => srv.listen(0, '127.0.0.1', () => resolve(srv)));
}

async function serverEntry(id) {
  let data = null;
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const snap = await getDoc(doc(ctx.firestore(), 'ledgerEntries', id));
    data = snap.exists() ? snap.data() : null;
  });
  return data;
}

async function openSession() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    window.__unhandled = [];
    addEventListener('unhandledrejection', event => {
      const reason = event.reason;
      window.__unhandled.push(String((reason && (reason.message || reason)) || 'rejection'));
    });
  });
  const page = await context.newPage();
  const writes = [];
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(String(err && err.message || err)));
  page.on('request', req => {
    const url = req.url();
    if (productionHost(url)) pageErrors.push('production ' + url);
    if (url.includes('/Write/') && req.method() === 'POST') writes.push(req.postData() || '');
  });
  await page.goto(origin + '/index.html?emulator=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body && document.body.dataset.ready === '1');
  await page.fill('#login-email', EMAIL);
  await page.fill('#login-password', PASS);
  await page.click('#login-btn');
  await page.waitForFunction(() => document.querySelector('#shell') && document.querySelector('#shell').hidden === false, null, { timeout: 30000 });
  await page.waitForFunction(id => (window.AJ.get('projects') || []).some(p => p && p.id === id), PROJECT_ID, { timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('#outbox') && document.querySelector('#outbox').textContent.trim().endsWith(': 0'), null, { timeout: 20000 });
  return { context, page, writes, pageErrors };
}

async function saveOffline(page, note) {
  await page.evaluate(() => { location.hash = '#entry'; dispatchEvent(new HashChangeEvent('hashchange')); });
  await page.waitForSelector('[data-proj="' + PROJECT_ID + '"]');
  await page.click('[data-proj="' + PROJECT_ID + '"]');
  await page.click('[data-add="1000"]');
  await page.fill('#desc', note);
  await page.click('#save');
  const saved = await page.waitForFunction(desc => {
    const row = (window.AJ.get('entries') || []).find(e => e && e.description === desc);
    return row && row.id ? row.id : false;
  }, note, { timeout: 8000 });
  return saved.jsonValue();
}

async function snapshot(page) {
  return page.evaluate(() => {
    const el = document.querySelector('#sync-msg');
    const n = (window.AJ.get('outbox') || []).length;
    const pill = (document.querySelector('#outbox') || {}).textContent || '';
    return {
      onLine: navigator.onLine,
      outbox: window.AJ.get('outbox') || [],
      pill: pill.trim(),
      matches: pill.trim().endsWith(': ' + n),
      msg: el ? el.textContent : '',
      shown: !!(el && !el.hidden && (el.textContent || '').trim()),
      unhandled: window.__unhandled.slice(),
    };
  });
}

test.before(async () => {
  const fsHost = localHost('FIRESTORE_EMULATOR_HOST');
  const authHost = localHost('FIREBASE_AUTH_EMULATOR_HOST');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8'), host: fsHost.host, port: fsHost.port },
  });
  const app = initializeApp({ apiKey: 'demo', projectId: PROJECT, authDomain: 'localhost' }, 'offline-reconnect');
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://' + authHost.host + ':' + authHost.port, { disableWarnings: true });
  let cred;
  try { cred = await createUserWithEmailAndPassword(auth, EMAIL, PASS); }
  catch (err) {
    if (err && err.code === 'auth/email-already-in-use') cred = await signInWithEmailAndPassword(auth, EMAIL, PASS);
    else throw err;
  }
  uid = cred.user.uid;
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await setDoc(doc(d, 'users', uid), {
      displayName: DISPLAY, email: EMAIL, role: 'site', active: true,
      assignedProjectIds: [PROJECT_ID], createdAtServer: new Date(), createdBy: uid,
    });
    await setDoc(doc(d, 'projects', PROJECT_ID), {
      id: PROJECT_ID, name: 'TEST reconnect', clientName: 'زبون', location: 'السماوة', currency: 'IQD',
      status: 'active', createdAtDevice: 1, createdAtServer: new Date(), createdBy: uid, deviceId: 'admin',
    });
  });
  await deleteApp(app);
  server = await startServer();
  origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
});

test.after(async () => {
  if (browser) await browser.close();
  if (server) server.close();
  if (testEnv) await testEnv.cleanup();
});

test('an offline entry drains after reconnect with no reload and one write', { timeout: 120000 }, async () => {
  const session = await openSession();
  try {
    await session.context.setOffline(true);
    const id = await saveOffline(session.page, 'TEST ut حدث الاتصال');
    const queued = await snapshot(session.page);
    assert.equal(queued.onLine, false);
    assert.deepEqual(queued.outbox, [id]);
    assert.equal(queued.matches, true, 'pill while offline: ' + queued.pill);
    assert.equal(await serverEntry(id), null);

    await session.context.setOffline(false);
    await session.page.waitForFunction(entryId => {
      const n = (window.AJ.get('outbox') || []).length;
      const pill = document.querySelector('#outbox').textContent.trim();
      return !(window.AJ.get('outbox') || []).includes(entryId) && pill.endsWith(': ' + n) && n === 0;
    }, id, { timeout: 15000 });

    const stored = await serverEntry(id);
    assert.ok(stored, 'the entry was not written after reconnect');
    assert.equal(stored.amount, 1000);
    assert.equal(stored.createdBy, uid);
    assert.equal(stored.description, 'TEST ut حدث الاتصال');
    const bodies = session.writes.filter(body => body.includes(id));
    assert.equal(bodies.length, 1, 'write requests carrying this id: ' + bodies.length);
    const after = await snapshot(session.page);
    assert.equal(after.shown, false, 'a successful drain should not keep an error up');
    assert.deepEqual(after.unhandled, []);
    assert.deepEqual(session.pageErrors, []);
  } finally {
    await session.context.close();
  }
});

test('إرسال الآن sends a queued entry once after reconnect', { timeout: 120000 }, async () => {
  const session = await openSession();
  try {
    await session.context.setOffline(true);
    const id = await saveOffline(session.page, 'TEST ut إرسال الآن');
    await session.page.click('#send');
    await sleep(400);
    const held = await snapshot(session.page);
    assert.deepEqual(held.outbox, [id], 'send while offline must keep the entry');
    assert.equal(held.matches, true, held.pill);
    assert.equal(await serverEntry(id), null);

    await session.context.setOffline(false);
    await session.page.click('#send');
    await session.page.waitForFunction(entryId => {
      const n = (window.AJ.get('outbox') || []).length;
      const pill = document.querySelector('#outbox').textContent.trim();
      return !(window.AJ.get('outbox') || []).includes(entryId) && pill.endsWith(': ' + n);
    }, id, { timeout: 15000 });

    const stored = await serverEntry(id);
    assert.ok(stored, 'send now did not write the entry');
    assert.equal(stored.amount, 1000);
    assert.equal(stored.createdByName, DISPLAY);
    const bodies = session.writes.filter(body => body.includes(id));
    assert.equal(bodies.length, 1, 'write requests carrying this id: ' + bodies.length);
    const after = await snapshot(session.page);
    assert.equal(after.matches, true, after.pill + ' outbox ' + after.outbox.length);
    assert.deepEqual(after.unhandled, []);
  } finally {
    await session.context.close();
  }
});

test('a pull that fails in flight leaves no unhandled rejection and the pill matches the outbox', { timeout: 120000 }, async () => {
  const session = await openSession();
  try {
    // Hold the server read so the save can commit locally and the pull is still
    // in flight when the browser drops offline. That is the throw the page used
    // to leave unhandled, with the header still showing the previous count.
    let holdReads = false;
    const held = [];
    await session.page.route('**/*', async route => {
      const req = route.request();
      if (holdReads && req.method() === 'POST' && req.url().includes('Listen/channel')) {
        await new Promise(done => held.push({ route, done }));
        try { await route.abort('internetdisconnected'); } catch (e) {}
        return;
      }
      await route.continue();
    });
    holdReads = true;
    await session.page.evaluate(() => { location.hash = '#entry'; dispatchEvent(new HashChangeEvent('hashchange')); });
    await session.page.waitForSelector('[data-proj="' + PROJECT_ID + '"]');
    await session.page.click('[data-proj="' + PROJECT_ID + '"]');
    await session.page.click('[data-add="1000"]');
    await session.page.fill('#desc', 'TEST ut سحب فاشل');
    await session.page.click('#save');
    await session.page.waitForFunction(() => (window.AJ.get('entries') || []).some(e => e && e.description === 'TEST ut سحب فاشل'), null, { timeout: 8000 });
    await sleep(500);
    await session.context.setOffline(true);
    holdReads = false;
    for (const item of held.splice(0)) {
      try { await item.route.abort('internetdisconnected'); } catch (e) {}
      item.done();
    }
    const start = Date.now();
    let state = await snapshot(session.page);
    while (Date.now() - start < 8000 && !state.shown && state.unhandled.length === 0) {
      await sleep(200);
      state = await snapshot(session.page);
    }
    state = await snapshot(session.page);
    const noise = state.unhandled.concat(session.pageErrors);
    assert.deepEqual(noise, [], 'unhandled: ' + noise.join(' | ') + ' state ' + JSON.stringify(state));
    assert.equal(state.matches, true, 'pill ' + state.pill + ' outbox ' + state.outbox.length);
    assert.equal(state.shown, true, 'a failed sync should be visible: ' + JSON.stringify(state));
    assert.match(state.msg, /تعذر/);
    const id = await session.page.evaluate(() => {
      const row = (window.AJ.get('entries') || []).find(e => e && e.description === 'TEST ut سحب فاشل');
      return row && row.id;
    });
    const bodies = session.writes.filter(body => id && body.includes(id));
    assert.ok(bodies.length <= 1, 'the failed pull must not write this id twice: ' + bodies.length);
  } finally {
    await session.context.close();
  }
});
