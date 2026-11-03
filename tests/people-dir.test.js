const test = require('node:test');
const assert = require('node:assert/strict');
const PeopleDir = require('../public/people-dir.js');

/**
 * @param {string} uid
 * @param {Record<string, unknown>} [extra]
 */
function row(uid, extra) {
  return Object.assign({
    uid: uid,
    displayName: uid,
    email: uid + '@x',
    role: 'site',
    active: true,
    assignedProjectIds: ['p2', 'p1'],
  }, extra || {});
}

/**
 * @param {{ now?: number, online?: boolean, timeoutMs?: number, timeout?: (p: Promise<unknown>, ms: number) => Promise<unknown>, load?: () => Promise<unknown>, stored?: any[], rows?: any[] }} [opts]
 */
function harness(opts) {
  const o = opts || {};
  const calls = [];
  const writes = [];
  const stamps = [];
  let now = o.now == null ? 10000 : o.now;
  let online = o.online !== false;
  let stored = (o.stored || []).slice();
  const loader = PeopleDir.createLoader(/** @type {PeopleLoaderDeps} */ ({
    now: () => now,
    online: () => online,
    timeoutMs: o.timeoutMs || PeopleDir.TIMEOUT_MS,
    timeout: o.timeout || (p => p),
    load: () => {
      calls.push(now);
      return o.load ? o.load() : Promise.resolve(o.rows || []);
    },
    read: () => stored.slice(),
    write: rows => { writes.push(rows); stored = rows.slice(); },
    stamp: ms => { stamps.push(ms); },
  }));
  return {
    loader, calls, writes, stamps,
    setNow: n => { now = n; },
    setOnline: v => { online = v; },
    stored: () => stored,
  };
}

test('samePeople compares sorted ids and shown fields only', () => {
  const left = [row('b', { createdBy: 'z', createdAtServer: 1 }), row('a', { assignedProjectIds: ['p1'] })];
  const right = [row('a', { assignedProjectIds: ['p1'], createdAtServer: 9 }), row('b', { assignedProjectIds: ['p1', 'p2'] })];
  assert.equal(PeopleDir.samePeople(left, right), true);
  assert.equal(PeopleDir.samePeople(left, [row('b'), row('a', { displayName: 'آخر' })]), false);
  assert.equal(PeopleDir.samePeople(left, [row('b', { email: 'other@x' })]), false);
  assert.equal(PeopleDir.samePeople(left, [row('b', { role: 'owner' })]), false);
  assert.equal(PeopleDir.samePeople(left, [row('b', { active: false })]), false);
  assert.equal(PeopleDir.samePeople(left, [row('b', { assignedProjectIds: ['p1'] })]), false);
  assert.equal(PeopleDir.samePeople([{ displayName: 'بلا معرّف' }], []), true);
});

test('loadPlan allows one start, then cooldown, and bypasses it for online and retry', () => {
  const base = { inflight: false, failedAt: 1000, online: true };
  assert.equal(PeopleDir.loadPlan({ inflight: true, failedAt: 0, online: true }, 2000, 'retry'), 'inflight');
  assert.equal(PeopleDir.loadPlan(base, 1000 + PeopleDir.COOLDOWN_MS - 1, 'render'), 'cooldown');
  assert.equal(PeopleDir.loadPlan(base, 1000 + PeopleDir.COOLDOWN_MS, 'render'), 'start');
  assert.equal(PeopleDir.loadPlan({ inflight: false, failedAt: 0, online: false }, 5000, 'render'), 'offline');
  assert.equal(PeopleDir.loadPlan({ inflight: false, failedAt: 1000, online: false }, 1001, 'online'), 'offline');
  assert.equal(PeopleDir.loadPlan(base, 1001, 'online'), 'start');
  assert.equal(PeopleDir.loadPlan({ inflight: false, failedAt: 1000, online: false }, 1001, 'retry'), 'start');
  const fresh = { inflight: false, failedAt: 0, online: true, syncedAt: 1000 };
  assert.equal(PeopleDir.loadPlan(fresh, 1000 + PeopleDir.SUCCESS_TTL_MS - 1, 'render'), 'fresh');
  assert.equal(PeopleDir.loadPlan(fresh, 1000 + PeopleDir.SUCCESS_TTL_MS, 'render'), 'start');
  assert.equal(PeopleDir.loadPlan(fresh, 1001, 'retry'), 'start');
  assert.equal(PeopleDir.loadPlan(fresh, 1001, 'online'), 'start');
  assert.equal(PeopleDir.loadPlan({ inflight: false, failedAt: 1000, online: true, syncedAt: 1000 }, 1001, 'render'), 'cooldown');
  assert.equal(PeopleDir.COOLDOWN_MS, 8000);
  assert.equal(PeopleDir.TIMEOUT_MS, 8000);
  assert.equal(PeopleDir.SUCCESS_TTL_MS, 30000);
});

test('a stale generation does not replace the previous directory', () => {
  const prev = [row('kept')];
  const applied = PeopleDir.applyPeople(1, 2, prev, [row('late')]);
  assert.equal(applied.stale, true);
  assert.equal(applied.changed, false);
  assert.equal(applied.next[0].uid, 'kept');
  assert.equal(PeopleDir.acceptGeneration(2, 2), true);
  assert.equal(PeopleDir.shouldRedraw({ stale: true, changed: true }), false);
});

test('a failed render cycle calls listUsers once', async () => {
  let rejectLoad;
  let n = 0;
  const h = harness({
    load: () => {
      n += 1;
      if (n === 1) return new Promise((_, no) => { rejectLoad = no; });
      return Promise.reject(new Error('down'));
    },
  });
  const first = h.loader.run('render');
  const second = h.loader.run('render');
  assert.equal(first, second);
  assert.equal(h.calls.length, 1);
  rejectLoad(new Error('down'));
  await assert.rejects(() => first, /down/);
  await assert.rejects(() => second, /down/);
  assert.equal(h.calls.length, 1);
  assert.equal(h.writes.length, 0);
  assert.equal(h.stamps.length, 0);
  assert.equal(h.loader.failed(), true);
  const cooled = await h.loader.run('render');
  assert.equal(cooled.skipped, 'cooldown');
  assert.equal(h.calls.length, 1);
  await assert.rejects(() => h.loader.run('retry'), /down/);
  assert.equal(h.calls.length, 2);
  await assert.rejects(() => h.loader.run('online'), /down/);
  assert.equal(h.calls.length, 3);
});

test('a late result after the timeout does not write users', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const h = harness({
    load: () => pending,
    timeout: () => Promise.reject(Object.assign(new Error('timeout'), { timeout: true })),
  });
  await assert.rejects(() => h.loader.run('retry'), /timeout/);
  release([row('late')]);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(h.writes.length, 0);
  assert.equal(h.stamps.length, 0);
  assert.deepEqual(h.stored(), []);
  assert.equal(h.loader.failed(), true);
});

test('a newer load wins and the older result does not write', async () => {
  /** @type {((rows: any[]) => void) | undefined} */
  let first;
  /** @type {((rows: any[]) => void) | undefined} */
  let second;
  let n = 0;
  const h = harness({
    load: () => new Promise(resolve => {
      n += 1;
      if (n === 1) first = resolve;
      else second = resolve;
    }),
  });
  const older = h.loader.run('retry');
  h.loader.reset();
  const newer = h.loader.run('retry');
  assert.equal(h.calls.length, 2);
  if (!first || !second) throw new Error('both loads should be waiting');
  first([row('old')]);
  second([row('new')]);
  const oldResult = await older;
  const newResult = await newer;
  assert.equal(oldResult.stale, true);
  assert.equal(oldResult.changed, false);
  assert.equal(newResult.changed, true);
  assert.equal(h.writes.length, 1);
  assert.equal(h.stored()[0].uid, 'new');
});

test('an identical directory does not write and does not redraw', async () => {
  const stored = [row('a'), row('b', { createdBy: 'seed' })];
  const h = harness({
    stored: stored,
    rows: [row('b', { createdAtServer: 5 }), row('a')],
  });
  const result = await h.loader.run('render');
  assert.equal(result.changed, false);
  assert.equal(result.stale, false);
  assert.equal(h.writes.length, 0);
  assert.equal(h.stamps.length, 1);
  assert.equal(h.loader.failed(), false);
  assert.equal(PeopleDir.shouldRedraw(result, false), false);
  assert.equal(PeopleDir.shouldRedraw({ skipped: 'cooldown', changed: false }, true), false);
  assert.equal(PeopleDir.shouldRedraw(result, true), true);
});

test('a changed directory writes once', async () => {
  const h = harness({ stored: [row('a')], rows: [row('a', { displayName: 'أمير' })] });
  const result = await h.loader.run('render');
  assert.equal(result.changed, true);
  assert.equal(h.writes.length, 1);
  assert.equal(h.stored()[0].displayName, 'أمير');
  assert.equal(PeopleDir.shouldRedraw(result, false), true);
});

test('offline does not call ensureFirebase and a failure never writes', async () => {
  let ensureFirebaseCalls = 0;
  const h = harness({
    online: false,
    stored: [row('a')],
    load: () => { ensureFirebaseCalls += 1; return Promise.resolve([row('b')]); },
  });
  const skipped = await h.loader.run('render');
  assert.equal(skipped.skipped, 'offline');
  assert.equal(ensureFirebaseCalls, 0);
  assert.equal(h.calls.length, 0);
  assert.equal(h.writes.length, 0);
  const failing = harness({
    load: () => Promise.reject(new Error('down')),
    stored: [row('a')],
  });
  await assert.rejects(() => failing.loader.run('render'), /down/);
  assert.equal(failing.writes.length, 0);
  assert.equal(failing.stored()[0].uid, 'a');
});

test('a retry does not keep an in-flight list from before the save', async () => {
  /** @type {((rows: any[]) => void) | undefined} */
  let first;
  /** @type {((rows: any[]) => void) | undefined} */
  let second;
  let n = 0;
  const h = harness({
    stored: [row('old')],
    load: () => new Promise(resolve => {
      n += 1;
      if (n === 1) first = resolve;
      else second = resolve;
    }),
  });
  const background = h.loader.run('render');
  const save = h.loader.run('retry');
  assert.notEqual(background, save);
  assert.equal(h.calls.length, 2);
  if (!first || !second) throw new Error('both loads should be waiting');
  first([row('stale')]);
  second([row('saved', { displayName: 'جديد' })]);
  const oldResult = await background;
  const saveResult = await save;
  assert.equal(oldResult.stale, true);
  assert.equal(oldResult.changed, false);
  assert.equal(saveResult.changed, true);
  assert.equal(h.writes.length, 1);
  assert.equal(h.stored()[0].uid, 'saved');
  assert.equal(h.stored()[0].displayName, 'جديد');
});

test('a fresh directory skips render and still loads for retry and online', async () => {
  const h = harness({ stored: [row('a')], rows: [row('a')] });
  const first = await h.loader.run('render');
  assert.equal(first.changed, false);
  assert.equal(h.calls.length, 1);
  const again = await h.loader.run('render');
  assert.equal(again.skipped, 'fresh');
  assert.equal(h.calls.length, 1);
  await h.loader.run('retry');
  assert.equal(h.calls.length, 2);
  await h.loader.run('online');
  assert.equal(h.calls.length, 3);
  h.setNow(10000 + PeopleDir.SUCCESS_TTL_MS);
  await h.loader.run('render');
  assert.equal(h.calls.length, 4);
});

test('offline and an online failure use different last-update lines', () => {
  assert.equal(PeopleDir.syncNoteLead(true, false), 'غير متصل');
  assert.equal(PeopleDir.syncNoteLead(true, true), 'غير متصل');
  assert.equal(PeopleDir.syncNoteLead(false, true), 'تعذّر التحديث');
  assert.equal(PeopleDir.syncNoteLead(false, false), '');
  assert.equal(PeopleDir.syncNote('غير متصل', '3 نوفمبر · 12:00 م'), 'غير متصل · آخر تحديث: 3 نوفمبر · 12:00 م');
  assert.equal(PeopleDir.syncNote('تعذّر التحديث', '3 نوفمبر · 12:00 م'), 'تعذّر التحديث · آخر تحديث: 3 نوفمبر · 12:00 م');
  assert.equal(PeopleDir.OFFLINE_LEAD, 'غير متصل');
  assert.equal(PeopleDir.UPDATE_LEAD, 'تعذّر التحديث');
  assert.equal(PeopleDir.LOAD_ERROR, 'تعذّر تحميل الأشخاص. تحقّق من الاتصال.');
  assert.equal(PeopleDir.RETRY_LABEL, 'إعادة المحاولة');
  assert.equal(PeopleDir.RENDER_ERROR, 'حدث خطأ في العرض. أعد فتح الصفحة.');
});

test('a stamped empty directory still offers a retry', () => {
  assert.equal(PeopleDir.directoryView(0, 5000, true, false), 'retry');
  assert.equal(PeopleDir.directoryView(0, 5000, false, true), 'retry');
  assert.equal(PeopleDir.directoryView(0, 0, true, false), 'error');
  assert.equal(PeopleDir.directoryView(2, 5000, true, false), 'note');
  assert.equal(PeopleDir.directoryView(0, 5000, false, false), 'ready');
});

test('the timeout path rejects and a late list does not write', async () => {
  /** @type {((rows: any[]) => void) | undefined} */
  let release;
  const h = harness({
    timeoutMs: 30,
    timeout: (p, ms) => {
      let timer;
      return Promise.race([
        p,
        new Promise((_, no) => { timer = setTimeout(() => no(Object.assign(new Error('timeout'), { timeout: true })), ms); }),
      ]).finally(() => clearTimeout(timer));
    },
    load: () => new Promise(resolve => { release = resolve; }),
  });
  await assert.rejects(() => h.loader.run('render'), /timeout/);
  if (!release) throw new Error('the load should be waiting');
  release([row('late')]);
  await new Promise(r => setTimeout(r, 20));
  assert.equal(h.calls.length, 1);
  assert.equal(h.writes.length, 0);
  assert.equal(h.stamps.length, 0);
  assert.deepEqual(h.stored(), []);
  assert.equal(h.loader.failed(), true);
});
