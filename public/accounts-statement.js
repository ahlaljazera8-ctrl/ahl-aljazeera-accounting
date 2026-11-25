// Booked statements, settle, and statement issue on «مقاول». Loaded after accounts-correct.js.
(function (factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(globalThis, { AccountStatement: api });
})(/** @returns {AccountStatementApi} */ function () {
  'use strict';

  const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
  const MAX_AMOUNT = 10000000000;
  const DAY_MS = 86400000;
  const TIMEOUT = Object.freeze({ timeout: true });
  /** @type {readonly BookedFigure[]} */
  const FIGURES = ['approvedLabor', 'payments', 'refunds', 'advancesPaid', 'cashReturned', 'deductions', 'settlements'];
  const LINE_KEY = {
    approvedLabor: 'approvedLabor',
    payments: 'payments',
    refunds: 'paymentRefund',
    advancesPaid: 'advancesPaid',
    cashReturned: 'cashReturned',
    deductions: 'deduct',
    settlements: 'settle',
  };
  const EFFECT_WORD = { 1: 'يزيد المستحق', '-1': 'ينقص المستحق' };
  /** @type {Readonly<Record<string, boolean>>} */
  const MUSTAKHLAS_KEY = { approvedLabor: true, deductions: true, advancesPaid: true, cashReturned: true };
  const CASH_DELTA = { payLabor: 1, advanceLabor: 1, returnAdvance: -1, refundLabor: -1 };
  const SENTENCE = {
    q19: 'المُرجَع والتسوية أكبر من السلفة',
    range: 'المبلغ ليس عدداً صحيحاً',
    refused: 'رُفض الإرسال',
    queued: 'لا يُعتمد الكشف وفيه قيد لم يُرسل بعد',
    dependent: 'اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً',
    unchecked: 'لا يُعتمد الكشف وفيه مبلغ غير مدقّق',
    note: 'الكشف يُعتمد قبل أن يُقفل. الأرقام تُحسب من القيود.',
    save: 'حفظ التسوية',
    issue: 'إصدار كشف حساب',
    heading: 'تسوية سلفة',
    corrections: 'تصحيحات فترات سابقة',
    mustakhlas: 'مستخلص',
    net: 'الصافي',
    advancesNet: 'صافي السلف',
    cost: 'تكلفة المقاول',
    unlinked: 'قيود بلا عقد',
    paid: 'المدفوع للمقاولين',
    qty: 'الكمية',
    advance: 'سلفة',
    settle: 'تسوية سلفة',
    returned: 'المُرجَع من السلف نقداً',
    deduct: 'الخصومات ومرتجعات المواد',
    owed: 'الرصيد المستحق',
    forHim: 'مستحق له',
    forUs: 'مستحق عليه',
    up: 'يزيد المستحق',
    down: 'ينقص المستحق',
    reverse: 'عكس',
    reason: 'سبب التصحيح',
    advancesPaid: 'السلف المصروفة له',
  };

  /** @type {RenderApi | null} */
  let viewApi = null;
  let bound = false;
  /** @type {{ arg: string, settleTarget: string, shown: BookedStatement | null }} */
  const screen = { arg: '', settleTarget: '', shown: null };
  /** @type {WeakMap<object, Map<string, string>>} */
  const bookMemo = new WeakMap();

  /**
   * @param {string} day
   * @param {number} delta
   */
  function shiftDay(day, delta) {
    const match = DATE_RE.exec(day);
    if (!match) return '';
    const utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) + delta * DAY_MS;
    const date = new Date(utc);
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return date.getUTCFullYear() + '-' + month + '-' + d;
  }

  /**
   * @param {string} a
   * @param {string} b
   * @param {string} c
   */
  function maxDay(a, b, c) {
    let best = a;
    if (b > best) best = b;
    if (c > best) best = c;
    return best;
  }

  /**
   * @param {FoldDoc | null | undefined} doc
   */
  function extra(doc) {
    return /** @type {{ createdAtServer?: number | null, agreementId?: string, qty?: number, fxRate?: number }} */ (doc || {});
  }

  /**
   * @param {number} ms
   */
  function baghdad(ms) {
    const fn = /** @type {{ baghdadDate?: (n: number) => string }} */ (globalThis).baghdadDate;
    return typeof fn === 'function' ? fn(ms) : today();
  }

  /**
   * @param {FoldDoc | null | undefined} doc
   * @param {string} todayValue
   */
  function serverDay(doc, todayValue) {
    const stamp = doc && extra(doc).createdAtServer;
    if (typeof stamp === 'number' && Number.isFinite(stamp)) return baghdad(stamp);
    return todayValue;
  }

  /**
   * @param {FoldDoc | null | undefined} doc
   */
  function markerKindOf(doc) {
    if (!doc || typeof doc.id !== 'string') return '';
    if (doc.kind === 'rev' || doc.id.startsWith('rev_')) return 'rev';
    if (doc.kind === 'rej' || doc.id.startsWith('rej_')) return 'rej';
    if (doc.purpose === 'approveDeduct') return 'approveDeduct';
    if (doc.kind === 'revw' || doc.id.startsWith('revw_')) return 'revw';
    if (doc.kind === 'sup' || doc.id.startsWith('sup_') || typeof doc.supersedesId === 'string') return 'sup';
    return '';
  }

  /**
   * @param {FoldDoc} doc
   */
  function pointerId(doc) {
    const kind = markerKindOf(doc);
    if (kind === 'rev') return doc.reversesId || (doc.id.startsWith('rev_') ? doc.id.slice(4) : '');
    if (kind === 'rej') return doc.targetId || (doc.id.startsWith('rej_') ? doc.id.slice(4) : '');
    if (kind === 'approveDeduct' || kind === 'revw') return doc.targetId || '';
    if (kind === 'sup') return doc.supersedesId || (doc.id.startsWith('sup_') ? doc.id.slice(4) : '');
    return '';
  }

  /**
   * @param {readonly FoldDoc[]} docs
   */
  function indexById(docs) {
    /** @type {Record<string, FoldDoc>} */
    const byId = {};
    for (const doc of docs || []) {
      if (doc && typeof doc.id === 'string' && !Object.prototype.hasOwnProperty.call(byId, doc.id)) byId[doc.id] = doc;
    }
    return byId;
  }

  /**
   * @param {FoldDoc | null | undefined} doc
   * @param {BookContext} ctx
   * @param {number} depth
   * @returns {{ partyId: string, projectId: string }}
   */
  function resolvedScope(doc, ctx, depth) {
    const partyId = doc && typeof doc.partyId === 'string' ? doc.partyId : '';
    const projectId = doc && typeof doc.projectId === 'string' ? doc.projectId : '';
    if ((partyId && projectId) || !doc || depth >= 8) return { partyId, projectId };
    const nextId = pointerId(doc);
    const target = nextId ? ctx.byId[nextId] : undefined;
    if (!target || target === doc) return { partyId, projectId };
    const next = resolvedScope(target, ctx, depth + 1);
    return { partyId: partyId || next.partyId, projectId: projectId || next.projectId };
  }

  /**
   * @param {FoldDoc} doc
   * @param {BookContext} ctx
   * @param {number} depth
   * @returns {string}
   */
  function naturalDay(doc, ctx, depth) {
    if (!doc || depth > 8) return serverDay(doc, ctx.today);
    if (typeof doc.txnDate === 'string' && DATE_RE.test(doc.txnDate)) return doc.txnDate;
    const nextId = pointerId(doc);
    const target = nextId ? ctx.byId[nextId] : undefined;
    if (target && target !== doc) {
      const next = naturalDay(target, ctx, depth + 1);
      if (next) return next;
    }
    return serverDay(doc, ctx.today);
  }

  /**
   * @param {FoldDoc} doc
   * @param {BookContext} ctx
   * @param {string} nd
   */
  function closingApprovals(doc, ctx, nd) {
    const scope = resolvedScope(doc, ctx, 0);
    const stamp = extra(doc).createdAtServer;
    const arrival = typeof stamp === 'number' && Number.isFinite(stamp) ? stamp : Infinity;
    /** @type {StatementApprovalRow[]} */
    const out = [];
    for (const approval of ctx.approvals || []) {
      if (!approval || typeof approval.createdAtServer !== 'number' || !Number.isFinite(approval.createdAtServer)) continue;
      if (ctx.syncErrors && Object.prototype.hasOwnProperty.call(ctx.syncErrors, approval.id)) continue;
      if (approval.partyId !== scope.partyId) continue;
      if (approval.projectId && approval.projectId !== scope.projectId) continue;
      if (!(approval.createdAtServer < arrival)) continue;
      if (!(nd <= approval.periodEnd)) continue;
      out.push(approval);
    }
    return out;
  }

  /**
   * @param {FoldDoc} doc
   * @param {BookContext} ctx
   */
  function bookDay(doc, ctx) {
    if (!doc || typeof doc.id !== 'string') return '';
    let memo = bookMemo.get(ctx);
    if (!memo) {
      memo = new Map();
      bookMemo.set(ctx, memo);
    }
    if (memo.has(doc.id)) return memo.get(doc.id) || '';
    memo.set(doc.id, '');
    const nd = naturalDay(doc, ctx, 0);
    const closers = closingApprovals(doc, ctx, nd);
    let day = nd;
    if (closers.length) {
      let maxEnd = '';
      for (const approval of closers) if (approval.periodEnd > maxEnd) maxEnd = approval.periodEnd;
      day = maxDay(nd, serverDay(doc, ctx.today), shiftDay(maxEnd, 1));
    }
    if (markerKindOf(doc)) {
      const target = ctx.byId[pointerId(doc)];
      if (target && target !== doc) {
        const targetDay = bookDay(target, ctx);
        if (targetDay > day) day = targetDay;
      }
    }
    memo.set(doc.id, day);
    return day;
  }

  /**
   * @param {readonly FoldDoc[]} docs
   * @param {string} day
   * @param {BookContext} ctx
   */
  function bookedBy(docs, day, ctx) {
    /** @type {FoldDoc[]} */
    const out = [];
    for (const doc of docs || []) {
      if (doc && bookDay(doc, ctx) <= day) out.push(doc);
    }
    return out;
  }

  /**
   * @param {readonly StatementApprovalRow[]} approvals
   * @param {Readonly<Record<string, unknown>> | null | undefined} syncErrors
   * @param {string} partyId
   * @param {string | undefined} projectId
   * @param {'week' | 'month'} periodKind
   * @param {string} periodStart
   * @param {string} periodEnd
   */
  function issuedAt(approvals, syncErrors, partyId, projectId, periodKind, periodStart, periodEnd) {
    /** @type {number | null} */
    let best = null;
    for (const approval of approvals || []) {
      if (!approval || typeof approval.createdAtServer !== 'number' || !Number.isFinite(approval.createdAtServer)) continue;
      if (syncErrors && Object.prototype.hasOwnProperty.call(syncErrors, approval.id)) continue;
      if (approval.partyId !== partyId) continue;
      if (projectId) {
        if (approval.projectId !== projectId) continue;
      } else if (approval.projectId) continue;
      if (approval.periodKind !== periodKind || approval.periodStart !== periodStart || approval.periodEnd !== periodEnd) continue;
      if (best == null || approval.createdAtServer < best) best = approval.createdAtServer;
    }
    return best;
  }

  /**
   * @param {readonly FoldDoc[]} docs
   * @param {BookContext} ctx
   * @param {string} partyId
   * @param {string} [projectId]
   */
  function scopedDocs(docs, ctx, partyId, projectId) {
    /** @type {FoldDoc[]} */
    const out = [];
    for (const doc of docs) {
      const scope = resolvedScope(doc, ctx, 0);
      if (scope.partyId !== partyId) continue;
      if (projectId && scope.projectId !== projectId) continue;
      out.push(doc);
    }
    return out;
  }

  /**
   * @returns {Record<string, StatementLine>}
   */
  function lineMeta() {
    /** @type {Record<string, StatementLine>} */
    const byKey = {};
    for (const line of Accounts.statementLines([], {}).lines) byKey[line.key] = line;
    return byKey;
  }

  /**
   * @param {readonly FoldDoc[]} docs
   * @param {{ partyId: string, projectId?: string, syncErrors?: Readonly<Record<string, unknown>> | null }} filter
   * @param {BookedFigure} figure
   * @param {boolean} bounded
   * @param {string} start
   * @param {string} end
   */
  function figureAmount(docs, filter, figure, bounded, start, end) {
    if (!bounded) {
      const fold = Accounts.balances(docs, { partyId: filter.partyId, projectId: filter.projectId, syncErrors: filter.syncErrors, periodEnd: end });
      if (figure === 'approvedLabor') return fold.approvedLabor;
      if (figure === 'payments') return fold.payments;
      if (figure === 'refunds') return fold.refunds;
      if (figure === 'advancesPaid') return fold.advancesPaid;
      if (figure === 'cashReturned') return fold.cashReturned;
      if (figure === 'deductions') return fold.deductions;
      return fold.settlements;
    }
    const pack = Accounts.statementLines(docs, {
      partyId: filter.partyId,
      projectId: filter.projectId,
      syncErrors: filter.syncErrors || null,
      periodStart: start,
      periodEnd: end,
    });
    const key = LINE_KEY[figure];
    for (const line of pack.lines) if (line.key === key) return line.amount;
    return 0;
  }

  /**
   * @param {readonly StatementApprovalRow[]} approvals
   * @param {BookContext} ctx
   * @param {{ partyId: string, projectId: string }} scope
   * @param {string} periodStart
   * @param {number | null} issuedAtMs
   */
  function windows(approvals, ctx, scope, periodStart, issuedAtMs) {
    const sMinus = shiftDay(periodStart, -1);
    /** @type {StatementApprovalRow[]} */
    const pool = [];
    for (const approval of approvals || []) {
      if (!approval || typeof approval.createdAtServer !== 'number' || !Number.isFinite(approval.createdAtServer)) continue;
      if (ctx.syncErrors && Object.prototype.hasOwnProperty.call(ctx.syncErrors, approval.id)) continue;
      if (issuedAtMs != null && !(approval.createdAtServer < issuedAtMs)) continue;
      if (approval.partyId !== scope.partyId) continue;
      if (approval.projectId && approval.projectId !== scope.projectId) continue;
      pool.push(approval);
    }
    pool.sort((a, b) => {
      if (a.periodEnd !== b.periodEnd) return a.periodEnd < b.periodEnd ? -1 : 1;
      if (a.periodStart !== b.periodStart) return a.periodStart < b.periodStart ? -1 : 1;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    /** @type {{ prevEnd: string, end: string, approval: StatementApprovalRow }[]} */
    const out = [];
    let prevEnd = '';
    for (const approval of pool) {
      const end = approval.periodEnd < sMinus ? approval.periodEnd : sMinus;
      if (prevEnd && end <= prevEnd) continue;
      out.push({ prevEnd, end, approval });
      prevEnd = end;
    }
    return out;
  }

  /**
   * @param {{ prevEnd: string, end: string }[]} windowsList
   * @param {readonly FoldDoc[]} docsBe
   * @param {BookContext} ctx
   * @param {string} periodStart
   */
  function tailWindow(windowsList, docsBe, ctx, periodStart) {
    const sMinus = shiftDay(periodStart, -1);
    if (!windowsList.length) {
      let first = '';
      for (const doc of docsBe) {
        const nd = naturalDay(doc, ctx, 0);
        if (nd && nd <= sMinus && (!first || nd < first)) first = nd;
      }
      if (!first) first = sMinus;
      return { prevEnd: '', end: sMinus, start: first, bounded: false };
    }
    const last = windowsList[windowsList.length - 1].end;
    if (last >= sMinus) return null;
    return { prevEnd: last, end: sMinus, start: shiftDay(last, 1), bounded: true };
  }

  /**
   * @param {readonly FoldDoc[]} docs
   * @param {BookContext} ctx
   * @param {{ partyId: string, projectId?: string, syncErrors?: Readonly<Record<string, unknown>> | null }} filter
   * @param {string} periodStart
   * @param {string} periodEnd
   * @param {'week' | 'month'} periodKind
   */
  function correctionRows(docs, ctx, filter, periodStart, periodEnd, periodKind) {
    /** @type {string[]} */
    const projects = [];
    if (filter.projectId) projects.push(filter.projectId);
    else {
      const seen = new Set();
      for (const doc of docs) {
        const scope = resolvedScope(doc, ctx, 0);
        if (scope.partyId === filter.partyId && scope.projectId && !seen.has(scope.projectId)) {
          seen.add(scope.projectId);
          projects.push(scope.projectId);
        }
      }
      projects.sort();
    }
    const freeze = issuedAt(ctx.approvals, ctx.syncErrors, filter.partyId, filter.projectId, periodKind, periodStart, periodEnd);
    const meta = lineMeta();
    /** @type {CorrectionRow[]} */
    const rows = [];
    for (const projectId of projects) {
      const scopeFilter = { partyId: filter.partyId, projectId, syncErrors: filter.syncErrors };
      const projectDocs = scopedDocs(docs, ctx, filter.partyId, projectId);
      const sMinus = shiftDay(periodStart, -1);
      const bs = scopedDocs(bookedBy(projectDocs, sMinus, ctx), ctx, filter.partyId, projectId);
      const be = scopedDocs(bookedBy(projectDocs, periodEnd, ctx), ctx, filter.partyId, projectId);
      const bsIds = new Set(bs.map(doc => doc.id));
      /** @type {FoldDoc[]} */
      const bl = bs.slice();
      for (const doc of be) {
        if (bsIds.has(doc.id)) continue;
        const kind = markerKindOf(doc);
        if (kind === 'rev' || kind === 'rej') continue;
        bl.push(doc);
      }
      const cuts = windows(ctx.approvals, ctx, { partyId: filter.partyId, projectId }, periodStart, freeze);
      /** @type {{ prevEnd: string, end: string, start: string, bounded: boolean, kind: 'window' | 'tail', sourceStart: string, sourceEnd: string }[]} */
      const parts = cuts.map(cut => ({
        prevEnd: cut.prevEnd,
        end: cut.end,
        start: cut.prevEnd ? shiftDay(cut.prevEnd, 1) : '',
        bounded: !!cut.prevEnd,
        kind: /** @type {'window'} */ ('window'),
        sourceStart: cut.approval.periodStart,
        sourceEnd: cut.approval.periodEnd,
      }));
      const tail = tailWindow(cuts, be, ctx, periodStart);
      if (tail) {
        parts.push({
          prevEnd: tail.prevEnd,
          end: tail.end,
          start: tail.start,
          bounded: tail.bounded,
          kind: 'tail',
          sourceStart: tail.start,
          sourceEnd: tail.end,
        });
      }
      for (const part of parts) {
        for (const figure of FIGURES) {
          const before = figureAmount(bs, scopeFilter, figure, part.bounded, part.start, part.end);
          const lateBase = figureAmount(bl, scopeFilter, figure, part.bounded, part.start, part.end);
          const after = figureAmount(be, scopeFilter, figure, part.bounded, part.start, part.end);
          const chunks = [
            { part: /** @type {'late'} */ ('late'), raw: lateBase - before },
            { part: /** @type {'reversed'} */ ('reversed'), raw: after - lateBase },
          ];
          const line = meta[LINE_KEY[/** @type {BookedFigure} */ (figure)]];
          const sign = line ? line.sign : 0;
          for (const chunk of chunks) {
            if (chunk.raw === 0) continue;
            const effect = effectOf(sign, chunk.raw);
            rows.push({
              key: figure,
              label: line ? line.label : '',
              part: chunk.part,
              kind: part.kind,
              amount: chunk.raw,
              effect,
              source: { periodStart: part.sourceStart, periodEnd: part.sourceEnd },
            });
          }
        }
      }
    }
    return rows;
  }

  /**
   * @param {number} sign
   * @param {number} raw
   * @returns {1 | -1 | 0}
   */
  function effectOf(sign, raw) {
    const value = Math.sign(sign * raw);
    if (value > 0) return 1;
    if (value < 0) return -1;
    return 0;
  }

  /**
   * @param {CorrectionRow} row
   */
  function correctionText(row) {
    const word = row.effect === 1 ? EFFECT_WORD[1] : EFFECT_WORD['-1'];
    return row.label + ' ' + Ledger.fmt(Math.abs(row.amount)) + ' د.ع، ' + word + '، من ' + row.source.periodStart + ' إلى ' + row.source.periodEnd;
  }

  /**
   * @param {PeriodStatementInput} input
   */
  function periodStatement(input) {
    if (!input || !DATE_RE.test(input.periodStart) || !DATE_RE.test(input.periodEnd)) return null;
    /** @type {BookContext} */
    const ctx = {
      byId: indexById(input.docs),
      approvals: input.approvals || [],
      syncErrors: input.syncErrors || {},
      today: input.today,
    };
    const filter = { partyId: input.partyId, projectId: input.projectId, syncErrors: input.syncErrors || null };
    const sMinus = shiftDay(input.periodStart, -1);
    const before = scopedDocs(bookedBy(input.docs, sMinus, ctx), ctx, input.partyId, input.projectId);
    const through = scopedDocs(bookedBy(input.docs, input.periodEnd, ctx), ctx, input.partyId, input.projectId);
    const opening = Accounts.balances(before, { partyId: input.partyId, projectId: input.projectId, syncErrors: filter.syncErrors, periodEnd: sMinus }).net;
    const pack = Accounts.statementLines(through, {
      partyId: input.partyId,
      projectId: input.projectId,
      syncErrors: filter.syncErrors,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    });
    const closingFold = Accounts.balances(through, {
      partyId: input.partyId,
      projectId: input.projectId,
      syncErrors: filter.syncErrors,
      periodEnd: input.periodEnd,
    });
    const lines = pack.lines.map(line => {
      if (line.key === 'opening') return { key: line.key, label: line.label, amount: opening, sign: line.sign, entersClosing: line.entersClosing };
      if (line.key === 'closing') return { key: line.key, label: line.label, amount: closingFold.net, sign: line.sign, entersClosing: line.entersClosing };
      return line;
    });
    const index = Accounts.rowIndex(input.docs, input.syncErrors);
    return {
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      opening,
      lines,
      corrections: correctionRows(input.docs, ctx, filter, input.periodStart, input.periodEnd, input.periodKind),
      closing: closingFold.net,
      issuedAt: issuedAt(input.approvals, input.syncErrors, input.partyId, input.projectId, input.periodKind, input.periodStart, input.periodEnd),
      queuedIds: queuedIds(input.docs, ctx, filter, input.periodEnd, input.outbox || []),
      pendingIds: closingFold.pendingIds,
      unreviewedCashIds: closingFold.unreviewedCashIds,
      overLimitIds: closingFold.overLimitIds,
      orphanDrawIds: orphanDrawIds(input.docs, index, { partyId: input.partyId, projectId: input.projectId }, input.periodEnd),
    };
  }

  /**
   * @param {readonly FoldDoc[]} docs
   * @param {BookContext} ctx
   * @param {{ partyId: string, projectId?: string }} filter
   * @param {string} periodEnd
   * @param {readonly string[]} outbox
   */
  function queuedIds(docs, ctx, filter, periodEnd, outbox) {
    const waiting = new Set(outbox || []);
    /** @type {string[]} */
    const ids = [];
    for (const doc of docs) {
      if (!doc || !waiting.has(doc.id)) continue;
      const scope = resolvedScope(doc, ctx, 0);
      if (scope.partyId !== filter.partyId) continue;
      if (filter.projectId && scope.projectId !== filter.projectId) continue;
      const nd = naturalDay(doc, ctx, 0);
      if (nd && nd <= periodEnd) ids.push(doc.id);
    }
    return ids;
  }

  /**
   * @param {readonly FoldDoc[]} docs
   * @param {RowIndex} index
   * @param {{ partyId?: string, projectId?: string }} filter
   * @param {string} periodEnd
   */
  function orphanDrawIds(docs, index, filter, periodEnd) {
    /** @type {BookContext} */
    const ctx = { byId: index.byId, approvals: [], syncErrors: index.syncErrors || {}, today: today() };
    /** @type {string[]} */
    const ids = [];
    for (const doc of docs || []) {
      if (!doc || !Accounts.rowLive(doc, index)) continue;
      const scope = resolvedScope(doc, ctx, 0);
      if (filter.partyId && scope.partyId !== filter.partyId) continue;
      if (filter.projectId && scope.projectId !== filter.projectId) continue;
      const nd = naturalDay(doc, ctx, 0);
      if (!nd || nd > periodEnd) continue;
      if (doc.purpose === 'settle' && typeof doc.settlesId === 'string') {
        const advance = index.byId[doc.settlesId];
        if (!advance || advance.purpose !== 'advanceLabor' || !Accounts.rowLive(advance, index)) ids.push(doc.id);
      } else if (doc.purpose === 'returnAdvance' && typeof doc.targetId === 'string') {
        const advance = index.byId[doc.targetId];
        if (!advance || advance.purpose !== 'advanceLabor' || !Accounts.rowLive(advance, index)) ids.push(doc.id);
      } else if (doc.purpose === 'deduct' && typeof doc.targetId === 'string') {
        const mark = index.byId['appr_' + doc.id];
        const labor = index.byId[doc.targetId];
        if (mark && mark.purpose === 'approveDeduct' && Accounts.rowLive(mark, index) && (!labor || labor.purpose !== 'approveLabor' || !Accounts.rowLive(labor, index))) {
          ids.push(doc.id);
        }
      }
    }
    ids.sort();
    return ids;
  }

  /**
   * @param {BookedStatement} statement
   */
  function mustakhlas(statement) {
    const meta = lineMeta();
    let work = 0;
    let deductions = 0;
    let advancesPaid = 0;
    let cashReturned = 0;
    for (const line of statement.lines) {
      if (line.key === 'approvedLabor') work = line.amount;
      if (line.key === 'deduct') deductions = line.amount;
      if (line.key === 'advancesPaid') advancesPaid = line.amount;
      if (line.key === 'cashReturned') cashReturned = line.amount;
    }
    const advancesNet = advancesPaid - cashReturned;
    const corrections = statement.corrections.filter(row => MUSTAKHLAS_KEY[row.key] === true);
    let net = work - deductions - advancesNet;
    for (const row of corrections) {
      const line = meta[LINE_KEY[row.key]];
      net += (line ? line.sign : 0) * row.amount;
    }
    return { work, deductions, advancesNet, corrections, net };
  }

  /**
   * @param {unknown} amount
   */
  function counted(amount) {
    return typeof amount === 'number' && Number.isSafeInteger(amount) && amount >= 0 && amount <= MAX_AMOUNT ? amount : 0;
  }

  /**
   * @param {readonly LedgerEntry[]} entries
   * @param {readonly FoldDoc[]} txns
   * @param {Readonly<Record<string, unknown>>} syncErrors
   * @param {{ projectId: string }} filter
   */
  function contractorTotals(entries, txns, syncErrors, filter) {
    let oldPaid = 0;
    let unlinked = 0;
    for (const entry of Ledger.countedEntries(entries || [], syncErrors || {})) {
      if (!entry || entry.entryType !== 'subcontractor' || entry.projectId !== filter.projectId) continue;
      const amount = Ledger.sign(entry) * counted(entry.amount);
      if (entry.subcontractId) oldPaid += amount;
      else unlinked += amount;
    }
    const index = Accounts.rowIndex(txns || [], syncErrors);
    let newApproved = 0;
    let newCash = 0;
    for (const doc of txns || []) {
      if (!doc || doc.projectId !== filter.projectId || !Accounts.rowCounts(doc, index)) continue;
      if (doc.purpose === 'approveLabor') newApproved += counted(doc.amount);
      const delta = doc.purpose ? CASH_DELTA[/** @type {'payLabor'} */ (doc.purpose)] : 0;
      if (delta) newCash += delta * counted(doc.amount);
    }
    return {
      oldPaid,
      unlinked,
      newApproved,
      newCash,
      reclassAdvance: /** @type {0} */ (0),
      cost: oldPaid + unlinked + newApproved,
      paidToContractors: oldPaid + unlinked + newCash,
    };
  }

  /**
   * @param {readonly FoldDoc[]} txns
   * @param {readonly object[]} agreements
   * @param {string} partyId
   * @param {RowIndex} index
   * @param {string} [projectId]
   */
  function approvedUnitQty(txns, agreements, partyId, index, projectId) {
    /** @type {Record<string, string>} */
    const method = {};
    for (const agreement of agreements || []) {
      const row = /** @type {{ id?: string, method?: string }} */ (agreement);
      if (row && row.id && row.method) method[row.id] = row.method;
    }
    let qty = 0;
    for (const doc of txns || []) {
      if (!doc || doc.purpose !== 'approveLabor' || doc.partyId !== partyId) continue;
      if (projectId && doc.projectId !== projectId) continue;
      if (!Accounts.rowCounts(doc, index) || typeof doc.targetId !== 'string') continue;
      const body = index.byId[doc.targetId];
      if (!body || body.purpose !== 'laborQty') continue;
      const agreementId = extra(body).agreementId || extra(doc).agreementId || '';
      const qtyValue = extra(body).qty;
      if (method[agreementId] !== 'unit' || typeof qtyValue !== 'number' || !(qtyValue > 0)) continue;
      qty += qtyValue;
    }
    return qty;
  }

  /**
   * @param {number} net
   */
  function balanceSentence(net) {
    return {
      label: SENTENCE.owed,
      direction: net > 0 ? SENTENCE.forHim : net < 0 ? SENTENCE.forUs : '',
      amountText: Ledger.fmt(Math.abs(net)) + ' د.ع',
    };
  }

  /**
   * @param {string} projectId
   */
  function projectOpen(projectId) {
    const projects = /** @type {{ id?: string, status?: string }[]} */ (get(K.projects, []) || []);
    return projects.some(row => row && row.id === projectId && row.status === 'active');
  }

  function txns() {
    return /** @type {FoldDoc[]} */ (get(K.accountTxns, []) || []);
  }

  function approvals() {
    return /** @type {StatementApprovalRow[]} */ (get(K.statementApprovals, []) || []);
  }

  function errors() {
    return /** @type {Record<string, unknown>} */ (get(K.syncErrors, {}) || {});
  }

  function outbox() {
    return /** @type {string[]} */ (get(K.outbox, []) || []);
  }

  /**
   * @param {string} measurementId
   * @param {RowIndex} index
   */
  function settleGen(measurementId, index) {
    const syncErrors = index.syncErrors || {};
    let gen = 0;
    for (let n = 1; n <= 9; n += 1) {
      const id = 'stl_' + measurementId + '_' + n;
      if (index.byId[id] || Object.prototype.hasOwnProperty.call(syncErrors, id)) gen = n;
    }
    if (!gen) return '1';
    const id = 'stl_' + measurementId + '_' + gen;
    if (Object.prototype.hasOwnProperty.call(syncErrors, id)) return '';
    const rev = index.byId['rev_' + id];
    if (rev && Accounts.rowLive(rev, index)) return gen >= 9 ? '' : String(gen + 1);
    return '';
  }

  /**
   * @param {SettleInput} input
   */
  function settleDoc(input) {
    const docs = txns();
    const syncErrors = errors();
    const index = Accounts.rowIndex(docs, syncErrors);
    const measurement = input && index.byId[input.measurementId];
    if (measurement && measurement.projectId && !projectOpen(measurement.projectId)) return { doc: null, errors: ['inactive'] };
    if (!measurement || measurement.purpose !== 'laborQty') return { doc: null, errors: ['targetId'] };
    const approval = index.byId['appr_' + input.measurementId];
    if (!approval || !Accounts.rowCounts(approval, index)) return { doc: null, errors: ['targetId'] };
    const advance = index.byId[input.settlesId];
    if (!advance || advance.purpose !== 'advanceLabor' || !Accounts.rowLive(advance, index) || Object.prototype.hasOwnProperty.call(syncErrors, input.settlesId)) {
      return { doc: null, errors: ['settlesId'] };
    }
    const gen = settleGen(input.measurementId, index);
    if (!gen || gen !== input.gen) return { doc: null, errors: ['method'] };
    const posted = Accounts.post('settle', {
      id: 'stl_' + input.measurementId + '_' + input.gen,
      settlesId: input.settlesId,
      amount: input.amount,
      ledger: docs,
    });
    if (!posted.doc || posted.errors.length) return { doc: null, errors: posted.errors.slice() };
    /** @type {Record<string, unknown>} */
    const doc = {
      id: 'stl_' + input.measurementId + '_' + input.gen,
      docType: 'accountTxn',
      kind: 'stl',
      purpose: 'settle',
      projectId: measurement.projectId,
      partyId: measurement.partyId,
      ledger: 'labor',
      currency: measurement.currency || 'IQD',
      fxRate: typeof extra(measurement).fxRate === 'number' ? extra(measurement).fxRate : 1,
      amount: input.amount,
      targetId: input.measurementId,
      settlesId: input.settlesId,
      txnDate: input.txnDate,
      createdBy: input.createdBy,
      createdAtServer: null,
      deviceId: input.deviceId,
    };
    if (input.createdByName) doc.createdByName = input.createdByName;
    return { doc, errors: [] };
  }

  /**
   * @param {StatementApprovalInput} input
   */
  function statementApprovalDoc(input) {
    if (!input || !DATE_RE.test(input.periodStart || '') || !DATE_RE.test(input.periodEnd || '')) return { doc: null, errors: ['period'] };
    if (input.periodEnd >= today()) return { doc: null, errors: ['open'] };
    if (input.projectId && !projectOpen(input.projectId)) return { doc: null, errors: ['inactive'] };
    const statement = periodStatement({
      docs: txns(),
      approvals: approvals(),
      syncErrors: errors(),
      outbox: outbox(),
      partyId: input.partyId,
      projectId: input.projectId,
      periodKind: input.periodKind,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      today: today(),
    });
    if (!statement) return { doc: null, errors: ['period'] };
    if (statement.unreviewedCashIds.length || statement.overLimitIds.length || statement.queuedIds.length || statement.orphanDrawIds.length) {
      return { doc: null, errors: ['review'] };
    }
    /** @type {Record<string, unknown>} */
    const doc = {
      id: input.id,
      docType: 'statementApproval',
      partyId: input.partyId,
      periodKind: input.periodKind,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      createdBy: input.createdBy,
      createdAtServer: null,
    };
    if (input.projectId) doc.projectId = input.projectId;
    return { doc, errors: [] };
  }

  /**
   * @param {BookedStatement | null} next
   * @param {BookedStatement | null} shown
   */
  function sameShown(next, shown) {
    if (!next || !shown) return false;
    if (next.opening !== shown.opening || next.closing !== shown.closing || next.issuedAt !== shown.issuedAt) return false;
    if (next.lines.length !== shown.lines.length || next.corrections.length !== shown.corrections.length) return false;
    if (next.orphanDrawIds.length !== shown.orphanDrawIds.length) return false;
    for (let i = 0; i < next.lines.length; i += 1) {
      const left = next.lines[i];
      const right = shown.lines[i];
      if (!left || !right || left.key !== right.key || left.label !== right.label || left.amount !== right.amount || left.sign !== right.sign || left.entersClosing !== right.entersClosing) return false;
    }
    for (let i = 0; i < next.corrections.length; i += 1) {
      const left = next.corrections[i];
      const right = shown.corrections[i];
      if (!left || !right || left.key !== right.key || left.part !== right.part || left.kind !== right.kind || left.amount !== right.amount || left.effect !== right.effect) return false;
      if (left.source.periodStart !== right.source.periodStart || left.source.periodEnd !== right.source.periodEnd) return false;
    }
    for (let i = 0; i < next.orphanDrawIds.length; i += 1) if (next.orphanDrawIds[i] !== shown.orphanDrawIds[i]) return false;
    return true;
  }

  /**
   * @param {Promise<unknown>} promise
   * @param {number} ms
   */
  function raceMs(promise, ms) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(TIMEOUT), ms);
      Promise.resolve(promise).then(
        value => {
          clearTimeout(timer);
          resolve(value);
        },
        err => {
          clearTimeout(timer);
          reject(err);
        },
      );
    });
  }

  /**
   * @param {IssueGateInput} input
   * @returns {Promise<IssueGateResult>}
   */
  async function issueGate(input) {
    if (!input.demo && !input.online()) return { ok: false, errors: ['offline'] };
    const e0 = input.epoch();
    if (!input.demo) {
      const pending = input.inFlight();
      if (pending) {
        try {
          await raceMs(pending, input.timeoutMs);
        } catch (err) {
          void err;
        }
      }
    }
    const t0 = input.now();
    if (!input.demo) {
      try {
        const raced = await raceMs(input.flush(), input.timeoutMs);
        if (raced === TIMEOUT) return { ok: false, errors: ['pull'] };
      } catch (err) {
        void err;
        return { ok: false, errors: ['pull'] };
      }
    }
    if (input.epoch() !== e0) return { ok: false, errors: ['epoch'] };
    if (!input.demo) {
      if (input.outbox().length) return { ok: false, errors: ['queued'] };
      if (!(input.lastSyncAt() >= t0)) return { ok: false, errors: ['pull'] };
    }
    if (!sameShown(input.recompute(), input.shown)) return { ok: false, errors: ['changed'] };
    if (input.epoch() !== e0) return { ok: false, errors: ['epoch'] };
    return { ok: true, errors: [] };
  }

  /**
   * @param {string} value
   */
  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * @param {number} amount
   */
  function money(amount) {
    if (viewApi && viewApi.money) return viewApi.money(amount);
    return Ledger.fmt(amount) + ' د.ع';
  }

  /**
   * @param {number} amount
   */
  function directionWords(amount) {
    return Ledger.fmt(Math.abs(amount)) + ' د.ع ' + (amount < 0 ? SENTENCE.forUs : SENTENCE.forHim);
  }

  /**
   * @param {BookedStatement} statement
   */
  function correctionBlock(statement) {
    const printed = statement.corrections.filter(row => row.effect !== 0);
    if (!printed.length) return '';
    return '<h2>' + SENTENCE.corrections + '</h2>' + printed.map(row => '<div class="note" data-correction="1">' + esc(correctionText(row)) + '</div>').join('');
  }

  /**
   * @param {BookedStatement} statement
   */
  function statementCardHtml(statement) {
    const bits = ['<div class="card" data-st-card="1">'];
    for (const line of statement.lines) {
      if (line.key === 'closing') bits.push(correctionBlock(statement));
      if (line.key === 'opening') bits.push('<div class="kv" data-opening="1"><span>' + esc(line.label) + '</span> ' + directionWords(statement.opening) + '</div>');
      else if (line.key === 'closing') bits.push('<div class="kv" data-closing="1"><span>' + esc(line.label) + '</span> ' + directionWords(statement.closing) + '</div>');
      else bits.push('<div class="kv"><span>' + esc(line.label) + '</span>' + money(line.amount) + '</div>');
    }
    if (statement.pendingIds.length) bits.push('<div class="note">بانتظار الاعتماد</div>');
    if (statement.unreviewedCashIds.length || statement.overLimitIds.length) bits.push('<div class="note">' + SENTENCE.unchecked + '</div>');
    bits.push('<div class="note">' + SENTENCE.note + '</div></div>');
    return bits.join('');
  }

  /**
   * @param {BookedStatement} statement
   */
  function mustakhlasHtml(statement) {
    const model = mustakhlas(statement);
    const bits = ['<div class="card" data-mustakhlas="1"><h2>' + SENTENCE.mustakhlas + '</h2>'];
    bits.push('<div class="kv"><span>عمل معتمد</span>' + money(model.work) + '</div>');
    bits.push('<div class="kv"><span>' + SENTENCE.deduct + '</span>' + money(model.deductions) + '</div>');
    if (model.advancesNet < 0) {
      bits.push('<div class="note" data-advances-net="1">' + SENTENCE.advancesNet + ' ' + Ledger.fmt(Math.abs(model.advancesNet)) + ' د.ع، ' + EFFECT_WORD[1] + '</div>');
    } else {
      bits.push('<div class="kv"><span>' + SENTENCE.advancesNet + '</span>' + money(model.advancesNet) + '</div>');
    }
    const printed = model.corrections.filter(row => row.effect !== 0);
    if (printed.length) {
      bits.push('<h2>' + SENTENCE.corrections + '</h2>');
      for (const row of printed) bits.push('<div class="note" data-correction="1">' + esc(correctionText(row)) + '</div>');
    }
    const word = model.net < 0 ? SENTENCE.forUs : SENTENCE.forHim;
    bits.push('<div class="note" data-net="1">' + SENTENCE.net + ' ' + Ledger.fmt(Math.abs(model.net)) + ' د.ع ' + word + '</div></div>');
    return bits.join('');
  }

  /**
   * @param {ContractorTotals} totals
   */
  function totalsCardHtml(totals) {
    return (
      '<div class="card" data-st-totals="1"><div class="kv"><span>' + SENTENCE.cost + '</span>' + money(totals.cost) + '</div>' +
      '<div class="kv"><span>' + SENTENCE.unlinked + '</span>' + money(totals.unlinked) + '</div>' +
      '<div class="kv"><span>' + SENTENCE.paid + '</span>' + money(totals.paidToContractors) + '</div></div>'
    );
  }

  function costOpen() {
    const start = Accounts.CONTRACTOR_COST_START;
    return typeof start === 'string' && DATE_RE.test(start) && today() >= start;
  }

  function ownerOn() {
    const user = me();
    return !!(user && user.role === 'owner' && user.active !== false);
  }

  /**
   * @param {string} id
   */
  function agreementOf(id) {
    const rows = /** @type {{ id?: string, partyId?: string, projectId?: string }[]} */ (get(K.agreements, []) || []);
    return rows.find(row => row && row.id === id) || null;
  }

  /**
   * @param {{ partyId?: string, projectId?: string }} agreement
   */
  function currentStatement(agreement) {
    const period = AccountsView.accountPeriod();
    const flag = AccountsView.readAccountScope();
    if (!period || !agreement.partyId || !agreement.projectId) return null;
    return periodStatement({
      docs: txns(),
      approvals: approvals(),
      syncErrors: errors(),
      outbox: outbox(),
      partyId: agreement.partyId,
      projectId: agreement.projectId,
      periodKind: flag.periodKind,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      today: today(),
    });
  }

  /**
   * @param {string} text
   */
  function reasonReady(text) {
    return String(text || '').trim().length > 0;
  }

  function reasonValue() {
    const field = /** @type {HTMLInputElement | null} */ (document.querySelector('#cc-reason'));
    return field ? field.value : '';
  }

  /**
   * @param {string} id
   * @param {string} attr
   * @param {boolean} hasReason
   */
  function reverseButton(id, attr, hasReason) {
    return '<button type="button" class="btn ghost" ' + attr + '="' + esc(id) + '"' + (hasReason ? '' : ' disabled') + '>' + SENTENCE.reverse + '</button>';
  }

  /**
   * @param {{ partyId?: string, projectId?: string }} agreement
   * @param {boolean} hasReasonField
   */
  function settleBlock(agreement, hasReasonField) {
    if (!agreement.projectId || !projectOpen(agreement.projectId)) return '';
    const docs = txns();
    const index = Accounts.rowIndex(docs, errors());
    /** @type {FoldDoc | null} */
    let measurement = null;
    for (const doc of docs) {
      if (!doc || doc.purpose !== 'approveLabor' || extra(doc).agreementId !== screen.arg || !Accounts.rowCounts(doc, index)) continue;
      const body = typeof doc.targetId === 'string' ? index.byId[doc.targetId] : undefined;
      if (!body || body.purpose !== 'laborQty') continue;
      measurement = body;
      if (settleGen(body.id, index)) break;
    }
    const advances = docs.filter(doc => doc && doc.purpose === 'advanceLabor' && doc.partyId === agreement.partyId && doc.projectId === agreement.projectId && Accounts.rowLive(doc, index));
    if (!screen.settleTarget || !advances.some(doc => doc.id === screen.settleTarget)) screen.settleTarget = advances.length ? advances[0].id : '';
    const hasReason = reasonReady(reasonValue());
    const advanceRows = advances.map(doc => {
      const on = doc.id === screen.settleTarget ? ' on' : '';
      return '<button type="button" class="mini' + on + '" data-cs-adv="' + esc(doc.id) + '">' + SENTENCE.advance + ' ' + Ledger.fmt(counted(doc.amount)) + ' <bdi class="num">' + esc(doc.txnDate || '') + '</bdi></button>';
    }).join('');
    const settles = measurement ? docs.filter(doc => doc && doc.purpose === 'settle' && doc.targetId === measurement.id && Accounts.rowLive(doc, index)) : [];
    const settleRows = settles.map(doc => {
      const refused = errors()[doc.id];
      const note = typeof refused === 'string' && refused ? '<div class="note">' + esc(refused === SENTENCE.q19 ? SENTENCE.q19 : SENTENCE.refused) + '</div>' : '';
      return '<div class="kv" data-cs-row="' + esc(doc.id) + '"><span>' + SENTENCE.settle + '</span>' + money(counted(doc.amount)) + ' <b>' + esc(doc.txnDate || '') + '</b>' + reverseButton(doc.id, 'data-cs-rev', hasReason) + '</div>' + note;
    }).join('');
    const amount = AccountPayment.plainAmount((/** @type {HTMLInputElement | null} */ (document.querySelector('#cs-amount')) || { value: '' }).value);
    let sentence = '';
    if (measurement && screen.settleTarget && amount != null) {
      const probe = settleDoc({
        measurementId: measurement.id,
        settlesId: screen.settleTarget,
        amount,
        gen: settleGen(measurement.id, index),
        txnDate: today(),
        createdBy: me().uid || '',
        deviceId: deviceId || '',
      });
      const codes = /** @type {string[]} */ (probe.errors);
      if (codes.indexOf('cap') !== -1 || codes.indexOf('cumulative') !== -1) {
        const fold = Accounts.balances(docs, { partyId: agreement.partyId, projectId: agreement.projectId, syncErrors: errors() });
        sentence = '<div class="note">' + SENTENCE.q19 + '</div>' +
          '<div class="kv"><span>' + SENTENCE.advancesPaid + '</span>' + money(fold.advancesPaid) + '</div>' +
          '<div class="kv"><span>' + SENTENCE.returned + '</span>' + money(fold.cashReturned) + '</div>' +
          '<div class="kv"><span>' + SENTENCE.settle + '</span>' + money(fold.settlements) + '</div>';
      } else if (codes.indexOf('range') !== -1 || codes.indexOf('amount') !== -1 || codes.indexOf('overflow') !== -1 || codes.indexOf('inexact') !== -1) {
        sentence = '<div class="note">' + SENTENCE.range + '</div>';
      }
    }
    const disabled = !measurement || !screen.settleTarget ? ' disabled' : '';
    const reason = !hasReasonField && settles.length ? '<label class="field">' + SENTENCE.reason + '<input id="cc-reason" class="full" maxlength="500"></label>' : '';
    return '<div class="card" data-cs-card="1"><h2>' + SENTENCE.heading + '</h2>' + advanceRows +
      '<label class="field">مبلغ<input id="cs-amount" class="full" inputmode="numeric"></label><div id="cs-preview">' + sentence + '<!--/cs-preview--></div>' +
      reason + settleRows +
      '<button type="button" class="btn" id="act-settle" data-cs-save="1"' + disabled + '>' + SENTENCE.save + '</button></div>';
  }

  /**
   * @param {BookedStatement} statement
   * @param {boolean} hasReasonField
   */
  function orphanBlock(statement, hasReasonField) {
    if (!statement.orphanDrawIds.length) return '';
    const index = Accounts.rowIndex(txns(), errors());
    const hasReason = reasonReady(reasonValue());
    const rows = statement.orphanDrawIds.map(id => {
      const doc = index.byId[id];
      const label = doc && doc.purpose === 'settle' ? SENTENCE.settle : doc && doc.purpose === 'returnAdvance' ? SENTENCE.returned : SENTENCE.deduct;
      const amount = doc ? counted(doc.amount) : 0;
      const date = doc ? naturalDay(doc, { byId: index.byId, approvals: [], syncErrors: index.syncErrors || {}, today: today() }, 0) : '';
      return '<div class="kv" data-orphan="' + esc(id) + '"><span>' + label + '</span>' + money(amount) + ' <b>' + esc(date) + '</b>' + reverseButton(id, 'data-st-rev', hasReason) + '</div>';
    }).join('');
    const reason = !hasReasonField ? '<label class="field">' + SENTENCE.reason + '<input id="cc-reason" class="full" maxlength="500"></label>' : '';
    return '<div class="note">' + SENTENCE.dependent + '</div>' + reason + rows;
  }

  /**
   * @param {{ partyId?: string, projectId?: string }} agreement
   * @param {boolean} hasReasonField
   */
  function issueBlock(agreement, hasReasonField) {
    if (!agreement.projectId || !projectOpen(agreement.projectId)) return '';
    const period = AccountsView.accountPeriod();
    if (!period) return '';
    const shown = currentStatement(agreement);
    screen.shown = shown;
    if (!shown) return '';
    const queued = shown.queuedIds.length ? '<div class="note">' + SENTENCE.queued + '</div>' : '';
    const button = period.periodEnd < today() && shown.issuedAt == null && !shown.orphanDrawIds.length
      ? '<button type="button" class="btn" id="act-issue" data-st-issue="1">' + SENTENCE.issue + '</button>'
      : '';
    return '<div class="card" data-st-issue-card="1"><div class="kv"><span>من</span><b>' + esc(period.periodStart) + '</b></div><div class="kv"><span>إلى</span><b>' + esc(period.periodEnd) + '</b></div>' +
      statementCardHtml(shown) + queued + orphanBlock(shown, hasReasonField) + button + '</div>';
  }

  /**
   * @param {string} arg
   * @param {boolean} hasReasonField
   */
  function blocks(arg, hasReasonField) {
    if (!ownerOn() || !costOpen()) return '';
    const agreement = agreementOf(arg);
    if (!agreement) return '';
    const settle = settleBlock(agreement, hasReasonField);
    const issue = issueBlock(agreement, hasReasonField || settle.indexOf('id="cc-reason"') !== -1);
    return settle + issue;
  }

  function refreshSettle() {
    const preview = document.querySelector('#cs-preview');
    if (!preview || !viewApi) return;
    const agreement = agreementOf(screen.arg);
    if (!agreement) return;
    const html = settleBlock(agreement, true);
    const start = html.indexOf('id="cs-preview">');
    const endMark = '<!--/cs-preview-->';
    if (start < 0) return;
    const from = start + 'id="cs-preview">'.length;
    const end = html.indexOf(endMark, from);
    preview.innerHTML = end > from ? html.slice(from, end) : '';
  }

  function saveSettle() {
    const agreement = agreementOf(screen.arg);
    if (!agreement || !agreement.projectId || !projectOpen(agreement.projectId)) return;
    const amount = AccountPayment.plainAmount((/** @type {HTMLInputElement | null} */ (document.querySelector('#cs-amount')) || { value: '' }).value);
    if (amount == null || !screen.settleTarget) return;
    const index = Accounts.rowIndex(txns(), errors());
    /** @type {FoldDoc | null} */
    let measurement = null;
    for (const doc of txns()) {
      if (!doc || doc.purpose !== 'laborQty' || extra(doc).agreementId !== agreement.id) continue;
      const approval = index.byId['appr_' + doc.id];
      if (approval && Accounts.rowCounts(approval, index)) {
        measurement = doc;
        if (settleGen(doc.id, index)) break;
      }
    }
    if (!measurement) return;
    const user = me();
    const built = settleDoc({
      measurementId: measurement.id,
      settlesId: screen.settleTarget,
      amount,
      gen: settleGen(measurement.id, index),
      txnDate: today(),
      createdBy: user.uid || '',
      deviceId: deviceId || '',
      createdByName: user.displayName,
    });
    if (!built.doc) {
      refreshSettle();
      return;
    }
    const doc = /** @type {{ id: string }} */ (built.doc);
    AccountsView.commitDoc(doc.id, built.doc, txns(), next => { set(K.accountTxns, next); });
    if (viewApi) viewApi.render();
  }

  /**
   * @param {string} targetId
   */
  function reverseRow(targetId) {
    const reason = reasonValue().trim();
    if (!reason || !targetId) return;
    const agreement = agreementOf(screen.arg);
    if (!agreement || !agreement.projectId || !projectOpen(agreement.projectId)) return;
    const user = me();
    const correct = (/** @type {Window} */ (/** @type {unknown} */ (globalThis))).AccountCorrect;
    if (!correct) return;
    const built = correct.reversalDoc({ targetId, reason, createdBy: user.uid || '', deviceId: deviceId || '', createdByName: user.displayName });
    if (!built.doc) return;
    const doc = /** @type {{ id: string }} */ (built.doc);
    AccountsView.commitDoc(doc.id, built.doc, txns(), next => { set(K.accountTxns, next); });
    if (viewApi) viewApi.render();
  }

  async function issueNow() {
    const shown = screen.shown;
    const agreement = agreementOf(screen.arg);
    if (!shown || !agreement || !agreement.partyId || !agreement.projectId || !viewApi) return;
    const api = viewApi;
    const period = AccountsView.accountPeriod();
    const flag = AccountsView.readAccountScope();
    if (!period) return;
    const gate = await issueGate({
      shown,
      recompute() {
        return periodStatement({
          docs: txns(),
          approvals: approvals(),
          syncErrors: errors(),
          outbox: outbox(),
          partyId: agreement.partyId || '',
          projectId: agreement.projectId,
          periodKind: flag.periodKind,
          periodStart: shown.periodStart,
          periodEnd: shown.periodEnd,
          today: today(),
        });
      },
      online: () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false),
      inFlight: () => flushing,
      flush: () => flushRemote({ fromOutside: true }),
      timeoutMs: (/** @type {{ FLUSH_MS?: number }} */ (globalThis).FLUSH_MS) || 20000,
      epoch: () => sessionEpoch,
      lastSyncAt: () => api.lastSyncAt(),
      outbox,
      now: () => Date.now(),
      demo: !!demoRole(),
      projectActive: projectOpen(agreement.projectId),
      today: today(),
    });
    if (!gate.ok) {
      api.render();
      return;
    }
    const syncErrors = errors();
    const existing = approvals().find(row => row && row.partyId === agreement.partyId && row.projectId === agreement.projectId && row.periodKind === flag.periodKind && row.periodStart === period.periodStart && row.periodEnd === period.periodEnd && !Object.prototype.hasOwnProperty.call(syncErrors, row.id));
    const built = statementApprovalDoc({
      id: existing ? existing.id : uuid(),
      partyId: agreement.partyId,
      projectId: agreement.projectId,
      periodKind: flag.periodKind,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      createdBy: me().uid || '',
    });
    if (!built.doc) {
      viewApi.render();
      return;
    }
    const doc = /** @type {{ id: string }} */ (built.doc);
    AccountsView.commitDoc(doc.id, built.doc, approvals(), next => { set(K.statementApprovals, next); });
    api.render();
  }

  /**
   * @param {HTMLButtonElement} button
   */
  function onClick(button) {
    if (!button || !button.dataset) return false;
    if (button.dataset.csAdv) {
      screen.settleTarget = button.dataset.csAdv;
      if (viewApi) viewApi.render();
      return true;
    }
    if (button.dataset.csSave != null || button.id === 'act-settle') {
      if (button.disabled) return true;
      saveSettle();
      return true;
    }
    if (button.dataset.csRev || button.dataset.stRev) {
      if (button.disabled) return true;
      reverseRow(button.dataset.csRev || button.dataset.stRev || '');
      return true;
    }
    if (button.dataset.stIssue != null || button.id === 'act-issue') {
      if (button.disabled) return true;
      void issueNow();
      return true;
    }
    return false;
  }

  function register() {
    const list = globalThis.AccountActions || (globalThis.AccountActions = []);
    for (const id of ['settle', 'statement-approval']) {
      if (list.some(item => item && item.id === id)) continue;
      list.push({
        id,
        tab: 'contractor',
        label: id === 'settle' ? SENTENCE.save : SENTENCE.issue,
        buttonId: id === 'settle' ? 'act-settle' : 'act-issue',
        renderForm: () => '',
        onClick,
        save: () => ({ doc: null, errors: [] }),
      });
    }
  }

  /**
   * @param {RenderApi} api
   */
  function install(api) {
    viewApi = api;
    const prev = api.views.contractor;
    api.views.contractor = arg => {
      screen.arg = String(arg || '');
      const base = typeof prev === 'function' ? prev(arg) : '';
      return base + blocks(screen.arg, base.indexOf('id="cc-reason"') !== -1);
    };
    register();
    if (!bound) {
      bound = true;
      document.addEventListener('input', event => {
        const target = /** @type {HTMLInputElement | null} */ (event.target instanceof HTMLElement ? event.target : null);
        if (!target) return;
        if (target.id === 'cs-amount') {
          AccountPayment.applyGroupedAmount(target);
          refreshSettle();
        }
        if (target.id === 'cc-reason') {
          const on = reasonReady(target.value);
          document.querySelectorAll('[data-cs-rev],[data-st-rev]').forEach(node => {
            if (node instanceof HTMLButtonElement) node.disabled = !on;
          });
        }
      });
    }
  }

  return {
    install,
    bookDay,
    bookedBy,
    periodStatement,
    mustakhlas,
    contractorTotals,
    approvedUnitQty,
    balanceSentence,
    settleDoc,
    statementApprovalDoc,
    issueGate,
    statementCardHtml,
    mustakhlasHtml,
    totalsCardHtml,
    correctionText,
    renderedShown: () => screen.shown,
    settleGen,
  };
});
