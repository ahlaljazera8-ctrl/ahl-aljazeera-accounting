// One half of an H payment is refused after the project is closed.
// Emulator only. The payLabor lands while the project is active. An admin
// then closes the project with the rules off. The advanceLabor is denied
// because projectActive fails. The pay stays. No rev_ is written.
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc, serverTimestamp } = require('firebase/firestore');
const Sync = require('../../public/sync.js');
const Status = require('../../public/sync-status.js');
const Ledger = require('../../public/ledger.js');
const Accounts = require('../../public/accounts.js');

const PROJECT_ID = 'ahl-aljazeera-accounting';
const OWNER = 'owner-a';
const PARTY = 'party-1';
const PROJECT = 'p-half';
const RULES = fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8');

/** @type {any} */ (global).Accounts = Accounts;
/** @type {any} */ (global).today = () => '2026-11-23';
const Pay = require('../../public/accounts-payment.js');

function localHost(name) {
  const raw = process.env[name];
  if (!raw || !/^(127\.0\.0\.1|localhost):\d+$/.test(raw)) {
    throw new Error(name + ' must be a local emulator (refusing production). Got: ' + raw);
  }
  const [host, port] = raw.split(':');
  return { host, port: Number(port) };
}

let testEnv;
/** @type {Map<string, import('firebase/firestore').Firestore>} */
const contexts = new Map();

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
    const app = /** @type {{ delete?: () => Promise<void> }} */ (/** @type {any} */ (firestore).app);
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

/**
 * @param {Record<string, unknown>} built
 */
function wire(built) {
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const key of Object.keys(built)) {
    if (key === 'docType' || key === 'effect' || key === 'createdAtServer') continue;
    out[key] = built[key];
  }
  out.createdAtServer = serverTimestamp();
  return out;
}

test('one half refused: payLabor stays and advanceLabor is رُفض الإرسال', async () => {
  await testEnv.clearFirestore();
  contexts.clear();
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await setDoc(doc(d, 'users', OWNER), {
      displayName: 'Owner A', email: 'owner-a@example.invalid', role: 'owner', active: true,
      assignedProjectIds: [], createdAtServer: new Date(), createdBy: OWNER,
    });
    await setDoc(doc(d, 'projects', PROJECT), {
      id: PROJECT, name: 'School', clientName: 'Client', location: 'Here', currency: 'IQD', status: 'active',
      createdAtDevice: 1, createdAtServer: new Date(), createdBy: OWNER, deviceId: 'admin',
    });
    await setDoc(doc(d, 'parties', PARTY), {
      id: PARTY, name: 'Kareem', createdBy: OWNER, createdAtServer: new Date(), deviceId: 'admin',
    });
  });
  const header = {
    projectId: PROJECT,
    partyId: PARTY,
    createdBy: OWNER,
    createdByName: 'Owner A',
    deviceId: 'phone',
    currency: 'IQD',
    fxRate: 1,
  };
  const payBuilt = Pay.cashDoc('payLabor', Object.assign({ id: 'aaaaaaaa-bbbb-cccc-dddd-000000000021', amount: 600000 }, header));
  const advanceBuilt = Pay.cashDoc('advanceLabor', Object.assign({ id: 'aaaaaaaa-bbbb-cccc-dddd-000000000022', amount: 100000 }, header));
  const pay = /** @type {Record<string, unknown>} */ (payBuilt.doc);
  const advance = /** @type {Record<string, unknown>} */ (advanceBuilt.doc);
  assert.equal(pay.partyId, advance.partyId);
  assert.equal(pay.projectId, advance.projectId);
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', String(pay.id)), wire(pay)));
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await updateDoc(doc(ctx.firestore(), 'projects', PROJECT), { status: 'closed' });
  });
  await assertFails(setDoc(doc(db(OWNER), 'accountTxns', String(advance.id)), wire(advance)));
  const local = Object.assign({ docType: 'accountTxn' }, advance);
  const result = await Sync.flushOutbox({
    ids: [String(advance.id)],
    load: id => (id === advance.id ? /** @type {any} */ (local) : null),
    write: async () => { await setDoc(doc(db(OWNER), 'accountTxns', String(advance.id)), wire(advance)); },
    readDependency: async () => ({ status: 'missing' }),
    projectProbe: async () => {
      const snap = await getDoc(doc(db(OWNER), 'projects', PROJECT));
      return { exists: snap.exists() };
    },
  });
  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].id, advance.id);
  assert.equal(result.failed[0].message, Status.REJECTED);
  assert.equal(result.failed[0].message, 'رُفض الإرسال');
  const kept = await getDoc(doc(db(OWNER), 'accountTxns', String(pay.id)));
  assert.equal(kept.exists(), true);
  assert.equal(kept.data().purpose, 'payLabor');
  assert.equal(kept.data().amount, 600000);
  assert.equal(kept.data().partyId, PARTY);
  assert.equal((await getDoc(doc(db(OWNER), 'accountTxns', String(advance.id)))).exists(), false);
  assert.equal((await getDoc(doc(db(OWNER), 'accountTxns', 'rev_' + String(pay.id)))).exists(), false);
  assert.equal((await getDoc(doc(db(OWNER), 'accountTxns', 'rev_' + String(advance.id)))).exists(), false);
  const applied = Status.applyFlush([String(advance.id)], {}, result);
  assert.equal(applied.errors[String(advance.id)], Status.REJECTED);
  const csv = Ledger.rejectedEntriesToCSV(
    [{ id: String(advance.id), projectId: PROJECT, amount: 100000, description: 'advanceLabor', currency: 'IQD', createdBy: OWNER }],
    [{ id: PROJECT, name: 'School' }],
    {},
    applied.errors,
  );
  assert.equal(csv.includes(String(advance.id)), true);
  assert.equal(csv.includes('رُفض الإرسال'), true);
  assert.equal(Ledger.rejectedLogoutBlocked([{ id: String(advance.id) }], []), true);
});
