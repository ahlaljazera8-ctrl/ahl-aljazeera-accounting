// Behaviour of login / logout against the local Auth and Firestore emulators.
// A hung read must surface a message and re-enable the button. Unsent ledger
// rows stay on the device. Never points at the live project.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const test = require('node:test');
const assert = require('node:assert/strict');
const { initializeApp, deleteApp } = require('firebase/app');
const {
  getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword,
} = require('firebase/auth');
const { doc, setDoc, deleteDoc } = require('firebase/firestore');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { openChrome, waitForPage } = require('../chrome-debug.js');
const { pageExceptionText } = require('../page-exception.js');

const PROJECT = 'ahl-aljazeera-accounting';
const EMAIL = 'relogin.owner@example.invalid';
const PASS = 'emulator-only-pass';
const BASE = 'http://127.0.0.1:8765/index.html?emulator=1';
const PROJECT_ID = 'p-relogin';
const PROJECT_NAME = 'مشروع إعادة الدخول';
const UNSENT = 'إسمنت لم يُرسل';
const LIVE = /firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com/;

const sleep = ms => new Promise(r => setTimeout(r, ms));
let chain = Promise.resolve();
let testEnv;
let uid;
let server;
let portSeq = 22000;

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

function killChrome(chrome) {
  if (!chrome || !chrome.pid) return;
  try { process.kill(-chrome.pid, 'SIGKILL'); } catch (e) { try { chrome.kill('SIGKILL'); } catch (e2) {} }
}

async function connect(port, chrome) {
  const tgt = await waitForPage(port, chrome);
  const ws = new WebSocket(tgt.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = () => reject(new Error('debugger socket failed')); });
  let id = 0;
  const pend = {};
  const logs = [];
  const stalled = [];
  const session = { logs, stall: false, production: '', stalled, dialogs: [] };
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; return; }
    if (d.method === 'Runtime.consoleAPICalled') {
      logs.push((d.params.args || []).map(a => a.value || a.description || a.type || '').join(' ').slice(0, 400));
    } else if (d.method === 'Runtime.exceptionThrown') {
      logs.push(String(pageExceptionText(d.params.exceptionDetails)).slice(0, 400));
    } else if (d.method === 'Page.javascriptDialogOpening') {
      session.dialogs.push(d.params.message || '');
      send('Page.handleJavaScriptDialog', { accept: true });
    } else if (d.method === 'Fetch.requestPaused') {
      const url = d.params.request.url || '';
      const requestId = d.params.requestId;
      if (LIVE.test(url)) { session.production = url; send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }); return; }
      if (session.stall && /:8080\//.test(url)) { stalled.push(requestId); return; }
      send('Fetch.continueRequest', { requestId });
    }
  };
  const send = (method, params = {}) => new Promise(resolve => { pend[++id] = resolve; ws.send(JSON.stringify({ id, method, params })); });
  session.send = send;
  session.ev = async expression => {
    const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    const details = res.result && res.result.exceptionDetails;
    if (details) throw new Error(pageExceptionText(details));
    return res.result.result.value;
  };
  session.close = () => { try { ws.close(); } catch (e) {} };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [
    { urlPattern: 'http://127.0.0.1:8080/*' },
    { urlPattern: 'http://localhost:8080/*' },
    { urlPattern: 'http://firestore.googleapis.com/*' },
    { urlPattern: 'https://firestore.googleapis.com/*' },
    { urlPattern: 'http://identitytoolkit.googleapis.com/*' },
    { urlPattern: 'https://identitytoolkit.googleapis.com/*' },
    { urlPattern: 'http://securetoken.googleapis.com/*' },
    { urlPattern: 'https://securetoken.googleapis.com/*' },
  ] });
  return session;
}

async function openBrowser(dir) {
  const opened = await openChrome({ userDataDir: dir, detached: true });
  const chrome = opened.chrome;
  try {
    const session = await connect(opened.port, chrome);
    session.chrome = chrome;
    session.dir = dir;
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
  if (!ready) throw new Error('login page did not become ready');
  if (session.production) throw new Error('refusing live Firebase traffic: ' + session.production);
}

async function login(session, ms) {
  await session.ev(`document.querySelector('#login-email').value=${JSON.stringify(EMAIL)}; document.querySelector('#login-password').value=${JSON.stringify(PASS)}; document.querySelector('#login-btn').click(); 1`);
  return waitFor(session, `document.querySelector('#shell') && document.querySelector('#shell').hidden === false`, ms);
}

async function logout(session) {
  session.dialogs = [];
  await session.ev(`document.querySelector('#logout').click(); 1`);
  const back = await waitFor(session, `document.querySelector('#login').hidden === false && document.querySelector('#shell').hidden === true`, 15000);
  if (!back) throw new Error('logout did not show the login form' + (session.dialogs.length ? ': ' + session.dialogs.join(' ') : '') + ' ' + detail(session));
}
function incomeInUserDbs() {
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
          if (!d.objectStoreNames.contains('entries')) { d.close(); ok([]); return; }
          const g = d.transaction('entries').objectStore('entries').getAll();
          g.onsuccess = () => { d.close(); ok(g.result || []); };
          g.onerror = () => { d.close(); no(g.error); };
        };
      });
      for (const row of rows) if (row && (row.direction === 'income' || row.entryType === 'clientPayment')) found.push(row.amount);
    }
    return { names, found };
  })()`;
}

function detail(session) {
  return session.logs.filter(Boolean).slice(-8).join(' | ');
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
  const app = initializeApp({ apiKey: 'demo', projectId: PROJECT, authDomain: 'localhost' }, 'relogin-seed');
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
    await setDoc(doc(ctx.firestore(), 'users', uid), {
      displayName: 'مالك تجريبي', email: EMAIL, role: 'owner', active: true,
      assignedProjectIds: [], createdAtServer: new Date(), createdBy: uid,
    });
  });
  await deleteApp(app);
  server = spawn('python3', ['-m', 'http.server', '8765', '--bind', '127.0.0.1', '--directory', path.join(__dirname, '../../public')], { stdio: 'ignore' });
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

testSeq('login, logout, and login again completes in the same tab', async () => {
  const dir = '/tmp/aj-relogin-' + (portSeq++);
  const session = await openBrowser(dir);
  try {
    await gotoApp(session);
    assert.equal(await login(session, 20000), true, 'first login should open the ledger. ' + detail(session));
    await logout(session);
    assert.equal(await login(session, 25000), true, 'second login in the same tab should open the ledger. ' + detail(session));
    assert.equal(session.production, '');
  } finally { stopBrowser(session); fs.rmSync(dir, { recursive: true, force: true }); }
}, 70000);

testSeq('after a browser restart on the same profile, login completes', async () => {
  const dir = '/tmp/aj-relogin-' + (portSeq++);
  const first = await openBrowser(dir);
  try {
    await gotoApp(first);
    assert.equal(await login(first, 20000), true, 'login before restart. ' + detail(first));
    await logout(first);
  } finally { stopBrowser(first); }
  await sleep(400);
  const second = await openBrowser(dir);
  try {
    await gotoApp(second);
    const form = await waitFor(second, `document.querySelector('#login').hidden === false`, 10000);
    assert.equal(form, true, 'signed-out profile should show the login form');
    assert.equal(await login(second, 25000), true, 'login after restart should open the ledger. ' + detail(second));
    assert.equal(second.production, '');
  } finally { stopBrowser(second); fs.rmSync(dir, { recursive: true, force: true }); }
}, 80000);

testSeq('a signed-in profile still opens after the browser restarts', async () => {
  const dir = '/tmp/aj-relogin-' + (portSeq++);
  const first = await openBrowser(dir);
  try {
    await gotoApp(first);
    assert.equal(await login(first, 20000), true, 'login. ' + detail(first));
  } finally { stopBrowser(first); }
  await sleep(400);
  const second = await openBrowser(dir);
  try {
    await gotoApp(second);
    const opened = await waitFor(second, `document.querySelector('#shell').hidden === false`, 25000);
    assert.equal(opened, true, 'restoring the signed-in profile should open the ledger. ' + detail(second));
    const who = await second.ev(`document.querySelector('#who').textContent`);
    assert.match(who, /مالك تجريبي/);
    assert.equal(second.production, '');
  } finally { stopBrowser(second); fs.rmSync(dir, { recursive: true, force: true }); }
}, 70000);

testSeq('a hung Firestore read shows an Arabic message and re-enables the button', async () => {
  const dir = '/tmp/aj-relogin-' + (portSeq++);
  const session = await openBrowser(dir);
  try {
    await gotoApp(session);
    assert.equal(await login(session, 20000), true, 'login before the hang. ' + detail(session));
    await logout(session);
    // The poisoned client (or a black-holed backend) must not leave the button disabled with no text.
    session.stall = true;
    await session.ev(`document.querySelector('#login-email').value=${JSON.stringify(EMAIL)}; document.querySelector('#login-password').value=${JSON.stringify(PASS)}; document.querySelector('#login-btn').click(); 1`);
    await sleep(3000);
    assert.equal(await session.ev(`document.querySelector('#login-btn').disabled`), true, 'the button stays disabled while the read is still hanging');
    const back = await waitFor(session, `document.querySelector('#login-btn').disabled === false && (document.querySelector('#login-msg').textContent || '').trim().length > 0`, 70000);
    assert.equal(back, true, 'a hung read must re-enable the button and show a message. ' + detail(session));
    const msg = await session.ev(`document.querySelector('#login-msg').textContent`);
    assert.match(msg, /[\u0600-\u06FF]/, 'the message is Arabic: ' + msg);
    assert.equal(await session.ev(`document.querySelector('#shell').hidden`), true, 'a failed login stays on the login form');
    assert.equal(session.production, '');
  } finally { stopBrowser(session); fs.rmSync(dir, { recursive: true, force: true }); }
}, 120000);

testSeq('logout removes synced income from the device and keeps an unsent entry', async () => {
  const dir = '/tmp/aj-relogin-' + (portSeq++);
  const session = await openBrowser(dir);
  try {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      const d = ctx.firestore();
      await setDoc(doc(d, 'projects', 'p-income'), {
        id: 'p-income', name: 'مشروع الدخل', clientName: 'زبون', location: 'السماوة', currency: 'IQD',
        status: 'active', createdAtDevice: 1, createdAtServer: new Date(), createdBy: uid, deviceId: 'admin',
      });
      await setDoc(doc(d, 'ledgerEntries', 'inc-logout'), {
        id: 'inc-logout', projectId: 'p-income', direction: 'income', entryType: 'clientPayment', amount: 424242,
        currency: 'IQD', entryDate: '2026-10-30', description: 'دفعة ظاهرة', partyName: '', isReversal: false,
        createdAtDevice: 1700000000000, createdAtServer: new Date(), createdBy: uid, deviceId: 'admin',
      });
    });
    await gotoApp(session);
    assert.equal(await login(session, 20000), true, 'login. ' + detail(session));
    const sawIncome = await waitFor(session, `(AJ.get('entries') || []).some(e => e && e.amount === 424242 && e.direction === 'income')`, 15000);
    assert.equal(sawIncome, true, 'synced income should arrive. ' + detail(session));
    await session.ev(`AJ.flush().then(() => 1)`);
    const stored = await session.ev(incomeInUserDbs());
    assert.ok(stored.found.includes(424242), 'income should be in IndexedDB before logout: ' + JSON.stringify(stored));
    await session.ev(`navigator.serviceWorker.ready.then(() => 1)`);
    await session.ev(`caches.open('poison').then(c => c.put('https://firestore.googleapis.com/v1/poison', new Response('POISON', { status: 200 })))`);
    await logout(session);
    const left = await session.ev(incomeInUserDbs());
    assert.deepEqual(left.found, [], 'logout must not leave income in IndexedDB: ' + JSON.stringify(left));
    assert.deepEqual(left.names, []);
    const poison = await session.ev(`caches.match('https://firestore.googleapis.com/v1/poison').then(r => r ? r.text() : '')`);
    assert.equal(poison, '', 'logout clears cached responses that are not the app shell');
    const shell = await session.ev(`caches.match(location.origin + '/style.css').then(r => !!r)`);
    assert.equal(shell, true, 'the app shell stays cached');
    assert.equal(session.production, '');
  } finally { stopBrowser(session); fs.rmSync(dir, { recursive: true, force: true }); }
}, 80000);

testSeq('an unsent entry blocks logout, and a refused entry stays on the device without staying pending', async () => {
  const dir = '/tmp/aj-relogin-' + (portSeq++);
  const session = await openBrowser(dir);
  try {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await setDoc(doc(ctx.firestore(), 'projects', PROJECT_ID), {
        id: PROJECT_ID, name: PROJECT_NAME, clientName: 'زبون', location: 'السماوة', currency: 'IQD',
        status: 'active', createdAtDevice: 1, createdAtServer: new Date(), createdBy: uid, deviceId: 'admin',
      });
    });
    await gotoApp(session);
    assert.equal(await login(session, 20000), true, 'login. ' + detail(session));
    const sawProject = await waitFor(session, `location.hash='#projects', dispatchEvent(new HashChangeEvent('hashchange')), document.querySelector('#main').innerText.includes(${JSON.stringify(PROJECT_NAME)})`, 15000);
    assert.equal(sawProject, true, 'the project should arrive from the emulator');
    await session.send('Network.enable');
    await session.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    assert.equal(await waitFor(session, `navigator.onLine === false`, 5000), true, 'the phone is offline');
    await session.ev(`location.hash='#entry'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    const form = await waitFor(session, `document.querySelector(${JSON.stringify('[data-proj="' + PROJECT_ID + '"]')})`, 5000);
    assert.equal(form, true, 'entry form should render');
    await session.ev(`document.querySelector(${JSON.stringify('[data-proj="' + PROJECT_ID + '"]')}).click(); 1`);
    await session.ev(`document.querySelector('[data-add="1000"]').click(); 1`);
    await session.ev(`document.querySelector('#desc').value=${JSON.stringify(UNSENT)}; document.querySelector('#save').click(); 1`);
    const queued = await waitFor(session, `(()=>{const btn=document.querySelector('#outbox');const badge=btn&&btn.querySelector('.bell-badge');const panel=document.querySelector('#bell-panel');const n=(AJ.get('outbox')||[]).length;const label=(btn&&btn.getAttribute('aria-label'))||'';const text=panel?panel.innerText:'';return n===1&&btn&&btn.tagName==='BUTTON'&&badge&&badge.hidden===false&&badge.textContent==='1'&&label.includes('لم يُرسل بعد: 1')&&label.includes('بدون إنترنت')&&text.includes('إرسال الآن')&&text.includes('آخر مزامنة')&&text.includes('1')})()`, 8000);
    assert.equal(queued, true, 'an offline save stays in the pending count');
    session.dialogs = [];
    await session.ev(`document.querySelector('#logout').click(); 1`);
    await sleep(400);
    assert.equal(await session.ev(`document.querySelector('#shell').hidden`), false, 'logout with an unsent entry stays in the ledger');
    assert.match(session.dialogs.join('\n'), /[\u0600-\u06FF]/, 'the warning is Arabic: ' + session.dialogs.join(' '));
    assert.match(session.dialogs.join('\n'), /أرسل/);

    await session.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await session.ev(`dispatchEvent(new Event('online')); window.__run = window.flushing; 1`);
    const settled = await session.ev(`(async () => {
      let run = window.__run;
      while (run) { await run; run = window.flushing; }
      const bell = document.querySelector('#outbox');
      const busy = !!(bell && bell.getAttribute('aria-busy') === 'true');
      const n = (AJ.get('outbox') || []).length;
      const still = (AJ.get('projects') || []).some(p => p && p.id === ${JSON.stringify(PROJECT_ID)});
      return { n, busy, still, armed: !!window.flushTimer };
    })()`);
    assert.equal(settled.n, 0, 'the offline entry sends once the phone is back. ' + detail(session));
    assert.equal(settled.busy, false, 'the bell is idle after the send. ' + detail(session));
    assert.equal(settled.still, true, 'the project is still on the phone. ' + detail(session));
    assert.equal(settled.armed, false, 'no flush is armed. ' + detail(session));

    await testEnv.withSecurityRulesDisabled(async ctx => {
      await deleteDoc(doc(ctx.firestore(), 'projects', PROJECT_ID));
    });
    const refusedNote = 'مرفوض بعد حذف المشروع';
    await session.ev(`location.hash='#entry'; dispatchEvent(new HashChangeEvent('hashchange')); document.querySelector(${JSON.stringify('[data-proj="' + PROJECT_ID + '"]')}).click(); document.querySelector('#amt').value='1000'; document.querySelector('#desc').value=${JSON.stringify(refusedNote)}; document.querySelector('#save').click(); 1`);
    const refused = await waitFor(session, `(()=>{
      const row = (AJ.get('entries')||[]).find(e => e && e.description === ${JSON.stringify(refusedNote)});
      if (!row) return false;
      const pending = (AJ.get('outbox')||[]).includes(row.id);
      const err = (AJ.get('syncErrors')||{})[row.id] || '';
      const btn = document.querySelector('#outbox');
      const badge = btn && btn.querySelector('.bell-badge');
      const panel = document.querySelector('#bell-panel');
      const label = (btn && btn.getAttribute('aria-label')) || '';
      const text = panel ? panel.innerText : '';
      return !pending && /رُفض|محتوى/.test(err) && btn && btn.tagName === 'BUTTON' && badge && badge.hidden === true && label.includes('لم يُرسل بعد: 0') && label.includes(err) && text.includes(err) && text.includes('إرسال الآن');
    })()`, 20000);
    assert.equal(refused, true, 'a definitive refusal leaves the pending count and keeps an error. ' + detail(session));
    await session.send('Page.reload', {});
    const ready = await waitFor(session, `document.body && document.body.dataset.ready === '1' && document.querySelector('#shell').hidden === false`, 20000);
    assert.equal(ready, true, 'the session should reopen. ' + detail(session));
    const still = await waitFor(session, `(async () => {
      const dbs = await indexedDB.databases();
      for (const info of dbs) {
        if (!info.name || !String(info.name).startsWith('aj-u-')) continue;
        const rows = await new Promise((ok, no) => { const r = indexedDB.open(info.name); r.onerror = () => no(r.error); r.onsuccess = () => { const d = r.result; const g = d.transaction('entries').objectStore('entries').getAll(); g.onsuccess = () => { d.close(); ok(g.result || []); }; g.onerror = () => { d.close(); no(g.error); }; }; });
        if (rows.some(row => row && row.description === ${JSON.stringify(refusedNote)})) return true;
      }
      return false;
    })()`, 10000);
    assert.equal(still, true, 'the refused entry is still on the device');
    assert.equal(session.production, '');
  } finally { stopBrowser(session); fs.rmSync(dir, { recursive: true, force: true }); }
}, 80000);

testSeq('a pull that learns the project is gone removes the pill and does not throw', async () => {
  const dir = '/tmp/aj-relogin-' + (portSeq++);
  const session = await openBrowser(dir);
  try {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await setDoc(doc(ctx.firestore(), 'projects', PROJECT_ID), {
        id: PROJECT_ID, name: PROJECT_NAME, clientName: 'زبون', location: 'السماوة', currency: 'IQD',
        status: 'active', createdAtDevice: 1, createdAtServer: new Date(), createdBy: uid, deviceId: 'admin',
      });
    });
    await gotoApp(session);
    assert.equal(await login(session, 20000), true, 'login. ' + detail(session));
    const sawProject = await waitFor(session, `location.hash='#projects', dispatchEvent(new HashChangeEvent('hashchange')), document.querySelector('#main').innerText.includes(${JSON.stringify(PROJECT_NAME)})`, 15000);
    assert.equal(sawProject, true, 'the project should arrive from the emulator');
    await session.ev(`location.hash='#entry'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    const form = await waitFor(session, `document.querySelector(${JSON.stringify('[data-proj="' + PROJECT_ID + '"]')})`, 5000);
    assert.equal(form, true, 'entry form should render');
    await session.ev(`window.__gate = new Promise(resolve => { window.__open = resolve; });
      window.__held = false;
      const orig = forgetGoneProjects;
      forgetGoneProjects = async function () {
        window.__held = true;
        await window.__gate;
        return orig.apply(this, arguments);
      };
      1`);
    await session.ev(`dispatchEvent(new Event('online')); 1`);
    const held = await waitFor(session, `window.__held === true`, 20000);
    assert.equal(held, true, 'the pull is held inside forgetGoneProjects. ' + detail(session));
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await deleteDoc(doc(ctx.firestore(), 'projects', PROJECT_ID));
    });
    await session.ev(`(async () => { window.__open(); let run = window.flushing; while (run) { await run; run = window.flushing; } return 1; })()`);
    const after = await session.ev(`({
      pill: !!document.querySelector(${JSON.stringify('[data-proj="' + PROJECT_ID + '"]')}),
      err: (document.querySelector('#render-error') || {}).textContent || ''
    })`);
    assert.equal(after.pill, false, 'the pill is gone after the pull learns the project is gone');
    assert.equal(after.err, '', 'render did not throw');
    assert.equal(session.production, '');
  } finally { stopBrowser(session); fs.rmSync(dir, { recursive: true, force: true }); }
}, 80000);
