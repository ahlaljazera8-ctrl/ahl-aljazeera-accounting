const test = require('node:test');
const assert = require('node:assert/strict');
const Ledger = require('../public/ledger.js');
const Sync = require('../public/sync.js');

const owner = { uid: 'o', role: 'owner', active: true };
const site = { uid: 's', role: 'site', active: true, assignedProjectIds: ['p-keep', 'p-del'] };

function store() {
  return {
    projects: [
      { id: 'p-del', name: 'مشروع المدرسة', status: 'active', currency: 'IQD', createdAtServer: 1 },
      { id: 'p-keep', name: 'بناية السوق', status: 'active', currency: 'IQD', createdAtServer: 1 },
      { id: 'p-arch', name: 'مشروع الطريق', status: 'archived', currency: 'IQD', createdAtServer: 1 },
    ],
    entries: [
      { id: 'del-pay', projectId: 'p-del', direction: 'income', entryType: 'clientPayment', amount: 40000000, isReversal: false },
      { id: 'del-sub', projectId: 'p-del', direction: 'expense', entryType: 'subcontractor', amount: 7200000, isReversal: false, subcontractId: 'sc-del' },
      { id: 'del-wait', projectId: 'p-del', direction: 'expense', entryType: 'materials', amount: 250000, isReversal: false },
      { id: 'keep-pay', projectId: 'p-keep', direction: 'income', entryType: 'clientPayment', amount: 6000000, isReversal: false },
      { id: 'arch-exp', projectId: 'p-arch', direction: 'expense', entryType: 'materials', amount: 1000, isReversal: false },
    ],
    subcontracts: [
      { id: 'sc-del', projectId: 'p-del', name: 'مقاول الكهرباء' },
      { id: 'sc-keep', projectId: 'p-keep', name: 'مقاول البناء' },
      { id: 'sc-wait', projectId: 'p-del', name: 'عقد لم يُرسل' },
    ],
    amendments: [
      { id: 'am-del', projectId: 'p-del', subcontractId: 'sc-del', amount: 500000 },
      { id: 'am-keep', projectId: 'p-keep', subcontractId: 'sc-keep', amount: 100000 },
    ],
    finance: { 'p-del': { contractAmount: 60000000 }, 'p-keep': { contractAmount: 15000000 } },
    terms: { 'sc-del': { originalAmount: 2500000 }, 'sc-keep': { originalAmount: 9000000 }, 'sc-wait': { originalAmount: 1000 } },
    outbox: ['del-wait', 'sc-wait', 'p-del'],
    syncErrors: { 'del-pay': 'قديم' },
    statusPending: ['p-del'],
  };
}

test('the name gate accepts only the exact project name', () => {
  assert.equal(Sync.exactProjectName('مشروع المدرسة', 'مشروع المدرسة'), true);
  assert.equal(Sync.exactProjectName('مشروع المدرس', 'مشروع المدرسة'), false);
  assert.equal(Sync.exactProjectName('مشروع المدرسة ', 'مشروع المدرسة'), false);
  assert.equal(Sync.exactProjectName('', 'مشروع المدرسة'), false);
  assert.equal(Sync.exactProjectName('مشروع المدرسة', ''), false);
});

test('delete batches put the project first and keep terms in small groups', () => {
  const terms = [];
  for (let i = 0; i < 7; i++) terms.push('t' + i);
  const docs = Sync.projectDeleteDocs('p-del', {
    entryIds: ['e1', 'e2'], subcontractIds: ['sc-del'], amendmentIds: ['am-del'], termIds: terms, finance: true,
  });
  const batches = Sync.projectDeleteBatches(docs);
  assert.deepEqual(batches[0], [{ collection: 'projects', id: 'p-del' }]);
  assert.equal(batches[1].length, 6);
  assert.equal(batches[1].every(row => row.collection === 'subcontractTerms'), true);
  assert.deepEqual(batches[2], [{ collection: 'subcontractTerms', id: 't6' }]);
  const rest = batches[3].map(row => row.collection + '/' + row.id);
  assert.deepEqual(rest, ['ledgerEntries/e1', 'ledgerEntries/e2', 'subcontracts/sc-del', 'subcontractAmendments/am-del', 'projectFinance/p-del']);
});

test('dropping a project removes it from totals, the project list, CSV, and subcontract cards', () => {
  const next = Sync.dropProjectLocal(store(), 'p-del', { dropPending: false });
  assert.equal(next.projects.some(p => p.id === 'p-del'), false);
  assert.equal(next.projects.some(p => p.id === 'p-keep'), true);
  assert.equal(next.finance['p-del'], undefined);
  assert.equal(next.finance['p-keep'].contractAmount, 15000000);
  assert.equal(next.subcontracts.some(s => s.id === 'sc-del'), false);
  assert.equal(next.subcontracts.some(s => s.id === 'sc-keep'), true);
  assert.equal(next.subcontracts.some(s => s.id === 'sc-wait'), true);
  assert.equal(next.terms['sc-del'], undefined);
  assert.equal(next.terms['sc-keep'].originalAmount, 9000000);
  assert.equal(next.terms['sc-wait'].originalAmount, 1000);
  assert.equal(next.amendments.some(a => a.id === 'am-del'), false);
  assert.equal(next.amendments.some(a => a.id === 'am-keep'), true);
  assert.equal(next.entries.some(e => e.id === 'del-pay'), true);
  assert.equal(next.syncErrors['del-pay'], 'قديم');
  assert.equal(next.entries.some(e => e.id === 'del-wait'), true);
  assert.equal(next.outbox.includes('p-del'), false);
  assert.equal(next.outbox.includes('del-wait'), true);
  assert.equal(next.outbox.includes('sc-wait'), true);
  assert.equal(next.statusPending.includes('p-del'), false);

  const open = Ledger.projectList(owner, next.projects, Ledger.DEFAULT_POLICY, 'open').map(p => p.id);
  assert.deepEqual(open, ['p-keep']);
  const visible = Ledger.visibleEntries(owner, next.entries, next.projects, Ledger.DEFAULT_POLICY);
  const totals = Ledger.totals(Ledger.countedEntries(visible, next.syncErrors));
  assert.equal(totals.received, 6000000);
  assert.equal(next.entries.some(e => e.id === 'arch-exp'), true);
  assert.equal(totals.spent, 1000);
  const csv = Ledger.toCSV(Ledger.countedEntries(next.entries, next.syncErrors), next.projects);
  assert.equal(csv.includes('del-pay'), false);
  assert.equal(csv.includes('del-sub'), false);
  assert.equal(csv.includes('keep-pay'), true);
  assert.equal(csv.includes('del-wait'), true);
  const rejected = Ledger.countedEntries(next.entries, { 'del-wait': 'رُفض الإرسال' });
  assert.equal(rejected.some(e => e.id === 'del-wait'), false);
  assert.equal(rejected.some(e => e.id === 'keep-pay'), true);
  const cards = next.subcontracts.filter(s => s.projectId === 'p-keep').map(s => s.name);
  assert.deepEqual(cards, ['مقاول البناء']);
  const siteHome = Ledger.visibleEntries(site, next.entries, next.projects, Ledger.DEFAULT_POLICY);
  assert.equal(siteHome.some(e => e.projectId === 'p-del'), false);
});

test('the deleting phone also drops its own unsent rows for that project', () => {
  const next = Sync.dropProjectLocal(store(), 'p-del', { dropPending: true });
  assert.equal(next.entries.some(e => e.projectId === 'p-del'), false);
  assert.equal(next.subcontracts.some(s => s.projectId === 'p-del'), false);
  assert.equal(next.terms['sc-wait'], undefined);
  assert.equal(next.outbox.includes('del-wait'), false);
  assert.equal(next.entries.some(e => e.id === 'keep-pay'), true);
  const csv = Ledger.toCSV(Ledger.countedEntries(next.entries, next.syncErrors), next.projects);
  assert.equal(csv.includes('del-wait'), false);
  assert.equal(csv.includes('keep-pay'), true);
  assert.equal(store().entries.some(e => e.id === 'del-pay'), true);
});

test('permanent delete leaves the foreman, every move, and the balance', () => {
  const src = store();
  /** @type {ForemanMove[]} */
  const moves = [
    { id: 'mv1', foremanId: 'fm1', kind: 'advance', amount: 100000, isReversal: false, docType: 'foremanMove' },
    { id: 'mv2', foremanId: 'fm1', kind: 'return', amount: 25000, isReversal: false, docType: 'foremanMove' },
  ];
  /** @type {SyncDoc[]} */
  const foremen = [{ id: 'fm1', name: 'حسن', projectId: 'p-del', docType: 'foreman' }];
  const spent = {
    id: 'keep-fm', projectId: 'p-keep', direction: 'expense', entryType: 'materials',
    amount: 15000, isReversal: false, foremanId: 'fm1',
  };
  /** @type {LedgerEntry[]} */
  const entries = src.entries.concat([spent]);
  const before = Ledger.foremanBalance('fm1', moves, entries);
  const packed = /** @type {LocalStore} */ (/** @type {unknown} */ (Object.assign({}, src, { entries, foremen, foremanMoves: moves })));
  const next = Sync.dropProjectLocal(packed, 'p-del', { dropPending: true });
  assert.deepEqual(next.foremen, foremen);
  assert.deepEqual(next.foremanMoves, moves);
  assert.equal(next.projects.some(p => p.id === 'p-del'), false);
  assert.equal(next.entries.some(row => row.id === 'keep-fm'), true);
  const after = Ledger.foremanBalance('fm1', moves, next.entries);
  assert.deepEqual(after, before);
  assert.equal(after.held, 60000);
  assert.equal(after.state, 'holding');
});

test('D1 a counted foreman expense blocks the delete and names the foreman', () => {
  const entries = [{ id: 'e-fm', projectId: 'p-del', direction: 'expense', entryType: 'materials', amount: 1000, isReversal: false, foremanId: 'fm1' }];
  const foremen = [{ id: 'fm1', name: 'حسن' }];
  const msg = Ledger.foremanDeleteBlock('p-del', entries, foremen, {});
  assert.equal(msg, 'لا يمكن الحذف: فيه مصاريف عهدة لـ حسن. سوِّ العهدة أو أرشف المشروع');
  assert.equal(Ledger.foremanDeleteBlock('p-del', entries, foremen, { 'e-fm': 'رُفض' }), '');
});

test('D2 a project with no foreman expense keeps an empty delete block', () => {
  const entries = [{ id: 'keep-pay', projectId: 'p-keep', direction: 'income', entryType: 'clientPayment', amount: 6000000, isReversal: false }];
  assert.equal(Ledger.foremanDeleteBlock('p-del', entries, [], {}), '');
  assert.equal(Ledger.guardedForemanDelete(Ledger.foremanDeleteBlock, 'p-del', entries, [], {}), '');
});

test('a foreman-expense check that cannot run blocks the delete', () => {
  const stop = 'لا يمكن الحذف: تعذر التحقق من مصاريف العهدة.';
  assert.equal(Ledger.guardedForemanDelete(null, 'p-del', [], [], {}), stop);
  assert.equal(Ledger.guardedForemanDelete(undefined, 'p-del', [], [], {}), stop);
  assert.equal(Ledger.guardedForemanDelete(() => { throw new Error('down'); }, 'p-del', [], [], {}), stop);
  assert.equal(Ledger.guardedForemanDelete(() => 1, 'p-del', [], [], {}), stop);
  assert.equal(Ledger.guardedForemanDelete(() => '', 'p-del', [], [], {}), '');
});

test('dropping a project keeps foremen and foreman moves, and the server delete list omits them', () => {
  const src = store();
  src.foremen = [{ id: 'fm1', name: 'حسن', projectId: 'p-del' }];
  src.foremanMoves = [{ id: 'mv1', foremanId: 'fm1', kind: 'advance', amount: 1000 }];
  const next = Sync.dropProjectLocal(src, 'p-del', { dropPending: true });
  assert.deepEqual(next.foremen, src.foremen);
  assert.deepEqual(next.foremanMoves, src.foremanMoves);
  const docs = Sync.projectDeleteDocs('p-del', {
    entryIds: ['e1'], subcontractIds: ['sc-del'], amendmentIds: ['am-del'], termIds: ['sc-del'], finance: true,
  });
  assert.equal(docs.some(row => row.collection === 'foremen' || row.collection === 'foremanMoves'), false);
});

test('removed ids follow the keep-rule for a synced, queued, and refused entry', () => {
  const src = {
    projects: [{ id: 'A', name: 'مشروع أ', status: 'active', currency: 'IQD', createdAtServer: 1 }],
    entries: [
      { id: 's', projectId: 'A', entryType: 'materials', amount: 10 },
      { id: 'q', projectId: 'A', entryType: 'materials', amount: 20 },
      { id: 'r', projectId: 'A', entryType: 'materials', amount: 30 },
    ],
    outbox: ['q'],
    syncErrors: { r: 'رُفض الإرسال لأن المشروع محذوف' },
  };
  const next = Sync.dropProjectLocal(src, 'A', { dropPending: false });
  assert.deepEqual(next.removed.projectIds, ['A']);
  assert.equal(next.removed.entryIds.includes('s'), true);
  assert.equal(next.removed.entryIds.includes('q'), false);
  assert.equal(next.removed.entryIds.includes('r'), false);
  assert.equal(next.entries.some(row => row.id === 'q'), true);
  assert.equal(next.entries.some(row => row.id === 'r'), true);
  assert.equal(next.entries.some(row => row.id === 's'), false);
});
