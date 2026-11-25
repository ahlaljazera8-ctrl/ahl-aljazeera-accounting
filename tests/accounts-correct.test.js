const test = require('node:test');
const assert = require('node:assert/strict');

const Ledger = require('../public/ledger.js');
const Accounts = require('../public/accounts.js');
const DomSafe = require('../public/dom-safe.js');
const Sync = require('../public/sync.js');

/** @type {any} */
const g = globalThis;
g.Ledger = Ledger;
g.Accounts = Accounts;
g.DomSafe = DomSafe;
g.Sync = Sync;

const store = {
  parties: /** @type {any[]} */ ([]),
  agreements: /** @type {any[]} */ ([]),
  accountTxns: /** @type {any[]} */ ([]),
  projects: /** @type {any[]} */ ([]),
  entries: /** @type {any[]} */ ([]),
  outbox: /** @type {string[]} */ ([]),
  syncErrors: /** @type {Record<string, unknown>} */ ({}),
};
g.K = {
  parties: 'parties',
  agreements: 'agreements',
  accountTxns: 'accountTxns',
  projects: 'projects',
  entries: 'entries',
  outbox: 'outbox',
  syncErrors: 'syncErrors',
};
g.get = (key, fallback) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallback);
g.set = (key, value) => {
  store[key] = value;
  return Promise.resolve();
};
g.me = () => ({ uid: 'u-ameer', role: 'owner', active: true, displayName: 'أمير' });
g.uuid = () => 'aaaaaaaa-bbbb-cccc-dddd-000000000001';
g.today = () => '2026-11-22';
g.deviceId = 'phone';
g.demoRole = () => '';
g.queueDoc = id => {
  if (!store.outbox.includes(id)) store.outbox = store.outbox.concat([id]);
};

/** @type {Record<string, any>} */
let nodes = {};
/** @type {{ type: string, fn: (event: any) => void }[]} */
const listeners = [];
g.document = {
  addEventListener: (type, fn) => {
    listeners.push({ type, fn });
  },
  querySelector: sel => nodes[String(sel || '').replace(/^#/, '')] || null,
  querySelectorAll: () => [],
  createElement: () => ({}),
  createElementNS: () => ({}),
};

const UI = require('../public/accounts-view.js');
g.AccountsView = UI;
const Work = require('../public/accounts-work.js');
const Pay = require('../public/accounts-payment.js');
g.AccountPayment = Pay;
const Correct = /** @type {any} */ (require('../public/accounts-correct.js'));

const AG = 'ag-unit';
const SLOT_AG = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const M1 = '11111111-2222-3333-4444-555555555555';
const M2 = '22222222-2222-3333-4444-555555555555';
const M3 = '33333333-2222-3333-4444-555555555555';
const WHO = { createdBy: 'u-ameer', deviceId: 'phone', createdByName: 'أمير' };
const REFUSED = 'رُفض الإرسال';
const S5 = 'اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً';
const S5_OLD = 'اعكس الاسترداد أو الإرجاع أو الخصم المرتبط أولاً';
const S10 = 'هذا القياس وصل حد 9 خصومات.';
const S11 = 'رُفض إرسال خصم على هذا القياس.';
const S12 = 'ما بقى مجال خصم على هذا القياس.';
const S13 = 'سجّل الخصم على قياس معتمد ثاني لنفس الاتفاق.';
const S14 = 'ما أكو قياس معتمد ثاني: اعكس الخصومات ثم الاعتماد، وسجّل قياس جديد.';
const OVER = 'الخصم أكبر من العمل المعتمد';

function reset() {
  nodes = {};
  store.parties = [{ id: 'party-1', name: 'حسن' }];
  store.agreements = [];
  store.accountTxns = [];
  store.projects = [{ id: 'p-school', name: 'مشروع المدرسة', status: 'active' }];
  store.entries = [];
  store.outbox = [];
  store.syncErrors = {};
  Accounts.CONTRACTOR_COST_START = null;
  g.today = () => '2026-11-22';
  g.me = () => ({ uid: 'u-ameer', role: 'owner', active: true, displayName: 'أمير' });
}

/**
 * @param {string | null} start
 * @param {() => void} fn
 */
function withStart(start, fn) {
  const prev = Accounts.CONTRACTOR_COST_START;
  Accounts.CONTRACTOR_COST_START = start;
  try {
    fn();
  } finally {
    Accounts.CONTRACTOR_COST_START = prev;
  }
}

function api() {
  return {
    views: /** @type {Record<string, (arg?: string) => string>} */ ({}),
    titles: /** @type {Record<string, string>} */ ({}),
    state: {},
    render() {},
    esc: s => String(s ?? ''),
    money: n => Ledger.fmt(n) + ' د.ع',
    queueDoc: g.queueDoc,
    confirmShell: () => '',
    lastSyncAt: () => 0,
    formatSyncTime: () => '',
  };
}

function installAll() {
  const next = api();
  UI.install(next);
  Work.install(next);
  Pay.install(next);
  Correct.install(next);
  return next;
}

/**
 * @param {Record<string, string>} map
 */
function setFields(map) {
  for (const [id, value] of Object.entries(map)) {
    nodes[id] = { id, value, disabled: false, dataset: {}, selectionStart: value.length, selectionEnd: value.length };
  }
}

/**
 * @param {string} id
 * @param {Record<string, string>} [dataset]
 * @param {boolean} [disabled]
 */
function click(id, dataset, disabled) {
  const button = { id, disabled: !!disabled, dataset: dataset || {} };
  UI.onClick(/** @type {any} */ (button));
  return button;
}

/**
 * @param {any} el
 * @param {string} text
 */
function typeInto(el, text) {
  el.selectionStart = 0;
  el.selectionEnd = 0;
  el.value = '';
  for (const ch of text) {
    const at = el.selectionStart;
    el.value = el.value.slice(0, at) + ch + el.value.slice(el.selectionEnd);
    el.selectionStart = at + ch.length;
    el.selectionEnd = el.selectionStart;
    for (const item of listeners) {
      if (item.type === 'input') item.fn({ target: el, type: 'input' });
    }
  }
}

/**
 * @param {string} [id]
 * @param {Record<string, unknown>} [extra]
 * @returns {any}
 */
function agreement(id, extra) {
  return Object.assign({
    id: id || AG,
    partyId: 'party-1',
    projectId: 'p-school',
    method: 'unit',
    description: 'طابوق',
    currency: 'IQD',
    unitRate: 25000,
    unitQty: 100,
    unitName: 'طوبة',
  }, extra);
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} [extra]
 * @returns {any}
 */
function labor(id, extra) {
  return Object.assign({
    id,
    docType: 'accountTxn',
    kind: 'body',
    purpose: 'laborQty',
    ledger: 'labor',
    agreementId: AG,
    partyId: 'party-1',
    projectId: 'p-school',
    currency: 'IQD',
    fxRate: 1,
    qty: 4,
    txnDate: '2026-11-22',
  }, extra);
}

/**
 * @param {string} id
 * @param {string} targetId
 * @param {number} amount
 * @param {Record<string, unknown>} [extra]
 * @returns {any}
 */
function approval(id, targetId, amount, extra) {
  return Object.assign({
    id,
    docType: 'accountTxn',
    kind: 'appr',
    purpose: 'approveLabor',
    ledger: 'labor',
    targetId,
    agreementId: AG,
    partyId: 'party-1',
    projectId: 'p-school',
    currency: 'IQD',
    fxRate: 1,
    amount,
    txnDate: '2026-11-22',
  }, extra);
}

/**
 * @param {string} id
 * @param {string} targetId
 * @param {number} amount
 * @param {number} cumAmount
 * @param {Record<string, unknown>} [extra]
 * @returns {any}
 */
function deduct(id, targetId, amount, cumAmount, extra) {
  return Object.assign({
    id,
    docType: 'accountTxn',
    kind: 'body',
    purpose: 'deduct',
    ledger: 'labor',
    targetId,
    partyId: 'party-1',
    projectId: 'p-school',
    currency: 'IQD',
    fxRate: 1,
    amount,
    cumAmount,
    txnDate: '2026-11-22',
    description: 'سبب',
  }, extra);
}

/**
 * @param {string} id
 * @param {string} purpose
 * @param {Record<string, unknown>} [extra]
 * @returns {any}
 */
function cash(id, purpose, extra) {
  return Object.assign({
    id,
    docType: 'accountTxn',
    kind: 'body',
    purpose,
    ledger: 'labor',
    partyId: 'party-1',
    projectId: 'p-school',
    currency: 'IQD',
    fxRate: 1,
    amount: 150000,
    txnDate: '2026-11-22',
  }, extra);
}

/**
 * @param {string} agreementId
 * @param {number} gen
 */
function slotId(agreementId, gen) {
  return '000' + String(agreementId).replace(/-/g, '') + String(gen);
}

function seedUnit() {
  store.agreements = [agreement()];
  store.accountTxns = [labor(M1), approval('appr_m1', M1, 600000)];
}

function open(view, id) {
  return view.views.contractor(id || AG);
}

function pendingIds() {
  return Accounts.balances(store.accountTxns, {
    partyId: 'party-1',
    projectId: 'p-school',
    syncErrors: store.syncErrors,
  }).pendingIds;
}

function balances() {
  return Accounts.balances(store.accountTxns, {
    partyId: 'party-1',
    projectId: 'p-school',
    syncErrors: store.syncErrors,
  });
}

function accountPage(view, tab) {
  if (tab) click('pill-' + tab, { acctab: tab });
  return view.views.account('party-1');
}

/**
 * @param {Record<string, unknown>} doc
 */
function keptKeys(doc) {
  return Object.keys(doc).filter(key => key !== 'docType' && key !== 'effect' && doc[key] != null);
}

test('T-I1 deduct and approve-deduct shapes', () => {
  reset();
  seedUnit();
  const deductDoc = Correct.deductDoc(Object.assign({ targetId: 'appr_m1', amount: 50000, reason: 'خصم دين' }, WHO));
  assert.equal(deductDoc.errors.length, 0);
  assert.equal(deductDoc.doc && deductDoc.doc.id, 'd1appr_m1');
  assert.equal(deductDoc.doc && deductDoc.doc.cumAmount, 50000);
  assert.equal(deductDoc.doc && deductDoc.doc.targetId, 'appr_m1');
  assert.equal(deductDoc.doc && deductDoc.doc.amount, 50000);
  store.accountTxns = store.accountTxns.concat([deductDoc.doc]);
  const approved = Correct.approveDeductDoc(Object.assign({ targetId: 'd1appr_m1' }, WHO));
  assert.equal(approved.errors.length, 0);
  assert.equal(approved.doc && approved.doc.id, 'appr_d1appr_m1');
  assert.equal(approved.doc && Object.prototype.hasOwnProperty.call(approved.doc, 'amount'), false);
  assert.equal(approved.doc && Object.prototype.hasOwnProperty.call(approved.doc, 'txnDate'), false);
});

test('T-I2 cap and cumulative', () => {
  reset();
  seedUnit();
  const over = Correct.deductDoc(Object.assign({ targetId: 'appr_m1', amount: 600001, reason: 'سبب' }, WHO));
  assert.deepEqual(over.errors, ['cap']);
  store.accountTxns = store.accountTxns.concat([deduct('d1appr_m1', 'appr_m1', 550000, 550000)]);
  const second = Correct.deductDoc(Object.assign({ targetId: 'appr_m1', amount: 60000, reason: 'سبب' }, WHO));
  assert.deepEqual(second.errors, ['cumulative']);
  store.accountTxns = [labor(M1), approval('appr_m1', M1, 600000), deduct('d1appr_m1', 'appr_m1', 550000, 550000), {
    id: 'appr_d1appr_m1', docType: 'accountTxn', kind: 'appr', purpose: 'approveDeduct', ledger: 'labor', targetId: 'd1appr_m1',
    partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1,
  }, deduct('d2appr_m1', 'appr_m1', 60000, 610000)];
  const crossed = Correct.approveDeductDoc(Object.assign({ targetId: 'd2appr_m1' }, WHO));
  assert.deepEqual(crossed.errors, ['cumulative']);
});

test('T-I3 syncErrors ids are not offered', () => {
  reset();
  seedUnit();
  store.syncErrors = { appr_m1: REFUSED };
  const view = installAll();
  withStart('2026-11-01', () => {
    const html = open(view);
    assert.equal(html.includes('id="cc-deduct"'), false);
    assert.deepEqual(Correct.deductDoc(Object.assign({ targetId: 'appr_m1', amount: 1, reason: 'سبب' }, WHO)).errors, ['targetId']);
    store.syncErrors = { [M1]: REFUSED };
    store.accountTxns = [labor(M1)];
    const again = open(view);
    assert.equal(again.includes('id="act-reject-' + M1 + '"'), false);
    assert.deepEqual(Correct.rejectDoc(Object.assign({ targetId: M1 }, WHO)).errors, ['targetId']);
  });
});

test('T-I4 reject shape', () => {
  reset();
  store.agreements = [agreement()];
  store.accountTxns = [labor(M2)];
  const built = Correct.rejectDoc(Object.assign({ targetId: M2 }, WHO));
  assert.equal(built.doc && built.doc.id, 'rej_' + M2);
  const remote = Sync.toRemote(/** @type {any} */ (built.doc));
  for (const key of keptKeys(/** @type {any} */ (built.doc))) assert.equal(Object.prototype.hasOwnProperty.call(remote, key), true, key);
  store.accountTxns = [cash('pay1', 'payLabor')];
  assert.deepEqual(Correct.rejectDoc(Object.assign({ targetId: 'pay1' }, WHO)).errors, ['method']);
  store.accountTxns = [labor(M2), approval('appr_' + M2, M2, 1000)];
  assert.deepEqual(Correct.rejectDoc(Object.assign({ targetId: M2 }, WHO)).errors, ['approved']);
});

test('T-I5 supersede copies, and the refusals', () => {
  reset();
  store.agreements = [agreement()];
  store.accountTxns = [labor(M2, { qty: 4 })];
  const built = Correct.supersedeDoc(Object.assign({ targetId: M2, qty: 9 }, WHO));
  assert.equal(built.errors.length, 0);
  const doc = /** @type {Record<string, unknown>} */ (built.doc);
  assert.equal(doc.qty, 9);
  for (const key of ['purpose', 'ledger', 'partyId', 'projectId', 'agreementId', 'currency', 'fxRate']) {
    assert.equal(doc[key], labor(M2)[key], key);
  }
  const deep = 'sup_'.repeat(4) + M2;
  store.accountTxns = [labor(deep, { kind: 'sup' })];
  assert.deepEqual(Correct.supersedeDoc(Object.assign({ targetId: deep, qty: 2 }, WHO)).errors, ['method']);
  const slot = slotId(SLOT_AG, 1);
  store.accountTxns = [labor(slot)];
  assert.deepEqual(Correct.supersedeDoc(Object.assign({ targetId: slot, qty: 2 }, WHO)).errors, ['method']);
  store.accountTxns = [cash('pay1', 'payLabor')];
  assert.deepEqual(Correct.supersedeDoc(Object.assign({ targetId: 'pay1', qty: 2 }, WHO)).errors, ['method']);
  store.accountTxns = [labor(M2), approval('appr_' + M2, M2, 1000)];
  assert.deepEqual(Correct.supersedeDoc(Object.assign({ targetId: M2, qty: 2 }, WHO)).errors, ['method']);
  store.agreements = [agreement(), { id: 'rev_' + AG, reversesId: AG, partyId: 'party-1', projectId: 'p-school' }];
  store.accountTxns = [labor(M2)];
  assert.deepEqual(Correct.supersedeDoc(Object.assign({ targetId: M2, qty: 2 }, WHO)).errors, ['cancelled']);
});

test('T-I6 reversal shape', () => {
  reset();
  store.accountTxns = [cash('pay1', 'payLabor', { amount: 150000 })];
  store.syncErrors = { pay1: REFUSED };
  assert.deepEqual(Correct.reversalDoc(Object.assign({ targetId: 'pay1', reason: 'سبب' }, WHO)).errors, ['targetId']);
  store.syncErrors = {};
  const pay = Correct.reversalDoc(Object.assign({ targetId: 'pay1', reason: 'سبب' }, WHO));
  assert.equal(pay.doc && pay.doc.amount, 150000);
  assert.equal(pay.doc && Object.prototype.hasOwnProperty.call(pay.doc, 'txnDate'), false);
  store.accountTxns = [deduct('d1appr_m1', 'appr_m1', 50000, 50000), {
    id: 'appr_d1appr_m1', docType: 'accountTxn', kind: 'appr', purpose: 'approveDeduct', ledger: 'labor',
    targetId: 'd1appr_m1', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1,
  }];
  const mark = Correct.reversalDoc(Object.assign({ targetId: 'appr_d1appr_m1', reason: 'سبب' }, WHO));
  assert.equal(mark.doc && Object.prototype.hasOwnProperty.call(mark.doc, 'amount'), false);
  assert.equal(mark.doc && Object.prototype.hasOwnProperty.call(mark.doc, 'txnDate'), false);
  store.accountTxns = store.accountTxns.concat([pay.doc]);
  assert.deepEqual(Correct.reversalDoc(Object.assign({ targetId: pay.doc && pay.doc.id, reason: 'سبب' }, WHO)).errors, ['kind']);
  store.accountTxns = [{ id: 'rej_' + M2, docType: 'accountTxn', kind: 'rej', targetId: M2 }];
  assert.deepEqual(Correct.reversalDoc(Object.assign({ targetId: 'rej_' + M2, reason: 'سبب' }, WHO)).errors, ['kind']);
  store.accountTxns = [cash('pay1', 'payLabor')];
  assert.deepEqual(Correct.reversalDoc(Object.assign({ targetId: 'pay1', reason: '   ' }, WHO)).errors, ['reason']);
  assert.deepEqual(Correct.reversalDoc(Object.assign({ targetId: 'pay1', reason: 'س'.repeat(501) }, WHO)).errors, ['reason']);
});

test('T-I7 two taps append each document once and the deduct id stays fixed', () => {
  reset();
  seedUnit();
  store.accountTxns = store.accountTxns.concat([labor(M2), labor(M3), cash('pay1', 'payLabor')]);
  const view = installAll();
  withStart('2026-11-01', () => {
    setFields({ 'cc-deduct': '50000', 'cc-ded-reason': 'سبب', 'cc-reason': 'سبب', 'cc-sup-qty': '3' });
    open(view);
    const before = store.accountTxns.length;
    const button = { id: 'act-deduct', disabled: false, dataset: { cctarget: 'appr_m1' } };
    let disabledDuring = false;
    const orig = g.set;
    g.set = (key, value) => {
      if (key === 'accountTxns') disabledDuring = button.disabled === true;
      return orig(key, value);
    };
    UI.onClick(/** @type {any} */ (button));
    UI.onClick(/** @type {any} */ (button));
    g.set = orig;
    assert.equal(disabledDuring, true);
    assert.equal(store.accountTxns.length, before + 1);
    assert.equal(store.accountTxns[store.accountTxns.length - 1].id, 'd1appr_m1');
    assert.equal(store.outbox.filter(id => id === 'd1appr_m1').length, 1);

    /** @type {Array<[string, string, Record<string, string>]>} */
    const pairs = [
      ['act-approve-deduct-d1appr_m1', 'appr_d1appr_m1', {}],
      ['act-supersede-' + M3, 'sup_' + M3, { ccSup: M3 }],
      ['act-reject-' + M2, 'rej_' + M2, { ccRej: M2 }],
      ['act-reverse-pay1', 'rev_pay1', { ccRev: 'pay1' }],
    ];
    for (const [id, docId, dataset] of pairs) {
      const count = store.accountTxns.length;
      const el = { id, disabled: false, dataset };
      UI.onClick(/** @type {any} */ (el));
      UI.onClick(/** @type {any} */ (el));
      assert.equal(store.accountTxns.filter(row => row.id === docId).length, 1, docId);
      assert.equal(store.outbox.filter(item => item === docId).length, 1, docId);
      assert.equal(store.accountTxns.length, count + 1, docId);
    }

    store.accountTxns = [labor(M2), approval('appr_' + M2, M2, 1000)];
    store.outbox = [];
    open(view);
    const end = { id: 'act-reverse-appr_' + M2, disabled: false, dataset: { ccRev: 'appr_' + M2 } };
    UI.onClick(/** @type {any} */ (end));
    UI.onClick(/** @type {any} */ (end));
    assert.deepEqual(store.accountTxns.map(row => row.id).slice(-2), ['rev_appr_' + M2, 'rev_' + M2]);
    assert.equal(store.outbox.filter(id => id === 'rev_appr_' + M2).length, 1);
    assert.equal(store.outbox.filter(id => id === 'rev_' + M2).length, 1);
  });
});

test('T-I8 حسابات does not paint contractor correction buttons', () => {
  reset();
  seedUnit();
  const view = installAll();
  withStart('2026-11-01', () => {
    open(view);
    for (const tab of ['overview', 'agreements', 'movements', 'statement']) {
      const html = accountPage(view, tab);
      for (const id of ['act-deduct', 'act-approve-deduct', 'act-reject', 'act-supersede', 'act-reverse']) {
        assert.equal(html.includes('id="' + id + '"'), false, tab + ' ' + id);
      }
    }
  });
});

test('T-I9 builder keys are a subset of Sync.toRemote, and rev has no txnDate', () => {
  reset();
  seedUnit();
  store.accountTxns = store.accountTxns.concat([labor(M2), cash('pay1', 'payLabor', { amount: 10 })]);
  const samples = [
    Correct.deductDoc(Object.assign({ targetId: 'appr_m1', amount: 50000, reason: 'سبب' }, WHO)).doc,
    null,
  ];
  const deductDoc = samples[0];
  store.accountTxns = store.accountTxns.concat([deductDoc]);
  const docs = [
    deductDoc,
    Correct.approveDeductDoc(Object.assign({ targetId: 'd1appr_m1' }, WHO)).doc,
    Correct.rejectDoc(Object.assign({ targetId: M2 }, WHO)).doc,
    Correct.supersedeDoc(Object.assign({ targetId: M2, qty: 2 }, WHO)).doc,
    Correct.reversalDoc(Object.assign({ targetId: 'pay1', reason: 'سبب' }, WHO)).doc,
  ];
  for (const doc of docs) {
    assert.ok(doc);
    const remote = Sync.toRemote(/** @type {any} */ (doc));
    for (const key of keptKeys(/** @type {any} */ (doc))) {
      assert.equal(Object.prototype.hasOwnProperty.call(remote, key), true, key);
    }
  }
  const rev = docs[4];
  assert.equal(rev && Object.prototype.hasOwnProperty.call(rev, 'txnDate'), false);
  const unnamed = Correct.reversalDoc({ targetId: 'pay1', reason: 'سبب', createdBy: 'u-ameer', deviceId: 'phone' });
  assert.equal(unnamed.doc && Object.prototype.hasOwnProperty.call(unnamed.doc, 'createdByName'), false);
});

test('T-I10 G hides rejected, superseded, and approval-reversed measurements', () => {
  reset();
  store.agreements = [agreement()];
  const view = installAll();
  withStart('2026-11-01', () => {
    store.accountTxns = [labor(M2), { id: 'rej_' + M2, docType: 'accountTxn', kind: 'rej', targetId: M2 }];
    const rejected = open(view);
    assert.equal(rejected.includes('id="act-approve-labor"'), false);

    store.accountTxns = [labor('sup_' + M2, { kind: 'sup', qty: 7, supersedesId: M2 }), labor(M2, { qty: 3 })];
    const copied = open(view);
    assert.equal(copied.includes('>7<'), true);
    assert.equal(copied.includes('id="act-approve-labor"'), true);
    click('act-approve-labor');
    assert.equal(store.accountTxns.some(row => row.id === 'appr_sup_' + M2), true);
    assert.equal(store.accountTxns.some(row => row.id === 'appr_' + M2), false);

    store.accountTxns = [labor(M2), approval('appr_' + M2, M2, 1000), {
      id: 'rev_appr_' + M2, docType: 'accountTxn', kind: 'rev', purpose: 'approveLabor', ledger: 'labor',
      reversesId: 'appr_' + M2, reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1,
    }];
    const ended = open(view);
    assert.equal(ended.includes('id="act-approve-labor"'), false);
  });
});

test('T-I11 slot generations and no new copy on a lump', () => {
  reset();
  store.agreements = [agreement(SLOT_AG, { method: 'lump', lumpAmount: 600000, unitRate: undefined })];
  const view = installAll();
  withStart('2026-11-01', () => {
    const gen1 = slotId(SLOT_AG, 1);
    store.accountTxns = [labor(gen1, { agreementId: SLOT_AG }), { id: 'rej_' + gen1, docType: 'accountTxn', kind: 'rej', targetId: gen1 }];
    const rejected = open(view, SLOT_AG);
    assert.equal(rejected.includes('المحاولة 2 من 9'), true);
    assert.equal(rejected.includes('نسخة جديدة'), false);

    store.accountTxns = [
      labor(gen1, { agreementId: SLOT_AG }),
      approval('appr_' + gen1, gen1, 600000, { agreementId: SLOT_AG }),
      { id: 'rev_appr_' + gen1, docType: 'accountTxn', kind: 'rev', purpose: 'approveLabor', ledger: 'labor', reversesId: 'appr_' + gen1, reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1 },
    ];
    const reversed = open(view, SLOT_AG);
    assert.equal(reversed.includes('المحاولة 2 من 9'), true);

    const ids = [];
    for (let gen = 1; gen <= 9; gen += 1) {
      const id = slotId(SLOT_AG, gen);
      ids.push(labor(id, { agreementId: SLOT_AG }));
      ids.push({ id: 'rej_' + id, docType: 'accountTxn', kind: 'rej', targetId: id });
    }
    store.accountTxns = ids;
    const last = open(view, SLOT_AG);
    assert.equal(last.includes('id="act-labor-qty"'), false);
  });
});

test('T-I12 a refused fixed id stays off and queues nothing', () => {
  reset();
  seedUnit();
  store.accountTxns = store.accountTxns.concat([
    cash('pay1', 'payLabor'),
    labor(M2),
    deduct('d1appr_m1', 'appr_m1', 50000, 50000),
  ]);
  store.syncErrors = {
    rev_pay1: REFUSED,
    ['rej_' + M2]: REFUSED,
    ['sup_' + M2]: REFUSED,
    appr_d1appr_m1: REFUSED,
  };
  const view = installAll();
  withStart('2026-11-01', () => {
    setFields({ 'cc-reason': 'سبب', 'cc-sup-qty': '2', 'cc-ded-reason': 'سبب' });
    const html = open(view);
    const before = store.accountTxns.length;
    const outbox = store.outbox.slice();
    for (const id of ['act-reverse-pay1', 'act-reject-' + M2, 'act-supersede-' + M2, 'act-approve-deduct-d1appr_m1']) {
      assert.equal(html.includes('id="' + id + '"'), true, id);
      assert.match(html, new RegExp('id="' + id + '"[^>]*disabled'), id);
    }
    click('act-reverse-pay1', { ccRev: 'pay1' }, true);
    click('act-reject-' + M2, { ccRej: M2 }, true);
    click('act-supersede-' + M2, { ccSup: M2 }, true);
    click('act-approve-deduct-d1appr_m1', {}, true);
    assert.equal(store.accountTxns.length, before);
    assert.deepEqual(store.outbox, outbox);
  });
});

test('T-I13 a null start hides the buttons and save paths append nothing', () => {
  reset();
  seedUnit();
  store.accountTxns = store.accountTxns.concat([labor(M2), cash('pay1', 'payLabor')]);
  const view = installAll();
  const html = open(view);
  for (const id of ['act-deduct', 'act-approve-deduct', 'act-reject', 'act-supersede', 'act-reverse']) {
    assert.equal(html.includes(id), false, id);
  }
  const before = store.accountTxns.length;
  click('act-deduct', { cctarget: 'appr_m1' });
  click('act-approve-deduct-d1', {});
  click('act-reject-' + M2, { ccRej: M2 });
  click('act-supersede-' + M2, { ccSup: M2 });
  click('act-reverse-pay1', { ccRev: 'pay1' });
  assert.equal(store.accountTxns.length, before);
  assert.equal(store.outbox.length, 0);
});

test('T-I14 a counting deduct changes the due, not project cost', () => {
  reset();
  seedUnit();
  const start = '2026-11-01';
  const cost = () => Accounts.projectCost('p-school', 0, store.accountTxns, store.syncErrors, start);
  const before = cost();
  const beforeNet = balances().net;
  store.accountTxns = store.accountTxns.concat([
    deduct('d1appr_m1', 'appr_m1', 50000, 50000),
    { id: 'appr_d1appr_m1', docType: 'accountTxn', kind: 'appr', purpose: 'approveDeduct', ledger: 'labor', targetId: 'd1appr_m1', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1 },
  ]);
  assert.equal(cost(), before);
  assert.equal(balances().deductions, 50000);
  assert.equal(balances().net, beforeNet - 50000);
  store.accountTxns = store.accountTxns.concat([{
    id: 'rev_appr_m1', docType: 'accountTxn', kind: 'rev', purpose: 'approveLabor', ledger: 'labor',
    reversesId: 'appr_m1', reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1,
  }]);
  assert.equal(cost(), before - 600000);
});

test('T-I15 a payment with a live refund explains instead of reversing', () => {
  reset();
  seedUnit();
  store.accountTxns = store.accountTxns.concat([
    cash('pay1', 'payLabor'),
    cash('refund1', 'refundLabor', { targetId: 'pay1', amount: 1000 }),
  ]);
  const view = installAll();
  withStart('2026-11-01', () => {
    const blocked = open(view);
    assert.equal(blocked.includes('id="act-reverse-pay1"'), false);
    assert.equal(blocked.includes(S5), true);
    assert.equal(blocked.includes(S5_OLD), false);
    store.accountTxns = store.accountTxns.concat([{
      id: 'rev_refund1', docType: 'accountTxn', kind: 'rev', purpose: 'refundLabor', ledger: 'labor', amount: 1000,
      reversesId: 'refund1', reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1,
    }]);
    setFields({ 'cc-reason': 'سبب' });
    const openAgain = open(view);
    assert.equal(openAgain.includes('id="act-reverse-pay1"'), true);
  });
});

test('T-I16 grouped deduct digits save the integer and keep 2,5', () => {
  reset();
  seedUnit();
  const view = installAll();
  withStart('2026-11-01', () => {
    setFields({ 'cc-deduct': '', 'cc-ded-reason': 'سبب' });
    const box = nodes['cc-deduct'];
    typeInto(box, '١٥٠٠٠٠');
    assert.equal(box.value, '150,000');
    const html = open(view);
    assert.equal(html.includes('value="150,000"'), true);
    click('act-deduct', { cctarget: 'appr_m1' });
    const saved = store.accountTxns.find(row => row.purpose === 'deduct');
    assert.equal(saved && saved.amount, 150000);
    const count = store.accountTxns.length;
    typeInto(box, '2,5');
    assert.equal(box.value, '2,5');
    open(view);
    click('act-deduct', { cctarget: 'appr_m1' });
    assert.equal(store.accountTxns.length, count);
    assert.equal(nodes['cc-deduct'].value, '2,5');
  });
});

test('T-I17 a closed project turns every correction button off', () => {
  reset();
  seedUnit();
  store.projects = [{ id: 'p-school', name: 'مشروع المدرسة', status: 'closed' }];
  store.accountTxns = store.accountTxns.concat([labor(M2), cash('pay1', 'payLabor'), deduct('d1appr_m1', 'appr_m1', 1000, 1000)]);
  const view = installAll();
  withStart('2026-11-01', () => {
    setFields({ 'cc-reason': 'سبب', 'cc-ded-reason': 'سبب', 'cc-deduct': '1000', 'cc-sup-qty': '2' });
    const html = open(view);
    const before = store.accountTxns.length;
    for (const id of ['act-deduct', 'act-reject-' + M2, 'act-supersede-' + M2, 'act-approve-deduct-d1appr_m1', 'act-reverse-pay1']) {
      assert.match(html, new RegExp('id="' + id + '"[^>]*disabled'), id);
      click(id, { cctarget: 'appr_m1', ccRej: M2, ccSup: M2, ccRev: 'pay1' });
    }
    assert.equal(store.accountTxns.length, before);
  });
});

test('T-I18 a live deduct blocks the approval reversal and a reversed deduct is not pending', () => {
  reset();
  seedUnit();
  const row = deduct('d1appr_m1', 'appr_m1', 50000, 50000);
  const appr = { id: 'appr_d1appr_m1', docType: 'accountTxn', kind: 'appr', purpose: 'approveDeduct', ledger: 'labor', targetId: 'd1appr_m1', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1 };
  store.accountTxns = store.accountTxns.concat([row, appr]);
  const view = installAll();
  withStart('2026-11-01', () => {
    setFields({ 'cc-reason': 'سبب' });
    const html = open(view);
    assert.equal(html.includes('id="act-reverse-appr_m1"'), false);
    assert.equal(html.includes(S5), true);
    assert.equal(html.includes(S5_OLD), false);
    assert.equal(html.includes('id="act-reverse-d1appr_m1"'), true);
    assert.equal(html.includes('id="act-reverse-appr_d1appr_m1"'), false);
    store.accountTxns = store.accountTxns.concat([{
      id: 'rev_d1appr_m1', docType: 'accountTxn', kind: 'rev', purpose: 'deduct', ledger: 'labor', amount: 50000,
      reversesId: 'd1appr_m1', reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1,
    }]);
    assert.deepEqual(pendingIds(), []);
    const after = accountPage(view, 'movements');
    assert.equal(after.includes('بانتظار الاعتماد'), false);
    const again = open(view);
    assert.equal(again.includes('id="act-reverse-appr_m1"'), true);

    store.accountTxns = [labor(M1), approval('appr_m1', M1, 600000), deduct('d1appr_m1', 'appr_m1', 50000, 50000), {
      id: 'rej_d1appr_m1', docType: 'accountTxn', kind: 'rej', targetId: 'd1appr_m1',
    }];
    assert.deepEqual(pendingIds(), []);
    setFields({ 'cc-reason': 'سبب' });
    const cleared = open(view);
    assert.equal(cleared.includes('id="act-reverse-appr_m1"'), true);
    assert.deepEqual(Correct.approveDeductDoc(Object.assign({ targetId: 'd1appr_m1' }, WHO)).errors, ['targetId']);
  });
});

test('T-I19 one approval reversal ends the measurement', () => {
  reset();
  store.agreements = [agreement()];
  store.accountTxns = [labor(M2, { qty: 4 }), approval('appr_' + M2, M2, 100000)];
  const view = installAll();
  withStart('2026-11-01', () => {
    const beforeCost = Accounts.projectCost('p-school', 0, store.accountTxns, store.syncErrors, '2026-11-01');
    setFields({ 'cc-reason': 'سبب' });
    open(view);
    click('act-reverse-appr_' + M2, { ccRev: 'appr_' + M2 });
    const added = store.accountTxns.slice(-2);
    assert.deepEqual(added.map(row => row.id), ['rev_appr_' + M2, 'rev_' + M2]);
    assert.equal(added[0].reversalReason, 'سبب');
    assert.equal(added[1].reversalReason, 'سبب');
    assert.deepEqual(pendingIds(), []);
    assert.equal(balances().approvedLabor, 0);
    assert.equal(Accounts.projectCost('p-school', 0, store.accountTxns, store.syncErrors, '2026-11-01'), beforeCost - 100000);
    const accounts = accountPage(view, 'statement');
    assert.equal(accounts.includes('بانتظار الاعتماد'), false);
    const detail = open(view);
    assert.equal(detail.includes('بانتظار الاعتماد'), false);
    assert.equal(detail.includes('id="act-approve-labor"'), false);
    assert.equal(detail.includes('id="act-reverse-' + M2 + '"'), false);

    store.accountTxns = [labor(M2), approval('appr_' + M2, M2, 100000), {
      id: 'rev_appr_' + M2, docType: 'accountTxn', kind: 'rev', purpose: 'approveLabor', ledger: 'labor',
      reversesId: 'appr_' + M2, reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1,
    }];
    setFields({ 'cc-reason': 'سبب' });
    const recovery = open(view);
    assert.equal(recovery.includes('id="act-reverse-' + M2 + '"'), true);
    const count = store.accountTxns.length;
    click('act-reverse-' + M2, { ccRev: M2 });
    assert.deepEqual(store.accountTxns.slice(count).map(row => row.id), ['rev_' + M2]);
  });
});

test('T-I20 a negative net warns, then the second tap saves', () => {
  reset();
  seedUnit();
  store.accountTxns = store.accountTxns.concat([cash('pay1', 'payLabor', { amount: 150000 })]);
  const view = installAll();
  withStart('2026-11-01', () => {
    setFields({ 'cc-reason': 'سبب' });
    open(view);
    const before = store.accountTxns.length;
    click('act-reverse-appr_m1', { ccRev: 'appr_m1' });
    assert.equal(store.accountTxns.length, before);
    const warned = open(view);
    assert.equal(warned.includes('بعد العكس يصير مستحق عليه 150,000 د.ع'), true);
    click('act-reverse-appr_m1', { ccRev: 'appr_m1' });
    assert.equal(store.accountTxns.some(row => row.id === 'rev_appr_m1'), true);

    store.accountTxns = [labor(M1), approval('appr_m1', M1, 600000), cash('pay1', 'payLabor', { amount: 150001 })];
    const fresh = installAll();
    setFields({ 'cc-reason': 'سبب' });
    open(fresh);
    click('act-reverse-appr_m1', { ccRev: 'appr_m1' });
    assert.equal(open(fresh).includes('بعد العكس يصير مستحق عليه 150,001 د.ع'), true);

    store.accountTxns = [labor(M2), approval('appr_' + M2, M2, 1000)];
    const quiet = installAll();
    setFields({ 'cc-reason': 'سبب' });
    open(quiet);
    click('act-reverse-appr_' + M2, { ccRev: 'appr_' + M2 });
    assert.equal(store.accountTxns.some(row => row.id === 'rev_appr_' + M2), true);

    const bare = installAll();
    setFields({ 'cc-reason': '   ' });
    store.accountTxns = [labor(M2), approval('appr_' + M2, M2, 1000)];
    open(bare);
    const count = store.accountTxns.length;
    click('act-reverse-appr_' + M2, { ccRev: 'appr_' + M2 });
    assert.equal(store.accountTxns.length, count);
  });
});

test('T-I21 an empty deduct reason queues nothing and a real reason is description', () => {
  reset();
  seedUnit();
  assert.deepEqual(Correct.deductDoc(Object.assign({ targetId: 'appr_m1', amount: 10, reason: '  ' }, WHO)).errors, ['reason']);
  assert.equal(store.accountTxns.length, 2);
  const built = Correct.deductDoc(Object.assign({ targetId: 'appr_m1', amount: 10, reason: 'دين' }, WHO));
  assert.equal(built.doc && built.doc.description, 'دين');
  const remote = Sync.toRemote(/** @type {any} */ (built.doc));
  assert.equal(remote.description, 'دين');
});

test('T-I22 reject of a dead target is targetId', () => {
  reset();
  store.accountTxns = [labor(M2), {
    id: 'rev_' + M2, docType: 'accountTxn', kind: 'rev', purpose: 'laborQty', ledger: 'labor',
    reversesId: M2, reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1,
  }];
  assert.deepEqual(Correct.rejectDoc(Object.assign({ targetId: M2 }, WHO)).errors, ['targetId']);
  store.accountTxns = [labor(M2), { id: 'rej_' + M2, docType: 'accountTxn', kind: 'rej', targetId: M2 }];
  assert.deepEqual(Correct.rejectDoc(Object.assign({ targetId: M2 }, WHO)).errors, ['targetId']);
});

test('T-I23 an injected over-cap deduct warns and blocks approval', () => {
  reset();
  seedUnit();
  store.accountTxns = store.accountTxns.concat([
    deduct('d1appr_m1', 'appr_m1', 400000, 400000),
    { id: 'appr_d1appr_m1', docType: 'accountTxn', kind: 'appr', purpose: 'approveDeduct', ledger: 'labor', targetId: 'd1appr_m1', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1 },
    deduct('d2appr_m1', 'appr_m1', 400000, 800000),
  ]);
  assert.deepEqual(Correct.approveDeductDoc(Object.assign({ targetId: 'd2appr_m1' }, WHO)).errors, ['cumulative']);
  const view = installAll();
  withStart('2026-11-01', () => {
    const html = open(view);
    assert.equal(html.includes(OVER), true);
    const accounts = accountPage(view, 'movements');
    assert.equal(accounts.includes(OVER), true);
    store.accountTxns = store.accountTxns.concat([{
      id: 'rev_d2appr_m1', docType: 'accountTxn', kind: 'rev', purpose: 'deduct', ledger: 'labor', amount: 400000,
      reversesId: 'd2appr_m1', reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1,
    }]);
    assert.equal(open(view).includes(OVER), false);
    assert.equal(accountPage(view, 'movements').includes(OVER), false);
  });
});

test('T-I24 ending a sup chain reverses every link', () => {
  reset();
  store.agreements = [agreement()];
  const head = 'sup_sup_' + M2;
  store.accountTxns = [
    labor(M2),
    labor('sup_' + M2, { kind: 'sup', supersedesId: M2 }),
    labor(head, { kind: 'sup', supersedesId: 'sup_' + M2 }),
    approval('appr_' + head, head, 80000),
  ];
  const view = installAll();
  withStart('2026-11-01', () => {
    setFields({ 'cc-reason': 'سبب' });
    open(view);
    click('act-reverse-appr_' + head, { ccRev: 'appr_' + head });
    assert.deepEqual(store.accountTxns.slice(-4).map(row => row.id), [
      'rev_appr_' + head,
      'rev_' + head,
      'rev_sup_' + M2,
      'rev_' + M2,
    ]);
    assert.deepEqual(pendingIds(), []);
    store.accountTxns = [
      labor(M2),
      labor('sup_' + M2, { kind: 'sup', supersedesId: M2 }),
      labor(head, { kind: 'sup', supersedesId: 'sup_' + M2 }),
      { id: 'rev_' + head, docType: 'accountTxn', kind: 'rev', purpose: 'laborQty', ledger: 'labor', reversesId: head, reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1, agreementId: AG },
    ];
    assert.equal(pendingIds().includes('sup_' + M2), true);
  });
});

test('T-I25 an orphan deduct can be rejected or reversed, and a reversed approval of it is not reopened', () => {
  reset();
  seedUnit();
  const view = installAll();
  withStart('2026-11-01', () => {
    store.accountTxns = store.accountTxns.concat([
      deduct('d1appr_m1', 'appr_m1', 50000, 50000),
      { id: 'rev_appr_m1', docType: 'accountTxn', kind: 'rev', purpose: 'approveLabor', ledger: 'labor', reversesId: 'appr_m1', reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1 },
      { id: 'rev_' + M1, docType: 'accountTxn', kind: 'rev', purpose: 'laborQty', ledger: 'labor', reversesId: M1, reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1 },
    ]);
    const pending = open(view);
    assert.equal(pending.includes('عمل معتمد'), true);
    assert.equal(pending.includes('id="act-reject-d1appr_m1"'), true);
    assert.equal(pending.includes('id="act-approve-deduct-d1appr_m1"'), false);
    click('act-reject-d1appr_m1', { ccRej: 'd1appr_m1' });
    assert.deepEqual(pendingIds(), []);

    store.accountTxns = [labor(M1), approval('appr_m1', M1, 600000), deduct('d1appr_m1', 'appr_m1', 50000, 50000), {
      id: 'appr_d1appr_m1', docType: 'accountTxn', kind: 'appr', purpose: 'approveDeduct', ledger: 'labor', targetId: 'd1appr_m1', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1,
    }, {
      id: 'rev_appr_m1', docType: 'accountTxn', kind: 'rev', purpose: 'approveLabor', ledger: 'labor', reversesId: 'appr_m1', reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1,
    }, {
      id: 'rev_' + M1, docType: 'accountTxn', kind: 'rev', purpose: 'laborQty', ledger: 'labor', reversesId: M1, reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1,
    }];
    setFields({ 'cc-reason': 'سبب' });
    const approved = open(view);
    assert.equal(approved.includes('id="act-reverse-d1appr_m1"'), true);
    click('act-reverse-d1appr_m1', { ccRev: 'd1appr_m1' });
    assert.deepEqual(pendingIds(), []);

    store.accountTxns = [labor(M1), approval('appr_m1', M1, 600000), deduct('d1appr_m1', 'appr_m1', 50000, 50000), {
      id: 'appr_d1appr_m1', docType: 'accountTxn', kind: 'appr', purpose: 'approveDeduct', ledger: 'labor', targetId: 'd1appr_m1', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1,
    }, {
      id: 'rev_appr_d1appr_m1', docType: 'accountTxn', kind: 'rev', purpose: 'approveDeduct', ledger: 'labor', reversesId: 'appr_d1appr_m1', reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1,
    }];
    const closed = open(view);
    assert.equal(closed.includes('اعتماد الخصم'), false);
    assert.equal(closed.includes('id="act-reject-d1appr_m1"'), false);
  });
});

test('T-I26 correction exits leave pendingIds empty', () => {
  reset();
  store.agreements = [agreement(), agreement(SLOT_AG, { method: 'lump', lumpAmount: 600000 })];
  const gen1 = slotId(SLOT_AG, 1);
  store.accountTxns = [
    labor(M1), approval('appr_m1', M1, 600000),
    deduct('d1appr_m1', 'appr_m1', 50000, 50000),
    { id: 'rev_d1appr_m1', docType: 'accountTxn', kind: 'rev', purpose: 'deduct', ledger: 'labor', amount: 50000, reversesId: 'd1appr_m1', reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1 },
  ];
  assert.deepEqual(pendingIds(), []);
  store.accountTxns = [
    labor(gen1, { agreementId: SLOT_AG }),
    approval('appr_' + gen1, gen1, 600000, { agreementId: SLOT_AG }),
    { id: 'rev_appr_' + gen1, docType: 'accountTxn', kind: 'rev', purpose: 'approveLabor', ledger: 'labor', reversesId: 'appr_' + gen1, reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1 },
    { id: 'rev_' + gen1, docType: 'accountTxn', kind: 'rev', purpose: 'laborQty', ledger: 'labor', reversesId: gen1, reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1, agreementId: SLOT_AG },
  ];
  assert.deepEqual(pendingIds(), []);
  const head = 'sup_' + M2;
  store.accountTxns = [
    labor(M2), labor(head, { kind: 'sup', supersedesId: M2 }), approval('appr_' + head, head, 1000),
    { id: 'rev_appr_' + head, docType: 'accountTxn', kind: 'rev', purpose: 'approveLabor', ledger: 'labor', reversesId: 'appr_' + head, reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1 },
    { id: 'rev_' + head, docType: 'accountTxn', kind: 'rev', purpose: 'laborQty', ledger: 'labor', reversesId: head, reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1, agreementId: AG },
    { id: 'rev_' + M2, docType: 'accountTxn', kind: 'rev', purpose: 'laborQty', ledger: 'labor', reversesId: M2, reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1, agreementId: AG },
  ];
  assert.deepEqual(pendingIds(), []);
});

test('T-I27 a live return blocks the advance reversal', () => {
  reset();
  seedUnit();
  store.accountTxns = store.accountTxns.concat([
    cash('adv1', 'advanceLabor'),
    cash('back1', 'returnAdvance', { targetId: 'adv1', amount: 1000 }),
  ]);
  const view = installAll();
  withStart('2026-11-01', () => {
    const blocked = open(view);
    assert.equal(blocked.includes('id="act-reverse-adv1"'), false);
    assert.equal(blocked.includes(S5), true);
    assert.equal(blocked.includes(S5_OLD), false);
    store.accountTxns = store.accountTxns.concat([{
      id: 'rev_back1', docType: 'accountTxn', kind: 'rev', purpose: 'returnAdvance', ledger: 'labor', amount: 1000,
      reversesId: 'back1', reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1,
    }]);
    setFields({ 'cc-reason': 'سبب' });
    assert.equal(open(view).includes('id="act-reverse-adv1"'), true);
  });
});

test('T-I28 ending slot generation 1 opens the next try without a pending note', () => {
  reset();
  store.agreements = [agreement(SLOT_AG, { method: 'lump', lumpAmount: 600000 })];
  const gen1 = slotId(SLOT_AG, 1);
  store.accountTxns = [
    labor(gen1, { agreementId: SLOT_AG }),
    approval('appr_' + gen1, gen1, 600000, { agreementId: SLOT_AG }),
    { id: 'rev_appr_' + gen1, docType: 'accountTxn', kind: 'rev', purpose: 'approveLabor', ledger: 'labor', reversesId: 'appr_' + gen1, reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1 },
    { id: 'rev_' + gen1, docType: 'accountTxn', kind: 'rev', purpose: 'laborQty', ledger: 'labor', reversesId: gen1, reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1, agreementId: SLOT_AG },
  ];
  const view = installAll();
  withStart('2026-11-01', () => {
    const html = open(view, SLOT_AG);
    assert.equal(html.includes('المحاولة 2 من 9'), true);
    assert.equal(html.includes('بانتظار الاعتماد'), false);
    assert.equal(html.includes('id="act-labor-qty"'), true);
  });
});

test('T-I29 deduct positions, including a refused reversal that does not release the previous one', () => {
  reset();
  seedUnit();
  const before = store.accountTxns.length;
  assert.deepEqual(Correct.deductPosition('appr_m1', 400000), { id: 'd1appr_m1', cumAmount: 400000 });
  store.accountTxns = store.accountTxns.concat([deduct('d1appr_m1', 'appr_m1', 400000, 400000)]);
  const second = Correct.deductPosition('appr_m1', 50000);
  assert.equal(second.cumAmount, 450000);
  store.accountTxns = store.accountTxns.concat([{
    id: 'rev_d1appr_m1', docType: 'accountTxn', kind: 'rev', purpose: 'deduct', ledger: 'labor', amount: 400000,
    reversesId: 'd1appr_m1', reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1,
  }]);
  assert.equal(Correct.deductPosition('appr_m1', 50000).cumAmount, 50000);
  store.accountTxns = [labor(M1), approval('appr_m1', M1, 600000), deduct('d1appr_m1', 'appr_m1', 400000, 400000), {
    id: 'rej_d1appr_m1', docType: 'accountTxn', kind: 'rej', targetId: 'd1appr_m1',
  }];
  assert.equal(Correct.deductPosition('appr_m1', 50000).cumAmount, 50000);

  store.syncErrors = { rev_d1appr_m1: REFUSED };
  store.accountTxns = [labor(M1), approval('appr_m1', M1, 600000), deduct('d1appr_m1', 'appr_m1', 400000, 400000), {
    id: 'rev_d1appr_m1', docType: 'accountTxn', kind: 'rev', purpose: 'deduct', ledger: 'labor', amount: 400000,
    reversesId: 'd1appr_m1', reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1,
  }];
  assert.equal(Correct.deductPosition('appr_m1', 50000).cumAmount, 450000);
  store.syncErrors = { rej_d1appr_m1: REFUSED };
  store.accountTxns[3] = { id: 'rej_d1appr_m1', docType: 'accountTxn', kind: 'rej', targetId: 'd1appr_m1' };
  assert.equal(Correct.deductPosition('appr_m1', 50000).cumAmount, 450000);

  store.syncErrors = {};
  store.accountTxns = [
    labor(M1), approval('appr_m1', M1, 600000),
    deduct('d1appr_m1', 'appr_m1', 200000, 200000),
    deduct('d2appr_m1', 'appr_m1', 100000, 300000),
    { id: 'rev_d1appr_m1', docType: 'accountTxn', kind: 'rev', purpose: 'deduct', ledger: 'labor', amount: 200000, reversesId: 'd1appr_m1', reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1 },
  ];
  const held = Correct.deductPosition('appr_m1', 1000);
  assert.equal(held.id, 'd3appr_m1');
  assert.equal(held.cumAmount, 301000);

  const rows = [labor(M1), approval('appr_m1', M1, 600000)];
  for (let gen = 1; gen <= 9; gen += 1) rows.push(deduct('d' + gen + 'appr_m1', 'appr_m1', 1, gen));
  store.accountTxns = rows;
  assert.deepEqual(Correct.deductPosition('appr_m1', 1), { error: 'full' });

  store.accountTxns = [labor(M1), approval('appr_m1', M1, 600000), deduct('d1appr_m1', 'appr_m1', 550000, 550000)];
  assert.deepEqual(Correct.deductPosition('appr_m1', 60000), { error: 'cumulative' });

  store.accountTxns = [
    labor(M1), approval('appr_m1', M1, 600000),
    deduct('d1appr_m1', 'appr_m1', 300000, 300000),
    deduct('d2appr_m1', 'appr_m1', 300000, 600000),
    { id: 'rev_d1appr_m1', docType: 'accountTxn', kind: 'rev', purpose: 'deduct', ledger: 'labor', amount: 300000, reversesId: 'd1appr_m1', reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1 },
    { id: 'rev_d2appr_m1', docType: 'accountTxn', kind: 'rev', purpose: 'deduct', ledger: 'labor', amount: 300000, reversesId: 'd2appr_m1', reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1 },
  ];
  assert.deepEqual(Correct.deductPosition('appr_m1', 300001), { error: 'spent' });
  store.syncErrors = { d2appr_m1: REFUSED };
  assert.deepEqual(Correct.deductPosition('appr_m1', 1), { error: 'blocked' });
  store.syncErrors = {};
  store.accountTxns = [labor(M1), approval('appr_m1', M1, 600000), deduct('d1appr_m1', 'appr_m1', 1000, 1000)];
  assert.deepEqual(Correct.deductPosition('appr_m1', 2000), { id: 'd2appr_m1', cumAmount: 3000 });
  const queued = store.accountTxns.length;
  assert.deepEqual(Correct.deductDoc(Object.assign({ targetId: 'appr_m1', amount: 600001, reason: 'سبب' }, WHO)).errors, ['cap']);
  assert.equal(store.accountTxns.length, queued);
  assert.equal(before > 0, true);
});

test('T-I30 the deduct approval label stays distinct from the measurement card', () => {
  reset();
  seedUnit();
  store.accountTxns = store.accountTxns.concat([labor(M2), deduct('d1appr_m1', 'appr_m1', 50000, 50000)]);
  const view = installAll();
  withStart('2026-11-01', () => {
    const html = open(view);
    assert.equal(html.includes('اعتماد الخصم'), true);
    assert.equal(html.includes('اعتماد قياس العمل'), true);
  });
});

test('T-I31 a reversed deduct uses cap space and does not change the due', () => {
  reset();
  seedUnit();
  const bare = [labor(M1), approval('appr_m1', M1, 600000)];
  const netWithout = Accounts.balances(bare, { partyId: 'party-1', projectId: 'p-school', syncErrors: {} }).net;
  store.accountTxns = bare.concat([
    deduct('d1appr_m1', 'appr_m1', 300000, 300000),
    { id: 'appr_d1appr_m1', docType: 'accountTxn', kind: 'appr', purpose: 'approveDeduct', ledger: 'labor', targetId: 'd1appr_m1', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1 },
    deduct('d2appr_m1', 'appr_m1', 300000, 600000),
    { id: 'appr_d2appr_m1', docType: 'accountTxn', kind: 'appr', purpose: 'approveDeduct', ledger: 'labor', targetId: 'd2appr_m1', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1 },
    { id: 'rev_d1appr_m1', docType: 'accountTxn', kind: 'rev', purpose: 'deduct', ledger: 'labor', amount: 300000, reversesId: 'd1appr_m1', reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1 },
    { id: 'rev_d2appr_m1', docType: 'accountTxn', kind: 'rev', purpose: 'deduct', ledger: 'labor', amount: 300000, reversesId: 'd2appr_m1', reversalReason: 'سبب', partyId: 'party-1', projectId: 'p-school', currency: 'IQD', fxRate: 1 },
  ]);
  assert.equal(balances().deductions, 0);
  assert.equal(balances().net, netWithout);
  const view = installAll();
  withStart('2026-11-01', () => {
    const statement = accountPage(view, 'statement');
    assert.equal(statement.includes('300,000'), false);
    assert.equal(statement.includes('بانتظار الاعتماد'), false);
    setFields({ 'cc-deduct': '300001' });
    const card = open(view);
    assert.equal(card.includes('معكوس'), true);
    assert.equal(card.includes(S12), true);
    assert.equal(card.includes(S14), true);
    assert.equal(card.includes('id="cc-deduct"'), false);
    const movements = accountPage(view, 'movements');
    assert.equal(movements.includes('معكوس'), true);
    assert.deepEqual(pendingIds(), []);
  });
  assert.deepEqual(Correct.deductPosition('appr_m1', 300001), { error: 'spent' });
  assert.deepEqual(Correct.deductPosition('appr_m1', 300000), { id: 'd3appr_m1', cumAmount: 600000 });
});

test('T-I32 the remedy names another measurement before ending this one', () => {
  reset();
  store.agreements = [agreement()];
  const full = [labor(M1), approval('appr_m1', M1, 600000)];
  for (let gen = 1; gen <= 9; gen += 1) full.push(deduct('d' + gen + 'appr_m1', 'appr_m1', 1, gen));
  full.push(labor(M2), approval('appr_' + M2, M2, 600000));
  store.accountTxns = full;
  const view = installAll();
  withStart('2026-11-01', () => {
    const other = open(view);
    assert.equal(other.includes(S10), true);
    assert.equal(other.includes(S13), true);
    store.syncErrors = { d1appr_m1: REFUSED };
    store.accountTxns = [labor(M1), approval('appr_m1', M1, 600000), deduct('d1appr_m1', 'appr_m1', 1, 1), labor(M2), approval('appr_' + M2, M2, 600000)];
    const blocked = open(view);
    assert.equal(blocked.includes(S11), true);
    assert.equal(blocked.includes(S13), true);
    store.syncErrors = {};
    const both = [labor(M1), approval('appr_m1', M1, 600000), labor(M2), approval('appr_' + M2, M2, 600000)];
    for (let gen = 1; gen <= 9; gen += 1) {
      both.push(deduct('d' + gen + 'appr_m1', 'appr_m1', 1, gen));
      both.push(deduct('d' + gen + 'appr_' + M2, 'appr_' + M2, 1, gen));
    }
    store.accountTxns = both;
    const none = open(view);
    assert.equal(none.split(S10).length - 1, 2);
    assert.equal(none.includes(S14), true);
    assert.equal(none.includes(S13), false);
    store.agreements = [agreement(SLOT_AG, { method: 'lump', lumpAmount: 600000 })];
    const lump = [labor(slotId(SLOT_AG, 1), { agreementId: SLOT_AG }), approval('appr_lump', slotId(SLOT_AG, 1), 600000, { agreementId: SLOT_AG })];
    for (let gen = 1; gen <= 9; gen += 1) lump.push(deduct('d' + gen + 'appr_lump', 'appr_lump', 1, gen));
    store.accountTxns = lump;
    const alone = open(view, SLOT_AG);
    assert.equal(alone.includes(S14), true);
    assert.ok(S14.indexOf('خصومات') >= 0 && S14.indexOf('خصومات') < S14.indexOf('الاعتماد'));
  });
});
