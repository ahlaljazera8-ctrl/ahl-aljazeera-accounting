const test = require('node:test');
const assert = require('node:assert/strict');
const Ledger = require('../public/ledger.js');
const DomSafe = require('../public/dom-safe.js');

/** @type {any} */
const g = globalThis;
g.Ledger = Ledger;
g.DomSafe = DomSafe;
const UI = require('../public/foremen.js');

const store = {
  foremen: [{ id: 'fm-hassan', docType: 'foreman', name: 'حسن', note: 'خلفة الكهرباء', projectId: 'p-gone' }],
  foremanMoves: [],
  entries: [{ id: 'e-hassan', projectId: 'p-school', foremanId: 'fm-hassan', direction: 'expense', entryType: 'materials', amount: 35000, isReversal: false }],
  projects: [{ id: 'p-school', name: 'مشروع المدرسة', status: 'active' }],
  outbox: ['e-hassan'],
  syncErrors: {},
};

g.K = {
  foremen: 'foremen', foremanMoves: 'foremanMoves', entries: 'entries', projects: 'projects',
  outbox: 'outbox', syncErrors: 'syncErrors',
};
g.get = (key, fallback) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallback);
g.set = (key, value) => { store[key] = value; return Promise.resolve(); };
g.me = () => ({ uid: 'u-ameer', role: 'owner', active: true });
g.uuid = () => 'fm-new';
g.today = () => '2026-11-03';
g.deviceId = 'phone';
g.demoRole = () => '';
g.flushRemote = () => Promise.resolve();
g.sendNow = () => {};

test('settleGuard rejects a nowMs that is not a finite number', () => {
  const base = { outbox: [], moves: [], entries: [], lastSyncMs: 5 };
  for (const nowMs of [undefined, null, NaN, Infinity, -Infinity, '1']) {
    assert.throws(() => Ledger.settleGuard('fm1', /** @type {any} */ (Object.assign({}, base, { nowMs }))), /nowMs/);
  }
  const ok = Ledger.settleGuard('fm1', Object.assign({}, base, { nowMs: 5 }));
  assert.equal(ok.stale, false);
});

test('a missing pull says the app has not been updated since it opened', () => {
  assert.equal(UI.syncLine(0), 'لم يُحدَّث منذ فتح التطبيق');
  assert.match(UI.syncLine(1700000000000), /^آخر تحديث من الخادم: /);
});

test('settle text follows the amount and an over-settle warns', () => {
  const exact = UI.settleParts('settle', 35000, 35000);
  assert.equal(exact.amount, '35,000');
  assert.match(exact.after, /يصبح الرصيد صفراً/);
  const partial = UI.settleParts('settle', 10000, 35000);
  assert.equal(partial.amount, '10,000');
  assert.match(partial.after, /10,000|25,000/);
  assert.match(partial.after, /يبقى مستحق/);
  const over = UI.settleParts('settle', 50000, 35000);
  assert.equal(over.amount, '50,000');
  assert.equal(over.after.includes('صفراً'), false);
});

test('the settle sheet passes a finite nowMs and shows the not-updated line', () => {
  const seen = [];
  const orig = Ledger.settleGuard;
  Ledger.settleGuard = (id, opts) => { seen.push(opts.nowMs); return orig(id, opts); };
  const state = { fmKind: 'settle', fmAmount: '50000' };
  const views = {};
  UI.install({
    views,
    titles: {},
    state,
    render() {},
    esc: s => String(s ?? ''),
    money: n => String(n),
    queueDoc() {},
    confirmShell: inner => inner,
    lastSyncAt: () => 0,
  });
  const html = views.foremanmove('fm-hassan');
  Ledger.settleGuard = orig;
  assert.equal(seen.length, 1);
  assert.equal(Number.isFinite(seen[0]), true);
  assert.match(html, /لم يُحدَّث منذ فتح التطبيق/);
  assert.match(html, /50,000/);
  assert.match(html, /المبلغ أكبر من المستحق/);
  assert.match(html, /المشروع الافتراضي محذوف/);
  assert.match(html, /تحديث الآن/);
  assert.match(html, /قيد واحد/);
});

test('deleting a project is blocked while a counted foreman expense remains', () => {
  const people = /** @type {any} */ (store.foremen);
  const msg = UI.blockedDeleteMessage('p-school', store.entries, people, {});
  assert.match(msg, /لا يمكن الحذف: فيه مصاريف عهدة لـ حسن/);
  assert.match(msg, /سوِّ العهدة أو أرشف المشروع/);
  assert.equal(UI.blockedDeleteMessage('p-school', store.entries, people, { 'e-hassan': 'رُفض' }), '');
  assert.equal(UI.blockedDeleteMessage('p-other', store.entries, people, {}), '');
});
