const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function withTimeout(p, ms, step) {
  let timer;
  const err = new Error('انتهت المهلة (' + step + '). تحقق من الاتصال وأعد المحاولة');
  err.timeout = true;
  return Promise.race([
    Promise.resolve(p),
    new Promise((_, no) => { timer = setTimeout(() => no(err), ms); }),
  ]).finally(() => clearTimeout(timer));
}

function storage(initial) {
  const data = Object.assign({ throwSet: false }, initial);
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem(k, v) { if (data.throwSet) throw new Error('set'); data[k] = String(v); },
    removeItem(k) { delete data[k]; },
    _data: data,
  };
}

function request(result) {
  const req = { result };
  queueMicrotask(() => { if (req.onsuccess) req.onsuccess(); });
  return req;
}

function idbFor(meta) {
  const db = {
    name: meta.name,
    close() {},
    transaction() {
      const tx = {
        objectStore(name) {
          const metaStore = name === 'meta';
          return {
            getAll: () => request(metaStore ? (meta.vals || []) : (meta.rows || [])),
            getAllKeys: () => request(metaStore ? (meta.keys || []) : []),
            get: () => request(null),
            count: () => request(0),
            clear() {},
            put() {},
          };
        },
      };
      queueMicrotask(() => { if (tx.oncomplete) tx.oncomplete(); });
      return tx;
    },
  };
  return {
    databases: () => Promise.resolve(meta.listed ? [{ name: meta.name }] : []),
    open() {
      const openReq = { result: db };
      queueMicrotask(() => { if (openReq.onsuccess) openReq.onsuccess(); });
      return openReq;
    },
    deleteDatabase() {
      const req = {};
      queueMicrotask(() => { if (req.onsuccess) req.onsuccess(); });
      return req;
    },
  };
}

function loadSession(opts) {
  const box = storage(opts.store || {});
  const els = {};
  const meta = opts.meta || { name: 'aj-u-A', listed: true, keys: ['sessionUser'], vals: [] };
  // vals aligned with keys via getAll
  meta.rows = [];
  const context = {
    console,
    URL,
    URLSearchParams,
    Promise,
    queueMicrotask,
    setTimeout,
    clearTimeout,
    crypto: { randomUUID: () => 'uuid-test' },
    localStorage: box,
    indexedDB: idbFor(meta),
    location: { search: opts.search || '', href: 'http://127.0.0.1/index.html' },
    navigator: { onLine: opts.onLine !== false },
    document: {
      body: { dataset: {} },
      querySelector(sel) {
        if (!els[sel]) els[sel] = { hidden: sel !== '#shell', textContent: '', value: '', reset() {} };
        return els[sel];
      },
    },
    Ledger: { can(p) { return p && p.role === 'owner'; } },
    HTMLFormElement: function HTMLFormElement() {},
    HTMLInputElement: function HTMLInputElement() {},
    alert() {},
    ensureFirebase: opts.ensureFirebase || (() => Promise.reject(Object.assign(new Error('انتهت المهلة (تحميل). تحقق من الاتصال وأعد المحاولة'), { timeout: true }))),
    disposeFirebase: opts.disposeFirebase || (() => Promise.resolve(false)),
    flushRemote() { return Promise.resolve(); },
    render() {},
    isDeadAuth() { return false; },
    isImportFailure() { return false; },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/session.js'), 'utf8'), context);
  if (opts.sessionUser) context.cache[context.K.sessionUser] = opts.sessionUser;
  if (opts.dbName) {
    context.db = {
      name: opts.dbName,
      close() {},
      transaction() {
        const tx = {
          objectStore() {
            return { count: () => request(0), get: () => request(null), getAll: () => request([]), getAllKeys: () => request([]), clear() {}, put() {} };
          },
        };
        queueMicrotask(() => { if (tx.oncomplete) tx.oncomplete(); });
        return tx;
      },
    };
  }
  return { context, box, els };
}

test('compare-and-clear leaves marker B when asked to clear A', () => {
  const { context, box } = loadSession({ meta: { name: 'aj-p0', listed: false } });
  box.setItem('aj-signout-pending', 'B');
  context.clearSignOutPending('A');
  assert.equal(box.getItem('aj-signout-pending'), 'B');
  context.clearSignOutPending('B');
  assert.equal(box.getItem('aj-signout-pending'), null);
});

test('an empty uid does not write the marker', async () => {
  const { context, box } = loadSession({ dbName: 'aj-u-', meta: { name: 'aj-u-', listed: false } });
  const closed = await context.closeSession();
  assert.equal(closed, true);
  assert.equal(box.getItem('aj-signout-pending'), null);
});

test('a null database falls back to the cached session user', async () => {
  const user = { uid: 'u-A', role: 'owner', active: true, displayName: 'A' };
  const { context, box } = loadSession({ sessionUser: user, meta: { name: 'aj-u-A', listed: false } });
  context.db = null;
  const closed = await context.closeSession();
  assert.equal(closed, true);
  assert.equal(box.getItem('aj-signout-pending'), 'u-A');
});

test('demo logout writes no marker', async () => {
  const { context, box } = loadSession({
    dbName: 'aj-p0',
    sessionUser: { uid: 'u-demo', role: 'owner', active: true },
    meta: { name: 'aj-p0', listed: false },
  });
  await context.closeSession();
  assert.equal(box.getItem('aj-signout-pending'), null);
});

test('a throwing setItem still finishes logout', async () => {
  const { context, box } = loadSession({ dbName: 'aj-u-A', meta: { name: 'aj-u-A', listed: false } });
  box._data.throwSet = true;
  const closed = await context.closeSession();
  assert.equal(closed, true);
  assert.equal(box.getItem('aj-signout-pending'), null);
});

test('local session restore stays closed while the marker is set and the database is still usable', async () => {
  const user = { uid: 'u-A', role: 'owner', active: true, displayName: 'A' };
  const { context } = loadSession({
    store: { 'aj-signout-pending': 'u-A' },
    sessionUser: user,
    meta: {
      name: 'aj-u-A',
      listed: true,
      keys: ['sessionUser'],
      vals: [user],
    },
  });
  // The usable profile is what loadAll would read. Put it where openUserDb stores meta.
  context.cache.sessionUser = user;
  const found = await context.localSession();
  assert.equal(found, null);
});

function clientMods(context, state) {
  return {
    initializeApp(config, name) {
      state.initOrder.push('init');
      const app = { name: name || '[DEFAULT]', config, container: {} };
      state.apps.push(app);
      return app;
    },
    getApps() { return state.apps.slice(); },
    deleteApp(app) {
      state.apps = state.apps.filter(a => a !== app && a.name !== app.name);
      return Promise.resolve();
    },
    authMod: {
      getAuth() { state.initOrder.push('auth'); return { authStateReady() { return Promise.resolve(); }, currentUser: null }; },
      connectAuthEmulator() { state.initOrder.push('emulator'); },
      signOut() {
        state.signOuts += 1;
        state.initOrder.push('signOut');
        if (state.signOutRejects) return Promise.reject(new Error('no'));
        if (state.signOutStale) context.fbGeneration += 1;
        return Promise.resolve();
      },
      signInWithEmailAndPassword() { return Promise.resolve({ user: { uid: 'u-B' } }); },
    },
    fsMod: {
      memoryLocalCache() { return { kind: 'memory' }; },
      initializeFirestore(app) { return { app, ping() { return 'ok'; } }; },
      getFirestore(app) { return { app, ping() { return 'ok'; } }; },
      connectFirestoreEmulator() {},
      clearIndexedDbPersistence() { return Promise.resolve(); },
      terminate() { return Promise.resolve(); },
    },
  };
}

function loadClient(opts) {
  const session = loadSession(opts || {});
  const { context } = session;
  context.withTimeout = withTimeout;
  context.sessionStorage = { getItem() { return null; }, setItem() {} };
  context.FIREBASE_CONFIG = { apiKey: 'test-key', projectId: 'ahl' };
  context.Sync = {};
  const state = { apps: [], initOrder: [], signOuts: 0, signOutRejects: false, signOutStale: false };
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/firebase-client.js'), 'utf8'), context);
  return { context, box: session.box, state, mods: clientMods(context, state) };
}

test('the next client load signs out once and then clears the marker', async () => {
  const { context, box, state, mods } = loadClient({ store: { 'aj-signout-pending': 'u-A' } });
  context.fbGeneration = 1;
  const client = await context.createFirebaseClient(mods, 1);
  assert.equal(client.db.ping(), 'ok');
  assert.equal(state.signOuts, 1);
  assert.equal(box.getItem('aj-signout-pending'), null);
  assert.ok(state.initOrder.indexOf('emulator') === -1 || state.initOrder.indexOf('signOut') > state.initOrder.indexOf('emulator'));
});

test('a rejected sign-out leaves the marker and still returns the client', async () => {
  const { context, box, state, mods } = loadClient({ store: { 'aj-signout-pending': 'u-A' } });
  state.signOutRejects = true;
  context.fbGeneration = 1;
  const client = await context.createFirebaseClient(mods, 1);
  assert.equal(client.db.ping(), 'ok');
  assert.equal(box.getItem('aj-signout-pending'), 'u-A');
});

test('an emulator load signs out only after the emulator is connected', async () => {
  const { context, state, mods } = loadClient({ store: { 'aj-signout-pending': 'u-A' }, search: '?emulator=1' });
  context.fbGeneration = 1;
  await context.createFirebaseClient(mods, 1);
  assert.deepEqual(state.initOrder.filter(x => x === 'emulator' || x === 'signOut'), ['emulator', 'signOut']);
});

test('a stale sign-out does not clear the marker', async () => {
  const { context, box, state, mods } = loadClient({ store: { 'aj-signout-pending': 'u-A' } });
  state.signOutStale = true;
  context.fbGeneration = 1;
  const client = await context.createFirebaseClient(mods, 1);
  assert.equal(client, null);
  assert.equal(box.getItem('aj-signout-pending'), 'u-A');
});

test('disposeFirebase(false) keeps the marker', async () => {
  const { context, box } = loadClient({ store: { 'aj-signout-pending': 'u-A' } });
  context.fbPromise = Promise.resolve({
    async dispose(signOutUser) { return signOutUser !== true; },
  });
  const cleared = await context.disposeFirebase(false);
  assert.equal(cleared, false);
  assert.equal(box.getItem('aj-signout-pending'), 'u-A');
});

test('an overtaking load that skips sign-out leaves the marker set', async () => {
  const { context, box } = loadClient({ store: { 'aj-signout-pending': 'u-A' } });
  /** @type {((value: any) => void) | undefined} */
  let releaseFirst;
  context.fbPromise = new Promise(ok => { releaseFirst = ok; });
  context.loadFirebase = () => new Promise(() => {});
  context.FB_LOAD_MS = 30;
  try {
    const done = context.disposeFirebase(true);
    const second = context.ensureFirebase();
    if (!releaseFirst) throw new Error('the disposed load should be waiting');
    releaseFirst(null);
    const signedOut = await done;
    assert.equal(signedOut, false);
    assert.equal(box.getItem('aj-signout-pending'), 'u-A');
    await assert.rejects(second);
    assert.equal(await context.localSession(), null);
  } finally {
    context.FB_LOAD_MS = 20000;
  }
});

test('boot with a marker does not open the saved account or flush', async () => {
  const user = { uid: 'u-A', role: 'owner', active: true, displayName: 'A' };
  let flushes = 0;
  let writes = 0;
  const opened = [];
  const { context, els } = loadSession({
    store: { 'aj-signout-pending': 'u-A' },
    onLine: true,
    meta: { name: 'aj-u-A', listed: true, keys: ['sessionUser'], vals: [user] },
    ensureFirebase: () => Promise.resolve({
      currentUser: () => Promise.resolve({ uid: 'u-A' }),
      profile: () => Promise.resolve(user),
      signOut: () => Promise.resolve(),
      writeLocal() { writes += 1; return Promise.resolve(); },
      idToken: () => Promise.resolve('t'),
    }),
  });
  const origOpen = context.openUserDb;
  context.openUserDb = async (uid) => { opened.push(uid); return origOpen(uid); };
  context.flushRemote = () => { flushes += 1; return Promise.resolve(); };
  context.rebuildFirebase = () => Promise.reject(new Error('rebuild'));
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8'), context);
  await new Promise(r => setTimeout(r, 40));
  assert.equal(els['#login'].hidden, false);
  assert.equal(els['#shell'].hidden, true);
  assert.equal(flushes, 0);
  assert.equal(writes, 0);
  assert.deepEqual(opened, []);
});

test('an offline reopen stays closed when the marker is set and aj-u-A is still usable', async () => {
  const user = { uid: 'u-A', role: 'owner', active: true, displayName: 'A' };
  const opened = [];
  const { context, els } = loadSession({
    store: { 'aj-signout-pending': 'u-A' },
    onLine: false,
    meta: { name: 'aj-u-A', listed: true, keys: ['sessionUser'], vals: [user] },
    ensureFirebase: () => Promise.resolve({
      currentUser: () => Promise.resolve({ uid: 'u-A' }),
      profile: () => Promise.resolve(user),
      signOut: () => Promise.resolve(),
    }),
  });
  const origOpen = context.openUserDb;
  context.openUserDb = async (uid) => { opened.push(uid); return origOpen(uid); };
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8'), context);
  await new Promise(r => setTimeout(r, 40));
  assert.equal(els['#shell'].hidden, true);
  assert.equal(els['#login'].hidden, false);
  assert.deepEqual(opened, []);
});

test('login as B after a marked boot never opens aj-u-A', async () => {
  const user = { uid: 'u-A', role: 'owner', active: true, displayName: 'A' };
  const opened = [];
  let signIns = 0;
  const { context, box, els } = loadSession({
    store: { 'aj-signout-pending': 'u-A' },
    meta: { name: 'aj-u-A', listed: true, keys: ['sessionUser'], vals: [user] },
    ensureFirebase: () => Promise.resolve({
      currentUser: () => Promise.resolve({ uid: 'u-A' }),
      signOut: () => Promise.resolve(),
      signIn() { signIns += 1; return Promise.resolve({ user: { uid: 'u-B' } }); },
      profile() { return Promise.resolve({ uid: 'u-B', role: 'owner', active: true, displayName: 'B' }); },
    }),
  });
  const origOpen = context.openUserDb;
  context.openUserDb = async (uid) => { opened.push(uid); return origOpen(uid); };
  context.flushRemote = () => Promise.resolve();
  context.Ledger.DEFAULT_POLICY = {};
  context.Ledger.createLedger = () => ({ all() { return []; } });
  context.Ledger.fmt = () => '';
  context.PeopleDir = { TIMEOUT_MS: 1, createLoader() { return { run() { return Promise.resolve(); }, failed() { return false; }, reset() {} }; } };
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8'), context);
  await new Promise(r => setTimeout(r, 30));
  assert.deepEqual(opened, []);
  const handlers = {};
  context.$ = (sel) => {
    if (sel === '#login-form') return { addEventListener(type, fn) { handlers[type] = fn; }, reset() {} };
    if (sel === '#login-email') return { value: 'b@example.invalid' };
    if (sel === '#login-password') return { value: 'secret' };
    if (sel === '#login-btn') return { disabled: false };
    if (sel === '#login-msg') return { textContent: '' };
    if (sel === '#role') return { addEventListener() {} };
    if (sel === '#shell') return { hidden: true };
    return { hidden: true, addEventListener() {}, value: '' };
  };
  context.document.addEventListener = () => {};
  context.addEventListener = () => {};
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/render.js'), 'utf8'), context);
  await handlers.submit({ preventDefault() {} });
  assert.equal(signIns, 1);
  assert.equal(opened.includes('u-A'), false);
  assert.equal(opened.includes('u-B'), true);
  assert.equal(box.getItem('aj-signout-pending'), null);
  assert.equal(els['#login'].hidden, false);
});

test('login still signs in when the pending sign-out rejects', async () => {
  const { context } = loadSession({});
  let signIns = 0;
  context.ensureFirebase = () => Promise.resolve({
    signOut: () => Promise.reject(new Error('no')),
    signIn() { signIns += 1; return Promise.resolve({ user: { uid: 'u-B' } }); },
    profile: () => Promise.resolve({ uid: 'u-B', role: 'site', active: true, displayName: 'B' }),
  });
  context.localStorage.setItem('aj-signout-pending', 'u-A');
  context.Ledger = { DEFAULT_POLICY: {}, createLedger() { return { all() { return []; } }; }, can() { return false; }, fmt() { return ''; } };
  context.PeopleDir = { TIMEOUT_MS: 1, createLoader() { return { run() { return Promise.resolve(); }, failed() { return false; }, reset() {} }; } };
  const handlers = {};
  context.$ = (sel) => {
    if (sel === '#login-form') return { addEventListener(type, fn) { handlers[type] = fn; }, reset() {} };
    if (sel === '#login-email') return { value: 'b@example.invalid' };
    if (sel === '#login-password') return { value: 'secret' };
    if (sel === '#login-btn') return { disabled: false };
    if (sel === '#login-msg') return { textContent: '' };
    if (sel === '#role') return { addEventListener() {} };
    if (sel === '#shell') return { hidden: true };
    return { hidden: true, addEventListener() {}, value: '' };
  };
  context.document.addEventListener = () => {};
  context.addEventListener = () => {};
  context.enterSession = () => Promise.resolve();
  context.withTimeout = withTimeout;
  context.LOGIN_MS = 20000;
  context.isPoison = () => false;
  context.sessionEpoch = 0;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/render.js'), 'utf8'), context);
  await handlers.submit({ preventDefault() {} });
  assert.equal(signIns, 1);
  assert.equal(context.localStorage.getItem('aj-signout-pending'), null);
});

test('a normal login does not call signOut', async () => {
  const { context } = loadSession({});
  let signOuts = 0;
  let signIns = 0;
  context.ensureFirebase = () => Promise.resolve({
    signOut() { signOuts += 1; return Promise.resolve(); },
    signIn() { signIns += 1; return Promise.resolve({ user: { uid: 'u-B' } }); },
    profile: () => Promise.resolve({ uid: 'u-B', role: 'site', active: true, displayName: 'B' }),
  });
  context.Ledger = { DEFAULT_POLICY: {}, createLedger() { return { all() { return []; } }; }, can() { return false; }, fmt() { return ''; } };
  context.PeopleDir = { TIMEOUT_MS: 1, createLoader() { return { run() { return Promise.resolve(); }, failed() { return false; }, reset() {} }; } };
  const handlers = {};
  context.$ = (sel) => {
    if (sel === '#login-form') return { addEventListener(type, fn) { handlers[type] = fn; }, reset() {} };
    if (sel === '#login-email') return { value: 'b@example.invalid' };
    if (sel === '#login-password') return { value: 'secret' };
    if (sel === '#login-btn') return { disabled: false };
    if (sel === '#login-msg') return { textContent: '' };
    if (sel === '#role') return { addEventListener() {} };
    if (sel === '#shell') return { hidden: true };
    return { hidden: true, addEventListener() {}, value: '' };
  };
  context.document.addEventListener = () => {};
  context.addEventListener = () => {};
  context.enterSession = () => Promise.resolve();
  context.withTimeout = withTimeout;
  context.LOGIN_MS = 20000;
  context.isPoison = () => false;
  context.sessionEpoch = 0;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/render.js'), 'utf8'), context);
  await handlers.submit({ preventDefault() {} });
  assert.equal(signOuts, 0);
  assert.equal(signIns, 1);
});
