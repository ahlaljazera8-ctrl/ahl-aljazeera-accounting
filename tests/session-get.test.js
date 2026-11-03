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
                getAll: () => request(rows ? meta.vals : []),
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

function loadSession(meta) {
  const context = {
    console,
    URLSearchParams,
    queueMicrotask,
    indexedDB: fakeIndexedDB(meta || { keys: [], vals: [] }),
    location: { search: '' },
    document: { querySelector() { return null; }, body: { dataset: {} } },
    navigator: { onLine: true },
    crypto: { randomUUID: () => 'uuid-from-test' },
    Ledger: { can() { return false; } },
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
});
