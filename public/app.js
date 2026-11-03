'use strict';
// Boot, the demo seed, and the login timeout. Screens are render.js.
// Firebase is firebase-client.js. The device database and login are session.js.
// L and POLICY are the bindings render.js declares.
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
    } catch (e) { /* a failed local reopen falls through to Firebase */ }
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
          try { await disposeFirebase(true); } catch (e2) { /* the login message is already set */ }
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
              try { await disposeFirebase(true); } catch (e3) { /* the login message is already set */ }
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
      if (isDeadAuth(e)) { try { await disposeFirebase(true); } catch (e2) { /* the login message is already set */ } }
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
