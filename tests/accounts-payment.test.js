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
  refusedLinks: /** @type {any} */ (null),
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
  refusedLinks: 'refusedLinks',
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
g.document = {
  querySelector: sel => {
    const id = String(sel || '').replace('#', '');
    return fields[id] || null;
  },
  createElement: () => ({}),
  createElementNS: () => ({}),
};

const UI = require('../public/accounts-view.js');
g.AccountsView = UI;
const Work = require('../public/accounts-work.js');
const Pay = require('../public/accounts-payment.js');

const AG = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const BODY = '11111111-2222-3333-4444-555555555555';
const PAY_ID = 'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee';
const ADV_ID = 'cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee';
const ACTS = ['act-pay-labor', 'act-advance-labor', 'act-return-advance', 'act-refund-labor', 'act-review-cash'];
const Q19 = 'المُرجَع والتسوية أكبر من السلفة';
const CASH_KEYS = ['id', 'kind', 'purpose', 'projectId', 'partyId', 'ledger', 'currency', 'fxRate', 'amount', 'txnDate', 'description', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'];
const POINTER_KEYS = ['id', 'kind', 'purpose', 'projectId', 'partyId', 'ledger', 'currency', 'fxRate', 'amount', 'targetId', 'txnDate', 'description', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'];
const REVW_KEYS = ['id', 'kind', 'purpose', 'ledger', 'projectId', 'partyId', 'currency', 'fxRate', 'targetId', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'];

function reset() {
  seq = 0;
  queued = [];
  fields = {};
  store.parties = [{ id: 'party-1', name: 'حسن' }];
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
  store.refusedLinks = null;
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

function installBoth() {
  const next = api();
  Work.install(next);
  Pay.install(next);
  return next;
}

/**
 * @param {string} id
 * @param {Record<string, string>} [dataset]
 */
function click(id, dataset) {
  const button = { id, disabled: false, dataset: dataset || {} };
  UI.onClick(/** @type {any} */ (button));
  return button;
}

/**
 * @param {number} [amount]
 */
function seedApproval(amount) {
  store.agreements = [{
    id: AG,
    partyId: 'party-1',
    projectId: 'job',
    method: 'unit',
    description: 'طابوق',
    currency: 'IQD',
  }];
  store.accountTxns = [
    { id: BODY, purpose: 'laborQty', kind: 'body', partyId: 'party-1', projectId: 'job', ledger: 'labor', qty: 8000 },
    {
      id: 'appr_' + BODY,
      purpose: 'approveLabor',
      kind: 'appr',
      targetId: BODY,
      amount: amount == null ? 600000 : amount,
      partyId: 'party-1',
      projectId: 'job',
      ledger: 'labor',
      txnDate: '2026-11-22',
      currency: 'IQD',
      fxRate: 1,
    },
  ];
}

/**
 * @param {string} id
 * @param {'payLabor' | 'advanceLabor'} purpose
 * @param {number} amount
 */
function cashRow(id, purpose, amount) {
  return {
    id,
    docType: 'accountTxn',
    purpose,
    kind: 'body',
    amount,
    partyId: 'party-1',
    projectId: 'job',
    ledger: 'labor',
    currency: 'IQD',
    fxRate: 1,
    txnDate: '2026-11-22',
  };
}

/**
 * @param {string} html
 */
function preview(html) {
  const start = html.indexOf('id="cp-preview"');
  const end = html.indexOf('id="cp-purpose"');
  assert.equal(start >= 0 && end > start, true);
  return html.slice(start, end);
}

/**
 * @param {string} purpose
 */
function rowsOf(purpose) {
  return store.accountTxns.filter(row => row && row.purpose === purpose);
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
  assert.equal(Object.prototype.hasOwnProperty.call(doc, 'paidAs'), false);
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
    $() {
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

function school() {
  store.projects = [{ id: 'p-school', name: 'مجمع المدرسة', status: 'active', currency: 'IQD' }];
  store.subcontracts = [{ id: 'sc-1', projectId: 'p-school', name: 'مقاول السباكة', work: 'تمديد شبكة الماء', agreedOn: '2026-10-01' }];
  store.subcontractTerms = { 'sc-1': { originalAmount: 1500000 } };
  store.entries = [];
}

function header(extra) {
  return Object.assign({
    projectId: 'job',
    partyId: 'party-1',
    createdBy: 'u-ameer',
    createdByName: 'أمير',
    deviceId: 'phone',
    currency: 'IQD',
    fxRate: 1,
  }, extra);
}

test('two payLabor documents stay inside the remaining approved work', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    const view = installBoth();
    view.views.contractor(AG);
    setFields({ 'cp-amount': '400000' });
    click('act-pay-labor');
    view.views.contractor('');
    view.views.contractor(AG);
    setFields({ 'cp-amount': '200000' });
    click('act-pay-labor');
    const pays = rowsOf('payLabor');
    assert.equal(pays.length, 2);
    assert.equal(pays[0].amount, 400000);
    assert.equal(pays[1].amount, 200000);
    assert.notEqual(pays[0].id, pays[1].id);
    for (const row of pays) {
      assert.deepEqual(row.effect, { cost: 0, person: -1, cash: 1 });
    }
    assert.equal(rowsOf('advanceLabor').length, 0);
  });
});

test('a payment above approved work previews the split before it is saved', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    const before = store.accountTxns.map(row => row.id);
    const view = installBoth();
    view.views.contractor(AG);
    setFields({ 'cp-amount': '700000' });
    const html = view.views.contractor(AG);
    const shown = preview(html);
    assert.equal(shown.includes('عن عمل معتمد'), true);
    assert.equal(shown.includes('سلفة'), true);
    assert.equal(shown.includes('600,000'), true);
    assert.equal(shown.includes('100,000'), true);
    assert.equal(shown.includes('سلفة، ليست مصروفاً.'), true);
    assert.equal(shown.split('سلفة، ليست مصروفاً.').length, 2);
    assert.equal(shown.includes('السلفة ليست مصروفاً'), false);
    assert.equal(html.includes('الرصيد:'), false);
    assert.equal(html.includes('(سلفة)'), false);
    assert.equal(html.includes('المتبقي سلفة'), false);
    assert.equal(shown.includes('\u2212'), false);
    assert.equal(html.includes('\u2212'), false);
    assert.deepEqual(store.accountTxns.map(row => row.id), before);
    click('act-pay-labor');
    const pay = rowsOf('payLabor');
    const advance = rowsOf('advanceLabor');
    assert.equal(pay.length, 1);
    assert.equal(advance.length, 1);
    assert.equal(pay[0].amount, 600000);
    assert.equal(advance[0].amount, 100000);
    assert.equal(pay[0].partyId, advance[0].partyId);
  });
});

test('an existing advance lowers the approved-unpaid preview', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    store.accountTxns.push(cashRow(ADV_ID, 'advanceLabor', 100000));
    const view = installBoth();
    view.views.contractor(AG);
    setFields({ 'cp-amount': '600000' });
    const shown = preview(view.views.contractor(AG));
    assert.equal(shown.includes('عن عمل معتمد'), true);
    assert.equal(shown.includes('500,000'), true);
    assert.equal(shown.includes('سلفة'), true);
    assert.equal(shown.includes('100,000'), true);
  });
});

test('a payment inside approved work is one payLabor and the preview has no سلفة', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    const view = installBoth();
    view.views.contractor(AG);
    setFields({ 'cp-amount': '600000' });
    const html = view.views.contractor(AG);
    const shown = preview(html);
    assert.equal(shown.includes('سلفة'), false);
    assert.equal(shown.includes('سلفة، ليست مصروفاً.'), false);
    assert.equal(shown.includes('السلفة ليست مصروفاً'), false);
    assert.equal(shown.includes('عن عمل معتمد'), true);
    click('act-pay-labor');
    assert.equal(rowsOf('payLabor').length, 1);
    assert.equal(rowsOf('payLabor')[0].amount, 600000);
    assert.equal(rowsOf('advanceLabor').length, 0);
  });
});

test('approved-unpaid of zero previews the whole amount as سلفة', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(0);
    const view = installBoth();
    view.views.contractor(AG);
    setFields({ 'cp-amount': '100000' });
    const shown = preview(view.views.contractor(AG));
    assert.equal(shown.includes('سلفة'), true);
    assert.equal(shown.includes('100,000'), true);
    assert.equal(shown.includes('عن عمل معتمد'), false);
    click('act-advance-labor');
    assert.equal(rowsOf('advanceLabor').length, 1);
    assert.equal(rowsOf('advanceLabor')[0].amount, 100000);
    assert.equal(rowsOf('payLabor').length, 0);
  });
});

test('the payment form keeps its two ids and a second tap does not save', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    const view = installBoth();
    view.views.contractor(AG);
    const mint = g.uuid;
    g.uuid = () => { throw new Error('minted again'); };
    view.views.contractor(AG);
    g.uuid = mint;
    setFields({ 'cp-amount': '700000' });
    const button = { id: 'act-pay-labor', disabled: false, dataset: {} };
    let disabledDuring = false;
    let posts = 0;
    const origSet = g.set;
    const origPost = Accounts.post;
    g.set = (key, value) => {
      if (key === 'accountTxns') disabledDuring = button.disabled === true;
      return origSet(key, value);
    };
    Accounts.post = (action, input) => {
      posts += 1;
      return origPost(action, input);
    };
    UI.onClick(/** @type {any} */ (button));
    const after = posts;
    UI.onClick(/** @type {any} */ (button));
    g.set = origSet;
    Accounts.post = origPost;
    assert.equal(disabledDuring, true);
    assert.equal(posts, after);
    assert.equal(rowsOf('payLabor').length, 1);
    assert.equal(rowsOf('advanceLabor').length, 1);
  });
});

test('cash txnDate is the Baghdad day at 2026-12-01T21:30:00Z', () => {
  reset();
  seedApproval(600000);
  store.accountTxns.push(cashRow(PAY_ID, 'payLabor', 600000));
  store.accountTxns.push(cashRow(ADV_ID, 'advanceLabor', 100000));
  const at = Date.parse('2026-12-01T21:30:00Z');
  const RealDate = Date;
  class FixedDate extends RealDate {
    /** @param {number} [ms] */
    constructor(ms) {
      if (arguments.length === 0) super(at);
      else super(/** @type {number} */ (ms));
    }
    static now() { return at; }
  }
  g.Date = FixedDate;
  g.today = () => {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Baghdad',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = fmt.formatToParts(new Date(Date.now()));
    const pick = type => {
      const part = parts.find(item => item.type === type);
      return part ? part.value : '';
    };
    return pick('year') + '-' + pick('month') + '-' + pick('day');
  };
  try {
    assert.equal(Date.now(), at);
    assert.equal(new Date().toISOString().slice(0, 10), '2026-12-01');
    assert.equal(g.today(), '2026-12-02');
    /** @type {Array<'payLabor' | 'advanceLabor' | 'returnAdvance' | 'refundLabor'>} */
    const purposes = ['payLabor', 'advanceLabor', 'returnAdvance', 'refundLabor'];
    for (const purpose of purposes) {
      const targetId = purpose === 'returnAdvance' ? ADV_ID : purpose === 'refundLabor' ? PAY_ID : '';
      const built = Pay.cashDoc(purpose, header({
        id: 'dddddddd-bbbb-cccc-dddd-' + purpose,
        amount: 10,
        targetId,
        txnDate: '1999-01-01',
      }));
      const doc = /** @type {any} */ (built.doc);
      assert.equal(built.errors.length, 0, purpose);
      assert.equal(doc.txnDate, '2026-12-02');
      assert.equal(Object.prototype.hasOwnProperty.call(doc, 'paidAs'), false);
      assert.equal(Object.prototype.hasOwnProperty.call(doc, 'createdAtDevice'), false);
    }
    const review = Pay.reviewDoc(header({ targetId: PAY_ID, txnDate: '2026-12-02' }));
    const reviewed = /** @type {any} */ (review.doc);
    assert.equal(Object.prototype.hasOwnProperty.call(reviewed, 'txnDate'), false);
  } finally {
    g.Date = RealDate;
    g.today = () => '2026-11-22';
  }
});

test('a bad amount appends nothing and paints المبلغ ليس عدداً صحيحاً', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    store.accountTxns.push(cashRow(PAY_ID, 'payLabor', 600000));
    store.accountTxns.push(cashRow(ADV_ID, 'advanceLabor', 100000));
    const bad = ['', '0', '-1', '1.5', 'abc', '10000000001'];
    const view = installBoth();
    for (const value of bad) {
      const before = store.accountTxns.length;
      view.views.contractor('');
      view.views.contractor(AG);
      setFields({ 'cp-amount': value });
      click('act-pay-labor');
      const html = view.views.contractor(AG);
      assert.equal(store.accountTxns.length, before, value);
      assert.equal(html.includes('المبلغ ليس عدداً صحيحاً'), true, value);
    }
    for (const value of bad) {
      const before = store.accountTxns.length;
      view.views.contractor('');
      view.views.contractor(AG);
      click('', { ctarget: ADV_ID, cpurpose: 'returnAdvance' });
      setFields({ 'cp-return': value });
      click('act-return-advance');
      const html = view.views.contractor(AG);
      assert.equal(store.accountTxns.length, before, 'return ' + value);
      assert.equal(html.includes('المبلغ ليس عدداً صحيحاً'), true, 'return ' + value);
    }
    for (const value of bad) {
      const before = store.accountTxns.length;
      view.views.contractor('');
      view.views.contractor(AG);
      click('', { ctarget: PAY_ID, cpurpose: 'refundLabor' });
      setFields({ 'cp-refund': value });
      click('act-refund-labor');
      const html = view.views.contractor(AG);
      assert.equal(store.accountTxns.length, before, 'refund ' + value);
      assert.equal(html.includes('المبلغ ليس عدداً صحيحاً'), true, 'refund ' + value);
    }
  });
});

test('a missing, unknown, or wrong-purpose target appends nothing', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    store.accountTxns.push(cashRow(PAY_ID, 'payLabor', 600000));
    store.accountTxns.push(cashRow(ADV_ID, 'advanceLabor', 100000));
    const missing = Pay.cashDoc('refundLabor', header({ id: 'r1', amount: 10 }));
    const unknown = Pay.cashDoc('refundLabor', header({ id: 'r2', amount: 10, targetId: 'no-such' }));
    const wrongRefund = Pay.cashDoc('refundLabor', header({ id: 'r3', amount: 10, targetId: ADV_ID }));
    const wrongReturn = Pay.cashDoc('returnAdvance', header({ id: 'r4', amount: 10, targetId: PAY_ID }));
    for (const built of [missing, unknown, wrongRefund, wrongReturn]) {
      assert.equal(built.doc, null);
      assert.equal(built.errors.includes('targetId'), true);
    }
    const before = store.accountTxns.length;
    const view = installBoth();
    const html = view.views.contractor(AG);
    assert.equal(html.includes('id="act-return-advance" disabled'), true);
    assert.equal(html.includes('id="act-refund-labor" disabled'), true);
    click('act-return-advance');
    click('act-refund-labor');
    assert.equal(store.accountTxns.length, before);
    const after = view.views.contractor(AG);
    assert.equal(after.includes(Q19), false);
    assert.equal(after.includes('المبلغ ليس عدداً صحيحاً'), false);
  });
});

test('returnAdvance stays inside the advance and paints Q19 when it is over', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    store.accountTxns.push(cashRow(ADV_ID, 'advanceLabor', 100000));
    const view = installBoth();
    view.views.contractor(AG);
    click('', { ctarget: ADV_ID, cpurpose: 'returnAdvance' });
    setFields({ 'cp-return': '30000' });
    click('act-return-advance');
    const row = rowsOf('returnAdvance')[0];
    assert.equal(row.amount, 30000);
    assert.deepEqual(row.effect, { cost: 0, person: 1, cash: -1 });
    const saved = view.views.contractor(AG);
    assert.equal(saved.includes(Q19), false);
    const over = Pay.cashDoc('returnAdvance', header({ id: 'r-over', amount: 100001, targetId: ADV_ID }));
    assert.equal(over.doc, null);
    assert.equal(over.errors.includes('cap'), true);
    view.views.contractor('');
    view.views.contractor(AG);
    click('', { ctarget: ADV_ID, cpurpose: 'returnAdvance' });
    setFields({ 'cp-return': '100001' });
    const before = store.accountTxns.length;
    click('act-return-advance');
    const html = view.views.contractor(AG);
    assert.equal(store.accountTxns.length, before);
    assert.equal(html.includes(Q19), true);
    const cumulative = Pay.cashDoc('returnAdvance', header({ id: 'r-cum', amount: 70001, targetId: ADV_ID }));
    assert.equal(cumulative.doc, null);
    assert.equal(cumulative.errors.includes('cumulative'), true);
    view.views.contractor('');
    view.views.contractor(AG);
    click('', { ctarget: ADV_ID, cpurpose: 'returnAdvance' });
    setFields({ 'cp-return': '70001' });
    const beforeCumulative = store.accountTxns.length;
    click('act-return-advance');
    const cumulativeHtml = view.views.contractor(AG);
    assert.equal(store.accountTxns.length, beforeCumulative);
    assert.equal(cumulativeHtml.includes(Q19), true);
  });
});

test('refundLabor paints المُرجَع أكبر من الدفعة when the payment is crossed', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    store.accountTxns.push(cashRow(PAY_ID, 'payLabor', 600000));
    const view = installBoth();
    view.views.contractor(AG);
    click('', { ctarget: PAY_ID, cpurpose: 'refundLabor' });
    setFields({ 'cp-refund': '50000' });
    click('act-refund-labor');
    const row = rowsOf('refundLabor')[0];
    assert.equal(row.amount, 50000);
    assert.equal(row.targetId, PAY_ID);
    assert.deepEqual(row.effect, { cost: 0, person: 1, cash: -1 });
    const cap = Pay.cashDoc('refundLabor', header({ id: 'rf-cap', amount: 600001, targetId: PAY_ID }));
    assert.equal(cap.doc, null);
    assert.equal(cap.errors.includes('cap'), true);
    view.views.contractor('');
    view.views.contractor(AG);
    click('', { ctarget: PAY_ID, cpurpose: 'refundLabor' });
    setFields({ 'cp-refund': '600001' });
    const beforeCap = store.accountTxns.length;
    click('act-refund-labor');
    assert.equal(store.accountTxns.length, beforeCap);
    assert.equal(view.views.contractor(AG).includes('المُرجَع أكبر من الدفعة'), true);
    store.accountTxns.push({
      id: 'rf-400',
      purpose: 'refundLabor',
      kind: 'body',
      amount: 400000,
      targetId: PAY_ID,
      partyId: 'party-1',
      projectId: 'job',
      ledger: 'labor',
    });
    const crossed = Pay.cashDoc('refundLabor', header({ id: 'rf-cross', amount: 300000, targetId: PAY_ID }));
    assert.equal(crossed.doc, null);
    assert.equal(crossed.errors.includes('cumulative'), true);
    view.views.contractor('');
    view.views.contractor(AG);
    click('', { ctarget: PAY_ID, cpurpose: 'refundLabor' });
    setFields({ 'cp-refund': '300000' });
    const before = store.accountTxns.length;
    click('act-refund-labor');
    assert.equal(store.accountTxns.length, before);
    assert.equal(view.views.contractor(AG).includes('المُرجَع أكبر من الدفعة'), true);
  });
});

test('reviewDoc has no amount and the next mark carries generation 1', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    store.accountTxns.push(cashRow(PAY_ID, 'payLabor', 600000));
    const first = Pay.reviewDoc(header({ targetId: PAY_ID, txnDate: '2026-11-01', amount: 5 }));
    const doc = /** @type {any} */ (first.doc);
    assert.equal(doc.id, 'revw_' + PAY_ID);
    assert.equal(Object.prototype.hasOwnProperty.call(doc, 'amount'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(doc, 'txnDate'), false);
    assert.deepEqual(doc.effect, { cost: 0, person: 0, cash: 0 });
    store.accountTxns.push(doc);
    const second = Pay.reviewDoc(header({ targetId: PAY_ID }));
    assert.equal(second.doc, null);
    store.accountTxns.push({ id: 'rev_' + doc.id, kind: 'rev', reversesId: doc.id });
    const next = Pay.reviewDoc(header({ targetId: PAY_ID, generation: '1' }));
    assert.equal(/** @type {any} */ (next.doc).id, 'revw_' + PAY_ID + '_1');
    const view = installBoth();
    const html = view.views.contractor(AG);
    assert.equal(html.includes('act-review-cash'), true);
    click('act-review-cash', { creview: PAY_ID });
    assert.equal(store.accountTxns.some(row => row.id === 'revw_' + PAY_ID + '_1'), true);
  });
});

test('a payLabor in syncErrors is not offered for a refund', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    store.accountTxns.push(cashRow(PAY_ID, 'payLabor', 600000));
    store.syncErrors = { [PAY_ID]: 'رُفض الإرسال' };
    const view = installBoth();
    const html = view.views.contractor(AG);
    assert.equal(html.includes('data-ctarget="' + PAY_ID + '"'), false);
    assert.equal(html.includes('id="act-refund-labor" disabled'), true);
    const before = store.accountTxns.length;
    click('act-refund-labor');
    assert.equal(store.accountTxns.length, before);
  });
});

test('a refund against a reversed payLabor appends nothing', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    store.accountTxns.push(cashRow(PAY_ID, 'payLabor', 600000));
    store.accountTxns.push({ id: 'rev_' + PAY_ID, kind: 'rev', reversesId: PAY_ID });
    const view = installBoth();
    const html = view.views.contractor(AG);
    assert.equal(html.includes('data-ctarget="' + PAY_ID + '"'), false);
    assert.equal(html.includes('id="act-refund-labor" disabled'), true);
    const before = store.accountTxns.length;
    click('act-refund-labor');
    assert.equal(store.accountTxns.length, before);
  });
});

test('a return against a reversed advance appends nothing', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    store.accountTxns.push(cashRow(ADV_ID, 'advanceLabor', 100000));
    store.accountTxns.push({ id: 'rev_' + ADV_ID, kind: 'rev', reversesId: ADV_ID });
    const view = installBoth();
    const html = view.views.contractor(AG);
    assert.equal(html.includes('data-ctarget="' + ADV_ID + '"'), false);
    assert.equal(html.includes('id="act-return-advance" disabled'), true);
    const before = store.accountTxns.length;
    click('act-return-advance');
    assert.equal(store.accountTxns.length, before);
  });
});

test('review-cash skips a refused row and a reversed row', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    store.accountTxns.push(cashRow(PAY_ID, 'payLabor', 600000));
    store.syncErrors = { [PAY_ID]: 'رُفض الإرسال' };
    const view = installBoth();
    let html = view.views.contractor(AG);
    assert.equal(html.includes('act-review-cash'), false);
    click('act-review-cash', { creview: PAY_ID });
    assert.equal(store.accountTxns.some(row => String(row.id).indexOf('revw_') === 0), false);
    store.syncErrors = {};
    store.accountTxns.push({ id: 'rev_' + PAY_ID, kind: 'rev', reversesId: PAY_ID });
    html = view.views.contractor(AG);
    assert.equal(html.includes('act-review-cash'), false);
    const before = store.accountTxns.length;
    click('act-review-cash', { creview: PAY_ID });
    assert.equal(store.accountTxns.length, before);
  });
});

test('a null start renders no payment blocks and appends nothing', () => {
  reset();
  seedApproval(600000);
  store.accountTxns.push(cashRow(PAY_ID, 'payLabor', 600000));
  store.accountTxns.push(cashRow(ADV_ID, 'advanceLabor', 100000));
  const view = installBoth();
  const html = view.views.contractor(AG);
  assert.equal(html.includes('تسجيل دفعة'), false);
  for (const id of ACTS) assert.equal(html.includes(id), false, id);
  const before = store.accountTxns.length;
  click('act-pay-labor');
  click('act-return-advance');
  click('act-refund-labor');
  click('act-review-cash', { creview: PAY_ID });
  assert.equal(store.accountTxns.length, before);
  assert.deepEqual(queued, []);
  school();
  assert.equal(page().project('p-school').includes('+ عقد مقاول'), true);
  assert.equal(Accounts.CONTRACTOR_COST_START, null);
});

test('a start after today renders no payment blocks and appends nothing', () => {
  reset();
  withStart('2026-11-23', () => {
    seedApproval(600000);
    store.accountTxns.push(cashRow(PAY_ID, 'payLabor', 600000));
    store.accountTxns.push(cashRow(ADV_ID, 'advanceLabor', 100000));
    const view = installBoth();
    const html = view.views.contractor(AG);
    assert.equal(html.includes('تسجيل دفعة'), false);
    for (const id of ACTS) assert.equal(html.includes(id), false, id);
    const before = store.accountTxns.length;
    click('act-pay-labor');
    click('act-return-advance');
    click('act-refund-labor');
    click('act-review-cash', { creview: PAY_ID });
    assert.equal(store.accountTxns.length, before);
    assert.deepEqual(queued, []);
  });
  assert.equal(Accounts.CONTRACTOR_COST_START, null);
});

test('a start equal to today renders the blocks and a valid save of each appends', () => {
  reset();
  withStart(g.today(), () => {
    seedApproval(600000);
    store.accountTxns.push(cashRow(PAY_ID, 'payLabor', 100000));
    store.accountTxns.push(cashRow(ADV_ID, 'advanceLabor', 50000));
    const view = installBoth();
    const html = view.views.contractor(AG);
    assert.equal(html.includes('تسجيل دفعة'), true);
    assert.equal(html.includes('إرجاع سلفة لم تُصرف'), true);
    assert.equal(html.includes('استرداد نقدي من العامل'), true);
    assert.equal(html.includes('تدقيق'), true);
    assert.equal(html.includes('غير مدقّق'), true);
    const before = store.accountTxns.length;
    setFields({ 'cp-amount': '10000' });
    click('act-pay-labor');
    click('', { ctarget: ADV_ID, cpurpose: 'returnAdvance' });
    setFields({ 'cp-return': '1000' });
    click('act-return-advance');
    click('', { ctarget: PAY_ID, cpurpose: 'refundLabor' });
    setFields({ 'cp-refund': '1000' });
    click('act-refund-labor');
    click('act-review-cash', { creview: PAY_ID });
    assert.equal(rowsOf('payLabor').some(row => row.amount === 10000), true);
    assert.equal(rowsOf('returnAdvance').some(row => row.amount === 1000), true);
    assert.equal(rowsOf('refundLabor').some(row => row.amount === 1000), true);
    assert.equal(store.accountTxns.some(row => row.id === 'revw_' + PAY_ID), true);
    assert.equal(store.accountTxns.length, before + 4);
  });
  assert.equal(Accounts.CONTRACTOR_COST_START, null);
});

test('a refused advance stays and re-entry opens the payment form', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    const view = installBoth();
    view.views.contractor(AG);
    setFields({ 'cp-amount': '700000' });
    click('act-pay-labor');
    const pay = rowsOf('payLabor')[0];
    const advance = rowsOf('advanceLabor')[0];
    assert.equal(pay.amount, 600000);
    assert.equal(advance.amount, 100000);
    assert.equal(pay.partyId, advance.partyId);
    assert.equal(store.accountTxns.some(row => String(row.id).indexOf('rev_') === 0), false);
    store.projects[0].status = 'closed';
    store.syncErrors = { [advance.id]: 'رُفض الإرسال' };
    assert.equal(store.accountTxns.some(row => row.id === pay.id), true);
    assert.equal(store.syncErrors[advance.id], 'رُفض الإرسال');
    const refusedHtml = view.views.contractor(AG);
    assert.equal(refusedHtml.includes('رُفض الإرسال'), true);
    assert.equal(refusedHtml.includes(advance.id), true);
    store.projects[0].status = 'active';
    view.views.contractor('');
    const ids = store.accountTxns.map(row => row.id);
    view.views.contractor(AG);
    setFields({ 'cp-amount': '100000' });
    const again = view.views.contractor(AG);
    assert.equal(again.includes('تسجيل دفعة'), true);
    assert.equal(again.includes('الغرض'), true);
    assert.equal(preview(again).includes('سلفة'), true);
    assert.equal(preview(again).includes('100,000'), true);
    assert.deepEqual(store.accountTxns.map(row => row.id), ids);
    const unpaid = Math.max(0, Accounts.balances(store.accountTxns, {
      partyId: 'party-1',
      projectId: 'job',
      syncErrors: store.syncErrors,
    }).net);
    assert.equal(unpaid, 0);
    assert.deepEqual(Pay.paymentSplit(100000, unpaid), { payLabor: 0, advanceLabor: 100000 });
    /** @type {string[]} */
    const posted = [];
    const orig = Accounts.post;
    Accounts.post = (action, input) => {
      if (input && typeof input.id === 'string') posted.push(input.id);
      return orig(action, input);
    };
    click('act-advance-labor');
    Accounts.post = orig;
    const link = store.refusedLinks;
    assert.equal(link.refusedId, advance.id);
    assert.equal(posted.includes(link.nextId), true);
    assert.notEqual(link.nextId, advance.id);
    assert.equal(store.accountTxns.filter(row => row.id === advance.id).length, 1);
    const card = view.views.contractor(AG);
    const pair = card.slice(card.indexOf('data-refused-link'));
    assert.equal(pair.includes(advance.id), true);
    assert.equal(pair.includes(link.nextId), true);
  });
});

test('حسابات does not paint the payment buttons', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    installBoth();
    const tabs = ['overview', 'agreements', 'movements', 'statement'];
    for (const tab of tabs) {
      if (tab !== 'overview') UI.onClick(/** @type {any} */ ({ id: '', disabled: false, dataset: { acctab: tab } }));
      const html = UI.accountHtml(UI.modelFor(g.me()), 'party-1');
      for (const id of ACTS) assert.equal(html.includes(id), false, tab + ' ' + id);
    }
  });
});

test('builder keys stay inside the live allowlist', () => {
  reset();
  seedApproval(600000);
  store.accountTxns.push(cashRow(PAY_ID, 'payLabor', 600000));
  store.accountTxns.push(cashRow(ADV_ID, 'advanceLabor', 100000));
  const pay = /** @type {any} */ (Pay.cashDoc('payLabor', header({ id: 'pay-new', amount: 10, txnDate: '1999-01-01' })).doc);
  const advance = /** @type {any} */ (Pay.cashDoc('advanceLabor', header({ id: 'adv-new', amount: 10 })).doc);
  const returned = /** @type {any} */ (Pay.cashDoc('returnAdvance', header({ id: 'ret-new', amount: 10, targetId: ADV_ID })).doc);
  const refund = /** @type {any} */ (Pay.cashDoc('refundLabor', header({ id: 'ref-new', amount: 10, targetId: PAY_ID })).doc);
  const review = /** @type {any} */ (Pay.reviewDoc(header({ targetId: PAY_ID })).doc);
  subset(pay, CASH_KEYS);
  subset(advance, CASH_KEYS);
  subset(returned, POINTER_KEYS);
  subset(refund, POINTER_KEYS);
  subset(review, REVW_KEYS);
  assert.equal(Object.prototype.hasOwnProperty.call(review, 'amount'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(review, 'txnDate'), false);
});

test('a saved payment clears the amount instead of previewing a new draft', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    const view = installBoth();
    view.views.contractor(AG);
    setFields({ 'cp-amount': '700000' });
    click('act-pay-labor');
    assert.equal(fields['cp-amount'].value, '');
    const html = view.views.contractor(AG);
    const shown = preview(html);
    assert.equal(shown.includes('700,000'), false);
    assert.equal(shown.includes('سلفة'), false);
    assert.equal(shown.includes('100,000'), false);
    assert.equal(rowsOf('payLabor')[0].amount, 600000);
    assert.equal(rowsOf('advanceLabor')[0].amount, 100000);
    assert.equal(html.includes('id="act-pay-labor" disabled') || html.includes('id="act-advance-labor" disabled'), true);
  });
});

test('typing updates the preview without replacing the amount field', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    /** @type {Array<(event: { target: { id: string }, type?: string }) => void>} */
    const inputListeners = [];
    /** @type {Array<(event: { key?: string, target?: { id: string }, preventDefault?: () => void }) => void>} */
    const keyListeners = [];
    /**
     * @param {string} id
     */
    function amountBox(id) {
      return {
        id,
        value: '',
        selectionStart: 0,
        selectionEnd: 0,
        /**
         * @param {number} start
         * @param {number} end
         */
        setSelectionRange(start, end) {
          this.selectionStart = start;
          this.selectionEnd = end;
        },
        /**
         * @param {{ type?: string, bubbles?: boolean }} event
         */
        dispatchEvent(event) {
          if (!event || event.type !== 'input' || event.bubbles !== true) return true;
          for (const fn of inputListeners.slice()) fn({ target: this, type: 'input' });
          return true;
        },
      };
    }
    const input = amountBox('cp-amount');
    const returnInput = amountBox('cp-return');
    const refundInput = amountBox('cp-refund');
    const previewBox = { innerHTML: '' };
    const purposeBox = { innerHTML: '' };
    const button = { id: 'act-pay-labor', disabled: false };
    const root = {
      querySelector(sel) {
        if (sel === '#cp-preview') return previewBox;
        if (sel === '#cp-purpose') return purposeBox;
        if (sel === 'button') return button;
        return null;
      },
    };
    const prevDoc = g.document;
    g.document = {
      addEventListener(type, fn) {
        if (type === 'input') inputListeners.push(fn);
        if (type === 'keydown') keyListeners.push(fn);
      },
      querySelector(sel) {
        if (sel === '#cp-amount') return input;
        if (sel === '#cp-return') return returnInput;
        if (sel === '#cp-refund') return refundInput;
        if (sel === '#cp-pay') return root;
        return null;
      },
      createElement() { return {}; },
      createElementNS() { return {}; },
    };
    let renders = 0;
    const next = api();
    next.render = () => { renders += 1; };
    Work.install(next);
    Pay.install(next);
    next.views.contractor(AG);
    const before = renders;
    input.value = '7';
    for (const fn of inputListeners) fn({ target: input });
    assert.equal(renders, before);
    assert.equal(input.value, '7');
    assert.equal(previewBox.innerHTML.includes('7'), true);
    assert.equal(previewBox.innerHTML.includes('\u2212'), false);
    input.value = '700000';
    input.selectionStart = 6;
    for (const fn of inputListeners) fn({ target: input });
    assert.equal(renders, before);
    assert.equal(input.value, '700,000');
    assert.equal(input, g.document.querySelector('#cp-amount'));
    assert.equal(previewBox.innerHTML.includes('600,000'), true);
    assert.equal(previewBox.innerHTML.includes('100,000'), true);
    assert.equal(previewBox.innerHTML.includes('عن عمل معتمد'), true);
    assert.equal(previewBox.innerHTML.includes('سلفة'), true);
    /**
     * @param {{ id: string, value: string, selectionStart: number, selectionEnd: number }} box
     */
    function pressBackspace(box) {
      let stopped = false;
      const event = {
        key: 'Backspace',
        target: box,
        preventDefault() { stopped = true; },
      };
      for (const fn of keyListeners) fn(event);
      assert.equal(keyListeners.length > 0, true);
      return stopped;
    }
    let inputRuns = 0;
    inputListeners.push(() => {
      inputRuns += 1;
    });
    let previewWrites = 0;
    let previewHtml = previewBox.innerHTML;
    Object.defineProperty(previewBox, 'innerHTML', {
      configurable: true,
      get() {
        return previewHtml;
      },
      set(value) {
        previewWrites += 1;
        previewHtml = value;
      },
    });
    assert.equal(previewBox.innerHTML.includes('سلفة'), true);
    input.value = '1,500,000';
    input.selectionStart = 2;
    input.selectionEnd = 2;
    assert.equal(pressBackspace(input), true);
    assert.equal(inputRuns, 1);
    assert.equal(previewWrites, 1);
    assert.equal(input.value, '500,000');
    assert.equal(input.selectionStart, 0);
    assert.equal(previewBox.innerHTML.includes('500,000'), true);
    assert.equal(previewBox.innerHTML.includes('سلفة'), false);
    input.value = '1,500,000';
    input.selectionStart = 6;
    input.selectionEnd = 6;
    assert.equal(pressBackspace(input), true);
    assert.equal(input.value, '150,000');
    assert.equal(input.selectionStart, 3);
    input.value = '1,500,000';
    input.selectionStart = 2;
    input.selectionEnd = 5;
    const runsAtSelection = inputRuns;
    assert.equal(pressBackspace(input), false);
    assert.equal(inputRuns, runsAtSelection);
    assert.equal(input.value, '1,500,000');
    assert.equal(input.selectionStart, 2);
    assert.equal(input.selectionEnd, 5);
    /**
     * @param {{ id: string, value: string, selectionStart: number, selectionEnd: number, setSelectionRange: (start: number, end: number) => void }} box
     * @param {string} text
     */
    function paste(box, text) {
      box.value = text;
      box.selectionStart = text.length;
      box.selectionEnd = text.length;
      for (const fn of inputListeners) fn({ target: box });
    }
    paste(input, '1,50000');
    assert.equal(input.value, '150,000');
    assert.equal(input.selectionStart, 7);
    paste(input, '١\u066C٥٠٠٠٠');
    assert.equal(input.value, '150,000');
    assert.equal(input.selectionStart, 7);
    paste(input, '2,5');
    assert.equal(input.value, '2,5');
    paste(input, '٢,٥');
    assert.equal(input.value, '2,5');
    paste(input, '2,٥');
    assert.equal(input.value, '2,5');
    paste(input, '٢\u066C٥');
    assert.equal(input.value, '2,5');
    input.value = '';
    input.selectionStart = 0;
    input.selectionEnd = 0;
    /**
     * @param {{ id: string, value: string, selectionStart: number, selectionEnd: number, setSelectionRange: (start: number, end: number) => void }} box
     * @param {string} ch
     */
    function typeChar(box, ch) {
      const at = box.selectionStart;
      box.value = box.value.slice(0, at) + ch + box.value.slice(box.selectionEnd);
      box.selectionStart = at + ch.length;
      box.selectionEnd = box.selectionStart;
      for (const fn of inputListeners) fn({ target: box });
    }
    for (const ch of '100000') typeChar(input, ch);
    assert.equal(renders, before);
    assert.equal(input.value, '100,000');
    assert.equal(input.selectionStart, input.value.length);
    assert.equal(g.document.querySelector('#cp-amount'), input);
    click('act-pay-labor');
    const posted = rowsOf('payLabor')[0];
    assert.equal(posted.amount, 100000);
    assert.equal(typeof posted.amount, 'number');
    assert.equal(String(posted.amount).includes(','), false);
    store.accountTxns.push(cashRow(ADV_ID, 'advanceLabor', 200000));
    click('', { ctarget: ADV_ID, cpurpose: 'returnAdvance' });
    for (const ch of '100000') typeChar(returnInput, ch);
    assert.equal(returnInput.value, '100,000');
    assert.equal(g.document.querySelector('#cp-return'), returnInput);
    click('act-return-advance');
    const returned = rowsOf('returnAdvance')[0];
    assert.equal(returned.amount, 100000);
    assert.equal(String(returned.amount).includes(','), false);
    assert.equal(returnInput.value, '');
    click('', { ctarget: posted.id, cpurpose: 'refundLabor' });
    for (const ch of '100000') typeChar(refundInput, ch);
    assert.equal(refundInput.value, '100,000');
    assert.equal(g.document.querySelector('#cp-refund'), refundInput);
    click('act-refund-labor');
    const refunded = rowsOf('refundLabor')[0];
    assert.equal(refunded.amount, 100000);
    assert.equal(String(refunded.amount).includes(','), false);
    assert.equal(refundInput.value, '');
    next.views.contractor('');
    input.value = '';
    input.selectionStart = 0;
    input.selectionEnd = 0;
    returnInput.value = '';
    returnInput.selectionStart = 0;
    returnInput.selectionEnd = 0;
    refundInput.value = '';
    refundInput.selectionStart = 0;
    refundInput.selectionEnd = 0;
    next.views.contractor(AG);
    const arabic = '١٠٠٠٠٠';
    const range = 'المبلغ ليس عدداً صحيحاً';
    for (const ch of arabic) typeChar(input, ch);
    assert.equal(input.value, '100,000');
    assert.equal(input.selectionStart, input.value.length);
    assert.equal(g.document.querySelector('#cp-amount'), input);
    const paysBefore = rowsOf('payLabor').length;
    click('act-pay-labor');
    const arabicPay = rowsOf('payLabor')[rowsOf('payLabor').length - 1];
    assert.equal(rowsOf('payLabor').length, paysBefore + 1);
    assert.equal(arabicPay.amount, 100000);
    assert.equal(typeof arabicPay.amount, 'number');
    assert.equal(String(arabicPay.amount).includes(','), false);
    assert.equal(next.views.contractor(AG).includes(range), false);
    click('', { ctarget: ADV_ID, cpurpose: 'returnAdvance' });
    for (const ch of arabic) typeChar(returnInput, ch);
    assert.equal(returnInput.value, '100,000');
    assert.equal(returnInput.selectionStart, returnInput.value.length);
    assert.equal(g.document.querySelector('#cp-return'), returnInput);
    const returnsBefore = rowsOf('returnAdvance').length;
    click('act-return-advance');
    const arabicReturn = rowsOf('returnAdvance')[rowsOf('returnAdvance').length - 1];
    assert.equal(rowsOf('returnAdvance').length, returnsBefore + 1);
    assert.equal(arabicReturn.amount, 100000);
    assert.equal(typeof arabicReturn.amount, 'number');
    assert.equal(returnInput.value, '');
    assert.equal(next.views.contractor(AG).includes(range), false);
    click('', { ctarget: arabicPay.id, cpurpose: 'refundLabor' });
    for (const ch of arabic) typeChar(refundInput, ch);
    assert.equal(refundInput.value, '100,000');
    assert.equal(refundInput.selectionStart, refundInput.value.length);
    assert.equal(g.document.querySelector('#cp-refund'), refundInput);
    const refundsBefore = rowsOf('refundLabor').length;
    click('act-refund-labor');
    const arabicRefund = rowsOf('refundLabor')[rowsOf('refundLabor').length - 1];
    assert.equal(rowsOf('refundLabor').length, refundsBefore + 1);
    assert.equal(arabicRefund.amount, 100000);
    assert.equal(typeof arabicRefund.amount, 'number');
    assert.equal(refundInput.value, '');
    assert.equal(next.views.contractor(AG).includes(range), false);
    next.views.contractor('');
    next.views.contractor(AG);
    paste(input, '1,50000');
    assert.equal(input.value, '150,000');
    const longBefore = rowsOf('payLabor').length;
    click('act-pay-labor');
    const regroupedPay = rowsOf('payLabor')[rowsOf('payLabor').length - 1];
    assert.equal(rowsOf('payLabor').length, longBefore + 1);
    assert.equal(regroupedPay.amount, 150000);
    assert.equal(typeof regroupedPay.amount, 'number');
    assert.equal(next.views.contractor(AG).includes(range), false);
    next.views.contractor('');
    next.views.contractor(AG);
    const refusedBefore = store.accountTxns.length;
    paste(input, '2,5');
    assert.equal(input.value, '2,5');
    click('act-pay-labor');
    paste(input, '٢,٥');
    assert.equal(input.value, '2,5');
    click('act-pay-labor');
    paste(input, '1,50000');
    input.value = '1,50000';
    click('act-pay-labor');
    assert.equal(store.accountTxns.length, refusedBefore);
    assert.equal(next.views.contractor(AG).includes(range), true);
    g.document = prevDoc;
  });
});

test('groupThousands and plainAmount keep commas out of the saved number', () => {
  assert.equal(Pay.groupThousands('100000'), '100,000');
  assert.equal(Pay.groupThousands('100,000'), '100,000');
  assert.equal(Pay.groupThousands(''), '');
  assert.equal(Pay.plainAmount('100,000'), 100000);
  assert.equal(typeof Pay.plainAmount('100,000'), 'number');
  assert.equal(String(Pay.plainAmount('100,000')).includes(','), false);
  assert.equal(Pay.plainAmount('1,0,0'), null);
  assert.equal(Pay.plainAmount('2,5'), null);
  assert.equal(Pay.plainAmount('٢,٥'), null);
  assert.equal(Pay.plainAmount('٢\u066C٥'), null);
  assert.equal(Pay.plainAmount('1,50000'), null);
  assert.equal(Pay.plainAmount('١\u066C٥٠٠٠٠'), null);
  assert.equal(Pay.plainAmount('150,000'), 150000);
  assert.equal(Pay.groupThousands('2,5'), '2,5');
  assert.equal(Pay.groupThousands('٢,٥'), '2,5');
  assert.equal(Pay.groupThousands('2,٥'), '2,5');
  assert.equal(Pay.groupThousands('٢\u066C٥'), '2,5');
  assert.notEqual(Pay.groupThousands('٢,٥'), '25');
  assert.notEqual(Pay.groupThousands('2,٥'), '25');
  assert.equal(Pay.groupThousands('1,50000'), '150,000');
  assert.equal(Pay.groupThousands('١\u066C٥٠٠٠٠'), '150,000');
  assert.notEqual(Pay.groupThousands('2,5'), '25');
  assert.equal(Pay.groupThousands('0700000'), '0,700,000');
  assert.equal(Pay.plainAmount('0,700,000'), 700000);
  assert.equal(Pay.groupThousands(',500'), ',500');
  assert.equal(Pay.plainAmount('١٠٠٠٠٠'), 100000);
  assert.equal(Pay.plainAmount('\u06F7\u06F0\u06F0\u06F0\u06F0\u06F0'), 700000);
  assert.equal(Pay.plainAmount('١٠٠\u066C٠٠٠'), 100000);
  assert.equal(Pay.groupThousands('١٠٠٠٠٠'), '100,000');
  assert.equal(Pay.groupThousands('\u06F7\u06F0\u06F0\u06F0\u06F0\u06F0'), '700,000');
  assert.equal(Pay.groupThousands('١٠٠\u066C٠٠٠'), '100,000');
  const mid = {
    value: '1500,000',
    selectionStart: 2,
    selectionEnd: 2,
    /**
     * @param {number} start
     * @param {number} end
     */
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
  };
  Pay.applyGroupedAmount(mid);
  assert.equal(mid.value, '1,500,000');
  assert.equal(mid.selectionStart, 3);
  assert.notEqual(mid.selectionStart, mid.value.length);
  const arabicMid = {
    value: '1٥00,000',
    selectionStart: 2,
    selectionEnd: 2,
    /**
     * @param {number} start
     * @param {number} end
     */
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
  };
  Pay.applyGroupedAmount(arabicMid);
  assert.equal(arabicMid.value, '1,500,000');
  assert.equal(arabicMid.selectionStart, 3);
});

test('typing U+066C keeps the caret after the folded comma', () => {
  /**
   * @returns {{ value: string, selectionStart: number, selectionEnd: number, setSelectionRange: (start: number, end: number) => void }}
   */
  function box() {
    return {
      value: '',
      selectionStart: 0,
      selectionEnd: 0,
      /**
       * @param {number} start
       * @param {number} end
       */
      setSelectionRange(start, end) {
        this.selectionStart = start;
        this.selectionEnd = end;
      },
    };
  }
  /**
   * @param {{ value: string, selectionStart: number, selectionEnd: number, setSelectionRange: (start: number, end: number) => void }} input
   * @param {string} ch
   */
  function typeChar(input, ch) {
    const at = input.selectionStart;
    input.value = input.value.slice(0, at) + ch + input.value.slice(input.selectionEnd);
    input.selectionStart = at + ch.length;
    input.selectionEnd = input.selectionStart;
    Pay.applyGroupedAmount(input);
  }
  const amount = box();
  for (const ch of '١٠٠\u066C٠٠٠') typeChar(amount, ch);
  assert.equal(amount.value, '100,000');
  assert.equal(amount.selectionStart, amount.value.length);
  const mis = box();
  for (const ch of '١\u066C٥٠٠٠٠') typeChar(mis, ch);
  assert.equal(mis.value, '150,000');
  assert.equal(mis.selectionStart, mis.value.length);
  const short = box();
  for (const ch of '٢\u066C٥') typeChar(short, ch);
  assert.equal(short.value, '2,5');
  assert.notEqual(short.value, '25');
  const pasted = box();
  pasted.value = '٢,';
  pasted.selectionStart = 2;
  pasted.selectionEnd = 2;
  Pay.applyGroupedAmount(pasted);
  assert.equal(pasted.value, '2,');
  assert.equal(pasted.selectionStart, 2);
  const leading = box();
  leading.value = ' 2,5';
  leading.selectionStart = 4;
  leading.selectionEnd = 4;
  Pay.applyGroupedAmount(leading);
  assert.equal(leading.value, '2,5');
  assert.equal(leading.selectionStart, 3);
  const trailing = box();
  trailing.value = '2,5 ';
  trailing.selectionStart = 4;
  trailing.selectionEnd = 4;
  Pay.applyGroupedAmount(trailing);
  assert.equal(trailing.value, '2,5');
  assert.equal(trailing.selectionStart, 3);
});

test('a redraw keeps the grouped amount in the field', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    store.accountTxns.push(cashRow(PAY_ID, 'payLabor', 600000));
    store.accountTxns.push(cashRow(ADV_ID, 'advanceLabor', 200000));
    const view = installBoth();
    setFields({ 'cp-amount': '700000', 'cp-return': '30000', 'cp-refund': '50000' });
    const html = view.views.contractor(AG);
    assert.equal(html.includes('id="cp-amount" class="full" inputmode="numeric" value="700,000"'), true);
    assert.equal(html.includes('id="cp-return" class="full" inputmode="numeric" value="30,000"'), true);
    assert.equal(html.includes('id="cp-refund" class="full" inputmode="numeric" value="50,000"'), true);
    assert.equal(html.includes('value="700000"'), false);
    assert.equal(html.includes('value="30000"'), false);
    assert.equal(html.includes('value="50000"'), false);
  });
});

test('a form opened on an open gate appends nothing after the gate closes', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    store.accountTxns.push(cashRow(PAY_ID, 'payLabor', 600000));
    store.accountTxns.push(cashRow(ADV_ID, 'advanceLabor', 100000));
    const view = installBoth();
    const open = view.views.contractor(AG);
    assert.equal(open.includes('تسجيل دفعة'), true);
    click('', { ctarget: ADV_ID, cpurpose: 'returnAdvance' });
    click('', { ctarget: PAY_ID, cpurpose: 'refundLabor' });
    setFields({ 'cp-amount': '10000', 'cp-return': '1000', 'cp-refund': '1000' });
    const before = store.accountTxns.length;
    Accounts.CONTRACTOR_COST_START = null;
    click('act-pay-labor');
    click('act-return-advance');
    click('act-refund-labor');
    assert.equal(store.accountTxns.length, before);
    Accounts.CONTRACTOR_COST_START = '2026-11-23';
    click('act-pay-labor');
    click('act-return-advance');
    click('act-refund-labor');
    assert.equal(store.accountTxns.length, before);
    assert.deepEqual(queued, []);
  });
  assert.equal(Accounts.CONTRACTOR_COST_START, null);
});

test('reviewDoc refuses a refused row, a reversed row, and a second live review', () => {
  reset();
  seedApproval(600000);
  store.accountTxns.push(cashRow(PAY_ID, 'payLabor', 600000));
  store.syncErrors = { [PAY_ID]: 'رُفض الإرسال' };
  const refused = Pay.reviewDoc(header({ targetId: PAY_ID }));
  assert.equal(refused.doc, null);
  store.syncErrors = {};
  store.accountTxns.push({ id: 'rev_' + PAY_ID, kind: 'rev', reversesId: PAY_ID });
  const reversed = Pay.reviewDoc(header({ targetId: PAY_ID }));
  assert.equal(reversed.doc, null);
  store.accountTxns = store.accountTxns.filter(row => row.id !== 'rev_' + PAY_ID);
  const first = Pay.reviewDoc(header({ targetId: PAY_ID }));
  assert.equal(/** @type {any} */ (first.doc).id, 'revw_' + PAY_ID);
  store.accountTxns.push(first.doc);
  const second = Pay.reviewDoc(header({ targetId: PAY_ID }));
  assert.equal(second.doc, null);
});

test('a site user sees no payment blocks', () => {
  reset();
  const prev = g.me;
  g.me = () => ({ uid: 'u-site', role: 'site', active: true, displayName: 'أحمد' });
  try {
    withStart('2026-11-22', () => {
      seedApproval(600000);
      const view = installBoth();
      const html = view.views.contractor(AG);
      assert.equal(html.includes('تسجيل دفعة'), false);
      for (const id of ACTS) assert.equal(html.includes(id), false, id);
    });
  } finally {
    g.me = prev;
  }
});

test('a paidAs outside the two labels adds no new sentence', () => {
  reset();
  withStart('2026-11-22', () => {
    seedApproval(600000);
    const bad = Pay.cashDoc(/** @type {any} */ ('settle'), header({ id: 'x', amount: 10 }));
    assert.equal(bad.doc, null);
    assert.deepEqual(bad.errors, ['paidAs']);
    const view = installBoth();
    view.views.contractor(AG);
    setFields({ 'cp-amount': '700000' });
    const html = view.views.contractor(AG);
    const purpose = html.slice(html.indexOf('id="cp-purpose"'), html.indexOf('id="act-pay-labor"'));
    assert.equal(purpose.includes('الغرض'), true);
    assert.equal(purpose.includes('عن عمل معتمد'), true);
    assert.equal(purpose.includes('سلفة عمل قادم'), true);
    assert.equal(html.includes(Q19), false);
  });
});

test('#amt groups a typed amount and a redraw keeps the draft', () => {
  reset();
  school();
  /** @type {Array<{ type: string, fn: (event: { target?: { id?: string }, type?: string }) => void }>} */
  const listeners = [];
  /** @type {Record<string, any>} */
  const els = {};
  /**
   * @param {string} id
   */
  function node(id) {
    if (!els[id]) {
      els[id] = {
        id,
        value: '',
        hidden: false,
        textContent: '',
        classList: { toggle() {} },
        setAttribute() {},
        removeAttribute() {},
        addEventListener() {},
        querySelector() { return null; },
      };
    }
    return els[id];
  }
  const amt = node('amt');
  amt.selectionStart = 0;
  amt.selectionEnd = 0;
  amt.setSelectionRange = function (start, end) {
    this.selectionStart = start;
    this.selectionEnd = end;
  };
  const main = node('main');
  let mainHtml = '';
  Object.defineProperty(main, 'innerHTML', {
    get() { return mainHtml; },
    set(html) {
      mainHtml = String(html);
      const match = mainHtml.match(/id="amt"[^>]*value="([^"]*)"/);
      if (match) amt.value = match[1];
    },
  });
  const doc = {
    /**
     * @param {string} type
     * @param {(event: { target?: { id?: string }, type?: string }) => void} fn
     */
    addEventListener(type, fn) { listeners.push({ type, fn }); },
    /**
     * @param {string} sel
     */
    querySelector(sel) {
      if (sel === '.tabs') return null;
      if (sel === '#login') return { hidden: true };
      if (sel === '#outbox' || sel === '#print-root' || sel === '#bell-panel' || sel === '#sync-msg') return null;
      const id = String(sel || '').replace(/^#/, '');
      return node(id);
    },
    querySelectorAll() { return []; },
    createElement() { return { append() {}, setAttribute() {}, classList: { toggle() {} } }; },
    createElementNS() { return { setAttribute() {}, append() {} }; },
    documentElement: { dir: 'rtl' },
  };
  const sandbox = {
    console,
    Ledger,
    Accounts,
    DomSafe,
    Sync,
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
    location: { hash: '#entry' },
    document: doc,
    navigator: { onLine: true },
    PeopleDir: { createLoader() { return {}; }, TIMEOUT_MS: 1, RENDER_ERROR: 'render-error' },
    withTimeout: p => p,
    ensureFirebase: () => Promise.resolve({ listUsers: () => Promise.resolve([]) }),
    $: sel => doc.querySelector(sel),
    addEventListener: (type, fn) => doc.addEventListener(type, fn),
    AccountsView: { install() {}, syncTab() {}, onInput() { return false; }, onClick() { return false; } },
    AccountWork: { install() {}, syncTab() {} },
    ForemenUI: { install() {}, onInput() { return false; }, onClick() { return false; } },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/accounts-payment.js'), 'utf8'), sandbox, { filename: 'accounts-payment.js' });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/render.js'), 'utf8') + '\nglobalThis.__render = render;\n', sandbox, { filename: 'render.js' });
  /**
   * @param {string} ch
   */
  function typeChar(ch) {
    const at = amt.selectionStart;
    amt.value = amt.value.slice(0, at) + ch + amt.value.slice(amt.selectionEnd);
    amt.selectionStart = at + ch.length;
    amt.selectionEnd = amt.selectionStart;
    for (const item of listeners) {
      if (item.type === 'input') item.fn({ target: amt, type: 'input' });
    }
  }
  for (const ch of '1,50000') typeChar(ch);
  assert.equal(amt.value, '150,000');
  const saved = Ledger.parseAmount(amt.value);
  assert.equal(saved.ok, true);
  assert.equal(saved.amount, 150000);
  sandbox.__render();
  assert.equal(mainHtml.includes('id="render-error"'), false, mainHtml.slice(0, 300));
  assert.equal(amt.value, '150,000');
  amt.value = '';
  amt.selectionStart = 0;
  amt.selectionEnd = 0;
  for (const ch of '١٠٠\u066C٠٠٠') typeChar(ch);
  assert.equal(amt.value, '100,000');
  assert.equal(amt.selectionStart, amt.value.length);
  sandbox.__render();
  assert.equal(amt.value, '100,000');
  amt.value = '';
  amt.selectionStart = 0;
  amt.selectionEnd = 0;
  for (const ch of '2,5') typeChar(ch);
  assert.equal(amt.value, '2,5');
  assert.equal(Ledger.parseAmount(amt.value).ok, false);
  amt.value = '';
  amt.selectionStart = 0;
  amt.selectionEnd = 0;
  typeChar('٧');
  assert.equal(amt.value, '7');
  const arabic = Ledger.parseAmount(amt.value);
  assert.equal(arabic.ok, true);
  assert.equal(arabic.amount, 7);
  const desc = node('desc');
  desc.selectionStart = 0;
  desc.selectionEnd = 0;
  const party = node('party');
  party.selectionStart = 0;
  party.selectionEnd = 0;
  /**
   * @param {any} el
   * @param {string} text
   */
  function typeInto(el, text) {
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
  typeInto(desc, '1,50000');
  typeInto(party, '٢,٥');
  assert.equal(desc.value, '1,50000');
  assert.equal(party.value, '٢,٥');
});

test('amount field ids are exactly the grouped set', () => {
  assert.deepEqual(Pay.amountFieldIds.slice(), [
    'cp-amount',
    'cp-return',
    'cp-refund',
    'amt',
    'fm-amount',
    'cw-lump',
    'cw-rate',
    'cw-day',
    'cw-mile',
    'contract',
    'sub-amount',
    'am-amount',
    'cc-deduct',
  ]);
});

test('cw-qty, cw-days, and cw-per stay out of the amount fields', () => {
  assert.equal(Pay.amountFieldIds.includes('cw-qty'), false);
  assert.equal(Pay.amountFieldIds.includes('cw-days'), false);
  assert.equal(Pay.amountFieldIds.includes('cw-per'), false);
});

test('an opened contract paints the grouped integer and keeps 0', () => {
  const renderSrc = fs.readFileSync(path.join(ROOT, 'public/render.js'), 'utf8');
  const start = renderSrc.indexOf('function contractFields');
  const end = renderSrc.indexOf('function saveContract');
  const paint = renderSrc.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(paint, /groupThousands\(String\(amount\)\)/);
  assert.equal(paint.includes('value="${esc(String(amount))}"'), false);
  const opened = Pay.groupThousands(String(60000000));
  assert.equal(opened, '60,000,000');
  assert.match(paint, /id="contract"/);
  assert.equal(Pay.groupThousands(String(0)), '0');
  assert.equal(Pay.groupThousands('0'), '0');
  /**
   * @param {string} value
   */
  function box(value) {
    return {
      value,
      selectionStart: value.length,
      selectionEnd: value.length,
      /**
       * @param {number} start
       * @param {number} end
       */
      setSelectionRange(start, end) {
        this.selectionStart = start;
        this.selectionEnd = end;
      },
    };
  }
  const typed = box('1,50000');
  Pay.applyGroupedAmount(typed);
  assert.equal(typed.value, '150,000');
  const saved = Ledger.parseAmount(typed.value, { allowZero: true });
  assert.equal(saved.ok, true);
  assert.equal(saved.amount, 150000);
  const arabic = box('١٥٠٠٠٠');
  Pay.applyGroupedAmount(arabic);
  assert.equal(arabic.value, '150,000');
  const zero = box('0');
  Pay.applyGroupedAmount(zero);
  assert.equal(zero.value, '0');
});

test('SHIPPED payment writes stay closed the day before and open on the start day and the day after', () => {
  assert.equal(SHIPPED, '2026-11-27');
  for (const day of ['2026-11-26', '2026-11-27', '2026-11-28']) {
    reset();
    g.today = () => day;
    withStart(SHIPPED, () => {
      seedApproval(600000);
      const view = installBoth();
      view.views.contractor(AG);
      const before = store.accountTxns.length;
      setFields({ 'cp-amount': '10000' });
      click('act-pay-labor');
      const saved = store.accountTxns.filter(row => row.purpose === 'payLabor' && row.amount === 10000);
      if (day < SHIPPED) {
        assert.equal(saved.length, 0);
        assert.equal(store.accountTxns.length, before);
        assert.deepEqual(queued, []);
      } else {
        assert.equal(saved.length, 1);
      }
    });
  }
});
