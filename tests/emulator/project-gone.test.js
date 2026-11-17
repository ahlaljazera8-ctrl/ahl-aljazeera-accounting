// A gone project must not take the entry, and a queued line must survive the local drop.
// Local emulators only. Never call production.
const fs = require('fs');
const path = require('path');
const http = require('http');
const test = require('node:test');
const assert = require('node:assert/strict');
const { initializeApp, deleteApp } = require('firebase/app');
const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { doc, setDoc, getDoc, deleteDoc, getDocs, collection } = require('firebase/firestore');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { openChrome, waitForPage } = require('../chrome-debug.js');
const { pageExceptionText } = require('../page-exception.js');

const PROJECT = 'ahl-aljazeera-accounting';
const PASS = 'emulator-only-pass';
const OWNER_EMAIL = 'gone.owner@example.invalid';
const OWNER2_EMAIL = 'gone.owner2@example.invalid';
const OWNER_NAME = 'مالك أول';
const OWNER2_NAME = 'مالك ثان';
const GONE = 'هذا المشروع لم يعد موجوداً. لم يُحفظ القيد، اختر مشروعاً ثم احفظ.';
const LINES = 'في هذا المشروع قيود لم تُرسل أو رُفض إرسالها. أرسلها أو صدّرها قبل الحذف.';
const REFUSED = 'رُفض الإرسال لأن المشروع محذوف';
const LIVE = /firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com/;
const sleep = ms => new Promise(r => setTimeout(r, ms));

let testEnv;
let server;
let origin;
let ownerUid;
let owner2Uid;
let seq = 0;

function localHost(name) {
  const raw = process.env[name];
  if (!raw || !/^(127\.0\.0\.1|localhost):\d+$/.test(raw)) {
    throw new Error(name + ' must be a local emulator (refusing production). Got: ' + raw);
  }
  const [host, port] = raw.split(':');
  return { host, port: Number(port) };
}

function startServer() {
  const root = path.join(__dirname, '../../public');
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    const rel = u.pathname === '/' ? '/index.html' : decodeURIComponent(u.pathname);
    const file = path.normalize(path.join(root, rel));
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('missing'); return;
    }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => srv.listen(0, '127.0.0.1', () => resolve(srv)));
}

function killChrome(chrome) {
  if (chrome && chrome.pid) {
    try { process.kill(-chrome.pid, 'SIGKILL'); } catch (e) { try { chrome.kill('SIGKILL'); } catch (e2) {} }
  }
}

async function connect(port, chrome) {
  const tgt = await waitForPage(port, chrome);
  const ws = new WebSocket(tgt.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = () => reject(new Error('debugger socket failed')); });
  let id = 0;
  const pend = {};
  const session = { logs: [], production: '' };
  const send = (method, params = {}) => new Promise(resolve => { pend[++id] = resolve; ws.send(JSON.stringify({ id, method, params })); });
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; return; }
    if (d.method === 'Runtime.consoleAPICalled') {
      session.logs.push((d.params.args || []).map(a => a.value || a.description || '').join(' ').slice(0, 300));
    } else if (d.method === 'Runtime.exceptionThrown') {
      session.logs.push(String(pageExceptionText(d.params.exceptionDetails)).slice(0, 300));
    } else if (d.method === 'Fetch.requestPaused') {
      const url = d.params.request.url || '';
      if (LIVE.test(url)) { session.production = url; send('Fetch.failRequest', { requestId: d.params.requestId, errorReason: 'BlockedByClient' }); return; }
      send('Fetch.continueRequest', { requestId: d.params.requestId });
    }
  };
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

async function waitFor(session, expr, ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try { if (await session.ev(expr)) return true; } catch (e) {}
    await sleep(250);
  }
  return false;
}

async function openPage() {
  const dir = '/tmp/aj-gone-' + process.pid + '-' + (seq++);
  const opened = await openChrome({ userDataDir: dir, detached: true });
  const session = await connect(opened.port, opened.chrome);
  session.chrome = opened.chrome;
  session.dir = dir;
  return session;
}

function closePage(session) {
  if (!session) return;
  try { session.close(); } catch (e) {}
  killChrome(session.chrome);
  fs.rmSync(session.dir, { recursive: true, force: true });
}

async function ensureAuthUser(auth, email) {
  try { return await createUserWithEmailAndPassword(auth, email, PASS); }
  catch (err) {
    if (err && err.code === 'auth/email-already-in-use') return signInWithEmailAndPassword(auth, email, PASS);
    throw err;
  }
}

async function writeUser(uid, email, name) {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users', uid), {
      displayName: name, email, role: 'owner', active: true,
      assignedProjectIds: [], createdAtServer: new Date(), createdBy: uid,
    });
  });
}

async function seedProject(id, name, uid) {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'projects', id), {
      id, name, clientName: 'زبون', location: 'السماوة', currency: 'IQD',
      status: 'active', createdAtDevice: 1, createdAtServer: new Date(), createdBy: uid, deviceId: 'admin',
    });
  });
}

async function seedEntry(id, projectId, uid, extra) {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'ledgerEntries', id), Object.assign({
      id, projectId, direction: 'expense', entryType: 'materials', amount: 1000,
      currency: 'IQD', entryDate: '2026-11-17', description: 'قيد مزامن', partyName: '', isReversal: false,
      createdAtDevice: 1700000000000, createdAtServer: new Date(), createdBy: uid, deviceId: 'admin',
    }, extra || {}));
  });
}

async function projectExists(id) {
  let yes = false;
  await testEnv.withSecurityRulesDisabled(async ctx => {
    yes = (await getDoc(doc(ctx.firestore(), 'projects', id))).exists();
  });
  return yes;
}

async function entriesWhere(projectId, description) {
  let rows = [];
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const snap = await getDocs(collection(ctx.firestore(), 'ledgerEntries'));
    rows = snap.docs.map(d => d.data()).filter(row => row.projectId === projectId && (!description || row.description === description));
  });
  return rows;
}

async function login(session, email) {
  await session.send('Page.navigate', { url: origin + '/index.html?emulator=1' });
  assert.equal(await waitFor(session, `document.body && document.body.dataset.ready === '1'`, 20000), true, 'login page ready ' + session.logs.slice(-4).join(' | '));
  assert.equal(session.production, '', 'refusing live Firebase traffic');
  await session.ev(`document.querySelector('#login-email').value=${JSON.stringify(email)}; document.querySelector('#login-password').value=${JSON.stringify(PASS)}; document.querySelector('#login-btn').click(); 1`);
  assert.equal(await waitFor(session, `document.querySelector('#shell') && document.querySelector('#shell').hidden === false`, 25000), true, 'login opens the app ' + session.logs.slice(-6).join(' | '));
}

async function reloadApp(session, hash) {
  await session.ev(`location.hash=${JSON.stringify(hash)}; 1`);
  await session.ev(`navigator.serviceWorker.ready.then(() => 1)`);
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await session.ev(`document.body.dataset.ready=''; 1`);
  await session.send('Page.reload');
  const opened = await waitFor(session, `document.body && document.body.dataset.ready === '1' && document.querySelector('#shell') && document.querySelector('#shell').hidden === false`, 20000);
  if (!opened) {
    const text = await session.ev(`(document.body && document.body.innerText || '').slice(0, 300)`).catch(err => String(err));
    throw new Error('reload did not open the saved session: ' + text + ' ' + session.logs.slice(-4).join(' | '));
  }
  return true;
}

test.before(async () => {
  const fsHost = localHost('FIRESTORE_EMULATOR_HOST');
  const authHost = localHost('FIREBASE_AUTH_EMULATOR_HOST');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8'), host: fsHost.host, port: fsHost.port },
  });
  const app = initializeApp({ apiKey: 'demo', projectId: PROJECT, authDomain: 'localhost' }, 'gone-seed');
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://' + authHost.host + ':' + authHost.port, { disableWarnings: true });
  ownerUid = (await ensureAuthUser(auth, OWNER_EMAIL)).user.uid;
  owner2Uid = (await ensureAuthUser(auth, OWNER2_EMAIL)).user.uid;
  await deleteApp(app);
  server = await startServer();
  origin = 'http://127.0.0.1:' + server.address().port;
});

test.after(async () => {
  if (server) server.close();
  if (testEnv) await testEnv.cleanup();
});

test.beforeEach(async () => {
  await testEnv.clearFirestore();
  await writeUser(ownerUid, OWNER_EMAIL, OWNER_NAME);
  await writeUser(owner2Uid, OWNER2_EMAIL, OWNER2_NAME);
});

test('11 two open projects do not take the entry', { timeout: 120000 }, async () => {
  const idA = 'p-gone-a';
  const idB = 'p-gone-b';
  const note = 'ملاحظة لا تنتقل';
  await seedProject(idA, 'مشروع ألف', ownerUid);
  await seedProject(idB, 'مشروع باء', ownerUid);
  await seedEntry('e-b-stay', idB, ownerUid, { description: 'قيد باء', amount: 2222 });
  const session = await openPage();
  try {
    await login(session, OWNER_EMAIL);
    assert.equal(await waitFor(session, `(AJ.get('projects')||[]).some(p => p && p.id === ${JSON.stringify(idA)}) && (AJ.get('projects')||[]).some(p => p && p.id === ${JSON.stringify(idB)})`, 20000), true, 'both projects arrive');
    await session.ev(`location.hash='#entry'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    assert.equal(await waitFor(session, `document.querySelector(${JSON.stringify('[data-proj="' + idA + '"]')})`, 5000), true, 'the entry form lists project A');
    await session.ev(`document.querySelector(${JSON.stringify('[data-proj="' + idA + '"]')}).click(); 1`);
    await session.ev(`document.querySelector('#amt').value='1500'; document.querySelector('#desc').value=${JSON.stringify(note)}; 1`);
    const beforeB = (await entriesWhere(idB)).length;
    assert.equal(await waitFor(session, `!flushing`, 20000), true, 'the login pull finishes before the project is deleted');
    await testEnv.withSecurityRulesDisabled(async ctx => { await deleteDoc(doc(ctx.firestore(), 'projects', idA)); });
    await session.ev(`flushRemote({ fromOutside: true })`);
    assert.equal(await waitFor(session, `!(AJ.get('projects')||[]).some(p => p && p.id === ${JSON.stringify(idA)})`, 20000), true, 'the pull drops project A');
    const view = await session.ev(`(() => {
      const save = document.querySelector('#save');
      const text = (document.querySelector('#main') && document.querySelector('#main').innerText) || '';
      if (save) save.click();
      return {
        text,
        disabled: !!(save && save.disabled),
        selected: !!document.querySelector('[data-proj].on'),
        amount: document.querySelector('#amt') && document.querySelector('#amt').value,
        note: document.querySelector('#desc') && document.querySelector('#desc').value,
        local: (AJ.get('entries') || []).some(e => e && e.description === ${JSON.stringify(note)}),
      };
    })()`);
    assert.equal(view.text.includes(GONE), true, 'the approved sentence is on screen');
    assert.equal(view.disabled, true);
    assert.equal(view.selected, false);
    assert.equal(view.amount, '1500');
    assert.equal(view.note, note);
    assert.equal(view.local, false);
    await sleep(1000);
    assert.equal((await entriesWhere(idB)).length, beforeB);
    assert.equal((await entriesWhere(idA, note)).length, 0);
    assert.equal((await entriesWhere(idB, note)).length, 0);
    assert.equal(session.production, '');
  } finally { closePage(session); }
});

test('12 one gone project keeps its id and stores nothing', { timeout: 120000 }, async () => {
  const idA = 'p-gone-only';
  const note = 'ملاحظة المشروع الوحيد';
  await seedProject(idA, 'مشروع وحيد', ownerUid);
  const session = await openPage();
  try {
    await login(session, OWNER_EMAIL);
    assert.equal(await waitFor(session, `(AJ.get('projects')||[]).some(p => p && p.id === ${JSON.stringify(idA)})`, 20000), true);
    await session.ev(`(() => {
      const orig = Ledger.entryProjectChoice.bind(Ledger);
      window.__choices = [];
      Ledger.entryProjectChoice = function (input) {
        window.__choices.push(input && input.currentId);
        return orig(input);
      };
      return 1;
    })()`);
    await session.ev(`location.hash=${JSON.stringify('#entry/' + idA)}; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    await session.ev(`document.querySelector('#amt').value='1500'; document.querySelector('#desc').value=${JSON.stringify(note)}; 1`);
    assert.equal(await waitFor(session, `!flushing`, 20000), true, 'the login pull finishes before the project is deleted');
    await testEnv.withSecurityRulesDisabled(async ctx => { await deleteDoc(doc(ctx.firestore(), 'projects', idA)); });
    await session.ev(`flushRemote({ fromOutside: true })`);
    assert.equal(await waitFor(session, `!(AJ.get('projects')||[]).some(p => p && p.id === ${JSON.stringify(idA)})`, 20000), true);
    const current = await session.ev(`(() => { render(); const list = window.__choices || []; return list[list.length - 1]; })()`);
    const local = await session.ev(`(AJ.get('entries')||[]).some(e => e && e.description === ${JSON.stringify(note)})`);
    assert.equal(current, idA);
    assert.equal(local, false);
    assert.equal((await entriesWhere(idA, note)).length, 0);
    assert.equal(session.production, '');
  } finally { closePage(session); }
});

test('13 reload drops the gone project and keeps the refused row', { timeout: 120000 }, async () => {
  const idA = 'p-reload-a';
  const idB = 'p-reload-b';
  await seedProject(idA, 'مشروع الحذف', ownerUid);
  await seedProject(idB, 'مشروع الباقي', ownerUid);
  await seedEntry('e-synced', idA, ownerUid, { description: 'قيد واصل', amount: 3333 });
  const session = await openPage();
  try {
    await login(session, OWNER_EMAIL);
    assert.equal(await waitFor(session, `!flushing && (AJ.get('entries')||[]).some(e => e && e.id === 'e-synced')`, 20000), true, 'the synced entry arrives');
    const bell = await session.ev(`(async () => {
      const refused = { id:'e-refused', projectId:${JSON.stringify(idA)}, direction:'expense', entryType:'materials', amount:4444, currency:'IQD', entryDate:'2026-11-17', description:'قيد مرفوض', partyName:'', isReversal:false, createdAtDevice:9, createdBy:${JSON.stringify(ownerUid)}, deviceId:'phone' };
      const queued = { id:'e-queued', projectId:${JSON.stringify(idB)}, amount:5555, description:'قيد منتظر', createdAtDevice:10, createdBy:${JSON.stringify(ownerUid)}, deviceId:'phone' };
      await set(K.entries, (AJ.get('entries')||[]).concat([refused, queued]));
      await set(K.outbox, (AJ.get('outbox')||[]).concat(['e-queued']));
      const errors = Object.assign({}, AJ.get('syncErrors')||{});
      errors['e-refused'] = ${JSON.stringify(REFUSED)};
      await set(K.syncErrors, errors);
      return (AJ.get('outbox')||[]).length;
    })()`);
    await testEnv.withSecurityRulesDisabled(async ctx => { await deleteDoc(doc(ctx.firestore(), 'projects', idA)); });
    await session.ev(`(async () => { const run = flushRemote({ fromOutside: true }); await (window.flushing || run); return 1; })()`);
    assert.equal(await reloadApp(session, '#projects'), true, 'the reloaded page opens from the same database');
    const seen = await session.ev(`(() => {
      const text = (document.querySelector('#main') && document.querySelector('#main').innerText) || '';
      return { text, outbox: (AJ.get('outbox')||[]).length, projects: (AJ.get('projects')||[]).map(p => p && p.name) };
    })()`);
    assert.equal(seen.projects.includes('مشروع الحذف'), false);
    assert.equal(seen.outbox, bell);
    await session.ev(`location.hash='#rejected'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    const rejected = await session.ev(`(document.querySelector('#main') && document.querySelector('#main').innerText) || ''`);
    assert.equal(rejected.includes(REFUSED), true, rejected);
    assert.equal(session.production, '');
  } finally { closePage(session); }
});

test('14 the other owner phone keeps its queued line', { timeout: 180000 }, async () => {
  const idA = 'p-two-a';
  const idC = 'p-two-c';
  const note = 'حفظ الهاتف الثاني';
  await seedProject(idA, 'مشروع مشترك', ownerUid);
  await seedProject(idC, 'مشروع الهاتف', ownerUid);
  const phoneB = await openPage();
  const phoneA = await openPage();
  try {
    await login(phoneB, OWNER2_EMAIL);
    await phoneB.ev(`(async () => { const run = flushRemote({ fromOutside: true }); await (window.flushing || run); return 1; })()`);
    const sawB = await phoneB.ev(`(AJ.get('projects')||[]).some(p => p && p.id === ${JSON.stringify(idA)}) && (AJ.get('projects')||[]).some(p => p && p.id === ${JSON.stringify(idC)})`);
    assert.equal(sawB, true, 'phone B sees the project ' + phoneB.logs.slice(-8).join(' | '));
    await phoneB.ev(`(async () => {
      const queued = { id:'e-phone-b', projectId:${JSON.stringify(idA)}, direction:'expense', entryType:'materials', amount:6666, currency:'IQD', entryDate:'2026-11-17', description:'قيد الهاتف', partyName:'', isReversal:false, createdAtDevice:11, createdBy:${JSON.stringify(owner2Uid)}, deviceId:'phone-b' };
      await set(K.entries, (AJ.get('entries')||[]).concat([queued]));
      await set(K.outbox, (AJ.get('outbox')||[]).concat(['e-phone-b']));
      return 1;
    })()`);
    await phoneB.ev(`location.hash=${JSON.stringify('#entry/' + idA)}; dispatchEvent(new HashChangeEvent('hashchange')); document.querySelector(${JSON.stringify('[data-proj="' + idA + '"]')}).click(); 1`);
    await login(phoneA, OWNER_EMAIL);
    await phoneA.ev(`(async () => { const run = flushRemote({ fromOutside: true }); await (window.flushing || run); return 1; })()`);
    const sawA = await phoneA.ev(`(AJ.get('projects')||[]).some(p => p && p.id === ${JSON.stringify(idA)})`);
    assert.equal(sawA, true, 'phone A sees the project ' + phoneA.logs.slice(-8).join(' | '));
    await phoneA.ev(`location.hash=${JSON.stringify('#project/' + idA)}; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    await phoneA.ev(`document.querySelector('#manage-project').click(); document.querySelector('#choose-delete').click(); document.querySelector('#confirm-yes').click(); 1`);
    await phoneA.ev(`(() => {
      const input = document.querySelector('#delete-name');
      input.value = 'مشروع مشترك';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#confirm-delete').click();
      return 1;
    })()`);
    assert.equal(await waitFor(phoneA, `!(AJ.get('projects')||[]).some(p => p && p.id === ${JSON.stringify(idA)})`, 20000), true, 'phone A drops the project after the server delete');
    assert.equal(await projectExists(idA), false);
    await phoneB.ev(`forgetGoneProjects(me(), [${JSON.stringify(idA)}], async (spec) => spec && spec.id === ${JSON.stringify(idA)} ? [] : [{ id: spec && spec.id, createdAtServer: 1 }])`);
    await phoneB.ev(`AJ.flush()`);
    const mid = await phoneB.ev(`(async () => {
      const dbs = await indexedDB.databases();
      const names = dbs.map(d => d.name).filter(n => n && String(n).startsWith('aj-u-'));
      const stored = [];
      for (const name of names) {
        const rows = await new Promise((ok, no) => {
          const r = indexedDB.open(name);
          r.onerror = () => no(r.error);
          r.onsuccess = () => {
            const d = r.result;
            const g = d.transaction('entries').objectStore('entries').getAll();
            g.onsuccess = () => { d.close(); ok(g.result || []); };
            g.onerror = () => { d.close(); no(g.error); };
          };
        });
        rows.forEach(row => { if (row && row.id) stored.push(name + ':' + row.id); });
      }
      return { memory: (AJ.get('entries')||[]).map(e => e && e.id), outbox: AJ.get('outbox') || [], stored, names };
    })()`);
    assert.equal(mid.memory.includes('e-phone-b') && mid.stored.some(id => id.endsWith('e-phone-b')), true, 'before reload ' + JSON.stringify(mid));
    assert.equal(await reloadApp(phoneB, '#entry/' + idA), true, 'phone B reloads onto the same database');
    await phoneB.ev(`document.querySelector('#amt').value='1700'; document.querySelector('#desc').value=${JSON.stringify(note)}; 1`);
    const view = await phoneB.ev(`(() => {
      render();
      const save = document.querySelector('#save');
      if (save) save.click();
      return {
        hash: location.hash,
        projects: (AJ.get('projects') || []).map(p => p && p.id),
        selected: !!document.querySelector('[data-proj].on'),
        outbox: AJ.get('outbox') || [],
        entries: (AJ.get('entries') || []).map(e => e && e.id),
        localNote: (AJ.get('entries') || []).some(e => e && e.description === ${JSON.stringify(note)}),
      };
    })()`);
    if (!view.entries.includes('e-phone-b')) throw new Error('after reload ' + JSON.stringify(view));
    assert.equal(view.outbox.includes('e-phone-b'), true);
    assert.equal(view.selected, false);
    assert.equal(view.localNote, false);
    assert.equal((await entriesWhere(idC, note)).length, 0);
    assert.equal((await entriesWhere(idA, note)).length, 0);
    assert.equal(phoneB.production, '');
    assert.equal(phoneA.production, '');
  } finally { closePage(phoneB); closePage(phoneA); }
});

test('15 an offline save stays on the chosen project', { timeout: 120000 }, async () => {
  const idA = 'p-off-a';
  const idB = 'p-off-b';
  const note = 'حفظ دون اتصال';
  await seedProject(idA, 'مشروع أول', ownerUid);
  await seedProject(idB, 'مشروع ثان', ownerUid);
  const session = await openPage();
  try {
    await login(session, OWNER_EMAIL);
    assert.equal(await waitFor(session, `(AJ.get('projects')||[]).some(p => p && p.id === ${JSON.stringify(idB)})`, 20000), true);
    await session.ev(`location.hash='#entry'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    assert.equal(await waitFor(session, `document.querySelector(${JSON.stringify('[data-proj="' + idB + '"]')})`, 5000), true);
    await session.ev(`document.querySelector(${JSON.stringify('[data-proj="' + idB + '"]')}).click(); 1`);
    await session.send('Network.enable');
    await session.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await session.ev(`document.querySelector('#amt').value='1800'; document.querySelector('#desc').value=${JSON.stringify(note)}; document.querySelector('#save').click(); 1`);
    const queued = await session.ev(`(() => { const row = (AJ.get('entries')||[]).find(e => e && e.description === ${JSON.stringify(note)}); return row && { projectId: row.projectId, id: row.id }; })()`);
    assert.equal(queued && queued.projectId, idB);
    const otherLocal = await session.ev(`(AJ.get('entries')||[]).some(e => e && e.description === ${JSON.stringify(note)} && e.projectId === ${JSON.stringify(idA)})`);
    assert.equal(otherLocal, false);
    await session.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await session.ev(`flushRemote({ fromOutside: true })`);
    await waitFor(session, `!(AJ.get('outbox')||[]).includes(${JSON.stringify(queued.id)}) || ((AJ.get('syncErrors')||{})[${JSON.stringify(queued.id)}])`, 20000);
    assert.equal((await entriesWhere(idA, note)).length, 0);
    const onB = await entriesWhere(idB, note);
    assert.ok(onB.length <= 1);
    assert.equal(session.production, '');
  } finally { closePage(session); }
});

test('17 a queued line blocks the project delete', { timeout: 120000 }, async () => {
  const idA = 'p-block-a';
  const name = 'مشروع ممنوع';
  await seedProject(idA, name, ownerUid);
  await seedEntry('e-block-s', idA, ownerUid, { description: 'قيد على الخادم', amount: 7777 });
  const session = await openPage();
  try {
    await login(session, OWNER_EMAIL);
    assert.equal(await waitFor(session, `(AJ.get('projects')||[]).some(p => p && p.id === ${JSON.stringify(idA)})`, 20000), true);
    await session.ev(`(async () => {
      const queued = { id:'e-block-q', projectId:${JSON.stringify(idA)}, direction:'expense', entryType:'materials', amount:8888, currency:'IQD', entryDate:'2026-11-17', description:'قيد لم يُرسل', partyName:'', isReversal:false, createdAtDevice:12, createdBy:${JSON.stringify(ownerUid)}, deviceId:'phone' };
      const refused = { id:'e-block-r', projectId:${JSON.stringify(idA)}, direction:'expense', entryType:'materials', amount:9999, currency:'IQD', entryDate:'2026-11-17', description:'قيد رُفض', partyName:'', isReversal:false, createdAtDevice:13, createdBy:${JSON.stringify(ownerUid)}, deviceId:'phone' };
      await set(K.entries, (AJ.get('entries')||[]).concat([queued, refused]));
      await set(K.outbox, (AJ.get('outbox')||[]).concat(['e-block-q']));
      const errors = Object.assign({}, AJ.get('syncErrors')||{});
      errors['e-block-r'] = ${JSON.stringify(REFUSED)};
      await set(K.syncErrors, errors);
      return 1;
    })()`);
    await session.ev(`location.hash=${JSON.stringify('#project/' + idA)}; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    await session.ev(`document.querySelector('#manage-project').click(); document.querySelector('#choose-delete').click(); 1`);
    const text = await session.ev(`(document.querySelector('#main') && document.querySelector('#main').innerText) || ''`);
    await session.ev(`(() => {
      const yes = document.querySelector('#confirm-yes');
      if (yes && !yes.disabled) {
        yes.click();
        const input = document.querySelector('#delete-name');
        if (input) {
          input.value = ${JSON.stringify(name)};
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const del = document.querySelector('#confirm-delete');
        if (del && !del.disabled) del.click();
      }
      return 1;
    })()`);
    await sleep(1500);
    assert.equal(text.includes(LINES), true, text);
    assert.equal(await projectExists(idA), true);
    await session.send('Page.reload', { ignoreCache: true });
    assert.equal(await waitFor(session, `document.querySelector('#shell') && document.querySelector('#shell').hidden === false`, 25000), true, 'reload opens the signed-in app');
    const back = await session.ev(`(() => {
      const projects = AJ.get('projects') || [];
      const entries = AJ.get('entries') || [];
      return {
        project: projects.some(p => p && p.id === ${JSON.stringify(idA)}),
        q: entries.some(e => e && e.id === 'e-block-q'),
        r: entries.some(e => e && e.id === 'e-block-r'),
      };
    })()`);
    assert.equal(back.project, true);
    assert.equal(back.q, true);
    assert.equal(back.r, true);
    assert.equal(await projectExists(idA), true);
    assert.equal(session.production, '');
  } finally { closePage(session); }
});
