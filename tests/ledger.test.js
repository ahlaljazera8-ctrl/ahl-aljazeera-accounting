const test = require('node:test'); const assert = require('node:assert/strict');
const L = require('../public/ledger.js');
const owner = { uid:'o', role:'owner', active:true }, site = { uid:'s', role:'site', active:true, assignedProjectIds:['a'] };
const projects = [{ id:'a', name:'مشروع أ' }, { id:'b', name:'مشروع ب' }];
let n = 0;
const E = (o = {}) => ({ id:'e' + (++n), projectId:'a', direction:'expense', entryType:'materials', amount:1000, currency:'IQD', entryDate:'2026-10-30', description:'', partyName:'', isReversal:false, createdAtDevice:1, createdAtServer:null, createdBy:'o', deviceId:'d', ...o });
const inc = o => E({ direction:'income', entryType:'clientPayment', ...o });
const ctx = (user, policy) => ({ user, projects, policy });

test('math: received, spent, profit, byType', () => {
  const t = L.totals([inc({ amount:5000 }), E({ amount:1000 }), E({ entryType:'labour', amount:500 }), E({ entryType:'subcontractor', amount:250 })]);
  assert.deepEqual([t.received, t.spent, t.profit], [5000, 1750, 3250]);
  assert.deepEqual(t.byType, { materials:1000, labour:500, subcontractor:250 });
});
test('general expense type (مصروف) counts as spent', () => {
  const lg = L.createLedger(); lg.append(E({ entryType:'expense', amount:400 }), ctx(owner)); lg.append(E({ entryType:'expense', amount:60, createdBy:'s' }), ctx(site));
  assert.equal(L.ENTRY_TYPES.expense.label, 'مصروف'); assert.equal(L.totals(lg.all()).spent, 460); assert.equal(L.totals(lg.all()).byType.expense, 460);
  assert.throws(() => lg.append(E({ entryType:'expense', direction:'income' }), ctx(owner)));
});
test('math: negative profit', () => assert.equal(L.totals([inc({ amount:1 }), E({ amount:3 })]).profit, -2));
test('math: empty', () => assert.deepEqual(L.totals([]).profit, 0));
test('amount must be positive integer', () => {
  const lg = L.createLedger();
  for (const a of [0, -5, 1.5, '100', NaN]) assert.throws(() => lg.append(E({ amount:a }), ctx(owner)));
});
test('amount uses the same IQD ceiling as the rules and rejects unsafe integers', () => {
  assert.equal(L.MAX_AMOUNT_IQD, 10000000000);
  const lg = L.createLedger();
  assert.doesNotThrow(() => lg.append(E({ amount: 10000000000 }), ctx(owner)));
  assert.throws(() => lg.append(E({ amount: 10000000001 }), ctx(owner)), /10,000,000,000/);
  assert.throws(() => lg.append(E({ amount: 1e20 }), ctx(owner)), /10,000,000,000/);
});
test('parseAmount keeps a positive integer, converts Arabic-Indic digits, and does not rewrite the rest', () => {
  const ok = (raw, amount) => {
    const parsed = L.parseAmount(raw);
    assert.equal(parsed.ok, true, raw);
    assert.equal(parsed.amount, amount, raw);
  };
  ok('7', 7);
  ok('٧', 7);
  ok('١٠', 10);
  ok('1,000', 1000);
  ok('10,000,000,000', 10000000000);
  for (const raw of ['-3', '1.5', '2,5', '0', '١.٥', '10000000001', '99999999999999999999', '']) {
    const parsed = L.parseAmount(raw);
    assert.equal(parsed.ok, false, raw);
    assert.equal(parsed.amount, undefined, raw);
    assert.match(parsed.error, /[\u0600-\u06FF]/, raw);
  }
  assert.match(L.parseAmount('-3').error, /صحيحاً/);
  assert.match(L.parseAmount('1.5').error, /صحيحاً/);
  assert.match(L.parseAmount('2,5').error, /صحيحاً/);
  assert.match(L.parseAmount('10000000001').error, /10,000,000,000/);
  assert.equal(L.parseAmount('0', { allowZero: true }).ok, true);
  assert.equal(L.parseAmount('0', { allowZero: true }).amount, 0);
});
test('direction must match entryType; unknown type rejected; currency IQD', () => {
  const lg = L.createLedger();
  assert.throws(() => lg.append(E({ entryType:'clientPayment' }), ctx(owner)));
  assert.throws(() => lg.append(E({ entryType:'general' }), ctx(owner)));
  assert.throws(() => lg.append(E({ currency:'USD' }), ctx(owner)));
});
test('createdBy must equal user; syncState not stored', () => {
  const lg = L.createLedger();
  assert.throws(() => lg.append(E({ createdBy:'x' }), ctx(owner)));
  assert.throws(() => lg.append(E({ syncState:'pending' }), ctx(owner)));
});
test('append-only: no update/delete API, entries frozen, duplicate id rejected', () => {
  const lg = L.createLedger(); const e = lg.append(E(), ctx(owner));
  assert.equal(lg.update, undefined); assert.equal(lg.delete, undefined); assert.equal(lg.remove, undefined);
  assert.throws(() => { 'use strict'; e.amount = 9; }); assert.equal(lg.all()[0].amount, 1000);
  const snap = lg.all(); snap.pop(); assert.equal(lg.all().length, 1);
  assert.throws(() => lg.append({ ...e }, ctx(owner)), /DUPLICATE/); assert.equal(lg.all().length, 1);
  assert.throws(() => { 'use strict'; lg.append = () => {}; });
});
test('reversal: positive amount, isReversal, reversesEntryId; sign only in profit', () => {
  const lg = L.createLedger(); const o = lg.append(E({ amount:50000 }), ctx(owner)); lg.append(inc({ amount:100000 }), ctx(owner));
  const r = lg.append(L.makeReversal(o, { id:'r1', user:owner, reason:'خطأ', now:2, deviceId:'d', entryDate:'2026-10-30' }), ctx(owner));
  assert.equal(r.amount, 50000); assert.equal(r.isReversal, true); assert.equal(r.reversesEntryId, o.id);
  assert.deepEqual([L.totals(lg.all()).spent, L.totals(lg.all()).profit], [0, 100000]);
});
test('reversal of income lowers received', () => {
  const lg = L.createLedger(); const o = lg.append(inc({ amount:700 }), ctx(owner));
  lg.append(L.makeReversal(o, { id:'r2', user:owner, reason:'x', now:2, deviceId:'d', entryDate:'2026-10-30' }), ctx(owner));
  assert.equal(L.totals(lg.all()).received, 0);
});
test('reversal rules: no double reversal, no reversing a reversal, must copy fields, needs reason & existing original', () => {
  const lg = L.createLedger(); const o = lg.append(E(), ctx(owner));
  const mk = id => L.makeReversal(o, { id, user:owner, reason:'x', now:2, deviceId:'d', entryDate:'2026-10-30' });
  assert.throws(() => lg.append({ ...mk('x1'), amount:999 }, ctx(owner)));
  assert.throws(() => lg.append({ ...mk('x2'), reversalReason:'' }, ctx(owner)));
  assert.throws(() => lg.append({ ...mk('x3'), reversesEntryId:'nope' }, ctx(owner)));
  const r = lg.append(mk('r'), ctx(owner));
  assert.throws(() => lg.append(mk('r-again'), ctx(owner)), /معكوس مسبقاً/);
  assert.throws(() => lg.append(L.makeReversal(r, { id:'rr', user:owner, reason:'x', now:3, deviceId:'d', entryDate:'2026-10-30' }), ctx(owner)), /قيد عكس/);
  assert.throws(() => lg.append(E({ reversesEntryId:o.id }), ctx(owner)));
});
test('site: client payment allowed by default (Ameer), blocked if flag off', () => {
  const lg = L.createLedger();
  assert.equal(L.DEFAULT_POLICY.siteCanCreateClientPayment, true);
  assert.doesNotThrow(() => lg.append(inc({ createdBy:'s' }), ctx(site)));
  assert.throws(() => lg.append(inc({ createdBy:'s' }), ctx(site, { ...L.DEFAULT_POLICY, siteCanCreateClientPayment:false })));
});
test('site visibility: only assigned projects, cannot write to others', () => {
  assert.deepEqual(L.visibleProjects(site, projects).map(p => p.id), ['a']);
  assert.equal(L.visibleProjects(owner, projects).length, 2);
  assert.throws(() => L.createLedger().append(E({ projectId:'b', createdBy:'s' }), ctx(site)));
  assert.equal(L.visibleProjects({ ...site, active:false }, projects).length, 0);
});
test('archived projects leave the open list and a site user cannot see them', () => {
  const rows = [
    { id:'a', name:'مشروع أ', status:'active' },
    { id:'b', name:'مشروع ب', status:'archived' },
    { id:'c', name:'مشروع ج', status:'closed' },
  ];
  const assigned = { ...site, assignedProjectIds:['a','b','c'] };
  assert.deepEqual(L.projectList(owner, rows, L.DEFAULT_POLICY, 'open').map(p => p.id), ['a','c']);
  assert.deepEqual(L.projectList(owner, rows, L.DEFAULT_POLICY, 'archived').map(p => p.id), ['b']);
  assert.deepEqual(L.visibleProjects(owner, rows).map(p => p.id), ['a','b','c']);
  assert.deepEqual(L.projectList(assigned, rows, L.DEFAULT_POLICY, 'open').map(p => p.id), ['a','c']);
  assert.deepEqual(L.projectList(assigned, rows, L.DEFAULT_POLICY, 'archived').map(p => p.id), ['a','c']);
  assert.equal(L.visibleEntries(assigned, [E({ id:'arch-entry', projectId:'b', createdBy:'s' })], rows).length, 0);
  assert.equal(L.visibleEntries(owner, [E({ id:'arch-owner', projectId:'b' })], rows).length, 1);
  assert.equal(L.nextProjectStatus(owner, rows[0], 'archive'), 'archived');
  assert.equal(L.nextProjectStatus(owner, rows[0], 'restore'), null);
  assert.equal(L.nextProjectStatus(owner, rows[1], 'archive'), null);
  assert.equal(L.nextProjectStatus(owner, rows[1], 'restore'), 'active');
  assert.equal(L.nextProjectStatus(owner, rows[2], 'archive'), 'archived');
  assert.equal(L.nextProjectStatus(owner, rows[2], 'restore'), null);
  assert.equal(L.nextProjectStatus(assigned, rows[0], 'archive'), null);
  assert.equal(L.nextProjectStatus({ ...owner, active:false }, rows[0], 'archive'), null);
  const lg = L.createLedger([E({ id:'kept', projectId:'b' })]);
  assert.equal(lg.all().length, 1);
  assert.equal(lg.all()[0].id, 'kept');
});
test('site visibility: own income visible, others\' income hidden, summary has no received/profit', () => {
  const own = inc({ amount:300, createdBy:'s' });
  const es = [inc({ amount:9000 }), own, E({ amount:100 }), E({ projectId:'b', amount:5 }), inc({ projectId:'b', createdBy:'s' })];
  const v = L.visibleEntries(site, es, projects);
  assert.deepEqual(v.map(e => e.id).sort(), [own.id, es[2].id].sort());
  const s = L.projectSummary(site, v);
  assert.equal(s.spent, 100); assert.ok(!('received' in s) && !('profit' in s));
  assert.equal(L.projectSummary(owner, es.filter(e => e.projectId === 'a')).profit, 9200);
});
test('CSV: owner only, header, BOM, escaping, signed amount, formula guard', () => {
  assert.equal(L.canExportCSV(site), false); assert.equal(L.canExportCSV(owner), true);
  assert.equal(L.canCreateProject(site), false);
  const o = E({ id:'c1', description:'سمنت, "50" كيس', amount:1200 });
  const r = L.makeReversal(o, { id:'c2', user:owner, reason:'=HYPERLINK()', now:2, deviceId:'d', entryDate:'2026-10-30' });
  const csv = L.toCSV([o, r], projects);
  assert.ok(csv.startsWith('\uFEFF' + L.CSV_COLS.join(',')));
  const lines = csv.slice(1).trim().split('\r\n'); assert.equal(lines.length, 3);
  assert.ok(lines[1].includes('"سمنت, ""50"" كيس"')); assert.ok(lines[1].includes('مشروع أ'));
  assert.ok(lines[1].includes(',1200,1200,')); assert.ok(lines[2].includes(',1200,-1200,'));
  assert.ok(lines[2].includes("'=HYPERLINK()")); assert.ok(lines[2].includes(',true,c1,'));
});

const R = (e, u) => L.makeReversal(e, { user:u, reason:'تصحيح', now:5, deviceId:'d', entryDate:'2026-10-30' });
test('rev: site reverses own entry = allowed (default policy)', () => {
  const lg = L.createLedger(); const mine = lg.append(E({ createdBy:'s' }), ctx(site));
  assert.equal(L.DEFAULT_POLICY.siteCanReverseOwn, true);
  const r = lg.append(R(mine, site), ctx(site)); assert.equal(r.id, 'rev_' + mine.id); assert.equal(r.amount, mine.amount);
});
test("rev: site reverses another user's entry = refused", () => {
  const lg = L.createLedger(); const o = lg.append(E({ createdBy:'o' }), ctx(owner));
  assert.throws(() => lg.append(R(o, site), ctx(site)), /العكس غير مسموح/);
});
test('rev: reversing a reversal = refused (site and owner)', () => {
  const lg = L.createLedger(); const mine = lg.append(E({ createdBy:'s' }), ctx(site)); const r = lg.append(R(mine, site), ctx(site));
  assert.throws(() => lg.append(R(r, site), ctx(site)), /قيد عكس/); assert.throws(() => lg.append(R(r, owner), ctx(owner)), /قيد عكس/);
});
test('rev: second reversal of same original = refused, for owner too; random id refused', () => {
  const lg = L.createLedger(); const mine = lg.append(E({ createdBy:'s' }), ctx(site)); lg.append(R(mine, site), ctx(site));
  assert.throws(() => lg.append(R(mine, owner), ctx(owner)), /معكوس مسبقاً/);
  const o2 = lg.append(E(), ctx(owner)); lg.append(R(o2, owner), ctx(owner));
  assert.throws(() => lg.append(R(o2, owner), ctx(owner)), /DUPLICATE/);
  const o3 = lg.append(E(), ctx(owner));
  assert.throws(() => lg.append({ ...R(o3, owner), id:'random' }, ctx(owner)), /rev_/);
});
test("rev: owner reverses anyone's entry = allowed", () => {
  const lg = L.createLedger(); const s1 = lg.append(E({ createdBy:'s' }), ctx(site)); const o1 = lg.append(inc(), ctx(owner));
  assert.doesNotThrow(() => lg.append(R(s1, owner), ctx(owner))); assert.doesNotThrow(() => lg.append(R(o1, owner), ctx(owner)));
  assert.equal(L.totals(lg.all()).profit, 0);
});
test('partyName is a trimmed string of at most 100 characters', () => {
  const lg = L.createLedger();
  assert.throws(() => lg.append(E({ partyName:'م'.repeat(101) }), ctx(owner)), /الجهة/);
  assert.throws(() => lg.append(E({ partyName:' مورد' }), ctx(owner)), /الجهة/);
  assert.throws(() => lg.append(E({ partyName:'مورد ' }), ctx(owner)), /الجهة/);
  assert.throws(() => lg.append(E({ partyName:'   ' }), ctx(owner)), /الجهة/);
  assert.throws(() => lg.append(E({ partyName:12 }), ctx(owner)), /الجهة/);
  const ok = lg.append(E({ partyName:'م'.repeat(100) }), ctx(owner));
  assert.equal(ok.partyName, 'م'.repeat(100));
  assert.doesNotThrow(() => lg.append(E({ partyName:'' }), ctx(owner)));
  const dropped = E(); delete dropped.partyName;
  assert.doesNotThrow(() => lg.append(dropped, ctx(owner)));
});
test('createdByName is the writer displayName, otherwise omitted', () => {
  const named = { uid:'o', role:'owner', active:true, displayName:'أمير' };
  const lg = L.createLedger();
  const e = lg.append(E({ createdByName:'أمير', partyName:'مورد حديد' }), ctx(named));
  assert.equal(e.createdByName, 'أمير');
  assert.equal(e.partyName, 'مورد حديد');
  assert.throws(() => lg.append(E({ createdByName:'سامي' }), ctx(named)), /المُسجِّل/);
  assert.throws(() => lg.append(E({ createdByName:'أمير' }), ctx(owner)), /المُسجِّل/);
  assert.throws(() => lg.append(E({ createdByName:'' }), ctx(named)), /المُسجِّل/);
  const sixty = 'ن'.repeat(60);
  const eighty = 'ن'.repeat(80);
  assert.equal(L.recorderName({ ...named, displayName:sixty }), sixty);
  assert.equal(L.recorderName({ ...named, displayName:eighty }), eighty);
  assert.doesNotThrow(() => lg.append(E({ createdByName:sixty }), ctx({ ...named, displayName:sixty })));
  assert.doesNotThrow(() => lg.append(E({ createdByName:eighty }), ctx({ ...named, displayName:eighty })));
  const tooLong = { ...named, displayName:'ن'.repeat(81) };
  assert.equal(L.recorderName(tooLong), '');
  assert.equal(L.recorderName({ ...named, displayName:'' }), '');
  assert.throws(() => lg.append(E({ createdByName:'ن'.repeat(81) }), ctx(tooLong)), /المُسجِّل/);
  assert.doesNotThrow(() => lg.append(E(), ctx(tooLong)));
  assert.equal(L.displayRecorder({}), '—');
  assert.equal(L.displayRecorder({ createdByName:'' }), '—');
  assert.equal(L.displayRecorder({ createdByName:'أحمد' }), 'أحمد');
  const rev = L.makeReversal(e, { user:named, reason:'خطأ', now:9, deviceId:'d', entryDate:'2026-10-30' });
  assert.equal(rev.createdByName, 'أمير');
  assert.equal(rev.partyName, 'مورد حديد');
  assert.equal(rev.createdBy, 'o');
  const anon = L.makeReversal(e, { user:owner, reason:'خطأ', now:9, deviceId:'d', entryDate:'2026-10-30' });
  assert.equal(Object.prototype.hasOwnProperty.call(anon, 'createdByName'), false);
});
test('entry export fields: owner vs site, and site omits hidden money', () => {
  const when = Date.parse('2026-10-01T09:00:00Z');
  const expense = E({
    id: 'ex1', createdBy: 's', createdByName: 'أحمد', amount: 8200000, description: 'أجور عمال',
    partyName: 'العمال', entryDate: '2026-10-06', createdAtDevice: when,
    contractAmount: 60000000, profit: 123, received: 40000000,
  });
  const hiddenPay = inc({ id: 'hid1', amount: 40000000, createdBy: 'o', createdByName: 'أمير', description: 'دفعة أولى', createdAtDevice: when });
  const ownPay = inc({ id: 'own1', amount: 2000000, createdBy: 's', createdByName: 'أحمد', description: 'دفعتي', createdAtDevice: when });
  const poisoned = [
    { id: 'a', name: 'مشروع أ', contractAmount: 60000000, profit: 9, received: 8, clientName: 'زبون سري' },
    { id: 'b', name: 'مشروع ب', contractAmount: 15000000 },
  ];
  const pack = { projects: poisoned, entries: [expense, hiddenPay, ownPay], finance: { a: { contractAmount: 60000000, profit: 1 } } };
  const ownerExpense = L.entryExportFields(owner, expense, pack);
  const siteExpense = L.entryExportFields(site, expense, pack);
  const keys = rows => rows.map(f => f.key);
  assert.deepEqual(keys(ownerExpense), keys(siteExpense));
  assert.deepEqual(keys(siteExpense), ['company', 'projectName', 'entryType', 'amount', 'entryDate', 'recordedAt', 'recorder', 'party', 'note', 'id']);
  assert.equal(siteExpense.find(f => f.key === 'company').value, 'أهل الجزيرة');
  assert.equal(siteExpense.find(f => f.key === 'projectName').value, 'مشروع أ');
  assert.equal(siteExpense.find(f => f.key === 'entryType').value, 'مواد');
  assert.equal(siteExpense.find(f => f.key === 'amount').value, '8,200,000 د.ع');
  assert.equal(siteExpense.find(f => f.key === 'entryDate').label, 'تاريخ القيد');
  assert.equal(siteExpense.find(f => f.key === 'entryDate').value, '2026-10-06');
  assert.equal(siteExpense.find(f => f.key === 'recordedAt').label, 'وقت التسجيل');
  assert.equal(siteExpense.find(f => f.key === 'recordedAt').value, '12:00:00');
  assert.equal(siteExpense.find(f => f.key === 'recorder').value, 'أحمد');
  assert.equal(siteExpense.find(f => f.key === 'note').value, 'أجور عمال');
  const siteJson = JSON.stringify(siteExpense);
  for (const banned of ['contractAmount', 'profit', 'received', 'totals', 'spent', 'byType', 'clientName', 'زبون سري', '60,000,000', '60000000', '40,000,000', '40000000', '15,000,000', '15000000', 'دفعة أولى', '2,000,000']) {
    assert.equal(siteJson.includes(banned), false, banned);
  }
  assert.equal(L.entryExportFields(site, hiddenPay, pack), null);
  assert.equal(L.entryToCSV(site, hiddenPay, pack), null);
  const ownerPay = L.entryExportFields(owner, hiddenPay, pack);
  assert.equal(ownerPay.find(f => f.key === 'amount').value, '40,000,000 د.ع');
  assert.equal(ownerPay.find(f => f.key === 'entryType').value, 'دفعة عميل');
  assert.equal(JSON.stringify(ownerPay).includes('contractAmount'), false);
  assert.equal(JSON.stringify(ownerPay).includes('60000000'), false);
  const siteOwn = L.entryExportFields(site, ownPay, pack);
  assert.equal(siteOwn.find(f => f.key === 'amount').value, '2,000,000 د.ع');
  assert.equal(JSON.stringify(siteOwn).includes('40,000,000'), false);
  assert.equal(JSON.stringify(siteOwn).includes('دفعة أولى'), false);
  const ownerRev = L.makeReversal(hiddenPay, { user: owner, reason: 'عكس دفعة 40,000,000', now: when + 5000, deviceId: 'd', entryDate: '2026-10-30' });
  const withRev = { ...pack, entries: [expense, hiddenPay, ownPay, ownerRev] };
  const ownerSeen = L.entryExportFields(owner, hiddenPay, withRev);
  const siteSeen = L.entryExportFields(site, ownPay, withRev);
  assert.equal(ownerSeen.find(f => f.key === 'reversalStatus').value, 'معكوس');
  assert.equal(ownerSeen.find(f => f.key === 'reversalReason').value, 'عكس دفعة 40,000,000');
  assert.equal(siteSeen.some(f => f.key === 'reversalStatus'), false);
  assert.equal(JSON.stringify(siteSeen).includes('عكس دفعة'), false);
  assert.equal(L.entryExportFields({ ...site, active: false }, expense, pack), null);
  const foreign = E({ id: 'foreign', projectId: 'b', createdBy: 's', createdAtDevice: when, amount: 4242 });
  const abroad = { ...pack, entries: pack.entries.concat([foreign]) };
  assert.equal(L.entryExportFields(site, foreign, abroad), null);
  const ownerAbroad = L.entryExportFields(owner, foreign, abroad);
  assert.equal(ownerAbroad.find(f => f.key === 'projectName').value, 'مشروع ب');
  assert.equal(ownerAbroad.find(f => f.key === 'amount').value, '4,242 د.ع');
  assert.equal(JSON.stringify(ownerAbroad).includes('contractAmount'), false);
});

test('entry export keeps the ledger date separate from the Baghdad clock', () => {
  const when = Date.parse('2026-10-01T09:00:06Z');
  const row = E({
    id: 'clock1', createdBy: 's', createdByName: 'أحمد', entryDate: '2026-10-06', createdAtDevice: when,
    description: 'أجور عمال (مثال)', amount: 8200000,
  });
  const fields = L.entryExportFields(site, row, { projects, entries: [row] });
  const date = fields.find(f => f.key === 'entryDate');
  const time = fields.find(f => f.key === 'recordedAt');
  assert.equal(date.label, 'تاريخ القيد');
  assert.equal(date.value, '2026-10-06');
  assert.equal(time.label, 'وقت التسجيل');
  assert.equal(time.value, '12:00:06');
  assert.equal(/^\d{2}:\d{2}:\d{2}$/.test(time.value), true);
  assert.equal(time.value.includes(date.value), false);
  assert.equal(time.value.includes('2026-10-01'), false);
  const csv = L.entryToCSV(site, row, { projects, entries: [row] });
  assert.ok(csv.includes('تاريخ القيد'));
  assert.ok(csv.includes('وقت التسجيل'));
  assert.ok(csv.includes('2026-10-06'));
  assert.ok(csv.includes('12:00:06'));
  assert.equal(csv.includes('2026-10-01'), false);
});

test('entry CSV: BOM, Arabic, commas and quotes', () => {
  const when = Date.parse('2026-10-01T09:00:00Z');
  const row = E({
    id: 'csv1', description: 'سمنت, "50" كيس', partyName: 'مورد "الأنوار"', createdByName: 'أمير',
    amount: 1200, createdAtDevice: when, entryDate: '2026-10-30',
  });
  const named = [{ id: 'a', name: 'مشروع, "أ"' }];
  const csv = L.entryToCSV(owner, row, { projects: named, entries: [row] });
  assert.equal(typeof csv, 'string');
  assert.equal(csv.charCodeAt(0), 0xFEFF);
  assert.equal(csv.includes('\r\n'), true);
  assert.ok(csv.includes('أهل الجزيرة'));
  assert.ok(csv.includes('"سمنت, ""50"" كيس"'));
  assert.ok(csv.includes('"مورد ""الأنوار"""'));
  assert.ok(csv.includes('"مشروع, ""أ"""'));
  assert.ok(csv.includes('"1,200 د.ع"'));
  assert.ok(csv.includes('12:00:00'));
  assert.equal(csv.includes('2026-10-01'), false);
  const tricky = E({ id: 'csv2', description: '=1,2', createdByName: 'أمير', createdAtDevice: when });
  const guarded = L.entryToCSV(owner, tricky, { projects, entries: [tricky] });
  assert.ok(guarded.includes(`"'=1,2"`));
  const expense = E({ id: 'ex2', createdBy: 's', amount: 50, createdByName: 'أحمد', createdAtDevice: when, description: 'ملاحظة' });
  const rev = L.makeReversal(expense, { user: owner, reason: 'مبلغ, "مكرر"', now: when, deviceId: 'd', entryDate: '2026-10-30' });
  const revCsv = L.entryToCSV(site, expense, { projects, entries: [expense, rev] });
  assert.ok(revCsv.includes('معكوس'));
  assert.ok(revCsv.includes('"مبلغ, ""مكرر"""'));
  assert.equal(revCsv.includes('contractAmount'), false);
});

test('project entry list: role fields, newest first, reversal, no hidden money', () => {
  const when = 1700000000000;
  const namedOwner = { ...owner, displayName: 'أمير' };
  const expense = E({
    id: 'ex1', createdBy: 's', createdByName: 'أحمد', amount: 8200000, description: 'secret 40,000,000',
    partyName: 'العمال', entryDate: '2026-10-06', createdAtDevice: when,
    contractAmount: 60000000, profit: 123, received: 40000000,
  });
  const older = E({ id: 'ex0', createdBy: 'o', createdByName: 'أمير', amount: 100, partyName: 'قديم', entryDate: '2026-10-01', createdAtDevice: when - 5000 });
  const hiddenPay = inc({ id: 'hid1', amount: 40000000, createdBy: 'o', createdByName: 'أمير', description: 'دفعة أولى', partyName: 'زبون سري', entryDate: '2026-10-02', createdAtDevice: when + 10 });
  const ownPay = inc({ id: 'own1', amount: 2000000, createdBy: 's', createdByName: 'أحمد', description: 'دفعتي', partyName: 'أنا', entryDate: '2026-10-12', createdAtDevice: when + 20 });
  const foreign = E({ id: 'foreign', projectId: 'b', createdBy: 's', amount: 4242, createdByName: 'أحمد', entryDate: '2026-10-08', createdAtDevice: when + 50, partyName: 'خارج' });
  const rev = L.makeReversal(expense, { user: namedOwner, reason: 'عكس فيه 40,000,000', now: when + 30, deviceId: 'd', entryDate: '2026-10-20' });
  const poisoned = [
    { id: 'a', name: 'مشروع أ', contractAmount: 60000000, profit: 9, received: 8, clientName: 'زبون سري' },
    { id: 'b', name: 'مشروع ب', contractAmount: 15000000 },
  ];
  const pack = { projects: poisoned, entries: [older, expense, hiddenPay, ownPay, foreign, rev], finance: { a: { contractAmount: 60000000, profit: 1, received: 9 } } };
  const allow = ['id', 'type', 'amount', 'entryDate', 'recorder', 'party', 'reversalStatus'];
  const ownerList = L.projectEntryList(namedOwner, 'a', pack);
  assert.equal(ownerList.reads, 0);
  assert.equal(ownerList.total, 5);
  assert.deepEqual(ownerList.rows.map(r => r.id), ['rev_ex1', 'own1', 'hid1', 'ex1', 'ex0']);
  for (const row of ownerList.rows) assert.deepEqual(Object.keys(row), allow);
  const revRow = ownerList.rows[0];
  assert.equal(revRow.type, 'تصحيح (قيد عكسي) · مواد');
  assert.equal(revRow.amount, '−8,200,000 د.ع');
  assert.equal(revRow.entryDate, '2026-10-20');
  assert.equal(revRow.recorder, 'أمير');
  assert.equal(revRow.party, 'العمال');
  assert.equal(revRow.reversalStatus, 'قيد عكسي');
  const original = ownerList.rows.find(r => r.id === 'ex1');
  assert.equal(original.reversalStatus, 'معكوس');
  assert.equal(original.type, 'مواد');
  assert.equal(original.amount, '8,200,000 د.ع');
  assert.equal(original.recorder, 'أحمد');
  assert.equal(JSON.stringify(ownerList).includes('contractAmount'), false);
  assert.equal(JSON.stringify(ownerList).includes('60000000'), false);
  assert.equal(JSON.stringify(ownerList).includes('secret'), false);
  const siteList = L.projectEntryList(site, 'a', pack);
  assert.equal(siteList.reads, 0);
  assert.deepEqual(siteList.rows.map(r => r.id), ['rev_ex1', 'own1', 'ex1', 'ex0']);
  assert.equal(siteList.rows.find(r => r.id === 'own1').type, 'دفعة عميل');
  assert.equal(siteList.rows.find(r => r.id === 'own1').amount, '2,000,000 د.ع');
  assert.equal(siteList.rows.find(r => r.id === 'own1').party, 'أنا');
  assert.equal(siteList.rows.find(r => r.id === 'own1').reversalStatus, '');
  const siteJson = JSON.stringify(siteList);
  for (const banned of ['contractAmount', 'profit', 'received', 'totals', 'spent', 'byType', 'clientName', '40,000,000', '40000000', '60,000,000', '60000000', '15,000,000', '15000000', 'دفعة أولى', 'زبون سري', 'خارج', '4,242', '4242', 'secret', 'المقبوض', 'ربح']) {
    assert.equal(siteJson.includes(banned), false, banned);
  }
  const hiddenRev = L.makeReversal(hiddenPay, { user: namedOwner, reason: 'عكس دفعة 40,000,000', now: when + 40, deviceId: 'd', entryDate: '2026-10-21' });
  const withHidden = L.projectEntryList(site, 'a', { ...pack, entries: pack.entries.concat([hiddenRev]) });
  assert.equal(withHidden.rows.some(r => r.id === 'rev_hid1'), false);
  assert.equal(withHidden.rows.find(r => r.id === 'hid1'), undefined);
  assert.equal(JSON.stringify(withHidden).includes('40,000,000'), false);
  assert.equal(JSON.stringify(withHidden).includes('عكس دفعة'), false);
  const tied = [
    E({ id: 'aa', createdAtDevice: 5, entryDate: '2026-10-02', amount: 2, createdByName: 'أمير' }),
    E({ id: 'cc', createdAtDevice: 5, entryDate: '2026-10-03', amount: 4, createdByName: 'أمير' }),
    E({ id: 'bb', createdAtDevice: 5, entryDate: '2026-10-03', amount: 3, createdByName: 'أمير' }),
  ];
  assert.deepEqual(L.projectEntryList(owner, 'a', { projects, entries: tied }).rows.map(r => r.id), ['cc', 'bb', 'aa']);
});

test('project entry list: paging stays in memory and costs no reads', () => {
  assert.equal(L.PROJECT_ENTRY_PAGE, 50);
  const when = 1800000000000;
  const many = [];
  for (let i = 0; i < 120; i++) {
    many.push(E({
      id: 'm' + String(i).padStart(3, '0'), amount: 1000 + i, createdAtDevice: when + i,
      entryDate: '2026-11-01', partyName: 'ح' + i, createdByName: 'أمير', createdBy: 'o',
      contractAmount: 60000000, profit: 5,
    }));
  }
  const other = E({ id: 'other', projectId: 'b', amount: 999, createdAtDevice: when + 9999, createdBy: 'o', createdByName: 'أمير', partyName: 'سوق' });
  const ctx = { projects, entries: many.concat([other]), finance: { a: { contractAmount: 60000000 } } };
  const first = L.projectEntryList(owner, 'a', ctx);
  assert.equal(first.rows.length, 50);
  assert.equal(first.total, 120);
  assert.equal(first.reads, 0);
  assert.equal(first.rows[0].id, 'm119');
  assert.equal(first.rows[49].id, 'm070');
  assert.equal(first.rows.some(r => r.id === 'other'), false);
  const wider = L.projectEntryList(owner, 'a', ctx, { limit: 100 });
  assert.equal(wider.rows.length, 100);
  assert.equal(wider.rows[50].id, 'm069');
  assert.equal(wider.rows[99].id, 'm020');
  assert.equal(wider.reads, 0);
  const all = L.projectEntryList(owner, 'a', ctx, { limit: 1000 });
  assert.equal(all.rows.length, 120);
  assert.equal(all.rows[119].id, 'm000');
  const sitePage = L.projectEntryList(site, 'a', ctx, { limit: 50 });
  assert.equal(sitePage.total, 120);
  assert.equal(sitePage.rows.length, 50);
  assert.equal(sitePage.reads, 0);
  assert.equal(JSON.stringify(sitePage).includes('999'), false);
  assert.equal(JSON.stringify(sitePage).includes('سوق'), false);
  assert.equal(JSON.stringify(sitePage).includes('contractAmount'), false);
  assert.equal(JSON.stringify(sitePage).includes('60000000'), false);
  assert.equal(L.projectEntryList(owner, 'a', ctx, { limit: -1 }).rows.length, 50);
  assert.equal(L.projectEntryList(owner, 'a', ctx, { limit: 0 }).rows.length, 0);
  assert.equal(L.projectEntryList(owner, 'a', ctx, { limit: 0 }).total, 120);
});

test('project entry list: empty, inactive, and unassigned projects', () => {
  const row = E({ id: 'only-b', projectId: 'b', createdBy: 's', amount: 4242, createdByName: 'أحمد' });
  const ctx = { projects, entries: [row] };
  const empty = L.projectEntryList(owner, 'a', ctx);
  assert.deepEqual(empty.rows, []);
  assert.equal(empty.total, 0);
  assert.equal(empty.reads, 0);
  assert.equal(L.projectEntryList(site, 'b', ctx), null);
  assert.equal(L.projectEntryList(site, 'missing', ctx), null);
  assert.equal(L.projectEntryList({ ...site, active: false }, 'a', ctx), null);
  assert.equal(L.projectEntryList({ ...owner, active: false }, 'a', ctx), null);
  assert.equal(L.projectEntryList(null, 'a', ctx), null);
  assert.equal(L.projectEntryList({ uid: 's', role: 'site', active: true, assignedProjectIds: [] }, 'a', ctx), null);
});

test('screen totals and export skip a server rejection and keep an unsent entry', () => {
  const accepted = E({ id: 'acc', amount: 1000, createdAtServer: 5, description: 'مقبول' });
  const pending = E({ id: 'pend', amount: 2000, createdAtServer: null, description: 'ينتظر' });
  const rejected = E({ id: 'bad', amount: 9000, createdAtServer: null, description: 'مرفوض من الخادم' });
  const errors = { bad: 'رُفض الإرسال' };
  const counted = L.countedEntries([accepted, pending, rejected], errors);
  assert.deepEqual(counted.map(e => e.id), ['acc', 'pend']);
  assert.equal(L.totals(counted).spent, 3000);
  assert.equal(L.totals([accepted, pending, rejected]).spent, 12000);
  const csv = L.toCSV(counted, projects);
  assert.equal(csv.includes('bad'), false);
  assert.equal(csv.includes('مرفوض من الخادم'), false);
  assert.equal(csv.includes('acc'), true);
  assert.equal(csv.includes('pend'), true);
  const ctx = { projects, entries: [accepted, pending, rejected], syncErrors: errors };
  assert.equal(L.entryExportFields(owner, rejected, ctx), null);
  assert.equal(L.entryToCSV(owner, rejected, ctx), null);
  assert.ok(L.entryExportFields(owner, accepted, ctx).some(f => f.key === 'id' && f.value === 'acc'));
  assert.ok(L.entryExportFields(owner, pending, ctx).some(f => f.key === 'amount'));
  assert.equal(L.entryToCSV(owner, accepted, ctx).includes('مقبول'), true);
});

test('view-all counts the same entries as the screen totals', () => {
  const accepted = E({ id: 'acc', amount: 1000, createdAtDevice: 30, createdAtServer: 5, description: 'مقبول' });
  const pending = E({ id: 'pend', amount: 2000, createdAtDevice: 20, createdAtServer: null, description: 'ينتظر' });
  const rejected = E({ id: 'bad', amount: 9000, createdAtDevice: 40, createdAtServer: null, description: 'مرفوض من الخادم' });
  const errors = { bad: 'رُفض الإرسال' };
  const entries = [accepted, pending, rejected];
  const ctx = { projects, entries, syncErrors: errors };
  const list = L.projectEntryList(owner, 'a', ctx, { limit: 50 });
  assert.deepEqual(list.rows.map(r => r.id), ['acc', 'pend']);
  assert.equal(list.total, 2);
  assert.equal(list.rows.length, 2);
  assert.equal(JSON.stringify(list).includes('bad'), false);
  assert.equal(JSON.stringify(list).includes('9,000'), false);
  assert.equal(JSON.stringify(list).includes('مرفوض'), false);
  assert.equal(list.rows.some(r => r.amount.includes('2,000')), true);
  assert.equal(list.rows.some(r => r.amount.includes('1,000')), true);
  const siteList = L.projectEntryList(site, 'a', ctx, { limit: 50 });
  assert.deepEqual(siteList.rows.map(r => r.id), ['acc', 'pend']);
  assert.equal(siteList.total, 2);
  const hidden = L.projectEntryList(owner, 'a', ctx, { limit: 0 });
  assert.deepEqual(hidden.rows, []);
  assert.equal(hidden.total, 2);
  const original = E({ id: 'orig', amount: 4000, createdAtDevice: 10, createdAtServer: 5 });
  const rev = E({ id: 'rev', amount: 4000, createdAtDevice: 50, createdAtServer: null, isReversal: true, reversesEntryId: 'orig', description: 'عكس مرفوض' });
  const dropped = L.projectEntryList(owner, 'a', { projects, entries: [original, rev], syncErrors: { rev: 'رُفض الإرسال' } });
  assert.deepEqual(dropped.rows.map(r => r.id), ['orig']);
  assert.equal(dropped.total, 1);
  assert.equal(dropped.rows[0].reversalStatus, '');
});

test('CSV populates partyName and createdByName', () => {
  const e = E({ id:'payee1', description:'حديد', partyName:'مورد حديد', createdByName:'أمير' });
  const csv = L.toCSV([e], projects);
  assert.equal(csv.startsWith('\uFEFF' + L.CSV_COLS.join(',')), true);
  assert.equal(L.CSV_COLS.includes('partyName') && L.CSV_COLS.includes('createdByName'), true);
  const cells = csv.slice(1).split('\r\n')[1].split(',');
  assert.equal(cells[L.CSV_COLS.indexOf('partyName')], 'مورد حديد');
  assert.equal(cells[L.CSV_COLS.indexOf('createdByName')], 'أمير');
  assert.equal(cells[L.CSV_COLS.indexOf('description')], 'حديد');
});
