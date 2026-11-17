const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('vm');
const Sync = require('../public/sync.js');
const Status = require('../public/sync-status.js');
const Ledger = require('../public/ledger.js');

const ROOT = path.join(__dirname, '..');

/**
 * @typedef {Record<string, unknown> & {
 *   closeSession: (stillBlocked?: () => boolean) => Promise<boolean>,
 *   localStorage: { getItem: (key: string) => string | null, setItem: (key: string, value: string) => void, removeItem: (key: string) => void },
 *   sessionEpoch: number,
 *   db: { name?: string } | null,
 *   navigator: { onLine: boolean },
 *   cache: Record<string, unknown>,
 *   K: Record<string, string>,
 *   set: (key: string, value: unknown) => Promise<unknown>,
 *   get: (key: string, fallback?: unknown) => unknown,
 *   cacheSnapshot: () => Record<string, unknown>,
 *   writeCache: (next: unknown) => void,
 *   loadAll: () => Promise<void>,
 *   ensureFirebase: () => Promise<unknown>,
 * }} RejectedVm
 */

function memoryStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(String(key), String(value)); },
    removeItem(key) { data.delete(key); },
  };
}
const DELETED = 'رُفض الإرسال لأن المشروع محذوف';
const BLOCK = 'يوجد قيود مرفوضة على هذا الهاتف. صدّرها قبل الخروج.';
const OUTBOX = 'يوجد تغييرات لم تُرسل. أرسلها أولاً ثم اخرج';

function deny(code, message) {
  const err = new Error(message || code);
  err.code = code;
  return err;
}

function entry(over) {
  return Object.assign({
    id: 'e-school', projectId: 'p-school', direction: 'expense', entryType: 'materials', amount: 150000,
    currency: 'IQD', entryDate: '2026-11-03', description: 'سمنت', partyName: 'جهة', isReversal: false,
    createdAtDevice: Date.UTC(2026, 10, 3, 11, 5, 1), createdBy: 'u-ameer', createdByName: 'أمير',
  }, over);
}

function owner(uid) {
  return { uid: uid || 'u-owner', role: 'owner', active: true, displayName: 'أمير' };
}

function site(uid) {
  return { uid: uid || 'u-site', role: 'site', active: true, displayName: 'أحمد' };
}

test('a missing project relabels only a generic ledger refusal', async () => {
  assert.equal(Status.messageAfterProjectProbe(Status.REJECTED, { exists: false }, false), DELETED);
  assert.equal(Status.messageAfterProjectProbe(Status.REJECTED, { exists: true }, false), Status.REJECTED);
  assert.equal(Status.messageAfterProjectProbe(Status.REJECTED, null, false), Status.REJECTED);
  assert.equal(Status.messageAfterProjectProbe(Status.CONFLICT, { exists: false }, false), Status.CONFLICT);
  assert.equal(Status.messageAfterProjectProbe(Status.UNVERIFIED, { exists: false }, false), Status.UNVERIFIED);

  const row = entry();
  const held = entry({ id: 'e-held', projectId: 'p-new' });
  const project = { id: 'p-new', name: 'جديد', currency: 'IQD' };
  let probes = 0;
  const heldResult = await Sync.flushOutbox({
    ids: [held.id],
    load: id => (id === held.id ? held : project),
    write: async () => { throw deny('permission-denied', 'Missing or insufficient permissions.'); },
    readServer: async () => null,
    projectProbe: async () => { probes += 1; return { exists: false }; },
  });
  assert.equal(heldResult.failed[0].message, Status.REJECTED);
  assert.equal(probes, 1);

  const gone = await Sync.flushOutbox({
    ids: [row.id],
    load: id => (id === row.id ? row : { id: 'p-school', name: 'مدرسة', currency: 'IQD', createdAtServer: 1 }),
    write: async () => { throw deny('permission-denied', 'Missing or insufficient permissions.'); },
    readServer: async () => null,
    projectProbe: async () => ({ exists: false }),
  });
  assert.equal(gone.failed[0].message, DELETED);
  assert.deepEqual(gone.kept, []);

  const archived = await Sync.flushOutbox({
    ids: [row.id],
    load: () => row,
    write: async () => { throw deny('permission-denied', 'Missing or insufficient permissions.'); },
    readServer: async () => null,
    projectProbe: async () => ({ exists: true }),
  });
  assert.equal(archived.failed[0].message, Status.REJECTED);

  probes = 0;
  const quiet = await Sync.flushOutbox({
    ids: [row.id],
    load: () => row,
    write: async () => { throw deny('permission-denied', 'Missing or insufficient permissions.'); },
    readServer: async () => null,
    projectProbe: async () => { probes += 1; return null; },
  });
  assert.equal(quiet.failed[0].message, Status.REJECTED);
  assert.deepEqual(quiet.kept, []);
  assert.equal(Status.applyFlush([row.id], {}, quiet).errors[row.id], Status.REJECTED);
  assert.equal(probes, 1);

  probes = 0;
  const clash = await Sync.flushOutbox({
    ids: [row.id],
    load: () => row,
    write: async () => { throw deny('permission-denied', 'Missing or insufficient permissions.'); },
    readServer: async () => Object.assign({}, row, { amount: 1 }),
    projectProbe: async () => { probes += 1; return { exists: false }; },
  });
  assert.equal(clash.failed[0].message, Status.CONFLICT);
  assert.equal(probes, 0);

  probes = 0;
  const old = await Sync.flushOutbox({
    ids: [row.id],
    load: () => row,
    write: async () => { throw deny('already-exists', 'Document already exists'); },
    readServer: async () => { throw deny('permission-denied', 'Missing or insufficient permissions.'); },
    projectProbe: async () => { probes += 1; return { exists: false }; },
  });
  assert.equal(old.failed[0].message, Status.UNVERIFIED);
  assert.equal(probes, 0);

  probes = 0;
  const retry = await Sync.flushOutbox({
    ids: [row.id],
    load: () => row,
    write: async () => { throw Object.assign(new Error('offline'), { timeout: true }); },
    projectProbe: async () => { probes += 1; return { exists: false }; },
  });
  assert.deepEqual(retry.kept, [row.id]);
  assert.deepEqual(retry.failed, []);
  assert.equal(Status.applyFlush([row.id], {}, retry).errors[row.id], undefined);
  assert.equal(probes, 0);

  const dead = await Sync.flushOutbox({
    ids: [row.id],
    load: () => row,
    write: async () => { throw deny('permission-denied', 'Missing or insufficient permissions.'); },
    readServer: async () => null,
    projectProbe: async () => { throw deny('auth/user-token-expired', 'TOKEN_EXPIRED'); },
  });
  assert.equal(dead.authDead, true);
  assert.deepEqual(dead.failed, []);
  assert.equal(JSON.stringify(dead).includes(DELETED), false);
});

test('the rejected file is the 14 approved columns and a raw amount', () => {
  const row = entry({ description: 'سمنت, "كيس"' });
  const csv = Ledger.rejectedEntriesToCSV([row], [], { 'p-school': 'مدرسة النور' }, { 'e-school': DELETED });
  assert.equal(csv.charCodeAt(0), 65279);
  const text = csv.slice(1);
  const header = text.slice(0, text.indexOf('\r\n'));
  assert.deepEqual(header.split(','), Ledger.REJECTED_HEADERS);
  const body = text.slice(header.length + 2);
  assert.equal(body.split('\r\n').filter(line => line !== '').length, 1);
  assert.equal(csv.includes('الكمية / الوحدة / سعر الوحدة'), false);
  assert.equal(csv.includes('وقت آخر محاولة إرسال'), false);
  assert.equal(csv.includes('عدد المحاولات'), false);
  assert.equal(csv.includes('150000'), true);
  assert.equal(csv.includes('150,000'), false);
  assert.equal(csv.includes('-150000'), false);
  assert.equal(csv.includes('مرفوض - غير محسوب بالأرصدة'), true);
  assert.equal(csv.includes('مدرسة النور'), true);
  assert.equal(csv.includes('2026-11-03T14:05:01+03:00'), true);
  assert.equal(csv.includes('"سمنت, ""كيس""'), true);
  const quoted = Ledger.rejectedEntriesToCSV([entry({ id: 'e-nl', description: 'سطر\nثاني' })], [], {}, { 'e-nl': DELETED });
  assert.equal(quoted.includes('"سطر\nثاني"'), true);
  assert.equal(csv.endsWith('مرفوض - غير محسوب بالأرصدة\r\n'), true);

  const marks = [' ', '\u200F', '\u202B'];
  const signs = ['=', '+', '-', '@'];
  for (const mark of marks) {
    for (const sign of signs) {
      const risky = entry({ id: 'e-risk', description: mark + sign + '1+1' });
      const riskyCsv = Ledger.rejectedEntriesToCSV([risky], [], {}, { 'e-risk': DELETED });
      assert.equal(riskyCsv.includes("'" + mark + sign + '1+1'), true, mark + sign);
    }
  }
  const home = Ledger.toCSV([entry({ description: ' =1+1' })], [{ id: 'p-school', name: 'مدرسة' }]);
  assert.equal(home.includes("' =1+1"), true);

  const empty = Ledger.rejectedEntriesToCSV([], [], {}, {});
  assert.equal(typeof empty, 'string');
  assert.equal(empty.charCodeAt(0), 65279);
  assert.equal(empty.slice(1).split('\r\n').filter(Boolean).length, 1);
  assert.equal(Ledger.rejectedLogoutBlocked([], ['e1']), false);
});

test('readProjectProbe treats permission-denied and a timeout as no answer', async () => {
  const src = fs.readFileSync(path.join(ROOT, 'public/firebase-client.js'), 'utf8');
  assert.match(src, /getDocFromServer\(fsMod\.doc\(fdb, 'projects', projectId\)\)/);
  const context = {
    console, URL, Promise, queueMicrotask, setTimeout, clearTimeout,
    window: null, SyncStatus: Status, navigator: { onLine: true },
    location: { href: 'http://127.0.0.1/index.html', search: '' },
    sessionStorage: { getItem() { return null; }, setItem() {} },
    document: { body: { dataset: {} }, querySelector() { return { hidden: true }; } },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(src, context);
  context.projectDocRead = async () => { throw deny('permission-denied', 'Missing or insufficient permissions.'); };
  assert.equal(await context.readProjectProbe('p-school'), null);
  assert.equal(Status.messageAfterProjectProbe(Status.REJECTED, await context.readProjectProbe('p-school'), false), Status.REJECTED);
  context.projectDocRead = async () => { throw Object.assign(new Error('slow'), { timeout: true }); };
  assert.equal(await context.readProjectProbe('p-school'), null);
  context.projectDocRead = async () => { throw deny('unavailable', 'offline'); };
  assert.equal(await context.readProjectProbe('p-school'), null);
  context.projectDocRead = async () => ({ exists() { return false; } });
  const missing = await context.readProjectProbe('p-school');
  assert.equal(missing && missing.exists, false);
  context.projectDocRead = async () => { throw deny('auth/user-token-expired', 'TOKEN_EXPIRED'); };
  await assert.rejects(() => context.readProjectProbe('p-school'), err => /** @type {{ code?: string }} */ (err).code === 'auth/user-token-expired');
});

test('an owner lists every deleted-project row and a site user lists only his own', () => {
  const mine = entry({ id: 'mine', createdBy: 'u-a' });
  const other = entry({ id: 'other', createdBy: 'u-b' });
  const blank = entry({ id: 'blank', createdBy: '' });
  const missing = entry({ id: 'missing' });
  delete missing.createdBy;
  const generic = entry({ id: 'generic' });
  const rows = [mine, other, blank, missing, generic];
  const errors = { mine: DELETED, other: DELETED, blank: DELETED, missing: DELETED, generic: Status.REJECTED };
  const ownerRows = Ledger.deletedProjectEntries(owner('u-a'), rows, errors, DELETED);
  assert.deepEqual(ownerRows.map(row => row.id), ['mine', 'other', 'blank', 'missing']);
  const siteRows = Ledger.deletedProjectEntries(site('u-a'), rows, errors, DELETED);
  assert.deepEqual(siteRows.map(row => row.id), ['mine', 'blank', 'missing']);
  const csv = Ledger.rejectedEntriesToCSV(siteRows, [], { 'p-school': 'مدرسة' }, errors);
  assert.equal(csv.includes('other'), false);
  assert.equal(Ledger.canExportRejected(owner()), true);
  assert.equal(Ledger.canExportRejected(site()), true);
  assert.equal(Ledger.canExportRejected(Object.assign(owner(), { active: false })), false);
  assert.equal(Ledger.canExportRejected(Object.assign(site(), { active: false })), false);
  assert.equal(Ledger.canExportRejected({ active: true }), false);

  const hidden = Ledger.deletedProjectEntries(owner(), rows, errors, DELETED);
  assert.equal(hidden.some(row => row.id === 'generic'), false);
  const pendingOnly = Ledger.deletedProjectEntries(owner(), [entry({ id: 'wait' })], {}, DELETED);
  assert.deepEqual(pendingOnly, []);
  const goneProject = Ledger.deletedProjectEntries(owner(), [mine], { mine: DELETED }, DELETED);
  assert.equal(goneProject.length, 1);
});

test('a second project drop keeps the first name and does not touch exported ids', async () => {
  const alerts = [];
  const deleted = [];
  const meta = new Map();
  const lists = { projects: [], entries: [], outbox: [] };
  function request(result) {
    const req = { result };
    queueMicrotask(() => { if (req.onsuccess) req.onsuccess(); });
    return req;
  }
  const db = {
    name: 'aj-u-u-owner',
    close() {},
    transaction() {
      const tx = {
        objectStore(name) {
          if (name === 'meta') {
            return {
              getAllKeys: () => request([...meta.keys()]),
              getAll: () => request([...meta.values()]),
              get: key => request(meta.has(key) ? meta.get(key) : undefined),
              put(value, key) { meta.set(key, JSON.parse(JSON.stringify(value))); },
              count: () => request(0),
            };
          }
          const list = lists[name] || (lists[name] = []);
          return {
            getAll: () => request(list.map(row => Object.assign({}, row))),
            clear() { list.length = 0; },
            put(row) {
              const at = list.findIndex(item => item.id === row.id);
              if (at >= 0) list[at] = row;
              else list.push(row);
            },
            count: () => request(list.length),
          };
        },
      };
      queueMicrotask(() => { if (tx.oncomplete) tx.oncomplete(); });
      return tx;
    },
  };
  const context = {
    console, URL, URLSearchParams, Promise, queueMicrotask, setTimeout, clearTimeout,
    crypto: { randomUUID: () => 'uuid-test' },
    localStorage: memoryStorage(),
    indexedDB: { open() { return request(db); }, deleteDatabase(name) { deleted.push(name); return request(null); } },
    location: { search: '', href: 'http://127.0.0.1/index.html' },
    navigator: { onLine: false },
    document: { body: { dataset: {} }, querySelector() { return { hidden: true, textContent: '', value: '', reset() {} }; } },
    HTMLFormElement: function HTMLFormElement() {},
    HTMLInputElement: function HTMLInputElement() {},
    alert(message) { alerts.push(message); },
    Ledger, Sync, SyncStatus: Status,
    ensureFirebase: () => Promise.reject(Object.assign(new Error('offline'), { timeout: true })),
    disposeFirebase: () => Promise.resolve(false),
    flushRemote() { return Promise.resolve(); },
    render() {},
    isDeadAuth() { return false; },
    isImportFailure() { return false; },
  };
  const session = /** @type {RejectedVm} */ (/** @type {unknown} */ (context));
  session.window = session;
  vm.createContext(session);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/session.js'), 'utf8'), session);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/firebase-client.js'), 'utf8'), session);
  session.db = db;
  await session.set(session.K.projects, [
    { id: 'A', name: 'مشروع أ', currency: 'IQD', createdAtServer: 1 },
    { id: 'B', name: 'مشروع ب', currency: 'IQD', createdAtServer: 1 },
  ]);
  await session.set(session.K.entries, [entry({ id: 'e1', projectId: 'A' })]);
  await session.set(session.K.rejectedExportedIds, ['e1']);
  await session.set(session.K.outbox, []);
  await session.set(session.K.syncErrors, {});
  let snap = session.cacheSnapshot();
  assert.equal(Object.prototype.hasOwnProperty.call(snap, 'rejectedExportedIds'), false);
  session.writeCache(Sync.dropProjectLocal(snap, 'A', { dropPending: false }));
  snap = session.cacheSnapshot();
  session.writeCache(Sync.dropProjectLocal(snap, 'B', { dropPending: false }));
  const names = /** @type {Record<string, string>} */ (session.get(session.K.goneProjectNames, {}));
  assert.equal(names.A, 'مشروع أ');
  assert.equal(names.B, 'مشروع ب');
  await session.loadAll();
  assert.equal(JSON.stringify(session.get(session.K.rejectedExportedIds, [])), '["e1"]');
  assert.equal(fs.readFileSync(path.join(ROOT, 'public/session.js'), 'utf8').includes('PROJECT_DELETED'), false);

  const epoch = session.sessionEpoch;
  const blocked = await session.closeSession();
  assert.equal(blocked, false);
  assert.deepEqual(alerts, [BLOCK]);
  assert.equal(session.localStorage.getItem('aj-signout-pending'), null);
  assert.equal(session.sessionEpoch, epoch);
  assert.deepEqual(deleted, []);
  assert.equal(session.db, db);

  alerts.length = 0;
  session.cache.outbox = ['pending'];
  const outbox = await session.closeSession(() => false);
  assert.equal(outbox, false);
  assert.deepEqual(alerts, [OUTBOX]);

  alerts.length = 0;
  session.navigator.onLine = true;
  session.cache.outbox = [];
  session.ensureFirebase = async () => ({
    currentUser: async () => null,
  });
  session.cache[session.K.sessionUser] = owner();
  const dead = await session.closeSession(() => true);
  assert.equal(dead, true);
  assert.deepEqual(alerts, []);
  assert.deepEqual(deleted, []);

  alerts.length = 0;
  deleted.length = 0;
  session.ensureFirebase = async () => ({
    currentUser: async () => ({ uid: 'u-owner' }),
    idToken: async () => 'token',
    profile: async () => ({ active: false }),
  });
  const suspended = await session.closeSession(() => true);
  assert.equal(suspended, true);
  assert.deepEqual(alerts, []);
  assert.deepEqual(deleted, []);
});

test('an inactive profile offline is blocked at logout and has no export button', async () => {
  const inactive = { uid: 'u-off', role: 'owner', active: false, displayName: 'موقوف' };
  const row = entry({ id: 'e-off', createdBy: 'u-off' });
  const errors = { 'e-off': DELETED };
  const found = Ledger.deletedProjectEntries(inactive, [row], errors, DELETED);
  /** @type {{ id: string }[]} */
  const listed = [];
  found.forEach(item => { if (typeof item.id === 'string' && item.id) listed.push({ id: item.id }); });
  assert.equal(Ledger.canExportRejected(inactive), false);
  assert.equal(found.length, 1);
  assert.equal(listed.length, 1);
  assert.equal(Ledger.rejectedLogoutBlocked(listed, []), true);
  const alerts = [];
  const deleted = [];
  function request(result) {
    const req = { result };
    queueMicrotask(() => { if (req.onsuccess) req.onsuccess(); });
    return req;
  }
  const db = { name: 'aj-u-u-off', close() {}, transaction() {
    const tx = { objectStore() { return { count: () => request(0), get: () => request(null), getAll: () => request([]), getAllKeys: () => request([]) }; } };
    queueMicrotask(() => { if (tx.oncomplete) tx.oncomplete(); });
    return tx;
  } };
  const session = /** @type {RejectedVm} */ (/** @type {unknown} */ ({
    console, URL, URLSearchParams, Promise, queueMicrotask, setTimeout, clearTimeout,
    crypto: { randomUUID: () => 'uuid-off' },
    localStorage: memoryStorage(),
    indexedDB: { deleteDatabase(name) { deleted.push(name); return request(null); } },
    location: { search: '', href: 'http://127.0.0.1/index.html' },
    navigator: { onLine: false },
    document: { body: { dataset: {} }, querySelector() { return { hidden: true, textContent: '', value: '', reset() {} }; } },
    HTMLFormElement: function HTMLFormElement() {},
    HTMLInputElement: function HTMLInputElement() {},
    alert(message) { alerts.push(message); },
    ensureFirebase: () => Promise.reject(new Error('offline')),
    disposeFirebase: () => Promise.resolve(false),
    flushRemote() { return Promise.resolve(); },
    render() {},
    isDeadAuth() { return false; },
    isImportFailure() { return false; },
  }));
  session.window = session;
  vm.createContext(session);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/session.js'), 'utf8'), session);
  session.db = db;
  session.cache[session.K.sessionUser] = inactive;
  const epoch = session.sessionEpoch;
  const closed = await session.closeSession(() => Ledger.rejectedLogoutBlocked(listed, []));
  assert.equal(closed, false);
  assert.deepEqual(alerts, [BLOCK]);
  assert.equal(session.sessionEpoch, epoch);
  assert.deepEqual(deleted, []);
  assert.equal(session.db, db);
});

test('a subcontract or amendment refusal does not read the project', async () => {
  let probes = 0;
  const denyWrite = async () => { throw deny('permission-denied', 'Missing or insufficient permissions.'); };
  const probe = async () => { probes += 1; return { exists: false }; };
  const sub = { id: 'sc-1', projectId: 'p-school', name: 'عقد', work: '', agreedOn: '2026-11-01', createdBy: 'u' };
  const subcontract = await Sync.flushOutbox({
    ids: [sub.id],
    load: () => sub,
    write: denyWrite,
    readServer: async () => null,
    projectProbe: probe,
  });
  assert.equal(probes, 0);
  assert.equal(subcontract.failed[0].message, Status.REJECTED);
  const amend = { id: 'am-1', projectId: 'p-school', subcontractId: 'sc-1', date: '2026-11-02', amount: 10, createdBy: 'u' };
  const amendment = await Sync.flushOutbox({
    ids: [amend.id],
    load: () => amend,
    write: denyWrite,
    readServer: async () => null,
    projectProbe: probe,
  });
  assert.equal(probes, 0);
  assert.equal(amendment.failed[0].message, Status.REJECTED);
});

test('countedEntries drops both refusal sentences and keeps a pending id', () => {
  const rows = [entry({ id: 'gone', amount: 10 }), entry({ id: 'old', amount: 15 }), entry({ id: 'pend', amount: 20 }), entry({ id: 'ok', amount: 30 })];
  const errors = { gone: DELETED, old: Status.REJECTED };
  const counted = Ledger.countedEntries(rows, errors);
  assert.deepEqual(counted.map(row => row.id), ['pend', 'ok']);
  assert.equal(Ledger.rejectedLogoutBlocked([{ id: 'gone' }], []), true);
  assert.equal(Ledger.rejectedLogoutBlocked([{ id: 'gone' }], ['gone']), false);
  const recorded = ['gone'];
  assert.equal(Ledger.rejectedLogoutBlocked([{ id: 'gone' }], recorded), false);
  assert.deepEqual(recorded, ['gone']);
  assert.equal(Ledger.rejectedLogoutBlocked([{ id: 'gone' }, { id: 'next' }], ['gone']), true);
});

test('dropProjectLocal keeps the queued entry and the project name', () => {
  const src = {
    projects: [{ id: 'p-del', name: 'مشروع المدرسة', currency: 'IQD', createdAtServer: 1 }],
    entries: [{ id: 'del-wait', projectId: 'p-del', entryType: 'materials', amount: 250000 }],
    outbox: ['del-wait'],
    syncErrors: { 'del-pay': 'قديم' },
    goneProjectNames: { 'p-old': 'قديم' },
  };
  const kept = Sync.dropProjectLocal(src, 'p-del', { dropPending: false });
  assert.equal(kept.goneProjectNames['p-del'], 'مشروع المدرسة');
  assert.equal(kept.goneProjectNames['p-old'], 'قديم');
  assert.equal(kept.entries.some(row => row.id === 'del-wait'), true);
  const removed = Sync.dropProjectLocal(src, 'p-del', { dropPending: true });
  assert.equal(removed.entries.some(row => row.projectId === 'p-del'), false);
  assert.equal(removed.goneProjectNames['p-del'], 'مشروع المدرسة');
});

const REFUSED = 'رُفض الإرسال لأن المشروع محذوف';
const GONE_MSG = 'هذا المشروع لم يعد موجوداً. لم يُحفظ القيد، اختر مشروعاً ثم احفظ.';
const LINES_MSG = 'في هذا المشروع قيود لم تُرسل أو رُفض إرسالها. أرسلها أو صدّرها قبل الحذف.';

function memoryDb() {
  const lists = { projects: [], entries: [], outbox: [] };
  const meta = new Map();
  const calls = [];
  function request(result) {
    const req = { result };
    queueMicrotask(() => { if (req.onsuccess) req.onsuccess(); });
    return req;
  }
  const db = {
    name: 'aj-u-gone',
    close() {},
    transaction() {
      const tx = {
        objectStore(name) {
          if (name === 'meta') {
            return {
              getAllKeys: () => request([...meta.keys()]),
              getAll: () => request([...meta.values()]),
              get: key => request(meta.has(key) ? meta.get(key) : undefined),
              put(value, key) {
                calls.push(['put', 'meta', key]);
                meta.set(key, JSON.parse(JSON.stringify(value)));
              },
              delete(key) { calls.push(['delete', 'meta', key]); meta.delete(key); },
              clear() { calls.push(['clear', 'meta']); meta.clear(); },
              count: () => request(meta.size),
            };
          }
          const list = lists[name] || (lists[name] = []);
          return {
            getAll: () => request(list.map(row => Object.assign({}, row))),
            put(row) {
              calls.push(['put', name, row && row.id]);
              const copy = JSON.parse(JSON.stringify(row));
              const at = list.findIndex(item => item.id === copy.id);
              if (at >= 0) list[at] = copy;
              else list.push(copy);
            },
            delete(id) {
              calls.push(['delete', name, id]);
              const at = list.findIndex(item => item.id === id);
              if (at >= 0) list.splice(at, 1);
            },
            clear() { calls.push(['clear', name]); list.length = 0; },
            count: () => request(list.length),
          };
        },
      };
      queueMicrotask(() => { if (tx.oncomplete) tx.oncomplete(); });
      return tx;
    },
  };
  return { db, lists, meta, calls };
}

function openMemorySession(search) {
  const store = memoryDb();
  const context = {
    console, URL, URLSearchParams, Promise, queueMicrotask, setTimeout, clearTimeout,
    crypto: { randomUUID: () => 'uuid-gone' },
    indexedDB: {
      open() {
        const req = { result: store.db };
        queueMicrotask(() => { if (req.onsuccess) req.onsuccess(); });
        return req;
      },
    },
    location: { search: search || '', href: 'http://127.0.0.1/index.html', hash: '#project/A' },
    navigator: { onLine: true, serviceWorker: null },
    document: {
      body: { dataset: {} },
      addEventListener() {},
      /**
       * @param {string} [sel]
       * @returns {null | { hidden: boolean, textContent: string, innerHTML: string, value: string, reset?: () => void }}
       */
      querySelector(sel) {
        void sel;
        return { hidden: true, textContent: '', innerHTML: '', value: '', reset() {} };
      },
      querySelectorAll() { return []; },
      createElement() { return { hidden: true, textContent: '', append() {}, appendChild() {} }; },
      createElementNS() { return { setAttribute() {}, append() {} }; },
    },
    addEventListener() {},
    localStorage: memoryStorage(),
    sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    Ledger, Sync, SyncStatus: Status,
    HTMLFormElement: function HTMLFormElement() {},
    HTMLInputElement: function HTMLInputElement() {},
    alert() {},
    ensureFirebase() { return Promise.resolve(); },
    disposeFirebase() { return Promise.resolve(false); },
    flushRemote() { return Promise.resolve(); },
    render() {},
    isDeadAuth() { return false; },
    isImportFailure() { return false; },
    caches: { keys: () => Promise.resolve([]), delete: () => Promise.resolve(true) },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/session.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/firebase-client.js'), 'utf8'), context);
  context.db = store.db;
  return { session: context, store };
}

function ids(rows) {
  return (rows || []).map(row => row && row.id).filter(Boolean).sort();
}

test('a drop on the other phone deletes the project and the synced entry and keeps the queued and refused rows', async () => {
  const { session } = openMemorySession();
  await session.set(session.K.projects, [
    { id: 'A', name: 'مشروع أ', status: 'active', currency: 'IQD', createdAtServer: 1 },
    { id: 'B', name: 'مشروع ب', status: 'active', currency: 'IQD', createdAtServer: 1 },
  ]);
  await session.set(session.K.entries, [
    { id: 'synced', projectId: 'A', entryType: 'materials', amount: 10 },
    { id: 'queued', projectId: 'A', entryType: 'materials', amount: 20 },
    { id: 'refused', projectId: 'A', entryType: 'materials', amount: 30 },
  ]);
  await session.set(session.K.outbox, ['queued']);
  await session.set(session.K.syncErrors, { refused: REFUSED });
  const before = session.cacheSnapshot();
  const next = Sync.dropProjectLocal(before, 'A', { dropPending: false });
  await session.writeCache(next, before);
  await session.loadAll();
  assert.deepEqual(Array.from(ids(session.get(session.K.projects))), ['B']);
  assert.deepEqual(Array.from(ids(session.get(session.K.entries))), ['queued', 'refused']);
  assert.equal(session.get(session.K.goneProjectNames, {}).A, 'مشروع أ');
});

test('an entry id in the pre-drop outbox is not deleted when the live outbox has dropped it', async () => {
  const { session } = openMemorySession();
  await session.set(session.K.projects, [{ id: 'A', name: 'مشروع أ', currency: 'IQD' }]);
  await session.set(session.K.entries, [{ id: 'queued', projectId: 'A', entryType: 'materials', amount: 20 }]);
  await session.set(session.K.outbox, []);
  await session.set(session.K.syncErrors, {});
  const before = { outbox: ['queued'], syncErrors: {}, entries: [], projects: [] };
  await session.deleteRemovedLocalIds({ projectIds: [], entryIds: ['queued'] }, before);
  await session.loadAll();
  assert.equal(ids(session.get(session.K.entries)).includes('queued'), true);
});

test('an entry id named by the pre-drop syncErrors is not deleted when the live map has dropped it', async () => {
  const { session } = openMemorySession();
  await session.set(session.K.projects, [{ id: 'A', name: 'مشروع أ', currency: 'IQD' }]);
  await session.set(session.K.entries, [{ id: 'refused', projectId: 'A', entryType: 'materials', amount: 30 }]);
  await session.set(session.K.outbox, []);
  await session.set(session.K.syncErrors, { refused: REFUSED });
  session.cache[session.K.syncErrors] = {};
  const before = { outbox: [], syncErrors: { refused: REFUSED }, entries: [], projects: [] };
  await session.deleteRemovedLocalIds({ projectIds: [], entryIds: ['refused'] }, before);
  await session.loadAll();
  assert.equal(ids(session.get(session.K.entries)).includes('refused'), true);
  assert.equal(session.get(session.K.syncErrors, {}).refused, REFUSED);
});

test('a project id still in memory is not deleted from IndexedDB', async () => {
  const { session } = openMemorySession();
  await session.set(session.K.projects, [
    { id: 'A', name: 'مشروع أ', currency: 'IQD', createdAtServer: 1 },
    { id: 'B', name: 'مشروع ب', currency: 'IQD', createdAtServer: 1 },
  ]);
  const before = session.cacheSnapshot();
  const next = Sync.dropProjectLocal(before, 'A', { dropPending: false });
  await session.writeCache(next);
  const live = session.get(session.K.projects, []).map(row => row.id);
  assert.equal(live.includes('B'), true);
  assert.equal(live.includes('A'), false);
  await session.deleteRemovedLocalIds({ projectIds: ['A', 'B'], entryIds: [] }, before);
  await session.loadAll();
  assert.deepEqual(Array.from(ids(session.get(session.K.projects))), ['B']);
});

test('deleteRemovedLocalIds deletes by id and does not clear the project or entry store', async () => {
  const { session, store } = openMemorySession();
  await session.set(session.K.projects, [{ id: 'A', name: 'أ' }, { id: 'B', name: 'ب' }]);
  await session.set(session.K.entries, [{ id: 's', projectId: 'A' }, { id: 'b', projectId: 'B' }]);
  await session.set(session.K.outbox, []);
  await session.set(session.K.syncErrors, {});
  session.cache[session.K.projects] = [{ id: 'B', name: 'ب' }];
  store.calls.length = 0;
  const before = { outbox: [], syncErrors: {}, entries: [], projects: [] };
  await session.deleteRemovedLocalIds({ projectIds: ['A'], entryIds: ['s'] }, before);
  const cleared = store.calls.filter(call => call[0] === 'clear' && (call[1] === 'projects' || call[1] === 'entries'));
  assert.equal(cleared.length, 0);
  assert.equal(store.calls.some(call => call[0] === 'delete' && call[1] === 'projects' && call[2] === 'A'), true);
  assert.equal(store.calls.some(call => call[0] === 'delete' && call[1] === 'entries' && call[2] === 's'), true);
});

test('the deleting-phone union keeps q, r, and an entry queued on the other project', async () => {
  const { session } = openMemorySession();
  await session.set(session.K.projects, [
    { id: 'A', name: 'مشروع أ', currency: 'IQD', createdAtServer: 1 },
    { id: 'B', name: 'مشروع ب', currency: 'IQD', createdAtServer: 1 },
  ]);
  await session.set(session.K.entries, [
    { id: 's', projectId: 'A', entryType: 'materials', amount: 1 },
    { id: 'q', projectId: 'A', entryType: 'materials', amount: 2 },
    { id: 'r', projectId: 'A', entryType: 'materials', amount: 3 },
    { id: 'b', projectId: 'B', entryType: 'materials', amount: 4 },
  ]);
  await session.set(session.K.outbox, ['q']);
  await session.set(session.K.syncErrors, { r: REFUSED });
  const before = session.cacheSnapshot();
  const liveEntries = session.get(session.K.entries, []).concat([{ id: 'n', projectId: 'B', entryType: 'materials', amount: 5 }]);
  await session.set(session.K.entries, liveEntries);
  await session.set(session.K.outbox, ['q', 'n']);
  const next = Sync.dropProjectLocal(before, 'A', { dropPending: true });
  await session.writeCache(next, before);
  await session.loadAll();
  assert.equal(ids(session.get(session.K.projects)).includes('A'), false);
  assert.equal(ids(session.get(session.K.projects)).includes('B'), true);
  const left = ids(session.get(session.K.entries));
  assert.equal(left.includes('s'), false);
  assert.equal(left.includes('b'), true);
  assert.equal(left.includes('q'), true);
  assert.equal(left.includes('r'), true);
  assert.equal(left.includes('n'), true);
  const outbox = session.get(session.K.outbox, []);
  assert.equal(outbox.includes('q'), true);
  assert.equal(outbox.includes('n'), true);
  assert.equal(session.get(session.K.syncErrors, {}).r, REFUSED);
});

test('a thrown owner read does not drop the project', async () => {
  const { session } = openMemorySession();
  await session.set(session.K.projects, [{ id: 'A', name: 'مشروع أ', currency: 'IQD', status: 'active', createdAtServer: 1 }]);
  await session.set(session.K.entries, []);
  await session.set(session.K.outbox, []);
  const ownerUser = { uid: 'owner-1', role: 'owner', active: true };
  await session.forgetGoneProjects(ownerUser, [], async () => { throw new Error('read failed'); }).catch(() => {});
  assert.equal(ids(session.get(session.K.projects)).includes('A'), true);
  await session.loadAll();
  assert.equal(ids(session.get(session.K.projects)).includes('A'), true);
});

test('a demo delete does not remove the project row from IndexedDB', async () => {
  const { session } = openMemorySession('?role=owner');
  const found = {};
  function node() {
    return {
      hidden: true, textContent: '', innerHTML: '', value: '', disabled: false, dataset: {},
      classList: { toggle() {} },
      setAttribute() {}, removeAttribute() {},
      querySelector() { return null; }, querySelectorAll() { return []; },
      append() {}, appendChild() {}, remove() {}, addEventListener() {},
    };
  }
  session.document.querySelector = sel => {
    if (!found[sel]) found[sel] = node();
    return found[sel];
  };
  session.document.querySelectorAll = () => [];
  session.PeopleDir = {
    RENDER_ERROR: 'x', TIMEOUT_MS: 1,
    createLoader() { return { run() { return Promise.resolve(); }, failed() { return false; }, reset() {} }; },
  };
  session.Accounts = { balances() { return { net: 0 }; } };
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/render.js'), 'utf8'), session);
  await session.set(session.K.users, [{ uid: 'u-ameer', role: 'owner', active: true, displayName: 'أمير' }]);
  await session.set(session.K.projects, [{ id: 'A', name: 'مشروع أ', status: 'active', currency: 'IQD', createdAtServer: 1 }]);
  await session.set(session.K.entries, []);
  await session.set(session.K.outbox, []);
  await session.set(session.K.syncErrors, {});
  await session.deleteProjectNow('A');
  await session.loadAll();
  assert.equal(ids(session.get(session.K.projects)).includes('A'), true);
});

test('a blocked entry form disables حفظ and keeps the amount, the note, and the party', async () => {
  const { session } = openMemorySession();
  const found = {};
  function node() {
    return {
      hidden: true, textContent: '', innerHTML: '', value: '', disabled: false, dataset: {},
      classList: { toggle() {} },
      setAttribute() {}, removeAttribute() {},
      querySelector() { return null; }, querySelectorAll() { return []; },
      append() {}, appendChild() {}, remove() {}, addEventListener() {},
    };
  }
  session.document.querySelector = sel => {
    if (sel === '.tabs') return null;
    if (!found[sel]) found[sel] = node();
    return found[sel];
  };
  session.document.querySelectorAll = () => [];
  session.PeopleDir = {
    RENDER_ERROR: 'x', TIMEOUT_MS: 1,
    createLoader() { return { run() { return Promise.resolve(); }, failed() { return false; }, reset() {} }; },
  };
  session.location.hash = '#entry/p-gone';
  session.cache[session.K.sessionUser] = { uid: 'u-owner', role: 'owner', active: true, displayName: 'مالك' };
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/render.js'), 'utf8'), session);
  await session.set(session.K.projects, [{ id: 'p-only', name: 'المتبقي', status: 'active', currency: 'IQD' }]);
  await session.set(session.K.entries, []);
  session.document.querySelector('#amt');
  session.document.querySelector('#desc');
  session.document.querySelector('#party');
  found['#amt'].value = '1500';
  found['#desc'].value = 'ملاحظة';
  found['#party'].value = 'جهة';
  const before = session.get(session.K.entries, []).length;
  session.render();
  const html = found['#main'].innerHTML;
  assert.equal(html.includes('id="save" disabled'), true);
  assert.equal(html.includes(GONE_MSG), true);
  assert.equal(html.includes('1500'), true);
  assert.equal(html.includes('ملاحظة'), true);
  assert.equal(html.includes('جهة'), true);
  assert.equal(html.includes('pill on" data-proj'), false);
  assert.equal(session.get(session.K.entries, []).length, before);
  assert.equal(session.projectLinesBlock('p-only'), '');
  await session.set(session.K.entries, [{ id: 'q', projectId: 'p-only' }]);
  await session.set(session.K.outbox, ['q']);
  assert.equal(session.projectDeleteBlock('p-only'), LINES_MSG);
});
