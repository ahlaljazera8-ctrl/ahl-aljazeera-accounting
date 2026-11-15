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
    laborQty: row([], [], {}, { cost: 0, person: 0, cash: 0 }, 'out', true),
    approveLabor: row(['targetId'], [], { targetId: ['laborQty'] }, { cost: 1, person: 1, cash: 0 }, 'approvedLabor', false),
    advanceLabor: row([], [], {}, { cost: 0, person: -1, cash: 1 }, 'advances', false),
    payLabor: row([], [], {}, { cost: 0, person: -1, cash: 1 }, 'payments', false),
    returnAdvance: row(['targetId'], [], { targetId: ['advanceLabor'] }, { cost: 0, person: 1, cash: -1 }, 'advances', false),
    refundLabor: row(['targetId'], [], { targetId: ['payLabor'] }, { cost: 0, person: 1, cash: -1 }, 'payments', false),
    deduct: row(['targetId'], [], { targetId: ['approveLabor'] }, { cost: -1, person: -1, cash: 0 }, 'deduct', true),
    approveDeduct: row(['targetId'], [], { targetId: ['deduct'] }, { cost: 0, person: 0, cash: 0 }, 'out', false),
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
   * @param {number | undefined} amount
   */
  function countedAmount(amount) {
    return typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
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
   * @param {readonly AccountDoc[]} docs
   * @returns {number}
   */
  function personBalance(docs) {
    const list = docs || [];
    const marks = markerSets(list);
    /** @type {Set<string>} */
    const approved = new Set();
    for (const doc of list) {
      if (!doc || doc.purpose !== 'approveDeduct' || typeof doc.targetId !== 'string') continue;
      if (marks.reversed.has(doc.id) || marks.rejected.has(doc.targetId) || marks.reversed.has(doc.targetId)) continue;
      approved.add(doc.targetId);
    }
    let sum = 0;
    for (const doc of list) {
      if (!doc || (doc.purpose === 'deduct' && (!approved.has(doc.id) || marks.rejected.has(doc.id)))) continue;
      const purpose = PURPOSES[doc.purpose];
      if (!purpose) continue;
      sum += purpose.effect.person * countedAmount(doc.amount);
    }
    return sum;
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

  return { CONTRACTOR_COST_START, PURPOSES, unitPrice, workPosition, post, personBalance, cashPointerErrors, projectCost };
});
