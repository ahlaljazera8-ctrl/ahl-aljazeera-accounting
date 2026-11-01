// Hosting must send the security headers, and the app must still boot, log in,
// sync one entry, and register the service worker with an empty CSP violation log.
// Emulators only. Never points at the live project.
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { initializeApp, deleteApp } = require('firebase/app');
const {
  getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword,
} = require('firebase/auth');
const { doc, setDoc, getDocs, collection } = require('firebase/firestore');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { openChrome, waitForPage } = require('../chrome-debug.js');

const PROJECT = 'ahl-aljazeera-accounting';
const EMAIL = 'csp.headers@example.invalid';
const PASS = 'emulator-only-pass';
const PROJECT_ID = 'p-csp';
const PROJECT_NAME = 'مشروع الترويسات';
const DESC = 'فحص الترويسات';
const LIVE = /https:\/\/(?:firestore|identitytoolkit|securetoken)\.googleapis\.com/;
const CSP_VIOLATION = /content security policy|refused to .* because it violates/i;

// Production allowlist: gstatic modules, Auth/Firestore under *.googleapis.com,
// and the Auth iframe (gapi + the project's authDomain). style-src allows
// 'unsafe-inline' because the ledger renders style attributes.
// Loopback emulator origins are not part of this policy. The emulator job
// serves a copy that adds them; see scripts/emulator-csp-config.js.
const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self' https://www.gstatic.com https://apis.google.com",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://www.gstatic.com",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "frame-src https://ahl-aljazeera-accounting.firebaseapp.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');
const EMULATOR_CSP = [
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

const SECURITY_HEADERS = {
  'content-security-policy': EMULATOR_CSP,
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'x-frame-options': 'DENY',
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

function localHost(name) {
  const raw = process.env[name];
  if (!raw || !/^(127\.0\.0\.1|localhost):\d+$/.test(raw)) {
    throw new Error(name + ' must be a local emulator (refusing production). Got: ' + raw);
  }
  const [host, port] = raw.split(':');
  return { host, port: Number(port) };
}

function browserHost(host) {
  if (host === '0.0.0.0' || host === '::' || host === '::1') return '127.0.0.1';
  return host;
}

async function hostingOrigin() {
  const hub = localHost('FIREBASE_EMULATOR_HUB');
  const res = await fetch('http://' + hub.host + ':' + hub.port + '/emulators');
  if (!res.ok) throw new Error('emulator hub did not list emulators: ' + res.status);
  const body = await res.json();
  const hosting = body && body.hosting;
  if (!hosting || !hosting.port) throw new Error('hosting emulator is not running');
  const host = browserHost(hosting.host || '127.0.0.1');
  if (host !== '127.0.0.1' && host !== 'localhost') throw new Error('hosting emulator is not local: ' + host);
  return 'http://' + host + ':' + hosting.port;
}

function headerMap(response) {
  const out = {};
  response.headers.forEach((value, key) => { out[key.toLowerCase()] = value; });
  return out;
}

function killChrome(chrome) {
  if (!chrome || !chrome.pid) return;
  try { process.kill(-chrome.pid, 'SIGKILL'); } catch (e) { try { chrome.kill('SIGKILL'); } catch (e2) {} }
}

async function connect(port, chrome) {
  const tgt = await waitForPage(port, chrome);
  const ws = new WebSocket(tgt.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('debugger socket failed'));
  });
  let id = 0;
  const pend = {};
  const logs = [];
  const violations = [];
  const production = [];
  const noteViolation = text => {
    const line = String(text || '').slice(0, 500);
    if (!line || !CSP_VIOLATION.test(line)) return;
    violations.push(line);
  };
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; return; }
    if (d.method === 'Runtime.consoleAPICalled') {
      const line = (d.params.args || []).map(a => a.value || a.description || a.type || '').join(' ');
      logs.push(line.slice(0, 400));
      noteViolation(line);
    } else if (d.method === 'Runtime.exceptionThrown') {
      const line = String(d.params.exceptionDetails && (d.params.exceptionDetails.text || d.params.exceptionDetails.exception && d.params.exceptionDetails.exception.description) || 'exception');
      logs.push(line.slice(0, 400));
      noteViolation(line);
    } else if (d.method === 'Log.entryAdded') {
      const entry = d.params.entry || {};
      const line = String(entry.text || '');
      logs.push(line.slice(0, 400));
      if (entry.source === 'security') violations.push(line.slice(0, 500));
      else noteViolation(line);
    } else if (d.method === 'Network.requestWillBeSent') {
      const url = d.params.request && d.params.request.url || '';
      if (LIVE.test(url)) production.push(url);
    }
  };
  const send = (method, params = {}) => new Promise(resolve => {
    pend[++id] = resolve;
    ws.send(JSON.stringify({ id, method, params }));
  });
  const ev = async expression => {
    const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    const details = res.result && res.result.exceptionDetails;
    if (details) throw new Error(details.text || (details.exception && details.exception.description) || 'eval failed');
    return res.result.result.value;
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Network.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations.push([e.effectiveDirective, e.blockedURI, e.sample, e.disposition].filter(Boolean).join(' '));
    });
  ` });
  return {
    send, ev, logs, violations, production,
    close: () => { try { ws.close(); } catch (e) {} },
  };
}

async function waitFor(session, expr, ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try { if (await session.ev(expr)) return true; } catch (e) {}
    await sleep(200);
  }
  return false;
}

test('security headers still let the app boot, log in, sync an entry, and register the service worker', { timeout: 120000 }, async () => {
  const authHost = localHost('FIREBASE_AUTH_EMULATOR_HOST');
  const fsHost = localHost('FIRESTORE_EMULATOR_HOST');
  const origin = await hostingOrigin();
  const deployed = JSON.parse(fs.readFileSync(path.join(__dirname, '../../firebase.json'), 'utf8'));
  const deployedCsp = deployed.hosting.headers.find(h => h.source === '**').headers.find(h => h.key === 'Content-Security-Policy').value;
  assert.equal(deployedCsp, PRODUCTION_CSP);
  assert.equal(/127\.0\.0\.1/.test(deployedCsp), false);
  const pageRes = await fetch(origin + '/index.html');
  const swRes = await fetch(origin + '/sw.js');
  const cssRes = await fetch(origin + '/style.css');
  assert.equal(pageRes.status, 200);
  assert.equal(swRes.status, 200);
  assert.equal(cssRes.status, 200);
  const pageHeaders = headerMap(pageRes);
  const swHeaders = headerMap(swRes);
  const cssHeaders = headerMap(cssRes);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    assert.equal(pageHeaders[key], value, origin + '/index.html missing ' + key);
    assert.equal(swHeaders[key], value, origin + '/sw.js missing ' + key);
    assert.equal(cssHeaders[key], value, origin + '/style.css missing ' + key);
  }
  assert.equal(swHeaders['cache-control'], 'no-cache, max-age=0');

  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8'),
      host: fsHost.host,
      port: fsHost.port,
    },
  });
  const app = initializeApp({ apiKey: 'demo', projectId: PROJECT, authDomain: 'localhost' }, 'csp-seed');
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://' + authHost.host + ':' + authHost.port, { disableWarnings: true });
  let cred;
  try { cred = await createUserWithEmailAndPassword(auth, EMAIL, PASS); }
  catch (err) {
    if (err && err.code === 'auth/email-already-in-use') cred = await signInWithEmailAndPassword(auth, EMAIL, PASS);
    else throw err;
  }
  const uid = cred.user.uid;
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', uid), {
      displayName: 'مالك الترويسات', email: EMAIL, role: 'owner', active: true,
      assignedProjectIds: [], createdAtServer: new Date(), createdBy: uid,
    });
    await setDoc(doc(db, 'projects', PROJECT_ID), {
      id: PROJECT_ID, name: PROJECT_NAME, clientName: 'فحص', location: 'اختبار', currency: 'IQD',
      status: 'active', createdAtDevice: 1, createdAtServer: new Date(), createdBy: uid, deviceId: 'csp-test',
    });
  });
  await deleteApp(app);

  const dir = '/tmp/aj-csp-' + process.pid;
  const launched = await openChrome({ userDataDir: dir, detached: true });
  const chrome = launched.chrome;
  let session;
  try {
    session = await connect(launched.port, chrome);
    // iPhone Safari proactively opens the Firebase Auth iframe. Desktop Chrome does not.
    await session.send('Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    });
    await session.send('Page.navigate', { url: origin + '/index.html?emulator=1' });
    const ready = await waitFor(session, `document.body && document.body.dataset.ready === '1' && document.querySelector('#login') && document.querySelector('#login').hidden === false && document.querySelector('#shell').hidden === true`, 20000);
    assert.equal(ready, true, 'login screen did not boot. ' + session.logs.slice(-8).join(' | '));

    await session.ev(`document.querySelector('#login-email').value=${JSON.stringify(EMAIL)}; document.querySelector('#login-password').value=${JSON.stringify(PASS)}; document.querySelector('#login-btn').click(); 1`);
    const opened = await waitFor(session, `document.querySelector('#shell') && document.querySelector('#shell').hidden === false`, 30000);
    const loginMsg = opened ? '' : await session.ev(`(document.querySelector('#login-msg') || {}).textContent || ''`).catch(() => '');
    assert.equal(opened, true, 'login did not open the ledger. ' + loginMsg + ' ' + session.logs.slice(-8).join(' | '));

    const sawProject = await waitFor(session, `(AJ.get('projects') || []).some(p => p && p.id === ${JSON.stringify(PROJECT_ID)})`, 20000);
    assert.equal(sawProject, true, 'the project did not arrive from the emulator. ' + session.logs.slice(-8).join(' | '));
    await session.ev(`location.hash = '#entry'; dispatchEvent(new HashChangeEvent('hashchange')); 1`);
    const form = await waitFor(session, `document.querySelector(${JSON.stringify('[data-proj="' + PROJECT_ID + '"]')})`, 10000);
    assert.equal(form, true, 'entry form did not list the project');
    await session.ev(`document.querySelector(${JSON.stringify('[data-proj="' + PROJECT_ID + '"]')}).click(); document.querySelector('[data-add="1000"]').click(); document.querySelector('#desc').value = ${JSON.stringify(DESC)}; document.querySelector('#save').click(); 1`);
    const entrySaved = `(AJ.get('entries') || []).some(e => e && e.description === ${JSON.stringify(DESC)})`;
    const outboxEmpty = `(()=>{const btn=document.querySelector('#outbox');const badge=btn&&btn.querySelector('.bell-badge');const panel=document.querySelector('#bell-panel');const label=(btn&&btn.getAttribute('aria-label'))||'';const text=panel?panel.innerText:'';return btn&&btn.tagName==='BUTTON'&&badge&&badge.hidden===true&&label.includes('لم يُرسل بعد: 0')&&text.includes('إرسال الآن')&&text.includes('آخر مزامنة')})()`;
    const synced = await waitFor(session, entrySaved + ' && ' + outboxEmpty, 20000);
    if (!synced) await session.ev(`(()=>{const b=document.querySelector('#outbox');if(b.getAttribute('aria-expanded')!=='true')b.click();document.querySelector('#bell-send').click();return 1})()`);
    const drained = synced || await waitFor(session, entrySaved + ' && ' + outboxEmpty, 20000);
    assert.equal(drained, true, 'the entry stayed in the outbox. ' + session.logs.slice(-8).join(' | '));

    let stored = null;
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline && !stored) {
      await testEnv.withSecurityRulesDisabled(async ctx => {
        const snap = await getDocs(collection(ctx.firestore(), 'ledgerEntries'));
        stored = snap.docs.map(d => d.data()).find(row => row && row.description === DESC) || null;
      });
      if (!stored) await sleep(300);
    }
    assert.ok(stored, 'the entry was not written to the emulator');
    assert.equal(stored.amount, 1000);
    assert.equal(stored.projectId, PROJECT_ID);
    assert.equal(stored.createdBy, uid);

    const registered = await waitFor(session, `navigator.serviceWorker.getRegistration().then(r => !!(r && r.active && String(r.active.scriptURL).endsWith('/sw.js')))`, 15000);
    assert.equal(registered, true, 'service worker did not register');

    const pageViolations = await session.ev(`window.__cspViolations.slice()`);
    const violations = [...pageViolations, ...session.violations];
    console.log('csp violations: ' + JSON.stringify(violations));
    assert.deepEqual(violations, [], 'CSP violations: ' + violations.join(' || '));
    assert.deepEqual(session.production, [], 'refusing live Firebase traffic: ' + session.production.join(' '));

    await session.ev(`new Promise(resolve => {
      const s = document.createElement('script');
      s.src = 'https://example.com/csp-probe.js';
      s.onload = () => resolve(1);
      s.onerror = () => resolve(1);
      document.head.appendChild(s);
    })`);
    const blocked = await waitFor(session, `window.__cspViolations.some(v => String(v).includes('example.com'))`, 5000);
    assert.equal(blocked, true, 'a foreign script was not blocked by CSP');
  } finally {
    if (session) session.close();
    killChrome(chrome);
    fs.rmSync(dir, { recursive: true, force: true });
    await testEnv.cleanup();
  }
});
