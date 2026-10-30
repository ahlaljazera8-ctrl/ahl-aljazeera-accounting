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
