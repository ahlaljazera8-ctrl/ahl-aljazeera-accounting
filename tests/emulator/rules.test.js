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
  doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch,
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
    /** @type {any} */
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

testSeq('site reads only assigned projects; owner creates, updates, and deletes a project; a site user cannot', () => seeded(async () => {
  await assertSucceeds(getDoc(doc(db(SITE), 'projects', 'p1')));
  await assertFails(getDoc(doc(db(SITE), 'projects', 'p2')));
  await assertFails(setDoc(doc(db(SITE), 'projects', 'p3'), projectDoc('p3', 'ممنوع')));
  await assertSucceeds(setDoc(doc(db(OWNER), 'projects', 'p3'), projectDoc('p3', 'مشروع جديد')));
  await assertSucceeds(updateDoc(doc(db(OWNER), 'projects', 'p3'), { status: 'closed' }));
  await assertFails(deleteDoc(doc(db(SITE), 'projects', 'p3')));
  await assertSucceeds(deleteDoc(doc(db(OWNER), 'projects', 'p3')));
  assert.equal((await getDoc(doc(db(OWNER), 'projects', 'p3'))).exists(), false);
  assert.equal((await getDoc(doc(db(OWNER), 'projects', 'p1'))).exists(), true);
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
  for (const [id, n] of /** @type {[string, number][]} */ ([['name-61', 61], ['name-80', 80]])) {
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

testSeq('subcontracts: an assigned site user can link a مقاول payment and cannot read or write the amount', () => seeded(async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    const name = (id, projectId, label) => ({
      id, projectId, name: label, work: 'عمل', agreedOn: '2026-10-03', createdAtServer: new Date(), createdBy: OWNER,
    });
    await setDoc(doc(d, 'subcontracts', 'sc-same'), name('sc-same', 'p1', 'مقاول الكهرباء'));
    await setDoc(doc(d, 'subcontracts', 'sc-other-project'), name('sc-other-project', 'p2', 'مقاول آخر'));
    await setDoc(doc(d, 'subcontractTerms', 'sc-same'), { originalAmount: 2500000 });
    await setDoc(doc(d, 'subcontractAmendments', 'am-1'), {
      id: 'am-1', subcontractId: 'sc-same', projectId: 'p1', amount: 500000, date: '2026-10-18',
      note: 'ملحق', createdAtServer: new Date(), createdBy: OWNER,
    });
    await setDoc(doc(d, 'ledgerEntries', 'old-site-sub'), plain(SITE, {
      id: 'old-site-sub', entryType: 'subcontractor', amount: 7200000,
    }));
  });

  const visible = await assertSucceeds(getDoc(doc(db(SITE), 'subcontracts', 'sc-same')));
  assert.equal(visible.data().name, 'مقاول الكهرباء');
  assert.equal(Object.prototype.hasOwnProperty.call(visible.data(), 'originalAmount'), false);
  await assertFails(getDoc(doc(db(SITE), 'subcontracts', 'sc-other-project')));
  await assertFails(getDoc(doc(db(SITE), 'subcontractTerms', 'sc-same')));
  await assertFails(getDocs(collection(db(SITE), 'subcontractTerms')));
  await assertFails(getDoc(doc(db(SITE), 'subcontractAmendments', 'am-1')));
  await assertFails(getDocs(collection(db(SITE), 'subcontractAmendments')));
  await assertFails(getDoc(doc(db(null), 'subcontractTerms', 'sc-same')));
  const terms = await assertSucceeds(getDoc(doc(db(OWNER), 'subcontractTerms', 'sc-same')));
  assert.equal(terms.data().originalAmount, 2500000);

  await assertSucceeds(putEntry(SITE, 'site-sub', { entryType: 'subcontractor', amount: 3000000, subcontractId: 'sc-same' }));
  const saved = await assertSucceeds(getDoc(doc(db(SITE), 'ledgerEntries', 'site-sub')));
  assert.equal(saved.data().subcontractId, 'sc-same');
  assert.equal(saved.data().entryType, 'subcontractor');
  await assertFails(putEntry(SITE, 'site-plain', { entryType: 'subcontractor', amount: 1000 }));
  await assertFails(putEntry(SITE, 'site-other-project', { entryType: 'subcontractor', amount: 1000, projectId: 'p2', subcontractId: 'sc-other-project' }));
  await assertFails(putEntry(SITE, 'site-cross', { entryType: 'subcontractor', amount: 1000, projectId: 'p1', subcontractId: 'sc-other-project' }));
  await assertFails(putEntry(SITE, 'site-link-materials', { entryType: 'materials', subcontractId: 'sc-other-project' }));
  const rev = entryFields(SITE, {
    id: 'rev_old-site-sub', isReversal: true, reversesEntryId: 'old-site-sub', reversalReason: 'تصحيح',
    amount: 7200000, entryType: 'subcontractor', direction: 'expense', projectId: 'p1',
  });
  await assertFails(setDoc(doc(db(SITE), 'ledgerEntries', 'rev_old-site-sub'), rev));
  await assertSucceeds(setDoc(doc(db(OWNER), 'ledgerEntries', 'rev_old-site-sub'), entryFields(OWNER, {
    id: 'rev_old-site-sub', isReversal: true, reversesEntryId: 'old-site-sub', reversalReason: 'تصحيح',
    amount: 7200000, entryType: 'subcontractor', direction: 'expense', projectId: 'p1',
  })));

  for (const uid of [SITE, OWNER]) {
    await assertFails(updateDoc(doc(db(uid), 'subcontracts', 'sc-same'), { name: 'تغيير' }));
    await assertFails(deleteDoc(doc(db(uid), 'subcontracts', 'sc-same')));
    await assertFails(updateDoc(doc(db(uid), 'subcontractTerms', 'sc-same'), { originalAmount: 1 }));
    await assertFails(deleteDoc(doc(db(uid), 'subcontractTerms', 'sc-same')));
    await assertFails(updateDoc(doc(db(uid), 'subcontractAmendments', 'am-1'), { amount: 1 }));
    await assertFails(deleteDoc(doc(db(uid), 'subcontractAmendments', 'am-1')));
  }
  await assertFails(setDoc(doc(db(SITE), 'subcontracts', 'sc-site'), {
    id: 'sc-site', projectId: 'p1', name: 'ممنوع', work: '', agreedOn: '2026-10-28',
    createdAtServer: serverTimestamp(), createdBy: SITE,
  }));
  await assertFails(setDoc(doc(db(SITE), 'subcontractTerms', 'sc-same'), { originalAmount: 9 }));

  await assertSucceeds(setDoc(doc(db(OWNER), 'subcontracts', 'sc-new'), {
    id: 'sc-new', projectId: 'p1', name: 'مقاول السباكة', work: 'تمديد', agreedOn: '2026-10-28',
    createdAtServer: serverTimestamp(), createdBy: OWNER,
  }));
  await assertFails(setDoc(doc(db(OWNER), 'subcontracts', 'sc-money'), {
    id: 'sc-money', projectId: 'p1', name: 'بمبلغ', work: '', agreedOn: '2026-10-28',
    originalAmount: 1500000, createdAtServer: serverTimestamp(), createdBy: OWNER,
  }));
  await assertSucceeds(setDoc(doc(db(OWNER), 'subcontractTerms', 'sc-new'), { originalAmount: 1500000 }));
  await assertSucceeds(setDoc(doc(db(OWNER), 'subcontractAmendments', 'am-new'), {
    id: 'am-new', subcontractId: 'sc-new', projectId: 'p1', amount: 200000, date: '2026-10-28',
    note: 'خزان', createdAtServer: serverTimestamp(), createdBy: OWNER,
  }));
  await assertSucceeds(putEntry(OWNER, 'owner-sub', { entryType: 'subcontractor', amount: 3000000, subcontractId: 'sc-same' }));
  await assertSucceeds(putEntry(OWNER, 'owner-unlinked', { entryType: 'subcontractor', amount: 1000 }));
  await assertFails(putEntry(OWNER, 'owner-cross', { entryType: 'subcontractor', amount: 1000, projectId: 'p1', subcontractId: 'sc-other-project' }));
  await assertFails(deleteDoc(doc(db(OWNER), 'ledgerEntries', 'owner-sub')));
  await assertFails(updateDoc(doc(db(OWNER), 'ledgerEntries', 'owner-sub'), { subcontractId: 'sc-new' }));
}));

testSeq('owner deletes one archived project and everything in it; a site user is denied and another project stays', async () => {
  await testEnv.clearFirestore();
  const entryIds = ['del-pay', 'del-subpay', 'del-exp'];
  for (let i = 0; i < 25; i++) entryIds.push('del-n-' + i);
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    await setDoc(doc(d, 'users', OWNER), userDoc(OWNER, { role: 'owner', displayName: 'أمير', email: 'owner@example.invalid', assignedProjectIds: [] }));
    await setDoc(doc(d, 'users', SITE), userDoc(SITE, { displayName: 'أحمد', email: 'site@example.invalid', assignedProjectIds: ['p-del', 'p-keep'] }));
    const archived = projectDoc('p-del', 'مشروع المدرسة');
    archived.status = 'archived';
    await setDoc(doc(d, 'projects', 'p-del'), archived);
    await setDoc(doc(d, 'projects', 'p-keep'), projectDoc('p-keep', 'بناية السوق'));
    await setDoc(doc(d, 'projectFinance', 'p-del'), { contractAmount: 60000000 });
    await setDoc(doc(d, 'projectFinance', 'p-keep'), { contractAmount: 15000000 });
    const row = (id, over) => plain(OWNER, Object.assign({ id, projectId: 'p-del' }, over));
    await setDoc(doc(d, 'ledgerEntries', 'del-pay'), row('del-pay', { direction: 'income', entryType: 'clientPayment', amount: 40000000 }));
    await setDoc(doc(d, 'ledgerEntries', 'del-subpay'), row('del-subpay', { entryType: 'subcontractor', amount: 7200000, subcontractId: 'sc-del' }));
    await setDoc(doc(d, 'ledgerEntries', 'del-exp'), row('del-exp', { amount: 250000 }));
    for (let i = 0; i < 25; i++) await setDoc(doc(d, 'ledgerEntries', 'del-n-' + i), row('del-n-' + i, { amount: 1000 + i }));
    await setDoc(doc(d, 'ledgerEntries', 'keep-exp'), plain(OWNER, { id: 'keep-exp', projectId: 'p-keep', amount: 80 }));
    await setDoc(doc(d, 'subcontracts', 'sc-del'), {
      id: 'sc-del', projectId: 'p-del', name: 'مقاول الكهرباء', work: 'إنارة', agreedOn: '2026-10-03',
      createdAtServer: new Date(), createdBy: OWNER,
    });
    await setDoc(doc(d, 'subcontracts', 'sc-keep'), {
      id: 'sc-keep', projectId: 'p-keep', name: 'مقاول البناء', work: 'هيكل', agreedOn: '2026-10-04',
      createdAtServer: new Date(), createdBy: OWNER,
    });
    await setDoc(doc(d, 'subcontractTerms', 'sc-del'), { originalAmount: 2500000 });
    await setDoc(doc(d, 'subcontractTerms', 'sc-keep'), { originalAmount: 9000000 });
    await setDoc(doc(d, 'subcontractAmendments', 'am-del'), {
      id: 'am-del', subcontractId: 'sc-del', projectId: 'p-del', amount: 500000, date: '2026-10-18',
      note: 'نقطة', createdAtServer: new Date(), createdBy: OWNER,
    });
    await setDoc(doc(d, 'subcontractAmendments', 'am-keep'), {
      id: 'am-keep', subcontractId: 'sc-keep', projectId: 'p-keep', amount: 100000, date: '2026-10-19',
      note: 'سور', createdAtServer: new Date(), createdBy: OWNER,
    });
  });

  await assertFails(deleteDoc(doc(db(OWNER), 'ledgerEntries', 'del-exp')));
  await assertFails(deleteDoc(doc(db(SITE), 'projects', 'p-del')));
  await assertFails(deleteDoc(doc(db(SITE), 'ledgerEntries', 'del-exp')));
  await assertFails(deleteDoc(doc(db(SITE), 'projectFinance', 'p-del')));
  await assertFails(deleteDoc(doc(db(SITE), 'subcontracts', 'sc-del')));
  await assertFails(deleteDoc(doc(db(SITE), 'subcontractTerms', 'sc-del')));
  await assertFails(deleteDoc(doc(db(SITE), 'subcontractAmendments', 'am-del')));

  const mixed = db(OWNER);
  const mixedBatch = writeBatch(mixed);
  mixedBatch.delete(doc(mixed, 'projects', 'p-del'));
  mixedBatch.delete(doc(mixed, 'ledgerEntries', 'keep-exp'));
  await assertFails(mixedBatch.commit());
  assert.equal((await getDoc(doc(db(OWNER), 'projects', 'p-del'))).exists(), true);
  assert.equal((await getDoc(doc(db(OWNER), 'ledgerEntries', 'keep-exp'))).exists(), true);

  const docs = Sync.projectDeleteDocs('p-del', {
    entryIds, subcontractIds: ['sc-del'], amendmentIds: ['am-del'], termIds: ['sc-del'], finance: true,
  });
  for (const group of Sync.projectDeleteBatches(docs)) {
    const fs = db(OWNER);
    const batch = writeBatch(fs);
    group.forEach(item => batch.delete(doc(fs, item.collection, item.id)));
    await assertSucceeds(batch.commit());
  }

  for (const id of entryIds) assert.equal((await getDoc(doc(db(OWNER), 'ledgerEntries', id))).exists(), false, id);
  assert.equal((await getDoc(doc(db(OWNER), 'projects', 'p-del'))).exists(), false);
  assert.equal((await getDoc(doc(db(OWNER), 'projectFinance', 'p-del'))).exists(), false);
  assert.equal((await getDoc(doc(db(OWNER), 'subcontracts', 'sc-del'))).exists(), false);
  assert.equal((await getDoc(doc(db(OWNER), 'subcontractTerms', 'sc-del'))).exists(), false);
  assert.equal((await getDoc(doc(db(OWNER), 'subcontractAmendments', 'am-del'))).exists(), false);
  assert.equal((await getDoc(doc(db(OWNER), 'projects', 'p-keep'))).data().name, 'بناية السوق');
  assert.equal((await getDoc(doc(db(OWNER), 'ledgerEntries', 'keep-exp'))).data().amount, 80);
  assert.equal((await getDoc(doc(db(OWNER), 'projectFinance', 'p-keep'))).data().contractAmount, 15000000);
  assert.equal((await getDoc(doc(db(OWNER), 'subcontracts', 'sc-keep'))).data().name, 'مقاول البناء');
  assert.equal((await getDoc(doc(db(OWNER), 'subcontractTerms', 'sc-keep'))).data().originalAmount, 9000000);
  assert.equal((await getDoc(doc(db(OWNER), 'subcontractAmendments', 'am-keep'))).data().amount, 100000);
  await assertFails(putEntry(SITE, 'after-del', { projectId: 'p-del', amount: 10 }));
  await assertFails(putEntry(OWNER, 'after-del-owner', { projectId: 'p-del', amount: 10 }));
  await assertSucceeds(deleteDoc(doc(db(OWNER), 'projects', 'p-del')));
  const again = await getDocs(query(collection(db(OWNER), 'ledgerEntries'), where('projectId', '==', 'p-del')));
  assert.equal(again.size, 0);
});

function foremanFields(id, over) {
  const row = Object.assign({ id, name: 'حسن', createdBy: OWNER }, over || {});
  row.createdAtServer = serverTimestamp();
  return row;
}
function cashMoveFields(id, over) {
  const row = Object.assign({
    id, foremanId: 'fm1', kind: 'advance', amount: 1000, date: '2026-11-03', note: '',
    isReversal: false, createdAtDevice: 1700000000000, createdBy: OWNER, deviceId: 'dev-owner',
  }, over || {});
  row.createdAtServer = serverTimestamp();
  return row;
}

testSeq('owner creates and reads a foreman; site, inactive, and a stranger are denied', () => seeded(async () => {
  await assertSucceeds(setDoc(doc(db(OWNER), 'foremen', 'fm1'), foremanFields('fm1')));
  await assertSucceeds(getDoc(doc(db(OWNER), 'foremen', 'fm1')));
  await assertFails(getDoc(doc(db(SITE), 'foremen', 'fm1')));
  await assertFails(setDoc(doc(db(SITE), 'foremen', 'fm-site'), foremanFields('fm-site', { createdBy: SITE })));
  await assertFails(setDoc(doc(db(INACTIVE), 'foremen', 'fm-off'), foremanFields('fm-off', { createdBy: INACTIVE })));
  await assertFails(setDoc(doc(db('ghost'), 'foremen', 'fm-ghost'), foremanFields('fm-ghost', { createdBy: 'ghost' })));
  await assertFails(getDoc(doc(db(null), 'foremen', 'fm1')));
  await assertFails(updateDoc(doc(db(OWNER), 'foremen', 'fm1'), { name: 'علي' }));
  await assertFails(deleteDoc(doc(db(OWNER), 'foremen', 'fm1')));
  await assertFails(setDoc(doc(db(OWNER), 'foremen', 'fm-long'), foremanFields('fm-long', { name: 'ح'.repeat(101) })));
  await assertFails(setDoc(doc(db(OWNER), 'foremen', 'fm-empty'), foremanFields('fm-empty', { name: '' })));
  await assertFails(setDoc(doc(db(OWNER), 'foremen', 'fm-tag'), foremanFields('fm-tag', { docType: 'foreman' })));
  await assertSucceeds(setDoc(doc(db(OWNER), 'foremen', 'fm-note'), foremanFields('fm-note', { note: 'ملاحظة', projectId: 'p1' })));
}));

testSeq('owner records cash moves; site cannot read or write them, and bad shapes are denied', () => seeded(async () => {
  await assertSucceeds(setDoc(doc(db(OWNER), 'foremen', 'fm1'), foremanFields('fm1')));
  await assertSucceeds(setDoc(doc(db(OWNER), 'cashMoves', 'mv1'), cashMoveFields('mv1')));
  await assertSucceeds(getDoc(doc(db(OWNER), 'cashMoves', 'mv1')));
  await assertSucceeds(setDoc(doc(db(OWNER), 'cashMoves', 'mv-set'), cashMoveFields('mv-set', { kind: 'settle', amount: 35000 })));
  await assertSucceeds(setDoc(doc(db(OWNER), 'cashMoves', 'mv-ret'), cashMoveFields('mv-ret', { kind: 'return', amount: 500 })));
  await assertFails(getDoc(doc(db(SITE), 'cashMoves', 'mv1')));
  await assertFails(setDoc(doc(db(SITE), 'cashMoves', 'mv-site'), cashMoveFields('mv-site', { createdBy: SITE })));
  await assertFails(setDoc(doc(db(INACTIVE), 'cashMoves', 'mv-off'), cashMoveFields('mv-off', { createdBy: INACTIVE })));
  await assertFails(updateDoc(doc(db(OWNER), 'cashMoves', 'mv1'), { amount: 2 }));
  await assertFails(deleteDoc(doc(db(OWNER), 'cashMoves', 'mv1')));
  await assertFails(setDoc(doc(db(OWNER), 'cashMoves', 'mv-miss'), cashMoveFields('mv-miss', { foremanId: 'no-such' })));
  await assertFails(setDoc(doc(db(OWNER), 'cashMoves', 'mv-kind'), cashMoveFields('mv-kind', { kind: 'adjust' })));
  await assertFails(setDoc(doc(db(OWNER), 'cashMoves', 'mv-frac'), cashMoveFields('mv-frac', { amount: 1.5 })));
  await assertFails(setDoc(doc(db(OWNER), 'cashMoves', 'mv-zero'), cashMoveFields('mv-zero', { amount: 0 })));
  await assertFails(setDoc(doc(db(OWNER), 'cashMoves', 'mv-cap'), cashMoveFields('mv-cap', { amount: 10000000001 })));
  await assertFails(setDoc(doc(db(OWNER), 'cashMoves', 'mv-tag'), cashMoveFields('mv-tag', { docType: 'foremanMove' })));
  await assertFails(setDoc(doc(db(OWNER), 'cashMoves', 'rev_plain'), cashMoveFields('rev_plain')));
  await assertFails(setDoc(doc(db('ghost'), 'cashMoves', 'mv-ghost'), cashMoveFields('mv-ghost', { createdBy: 'ghost' })));
}));

testSeq('a cash-move reversal must copy the foreman, kind, and amount, and a reversal cannot be reversed', () => seeded(async () => {
  await assertSucceeds(setDoc(doc(db(OWNER), 'foremen', 'fm1'), foremanFields('fm1')));
  await assertSucceeds(setDoc(doc(db(OWNER), 'cashMoves', 'mv1'), cashMoveFields('mv1', { amount: 4000, kind: 'advance' })));
  const rev = cashMoveFields('rev_mv1', {
    amount: 4000, kind: 'advance', isReversal: true, reversesMoveId: 'mv1', reversalReason: 'تصحيح',
  });
  await assertSucceeds(setDoc(doc(db(OWNER), 'cashMoves', 'rev_mv1'), rev));
  await assertFails(setDoc(doc(db(OWNER), 'cashMoves', 'rev_mv1'), rev));
  await assertFails(setDoc(doc(db(OWNER), 'cashMoves', 'rev_bad-kind'), cashMoveFields('rev_bad-kind', {
    amount: 4000, kind: 'return', isReversal: true, reversesMoveId: 'mv1', reversalReason: 'تصحيح',
  })));
  await assertFails(setDoc(doc(db(OWNER), 'cashMoves', 'rev_bad-amt'), cashMoveFields('rev_bad-amt', {
    amount: 5, kind: 'advance', isReversal: true, reversesMoveId: 'mv1', reversalReason: 'تصحيح',
  })));
  await assertSucceeds(setDoc(doc(db(OWNER), 'foremen', 'fm-other'), foremanFields('fm-other', { name: 'علي' })));
  await assertFails(setDoc(doc(db(OWNER), 'cashMoves', 'rev_bad-fm'), cashMoveFields('rev_bad-fm', {
    foremanId: 'fm-other', amount: 4000, kind: 'advance', isReversal: true, reversesMoveId: 'mv1', reversalReason: 'تصحيح',
  })));
  await assertFails(setDoc(doc(db(OWNER), 'cashMoves', 'rev_rev_mv1'), cashMoveFields('rev_rev_mv1', {
    amount: 4000, kind: 'advance', isReversal: true, reversesMoveId: 'rev_mv1', reversalReason: 'لا',
  })));
}));

testSeq('foremanId is an owner expense field, and a site user can still read that expense', () => seeded(async () => {
  await assertSucceeds(setDoc(doc(db(OWNER), 'foremen', 'fm1'), foremanFields('fm1')));
  await assertSucceeds(putEntry(OWNER, 'exp-fm', { foremanId: 'fm1', amount: 35000 }));
  await assertFails(putEntry(SITE, 'exp-fm-site', { foremanId: 'fm1', amount: 10 }));
  await assertFails(putEntry(OWNER, 'inc-fm', { foremanId: 'fm1', direction: 'income', entryType: 'clientPayment', amount: 10 }));
  await assertFails(putEntry(OWNER, 'exp-fm-miss', { foremanId: 'missing', amount: 10 }));
  await assertFails(putEntry(OWNER, 'exp-fm-bad', { foremanId: 'bad id', amount: 10 }));
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'ledgerEntries', 'exp-fm-read'), plain(OWNER, { id: 'exp-fm-read', foremanId: 'fm1', amount: 20 }));
  });
  await assertSucceeds(getDoc(doc(db(SITE), 'ledgerEntries', 'exp-fm-read')));
  await assertSucceeds(updateDoc(doc(db(OWNER), 'projects', 'p1'), { status: 'archived' }));
  await assertFails(putEntry(OWNER, 'exp-fm-arch', { foremanId: 'fm1', amount: 15 }));
  const rev = entryFields(OWNER, {
    id: 'rev_exp-fm', isReversal: true, reversesEntryId: 'exp-fm', reversalReason: 'تصحيح',
    amount: 35000, entryType: 'materials', direction: 'expense', projectId: 'p1', foremanId: 'fm1',
  });
  await assertFails(setDoc(doc(db(OWNER), 'ledgerEntries', 'rev_exp-fm'), rev));
  await assertSucceeds(updateDoc(doc(db(OWNER), 'projects', 'p1'), { status: 'active' }));
  await assertSucceeds(setDoc(doc(db(OWNER), 'ledgerEntries', 'rev_exp-fm'), rev));
  await assertFails(setDoc(doc(db(OWNER), 'ledgerEntries', 'rev_exp-fm-x'), entryFields(OWNER, {
    id: 'rev_exp-fm-x', isReversal: true, reversesEntryId: 'exp-fm', reversalReason: 'تصحيح',
    amount: 35000, entryType: 'materials', direction: 'expense', projectId: 'p1', foremanId: 'fm-other',
  })));
  await assertFails(setDoc(doc(db(OWNER), 'ledgerEntries', 'rev_exp-fm-none'), entryFields(OWNER, {
    id: 'rev_exp-fm-none', isReversal: true, reversesEntryId: 'exp-fm', reversalReason: 'تصحيح',
    amount: 35000, entryType: 'materials', direction: 'expense', projectId: 'p1',
  })));
}));
