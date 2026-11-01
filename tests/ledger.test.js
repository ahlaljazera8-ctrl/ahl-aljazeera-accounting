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
