'use strict';
// Storage: IndexedDB "aj-p0" (stores: projects, entries, outbox, meta). Loaded into memory at boot; every write is
// persisted to IndexedDB (write-through, serialized). "Server" is simulated; outbox = ids not sent yet (no syncState).
const L = window.Ledger, POLICY = L.DEFAULT_POLICY;
const K = { projects:'projects', entries:'entries', outbox:'outbox', users:'users', finance:'projectFinance', subcontracts:'subcontracts', terms:'subcontractTerms', amendments:'subcontractAmendments', role:'role', device:'deviceId', seeded:'seeded', sessionUser:'sessionUser', syncErrors:'syncErrors', pullWatermark:'pullWatermark', statusPending:'statusPending' };
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
    /** @type {Record<string, any>} */
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
  const subs = [
    { id:'sc-hadaada', projectId:'p-school', name:'ورشة الحدادة', work:'أبواب وشبابيك الحديد للهيكل', agreedOn:'2026-10-06', createdAtServer:t, createdBy:'u-ameer' },
    { id:'sc-noor', projectId:'p-school', name:'شركة النور للبناء', work:'أعمال الهيكل والطابوق', agreedOn:'2026-10-04', createdAtServer:t, createdBy:'u-ameer' },
    { id:'sc-kahraba', projectId:'p-school', name:'مقاول الكهرباء', work:'التمديدات ونقاط الإنارة', agreedOn:'2026-10-03', createdAtServer:t, createdBy:'u-ameer' },
  ];
  const amendments = [
    { id:'am-noor-1', subcontractId:'sc-noor', projectId:'p-school', amount:500000, date:'2026-10-12', note:'أعمال السور', createdAtServer:t, createdBy:'u-ameer' },
    { id:'am-kahraba-1', subcontractId:'sc-kahraba', projectId:'p-school', amount:500000, date:'2026-10-18', note:'نقطة إنارة إضافية', createdAtServer:t, createdBy:'u-ameer' },
  ];
  const linkedPay = (subId, amount, description, date) => {
    const sub = subs.find(s => s.id === subId);
    return E('p-school', 'subcontractor', amount, description, 'u-ameer', { entryDate:date, partyName:sub.name, subcontractId:subId, createdAtDevice:t - 80000 });
  };
  [
    linkedPay('sc-hadaada', 1500000, 'دفعة حدادة', '2026-10-15'),
    linkedPay('sc-noor', 2500000, 'تسديد عقد البناء', '2026-10-25'),
    linkedPay('sc-kahraba', 2000000, 'دفعة كهرباء أولى', '2026-10-08'),
    linkedPay('sc-kahraba', 1200000, 'دفعة كهرباء ثانية', '2026-10-22'),
  ].forEach(row => lg.append(row, { user:users[0], projects, policy:POLICY }));
  const seededRows = lg.all().slice().sort((a, b) => a.createdAtDevice - b.createdAtDevice || (a.id < b.id ? -1 : 1));
  set(K.users, users); set(K.projects, projects); set(K.entries, seededRows); set(K.outbox, [pend1.id, pend2.id]);
  set(K.finance, { 'p-school': { contractAmount: 60000000 }, 'p-road': { contractAmount: 20000000 }, 'p-market': { contractAmount: 15000000 } });
  set(K.subcontracts, subs);
  set(K.terms, { 'sc-hadaada': { originalAmount: 4000000 }, 'sc-noor': { originalAmount: 2000000 }, 'sc-kahraba': { originalAmount: 2500000 } });
  set(K.amendments, amendments);
  set(K.seeded, true);
}
const state = { type: 'materials', amount: 0, amountDraft: '', desc: '', party: '', subcontractId: '', formId: uuid(), backStack: [], listProject: '', listShown: 0, formMsg: '', formMsgKind: '', personMsg: '', projectList: 'open', confirm: null, deleteMsg: '', subName: '', subAmount: '', subWork: '', subMsg: '', subFormId: '', amDate: '', amAmount: '', amNote: '', amMsg: '', amFormId: '' };
let directoryPromise = null;
const me = () => {
  if (!demoRole()) { const s = get(K.sessionUser, null); if (s && s.uid) return s; }
  const role = get(K.role, demoRole() || 'owner');
  return get(K.users, []).find(u => u.uid === (role === 'site' ? 'u-ahmed' : 'u-ameer'));
};
function markReady() { if (document.body) document.body.dataset.ready = '1'; }
function clearLoginForm() {
  const form = $('#login-form');
  if (form instanceof HTMLFormElement) form.reset();
  const email = $('#login-email');
  const password = $('#login-password');
  if (email instanceof HTMLInputElement) email.value = '';
  if (password instanceof HTMLInputElement) password.value = '';
}
const showLogin = () => { clearLoginForm(); const boot = $('#boot'); if (boot) boot.hidden = true; $('#login').hidden = false; $('#shell').hidden = true; markReady(); };
const showApp = () => { const boot = $('#boot'); if (boot) boot.hidden = true; $('#login').hidden = true; $('#shell').hidden = false; };
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
// A failed Firebase import is the CDN, not a broken shell. Offline, or while a
// session is already open, deleting the cache leaves the next load with nothing.
async function recoverModuleOnce() {
  if (navigator.onLine === false || get(K.sessionUser)) return;
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
    idToken: async force => {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) return null;
      return user.getIdToken(!!force);
    },
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
    // users/{uid} is readable while the account is inactive. The session copy
    // is what the screens filter on, so a pull that skips this keeps offering
    // a project the owner already removed.
    async refreshProfile(user) {
      const snap = await fsMod.getDocFromServer(fsMod.doc(fdb, 'users', user.uid));
      if (!snap.exists()) return null;
      const fresh = profileFrom(user.uid, snap.data());
      // The name already copied onto new entries stays. A server rename is a
      // rules mismatch and shows as refused; it is not applied under the user.
      if (user && typeof user.displayName === 'string' && user.displayName) fresh.displayName = user.displayName;
      const ts = snap.data().createdAtServer;
      if (ts && typeof ts.toMillis === 'function') fresh.createdAtServer = ts.toMillis();
      else if (ts && typeof ts.seconds === 'number') fresh.createdAtServer = ts.seconds * 1000;
      if (window.Sync.readSetChanged(user, fresh)) set(K.pullWatermark, null);
      set(K.sessionUser, fresh);
      return fresh;
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
    async putIfMissing(col, id, data) {
      const ref = fsMod.doc(fdb, col, id);
      const snap = await fsMod.getDocFromServer(ref);
      if (snap.exists()) return;
      await fsMod.setDoc(ref, data);
    },
    async writeLocal(local) {
      const clean = S.withoutContractAmount(local);
      const col = S.collectionFor(clean);
      if (col === 'subcontracts') {
        await this.putIfMissing(col, clean.id, S.withServerTime(clean, fsMod.serverTimestamp()));
        const stored = get(K.terms, {})[clean.id];
        const payload = S.termsPayload(stored && stored.originalAmount);
        if (!payload) throw new Error('مبلغ العقد غير صالح');
        await this.putIfMissing('subcontractTerms', clean.id, payload);
        const terms = get(K.terms, {});
        const current = terms[clean.id];
        if (!current || current.originalAmount === payload.originalAmount) {
          terms[clean.id] = { originalAmount: payload.originalAmount };
          set(K.terms, terms);
        }
        return;
      }
      if (col === 'subcontractAmendments') {
        await this.putIfMissing(col, clean.id, S.withServerTime(clean, fsMod.serverTimestamp()));
        return;
      }
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
      const current = fin[clean.id];
      // A contract typed while this write was in flight keeps pending when
      // its amount is not the one just sent, so the flush can send it next.
      if (!current || current.contractAmount === saved.finance.contractAmount) {
        fin[clean.id] = { contractAmount: saved.finance.contractAmount };
        set(K.finance, fin);
      }
      set(K.projects, get(K.projects, []).map(p => p.id === clean.id ? S.withoutContractAmount(p) : p));
    },
    async updateProjectStatus(id, status) {
      if (status !== 'archived' && status !== 'active') throw new Error('status');
      await fsMod.updateDoc(fsMod.doc(fdb, 'projects', id), { status });
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
      const previousMark = get(K.pullWatermark, {}) || {};
      const result = await S.pullChanges({
        user,
        watermark: previousMark,
        pendingIds: get(K.outbox, []),
        localEntries: get(K.entries, []),
        localProjects: get(K.projects, []),
        read: readSpec,
      });
      // Those copies were taken before the reads. A save that landed while
      // the reads were in flight is only in the cache now, so merge the
      // server rows into the cache as it stands and keep pending ids.
      const pendingIds = get(K.outbox, []);
      const projectHold = pendingIds.concat(get(K.statusPending, []));
      const projects = S.mergeById(get(K.projects, []), result.incomingProjects || [], projectHold);
      const entries = S.mergeById(get(K.entries, []), result.incomingEntries || [], pendingIds);
      set(K.projects, S.projectsForClient(user, projects));
      set(K.entries, entries);
      set(K.pullWatermark, result.watermark);
      for (const spec of S.financeReads(user, projects.map(p => p && p.id))) {
        const rows = await readSpec(spec);
        const live = get(K.finance, {});
        if (live[spec.id] && live[spec.id].pending) continue;
        const amount = rows[0] && rows[0].contractAmount;
        if (!Number.isInteger(amount)) continue;
        const again = get(K.finance, {});
        if (again[spec.id] && again[spec.id].pending) continue;
        again[spec.id] = { contractAmount: amount };
        set(K.finance, again);
      }
      const owned = await S.pullSubcontracts({
        user,
        since: previousMark.subcontracts,
        read: readSpec,
      });
      const pendingNow = get(K.outbox, []);
      const names = S.mergeById(get(K.subcontracts, []), owned.subcontracts, pendingNow).map(S.stripMoney);
      set(K.subcontracts, names);
      set(K.amendments, S.mergeById(get(K.amendments, []), owned.amendments, pendingNow));
      set(K.pullWatermark, Object.assign({}, get(K.pullWatermark, {}) || {}, { subcontracts: owned.watermark }));
      if (user && user.role === 'owner') {
      for (const sub of names) {
        if (!sub || pendingNow.includes(sub.id)) continue;
        const live = get(K.terms, {});
        if (live[sub.id] && live[sub.id].pending) continue;
        const rows = await readSpec({ collection: 'subcontractTerms', id: sub.id });
        const amount = rows[0] && rows[0].originalAmount;
        if (!Number.isInteger(amount) || amount <= 0) continue;
        const again = get(K.terms, {});
        if (again[sub.id] && again[sub.id].pending) continue;
        again[sub.id] = { originalAmount: amount };
        set(K.terms, again);
      }
      }
      await forgetGoneProjects(user, result.missingProjectIds || [], readSpec);
    },
    async deleteProject(projectId) {
      const listIds = async col => {
        const snap = await fsMod.getDocsFromServer(fsMod.query(fsMod.collection(fdb, col), fsMod.where('projectId', '==', projectId)));
        return snap.docs.map(d => d.id).filter(id => /^[A-Za-z0-9_-]{1,64}$/.test(id));
      };
      const commit = async (docs) => {
        const groups = S.projectDeleteBatches(docs);
        for (const group of groups) {
          if (!group.length) continue;
          const batch = fsMod.writeBatch(fdb);
          group.forEach(item => batch.delete(fsMod.doc(fdb, item.collection, item.id)));
          await batch.commit();
        }
      };
      await commit(S.projectDeleteDocs(projectId, {}));
      for (let pass = 0; pass < 3; pass++) {
        const entryIds = await listIds('ledgerEntries');
        const subcontractIds = await listIds('subcontracts');
        const amendmentIds = await listIds('subcontractAmendments');
        const termIds = [];
        for (const sid of subcontractIds) {
          const snap = await fsMod.getDocFromServer(fsMod.doc(fdb, 'subcontractTerms', sid));
          if (snap.exists()) termIds.push(sid);
        }
        const fin = await fsMod.getDocFromServer(fsMod.doc(fdb, 'projectFinance', projectId));
        const docs = S.projectDeleteDocs(projectId, {
          entryIds, subcontractIds, amendmentIds, termIds, finance: fin.exists(),
        }).filter(item => item.collection !== 'projects');
        if (!docs.length) return;
        await commit(docs);
      }
      const left = await listIds('ledgerEntries');
      if (left.length) throw new Error('تبقّت قيود');
    },
  };
}
let flushing = null;
let deleteLock = false;
let syncNotice = '';
let bellOpen = false;
let lastSyncAt = 0;
const FLUSH_MS = 20000;
const SEND_RETRY = 'تعذر الإرسال. أعد المحاولة';
const PULL_RETRY = 'تعذر التحديث. أعد المحاولة';
const REPAIR_MSG = 'تعذر الدخول بعد إصلاح الذاكرة المحلية. تحقق من الاتصال وأعد المحاولة';
const SUSPENDED_MSG = 'هذا الحساب موقوف';
const SESSION_DEAD_MSG = 'انتهت الجلسة. سجّل الدخول من جديد';
const MISSING_PROFILE_MSG = 'لا يوجد ملف مستخدم. اطلب من المالك إنشاء الحساب';
function cacheSnapshot() {
  return {
    entries: get(K.entries, []),
    projects: get(K.projects, []),
    subcontracts: get(K.subcontracts, []),
    amendments: get(K.amendments, []),
    finance: get(K.finance, {}) || {},
    terms: get(K.terms, {}) || {},
    outbox: get(K.outbox, []),
    syncErrors: get(K.syncErrors, {}) || {},
    statusPending: get(K.statusPending, []),
  };
}
function writeCache(next) {
  set(K.entries, next.entries);
  set(K.projects, next.projects);
  set(K.subcontracts, next.subcontracts);
  set(K.amendments, next.amendments);
  set(K.finance, next.finance);
  set(K.terms, next.terms);
  set(K.outbox, next.outbox);
  set(K.syncErrors, next.syncErrors);
  set(K.statusPending, next.statusPending);
}
async function forgetGoneProjects(user, missingIds, readSpec) {
  const hold = new Set();
  get(K.projects, []).forEach(project => {
    if (project && project.id && !project.createdAtServer && get(K.outbox, []).includes(project.id)) hold.add(project.id);
  });
  const gone = new Set((missingIds || []).filter(id => !hold.has(id)));
  if (user && user.role === 'owner') {
    for (const project of get(K.projects, [])) {
      if (!project || !project.id || hold.has(project.id) || gone.has(project.id)) continue;
      if (!project.createdAtServer) continue;
      const rows = await readSpec({ collection: 'projects', id: project.id });
      if (!rows.length) gone.add(project.id);
    }
  }
  gone.forEach(id => writeCache(window.Sync.dropProjectLocal(cacheSnapshot(), id, { dropPending: false })));
}
function isDeadAuth(err) { return !!(window.SyncStatus && SyncStatus.isDeadAuth(err)); }
function showLoginMessage(message) {
  showLogin();
  const box = $('#login-msg');
  if (box) box.textContent = message || '';
}
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
  if (deleteLock) return flushing || Promise.resolve();
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
  if (!$('#shell').hidden) paintBell();
  const timer = setTimeout(() => {
    if (flushing !== run || token !== sessionEpoch) return;
    flushing = null;
    syncNotice = get(K.outbox, []).length ? SEND_RETRY : PULL_RETRY;
    if (get(K.sessionUser) && !$('#shell').hidden) render();
  }, FLUSH_MS);
  run.then(() => clearTimeout(timer), () => clearTimeout(timer));
  return run;
}
function adoptEntry(local, remote) {
  const src = window.Sync.fromRemote(remote || {});
  const next = Object.assign({}, local);
  ['projectId', 'direction', 'entryType', 'amount', 'currency', 'entryDate', 'isReversal', 'reversesEntryId', 'reversalReason', 'createdBy', 'createdByName', 'description', 'partyName', 'subcontractId', 'deviceId', 'createdAtDevice', 'createdAtServer'].forEach(k => {
        if (src[k] === undefined || src[k] === null || src[k] === '') {
      if (k === 'createdByName' || k === 'description' || k === 'partyName' || k === 'reversalReason' || k === 'subcontractId') delete next[k];
      return;
    }
    next[k] = src[k];
  });
  next.id = local.id;
  return next;
}
function queuePendingFinance() {
  const fin = get(K.finance, {}) || {};
  const errors = get(K.syncErrors, {}) || {};
  const out = get(K.outbox, []).slice();
  let changed = false;
  Object.keys(fin).forEach(id => {
    if (!fin[id] || !fin[id].pending || errors[id] || out.includes(id)) return;
    out.push(id);
    changed = true;
  });
  if (changed) set(K.outbox, out);
}
function queuePendingSubcontracts() {
  const terms = get(K.terms, {}) || {};
  const errors = get(K.syncErrors, {}) || {};
  const out = get(K.outbox, []).slice();
  let changed = false;
  Object.keys(terms).forEach(id => {
    if (!terms[id] || !terms[id].pending || errors[id] || out.includes(id)) return;
    out.push(id);
    changed = true;
  });
  if (changed) set(K.outbox, out);
}
function paintShell() {
  if (get(K.sessionUser) && !$('#shell').hidden) render();
}
// Leave the ledger on screen without deleting aj-u-*. A suspended account keeps
// the Firebase user so the next open can explain itself. A dead token is signed
// out so the login form can start clean. Queued entries stay in the outbox.
async function holdSession(message) {
  sessionEpoch += 1;
  syncNotice = '';
  try { await closeUserDb(); } catch (e) {}
  // A suspended profile stays signed in, so the next open can read users/{uid}
  // and explain. A dead refresh token is cleared or the login form cannot start.
  if (message === SESSION_DEAD_MSG) {
    try { await disposeFirebase(true); } catch (e) {}
  }
  showLoginMessage(message);
}
async function flushProjectStatus(fb) {
  const pending = get(K.statusPending, []).slice();
  if (!pending.length) return;
  const left = [];
  let stopped = false;
  for (const id of pending) {
    if (stopped) { left.push(id); continue; }
    const project = get(K.projects, []).find(p => p.id === id);
    if (!project || window.Sync.isSeed(project) || !project.createdAtServer) continue;
    if (project.status !== 'archived' && project.status !== 'active') continue;
    try {
      await fb.updateProjectStatus(id, project.status);
    } catch (err) {
      if (isDeadAuth(err)) throw err;
      const code = String((err && err.code) || '');
      if (code === 'not-found') continue;
      left.push(id);
      if (err && (err.timeout || (window.SyncStatus && SyncStatus.isTransient(err)))) stopped = true;
    }
  }
  set(K.statusPending, left);
  if (left.length) syncNotice = SEND_RETRY;
}
async function performFlush(token, run) {
  let keptIds;
  let statusAtStart = null;
  try {
    if (token !== sessionEpoch || navigator.onLine === false) return;
    const fb = await ensureFirebase();
    if (token !== sessionEpoch) return;
    const user = get(K.sessionUser);
    if (!user) return;
    try {
      // A forced refresh notices a revoked token. Bound it so a network drop
      // during this flush still surfaces the retry instead of hanging the pull.
      if (typeof fb.idToken === 'function') await withTimeout(fb.idToken(true), 2500, 'الجلسة');
    } catch (err) {
      if (token !== sessionEpoch) return;
      if (isDeadAuth(err)) { await holdSession(SESSION_DEAD_MSG); return; }
      if (err && (err.timeout || (window.SyncStatus && SyncStatus.isTransient(err)))) {
        syncNotice = get(K.outbox, []).length ? SEND_RETRY : PULL_RETRY;
        return;
      }
      throw err;
    }
    if (token !== sessionEpoch) return;
    let live = user;
    try {
      if (typeof fb.refreshProfile === 'function') {
        const fresh = await withTimeout(fb.refreshProfile(user), 2500, 'ملف المستخدم');
        if (token !== sessionEpoch) return;
        if (!fresh) { await holdSession(MISSING_PROFILE_MSG); return; }
        if (fresh.active !== true) { await holdSession(SUSPENDED_MSG); return; }
        live = fresh;
        paintShell();
      }
    } catch (err) {
      if (token !== sessionEpoch) return;
      if (isDeadAuth(err)) { await holdSession(SESSION_DEAD_MSG); return; }
      if (err && (err.timeout || (window.SyncStatus && SyncStatus.isTransient(err)))) {
        syncNotice = get(K.outbox, []).length ? SEND_RETRY : PULL_RETRY;
        return;
      }
      throw err;
    }
    const ids = get(K.outbox, []).slice();
    keptIds = [];
    if (ids.length) {
      const result = await window.Sync.flushOutbox({
        ids,
        load: id => get(K.entries, []).find(e => e.id === id) || get(K.projects, []).find(p => p.id === id) || get(K.subcontracts, []).find(s => s.id === id) || get(K.amendments, []).find(a => a.id === id) || null,
        write: local => fb.writeLocal(local),
        exists: local => fb.exists(local),
        readServer: async local => {
          try {
            if (typeof fb.readServer === 'function') return await fb.readServer(local);
            if (window.SyncStatus && fb.db) return await SyncStatus.readRemote(fb.db, window.Sync.collectionFor(local), local.id);
          } catch (e) {
            if (isDeadAuth(e)) throw e;
          }
          return null;
        },
      });
      if (token !== sessionEpoch) return;
      if (result.authDead) { await holdSession(SESSION_DEAD_MSG); return; }
      if ((result.failed || []).length && typeof fb.refreshProfile === 'function') {
        try {
          const again = await fb.refreshProfile(live);
          if (token !== sessionEpoch) return;
          if (!again || again.active !== true) {
            result.kept = (result.kept || []).concat(result.failed.map(row => row && row.id).filter(Boolean));
            result.failed = [];
            result.synced = result.synced || [];
            keptIds = result.kept;
            if (window.SyncStatus) {
              const next = SyncStatus.applyFlush(get(K.outbox, []), get(K.syncErrors, {}), result);
              set(K.outbox, next.outbox);
              set(K.syncErrors, next.errors);
            }
            await holdSession(!again ? MISSING_PROFILE_MSG : SUSPENDED_MSG);
            return;
          }
          live = again;
        } catch (err) {
          if (token !== sessionEpoch) return;
          if (isDeadAuth(err)) { await holdSession(SESSION_DEAD_MSG); return; }
        }
      }
      keptIds = result.kept || [];
      if (result.adopted && result.adopted.length) {
        const map = new Map(result.adopted.map(row => [row.id, row.remote]));
        set(K.entries, get(K.entries, []).map(entry => map.has(entry.id) ? adoptEntry(entry, map.get(entry.id)) : entry));
      }
      if (window.SyncStatus) {
        const next = SyncStatus.applyFlush(get(K.outbox, []), get(K.syncErrors, {}), result);
        set(K.outbox, next.outbox);
        set(K.syncErrors, next.errors);
      } else set(K.outbox, get(K.outbox, []).filter(id => !(result.synced || []).includes(id) && !(result.failed || []).some(row => row && row.id === id)));
      if ((result.kept || []).length) syncNotice = SEND_RETRY;
      else if (!(result.failed || []).length) syncNotice = '';
      // The reversal race adopts the server row and clears the outbox here.
      // Waiting for the pull left the old «لم يُرسل» pill on screen.
      if (token === sessionEpoch) paintShell();
    }
    if (token !== sessionEpoch) return;
    statusAtStart = get(K.statusPending, []).slice();
    if (live.role === 'owner' && typeof fb.updateProjectStatus === 'function') {
      try { await flushProjectStatus(fb); }
      catch (err) {
        if (token !== sessionEpoch) return;
        if (isDeadAuth(err)) { await holdSession(SESSION_DEAD_MSG); return; }
        syncNotice = SEND_RETRY;
      }
    }
    if (token !== sessionEpoch) return;
    try {
      await fb.pull(live);
      if (token === sessionEpoch) {
        lastSyncAt = Date.now();
        if (!get(K.outbox, []).length) syncNotice = '';
      }
    } catch (err) {
      if (token !== sessionEpoch) return;
      if (isDeadAuth(err)) { await holdSession(SESSION_DEAD_MSG); return; }
      syncNotice = get(K.outbox, []).length ? SEND_RETRY : PULL_RETRY;
    }
  } catch (err) {
    if (token !== sessionEpoch) return;
    if (isDeadAuth(err)) { await holdSession(SESSION_DEAD_MSG); return; }
    syncNotice = SEND_RETRY;
    keptIds = null;
  } finally {
    if (flushing === run) flushing = null;
    if (token === sessionEpoch) paintShell();
  }
  // An id queued again during this flush (a contract saved after its project
  // write, or an entry saved during the pull) is not in kept. Send it now.
  if (Array.isArray(keptIds) && token === sessionEpoch && navigator.onLine !== false && get(K.sessionUser)) {
    queuePendingFinance();
    queuePendingSubcontracts();
    const kept = new Set(keptIds);
    const started = new Set(Array.isArray(statusAtStart) ? statusAtStart : get(K.statusPending, []));
    const freshStatus = get(K.statusPending, []).some(id => !started.has(id));
    if (get(K.outbox, []).some(id => !kept.has(id)) || freshStatus) return flushRemote();
  }
}
function releaseDb() {
  directoryPromise = null;
  if (db) { try { db.close(); } catch (e) {} db = null; }
  for (const k of Object.keys(cache)) delete cache[k];
}
function usableProfile(profile, uid) {
  return !!(profile && profile.uid === uid && profile.active !== false && (profile.role === 'owner' || profile.role === 'site'));
}
async function localSession() {
  if (!indexedDB.databases) return null;
  let listed;
  try { listed = await indexedDB.databases(); } catch (e) { return null; }
  const names = (listed || []).map(d => d && d.name).filter(n => typeof n === 'string' && n.indexOf('aj-u-') === 0);
  for (const name of names) {
    const uid = name.slice('aj-u-'.length);
    if (!uid) continue;
    try {
      await openUserDb(uid);
      const profile = get(K.sessionUser, null);
      if (usableProfile(profile, uid)) return profile;
    } catch (e) {}
    releaseDb();
  }
  return null;
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
/** @returns {Promise<void>} */
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
  if ((get(K.statusPending, []) || []).length) return false;
  if (!db) return true;
  await writing.catch(() => {});
  try {
    const n = await req(db.transaction('outbox', 'readonly').objectStore('outbox').count());
    if (n !== 0) return false;
    const pending = await req(db.transaction('meta', 'readonly').objectStore('meta').get(K.statusPending));
    return !pending || !pending.length;
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
async function probeSession() {
  if (demoRole() || navigator.onLine === false) return '';
  let fb;
  try { fb = await ensureFirebase(); } catch (err) {
    return isDeadAuth(err) ? SESSION_DEAD_MSG : '';
  }
  let user;
  try { user = await fb.currentUser(); } catch (err) {
    return isDeadAuth(err) ? SESSION_DEAD_MSG : '';
  }
  if (!user) return get(K.sessionUser) ? SESSION_DEAD_MSG : '';
  try {
    if (typeof fb.idToken === 'function') await fb.idToken(true);
  } catch (err) {
    if (isDeadAuth(err)) return SESSION_DEAD_MSG;
    return '';
  }
  try {
    const data = await fb.profile(user.uid);
    if (data && data.active === false) return SUSPENDED_MSG;
  } catch (err) {
    if (isDeadAuth(err)) return SESSION_DEAD_MSG;
  }
  return '';
}
async function closeSession() {
  const reason = await probeSession();
  if (!reason && !await outboxEmpty()) {
    alert('يوجد تغييرات لم تُرسل. أرسلها أولاً ثم اخرج');
    return false;
  }
  const name = db && db.name;
  sessionEpoch += 1;
  try {
    await closeUserDb();
    if (!reason && name && name.indexOf('aj-u-') === 0) await deleteDb(name);
    await disposeFirebase(true);
    await clearExtraCaches();
  } catch (e) {}
  showLoginMessage(reason);
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
    throw new Error(data && data.active === false ? SUSPENDED_MSG : MISSING_PROFILE_MSG);
  }
  await openUserDb(uid);
  set(K.sessionUser, profile);
  showApp();
  render();
  flushRemote();
}
const ledger = () => L.createLedger(get(K.entries, []));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = (n, cls) => `<b class="num${cls ? ' ' + cls : ''}">${L.fmt(n)} د.ع</b>`;
function subHref(kind, id) {
  if (!window.DomSafe || !DomSafe.isSafeId(id)) return '#projects';
  if (kind !== 'sub' && kind !== 'subnew' && kind !== 'amend') return '#projects';
  return '#' + kind + '/' + DomSafe.projectAttr(id);
}
function subcontractsOf(projectId) {
  return get(K.subcontracts, []).filter(s => s.projectId === projectId);
}
function amendmentsOf(subId) {
  return get(K.amendments, []).filter(a => a.subcontractId === subId).slice().sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : (a.id < b.id ? -1 : 1));
}
function subFigures(sub, entries) {
  const terms = (get(K.terms, {}) || {})[sub.id];
  if (!terms || !Number.isInteger(terms.originalAmount)) return null;
  return L.subcontractBalance(terms.originalAmount, get(K.amendments, []), entries, sub.id);
}
function subcontractCard(sub, entries) {
  const fig = subFigures(sub, entries);
  if (!fig) return `<a class="card proj" href="${subHref('sub', sub.id)}"><h2>${esc(sub.name)}</h2><div class="note">${esc(sub.work)}</div><div class="note">المبلغ غير متاح</div></a>`;
  const badge = fig.settled ? '<span class="pill ok">مسدّد بالكامل</span>' : '';
  const remainCls = fig.over ? 'bad' : (fig.settled ? 'ok' : '');
  return `<a class="card proj" href="${subHref('sub', sub.id)}">
    <div class="subhead"><h2>${esc(sub.name)}</h2>${badge}</div>
    <div class="note">${esc(sub.work)}</div>
    <div class="kv"><span>المتفق عليه</span>${money(fig.agreed)}</div>
    <div class="kv"><span>المدفوع</span>${money(fig.paid)}</div>
    <div class="kv"><span>المتبقي</span>${money(fig.remaining, remainCls)}</div>
    <div class="bar${fig.over ? ' over' : ''}" data-bar="${esc(sub.id)}"><i style="width:${fig.width}%"></i></div>
  </a>`;
}
function subcontractSection(project, entries) {
  const cards = subcontractsOf(project.id).map(sub => subcontractCard(sub, entries)).join('');
  return `<div class="card" id="subcontracts"><h2>المقاولون</h2></div>${cards || '<div class="card"><div class="note">لا توجد عقود.</div></div>'}
    <a class="btn ghost" href="${subHref('subnew', project.id)}">+ عقد مقاول</a>`;
}
function queueDoc(id) {
  const out = get(K.outbox, []);
  if (!out.includes(id)) set(K.outbox, out.concat([id]));
  if (!demoRole()) flushRemote();
}
function saveSubcontract(u, button) {
  if (!u || u.role !== 'owner') return;
  const projectId = (location.hash.slice(1).split('/')[1]) || '';
  const project = get(K.projects, []).find(p => p.id === projectId);
  if (!project) return;
  if (button) button.disabled = true;
  const name = ($('#sub-name') && $('#sub-name').value || '').trim();
  const work = ($('#sub-work') && $('#sub-work').value || '').trim();
  const parsed = L.parseAmount($('#sub-amount') && $('#sub-amount').value);
  if (!name || name.length > 100) { state.subMsg = 'أدخل اسم المقاول'; if (button) button.disabled = false; render(); return; }
  if (work.length > 500) { state.subMsg = 'وصف العمل بحد أقصى 500 حرفاً'; if (button) button.disabled = false; render(); return; }
  if (!parsed.ok) { state.subMsg = parsed.error; if (button) button.disabled = false; render(); return; }
  const id = state.subFormId || uuid();
  const all = get(K.subcontracts, []);
  if (!all.some(s => s.id === id)) {
    set(K.subcontracts, [...all, { id, projectId, name, work, agreedOn: today(), createdAtServer: null, createdBy: u.uid }]);
    const terms = get(K.terms, {});
    terms[id] = { originalAmount: parsed.amount, pending: true };
    set(K.terms, terms);
    queueDoc(id);
  }
  state.subFormId = '';
  state.subName = ''; state.subAmount = ''; state.subWork = ''; state.subMsg = '';
  location.hash = subHref('sub', id);
}
function dateOk(s) {
  return typeof s === 'string'
    && /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(s)
    && s >= '2000-01-01' && s <= '2100-12-31'
    && !/^[0-9]{4}-02-3[01]$/.test(s)
    && !/^[0-9]{4}-(04|06|09|11)-31$/.test(s);
}
function saveAmendment(u, button) {
  if (!u || u.role !== 'owner') return;
  const subcontractId = (location.hash.slice(1).split('/')[1]) || '';
  const sub = get(K.subcontracts, []).find(s => s.id === subcontractId);
  if (!sub) return;
  if (button) button.disabled = true;
  const date = ($('#am-date') && $('#am-date').value || '').trim();
  const note = ($('#am-note') && $('#am-note').value || '').trim();
  const parsed = L.parseAmount($('#am-amount') && $('#am-amount').value);
  if (!dateOk(date)) { state.amMsg = 'التاريخ بصيغة YYYY-MM-DD'; if (button) button.disabled = false; render(); return; }
  if (!note || note.length > 200) { state.amMsg = 'أدخل البيان'; if (button) button.disabled = false; render(); return; }
  if (!parsed.ok) { state.amMsg = parsed.error; if (button) button.disabled = false; render(); return; }
  const id = state.amFormId || uuid();
  const all = get(K.amendments, []);
  if (!all.some(a => a.id === id)) {
    set(K.amendments, [...all, { id, subcontractId, projectId: sub.projectId, amount: parsed.amount, date, note, createdAtServer: null, createdBy: u.uid }]);
    queueDoc(id);
  }
  state.amFormId = '';
  state.amDate = ''; state.amAmount = ''; state.amNote = ''; state.amMsg = '';
  location.hash = subHref('sub', subcontractId);
}
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
  const raw = ($('#contract') && $('#contract').value || '').trim();
  if (!raw) { if (msg) msg.textContent = 'أدخل قيمة العقد'; return; }
  const parsed = L.parseAmount(raw, { allowZero: true });
  if (!parsed.ok) { if (msg) msg.textContent = parsed.error; return; }
  const amount = parsed.amount;
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
  lg.append(entry, { user: me(), projects: get(K.projects, []), policy: POLICY, subcontracts: get(K.subcontracts, []) });
  set(K.entries, lg.all()); set(K.outbox, [...get(K.outbox, []), entry.id]);
  if (!demoRole()) flushRemote();
}
function sendNow() { // fake sync: stamp server time, drain outbox. Re-sending the same id is a no-op.
  const out = new Set(get(K.outbox, [])); if (!out.size) return;
  const now = Date.now();
  set(K.entries, get(K.entries, []).map(e => out.has(e.id) && !e.createdAtServer ? { ...e, createdAtServer: now } : e));
  set(K.projects, get(K.projects, []).map(p => out.has(p.id) && !p.createdAtServer ? { ...p, createdAtServer: now } : p));
  set(K.subcontracts, get(K.subcontracts, []).map(s => out.has(s.id) && !s.createdAtServer ? Object.assign({}, s, { createdAtServer: now }) : s));
  set(K.amendments, get(K.amendments, []).map(a => out.has(a.id) && !a.createdAtServer ? Object.assign({}, a, { createdAtServer: now }) : a));
  const terms = get(K.terms, {});
  let termsChanged = false;
  Object.keys(terms).forEach(id => {
    if (out.has(id) && terms[id] && terms[id].pending) {
      terms[id] = { originalAmount: terms[id].originalAmount };
      termsChanged = true;
    }
  });
  if (termsChanged) set(K.terms, terms);
  set(K.outbox, []); render();
}

function counts(entries) {
  return L.countedEntries(entries, get(K.syncErrors, {}) || {});
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
  const ctx = { projects: get(K.projects, []), entries: get(K.entries, []), finance: get(K.finance, {}), policy: POLICY, syncErrors: get(K.syncErrors, {}) || {} };
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
  let can;
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
function shownEntryCount(projectId) {
  if (state.listProject !== projectId) {
    state.listProject = projectId;
    state.listShown = L.PROJECT_ENTRY_PAGE;
  }
  return state.listShown || L.PROJECT_ENTRY_PAGE;
}
function entryListRow(row) {
  const status = row.reversalStatus ? `<small>${esc(row.reversalStatus)}</small>` : '';
  const cls = row.reversalStatus === 'قيد عكسي' ? 'bad' : '';
  return `<div class="entry"><a class="entry-open" href="${entryHref(row.id)}"><div class="meta"><span>${esc(row.type)}</span><small class="num">${esc(row.entryDate)}</small><small>${esc(row.recorder)}</small><small>${esc(row.party)}</small>${status}</div><span class="num ${cls}">${esc(row.amount)}</span></a></div>`;
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

function connectionLabel() {
  if (!demoRole()) return navigator.onLine ? 'متصل' : 'بدون إنترنت';
  return navigator.onLine ? 'متصل (محاكاة)' : 'بدون إنترنت';
}
function phoneSyncNote() {
  if (demoRole()) return 'لم تُرسل بعد. اضغط «إرسال الآن» للمحاكاة (لا يوجد خادم حقيقي).';
  return navigator.onLine ? 'يُرسل تلقائياً عند الاتصال.' : 'محفوظ على الهاتف. يُرسل عند عودة الاتصال.';
}
const views = {
  home() {
    const { u, projects, entries } = data();
    const sync = `<div class="card" style="background:#FFFBF4"><div class="pills" style="align-items:center"><span class="pill warn">${connectionLabel()}</span></div></div>`;
    const ex = (demoRole() || get(K.entries, []).some(e => e.isExample)) ? '<div class="example">⚠️ بيانات مثال وليست حقيقية</div>' : '';
    if (u.role === 'owner') {
      const t = L.totals(counts(entries));
      return ex + sync + `<div class="card"><h2>ملخص كل المشاريع</h2>
        <div class="kv"><span>إجمالي المقبوض</span>${money(t.received)}</div>
        <div class="kv"><span>إجمالي المصروف</span>${money(t.spent)}</div>
        <div class="kv"><span>صافي الربح</span><span class="${t.profit < 0 ? 'bad' : 'ok'}">${money(t.profit)}</span></div></div>
        <a class="btn" href="#entry">+ قيد جديد</a><button class="btn ghost" id="csv">تصدير نسخة (CSV)</button>`;
    }
    const mine = entries.filter(e => e.createdBy === u.uid).slice(-3).reverse();
    return ex + sync + `<div class="card"><h2>مشاريعي (${projects.length})</h2>${projects.map(p => {
        const s = counts(entries.filter(e => e.projectId === p.id && e.entryDate === today()));
        return `<div class="kv"><span>${esc(p.name)}</span><b>مصروف اليوم: <span class="num">${L.fmt(L.totals(s).spent)}</span></b></div>`; }).join('')}</div>
      <div class="card"><h2>آخر قيودي</h2>${mine.map(e => entryRow(e, u, entries)).join('') || '<div class="note">لا يوجد</div>'}</div>
      <a class="btn" href="#entry">+ قيد جديد</a>`;
  },
  entry(pid) {
    const { u } = data();
    const projects = L.projectList(u, get(K.projects, []), POLICY, 'open');
    const types = Object.entries(L.ENTRY_TYPES).filter(([k, t]) => {
      if (k === 'subcontractor') return u.role === 'owner' || u.role === 'site';
      return u.role === 'owner' || t.direction === 'expense' || POLICY.siteCanCreateClientPayment;
    });
    if (!types.some(([k]) => k === state.type)) state.type = types[0][0];
    if (pid) state.projectId = pid;
    if (!projects.some(p => p.id === state.projectId)) state.projectId = projects[0] && projects[0].id;
    const subsHere = subcontractsOf(state.projectId);
    if (state.type === 'subcontractor' && !subsHere.some(s => s.id === state.subcontractId)) state.subcontractId = (subsHere[0] && subsHere[0].id) || '';
    const partyBlock = state.type === 'subcontractor'
      ? `<label class="field">المقاول
          <select id="subcontract" class="full">${subsHere.map(s => `<option value="${esc(s.id)}"${s.id === state.subcontractId ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select>
        </label>`
      : `<label class="field">الجهة المستلمة / المورّد (اختياري)
          <input id="party" class="full" maxlength="100" autocomplete="off" value="${esc(state.party || '')}">
        </label>`;
    return `<div class="card"><div class="step">1 النوع</div><div class="pills">${types.map(([k, t]) => `<button class="pill ${k === state.type ? 'on' : ''}" data-type="${k}">${t.label}</button>`).join('')}</div></div>
      <div class="card"><div class="step">2 المبلغ</div><div class="amount"><input id="amt" inputmode="numeric" value="${esc(state.amountDraft || '')}" placeholder="0"> <span>د.ع</span></div>
        <div class="pills" style="justify-content:center"><button class="pill" data-add="1000">+ ألف</button><button class="pill" data-add="1000000">+ مليون</button><button class="pill bad" data-add="0">مسح</button></div></div>
      <div class="card"><div class="step">3 المشروع${u.role === 'site' ? ' (مشاريعي فقط)' : ''}</div><div class="pills">${projects.map(p => window.DomSafe ? DomSafe.projectButton(p.id, p.name, p.id === state.projectId) : `<button class="pill ${p.id === state.projectId ? 'on' : ''}" data-proj="${esc(p.id)}">${esc(p.name)}</button>`).join('')}</div></div>
      <textarea id="desc" rows="2" placeholder="ملاحظة (اختياري)">${esc(state.desc || '')}</textarea>
      ${partyBlock}
      <button class="btn" id="save">حفظ</button><div id="msg" class="msg">${state.formMsgKind === 'saved' ? '<span class="pill warn">✓ حُفظ على الهاتف · لم يُرسل بعد</span>' : esc(state.formMsg || '')}</div>
      <div class="note msg">لا يمكن تعديل القيد أو حذفه بعد الحفظ.</div>`;
  },
  projects() {
    const { u, entries } = data();
    const list = u.role === 'owner' && state.projectList === 'archived' ? 'archived' : 'open';
    const projects = L.projectList(u, get(K.projects, []), POLICY, list);
    const filter = u.role === 'owner'
      ? `<div class="pills" id="project-filter"><button type="button" class="pill${list === 'open' ? ' on' : ''}" data-list="open">المشاريع</button><button type="button" class="pill${list === 'archived' ? ' on' : ''}" data-list="archived">المؤرشفة</button></div>`
      : '';
    const cards = list === 'archived'
      ? (projects.map(p => {
        const href = window.DomSafe ? DomSafe.projectHref('project', p.id) : '#projects';
        return `<div class="card"><a class="proj" href="${href}"><h2>${esc(p.name)}</h2></a><button type="button" class="btn ghost" data-restore="${esc(p.id)}">استعادة</button></div>`;
      }).join('') || '<div class="note">لا توجد مشاريع مؤرشفة</div>')
      : projects.map(p => {
        const s = L.projectSummary(u, counts(entries.filter(e => e.projectId === p.id)));
        const line = u.role === 'owner'
          ? `<div class="kv"><span>${s.profit < 0 ? 'خسارة' : 'ربح'}</span><span class="${s.profit < 0 ? 'bad' : 'ok'}">${money(Math.abs(s.profit))}</span></div>`
          : `<div class="kv"><span>المصروف</span>${money(s.spent)}</div>`;
        return `<a class="card proj" href="${window.DomSafe ? DomSafe.projectHref('project', p.id) : '#projects'}"><div class="kv"><h2>${esc(p.name)}</h2><span>‹</span></div>${line}</a>`;
      }).join('');
    const tail = list === 'archived' ? '' : (u.role === 'owner' ? `<div class="note">الأرقام تشمل ما على هذا الجهاز فقط.</div><button class="btn ghost" id="newproj">+ مشروع جديد</button>` : '<div class="note">ترى فقط المشاريع المعيّنة لك.</div>');
    return filter + cards + tail;
  },
  project(id) {
    const { u, projects, entries } = data();
    const p = projects.find(x => x.id === id); if (!p) return '<div class="card">المشروع غير متاح</div>';
    const es = entries.filter(e => e.projectId === id); const s = L.projectSummary(u, counts(es));
    const card = u.role === 'owner'
      ? `${contractFields(p)}<div class="kv"><span>المقبوض</span>${money(s.received)}</div><div class="kv"><span>المصروف</span>${money(s.spent)}</div>
         <div class="kv"><span>الربح</span><span class="${s.profit < 0 ? 'bad' : 'ok'}">${money(s.profit)}</span></div><div class="note">الربح = المقبوض − المصروف</div>`
      : `<div class="kv"><span>المصروف</span>${money(s.spent)}</div>${Object.entries(s.byType).map(([k, v]) => `<div class="kv"><span>${L.ENTRY_TYPES[k].label}</span><b class="num">${L.fmt(v)}</b></div>`).join('')}`;
    const allHref = window.DomSafe ? DomSafe.projectHref('entries', p.id) : '#projects';
    const subs = u.role === 'owner' ? subcontractSection(p, counts(es)) : '';
    const deleteNote = state.deleteMsg ? `<p class="delete-msg">${esc(state.deleteMsg)}</p>` : '';
    const manage = u.role === 'owner' && u.active === true
      ? `<section class="project-manage" id="project-manage"><button type="button" class="btn ghost" id="manage-project">إدارة المشروع</button>${deleteNote}</section>`
      : '';
    return `<div class="card">${card}</div>${subs}<div class="card"><h2>آخر القيود</h2>${es.slice().reverse().slice(0, 8).map(e => entryRow(e, u, es)).join('')}</div>
      <a class="btn ghost" id="all-entries" href="${allHref}">عرض جميع القيود</a>
      <a class="btn" href="${window.DomSafe ? DomSafe.projectHref('entry', p.id) : '#projects'}">+ قيد لهذا المشروع</a>${manage}`;
  },
  // Local cache only. projectEntryList reads nothing from Firestore; «المزيد»
  // reveals the next 50 rows already stored for this project.
  entries(id) {
    const u = me();
    const back = `<button type="button" class="mini" id="back-project">رجوع</button>`;
    const list = L.projectEntryList(u, id, { projects: get(K.projects, []), entries: get(K.entries, []), syncErrors: get(K.syncErrors, {}) || {}, policy: POLICY }, { limit: shownEntryCount(id) });
    if (!list) return back + '<div class="card">المشروع غير متاح</div>';
    if (!list.total) return back + '<div class="card" id="entry-list"><div class="note">لا توجد قيود لهذا المشروع</div></div>';
    const more = list.rows.length < list.total ? '<button type="button" class="btn ghost" id="more-entries">المزيد</button>' : '';
    return `${back}<div class="card" id="entry-list"><h2>كل القيود</h2><div class="note" id="entry-count">${list.rows.length} من ${list.total}</div>${list.rows.map(entryListRow).join('')}</div>${more}`;
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
      <div id="person-msg" class="msg">${esc(state.personMsg || '')}</div></div>`;
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
      ${(get(K.syncErrors, {}) || {})[e.id] ? '' : `<div class="export-actions">
        <button type="button" class="btn ghost" id="entry-print">طباعة</button>
        <button type="button" class="btn ghost" id="entry-pdf">حفظ PDF</button>
        <button type="button" class="btn ghost" id="entry-file">حفظ كملف</button>
      </div>`}`;
  },
  sub(id) {
    const u = me();
    if (!u || u.role !== 'owner') return '<div class="card">هذه الشاشة للمالك.</div>';
    const sub = get(K.subcontracts, []).find(s => s.id === id);
    if (!sub) return '<div class="card">العقد غير متاح</div>';
    const entries = counts(get(K.entries, []).filter(e => e.projectId === sub.projectId));
    const fig = subFigures(sub, entries);
    const agreed = fig ? fig.agreed : null;
    const warn = fig && fig.over ? `<div class="warnbox">المدفوع أكبر من المتفق عليه بـ ${L.fmt(fig.paid - fig.agreed)} د.ع. تنبيه فقط، ولا يمنع تسجيل دفعة.</div>` : '';
    const badge = fig && fig.settled ? '<span class="pill ok">مسدّد بالكامل</span>' : '';
    const remainCls = fig && fig.over ? 'bad' : (fig && fig.settled ? 'ok' : '');
    const terms = (get(K.terms, {}) || {})[sub.id];
    const original = terms && Number.isInteger(terms.originalAmount) ? money(terms.originalAmount) : '<b>غير متاح</b>';
    const amRows = amendmentsOf(sub.id).map(a => `<div class="kv"><span><span class="num">${esc(a.date)}</span> ${esc(a.note)}</span><b class="num">+${L.fmt(a.amount)}</b></div>`).join('') || '<div class="note">لا ملاحق.</div>';
    const payRows = entries.filter(e => e.entryType === 'subcontractor' && e.subcontractId === sub.id).slice().sort((a, b) => a.entryDate < b.entryDate ? -1 : 1).map(e => `<div class="kv"><span><span class="num">${esc(e.entryDate)}</span> ${esc(e.description || '—')}</span><b class="num">${L.fmt(e.amount * L.sign(e))}</b></div>`).join('') || '<div class="note">لا دفعات.</div>';
    const loose = entries.filter(e => e.entryType === 'subcontractor' && !e.subcontractId);
    const looseRows = loose.map(e => `<div class="entry"><div class="meta"><span>${esc(e.description || '—')}</span><small class="num">${esc(e.entryDate)}</small></div><span class="pill">غير مرتبط</span><b class="num">${L.fmt(e.amount * L.sign(e))}</b></div>`).join('') || '<div class="note">لا قيود سابقة بلا عقد.</div>';
    const syncNote = (get(K.syncErrors, {}) || {})[sub.id] || (get(K.outbox, []).includes(sub.id) ? 'لم يُرسل' : '');
    return `<button type="button" class="mini" id="back-sub">رجوع</button>
      <div class="card">
        <div class="subhead"><h2>${esc(sub.name)}</h2>${badge}</div>
        <div class="note">${esc(sub.work)}</div>
        ${warn}
        ${syncNote ? `<div class="note">${esc(syncNote)}</div>` : ''}
        <div class="kv"><span>الأصل</span>${original}</div>
        <div class="kv"><span>المتفق عليه</span>${agreed === null ? '<b>غير متاح</b>' : money(agreed)}</div>
        <div class="kv"><span>المدفوع</span>${fig ? money(fig.paid) : '<b>غير متاح</b>'}</div>
        <div class="kv"><span>المتبقي</span>${fig ? money(fig.remaining, remainCls) : '<b>غير متاح</b>'}</div>
        ${fig ? `<div class="bar${fig.over ? ' over' : ''}"><i style="width:${fig.width}%"></i></div>` : ''}
        <a class="btn ghost" href="${subHref('amend', sub.id)}">+ ملحق</a>
      </div>
      <div class="card"><h2>سجل الملاحق</h2><div class="note">كل ملحق صف بتاريخ. لا يُعدَّل صف ولا يُحذف.</div>${amRows}</div>
      <div class="card"><h2>الدفعات</h2>${payRows}</div>
      <div class="card" id="unlinked"><h2>قيود بلا عقد</h2><div class="note">قيد «مقاول» سابق بلا عقد. لا يدخل في المدفوع ولا في المتبقي.</div>${looseRows}</div>`;
  },
  subnew(projectId) {
    const u = me();
    if (!u || u.role !== 'owner') return '<div class="card">هذه الشاشة للمالك.</div>';
    const project = get(K.projects, []).find(p => p.id === projectId);
    if (!project) return '<div class="card">المشروع غير متاح</div>';
    if (!state.subFormId) {
      state.subFormId = uuid();
      if (!state.subName) state.subName = 'مقاول السباكة';
      if (!state.subAmount) state.subAmount = L.fmt(1500000);
      if (!state.subWork) state.subWork = 'تمديد شبكة الماء للمجمع المدرسي';
    }
    return `<button type="button" class="mini" id="back-project">رجوع</button>
      <div class="card">
        <div class="step">عقد مقاول · ${esc(project.name)}</div>
        <label class="field">اسم المقاول<input id="sub-name" class="full" maxlength="100" value="${esc(state.subName)}"></label>
        <label class="field">المبلغ المتفق عليه<input id="sub-amount" class="full" inputmode="numeric" value="${esc(state.subAmount)}"></label>
        <label class="field">وصف العمل<textarea id="sub-work" rows="2" maxlength="500">${esc(state.subWork)}</textarea></label>
        <button type="button" class="btn" id="save-sub">حفظ العقد</button>
        <div id="sub-msg" class="msg">${esc(state.subMsg || '')}</div>
        <div class="note">بعد الحفظ لا يتغير المبلغ إلا بملحق مؤرخ.</div>
      </div>`;
  },
  amend(id) {
    const u = me();
    if (!u || u.role !== 'owner') return '<div class="card">هذه الشاشة للمالك.</div>';
    const sub = get(K.subcontracts, []).find(s => s.id === id);
    if (!sub) return '<div class="card">العقد غير متاح</div>';
    const fig = subFigures(sub, counts(get(K.entries, [])));
    if (!state.amFormId) {
      state.amFormId = uuid();
      if (!state.amDate) state.amDate = '2026-10-28';
      if (!state.amAmount) state.amAmount = L.fmt(200000);
      if (!state.amNote) state.amNote = 'خزان ماء إضافي';
    }
    return `<button type="button" class="mini" id="back-sub">رجوع</button>
      <div class="card">
        <div class="step">ملحق · ${esc(sub.name)}</div>
        <div class="kv"><span>المتفق عليه الآن</span>${fig ? money(fig.agreed) : '<b>غير متاح</b>'}</div>
        <label class="field">تاريخ الملحق<input id="am-date" class="full" value="${esc(state.amDate)}"></label>
        <label class="field">المبلغ المضاف<input id="am-amount" class="full" inputmode="numeric" value="${esc(state.amAmount)}"></label>
        <label class="field">البيان<input id="am-note" class="full" maxlength="200" value="${esc(state.amNote)}"></label>
        <button type="button" class="btn" id="save-amend">إضافة الملحق</button>
        <div id="am-msg" class="msg">${esc(state.amMsg || '')}</div>
        <div class="note">الملحق يُضاف فقط. لا تعديل ولا حذف.</div>
      </div>`;
  },
};
const titles = { home:'الرئيسية', entry:'قيد جديد', projects:'المشاريع', project:'', entries:'كل القيود', detail:'تفاصيل القيد', people:'الأشخاص', person:'شخص', sub:'عقد مقاول', subnew:'عقد مقاول', amend:'ملحق' };

function tabGlyph() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const circle = document.createElementNS(ns, 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '8.2');
  circle.setAttribute('r', '3.1');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M5 19.3c1.15-2.85 3.55-4.25 7-4.25s5.85 1.4 7 4.25');
  svg.append(circle, path);
  return svg;
}
function syncPeopleTab(u) {
  const tabs = document.querySelector('.tabs');
  if (!tabs) return;
  /** @type {HTMLAnchorElement | null} */
  let a = /** @type {HTMLAnchorElement | null} */ (tabs.querySelector('[data-tab="people"]'));
  if (!u || u.role !== 'owner') { if (a) a.remove(); return; }
  if (!a) {
    a = document.createElement('a');
    a.href = '#people';
    a.dataset.tab = 'people';
    const span = document.createElement('span');
    span.textContent = 'الأشخاص';
    a.append(tabGlyph(), span);
    tabs.appendChild(a);
  }
}

function captureForm() {
  const desc = $('#desc');
  const party = $('#party');
  const amt = $('#amt');
  if (desc) state.desc = desc.value;
  if (party) state.party = party.value;
  if (amt) state.amountDraft = amt.value;
  const subPick = $('#subcontract');
  if (subPick) state.subcontractId = subPick.value;
  const subName = $('#sub-name'); if (subName) state.subName = subName.value;
  const subAmount = $('#sub-amount'); if (subAmount) state.subAmount = subAmount.value;
  const subWork = $('#sub-work'); if (subWork) state.subWork = subWork.value;
  const amDate = $('#am-date'); if (amDate) state.amDate = amDate.value;
  const amAmount = $('#am-amount'); if (amAmount) state.amAmount = amAmount.value;
  const amNote = $('#am-note'); if (amNote) state.amNote = amNote.value;
  const typed = $('#delete-name');
  if (typed && state.confirm && state.confirm.action === 'delete') state.confirm.typed = typed.value;
}
function confirmShell(inner) {
  return `<div class="confirm-back" id="confirm-dialog" role="dialog" aria-modal="true"><div class="confirm">${inner}</div></div>`;
}
function deleteConfirm(c) {
  const project = get(K.projects, []).find(p => p.id === c.id);
  const name = project ? project.name : '';
  if (c.step === 2) {
    const typed = c.typed || '';
    const ready = window.Sync.exactProjectName(typed, name);
    return confirmShell(`<p>اكتب اسم المشروع كما هو لتأكيد الحذف</p><p class="copy"><b>${esc(name)}</b></p><label class="field">اسم المشروع<input id="delete-name" class="full" autocomplete="off" value="${esc(typed)}"></label><p class="copy bad">الحذف نهائي. لا توجد نسخة احتياطية يُعتمد عليها.</p><button type="button" class="btn danger" id="confirm-delete"${ready ? '' : ' disabled'}>حذف نهائياً</button><button type="button" class="btn ghost" id="confirm-no">إلغاء</button>`);
  }
  return confirmShell(`<p>حذف هذا المشروع نهائياً؟</p><p class="copy">يُحذف المشروع وكل ما فيه. كل القيود، بما فيها الدفعات وقيود «مقاول»، ومالية المشروع، وعقود المقاولين وشروطها وملاحقها.</p><p class="copy">القيود التي لم تُرسل بعد على أي هاتف (صندوق الإرسال عند مستخدمي الموقع) قد تُفقد أو يُرفض إرسالها.</p><p class="copy bad">الحذف نهائي. لا توجد نسخة احتياطية يُعتمد عليها.</p><button type="button" class="btn danger" id="confirm-yes">نعم</button><button type="button" class="btn ghost" id="confirm-no">إلغاء</button>`);
}
function manageChoice(c) {
  const project = get(K.projects, []).find(p => p.id === c.id);
  const archive = L.nextProjectStatus(me(), project, 'archive')
    ? '<button type="button" class="btn ghost" id="choose-archive">أرشفة</button>'
    : '';
  return confirmShell(`<p>إدارة المشروع</p>${archive}<button type="button" class="btn danger" id="choose-delete">حذف</button><button type="button" class="btn ghost" id="confirm-no">إلغاء</button>`);
}
function confirmDialog() {
  const c = state.confirm;
  if (!c) return '';
  if (c.action === 'manage') return manageChoice(c);
  if (c.action === 'delete') return deleteConfirm(c);
  const ask = c.action === 'restore' ? 'استعادة هذا المشروع؟' : 'أرشفة هذا المشروع؟';
  return confirmShell(`<p>${ask}</p><button type="button" class="btn danger" id="confirm-yes">نعم</button><button type="button" class="btn ghost" id="confirm-no">إلغاء</button>`);
}
function rememberProjectStatus(id, before) {
  if (!before || !before.createdAtServer) {
    const out = get(K.outbox, []);
    if (!out.includes(id)) set(K.outbox, out.concat([id]));
    return;
  }
  const pending = get(K.statusPending, []);
  if (!pending.includes(id)) set(K.statusPending, pending.concat([id]));
}
function commitProjectStatus(action, id) {
  const u = me();
  const projects = get(K.projects, []);
  const project = projects.find(p => p.id === id);
  const status = L.nextProjectStatus(u, project, action);
  if (!status) return false;
  set(K.projects, projects.map(p => p.id === id ? Object.assign({}, p, { status }) : p));
  if (!demoRole()) rememberProjectStatus(id, project);
  return true;
}
function openConfirm(action, id) {
  const project = get(K.projects, []).find(p => p.id === id);
  if (!L.nextProjectStatus(me(), project, action)) return;
  state.confirm = { id, action };
  render();
}
async function deleteProjectNow(id) {
  const u = me();
  const project = get(K.projects, []).find(p => p.id === id);
  if (!u || u.role !== 'owner' || u.active !== true || !project) return;
  if (demoRole()) {
    writeCache(window.Sync.dropProjectLocal(cacheSnapshot(), id, { dropPending: true }));
    state.deleteMsg = '';
    if (location.hash !== '#projects') location.hash = '#projects';
    else render();
    return;
  }
  if (navigator.onLine === false) {
    state.deleteMsg = 'الحذف يحتاج اتصالاً. لم يُحذف شيء.';
    render();
    return;
  }
  deleteLock = true;
  try {
    if (flushing) await flushing.catch(() => {});
    const fb = await ensureFirebase();
    await fb.deleteProject(id);
    writeCache(window.Sync.dropProjectLocal(cacheSnapshot(), id, { dropPending: true }));
    state.deleteMsg = '';
    if (location.hash !== '#projects') location.hash = '#projects';
    else render();
  } catch (err) {
    state.deleteMsg = 'تعذر الحذف. لم يُحذف شيء من هذا الجهاز.';
    render();
  } finally {
    deleteLock = false;
  }
}
function finishConfirm(c) {
  const ok = commitProjectStatus(c.action, c.id);
  if (!ok) { render(); return; }
  if (c.action === 'archive') {
    state.projectList = 'open';
    if (location.hash !== '#projects') { location.hash = '#projects'; }
    else render();
  } else render();
  if (!demoRole()) flushRemote();
}
function lastSyncMillis() {
  if (lastSyncAt) return lastSyncAt;
  const mark = get(K.pullWatermark, null) || {};
  return Math.max(Number(mark.entries) || 0, Number(mark.projects) || 0);
}
function formatSyncTime(ms) {
  const d = new Date(ms);
  const date = new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'short', numberingSystem: 'latn' }).format(d);
  const time = new Intl.DateTimeFormat('ar', { hour: '2-digit', minute: '2-digit', numberingSystem: 'latn' }).format(d);
  return date + ' · ' + time;
}
function failedMessages() {
  const errors = get(K.syncErrors, {}) || {};
  return Object.keys(errors).filter(id => errors[id]).map(id => String(errors[id]));
}
function paintBell() {
  const btn = $('#outbox');
  if (!btn) return;
  const count = get(K.outbox, []).length;
  const failed = failedMessages();
  const offline = navigator.onLine === false;
  const sending = !!flushing;
  const label = ['التنبيهات', 'لم يُرسل بعد: ' + count];
  if (offline) label.push('بدون إنترنت');
  if (sending) label.push('جارٍ الإرسال');
  if (failed.length) label.push(failed[0]);
  if (syncNotice) label.push(syncNotice);
  btn.setAttribute('aria-label', label.join('، '));
  btn.setAttribute('aria-expanded', bellOpen ? 'true' : 'false');
  if (sending) btn.setAttribute('aria-busy', 'true');
  else btn.removeAttribute('aria-busy');
  const badge = btn.querySelector('.bell-badge');
  if (badge) {
    badge.hidden = count === 0;
    badge.textContent = String(count);
  }
  const panel = $('#bell-panel');
  if (panel) {
    panel.hidden = !bellOpen;
    const when = lastSyncMillis();
    const stateLine = offline ? 'بدون إنترنت' : (sending ? 'جارٍ الإرسال' : 'متصل');
    const failBlock = failed.length
      ? '<p class="bell-fail">' + esc(failed[0]) + (failed.length > 1 ? ' · ' + failed.length : '') + '</p>'
      : '';
    const retry = syncNotice ? '<p class="bell-fail">' + esc(syncNotice) + '</p>' : '';
    panel.innerHTML = '<p class="bell-k">لم يُرسل بعد</p><p class="bell-count">' + count + '</p>'
      + '<p class="bell-k">' + esc(count + ' قيود محفوظة على الهاتف') + '</p>'
      + '<p class="bell-k">آخر مزامنة</p><p class="bell-time">' + esc(when ? formatSyncTime(when) : 'لم تتم بعد') + '</p>'
      + '<p class="bell-k">' + esc(stateLine) + '</p>'
      + '<p class="bell-note">' + esc(phoneSyncNote()) + '</p>'
      + failBlock + retry
      + '<button type="button" class="btn" id="bell-send"' + (sending ? ' disabled' : '') + '>'
      + (sending ? 'جارٍ الإرسال' : 'إرسال الآن') + '</button>';
  }
  const note = $('#sync-msg');
  if (note) { note.hidden = true; note.textContent = ''; }
}
function setFormMsg(text, kind) {
  state.formMsg = text || '';
  state.formMsgKind = kind || (text ? 'error' : '');
  const box = $('#msg');
  if (!box) return;
  if (state.formMsgKind === 'saved') box.innerHTML = '<span class="pill warn">✓ حُفظ على الهاتف · لم يُرسل بعد</span>';
  else box.textContent = state.formMsg;
}
function render() {
  captureForm();
  const u = me(); if (!u) return;
  const printRoot = $('#print-root');
  if (printRoot) printRoot.innerHTML = '';
  const [view, arg] = (location.hash.slice(1) || 'home').split('/');
  const v = views[view] ? view : 'home';
  if (v !== 'entry') { state.formMsg = ''; state.formMsgKind = ''; }
  if (v !== 'person') state.personMsg = '';
  if (u.role !== 'owner') { state.confirm = null; state.projectList = 'open'; }
  if (state.confirm && (state.confirm.action === 'manage' || state.confirm.action === 'delete' || state.confirm.action === 'archive') && v !== 'project') state.confirm = null;
  if (v !== 'project') state.deleteMsg = '';
  if (v !== 'subnew') state.subMsg = '';
  if (v !== 'amend') state.amMsg = '';
  $('#role').value = u.role;
  $('#role-label').hidden = !demoRole();
  $('#logout').hidden = !!demoRole();
  $('#who').textContent = demoRole()
    ? (u.role === 'owner' ? 'المالك · أمير' : 'مستخدم موقع · أحمد (مشرف)')
    : ((u.role === 'owner' ? 'المالك' : 'مستخدم موقع') + ' · ' + (u.displayName || ''));
  paintBell();
  syncPeopleTab(u);
  const tab = (v === 'project' || v === 'entries' || v === 'sub' || v === 'subnew' || v === 'amend') ? 'projects' : (v === 'person' ? 'people' : v);
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  if (!demoRole() && u.role === 'owner' && (v === 'people' || v === 'person') && !directoryPromise) {
    $('#title').textContent = titles[v] || 'الأشخاص';
    $('#main').innerHTML = '<div class="card">' + esc('جارٍ تحميل الأشخاص') + '</div>';
    ensureDirectory().then(() => { if (me() && me().role === 'owner') render(); }).catch(() => {
      const main = $('#main'); if (main) main.innerHTML = '<div class="card">' + esc('تعذر تحميل الأشخاص') + '</div>';
    });
    return;
  }
  const projectTitle = (data().projects.find(p => p.id === arg) || {}).name || (v === 'entries' ? 'القيود' : 'مشروع');
  let heading = (v === 'project' || v === 'entries') ? projectTitle : (v === 'projects' && u.role === 'site' ? 'مشاريعي' : titles[v]);
  if (v === 'sub' || v === 'amend') {
    const found = get(K.subcontracts, []).find(s => s.id === arg);
    heading = found ? found.name : 'عقد مقاول';
  } else if (v === 'subnew') heading = arg && projectTitle !== 'مشروع' ? projectTitle : 'عقد مقاول';
  $('#title').textContent = heading;
  $('#main').innerHTML = views[v](arg) + confirmDialog();
}

document.addEventListener('click', ev => {
  if (bellOpen && !ev.target.closest('.bell-wrap')) { bellOpen = false; paintBell(); }
  if (ev.target.closest && ev.target.closest('#confirm-dialog') && !ev.target.closest('.confirm')) {
    state.confirm = null;
    render();
    return;
  }
  const revBtn = ev.target.closest('[data-rev]');
  const open = !revBtn && ev.target.closest('a.entry-open, a.detail-link');
  if (open && $('#login').hidden) state.backStack.push(location.hash || '#home');
  const b = ev.target.closest('button'); if (!b) return;
  if (!$('#login').hidden) return;
  const u = me();
  if (b.dataset.type) { state.type = b.dataset.type; render(); }
  else if (b.dataset.proj) { state.projectId = b.dataset.proj; render(); }
  else if (b.dataset.add != null) {
    const amtEl = $('#amt');
    const parsed = L.parseAmount(amtEl ? amtEl.value : '');
    const base = parsed.ok ? parsed.amount : 0;
    const next = b.dataset.add === '0' ? 0 : base + Number(b.dataset.add);
    if (next > L.MAX_AMOUNT_IQD) {
      setFormMsg((L.parseAmount(String(next)) || {}).error || '', 'error');
      return;
    }
    state.amount = next;
    state.formMsg = '';
    state.formMsgKind = '';
    if (amtEl) amtEl.value = next ? L.fmt(next) : '';
    render();
  }
  else if (b.id === 'outbox') { bellOpen = !bellOpen; paintBell(); }
  else if (b.id === 'bell-send') { if (demoRole()) sendNow(); else flushRemote(); }
  else if (b.id === 'logout') closeSession().then(ok => { if (ok) showLogin(); }).catch(() => { if (!db) showLogin(); });
  else if (b.id === 'back') { location.hash = state.backStack.pop() || '#home'; }
  else if (b.id === 'back-sub') {
    const parts = location.hash.slice(1).split('/');
    const id = parts[1] || '';
    if (parts[0] === 'amend' && id) { location.hash = subHref('sub', id); return; }
    const sub = get(K.subcontracts, []).find(s => s.id === id);
    const projectId = sub ? sub.projectId : '';
    const href = window.DomSafe ? DomSafe.projectHref('project', projectId) : '#projects';
    location.hash = data().projects.some(p => p.id === projectId) ? href : '#projects';
  }
  else if (b.id === 'back-project') {
    const id = (location.hash.slice(1).split('/')[1]) || '';
    const href = window.DomSafe ? DomSafe.projectHref('project', id) : '#projects';
    location.hash = data().projects.some(p => p.id === id) ? href : '#projects';
  }
  else if (b.id === 'more-entries') {
    state.listShown = (state.listShown || L.PROJECT_ENTRY_PAGE) + L.PROJECT_ENTRY_PAGE;
    render();
  }
  else if (b.id === 'save') {
    b.disabled = true; // id generated once per form; double-tap cannot duplicate
    const desc = $('#desc').value.trim();
    let party = ($('#party') && $('#party').value || '').trim();
    let subcontractId = '';
    if (state.type === 'subcontractor') {
      if (!u || (u.role !== 'owner' && u.role !== 'site')) { b.disabled = false; setFormMsg('تسجيل دفعة المقاول غير مسموح', 'error'); return; }
      subcontractId = ($('#subcontract') && $('#subcontract').value) || '';
      const chosen = subcontractsOf(state.projectId).find(s => s.id === subcontractId);
      if (!chosen) { b.disabled = false; setFormMsg('اختر مقاولاً من هذا المشروع', 'error'); return; }
      party = chosen.name;
    }
    const parsed = L.parseAmount($('#amt') && $('#amt').value);
    if (!parsed.ok) { b.disabled = false; setFormMsg(parsed.error, 'error'); return; }
    const e = { id: state.formId, projectId: state.projectId, direction: L.ENTRY_TYPES[state.type].direction, entryType: state.type,
      amount: parsed.amount, currency: 'IQD', entryDate: today(), description: desc, partyName: party, isReversal: false,
      createdAtDevice: Date.now(), createdAtServer: null, createdBy: u.uid, deviceId };
    if (subcontractId) e.subcontractId = subcontractId;
    const recorded = L.recorderName(u);
    if (recorded) e.createdByName = recorded;
    try {
      commit(e);
      state.amount = 0; state.amountDraft = ''; state.desc = ''; state.party = ''; state.formId = uuid();
      setFormMsg('حُفظ', 'saved');
      if ($('#desc')) $('#desc').value = '';
      if ($('#party')) $('#party').value = '';
      if ($('#amt')) $('#amt').value = '';
      render();
    }
    catch (err) { b.disabled = false; setFormMsg(err.message, 'error'); }
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
    const rows = L.countedEntries(get(K.entries, []), get(K.syncErrors, {}) || {});
    const blob = new Blob([L.toCSV(rows, get(K.projects, []))], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'aj-ledger-' + today() + '.csv'; a.click();
  } else if (b.dataset.list) {
    if (!u || u.role !== 'owner') return;
    state.projectList = b.dataset.list === 'archived' ? 'archived' : 'open';
    state.confirm = null;
    render();
  } else if (b.id === 'manage-project') {
    const id = (location.hash.slice(1).split('/')[1]) || '';
    const uNow = me();
    const project = get(K.projects, []).find(p => p.id === id);
    if (!uNow || uNow.role !== 'owner' || uNow.active !== true || !project) return;
    state.confirm = { id, action: 'manage' };
    render();
  } else if (b.id === 'choose-archive') {
    const id = state.confirm && state.confirm.id;
    if (id) openConfirm('archive', id);
  } else if (b.id === 'choose-delete') {
    const id = state.confirm && state.confirm.id;
    const uNow = me();
    const project = id && get(K.projects, []).find(p => p.id === id);
    if (!uNow || uNow.role !== 'owner' || uNow.active !== true || !project) return;
    state.deleteMsg = '';
    state.confirm = { id, action: 'delete', step: 1, typed: '' };
    render();
  } else if (b.dataset.restore) {
    openConfirm('restore', b.dataset.restore);
  } else if (b.id === 'confirm-no') {
    state.confirm = null;
    render();
  } else if (b.id === 'confirm-yes') {
    const pending = state.confirm;
    if (pending && pending.action === 'delete') {
      pending.step = 2;
      pending.typed = '';
      render();
    } else {
      state.confirm = null;
      if (pending) finishConfirm(pending);
    }
  } else if (b.id === 'confirm-delete') {
    if (b.disabled) return;
    const pending = state.confirm;
    const typed = ($('#delete-name') && $('#delete-name').value) || '';
    const project = pending && get(K.projects, []).find(p => p.id === pending.id);
    if (!pending || pending.action !== 'delete' || !project || !window.Sync.exactProjectName(typed, project.name)) return;
    state.confirm = null;
    deleteProjectNow(project.id);
  } else if (b.id === 'newproj') {
    if (!L.canCreateProject(u)) return;
    const name = prompt('اسم المشروع:'); if (!name) return; const clientName = prompt('اسم الزبون:') || '';
    const p = { id: uuid(), name, clientName, location: '', currency: 'IQD', status: 'active', createdAtDevice: Date.now(), createdAtServer: null, createdBy: u.uid, deviceId };
    set(K.projects, [...get(K.projects, []), p]); set(K.outbox, [...get(K.outbox, []), p.id]); render();
    if (!demoRole()) flushRemote();
  } else if (b.id === 'save-contract') saveContract(u);
  else if (b.id === 'save-person') savePerson(u);
  else if (b.id === 'save-sub') saveSubcontract(u, b);
  else if (b.id === 'save-amend') saveAmendment(u, b);
});
document.addEventListener('input', ev => {
  const el = /** @type {HTMLInputElement | null} */ (ev.target);
  if (!el || el.id !== 'delete-name' || !state.confirm || state.confirm.action !== 'delete') return;
  state.confirm.typed = el.value;
  const project = get(K.projects, []).find(p => p.id === state.confirm.id);
  const btn = $('#confirm-delete');
  if (btn) btn.disabled = !project || !window.Sync.exactProjectName(el.value, project.name);
});
document.addEventListener('beforeinput', ev => {
  const el = /** @type {HTMLInputElement | HTMLTextAreaElement | null} */ (ev.target);
  if (!el || el.maxLength == null || el.maxLength < 0) return;
  const data = ev.data || '';
  if (!data) return;
  const limitMsg = el.id === 'party' ? 'الجهة المستلمة بحد أقصى 100 حرفاً'
    : el.id === 'person-name' ? 'الاسم بحد أقصى 80 حرفاً' : '';
  if (!limitMsg) return;
  const start = el.selectionStart == null ? el.value.length : el.selectionStart;
  const end = el.selectionEnd == null ? el.value.length : el.selectionEnd;
  if (el.value.length - (end - start) + data.length <= el.maxLength) return;
  if (el.id === 'person-name') {
    state.personMsg = limitMsg;
    const box = $('#person-msg');
    if (box) box.textContent = limitMsg;
  } else setFormMsg(limitMsg, 'error');
});
$('#role').addEventListener('change', ev => { if (!demoRole()) return; set(K.role, /** @type {HTMLSelectElement} */ (ev.target).value); render(); });
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
    if (!data) { await disposeFirebase(true); throw new Error(MISSING_PROFILE_MSG); }
    await withTimeout(enterSession(fb, cred.user.uid, data), LOGIN_MS, 'فتح البيانات');
  } catch (err) {
    if (token !== sessionEpoch) return;
    msg.textContent = err.code ? loginError(err) : (err.message || 'تعذر الدخول');
  } finally { if (token === sessionEpoch) btn.disabled = false; document.body.dataset.loginAttempt = '1'; }
});
addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && bellOpen) { bellOpen = false; paintBell(); }
});
addEventListener('hashchange', render);
addEventListener('online', () => { if (!demoRole() && get(K.sessionUser)) flushRemote(); else if (!$('#shell').hidden) render(); });
addEventListener('offline', () => { if (!$('#shell').hidden) render(); });
(async () => {
  if (!demoRole()) {
    const token = sessionEpoch;
    let stayed = false;
    try {
      const local = await localSession();
      if (token !== sessionEpoch) return;
      if (local) {
        showApp();
        render();
        markReady();
        stayed = true;
        if (navigator.onLine === false) return;
      }
    } catch (e) {}
    if (token !== sessionEpoch) return;
    try {
      let fb = await withTimeout(ensureFirebase(), LOGIN_MS, 'تحميل');
      if (token !== sessionEpoch) return;
      let user = await withTimeout(fb.currentUser(), LOGIN_MS, 'الجلسة');
      if (token !== sessionEpoch) return;
      if (!user) {
        if (stayed && navigator.onLine === false) return;
        if (stayed) { await holdSession(SESSION_DEAD_MSG); return; }
        showLogin();
        return;
      }
      await openUserDb(user.uid);
      if (token !== sessionEpoch) return;
      let profile = get(K.sessionUser, null);
      const adopt = data => { if (data) { profile = profileFrom(user.uid, data); set(K.sessionUser, profile); } };
      try {
        if (navigator.onLine !== false) adopt(await withTimeout(fb.profile(user.uid), LOGIN_MS, 'ملف المستخدم'));
      } catch (err) {
        if (token !== sessionEpoch) return;
        if (isDeadAuth(err)) {
          showLoginMessage(SESSION_DEAD_MSG);
          try { await disposeFirebase(true); } catch (e2) {}
          return;
        }
        if (isPoison(err)) {
          try {
            fb = await rebuildFirebase(false);
            if (token !== sessionEpoch) return;
            user = await withTimeout(fb.currentUser(), LOGIN_MS, 'الجلسة');
            if (user && navigator.onLine !== false) adopt(await withTimeout(fb.profile(user.uid), LOGIN_MS, 'ملف المستخدم'));
          } catch (e2) {
            if (isDeadAuth(e2)) {
              showLoginMessage(SESSION_DEAD_MSG);
              try { await disposeFirebase(true); } catch (e3) {}
              return;
            }
            if (!profile) { const m = $('#login-msg'); if (m) m.textContent = REPAIR_MSG; }
          }
        }
      }
      if (token !== sessionEpoch) return;
      if (!profile || profile.active === false) {
        showLogin();
        if (profile && profile.active === false) {
          const m = $('#login-msg');
          if (m) m.textContent = SUSPENDED_MSG;
        }
        return;
      }
      showApp(); render(); markReady(); flushRemote();
    } catch (e) {
      if (token !== sessionEpoch) return;
      if (stayed) return;
      showLogin();
      const m = $('#login-msg');
      if (m && isDeadAuth(e)) m.textContent = SESSION_DEAD_MSG;
      else if (m && e && (isPoison(e) || isImportFailure(e))) m.textContent = e.message || REPAIR_MSG;
      if (isDeadAuth(e)) { try { await disposeFirebase(true); } catch (e2) {} }
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
