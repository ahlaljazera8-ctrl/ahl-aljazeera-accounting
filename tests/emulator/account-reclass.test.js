// Legacy labour reclass against the emulator. Rules for laborReviews and the ledger guard.
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const {
  doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch,
} = require('firebase/firestore');

const PROJECT_ID = 'ahl-aljazeera-accounting';
const OWNER = 'owner-a';
const OTHER = 'owner-b';
const SITE = 'site-1';
const OFF = 'owner-off';
const BARE = 'owner-bare';
const JOB = 'JOB';
const OLD = 'OLD';
const RULES = fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8');

function localHost(name) {
  const raw = process.env[name];
  if (!raw || !/^(127\.0\.0\.1|localhost):\d+$/.test(raw)) {
    throw new Error(name + ' must be a local emulator. Got: ' + raw);
  }
  const [host, port] = raw.split(':');
  return { host, port: Number(port) };
}

let testEnv;
let chain = Promise.resolve();
/** @type {Map<string, import('firebase/firestore').Firestore>} */
const contexts = new Map();

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
    const app = /** @type {{ app?: { delete?: () => Promise<void> } }} */ (firestore).app;
    if (app && typeof app.delete === 'function') closing.push(Promise.resolve(app.delete()).catch(() => {}));
  }
  contexts.clear();
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

function userDoc(uid, over) {
  return Object.assign({
    displayName: 'أمير', email: uid + '@example.invalid', role: 'owner', active: true,
    assignedProjectIds: [], createdAtServer: new Date(), createdBy: OWNER,
  }, over || {});
}

function projectDoc(id, status) {
  return {
    id, name: id, clientName: 'Client', location: 'Here', currency: 'IQD', status,
    createdAtDevice: 1, createdAtServer: new Date(), createdBy: OWNER, deviceId: 'admin',
  };
}

function labour(id, projectId, over) {
  return Object.assign({
    id, projectId, direction: 'expense', entryType: 'labour', amount: 80000, currency: 'IQD',
    entryDate: '2026-03-04', isReversal: false, createdAtDevice: 1700000000000, createdBy: OWNER,
    createdAtServer: new Date(), deviceId: 'admin',
  }, over || {});
}

function reviewBody(entryId, projectId, over) {
  return Object.assign({
    id: 'lrv_' + entryId, entryId, projectId, decision: 'deducted', reviewedOn: '2026-11-25',
    createdBy: OWNER, createdByName: 'أمير', deviceId: 'dev-owner',
  }, over || {});
}

function revBody(entry, over) {
  return Object.assign({
    id: 'rev_' + entry.id, projectId: entry.projectId, direction: entry.direction, entryType: entry.entryType,
    amount: entry.amount, currency: 'IQD', entryDate: '2026-11-25', isReversal: true, reversesEntryId: entry.id,
    reversalReason: 'سبب', createdAtDevice: 1700000000001, createdBy: OWNER, deviceId: 'dev-owner',
    description: 'L:' + entry.id + ';تصحيح',
  }, over || {});
}

function row(uid, fields) {
  const out = Object.assign({ createdBy: uid, deviceId: 'dev-' + uid }, fields || {});
  if (!Object.prototype.hasOwnProperty.call(fields || {}, 'createdAtServer')) out.createdAtServer = serverTimestamp();
  return out;
}

function send(uid, col, id, fields) {
  return setDoc(doc(db(uid), col, id), row(uid, Object.assign({ id }, fields)));
}

const allow = promise => assertSucceeds(promise);
const deny = promise => assertFails(promise);

async function seed(extra) {
  await testEnv.clearFirestore();
  contexts.clear();
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const database = ctx.firestore();
    await setDoc(doc(database, 'users', OWNER), userDoc(OWNER));
    await setDoc(doc(database, 'users', OTHER), userDoc(OTHER, { displayName: 'آخر' }));
    await setDoc(doc(database, 'users', SITE), userDoc(SITE, { role: 'site', displayName: 'موقع' }));
    await setDoc(doc(database, 'users', OFF), userDoc(OFF, { active: false }));
    const bare = userDoc(BARE);
    delete bare.active;
    await setDoc(doc(database, 'users', BARE), bare);
    await setDoc(doc(database, 'projects', JOB), projectDoc(JOB, 'active'));
    await setDoc(doc(database, 'projects', OLD), projectDoc(OLD, 'archived'));
    await setDoc(doc(database, 'parties', 'p1'), {
      id: 'p1', name: 'Kareem', createdBy: OWNER, createdAtServer: new Date(), deviceId: 'admin',
    });
    await setDoc(doc(database, 'ledgerEntries', 'e80'), labour('e80', JOB));
    await setDoc(doc(database, 'ledgerEntries', 'e81'), labour('e81', OLD));
    await setDoc(doc(database, 'ledgerEntries', 'e1'), labour('e1', JOB, { amount: 1000 }));
    await setDoc(doc(database, 'ledgerEntries', 'e10'), labour('e10', JOB, { amount: 1000 }));
    if (extra) await extra(database);
  });
}

const E80 = { id: 'e80', projectId: JOB, direction: 'expense', entryType: 'labour', amount: 80000 };

testSeq('E10 owner creates laborReviews/lrv_e80', async () => {
  await seed();
  await allow(send(OWNER, 'laborReviews', 'lrv_e80', reviewBody('e80', JOB)));
  const saved = await getDoc(doc(db(OWNER), 'laborReviews', 'lrv_e80'));
  assert.equal(saved.exists(), true);
  assert.equal(saved.data().decision, 'deducted');
  assert.equal(saved.data().entryId, 'e80');
  assert.equal(saved.data().projectId, JOB);
});

testSeq('E11 a second create, update, and delete of lrv_e80 are denied', async () => {
  await seed();
  await allow(send(OWNER, 'laborReviews', 'lrv_e80', reviewBody('e80', JOB)));
  await deny(send(OWNER, 'laborReviews', 'lrv_e80', reviewBody('e80', JOB, { reviewedOn: '2026-11-24' })));
  await deny(updateDoc(doc(db(OWNER), 'laborReviews', 'lrv_e80'), { decision: 'deducted' }));
  await deny(deleteDoc(doc(db(OWNER), 'laborReviews', 'lrv_e80')));
});

testSeq('E12 site, inactive, missing active, spoofed createdBy, and a stale stamp are denied', async () => {
  await seed();
  await deny(send(SITE, 'laborReviews', 'lrv_e80', reviewBody('e80', JOB, { createdBy: SITE, createdByName: 'موقع' })));
  await deny(send(OFF, 'laborReviews', 'lrv_e80', reviewBody('e80', JOB, { createdBy: OFF })));
  await deny(send(BARE, 'laborReviews', 'lrv_e80', reviewBody('e80', JOB, { createdBy: BARE })));
  await deny(send(OWNER, 'laborReviews', 'lrv_e80', reviewBody('e80', JOB, { createdBy: OTHER })));
  await deny(send(OWNER, 'laborReviews', 'lrv_e80', reviewBody('e80', JOB, { createdAtServer: new Date(0) })));
});

testSeq('E13 lrv_e80 is denied when rev_e80 already exists', async () => {
  await seed(async database => {
    await setDoc(doc(database, 'ledgerEntries', 'rev_e80'), Object.assign(revBody(E80, { description: 'تصحيح: سهو' }), {
      createdAtServer: new Date(),
    }));
  });
  await deny(send(OWNER, 'laborReviews', 'lrv_e80', reviewBody('e80', JOB)));
});

testSeq('E14 an L reversal of a reviewed row is denied and an ordinary reversal is allowed', async () => {
  await seed();
  await allow(send(OWNER, 'laborReviews', 'lrv_e80', reviewBody('e80', JOB)));
  await deny(send(OWNER, 'ledgerEntries', 'rev_e80', revBody(E80)));
  await allow(send(OWNER, 'ledgerEntries', 'rev_e80', revBody(E80, { description: 'تصحيح: سهو' })));
});

testSeq('E15 the wrong entry shape, project, decision, date, or an extra key is denied', async () => {
  await seed(async database => {
    await setDoc(doc(database, 'ledgerEntries', 'e-sub'), labour('e-sub', JOB, { entryType: 'subcontractor' }));
    await setDoc(doc(database, 'ledgerEntries', 'e-fm'), labour('e-fm', JOB, { foremanId: 'fm1' }));
    await setDoc(doc(database, 'ledgerEntries', 'e-rev'), labour('e-rev', JOB, { isReversal: true }));
  });
  await deny(send(OWNER, 'laborReviews', 'lrv_e-sub', reviewBody('e-sub', JOB)));
  await deny(send(OWNER, 'laborReviews', 'lrv_e-fm', reviewBody('e-fm', JOB)));
  await deny(send(OWNER, 'laborReviews', 'lrv_e-rev', reviewBody('e-rev', JOB)));
  await deny(send(OWNER, 'laborReviews', 'lrv_e80', reviewBody('e80', OLD)));
  await deny(send(OWNER, 'laborReviews', 'lrv_e80', reviewBody('e80', JOB, { extra: 1 })));
  await deny(send(OWNER, 'laborReviews', 'lrv_e80', reviewBody('e80', JOB, { decision: 'other' })));
  await deny(send(OWNER, 'laborReviews', 'lrv_e80', reviewBody('e80', JOB, { reviewedOn: '2026-02-31' })));
});

testSeq('E16 an archived project still accepts lrv_', async () => {
  await seed();
  await allow(send(OWNER, 'laborReviews', 'lrv_e81', reviewBody('e81', OLD)));
});

testSeq('E17 the owner reads laborReviews and a site user does not', async () => {
  await seed();
  await allow(send(OWNER, 'laborReviews', 'lrv_e80', reviewBody('e80', JOB)));
  await allow(getDoc(doc(db(OWNER), 'laborReviews', 'lrv_e80')));
  await deny(getDoc(doc(db(SITE), 'laborReviews', 'lrv_e80')));
});

testSeq('E18 one batch with lrv_e80 and an L rev_e80 is denied in both orders', async () => {
  for (const reviewFirst of [true, false]) {
    await seed();
    const fsdb = db(OWNER);
    const batch = writeBatch(fsdb);
    const review = row(OWNER, reviewBody('e80', JOB));
    const reversal = row(OWNER, revBody(E80));
    const reviewRef = doc(fsdb, 'laborReviews', 'lrv_e80');
    const revRef = doc(fsdb, 'ledgerEntries', 'rev_e80');
    if (reviewFirst) {
      batch.set(reviewRef, review);
      batch.set(revRef, reversal);
    } else {
      batch.set(revRef, reversal);
      batch.set(reviewRef, review);
    }
    await deny(batch.commit());
  }
});

testSeq('E19 lrv_e1 with entryId e80 is denied', async () => {
  await seed();
  await deny(send(OWNER, 'laborReviews', 'lrv_e1', reviewBody('e80', JOB, { id: 'lrv_e1' })));
});

testSeq('E20 a missing or mismatched createdByName is denied', async () => {
  await seed();
  const missing = reviewBody('e80', JOB);
  delete missing.createdByName;
  await deny(send(OWNER, 'laborReviews', 'lrv_e80', missing));
  await deny(send(OWNER, 'laborReviews', 'lrv_e80', reviewBody('e80', JOB, { createdByName: 'ليس أمير' })));
});

testSeq('E21 a review of e1 does not block an L reversal of e10', async () => {
  await seed();
  await allow(send(OWNER, 'laborReviews', 'lrv_e1', reviewBody('e1', JOB)));
  const e10 = { id: 'e10', projectId: JOB, direction: 'expense', entryType: 'labour', amount: 1000 };
  const e1 = { id: 'e1', projectId: JOB, direction: 'expense', entryType: 'labour', amount: 1000 };
  await allow(send(OWNER, 'ledgerEntries', 'rev_e10', revBody(e10)));
  await deny(send(OWNER, 'ledgerEntries', 'rev_e1', revBody(e1)));
});

testSeq('E22 a reversal whose description is exactly L:e80 is denied', async () => {
  await seed();
  await allow(send(OWNER, 'laborReviews', 'lrv_e80', reviewBody('e80', JOB)));
  await deny(send(OWNER, 'ledgerEntries', 'rev_e80', revBody(E80, { description: 'L:e80' })));
});

testSeq('E23 a legacy labour row can be marked and cannot be reversed', async () => {
  await seed(async database => {
    const bare = labour('e-bare', JOB);
    delete bare.isReversal;
    await setDoc(doc(database, 'ledgerEntries', 'e-bare'), bare);
    await setDoc(doc(database, 'ledgerEntries', 'e-null'), labour('e-null', JOB, { foremanId: null }));
  });
  await allow(send(OWNER, 'laborReviews', 'lrv_e-bare', reviewBody('e-bare', JOB)));
  await allow(send(OWNER, 'laborReviews', 'lrv_e-null', reviewBody('e-null', JOB)));
  const legacy = { id: 'e-bare', projectId: JOB, direction: 'expense', entryType: 'labour', amount: 80000 };
  await deny(send(OWNER, 'ledgerEntries', 'rev_e-bare', revBody(legacy)));
});
