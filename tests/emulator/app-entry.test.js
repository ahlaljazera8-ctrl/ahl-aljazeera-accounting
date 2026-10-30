// The real app writes a ledger entry. Current rules accept createdByName + partyName
// when the name matches users/{uid}.displayName, and reject a name that does not.
// Emulators only. Never call production.
const fs = require('fs');
const path = require('path');
const http = require('http');
const net = require('net');
const { spawn } = require('child_process');
const test = require('node:test');
const assert = require('node:assert/strict');
const { initializeApp, deleteApp } = require('firebase/app');
const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { doc, setDoc, getDoc } = require('firebase/firestore');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

const PROJECT = 'ahl-aljazeera-accounting';
const EMAIL = 'app.entry@example.invalid';
const PASS = 'emulator-only-pass';
const DISPLAY = 'أمير السجل';
const RENAMED = 'اسم آخر';
const PROJECT_ID = 'p-app-pay';
const PROJECT_NAME = 'مشروع الدفع';
const DESC = 'قيد من التطبيق';
const PARTY_TYPED = '  مورد الحديد  ';
const PARTY = 'مورد الحديد';
const BAD_DESC = 'يجب أن يُرفض';
const REASON = 'سعر خاطئ';
const LIVE = /firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com/;
const sleep = ms => new Promise(r => setTimeout(r, ms));

let testEnv;
let uid;
let server;
let origin;

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

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
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
    try { tgt = (await (await fetch('http://127.0.0.1:' + port + '/json')).json()).find(t => t.type === 'page'); }
    catch (e) {}
    await sleep(200);
  }
  if (!tgt) throw new Error('Chrome did not open a page');
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
      const details = d.params.exceptionDetails;
      session.logs.push(String((details && (details.text || (details.exception && details.exception.description))) || 'exception').slice(0, 300));
    } else if (d.method === 'Page.javascriptDialogOpening') {
      send('Page.handleJavaScriptDialog', { accept: true, promptText: REASON });
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
    if (details) throw new Error(details.text || (details.exception && details.exception.description) || 'eval failed');
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

async function serverEntry(id) {
  let data = null;
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const snap = await getDoc(doc(ctx.firestore(), 'ledgerEntries', id));
    data = snap.exists() ? snap.data() : null;
  });
  return data;
}

test.before(async () => {
  const fsHost = localHost('FIRESTORE_EMULATOR_HOST');
  const authHost = localHost('FIREBASE_AUTH_EMULATOR_HOST');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8'), host: fsHost.host, port: fsHost.port },
  });
  const app = initializeApp({ apiKey: 'demo', projectId: PROJECT, authDomain: 'localhost' }, 'app-entry-seed');
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
    const now = new Date();
    await setDoc(doc(d, 'users', uid), {
      displayName: DISPLAY, email: EMAIL, role: 'owner', active: true,
      assignedProjectIds: [], createdAtServer: now, createdBy: uid,
    });
    await setDoc(doc(d, 'projects', PROJECT_ID), {
      id: PROJECT_ID, name: PROJECT_NAME, clientName: 'زبون', location: 'السماوة', currency: 'IQD',
      status: 'active', createdAtDevice: 1, createdAtServer: now, createdBy: uid, deviceId: 'admin',
    });
  });
  await deleteApp(app);
  server = await startServer();
  origin = 'http://127.0.0.1:' + server.address().port;
});

test.after(async () => {
  if (server) server.close();
  if (testEnv) await testEnv.cleanup();
});

test('the app entry with createdByName and partyName is accepted, and a wrong name is rejected', { timeout: 120000 }, async () => {
  const dir = '/tmp/aj-app-entry-' + process.pid;
  const debug = await freePort();
  const chrome = launchChrome(dir, debug);
  let session;
  try {
    session = await connect(debug);
    await session.send('Page.navigate', { url: origin + '/index.html?emulator=1' });
    assert.equal(await waitFor(session, `document.body && document.body.dataset.ready === '1'`, 20000), true, 'login page ready');
    assert.equal(session.production, '', 'refusing live Firebase traffic');
    await session.ev(`document.querySelector('#login-email').value=${JSON.stringify(EMAIL)}; document.querySelector('#login-password').value=${JSON.stringify(PASS)}; document.querySelector('#login-btn').click(); 1`);
    assert.equal(await waitFor(session, `document.querySelector('#shell') && document.querySelector('#shell').hidden === false`, 25000), true, 'login opens the app. ' + session.logs.slice(-6).join(' | '));
    assert.equal(await waitFor(session, `document.querySelector('#who').textContent.includes(${JSON.stringify(DISPLAY)})`, 10000), true, 'profile name is the signed-in user');
    await session.ev(`location.hash='#entry'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    const pill = '[data-proj="' + PROJECT_ID + '"]';
    assert.equal(await waitFor(session, `document.querySelector(${JSON.stringify(pill)})`, 20000), true, 'the project should arrive from the emulator');
    await session.ev(`document.querySelector(${JSON.stringify(pill)}).click(); 1`);
    await session.ev(`document.querySelector('[data-add="1000"]').click(); 1`);
    await session.ev(`document.querySelector('#party').value=${JSON.stringify(PARTY_TYPED)}; document.querySelector('#desc').value=${JSON.stringify(DESC)}; document.querySelector('#save').click(); 1`);
    const saved = await session.ev(`(()=>{const e=(AJ.get('entries')||[]).find(x=>x.description===${JSON.stringify(DESC)}); return e&&{id:e.id, party:e.partyName, name:e.createdByName}})()`);
    assert.ok(saved && saved.id, 'the app stored the entry locally');
    assert.equal(saved.party, PARTY);
    assert.equal(saved.name, DISPLAY);

    const synced = await waitFor(session, `!(AJ.get('outbox')||[]).includes(${JSON.stringify(saved.id)})`, 20000);
    assert.equal(synced, true, 'the outbox should drop the accepted entry. ' + session.logs.slice(-6).join(' | '));
    const stored = await serverEntry(saved.id);
    assert.ok(stored, 'rules accepted the app entry');
    assert.equal(stored.partyName, PARTY);
    assert.equal(stored.createdByName, DISPLAY);
    assert.equal(stored.createdBy, uid);
    assert.equal(stored.amount, 1000);
    assert.equal(stored.description, DESC);

    await session.ev(`location.hash=${JSON.stringify('#project/' + PROJECT_ID)}; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    assert.equal(await waitFor(session, `document.querySelector(${JSON.stringify('[data-rev="' + saved.id + '"]')})`, 8000), true, 'the saved row can be reversed');
    await session.ev(`window.prompt=()=>${JSON.stringify(REASON)}; document.querySelector(${JSON.stringify('[data-rev="' + saved.id + '"]')}).click(); 1`);
    const revId = 'rev_' + saved.id;
    const revSynced = await waitFor(session, `!(AJ.get('outbox')||[]).includes(${JSON.stringify(revId)})`, 20000);
    assert.equal(revSynced, true, 'the reversal should leave the outbox');
    const rev = await serverEntry(revId);
    assert.ok(rev, 'rules accepted the reversal written by the app');
    assert.equal(rev.createdByName, DISPLAY);
    assert.equal(rev.partyName, PARTY);
    assert.equal(rev.reversalReason, REASON);
    assert.equal(rev.isReversal, true);
    assert.equal(rev.reversesEntryId, saved.id);
    assert.equal(rev.createdBy, uid);

    await testEnv.withSecurityRulesDisabled(async ctx => {
      await setDoc(doc(ctx.firestore(), 'users', uid), { displayName: RENAMED }, { merge: true });
    });
    await session.ev(`location.hash='#entry'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    await session.ev(`document.querySelector('[data-add="1000"]').click(); 1`);
    await session.ev(`document.querySelector('#party').value=${JSON.stringify(PARTY)}; document.querySelector('#desc').value=${JSON.stringify(BAD_DESC)}; document.querySelector('#save').click(); 1`);
    const bad = await session.ev(`(()=>{const e=(AJ.get('entries')||[]).find(x=>x.description===${JSON.stringify(BAD_DESC)}); return e&&{id:e.id, name:e.createdByName}})()`);
    assert.ok(bad && bad.id, 'the mismatched entry is still saved on the phone');
    assert.equal(bad.name, DISPLAY, 'the app keeps writing the name it loaded, which no longer matches the profile');
    await session.ev(`location.hash=${JSON.stringify('#project/' + PROJECT_ID)}; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    const rejected = await waitFor(session, `document.querySelector('#main').innerText.includes('رُفض الإرسال')`, 20000);
    assert.equal(rejected, true, 'the row shows the rules rejection. ' + session.logs.slice(-8).join(' | '));
    assert.equal(await serverEntry(bad.id), null, 'rules rejected the wrong createdByName');
    await sleep(1200);
    assert.equal(await serverEntry(bad.id), null, 'the rejected entry must not arrive later');
    assert.equal(session.production, '');
  } finally {
    if (session) session.close();
    killChrome(chrome);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
