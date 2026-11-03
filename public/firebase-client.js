'use strict';
// Firebase web client and the outbox flush that calls Sync.
// Screens stay in app.js. The device database and login stay in session.js.
// 13.1.0 is the newest JS SDK (2026-10-21). Its ca9 watch-target fix from 12.13.0
// still leaves the assertion reachable, so a newer FB_VER is not available to upgrade to.
var FB_VER = '13.1.0';
var fbPromise = null;
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
  } catch (e) { /* unregister or cache delete failed; the reload still runs */ }
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
      if (S.usesPutIfMissing(col)) {
        await this.putIfMissing(col, clean.id, S.withServerTime(clean, fsMod.serverTimestamp()));
        return;
      }
      await fsMod.setDoc(fsMod.doc(fdb, col, clean.id), S.withServerTime(clean, fsMod.serverTimestamp()));
      if (col !== 'projects') return;
      const user = get(K.sessionUser, null);
      if (!Ledger.can(user, 'owner')) return;
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
      const fm = await S.pullForemen({
        user,
        since: previousMark.foremen,
        read: readSpec,
      });
      const pendingForemen = get(K.outbox, []);
      set(K.foremen, S.mergeById(get(K.foremen, []), fm.foremen, pendingForemen));
      set(K.foremanMoves, S.mergeById(get(K.foremanMoves, []), fm.moves, pendingForemen));
      set(K.pullWatermark, Object.assign({}, get(K.pullWatermark, {}) || {}, { foremen: fm.watermark }));
      if (Ledger.can(user, 'owner')) {
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
var flushing = null;
var deleteLock = false;
var lastSyncAt = 0;
var FLUSH_MS = 20000;
var SEND_RETRY = 'تعذر الإرسال. أعد المحاولة';
var PULL_RETRY = 'تعذر التحديث. أعد المحاولة';
function cacheSnapshot() {
  return {
    entries: get(K.entries, []),
    projects: get(K.projects, []),
    subcontracts: get(K.subcontracts, []),
    amendments: get(K.amendments, []),
    foremen: get(K.foremen, []),
    foremanMoves: get(K.foremanMoves, []),
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
  set(K.foremen, next.foremen || []);
  set(K.foremanMoves, next.foremanMoves || []);
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
  if (Ledger.can(user, 'owner')) {
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
  ['projectId', 'direction', 'entryType', 'amount', 'currency', 'entryDate', 'isReversal', 'reversesEntryId', 'reversalReason', 'createdBy', 'createdByName', 'description', 'partyName', 'subcontractId', 'foremanId', 'deviceId', 'createdAtDevice', 'createdAtServer'].forEach(k => {
        if (src[k] === undefined || src[k] === null || src[k] === '') {
      if (k === 'createdByName' || k === 'description' || k === 'partyName' || k === 'reversalReason' || k === 'subcontractId' || k === 'foremanId') delete next[k];
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
        load: id => get(K.entries, []).find(e => e.id === id) || get(K.projects, []).find(p => p.id === id) || get(K.subcontracts, []).find(s => s.id === id) || get(K.amendments, []).find(a => a.id === id) || get(K.foremen, []).find(f => f.id === id) || get(K.foremanMoves, []).find(m => m.id === id) || null,
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
    if (Ledger.can(live, 'owner') && typeof fb.updateProjectStatus === 'function') {
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

// Classic-script globals the other scripts call.
Object.assign(window, {
  fbPromise, flushing, deleteLock, lastSyncAt,
  ensureFirebase, rebuildFirebase, flushRemote, disposeFirebase, isDeadAuth, isImportFailure,
  cacheSnapshot, writeCache,
});
