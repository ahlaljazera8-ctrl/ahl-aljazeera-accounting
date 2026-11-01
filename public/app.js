'use strict';
// Storage: IndexedDB "aj-p0" (stores: projects, entries, outbox, meta). Loaded into memory at boot; every write is
// persisted to IndexedDB (write-through, serialized). "Server" is simulated; outbox = ids not sent yet (no syncState).
const L = window.Ledger, POLICY = L.DEFAULT_POLICY;
const K = { projects:'projects', entries:'entries', outbox:'outbox', users:'users', finance:'projectFinance', role:'role', device:'deviceId', seeded:'seeded', sessionUser:'sessionUser', syncErrors:'syncErrors', pullWatermark:'pullWatermark' };
const demoRole = () => { const r = new URLSearchParams(location.search).get('role'); return r === 'owner' || r === 'site' ? r : ''; };
const LIST = { projects:1, entries:1, outbox:1 };
const cache = {};
let db, writing = Promise.resolve();
const req = r => new Promise((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
function openDB(name) {
  const r = indexedDB.open(name, 1);
  r.onblocked = () => console.warn('IndexedDB open blocked by an older connection:', name);
  r.onupgradeneeded = () => { const d = r.result;
    d.createObjectStore('projects', { keyPath:'id' }); d.createObjectStore('entries', { keyPath:'id' });
    d.createObjectStore('outbox', { keyPath:'id' }); d.createObjectStore('meta'); };
  return req(r).then(d => {
    d.onversionchange = () => { d.close(); if (db === d) db = null; };
    return d;
  });
}
const LOGIN_MS = 20000;
function withTimeout(p, ms, step) {
  let t;
  const err = new Error('انتهت المهلة (' + step + '). تحقق من الاتصال وأعد المحاولة');
  err.timeout = true;
  return Promise.race([
    Promise.resolve(p),
    new Promise((_, no) => { t = setTimeout(() => no(err), ms); }),
  ]).finally(() => clearTimeout(t));
}
function isPoison(err) {
  if (!err) return false;
  if (err.timeout) return true;
  const text = String((err && err.message) || err) + ' ' + String((err && err.code) || '');
  return /INTERNAL ASSERTION FAILED|Unexpected state|\bca9\b|\bb815\b/i.test(text);
}
let sessionEpoch = 0;
async function loadAll() {
  const tx = db.transaction(['projects','entries','outbox','meta'], 'readonly');
  cache.projects = await req(tx.objectStore('projects').getAll());
  cache.entries = (await req(tx.objectStore('entries').getAll())).sort((a, b) => a.createdAtDevice - b.createdAtDevice || (a.id < b.id ? -1 : 1));
  cache.outbox = (await req(tx.objectStore('outbox').getAll())).sort((a, b) => a.queuedAt - b.queuedAt).map(o => o.id);
  const ms = tx.objectStore('meta'); const keys = await req(ms.getAllKeys()); const vals = await req(ms.getAll());
  keys.forEach((k, i) => cache[k] = vals[i]);
}
const get = (k, d) => cache[k] === undefined ? d : JSON.parse(JSON.stringify(cache[k]));
function set(k, v) {
  cache[k] = JSON.parse(JSON.stringify(v));
  writing = writing.catch(() => {}).then(() => new Promise((ok, no) => {
    if (!db) return ok();
    const name = LIST[k] ? k : 'meta'; const tx = db.transaction(name, 'readwrite'); const st = tx.objectStore(name);
    if (k === 'outbox') { st.clear(); v.forEach((id, i) => st.put({ id, queuedAt: i })); }
    else if (LIST[k]) v.forEach(x => st.put(x)); // entries/projects never deleted (append-only)
    else st.put(v, k);
    tx.oncomplete = ok; tx.onerror = () => no(tx.error);
  }));
  return writing;
}
window.AJ = { get, flush: () => writing };
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));
const today = () => new Date().toISOString().slice(0, 10);
let deviceId;

function seed() {
  if (get(K.seeded)) return;
  const t = Date.parse('2026-10-01T09:00:00Z');
  const users = [
    { uid:'u-ameer', displayName:'أمير', email:'owner@example.invalid', role:'owner', active:true, assignedProjectIds:[], createdAtServer:t, createdBy:'u-ameer' },
    { uid:'u-ahmed', displayName:'أحمد', email:'ahmed@example.invalid', role:'site', active:true, assignedProjectIds:['p-school','p-road'], createdAtServer:t, createdBy:'u-ameer' },
  ];
  const P = (id, name, clientName) => ({ id, name, clientName, location:'مثال', currency:'IQD', status:'active', createdAtDevice:t, createdAtServer:t, createdBy:'u-ameer', deviceId:'seed', isExample:true });
  const projects = [P('p-school','مشروع المدرسة','زبون مثال 1'), P('p-road','مشروع الطريق','زبون مثال 2'), P('p-market','بناية السوق','زبون مثال 3')];
  let n = 0;
  const E = (projectId, entryType, amount, description, by, extra = {}) => {
    const row = { id:'seed-' + (++n), projectId, direction:L.ENTRY_TYPES[entryType].direction, entryType, amount, currency:'IQD', entryDate:'2026-10-' + String(n).padStart(2,'0'), description: description + ' (مثال)', partyName:'', isReversal:false, createdAtDevice:t + n*1000, createdAtServer:t + n*1000, createdBy:by, deviceId:'seed', ...extra };
    if (!Object.prototype.hasOwnProperty.call(extra, 'createdByName')) {
      const name = L.recorderName(users.find(u => u.uid === by));
      if (name) row.createdByName = name;
    } else if (extra.createdByName == null) delete row.createdByName;
    return row;
  };
  const es = [
    E('p-school','clientPayment',40000000,'دفعة أولى','u-ameer'),
    E('p-school','materials',30000000,'حديد وإسمنت','u-ameer'),
    E('p-school','subcontractor',7200000,'مقاول كهرباء','u-ameer'),
    E('p-school','materials',50000,'إدخال خاطئ','u-ahmed', { createdByName: null }),
    E('p-road','clientPayment',11200000,'دفعة','u-ameer'),
    E('p-road','labour',8200000,'أجور عمال','u-ahmed'),
    E('p-market','clientPayment',6000000,'دفعة','u-ameer'),
    E('p-market','subcontractor',6800000,'مقاول بناء','u-ameer'),
    E('p-school','clientPayment',10000000,'دفعة عميل','u-ameer'),
  ];
  const lg = L.createLedger(es);
  const rev = L.makeReversal(es[3], { user:users[0], reason:'مبلغ مكرر (مثال)', now:t+99000, deviceId:'seed', entryDate:'2026-10-20' });
  lg.append(rev, { user:users[0], projects, policy:POLICY });
  lg.append(E('p-road','clientPayment',2000000,'دفعة استلمها أحمد','u-ahmed', { entryDate:'2026-10-12' }), { user:users[1], projects, policy:POLICY });
  const pend1 = E('p-school','materials',250000,'إسمنت','u-ahmed'), pend2 = E('p-school','labour',100000,'سلفة عامل','u-ahmed');
  pend1.createdAtServer = pend2.createdAtServer = null;
  lg.append(pend1, { user:users[1], projects, policy:POLICY }); lg.append(pend2, { user:users[1], projects, policy:POLICY });
  set(K.users, users); set(K.projects, projects); set(K.entries, lg.all()); set(K.outbox, [pend1.id, pend2.id]);
  set(K.finance, { 'p-school': { contractAmount: 60000000 }, 'p-road': { contractAmount: 20000000 }, 'p-market': { contractAmount: 15000000 } });
  set(K.seeded, true);
}
const state = { type: 'materials', amount: 0, formId: uuid(), backStack: [] };
let directoryPromise = null;
const me = () => {
  if (!demoRole()) { const s = get(K.sessionUser, null); if (s && s.uid) return s; }
  const role = get(K.role, demoRole() || 'owner');
  return get(K.users, []).find(u => u.uid === (role === 'site' ? 'u-ahmed' : 'u-ameer'));
};
const showLogin = () => { $('#login').hidden = false; $('#shell').hidden = true; };
const showApp = () => { $('#login').hidden = true; $('#shell').hidden = false; };
function profileFrom(uid, data) {
  return { uid, displayName: data.displayName || '', email: data.email || '', role: data.role, active: data.active === true,
    assignedProjectIds: Array.isArray(data.assignedProjectIds) ? data.assignedProjectIds : [], createdAtServer: data.createdAtServer || null, createdBy: data.createdBy || '' };
}
function loginError(err) {
  const code = err && err.code;
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-email') return 'البريد أو كلمة المرور غير صحيحة';
  if (code === 'auth/too-many-requests') return 'محاولات كثيرة. انتظر ثم أعد المحاولة';
  if (code === 'auth/network-request-failed' || code === 'unavailable' || code === 'deadline-exceeded') return 'تعذر الاتصال. تحقق من الإنترنت';
  return 'تعذر الدخول';
}
// 13.1.0 is the newest JS SDK (2026-10-21). Its ca9 watch-target fix from 12.13.0
// still leaves the assertion reachable, so a newer FB_VER is not available to upgrade to.
const FB_VER = '13.1.0';
let fbPromise = null;
function isImportFailure(err) {
  const text = String((err && err.message) || err || '');
  return /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module/i.test(text);
}
// One reload if the module scripts themselves failed. Does not touch aj-u-* or the outbox.
async function recoverModuleOnce() {
  if (sessionStorage.getItem('aj-sw-heal') === '1') return;
  if (new URL(location.href).searchParams.has('sw')) return;
  sessionStorage.setItem('aj-sw-heal', '1');
  try {
    if (navigator.serviceWorker) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch (e) {}
  location.reload();
}
function ensureFirebase() {
  if (fbPromise) return fbPromise;
  fbPromise = (async () => {
    try { return await loadFirebase(); }
    catch (err1) {
      try { return await loadFirebase(); }
      catch (err2) {
        if (isImportFailure(err2)) await recoverModuleOnce();
        throw err2;
      }
    }
  })().catch(err => { fbPromise = null; throw err; });
  return fbPromise;
}
async function loadFirebase() {
  const base = 'https://www.gstatic.com/firebasejs/' + FB_VER + '/';
  const [{ initializeApp, deleteApp, getApps }, authMod, fsMod] = await Promise.all([
    import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js'),
  ]);
  const stale = getApps().find(a => a.name === '[DEFAULT]');
  if (stale) await deleteApp(stale).catch(() => {});
  const app = initializeApp(window.FIREBASE_CONFIG);
  const auth = authMod.getAuth(app);
  const emulator = new URLSearchParams(location.search).get('emulator') === '1';
  if (emulator) authMod.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  // The ledger's offline store is aj-u- (entries, projects, outbox). Firestore's
  // persistentLocalCache is a second store, and it is what replays a failed watch
  // stream (ca9, then b815) after the auth user changes — including on the next launch.
  let fdb;
  try {
    fdb = fsMod.initializeFirestore(app, { localCache: fsMod.memoryLocalCache() });
  } catch (e) { fdb = fsMod.getFirestore(app); }
  if (emulator) fsMod.connectFirestoreEmulator(fdb, '127.0.0.1', 8080);
  // Drop IndexedDB left by the old persistent cache before any read. Memory cache
  // does not open it; deleting it is what unblocks a phone that already saved the bad state.
  await withTimeout(fsMod.clearIndexedDbPersistence(fdb), 5000, 'الذاكرة').catch(() => {});
  const S = window.Sync;
  return {
    auth, db: fdb,
    signIn: (email, password) => authMod.signInWithEmailAndPassword(auth, email, password),
    signOut: () => authMod.signOut(auth),
    currentUser: async () => { await auth.authStateReady(); return auth.currentUser; },
    // Clear persisted watch state, then tear the client down. The SDK rejects a clear
    // while this instance is running, so a rejected clear is followed by terminate and a second clear.
    async dispose(signOutUser) {
      const step = async fn => { try { await fn(); return true; } catch (e) { return false; } };
      // Clear before terminate. A running client rejects that, so terminate and clear again.
      const cleared = await step(() => fsMod.clearIndexedDbPersistence(fdb));
      await step(() => withTimeout(fsMod.terminate(fdb), 3000, 'إغلاق'));
      if (!cleared) await step(() => withTimeout(fsMod.clearIndexedDbPersistence(fdb), 3000, 'إغلاق'));
      if (signOutUser) await step(() => withTimeout(authMod.signOut(auth), 3000, 'خروج'));
      await step(() => withTimeout(deleteApp(app), 3000, 'إغلاق'));
    },
    async profile(uid) {
      const snap = await fsMod.getDoc(fsMod.doc(fdb, 'users', uid));
      return snap.exists() ? snap.data() : null;
    },
    async listUsers() {
      const snap = await fsMod.getDocsFromServer(fsMod.collection(fdb, 'users'));
      return snap.docs.map(d => {
        const row = profileFrom(d.id, d.data());
        const ts = d.data().createdAtServer;
        if (ts && typeof ts.toMillis === 'function') row.createdAtServer = ts.toMillis();
        else if (ts && typeof ts.seconds === 'number') row.createdAtServer = ts.seconds * 1000;
        return row;
      });
    },
    async saveUser(uid, value, existing) {
      const createdAt = existing && typeof existing.createdAtServer === 'number'
        ? fsMod.Timestamp.fromMillis(existing.createdAtServer)
        : fsMod.serverTimestamp();
      await fsMod.setDoc(fsMod.doc(fdb, 'users', uid), {
        displayName: value.displayName,
        email: value.email,
        role: value.role,
        active: value.active,
        assignedProjectIds: value.assignedProjectIds,
        createdBy: existing && existing.createdBy ? existing.createdBy : auth.currentUser.uid,
        createdAtServer: createdAt,
      });
    },
    async writeLocal(local) {
      const clean = S.withoutContractAmount(local);
      const col = S.collectionFor(clean);
      await fsMod.setDoc(fsMod.doc(fdb, col, clean.id), S.withServerTime(clean, fsMod.serverTimestamp()));
      if (col !== 'projects') return;
      const user = get(K.sessionUser, null);
      if (!user || user.role !== 'owner') return;
      const stored = get(K.finance, {})[clean.id];
      const explicit = stored && Number.isInteger(stored.contractAmount) ? stored.contractAmount : undefined;
      const saved = S.splitProjectSave(local, explicit);
      if (!saved.finance) return;
      await fsMod.setDoc(fsMod.doc(fdb, 'projectFinance', clean.id), saved.finance);
      const fin = get(K.finance, {});
      fin[clean.id] = { contractAmount: saved.finance.contractAmount };
      set(K.finance, fin);
      set(K.projects, get(K.projects, []).map(p => p.id === clean.id ? S.withoutContractAmount(p) : p));
    },
    async exists(local) {
      const snap = await fsMod.getDocFromServer(fsMod.doc(fdb, S.collectionFor(local), local.id));
      return snap.exists();
    },
    async pull(user) {
      const readSpec = async spec => {
        if (spec.id) {
          const snap = await fsMod.getDocFromServer(fsMod.doc(fdb, spec.collection, spec.id));
          return snap.exists() ? [snap.data()] : [];
        }
        const col = fsMod.collection(fdb, spec.collection);
        const clauses = (spec.where || []).map(([field, op, value]) => fsMod.where(
          field, op, field === 'createdAtServer' ? fsMod.Timestamp.fromMillis(value) : value));
        const src = clauses.length ? fsMod.query(col, ...clauses) : col;
        const snap = await fsMod.getDocsFromServer(src);
        return snap.docs.map(d => d.data());
      };
      const result = await S.pullChanges({
        user,
        watermark: get(K.pullWatermark, null),
        pendingIds: get(K.outbox, []),
        localEntries: get(K.entries, []),
        localProjects: get(K.projects, []),
        read: readSpec,
      });
      set(K.projects, S.projectsForClient(user, result.projects));
      set(K.entries, result.entries);
      set(K.pullWatermark, result.watermark);
      const fin = get(K.finance, {});
      let changed = false;
      for (const spec of S.financeReads(user, (result.projects || []).map(p => p && p.id))) {
        const rows = await readSpec(spec);
        const amount = rows[0] && rows[0].contractAmount;
        if (!Number.isInteger(amount) || (fin[spec.id] && fin[spec.id].pending)) continue;
        fin[spec.id] = { contractAmount: amount };
        changed = true;
      }
      if (changed) set(K.finance, fin);
    },
  };
}
let flushing = null;
let syncNotice = '';
const FLUSH_MS = 20000;
const SEND_RETRY = 'تعذر الإرسال. أعد المحاولة';
const PULL_RETRY = 'تعذر التحديث. أعد المحاولة';
const REPAIR_MSG = 'تعذر الدخول بعد إصلاح الذاكرة المحلية. تحقق من الاتصال وأعد المحاولة';
async function disposeFirebase(signOutUser) {
  const pending = fbPromise;
  fbPromise = null;
  flushing = null;
  if (!pending) return;
  const fb = await pending.catch(() => null);
  if (fb && fb.dispose) await fb.dispose(!!signOutUser);
}
async function rebuildFirebase(signOutUser) {
  await disposeFirebase(signOutUser);
  return ensureFirebase();
}
function flushRemote() {
  if (demoRole() || !get(K.sessionUser)) return Promise.resolve();
  if (flushing) return flushing;
  const token = sessionEpoch;
  // Store the lock before the body runs. An offline save used to return inside
  // the async function before this assignment, so finally cleared a lock that
  // was not set yet and the finished promise was what later calls reused.
  let begin;
  const run = new Promise((resolve, reject) => {
    begin = () => { performFlush(token, run).then(resolve, reject); };
  });
  flushing = run;
  begin();
  const timer = setTimeout(() => {
    if (flushing !== run || token !== sessionEpoch) return;
    flushing = null;
    syncNotice = get(K.outbox, []).length ? SEND_RETRY : PULL_RETRY;
    if (get(K.sessionUser) && !$('#shell').hidden) render();
  }, FLUSH_MS);
  run.then(() => clearTimeout(timer), () => clearTimeout(timer));
  return run;
}
async function performFlush(token, run) {
  let started = null;
  try {
    if (token !== sessionEpoch || navigator.onLine === false) return;
    const fb = await ensureFirebase();
    if (token !== sessionEpoch) return;
    const user = get(K.sessionUser);
    if (!user) return;
    const ids = get(K.outbox, []).slice();
    started = new Set(ids);
    const entries = get(K.entries, []); const projects = get(K.projects, []);
    if (ids.length) {
      const result = await window.Sync.flushOutbox({
        ids,
        load: id => entries.find(e => e.id === id) || projects.find(p => p.id === id) || null,
        write: local => fb.writeLocal(local),
        exists: local => fb.exists(local),
        readServer: async local => {
          try {
            if (typeof fb.readServer === 'function') return await fb.readServer(local);
            if (window.SyncStatus && fb.db) return await SyncStatus.readRemote(fb.db, window.Sync.collectionFor(local), local.id);
          } catch (e) {}
          return null;
        },
      });
      if (token !== sessionEpoch) return;
      if (window.SyncStatus) {
        const next = SyncStatus.applyFlush(get(K.outbox, []), get(K.syncErrors, {}), result);
        set(K.outbox, next.outbox);
        set(K.syncErrors, next.errors);
      } else set(K.outbox, get(K.outbox, []).filter(id => !(result.synced || []).includes(id)));
      if ((result.kept || []).length) syncNotice = SEND_RETRY;
      else if (!(result.failed || []).length) syncNotice = '';
    }
    if (token !== sessionEpoch) return;
    try {
      await fb.pull(user);
      if (token === sessionEpoch && !get(K.outbox, []).length) syncNotice = '';
    } catch (err) {
      if (token === sessionEpoch) syncNotice = get(K.outbox, []).length ? SEND_RETRY : PULL_RETRY;
    }
  } catch (err) {
    if (token === sessionEpoch) syncNotice = SEND_RETRY;
  } finally {
    if (flushing === run) flushing = null;
    if (token === sessionEpoch && get(K.sessionUser) && !$('#shell').hidden) render();
  }
  if (started && token === sessionEpoch && navigator.onLine !== false && get(K.sessionUser) && get(K.outbox, []).some(id => !started.has(id))) {
    return flushRemote();
  }
}
async function closeUserDb() {
  directoryPromise = null;
  if (db) {
    set(K.sessionUser, null);
    await writing.catch(() => {});
    try { db.close(); } catch (e) {}
    db = null;
  }
  for (const k of Object.keys(cache)) delete cache[k];
}
function deleteDb(name) {
  return new Promise(ok => {
    const done = () => { clearTimeout(timer); ok(); };
    const timer = setTimeout(done, 2000);
    const r = indexedDB.deleteDatabase(name);
    r.onsuccess = r.onerror = r.onblocked = done;
  });
}
async function outboxEmpty() {
  if (get(K.outbox, []).length) return false;
  if (!db) return true;
  await writing.catch(() => {});
  try {
    const n = await req(db.transaction('outbox', 'readonly').objectStore('outbox').count());
    return n === 0;
  } catch (e) { return false; }
}
const SHELL_FILES = { 'index.html':1, 'style.css':1, 'ledger.js':1, 'sync.js':1, 'sync-status.js':1, 'dom-safe.js':1, 'appcheck.js':1, 'firebase-config.js':1, 'app.js':1, 'manifest.json':1, 'icon.svg':1 };
function isShellCacheRequest(raw) {
  const url = new URL(raw);
  if (url.origin !== location.origin || url.search) return false;
  if (url.pathname === '/' || url.pathname.endsWith('/')) return true;
  return SHELL_FILES[url.pathname.slice(url.pathname.lastIndexOf('/') + 1)] === 1;
}
async function clearExtraCaches() {
  if (!window.caches) return;
  const keys = await caches.keys();
  await Promise.all(keys.map(async key => {
    const cache = await caches.open(key);
    const reqs = await cache.keys();
    await Promise.all(reqs.map(req => isShellCacheRequest(req.url) ? null : cache.delete(req)));
  }));
}
async function closeSession() {
  if (!await outboxEmpty()) {
    alert('يوجد قيود لم تُرسل. أرسلها أولاً ثم اخرج');
    return false;
  }
  const name = db && db.name;
  sessionEpoch += 1;
  try {
    await closeUserDb();
    if (name && name.indexOf('aj-u-') === 0) await deleteDb(name);
    await disposeFirebase(true);
    await clearExtraCaches();
  } catch (e) {}
  return true;
}
async function openUserDb(uid) {
  if (db) { try { db.close(); } catch (e) {} db = null; }
  for (const k of Object.keys(cache)) delete cache[k];
  db = await openDB('aj-u-' + uid);
  await loadAll();
  if (!get(K.device)) set(K.device, uuid());
  deviceId = get(K.device);
}
async function enterSession(fb, uid, data) {
  const profile = profileFrom(uid, data);
  if (!profile.active || !['owner', 'site'].includes(profile.role)) {
    await disposeFirebase(true);
    throw new Error(data && data.active === false ? 'هذا الحساب موقوف' : 'لا يوجد ملف مستخدم. اطلب من المالك إنشاء الحساب');
  }
  await openUserDb(uid);
  set(K.sessionUser, profile);
  showApp();
  render();
  flushRemote();
}
const ledger = () => L.createLedger(get(K.entries, []));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => `<b class="num">${L.fmt(n)} د.ع</b>`;
const $ = s => document.querySelector(s);
const roleLabel = role => role === 'owner' ? 'مالك' : 'مستخدم موقع';
function shownContract(id, project) {
  const fin = (get(K.finance, {}) || {})[id];
  if (fin && Number.isInteger(fin.contractAmount)) return fin.contractAmount;
  return window.Sync.contractAmountOf(project);
}
function assignBox(project, on) {
  const attr = window.DomSafe && DomSafe.projectAttr(project.id);
  if (!attr) return '';
  return '<label class="check"><input type="checkbox" data-assign="' + attr + '"' + (on ? ' checked' : '') + '>' + esc(project.name) + '</label>';
}
function personLink(person) {
  const attr = window.DomSafe && DomSafe.projectAttr(person.uid);
  const name = esc(person.displayName || person.uid);
  const meta = esc(roleLabel(person.role) + (person.active ? '' : ' · موقوف'));
  if (!attr) return '<div class="card"><h2>' + name + '</h2><span>' + meta + '</span></div>';
  return '<a class="card proj" href="#person/' + attr + '"><div class="kv"><h2>' + name + '</h2><span>‹</span></div><span>' + meta + '</span></a>';
}
const UID_HELP = 'الحساب يُنشأ في وحدة تحكم Firebase، لا من هذا التطبيق. المسار: Authentication ثم Users ثم عمود User UID. انسخ المعرّف والصقه هنا.';
function contractFields(project) {
  const amount = shownContract(project.id, project);
  const value = amount === null ? '' : String(amount);
  return `<div class="kv"><span>قيمة العقد</span>${amount === null ? '<b>غير محددة</b>' : money(amount)}</div>
    <label class="field">تعديل قيمة العقد<input id="contract" class="full" inputmode="numeric" value="${esc(value)}"></label>
    <button type="button" class="btn ghost" id="save-contract">حفظ قيمة العقد</button>
    <div id="contract-msg" class="msg"></div>
    <div class="note">قيمة العقد لا تظهر لمستخدم الموقع. الحفظ ينقلها إلى سجل المالك ويمسحها من المشروع.</div>`;
}
function saveContract(u) {
  if (!u || u.role !== 'owner') return;
  const id = (location.hash.slice(1).split('/')[1]) || '';
  const project = get(K.projects, []).find(p => p.id === id);
  const msg = $('#contract-msg');
  if (!project) return;
  const raw = ($('#contract') && $('#contract').value || '').replace(/[^\d]/g, '');
  if (!raw) { if (msg) msg.textContent = 'أدخل قيمة العقد'; return; }
  const amount = Number(raw);
  if (!Number.isInteger(amount) || amount > 10000000000) { if (msg) msg.textContent = 'قيمة العقد غير صالحة'; return; }
  const saved = window.Sync.splitProjectSave(project, amount);
  set(K.projects, get(K.projects, []).map(p => p.id === id ? saved.project : p));
  const fin = get(K.finance, {});
  fin[id] = { contractAmount: amount, pending: true };
  set(K.finance, fin);
  const out = get(K.outbox, []);
  if (!out.includes(id)) set(K.outbox, out.concat([id]));
  if (!demoRole()) flushRemote();
  render();
}
function readPersonForm() {
  const boxes = [...document.querySelectorAll('[data-assign]:checked')].map(el => el.dataset.assign);
  return window.Sync.personInput({
    uid: ($('#person-uid') && $('#person-uid').value) || '',
    displayName: ($('#person-name') && $('#person-name').value) || '',
    email: ($('#person-email') && $('#person-email').value) || '',
    role: ($('#person-role') && $('#person-role').value) || '',
    active: !!($('#person-active') && $('#person-active').checked),
    assignedProjectIds: boxes,
  });
}
function storePerson(value, existing, editor) {
  const row = {
    uid: value.uid, displayName: value.displayName, email: value.email, role: value.role, active: value.active,
    assignedProjectIds: value.assignedProjectIds.slice(),
    createdAtServer: existing && existing.createdAtServer ? existing.createdAtServer : Date.now(),
    createdBy: existing && existing.createdBy ? existing.createdBy : editor.uid,
  };
  set(K.users, get(K.users, []).filter(x => x.uid !== row.uid).concat([row]));
  if (!demoRole() && get(K.sessionUser, null) && get(K.sessionUser).uid === row.uid) {
    set(K.sessionUser, Object.assign({}, get(K.sessionUser), row));
  }
  return row;
}
async function savePerson(u) {
  if (!u || u.role !== 'owner') return;
  const btn = $('#save-person');
  const msg = $('#person-msg');
  const built = readPersonForm();
  if (!built.ok) { if (msg) msg.textContent = built.errors[0]; return; }
  if (btn) btn.disabled = true;
  const existing = get(K.users, []).find(x => x.uid === built.value.uid);
  try {
    if (demoRole()) storePerson(built.value, existing, u);
    else {
      const fb = await ensureFirebase();
      await fb.saveUser(built.value.uid, built.value, existing);
      directoryPromise = null;
      await ensureDirectory();
      const fresh = get(K.users, []).find(x => x.uid === built.value.uid) || storePerson(built.value, existing, u);
      if (get(K.sessionUser, null) && get(K.sessionUser).uid === built.value.uid) set(K.sessionUser, Object.assign({}, get(K.sessionUser), fresh));
    }
    location.hash = '#people';
  } catch (err) {
    if (btn) btn.disabled = false;
    if (msg) msg.textContent = 'تعذر حفظ الشخص';
  }
}
function ensureDirectory() {
  if (demoRole()) return Promise.resolve();
  if (!directoryPromise) {
    directoryPromise = ensureFirebase().then(fb => fb.listUsers()).then(rows => { set(K.users, rows || []); }).catch(err => { directoryPromise = null; throw err; });
  }
  return directoryPromise;
}

function commit(entry) {
  const lg = ledger();
  lg.append(entry, { user: me(), projects: get(K.projects, []), policy: POLICY });
  set(K.entries, lg.all()); set(K.outbox, [...get(K.outbox, []), entry.id]);
  if (!demoRole()) flushRemote();
}
function sendNow() { // fake sync: stamp server time, drain outbox. Re-sending the same id is a no-op.
  const out = new Set(get(K.outbox, [])); if (!out.size) return;
  const now = Date.now();
  set(K.entries, get(K.entries, []).map(e => out.has(e.id) && !e.createdAtServer ? { ...e, createdAtServer: now } : e));
  set(K.projects, get(K.projects, []).map(p => out.has(p.id) && !p.createdAtServer ? { ...p, createdAtServer: now } : p));
  set(K.outbox, []); render();
}

function data() {
  const u = me(), projects = get(K.projects, []), entries = get(K.entries, []);
  return { u, projects: L.visibleProjects(u, projects, POLICY), entries: L.visibleEntries(u, entries, projects, POLICY), allProjects: projects };
}
const typeLabel = e => (e.isReversal ? 'تصحيح (قيد عكسي) · ' : '') + L.ENTRY_TYPES[e.entryType].label;
const entryHref = id => (window.DomSafe ? DomSafe.entryHref(id) : '#home');
function syncText(id) {
  const err = (get(K.syncErrors, {}) || {})[id];
  if (err) return err;
  if (get(K.outbox, []).includes(id)) return 'لم يُرسل';
  return 'مُرسَل';
}
function detailId() {
  const [view, arg] = (location.hash.slice(1) || '').split('/');
  return view === 'detail' ? (arg || '') : '';
}
function currentEntryExport() {
  const u = me();
  const id = detailId();
  if (!u || !id) return null;
  const entry = get(K.entries, []).find(e => e.id === id);
  if (!entry) return null;
  const ctx = { projects: get(K.projects, []), entries: get(K.entries, []), finance: get(K.finance, {}), policy: POLICY };
  const fields = L.entryExportFields(u, entry, ctx);
  if (!fields) return null;
  const safe = String(entry.id).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64) || 'entry';
  return { fields, csv: L.entryToCSV(u, entry, ctx), filename: 'aj-entry-' + safe + '.csv' };
}
function fillPrintRoot(fields) {
  const root = $('#print-root');
  if (!root) return;
  const company = fields.find(f => f.key === 'company');
  const ltrKeys = { amount: 1, entryDate: 1, recordedAt: 1, id: 1 };
  const rows = fields.filter(f => f.key !== 'company').map(f => {
    const cls = f.key === 'amount' ? ' class="print-amount-row"' : '';
    const num = ltrKeys[f.key] ? ' class="num" dir="ltr"' : '';
    return `<tr${cls}><th scope="row">${esc(f.label)}</th><td${num}>${esc(f.value)}</td></tr>`;
  }).join('');
  root.innerHTML = `<article class="print-sheet" dir="rtl" lang="ar">
    <p class="print-kicker">قيد محاسبي</p>
    <h1>${esc(company ? company.value : 'أهل الجزيرة')}</h1>
    <table><tbody>${rows}</tbody></table>
    <p class="print-foot">وثيقة للطباعة من حسابات أهل الجزيرة</p>
  </article>`;
}
function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => { try { URL.revokeObjectURL(url); } catch (err) {} }, 2000);
}
function saveEntryFile(csv, filename) {
  const file = new File([csv], filename, { type: 'text/csv' });
  const payload = { files: [file], title: 'قيد أهل الجزيرة' };
  let can = false;
  try {
    can = !!(navigator.share && typeof navigator.canShare === 'function' && navigator.canShare(payload));
  } catch (err) { can = false; }
  if (can) {
    try {
      const pending = navigator.share(payload);
      if (pending && typeof pending.catch === 'function') {
        pending.catch(err => {
          if (err && err.name === 'AbortError') return;
          downloadCsv(csv, filename);
        });
      }
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
  }
  downloadCsv(csv, filename);
}
function printCurrentEntry() {
  const built = currentEntryExport();
  if (!built) return;
  fillPrintRoot(built.fields);
  const prev = document.title;
  const idField = built.fields.find(f => f.key === 'id');
  document.title = 'أهل الجزيرة' + (idField ? ' ' + idField.value : '');
  window.addEventListener('afterprint', () => { document.title = prev; }, { once: true });
  window.print();
}
function entryRow(e, u, all) {
  const reversed = all.some(x => x.isReversal && x.reversesEntryId === e.id);
  const canRev = !e.isReversal && !reversed && (u.role === 'owner' || (POLICY.siteCanReverseOwn && e.createdBy === u.uid));
  const cls = e.isReversal ? 'bad' : e.direction === 'income' ? 'ok' : '';
  const badge = window.SyncStatus
    ? SyncStatus.badgeHtml(e.id, get(K.outbox, []), get(K.syncErrors, {}))
    : (get(K.outbox, []).includes(e.id) ? '<span class="pill warn" style="font-size:11px">لم يُرسل</span>' : '');
  return `<div class="entry"><a class="entry-open" href="${entryHref(e.id)}"><div class="meta"><span>${esc(typeLabel(e))}</span><small>${esc(e.description)} · ${esc(e.entryDate)}</small><small>${esc(L.displayRecorder(e))}</small>
    ${badge}${reversed ? '<small>معكوس</small>' : ''}</div>
    <span class="num ${cls}">${L.fmt(e.amount * L.sign(e))}</span></a>
    ${canRev ? `<button type="button" class="mini" data-rev="${esc(e.id)}">عكس</button>` : ''}</div>`;
}

const views = {
  home() {
    const { u, projects, entries } = data(); const out = get(K.outbox, []).length;
    const onlineLabel = !demoRole() ? (navigator.onLine ? 'متصل' : 'بدون إنترنت') : (navigator.onLine ? 'متصل (محاكاة)' : 'بدون إنترنت');
    const syncNote = !demoRole() ? (navigator.onLine ? 'يُرسل تلقائياً عند الاتصال.' : 'محفوظ على الهاتف. يُرسل عند عودة الاتصال.') : 'لم تُرسل بعد. اضغط «إرسال الآن» للمحاكاة (لا يوجد خادم حقيقي).';
    const sync = `<div class="card" style="background:#FFFBF4"><div class="pills" style="align-items:center"><span class="pill warn">${onlineLabel}</span><b style="font-size:14px">${out} قيود محفوظة على الهاتف</b></div><div class="note">${syncNote}</div></div>`;
    const ex = (demoRole() || get(K.entries, []).some(e => e.isExample)) ? '<div class="example">⚠️ بيانات مثال وليست حقيقية</div>' : '';
    if (u.role === 'owner') {
      const t = L.totals(entries);
      return ex + sync + `<div class="card"><h2>ملخص كل المشاريع</h2>
        <div class="kv"><span>إجمالي المقبوض</span>${money(t.received)}</div>
        <div class="kv"><span>إجمالي المصروف</span>${money(t.spent)}</div>
        <div class="kv"><span>صافي الربح</span><span class="${t.profit < 0 ? 'bad' : 'ok'}">${money(t.profit)}</span></div></div>
        <a class="btn" href="#entry">+ قيد جديد</a><button class="btn ghost" id="csv">تصدير نسخة (CSV)</button>`;
    }
    const mine = entries.filter(e => e.createdBy === u.uid).slice(-3).reverse();
    return ex + sync + `<div class="card"><h2>مشاريعي (${projects.length})</h2>${projects.map(p => {
        const s = entries.filter(e => e.projectId === p.id && e.entryDate === today());
        return `<div class="kv"><span>${esc(p.name)}</span><b>مصروف اليوم: <span class="num">${L.fmt(L.totals(s).spent)}</span></b></div>`; }).join('')}</div>
      <div class="card"><h2>آخر قيودي</h2>${mine.map(e => entryRow(e, u, entries)).join('') || '<div class="note">لا يوجد</div>'}</div>
      <a class="btn" href="#entry">+ قيد جديد</a>`;
  },
  entry(pid) {
    const { u, projects } = data();
    const types = Object.entries(L.ENTRY_TYPES).filter(([, t]) => u.role === 'owner' || t.direction === 'expense' || POLICY.siteCanCreateClientPayment);
    if (!types.some(([k]) => k === state.type)) state.type = types[0][0];
    if (pid) state.projectId = pid;
    if (!projects.some(p => p.id === state.projectId)) state.projectId = projects[0] && projects[0].id;
    return `<div class="card"><div class="step">1 النوع</div><div class="pills">${types.map(([k, t]) => `<button class="pill ${k === state.type ? 'on' : ''}" data-type="${k}">${t.label}</button>`).join('')}</div></div>
      <div class="card"><div class="step">2 المبلغ</div><div class="amount"><input id="amt" inputmode="numeric" value="${state.amount ? L.fmt(state.amount) : ''}" placeholder="0"> <span>د.ع</span></div>
        <div class="pills" style="justify-content:center"><button class="pill" data-add="1000">+ ألف</button><button class="pill" data-add="1000000">+ مليون</button><button class="pill bad" data-add="0">مسح</button></div></div>
      <div class="card"><div class="step">3 المشروع${u.role === 'site' ? ' (مشاريعي فقط)' : ''}</div><div class="pills">${projects.map(p => window.DomSafe ? DomSafe.projectButton(p.id, p.name, p.id === state.projectId) : `<button class="pill ${p.id === state.projectId ? 'on' : ''}" data-proj="${esc(p.id)}">${esc(p.name)}</button>`).join('')}</div></div>
      <textarea id="desc" rows="2" placeholder="ملاحظة (اختياري)"></textarea>
      <label class="field">الجهة المستلمة / المورّد (اختياري)
        <input id="party" class="full" maxlength="100" autocomplete="off">
      </label>
      <button class="btn" id="save">حفظ</button><div id="msg" class="msg"></div>
      <div class="note msg">لا يمكن تعديل القيد أو حذفه بعد الحفظ.</div>`;
  },
  projects() {
    const { u, projects, entries } = data();
    return projects.map(p => {
      const s = L.projectSummary(u, entries.filter(e => e.projectId === p.id));
      const line = u.role === 'owner'
        ? `<div class="kv"><span>${s.profit < 0 ? 'خسارة' : 'ربح'}</span><span class="${s.profit < 0 ? 'bad' : 'ok'}">${money(Math.abs(s.profit))}</span></div>`
        : `<div class="kv"><span>المصروف</span>${money(s.spent)}</div>`;
      return `<a class="card proj" href="${window.DomSafe ? DomSafe.projectHref('project', p.id) : '#projects'}"><div class="kv"><h2>${esc(p.name)}</h2><span>‹</span></div>${line}</a>`;
    }).join('') + (u.role === 'owner' ? `<div class="note">الأرقام تشمل ما على هذا الجهاز فقط.</div><button class="btn ghost" id="newproj">+ مشروع جديد</button>` : '<div class="note">ترى فقط المشاريع المعيّنة لك.</div>');
  },
  project(id) {
    const { u, projects, entries } = data();
    const p = projects.find(x => x.id === id); if (!p) return '<div class="card">المشروع غير متاح</div>';
    const es = entries.filter(e => e.projectId === id); const s = L.projectSummary(u, es);
    const card = u.role === 'owner'
      ? `${contractFields(p)}<div class="kv"><span>المقبوض</span>${money(s.received)}</div><div class="kv"><span>المصروف</span>${money(s.spent)}</div>
         <div class="kv"><span>الربح</span><span class="${s.profit < 0 ? 'bad' : 'ok'}">${money(s.profit)}</span></div><div class="note">الربح = المقبوض − المصروف</div>`
      : `<div class="kv"><span>المصروف</span>${money(s.spent)}</div>${Object.entries(s.byType).map(([k, v]) => `<div class="kv"><span>${L.ENTRY_TYPES[k].label}</span><b class="num">${L.fmt(v)}</b></div>`).join('')}`;
    return `<div class="card">${card}</div><div class="card"><h2>آخر القيود</h2>${es.slice().reverse().slice(0, 8).map(e => entryRow(e, u, es)).join('')}</div>
      <a class="btn" href="${window.DomSafe ? DomSafe.projectHref('entry', p.id) : '#projects'}">+ قيد لهذا المشروع</a>`;
  },
  people() {
    const u = me();
    if (!u || u.role !== 'owner') return '<div class="card">هذه الشاشة للمالك.</div>';
    const rows = get(K.users, []).map(personLink).join('');
    return `<div class="card"><p class="note">${esc(UID_HELP)}</p></div>${rows}<a class="btn" href="#person">إضافة شخص</a>`;
  },
  person(uid) {
    const u = me();
    if (!u || u.role !== 'owner') return '<div class="card">هذه الشاشة للمالك.</div>';
    if (uid && !(window.DomSafe && DomSafe.isSafeId(uid))) return '<div class="card">معرّف غير صالح</div>';
    const existing = uid ? get(K.users, []).find(x => x.uid === uid) : null;
    const person = existing || { uid: uid || '', displayName: '', email: '', role: 'site', active: true, assignedProjectIds: [] };
    const projects = get(K.projects, []);
    const boxes = projects.map(p => assignBox(p, (person.assignedProjectIds || []).includes(p.id))).join('');
    const locked = uid ? ' readonly' : '';
    return `<div class="card"><p class="note">${esc(UID_HELP)}</p>
      <label class="field">معرّف المستخدم (User UID)<input id="person-uid" class="full" maxlength="64" autocomplete="off" value="${esc(person.uid)}"${locked}></label>
      <label class="field">الاسم<input id="person-name" class="full" maxlength="80" value="${esc(person.displayName)}"></label>
      <label class="field">البريد<input id="person-email" class="full" maxlength="200" value="${esc(person.email)}"></label>
      <label class="field">الدور<select id="person-role" class="full"><option value="site"${person.role === 'site' ? ' selected' : ''}>مستخدم موقع</option><option value="owner"${person.role === 'owner' ? ' selected' : ''}>مالك</option></select></label>
      <label class="check"><input id="person-active" type="checkbox"${person.active ? ' checked' : ''}>الحساب نشط</label>
      <div class="step">المشاريع</div>
      <p class="note">اختر كل مشروع بالاسم. التعيين يقتصر على المشاريع المحددة.</p>
      ${boxes || '<div class="note">لا توجد مشاريع بعد.</div>'}
      <button type="button" class="btn" id="save-person">حفظ</button>
      <div id="person-msg" class="msg"></div></div>`;
  },
  detail(id) {
    const { projects, entries } = data();
    const back = `<button type="button" class="mini" id="back">رجوع</button>`;
    const e = entries.find(x => x.id === id);
    if (!e) return back + '<div class="card">القيد غير متاح</div>';
    const project = projects.find(p => p.id === e.projectId);
    const reversal = !e.isReversal && entries.find(x => x.isReversal && x.reversesEntryId === e.id);
    const original = e.isReversal ? entries.find(x => x.id === e.reversesEntryId) : null;
    const link = (row, label) => row ? `<a class="detail-link" href="${entryHref(row.id)}">${esc(label)}</a>` : '—';
    const cls = e.isReversal ? 'bad' : e.direction === 'income' ? 'ok' : '';
    const linked = e.isReversal
      ? `<div class="kv"><span>القيد الأصلي</span><span>${link(original, 'عرض القيد الأصلي')}</span></div>
         <div class="kv"><span>سبب التصحيح</span><b>${esc(e.reversalReason || '—')}</b></div>`
      : (reversal
        ? `<div class="kv"><span>قيد العكس</span><span>${link(reversal, 'عرض قيد العكس')}</span></div>
           <div class="kv"><span>سبب التصحيح</span><b>${esc(reversal.reversalReason || '—')}</b></div>`
        : '');
    return `${back}<div class="card">
      <div class="kv"><span>النوع</span><b>${esc(typeLabel(e))}</b></div>
      <div class="kv"><span>المبلغ</span><b class="num ${cls}">${L.fmt(e.amount * L.sign(e))} د.ع</b></div>
      <div class="kv"><span>المشروع</span><b>${esc(project ? project.name : '—')}</b></div>
      <div class="kv"><span>التاريخ</span><b>${esc(e.entryDate || '—')}</b></div>
      <div class="kv"><span>الوصف</span><b>${esc(e.description || '—')}</b></div>
      <div class="kv"><span>الجهة</span><b>${esc(e.partyName || '—')}</b></div>
      <div class="kv"><span>سجّله</span><b>${esc(L.displayRecorder(e))}</b></div>
      <div class="kv"><span>الإرسال</span><b>${esc(syncText(e.id))}</b></div>
      ${linked}</div>
      <div class="export-actions">
        <button type="button" class="btn ghost" id="entry-print">طباعة</button>
        <button type="button" class="btn ghost" id="entry-pdf">حفظ PDF</button>
        <button type="button" class="btn ghost" id="entry-file">حفظ كملف</button>
      </div>`;
  },
};
const titles = { home:'الرئيسية', entry:'قيد جديد', projects:'المشاريع', project:'', detail:'تفاصيل القيد', people:'الأشخاص', person:'شخص' };

function syncPeopleTab(u) {
  const tabs = document.querySelector('.tabs');
  if (!tabs) return;
  let a = tabs.querySelector('[data-tab="people"]');
  if (!u || u.role !== 'owner') { if (a) a.remove(); return; }
  if (!a) {
    a = document.createElement('a');
    a.href = '#people';
    a.dataset.tab = 'people';
    const span = document.createElement('span');
    span.textContent = 'الأشخاص';
    a.append(document.createTextNode('●'), span);
    tabs.appendChild(a);
  }
}

function render() {
  const u = me(); if (!u) return;
  const printRoot = $('#print-root');
  if (printRoot) printRoot.innerHTML = '';
  const [view, arg] = (location.hash.slice(1) || 'home').split('/');
  const v = views[view] ? view : 'home';
  $('#role').value = u.role;
  $('#role-label').hidden = !demoRole();
  $('#logout').hidden = !!demoRole();
  $('#who').textContent = demoRole()
    ? (u.role === 'owner' ? 'المالك · أمير' : 'مستخدم موقع · أحمد (مشرف)')
    : ((u.role === 'owner' ? 'المالك' : 'مستخدم موقع') + ' · ' + (u.displayName || ''));
  $('#outbox').textContent = 'لم يُرسل بعد: ' + get(K.outbox, []).length;
  const note = $('#sync-msg');
  if (note) { note.hidden = !syncNotice; note.textContent = syncNotice || ''; }
  syncPeopleTab(u);
  const tab = v === 'project' ? 'projects' : (v === 'person' ? 'people' : v);
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  if (!demoRole() && u.role === 'owner' && (v === 'people' || v === 'person') && !directoryPromise) {
    $('#title').textContent = titles[v] || 'الأشخاص';
    $('#main').innerHTML = '<div class="card">' + esc('جارٍ تحميل الأشخاص') + '</div>';
    ensureDirectory().then(() => { if (me() && me().role === 'owner') render(); }).catch(() => {
      const main = $('#main'); if (main) main.innerHTML = '<div class="card">' + esc('تعذر تحميل الأشخاص') + '</div>';
    });
    return;
  }
  $('#title').textContent = v === 'project' ? ((data().projects.find(p => p.id === arg) || {}).name || 'مشروع') : (v === 'projects' && u.role === 'site' ? 'مشاريعي' : titles[v]);
  $('#main').innerHTML = views[v](arg);
}

document.addEventListener('click', ev => {
  const revBtn = ev.target.closest('[data-rev]');
  const open = !revBtn && ev.target.closest('a.entry-open, a.detail-link');
  if (open && $('#login').hidden) state.backStack.push(location.hash || '#home');
  const b = ev.target.closest('button'); if (!b) return;
  if (!$('#login').hidden) return;
  const u = me();
  if (b.dataset.type) { state.type = b.dataset.type; render(); }
  else if (b.dataset.proj) { state.projectId = b.dataset.proj; render(); }
  else if (b.dataset.add != null) { state.amount = b.dataset.add === '0' ? 0 : state.amount + Number(b.dataset.add); render(); }
  else if (b.id === 'send') { if (demoRole()) sendNow(); else flushRemote(); }
  else if (b.id === 'logout') closeSession().then(ok => { if (ok) showLogin(); }).catch(() => { if (!db) showLogin(); });
  else if (b.id === 'back') { location.hash = state.backStack.pop() || '#home'; }
  else if (b.id === 'save') {
    b.disabled = true; // id generated once per form; double-tap cannot duplicate
    const desc = $('#desc').value.trim();
    const party = ($('#party') && $('#party').value || '').trim();
    const e = { id: state.formId, projectId: state.projectId, direction: L.ENTRY_TYPES[state.type].direction, entryType: state.type,
      amount: state.amount, currency: 'IQD', entryDate: today(), description: desc, partyName: party, isReversal: false,
      createdAtDevice: Date.now(), createdAtServer: null, createdBy: u.uid, deviceId };
    const recorded = L.recorderName(u);
    if (recorded) e.createdByName = recorded;
    try { commit(e); state.amount = 0; state.formId = uuid(); render(); $('#msg').innerHTML = '<span class="pill warn">✓ حُفظ على الهاتف · لم يُرسل بعد</span>'; }
    catch (err) { b.disabled = false; $('#msg').innerHTML = `<span class="bad">${esc(err.message)}</span>`; }
  } else if (b.dataset.rev) {
    const all = get(K.entries, []); const orig = all.find(x => x.id === b.dataset.rev);
    const reason = prompt('سبب التصحيح:', 'خطأ في الإدخال'); if (!reason) return;
    try { commit(L.makeReversal(orig, { user: u, reason, now: Date.now(), deviceId, entryDate: today() })); render(); }
    catch (err) { alert(err.message); }
  } else if (b.id === 'entry-print' || b.id === 'entry-pdf') {
    printCurrentEntry();
  } else if (b.id === 'entry-file') {
    const built = currentEntryExport();
    if (built && built.csv) saveEntryFile(built.csv, built.filename);
  } else if (b.id === 'csv') {
    if (!L.canExportCSV(u)) return;
    const blob = new Blob([L.toCSV(get(K.entries, []), get(K.projects, []))], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'aj-ledger-' + today() + '.csv'; a.click();
  } else if (b.id === 'newproj') {
    if (!L.canCreateProject(u)) return;
    const name = prompt('اسم المشروع:'); if (!name) return; const clientName = prompt('اسم الزبون:') || '';
    const p = { id: uuid(), name, clientName, location: '', currency: 'IQD', status: 'active', createdAtDevice: Date.now(), createdAtServer: null, createdBy: u.uid, deviceId };
    set(K.projects, [...get(K.projects, []), p]); set(K.outbox, [...get(K.outbox, []), p.id]); render();
    if (!demoRole()) flushRemote();
  } else if (b.id === 'save-contract') saveContract(u);
  else if (b.id === 'save-person') savePerson(u);
});
document.addEventListener('input', ev => { if (ev.target.id === 'amt') { state.amount = parseInt(ev.target.value.replace(/[^\d]/g, ''), 10) || 0; } });
$('#role').addEventListener('change', ev => { if (!demoRole()) return; set(K.role, ev.target.value); render(); });
$('#login-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  let token = sessionEpoch;
  const btn = $('#login-btn'); btn.disabled = true;
  const msg = $('#login-msg'); msg.textContent = '';
  const email = $('#login-email').value.trim(); const password = $('#login-password').value;
  try {
    if (!email || !password) throw new Error('أدخل البريد وكلمة المرور');
    token = ++sessionEpoch;
    let fb = await withTimeout(ensureFirebase(), LOGIN_MS, 'تحميل');
    if (token !== sessionEpoch) return;
    let cred = await withTimeout(fb.signIn(email, password), LOGIN_MS, 'تسجيل الدخول');
    if (token !== sessionEpoch) return;
    let data;
    try {
      data = await withTimeout(fb.profile(cred.user.uid), LOGIN_MS, 'ملف المستخدم');
    } catch (err) {
      if (!isPoison(err) || token !== sessionEpoch) throw err;
      try {
        fb = await rebuildFirebase(true);
        if (token !== sessionEpoch) return;
        cred = await withTimeout(fb.signIn(email, password), LOGIN_MS, 'تسجيل الدخول');
        data = await withTimeout(fb.profile(cred.user.uid), LOGIN_MS, 'ملف المستخدم');
      } catch (e2) { throw new Error(REPAIR_MSG); }
    }
    if (token !== sessionEpoch) return;
    if (!data) { await disposeFirebase(true); throw new Error('لا يوجد ملف مستخدم. اطلب من المالك إنشاء الحساب'); }
    await withTimeout(enterSession(fb, cred.user.uid, data), LOGIN_MS, 'فتح البيانات');
  } catch (err) {
    if (token !== sessionEpoch) return;
    msg.textContent = err.code ? loginError(err) : (err.message || 'تعذر الدخول');
  } finally { if (token === sessionEpoch) btn.disabled = false; document.body.dataset.loginAttempt = '1'; }
});
addEventListener('hashchange', render);
addEventListener('online', () => { if (!demoRole() && get(K.sessionUser)) flushRemote(); else if (!$('#shell').hidden) render(); });
addEventListener('offline', () => { if (!$('#shell').hidden) render(); });
(async () => {
  if (!demoRole()) {
    showLogin();
    document.body.dataset.ready = '1';
    const token = sessionEpoch;
    try {
      let fb = await withTimeout(ensureFirebase(), LOGIN_MS, 'تحميل');
      if (token !== sessionEpoch) return;
      let user = await withTimeout(fb.currentUser(), LOGIN_MS, 'الجلسة');
      if (token !== sessionEpoch || !user) return;
      await openUserDb(user.uid);
      if (token !== sessionEpoch) return;
      let profile = get(K.sessionUser, null);
      const adopt = data => { if (data) { profile = profileFrom(user.uid, data); set(K.sessionUser, profile); } };
      try {
        if (navigator.onLine !== false) adopt(await withTimeout(fb.profile(user.uid), LOGIN_MS, 'ملف المستخدم'));
      } catch (err) {
        if (token !== sessionEpoch) return;
        if (isPoison(err)) {
          try {
            fb = await rebuildFirebase(false);
            if (token !== sessionEpoch) return;
            user = await withTimeout(fb.currentUser(), LOGIN_MS, 'الجلسة');
            if (user && navigator.onLine !== false) adopt(await withTimeout(fb.profile(user.uid), LOGIN_MS, 'ملف المستخدم'));
          } catch (e2) {
            if (!profile) { const m = $('#login-msg'); if (m) m.textContent = REPAIR_MSG; }
          }
        }
      }
      if (token !== sessionEpoch) return;
      if (!profile || profile.active === false) return;
      showApp(); render(); flushRemote();
    } catch (e) {
      if (token !== sessionEpoch) return;
      showLogin();
      const m = $('#login-msg');
      if (m && e && (isPoison(e) || isImportFailure(e))) m.textContent = e.message || REPAIR_MSG;
    }
    return;
  }
  showApp();
  db = await openDB('aj-p0'); await loadAll();
  if (!get(K.device)) set(K.device, uuid()); deviceId = get(K.device);
  seed();
  const qs = new URLSearchParams(location.search); if (qs.get('role')) set(K.role, qs.get('role'));
  render(); document.body.dataset.ready = '1';
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().then(p => { window.AJ.persisted = p; }).catch(() => {});
})();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
