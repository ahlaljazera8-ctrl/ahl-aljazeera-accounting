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
const UI = require('../public/accounts-view.js');
const AccountWork = require('../public/accounts-work.js');

const store = {
  parties: [],
  agreements: [],
  accountTxns: [],
  projects: [{ id: 'job', name: 'مشروع المدرسة' }],
  outbox: [],
  syncErrors: {},
};
g.K = {
  parties: 'parties',
  agreements: 'agreements',
  accountTxns: 'accountTxns',
  projects: 'projects',
  outbox: 'outbox',
  syncErrors: 'syncErrors',
};
g.get = (key, fallback) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallback);
g.set = (key, value) => { store[key] = value; return Promise.resolve(); };
g.me = () => ({ uid: 'u-ameer', role: 'owner', active: true, displayName: 'أمير' });
g.uuid = () => 'party-1';
g.today = () => '2026-11-16';
g.deviceId = 'phone';
g.demoRole = () => '';
let queued = [];
g.queueDoc = id => { if (!queued.includes(id)) queued.push(id); };

function ownerModel() {
  return UI.modelFor(g.me());
}

test('the demo owner sees the empty list and no create button', () => {
  g.demoRole = () => 'owner';
  const html = UI.listHtml(UI.modelFor(g.me()));
  assert.equal(html.includes('لا توجد حسابات أشخاص.'), true);
  assert.equal(html.includes('+ شخص جديد'), false);
  g.demoRole = () => '';
});

test('a site user sees the owner sentence', () => {
  const html = UI.listHtml(UI.modelFor({ role: 'site', uid: 'site' }));
  assert.equal(html.includes('هذه الشاشة للمالك.'), true);
  assert.equal(html.includes('+ شخص جديد'), false);
});

test('canCreateParty is true once collectionFor returns parties, and false in the demo', () => {
  assert.equal(UI.canCreateParty(g.me()), true);
  const orig = Sync.collectionFor;
  Sync.collectionFor = () => 'parties';
  g.demoRole = () => 'owner';
  assert.equal(UI.canCreateParty(g.me()), false);
  g.demoRole = () => '';
  assert.equal(UI.canCreateParty(g.me()), true);
  Sync.collectionFor = orig;
});

test('two taps store one party and one outbox id', () => {
  const orig = Sync.collectionFor;
  Sync.collectionFor = () => 'parties';
  queued = [];
  store.parties = [];
  const button = { id: 'save-party', disabled: false, dataset: {} };
  g.document = { querySelector: () => ({ value: 'حسن' }) };
  UI.install({ views: {}, titles: {}, state: {}, render() {}, esc: s => String(s), money: n => Ledger.fmt(n) + ' د.ع', queueDoc: g.queueDoc, confirmShell: () => '', lastSyncAt: () => 0, formatSyncTime: () => '' });
  UI.onClick(/** @type {HTMLButtonElement} */ ({ id: 'party-new', disabled: false, dataset: {} }));
  UI.onClick(/** @type {HTMLButtonElement} */ (button));
  UI.onClick(/** @type {HTMLButtonElement} */ (button));
  assert.equal(store.parties.length, 1);
  assert.equal(store.parties[0].roles, undefined);
  assert.deepEqual(queued, ['party-1']);
  Sync.collectionFor = orig;
});

test('an empty name and an 81-character name do not call queueDoc', () => {
  queued = [];
  assert.deepEqual(UI.partyErrors(''), ['name']);
  assert.deepEqual(UI.partyErrors('ح'.repeat(81)), ['name']);
  assert.deepEqual(UI.partyErrors('حسن'), []);
});

test('bad id and unknown id', () => {
  const model = ownerModel();
  assert.equal(UI.accountHtml(model, '../x').includes('معرّف غير صالح'), true);
  assert.equal(UI.accountHtml(model, 'missing-person').includes('الشخص غير متاح'), true);
});

test('filters keep labor, payments, and advances apart', () => {
  store.parties = [{ id: 'p1', name: 'حسن' }];
  store.accountTxns = [
    { id: 'q', purpose: 'laborQty', partyId: 'p1', projectId: 'job', amount: 1, txnDate: '2026-11-01' },
    { id: 'pay', purpose: 'payLabor', partyId: 'p1', projectId: 'job', amount: 10, txnDate: '2026-11-01' },
    { id: 'adv', purpose: 'advanceLabor', partyId: 'p1', projectId: 'job', amount: 5, txnDate: '2026-11-01' },
    { id: 'ded', purpose: 'deduct', partyId: 'p1', projectId: 'job', amount: 1, txnDate: '2026-11-01', targetId: 'none' },
  ];
  const model = ownerModel();
  model.screen.tab = 'movements';
  model.screen.filter = 'measurements';
  const measured = UI.accountHtml(model, 'p1');
  assert.equal(measured.includes('data-purpose="laborQty"'), true);
  assert.equal(measured.includes('data-purpose="payLabor"'), false);
  model.screen.filter = 'payments';
  const paid = UI.accountHtml(model, 'p1');
  assert.equal(paid.includes('data-purpose="payLabor"'), true);
  assert.equal(paid.includes('الدفعات'), true);
  model.screen.filter = 'advances';
  assert.equal(UI.accountHtml(model, 'p1').includes('data-purpose="advanceLabor"'), true);
  model.screen.filter = 'all';
  const all = UI.accountHtml(model, 'p1');
  assert.equal(all.includes('data-purpose="deduct"'), true);
});

test('a net above 0 shows مستحق له and no action button', () => {
  store.parties = [{ id: 'p1', name: 'حسن' }];
  store.accountTxns = [
    { id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm', partyId: 'p1', projectId: 'job', txnDate: '2026-11-01' },
    { id: 'pay', purpose: 'payLabor', amount: 200000, partyId: 'p1', projectId: 'job', txnDate: '2026-11-02' },
  ];
  const model = ownerModel();
  model.screen.tab = 'overview';
  globalThis.AccountActions.push(/** @type {AccountAction} */ ({
    id: 'pay-labor',
    tab: 'movements',
    label: 'دفعة',
    buttonId: 'act-pay-labor',
    renderForm: () => '',
    onClick: () => false,
    save: () => ({ doc: null, errors: [] }),
  }));
  const html = UI.accountHtml(model, 'p1');
  assert.equal(kvAmount(html, 'الرصيد المستحق'), 'مستحق له 400,000 د.ع');
  assert.equal(kv(html, 'مستحق عليه'), '');
  assert.equal(html.includes('act-'), false);
  model.screen.tab = 'movements';
  assert.equal(UI.accountHtml(model, 'p1').includes('act-pay-labor'), true);
  model.screen.tab = 'overview';
});

test('a second push of the same action id is a no-op', () => {
  const action = /** @type {AccountAction} */ ({ id: 'deduct', tab: 'movements', label: 'خصم', buttonId: 'act-deduct', renderForm: () => '', onClick: () => false, save: () => ({ doc: null, errors: [] }) });
  globalThis.AccountActions.push(action);
  const before = globalThis.AccountActions.length;
  globalThis.AccountActions.push(action);
  assert.equal(globalThis.AccountActions.length, before);
});

test('readAccountScope defaults and a tab change does not move it', () => {
  const flag = UI.readAccountScope();
  assert.equal(flag.scope, 'all');
  assert.equal(flag.projectId, '');
  assert.equal(flag.periodKind, 'week');
  assert.equal(flag.anchorDate, '2026-11-16');
  const model = ownerModel();
  model.screen.tab = 'statement';
  UI.accountHtml(model, 'p1');
  assert.equal(UI.readAccountScope().anchorDate, '2026-11-16');
  assert.deepEqual(UI.accountPeriod(), Accounts.periodBounds('week', '2026-11-16'));
});

test('an id in syncErrors is out of the statement and shows the refusal word', () => {
  store.accountTxns = [{ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm', partyId: 'p1', projectId: 'job', txnDate: '2026-11-01' }];
  store.syncErrors = { appr: 'رُفض الإرسال' };
  const doc = UI.statementFor(g.me(), 'p1');
  assert.equal(doc.closing, 0);
  const model = ownerModel();
  model.screen.tab = 'movements';
  model.screen.filter = 'all';
  const html = UI.accountHtml(model, 'p1');
  assert.equal(html.includes('رُفض الإرسال'), true);
  assert.equal(html.includes('معتمد'), false);
  store.syncErrors = {};
});

function kv(html, label) {
  const parts = html.split('<div class="kv">');
  return parts.find(part => part.includes('<span>' + label + '</span>')) || '';
}

function kvAmount(html, label) {
  const row = kv(html, label);
  const marker = '<span>' + label + '</span>';
  const at = row.indexOf(marker);
  if (at < 0) return '';
  return row.slice(at + marker.length).split('</div>')[0];
}

test('the 480000 fixture shows 480,000 under مستحق له, not 550,000', () => {
  store.parties = [{ id: 'person', name: 'حسن' }];
  store.accountTxns = [
    { id: 'm', purpose: 'laborQty', partyId: 'person', projectId: 'job', txnDate: '2026-11-01', ledger: 'labor' },
    { id: 'appr_m', purpose: 'approveLabor', amount: 600000, targetId: 'm', partyId: 'person', projectId: 'job', txnDate: '2026-11-01', ledger: 'labor' },
    { id: 'd', purpose: 'deduct', amount: 50000, targetId: 'appr_m', partyId: 'person', projectId: 'job', txnDate: '2026-11-02', ledger: 'labor' },
    { id: 'ad', purpose: 'approveDeduct', targetId: 'd', partyId: 'person', projectId: 'job', txnDate: '2026-11-05', ledger: 'labor' },
    { id: 'adv', purpose: 'advanceLabor', amount: 100000, partyId: 'person', projectId: 'job', txnDate: '2026-11-03', ledger: 'labor' },
    { id: 'ret', purpose: 'returnAdvance', amount: 30000, targetId: 'adv', partyId: 'person', projectId: 'job', txnDate: '2026-11-04', ledger: 'labor' },
  ];
  const model = ownerModel();
  model.screen.tab = 'overview';
  const html = UI.accountHtml(model, 'person');
  assert.equal(kvAmount(html, 'الرصيد المستحق'), 'مستحق له 480,000 د.ع');
  assert.equal(html.includes('550,000'), false);
  assert.equal(kv(html, 'مستحق عليه'), '');
  assert.equal(html.includes('المتبقي سلفة'), false);
  assert.equal(kvAmount(html, 'سلف قائمة عليه'), '70,000 د.ع');
});

test('an advance-only person shows مستحق عليه 100,000', () => {
  store.parties = [{ id: 'p1', name: 'حسن' }];
  store.accountTxns = [
    { id: 'adv', purpose: 'advanceLabor', amount: 100000, partyId: 'p1', projectId: 'job', txnDate: '2026-11-01', ledger: 'labor' },
  ];
  const model = ownerModel();
  model.screen.tab = 'overview';
  const html = UI.accountHtml(model, 'p1');
  assert.equal(kvAmount(html, 'الرصيد المستحق'), 'مستحق عليه 100,000 د.ع');
  assert.equal(kv(html, 'مستحق له'), '');
  assert.equal(html.includes('المتبقي سلفة'), false);
  assert.equal(html.includes('(سلفة)'), false);
  assert.equal(kvAmount(html, 'سلف قائمة عليه'), '100,000 د.ع');
});

test('a net of 0 shows مستحق له 0 and no remaining-advance figure', () => {
  store.parties = [{ id: 'p1', name: 'حسن' }];
  store.accountTxns = [
    { id: 'appr', purpose: 'approveLabor', amount: 100000, targetId: 'm', partyId: 'p1', projectId: 'job', txnDate: '2026-11-01', ledger: 'labor' },
    { id: 'adv', purpose: 'advanceLabor', amount: 100000, partyId: 'p1', projectId: 'job', txnDate: '2026-11-02', ledger: 'labor' },
  ];
  const model = ownerModel();
  model.screen.tab = 'overview';
  const html = UI.accountHtml(model, 'p1');
  assert.equal(kvAmount(html, 'الرصيد المستحق'), '0 د.ع');
  assert.equal(kv(html, 'مستحق عليه'), '');
  assert.equal(html.includes('المتبقي سلفة'), false);
  assert.equal(kvAmount(html, 'سلف قائمة عليه'), '100,000 د.ع');
});

test('an overpayment shows مستحق عليه 100,000 and سلف قائمة عليه', () => {
  store.parties = [{ id: 'p1', name: 'حسن' }];
  store.accountTxns = [
    { id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm', partyId: 'p1', projectId: 'job', txnDate: '2026-11-01', ledger: 'labor' },
    { id: 'pay', purpose: 'payLabor', amount: 700000, partyId: 'p1', projectId: 'job', txnDate: '2026-11-02', ledger: 'labor' },
  ];
  const model = ownerModel();
  model.screen.tab = 'overview';
  const html = UI.accountHtml(model, 'p1');
  assert.equal(kvAmount(html, 'الرصيد المستحق'), 'مستحق عليه 100,000 د.ع');
  assert.equal(kv(html, 'مستحق له'), '');
  assert.equal(html.includes('المتبقي سلفة'), false);
  assert.equal(html.includes('(سلفة)'), false);
  assert.equal(kvAmount(html, 'سلف قائمة عليه'), '0 د.ع');
  assert.equal(html.includes('\u2212'), false);
});

test('a rendered negative balance does not contain (سلفة)', () => {
  store.parties = [{ id: 'p1', name: 'حسن' }];
  const advance = [{ id: 'adv', purpose: 'advanceLabor', amount: 100000, partyId: 'p1', projectId: 'job', txnDate: '2026-11-01', ledger: 'labor' }];
  const overpay = [
    { id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm', partyId: 'p1', projectId: 'job', txnDate: '2026-11-01', ledger: 'labor' },
    { id: 'pay', purpose: 'payLabor', amount: 700000, partyId: 'p1', projectId: 'job', txnDate: '2026-11-02', ledger: 'labor' },
  ];
  const model = ownerModel();
  model.screen.tab = 'overview';
  for (const rows of [advance, overpay]) {
    store.accountTxns = rows;
    const html = UI.accountHtml(model, 'p1');
    const block = Ledger.personProjectDeleteBlock('job', /** @type {readonly FoldDoc[]} */ (rows), store.parties, {}, Accounts.balances);
    assert.equal(html.includes('مستحق عليه'), true);
    assert.equal(html.includes('(سلفة)'), false);
    assert.equal(block.includes('مستحق عليه'), true);
    assert.equal(block.includes('(سلفة)'), false);
  }
});

function movementCard(html, purpose) {
  const parts = html.split('<div class="card"').slice(1);
  return parts.find(part => part.includes('data-purpose="' + purpose + '"')) || '';
}

test('a reversed advance with a live return shows معكوس, not مرفوض', () => {
  store.parties = [{ id: 'p1', name: 'حسن' }];
  store.accountTxns = [
    { id: 'V', purpose: 'advanceLabor', amount: 100000, partyId: 'p1', projectId: 'job', txnDate: '2026-11-01', ledger: 'labor' },
    { id: 'R', purpose: 'returnAdvance', amount: 40000, targetId: 'V', partyId: 'p1', projectId: 'job', txnDate: '2026-11-01', ledger: 'labor' },
    { id: 'rev_V', reversesId: 'V', kind: 'rev', purpose: 'advanceLabor', partyId: 'p1', projectId: 'job', txnDate: '2026-11-01', ledger: 'labor' },
  ];
  const model = ownerModel();
  model.screen.tab = 'movements';
  model.screen.filter = 'all';
  const card = movementCard(UI.accountHtml(model, 'p1'), 'advanceLabor');
  assert.equal(card.includes('معكوس'), true);
  assert.equal(card.includes('مرفوض'), false);
});

test('a reversed labor approval with a live deduct shows معكوس', () => {
  store.parties = [{ id: 'p1', name: 'حسن' }];
  store.accountTxns = [
    { id: 'm', purpose: 'laborQty', partyId: 'p1', projectId: 'job', txnDate: '2026-11-01', ledger: 'labor' },
    { id: 'A', purpose: 'approveLabor', amount: 500000, targetId: 'm', partyId: 'p1', projectId: 'job', txnDate: '2026-11-01', ledger: 'labor' },
    { id: 'D', purpose: 'deduct', amount: 1000, targetId: 'A', partyId: 'p1', projectId: 'job', txnDate: '2026-11-01', ledger: 'labor' },
    { id: 'rev_A', reversesId: 'A', kind: 'rev', partyId: 'p1', projectId: 'job', txnDate: '2026-11-01', ledger: 'labor' },
  ];
  const model = ownerModel();
  model.screen.tab = 'movements';
  model.screen.filter = 'all';
  const card = movementCard(UI.accountHtml(model, 'p1'), 'approveLabor');
  assert.equal(card.includes('معكوس'), true);
  assert.equal(card.includes('مرفوض'), false);
});

test('a real rej_ still shows مرفوض', () => {
  store.parties = [{ id: 'p1', name: 'حسن' }];
  store.accountTxns = [
    { id: 'A', purpose: 'approveLabor', amount: 500000, targetId: 'm', partyId: 'p1', projectId: 'job', txnDate: '2026-11-01', ledger: 'labor' },
    { id: 'rej_A', kind: 'rej', targetId: 'A', partyId: 'p1', projectId: 'job', txnDate: '2026-11-01', ledger: 'labor' },
  ];
  const model = ownerModel();
  model.screen.tab = 'movements';
  model.screen.filter = 'all';
  const card = movementCard(UI.accountHtml(model, 'p1'), 'approveLabor');
  assert.equal(card.includes('مرفوض'), true);
});

test('a unit agreement on حسابات shows the progress label', () => {
  store.parties = [{ id: 'p1', name: 'حسن' }];
  store.agreements = [{
    id: 'ag-unit',
    partyId: 'p1',
    projectId: 'job',
    method: 'unit',
    description: 'كاشي',
    currency: 'IQD',
  }];
  const model = ownerModel();
  model.screen.tab = 'agreements';
  const html = UI.accountHtml(model, 'p1');
  const label = 'حسب الإنجاز (الكمية × سعر الوحدة)';
  assert.equal(html.includes(label), true);
  assert.equal(html.includes('بسعر الوحدة'), false);
  assert.equal(label, AccountWork.pendingAmeer.unitByProgress);
  assert.equal(html.includes(AccountWork.pendingAmeer.unitByProgress), true);
});

test('install runs when ForemenUI is missing', () => {
  const views = {};
  UI.install({ views, titles: {}, state: {}, render() {}, esc: s => String(s), money: n => String(n), queueDoc() {}, confirmShell: () => '', lastSyncAt: () => 0, formatSyncTime: () => '' });
  assert.equal(typeof views.accounts, 'function');
  assert.equal(typeof views.account, 'function');
});

/**
 * @param {() => void} [onRender]
 */
function installView(onRender) {
  let paints = 0;
  UI.install({
    views: {},
    titles: {},
    state: {},
    render() {
      paints += 1;
      if (onRender) onRender();
    },
    esc: s => String(s ?? ''),
    money: n => Ledger.fmt(n) + ' د.ع',
    queueDoc() {},
    confirmShell: () => '',
    lastSyncAt: () => 0,
    formatSyncTime: () => '',
  });
  return {
    paints: () => paints,
  };
}

test('a full statement date redraws the week and the month without leaving the tab', () => {
  store.parties = [{ id: 'p1', name: 'حسن' }];
  const prevDoc = g.document;
  const painted = {
    id: 'statement-from',
    focused: false,
    caret: /** @type {number | null} */ (null),
    focus() { this.focused = true; },
    setSelectionRange(start) { this.caret = start; },
  };
  g.document = { querySelector: sel => (sel === '#statement-from' ? painted : null) };
  const view = installView();
  UI.writeAccountScope({ scope: 'all', projectId: '', periodKind: 'week', anchorDate: '2026-11-16' });
  try {
    const model = ownerModel();
    model.screen.tab = 'statement';
    const before = UI.accountHtml(model, 'p1');
    assert.equal(before.includes('2026-11-14'), true);
    assert.equal(before.includes('2026-11-20'), true);
    const partial = { id: 'statement-from', value: '2026-11-2', selectionStart: 8 };
    UI.onInput(/** @type {any} */ (partial));
    assert.equal(view.paints(), 0);
    assert.equal(painted.focused, false);
    const typed = { id: 'statement-from', value: '2026-11-23', selectionStart: 10 };
    UI.onInput(/** @type {any} */ (typed));
    assert.equal(view.paints(), 1);
    assert.deepEqual(UI.accountPeriod(), Accounts.periodBounds('week', '2026-11-23'));
    const week = UI.accountHtml(model, 'p1');
    assert.equal(week.includes('2026-11-21'), true);
    assert.equal(week.includes('2026-11-27'), true);
    assert.equal(painted.focused, true);
    assert.equal(painted.caret, 10);
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'month' } }));
    const monthTyped = { id: 'statement-from', value: '2026-10-05', selectionStart: 10 };
    UI.onInput(/** @type {any} */ (monthTyped));
    assert.deepEqual(UI.accountPeriod(), { periodStart: '2026-10-01', periodEnd: '2026-10-31' });
    const month = UI.accountHtml(model, 'p1');
    assert.equal(month.includes('2026-10-01'), true);
    assert.equal(month.includes('2026-10-31'), true);
    assert.equal(UI.readAccountScope().periodKind, 'month');
  } finally {
    g.document = prevDoc;
    UI.writeAccountScope({ scope: 'all', projectId: '', periodKind: 'week', anchorDate: '2026-11-16' });
  }
});

test('a custom range shows inclusive lines and does not issue', () => {
  store.parties = [{ id: 'p1', name: 'حسن' }];
  store.accountTxns = [
    { id: 'before', purpose: 'approveLabor', amount: 100000, targetId: 'm', partyId: 'p1', projectId: 'job', txnDate: '2026-11-10', ledger: 'labor' },
    { id: 'inside', purpose: 'payLabor', amount: 30000, partyId: 'p1', projectId: 'job', txnDate: '2026-11-18', ledger: 'labor' },
    { id: 'end', purpose: 'payLabor', amount: 10000, partyId: 'p1', projectId: 'job', txnDate: '2026-11-20', ledger: 'labor' },
    { id: 'after', purpose: 'payLabor', amount: 70000, partyId: 'p1', projectId: 'job', txnDate: '2026-11-21', ledger: 'labor' },
  ];
  store.statementApprovals = [];
  g.K.statementApprovals = 'statementApprovals';
  const prevDoc = g.document;
  const fields = {
    'statement-from': { id: 'statement-from', focus() {}, setSelectionRange() {} },
    'statement-to': { id: 'statement-to', focus() {}, setSelectionRange() {} },
  };
  g.document = { querySelector: sel => fields[String(sel || '').replace(/^#/, '')] || null };
  const writes = [];
  const origSet = g.set;
  g.set = (key, value) => {
    writes.push(key);
    return origSet(key, value);
  };
  installView();
  UI.writeAccountScope({ scope: 'all', projectId: '', periodKind: 'week', anchorDate: '2026-11-16' });
  const week = UI.accountPeriod();
  try {
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'custom' } }));
    UI.onInput(/** @type {any} */ ({ id: 'statement-from', value: '2026-11-1', selectionStart: 8 }));
    const model = ownerModel();
    model.screen.tab = 'statement';
    const partial = UI.accountHtml(model, 'p1');
    assert.equal(partial.includes('مخصص'), true);
    assert.equal(partial.includes('class="pill on" data-acperiod="custom"'), true);
    assert.equal(partial.includes('رصيد أول المدة'), false);
    UI.onInput(/** @type {any} */ ({ id: 'statement-from', value: '2026-11-18', selectionStart: 10 }));
    UI.onInput(/** @type {any} */ ({ id: 'statement-to', value: '2026-11-20', selectionStart: 10 }));
    const html = UI.accountHtml(model, 'p1');
    assert.equal(html.includes('رصيد أول المدة'), true);
    assert.equal(html.includes('100,000'), true);
    assert.equal(html.includes('مدفوع للعمل'), true);
    assert.equal(html.includes('40,000'), true);
    assert.equal(html.includes('رصيد آخر المدة'), true);
    assert.equal(html.includes('60,000'), true);
    assert.equal(html.includes('70,000'), false);
    assert.equal(html.includes('id="act-issue"'), false);
    assert.equal(html.includes('data-st-issue'), false);
    assert.equal(html.includes('<label class="field">من<input id="statement-from"'), true);
    assert.equal(html.includes('<label class="field">إلى<input id="statement-to"'), true);
    UI.onInput(/** @type {any} */ ({ id: 'statement-to', value: '2026-11-01', selectionStart: 10 }));
    const bad = UI.accountHtml(model, 'p1');
    assert.equal(bad.includes('رصيد أول المدة'), false);
    assert.equal(bad.includes('id="statement-from"'), true);
    assert.equal(bad.includes('id="statement-to"'), true);
    assert.equal(bad.includes('id="act-issue"'), false);
    assert.deepEqual(UI.accountPeriod(), week);
    assert.equal(UI.readAccountScope().periodKind, 'week');
    assert.equal(UI.readAccountScope().anchorDate, '2026-11-16');
    assert.equal(writes.includes('statementApprovals'), false);
    assert.equal(store.statementApprovals.length, 0);
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'month' } }));
    assert.equal(UI.readAccountScope().periodKind, 'month');
    assert.deepEqual(UI.accountPeriod(), Accounts.periodBounds('month', '2026-11-16'));
    const month = UI.accountHtml(model, 'p1');
    assert.equal(month.includes('class="pill on" data-acperiod="month"'), true);
    assert.equal(month.includes('class="pill on" data-acperiod="custom"'), false);
  } finally {
    g.set = origSet;
    g.document = prevDoc;
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'week' } }));
    UI.writeAccountScope({ scope: 'all', projectId: '', periodKind: 'week', anchorDate: '2026-11-16' });
  }
});

test('a full custom date redraws and returns the caret to that field', () => {
  store.parties = [{ id: 'p1', name: 'حسن' }];
  const prevDoc = g.document;
  const active = { id: '' };
  const fields = {
    'statement-from': {
      id: 'statement-from',
      caret: /** @type {number | null} */ (null),
      focus() { active.id = 'statement-from'; },
      setSelectionRange(start) { this.caret = start; },
    },
    'statement-to': {
      id: 'statement-to',
      caret: /** @type {number | null} */ (null),
      focus() { active.id = 'statement-to'; },
      setSelectionRange(start) { this.caret = start; },
    },
  };
  g.document = { querySelector: sel => fields[String(sel || '').replace(/^#/, '')] || null };
  let shot = '';
  const view = installView(() => {
    const model = ownerModel();
    model.screen.tab = 'statement';
    shot = UI.accountHtml(model, 'p1');
  });
  UI.writeAccountScope({ scope: 'all', projectId: '', periodKind: 'week', anchorDate: '2026-11-16' });
  try {
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'custom' } }));
    const opened = view.paints();
    UI.onInput(/** @type {any} */ ({ id: 'statement-from', value: '2026-11-18', selectionStart: 10 }));
    assert.equal(view.paints(), opened + 1);
    assert.equal(active.id, 'statement-from');
    assert.equal(fields['statement-from'].caret, 10);
    assert.equal(fields['statement-to'].caret, null);
    assert.equal(shot.includes('value="2026-11-18"'), true);
    assert.equal(shot.includes('رصيد أول المدة'), false);
    UI.onInput(/** @type {any} */ ({ id: 'statement-to', value: '2026-11-20', selectionStart: 8 }));
    assert.equal(view.paints(), opened + 2);
    assert.equal(active.id, 'statement-to');
    assert.equal(fields['statement-to'].caret, 8);
    assert.equal(fields['statement-from'].caret, 10);
    assert.equal(shot.includes('value="2026-11-20"'), true);
    assert.equal(shot.includes('رصيد أول المدة'), true);
  } finally {
    g.document = prevDoc;
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'week' } }));
    UI.writeAccountScope({ scope: 'all', projectId: '', periodKind: 'week', anchorDate: '2026-11-16' });
  }
});

test('a partial or invalid statement date keeps the field and does not stick', () => {
  store.parties = [{ id: 'p1', name: 'حسن' }];
  const stuck = ['2026-11-2', '2026-11-193', '٢٠٢٦-١١-٢'];
  function paint() {
    const model = ownerModel();
    model.screen.tab = 'statement';
    return UI.accountHtml(model, 'p1');
  }
  function keepWeek(anchor) {
    for (const value of stuck) {
      UI.onInput(/** @type {any} */ ({ id: 'statement-from', value, selectionStart: value.length }));
      const rendered = paint();
      assert.equal(rendered.includes('id="statement-from"'), true, value);
      const afterHash = paint();
      assert.equal(afterHash.includes('id="statement-from"'), true, value);
      UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'month' } }));
      UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'week' } }));
      const tapped = paint();
      assert.equal(tapped.includes('id="statement-from"'), true, value);
      assert.equal(UI.readAccountScope().anchorDate, anchor, value);
      assert.equal(UI.readAccountScope().periodKind, 'week');
      const week = Accounts.periodBounds('week', anchor);
      assert.equal(tapped.includes(week.periodStart), true, value);
      assert.equal(tapped.includes(week.periodEnd), true, value);
    }
  }
  try {
    UI.writeAccountScope({ scope: 'all', projectId: '', periodKind: 'week', anchorDate: '2026-11-16' });
    keepWeek('2026-11-16');
    UI.onInput(/** @type {any} */ ({ id: 'statement-from', value: '2026-11-23', selectionStart: 10 }));
    assert.deepEqual(UI.accountPeriod(), Accounts.periodBounds('week', '2026-11-23'));
    const latin = paint();
    assert.equal(latin.includes('2026-11-21'), true);
    assert.equal(latin.includes('2026-11-27'), true);
    UI.onInput(/** @type {any} */ ({ id: 'statement-from', value: '٢٠٢٦-١١-١٠', selectionStart: 10 }));
    assert.equal(UI.readAccountScope().anchorDate, '2026-11-10');
    assert.deepEqual(UI.accountPeriod(), { periodStart: '2026-11-07', periodEnd: '2026-11-13' });

    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'month' } }));
    UI.writeAccountScope({ scope: 'all', projectId: '', periodKind: 'month', anchorDate: '2026-11-16' });
    for (const value of stuck) {
      UI.onInput(/** @type {any} */ ({ id: 'statement-from', value, selectionStart: value.length }));
      const rendered = paint();
      assert.equal(rendered.includes('id="statement-from"'), true, value);
      const afterHash = paint();
      assert.equal(afterHash.includes('id="statement-from"'), true, value);
      assert.equal(afterHash.includes('2026-11-01'), true, value);
      assert.equal(afterHash.includes('2026-11-30'), true, value);
      UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'month' } }));
      UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'week' } }));
      const tapped = paint();
      assert.equal(tapped.includes('id="statement-from"'), true, value);
      assert.equal(UI.readAccountScope().anchorDate, '2026-11-16', value);
      assert.equal(UI.readAccountScope().periodKind, 'week');
      UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'month' } }));
    }
    UI.onInput(/** @type {any} */ ({ id: 'statement-from', value: '2026-10-05', selectionStart: 10 }));
    assert.deepEqual(UI.accountPeriod(), { periodStart: '2026-10-01', periodEnd: '2026-10-31' });
    UI.onInput(/** @type {any} */ ({ id: 'statement-from', value: '٢٠٢٦-١١-٢٣', selectionStart: 10 }));
    assert.equal(UI.readAccountScope().anchorDate, '2026-11-23');
    assert.equal(UI.readAccountScope().periodKind, 'month');
    assert.deepEqual(UI.accountPeriod(), { periodStart: '2026-11-01', periodEnd: '2026-11-30' });

    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'custom' } }));
    UI.onInput(/** @type {any} */ ({ id: 'statement-from', value: '2026-11-2', selectionStart: 8 }));
    UI.onInput(/** @type {any} */ ({ id: 'statement-to', value: '2026-11-193', selectionStart: 10 }));
    const customBad = paint();
    assert.equal(customBad.includes('id="statement-from"'), true);
    assert.equal(customBad.includes('id="statement-to"'), true);
    assert.equal(customBad.includes('رصيد أول المدة'), false);
    const customHash = paint();
    assert.equal(customHash.includes('id="statement-from"'), true);
    assert.equal(customHash.includes('id="statement-to"'), true);
    UI.onInput(/** @type {any} */ ({ id: 'statement-from', value: '٢٠٢٦-١١-٢', selectionStart: 8 }));
    UI.onInput(/** @type {any} */ ({ id: 'statement-to', value: '٢٠٢٦-١١-١٩٣', selectionStart: 10 }));
    const customArabic = paint();
    assert.equal(customArabic.includes('id="statement-from"'), true);
    assert.equal(customArabic.includes('id="statement-to"'), true);
    assert.equal(customArabic.includes('value="٢٠٢٦-١١-٢"'), true);
    assert.equal(customArabic.includes('value="٢٠٢٦-١١-١٩٣"'), true);
    assert.equal(customArabic.includes('رصيد أول المدة'), false);
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'month' } }));
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'week' } }));
    const back = paint();
    assert.equal(back.includes('id="statement-from"'), true);
    assert.equal(UI.readAccountScope().anchorDate, '2026-11-23');
    assert.equal(back.includes('2026-11-21'), true);
    assert.equal(back.includes('2026-11-27'), true);
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'custom' } }));
    UI.onInput(/** @type {any} */ ({ id: 'statement-from', value: '٢٠٢٦-١١-١٨', selectionStart: 10 }));
    UI.onInput(/** @type {any} */ ({ id: 'statement-to', value: '٢٠٢٦-١١-٢٠', selectionStart: 10 }));
    const customOk = paint();
    assert.equal(customOk.includes('id="statement-from"'), true);
    assert.equal(customOk.includes('id="statement-to"'), true);
    assert.equal(customOk.includes('value="٢٠٢٦-١١-١٨"'), true);
    assert.equal(customOk.includes('value="٢٠٢٦-١١-٢٠"'), true);
    assert.equal(customOk.includes('رصيد أول المدة'), true);
    assert.equal(UI.readAccountScope().anchorDate, '2026-11-23');
    assert.equal(UI.readAccountScope().periodKind, 'week');
  } finally {
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'week' } }));
    UI.writeAccountScope({ scope: 'all', projectId: '', periodKind: 'week', anchorDate: '2026-11-16' });
  }
});

test('a half-typed statement date keeps its text and focus across a redraw', () => {
  store.parties = [{ id: 'p1', name: 'حسن' }];
  const prevDoc = g.document;
  const active = { id: '' };
  const field = {
    id: 'statement-from',
    selectionStart: 8,
    caret: /** @type {number | null} */ (null),
    focus() { active.id = 'statement-from'; },
    setSelectionRange(start) { this.caret = start; this.selectionStart = start; },
  };
  g.document = {
    activeElement: field,
    querySelector: sel => (sel === '#statement-from' ? field : null),
  };
  installView();
  UI.writeAccountScope({ scope: 'all', projectId: '', periodKind: 'week', anchorDate: '2026-11-16' });
  try {
    UI.onInput(/** @type {any} */ ({ id: 'statement-from', value: '2026-11-2', selectionStart: 8 }));
    const model = ownerModel();
    model.screen.tab = 'statement';
    const html = UI.accountHtml(model, 'p1');
    assert.equal(html.includes('value="2026-11-2"'), true);
    assert.equal(UI.readAccountScope().anchorDate, '2026-11-16');
    const held = UI.statementCaret();
    assert.equal(held && held.id, 'statement-from');
    assert.equal(held && held.caret, 8);
    UI.holdStatementFocus(held);
    assert.equal(active.id, 'statement-from');
    assert.equal(field.caret, 8);
  } finally {
    g.document = prevDoc;
    UI.writeAccountScope({ scope: 'all', projectId: '', periodKind: 'week', anchorDate: '2026-11-16' });
  }
});

test('an Arabic-Indic statement date sets the period', () => {
  store.parties = [{ id: 'p1', name: 'حسن' }];
  UI.writeAccountScope({ scope: 'all', projectId: '', periodKind: 'week', anchorDate: '2026-11-16' });
  try {
    UI.onInput(/** @type {any} */ ({ id: 'statement-from', value: '٢٠٢٦-١١-٢٣', selectionStart: 10 }));
    assert.equal(UI.readAccountScope().anchorDate, '2026-11-23');
    assert.deepEqual(UI.accountPeriod(), { periodStart: '2026-11-21', periodEnd: '2026-11-27' });
    const model = ownerModel();
    model.screen.tab = 'statement';
    const html = UI.accountHtml(model, 'p1');
    assert.equal(html.includes('value="٢٠٢٦-١١-٢٣"'), true);
    assert.equal(html.includes('2026-11-21'), true);
    assert.equal(html.includes('2026-11-27'), true);
  } finally {
    UI.writeAccountScope({ scope: 'all', projectId: '', periodKind: 'week', anchorDate: '2026-11-16' });
  }
});

test('a custom range keeps a half-typed date and reads Arabic digits', () => {
  store.parties = [{ id: 'p1', name: 'حسن' }];
  const prevDoc = g.document;
  const active = { id: '' };
  /** @type {Record<string, { id: string, selectionStart: number | null, caret: number | null, focus: () => void, setSelectionRange: (start: number) => void }>} */
  const fields = {};
  for (const id of ['statement-from', 'statement-to']) {
    fields[id] = {
      id,
      selectionStart: null,
      caret: null,
      focus() { active.id = id; },
      setSelectionRange(start) { this.caret = start; this.selectionStart = start; },
    };
  }
  g.document = {
    activeElement: fields['statement-from'],
    querySelector: sel => fields[String(sel || '').replace(/^#/, '')] || null,
  };
  installView();
  UI.writeAccountScope({ scope: 'all', projectId: '', periodKind: 'week', anchorDate: '2026-11-16' });
  try {
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'custom' } }));
    fields['statement-from'].selectionStart = 8;
    UI.onInput(/** @type {any} */ ({ id: 'statement-from', value: '2026-11-1', selectionStart: 8 }));
    const model = ownerModel();
    model.screen.tab = 'statement';
    const partial = UI.accountHtml(model, 'p1');
    assert.equal(partial.includes('value="2026-11-1"'), true);
    assert.equal(partial.includes('id="statement-to"'), true);
    assert.equal(partial.includes('رصيد أول المدة'), false);
    const held = UI.statementCaret();
    assert.equal(held && held.id, 'statement-from');
    assert.equal(held && held.caret, 8);
    UI.holdStatementFocus(held);
    assert.equal(active.id, 'statement-from');
    assert.equal(fields['statement-from'].caret, 8);
    g.document.activeElement = fields['statement-to'];
    fields['statement-to'].selectionStart = 10;
    UI.onInput(/** @type {any} */ ({ id: 'statement-from', value: '٢٠٢٦-١١-١٨', selectionStart: 10 }));
    UI.onInput(/** @type {any} */ ({ id: 'statement-to', value: '٢٠٢٦-١١-٢٠', selectionStart: 10 }));
    const html = UI.accountHtml(model, 'p1');
    assert.equal(html.includes('value="٢٠٢٦-١١-١٨"'), true);
    assert.equal(html.includes('value="٢٠٢٦-١١-٢٠"'), true);
    assert.equal(html.includes('رصيد أول المدة'), true);
    assert.equal(UI.readAccountScope().anchorDate, '2026-11-16');
    const toHeld = UI.statementCaret();
    UI.holdStatementFocus(toHeld);
    assert.equal(active.id, 'statement-to');
    assert.equal(fields['statement-to'].caret, 10);
  } finally {
    g.document = prevDoc;
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acperiod: 'week' } }));
    UI.writeAccountScope({ scope: 'all', projectId: '', periodKind: 'week', anchorDate: '2026-11-16' });
  }
});
