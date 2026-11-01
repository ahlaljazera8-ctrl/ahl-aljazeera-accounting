// Live session behaviour against the emulators: assignment changes without a
// reload, a deactivated account keeps the unsent entry and says so, a revoked
// session can leave, and a reversal race settles on screen.
// Never points at production.
const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');
const test = require('node:test');
const assert = require('node:assert/strict');
const { initializeApp, deleteApp } = require('firebase/app');
const {
  getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
} = require('firebase/auth');
const { doc, setDoc, getDoc, updateDoc } = require('firebase/firestore');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

const PROJECT = 'ahl-aljazeera-accounting';
const PASS = 'emulator-only-pass';
const OWNER_EMAIL = 'live.owner@example.invalid';
const SITE_EMAIL = 'live.site@example.invalid';
const PORT = 8773;
const BASE = 'http://127.0.0.1:' + PORT + '/index.html?emulator=1';
function isLive(url) {
  try {
    const host = new URL(url).hostname;
    return host === 'firestore.googleapis.com' || host === 'identitytoolkit.googleapis.com' || host === 'securetoken.googleapis.com';
  } catch (e) { return false; }
}
const SUSPENDED = 'هذا الحساب موقوف';
const DEAD = 'انتهت الجلسة. سجّل الدخول من جديد';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let chain = Promise.resolve();
let testEnv;
let server;
let ownerUid;
let siteUid;

function localHost(name) {
  const raw = process.env[name];
  if (!raw || !/^(127\.0\.0\.1|localhost):\d+$/.test(raw)) {
    throw new Error(name + ' must be a local emulator (refusing production). Got: ' + raw);
  }
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

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

function launchChrome(dir, port) {
  fs.mkdirSync(dir, { recursive: true });
  return spawn('google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + port, '--user-data-dir=' + dir, 'about:blank',
  ], { detached: true, stdio: 'ignore' });
}

function killChrome(chrome) {
  if (chrome && chrome.pid) {
    try { process.kill(-chrome.pid, 'SIGKILL'); } catch (e) { try { chrome.kill('SIGKILL'); } catch (e2) {} }
  }
}

async function connect(port) {
  let tgt;
  for (let i = 0; i < 50 && !tgt; i++) {
    try {
      tgt = (await (await fetch('http://127.0.0.1:' + port + '/json')).json()).find(t => t.type === 'page');
    } catch (e) {}
    await sleep(200);
  }
  if (!tgt) throw new Error('Chrome did not open a page');
  const ws = new WebSocket(tgt.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = () => reject(new Error('debugger socket failed')); });
  let id = 0;
  const pend = {};
  const session = { logs: [], dialogs: [], production: '', revoke: false, promptText: 'سبب الجهاز' };
  const send = (method, params = {}) => new Promise(resolve => { pend[++id] = resolve; ws.send(JSON.stringify({ id, method, params })); });
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; return; }
    if (d.method === 'Runtime.consoleAPICalled') {
      session.logs.push((d.params.args || []).map(a => a.value || a.description || '').join(' ').slice(0, 300));
    } else if (d.method === 'Runtime.exceptionThrown') {
      session.logs.push(String(d.params.exceptionDetails && d.params.exceptionDetails.text || 'exception').slice(0, 300));
    } else if (d.method === 'Page.javascriptDialogOpening') {
      session.dialogs.push(d.params.message || '');
      const prompt = d.params.type === 'prompt';
      send('Page.handleJavaScriptDialog', { accept: true, promptText: prompt ? session.promptText : '' });
    } else if (d.method === 'Fetch.requestPaused') {
      const url = d.params.request.url || '';
      const requestId = d.params.requestId;
      if (isLive(url)) { session.production = url; send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }); return; }
      if (session.revoke && /securetoken|\/token/.test(url) && !/signIn|signUp|accounts:/.test(url)) {
        session.tokenUrl = url;
        const body = Buffer.from(JSON.stringify({ error: { code: 400, message: 'INVALID_REFRESH_TOKEN', status: 'INVALID_ARGUMENT' } })).toString('base64');
        send('Fetch.fulfillRequest', {
          requestId,
          responseCode: 400,
          responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
          body,
        });
        return;
      }
      send('Fetch.continueRequest', { requestId });
    }
  };
  session.send = send;
  session.ev = async expression => {
    const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    const details = res.result && res.result.exceptionDetails;
    if (details) throw new Error(details.text || (details.exception && details.exception.description) || 'eval failed');
    return res.result.result.value;
  };
  session.close = () => { try { ws.close(); } catch (e) {} };
  const patterns = [
    { urlPattern: 'http://127.0.0.1:8080/*' },
    { urlPattern: 'http://localhost:8080/*' },
    { urlPattern: 'http://firestore.googleapis.com/*' },
    { urlPattern: 'https://firestore.googleapis.com/*' },
    { urlPattern: 'http://identitytoolkit.googleapis.com/*' },
    { urlPattern: 'https://identitytoolkit.googleapis.com/*' },
    { urlPattern: 'http://securetoken.googleapis.com/*' },
    { urlPattern: 'https://securetoken.googleapis.com/*' },
    { urlPattern: 'http://127.0.0.1:9099/*' },
    { urlPattern: 'http://localhost:9099/*' },
  ];
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Fetch.enable', { patterns });
  return session;
}

async function openBrowser(dir) {
  const port = await freePort();
  const chrome = launchChrome(dir, port);
  try {
    const session = await connect(port);
    session.chrome = chrome;
    return session;
  } catch (err) {
    killChrome(chrome);
    throw err;
  }
}

function stopBrowser(session) {
  if (!session) return;
  session.close();
  killChrome(session.chrome);
}

async function waitFor(session, expr, ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try { if (await session.ev(expr)) return true; } catch (e) {}
    await sleep(200);
  }
  return false;
}

async function gotoApp(session) {
  await session.send('Page.navigate', { url: BASE });
  const ready = await waitFor(session, `document.body && document.body.dataset.ready === '1'`, 20000);
  if (!ready) throw new Error('page did not become ready');
  if (session.production) throw new Error('refusing live Firebase traffic: ' + session.production);
}

async function login(session, email, ms) {
  await session.ev(`document.querySelector('#login-email').value=${JSON.stringify(email)}; document.querySelector('#login-password').value=${JSON.stringify(PASS)}; document.querySelector('#login-btn').click(); 1`);
  const ok = await waitFor(session, `document.querySelector('#shell') && document.querySelector('#shell').hidden === false`, ms);
  if (!ok) {
    const msg = await session.ev(`(document.querySelector('#login-msg') && document.querySelector('#login-msg').textContent) || ''`).catch(err => String(err));
    session.logs.push('login-msg: ' + msg);
  }
  return ok;
}

function detail(session) {
  return (session.logs || []).filter(Boolean).slice(-8).join(' | ');
}

function userDoc(uid, over) {
  return Object.assign({
    displayName: 'مستخدم', email: 'u@example.invalid', role: 'site', active: true,
    assignedProjectIds: [], createdAtServer: new Date(), createdBy: uid,
  }, over);
}

function projectDoc(id, name, by) {
  return {
    id, name, clientName: 'زبون', location: 'السماوة', currency: 'IQD', status: 'active',
    createdAtDevice: 1, createdAtServer: new Date('2026-10-01T00:00:00Z'), createdBy: by, deviceId: 'admin',
  };
}

function entryDoc(id, over) {
  return Object.assign({
    id, projectId: 'p-keep', direction: 'expense', entryType: 'materials', amount: 1000,
    currency: 'IQD', entryDate: '2026-10-20', description: 'قيد', partyName: '', isReversal: false,
    createdAtDevice: Date.parse('2026-10-20T00:00:00Z'), createdAtServer: new Date('2026-10-20T00:00:00Z'),
    createdBy: ownerUid, deviceId: 'admin',
  }, over);
}

async function shot(session, filename) {
  const dir = '/opt/cursor/artifacts';
  fs.mkdirSync(dir, { recursive: true });
  await session.send('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 2, mobile: true });
  const res = await session.send('Page.captureScreenshot', { format: 'png' });
  const data = res.result && res.result.data;
  if (!data) throw new Error('screenshot failed');
  fs.writeFileSync(path.join(dir, filename), Buffer.from(data, 'base64'));
}

function localEntry(note) {
  return `(async () => {
    const dbs = await indexedDB.databases();
    const names = dbs.map(d => d.name).filter(n => n && String(n).startsWith('aj-u-'));
    const found = [];
    for (const name of names) {
      const rows = await new Promise((ok, no) => {
        const r = indexedDB.open(name);
        r.onerror = () => no(r.error);
        r.onsuccess = () => {
          const d = r.result;
          const out = { entries: [], outbox: [] };
          if (!d.objectStoreNames.contains('entries')) { d.close(); ok(out); return; }
          const tx = d.transaction(['entries', 'outbox', 'meta']);
          const eg = tx.objectStore('entries').getAll();
          const og = tx.objectStore('outbox').getAll();
          const mg = tx.objectStore('meta').get('syncErrors');
          const done = { entries: null, outbox: null, errors: null };
          eg.onsuccess = () => { done.entries = eg.result || []; finish(); };
          og.onsuccess = () => { done.outbox = og.result || []; finish(); };
          mg.onsuccess = () => { done.errors = mg.result || {}; finish(); };
          eg.onerror = og.onerror = mg.onerror = () => { d.close(); no(tx.error); };
          function finish() {
            if (done.entries && done.outbox && done.errors) { d.close(); ok(done); }
          }
        };
      });
      for (const row of rows.entries) {
        if (row && row.description === ${JSON.stringify(note)}) {
          found.push({ id: row.id, pending: rows.outbox.some(o => o && o.id === row.id), error: rows.errors[row.id] || '' });
        }
      }
    }
    return { names, found };
  })()`;
}

test.before(async () => {
  const fsHost = localHost('FIRESTORE_EMULATOR_HOST');
  const authHost = localHost('FIREBASE_AUTH_EMULATOR_HOST');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8'),
      host: fsHost.host,
      port: fsHost.port,
    },
  });
  await testEnv.clearFirestore();
  const app = initializeApp({ apiKey: 'demo', projectId: PROJECT, authDomain: 'localhost' }, 'session-live');
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://' + authHost.host + ':' + authHost.port, { disableWarnings: true });
  async function user(email) {
    try { return await createUserWithEmailAndPassword(auth, email, PASS); }
    catch (err) {
      if (err && err.code === 'auth/email-already-in-use') return signInWithEmailAndPassword(auth, email, PASS);
      throw err;
    }
  }
  const owner = await user(OWNER_EMAIL);
  ownerUid = owner.user.uid;
  await signOut(auth);
  const site = await user(SITE_EMAIL);
  siteUid = site.user.uid;
  await signOut(auth);
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await setDoc(doc(d, 'users', ownerUid), userDoc(ownerUid, {
      displayName: 'مالك الجلسة', email: OWNER_EMAIL, role: 'owner', assignedProjectIds: [], createdBy: ownerUid,
    }));
    await setDoc(doc(d, 'users', siteUid), userDoc(siteUid, {
      displayName: 'موقع الجلسة', email: SITE_EMAIL, role: 'site', assignedProjectIds: ['p-keep'], createdBy: ownerUid,
    }));
    await setDoc(doc(d, 'projects', 'p-keep'), projectDoc('p-keep', 'مشروع ثابت', ownerUid));
    await setDoc(doc(d, 'projects', 'p-new'), projectDoc('p-new', 'مشروع جديد', ownerUid));
    await setDoc(doc(d, 'projects', 'p-race'), projectDoc('p-race', 'مشروع السباق', ownerUid));
    await setDoc(doc(d, 'ledgerEntries', 'keep-old'), entryDoc('keep-old', {
      projectId: 'p-keep', description: 'قيد ثابت', amount: 2200,
      createdAtServer: new Date('2026-10-20T00:00:00Z'),
    }));
    await setDoc(doc(d, 'ledgerEntries', 'new-old'), entryDoc('new-old', {
      projectId: 'p-new', description: 'قيد قبل التعيين', amount: 3300,
      entryDate: '2026-10-01',
      createdAtDevice: Date.parse('2026-10-01T00:00:00Z'),
      createdAtServer: new Date('2026-10-01T00:00:00Z'),
    }));
    await setDoc(doc(d, 'ledgerEntries', 'race-entry-1'), entryDoc('race-entry-1', {
      projectId: 'p-race', description: 'قيد السباق', amount: 4400, createdByName: 'مالك الجلسة',
    }));
  });
  await deleteApp(app);
  const root = path.join(__dirname, '../../public');
  server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', root], { stdio: 'ignore' });
  let up = false;
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(BASE)).ok) { up = true; break; } } catch (e) {}
    await sleep(100);
  }
  if (!up) throw new Error('static server did not start');
});

test.after(async () => {
  if (server) server.kill();
  if (testEnv) await testEnv.cleanup();
});

testSeq('a site user applies an assignment change on the next send, without a reload', async () => {
  const dir = '/tmp/aj-live-assign-' + Date.now();
  const session = await openBrowser(dir);
  try {
    await gotoApp(session);
    assert.equal(await login(session, SITE_EMAIL, 25000), true, 'site login. ' + detail(session));
    const before = await waitFor(session, `(() => {
      location.hash = '#project/p-keep';
      dispatchEvent(new HashChangeEvent('hashchange'));
      const text = (document.querySelector('#title').textContent || '') + '\\n' + (document.querySelector('#main').innerText || '');
      return text.includes('مشروع ثابت') && text.includes('قيد ثابت');
    })()`, 20000);
    assert.equal(before, true, 'the assigned project and its entry are on screen. ' + detail(session));
    await session.ev(`location.hash='#project/p-new'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    const hidden = await waitFor(session, `(document.querySelector('#main').innerText || '').includes('غير متاح') && !(document.querySelector('#main').innerText || '').includes('قيد قبل التعيين')`, 5000);
    assert.equal(hidden, true, 'the unassigned project is not readable yet');
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await updateDoc(doc(ctx.firestore(), 'users', siteUid), { assignedProjectIds: ['p-new'] });
    });
    await session.ev(`document.querySelector('#send').click(); 1`);
    const assigned = await waitFor(session, `((AJ.get('sessionUser') || {}).assignedProjectIds || []).join() === 'p-new'`, 20000);
    assert.equal(assigned, true, 'the profile on the device changed without a reload. ' + detail(session));
    await session.ev(`location.hash='#entry'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    const offered = await waitFor(session, `(() => { const text = document.querySelector('#main').innerText || ''; return text.includes('مشروع جديد') && !text.includes('مشروع ثابت'); })()`, 8000);
    assert.equal(offered, true, 'the entry form offers only the new project. ' + detail(session));
    await session.ev(`location.hash='#project/p-new'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    const older = await waitFor(session, `(document.querySelector('#main').innerText || '').includes('قيد قبل التعيين')`, 8000);
    assert.equal(older, true, 'entries recorded before the assignment are pulled. ' + detail(session));
    await session.ev(`location.hash='#project/p-keep'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    const gone = await waitFor(session, `(document.querySelector('#main').innerText || '').includes('غير متاح') && !(document.querySelector('#main').innerText || '').includes('قيد ثابت')`, 5000);
    assert.equal(gone, true, 'the removed project is no longer on screen');
    assert.equal(session.production, '');
  } finally { stopBrowser(session); fs.rmSync(dir, { recursive: true, force: true }); }
}, 80000);

testSeq('an entry saved while the account is suspended stays unsent and the login screen says so', async () => {
  const dir = '/tmp/aj-live-stop-' + Date.now();
  const session = await openBrowser(dir);
  const note = 'حفظ أثناء الإيقاف';
  try {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await updateDoc(doc(ctx.firestore(), 'users', siteUid), { active: true, assignedProjectIds: ['p-keep'] });
    });
    await gotoApp(session);
    assert.equal(await login(session, SITE_EMAIL, 25000), true, 'site login. ' + detail(session));
    const ready = await waitFor(session, `(AJ.get('projects') || []).some(p => p && p.id === 'p-keep')`, 20000);
    assert.equal(ready, true, 'the assigned project arrived. ' + detail(session));
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await updateDoc(doc(ctx.firestore(), 'users', siteUid), { active: false });
    });
    await session.ev(`location.hash='#entry'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    await session.ev(`document.querySelector('#amt').value='1800'; document.querySelector('#desc').value=${JSON.stringify(note)}; document.querySelector('#save').click(); 1`);
    const parked = await waitFor(session, `document.querySelector('#login').hidden === false && (document.querySelector('#login-msg').textContent || '').includes(${JSON.stringify(SUSPENDED)})`, 20000);
    assert.equal(parked, true, 'deactivation opens the login screen with the suspension message. ' + detail(session));
    const kept = await session.ev(localEntry(note));
    assert.equal(kept.found.length, 1, 'the entry is still in the local ledger: ' + JSON.stringify(kept));
    assert.equal(kept.found[0].pending, true, 'the entry stays unsent, not dropped: ' + JSON.stringify(kept.found[0]));
    assert.equal(kept.found[0].error, '', 'suspension is not stored as a permanent rejection');
    await shot(session, 'suspension-message.png');
    await session.send('Page.reload', {});
    const again = await waitFor(session, `document.body && document.body.dataset.ready === '1' && document.querySelector('#login').hidden === false && (document.querySelector('#login-msg').textContent || '').includes(${JSON.stringify(SUSPENDED)})`, 25000);
    assert.equal(again, true, 'a reload of the suspended session explains itself. ' + detail(session));
    const still = await session.ev(localEntry(note));
    assert.equal(still.found.length, 1, 'reload did not delete the entry');
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await updateDoc(doc(ctx.firestore(), 'users', siteUid), { active: true, assignedProjectIds: ['p-keep'] });
      const snap = await getDoc(doc(ctx.firestore(), 'ledgerEntries', still.found[0].id));
      assert.equal(snap.exists(), false, 'the server must not have the entry yet');
    });
    assert.equal(await login(session, SITE_EMAIL, 25000), true, 'login after reactivation. ' + detail(session));
    const sent = await waitFor(session, `(AJ.get('outbox') || []).length === 0 && (AJ.get('entries') || []).some(e => e && e.description === ${JSON.stringify(note)})`, 20000);
    assert.equal(sent, true, 'the held entry is still on the device and leaves the outbox. ' + detail(session));
    await testEnv.withSecurityRulesDisabled(async ctx => {
      const snap = await getDoc(doc(ctx.firestore(), 'ledgerEntries', still.found[0].id));
      assert.equal(snap.exists(), true, 'reactivation sends the entry');
      assert.equal(snap.data().amount, 1800);
    });
    assert.equal(session.production, '');
  } finally {
    try {
      await testEnv.withSecurityRulesDisabled(async ctx => {
        await updateDoc(doc(ctx.firestore(), 'users', siteUid), { active: true, assignedProjectIds: ['p-keep'] });
      });
    } catch (e) {}
    stopBrowser(session);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}, 120000);

testSeq('a revoked refresh token leaves the ledger for the login screen and keeps the unsent entry', async () => {
  const dir = '/tmp/aj-live-revoke-' + Date.now();
  const session = await openBrowser(dir);
  const note = 'حفظ قبل إبطال الجلسة';
  try {
    await gotoApp(session);
    assert.equal(await login(session, OWNER_EMAIL, 25000), true, 'owner login. ' + detail(session));
    const saw = await waitFor(session, `(AJ.get('projects') || []).some(p => p && p.id === 'p-race')`, 20000);
    assert.equal(saw, true, 'the owner project arrived. ' + detail(session));
    await session.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    assert.equal(await waitFor(session, `navigator.onLine === false`, 5000), true);
    await session.ev(`location.hash='#entry'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    const form = await waitFor(session, `document.querySelector('[data-proj="p-race"]')`, 5000);
    assert.equal(form, true, 'entry form is up');
    await session.ev(`document.querySelector('[data-proj="p-race"]').click(); document.querySelector('#amt').value='1500'; document.querySelector('#desc').value=${JSON.stringify(note)}; document.querySelector('#save').click(); 1`);
    const queued = await waitFor(session, `(AJ.get('outbox') || []).length === 1`, 8000);
    assert.equal(queued, true, 'the entry is waiting on the phone');
    const spoiled = await session.ev(`(async () => {
      const q = indexedDB.open('firebaseLocalStorageDb');
      const d = await new Promise((ok, no) => { q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); });
      const names = [...d.objectStoreNames];
      if (!names.includes('firebaseLocalStorage')) { d.close(); return { names, n: 0 }; }
      const tx = d.transaction('firebaseLocalStorage', 'readwrite');
      const st = tx.objectStore('firebaseLocalStorage');
      const rows = await new Promise((ok, no) => { const g = st.getAll(); g.onsuccess = () => ok(g.result || []); g.onerror = () => no(g.error); });
      let n = 0;
      for (const row of rows) {
        const bag = row && row.value && typeof row.value === 'object' ? row.value : row;
        const mgr = bag && bag.stsTokenManager;
        if (!mgr) continue;
        mgr.refreshToken = 'revoked-refresh-token';
        st.put(row);
        n++;
      }
      await new Promise((ok, no) => { tx.oncomplete = () => ok(1); tx.onerror = () => no(tx.error); });
      d.close();
      return { names, n };
    })()`);
    assert.equal(spoiled && spoiled.n, 1, 'the stored refresh token was replaced: ' + JSON.stringify(spoiled));
    session.dialogs = [];
    await session.send('Page.reload', {});
    const ready = await waitFor(session, `document.body && document.body.dataset.ready === '1'`, 20000);
    assert.equal(ready, true, 'the page reloaded. ' + detail(session));
    await session.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await session.ev(`dispatchEvent(new Event('online')); 1`);
    let left = await waitFor(session, `document.querySelector('#login').hidden === false && (document.querySelector('#login-msg').textContent || '').includes(${JSON.stringify(DEAD)})`, 20000);
    if (!left && await session.ev(`document.querySelector('#shell').hidden === false && document.querySelector('#logout')`)) {
      await session.ev(`document.querySelector('#logout').click(); 1`);
      left = await waitFor(session, `document.querySelector('#login').hidden === false && (document.querySelector('#login-msg').textContent || '').includes(${JSON.stringify(DEAD)})`, 15000);
    }
    assert.equal(left, true, 'a revoked session lands on the login screen. ' + detail(session) + ' token=' + (session.tokenUrl || '') + ' msg=' + await session.ev(`(document.querySelector('#login-msg') && document.querySelector('#login-msg').textContent) || ''`) + ' shell=' + await session.ev(`document.querySelector('#shell').hidden`));
    assert.equal(session.dialogs.some(d => /أرسلها أولاً/.test(d)), false, 'logout is not blocked by the unsent entry: ' + session.dialogs.join(' | '));
    const kept = await session.ev(localEntry(note));
    assert.equal(kept.found.length, 1, 'the local ledger is kept: ' + JSON.stringify(kept));
    assert.equal(kept.found[0].pending, true, 'the entry is still unsent');
    await shot(session, 'revoked-session-message.png');
    assert.equal(session.production, '');
  } finally { stopBrowser(session); fs.rmSync(dir, { recursive: true, force: true }); }
}, 90000);

testSeq('a lost reversal race clears the unsent label before the next pull finishes', async () => {
  const dir = '/tmp/aj-live-race-' + Date.now();
  const session = await openBrowser(dir);
  try {
    await gotoApp(session);
    assert.equal(await login(session, OWNER_EMAIL, 25000), true, 'owner login. ' + detail(session));
    const saw = await waitFor(session, `(AJ.get('entries') || []).some(e => e && e.id === 'race-entry-1')`, 20000);
    assert.equal(saw, true, 'the original entry arrived. ' + detail(session));
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await setDoc(doc(ctx.firestore(), 'ledgerEntries', 'rev_race-entry-1'), entryDoc('rev_race-entry-1', {
        projectId: 'p-race', description: 'تصحيح: قيد السباق', amount: 4400, isReversal: true,
        reversesEntryId: 'race-entry-1', reversalReason: 'سبب الخادم', createdByName: 'الفائز',
        createdBy: ownerUid,
      }));
    });
    await session.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    assert.equal(await waitFor(session, `navigator.onLine === false`, 5000), true);
    await session.ev(`location.hash='#project/p-race'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    const rev = await waitFor(session, `document.querySelector('[data-rev="race-entry-1"]')`, 5000);
    assert.equal(rev, true, 'the original row can be reversed');
    session.promptText = 'سبب الجهاز';
    await session.ev(`document.querySelector('[data-rev="race-entry-1"]').click(); 1`);
    const queued = await waitFor(session, `(AJ.get('outbox') || []).includes('rev_race-entry-1') && (document.querySelector('#main').innerText || '').includes('لم يُرسل')`, 8000);
    assert.equal(queued, true, 'the local reversal is waiting. ' + detail(session));
    await session.ev(`(() => {
      if (Sync.__origPull) return true;
      Sync.__origPull = Sync.pullChanges.bind(Sync);
      Sync.pullChanges = function (opts) {
        return new Promise(r => setTimeout(r, 1200)).then(() => Sync.__origPull(opts));
      };
      return true;
    })()`);
    await session.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await session.ev(`dispatchEvent(new Event('online')); document.querySelector('#send').click(); 1`);
    const settled = await waitFor(session, `(() => {
      const row = (AJ.get('entries') || []).find(e => e && e.id === 'rev_race-entry-1');
      const pending = (AJ.get('outbox') || []).includes('rev_race-entry-1');
      if (!row || pending || row.reversalReason !== 'سبب الخادم') return false;
      const pill = (document.querySelector('#outbox') && document.querySelector('#outbox').textContent) || '';
      const main = (document.querySelector('#main') && document.querySelector('#main').innerText) || '';
      window.__settleDom = { pill, stale: main.includes('لم يُرسل') };
      return true;
    })()`, 20000);
    assert.equal(settled, true, 'the server reversal was adopted. ' + detail(session));
    const dom = await session.ev(`window.__settleDom`);
    assert.equal(dom.stale, false, 'the row must not keep لم يُرسل after adoption: ' + JSON.stringify(dom));
    assert.match(dom.pill, /:\s*0\s*$/, 'the pill must match the empty outbox: ' + dom.pill);
    assert.equal(session.production, '');
  } finally { stopBrowser(session); fs.rmSync(dir, { recursive: true, force: true }); }
}, 90000);
