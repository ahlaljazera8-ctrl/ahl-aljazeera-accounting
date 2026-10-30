// A phone stuck on an older service worker must recover by opening the app once.
// The outbox lives in IndexedDB (aj-u-*) and must still be there, then sync.
// Emulators only. AJ_NEW_ROOT can point at a pre-fix build to show the failure.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const test = require('node:test');
const assert = require('node:assert/strict');
const { webkit } = require('playwright');
const { initializeApp, deleteApp } = require('firebase/app');
const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { doc, setDoc, getDoc } = require('firebase/firestore');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

const ROOT = path.join(__dirname, '..');
const NEW = process.env.AJ_NEW_ROOT || path.join(ROOT, 'public');
const MARK = 'aj-p0-v13';
const PROJECT_ID = 'p-webkit';
const PASS = 'emulator-only-pass';
const WEB = ['index.html', 'app.js', 'sw.js', 'style.css', 'ledger.js', 'sync.js', 'firebase-config.js', 'manifest.json', 'icon.svg'];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
const REVS = ['a9ee410', '921e20e'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
let chain = Promise.resolve();
let testEnv;
let seq = 0;

function localHost(name) {
  const raw = process.env[name];
  if (!raw || !/^(127\.0\.0\.1|localhost):\d+$/.test(raw)) throw new Error(name + ' must be a local emulator. Got: ' + raw);
  const [host, port] = raw.split(':');
  return { host, port: Number(port) };
}
function testSeq(name, fn, timeout) {
  test(name, { timeout }, async () => {
    const prev = chain;
    let release;
    chain = new Promise(r => { release = r; });
    await prev;
    try { await fn(); }
    finally { release(); }
  });
}
function ensureRev(rev) {
  try { execFileSync('git', ['cat-file', '-e', rev + ':sw.js'], { cwd: ROOT, stdio: 'ignore' }); }
  catch (e) { execFileSync('git', ['fetch', '--depth', '1', 'origin', rev], { cwd: ROOT, stdio: 'inherit' }); }
}
function materialize(rev, dir) {
  ensureRev(rev);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const f of WEB) fs.writeFileSync(path.join(dir, f), execFileSync('git', ['show', rev + ':' + f], { cwd: ROOT }));
}
function startServer(getRoot) {
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    const rel = u.pathname === '/' ? '/index.html' : decodeURIComponent(u.pathname);
    const base = getRoot();
    const file = path.normalize(path.join(base, rel));
    if (!file.startsWith(base) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('missing'); return; }
    const cacheControl = rel === '/sw.js' ? 'no-cache, max-age=0' : 'no-cache';
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': cacheControl });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

test.before(async () => {
  const fsHost = localHost('FIRESTORE_EMULATOR_HOST');
  const authHost = localHost('FIREBASE_AUTH_EMULATOR_HOST');
  testEnv = await initializeTestEnvironment({
    projectId: 'ahl-aljazeera-accounting',
    firestore: { rules: fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8'), host: fsHost.host, port: fsHost.port },
  });
  for (const rev of REVS.concat(['fresh'])) {
    const email = 'wk-' + rev + '@example.invalid';
    const app = initializeApp({ apiKey: 'demo', projectId: 'ahl-aljazeera-accounting', authDomain: 'localhost' }, 'wk-' + rev);
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
        displayName: 'مالك', email, role: 'owner', active: true, assignedProjectIds: [], createdAtServer: new Date(), createdBy: uid,
      });
      await setDoc(doc(d, 'projects', PROJECT_ID), {
        id: PROJECT_ID, name: 'مشروع الويب', clientName: 'زبون', location: 'السماوة', currency: 'IQD', status: 'active',
        createdAtDevice: 1, createdAtServer: new Date(), createdBy: uid, deviceId: 'admin',
      });
    });
    await deleteApp(app);
  }
});
test.after(async () => { if (testEnv) await testEnv.cleanup(); });

async function signIn(page, email) {
  await page.waitForSelector('#login-email', { timeout: 20000 });
  await page.fill('#login-email', email);
  await page.fill('#login-password', PASS);
  await page.click('#login-btn');
  await page.waitForFunction(() => { const s = document.querySelector('#shell'); return s && s.hidden === false; }, null, { timeout: 25000 });
}

async function plantedEntry(rev) {
  const email = 'wk-' + rev + '@example.invalid';
  const desc = 'قيد عالق ' + rev;
  const oldDir = path.join('/tmp', 'aj-old-' + rev + '-' + (++seq));
  materialize(rev, oldDir);
  let root = oldDir;
  const server = await startServer(() => root);
  const port = server.address().port;
  const url = 'http://127.0.0.1:' + port + '/index.html?emulator=1';
  const profile = '/tmp/wk-profile-' + port;
  const ctx = await webkit.launchPersistentContext(profile);
  ctx.on('dialog', d => d.accept());
  let entryId = '';
  try {
    const page = await ctx.newPage();
    page.on('dialog', d => d.accept());
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 20000 });
    await signIn(page, email);
    await page.evaluate(() => { location.hash = '#entry'; dispatchEvent(new HashChangeEvent('hashchange')); });
    await page.waitForSelector('[data-proj="' + PROJECT_ID + '"]', { timeout: 20000 });
    await ctx.route('**://127.0.0.1:8080/**', route => route.abort());
    await page.click('[data-proj="' + PROJECT_ID + '"]');
    await page.click('[data-add="1000"]');
    await page.fill('#desc', desc);
    await page.click('#save');
    await page.waitForFunction(() => (document.querySelector('#outbox') || {}).textContent && document.querySelector('#outbox').textContent.includes('1'), null, { timeout: 10000 });
    await page.evaluate(() => AJ.flush());
    await page.waitForTimeout(500);
    entryId = await page.evaluate(d => { const e = (AJ.get('entries') || []).find(x => x.description === d); return e ? e.id : ''; }, desc);
    assert.ok(entryId, 'the unsent entry should have an id');
    await page.close();
    await ctx.unroute('**://127.0.0.1:8080/**');
    root = NEW;
    const page2 = await ctx.newPage();
    page2.on('dialog', d => d.accept());
    let navs = 0;
    page2.on('framenavigated', frame => { if (frame === page2.mainFrame()) navs++; });
    try { await page2.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }); }
    catch (e) { if (!/interrupted|aborted|Load failed/i.test(e.message)) throw e; }
    await page2.waitForURL(new RegExp('[?&]sw=' + MARK), { timeout: 20000 });
    await page2.waitForFunction(d => {
      const shell = document.querySelector('#shell');
      const rows = (window.AJ && AJ.get('entries')) || [];
      return shell && shell.hidden === false && rows.some(x => x.description === d);
    }, desc, { timeout: 30000 });
    const msg = await page2.locator('#login-msg').textContent();
    assert.equal(/Importing a module script failed/i.test(msg || ''), false, msg || '');
    assert.ok(navs <= 2, 'at most one automatic reload, saw ' + navs);
    const kept = await page2.evaluate(id => new Promise(resolve => {
      indexedDB.databases().then(async dbs => {
        for (const info of dbs) {
          if (!info.name || String(info.name).indexOf('aj-u-') !== 0) continue;
          const row = await new Promise(ok => {
            const q = indexedDB.open(info.name);
            q.onsuccess = () => {
              const db = q.result;
              const g = db.transaction('entries').objectStore('entries').get(id);
              g.onsuccess = () => { db.close(); ok(g.result || null); };
              g.onerror = () => { db.close(); ok(null); };
            };
            q.onerror = () => ok(null);
          });
          if (row && row.id === id) return resolve(true);
        }
        resolve(false);
      });
    }), entryId);
    assert.equal(kept, true, 'healing must leave the unsent entry in aj-u-');
    const deadline = Date.now() + 20000;
    let synced = false;
    while (Date.now() < deadline && !synced) {
      await testEnv.withSecurityRulesDisabled(async ctx2 => {
        synced = (await getDoc(doc(ctx2.firestore(), 'ledgerEntries', entryId))).exists();
      });
      if (!synced) await sleep(400);
    }
    assert.equal(synced, true, 'the entry should reach Firestore');
  } finally {
    await ctx.close();
    server.close();
    fs.rmSync(profile, { recursive: true, force: true });
    fs.rmSync(oldDir, { recursive: true, force: true });
  }
}

for (const rev of REVS) {
  testSeq('opening the app once heals a ' + rev + ' service worker and syncs the outbox', () => plantedEntry(rev), 120000);
}

testSeq('a fresh profile signs in without a module error', async () => {
  let root = NEW;
  const server = await startServer(() => root);
  const port = server.address().port;
  const url = 'http://127.0.0.1:' + port + '/index.html?emulator=1';
  const profile = '/tmp/wk-fresh-' + port;
  const ctx = await webkit.launchPersistentContext(profile);
  try {
    const page = await ctx.newPage();
    page.on('dialog', d => d.accept());
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await signIn(page, 'wk-fresh@example.invalid');
    const msg = await page.locator('#login-msg').textContent();
    assert.equal(/Importing a module script failed/i.test(msg || ''), false, msg || '');
  } finally {
    await ctx.close();
    server.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
}, 90000);
