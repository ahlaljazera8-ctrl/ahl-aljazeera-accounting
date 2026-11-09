#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { waitForPage, openChrome } = require('../tests/chrome-debug.js');
const { fromFile } = require('./emulator-csp-config.js');

const PROJECT = 'ahl-aljazeera-accounting';
const EMAIL = 'verify.entry@example.invalid';
const PASSWORD = 'emulator-only-pass';
const DISPLAY = 'مالك التحقق';
const PROJECT_ID = 'p-verify';
const PROJECT_NAME = 'مشروع التحقق';
const DESCRIPTION = 'قيد تحقق مواد';
const AMOUNT = 1500000;
const AMOUNT_TEXT = '1,500,000';
const MINUS_AMOUNT = '\u22121,500,000';
const RUNS = '/tmp/aj-verify-runs';
const EVIDENCE_ROOT = '/tmp/aj-verify-evidence';
const ROOT = path.join(__dirname, '..');
const PRODUCTION_HOSTS = ['firestore.googleapis.com', 'identitytoolkit.googleapis.com', 'securetoken.googleapis.com'];

/**
 * @typedef {Object} RunRecord
 * @property {string} runId
 * @property {number} firebasePid
 * @property {number} chromePid
 * @property {number} debugPort
 * @property {string} userDataDir
 * @property {string} origin
 * @property {number} authPort
 * @property {number} firestorePort
 * @property {number} hostingPort
 * @property {number} hubPort
 * @property {string} evidenceDir
 * @property {string} email
 * @property {string} displayName
 * @property {string} projectId
 * @property {string} projectName
 * @property {string} logPath
 */

/**
 * @typedef {Object} Loopback
 * @property {string} host
 * @property {number} port
 */

/**
 * @typedef {Object} CdpValue
 * @property {string} [type]
 * @property {string} [subtype]
 * @property {unknown} [value]
 * @property {string} [description]
 */

/**
 * @typedef {Object} CdpReply
 * @property {{ data?: string, result?: CdpValue, exceptionDetails?: unknown }} [result]
 * @property {{ message?: string }} [error]
 */

/**
 * @typedef {Object} CdpSession
 * @property {(method: string, params?: Record<string, unknown>) => Promise<CdpReply>} send
 * @property {string[]} urls
 * @property {() => void} close
 */

/**
 * @typedef {Object} LedgerRow
 * @property {string} id
 * @property {unknown} amount
 * @property {unknown} entryType
 * @property {unknown} direction
 * @property {unknown} projectId
 * @property {unknown} createdByName
 * @property {unknown} description
 * @property {unknown} entryDate
 */

class VerifyError extends Error {
  /**
   * @param {string} message
   * @param {number} [exitCode]
   */
  constructor(message, exitCode) {
    super(message);
    this.exitCode = exitCode || 1;
  }
}

/**
 * @param {string} raw
 * @returns {Loopback}
 */
function localHost(raw) {
  if (typeof raw !== 'string' || !/^(127\.0\.0\.1|localhost):\d+$/.test(raw)) {
    throw new Error('emulator host must be loopback. Got: ' + raw);
  }
  const parts = raw.split(':');
  const host = parts[0] || '';
  const port = Number(parts[1]);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('emulator host must be loopback. Got: ' + raw);
  }
  return { host, port };
}

/**
 * @param {string} raw
 * @returns {void}
 */
function assertNoProductionUrl(raw) {
  let host = '';
  try {
    host = new URL(raw).hostname;
  } catch (err) {
    throw new Error('not a URL: ' + raw);
  }
  const blocked = PRODUCTION_HOSTS.some(name => host === name || host.endsWith('.' + name));
  if (blocked) throw new Error('refusing production Firebase host: ' + host);
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {number} pid
 * @returns {boolean}
 */
function alive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * @param {number} pid
 * @param {NodeJS.Signals} signal
 * @returns {void}
 */
function signalGroup(pid, signal) {
  if (!pid) return;
  try {
    process.kill(-pid, signal);
  } catch (err) {
    try {
      process.kill(pid, signal);
    } catch (again) {
      return;
    }
  }
}

/**
 * @param {string} runId
 * @returns {string}
 */
function runPath(runId) {
  return path.join(RUNS, runId, 'run.json');
}

/**
 * @param {RunRecord} run
 * @returns {void}
 */
function saveRun(run) {
  fs.mkdirSync(path.dirname(runPath(run.runId)), { recursive: true });
  fs.writeFileSync(runPath(run.runId), JSON.stringify(run, null, 2) + '\n');
  fs.writeFileSync(path.join(RUNS, 'current'), run.runId + '\n');
}

/**
 * @returns {RunRecord}
 */
function readCurrent() {
  const pointer = path.join(RUNS, 'current');
  if (!fs.existsSync(pointer)) throw new VerifyError('no verification run is recorded');
  const runId = fs.readFileSync(pointer, 'utf8').trim();
  const file = runPath(runId);
  if (!fs.existsSync(file)) throw new VerifyError('run record missing for ' + runId);
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!parsed || typeof parsed.runId !== 'string') throw new VerifyError('run record is not a RunRecord');
  return /** @type {RunRecord} */ (parsed);
}

/**
 * @param {number} rootPid
 * @returns {Set<number>}
 */
function processTree(rootPid) {
  /** @type {Map<number, number[]>} */
  const children = new Map();
  for (const name of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(name)) continue;
    let text;
    try {
      text = fs.readFileSync('/proc/' + name + '/status', 'utf8');
    } catch (err) {
      continue;
    }
    const match = text.match(/^PPid:\s+(\d+)/m);
    if (!match) continue;
    const parent = Number(match[1]);
    const list = children.get(parent) || [];
    list.push(Number(name));
    children.set(parent, list);
  }
  /** @type {Set<number>} */
  const seen = new Set();
  /** @type {number[]} */
  const stack = [rootPid];
  while (stack.length) {
    const pid = stack.pop();
    if (pid == null || seen.has(pid)) continue;
    seen.add(pid);
    for (const child of children.get(pid) || []) stack.push(child);
  }
  return seen;
}

/**
 * @param {number} port
 * @returns {string}
 */
function listenInode(port) {
  const hex = ':' + port.toString(16).toUpperCase().padStart(4, '0');
  for (const file of ['/proc/net/tcp', '/proc/net/tcp6']) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch (err) {
      continue;
    }
    for (const line of text.split('\n').slice(1)) {
      const cols = line.trim().split(/\s+/);
      if (cols.length < 10) continue;
      if (cols[3] !== '0A') continue;
      const local = cols[1] || '';
      if (!local.toUpperCase().endsWith(hex)) continue;
      return cols[9] || '';
    }
  }
  return '';
}

/**
 * @param {number} pid
 * @param {number} port
 * @returns {Promise<boolean>}
 */
async function portOwnedByTree(pid, port) {
  const inode = listenInode(port);
  if (!inode || inode === '0') return false;
  const tree = processTree(pid);
  for (const candidate of tree) {
    const dir = '/proc/' + candidate + '/fd';
    /** @type {string[]} */
    let names;
    try {
      names = fs.readdirSync(dir);
    } catch (err) {
      continue;
    }
    for (const name of names) {
      let link;
      try {
        link = fs.readlinkSync(path.join(dir, name));
      } catch (err) {
        continue;
      }
      if (link === 'socket:[' + inode + ']') return true;
    }
  }
  return false;
}

/**
 * @param {string} source
 * @returns {string}
 */
function versionLiteral(source) {
  const match = source.match(/^const VERSION = '([^']*)';/m);
  if (!match || match[1] == null) throw new VerifyError('const VERSION assignment missing');
  return match[1];
}

/**
 * @param {number} port
 * @returns {boolean}
 */
function portOpen(port) {
  return listenInode(port) !== '';
}

/**
 * @param {RunRecord} run
 * @returns {Promise<void>}
 */
async function stopRecorded(run) {
  signalGroup(run.chromePid, 'SIGKILL');
  signalGroup(run.firebasePid, 'SIGTERM');
  await sleep(400);
  signalGroup(run.firebasePid, 'SIGKILL');
  if (run.userDataDir) fs.rmSync(run.userDataDir, { recursive: true, force: true });
  fs.rmSync(path.join(ROOT, 'firebase.emulator.json'), { force: true });
  fs.rmSync(path.join(RUNS, run.runId), { recursive: true, force: true });
  const pointer = path.join(RUNS, 'current');
  if (fs.existsSync(pointer) && fs.readFileSync(pointer, 'utf8').trim() === run.runId)
    fs.rmSync(pointer, { force: true });
}

/**
 * @param {string} logPath
 * @returns {Promise<{ hubPort: number }>}
 */
async function waitForEmulators(logPath, firebasePid) {
  const started = Date.now();
  while (Date.now() - started < 180000) {
    if (!alive(firebasePid)) {
      const log = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8').slice(-2000) : '';
      throw new VerifyError('firebase emulators:start exited\n' + log);
    }
    const log = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : '';
    const hub =
      log.match(/Emulator Hub running at\s+([0-9.]+|localhost):(\d+)/) ||
      log.match(/Emulator Hub host:\s+([0-9.]+|localhost)\s+port:\s+(\d+)/);
    if (log.includes('All emulators ready') && hub && hub[2]) return { hubPort: Number(hub[2]) };
    await sleep(250);
  }
  throw new VerifyError('emulators were not ready within 180s');
}

/**
 * @param {number} hubPort
 * @returns {Promise<{ authPort: number, firestorePort: number, hostingPort: number, hostingHost: string }>}
 */
async function readHub(hubPort) {
  const res = await fetch('http://127.0.0.1:' + hubPort + '/emulators');
  if (!res.ok) throw new VerifyError('emulator hub status ' + res.status);
  const body = await res.json();
  const auth = body && body.auth;
  const firestore = body && body.firestore;
  const hosting = body && body.hosting;
  if (!auth || !firestore || !hosting) throw new VerifyError('hub is missing auth, firestore, or hosting');
  const authHost = localHost(String(auth.host || '127.0.0.1') + ':' + String(auth.port));
  const firestoreHost = localHost(String(firestore.host || '127.0.0.1') + ':' + String(firestore.port));
  const hostingHost = String(hosting.host || '127.0.0.1');
  const hostingPort = Number(hosting.port);
  if (hostingHost !== '127.0.0.1' && hostingHost !== 'localhost' && hostingHost !== '0.0.0.0') {
    throw new VerifyError('hosting emulator is not loopback: ' + hostingHost);
  }
  if (authHost.port !== 9099) throw new VerifyError('auth emulator port is ' + authHost.port + ', expected 9099');
  if (firestoreHost.port !== 8080)
    throw new VerifyError('firestore emulator port is ' + firestoreHost.port + ', expected 8080');
  if (!Number.isInteger(hostingPort) || hostingPort <= 0) throw new VerifyError('hosting emulator has no port');
  return { authPort: authHost.port, firestorePort: firestoreHost.port, hostingPort, hostingHost: '127.0.0.1' };
}

/**
 * @param {string} origin
 * @returns {Promise<void>}
 */
async function assertEmulatorCsp(origin) {
  const res = await fetch(origin + '/index.html');
  if (!res.ok) throw new VerifyError('index.html status ' + res.status);
  const csp = res.headers.get('content-security-policy') || '';
  if (!csp.includes('http://127.0.0.1:9099') || !csp.includes('http://127.0.0.1:8080')) {
    throw new VerifyError('hosting CSP is missing the emulator origins');
  }
}

/**
 * @param {number} authPort
 * @param {number} firestorePort
 * @returns {Promise<void>}
 */
async function seed(authPort, firestorePort) {
  const authEnv = localHost('127.0.0.1:' + authPort);
  const firestoreEnv = localHost('127.0.0.1:' + firestorePort);
  process.env.FIREBASE_AUTH_EMULATOR_HOST = authEnv.host + ':' + authEnv.port;
  process.env.FIRESTORE_EMULATOR_HOST = firestoreEnv.host + ':' + firestoreEnv.port;
  const { initializeApp, deleteApp } = require('firebase/app');
  const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } = require('firebase/auth');
  const { doc, setDoc } = require('firebase/firestore');
  const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
  const env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: {
      host: firestoreEnv.host,
      port: firestoreEnv.port,
      rules: fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8'),
    },
  });
  const app = initializeApp({ apiKey: 'demo', projectId: PROJECT, authDomain: 'localhost' }, 'verify-seed');
  try {
    const auth = getAuth(app);
    connectAuthEmulator(auth, 'http://' + authEnv.host + ':' + authEnv.port, { disableWarnings: true });
    const cred = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD);
    const uid = cred.user.uid;
    const now = new Date();
    await env.withSecurityRulesDisabled(async ctx => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'users', uid), {
        displayName: DISPLAY,
        email: EMAIL,
        role: 'owner',
        active: true,
        assignedProjectIds: [],
        createdAtServer: now,
        createdBy: uid,
      });
      await setDoc(doc(db, 'projects', PROJECT_ID), {
        id: PROJECT_ID,
        name: PROJECT_NAME,
        clientName: 'زبون',
        location: 'تحقق',
        currency: 'IQD',
        status: 'active',
        createdAtDevice: 1,
        createdAtServer: now,
        createdBy: uid,
        deviceId: 'verify',
      });
    });
  } finally {
    await deleteApp(app);
  }
}

/**
 * @param {number} authPort
 * @param {number} firestorePort
 * @returns {Promise<LedgerRow[]>}
 */
async function readEntries(authPort, firestorePort) {
  const authEnv = localHost('127.0.0.1:' + authPort);
  const firestoreEnv = localHost('127.0.0.1:' + firestorePort);
  const { initializeApp, deleteApp } = require('firebase/app');
  const { getAuth, connectAuthEmulator, signInWithEmailAndPassword } = require('firebase/auth');
  const { getFirestore, connectFirestoreEmulator, collection, getDocs } = require('firebase/firestore');
  const app = initializeApp(
    { apiKey: 'demo', projectId: PROJECT, authDomain: 'localhost' },
    'verify-read-' + Date.now(),
  );
  try {
    const auth = getAuth(app);
    connectAuthEmulator(auth, 'http://' + authEnv.host + ':' + authEnv.port, { disableWarnings: true });
    await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
    const db = getFirestore(app);
    connectFirestoreEmulator(db, firestoreEnv.host, firestoreEnv.port);
    const snap = await getDocs(collection(db, 'ledgerEntries'));
    return snap.docs.map(item => {
      const data = item.data();
      return {
        id: item.id,
        amount: data.amount,
        entryType: data.entryType,
        direction: data.direction,
        projectId: data.projectId,
        createdByName: data.createdByName,
        description: data.description,
        entryDate: data.entryDate,
      };
    });
  } finally {
    await deleteApp(app);
  }
}

/**
 * @param {number} port
 * @returns {Promise<CdpSession>}
 */
async function connectCdp(port) {
  const page = await waitForPage(port, null);
  if (!page.webSocketDebuggerUrl) throw new VerifyError('Chrome has no page target');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve(undefined));
    ws.addEventListener('error', () => reject(new VerifyError('debugger socket failed')));
  });
  let next = 0;
  /** @type {Map<number, (reply: CdpReply) => void>} */
  const pending = new Map();
  /** @type {string[]} */
  const urls = [];
  ws.addEventListener('message', event => {
    const data = /** @type {CdpReply & { id?: number, method?: string, params?: { request?: { url?: string } } }} */ (
      JSON.parse(String(event.data))
    );
    if (data.id && pending.has(data.id)) {
      const done = pending.get(data.id);
      pending.delete(data.id);
      if (done) done(data);
      return;
    }
    if (data.method === 'Network.requestWillBeSent') {
      const url = data.params && data.params.request && data.params.request.url;
      if (typeof url === 'string') urls.push(url);
    }
  });
  /**
   * @param {string} method
   * @param {Record<string, unknown>} [params]
   * @returns {Promise<CdpReply>}
   */
  function send(method, params) {
    const id = ++next;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new VerifyError('CDP timeout ' + method));
      }, 15000);
      pending.set(id, reply => {
        clearTimeout(timer);
        if (reply.error && reply.error.message) reject(new VerifyError(reply.error.message));
        else resolve(reply);
      });
      ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
  }
  return {
    send,
    urls,
    close: () => {
      ws.close();
    },
  };
}

/**
 * @param {CdpSession} session
 * @param {string} expression
 * @returns {Promise<unknown>}
 */
async function evaluate(session, expression) {
  const reply = await session.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  const result = reply.result && reply.result.result;
  if (reply.result && reply.result.exceptionDetails) {
    throw new VerifyError('page exception: ' + (result && result.description ? result.description : 'eval failed'));
  }
  return result ? result.value : undefined;
}

/**
 * @param {CdpSession} session
 * @param {string} expression
 * @param {number} ms
 * @returns {Promise<void>}
 */
async function waitUntil(session, expression, ms) {
  const started = Date.now();
  let last = '';
  while (Date.now() - started < ms) {
    try {
      const value = await evaluate(session, expression);
      if (value === true) return;
    } catch (err) {
      last = err instanceof Error ? err.message : String(err);
    }
    await sleep(200);
  }
  throw new VerifyError('timed out: ' + expression + (last ? ' (' + last + ')' : ''));
}

/**
 * @param {CdpSession} session
 * @param {string} file
 * @returns {Promise<void>}
 */
async function shoot(session, file) {
  const reply = await session.send('Page.captureScreenshot', { format: 'png' });
  const data = reply.result && reply.result.data;
  if (!data) throw new VerifyError('screenshot missing');
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
}

/**
 * @param {string[]} urls
 * @param {string} file
 * @returns {void}
 */
function writeNetwork(urls, file) {
  const lines = urls.map(url => {
    try {
      assertNoProductionUrl(url);
      return 'ok ' + url;
    } catch (err) {
      return 'BLOCKED ' + url;
    }
  });
  fs.writeFileSync(file, lines.join('\n') + '\n');
  const blocked = lines.find(line => line.startsWith('BLOCKED '));
  if (blocked) throw new VerifyError(blocked);
}

/**
 * @param {number} authPort
 * @returns {Promise<boolean>}
 */
async function accountListed(authPort) {
  localHost('127.0.0.1:' + authPort);
  const url =
    'http://127.0.0.1:' + authPort + '/identitytoolkit.googleapis.com/v1/projects/' + PROJECT + '/accounts:query';
  assertNoProductionUrl(url);
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnUserInfo: true }),
  });
  if (!res.ok) throw new VerifyError('auth emulator account list status ' + res.status);
  const body = await res.json();
  const accounts = body && Array.isArray(body.userInfo) ? body.userInfo : [];
  return accounts.some(account => account && account.email === EMAIL);
}

/**
 * @returns {Promise<RunRecord>}
 */
async function launch() {
  fs.mkdirSync(RUNS, { recursive: true });
  const pointer = path.join(RUNS, 'current');
  if (fs.existsSync(pointer)) {
    const previousId = fs.readFileSync(pointer, 'utf8').trim();
    const previousFile = runPath(previousId);
    if (fs.existsSync(previousFile)) {
      const previous = /** @type {RunRecord} */ (JSON.parse(fs.readFileSync(previousFile, 'utf8')));
      if (alive(previous.firebasePid)) throw new VerifyError('an emulator is already running for ' + previousId, 2);
    }
  }
  if (portOpen(9099) || portOpen(8080)) {
    throw new VerifyError('refusing to start a second emulator; 9099 or 8080 is already in use', 2);
  }
  const runId = Date.now().toString(36) + '-' + Math.random().toString(16).slice(2, 8);
  const runDir = path.join(RUNS, runId);
  const evidenceDir = path.join(EVIDENCE_ROOT, runId);
  fs.mkdirSync(runDir, { recursive: true });
  fs.mkdirSync(path.join(evidenceDir, 'ledger-entry'), { recursive: true });
  const logPath = path.join(runDir, 'firebase.log');
  /** @type {RunRecord} */
  const run = {
    runId,
    firebasePid: 0,
    chromePid: 0,
    debugPort: 0,
    userDataDir: path.join(runDir, 'chrome'),
    origin: '',
    authPort: 9099,
    firestorePort: 8080,
    hostingPort: 0,
    hubPort: 0,
    evidenceDir,
    email: EMAIL,
    displayName: DISPLAY,
    projectId: PROJECT_ID,
    projectName: PROJECT_NAME,
    logPath,
  };
  saveRun(run);
  try {
    fs.writeFileSync(path.join(ROOT, 'firebase.emulator.json'), fromFile());
    const fd = fs.openSync(logPath, 'w');
    const child = spawn(
      'npx',
      [
        '--no-install',
        'firebase',
        '--config',
        'firebase.emulator.json',
        'emulators:start',
        '--only',
        'auth,firestore,hosting',
        '--project',
        PROJECT,
      ],
      { cwd: ROOT, detached: true, stdio: ['ignore', fd, fd] },
    );
    fs.closeSync(fd);
    child.unref();
    run.firebasePid = child.pid || 0;
    saveRun(run);
    const ready = await waitForEmulators(logPath, run.firebasePid);
    run.hubPort = ready.hubPort;
    const hub = await readHub(run.hubPort);
    run.authPort = hub.authPort;
    run.firestorePort = hub.firestorePort;
    run.hostingPort = hub.hostingPort;
    run.origin = 'http://127.0.0.1:' + hub.hostingPort;
    saveRun(run);
    if (!(await portOwnedByTree(run.firebasePid, run.authPort)))
      throw new VerifyError('auth port is not owned by this emulator');
    if (!(await portOwnedByTree(run.firebasePid, run.firestorePort))) {
      throw new VerifyError('firestore port is not owned by this emulator');
    }
    if (!(await portOwnedByTree(run.firebasePid, run.hostingPort))) {
      throw new VerifyError('hosting port is not owned by this emulator');
    }
    await assertEmulatorCsp(run.origin);
    await seed(run.authPort, run.firestorePort);
    const opened = await openChrome({ userDataDir: run.userDataDir, detached: true });
    opened.chrome.unref();
    run.chromePid = opened.chrome.pid || 0;
    run.debugPort = opened.port;
    saveRun(run);
    const session = await connectCdp(run.debugPort);
    try {
      await session.send('Page.enable');
      await session.send('Runtime.enable');
      await session.send('Network.enable');
      await session.send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 1,
        mobile: true,
      });
      await session.send('Page.navigate', { url: run.origin + '/index.html?emulator=1' });
      await waitUntil(
        session,
        `document.body && document.body.dataset.ready === '1' && document.querySelector('#login') && document.querySelector('#login').hidden === false && document.querySelector('#shell') && document.querySelector('#shell').hidden === true && ((document.querySelector('#login-btn') || {}).textContent || '').includes('دخول')`,
        30000,
      );
      writeNetwork(session.urls, path.join(evidenceDir, 'launch-network.txt'));
    } finally {
      session.close();
    }
    fs.writeFileSync(
      path.join(evidenceDir, 'launch.txt'),
      [
        'runId=' + run.runId,
        'origin=' + run.origin,
        'firebasePid=' + run.firebasePid,
        'chromePid=' + run.chromePid,
        'hubPort=' + run.hubPort,
      ].join('\n') + '\n',
    );
    saveRun(run);
    console.log('runId=' + run.runId);
    console.log('origin=' + run.origin);
    console.log('evidenceDir=' + evidenceDir);
    return run;
  } catch (err) {
    await stopRecorded(run);
    throw err;
  }
}

/**
 * @param {RunRecord} run
 * @returns {Promise<void>}
 */
async function doctor(run) {
  const lines = [];
  if (!alive(run.firebasePid)) throw new VerifyError('firebase pid ' + run.firebasePid + ' is not alive');
  if (!alive(run.chromePid)) throw new VerifyError('chrome pid ' + run.chromePid + ' is not alive');
  lines.push('pids alive');
  if (!(await portOwnedByTree(run.firebasePid, run.authPort)))
    throw new VerifyError('auth port is not owned by firebase pid ' + run.firebasePid);
  if (!(await portOwnedByTree(run.firebasePid, run.firestorePort))) {
    throw new VerifyError('firestore port is not owned by firebase pid ' + run.firebasePid);
  }
  if (!(await portOwnedByTree(run.firebasePid, run.hostingPort))) {
    throw new VerifyError('hosting port is not owned by firebase pid ' + run.firebasePid);
  }
  if (!(await portOwnedByTree(run.chromePid, run.debugPort)))
    throw new VerifyError('debug port is not owned by chrome pid ' + run.chromePid);
  lines.push('ports owned by this run');
  const served = await fetch(run.origin + '/sw.js');
  if (!served.ok) throw new VerifyError('sw.js status ' + served.status);
  const servedVersion = versionLiteral(await served.text());
  const treeVersion = versionLiteral(fs.readFileSync(path.join(ROOT, 'public', 'sw.js'), 'utf8'));
  if (servedVersion !== treeVersion) {
    throw new VerifyError('served sw.js VERSION ' + servedVersion + ' does not match the working tree ' + treeVersion);
  }
  lines.push('served VERSION matches the working tree');
  if (!(await accountListed(run.authPort))) throw new VerifyError('seeded auth account is missing');
  lines.push('auth account listed');
  const session = await connectCdp(run.debugPort);
  try {
    await session.send('Runtime.enable');
    const ready = await evaluate(
      session,
      `document.body && document.body.dataset.ready === '1' && ((document.querySelector('#login') && document.querySelector('#login').hidden === false) || (document.querySelector('#shell') && document.querySelector('#shell').hidden === false))`,
    );
    if (ready !== true) throw new VerifyError('page is not ready');
    writeNetwork(session.urls, path.join(run.evidenceDir, 'doctor-network.txt'));
  } finally {
    session.close();
  }
  lines.push('page ready');
  fs.writeFileSync(path.join(run.evidenceDir, 'doctor.txt'), lines.join('\n') + '\n');
  console.log(lines.join('\n'));
}

/**
 * @param {CdpSession} session
 * @param {string} label
 * @returns {Promise<string>}
 */
async function kvText(session, label) {
  const value = await evaluate(
    session,
    `(() => { const row = [...document.querySelectorAll('#main .kv')].find(el => (el.querySelector('span') || {}).textContent === ${JSON.stringify(label)}); return row ? row.innerText.replace(/\\s+/g, ' ').trim() : ''; })()`,
  );
  return typeof value === 'string' ? value : '';
}

/**
 * @param {CdpSession} session
 * @param {string} file
 * @param {string} entryDate
 * @returns {Promise<string>}
 */
async function assertScreen(session, file, entryDate) {
  const received = await kvText(session, 'المقبوض');
  const spent = await kvText(session, 'المصروف');
  const profit = await kvText(session, 'الربح');
  const count = await evaluate(
    session,
    `(() => { const text = (document.querySelector('#main') || {}).innerText || ''; const needle = ${JSON.stringify(DESCRIPTION)}; let n = 0; let i = 0; while ((i = text.indexOf(needle, i)) !== -1) { n += 1; i += needle.length; } return n; })()`,
  );
  const main = await evaluate(session, `(document.querySelector('#main') || {}).innerText || ''`);
  const text = typeof main === 'string' ? main : '';
  const notes = [
    'received=' + received,
    'spent=' + spent,
    'profit=' + profit,
    'count=' + String(count),
    'date=' + entryDate,
  ];
  fs.appendFileSync(file, notes.join('\n') + '\n');
  if (!received.includes('0 د.ع') || received.includes(AMOUNT_TEXT)) {
    throw new VerifyError('STOP: المقبوض was ' + JSON.stringify(received));
  }
  if (!spent.includes(AMOUNT_TEXT + ' د.ع') || spent.includes('3,000,000')) {
    throw new VerifyError('STOP: المصروف was ' + JSON.stringify(spent));
  }
  if (!profit.includes(MINUS_AMOUNT + ' د.ع') || profit.includes('-' + AMOUNT_TEXT)) {
    throw new VerifyError('STOP: الربح was ' + JSON.stringify(profit));
  }
  if (count !== 1) throw new VerifyError('STOP: entry count was ' + String(count));
  if (!text.includes('مواد')) throw new VerifyError('STOP: type مواد missing');
  if (!text.includes(entryDate)) throw new VerifyError('STOP: date ' + entryDate + ' missing');
  if (text.includes('رُفض')) throw new VerifyError('STOP: the entry was rejected');
  return text;
}

/**
 * @param {RunRecord} run
 * @returns {Promise<void>}
 */
async function driveLedgerEntry(run) {
  const dir = path.join(run.evidenceDir, 'ledger-entry');
  fs.mkdirSync(dir, { recursive: true });
  const notes = path.join(dir, 'assertions.txt');
  fs.writeFileSync(notes, '');
  const session = await connectCdp(run.debugPort);
  try {
    await session.send('Page.enable');
    await session.send('Runtime.enable');
    await session.send('Network.enable');
    await session.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    const shellOpen = await evaluate(
      session,
      `document.querySelector('#shell') && document.querySelector('#shell').hidden === false`,
    );
    if (shellOpen !== true) {
      const filled = await evaluate(
        session,
        `(() => { const email = document.querySelector('#login-email'); const password = document.querySelector('#login-password'); const button = document.querySelector('#login-btn'); if (!email || !password || !button) return false; email.value = ${JSON.stringify(EMAIL)}; password.value = ${JSON.stringify(PASSWORD)}; button.click(); return true; })()`,
      );
      if (filled !== true) throw new VerifyError('login form is missing');
      await waitUntil(
        session,
        `document.querySelector('#shell') && document.querySelector('#shell').hidden === false && (document.querySelector('#who') || {}).textContent && document.querySelector('#who').textContent.includes(${JSON.stringify(DISPLAY)})`,
        25000,
      );
    }
    await shoot(session, path.join(dir, 'after-login.png'));
    const opened = await evaluate(
      session,
      `(() => { const tab = document.querySelector('a[data-tab="entry"]'); if (!tab) return false; tab.click(); return true; })()`,
    );
    if (opened !== true) throw new VerifyError('قيد جديد tab is missing');
    await waitUntil(
      session,
      `!!(document.querySelector('#title') && document.querySelector('#title').textContent === 'قيد جديد' && document.querySelector('#amt'))`,
      10000,
    );
    const typed = await evaluate(
      session,
      `(() => { const pill = document.querySelector('button[data-type="materials"]'); if (!pill) return false; pill.click(); return true; })()`,
    );
    if (typed !== true) throw new VerifyError('مواد pill is missing');
    await waitUntil(
      session,
      `!!document.querySelector(${JSON.stringify('button[data-proj="' + PROJECT_ID + '"]')})`,
      25000,
    );
    const drafted = await evaluate(
      session,
      `(() => { const project = document.querySelector(${JSON.stringify('button[data-proj="' + PROJECT_ID + '"]')}); if (!project) return false; project.click(); const amount = document.querySelector('#amt'); const desc = document.querySelector('#desc'); if (!amount || !desc) return false; amount.value = ${JSON.stringify(String(AMOUNT))}; desc.value = ${JSON.stringify(DESCRIPTION)}; return amount.value === ${JSON.stringify(String(AMOUNT))} && desc.value === ${JSON.stringify(DESCRIPTION)}; })()`,
    );
    if (drafted !== true) throw new VerifyError('entry form is missing');
    await shoot(session, path.join(dir, 'form.png'));
    const saved = await evaluate(
      session,
      `(() => { const button = document.querySelector('#save'); if (!button) return false; button.click(); return true; })()`,
    );
    if (saved !== true) throw new VerifyError('حفظ button is missing');
    await waitUntil(
      session,
      `(document.querySelector('#msg') || {}).innerText && document.querySelector('#msg').innerText.includes('حُفظ على الهاتف')`,
      10000,
    );
    await evaluate(
      session,
      `document.querySelector('#msg') && document.querySelector('#msg').scrollIntoView({block:'center'})`,
    );
    await shoot(session, path.join(dir, 'saved.png'));
    /** @type {LedgerRow | null} */
    let row = null;
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      const rows = (await readEntries(run.authPort, run.firestorePort)).filter(
        item => item.description === DESCRIPTION,
      );
      if (rows.length > 1) throw new VerifyError('STOP: Firestore has ' + rows.length + ' rows for this entry');
      if (rows.length === 1) {
        row = rows[0] || null;
        break;
      }
      await sleep(1000);
    }
    if (!row) throw new VerifyError('STOP: Firestore has no ledgerEntries row for this entry');
    if (row.amount !== AMOUNT) throw new VerifyError('STOP: Firestore amount was ' + String(row.amount));
    if (row.entryType !== 'materials') throw new VerifyError('STOP: Firestore entryType was ' + String(row.entryType));
    if (row.direction !== 'expense') throw new VerifyError('STOP: Firestore direction was ' + String(row.direction));
    if (row.projectId !== PROJECT_ID) throw new VerifyError('STOP: Firestore projectId was ' + String(row.projectId));
    if (row.createdByName !== DISPLAY)
      throw new VerifyError('STOP: Firestore createdByName was ' + String(row.createdByName));
    const entryDate = typeof row.entryDate === 'string' ? row.entryDate : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate))
      throw new VerifyError('STOP: Firestore entryDate was ' + String(row.entryDate));
    fs.writeFileSync(path.join(dir, 'firestore.json'), JSON.stringify(row, null, 2) + '\n');
    const listed = await evaluate(
      session,
      `(() => { const tab = document.querySelector('a[data-tab="projects"]'); if (!tab) return false; tab.click(); return true; })()`,
    );
    if (listed !== true) throw new VerifyError('المشاريع tab is missing');
    await waitUntil(
      session,
      `!!document.querySelector(${JSON.stringify('a[href="#project/' + PROJECT_ID + '"]')})`,
      20000,
    );
    const projectLink = await evaluate(
      session,
      `(() => { const link = document.querySelector(${JSON.stringify('a[href="#project/' + PROJECT_ID + '"]')}); if (!link) return false; link.click(); return true; })()`,
    );
    if (projectLink !== true) throw new VerifyError('project card is missing');
    await waitUntil(
      session,
      `(document.querySelector('#title') || {}).textContent === ${JSON.stringify(PROJECT_NAME)} && (((document.querySelector('#main') || {}).innerText) || '').includes('المصروف')`,
      20000,
    );
    await assertScreen(session, notes, entryDate);
    await evaluate(
      session,
      `(() => { const row = [...document.querySelectorAll('.entry')].find(el => (el.innerText || '').includes(${JSON.stringify(DESCRIPTION)})); if (row) row.scrollIntoView({block:'center'}); return true; })()`,
    );
    await shoot(session, path.join(dir, 'project.png'));
    const home = await evaluate(
      session,
      `(() => { const tab = document.querySelector('a[data-tab="home"]'); if (!tab) return false; tab.click(); return true; })()`,
    );
    if (home !== true) throw new VerifyError('الرئيسية tab is missing');
    await waitUntil(
      session,
      `document.querySelector('#title') && document.querySelector('#title').textContent === 'الرئيسية'`,
      10000,
    );
    const received = await kvText(session, 'إجمالي المقبوض');
    const spent = await kvText(session, 'إجمالي المصروف');
    const profit = await kvText(session, 'صافي الربح');
    fs.appendFileSync(
      notes,
      ['home-received=' + received, 'home-spent=' + spent, 'home-profit=' + profit].join('\n') + '\n',
    );
    if (!received.includes('0 د.ع') || received.includes(AMOUNT_TEXT))
      throw new VerifyError('STOP: إجمالي المقبوض was ' + JSON.stringify(received));
    if (!spent.includes(AMOUNT_TEXT + ' د.ع') || spent.includes('3,000,000')) {
      throw new VerifyError('STOP: إجمالي المصروف was ' + JSON.stringify(spent));
    }
    if (!profit.includes(MINUS_AMOUNT) || profit.includes('-' + AMOUNT_TEXT)) {
      throw new VerifyError('STOP: صافي الربح was ' + JSON.stringify(profit));
    }
    await shoot(session, path.join(dir, 'home.png'));
    await session.send('Page.reload', { ignoreCache: true });
    await waitUntil(
      session,
      `document.body && document.body.dataset.ready === '1' && document.querySelector('#shell') && document.querySelector('#shell').hidden === false`,
      30000,
    );
    const onProject = await evaluate(session, `location.hash === ${JSON.stringify('#project/' + PROJECT_ID)}`);
    if (onProject !== true) {
      const back = await evaluate(
        session,
        `(() => { const tab = document.querySelector('a[data-tab="projects"]'); if (!tab) return false; tab.click(); return true; })()`,
      );
      if (back !== true) throw new VerifyError('STOP: المشاريع tab missing after reload');
      await waitUntil(
        session,
        `!!document.querySelector(${JSON.stringify('a[href="#project/' + PROJECT_ID + '"]')})`,
        20000,
      );
      const card = await evaluate(
        session,
        `(() => { const link = document.querySelector(${JSON.stringify('a[href="#project/' + PROJECT_ID + '"]')}); if (!link) return false; link.click(); return true; })()`,
      );
      if (card !== true) throw new VerifyError('STOP: project card missing after reload');
    }
    await waitUntil(
      session,
      `(document.querySelector('#title') || {}).textContent === ${JSON.stringify(PROJECT_NAME)} && (((document.querySelector('#main') || {}).innerText) || '').includes(${JSON.stringify(DESCRIPTION)}) && (((document.querySelector('#main') || {}).innerText) || '').includes('مواد')`,
      20000,
    );
    fs.appendFileSync(notes, 'after-reload\n');
    await assertScreen(session, notes, entryDate);
    await evaluate(
      session,
      `(() => { const row = [...document.querySelectorAll('.entry')].find(el => (el.innerText || '').includes(${JSON.stringify(DESCRIPTION)})); if (row) row.scrollIntoView({block:'center'}); return true; })()`,
    );
    await shoot(session, path.join(dir, 'project-reload.png'));
    const again = (await readEntries(run.authPort, run.firestorePort)).filter(item => item.description === DESCRIPTION);
    if (again.length !== 1) throw new VerifyError('STOP: after reload Firestore has ' + again.length + ' rows');
    if (again[0] && again[0].amount !== AMOUNT)
      throw new VerifyError('STOP: after reload amount was ' + String(again[0].amount));
    writeNetwork(session.urls, path.join(dir, 'network.txt'));
    console.log('ledger-entry proved');
    console.log('evidenceDir=' + run.evidenceDir);
  } finally {
    session.close();
  }
}

/**
 * @param {RunRecord} run
 * @param {string} featureId
 * @returns {Promise<void>}
 */
async function drive(run, featureId) {
  if (featureId !== 'ledger-entry') {
    const name = featureId || '(missing)';
    throw new VerifyError('not proved in this run: ' + name + '. See features/' + (featureId || 'README') + '.md', 3);
  }
  await driveLedgerEntry(run);
}

/**
 * @param {RunRecord} run
 * @returns {Promise<void>}
 */
async function cleanup(run) {
  const evidenceDir = run.evidenceDir;
  await stopRecorded(run);
  if (evidenceDir && !fs.existsSync(evidenceDir))
    throw new VerifyError('evidence directory disappeared: ' + evidenceDir);
  console.log('cleaned');
  console.log('evidenceDir=' + evidenceDir);
}

/**
 * @param {string[]} argv
 * @returns {Promise<number>}
 */
async function main(argv) {
  const command = argv[2] || '';
  try {
    if (command === 'launch') {
      await launch();
      return 0;
    }
    if (command === 'doctor') {
      await doctor(readCurrent());
      return 0;
    }
    if (command === 'drive') {
      await drive(readCurrent(), argv[3] || '');
      return 0;
    }
    if (command === 'cleanup') {
      const pointer = path.join(RUNS, 'current');
      if (!fs.existsSync(pointer)) {
        console.log('no run');
        return 0;
      }
      await cleanup(readCurrent());
      return 0;
    }
    console.error('usage: node scripts/verify-aj.js <launch|doctor|drive|cleanup>');
    return 1;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    const code = err instanceof VerifyError ? err.exitCode : 1;
    return code;
  }
}

module.exports = { localHost, assertNoProductionUrl, main };

if (require.main === module) {
  main(process.argv).then(code => {
    process.exit(code);
  });
}
