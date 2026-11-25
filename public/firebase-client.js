'use strict';
// Firebase web client and the outbox flush that calls Sync.
// Screens stay in app.js. The device database and login stay in session.js.
// 13.1.0 is the newest JS SDK (2026-10-21). Its ca9 watch-target fix from 12.13.0
// still leaves the assertion reachable, so a newer FB_VER is not available to upgrade to.
var FB_VER = '13.1.0';
/** @type {Promise<any> | null} */
var fbPromise = null;
var fbGeneration = 0;
var FB_LOAD_MS = 20000;
/** @param {any} err */
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
  const generation = ++fbGeneration;
  const attempt = (async () => {
    try { return await settledClient(generation); }
    catch (err1) {
      if (generation !== fbGeneration) throw err1;
      try { return await settledClient(generation); }
      catch (err2) {
        if (generation !== fbGeneration) throw err2;
        if (isImportFailure(err2)) await recoverModuleOnce();
        throw err2;
      }
    }
  })();
  const timed = withTimeout(attempt, FB_LOAD_MS, 'تحميل');
  /** @type {Promise<any>} */
  let guarded;
  guarded = timed.catch(err => {
    if (fbPromise === guarded) fbPromise = null;
    if (generation === fbGeneration) fbGeneration += 1;
    throw err;
  });
  fbPromise = guarded;
  return guarded;
}
/**
 * A generation that lost the race must not resolve the shared promise with null.
 * The sentence is the one withTimeout already builds for تحميل.
 * @returns {Error}
 */
function abandonedLoad() {
  const err = new Error('انتهت المهلة (تحميل). تحقق من الاتصال وأعد المحاولة');
  err.timeout = true;
  err.abandoned = true;
  return err;
}
/**
 * @param {number} generation
 * @returns {Promise<any>}
 */
async function settledClient(generation) {
  const client = await loadFirebase(generation);
  if (!client) throw abandonedLoad();
  return client;
}
/**
 * @param {number} generation
 * @returns {Promise<any>}
 */
async function loadFirebase(generation) {
  const base = 'https://www.gstatic.com/firebasejs/' + FB_VER + '/';
  const [{ initializeApp, deleteApp, getApps }, authMod, fsMod] = await Promise.all([
    import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js'),
  ]);
  return createFirebaseClient({ initializeApp, deleteApp, getApps, authMod, fsMod }, generation);
}
/**
 * Drop this attempt's app only while it is still the registered object.
 * deleteApp removes whichever app is stored under that name.
 * @param {{ getApps(): any[], deleteApp(app: any): Promise<void> }} mods
 * @param {any} app
 */
async function dropAbandonedApp(mods, app) {
  const registered = mods.getApps().find(a => a === app);
  if (registered) await mods.deleteApp(registered).catch(() => {});
}
/**
 * @param {{ initializeApp(config: any, name?: string): any, deleteApp(app: any): Promise<void>, getApps(): any[], authMod: any, fsMod: any }} mods
 * @param {number} generation
 * @returns {Promise<any>}
 */
async function createFirebaseClient(mods, generation) {
  if (generation !== fbGeneration) return null;
  const { initializeApp, deleteApp, getApps, authMod, fsMod } = mods;
  const stale = getApps().find(a => a.name === '[DEFAULT]');
  if (stale) await deleteApp(stale).catch(() => {});
  if (generation !== fbGeneration) return null;
  const app = initializeApp(window.FIREBASE_CONFIG);
  if (generation !== fbGeneration) {
    await dropAbandonedApp(mods, app);
    return null;
  }
  const auth = authMod.getAuth(app);
  const emulator = new URLSearchParams(location.search).get('emulator') === '1';
  if (emulator) authMod.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  // The ledger's offline store is aj-u- (entries, projects, outbox). Firestore's
  // persistentLocalCache is a second store, and it is what replays a failed watch
  // stream (ca9, then b815) after the auth user changes — including on the next launch.
  /** @type {any} */
  let fdb;
  try {
    fdb = fsMod.initializeFirestore(app, { localCache: fsMod.memoryLocalCache() });
  } catch (e) { fdb = fsMod.getFirestore(app); }
  if (emulator) fsMod.connectFirestoreEmulator(fdb, '127.0.0.1', 8080);
  if (generation !== fbGeneration) {
    await dropAbandonedApp(mods, app);
    return null;
  }
  // Drop IndexedDB left by the old persistent cache before any read. Memory cache
  // does not open it; deleting it is what unblocks a phone that already saved the bad state.
  await withTimeout(fsMod.clearIndexedDbPersistence(fdb), 5000, 'الذاكرة').catch(() => {});
  if (generation !== fbGeneration) {
    await dropAbandonedApp(mods, app);
    return null;
  }
  const marked = signOutPending();
  if (marked) {
    let signed = false;
    try {
      await withTimeout(authMod.signOut(auth), 3000, 'خروج');
      signed = true;
    } catch (e) { /* a failed sign-out leaves the marker; the client is still returned */ }
    if (generation !== fbGeneration) {
      await dropAbandonedApp(mods, app);
      return null;
    }
    if (signed) clearSignOutPending(marked);
  }
  const S = window.Sync;
  /**
   * @typedef {{ opId: string, advanceId: string, delta: number }} CapOp
   * @typedef {SyncApi & {
   *   CAP_COLLECTION: string,
   *   CAP_TRIES: number,
   *   CAP_OVER: string,
   *   capOpOf(doc: SyncDoc, original: SyncDoc | null): CapOp | null,
   *   capSeed(advanceId: string, draws: readonly SyncDoc[], reversedIds: ReadonlySet<string>): number,
   *   capStep(input: {
   *     op: CapOp,
   *     prev: { advanceId?: string, partyId?: string, projectId?: string, currency?: string, cap?: number, drawn?: number, lastOpId?: string } | null,
   *     advance: SyncDoc | null,
   *     advanceLive: boolean,
   *     seed: number,
   *   }): { ok: true, cap: { advanceId: string, partyId: string, projectId: string, currency: string, cap: number, drawn: number, lastOpId: string } } | { ok: false, reason: 'over' | 'dead' | 'advance' },
   *   capChanged(read: { exists: boolean, lastOpId: string | null }, now: { exists: boolean, lastOpId: string | null }): boolean,
   * }} CapSync
   */
  function capSync() {
    return /** @type {CapSync} */ (/** @type {unknown} */ (S));
  }
  /**
   * @param {{ exists(): boolean, data(): any }} snap
   * @returns {{ exists: boolean, lastOpId: string | null, data: any }}
   */
  function capView(snap) {
    const data = snap && snap.exists() ? snap.data() : null;
    return {
      exists: !!(snap && snap.exists()),
      lastOpId: data && typeof data.lastOpId === 'string' ? data.lastOpId : null,
      data,
    };
  }
  /**
   * @param {string} advanceId
   * @returns {Promise<number>}
   */
  async function readCapSeed(advanceId) {
    const caps = capSync();
    const col = fsMod.collection(fdb, 'accountTxns');
    const pair = await Promise.all([
      fsMod.getDocsFromServer(fsMod.query(col, fsMod.where('settlesId', '==', advanceId))),
      fsMod.getDocsFromServer(fsMod.query(col, fsMod.where('targetId', '==', advanceId))),
    ]);
    /** @type {SyncDoc[]} */
    const draws = [];
    pair.forEach(/** @param {{ docs: { id: string, data(): SyncDoc }[] }} snap */ snap => {
      (snap.docs || []).forEach(item => {
        const data = Object.assign({ id: item.id }, item.data() || {});
        draws.push(data);
      });
    });
    const revs = await Promise.all(draws.map(item => fsMod.getDocFromServer(fsMod.doc(fdb, 'accountTxns', 'rev_' + item.id))));
    /** @type {Set<string>} */
    const reversed = new Set();
    draws.forEach((item, index) => {
      if (revs[index] && revs[index].exists()) reversed.add(String(item.id));
    });
    return caps.capSeed(advanceId, draws, reversed);
  }
  /**
   * One CAP_TRIES loop pass is one runTransaction call. Thrown values are plain objects.
   * @param {SyncDoc} clean
   * @param {CapOp} op
   * @returns {Promise<void>}
   */
  async function writeCapped(clean, op) {
    const caps = capSync();
    const uid = auth.currentUser && auth.currentUser.uid ? auth.currentUser.uid : '';
    const capRef = fsMod.doc(fdb, caps.CAP_COLLECTION, op.advanceId);
    const opRef = fsMod.doc(fdb, 'accountTxns', String(clean.id));
    const advRef = fsMod.doc(fdb, 'accountTxns', op.advanceId);
    const advRevRef = fsMod.doc(fdb, 'accountTxns', 'rev_' + op.advanceId);
    const pre = capView(await fsMod.getDocFromServer(capRef));
    let seed = pre.exists ? 0 : await readCapSeed(op.advanceId);
    const tries = caps.CAP_TRIES;
    for (let attempt = 1; attempt <= tries; attempt++) {
      /** @type {{ exists: boolean, lastOpId: string | null }} */
      let attemptRead = { exists: false, lastOpId: null };
      try {
        await fsMod.runTransaction(fdb, async (/** @type {{ get(ref: unknown): Promise<any>, set(ref: unknown, data: unknown): unknown }} */ tx) => {
          const opSnap = await tx.get(opRef);
          if (opSnap.exists()) throw { code: 'already-exists' };
          const capSnap = capView(await tx.get(capRef));
          const advSnap = await tx.get(advRef);
          const advRevSnap = await tx.get(advRevRef);
          attemptRead = { exists: capSnap.exists, lastOpId: capSnap.lastOpId };
          const step = caps.capStep({
            op,
            prev: capSnap.exists ? capSnap.data : null,
            advance: advSnap.exists() ? advSnap.data() : null,
            advanceLive: !advRevSnap.exists(),
            seed: capSnap.exists ? 0 : seed,
          });
          if (!step.ok) throw { capRefused: /** @type {{ reason: string }} */ (step).reason };
          tx.set(opRef, caps.withServerTime(clean, fsMod.serverTimestamp()));
          tx.set(capRef, Object.assign({}, step.cap, {
            updatedBy: uid,
            updatedAtServer: fsMod.serverTimestamp(),
          }));
        });
        return;
      } catch (err) {
        const failure = /** @type {{ code?: string, capRefused?: string, timeout?: boolean }} */ (err);
        if (failure && failure.code === 'already-exists') throw { code: 'already-exists' };
        const code = failure && failure.code ? String(failure.code) : '';
        if (failure && (failure.timeout || code === 'unavailable' || code === 'deadline-exceeded' || code === 'aborted')) throw err;
        const denied = code === 'permission-denied' || !!(failure && failure.capRefused);
        if (!denied) throw err;
        const now = capView(await fsMod.getDocFromServer(capRef));
        if (caps.capChanged(attemptRead, now)) {
          if (!attemptRead.exists && now.exists) seed = 0;
          if (attempt === tries) throw { code: 'aborted' };
          continue;
        }
        if (failure && failure.capRefused) {
          if (failure.capRefused === 'over') throw { client: true, capOver: true };
          throw { client: true };
        }
        throw err;
      }
    }
  }
  return {
    auth, db: fdb,
    /** @param {string} email @param {string} password */
    signIn: (email, password) => authMod.signInWithEmailAndPassword(auth, email, password),
    signOut: () => authMod.signOut(auth),
    currentUser: async () => { await auth.authStateReady(); return auth.currentUser; },
    /** @param {boolean | undefined} force */
    idToken: async force => {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) return null;
      return user.getIdToken(!!force);
    },
    // Clear persisted watch state, then tear the client down. The SDK rejects a clear
    // while this instance is running, so a rejected clear is followed by terminate and a second clear.
    /** @param {boolean | undefined} signOutUser */
    async dispose(signOutUser) {
      /** @param {() => unknown} fn */
      const step = async fn => { try { await fn(); return true; } catch (e) { return false; } };
      // Clear before terminate. A running client rejects that, so terminate and clear again.
      const cleared = await step(() => fsMod.clearIndexedDbPersistence(fdb));
      await step(() => withTimeout(fsMod.terminate(fdb), 3000, 'إغلاق'));
      if (!cleared) await step(() => withTimeout(fsMod.clearIndexedDbPersistence(fdb), 3000, 'إغلاق'));
      let signedOut = true;
      if (signOutUser) signedOut = await step(() => withTimeout(authMod.signOut(auth), 3000, 'خروج'));
      await step(() => withTimeout(deleteApp(app), 3000, 'إغلاق'));
      return signedOut;
    },
    /** @param {string} uid */
    async profile(uid) {
      const snap = await fsMod.getDoc(fsMod.doc(fdb, 'users', uid));
      return snap.exists() ? snap.data() : null;
    },
    // users/{uid} is readable while the account is inactive. The session copy
    // is what the screens filter on, so a pull that skips this keeps offering
    // a project the owner already removed.
    /** @param {{ uid: string, displayName?: string }} user */
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
      return snap.docs.map(/** @param {{ id: string, data(): { createdAtServer?: { toMillis?: () => number, seconds?: number } } }} d */ d => {
        const row = profileFrom(d.id, d.data());
        const ts = d.data().createdAtServer;
        if (ts && typeof ts.toMillis === 'function') row.createdAtServer = ts.toMillis();
        else if (ts && typeof ts.seconds === 'number') row.createdAtServer = ts.seconds * 1000;
        return row;
      });
    },
    /**
     * @param {string} uid
     * @param {{ displayName?: string, email?: string, role?: string, active?: boolean, assignedProjectIds?: readonly string[] }} value
     * @param {{ createdAtServer?: number, createdBy?: string } | null | undefined} existing
     */
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
    /**
     * @param {string} col
     * @param {string} id
     * @param {SyncDoc} data
     */
    async putIfMissing(col, id, data) {
      const ref = fsMod.doc(fdb, col, id);
      const snap = await fsMod.getDocFromServer(ref);
      if (snap.exists()) return;
      await fsMod.setDoc(ref, data);
    },
    /**
     * @param {SyncDoc | null | undefined} local
     * @returns {Promise<number | undefined>} the finance or terms amount this call wrote
     */
    async writeLocal(local) {
      const clean = /** @type {SyncDoc & { id: string }} */ (S.withoutContractAmount(local));
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
        return payload.originalAmount;
      }
      if (S.usesPutIfMissing(col)) {
        await this.putIfMissing(col, clean.id, S.withServerTime(clean, fsMod.serverTimestamp()));
        return;
      }
      if (col === 'accountTxns') {
        /** @type {SyncDoc | null} */
        let original = null;
        if (clean.kind === 'rev' && typeof clean.reversesId === 'string' && clean.reversesId) {
          original = S.localDoc(clean.reversesId, {
            entries: get(K.entries, []),
            projects: get(K.projects, []),
            subcontracts: get(K.subcontracts, []),
            amendments: get(K.amendments, []),
            foremen: get(K.foremen, []),
            foremanMoves: get(K.foremanMoves, []),
            parties: get(K.parties, []),
            agreements: get(K.agreements, []),
            accountTxns: get(K.accountTxns, []),
            statementApprovals: get(K.statementApprovals, []),
            laborReviews: get(K.laborReviews, []),
          });
          if (!original) {
            const found = await fsMod.getDocFromServer(fsMod.doc(fdb, 'accountTxns', clean.reversesId));
            if (found.exists()) original = /** @type {SyncDoc} */ (found.data() || null);
          }
        }
        const op = capSync().capOpOf(clean, original);
        if (op) {
          await writeCapped(clean, op);
          return;
        }
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
      // The legacy flag is cleared only after this acknowledgement. The amount stays on the project row.
      if (clearLegacyPending(clean.id)) return saved.finance.contractAmount;
      const fin = get(K.finance, {});
      const current = fin[clean.id];
      // A contract typed while this write was in flight keeps pending when
      // its amount is not the one just sent, so the flush can send it next.
      if (!current || current.contractAmount === saved.finance.contractAmount) {
        fin[clean.id] = { contractAmount: saved.finance.contractAmount };
        set(K.finance, fin);
      }
      set(K.projects, get(K.projects, []).map(/** @param {SyncDoc} p */ p => p.id === clean.id ? S.withoutContractAmount(p) : p));
      return saved.finance.contractAmount;
    },
    /** @param {string} id @param {string} status */
    async updateProjectStatus(id, status) {
      if (status !== 'archived' && status !== 'active') throw new Error('status');
      await fsMod.updateDoc(fsMod.doc(fdb, 'projects', id), { status });
    },
    /**
     * @param {string} id
     * @returns {Promise<DependencyRead>}
     */
    async readDependency(id) {
      const local = S.localDoc(id, {
        entries: get(K.entries, []),
        projects: get(K.projects, []),
        subcontracts: get(K.subcontracts, []),
        amendments: get(K.amendments, []),
        foremen: get(K.foremen, []),
        foremanMoves: get(K.foremanMoves, []),
        parties: get(K.parties, []),
        agreements: get(K.agreements, []),
        accountTxns: get(K.accountTxns, []),
        statementApprovals: get(K.statementApprovals, []),
        laborReviews: get(K.laborReviews, []),
      });
      const col = (local && S.collectionFor(local)) || 'accountTxns';
      try {
        const snap = await fsMod.getDocFromServer(fsMod.doc(fdb, col, id));
        if (!snap.exists()) return { status: 'missing' };
        return { status: 'found', doc: /** @type {SyncDoc} */ (snap.data() || {}) };
      } catch (err) {
        const failure = /** @type {SyncFailure} */ (err);
        if (isDeadAuth(failure)) throw failure;
        const status = window.SyncStatus ? SyncStatus.dependencyStatus(failure, null) : 'transient';
        if (status === 'auth') throw failure;
        if (status === 'denied') return { status: 'denied' };
        return { status: 'transient' };
      }
    },
    /** @param {SyncDoc} local */
    async exists(local) {
      const snap = await fsMod.getDocFromServer(fsMod.doc(fdb, S.collectionFor(local), local.id));
      return snap.exists();
    },
    /** @param {string} projectId */
    async readProjectDoc(projectId) {
      return fsMod.getDocFromServer(fsMod.doc(fdb, 'projects', projectId));
    },
    /** @param {LedgerUser | null | undefined} user */
    async pull(user) {
      /** @param {ReadSpec} spec */
      const readSpec = async spec => {
        if (spec.id) {
          const snap = await fsMod.getDocFromServer(fsMod.doc(fdb, spec.collection, spec.id));
          return snap.exists() ? [snap.data()] : [];
        }
        const col = fsMod.collection(fdb, spec.collection);
        const clauses = (spec.where || []).map(/** @param {readonly [string, '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'in' | 'array-contains-any' | 'not-in', unknown]} binding */ ([field, op, value]) => fsMod.where(
          field, op, field === 'createdAtServer' ? fsMod.Timestamp.fromMillis(value) : value));
        const src = clauses.length ? fsMod.query(col, ...clauses) : col;
        const snap = await fsMod.getDocsFromServer(src);
        return snap.docs.map(/** @param {{ data(): SyncDoc }} d */ d => d.data());
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
      for (const spec of S.financeReads(user, /** @type {readonly string[]} */ (projects.map(p => p && p.id)))) {
        const rows = await readSpec(spec);
        const live = get(K.finance, {});
        if (live[/** @type {string} */ (spec.id)] && live[/** @type {string} */ (spec.id)].pending) continue;
        const amount = rows[0] && rows[0].contractAmount;
        if (!Number.isInteger(amount)) continue;
        const again = get(K.finance, {});
        if (again[/** @type {string} */ (spec.id)] && again[/** @type {string} */ (spec.id)].pending) continue;
        again[/** @type {string} */ (spec.id)] = { contractAmount: amount };
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
      const accounts = await S.pullAccounts({
        user,
        since: previousMark.accounts,
        read: readSpec,
      });
      const pendingAccounts = get(K.outbox, []);
      set(K.parties, S.mergeById(get(K.parties, []), accounts.parties, pendingAccounts));
      set(K.agreements, S.mergeById(get(K.agreements, []), accounts.agreements, pendingAccounts));
      set(K.accountTxns, S.mergeById(get(K.accountTxns, []), accounts.accountTxns, pendingAccounts));
      set(K.statementApprovals, S.mergeById(get(K.statementApprovals, []), accounts.statementApprovals, pendingAccounts));
      set(K.laborReviews, S.mergeById(get(K.laborReviews, []), accounts.laborReviews, pendingAccounts));
      set(K.pullWatermark, Object.assign({}, get(K.pullWatermark, {}) || {}, { [S.ACCOUNTS_MARK]: accounts.watermark }));
      if (Ledger.can(user, 'owner')) {
      for (const sub of names) {
        if (!sub || pendingNow.includes(sub.id)) continue;
        const live = get(K.terms, {});
        if (live[/** @type {string} */ (sub.id)] && live[/** @type {string} */ (sub.id)].pending) continue;
        const rows = await readSpec({ collection: 'subcontractTerms', id: sub.id });
        const amount = rows[0] && rows[0].originalAmount;
        if (!Number.isInteger(amount) || amount <= 0) continue;
        const again = get(K.terms, {});
        if (again[/** @type {string} */ (sub.id)] && again[/** @type {string} */ (sub.id)].pending) continue;
        again[/** @type {string} */ (sub.id)] = { originalAmount: amount };
        set(K.terms, again);
      }
      }
      await forgetGoneProjects(user, result.missingProjectIds || [], readSpec);
    },
    /** @param {string} projectId */
    async deleteProject(projectId) {
      /** @param {string} col */
      const listIds = async col => {
        const snap = await fsMod.getDocsFromServer(fsMod.query(fsMod.collection(fdb, col), fsMod.where('projectId', '==', projectId)));
        return snap.docs.map(/** @param {{ id: string }} d */ d => d.id).filter(/** @param {string} id */ id => /^[A-Za-z0-9_-]{1,64}$/.test(id));
      };
      /** @param {readonly DeleteDoc[] | null | undefined} docs */
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
/** @type {Promise<unknown> | null} */
var flushing = null;
var deleteLock = false;
var lastSyncAt = 0;
var FLUSH_MS = 20000;
var flushRearm = 0;
/** @type {number | null} */
var flushSeenEpoch = null;
/** @type {ReturnType<typeof setTimeout> | null} */
var flushTimer = null;
function clearFlushSchedule() {
  flushRearm = 0;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
function syncFlushEpoch() {
  if (flushSeenEpoch === sessionEpoch) return;
  flushSeenEpoch = sessionEpoch;
  clearFlushSchedule();
}
/**
 * After projectFinance has been acknowledged. A legacy row is pending and has no integer.
 * Drop only that flag. Do not write, move, or remove an amount.
 * @param {string} id
 * @returns {boolean}
 */
function clearLegacyPending(id) {
  const fin = get(K.finance, {});
  const current = fin[id];
  if (!current || current.pending !== true || Number.isInteger(current.contractAmount)) return false;
  const next = Object.assign({}, current);
  delete next.pending;
  fin[id] = next;
  set(K.finance, fin);
  return true;
}
/**
 * @param {number} epoch
 */
function armFlushTail(epoch) {
  if (flushRearm >= 1 || flushTimer) return;
  flushRearm += 1;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    if (epoch !== sessionEpoch) {
      flushRearm = 0;
      return;
    }
    flushRemote();
  }, 0);
}
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
    parties: get(K.parties, []),
    agreements: get(K.agreements, []),
    accountTxns: get(K.accountTxns, []),
    statementApprovals: get(K.statementApprovals, []),
    laborReviews: get(K.laborReviews, []),
    slotLosers: get(K.slotLosers, {}) || {},
    linkRefusals: get(K.linkRefusals, {}) || {},
    finance: get(K.finance, {}) || {},
    terms: get(K.terms, {}) || {},
    outbox: get(K.outbox, []),
    syncErrors: get(K.syncErrors, {}) || {},
    statusPending: get(K.statusPending, []),
    goneProjectNames: get(K.goneProjectNames, {}) || {},
  };
}
/**
 * Live outbox and syncErrors, plus every kept id from before whose entry is on
 * a dropped project. An id queued after before was taken stays. The project
 * itself is not put back.
 * @param {DroppedProject} next
 * @param {LocalStore} before
 * @param {readonly string[]} liveOutbox
 * @param {Record<string, unknown>} liveErrors
 * @param {readonly SyncDoc[]} liveEntries
 */
function restoreKeptLines(next, before, liveOutbox, liveErrors, liveEntries) {
  const dropped = new Set((next.removed && next.removed.projectIds) || []);
  const beforeEntries = before.entries || [];
  /** @param {string} id */
  const onDropped = id => {
    const row = beforeEntries.find(entry => entry && entry.id === id);
    return !!(row && typeof row.projectId === 'string' && dropped.has(row.projectId));
  };
  const beforeOut = before.outbox || [];
  /** @type {string[]} */
  const outbox = (next.outbox || []).slice();
  liveOutbox.forEach(id => {
    if (beforeOut.indexOf(id) >= 0 || outbox.indexOf(id) >= 0) return;
    outbox.push(id);
  });
  beforeOut.forEach(id => {
    if (onDropped(id) && outbox.indexOf(id) < 0) outbox.push(id);
  });
  const beforeErrors = /** @type {Record<string, unknown>} */ (before.syncErrors || {});
  /** @type {Record<string, unknown>} */
  const syncErrors = Object.assign({}, next.syncErrors || {});
  Object.keys(beforeErrors).forEach(id => {
    if (onDropped(id) && !Object.prototype.hasOwnProperty.call(syncErrors, id)) syncErrors[id] = beforeErrors[id];
  });
  Object.keys(liveErrors).forEach(id => {
    if (Object.prototype.hasOwnProperty.call(beforeErrors, id)) return;
    if (!Object.prototype.hasOwnProperty.call(syncErrors, id)) syncErrors[id] = liveErrors[id];
  });
  const unionIds = new Set(outbox);
  Object.keys(syncErrors).forEach(id => { unionIds.add(id); });
  /** @type {{ id?: string, projectId?: string }[]} */
  const entries = [];
  (next.entries || []).forEach(row => { if (row) entries.push(row); });
  const have = new Set(entries.map(entry => entry && entry.id).filter(id => typeof id === 'string' && id));
  /** @param {SyncDoc | null | undefined} row */
  const add = row => {
    if (!row || typeof row.id !== 'string' || !row.id || have.has(row.id) || !unionIds.has(row.id)) return;
    entries.push(row);
    have.add(row.id);
  };
  beforeEntries.forEach(row => {
    if (row && typeof row.projectId === 'string' && dropped.has(row.projectId)) add(row);
  });
  liveEntries.forEach(add);
  set(K.outbox, outbox);
  set(K.syncErrors, syncErrors);
  set(K.entries, entries);
}
/**
 * @param {DroppedProject} next
 * @param {LocalStore | null | undefined} [before]
 * @returns {Promise<unknown>}
 */
function writeCache(next, before) {
  const liveOutbox = before ? /** @type {string[]} */ (get(K.outbox, []) || []).slice() : [];
  const liveErrors = before ? Object.assign({}, /** @type {Record<string, unknown>} */ (get(K.syncErrors, {}) || {})) : {};
  const liveEntries = before ? /** @type {SyncDoc[]} */ (get(K.entries, []) || []).slice() : [];
  set(K.entries, next.entries);
  set(K.projects, next.projects);
  set(K.subcontracts, next.subcontracts);
  set(K.amendments, next.amendments);
  set(K.foremen, next.foremen || []);
  set(K.foremanMoves, next.foremanMoves || []);
  set(K.parties, next.parties || []);
  set(K.agreements, next.agreements || []);
  set(K.accountTxns, next.accountTxns || []);
  set(K.statementApprovals, next.statementApprovals || []);
  set(K.laborReviews, next.laborReviews || []);
  set(K.slotLosers, next.slotLosers || {});
  set(K.linkRefusals, next.linkRefusals || {});
  set(K.finance, next.finance);
  set(K.terms, next.terms);
  set(K.outbox, next.outbox);
  set(K.syncErrors, next.syncErrors);
  set(K.statusPending, next.statusPending);
  const done = set(K.goneProjectNames, next.goneProjectNames || {});
  if (!before) return done;
  restoreKeptLines(next, before, liveOutbox, liveErrors, liveEntries);
  return deleteRemovedLocalIds(next.removed, before);
}
/**
 * @param {LedgerUser | null | undefined} user
 * @param {readonly string[] | null | undefined} missingIds
 * @param {(spec: ReadSpec) => Promise<readonly SyncDoc[]>} readSpec
 */
async function forgetGoneProjects(user, missingIds, readSpec) {
  const hold = new Set();
  get(K.projects, []).forEach(/** @param {SyncDoc | null | undefined} project */ project => {
    if (project && project.id && !project.createdAtServer && get(K.outbox, []).includes(project.id)) hold.add(project.id);
  });
  const gone = new Set((missingIds || []).filter(/** @param {string} id */ id => !hold.has(id)));
  if (Ledger.can(user, 'owner')) {
    for (const project of get(K.projects, [])) {
      if (!project || !project.id || hold.has(project.id) || gone.has(project.id)) continue;
      if (!project.createdAtServer) continue;
      const rows = await readSpec({ collection: 'projects', id: project.id });
      if (!rows.length) gone.add(project.id);
    }
  }
  for (const id of gone) {
    const before = cacheSnapshot();
    const next = window.Sync.dropProjectLocal(before, id, { dropPending: false });
    await writeCache(next, before);
  }
}
/** @param {any} err */
function isDeadAuth(err) { return !!(window.SyncStatus && SyncStatus.isDeadAuth(err)); }
/** @type {((projectId: string) => Promise<{ exists: () => boolean }>) | null} */
var projectDocRead = null;
/**
 * One server read of projects/{projectId}. Missing is { exists: false }.
 * permission-denied, a timeout, and any other non-dead error are null.
 * Dead auth still throws so the flush can abort.
 * @param {string} projectId
 * @param {{ readProjectDoc: (id: string) => Promise<{ exists: () => boolean }> }} client
 * @returns {Promise<ProjectProbe | null>}
 */
async function readProjectProbe(projectId, client) {
  try {
    const snap = projectDocRead
      ? await projectDocRead(projectId)
      : await client.readProjectDoc(projectId);
    return { exists: snap.exists() };
  } catch (err) {
    const failure = /** @type {SyncFailure} */ (err);
    if (isDeadAuth(failure)) throw failure;
    if (String(failure && failure.code) === 'permission-denied') return null;
    if (failure && (failure.timeout || (window.SyncStatus && SyncStatus.isTransient(failure)))) return null;
    return null;
  }
}
/** @param {boolean | undefined} signOutUser */
async function disposeFirebase(signOutUser) {
  const pending = fbPromise;
  fbPromise = null;
  flushing = null;
  clearFlushSchedule();
  // session.js owns this name. A load that has not run session.js still has to dispose.
  const epoch = /** @type {{ sessionEpoch?: number }} */ (globalThis).sessionEpoch;
  flushSeenEpoch = typeof epoch === 'number' ? epoch : null;
  const marked = signOutPending();
  if (!pending) return false;
  const fb = await pending.catch(() => null);
  if (!(fb && fb.dispose)) return false;
  const signedOut = await fb.dispose(!!signOutUser);
  if (signOutUser === true && signedOut === true) clearSignOutPending(marked);
  return signOutUser === true && signedOut === true;
}
/** @param {boolean | undefined} signOutUser */
async function rebuildFirebase(signOutUser) {
  await disposeFirebase(signOutUser);
  return ensureFirebase();
}
/**
 * @param {{ fromOutside?: boolean } | undefined} [opts]
 */
function flushRemote(opts) {
  syncFlushEpoch();
  if (opts && opts.fromOutside) flushRearm = 0;
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
  /** @type {() => void} */ (/** @type {unknown} */ (begin))();
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
/**
 * Adopted account rows and both loser maps land before either applyFlush.
 * @param {{ adopted?: { id: string, remote: SyncDoc }[], parked?: string[], slotLosers?: { key: string, doc: SyncDoc }[], linkRefusals?: { localId: string, doc: SyncDoc }[] } | null | undefined} result
 */
function commitAccountFlush(result) {
  if (!result) return;
  const adoptedRows = result.adopted || [];
  const parkedIds = result.parked || [];
  const losers = result.slotLosers || [];
  const refusals = result.linkRefusals || [];
  if (!adoptedRows.length && !parkedIds.length && !losers.length && !refusals.length) return;
  if (losers.length) {
    const map = Object.assign({}, get(K.slotLosers, {}) || {});
    losers.forEach(row => { if (row && row.key) map[row.key] = row.doc; });
    set(K.slotLosers, map);
  }
  if (refusals.length) {
    const map = Object.assign({}, get(K.linkRefusals, {}) || {});
    refusals.forEach(row => { if (row && row.localId) map[row.localId] = row.doc; });
    set(K.linkRefusals, map);
  }
  if (adoptedRows.length) {
    const byId = new Map(adoptedRows.map(row => [row.id, row.remote]));
    [[K.accountTxns, 'accountTxn'], [K.agreements, 'agreement'], [K.parties, 'party'], [K.statementApprovals, 'statementApproval'], [K.laborReviews, 'laborReview']].forEach(pair => {
      const key = /** @type {string} */ (pair[0]);
      const docType = /** @type {string} */ (pair[1]);
      const rows = /** @type {SyncDoc[]} */ (get(key, []));
      let changed = false;
      const next = rows.map(row => {
        if (!row || !row.id || !byId.has(row.id)) return row;
        changed = true;
        const remote = window.Sync.fromRemote(byId.get(row.id) || {});
        if (!remote.docType) remote.docType = /** @type {SyncDoc['docType']} */ (row.docType || docType);
        remote.id = row.id;
        byId.delete(row.id);
        return remote;
      });
      if (changed) set(key, next);
    });
  }
  if (parkedIds.length) {
    const drop = new Set(parkedIds);
    set(K.accountTxns, /** @type {SyncDoc[]} */ (get(K.accountTxns, [])).filter(row => row && !drop.has(/** @type {string} */ (row.id))));
  }
}
/**
 * @param {SyncDoc} local
 * @param {SyncDoc | null | undefined} remote
 */
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
/** @param {{ updateProjectStatus(id: string, status: string): Promise<unknown> }} fb */
async function flushProjectStatus(fb) {
  const pending = get(K.statusPending, []).slice();
  if (!pending.length) return;
  const left = [];
  let stopped = false;
  for (const id of pending) {
    if (stopped) { left.push(id); continue; }
    const project = get(K.projects, []).find(/** @param {SyncDoc} p */ p => p.id === id);
    if (!project || window.Sync.isSeed(project) || !project.createdAtServer) continue;
    if (project.status !== 'archived' && project.status !== 'active') continue;
    try {
      await fb.updateProjectStatus(id, project.status);
    } catch (err) {
      if (isDeadAuth(err)) throw err;
      const code = String((err && /** @type {{ code?: string, timeout?: boolean }} */ (err).code) || '');
      if (code === 'not-found') continue;
      left.push(id);
      if (err && (/** @type {{ code?: string, timeout?: boolean }} */ (err).timeout || (window.SyncStatus && SyncStatus.isTransient(err)))) stopped = true;
    }
  }
  set(K.statusPending, left);
  if (left.length) syncNotice = SEND_RETRY;
}
/**
 * @param {number} token
 * @param {Promise<unknown>} run
 */
async function performFlush(token, run) {
  /** @type {string[] | null | undefined} */
  let keptIds;
  let statusAtStart = null;
  /** @type {string[]} */
  let roundIds = [];
  /** Pending amount at the snapshot. A missing key was not pending. */
  /** @type {Map<string, number | undefined>} */
  const pendingAtStart = new Map();
  /** @type {{ failed?: { id?: string }[], kept?: string[] } | null} */
  let flushResult = null;
  /** @type {Map<string, number>} */
  const sentAmounts = new Map();
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
      if (err && (/** @type {{ code?: string, timeout?: boolean }} */ (err).timeout || (window.SyncStatus && SyncStatus.isTransient(err)))) {
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
      if (err && (/** @type {{ code?: string, timeout?: boolean }} */ (err).timeout || (window.SyncStatus && SyncStatus.isTransient(err)))) {
        syncNotice = get(K.outbox, []).length ? SEND_RETRY : PULL_RETRY;
        return;
      }
      throw err;
    }
    const ids = get(K.outbox, []).slice();
    roundIds = ids.slice();
    const financeThen = get(K.finance, {});
    const termsThen = get(K.terms, {});
    ids.forEach(/** @param {string} id */ id => {
      const fin = financeThen[id];
      const terms = termsThen[id];
      if (fin && fin.pending) pendingAtStart.set(id, fin.contractAmount);
      else if (terms && terms.pending) pendingAtStart.set(id, terms.originalAmount);
    });
    keptIds = [];
    if (ids.length) {
      const result = await window.Sync.flushOutbox({
        ids,
        load: id => window.Sync.localDoc(id, {
          entries: get(K.entries, []),
          projects: get(K.projects, []),
          subcontracts: get(K.subcontracts, []),
          amendments: get(K.amendments, []),
          foremen: get(K.foremen, []),
          foremanMoves: get(K.foremanMoves, []),
          parties: get(K.parties, []),
          agreements: get(K.agreements, []),
          accountTxns: get(K.accountTxns, []),
          statementApprovals: get(K.statementApprovals, []),
          laborReviews: get(K.laborReviews, []),
        }),
        write: async local => {
          const id = String((local && local.id) || '');
          const sent = await fb.writeLocal(local);
          if (typeof sent === 'number') sentAmounts.set(id, sent);
        },
        exists: local => fb.exists(local),
        projectProbe: local => readProjectProbe(String((local && local.projectId) || ''), fb),
        readDependency: id => fb.readDependency(id),
        mintId: () => {
          const mint = /** @type {{ uuid?: () => string }} */ (globalThis).uuid;
          return typeof mint === 'function' ? mint() : '';
        },
        readServer: async local => {
          try {
            if (typeof fb.readServer === 'function') return await fb.readServer(local);
            if (window.SyncStatus && fb.db) return await SyncStatus.readRemote(fb.db, /** @type {string} */ (window.Sync.collectionFor(local)), /** @type {string} */ (local.id));
          } catch (e) {
            if (isDeadAuth(e)) throw e;
          }
          return null;
        },
      });
      flushResult = result;
      if (token !== sessionEpoch) return;
      if (result.authDead) { await holdSession(SESSION_DEAD_MSG); return; }
      commitAccountFlush(result);
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
        set(K.entries, get(K.entries, []).map(/** @param {SyncDoc} entry */ entry => map.has(/** @type {string} */ (entry.id)) ? adoptEntry(entry, map.get(/** @type {string} */ (entry.id))) : entry));
      }
      if (window.SyncStatus) {
        const next = SyncStatus.applyFlush(get(K.outbox, []), get(K.syncErrors, {}), result);
        set(K.outbox, next.outbox);
        set(K.syncErrors, next.errors);
      } else set(K.outbox, get(K.outbox, []).filter(/** @param {string} id */ id => !(result.synced || []).includes(id) && !(result.failed || []).some(row => row && row.id === id)));
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
  // write, or an entry saved during the pull) is not in kept. One extra round.
  if (Array.isArray(keptIds) && token === sessionEpoch && navigator.onLine !== false && get(K.sessionUser)) {
    const failedIds = new Set((flushResult && flushResult.failed || []).map(row => row && row.id).filter(Boolean));
    const keptNow = new Set((flushResult && flushResult.kept) || keptIds);
    /** @type {string[]} */
    const refused = [];
    for (const id of roundIds) {
      // A contract typed during this flush was not pending at the snapshot, so this round did not try to send it.
      if (!pendingAtStart.has(id)) continue;
      if (failedIds.has(id) || keptNow.has(id) || sentAmounts.has(id)) continue;
      const fin = get(K.finance, {})[id];
      const terms = get(K.terms, {})[id];
      if (!(fin && fin.pending) && !(terms && terms.pending)) continue;
      const nowAmt = fin && fin.pending ? fin.contractAmount : terms.originalAmount;
      if (nowAmt !== pendingAtStart.get(id)) continue;
      refused.push(id);
    }
    if (refused.length && window.SyncStatus) {
      const errors = Object.assign({}, get(K.syncErrors, {}));
      const drop = new Set(refused);
      refused.forEach(id => { errors[id] = SyncStatus.REJECTED; });
      set(K.syncErrors, errors);
      set(K.outbox, get(K.outbox, []).filter(/** @param {string} id */ id => !drop.has(id)));
    }
    queuePendingFinance();
    queuePendingSubcontracts();
    const kept = new Set(keptIds);
    refused.forEach(id => failedIds.add(id));
    const started = new Set(Array.isArray(statusAtStart) ? statusAtStart : get(K.statusPending, []));
    const freshStatus = get(K.statusPending, []).some(/** @param {string} id */ id => !started.has(id));
    const round = new Set(roundIds);
    let arm = !!freshStatus;
    if (!arm) {
      for (const id of get(K.outbox, [])) {
        if (kept.has(id) || failedIds.has(id)) continue;
        if (!round.has(id)) { arm = true; break; }
        const fin = get(K.finance, {})[id];
        const terms = get(K.terms, {})[id];
        const pendingAmt = fin && fin.pending ? fin.contractAmount : (terms && terms.pending ? terms.originalAmount : undefined);
        if (pendingAmt !== undefined && sentAmounts.get(id) !== pendingAmt) { arm = true; break; }
      }
    }
    if (arm) armFlushTail(token);
  }
}

// Classic-script globals the other scripts call.
Object.assign(window, {
  fbPromise, flushing, deleteLock, lastSyncAt,
  ensureFirebase, rebuildFirebase, flushRemote, disposeFirebase, isDeadAuth, isImportFailure,
  cacheSnapshot, writeCache,
});
