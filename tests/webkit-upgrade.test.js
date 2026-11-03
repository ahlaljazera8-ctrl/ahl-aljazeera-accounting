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
const MARK = 'aj-p0-v26';
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
    const bell = await page2.evaluate(() => {
      const btn = document.querySelector('#outbox');
      const badge = btn && btn.querySelector('.bell-badge');
      const panel = document.querySelector('#bell-panel');
      const n = (window.AJ.get('outbox') || []).length;
      return {
        button: !!(btn && btn.tagName === 'BUTTON'),
        label: (btn && btn.getAttribute('aria-label')) || '',
        n,
        badgeHidden: !!(badge && badge.hidden),
        badge: badge ? badge.textContent : '',
        panel: panel ? panel.innerText : '',
      };
    });
    assert.equal(bell.button, true, 'the healed page uses the bell');
    assert.match(bell.label, new RegExp('لم يُرسل بعد: ' + bell.n), bell.label);
    assert.match(bell.panel, /آخر مزامنة/, bell.panel);
    assert.match(bell.panel, /إرسال الآن|جارٍ الإرسال/, bell.panel);
    if (bell.n === 0) assert.equal(bell.badgeHidden, true, bell.badge);
    else assert.equal(bell.badge, String(bell.n));
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

testSeq('WebKit shows entry export for both roles and shares the CSV', async () => {
  const server = await startServer(() => NEW);
  const port = server.address().port;
  const browser = await webkit.launch();
  try {
    const page = await browser.newPage();
    await page.addInitScript(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
    const open = async (role, hash) => {
      await page.goto('http://127.0.0.1:' + port + '/index.html?role=' + role + '#' + hash, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(() => document.body && document.body.dataset.ready === '1', null, { timeout: 20000 });
    };
    await open('owner', 'detail/seed-2');
    await page.waitForSelector('#entry-print', { timeout: 10000 });
    assert.deepEqual(await page.locator('#entry-print, #entry-pdf, #entry-file').allTextContents(), ['طباعة', 'حفظ PDF', 'حفظ كملف']);
    await page.click('#entry-print');
    await page.click('#entry-pdf');
    const ownerText = await page.locator('#print-root').textContent();
    for (const bit of ['أهل الجزيرة', 'مشروع المدرسة', 'مواد', '30,000,000', 'د.ع', 'تاريخ القيد', '2026-10-02', 'وقت التسجيل', '12:00:02', 'أمير', 'حديد وإسمنت', 'seed-2']) {
      assert.equal(ownerText.includes(bit), true, bit);
    }
    assert.equal(ownerText.includes('2026-10-01'), false);
    assert.equal(await page.evaluate(() => window.__printed), 2);
    const ownerCsv = await page.evaluate(async () => {
      const u = AJ.get('users').find(x => x.uid === 'u-ameer');
      const entry = AJ.get('entries').find(x => x.id === 'seed-2');
      const expected = Ledger.entryToCSV(u, entry, { projects: AJ.get('projects'), entries: AJ.get('entries'), finance: AJ.get('projectFinance'), policy: Ledger.DEFAULT_POLICY });
      let shared = null;
      const share = async (data) => {
        const file = data.files[0];
        const bytes = new Uint8Array(await file.arrayBuffer());
        shared = { text: await file.text(), bom: bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF };
      };
      const can = () => true;
      try { Object.defineProperty(navigator, 'canShare', { configurable: true, value: can }); } catch (e) { navigator.canShare = can; }
      try { Object.defineProperty(navigator, 'share', { configurable: true, value: share }); } catch (e) { navigator.share = share; }
      document.querySelector('#entry-file').click();
      for (let i = 0; i < 20 && !shared; i++) await new Promise(r => setTimeout(r, 20));
      return { shared, body: expected.slice(1), bom: expected.charCodeAt(0) === 0xFEFF };
    });
    assert.equal(ownerCsv.bom, true);
    assert.equal(ownerCsv.shared.bom, true);
    assert.equal(ownerCsv.shared.text, ownerCsv.body);

    await open('site', 'detail/seed-6');
    await page.waitForSelector('#entry-file', { timeout: 10000 });
    assert.deepEqual(await page.locator('#entry-print, #entry-pdf, #entry-file').allTextContents(), ['طباعة', 'حفظ PDF', 'حفظ كملف']);
    await page.click('#entry-pdf');
    const siteText = await page.locator('#print-root').textContent();
    for (const bit of ['أهل الجزيرة', 'مشروع الطريق', 'عمالة/سلفة', '8,200,000', 'أحمد', 'أجور عمال', 'seed-6', 'تاريخ القيد', '2026-10-06', 'وقت التسجيل', '12:00:06']) {
      assert.equal(siteText.includes(bit), true, bit);
    }
    assert.equal(siteText.includes('2026-10-01'), false);
    for (const banned of ['ربح', 'المقبوض', 'خسارة', 'قيمة العقد', 'contractAmount', 'profit', '60,000,000', '40,000,000', '11,200,000', '30,000,000', '60000000']) {
      assert.equal(siteText.includes(banned), false, banned);
    }
    const siteCsv = await page.evaluate(async () => {
      const u = AJ.get('users').find(x => x.uid === 'u-ahmed');
      const entry = AJ.get('entries').find(x => x.id === 'seed-6');
      const ctx = { projects: AJ.get('projects'), entries: AJ.get('entries'), finance: AJ.get('projectFinance'), policy: Ledger.DEFAULT_POLICY };
      const expected = Ledger.entryToCSV(u, entry, ctx);
      const hidden = Ledger.entryToCSV(u, AJ.get('entries').find(x => x.id === 'seed-1'), ctx);
      let shared = null;
      const share = async (data) => {
        const file = data.files[0];
        const bytes = new Uint8Array(await file.arrayBuffer());
        shared = { text: await file.text(), bom: bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF };
      };
      const can = () => true;
      try { Object.defineProperty(navigator, 'canShare', { configurable: true, value: can }); } catch (e) { navigator.canShare = can; }
      try { Object.defineProperty(navigator, 'share', { configurable: true, value: share }); } catch (e) { navigator.share = share; }
      document.querySelector('#entry-file').click();
      for (let i = 0; i < 20 && !shared; i++) await new Promise(r => setTimeout(r, 20));
      return { shared, body: expected.slice(1), hidden };
    });
    assert.equal(siteCsv.hidden, null);
    assert.equal(siteCsv.shared.bom, true);
    assert.equal(siteCsv.shared.text, siteCsv.body);
    assert.equal(siteCsv.shared.text.includes('8,200,000'), true);
    assert.equal(siteCsv.shared.text.includes('11,200,000'), false);
    assert.equal(siteCsv.shared.text.includes('contractAmount'), false);

    await open('site', 'detail/seed-1');
    await page.waitForFunction(() => (document.querySelector('#main') || {}).innerText && document.querySelector('#main').innerText.includes('القيد غير متاح'), null, { timeout: 10000 });
    assert.equal(await page.locator('#entry-print').count(), 0);
  } finally {
    await browser.close();
    server.close();
  }
}, 90000);

testSeq('WebKit lists one project for both roles, offline, and pages the rest', async () => {
  const server = await startServer(() => NEW);
  const port = server.address().port;
  const browser = await webkit.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  });
  await context.addInitScript(() => {
    try { Object.defineProperty(navigator, 'standalone', { configurable: true, get: () => true }); } catch (e) {}
  });
  try {
    const page = await context.newPage();
    const origin = 'http://127.0.0.1:' + port;
    const open = async (role, hash) => {
      await page.goto(origin + '/index.html?role=' + role + '#' + hash, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(() => document.body && document.body.dataset.ready === '1', null, { timeout: 20000 });
    };
    await open('owner', 'project/p-school');
    const phone = await page.evaluate(() => ({ standalone: navigator.standalone === true, narrow: window.innerWidth <= 430, touch: navigator.maxTouchPoints > 0 }));
    assert.equal(phone.narrow, true);
    assert.equal(phone.standalone || phone.touch, true);
    await page.waitForSelector('#all-entries', { timeout: 10000 });
    assert.equal((await page.locator('#all-entries').innerText()).trim(), 'عرض جميع القيود');
    await page.locator('#all-entries').click();
    await page.waitForFunction(() => location.hash === '#entries/p-school' && document.querySelector('#entry-list'), null, { timeout: 10000 });
    const ownerList = await page.evaluate(() => {
      const u = AJ.get('users').find(x => x.uid === 'u-ameer');
      const list = Ledger.projectEntryList(u, 'p-school', { projects: AJ.get('projects'), entries: AJ.get('entries'), finance: AJ.get('projectFinance'), policy: Ledger.DEFAULT_POLICY }, { limit: 50 });
      const text = document.querySelector('#main').innerText;
      const ids = [...document.querySelectorAll('#entry-list a.entry-open')].map(a => (a.getAttribute('href') || '').replace('#detail/', ''));
      return {
        same: ids.join('|') === list.rows.map(r => r.id).join('|'),
        reads: list.reads,
        text,
        hz: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });
    assert.equal(ownerList.same, true);
    assert.equal(ownerList.reads, 0);
    assert.equal(ownerList.hz, false);
    for (const bit of ['كل القيود', 'قيد عكسي', 'معكوس', '40,000,000', 'أمير']) assert.equal(ownerList.text.includes(bit), true, bit);
    for (const banned of ['قيمة العقد', '60,000,000', 'بناية السوق', '6,800,000']) assert.equal(ownerList.text.includes(banned), false, banned);
    await page.locator('#entry-list a.entry-open').first().click();
    await page.waitForSelector('#entry-print', { timeout: 10000 });
    assert.deepEqual(await page.locator('#entry-print, #entry-pdf, #entry-file').allTextContents(), ['طباعة', 'حفظ PDF', 'حفظ كملف']);
    await page.locator('#back').click();
    await page.waitForFunction(() => location.hash === '#entries/p-school' && document.querySelector('#entry-list'), null, { timeout: 10000 });

    await page.selectOption('#role', 'site');
    await page.waitForFunction(() => document.querySelector('#main') && document.querySelector('#main').innerText.includes('30,000,000'), null, { timeout: 10000 });
    const siteList = await page.locator('#main').innerText();
    for (const bit of ['30,000,000', 'معكوس', 'قيد عكسي']) assert.equal(siteList.includes(bit), true, bit);
    for (const banned of ['ربح', 'المقبوض', 'خسارة', 'قيمة العقد', '40,000,000', '10,000,000', '60,000,000', 'دفعة عميل', '6,800,000']) assert.equal(siteList.includes(banned), false, banned);
    await page.evaluate(() => { location.hash = '#entries/p-market'; dispatchEvent(new HashChangeEvent('hashchange')); });
    await page.waitForFunction(() => (document.querySelector('#main') || {}).innerText && document.querySelector('#main').innerText.includes('المشروع غير متاح'), null, { timeout: 10000 });
    assert.equal(await page.locator('#entry-list').count(), 0);

    await page.selectOption('#role', 'owner');
    await page.evaluate(() => { location.hash = '#entries/p-school'; dispatchEvent(new HashChangeEvent('hashchange')); });
    await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 20000 });
    await page.evaluate(async () => {
      const base = 8000000000000000;
      await new Promise((resolve, reject) => {
        const q = indexedDB.open('aj-p0');
        q.onerror = () => reject(q.error || new Error('idb'));
        q.onsuccess = () => {
          const d = q.result;
          const tx = d.transaction('entries', 'readwrite');
          const st = tx.objectStore('entries');
          for (let i = 0; i < 70; i++) {
            st.put({ id: 'wk-' + i, projectId: 'p-school', direction: 'expense', entryType: 'materials', amount: 4100 + i, currency: 'IQD', entryDate: '2026-11-01', description: '', partyName: 'حزمة', isReversal: false, createdAtDevice: base + i, createdAtServer: base + i, createdBy: 'u-ameer', createdByName: 'أمير', deviceId: 'wk' });
          }
          tx.oncomplete = () => { d.close(); resolve(1); };
          tx.onerror = () => reject(tx.error);
        };
      });
    });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => document.body && document.body.dataset.ready === '1' && document.querySelectorAll('#entry-list a.entry-open').length === 50 && document.querySelector('#more-entries'), null, { timeout: 20000 });
    // A document reload while offline makes this WebKit build abort. The shell is
    // already precached, so «المزيد» is used with the network switched off.
    await context.setOffline(true);
    const page1 = await page.evaluate(async (mark) => {
      const u = AJ.get('users').find(x => x.uid === 'u-ameer');
      const list = Ledger.projectEntryList(u, 'p-school', { projects: AJ.get('projects'), entries: AJ.get('entries'), policy: Ledger.DEFAULT_POLICY }, { limit: 50 });
      const ids = [...document.querySelectorAll('#entry-list a.entry-open')].map(a => (a.getAttribute('href') || '').replace('#detail/', ''));
      const keys = (await (await caches.open(mark)).keys()).map(r => new URL(r.url).pathname);
      return { same: ids.join('|') === list.rows.map(r => r.id).join('|'), reads: list.reads, total: list.total, online: navigator.onLine, keys };
    }, MARK);
    assert.equal(page1.keys.includes('/index.html') && page1.keys.includes('/app.js') && page1.keys.includes('/ledger.js'), true);
    assert.equal(page1.same, true);
    assert.equal(page1.reads, 0);
    assert.equal(page1.online, false);
    assert.equal(page1.total > 50, true);
    await page.locator('#more-entries').click();
    await page.waitForFunction(() => document.querySelectorAll('#entry-list a.entry-open').length > 50, null, { timeout: 10000 });
    await page.selectOption('#role', 'site');
    await page.waitForFunction(() => {
      const text = (document.querySelector('#main') || {}).innerText || '';
      return text.includes('4,100') && !text.includes('40,000,000');
    }, null, { timeout: 10000 });
    const sitePaged = await page.locator('#main').innerText();
    for (const banned of ['40,000,000', '10,000,000', '60,000,000', 'قيمة العقد', 'ربح', 'المقبوض', 'خسارة']) assert.equal(sitePaged.includes(banned), false, banned);
  } finally {
    await context.close();
    await browser.close();
    server.close();
  }
}, 120000);

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
