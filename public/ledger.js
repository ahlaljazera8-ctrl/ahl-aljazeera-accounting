// Pure ledger logic (no DOM). Field rules follow data-model.md.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Ledger = factory();
})(typeof self !== 'undefined' ? self : /** @type {Window} */ (/** @type {unknown} */ (this)), /** @returns {LedgerApi} */ function () {
  'use strict';
  // data-model.md §2: expense, materials, labour, subcontractor, clientPayment.
  /** @type {Record<string, EntryTypeInfo>} */
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

  /** @param {LedgerEntry} e */
  function sign(e) { return e.isReversal ? -1 : 1; }

  /** @param {readonly LedgerEntry[]} entries @returns {LedgerTotals} */
  function totals(entries) {
    let income = 0, expense = 0;
    /** @type {Record<string, number>} */
    const byType = {};
    for (const e of entries) {
      const v = /** @type {number} */ (e.amount) * sign(e);
      if (e.direction === 'income') income += v; else expense += v;
      if (e.direction === 'expense') {
        const typeKey = /** @type {string} */ (e.entryType);
        byType[typeKey] = (byType[typeKey] || 0) + v;
      }
    }
    return { received: income, spent: expense, profit: income - expense, byType };
  }

  /** @param {LedgerProject | null | undefined} project */
  function isArchived(project) { return !!(project && project.status === 'archived'); }
  /**
   * @param {LedgerUser} user
   * @param {LedgerProject} project
   * @param {LedgerPolicy} [policy]
   */
  function canSeeProject(user, project, policy = DEFAULT_POLICY) {
    if (user.role === 'owner') return true;
    if (isArchived(project)) return false;
    if (user.role !== 'site' || !user.active) return false;
    return !policy.siteSeesOnlyAssigned || (user.assignedProjectIds || []).includes(/** @type {string} */ (project.id));
  }
  /**
   * @param {LedgerUser} user
   * @param {readonly LedgerProject[]} projects
   * @param {LedgerPolicy} [policy]
   */
  function visibleProjects(user, projects, policy) { return projects.filter(p => canSeeProject(user, p, policy)); }
  /**
   * @param {LedgerUser} user
   * @param {readonly LedgerProject[]} projects
   * @param {LedgerPolicy | undefined} policy
   * @param {string} list
   */
  function projectList(user, projects, policy, list) {
    const visible = visibleProjects(user, projects, policy);
    const wantArchived = list === 'archived' && !!(user && user.role === 'owner');
    return visible.filter(p => isArchived(p) === wantArchived);
  }
  /**
   * @param {LedgerUser | null | undefined} user
   * @param {string} action
   */
  function can(user, action) {
    const owner = !!(user && user.role === 'owner');
    if (action === 'owner') return owner;
    if (action === 'manageProject') return owner && user.active === true;
    return false;
  }
  /**
   * @param {LedgerUser | null | undefined} user
   * @param {LedgerProject | null | undefined} project
   * @param {string} action
   * @returns {string | null}
   */
  function nextProjectStatus(user, project, action) {
    if (!can(user, 'manageProject') || !project) return null;
    if (action === 'archive') return isArchived(project) ? null : 'archived';
    if (action === 'restore') return isArchived(project) ? 'active' : null;
    return null;
  }
  // Site sees its own entries and expenses on visible projects. Never received/profit totals.
  /**
   * @param {LedgerUser} user
   * @param {readonly LedgerEntry[]} entries
   * @param {readonly LedgerProject[]} projects
   * @param {LedgerPolicy} [policy]
   */
  function visibleEntries(user, entries, projects, policy) {
    const ok = new Set(visibleProjects(user, projects, policy).map(p => p.id));
    return entries.filter(e => ok.has(e.projectId) && (user.role === 'owner' || e.direction === 'expense' || e.createdBy === user.uid));
  }
  // What a user's project card may show. Site: spending only.
  /**
   * @param {LedgerUser} user
   * @param {readonly LedgerEntry[]} entries
   * @returns {LedgerTotals}
   */
  function projectSummary(user, entries) {
    const t = totals(entries);
    if (user.role === 'owner') return t;
    return { spent: totals(entries.filter(e => e.direction === 'expense')).spent, byType: t.byType };
  }

  // Same ceiling as firestore.rules MAX_AMOUNT_IQD. Integer IQD only; no fils.
  const MAX_AMOUNT_IQD = 10000000000;
  const AMOUNT_MSG = 'المبلغ يجب أن يكون رقماً صحيحاً موجباً';
  const AMOUNT_LIMIT_MSG = 'الحد الأعلى للمبلغ هو 10,000,000,000 د.ع';

  /** @param {unknown} n */
  function isPosInt(n) { return typeof n === 'number' && Number.isSafeInteger(n) && n > 0 && n <= MAX_AMOUNT_IQD; }

  // What the amount field accepts. Arabic-Indic digits count as digits.
  // Thousands commas (1,000) stay. A sign, a decimal, or a short group such as
  // 2,5 is invalid — it is not turned into another number.
  /**
   * @param {unknown} raw
   * @param {{ allowZero?: boolean }} [opts]
   * @returns {AmountResult}
   */
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
  /** @param {LedgerUser | null | undefined} user */
  function recorderName(user) {
    const name = user && user.displayName;
    if (typeof name !== 'string' || name.length < 1 || name.length > 80) return '';
    return name;
  }
  /** @param {LedgerEntry | null | undefined} entry */
  function displayRecorder(entry) {
    const name = entry && entry.createdByName;
    return typeof name === 'string' && name.length > 0 ? name : '—';
  }

  /**
   * @param {LedgerEntry} entry
   * @param {ValidateCtx} ctx
   * @returns {string[]}
   */
  function validateEntry(entry, ctx) {
    const { user, ledger: rawLedger, projects: rawProjects, policy = DEFAULT_POLICY } = ctx;
    const ledger = /** @type {readonly LedgerEntry[]} */ (rawLedger);
    const projects = /** @type {readonly LedgerProject[]} */ (rawProjects);
    const errs = [];
    if (!user || !user.active || !['owner', 'site'].includes(/** @type {string} */ (user.role))) errs.push('مستخدم غير مسموح');
    if (!entry.id) errs.push('id مطلوب');
    if (ledger.some(e => e.id === entry.id)) errs.push('DUPLICATE');
    const project = projects.find(p => p.id === entry.projectId);
    if (!project) errs.push('المشروع غير موجود');
    else if (user && !canSeeProject(user, project, policy)) errs.push('مشروع غير مسند');
    const t = ENTRY_TYPES[/** @type {string} */ (entry.entryType)];
    if (!t) errs.push('نوع غير معروف');
    else if (t.direction !== entry.direction) errs.push('الاتجاه لا يطابق النوع');
    if (!['income', 'expense'].includes(/** @type {string} */ (entry.direction))) errs.push('direction غير صالح');
    if (typeof entry.amount === 'number' && entry.amount > MAX_AMOUNT_IQD) errs.push(AMOUNT_LIMIT_MSG);
    else if (!isPosInt(entry.amount)) errs.push(AMOUNT_MSG);
    if (entry.currency !== 'IQD') errs.push('العملة IQD فقط');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.entryDate == null ? '' : String(entry.entryDate))) errs.push('entryDate بصيغة YYYY-MM-DD');
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
    if (user && user.role === 'site' && entry.entryType === 'subcontractor' && !entry.subcontractId) errs.push('اختر مقاولاً من هذا المشروع');
    if (entry.subcontractId) {
      if (entry.entryType !== 'subcontractor') errs.push('الربط لعقد المقاول فقط');
      else if (typeof entry.subcontractId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(entry.subcontractId)) errs.push('عقد غير صالح');
      else if (Array.isArray(ctx.subcontracts)) {
        const sub = ctx.subcontracts.find(s => s && s.id === entry.subcontractId);
        if (!sub || sub.projectId !== entry.projectId) errs.push('عقد مشروع آخر');
      }
    }
    if (entry.foremanId != null && entry.foremanId !== '') {
      if (!user || user.role !== 'owner') errs.push('عهدة الخلفة للمالك فقط');
      if (entry.direction !== 'expense') errs.push('عهدة الخلفة للمصروف فقط');
      if (typeof entry.foremanId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(entry.foremanId)) errs.push('معرّف الخلفة غير صالح');
      else if (Array.isArray(ctx.foremen) && !ctx.foremen.some(f => f && f.id === entry.foremanId)) errs.push('الخلفة غير موجود');
    }
    if (user && user.role === 'site' && entry.direction === 'income' && !policy.siteCanCreateClientPayment) errs.push('دفعة عميل للمالك فقط');
    if (entry.isReversal) {
      const orig = ledger.find(e => e.id === entry.reversesEntryId);
      if (entry.id !== reversalId(entry.reversesEntryId)) errs.push('معرّف قيد العكس يجب أن يكون rev_<id الأصلي>');
      if (!orig) errs.push('القيد الأصلي غير موجود');
      else {
        if (orig.isReversal) errs.push('لا يُعكس قيد عكس');
        if (ledger.some(e => e.isReversal && e.reversesEntryId === orig.id)) errs.push('القيد معكوس مسبقاً');
        for (const k of /** @type {readonly (keyof LedgerEntry)[]} */ (['projectId', 'direction', 'entryType', 'amount'])) if (orig[k] !== entry[k]) errs.push('قيد العكس يجب أن ينسخ ' + k);
        if (user && user.role === 'site' && !(policy.siteCanReverseOwn && orig.createdBy === user.uid)) errs.push('العكس غير مسموح');
      }
      if (!entry.reversalReason) errs.push('سبب التصحيح مطلوب');
    } else if ('reversesEntryId' in entry || 'reversalReason' in entry) errs.push('حقول العكس فقط لقيد العكس');
    if ('syncState' in entry) errs.push('syncState لا يُخزَّن');
    return errs;
  }

  // Append-only ledger: frozen entries, no update/delete API at all.
  /**
   * @param {readonly LedgerEntry[]} [initial]
   * @returns {LedgerBook}
   */
  function createLedger(initial = []) {
    /** @type {LedgerEntry[]} */
    const rows = initial.map(e => Object.freeze({ ...e }));
    return Object.freeze({
      all: () => rows.slice(),
      /**
       * @param {LedgerEntry} entry
       * @param {ValidateCtx} ctx
       */
      append(entry, ctx) {
        const errs = validateEntry(entry, { ...ctx, ledger: rows });
        if (errs.length) { const err = new Error(errs.join('؛ ')); err.errors = errs; throw err; }
        const e = Object.freeze({ ...entry });
        rows.push(e); return e;
      },
    });
  }

  // Deterministic id => one reversal per original (a 2nd create hits the same doc and is refused).
  /** @param {string | undefined} originalId */
  function reversalId(originalId) { return 'rev_' + /** @type {string} */ (originalId); }
  /**
   * @param {LedgerEntry} orig
   * @param {ReversalCtx} ctx
   * @returns {LedgerEntry}
   */
  function makeReversal(orig, { user, reason, now, deviceId, entryDate }) {
    /** @type {LedgerEntry} */
    const row = { id: reversalId(orig.id), projectId: orig.projectId, direction: orig.direction, entryType: orig.entryType,
      amount: orig.amount, currency: 'IQD', entryDate, description: 'تصحيح: ' + (orig.description || ''),
      partyName: orig.partyName || '', isReversal: true, reversesEntryId: orig.id, reversalReason: reason,
      createdAtDevice: now, createdAtServer: null, createdBy: user.uid, deviceId };
    if (typeof orig.subcontractId === 'string' && orig.subcontractId) row.subcontractId = orig.subcontractId;
    if (typeof orig.foremanId === 'string' && orig.foremanId) row.foremanId = orig.foremanId;
    const name = recorderName(user);
    if (name) row.createdByName = name;
    return row;
  }

  const CSV_COLS = ['id','projectId','projectName','entryDate','direction','entryType','amount','signedAmount','currency','description','partyName','isReversal','reversesEntryId','reversalReason','createdBy','createdByName','createdAtDevice','deviceId'];
  /** @param {unknown} v */
  function csvCell(v) {
    let s = v == null ? '' : String(v);
    // A space, U+200F, or U+202B before = + - @ is the same formula prefix as a leading mark.
    const formula = /^[=+\-@\t\r]/.test(s) || /^[ \u200F\u202B]+[=+\-@]/.test(s);
    if (formula && isNaN(Number(s))) s = "'" + s;
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  /**
   * @param {readonly LedgerEntry[]} entries
   * @param {readonly LedgerProject[]} projects
   */
  function toCSV(entries, projects) {
    const name = Object.fromEntries(projects.map(p => [p.id, p.name]));
    const lines = [CSV_COLS.join(',')];
    for (const e of entries) {
      const r = { ...e, projectName: name[/** @type {string} */ (e.projectId)] || '', signedAmount: /** @type {number} */ (e.amount) * sign(e) };
      lines.push(CSV_COLS.map(c => csvCell(/** @type {LedgerEntry} */ (r)[c])).join(','));
    }
    return '\uFEFF' + lines.join('\r\n') + '\r\n'; // BOM so Excel reads Arabic UTF-8
  }
  /** @param {LedgerUser} user */
  function canExportCSV(user) { return user.role === 'owner' && user.active; }

  // Screen totals, the ledger file, and «عرض جميع القيود» share this list.
  // A server rejection is recorded in syncErrors and is left out. An entry
  // still waiting to send has no error, so it stays.
  /**
   * @param {readonly LedgerEntry[] | null | undefined} entries
   * @param {Record<string, unknown> | null | undefined} errors
   */
  function countedEntries(entries, errors) {
    const err = errors || {};
    return (entries || []).filter(e => e && e.id && !err[/** @type {string} */ (e.id)]);
  }

  const REJECTED_HEADERS = [
    'رقم القيد المحلي',
    'تاريخ القيد',
    'اسم المشروع كما كان على الهاتف',
    'معرّف المشروع',
    'النوع',
    'البند أو الفئة',
    'البيان',
    'الطرف',
    'المبلغ',
    'العملة',
    'أدخله',
    'وقت إنشاء القيد',
    'سبب الرفض',
    'الحالة',
  ];
  const REJECTED_STATE = 'مرفوض - غير محسوب بالأرصدة';

  /**
   * @param {string} projectId
   * @param {readonly LedgerProject[] | null | undefined} projects
   * @param {GoneProjectNames | null | undefined} goneNames
   * @returns {string}
   */
  function rememberedProjectName(projectId, projects, goneNames) {
    const live = (projects || []).find(p => p && p.id === projectId);
    if (live && typeof live.name === 'string' && live.name) return live.name;
    const copied = goneNames && goneNames[projectId];
    if (typeof copied === 'string' && copied) return copied;
    return '—';
  }

  /**
   * @param {LedgerUser | null | undefined} user
   * @param {readonly LedgerEntry[] | null | undefined} entries
   * @param {Record<string, unknown> | null | undefined} errors
   * @param {string} message
   * @returns {LedgerEntry[]}
   */
  function deletedProjectEntries(user, entries, errors, message) {
    if (!user || (user.role !== 'owner' && user.role !== 'site')) return [];
    const err = errors || {};
    return (entries || []).filter(e => {
      if (!e || typeof e.id !== 'string' || !e.id) return false;
      if (err[e.id] !== message) return false;
      if (user.role === 'owner') return true;
      const by = e.createdBy;
      if (by == null || by === '') return true;
      return by === user.uid;
    });
  }

  /**
   * @param {LedgerUser | null | undefined} user
   * @returns {boolean}
   */
  function canExportRejected(user) {
    return !!(user && user.active === true && (user.role === 'owner' || user.role === 'site'));
  }

  /**
   * @param {readonly { id: string }[]} listed
   * @param {readonly string[] | null | undefined} exportedIds
   * @returns {boolean}
   */
  function rejectedLogoutBlocked(listed, exportedIds) {
    const ids = exportedIds || [];
    return (listed || []).some(row => !!(row && row.id && ids.indexOf(row.id) === -1));
  }

  /**
   * @param {unknown} ms
   * @returns {string}
   */
  function baghdadStamp(ms) {
    const n = typeof ms === 'number' ? ms : Number(ms);
    if (!Number.isFinite(n)) return '';
    const d = new Date(n);
    if (Number.isNaN(d.getTime())) return '';
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Baghdad',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(d);
    /** @param {string} type */
    const g = type => {
      const part = parts.find(p => p.type === type);
      return part ? part.value : '';
    };
    const date = g('year') + '-' + g('month') + '-' + g('day');
    const clock = g('hour') + ':' + g('minute') + ':' + g('second');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}:\d{2}$/.test(clock)) return '';
    return date + 'T' + clock + '+03:00';
  }

  /**
   * @param {readonly LedgerEntry[]} entries
   * @param {readonly LedgerProject[] | null | undefined} projects
   * @param {GoneProjectNames | null | undefined} goneNames
   * @param {Record<string, unknown> | null | undefined} errors
   * @returns {string}
   */
  function rejectedEntriesToCSV(entries, projects, goneNames, errors) {
    const err = errors || {};
    const lines = [REJECTED_HEADERS.join(',')];
    for (const entry of entries || []) {
      const id = entry && typeof entry.id === 'string' ? entry.id : '';
      const entryDate = entry && /^\d{4}-\d{2}-\d{2}$/.test(String(entry.entryDate || '')) ? String(entry.entryDate) : '';
      const direction = entry && entry.direction === 'income' ? 'مقبوض' : (entry && entry.direction === 'expense' ? 'مصروف' : '');
      const typeInfo = entry && entry.entryType ? ENTRY_TYPES[entry.entryType] : null;
      const name = entry && entry.createdByName;
      const entered = typeof name === 'string' && name ? name : (entry && entry.createdBy ? String(entry.createdBy) : '');
      const amount = entry && typeof entry.amount === 'number' && Number.isFinite(entry.amount) ? String(entry.amount) : '';
      const reason = typeof err[id] === 'string' ? String(err[id]) : '';
      const cells = [
        id,
        entryDate,
        rememberedProjectName(entry && entry.projectId ? String(entry.projectId) : '', projects, goneNames),
        entry && entry.projectId ? String(entry.projectId) : '',
        direction,
        typeInfo ? typeInfo.label : '',
        entry && entry.description ? String(entry.description) : '',
        entry && entry.partyName ? String(entry.partyName) : '',
        amount,
        entry && entry.currency ? String(entry.currency) : '',
        entered,
        baghdadStamp(entry && entry.createdAtDevice),
        reason,
        REJECTED_STATE,
      ];
      lines.push(cells.map(cell => csvCell(cell)).join(','));
    }
    return '\uFEFF' + lines.join('\r\n') + '\r\n';
  }
  /** @param {LedgerUser} user */
  function canCreateProject(user) { return user.role === 'owner' && user.active; }

  /** @param {number} n */
  function fmt(n) { return (n < 0 ? '−' : '') + Math.abs(n).toLocaleString('en-US'); }

  // Agreed, paid, and «مسدّد بالكامل» are derived. Nothing here is stored.
  /**
   * @param {number} originalAmount
   * @param {readonly LedgerEntry[] | null | undefined} amendments
   * @param {readonly LedgerEntry[] | null | undefined} entries
   * @param {string} subcontractId
   * @returns {SubcontractFigures}
   */
  function subcontractBalance(originalAmount, amendments, entries, subcontractId) {
    const agreed = originalAmount + (amendments || []).reduce((sum, row) => {
      if (!row || row.subcontractId !== subcontractId || !Number.isInteger(row.amount)) return sum;
      return sum + /** @type {number} */ (row.amount);
    }, 0);
    const paid = (entries || []).reduce((sum, row) => {
      if (!row || row.entryType !== 'subcontractor' || row.subcontractId !== subcontractId) return sum;
      return sum + /** @type {number} */ (row.amount) * sign(row);
    }, 0);
    const remaining = agreed - paid;
    const ratio = agreed > 0 ? paid / agreed : 0;
    const width = Math.max(0, Math.min(100, Math.round(ratio * 1000) / 10));
    return { agreed, paid, remaining, over: paid > agreed, settled: remaining === 0, width };
  }

  // Baghdad is UTC+3 all year. The ledger date is a separate calendar day, so the
  // recorded value is only the clock. formatToParts keeps the digits stable.
  /** @param {unknown} ms @returns {string} */
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
    /** @param {string} type */
    const g = type => {
      const part = parts.find(p => p.type === type);
      return part ? part.value : '';
    };
    return g('hour') + ':' + g('minute') + ':' + g('second');
  }

  // Fields of one entry the user is already allowed to open.
  // Built from an allowlist: project name, the entry's own columns, and a reversal
  // only when that reversal row is itself visible. Never contract, profit, or totals.
  /**
   * @param {LedgerUser | null | undefined} user
   * @param {LedgerEntry | null | undefined} entry
   * @param {LedgerViewCtx} [ctx]
   * @returns {ExportField[] | null}
   */
  function entryExportFields(user, entry, ctx = {}) {
    if (!user || user.active !== true || (user.role !== 'owner' && user.role !== 'site')) return null;
    if (!entry || !entry.id) return null;
    if (ctx.syncErrors && ctx.syncErrors[/** @type {string} */ (entry.id)]) return null;
    const projects = ctx.projects || [];
    const entries = ctx.entries || [];
    const visible = visibleEntries(user, entries, projects, ctx.policy || DEFAULT_POLICY);
    const row = visible.find(e => e.id === entry.id);
    if (!row) return null;
    const project = projects.find(p => p.id === row.projectId);
    const type = ENTRY_TYPES[/** @type {string} */ (row.entryType)];
    /** @type {ExportField[]} */
    const fields = [];
    /**
     * @param {string} key
     * @param {string} label
     * @param {unknown} value
     */
    const put = (key, label, value) => {
      fields.push({ key, label, value: value == null || value === '' ? '—' : String(value) });
    };
    put('company', 'الشركة', 'أهل الجزيرة');
    put('projectName', 'المشروع', project && project.name ? project.name : '—');
    put('entryType', 'النوع', type ? type.label : '—');
    put('amount', 'المبلغ', fmt(/** @type {number} */ (row.amount) * sign(row)) + ' د.ع');
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

  /**
   * @param {LedgerUser | null | undefined} user
   * @param {LedgerEntry | null | undefined} entry
   * @param {LedgerViewCtx} [ctx]
   * @returns {string | null}
   */
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

  /**
   * @param {LedgerEntry} a
   * @param {LedgerEntry} b
   */
  function byNewest(a, b) {
    /** @param {LedgerEntry} row */
    const stamp = row => (typeof row.createdAtDevice === 'number' && Number.isFinite(row.createdAtDevice) ? row.createdAtDevice : -Infinity);
    const ta = stamp(a), tb = stamp(b);
    if (ta !== tb) return tb - ta;
    const da = String(a.entryDate || ''), db = String(b.entryDate || '');
    if (da !== db) return da < db ? 1 : -1;
    const ia = String(a.id || ''), ib = String(b.id || '');
    if (ia === ib) return 0;
    return ia < ib ? 1 : -1;
  }

  /** @param {PageOpts | null | undefined} opts */
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
  /**
   * @param {LedgerUser | null | undefined} user
   * @param {string} projectId
   * @param {LedgerViewCtx} [ctx]
   * @param {PageOpts | null | undefined} [opts]
   * @returns {{ rows: ProjectListRow[], total: number, reads: number } | null}
   */
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
      const type = ENTRY_TYPES[/** @type {string} */ (entry.entryType)];
      const label = type ? type.label : '—';
      const reversalStatus = entry.isReversal ? 'قيد عكسي' : (reversed.has(entry.id) ? 'معكوس' : '');
      return {
        id: entry.id,
        type: entry.isReversal ? ('تصحيح (قيد عكسي) · ' + label) : label,
        amount: fmt(/** @type {number} */ (entry.amount) * sign(entry)) + ' د.ع',
        entryDate: /** @type {string} */ (entry.entryDate || '—'),
        recorder: displayRecorder(entry),
        party: entry.partyName ? entry.partyName : '—',
        reversalStatus,
      };
    });
    return { rows, total: visible.length, reads: 0 };
  }

  const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const STALE_MS = 10 * 60 * 1000;

  /** @param {ForemanMove | LedgerEntry | null | undefined} row */
  function rowSign(row) { return row && row.isReversal ? -1 : 1; }

  /**
   * @param {string} foremanId
   * @param {readonly ForemanMove[] | null | undefined} moves
   * @param {readonly LedgerEntry[] | null | undefined} entries
   * @param {Record<string, unknown> | null | undefined} [errors]
   * @returns {ForemanFigures}
   */
  function foremanBalance(foremanId, moves, entries, errors) {
    const err = errors || {};
    /** @param {{ id?: string } | null | undefined} row */
    const live = row => !!(row && row.id && !err[row.id]);
    let held = 0;
    for (const m of moves || []) {
      if (!live(m) || m.foremanId !== foremanId || typeof m.amount !== 'number' || !Number.isFinite(m.amount)) continue;
      const signed = m.amount * rowSign(m);
      if (m.kind === 'advance' || m.kind === 'settle') held += signed;
      else if (m.kind === 'return') held -= signed;
    }
    for (const e of entries || []) {
      if (!live(e) || e.foremanId !== foremanId || e.direction !== 'expense') continue;
      if (typeof e.amount !== 'number' || !Number.isFinite(e.amount)) continue;
      held -= e.amount * rowSign(e);
    }
    const remaining = held > 0 ? held : 0;
    const owedToForeman = held < 0 ? -held : 0;
    const state = held > 0 ? 'holding' : held < 0 ? 'owed' : 'settled';
    return { held, remaining, owedToForeman, state };
  }

  /**
   * @param {{ id?: string, foremanId?: string, kind?: string, amount?: number, date?: string, note?: string, isReversal?: boolean, reversesMoveId?: string, reversalReason?: unknown, createdBy?: string }} move
   * @param {{ user?: LedgerUser | null, moves?: readonly ForemanMove[] | null, foremen?: readonly Foreman[] | null }} ctx
   * @returns {string[]}
   */
  function validateForemanMove(move, ctx) {
    const user = ctx && ctx.user;
    const moves = (ctx && ctx.moves) || [];
    const people = (ctx && ctx.foremen) || [];
    const errs = [];
    if (!user || user.role !== 'owner' || user.active !== true) errs.push('مستخدم غير مسموح');
    if (!move.id || !ID_RE.test(move.id)) errs.push('id غير صالح');
    if (moves.some(m => m && m.id === move.id)) errs.push('الحركة مكررة');
    if (!people.some(f => f && f.id === move.foremanId)) errs.push('الخلفة غير موجود');
    if (move.kind !== 'advance' && move.kind !== 'settle' && move.kind !== 'return') errs.push('نوع الحركة غير صالح');
    if (typeof move.amount === 'number' && move.amount > MAX_AMOUNT_IQD) errs.push(AMOUNT_LIMIT_MSG);
    else if (!isPosInt(move.amount)) errs.push(AMOUNT_MSG);
    if (!DATE_RE.test(move.date == null ? '' : String(move.date))) errs.push('date بصيغة YYYY-MM-DD');
    if (move.note != null && (typeof move.note !== 'string' || move.note.length > 200)) errs.push('الملاحظة غير صالحة');
    if (user && move.createdBy !== user.uid) errs.push('createdBy يجب أن يساوي المستخدم');
    if (move.isReversal === true) {
      if (move.id !== 'rev_' + move.reversesMoveId) errs.push('معرّف قيد العكس يجب أن يكون rev_<id الأصلي>');
      const orig = moves.find(m => m && m.id === move.reversesMoveId);
      if (!orig) errs.push('الحركة الأصلية غير موجودة');
      else {
        if (orig.isReversal) errs.push('لا يُعكس قيد عكس');
        if (moves.some(m => m && m.isReversal && m.reversesMoveId === orig.id)) errs.push('الحركة معكوسة مسبقاً');
        if (orig.foremanId !== move.foremanId) errs.push('قيد العكس يجب أن ينسخ الخلفة');
        if (orig.kind !== move.kind) errs.push('قيد العكس يجب أن ينسخ النوع');
        if (orig.amount !== move.amount) errs.push('قيد العكس يجب أن ينسخ المبلغ');
      }
      if (!move.reversalReason) errs.push('سبب التصحيح مطلوب');
    } else {
      if (move.isReversal !== false) errs.push('isReversal مطلوب');
      if (move.id && move.id.indexOf('rev_') === 0) errs.push('حركة عادية لا تبدأ بـ rev_');
      if ('reversesMoveId' in move || 'reversalReason' in move) errs.push('حقول العكس فقط لقيد العكس');
    }
    return errs;
  }

  /**
   * @param {ForemanMove} orig
   * @param {{ user: LedgerUser, reason: string, now: number, deviceId: string, date: string }} ctx
   * @returns {ForemanMove}
   */
  function foremanMoveReversal(orig, { user, reason, now, deviceId, date }) {
    return {
      id: 'rev_' + orig.id, foremanId: orig.foremanId, kind: orig.kind, amount: orig.amount, date,
      note: '', isReversal: true, reversesMoveId: orig.id, reversalReason: reason,
      createdAtDevice: now, createdAtServer: null, createdBy: user.uid, deviceId, docType: 'foremanMove',
    };
  }

  /**
   * @param {string} foremanId
   * @param {{ outbox?: readonly string[] | null, moves?: readonly ForemanMove[] | null, entries?: readonly LedgerEntry[] | null, lastSyncMs?: number | null, nowMs: number, watermark?: unknown }} opts
   * @returns {SettleGuard}
   */
  function settleGuard(foremanId, opts) {
    const nowMs = opts && opts.nowMs;
    if (typeof nowMs !== 'number' || !Number.isFinite(nowMs)) throw new Error('nowMs');
    const outbox = (opts && opts.outbox) || [];
    const moves = (opts && opts.moves) || [];
    const entries = (opts && opts.entries) || [];
    const lastSyncMs = opts && typeof opts.lastSyncMs === 'number' ? opts.lastSyncMs : 0;
    /** @type {string[]} */
    const pendingIds = [];
    for (const id of outbox) {
      const move = moves.some(m => m && m.id === id && m.foremanId === foremanId);
      const entry = entries.some(e => e && e.id === id && e.foremanId === foremanId);
      if (move || entry) pendingIds.push(id);
    }
    const stale = pendingIds.length > 0 || lastSyncMs === 0 || nowMs - lastSyncMs > STALE_MS;
    return { stale, pendingIds, lastSync: lastSyncMs > 0 ? lastSyncMs : null };
  }

  const DELETE_UNCHECKED = 'لا يمكن الحذف: تعذر التحقق من مصاريف العهدة.';

  /**
   * @param {string} projectId
   * @param {readonly LedgerEntry[] | null | undefined} entries
   * @param {readonly Foreman[] | null | undefined} foremen
   * @param {Record<string, unknown> | null | undefined} errors
   */
  function foremanDeleteBlock(projectId, entries, foremen, errors) {
    const names = [];
    const counted = countedEntries(entries || [], errors || {});
    for (const row of counted) {
      if (!row || row.projectId !== projectId || !row.foremanId) continue;
      const person = (foremen || []).find(item => item && item.id === row.foremanId);
      const name = person && person.name ? person.name : String(row.foremanId);
      if (names.indexOf(name) < 0) names.push(name);
    }
    if (!names.length) return '';
    return 'لا يمكن الحذف: فيه مصاريف عهدة لـ ' + names.join('، ') + '. سوِّ العهدة أو أرشف المشروع';
  }

  const FOREMAN_CUSTODY_COLS = [
    'رقم الخلفة', 'اسم الخلفة', 'نوع الصف', 'النوع', 'الرقم', 'التاريخ', 'رقم المشروع', 'اسم المشروع',
    'المبلغ', 'المبلغ بإشارته', 'أثر العهدة', 'الملاحظة', 'قيد عكسي', 'رقم المعكوس', 'سبب التصحيح',
    'أدخله', 'وقت الجهاز', 'رقم الجهاز',
  ];
  const FOREMAN_SUMMARY_COLS = [
    'رقم الخلفة', 'اسم الخلفة', 'السلف', 'التسديد', 'مجموع المصروف', 'الاستلام (المُرجَع)', 'المتبقي معه', 'مستحق للخلفة',
  ];
  /** @type {Readonly<Record<'advance' | 'settle' | 'return', string>>} */
  const MOVE_KIND_LABEL = { advance: 'سلفة', settle: 'تسديد', return: 'استلام' };
  const CUSTODY_ROW_MOVE = 'حركة';
  const CUSTODY_ROW_EXPENSE = 'مصروف من عهدة';
  const CUSTODY_YES = 'نعم';
  const CUSTODY_NO = 'لا';

  /**
   * @param {unknown} value
   * @returns {string}
   */
  function westernDigits(value) {
    const raw = value == null ? '' : String(value);
    return raw
      .replace(/[\u0660-\u0669]/g, digit => String(digit.charCodeAt(0) - 0x0660))
      .replace(/[\u06F0-\u06F9]/g, digit => String(digit.charCodeAt(0) - 0x06F0));
  }

  /** @param {unknown} value */
  function custodyCell(value) {
    return csvCell(westernDigits(value));
  }

  /** @param {unknown} value */
  function plainText(value) {
    return value == null ? '' : String(value);
  }

  /**
   * @param {unknown} amount
   * @param {number} effectSign
   * @param {number} sign
   */
  function custodyMoney(amount, effectSign, sign) {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return { amount: '', signedAmount: '', custodyEffect: '', signed: /** @type {number | null} */ (null) };
    }
    const signed = amount * sign;
    return {
      amount: String(amount),
      signedAmount: String(signed),
      custodyEffect: effectSign === 0 ? '' : String(effectSign * signed),
      signed,
    };
  }

  /**
   * @typedef {{
   *   foremanId: string,
   *   foremanName: string,
   *   rowType: string,
   *   kind: string,
   *   bucket: string,
   *   id: string,
   *   date: string,
   *   projectId: string,
   *   projectName: string,
   *   amount: string,
   *   signedAmount: string,
   *   custodyEffect: string,
   *   note: string,
   *   isReversal: string,
   *   reversesId: string,
   *   reversalReason: string,
   *   createdBy: string,
   *   createdAtDevice: string,
   *   deviceId: string,
   *   sortDevice: number,
   *   signed: number | null,
   * }} CustodyRow
   */

  /**
   * @param {readonly Foreman[] | null | undefined} foremen
   * @param {readonly ForemanMove[] | null | undefined} moves
   * @param {readonly LedgerEntry[] | null | undefined} entries
   * @param {readonly LedgerProject[] | null | undefined} projects
   * @param {Record<string, unknown> | null | undefined} [errors]
   * @returns {CustodyRow[]}
   */
  function foremanCustodyRows(foremen, moves, entries, projects, errors) {
    const err = errors || {};
    /** @param {{ id?: string } | null | undefined} row */
    const live = row => !!(row && row.id && !err[row.id]);
    /** @type {Map<string, string>} */
    const foremanNames = new Map();
    /** @type {string[]} */
    const listedIds = [];
    for (const person of foremen || []) {
      if (!person || typeof person.id !== 'string' || !person.id || foremanNames.has(person.id)) continue;
      foremanNames.set(person.id, typeof person.name === 'string' ? person.name : '');
      listedIds.push(person.id);
    }
    /** @type {Map<string, string>} */
    const projectNames = new Map();
    for (const project of projects || []) {
      if (!project || typeof project.id !== 'string' || !project.id || projectNames.has(project.id)) continue;
      projectNames.set(project.id, typeof project.name === 'string' ? project.name : '');
    }
    /** @type {CustodyRow[]} */
    const rows = [];
    for (const move of moves || []) {
      if (!live(move) || typeof move.foremanId !== 'string' || !move.foremanId) continue;
      const bucket = move.kind === 'advance' || move.kind === 'settle' || move.kind === 'return' ? move.kind : '';
      const effectSign = bucket === 'return' ? -1 : bucket ? 1 : 0;
      const money = custodyMoney(move.amount, effectSign, rowSign(move));
      const device = move.createdAtDevice;
      rows.push({
        foremanId: move.foremanId,
        foremanName: foremanNames.has(move.foremanId) ? /** @type {string} */ (foremanNames.get(move.foremanId)) : '',
        rowType: CUSTODY_ROW_MOVE,
        kind: bucket ? MOVE_KIND_LABEL[bucket] : '',
        bucket,
        id: plainText(move.id),
        date: plainText(move.date),
        projectId: '',
        projectName: '',
        amount: money.amount,
        signedAmount: money.signedAmount,
        custodyEffect: money.custodyEffect,
        note: plainText(move.note),
        isReversal: move.isReversal === true ? CUSTODY_YES : CUSTODY_NO,
        reversesId: plainText(move.reversesMoveId),
        reversalReason: plainText(move.reversalReason),
        createdBy: plainText(move.createdBy),
        createdAtDevice: plainText(device),
        deviceId: plainText(move.deviceId),
        sortDevice: typeof device === 'number' && Number.isFinite(device) ? device : 0,
        signed: money.signed,
      });
    }
    for (const entry of entries || []) {
      if (!live(entry) || entry.direction !== 'expense' || typeof entry.foremanId !== 'string' || !entry.foremanId) continue;
      const typeInfo = entry.entryType ? ENTRY_TYPES[entry.entryType] : null;
      const money = custodyMoney(entry.amount, -1, rowSign(entry));
      const projectId = typeof entry.projectId === 'string' ? entry.projectId : '';
      const device = entry.createdAtDevice;
      rows.push({
        foremanId: entry.foremanId,
        foremanName: foremanNames.has(entry.foremanId) ? /** @type {string} */ (foremanNames.get(entry.foremanId)) : '',
        rowType: CUSTODY_ROW_EXPENSE,
        kind: typeInfo ? typeInfo.label : '',
        bucket: 'expense',
        id: plainText(entry.id),
        date: plainText(entry.entryDate),
        projectId,
        projectName: projectId && projectNames.has(projectId) ? /** @type {string} */ (projectNames.get(projectId)) : '',
        amount: money.amount,
        signedAmount: money.signedAmount,
        custodyEffect: money.custodyEffect,
        note: plainText(entry.description),
        isReversal: entry.isReversal === true ? CUSTODY_YES : CUSTODY_NO,
        reversesId: plainText(entry.reversesEntryId),
        reversalReason: plainText(entry.reversalReason),
        createdBy: plainText(entry.createdBy),
        createdAtDevice: plainText(device),
        deviceId: plainText(entry.deviceId),
        sortDevice: typeof device === 'number' && Number.isFinite(device) ? device : 0,
        signed: money.signed,
      });
    }
    /** @type {Map<string, number>} */
    const order = new Map();
    listedIds.forEach((id, index) => order.set(id, index));
    /** @type {string[]} */
    const unknown = [];
    const seenUnknown = new Set();
    for (const row of rows) {
      if (order.has(row.foremanId) || seenUnknown.has(row.foremanId)) continue;
      seenUnknown.add(row.foremanId);
      unknown.push(row.foremanId);
    }
    unknown.sort();
    unknown.forEach((id, index) => order.set(id, listedIds.length + index));
    rows.sort((a, b) => {
      const left = order.get(a.foremanId) || 0;
      const right = order.get(b.foremanId) || 0;
      if (left !== right) return left - right;
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      if (a.sortDevice !== b.sortDevice) return a.sortDevice - b.sortDevice;
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    });
    return rows;
  }

  /**
   * @param {CustodyRow} row
   * @returns {string}
   */
  function custodyLine(row) {
    return [
      row.foremanId, row.foremanName, row.rowType, row.kind, row.id, row.date, row.projectId, row.projectName,
      row.amount, row.signedAmount, row.custodyEffect, row.note, row.isReversal, row.reversesId, row.reversalReason,
      row.createdBy, row.createdAtDevice, row.deviceId,
    ].map(cell => custodyCell(cell)).join(',');
  }

  /**
   * @param {readonly string[]} header
   * @param {readonly string[]} lines
   */
  function csvDocument(header, lines) {
    return '\uFEFF' + [header.join(',')].concat(lines).join('\r\n') + '\r\n';
  }

  /**
   * @param {readonly Foreman[] | null | undefined} foremen
   * @param {readonly ForemanMove[] | null | undefined} moves
   * @param {readonly LedgerEntry[] | null | undefined} entries
   * @param {readonly LedgerProject[] | null | undefined} projects
   * @param {Record<string, unknown> | null | undefined} [errors]
   */
  function foremanCustodyToCSV(foremen, moves, entries, projects, errors) {
    const rows = foremanCustodyRows(foremen, moves, entries, projects, errors);
    return csvDocument(FOREMAN_CUSTODY_COLS, rows.map(custodyLine));
  }

  /**
   * @param {readonly Foreman[] | null | undefined} foremen
   * @param {string} id
   */
  function listedForemanName(foremen, id) {
    for (const person of foremen || []) {
      if (person && person.id === id) return typeof person.name === 'string' ? person.name : '';
    }
    return '';
  }

  /**
   * @param {readonly Foreman[] | null | undefined} foremen
   * @param {readonly ForemanMove[] | null | undefined} moves
   * @param {readonly LedgerEntry[] | null | undefined} entries
   * @param {Record<string, unknown> | null | undefined} [errors]
   */
  function foremanSummaryToCSV(foremen, moves, entries, errors) {
    const rows = foremanCustodyRows(foremen, moves, entries, null, errors);
    /** @type {string[]} */
    const ids = [];
    const seen = new Set();
    for (const person of foremen || []) {
      if (!person || typeof person.id !== 'string' || !person.id || seen.has(person.id)) continue;
      seen.add(person.id);
      ids.push(person.id);
    }
    /** @type {string[]} */
    const extra = [];
    for (const row of rows) {
      if (seen.has(row.foremanId)) continue;
      seen.add(row.foremanId);
      extra.push(row.foremanId);
    }
    extra.sort();
    const lines = ids.concat(extra).map(id => {
      const mine = rows.filter(row => row.foremanId === id);
      const add = (/** @type {string} */ bucket) => mine.reduce((total, row) => {
        if (row.bucket !== bucket || row.signed == null) return total;
        return total + row.signed;
      }, 0);
      const fig = foremanBalance(id, moves, entries, errors);
      /** @type {ForemanExportSummary} */
      const summary = {
        foremanId: id,
        foremanName: mine.length ? mine[0].foremanName : listedForemanName(foremen, id),
        advances: add('advance'),
        settled: add('settle'),
        spent: add('expense'),
        returned: add('return'),
        remaining: fig.remaining,
        owedToForeman: fig.owedToForeman,
      };
      return [
        summary.foremanId, summary.foremanName, summary.advances, summary.settled, summary.spent,
        summary.returned, summary.remaining, summary.owedToForeman,
      ].map(cell => custodyCell(cell)).join(',');
    });
    return csvDocument(FOREMAN_SUMMARY_COLS, lines);
  }

  /**
   * @param {unknown} check
   * @param {string} projectId
   * @param {readonly LedgerEntry[] | null | undefined} entries
   * @param {readonly Foreman[] | null | undefined} foremen
   * @param {Record<string, unknown> | null | undefined} errors
   */
  function guardedForemanDelete(check, projectId, entries, foremen, errors) {
    if (typeof check !== 'function') return DELETE_UNCHECKED;
    try {
      const msg = check(projectId, entries, foremen, errors);
      return typeof msg === 'string' ? msg : DELETE_UNCHECKED;
    } catch {
      return DELETE_UNCHECKED;
    }
  }

  return { ENTRY_TYPES, DEFAULT_POLICY, MAX_AMOUNT_IQD, PROJECT_ENTRY_PAGE, sign, totals, can, canSeeProject, visibleProjects, projectList, nextProjectStatus, visibleEntries,
    projectSummary, validateEntry, parseAmount, recorderName, displayRecorder, reversalId, createLedger, makeReversal, toCSV, CSV_COLS, canExportCSV, canCreateProject, countedEntries, fmt, subcontractBalance,
    baghdadTime, entryExportFields, entryToCSV, projectEntryList, foremanBalance, validateForemanMove, foremanMoveReversal, settleGuard, foremanDeleteBlock, guardedForemanDelete,
    rememberedProjectName, deletedProjectEntries, canExportRejected, rejectedLogoutBlocked, rejectedEntriesToCSV, REJECTED_HEADERS,
    FOREMAN_CUSTODY_COLS, FOREMAN_SUMMARY_COLS, foremanCustodyToCSV, foremanSummaryToCSV };
});
