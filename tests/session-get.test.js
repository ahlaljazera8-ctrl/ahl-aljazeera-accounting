// The get() casts in session.js are erased. These checks are the runtime
// those expressions had before the casts: the same throws, the same
// TypeError, and the same results for ordinary cache values.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function request(result) {
  let success = null;
  return {
    result,
    /** @param {(() => void) | null} fn */
    set onsuccess(fn) {
      success = fn;
      queueMicrotask(() => { if (success) success(); });
    },
    get onsuccess() { return success; },
  };
}

/**
 * @param {unknown} err
 * @param {RegExp} word
 */
function isTypeError(err, word) {
  if (typeof err !== 'object' || err === null) return false;
  if (!('name' in err) || !('message' in err)) return false;
  return err.name === 'TypeError' && typeof err.message === 'string' && word.test(err.message);
}

function fakeIndexedDB(meta) {
  const idb = {
    open() {
      const db = {
        name: 'aj-u-u1',
        close() {},
        transaction() {
          let complete = null;
          return {
            /** @param {(() => void) | null} fn */
            set oncomplete(fn) {
              complete = fn;
              queueMicrotask(() => { if (complete) complete(); });
            },
            get oncomplete() { return complete; },
            onerror: null,
            objectStore(name) {
              const rows = name === 'meta';
              return {
                getAllKeys: () => request(rows ? meta.keys : []),
                getAll: () => request(rows ? meta.vals : (meta.stores && meta.stores[name]) || []),
                get: () => request(null),
                count: () => request(0),
                clear() {},
                put() {},
              };
            },
          };
        },
      };
      const openReq = { result: db };
      queueMicrotask(() => { if (openReq.onsuccess) openReq.onsuccess(); });
      return openReq;
    },
  };
  if (meta.databases) idb.databases = () => meta.databases;
  return idb;
}

/**
 * @param {unknown} err
 * @param {string} message
 */
function isMessage(err, message) {
  return typeof err === 'object' && err !== null && 'message' in err && err.message === message;
}

function loadSession(meta, elements) {
  const found = elements || {};
  const context = {
    console,
    URLSearchParams,
    queueMicrotask,
    indexedDB: fakeIndexedDB(meta || { keys: [], vals: [] }),
    location: { search: '' },
    document: {
      querySelector(sel) { return Object.prototype.hasOwnProperty.call(found, sel) ? found[sel] : null; },
      body: { dataset: {} },
    },
    navigator: { onLine: true },
    crypto: { randomUUID: () => 'uuid-from-test' },
    Ledger: { can() { return false; } },
    HTMLFormElement: function HTMLFormElement() {},
    HTMLInputElement: function HTMLInputElement() {},
    disposeFirebase() { return Promise.resolve(); },
    render() {},
    flushRemote() {},
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/session.js'), 'utf8'), context);
  return context;
}

test('a saved session user is returned, and a null user list throws TypeError on find', () => {
  const s = loadSession();
  s.cache[s.K.sessionUser] = { uid: 'u-ameer', role: 'owner', active: true };
  assert.equal(s.me().uid, 'u-ameer');

  s.cache[s.K.sessionUser] = null;
  s.cache[s.K.users] = [{ uid: 'u-ameer', role: 'owner' }, { uid: 'u-ahmed', role: 'site' }];
  s.cache[s.K.role] = 'site';
  assert.equal(s.me().uid, 'u-ahmed');

  s.cache[s.K.users] = null;
  assert.throws(() => s.me(), err => isTypeError(err, /find/));
});

test('a null outbox throws TypeError on length, and a null status list stays empty', async () => {
  const s = loadSession();
  s.cache[s.K.outbox] = ['pending'];
  assert.equal(await s.outboxEmpty(), false);

  s.cache[s.K.outbox] = [];
  s.cache[s.K.statusPending] = [];
  assert.equal(await s.outboxEmpty(), true);

  s.cache[s.K.outbox] = null;
  await assert.rejects(() => s.outboxEmpty(), err => isTypeError(err, /length/));

  // Today's expression is (get(K.statusPending) || []).length, so null does not throw.
  s.cache[s.K.outbox] = [];
  s.cache[s.K.statusPending] = null;
  assert.equal(await s.outboxEmpty(), true);
});

test('a saved local profile is returned, and a null profile is skipped', async () => {
  const saved = loadSession({
    keys: ['sessionUser', 'deviceId'],
    vals: [{ uid: 'u1', role: 'site', active: true }, 'dev-1'],
    databases: [{ name: 'aj-u-u1' }],
  });
  const found = await saved.localSession();
  assert.equal(found.uid, 'u1');
  assert.equal(found.role, 'site');
  assert.equal(saved.deviceId, 'dev-1');

  const missing = loadSession({
    keys: ['sessionUser', 'deviceId'],
    vals: [null, 'dev-1'],
    databases: [{ name: 'aj-u-u1' }],
  });
  assert.equal(await missing.localSession(), null);
  assert.equal(missing.deviceId, 'dev-1');
});

test('a truthy non-string device id is kept', async () => {
  const kept = { keep: true };
  const s = loadSession({ keys: ['deviceId'], vals: [kept] });
  await s.openUserDb('u1');
  assert.equal(s.deviceId.keep, true);
  assert.equal(typeof s.deviceId, 'object');
  assert.equal(s.cache.deviceId.keep, true);
});

test('loadAll sorts entries by device time then id, and keeps every meta key', async () => {
  const s = loadSession({
    keys: ['note', 7],
    vals: ['hello', 'seven'],
    stores: {
      entries: [
        { id: 'b', createdAtDevice: 30 },
        { id: 'z', createdAtDevice: '10' },
        { id: 'a', createdAtDevice: 10 },
        { id: 'y', createdAtDevice: '2' },
        { id: 'c', createdAtDevice: 10 },
      ],
      outbox: [
        { id: 'later', queuedAt: 2 },
        { id: 'sooner', queuedAt: 1 },
      ],
    },
  });
  await s.openUserDb('u1');
  assert.deepEqual(s.cache.entries.map(e => e.id), ['y', 'a', 'c', 'z', 'b']);
  assert.deepEqual(s.cache.outbox, ['sooner', 'later']);
  assert.equal(s.cache.note, 'hello');
  assert.equal(s.cache[7], 'seven');
});

function nativeThrow(source, sandbox) {
  const out = vm.runInNewContext(source, sandbox);
  if (!out || typeof out.message !== 'string' || out.name !== 'TypeError') throw new Error('expected a TypeError');
  return out;
}

test('loadAll throws the same TypeError as reading transaction on null and on undefined', async () => {
  for (const value of [null, undefined]) {
    const native = nativeThrow(
      '(() => { try { value.transaction(); return null; } catch (e) { return { name: e.name, message: e.message }; } })()',
      { value },
    );
    const s = loadSession();
    s.db = value;
    await assert.rejects(
      () => s.loadAll(),
      err => isTypeError(err, /transaction/) && isMessage(err, native.message),
    );
  }
});

test('set writes outbox ids and project rows, and a non-array throws on forEach', async () => {
  const s = loadSession();
  /** @type {unknown[]} */
  const puts = [];
  s.db = {
    transaction() {
      const tx = {
        onerror: null,
        objectStore() {
          return {
            clear() { puts.push('clear'); },
            put(value) { puts.push(value); },
          };
        },
      };
      Object.defineProperty(tx, 'oncomplete', {
        set(fn) { queueMicrotask(() => { fn({ type: 'complete' }); }); },
      });
      return tx;
    },
  };
  const done = await s.set('outbox', ['a', 'b']);
  assert.equal(done.type, 'complete');
  assert.equal(JSON.stringify(puts), JSON.stringify(['clear', { id: 'a', queuedAt: 0 }, { id: 'b', queuedAt: 1 }]));

  puts.length = 0;
  const row = { id: 'p1', name: 'n' };
  await s.set('projects', [row]);
  assert.equal(JSON.stringify(puts), JSON.stringify([row]));

  await assert.rejects(() => s.set('outbox', null), err => isTypeError(err, /forEach/));
  await assert.rejects(() => s.set('projects', null), err => isTypeError(err, /forEach/));
});

test('uuid fallback is 36 lowercase hex characters when randomUUID is missing', () => {
  const s = loadSession();
  s.crypto.randomUUID = undefined;
  const id = s.uuid();
  assert.equal(id.length, 36);
  assert.match(id, /^[0-9a-f-]{36}$/);
  s.crypto.getRandomValues = undefined;
  const fromMath = s.uuid();
  assert.equal(fromMath.length, 36);
  assert.match(fromMath, /^[0-9a-f-]{36}$/);
});

test('String(id) matches id < id for uuid, fallback, reversal, and seed ids', async () => {
  const ids = [];
  for (let i = 0; i < 6; i++) ids.push(crypto.randomUUID());
  ids.push('id-' + Date.now() + '-' + Math.random().toString(16).slice(2));
  ids.push('rev_' + ids[0]);
  ids.push('seed-3');
  for (const a of ids) {
    assert.equal(String(a), a);
    for (const b of ids) assert.equal(String(a) < String(b), a < b);
  }
  const entries = ids.map((id, i) => ({ id, createdAtDevice: i % 2 === 0 ? 10 : 20 }));
  const oldOrder = entries.slice().sort((a, b) => a.createdAtDevice - b.createdAtDevice || (a.id < b.id ? -1 : 1)).map(e => e.id);
  const s = loadSession({ keys: ['deviceId'], vals: ['dev-1'], stores: { entries } });
  await s.openUserDb('u1');
  assert.deepEqual(s.cache.entries.map(e => e.id), oldOrder);
});

test('a missing login element throws on hidden, and a real element is toggled', () => {
  const native = nativeThrow(
    '(() => { try { (null).hidden = false; return null; } catch (e) { return { name: e.name, message: e.message }; } })()',
  );
  const bare = loadSession();
  assert.throws(() => bare.showLogin(), err => isTypeError(err, /hidden/) && isMessage(err, native.message));
  assert.throws(() => bare.showApp(), err => isTypeError(err, /hidden/) && isMessage(err, native.message));

  const login = { hidden: true };
  const shell = { hidden: false };
  const boot = { hidden: false };
  const s = loadSession(null, { '#login': login, '#shell': shell, '#boot': boot });
  s.showLogin();
  assert.equal(boot.hidden, true);
  assert.equal(login.hidden, false);
  assert.equal(shell.hidden, true);
  s.showApp();
  assert.equal(login.hidden, true);
  assert.equal(shell.hidden, false);
});

test('enterSession accepts owner and site, and refuses another role', async () => {
  const refused = loadSession();
  await assert.rejects(
    () => refused.enterSession({}, 'u1', { active: true, role: 'clerk' }),
    err => isMessage(err, refused.MISSING_PROFILE_MSG),
  );
  await assert.rejects(
    () => refused.enterSession({}, 'u1', { active: false, role: 'owner' }),
    err => isMessage(err, refused.SUSPENDED_MSG),
  );

  const login = { hidden: true };
  const shell = { hidden: true };
  const s = loadSession({ keys: ['deviceId'], vals: ['dev-1'] }, { '#login': login, '#shell': shell });
  await s.enterSession({}, 'u-ameer', { active: true, role: 'owner', displayName: 'Ameer' });
  assert.equal(s.cache.sessionUser.role, 'owner');
  assert.equal(s.cache.sessionUser.uid, 'u-ameer');
  await s.enterSession({}, 'u-ahmed', { active: true, role: 'site', displayName: 'Ahmed' });
  assert.equal(s.cache.sessionUser.role, 'site');
});

// Baghdad calendar day. The clock is injected before session.js runs.
// Callers keep using today(); these tests do not read baghdadFmtFailed.
function entryDateOk(s) {
  return (
    typeof s === 'string' &&
    /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(s) &&
    s >= '2000-01-01' &&
    s <= '2100-12-31' &&
    !/^[0-9]{4}-02-3[01]$/.test(s) &&
    !/^[0-9]{4}-(04|06|09|11)-31$/.test(s)
  );
}

function loadDatedSession(fixedMs, intl) {
  const clock = { ms: fixedMs };
  class FakeDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [clock.ms]));
    }
    static now() {
      return clock.ms;
    }
  }
  const found = {};
  const context = {
    console,
    URLSearchParams,
    queueMicrotask,
    indexedDB: fakeIndexedDB({ keys: [], vals: [] }),
    location: { search: '' },
    document: {
      querySelector(sel) {
        return Object.prototype.hasOwnProperty.call(found, sel) ? found[sel] : null;
      },
      body: { dataset: {} },
    },
    navigator: { onLine: true },
    crypto: { randomUUID: () => 'uuid-from-test' },
    Ledger: {
      can() {
        return false;
      },
    },
    HTMLFormElement: function HTMLFormElement() {},
    HTMLInputElement: function HTMLInputElement() {},
    disposeFirebase() {
      return Promise.resolve();
    },
    render() {},
    flushRemote() {},
    Date: FakeDate,
    Intl: intl || Intl,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/session.js'), 'utf8'), context);
  return { context, clock };
}

const BAGHDAD_DAYS = [
  ['T-D1', '2026-11-15T21:30:00Z', '2026-11-16'],
  ['T-D2', '2026-11-15T23:59:00Z', '2026-11-16'],
  ['T-D3', '2026-11-16T00:00:00Z', '2026-11-16'],
  ['T-D4', '2026-11-15T20:59:00Z', '2026-11-15'],
  ['T-D5', '2026-12-31T21:10:00Z', '2027-01-01'],
  ['T-D6', '2028-02-28T21:30:00Z', '2028-02-29'],
];

for (const [id, iso, expected] of BAGHDAD_DAYS) {
  test(id + ' today() is the Baghdad day at ' + iso, () => {
    const loaded = loadDatedSession(Date.parse(iso));
    assert.equal(loaded.context.today(), expected);
  });
}

// Guard against a future switch to device-local time. The old UTC slice
// already ignores TZ, so this test does not separate the old body from the new one.
test('T-D7 today() ignores the device zone', () => {
  const previous = process.env.TZ;
  const zones = ['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati', 'Asia/Baghdad'];
  const rows = [
    ['2026-11-15T21:30:00Z', '2026-11-16'],
    ['2026-11-15T23:59:00Z', '2026-11-16'],
    ['2026-11-15T20:59:00Z', '2026-11-15'],
  ];
  try {
    for (const zone of zones) {
      process.env.TZ = zone;
      for (const [iso, expected] of rows) {
        const loaded = loadDatedSession(Date.parse(iso));
        assert.equal(loaded.context.today(), expected, zone + ' ' + iso);
      }
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('T-D8 a throwing DateTimeFormat is not retried and the +3 h day is kept', () => {
  let constructs = 0;
  function DateTimeFormat() {
    constructs += 1;
    throw new RangeError('unsupported time zone');
  }
  const loaded = loadDatedSession(Date.parse('2026-11-15T21:30:00Z'), { DateTimeFormat });
  assert.equal(loaded.context.today(), '2026-11-16');
  loaded.clock.ms = Date.parse('2026-11-15T23:59:00Z');
  assert.equal(loaded.context.today(), '2026-11-16');
  loaded.clock.ms = Date.parse('2026-11-15T21:30:00Z');
  assert.equal(loaded.context.today(), '2026-11-16');
  assert.equal(constructs, 1);
});

test('T-D9 stepped instants match entryDateOk and the +3 h oracle', () => {
  const start = Date.UTC(2026, 0, 1, 0, 0, 0);
  const step = 26 * 60 * 60 * 1000;
  const loaded = loadDatedSession(start);
  for (let i = 0; i < 1000; i++) {
    const t = start + i * step;
    loaded.clock.ms = t;
    const day = loaded.context.today();
    assert.match(day, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(entryDateOk(day), true, day);
    assert.equal(day, new Date(t + 3 * 3600e3).toISOString().slice(0, 10));
  }
  const monthEnd = Date.parse('2026-11-30T21:30:00Z');
  loaded.clock.ms = monthEnd;
  assert.equal(loaded.context.today(), '2026-12-01');
  assert.equal(loaded.context.today(), new Date(monthEnd + 3 * 3600e3).toISOString().slice(0, 10));
});

test('T-D10 the formatter is constructed once across 10000 calls', () => {
  let constructs = 0;
  const Real = Intl.DateTimeFormat;
  function DateTimeFormat(...args) {
    constructs += 1;
    return new Real(...args);
  }
  const loaded = loadDatedSession(Date.parse('2026-11-15T21:30:00Z'), { DateTimeFormat });
  for (let i = 0; i < 10000; i++) assert.equal(loaded.context.today(), '2026-11-16');
  assert.equal(constructs, 1);
});

test('T-D11 unparsable formatToParts digits use the +3 h day and the formatter stays cached', () => {
  let constructs = 0;
  let mode = 'arabic';
  const Real = Intl.DateTimeFormat;
  function DateTimeFormat(...args) {
    constructs += 1;
    const real = new Real(...args);
    real.formatToParts = function formatToParts() {
      if (mode === 'arabic') {
        return [
          { type: 'year', value: '٢٠٢٦' },
          { type: 'month', value: '١١' },
          { type: 'day', value: '١٦' },
        ];
      }
      return [
        { type: 'year', value: '1999' },
        { type: 'month', value: '01' },
        { type: 'day', value: '02' },
      ];
    };
    return real;
  }
  const loaded = loadDatedSession(Date.parse('2026-11-15T21:30:00Z'), { DateTimeFormat });
  assert.equal(loaded.context.today(), '2026-11-16');
  assert.equal(constructs, 1);
  mode = 'latn';
  assert.equal(loaded.context.today(), '1999-01-02');
  assert.equal(constructs, 1);
});
