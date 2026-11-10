const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('vm');
const Sync = require('../public/sync.js');
const Status = require('../public/sync-status.js');
const Ledger = require('../public/ledger.js');

const ROOT = path.join(__dirname, '..');
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
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
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
  const session = /** @type {any} */ (context);
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
  const names = session.get(session.K.goneProjectNames, {});
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
