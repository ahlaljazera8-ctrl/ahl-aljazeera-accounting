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
  assert.equal(UI.syncLine(1700000000000, () => '3 نوفمبر · 14:05'), 'آخر تحديث من الخادم: 3 نوفمبر · 14:05');
});

test('settle text follows the amount and an over-settle warns', () => {
  const exact = UI.settleParts('settle', 35000, 35000);
  assert.equal(exact.amount, '35,000');
  assert.equal(exact.tail, ' د.ع بتاريخ اليوم. ');
  assert.equal(exact.after, 'بعده يصبح الرصيد صفراً. لا يُحذف القيد: الخطأ يُصحَّح بقيد عكسي.');
  const partial = UI.settleParts('settle', 10000, 35000);
  assert.equal(partial.amount, '10,000');
  assert.equal(partial.after, 'بعده يبقى مستحق 25,000 د.ع. لا يُحذف القيد: الخطأ يُصحَّح بقيد عكسي.');
  const over = UI.settleParts('settle', 50000, 35000);
  assert.equal(over.amount, '50,000');
  assert.equal(over.after, 'لا يُحذف القيد: الخطأ يُصحَّح بقيد عكسي.');
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
    confirmShell: (inner, labelId) => '<div role="dialog" aria-labelledby="' + labelId + '">' + inner + '</div>',
    lastSyncAt: () => 0,
    formatSyncTime: () => 'unused',
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
  assert.match(html, /aria-labelledby="fm-sheet-title"/);
  assert.match(html, /id="fm-copy" aria-live="polite"/);
  assert.match(html, /id="fm-over" class="warnbox" aria-live="polite"/);
  assert.match(html, /صرف حسن من جيبه 35,000/);
  assert.equal(html.includes('>·<bdi'), false);
});

test('a fresh pull has no refresh button and a stale pull does', () => {
  const saved = store.outbox;
  store.outbox = [];
  const views = {};
  const base = {
    views, titles: {}, state: { fmKind: 'settle', fmAmount: '35000' }, render() {},
    esc: s => String(s ?? ''), money: n => String(n), queueDoc() {},
    confirmShell: inner => inner, formatSyncTime: () => '3 نوفمبر · 14:05',
  };
  UI.install(Object.assign({}, base, { lastSyncAt: () => Date.now() - 5 * 60 * 1000 }));
  const fresh = views.foremanmove('fm-hassan');
  UI.install(Object.assign({}, base, { lastSyncAt: () => Date.now() - 11 * 60 * 1000 }));
  const stale = views.foremanmove('fm-hassan');
  store.outbox = saved;
  assert.match(fresh, /آخر تحديث من الخادم: 3 نوفمبر · 14:05/);
  assert.equal(fresh.includes('تحديث الآن'), false);
  assert.equal(fresh.includes('warnbox" id="fm-sync"'), false);
  assert.match(stale, /warnbox" id="fm-sync"/);
  assert.match(stale, /تحديث الآن/);
  assert.equal(stale.includes('لم يُحدَّث منذ فتح التطبيق'), false);
});

test('a move without a note does not keep a stray separator', () => {
  const views = {};
  UI.install({
    views, titles: {}, state: {}, render() {},
    esc: s => String(s ?? ''), money: n => String(n), queueDoc() {},
    confirmShell: inner => inner, lastSyncAt: () => 0, formatSyncTime: () => '',
  });
  const html = views.foreman('fm-hassan');
  assert.equal(html.includes('>·<bdi'), false);
  assert.match(html, /<bdi class="num">/);
  assert.match(html, /class="kv fm-rule owe"/);
});
