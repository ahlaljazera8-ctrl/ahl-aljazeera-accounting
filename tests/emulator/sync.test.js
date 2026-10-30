// Offline outbox reaches the Firestore emulator exactly once after reconnect.
// Emulator users only. Never call production.
const test = require('node:test');
const assert = require('node:assert/strict');
const { initializeApp } = require('firebase/app');
const {
  getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
} = require('firebase/auth');
const {
  getFirestore, connectFirestoreEmulator, doc, setDoc, getDocFromServer, serverTimestamp,
  collection, getDocs,
} = require('firebase/firestore');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');
const Sync = require('../../public/sync.js');

const PROJECT = 'ahl-aljazeera-accounting';
const PASS = 'emulator-only-pass';

function localHost(name) {
  const raw = process.env[name];
  if (!raw || !/^(127\.0\.0\.1|localhost):\d+$/.test(raw)) {
    throw new Error(name + ' must be a local emulator (refusing production). Got: ' + raw);
  }
  const [host, port] = raw.split(':');
  return { host, port: Number(port) };
}

let testEnv;
let clientDb;
let siteUid;
let online = true;

async function ensureUser(auth, email) {
  try {
    return await createUserWithEmailAndPassword(auth, email, PASS);
  } catch (err) {
    if (err && err.code === 'auth/email-already-in-use') return signInWithEmailAndPassword(auth, email, PASS);
    throw err;
  }
}

function entry(uid, id, over) {
  return Object.assign({
    id, projectId: 'p-sync', direction: 'expense', entryType: 'materials', amount: 1250,
    currency: 'IQD', entryDate: '2026-10-30', description: 'إسمنت', partyName: '', isReversal: false,
    createdAtDevice: Date.now(), createdAtServer: null, createdBy: uid, deviceId: 'phone-1',
  }, over);
}

async function serverRows() {
  let rows = [];
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDocs(collection(ctx.firestore(), 'ledgerEntries'));
    rows = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
  });
  return rows;
}

async function flush(db, ids, load) {
  return Sync.flushOutbox({
    ids,
    load,
    write: async local => {
      if (!online) { const err = new Error('offline'); err.code = 'unavailable'; throw err; }
      await setDoc(doc(db, Sync.collectionFor(local), local.id), Sync.withServerTime(local, serverTimestamp()));
    },
    exists: async local => {
      if (!online) throw new Error('offline');
      return (await getDocFromServer(doc(db, Sync.collectionFor(local), local.id))).exists();
    },
  });
}

test.before(async () => {
  const fsHost = localHost('FIRESTORE_EMULATOR_HOST');
  const authHost = localHost('FIREBASE_AUTH_EMULATOR_HOST');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8'),
      host: fsHost.host,
      port: fsHost.port,
    },
  });
  await testEnv.clearFirestore();

  const app = initializeApp({ apiKey: 'demo', projectId: PROJECT, authDomain: 'localhost' }, 'sync-client');
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://' + authHost.host + ':' + authHost.port, { disableWarnings: true });
  clientDb = getFirestore(app);
  connectFirestoreEmulator(clientDb, fsHost.host, fsHost.port);

  const owner = await ensureUser(auth, 'owner.sync@example.invalid');
  const ownerUid = owner.user.uid;
  await signOut(auth);
  const site = await ensureUser(auth, 'site.sync@example.invalid');
  siteUid = site.user.uid;

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    const now = new Date();
    await setDoc(doc(d, 'users', ownerUid), {
      displayName: 'مالك تجريبي', email: 'owner.sync@example.invalid', role: 'owner', active: true,
      assignedProjectIds: [], createdAtServer: now, createdBy: ownerUid,
    });
    await setDoc(doc(d, 'users', siteUid), {
      displayName: 'موقع تجريبي', email: 'site.sync@example.invalid', role: 'site', active: true,
      assignedProjectIds: ['p-sync'], createdAtServer: now, createdBy: ownerUid,
    });
    await setDoc(doc(d, 'projects', 'p-sync'), {
      id: 'p-sync', name: 'مشروع المزامنة', clientName: 'زبون', location: 'السماوة', currency: 'IQD',
      status: 'active', createdAtDevice: 1, createdAtServer: now, createdBy: ownerUid, deviceId: 'admin',
    });
  });
});

test.after(async () => { if (testEnv) await testEnv.cleanup(); });

test('offline outbox reaches the emulator once after reconnect', { timeout: 40000 }, async () => {
  const a = entry(siteUid, 'sync-' + crypto.randomUUID());
  const b = entry(siteUid, 'sync-' + crypto.randomUUID(), { entryType: 'labour', amount: 500, description: 'أجور' });
  const local = new Map([[a.id, a], [b.id, b]]);
  const load = id => local.get(id) || null;
  const outbox = [a.id, b.id];

  // Same gate as the app: while offline the outbox is not written. A separate
  // online client (rules disabled) confirms the emulator does not have them yet.
  online = false;
  const whileOffline = await flush(clientDb, outbox, load);
  assert.deepEqual(whileOffline.synced, []);
  assert.deepEqual(whileOffline.kept.slice().sort(), outbox.slice().sort());
  const absent = await serverRows();
  assert.equal(absent.filter(r => r.id === a.id || r.id === b.id).length, 0);

  online = true;
  const delivered = await flush(clientDb, outbox, load);
  assert.deepEqual(delivered.kept, []);
  assert.deepEqual(delivered.synced.slice().sort(), outbox.slice().sort());

  const once = (await serverRows()).filter(r => r.id === a.id || r.id === b.id);
  assert.equal(once.length, 2);
  for (const row of once) {
    const src = local.get(row.id);
    assert.equal(row.amount, src.amount);
    assert.equal(row.isReversal, false);
    assert.equal(row.createdBy, siteUid);
    assert.ok(row.createdAtServer, 'server timestamp stored');
    assert.equal('syncState' in row, false);
  }

  const again = await flush(clientDb, outbox, load);
  assert.deepEqual(again.kept, []);
  const still = (await serverRows()).filter(r => r.id === a.id || r.id === b.id);
  assert.equal(still.length, 2);
});

test('the same id flushed twice, even concurrently, is stored once', { timeout: 30000 }, async () => {
  const row = entry(siteUid, 'once-' + crypto.randomUUID(), { amount: 3200, entryType: 'materials' });
  const local = new Map([[row.id, row]]);
  const load = id => local.get(id) || null;
  await Promise.all([
    flush(clientDb, [row.id, row.id], load),
    flush(clientDb, [row.id], load),
  ]);
  const found = (await serverRows()).filter(r => r.id === row.id);
  assert.equal(found.length, 1);
  assert.equal(found[0].amount, 3200);
});

test('seed and example rows in the outbox are not uploaded', { timeout: 30000 }, async () => {
  const real = entry(siteUid, 'real-' + crypto.randomUUID());
  const seed = entry(siteUid, 'seed-9', { deviceId: 'seed', isExample: true, description: 'مثال' });
  const local = new Map([[real.id, real], [seed.id, seed]]);
  const result = await flush(clientDb, [seed.id, real.id], id => local.get(id) || null);
  assert.deepEqual(result.kept, []);
  assert.ok(result.synced.includes(seed.id));
  const rows = await serverRows();
  assert.equal(rows.filter(r => r.id === seed.id).length, 0);
  assert.equal(rows.filter(r => r.id === real.id).length, 1);
});
