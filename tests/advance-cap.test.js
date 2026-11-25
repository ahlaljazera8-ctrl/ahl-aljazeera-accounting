// Pure cap helpers, and the flush decisions writeCapped makes with a fake Firestore.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const Sync = /** @type {any} */ (require('../public/sync.js'));
const ROOT = path.join(__dirname, '..');
const OVER = 'المُرجَع والتسوية أكبر من السلفة';

function row(over) {
  return Object.assign({
    id: 'row-1', amount: 1000, partyId: 'person', projectId: 'job', currency: 'IQD',
    ledger: 'labor', fxRate: 1,
  }, over);
}
function advance(amount) {
  return {
    id: 'adv', kind: 'body', purpose: 'advanceLabor', amount: amount == null ? 100000 : amount,
    partyId: 'person', projectId: 'job', currency: 'IQD',
  };
}
function step(over) {
  return Sync.capStep(Object.assign({
    op: { opId: 'op-1', advanceId: 'adv', delta: 1000 },
    prev: null,
    advance: advance(),
    advanceLive: true,
    seed: 0,
  }, over));
}

test('U1 capOpOf names the advance and the signed amount, and ignores everything else', () => {
  const settle = row({ id: 'stl_m_1', kind: 'stl', purpose: 'settle', settlesId: 'adv', amount: 40000 });
  const back = row({ id: 'ret-1', kind: 'body', purpose: 'returnAdvance', targetId: 'adv', amount: 25000 });
  assert.deepEqual(Sync.capOpOf(settle, null), { opId: 'stl_m_1', advanceId: 'adv', delta: 40000 });
  assert.deepEqual(Sync.capOpOf(back, null), { opId: 'ret-1', advanceId: 'adv', delta: 25000 });
  const revSettle = row({ id: 'rev_stl_m_1', kind: 'rev', purpose: 'settle', amount: 40000, reversesId: settle.id });
  const revBack = row({ id: 'rev_ret-1', kind: 'rev', purpose: 'returnAdvance', amount: 25000, reversesId: back.id });
  assert.deepEqual(Sync.capOpOf(revSettle, settle), { opId: 'rev_stl_m_1', advanceId: 'adv', delta: -40000 });
  assert.deepEqual(Sync.capOpOf(revBack, back), { opId: 'rev_ret-1', advanceId: 'adv', delta: -25000 });

  const revw = row({ id: 'revw_ret-1', kind: 'revw', purpose: 'returnAdvance', targetId: 'ret-1' });
  const revOfRevw = row({ id: 'rev_revw_ret-1', kind: 'rev', purpose: 'returnAdvance', amount: 25000, reversesId: revw.id });
  assert.equal(Sync.capOpOf(revOfRevw, revw), null);
  assert.equal(Sync.capOpOf(revw, null), null);
  assert.equal(Sync.capOpOf(row({ id: 'pay', kind: 'body', purpose: 'payLabor' }), null), null);
  assert.equal(Sync.capOpOf(row({ id: 'refund', kind: 'body', purpose: 'refundLabor', targetId: 'pay' }), null), null);
  assert.equal(Sync.capOpOf(row({ id: 'ded', kind: 'body', purpose: 'deduct', targetId: 'appr' }), null), null);
  const adv = advance();
  const revAdv = row({ id: 'rev_adv', kind: 'rev', purpose: 'advanceLabor', amount: 100000, reversesId: 'adv' });
  assert.equal(Sync.capOpOf(revAdv, adv), null);
  assert.equal(Sync.capOpOf(adv, null), null);
});

test('U2 capStep allows the cap, clamps a reversal, and refuses a dead draw', () => {
  const exact = step({ op: { opId: 'r', advanceId: 'adv', delta: 100000 } });
  assert.equal(exact.ok, true);
  assert.equal(exact.cap.drawn, 100000);
  assert.equal(exact.cap.cap, 100000);
  assert.equal(exact.cap.partyId, 'person');
  assert.equal(exact.cap.projectId, 'job');
  assert.equal(exact.cap.currency, 'IQD');
  assert.equal(exact.cap.lastOpId, 'r');
  const over = step({ op: { opId: 'r', advanceId: 'adv', delta: 100001 } });
  assert.deepEqual(over, { ok: false, reason: 'over' });
  const dead = step({ op: { opId: 'r', advanceId: 'adv', delta: 1 }, advanceLive: false });
  assert.deepEqual(dead, { ok: false, reason: 'dead' });
  const prev = { advanceId: 'adv', partyId: 'person', projectId: 'job', currency: 'IQD', cap: 100000, drawn: 1000, lastOpId: 'old' };
  const clamped = step({ op: { opId: 'rev', advanceId: 'adv', delta: -5000 }, prev });
  assert.equal(clamped.ok, true);
  assert.equal(clamped.cap.drawn, 0);
  const deadRev = step({ op: { opId: 'rev', advanceId: 'adv', delta: -1000 }, prev, advanceLive: false });
  assert.equal(deadRev.ok, true);
  assert.equal(deadRev.cap.drawn, 0);
  const legacy = step({
    op: { opId: 'rev', advanceId: 'adv', delta: -30000 },
    prev: Object.assign({}, prev, { drawn: 120000 }),
  });
  assert.equal(legacy.ok, true);
  assert.equal(legacy.cap.drawn, 90000);
  assert.equal(legacy.cap.cap, 100000);
});

test('U3-U6 capSeed skips reversed draws, other advances, and revw rows', () => {
  const live = row({ id: 'ret-live', kind: 'body', purpose: 'returnAdvance', targetId: 'adv', amount: 30000 });
  const reversed = row({ id: 'ret-old', kind: 'body', purpose: 'returnAdvance', targetId: 'adv', amount: 10000 });
  const other = row({ id: 'ret-other', kind: 'body', purpose: 'returnAdvance', targetId: 'adv-2', amount: 70000 });
  const marked = row({ id: 'revw_ret-live', kind: 'revw', purpose: 'returnAdvance', targetId: 'adv' });
  const settle = row({ id: 'stl_m_1', kind: 'stl', purpose: 'settle', settlesId: 'adv', amount: 20000 });
  const draws = [live, reversed, other, marked, settle];
  assert.equal(Sync.capSeed('adv', draws, new Set(['ret-old'])), 50000);
  assert.equal(Sync.capSeed('adv', [other, marked], new Set()), 0);
  assert.equal(Sync.capSeed('adv', [], new Set()), 0);
});

test('capChanged retries only when the counter snapshot moved', () => {
  assert.equal(Sync.capChanged({ exists: true, lastOpId: 'a' }, { exists: true, lastOpId: 'a' }), false);
  assert.equal(Sync.capChanged({ exists: false, lastOpId: null }, { exists: false, lastOpId: null }), false);
  assert.equal(Sync.capChanged({ exists: true, lastOpId: 'a' }, { exists: true, lastOpId: 'b' }), true);
  assert.equal(Sync.capChanged({ exists: false, lastOpId: null }, { exists: true, lastOpId: 'b' }), true);
  assert.equal(Sync.CAP_COLLECTION, 'advanceCaps');
  assert.equal(Sync.CAP_TRIES, 3);
  assert.equal(Sync.CAP_OVER, OVER);
});

function loadBox() {
  /** @type {ReturnType<typeof setTimeout>[]} */
  const timers = [];
  const context = {
    console,
    setTimeout(fn, ms) { const id = setTimeout(fn, ms); timers.push(id); return id; },
    clearTimeout(id) { clearTimeout(id); },
    Map, Set, Object, Array, String, Number, Promise, Error, TypeError, URL, URLSearchParams,
    navigator: { onLine: true },
    sessionEpoch: 1,
    syncNotice: '',
    demoRole() { return ''; },
    $(sel) { return { hidden: sel === '#shell', textContent: '' }; },
    render() {},
    paintBell() {},
    holdSession() { return Promise.resolve(); },
    signOutPending() { return ''; },
    clearSignOutPending() {},
    withTimeout(p) { return Promise.resolve(p); },
    MISSING_PROFILE_MSG: 'missing',
    SUSPENDED_MSG: 'suspended',
    SESSION_DEAD_MSG: 'dead',
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
  context.FIREBASE_CONFIG = { apiKey: 'demo', projectId: 'ahl-aljazeera-accounting', authDomain: 'localhost' };
  context.get = (k, d) => (context.cache[k] === undefined ? d : JSON.parse(JSON.stringify(context.cache[k])));
  context.set = (k, v) => { context.cache[k] = JSON.parse(JSON.stringify(v)); };
  context.dropTimers = () => { while (timers.length) clearTimeout(timers.pop()); };
  vm.createContext(context);
  for (const file of ['ledger.js', 'sync.js', 'sync-status.js', 'firebase-client.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'public', file), 'utf8'), context, { filename: file });
  }
  return context;
}

function snap(exists, data) {
  const body = data || null;
  return { exists() { return exists; }, data() { return body; } };
}

function localReturn(amount) {
  return {
    id: 'ret-new', docType: 'accountTxn', kind: 'body', purpose: 'returnAdvance', amount,
    targetId: 'adv', projectId: 'job', partyId: 'person', ledger: 'labor', currency: 'IQD', fxRate: 1,
    createdBy: 'owner-a', deviceId: 'phone',
  };
}

/**
 * @param {{ run?: (state: any) => Promise<void>, counter?: any, advanceLive?: boolean, opExists?: boolean, draws?: any[] }} spec
 */
function fakeFs(spec) {
  const state = {
    attempts: 0,
    sets: 0,
    opGets: 0,
    thrown: /** @type {any} */ (null),
    counter: spec.counter || null,
    advanceLive: spec.advanceLive !== false,
    opExists: !!spec.opExists,
  };
  const advanceDoc = advance();
  const fsMod = {
    memoryLocalCache() { return {}; },
    initializeFirestore() { return {}; },
    getFirestore() { return {}; },
    connectFirestoreEmulator() {},
    clearIndexedDbPersistence() { return Promise.resolve(); },
    terminate() { return Promise.resolve(); },
    serverTimestamp() { return { serverTimestamp: true }; },
    doc(_db, col, id) { return { col, id: String(id) }; },
    collection() { return {}; },
    query(col) { return col; },
    where() { return {}; },
    getDocsFromServer() { return Promise.resolve({ docs: spec.draws || [] }); },
    getDocFromServer(ref) {
      if (ref.col === 'advanceCaps') return Promise.resolve(snap(!!state.counter, state.counter));
      if (ref.id === 'adv') return Promise.resolve(snap(true, advanceDoc));
      if (ref.id === 'rev_adv') return Promise.resolve(snap(!state.advanceLive, { id: 'rev_adv' }));
      if (state.opExists && ref.id === 'ret-new') return Promise.resolve(snap(true, localReturn(1)));
      return Promise.resolve(snap(false, null));
    },
    setDoc() { return Promise.resolve(); },
    updateDoc() { return Promise.resolve(); },
    Timestamp: { fromMillis(n) { return n; } },
    async runTransaction(_db, fn) {
      state.attempts += 1;
      const tx = {
        async get(ref) {
          if (ref.id === 'ret-new') {
            state.opGets += 1;
            return snap(state.opExists, state.opExists ? localReturn(1) : null);
          }
          if (ref.col === 'advanceCaps') return snap(!!state.counter, state.counter);
          if (ref.id === 'adv') return snap(true, advanceDoc);
          if (ref.id === 'rev_adv') return snap(!state.advanceLive, { id: 'rev_adv' });
          return snap(false, null);
        },
        set() { state.sets += 1; },
      };
      try {
        await fn(tx);
        if (spec.run) await spec.run(state);
      } catch (err) {
        state.thrown = err;
        throw err;
      }
    },
  };
  return { fsMod, state };
}

async function client(fsMod) {
  const context = loadBox();
  const user = { uid: 'owner-a', role: 'owner', active: true, displayName: 'Owner A' };
  context.set(context.K.sessionUser, user);
  const real = await context.createFirebaseClient({
    initializeApp() { return { name: '[DEFAULT]' }; },
    deleteApp() { return Promise.resolve(); },
    getApps() { return []; },
    authMod: {
      getAuth() { return { authStateReady() { return Promise.resolve(); }, currentUser: { uid: 'owner-a' } }; },
      connectAuthEmulator() {},
      signOut() { return Promise.resolve(); },
    },
    fsMod,
  }, context.fbGeneration);
  if (!real || !real.writeLocal) throw new Error('writeLocal missing');
  return { context, real };
}

async function flush(real, local, readDependency) {
  return Sync.flushOutbox({
    ids: [local.id],
    load: () => local,
    write: doc => real.writeLocal(doc),
    readDependency: readDependency || (async () => ({ status: 'missing' })),
  });
}

test('U7 an unavailable write and an exhausted cap retry both stay queued', async () => {
  const down = fakeFs({});
  down.fsMod.runTransaction = async () => {
    down.state.attempts += 1;
    throw { code: 'unavailable' };
  };
  const opened = await client(down.fsMod);
  const local = localReturn(70000);
  opened.context.set(opened.context.K.accountTxns, [local]);
  opened.context.set(opened.context.K.outbox, [local.id]);
  opened.context.ensureFirebase = () => Promise.resolve({
    writeLocal: doc => opened.real.writeLocal(doc),
    pull() { return Promise.resolve(); },
  });
  await opened.context.flushRemote({ fromOutside: true });
  assert.deepEqual(opened.context.get(opened.context.K.outbox, []), [local.id]);
  assert.equal(opened.context.get(opened.context.K.syncErrors, {})[local.id], undefined);
  assert.equal(opened.context.syncNotice, opened.context.SEND_RETRY);
  opened.context.dropTimers();

  const spinning = fakeFs({
    counter: { advanceId: 'adv', partyId: 'person', projectId: 'job', currency: 'IQD', cap: 100000, drawn: 0, lastOpId: 'old' },
  });
  spinning.fsMod.runTransaction = async (_db, fn) => {
    spinning.state.attempts += 1;
    const tx = {
      async get(ref) {
        if (ref.col === 'advanceCaps') return snap(true, spinning.state.counter);
        if (ref.id === 'adv') return snap(true, advance());
        if (ref.id === 'rev_adv') return snap(false, null);
        return snap(false, null);
      },
      set() { spinning.state.sets += 1; },
    };
    await fn(tx);
    spinning.state.counter = Object.assign({}, spinning.state.counter, { lastOpId: 'moved-' + spinning.state.attempts });
    throw Object.assign(new Error('denied'), { code: 'permission-denied' });
  };
  const second = await client(spinning.fsMod);
  const again = localReturn(1000);
  second.context.set(second.context.K.accountTxns, [again]);
  second.context.set(second.context.K.outbox, [again.id]);
  second.context.ensureFirebase = () => Promise.resolve({
    writeLocal: doc => second.real.writeLocal(doc),
    pull() { return Promise.resolve(); },
  });
  await second.context.flushRemote({ fromOutside: true });
  assert.equal(spinning.state.attempts, 3);
  assert.deepEqual(second.context.get(second.context.K.outbox, []), [again.id]);
  assert.equal(second.context.get(second.context.K.syncErrors, {})[again.id], undefined);
  assert.equal(second.context.syncNotice, second.context.SEND_RETRY);
  second.context.dropTimers();
});

test('U8 a changed counter is retried, a true over-cap is refused with the advance sentence, and a real denial is rethrown', async () => {
  const retry = fakeFs({
    counter: { advanceId: 'adv', partyId: 'person', projectId: 'job', currency: 'IQD', cap: 100000, drawn: 0, lastOpId: 'old' },
  });
  const originalRun = retry.fsMod.runTransaction;
  retry.fsMod.runTransaction = async (_db, fn) => {
    await originalRun(_db, fn);
    if (retry.state.attempts === 1) {
      retry.state.counter = Object.assign({}, retry.state.counter, { drawn: 1000, lastOpId: 'phone-b' });
      throw Object.assign(new Error('denied'), { code: 'permission-denied' });
    }
  };
  const box = await client(retry.fsMod);
  const local = localReturn(1000);
  const result = await flush(box.real, local);
  assert.deepEqual(result.synced, [local.id]);
  assert.equal(result.failed.length, 0);
  assert.equal(retry.state.attempts, 2);

  const stuck = fakeFs({
    counter: { advanceId: 'adv', partyId: 'person', projectId: 'job', currency: 'IQD', cap: 100000, drawn: 100000, lastOpId: 'full' },
  });
  const overBox = await client(stuck.fsMod);
  const over = await flush(overBox.real, localReturn(1));
  assert.equal(over.synced.length, 0);
  assert.equal(over.kept.length, 0);
  assert.equal(over.failed[0].message, OVER);
  assert.equal(over.failed[0].message, Sync.CAP_OVER);

  const dead = fakeFs({
    advanceLive: false,
    counter: { advanceId: 'adv', partyId: 'person', projectId: 'job', currency: 'IQD', cap: 100000, drawn: 0, lastOpId: 'old' },
  });
  const deadBox = await client(dead.fsMod);
  const deadResult = await flush(deadBox.real, localReturn(1));
  assert.equal(deadResult.failed[0].message, 'رُفض الإرسال');

  const denied = fakeFs({
    counter: { advanceId: 'adv', partyId: 'person', projectId: 'job', currency: 'IQD', cap: 100000, drawn: 0, lastOpId: 'same' },
  });
  denied.fsMod.runTransaction = async (_db, fn) => {
    denied.state.attempts += 1;
    const tx = {
      async get(ref) {
        if (ref.col === 'advanceCaps') return snap(true, denied.state.counter);
        if (ref.id === 'adv') return snap(true, advance());
        if (ref.id === 'rev_adv') return snap(false, null);
        return snap(false, null);
      },
      set() { denied.state.sets += 1; },
    };
    await fn(tx);
    throw Object.assign(new Error('denied'), { code: 'permission-denied' });
  };
  const reads = [];
  const denyBox = await client(denied.fsMod);
  const denyResult = await flush(denyBox.real, localReturn(1000), async id => {
    reads.push(id);
    return { status: 'missing' };
  });
  assert.equal(reads[0], 'ret-new');
  assert.equal(denyResult.failed[0].message, 'رُفض الإرسال');
  assert.equal(denied.state.attempts, 1);
});

test('U8(d) a stale over-cap read whose re-read moved is retried, not refused', async () => {
  const stale = fakeFs({
    counter: {
      advanceId: 'adv', partyId: 'person', projectId: 'job', currency: 'IQD',
      cap: 100000, drawn: 100000, lastOpId: 'full',
    },
  });
  const originalRun = stale.fsMod.runTransaction;
  stale.fsMod.runTransaction = async (db, fn) => {
    try {
      await originalRun(db, fn);
    } catch (err) {
      if (stale.state.attempts === 1 && err && err.capRefused === 'over') {
        stale.state.counter = Object.assign({}, stale.state.counter, { drawn: 0, lastOpId: 'rev-full' });
      }
      throw err;
    }
  };
  const box = await client(stale.fsMod);
  const local = localReturn(30000);
  const result = await flush(box.real, local);
  assert.deepEqual(result.synced, [local.id]);
  assert.equal(result.failed.length, 0);
  assert.equal(stale.state.attempts, 2);
});

test('U9 an op already on the server is adopted, and the thrown value is not a Firestore error', async () => {
  const seen = fakeFs({ opExists: true });
  const box = await client(seen.fsMod);
  const local = localReturn(1000);
  const remote = Object.assign({}, local);
  delete remote.docType;
  const result = await flush(box.real, local, async () => ({ status: 'found', doc: remote }));
  assert.deepEqual(result.synced, [local.id]);
  assert.equal(result.failed.length, 0);
  assert.equal(seen.state.opGets, 1);
  assert.equal(seen.state.sets, 0);
  assert.equal(seen.state.attempts, 1);
  assert.equal(seen.state.thrown instanceof Error, false);
  assert.equal(seen.state.thrown.code, 'already-exists');
  let FirestoreError;
  try {
    FirestoreError = require('@firebase/firestore').FirestoreError
      || require('firebase/firestore').FirestoreError
      || null;
  } catch (e) { FirestoreError = null; }
  if (typeof FirestoreError === 'function') assert.equal(seen.state.thrown instanceof FirestoreError, false);
});
