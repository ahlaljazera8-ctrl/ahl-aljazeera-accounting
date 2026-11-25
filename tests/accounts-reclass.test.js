const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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
g.K = {
  parties: 'parties', agreements: 'agreements', accountTxns: 'accountTxns', statementApprovals: 'statementApprovals',
  projects: 'projects', entries: 'entries', outbox: 'outbox', syncErrors: 'syncErrors', laborReviews: 'laborReviews',
  refusedLinks: 'refusedLinks',
};
const store = {
  parties: /** @type {any[]} */ ([]),
  agreements: /** @type {any[]} */ ([]),
  accountTxns: /** @type {any[]} */ ([]),
  statementApprovals: /** @type {any[]} */ ([]),
  projects: /** @type {any[]} */ ([]),
  entries: /** @type {any[]} */ ([]),
  outbox: /** @type {string[]} */ ([]),
  syncErrors: /** @type {Record<string, unknown>} */ ({}),
  laborReviews: /** @type {any[]} */ ([]),
};
g.get = (key, fallback) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallback);
g.set = (key, value) => { store[key] = value; return Promise.resolve(); };
g.me = () => ({ uid: 'u-ameer', role: 'owner', active: true, displayName: 'أمير' });
let uuids = 0;
g.uuid = () => 'aaaaaaaa-bbbb-cccc-dddd-' + String(++uuids).padStart(12, '0');
g.today = () => '2026-11-25';
g.deviceId = 'phone';
g.demoRole = () => '';
g.sessionEpoch = 1;
g.queueDoc = id => { if (!store.outbox.includes(id)) store.outbox = store.outbox.concat([id]); };
g.baghdadDate = ms => new Date(ms + 3 * 3600000).toISOString().slice(0, 10);
g.flushRemote = () => Promise.resolve();

/** @type {Record<string, any>} */
let nodes = {};
g.document = {
  addEventListener() {},
  querySelector(sel) {
    const text = String(sel || '');
    if (text.charAt(0) === '#') return nodes[text.slice(1)] || null;
    const named = /^\[data-rc-reason-for="([^"]+)"\]$/.exec(text);
    if (named) return nodes['reason-' + named[1]] || nodes['rc-dup-reason'] || null;
    return null;
  },
  querySelectorAll() { return []; },
  createElement: () => ({}),
  createElementNS: () => ({}),
};

const UI = require('../public/accounts-view.js');
g.AccountsView = UI;
const Pay = require('../public/accounts-payment.js');
g.AccountPayment = Pay;
const Correct = /** @type {any} */ (require('../public/accounts-correct.js'));
g.AccountCorrect = Correct;
const Reclass = /** @type {any} */ (require('../public/accounts-reclass.js'));
g.AccountReclass = Reclass;

const JOB = 'JOB';
const OLD = 'OLD';
const DEP = 'اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً';

function labour(id, over) {
  const amount = id === 'e30' ? 30000 : id === 'e1' || id === 'e10' ? 1000 : 80000;
  const entryDate = id === 'e30' ? '2026-03-09' : id === 'e10' ? '2026-03-02' : id === 'e1' ? '2026-03-01' : '2026-03-04';
  return Object.assign({
    id, projectId: JOB, direction: 'expense', entryType: 'labour', amount, currency: 'IQD', entryDate,
    isReversal: false, description: 'أجر', partyName: 'حسن', createdBy: 'u-ameer', createdAtDevice: 1, deviceId: 'phone',
  }, over || {});
}
function lrev(id, over) {
  const orig = store.entries.find(row => row.id === id) || labour(id);
  return Object.assign({
    id: 'rev_' + id, projectId: orig.projectId, direction: 'expense', entryType: 'labour', amount: orig.amount,
    currency: 'IQD', entryDate: '2026-11-25', isReversal: true, reversesEntryId: id, reversalReason: 'سبب',
    description: 'L:' + id + ';تصحيح: أجر', createdBy: 'u-ameer', createdAtServer: 1700000000000, deviceId: 'phone',
  }, over || {});
}
function advance(id, over) {
  return Object.assign({
    id, docType: 'accountTxn', kind: 'body', purpose: 'advanceLabor', projectId: JOB, partyId: 'p1', ledger: 'labor',
    currency: 'IQD', fxRate: 1, amount: 80000, txnDate: '2026-11-25', description: 'L:e80;2026-03-04 e80',
    createdBy: 'u-ameer', createdByName: 'أمير', createdAtServer: 1000, deviceId: 'phone', effect: { cost: 0, person: -1, cash: 1 },
  }, over || {});
}
function review(id, over) {
  return Object.assign({
    id: 'lrv_' + id, docType: 'laborReview', entryId: id, projectId: JOB, decision: 'deducted', reviewedOn: '2026-11-25',
    createdBy: 'u-ameer', createdByName: 'أمير', createdAtServer: null, deviceId: 'phone',
  }, over || {});
}

function reset() {
  nodes = {};
  uuids = 0;
  store.parties = [{ id: 'p1', name: 'حسن' }, { id: 'p2', name: 'كريم' }];
  store.agreements = [];
  store.accountTxns = [];
  store.statementApprovals = [];
  store.projects = [{ id: JOB, name: 'المدرسة', status: 'active' }, { id: OLD, name: 'القديم', status: 'archived' }];
  store.entries = [labour('e80'), labour('e30')];
  store.outbox = [];
  store.syncErrors = {};
  store.laborReviews = [];
  delete store.refusedLinks;
  Accounts.CONTRACTOR_COST_START = null;
  g.me = () => ({ uid: 'u-ameer', role: 'owner', active: true, displayName: 'أمير' });
  g.today = () => '2026-11-25';
  UI.writeAccountScope({ scope: 'project', projectId: JOB, periodKind: 'month', anchorDate: '2026-11-16' });
}

/** @type {any} */
let api;
function boot() {
  api = {
    views: { accounts: () => '<div id="accounts-base"></div>', contractor: () => 'contractor-home', account: () => 'person' },
    titles: {},
    render() {},
    esc: value => String(value == null ? '' : value),
    money: n => Ledger.fmt(n) + ' د.ع',
    queueDoc(id) { g.queueDoc(id); },
  };
  UI.install(api);
  Reclass.install(api);
  return api.views.accounts();
}
function html() { return api.views.accounts(); }
function click(dataset) {
  const button = { dataset, disabled: false };
  const action = g.AccountActions.find(item => item && item.id === 'reclass-review');
  return { handled: action.onClick(button), button };
}
function ctx(over) {
  const entries = store.entries;
  const txns = store.accountTxns;
  const syncErrors = store.syncErrors;
  const base = {
    entries, txns, syncErrors, outbox: store.outbox, reviews: store.laborReviews,
    index: Accounts.rowIndex(txns, syncErrors),
    activeProjectIds: new Set(store.projects.filter(row => row.status === 'active').map(row => row.id)),
  };
  return Object.assign(base, over || {});
}
function state(id) {
  return Reclass.rowState(store.entries.find(row => row.id === id), ctx());
}

test('U1 candidates', () => {
  reset();
  store.entries.push(labour('sub', { entryType: 'subcontractor', amount: 200000 }));
  store.entries.push(labour('fm', { foremanId: 'fm1' }));
  store.entries.push(labour('bad'));
  store.syncErrors = { bad: 'رُفض الإرسال' };
  store.entries.push({ id: 'pay', projectId: JOB, direction: 'income', entryType: 'clientPayment', amount: 5000, currency: 'IQD', entryDate: '2026-03-01', isReversal: false });
  store.entries.push(lrev('other', { description: 'تصحيح: سهو', reversesEntryId: 'e30' }));
  store.entries.push(lrev('e30', { description: 'تصحيح: سهو', createdAtServer: 5 }));
  const ids = Reclass.misbookedCandidates(store.entries, store.syncErrors).map(row => row.id);
  assert.deepEqual(ids.filter(id => id === 'e80' || id === 'e30').sort(), ['e30', 'e80']);
  assert.equal(ids.includes('sub'), false);
  assert.equal(ids.includes('fm'), false);
  assert.equal(ids.includes('bad'), false);
  assert.equal(ids.includes('pay'), false);
  assert.equal(ids.includes('rev_e30'), false);
  assert.equal(state('e30').kind, 'other');
  const page = boot();
  assert.match(page, /80,000/);
  assert.match(page, /تاريخ القيد/);
  assert.match(page, /<code>e80<\/code>/);
  assert.equal(page.includes('data-rc-row="e30"'), false);
});

test('U2 ملغى writes nothing and shows the preview', () => {
  reset();
  const before = { entries: store.entries.length, txns: store.accountTxns.length, outbox: store.outbox.slice() };
  boot();
  click({ rcCancel: 'e80' });
  assert.equal(store.entries.length, before.entries);
  assert.equal(store.accountTxns.length, before.txns);
  assert.deepEqual(store.outbox, before.outbox);
  const page = html();
  assert.match(page, /ملغى/);
  assert.match(page, /سطر مصحّح/);
  assert.match(page, /80,000 د\.ع/);
  assert.match(page, /2026-03-04/);
  assert.match(page, /<code>e80<\/code>/);
  assert.match(page, /تنبيه فقط، ولا يمنع تسجيل دفعة/);
  assert.equal(page.includes('data-rc-party'), false);
});

test('U3 reversal written', () => {
  reset();
  boot();
  click({ rcCancel: 'e80' });
  nodes['rc-reason'] = { value: 'سلفة قديمة' };
  click({ rcSaveRev: 'e80' });
  const rev = store.entries.find(row => row.id === 'rev_e80');
  assert.equal(store.entries.filter(row => row.id === 'rev_e80').length, 1);
  assert.equal(rev.isReversal, true);
  assert.equal(rev.reversesEntryId, 'e80');
  assert.equal(rev.entryDate, '2026-11-25');
  assert.equal(rev.amount, 80000);
  assert.equal(rev.description.startsWith('L:e80;تصحيح: '), true);
  assert.equal(store.outbox[store.outbox.length - 1], 'rev_e80');
  assert.equal(store.accountTxns.length, 0);
  assert.equal(store.entries.find(row => row.id === 'e30').amount, 30000);
  assert.equal(store.accountTxns.some(row => row.purpose === 'settle'), false);
});

test('U4 blank reason', () => {
  reset();
  boot();
  click({ rcCancel: 'e80' });
  assert.match(html(), /data-rc-save-rev="e80" disabled/);
  nodes['rc-reason'] = { value: '   ' };
  click({ rcSaveRev: 'e80' });
  assert.equal(store.entries.some(row => row.id === 'rev_e80'), false);
});

test('U5 two taps', () => {
  reset();
  boot();
  click({ rcCancel: 'e80' });
  nodes['rc-reason'] = { value: 'سبب' };
  click({ rcSaveRev: 'e80' });
  click({ rcSaveRev: 'e80' });
  assert.equal(store.entries.filter(row => row.id === 'rev_e80').length, 1);
  assert.equal(store.outbox.filter(id => id === 'rev_e80').length, 1);
});

test('U6 500 cap', () => {
  reset();
  store.entries = [labour('e80', { description: 'ا'.repeat(500) })];
  const long = Reclass.stillOwedReversal({
    entry: store.entries[0], reversalReason: 'سبب', user: g.me(), deviceId: 'phone', entryDate: '2026-11-25', now: 10,
  });
  assert.equal(Array.from(long.doc.description).length, 500);
  assert.equal(long.doc.description.startsWith('L:e80;'), true);
  store.entries = [labour('e80', { description: '1234567890' })];
  const short = Reclass.stillOwedReversal({
    entry: store.entries[0], reversalReason: 'سبب', user: g.me(), deviceId: 'phone', entryDate: '2026-11-25', now: 10,
  });
  assert.equal(short.doc.description, 'L:e80;تصحيح: 1234567890');
  store.entries = [labour('e80', { description: 'ا'.repeat(497) + '😀' + 'ب'.repeat(10) })];
  const emoji = Reclass.stillOwedReversal({
    entry: store.entries[0], reversalReason: 'سبب', user: g.me(), deviceId: 'phone', entryDate: '2026-11-25', now: 10,
  });
  assert.equal(emoji.doc.description.includes('😀'), false);
  assert.equal(emoji.doc.description.startsWith('L:e80;'), true);
  store.entries = [labour('e80', { description: 'ا'.repeat(486) + '😀' + 'ز'.repeat(10) })];
  const boundary = Reclass.stillOwedReversal({
    entry: store.entries[0], reversalReason: 'سبب', user: g.me(), deviceId: 'phone', entryDate: '2026-11-25', now: 10,
  });
  assert.equal(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(boundary.doc.description), false);
  assert.equal(boundary.doc.description.startsWith('L:e80;'), true);
  assert.equal(boundary.doc.description.includes('😀'), false);
});

test('U7 already deducted', () => {
  reset();
  boot();
  click({ rcReview: 'e30' });
  assert.equal(store.entries.length, 2);
  assert.equal(store.accountTxns.length, 0);
  assert.equal(store.laborReviews.length, 1);
  assert.deepEqual(store.laborReviews[0], {
    id: 'lrv_e30', docType: 'laborReview', entryId: 'e30', projectId: JOB, decision: 'deducted',
    reviewedOn: '2026-11-25', createdBy: 'u-ameer', createdByName: 'أمير', createdAtServer: null, deviceId: 'phone',
  });
  assert.equal(store.outbox[store.outbox.length - 1], 'lrv_e30');
  click({ rcReview: 'e30' });
  assert.equal(store.laborReviews.length, 1);
  const page = html();
  assert.match(page, /انخصم/);
  assert.match(page, /2026-11-25/);
  assert.match(page, /أمير/);
  assert.equal(page.includes('data-rc-review="e30"'), false);
});

test('U8 reversal queued', () => {
  reset();
  store.entries.push(lrev('e80', { createdAtServer: null }));
  store.outbox = ['rev_e80'];
  boot();
  assert.equal(state('e80').kind, 'revQueued');
  assert.match(html(), /data-rc-owed="1"/);
  assert.match(html(), /<button type="button" disabled>سلفة<\/button>/);
  store.outbox = [];
  assert.equal(state('e80').kind, 'revQueued');
});

test('U9 reversal accepted survives a reload', () => {
  reset();
  store.entries.push(lrev('e80'));
  boot();
  assert.equal(state('e80').kind, 'owed');
  assert.match(html(), /data-rc-advance="e80"/);
  delete require.cache[require.resolve('../public/accounts-reclass.js')];
  const fresh = require('../public/accounts-reclass.js');
  g.AccountReclass = fresh;
  fresh.install(api);
  assert.equal(fresh.rowState(store.entries.find(row => row.id === 'e80'), ctx()).kind, 'owed');
});

test('U10 reversal refused', () => {
  reset();
  store.entries.push(lrev('e80', { createdAtServer: null }));
  store.syncErrors = { rev_e80: 'رُفض الإرسال' };
  boot();
  const page = html();
  assert.match(page, /data-rc-list="1"/);
  assert.match(page, /رُفض الإرسال/);
  assert.equal(page.includes('data-rc-cancel="e80"'), false);
  assert.equal(page.includes('data-rc-owed'), false);
  const built = Reclass.stillOwedReversal({
    entry: store.entries.find(row => row.id === 'e80'), reversalReason: 'سبب', user: g.me(), deviceId: 'phone', entryDate: '2026-11-25', now: 10,
  });
  assert.equal(built.doc, null);
  assert.equal(built.errors.includes('DUPLICATE'), true);
  assert.equal(built.errors.includes('القيد معكوس مسبقاً'), true);
});

test('U11 ordinary reversal', () => {
  reset();
  store.entries.push(lrev('e80', { description: 'تصحيح: سهو' }));
  assert.equal(state('e80').kind, 'other');
  boot();
  const page = html();
  assert.equal(page.includes('data-rc-row="e80"'), false);
  assert.equal(page.includes('data-rc-owed'), false);
});

test('U12 person required', () => {
  reset();
  store.entries.push(lrev('e80'));
  boot();
  click({ rcAdvance: 'e80' });
  assert.match(html(), /data-rc-save-adv="e80" disabled/);
  click({ rcSaveAdv: 'e80' });
  assert.equal(store.accountTxns.length, 0);
});

test('U13 advance written', () => {
  reset();
  store.entries.push(lrev('e80'));
  boot();
  click({ rcAdvance: 'e80' });
  click({ rcParty: 'p1', rcFor: 'e80' });
  click({ rcSaveAdv: 'e80' });
  assert.equal(store.accountTxns.length, 1);
  const doc = store.accountTxns[0];
  assert.equal(doc.purpose, 'advanceLabor');
  assert.equal(doc.kind, 'body');
  assert.equal(doc.amount, 80000);
  assert.equal(doc.partyId, 'p1');
  assert.equal(doc.projectId, JOB);
  assert.equal(doc.txnDate, '2026-11-25');
  assert.equal(doc.description.startsWith('L:e80;'), true);
  assert.equal(doc.description.includes('2026-03-04'), true);
  assert.equal(doc.description.includes('e80'), true);
  assert.equal(store.outbox.includes(doc.id), true);
  assert.equal(state('e80').kind, 'advQueued');
  assert.match(html(), /<button type="button" disabled>سلفة<\/button>/);
  click({ rcSaveAdv: 'e80' });
  assert.equal(store.accountTxns.length, 1);
});

test('U14 e1 does not match e10', () => {
  reset();
  store.entries.push(labour('e1'), labour('e10'), lrev('e1', { amount: 1000 }));
  store.accountTxns = [advance('adv', { description: 'L:e10;2026-03-02 e10', amount: 1000 })];
  assert.equal(state('e1').kind, 'owed');
  assert.equal(Reclass.coveringAdvances('e1', store.accountTxns, Accounts.rowIndex(store.accountTxns, {})).length, 0);
});

test('U15 refused advance', () => {
  reset();
  store.entries.push(lrev('e80'));
  store.accountTxns = [advance('old-adv', { createdAtServer: null })];
  store.syncErrors = { 'old-adv': 'رُفض الإرسال' };
  boot();
  assert.equal(state('e80').kind, 'owed');
  assert.match(html(), /<code>old-adv<\/code>/);
  assert.match(html(), /رُفض الإرسال/);
  click({ rcAdvance: 'e80' });
  const page = html();
  const fresh = page.match(/<code>(aaaaaaaa-bbbb-cccc-dddd-[0-9a-f]{12})<\/code>/);
  assert.ok(fresh);
  assert.notEqual(fresh[1], 'old-adv');
  assert.equal(store.refusedLinks, undefined);
});

test('U16 reversed advance', () => {
  reset();
  store.entries.push(lrev('e80'));
  store.accountTxns = [advance('a'), { id: 'rev_a', docType: 'accountTxn', kind: 'rev', purpose: 'advanceLabor', reversesId: 'a', projectId: JOB, partyId: 'p1', amount: 80000, createdAtServer: 9 }];
  assert.equal(state('e80').kind, 'owed');
});

test('U17 duplicates', () => {
  reset();
  store.entries.push(lrev('e80'));
  store.accountTxns = [advance('b', { createdAtServer: 1000 }), advance('a', { createdAtServer: 2000 })];
  boot();
  const plan = state('e80').plan;
  assert.equal(state('e80').kind, 'duplicate');
  assert.equal(plan.mode, 'oldest');
  assert.equal(plan.keepId, 'b');
  assert.deepEqual(plan.reverseIds, ['a']);
  const page = html();
  assert.match(page, /سلفة مكررة/);
  assert.match(page, /data-rc-dup-rev="a"/);
  assert.equal(page.includes('data-rc-dup-rev="b"'), false);
  store.accountTxns.push({ id: 'rev_a', docType: 'accountTxn', kind: 'rev', purpose: 'advanceLabor', reversesId: 'a', projectId: JOB, partyId: 'p1', amount: 80000, createdAtServer: 3000 });
  assert.equal(state('e80').kind, 'done');
  assert.equal(html().includes('سلفة مكررة'), false);
  assert.equal(Accounts.balances(store.accountTxns, { partyId: 'p1', projectId: JOB }).net, -80000);
  store.accountTxns = [advance('a', { createdAtServer: 1000 }), advance('b', { createdAtServer: 1000 })];
  assert.equal(state('e80').plan.keepId, 'a');
  assert.deepEqual(state('e80').plan.reverseIds, ['b']);
  store.accountTxns = [advance('a', { createdAtServer: null }), advance('b', { createdAtServer: 1000 })];
  assert.deepEqual(state('e80').plan.reverseIds, []);
});

test('U18 duplicate reversal', () => {
  reset();
  store.entries.push(lrev('e80'));
  store.accountTxns = [advance('b', { createdAtServer: 1000 }), advance('a', { createdAtServer: 2000 })];
  boot();
  nodes['rc-dup-reason'] = { value: 'مكرر' };
  click({ rcDupRev: 'a' });
  const rev = store.accountTxns.find(row => row.id === 'rev_a');
  assert.equal(rev.kind, 'rev');
  assert.equal(rev.reversesId, 'a');
  assert.equal(rev.reversalReason, 'مكرر');
  store.accountTxns = store.accountTxns.filter(row => row.id !== 'rev_a');
  nodes['rc-dup-reason'] = { value: '  ' };
  click({ rcDupRev: 'a' });
  assert.equal(store.accountTxns.some(row => row.id === 'rev_a'), false);
});

test('U19 reclassTotal', () => {
  reset();
  const Statement = require('../public/accounts-statement.js');
  g.AccountStatement = Statement;
  g.AccountReclass = Reclass;
  store.entries.push(lrev('e80'));
  store.accountTxns = [advance('a')];
  assert.equal(Reclass.reclassTotal(store.entries, store.accountTxns, store.syncErrors, JOB), 80000);
  const totals = Statement.contractorTotals(store.entries, store.accountTxns, store.syncErrors, { projectId: JOB });
  assert.equal(totals.reclassAdvance, 80000);
  assert.equal(totals.paidToContractors, totals.oldPaid + totals.unlinked + totals.newCash);
  assert.equal(totals.cost, totals.oldPaid + totals.unlinked + totals.newApproved);
  assert.equal(totals.paidToContractors, 80000);
  const card = Statement.totalsCardHtml(totals);
  assert.match(card, /data-st-reclass="1"/);
  assert.match(card, /أُعيد تصنيفها/);
  assert.match(card, /80,000/);
  store.accountTxns = [advance('a', { description: 'L:e1;2026-03-01 e1' })];
  assert.equal(Reclass.reclassTotal(store.entries, store.accountTxns, {}, JOB), 0);
  const quiet = Statement.contractorTotals(store.entries, store.accountTxns, {}, { projectId: JOB });
  assert.equal(quiet.reclassAdvance, 0);
  assert.equal(Statement.totalsCardHtml(quiet).includes('data-st-reclass'), false);
  store.accountTxns = [advance('a', { projectId: OLD })];
  store.entries[store.entries.length - 1].projectId = OLD;
  assert.equal(Reclass.reclassTotal(store.entries, store.accountTxns, {}, JOB), 0);
  store.entries[store.entries.length - 1].projectId = JOB;
  store.accountTxns = [advance('a')];
  assert.equal(Reclass.reclassTotal(store.entries, store.accountTxns, { rev_e80: 'رُفض الإرسال' }, JOB), 0);
});

test('U25 draw guard', () => {
  reset();
  store.entries.push(lrev('e80'));
  store.accountTxns = [
    advance('b', { createdAtServer: 1000 }),
    advance('a', { createdAtServer: 2000 }),
    { id: 'stl-a', docType: 'accountTxn', kind: 'stl', purpose: 'settle', settlesId: 'a', targetId: 'm1', projectId: JOB, partyId: 'p1', amount: 1000, createdAtServer: 3 },
  ];
  boot();
  assert.equal(state('e80').plan.blockedIds.includes('a'), true);
  const page = html();
  assert.equal(page.includes('data-rc-dup-rev="a"'), false);
  assert.match(page, /data-rc-dup-blocked="a"/);
  assert.match(page, new RegExp(DEP));
  click({ rcDupRev: 'a' });
  assert.equal(store.accountTxns.some(row => row.id === 'rev_a'), false);
  store.accountTxns = [
    advance('b', { createdAtServer: 1000 }), advance('a', { createdAtServer: 2000 }),
    { id: 'ret-a', docType: 'accountTxn', kind: 'body', purpose: 'returnAdvance', targetId: 'a', projectId: JOB, partyId: 'p1', amount: 1000, createdAtServer: 4 },
  ];
  assert.equal(state('e80').plan.blockedIds.includes('a'), true);
  store.accountTxns.push({ id: 'rev_ret-a', docType: 'accountTxn', kind: 'rev', purpose: 'returnAdvance', reversesId: 'ret-a', projectId: JOB, partyId: 'p1', amount: 1000, createdAtServer: 5 });
  assert.equal(state('e80').plan.reverseIds.includes('a'), true);
});

test('U26 different persons', () => {
  reset();
  store.entries.push(lrev('e80'));
  store.accountTxns = [advance('a', { partyId: 'p1', createdAtServer: 1000 }), advance('b', { partyId: 'p2', createdAtServer: 2000 })];
  boot();
  const plan = state('e80').plan;
  assert.equal(plan.mode, 'ownerPicks');
  assert.equal(plan.keepId, '');
  assert.deepEqual(plan.reverseIds.slice().sort(), ['a', 'b']);
  const page = html();
  assert.match(page, /حسن/);
  assert.match(page, /كريم/);
  nodes['rc-dup-reason'] = { value: 'الشخص الآخر' };
  click({ rcDupRev: 'b' });
  assert.equal(state('e80').kind, 'done');
  assert.equal(state('e80').advanceId, 'a');
  click({ rcDupRev: 'a' });
  assert.equal(store.accountTxns.some(row => row.id === 'rev_a'), false);
});

test('U20 gate', () => {
  reset();
  assert.equal(Accounts.CONTRACTOR_COST_START, null);
  let page = boot();
  assert.match(page, /data-rc-list="1"/);
  const contractor = api.views.contractor;
  assert.equal(contractor(), 'contractor-home');
  g.me = () => ({ uid: 'site', role: 'site', active: true, displayName: 'موقع' });
  assert.equal(html().includes('data-rc-list'), false);
  g.me = () => ({ uid: 'u-ameer', role: 'owner', active: false, displayName: 'أمير' });
  assert.equal(html().includes('data-rc-list'), false);
  g.me = () => ({ uid: 'u-ameer', role: 'owner', displayName: 'أمير' });
  assert.match(html(), /data-rc-list="1"/);
});

test('U21 archived project', () => {
  reset();
  store.entries.push(labour('old', { projectId: OLD }));
  boot();
  const row = state('old');
  assert.equal(row.kind, 'open');
  assert.equal(row.canCancel, false);
  const page = html();
  assert.equal(page.includes('data-rc-cancel="old"'), false);
  assert.match(page, /data-rc-closed="old"/);
  assert.match(page, /المشروع مؤرشف، لا يُلغى القيد/);
  assert.match(page, /data-rc-review="old"/);
  click({ rcReview: 'old' });
  assert.equal(store.laborReviews[0].id, 'lrv_old');
  const built = Reclass.stillOwedReversal({
    entry: store.entries.find(item => item.id === 'old'), reversalReason: 'سبب', user: g.me(), deviceId: 'phone', entryDate: '2026-11-25', now: 10,
  });
  assert.deepEqual(built.errors, ['inactive']);
  assert.equal(built.doc, null);
});

test('U22 no bulk', () => {
  reset();
  store.entries.push(labour('e1'));
  boot();
  const before = store.entries.length;
  click({ rcCancel: 'e80' });
  nodes['rc-reason'] = { value: 'واحد' };
  click({ rcSaveRev: 'e80' });
  assert.equal(store.entries.length, before + 1);
  assert.equal(state('e30').kind, 'open');
  assert.equal(state('e1').kind, 'open');
});

test('U23 stale card', () => {
  reset();
  boot();
  click({ rcCancel: 'e80' });
  nodes['rc-reason'] = { value: 'متأخر' };
  store.entries.push(lrev('e80'));
  const count = store.entries.length;
  click({ rcSaveRev: 'e80' });
  assert.equal(store.entries.length, count);
});

test('U24 registry and حسابات', () => {
  reset();
  g.AccountActions = (g.AccountActions || []).filter(item => !String(item && item.id).startsWith('reclass-'));
  const before = g.AccountActions.length;
  const page = boot();
  const added = g.AccountActions.slice(before);
  assert.equal(added.length, 4);
  assert.equal(added.every(row => row.tab === 'contractor'), true);
  /** @type {readonly AccountTab[]} */
  const tabs = ['agreements', 'movements', 'statement'];
  for (const tab of tabs) {
    const model = UI.modelFor(g.me());
    model.screen.tab = tab;
    const body = UI.accountHtml(model, 'p1');
    assert.equal(body.includes('act-reclass'), false);
    assert.equal(body.includes('data-rc-'), false);
  }
  assert.match(page, /data-rc-list="1"/);
  assert.equal(api.views.account('p1').includes('data-rc-'), false);
  assert.equal(api.views.contractor().includes('data-rc-'), false);
});

test('U27 count and order', () => {
  reset();
  store.entries = [labour('e1'), labour('e30'), labour('e10')];
  store.laborReviews = [review('e30', { createdAtServer: 5 })];
  store.entries.push(lrev('e10', { amount: 1000, createdAtServer: null }));
  store.syncErrors = { rev_e10: 'رُفض الإرسال' };
  const page = boot();
  assert.match(page, /قيود مصروف قد تكون سلفاً \(3\)/);
  const order = [...page.matchAll(/data-rc-row="(.*?)"/g)].map(match => match[1]);
  assert.deepEqual(order, ['e1', 'e10', 'e30']);
});

test('U28 server review states', () => {
  reset();
  store.laborReviews = [review('e30')];
  store.syncErrors = { lrv_e30: 'رُفض الإرسال' };
  boot();
  assert.equal(state('e30').kind, 'reviewRefused');
  assert.match(html(), /رُفض الإرسال/);
  store.syncErrors = { rev_e30: 'رُفض الإرسال' };
  store.laborReviews = [review('e30', { createdAtServer: 9, createdByName: 'أمير' })];
  store.entries.push(lrev('e30', { amount: 30000, createdAtServer: null }));
  assert.equal(state('e30').kind, 'reviewed');
  store.laborReviews = [review('e30', { createdAtServer: 9, createdBy: 'owner-a', createdByName: 'أحمد' })];
  store.entries = [labour('e80'), labour('e30')];
  store.syncErrors = {};
  assert.equal(state('e30').kind, 'reviewed');
  assert.match(html(), /أحمد/);
});

test('U29 cash out unchanged', () => {
  reset();
  function cashOut(projectId) {
    const spent = Ledger.totals(Ledger.countedEntries(store.entries, store.syncErrors).filter(row => row.projectId === projectId)).spent;
    const index = Accounts.rowIndex(store.accountTxns, store.syncErrors);
    let cash = 0;
    store.accountTxns.forEach(row => {
      if (!row || row.projectId !== projectId || !Accounts.rowCounts(row, index)) return;
      const purpose = Accounts.PURPOSES[row.purpose];
      if (!purpose) return;
      cash += row.amount * purpose.effect.cash;
    });
    return spent + cash;
  }
  store.entries = [labour('e80')];
  assert.equal(cashOut(JOB), 80000);
  store.entries.push(lrev('e80'));
  store.accountTxns = [advance('a')];
  assert.equal(cashOut(JOB), 80000);
  assert.equal(store.accountTxns[0].amount, 80000);
  assert.equal(store.accountTxns[0].projectId, store.entries.find(row => row.id === 'e80').projectId);
});

test('U30 cost and balance move by the same amount', () => {
  reset();
  const before = Ledger.totals(Ledger.countedEntries(store.entries, {}).filter(row => row.projectId === JOB)).spent;
  store.entries.push(lrev('e80'));
  const after = Ledger.totals(Ledger.countedEntries(store.entries, {}).filter(row => row.projectId === JOB)).spent;
  assert.equal(before - after, 80000);
  store.accountTxns = [advance('a')];
  const stayed = Ledger.totals(Ledger.countedEntries(store.entries, {}).filter(row => row.projectId === JOB)).spent;
  assert.equal(stayed, after);
  assert.equal(Accounts.balances(store.accountTxns, { partyId: 'p1', projectId: JOB }).net, -80000);
});

test('U31 reused sentence', () => {
  const root = path.join(__dirname, '..', 'public');
  const reclass = fs.readFileSync(path.join(root, 'accounts-reclass.js'), 'utf8');
  const statement = fs.readFileSync(path.join(root, 'accounts-statement.js'), 'utf8');
  const correct = fs.readFileSync(path.join(root, 'accounts-correct.js'), 'utf8');
  const mine = reclass.match(/dependent: '([^']+)'/);
  const left = statement.match(/dependent: '([^']+)'/);
  const right = correct.match(/dependent: '([^']+)'/);
  assert.ok(mine && left && right);
  assert.equal(mine[1], left[1]);
  assert.equal(mine[1], right[1]);
});

test('U32 description date and id', () => {
  reset();
  store.entries.push(lrev('e80'));
  boot();
  click({ rcAdvance: 'e80' });
  click({ rcParty: 'p1', rcFor: 'e80' });
  click({ rcSaveAdv: 'e80' });
  const doc = store.accountTxns[0];
  assert.equal(doc.txnDate, '2026-11-25');
  assert.equal(doc.description.startsWith('L:e80;'), true);
  assert.equal(doc.description.includes('2026-03-04'), true);
  assert.equal(doc.description.includes('e80'), true);
});

test('U33 L5 labels', () => {
  reset();
  const model = UI.modelFor(g.me());
  model.screen.tab = 'overview';
  const page = UI.accountHtml(model, 'p1');
  assert.match(page, /<span>مجموع العمل المعتمد<\/span>/);
  assert.match(page, /<span>مجموع المدفوع للعمل<\/span>/);
  assert.equal(/<span>عمل معتمد<\/span>/.test(page), false);
  assert.equal(/<span>مدفوع للعمل<\/span>/.test(page), false);
});

test('U35 bothFacts', () => {
  reset();
  store.entries = [labour('e30'), labour('e80'), lrev('e80')];
  store.laborReviews = [review('e80', { createdAtServer: 8 })];
  boot();
  assert.equal(state('e80').kind, 'bothFacts');
  const page = html();
  const order = [...page.matchAll(/data-rc-row="(.*?)"/g)].map(match => match[1]);
  assert.equal(order[0], 'e80');
  assert.match(page, /انخصم/);
  assert.match(page, /ملغى/);
  assert.match(page, /<code>rev_e80<\/code>/);
  assert.equal(page.includes('data-rc-advance'), false);
  assert.equal(page.includes('>' + 'سلفة' + '<'), false);
  store.accountTxns = [advance('a')];
  assert.equal(state('e80').kind, 'bothFacts');
  assert.deepEqual(state('e80').advanceIds, ['a']);
  click({ rcAdvance: 'e80' });
  assert.equal(store.accountTxns.length, 1);
});

test('U36 foreign buttons', () => {
  reset();
  boot();
  const before = JSON.stringify(store);
  const foreign = click({ acctab: 'overview' });
  assert.equal(foreign.handled, false);
  assert.equal(JSON.stringify(store), before);
  const own = click({ rcReview: 'e30' });
  assert.equal(own.handled, true);
});

test('U37 first match and legacy shape', () => {
  reset();
  store.entries.push(lrev('e80'));
  store.laborReviews = [review('e80')];
  store.syncErrors = { lrv_e80: 'رُفض الإرسال' };
  boot();
  assert.equal(state('e80').kind, 'owed');
  assert.match(html(), /رُفض الإرسال/);
  const bare = labour('bare');
  delete bare.isReversal;
  const nulled = labour('nulled', { foremanId: null });
  store.entries.push(bare, nulled);
  store.syncErrors = {};
  const ids = Reclass.misbookedCandidates(store.entries, {}).map(row => row.id);
  assert.equal(ids.includes('bare'), true);
  assert.equal(ids.includes('nulled'), true);
  assert.equal(Reclass.rowState(bare, ctx()).kind, 'open');
  assert.equal(Reclass.rowState(bare, ctx()).canCancel, false);
  assert.equal(Reclass.rowState(nulled, ctx()).canCancel, false);
  const page = html();
  assert.match(page, /data-rc-review="bare"/);
  assert.match(page, /data-rc-review="nulled"/);
  assert.equal(page.includes('data-rc-cancel="bare"'), false);
  assert.equal(page.includes('data-rc-closed="bare"'), false);
});

test('K1 M32: a stale cancel form does not write after a queued «انخصم» on the same row', () => {
  reset();
  boot();
  click({ rcCancel: 'e80' });
  nodes['rc-reason'] = { value: 'سبب' };
  store.laborReviews = [review('e80')];
  const count = store.entries.length;
  click({ rcSaveRev: 'e80' });
  assert.equal(store.entries.length, count);
});

test('K2 M32: a forced save on a legacy row (canCancel false) writes nothing', () => {
  reset();
  const legacy = labour('e80');
  delete legacy.isReversal;
  store.entries = [legacy, labour('e30')];
  boot();
  nodes['rc-reason'] = { value: 'سبب' };
  const count = store.entries.length;
  click({ rcSaveRev: 'e80' });
  assert.equal(store.entries.length, count);
});

test('K3 M32: a forced save on an archived-project row writes nothing', () => {
  reset();
  store.entries = [labour('e80', { projectId: OLD }), labour('e30')];
  boot();
  nodes['rc-reason'] = { value: 'سبب' };
  const count = store.entries.length;
  click({ rcSaveRev: 'e80' });
  assert.equal(store.entries.length, count);
});

test('K4 A10: a stale «سلفة» form writes nothing after another phone\'s advance arrives', () => {
  reset();
  store.entries = [labour('e80'), labour('e30'), lrev('e80')];
  boot();
  click({ rcAdvance: 'e80' });
  click({ rcParty: 'p1', rcFor: 'e80' });
  store.accountTxns = [advance('aaaaaaaa-bbbb-cccc-dddd-00000000ffff', { createdAtServer: 5 })];
  click({ rcSaveAdv: 'e80' });
  assert.equal(store.accountTxns.length, 1);
});

test('K5 A5: a live review plus an ordinary «عكس» is kind other (table order 7 before 8)', () => {
  reset();
  store.entries = [labour('e80'), labour('e30'), lrev('e80', { description: 'تصحيح: أجر' })];
  store.laborReviews = [review('e80', { createdAtServer: 8 })];
  boot();
  assert.equal(state('e80').kind, 'other');
});
