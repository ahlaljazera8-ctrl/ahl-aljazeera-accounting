// «مقاول» screen. Agreement, measurement, and approval. Loaded after accounts-view.js and before render.js.
(function (factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(globalThis, { AccountWork: api });
})(/** @returns {AccountWorkApi} */ function () {
  'use strict';

  const MAX_AMOUNT = 10000000000;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  /**
   * Same civil-date check as entryDateOk in firestore.rules.
   * @param {unknown} value
   */
  function civilDate(value) {
    return typeof value === 'string'
      && /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)
      && value >= '2000-01-01'
      && value <= '2100-12-31'
      && !/^\d{4}-02-3[01]$/.test(value)
      && !/^\d{4}-(04|06|09|11)-31$/.test(value);
  }

  /**
   * بانتظار أمير. Not treated as approved.
   * A later wording swap edits this object only.
   * unitByProgress is not painted. The unit method label stays بسعر الوحدة.
   * newContract is shown only on the date-gated #subnew path.
   */
  const pendingAmeer = {
    newContract: 'العقد الجديد من شاشة مقاول',
    unitByProgress: 'حسب الإنجاز (الكمية × سعر الوحدة)',
  };

  /** @type {Record<string, string>} */
  const SENTENCE = {
    method: 'طريقة الدفع لا تطابق القياس',
    percent: 'طريقة الدفع لا تطابق القياس',
    lump: 'المبلغ ليس عدداً صحيحاً',
    milestone: 'المبلغ ليس عدداً صحيحاً',
    range: 'المبلغ ليس عدداً صحيحاً',
    amount: 'المبلغ ليس عدداً صحيحاً',
    overflow: 'المبلغ ليس عدداً صحيحاً',
    inexact: 'المبلغ ليس عدداً صحيحاً',
    earned: 'لا اعتماد بلا قياس',
    agreement: 'الاتفاق غير موجود',
    approved: 'القياس معتمد مسبقاً',
  };

  /** @type {Record<PayMethod, string>} */
  const METHOD_LABEL = {
    lump: 'مبلغ مقطوع',
    unit: 'بسعر الوحدة',
    daily: 'باليوم',
    milestone: 'مرحلة',
  };

  /** @type {RenderApi | null} */
  let viewApi = null;

  const screen = {
    creating: false,
    formId: '',
    method: /** @type {PayMethod} */ ('unit'),
    partyId: '',
    projectId: '',
    arg: '',
    msg: '',
    measureId: '',
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
   * @param {string} agreementId
   * @param {string} gen
   * @returns {string}
   */
  function slotBodyId(agreementId, gen) {
    const bare = String(agreementId || '').replace(/-/g, '');
    if (!/^[1-9]$/.test(gen)) return '';
    return '000' + bare + gen;
  }

  /**
   * @param {unknown} n
   * @param {number} min
   * @param {number} max
   */
  function intBetween(n, min, max) {
    return typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max;
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
   * @param {string} id
   * @returns {number | null}
   */
  function plainField(id) {
    const host = /** @type {typeof globalThis & { AccountPayment?: { plainAmount?: (value: string) => number | null } }} */ (globalThis);
    if (typeof host.AccountPayment === 'undefined' || !host.AccountPayment || typeof host.AccountPayment.plainAmount !== 'function') return null;
    return host.AccountPayment.plainAmount(field(id));
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
   * @param {readonly string[]} errors
   */
  function sentence(errors) {
    for (const code of errors) {
      if (SENTENCE[code]) return SENTENCE[code];
    }
    return '';
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
   * @param {string} agreementId
   */
  function liveReversal(agreementId) {
    const errors = syncErrors();
    return rows(K.agreements).some(row => {
      if (!row || typeof row.id !== 'string') return false;
      const hits = row.id === 'rev_' + agreementId || row.reversesId === agreementId;
      if (!hits) return false;
      return !Object.prototype.hasOwnProperty.call(errors, row.id);
    });
  }

  /**
   * @param {string} agreementId
   */
  function refusedReversal(agreementId) {
    return Object.prototype.hasOwnProperty.call(syncErrors(), 'rev_' + agreementId);
  }

  /**
   * @param {string} projectId
   */
  function projectOpen(projectId) {
    const row = rows(K.projects).find(item => item && item.id === projectId);
    return !!(row && row.status === 'active');
  }

  /**
   * @param {AgreementDocInput} input
   * @returns {{ doc: object | null, errors: string[] }}
   */
  function agreementDoc(input) {
    const src = input || /** @type {AgreementDocInput} */ ({});
    const method = src.method;
    if (method !== 'lump' && method !== 'unit' && method !== 'daily' && method !== 'milestone') {
      return { doc: null, errors: ['method'] };
    }
    const description = typeof src.description === 'string' ? src.description.trim() : '';
    if (description.length < 1 || description.length > 500) return { doc: null, errors: ['description'] };
    if (typeof src.id !== 'string' || !UUID_RE.test(src.id)) return { doc: null, errors: ['id'] };
    if (typeof src.partyId !== 'string' || !src.partyId) return { doc: null, errors: ['party'] };
    if (typeof src.projectId !== 'string' || !src.projectId) return { doc: null, errors: ['project'] };
    /** @type {Record<string, unknown>} */
    const doc = {
      id: src.id,
      docType: 'agreement',
      partyId: src.partyId,
      projectId: src.projectId,
      method,
      description,
      currency: 'IQD',
      createdBy: typeof src.createdBy === 'string' ? src.createdBy : '',
      createdAtServer: null,
      deviceId: deviceOf(src),
    };
    if (method === 'lump') {
      if (!intBetween(src.lumpAmount, 1, MAX_AMOUNT)) return { doc: null, errors: ['lump'] };
      doc.lumpAmount = src.lumpAmount;
    } else if (method === 'unit') {
      if (!intBetween(src.unitRate, 1, 100000000) || !intBetween(src.unitQty, 1, 1000000)) {
        return { doc: null, errors: ['range'] };
      }
      const name = typeof src.unitName === 'string' ? src.unitName.trim() : '';
      if (name.length < 1 || name.length > 80) return { doc: null, errors: ['range'] };
      doc.unitRate = src.unitRate;
      doc.unitQty = src.unitQty;
      doc.unitName = name;
    } else if (method === 'daily') {
      if (!intBetween(src.dayRate, 1, 100000000)) return { doc: null, errors: ['range'] };
      doc.dayRate = src.dayRate;
    } else {
      if (!intBetween(src.milestoneAmount, 1, MAX_AMOUNT)) return { doc: null, errors: ['milestone'] };
      doc.milestoneAmount = src.milestoneAmount;
      doc.milestoneMode = 'amount';
    }
    return { doc: /** @type {object} */ (doc), errors: [] };
  }

  /**
   * @param {{ agreement: StoredAgreement, reversalReason: string, createdBy: string, deviceId: string }} input
   * @returns {{ doc: object | null, errors: string[] }}
   */
  function agreementReversalDoc(input) {
    const agreement = input && input.agreement;
    if (!agreement || typeof agreement.id !== 'string' || agreement.id.indexOf('rev_') === 0) {
      return { doc: null, errors: ['kind'] };
    }
    const reason = input.reversalReason == null ? '' : String(input.reversalReason).trim();
    if (reason.length < 1 || reason.length > 500) return { doc: null, errors: ['reason'] };
    /** @type {Record<string, unknown>} */
    const doc = {
      id: 'rev_' + agreement.id,
      docType: 'agreement',
      partyId: agreement.partyId,
      projectId: agreement.projectId,
      method: agreement.method,
      description: agreement.description,
      currency: 'IQD',
      createdBy: input.createdBy,
      createdAtServer: null,
      deviceId: input.deviceId,
      reversesId: agreement.id,
      reversalReason: reason,
    };
    if (agreement.method === 'lump' && agreement.lumpAmount !== undefined) doc.lumpAmount = agreement.lumpAmount;
    if (agreement.method === 'unit') {
      if (agreement.unitRate !== undefined) doc.unitRate = agreement.unitRate;
      if (agreement.unitQty !== undefined) doc.unitQty = agreement.unitQty;
      if (agreement.unitName !== undefined) doc.unitName = agreement.unitName;
    }
    if (agreement.method === 'daily' && agreement.dayRate !== undefined) doc.dayRate = agreement.dayRate;
    if (agreement.method === 'milestone') {
      if (agreement.milestoneAmount !== undefined) doc.milestoneAmount = agreement.milestoneAmount;
      doc.milestoneMode = agreement.milestoneMode || 'amount';
    }
    return { doc: /** @type {object} */ (doc), errors: [] };
  }

  /**
   * @param {string} agreementId
   */
  function slotAttempt(agreementId) {
    const txns = rows(K.accountTxns);
    const errors = syncErrors();
    for (let n = 1; n <= 9; n += 1) {
      const id = slotBodyId(agreementId, String(n));
      const body = txns.find(row => row && row.id === id);
      if (!body || Object.prototype.hasOwnProperty.call(errors, id)) return n;
      const rejId = 'rej_' + id;
      const revId = 'rev_appr_' + id;
      const rej = txns.find(row => row && row.id === rejId);
      const rev = txns.find(row => row && row.id === revId);
      const closed =
        (!!rej && !Object.prototype.hasOwnProperty.call(errors, rejId)) ||
        (!!rev && !Object.prototype.hasOwnProperty.call(errors, revId));
      if (closed && n < 9) continue;
      return n;
    }
    return 9;
  }

  /**
   * @param {StoredAgreement} agreement
   */
  function measurementId(agreement) {
    if (agreement.method === 'lump' || agreement.method === 'milestone') {
      return slotBodyId(agreement.id, String(slotAttempt(agreement.id)));
    }
    if (!UUID_RE.test(screen.measureId) || rows(K.accountTxns).some(row => row && row.id === screen.measureId)) {
      screen.measureId = uuid();
    }
    return screen.measureId;
  }

  /**
   * @param {LaborWorkInput} input
   * @param {'laborQty' | 'approveLabor'} action
   * @returns {{ doc: object | null, errors: string[] }}
   */
  function workDoc(input, action) {
    const src = input || {};
    const agreement = src.agreement;
    if (!agreement) {
      const posted = Accounts.post(action, src);
      return { doc: null, errors: posted.errors.slice() };
    }
    const agreementId = agreement.id || src.agreementId || '';
    if (agreementId && liveReversal(agreementId)) return { doc: null, errors: ['cancelled'] };
    const method = agreement.method;
    const slot = method === 'lump' || method === 'milestone';
    const id = action === 'approveLabor' ? 'appr_' + (src.targetId || '') : src.id || '';
    if (action === 'laborQty') {
      if (slot) {
        const gen = src.gen || (typeof src.id === 'string' ? src.id.slice(-1) : '');
        if (!src.id || src.id !== slotBodyId(agreementId, gen)) return { doc: null, errors: ['method'] };
      } else if (method === 'unit' || method === 'daily') {
        if (typeof src.id !== 'string' || !UUID_RE.test(src.id)) return { doc: null, errors: ['method'] };
        const qty = typeof src.approvedQty === 'number' ? src.approvedQty : src.qty;
        if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > 100000000) {
          return { doc: null, errors: ['range'] };
        }
      } else return { doc: null, errors: ['method'] };
    }
    if (action === 'approveLabor' && src.targetId && liveApproval(src.targetId)) {
      return { doc: null, errors: ['approved'] };
    }
    /** @type {Record<string, unknown>} */
    const postBody = {
      id: action === 'approveLabor' ? id : src.id,
      agreement,
    };
    if (typeof src.approvedQty === 'number') postBody.approvedQty = src.approvedQty;
    if (typeof src.qty === 'number' && typeof src.approvedQty !== 'number') postBody.approvedQty = src.qty;
    if (action === 'approveLabor') {
      const targetId = typeof src.targetId === 'string' ? src.targetId : '';
      postBody.targetId = targetId;
      const found = rows(K.accountTxns).find(row => row && row.id === targetId && row.purpose === 'laborQty');
      postBody.target = found || { id: targetId, purpose: 'laborQty' };
    }
    const posted = Accounts.post(action, postBody);
    if (!posted.doc || posted.errors.length) return { doc: null, errors: posted.errors.slice() };
    const core = /** @type {{ amount?: number, effect?: { cost: number, person: number, cash: number } }} */ (posted.doc);
    /** @type {Record<string, unknown>} */
    const doc = {
      id: action === 'approveLabor' ? id : src.id,
      docType: 'accountTxn',
      kind: action === 'approveLabor' ? 'appr' : 'body',
      purpose: action,
      projectId: src.projectId || agreement.projectId,
      partyId: src.partyId || agreement.partyId,
      agreementId,
      ledger: 'labor',
      currency: 'IQD',
      fxRate: 1,
      createdBy: typeof src.createdBy === 'string' ? src.createdBy : '',
      createdAtServer: null,
      deviceId: deviceOf(src),
    };
    if (typeof src.createdByName === 'string' && src.createdByName) doc.createdByName = src.createdByName;
    if (action === 'approveLabor') {
      doc.targetId = src.targetId;
      doc.amount = core.amount;
      doc.txnDate = today();
      doc.effect = core.effect;
      if (method === 'unit' || method === 'daily') {
        const qty = typeof src.approvedQty === 'number' ? src.approvedQty : src.qty;
        if (typeof qty === 'number') doc.qty = qty;
      }
    } else if (method === 'unit' || method === 'daily') {
      const qty = typeof src.approvedQty === 'number' ? src.approvedQty : src.qty;
      if (typeof qty === 'number') doc.qty = qty;
      if (civilDate(src.txnDate)) doc.txnDate = src.txnDate;
    } else if (civilDate(src.txnDate)) doc.txnDate = src.txnDate;
    return { doc: /** @type {object} */ (doc), errors: [] };
  }

  /**
   * @param {string} bodyId
   */
  function liveApproval(bodyId) {
    const id = 'appr_' + bodyId;
    const errors = syncErrors();
    if (Object.prototype.hasOwnProperty.call(errors, id)) return false;
    const txns = rows(K.accountTxns);
    const appr = txns.find(row => row && row.id === id);
    if (!appr) return false;
    const revId = 'rev_' + id;
    const rev = txns.find(row => row && row.id === revId);
    if (rev && !Object.prototype.hasOwnProperty.call(errors, revId)) return false;
    return true;
  }

  /**
   * @param {LaborWorkInput} input
   * @returns {{ doc: object | null, errors: string[] }}
   */
  function laborQtyDoc(input) {
    return workDoc(input, 'laborQty');
  }

  /**
   * @param {LaborWorkInput} input
   * @returns {{ doc: object | null, errors: string[] }}
   */
  function approveLaborDoc(input) {
    return workDoc(input, 'approveLabor');
  }

  /**
   * @param {string} key
   * @param {string} id
   * @param {object} doc
   */
  function commitBuilt(key, id, doc) {
    if (typeof AccountsView === 'undefined' || typeof AccountsView.commitDoc !== 'function') return;
    const list = /** @type {readonly { id: string }[]} */ (/** @type {unknown} */ (rows(key)));
    AccountsView.commitDoc(id, doc, list, next => {
      set(key, next);
    });
  }

  /**
   * @param {string} hash
   */
  function go(hash) {
    if (typeof location !== 'undefined' && location) location.hash = hash;
    if (viewApi) viewApi.render();
  }

  /**
   * @param {HTMLButtonElement} button
   */
  function saveAgreement(button) {
    if (!costOpen()) return;
    if (!screen.formId) screen.formId = uuid();
    const who = actor();
    const built = agreementDoc({
      id: screen.formId,
      partyId: screen.partyId,
      projectId: screen.projectId,
      method: screen.method,
      description: field('cw-desc'),
      lumpAmount: /** @type {number} */ (plainField('cw-lump')),
      unitRate: /** @type {number} */ (plainField('cw-rate')),
      unitQty: /** @type {number} */ (digits(field('cw-per'))),
      unitName: field('cw-unit'),
      dayRate: /** @type {number} */ (plainField('cw-day')),
      milestoneAmount: /** @type {number} */ (plainField('cw-mile')),
      createdBy: who.createdBy,
      deviceId: who.deviceId,
    });
    if (!built.doc || built.errors.length) {
      screen.msg = sentence(built.errors);
      if (built.errors.indexOf('description') === -1) button.disabled = false;
      if (viewApi) viewApi.render();
      return;
    }
    const saved = /** @type {{ id: string }} */ (built.doc);
    commitBuilt(K.agreements, saved.id, built.doc);
    screen.msg = '';
    button.disabled = false;
    go('#contractor/' + saved.id);
  }

  /**
   * @param {StoredAgreement | null} agreement
   */
  function saveMeasure(agreement) {
    if (!costOpen() || !agreement) return;
    const needsQty = agreement.method === 'unit' || agreement.method === 'daily';
    const qty = digits(field('cw-qty') || field('cw-days'));
    if (needsQty && (qty == null || qty < 1 || qty > 100000000)) {
      screen.msg = sentence(['range']);
      return;
    }
    const who = actor();
    const id = measurementId(agreement);
    /** @type {LaborWorkInput} */
    const input = {
      id,
      agreement,
      agreementId: agreement.id,
      gen: agreement.method === 'lump' || agreement.method === 'milestone' ? id.slice(-1) : undefined,
      projectId: agreement.projectId,
      partyId: agreement.partyId,
      createdBy: who.createdBy,
      deviceId: who.deviceId,
      createdByName: who.createdByName,
      txnDate: today(),
    };
    if (qty != null) {
      input.approvedQty = qty;
      input.qty = qty;
    }
    const built = laborQtyDoc(input);
    if (!built.doc || built.errors.length) {
      screen.msg = sentence(built.errors);
      return;
    }
    const saved = /** @type {{ id: string }} */ (built.doc);
    commitBuilt(K.accountTxns, saved.id, built.doc);
    if (agreement.method === 'unit' || agreement.method === 'daily') screen.measureId = '';
    screen.msg = '';
  }

  /**
   * @param {StoredAgreement | null} agreement
   * @param {Record<string, unknown> | null} body
   */
  function saveApproval(agreement, body) {
    if (!costOpen() || !agreement || !body || typeof body.id !== 'string') return;
    const who = actor();
    const qty = typeof body.qty === 'number' ? body.qty : undefined;
    const built = approveLaborDoc({
      id: 'appr_' + body.id,
      targetId: body.id,
      agreement,
      agreementId: agreement.id,
      projectId: agreement.projectId,
      partyId: agreement.partyId,
      createdBy: who.createdBy,
      deviceId: who.deviceId,
      createdByName: who.createdByName,
      approvedQty: qty,
      qty,
    });
    if (!built.doc || built.errors.length) {
      screen.msg = sentence(built.errors);
      return;
    }
    const saved = /** @type {{ id: string }} */ (built.doc);
    commitBuilt(K.accountTxns, saved.id, built.doc);
    screen.msg = '';
  }

  /**
   * @param {StoredAgreement | null} agreement
   */
  function saveCancel(agreement) {
    if (!agreement) return;
    if (!projectOpen(agreement.projectId) || refusedReversal(agreement.id)) return;
    const who = actor();
    const built = agreementReversalDoc({
      agreement,
      reversalReason: field('cw-reason'),
      createdBy: who.createdBy,
      deviceId: who.deviceId,
    });
    if (!built.doc || built.errors.length) {
      screen.msg = '';
      return;
    }
    const saved = /** @type {{ id: string }} */ (built.doc);
    commitBuilt(K.agreements, saved.id, built.doc);
    screen.msg = '';
  }

  /**
   * @param {string} id
   * @returns {StoredAgreement | null}
   */
  function storedAgreement(id) {
    const row = rows(K.agreements).find(item => item && item.id === id && String(item.id).indexOf('rev_') !== 0);
    if (!row || typeof row.id !== 'string') return null;
    const method = row.method;
    if (method !== 'lump' && method !== 'unit' && method !== 'daily' && method !== 'milestone') return null;
    return {
      id: row.id,
      partyId: String(row.partyId || ''),
      projectId: String(row.projectId || ''),
      method,
      description: String(row.description || ''),
      currency: 'IQD',
      lumpAmount: /** @type {number | undefined} */ (row.lumpAmount),
      unitRate: /** @type {number | undefined} */ (row.unitRate),
      unitQty: /** @type {number | undefined} */ (row.unitQty),
      unitName: /** @type {string | undefined} */ (row.unitName),
      dayRate: /** @type {number | undefined} */ (row.dayRate),
      milestoneAmount: /** @type {number | undefined} */ (row.milestoneAmount),
      milestoneMode: /** @type {string | undefined} */ (row.milestoneMode),
    };
  }

  /**
   * @param {string} agreementId
   */
  function currentBody(agreementId) {
    const agreement = storedAgreement(agreementId);
    if (!agreement) return null;
    const txns = rows(K.accountTxns);
    const errors = syncErrors();
    if (agreement.method === 'lump' || agreement.method === 'milestone') {
      const id = slotBodyId(agreementId, String(slotAttempt(agreementId)));
      return txns.find(row => row && row.id === id && !Object.prototype.hasOwnProperty.call(errors, id)) || null;
    }
    const index = Accounts.rowIndex(/** @type {FoldDoc[]} */ (/** @type {unknown} */ (txns)), errors);
    /** @type {Record<string, unknown> | null} */
    let picked = null;
    for (const row of txns) {
      if (!row || row.purpose !== 'laborQty' || row.agreementId !== agreementId) continue;
      if (typeof row.id !== 'string' || Object.prototype.hasOwnProperty.call(errors, row.id)) continue;
      // A reversal copies purpose laborQty. It is not a measurement.
      if (row.kind === 'rev' || row.kind === 'rej' || row.id.startsWith('rev_') || row.id.startsWith('rej_')) continue;
      if (!Accounts.rowLive(/** @type {FoldDoc} */ (/** @type {unknown} */ (row)), index)) continue;
      const apprId = 'appr_' + row.id;
      if (txns.some(item => item && item.id === apprId) && !Object.prototype.hasOwnProperty.call(errors, apprId)) continue;
      if (liveApproval(row.id)) continue;
      picked = row;
    }
    return picked;
  }

  /**
   * @param {string} agreementId
   */
  function hasLiveApproval(agreementId) {
    const errors = syncErrors();
    return rows(K.accountTxns).some(row => {
      if (!row || row.purpose !== 'laborQty' || row.agreementId !== agreementId) return false;
      if (typeof row.id !== 'string' || Object.prototype.hasOwnProperty.call(errors, row.id)) return false;
      return liveApproval(row.id);
    });
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
      id === 'act-new-agreement' ||
      id === 'act-labor-qty' ||
      id === 'act-approve-labor' ||
      id === 'act-cancel-agreement' ||
      id === 'back-contractor' ||
      !!dataset.cmethod ||
      !!dataset.cparty ||
      !!dataset.cproj;
    if (!ours) return false;
    if (button.disabled && id.indexOf('act-') === 0) return true;
    if (dataset.cmethod === 'lump' || dataset.cmethod === 'unit' || dataset.cmethod === 'daily' || dataset.cmethod === 'milestone') {
      screen.method = dataset.cmethod;
      if (viewApi) viewApi.render();
      return true;
    }
    if (dataset.cparty) {
      screen.partyId = dataset.cparty;
      if (viewApi) viewApi.render();
      return true;
    }
    if (dataset.cproj) {
      screen.projectId = dataset.cproj;
      if (viewApi) viewApi.render();
      return true;
    }
    if (id === 'back-contractor') {
      screen.creating = false;
      go('#contractor');
      return true;
    }
    if (id === 'act-new-agreement') {
      if (!screen.creating) {
        if (!costOpen()) return true;
        screen.creating = true;
        screen.formId = uuid();
        screen.method = 'unit';
        screen.msg = '';
        go('#contractor/new');
        return true;
      }
      button.disabled = true;
      saveAgreement(button);
      return true;
    }
    const agreement = storedAgreement(screen.arg);
    if (id === 'act-labor-qty') {
      button.disabled = true;
      saveMeasure(agreement);
      button.disabled = false;
      if (viewApi) viewApi.render();
      return true;
    }
    if (id === 'act-approve-labor') {
      button.disabled = true;
      const body = agreement ? currentBody(agreement.id) : null;
      saveApproval(agreement, body);
      button.disabled = false;
      if (viewApi) viewApi.render();
      return true;
    }
    if (id === 'act-cancel-agreement') {
      button.disabled = true;
      saveCancel(agreement);
      button.disabled = false;
      if (viewApi) viewApi.render();
      return true;
    }
    return true;
  }

  function register() {
    if (typeof AccountActions === 'undefined' || !AccountActions) return;
    /** @type {AccountAction[]} */
    const actions = [
      {
        id: 'new-agreement',
        tab: 'contractor',
        label: 'عقد عمل جديد',
        buttonId: 'act-new-agreement',
        renderForm: () => '',
        onClick,
        save: input => agreementDoc(/** @type {AgreementDocInput} */ (input)),
      },
      {
        id: 'labor-qty',
        tab: 'contractor',
        label: 'تسجيل عمل منجز',
        buttonId: 'act-labor-qty',
        renderForm: () => '',
        onClick,
        save: input => laborQtyDoc(/** @type {LaborWorkInput} */ (input)),
      },
      {
        id: 'approve-labor',
        tab: 'contractor',
        label: 'اعتماد قياس العمل',
        buttonId: 'act-approve-labor',
        renderForm: () => '',
        onClick,
        save: input => approveLaborDoc(/** @type {LaborWorkInput} */ (input)),
      },
      {
        id: 'cancel-agreement',
        tab: 'contractor',
        label: 'عكس',
        buttonId: 'act-cancel-agreement',
        renderForm: () => '',
        onClick,
        save: input => agreementReversalDoc(/** @type {{ agreement: StoredAgreement, reversalReason: string, createdBy: string, deviceId: string }} */ (input)),
      },
    ];
    for (const action of actions) AccountActions.push(action);
  }

  /**
   * @param {RenderApi} api
   */
  function install(api) {
    viewApi = api;
    screen.creating = false;
    screen.formId = '';
    screen.method = 'unit';
    screen.partyId = '';
    screen.projectId = '';
    screen.arg = '';
    screen.msg = '';
    screen.measureId = '';
    api.views.contractor = arg => contractorHtml(arg || '');
    api.titles.contractor = 'مقاول';
    register();
  }

  function contractorGlyph() {
    if (!document || typeof document.createElementNS !== 'function') return null;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M4 16h16M7 16V8h4v8M13 16V5h4v11');
    svg.append(path);
    return svg;
  }

  /**
   * @param {{ role?: string } | null | undefined} user
   */
  function syncTab(user) {
    const tabs = document.querySelector('.tabs');
    if (!tabs) return;
    let link = /** @type {HTMLAnchorElement | null} */ (tabs.querySelector('[data-tab="contractor"]'));
    const show = !!(user && Ledger.can(user, 'owner') && costOpen());
    if (!show) {
      if (link) link.remove();
      return;
    }
    if (!link) {
      link = document.createElement('a');
      link.href = '#contractor';
      link.dataset.tab = 'contractor';
      const span = document.createElement('span');
      span.textContent = 'مقاول';
      const glyph = contractorGlyph();
      if (glyph) link.append(glyph, span);
      else link.append(span);
      tabs.appendChild(link);
    }
  }

  /**
   * @param {string} arg
   */
  function contractorHtml(arg) {
    screen.arg = arg;
    const user = me();
    if (!user || !Ledger.can(user, 'owner')) return '<div class="card">هذه الشاشة للمالك.</div>';
    if (arg === 'new') return agreementForm();
    if (arg) return agreementDetail(arg);
    return agreementList();
  }

  function agreementList() {
    screen.creating = false;
    const open = costOpen();
    const cards = rows(K.agreements)
      .filter(row => row && typeof row.id === 'string' && row.id.indexOf('rev_') !== 0)
      .map(row => {
        const id = String(row.id);
        const method = /** @type {PayMethod} */ (row.method);
        const label = METHOD_LABEL[method] || '';
        const mark = liveReversal(id) ? '<small>معكوس</small>' : '';
        const href = typeof DomSafe !== 'undefined' && DomSafe.isSafeId(id) ? '#contractor/' + DomSafe.projectAttr(id) : '#contractor';
        return '<a class="card proj" href="' + href + '"><div class="kv"><span>الوصف</span><b>' + esc(row.description || '') + '</b></div><div class="kv"><span>' + esc(label) + '</span>' + mark + '</div></a>';
      })
      .join('');
    const button = open ? '<button type="button" class="btn" id="act-new-agreement">عقد عمل جديد</button>' : '';
    const msg = screen.msg ? '<div class="msg">' + esc(screen.msg) + '</div>' : '';
    return '<div class="card"><h2>مقاول</h2>' + cards + button + msg + '</div>';
  }

  function agreementForm() {
    screen.creating = true;
    if (!screen.formId) screen.formId = uuid();
    const parties = rows(K.parties)
      .filter(row => row && typeof row.id === 'string')
      .map(row => {
        const on = row.id === screen.partyId ? ' on' : '';
        return '<button type="button" class="pill' + on + '" data-cparty="' + esc(row.id) + '">' + esc(row.name || '') + '</button>';
      })
      .join('');
    const projects = rows(K.projects)
      .filter(row => row && row.status === 'active' && typeof row.id === 'string')
      .map(row => {
        const on = row.id === screen.projectId ? ' on' : '';
        return '<button type="button" class="pill' + on + '" data-cproj="' + esc(row.id) + '">' + esc(row.name || '') + '</button>';
      })
      .join('');
    const methods = (/** @type {PayMethod[]} */ (['lump', 'unit', 'daily', 'milestone']))
      .map(method => {
        const on = method === screen.method ? ' on' : '';
        return '<button type="button" class="pill' + on + '" data-cmethod="' + method + '">' + METHOD_LABEL[method] + '</button>';
      })
      .join('');
    let fields = '';
    if (screen.method === 'lump') fields = '<label class="field">مبلغ<input id="cw-lump" class="full" inputmode="numeric"></label>';
    if (screen.method === 'unit') {
      fields =
        '<label class="field">سعر الوحدة<input id="cw-rate" class="full" inputmode="numeric"></label>' +
        '<label class="field">لكل كم<input id="cw-per" class="full" inputmode="numeric"></label>' +
        '<label class="field">اسم الوحدة<input id="cw-unit" class="full" maxlength="80"></label>';
    }
    if (screen.method === 'daily') fields = '<label class="field">أجرة اليوم<input id="cw-day" class="full" inputmode="numeric"></label>';
    if (screen.method === 'milestone') fields = '<label class="field">قيمة المرحلة<input id="cw-mile" class="full" inputmode="numeric"></label>';
    const saveOff = costOpen() ? '' : ' disabled';
    return (
      '<button type="button" class="mini" id="back-contractor">رجوع</button>' +
      '<div class="card"><h2>عقد عمل جديد</h2>' +
      '<div class="note">طريقة الدفع</div><div class="pills">' + methods + '</div>' +
      '<div class="pills">' + parties + '</div><div class="pills">' + projects + '</div>' +
      fields +
      '<label class="field">الوصف<textarea id="cw-desc" rows="2" maxlength="500"></textarea></label>' +
      '<div class="note">بعد الحفظ لا يتغير الاتفاق إلا بقيد عكس.</div>' +
      '<button type="button" class="btn" id="act-new-agreement"' + saveOff + '>حفظ</button>' +
      '<div id="cw-msg" class="msg">' + esc(screen.msg || '') + '</div></div>'
    );
  }

  /**
   * @param {string} id
   */
  function agreementDetail(id) {
    screen.creating = false;
    const agreement = storedAgreement(id);
    if (!agreement) return '<button type="button" class="mini" id="back-contractor">رجوع</button><div class="card">الاتفاق غير موجود</div>';
    const cancelled = liveReversal(id);
    const label = METHOD_LABEL[agreement.method] || '';
    const errors = syncErrors();
    const refused = errors['rev_' + id];
    const body = currentBody(id);
    const bodyId = body && typeof body.id === 'string' ? body.id : '';
    const bodyRefused = bodyId && Object.prototype.hasOwnProperty.call(errors, bodyId);
    const approved = bodyId ? liveApproval(bodyId) : false;
    const repeatable = agreement.method === 'unit' || agreement.method === 'daily';
    const prior = repeatable && hasLiveApproval(id);
    const notes = [];
    if (cancelled) notes.push('معكوس');
    else if (approved || prior) notes.push('معتمد');
    if (!cancelled && body && !bodyRefused && !approved) {
      notes.push('منجز');
      notes.push('بانتظار الاعتماد');
    }
    const offered = body && bodyId && !bodyRefused && !approved;
    const open = costOpen() && !cancelled;
    const slotEnded = !repeatable && !!body && !Accounts.rowLive(/** @type {FoldDoc} */ (/** @type {unknown} */ (body)), Accounts.rowIndex(/** @type {FoldDoc[]} */ (/** @type {unknown} */ (rows(K.accountTxns))), errors));
    let work = '';
    if (open && (repeatable || !approved) && !slotEnded) {
      const gen = agreement.method === 'lump' || agreement.method === 'milestone'
        ? '<div class="note">المحاولة ' + slotAttempt(id) + ' من 9</div>'
        : '';
      let input = '';
      if (agreement.method === 'unit') {
        input = '<label class="field">كمية منجزة<input id="cw-qty" class="full" inputmode="numeric"></label><div class="kv"><span>الوحدة</span><b>' + esc(agreement.unitName || '') + '</b></div>';
      } else if (agreement.method === 'daily') {
        input = '<label class="field">أيام معتمدة<input id="cw-days" class="full" inputmode="numeric"></label>';
      } else if (agreement.method === 'milestone') {
        input = '<div class="note">اعتماد المرحلة</div>';
      }
      const qtyLine = body && typeof body.qty === 'number' ? '<div class="kv"><span>الكمية</span><b>' + esc(body.qty) + '</b></div>' : '';
      work =
        '<div class="card"><h2>تسجيل عمل منجز</h2>' + gen + input + qtyLine +
        '<button type="button" class="btn" id="act-labor-qty">حفظ</button></div>';
      if (offered && !approved) {
        work +=
          '<div class="card"><h2>اعتماد قياس العمل</h2><div class="note">بعد الحفظ تصبح الحالة: معتمد</div>' +
          '<button type="button" class="btn" id="act-approve-labor">حفظ</button></div>';
      }
    }
    if (approved || prior) {
      work += '<div class="card"><div class="note">القياس معتمد مسبقاً</div><div class="note">معتمد</div></div>';
    }
    const cancelOff = !projectOpen(agreement.projectId) || refusedReversal(id) ? ' disabled' : '';
    const cancel = cancelled
      ? ''
      : '<div class="card"><label class="field">سبب التصحيح<input id="cw-reason" class="full" maxlength="500"></label>' +
        '<button type="button" class="btn ghost" id="act-cancel-agreement"' + cancelOff + '>عكس</button></div>';
    const refuseNote = refused ? '<div class="note">' + esc(refused) + '</div>' : '';
    const rejected = rows(K.accountTxns).some(row => row && bodyId && row.id === 'rej_' + bodyId && !Object.prototype.hasOwnProperty.call(errors, String(row.id)));
    const rejectNote = rejected ? '<div class="note">مرفوض</div>' : '';
    return (
      '<button type="button" class="mini" id="back-contractor">رجوع</button>' +
      '<div class="card"><div class="kv"><span>الوصف</span><b>' + esc(agreement.description) + '</b></div>' +
      '<div class="kv"><span>' + esc(label) + '</span>' + (cancelled ? '<small>معكوس</small>' : '') + '</div>' +
      notes.map(note => '<div class="note">' + esc(note) + '</div>').join('') +
      refuseNote + rejectNote + '</div>' + work + cancel +
      '<div id="cw-msg" class="msg">' + esc(screen.msg || '') + '</div>'
    );
  }

  return {
    install,
    syncTab,
    slotBodyId,
    agreementDoc,
    agreementReversalDoc,
    laborQtyDoc,
    approveLaborDoc,
    pendingAmeer,
  };
});
