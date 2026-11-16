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

test('canCreateParty is false until collectionFor returns parties, and false in the demo', () => {
  assert.equal(UI.canCreateParty(g.me()), false);
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
  assert.equal(kvAmount(html, 'مستحق له'), '400,000 د.ع');
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
  assert.equal(kvAmount(html, 'مستحق له'), '480,000 د.ع');
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
  assert.equal(kvAmount(html, 'مستحق عليه'), '100,000 د.ع');
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
  assert.equal(kvAmount(html, 'مستحق له'), '0 د.ع');
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
  assert.equal(kvAmount(html, 'مستحق عليه'), '100,000 د.ع');
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

test('install runs when ForemenUI is missing', () => {
  const views = {};
  UI.install({ views, titles: {}, state: {}, render() {}, esc: s => String(s), money: n => String(n), queueDoc() {}, confirmShell: () => '', lastSyncAt: () => 0, formatSyncTime: () => '' });
  assert.equal(typeof views.accounts, 'function');
  assert.equal(typeof views.account, 'function');
});
