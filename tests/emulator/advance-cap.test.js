// Server cap on draws against one advance. Emulator only.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const {
  doc, getDoc, setDoc, deleteDoc, serverTimestamp, writeBatch,
  getDocFromServer, getDocsFromServer, collection, query, where, runTransaction,
} = require('firebase/firestore');
const Sync = require('../../public/sync.js');
const Accounts = require('../../public/accounts.js');

const PROJECT_ID = 'ahl-aljazeera-accounting';
const OWNER_A = 'owner-a';
const OWNER_B = 'owner-b';
const SITE = 'site-1';
const PARTY = 'party-1';
const P1 = 'p1';
const OVER = 'المُرجَع والتسوية أكبر من السلفة';
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

function testSeq(name, fn, timeout) {
  test(name, { timeout: timeout || 60000 }, async () => {
    const prev = chain;
    let release;
    chain = new Promise(r => { release = r; });
    await prev;
    try { await fn(); }
    finally { release(); }
  });
}
function uuid(n) {
  return 'bbbbbbbb-cccc-dddd-eeee-' + n.toString(16).padStart(12, '0');
}
const names = new Map();
function aid(name) {
  if (!names.has(name)) {
    seq += 1;
    names.set(name, uuid(1000 + seq));
  }
  return names.get(name);
}

test.before(async () => {
  const host = localHost('FIRESTORE_EMULATOR_HOST');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES, host: host.host, port: host.port },
  });
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
const allow = p => assertSucceeds(p);
const deny = p => assertFails(p);

async function seed() {
  await testEnv.clearFirestore();
  contexts.clear();
  names.clear();
  seq = 0;
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    const user = (uid, role) => ({
      displayName: uid, email: uid + '@example.invalid', role: role || 'owner', active: true,
      assignedProjectIds: role === 'site' ? [P1] : [], createdAtServer: new Date(), createdBy: OWNER_A,
    });
    await setDoc(doc(d, 'users', OWNER_A), user(OWNER_A));
    await setDoc(doc(d, 'users', OWNER_B), user(OWNER_B));
    await setDoc(doc(d, 'users', SITE), user(SITE, 'site'));
    await setDoc(doc(d, 'projects', P1), {
      id: P1, name: 'School', clientName: 'Client', location: 'Here', currency: 'IQD', status: 'active',
      createdAtDevice: 1, createdAtServer: new Date(), createdBy: OWNER_A, deviceId: 'admin',
    });
    await setDoc(doc(d, 'parties', PARTY), { id: PARTY, name: 'Kareem', createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin' });
  });
}
async function adminSet(col, id, data) {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), col, id), data);
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
async function putAdvance(name, amount) {
  const id = aid(name);
  const advance = cash(id, 'advanceLabor', amount);
  await allow(send(OWNER_A, 'accountTxns', id, advance));
  return advance;
}
function localReturn(id, advanceId, amount, uid) {
  return {
    id, docType: 'accountTxn', kind: 'body', purpose: 'returnAdvance', amount, targetId: advanceId,
    projectId: P1, partyId: PARTY, ledger: 'labor', currency: 'IQD', fxRate: 1,
    createdBy: uid, deviceId: 'device-' + uid,
  };
}
function localRev(original, uid) {
  return {
    id: 'rev_' + original.id, docType: 'accountTxn', kind: 'rev', purpose: original.purpose, ledger: 'labor',
    projectId: P1, partyId: PARTY, currency: 'IQD', fxRate: 1, amount: original.amount,
    reversesId: original.id, reversalReason: 'عكس', createdBy: uid, deviceId: 'device-' + uid,
  };
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
  context.get = (k, d) => (context.cache[k] === undefined ? d : JSON.parse(JSON.stringify(context.cache[k])));
  context.set = (k, v) => { context.cache[k] = JSON.parse(JSON.stringify(v)); };
  vm.createContext(context);
  for (const file of ['ledger.js', 'sync.js', 'sync-status.js', 'firebase-client.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../public', file), 'utf8'), context, { filename: file });
  }
  return context;
}

async function writeThroughCap(uid, local, hooks) {
  const context = capClient();
  context.set(context.K.accountTxns, hooks && hooks.locals ? hooks.locals : []);
  const firestore = db(uid);
  const attempts = { n: 0 };
  const fsMod = {
    memoryLocalCache() { return {}; },
    initializeFirestore() { return firestore; },
    getFirestore() { return firestore; },
    connectFirestoreEmulator() {},
    clearIndexedDbPersistence() { return Promise.resolve(); },
    terminate() { return Promise.resolve(); },
    serverTimestamp, doc, getDoc, getDocsFromServer, collection, query, where, setDoc,
    getDocFromServer(ref) {
      const path = ref && typeof ref.path === 'string' ? ref.path : '';
      if (hooks && hooks.onReread && path.indexOf('advanceCaps/') === 0) {
        hooks.capReads = (hooks.capReads || 0) + 1;
        if (hooks.capReads === 2) return Promise.resolve(hooks.onReread()).then(() => getDocFromServer(ref));
      }
      return getDocFromServer(ref);
    },
    updateDoc() { return Promise.resolve(); },
    Timestamp: { fromMillis(n) { return n; } },
    runTransaction(database, update) {
      attempts.n += 1;
      const attempt = attempts.n;
      return runTransaction(database, async tx => {
        const wrapped = {
          get(ref) { return tx.get(ref); },
          set(ref, data) {
            const host = hostify(data);
            if (hooks && hooks.onSet) hooks.onSet(ref, host, attempt);
            return tx.set(ref, host);
          },
        };
        await update(wrapped);
        // A stale attempt reads, queues nothing that commits, then the rules-shaped denial
        // is raised here so the other phone can commit before the re-read. Holding the
        // transaction open deadlocks the emulator.
        if (hooks && hooks.failFirst && attempt === 1) {
          throw Object.assign(new Error('stale'), { code: 'permission-denied' });
        }
      });
    },
  };
  const real = await context.createFirebaseClient({
    initializeApp() { return { name: 'cap-' + uid + '-' + seq }; },
    deleteApp() { return Promise.resolve(); },
    getApps() { return []; },
    authMod: {
      getAuth() { return { authStateReady() { return Promise.resolve(); }, currentUser: { uid } }; },
      connectAuthEmulator() {},
      signOut() { return Promise.resolve(); },
    },
    fsMod,
  }, context.fbGeneration);
  if (!real || !real.writeLocal) throw new Error('capped writer was not created');
  if (hooks) hooks.attempts = attempts;
  await real.writeLocal(local);
}

async function flushCap(uid, local, hooks) {
  return Sync.flushOutbox({
    ids: [local.id],
    load: () => local,
    write: async () => { await writeThroughCap(uid, local, hooks); },
    readDependency: async id => {
      const snap = await getDoc(doc(db(uid), 'accountTxns', id));
      return snap.exists() ? { status: 'found', doc: snap.data() } : { status: 'missing' };
    },
  });
}

testSeq('C1 a return and its counter commit together', async () => {
  await seed();
  const advance = await putAdvance('adv', 100000);
  const back = cash(uuid(2), 'returnAdvance', 60000, { targetId: aid('adv') });
  await allow(sendCapped(OWNER_A, back, advance, 60000));
  assert.equal(await drawnOf(aid('adv')), 60000);
});

testSeq('C2 an over-cap return is rejected and nothing is written', async () => {
  await seed();
  const advance = await putAdvance('adv', 100000);
  const first = cash(uuid(2), 'returnAdvance', 60000, { targetId: aid('adv') });
  await allow(sendCapped(OWNER_A, first, advance, 60000));
  const second = cash(uuid(3), 'returnAdvance', 50000, { targetId: aid('adv') });
  await deny(sendCapped(OWNER_A, second, advance, 110000));
  assert.equal((await getDoc(doc(db(OWNER_A), 'accountTxns', second.id))).exists(), false);
  assert.equal(await drawnOf(aid('adv')), 60000);
});

testSeq('C3 an op alone and a counter alone are both denied', async () => {
  await seed();
  const advance = await putAdvance('adv', 100000);
  const back = cash(uuid(2), 'returnAdvance', 1000, { targetId: aid('adv') });
  await deny(send(OWNER_A, 'accountTxns', back.id, back));
  await deny(setDoc(doc(db(OWNER_A), 'advanceCaps', aid('adv')), capFields(advance, back.id, 1000, OWNER_A)));
  const stl = {
    id: 'stl_' + uuid(11) + '_1', kind: 'stl', purpose: 'settle', projectId: P1, partyId: PARTY,
    ledger: 'labor', currency: 'IQD', fxRate: 1, amount: 1000, targetId: uuid(11), settlesId: aid('adv'),
  };
  await deny(send(OWNER_A, 'accountTxns', stl.id, stl));
  const agreement = uuid(20);
  await allow(send(OWNER_A, 'agreements', agreement, {
    id: agreement, partyId: PARTY, projectId: P1, method: 'unit', description: 'bricks', currency: 'IQD',
    unitRate: 300000, unitQty: 4000, unitName: 'brick',
  }));
  const body = {
    id: uuid(21), kind: 'body', purpose: 'laborQty', projectId: P1, partyId: PARTY, agreementId: agreement,
    ledger: 'labor', currency: 'IQD', fxRate: 1, qty: 8000,
  };
  await allow(send(OWNER_A, 'accountTxns', body.id, body));
  await allow(send(OWNER_A, 'accountTxns', 'appr_' + body.id, {
    id: 'appr_' + body.id, kind: 'appr', purpose: 'approveLabor', projectId: P1, partyId: PARTY, agreementId: agreement,
    ledger: 'labor', currency: 'IQD', fxRate: 1, targetId: body.id, amount: 600000, qty: 8000,
  }));
  const live = {
    id: 'stl_' + body.id + '_1', kind: 'stl', purpose: 'settle', projectId: P1, partyId: PARTY, ledger: 'labor',
    currency: 'IQD', fxRate: 1, amount: 1000, targetId: body.id, settlesId: advance.id,
  };
  await deny(send(OWNER_A, 'accountTxns', live.id, live));
  assert.equal(await drawnOf(aid('adv')), null);
  await allow(sendCapped(OWNER_A, live, advance, 1000));
  assert.equal(await drawnOf(aid('adv')), 1000);
});

testSeq('C4 a counter cannot bind an existing op, another advance, or the wrong delta', async () => {
  await seed();
  const advance = await putAdvance('adv', 100000);
  const other = await putAdvance('adv2', 100000);
  const back = cash(uuid(2), 'returnAdvance', 1000, { targetId: aid('adv') });
  await allow(sendCapped(OWNER_A, back, advance, 1000));
  await deny(setDoc(doc(db(OWNER_A), 'advanceCaps', aid('adv')), capFields(advance, back.id, 2000, OWNER_A)));
  const again = cash(uuid(3), 'returnAdvance', 1000, { targetId: aid('adv') });
  const elsewhere = cash(uuid(4), 'returnAdvance', 1000, { targetId: aid('adv2') });
  await deny(sendCapped(OWNER_A, elsewhere, advance, 2000));
  await deny(sendCapped(OWNER_A, again, advance, 1000));
  await deny(sendCapped(OWNER_A, again, advance, 3000));
  assert.equal(await drawnOf(aid('adv')), 1000);
  assert.equal(await drawnOf(aid('adv2')), null);
  assert.equal(other.id, aid('adv2'));
});

testSeq('C5 frozen fields, delete, and a site read are denied', async () => {
  await seed();
  const advance = await putAdvance('adv', 100000);
  const back = cash(uuid(2), 'returnAdvance', 1000, { targetId: aid('adv') });
  await allow(sendCapped(OWNER_A, back, advance, 1000));
  const next = cash(uuid(3), 'returnAdvance', 1000, { targetId: aid('adv') });
  const base = capFields(advance, next.id, 2000, OWNER_A);
  const fsdb = db(OWNER_A);
  const batchOf = over => {
    const batch = writeBatch(fsdb);
    batch.set(doc(fsdb, 'accountTxns', next.id), row(OWNER_A, next));
    batch.set(doc(fsdb, 'advanceCaps', aid('adv')), Object.assign({}, base, over));
    return batch.commit();
  };
  await deny(batchOf({ cap: 1 }));
  await deny(batchOf({ partyId: 'other' }));
  await deny(batchOf({ projectId: 'p2' }));
  await deny(batchOf({ currency: 'USD' }));
  await deny(deleteDoc(doc(db(OWNER_A), 'advanceCaps', aid('adv'))));
  await deny(getDoc(doc(db(SITE), 'advanceCaps', aid('adv'))));
  assert.equal(await drawnOf(aid('adv')), 1000);
});

testSeq('C6 two batches from the same counter: exactly one lands', async () => {
  await seed();
  const advance = await putAdvance('adv', 100000);
  await adminSet('advanceCaps', aid('adv'), Object.assign(capFields(advance, 'seed', 0, OWNER_A), { updatedAtServer: new Date() }));
  const a = cash(uuid(2), 'returnAdvance', 60000, { targetId: aid('adv') });
  const b = cash(uuid(3), 'returnAdvance', 50000, { targetId: aid('adv') });
  const [ra, rb] = await Promise.allSettled([
    sendCapped(OWNER_A, a, advance, 60000),
    sendCapped(OWNER_B, b, advance, 50000),
  ]);
  const won = [ra, rb].filter(item => item.status === 'fulfilled').length;
  assert.equal(won, 1);
  const drawn = await drawnOf(aid('adv'));
  assert.equal(drawn === 60000 || drawn === 50000, true);
});

testSeq('C7 two phones: exactly one return syncs and the other is a true over-cap', async () => {
  await seed();
  for (let n = 0; n < 10; n += 1) {
    const advance = await putAdvance('round-' + n, 100000);
    const id = advance.id;
    const a = localReturn(uuid(100 + n), id, 60000, OWNER_A);
    const b = localReturn(uuid(200 + n), id, 50000, OWNER_B);
    const [ra, rb] = await Promise.all([flushCap(OWNER_A, a), flushCap(OWNER_B, b)]);
    const synced = [ra, rb].filter(item => item.synced.length === 1);
    const failed = [ra, rb].filter(item => item.failed.length === 1);
    assert.equal(synced.length, 1, 'round ' + n);
    assert.equal(failed.length, 1, 'round ' + n);
    assert.equal(synced.length + failed.length, 2);
    assert.equal(failed[0].failed[0].message, OVER);
    const drawn = await drawnOf(id);
    assert.equal(drawn === 60000 || drawn === 50000, true, 'round ' + n + ' drawn ' + drawn);
    assert.equal(drawn <= 100000, true);
  }
}, 180000);

testSeq('C8 a gated stale read retries and both returns fit', async () => {
  await seed();
  await putAdvance('adv', 100000);
  const a = localReturn(uuid(2), aid('adv'), 40000, OWNER_A);
  const b = localReturn(uuid(3), aid('adv'), 40000, OWNER_B);
  let other = null;
  const hooks = {
    failFirst: true,
    onReread: async () => { other = await flushCap(OWNER_B, b); },
  };
  const first = await flushCap(OWNER_A, a, hooks);
  assert.equal(other.synced.length, 1);
  assert.equal(first.synced.length, 1);
  assert.equal(await drawnOf(aid('adv')), 80000);
  assert.equal(hooks.attempts.n, 2);
});

testSeq('C9 a reversal frees capacity and a reversal without a counter is denied', async () => {
  await seed();
  const advance = await putAdvance('adv', 100000);
  const first = cash(uuid(2), 'returnAdvance', 100000, { targetId: aid('adv') });
  await allow(sendCapped(OWNER_A, first, advance, 100000));
  const tiny = cash(uuid(3), 'returnAdvance', 1, { targetId: aid('adv') });
  await deny(sendCapped(OWNER_A, tiny, advance, 100001));
  const rev = {
    id: 'rev_' + first.id, kind: 'rev', purpose: 'returnAdvance', ledger: 'labor', projectId: P1, partyId: PARTY,
    currency: 'IQD', fxRate: 1, amount: 100000, reversesId: first.id, reversalReason: 'عكس',
  };
  await deny(send(OWNER_A, 'accountTxns', rev.id, rev));
  assert.equal(await drawnOf(aid('adv')), 100000);
  await allow(sendCapped(OWNER_A, rev, advance, 0));
  assert.equal(await drawnOf(aid('adv')), 0);
  const again = cash(uuid(4), 'returnAdvance', 100000, { targetId: aid('adv') });
  await allow(sendCapped(OWNER_A, again, advance, 100000));
  assert.equal(await drawnOf(aid('adv')), 100000);
});

testSeq('C10 a legacy advance seeds from its live draws', async () => {
  await seed();
  await putAdvance('adv', 100000);
  await adminSet('accountTxns', 'old-ret', Object.assign(cash('old-ret', 'returnAdvance', 30000, { targetId: aid('adv') }), {
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  }));
  await adminSet('accountTxns', 'old-stl', {
    id: 'old-stl', kind: 'stl', purpose: 'settle', projectId: P1, partyId: PARTY, ledger: 'labor',
    currency: 'IQD', fxRate: 1, amount: 20000, targetId: 'meas', settlesId: aid('adv'),
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  });
  await adminSet('accountTxns', 'old-rev', Object.assign(cash('old-rev', 'returnAdvance', 10000, { targetId: aid('adv') }), {
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  }));
  await adminSet('accountTxns', 'rev_old-rev', {
    id: 'rev_old-rev', kind: 'rev', purpose: 'returnAdvance', ledger: 'labor', projectId: P1, partyId: PARTY,
    currency: 'IQD', fxRate: 1, amount: 10000, reversesId: 'old-rev', reversalReason: 'عكس',
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  });
  const back = localReturn(uuid(2), aid('adv'), 40000, OWNER_A);
  const result = await flushCap(OWNER_A, back);
  assert.deepEqual(result.synced, [back.id]);
  assert.equal(await drawnOf(aid('adv')), 90000);
  const more = localReturn(uuid(3), aid('adv'), 20000, OWNER_A);
  const refused = await flushCap(OWNER_A, more);
  assert.equal(refused.failed[0].message, OVER);
  assert.equal(await drawnOf(aid('adv')), 90000);
});

testSeq('C11 a legacy over-limit advance refuses a new return and a reversal seeds under the cap', async () => {
  await seed();
  await putAdvance('adv', 100000);
  await adminSet('accountTxns', 'big', Object.assign(cash('big', 'returnAdvance', 90000, { targetId: aid('adv') }), {
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  }));
  await adminSet('accountTxns', 'mid', Object.assign(cash('mid', 'returnAdvance', 30000, { targetId: aid('adv') }), {
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  }));
  const tiny = await flushCap(OWNER_A, localReturn(uuid(2), aid('adv'), 1, OWNER_A));
  assert.equal(tiny.failed[0].message, OVER);
  assert.equal(await drawnOf(aid('adv')), null);
  const rev = localRev({ id: 'mid', purpose: 'returnAdvance', amount: 30000 }, OWNER_A);
  const freed = await flushCap(OWNER_A, rev, { locals: [{ id: 'mid', kind: 'body', purpose: 'returnAdvance', targetId: aid('adv'), amount: 30000 }] });
  assert.deepEqual(freed.synced, [rev.id]);
  assert.equal(await drawnOf(aid('adv')), 90000);
});

testSeq('C12 two first seeds on one legacy advance both commit at the true sum', async () => {
  await seed();
  await putAdvance('adv', 100000);
  await adminSet('accountTxns', 'old', Object.assign(cash('old', 'returnAdvance', 10000, { targetId: aid('adv') }), {
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  }));
  const a = localReturn(uuid(2), aid('adv'), 20000, OWNER_A);
  const b = localReturn(uuid(3), aid('adv'), 30000, OWNER_B);
  const [ra, rb] = await Promise.all([flushCap(OWNER_A, a), flushCap(OWNER_B, b)]);
  assert.equal(ra.synced.length + rb.synced.length, 2);
  assert.equal(await drawnOf(aid('adv')), 60000);
});

testSeq('C13 a generation-2 settle on a legacy advance with no counter is allowed', async () => {
  await seed();
  const agreement = uuid(1);
  await allow(send(OWNER_A, 'agreements', agreement, {
    id: agreement, partyId: PARTY, projectId: P1, method: 'unit', description: 'bricks', currency: 'IQD',
    unitRate: 300000, unitQty: 4000, unitName: 'brick',
  }));
  const body = {
    id: uuid(11), kind: 'body', purpose: 'laborQty', projectId: P1, partyId: PARTY, agreementId: agreement,
    ledger: 'labor', currency: 'IQD', fxRate: 1, qty: 8000,
  };
  await allow(send(OWNER_A, 'accountTxns', body.id, body));
  const mark = {
    id: 'appr_' + body.id, kind: 'appr', purpose: 'approveLabor', projectId: P1, partyId: PARTY, agreementId: agreement,
    ledger: 'labor', currency: 'IQD', fxRate: 1, targetId: body.id, amount: 600000, qty: 8000,
  };
  await allow(send(OWNER_A, 'accountTxns', mark.id, mark));
  const advance = await putAdvance('adv', 100000);
  const first = {
    id: 'stl_' + body.id + '_1', kind: 'stl', purpose: 'settle', projectId: P1, partyId: PARTY, ledger: 'labor',
    currency: 'IQD', fxRate: 1, amount: 1000, targetId: body.id, settlesId: aid('adv'),
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  };
  const rev = {
    id: 'rev_' + first.id, kind: 'rev', purpose: 'settle', ledger: 'labor', projectId: P1, partyId: PARTY,
    currency: 'IQD', fxRate: 1, amount: 1000, reversesId: first.id, reversalReason: 'عكس',
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  };
  await adminSet('accountTxns', first.id, first);
  await adminSet('accountTxns', rev.id, rev);
  const second = {
    id: 'stl_' + body.id + '_2', docType: 'accountTxn', kind: 'stl', purpose: 'settle', projectId: P1, partyId: PARTY,
    ledger: 'labor', currency: 'IQD', fxRate: 1, amount: 1000, targetId: body.id, settlesId: aid('adv'),
    createdBy: OWNER_A, deviceId: 'device-' + OWNER_A,
  };
  const seeded = await flushCap(OWNER_A, second, { locals: [first] });
  assert.deepEqual(seeded.synced, [second.id]);
  assert.equal(await drawnOf(aid('adv')), 1000);

  const advance2 = await putAdvance('adv2', 100000);
  const body2 = Object.assign({}, body, { id: uuid(12) });
  await allow(send(OWNER_A, 'accountTxns', body2.id, body2));
  const mark2 = Object.assign({}, mark, { id: 'appr_' + body2.id, targetId: body2.id });
  await allow(send(OWNER_A, 'accountTxns', mark2.id, mark2));
  const gen1 = Object.assign({}, second, { id: 'stl_' + body2.id + '_1', targetId: body2.id, settlesId: aid('adv2') });
  delete gen1.docType;
  await allow(sendCapped(OWNER_A, gen1, advance2, 1000));
  const gen2 = Object.assign({}, gen1, { id: 'stl_' + body2.id + '_2' });
  await deny(send(OWNER_A, 'accountTxns', gen2.id, gen2));
  const rev1 = {
    id: 'rev_' + gen1.id, kind: 'rev', purpose: 'settle', ledger: 'labor', projectId: P1, partyId: PARTY,
    currency: 'IQD', fxRate: 1, amount: 1000, reversesId: gen1.id, reversalReason: 'عكس',
  };
  await allow(sendCapped(OWNER_A, rev1, advance2, 0));
  await allow(sendCapped(OWNER_A, gen2, advance2, 1000));
  assert.equal(await drawnOf(aid('adv2')), 1000);
  assert.equal(advance.amount, 100000);
});

testSeq('C14 a rev_ of a revw_ does not move the counter', async () => {
  await seed();
  const advance = await putAdvance('adv', 100000);
  const back = cash(uuid(2), 'returnAdvance', 1000, { targetId: aid('adv') });
  await allow(sendCapped(OWNER_A, back, advance, 1000));
  const mark = {
    id: 'revw_' + back.id, kind: 'revw', purpose: 'returnAdvance', ledger: 'labor', projectId: P1, partyId: PARTY,
    currency: 'IQD', fxRate: 1, targetId: back.id,
  };
  await allow(send(OWNER_A, 'accountTxns', mark.id, mark));
  const rev = {
    id: 'rev_' + mark.id, kind: 'rev', purpose: 'returnAdvance', ledger: 'labor', projectId: P1, partyId: PARTY,
    currency: 'IQD', fxRate: 1, reversesId: mark.id, reversalReason: 'عكس',
  };
  await allow(send(OWNER_A, 'accountTxns', rev.id, rev));
  assert.equal(await drawnOf(aid('adv')), 1000);
  const back2 = cash(uuid(3), 'returnAdvance', 1000, { targetId: aid('adv') });
  await allow(sendCapped(OWNER_A, back2, advance, 2000));
  const mark2 = Object.assign({}, mark, { id: 'revw_' + back2.id, targetId: back2.id });
  await allow(send(OWNER_A, 'accountTxns', mark2.id, mark2));
  const rev2 = Object.assign({}, rev, { id: 'rev_' + mark2.id, reversesId: mark2.id });
  await deny(sendCapped(OWNER_A, rev2, advance, 1000));
  assert.equal(await drawnOf(aid('adv')), 2000);
  assert.equal((await getDoc(doc(db(OWNER_A), 'accountTxns', rev2.id))).exists(), false);
});

testSeq('C15 an offline return fails closed when the other phone took the room', async () => {
  await seed();
  await putAdvance('adv', 100000);
  const queued = localReturn(uuid(2), aid('adv'), 70000, OWNER_A);
  const online = localReturn(uuid(3), aid('adv'), 50000, OWNER_B);
  const landed = await flushCap(OWNER_B, online);
  assert.deepEqual(landed.synced, [online.id]);
  const replay = await flushCap(OWNER_A, queued);
  assert.equal(replay.failed[0].message, OVER);
  assert.equal(await drawnOf(aid('adv')), 50000);
  const docs = [
    { id: aid('adv'), purpose: 'advanceLabor', amount: 100000, kind: 'body', ledger: 'labor' },
    { id: online.id, purpose: 'returnAdvance', amount: 50000, targetId: aid('adv'), kind: 'body', ledger: 'labor' },
    { id: queued.id, purpose: 'returnAdvance', amount: 70000, targetId: aid('adv'), kind: 'body', ledger: 'labor' },
  ];
  const excluded = Accounts.balances(/** @type {any} */ (docs), { syncErrors: { [queued.id]: OVER } });
  const included = Accounts.balances(/** @type {any} */ (docs), {});
  assert.equal(excluded.cashReturned, 50000);
  assert.equal(included.cashReturned, 120000);

  await seed();
  await putAdvance('adv', 100000);
  const room = await flushCap(OWNER_B, localReturn(uuid(4), aid('adv'), 50000, OWNER_B));
  assert.equal(room.synced.length, 1);
  const smaller = await flushCap(OWNER_A, localReturn(uuid(5), aid('adv'), 40000, OWNER_A));
  assert.deepEqual(smaller.synced, [smaller.synced[0]]);
  assert.equal(await drawnOf(aid('adv')), 90000);
});

testSeq('C16 and C16b a re-send is adopted, including when the counter is at the cap', async () => {
  await seed();
  await putAdvance('adv', 100000);
  const back = localReturn(uuid(2), aid('adv'), 1000, OWNER_A);
  assert.deepEqual((await flushCap(OWNER_A, back)).synced, [back.id]);
  const sets = [];
  const again = await flushCap(OWNER_A, back, { onSet: ref => sets.push(ref.id) });
  assert.deepEqual(again.synced, [back.id]);
  assert.equal(again.failed.length, 0);
  assert.equal(sets.length, 0);
  assert.equal(await drawnOf(aid('adv')), 1000);

  await putAdvance('full', 100000);
  const fill = localReturn(uuid(3), aid('full'), 100000, OWNER_A);
  assert.deepEqual((await flushCap(OWNER_A, fill)).synced, [fill.id]);
  const capSets = [];
  const resent = await flushCap(OWNER_A, fill, { onSet: ref => capSets.push(ref.id) });
  assert.deepEqual(resent.synced, [fill.id]);
  assert.equal(resent.failed.length, 0);
  assert.equal(capSets.length, 0);
  assert.equal(await drawnOf(aid('full')), 100000);
});

testSeq('C17 and C17b linkRefusals runs through the capped writer, even at the cap', async () => {
  await seed();
  const agreement = uuid(1);
  await allow(send(OWNER_A, 'agreements', agreement, {
    id: agreement, partyId: PARTY, projectId: P1, method: 'unit', description: 'bricks', currency: 'IQD',
    unitRate: 300000, unitQty: 4000, unitName: 'brick',
  }));
  const body = {
    id: uuid(11), kind: 'body', purpose: 'laborQty', projectId: P1, partyId: PARTY, agreementId: agreement,
    ledger: 'labor', currency: 'IQD', fxRate: 1, qty: 8000,
  };
  await allow(send(OWNER_A, 'accountTxns', body.id, body));
  await allow(send(OWNER_A, 'accountTxns', 'appr_' + body.id, {
    id: 'appr_' + body.id, kind: 'appr', purpose: 'approveLabor', projectId: P1, partyId: PARTY, agreementId: agreement,
    ledger: 'labor', currency: 'IQD', fxRate: 1, targetId: body.id, amount: 600000, qty: 8000,
  }));
  const winnerAdv = await putAdvance('adv-a', 100000);
  const loserAdv = await putAdvance('adv-b', 100000);
  /** @type {any} */
  const stl = {
    id: 'stl_' + body.id + '_1', docType: 'accountTxn', kind: 'stl', purpose: 'settle', projectId: P1, partyId: PARTY,
    ledger: 'labor', currency: 'IQD', fxRate: 1, amount: 1000, targetId: body.id, settlesId: aid('adv-a'),
    createdBy: OWNER_A, deviceId: 'device-' + OWNER_A,
  };
  assert.deepEqual((await flushCap(OWNER_A, stl)).synced, [stl.id]);
  const loser = Object.assign({}, stl, { settlesId: aid('adv-b'), amount: 500, createdBy: OWNER_B, deviceId: 'device-' + OWNER_B });
  let minted = '';
  const result = await Sync.flushOutbox({
    ids: [stl.id],
    load: () => loser,
    write: async () => { await writeThroughCap(OWNER_B, /** @type {any} */ (loser)); },
    readDependency: async () => ({ status: 'found', doc: (await getDoc(doc(db(OWNER_B), 'accountTxns', stl.id))).data() }),
    mintId: () => { minted = 'minted-stl'; return minted; },
  });
  assert.equal(result.failed.length, 0);
  assert.equal(result.linkRefusals[0].localId, 'minted-stl');
  assert.equal(await drawnOf(aid('adv-b')), null);
  assert.equal(await drawnOf(aid('adv-a')), 1000);
  assert.equal(winnerAdv.amount, 100000);

  const full = await putAdvance('adv-full', 1000);
  await allow(sendCapped(OWNER_A, cash(uuid(30), 'returnAdvance', 1000, { targetId: aid('adv-full') }), full, 1000));
  const body2 = Object.assign({}, body, { id: uuid(12) });
  await allow(send(OWNER_A, 'accountTxns', body2.id, body2));
  await allow(send(OWNER_A, 'accountTxns', 'appr_' + body2.id, {
    id: 'appr_' + body2.id, kind: 'appr', purpose: 'approveLabor', projectId: P1, partyId: PARTY, agreementId: agreement,
    ledger: 'labor', currency: 'IQD', fxRate: 1, targetId: body2.id, amount: 600000, qty: 8000,
  }));
  const held = Object.assign({}, stl, {
    id: 'stl_' + body2.id + '_1', targetId: body2.id, settlesId: aid('adv-open'), amount: 100,
  });
  const open = await putAdvance('adv-open', 100000);
  assert.deepEqual((await flushCap(OWNER_A, held)).synced, [held.id]);
  const crowded = Object.assign({}, held, { settlesId: aid('adv-full'), amount: 1, createdBy: OWNER_B, deviceId: 'device-' + OWNER_B });
  const crowdedResult = await Sync.flushOutbox({
    ids: [held.id],
    load: () => crowded,
    write: async () => { await writeThroughCap(OWNER_B, /** @type {any} */ (crowded)); },
    readDependency: async () => ({ status: 'found', doc: (await getDoc(doc(db(OWNER_B), 'accountTxns', held.id))).data() }),
    mintId: () => 'minted-full',
  });
  assert.equal(crowdedResult.failed.length, 0);
  assert.equal(crowdedResult.linkRefusals[0].localId, 'minted-full');
  assert.equal(await drawnOf(aid('adv-full')), 1000);
  assert.equal(loserAdv.id, aid('adv-b'));
  assert.equal(open.id, aid('adv-open'));
});

testSeq('C18 a new draw on a reversed advance is denied', async () => {
  await seed();
  const advance = await putAdvance('adv', 100000);
  const back = cash(uuid(2), 'returnAdvance', 1000, { targetId: aid('adv') });
  await allow(sendCapped(OWNER_A, back, advance, 1000));
  const rev = {
    id: 'rev_' + aid('adv'), kind: 'rev', purpose: 'advanceLabor', ledger: 'labor', projectId: P1, partyId: PARTY,
    currency: 'IQD', fxRate: 1, amount: 100000, reversesId: aid('adv'), reversalReason: 'عكس',
  };
  await allow(send(OWNER_A, 'accountTxns', rev.id, rev));
  const more = cash(uuid(3), 'returnAdvance', 1, { targetId: aid('adv') });
  await deny(sendCapped(OWNER_A, more, advance, 1001));
  const client = await flushCap(OWNER_A, localReturn(uuid(4), aid('adv'), 1, OWNER_A));
  assert.equal(client.failed.length, 1);
  assert.equal(client.failed[0].message, 'رُفض الإرسال');
  assert.equal(await drawnOf(aid('adv')), 1000);
});

testSeq('C19 a reversal of a draw on an already reversed advance is allowed', async () => {
  await seed();
  const advance = await putAdvance('adv', 100000);
  const back = cash(uuid(2), 'returnAdvance', 40000, { targetId: aid('adv') });
  await allow(sendCapped(OWNER_A, back, advance, 40000));
  const revAdv = {
    id: 'rev_' + aid('adv'), kind: 'rev', purpose: 'advanceLabor', ledger: 'labor', projectId: P1, partyId: PARTY,
    currency: 'IQD', fxRate: 1, amount: 100000, reversesId: aid('adv'), reversalReason: 'عكس',
  };
  await allow(send(OWNER_A, 'accountTxns', revAdv.id, revAdv));
  const revBack = localRev(back, OWNER_A);
  const freed = await flushCap(OWNER_A, revBack, { locals: [back] });
  assert.deepEqual(freed.synced, [revBack.id]);
  assert.equal(await drawnOf(aid('adv')), 0);
  const blocked = await flushCap(OWNER_A, localReturn(uuid(5), aid('adv'), 1, OWNER_A));
  assert.equal(blocked.failed[0].message, 'رُفض الإرسال');

  await putAdvance('legacy', 100000);
  await adminSet('accountTxns', 'leg-ret', Object.assign(cash('leg-ret', 'returnAdvance', 40000, { targetId: aid('legacy') }), {
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  }));
  await adminSet('accountTxns', 'rev_' + aid('legacy'), {
    id: 'rev_' + aid('legacy'), kind: 'rev', purpose: 'advanceLabor', ledger: 'labor', projectId: P1, partyId: PARTY,
    currency: 'IQD', fxRate: 1, amount: 100000, reversesId: aid('legacy'), reversalReason: 'عكس',
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  });
  const revLegacy = localRev({ id: 'leg-ret', purpose: 'returnAdvance', amount: 40000 }, OWNER_A);
  const seeded = await flushCap(OWNER_A, revLegacy, {
    locals: [{ id: 'leg-ret', kind: 'body', purpose: 'returnAdvance', targetId: aid('legacy'), amount: 40000 }],
  });
  assert.deepEqual(seeded.synced, [revLegacy.id]);
  assert.equal(await drawnOf(aid('legacy')), 0);
});

testSeq('C20 a low counter still accepts a reversal and clamps at zero', async () => {
  await seed();
  await putAdvance('adv', 100000);
  await adminSet('accountTxns', 'wide', Object.assign(cash('wide', 'returnAdvance', 40000, { targetId: aid('adv') }), {
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  }));
  await adminSet('advanceCaps', aid('adv'), Object.assign(capFields({
    id: aid('adv'), partyId: PARTY, projectId: P1, currency: 'IQD', amount: 100000,
  }, 'seed', 10000, OWNER_A), { updatedAtServer: new Date() }));
  const rev = localRev({ id: 'wide', purpose: 'returnAdvance', amount: 40000 }, OWNER_A);
  const result = await flushCap(OWNER_A, rev, {
    locals: [{ id: 'wide', kind: 'body', purpose: 'returnAdvance', targetId: aid('adv'), amount: 40000 }],
  });
  assert.deepEqual(result.synced, [rev.id]);
  assert.equal(await drawnOf(aid('adv')), 0);
});

testSeq('C21 the first write on a dead advance with no counter may be a reversal', async () => {
  await seed();
  await putAdvance('adv', 100000);
  await adminSet('accountTxns', 'old', Object.assign(cash('old', 'returnAdvance', 30000, { targetId: aid('adv') }), {
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  }));
  await adminSet('accountTxns', 'rev_' + aid('adv'), {
    id: 'rev_' + aid('adv'), kind: 'rev', purpose: 'advanceLabor', ledger: 'labor', projectId: P1, partyId: PARTY,
    currency: 'IQD', fxRate: 1, amount: 100000, reversesId: aid('adv'), reversalReason: 'عكس',
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  });
  const rev = localRev({ id: 'old', purpose: 'returnAdvance', amount: 30000 }, OWNER_A);
  const result = await flushCap(OWNER_A, rev, {
    locals: [{ id: 'old', kind: 'body', purpose: 'returnAdvance', targetId: aid('adv'), amount: 30000 }],
  });
  assert.deepEqual(result.synced, [rev.id]);
  assert.equal(await drawnOf(aid('adv')), 0);
  const later = await flushCap(OWNER_A, localReturn(uuid(4), aid('adv'), 1, OWNER_A));
  assert.equal(later.failed[0].message, 'رُفض الإرسال');

  await putAdvance('twin', 100000);
  await adminSet('accountTxns', 'twin-old', Object.assign(cash('twin-old', 'returnAdvance', 30000, { targetId: aid('twin') }), {
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  }));
  await adminSet('accountTxns', 'rev_' + aid('twin'), {
    id: 'rev_' + aid('twin'), kind: 'rev', purpose: 'advanceLabor', ledger: 'labor', projectId: P1, partyId: PARTY,
    currency: 'IQD', fxRate: 1, amount: 100000, reversesId: aid('twin'), reversalReason: 'عكس',
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  });
  const raw = {
    id: 'rev_twin-old', kind: 'rev', purpose: 'returnAdvance', ledger: 'labor', projectId: P1, partyId: PARTY,
    currency: 'IQD', fxRate: 1, amount: 30000, reversesId: 'twin-old', reversalReason: 'عكس',
  };
  const twin = { id: aid('twin'), partyId: PARTY, projectId: P1, currency: 'IQD', amount: 100000 };
  await allow(sendCapped(OWNER_A, raw, twin, 0));
  assert.equal(await drawnOf(aid('twin')), 0);
  const after = cash(uuid(9), 'returnAdvance', 1, { targetId: aid('twin') });
  await deny(sendCapped(OWNER_A, after, twin, 1));
});

testSeq('C22 a stale over-cap read whose re-read moved is retried, not refused', async () => {
  await seed();
  await putAdvance('adv', 100000);
  const full = localReturn(uuid(2), aid('adv'), 100000, OWNER_A);
  const filled = await flushCap(OWNER_A, full);
  assert.deepEqual(filled.synced, [full.id]);
  assert.equal(await drawnOf(aid('adv')), 100000);
  const rev = localRev({ id: full.id, purpose: 'returnAdvance', amount: 100000 }, OWNER_A);
  let freed = null;
  const b = localReturn(uuid(3), aid('adv'), 30000, OWNER_B);
  const hooks = {
    onReread: async () => {
      freed = await flushCap(OWNER_A, rev, {
        locals: [{ id: full.id, kind: 'body', purpose: 'returnAdvance', targetId: aid('adv'), amount: 100000 }],
      });
    },
  };
  const result = await flushCap(OWNER_B, b, hooks);
  assert.deepEqual(freed.synced, [rev.id]);
  assert.equal(result.failed.length, 0, 'stale over refused: ' + JSON.stringify(result.failed));
  assert.deepEqual(result.synced, [b.id]);
  assert.equal(hooks.attempts.n, 2);
  assert.equal(await drawnOf(aid('adv')), 30000);
});
