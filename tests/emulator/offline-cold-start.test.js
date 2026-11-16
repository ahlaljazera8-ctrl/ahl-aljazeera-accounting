// A signed-in phone must reopen straight onto the ledger.
// Online, the login form must not flash while Firebase auth catches up.
// Offline, the ledger already on the phone must open even when the Firebase
// CDN cannot be fetched. A signed-out phone still gets the login form.
// Emulators only. Never call production.
const { spawnSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const { initializeApp, deleteApp } = require('firebase/app');
const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { doc, setDoc, getDoc } = require('firebase/firestore');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

const ROOT = path.join(__dirname, '../../public');
const PROJECT = 'ahl-aljazeera-accounting';
const PASS = 'emulator-only-pass';
const ARTIFACTS = '/opt/cursor/artifacts';
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

const watchLogin = () => {
  window.__loginSeen = false;
  const tick = () => {
    const login = document.getElementById('login');
    if (login && login.hidden === false) window.__loginSeen = true;
  };
  const arm = () => {
    if (!document.documentElement || document.documentElement.nodeType !== 1) return;
    tick();
    try {
      new MutationObserver(tick).observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['hidden'] });
    } catch (e) {}
  };
  arm();
  document.addEventListener('DOMContentLoaded', arm);
  setInterval(tick, 20);
};

function systemChrome() {
  const found = spawnSync('google-chrome', ['--version'], { encoding: 'utf8' });
  const version = (found.stdout || '').trim();
  if (found.status !== 0 || !version) {
    throw new Error('google-chrome was not found on PATH. offline-cold-start uses the runner Chrome, the same binary as the browser job, not Playwright\'s downloaded Chromium.');
  }
  return version;
}

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
    const cache = rel === '/sw.js' ? 'no-cache, max-age=0' : 'no-cache';
    res.writeHead(200, {
      'content-type': types[path.extname(file)] || 'application/octet-stream',
      'cache-control': cache,
      'content-security-policy': CSP,
    });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => srv.listen(0, '127.0.0.1', () => resolve(srv)));
}

async function shot(page, name) {
  try {
    fs.mkdirSync(ARTIFACTS, { recursive: true });
    await page.screenshot({ path: path.join(ARTIFACTS, name + '.png'), fullPage: true });
  } catch (e) {}
}

let testEnv;
let server;
let origin;
let browsers;

test.before(async () => {
  const fsHost = localHost('FIRESTORE_EMULATOR_HOST');
  localHost('FIREBASE_AUTH_EMULATOR_HOST');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8'), host: fsHost.host, port: fsHost.port },
  });
  server = await startServer();
  origin = 'http://127.0.0.1:' + server.address().port;
  const chrome = systemChrome();
  console.log('offline-cold-start chrome: ' + chrome);
  browsers = {
    chromium: await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] }),
    webkit: await webkit.launch({ headless: true }),
  };
});

test.after(async () => {
  if (browsers) {
    await Promise.all(Object.values(browsers).map(b => b.close().catch(() => {})));
  }
  if (server) server.close();
  if (testEnv) await testEnv.cleanup();
});

async function seedUser(email, role, projectId, projectName, entryDesc) {
  const authHost = localHost('FIREBASE_AUTH_EMULATOR_HOST');
  const app = initializeApp({ apiKey: 'demo', projectId: PROJECT, authDomain: 'localhost' }, 'cold-' + email);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://' + authHost.host + ':' + authHost.port, { disableWarnings: true });
  let cred;
  try { cred = await createUserWithEmailAndPassword(auth, email, PASS); }
  catch (err) {
    if (err && err.code === 'auth/email-already-in-use') cred = await signInWithEmailAndPassword(auth, email, PASS);
    else throw err;
  }
  const uid = cred.user.uid;
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await setDoc(doc(d, 'users', uid), {
      displayName: role === 'owner' ? 'أمير' : 'أحمد',
      email, role, active: true,
      assignedProjectIds: role === 'site' ? [projectId] : [],
      createdAtServer: new Date(), createdBy: uid,
    });
    await setDoc(doc(d, 'projects', projectId), {
      id: projectId, name: projectName, clientName: 'زبون', location: 'السماوة', currency: 'IQD',
      status: 'active', createdAtDevice: 1, createdAtServer: new Date(), createdBy: uid, deviceId: 'admin',
    });
    await setDoc(doc(d, 'ledgerEntries', 'e-' + projectId), {
      id: 'e-' + projectId, projectId, direction: 'expense', entryType: 'materials', amount: 250000,
      currency: 'IQD', entryDate: '2026-10-30', description: entryDesc, partyName: '', isReversal: false,
      createdAtDevice: 1700000000000, createdAtServer: new Date(), createdBy: uid, deviceId: 'admin',
    });
  });
  await deleteApp(app);
  return uid;
}

async function serverEntry(id) {
  let data = null;
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const snap = await getDoc(doc(ctx.firestore(), 'ledgerEntries', id));
    data = snap.exists() ? snap.data() : null;
  });
  return data;
}

function url() { return origin + '/index.html?emulator=1'; }

async function signIn(page, email) {
  await page.goto(url(), { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#login-email', { timeout: 30000 });
  await page.fill('#login-email', email);
  await page.fill('#login-password', PASS);
  await page.click('#login-btn');
  await page.waitForFunction(() => {
    const shell = document.querySelector('#shell');
    return shell && shell.hidden === false;
  }, null, { timeout: 30000 });
  if (!(await page.evaluate(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller)))) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const shell = document.querySelector('#shell');
      return document.body.dataset.ready === '1' && shell && shell.hidden === false && navigator.serviceWorker.controller;
    }, null, { timeout: 30000 });
  }
}

async function closePages(context) {
  for (const p of context.pages()) await p.close();
}

async function openCold(context, extraInit) {
  const page = await context.newPage();
  await page.addInitScript(watchLogin);
  if (extraInit) await page.addInitScript(extraInit);
  let navError = '';
  try { await page.goto(url(), { waitUntil: 'domcontentloaded', timeout: 20000 }); }
  catch (err) { navError = String(err && err.message || err); }
  return { page, navError };
}

async function loginSeen(page) {
  return page.evaluate(() => window.__loginSeen === true).catch(() => true);
}

async function waitEntry(page, desc) {
  const ok = await page.waitForFunction(needle => (window.AJ && AJ.get('entries') || []).some(e => e && e.description === needle), desc, { timeout: 20000 }).then(() => true).catch(() => false);
  if (ok) return;
  const main = await page.locator('#main').innerText().catch(() => '');
  const who = await page.locator('#who').innerText().catch(() => '');
  const login = await page.locator('#login-msg').innerText().catch(() => '');
  throw new Error('entry missing. who=' + who + ' login=' + login + ' main=' + main.slice(0, 240));
}
async function waitHome(page) {
  await page.waitForFunction(() => {
    const shell = document.querySelector('#shell');
    const main = document.querySelector('#main');
    const title = document.querySelector('#title');
    const text = main ? main.innerText : '';
    return shell && shell.hidden === false && title && title.textContent === 'الرئيسية' && text.includes('إجمالي المصروف');
  }, null, { timeout: 20000 });
}
async function showProjectEntry(page, projectId, projectName, entryDesc) {
  const fmt = await page.evaluate(n => window.Ledger.fmt(n), 250000);
  await page.evaluate(id => { location.hash = '#project/' + id; dispatchEvent(new HashChangeEvent('hashchange')); }, projectId);
  await page.waitForFunction(bits => {
    const title = (document.querySelector('#title') || {}).textContent || '';
    const text = (document.querySelector('#main') || {}).innerText || '';
    return title.includes(bits[0]) && text.includes(bits[1]) && text.includes(bits[2]);
  }, [projectName, entryDesc, fmt], { timeout: 10000 });
}

async function saveEntry(page, projectId, note) {
  await page.evaluate(() => { location.hash = '#entry'; dispatchEvent(new HashChangeEvent('hashchange')); });
  await page.waitForSelector('[data-proj="' + projectId + '"]', { timeout: 10000 });
  await page.click('[data-proj="' + projectId + '"]');
  await page.click('[data-add="1000"]');
  await page.fill('#desc', note);
  await page.click('#save');
  return page.waitForFunction(desc => {
    const row = (window.AJ.get('entries') || []).find(e => e && e.description === desc);
    return row && row.id ? row.id : false;
  }, note, { timeout: 8000 }).then(h => h.jsonValue());
}

test('WebKit signed-in startup skips the login form online and offline, then a new entry sends', { timeout: 120000 }, async () => {
  const email = 'wk.cold@example.invalid';
  const projectId = 'p-wk-cold';
  const projectName = 'مشروع ويب كيت';
  const entryDesc = 'قيد ويب كيت السابق';
  const note = 'قيد ويب كيت الجديد';
  await seedUser(email, 'owner', projectId, projectName, entryDesc);
  const context = await browsers.webkit.newContext({ viewport: { width: 390, height: 844 }, locale: 'ar' });
  try {
    const page = await context.newPage();
    await signIn(page, email);
    await waitEntry(page, entryDesc);
    await waitHome(page);
    await closePages(context);

    const online = await openCold(context);
    assert.equal(online.navError, '', online.navError);
    await waitEntry(online.page, entryDesc);
    await waitHome(online.page);
    await online.page.waitForTimeout(400);
    assert.equal(await loginSeen(online.page), false, 'online reopen painted the login form');
    assert.equal(await online.page.locator('#who').innerText(), 'المالك · أمير');
    await shot(online.page, 'after-webkit-online');
    await closePages(context);

    // This WebKit build aborts a real offline navigation (internal error). The
    // page is opened with the network up for the service worker, then told it
    // is offline before app code runs, and the Firebase CDN is refused.
    await context.route('https://www.gstatic.com/**', route => route.abort('internetdisconnected'));
    const offline = await openCold(context, () => {
      window.__forceOffline = true;
      Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => !window.__forceOffline });
    });
    assert.equal(offline.navError, '', offline.navError);
    await waitEntry(offline.page, entryDesc);
    await waitHome(offline.page);
    await offline.page.waitForTimeout(400);
    assert.equal(await loginSeen(offline.page), false, 'offline reopen painted the login form');
    assert.equal(await offline.page.evaluate(() => navigator.onLine), false);
    await showProjectEntry(offline.page, projectId, projectName, entryDesc);
    await shot(offline.page, 'after-webkit-offline');

    const id = await saveEntry(offline.page, projectId, note);
    await offline.page.waitForFunction(() => {
      const btn = document.querySelector('#outbox');
      const badge = btn && btn.querySelector('.bell-badge');
      const label = (btn && btn.getAttribute('aria-label')) || '';
      const n = (window.AJ.get('outbox') || []).length;
      return n === 1 && badge && badge.hidden === false && badge.textContent === '1' && label.includes('لم يُرسل بعد: 1') && label.includes('بدون إنترنت');
    }, null, { timeout: 8000 });
    await shot(offline.page, 'after-webkit-queued');
    assert.equal(await serverEntry(id), null);

    await context.unroute('https://www.gstatic.com/**');
    await offline.page.evaluate(() => { window.__forceOffline = false; dispatchEvent(new Event('online')); });
    await offline.page.waitForFunction(entryId => !(window.AJ.get('outbox') || []).includes(entryId), id, { timeout: 20000 });
    const stored = await serverEntry(id);
    assert.ok(stored, 'the queued entry did not reach Firestore');
    assert.equal(stored.amount, 1000);
    assert.equal(stored.description, note);
  } finally {
    await context.close();
  }
});

test('Chromium signed-in startup skips the login form online and when the CDN is unreachable offline', { timeout: 120000 }, async () => {
  const email = 'cr.cold@example.invalid';
  const projectId = 'p-cr-cold';
  const projectName = 'مشروع كروم';
  const entryDesc = 'قيد كروم السابق';
  const note = 'قيد كروم الجديد';
  await seedUser(email, 'owner', projectId, projectName, entryDesc);
  const context = await browsers.chromium.newContext({ viewport: { width: 390, height: 844 }, locale: 'ar' });
  try {
    const page = await context.newPage();
    await signIn(page, email);
    await waitEntry(page, entryDesc);
    await waitHome(page);
    await closePages(context);

    const online = await openCold(context);
    assert.equal(online.navError, '', online.navError);
    await waitEntry(online.page, entryDesc);
    await waitHome(online.page);
    await online.page.waitForTimeout(400);
    assert.equal(await loginSeen(online.page), false, 'online reopen painted the login form');
    await shot(online.page, 'after-chromium-online');
    await closePages(context);

    await context.route('https://www.gstatic.com/**', route => route.abort('internetdisconnected'));
    await context.setOffline(true);
    const offline = await openCold(context);
    assert.equal(offline.navError, '', offline.navError);
    await waitEntry(offline.page, entryDesc);
    await waitHome(offline.page);
    await offline.page.waitForTimeout(400);
    assert.equal(await loginSeen(offline.page), false, 'offline reopen painted the login form');
    assert.equal(await offline.page.evaluate(() => navigator.onLine), false);
    await showProjectEntry(offline.page, projectId, projectName, entryDesc);
    await shot(offline.page, 'after-chromium-offline');

    const id = await saveEntry(offline.page, projectId, note);
    await offline.page.waitForFunction(() => {
      const label = (document.querySelector('#outbox') || {}).getAttribute && document.querySelector('#outbox').getAttribute('aria-label') || '';
      return (window.AJ.get('outbox') || []).length === 1 && label.includes('لم يُرسل بعد: 1');
    }, null, { timeout: 8000 });
    await shot(offline.page, 'after-chromium-queued');
    assert.equal(await serverEntry(id), null);

    await context.unroute('https://www.gstatic.com/**');
    await context.setOffline(false);
    await offline.page.evaluate(() => dispatchEvent(new Event('online')));
    await offline.page.waitForFunction(entryId => !(window.AJ.get('outbox') || []).includes(entryId), id, { timeout: 20000 });
    const stored = await serverEntry(id);
    assert.ok(stored, 'the queued entry did not reach Firestore');
    assert.equal(stored.description, note);
    assert.equal(stored.amount, 1000);
  } finally {
    await context.setOffline(false).catch(() => {});
    await context.close();
  }
});

test('WebKit site user reopens offline onto their projects and entries', { timeout: 120000 }, async () => {
  const email = 'site.cold@example.invalid';
  const projectId = 'p-site-cold';
  const projectName = 'مشروع الموقع';
  const entryDesc = 'قيد أحمد السابق';
  await seedUser(email, 'site', projectId, projectName, entryDesc);
  const context = await browsers.webkit.newContext({ viewport: { width: 390, height: 844 }, locale: 'ar' });
  try {
    const page = await context.newPage();
    await signIn(page, email);
    await page.waitForFunction(name => (document.querySelector('#main') || {}).innerText && document.querySelector('#main').innerText.includes(name), projectName, { timeout: 20000 });
    await closePages(context);
    await context.route('https://www.gstatic.com/**', route => route.abort('internetdisconnected'));
    const offline = await openCold(context, () => {
      window.__forceOffline = true;
      Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => !window.__forceOffline });
    });
    assert.equal(offline.navError, '', offline.navError);
    await pageWaitText(offline.page, projectName);
    await pageWaitText(offline.page, entryDesc);
    await offline.page.waitForTimeout(300);
    assert.equal(await loginSeen(offline.page), false, 'site reopen painted the login form');
    assert.match(await offline.page.locator('#who').innerText(), /أحمد/);
    assert.equal(await offline.page.locator('#title').innerText(), 'الرئيسية');
    await shot(offline.page, 'after-webkit-site-offline');
  } finally {
    await context.close();
  }
});

async function pageWaitText(page, text) {
  await page.waitForFunction(needle => {
    const shell = document.querySelector('#shell');
    const main = document.querySelector('#main');
    return shell && shell.hidden === false && main && main.innerText.includes(needle);
  }, text, { timeout: 20000 });
}

test('a signed-out user sees the login form in WebKit and Chromium', { timeout: 90000 }, async () => {
  for (const name of ['webkit', 'chromium']) {
    const context = await browsers[name].newContext({ viewport: { width: 390, height: 844 }, locale: 'ar' });
    try {
      const page = await context.newPage();
      await page.addInitScript(watchLogin);
      await page.goto(url(), { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#login-email', { state: 'visible', timeout: 30000 });
      assert.equal(await page.locator('#shell').isHidden(), true, name + ' shell was visible');
      assert.equal(await page.locator('#boot').isHidden(), true, name + ' boot screen stayed up');
      assert.match(await page.locator('#login h1').innerText(), /تسجيل الدخول/);
      const body = await page.locator('body').innerText();
      assert.equal(body.includes('مشروع'), false, name + ' showed a project to a signed-out user');
      if (name === 'chromium') await shot(page, 'after-chromium-signed-out');
    } finally {
      await context.close();
    }
  }
});

test('after sign-out, an offline cold open stays on the login form', { timeout: 120000 }, async () => {
  const email = 'out.cold@example.invalid';
  const projectId = 'p-out-cold';
  const projectName = 'مشروع بعد الخروج';
  const entryDesc = 'قيد قبل الخروج';
  await seedUser(email, 'owner', projectId, projectName, entryDesc);
  const context = await browsers.chromium.newContext({ viewport: { width: 390, height: 844 }, locale: 'ar' });
  context.on('dialog', d => d.accept());
  try {
    const page = await context.newPage();
    await signIn(page, email);
    await waitEntry(page, entryDesc);
    await waitHome(page);
    await page.waitForFunction(() => (window.AJ.get('outbox') || []).length === 0, null, { timeout: 20000 });
    await page.click('#logout');
    await page.waitForSelector('#login-email', { state: 'visible', timeout: 20000 });
    assert.equal(await page.locator('#shell').isHidden(), true);
    await closePages(context);
    await context.setOffline(true);
    const cold = await openCold(context);
    assert.equal(cold.navError, '', cold.navError);
    await cold.page.waitForSelector('#login-email', { state: 'visible', timeout: 20000 });
    assert.equal(await cold.page.locator('#shell').isHidden(), true);
    const body = await cold.page.locator('body').innerText();
    assert.equal(body.includes(projectName), false, 'signed-out offline open showed the project: ' + body.slice(0, 120));
    assert.equal(body.includes(entryDesc), false);
    await shot(cold.page, 'after-chromium-signed-out-offline');
  } finally {
    await context.setOffline(false).catch(() => {});
    await context.close();
  }
});
