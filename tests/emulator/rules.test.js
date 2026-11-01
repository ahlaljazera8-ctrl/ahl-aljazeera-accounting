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
const Sync = require('../../public/sync.js');

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
  await assertFails(getDoc(doc(db(SITE), 'ledgerEntries', 'own-p2')));
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
  await assertFails(getDocs(query(collection(db(SITE), 'ledgerEntries'), where('createdBy', '==', SITE))));
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

testSeq('F11: unassigning a site user hides that project\'s entries, including their own', () => seeded(async () => {
  await assertSucceeds(getDoc(doc(db(SITE), 'ledgerEntries', 'own-exp')));
  await assertSucceeds(updateDoc(doc(db(OWNER), 'users', SITE), { assignedProjectIds: [] }));
  await assertFails(getDoc(doc(db(SITE), 'ledgerEntries', 'own-exp')));
  await assertFails(getDoc(doc(db(SITE), 'ledgerEntries', 'exp-other')));
  await assertFails(getDoc(doc(db(SITE), 'ledgerEntries', 'own-p2')));
  await assertFails(getDocs(query(
    collection(db(SITE), 'ledgerEntries'),
    where('createdBy', '==', SITE),
    where('projectId', 'in', ['p1']),
  )));
}));

testSeq('a fresh self-signed-up account with no users doc can read and write nothing', () => seeded(async () => {
  const uid = 'fresh-signup';
  const d = db(uid);
  await assertFails(getDoc(doc(d, 'users', uid)));
  await assertFails(getDoc(doc(d, 'users', SITE)));
  await assertFails(getDoc(doc(d, 'users', OWNER)));
  await assertFails(getDoc(doc(d, 'ledgerEntries', 'own-exp')));
  await assertFails(getDoc(doc(d, 'projects', 'p1')));
  await assertFails(getDocs(collection(d, 'users')));
  await assertFails(getDocs(collection(d, 'ledgerEntries')));
  await assertFails(getDocs(collection(d, 'projects')));
  await assertFails(setDoc(doc(d, 'users', uid), userDoc(uid, { createdBy: uid })));
  await assertFails(putEntry(uid, 'fresh-entry', {}));
  await assertFails(setDoc(doc(d, 'projects', 'p-fresh'), projectDoc('p-fresh', 'ممنوع')));
}));

testSeq('owner can archive and restore a project; a site user cannot', () => seeded(async () => {
  const before = await getDoc(doc(db(OWNER), 'projects', 'p1'));
  await assertFails(updateDoc(doc(db(SITE), 'projects', 'p1'), { status: 'archived' }));
  await assertSucceeds(updateDoc(doc(db(OWNER), 'projects', 'p1'), { status: 'archived' }));
  const archived = await getDoc(doc(db(OWNER), 'projects', 'p1'));
  assert.equal(archived.data().status, 'archived');
  assert.equal(archived.data().name, before.data().name);
  assert.equal(archived.data().createdBy, before.data().createdBy);
  await assertFails(putEntry(SITE, 'arch-site', { projectId: 'p1' }));
  await assertFails(putEntry(OWNER, 'arch-owner', { projectId: 'p1' }));
  await assertSucceeds(getDoc(doc(db(SITE), 'ledgerEntries', 'own-exp')));
  await assertFails(updateDoc(doc(db(OWNER), 'ledgerEntries', 'own-exp'), { amount: 1 }));
  await assertFails(deleteDoc(doc(db(OWNER), 'ledgerEntries', 'own-exp')));
  await assertFails(deleteDoc(doc(db(OWNER), 'projects', 'p1')));
  await assertFails(updateDoc(doc(db(SITE), 'projects', 'p1'), { status: 'active' }));
  await assertSucceeds(updateDoc(doc(db(OWNER), 'projects', 'p1'), { status: 'active' }));
  const restored = await getDoc(doc(db(OWNER), 'projects', 'p1'));
  assert.equal(restored.data().status, 'active');
  assert.equal(restored.data().name, before.data().name);
  await assertSucceeds(putEntry(OWNER, 'arch-open', { projectId: 'p1', amount: 80 }));
}));

testSeq('entries on a closed project are rejected and an open project still accepts them', () => seeded(async () => {
  await assertSucceeds(updateDoc(doc(db(OWNER), 'projects', 'p1'), { status: 'closed' }));
  await assertFails(putEntry(SITE, 'closed-site', { projectId: 'p1' }));
  await assertFails(putEntry(OWNER, 'closed-owner', { projectId: 'p1' }));
  await assertSucceeds(getDoc(doc(db(SITE), 'ledgerEntries', 'own-exp')));
  await assertSucceeds(putEntry(OWNER, 'open-p2', { projectId: 'p2', amount: 80 }));
}));

testSeq('amount is a positive integer at or under the named ceiling', () => seeded(async () => {
  await assertSucceeds(putEntry(SITE, 'at-cap', { amount: 10000000000 }));
  await assertFails(putEntry(SITE, 'over-cap', { amount: 10000000001 }));
  await assertFails(putEntry(SITE, 'huge', { amount: 99999999999999 }));
}));

testSeq('entry dates must be real calendar dates inside 2000-01-01..2100-12-31', () => seeded(async () => {
  await assertSucceeds(putEntry(SITE, 'leap', { entryDate: '2024-02-29' }));
  await assertFails(putEntry(SITE, 'bad-month', { entryDate: '2026-13-01' }));
  await assertFails(putEntry(SITE, 'bad-day', { entryDate: '2026-02-31' }));
  await assertFails(putEntry(SITE, 'apr-31', { entryDate: '2026-04-31' }));
  await assertFails(putEntry(SITE, 'too-old', { entryDate: '1999-12-31' }));
  await assertFails(putEntry(SITE, 'too-new', { entryDate: '2101-01-01' }));
  await assertFails(putEntry(SITE, 'slashes', { entryDate: '2026/10/30' }));
}));

testSeq('document ids are restricted to a short safe alphabet', () => seeded(async () => {
  const okId = 'a'.repeat(64);
  await assertSucceeds(putEntry(SITE, okId, { id: okId }));
  await assertFails(putEntry(SITE, 'a'.repeat(65), { id: 'a'.repeat(65) }));
  await assertFails(putEntry(SITE, 'bad id', { id: 'bad id' }));
  await assertFails(putEntry(SITE, 'xss"><img', { id: 'xss"><img' }));
  await assertFails(putEntry(SITE, 'bad.id', { id: 'bad.id' }));
  await assertFails(setDoc(doc(db(OWNER), 'projects', 'p<script>'), projectDoc('p<script>', 'اسم')));
  await assertFails(setDoc(doc(db(OWNER), 'users', 'user id'), userDoc('user id')));
}));

testSeq('site can write a trimmed partyName on an assigned project', () => seeded(async () => {
  await assertSucceeds(putEntry(SITE, 'payee-ok', { partyName: 'مكتب الأنوار' }));
  await assertSucceeds(putEntry(SITE, 'payee-100', { partyName: 'a'.repeat(100) }));
  await assertSucceeds(putEntry(SITE, 'payee-empty', { partyName: '' }));
  await assertSucceeds(putEntry(SITE, 'payee-omit', {}));
  const snap = await assertSucceeds(getDoc(doc(db(SITE), 'ledgerEntries', 'payee-ok')));
  assert.equal(snap.data().partyName, 'مكتب الأنوار');
  await assertFails(putEntry(SITE, 'payee-p2', { projectId: 'p2', partyName: 'مكتب الأنوار' }));
}));

testSeq('partyName is rejected when too long, untrimmed, or not a string', () => seeded(async () => {
  await assertFails(putEntry(SITE, 'payee-101', { partyName: 'a'.repeat(101) }));
  await assertFails(putEntry(OWNER, 'payee-101-owner', { partyName: 'a'.repeat(101) }));
  await assertFails(putEntry(SITE, 'payee-lead', { partyName: ' مكتب' }));
  await assertFails(putEntry(SITE, 'payee-tail', { partyName: 'مكتب ' }));
  await assertFails(putEntry(SITE, 'payee-blank', { partyName: '   ' }));
  await assertFails(putEntry(SITE, 'payee-type', { partyName: 12 }));
}));

testSeq('createdByName must equal the writer displayName', () => seeded(async () => {
  await assertSucceeds(putEntry(SITE, 'named', { createdByName: 'أحمد', partyName: 'مورد' }));
  await assertSucceeds(putEntry(OWNER, 'named-owner', { createdByName: 'أمير' }));
  await assertSucceeds(putEntry(SITE, 'unnamed', {}));
  await assertFails(putEntry(SITE, 'wrong-name', { createdByName: 'سامي' }));
  await assertFails(putEntry(SITE, 'owner-name', { createdByName: 'أمير' }));
  await assertFails(putEntry(SITE, 'blank-name', { createdByName: '' }));
  await assertFails(putEntry(SITE, 'padded-name', { createdByName: 'أحمد ' }));
  await assertFails(putEntry(SITE, 'name-type', { createdByName: 1 }));
  const sixty = 'ن'.repeat(60);
  await assertSucceeds(updateDoc(doc(db(OWNER), 'users', SITE), { displayName: sixty }));
  await assertSucceeds(putEntry(SITE, 'name-60', { createdByName: sixty }));
  await assertSucceeds(updateDoc(doc(db(OWNER), 'users', SITE), { displayName: 'أحمد الجديد' }));
  await assertFails(putEntry(SITE, 'name-stale', { createdByName: sixty }));
  await assertFails(updateDoc(doc(db(SITE), 'ledgerEntries', 'own-exp'), { createdByName: 'أحمد', partyName: 'مورد' }));
}));

testSeq('a displayName of 61 to 80 characters can be stored and attached as createdByName', () => seeded(async () => {
  for (const [id, n] of [['name-61', 61], ['name-80', 80]]) {
    const name = 'ن'.repeat(n);
    await assertSucceeds(updateDoc(doc(db(OWNER), 'users', SITE), { displayName: name }));
    await assertSucceeds(putEntry(SITE, id, { createdByName: name }));
    const snap = await assertSucceeds(getDoc(doc(db(SITE), 'ledgerEntries', id)));
    assert.equal(snap.data().createdByName, name);
    assert.equal(snap.data().createdByName.length, n);
  }
  await assertFails(updateDoc(doc(db(OWNER), 'users', SITE), { displayName: 'ن'.repeat(81) }));
  await assertFails(putEntry(SITE, 'name-81', { createdByName: 'ن'.repeat(81) }));
}));

testSeq('a site user reads the recorder name from the entry, not from another user doc', () => seeded(async () => {
  await assertSucceeds(putEntry(OTHER, 'named-other', { createdByName: 'سامي', partyName: 'مورد حديد', amount: 70 }));
  const snap = await assertSucceeds(getDoc(doc(db(SITE), 'ledgerEntries', 'named-other')));
  assert.equal(snap.data().createdByName, 'سامي');
  assert.equal(snap.data().partyName, 'مورد حديد');
  await assertFails(getDoc(doc(db(SITE), 'users', OTHER)));
  await assertFails(getDoc(doc(db(SITE), 'ledgerEntries', 'inc-other')));
}));

testSeq('partyName and createdByName do not admit extra fields', () => seeded(async () => {
  await assertFails(putEntry(SITE, 'extra-payee', { partyName: 'مورد', note: 'x' }));
  await assertFails(putEntry(SITE, 'extra-name', { createdByName: 'أحمد', createdByEmail: 'site@example.invalid' }));
  await assertFails(putEntry(SITE, 'extra-both', { partyName: 'مورد', createdByName: 'أحمد', recorder: 'أحمد' }));
}));

testSeq('a site user cannot read projectFinance', () => seeded(async () => {
  await assertSucceeds(setDoc(doc(db(OWNER), 'projectFinance', 'p1'), { contractAmount: 60000000 }));
  const owner = await assertSucceeds(getDoc(doc(db(OWNER), 'projectFinance', 'p1')));
  assert.equal(owner.data().contractAmount, 60000000);
  await assertFails(getDoc(doc(db(SITE), 'projectFinance', 'p1')));
  await assertFails(getDocs(collection(db(SITE), 'projectFinance')));
  await assertFails(setDoc(doc(db(SITE), 'projectFinance', 'p1'), { contractAmount: 1 }));
  await assertFails(setDoc(doc(db(OWNER), 'projectFinance', 'p1'), { contractAmount: -1 }));
  await assertFails(setDoc(doc(db(OWNER), 'projectFinance', 'p1'), { contractAmount: 1.5 }));
  await assertFails(setDoc(doc(db(OWNER), 'projectFinance', 'p-extra'), { contractAmount: 1, note: 'x' }));
  await assertFails(deleteDoc(doc(db(OWNER), 'projectFinance', 'p1')));
  await assertFails(getDoc(doc(db(null), 'projectFinance', 'p1')));
}));

testSeq('a site user can read an assigned project that has no money field', () => seeded(async () => {
  const snap = await assertSucceeds(getDoc(doc(db(SITE), 'projects', 'p1')));
  assert.equal(snap.data().name, 'مشروع المدرسة');
  assert.equal(snap.data().id, 'p1');
  assert.equal(Object.prototype.hasOwnProperty.call(snap.data(), 'contractAmount'), false);
  await assertFails(getDoc(doc(db(SITE), 'projects', 'p2')));
  await assertFails(setDoc(doc(db(OWNER), 'projects', 'p-money'), Object.assign(projectDoc('p-money', 'مال'), { contractAmount: 5 })));
  await assertFails(updateDoc(doc(db(OWNER), 'projects', 'p1'), { contractAmount: 5 }));
}));

testSeq('a project keeps a leftover contractAmount until the owner rewrites it', () => seeded(async () => {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'projects', 'p-old'), Object.assign(projectDoc('p-old', 'قديم'), { contractAmount: 123 }));
  });
  await assertSucceeds(updateDoc(doc(db(OWNER), 'users', SITE), { assignedProjectIds: ['p-old'] }));
  const before = await assertSucceeds(getDoc(doc(db(SITE), 'projects', 'p-old')));
  assert.equal(before.data().contractAmount, 123);
  await assertSucceeds(setDoc(doc(db(OWNER), 'projects', 'p-old'), projectDoc('p-old', 'قديم')));
  const after = await assertSucceeds(getDoc(doc(db(SITE), 'projects', 'p-old')));
  assert.equal(after.data().name, 'قديم');
  assert.equal(Object.prototype.hasOwnProperty.call(after.data(), 'contractAmount'), false);
  await assertFails(getDoc(doc(db(SITE), 'projectFinance', 'p-old')));
}));

testSeq('a non-owner cannot write users', () => seeded(async () => {
  await assertFails(setDoc(doc(db(SITE), 'users', 'stranger'), userDoc('stranger', { assignedProjectIds: ['p1'] })));
  await assertFails(updateDoc(doc(db(SITE), 'users', SITE), { displayName: 'لا', assignedProjectIds: ['p1', 'p2'] }));
  await assertFails(setDoc(doc(db(null), 'users', 'stranger'), userDoc('stranger')));
  await assertFails(setDoc(doc(db(INACTIVE), 'users', 'stranger'), userDoc('stranger')));
  await assertSucceeds(getDoc(doc(db(SITE), 'users', SITE)));
}));

testSeq('assignment to specific projects grants exactly those projects', () => seeded(async () => {
  await assertSucceeds(updateDoc(doc(db(OWNER), 'users', SITE), { assignedProjectIds: ['p1'] }));
  await assertSucceeds(getDoc(doc(db(SITE), 'projects', 'p1')));
  await assertFails(getDoc(doc(db(SITE), 'projects', 'p2')));
  await assertSucceeds(updateDoc(doc(db(OWNER), 'users', SITE), { assignedProjectIds: ['p2'] }));
  await assertFails(getDoc(doc(db(SITE), 'projects', 'p1')));
  await assertSucceeds(getDoc(doc(db(SITE), 'projects', 'p2')));
  await assertSucceeds(updateDoc(doc(db(OWNER), 'users', SITE), { assignedProjectIds: ['p1', 'p2'] }));
  await assertSucceeds(getDoc(doc(db(SITE), 'projects', 'p1')));
  await assertSucceeds(getDoc(doc(db(SITE), 'projects', 'p2')));
  const twenty = Array.from({ length: 20 }, (_, i) => 'p' + i);
  await assertSucceeds(updateDoc(doc(db(OWNER), 'users', SITE), { assignedProjectIds: twenty }));
  await assertFails(updateDoc(doc(db(OWNER), 'users', SITE), { assignedProjectIds: twenty.concat('p20') }));
  await assertFails(updateDoc(doc(db(OWNER), 'users', SITE), { assignedProjectIds: ['bad id'] }));
  await assertFails(updateDoc(doc(db(OWNER), 'users', SITE), { assignedProjectIds: ['p.1'] }));
  await assertFails(updateDoc(doc(db(OWNER), 'users', SITE), { assignedProjectIds: [''] }));
  await assertFails(updateDoc(doc(db(OWNER), 'users', SITE), { assignedProjectIds: [1] }));
}));

testSeq('entries, projects, and users reject unknown fields and wrong types', () => seeded(async () => {
  await assertFails(putEntry(SITE, 'extra-entry', { note: 'x' }));
  await assertFails(putEntry(SITE, 'bad-desc', { description: 12 }));
  await assertFails(setDoc(doc(db(OWNER), 'projects', 'p-extra'), Object.assign(projectDoc('p-extra', 'زيادة'), { evil: '<script>' })));
  await assertFails(setDoc(doc(db(OWNER), 'projects', 'p-role'), Object.assign(projectDoc('p-role', 'حالة'), { status: 'paused' })));
  await assertFails(setDoc(doc(db(OWNER), 'users', 'u-extra'), Object.assign(userDoc('u-extra'), { token: 'nope' })));
  await assertFails(setDoc(doc(db(OWNER), 'users', 'u-role'), userDoc('u-role', { role: 'admin' })));
  await assertFails(setDoc(doc(db(OWNER), 'users', 'u-list'), userDoc('u-list', { assignedProjectIds: 'p1' })));
  await assertSucceeds(setDoc(doc(db(OWNER), 'projects', 'p-ok'), projectDoc('p-ok', 'مشروع سليم')));
  await assertSucceeds(setDoc(doc(db(OWNER), 'users', 'u-ok'), userDoc('u-ok', { displayName: 'سليم', email: 'ok@example.invalid' })));
}));
