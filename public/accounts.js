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
   * @typedef {'lump'|'unit'|'daily'} LaborMethod
   * @typedef {{ method?: string, lumpAmount?: number, unitRate?: number, unitQty?: number, dayRate?: number, unitName?: string }} LaborAgreement
   * @typedef {{ cost: number, person: number, cash: number }} Effect
   * @typedef {{ ledger: 'labor', required: readonly string[], forbidden: readonly string[], points: Record<string, readonly string[]>, effect: Effect, statementLine: string, statementSign: number, needsApproval: boolean }} PurposeRow
   * @typedef {{ approvedQty: number|null, deliveredQty: number|null, notCompleted: number|null, earned: number, errors: string[] }} WorkPosition
   * @typedef {{ purpose: string, ledger: 'labor', amount: number, paidAs?: string, effect: Effect }} AccountDoc
   */

  /** @type {Record<string, PurposeRow>} */
  const PURPOSES = {
    laborQty: row([], [], {}, { cost: 0, person: 0, cash: 0 }, 'out', true),
    approveLabor: row([], [], {}, { cost: 1, person: 1, cash: 0 }, 'approvedLabor', false),
    advanceLabor: row([], [], {}, { cost: 0, person: -1, cash: 1 }, 'advances', false),
    payLabor: row([], [], {}, { cost: 0, person: -1, cash: 1 }, 'payments', false),
    returnAdvance: row(['targetId'], [], { targetId: ['advanceLabor'] }, { cost: 0, person: 1, cash: -1 }, 'advances', false),
    refundLabor: row(['targetId'], [], { targetId: ['payLabor'] }, { cost: 0, person: 1, cash: -1 }, 'payments', false),
    deduct: row(['targetId'], [], { targetId: ['approveLabor'] }, { cost: -1, person: -1, cash: 0 }, 'deduct', true),
    approveDeduct: row([], [], {}, { cost: 0, person: 0, cash: 0 }, 'out', false),
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
    if (!agreement || (agreement.method !== 'lump' && agreement.method !== 'unit' && agreement.method !== 'daily')) {
      blank.errors = ['method'];
      return blank;
    }
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
   * @param {string} action
   * @param {{ paidAs?: string, amount?: number, agreement?: LaborAgreement, approvedQty?: number, approved?: boolean }} input
   * @returns {{ doc: AccountDoc|null, errors: string[] }}
   */
  function post(action, input) {
    const body = input || {};
    if (action === 'payment') {
      if (body.paidAs !== 'payLabor' && body.paidAs !== 'advanceLabor') return { doc: null, errors: ['paidAs'] };
      if (!intIn(body.amount || 0, MAX_AMOUNT) || (body.amount || 0) < 1) return { doc: null, errors: ['range'] };
      const purpose = PURPOSES[body.paidAs];
      return { doc: { purpose: body.paidAs, ledger: 'labor', amount: /** @type {number} */ (body.amount), paidAs: body.paidAs, effect: purpose.effect }, errors: [] };
    }
    if (action !== 'laborQty' && action !== 'approveLabor') return { doc: null, errors: ['action'] };
    if (!body.agreement) return { doc: null, errors: ['agreement'] };
    const position = workPosition(body.agreement, body);
    if (position.errors.length) return { doc: null, errors: position.errors };
    if (action === 'approveLabor' && position.earned < 1) return { doc: null, errors: ['earned'] };
    const purpose = PURPOSES[action === 'approveLabor' ? 'approveLabor' : 'laborQty'];
    const amount = action === 'approveLabor' ? position.earned : 0;
    return { doc: { purpose: purpose === PURPOSES.approveLabor ? 'approveLabor' : 'laborQty', ledger: 'labor', amount, effect: purpose.effect }, errors: [] };
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
          if (!rowAt || rowAt.needsApproval !== false) bad.push(name + ' ' + field + ' ' + target);
        }
      }
    }
    return bad;
  }

  /**
   * While the constant is null, approved work does not change project cost.
   * @param {string} projectId
   * @param {readonly { projectId?: string, purpose?: string, amount?: number, txnDate?: string }[]} txns
   */
  function projectCost(projectId, txns) {
    if (typeof CONTRACTOR_COST_START !== 'string') return 0;
    let cost = 0;
    for (const txn of txns || []) {
      if (!txn || txn.projectId !== projectId || !txn.txnDate || txn.txnDate < CONTRACTOR_COST_START) continue;
      const purpose = txn.purpose ? PURPOSES[txn.purpose] : undefined;
      if (!purpose || purpose.needsApproval) continue;
      cost += purpose.effect.cost * (txn.amount || 0);
    }
    return cost;
  }

  return { CONTRACTOR_COST_START, PURPOSES, unitPrice, workPosition, post, cashPointerErrors, projectCost };
});
