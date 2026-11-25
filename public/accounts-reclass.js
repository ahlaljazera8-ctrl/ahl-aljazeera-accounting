// Old labour rows that may be advances. Loaded after accounts-statement.js and before render.js.
(function (factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(globalThis, { AccountReclass: api });
})(/** @returns {AccountReclassApi} */ function () {
  'use strict';

  const TOKEN_RE = /^L:([A-Za-z0-9_-]{1,64});/;
  const DESC_MAX = 500;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  /** Byte-equal copies of existing sentences; U31 pins them. Not new strings. */
  const SENTENCE = {
    dependent: 'اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً',
  };
  /** Approved L strings S2-S8 (ameer:33). */
  const STRINGS = {
    owedHeading: 'سلفة لم تُكتب بعد',
    duplicate: 'سلفة مكررة',
    question: 'هل خُصم هذا المبلغ من عمل المقاول؟',
    listHeading: 'قيود مصروف قد تكون سلفاً',
    cancel: 'ملغى',
    corrected: 'سطر مصحّح',
    archived: 'المشروع مؤرشف، لا يُلغى القيد',
  };
  const REFUSED = 'رُفض الإرسال';
  const WARN = 'تنبيه فقط، ولا يمنع تسجيل دفعة';
  const DATE_LABEL = 'تاريخ القيد';
  const REASON_LABEL = 'سبب التصحيح';
  const SAVE = 'حفظ';
  const ADVANCE = 'سلفة';
  const REVERSE = 'عكس';
  const DEDUCTED = 'انخصم';
  const IQD = ' د.ع';
  /** @type {Readonly<Record<string, number>>} */
  const FIRST_RANK = { bothFacts: 0, open: 1, revRefused: 2, reviewRefused: 3, reviewed: 4 };

  const screen = {
    openCancel: '',
    openAdvance: '',
    /** @type {Record<string, string>} */
    advanceIds: {},
    /** @type {Record<string, string>} */
    partyPick: {},
    msg: '',
  };
  /** @type {RenderApi | null} */
  let viewApi = null;

  function resetScreen() {
    screen.openCancel = '';
    screen.openAdvance = '';
    screen.advanceIds = {};
    screen.partyPick = {};
    screen.msg = '';
  }

  /** @param {string} expenseId @returns {string} */
  function token(expenseId) {
    return 'L:' + expenseId + ';';
  }

  /** @param {unknown} description @returns {string} */
  function tokenOf(description) {
    if (typeof description !== 'string') return '';
    const match = TOKEN_RE.exec(description);
    return match ? match[1] : '';
  }

  /**
   * @param {string} text
   * @returns {string}
   */
  function cutDesc(text) {
    if (text.length <= DESC_MAX) return text;
    let out = '';
    const chars = Array.from(text);
    for (let i = 0; i < chars.length; i++) {
      const next = out + chars[i];
      if (next.length > DESC_MAX) break;
      out = next;
    }
    return out;
  }

  /** @param {unknown} value @returns {string} */
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** @param {number | undefined} amount */
  function money(amount) {
    return Ledger.fmt(typeof amount === 'number' ? amount : 0) + IQD;
  }

  function ownerOn() {
    const user = me();
    return !!(user && user.role === 'owner' && user.active !== false);
  }

  /**
   * @param {LedgerEntry | null | undefined} entry
   */
  function labourExpense(entry) {
    return !!(entry && entry.entryType === 'labour' && entry.direction === 'expense' && entry.isReversal !== true && !entry.foremanId);
  }

  /**
   * @param {readonly LedgerEntry[]} entries
   * @param {Readonly<Record<string, unknown>>} syncErrors
   * @returns {readonly LedgerEntry[]}
   */
  function misbookedCandidates(entries, syncErrors) {
    return Ledger.countedEntries(entries, syncErrors)
      .filter(entry => labourExpense(entry))
      .slice()
      .sort(byDateThenId);
  }

  /**
   * @param {LedgerEntry} a
   * @param {LedgerEntry} b
   */
  function byDateThenId(a, b) {
    const date = String(a.entryDate || '').localeCompare(String(b.entryDate || ''));
    if (date) return date;
    return String(a.id || '').localeCompare(String(b.id || ''));
  }

  /**
   * @param {FoldDoc} a
   * @param {FoldDoc} b
   */
  function byTimeThenId(a, b) {
    const left = stampOf(a);
    const right = stampOf(b);
    if (left !== right) return left - right;
    return String(a.id || '').localeCompare(String(b.id || ''));
  }

  /** @param {FoldDoc | null | undefined} row */
  function stampOf(row) {
    const stamp = row && /** @type {{ createdAtServer?: unknown }} */ (row).createdAtServer;
    return typeof stamp === 'number' ? stamp : Number.POSITIVE_INFINITY;
  }

  /**
   * @param {FoldDoc | LedgerEntry | LaborReview | null | undefined} row
   * @param {Readonly<Record<string, unknown>>} syncErrors
   * @param {readonly string[]} outbox
   */
  function acceptedDoc(row, syncErrors, outbox) {
    if (!row || typeof row.id !== 'string') return false;
    const stamp = /** @type {{ createdAtServer?: unknown }} */ (row).createdAtServer;
    if (typeof stamp !== 'number') return false;
    if (syncErrors && Object.prototype.hasOwnProperty.call(syncErrors, row.id)) return false;
    return (outbox || []).indexOf(row.id) === -1;
  }

  /**
   * @param {LedgerEntry | null | undefined} rev
   * @param {string} expenseId
   */
  function isLRev(rev, expenseId) {
    return !!(rev && rev.isReversal === true && typeof rev.description === 'string' && rev.description.startsWith(token(expenseId)));
  }

  /**
   * @param {string} expenseId
   * @param {readonly LaborReview[]} reviews
   */
  function reviewOf(expenseId, reviews) {
    const id = 'lrv_' + expenseId;
    return (reviews || []).find(row => row && row.id === id) || null;
  }

  /**
   * @param {string} expenseId
   * @param {readonly LedgerEntry[]} entries
   */
  function revOf(expenseId, entries) {
    const id = 'rev_' + expenseId;
    return (entries || []).find(row => row && row.id === id) || null;
  }

  /**
   * @param {string} expenseId
   * @param {readonly FoldDoc[]} txns
   * @param {RowIndex} index
   * @returns {readonly FoldDoc[]}
   */
  function coveringAdvances(expenseId, txns, index) {
    const prefix = token(expenseId);
    return (txns || [])
      .filter(row => {
        if (!row || row.purpose !== 'advanceLabor' || row.kind !== 'body') return false;
        const description = /** @type {{ description?: unknown }} */ (row).description;
        if (typeof description !== 'string' || !description.startsWith(prefix)) return false;
        return Accounts.rowLive(row, index);
      })
      .slice()
      .sort(byTimeThenId);
  }

  /**
   * @param {string} advanceId
   * @param {RowIndex} index
   */
  function hasLiveDraw(advanceId, index) {
    const byId = index && index.byId ? index.byId : {};
    return Object.keys(byId).some(id => {
      const row = byId[id];
      if (!row || !Accounts.rowLive(row, index)) return false;
      if (row.purpose === 'returnAdvance' && row.targetId === advanceId) return true;
      return row.purpose === 'settle' && row.settlesId === advanceId;
    });
  }

  /**
   * @param {readonly FoldDoc[]} covering
   * @param {RowIndex} index
   * @returns {DuplicatePlan}
   */
  function duplicatePlan(covering, index) {
    const rows = covering || [];
    const first = rows[0];
    const same = rows.length > 0 && rows.every(row => row && row.partyId === (first && first.partyId));
    const mode = same ? 'oldest' : 'ownerPicks';
    const ranked = rows.slice().sort(byTimeThenId);
    const keepId = mode === 'oldest' && ranked[0] && typeof ranked[0].id === 'string' ? ranked[0].id : '';
    if (rows.some(row => typeof /** @type {{ createdAtServer?: unknown }} */ (row).createdAtServer !== 'number')) {
      return { mode, keepId, reverseIds: [], blockedIds: [] };
    }
    /** @type {string[]} */
    const reverseIds = [];
    /** @type {string[]} */
    const blockedIds = [];
    rows.forEach(row => {
      if (!row || typeof row.id !== 'string' || row.id === keepId) return;
      if (hasLiveDraw(row.id, index)) blockedIds.push(row.id);
      else reverseIds.push(row.id);
    });
    return { mode, keepId, reverseIds, blockedIds };
  }

  /**
   * @param {string} expenseId
   * @param {readonly FoldDoc[]} txns
   * @param {Readonly<Record<string, unknown>>} syncErrors
   * @returns {readonly string[]}
   */
  function refusedAdvanceIds(expenseId, txns, syncErrors) {
    const prefix = token(expenseId);
    /** @type {string[]} */
    const ids = [];
    (txns || []).forEach(row => {
      if (!row || row.purpose !== 'advanceLabor' || typeof row.id !== 'string') return;
      const description = /** @type {{ description?: unknown }} */ (row).description;
      if (typeof description !== 'string' || !description.startsWith(prefix)) return;
      if (syncErrors && Object.prototype.hasOwnProperty.call(syncErrors, row.id)) ids.push(row.id);
    });
    return ids;
  }

  /**
   * @param {LedgerEntry} expense
   * @param {ReclassCtx} ctx
   * @returns {ReclassState}
   */
  function rowState(expense, ctx) {
    const id = typeof expense.id === 'string' ? expense.id : '';
    const errors = ctx.syncErrors || {};
    const outbox = ctx.outbox || [];
    const review = reviewOf(id, ctx.reviews || []);
    const rev = revOf(id, ctx.entries || []);
    const reviewAccepted = !!(review && acceptedDoc(review, errors, outbox));
    const reviewLive = !!(review && typeof review.id === 'string' && !Object.prototype.hasOwnProperty.call(errors, review.id));
    const lRev = isLRev(rev, id);
    const revAccepted = !!(lRev && rev && acceptedDoc(rev, errors, outbox));
    const covering = coveringAdvances(id, ctx.txns || [], ctx.index);
    if (reviewAccepted && revAccepted && review && rev) {
      return {
        kind: 'bothFacts',
        expense,
        review,
        revId: /** @type {string} */ (rev.id),
        advanceIds: covering.map(row => /** @type {string} */ (row.id)),
      };
    }
    if (revAccepted && covering.length >= 2) {
      return { kind: 'duplicate', expense, plan: duplicatePlan(covering, ctx.index) };
    }
    if (revAccepted && covering.length === 1 && typeof /** @type {{ createdAtServer?: unknown }} */ (covering[0]).createdAtServer === 'number') {
      return { kind: 'done', expense, advanceId: /** @type {string} */ (covering[0].id) };
    }
    if (revAccepted && covering.length === 1) {
      return { kind: 'advQueued', expense, advanceId: /** @type {string} */ (covering[0].id) };
    }
    if (revAccepted && rev) {
      return { kind: 'owed', expense, revId: /** @type {string} */ (rev.id), refusedAdvanceIds: refusedAdvanceIds(id, ctx.txns || [], errors) };
    }
    if (lRev && rev && typeof rev.id === 'string' && !Object.prototype.hasOwnProperty.call(errors, rev.id)) {
      return { kind: 'revQueued', expense, revId: rev.id };
    }
    if (rev && typeof rev.id === 'string' && !lRev && !Object.prototype.hasOwnProperty.call(errors, rev.id)) {
      return { kind: 'other', expense };
    }
    if (reviewLive && review) return { kind: 'reviewed', expense, review };
    if (rev && typeof rev.id === 'string' && Object.prototype.hasOwnProperty.call(errors, rev.id)) {
      return { kind: 'revRefused', expense, revId: rev.id };
    }
    if (review && Object.prototype.hasOwnProperty.call(errors, review.id)) {
      return { kind: 'reviewRefused', expense, reviewId: review.id };
    }
    const active = ctx.activeProjectIds instanceof Set && ctx.activeProjectIds.has(String(expense.projectId || ''));
    const canCancel = typeof expense.isReversal === 'boolean' && !Object.prototype.hasOwnProperty.call(expense, 'foremanId') && active;
    return { kind: 'open', expense, canCancel };
  }

  /**
   * @param {readonly LedgerEntry[]} entries
   * @param {readonly FoldDoc[]} txns
   * @param {Readonly<Record<string, unknown>>} syncErrors
   * @returns {ReclassCtx}
   */
  function ctxFrom(entries, txns, syncErrors) {
    const outbox = /** @type {string[]} */ (get(K.outbox, []) || []);
    const reviews = /** @type {LaborReview[]} */ (get(K.laborReviews, []) || []);
    const projects = /** @type {{ id?: string, status?: string }[]} */ (get(K.projects, []) || []);
    /** @type {Set<string>} */
    const activeProjectIds = new Set();
    projects.forEach(project => {
      if (project && project.status === 'active' && typeof project.id === 'string') activeProjectIds.add(project.id);
    });
    return {
      entries: entries || [],
      txns: txns || [],
      syncErrors: syncErrors || {},
      outbox,
      reviews,
      index: Accounts.rowIndex(txns || [], syncErrors || {}),
      activeProjectIds,
    };
  }

  function ctxNow() {
    return ctxFrom(
      /** @type {LedgerEntry[]} */ (get(K.entries, []) || []),
      /** @type {FoldDoc[]} */ (get(K.accountTxns, []) || []),
      /** @type {Record<string, unknown>} */ (get(K.syncErrors, {}) || {}),
    );
  }

  /**
   * @param {string} id
   * @returns {ReclassState | null}
   */
  function stateOf(id) {
    const ctx = ctxNow();
    const expense = (ctx.entries || []).find(row => row && row.id === id);
    if (!expense) return null;
    return rowState(expense, ctx);
  }

  /**
   * @param {StillOwedInput} input
   * @returns {{ doc: LedgerEntry | null, errors: string[] }}
   */
  function stillOwedReversal(input) {
    const entry = input && input.entry;
    /** @type {string[]} */
    const errors = [];
    if (!labourExpense(entry)) errors.push('kind');
    const projects = /** @type {{ id?: string, status?: string }[]} */ (get(K.projects, []) || []);
    const project = projects.find(row => row && row.id === (entry && entry.projectId));
    if (!project || project.status !== 'active') errors.push('inactive');
    if (!entry) return { doc: null, errors };
    const made = Ledger.makeReversal(entry, {
      user: input.user,
      reason: input.reversalReason,
      now: input.now,
      deviceId: input.deviceId,
      entryDate: input.entryDate,
    });
    made.description = cutDesc(token(/** @type {string} */ (entry.id)) + (made.description || ''));
    const ledger = /** @type {LedgerEntry[]} */ (get(K.entries, []) || []);
    const checked = Ledger.validateEntry(made, {
      user: input.user,
      ledger,
      projects: /** @type {LedgerProject[]} */ (projects),
      policy: Ledger.DEFAULT_POLICY,
    });
    const all = errors.concat(checked);
    if (all.length) return { doc: null, errors: all };
    return { doc: made, errors: [] };
  }

  /**
   * @param {AdvanceAfterInput} input
   * @returns {{ doc: object | null, errors: string[] }}
   */
  function advanceAfterReversal(input) {
    /** @type {string[]} */
    const errors = [];
    if (!input || !input.partyId) errors.push('partyId');
    if (!input || !UUID_RE.test(input.advanceId || '')) errors.push('targetId');
    if (errors.length || !input) return { doc: null, errors };
    const built = AccountPayment.cashDoc('advanceLabor', {
      id: input.advanceId,
      amount: input.amount,
      projectId: input.projectId,
      partyId: input.partyId,
      createdBy: input.createdBy,
      createdByName: input.createdByName,
      deviceId: input.deviceId,
    });
    if (!built.doc || built.errors.length) return { doc: null, errors: built.errors.slice() };
    const doc = /** @type {Record<string, unknown>} */ (built.doc);
    doc.description = cutDesc(token(input.expenseId) + input.originalDate + ' ' + input.expenseId);
    return { doc: /** @type {object} */ (doc), errors: [] };
  }

  /**
   * @param {readonly LedgerEntry[]} entries
   * @param {readonly FoldDoc[]} txns
   * @param {Readonly<Record<string, unknown>>} syncErrors
   * @returns {readonly LedgerEntry[]}
   */
  function advanceStillOwed(entries, txns, syncErrors) {
    const ctx = ctxFrom(entries, txns, syncErrors);
    return misbookedCandidates(entries, syncErrors).filter(entry => {
      const kind = rowState(entry, ctx).kind;
      return kind === 'revQueued' || kind === 'owed' || kind === 'advQueued' || kind === 'duplicate';
    });
  }

  /**
   * @param {readonly LedgerEntry[]} entries
   * @param {readonly FoldDoc[]} txns
   * @param {Readonly<Record<string, unknown>>} syncErrors
   * @param {string} projectId
   * @returns {number}
   */
  function reclassTotal(entries, txns, syncErrors, projectId) {
    const index = Accounts.rowIndex(txns || [], syncErrors || {});
    const counted = Ledger.countedEntries(entries || [], syncErrors || {});
    let sum = 0;
    (txns || []).forEach(doc => {
      if (!doc || doc.projectId !== projectId || doc.purpose !== 'advanceLabor' || !Accounts.rowCounts(doc, index)) return;
      const expenseId = tokenOf(/** @type {{ description?: unknown }} */ (doc).description);
      if (!expenseId) return;
      const rev = counted.find(row => row && row.id === 'rev_' + expenseId && row.projectId === projectId && isLRev(row, expenseId));
      if (!rev) return;
      sum += typeof doc.amount === 'number' ? doc.amount : 0;
    });
    return sum;
  }

  /**
   * @param {{ entry: LedgerEntry, user: LedgerUser, deviceId: string, day: string }} input
   * @returns {{ doc: LaborReview | null, errors: string[] }}
   */
  function reviewDoc(input) {
    const entry = input && input.entry;
    const user = input && input.user;
    /** @type {string[]} */
    const errors = [];
    if (!labourExpense(entry)) errors.push('kind');
    if (!user || user.role !== 'owner' || user.active === false) errors.push('owner');
    const entries = /** @type {LedgerEntry[]} */ (get(K.entries, []) || []);
    if (entry && entries.some(row => row && row.id === 'rev_' + entry.id)) errors.push('DUPLICATE');
    if (errors.length || !entry || !user) return { doc: null, errors };
    return {
      doc: {
        id: 'lrv_' + entry.id,
        docType: 'laborReview',
        entryId: /** @type {string} */ (entry.id),
        projectId: /** @type {string} */ (entry.projectId),
        decision: 'deducted',
        reviewedOn: input.day,
        createdBy: /** @type {string} */ (user.uid),
        createdByName: typeof user.displayName === 'string' ? user.displayName : '',
        createdAtServer: null,
        deviceId: input.deviceId,
      },
      errors: [],
    };
  }

  /**
   * @param {ReclassState[]} states
   */
  function orderedFirst(states) {
    return (states || [])
      .filter(state => state && Object.prototype.hasOwnProperty.call(FIRST_RANK, state.kind))
      .slice()
      .sort((a, b) => {
        const rank = FIRST_RANK[a.kind] - FIRST_RANK[b.kind];
        if (rank) return rank;
        return byDateThenId(a.expense, b.expense);
      });
  }

  /** @param {LedgerEntry} entry */
  function rowFacts(entry) {
    const name = entry.partyName ? '<div>' + esc(entry.partyName) + '</div>' : '';
    const description = entry.description ? '<div>' + esc(entry.description) + '</div>' : '';
    return '<div>' + esc(money(entry.amount)) + '</div><div>' + DATE_LABEL + ' <bdi class="num">' + esc(entry.entryDate) + '</bdi></div><code>' + esc(entry.id) + '</code>' + name + description;
  }

  /** @param {string} projectId */
  function archivedProject(projectId) {
    const projects = /** @type {{ id?: string, status?: string }[]} */ (get(K.projects, []) || []);
    const project = projects.find(row => row && row.id === projectId);
    return !!(project && project.status !== 'active');
  }

  /**
   * @param {ReclassState[]} states
   */
  function firstListHtml(states) {
    const rows = orderedFirst(states);
    const body = rows.map(state => {
      const entry = state.expense;
      let extra = '';
      if (state.kind === 'bothFacts') {
        extra = '<div>' + DEDUCTED + ' <bdi class="num">' + esc(state.review.reviewedOn) + '</bdi> ' + esc(state.review.createdByName) + '</div><div>' + STRINGS.cancel + ' <code>' + esc(state.revId) + '</code></div>' +
          state.advanceIds.map(id => '<code>' + esc(id) + '</code>').join('');
      } else if (state.kind === 'open') {
        const cancel = state.canCancel
          ? '<button type="button" data-rc-cancel="' + esc(entry.id) + '">' + STRINGS.cancel + '</button>'
          : archivedProject(String(entry.projectId || ''))
            ? '<div data-rc-closed="' + esc(entry.id) + '">' + STRINGS.archived + '</div>'
            : '';
        extra = '<div>' + STRINGS.question + '</div><button type="button" data-rc-review="' + esc(entry.id) + '">' + DEDUCTED + '</button>' + cancel;
      } else if (state.kind === 'reviewed') {
        const rev = revOf(String(entry.id || ''), /** @type {LedgerEntry[]} */ (get(K.entries, []) || []));
        const note = rev && Object.prototype.hasOwnProperty.call(/** @type {Record<string, unknown>} */ (get(K.syncErrors, {}) || {}), String(rev.id || '')) ? '<div>' + REFUSED + '</div>' : '';
        extra = '<div>' + DEDUCTED + ' <bdi class="num">' + esc(state.review.reviewedOn) + '</bdi> ' + esc(state.review.createdByName) + '</div>' + note;
      } else if (state.kind === 'reviewRefused' || state.kind === 'revRefused') {
        extra = '<div>' + REFUSED + '</div>';
      }
      return '<div data-rc-row="' + esc(entry.id) + '">' + rowFacts(entry) + extra + '</div>';
    }).join('');
    return '<div class="card" data-rc-list="1"><h2>' + STRINGS.listHeading + ' (' + String(rows.length) + ')</h2>' + body + '</div>';
  }

  /** @param {string} partyId */
  function partyName(partyId) {
    const parties = /** @type {{ id?: string, name?: string }[]} */ (get(K.parties, []) || []);
    const party = parties.find(row => row && row.id === partyId);
    return party && party.name ? String(party.name) : '';
  }

  /**
   * @param {ReclassState} state
   */
  function duplicateHtml(state) {
    if (state.kind !== 'duplicate') return '';
    const plan = state.plan;
    const covering = coveringAdvances(String(state.expense.id || ''), /** @type {FoldDoc[]} */ (get(K.accountTxns, []) || []), Accounts.rowIndex(/** @type {FoldDoc[]} */ (get(K.accountTxns, []) || []), /** @type {Record<string, unknown>} */ (get(K.syncErrors, {}) || {})));
    const lines = covering.map(row => {
      const id = String(row.id || '');
      const marked = plan.keepId && id === plan.keepId ? '<strong><code>' + esc(id) + '</code></strong>' : '<code>' + esc(id) + '</code>';
      let control = '';
      if (plan.reverseIds.indexOf(id) !== -1) {
        control = '<input id="rc-dup-reason" data-rc-reason-for="' + esc(id) + '" maxlength="500"><button type="button" data-rc-dup-rev="' + esc(id) + '">' + REVERSE + '</button>';
      } else if (plan.blockedIds.indexOf(id) !== -1) {
        control = '<div data-rc-dup-blocked="' + esc(id) + '">' + SENTENCE.dependent + '</div>';
      }
      return '<div>' + marked + ' ' + esc(partyName(String(row.partyId || ''))) + control + '</div>';
    }).join('');
    return '<div>' + STRINGS.duplicate + '</div>' + lines;
  }

  /**
   * @param {ReclassState[]} states
   */
  function secondListHtml(states) {
    const rows = (states || []).filter(state => state && (state.kind === 'revQueued' || state.kind === 'owed' || state.kind === 'advQueued' || state.kind === 'duplicate'));
    if (!rows.length) return '';
    const body = rows.slice().sort((a, b) => byDateThenId(a.expense, b.expense)).map(state => {
      const entry = state.expense;
      let extra = '';
      if (state.kind === 'revQueued' || state.kind === 'advQueued') {
        extra = '<button type="button" disabled>' + ADVANCE + '</button>';
      } else if (state.kind === 'owed') {
        const refused = state.refusedAdvanceIds.map(id => '<code>' + esc(id) + '</code> ' + REFUSED).join('');
        const reviewId = 'lrv_' + entry.id;
        const reviewNote = Object.prototype.hasOwnProperty.call(/** @type {Record<string, unknown>} */ (get(K.syncErrors, {}) || {}), reviewId) ? '<div>' + REFUSED + '</div>' : '';
        extra = '<button type="button" data-rc-advance="' + esc(entry.id) + '">' + ADVANCE + '</button>' + refused + reviewNote;
      } else extra = duplicateHtml(state);
      return '<div data-rc-row="' + esc(entry.id) + '">' + rowFacts(entry) + extra + '</div>';
    }).join('');
    return '<div class="card" data-rc-owed="1"><h2>' + STRINGS.owedHeading + '</h2>' + body + '</div>';
  }

  /** @param {ReclassState | null | undefined} state */
  function cancelFormHtml(state) {
    if (!state || state.kind !== 'open' || !state.canCancel) return '';
    const entry = state.expense;
    const amount = money(entry.amount);
    return '<div class="card" data-rc-cancel-card="' + esc(entry.id) + '"><div>' + DATE_LABEL + ' <bdi class="num">' + esc(entry.entryDate) + '</bdi></div><code>' + esc(entry.id) + '</code><div>' + WARN + '</div>' +
      '<div class="kv"><span>' + STRINGS.cancel + '</span> ' + esc(amount) + '</div><div class="kv"><span>' + STRINGS.corrected + '</span> ' + esc(amount) + '</div>' +
      '<label>' + REASON_LABEL + '</label><input id="rc-reason" maxlength="500"><button type="button" data-rc-save-rev="' + esc(entry.id) + '" disabled>' + SAVE + '</button></div>';
  }

  /** @param {ReclassState | null | undefined} state */
  function advanceFormHtml(state) {
    if (!state || state.kind !== 'owed') return '';
    const entry = state.expense;
    const id = String(entry.id || '');
    const picked = screen.partyPick[id] || '';
    const parties = /** @type {{ id?: string, name?: string }[]} */ (get(K.parties, []) || []);
    const pills = parties.filter(row => row && typeof row.id === 'string').map(row => {
      const on = row.id === picked ? ' on' : '';
      return '<button type="button" class="pill' + on + '" data-rc-party="' + esc(row.id) + '" data-rc-for="' + esc(id) + '">' + esc(row.name || '') + '</button>';
    }).join('');
    const fresh = screen.advanceIds[id] || '';
    const beside = state.refusedAdvanceIds.map(refused => '<code>' + esc(refused) + '</code> ' + REFUSED + (fresh ? ' <code>' + esc(fresh) + '</code>' : '')).join('');
    const ready = picked ? '' : ' disabled';
    return '<div class="card" data-rc-advance-card="' + esc(id) + '"><div>' + esc(money(entry.amount)) + '</div>' + pills + beside +
      '<button type="button" data-rc-save-adv="' + esc(id) + '"' + ready + '>' + SAVE + '</button></div>';
  }

  function redraw() {
    if (viewApi) viewApi.render();
  }

  /** @param {string} advanceId */
  function dupReason(advanceId) {
    const node = document.querySelector('[data-rc-reason-for="' + advanceId + '"]') || document.querySelector('#rc-dup-reason');
    const value = node && /** @type {HTMLInputElement} */ (node).value;
    return typeof value === 'string' ? value : '';
  }

  /**
   * @param {HTMLButtonElement} button
   */
  function onClick(button) {
    if (!button || !button.dataset) return false;
    const data = button.dataset;
    if (!data.rcReview && !data.rcCancel && !data.rcSaveRev && !data.rcAdvance && !data.rcParty && !data.rcSaveAdv && !data.rcDupRev) return false;
    if (data.rcReview) {
      const state = stateOf(data.rcReview);
      if (!state || state.kind !== 'open') return true;
      const user = /** @type {LedgerUser} */ (me());
      const built = reviewDoc({ entry: state.expense, user, deviceId: typeof deviceId === 'string' ? deviceId : '', day: today() });
      if (!built.doc) return true;
      button.disabled = true;
      AccountsView.commitDoc(built.doc.id, built.doc, /** @type {{ id: string }[]} */ (get(K.laborReviews, []) || []), next => { set(K.laborReviews, next); });
      redraw();
      return true;
    }
    if (data.rcCancel) {
      const state = stateOf(data.rcCancel);
      if (!state || state.kind !== 'open' || !state.canCancel) return true;
      screen.openCancel = data.rcCancel;
      redraw();
      return true;
    }
    if (data.rcSaveRev) {
      const reasonNode = document.querySelector('#rc-reason');
      const reason = reasonNode ? String(/** @type {HTMLInputElement} */ (reasonNode).value || '') : '';
      if (!reason.trim()) return true;
      const state = stateOf(data.rcSaveRev);
      if (!state || state.kind !== 'open' || !state.canCancel) return true;
      button.disabled = true;
      const built = stillOwedReversal({
        entry: state.expense,
        reversalReason: reason.trim(),
        user: /** @type {LedgerUser} */ (me()),
        deviceId: typeof deviceId === 'string' ? deviceId : '',
        entryDate: today(),
        now: Date.now(),
      });
      if (!built.doc || !built.doc.id) return true;
      AccountsView.commitDoc(built.doc.id, built.doc, /** @type {{ id: string }[]} */ (get(K.entries, []) || []), next => { set(K.entries, next); });
      screen.openCancel = '';
      redraw();
      return true;
    }
    if (data.rcAdvance) {
      const state = stateOf(data.rcAdvance);
      if (!state || state.kind !== 'owed') return true;
      const errors = /** @type {Record<string, unknown>} */ (get(K.syncErrors, {}) || {});
      const existing = screen.advanceIds[data.rcAdvance];
      if (!existing || Object.prototype.hasOwnProperty.call(errors, existing)) screen.advanceIds[data.rcAdvance] = uuid();
      screen.openAdvance = data.rcAdvance;
      redraw();
      return true;
    }
    if (data.rcParty) {
      const expenseId = data.rcFor || '';
      if (screen.openAdvance !== expenseId) return true;
      screen.partyPick[expenseId] = data.rcParty;
      redraw();
      return true;
    }
    if (data.rcSaveAdv) {
      const partyId = screen.partyPick[data.rcSaveAdv] || '';
      if (!partyId) return true;
      const state = stateOf(data.rcSaveAdv);
      if (!state || state.kind !== 'owed') return true;
      button.disabled = true;
      const built = advanceAfterReversal({
        expenseId: data.rcSaveAdv,
        partyId,
        projectId: String(state.expense.projectId || ''),
        amount: typeof state.expense.amount === 'number' ? state.expense.amount : 0,
        advanceId: screen.advanceIds[data.rcSaveAdv] || '',
        createdBy: String(me().uid || ''),
        createdByName: String(me().displayName || ''),
        deviceId: typeof deviceId === 'string' ? deviceId : '',
        originalDate: String(state.expense.entryDate || ''),
      });
      if (!built.doc) return true;
      AccountsView.commitDoc(screen.advanceIds[data.rcSaveAdv], built.doc, /** @type {{ id: string }[]} */ (get(K.accountTxns, []) || []), next => { set(K.accountTxns, next); });
      screen.openAdvance = '';
      redraw();
      return true;
    }
    const advanceId = data.rcDupRev || '';
    const reason = dupReason(advanceId);
    if (!reason.trim()) return true;
    const ctx = ctxNow();
    const expense = (ctx.entries || []).find(row => {
      if (!row || !row.id) return false;
      const state = rowState(row, ctx);
      return state.kind === 'duplicate' && state.plan.reverseIds.indexOf(advanceId) !== -1;
    });
    if (!expense) return true;
    const state = rowState(expense, ctx);
    if (state.kind !== 'duplicate') return true;
    if (state.plan.reverseIds.indexOf(advanceId) === -1 || hasLiveDraw(advanceId, ctx.index)) return true;
    if (state.plan.mode === 'ownerPicks' && coveringAdvances(String(expense.id || ''), ctx.txns, ctx.index).length < 2) return true;
    button.disabled = true;
    const user = me();
    const correct = (/** @type {Window} */ (/** @type {unknown} */ (globalThis))).AccountCorrect;
    if (!correct) return true;
    const built = correct.reversalDoc({
      targetId: advanceId,
      reason: reason.trim(),
      createdBy: String(user.uid || ''),
      createdByName: String(user.displayName || ''),
      deviceId: typeof deviceId === 'string' ? deviceId : '',
    });
    const rev = built.doc && /** @type {{ id?: unknown }} */ (built.doc);
    if (!rev || typeof rev.id !== 'string' || !built.doc) return true;
    AccountsView.commitDoc(rev.id, built.doc, /** @type {{ id: string }[]} */ (get(K.accountTxns, []) || []), next => { set(K.accountTxns, next); });
    redraw();
    return true;
  }

  function register() {
    const list = globalThis.AccountActions || (globalThis.AccountActions = []);
    [
      { id: 'reclass-review', label: DEDUCTED, buttonId: 'act-reclass-review' },
      { id: 'reclass-cancel', label: STRINGS.cancel, buttonId: 'act-reclass-cancel' },
      { id: 'reclass-advance', label: ADVANCE, buttonId: 'act-reclass-advance' },
      { id: 'reclass-dup', label: REVERSE, buttonId: 'act-reclass-dup' },
    ].forEach(row => {
      if (list.some(item => item && item.id === row.id)) return;
      list.push({
        id: row.id,
        tab: 'contractor',
        label: row.label,
        buttonId: row.buttonId,
        renderForm: () => '',
        onClick,
        save: () => ({ doc: null, errors: [] }),
      });
    });
  }

  /**
   * @param {RenderApi} api
   */
  function install(api) {
    viewApi = api;
    resetScreen();
    const prev = api.views.accounts;
    api.views.accounts = () => {
      const base = typeof prev === 'function' ? prev('') : '';
      if (!ownerOn()) return base;
      const ctx = ctxNow();
      const states = misbookedCandidates(ctx.entries, ctx.syncErrors).map(entry => rowState(entry, ctx));
      const open = states.find(state => state.expense && state.expense.id === screen.openCancel);
      const owed = states.find(state => state.expense && state.expense.id === screen.openAdvance);
      return base + firstListHtml(states) + secondListHtml(states) + cancelFormHtml(open) + advanceFormHtml(owed);
    };
    register();
    document.addEventListener('input', event => {
      const target = event.target;
      if (!target || /** @type {HTMLElement} */ (target).id !== 'rc-reason') return;
      const on = String(/** @type {HTMLInputElement} */ (target).value || '').trim().length > 0;
      document.querySelectorAll('[data-rc-save-rev]').forEach(node => {
        if (node instanceof HTMLButtonElement) node.disabled = !on;
      });
    });
  }

  return {
    install,
    token,
    tokenOf,
    misbookedCandidates,
    rowState,
    stillOwedReversal,
    advanceAfterReversal,
    advanceStillOwed,
    coveringAdvances,
    duplicatePlan,
    hasLiveDraw,
    refusedAdvanceIds,
    reclassTotal,
    reviewDoc,
  };
});
