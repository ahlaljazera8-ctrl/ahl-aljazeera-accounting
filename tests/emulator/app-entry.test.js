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

async function serverDoc(collectionName, id) {
  let data = null;
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const snap = await getDoc(doc(ctx.firestore(), collectionName, id));
    data = snap.exists() ? snap.data() : null;
  });
  return data;
}

async function withSession(label, fn) {
  const dir = '/tmp/aj-app-' + label + '-' + process.pid + '-' + Date.now();
  const debug = await freePort();
  const chrome = launchChrome(dir, debug);
  let session;
  try {
    session = await connect(debug);
    await session.send('Page.navigate', { url: origin + '/index.html?emulator=1' });
    assert.equal(await waitFor(session, `document.body && document.body.dataset.ready === '1'`, 20000), true, 'login page ready');
    await session.ev(`(()=>{
      const orig = Sync.pullChanges.bind(Sync);
      window.__hold = Promise.resolve();
      window.__pulls = 0;
      Sync.pullChanges = function(opts) {
        window.__pulls++;
        return Promise.resolve(window.__hold).then(function() { return orig(opts); });
      };
      return 1;
    })()`);
    await session.ev(`document.querySelector('#login-email').value=${JSON.stringify(EMAIL)}; document.querySelector('#login-password').value=${JSON.stringify(PASS)}; document.querySelector('#login-btn').click(); 1`);
    assert.equal(await waitFor(session, `document.querySelector('#shell') && document.querySelector('#shell').hidden === false`, 25000), true, 'login opens the app. ' + session.logs.slice(-6).join(' | '));
    assert.equal(await waitFor(session, `(AJ.get('projects')||[]).some(p => p && p.id === ${JSON.stringify(PROJECT_ID)})`, 20000), true, 'project arrived');
    await sleep(1000);
    await fn(session);
    assert.equal(session.production, '');
  } finally {
    if (session) session.close();
    killChrome(chrome);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function armPullHold(session) {
  return session.ev(`(()=>{
    let release;
    const seen = window.__pulls || 0;
    window.__hold = new Promise(r => { release = r; });
    window.__releasePull = () => release();
    return seen;
  })()`);
}

test('a save during an in-flight pull stays on screen and sends without a reload', { timeout: 120000 }, async () => {
  await withSession('pull', async session => {
    const note = 'TEST pull race ' + Date.now();
    const seen = await armPullHold(session);
    await session.ev(`document.querySelector('#send').click(); 1`);
    assert.equal(await waitFor(session, `window.__pulls > ${seen}`, 15000), true, 'the pull is in flight');
    await session.ev(`(()=>{
      location.hash = '#entry';
      dispatchEvent(new HashChangeEvent('hashchange'));
      document.querySelector(${JSON.stringify('[data-proj="' + PROJECT_ID + '"]')}).click();
      document.querySelector('#amt').value = '1000';
      document.querySelector('#desc').value = ${JSON.stringify(note)};
      document.querySelector('#party').value = 'جهة السحب';
      document.querySelector('#save').click();
      return 1;
    })()`);
    const id = await session.ev(`(()=>{const e=(AJ.get('entries')||[]).find(x=>x.description===${JSON.stringify(note)}); return e && e.id})()`);
    assert.ok(id, 'the save is in memory while the pull is held');
    await session.ev(`window.__releasePull(); 1`);
    const sent = await waitFor(session, `!(AJ.get('outbox')||[]).includes(${JSON.stringify(id)}) && (AJ.get('entries')||[]).some(e => e && e.id===${JSON.stringify(id)} && e.description===${JSON.stringify(note)} && e.partyName==='جهة السحب')`, 20000);
    assert.equal(sent, true, 'the entry stayed in memory and left the outbox without a reload. ' + session.logs.slice(-8).join(' | '));
    const stored = await serverDoc('ledgerEntries', id);
    assert.ok(stored, 'the entry reached the server without a reload');
    assert.equal(stored.amount, 1000);
    assert.equal(stored.description, note);
    assert.equal(stored.partyName, 'جهة السحب');
  });
});

test('the note and party survive going offline and the render when sync finishes', { timeout: 120000 }, async () => {
  await withSession('form', async session => {
    await session.ev(`location.hash='#entry'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    assert.equal(await waitFor(session, `document.querySelector('#desc') && document.querySelector('#party')`, 8000), true, 'entry form is open');
    const afterOffline = await session.ev(`(()=>{
      document.querySelector(${JSON.stringify('[data-proj="' + PROJECT_ID + '"]')}).click();
      document.querySelector('#desc').value = 'ملاحظة باقية';
      document.querySelector('#party').value = 'جهة باقية';
      document.querySelector('#amt').value = '٧';
      dispatchEvent(new Event('offline'));
      return {
        desc: document.querySelector('#desc').value,
        party: document.querySelector('#party').value,
        amt: document.querySelector('#amt').value,
      };
    })()`);
    assert.deepEqual(afterOffline, { desc: 'ملاحظة باقية', party: 'جهة باقية', amt: '٧' });
    await session.ev(`document.querySelector('#desc').__old = 1; dispatchEvent(new Event('online')); 1`);
    const survived = await waitFor(session, `(()=>{
      const d = document.querySelector('#desc');
      const p = document.querySelector('#party');
      const a = document.querySelector('#amt');
      return !!(d && !d.__old && d.value === 'ملاحظة باقية' && p && p.value === 'جهة باقية' && a && a.value === '٧');
    })()`, 20000);
    assert.equal(survived, true, 'sync finishing must not clear the form');
  });
});

test('a contract saved during the project flush is sent without another action', { timeout: 120000 }, async () => {
  await withSession('contract', async session => {
    const seen = await armPullHold(session);
    await session.ev(`location.hash='#projects'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    assert.equal(await waitFor(session, `document.querySelector('#newproj')`, 8000), true, 'project list is open');
    await session.ev(`window.prompt = () => 'مشروع العقد'; document.querySelector('#newproj').click(); 1`);
    assert.equal(await waitFor(session, `window.__pulls > ${seen}`, 15000), true, 'the project flush is in flight');
    const id = await session.ev(`(()=>{const rows=AJ.get('projects')||[]; const p=rows[rows.length-1]; return p && p.id !== ${JSON.stringify(PROJECT_ID)} ? p.id : ''})()`);
    assert.ok(id, 'the new project is on this phone');
    await session.ev(`location.hash=${JSON.stringify('#project/' + id)}; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    assert.equal(await waitFor(session, `document.querySelector('#contract')`, 8000), true, 'contract field is open');
    await session.ev(`document.querySelector('#contract').value='4500'; document.querySelector('#save-contract').click(); 1`);
    const queued = await session.ev(`(AJ.get('projectFinance')||{})[${JSON.stringify(id)}]`);
    assert.equal(queued && queued.pending, true);
    assert.equal(queued.contractAmount, 4500);
    await session.ev(`window.__releasePull(); 1`);
    const start = Date.now();
    let finance = null;
    while (Date.now() - start < 8000 && !(finance && finance.contractAmount === 4500)) {
      finance = await serverDoc('projectFinance', id);
      if (!(finance && finance.contractAmount === 4500)) await sleep(200);
    }
    assert.equal(finance && finance.contractAmount, 4500, 'the contract should send on its own');
    const project = await serverDoc('projects', id);
    assert.ok(project, 'the project document was written');
    assert.equal(Object.prototype.hasOwnProperty.call(project, 'contractAmount'), false);
  });
});

test('a lost reversal race leaves the pending count and shows the server reason', { timeout: 120000 }, async () => {
  await withSession('rev', async session => {
    const note = 'TEST reversal race ' + Date.now();
    await session.ev(`location.hash='#entry'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    await session.ev(`document.querySelector(${JSON.stringify('[data-proj="' + PROJECT_ID + '"]')}).click(); document.querySelector('#amt').value='1000'; document.querySelector('#desc').value=${JSON.stringify(note)}; document.querySelector('#save').click(); 1`);
    const id = await session.ev(`(()=>{const e=(AJ.get('entries')||[]).find(x=>x.description===${JSON.stringify(note)}); return e && e.id})()`);
    assert.ok(id, 'the original entry was saved');
    assert.equal(await waitFor(session, `!(AJ.get('outbox')||[]).includes(${JSON.stringify(id)})`, 20000), true, 'the original entry synced');
    await sleep(1500);
    const revId = 'rev_' + id;
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await setDoc(doc(ctx.firestore(), 'ledgerEntries', revId), {
        id: revId, projectId: PROJECT_ID, direction: 'expense', entryType: 'materials', amount: 1000,
        currency: 'IQD', entryDate: '2026-10-30', description: 'تصحيح: من الخادم', partyName: '',
        isReversal: true, reversesEntryId: id, reversalReason: 'سبب الخادم',
        createdAtDevice: 1, createdAtServer: new Date(), createdBy: 'winner-other', createdByName: 'الفائز', deviceId: 'other',
      });
    });
    await session.ev(`location.hash=${JSON.stringify('#project/' + PROJECT_ID)}; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    assert.equal(await waitFor(session, `document.querySelector(${JSON.stringify('[data-rev="' + id + '"]')})`, 8000), true, 'the reverse button is still available');
    await session.ev(`window.prompt=()=>'سبب الجهاز'; document.querySelector(${JSON.stringify('[data-rev="' + id + '"]')}).click(); 1`);
    const cleared = await waitFor(session, `!(AJ.get('outbox')||[]).includes(${JSON.stringify(revId)})`, 20000);
    assert.equal(cleared, true, 'the losing reversal leaves the pending count. ' + session.logs.slice(-8).join(' | '));
    await session.ev(`location.hash=${JSON.stringify('#detail/' + revId)}; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    const text = await session.ev(`document.querySelector('#main').innerText`);
    assert.match(text, /سبب الخادم/);
    assert.equal(text.includes('سبب الجهاز'), false, text);
    const stored = await serverDoc('ledgerEntries', revId);
    assert.equal(stored && stored.reversalReason, 'سبب الخادم');
  });
});

test('an entry the server refuses is shown as failed and is left out of the total', { timeout: 120000 }, async () => {
  await withSession('refuse', async session => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await setDoc(doc(ctx.firestore(), 'users', uid), { displayName: 'اسم بعد الرفض' }, { merge: true });
    });
    await session.ev(`location.hash='#projects'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    assert.equal(await waitFor(session, `document.querySelector('#newproj')`, 8000), true);
    await session.ev(`window.prompt = () => 'مشروع الرفض'; document.querySelector('#newproj').click(); 1`);
    const id = await session.ev(`(()=>{const rows=AJ.get('projects')||[]; const p=rows[rows.length-1]; return p && p.name === 'مشروع الرفض' ? p.id : ''})()`);
    assert.ok(id, 'a fresh project was created');
    assert.equal(await waitFor(session, `!(AJ.get('outbox')||[]).includes(${JSON.stringify(id)})`, 20000), true, 'the project itself synced');
    const note = 'TEST refused ' + Date.now();
    await session.ev(`location.hash='#entry'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    await session.ev(`document.querySelector(${JSON.stringify('[data-proj="' + id + '"]')}).click(); document.querySelector('#amt').value='1000'; document.querySelector('#desc').value=${JSON.stringify(note)}; document.querySelector('#save').click(); 1`);
    const entryId = await session.ev(`(()=>{const e=(AJ.get('entries')||[]).find(x=>x.description===${JSON.stringify(note)}); return e && e.id})()`);
    assert.ok(entryId, 'the entry was stored on the phone');
    await session.ev(`location.hash=${JSON.stringify('#project/' + id)}; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    const refused = await waitFor(session, `!(AJ.get('outbox')||[]).includes(${JSON.stringify(entryId)}) && document.querySelector('#main') && document.querySelector('#main').innerText.includes('رُفض الإرسال')`, 20000);
    assert.equal(refused, true, 'the refusal is visible and the entry is not pending. ' + session.logs.slice(-8).join(' | '));
    const profit = await session.ev(`(()=>{const row=[...document.querySelectorAll('.kv')].find(el => el.innerText.includes('الربح')); return row ? row.innerText : ''})()`);
    assert.match(profit, /0/);
    assert.equal(profit.includes('1,000'), false, profit);
    assert.equal(await serverDoc('ledgerEntries', entryId), null);
  });
});
