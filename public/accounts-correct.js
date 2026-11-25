// Append-only corrections on «مقاول». Loaded after accounts-payment.js and before render.js.
(function (factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(globalThis, { AccountCorrect: api });
})(/** @returns {AccountCorrectApi} */ function () {
  'use strict';

  const MAX_QTY = 100000000;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  const SLOT_RE = /^000[0-9a-f]{32}[1-9]$/;

  /**
   * @typedef {{ createdBy: string, deviceId: string, createdByName?: string }} CorrectActor
   */
  /**
   * @typedef {FoldDoc & {
   *   agreementId?: string,
   *   fxRate?: number,
   *   qty?: number,
   *   description?: string,
   *   method?: string,
   *   cumAmount?: number,
   *   unitName?: string
   * }} Txn
   */

  /**
   * A wording swap edits this object only.
   * @type {Record<string, string>}
   */
  const SENTENCE = {
    newCopy: 'نسخة جديدة',
    rejectLine: 'رفض السطر',
    approveDeduct: 'اعتماد الخصم',
    deduct: 'خصم',
    save: 'حفظ',
    reverse: 'عكس',
    reversed: 'معكوس',
    reason: 'سبب التصحيح',
    amount: 'مبلغ',
    approved: 'معتمد',
    rejected: 'مرفوض',
    pending: 'بانتظار الاعتماد',
    qty: 'كمية منجزة',
    days: 'أيام معتمدة',
    refused: 'رُفض الإرسال',
    review: 'تدقيق',
    approvedWork: 'عمل معتمد',
    over: 'الخصم أكبر من العمل المعتمد',
    owedLead: 'بعد العكس يصير مستحق عليه ',
    dinar: ' د.ع',
    dependent: 'اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً',
    full: 'هذا القياس وصل حد 9 خصومات.',
    blocked: 'رُفض إرسال خصم على هذا القياس.',
    spent: 'ما بقى مجال خصم على هذا القياس.',
    other: 'سجّل الخصم على قياس معتمد ثاني لنفس الاتفاق.',
    none: 'ما أكو قياس معتمد ثاني: اعكس الخصومات ثم الاعتماد، وسجّل قياس جديد.',
    paid: 'مدفوع للعمل',
    advances: 'السلف المصروفة له',
    returned: 'المُرجَع من السلف نقداً',
    refunded: 'المُرجَع من الدفعة نقداً',
    deducts: 'الخصومات ومرتجعات المواد',
    done: 'منجز',
  };

  /** @type {RenderApi | null} */
  let viewApi = null;
  let bound = false;

  /** @type {{ arg: string, locks: Record<string, string>, confirmKey: string, warn: string }} */
  const screen = { arg: '', locks: {}, confirmKey: '', warn: '' };

  /**
   * @param {string} key
   * @param {unknown} fallback
   */
  function read(key, fallback) {
    const value = get(key, fallback);
    return value == null ? fallback : value;
  }

  /** @returns {Txn[]} */
  function txns() {
    const value = read(K.accountTxns, []);
    return Array.isArray(value) ? /** @type {Txn[]} */ (value) : [];
  }

  /** @returns {Record<string, unknown>} */
  function syncErrors() {
    const value = read(K.syncErrors, {});
    return value && typeof value === 'object' ? /** @type {Record<string, unknown>} */ (value) : {};
  }

  /** @param {string} id */
  function inErrors(id) {
    return Object.prototype.hasOwnProperty.call(syncErrors(), id);
  }

  /** @returns {RowIndex} */
  function indexNow() {
    return Accounts.rowIndex(txns(), syncErrors());
  }

  /**
   * @param {string} id
   * @param {RowIndex} [index]
   * @returns {Txn | null}
   */
  function rowById(id, index) {
    const found = (index || indexNow()).byId[id];
    return found ? /** @type {Txn} */ (found) : null;
  }

  /**
   * @param {string} raw
   */
  function esc(raw) {
    return String(raw == null ? '' : raw)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * @param {number} amount
   */
  function money(amount) {
    if (viewApi && typeof viewApi.money === 'function') return viewApi.money(amount);
    return Ledger.fmt(amount) + SENTENCE.dinar;
  }

  /**
   * @param {string} id
   */
  function field(id) {
    if (typeof document === 'undefined' || !document.querySelector) return '';
    const el = document.querySelector('#' + id);
    if (!el) return '';
    const input = /** @type {HTMLInputElement} */ (el);
    return typeof input.value === 'string' ? input.value : '';
  }

  /**
   * @param {string} raw
   */
  function grouped(raw) {
    if (typeof AccountPayment !== 'undefined' && AccountPayment.groupThousands) return AccountPayment.groupThousands(raw);
    return raw;
  }

  /**
   * @param {string} raw
   * @returns {number | null}
   */
  function plain(raw) {
    if (typeof AccountPayment !== 'undefined' && AccountPayment.plainAmount) return AccountPayment.plainAmount(raw);
    return null;
  }

  function costOpen() {
    const start = Accounts.CONTRACTOR_COST_START;
    return typeof start === 'string' && DATE_RE.test(start) && today() >= start;
  }

  function owner() {
    return typeof me === 'function' && !!Ledger.can(me(), 'owner');
  }

  /**
   * @param {string} projectId
   */
  function projectOpen(projectId) {
    const list = read(K.projects, []);
    if (!Array.isArray(list)) return false;
    const row = list.find(item => item && /** @type {{ id?: string }} */ (item).id === projectId);
    return !!(row && /** @type {{ status?: string }} */ (row).status === 'active');
  }

  /**
   * @param {string} id
   * @returns {Txn | null}
   */
  function agreementOf(id) {
    const list = read(K.agreements, []);
    if (!Array.isArray(list)) return null;
    const row = list.find(item => item && /** @type {{ id?: string }} */ (item).id === id);
    if (!row) return null;
    const doc = /** @type {Txn} */ (row);
    if (typeof doc.partyId !== 'string' || typeof doc.projectId !== 'string') return null;
    if (doc.method !== 'lump' && doc.method !== 'unit' && doc.method !== 'daily' && doc.method !== 'milestone') return null;
    return doc;
  }

  /** @returns {CorrectActor | null} */
  function actor() {
    const user = typeof me === 'function' ? me() : null;
    if (!user || !user.uid) return null;
    /** @type {CorrectActor} */
    const out = {
      createdBy: String(user.uid),
      deviceId: typeof deviceId === 'string' && deviceId ? deviceId : 'local',
    };
    const name = typeof user.displayName === 'string' ? user.displayName.trim() : '';
    if (name.length >= 1 && name.length <= 80) out.createdByName = name;
    return out;
  }

  /**
   * @param {Record<string, unknown>} doc
   * @param {CorrectActor} input
   */
  function stamp(doc, input) {
    doc.createdBy = input.createdBy;
    doc.deviceId = input.deviceId;
    doc.createdAtServer = null;
    if (typeof input.createdByName === 'string' && input.createdByName) doc.createdByName = input.createdByName;
  }

  /**
   * @param {unknown} value
   */
  function reasonOf(value) {
    const text = value == null ? '' : String(value).trim();
    if (text.length < 1 || text.length > 500) return '';
    return text;
  }

  /** @returns {Array<Record<string, unknown>>} */
  function liveLedger() {
    const errors = syncErrors();
    return txns()
      .filter(row => row && typeof row.id === 'string' && !Object.prototype.hasOwnProperty.call(errors, row.id))
      .map(row => {
        /** @type {Record<string, unknown>} */
        const doc = { id: row.id, purpose: row.purpose, ledger: 'labor' };
        if (typeof row.amount === 'number') doc.amount = row.amount;
        if (typeof row.targetId === 'string') doc.targetId = row.targetId;
        if (typeof row.kind === 'string') doc.kind = row.kind;
        return doc;
      });
  }

  /**
   * @param {string} targetId
   * @param {number} gen
   */
  function dedId(targetId, gen) {
    return 'd' + String(gen) + targetId;
  }

  /**
   * @param {string} id
   * @param {RowIndex} index
   */
  function markerOutside(id, index) {
    return !!index.byId[id] && !inErrors(id);
  }

  /**
   * A refused rev_/rej_ sits in syncErrors and does not release the previous position.
   * @param {string} id
   * @param {RowIndex} index
   */
  function markerCounts(id, index) {
    return markerOutside(id, index);
  }

  /**
   * @param {string} targetId
   * @param {RowIndex} index
   */
  function liveDeductSum(targetId, index) {
    let sum = 0;
    for (const row of Object.values(index.byId)) {
      if (!row || row.purpose !== 'deduct' || row.targetId !== targetId) continue;
      if (!Accounts.rowLive(row, index)) continue;
      if (typeof row.amount === 'number') sum += row.amount;
    }
    return sum;
  }

  /**
   * @param {string} targetId
   * @param {number} amount
   * @returns {{ id: string, cumAmount: number } | { error: 'full' | 'blocked' | 'spent' | 'cumulative' | 'targetId' }}
   */
  function deductPosition(targetId, amount) {
    const index = indexNow();
    const approval = index.byId[targetId];
    if (!approval || approval.purpose !== 'approveLabor' || inErrors(targetId) || !Accounts.rowCounts(approval, index)) {
      return { error: 'targetId' };
    }
    for (let gen = 1; gen <= 9; gen += 1) {
      if (inErrors(dedId(targetId, gen))) return { error: 'blocked' };
    }
    let slot = 0;
    for (let gen = 1; gen <= 9; gen += 1) {
      if (!index.byId[dedId(targetId, gen)]) {
        slot = gen;
        break;
      }
    }
    if (!slot) return { error: 'full' };
    const cap = typeof approval.amount === 'number' ? approval.amount : 0;
    let cum = amount;
    if (slot > 1) {
      const prevId = dedId(targetId, slot - 1);
      const prev = /** @type {Txn | undefined} */ (index.byId[prevId]);
      if (!prev || typeof prev.cumAmount !== 'number' || typeof prev.amount !== 'number') return { error: 'targetId' };
      const gone = markerCounts('rev_' + prevId, index) || markerCounts('rej_' + prevId, index);
      cum = prev.cumAmount - (gone ? prev.amount : 0) + amount;
    }
    const live = liveDeductSum(targetId, index);
    if (typeof amount === 'number' && live + amount > cap) return { error: 'cumulative' };
    if (typeof amount === 'number' && cum > cap) return { error: 'spent' };
    return { id: dedId(targetId, slot), cumAmount: cum };
  }

  /**
   * @param {string} approvalId
   * @param {RowIndex} index
   */
  function agreementOfApproval(approvalId, index) {
    const approval = /** @type {Txn | undefined} */ (index.byId[approvalId]);
    if (approval && typeof approval.agreementId === 'string') return approval.agreementId;
    const body = approval && typeof approval.targetId === 'string' ? /** @type {Txn | undefined} */ (index.byId[approval.targetId]) : null;
    return body && typeof body.agreementId === 'string' ? body.agreementId : '';
  }

  /**
   * @param {string} approvalId
   * @param {'full' | 'blocked' | 'spent'} cause
   */
  function noMoreDeductLine(approvalId, cause) {
    const lead = cause === 'full' ? SENTENCE.full : cause === 'blocked' ? SENTENCE.blocked : SENTENCE.spent;
    const index = indexNow();
    const agreementId = agreementOfApproval(approvalId, index);
    let open = false;
    for (const row of Object.values(index.byId)) {
      if (!row || row.id === approvalId || row.purpose !== 'approveLabor') continue;
      if (agreementOfApproval(row.id, index) !== agreementId) continue;
      if (!Accounts.rowCounts(row, index) || inErrors(row.id)) continue;
      const room = (typeof row.amount === 'number' ? row.amount : 0) - liveDeductSum(row.id, index);
      if (room <= 0) continue;
      const next = deductPosition(row.id, 1);
      if ('id' in next) {
        open = true;
        break;
      }
    }
    const remedy = open ? SENTENCE.other : SENTENCE.none;
    return '<div class="note">' + esc(lead) + '</div><div class="note">' + esc(remedy) + '</div>';
  }

  /**
   * @param {CorrectActor & { targetId: string, amount: number, reason: string }} input
   * @returns {{ doc: Record<string, unknown> | null, errors: string[] }}
   */
  function deductDoc(input) {
    const reason = reasonOf(input && input.reason);
    if (!reason) return { doc: null, errors: ['reason'] };
    const targetId = input && typeof input.targetId === 'string' ? input.targetId : '';
    const amount = input && input.amount;
    const posted = Accounts.post('deduct', { id: 'pending', amount, targetId, ledger: liveLedger() });
    if (!posted.doc || posted.errors.length) return { doc: null, errors: posted.errors.length ? posted.errors : ['targetId'] };
    const pos = deductPosition(targetId, /** @type {number} */ (amount));
    if (!('id' in pos)) return { doc: null, errors: [pos.error] };
    const approval = rowById(targetId);
    if (!approval) return { doc: null, errors: ['targetId'] };
    /** @type {Record<string, unknown>} */
    const doc = {
      id: pos.id,
      docType: 'accountTxn',
      kind: 'body',
      purpose: 'deduct',
      ledger: 'labor',
      projectId: approval.projectId,
      partyId: approval.partyId,
      currency: approval.currency || 'IQD',
      fxRate: typeof approval.fxRate === 'number' ? approval.fxRate : 1,
      amount,
      cumAmount: pos.cumAmount,
      targetId,
      txnDate: today(),
      description: reason,
    };
    const effect = /** @type {{ effect?: unknown }} */ (posted.doc).effect;
    if (effect && typeof effect === 'object') doc.effect = effect;
    stamp(doc, input);
    return { doc, errors: [] };
  }

  /**
   * @param {CorrectActor & { targetId: string }} input
   * @returns {{ doc: Record<string, unknown> | null, errors: string[] }}
   */
  function approveDeductDoc(input) {
    const targetId = input && typeof input.targetId === 'string' ? input.targetId : '';
    const index = indexNow();
    const deduct = /** @type {Txn | undefined} */ (index.byId[targetId]);
    if (!deduct || deduct.purpose !== 'deduct' || inErrors(targetId) || !Accounts.rowLive(deduct, index)) {
      return { doc: null, errors: ['targetId'] };
    }
    const apprId = 'appr_' + targetId;
    if (markerOutside(apprId, index)) return { doc: null, errors: [] };
    const posted = Accounts.post('approveDeduct', { id: apprId, targetId, ledger: liveLedger() });
    if (!posted.doc || posted.errors.length) return { doc: null, errors: posted.errors.length ? posted.errors : ['targetId'] };
    /** @type {Record<string, unknown>} */
    const doc = {
      id: apprId,
      docType: 'accountTxn',
      kind: 'appr',
      purpose: 'approveDeduct',
      ledger: 'labor',
      projectId: deduct.projectId,
      partyId: deduct.partyId,
      currency: deduct.currency || 'IQD',
      fxRate: typeof deduct.fxRate === 'number' ? deduct.fxRate : 1,
      targetId,
    };
    const effect = /** @type {{ effect?: unknown }} */ (posted.doc).effect;
    if (effect && typeof effect === 'object') doc.effect = effect;
    stamp(doc, input);
    return { doc, errors: [] };
  }

  /**
   * @param {string} id
   */
  function supDepth(id) {
    let depth = 0;
    let rest = id;
    while (rest.startsWith('sup_')) {
      depth += 1;
      rest = rest.slice(4);
    }
    return depth;
  }

  /**
   * @param {string} agreementId
   */
  function agreementCancelled(agreementId) {
    const list = read(K.agreements, []);
    if (!Array.isArray(list)) return false;
    return list.some(row => {
      const doc = /** @type {Txn} */ (row);
      if (!doc || typeof doc.id !== 'string') return false;
      const hits = doc.id === 'rev_' + agreementId || doc.reversesId === agreementId;
      return hits && !inErrors(doc.id);
    });
  }

  /**
   * @param {CorrectActor & { targetId: string }} input
   * @returns {{ doc: Record<string, unknown> | null, errors: string[] }}
   */
  function rejectDoc(input) {
    const targetId = input && typeof input.targetId === 'string' ? input.targetId : '';
    const index = indexNow();
    const row = index.byId[targetId];
    if (!row || inErrors(targetId)) return { doc: null, errors: ['targetId'] };
    if (!Accounts.rowLive(row, index)) return { doc: null, errors: ['targetId'] };
    const purpose = Accounts.PURPOSES[String(row.purpose || '')];
    if (!purpose || !purpose.needsApproval) return { doc: null, errors: ['method'] };
    if (row.kind && row.kind !== 'body' && row.kind !== 'sup') return { doc: null, errors: ['method'] };
    if (markerOutside('appr_' + targetId, index)) return { doc: null, errors: ['approved'] };
    const id = 'rej_' + targetId;
    if (markerOutside(id, index)) return { doc: null, errors: [] };
    /** @type {Record<string, unknown>} */
    const doc = { id, docType: 'accountTxn', kind: 'rej', targetId };
    stamp(doc, input);
    return { doc, errors: [] };
  }

  /**
   * @param {CorrectActor & { targetId: string, qty: number }} input
   * @returns {{ doc: Record<string, unknown> | null, errors: string[] }}
   */
  function supersedeDoc(input) {
    const rawId = input && (typeof input.targetId === 'string' && input.targetId
      ? input.targetId
      : typeof /** @type {{ supersedesId?: string }} */ (input).supersedesId === 'string'
        ? /** @type {{ supersedesId?: string }} */ (input).supersedesId
        : '');
    const targetId = rawId || '';
    const index = indexNow();
    const row = /** @type {Txn | undefined} */ (index.byId[targetId]);
    if (!row || inErrors(targetId)) return { doc: null, errors: ['targetId'] };
    if (row.purpose !== 'laborQty') return { doc: null, errors: ['method'] };
    if (row.kind && row.kind !== 'body' && row.kind !== 'sup') return { doc: null, errors: ['method'] };
    if (typeof row.id === 'string' && SLOT_RE.test(row.id)) return { doc: null, errors: ['method'] };
    const nextId = 'sup_' + targetId;
    if (supDepth(nextId) > 4) return { doc: null, errors: ['method'] };
    let root = targetId;
    while (root.startsWith('sup_')) root = root.slice(4);
    if (!UUID_RE.test(root)) return { doc: null, errors: ['method'] };
    if (markerOutside('appr_' + targetId, index)) return { doc: null, errors: ['method'] };
    if (!Accounts.rowLive(row, index)) return { doc: null, errors: ['targetId'] };
    if (typeof row.agreementId === 'string' && agreementCancelled(row.agreementId)) return { doc: null, errors: ['cancelled'] };
    const qty = input && input.qty;
    if (typeof qty !== 'number' || !Number.isSafeInteger(qty) || qty < 1 || qty > MAX_QTY) return { doc: null, errors: ['range'] };
    /** @type {Record<string, unknown>} */
    const doc = {
      id: nextId,
      docType: 'accountTxn',
      kind: 'sup',
      purpose: row.purpose,
      ledger: row.ledger || 'labor',
      partyId: row.partyId,
      projectId: row.projectId,
      currency: row.currency || 'IQD',
      fxRate: typeof row.fxRate === 'number' ? row.fxRate : 1,
      supersedesId: targetId,
      qty,
      txnDate: today(),
    };
    if (Object.prototype.hasOwnProperty.call(row, 'agreementId') && row.agreementId != null) doc.agreementId = row.agreementId;
    stamp(doc, input);
    return { doc, errors: [] };
  }

  /**
   * @param {Txn} row
   */
  function originalKind(row) {
    if (row.kind === 'rev' || row.kind === 'rej') return 'marker';
    if (typeof row.id === 'string' && (row.id.startsWith('rev_') || row.id.startsWith('rej_'))) return 'marker';
    return typeof row.kind === 'string' ? row.kind : '';
  }

  /**
   * @param {CorrectActor & { targetId: string, reason?: string, reversalReason?: string }} input
   * @returns {{ doc: Record<string, unknown> | null, errors: string[] }}
   */
  function reversalDoc(input) {
    const named = input && typeof input.targetId === 'string' && input.targetId
      ? input.targetId
      : input && typeof /** @type {{ reversesId?: string }} */ (input).reversesId === 'string'
        ? /** @type {{ reversesId?: string }} */ (input).reversesId
        : '';
    const targetId = named || '';
    const reason = reasonOf(input && (input.reason != null ? input.reason : input.reversalReason));
    if (!reason) return { doc: null, errors: ['reason'] };
    const index = indexNow();
    const row = /** @type {Txn | undefined} */ (index.byId[targetId]);
    if (!row || inErrors(targetId)) return { doc: null, errors: ['targetId'] };
    const kind = originalKind(row);
    if (kind === 'marker' || (kind !== 'body' && kind !== 'sup' && kind !== 'appr' && kind !== 'revw' && kind !== 'stl')) {
      return { doc: null, errors: ['kind'] };
    }
    const id = 'rev_' + targetId;
    if (markerOutside(id, index)) return { doc: null, errors: [] };
    /** @type {Record<string, unknown>} */
    const doc = {
      id,
      docType: 'accountTxn',
      kind: 'rev',
      purpose: row.purpose,
      ledger: row.ledger || 'labor',
      projectId: row.projectId,
      partyId: row.partyId,
      currency: row.currency || 'IQD',
      fxRate: typeof row.fxRate === 'number' ? row.fxRate : 1,
      reversesId: targetId,
      reversalReason: reason,
    };
    if (Object.prototype.hasOwnProperty.call(row, 'amount') && typeof row.amount === 'number') doc.amount = row.amount;
    if (Object.prototype.hasOwnProperty.call(row, 'agreementId') && row.agreementId != null) doc.agreementId = row.agreementId;
    stamp(doc, input);
    return { doc, errors: [] };
  }

  /**
   * @param {string} topId
   * @param {RowIndex} index
   * @returns {string[]}
   */
  function measurementChain(topId, index) {
    /** @type {string[]} */
    const chain = [];
    let id = topId;
    for (let n = 0; n < 5 && id; n += 1) {
      chain.push(id);
      const row = index.byId[id];
      let next = '';
      if (row && typeof row.supersedesId === 'string' && row.supersedesId) next = row.supersedesId;
      else if (id.startsWith('sup_')) next = id.slice(4);
      id = next;
    }
    return chain;
  }

  /**
   * @param {string} approvalId
   * @param {RowIndex} index
   */
  function liveDeductOn(approvalId, index) {
    for (const row of Object.values(index.byId)) {
      if (!row || row.purpose !== 'deduct' || row.targetId !== approvalId) continue;
      if (Accounts.rowLive(row, index)) return true;
    }
    return false;
  }

  /**
   * @param {CorrectActor & { targetId: string, reason?: string, reversalReason?: string }} input
   * @returns {{ docs: Record<string, unknown>[], errors: string[] }}
   */
  function endMeasurementDocs(input) {
    const named = input && typeof input.targetId === 'string' && input.targetId
      ? input.targetId
      : input && typeof /** @type {{ approvalId?: string }} */ (input).approvalId === 'string'
        ? /** @type {{ approvalId?: string }} */ (input).approvalId
        : '';
    const targetId = named || '';
    const reason = reasonOf(input && (input.reason != null ? input.reason : input.reversalReason));
    if (!reason) return { docs: [], errors: ['reason'] };
    const index = indexNow();
    const approval = index.byId[targetId];
    if (!approval || inErrors(targetId)) return { docs: [], errors: ['targetId'] };
    if (approval.purpose !== 'approveLabor') return { docs: [], errors: ['kind'] };
    if (liveDeductOn(targetId, index)) return { docs: [], errors: ['dependent'] };
    const top = typeof approval.targetId === 'string' ? approval.targetId : '';
    const ids = ['rev_' + targetId].concat(measurementChain(top, index).map(id => 'rev_' + id));
    /** @type {Record<string, unknown>[]} */
    const docs = [];
    for (const id of ids) {
      if (markerOutside(id, index)) continue;
      const built = reversalDoc({
        targetId: id.slice(4),
        reason,
        createdBy: input.createdBy,
        deviceId: input.deviceId,
        createdByName: input.createdByName,
      });
      if (!built.doc || built.errors.length) return { docs: [], errors: built.errors.length ? built.errors : ['targetId'] };
      docs.push(built.doc);
    }
    return { docs, errors: [] };
  }

  /**
   * @param {Record<string, unknown>} doc
   */
  function commitBuilt(doc) {
    if (typeof AccountsView === 'undefined' || typeof AccountsView.commitDoc !== 'function') return;
    const id = typeof doc.id === 'string' ? doc.id : '';
    AccountsView.commitDoc(id, doc, txns(), next => {
      set(K.accountTxns, next);
    });
  }

  /**
   * @param {string} targetId
   */
  function lockDeduct(targetId) {
    const current = screen.locks[targetId];
    const held = !!(current && !rowById(current));
    const probe = deductPosition(targetId, 1);
    // Keep the id while it is still the next free slot, so two taps write one row.
    // If an earlier slot was removed after the card opened, follow the slot now on screen.
    // Holding the later id would refuse the save (saveDeduct) and the rules would deny that later id.
    if (held && (!('id' in probe) || probe.id === current)) return current;
    if ('id' in probe) {
      screen.locks[targetId] = probe.id;
      return probe.id;
    }
    delete screen.locks[targetId];
    return '';
  }

  /**
   * @param {string} id
   * @param {string} label
   * @param {string} extra
   * @param {boolean} disabled
   */
  function button(id, label, extra, disabled) {
    return '<button type="button" class="btn" id="' + esc(id) + '"' + (extra ? ' ' + extra : '') + (disabled ? ' disabled' : '') + '>' + esc(label) + '</button>';
  }

  /**
   * @param {string} text
   */
  function note(text) {
    return '<div class="note">' + esc(text) + '</div>';
  }

  /**
   * @param {string} id
   */
  function refusedNote(id) {
    const message = syncErrors()[id];
    if (typeof message !== 'string' || !message) return '';
    return note(message);
  }

  /**
   * @param {Txn} row
   * @param {RowIndex} index
   * @returns {'cash' | 'revw' | 'approval' | 'recovery' | 'deduct' | 'dependent' | ''}
   */
  function reversible(row, index) {
    if (!row || typeof row.id !== 'string') return '';
    if (row.kind === 'rev' || row.kind === 'rej' || row.id.startsWith('rev_') || row.id.startsWith('rej_')) return '';
    if (row.purpose === 'approveDeduct') return '';
    if (inErrors(row.id)) return '';
    if (row.purpose === 'payLabor' && livePointer('refundLabor', row.id, index)) return 'dependent';
    if (row.purpose === 'advanceLabor' && livePointer('returnAdvance', row.id, index)) return 'dependent';
    if (row.purpose === 'advanceLabor' && liveSettle(row.id, index)) return 'dependent';
    if (row.purpose === 'approveLabor' && liveDeductOn(row.id, index)) return 'dependent';
    if (!Accounts.rowLive(row, index) && !recoveryLink(row, index)) return '';
    if (row.purpose === 'payLabor' || row.purpose === 'advanceLabor' || row.purpose === 'returnAdvance' || row.purpose === 'refundLabor') {
      return Accounts.rowLive(row, index) ? 'cash' : '';
    }
    if (row.kind === 'revw' || row.id.startsWith('revw_')) return Accounts.rowLive(row, index) ? 'revw' : '';
    if (row.purpose === 'approveLabor' && Accounts.rowCounts(row, index)) return 'approval';
    if (recoveryLink(row, index)) return 'recovery';
    if (row.purpose === 'deduct' && Accounts.rowLive(row, index)) {
      const apprId = 'appr_' + row.id;
      if (markerOutside(apprId, index) && !Accounts.rowLive(/** @type {FoldDoc} */ (index.byId[apprId]), index)) return 'deduct';
      if (Accounts.rowCounts(row, index)) return 'deduct';
    }
    return '';
  }

  /**
   * @param {string} advanceId
   * @param {RowIndex} index
   */
  function liveSettle(advanceId, index) {
    for (const row of Object.values(index.byId)) {
      if (!row || row.purpose !== 'settle' || row.settlesId !== advanceId) continue;
      if (Accounts.rowLive(row, index)) return true;
    }
    return false;
  }

  /**
   * @param {string} purpose
   * @param {string} targetId
   * @param {RowIndex} index
   */
  function livePointer(purpose, targetId, index) {
    for (const row of Object.values(index.byId)) {
      if (!row || row.purpose !== purpose || row.targetId !== targetId) continue;
      if (Accounts.rowLive(row, index)) return true;
    }
    return false;
  }

  /**
   * @param {Txn} row
   * @param {RowIndex} index
   */
  function recoveryLink(row, index) {
    if (!row || row.purpose !== 'laborQty' || typeof row.id !== 'string') return false;
    if (!Accounts.rowLive(row, index)) return false;
    if (markerOutside('rev_' + row.id, index)) return false;
    for (const other of Object.values(index.byId)) {
      if (!other || other.purpose !== 'approveLabor' || typeof other.targetId !== 'string') continue;
      if (!measurementChain(other.targetId, index).includes(row.id)) continue;
      if (!Accounts.rowCounts(other, index)) return true;
    }
    return false;
  }

  /**
   * @param {Txn} row
   */
  function rowLabel(row) {
    if (row.purpose === 'payLabor') return SENTENCE.paid;
    if (row.purpose === 'advanceLabor') return SENTENCE.advances;
    if (row.purpose === 'returnAdvance') return SENTENCE.returned;
    if (row.purpose === 'refundLabor') return SENTENCE.refunded;
    if (row.purpose === 'approveLabor') return SENTENCE.approvedWork;
    if (row.purpose === 'deduct') return SENTENCE.deducts;
    if (row.kind === 'revw' || (typeof row.id === 'string' && row.id.startsWith('revw_'))) return SENTENCE.review;
    if (row.purpose === 'laborQty') return SENTENCE.done;
    return '';
  }

  /**
   * @param {Txn} agreement
   * @param {RowIndex} index
   */
  function card1(agreement, index) {
    const open = projectOpen(String(agreement.projectId));
    let html = '';
    for (const row of txns()) {
      if (!row || row.purpose !== 'laborQty' || row.agreementId !== agreement.id || typeof row.id !== 'string') continue;
      if (row.kind === 'rev' || row.kind === 'rej' || row.id.startsWith('rev_') || row.id.startsWith('rej_')) continue;
      if (inErrors(row.id) || !Accounts.rowLive(row, index)) continue;
      if (markerOutside('appr_' + row.id, index)) continue;
      const qtyLabel = agreement.method === 'daily' ? SENTENCE.days : SENTENCE.qty;
      const qty = typeof row.qty === 'number' ? grouped(String(row.qty)) : '';
      const slot = SLOT_RE.test(row.id);
      const nextDepth = supDepth('sup_' + row.id);
      const copy = !slot && (agreement.method === 'unit' || agreement.method === 'daily') && nextDepth <= 4;
      const rejectId = 'rej_' + row.id;
      const rejectOff = !open || inErrors(rejectId);
      html += '<div class="card"><div class="kv"><span>' + esc(qtyLabel) + '</span><b>' + esc(qty) + '</b></div>';
      html += refusedNote(rejectId);
      html += button('act-reject-' + row.id, SENTENCE.rejectLine, 'data-cc-rej="' + esc(row.id) + '"', rejectOff);
      if (copy) {
        const supId = 'sup_' + row.id;
        html += '<label class="field">' + esc(qtyLabel) + '<input id="cc-sup-qty" class="full" inputmode="numeric" value="' + esc(field('cc-sup-qty')) + '"></label>';
        html += refusedNote(supId);
        html += button('act-supersede-' + row.id, SENTENCE.newCopy, 'data-cc-sup="' + esc(row.id) + '"', !open || inErrors(supId));
      }
      html += '</div>';
    }
    return html;
  }

  /**
   * @param {Txn} deduct
   * @param {RowIndex} index
   * @param {boolean} open
   * @param {boolean} orphan
   */
  function deductState(deduct, index, open, orphan) {
    const id = String(deduct.id);
    const apprId = 'appr_' + id;
    const appr = index.byId[apprId];
    const apprOutside = !!(appr && !inErrors(apprId));
    const apprLive = apprOutside && Accounts.rowLive(appr, index);
    let html = '<div class="kv"><span>' + esc(SENTENCE.deducts) + '</span><b>' + esc(money(typeof deduct.amount === 'number' ? deduct.amount : 0)) + '</b></div>';
    if (typeof deduct.description === 'string' && deduct.description) html += note(deduct.description);
    if (!apprOutside) {
      html += note(SENTENCE.pending);
      const rejectId = 'rej_' + id;
      html += refusedNote(rejectId);
      html += button('act-reject-' + id, SENTENCE.rejectLine, 'data-cc-rej="' + esc(id) + '"', !open || inErrors(rejectId));
      if (!orphan) {
        html += refusedNote(apprId);
        html += button('act-approve-deduct-' + id, SENTENCE.approveDeduct, 'data-cc-appr="' + esc(id) + '"', !open || inErrors(apprId));
      }
      return html;
    }
    if (!apprLive) {
      const revId = 'rev_' + id;
      html += note(SENTENCE.reversed);
      html += refusedNote(revId);
      html += button('act-reverse-' + id, SENTENCE.reverse, 'data-cc-rev="' + esc(id) + '"', !open || inErrors(revId) || !reasonOf(field('cc-reason')));
      return html;
    }
    html += note(SENTENCE.approved);
    const revId = 'rev_' + id;
    html += refusedNote(revId);
    html += button('act-reverse-' + id, SENTENCE.reverse, 'data-cc-rev="' + esc(id) + '"', !open || inErrors(revId) || !reasonOf(field('cc-reason')));
    return html;
  }

  /**
   * @param {Txn} agreement
   * @param {RowIndex} index
   */
  function card2(agreement, index) {
    const open = projectOpen(String(agreement.projectId));
    let html = '';
    /** @type {string[]} */
    const shown = [];
    for (const approval of txns()) {
      if (!approval || approval.purpose !== 'approveLabor' || typeof approval.id !== 'string') continue;
      if (agreementOfApproval(approval.id, index) !== agreement.id) continue;
      if (inErrors(approval.id) || !Accounts.rowCounts(approval, index)) continue;
      shown.push(approval.id);
      const amount = typeof approval.amount === 'number' ? approval.amount : 0;
      html += '<div class="card"><h2>' + esc(SENTENCE.deduct) + '</h2>';
      html += '<div class="kv"><span>' + esc(SENTENCE.approvedWork) + '</span><b>' + esc(money(amount)) + '</b></div>';
      html += note(SENTENCE.approved);
      const live = liveDeductSum(approval.id, index);
      if (live > amount) html += note(SENTENCE.over);
      for (const row of txns()) {
        if (!row || row.purpose !== 'deduct' || row.targetId !== approval.id || typeof row.id !== 'string') continue;
        if (inErrors(row.id)) continue;
        if (!Accounts.rowLive(row, index)) {
          if (markerOutside('rev_' + row.id, index)) html += note(SENTENCE.reversed);
          else if (markerOutside('rej_' + row.id, index)) html += note(SENTENCE.rejected);
          continue;
        }
        html += deductState(row, index, open, false);
      }
      const typed = plain(field('cc-deduct'));
      const probeAmount = typeof typed === 'number' && typed >= 1 ? typed : 1;
      const probe = deductPosition(approval.id, probeAmount);
      if (!('id' in probe) && (probe.error === 'full' || probe.error === 'blocked' || probe.error === 'spent')) {
        html += noMoreDeductLine(approval.id, probe.error);
      } else if ('id' in probe || probe.error === 'cumulative') {
        const reason = field('cc-ded-reason');
        const locked = lockDeduct(approval.id);
        html += '<label class="field">' + esc(SENTENCE.amount) + '<input id="cc-deduct" class="full" inputmode="numeric" value="' + esc(grouped(field('cc-deduct'))) + '"></label>';
        html += '<label class="field">' + esc(SENTENCE.reason) + '<input id="cc-ded-reason" class="full" maxlength="500" value="' + esc(reason) + '"></label>';
        const saveOff = !open || !reasonOf(reason) || !locked;
        html += button('act-deduct', SENTENCE.save, 'data-cctarget="' + esc(approval.id) + '"', saveOff);
      }
      html += '</div>';
    }
    /** @type {Record<string, FoldDoc[]>} */
    const orphans = {};
    for (const row of txns()) {
      if (!row || row.purpose !== 'deduct' || typeof row.targetId !== 'string' || typeof row.id !== 'string') continue;
      if (!Accounts.rowLive(row, index)) continue;
      if (shown.includes(row.targetId)) continue;
      if (agreementOfApproval(row.targetId, index) !== agreement.id) continue;
      if (!orphans[row.targetId]) orphans[row.targetId] = [];
      orphans[row.targetId].push(row);
    }
    for (const targetId of Object.keys(orphans)) {
      html += '<div class="card"><h2>' + esc(SENTENCE.approvedWork) + '</h2>' + note(SENTENCE.reversed);
      for (const row of orphans[targetId]) html += deductState(row, index, open, true);
      html += '</div>';
    }
    return html;
  }

  /**
   * @param {Txn} agreement
   * @param {RowIndex} index
   */
  function card3(agreement, index) {
    const open = projectOpen(String(agreement.projectId));
    const reason = field('cc-reason');
    let rowsHtml = '';
    let any = false;
    for (const row of txns()) {
      if (!row || row.partyId !== agreement.partyId || row.projectId !== agreement.projectId) continue;
      const mode = reversible(row, index);
      if (mode !== 'cash' && mode !== 'revw' && mode !== 'approval' && mode !== 'recovery' && mode !== 'dependent') continue;
      any = true;
      const label = rowLabel(row);
      const amount = typeof row.amount === 'number' ? money(row.amount) : '';
      rowsHtml += '<div class="kv"><span>' + esc(label) + '</span><b>' + esc(amount) + '</b></div>';
      if (mode === 'dependent') {
        rowsHtml += note(SENTENCE.dependent);
        continue;
      }
      const revId = 'rev_' + String(row.id);
      const off = !open || inErrors(revId) || !reasonOf(reason);
      rowsHtml += refusedNote(revId);
      rowsHtml += button('act-reverse-' + String(row.id), SENTENCE.reverse, 'data-cc-rev="' + esc(String(row.id)) + '"', off);
    }
    if (!any) return '';
    let html = '<div class="card"><h2>' + esc(SENTENCE.reverse) + '</h2>';
    html += '<label class="field">' + esc(SENTENCE.reason) + '<input id="cc-reason" class="full" maxlength="500" value="' + esc(reason) + '"></label>';
    if (screen.warn) html += note(screen.warn);
    html += rowsHtml + '</div>';
    return html;
  }

  /**
   * @param {string} arg
   */
  function blocks(arg) {
    if (!owner() || !costOpen()) return '';
    const agreement = agreementOf(arg);
    if (!agreement) return '';
    screen.arg = arg;
    const index = indexNow();
    const first = card1(agreement, index);
    const second = card2(agreement, index);
    const third = card3(agreement, index);
    const reason = second.includes('data-cc-rev') && !third.includes('id="cc-reason"')
      ? '<div class="card"><label class="field">' + esc(SENTENCE.reason) + '<input id="cc-reason" class="full" maxlength="500" value="' + esc(field('cc-reason')) + '"></label></div>'
      : '';
    return first + reason + second + third;
  }

  /**
   * @param {string} raw
   * @returns {number | null}
   */
  function qtyOf(raw) {
    const text = String(raw || '').trim();
    if (!/^\d+$/.test(text)) return null;
    const n = Number(text);
    return Number.isSafeInteger(n) ? n : null;
  }

  /**
   * @param {HTMLButtonElement} buttonEl
   * @param {Txn} agreement
   */
  function saveDeduct(buttonEl, agreement) {
    const targetId = buttonEl.dataset.cctarget || '';
    const amount = plain(field('cc-deduct'));
    if (amount == null) return false;
    const who = actor();
    if (!who) return false;
    const built = deductDoc({ targetId, amount, reason: field('cc-ded-reason'), createdBy: who.createdBy, deviceId: who.deviceId, createdByName: who.createdByName });
    if (!built.doc || built.errors.length) return false;
    const locked = screen.locks[targetId];
    if (locked && built.doc.id !== locked && !rowById(locked)) return false;
    commitBuilt(built.doc);
    delete screen.locks[targetId];
    return true;
  }

  /**
   * @param {HTMLButtonElement} buttonEl
   */
  function saveReverse(buttonEl) {
    const targetId = buttonEl.dataset.ccRev || buttonEl.id.replace(/^act-reverse-/, '');
    const who = actor();
    if (!who || !targetId) return false;
    const row = rowById(targetId);
    if (!row) return false;
    const reason = field('cc-reason');
    if (row.purpose === 'approveLabor') {
      const built = endMeasurementDocs({ targetId, reason, createdBy: who.createdBy, deviceId: who.deviceId, createdByName: who.createdByName });
      if (!built.docs.length || built.errors.length) return false;
      const agreement = agreementOf(screen.arg);
      const next = txns().concat(/** @type {FoldDoc[]} */ (/** @type {unknown} */ (built.docs)));
      const net = Accounts.balances(next, {
        partyId: agreement ? String(agreement.partyId) : String(row.partyId || ''),
        projectId: agreement ? String(agreement.projectId) : String(row.projectId || ''),
        syncErrors: syncErrors(),
      }).net;
      const key = targetId + '\n' + reasonOf(reason);
      if (net < 0 && screen.confirmKey !== key) {
        screen.confirmKey = key;
        screen.warn = SENTENCE.owedLead + Ledger.fmt(-net) + SENTENCE.dinar;
        return false;
      }
      screen.confirmKey = '';
      screen.warn = '';
      for (const doc of built.docs) commitBuilt(doc);
      return true;
    }
    const built = reversalDoc({ targetId, reason, createdBy: who.createdBy, deviceId: who.deviceId, createdByName: who.createdByName });
    if (!built.doc || built.errors.length) return false;
    commitBuilt(built.doc);
    return true;
  }

  /**
   * @param {HTMLButtonElement} buttonEl
   * @returns {boolean}
   */
  function onClick(buttonEl) {
    if (!buttonEl) return false;
    const id = buttonEl.id || '';
    const dataset = buttonEl.dataset || {};
    const ours = id === 'act-deduct'
      || id.startsWith('act-approve-deduct-')
      || id.startsWith('act-reject-')
      || id.startsWith('act-supersede-')
      || id.startsWith('act-reverse-')
      || !!dataset.ccRej
      || !!dataset.ccSup
      || !!dataset.ccRev
      || !!dataset.cctarget;
    if (!ours) return false;
    if (buttonEl.disabled) return true;
    if (!costOpen()) return true;
    const agreement = agreementOf(screen.arg);
    if (!agreement || !projectOpen(String(agreement.projectId))) return true;
    buttonEl.disabled = true;
    const who = actor();
    let saved = false;
    if (id === 'act-deduct') saved = saveDeduct(buttonEl, agreement);
    else if (id.startsWith('act-approve-deduct-') && who) {
      const built = approveDeductDoc({
        targetId: id.slice('act-approve-deduct-'.length),
        createdBy: who.createdBy,
        deviceId: who.deviceId,
        createdByName: who.createdByName,
      });
      if (built.doc && !built.errors.length) {
        commitBuilt(built.doc);
        saved = true;
      }
    } else if ((id.startsWith('act-reject-') || dataset.ccRej) && who) {
      const targetId = dataset.ccRej || id.slice('act-reject-'.length);
      const built = rejectDoc({ targetId, createdBy: who.createdBy, deviceId: who.deviceId, createdByName: who.createdByName });
      if (built.doc && !built.errors.length) {
        commitBuilt(built.doc);
        saved = true;
      }
    } else if ((id.startsWith('act-supersede-') || dataset.ccSup) && who) {
      const targetId = dataset.ccSup || id.slice('act-supersede-'.length);
      const qty = qtyOf(field('cc-sup-qty'));
      if (qty != null) {
        const built = supersedeDoc({ targetId, qty, createdBy: who.createdBy, deviceId: who.deviceId, createdByName: who.createdByName });
        if (built.doc && !built.errors.length) {
          commitBuilt(built.doc);
          saved = true;
        }
      }
    } else if (id.startsWith('act-reverse-') || dataset.ccRev) saved = saveReverse(buttonEl);
    if (!saved) buttonEl.disabled = false;
    if (viewApi) viewApi.render();
    return true;
  }

  function bindReason() {
    if (bound || typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
    bound = true;
    document.addEventListener('input', event => {
      const target = /** @type {HTMLInputElement | null} */ (event.target);
      if (!target || (target.id !== 'cc-reason' && target.id !== 'cc-ded-reason')) return;
      const agree = agreementOf(screen.arg);
      const open = !!(agree && projectOpen(String(agree.projectId)));
      const ready = open && !!reasonOf(target.value);
      if (target.id === 'cc-ded-reason') {
        const save = document.querySelector('#act-deduct');
        if (save) /** @type {HTMLButtonElement} */ (save).disabled = !ready;
      } else {
        document.querySelectorAll('button[data-cc-rev]').forEach(node => {
          const el = /** @type {HTMLButtonElement} */ (node);
          const revId = 'rev_' + (el.dataset.ccRev || '');
          el.disabled = !ready || inErrors(revId);
        });
      }
    });
  }

  function register() {
    if (typeof AccountActions === 'undefined' || !AccountActions) return;
    /** @type {AccountAction[]} */
    const actions = [
      { id: 'supersede', tab: 'contractor', label: SENTENCE.newCopy, buttonId: 'act-supersede', renderForm: () => '', onClick, save: input => supersedeDoc(/** @type {CorrectActor & { targetId: string, qty: number }} */ (input)) },
      { id: 'reject', tab: 'contractor', label: SENTENCE.rejectLine, buttonId: 'act-reject', renderForm: () => '', onClick, save: input => rejectDoc(/** @type {CorrectActor & { targetId: string }} */ (input)) },
      { id: 'deduct', tab: 'contractor', label: SENTENCE.deduct, buttonId: 'act-deduct', renderForm: () => '', onClick, save: input => deductDoc(/** @type {CorrectActor & { targetId: string, amount: number, reason: string }} */ (input)) },
      { id: 'approve-deduct', tab: 'contractor', label: SENTENCE.approveDeduct, buttonId: 'act-approve-deduct', renderForm: () => '', onClick, save: input => approveDeductDoc(/** @type {CorrectActor & { targetId: string }} */ (input)) },
      { id: 'reverse', tab: 'contractor', label: SENTENCE.reverse, buttonId: 'act-reverse', renderForm: () => '', onClick, save: input => reversalDoc(/** @type {CorrectActor & { targetId: string, reason?: string }} */ (input)) },
    ];
    for (const action of actions) AccountActions.push(action);
  }

  /**
   * @param {RenderApi} api
   */
  function install(api) {
    viewApi = api;
    screen.arg = '';
    screen.locks = {};
    screen.confirmKey = '';
    screen.warn = '';
    const prior = api.views.contractor;
    api.views.contractor = arg => {
      const base = typeof prior === 'function' ? prior(arg || '') : '';
      return base + blocks(arg || '');
    };
    register();
    bindReason();
  }

  return {
    install,
    deductDoc,
    deductPosition,
    noMoreDeductLine,
    approveDeductDoc,
    rejectDoc,
    supersedeDoc,
    reversalDoc,
    endMeasurementDocs,
  };
});
