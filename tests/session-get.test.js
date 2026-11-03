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

test('loadAll throws TypeError when the database is null', async () => {
  const s = loadSession();
  await assert.rejects(() => s.loadAll(), err => isTypeError(err, /transaction/));
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

test('a missing login element throws on hidden, and a real element is toggled', () => {
  const bare = loadSession();
  assert.throws(() => bare.showLogin(), err => isTypeError(err, /hidden/));

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
