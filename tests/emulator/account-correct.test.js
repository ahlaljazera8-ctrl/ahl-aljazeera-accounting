// Slice I corrections against the Firestore emulator.
// Builders produce the docs. The rules accept or refuse them.
// Flush covers a lost deduct position, a transient hold, and a forged cum.
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc, serverTimestamp } = require('firebase/firestore');

const PROJECT_ID = 'ahl-aljazeera-accounting';
const OWNER = 'owner-a';
const PARTY = 'party-1';
const PROJECT = 'p-corr';
const AG = 'aaaaaaaa-bbbb-cccc-dddd-0000000000a1';
const AG_SLOT = 'aaaaaaaa-bbbb-cccc-dddd-0000000000a2';
const RULES = fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8');
const REFUSED = 'رُفض الإرسال';
const S11 = 'رُفض إرسال خصم على هذا القياس.';
const S13 = 'سجّل الخصم على قياس معتمد ثاني لنفس الاتفاق.';

const Ledger = require('../../public/ledger.js');
const Accounts = require('../../public/accounts.js');
const DomSafe = require('../../public/dom-safe.js');
const Sync = require('../../public/sync.js');
const Status = require('../../public/sync-status.js');

/** @type {any} */
const g = globalThis;
const previousToday = g.today;
g.Ledger = Ledger;
g.Accounts = Accounts;
g.DomSafe = DomSafe;
g.Sync = Sync;
g.document = {
  addEventListener() {},
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement() { return {}; },
  createElementNS() { return {}; },
};
g.location = { hash: '#contractor/' + AG };
g.uuid = () => 'aaaaaaaa-bbbb-cccc-dddd-000000000001';
g.deviceId = 'phone';
g.demoRole = () => '';
g.me = () => ({ uid: OWNER, role: 'owner', active: true, displayName: 'أمير' });
g.today = () => '2026-11-22';

const store = {
  parties: /** @type {any[]} */ ([]),
  agreements: /** @type {any[]} */ ([]),
  accountTxns: /** @type {any[]} */ ([]),
  projects: /** @type {any[]} */ ([]),
  entries: /** @type {any[]} */ ([]),
  outbox: /** @type {string[]} */ ([]),
  syncErrors: /** @type {Record<string, string>} */ ({}),
};
g.K = {
  parties: 'parties', agreements: 'agreements', accountTxns: 'accountTxns',
  projects: 'projects', entries: 'entries', outbox: 'outbox', syncErrors: 'syncErrors',
};
g.get = (key, fallback) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallback);
g.set = (key, value) => { store[key] = value; return Promise.resolve(); };
g.queueDoc = id => { if (!store.outbox.includes(id)) store.outbox = store.outbox.concat([id]); };

const UI = require('../../public/accounts-view.js');
const Work = require('../../public/accounts-work.js');
const Pay = require('../../public/accounts-payment.js');
g.AccountPayment = Pay;
const Correct = /** @type {any} */ (require('../../public/accounts-correct.js'));

const WHO = { createdBy: OWNER, deviceId: 'phone', createdByName: 'أمير' };

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
  g.today = previousToday;
  // cleanup() drops each Firebase app without awaiting delete(). Those
  // cancellations then make the next file's clearFirestore return CANCELLED.
  const closing = [];
  for (const firestore of contexts.values()) {
    const app = /** @type {{ delete?: () => Promise<void> }} */ (/** @type {any} */ (firestore).app);
    if (app && app.delete) closing.push(Promise.resolve(app.delete()).catch(() => {}));
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

function wire(built) {
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const key of Object.keys(built)) {
    if (key === 'docType' || key === 'effect' || key === 'createdAtServer') continue;
    const value = built[key];
    if (value == null) continue;
    out[key] = value;
  }
  out.createdAtServer = serverTimestamp();
  return out;
}

function row(fields) {
  const out = Object.assign({ createdBy: OWNER, deviceId: 'phone' }, fields);
  if (!Object.prototype.hasOwnProperty.call(fields, 'createdAtServer')) out.createdAtServer = serverTimestamp();
  return out;
}

async function send(col, id, fields) {
  await setDoc(doc(db(OWNER), col, id), row(Object.assign({ id }, fields)));
}

function resetStore() {
  g.today = () => '2026-11-22';
  g.me = () => ({ uid: OWNER, role: 'owner', active: true, displayName: 'أمير' });
  store.parties = [{ id: PARTY, name: 'حسن' }];
  store.agreements = [];
  store.accountTxns = [];
  store.projects = [{ id: PROJECT, name: 'School', status: 'active' }];
  store.entries = [];
  store.outbox = [];
  store.syncErrors = {};
  Accounts.CONTRACTOR_COST_START = '2026-11-01';
}

function remember(doc) {
  if (!doc || !doc.id) return;
  store.accountTxns = store.accountTxns.filter(row => row.id !== doc.id).concat([doc]);
}

function built(result, label) {
  assert.equal(result.errors.length, 0, label + ' ' + result.errors.join(','));
  assert.ok(result.doc, label);
  return result.doc;
}

async function seedBase() {
  await testEnv.clearFirestore();
  contexts.clear();
  resetStore();
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await setDoc(doc(d, 'users', OWNER), {
      displayName: 'أمير', email: 'owner-a@example.invalid', role: 'owner', active: true,
      assignedProjectIds: [], createdAtServer: new Date(), createdBy: OWNER,
    });
    await setDoc(doc(d, 'projects', PROJECT), {
      id: PROJECT, name: 'School', clientName: 'Client', location: 'Here', currency: 'IQD', status: 'active',
      createdAtDevice: 1, createdAtServer: new Date(), createdBy: OWNER, deviceId: 'admin',
    });
    await setDoc(doc(d, 'parties', PARTY), {
      id: PARTY, name: 'حسن', createdBy: OWNER, createdAtServer: new Date(), deviceId: 'admin',
    });
  });
}

function unitAgreement(id) {
  return {
    id, partyId: PARTY, projectId: PROJECT, method: 'unit', description: 'bricks', currency: 'IQD',
    unitRate: 100000, unitQty: 1, unitName: 'brick',
  };
}

function measurement(id, agreementId, qty) {
  return {
    id, kind: 'body', purpose: 'laborQty', projectId: PROJECT, partyId: PARTY, agreementId,
    ledger: 'labor', currency: 'IQD', fxRate: 1, qty,
  };
}

function approvalOf(targetId, agreementId, amount, qty) {
  return {
    id: 'appr_' + targetId, kind: 'appr', purpose: 'approveLabor', projectId: PROJECT, partyId: PARTY,
    agreementId, ledger: 'labor', currency: 'IQD', fxRate: 1, targetId, amount, qty,
  };
}

function slotId(agreementId, gen) {
  return '000' + agreementId.replaceAll('-', '') + String(gen);
}

async function putUnit(measureId) {
  const agreement = unitAgreement(AG);
  await send('agreements', AG, agreement);
  store.agreements = [agreement];
  const body = measurement(measureId, AG, 6);
  await send('accountTxns', body.id, body);
  remember(body);
  const approval = approvalOf(body.id, AG, 600000, 6);
  await send('accountTxns', approval.id, approval);
  remember(approval);
  return approval;
}

/**
 * render.js is not a module. This is the account-txn half of refusalDocs.
 * @param {any[]} txns
 * @param {Record<string, string>} errors
 * @param {Record<string, unknown>} [losers]
 */
function refusalDocs(txns, errors, losers) {
  /** @type {{ id: string, doc: any, message: string }[]} */
  const rows = [];
  (txns || []).forEach(doc => {
    if (!doc || typeof doc.id !== 'string' || typeof errors[doc.id] !== 'string') return;
    rows.push({ id: doc.id, doc, message: errors[doc.id] });
  });
  Object.keys(losers || {}).forEach(key => {
    rows.push({ id: key, doc: (losers || {})[key] || {}, message: typeof errors[key] === 'string' ? errors[key] : Status.CONFLICT });
  });
  return rows;
}

/**
 * @param {string[]} ids
 * @param {any[]} docs
 * @param {(local: any, writes: string[]) => Promise<void>} [beforeWrite]
 */
async function flush(ids, docs, beforeWrite) {
  /** @type {Record<string, any>} */
  const byId = {};
  docs.forEach(doc => { byId[String(doc.id)] = doc; });
  /** @type {string[]} */
  const writes = [];
  const result = await Sync.flushOutbox({
    ids: ids.slice(),
    load: id => byId[id] || null,
    write: async local => {
      writes.push(String(local.id));
      if (beforeWrite) await beforeWrite(local, writes);
      await setDoc(doc(db(OWNER), 'accountTxns', String(local.id)), wire(local));
    },
    readDependency: async id => {
      const snap = await getDoc(doc(db(OWNER), 'accountTxns', String(id)));
      if (!snap.exists()) return { status: 'missing' };
      return { status: 'found', doc: Object.assign({ id: String(id) }, snap.data()) };
    },
  });
  return { result, writes };
}

test('steps 1-6 and 9: builders are accepted until the rules refuse the next row', async () => {
  await seedBase();
  const approval = await putUnit('aaaaaaaa-bbbb-cccc-dddd-0000000000b1');
  const deduct = built(Correct.deductDoc(Object.assign({ targetId: approval.id, amount: 50000, reason: 'سبب' }, WHO)), 'deduct');
  assert.equal(deduct.id, 'd1' + approval.id);
  assert.equal(deduct.cumAmount, 50000);
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', String(deduct.id)), wire(deduct)));
  remember(deduct);
  const approved = built(Correct.approveDeductDoc(Object.assign({ targetId: deduct.id }, WHO)), 'approve deduct');
  assert.equal(approved.id, 'appr_' + deduct.id);
  assert.equal(Object.prototype.hasOwnProperty.call(approved, 'amount'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(approved, 'txnDate'), false);
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', String(approved.id)), wire(approved)));
  remember(approved);

  const second = measurement('aaaaaaaa-bbbb-cccc-dddd-0000000000b2', AG, 6);
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', second.id), row(second)));
  remember(second);
  const rejected = built(Correct.rejectDoc(Object.assign({ targetId: second.id }, WHO)), 'reject');
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', String(rejected.id)), wire(rejected)));
  remember(rejected);
  const late = approvalOf(second.id, AG, 600000, 6);
  await assertFails(setDoc(doc(db(OWNER), 'accountTxns', late.id), row(late)));

  const lump = {
    id: AG_SLOT, partyId: PARTY, projectId: PROJECT, method: 'lump', description: 'wall', currency: 'IQD', lumpAmount: 5000,
  };
  await send('agreements', AG_SLOT, lump);
  const gen1 = {
    id: slotId(AG_SLOT, 1), kind: 'body', purpose: 'laborQty', projectId: PROJECT, partyId: PARTY,
    agreementId: AG_SLOT, ledger: 'labor', currency: 'IQD', fxRate: 1,
  };
  await send('accountTxns', gen1.id, gen1);
  remember(gen1);
  const slotRej = built(Correct.rejectDoc(Object.assign({ targetId: gen1.id }, WHO)), 'slot reject');
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', String(slotRej.id)), wire(slotRej)));
  const gen2 = Object.assign({}, gen1, { id: slotId(AG_SLOT, 2) });
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', gen2.id), row(gen2)));

  const open = measurement('aaaaaaaa-bbbb-cccc-dddd-0000000000b3', AG, 4);
  await send('accountTxns', open.id, open);
  remember(open);
  const copy = built(Correct.supersedeDoc(Object.assign({ targetId: open.id, qty: 5 }, WHO)), 'supersede');
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', String(copy.id)), wire(copy)));
  let deep = open;
  for (let depth = 1; depth < 5; depth += 1) {
    deep = {
      id: 'sup_' + deep.id, kind: 'sup', purpose: 'laborQty', ledger: 'labor', projectId: PROJECT, partyId: PARTY,
      agreementId: AG, currency: 'IQD', fxRate: 1, supersedesId: deep.id, qty: 5,
    };
    if (depth > 1) await send('accountTxns', deep.id, deep);
    remember(deep);
  }
  const depth5 = {
    id: 'sup_' + deep.id, kind: 'sup', purpose: 'laborQty', ledger: 'labor', projectId: PROJECT, partyId: PARTY,
    agreementId: AG, currency: 'IQD', fxRate: 1, supersedesId: deep.id, qty: 5,
  };
  assert.equal(Correct.supersedeDoc(Object.assign({ targetId: deep.id, qty: 5 }, WHO)).errors.includes('method'), true);
  await assertFails(setDoc(doc(db(OWNER), 'accountTxns', depth5.id), row(depth5)));

  const pay = {
    id: 'aaaaaaaa-bbbb-cccc-dddd-0000000000c1', kind: 'body', purpose: 'payLabor', projectId: PROJECT, partyId: PARTY,
    ledger: 'labor', currency: 'IQD', fxRate: 1, amount: 100000,
  };
  await send('accountTxns', pay.id, pay);
  remember(pay);
  const revPay = built(Correct.reversalDoc(Object.assign({ targetId: pay.id, reason: 'سبب' }, WHO)), 'rev pay');
  assert.equal(revPay.amount, 100000);
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', String(revPay.id)), wire(revPay)));
  remember(revPay);
  const revAppr = built(Correct.reversalDoc(Object.assign({ targetId: approved.id, reason: 'سبب' }, WHO)), 'rev approve');
  assert.equal(Object.prototype.hasOwnProperty.call(revAppr, 'amount'), false);
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', String(revAppr.id)), wire(revAppr)));
  const revRev = {
    id: 'rev_' + revPay.id, kind: 'rev', purpose: 'payLabor', ledger: 'labor', projectId: PROJECT, partyId: PARTY,
    currency: 'IQD', fxRate: 1, reversesId: revPay.id, reversalReason: 'سبب', amount: 100000,
  };
  await assertFails(setDoc(doc(db(OWNER), 'accountTxns', revRev.id), row(revRev)));

  const livePay = {
    id: 'aaaaaaaa-bbbb-cccc-dddd-0000000000c2', kind: 'body', purpose: 'payLabor', projectId: PROJECT, partyId: PARTY,
    ledger: 'labor', currency: 'IQD', fxRate: 1, amount: 20000,
  };
  await send('accountTxns', livePay.id, livePay);
  remember(livePay);
  const queued = built(Correct.reversalDoc(Object.assign({ targetId: livePay.id, reason: 'سبب' }, WHO)), 'queued rev');
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await updateDoc(doc(ctx.firestore(), 'projects', PROJECT), { status: 'closed' });
  });
  store.projects = [{ id: PROJECT, name: 'School', status: 'closed' }];
  const closed = await flush([String(queued.id)], [queued]);
  assert.equal(closed.writes.length, 1);
  assert.equal(closed.result.failed.length, 1);
  assert.equal(closed.result.failed[0].message, REFUSED);
  const applied = Status.applyFlush([String(queued.id)], {}, closed.result);
  assert.equal(applied.errors[String(queued.id)], REFUSED);
  store.syncErrors = applied.errors;
  const view = {
    views: /** @type {Record<string, (arg?: string) => string>} */ ({}),
    titles: {},
    state: {},
    render() {},
    esc: s => String(s ?? ''),
    money: n => Ledger.fmt(n) + ' د.ع',
    queueDoc: g.queueDoc,
  };
  UI.install(/** @type {any} */ (view));
  Work.install(/** @type {any} */ (view));
  Pay.install(/** @type {any} */ (view));
  Correct.install(view);
  const html = view.views.contractor(AG);
  const button = 'act-reverse-' + livePay.id;
  assert.match(html, new RegExp('id="' + button + '"[^>]*disabled'));
  assert.equal((await getDoc(doc(db(OWNER), 'accountTxns', String(queued.id)))).exists(), false);

  await testEnv.withSecurityRulesDisabled(async ctx => {
    await updateDoc(doc(ctx.firestore(), 'projects', PROJECT), { status: 'active' });
  });
  store.projects = [{ id: PROJECT, name: 'School', status: 'active' }];
  store.syncErrors = {};
  const revDeduct = built(Correct.reversalDoc(Object.assign({ targetId: deduct.id, reason: 'سبب' }, WHO)), 'rev deduct');
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', String(revDeduct.id)), wire(revDeduct)));
  remember(revDeduct);
  const ended = Correct.endMeasurementDocs(Object.assign({ targetId: approval.id, reason: 'سبب' }, WHO));
  assert.equal(ended.errors.length, 0, ended.errors.join(','));
  for (const builtDoc of ended.docs) {
    await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', String(builtDoc.id)), wire(builtDoc)));
    remember(builtDoc);
  }
  assert.equal((await getDoc(doc(db(OWNER), 'accountTxns', 'rev_' + approval.id))).exists(), true);
  assert.equal(ended.docs.some(builtDoc => builtDoc.id === 'rev_' + approval.targetId), true);
  assert.equal((await getDoc(doc(db(OWNER), 'accountTxns', 'rev_' + approval.targetId))).exists(), true);
});

test('steps 7 and 8: the other phone adopts the row and the queued approval is refused', async () => {
  await seedBase();
  const measure = measurement('aaaaaaaa-bbbb-cccc-dddd-0000000000b3', AG, 6);
  const agreement = unitAgreement(AG);
  await send('agreements', AG, agreement);
  store.agreements = [agreement];
  await send('accountTxns', measure.id, measure);
  remember(measure);
  const serverCopy = built(Correct.supersedeDoc(Object.assign({ targetId: measure.id, qty: 10 }, WHO)), 'phone A');
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', String(serverCopy.id)), wire(serverCopy)));
  const phoneB = built(Correct.supersedeDoc(Object.assign({ targetId: measure.id, qty: 12 }, WHO)), 'phone B');
  const phoneBAppr = Object.assign({ docType: 'accountTxn' }, approvalOf(String(phoneB.id), AG, 1200000, 12));
  const adopted = await flush([String(phoneB.id), phoneBAppr.id], [phoneB, phoneBAppr]);
  assert.equal(
    adopted.result.adopted.some(row => row.id === phoneB.id),
    true,
    JSON.stringify({
      adopted: adopted.result.adopted.map(row => row.id),
      synced: adopted.result.synced,
      failed: adopted.result.failed.map(row => row.id + ':' + row.message),
      kept: adopted.result.kept,
      parked: adopted.result.parked,
      writes: adopted.writes,
    }),
  );
  const stored = await getDoc(doc(db(OWNER), 'accountTxns', String(phoneB.id)));
  assert.equal(stored.data().qty, 10);
  assert.equal(adopted.result.failed.some(row => row.id === phoneBAppr.id && row.message === REFUSED), true, JSON.stringify({
    failed: adopted.result.failed,
    kept: adopted.result.kept,
    synced: adopted.result.synced,
    parked: adopted.result.parked,
    writes: adopted.writes,
  }));
  const applied = Status.applyFlush([String(phoneB.id), phoneBAppr.id], {}, adopted.result);
  assert.equal(applied.errors[phoneBAppr.id], REFUSED);

  const other = measurement('aaaaaaaa-bbbb-cccc-dddd-0000000000b4', AG, 6);
  await send('accountTxns', other.id, other);
  remember(other);
  const rej = built(Correct.rejectDoc(Object.assign({ targetId: other.id }, WHO)), 'rej m4');
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', String(rej.id)), wire(rej)));
  const queuedAppr = Object.assign({ docType: 'accountTxn' }, approvalOf(other.id, AG, 600000, 6));
  const refused = await flush([queuedAppr.id], [queuedAppr]);
  assert.equal(refused.result.failed.some(row => row.id === queuedAppr.id && row.message === REFUSED), true);
});

test('step 10: a lost deduct position is adopted and the queued descendants are parked', async () => {
  await seedBase();
  const approval = await putUnit('aaaaaaaa-bbbb-cccc-dddd-0000000000b1');
  const server = built(Correct.deductDoc(Object.assign({ targetId: approval.id, amount: 50000, reason: 'سبب' }, WHO)), 'server deduct');
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', String(server.id)), wire(server)));
  store.accountTxns = store.accountTxns.filter(row => row.id !== server.id);
  const local = built(Correct.deductDoc(Object.assign({ targetId: approval.id, amount: 40000, reason: 'سبب' }, WHO)), 'local deduct');
  const appr = {
    id: 'appr_' + local.id, docType: 'accountTxn', kind: 'appr', purpose: 'approveDeduct', projectId: PROJECT,
    partyId: PARTY, ledger: 'labor', currency: 'IQD', fxRate: 1, targetId: local.id, createdBy: OWNER, deviceId: 'phone',
  };
  const rev = {
    id: 'rev_' + local.id, docType: 'accountTxn', kind: 'rev', purpose: 'deduct', ledger: 'labor', projectId: PROJECT,
    partyId: PARTY, currency: 'IQD', fxRate: 1, amount: 40000, reversesId: local.id, reversalReason: 'سبب',
    createdBy: OWNER, deviceId: 'phone',
  };
  const next = {
    id: 'd2' + approval.id, docType: 'accountTxn', kind: 'body', purpose: 'deduct', projectId: PROJECT, partyId: PARTY,
    ledger: 'labor', currency: 'IQD', fxRate: 1, amount: 10000, cumAmount: 50000, targetId: approval.id, txnDate: '2026-11-22',
    description: 'سبب', createdBy: OWNER, deviceId: 'phone',
  };
  const lost = await flush([String(local.id), appr.id, rev.id, next.id], [local, appr, rev, next]);
  assert.deepEqual(lost.writes, [String(local.id)]);
  assert.equal(lost.result.adopted.some(row => row.id === local.id), true);
  for (const id of [appr.id, rev.id, next.id]) {
    assert.equal(lost.result.parked.includes(id), true, id);
    assert.equal(lost.result.slotLosers.some(row => row.doc.id === id), true, id);
  }
  assert.equal((await getDoc(doc(db(OWNER), 'accountTxns', String(local.id)))).data().amount, 50000);
  remember(Object.assign({}, server));
  const again = built(Correct.deductDoc(Object.assign({ targetId: approval.id, amount: 10000, reason: 'سبب' }, WHO)), 'next position');
  assert.equal(again.id, 'd2' + approval.id);
  assert.equal(again.cumAmount, 60000);
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', String(again.id)), wire(again)));
});

test('steps 11 and 11b: a reversal holds the next deduct only while it is earlier in the queue', async () => {
  await seedBase();
  const approval = await putUnit('aaaaaaaa-bbbb-cccc-dddd-0000000000b1');
  const first = built(Correct.deductDoc(Object.assign({ targetId: approval.id, amount: 100000, reason: 'سبب' }, WHO)), 'd1');
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', String(first.id)), wire(first)));
  remember(first);
  const rev = built(Correct.reversalDoc(Object.assign({ targetId: first.id, reason: 'سبب' }, WHO)), 'rev d1');
  const released = {
    id: 'd2' + approval.id, docType: 'accountTxn', kind: 'body', purpose: 'deduct', projectId: PROJECT, partyId: PARTY,
    ledger: 'labor', currency: 'IQD', fxRate: 1, amount: 50000, cumAmount: 50000, targetId: approval.id,
    txnDate: '2026-11-22', description: 'سبب', createdBy: OWNER, deviceId: 'phone',
  };
  let thrown = false;
  const held = await flush([String(rev.id), released.id], [rev, released], async local => {
    if (!thrown && String(local.id).indexOf('rev_') === 0) {
      thrown = true;
      const err = new Error('offline');
      err.code = 'unavailable';
      throw err;
    }
  });
  assert.deepEqual(held.writes, [String(rev.id)]);
  assert.equal(held.result.kept.includes(rev.id), true);
  assert.equal(held.result.kept.includes(released.id), true);
  assert.equal((await getDoc(doc(db(OWNER), 'accountTxns', released.id))).exists(), false);
  const second = await flush([String(rev.id), released.id], [rev, released]);
  assert.deepEqual(second.writes, [String(rev.id), released.id]);
  assert.equal(second.result.failed.length, 0);
  assert.equal((await getDoc(doc(db(OWNER), 'accountTxns', released.id))).data().cumAmount, 50000);

  await seedBase();
  const again = await putUnit('aaaaaaaa-bbbb-cccc-dddd-0000000000b1');
  const kept = built(Correct.deductDoc(Object.assign({ targetId: again.id, amount: 100000, reason: 'سبب' }, WHO)), 'kept d1');
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', String(kept.id)), wire(kept)));
  remember(kept);
  const ahead = {
    id: 'd2' + again.id, docType: 'accountTxn', kind: 'body', purpose: 'deduct', projectId: PROJECT, partyId: PARTY,
    ledger: 'labor', currency: 'IQD', fxRate: 1, amount: 50000, cumAmount: 150000, targetId: again.id,
    txnDate: '2026-11-22', description: 'سبب', createdBy: OWNER, deviceId: 'phone',
  };
  const later = built(Correct.reversalDoc(Object.assign({ targetId: kept.id, reason: 'سبب' }, WHO)), 'later rev');
  const once = await flush([ahead.id, String(later.id)], [ahead, later]);
  assert.deepEqual(once.writes, [ahead.id, String(later.id)]);
  assert.equal(once.result.kept.length, 0);
  assert.equal(once.result.failed.length, 0);
  const third = {
    id: 'd3' + again.id, kind: 'body', purpose: 'deduct', projectId: PROJECT, partyId: PARTY, ledger: 'labor',
    currency: 'IQD', fxRate: 1, amount: 1000, cumAmount: 151000, targetId: again.id, txnDate: '2026-11-22', description: 'سبب',
  };
  await assertSucceeds(setDoc(doc(db(OWNER), 'accountTxns', third.id), row(third)));
  assert.equal((await getDoc(doc(db(OWNER), 'accountTxns', third.id))).data().cumAmount, 151000);
});

test('steps 12 and 12b: a forged cum is refused and the docs queued behind it are refused unwritten', async () => {
  await seedBase();
  const approval = await putUnit('aaaaaaaa-bbbb-cccc-dddd-0000000000b1');
  const other = measurement('aaaaaaaa-bbbb-cccc-dddd-0000000000b2', AG, 6);
  await send('accountTxns', other.id, other);
  remember(other);
  const second = approvalOf(other.id, AG, 600000, 6);
  await send('accountTxns', second.id, second);
  remember(second);
  const forged = {
    id: 'd1' + approval.id, docType: 'accountTxn', kind: 'body', purpose: 'deduct', projectId: PROJECT, partyId: PARTY,
    ledger: 'labor', currency: 'IQD', fxRate: 1, amount: 50000, cumAmount: 1, targetId: approval.id,
    txnDate: '2026-11-22', description: 'سبب', createdBy: OWNER, deviceId: 'phone',
  };
  await assertFails(setDoc(doc(db(OWNER), 'accountTxns', forged.id), wire(forged)));
  remember(forged);
  store.syncErrors = { [forged.id]: REFUSED };
  const pos = Correct.deductPosition(approval.id, 1);
  assert.equal(pos.error, 'blocked');
  const line = Correct.noMoreDeductLine(approval.id, 'blocked');
  assert.equal(line.includes(S11), true);
  assert.equal(line.includes(S13), true);

  const appr = {
    id: 'appr_' + forged.id, docType: 'accountTxn', kind: 'appr', purpose: 'approveDeduct', projectId: PROJECT,
    partyId: PARTY, ledger: 'labor', currency: 'IQD', fxRate: 1, targetId: forged.id, createdBy: OWNER, deviceId: 'phone',
  };
  const behind = {
    id: 'd2' + approval.id, docType: 'accountTxn', kind: 'body', purpose: 'deduct', projectId: PROJECT, partyId: PARTY,
    ledger: 'labor', currency: 'IQD', fxRate: 1, amount: 10000, cumAmount: 60000, targetId: approval.id,
    txnDate: '2026-11-22', description: 'سبب', createdBy: OWNER, deviceId: 'phone',
  };
  const flushed = await flush([forged.id, appr.id, behind.id], [forged, appr, behind]);
  assert.deepEqual(flushed.writes, [forged.id]);
  assert.equal(flushed.result.failed.length, 3);
  for (const id of [forged.id, appr.id, behind.id]) {
    assert.equal(flushed.result.failed.some(row => row.id === id && row.message === REFUSED), true, id);
  }
  assert.equal(flushed.writes.includes(appr.id), false);
  assert.equal(flushed.writes.includes(behind.id), false);
  const applied = Status.applyFlush([forged.id, appr.id, behind.id], {}, flushed.result);
  const listed = refusalDocs([forged, appr, behind], applied.errors, {});
  assert.deepEqual(listed.map(row => row.id).sort(), [appr.id, behind.id, forged.id].sort());
  assert.equal(Ledger.rejectedLogoutBlocked(listed, []), true);
  assert.equal(Ledger.rejectedLogoutBlocked(listed, [forged.id, appr.id, behind.id]), false);
});
