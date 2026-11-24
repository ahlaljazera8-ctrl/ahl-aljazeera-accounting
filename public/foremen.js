// Foreman list, detail, and the settle sheet. Loaded before render.js.
// install receives the screen api. This file does not read render's locals.
(function (factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(globalThis, { ForemenUI: api });
})(/** @returns {ForemenUiApi} */ function () {
  'use strict';

  /** @type {RenderApi | null} */
  let api = null;
  const draft = { kind: 'advance', amount: '', note: '', name: '', project: '', formId: '', msg: '' };

  /**
   * @param {RenderApi} next
   */
  function install(next) {
    api = next;
    next.views.foremen = listView;
    next.views.foreman = detailView;
    next.views.foremannew = newView;
    next.views.foremanmove = moveView;
    next.titles.foremen = 'العُهد';
    next.titles.foreman = 'خلفة';
    next.titles.foremannew = 'خلفة جديد';
    next.titles.foremanmove = 'حركة';
  }

  /** @returns {RenderApi} */
  function ui() {
    if (!api) throw new Error('ForemenUI');
    return api;
  }

  function owner() {
    const user = me();
    return !!(user && Ledger.can(user, 'owner'));
  }

  /** @returns {Foreman[]} */
  function people() {
    const rows = get(K.foremen, []);
    return Array.isArray(rows) ? /** @type {Foreman[]} */ (rows) : [];
  }

  /** @returns {ForemanMove[]} */
  function moves() {
    const rows = get(K.foremanMoves, []);
    return Array.isArray(rows) ? /** @type {ForemanMove[]} */ (rows) : [];
  }

  /** @returns {LedgerEntry[]} */
  function entries() {
    const rows = get(K.entries, []);
    return Array.isArray(rows) ? /** @type {LedgerEntry[]} */ (rows) : [];
  }

  /** @returns {Record<string, unknown>} */
  function syncErrors() {
    const rows = get(K.syncErrors, {});
    return rows && typeof rows === 'object' ? /** @type {Record<string, unknown>} */ (rows) : {};
  }

  /** @returns {LedgerProject[]} */
  function projects() {
    const rows = get(K.projects, []);
    return Array.isArray(rows) ? /** @type {LedgerProject[]} */ (rows) : [];
  }

  /**
   * @param {string} kind
   * @param {string} id
   */
  function href(kind, id) {
    if (!DomSafe.isSafeId(id)) return '#foremen';
    if (kind !== 'foreman' && kind !== 'foremannew' && kind !== 'foremanmove') return '#foremen';
    return '#' + kind + '/' + DomSafe.projectAttr(id);
  }

  /**
   * @param {number} lastSyncMs
   * @param {(ms: number) => string} [format]
   */
  function syncLine(lastSyncMs, format) {
    if (!lastSyncMs) return 'لم يُحدَّث منذ فتح التطبيق';
    const text = typeof format === 'function' ? format(lastSyncMs) : '';
    return 'آخر تحديث من الخادم: ' + text;
  }

  /**
   * @param {string} kind
   * @param {number} amount
   * @param {number} owed
   * @returns {SettleParts}
   */
  function settleParts(kind, amount, owed) {
    const n = Ledger.fmt(amount);
    if (kind === 'return') return { lead: 'سيُسجّل استلام ', amount: n, tail: ' د.ع.', after: '' };
    if (kind !== 'settle') return { lead: 'سيُسجّل سلفة بمبلغ ', amount: n, tail: ' د.ع.', after: '' };
    let after = 'لا يُحذف القيد: الخطأ يُصحَّح بقيد عكسي.';
    if (amount === owed && owed > 0) after = 'بعده يصبح الرصيد صفراً. ' + after;
    else if (amount > 0 && amount < owed) after = 'بعده يبقى مستحق ' + Ledger.fmt(owed - amount) + ' د.ع. ' + after;
    return { lead: 'سيُسجّل قيد تسوية بمبلغ ', amount: n, tail: ' د.ع بتاريخ اليوم. ', after };
  }

  /**
   * @param {string} foremanId
   * @param {readonly ForemanMove[]} moveRows
   * @param {readonly LedgerEntry[]} entryRows
   * @param {Record<string, unknown>} errors
   */
  function figures(foremanId, moveRows, entryRows, errors) {
    const fig = Ledger.foremanBalance(foremanId, moveRows, entryRows, errors);
    let advances = 0;
    let spent = 0;
    for (const move of moveRows) {
      if (!move || !move.id || errors[move.id] || move.foremanId !== foremanId || move.kind !== 'advance') continue;
      if (typeof move.amount !== 'number' || !Number.isFinite(move.amount)) continue;
      advances += move.amount * (move.isReversal ? -1 : 1);
    }
    for (const row of entryRows) {
      if (!row || !row.id || errors[row.id] || row.foremanId !== foremanId || row.direction !== 'expense') continue;
      if (typeof row.amount !== 'number' || !Number.isFinite(row.amount)) continue;
      spent += row.amount * (row.isReversal ? -1 : 1);
    }
    return { fig, advances, spent };
  }

  /** @param {Foreman | undefined} person */
  function projectMissing(person) {
    if (!person || !person.projectId) return false;
    const project = projects().find(item => item && item.id === person.projectId);
    return !project || project.status === 'archived';
  }

  /** @param {string} [arg] */
  function listView(arg) {
    void arg;
    const screen = ui();
    if (!owner()) return '<div class="card">هذه الشاشة للمالك.</div>';
    const errs = syncErrors();
    const moveRows = moves();
    const entryRows = entries();
    const cards = people().map(person => {
      if (!person || !person.id) return '';
      const sum = figures(person.id, moveRows, entryRows, errs);
      const state = sum.fig.state;
      const badge = state === 'holding' ? '<span class="pill ok">لديه رصيد</span>' : state === 'owed' ? '<span class="pill warn">مستحق له</span>' : '<span class="pill">مسوّى</span>';
      const line = state === 'owed' ? 'مستحق للخلفة' : state === 'holding' ? 'المتبقي معه' : 'الرصيد';
      const shown = state === 'owed' ? sum.fig.owedToForeman : state === 'holding' ? sum.fig.remaining : 0;
      const rule = state === 'owed' ? ' fm-rule owe' : state === 'holding' ? ' fm-rule hold' : '';
      const latest = entryRows.filter(row => row && row.foremanId === person.id && row.entryDate).map(row => String(row.entryDate)).sort().pop();
      const when = latest ? '<div class="note">آخر مصروف <bdi class="num">' + screen.esc(latest) + '</bdi></div>' : '';
      return '<a class="card proj" href="' + href('foreman', person.id) + '"><div class="subhead"><h2>' + screen.esc(person.name || '') + '</h2>' + badge + '</div>'
        + (person.note ? '<div class="note">' + screen.esc(person.note) + '</div>' : '')
        + when
        + '<div class="kv"><span>السلف</span>' + screen.money(sum.advances) + '</div>'
        + '<div class="kv"><span>مجموع المصروف</span>' + screen.money(sum.spent) + '</div>'
        + '<div class="kv' + rule + '"><span>' + line + '</span>' + screen.money(shown, state === 'owed' ? 'fm-owe' : state === 'holding' ? 'fm-hold' : '') + '</div></a>';
    }).join('');
    const user = me();
    const exportBtn = user && Ledger.canExportCSV(user)
      ? '<button type="button" class="btn ghost" data-fm="export">تصدير العهدة (CSV)</button>'
      : '';
    const noteRaw = screen.state.fmExportNote;
    const noteText = typeof noteRaw === 'string' ? noteRaw : '';
    const note = noteText ? '<div class="note" id="fm-export-note">' + screen.esc(noteText) + '</div>' : '';
    return (cards || '<div class="card"><div class="note">لا توجد خلفات.</div></div>') + '<a class="btn" href="#foremannew">+ خلفة جديد</a>' + exportBtn + note;
  }

  /** @param {string} id */
  function detailView(id) {
    const screen = ui();
    if (!owner()) return '<div class="card">هذه الشاشة للمالك.</div>';
    if (!DomSafe.isSafeId(id)) return '<div class="card">معرّف غير صالح</div>';
    const person = people().find(item => item && item.id === id);
    if (!person) return '<div class="card">الخلفة غير متاح</div>';
    const errs = syncErrors();
    const sum = figures(id, moves(), entries(), errs);
    const state = sum.fig.state;
    const badge = state === 'holding' ? '<span class="pill ok">لديه رصيد</span>' : state === 'owed' ? '<span class="pill warn">مستحق له</span>' : '<span class="pill">مسوّى</span>';
    const gone = projectMissing(person) ? '<div class="warnbox">المشروع الافتراضي محذوف</div>' : '';
    const payer = me();
    const payerName = payer && payer.displayName ? ' على ' + screen.esc(payer.displayName) : '';
    const explain = state === 'owed'
      ? '<div class="warnbox" id="fm-owed">صرف ' + screen.esc(person.name || '') + ' من جيبه ' + Ledger.fmt(sum.fig.owedToForeman) + ' د.ع فوق السلفة. هذا المبلغ دين' + payerName + ' حتى التسوية.</div>'
      : '';
    const balance = state === 'owed'
      ? '<div class="kv fm-rule owe"><span>مستحق للخلفة</span>' + screen.money(sum.fig.owedToForeman, 'fm-owe') + '</div>'
      : state === 'holding'
        ? '<div class="kv fm-rule hold"><span>المتبقي معه</span>' + screen.money(sum.fig.remaining, 'fm-hold') + '</div>'
        : '<div class="kv"><span>الرصيد</span>' + screen.money(0) + '</div>';
    const settle = state === 'owed'
      ? '<button type="button" class="btn" data-fm="settle" data-id="' + DomSafe.projectAttr(id) + '">تسديد المستحق (' + Ledger.fmt(sum.fig.owedToForeman) + ')</button>'
      : '';
    const ret = state === 'holding'
      ? '<button type="button" class="btn ghost" data-fm="return" data-id="' + DomSafe.projectAttr(id) + '">استلام المتبقي (' + Ledger.fmt(sum.fig.remaining) + ')</button>'
      : '';
    const advance = state === 'owed' ? '' : '<button type="button" class="btn ghost" data-fm="advance" data-id="' + DomSafe.projectAttr(id) + '">+ سلفة جديدة</button>';
    const spend = '<button type="button" class="btn" data-fm="expense" data-id="' + DomSafe.projectAttr(id) + '">+ مصروف من العهدة</button>';
    return '<button type="button" class="mini" data-fm="back">رجوع</button><div class="card"><div class="subhead"><h2>' + screen.esc(person.name || '') + '</h2>' + badge + '</div>'
      + (person.note ? '<div class="note">' + screen.esc(person.note) + '</div>' : '')
      + explain
      + gone
      + '<div class="kv"><span>السلف</span>' + screen.money(sum.advances) + '</div>'
      + '<div class="kv"><span>مجموع المصروف</span>' + screen.money(sum.spent) + '</div>'
      + balance + '</div>'
      + settle + spend + advance + ret
      + history(id, screen);
  }

  /**
   * @param {string} id
   * @param {RenderApi} screen
   */
  function history(id, screen) {
    const errs = syncErrors();
    const advanceRows = moves().filter(move => move && move.foremanId === id && !errs[/** @type {string} */ (move.id)]);
    const spent = entries().filter(row => row && row.foremanId === id && row.direction === 'expense' && !errs[/** @type {string} */ (row.id)]);
    const moveHtml = advanceRows.map(move => {
      const sign = move.isReversal ? -1 : 1;
      const cls = move.kind === 'advance' ? 'ok' : '';
      const label = move.kind === 'settle' ? 'تسديد' : move.kind === 'return' ? 'استلام' : 'سلفة';
      const rev = !move.isReversal && !advanceRows.some(other => other && other.isReversal && other.reversesMoveId === move.id)
        ? '<button type="button" class="mini" data-fm="reverse" data-id="' + DomSafe.projectAttr(move.id || '') + '">عكس</button>'
        : '';
      const note = move.note ? screen.esc(move.note) + ' · ' : '';
      return '<div class="entry"><div class="meta"><span>' + label + '</span><small>' + note + '<bdi class="num">' + screen.esc(move.date || '') + '</bdi></small></div><span class="num ' + cls + '">' + Ledger.fmt((move.amount || 0) * sign) + '</span>' + rev + '</div>';
    }).join('');
    const spentHtml = spent.map(row => {
      const sign = row.isReversal ? -1 : 1;
      const when = row.entryDate == null ? '' : String(row.entryDate);
      return '<div class="entry"><div class="meta"><span>' + screen.esc(row.description || 'مصروف') + '</span><small><bdi class="num">' + screen.esc(when) + '</bdi></small></div><span class="num">' + Ledger.fmt((row.amount || 0) * sign * -1) + '</span></div>';
    }).join('');
    return '<div class="card"><h2>السلف</h2>' + (moveHtml || '<div class="note">لا توجد سلف.</div>') + '</div>'
      + '<div class="card"><h2>المصاريف</h2>' + (spentHtml || '<div class="note">لا توجد مصاريف.</div>') + '</div>';
  }

  /** @param {string} [arg] */
  function newView(arg) {
    void arg;
    const screen = ui();
    if (!owner()) return '<div class="card">هذه الشاشة للمالك.</div>';
    if (typeof document === 'undefined' || !document.getElementById('fm-name')) {
      draft.name = '';
      draft.note = '';
      draft.project = '';
      draft.msg = '';
      draft.formId = uuid();
    } else capture();
    const opts = projects().filter(project => project && project.status !== 'archived' && DomSafe.isSafeId(project.id)).map(project => {
      const id = /** @type {string} */ (project.id);
      return '<option value="' + DomSafe.projectAttr(id) + '"' + (id === draft.project ? ' selected' : '') + '>' + screen.esc(project.name || id) + '</option>';
    }).join('');
    return '<div class="card"><label class="field">الاسم<input id="fm-name" class="full" maxlength="100" value="' + screen.esc(draft.name) + '"></label>'
      + '<label class="field">ملاحظة<input id="fm-person-note" class="full" maxlength="200" value="' + screen.esc(draft.note) + '"></label>'
      + '<label class="field">المشروع الافتراضي (اختياري)<select id="fm-project" class="full"><option value="">—</option>' + opts + '</select></label>'
      + '<button type="button" class="btn" data-fm="save-foreman">حفظ</button>'
      + '<div class="msg">' + screen.esc(draft.msg) + '</div></div>';
  }

  /** @param {string} id */
  function moveView(id) {
    const screen = ui();
    const detail = detailView(id);
    if (!owner() || !DomSafe.isSafeId(id)) return detail;
    const person = people().find(item => item && item.id === id);
    if (!person) return detail;
    const nowMs = Date.now();
    const rawBox = get(K.outbox, []);
    /** @type {string[]} */
    const outbox = [];
    if (Array.isArray(rawBox)) rawBox.forEach(item => { if (typeof item === 'string') outbox.push(item); });
    const guard = Ledger.settleGuard(id, {
      outbox,
      moves: moves(),
      entries: entries(),
      lastSyncMs: screen.lastSyncAt(),
      nowMs,
    });
    const owed = figures(id, moves(), entries(), syncErrors()).fig.owedToForeman;
    if (typeof document !== 'undefined' && document.getElementById('fm-amount')) capture();
    const kind = screen.state.fmKind === 'settle' || screen.state.fmKind === 'return' || screen.state.fmKind === 'advance' ? screen.state.fmKind : draft.kind;
    const amountText = typeof screen.state.fmAmount === 'string' ? screen.state.fmAmount : draft.amount;
    const parsed = Ledger.parseAmount(amountText);
    const amount = parsed.ok && typeof parsed.amount === 'number' ? parsed.amount : 0;
    const parts = settleParts(kind, amount, owed);
    const over = kind === 'settle' && parsed.ok && amount > owed;
    const title = kind === 'settle' ? 'تسديد المستحق ل' + (person.name || '') : kind === 'return' ? 'استلام المتبقي' : 'سلفة جديدة';
    let stale = '<p class="note" id="fm-sync">' + screen.esc(syncLine(screen.lastSyncAt(), screen.formatSyncTime)) + '</p>';
    if (guard.stale) {
      const pending = guard.pendingIds.length
        ? ' على هذا الهاتف ' + (guard.pendingIds.length === 1 ? 'قيد واحد' : String(guard.pendingIds.length) + ' قيود') + ' لهذا الخلفة لم يُرسل بعد — حدّث قبل التسديد.'
        : '';
      stale = '<div class="warnbox" id="fm-sync">' + screen.esc(syncLine(screen.lastSyncAt(), screen.formatSyncTime) + (pending ? '،' + pending : '')) + '</div>'
        + '<button type="button" class="btn ghost" data-fm="refresh">تحديث الآن</button>';
    }
    const sheet = '<p id="fm-sheet-title">' + screen.esc(title) + '</p>'
      + '<p class="copy" id="fm-copy" aria-live="polite">' + screen.esc(parts.lead) + '<b class="num" id="fm-amt-text">' + screen.esc(parts.amount) + '</b>' + screen.esc(parts.tail) + '<span id="fm-after">' + screen.esc(parts.after) + '</span></p>'
      + '<div id="fm-over" class="warnbox" aria-live="polite"' + (over ? '' : ' hidden') + '>المبلغ أكبر من المستحق. الفرق يظهر كمتبقي معه.</div>'
      + '<label class="field">المبلغ<input id="fm-amount" class="full num" inputmode="numeric" value="' + screen.esc(amountText) + '"></label>'
      + '<label class="field">ملاحظة<input id="fm-note" class="full" maxlength="200" placeholder="اختياري" value="' + screen.esc(draft.note) + '"></label>'
      + stale
      + '<button type="button" class="btn" data-fm="save-move" data-id="' + DomSafe.projectAttr(id) + '">' + (kind === 'settle' ? 'تأكيد التسديد' : 'حفظ') + '</button>'
      + '<button type="button" class="btn ghost" data-fm="cancel" data-id="' + DomSafe.projectAttr(id) + '">إلغاء</button>'
      + '<div class="msg">' + screen.esc(draft.msg) + '</div>';
    return detail + screen.confirmShell(sheet, 'fm-sheet-title');
  }

  /**
   * @param {string} kind
   * @param {string} id
   */
  function openMove(kind, id) {
    const screen = ui();
    const sum = figures(id, moves(), entries(), syncErrors());
    const prefill = kind === 'settle' ? sum.fig.owedToForeman : kind === 'return' ? sum.fig.remaining : 0;
    draft.kind = kind;
    draft.formId = uuid();
    draft.note = '';
    draft.msg = '';
    draft.amount = prefill ? Ledger.fmt(prefill) : '';
    screen.state.fmKind = kind;
    screen.state.fmAmount = draft.amount;
    location.hash = href('foremanmove', id);
  }

  const CUSTODY_FALLBACK = 'ما انفتحت المشاركة، فانحفظ ملفين بالتنزيلات: ملف العهدة وملف الملخص.';

  function exportCustody() {
    const user = me();
    if (!user || !Ledger.canExportCSV(user)) return;
    const screen = ui();
    const saveFiles = screen.saveCsvFiles;
    if (typeof saveFiles !== 'function') return;
    const errs = syncErrors();
    const custody = Ledger.foremanCustodyToCSV(people(), moves(), entries(), projects(), errs);
    const summary = Ledger.foremanSummaryToCSV(people(), moves(), entries(), errs);
    const pending = saveFiles([
      { csv: custody, filename: 'aj-foreman-custody-' + today() + '.csv' },
      { csv: summary, filename: 'aj-foreman-summary-' + today() + '.csv' },
    ]);
    pending.then(result => {
      screen.state.fmExportNote = result === 'downloaded' ? CUSTODY_FALLBACK : '';
      if (location.hash === '#foremen') screen.render();
    });
  }

  /** @param {HTMLButtonElement} b */
  function onClick(b) {
    const action = b.dataset.fm;
    if (!action) return false;
    if (b.disabled) return true;
    const id = b.dataset.id || '';
    if (action === 'back') { location.hash = '#foremen'; return true; }
    if (action === 'export') { exportCustody(); return true; }
    if (action === 'cancel') { location.hash = href('foreman', id); return true; }
    if (action === 'refresh') {
      if (demoRole()) sendNow();
      else void flushRemote();
      return true;
    }
    if (action === 'settle' || action === 'return' || action === 'advance') { openMove(action === 'advance' ? 'advance' : action, id); return true; }
    if (action === 'expense') { openExpense(id); return true; }
    if (action === 'save-foreman') { b.disabled = true; saveForeman(b); return true; }
    if (action === 'save-move') { b.disabled = true; saveMove(id, b); return true; }
    if (action === 'reverse') { reverseMove(id); return true; }
    return false;
  }

  /** @param {string} id */
  function openExpense(id) {
    const person = people().find(item => item && item.id === id);
    const screen = ui();
    screen.state.foremanId = id;
    screen.state.fmCarry = true;
    screen.state.type = 'materials';
    if (person && !projectMissing(person) && person.projectId) screen.state.projectId = person.projectId;
    screen.state.fmGone = person && projectMissing(person) ? 'المشروع الافتراضي محذوف' : '';
    location.hash = '#entry';
  }

  /** @param {HTMLButtonElement} button */
  function saveForeman(button) {
    const screen = ui();
    const user = me();
    if (!owner() || !user) { button.disabled = false; return; }
    const nameEl = document.getElementById('fm-name');
    const noteEl = document.getElementById('fm-person-note');
    const projectEl = document.getElementById('fm-project');
    const name = (nameEl instanceof HTMLInputElement ? nameEl.value : draft.name).trim();
    const note = (noteEl instanceof HTMLInputElement ? noteEl.value : draft.note).trim();
    const projectId = projectEl instanceof HTMLSelectElement ? projectEl.value : draft.project;
    if (!name || name.length > 100) { draft.msg = 'أدخل اسم الخلفة'; draft.name = name; button.disabled = false; screen.render(); return; }
    if (note.length > 200) { draft.msg = 'الملاحظة بحد أقصى 200 حرفاً'; button.disabled = false; screen.render(); return; }
    const id = draft.formId || uuid();
    draft.formId = id;
    const all = people();
    if (!all.some(item => item && item.id === id)) {
      /** @type {Foreman} */
      const row = { id, docType: 'foreman', name, note, createdBy: user.uid, createdAtServer: null };
      if (projectId && DomSafe.isSafeId(projectId)) row.projectId = projectId;
      set(K.foremen, all.concat([row]));
      screen.queueDoc(id);
    }
    draft.formId = '';
    draft.name = '';
    draft.note = '';
    draft.project = '';
    draft.msg = '';
    location.hash = href('foreman', id);
  }

  /**
   * @param {string} foremanId
   * @param {HTMLButtonElement} button
   */
  function saveMove(foremanId, button) {
    const screen = ui();
    const user = me();
    if (!owner() || !user) { button.disabled = false; return; }
    capture();
    const parsed = Ledger.parseAmount(draft.amount);
    if (!parsed.ok) { draft.msg = parsed.error || 'المبلغ غير صالح'; button.disabled = false; screen.render(); return; }
    const id = draft.formId || uuid();
    draft.formId = id;
    const all = moves();
    if (!parsed.ok || typeof parsed.amount !== 'number') { draft.msg = 'المبلغ غير صالح'; button.disabled = false; screen.render(); return; }
    if (!all.some(item => item && item.id === id)) {
      const picked = screen.state.fmKind === 'settle' || screen.state.fmKind === 'return' || screen.state.fmKind === 'advance' ? screen.state.fmKind : draft.kind;
      const kind = picked === 'settle' || picked === 'return' ? picked : 'advance';
      /** @type {ForemanMove} */
      const row = {
        id, docType: 'foremanMove', foremanId, kind, amount: parsed.amount,
        date: today(), note: draft.note.trim(), isReversal: false, createdAtDevice: Date.now(), createdAtServer: null,
        createdBy: user.uid, deviceId: typeof deviceId === 'string' && deviceId ? deviceId : 'local',
      };
      const errs = Ledger.validateForemanMove(row, { user, moves: all, foremen: people() });
      if (errs.length) { draft.msg = errs[0] || 'تعذر الحفظ'; button.disabled = false; screen.render(); return; }
      set(K.foremanMoves, all.concat([row]));
      screen.queueDoc(id);
    }
    draft.formId = '';
    draft.amount = '';
    draft.note = '';
    draft.msg = '';
    location.hash = href('foreman', foremanId);
  }

  /** @param {string} id */
  function reverseMove(id) {
    const screen = ui();
    const user = me();
    if (!owner() || !user) return;
    const all = moves();
    const orig = all.find(item => item && item.id === id);
    if (!orig) return;
    const reason = prompt('سبب التصحيح:', 'خطأ في الإدخال');
    if (!reason) return;
    const rev = Ledger.foremanMoveReversal(orig, {
      user, reason, now: Date.now(), deviceId: typeof deviceId === 'string' && deviceId ? deviceId : 'local', date: today(),
    });
    const errs = Ledger.validateForemanMove(rev, { user, moves: all, foremen: people() });
    if (errs.length) { draft.msg = errs[0] || 'تعذر العكس'; screen.render(); return; }
    if (rev.id && !all.some(item => item && item.id === rev.id)) {
      set(K.foremanMoves, all.concat([rev]));
      screen.queueDoc(rev.id);
    }
    screen.render();
  }

  function capture() {
    if (typeof document === 'undefined') return;
    const amount = document.getElementById('fm-amount');
    const note = document.getElementById('fm-note');
    const name = document.getElementById('fm-name');
    const personNote = document.getElementById('fm-person-note');
    const project = document.getElementById('fm-project');
    if (amount instanceof HTMLInputElement) {
      draft.amount = amount.value;
      if (api) api.state.fmAmount = amount.value;
    }
    if (note instanceof HTMLInputElement) draft.note = note.value;
    if (name instanceof HTMLInputElement) draft.name = name.value;
    if (personNote instanceof HTMLInputElement) draft.note = personNote.value;
    if (project instanceof HTMLSelectElement) draft.project = project.value;
  }

  /** @param {HTMLElement} el */
  function onInput(el) {
    if (!el) return false;
    if (el.id !== 'fm-amount' && el.id !== 'fm-note' && el.id !== 'fm-name' && el.id !== 'fm-person-note' && el.id !== 'fm-project') return false;
    if (el.id === 'fm-amount') {
      const host = /** @type {typeof globalThis & { AccountPayment?: { applyGroupedAmount?: (input: HTMLInputElement) => void } }} */ (globalThis);
      if (typeof host.AccountPayment !== 'undefined' && host.AccountPayment && typeof host.AccountPayment.applyGroupedAmount === 'function') {
        host.AccountPayment.applyGroupedAmount(/** @type {HTMLInputElement} */ (el));
      }
    }
    const value = el instanceof HTMLInputElement || el instanceof HTMLSelectElement ? el.value : '';
    if (el.id === 'fm-amount') {
      draft.amount = value;
      if (api) api.state.fmAmount = value;
    }
    else if (el.id === 'fm-note' || el.id === 'fm-person-note') draft.note = value;
    else if (el.id === 'fm-name') draft.name = value;
    else draft.project = value;
    if (el.id !== 'fm-amount' || typeof document === 'undefined' || !api) return true;
    const screen = api;
    const foremanId = (location.hash.split('/')[1]) || '';
    const owed = figures(foremanId, moves(), entries(), syncErrors()).fig.owedToForeman;
    const parsed = Ledger.parseAmount(draft.amount);
    const amount = parsed.ok && typeof parsed.amount === 'number' ? parsed.amount : 0;
    const kind = typeof screen.state.fmKind === 'string' ? screen.state.fmKind : draft.kind;
    const parts = settleParts(kind, amount, owed);
    const amountNode = document.getElementById('fm-amt-text');
    const afterNode = document.getElementById('fm-after');
    const overNode = document.getElementById('fm-over');
    if (amountNode) amountNode.textContent = parts.amount;
    if (afterNode) afterNode.textContent = parts.after;
    if (overNode) overNode.hidden = !(kind === 'settle' && parsed.ok && amount > owed);
    return true;
  }

  return { install, onClick, onInput, settleParts, syncLine };
});
