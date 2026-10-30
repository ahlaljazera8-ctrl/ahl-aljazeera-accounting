'use strict';
// Storage: IndexedDB "aj-p0" (stores: projects, entries, outbox, meta). Loaded into memory at boot; every write is
// persisted to IndexedDB (write-through, serialized). "Server" is simulated; outbox = ids not sent yet (no syncState).
const L = window.Ledger, POLICY = L.DEFAULT_POLICY;
const K = { projects:'projects', entries:'entries', outbox:'outbox', users:'users', role:'role', device:'deviceId', seeded:'seeded' };
const LIST = { projects:1, entries:1, outbox:1 };
const cache = {};
let db, writing = Promise.resolve();
const req = r => new Promise((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
function openDB() {
  const r = indexedDB.open('aj-p0', 1);
  r.onupgradeneeded = () => { const d = r.result;
    d.createObjectStore('projects', { keyPath:'id' }); d.createObjectStore('entries', { keyPath:'id' });
    d.createObjectStore('outbox', { keyPath:'id' }); d.createObjectStore('meta'); };
  return req(r);
}
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
  writing = writing.then(() => new Promise((ok, no) => {
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
  const P = (id, name, clientName, contractAmount) => ({ id, name, clientName, location:'مثال', contractAmount, currency:'IQD', status:'active', createdAtDevice:t, createdAtServer:t, createdBy:'u-ameer', deviceId:'seed', isExample:true });
  const projects = [P('p-school','مشروع المدرسة','زبون مثال 1',60000000), P('p-road','مشروع الطريق','زبون مثال 2',20000000), P('p-market','بناية السوق','زبون مثال 3',15000000)];
  let n = 0;
  const E = (projectId, entryType, amount, description, by, extra = {}) => ({ id:'seed-' + (++n), projectId, direction:L.ENTRY_TYPES[entryType].direction, entryType, amount, currency:'IQD', entryDate:'2026-10-' + String(n).padStart(2,'0'), description: description + ' (مثال)', partyName:'', isReversal:false, createdAtDevice:t + n*1000, createdAtServer:t + n*1000, createdBy:by, deviceId:'seed', ...extra });
  const es = [
    E('p-school','clientPayment',40000000,'دفعة أولى','u-ameer'),
    E('p-school','materials',30000000,'حديد وإسمنت','u-ameer'),
    E('p-school','subcontractor',7200000,'مقاول كهرباء','u-ameer'),
    E('p-school','materials',50000,'إدخال خاطئ','u-ahmed'),
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
  set(K.users, users); set(K.projects, projects); set(K.entries, lg.all()); set(K.outbox, [pend1.id, pend2.id]); set(K.seeded, true);
}
const state = { type: 'materials', amount: 0, formId: uuid() };
const me = () => get(K.users, []).find(u => u.uid === (get(K.role, 'owner') === 'site' ? 'u-ahmed' : 'u-ameer'));
const ledger = () => L.createLedger(get(K.entries, []));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => `<b class="num">${L.fmt(n)} د.ع</b>`;
const $ = s => document.querySelector(s);

function commit(entry) {
  const lg = ledger();
  lg.append(entry, { user: me(), projects: get(K.projects, []), policy: POLICY });
  set(K.entries, lg.all()); set(K.outbox, [...get(K.outbox, []), entry.id]);
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
function entryRow(e, u, all) {
  const pending = get(K.outbox, []).includes(e.id);
  const reversed = all.some(x => x.isReversal && x.reversesEntryId === e.id);
  const canRev = !e.isReversal && !reversed && (u.role === 'owner' || (POLICY.siteCanReverseOwn && e.createdBy === u.uid));
  const cls = e.isReversal ? 'bad' : e.direction === 'income' ? 'ok' : '';
  return `<div class="entry"><div class="meta"><span>${esc(typeLabel(e))}</span><small>${esc(e.description)} · ${esc(e.entryDate)}</small>
    ${pending ? '<span class="pill warn" style="font-size:11px">لم يُرسل</span>' : ''}${reversed ? '<small>معكوس</small>' : ''}</div>
    <div class="meta" style="align-items:flex-end"><span class="num ${cls}">${L.fmt(e.amount * L.sign(e))}</span>
    ${canRev ? `<button class="mini" data-rev="${esc(e.id)}">عكس</button>` : ''}</div></div>`;
}

const views = {
  home() {
    const { u, projects, entries } = data(); const out = get(K.outbox, []).length;
    const sync = `<div class="card" style="background:#FFFBF4"><div class="pills" style="align-items:center"><span class="pill warn">${navigator.onLine ? 'متصل (محاكاة)' : 'بدون إنترنت'}</span><b style="font-size:14px">${out} قيود محفوظة على الهاتف</b></div><div class="note">لم تُرسل بعد. اضغط «إرسال الآن» للمحاكاة (لا يوجد خادم حقيقي).</div></div>`;
    const ex = '<div class="example">⚠️ بيانات مثال وليست حقيقية</div>';
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
      <div class="card"><div class="step">3 المشروع${u.role === 'site' ? ' (مشاريعي فقط)' : ''}</div><div class="pills">${projects.map(p => `<button class="pill ${p.id === state.projectId ? 'on' : ''}" data-proj="${p.id}">${esc(p.name)}</button>`).join('')}</div></div>
      <textarea id="desc" rows="2" placeholder="ملاحظة (اختياري)"></textarea>
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
      return `<a class="card proj" href="#project/${p.id}"><div class="kv"><h2>${esc(p.name)}</h2><span>‹</span></div>${line}</a>`;
    }).join('') + (u.role === 'owner' ? `<div class="note">الأرقام تشمل ما على هذا الجهاز فقط.</div><button class="btn ghost" id="newproj">+ مشروع جديد</button>` : '<div class="note">ترى فقط المشاريع المعيّنة لك.</div>');
  },
  project(id) {
    const { u, projects, entries } = data();
    const p = projects.find(x => x.id === id); if (!p) return '<div class="card">المشروع غير متاح</div>';
    const es = entries.filter(e => e.projectId === id); const s = L.projectSummary(u, es);
    const card = u.role === 'owner'
      ? `<div class="kv"><span>المقبوض</span>${money(s.received)}</div><div class="kv"><span>المصروف</span>${money(s.spent)}</div>
         <div class="kv"><span>الربح</span><span class="${s.profit < 0 ? 'bad' : 'ok'}">${money(s.profit)}</span></div><div class="note">الربح = المقبوض − المصروف</div>`
      : `<div class="kv"><span>المصروف</span>${money(s.spent)}</div>${Object.entries(s.byType).map(([k, v]) => `<div class="kv"><span>${L.ENTRY_TYPES[k].label}</span><b class="num">${L.fmt(v)}</b></div>`).join('')}`;
    return `<div class="card">${card}</div><div class="card"><h2>آخر القيود</h2>${es.slice().reverse().slice(0, 8).map(e => entryRow(e, u, es)).join('')}</div>
      <a class="btn" href="#entry/${p.id}">+ قيد لهذا المشروع</a>`;
  },
};
const titles = { home:'الرئيسية', entry:'قيد جديد', projects:'المشاريع', project:'' };

function render() {
  const u = me(); const [view, arg] = (location.hash.slice(1) || 'home').split('/');
  const v = views[view] ? view : 'home';
  $('#role').value = u.role;
  $('#who').textContent = u.role === 'owner' ? 'المالك · أمير' : 'مستخدم موقع · أحمد (مشرف)';
  $('#outbox').textContent = 'لم يُرسل بعد: ' + get(K.outbox, []).length;
  $('#title').textContent = v === 'project' ? ((data().projects.find(p => p.id === arg) || {}).name || 'مشروع') : (v === 'projects' && u.role === 'site' ? 'مشاريعي' : titles[v]);
  $('#main').innerHTML = views[v](arg);
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === (v === 'project' ? 'projects' : v)));
}

document.addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  const u = me();
  if (b.dataset.type) { state.type = b.dataset.type; render(); }
  else if (b.dataset.proj) { state.projectId = b.dataset.proj; render(); }
  else if (b.dataset.add != null) { state.amount = b.dataset.add === '0' ? 0 : state.amount + Number(b.dataset.add); render(); }
  else if (b.id === 'send') sendNow();
  else if (b.id === 'save') {
    b.disabled = true; // id generated once per form; double-tap cannot duplicate
    const desc = $('#desc').value.trim();
    const e = { id: state.formId, projectId: state.projectId, direction: L.ENTRY_TYPES[state.type].direction, entryType: state.type,
      amount: state.amount, currency: 'IQD', entryDate: today(), description: desc, partyName: '', isReversal: false,
      createdAtDevice: Date.now(), createdAtServer: null, createdBy: u.uid, deviceId };
    try { commit(e); state.amount = 0; state.formId = uuid(); render(); $('#msg').innerHTML = '<span class="pill warn">✓ حُفظ على الهاتف · لم يُرسل بعد</span>'; }
    catch (err) { b.disabled = false; $('#msg').innerHTML = `<span class="bad">${esc(err.message)}</span>`; }
  } else if (b.dataset.rev) {
    const all = get(K.entries, []); const orig = all.find(x => x.id === b.dataset.rev);
    const reason = prompt('سبب التصحيح:', 'خطأ في الإدخال'); if (!reason) return;
    try { commit(L.makeReversal(orig, { user: u, reason, now: Date.now(), deviceId, entryDate: today() })); render(); }
    catch (err) { alert(err.message); }
  } else if (b.id === 'csv') {
    if (!L.canExportCSV(u)) return;
    const blob = new Blob([L.toCSV(get(K.entries, []), get(K.projects, []))], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'aj-ledger-' + today() + '.csv'; a.click();
  } else if (b.id === 'newproj') {
    if (!L.canCreateProject(u)) return;
    const name = prompt('اسم المشروع:'); if (!name) return; const clientName = prompt('اسم الزبون:') || '';
    const p = { id: uuid(), name, clientName, location: '', currency: 'IQD', status: 'active', createdAtDevice: Date.now(), createdAtServer: null, createdBy: u.uid, deviceId };
    set(K.projects, [...get(K.projects, []), p]); set(K.outbox, [...get(K.outbox, []), p.id]); render();
  }
});
document.addEventListener('input', ev => { if (ev.target.id === 'amt') { state.amount = parseInt(ev.target.value.replace(/[^\d]/g, ''), 10) || 0; } });
$('#role').addEventListener('change', ev => { set(K.role, ev.target.value); render(); });
addEventListener('hashchange', render); addEventListener('online', render); addEventListener('offline', render);
(async () => {
  db = await openDB(); await loadAll();
  if (!get(K.device)) set(K.device, uuid()); deviceId = get(K.device);
  seed();
  const qs = new URLSearchParams(location.search); if (qs.get('role')) set(K.role, qs.get('role'));
  render(); document.body.dataset.ready = '1';
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().then(p => { window.AJ.persisted = p; }).catch(() => {});
})();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
