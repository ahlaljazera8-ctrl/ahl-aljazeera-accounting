const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
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
    assert.equal(screen.includes('بسعر الوحدة'), true);
    assert.equal(screen.includes(Work.pendingAmeer.unitByProgress), false);
  });
  assert.equal(Accounts.CONTRACTOR_COST_START, null);
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
    assert.equal(view.views.contractor(id).includes('المبلغ ليس عدداً صحيحاً'), true);
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
    assert.equal(view.views.contractor(id).includes('المبلغ ليس عدداً صحيحاً'), true);
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

test('the source binding stays null', () => {
  reset();
  const src = fs.readFileSync(path.join(ROOT, 'public/accounts.js'), 'utf8');
  assert.match(src, /const CONTRACTOR_COST_START = null;/);
  assert.equal(Accounts.CONTRACTOR_COST_START, null);
  assert.equal(Work.pendingAmeer.unitByProgress, 'حسب الإنجاز (الكمية × سعر الوحدة)');
  assert.equal(Work.pendingAmeer.newContract, 'العقد الجديد من شاشة مقاول');
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
    begin('unit');
    setFields({ 'cw-desc': 'لكل', 'cw-rate': '1000', 'cw-per': '2,5', 'cw-unit': 'طوبة' });
    group('cw-rate');
    UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
    const per = store.agreements[store.agreements.length - 1];
    assert.equal(per.unitRate, 1000);
    assert.equal(per.unitQty, 25);
  });
});
