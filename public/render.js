'use strict';
// Screens and click handlers. Boot, seed, and the login timeout stay in app.js.
const L = window.Ledger, POLICY = L.DEFAULT_POLICY;
/**
 * @typedef {{
 *   type: string,
 *   amount: number,
 *   amountDraft: string,
 *   desc: string,
 *   party: string,
 *   subcontractId: string,
 *   foremanId: string,
 *   fmGone: string,
 *   fmCarry: boolean,
 *   entrySeen: boolean,
 *   dropForeman: boolean,
 *   formId: string,
 *   backStack: string[],
 *   listProject: string,
 *   listShown: number,
 *   formMsg: string,
 *   formMsgKind: string,
 *   personMsg: string,
 *   projectList: string,
 *   confirm: null | { id: string, action: string, step?: number, typed?: string, name?: string },
 *   deleteMsg: string,
 *   subName: string,
 *   subAmount: string,
 *   subWork: string,
 *   subMsg: string,
 *   subFormId: string,
 *   amDate: string,
 *   amAmount: string,
 *   amNote: string,
 *   amMsg: string,
 *   amFormId: string,
 *   projectId?: string,
 * }} ScreenState
 */
const state = /** @type {ScreenState} */ ({ type: 'materials', amount: 0, amountDraft: '', desc: '', party: '', subcontractId: '', foremanId: '', fmGone: '', fmCarry: false, entrySeen: false, dropForeman: false, formId: uuid(), backStack: [], listProject: '', listShown: 0, formMsg: '', formMsgKind: '', personMsg: '', projectList: 'open', confirm: null, deleteMsg: '', subName: '', subAmount: '', subWork: '', subMsg: '', subFormId: '', amDate: '', amAmount: '', amNote: '', amMsg: '', amFormId: '' });
const ENTRY_GONE_MSG = 'هذا المشروع لم يعد موجوداً. لم يُحفظ القيد، اختر مشروعاً ثم احفظ.';
const ENTRY_ARCHIVED_MSG = 'هذا المشروع مؤرشف. اختر مشروعاً مفتوحاً ثم احفظ.';
const ENTRY_UNASSIGNED_MSG = 'مشروع غير مسند';
const PROJECT_LINES_MSG = 'في هذا المشروع قيود لم تُرسل أو رُفض إرسالها. أرسلها أو صدّرها قبل الحذف.';
/** @type {string} */
let entryProjectBlocked = '';
/** @type {EntryProjectBlock} */
let entryProjectBlockKind = '';
/** @type {string | null} */
let pendingEntryId = null;
let bellOpen = false;
const ledger = () => L.createLedger(get(K.entries, []));
/** @param {any} s */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => /** @type {string} */ (({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
/** @param {any} n @param {any} [cls] */
const money = (n, cls) => `<b class="num${cls ? ' ' + cls : ''}">${L.fmt(n)} د.ع</b>`;
/** @param {any} kind @param {any} id */
function subHref(kind, id) {
  if (!window.DomSafe || !DomSafe.isSafeId(id)) return '#projects';
  if (kind !== 'sub' && kind !== 'subnew' && kind !== 'amend') return '#projects';
  return '#' + kind + '/' + DomSafe.projectAttr(id);
}
/** @param {any} projectId */
function subcontractsOf(projectId) {
  return get(K.subcontracts, []).filter(/** @param {any} s */ s => s.projectId === projectId);
}
/** @param {any} subId */
function amendmentsOf(subId) {
  return get(K.amendments, []).filter(/** @param {any} a */ a => a.subcontractId === subId).slice().sort(/** @param {any} a @param {any} b */ (a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : (a.id < b.id ? -1 : 1));
}
/** @param {any} sub @param {any} entries */
function subFigures(sub, entries) {
  const terms = (get(K.terms, {}) || {})[sub.id];
  if (!terms || !Number.isInteger(terms.originalAmount)) return null;
  return L.subcontractBalance(terms.originalAmount, get(K.amendments, []), entries, sub.id);
}
/** @param {any} sub @param {any} entries */
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
/**
 * Reads Accounts.CONTRACTOR_COST_START on each call. No stored copy.
 * @returns {boolean}
 */
function contractorCostDated() {
  const start = window.Accounts && Accounts.CONTRACTOR_COST_START;
  return typeof start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(start);
}
/** @param {any} project @param {any} entries */
function subcontractSection(project, entries) {
  const cards = subcontractsOf(project.id).map(/** @param {any} sub */ sub => subcontractCard(sub, entries)).join('');
  const anchor = contractorCostDated() ? '' : `
    <a class="btn ghost" href="${subHref('subnew', project.id)}">+ عقد مقاول</a>`;
  return `<div class="card" id="subcontracts"><h2>المقاولون</h2></div>${cards || '<div class="card"><div class="note">لا توجد عقود.</div></div>'}${anchor}`;
}
function accountStores() {
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
  };
}
/** @param {any} id */
function queueDoc(id) {
  if (window.Sync && typeof Sync.queueRefusal === 'function' && typeof Sync.localDoc === 'function') {
    if (Sync.queueRefusal(Sync.localDoc(id, accountStores()))) return;
  }
  const out = get(K.outbox, []);
  if (!out.includes(id)) set(K.outbox, out.concat([id]));
  if (!demoRole()) flushRemote({ fromOutside: true });
}
/**
 * Account-module ids that must be exported before logout.
 * @returns {{ id: string, doc: any, message: string }[]}
 */
function refusalDocs() {
  const errors = get(K.syncErrors, {}) || {};
  /** @type {{ id: string, doc: any, message: string }[]} */
  const rows = [];
  /** @param {any[] | null | undefined} list */
  const fromList = list => {
    (list || []).forEach(doc => {
      if (!doc || typeof doc.id !== 'string' || !doc.id || typeof errors[doc.id] !== 'string') return;
      rows.push({ id: doc.id, doc, message: errors[doc.id] });
    });
  };
  fromList(get(K.accountTxns, []));
  fromList(get(K.agreements, []));
  fromList(get(K.parties, []));
  fromList(get(K.statementApprovals, []));
  const losers = get(K.slotLosers, {}) || {};
  Object.keys(losers).forEach(key => {
    rows.push({ id: key, doc: losers[key] || {}, message: typeof errors[key] === 'string' ? errors[key] : SyncStatus.CONFLICT });
  });
  const links = get(K.linkRefusals, {}) || {};
  Object.keys(links).forEach(key => {
    rows.push({ id: key, doc: links[key] || {}, message: typeof errors[key] === 'string' ? errors[key] : SyncStatus.CONFLICT });
  });
  return rows;
}
/** @param {any} u @param {any} | null | undefined} button */
function saveSubcontract(u, button) {
  if (!L.can(u, 'owner')) return;
  const projectId = (location.hash.slice(1).split('/')[1]) || '';
  const project = get(K.projects, []).find(/** @param {any} p */ p => p.id === projectId);
  if (!project) return;
  if (button) button.disabled = true;
  const name = ($('#sub-name') && $('#sub-name').value || '').trim();
  const work = ($('#sub-work') && $('#sub-work').value || '').trim();
  const parsed = L.parseAmount($('#sub-amount') && $('#sub-amount').value);
  if (!name || name.length > 100) { state.subMsg = 'أدخل اسم المقاول'; if (button) button.disabled = false; render(); return; }
  if (work.length > 500) { state.subMsg = 'وصف العمل بحد أقصى 500 حرفاً'; if (button) button.disabled = false; render(); return; }
  if (!parsed.ok) { state.subMsg = /** @type {string} */ (parsed.error); if (button) button.disabled = false; render(); return; }
  const id = state.subFormId || uuid();
  const all = get(K.subcontracts, []);
  if (!all.some(/** @param {any} s */ s => s.id === id)) {
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
/** @param {any} s */
function dateOk(s) {
  return typeof s === 'string'
    && /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(s)
    && s >= '2000-01-01' && s <= '2100-12-31'
    && !/^[0-9]{4}-02-3[01]$/.test(s)
    && !/^[0-9]{4}-(04|06|09|11)-31$/.test(s);
}
/** @param {any} u @param {any} | null | undefined} button */
function saveAmendment(u, button) {
  if (!L.can(u, 'owner')) return;
  const subcontractId = (location.hash.slice(1).split('/')[1]) || '';
  const sub = get(K.subcontracts, []).find(/** @param {any} s */ s => s.id === subcontractId);
  if (!sub) return;
  if (button) button.disabled = true;
  const date = ($('#am-date') && $('#am-date').value || '').trim();
  const note = ($('#am-note') && $('#am-note').value || '').trim();
  const parsed = L.parseAmount($('#am-amount') && $('#am-amount').value);
  if (!dateOk(date)) { state.amMsg = 'التاريخ بصيغة YYYY-MM-DD'; if (button) button.disabled = false; render(); return; }
  if (!note || note.length > 200) { state.amMsg = 'أدخل البيان'; if (button) button.disabled = false; render(); return; }
  if (!parsed.ok) { state.amMsg = /** @type {string} */ (parsed.error); if (button) button.disabled = false; render(); return; }
  const id = state.amFormId || uuid();
  const all = get(K.amendments, []);
  if (!all.some(/** @param {any} a */ a => a.id === id)) {
    set(K.amendments, [...all, { id, subcontractId, projectId: sub.projectId, amount: parsed.amount, date, note, createdAtServer: null, createdBy: u.uid }]);
    queueDoc(id);
  }
  state.amFormId = '';
  state.amDate = ''; state.amAmount = ''; state.amNote = ''; state.amMsg = '';
  location.hash = subHref('sub', subcontractId);
}
/** @param {any} role */
const roleLabel = role => (L.can({ role: role }, 'owner') ? 'مالك' : 'مستخدم موقع');
/** @param {any} id @param {any} project */
function shownContract(id, project) {
  const fin = (get(K.finance, {}) || {})[id];
  if (fin && Number.isInteger(fin.contractAmount)) return fin.contractAmount;
  return window.Sync.contractAmountOf(project);
}
/** @param {any} project @param {any} on */
function assignBox(project, on) {
  const attr = window.DomSafe && DomSafe.projectAttr(project.id);
  if (!attr) return '';
  return '<label class="check"><input type="checkbox" data-assign="' + attr + '"' + (on ? ' checked' : '') + '>' + esc(project.name) + '</label>';
}
/** @param {any} person */
function personLink(person) {
  const attr = window.DomSafe && DomSafe.projectAttr(person.uid);
  const name = esc(person.displayName || person.uid);
  const meta = esc(roleLabel(person.role) + (person.active ? '' : ' · موقوف'));
  if (!attr) return '<div class="card"><h2>' + name + '</h2><span>' + meta + '</span></div>';
  return '<a class="card proj" href="#person/' + attr + '"><div class="kv"><h2>' + name + '</h2><span>‹</span></div><span>' + meta + '</span></a>';
}
const UID_HELP = 'الحساب يُنشأ في وحدة تحكم Firebase، لا من هذا التطبيق. المسار: Authentication ثم Users ثم عمود User UID. انسخ المعرّف والصقه هنا.';
/** @param {any} project */
function contractFields(project) {
  const amount = shownContract(project.id, project);
  const pay = window.AccountPayment;
  const value = amount === null ? '' : (pay && typeof pay.groupThousands === 'function' ? pay.groupThousands(String(amount)) : String(amount));
  return `<div class="kv"><span>قيمة العقد</span>${amount === null ? '<b>غير محددة</b>' : money(amount)}</div>
    <label class="field">تعديل قيمة العقد<input id="contract" class="full" inputmode="numeric" value="${esc(value)}"></label>
    <button type="button" class="btn ghost" id="save-contract">حفظ قيمة العقد</button>
    <div id="contract-msg" class="msg"></div>
    <div class="note">قيمة العقد لا تظهر لمستخدم الموقع. الحفظ ينقلها إلى سجل المالك ويمسحها من المشروع.</div>`;
}
/** @param {any} u */
function saveContract(u) {
  if (!L.can(u, 'owner')) return;
  const id = (location.hash.slice(1).split('/')[1]) || '';
  const project = get(K.projects, []).find(/** @param {any} p */ p => p.id === id);
  const msg = $('#contract-msg');
  if (!project) return;
  const raw = ($('#contract') && $('#contract').value || '').trim();
  if (!raw) { if (msg) msg.textContent = 'أدخل قيمة العقد'; return; }
  const parsed = L.parseAmount(raw, { allowZero: true });
  if (!parsed.ok) { if (msg) msg.textContent = parsed.error; return; }
  const amount = parsed.amount;
  const saved = window.Sync.splitProjectSave(project, amount);
  set(K.projects, get(K.projects, []).map(/** @param {any} p */ p => p.id === id ? saved.project : p));
  const fin = get(K.finance, {});
  fin[id] = { contractAmount: amount, pending: true };
  set(K.finance, fin);
  const out = get(K.outbox, []);
  if (!out.includes(id)) set(K.outbox, out.concat([id]));
  if (!demoRole()) flushRemote({ fromOutside: true });
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
    assignedProjectIds: /** @type {readonly string[]} */ (boxes),
  });
}
/** @param {any} value @param {any} | null | undefined} existing @param {any} editor */
function storePerson(value, existing, editor) {
  const row = {
    uid: value.uid, displayName: value.displayName, email: value.email, role: value.role, active: value.active,
    assignedProjectIds: value.assignedProjectIds.slice(),
    createdAtServer: existing && existing.createdAtServer ? existing.createdAtServer : Date.now(),
    createdBy: existing && existing.createdBy ? existing.createdBy : editor.uid,
  };
  set(K.users, get(K.users, []).filter(/** @param {any} x */ x => x.uid !== row.uid).concat([row]));
  if (!demoRole() && get(K.sessionUser, null) && get(K.sessionUser).uid === row.uid) {
    set(K.sessionUser, Object.assign({}, get(K.sessionUser), row));
  }
  return row;
}
/** @param {any} u */
async function savePerson(u) {
  if (!L.can(u, 'owner')) return;
  const btn = $('#save-person');
  const msg = $('#person-msg');
  const built = readPersonForm();
  if (!built.ok) { if (msg) msg.textContent = /** @type {string[]} */ (built.errors)[0]; return; }
  if (btn) btn.disabled = true;
  const existing = get(K.users, []).find(/** @param {any} x */ x => x.uid === /** @type {PersonValue} */ (built.value).uid);
  let saved = false;
  try {
    if (demoRole()) storePerson(/** @type {PersonValue} */ (built.value), existing, u);
    else {
      const fb = await ensureFirebase();
      await fb.saveUser(/** @type {PersonValue} */ (built.value).uid, /** @type {PersonValue} */ (built.value), existing);
      saved = true;
      /** @type {PeopleLoadResult | null} */
      let directory = null;
      try {
        directory = await ensureDirectory('save');
      } catch {
        storePerson(/** @type {PersonValue} */ (built.value), existing, u);
        location.hash = '#people';
        return;
      }
      const listed = get(K.users, []).find(/** @param {any} x */ x => x.uid === /** @type {PersonValue} */ (built.value).uid);
      const fresh = !listed || (directory && (directory.skipped || directory.stale)) ? storePerson(/** @type {PersonValue} */ (built.value), existing, u) : listed;
      if (get(K.sessionUser, null) && get(K.sessionUser).uid === /** @type {PersonValue} */ (built.value).uid) set(K.sessionUser, Object.assign({}, get(K.sessionUser), fresh));
    }
    location.hash = '#people';
  } catch {
    if (saved) {
      if (btn) btn.disabled = false;
      location.hash = '#people';
      return;
    }
    if (btn) btn.disabled = false;
    if (msg) msg.textContent = 'تعذر حفظ الشخص';
  }
}
function userRows() {
  const raw = get(K.users, []);
  return Array.isArray(raw) ? raw : [];
}
const peopleLoader = PeopleDir.createLoader({
  now: () => Date.now(),
  online: () => navigator.onLine !== false,
  timeoutMs: PeopleDir.TIMEOUT_MS,
  timeout: (p, ms) => withTimeout(p, ms, 'الأشخاص'),
  load: () => ensureFirebase().then(fb => fb.listUsers()),
  read: () => userRows(),
  write: rows => { set(K.users, rows || []); },
  stamp: ms => { set(K.peopleSynced, ms); },
});
let peopleUid = '';
/** @param {any} [reason] */
function ensureDirectory(reason) {
  if (demoRole()) return Promise.resolve({ skipped: 'demo', changed: false });
  const session = /** @type {{ uid?: string } | null} */ (get(K.sessionUser, null));
  const uid = session && session.uid ? session.uid : '';
  if (uid !== peopleUid) {
    peopleLoader.reset();
    peopleUid = uid;
  }
  return peopleLoader.run(reason || 'render');
}
function peopleViewOpen() {
  const view = (location.hash.slice(1) || 'home').split('/')[0];
  return view === 'people' || view === 'person';
}
function peopleNote() {
  const stamp = Number(get(K.peopleSynced, 0));
  const when = Number.isFinite(stamp) && stamp > 0 ? formatSyncTime(stamp) : '—';
  const lead = PeopleDir.syncNoteLead(navigator.onLine === false, peopleLoader.failed());
  return '<p class="note" id="people-sync">' + esc(lead) + ' · آخر تحديث: <bdi class="num">' + esc(when) + '</bdi></p>';
}
/** @param {any} inner */
function peopleFrame(inner) {
  const list = userRows();
  const stamp = Number(get(K.peopleSynced, 0));
  const view = PeopleDir.directoryView(list.length, Number.isFinite(stamp) && stamp > 0 ? stamp : 0, navigator.onLine === false, peopleLoader.failed());
  const retry = '<button type="button" class="btn" id="people-retry">' + esc(PeopleDir.RETRY_LABEL) + '</button>';
  if (view === 'error') return '<div class="card" id="people-error"><p>' + esc(PeopleDir.LOAD_ERROR) + '</p>' + retry + '</div>';
  if (view === 'retry') return peopleNote() + retry + inner;
  if (view === 'note') return peopleNote() + inner;
  return inner;
}
/** @param {any} reason */
function refreshDirectory(reason) {
  if (demoRole()) return;
  const u = me();
  if (!u || !L.can(u, 'owner')) return;
  const banner = !!(document.querySelector('#people-sync') || document.querySelector('#people-error'));
  ensureDirectory(reason).then(r => {
    if (PeopleDir.shouldRedraw(r, banner) && peopleViewOpen()) render();
  }).catch(() => {
    if (peopleViewOpen()) render();
  });
}

/** @param {any} entry */
function commit(entry) {
  const lg = ledger();
  lg.append(entry, { user: me(), projects: get(K.projects, []), policy: POLICY, subcontracts: get(K.subcontracts, []), foremen: get(K.foremen, []) });
  set(K.entries, lg.all()); set(K.outbox, [...get(K.outbox, []), entry.id]);
  if (!demoRole()) flushRemote({ fromOutside: true });
}
function sendNow() { // fake sync: stamp server time, drain outbox. Re-sending the same id is a no-op.
  const out = new Set(get(K.outbox, [])); if (!out.size) return;
  const now = Date.now();
  set(K.entries, get(K.entries, []).map(/** @param {any} e */ e => out.has(e.id) && !e.createdAtServer ? { ...e, createdAtServer: now } : e));
  set(K.projects, get(K.projects, []).map(/** @param {any} p */ p => out.has(p.id) && !p.createdAtServer ? { ...p, createdAtServer: now } : p));
  set(K.subcontracts, get(K.subcontracts, []).map(/** @param {any} s */ s => out.has(s.id) && !s.createdAtServer ? Object.assign({}, s, { createdAtServer: now }) : s));
  set(K.amendments, get(K.amendments, []).map(/** @param {any} a */ a => out.has(a.id) && !a.createdAtServer ? Object.assign({}, a, { createdAtServer: now }) : a));
  set(K.foremen, get(K.foremen, []).map(/** @param {any} f */ f => out.has(f.id) && !f.createdAtServer ? Object.assign({}, f, { createdAtServer: now }) : f));
  set(K.foremanMoves, get(K.foremanMoves, []).map(/** @param {any} m */ m => out.has(m.id) && !m.createdAtServer ? Object.assign({}, m, { createdAtServer: now }) : m));
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

/** @param {any} entries */
function counts(entries) {
  return L.countedEntries(entries, get(K.syncErrors, {}) || {});
}
function data() {
  const u = me(), projects = get(K.projects, []), entries = get(K.entries, []);
  return { u, projects: L.visibleProjects(u, projects, POLICY), entries: L.visibleEntries(u, entries, projects, POLICY), allProjects: projects };
}
/** @param {any} e */
const typeLabel = e => (e.isReversal ? 'تصحيح (قيد عكسي) · ' : '') + L.ENTRY_TYPES[e.entryType].label;
/** @param {any} id */
const entryHref = id => (window.DomSafe ? DomSafe.entryHref(id) : '#home');
/** @param {any} id */
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
  const entry = get(K.entries, []).find(/** @param {any} e */ e => e.id === id);
  if (!entry) return null;
  const ctx = { projects: get(K.projects, []), entries: get(K.entries, []), finance: get(K.finance, {}), policy: POLICY, syncErrors: get(K.syncErrors, {}) || {} };
  const fields = L.entryExportFields(u, entry, ctx);
  if (!fields) return null;
  const safe = String(entry.id).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64) || 'entry';
  return { fields, csv: L.entryToCSV(u, entry, ctx), filename: 'aj-entry-' + safe + '.csv' };
}
/** @param {any} fields */
function fillPrintRoot(fields) {
  const root = $('#print-root');
  if (!root) return;
  const company = fields.find(/** @param {any} f */ f => f.key === 'company');
  const ltrKeys = { amount: 1, entryDate: 1, recordedAt: 1, id: 1 };
  const rows = fields.filter(/** @param {any} f */ f => f.key !== 'company').map(/** @param {any} f */ f => {
    const cls = f.key === 'amount' ? ' class="print-amount-row"' : '';
    const num = /** @type {Record<string, number>} */ (ltrKeys)[f.key] ? ' class="num" dir="ltr"' : '';
    return `<tr${cls}><th scope="row">${esc(f.label)}</th><td${num}>${esc(f.value)}</td></tr>`;
  }).join('');
  root.innerHTML = `<article class="print-sheet" dir="rtl" lang="ar">
    <p class="print-kicker">قيد محاسبي</p>
    <h1>${esc(company ? company.value : 'أهل الجزيرة')}</h1>
    <table><tbody>${rows}</tbody></table>
    <p class="print-foot">وثيقة للطباعة من حسابات أهل الجزيرة</p>
  </article>`;
}
/** @param {any} csv @param {any} filename */
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
  setTimeout(() => { try { URL.revokeObjectURL(url); } catch (err) { /* the file was already handed to the browser */ } }, 2000);
}
/** @param {any} csv @param {any} filename */
function saveEntryFile(csv, filename) {
  const file = new File([csv], filename, { type: 'text/csv' });
  const payload = { files: [file], title: 'قيد أهل الجزيرة' };
  let can;
  try {
    can = !!(/** @type {Navigator['share'] | undefined} */ (navigator.share) && typeof navigator.canShare === 'function' && navigator.canShare(payload));
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
      if (err && /** @type {{ name?: string }} */ (err).name === 'AbortError') return;
    }
  }
  downloadCsv(csv, filename);
}
/**
 * No title. The click calls this with no earlier await, and share runs before this function's first await.
 * One share carries every file. A failed share downloads them in order.
 * @param {readonly { csv: string, filename: string }[]} list
 * @returns {Promise<'shared' | 'downloaded' | 'aborted'>}
 */
function saveCsvFiles(list) {
  /** @type {File[]} */
  const files = [];
  for (let i = 0; i < list.length; i++) files.push(new File([list[i].csv], list[i].filename, { type: 'text/csv' }));
  const payload = { files };
  let can;
  try {
    can = !!(/** @type {Navigator['share'] | undefined} */ (navigator.share) && typeof navigator.canShare === 'function' && navigator.canShare(payload));
  } catch (err) { can = false; }
  /** @returns {'downloaded'} */
  const downloadAll = () => {
    for (let i = 0; i < list.length; i++) downloadCsv(list[i].csv, list[i].filename);
    return /** @type {'downloaded'} */ ('downloaded');
  };
  if (can) {
    try {
      const pending = navigator.share(payload);
      return Promise.resolve(pending).then(() => /** @type {'shared'} */ ('shared'), err => {
        if (err && err.name === 'AbortError') return /** @type {'aborted'} */ ('aborted');
        return downloadAll();
      });
    } catch (err) {
      if (err && /** @type {{ name?: string }} */ (err).name === 'AbortError') return Promise.resolve(/** @type {'aborted'} */ ('aborted'));
      return Promise.resolve(downloadAll());
    }
  }
  return Promise.resolve(downloadAll());
}
/**
 * @param {string} csv
 * @param {string} filename
 * @returns {Promise<'shared' | 'downloaded' | 'aborted'>}
 */
function saveCsvFile(csv, filename) {
  return saveCsvFiles([{ csv, filename }]);
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
/** @param {any} projectId */
function shownEntryCount(projectId) {
  if (state.listProject !== projectId) {
    state.listProject = projectId;
    state.listShown = L.PROJECT_ENTRY_PAGE;
  }
  return state.listShown || L.PROJECT_ENTRY_PAGE;
}
/** @param {any} row */
function entryListRow(row) {
  const status = row.reversalStatus ? `<small>${esc(row.reversalStatus)}</small>` : '';
  const cls = row.reversalStatus === 'قيد عكسي' ? 'bad' : '';
  return `<div class="entry"><a class="entry-open" href="${entryHref(row.id)}"><div class="meta"><span>${esc(row.type)}</span><small class="num">${esc(row.entryDate)}</small><small>${esc(row.recorder)}</small><small>${esc(row.party)}</small>${status}</div><span class="num ${cls}">${esc(row.amount)}</span></a></div>`;
}
/** @param {any} e @param {any} u @param {any} all */
function entryRow(e, u, all) {
  const reversed = all.some(/** @param {any} x */ x => x.isReversal && x.reversesEntryId === e.id);
  const canRev = !e.isReversal && !reversed && (L.can(u, 'owner') || (POLICY.siteCanReverseOwn && e.createdBy === u.uid));
  const cls = e.isReversal ? 'bad' : e.direction === 'income' ? 'ok' : '';
  const badge = window.SyncStatus
    ? SyncStatus.badgeHtml(e.id, get(K.outbox, []), get(K.syncErrors, {}))
    : (get(K.outbox, []).includes(e.id) ? '<span class="pill warn" style="font-size:11px">لم يُرسل</span>' : '');
  return `<div class="entry"><a class="entry-open" href="${entryHref(e.id)}"><div class="meta"><span>${esc(typeLabel(e))}</span><small>${esc(e.description)} · ${esc(e.entryDate)}</small><small>${esc(L.displayRecorder(e))}</small>
    ${badge}${reversed ? '<small>معكوس</small>' : ''}</div>
    <span class="num ${cls}">${L.fmt(/** @type {number} */ (e.amount) * L.sign(e))}</span></a>
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
/** @param {LedgerUser | null | undefined} u */
function rejectedRows(u) {
  return L.deletedProjectEntries(u, get(K.entries, []), get(K.syncErrors, {}) || {}, SyncStatus.PROJECT_DELETED);
}
/** @param {LedgerUser | null | undefined} u */
function rejectedHomeLink(u) {
  const rows = rejectedRows(u);
  if (!rows.length) return '';
  return `<a class="btn ghost" id="rejected-link" href="#rejected">${esc(SyncStatus.PROJECT_DELETED)} ${rows.length}</a>`;
}
function rejectedLogoutBlock() {
  /** @type {{ id: string }[]} */
  const listed = [];
  rejectedRows(me()).forEach(row => { if (typeof row.id === 'string' && row.id) listed.push({ id: row.id }); });
  refusalDocs().forEach(row => { if (row.id) listed.push({ id: row.id }); });
  return L.rejectedLogoutBlocked(listed, get(K.rejectedExportedIds, []) || []);
}
/** @param {LedgerUser | null | undefined} u */
function rejectedExportText(u) {
  const ledgerRows = rejectedRows(u);
  const extra = refusalDocs();
  const errors = Object.assign({}, get(K.syncErrors, {}) || {});
  const shaped = extra.map(row => {
    const doc = row.doc || {};
    errors[row.id] = row.message;
    const people = /** @type {{ id?: string, name?: string }[]} */ (get(K.parties, []) || []);
    const person = people.find(item => item && item.id && item.id === doc.partyId);
    const partyName = person && typeof person.name === 'string' && person.name
      ? person.name
      : (typeof doc.name === 'string' ? doc.name : '');
    return {
      id: row.id,
      entryDate: typeof doc.txnDate === 'string' ? doc.txnDate : '',
      projectId: doc.projectId || '',
      amount: doc.amount,
      currency: doc.currency || '',
      description: doc.description || doc.purpose || doc.kind || '',
      partyName,
      createdBy: doc.createdBy,
      createdByName: doc.createdByName,
      createdAtDevice: doc.createdAtDevice,
    };
  });
  return L.rejectedEntriesToCSV(ledgerRows.concat(shaped), get(K.projects, []), get(K.goneProjectNames, {}) || {}, errors);
}
/**
 * Owner spent for one project. Owned by public/render.js. Not exported.
 * legacy is Ledger.totals of the counted entries for this project.
 * The last argument is Accounts.CONTRACTOR_COST_START.
 * While that constant is null, the return is legacy.
 * @param {string} projectId
 * @param {readonly object[]} entries
 * @returns {number}
 */
function ownerSpent(projectId, entries) {
  const errs = get(K.syncErrors, {}) || {};
  const counted = L.countedEntries(/** @type {readonly LedgerEntry[]} */ (entries), errs).filter(e => e.projectId === projectId);
  const legacy = L.totals(counted).spent;
  if (!window.Accounts || typeof Accounts.projectCost !== 'function') return legacy;
  const txns = get(K.accountTxns, []);
  return Accounts.projectCost(projectId, legacy, txns, errs, Accounts.CONTRACTOR_COST_START);
}
const views = {
  home() {
    const { u, projects, entries } = data();
    const sync = `<div class="card" style="background:#FFFBF4"><div class="pills" style="align-items:center"><span class="pill warn">${connectionLabel()}</span></div></div>`;
    const ex = (demoRole() || get(K.entries, []).some(/** @param {any} e */ e => e.isExample)) ? '<div class="example">⚠️ بيانات مثال وليست حقيقية</div>' : '';
    if (L.can(u, 'owner')) {
      const t = L.totals(counts(entries));
      const spent = projects.reduce((sum, p) => sum + (typeof p.id === 'string' ? ownerSpent(p.id, entries) : 0), 0);
      const profit = /** @type {number} */ (t.received) - spent;
      return ex + sync + `<div class="card"><h2>ملخص كل المشاريع</h2>
        <div class="kv"><span>إجمالي المقبوض</span>${money(t.received)}</div>
        <div class="kv"><span>إجمالي المصروف</span>${money(spent)}</div>
        <div class="kv"><span>صافي الربح</span><span class="${profit < 0 ? 'bad' : 'ok'}">${money(profit)}</span></div></div>
        ${rejectedHomeLink(u)}
        <a class="btn" href="#entry">+ قيد جديد</a><button class="btn ghost" id="csv">تصدير نسخة (CSV)</button>`;
    }
    const mine = entries.filter(e => e.createdBy === u.uid).slice(-3).reverse();
    return ex + sync + `<div class="card"><h2>مشاريعي (${projects.length})</h2>${projects.map(p => {
        const s = counts(entries.filter(e => e.projectId === p.id && e.entryDate === today()));
        return `<div class="kv"><span>${esc(p.name)}</span><b>مصروف اليوم: <span class="num">${L.fmt(L.totals(s).spent)}</span></b></div>`; }).join('')}</div>
      <div class="card"><h2>آخر قيودي</h2>${mine.map(e => entryRow(e, u, entries)).join('') || '<div class="note">لا يوجد</div>'}</div>
      ${rejectedHomeLink(u)}
      <a class="btn" href="#entry">+ قيد جديد</a>`;
  },
  /** @param {any} [pid] */
  entry(pid) {
    const { u } = data();
    const projects = L.projectList(u, get(K.projects, []), POLICY, 'open');
    const types = Object.entries(L.ENTRY_TYPES).filter(([k, t]) => {
      if (k === 'subcontractor') return L.can(u, 'owner') || u.role === 'site';
      return L.can(u, 'owner') || t.direction === 'expense' || POLICY.siteCanCreateClientPayment;
    });
    if (!types.some(([k]) => k === state.type)) state.type = types[0][0];
    /** @type {string[]} */
    const openIds = [];
    projects.forEach(p => { if (p && typeof p.id === 'string') openIds.push(p.id); });
    const stored = /** @type {LedgerProject[]} */ (get(K.projects, []) || []);
    const choice = bindEntryProject(entryHashOnce(), openIds, stored);
    void pid;
    const subsHere = subcontractsOf(state.projectId);
    if (state.type === 'subcontractor' && !subsHere.some(/** @param {any} s */ s => s.id === state.subcontractId)) state.subcontractId = (subsHere[0] && subsHere[0].id) || '';
    if (state.fmGone && state.foremanId) {
      const person = get(K.foremen, []).find(/** @param {any} f */ f => f && f.id === state.foremanId);
      const open = person && get(K.projects, []).find(/** @param {any} p */ p => p && p.id === person.projectId && p.status !== 'archived');
      if (open) state.fmGone = '';
    }
    const foremanBlock = L.can(u, 'owner') && L.ENTRY_TYPES[state.type] && L.ENTRY_TYPES[state.type].direction === 'expense'
      ? '<label class="field">من عهدة (اختياري)<select id="foreman" class="full"><option value="">—</option>'
        + get(K.foremen, []).map(/** @param {any} f */ f => {
          if (!f || !window.DomSafe || !DomSafe.isSafeId(f.id)) return '';
          return '<option value="' + DomSafe.projectAttr(f.id) + '"' + (f.id === state.foremanId ? ' selected' : '') + '>' + esc(f.name || f.id) + '</option>';
        }).join('') + '</select></label>' + (state.fmGone ? '<div class="warnbox">' + esc(state.fmGone) + '</div>' : '')
      : '';
    const partyBlock = state.type === 'subcontractor'
      ? `<label class="field">المقاول
          <select id="subcontract" class="full">${subsHere.map(/** @param {any} s */ s => `<option value="${esc(s.id)}"${s.id === state.subcontractId ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select>
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
      ${foremanBlock}
      <button class="btn" id="save"${choice.blocked ? ' disabled' : ''}>حفظ</button><div id="msg" class="msg">${state.formMsgKind === 'saved' ? '<span class="pill warn">✓ حُفظ على الهاتف · لم يُرسل بعد</span>' : esc(state.formMsg || '')}</div>
      <div class="note msg">لا يمكن تعديل القيد أو حذفه بعد الحفظ.</div>`;
  },
  projects() {
    const { u, entries } = data();
    const list = L.can(u, 'owner') && state.projectList === 'archived' ? 'archived' : 'open';
    const projects = L.projectList(u, get(K.projects, []), POLICY, list);
    const filter = L.can(u, 'owner')
      ? `<div class="pills" id="project-filter"><button type="button" class="pill${list === 'open' ? ' on' : ''}" data-list="open">المشاريع</button><button type="button" class="pill${list === 'archived' ? ' on' : ''}" data-list="archived">المؤرشفة</button></div>`
      : '';
    const cards = list === 'archived'
      ? (projects.map(p => {
        const href = window.DomSafe ? DomSafe.projectHref('project', p.id) : '#projects';
        return `<div class="card"><a class="proj" href="${href}"><h2>${esc(p.name)}</h2></a><button type="button" class="btn ghost" data-restore="${esc(p.id)}">استعادة</button></div>`;
      }).join('') || '<div class="note">لا توجد مشاريع مؤرشفة</div>')
      : projects.map(p => {
        const s = L.projectSummary(u, counts(entries.filter(e => e.projectId === p.id)));
        let line = `<div class="kv"><span>المصروف</span>${money(s.spent)}</div>`;
        if (L.can(u, 'owner')) {
          const profit = /** @type {number} */ (s.received) - ownerSpent(/** @type {string} */ (p.id), entries);
          line = `<div class="kv"><span>${profit < 0 ? 'خسارة' : 'ربح'}</span><span class="${profit < 0 ? 'bad' : 'ok'}">${money(Math.abs(profit))}</span></div>`;
        }
        return `<a class="card proj" href="${window.DomSafe ? DomSafe.projectHref('project', p.id) : '#projects'}"><div class="kv"><h2>${esc(p.name)}</h2><span>‹</span></div>${line}</a>`;
      }).join('');
    const tail = list === 'archived' ? '' : (L.can(u, 'owner') ? `<div class="note">الأرقام تشمل ما على هذا الجهاز فقط.</div><button class="btn ghost" id="newproj">+ مشروع جديد</button>` : '<div class="note">ترى فقط المشاريع المعيّنة لك.</div>');
    return filter + cards + tail;
  },
  /** @param {any} id */
  project(id) {
    const { u, projects, entries } = data();
    const p = projects.find(x => x.id === id); if (!p) return '<div class="card">المشروع غير متاح</div>';
    const es = entries.filter(e => e.projectId === id); const s = L.projectSummary(u, counts(es));
    let card = `<div class="kv"><span>المصروف</span>${money(s.spent)}</div>${Object.entries(s.byType).map(([k, v]) => `<div class="kv"><span>${L.ENTRY_TYPES[k].label}</span><b class="num">${L.fmt(v)}</b></div>`).join('')}`;
    if (L.can(u, 'owner')) {
      const spent = ownerSpent(id, entries);
      const profit = /** @type {number} */ (s.received) - spent;
      card = `${contractFields(p)}<div class="kv"><span>المقبوض</span>${money(s.received)}</div><div class="kv"><span>المصروف</span>${money(spent)}</div>
         <div class="kv"><span>الربح</span><span class="${profit < 0 ? 'bad' : 'ok'}">${money(profit)}</span></div><div class="note">الربح = المقبوض − المصروف</div>`;
    }
    const allHref = window.DomSafe ? DomSafe.projectHref('entries', p.id) : '#projects';
    const subs = L.can(u, 'owner') ? subcontractSection(p, counts(es)) : '';
    const deleteNote = state.deleteMsg ? `<p class="delete-msg">${esc(state.deleteMsg)}</p>` : '';
    const manage = L.can(u, 'manageProject')
      ? `<section class="project-manage" id="project-manage"><button type="button" class="btn ghost" id="manage-project">إدارة المشروع</button>${deleteNote}</section>`
      : '';
    return `<div class="card">${card}</div>${subs}<div class="card"><h2>آخر القيود</h2>${es.slice().reverse().slice(0, 8).map(e => entryRow(e, u, es)).join('')}</div>
      <a class="btn ghost" id="all-entries" href="${allHref}">عرض جميع القيود</a>
      <a class="btn" href="${window.DomSafe ? DomSafe.projectHref('entry', p.id) : '#projects'}">+ قيد لهذا المشروع</a>${manage}`;
  },
  // Local cache only. projectEntryList reads nothing from Firestore; «المزيد»
  // reveals the next 50 rows already stored for this project.
  /** @param {any} id */
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
    if (!L.can(u, 'owner')) return '<div class="card">هذه الشاشة للمالك.</div>';
    const rows = userRows().map(personLink).join('');
    return peopleFrame(`<div class="card"><p class="note">${esc(UID_HELP)}</p></div>${rows}<a class="btn" href="#person">إضافة شخص</a>`);
  },
  /** @param {any} [uid] */
  person(uid) {
    const u = me();
    if (!L.can(u, 'owner')) return '<div class="card">هذه الشاشة للمالك.</div>';
    if (uid && !(window.DomSafe && DomSafe.isSafeId(uid))) return '<div class="card">معرّف غير صالح</div>';
    const existing = uid ? userRows().find(x => x.uid === uid) : null;
    const person = existing || { uid: uid || '', displayName: '', email: '', role: 'site', active: true, assignedProjectIds: [] };
    const projects = get(K.projects, []);
    const boxes = projects.map(/** @param {any} p */ p => assignBox(p, (person.assignedProjectIds || []).includes(p.id))).join('');
    const locked = uid ? ' readonly' : '';
    return peopleFrame(`<div class="card"><p class="note">${esc(UID_HELP)}</p>
      <label class="field">معرّف المستخدم (User UID)<input id="person-uid" class="full" maxlength="64" autocomplete="off" value="${esc(person.uid)}"${locked}></label>
      <label class="field">الاسم<input id="person-name" class="full" maxlength="80" value="${esc(person.displayName)}"></label>
      <label class="field">البريد<input id="person-email" class="full" maxlength="200" value="${esc(person.email)}"></label>
      <label class="field">الدور<select id="person-role" class="full"><option value="site"${person.role === 'site' ? ' selected' : ''}>مستخدم موقع</option><option value="owner"${L.can(person, 'owner') ? ' selected' : ''}>مالك</option></select></label>
      <label class="check"><input id="person-active" type="checkbox"${person.active ? ' checked' : ''}>الحساب نشط</label>
      <div class="step">المشاريع</div>
      <p class="note">اختر كل مشروع بالاسم. التعيين يقتصر على المشاريع المحددة.</p>
      ${boxes || '<div class="note">لا توجد مشاريع بعد.</div>'}
      <button type="button" class="btn" id="save-person">حفظ</button>
      <div id="person-msg" class="msg">${esc(state.personMsg || '')}</div></div>`);
  },
  /** @param {any} id */
  detail(id) {
    const { projects, entries } = data();
    const back = `<button type="button" class="mini" id="back">رجوع</button>`;
    const e = entries.find(x => x.id === id);
    if (!e) return back + '<div class="card">القيد غير متاح</div>';
    const project = projects.find(p => p.id === e.projectId);
    const reversal = !e.isReversal && entries.find(x => x.isReversal && x.reversesEntryId === e.id);
    const original = e.isReversal ? entries.find(x => x.id === e.reversesEntryId) : null;
    /** @param {any} row @param {any} label */
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
      <div class="kv"><span>المبلغ</span><b class="num ${cls}">${L.fmt(/** @type {number} */ (e.amount) * L.sign(e))} د.ع</b></div>
      <div class="kv"><span>المشروع</span><b>${esc(project ? project.name : '—')}</b></div>
      <div class="kv"><span>التاريخ</span><b>${esc(e.entryDate || '—')}</b></div>
      <div class="kv"><span>الوصف</span><b>${esc(e.description || '—')}</b></div>
      <div class="kv"><span>الجهة</span><b>${esc(e.partyName || '—')}</b></div>
      <div class="kv"><span>سجّله</span><b>${esc(L.displayRecorder(e))}</b></div>
      <div class="kv"><span>الإرسال</span><b>${esc(syncText(e.id))}</b></div>
      ${linked}</div>
      ${(get(K.syncErrors, {}) || {})[/** @type {string} */ (e.id)] ? '' : `<div class="export-actions">
        <button type="button" class="btn ghost" id="entry-print">طباعة</button>
        <button type="button" class="btn ghost" id="entry-pdf">حفظ PDF</button>
        <button type="button" class="btn ghost" id="entry-file">حفظ كملف</button>
      </div>`}`;
  },
  /** @param {any} id */
  sub(id) {
    const u = me();
    if (!L.can(u, 'owner')) return '<div class="card">هذه الشاشة للمالك.</div>';
    const sub = get(K.subcontracts, []).find(/** @param {any} s */ s => s.id === id);
    if (!sub) return '<div class="card">العقد غير متاح</div>';
    const entries = counts(get(K.entries, []).filter(/** @param {any} e */ e => e.projectId === sub.projectId));
    const fig = subFigures(sub, entries);
    const agreed = fig ? fig.agreed : null;
    const warn = fig && fig.over ? `<div class="warnbox">المدفوع أكبر من المتفق عليه بـ ${L.fmt(fig.paid - fig.agreed)} د.ع. تنبيه فقط، ولا يمنع تسجيل دفعة.</div>` : '';
    const badge = fig && fig.settled ? '<span class="pill ok">مسدّد بالكامل</span>' : '';
    const remainCls = fig && fig.over ? 'bad' : (fig && fig.settled ? 'ok' : '');
    const terms = (get(K.terms, {}) || {})[sub.id];
    const original = terms && Number.isInteger(terms.originalAmount) ? money(terms.originalAmount) : '<b>غير متاح</b>';
    const amRows = amendmentsOf(sub.id).map(/** @param {any} a */ a => `<div class="kv"><span><span class="num">${esc(a.date)}</span> ${esc(a.note)}</span><b class="num">+${L.fmt(a.amount)}</b></div>`).join('') || '<div class="note">لا ملاحق.</div>';
    const payRows = entries.filter(e => e.entryType === 'subcontractor' && e.subcontractId === sub.id).slice().sort((a, b) => /** @type {string} */ (a.entryDate) < /** @type {string} */ (b.entryDate) ? -1 : 1).map(e => `<div class="kv"><span><span class="num">${esc(e.entryDate)}</span> ${esc(e.description || '—')}</span><b class="num">${L.fmt(/** @type {number} */ (e.amount) * L.sign(e))}</b></div>`).join('') || '<div class="note">لا دفعات.</div>';
    const loose = entries.filter(e => e.entryType === 'subcontractor' && !e.subcontractId);
    const looseRows = loose.map(e => `<div class="entry"><div class="meta"><span>${esc(e.description || '—')}</span><small class="num">${esc(e.entryDate)}</small></div><span class="pill">غير مرتبط</span><b class="num">${L.fmt(/** @type {number} */ (e.amount) * L.sign(e))}</b></div>`).join('') || '<div class="note">لا قيود سابقة بلا عقد.</div>';
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
  /** @param {any} projectId */
  subnew(projectId) {
    const u = me();
    if (!L.can(u, 'owner')) return '<div class="card">هذه الشاشة للمالك.</div>';
    const project = get(K.projects, []).find(/** @param {any} p */ p => p.id === projectId);
    if (!project) return '<div class="card">المشروع غير متاح</div>';
    if (contractorCostDated()) {
      const work = window.AccountWork;
      const line = work && work.pendingAmeer ? work.pendingAmeer.newContract : '';
      return `<button type="button" class="mini" id="back-project">رجوع</button>
      <div class="card">
        <div class="step">${esc(project.name)}</div>
        <div class="note">${esc(line)}</div>
      </div>`;
    }
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
  /** @param {any} id */
  amend(id) {
    const u = me();
    if (!L.can(u, 'owner')) return '<div class="card">هذه الشاشة للمالك.</div>';
    const sub = get(K.subcontracts, []).find(/** @param {any} s */ s => s.id === id);
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
  rejected() {
    const u = me();
    const back = `<button type="button" class="mini" id="back">رجوع</button>`;
    const rows = rejectedRows(u);
    const extra = refusalDocs();
    if (!rows.length && !extra.length) return back + '<div class="card">لا قيود مرفوضة بسبب حذف مشروع</div>';
    const projects = get(K.projects, []);
    const gone = get(K.goneProjectNames, {}) || {};
    const errors = get(K.syncErrors, {}) || {};
    const cards = rows.map(e => {
      const dir = e.direction === 'income' ? 'مقبوض' : 'مصروف';
      const kind = L.ENTRY_TYPES[/** @type {string} */ (e.entryType)];
      const label = kind ? kind.label : '';
      return `<div class="card"><h2>${esc(L.rememberedProjectName(String(e.projectId || ''), projects, gone))}</h2>
        <div>${esc(dir)} · ${esc(label)} · ${esc(e.entryDate || '')}</div>
        ${money(e.amount)}
        <div>${esc(errors[/** @type {string} */ (e.id)] || '')}</div></div>`;
    }).join('');
    /** @type {Record<string, number>} */
    const sums = { expense: 0, income: 0 };
    rows.forEach(e => {
      const n = typeof e.amount === 'number' ? e.amount : 0;
      if (e.direction === 'income') sums.income += n;
      else if (e.direction === 'expense') sums.expense += n;
    });
    const sumLines = [];
    if (sums.expense) sumLines.push(`<div class="kv"><span>مصروف</span>${money(sums.expense)}</div>`);
    if (sums.income) sumLines.push(`<div class="kv"><span>مقبوض</span>${money(sums.income)}</div>`);
    const button = (rows.length || extra.length) && L.canExportRejected(u) ? '<button type="button" class="btn" id="rejected-csv">تصدير القيود المرفوضة</button>' : '';
    return `${back}<div class="card"><h2>${esc(SyncStatus.PROJECT_DELETED)}</h2></div>${cards}
      <div class="card"><div id="rejected-count">${rows.length}</div>${sumLines.join('')}
      <p>هذه المبالغ غير محسوبة بأرصدة المشاريع</p>${button}</div>`;
  },
};
const titles = { home:'الرئيسية', entry:'قيد جديد', projects:'المشاريع', project:'', entries:'كل القيود', detail:'تفاصيل القيد', people:'الأشخاص', person:'شخص', sub:'عقد مقاول', subnew:'عقد مقاول', amend:'ملحق', rejected:'رُفض الإرسال لأن المشروع محذوف' };

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
/** @param {any} u */
function syncPeopleTab(u) {
  const tabs = document.querySelector('.tabs');
  if (!tabs) return;
  /** @type {HTMLAnchorElement | null} */
  let a = /** @type {HTMLAnchorElement | null} */ (tabs.querySelector('[data-tab="people"]'));
  if (!L.can(u, 'owner')) { if (a) a.remove(); return; }
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
function foremanGlyph() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const circle = document.createElementNS(ns, 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '8');
  circle.setAttribute('r', '3');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M5.2 19.2c1.2-2.7 3.6-4 6.8-4s5.6 1.3 6.8 4');
  svg.append(circle, path);
  return svg;
}
/** @param {any} u */
function syncForemenTab(u) {
  const tabs = document.querySelector('.tabs');
  if (!tabs) return;
  /** @type {HTMLAnchorElement | null} */
  let a = /** @type {HTMLAnchorElement | null} */ (tabs.querySelector('[data-tab="foremen"]'));
  if (!L.can(u, 'owner')) { if (a) a.remove(); return; }
  if (!a) {
    a = document.createElement('a');
    a.href = '#foremen';
    a.dataset.tab = 'foremen';
    const span = document.createElement('span');
    span.textContent = 'العُهد';
    a.append(foremanGlyph(), span);
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
  const foremanPick = $('#foreman'); if (foremanPick) state.foremanId = foremanPick.value;
  const typed = $('#delete-name');
  if (typed && state.confirm && state.confirm.action === 'delete') state.confirm.typed = typed.value;
}
/** @param {any} inner @param {any} [labelId] */
function confirmShell(inner, labelId) {
  const labelled = labelId ? ' aria-labelledby="' + String(labelId).replace(/[^A-Za-z0-9_-]/g, '') + '"' : '';
  return '<div class="confirm-back" id="confirm-dialog" role="dialog" aria-modal="true"' + labelled + '><div class="confirm">' + inner + '</div></div>';
}
/** @param {any} projectId */
function foremanExpenseBlock(projectId) {
  return L.guardedForemanDelete(L.foremanDeleteBlock, projectId, get(K.entries, []), get(K.foremen, []), get(K.syncErrors, {}) || {});
}
/**
 * @param {string} projectId
 * @param {EntryProjectBlock} blocked
 * @param {readonly { id?: string }[]} stored
 */
function entryBlockSentence(projectId, blocked, stored) {
  if (blocked === 'archived') return ENTRY_ARCHIVED_MSG;
  const row = stored.find(p => p && p.id === projectId);
  if (row) return ENTRY_UNASSIGNED_MSG;
  return ENTRY_GONE_MSG;
}
/** @returns {string} */
function entryIdFromHash() {
  const parts = (location.hash || '').slice(1).split('/');
  if (parts[0] !== 'entry') return '';
  return parts[1] || '';
}
/**
 * The #entry/<id> hash is read once per hashchange. A later repaint does not
 * pass it again, so a pill tap stays. A hash change does not clear a block.
 * @returns {string}
 */
function entryHashOnce() {
  if (pendingEntryId === null) pendingEntryId = entryIdFromHash();
  const id = pendingEntryId;
  pendingEntryId = '';
  return id;
}
/**
 * The hash is not a choice after a block. Only a project pill changes state.projectId.
 * @param {string | undefined} pid
 * @param {readonly string[]} openIds
 * @param {readonly LedgerProject[]} stored
 * @returns {EntryProjectChoice}
 */
function bindEntryProject(pid, openIds, stored) {
  const sameBlock = !!(entryProjectBlocked && (state.projectId || '') === entryProjectBlocked);
  /** @type {EntryProjectChoice} */
  let choice;
  if (sameBlock) {
    choice = L.entryProjectChoice({ currentId: entryProjectBlocked, openIds, stored });
    if (!choice.blocked) choice = { projectId: entryProjectBlocked, blocked: entryProjectBlockKind || 'missing' };
  } else {
    choice = L.entryProjectChoice({
      requestedId: entryProjectBlocked ? '' : (pid || ''),
      currentId: state.projectId || '',
      openIds,
      stored,
    });
  }
  state.projectId = choice.projectId;
  if (choice.blocked) {
    entryProjectBlocked = choice.projectId;
    entryProjectBlockKind = choice.blocked;
    state.formMsg = entryBlockSentence(choice.projectId, choice.blocked, stored);
    state.formMsgKind = 'error';
  } else {
    entryProjectBlocked = '';
    entryProjectBlockKind = '';
    if (state.formMsg === ENTRY_GONE_MSG || state.formMsg === ENTRY_ARCHIVED_MSG || state.formMsg === ENTRY_UNASSIGNED_MSG) {
      state.formMsg = '';
      state.formMsgKind = '';
    }
  }
  return choice;
}
/** @param {string} id */
function projectLinesBlock(id) {
  const outbox = /** @type {string[]} */ (get(K.outbox, []) || []);
  const errors = /** @type {Record<string, unknown>} */ (get(K.syncErrors, {}) || {});
  const entries = /** @type {{ id?: string, projectId?: string }[]} */ (get(K.entries, []) || []);
  for (const row of entries) {
    if (!row || row.projectId !== id || typeof row.id !== 'string' || !row.id) continue;
    if (outbox.indexOf(row.id) >= 0 || errors[row.id]) return PROJECT_LINES_MSG;
  }
  return '';
}
/** @param {string} id */
function projectDeleteBlock(id) {
  return (
    projectLinesBlock(id) ||
    foremanExpenseBlock(id) ||
    L.personProjectDeleteBlock(
      id,
      get(K.accountTxns, []),
      get(K.parties, []),
      get(K.syncErrors, {}) || {},
      window.Accounts && Accounts.balances,
    )
  );
}
/** @param {any}} c */
function deleteConfirm(c) {
  const project = get(K.projects, []).find(/** @param {any} p */ p => p.id === c.id);
  const name = project ? project.name : '';
  const block = projectDeleteBlock(c.id);
  if (block) {
    return confirmShell('<p>لا يمكن حذف هذا المشروع</p><p class="copy">' + esc(block) + '</p><button type="button" class="btn danger" id="confirm-yes" disabled>نعم</button><button type="button" class="btn ghost" id="confirm-no">إلغاء</button>');
  }
  if (c.step === 2) {
    const typed = c.typed || '';
    const ready = window.Sync.exactProjectName(typed, name);
    return confirmShell(`<p>اكتب اسم المشروع كما هو لتأكيد الحذف</p><p class="copy"><b>${esc(name)}</b></p><label class="field">اسم المشروع<input id="delete-name" class="full" autocomplete="off" value="${esc(typed)}"></label><p class="copy bad">الحذف نهائي. لا توجد نسخة احتياطية يُعتمد عليها.</p><button type="button" class="btn danger" id="confirm-delete"${ready ? '' : ' disabled'}>حذف نهائياً</button><button type="button" class="btn ghost" id="confirm-no">إلغاء</button>`);
  }
  return confirmShell(`<p>حذف هذا المشروع نهائياً؟</p><p class="copy">يُحذف المشروع وكل ما فيه. كل القيود، بما فيها الدفعات وقيود «مقاول»، ومالية المشروع، وعقود المقاولين وشروطها وملاحقها.</p><p class="copy">القيود التي لم تُرسل بعد على أي هاتف (صندوق الإرسال عند مستخدمي الموقع) قد تُفقد أو يُرفض إرسالها.</p><p class="copy bad">الحذف نهائي. لا توجد نسخة احتياطية يُعتمد عليها.</p><button type="button" class="btn danger" id="confirm-yes">نعم</button><button type="button" class="btn ghost" id="confirm-no">إلغاء</button>`);
}
/** @param {any}} c */
function manageChoice(c) {
  const project = get(K.projects, []).find(/** @param {any} p */ p => p.id === c.id);
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
/** @param {any} id @param {any} before */
function rememberProjectStatus(id, before) {
  if (!before || !before.createdAtServer) {
    const out = get(K.outbox, []);
    if (!out.includes(id)) set(K.outbox, out.concat([id]));
    return;
  }
  const pending = get(K.statusPending, []);
  if (!pending.includes(id)) set(K.statusPending, pending.concat([id]));
}
/** @param {any} action @param {any} id */
function commitProjectStatus(action, id) {
  const u = me();
  const projects = get(K.projects, []);
  const project = projects.find(/** @param {any} p */ p => p.id === id);
  const status = L.nextProjectStatus(u, project, action);
  if (!status) return false;
  set(K.projects, projects.map(/** @param {any} p */ p => p.id === id ? Object.assign({}, p, { status }) : p));
  if (!demoRole()) rememberProjectStatus(id, project);
  return true;
}
/** @param {any} action @param {any} id */
function openConfirm(action, id) {
  const project = get(K.projects, []).find(/** @param {any} p */ p => p.id === id);
  if (!L.nextProjectStatus(me(), project, action)) return;
  state.confirm = { id, action };
  render();
}
/** @param {any} id */
async function deleteProjectNow(id) {
  const u = me();
  const project = get(K.projects, []).find(/** @param {any} p */ p => p.id === id);
  if (!L.can(u, 'manageProject') || !project) return;
  const block = projectDeleteBlock(id);
  if (block) { state.deleteMsg = block; render(); return; }
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
    const before = cacheSnapshot();
    const next = window.Sync.dropProjectLocal(before, id, { dropPending: true });
    await writeCache(next, before);
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
/** @param {any}} c */
function finishConfirm(c) {
  const ok = commitProjectStatus(c.action, c.id);
  if (!ok) { render(); return; }
  if (c.action === 'archive') {
    state.projectList = 'open';
    if (location.hash !== '#projects') { location.hash = '#projects'; }
    else render();
  } else render();
  if (!demoRole()) flushRemote({ fromOutside: true });
}
function lastSyncMillis() {
  if (lastSyncAt) return lastSyncAt;
  const mark = get(K.pullWatermark, null) || {};
  return Math.max(Number(mark.entries) || 0, Number(mark.projects) || 0);
}
/** @param {any} ms */
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
/** @param {any} text @param {any} [kind] */
function setFormMsg(text, kind) {
  state.formMsg = text || '';
  state.formMsgKind = kind || (text ? 'error' : '');
  const box = $('#msg');
  if (!box) return;
  if (state.formMsgKind === 'saved') box.innerHTML = '<span class="pill warn">✓ حُفظ على الهاتف · لم يُرسل بعد</span>';
  else box.textContent = state.formMsg;
}
function renderScreen() {
  captureForm();
  if (state.dropForeman) {
    state.foremanId = '';
    state.fmGone = '';
    state.dropForeman = false;
  }
  const u = me(); if (!u) return;
  const printRoot = $('#print-root');
  if (printRoot) printRoot.innerHTML = '';
  const [view, arg] = (location.hash.slice(1) || 'home').split('/');
  const v = /** @type {Record<string, (arg?: string) => string>} */ (views)[view] ? view : 'home';
  if (v === 'entry') {
    if (!state.entrySeen && !state.fmCarry) {
      state.foremanId = '';
      state.fmGone = '';
    }
    state.fmCarry = false;
    state.entrySeen = true;
  } else state.entrySeen = false;
  if (v !== 'entry') { state.formMsg = ''; state.formMsgKind = ''; state.fmGone = ''; }
  if (v !== 'person') state.personMsg = '';
  if (!L.can(u, 'owner')) { state.confirm = null; state.projectList = 'open'; }
  if (state.confirm && (state.confirm.action === 'manage' || state.confirm.action === 'delete' || state.confirm.action === 'archive') && v !== 'project') state.confirm = null;
  if (v !== 'project') state.deleteMsg = '';
  if (v !== 'subnew') state.subMsg = '';
  if (v !== 'amend') state.amMsg = '';
  $('#role').value = u.role;
  $('#role-label').hidden = !demoRole();
  $('#logout').hidden = !!demoRole();
  $('#who').textContent = demoRole()
    ? (L.can(u, 'owner') ? 'المالك · أمير' : 'مستخدم موقع · أحمد (مشرف)')
    : ((L.can(u, 'owner') ? 'المالك' : 'مستخدم موقع') + ' · ' + (u.displayName || ''));
  paintBell();
  syncPeopleTab(u);
  syncForemenTab(u);
  if (window.AccountsView) AccountsView.syncTab(u);
  if (window.AccountWork && window.AccountWork.syncTab) window.AccountWork.syncTab(u);
  const foremanTab = v === 'foremen' || v === 'foreman' || v === 'foremannew' || v === 'foremanmove';
  const accountsTab = v === 'accounts' || v === 'account';
  const tab = accountsTab ? 'accounts' : foremanTab ? 'foremen' : (v === 'project' || v === 'entries' || v === 'sub' || v === 'subnew' || v === 'amend') ? 'projects' : (v === 'person' ? 'people' : v);
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  const projectTitle = (data().projects.find(p => p.id === arg) || {}).name || (v === 'entries' ? 'القيود' : 'مشروع');
  let heading = (v === 'project' || v === 'entries') ? projectTitle : (v === 'projects' && u.role === 'site' ? 'مشاريعي' : /** @type {Record<string, string>} */ (titles)[v]);
  if (v === 'sub' || v === 'amend') {
    const found = get(K.subcontracts, []).find(/** @param {any} s */ s => s.id === arg);
    heading = found ? found.name : 'عقد مقاول';
  } else if (v === 'subnew') heading = arg && projectTitle !== 'مشروع' ? projectTitle : 'عقد مقاول';
  if (v === 'foreman' || v === 'foremanmove') {
    const person = get(K.foremen, []).find(/** @param {any} f */ f => f && f.id === arg);
    heading = person && person.name ? person.name : 'خلفة';
  } else if (v === 'foremen') heading = 'العُهد';
  else if (v === 'foremannew') heading = 'خلفة جديد';
  if (v === 'accounts') heading = 'حسابات';
  if (v === 'account') {
    const people = get(K.parties, []);
    const person = Array.isArray(people) ? people.find(/** @param {any} p */ p => p && p.id === arg) : null;
    heading = person && person.name ? person.name : 'حسابات';
  }
  if (v === 'rejected' && !rejectedRows(u).length && !refusalDocs().length) heading = 'لا قيود مرفوضة بسبب حذف مشروع';
  $('#title').textContent = heading;
  $('#main').innerHTML = /** @type {Record<string, (arg?: string) => string>} */ (views)[v](arg) + confirmDialog();
  if (!demoRole() && L.can(u, 'owner') && (v === 'people' || v === 'person')) refreshDirectory('render');
}
function render() {
  try { renderScreen(); }
  catch {
    const main = $('#main');
    if (!main) return;
    main.textContent = '';
    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'render-error';
    card.textContent = PeopleDir.RENDER_ERROR;
    main.appendChild(card);
  }
}

document.addEventListener('click', ev => {
  if (bellOpen && !/** @type {Element} */ (ev.target).closest('.bell-wrap')) { bellOpen = false; paintBell(); }
  if (/** @type {Element} */ (ev.target).closest && /** @type {Element} */ (ev.target).closest('#confirm-dialog') && !/** @type {Element} */ (ev.target).closest('.confirm')) {
    if (location.hash.indexOf('#foremanmove/') === 0) {
      const moveId = location.hash.slice(1).split('/')[1] || '';
      location.hash = window.DomSafe && DomSafe.isSafeId(moveId) ? '#foreman/' + DomSafe.projectAttr(moveId) : '#foremen';
      return;
    }
    state.confirm = null;
    render();
    return;
  }
  const revBtn = /** @type {Element} */ (ev.target).closest('[data-rev]');
  const open = !revBtn && /** @type {Element} */ (ev.target).closest('a.entry-open, a.detail-link');
  if (open && $('#login').hidden) state.backStack.push(location.hash || '#home');
  const b = /** @type {Element} */ (ev.target).closest('button'); if (!b) return;
  if (!$('#login').hidden) return;
  const u = me();
  if (window.AccountsView && AccountsView.onClick(/** @type {HTMLButtonElement} */ (b))) return;
  if (window.ForemenUI && ForemenUI.onClick(/** @type {HTMLButtonElement} */ (b))) return;
  if (b.dataset.type) { state.type = b.dataset.type; render(); }
  else if (b.dataset.proj) {
    entryProjectBlocked = '';
    entryProjectBlockKind = '';
    state.projectId = b.dataset.proj;
    render();
  }
  else if (b.dataset.add != null) {
    const amtEl = $('#amt');
    const parsed = L.parseAmount(amtEl ? amtEl.value : '');
    const base = /** @type {number} */ (parsed.ok ? parsed.amount : 0);
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
  else if (b.id === 'bell-send') { if (demoRole()) sendNow(); else flushRemote({ fromOutside: true }); }
  else if (b.id === 'logout') {
    peopleLoader.reset();
    peopleUid = '';
    closeSession(rejectedLogoutBlock).then(ok => { if (ok) showLogin(); }).catch(() => { if (!db) showLogin(); });
  }
  else if (b.id === 'back') { location.hash = state.backStack.pop() || '#home'; }
  else if (b.id === 'back-sub') {
    const parts = location.hash.slice(1).split('/');
    const id = parts[1] || '';
    if (parts[0] === 'amend' && id) { location.hash = subHref('sub', id); return; }
    const sub = get(K.subcontracts, []).find(/** @param {any} s */ s => s.id === id);
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
    const openNow = L.projectList(u, get(K.projects, []), POLICY, 'open');
    /** @type {string[]} */
    const openNowIds = [];
    openNow.forEach(p => { if (p && typeof p.id === 'string') openNowIds.push(p.id); });
    const storedNow = /** @type {LedgerProject[]} */ (get(K.projects, []) || []);
    const gate = L.entryProjectChoice({ currentId: state.projectId || '', openIds: openNowIds, stored: storedNow });
    if (gate.blocked) {
      setFormMsg(entryBlockSentence(gate.projectId, gate.blocked, storedNow), 'error');
      return;
    }
    const desc = $('#desc').value.trim();
    let party = ($('#party') && $('#party').value || '').trim();
    let subcontractId = '';
    if (state.type === 'subcontractor') {
      if (!u || (!L.can(u, 'owner') && u.role !== 'site')) { b.disabled = false; setFormMsg('تسجيل دفعة المقاول غير مسموح', 'error'); return; }
      subcontractId = ($('#subcontract') && $('#subcontract').value) || '';
      const chosen = subcontractsOf(state.projectId).find(/** @param {any} s */ s => s.id === subcontractId);
      if (!chosen) { b.disabled = false; setFormMsg('اختر مقاولاً من هذا المشروع', 'error'); return; }
      party = chosen.name;
    }
    const parsed = L.parseAmount($('#amt') && $('#amt').value);
    if (!parsed.ok) { b.disabled = false; setFormMsg(parsed.error, 'error'); return; }
    const e = /** @type {LedgerEntry} */ ({ id: state.formId, projectId: state.projectId, direction: L.ENTRY_TYPES[state.type].direction, entryType: state.type,
      amount: parsed.amount, currency: 'IQD', entryDate: today(), description: desc, partyName: party, isReversal: false,
      createdAtDevice: Date.now(), createdAtServer: null, createdBy: u.uid, deviceId });
    if (subcontractId) e.subcontractId = subcontractId;
    const foremanPick = ($('#foreman') && $('#foreman').value) || '';
    if (foremanPick && L.can(u, 'owner') && e.direction === 'expense') e.foremanId = foremanPick;
    const recorded = L.recorderName(u);
    if (recorded) e.createdByName = recorded;
    try {
      commit(e);
      state.amount = 0; state.amountDraft = ''; state.desc = ''; state.party = ''; state.formId = uuid();
      state.dropForeman = true;
      setFormMsg('حُفظ', 'saved');
      if ($('#desc')) $('#desc').value = '';
      if ($('#party')) $('#party').value = '';
      if ($('#amt')) $('#amt').value = '';
      render();
    }
    catch (err) { b.disabled = false; setFormMsg(/** @type {{ message?: string }} */ (err).message, 'error'); }
  } else if (b.dataset.rev) {
    const all = get(K.entries, []); const orig = all.find(/** @param {any} x */ x => x.id === b.dataset.rev);
    const reason = prompt('سبب التصحيح:', 'خطأ في الإدخال'); if (!reason) return;
    try { commit(L.makeReversal(orig, { user: u, reason, now: Date.now(), deviceId, entryDate: today() })); render(); }
    catch (err) { alert(/** @type {{ message?: string }} */ (err).message); }
  } else if (b.id === 'entry-print' || b.id === 'entry-pdf') {
    printCurrentEntry();
  } else if (b.id === 'entry-file') {
    const built = currentEntryExport();
    if (built && built.csv) saveEntryFile(built.csv, built.filename);
  } else if (b.id === 'rejected-csv') {
    if (!L.canExportRejected(u)) return;
    const rows = rejectedRows(u);
    const extra = refusalDocs();
    if (!rows.length && !extra.length) return;
    const csv = rejectedExportText(u);
    const filename = 'aj-rejected-' + today() + '.csv';
    const pending = saveCsvFile(csv, filename);
    const ids = rows.map(row => /** @type {string} */ (row.id)).concat(extra.map(row => row.id));
    pending.then(result => {
      if (result !== 'shared' && result !== 'downloaded') return;
      const prev = /** @type {string[]} */ (get(K.rejectedExportedIds, []) || []);
      const next = prev.slice();
      ids.forEach(id => { if (next.indexOf(id) < 0) next.push(id); });
      set(K.rejectedExportedIds, next);
    });
  } else if (b.id === 'csv') {
    if (!L.canExportCSV(u)) return;
    const rows = L.countedEntries(get(K.entries, []), get(K.syncErrors, {}) || {});
    const blob = new Blob([L.toCSV(rows, get(K.projects, []))], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'aj-ledger-' + today() + '.csv'; a.click();
  } else if (b.dataset.list) {
    if (!L.can(u, 'owner')) return;
    state.projectList = b.dataset.list === 'archived' ? 'archived' : 'open';
    state.confirm = null;
    render();
  } else if (b.id === 'manage-project') {
    const id = (location.hash.slice(1).split('/')[1]) || '';
    const uNow = me();
    const project = get(K.projects, []).find(/** @param {any} p */ p => p.id === id);
    if (!L.can(uNow, 'manageProject') || !project) return;
    state.confirm = { id, action: 'manage' };
    render();
  } else if (b.id === 'choose-archive') {
    const id = state.confirm && state.confirm.id;
    if (id) openConfirm('archive', id);
  } else if (b.id === 'choose-delete') {
    const id = state.confirm && state.confirm.id;
    const uNow = me();
    const project = id && get(K.projects, []).find(/** @param {any} p */ p => p.id === id);
    if (!L.can(uNow, 'manageProject') || !project) return;
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
    const project = pending && get(K.projects, []).find(/** @param {any} p */ p => p.id === pending.id);
    if (!pending || pending.action !== 'delete' || !project || !window.Sync.exactProjectName(typed, project.name)) return;
    state.confirm = null;
    deleteProjectNow(project.id);
  } else if (b.id === 'newproj') {
    if (!L.canCreateProject(u)) return;
    const name = prompt('اسم المشروع:'); if (!name) return; const clientName = prompt('اسم الزبون:') || '';
    const p = { id: uuid(), name, clientName, location: '', currency: 'IQD', status: 'active', createdAtDevice: Date.now(), createdAtServer: null, createdBy: u.uid, deviceId };
    set(K.projects, [...get(K.projects, []), p]); set(K.outbox, [...get(K.outbox, []), p.id]); render();
    if (!demoRole()) flushRemote({ fromOutside: true });
  } else if (b.id === 'save-contract') saveContract(u);
  else if (b.id === 'save-person') savePerson(u);
  else if (b.id === 'people-retry') ensureDirectory('retry').then(() => render()).catch(() => render());
  else if (b.id === 'save-sub') saveSubcontract(u, b);
  else if (b.id === 'save-amend') saveAmendment(u, b);
});
document.addEventListener('input', ev => {
  const el = /** @type {HTMLInputElement | null} */ (ev.target);
  if (el && window.AccountsView && AccountsView.onInput(el)) return;
  if (el && window.ForemenUI && ForemenUI.onInput(el)) return;
  if (!el || el.id !== 'delete-name' || !state.confirm || state.confirm.action !== 'delete') return;
  state.confirm.typed = el.value;
  const project = get(K.projects, []).find(/** @param {any} p */ p => p.id === /** @type {{ id: string }} */ (state.confirm).id);
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
$('#role').addEventListener('change', /** @param {any} ev */ ev => { if (!demoRole()) return; set(K.role, /** @type {HTMLSelectElement} */ (ev.target).value); render(); });
$('#login-form').addEventListener('submit', /** @param {any} ev */ async ev => {
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
    const marked = signOutPending();
    if (marked) {
      try { await withTimeout(fb.signOut(), 3000, 'خروج'); } catch (e) { /* a failed sign-out does not block login */ }
    }
    let cred = await withTimeout(fb.signIn(email, password), LOGIN_MS, 'تسجيل الدخول');
    if (marked) clearSignOutPending(marked);
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
    msg.textContent = /** @type {{ code?: string, message?: string }} */ (err).code ? loginError(err) : (/** @type {{ message?: string }} */ (err).message || 'تعذر الدخول');
  } finally { if (token === sessionEpoch) btn.disabled = false; document.body.dataset.loginAttempt = '1'; }
});
addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && bellOpen) { bellOpen = false; paintBell(); }
});
if (window.AccountsView) {
  /** @type {RenderApi} */
  const accountsApi = {
    views, titles, state, render, esc, money, queueDoc, confirmShell,
    lastSyncAt: () => lastSyncAt,
    formatSyncTime,
    saveCsvFiles,
  };
  AccountsView.install(accountsApi);
  /** @type {Array<'AccountWork' | 'AccountPayment' | 'AccountCorrect' | 'AccountStatement' | 'AccountShare'>} */
  const accountInstalls = ['AccountWork', 'AccountPayment', 'AccountCorrect', 'AccountStatement', 'AccountShare'];
  for (const name of accountInstalls) {
    const mod = window[name];
    if (mod && mod.install) mod.install(accountsApi);
  }
}
if (window.ForemenUI) {
  /** @type {RenderApi} */
  const renderApi = {
    views, titles, state, render, esc, money, queueDoc, confirmShell,
    lastSyncAt: () => lastSyncAt,
    formatSyncTime,
    saveCsvFiles,
  };
  ForemenUI.install(renderApi);
}
addEventListener('hashchange', () => {
  pendingEntryId = entryIdFromHash();
  render();
});
addEventListener('online', () => {
  if (!demoRole() && get(K.sessionUser)) { flushRemote({ fromOutside: true }); refreshDirectory('online'); }
  else if (!$('#shell').hidden) render();
});
addEventListener('offline', () => { if (!$('#shell').hidden) render(); });
