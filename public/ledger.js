// Pure ledger logic (no DOM). Field rules follow data-model.md.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Ledger = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // data-model.md §2: expense, materials, labour, subcontractor, clientPayment.
  const ENTRY_TYPES = {
    expense:       { label: 'مصروف',       direction: 'expense' },
    materials:     { label: 'مواد',        direction: 'expense' },
    labour:        { label: 'عمالة/سلفة',  direction: 'expense' },
    subcontractor: { label: 'مقاول',       direction: 'expense' },
    clientPayment: { label: 'دفعة عميل',   direction: 'income'  },
  };
  // data-model.md §4 (2026-10-30): site may record client payments, reverse only its own entries, and see assigned projects.
  const DEFAULT_POLICY = {
    siteCanCreateClientPayment: true,
    siteCanReverseOwn: true,
    siteSeesOnlyAssigned: true,
  };

  function sign(e) { return e.isReversal ? -1 : 1; }

  function totals(entries) {
    let income = 0, expense = 0; const byType = {};
    for (const e of entries) {
      const v = e.amount * sign(e);
      if (e.direction === 'income') income += v; else expense += v;
      if (e.direction === 'expense') byType[e.entryType] = (byType[e.entryType] || 0) + v;
    }
    return { received: income, spent: expense, profit: income - expense, byType };
  }

  function isArchived(project) { return !!(project && project.status === 'archived'); }
  function canSeeProject(user, project, policy = DEFAULT_POLICY) {
    if (user.role === 'owner') return true;
    if (isArchived(project)) return false;
    if (user.role !== 'site' || !user.active) return false;
    return !policy.siteSeesOnlyAssigned || (user.assignedProjectIds || []).includes(project.id);
  }
  function visibleProjects(user, projects, policy) { return projects.filter(p => canSeeProject(user, p, policy)); }
  function projectList(user, projects, policy, list) {
    const visible = visibleProjects(user, projects, policy);
    const wantArchived = list === 'archived' && !!(user && user.role === 'owner');
    return visible.filter(p => isArchived(p) === wantArchived);
  }
  function nextProjectStatus(user, project, action) {
    if (!user || user.role !== 'owner' || user.active !== true || !project) return null;
    if (action === 'archive') return isArchived(project) ? null : 'archived';
    if (action === 'restore') return isArchived(project) ? 'active' : null;
    return null;
  }
  // Site sees its own entries and expenses on visible projects. Never received/profit totals.
  function visibleEntries(user, entries, projects, policy) {
    const ok = new Set(visibleProjects(user, projects, policy).map(p => p.id));
    return entries.filter(e => ok.has(e.projectId) && (user.role === 'owner' || e.direction === 'expense' || e.createdBy === user.uid));
  }
  // What a user's project card may show. Site: spending only.
  function projectSummary(user, entries) {
    const t = totals(entries);
    if (user.role === 'owner') return t;
    return { spent: totals(entries.filter(e => e.direction === 'expense')).spent, byType: t.byType };
  }

  // Same ceiling as firestore.rules MAX_AMOUNT_IQD. Integer IQD only; no fils.
  const MAX_AMOUNT_IQD = 10000000000;
  const AMOUNT_MSG = 'المبلغ يجب أن يكون رقماً صحيحاً موجباً';
  const AMOUNT_LIMIT_MSG = 'الحد الأعلى للمبلغ هو 10,000,000,000 د.ع';

  function isPosInt(n) { return Number.isSafeInteger(n) && n > 0 && n <= MAX_AMOUNT_IQD; }

  // What the amount field accepts. Arabic-Indic digits count as digits.
  // Thousands commas (1,000) stay. A sign, a decimal, or a short group such as
  // 2,5 is invalid — it is not turned into another number.
  function parseAmount(raw, opts) {
    const allowZero = !!(opts && opts.allowZero);
    let text = String(raw == null ? '' : raw).trim();
    text = text.replace(/[٠-٩]/g, ch => String(ch.charCodeAt(0) - 0x0660));
    text = text.replace(/[۰-۹]/g, ch => String(ch.charCodeAt(0) - 0x06F0));
    text = text.replace(/\u066C/g, ',').replace(/\u066B/g, '.');
    if (!text) return { ok: false, error: AMOUNT_MSG };
    if (!/^\d{1,3}(,\d{3})+$/.test(text) && !/^\d+$/.test(text)) return { ok: false, error: AMOUNT_MSG };
    const digits = text.replace(/,/g, '');
    if (digits.length > String(MAX_AMOUNT_IQD).length) return { ok: false, error: AMOUNT_LIMIT_MSG };
    const n = Number(digits);
    if (!Number.isSafeInteger(n)) return { ok: false, error: AMOUNT_LIMIT_MSG };
    if (n === 0 && allowZero) return { ok: true, amount: 0 };
    if (n <= 0) return { ok: false, error: AMOUNT_MSG };
    if (n > MAX_AMOUNT_IQD) return { ok: false, error: AMOUNT_LIMIT_MSG };
    return { ok: true, amount: n };
  }

  // Copy of users/{uid}.displayName. Rules require an exact match and at most 80
  // characters, so a missing or longer name is left off the entry.
  function recorderName(user) {
    const name = user && user.displayName;
    if (typeof name !== 'string' || name.length < 1 || name.length > 80) return '';
    return name;
  }
  function displayRecorder(entry) {
    const name = entry && entry.createdByName;
    return typeof name === 'string' && name.length > 0 ? name : '—';
  }

  function validateEntry(entry, ctx) {
    const { user, ledger, projects, policy = DEFAULT_POLICY } = ctx;
    const errs = [];
    if (!user || !user.active || !['owner', 'site'].includes(user.role)) errs.push('مستخدم غير مسموح');
    if (!entry.id) errs.push('id مطلوب');
    if (ledger.some(e => e.id === entry.id)) errs.push('DUPLICATE');
    const project = projects.find(p => p.id === entry.projectId);
    if (!project) errs.push('المشروع غير موجود');
    else if (user && !canSeeProject(user, project, policy)) errs.push('مشروع غير مسند');
    const t = ENTRY_TYPES[entry.entryType];
    if (!t) errs.push('نوع غير معروف');
    else if (t.direction !== entry.direction) errs.push('الاتجاه لا يطابق النوع');
    if (!['income', 'expense'].includes(entry.direction)) errs.push('direction غير صالح');
    if (typeof entry.amount === 'number' && entry.amount > MAX_AMOUNT_IQD) errs.push(AMOUNT_LIMIT_MSG);
    else if (!isPosInt(entry.amount)) errs.push(AMOUNT_MSG);
    if (entry.currency !== 'IQD') errs.push('العملة IQD فقط');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.entryDate || '')) errs.push('entryDate بصيغة YYYY-MM-DD');
    if ('partyName' in entry && entry.partyName !== undefined) {
      const p = entry.partyName;
      if (typeof p !== 'string' || p.length > 100 || p !== p.trim()) errs.push('الجهة المستلمة غير صالحة');
    }
    if ('createdByName' in entry && entry.createdByName !== undefined) {
      const expected = recorderName(user);
      if (!expected || entry.createdByName !== expected) errs.push('اسم المُسجِّل غير مطابق');
    }
    if (user && entry.createdBy !== user.uid) errs.push('createdBy يجب أن يساوي المستخدم');
    if (typeof entry.isReversal !== 'boolean') errs.push('isReversal مطلوب');
    if (user && user.role === 'site' && entry.entryType === 'subcontractor') errs.push('تسجيل دفعة المقاول للمالك فقط');
    if (entry.subcontractId) {
      if (entry.entryType !== 'subcontractor') errs.push('الربط لعقد المقاول فقط');
      else if (typeof entry.subcontractId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(entry.subcontractId)) errs.push('عقد غير صالح');
      else if (Array.isArray(ctx.subcontracts)) {
        const sub = ctx.subcontracts.find(s => s && s.id === entry.subcontractId);
        if (!sub || sub.projectId !== entry.projectId) errs.push('عقد مشروع آخر');
      }
    }
    if (user && user.role === 'site' && entry.direction === 'income' && !policy.siteCanCreateClientPayment) errs.push('دفعة عميل للمالك فقط');
    if (entry.isReversal) {
      const orig = ledger.find(e => e.id === entry.reversesEntryId);
      if (entry.id !== reversalId(entry.reversesEntryId)) errs.push('معرّف قيد العكس يجب أن يكون rev_<id الأصلي>');
      if (!orig) errs.push('القيد الأصلي غير موجود');
      else {
        if (orig.isReversal) errs.push('لا يُعكس قيد عكس');
        if (ledger.some(e => e.isReversal && e.reversesEntryId === orig.id)) errs.push('القيد معكوس مسبقاً');
        for (const k of ['projectId', 'direction', 'entryType', 'amount']) if (orig[k] !== entry[k]) errs.push('قيد العكس يجب أن ينسخ ' + k);
        if (user && user.role === 'site' && !(policy.siteCanReverseOwn && orig.createdBy === user.uid)) errs.push('العكس غير مسموح');
      }
      if (!entry.reversalReason) errs.push('سبب التصحيح مطلوب');
    } else if ('reversesEntryId' in entry || 'reversalReason' in entry) errs.push('حقول العكس فقط لقيد العكس');
    if ('syncState' in entry) errs.push('syncState لا يُخزَّن');
    return errs;
  }

  // Append-only ledger: frozen entries, no update/delete API at all.
  function createLedger(initial = []) {
    const rows = initial.map(e => Object.freeze({ ...e }));
    return Object.freeze({
      all: () => rows.slice(),
      append(entry, ctx) {
        const errs = validateEntry(entry, { ...ctx, ledger: rows });
        if (errs.length) { const err = new Error(errs.join('؛ ')); err.errors = errs; throw err; }
        const e = Object.freeze({ ...entry });
        rows.push(e); return e;
      },
    });
  }

  // Deterministic id => one reversal per original (a 2nd create hits the same doc and is refused).
  function reversalId(originalId) { return 'rev_' + originalId; }
  function makeReversal(orig, { user, reason, now, deviceId, entryDate }) {
    const row = { id: reversalId(orig.id), projectId: orig.projectId, direction: orig.direction, entryType: orig.entryType,
      amount: orig.amount, currency: 'IQD', entryDate, description: 'تصحيح: ' + (orig.description || ''),
      partyName: orig.partyName || '', isReversal: true, reversesEntryId: orig.id, reversalReason: reason,
      createdAtDevice: now, createdAtServer: null, createdBy: user.uid, deviceId };
    if (typeof orig.subcontractId === 'string' && orig.subcontractId) row.subcontractId = orig.subcontractId;
    const name = recorderName(user);
    if (name) row.createdByName = name;
    return row;
  }

  const CSV_COLS = ['id','projectId','projectName','entryDate','direction','entryType','amount','signedAmount','currency','description','partyName','isReversal','reversesEntryId','reversalReason','createdBy','createdByName','createdAtDevice','deviceId'];
  function csvCell(v) {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s) && isNaN(Number(s))) s = "'" + s; // formula-injection guard
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCSV(entries, projects) {
    const name = Object.fromEntries(projects.map(p => [p.id, p.name]));
    const lines = [CSV_COLS.join(',')];
    for (const e of entries) {
      const r = { ...e, projectName: name[e.projectId] || '', signedAmount: e.amount * sign(e) };
      lines.push(CSV_COLS.map(c => csvCell(r[c])).join(','));
    }
    return '\uFEFF' + lines.join('\r\n') + '\r\n'; // BOM so Excel reads Arabic UTF-8
  }
  function canExportCSV(user) { return user.role === 'owner' && user.active; }

  // Screen totals, the ledger file, and «عرض جميع القيود» share this list.
  // A server rejection is recorded in syncErrors and is left out. An entry
  // still waiting to send has no error, so it stays.
  function countedEntries(entries, errors) {
    const err = errors || {};
    return (entries || []).filter(e => e && e.id && !err[e.id]);
  }
  function canCreateProject(user) { return user.role === 'owner' && user.active; }

  function fmt(n) { return (n < 0 ? '−' : '') + Math.abs(n).toLocaleString('en-US'); }

  // Agreed, paid, and «مسدّد بالكامل» are derived. Nothing here is stored.
  function subcontractBalance(originalAmount, amendments, entries, subcontractId) {
    const agreed = originalAmount + (amendments || []).reduce((sum, row) => {
      if (!row || row.subcontractId !== subcontractId || !Number.isInteger(row.amount)) return sum;
      return sum + row.amount;
    }, 0);
    const paid = (entries || []).reduce((sum, row) => {
      if (!row || row.entryType !== 'subcontractor' || row.subcontractId !== subcontractId) return sum;
      return sum + row.amount * sign(row);
    }, 0);
    const remaining = agreed - paid;
    const ratio = agreed > 0 ? paid / agreed : 0;
    const width = Math.max(0, Math.min(100, Math.round(ratio * 1000) / 10));
    return { agreed, paid, remaining, over: paid > agreed, settled: remaining === 0, width };
  }

  // Baghdad is UTC+3 all year. The ledger date is a separate calendar day, so the
  // recorded value is only the clock. formatToParts keeps the digits stable.
  function baghdadTime(ms) {
    const n = typeof ms === 'number' ? ms : Number(ms);
    if (!Number.isFinite(n)) return '—';
    const d = new Date(n);
    if (Number.isNaN(d.getTime())) return '—';
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Baghdad',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(d);
    const g = type => {
      const part = parts.find(p => p.type === type);
      return part ? part.value : '';
    };
    return g('hour') + ':' + g('minute') + ':' + g('second');
  }

  // Fields of one entry the user is already allowed to open.
  // Built from an allowlist: project name, the entry's own columns, and a reversal
  // only when that reversal row is itself visible. Never contract, profit, or totals.
  function entryExportFields(user, entry, ctx = {}) {
    if (!user || user.active !== true || (user.role !== 'owner' && user.role !== 'site')) return null;
    if (!entry || !entry.id) return null;
    if (ctx.syncErrors && ctx.syncErrors[entry.id]) return null;
    const projects = ctx.projects || [];
    const entries = ctx.entries || [];
    const visible = visibleEntries(user, entries, projects, ctx.policy || DEFAULT_POLICY);
    const row = visible.find(e => e.id === entry.id);
    if (!row) return null;
    const project = projects.find(p => p.id === row.projectId);
    const type = ENTRY_TYPES[row.entryType];
    const fields = [];
    const put = (key, label, value) => {
      fields.push({ key, label, value: value == null || value === '' ? '—' : String(value) });
    };
    put('company', 'الشركة', 'أهل الجزيرة');
    put('projectName', 'المشروع', project && project.name ? project.name : '—');
    put('entryType', 'النوع', type ? type.label : '—');
    put('amount', 'المبلغ', fmt(row.amount * sign(row)) + ' د.ع');
    put('entryDate', 'تاريخ القيد', row.entryDate || '—');
    put('recordedAt', 'وقت التسجيل', baghdadTime(row.createdAtDevice));
    put('recorder', 'سجّله', displayRecorder(row));
    put('party', 'الجهة', row.partyName || '—');
    put('note', 'الملاحظة', row.description || '—');
    put('id', 'المعرّف', row.id);
    if (row.isReversal) {
      put('reversalStatus', 'حالة العكس', 'قيد عكسي');
      put('reversalReason', 'سبب التصحيح', row.reversalReason || '—');
    } else {
      const reversal = visible.find(e => e.isReversal && e.reversesEntryId === row.id);
      if (reversal) {
        put('reversalStatus', 'حالة العكس', 'معكوس');
        put('reversalReason', 'سبب التصحيح', reversal.reversalReason || '—');
      }
    }
    return fields;
  }

  function entryToCSV(user, entry, ctx) {
    const fields = entryExportFields(user, entry, ctx);
    if (!fields) return null;
    const lines = [
      fields.map(f => csvCell(f.label)).join(','),
      fields.map(f => csvCell(f.value)).join(','),
    ];
    return '\uFEFF' + lines.join('\r\n') + '\r\n';
  }

  // How many rows the project screen paints at once. «المزيد» raises the limit
  // by this many. The rows are already in memory, so a page is not a server read.
  const PROJECT_ENTRY_PAGE = 50;

  function byNewest(a, b) {
    const stamp = row => (typeof row.createdAtDevice === 'number' && Number.isFinite(row.createdAtDevice) ? row.createdAtDevice : -Infinity);
    const ta = stamp(a), tb = stamp(b);
    if (ta !== tb) return tb - ta;
    const da = String(a.entryDate || ''), db = String(b.entryDate || '');
    if (da !== db) return da < db ? 1 : -1;
    const ia = String(a.id || ''), ib = String(b.id || '');
    if (ia === ib) return 0;
    return ia < ib ? 1 : -1;
  }

  function pageLimit(opts) {
    if (!opts || opts.limit == null) return PROJECT_ENTRY_PAGE;
    const n = opts.limit;
    if (!Number.isInteger(n) || n < 0) return PROJECT_ENTRY_PAGE;
    return n;
  }

  // One project's counted entries, newest recorded first. countedEntries drops
  // a server rejection; visibleEntries then keeps rows this user may already
  // see. Fields are an allowlist: type, amount, ledger date, recorder, party,
  // and reversal status. No contractAmount, profit, totals, or another person's
  // client-payment amount. reads is always 0. Pass the IndexedDB/memory cache.
  // This does not query Firestore.
  function projectEntryList(user, projectId, ctx = {}, opts) {
    if (!user || user.active !== true || (user.role !== 'owner' && user.role !== 'site')) return null;
    const projects = ctx.projects || [];
    const policy = ctx.policy || DEFAULT_POLICY;
    const project = visibleProjects(user, projects, policy).find(p => p && p.id === projectId);
    if (!project) return null;
    const visible = visibleEntries(user, countedEntries(ctx.entries, ctx.syncErrors), projects, policy)
      .filter(e => e && e.projectId === project.id)
      .sort(byNewest);
    const reversed = new Set();
    for (const e of visible) if (e.isReversal && e.reversesEntryId) reversed.add(e.reversesEntryId);
    const rows = visible.slice(0, pageLimit(opts)).map(entry => {
      const type = ENTRY_TYPES[entry.entryType];
      const label = type ? type.label : '—';
      const reversalStatus = entry.isReversal ? 'قيد عكسي' : (reversed.has(entry.id) ? 'معكوس' : '');
      return {
        id: entry.id,
        type: entry.isReversal ? ('تصحيح (قيد عكسي) · ' + label) : label,
        amount: fmt(entry.amount * sign(entry)) + ' د.ع',
        entryDate: entry.entryDate || '—',
        recorder: displayRecorder(entry),
        party: entry.partyName ? entry.partyName : '—',
        reversalStatus,
      };
    });
    return { rows, total: visible.length, reads: 0 };
  }

  return { ENTRY_TYPES, DEFAULT_POLICY, MAX_AMOUNT_IQD, PROJECT_ENTRY_PAGE, sign, totals, canSeeProject, visibleProjects, projectList, nextProjectStatus, visibleEntries,
    projectSummary, validateEntry, parseAmount, recorderName, displayRecorder, reversalId, createLedger, makeReversal, toCSV, CSV_COLS, canExportCSV, canCreateProject, countedEntries, fmt, subcontractBalance,
    baghdadTime, entryExportFields, entryToCSV, projectEntryList };
});
