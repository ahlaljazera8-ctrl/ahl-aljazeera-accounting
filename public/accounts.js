// Labor agreements and the nine v1 purposes. No screen and no Firestore write.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (root)).Accounts = api;
})(typeof self !== 'undefined' ? self : /** @type {Window} */ (/** @type {unknown} */ (this)), function () {
  'use strict';

  /** null until an engineer changes this file and deploys, after Ameer says go. */
  /** @type {string | null} */
  const CONTRACTOR_COST_START = null;
  const MAX_AMOUNT = 10000000000;
  const MAX_QTY = 100000000;
  const MAX_UNIT_QTY = 1000000;
  const MAX_PRODUCT = 10000000000000000n;
  const POINTER_FIELDS = ['targetId', 'reversesId', 'settlesId', 'supersedesId'];

  /**
   * @typedef {{
   *   method?: string,
   *   lumpAmount?: number,
   *   unitRate?: number,
   *   unitQty?: number,
   *   dayRate?: number,
   *   unitName?: string,
   *   milestoneAmount?: number,
   *   milestoneMode?: string
   * }} LaborAgreement
   * @typedef {{ cost: number, person: number, cash: number }} Effect
   * @typedef {{ ledger: 'labor', required: readonly string[], forbidden: readonly string[], points: Record<string, readonly string[]>, effect: Effect, statementLine: string, statementSign: number, needsApproval: boolean }} PurposeRow
   * @typedef {{ approvedQty: number|null, deliveredQty: number|null, notCompleted: number|null, earned: number, errors: string[] }} WorkPosition
   * @typedef {'payment'|'laborQty'|'approveLabor'|'refundLabor'|'returnAdvance'|'deduct'|'approveDeduct'|'settle'} PostAction
   * @typedef {{
   *   id: string,
   *   purpose: string,
   *   ledger: 'labor',
   *   amount?: number,
   *   paidAs?: 'payLabor' | 'advanceLabor',
   *   targetId?: string,
   *   settlesId?: string,
   *   agreement?: LaborAgreement,
   *   effect: Effect
   * }} AccountDoc
   * @typedef {{
   *   id: string,
   *   paidAs?: 'payLabor' | 'advanceLabor',
   *   amount?: number,
   *   agreement?: LaborAgreement,
   *   approvedQty?: number,
   *   approved?: boolean,
   *   targetId?: string,
   *   settlesId?: string,
   *   target?: AccountDoc,
   *   siblings?: readonly AccountDoc[],
   *   reversedIds?: ReadonlySet<string>,
   *   ledger?: readonly AccountDoc[]
   * }} PostInput
   * @typedef {{
   *   docs: readonly AccountDoc[],
   *   reversed: Set<string>,
   *   rejected: Set<string>,
   *   target: AccountDoc | undefined,
   *   errors: string[]
   * }} PostContext
   * @typedef {'lumpAmount'|'unitRate'|'unitQty'|'unitName'|'dayRate'|'milestoneAmount'|'milestoneMode'} MethodField
   */

  /** @type {Record<string, PurposeRow>} */
  const PURPOSES = {
    laborQty: row([], [], {}, { cost: 0, person: 0, cash: 0 }, 'outside', true),
    approveLabor: row(['targetId'], [], { targetId: ['laborQty'] }, { cost: 1, person: 1, cash: 0 }, 'approvedLabor', false),
    advanceLabor: row([], [], {}, { cost: 0, person: -1, cash: 1 }, 'advancesPaid', false),
    payLabor: row([], [], {}, { cost: 0, person: -1, cash: 1 }, 'payments', false),
    returnAdvance: row(['targetId'], [], { targetId: ['advanceLabor'] }, { cost: 0, person: 1, cash: -1 }, 'cashReturned', false),
    refundLabor: row(['targetId'], [], { targetId: ['payLabor'] }, { cost: 0, person: 1, cash: -1 }, 'paymentRefund', false),
    deduct: row(['targetId'], [], { targetId: ['approveLabor'] }, { cost: -1, person: -1, cash: 0 }, 'deduct', true),
    approveDeduct: row(['targetId'], [], { targetId: ['deduct'] }, { cost: 0, person: 0, cash: 0 }, 'notInSum', false),
    settle: row(['settlesId'], [], { settlesId: ['advanceLabor'] }, { cost: 0, person: 0, cash: 0 }, 'settle', false),
  };

  /**
   * @param {readonly string[]} required
   * @param {readonly string[]} forbidden
   * @param {Record<string, readonly string[]>} points
   * @param {Effect} effect
   * @param {string} statementLine
   * @param {boolean} needsApproval
   * @returns {PurposeRow}
   */
  function row(required, forbidden, points, effect, statementLine, needsApproval) {
    return { ledger: 'labor', required, forbidden, points, effect, statementLine, statementSign: effect.person, needsApproval };
  }

  /**
   * @param {number} n
   * @param {number} max
   */
  function intIn(n, max) {
    return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max;
  }

  /**
   * @param {number} left
   * @param {number} right
   * @param {number} divisor
   * @returns {{ amount: number, errors: string[] }}
   */
  function exactMulDiv(left, right, divisor) {
    if (!intIn(left, MAX_QTY) || !intIn(right, MAX_QTY) || !intIn(divisor, MAX_UNIT_QTY) || divisor < 1) {
      return { amount: 0, errors: ['range'] };
    }
    const product = BigInt(left) * BigInt(right);
    if (product > MAX_PRODUCT) return { amount: 0, errors: ['overflow'] };
    if (product % BigInt(divisor) !== 0n) return { amount: 0, errors: ['inexact'] };
    const amount = product / BigInt(divisor);
    if (amount > BigInt(MAX_AMOUNT)) return { amount: 0, errors: ['amount'] };
    return { amount: Number(amount), errors: [] };
  }

  /**
   * Price of one unit. 300000 per 4000 is 75.
   * @param {LaborAgreement|null|undefined} agreement
   */
  function unitPrice(agreement) {
    return exactMulDiv((agreement && agreement.unitRate) || 0, 1, (agreement && agreement.unitQty) || 0);
  }

  /**
   * @param {LaborAgreement} agreement
   * @param {MethodField} key
   */
  function hasField(agreement, key) {
    return agreement[key] !== undefined;
  }

  /**
   * @param {LaborAgreement} agreement
   */
  function methodGroups(agreement) {
    let count = 0;
    if (hasField(agreement, 'lumpAmount')) count += 1;
    if (hasField(agreement, 'unitRate') || hasField(agreement, 'unitQty') || hasField(agreement, 'unitName')) count += 1;
    if (hasField(agreement, 'dayRate')) count += 1;
    if (hasField(agreement, 'milestoneAmount') || hasField(agreement, 'milestoneMode')) count += 1;
    return count;
  }

  /**
   * @param {LaborAgreement|null|undefined} agreement
   * @param {{ approvedQty?: number, deliveredQty?: number, approved?: boolean, amount?: number }} input
   * @returns {WorkPosition}
   */
  function workPosition(agreement, input) {
    const delivered = input && Object.prototype.hasOwnProperty.call(input, 'deliveredQty') ? input.deliveredQty : null;
    const approvedQty = input && typeof input.approvedQty === 'number' ? input.approvedQty : null;
    /** @type {WorkPosition} */
    const blank = { approvedQty, deliveredQty: delivered == null ? null : delivered, notCompleted: null, earned: 0, errors: [] };
    if (delivered != null && approvedQty != null) blank.notCompleted = delivered - approvedQty;
    if (!agreement || (agreement.method !== 'lump' && agreement.method !== 'unit' && agreement.method !== 'daily' && agreement.method !== 'milestone')) {
      blank.errors = ['method'];
      return blank;
    }
    if (methodGroups(agreement) > 1) {
      blank.errors = ['method'];
      return blank;
    }
    if (agreement.method === 'milestone') return milestonePosition(agreement, input || {}, blank);
    if (agreement.method === 'lump') {
      if (input && Object.prototype.hasOwnProperty.call(input, 'amount') && input.amount !== agreement.lumpAmount) {
        blank.errors = ['lump'];
        return blank;
      }
      if (input && input.approved === true) {
        if (!intIn(agreement.lumpAmount || 0, MAX_AMOUNT) || (agreement.lumpAmount || 0) < 1) blank.errors = ['range'];
        else blank.earned = /** @type {number} */ (agreement.lumpAmount);
      }
      return blank;
    }
    if (agreement.method === 'unit') {
      if (approvedQty == null) return blank;
      const earned = exactMulDiv(approvedQty, agreement.unitRate || 0, agreement.unitQty || 0);
      blank.earned = earned.amount;
      blank.errors = earned.errors;
      return blank;
    }
    if (approvedQty == null) return blank;
    const earned = exactMulDiv(approvedQty, agreement.dayRate || 0, 1);
    blank.earned = earned.amount;
    blank.errors = earned.errors;
    return blank;
  }

  /**
   * @param {LaborAgreement} agreement
   * @param {{ approved?: boolean, amount?: number }} input
   * @param {WorkPosition} blank
   * @returns {WorkPosition}
   */
  function milestonePosition(agreement, input, blank) {
    if (agreement.milestoneMode !== 'amount' && agreement.milestoneMode !== 'percent') {
      blank.errors = ['milestone'];
      return blank;
    }
    if (agreement.milestoneMode === 'percent') {
      blank.errors = ['percent'];
      return blank;
    }
    if (Object.prototype.hasOwnProperty.call(input, 'amount') && input.amount !== agreement.milestoneAmount) {
      blank.errors = ['milestone'];
      return blank;
    }
    if (input.approved === true) {
      const amount = agreement.milestoneAmount;
      if (typeof amount !== 'number') blank.errors = ['milestone'];
      else if (!intIn(amount, MAX_AMOUNT) || amount < 1) blank.errors = ['range'];
      else blank.earned = amount;
    }
    return blank;
  }

  /**
   * @param {readonly AccountDoc[]} docs
   */
  function markerSets(docs) {
    /** @type {Set<string>} */
    const reversed = new Set();
    /** @type {Set<string>} */
    const rejected = new Set();
    for (const doc of docs) {
      if (!doc || typeof doc.id !== 'string') continue;
      if (doc.id.startsWith('rev_')) reversed.add(doc.id.slice(4));
      if (doc.id.startsWith('rej_')) rejected.add(doc.id.slice(4));
    }
    return { reversed, rejected };
  }

  /**
   * @param {string | undefined} id
   */
  function markerId(id) {
    return typeof id === 'string' && (id.startsWith('rev_') || id.startsWith('rej_'));
  }

  /**
   * @param {PostInput} body
   * @returns {PostContext}
   */
  function readPostContext(body) {
    const hasLedger = Object.prototype.hasOwnProperty.call(body, 'ledger') && body.ledger != null;
    const explicit = ['target', 'siblings', 'reversedIds'].some((key) => Object.prototype.hasOwnProperty.call(body, key));
    if (hasLedger && explicit) {
      return { docs: [], reversed: new Set(), rejected: new Set(), target: undefined, errors: ['ledger'] };
    }
    const docs = hasLedger ? /** @type {readonly AccountDoc[]} */ (body.ledger) : (body.siblings || []);
    const marks = markerSets(docs);
    const reversed = new Set(marks.reversed);
    if (!hasLedger && body.reversedIds) {
      for (const id of body.reversedIds) reversed.add(id);
    }
    let target = hasLedger ? undefined : body.target;
    if (hasLedger) {
      const key = body.settlesId || body.targetId;
      if (key) {
        for (const doc of docs) {
          if (doc && doc.id === key) target = doc;
        }
      }
    }
    return { docs, reversed, rejected: marks.rejected, target, errors: [] };
  }

  /**
   * @param {string} action
   * @param {'targetId'|'settlesId'} field
   */
  function pointedPurpose(action, field) {
    const purpose = PURPOSES[action];
    const names = purpose ? purpose.points[field] : undefined;
    return names && names.length ? names[0] : '';
  }

  /**
   * @param {PostInput} body
   * @param {PostContext} ctx
   * @param {'targetId'|'settlesId'} field
   * @param {string} action
   */
  function targetError(body, ctx, field, action) {
    const named = field === 'settlesId' ? body.settlesId : body.targetId;
    const target = ctx.target;
    if (!named || !target || target.id !== named || target.purpose !== pointedPurpose(action, field)) return field;
    if (ctx.reversed.has(target.id) || ctx.rejected.has(target.id)) return field;
    return '';
  }

  /**
   * @param {AccountDoc} doc
   * @param {string} action
   * @param {string} lineId
   */
  function onLine(doc, action, lineId) {
    if (!doc || markerId(doc.id)) return false;
    if (action === 'refundLabor') return doc.purpose === 'refundLabor' && doc.targetId === lineId;
    if (action === 'deduct') return doc.purpose === 'deduct' && doc.targetId === lineId;
    if (action === 'returnAdvance' || action === 'settle') {
      if (doc.purpose === 'returnAdvance' && doc.targetId === lineId) return true;
      if (doc.purpose === 'settle' && doc.settlesId === lineId) return true;
    }
    return false;
  }

  /**
   * An integer from 0 through MAX_AMOUNT. The fold and the post caps share this.
   * @param {unknown} amount
   * @returns {number}
   */
  function countedAmount(amount) {
    return typeof amount === 'number' && intIn(amount, MAX_AMOUNT) ? amount : 0;
  }

  /**
   * @param {Effect} effect
   * @returns {Effect}
   */
  function copyEffect(effect) {
    return { cost: effect.cost, person: effect.person, cash: effect.cash };
  }

  /**
   * @param {PostContext} ctx
   * @param {string} action
   * @param {string} lineId
   */
  function sumLine(ctx, action, lineId) {
    let sum = 0;
    for (const doc of ctx.docs) {
      if (!onLine(doc, action, lineId) || ctx.reversed.has(doc.id)) continue;
      if (doc.purpose === 'deduct' && ctx.rejected.has(doc.id)) continue;
      sum += countedAmount(doc.amount);
    }
    return sum;
  }

  /**
   * @param {PostInput} body
   * @returns {{ doc: AccountDoc | null, errors: string[] }}
   */
  function postPayment(body) {
    if (body.paidAs !== 'payLabor' && body.paidAs !== 'advanceLabor') return { doc: null, errors: ['paidAs'] };
    const amount = body.amount;
    if (typeof amount !== 'number' || !intIn(amount, MAX_AMOUNT) || amount < 1) return { doc: null, errors: ['range'] };
    const purpose = PURPOSES[body.paidAs];
    return {
      doc: { id: body.id, purpose: body.paidAs, ledger: 'labor', amount, paidAs: body.paidAs, effect: copyEffect(purpose.effect) },
      errors: [],
    };
  }

  /**
   * @param {'laborQty'|'approveLabor'} action
   * @param {PostInput} body
   * @param {PostContext} ctx
   * @returns {{ doc: AccountDoc | null, errors: string[] }}
   */
  function postLabor(action, body, ctx) {
    if (action === 'approveLabor') {
      const bad = targetError(body, ctx, 'targetId', 'approveLabor');
      if (bad) return { doc: null, errors: [bad] };
    }
    if (!body.agreement) return { doc: null, errors: ['agreement'] };
    const viewed = action === 'approveLabor' ? Object.assign({}, body, { approved: true }) : body;
    const position = workPosition(body.agreement, viewed);
    if (position.errors.length) return { doc: null, errors: position.errors };
    if (action === 'approveLabor' && position.earned < 1) return { doc: null, errors: ['earned'] };
    const purpose = PURPOSES[action];
    /** @type {AccountDoc} */
    const doc = {
      id: body.id,
      purpose: action,
      ledger: 'labor',
      amount: action === 'approveLabor' ? position.earned : 0,
      effect: copyEffect(purpose.effect),
    };
    if (action === 'approveLabor') doc.targetId = body.targetId;
    if (body.agreement.method === 'milestone') doc.agreement = Object.assign({}, body.agreement);
    return { doc, errors: [] };
  }

  /**
   * @param {PostInput} body
   * @param {PostContext} ctx
   * @param {'refundLabor'|'returnAdvance'|'deduct'|'settle'} action
   * @returns {{ doc: AccountDoc | null, errors: string[] }}
   */
  function postCapped(body, ctx, action) {
    const field = action === 'settle' ? 'settlesId' : 'targetId';
    const bad = targetError(body, ctx, field, action);
    if (bad) return { doc: null, errors: [bad] };
    const target = /** @type {AccountDoc} */ (ctx.target);
    const amount = body.amount;
    if (typeof amount !== 'number' || !intIn(amount, MAX_AMOUNT) || amount < 1) return { doc: null, errors: ['range'] };
    if (typeof target.amount !== 'number') return { doc: null, errors: [field] };
    if (amount > target.amount) return { doc: null, errors: ['cap'] };
    if (amount + sumLine(ctx, action, target.id) > target.amount) return { doc: null, errors: ['cumulative'] };
    /** @type {AccountDoc} */
    const doc = { id: body.id, purpose: action, ledger: 'labor', amount, effect: copyEffect(PURPOSES[action].effect) };
    if (field === 'settlesId') doc.settlesId = body.settlesId;
    else doc.targetId = body.targetId;
    return { doc, errors: [] };
  }

  /**
   * @param {PostContext} ctx
   * @param {string | undefined} lineId
   * @param {string} currentId
   */
  function approvedDeductSum(ctx, lineId, currentId) {
    /** @type {Set<string>} */
    const approved = new Set();
    for (const doc of ctx.docs) {
      if (!doc || doc.purpose !== 'approveDeduct' || typeof doc.targetId !== 'string') continue;
      if (markerId(doc.id) || ctx.reversed.has(doc.id)) continue;
      approved.add(doc.targetId);
    }
    let sum = 0;
    for (const doc of ctx.docs) {
      if (!doc || doc.purpose !== 'deduct' || doc.targetId !== lineId || doc.id === currentId) continue;
      if (markerId(doc.id) || ctx.reversed.has(doc.id) || ctx.rejected.has(doc.id)) continue;
      if (!approved.has(doc.id)) continue;
      sum += countedAmount(doc.amount);
    }
    return sum;
  }

  /**
   * @param {PostInput} body
   * @param {PostContext} ctx
   * @returns {{ doc: AccountDoc | null, errors: string[] }}
   */
  function postApproveDeduct(body, ctx) {
    const bad = targetError(body, ctx, 'targetId', 'approveDeduct');
    if (bad) return { doc: null, errors: [bad] };
    const deduct = /** @type {AccountDoc} */ (ctx.target);
    /** @type {AccountDoc | undefined} */
    let approval;
    for (const doc of ctx.docs) {
      if (!doc || doc.purpose !== 'approveLabor' || doc.id !== deduct.targetId) continue;
      if (markerId(doc.id) || ctx.reversed.has(doc.id)) continue;
      approval = doc;
    }
    if (!approval || typeof approval.amount !== 'number' || typeof deduct.amount !== 'number') {
      return { doc: null, errors: ['targetId'] };
    }
    if (deduct.amount + approvedDeductSum(ctx, deduct.targetId, deduct.id) > approval.amount) {
      return { doc: null, errors: ['cumulative'] };
    }
    return {
      doc: { id: body.id, purpose: 'approveDeduct', ledger: 'labor', targetId: body.targetId, effect: copyEffect(PURPOSES.approveDeduct.effect) },
      errors: [],
    };
  }

  /**
   * @param {PostAction} action
   * @param {PostInput} [input]
   * @returns {{ doc: AccountDoc | null, errors: string[] }}
   */
  function post(action, input) {
    const body = input || /** @type {PostInput} */ ({});
    const ctx = readPostContext(body);
    if (ctx.errors.length) return { doc: null, errors: ctx.errors };
    if (typeof body.id !== 'string' || body.id.length === 0) return { doc: null, errors: ['id'] };
    if (action === 'payment') return postPayment(body);
    if (action === 'laborQty' || action === 'approveLabor') return postLabor(action, body, ctx);
    if (action === 'refundLabor' || action === 'returnAdvance' || action === 'deduct' || action === 'settle') {
      return postCapped(body, ctx, action);
    }
    if (action === 'approveDeduct') return postApproveDeduct(body, ctx);
    return { doc: null, errors: ['action'] };
  }

  /**
   * @typedef {{
   *   id: string,
   *   purpose?: string,
   *   ledger?: 'labor',
   *   amount?: number,
   *   paidAs?: 'payLabor' | 'advanceLabor',
   *   targetId?: string,
   *   settlesId?: string,
   *   reversesId?: string,
   *   supersedesId?: string,
   *   partyId?: string,
   *   projectId?: string,
   *   currency?: 'IQD' | 'USD',
   *   txnDate?: string,
   *   kind?: 'body' | 'appr' | 'rej' | 'sup' | 'rev' | 'revw' | 'stl'
   * }} FoldDoc
   * @typedef {{
   *   partyId?: string,
   *   projectId?: string,
   *   currency?: 'IQD',
   *   periodEnd?: string,
   *   periodStart?: string,
   *   syncErrors?: Readonly<Record<string, unknown>> | null
   * }} BalanceFilter
   * @typedef {{
   *   net: number,
   *   payableGross: number,
   *   payable: number,
   *   recoverable: number,
   *   openAdvances: number,
   *   netAdvances: number,
   *   approvedLabor: number,
   *   payments: number,
   *   refunds: number,
   *   advancesPaid: number,
   *   cashReturned: number,
   *   deductions: number,
   *   settlements: number,
   *   overLimitIds: readonly string[],
   *   unreviewedCashIds: readonly string[],
   *   pendingIds: readonly string[]
   * }} Balance
   * @typedef {{
   *   byId: Readonly<Record<string, FoldDoc>>,
   *   byReversesId: Readonly<Record<string, readonly string[]>>,
   *   bySupersedesId: Readonly<Record<string, readonly string[]>>,
   *   byTargetId: Readonly<Record<string, readonly string[]>>,
   *   syncErrors: Readonly<Record<string, unknown>>
   * }} RowIndex
   * @typedef {{ key: string, label: string, amount: number, sign: number, entersClosing: boolean }} StatementLine
   */

  const FIGURES = [
    { key: 'opening', label: 'رصيد أول المدة', sign: 1, entersClosing: true, source: 'opening' },
    { key: 'approvedLabor', label: 'عمل معتمد', sign: 1, entersClosing: true, source: 'approvedLabor' },
    { key: 'payments', label: 'مدفوع للعمل', sign: -1, entersClosing: true, source: 'payments' },
    { key: 'paymentRefund', label: 'المُرجَع من الدفعة نقداً', sign: 1, entersClosing: true, source: 'refunds' },
    { key: 'advancesPaid', label: 'السلف المصروفة له', sign: -1, entersClosing: false, source: 'advancesPaid' },
    { key: 'cashReturned', label: 'المُرجَع من السلف نقداً', sign: 1, entersClosing: false, source: 'cashReturned' },
    { key: 'netAdvances', label: 'صافي السلف', sign: -1, entersClosing: true, source: 'netAdvances' },
    { key: 'deduct', label: 'الخصومات ومرتجعات المواد', sign: -1, entersClosing: true, source: 'deductions' },
    { key: 'settle', label: 'تسوية سلفة', sign: 0, entersClosing: true, source: 'settlements' },
    { key: 'closing', label: 'رصيد آخر المدة', sign: 0, entersClosing: false, source: 'closing' },
    { key: 'openAdvances', label: 'سلف قائمة عليه', sign: 0, entersClosing: false, source: 'openAdvances' },
  ];

  /**
   * @param {Record<string, string[]>} map
   * @param {string | undefined} key
   * @param {string} id
   */
  function pushPointer(map, key, id) {
    if (typeof key !== 'string' || key.length === 0) return;
    const list = map[key] || (map[key] = []);
    if (list.indexOf(id) === -1) list.push(id);
  }

  /**
   * @param {FoldDoc | null | undefined} row
   * @returns {'rev' | 'rej' | 'revw' | ''}
   */
  function markerKind(row) {
    if (!row) return '';
    if (row.kind === 'rev' || row.kind === 'rej' || row.kind === 'revw') return row.kind;
    if (typeof row.id !== 'string') return '';
    if (row.id.startsWith('rev_')) return 'rev';
    if (row.id.startsWith('rej_')) return 'rej';
    if (row.id.startsWith('revw_')) return 'revw';
    return '';
  }

  /**
   * @param {FoldDoc} row
   */
  function isSup(row) {
    return row.kind === 'sup' || (typeof row.id === 'string' && row.id.startsWith('sup_'));
  }

  /**
   * @param {readonly FoldDoc[] | null | undefined} docs
   * @param {Readonly<Record<string, unknown>> | null | undefined} [syncErrors]
   * @returns {RowIndex}
   */
  function rowIndex(docs, syncErrors) {
    /** @type {Record<string, FoldDoc>} */
    const byId = {};
    for (const doc of docs || []) {
      if (!doc || typeof doc.id !== 'string' || doc.id.length === 0) continue;
      if (!Object.prototype.hasOwnProperty.call(byId, doc.id)) byId[doc.id] = doc;
    }
    /** @type {Record<string, string[]>} */
    const byReversesId = {};
    /** @type {Record<string, string[]>} */
    const bySupersedesId = {};
    /** @type {Record<string, string[]>} */
    const byTargetId = {};
    for (const doc of Object.values(byId)) {
      pushPointer(byTargetId, doc.targetId, doc.id);
      pushPointer(byReversesId, doc.reversesId, doc.id);
      pushPointer(bySupersedesId, doc.supersedesId, doc.id);
      if (doc.id.startsWith('rev_')) pushPointer(byReversesId, doc.id.slice(4), doc.id);
      if (doc.id.startsWith('rej_')) pushPointer(byTargetId, doc.id.slice(4), doc.id);
      if (doc.id.startsWith('sup_')) pushPointer(bySupersedesId, doc.id.slice(4), doc.id);
    }
    /** @type {Record<string, unknown>} */
    const errors = {};
    if (syncErrors && typeof syncErrors === 'object') {
      for (const key of Object.keys(syncErrors)) errors[key] = syncErrors[key];
    }
    return {
      byId: Object.freeze(byId),
      byReversesId: Object.freeze(byReversesId),
      bySupersedesId: Object.freeze(bySupersedesId),
      byTargetId: Object.freeze(byTargetId),
      syncErrors: Object.freeze(errors),
    };
  }

  /** @type {WeakMap<RowIndex, Map<string, boolean>>} */
  const liveMemo = new WeakMap();

  /**
   * @param {string} targetId
   * @param {RowIndex} index
   * @returns {string[]}
   */
  function killerIds(targetId, index) {
    /** @type {string[]} */
    const ids = [];
    for (const id of index.byReversesId[targetId] || []) {
      const doc = index.byId[id];
      if (!doc || markerKind(doc) !== 'rev') continue;
      if (doc.id === 'rev_' + targetId || doc.reversesId === targetId) ids.push(id);
    }
    for (const id of index.byTargetId[targetId] || []) {
      const doc = index.byId[id];
      if (!doc || markerKind(doc) !== 'rej') continue;
      if (doc.id === 'rej_' + targetId || doc.targetId === targetId) ids.push(id);
    }
    for (const id of index.bySupersedesId[targetId] || []) {
      const doc = index.byId[id];
      if (!doc || !isSup(doc)) continue;
      if (doc.id === 'sup_' + targetId || doc.supersedesId === targetId) ids.push(id);
    }
    return ids;
  }

  /**
   * @param {FoldDoc | null | undefined} row
   * @param {RowIndex} index
   * @param {Map<string, 'visiting' | 'live' | 'dead'>} state
   * @param {number} depth
   * @returns {true | false | 'cycle'}
   */
  function walkLive(row, index, state, depth) {
    if (!row || typeof row.id !== 'string' || row.id.length === 0) return false;
    const id = row.id;
    const known = state.get(id);
    if (known === 'visiting') {
      state.set(id, 'dead');
      return 'cycle';
    }
    if (known === 'live') return true;
    if (known === 'dead') return false;
    if (!Object.prototype.hasOwnProperty.call(index.byId, id)) return false;
    if (Object.prototype.hasOwnProperty.call(index.syncErrors, id) || depth >= 8) {
      state.set(id, 'dead');
      return false;
    }
    state.set(id, 'visiting');
    for (const killerId of killerIds(id, index)) {
      const result = walkLive(index.byId[killerId], index, state, depth + 1);
      if (result === 'cycle' || state.get(id) === 'dead') {
        state.set(id, 'dead');
        return 'cycle';
      }
      if (result === true) {
        state.set(id, 'dead');
        return false;
      }
    }
    if (state.get(id) === 'dead') return false;
    state.set(id, 'live');
    return true;
  }

  /**
   * @param {FoldDoc | null | undefined} row
   * @param {RowIndex} index
   * @returns {boolean}
   */
  function rowLive(row, index) {
    if (!row || !index || typeof row.id !== 'string') return false;
    let memo = liveMemo.get(index);
    if (!memo) {
      memo = new Map();
      liveMemo.set(index, memo);
    }
    if (memo.has(row.id)) return memo.get(row.id) === true;
    const state = new Map();
    const result = walkLive(row, index, state, 0);
    for (const [id, value] of state) {
      if (value === 'live') memo.set(id, true);
      else if (value === 'dead') memo.set(id, false);
    }
    const live = result === true;
    memo.set(row.id, live);
    return live;
  }

  /**
   * @param {FoldDoc} row
   * @param {RowIndex} index
   * @param {string} purpose
   */
  function countingApproval(row, index, purpose) {
    for (const id of index.byTargetId[row.id] || []) {
      const doc = index.byId[id];
      if (!doc || doc.purpose !== purpose || doc.targetId !== row.id) continue;
      if (rowCounts(doc, index)) return true;
    }
    return false;
  }

  /**
   * @param {FoldDoc} row
   */
  function settleMeasurementId(row) {
    if (typeof row.targetId === 'string' && row.targetId.length > 0) return row.targetId;
    if (typeof row.id !== 'string' || !row.id.startsWith('stl_')) return '';
    const rest = row.id.slice(4);
    const cut = rest.lastIndexOf('_');
    if (cut <= 0) return '';
    const generation = rest.slice(cut + 1);
    if (!/^[1-9]$/.test(generation)) return '';
    return rest.slice(0, cut);
  }

  /**
   * @param {FoldDoc | null | undefined} row
   * @param {RowIndex} index
   * @returns {boolean}
   */
  function rowCounts(row, index) {
    if (!rowLive(row, index) || !row) return false;
    if (markerKind(row)) return false;
    const purpose = row.purpose ? PURPOSES[row.purpose] : undefined;
    if (!purpose) return false;
    if ((row.purpose === 'approveLabor' || row.purpose === 'approveDeduct') && typeof row.targetId === 'string') {
      if (Object.prototype.hasOwnProperty.call(index.byId, row.targetId) && !rowLive(index.byId[row.targetId], index)) {
        return false;
      }
    }
    if (row.purpose === 'laborQty' && !countingApproval(row, index, 'approveLabor')) return false;
    if (row.purpose === 'deduct') {
      if (typeof row.targetId !== 'string') return false;
      const approval = index.byId[row.targetId];
      if (!approval || !rowCounts(approval, index)) return false;
      if (!countingApproval(row, index, 'approveDeduct')) return false;
    }
    if (row.purpose === 'settle') {
      const bodyId = settleMeasurementId(row);
      if (!bodyId) return false;
      const approval = index.byId['appr_' + bodyId];
      if (!approval || !rowCounts(approval, index)) return false;
    }
    return true;
  }

  /**
   * @param {string} bodyId
   * @param {RowIndex} index
   */
  function hasLiveReview(bodyId, index) {
    const exact = 'revw_' + bodyId;
    for (const doc of Object.values(index.byId)) {
      if (markerKind(doc) !== 'revw') continue;
      const same = doc.id === exact;
      const later = doc.id.startsWith(exact + '_') && /^[1-9]$/.test(doc.id.slice(exact.length + 1));
      if ((same || later) && rowLive(doc, index)) return true;
    }
    return false;
  }

  /**
   * @param {FoldDoc} doc
   * @param {BalanceFilter | undefined} filter
   * @param {'through' | 'before' | 'inside'} dateMode
   */
  function inScope(doc, filter, dateMode) {
    if (filter && filter.partyId && doc.partyId !== filter.partyId) return false;
    if (filter && filter.projectId && doc.projectId !== filter.projectId) return false;
    if (doc.currency && doc.currency !== 'IQD') return false;
    const start = filter && filter.periodStart;
    const end = filter && filter.periodEnd;
    if (dateMode === 'before') return typeof doc.txnDate === 'string' && typeof start === 'string' && doc.txnDate < start;
    if (dateMode === 'inside') {
      if (typeof doc.txnDate !== 'string') return false;
      if (typeof start === 'string' && doc.txnDate < start) return false;
      if (typeof end === 'string' && doc.txnDate > end) return false;
      return true;
    }
    if (end) return typeof doc.txnDate === 'string' && doc.txnDate <= end;
    return true;
  }

  /**
   * @param {RowIndex} index
   * @param {BalanceFilter | undefined} filter
   * @param {'through' | 'before' | 'inside'} dateMode
   * @returns {Balance}
   */
  function fold(index, filter, dateMode) {
    let approvedLabor = 0;
    let payments = 0;
    let refunds = 0;
    let advancesPaid = 0;
    let cashReturned = 0;
    let deductions = 0;
    let settlements = 0;
    /** @type {Record<string, number>} */
    const refundOn = {};
    /** @type {Record<string, number>} */
    const deductOn = {};
    /** @type {Record<string, number>} */
    const drawOn = {};
    /** @type {string[]} */
    const pendingIds = [];
    /** @type {string[]} */
    const unreviewedCashIds = [];
    for (const doc of Object.values(index.byId)) {
      if (!inScope(doc, filter, dateMode)) continue;
      const live = rowLive(doc, index);
      const counts = rowCounts(doc, index);
      const amount = countedAmount(doc.amount);
      if (counts) {
        if (doc.purpose === 'approveLabor') approvedLabor += amount;
        else if (doc.purpose === 'payLabor') payments += amount;
        else if (doc.purpose === 'refundLabor') refunds += amount;
        else if (doc.purpose === 'advanceLabor') advancesPaid += amount;
        else if (doc.purpose === 'returnAdvance') cashReturned += amount;
        else if (doc.purpose === 'deduct') deductions += amount;
        else if (doc.purpose === 'settle') settlements += amount;
      }
      const purpose = doc.purpose ? PURPOSES[doc.purpose] : undefined;
      if (live && purpose && purpose.needsApproval && !counts) pendingIds.push(doc.id);
      if (live && doc.purpose === 'refundLabor' && doc.targetId) refundOn[doc.targetId] = (refundOn[doc.targetId] || 0) + amount;
      if (live && doc.purpose === 'deduct' && doc.targetId) deductOn[doc.targetId] = (deductOn[doc.targetId] || 0) + amount;
      if (live && doc.purpose === 'returnAdvance' && doc.targetId) drawOn[doc.targetId] = (drawOn[doc.targetId] || 0) + amount;
      if (live && doc.purpose === 'settle' && doc.settlesId) drawOn[doc.settlesId] = (drawOn[doc.settlesId] || 0) + amount;
      const cash = doc.purpose === 'payLabor' || doc.purpose === 'advanceLabor' || doc.purpose === 'returnAdvance' || doc.purpose === 'refundLabor';
      if (counts && cash && !hasLiveReview(doc.id, index)) unreviewedCashIds.push(doc.id);
    }
    /** @type {string[]} */
    const overLimitIds = [];
    for (const doc of Object.values(index.byId)) {
      if (!inScope(doc, filter, dateMode) || !rowCounts(doc, index)) continue;
      const amount = countedAmount(doc.amount);
      if (doc.purpose === 'payLabor' && (refundOn[doc.id] || 0) > amount) overLimitIds.push(doc.id);
      if (doc.purpose === 'approveLabor' && (deductOn[doc.id] || 0) > amount) overLimitIds.push(doc.id);
      if (doc.purpose === 'advanceLabor' && (drawOn[doc.id] || 0) > amount) overLimitIds.push(doc.id);
    }
    const net = approvedLabor - advancesPaid - payments + cashReturned + refunds - deductions;
    const payableGross = approvedLabor - payments + refunds - deductions - settlements;
    const openAdvances = advancesPaid - cashReturned - settlements;
    return {
      net,
      payableGross,
      payable: Math.max(payableGross, 0),
      recoverable: Math.max(-payableGross, 0),
      openAdvances,
      netAdvances: advancesPaid - cashReturned,
      approvedLabor,
      payments,
      refunds,
      advancesPaid,
      cashReturned,
      deductions,
      settlements,
      overLimitIds: overLimitIds.sort(),
      unreviewedCashIds: unreviewedCashIds.sort(),
      pendingIds: pendingIds.sort(),
    };
  }

  /**
   * @param {readonly FoldDoc[] | null | undefined} docs
   * @param {BalanceFilter} [filter]
   * @returns {Balance}
   */
  function balances(docs, filter) {
    return fold(rowIndex(docs || [], filter && filter.syncErrors), filter, 'through');
  }

  /**
   * @param {readonly FoldDoc[] | null | undefined} docs
   * @param {Readonly<Record<string, unknown>> | null | undefined} [syncErrors]
   * @returns {number}
   */
  function personBalance(docs, syncErrors) {
    return balances(docs || [], { syncErrors: syncErrors || null }).net;
  }

  /**
   * @param {number} opening
   * @param {Balance} period
   * @param {number} closing
   * @param {number} openAdvances
   * @returns {StatementLine[]}
   */
  function figureLines(opening, period, closing, openAdvances) {
    /** @type {Record<string, number>} */
    const amounts = {
      opening,
      approvedLabor: period.approvedLabor,
      payments: period.payments,
      refunds: period.refunds,
      advancesPaid: period.advancesPaid,
      cashReturned: period.cashReturned,
      netAdvances: period.netAdvances,
      deductions: period.deductions,
      settlements: period.settlements,
      closing,
      openAdvances,
    };
    return FIGURES.map((figure) => ({
      key: figure.key,
      label: figure.label,
      amount: amounts[figure.source],
      sign: figure.sign,
      entersClosing: figure.entersClosing,
    }));
  }

  /**
   * @param {readonly FoldDoc[]} docs
   * @param {BalanceFilter} [filter]
   * @returns {{ lines: readonly StatementLine[], opening: number, closing: number | null, pendingIds: readonly string[], unreviewedCashIds: readonly string[], overLimitIds: readonly string[] }}
   */
  function statementLines(docs, filter) {
    const start = filter && filter.periodStart;
    const end = filter && filter.periodEnd;
    if ((start && !end) || (!start && end)) {
      return { lines: [], opening: 0, closing: null, pendingIds: [], unreviewedCashIds: [], overLimitIds: [] };
    }
    const index = rowIndex(docs, filter && filter.syncErrors);
    const closingFold = fold(index, filter, 'through');
    if (!start && !end) {
      return {
        lines: figureLines(0, closingFold, closingFold.net, closingFold.openAdvances),
        opening: 0,
        closing: closingFold.net,
        pendingIds: closingFold.pendingIds,
        unreviewedCashIds: closingFold.unreviewedCashIds,
        overLimitIds: closingFold.overLimitIds,
      };
    }
    const opening = fold(index, filter, 'before').net;
    const period = fold(index, filter, 'inside');
    return {
      lines: figureLines(opening, period, closingFold.net, closingFold.openAdvances),
      opening,
      closing: closingFold.net,
      pendingIds: closingFold.pendingIds,
      unreviewedCashIds: closingFold.unreviewedCashIds,
      overLimitIds: closingFold.overLimitIds,
    };
  }

  /**
   * @param {number} utc
   */
  function isoDay(utc) {
    const date = new Date(utc);
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return date.getUTCFullYear() + '-' + month + '-' + day;
  }

  /**
   * @param {'week' | 'month'} kind
   * @param {string} day
   * @returns {{ periodStart: string, periodEnd: string } | null}
   */
  function periodBounds(kind, day) {
    if (kind !== 'week' && kind !== 'month') return null;
    if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
    const year = Number(day.slice(0, 4));
    const month = Number(day.slice(5, 7));
    const date = Number(day.slice(8, 10));
    const utc = new Date(Date.UTC(year, month - 1, date));
    if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== date) return null;
    if (kind === 'month') {
      return { periodStart: isoDay(Date.UTC(year, month - 1, 1)), periodEnd: isoDay(Date.UTC(year, month, 0)) };
    }
    const sinceSaturday = (utc.getUTCDay() + 1) % 7;
    const start = Date.UTC(year, month - 1, date - sinceSaturday);
    return { periodStart: isoDay(start), periodEnd: isoDay(start + 6 * 86400000) };
  }

  /**
   * @param {Record<string, PurposeRow>} table
   * @returns {string[]}
   */
  function cashPointerErrors(table) {
    /** @type {string[]} */
    const bad = [];
    for (const [name, purpose] of Object.entries(table)) {
      if (purpose.needsApproval !== false || purpose.effect.cash === 0) continue;
      for (const field of POINTER_FIELDS) {
        const names = purpose.points[field] || [];
        for (const target of names) {
          const rowAt = table[target];
          if (!rowAt || rowAt.needsApproval !== false || target === 'approveLabor' || target === 'approveDeduct') {
            bad.push(name + ' ' + field + ' ' + target);
          }
        }
      }
    }
    return bad;
  }

  /**
   * PR K owns the real function.
   * @param {string} projectId
   * @param {readonly unknown[]} txns
   * @returns {number}
   */
  function projectCost(projectId, txns) {
    void projectId;
    void txns;
    return 0;
  }

  return {
    CONTRACTOR_COST_START,
    PURPOSES,
    unitPrice,
    workPosition,
    post,
    personBalance,
    cashPointerErrors,
    projectCost,
    rowIndex,
    rowLive,
    rowCounts,
    balances,
    statementLines,
    periodBounds,
  };
});
