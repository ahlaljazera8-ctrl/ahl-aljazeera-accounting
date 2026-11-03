// After logout the login fields are empty, and signing in again still opens the ledger.
// Emulators only. Never calls production.
const fs = require('fs');
const http = require('http');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const { initializeApp, deleteApp } = require('firebase/app');
const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { doc, setDoc } = require('firebase/firestore');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

const ROOT = path.join(__dirname, '../../public');
const PROJECT = 'ahl-aljazeera-accounting';
const EMAIL = 'fields.logout@example.invalid';
const PASS = 'emulator-only-pass';
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
function isLive(raw) {
  try {
    const host = new URL(raw).hostname;
    return host === 'firestore.googleapis.com' || host === 'identitytoolkit.googleapis.com' || host === 'securetoken.googleapis.com';
  } catch (e) { return false; }
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
      res.writeHead(404);
      res.end('missing');
      return;
    }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
    res.writeHead(200, {
      'content-type': types[path.extname(file)] || 'application/octet-stream',
      'cache-control': rel === '/sw.js' ? 'no-cache, max-age=0' : 'no-cache',
      'content-security-policy': CSP,
    });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => srv.listen(0, '127.0.0.1', () => resolve(srv)));
}

let testEnv;
let server;
let origin;
let browsers;

test.before(async () => {
  const fsHost = localHost('FIRESTORE_EMULATOR_HOST');
  const authHost = localHost('FIREBASE_AUTH_EMULATOR_HOST');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8'), host: fsHost.host, port: fsHost.port },
  });
  const app = initializeApp({ apiKey: 'demo', projectId: PROJECT, authDomain: 'localhost' }, 'logout-fields');
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
    await setDoc(doc(ctx.firestore(), 'users', uid), {
      displayName: 'مالك', email: EMAIL, role: 'owner', active: true,
      assignedProjectIds: [], createdAtServer: new Date(), createdBy: uid,
    });
  });
  await deleteApp(app);
  server = await startServer();
  origin = 'http://127.0.0.1:' + server.address().port;
  browsers = {
    chromium: await chromium.launch({ headless: true }),
    webkit: await webkit.launch({ headless: true }),
  };
});

test.after(async () => {
  if (browsers) await Promise.all(Object.values(browsers).map(b => b.close().catch(() => {})));
  if (server) server.close();
  if (testEnv) await testEnv.cleanup();
});

function url() { return origin + '/index.html?emulator=1'; }

async function signIn(page) {
  await page.goto(url(), { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#login-email', { state: 'visible', timeout: 30000 });
  await page.fill('#login-email', EMAIL);
  await page.fill('#login-password', PASS);
  await page.click('#login-btn');
  await page.waitForFunction(() => {
    const shell = document.querySelector('#shell');
    return shell && shell.hidden === false;
  }, null, { timeout: 30000 });
}

test('login fields are empty after logout and a second login still opens the ledger', { timeout: 120000 }, async () => {
  for (const name of ['chromium', 'webkit']) {
    const context = await browsers[name].newContext({ viewport: { width: 390, height: 844 }, locale: 'ar' });
    context.on('dialog', dialog => dialog.accept());
    let production = '';
    try {
      const page = await context.newPage();
      page.on('request', req => { if (isLive(req.url())) production = req.url(); });
      await signIn(page);
      const held = await page.evaluate(() => {
        const email = /** @type {HTMLInputElement | null} */ (document.querySelector('#login-email'));
        const pass = /** @type {HTMLInputElement | null} */ (document.querySelector('#login-password'));
        const login = document.querySelector('#login');
        return {
          loginHidden: !!(login && login.hidden),
          email: email ? email.value : null,
          pass: pass ? pass.value : null,
          emailDefault: email ? email.defaultValue : null,
          passDefault: pass ? pass.defaultValue : null,
          emailAutofill: !!(email && email.matches(':-webkit-autofill')),
          passAutofill: !!(pass && pass.matches(':-webkit-autofill')),
        };
      });
      await page.click('#logout');
      await page.waitForSelector('#login-email', { state: 'visible', timeout: 20000 });
      await page.waitForTimeout(500);
      const email = await page.locator('#login-email').inputValue();
      const pass = await page.locator('#login-password').inputValue();
      const why = name + ' fields after logout were ' + JSON.stringify({ email, pass }) + '. While the form was hidden: ' + JSON.stringify(held);
      assert.equal(email, '', why);
      assert.equal(pass, '', why);
      assert.match(await page.locator('#login h1').innerText(), /تسجيل الدخول/);
      assert.equal((await page.locator('#login-btn').innerText()).trim(), 'دخول');
      await page.fill('#login-email', EMAIL);
      await page.fill('#login-password', PASS);
      await page.click('#login-btn');
      await page.waitForFunction(() => {
        const shell = document.querySelector('#shell');
        return shell && shell.hidden === false;
      }, null, { timeout: 30000 });
      assert.equal(await page.locator('#login').isHidden(), true, name + ' second login stayed on the login form');
      assert.equal(production, '', name + ' called production: ' + production);
    } finally {
      await context.close();
    }
  }
});
