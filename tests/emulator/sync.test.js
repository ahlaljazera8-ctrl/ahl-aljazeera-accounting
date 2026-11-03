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
let ownerUid;
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
    readServer: async local => {
      if (!online) throw new Error('offline');
      const snap = await getDocFromServer(doc(db, Sync.collectionFor(local), local.id));
      return snap.exists() ? snap.data() : null;
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
  ownerUid = owner.user.uid;
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

test('resending one outbox entry a second time does not create a second server row', { timeout: 30000 }, async () => {
  const row = entry(siteUid, 'resend-' + crypto.randomUUID(), { amount: 4100, description: 'إعادة إرسال' });
  const local = new Map([[row.id, row]]);
  const load = id => local.get(id) || null;
  online = true;
  const first = await flush(clientDb, [row.id], load);
  assert.deepEqual(first.synced, [row.id]);
  assert.deepEqual(first.failed, []);
  const second = await flush(clientDb, [row.id], load);
  assert.deepEqual(second.failed, []);
  const found = (await serverRows()).filter(r => r.id === row.id);
  assert.equal(found.length, 1);
  assert.equal(found[0].amount, 4100);
  assert.equal(found[0].description, 'إعادة إرسال');
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

test('an existing server document is synced only when its content matches', { timeout: 30000 }, async () => {
  const id = 'conflict-' + crypto.randomUUID();
  const local = entry(siteUid, id, { amount: 2000, description: 'محلي' });
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const planted = entry(siteUid, id, { amount: 1000, description: 'خادم' });
    planted.createdAtServer = new Date();
    await setDoc(doc(ctx.firestore(), 'ledgerEntries', id), planted);
  });
  const result = await flush(clientDb, [id], () => local);
  assert.equal(result.synced.includes(id), false, 'different server content must not be treated as synced');
  assert.ok((result.failed || []).some(row => row.id === id && row.message.includes('محتوى مختلف')));
  const rows = (await serverRows()).filter(r => r.id === id);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].amount, 1000);
});

test('a foreman move, its reversal, and an entry with foremanId reach the server', { timeout: 40000 }, async () => {
  const fsHost = localHost('FIRESTORE_EMULATOR_HOST');
  const authHost = localHost('FIREBASE_AUTH_EMULATOR_HOST');
  const app = initializeApp({ apiKey: 'demo', projectId: PROJECT, authDomain: 'localhost' }, 'foreman-sync');
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://' + authHost.host + ':' + authHost.port, { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, fsHost.host, fsHost.port);
  await signInWithEmailAndPassword(auth, 'owner.sync@example.invalid', PASS);

  const foremanId = 'fm-' + crypto.randomUUID();
  const moveId = 'mv-' + crypto.randomUUID();
  const entryId = 'fe-' + crypto.randomUUID();
  const person = { id: foremanId, docType: 'foreman', name: 'حسن', createdBy: ownerUid };
  const move = {
    id: moveId, docType: 'foremanMove', foremanId, kind: 'advance', amount: 1000,
    date: '2026-11-03', isReversal: false, createdAtDevice: Date.now(), createdBy: ownerUid, deviceId: 'phone-1',
  };
  const reversal = {
    id: 'rev_' + moveId, docType: 'foremanMove', foremanId, kind: 'advance', amount: 1000,
    date: '2026-11-03', note: '', isReversal: true, reversesMoveId: moveId, reversalReason: 'تصحيح',
    createdAtDevice: Date.now(), createdBy: ownerUid, deviceId: 'phone-1',
  };
  const spent = entry(ownerUid, entryId, { foremanId, amount: 400, description: 'مواد عهدة' });
  const local = new Map([[person.id, person], [move.id, move], [reversal.id, reversal], [spent.id, spent]]);
  online = true;
  const delivered = await flush(db, [person.id, move.id, reversal.id, spent.id], id => local.get(id) || null);
  assert.deepEqual(delivered.failed, []);
  assert.deepEqual(delivered.synced, [person.id, move.id, reversal.id, spent.id]);

  const storedPerson = await getDocFromServer(doc(db, 'foremen', foremanId));
  const storedMove = await getDocFromServer(doc(db, 'foremanMoves', moveId));
  const storedReversal = await getDocFromServer(doc(db, 'foremanMoves', reversal.id));
  const storedEntry = await getDocFromServer(doc(db, 'ledgerEntries', entryId));
  assert.equal(storedPerson.exists(), true);
  assert.equal(storedMove.exists(), true);
  assert.equal(storedReversal.exists(), true);
  assert.equal(storedEntry.exists(), true);
  assert.equal(storedPerson.data().note, '');
  assert.equal(storedPerson.data().docType, undefined);
  assert.equal(storedMove.data().note, '');
  assert.equal(storedMove.data().kind, 'advance');
  assert.equal(storedMove.data().amount, 1000);
  assert.equal(storedMove.data().docType, undefined);
  assert.equal(storedReversal.data().isReversal, true);
  assert.equal(storedReversal.data().reversesMoveId, moveId);
  assert.equal(storedReversal.data().foremanId, foremanId);
  assert.equal(storedEntry.data().foremanId, foremanId);
  assert.equal(storedEntry.data().amount, 400);
  assert.equal(storedEntry.data().createdBy, ownerUid);
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
