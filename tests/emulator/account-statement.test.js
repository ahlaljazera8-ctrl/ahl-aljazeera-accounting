// Settle, statement issue, and booked corrections against the emulator.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const {
  doc, getDoc, setDoc, serverTimestamp, writeBatch,
  getDocFromServer, getDocsFromServer, collection, query, where, runTransaction,
} = require('firebase/firestore');
const Sync = require('../../public/sync.js');
const Accounts = require('../../public/accounts.js');
const Statement = require('../../public/accounts-statement.js');

const PROJECT_ID = 'ahl-aljazeera-accounting';
const OWNER_A = 'owner-a';
const OWNER_B = 'owner-b';
const PARTY = 'party-1';
const P1 = 'p1';
const OVER = 'المُرجَع والتسوية أكبر من السلفة';
const REFUSED = 'رُفض الإرسال';
const RULES = fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8');

function localHost(name) {
  const raw = process.env[name];
  if (!raw || !/^(127\.0\.0\.1|localhost):\d+$/.test(raw)) throw new Error(name + ' must be a local emulator. Got: ' + raw);
  const [host, port] = raw.split(':');
  return { host, port: Number(port) };
}

let testEnv;
let chain = Promise.resolve();
const contexts = new Map();
let seq = 0;

function testSeq(name, fn) {
  test(name, { timeout: 60000 }, async () => {
    const prev = chain;
    let release;
    chain = new Promise(resolve => { release = resolve; });
    await prev;
    try { await fn(); }
    finally { release(); }
  });
}
function uuid(n) {
  return 'bbbbbbbb-cccc-dddd-eeee-' + n.toString(16).padStart(12, '0');
}

test.before(async () => {
  const host = localHost('FIRESTORE_EMULATOR_HOST');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES, host: host.host, port: host.port },
  });
  const root = /** @type {any} */ (globalThis);
  root.baghdadDate = ms => new Date(ms + 3 * 3600000).toISOString().slice(0, 10);
  root.today = () => '2026-11-25';
  root.Ledger = require('../../public/ledger.js');
  root.Accounts = Accounts;
});
test.after(async () => {
  const closing = [];
  for (const firestore of contexts.values()) {
    const app = firestore.app;
    if (app && typeof app.delete === 'function') closing.push(Promise.resolve(app.delete()).catch(() => {}));
  }
  contexts.clear();
  await Promise.all(closing);
  if (testEnv) await testEnv.clearFirestore();
});

function db(uid) {
  const cached = contexts.get(uid);
  if (cached) return cached;
  const ctx = testEnv.authenticatedContext(uid);
  const firestore = ctx.firestore();
  contexts.set(uid, firestore);
  return firestore;
}
function row(uid, fields) {
  const out = Object.assign({ createdBy: uid, deviceId: 'device-' + uid }, fields || {});
  if (!Object.prototype.hasOwnProperty.call(fields || {}, 'createdAtServer')) out.createdAtServer = serverTimestamp();
  return out;
}
function send(uid, col, id, fields) {
  return setDoc(doc(db(uid), col, id), row(uid, Object.assign({ id }, fields)));
}
const allow = promise => assertSucceeds(promise);
const deny = promise => assertFails(promise);

async function seed() {
  await testEnv.clearFirestore();
  contexts.clear();
  seq = 0;
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const database = ctx.firestore();
    const user = uid => ({
      displayName: uid, email: uid + '@example.invalid', role: 'owner', active: true,
      assignedProjectIds: [], createdAtServer: new Date(), createdBy: OWNER_A,
    });
    await setDoc(doc(database, 'users', OWNER_A), user(OWNER_A));
    await setDoc(doc(database, 'users', OWNER_B), user(OWNER_B));
    await setDoc(doc(database, 'projects', P1), {
      id: P1, name: 'School', clientName: 'Client', location: 'Here', currency: 'IQD', status: 'active',
      createdAtDevice: 1, createdAtServer: new Date(), createdBy: OWNER_A, deviceId: 'admin',
    });
    await setDoc(doc(database, 'parties', PARTY), { id: PARTY, name: 'Kareem', createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin' });
  });
}
function cash(id, purpose, amount, over) {
  return Object.assign({
    id, kind: 'body', purpose, projectId: P1, partyId: PARTY, ledger: 'labor', currency: 'IQD', fxRate: 1, amount,
  }, over);
}
function capFields(advance, opId, drawn, uid) {
  return {
    advanceId: advance.id, partyId: advance.partyId, projectId: advance.projectId, currency: advance.currency,
    cap: advance.amount, drawn, lastOpId: opId, updatedBy: uid, updatedAtServer: serverTimestamp(),
  };
}
function sendCapped(uid, op, advance, drawn) {
  const fsdb = db(uid);
  const batch = writeBatch(fsdb);
  batch.set(doc(fsdb, 'accountTxns', op.id), row(uid, Object.assign({ id: op.id }, op)));
  batch.set(doc(fsdb, 'advanceCaps', advance.id), capFields(advance, op.id, drawn, uid));
  return batch.commit();
}
async function drawnOf(id) {
  const snap = await getDoc(doc(db(OWNER_A), 'advanceCaps', id));
  return snap.exists() ? snap.data().drawn : null;
}
async function putAdvance(amount) {
  seq += 1;
  const advance = cash(uuid(seq), 'advanceLabor', amount);
  await allow(send(OWNER_A, 'accountTxns', advance.id, advance));
  return advance;
}
async function putAgreement() {
  seq += 1;
  const id = uuid(seq);
  await allow(send(OWNER_A, 'agreements', id, {
    id, partyId: PARTY, projectId: P1, method: 'unit', description: 'bricks', currency: 'IQD',
    unitRate: 300000, unitQty: 4000, unitName: 'brick',
  }));
  return id;
}
async function putMeasurement() {
  const agreementId = await putAgreement();
  seq += 1;
  const id = uuid(seq);
  const body = {
    id, kind: 'body', purpose: 'laborQty', projectId: P1, partyId: PARTY, agreementId,
    ledger: 'labor', currency: 'IQD', fxRate: 1, qty: 8000,
  };
  await allow(send(OWNER_A, 'accountTxns', id, body));
  await allow(send(OWNER_A, 'accountTxns', 'appr_' + id, {
    id: 'appr_' + id, kind: 'appr', purpose: 'approveLabor', projectId: P1, partyId: PARTY, agreementId,
    ledger: 'labor', currency: 'IQD', fxRate: 1, targetId: id, amount: 600000, qty: 8000, txnDate: '2026-10-10',
  }));
  return id;
}
function settle(measurementId, advanceId, amount, gen) {
  return {
    id: 'stl_' + measurementId + '_' + (gen || '1'), kind: 'stl', purpose: 'settle', projectId: P1, partyId: PARTY,
    ledger: 'labor', currency: 'IQD', fxRate: 1, amount, targetId: measurementId, settlesId: advanceId, txnDate: '2026-11-18',
  };
}
function localRev(original, uid) {
  const rev = {
    id: 'rev_' + original.id, docType: 'accountTxn', kind: 'rev', purpose: original.purpose, ledger: 'labor',
    projectId: P1, partyId: PARTY, currency: 'IQD', fxRate: 1, amount: original.amount,
    reversesId: original.id, reversalReason: 'عكس', createdBy: uid, deviceId: 'device-' + uid,
  };
  if (original.agreementId) rev.agreementId = original.agreementId;
  return rev;
}
function remoteRev(original) {
  const rev = localRev(original, OWNER_A);
  delete rev.docType;
  return rev;
}
function sendStatement(uid, fields) {
  const data = Object.assign({ createdBy: uid, createdAtServer: serverTimestamp() }, fields);
  delete data.docType;
  return setDoc(doc(db(uid), 'statementApprovals', fields.id), data);
}
function millis(value) {
  if (typeof value === 'number') return value;
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  return null;
}

function hostify(value) {
  if (value == null || typeof value !== 'object') return value;
  if (value._methodName === 'serverTimestamp') return serverTimestamp();
  if (Array.isArray(value)) return value.map(hostify);
  const out = {};
  Object.keys(value).forEach(key => { out[key] = hostify(value[key]); });
  return out;
}
function capClient() {
  const context = {
    console, setTimeout, clearTimeout, Map, Set, Object, Array, String, Number, Promise, Error, TypeError, URL, URLSearchParams,
    navigator: { onLine: true }, sessionEpoch: 1, syncNotice: '',
    demoRole() { return ''; },
    $(sel) { return { hidden: sel === '#shell', textContent: '' }; },
    render() {}, paintBell() {}, holdSession() { return Promise.resolve(); },
    signOutPending() { return ''; }, clearSignOutPending() {},
    withTimeout(p) { return Promise.resolve(p); },
    MISSING_PROFILE_MSG: 'missing', SUSPENDED_MSG: 'suspended', SESSION_DEAD_MSG: 'dead',
    cache: {},
    K: {
      projects: 'projects', entries: 'entries', outbox: 'outbox', finance: 'projectFinance',
      terms: 'subcontractTerms', subcontracts: 'subcontracts', amendments: 'subcontractAmendments',
      foremen: 'foremen', foremanMoves: 'foremanMoves', parties: 'parties', agreements: 'agreements',
      accountTxns: 'accountTxns', statementApprovals: 'statementApprovals', syncErrors: 'syncErrors',
      sessionUser: 'sessionUser', statusPending: 'statusPending', pullWatermark: 'pullWatermark',
    },
  };
  context.window = context;
  context.globalThis = context;
  context.location = { href: 'http://127.0.0.1/index.html', search: '' };
  context.FIREBASE_CONFIG = { apiKey: 'demo', projectId: PROJECT_ID, authDomain: 'localhost' };
  context.get = (key, fallback) => (context.cache[key] === undefined ? fallback : JSON.parse(JSON.stringify(context.cache[key])));
  context.set = (key, value) => { context.cache[key] = JSON.parse(JSON.stringify(value)); };
  vm.createContext(context);
  for (const file of ['ledger.js', 'sync.js', 'sync-status.js', 'firebase-client.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../public', file), 'utf8'), context, { filename: file });
  }
  return context;
}
async function writeThroughCap(uid, local) {
  const context = capClient();
  const firestore = db(uid);
  const fsMod = {
    memoryLocalCache() { return {}; },
    initializeFirestore() { return firestore; },
    getFirestore() { return firestore; },
    connectFirestoreEmulator() {},
    clearIndexedDbPersistence() { return Promise.resolve(); },
    terminate() { return Promise.resolve(); },
    serverTimestamp, doc, getDoc, getDocsFromServer, collection, query, where,
    setDoc(ref, data) { return setDoc(ref, hostify(data)); },
    getDocFromServer,
    updateDoc() { return Promise.resolve(); },
    Timestamp: { fromMillis(n) { return n; } },
    runTransaction(database, update) {
      return runTransaction(database, async tx => {
        await update({
          get(ref) { return tx.get(ref); },
          set(ref, data) { return tx.set(ref, hostify(data)); },
        });
      });
    },
  };
  const real = await context.createFirebaseClient({
    initializeApp() { return { name: 'stmt-' + uid + '-' + seq }; },
    deleteApp() { return Promise.resolve(); },
    getApps() { return []; },
    authMod: {
      getAuth() { return { authStateReady() { return Promise.resolve(); }, currentUser: { uid } }; },
      connectAuthEmulator() {},
      signOut() { return Promise.resolve(); },
    },
    fsMod,
  }, context.fbGeneration);
  if (!real || !real.writeLocal) throw new Error('writer was not created');
  await real.writeLocal(local);
}
async function flushCap(uid, local) {
  return Sync.flushOutbox({
    ids: [local.id],
    load: () => local,
    write: async () => { await writeThroughCap(uid, local); },
    readDependency: async id => {
      const txn = await getDoc(doc(db(uid), 'accountTxns', id));
      if (txn.exists()) return { status: 'found', doc: txn.data() };
      const approval = await getDoc(doc(db(uid), 'statementApprovals', id));
      return approval.exists() ? { status: 'found', doc: approval.data() } : { status: 'missing' };
    },
    mintId: () => 'minted-stl',
  });
}

testSeq('E1 a settle flush is accepted and moves the counter', async () => {
  await seed();
  const advance = await putAdvance(100000);
  const measurement = await putMeasurement();
  const op = Object.assign({ docType: 'accountTxn', createdBy: OWNER_A, deviceId: 'device-' + OWNER_A }, settle(measurement, advance.id, 40000));
  const result = await flushCap(OWNER_A, op);
  assert.deepEqual(result.failed, []);
  const saved = await getDoc(doc(db(OWNER_A), 'accountTxns', op.id));
  assert.equal(typeof millis(saved.data().createdAtServer), 'number');
  assert.equal(await drawnOf(advance.id), 40000);
});

testSeq('E2 a statement approval is accepted and a re-flush is adopted', async () => {
  await seed();
  const id = uuid(40);
  const approval = {
    id, docType: 'statementApproval', partyId: PARTY, projectId: P1, periodKind: 'week',
    periodStart: '2026-11-07', periodEnd: '2026-11-13', createdBy: OWNER_A,
  };
  const first = await flushCap(OWNER_A, approval);
  assert.deepEqual(first.failed, []);
  const again = await flushCap(OWNER_A, approval);
  assert.equal(again.failed.length, 0);
  const saved = await getDoc(doc(db(OWNER_A), 'statementApprovals', id));
  assert.equal(saved.exists(), true);
});

testSeq('E3 a reversal after the issue books in the next period', async () => {
  await seed();
  const measurement = await putMeasurement();
  const approvalId = uuid(41);
  await allow(sendStatement(OWNER_A, {
    id: approvalId, partyId: PARTY, projectId: P1, periodKind: 'month',
    periodStart: '2026-10-01', periodEnd: '2026-10-31',
  }));
  const rev = remoteRev({ id: 'appr_' + measurement, purpose: 'approveLabor', amount: 600000, agreementId: (await getDoc(doc(db(OWNER_A), 'accountTxns', 'appr_' + measurement))).data().agreementId });
  await allow(send(OWNER_A, 'accountTxns', rev.id, rev));
  const approval = (await getDoc(doc(db(OWNER_A), 'statementApprovals', approvalId))).data();
  const marker = (await getDoc(doc(db(OWNER_A), 'accountTxns', rev.id))).data();
  const target = (await getDoc(doc(db(OWNER_A), 'accountTxns', 'appr_' + measurement))).data();
  const docs = /** @type {any[]} */ ([target, marker].map(item => Object.assign({ id: '' }, item, { createdAtServer: millis(item.createdAtServer) })));
  const day = Statement.bookDay(docs[1], /** @type {any} */ ({
    byId: { [docs[0].id]: docs[0], [docs[1].id]: docs[1] },
    approvals: [Object.assign({}, approval, { createdAtServer: millis(approval.createdAtServer) })],
    syncErrors: {},
    today: '2026-11-25',
  }));
  assert.equal(day > '2026-10-31', true);
  assert.equal(millis(marker.createdAtServer) > millis(approval.createdAtServer), true);
});

testSeq('E4 generation 2 before the reversal is refused', async () => {
  await seed();
  const advance = await putAdvance(100000);
  const measurement = await putMeasurement();
  const first = settle(measurement, advance.id, 1000);
  await allow(sendCapped(OWNER_A, first, advance, 1000));
  const second = settle(measurement, advance.id, 1000, '2');
  await deny(sendCapped(OWNER_A, second, advance, 2000));
  const local = Object.assign({ docType: 'accountTxn', createdBy: OWNER_A, deviceId: 'device-' + OWNER_A }, second);
  const result = await flushCap(OWNER_A, local);
  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].message, REFUSED);
});

testSeq('E5 a settle above the advance is refused', async () => {
  await seed();
  const advance = await putAdvance(100000);
  const measurement = await putMeasurement();
  const op = settle(measurement, advance.id, 100001);
  await deny(sendCapped(OWNER_A, op, advance, 100001));
});

testSeq('E6 a document written before the tap changes the issue', async () => {
  await seed();
  const measurement = await putMeasurement();
  const shown = Statement.periodStatement({
    docs: [], approvals: [], syncErrors: {}, outbox: [], partyId: PARTY, projectId: P1,
    periodKind: 'week', periodStart: '2026-11-07', periodEnd: '2026-11-13', today: '2026-11-25',
  });
  const late = {
    id: 'appr_' + measurement, purpose: 'approveLabor', amount: 600000, partyId: PARTY, projectId: P1,
    txnDate: '2026-11-10', createdAtServer: Date.now(),
  };
  const gate = await Statement.issueGate({
    shown,
    recompute() {
      return Statement.periodStatement({
        docs: [late], approvals: [], syncErrors: {}, outbox: [], partyId: PARTY, projectId: P1,
        periodKind: 'week', periodStart: '2026-11-07', periodEnd: '2026-11-13', today: '2026-11-25',
      });
    },
    online: () => true,
    inFlight: () => null,
    flush: async () => { late.createdAtServer = Date.now(); },
    timeoutMs: 1000,
    epoch: () => 1,
    lastSyncAt: () => Date.now() + 10,
    outbox: () => [],
    now: () => Date.now(),
    demo: false,
    projectActive: true,
    today: '2026-11-25',
  });
  assert.deepEqual(gate.errors, ['changed']);
});

testSeq('E7 a second phone adopts the same settle id', async () => {
  await seed();
  const advance = await putAdvance(100000);
  const measurement = await putMeasurement();
  const op = settle(measurement, advance.id, 40000);
  await allow(sendCapped(OWNER_A, op, advance, 40000));
  const same = Object.assign({ docType: 'accountTxn', createdBy: OWNER_B, deviceId: 'device-' + OWNER_B }, op);
  const adopted = await flushCap(OWNER_B, same);
  assert.equal(adopted.failed.length, 0);
  const different = Object.assign({}, same, { amount: 30000 });
  const linked = await flushCap(OWNER_B, different);
  assert.equal(linked.failed.length, 0);
  assert.equal(linked.linkRefusals[0].localId, 'minted-stl');
});

testSeq('E8 two phones cannot draw past the advance', async () => {
  await seed();
  const advance = await putAdvance(100000);
  const first = await putMeasurement();
  const second = await putMeasurement();
  const a = Object.assign({ docType: 'accountTxn', createdBy: OWNER_A, deviceId: 'device-' + OWNER_A }, settle(first, advance.id, 60000));
  const b = Object.assign({ docType: 'accountTxn', createdBy: OWNER_B, deviceId: 'device-' + OWNER_B }, settle(second, advance.id, 50000));
  const left = await flushCap(OWNER_A, a);
  const right = await flushCap(OWNER_B, b);
  const failed = [left, right].filter(item => item.failed.length === 1);
  const synced = [left, right].filter(item => item.failed.length === 0);
  assert.equal(failed.length, 1);
  assert.equal(synced.length, 1);
  assert.equal(failed[0].failed[0].message, OVER);
  assert.equal(String(failed[0].failed[0].message) === REFUSED, false);
  assert.equal((await drawnOf(advance.id)) <= 100000, true);
});

testSeq('E9 reversing an orphan settle on a dead advance is accepted', async () => {
  await seed();
  const advance = await putAdvance(100000);
  const measurement = await putMeasurement();
  const op = settle(measurement, advance.id, 40000);
  await allow(sendCapped(OWNER_A, op, advance, 40000));
  const dead = remoteRev({ id: advance.id, purpose: 'advanceLabor', amount: advance.amount });
  await allow(send(OWNER_A, 'accountTxns', dead.id, dead));
  const back = localRev(op, OWNER_A);
  const result = await flushCap(OWNER_A, back);
  assert.equal(result.failed.length, 0);
  assert.equal(await drawnOf(advance.id), 0);
});

testSeq('E10 a deduct reversal is not a capped draw and clears the block', async () => {
  await seed();
  const measurement = await putMeasurement();
  const approvalId = 'appr_' + measurement;
  const deductId = 'd1' + approvalId;
  const deduct = {
    id: deductId, kind: 'body', purpose: 'deduct', projectId: P1, partyId: PARTY, ledger: 'labor',
    currency: 'IQD', fxRate: 1, amount: 50000, cumAmount: 50000, targetId: approvalId,
  };
  await allow(send(OWNER_A, 'accountTxns', deduct.id, deduct));
  await allow(send(OWNER_A, 'accountTxns', 'appr_' + deductId, {
    id: 'appr_' + deductId, kind: 'appr', purpose: 'approveDeduct', projectId: P1, partyId: PARTY, ledger: 'labor',
    currency: 'IQD', fxRate: 1, targetId: deductId,
  }));
  const mark = (await getDoc(doc(db(OWNER_A), 'accountTxns', approvalId))).data();
  const revApproval = remoteRev({ id: approvalId, purpose: 'approveLabor', amount: mark.amount, agreementId: mark.agreementId });
  revApproval.createdBy = OWNER_B;
  revApproval.deviceId = 'device-' + OWNER_B;
  await allow(send(OWNER_B, 'accountTxns', revApproval.id, revApproval));
  const revDeduct = remoteRev(deduct);
  await allow(send(OWNER_A, 'accountTxns', revDeduct.id, revDeduct));
  assert.equal((await getDoc(doc(db(OWNER_A), 'advanceCaps', measurement))).exists(), false);
});
