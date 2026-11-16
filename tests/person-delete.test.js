const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const L = require('../public/ledger.js');
const Accounts = require('../public/accounts.js');

const UNCHECKED = 'لا يمكن الحذف: تعذر التحقق من رصيد الشخص.';

/**
 * @param {string} name
 * @param {string} word
 * @param {string} amount
 */
function sentence(name, word, amount) {
  return 'لا يمكن الحذف: رصيد ' + name + ' في هذا المشروع ليس صفراً (' + word + ' ' + amount + ' د.ع). سوِّ الحساب أو أرشف المشروع';
}

/**
 * @param {object} extra
 */
function doc(extra) {
  return /** @type {FoldDoc} */ (Object.assign({ ledger: 'labor', projectId: 'job', partyId: 'p1', txnDate: '2026-11-01' }, extra));
}

const parties = [{ id: 'p1', name: 'حسن' }];

test('advance-only person blocks with string 86 and the absolute amount', () => {
  const docs = [doc({ id: 'adv', purpose: 'advanceLabor', amount: 100000 })];
  const msg = L.personProjectDeleteBlock('job', docs, parties, {}, Accounts.balances);
  assert.equal(msg, sentence('حسن', 'مستحق عليه', '100,000'));
  assert.equal(msg.includes('\u2212'), false);
});

test('approved labor equal to the advance has net 0 and does not block', () => {
  const docs = [
    doc({ id: 'm', purpose: 'laborQty', amount: 0 }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 100000, targetId: 'm' }),
    doc({ id: 'adv', purpose: 'advanceLabor', amount: 100000 }),
  ];
  assert.equal(Accounts.balances(docs, { partyId: 'p1', projectId: 'job' }).net, 0);
  assert.equal(L.personProjectDeleteBlock('job', docs, parties, {}, Accounts.balances), '');
});

test('net above 0 returns string 87 and net below 0 returns string 86', () => {
  const owed = [doc({ id: 'appr', purpose: 'approveLabor', amount: 100000, targetId: 'm' })];
  const holding = [doc({ id: 'adv', purpose: 'advanceLabor', amount: 100000 })];
  assert.equal(L.personProjectDeleteBlock('job', owed, parties, {}, Accounts.balances), sentence('حسن', 'مستحق له', '100,000'));
  assert.equal(L.personProjectDeleteBlock('job', holding, parties, {}, Accounts.balances), sentence('حسن', 'مستحق عليه', '100,000'));
});

test('a rejected approval and a reversed row and a syncErrors row do not block', () => {
  const rejected = [
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
    doc({ id: 'rej_m', purpose: 'laborQty', targetId: 'm', kind: 'rej' }),
  ];
  assert.equal(L.personProjectDeleteBlock('job', rejected, parties, {}, Accounts.balances), '');
  const reversed = [
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
    doc({ id: 'rev_appr', reversesId: 'appr', kind: 'rev' }),
  ];
  assert.equal(L.personProjectDeleteBlock('job', reversed, parties, {}, Accounts.balances), '');
  const refused = [doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' })];
  assert.equal(L.personProjectDeleteBlock('job', refused, parties, { appr: 'رُفض الإرسال' }, Accounts.balances), '');
});

test('a missing or throwing balancesFn, a non-array, a non-finite net, and a missing party all refuse', () => {
  const docs = [doc({ id: 'adv', purpose: 'advanceLabor', amount: 100000 })];
  assert.equal(L.personProjectDeleteBlock('job', [], parties, {}, null), UNCHECKED);
  assert.equal(L.personProjectDeleteBlock('job', docs, parties, {}, () => { throw new Error('down'); }), UNCHECKED);
  assert.equal(L.personProjectDeleteBlock('job', /** @type {any} */ (null), parties, {}, () => ({ net: 0 })), UNCHECKED);
  assert.equal(L.personProjectDeleteBlock('job', docs, /** @type {any} */ (null), {}, () => ({ net: 0 })), UNCHECKED);
  for (const net of [NaN, Infinity, undefined]) {
    assert.equal(L.personProjectDeleteBlock('job', docs, parties, {}, () => ({ net })), UNCHECKED);
  }
  assert.equal(L.personProjectDeleteBlock('job', docs, [], {}, Accounts.balances), UNCHECKED);
});

test('a queued unsynced advance blocks', () => {
  const docs = [doc({ id: 'local-adv', purpose: 'advanceLabor', amount: 100000 })];
  const msg = L.personProjectDeleteBlock('job', docs, parties, {}, Accounts.balances);
  assert.equal(msg, sentence('حسن', 'مستحق عليه', '100,000'));
});

test('deleteProjectNow refuses before fb.deleteProject when only the person block is set', async () => {
  let deletes = 0;
  const store = {
    projects: [{ id: 'job', name: 'مشروع' }],
    entries: [],
    foremen: [],
    parties,
    accountTxns: [doc({ id: 'adv', purpose: 'advanceLabor', amount: 100000 })],
    syncErrors: {},
    outbox: [],
    users: [],
  };
  const node = () => ({
    hidden: true,
    textContent: '',
    innerHTML: '',
    value: '',
    disabled: false,
    dataset: {},
    classList: { toggle() {} },
    addEventListener() {},
    append() {},
    appendChild() {},
    remove() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    setAttribute() {},
    removeAttribute() {},
  });
  const context = {
    console,
    URL,
    URLSearchParams,
    Promise,
    setTimeout,
    clearTimeout,
    queueMicrotask,
    window: {},
    document: {
      addEventListener() {},
      querySelector() { return node(); },
      querySelectorAll() { return []; },
      getElementById() { return node(); },
      createElement() { return node(); },
      body: { dataset: {} },
    },
    location: { hash: '#project/job', search: '' },
    navigator: { onLine: true },
    addEventListener() {},
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    Ledger: L,
    Accounts,
    K: {
      projects: 'projects', entries: 'entries', foremen: 'foremen', parties: 'parties',
      accountTxns: 'accountTxns', syncErrors: 'syncErrors', outbox: 'outbox', users: 'users',
      subcontracts: 'subcontracts', role: 'role', sessionUser: 'sessionUser',
    },
    Sync: { collectionFor() { return null; }, exactProjectName() { return false; } },
    SyncStatus: { CONFLICT: '', PROJECT_DELETED: '', REJECTED: '' },
    DomSafe: { isSafeId() { return true; }, projectAttr(id) { return id; }, projectHref() { return '#projects'; } },
    PeopleDir: { RENDER_ERROR: 'x', TIMEOUT_MS: 1, createLoader() { return { run() { return Promise.resolve(); }, failed() { return false; }, reset() {} }; } },
    me: () => ({ uid: 'owner', role: 'owner', active: true }),
    uuid: () => 'id',
    today: () => '2026-11-16',
    demoRole: () => '',
    sessionEpoch: 0,
    signOutPending: () => '',
    clearSignOutPending() {},
    withTimeout: (p) => p,
    LOGIN_MS: 1000,
    get: (key, fallback) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallback),
    set: () => Promise.resolve(),
    $: (sel) => {
      if (!context._els[sel]) context._els[sel] = node();
      return context._els[sel];
    },
    _els: {},
    ensureFirebase: () => Promise.resolve({ deleteProject() { deletes += 1; return Promise.resolve(); } }),
    flushRemote: () => Promise.resolve(),
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/render.js'), 'utf8'), context);
  await context.deleteProjectNow('job');
  assert.equal(deletes, 0);
});
