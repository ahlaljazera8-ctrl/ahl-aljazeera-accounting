'use strict';
// IndexedDB "aj-p0" / "aj-u-<uid>" (stores: projects, entries, outbox, meta).
// Loaded into memory at boot; every write is persisted (write-through, serialized).
// Outbox = ids not sent yet (no syncState). Login and logout live here too.
var K = { projects:'projects', entries:'entries', outbox:'outbox', users:'users', finance:'projectFinance', subcontracts:'subcontracts', terms:'subcontractTerms', amendments:'subcontractAmendments', role:'role', device:'deviceId', seeded:'seeded', sessionUser:'sessionUser', syncErrors:'syncErrors', pullWatermark:'pullWatermark', statusPending:'statusPending' };
var LIST = { projects:1, entries:1, outbox:1 };
var cache = {};
var db, writing = Promise.resolve();
var sessionEpoch = 0;
var deviceId;
var directoryPromise = null;
var syncNotice = '';
var REPAIR_MSG = 'تعذر الدخول بعد إصلاح الذاكرة المحلية. تحقق من الاتصال وأعد المحاولة';
var SUSPENDED_MSG = 'هذا الحساب موقوف';
var SESSION_DEAD_MSG = 'انتهت الجلسة. سجّل الدخول من جديد';
var MISSING_PROFILE_MSG = 'لا يوجد ملف مستخدم. اطلب من المالك إنشاء الحساب';

function req(r) { return new Promise((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }); }
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
async function loadAll() {
  const tx = db.transaction(['projects','entries','outbox','meta'], 'readonly');
  cache.projects = await req(tx.objectStore('projects').getAll());
  cache.entries = (await req(tx.objectStore('entries').getAll())).sort((a, b) => a.createdAtDevice - b.createdAtDevice || (a.id < b.id ? -1 : 1));
  cache.outbox = (await req(tx.objectStore('outbox').getAll())).sort((a, b) => a.queuedAt - b.queuedAt).map(o => o.id);
  const ms = tx.objectStore('meta'); const keys = await req(ms.getAllKeys()); const vals = await req(ms.getAll());
  keys.forEach((k, i) => cache[k] = vals[i]);
}
function get(k, d) { return cache[k] === undefined ? d : JSON.parse(JSON.stringify(cache[k])); }
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
function uuid() { return crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2); }
function today() { return new Date().toISOString().slice(0, 10); }
function demoRole() { const r = new URLSearchParams(location.search).get('role'); return r === 'owner' || r === 'site' ? r : ''; }
function me() {
  if (!demoRole()) { const s = get(K.sessionUser, null); if (s && s.uid) return s; }
  const role = get(K.role, demoRole() || 'owner');
  return get(K.users, []).find(u => u.uid === (role === 'site' ? 'u-ahmed' : 'u-ameer'));
}
function $(s) { return document.querySelector(s); }
function markReady() { if (document.body) document.body.dataset.ready = '1'; }
function clearLoginForm() {
  const form = $('#login-form');
  if (form instanceof HTMLFormElement) form.reset();
  const email = $('#login-email');
  const password = $('#login-password');
  if (email instanceof HTMLInputElement) email.value = '';
  if (password instanceof HTMLInputElement) password.value = '';
}
function showLogin() { clearLoginForm(); const boot = $('#boot'); if (boot) boot.hidden = true; $('#login').hidden = false; $('#shell').hidden = true; markReady(); }
function showApp() { const boot = $('#boot'); if (boot) boot.hidden = true; $('#login').hidden = true; $('#shell').hidden = false; }
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
function showLoginMessage(message) {
  showLogin();
  const box = $('#login-msg');
  if (box) box.textContent = message || '';
}
// Leave the ledger on screen without deleting aj-u-*. A suspended account keeps
// the Firebase user so the next open can explain itself. A dead token is signed
// out so the login form can start clean. Queued entries stay in the outbox.
async function holdSession(message) {
  sessionEpoch += 1;
  syncNotice = '';
  try { await closeUserDb(); } catch (e) { /* the login message is shown even if the local database will not close */ }
  // A suspended profile stays signed in, so the next open can read users/{uid}
  // and explain. A dead refresh token is cleared or the login form cannot start.
  if (message === SESSION_DEAD_MSG) {
    try { await disposeFirebase(true); } catch (e) { /* signing out a dead token is best-effort; the message is already chosen */ }
  }
  showLoginMessage(message);
}
function releaseDb() {
  directoryPromise = null;
  if (db) { try { db.close(); } catch (e) { /* the handle is dropped on the next line either way */ } db = null; }
  for (const k of Object.keys(cache)) delete cache[k];
}
function usableProfile(profile, uid) {
  return !!(profile && profile.uid === uid && profile.active !== false && (Ledger.can(profile, 'owner') || profile.role === 'site'));
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
    } catch (e) { /* one unreadable aj-u database is skipped so the next name can be tried */ }
    releaseDb();
  }
  return null;
}
async function closeUserDb() {
  directoryPromise = null;
  if (db) {
    set(K.sessionUser, null);
    await writing.catch(() => {});
    try { db.close(); } catch (e) { /* the cache is cleared after this whether close throws or not */ }
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
var SHELL_FILES = { 'index.html':1, 'style.css':1, 'ledger.js':1, 'sync.js':1, 'sync-status.js':1, 'dom-safe.js':1, 'appcheck.js':1, 'firebase-config.js':1, 'session.js':1, 'app.js':1, 'manifest.json':1, 'icon.svg':1 };
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
  } catch (e) { /* logout still reaches the login message if a step throws */ }
  showLoginMessage(reason);
  return true;
}
async function openUserDb(uid) {
  if (db) { try { db.close(); } catch (e) { /* the previous connection is abandoned before the new open */ } db = null; }
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
// Classic-script globals app.js calls. The var and function bindings are already
// the same window properties; naming them here keeps the cross-file use visible.
Object.assign(window, {
  K, cache, db, writing, sessionEpoch, deviceId, directoryPromise, syncNotice,
  REPAIR_MSG, SUSPENDED_MSG, SESSION_DEAD_MSG, MISSING_PROFILE_MSG,
  get, set, openDB, loadAll, uuid, today, demoRole, me, $,
  showLogin, showApp, markReady, profileFrom, loginError, showLoginMessage,
  holdSession, localSession, openUserDb, enterSession, closeSession,
});
