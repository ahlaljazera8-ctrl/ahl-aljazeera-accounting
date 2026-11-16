// Flush cap and refusal against the local emulators only. Never production.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { initializeApp, deleteApp } = require('firebase/app');
const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = require('firebase/auth');
const { getFirestore, connectFirestoreEmulator, terminate, doc, setDoc, getDocFromServer, serverTimestamp } = require('firebase/firestore');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

const PROJECT = 'ahl-aljazeera-accounting';
const PASS = 'emulator-only-pass';
const ROOT = path.join(__dirname, '../..');
const OVER = 10000000001;

function localHost(name) {
  const raw = process.env[name];
  if (!raw || !/^(127\.0\.0\.1|localhost):\d+$/.test(raw)) {
    throw new Error(name + ' must be a local emulator (refusing production). Got: ' + raw);
  }
  const [host, port] = raw.split(':');
  return { host, port: Number(port) };
}

let testEnv;
let app;
let db;
let auth;
let ownerUid;
let siteUid;

function loadClient() {
  const context = {
    console, setTimeout, clearTimeout, Map, Object, Array, String, Number, Promise, Error, TypeError,
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
    MISSING_PROFILE_MSG: 'missing',
    SUSPENDED_MSG: 'suspended',
    SESSION_DEAD_MSG: 'dead',
    cache: {},
    K: {
      projects: 'projects', entries: 'entries', outbox: 'outbox', finance: 'projectFinance',
      terms: 'subcontractTerms', subcontracts: 'subcontracts', amendments: 'subcontractAmendments',
      foremen: 'foremen', foremanMoves: 'foremanMoves', syncErrors: 'syncErrors',
      sessionUser: 'sessionUser', statusPending: 'statusPending', pullWatermark: 'pullWatermark',
    },
  };
  context.window = context;
  context.globalThis = context;
  context.get = (k, d) => (context.cache[k] === undefined ? d : JSON.parse(JSON.stringify(context.cache[k])));
  context.set = (k, v) => { context.cache[k] = JSON.parse(JSON.stringify(v)); };
  vm.createContext(context);
  for (const file of ['ledger.js', 'sync.js', 'sync-status.js', 'firebase-client.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'public', file), 'utf8'), context, { filename: file });
  }
  return context;
}

function project(id, uid, extra) {
  return Object.assign({
    id, name: 'مشروع', clientName: 'زبون', currency: 'IQD', status: 'active',
    createdAtDevice: 1, createdBy: uid, deviceId: 'phone-1',
  }, extra || {});
}

async function user(email) {
  try { return await createUserWithEmailAndPassword(auth, email, PASS); }
  catch (err) {
    if (err && err.code === 'auth/email-already-in-use') return signInWithEmailAndPassword(auth, email, PASS);
    throw err;
  }
}

test.before(async () => {
  const fsHost = localHost('FIRESTORE_EMULATOR_HOST');
  const authHost = localHost('FIREBASE_AUTH_EMULATOR_HOST');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8'), host: fsHost.host, port: fsHost.port },
  });
  await testEnv.clearFirestore();
  app = initializeApp({ apiKey: 'demo', projectId: PROJECT, authDomain: 'localhost' }, 'flush-retry');
  auth = getAuth(app);
  connectAuthEmulator(auth, 'http://' + authHost.host + ':' + authHost.port, { disableWarnings: true });
  db = getFirestore(app);
  connectFirestoreEmulator(db, fsHost.host, fsHost.port);
  const owner = await user('owner.flush@example.invalid');
  ownerUid = owner.user.uid;
  await signOut(auth);
  const site = await user('site.flush@example.invalid');
  siteUid = site.user.uid;
  await signOut(auth);
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    const now = new Date();
    await setDoc(doc(d, 'users', ownerUid), {
      displayName: 'مالك', email: 'owner.flush@example.invalid', role: 'owner', active: true,
      assignedProjectIds: [], createdAtServer: now, createdBy: ownerUid,
    });
    await setDoc(doc(d, 'users', siteUid), {
      displayName: 'موقع', email: 'site.flush@example.invalid', role: 'site', active: true,
      assignedProjectIds: ['p-keep'], createdAtServer: now, createdBy: ownerUid,
    });
    await setDoc(doc(d, 'projects', 'p-keep'), project('p-keep', ownerUid, { createdAtServer: now }));
    await setDoc(doc(d, 'projectFinance', 'p-keep'), { contractAmount: 42 });
  });
});

test.after(async () => {
  // getDocFromServer leaves a listen target. The next file's clearFirestore
  // is cancelled while that target is still closing, so close this client
  // and absorb that one clear here.
  try { if (auth) await signOut(auth); } catch (e) { /* already signed out */ }
  try { if (db) await terminate(db); } catch (e) { /* client already closed */ }
  try { if (app) await deleteApp(app); } catch (e) { /* app already deleted */ }
  if (testEnv) {
    try { await testEnv.clearFirestore(); } catch (e) { /* one cancelled clear while the listen closes */ }
    await testEnv.cleanup();
  }
});

function attach(context, who) {
  const counts = { rounds: 0, project: 0, finance: 0, writes: 0 };
  context.set(context.K.sessionUser, who);
  context.ensureFirebase = () => Promise.resolve({
    async writeLocal(local) {
      counts.writes += 1;
      const clean = context.Sync.withoutContractAmount(local);
      const col = context.Sync.collectionFor(clean);
      if (col === 'projects') counts.project += 1;
      const body = JSON.parse(JSON.stringify(context.Sync.withServerTime(clean, null)));
      body.createdAtServer = serverTimestamp();
      await setDoc(doc(db, col, String(clean.id)), body);
      if (col !== 'projects') return;
      const user = context.get(context.K.sessionUser, null);
      if (!context.Ledger.can(user, 'owner')) return;
      const stored = context.get(context.K.finance, {})[clean.id];
      const explicit = stored && Number.isInteger(stored.contractAmount) ? stored.contractAmount : undefined;
      const saved = context.Sync.splitProjectSave(local, explicit);
      if (!saved.finance) return;
      counts.finance += 1;
      await setDoc(doc(db, 'projectFinance', String(clean.id)), JSON.parse(JSON.stringify(saved.finance)));
      const fin = context.get(context.K.finance, {});
      const current = fin[clean.id];
      if (!current || current.contractAmount === saved.finance.contractAmount) {
        fin[clean.id] = { contractAmount: saved.finance.contractAmount };
        context.set(context.K.finance, fin);
      }
    },
    exists() { return Promise.resolve(false); },
    readServer() { return Promise.resolve(null); },
    pull() {
      counts.rounds += 1;
      if (counts.rounds > 6) context.navigator.onLine = false;
      return Promise.resolve();
    },
  });
  return counts;
}

async function drain() {
  for (let i = 0; i < 8; i += 1) await new Promise(resolve => setTimeout(resolve, 0));
}

test('a rules-denied project write is one attempt and leaves the seeded finance', async () => {
  await signInWithEmailAndPassword(auth, 'site.flush@example.invalid', PASS);
  try {
    const context = loadClient();
    const counts = attach(context, { uid: siteUid, role: 'site', active: true, displayName: 'موقع' });
    context.set(context.K.projects, [project('p-denied', siteUid)]);
    context.set(context.K.finance, { 'p-denied': { contractAmount: 80, pending: true } });
    context.set(context.K.outbox, ['p-denied']);
    await context.flushRemote({ fromOutside: true });
    await drain();
    assert.equal(counts.writes, 1);
    assert.equal(counts.project, 1);
    assert.equal(counts.finance, 0);
    assert.ok(counts.rounds <= 2);
    assert.equal(context.get(context.K.finance, {})['p-denied'].contractAmount, 80);
    assert.equal(context.get(context.K.finance, {})['p-denied'].pending, true);
    assert.equal(context.get(context.K.syncErrors, {})['p-denied'], 'رُفض الإرسال');
    let deniedExists = true;
    let keptAmount = null;
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      deniedExists = (await getDocFromServer(doc(ctx.firestore(), 'projects', 'p-denied'))).exists();
      keptAmount = (await getDocFromServer(doc(ctx.firestore(), 'projectFinance', 'p-keep'))).data().contractAmount;
    });
    assert.equal(deniedExists, false);
    assert.equal(keptAmount, 42);
  } finally {
    await signOut(auth);
  }
});

test('path (c) is one project write, then stop, and the integer stays', async () => {
  await signInWithEmailAndPassword(auth, 'owner.flush@example.invalid', PASS);
  try {
    const context = loadClient();
    const counts = attach(context, { uid: ownerUid, role: 'owner', active: true, displayName: 'مالك' });
    context.set(context.K.projects, [project('p-range', ownerUid)]);
    context.set(context.K.finance, { 'p-range': { contractAmount: OVER, pending: true } });
    context.set(context.K.outbox, ['p-range']);
    await context.flushRemote({ fromOutside: true });
    await drain();
    assert.equal(counts.project, 1);
    assert.equal(counts.finance, 0);
    assert.equal(counts.rounds, 1);
    assert.equal(context.get(context.K.finance, {})['p-range'].contractAmount, OVER);
    assert.equal(context.get(context.K.finance, {})['p-range'].pending, true);
    assert.equal(context.get(context.K.syncErrors, {})['p-range'], 'رُفض الإرسال');
    assert.deepEqual(context.get(context.K.outbox, []), []);
    const stored = await getDocFromServer(doc(db, 'projects', 'p-range'));
    assert.equal(stored.exists(), true);
    assert.equal(stored.data().contractAmount, undefined);
    const finance = await getDocFromServer(doc(db, 'projectFinance', 'p-range'));
    assert.equal(finance.exists(), false);
  } finally {
    await signOut(auth);
  }
});

test('the restore keeps both amounts, the ledger row, and the other owner', async () => {
  await signInWithEmailAndPassword(auth, 'owner.flush@example.invalid', PASS);
  const other = { outbox: ['other'], finance: { other: { contractAmount: 9, pending: true } }, ledger: { id: 'e-other', amount: 1 } };
  const untouched = JSON.parse(JSON.stringify(other));
  try {
    const context = loadClient();
    const counts = attach(context, { uid: ownerUid, role: 'owner', active: true, displayName: 'مالك' });
    const ledger = { id: 'e-keep', projectId: 'p-keep', direction: 'expense', entryType: 'materials', amount: 15, currency: 'IQD', entryDate: '2026-01-01', description: 'قيد', createdBy: ownerUid, deviceId: 'phone-1' };
    const seed = {
      projects: [project('p-range', ownerUid), project('p-bad', ownerUid, { status: 'nope' })],
      entries: [ledger],
      finance: {
        'p-range': { contractAmount: OVER, pending: true },
        'p-bad': { contractAmount: 70, pending: true },
      },
      outbox: ['p-range', 'p-bad'],
      syncErrors: { 'old-err': 'رُفض الإرسال' },
    };
    async function once() {
      context.navigator.onLine = true;
      context.set(context.K.projects, seed.projects);
      context.set(context.K.entries, seed.entries);
      context.set(context.K.finance, seed.finance);
      context.set(context.K.outbox, seed.outbox);
      context.set(context.K.syncErrors, seed.syncErrors);
      const before = counts.project;
      await context.flushRemote({ fromOutside: true });
      await drain();
      assert.equal(counts.project - before, 2);
      assert.equal(context.get(context.K.finance, {})['p-range'].contractAmount, OVER);
      assert.equal(context.get(context.K.finance, {})['p-range'].pending, true);
      assert.equal(context.get(context.K.finance, {})['p-bad'].contractAmount, 70);
      assert.equal(context.get(context.K.finance, {})['p-bad'].pending, true);
      assert.equal(context.get(context.K.syncErrors, {})['p-range'], 'رُفض الإرسال');
      assert.equal(context.get(context.K.syncErrors, {})['p-bad'], 'رُفض الإرسال');
      assert.equal(context.get(context.K.syncErrors, {})['old-err'], 'رُفض الإرسال');
      assert.deepEqual(context.get(context.K.outbox, []), []);
      assert.deepEqual(context.get(context.K.entries, []), [ledger]);
      assert.deepEqual(other, untouched);
      const kept = await getDocFromServer(doc(db, 'projectFinance', 'p-keep'));
      assert.equal(kept.data().contractAmount, 42);
    }
    await once();
    await once();
  } finally {
    await signOut(auth);
  }
});
