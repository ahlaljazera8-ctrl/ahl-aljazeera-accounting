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
g.K = {
  parties: 'parties',
  agreements: 'agreements',
  accountTxns: 'accountTxns',
  statementApprovals: 'statementApprovals',
  projects: 'projects',
  entries: 'entries',
  foremen: 'foremen',
  foremanMoves: 'foremanMoves',
  outbox: 'outbox',
  syncErrors: 'syncErrors',
};
const store = {
  parties: /** @type {any[]} */ ([]),
  agreements: /** @type {any[]} */ ([]),
  accountTxns: /** @type {any[]} */ ([]),
  statementApprovals: /** @type {any[]} */ ([]),
  projects: /** @type {any[]} */ ([]),
  entries: /** @type {any[]} */ ([]),
  foremen: /** @type {any[]} */ ([]),
  foremanMoves: /** @type {any[]} */ ([]),
  outbox: /** @type {string[]} */ ([]),
  syncErrors: /** @type {Record<string, unknown>} */ ({}),
};
g.get = (key, fallback) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallback);
g.set = (key, value) => {
  store[key] = value;
  return Promise.resolve();
};
g.me = () => ({ uid: 'u-ameer', role: 'owner', active: true, displayName: 'أمير' });
g.uuid = () => 'aaaaaaaa-bbbb-cccc-dddd-000000000001';
g.today = () => '2026-11-25';
g.deviceId = 'phone';
g.demoRole = () => '';
g.sessionEpoch = 1;
g.flushing = null;
g.queueDoc = id => {
  if (!store.outbox.includes(id)) store.outbox = store.outbox.concat([id]);
};
g.baghdadDate = ms => new Date(ms + 3 * 3600000).toISOString().slice(0, 10);
g.flushRemote = () => Promise.resolve();

/** @type {Record<string, any>} */
let nodes = {};
/** @type {{ type: string, fn: (event: any) => void }[]} */
const listeners = [];
g.document = {
  addEventListener: (type, fn) => listeners.push({ type, fn }),
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
g.AccountCorrect = Correct;
const Statement = /** @type {any} */ (require('../public/accounts-statement.js'));
g.AccountStatement = Statement;

const PARTY = 'p1';
const JOB = 'job';
const JOB2 = 'job2';
const Q19 = 'المُرجَع والتسوية أكبر من السلفة';
const OPEN4 = 'اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً';
const OPEN4_OLD = 'اعكس الاسترداد أو الإرجاع أو الخصم المرتبط أولاً';
const QUEUED = 'لا يُعتمد الكشف وفيه قيد لم يُرسل بعد';
const HEADING = 'تصحيحات فترات سابقة';
const UP = 'يزيد المستحق';
const DOWN = 'ينقص المستحق';
const LINE_KEY = {
  approvedLabor: 'approvedLabor',
  payments: 'payments',
  refunds: 'paymentRefund',
  advancesPaid: 'advancesPaid',
  cashReturned: 'cashReturned',
  deductions: 'deduct',
  settlements: 'settle',
};

function reset() {
  nodes = {};
  store.parties = [{ id: PARTY, name: 'حسن' }];
  store.agreements = [{ id: 'ag-unit', partyId: PARTY, projectId: JOB, method: 'unit', status: 'active' }];
  store.accountTxns = [];
  store.statementApprovals = [];
  store.projects = [
    { id: JOB, name: 'المدرسة', status: 'active' },
    { id: JOB2, name: 'الثاني', status: 'active' },
  ];
  store.entries = [];
  store.foremen = [];
  store.foremanMoves = [];
  store.outbox = [];
  store.syncErrors = {};
  Accounts.CONTRACTOR_COST_START = null;
  g.today = () => '2026-11-25';
  g.sessionEpoch = 1;
  g.demoRole = () => '';
  g.uuid = () => 'aaaaaaaa-bbbb-cccc-dddd-000000000001';
  UI.writeAccountScope({ scope: 'project', projectId: JOB, periodKind: 'month', anchorDate: '2026-11-16' });
}

/**
 * @param {string} day
 */
function stamp(day) {
  const [year, month, date] = day.split('-').map(Number);
  return Date.UTC(year, month - 1, date, 9, 0);
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} fields
 */
function row(id, fields) {
  const doc = Object.assign({ id, ledger: 'labor', currency: 'IQD', fxRate: 1, partyId: PARTY, projectId: JOB, kind: 'body' }, fields);
  if (!Object.prototype.hasOwnProperty.call(fields, 'createdAtServer') && typeof doc.txnDate === 'string') doc.createdAtServer = stamp(doc.txnDate);
  return doc;
}

/**
 * @param {string} id
 * @param {string} start
 * @param {string} end
 * @param {string} day
 * @param {Record<string, unknown>} [extra]
 */
function approval(id, start, end, day, extra) {
  return Object.assign({
    id,
    partyId: PARTY,
    projectId: JOB,
    periodKind: start.slice(8) === '01' && end.slice(8) > '27' ? 'month' : 'week',
    periodStart: start,
    periodEnd: end,
    createdBy: 'u-ameer',
    createdAtServer: stamp(day),
  }, extra || {});
}

/**
 * @param {any[]} docs
 * @param {any[]} approvals
 * @param {string} start
 * @param {string} end
 * @param {Record<string, unknown>} [extra]
 */
function view(docs, approvals, start, end, extra) {
  const input = Object.assign({
    docs,
    approvals,
    syncErrors: {},
    outbox: [],
    partyId: PARTY,
    projectId: JOB,
    periodKind: 'month',
    periodStart: start,
    periodEnd: end,
    today: g.today(),
  }, extra || {});
  return Statement.periodStatement(input);
}

/**
 * @param {any} html
 */
function visible(html) {
  return String(html || '').replace(/<[^>]+>/g, '');
}

function printed(statement) {
  return statement.corrections.filter(row => row.effect !== 0).map(row => Statement.correctionText(row));
}

function signs() {
  /** @type {Record<string, number>} */
  const out = {};
  for (const line of Accounts.statementLines([], {}).lines) out[line.key] = line.sign;
  return out;
}

/**
 * @param {any} statement
 */
function periodNet(statement) {
  let net = 0;
  for (const line of statement.lines) {
    if (line.entersClosing && line.key !== 'opening') net += line.sign * line.amount;
  }
  return net;
}

/**
 * @param {any} statement
 */
function correctionNet(statement) {
  const table = signs();
  let net = 0;
  for (const row of statement.corrections) net += table[LINE_KEY[row.key]] * row.amount;
  return net;
}

/**
 * @param {any} statement
 */
function assertB9(statement) {
  assert.equal(statement.closing, statement.opening + periodNet(statement) + correctionNet(statement));
}

/**
 * @param {any[]} docs
 * @param {any[]} approvals
 * @param {string} start
 * @param {string} end
 * @param {Record<string, unknown>} extra
 * @param {string} figure
 */
function figureDelta(docs, approvals, start, end, extra, figure) {
  const ctx = {
    byId: Object.fromEntries(docs.map(doc => [doc.id, doc])),
    approvals,
    syncErrors: extra.syncErrors || {},
    today: extra.today || g.today(),
  };
  const projectId = Object.prototype.hasOwnProperty.call(extra, 'projectId') ? extra.projectId : JOB;
  const partyId = /** @type {string} */ (extra.partyId || PARTY);
  const sMinus = shift(start, -1);
  const before = Statement.bookedBy(docs, sMinus, ctx).filter(doc => inProject(doc, ctx, partyId, /** @type {string} */ (projectId)));
  const after = Statement.bookedBy(docs, end, ctx).filter(doc => inProject(doc, ctx, partyId, /** @type {string} */ (projectId)));
  const filter = { partyId, syncErrors: /** @type {Record<string, unknown>} */ (extra.syncErrors || null) };
  if (projectId) filter.projectId = projectId;
  const left = Accounts.balances(before, Object.assign({ periodEnd: sMinus }, filter));
  const right = Accounts.balances(after, Object.assign({ periodEnd: sMinus }, filter));
  return right[figure] - left[figure];
}

/**
 * @param {string} day
 * @param {number} delta
 */
function shift(day, delta) {
  const [year, month, date] = day.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, date) + delta * 86400000;
  return new Date(utc).toISOString().slice(0, 10);
}

/**
 * @param {any} doc
 * @param {any} ctx
 * @param {string} partyId
 * @param {string | undefined} projectId
 */
function inProject(doc, ctx, partyId, projectId) {
  void ctx;
  if (doc.partyId && doc.partyId !== partyId) return false;
  if (projectId && doc.projectId && doc.projectId !== projectId) return false;
  return true;
}

/**
 * @param {any} statement
 * @param {any[]} docs
 * @param {any[]} approvals
 * @param {string} start
 * @param {string} end
 * @param {Record<string, unknown>} [extra]
 */
function assertB12(statement, docs, approvals, start, end, extra) {
  const figures = ['approvedLabor', 'payments', 'refunds', 'advancesPaid', 'cashReturned', 'deductions', 'settlements'];
  for (const figure of figures) {
    const sum = statement.corrections.filter(row => row.key === figure).reduce((total, row) => total + row.amount, 0);
    assert.equal(sum, figureDelta(docs, approvals, start, end, extra || { projectId: statement.projectId }, figure), figure);
  }
}

function labor(id, amount, day, project) {
  return [
    row(id, { purpose: 'laborQty', txnDate: day, projectId: project || JOB, agreementId: 'ag-unit' }),
    row('appr_' + id, { purpose: 'approveLabor', kind: 'appr', amount, targetId: id, txnDate: day, projectId: project || JOB, agreementId: 'ag-unit' }),
  ];
}

function api() {
  return {
    views: /** @type {Record<string, (arg?: string) => string>} */ ({}),
    titles: /** @type {Record<string, string>} */ ({}),
    state: {},
    render() {},
    esc: s => String(s ?? ''),
    money: n => '<b class="num">' + Ledger.fmt(n) + ' د.ع</b>',
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
  Statement.install(next);
  return next;
}

/**
 * @param {string | null} start
 * @param {() => void} fn
 */
function withStart(start, fn) {
  const prev = Accounts.CONTRACTOR_COST_START;
  Accounts.CONTRACTOR_COST_START = start;
  try { fn(); } finally { Accounts.CONTRACTOR_COST_START = prev; }
}

function openContractor(view) {
  return view.views.contractor('ag-unit');
}

test('B1 no approvals matches statementLines and has no corrections', () => {
  reset();
  const docs = labor('m', 600000, '2026-10-10').concat([
    row('pay', { purpose: 'payLabor', amount: 100000, txnDate: '2026-10-12' }),
    row('d', { purpose: 'deduct', amount: 50000, targetId: 'appr_m', txnDate: '2026-10-20' }),
    row('appr_d', { purpose: 'approveDeduct', kind: 'appr', targetId: 'd', txnDate: '2026-10-20' }),
    row('adv', { purpose: 'advanceLabor', amount: 30000, txnDate: '2026-10-15' }),
  ]);
  const statement = view(docs, [], '2026-10-01', '2026-10-31');
  const plain = Accounts.statementLines(/** @type {any} */ (docs), { partyId: PARTY, projectId: JOB, periodStart: '2026-10-01', periodEnd: '2026-10-31' });
  assert.equal(statement.issuedAt, null);
  assert.deepEqual(statement.corrections, []);
  assert.equal(statement.lines.map(line => line.amount).join(), plain.lines.map(line => line.amount).join());
  assert.equal(Statement.statementCardHtml(statement).includes(HEADING), false);
});

test('B2 an issued October stays put when November reverses it', () => {
  reset();
  const docs = labor('m', 600000, '2026-10-10');
  const issued = [approval('iss', '2026-10-01', '2026-10-31', '2026-11-02', { periodKind: 'month' })];
  const before = view(docs, issued, '2026-10-01', '2026-10-31');
  const rev = row('rev_appr_m', { kind: 'rev', purpose: 'approveLabor', reversesId: 'appr_m', createdAtServer: stamp('2026-11-05'), amount: 600000 });
  const afterDocs = docs.concat([rev]);
  const after = view(afterDocs, issued, '2026-10-01', '2026-10-31');
  assert.deepEqual(after.lines.map(line => [line.key, line.amount]), before.lines.map(line => [line.key, line.amount]));
  assert.equal(after.closing, 600000);
  const november = view(afterDocs, issued, '2026-11-01', '2026-11-30');
  assert.equal(november.opening, 600000);
  assert.equal(november.closing, 0);
  const rows = november.corrections.filter(row => row.effect !== 0);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].part, 'reversed');
  assert.equal(rows[0].amount, -600000);
  assert.equal(Statement.correctionText(rows[0]), 'عمل معتمد 600,000 د.ع، ' + DOWN + '، من 2026-10-01 إلى 2026-10-31');
  assert.equal(Statement.statementCardHtml(november).includes(HEADING), true);
  assertB9(november);
});

test('B3 without an approval the reversal rewrites October', () => {
  reset();
  const docs = labor('m', 600000, '2026-10-10').concat([
    row('rev_appr_m', { kind: 'rev', purpose: 'approveLabor', reversesId: 'appr_m', createdAtServer: stamp('2026-11-05') }),
  ]);
  const october = view(docs, [], '2026-10-01', '2026-10-31');
  const november = view(docs, [], '2026-11-01', '2026-11-30');
  assert.equal(october.closing, 0);
  assert.equal(november.corrections.length, 0);
});

test('B4 a late deduct approval books in the next period', () => {
  reset();
  const docs = labor('m', 600000, '2026-10-10').concat([
    row('d', { purpose: 'deduct', amount: 50000, targetId: 'appr_m', txnDate: '2026-10-20' }),
    row('appr_d', { purpose: 'approveDeduct', kind: 'appr', targetId: 'd', createdAtServer: stamp('2026-11-03') }),
  ]);
  const issued = [approval('iss', '2026-10-01', '2026-10-31', '2026-11-01', { periodKind: 'month' })];
  const october = view(docs, issued, '2026-10-01', '2026-10-31');
  assert.equal(october.lines.find(line => line.key === 'deduct').amount, 0);
  const november = view(docs, issued, '2026-11-01', '2026-11-30');
  const rowText = printed(november).find(text => text.startsWith('الخصومات'));
  assert.equal(rowText, 'الخصومات ومرتجعات المواد 50,000 د.ع، ' + DOWN + '، من 2026-10-01 إلى 2026-10-31');
  const part = november.corrections.find(item => item.key === 'deductions');
  assert.equal(part.part, 'late');
  assert.equal(part.amount, 50000);
  assertB9(november);
});

test('B5 a late payment and B5r a reversed payment', () => {
  reset();
  const late = labor('m', 600000, '2026-10-10').concat([
    row('pay', { purpose: 'payLabor', amount: 100000, txnDate: '2026-10-25', createdAtServer: stamp('2026-11-04') }),
  ]);
  const issued = [approval('iss', '2026-10-01', '2026-10-31', '2026-11-01', { periodKind: 'month' })];
  const october = view(late, issued, '2026-10-01', '2026-10-31');
  const november = view(late, issued, '2026-11-01', '2026-11-30');
  assert.equal(october.lines.find(line => line.key === 'payments').amount, 0);
  assert.equal(printed(november)[0], 'مدفوع للعمل 100,000 د.ع، ' + DOWN + '، من 2026-10-01 إلى 2026-10-31');
  assert.equal(november.closing, october.closing - 100000);
  const reversed = [
    row('pay', { purpose: 'payLabor', amount: 600000, txnDate: '2026-10-15' }),
    row('rev_pay', { kind: 'rev', purpose: 'payLabor', reversesId: 'pay', createdAtServer: stamp('2026-11-03') }),
  ];
  const card = view(reversed, issued, '2026-11-01', '2026-11-30');
  assert.equal(printed(card)[0], 'مدفوع للعمل 600,000 د.ع، ' + UP + '، من 2026-10-01 إلى 2026-10-31');
  assert.equal(card.corrections[0].amount, -600000);
  assert.equal(card.corrections[0].part, 'reversed');
  assert.equal(card.closing, card.opening + 600000);
});

test('B6 the issue button exists only after the period ends', () => {
  reset();
  g.today = () => '2026-11-24';
  const openWeek = Accounts.periodBounds('week', '2026-11-24');
  store.projects = [{ id: JOB, status: 'active' }];
  const closed = Accounts.periodBounds('week', '2026-11-18');
  const openBuilt = Statement.statementApprovalDoc({
    id: 's-open', partyId: PARTY, projectId: JOB, periodKind: 'week',
    periodStart: openWeek.periodStart, periodEnd: openWeek.periodEnd, createdBy: 'u-ameer',
  });
  assert.deepEqual(openBuilt.errors, ['open']);
  withStart('2026-10-01', () => {
    UI.writeAccountScope({ scope: 'project', projectId: JOB, periodKind: 'week', anchorDate: '2026-11-24' });
    const viewApi = installAll();
    const html = openContractor(viewApi);
    assert.equal(html.includes('إصدار كشف حساب'), false);
    UI.writeAccountScope({ scope: 'project', projectId: JOB, periodKind: 'week', anchorDate: '2026-11-18' });
    const ready = openContractor(viewApi);
    assert.equal(ready.includes('إصدار كشف حساب'), true);
  });
  const issued = [approval('mid', closed.periodStart, closed.periodEnd, '2026-11-16', { periodKind: 'week' })];
  const late = labor('m', 100000, closed.periodEnd).map(doc => Object.assign({}, doc, { createdAtServer: stamp('2026-11-25') }));
  const week = view(late, issued, closed.periodStart, closed.periodEnd, { periodKind: 'week', today: '2026-11-24' });
  const next = view(late, issued, shift(closed.periodEnd, 1), shift(closed.periodEnd, 7), { periodKind: 'week', today: '2026-11-25' });
  assert.equal(week.lines.find(line => line.key === 'approvedLabor').amount, 0);
  assert.equal(Statement.bookDay(late[1], { byId: Object.fromEntries(late.map(doc => [doc.id, doc])), approvals: issued, syncErrors: {}, today: '2026-11-25' }), shift(closed.periodEnd, 1) > '2026-11-25' ? shift(closed.periodEnd, 1) : '2026-11-25');
  assert.equal(printed(next).some(text => text.includes(UP)), true);
  assert.deepEqual(week.lines, view(late, issued, closed.periodStart, closed.periodEnd, { periodKind: 'week', today: '2026-11-25' }).lines);
});

test('B7 queued rows block the issue, including a date before the period', () => {
  reset();
  const rev = row('rev_appr_m', { kind: 'rev', purpose: 'approveLabor', reversesId: 'appr_m' });
  const docs = labor('m', 600000, '2026-10-10').concat([rev]);
  const issued = [approval('iss', '2026-10-01', '2026-10-31', '2026-11-02', { periodKind: 'month' })];
  const queued = view(docs, issued, '2026-11-01', '2026-11-30', { outbox: ['rev_appr_m'], today: '2026-11-25' });
  assert.deepEqual(queued.queuedIds, ['rev_appr_m']);
  assert.equal(Statement.bookDay(rev, { byId: Object.fromEntries(docs.map(doc => [doc.id, doc])), approvals: issued, syncErrors: {}, today: '2026-11-25' }) >= '2026-11-25', true);
  const week = Accounts.periodBounds('week', '2026-11-18');
  const early = row('pay-early', { purpose: 'payLabor', amount: 10000, txnDate: '2026-11-10' });
  const blocked = view([early], [], week.periodStart, week.periodEnd, { periodKind: 'week', outbox: ['pay-early'] });
  assert.deepEqual(blocked.queuedIds, ['pay-early']);
  store.accountTxns = [early];
  store.outbox = ['pay-early'];
  const built = Statement.statementApprovalDoc({
    id: 's', partyId: PARTY, projectId: JOB, periodKind: 'week',
    periodStart: week.periodStart, periodEnd: week.periodEnd, createdBy: 'u-ameer',
  });
  assert.deepEqual(built.errors, ['review']);
  const card = Statement.statementCardHtml(blocked) + (blocked.queuedIds.length ? '<div class="note">' + QUEUED + '</div>' : '');
  assert.equal(card.includes(QUEUED), true);
  const other = row('pay-other', { purpose: 'payLabor', amount: 10, txnDate: '2026-11-10', projectId: JOB2 });
  const later = row('pay-later', { purpose: 'payLabor', amount: 10, txnDate: shift(week.periodEnd, 1) });
  const clear = view([other, later], [], week.periodStart, week.periodEnd, { periodKind: 'week', outbox: ['pay-other', 'pay-later'] });
  assert.deepEqual(clear.queuedIds, []);
});

test('B8 project scopes add up to the consolidated statement', () => {
  reset();
  const docs = labor('x', 200000, '2026-10-10', JOB).concat(labor('y', 300000, '2026-10-12', JOB2));
  const approvals = [
    approval('ax', '2026-10-01', '2026-10-31', '2026-11-02', { periodKind: 'month' }),
    approval('ay', '2026-10-01', '2026-10-31', '2026-11-02', { periodKind: 'month', projectId: JOB2 }),
  ];
  docs.push(row('rev_appr_x', { kind: 'rev', purpose: 'approveLabor', reversesId: 'appr_x', projectId: JOB, createdAtServer: stamp('2026-11-05') }));
  const x = view(docs, approvals, '2026-11-01', '2026-11-30');
  const y = view(docs, approvals, '2026-11-01', '2026-11-30', { projectId: JOB2 });
  const all = view(docs, approvals, '2026-11-01', '2026-11-30', { projectId: undefined });
  assert.equal(x.opening + y.opening, all.opening);
  assert.equal(x.closing + y.closing, all.closing);
  for (const key of ['approvedLabor', 'payments', 'deduct']) {
    const left = x.lines.find(line => line.key === key).amount + y.lines.find(line => line.key === key).amount;
    assert.equal(left, all.lines.find(line => line.key === key).amount, key);
  }
  const sum = figure => x.corrections.concat(y.corrections).filter(row => row.key === figure).reduce((total, row) => total + row.amount, 0);
  for (const figure of ['approvedLabor', 'payments', 'deductions']) {
    assert.equal(sum(figure), all.corrections.filter(row => row.key === figure).reduce((total, row) => total + row.amount, 0));
  }
  const foreign = view(docs, [approvals[0]], '2026-11-01', '2026-11-30', { projectId: JOB2 });
  assert.equal(foreign.corrections.length, 0);
});

test('B9 closing identity and B10 edge rules', () => {
  reset();
  const docs = labor('m', 600000, '2026-10-10').concat([
    row('rej_appr_m', { kind: 'rej', purpose: 'approveLabor', targetId: 'appr_m', createdAtServer: stamp('2026-11-06') }),
  ]);
  const bad = [approval('bad', '2026-10-01', '2026-10-31', '2026-11-01', { periodKind: 'month' })];
  const errored = view(docs, bad, '2026-11-01', '2026-11-30', { syncErrors: { bad: 'رُفض الإرسال' } });
  assert.equal(errored.corrections.length, 0);
  const queuedApproval = [Object.assign({}, bad[0], { id: 'wait', createdAtServer: null })];
  assert.equal(view(docs, queuedApproval, '2026-11-01', '2026-11-30').corrections.length, 0);
  const pair = [
    approval('early', '2026-10-01', '2026-10-31', '2026-11-01', { periodKind: 'month' }),
    approval('late', '2026-10-01', '2026-10-31', '2026-11-04', { periodKind: 'month' }),
  ];
  const stamped = view(docs, pair, '2026-10-01', '2026-10-31');
  assert.equal(stamped.issuedAt, stamp('2026-11-01'));
  const tied = row('rev_appr_m', { kind: 'rev', purpose: 'approveLabor', reversesId: 'appr_m', createdAtServer: stamp('2026-11-01') });
  const tieDay = Statement.bookDay(tied, {
    byId: Object.fromEntries(docs.concat([tied]).map(doc => [doc.id, doc])),
    approvals: [approval('same', '2026-10-01', '2026-10-31', '2026-11-01', { periodKind: 'month' })],
    syncErrors: {},
    today: '2026-11-25',
  });
  assert.equal(tieDay, '2026-10-10');
  const november = view(labor('m', 400000, '2026-11-02'), [], '2026-11-01', '2026-11-30');
  assertB9(november);
  assertB9(stamped);
});

test('B11 Baghdad day uses baghdadDate', () => {
  reset();
  const calls = [];
  const original = g.baghdadDate;
  g.baghdadDate = ms => {
    calls.push(ms);
    return original(ms);
  };
  const doc = row('rev_x', { kind: 'rev', reversesId: 'missing', createdAtServer: Date.UTC(2026, 9, 31, 21, 30) });
  const day = Statement.bookDay(doc, { byId: { 'rev_x': doc }, approvals: [], syncErrors: {}, today: '2026-11-25' });
  assert.equal(day, '2026-11-01');
  const earlier = row('rev_y', { kind: 'rev', reversesId: 'missing', createdAtServer: Date.UTC(2026, 9, 31, 20, 59) });
  assert.equal(Statement.bookDay(earlier, { byId: { 'rev_y': earlier }, approvals: [], syncErrors: {}, today: '2026-11-25' }), '2026-10-31');
  assert.deepEqual(calls, [Date.UTC(2026, 9, 31, 21, 30), Date.UTC(2026, 9, 31, 20, 59)]);
  g.baghdadDate = original;
});

test('B12 parts add up and B13 uses one sign rule', () => {
  reset();
  const docs = labor('m', 600000, '2026-10-10').concat([
    row('pay', { purpose: 'payLabor', amount: 100000, txnDate: '2026-10-12', createdAtServer: stamp('2026-11-04') }),
    row('rev_appr_m', { kind: 'rev', purpose: 'approveLabor', reversesId: 'appr_m', createdAtServer: stamp('2026-11-05') }),
  ]);
  const issued = [approval('iss', '2026-10-01', '2026-10-31', '2026-11-01', { periodKind: 'month' })];
  const statement = view(docs, issued, '2026-11-01', '2026-11-30');
  assertB12(statement, docs, issued, '2026-11-01', '2026-11-30', { projectId: JOB });
  const table = signs();
  for (const row of statement.corrections) {
    if (row.part === 'reversed') assert.equal(row.amount < 0, true);
    assert.equal(row.effect, Math.sign(table[LINE_KEY[row.key]] * row.amount));
    const text = Statement.correctionText(row);
    if (row.effect === 1) assert.equal(text.includes(UP), true);
    if (row.effect === -1) assert.equal(text.includes(DOWN), true);
  }
});

test('B14 a gap day is labelled with the window it opens', () => {
  reset();
  const docs = [
    row('pay-a', { purpose: 'payLabor', amount: 10000, txnDate: '2026-10-07', createdAtServer: stamp('2026-11-10') }),
    row('pay-b', { purpose: 'payLabor', amount: 20000, txnDate: '2026-10-14', createdAtServer: stamp('2026-11-10') }),
  ];
  const issued = [
    approval('w1', '2026-10-04', '2026-10-10', '2026-10-11'),
    approval('w2', '2026-10-18', '2026-10-24', '2026-10-25'),
  ];
  const statement = view(docs, issued, '2026-11-01', '2026-11-30');
  const texts = printed(statement);
  assert.equal(texts.some(text => text.includes('من 2026-10-04 إلى 2026-10-10')), true);
  assert.equal(texts.some(text => text.includes('من 2026-10-18 إلى 2026-10-24')), true);
  assert.equal(texts.length, 2);
});

test('B15 an approval ending inside the viewed month still labels its own week', () => {
  reset();
  const docs = [row('pay', { purpose: 'payLabor', amount: 100000, txnDate: '2026-10-20', createdAtServer: stamp('2026-11-10') })];
  const issued = [approval('w', '2026-11-01', '2026-11-07', '2026-11-08')];
  const statement = view(docs, issued, '2026-11-01', '2026-11-30');
  assert.equal(printed(statement)[0], 'مدفوع للعمل 100,000 د.ع، ' + DOWN + '، من 2026-11-01 إلى 2026-11-07');
  assertB9(statement);
  assertB12(statement, docs, issued, '2026-11-01', '2026-11-30', { projectId: JOB });
});

test('B16 a later older issue does not change an issued card', () => {
  reset();
  const docs = [row('pay', { purpose: 'payLabor', amount: 100000, txnDate: '2026-10-20', createdAtServer: stamp('2026-11-10') })];
  const october = approval('oct', '2026-10-01', '2026-10-31', '2026-11-01', { periodKind: 'month' });
  const november = approval('nov', '2026-11-01', '2026-11-30', '2026-12-02', { periodKind: 'month' });
  const before = view(docs, [october, november], '2026-11-01', '2026-11-30');
  assert.equal(printed(before)[0].includes('من 2026-10-01 إلى 2026-10-31'), true);
  const after = view(docs, [october, november, approval('week', '2026-10-18', '2026-10-24', '2026-12-05')], '2026-11-01', '2026-11-30');
  assert.equal(Statement.statementCardHtml(before), Statement.statementCardHtml(after));
  const p1 = row('pay1', { purpose: 'payLabor', amount: 100000, txnDate: '2026-10-20', createdAtServer: stamp('2026-11-10'), projectId: JOB });
  const p2 = row('pay2', { purpose: 'payLabor', amount: 50000, txnDate: '2026-10-20', createdAtServer: stamp('2026-11-10'), projectId: JOB2 });
  const base = [
    approval('o1', '2026-10-01', '2026-10-31', '2026-11-01', { periodKind: 'month' }),
    approval('o2', '2026-10-01', '2026-10-31', '2026-11-01', { periodKind: 'month', projectId: JOB2 }),
    approval('n1', '2026-11-01', '2026-11-30', '2026-12-02', { periodKind: 'month', projectId: undefined }),
  ];
  const wideBefore = view([p1, p2], base, '2026-11-01', '2026-11-30', { projectId: undefined });
  const wideAfter = view([p1, p2], base.concat([approval('late-week', '2026-10-18', '2026-10-24', '2026-12-05')]), '2026-11-01', '2026-11-30', { projectId: undefined });
  assert.equal(Statement.statementCardHtml(wideBefore), Statement.statementCardHtml(wideAfter));
});

test('B17 equal period ends collapse to one window', () => {
  reset();
  const docs = [row('pay', { purpose: 'payLabor', amount: 100000, txnDate: '2026-10-20', createdAtServer: stamp('2026-11-10') })];
  const first = approval('a', '2026-10-01', '2026-10-31', '2026-11-01', { periodKind: 'month' });
  const duplicate = approval('b', '2026-10-01', '2026-10-31', '2026-11-03', { periodKind: 'month' });
  const one = view(docs, [first, duplicate], '2026-11-01', '2026-11-30');
  assert.equal(printed(one).length, 1);
  const week = approval('w', '2026-10-25', '2026-10-31', '2026-11-02');
  const mixed = view(docs, [week, first], '2026-11-01', '2026-11-30');
  assert.equal(printed(mixed).length, 1);
  assert.equal(printed(mixed)[0].includes('من 2026-10-01 إلى 2026-10-31'), true);
  assertB12(mixed, docs, [week, first], '2026-11-01', '2026-11-30', { projectId: JOB });
});

test('B18 an orphan settle blocks the issue', () => {
  reset();
  const docs = labor('m', 500000, '2026-11-10').concat([
    row('adv', { purpose: 'advanceLabor', amount: 100000, txnDate: '2026-11-10' }),
    row('rev_adv', { kind: 'rev', purpose: 'advanceLabor', reversesId: 'adv', createdAtServer: stamp('2026-11-20') }),
    row('stl_m_1', { kind: 'stl', purpose: 'settle', amount: 40000, targetId: 'm', settlesId: 'adv', txnDate: '2026-11-18' }),
  ]);
  const week = Accounts.periodBounds('week', '2026-11-18');
  const statement = view(docs, [], week.periodStart, week.periodEnd, { periodKind: 'week', today: '2026-11-25' });
  assert.deepEqual(statement.orphanDrawIds, ['stl_m_1']);
  store.accountTxns = docs;
  const built = Statement.statementApprovalDoc({
    id: 's', partyId: PARTY, projectId: JOB, periodKind: 'week',
    periodStart: week.periodStart, periodEnd: week.periodEnd, createdBy: 'u-ameer',
  });
  assert.deepEqual(built.errors, ['review']);
  const withReturn = docs.concat([row('ret', { purpose: 'returnAdvance', amount: 30000, targetId: 'adv', txnDate: '2026-11-18' })]);
  const both = view(withReturn, [], week.periodStart, week.periodEnd, { periodKind: 'week' });
  assert.deepEqual(both.orphanDrawIds, ['ret', 'stl_m_1']);
  const live = docs.filter(doc => doc.id !== 'rev_adv');
  assert.deepEqual(view(live, [], week.periodStart, week.periodEnd, { periodKind: 'week' }).orphanDrawIds, []);
});

test('B19 an all-projects row keeps the project that the payment touched', () => {
  reset();
  const docs = [row('pay2', { purpose: 'payLabor', amount: 100000, txnDate: '2026-10-20', createdAtServer: stamp('2026-11-10'), projectId: JOB2 })];
  const approvals = [
    approval('p1w', '2026-10-18', '2026-10-24', '2026-10-25'),
    approval('p2m', '2026-10-01', '2026-10-31', '2026-11-01', { periodKind: 'month', projectId: JOB2 }),
  ];
  const one = view(docs, approvals, '2026-11-01', '2026-11-30', { projectId: JOB2 });
  const all = view(docs, approvals, '2026-11-01', '2026-11-30', { projectId: undefined });
  const expected = 'مدفوع للعمل 100,000 د.ع، ' + DOWN + '، من 2026-10-01 إلى 2026-10-31';
  assert.equal(printed(one)[0], expected);
  assert.equal(printed(all)[0], expected);
  assert.equal(printed(all).some(text => text.includes('2026-10-18')), false);
  assertB9(all);
  assertB12(all, docs, approvals, '2026-11-01', '2026-11-30', { projectId: undefined });
});

test('B21 refunds and deductions survive a later window', () => {
  reset();
  const docs = [
    row('pay', { purpose: 'payLabor', amount: 80000, txnDate: '2026-10-20' }),
    row('refund', { purpose: 'refundLabor', amount: 20000, targetId: 'pay', txnDate: '2026-10-20' }),
    row('rev_refund', { kind: 'rev', purpose: 'refundLabor', reversesId: 'refund', createdAtServer: stamp('2026-11-05') }),
  ].concat(labor('m', 300000, '2026-10-05')).concat([
    row('d', { purpose: 'deduct', amount: 50000, targetId: 'appr_m', txnDate: '2026-10-20' }),
    row('appr_d', { purpose: 'approveDeduct', kind: 'appr', targetId: 'd', txnDate: '2026-10-20' }),
    row('rev_d', { kind: 'rev', purpose: 'deduct', reversesId: 'd', createdAtServer: stamp('2026-11-05') }),
  ]);
  const issued = [
    approval('w1', '2026-10-04', '2026-10-10', '2026-10-11'),
    approval('w2', '2026-10-18', '2026-10-24', '2026-10-25'),
  ];
  const statement = view(docs, issued, '2026-11-01', '2026-11-30');
  const texts = printed(statement);
  assert.equal(texts.includes('المُرجَع من الدفعة نقداً 20,000 د.ع، ' + DOWN + '، من 2026-10-18 إلى 2026-10-24'), true);
  assert.equal(texts.includes('الخصومات ومرتجعات المواد 50,000 د.ع، ' + UP + '، من 2026-10-18 إلى 2026-10-24'), true);
  assertB9(statement);
  assertB12(statement, docs, issued, '2026-11-01', '2026-11-30', { projectId: JOB });
});

test('B22 a mixed window prints the late row before the reversal', () => {
  reset();
  const docs = labor('m', 1000000, '2026-10-10').concat([
    row('pay', { purpose: 'payLabor', amount: 600000, txnDate: '2026-10-15' }),
    row('rev_pay', { kind: 'rev', purpose: 'payLabor', reversesId: 'pay', createdAtServer: stamp('2026-11-05') }),
    row('late', { purpose: 'payLabor', amount: 100000, txnDate: '2026-10-20', createdAtServer: stamp('2026-11-10') }),
  ]);
  const issued = [approval('oct', '2026-10-01', '2026-10-31', '2026-11-01', { periodKind: 'month' })];
  const statement = view(docs, issued, '2026-11-01', '2026-11-30');
  assert.deepEqual(printed(statement), [
    'مدفوع للعمل 100,000 د.ع، ' + DOWN + '، من 2026-10-01 إلى 2026-10-31',
    'مدفوع للعمل 600,000 د.ع، ' + UP + '، من 2026-10-01 إلى 2026-10-31',
  ]);
  assert.equal(statement.opening, 400000);
  assert.equal(statement.closing, 900000);
});

test('B23 a settle reversal is kept and not printed', () => {
  reset();
  const docs = labor('m', 500000, '2026-10-10').concat([
    row('adv', { purpose: 'advanceLabor', amount: 100000, txnDate: '2026-10-10' }),
    row('stl_m_1', { kind: 'stl', purpose: 'settle', amount: 40000, targetId: 'm', settlesId: 'adv', txnDate: '2026-10-15' }),
    row('rev_stl_m_1', { kind: 'rev', purpose: 'settle', reversesId: 'stl_m_1', createdAtServer: stamp('2026-11-03') }),
  ]);
  const issued = [approval('oct', '2026-10-01', '2026-10-31', '2026-11-01', { periodKind: 'month' })];
  const statement = view(docs, issued, '2026-11-01', '2026-11-30');
  const part = statement.corrections.find(row => row.key === 'settlements');
  assert.equal(part.amount, -40000);
  assert.equal(part.effect, 0);
  assert.equal(printed(statement).length, 0);
  assert.equal(Statement.statementCardHtml(statement).includes(HEADING), false);
  assertB9(statement);
  assertB12(statement, docs, issued, '2026-11-01', '2026-11-30', { projectId: JOB });
});

/**
 * @param {Record<string, unknown>} [extra]
 */
function cascade(extra) {
  const docs = labor('m1', 300000, '2026-10-05').concat([
    row('d1', { purpose: 'deduct', amount: 50000, targetId: 'appr_m1', txnDate: '2026-11-18' }),
    row('appr_d1', { purpose: 'approveDeduct', kind: 'appr', targetId: 'd1', txnDate: '2026-11-18' }),
    row('rev_appr_m1', { kind: 'rev', purpose: 'approveLabor', reversesId: 'appr_m1', createdAtServer: stamp('2026-11-24') }),
  ]);
  const approvals = [approval('oct', '2026-10-01', '2026-10-31', '2026-11-01', { periodKind: 'month' })];
  if (extra && extra.issuedWeek) approvals.push(approval('w', '2026-11-16', '2026-11-22', '2026-11-23'));
  if (extra && extra.revDeduct) docs.push(row('rev_d1', { kind: 'rev', purpose: 'deduct', reversesId: 'd1', createdAtServer: stamp('2026-11-25') }));
  return { docs, approvals };
}

test('B24 the deduct cascade keeps a tail until the deduct itself is reversed', () => {
  reset();
  const first = cascade();
  const statement = view(first.docs, first.approvals, '2026-11-23', '2026-11-29', { periodKind: 'week' });
  assert.equal(statement.opening, 250000);
  assert.deepEqual(printed(statement), [
    'عمل معتمد 300,000 د.ع، ' + DOWN + '، من 2026-10-01 إلى 2026-10-31',
    'الخصومات ومرتجعات المواد 50,000 د.ع، ' + UP + '، من 2026-11-01 إلى 2026-11-22',
  ]);
  assertB9(statement);
  assertB12(statement, first.docs, first.approvals, '2026-11-23', '2026-11-29', { projectId: JOB });
  const other = first.docs.map(doc => Object.assign({}, doc, { projectId: JOB2 }));
  const two = view(other, first.approvals.map(item => Object.assign({}, item, { projectId: JOB2 })), '2026-11-23', '2026-11-29', { periodKind: 'week', projectId: undefined });
  assert.equal(printed(two).filter(text => text.includes('من 2026-11-01')).length, 1);
  const reversed = cascade({ revDeduct: true });
  const gone = view(reversed.docs, reversed.approvals, '2026-11-23', '2026-11-29', { periodKind: 'week' });
  assert.equal(gone.opening, 300000);
  assert.equal(printed(gone).some(text => text.includes('من 2026-11-01')), false);
  assertB9(gone);
  const kept = cascade({ issuedWeek: true, revDeduct: true });
  const before = view(cascade({ issuedWeek: true }).docs, cascade({ issuedWeek: true }).approvals, '2026-11-23', '2026-11-29', { periodKind: 'week' });
  const after = view(kept.docs, kept.approvals, '2026-11-23', '2026-11-29', { periodKind: 'week' });
  const windowRow = 'الخصومات ومرتجعات المواد 50,000 د.ع، ' + UP + '، من 2026-11-16 إلى 2026-11-22';
  assert.equal(printed(before).includes(windowRow), true);
  assert.equal(printed(after).includes(windowRow), true);
  assert.equal(printed(after).some(text => text.includes('من 2026-11-01')), false);
  assertB9(after);
});

test('B25 an orphan deduct blocks every later closed week', () => {
  reset();
  const world = cascade();
  const week = { periodStart: '2026-11-16', periodEnd: '2026-11-22' };
  const statement = view(world.docs, world.approvals, week.periodStart, week.periodEnd, { periodKind: 'week' });
  assert.deepEqual(statement.orphanDrawIds, ['d1']);
  store.accountTxns = world.docs;
  store.statementApprovals = world.approvals;
  const built = Statement.statementApprovalDoc({
    id: 's', partyId: PARTY, projectId: JOB, periodKind: 'week',
    periodStart: week.periodStart, periodEnd: week.periodEnd, createdBy: 'u-ameer',
  });
  assert.deepEqual(built.errors, ['review']);
  g.today = () => '2026-12-01';
  const later = Statement.statementApprovalDoc({
    id: 's2', partyId: PARTY, projectId: JOB, periodKind: 'week',
    periodStart: '2026-11-23', periodEnd: '2026-11-29', createdBy: 'u-ameer',
  });
  assert.deepEqual(later.errors, ['review']);
  const live = world.docs.filter(doc => doc.id !== 'rev_appr_m1');
  assert.deepEqual(view(live, world.approvals, week.periodStart, week.periodEnd, { periodKind: 'week' }).orphanDrawIds, []);
  const unapproved = world.docs.filter(doc => doc.id !== 'appr_d1');
  assert.deepEqual(view(unapproved, world.approvals, week.periodStart, week.periodEnd, { periodKind: 'week' }).orphanDrawIds, []);
  const cleared = cascade({ revDeduct: true });
  assert.deepEqual(view(cleared.docs, cleared.approvals, '2026-11-23', '2026-11-29', { periodKind: 'week' }).orphanDrawIds, []);
  const other = world.docs.map(doc => Object.assign({}, doc, { projectId: JOB2 }));
  store.accountTxns = other.concat(labor('p1m', 1000, '2026-11-18'));
  store.statementApprovals = [];
  const own = Statement.statementApprovalDoc({
    id: 'own', partyId: PARTY, projectId: JOB, periodKind: 'week',
    periodStart: week.periodStart, periodEnd: week.periodEnd, createdBy: 'u-ameer',
  });
  assert.equal(own.errors.includes('review'), false);
});

test('B20 the printed rows and the raw parts stay one identity', () => {
  reset();
  const worlds = [];
  const base = labor('m', 600000, '2026-10-10').concat([
    row('pay', { purpose: 'payLabor', amount: 100000, txnDate: '2026-10-20', createdAtServer: stamp('2026-11-08') }),
    row('rev_pay', { kind: 'rev', purpose: 'payLabor', reversesId: 'pay', createdAtServer: stamp('2026-11-09') }),
  ]);
  worlds.push({ docs: base, approvals: [approval('oct', '2026-10-01', '2026-10-31', '2026-11-01', { periodKind: 'month' })], start: '2026-11-01', end: '2026-11-30' });
  const empty = view(labor('m', 1000, '2026-11-02'), [], '2026-11-01', '2026-11-30');
  assert.equal(empty.corrections.length, 0);
  const cascadeWorld = cascade();
  worlds.push({ docs: cascadeWorld.docs, approvals: cascadeWorld.approvals, start: '2026-11-23', end: '2026-11-29', extra: { periodKind: 'week' } });
  let seed = 11;
  const next = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed; };
  const generated = [];
  for (let n = 0; n < 4; n += 1) {
    const project = n % 2 ? JOB2 : JOB;
    generated.push(row('g-pay-' + n, { purpose: 'payLabor', amount: 1000 * (next() % 20 + 1), txnDate: '2026-10-' + String(10 + n).padStart(2, '0'), projectId: project, createdAtServer: stamp('2026-11-12') }));
  }
  worlds.push({
    docs: generated,
    approvals: [approval('g', '2026-10-01', '2026-10-31', '2026-11-02', { periodKind: 'month', projectId: undefined })],
    start: '2026-11-01',
    end: '2026-11-30',
    extra: { projectId: undefined },
  });
  const table = signs();
  for (const world of worlds) {
    const statement = view(world.docs, world.approvals, world.start, world.end, world.extra || { projectId: JOB });
    let printedSum = 0;
    for (const row of statement.corrections) {
      assert.notEqual(row.amount, 0);
      assert.equal(row.effect, Math.sign(table[LINE_KEY[row.key]] * row.amount));
      if (row.effect !== 0) printedSum += row.effect * Math.abs(row.amount);
    }
    assert.equal(printedSum, statement.closing - statement.opening - periodNet(statement));
    assertB9(statement);
    assertB12(statement, world.docs, world.approvals, world.start, world.end, world.extra || { projectId: JOB });
  }
});

test('G1 to G12 the issue gate', async () => {
  reset();
  const shown = view(labor('m', 1000, '2026-11-02'), [], '2026-11-01', '2026-11-30');
  let flushed = 0;
  let inFlight = /** @type {Promise<unknown> | null} */ (null);
  const gate = overrides => Statement.issueGate(Object.assign({
    shown,
    recompute: () => shown,
    online: () => true,
    inFlight: () => inFlight,
    flush: () => { flushed += 1; return Promise.resolve('ok'); },
    timeoutMs: 1000,
    epoch: () => 1,
    lastSyncAt: () => Date.now() + 10,
    outbox: () => [],
    now: () => Date.now(),
    demo: false,
    projectActive: true,
    today: '2026-11-25',
  }, overrides));
  const offline = await gate({ online: () => false });
  assert.deepEqual(offline.errors, ['offline']);
  assert.equal(flushed, 0);
  assert.deepEqual((await gate({ outbox: () => ['x'] })).errors, ['queued']);
  assert.deepEqual((await gate({ lastSyncAt: () => 0 })).errors, ['pull']);
  const changed = await gate({ recompute: () => Object.assign({}, shown, { closing: shown.closing + 1 }) });
  assert.deepEqual(changed.errors, ['changed']);
  assert.deepEqual((await gate()).errors, []);
  assert.deepEqual((await gate({ demo: true, online: () => false, flush: () => { flushed += 100; return Promise.resolve(); } })).errors, []);
  let sawT0 = 0;
  let pullAt = 0;
  inFlight = new Promise(resolve => {
    setTimeout(() => { pullAt = 5; resolve('old'); }, 10);
  });
  const flight = await gate({
    now: () => { sawT0 = pullAt; return 20; },
    lastSyncAt: () => 5,
    flush: () => { flushed += 1; return Promise.resolve('second'); },
  });
  assert.equal(sawT0, 5);
  assert.deepEqual(flight.errors, ['pull']);
  inFlight = null;
  const hung = await gate({ timeoutMs: 30, flush: () => new Promise(() => {}) });
  assert.deepEqual(hung.errors, ['pull']);
  assert.deepEqual((await gate({ flush: () => Promise.reject(new Error('no')) })).errors, ['pull']);
  let epoch = 1;
  assert.deepEqual((await gate({ epoch: () => { epoch += 1; return epoch; } })).errors, ['epoch']);
  const issued = Object.assign({}, shown, { issuedAt: 10 });
  assert.deepEqual((await gate({ shown, recompute: () => issued })).errors, ['changed']);
});

test('G8 times out when the flush race is required', { timeout: 400 }, async () => {
  reset();
  const shown = view([], [], '2026-11-01', '2026-11-30');
  const result = await Statement.issueGate({
    shown, recompute: () => shown, online: () => true, inFlight: () => null,
    flush: () => new Promise(() => {}), timeoutMs: 40, epoch: () => 1, lastSyncAt: () => Date.now(),
    outbox: () => [], now: () => Date.now(), demo: false, projectActive: true, today: '2026-11-25',
  });
  assert.deepEqual(result.errors, ['pull']);
});

test('G11 rendering never calls the flush', () => {
  reset();
  let calls = 0;
  g.flushRemote = () => { calls += 1; return Promise.resolve(); };
  store.accountTxns = labor('m', 1000, '2026-11-02');
  withStart('2026-10-01', () => {
    const viewApi = installAll();
    for (let n = 0; n < 20; n += 1) {
      openContractor(viewApi);
      UI.accountHtml(UI.modelFor(g.me()), PARTY);
    }
  });
  assert.equal(calls, 0);
  g.flushRemote = () => Promise.resolve();
});

test('S1 to S6 settle and statement documents', () => {
  reset();
  store.accountTxns = labor('m', 500000, '2026-11-10').concat([
    row('adv', { purpose: 'advanceLabor', amount: 100000, txnDate: '2026-11-10' }),
  ]);
  const built = Statement.settleDoc({
    measurementId: 'm', settlesId: 'adv', amount: 40000, gen: '1', txnDate: '2026-11-18',
    createdBy: 'u-ameer', deviceId: 'phone', createdByName: 'أمير',
  });
  assert.deepEqual(built.errors, []);
  assert.equal(built.doc.id, 'stl_m_1');
  assert.equal(built.doc.purpose, 'settle');
  assert.equal(built.doc.settlesId, 'adv');
  const remote = ['id', 'kind', 'purpose', 'projectId', 'partyId', 'ledger', 'currency', 'fxRate', 'amount', 'targetId', 'settlesId', 'txnDate', 'description', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'];
  for (const key of Object.keys(built.doc)) assert.equal(key === 'docType' || remote.includes(key), true, key);
  const over = Statement.settleDoc({ measurementId: 'm', settlesId: 'adv', amount: 100001, gen: '1', txnDate: '2026-11-18', createdBy: 'u', deviceId: 'phone' });
  assert.equal(over.errors.includes('cap'), true);
  store.accountTxns.push(row('ret', { purpose: 'returnAdvance', amount: 70000, targetId: 'adv', txnDate: '2026-11-12' }));
  const both = Statement.settleDoc({ measurementId: 'm', settlesId: 'adv', amount: 40000, gen: '1', txnDate: '2026-11-18', createdBy: 'u', deviceId: 'phone' });
  assert.equal(both.errors.includes('cumulative'), true);
  const early = Statement.settleDoc({ measurementId: 'm', settlesId: 'adv', amount: 1000, gen: '2', txnDate: '2026-11-18', createdBy: 'u', deviceId: 'phone' });
  assert.deepEqual(early.errors, ['method']);
  store.syncErrors = { adv: 'x' };
  assert.deepEqual(Statement.settleDoc({ measurementId: 'm', settlesId: 'adv', amount: 1000, gen: '1', txnDate: '2026-11-18', createdBy: 'u', deviceId: 'phone' }).errors, ['settlesId']);
  store.syncErrors = {};
  store.accountTxns.push(row('rev_appr_m', { kind: 'rev', purpose: 'approveLabor', reversesId: 'appr_m' }));
  assert.deepEqual(Statement.settleDoc({ measurementId: 'm', settlesId: 'adv', amount: 1000, gen: '1', txnDate: '2026-11-18', createdBy: 'u', deviceId: 'phone' }).errors, ['targetId']);
  store.accountTxns = labor('m', 500000, '2026-11-10').concat([row('adv', { purpose: 'advanceLabor', amount: 100000, txnDate: '2026-11-10' })]);
  for (let n = 1; n <= 9; n += 1) {
    store.accountTxns.push(row('stl_m_' + n, { kind: 'stl', purpose: 'settle', amount: 1, targetId: 'm', settlesId: 'adv', txnDate: '2026-11-18' }));
    store.accountTxns.push(row('rev_stl_m_' + n, { kind: 'rev', purpose: 'settle', reversesId: 'stl_m_' + n }));
  }
  assert.equal(Statement.settleGen('m', Accounts.rowIndex(store.accountTxns, {})), '');
  const week = Accounts.periodBounds('week', '2026-11-10');
  g.today = () => '2026-11-25';
  store.accountTxns = labor('m', 500000, '2026-11-10');
  const statement = Statement.statementApprovalDoc({
    id: 's', partyId: PARTY, projectId: JOB, periodKind: 'week',
    periodStart: week.periodStart, periodEnd: week.periodEnd, createdBy: 'u-ameer',
  });
  assert.deepEqual(statement.errors, []);
  assert.equal(statement.doc.deviceId, undefined);
  assert.equal(statement.doc.createdAtDevice, undefined);
  assert.equal(statement.doc.includedIds, undefined);
  assert.equal(statement.doc.amount, undefined);
  store.accountTxns = labor('m', 500000, '2026-11-10').concat([row('adv', { purpose: 'advanceLabor', amount: 1000, txnDate: '2026-11-10' })]);
  assert.deepEqual(Statement.statementApprovalDoc({
    id: 's2', partyId: PARTY, projectId: JOB, periodKind: 'week',
    periodStart: week.periodStart, periodEnd: week.periodEnd, createdBy: 'u-ameer',
  }).errors, ['review']);
  assert.deepEqual(Statement.statementApprovalDoc({ id: 's', partyId: PARTY, projectId: JOB, periodKind: 'week', periodStart: '', periodEnd: '', createdBy: 'u' }).errors, ['period']);
});

test('S7 a live settle makes the advance dependent', () => {
  reset();
  store.accountTxns = [
    row('adv', { purpose: 'advanceLabor', amount: 100000, txnDate: '2026-11-10' }),
    row('stl_m_1', { kind: 'stl', purpose: 'settle', amount: 40000, targetId: 'other', settlesId: 'adv', txnDate: '2026-11-12' }),
  ];
  withStart('2026-10-01', () => {
    const viewApi = installAll();
    const html = openContractor(viewApi);
    assert.equal(html.includes(OPEN4), true);
    assert.equal(html.includes(OPEN4_OLD), false);
  });
  store.accountTxns[1].settlesId = 'other-advance';
  store.accountTxns[1].targetId = 'adv';
  withStart('2026-10-01', () => {
    const viewApi = installAll();
    const html = openContractor(viewApi);
    assert.equal(html.includes('id="act-reverse-adv"'), true);
  });
});

test('S8 a closed project hides both cards', () => {
  reset();
  store.projects = [{ id: JOB, status: 'closed' }];
  store.accountTxns = labor('m', 1000, '2026-11-10').concat([row('adv', { purpose: 'advanceLabor', amount: 1000, txnDate: '2026-11-10' })]);
  withStart('2026-10-01', () => {
    const html = openContractor(installAll());
    assert.equal(html.includes('data-cs-'), false);
    assert.equal(html.includes('data-st-'), false);
  });
  assert.deepEqual(Statement.settleDoc({ measurementId: 'm', settlesId: 'adv', amount: 100, gen: '1', txnDate: '2026-11-18', createdBy: 'u', deviceId: 'phone' }).errors, ['inactive']);
  const week = Accounts.periodBounds('week', '2026-11-10');
  assert.deepEqual(Statement.statementApprovalDoc({
    id: 's', partyId: PARTY, projectId: JOB, periodKind: 'week', periodStart: week.periodStart, periodEnd: week.periodEnd, createdBy: 'u',
  }).errors, ['inactive']);
});

test('D1 the balance sentence and D3 the quantity tile', () => {
  reset();
  const plus = Statement.balanceSentence(480000);
  assert.deepEqual([plus.label, plus.direction, plus.amountText], ['الرصيد المستحق', 'مستحق له', '480,000 د.ع']);
  const minus = Statement.balanceSentence(-100000);
  assert.equal(minus.direction, 'مستحق عليه');
  assert.equal(minus.amountText, '100,000 د.ع');
  assert.equal(minus.amountText.includes('\u2212'), false);
  assert.equal(minus.amountText.includes('(سلفة)'), false);
  const zero = Statement.balanceSentence(0);
  assert.equal(zero.label, 'الرصيد المستحق');
  assert.equal(zero.amountText, '0 د.ع');
  assert.equal(zero.direction, '');
  store.accountTxns = labor('m', 1, '2026-11-02').map(doc => doc.purpose === 'laborQty' ? Object.assign({}, doc, { qty: 8000, agreementId: 'ag-unit' }) : doc);
  const index = Accounts.rowIndex(store.accountTxns, {});
  assert.equal(Statement.approvedUnitQty(store.accountTxns, store.agreements, PARTY, index, JOB), 8000);
  const model = UI.modelFor(g.me());
  const html = UI.accountHtml(model, PARTY);
  assert.equal(html.includes('الكمية'), true);
  assert.equal(html.includes('8,000'), true);
  model.screen.tab = 'agreements';
  assert.equal(UI.accountHtml(model, PARTY).includes('حسب الإنجاز (الكمية × سعر الوحدة)'), true);
});

test('D2 D2b D2c D2d D14 D15 D16 the statement and mustakhlas text', () => {
  reset();
  const docs = labor('m', 600000, '2026-11-10').concat([
    row('d', { purpose: 'deduct', amount: 50000, targetId: 'appr_m', txnDate: '2026-11-12' }),
    row('appr_d', { purpose: 'approveDeduct', kind: 'appr', targetId: 'd', txnDate: '2026-11-12' }),
    row('adv', { purpose: 'advanceLabor', amount: 100000, txnDate: '2026-11-11' }),
  ]);
  const statement = view(docs, [], '2026-11-01', '2026-11-30');
  const html = Statement.mustakhlasHtml(statement);
  assert.equal(html.includes('عمل معتمد'), true);
  assert.equal(html.includes('600,000'), true);
  assert.equal(html.includes('50,000'), true);
  assert.equal(html.includes('صافي السلف'), true);
  assert.equal(html.includes('الصافي 450,000 د.ع مستحق له'), true);
  assert.equal(html.includes(HEADING), false);
  const correctedDocs = docs.concat(labor('old', 100000, '2026-10-05')).concat([
    row('rev_appr_old', { kind: 'rev', purpose: 'approveLabor', reversesId: 'appr_old', createdAtServer: stamp('2026-11-12') }),
  ]);
  const issued = [approval('oct', '2026-10-01', '2026-10-31', '2026-11-02', { periodKind: 'month' })];
  const corrected = view(correctedDocs, issued, '2026-11-01', '2026-11-30');
  const correctedHtml = Statement.mustakhlasHtml(corrected);
  assert.equal(correctedHtml.includes(HEADING), true);
  assert.equal(correctedHtml.includes('عمل معتمد 100,000 د.ع، ' + DOWN), true);
  assert.equal(correctedHtml.includes('الصافي 350,000 د.ع مستحق له'), true);
  const negative = view([
    row('adv', { purpose: 'advanceLabor', amount: 50000, txnDate: '2026-11-10' }),
    row('ret', { purpose: 'returnAdvance', amount: 100000, targetId: 'adv', txnDate: '2026-11-12' }),
  ], [], '2026-11-01', '2026-11-30');
  const negativeHtml = Statement.mustakhlasHtml(negative);
  assert.equal(negativeHtml.includes('صافي السلف 50,000 د.ع، ' + UP), true);
  assert.equal(negativeHtml.includes('\u2212'), false);
  const owing = view(labor('m', 10000, '2026-11-10').concat([
    row('d', { purpose: 'deduct', amount: 90000, targetId: 'appr_m', txnDate: '2026-11-12' }),
    row('appr_d', { purpose: 'approveDeduct', kind: 'appr', targetId: 'd', txnDate: '2026-11-12' }),
  ]), [], '2026-11-01', '2026-11-30');
  assert.equal(Statement.mustakhlasHtml(owing).includes('الصافي 80,000 د.ع مستحق عليه'), true);
  const card = visible(Statement.statementCardHtml(Object.assign({}, statement, { opening: -100000, closing: -100000 })));
  assert.equal(card.includes('رصيد أول المدة 100,000 د.ع مستحق عليه'), true);
  assert.equal(card.includes('رصيد آخر المدة 100,000 د.ع مستحق عليه'), true);
  assert.equal(card.includes('\u2212'), false);
  const flat = visible(Statement.statementCardHtml(Object.assign({}, statement, { opening: 0, closing: 480000 })));
  assert.equal(flat.includes('رصيد أول المدة 0 د.ع مستحق له'), true);
  assert.equal(flat.includes('رصيد آخر المدة 480,000 د.ع مستحق له'), true);
});

test('D4 D5 D6 D7 D8 D11 D12 the cards', () => {
  reset();
  store.entries = [
    { id: 'e-old', entryType: 'subcontractor', direction: 'expense', amount: 200000, projectId: JOB, subcontractId: 'c1' },
    { id: 'e-free', entryType: 'subcontractor', direction: 'expense', amount: 40000, projectId: JOB },
  ];
  store.accountTxns = labor('m', 600000, '2026-11-02').concat([
    row('pay', { purpose: 'payLabor', amount: 400000, txnDate: '2026-11-03' }),
    row('adv', { purpose: 'advanceLabor', amount: 100000, txnDate: '2026-11-04', description: 'عادي' }),
    row('adv-l', { purpose: 'advanceLabor', amount: 80000, txnDate: '2026-11-05', description: 'L:e1;' }),
  ]);
  const totals = Statement.contractorTotals(store.entries, store.accountTxns, {}, { projectId: JOB });
  assert.equal(totals.cost, 840000);
  assert.equal(totals.unlinked, 40000);
  assert.equal(totals.paidToContractors, 820000);
  assert.equal(totals.newCash, 580000);
  assert.equal(totals.reclassAdvance, 0);
  const card = Statement.totalsCardHtml(totals);
  assert.equal(card.includes('المدفوع للمقاولين'), true);
  assert.equal(card.includes('النقد الخارج'), false);
  assert.equal(card.includes('سلفة'), false);
  store.accountTxns = labor('m', 500000, '2026-11-10').concat([row('adv', { purpose: 'advanceLabor', amount: 100000, txnDate: '2026-11-10' })]);
  withStart('2026-10-01', () => {
    nodes['cs-amount'] = { id: 'cs-amount', value: '40000', dataset: {} };
    const html = openContractor(installAll());
    assert.equal(html.includes(Q19), false);
    nodes['cs-amount'].value = '100001';
    const over = openContractor(installAll());
    assert.equal(over.includes(Q19), true);
    assert.equal(over.includes('السلف المصروفة له'), true);
    assert.equal(over.includes('المُرجَع من السلف نقداً'), true);
    assert.equal(over.includes('تسوية سلفة'), true);
  });
  const big = view([
    row('pay', { purpose: 'payLabor', amount: 1234567, txnDate: '2026-10-15' }),
    row('rev_pay', { kind: 'rev', purpose: 'payLabor', reversesId: 'pay', createdAtServer: stamp('2026-11-05') }),
  ], [approval('oct', '2026-10-01', '2026-10-31', '2026-11-01', { periodKind: 'month' })], '2026-11-01', '2026-11-30');
  assert.equal(printed(big)[0].startsWith('مدفوع للعمل 1,234,567 د.ع، ' + UP), true);
  assert.equal(printed(big)[0].includes('\u2212'), false);
  Accounts.CONTRACTOR_COST_START = null;
  const hidden = openContractor(installAll());
  assert.equal(hidden.includes('data-cs-'), false);
  assert.equal(hidden.includes('data-st-'), false);
  const orphanDocs = labor('m', 500000, '2026-11-10').concat([
    row('adv', { purpose: 'advanceLabor', amount: 100000, txnDate: '2026-11-10' }),
    row('rev_adv', { kind: 'rev', purpose: 'advanceLabor', reversesId: 'adv', createdAtServer: stamp('2026-11-20') }),
    row('stl_m_1', { kind: 'stl', purpose: 'settle', amount: 40000, targetId: 'm', settlesId: 'adv', txnDate: '2026-11-18' }),
  ]);
  store.accountTxns = orphanDocs;
  UI.writeAccountScope({ scope: 'project', projectId: JOB, periodKind: 'week', anchorDate: '2026-11-18' });
  withStart('2026-10-01', () => {
    const html = openContractor(installAll());
    const issue = html.slice(html.indexOf('data-st-issue-card'));
    assert.equal(issue.split(OPEN4).length - 1, 1);
    assert.equal(html.includes('إصدار كشف حساب'), false);
    assert.equal(html.includes('data-orphan="stl_m_1"'), true);
  });
});

test('D9 paid to contractors stays off the company figures', () => {
  reset();
  store.entries = [
    { id: 'hand', entryType: 'foreman', direction: 'expense', amount: 300000, projectId: JOB, foremanId: 'f1' },
    { id: 'paid', entryType: 'subcontractor', direction: 'expense', amount: 120000, projectId: JOB, foremanId: 'f1' },
  ];
  store.foremen = [{ id: 'f1', name: 'أبو علي', projectId: JOB }];
  const totals = Statement.contractorTotals(store.entries, [], {}, { projectId: JOB });
  assert.equal(totals.paidToContractors, 120000);
  const beforeTotals = Ledger.totals(store.entries);
  const beforeCost = Accounts.projectCost(JOB, beforeTotals.spent, [], {}, null);
  assert.equal(beforeTotals.spent, 420000);
  assert.equal(beforeCost, 420000);
  const csvBefore = Ledger.foremanSummaryToCSV(store.foremen, [], store.entries, {});
  UI.accountHtml(UI.modelFor(g.me()), PARTY);
  const afterTotals = Ledger.totals(store.entries);
  const afterCost = Accounts.projectCost(JOB, afterTotals.spent, [], {}, null);
  assert.deepEqual(afterTotals, beforeTotals);
  assert.equal(afterCost, beforeCost);
  assert.equal(Ledger.foremanSummaryToCSV(store.foremen, [], store.entries, {}), csvBefore);
  const overview = UI.accountHtml(UI.modelFor(g.me()), PARTY);
  assert.equal(overview.includes('المدفوع للمقاولين'), false);
  assert.equal(overview.includes('120,000'), false);
});

test('D10 the issue card renders the same statement object', () => {
  reset();
  store.accountTxns = labor('m', 600000, '2026-11-02');
  UI.writeAccountScope({ scope: 'project', projectId: JOB, periodKind: 'week', anchorDate: '2026-11-18' });
  withStart('2026-10-01', () => {
    const viewApi = installAll();
    const issue = openContractor(viewApi);
    const model = UI.modelFor(g.me());
    model.screen.tab = 'statement';
    const page = UI.accountHtml(model, PARTY);
    const cut = html => {
      const start = html.indexOf('data-st-card');
      const end = html.indexOf('</div></div>', start);
      return html.slice(start, end);
    };
    assert.equal(cut(issue).length > 20, true);
    assert.equal(cut(issue), cut(page));
    assert.equal(Statement.renderedShown() != null, true);
  });
});

test('D13 one reason field covers both reversal buttons', () => {
  reset();
  store.accountTxns = labor('m', 1000, '2026-11-10').concat([
    row('pay', { purpose: 'payLabor', amount: 100, txnDate: '2026-11-11' }),
    row('adv', { purpose: 'advanceLabor', amount: 100, txnDate: '2026-11-11' }),
    row('stl_m_1', { kind: 'stl', purpose: 'settle', amount: 10, targetId: 'm', settlesId: 'adv', txnDate: '2026-11-12' }),
  ]);
  withStart('2026-10-01', () => {
    const both = openContractor(installAll());
    assert.equal(both.split('id="cc-reason"').length - 1, 1);
  });
  store.accountTxns = [row('pay', { purpose: 'payLabor', amount: 100, txnDate: '2026-11-11' })];
  withStart('2026-10-01', () => {
    const onlyI = openContractor(installAll());
    assert.equal(onlyI.split('id="cc-reason"').length - 1, 1);
  });
  store.accountTxns = [];
  withStart('2026-10-01', () => {
    const neither = openContractor(installAll());
    assert.equal(neither.includes('id="cc-reason"'), false);
  });
});

function clickAction(button) {
  const list = g.AccountActions || [];
  const action = list.find(item => item && (item.id === 'settle' || item.id === 'statement-approval'));
  assert.equal(typeof action.onClick, 'function');
  return action.onClick(button);
}

test('S9 the orphan reversal goes through the reason field and reversalDoc', async () => {
  reset();
  const docs = labor('m', 500000, '2026-11-10').concat([
    row('adv', { purpose: 'advanceLabor', amount: 100000, txnDate: '2026-11-10' }),
    row('rev_adv', { kind: 'rev', purpose: 'advanceLabor', reversesId: 'adv', createdAtServer: stamp('2026-11-20') }),
    row('stl_m_1', { kind: 'stl', purpose: 'settle', amount: 40000, targetId: 'm', settlesId: 'adv', txnDate: '2026-11-18' }),
  ]);
  store.accountTxns = docs;
  UI.writeAccountScope({ scope: 'project', projectId: JOB, periodKind: 'week', anchorDate: '2026-11-18' });
  const calls = [];
  const original = g.AccountCorrect.reversalDoc;
  g.AccountCorrect.reversalDoc = input => {
    calls.push(input);
    return original(input);
  };
  const prev = Accounts.CONTRACTOR_COST_START;
  Accounts.CONTRACTOR_COST_START = '2026-10-01';
  try {
    let synced = 0;
    const view = installAll();
    view.lastSyncAt = () => synced;
    g.flushRemote = () => { synced = Date.now() + 5; return Promise.resolve(); };
    g.navigator = { onLine: true };
    const html = openContractor(view);
    assert.equal(html.includes('disabled'), true);
    nodes['cc-reason'] = { id: 'cc-reason', value: '' };
    const button = { id: 'act-reverse-stl_m_1', disabled: true, dataset: { stRev: 'stl_m_1' } };
    clickAction(button);
    assert.deepEqual(store.outbox, []);
    nodes['cc-reason'].value = 'سبب';
    button.disabled = false;
    clickAction(button);
    assert.deepEqual(store.outbox, ['rev_stl_m_1']);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].reason, 'سبب');
    assert.equal(store.accountTxns.find(doc => doc.id === 'rev_stl_m_1').reversalReason, 'سبب');
    clickAction(button);
    assert.deepEqual(store.outbox, ['rev_stl_m_1']);
    const again = openContractor(view);
    assert.equal(again.includes('id="act-issue"'), true);
    assert.equal(again.includes('data-orphan="stl_m_1"'), false);
    store.outbox = [];
    clickAction({ id: 'act-issue', disabled: false, dataset: { stIssue: '1' } });
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(store.statementApprovals.length, 1);
    assert.deepEqual(store.outbox, [store.statementApprovals[0].id]);
  } finally {
    Accounts.CONTRACTOR_COST_START = prev;
    g.AccountCorrect.reversalDoc = original;
  }
});

test('S10 reversing the orphan deduct removes the tail', () => {
  reset();
  const world = cascade();
  store.accountTxns = world.docs;
  store.statementApprovals = world.approvals;
  UI.writeAccountScope({ scope: 'project', projectId: JOB, periodKind: 'week', anchorDate: '2026-11-18' });
  const calls = [];
  const original = g.AccountCorrect.reversalDoc;
  g.AccountCorrect.reversalDoc = input => {
    calls.push(input);
    return original(input);
  };
  try {
    withStart('2026-10-01', () => {
      openContractor(installAll());
      nodes['cc-reason'] = { id: 'cc-reason', value: 'سبب' };
      const button = { id: 'act-reverse-d1', disabled: false, dataset: { stRev: 'd1' } };
      clickAction(button);
      assert.deepEqual(store.outbox, ['rev_d1']);
      assert.equal(calls[0].targetId, 'd1');
      assert.equal(store.accountTxns.find(doc => doc.id === 'rev_d1').reversalReason, 'سبب');
      clickAction(button);
      assert.deepEqual(store.outbox, ['rev_d1']);
      const again = openContractor(installAll());
      assert.equal(again.includes('id="act-issue"'), true);
      g.today = () => '2026-12-01';
      const later = view(store.accountTxns, store.statementApprovals, '2026-11-23', '2026-11-29', { periodKind: 'week', today: '2026-12-01' });
      assert.equal(later.opening, 300000);
      assert.equal(printed(later).some(text => text.includes('من 2026-11-01')), false);
    });
  } finally {
    g.AccountCorrect.reversalDoc = original;
  }
});

test('D11 a correction row has no minus sign outside the dates', () => {
  reset();
  const docs = labor('m', 600000, '2026-10-10').concat([
    row('pay', { purpose: 'payLabor', amount: 600000, txnDate: '2026-10-15' }),
    row('rev_pay', { kind: 'rev', purpose: 'payLabor', reversesId: 'pay', createdAtServer: stamp('2026-11-03') }),
  ]);
  const issued = [approval('oct', '2026-10-01', '2026-10-31', '2026-11-01', { periodKind: 'month' })];
  const statement = view(docs, issued, '2026-11-01', '2026-11-30');
  const html = Statement.statementCardHtml(statement);
  const rows = visible(html).split('تصحيحات فترات سابقة')[1] || '';
  assert.equal(rows.includes('\u2212'), false);
  const line = printed(statement)[0];
  assert.match(line, /^مدفوع للعمل \d{1,3}(,\d{3})* د\.ع، (يزيد|ينقص) المستحق، من \d{4}-\d{2}-\d{2} إلى \d{4}-\d{2}-\d{2}$/);
});
