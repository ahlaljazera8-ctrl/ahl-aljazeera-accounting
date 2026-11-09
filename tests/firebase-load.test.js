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

function rejectionSpy() {
  /** @type {unknown[]} */
  const seen = [];
  const on = (err) => { seen.push(err); };
  process.on('unhandledRejection', on);
  return {
    seen,
    stop() { process.off('unhandledRejection', on); },
  };
}

function isTimeout(err) {
  return !!err && err.timeout === true && /انتهت المهلة/.test(err.message) && /تحميل/.test(err.message);
}

function loadClient() {
  const state = {
    /** @type {any[]} */
    apps: [],
    /** @type {any[]} */
    deleted: [],
    /** @type {{ argc: number, name: string | null }[]} */
    initCalls: [],
    /** @type {{ app: any, key: string }[]} */
    authCalls: [],
    authStateCalls: 0,
    /** @type {{ db: any, ok: (value?: unknown) => void, no: (err: Error) => void, settled: boolean }[]} */
    clears: [],
    /** @type {'resolve' | 'hang-first' | 'reject'} */
    clearMode: 'resolve',
    /** @type {'resolve' | 'hang-first'} */
    deleteMode: 'resolve',
    /** @type {(() => void) | null} */
    releaseDelete: null,
    signOuts: 0,
    /** @type {{ uid: string } | null} */
    persistedUser: { uid: 'u-ameer' },
  };
  const apiKey = 'test-key';
  const mods = {
    initializeApp(config, name) {
      state.initCalls.push({ argc: arguments.length, name: name === undefined ? null : name });
      const app = { name: name || '[DEFAULT]', config: config || { apiKey }, container: {} };
      state.apps.push(app);
      return app;
    },
    getApps() { return state.apps.slice(); },
    deleteApp(app) {
      const hang = state.deleteMode === 'hang-first' && state.deleted.length === 0;
      state.deleted.push(app);
      state.apps = state.apps.filter(a => a.name !== app.name);
      if (hang) return new Promise(ok => { state.releaseDelete = () => ok(undefined); });
      return Promise.resolve();
    },
    authMod: {
      getAuth(app) {
        state.authCalls.push({
          app,
          key: 'firebase:authUser:' + app.config.apiKey + ':' + app.name,
        });
        return {
          app,
          authStateReady() { return Promise.resolve(); },
          currentUser: { uid: 'u-ameer' },
        };
      },
      onAuthStateChanged() { state.authStateCalls += 1; },
      connectAuthEmulator() {},
      signInWithEmailAndPassword() { return Promise.resolve(); },
      signOut() {
        state.signOuts += 1;
        state.persistedUser = null;
        return Promise.resolve();
      },
    },
    fsMod: {
      memoryLocalCache() { return { kind: 'memory' }; },
      initializeFirestore(app) { return { app, ping() { return 'ok'; } }; },
      getFirestore(app) { return { app, ping() { return 'ok'; } }; },
      connectFirestoreEmulator() {},
      clearIndexedDbPersistence(db) {
        return new Promise((ok, no) => {
          const gate = { db, ok, no, settled: false };
          state.clears.push(gate);
          const hang = state.clearMode === 'hang-first' && state.clears.length === 1;
          if (state.clearMode === 'reject' && !hang) {
            gate.settled = true;
            no(new Error('clear failed'));
            return;
          }
          if (!hang) {
            gate.settled = true;
            ok(undefined);
          }
        });
      },
    },
  };
  /** @type {any} */
  const context = {
    console,
    URL,
    URLSearchParams,
    Promise,
    setTimeout,
    clearTimeout,
    queueMicrotask,
    withTimeout,
    location: { search: '', href: 'http://127.0.0.1/index.html' },
    navigator: { onLine: true },
    sessionStorage: { getItem() { return null; }, setItem() {} },
    FIREBASE_CONFIG: { apiKey, projectId: 'ahl-aljazeera-accounting' },
    Sync: {},
    get() { return null; },
    set() {},
    K: { sessionUser: 'sessionUser' },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/firebase-client.js'), 'utf8'), context);
  context.loadFirebase = (generation) => context.createFirebaseClient(mods, generation);
  return { context, state, mods };
}

test('a hung ensureFirebase times out and the next call loads again', async () => {
  const { context } = loadClient();
  context.FB_LOAD_MS = 50;
  try {
    let calls = 0;
    context.loadFirebase = () => {
      calls += 1;
      return new Promise(() => {});
    };
    const first = context.ensureFirebase();
    await assert.rejects(first, isTimeout);
    assert.equal(calls, 1);
    const second = context.ensureFirebase();
    assert.equal(calls, 2);
    await assert.rejects(second, isTimeout);
  } finally {
    context.FB_LOAD_MS = 20000;
  }
});

test('the app name stays [DEFAULT] across a timeout and the next load', async () => {
  const { context, state } = loadClient();
  state.clearMode = 'hang-first';
  context.FB_LOAD_MS = 50;
  try {
    const first = context.ensureFirebase();
    const rejected = assert.rejects(first, isTimeout);
    await new Promise(r => setTimeout(r, 20));
    assert.equal(state.initCalls.length, 1);
    await rejected;
    const gate = state.clears[0];
    gate.settled = true;
    gate.ok();
    await new Promise(r => setTimeout(r, 20));
    const second = await context.ensureFirebase();
    assert.equal(second.db.ping(), 'ok');
    assert.equal(state.initCalls.length, 2);
    for (const call of state.initCalls) {
      assert.equal(call.argc, 1);
      assert.equal(call.name, null);
    }
    assert.ok(state.authCalls.length >= 1);
    for (const call of state.authCalls) assert.equal(call.key, 'firebase:authUser:test-key:[DEFAULT]');
  } finally {
    context.FB_LOAD_MS = 20000;
  }
});

test('a late import does not delete the newer default app', async () => {
  const seen = rejectionSpy();
  try {
    const { context, state, mods } = loadClient();
    state.clearMode = 'resolve';
    let calls = 0;
    /** @type {(() => void) | undefined} */
    let open;
    context.loadFirebase = (generation) => {
      calls += 1;
      if (calls === 1) {
        return new Promise(ok => {
          open = () => ok(context.createFirebaseClient(mods, generation));
        });
      }
      return context.createFirebaseClient(mods, generation);
    };
    context.FB_LOAD_MS = 50;
    try {
      const first = context.ensureFirebase();
      await assert.rejects(first, isTimeout);
      const secondPromise = context.ensureFirebase();
      const second = await secondPromise;
      if (!open) throw new Error('the first import should be waiting');
      const opened = open();
      await opened;
      await new Promise(r => setTimeout(r, 30));
      assert.equal(seen.seen.length, 0);
      assert.equal(context.fbPromise, secondPromise);
      assert.equal(state.apps.length, 1);
      assert.equal(state.apps[0].name, '[DEFAULT]');
      assert.equal(state.deleted.includes(state.apps[0]), false);
      assert.equal(state.initCalls.length, 1);
      assert.equal(second.db.ping(), 'ok');
      assert.equal(state.authCalls.length, 1);
      assert.equal(state.authStateCalls, 0);
    } finally {
      context.FB_LOAD_MS = 20000;
    }
  } finally {
    seen.stop();
  }
});

test('a late load that already created its app does not delete the newer one', async () => {
  const seen = rejectionSpy();
  try {
    const { context, state } = loadClient();
    state.clearMode = 'hang-first';
    context.FB_LOAD_MS = 50;
    try {
      const first = context.ensureFirebase();
      const rejected = assert.rejects(first, isTimeout);
      await new Promise(r => setTimeout(r, 20));
      assert.equal(state.clears.length, 1);
      assert.equal(state.clears[0].settled, false);
      await rejected;
      const secondPromise = context.ensureFirebase();
      const second = await secondPromise;
      assert.equal(state.apps[0], second.db.app);
      assert.equal(state.clears[0].settled, false);
      state.clears[0].settled = true;
      state.clears[0].ok();
      await new Promise(r => setTimeout(r, 30));
      assert.equal(seen.seen.length, 0);
      assert.equal(context.fbPromise, secondPromise);
      assert.equal(state.apps.length, 1);
      assert.equal(state.apps[0], second.db.app);
      assert.equal(state.deleted.includes(second.db.app), false);
      assert.equal(second.db.ping(), 'ok');
      assert.equal(state.authStateCalls, 0);
    } finally {
      context.FB_LOAD_MS = 20000;
    }
  } finally {
    seen.stop();
  }
});

test('an abandoned app is deleted when no newer load has started', async () => {
  const { context, state } = loadClient();
  state.clearMode = 'hang-first';
  context.FB_LOAD_MS = 50;
  try {
    const first = context.ensureFirebase();
    await assert.rejects(first, isTimeout);
    assert.equal(state.apps.length, 1);
    const gate = state.clears[0];
    gate.settled = true;
    gate.ok();
    await new Promise(r => setTimeout(r, 20));
    assert.equal(state.apps.length, 0);
    assert.equal(state.deleted.length, 1);
    const second = await context.ensureFirebase();
    assert.equal(second.db.ping(), 'ok');
    assert.equal(state.apps.length, 1);
    assert.equal(state.apps[0].name, '[DEFAULT]');
    assert.equal(state.initCalls.at(-1).argc, 1);
    assert.equal(state.initCalls.at(-1).name, null);
  } finally {
    context.FB_LOAD_MS = 20000;
  }
});

test('logout during an in-flight load still signs the saved user out', async () => {
  const { context, state } = loadClient();
  state.clearMode = 'hang-first';
  context.FB_LOAD_MS = 60000;
  try {
    assert.deepEqual(state.persistedUser, { uid: 'u-ameer' });
    const pending = context.ensureFirebase();
    await new Promise(r => setTimeout(r, 20));
    assert.equal(state.clears.length, 1);
    const done = context.disposeFirebase(true);
    state.clears[0].settled = true;
    state.clears[0].ok();
    await done;
    await pending;
    assert.equal(state.signOuts, 1);
    assert.equal(state.persistedUser, null);
  } finally {
    context.FB_LOAD_MS = 20000;
  }
});

test('a rejected persistence clear does not fail the load', async () => {
  const { context, state } = loadClient();
  state.clearMode = 'reject';
  const client = await context.ensureFirebase();
  assert.equal(client.db.ping(), 'ok');
  assert.equal(state.clears.length, 1);
  assert.equal(state.clears[0].settled, true);
});

test('a stale generation rejects the shared load instead of resolving null', async () => {
  const { context, state } = loadClient();
  context.fbGeneration = 5;
  await assert.rejects(context.settledClient(1), (err) => {
    const error = /** @type {Error} */ (err);
    return error.abandoned === true && error.timeout === true && /انتهت المهلة/.test(error.message) && /تحميل/.test(error.message);
  });
  assert.equal(state.initCalls.length, 0);
  assert.equal(state.deleted.length, 0);
});

test('a generation lost during the stale-app delete does not create another app', async () => {
  const { context, state } = loadClient();
  state.deleteMode = 'hang-first';
  state.apps.push({ name: '[DEFAULT]', config: context.FIREBASE_CONFIG, container: {}, leftover: true });
  context.FB_LOAD_MS = 50;
  try {
    const first = context.ensureFirebase();
    const rejected = assert.rejects(first, isTimeout);
    await new Promise(r => setTimeout(r, 20));
    assert.equal(state.deleted.length, 1);
    assert.equal(state.initCalls.length, 0);
    await rejected;
    const second = await context.ensureFirebase();
    if (state.releaseDelete) state.releaseDelete();
    await new Promise(r => setTimeout(r, 20));
    assert.equal(state.initCalls.length, 1);
    assert.equal(state.apps.length, 1);
    assert.equal(state.apps[0], second.db.app);
    assert.equal(second.db.ping(), 'ok');
  } finally {
    context.FB_LOAD_MS = 20000;
  }
});
