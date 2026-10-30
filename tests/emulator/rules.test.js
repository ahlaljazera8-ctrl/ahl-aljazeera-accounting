// Behaviour of firestore.rules against the Firestore emulator.
// Run only under `firebase emulators:exec` (FIRESTORE_EMULATOR_HOST must be local).
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  initializeTestEnvironment, assertFails, assertSucceeds,
} = require('@firebase/rules-unit-testing');
const {
  doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp,
  collection, query, where, getDocs,
} = require('firebase/firestore');
const Sync = require('../../sync.js');

const PROJECT = 'ahl-aljazeera-accounting';
const OWNER = 'owner-1';
const SITE = 'site-1';
const OTHER = 'site-2';
const INACTIVE = 'site-off';

function localHost(name) {
  const raw = process.env[name];
  if (!raw || !/^(127\.0\.0\.1|localhost):\d+$/.test(raw)) {
    throw new Error(name + ' must be a local emulator (refusing production). Got: ' + raw);
  }
  const [host, port] = raw.split(':');
  return { host, port: Number(port) };
}

let testEnv;
let chain = Promise.resolve();

function testSeq(name, fn) {
  test(name, { timeout: 30000 }, async () => {
    const prev = chain;
    let release;
    chain = new Promise(r => { release = r; });
    await prev;
    try { await fn(); }
    finally { release(); }
  });
}

test.before(async () => {
  const host = localHost('FIRESTORE_EMULATOR_HOST');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8'),
      host: host.host,
      port: host.port,
    },
  });
});

test.after(async () => { if (testEnv) await testEnv.cleanup(); });

const db = uid => (uid ? testEnv.authenticatedContext(uid) : testEnv.unauthenticatedContext()).firestore();

function userDoc(uid, over) {
  return Object.assign({
    displayName: 'مستخدم', email: uid + '@example.invalid', role: 'site', active: true,
    assignedProjectIds: ['p1'], createdAtServer: new Date(), createdBy: OWNER,
  }, over);
}
function projectDoc(id, name) {
  return {
    id, name, clientName: 'زبون', location: 'السماوة', currency: 'IQD', status: 'active',
    createdAtDevice: 1, createdAtServer: new Date(), createdBy: OWNER, deviceId: 'admin',
  };
}
function entryFields(uid, over) {
  const row = Object.assign({
    id: 'e-' + uid, projectId: 'p1', direction: 'expense', entryType: 'materials', amount: 1000,
    currency: 'IQD', entryDate: '2026-10-30', isReversal: false, createdAtDevice: 1700000000000,
    createdBy: uid, deviceId: 'dev-' + uid,
  }, over || {});
  row.createdAtServer = serverTimestamp();
  return row;
}
function plain(uid, over) {
  const row = entryFields(uid, over);
  row.createdAtServer = new Date();
  return row;
}

async function seed() {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    await setDoc(doc(d, 'users', OWNER), userDoc(OWNER, { role: 'owner', displayName: 'أمير', email: 'owner@example.invalid', assignedProjectIds: [] }));
    await setDoc(doc(d, 'users', SITE), userDoc(SITE, { displayName: 'أحمد', email: 'site@example.invalid', assignedProjectIds: ['p1'] }));
    await setDoc(doc(d, 'users', OTHER), userDoc(OTHER, { displayName: 'سامي', email: 'other@example.invalid', assignedProjectIds: ['p1'] }));
    await setDoc(doc(d, 'users', INACTIVE), userDoc(INACTIVE, { displayName: 'موقوف', email: 'off@example.invalid', active: false }));
    await setDoc(doc(d, 'projects', 'p1'), projectDoc('p1', 'مشروع المدرسة'));
    await setDoc(doc(d, 'projects', 'p2'), projectDoc('p2', 'بناية السوق'));
    await setDoc(doc(d, 'ledgerEntries', 'inc-owner'), plain(OWNER, { id: 'inc-owner', direction: 'income', entryType: 'clientPayment', amount: 5000 }));
    await setDoc(doc(d, 'ledgerEntries', 'exp-other'), plain(OTHER, { id: 'exp-other', amount: 800 }));
    await setDoc(doc(d, 'ledgerEntries', 'inc-other'), plain(OTHER, { id: 'inc-other', direction: 'income', entryType: 'clientPayment', amount: 9000 }));
    await setDoc(doc(d, 'ledgerEntries', 'exp-p2'), plain(OWNER, { id: 'exp-p2', projectId: 'p2', amount: 100 }));
    await setDoc(doc(d, 'ledgerEntries', 'own-exp'), plain(SITE, { id: 'own-exp', amount: 250 }));
    await setDoc(doc(d, 'ledgerEntries', 'own-p2'), plain(SITE, { id: 'own-p2', projectId: 'p2', amount: 40 }));
  });
}

async function seeded(fn) {
  await testEnv.clearFirestore();
  await seed();
  await fn();
}

function putEntry(uid, id, over) {
  return setDoc(doc(db(uid), 'ledgerEntries', id), entryFields(uid, Object.assign({ id }, over)));
}

testSeq('unauthenticated cannot read, create, update, or delete ledger entries', () => seeded(async () => {
  const d = db(null);
  await assertFails(getDoc(doc(d, 'ledgerEntries', 'own-exp')));
  await assertFails(setDoc(doc(d, 'ledgerEntries', 'nope'), entryFields(SITE, { id: 'nope' })));
  await assertFails(updateDoc(doc(d, 'ledgerEntries', 'own-exp'), { amount: 1 }));
  await assertFails(deleteDoc(doc(d, 'ledgerEntries', 'own-exp')));
}));

testSeq('unauthenticated cannot read or create projects or users', () => seeded(async () => {
  const d = db(null);
  await assertFails(getDoc(doc(d, 'projects', 'p1')));
  await assertFails(setDoc(doc(d, 'projects', 'p3'), projectDoc('p3', 'جديد')));
  await assertFails(getDoc(doc(d, 'users', SITE)));
  await assertFails(setDoc(doc(d, 'users', 'stranger'), userDoc('stranger')));
}));

testSeq('site can create an expense and a client payment on an assigned project', () => seeded(async () => {
  await assertSucceeds(putEntry(SITE, 'site-exp', { entryType: 'expense', amount: 400 }));
  await assertSucceeds(putEntry(SITE, 'site-pay', { direction: 'income', entryType: 'clientPayment', amount: 2500 }));
}));

testSeq('site cannot create on an unassigned project or with someone else\'s createdBy', () => seeded(async () => {
  await assertFails(putEntry(SITE, 'site-p2', { projectId: 'p2' }));
  await assertFails(putEntry(SITE, 'site-lie', { createdBy: OWNER }));
}));

testSeq('owner can create an entry; a signed-in user with no profile cannot', () => seeded(async () => {
  await assertSucceeds(putEntry(OWNER, 'owner-exp', { amount: 70 }));
  await assertFails(putEntry('ghost', 'ghost-exp', {}));
}));

testSeq('inactive site user cannot create an entry', () => seeded(async () => {
  await assertFails(putEntry(INACTIVE, 'off-exp', {}));
}));

testSeq('nobody can update or delete a ledger entry', () => seeded(async () => {
  for (const uid of [SITE, OWNER]) {
    await assertFails(updateDoc(doc(db(uid), 'ledgerEntries', 'own-exp'), { amount: 9 }));
    await assertFails(deleteDoc(doc(db(uid), 'ledgerEntries', 'own-exp')));
    await assertFails(setDoc(doc(db(uid), 'ledgerEntries', 'own-exp'), entryFields(uid, { id: 'own-exp', amount: 250 })));
  }
}));

testSeq('site reads own entries and assigned expenses, not another person\'s income', () => seeded(async () => {
  await assertSucceeds(getDoc(doc(db(SITE), 'ledgerEntries', 'own-exp')));
  await assertSucceeds(getDoc(doc(db(SITE), 'ledgerEntries', 'own-p2')));
  await assertSucceeds(getDoc(doc(db(SITE), 'ledgerEntries', 'exp-other')));
  await assertFails(getDoc(doc(db(SITE), 'ledgerEntries', 'inc-other')));
  await assertFails(getDoc(doc(db(SITE), 'ledgerEntries', 'inc-owner')));
  await assertFails(getDoc(doc(db(SITE), 'ledgerEntries', 'exp-p2')));
  await assertSucceeds(getDoc(doc(db(OWNER), 'ledgerEntries', 'inc-other')));
}));

testSeq('site queries: own entries and assigned expenses are allowed; a full scan is not', () => seeded(async () => {
  for (const spec of Sync.siteReads(SITE, ['p1'])) {
    let q = collection(db(SITE), spec.collection);
    q = query(q, ...spec.where.map(([f, op, v]) => where(f, op, v)));
    const snap = await assertSucceeds(getDocs(q));
    assert.ok(snap.size >= 1);
    if (spec.where.some(([f, , v]) => f === 'direction' && v === 'expense')) {
      snap.forEach(row => {
        assert.equal(row.data().direction, 'expense');
        assert.equal(row.data().projectId, 'p1');
      });
    }
  }
  await assertFails(getDocs(collection(db(SITE), 'ledgerEntries')));
  await assertFails(getDocs(query(collection(db(SITE), 'ledgerEntries'), where('direction', '==', 'income'))));
  const all = await assertSucceeds(getDocs(collection(db(OWNER), 'ledgerEntries')));
  assert.ok(all.size >= 5);
}));

testSeq('site can reverse only their own entry, once, with id rev_<original>', () => seeded(async () => {
  const rev = entryFields(SITE, {
    id: 'rev_own-exp', isReversal: true, reversesEntryId: 'own-exp', reversalReason: 'مبلغ مكرر',
    amount: 250, entryType: 'materials', direction: 'expense', projectId: 'p1',
  });
  await assertSucceeds(setDoc(doc(db(SITE), 'ledgerEntries', 'rev_own-exp'), rev));
  await assertFails(setDoc(doc(db(SITE), 'ledgerEntries', 'rev_own-exp'), rev));
  await assertFails(setDoc(doc(db(SITE), 'ledgerEntries', 'rev-other-id'), Object.assign({}, rev, { id: 'rev-other-id' })));
  await assertFails(putEntry(SITE, 'rev_exp-other', {
    isReversal: true, reversesEntryId: 'exp-other', reversalReason: 'لا', amount: 800,
  }));
}));

testSeq('owner can reverse someone else\'s entry once, and a reversal cannot be reversed', () => seeded(async () => {
  const rev = entryFields(OWNER, {
    id: 'rev_exp-other', isReversal: true, reversesEntryId: 'exp-other', reversalReason: 'تصحيح',
    amount: 800, entryType: 'materials', direction: 'expense', projectId: 'p1',
  });
  await assertSucceeds(setDoc(doc(db(OWNER), 'ledgerEntries', 'rev_exp-other'), rev));
  await assertFails(setDoc(doc(db(OWNER), 'ledgerEntries', 'rev_exp-other'), rev));
  await assertFails(putEntry(OWNER, 'rev_rev_exp-other', {
    isReversal: true, reversesEntryId: 'rev_exp-other', reversalReason: 'لا', amount: 800,
  }));
}));

testSeq('a normal entry cannot use a rev_ id, and the amount must be a positive integer', () => seeded(async () => {
  await assertFails(putEntry(SITE, 'rev_not-a-reversal', { isReversal: false }));
  await assertFails(putEntry(SITE, 'zero', { amount: 0 }));
  await assertFails(putEntry(SITE, 'neg', { amount: -5 }));
  await assertFails(putEntry(SITE, 'frac', { amount: 1.5 }));
}));

testSeq('site cannot write users; owner can create and update but not delete', () => seeded(async () => {
  await assertFails(setDoc(doc(db(SITE), 'users', 'new-user'), userDoc('new-user')));
  await assertFails(updateDoc(doc(db(SITE), 'users', SITE), { role: 'owner' }));
  await assertSucceeds(getDoc(doc(db(SITE), 'users', SITE)));
  await assertFails(getDoc(doc(db(SITE), 'users', OTHER)));
  await assertSucceeds(setDoc(doc(db(OWNER), 'users', 'new-user'), userDoc('new-user', { displayName: 'جديد', email: 'new@example.invalid' })));
  await assertSucceeds(updateDoc(doc(db(OWNER), 'users', 'new-user'), { active: false }));
  await assertFails(deleteDoc(doc(db(OWNER), 'users', 'new-user')));
  await assertSucceeds(getDoc(doc(db(OWNER), 'users', SITE)));
}));

testSeq('site reads only assigned projects; owner creates and updates projects; nobody deletes them', () => seeded(async () => {
  await assertSucceeds(getDoc(doc(db(SITE), 'projects', 'p1')));
  await assertFails(getDoc(doc(db(SITE), 'projects', 'p2')));
  await assertFails(setDoc(doc(db(SITE), 'projects', 'p3'), projectDoc('p3', 'ممنوع')));
  await assertSucceeds(setDoc(doc(db(OWNER), 'projects', 'p3'), projectDoc('p3', 'مشروع جديد')));
  await assertSucceeds(updateDoc(doc(db(OWNER), 'projects', 'p3'), { status: 'closed' }));
  await assertFails(deleteDoc(doc(db(OWNER), 'projects', 'p3')));
  await assertFails(deleteDoc(doc(db(SITE), 'projects', 'p1')));
}));
