// Payments on the «مقاول» screen. Loaded after accounts-work.js and before render.js.
(function (factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(globalThis, { AccountPayment: api });
})(/** @returns {AccountPaymentApi} */ function () {
  'use strict';

  const MAX_AMOUNT = 10000000000;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  /**
   * A wording swap edits this object only.
   * q19ReturnOverAdvance is بانتظار أمير. The screen does not paint it.
   * advanceNoteComma and advanceNotePlain both stay under سلفة. Whether they
   * show together is [OPEN] for Ameer via EA.
   * @type {Record<string, string>}
   */
  const SENTENCE = {
    payHeading: 'تسجيل دفعة',
    purpose: 'الغرض',
    forApproved: 'عن عمل معتمد',
    advanceComing: 'سلفة عمل قادم',
    advance: 'سلفة',
    returnHeading: 'إرجاع سلفة لم تُصرف',
    refundHeading: 'استرداد نقدي من العامل',
    advanceNoteComma: 'سلفة، ليست مصروفاً.',
    advanceNotePlain: 'السلفة ليست مصروفاً',
    before: 'قبل هذه الدفعة',
    showsOnStatement: 'تظهر الدفعة في الكشف',
    untilOwnerReviews: 'حتى يدقّقها المالك.',
    review: 'تدقيق',
    range: 'المبلغ ليس عدداً صحيحاً',
    amount: 'المبلغ ليس عدداً صحيحاً',
    overflow: 'المبلغ ليس عدداً صحيحاً',
    inexact: 'المبلغ ليس عدداً صحيحاً',
    refundOverPay: 'المُرجَع أكبر من الدفعة',
    q19ReturnOverAdvance: 'المُرجَع والتسوية أكبر من السلفة',
    save: 'حفظ',
    amountLabel: 'مبلغ',
    unreviewed: 'غير مدقّق',
    refused: 'رُفض الإرسال',
  };

  /** @type {RenderApi | null} */
  let viewApi = null;
  let draftBound = false;

  const screen = {
    arg: '',
    msg: '',
    payFor: '',
    payId: '',
    advanceId: '',
    payDone: false,
    returnFor: '',
    returnId: '',
    returnTarget: '',
    returnDone: false,
    refundFor: '',
    refundId: '',
    refundTarget: '',
    refundDone: false,
  };

  /**
   * @param {unknown} value
   */
  function esc(value) {
    const text = value == null ? '' : String(value);
    if (viewApi && viewApi.esc) return viewApi.esc(text);
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /**
   * @param {number} amount
   */
  function moneyText(amount) {
    if (viewApi && viewApi.money) return viewApi.money(amount);
    return Ledger.fmt(amount) + ' د.ع';
  }

  /**
   * @param {string} key
   * @returns {Array<Record<string, unknown>>}
   */
  function rows(key) {
    const value = get(key, []);
    return Array.isArray(value) ? /** @type {Array<Record<string, unknown>>} */ (value) : [];
  }

  /** @returns {Record<string, unknown>} */
  function syncErrors() {
    const value = get(K.syncErrors, {});
    return value && typeof value === 'object' ? /** @type {Record<string, unknown>} */ (value) : {};
  }

  /**
   * Reads Accounts.CONTRACTOR_COST_START each call. No stored copy.
   * @returns {string}
   */
  function startDate() {
    const start = typeof Accounts !== 'undefined' ? Accounts.CONTRACTOR_COST_START : null;
    return typeof start === 'string' && DATE_RE.test(start) ? start : '';
  }

  function costOpen() {
    const start = startDate();
    return start !== '' && today() >= start;
  }

  /**
   * @param {string} id
   */
  function field(id) {
    const el = document.querySelector('#' + id);
    if (!el) return '';
    const input = /** @type {HTMLInputElement} */ (el);
    return typeof input.value === 'string' ? input.value : '';
  }

  /**
   * @param {string} raw
   * @returns {number | null}
   */
  function digits(raw) {
    const text = String(raw || '').trim().replace(/,/g, '');
    if (!/^\d+$/.test(text)) return null;
    const n = Number(text);
    return Number.isSafeInteger(n) ? n : null;
  }

  /**
   * @param {unknown} src
   */
  function deviceOf(src) {
    const row = src && typeof src === 'object' ? /** @type {{ deviceId?: unknown }} */ (src) : {};
    if (typeof row.deviceId === 'string' && row.deviceId) return row.deviceId;
    if (typeof deviceId === 'string' && deviceId) return deviceId;
    return 'local';
  }

  function actor() {
    const user = me();
    const name = user && typeof user.displayName === 'string' ? user.displayName.trim() : '';
    return {
      createdBy: user && user.uid ? String(user.uid) : '',
      deviceId: deviceOf(null),
      createdByName: name.length >= 1 && name.length <= 80 ? name : '',
    };
  }

  /**
   * @param {string} purpose
   * @param {readonly string[]} errors
   */
  function painted(purpose, errors) {
    for (const code of errors) {
      if (code === 'range' || code === 'amount' || code === 'overflow' || code === 'inexact') return SENTENCE.range;
      if ((code === 'cap' || code === 'cumulative') && purpose === 'refundLabor') return SENTENCE.refundOverPay;
    }
    return '';
  }

  /**
   * @param {string} id
   * @returns {{ id: string, partyId: string, projectId: string } | null}
   */
  function storedAgreement(id) {
    const row = rows(K.agreements).find(item => item && item.id === id && String(item.id).indexOf('rev_') !== 0);
    if (!row || typeof row.id !== 'string') return null;
    if (typeof row.partyId !== 'string' || !row.partyId) return null;
    if (typeof row.projectId !== 'string' || !row.projectId) return null;
    return { id: row.id, partyId: row.partyId, projectId: row.projectId };
  }

  /** @returns {Array<Record<string, unknown>>} */
  function localLedger() {
    const errors = syncErrors();
    return rows(K.accountTxns)
      .filter(row => row && typeof row.id === 'string' && !Object.prototype.hasOwnProperty.call(errors, row.id))
      .map(row => {
        const effect = row.effect && typeof row.effect === 'object'
          ? /** @type {{ cost?: number, person?: number, cash?: number }} */ (row.effect)
          : {};
        /** @type {Record<string, unknown>} */
        const doc = {
          id: row.id,
          purpose: row.purpose,
          ledger: 'labor',
          effect: {
            cost: typeof effect.cost === 'number' ? effect.cost : 0,
            person: typeof effect.person === 'number' ? effect.person : 0,
            cash: typeof effect.cash === 'number' ? effect.cash : 0,
          },
        };
        if (typeof row.amount === 'number') doc.amount = row.amount;
        if (typeof row.targetId === 'string') doc.targetId = row.targetId;
        if (typeof row.settlesId === 'string') doc.settlesId = row.settlesId;
        return doc;
      });
  }

  /**
   * @param {string} partyId
   * @param {string} projectId
   */
  function approvedUnpaid(partyId, projectId) {
    const net = Accounts.balances(/** @type {FoldDoc[]} */ (/** @type {unknown} */ (rows(K.accountTxns))), {
      partyId,
      projectId,
      syncErrors: syncErrors(),
    }).net;
    return net > 0 ? net : 0;
  }

  /**
   * @param {number} amount
   * @param {number} approvedUnpaidAmount
   * @returns {{ payLabor: number, advanceLabor: number }}
   */
  function paymentSplit(amount, approvedUnpaidAmount) {
    const amt = typeof amount === 'number' && Number.isInteger(amount) && amount > 0 ? amount : 0;
    const unpaid = typeof approvedUnpaidAmount === 'number' && Number.isInteger(approvedUnpaidAmount) && approvedUnpaidAmount > 0
      ? approvedUnpaidAmount
      : 0;
    const payLabor = Math.min(amt, unpaid);
    const advanceLabor = amt - payLabor;
    return { payLabor, advanceLabor };
  }

  /**
   * @param {'payLabor'|'advanceLabor'|'returnAdvance'|'refundLabor'} purpose
   * @param {object} input
   * @returns {{ doc: object | null, errors: string[] }}
   */
  function cashDoc(purpose, input) {
    const src = /** @type {Record<string, unknown>} */ (input || {});
    if (purpose !== 'payLabor' && purpose !== 'advanceLabor' && purpose !== 'returnAdvance' && purpose !== 'refundLabor') {
      return { doc: null, errors: ['paidAs'] };
    }
    const cash = purpose === 'payLabor' || purpose === 'advanceLabor';
    /** @type {Record<string, unknown>} */
    const postBody = {
      id: typeof src.id === 'string' ? src.id : '',
      amount: src.amount,
    };
    if (cash) postBody.paidAs = purpose;
    else {
      postBody.targetId = typeof src.targetId === 'string' ? src.targetId : '';
      postBody.ledger = Array.isArray(src.ledger) ? src.ledger : localLedger();
    }
    const posted = Accounts.post(cash ? 'payment' : purpose, postBody);
    if (!posted.doc || posted.errors.length) return { doc: null, errors: posted.errors.slice() };
    const core = /** @type {{ amount?: number, effect?: { cost: number, person: number, cash: number } }} */ (posted.doc);
    const effect = core.effect || { cost: 0, person: 0, cash: 0 };
    /** @type {Record<string, unknown>} */
    const doc = {
      id: src.id,
      docType: 'accountTxn',
      kind: 'body',
      purpose,
      projectId: src.projectId,
      partyId: src.partyId,
      ledger: 'labor',
      currency: 'IQD',
      fxRate: 1,
      amount: core.amount,
      txnDate: today(),
      createdBy: typeof src.createdBy === 'string' ? src.createdBy : '',
      createdAtServer: null,
      deviceId: deviceOf(src),
      effect: { cost: effect.cost, person: effect.person, cash: effect.cash },
    };
    if (!cash) doc.targetId = src.targetId;
    if (typeof src.createdByName === 'string' && src.createdByName) doc.createdByName = src.createdByName;
    return { doc: /** @type {object} */ (doc), errors: [] };
  }

  /** @returns {RowIndex} */
  function indexNow() {
    return Accounts.rowIndex(/** @type {FoldDoc[]} */ (/** @type {unknown} */ (rows(K.accountTxns))), syncErrors());
  }

  /**
   * @param {string} bodyId
   * @param {RowIndex} index
   */
  function liveReview(bodyId, index) {
    const exact = 'revw_' + bodyId;
    for (const doc of Object.values(index.byId)) {
      if (!doc || typeof doc.id !== 'string') continue;
      const mark = doc.kind === 'revw' || doc.id.startsWith('revw_');
      if (!mark) continue;
      const same = doc.id === exact;
      const later = doc.id.startsWith(exact + '_') && /^[1-9]$/.test(doc.id.slice(exact.length + 1));
      if ((same || later) && Accounts.rowLive(doc, index)) return true;
    }
    return false;
  }

  /**
   * @param {string} markId
   * @param {RowIndex} index
   */
  function liveRevOf(markId, index) {
    const rev = index.byId['rev_' + markId];
    return !!(rev && Accounts.rowLive(rev, index));
  }

  /**
   * @param {string} cashId
   * @param {RowIndex} index
   * @returns {string}
   */
  function nextGeneration(cashId, index) {
    const base = 'revw_' + cashId;
    if (!index.byId[base]) return '';
    for (let n = 1; n <= 9; n += 1) {
      const gen = String(n);
      const prev = n === 1 ? base : base + '_' + String(n - 1);
      if (!liveRevOf(prev, index)) return '';
      const id = base + '_' + gen;
      const existing = index.byId[id];
      if (!existing) return gen;
      if (!Accounts.rowLive(existing, index)) continue;
    }
    return '';
  }

  /**
   * @param {string} purpose
   */
  function isCashPurpose(purpose) {
    return purpose === 'payLabor' || purpose === 'advanceLabor' || purpose === 'returnAdvance' || purpose === 'refundLabor';
  }

  /**
   * @param {object} input
   * @returns {{ doc: object | null, errors: string[] }}
   */
  function reviewDoc(input) {
    const src = /** @type {Record<string, unknown>} */ (input || {});
    const targetId = typeof src.targetId === 'string' ? src.targetId : '';
    if (!targetId) return { doc: null, errors: ['targetId'] };
    const index = indexNow();
    const cash = index.byId[targetId];
    if (!cash || !isCashPurpose(String(cash.purpose || '')) || !Accounts.rowCounts(cash, index)) {
      return { doc: null, errors: ['targetId'] };
    }
    if (liveReview(targetId, index)) return { doc: null, errors: [] };
    const requested = typeof src.generation === 'string' ? src.generation : '';
    let id = 'revw_' + targetId;
    if (requested) {
      if (!/^[1-9]$/.test(requested)) return { doc: null, errors: [] };
      const prev = requested === '1' ? 'revw_' + targetId : 'revw_' + targetId + '_' + String(Number(requested) - 1);
      if (!liveRevOf(prev, index)) return { doc: null, errors: [] };
      id = 'revw_' + targetId + '_' + requested;
      const existing = index.byId[id];
      if (existing && Accounts.rowLive(existing, index)) return { doc: null, errors: [] };
    } else if (index.byId[id]) {
      return { doc: null, errors: [] };
    }
    const currency = cash.currency === 'USD' ? 'USD' : 'IQD';
    const raw = rows(K.accountTxns).find(row => row && row.id === targetId);
    const rate = raw && typeof raw.fxRate === 'number' ? raw.fxRate : 1;
    /** @type {Record<string, unknown>} */
    const doc = {
      id,
      docType: 'accountTxn',
      kind: 'revw',
      purpose: cash.purpose,
      ledger: 'labor',
      projectId: cash.projectId,
      partyId: cash.partyId,
      currency,
      fxRate: rate,
      targetId,
      createdBy: typeof src.createdBy === 'string' ? src.createdBy : '',
      createdAtServer: null,
      deviceId: deviceOf(src),
      effect: { cost: 0, person: 0, cash: 0 },
    };
    if (typeof src.createdByName === 'string' && src.createdByName) doc.createdByName = src.createdByName;
    return { doc: /** @type {object} */ (doc), errors: [] };
  }

  /**
   * @param {object} doc
   */
  function commitBuilt(doc) {
    if (typeof AccountsView === 'undefined' || typeof AccountsView.commitDoc !== 'function') return;
    const saved = /** @type {{ id?: string }} */ (doc);
    const id = typeof saved.id === 'string' ? saved.id : '';
    const list = /** @type {readonly { id: string }[]} */ (/** @type {unknown} */ (rows(K.accountTxns)));
    AccountsView.commitDoc(id, doc, list, next => {
      set(K.accountTxns, next);
    });
  }

  /**
   * @param {string} partyId
   * @param {string} projectId
   * @param {readonly string[]} savedIds
   */
  function linkRefusal(partyId, projectId, savedIds) {
    if (!savedIds.length) return;
    const errors = syncErrors();
    const txns = rows(K.accountTxns);
    /** @type {Record<string, unknown> | null} */
    let refused = null;
    for (let i = txns.length - 1; i >= 0; i -= 1) {
      const row = txns[i];
      if (!row || typeof row.id !== 'string' || savedIds.indexOf(row.id) !== -1) continue;
      if (row.partyId !== partyId || row.projectId !== projectId) continue;
      if (!Object.prototype.hasOwnProperty.call(errors, row.id)) continue;
      if (!isCashPurpose(String(row.purpose || ''))) continue;
      const matched = txns.some(item => item && typeof item.id === 'string' && savedIds.indexOf(item.id) !== -1 && item.purpose === row.purpose);
      if (!matched) continue;
      refused = row;
      break;
    }
    if (!refused || typeof refused.id !== 'string') return;
    const next = txns.find(item => item && typeof item.id === 'string' && savedIds.indexOf(item.id) !== -1 && item.purpose === refused.purpose);
    const nextId = next && typeof next.id === 'string' ? next.id : savedIds[savedIds.length - 1];
    set(K.refusedLinks, { refusedId: refused.id, nextId });
  }

  /**
   * @param {{ id: string, partyId: string, projectId: string }} agreement
   * @param {{ createdBy: string, deviceId: string, createdByName: string }} who
   * @param {string} id
   * @param {number} amount
   * @param {string} [targetId]
   * @returns {Record<string, unknown>}
   */
  function header(agreement, who, id, amount, targetId) {
    /** @type {Record<string, unknown>} */
    const input = {
      id,
      amount,
      projectId: agreement.projectId,
      partyId: agreement.partyId,
      createdBy: who.createdBy,
      deviceId: who.deviceId,
      currency: 'IQD',
      fxRate: 1,
    };
    if (who.createdByName) input.createdByName = who.createdByName;
    if (targetId) input.targetId = targetId;
    return input;
  }

  /**
   * @param {{ id: string, partyId: string, projectId: string }} agreement
   */
  function ensurePay(agreement) {
    if (screen.payFor === agreement.id && screen.payId) return;
    screen.payFor = agreement.id;
    screen.payId = uuid();
    screen.advanceId = uuid();
    screen.payDone = false;
    screen.msg = '';
  }

  /**
   * @param {{ id: string, partyId: string, projectId: string }} agreement
   */
  function ensureReturn(agreement) {
    if (screen.returnFor === agreement.id && screen.returnId) return;
    screen.returnFor = agreement.id;
    screen.returnId = uuid();
    screen.returnTarget = '';
    screen.returnDone = false;
  }

  /**
   * @param {{ id: string, partyId: string, projectId: string }} agreement
   */
  function ensureRefund(agreement) {
    if (screen.refundFor === agreement.id && screen.refundId) return;
    screen.refundFor = agreement.id;
    screen.refundId = uuid();
    screen.refundTarget = '';
    screen.refundDone = false;
  }

  /**
   * @param {string} partyId
   * @param {string} projectId
   * @param {string} purpose
   * @returns {FoldDoc[]}
   */
  function offeredRows(partyId, projectId, purpose) {
    const index = indexNow();
    /** @type {FoldDoc[]} */
    const found = [];
    for (const row of Object.values(index.byId)) {
      if (!row || row.purpose !== purpose || row.partyId !== partyId || row.projectId !== projectId) continue;
      if (!Accounts.rowCounts(row, index)) continue;
      found.push(row);
    }
    return found;
  }

  /**
   * @param {{ id: string, partyId: string, projectId: string }} agreement
   * @param {'payLabor' | 'advanceLabor'} purpose
   * @param {number} amount
   * @param {string} id
   * @param {{ createdBy: string, deviceId: string, createdByName: string }} who
   * @returns {{ doc: object | null, errors: string[] }}
   */
  function buildCash(agreement, purpose, amount, id, who) {
    return cashDoc(purpose, header(agreement, who, id, amount));
  }

  /**
   * @param {{ id: string, partyId: string, projectId: string }} agreement
   * @param {HTMLButtonElement} button
   */
  function savePayment(agreement, button) {
    if (!costOpen() || screen.payDone) return;
    const amount = digits(field('cp-amount'));
    if (amount == null || amount < 1 || amount > MAX_AMOUNT) {
      screen.msg = SENTENCE.range;
      button.disabled = false;
      if (viewApi) viewApi.render();
      return;
    }
    const split = paymentSplit(amount, approvedUnpaid(agreement.partyId, agreement.projectId));
    const who = actor();
    /** @type {string[]} */
    const savedIds = [];
    if (split.payLabor > 0) {
      const built = buildCash(agreement, 'payLabor', split.payLabor, screen.payId, who);
      if (!built.doc) {
        screen.msg = painted('payLabor', built.errors);
        button.disabled = false;
        if (viewApi) viewApi.render();
        return;
      }
      commitBuilt(built.doc);
      savedIds.push(screen.payId);
    }
    if (split.advanceLabor > 0) {
      const built = buildCash(agreement, 'advanceLabor', split.advanceLabor, screen.advanceId, who);
      if (!built.doc) {
        screen.msg = painted('advanceLabor', built.errors);
        button.disabled = false;
        if (viewApi) viewApi.render();
        return;
      }
      commitBuilt(built.doc);
      savedIds.push(screen.advanceId);
    }
    linkRefusal(agreement.partyId, agreement.projectId, savedIds);
    screen.msg = '';
    screen.payDone = true;
    button.disabled = false;
    if (viewApi) viewApi.render();
  }

  /**
   * @param {'returnAdvance' | 'refundLabor'} purpose
   * @param {{ id: string, partyId: string, projectId: string }} agreement
   * @param {HTMLButtonElement} button
   */
  function savePointer(purpose, agreement, button) {
    if (!costOpen()) return;
    const returning = purpose === 'returnAdvance';
    if (returning ? screen.returnDone : screen.refundDone) return;
    const targetId = returning ? screen.returnTarget : screen.refundTarget;
    const offered = offeredRows(agreement.partyId, agreement.projectId, returning ? 'advanceLabor' : 'payLabor');
    if (!targetId || !offered.some(row => row.id === targetId)) {
      button.disabled = false;
      return;
    }
    const amount = digits(field(returning ? 'cp-return' : 'cp-refund'));
    if (amount == null || amount < 1 || amount > MAX_AMOUNT) {
      screen.msg = SENTENCE.range;
      button.disabled = false;
      if (viewApi) viewApi.render();
      return;
    }
    const who = actor();
    const id = returning ? screen.returnId : screen.refundId;
    const built = cashDoc(purpose, header(agreement, who, id, amount, targetId));
    if (!built.doc) {
      screen.msg = painted(purpose, built.errors);
      button.disabled = false;
      if (viewApi) viewApi.render();
      return;
    }
    commitBuilt(built.doc);
    linkRefusal(agreement.partyId, agreement.projectId, [id]);
    screen.msg = '';
    if (returning) screen.returnDone = true;
    else screen.refundDone = true;
    button.disabled = false;
    if (viewApi) viewApi.render();
  }

  /**
   * @param {{ id: string, partyId: string, projectId: string }} agreement
   * @param {string} cashId
   * @param {HTMLButtonElement} button
   */
  function saveReview(agreement, cashId, button) {
    if (!costOpen() || !cashId) return;
    const index = indexNow();
    const cash = index.byId[cashId];
    if (!cash || cash.partyId !== agreement.partyId || cash.projectId !== agreement.projectId || !Accounts.rowCounts(cash, index) || liveReview(cashId, index)) {
      button.disabled = false;
      return;
    }
    const who = actor();
    const generation = nextGeneration(cashId, index);
    /** @type {Record<string, unknown>} */
    const input = {
      targetId: cashId,
      projectId: agreement.projectId,
      partyId: agreement.partyId,
      createdBy: who.createdBy,
      deviceId: who.deviceId,
    };
    if (who.createdByName) input.createdByName = who.createdByName;
    if (generation) input.generation = generation;
    const built = reviewDoc(input);
    if (!built.doc) {
      button.disabled = false;
      return;
    }
    commitBuilt(built.doc);
    button.disabled = false;
    if (viewApi) viewApi.render();
  }

  /**
   * @param {HTMLButtonElement} button
   * @returns {boolean}
   */
  function onClick(button) {
    if (!button) return false;
    const id = button.id || '';
    const dataset = button.dataset || {};
    const ours =
      id === 'act-pay-labor' ||
      id === 'act-advance-labor' ||
      id === 'act-return-advance' ||
      id === 'act-refund-labor' ||
      id === 'act-review-cash' ||
      !!dataset.ctarget;
    if (!ours) return false;
    if (button.disabled && id.indexOf('act-') === 0) return true;
    if (!costOpen()) return true;
    if (dataset.ctarget && dataset.cpurpose === 'returnAdvance') {
      screen.returnTarget = dataset.ctarget;
      if (viewApi) viewApi.render();
      return true;
    }
    if (dataset.ctarget && dataset.cpurpose === 'refundLabor') {
      screen.refundTarget = dataset.ctarget;
      if (viewApi) viewApi.render();
      return true;
    }
    const agreement = storedAgreement(screen.arg);
    if (!agreement) return true;
    if (id === 'act-pay-labor' || id === 'act-advance-labor') {
      if (screen.payDone) return true;
      button.disabled = true;
      savePayment(agreement, button);
      return true;
    }
    if (id === 'act-return-advance') {
      if (screen.returnDone) return true;
      button.disabled = true;
      savePointer('returnAdvance', agreement, button);
      return true;
    }
    if (id === 'act-refund-labor') {
      if (screen.refundDone) return true;
      button.disabled = true;
      savePointer('refundLabor', agreement, button);
      return true;
    }
    if (id === 'act-review-cash') {
      button.disabled = true;
      saveReview(agreement, dataset.creview || '', button);
      return true;
    }
    return true;
  }

  function register() {
    if (typeof AccountActions === 'undefined' || !AccountActions) return;
    /** @type {AccountAction[]} */
    const actions = [
      {
        id: 'pay-labor',
        tab: 'contractor',
        label: SENTENCE.payHeading,
        buttonId: 'act-pay-labor',
        renderForm: () => '',
        onClick,
        save: input => cashDoc('payLabor', /** @type {Record<string, unknown>} */ (input)),
      },
      {
        id: 'advance-labor',
        tab: 'contractor',
        label: SENTENCE.advanceComing,
        buttonId: 'act-advance-labor',
        renderForm: () => '',
        onClick,
        save: input => cashDoc('advanceLabor', /** @type {Record<string, unknown>} */ (input)),
      },
      {
        id: 'return-advance',
        tab: 'contractor',
        label: SENTENCE.returnHeading,
        buttonId: 'act-return-advance',
        renderForm: () => '',
        onClick,
        save: input => cashDoc('returnAdvance', /** @type {Record<string, unknown>} */ (input)),
      },
      {
        id: 'refund-labor',
        tab: 'contractor',
        label: SENTENCE.refundHeading,
        buttonId: 'act-refund-labor',
        renderForm: () => '',
        onClick,
        save: input => cashDoc('refundLabor', /** @type {Record<string, unknown>} */ (input)),
      },
      {
        id: 'review-cash',
        tab: 'contractor',
        label: SENTENCE.review,
        buttonId: 'act-review-cash',
        renderForm: () => '',
        onClick,
        save: input => reviewDoc(/** @type {Record<string, unknown>} */ (input)),
      },
    ];
    for (const action of actions) AccountActions.push(action);
  }

  function bindDraft() {
    if (draftBound) return;
    if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
    draftBound = true;
    document.addEventListener('input', event => {
      const target = /** @type {HTMLInputElement | null} */ (event.target);
      if (!target) return;
      if (target.id !== 'cp-amount' && target.id !== 'cp-return' && target.id !== 'cp-refund') return;
      if (viewApi) viewApi.render();
    });
  }

  /**
   * @param {RenderApi} api
   */
  function install(api) {
    viewApi = api;
    screen.arg = '';
    screen.msg = '';
    screen.payFor = '';
    screen.payId = '';
    screen.advanceId = '';
    screen.payDone = false;
    screen.returnFor = '';
    screen.returnId = '';
    screen.returnTarget = '';
    screen.returnDone = false;
    screen.refundFor = '';
    screen.refundId = '';
    screen.refundTarget = '';
    screen.refundDone = false;
    const prior = api.views.contractor;
    api.views.contractor = arg => {
      const base = typeof prior === 'function' ? prior(arg || '') : '';
      return base + blocks(arg || '');
    };
    register();
    bindDraft();
  }

  /**
   * @param {string} arg
   */
  function blocks(arg) {
    screen.arg = arg || '';
    if (!arg || arg === 'new') {
      screen.payFor = '';
      screen.returnFor = '';
      screen.refundFor = '';
      return '';
    }
    const user = me();
    if (!user || !Ledger.can(user, 'owner')) return '';
    const agreement = storedAgreement(arg);
    if (!agreement || !costOpen()) return '';
    return paymentBlock(agreement) + pointerBlock(agreement, 'returnAdvance') + pointerBlock(agreement, 'refundLabor') + cashList(agreement);
  }

  /**
   * @param {{ id: string, partyId: string, projectId: string }} agreement
   */
  function paymentBlock(agreement) {
    ensurePay(agreement);
    const raw = field('cp-amount');
    const amount = digits(raw);
    const split = amount != null && amount >= 1
      ? paymentSplit(amount, approvedUnpaid(agreement.partyId, agreement.projectId))
      : { payLabor: 0, advanceLabor: 0 };
    let preview = '<div class="note">' + SENTENCE.before + '</div>';
    if (split.payLabor > 0) {
      preview += '<div class="kv"><span>' + SENTENCE.forApproved + '</span><b>' + moneyText(split.payLabor) + '</b></div>';
    }
    if (split.advanceLabor > 0) {
      preview += '<div class="kv"><span>' + SENTENCE.advance + '</span><b>' + moneyText(split.advanceLabor) + '</b></div>';
      preview += '<div class="note">' + SENTENCE.advanceNoteComma + '</div>';
      preview += '<div class="note">' + SENTENCE.advanceNotePlain + '</div>';
    }
    let purpose = '<div class="note">' + SENTENCE.purpose + '</div><div class="pills">';
    if (split.payLabor > 0) purpose += '<span class="pill on">' + SENTENCE.forApproved + '</span>';
    if (split.advanceLabor > 0) purpose += '<span class="pill on">' + SENTENCE.advanceComing + '</span>';
    purpose += '</div>';
    const buttonId = split.advanceLabor > 0 && split.payLabor === 0 ? 'act-advance-labor' : 'act-pay-labor';
    const off = screen.payDone ? ' disabled' : '';
    const msg = screen.msg ? '<div id="cp-msg" class="msg">' + esc(screen.msg) + '</div>' : '';
    return (
      '<div class="card" id="cp-pay"><h2>' + SENTENCE.payHeading + '</h2>' +
      '<label class="field">' + SENTENCE.amountLabel + '<input id="cp-amount" class="full" inputmode="numeric" value="' + esc(raw) + '"></label>' +
      '<div id="cp-preview">' + preview + '</div>' +
      '<div id="cp-purpose">' + purpose + '</div>' +
      '<button type="button" class="btn" id="' + buttonId + '"' + off + '>' + SENTENCE.save + '</button>' +
      msg + '</div>'
    );
  }

  /**
   * @param {{ id: string, partyId: string, projectId: string }} agreement
   * @param {'returnAdvance' | 'refundLabor'} purpose
   */
  function pointerBlock(agreement, purpose) {
    const returning = purpose === 'returnAdvance';
    if (returning) ensureReturn(agreement);
    else ensureRefund(agreement);
    const named = returning ? 'advanceLabor' : 'payLabor';
    const offered = offeredRows(agreement.partyId, agreement.projectId, named);
    const selected = returning ? screen.returnTarget : screen.refundTarget;
    const chosen = offered.some(row => row.id === selected) ? selected : '';
    if (returning) screen.returnTarget = chosen;
    else screen.refundTarget = chosen;
    const raw = field(returning ? 'cp-return' : 'cp-refund');
    const amount = digits(raw);
    const pills = offered.map(row => {
      const on = row.id === chosen ? ' on' : '';
      const amountText = typeof row.amount === 'number' ? moneyText(row.amount) : '';
      return '<button type="button" class="pill' + on + '" data-ctarget="' + esc(row.id) + '" data-cpurpose="' + purpose + '">' + amountText + '</button>';
    }).join('');
    const preview = amount != null && amount >= 1
      ? '<div class="kv"><span>' + SENTENCE.amountLabel + '</span><b>' + moneyText(amount) + '</b></div>'
      : '';
    const done = returning ? screen.returnDone : screen.refundDone;
    const off = !chosen || done ? ' disabled' : '';
    const heading = returning ? SENTENCE.returnHeading : SENTENCE.refundHeading;
    const inputId = returning ? 'cp-return' : 'cp-refund';
    const buttonId = returning ? 'act-return-advance' : 'act-refund-labor';
    return (
      '<div class="card"><h2>' + heading + '</h2><div class="pills">' + pills + '</div>' +
      '<label class="field">' + SENTENCE.amountLabel + '<input id="' + inputId + '" class="full" inputmode="numeric" value="' + esc(raw) + '"></label>' +
      preview +
      '<button type="button" class="btn" id="' + buttonId + '"' + off + '>' + SENTENCE.save + '</button></div>'
    );
  }

  /**
   * @param {{ id: string, partyId: string, projectId: string }} agreement
   */
  function cashList(agreement) {
    const index = indexNow();
    const errors = syncErrors();
    let html = '';
    for (const row of Object.values(index.byId)) {
      if (!row || !isCashPurpose(String(row.purpose || ''))) continue;
      if (row.partyId !== agreement.partyId || row.projectId !== agreement.projectId) continue;
      const refused = Object.prototype.hasOwnProperty.call(errors, row.id);
      if (refused) {
        html += '<div class="card"><div class="note">' + SENTENCE.refused + '</div><b>' + esc(row.id) + '</b></div>';
      }
      if (Accounts.rowCounts(row, index) && !liveReview(row.id, index)) {
        html +=
          '<div class="card"><div class="note">' + SENTENCE.unreviewed + '</div>' +
          '<div class="note">' + SENTENCE.showsOnStatement + '</div>' +
          '<div class="note">' + SENTENCE.untilOwnerReviews + '</div>' +
          '<button type="button" class="btn" id="act-review-cash" data-creview="' + esc(row.id) + '">' + SENTENCE.review + '</button></div>';
      }
    }
    const link = get(K.refusedLinks, null);
    const pair = link && typeof link === 'object' ? /** @type {{ refusedId?: unknown, nextId?: unknown }} */ (link) : null;
    if (pair && typeof pair.refusedId === 'string' && typeof pair.nextId === 'string' && Object.prototype.hasOwnProperty.call(errors, pair.refusedId)) {
      html +=
        '<div class="card" data-refused-link="1"><div class="note">' + SENTENCE.refused + '</div><b>' +
        esc(pair.refusedId) + '</b><b>' + esc(pair.nextId) + '</b></div>';
    }
    return html;
  }

  return {
    install,
    paymentSplit,
    cashDoc,
    reviewDoc,
  };
});
