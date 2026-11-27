const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const Ledger = require('../public/ledger.js');
const Accounts = require('../public/accounts.js');
const SHIPPED = Accounts.CONTRACTOR_COST_START;
const DomSafe = require('../public/dom-safe.js');
const Sync = require('../public/sync.js');
const SyncStatus = require('../public/sync-status.js');

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
  subcontracts: /** @type {any[]} */ ([]),
  subcontractTerms: /** @type {Record<string, any>} */ ({}),
  subcontractAmendments: /** @type {any[]} */ ([]),
  projectFinance: /** @type {Record<string, any>} */ ({}),
  outbox: /** @type {string[]} */ ([]),
  syncErrors: /** @type {Record<string, unknown>} */ ({}),
  foremen: /** @type {any[]} */ ([]),
  foremanMoves: /** @type {any[]} */ ([]),
};
g.K = {
  parties: 'parties',
  agreements: 'agreements',
  accountTxns: 'accountTxns',
  projects: 'projects',
  entries: 'entries',
  terms: 'subcontractTerms',
  amendments: 'subcontractAmendments',
  finance: 'projectFinance',
  outbox: 'outbox',
  syncErrors: 'syncErrors',
  foremen: 'foremen',
  foremanMoves: 'foremanMoves',
  subcontracts: 'subcontracts',
};
g.get = (key, fallback) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallback);
g.set = (key, value) => {
  store[key] = value;
  return Promise.resolve();
};
g.me = () => ({ uid: 'u-ameer', role: 'owner', active: true, displayName: 'أمير' });
let seq = 0;
g.uuid = () => {
  seq += 1;
  return 'aaaaaaaa-bbbb-cccc-dddd-' + seq.toString(16).padStart(12, '0');
};
g.today = () => '2026-11-22';
g.deviceId = 'phone';
g.demoRole = () => '';
/** @type {string[]} */
let queued = [];
g.queueDoc = id => {
  if (!queued.includes(id)) queued.push(id);
  if (!store.outbox.includes(id)) store.outbox = store.outbox.concat([id]);
};
/** @type {Record<string, { value: string }>} */
let fields = {};
/** @type {ReturnType<typeof fakeTabs> | null} */
let tabsNow = null;
g.document = {
  querySelector: sel => {
    if (sel === '.tabs') return tabsNow;
    const id = String(sel || '').replace('#', '');
    return fields[id] || null;
  },
  createElement: () => fakeEl(),
  createElementNS: () => fakeEl(),
};

const UI = require('../public/accounts-view.js');
g.AccountsView = UI;
const Work = require('../public/accounts-work.js');
g.AccountPayment = require('../public/accounts-payment.js');

const AG_UNIT = ['id', 'partyId', 'projectId', 'method', 'description', 'currency', 'createdBy', 'createdAtServer', 'deviceId', 'unitRate', 'unitQty', 'unitName'];
const AG_LUMP = ['id', 'partyId', 'projectId', 'method', 'description', 'currency', 'createdBy', 'createdAtServer', 'deviceId', 'lumpAmount'];
const AG_MILE = ['id', 'partyId', 'projectId', 'method', 'description', 'currency', 'createdBy', 'createdAtServer', 'deviceId', 'milestoneAmount', 'milestoneMode'];
const REV_LUMP = AG_LUMP.concat(['reversesId', 'reversalReason']);
const QTY = ['id', 'kind', 'purpose', 'projectId', 'partyId', 'agreementId', 'ledger', 'currency', 'fxRate', 'qty', 'txnDate', 'description', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'];
const APPR = ['id', 'kind', 'purpose', 'projectId', 'partyId', 'agreementId', 'ledger', 'currency', 'fxRate', 'targetId', 'amount', 'qty', 'txnDate', 'description', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'];

function fakeEl() {
  return {
    href: '',
    dataset: {},
    textContent: '',
    children: /** @type {any[]} */ ([]),
    setAttribute() {},
    append() {},
    remove() {},
  };
}

function reset() {
  seq = 0;
  queued = [];
  fields = {};
  store.parties = [];
  store.agreements = [];
  store.accountTxns = [];
  store.projects = [{ id: 'job', name: 'مشروع المدرسة', status: 'active' }];
  store.entries = [];
  store.subcontracts = [];
  store.subcontractTerms = {};
  store.subcontractAmendments = [];
  store.projectFinance = {};
  store.outbox = [];
  store.syncErrors = {};
  store.foremen = [];
  store.foremanMoves = [];
  Accounts.CONTRACTOR_COST_START = null;
  g.today = () => '2026-11-22';
}

/**
 * @param {Record<string, string>} map
 */
function setFields(map) {
  fields = {};
  for (const [id, value] of Object.entries(map)) fields[id] = { value };
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

function install() {
  const next = api();
  Work.install(next);
  return next;
}

/**
 * @param {object} doc
 * @param {readonly string[]} allow
 */
function subset(doc, allow) {
  for (const key of Object.keys(doc)) {
    if (key === 'docType' || key === 'effect') continue;
    assert.equal(allow.includes(key), true, key);
  }
  assert.equal(Object.prototype.hasOwnProperty.call(doc, 'createdAtDevice'), false);
}

function brick() {
  return {
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    method: /** @type {'unit'} */ ('unit'),
    partyId: 'party-1',
    projectId: 'job',
    description: 'طابوق',
    currency: /** @type {'IQD'} */ ('IQD'),
    unitRate: 300000,
    unitQty: 4000,
    unitName: 'طوبة',
  };
}

/**
 * @param {Record<string, any>} [extra]
 */
function approve(extra) {
  const agreement = Object.assign(brick(), extra && extra.agreement);
  return Work.approveLaborDoc(Object.assign({
    targetId: '11111111-2222-3333-4444-555555555555',
    agreement,
    projectId: 'job',
    partyId: 'party-1',
    createdBy: 'u-ameer',
    deviceId: 'phone',
    approvedQty: 8000,
    qty: 8000,
  }, extra));
}

/** @type {Record<string, (arg?: string) => string> | null} */
let pageViews = null;

function page() {
  if (pageViews) return pageViews;
  const sandbox = {
    console,
    Ledger,
    Accounts,
    DomSafe,
    Sync,
    SyncStatus,
    AccountWork: Work,
    K: g.K,
    get: (key, fallback) => g.get(key, fallback),
    set: (key, value) => g.set(key, value),
    me: () => g.me(),
    uuid: () => g.uuid(),
    today: () => g.today(),
    demoRole: () => '',
    queueDoc: id => g.queueDoc(id),
    deviceId: 'phone',
    flushRemote() {},
    location: { hash: '' },
    document: {
      addEventListener() {},
      querySelector() { return null; },
      documentElement: { dir: 'rtl' },
    },
    navigator: { onLine: true },
    PeopleDir: { createLoader() { return {}; }, TIMEOUT_MS: 1, RENDER_ERROR: '' },
    withTimeout: p => p,
    ensureFirebase: () => Promise.resolve({ listUsers: () => Promise.resolve([]) }),
    $( ) {
      return { addEventListener() {}, hidden: false, value: '', textContent: '', classList: { toggle() {} } };
    },
    addEventListener() {},
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const src = fs.readFileSync(path.join(ROOT, 'public/render.js'), 'utf8');
  vm.runInContext(src + '\nglobalThis.__views = views;\n', sandbox, { filename: 'render.js' });
  pageViews = sandbox.__views;
  return pageViews;
}

/** @type {{ render: () => void, location: { hash: string } } | null} */
let shellApi = null;

function loadShell() {
  if (shellApi) return shellApi;
  useTabs();
  const el = () => ({
    value: '',
    hidden: false,
    textContent: '',
    innerHTML: '',
    dataset: {},
    href: '',
    children: /** @type {any[]} */ ([]),
    classList: { toggle() {} },
    addEventListener() {},
    setAttribute() {},
    removeAttribute() {},
    append() {},
    appendChild() {},
    querySelector() { return null; },
  });
  const sandbox = {
    console,
    Ledger,
    Accounts,
    DomSafe,
    Sync,
    SyncStatus,
    AccountWork: Work,
    AccountsView: UI,
    K: g.K,
    get: (key, fallback) => g.get(key, fallback),
    set: (key, value) => g.set(key, value),
    me: () => g.me(),
    uuid: () => g.uuid(),
    today: () => g.today(),
    demoRole: () => '',
    queueDoc: id => g.queueDoc(id),
    deviceId: 'phone',
    flushRemote() {},
    location: { hash: '#home' },
    document: {
      addEventListener() {},
      querySelector(sel) {
        if (sel === '.tabs') return tabsNow;
        return null;
      },
      querySelectorAll() {
        return tabsNow ? tabsNow.children : [];
      },
      createElement: () => el(),
      createElementNS: () => el(),
    },
    navigator: { onLine: true },
    PeopleDir: { createLoader() { return {}; }, TIMEOUT_MS: 1, RENDER_ERROR: '' },
    withTimeout: p => p,
    ensureFirebase: () => Promise.resolve({ listUsers: () => Promise.resolve([]) }),
    $(sel) {
      const id = String(sel || '').replace(/^#/, '');
      if (id === 'outbox' || id === 'print-root' || id === 'bell-panel' || id === 'sync-msg') return null;
      return el();
    },
    addEventListener() {},
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const src = fs.readFileSync(path.join(ROOT, 'public/render.js'), 'utf8');
  vm.runInContext(src + '\nglobalThis.__render = render;\n', sandbox, { filename: 'render.js' });
  shellApi = { render: sandbox.__render, location: sandbox.location };
  return shellApi;
}

function school() {
  store.projects = [{ id: 'p-school', name: 'مجمع المدرسة', status: 'active', currency: 'IQD' }];
  store.subcontracts = [{ id: 'sc-1', projectId: 'p-school', name: 'مقاول السباكة', work: 'تمديد شبكة الماء', agreedOn: '2026-10-01' }];
  store.subcontractTerms = { 'sc-1': { originalAmount: 1500000 } };
  store.entries = [];
}

test('unit approval is 600,000 and the body id is a uuid', () => {
  reset();
  const price = Accounts.unitPrice({ unitRate: 300000, unitQty: 4000 });
  assert.equal(price.amount, 75);
  assert.equal(price.errors.length, 0);
  const body = '11111111-2222-3333-4444-555555555555';
  const built = approve();
  assert.equal(built.errors.length, 0);
  const doc = /** @type {any} */ (built.doc);
  assert.equal(doc.amount, 600000);
  assert.equal(doc.targetId, body);
  assert.match(doc.targetId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  assert.deepEqual(doc.effect, { cost: 1, person: 1, cash: 0 });
});

test('approveLabor txnDate is today() even when the input date differs', () => {
  reset();
  const cases = ['1999-01-01', '2026-11-01', '', 'not-a-date', undefined];
  for (const txnDate of cases) {
    const expected = g.today();
    const built = approve({ txnDate });
    const doc = /** @type {any} */ (built.doc);
    assert.match(doc.txnDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(doc.txnDate, expected);
    assert.equal(doc.txnDate, g.today());
    if (txnDate === '2026-11-01') assert.notEqual(doc.txnDate, txnDate);
  }
  const at = Date.parse('2026-11-21T21:30:00.000Z');
  const RealDate = Date;
  class FixedDate extends RealDate {
    constructor() {
      super(at);
    }
  }
  g.Date = FixedDate;
  g.today = () => '2026-11-22';
  try {
    assert.equal(new Date().toISOString().slice(0, 10), '2026-11-21');
    const built = approve({ txnDate: '2026-11-01' });
    const doc = /** @type {any} */ (built.doc);
    assert.equal(doc.txnDate, g.today());
    assert.equal(doc.txnDate, '2026-11-22');
    assert.notEqual(doc.txnDate, '2026-11-01');
    assert.notEqual(doc.txnDate, new Date().toISOString().slice(0, 10));
  } finally {
    g.Date = RealDate;
    g.today = () => '2026-11-22';
  }
});

test('a lump approves its amount and generation 1 is stable', () => {
  reset();
  const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  assert.equal(Work.slotBodyId(id, '1'), '000aaaaaaaabbbbccccddddeeeeeeeeeeee1');
  assert.equal(Work.slotBodyId(id, '1'), Work.slotBodyId(id, '1'));
  const built = Work.approveLaborDoc({
    targetId: Work.slotBodyId(id, '1'),
    agreement: {
      id, method: 'lump', partyId: 'party-1', projectId: 'job', description: 'مبلغ', currency: 'IQD', lumpAmount: 600000,
    },
    projectId: 'job',
    partyId: 'party-1',
    createdBy: 'u-ameer',
    deviceId: 'phone',
  });
  assert.equal(/** @type {any} */ (built.doc).amount, 600000);
});

test('daily rate 50,000 for 3 days earns 150,000', () => {
  reset();
  const built = Work.approveLaborDoc({
    targetId: '11111111-2222-3333-4444-555555555555',
    agreement: { id: brick().id, method: 'daily', partyId: 'party-1', projectId: 'job', description: 'يوم', currency: 'IQD', dayRate: 50000 },
    projectId: 'job',
    partyId: 'party-1',
    createdBy: 'u-ameer',
    deviceId: 'phone',
    approvedQty: 3,
    qty: 3,
  });
  assert.equal(/** @type {any} */ (built.doc).amount, 150000);
});

test('an amount milestone earns its amount and stores no percent', () => {
  reset();
  const saved = Work.agreementDoc({
    id: brick().id,
    partyId: 'party-1',
    projectId: 'job',
    method: 'milestone',
    description: 'مرحلة أولى',
    milestoneAmount: 250000,
    createdBy: 'u-ameer',
    deviceId: 'phone',
  });
  const agreement = /** @type {any} */ (saved.doc);
  assert.equal(agreement.milestoneMode, 'amount');
  assert.equal(Object.prototype.hasOwnProperty.call(agreement, 'percent'), false);
  const built = Work.approveLaborDoc({
    targetId: Work.slotBodyId(brick().id, '1'),
    agreement,
    projectId: 'job',
    partyId: 'party-1',
    createdBy: 'u-ameer',
    deviceId: 'phone',
  });
  const doc = /** @type {any} */ (built.doc);
  assert.equal(doc.amount, 250000);
  assert.equal(Object.prototype.hasOwnProperty.call(doc, 'percent'), false);
});

test('generation 9 is the last slot', () => {
  reset();
  withStart('2026-11-01', () => {
    const id = brick().id;
    store.agreements = [{
      id, method: 'lump', partyId: 'party-1', projectId: 'job', description: 'مبلغ', currency: 'IQD', lumpAmount: 600000,
    }];
    for (let n = 1; n <= 8; n += 1) {
      const body = Work.slotBodyId(id, String(n));
      store.accountTxns.push({ id: body, purpose: 'laborQty', agreementId: id });
      store.accountTxns.push({ id: 'rej_' + body });
    }
    const view = install();
    const html = view.views.contractor(id);
    assert.equal(html.includes('المحاولة 9 من 9'), true);
    assert.equal(html.includes('المحاولة 10 من 9'), false);
  });
});

test('a uuid body on a lump agreement is method, and bad quantities are range or overflow', () => {
  reset();
  const lump = { id: brick().id, method: /** @type {'lump'} */ ('lump'), partyId: 'party-1', projectId: 'job', description: 'مبلغ', currency: /** @type {'IQD'} */ ('IQD'), lumpAmount: 600000 };
  const wrong = Work.laborQtyDoc({
    id: '11111111-2222-3333-4444-555555555555',
    agreement: lump,
    projectId: 'job',
    partyId: 'party-1',
    createdBy: 'u-ameer',
    deviceId: 'phone',
  });
  assert.deepEqual(wrong.errors, ['method']);
  const bigUnit = Object.assign(brick(), { unitQty: 1000001 });
  const range = Work.laborQtyDoc({
    id: '11111111-2222-3333-4444-555555555555',
    agreement: bigUnit,
    projectId: 'job',
    partyId: 'party-1',
    createdBy: 'u-ameer',
    deviceId: 'phone',
    approvedQty: 1,
    qty: 1,
  });
  assert.equal(range.errors.includes('range') || range.errors.includes('overflow'), true);
  for (const qty of [-1, 1.5]) {
    const built = approve({ approvedQty: qty, qty });
    assert.equal(built.errors.includes('range') || built.errors.includes('overflow'), true);
  }
  const overflow = approve({
    agreement: Object.assign(brick(), { unitRate: 100000000, unitQty: 1 }),
    approvedQty: 100000001,
    qty: 100000001,
  });
  assert.equal(overflow.errors.includes('range') || overflow.errors.includes('overflow'), true);
});

test('earned 0, two method groups, and percent are refused', () => {
  reset();
  const zero = approve({ approvedQty: 0, qty: 0 });
  assert.deepEqual(zero.errors, ['earned']);
  const mixed = approve({
    agreement: Object.assign(brick(), { lumpAmount: 1 }),
  });
  assert.deepEqual(mixed.errors, ['method']);
  const percent = Work.approveLaborDoc({
    targetId: Work.slotBodyId(brick().id, '1'),
    agreement: {
      id: brick().id, method: 'milestone', partyId: 'party-1', projectId: 'job', description: 'مرحلة', currency: 'IQD',
      milestoneAmount: 250000, milestoneMode: 'percent',
    },
    projectId: 'job',
    partyId: 'party-1',
    createdBy: 'u-ameer',
    deviceId: 'phone',
  });
  assert.deepEqual(percent.errors, ['percent']);
});

test('an empty description leaves the agreement save off', () => {
  reset();
  withStart('2026-11-01', () => {
    store.parties = [{ id: 'party-1', name: 'حسن' }];
    const view = install();
    view.views.contractor('new');
    setFields({ 'cw-desc': '', 'cw-rate': '300000', 'cw-per': '4000', 'cw-unit': 'طوبة' });
    const button = { id: 'act-new-agreement', disabled: false, dataset: {} };
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cparty: 'party-1' } }));
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cproj: 'job' } }));
    UI.onClick(/** @type {any} */ (button));
    assert.equal(store.agreements.length, 0);
    assert.deepEqual(queued, []);
    assert.equal(button.disabled, true);
  });
});

test('post approveLabor with no agreement object is agreement', () => {
  reset();
  const direct = Accounts.post('approveLabor', {
    id: 'appr_x',
    targetId: 'x',
    target: { id: 'x', purpose: 'laborQty', ledger: 'labor', effect: { cost: 0, person: 0, cash: 0 } },
  });
  assert.deepEqual(direct.errors, ['agreement']);
  const built = Work.approveLaborDoc({ id: 'appr_x', targetId: 'x', target: { id: 'x', purpose: 'laborQty' } });
  assert.deepEqual(built.errors, ['agreement']);
});

test('two taps of the agreement save append one row and one outbox id', () => {
  reset();
  withStart('2026-11-01', () => {
    store.parties = [{ id: 'party-1', name: 'حسن' }];
    const view = install();
    view.views.contractor('');
    UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cparty: 'party-1' } }));
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cproj: 'job' } }));
    setFields({ 'cw-desc': 'طابوق', 'cw-rate': '300000', 'cw-per': '4000', 'cw-unit': 'طوبة' });
    const button = { id: 'act-new-agreement', disabled: false, dataset: {} };
    let disabledDuring = false;
    const orig = g.set;
    g.set = (key, value) => {
      if (key === 'agreements') disabledDuring = button.disabled === true;
      return orig(key, value);
    };
    UI.onClick(/** @type {any} */ (button));
    UI.onClick(/** @type {any} */ (button));
    g.set = orig;
    assert.equal(disabledDuring, true);
    assert.equal(store.agreements.length, 1);
    assert.equal(queued.length, 1);
    assert.equal(queued[0], store.agreements[0].id);
  });
});

test('two taps of approve-labor append one appr_ and one outbox id', () => {
  reset();
  withStart('2026-11-01', () => {
    const id = brick().id;
    store.agreements = [Object.assign(brick(), { createdBy: 'u-ameer', deviceId: 'phone' })];
    const body = '11111111-2222-3333-4444-555555555555';
    store.accountTxns = [{ id: body, purpose: 'laborQty', agreementId: id, partyId: 'party-1', projectId: 'job', qty: 8000, ledger: 'labor' }];
    const view = install();
    view.views.contractor(id);
    const button = { id: 'act-approve-labor', disabled: false, dataset: {} };
    let disabledDuring = false;
    const orig = g.set;
    g.set = (key, value) => {
      if (key === 'accountTxns') disabledDuring = button.disabled === true;
      return orig(key, value);
    };
    UI.onClick(/** @type {any} */ (button));
    UI.onClick(/** @type {any} */ (button));
    g.set = orig;
    const approvals = store.accountTxns.filter(row => String(row.id).indexOf('appr_') === 0);
    assert.equal(disabledDuring, true);
    assert.equal(approvals.length, 1);
    assert.equal(approvals[0].id, 'appr_' + body);
    assert.equal(queued.filter(item => item === 'appr_' + body).length, 1);
  });
});

test('a reversal copies the agreement and a live rev_ cancels later work', () => {
  reset();
  const agreement = /** @type {any} */ (Work.agreementDoc({
    id: brick().id,
    partyId: 'party-1',
    projectId: 'job',
    method: 'lump',
    description: 'مبلغ مقطوع',
    lumpAmount: 600000,
    createdBy: 'u-ameer',
    deviceId: 'phone',
  }).doc);
  const rev = Work.agreementReversalDoc({
    agreement,
    reversalReason: 'تصحيح المبلغ',
    createdBy: 'u-ameer',
    deviceId: 'phone',
  });
  const doc = /** @type {any} */ (rev.doc);
  assert.equal(doc.id, 'rev_' + agreement.id);
  assert.equal(doc.lumpAmount, 600000);
  assert.equal(doc.description, agreement.description);
  assert.equal(doc.partyId, agreement.partyId);
  assert.equal(doc.projectId, agreement.projectId);
  assert.equal(Object.prototype.hasOwnProperty.call(doc, 'txnDate'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(doc, 'fxRate'), false);
  const nested = Work.agreementReversalDoc({
    agreement: Object.assign({}, agreement, { id: 'rev_' + agreement.id }),
    reversalReason: 'مرة ثانية',
    createdBy: 'u-ameer',
    deviceId: 'phone',
  });
  assert.deepEqual(nested.errors, ['kind']);
  const empty = Work.agreementReversalDoc({ agreement, reversalReason: '', createdBy: 'u-ameer', deviceId: 'phone' });
  assert.equal(empty.doc, null);
  store.agreements = [agreement, doc];
  const measure = Work.laborQtyDoc({
    id: Work.slotBodyId(agreement.id, '1'),
    agreement,
    gen: '1',
    projectId: 'job',
    partyId: 'party-1',
    createdBy: 'u-ameer',
    deviceId: 'phone',
  });
  assert.deepEqual(measure.errors, ['cancelled']);
  const approval = Work.approveLaborDoc({
    targetId: Work.slotBodyId(agreement.id, '1'),
    agreement,
    projectId: 'job',
    partyId: 'party-1',
    createdBy: 'u-ameer',
    deviceId: 'phone',
  });
  assert.deepEqual(approval.errors, ['cancelled']);
  store.syncErrors = { [doc.id]: 'رُفض الإرسال' };
  const again = Work.laborQtyDoc({
    id: Work.slotBodyId(agreement.id, '1'),
    agreement,
    gen: '1',
    projectId: 'job',
    partyId: 'party-1',
    createdBy: 'u-ameer',
    deviceId: 'phone',
  });
  assert.equal(again.errors.includes('cancelled'), false);
  assert.equal(again.doc == null, false);
});

test('while the export is null there is no مقاول link and measurement and approval do not save', () => {
  reset();
  school();
  const html = page().project('p-school');
  assert.equal(html.includes('+ عقد مقاول'), true);
  const form = page().subnew('p-school');
  assert.equal(form.includes('مقاول السباكة'), true);
  assert.equal(form.includes('حفظ العقد'), true);
  const view = install();
  const tabs = useTabs();
  Work.syncTab(g.me());
  assert.equal(tabs.children.length, 0);
  store.parties = [{ id: 'party-1', name: 'حسن' }];
  store.agreements = [brick()];
  store.accountTxns = [{ id: '11111111-2222-3333-4444-555555555555', purpose: 'laborQty', agreementId: brick().id, qty: 8, projectId: 'job', partyId: 'party-1' }];
  view.views.contractor('new');
  setFields({ 'cw-desc': 'طابوق', 'cw-rate': '1', 'cw-per': '1', 'cw-unit': 'طوبة' });
  UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cparty: 'party-1' } }));
  UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cproj: 'job' } }));
  UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
  view.views.contractor(brick().id);
  setFields({ 'cw-qty': '8' });
  UI.onClick(/** @type {any} */ ({ id: 'act-labor-qty', disabled: false, dataset: {} }));
  UI.onClick(/** @type {any} */ ({ id: 'act-approve-labor', disabled: false, dataset: {} }));
  assert.equal(store.agreements.length, 1);
  assert.equal(store.accountTxns.length, 1);
  assert.deepEqual(queued, []);
});

test('before the start date, agreement, measurement, and approval do not save', () => {
  reset();
  withStart('2026-12-01', () => {
    const view = install();
    const tabs = useTabs();
    Work.syncTab(g.me());
    assert.equal(tabs.children.length, 0);
    store.parties = [{ id: 'party-1', name: 'حسن' }];
    store.agreements = [brick()];
    store.accountTxns = [{ id: '11111111-2222-3333-4444-555555555555', purpose: 'laborQty', agreementId: brick().id, qty: 8000, projectId: 'job', partyId: 'party-1' }];
    const before = store.accountTxns.length;
    view.views.contractor('new');
    setFields({ 'cw-desc': 'طابوق', 'cw-rate': '1', 'cw-per': '1', 'cw-unit': 'طوبة' });
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cparty: 'party-1' } }));
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cproj: 'job' } }));
    UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
    view.views.contractor(brick().id);
    UI.onClick(/** @type {any} */ ({ id: 'act-labor-qty', disabled: false, dataset: {} }));
    UI.onClick(/** @type {any} */ ({ id: 'act-approve-labor', disabled: false, dataset: {} }));
    assert.equal(store.agreements.length, 1);
    assert.equal(store.accountTxns.length, before);
    assert.equal(store.accountTxns.some(row => String(row.id).indexOf('appr_') === 0), false);
    assert.deepEqual(queued, []);
  });
  assert.equal(Accounts.CONTRACTOR_COST_START, null);
});

test('a start date on or before today hides the old create form and opens مقاول', () => {
  reset();
  school();
  withStart('2026-11-01', () => {
    const html = page().project('p-school');
    assert.equal(html.includes('مقاول السباكة'), true);
    assert.equal(html.includes('المدفوع'), true);
    assert.equal(html.includes('+ عقد مقاول'), false);
    const form = page().subnew('p-school');
    assert.equal(form.includes('id="sub-name"'), false);
    assert.equal(form.includes('id="sub-amount"'), false);
    assert.equal(form.includes('id="sub-work"'), false);
    assert.equal(form.includes('حفظ العقد'), false);
    assert.equal(form.includes('مجمع المدرسة'), true);
    assert.equal(form.includes(Work.pendingAmeer.newContract), true);
    assert.equal(form.includes(Work.pendingAmeer.unitByProgress), false);
    const detail = page().sub('sc-1');
    assert.equal(detail.includes('المتفق عليه'), true);
    assert.equal(detail.includes('الدفعات'), true);
    const view = install();
    const tabs = useTabs();
    Work.syncTab(g.me());
    assert.equal(tabs.children.length, 1);
    assert.equal(tabs.children[0].dataset.tab, 'contractor');
    const screen = view.views.contractor('new');
    assert.equal(screen.includes('بسعر الوحدة'), false);
    assert.equal(screen.includes(Work.pendingAmeer.unitByProgress), true);
  });
  assert.equal(Accounts.CONTRACTOR_COST_START, null);
});

test('a unit agreement detail shows the progress label', () => {
  reset();
  withStart('2026-11-01', () => {
    store.agreements = [brick()];
    const html = install().views.contractor(brick().id);
    assert.equal(html.includes(Work.pendingAmeer.unitByProgress), true);
    assert.equal(html.includes('بسعر الوحدة'), false);
  });
});

test('a start date after today hides the old form and leaves مقاول closed', () => {
  reset();
  school();
  withStart('2026-12-01', () => {
    const form = page().subnew('p-school');
    assert.equal(form.includes('حفظ العقد'), false);
    assert.equal(form.includes(Work.pendingAmeer.newContract), true);
    const tabs = useTabs();
    install();
    Work.syncTab(g.me());
    assert.equal(tabs.children.length, 0);
  });
  assert.equal(Accounts.CONTRACTOR_COST_START, null);
});

test('cancel stays off when the local project is not active', () => {
  reset();
  withStart('2026-11-01', () => {
    const row = Object.assign(brick(), { createdBy: 'u-ameer', deviceId: 'phone' });
    store.agreements = [row];
    store.projects = [{ id: 'job', name: 'مشروع المدرسة', status: 'closed' }];
    const before = JSON.stringify(row);
    const view = install();
    const html = view.views.contractor(row.id);
    assert.equal(html.includes('disabled'), true);
    setFields({ 'cw-reason': 'تصحيح' });
    UI.onClick(/** @type {any} */ ({ id: 'act-cancel-agreement', disabled: false, dataset: {} }));
    assert.equal(store.agreements.length, 1);
    assert.equal(JSON.stringify(store.agreements[0]), before);
    assert.deepEqual(queued, []);
  });
});

test('a refused cancel leaves no live reversal and the agreement row unchanged', () => {
  reset();
  withStart('2026-11-01', () => {
    const row = Object.assign(brick(), { createdBy: 'u-ameer', deviceId: 'phone', description: 'طابوق' });
    store.agreements = [row];
    const before = JSON.stringify(row);
    const view = install();
    view.views.contractor(row.id);
    setFields({ 'cw-reason': 'تصحيح المبلغ' });
    UI.onClick(/** @type {any} */ ({ id: 'act-cancel-agreement', disabled: false, dataset: {} }));
    assert.equal(store.agreements.length, 2);
    assert.equal(JSON.stringify(store.agreements[0]), before);
    const rev = store.agreements[1];
    store.syncErrors = { [rev.id]: 'رُفض الإرسال' };
    const index = Accounts.rowIndex(store.agreements, store.syncErrors);
    assert.equal(Accounts.rowLive(rev, index), false);
    assert.equal(JSON.stringify(store.agreements[0]), before);
    const html = view.views.contractor(row.id);
    assert.equal(html.includes('رُفض الإرسال'), true);
    assert.equal(html.includes('id="act-cancel-agreement" disabled'), true);
    store.syncErrors = { [rev.id]: 'رُفض الإرسال لأن المشروع محذوف' };
    const deleted = view.views.contractor(row.id);
    assert.equal(deleted.includes('رُفض الإرسال لأن المشروع محذوف'), true);
    assert.equal(Accounts.rowLive(rev, Accounts.rowIndex(store.agreements, store.syncErrors)), false);
  });
});

test('a body in syncErrors is not offered for approval', () => {
  reset();
  withStart('2026-11-01', () => {
    const id = brick().id;
    const body = '11111111-2222-3333-4444-555555555555';
    store.agreements = [brick()];
    store.accountTxns = [{ id: body, purpose: 'laborQty', agreementId: id, qty: 8, projectId: 'job', partyId: 'party-1' }];
    store.syncErrors = { [body]: 'رُفض الإرسال' };
    const index = Accounts.rowIndex(store.accountTxns, store.syncErrors);
    assert.equal(Accounts.rowLive(store.accountTxns[0], index), false);
    const view = install();
    const html = view.views.contractor(id);
    assert.equal(html.includes('act-approve-labor'), false);
  });
});

test('حسابات does not paint act-new-agreement', () => {
  reset();
  store.parties = [{ id: 'party-1', name: 'حسن' }];
  install();
  const model = UI.modelFor(g.me());
  model.screen.tab = 'movements';
  const html = UI.accountHtml(model, 'party-1');
  assert.equal(html.includes('act-new-agreement'), false);
  model.screen.tab = 'agreements';
  assert.equal(UI.accountHtml(model, 'party-1').includes('act-new-agreement'), false);
});

test('builder keys stay inside the live allowlist', () => {
  reset();
  const agreement = Work.agreementDoc({
    id: brick().id,
    partyId: 'party-1',
    projectId: 'job',
    method: 'unit',
    description: 'طابوق',
    unitRate: 300000,
    unitQty: 4000,
    unitName: 'طوبة',
    createdBy: 'u-ameer',
    deviceId: 'phone',
  });
  subset(/** @type {object} */ (agreement.doc), AG_UNIT);
  const lump = Work.agreementDoc({
    id: brick().id, partyId: 'party-1', projectId: 'job', method: 'lump', description: 'مبلغ', lumpAmount: 600000, createdBy: 'u-ameer', deviceId: 'phone',
  });
  subset(/** @type {object} */ (lump.doc), AG_LUMP);
  const rev = Work.agreementReversalDoc({
    agreement: /** @type {any} */ (lump.doc),
    reversalReason: 'تصحيح',
    createdBy: 'u-ameer',
    deviceId: 'phone',
  });
  subset(/** @type {object} */ (rev.doc), REV_LUMP);
  const qty = Work.laborQtyDoc({
    id: '11111111-2222-3333-4444-555555555555',
    agreement: brick(),
    projectId: 'job',
    partyId: 'party-1',
    createdBy: 'u-ameer',
    createdByName: 'أمير',
    deviceId: 'phone',
    approvedQty: 8000,
    qty: 8000,
    txnDate: '2026-11-22',
  });
  subset(/** @type {object} */ (qty.doc), QTY);
  const mile = Work.agreementDoc({
    id: brick().id, partyId: 'party-1', projectId: 'job', method: 'milestone', description: 'مرحلة', milestoneAmount: 250000, createdBy: 'u-ameer', deviceId: 'phone',
  });
  subset(/** @type {object} */ (mile.doc), AG_MILE);
  const appr = approve({ createdByName: 'أمير' });
  subset(/** @type {object} */ (appr.doc), APPR);
});

test('a start date equal to today opens مقاول and allows a save', () => {
  reset();
  withStart(g.today(), () => {
    const view = install();
    const tabs = useTabs();
    Work.syncTab(g.me());
    assert.equal(tabs.children.length, 1);
    store.parties = [{ id: 'party-1', name: 'حسن' }];
    view.views.contractor('new');
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cparty: 'party-1' } }));
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cproj: 'job' } }));
    setFields({ 'cw-desc': 'طابوق', 'cw-rate': '300000', 'cw-per': '4000', 'cw-unit': 'طوبة' });
    UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
    assert.equal(store.agreements.length, 1);
  });
  assert.equal(Accounts.CONTRACTOR_COST_START, null);
});

test('a unit agreement keeps a second measurement and approves it', () => {
  reset();
  withStart('2026-11-22', () => {
    const id = brick().id;
    store.agreements = [Object.assign(brick(), { createdBy: 'u-ameer', deviceId: 'phone' })];
    const view = install();
    view.views.contractor(id);
    const save = { id: 'act-labor-qty', disabled: false, dataset: {} };
    setFields({ 'cw-qty': '8000' });
    UI.onClick(/** @type {any} */ (save));
    setFields({ 'cw-qty': '4000' });
    UI.onClick(/** @type {any} */ (save));
    const bodies = store.accountTxns.filter(row => row.purpose === 'laborQty');
    assert.equal(bodies.length, 2);
    assert.notEqual(bodies[0].id, bodies[1].id);
    let html = view.views.contractor(id);
    assert.equal(html.includes('id="act-labor-qty"'), true);
    assert.equal(html.includes('id="act-approve-labor"'), true);
    UI.onClick(/** @type {any} */ ({ id: 'act-approve-labor', disabled: false, dataset: {} }));
    const first = store.accountTxns.filter(row => String(row.id).indexOf('appr_') === 0);
    assert.equal(first.length, 1);
    assert.equal(first[0].targetId, bodies[1].id);
    html = view.views.contractor(id);
    assert.equal(html.includes('id="act-labor-qty"'), true);
    assert.equal(html.includes('id="act-approve-labor"'), true);
    assert.equal(html.includes('معتمد'), true);
    assert.equal(html.includes('القياس معتمد مسبقاً'), true);
    UI.onClick(/** @type {any} */ ({ id: 'act-approve-labor', disabled: false, dataset: {} }));
    const approvals = store.accountTxns.filter(row => String(row.id).indexOf('appr_') === 0);
    assert.equal(approvals.length, 2);
    assert.notEqual(approvals[0].id, approvals[1].id);
  });
});

test('a measurement keeps a civil txnDate and drops 2026-02-31', () => {
  reset();
  const input = {
    id: '11111111-2222-3333-4444-555555555555',
    agreement: brick(),
    projectId: 'job',
    partyId: 'party-1',
    createdBy: 'u-ameer',
    deviceId: 'phone',
    approvedQty: 8000,
    qty: 8000,
  };
  const kept = Work.laborQtyDoc(Object.assign({}, input, { txnDate: '2026-11-22' }));
  assert.equal(/** @type {any} */ (kept.doc).txnDate, '2026-11-22');
  const later = Work.laborQtyDoc(Object.assign({}, input, { id: '22222222-2222-3333-4444-555555555555', txnDate: '2099-01-01' }));
  assert.equal(/** @type {any} */ (later.doc).txnDate, '2099-01-01');
  const bad = Work.laborQtyDoc(Object.assign({}, input, { id: '33333333-2222-3333-4444-555555555555', txnDate: '2026-02-31' }));
  assert.equal(bad.doc == null, false);
  assert.equal(Object.prototype.hasOwnProperty.call(/** @type {object} */ (bad.doc), 'txnDate'), false);
  const omitted = Work.laborQtyDoc(Object.assign({}, input, { id: '44444444-2222-3333-4444-555555555555' }));
  assert.equal(Object.prototype.hasOwnProperty.call(/** @type {object} */ (omitted.doc), 'txnDate'), false);
  const april = Work.laborQtyDoc(Object.assign({}, input, { id: '55555555-2222-3333-4444-555555555555', txnDate: '2026-04-31' }));
  assert.equal(Object.prototype.hasOwnProperty.call(/** @type {object} */ (april.doc), 'txnDate'), false);
  const lump = {
    id: brick().id,
    method: /** @type {'lump'} */ ('lump'),
    partyId: 'party-1',
    projectId: 'job',
    description: 'مبلغ',
    currency: /** @type {'IQD'} */ ('IQD'),
    lumpAmount: 600000,
  };
  const slot = Work.slotBodyId(lump.id, '1');
  const late = Work.laborQtyDoc({
    id: slot, agreement: lump, gen: '1', projectId: 'job', partyId: 'party-1', createdBy: 'u-ameer', deviceId: 'phone', txnDate: '2101-01-01',
  });
  assert.equal(Object.prototype.hasOwnProperty.call(/** @type {object} */ (late.doc), 'txnDate'), false);
  const bound = Work.laborQtyDoc({
    id: slot, agreement: lump, gen: '1', projectId: 'job', partyId: 'party-1', createdBy: 'u-ameer', deviceId: 'phone', txnDate: '2100-12-31',
  });
  assert.equal(/** @type {any} */ (bound.doc).txnDate, '2100-12-31');
});

test('an empty measurement tap queues nothing and a cleared second tap does not add a body', () => {
  reset();
  withStart('2026-11-22', () => {
    const id = brick().id;
    store.agreements = [Object.assign(brick(), { createdBy: 'u-ameer', deviceId: 'phone' })];
    const view = install();
    view.views.contractor(id);
    const save = { id: 'act-labor-qty', disabled: false, dataset: {} };
    setFields({ 'cw-qty': '' });
    UI.onClick(/** @type {any} */ (save));
    UI.onClick(/** @type {any} */ (save));
    assert.equal(store.accountTxns.length, 0);
    assert.deepEqual(queued, []);
    assert.equal(view.views.contractor(id).includes('الكمية لازم رقم صحيح بدون كسور، مثل 25 أو 1,000'), true);
    assert.equal(view.views.contractor(id).includes('المبلغ ليس عدداً صحيحاً'), false);
    const missing = Work.laborQtyDoc({
      id: '11111111-2222-3333-4444-555555555555',
      agreement: brick(),
      projectId: 'job',
      partyId: 'party-1',
      createdBy: 'u-ameer',
      deviceId: 'phone',
    });
    assert.deepEqual(missing.errors, ['range']);
    assert.equal(missing.doc, null);
    setFields({ 'cw-qty': '8000' });
    UI.onClick(/** @type {any} */ (save));
    setFields({});
    UI.onClick(/** @type {any} */ (save));
    const bodies = store.accountTxns.filter(row => row.purpose === 'laborQty');
    assert.equal(bodies.length, 1);
    assert.equal(bodies[0].qty, 8000);
    assert.deepEqual(queued, [bodies[0].id]);
    assert.equal(view.views.contractor(id).includes('الكمية لازم رقم صحيح بدون كسور، مثل 25 أو 1,000'), true);
    assert.equal(view.views.contractor(id).includes('المبلغ ليس عدداً صحيحاً'), false);
  });
});

test('a refused newest measurement does not hide an older valid one', () => {
  reset();
  withStart('2026-11-22', () => {
    const id = brick().id;
    const older = '11111111-2222-3333-4444-555555555555';
    const newer = '22222222-2222-3333-4444-555555555555';
    store.agreements = [Object.assign(brick(), { createdBy: 'u-ameer', deviceId: 'phone' })];
    store.accountTxns = [
      { id: older, purpose: 'laborQty', agreementId: id, qty: 8000, projectId: 'job', partyId: 'party-1' },
      { id: newer, purpose: 'laborQty', agreementId: id, projectId: 'job', partyId: 'party-1' },
    ];
    store.syncErrors = { [newer]: 'رُفض الإرسال' };
    const view = install();
    const html = view.views.contractor(id);
    assert.equal(html.includes('id="act-approve-labor"'), true);
    UI.onClick(/** @type {any} */ ({ id: 'act-approve-labor', disabled: false, dataset: {} }));
    const approvals = store.accountTxns.filter(row => String(row.id).indexOf('appr_') === 0);
    assert.equal(approvals.length, 1);
    assert.equal(approvals[0].targetId, older);
  });
});

test('the screen reversal copies the stored agreement description', () => {
  reset();
  withStart('2026-11-22', () => {
    const row = Object.assign(brick(), { createdBy: 'u-ameer', deviceId: 'phone', description: 'طابوق' });
    store.agreements = [row];
    const view = install();
    view.views.contractor(row.id);
    setFields({ 'cw-reason': 'تصحيح المبلغ' });
    UI.onClick(/** @type {any} */ ({ id: 'act-cancel-agreement', disabled: false, dataset: {} }));
    const rev = store.agreements.find(item => String(item.id).indexOf('rev_') === 0);
    assert.ok(rev);
    assert.equal(rev.description, 'طابوق');
    assert.equal(rev.partyId, row.partyId);
    assert.equal(rev.projectId, row.projectId);
    assert.equal(Object.prototype.hasOwnProperty.call(rev, 'txnDate'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(rev, 'fxRate'), false);
  });
});

test('renderScreen calls AccountWork.syncTab from the nav wiring', () => {
  reset();
  const shell = loadShell();
  withStart(g.today(), () => {
    shell.location.hash = '#home';
    shell.render();
    assert.equal(tabsNow.children.some(el => el.dataset.tab === 'contractor'), true);
  });
  withStart('2026-12-01', () => {
    shell.render();
    assert.equal(tabsNow.children.some(el => el.dataset.tab === 'contractor'), false);
  });
  assert.equal(Accounts.CONTRACTOR_COST_START, null);
});

test('the source binding is the shipped start', () => {
  const src = fs.readFileSync(path.join(ROOT, 'public/accounts.js'), 'utf8');
  assert.equal(SHIPPED, '2026-11-27');
  assert.match(src, /const CONTRACTOR_COST_START = '2026-11-27';/);
  assert.equal(src.includes('const CONTRACTOR_COST_START = null;'), false);
  assert.equal(Work.pendingAmeer.unitByProgress, 'حسب الإنجاز (الكمية × سعر الوحدة)');
  assert.equal(Work.pendingAmeer.newContract, 'العقد الجديد من شاشة مقاول');
});

test('the quantity sentence is the approved wording', () => {
  const src = fs.readFileSync(path.join(ROOT, 'public/accounts-work.js'), 'utf8');
  assert.equal(src.includes('الكمية لازم رقم صحيح بدون كسور، مثل 25 أو 1,000'), true);
});

/**
 * @returns {{ children: any[], querySelector: (sel: string) => any, appendChild: (el: any) => void }}
 */
function useTabs() {
  tabsNow = fakeTabs();
  return tabsNow;
}

function fakeTabs() {
  const children = /** @type {any[]} */ ([]);
  return {
    children,
    querySelector(sel) {
      if (sel === '[data-tab="contractor"]') return children.find(el => el.dataset.tab === 'contractor') || null;
      return null;
    },
    appendChild(el) {
      el.remove = () => {
        const at = children.indexOf(el);
        if (at >= 0) children.splice(at, 1);
      };
      children.push(el);
    },
  };
}

test('IQD agreement fields group and refuse 2,5', () => {
  /**
   * @param {string} id
   */
  function group(id) {
    const el = /** @type {any} */ (fields[id]);
    el.selectionStart = String(el.value).length;
    el.selectionEnd = el.selectionStart;
    el.setSelectionRange = (start, end) => {
      el.selectionStart = start;
      el.selectionEnd = end;
    };
    g.AccountPayment.applyGroupedAmount(el);
  }
  /**
   * @param {'lump'|'unit'|'daily'|'milestone'} method
   */
  function begin(method) {
    const view = install();
    view.views.contractor('');
    UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cparty: 'party-1' } }));
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cproj: 'job' } }));
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cmethod: method } }));
    return view;
  }
  reset();
  withStart('2026-11-22', () => {
    store.parties = [{ id: 'party-1', name: 'حسن' }];
    store.projects = [{ id: 'job', name: 'مشروع', status: 'active' }];
    const cases = [
      ['lump', 'cw-lump', 'lumpAmount'],
      ['unit', 'cw-rate', 'unitRate'],
      ['daily', 'cw-day', 'dayRate'],
      ['milestone', 'cw-mile', 'milestoneAmount'],
    ];
    for (const [method, id, key] of cases) {
      begin(/** @type {'lump'|'unit'|'daily'|'milestone'} */ (method));
      const values = { 'cw-desc': 'عمل' };
      values[id] = '1,50000';
      if (method === 'unit') {
        values['cw-per'] = '4000';
        values['cw-unit'] = 'طوبة';
      }
      setFields(values);
      group(id);
      assert.equal(fields[id].value, '150,000', id);
      const before = store.agreements.length;
      UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
      assert.equal(store.agreements.length, before + 1, id);
      assert.equal(store.agreements[store.agreements.length - 1][key], 150000, id);
      begin(/** @type {'lump'|'unit'|'daily'|'milestone'} */ (method));
      const refused = { 'cw-desc': 'رفض' };
      refused[id] = '2,5';
      if (method === 'unit') {
        refused['cw-per'] = '4000';
        refused['cw-unit'] = 'طوبة';
      }
      setFields(refused);
      group(id);
      assert.equal(fields[id].value, '2,5', id);
      const held = store.agreements.length;
      UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
      assert.equal(store.agreements.length, held, id);
    }
    const view = begin('unit');
    const before = store.agreements.length;
    setFields({ 'cw-desc': 'لكل', 'cw-rate': '1000', 'cw-per': '2,5', 'cw-unit': 'طوبة' });
    group('cw-rate');
    const button = { id: 'act-new-agreement', disabled: false, dataset: {} };
    let paints = 0;
    view.render = () => {
      paints += 1;
    };
    UI.onClick(/** @type {any} */ (button));
    assert.equal(store.agreements.length, before);
    assert.equal(store.agreements.some(row => row.unitQty === 25), false);
    const html = view.views.contractor('new');
    assert.equal(html.includes('الكمية لازم رقم صحيح بدون كسور، مثل 25 أو 1,000'), true);
    assert.equal(html.includes('المبلغ ليس عدداً صحيحاً'), false);
    assert.equal(button.disabled, false);
    assert.equal(paints > 0, true);
  });
});

const QTY_SENTENCE = 'الكمية لازم رقم صحيح بدون كسور، مثل 25 أو 1,000';
const RANGE_SENTENCE = 'المبلغ ليس عدداً صحيحاً';

/**
 * @param {'qty' | 'days' | 'per'} box
 * @param {string} input
 * @returns {{ html: string, button: { disabled: boolean }, paints: number }}
 */
function saveQtyBox(box, input) {
  const view = install();
  let paints = 0;
  view.render = () => {
    paints += 1;
  };
  const id = brick().id;
  const button = {
    id: box === 'per' ? 'act-new-agreement' : 'act-labor-qty',
    disabled: false,
    dataset: {},
  };
  if (box === 'qty') {
    store.agreements = [Object.assign(brick(), { createdBy: 'u-ameer', deviceId: 'phone' })];
    view.views.contractor(id);
    setFields({ 'cw-qty': input });
  } else if (box === 'days') {
    store.agreements = [{
      id,
      method: 'daily',
      partyId: 'party-1',
      projectId: 'job',
      description: 'يوم',
      currency: 'IQD',
      dayRate: 1,
      createdBy: 'u-ameer',
      deviceId: 'phone',
    }];
    view.views.contractor(id);
    setFields({ 'cw-days': input });
  } else {
    store.parties = [{ id: 'party-1', name: 'حسن' }];
    view.views.contractor('');
    UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cparty: 'party-1' } }));
    UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cproj: 'job' } }));
    setFields({ 'cw-desc': 'لكل', 'cw-rate': '1000', 'cw-per': input, 'cw-unit': 'طوبة' });
  }
  paints = 0;
  UI.onClick(/** @type {any} */ (button));
  const html = box === 'per' ? view.views.contractor('new') : view.views.contractor(id);
  return { html, button, paints };
}

/** @type {Array<{ input: string, stored: number, boxes: Array<'qty' | 'days' | 'per'>, label?: string }>} */
const QTY_ACCEPTED = [
  { input: '25', stored: 25, boxes: ['qty', 'days', 'per'] },
  { input: '  25  ', stored: 25, boxes: ['qty', 'days', 'per'], label: 'trimmed 25' },
  { input: '8000', stored: 8000, boxes: ['qty', 'days'] },
  { input: '4000', stored: 4000, boxes: ['per'] },
  { input: '1,000', stored: 1000, boxes: ['qty', 'days', 'per'] },
  { input: '8,000', stored: 8000, boxes: ['qty', 'days', 'per'] },
  { input: '1,000,000', stored: 1000000, boxes: ['qty', 'days', 'per'] },
  { input: '2,500', stored: 2500, boxes: ['qty', 'days', 'per'] },
  { input: '٢٥', stored: 25, boxes: ['qty', 'days', 'per'] },
  { input: '١,٠٠٠', stored: 1000, boxes: ['qty', 'days', 'per'] },
  { input: '١٬٠٠٠', stored: 1000, boxes: ['qty', 'days', 'per'] },
  { input: '100000000', stored: 100000000, boxes: ['qty', 'days'] },
];

/** @type {Array<{ input: string, boxes: Array<'qty' | 'days' | 'per'>, label?: string }>} */
const QTY_REFUSED = [
  { input: '2,5', boxes: ['qty', 'days', 'per'] },
  { input: '1,50000', boxes: ['qty', 'days', 'per'] },
  { input: '1,00', boxes: ['qty', 'days', 'per'] },
  { input: '10,00,000', boxes: ['qty', 'days', 'per'] },
  { input: ',100', boxes: ['qty', 'days', 'per'] },
  { input: '100,', boxes: ['qty', 'days', 'per'] },
  { input: '1 000', boxes: ['qty', 'days', 'per'] },
  { input: '', boxes: ['qty', 'days', 'per'], label: 'empty' },
  { input: '   ', boxes: ['qty', 'days', 'per'], label: 'spaces' },
  { input: '2.5', boxes: ['qty', 'days', 'per'] },
  { input: '2٫5', boxes: ['qty', 'days', 'per'] },
  { input: '2،5', boxes: ['qty', 'days', 'per'] },
  { input: '1،000', boxes: ['qty', 'days', 'per'] },
  { input: '0', boxes: ['qty', 'days', 'per'] },
  { input: '100000001', boxes: ['qty', 'days'] },
  { input: '1000001', boxes: ['per'] },
];

for (const box of /** @type {Array<'qty' | 'days' | 'per'>} */ (['qty', 'days', 'per'])) {
  for (const row of QTY_ACCEPTED) {
    if (!row.boxes.includes(box)) continue;
    const label = row.label || row.input;
    test('cw-' + box + ' accepts ' + label, () => {
      reset();
      withStart('2026-11-22', () => {
        const saved = saveQtyBox(box, row.input);
        if (box === 'per') {
          assert.equal(store.agreements.length, 1);
          assert.equal(store.agreements[0].unitQty, row.stored);
        } else {
          const bodies = store.accountTxns.filter(item => item.purpose === 'laborQty');
          assert.equal(bodies.length, 1);
          assert.equal(bodies[0].qty, row.stored);
        }
        assert.equal(saved.html.includes(QTY_SENTENCE), false);
      });
    });
  }
  for (const row of QTY_REFUSED) {
    if (!row.boxes.includes(box)) continue;
    const label = row.label || row.input;
    test('cw-' + box + ' refuses ' + label, () => {
      reset();
      withStart('2026-11-22', () => {
        const saved = saveQtyBox(box, row.input);
        if (box === 'per') {
          assert.equal(store.agreements.length, 0);
          assert.equal(saved.button.disabled, false);
          assert.equal(saved.paints > 0, true);
        } else {
          assert.equal(store.accountTxns.filter(item => item.purpose === 'laborQty').length, 0);
        }
        assert.equal(saved.html.includes(QTY_SENTENCE), true);
        assert.equal(saved.html.includes(RANGE_SENTENCE), false);
      });
    });
  }
}

const COST_MINUS = '\u2212';
const N1 = 'المستحق للمقاولين';
const N2 = 'الكلفة الكلية';
const N3 = 'الربح = المقبوض ' + COST_MINUS + ' الكلفة الكلية (المصروف + المستحق للمقاولين)';
const N4 = 'سلف زايدة على المقاولين';
const OLD_PROFIT_NOTE = 'الربح = المقبوض ' + COST_MINUS + ' المصروف';

/**
 * @param {number} n
 */
function moneyHtml(n) {
  const sign = n < 0 ? COST_MINUS : '';
  return '<b class="num">' + sign + Math.abs(n).toLocaleString('en-US') + ' د.ع</b>';
}

/**
 * @param {string} id
 * @param {'income' | 'expense'} direction
 * @param {string} entryType
 * @param {number} amount
 */
function ledgerRow(id, direction, entryType, amount) {
  return {
    id,
    projectId: 'job',
    direction,
    entryType,
    amount,
    entryDate: '2026-11-01',
    isReversal: false,
    currency: 'IQD',
    description: 'قيد',
    createdBy: 'u-ameer',
  };
}

/**
 * @param {number} amount
 * @param {string} [day]
 * @returns {any[]}
 */
function screenApproval(amount, day) {
  const when = day || '2026-11-27';
  return [
    { id: 'm', purpose: 'laborQty', kind: 'body', projectId: 'job', partyId: 'party-1', txnDate: when, ledger: 'labor' },
    {
      id: 'appr', purpose: 'approveLabor', kind: 'appr', targetId: 'm', amount,
      projectId: 'job', partyId: 'party-1', txnDate: when, currency: 'IQD', ledger: 'labor',
    },
  ];
}

/**
 * @param {string} iso
 */
function baghdadDay(iso) {
  const ms = Date.parse(iso);
  class FakeDate extends Date {
    /**
     * @param {...*} args
     */
    constructor(...args) {
      super(args.length ? /** @type {number} */ (args[0]) : ms);
    }
    static now() { return ms; }
  }
  const context = {
    console,
    URLSearchParams,
    queueMicrotask,
    indexedDB: { open() { throw new Error('not used'); } },
    location: { search: '' },
    document: { querySelector() { return null; }, body: { dataset: {} } },
    navigator: { onLine: true },
    crypto: { randomUUID: () => 'uuid-from-test' },
    Ledger: { can() { return false; } },
    HTMLFormElement: function HTMLFormElement() {},
    HTMLInputElement: function HTMLInputElement() {},
    disposeFirebase() { return Promise.resolve(); },
    render() {},
    flushRemote() {},
    Date: FakeDate,
    Intl,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/session.js'), 'utf8'), context, { filename: 'session.js' });
  return context.today();
}

/** @type {(() => { disabled: boolean }) | null} */
let fireSaveSub = null;

function clickSaveSub() {
  if (fireSaveSub) return fireSaveSub();
  /** @type {Array<{ type: string, fn: (ev: any) => void }>} */
  const listeners = [];
  const values = {
    login: { hidden: true, value: '' },
    'sub-name': { value: 'مقاول' },
    'sub-work': { value: 'بناء' },
    'sub-amount': { value: '1500000' },
    shell: { hidden: true, value: '' },
  };
  const sandbox = {
    console,
    Ledger,
    Accounts,
    DomSafe,
    Sync,
    SyncStatus,
    K: g.K,
    get: (key, fallback) => g.get(key, fallback),
    set: (key, value) => g.set(key, value),
    me: () => g.me(),
    uuid: () => g.uuid(),
    today: () => g.today(),
    demoRole: () => '',
    queueDoc: (id) => g.queueDoc(id),
    deviceId: 'phone',
    flushRemote() {},
    prompt() { return null; },
    location: { hash: '#subnew/job' },
    document: {
      addEventListener(type, fn) { listeners.push({ type, fn }); },
      querySelector() { return null; },
      documentElement: { dir: 'rtl' },
      body: { dataset: {} },
    },
    navigator: { onLine: true },
    PeopleDir: { createLoader() { return {}; }, TIMEOUT_MS: 1, RENDER_ERROR: '' },
    withTimeout: (p) => p,
    ensureFirebase: () => Promise.resolve({ listUsers: () => Promise.resolve([]) }),
    $(sel) {
      const id = String(sel || '').replace(/^#/, '');
      return values[id] || { addEventListener() {}, hidden: true, value: '', textContent: '', classList: { toggle() {} } };
    },
    addEventListener() {},
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/render.js'), 'utf8'), sandbox, { filename: 'render.js' });
  const click = listeners.find(item => item.type === 'click');
  if (!click) throw new Error('missing click listener');
  fireSaveSub = () => {
    const button = {
      id: 'save-sub',
      disabled: false,
      dataset: {},
      closest(sel) { return sel === 'button' ? button : null; },
    };
    click.fn({ target: button, preventDefault() {} });
    return button;
  };
  return fireSaveSub();
}

test('SHIPPED hides the old form the day before and allows a save on the start day and the day after', () => {
  assert.equal(SHIPPED, '2026-11-27');
  for (const day of ['2026-11-26', '2026-11-27', '2026-11-28']) {
    reset();
    g.today = () => day;
    withStart(SHIPPED, () => {
      const open = day >= SHIPPED;
      assert.equal(page().project('job').includes('+ عقد مقاول'), false);
      const form = page().subnew('job');
      assert.equal(form.includes('العقد الجديد من شاشة مقاول'), true);
      assert.equal(form.includes('id="sub-name"'), false);
      const tabs = useTabs();
      Work.syncTab(g.me());
      assert.equal(tabs.children.some(el => el.dataset.tab === 'contractor'), open);
      store.parties = [{ id: 'party-1', name: 'حسن' }];
      const view = install();
      view.views.contractor('new');
      UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cparty: 'party-1' } }));
      UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cproj: 'job' } }));
      setFields({ 'cw-desc': 'طابوق', 'cw-rate': '300000', 'cw-per': '4000', 'cw-unit': 'طوبة' });
      UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
      assert.equal(store.agreements.length, open ? 1 : 0);
      if (!open) {
        store.agreements = [brick()];
        store.accountTxns = [{
          id: '11111111-2222-3333-4444-555555555555', purpose: 'laborQty', agreementId: brick().id,
          qty: 8000, projectId: 'job', partyId: 'party-1',
        }];
        const before = store.accountTxns.length;
        view.views.contractor(brick().id);
        setFields({ 'cw-qty': '8' });
        UI.onClick(/** @type {any} */ ({ id: 'act-labor-qty', disabled: false, dataset: {} }));
        UI.onClick(/** @type {any} */ ({ id: 'act-approve-labor', disabled: false, dataset: {} }));
        assert.equal(store.agreements.length, 1);
        assert.equal(store.accountTxns.length, before);
        assert.deepEqual(queued, []);
      }
    });
  }
});

test('the Baghdad clock opens مقاول at 21:00Z on 26 Nov and stays closed at 20:59Z', () => {
  assert.equal(SHIPPED, '2026-11-27');
  const closed = baghdadDay('2026-11-26T20:59:00Z');
  const opened = baghdadDay('2026-11-26T21:00:00Z');
  assert.equal(closed, '2026-11-26');
  assert.equal(opened, '2026-11-27');
  reset();
  withStart(SHIPPED, () => {
    g.today = () => closed;
    const shut = useTabs();
    Work.syncTab(g.me());
    assert.equal(shut.children.some(el => el.dataset.tab === 'contractor'), false);
    g.today = () => opened;
    const live = useTabs();
    Work.syncTab(g.me());
    assert.equal(live.children.some(el => el.dataset.tab === 'contractor'), true);
  });
});

test('a forced save-sub click appends nothing once the start is a date', () => {
  assert.equal(SHIPPED, '2026-11-27');
  reset();
  withStart(SHIPPED, () => {
    clickSaveSub();
    assert.equal(store.subcontracts.length, 0);
    assert.deepEqual(store.subcontractTerms, {});
    assert.deepEqual(store.outbox, []);
  });
});

test('T-C7 the two lines are on the owner project screen only', () => {
  assert.equal(SHIPPED, '2026-11-27');
  reset();
  store.entries = [ledgerRow('leg', 'expense', 'materials', 100000)];
  store.accountTxns = screenApproval(600000);
  const prev = g.me;
  try {
    withStart(SHIPPED, () => {
      const owner = page().project('job');
      assert.equal(owner.includes('<span>' + N1 + '</span>' + moneyHtml(600000)), true);
      assert.equal(owner.includes('<span>' + N2 + '</span>' + moneyHtml(700000)), true);
      g.me = () => ({ uid: 'u-site', role: 'site', active: true, displayName: 'أحمد', assignedProjectIds: ['job'] });
      const site = page().project('job');
      assert.equal(site.includes(N1), false);
      assert.equal(site.includes(N2), false);
      assert.equal(site.includes(N4), false);
      g.me = () => ({ uid: 'u-fore', role: 'foreman', active: true, displayName: 'فورمن' });
      const foreman = page().project('job');
      assert.equal(foreman.includes(N1), false);
      assert.equal(foreman.includes(N2), false);
      g.me = () => ({ uid: 'u-clerk', role: 'clerk', active: true, displayName: 'كاتب' });
      const clerk = page().project('job');
      assert.equal(clerk.includes(N1), false);
      assert.equal(clerk.includes(N2), false);
      g.me = prev;
      const home = page().home();
      const list = page().projects();
      assert.equal(home.includes(N1), false);
      assert.equal(home.includes(N2), false);
      assert.equal(home.includes(N4), false);
      assert.equal(list.includes(N1), false);
      assert.equal(list.includes(N2), false);
      assert.equal(list.includes(N4), false);
    });
  } finally {
    g.me = prev;
  }
});

test('T-C9 a negative due uses the advance label and a positive total', () => {
  assert.equal(SHIPPED, '2026-11-27');
  reset();
  store.accountTxns = screenApproval(300000).concat([{
    id: 'adv', purpose: 'advanceLabor', amount: 400000, projectId: 'job', partyId: 'party-1',
    txnDate: '2026-11-27', currency: 'IQD', ledger: 'labor',
  }]);
  withStart(SHIPPED, () => {
    const html = page().project('job');
    assert.equal(html.includes('<span>' + N4 + '</span>' + moneyHtml(100000)), true);
    assert.equal(html.includes(COST_MINUS + '100,000'), false);
    assert.equal(html.includes('<span>' + N1 + '</span>'), false);
    assert.equal(html.includes('<span>' + N2 + '</span>' + moneyHtml(300000)), true);
    store.accountTxns = screenApproval(500000).concat([{
      id: 'adv', purpose: 'advanceLabor', amount: 400000, projectId: 'job', partyId: 'party-1',
      txnDate: '2026-11-27', currency: 'IQD', ledger: 'labor',
    }]);
    const owed = page().project('job');
    assert.equal(owed.includes('<span>' + N1 + '</span>' + moneyHtml(100000)), true);
    assert.equal(owed.includes(N4), false);
    store.accountTxns = screenApproval(400000).concat([{
      id: 'adv', purpose: 'advanceLabor', amount: 400000, projectId: 'job', partyId: 'party-1',
      txnDate: '2026-11-27', currency: 'IQD', ledger: 'labor',
    }]);
    const zero = page().project('job');
    assert.equal(zero.includes('<span>' + N1 + '</span>' + moneyHtml(0)), true);
    assert.equal(zero.includes(N4), false);
  });
});

test('T-C10 the owner project screen uses the shipped cash basis', () => {
  assert.equal(SHIPPED, '2026-11-27');
  reset();
  g.today = () => '2026-11-27';
  store.entries = [ledgerRow('leg', 'expense', 'materials', 100000)];
  store.accountTxns = screenApproval(600000).concat([{
    id: 'pay', purpose: 'payLabor', amount: 250000, projectId: 'job', partyId: 'party-1',
    txnDate: '2026-11-27', currency: 'IQD', ledger: 'labor',
  }]);
  withStart(SHIPPED, () => {
    const html = page().project('job');
    assert.equal(html.includes('<span>المصروف</span>' + moneyHtml(350000)), true);
    assert.equal(html.includes('<span>' + N1 + '</span>' + moneyHtml(350000)), true);
    assert.equal(html.includes('<span>' + N2 + '</span>' + moneyHtml(700000)), true);
  });
});

test('T-C12 profit on the three owner screens uses الكلفة الكلية and the project note is N3', () => {
  assert.equal(SHIPPED, '2026-11-27');
  reset();
  store.entries = [
    ledgerRow('in', 'income', 'clientPayment', 1000000),
    ledgerRow('leg', 'expense', 'materials', 100000),
  ];
  store.accountTxns = screenApproval(600000).concat([{
    id: 'pay', purpose: 'payLabor', amount: 250000, projectId: 'job', partyId: 'party-1',
    txnDate: '2026-11-27', currency: 'IQD', ledger: 'labor',
  }]);
  withStart(SHIPPED, () => {
    const project = page().project('job');
    assert.equal(project.includes('<span>المصروف</span>' + moneyHtml(350000)), true);
    assert.equal(project.includes('<span>' + N1 + '</span>' + moneyHtml(350000)), true);
    assert.equal(project.includes('<span>' + N2 + '</span>' + moneyHtml(700000)), true);
    assert.equal(project.includes('<span>الربح</span><span class="ok">' + moneyHtml(300000) + '</span>'), true);
    assert.equal(project.includes(N3), true);
    assert.equal(project.includes(OLD_PROFIT_NOTE), false);
    assert.equal(project.split(N3).length - 1, 1);
    const list = page().projects();
    assert.equal(list.includes('<span>ربح</span><span class="ok">' + moneyHtml(300000) + '</span>'), true);
    const home = page().home();
    assert.equal(home.includes('<span>إجمالي المصروف</span>' + moneyHtml(350000)), true);
    assert.equal(home.includes('<span>صافي الربح</span><span class="ok">' + moneyHtml(300000) + '</span>'), true);
    store.entries = [
      ledgerRow('in', 'income', 'clientPayment', 600000),
      ledgerRow('leg', 'expense', 'materials', 100000),
    ];
    const lossProject = page().project('job');
    assert.equal(lossProject.includes('<span>الربح</span><span class="bad">' + moneyHtml(-100000) + '</span>'), true);
    const lossList = page().projects();
    assert.equal(lossList.includes('<span>خسارة</span><span class="bad">' + moneyHtml(100000) + '</span>'), true);
  });
});

test('T-C12n home and the projects list do not show the profit note', () => {
  assert.equal(SHIPPED, '2026-11-27');
  reset();
  store.entries = [
    ledgerRow('in', 'income', 'clientPayment', 1000000),
    ledgerRow('leg', 'expense', 'materials', 100000),
  ];
  store.accountTxns = screenApproval(600000).concat([{
    id: 'pay', purpose: 'payLabor', amount: 250000, projectId: 'job', partyId: 'party-1',
    txnDate: '2026-11-27', currency: 'IQD', ledger: 'labor',
  }]);
  withStart(SHIPPED, () => {
    const home = page().home();
    const at = home.indexOf('صافي الربح');
    assert.ok(at >= 0);
    assert.equal(home.includes(N3), false);
    assert.equal(home.slice(at).includes('<div class="note">'), false);
    assert.equal(page().projects().includes(N3), false);
    assert.equal(page().project('job').split(N3).length - 1, 1);
  });
});

/**
 * @param {ReturnType<typeof install>} view
 */
function followHash(view) {
  const prev = g.location;
  g.location = { hash: '#contractor' };
  /** @type {string} */
  let html = '';
  view.render = () => {
    const parts = String(g.location.hash || '').replace(/^#/, '').split('/');
    if (parts[0] === 'contractor') html = view.views.contractor(parts[1] || '');
  };
  return {
    html: () => html,
    restore() {
      if (prev === undefined) delete g.location;
      else g.location = prev;
    },
  };
}

function pillLit(html, attr, value) {
  return html.includes('class="pill on" ' + attr + '="' + value + '"');
}

function fillAgreement(desc) {
  UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cparty: 'party-1' } }));
  UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cproj: 'job' } }));
  setFields({ 'cw-desc': desc, 'cw-rate': '300000', 'cw-per': '4000', 'cw-unit': 'طوبة' });
}

test('a new agreement drops the previous party and project', () => {
  reset();
  withStart('2026-11-01', () => {
    store.parties = [{ id: 'party-1', name: 'حسن' }, { id: 'party-2', name: 'علي' }];
    const view = install();
    const nav = followHash(view);
    try {
      view.views.contractor('');
      UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
      fillAgreement('طابوق');
      UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
      UI.onClick(/** @type {any} */ ({ id: 'back-contractor', disabled: false, dataset: {} }));
      UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
      const html = nav.html();
      assert.equal(pillLit(html, 'data-cparty', 'party-1'), false);
      assert.equal(pillLit(html, 'data-cparty', 'party-2'), false);
      assert.equal(pillLit(html, 'data-cproj', 'job'), false);
      assert.equal(pillLit(html, 'data-cmethod', 'unit'), true);
      assert.equal(pillLit(html, 'data-cmethod', 'lump'), false);
    } finally {
      nav.restore();
    }
  });
});

test('رجوع clears a picked party and project', () => {
  reset();
  withStart('2026-11-01', () => {
    store.parties = [{ id: 'party-1', name: 'حسن' }];
    const view = install();
    const nav = followHash(view);
    try {
      view.views.contractor('');
      UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
      UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cparty: 'party-1' } }));
      UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { cproj: 'job' } }));
      assert.equal(pillLit(nav.html(), 'data-cparty', 'party-1'), true);
      assert.equal(pillLit(nav.html(), 'data-cproj', 'job'), true);
      UI.onClick(/** @type {any} */ ({ id: 'back-contractor', disabled: false, dataset: {} }));
      UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
      const html = nav.html();
      assert.equal(pillLit(html, 'data-cparty', 'party-1'), false);
      assert.equal(pillLit(html, 'data-cproj', 'job'), false);
      assert.equal(pillLit(html, 'data-cmethod', 'unit'), true);
    } finally {
      nav.restore();
    }
  });
});

test('opening #contractor/new after a save queues a second agreement', () => {
  reset();
  withStart('2026-11-01', () => {
    store.parties = [{ id: 'party-1', name: 'حسن' }];
    const view = install();
    const nav = followHash(view);
    try {
      view.views.contractor('');
      UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
      fillAgreement('طابوق');
      UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
      assert.equal(store.agreements.length, 1);
      g.location.hash = '#contractor/new';
      view.render();
      fillAgreement('رمل');
      UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
      assert.equal(store.agreements.length, 2);
      assert.equal(store.agreements[0].id === store.agreements[1].id, false);
      assert.equal(queued.length, 2);
      assert.equal(queued.includes(store.agreements[0].id), true);
      assert.equal(queued.includes(store.agreements[1].id), true);
    } finally {
      nav.restore();
    }
  });
});
