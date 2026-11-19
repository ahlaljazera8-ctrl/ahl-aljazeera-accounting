// Outbox flush. No DOM and no Firebase import: the caller performs the write.
// The outbox is a list of ids. There is no syncState field.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Sync = factory();
})(typeof self !== 'undefined' ? self : /** @type {Window} */ (/** @type {unknown} */ (this)), /** @returns {SyncApi} */ function () {
  'use strict';

  /** @param {SyncDoc | null | undefined} doc */
  function isSeed(doc) {
    return !!(doc && (doc.isExample === true || doc.deviceId === 'seed' || String(doc.id || '').indexOf('seed-') === 0));
  }

  const FOREMEN = 'foremen';
  const FOREMAN_MOVES = 'foremanMoves';

  /** @param {string | null | undefined} col */
  function usesPutIfMissing(col) {
    return col === 'subcontracts' || col === 'subcontractAmendments' || col === FOREMEN || col === FOREMAN_MOVES;
  }

  /** @param {SyncDoc | null | undefined} doc @returns {string | null} */
  function collectionFor(doc) {
    if (!doc) return null;
    if (doc.docType === 'foreman') return FOREMEN;
    if (doc.docType === 'foremanMove') return FOREMAN_MOVES;
    if (doc.docType === 'party') return 'parties';
    if (doc.docType === 'agreement') return 'agreements';
    if (doc.docType === 'accountTxn') return 'accountTxns';
    if (doc.docType === 'statementApproval') return 'statementApprovals';
    if (typeof doc.docType === 'string' && doc.docType) return null;
    if (doc.entryType) return 'ledgerEntries';
    if (typeof doc.name === 'string' && doc.currency) return 'projects';
    if (typeof doc.agreedOn === 'string' && doc.projectId && !doc.currency) return 'subcontracts';
    if (doc.subcontractId && doc.date && !doc.entryType) return 'subcontractAmendments';
    return null;
  }

  /**
   * @param {SyncDoc} doc
   * @param {readonly string[]} keys
   * @returns {SyncDoc}
   */
  function copyFields(doc, keys) {
    /** @type {SyncDoc} */
    const out = {};
    keys.forEach(function (k) {
      if (doc[k] !== undefined && doc[k] !== null) out[k] = doc[k];
    });
    return out;
  }

  /** @param {SyncDoc} out @returns {SyncDoc} */
  function blankNote(out) {
    if (out.note == null) out.note = '';
    return out;
  }

  const PARTY_REMOTE = ['id', 'name', 'note', 'createdBy', 'createdAtServer', 'deviceId'];
  const STATEMENT_REMOTE = ['id', 'partyId', 'projectId', 'periodKind', 'periodStart', 'periodEnd', 'createdBy', 'createdAtServer'];
  const AGREEMENT_REMOTE = {
    lump: ['id', 'partyId', 'projectId', 'method', 'description', 'currency', 'createdBy', 'createdAtServer', 'deviceId', 'lumpAmount'],
    unit: ['id', 'partyId', 'projectId', 'method', 'description', 'currency', 'createdBy', 'createdAtServer', 'deviceId', 'unitRate', 'unitQty', 'unitName'],
    daily: ['id', 'partyId', 'projectId', 'method', 'description', 'currency', 'createdBy', 'createdAtServer', 'deviceId', 'dayRate'],
    milestone: ['id', 'partyId', 'projectId', 'method', 'description', 'currency', 'createdBy', 'createdAtServer', 'deviceId', 'milestoneAmount', 'milestoneMode'],
  };
  const REVERSAL_REMOTE = {
    lump: ['id', 'partyId', 'projectId', 'method', 'description', 'currency', 'createdBy', 'createdAtServer', 'deviceId', 'lumpAmount', 'reversesId', 'reversalReason'],
    unit: ['id', 'partyId', 'projectId', 'method', 'description', 'currency', 'createdBy', 'createdAtServer', 'deviceId', 'unitRate', 'unitQty', 'unitName', 'reversesId', 'reversalReason'],
    daily: ['id', 'partyId', 'projectId', 'method', 'description', 'currency', 'createdBy', 'createdAtServer', 'deviceId', 'dayRate', 'reversesId', 'reversalReason'],
    milestone: ['id', 'partyId', 'projectId', 'method', 'description', 'currency', 'createdBy', 'createdAtServer', 'deviceId', 'milestoneAmount', 'milestoneMode', 'reversesId', 'reversalReason'],
  };
  const REJ_REMOTE = ['id', 'kind', 'targetId', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'];
  const REV_REMOTE = ['id', 'kind', 'purpose', 'ledger', 'projectId', 'partyId', 'agreementId', 'amount', 'currency', 'fxRate', 'reversesId', 'reversalReason', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'];
  const REVW_REMOTE = ['id', 'kind', 'purpose', 'ledger', 'projectId', 'partyId', 'currency', 'fxRate', 'targetId', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'];
  const STL_REMOTE = ['id', 'kind', 'purpose', 'projectId', 'partyId', 'ledger', 'currency', 'fxRate', 'amount', 'targetId', 'settlesId', 'txnDate', 'description', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'];
  const SUP_REMOTE = ['id', 'kind', 'purpose', 'projectId', 'partyId', 'agreementId', 'ledger', 'currency', 'fxRate', 'supersedesId', 'qty', 'amount', 'targetId', 'txnDate', 'description', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'];
  const APPR_REMOTE = ['id', 'kind', 'purpose', 'projectId', 'partyId', 'agreementId', 'ledger', 'currency', 'fxRate', 'targetId', 'amount', 'qty', 'txnDate', 'description', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'];
  const DEDUCT_APPR_REMOTE = ['id', 'kind', 'purpose', 'projectId', 'partyId', 'ledger', 'currency', 'fxRate', 'targetId', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'];
  const CASH_REMOTE = ['id', 'kind', 'purpose', 'projectId', 'partyId', 'ledger', 'currency', 'fxRate', 'amount', 'txnDate', 'description', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'];
  const POINTER_CASH_REMOTE = ['id', 'kind', 'purpose', 'projectId', 'partyId', 'ledger', 'currency', 'fxRate', 'amount', 'targetId', 'txnDate', 'description', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'];
  const QTY_REMOTE = ['id', 'kind', 'purpose', 'projectId', 'partyId', 'agreementId', 'ledger', 'currency', 'fxRate', 'qty', 'txnDate', 'description', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'];

  /**
   * A payLabor that still carries targetId is the Q14 guard. The cash allowlist
   * omits that key, and sending it is what the rules deny on the next flush.
   * @param {SyncDoc} doc
   * @returns {readonly string[]}
   */
  function txnRemoteKeys(doc) {
    if (doc.kind === 'rej') return REJ_REMOTE;
    if (doc.kind === 'rev') return REV_REMOTE;
    if (doc.kind === 'revw') return REVW_REMOTE;
    if (doc.kind === 'stl') return STL_REMOTE;
    if (doc.kind === 'sup') return SUP_REMOTE;
    if (doc.kind === 'appr' && doc.purpose === 'approveDeduct') return DEDUCT_APPR_REMOTE;
    if (doc.kind === 'appr') return APPR_REMOTE;
    if (doc.kind === 'body' && (doc.purpose === 'payLabor' || doc.purpose === 'advanceLabor')) {
      return doc.targetId ? CASH_REMOTE.concat(['targetId']) : CASH_REMOTE;
    }
    if (doc.kind === 'body' && (doc.purpose === 'returnAdvance' || doc.purpose === 'refundLabor' || doc.purpose === 'deduct')) return POINTER_CASH_REMOTE;
    return QTY_REMOTE;
  }

  /**
   * @param {SyncDoc} doc
   * @returns {readonly string[]}
   */
  function agreementRemoteKeys(doc) {
    const method = doc.method === 'unit' || doc.method === 'daily' || doc.method === 'milestone' || doc.method === 'lump' ? doc.method : '';
    const rev = (typeof doc.id === 'string' && doc.id.indexOf('rev_') === 0) || !!doc.reversesId;
    const table = rev ? REVERSAL_REMOTE : AGREEMENT_REMOTE;
    return method ? table[method] : ['id'];
  }

  /** @param {SyncDoc} doc @returns {SyncDoc} */
  function toRemote(doc) {
    if (doc.docType === 'party') return copyFields(doc, PARTY_REMOTE);
    if (doc.docType === 'agreement') return copyFields(doc, agreementRemoteKeys(doc));
    if (doc.docType === 'accountTxn') return copyFields(doc, txnRemoteKeys(doc));
    if (doc.docType === 'statementApproval') return copyFields(doc, STATEMENT_REMOTE);
    if (doc.docType === 'foreman') return blankNote(copyFields(doc, ['id', 'name', 'note', 'projectId', 'createdBy']));
    if (doc.docType === 'foremanMove') return blankNote(copyFields(doc, ['id', 'foremanId', 'kind', 'amount', 'date', 'note', 'isReversal', 'reversesMoveId', 'reversalReason', 'createdAtDevice', 'createdBy', 'deviceId']));
    if (doc.entryType) {
      const out = copyFields(doc, ['id', 'projectId', 'direction', 'entryType', 'amount', 'currency', 'entryDate', 'isReversal', 'createdAtDevice', 'createdBy', 'deviceId']);
      if (doc.description) out.description = doc.description;
      if (doc.partyName) out.partyName = doc.partyName;
      if (doc.createdByName) out.createdByName = doc.createdByName;
      if (doc.isReversal) {
        out.reversesEntryId = doc.reversesEntryId;
        out.reversalReason = doc.reversalReason;
      }
      if (doc.entryType === 'subcontractor' && doc.subcontractId) out.subcontractId = doc.subcontractId;
      if (doc.foremanId) out.foremanId = doc.foremanId;
      return out;
    }
    if (typeof doc.agreedOn === 'string' && doc.projectId && !doc.currency) {
      const name = copyFields(doc, ['id', 'projectId', 'name', 'work', 'agreedOn', 'createdBy']);
      if (!name.work) name.work = '';
      return name;
    }
    if (doc.subcontractId && doc.date && !doc.entryType) {
      return copyFields(doc, ['id', 'subcontractId', 'projectId', 'amount', 'date', 'note', 'createdBy']);
    }
    const out = copyFields(doc, ['id', 'name', 'clientName', 'currency', 'status', 'createdAtDevice', 'createdBy', 'deviceId']);
    if (doc.location) out.location = doc.location;
    return out;
  }

  const MAX_CONTRACT = (function () {
    if (typeof module === 'object' && module.exports) return require('./ledger.js').MAX_AMOUNT_IQD;
    const win = /** @type {Window} */ (/** @type {unknown} */ (globalThis));
    return win.Ledger.MAX_AMOUNT_IQD;
  })();
  const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

  /** @param {SyncDoc | null | undefined} doc @returns {number | null} */
  function contractAmountOf(doc) {
    if (!doc || !Number.isInteger(doc.contractAmount)) return null;
    const amount = /** @type {number} */ (doc.contractAmount);
    if (amount < 0 || amount > MAX_CONTRACT) return null;
    return amount;
  }

  /** @param {SyncDoc | null | undefined} doc */
  function withoutContractAmount(doc) {
    if (!doc || !Object.prototype.hasOwnProperty.call(doc, 'contractAmount')) return doc;
    const out = Object.assign({}, doc);
    delete out.contractAmount;
    return out;
  }

  // Owner save: the number moves to projectFinance and is not part of the project write.
  /**
   * @param {SyncDoc | null | undefined} project
   * @param {unknown} [amount]
   */
  function splitProjectSave(project, amount) {
    const chosen = Number.isInteger(amount) ? /** @type {number} */ (amount) : contractAmountOf(project);
    const next = withoutContractAmount(project || {});
    if (chosen === null || chosen < 0 || chosen > MAX_CONTRACT) return { project: next, finance: null };
    return { project: next, finance: { contractAmount: chosen } };
  }

  /**
   * @param {SyncUser | null | undefined} user
   * @param {readonly SyncDoc[] | null | undefined} projects
   */
  function projectsForClient(user, projects) {
    const rows = projects || [];
    if (user && user.role === 'owner') return rows.map(row => Object.assign({}, row));
    return rows.map(withoutContractAmount);
  }

  /**
   * @param {SyncUser | null | undefined} user
   * @param {readonly string[] | null | undefined} projectIds
   * @returns {readonly ReadSpec[]}
   */
  function financeReads(user, projectIds) {
    if (!user || user.role !== 'owner' || user.active !== true) return [];
    return validProjectIds(projectIds).map(id => ({ collection: 'projectFinance', id }));
  }

  /** @param {SyncDoc | null | undefined} doc */
  function stripMoney(doc) {
    if (!doc) return doc;
    const out = Object.assign({}, doc);
    delete out.originalAmount;
    delete out.contractAmount;
    delete out.paid;
    delete out.agreed;
    delete out.remaining;
    return out;
  }

  /** @param {unknown} amount @returns {{ originalAmount: number } | null} */
  function termsPayload(amount) {
    if (!Number.isInteger(amount) || /** @type {number} */ (amount) <= 0 || /** @type {number} */ (amount) > MAX_CONTRACT) return null;
    return { originalAmount: /** @type {number} */ (amount) };
  }

  // Owner reads names and amendments. A site user reads names on assigned projects only, never terms or amendments.
  /**
   * @param {SyncUser | null | undefined} user
   * @param {unknown} since
   * @returns {readonly ReadSpec[]}
   */
  function subcontractReads(user, since) {
    if (!user || user.active !== true) return [];
    if (user.role === 'owner') {
      return sinceClause([
        { collection: 'subcontracts', where: [] },
        { collection: 'subcontractAmendments', where: [] },
      ], since);
    }
    if (user.role !== 'site') return [];
    return validProjectIds(user.assignedProjectIds).map(id => ({
      collection: 'subcontracts',
      where: [['projectId', '==', id]],
    }));
  }

  /** @param {SubPull} opts */
  async function pullSubcontracts(opts) {
    const specs = subcontractReads(opts.user, opts.since);
    if (!specs.length) return { subcontracts: [], amendments: [], watermark: finiteMillis(opts.since) };
    const rows = await readSpecs(specs, opts.read);
    /** @type {SyncDoc[]} */
    const subcontracts = [];
    /** @type {SyncDoc[]} */
    const amendments = [];
    rows.forEach(row => {
      if (!row) return;
      if (row.agreedOn && !row.entryType && !row.currency) subcontracts.push(/** @type {SyncDoc} */ (stripMoney(row)));
      else if (row.subcontractId && row.date) amendments.push(row);
    });
    return {
      subcontracts,
      amendments,
      watermark: nextWatermark(opts.since, subcontracts.concat(amendments)),
    };
  }

  /**
   * @param {SyncUser | null | undefined} user
   * @param {unknown} since
   * @returns {readonly ReadSpec[]}
   */
  function foremanReads(user, since) {
    if (!user || user.role !== 'owner' || user.active !== true) return [];
    return sinceClause([
      { collection: FOREMEN, where: [] },
      { collection: FOREMAN_MOVES, where: [] },
    ], since);
  }

  /** @param {SubPull} opts */
  async function pullForemen(opts) {
    const specs = foremanReads(opts.user, opts.since);
    if (!specs.length) return { foremen: [], moves: [], watermark: finiteMillis(opts.since) };
    /** @type {SyncDoc[]} */
    const foremen = [];
    /** @type {SyncDoc[]} */
    const moves = [];
    for (let i = 0; i < specs.length; i++) {
      const spec = specs[i];
      const rows = await readSpecs([spec], opts.read);
      rows.forEach(row => {
        if (!row) return;
        if (spec.collection === FOREMAN_MOVES) moves.push(Object.assign({}, row, { docType: 'foremanMove' }));
        else foremen.push(Object.assign({}, row, { docType: 'foreman' }));
      });
    }
    return { foremen, moves, watermark: nextWatermark(opts.since, foremen.concat(moves)) };
  }

  /** @param {SyncUser | null | undefined} input @returns {PersonResult} */
  function personInput(input) {
    const src = input || {};
    const uid = typeof src.uid === 'string' ? src.uid.trim() : '';
    const displayName = typeof src.displayName === 'string' ? src.displayName.trim() : '';
    const email = typeof src.email === 'string' ? src.email.trim() : '';
    const ids = Array.isArray(src.assignedProjectIds) ? src.assignedProjectIds : null;
    const errors = [];
    if (!ID_RE.test(uid)) errors.push('معرّف المستخدم غير صالح');
    if (!displayName || displayName.length > 80) errors.push('الاسم مطلوب وبحد أقصى 80 حرفاً');
    if (email.length < 4 || email.length > 200 || !/.+@.+\..+/.test(email)) errors.push('البريد غير صالح');
    if (src.role !== 'site' && src.role !== 'owner') errors.push('الدور غير صالح');
    if (typeof src.active !== 'boolean') errors.push('حالة الحساب غير صالحة');
    if (!ids || ids.length > 20 || ids.some(/** @param {unknown} id */ id => typeof id !== 'string' || !ID_RE.test(id))) errors.push('اختر مشاريع محددة بحد أقصى 20');
    if (errors.length) return { ok: false, errors };
    return {
      ok: true,
      value: {
        uid, displayName, email,
        role: /** @type {string} */ (src.role),
        active: /** @type {boolean} */ (src.active),
        assignedProjectIds: /** @type {string[]} */ (ids).slice(),
      },
    };
  }

  /**
   * @param {SyncDoc} doc
   * @param {unknown} sentinel
   */
  function withServerTime(doc, sentinel) {
    const data = toRemote(doc);
    data.createdAtServer = /** @type {SyncDoc['createdAtServer']} */ (sentinel);
    return data;
  }

  /** @param {SyncDoc} data @returns {SyncDoc} */
  function fromRemote(data) {
    const out = Object.assign({}, data);
    const ts = /** @type {ServerStamp | number | null | undefined} */ (data.createdAtServer);
    if (ts != null && typeof ts === 'object' && typeof ts.toMillis === 'function') out.createdAtServer = ts.toMillis();
    else if (ts != null && typeof ts === 'object' && typeof ts.seconds === 'number') out.createdAtServer = ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6);
    return out;
  }

  /**
   * @param {readonly SyncDoc[] | null | undefined} local
   * @param {readonly SyncDoc[] | null | undefined} incoming
   * @param {readonly string[] | null | undefined} pendingIds
   */
  function mergeById(local, incoming, pendingIds) {
    const pending = new Set(pendingIds || []);
    const map = new Map();
    (local || []).forEach(function (row) { if (row && row.id) map.set(row.id, row); });
    (incoming || []).forEach(function (row) {
      if (!row || !row.id || pending.has(row.id)) return;
      map.set(row.id, row);
    });
    return Array.from(map.values());
  }

  /** @param {readonly string[] | null | undefined} ids */
  function validProjectIds(ids) {
    return (ids || []).filter(id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id));
  }

  // What a pull is allowed to read. A display-name edit does not change it.
  // An assignment, role, or active-flag change does: the old watermark was
  // measured on a different set, and an incremental query would skip history.
  /** @param {SyncUser | null | undefined} user */
  function readSetKey(user) {
    const ids = validProjectIds(user && user.assignedProjectIds).slice().sort();
    const role = user && user.role === 'owner' ? 'owner' : 'site';
    return role + '\n' + (user && user.active === true ? '1' : '0') + '\n' + ids.join('\n');
  }
  /**
   * @param {SyncUser | null | undefined} prev
   * @param {SyncUser | null | undefined} next
   */
  function readSetChanged(prev, next) {
    return readSetKey(prev) !== readSetKey(next);
  }

  /** @param {unknown} v @returns {number | null} */
  function finiteMillis(v) {
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  }

  // Queries a site client is allowed to run. Rules are not a filter.
  // Own rows are limited to assigned projects (F11); an unconstrained createdBy query is denied.
  /**
   * @param {string | null | undefined} uid
   * @param {readonly string[] | null | undefined} projectIds
   * @returns {readonly ReadSpec[]}
   */
  function siteReads(uid, projectIds) {
    /** @type {ReadSpec[]} */
    const reads = [];
    const ids = validProjectIds(projectIds);
    for (let i = 0; i < ids.length; i += 10) {
      const chunk = ids.slice(i, i + 10);
      reads.push({
        collection: 'ledgerEntries',
        where: [['direction', '==', 'expense'], ['projectId', 'in', chunk]],
      });
      reads.push({
        collection: 'ledgerEntries',
        where: [['createdBy', '==', uid], ['projectId', 'in', chunk]],
      });
    }
    return reads;
  }

  // First sync (since == null) reads the whole allowed set. Later syncs add
  // createdAtServer >= watermark. The inclusive bound re-reads the last instant;
  // mergeById drops ids already stored, and a strict > would skip a row that
  // shares that server time. Null createdAtServer (still offline) is not a bound.
  /**
   * @param {readonly ReadSpec[]} specs
   * @param {unknown} since
   * @returns {readonly ReadSpec[]}
   */
  function sinceClause(specs, since) {
    const ms = finiteMillis(since);
    if (ms === null) return specs;
    return specs.map(spec => spec.id ? spec : {
      collection: spec.collection,
      where: (spec.where || []).concat([['createdAtServer', '>=', ms]]),
    });
  }

  /**
   * @param {SyncUser | null | undefined} user
   * @param {unknown} since
   * @returns {readonly ReadSpec[]}
   */
  function entryReads(user, since) {
    const specs = user && user.role === 'owner'
      ? [{ collection: 'ledgerEntries', where: [] }]
      : siteReads(user && user.uid, user && user.assignedProjectIds);
    return sinceClause(specs, since);
  }

  /**
   * @param {SyncUser | null | undefined} user
   * @param {unknown} since
   * @returns {readonly ReadSpec[]}
   */
  function projectReads(user, since) {
    if (user && user.role === 'owner') return sinceClause([{ collection: 'projects', where: [] }], since);
    return validProjectIds(user && user.assignedProjectIds).map(id => ({ collection: 'projects', id }));
  }

  /**
   * @param {unknown} previous
   * @param {readonly SyncDoc[] | null | undefined} rows
   */
  function nextWatermark(previous, rows) {
    let max = finiteMillis(previous);
    (rows || []).forEach(row => {
      const t = finiteMillis(row && row.createdAtServer);
      if (t !== null && (max === null || t > max)) max = t;
    });
    return max;
  }

  /** @param {readonly ReadSpec[] | null | undefined} specs */
  function isBounded(specs) {
    return (specs || []).some(spec => (spec.where || []).some(part => part[0] === 'createdAtServer'));
  }

  /**
   * @param {readonly ReadSpec[]} specs
   * @param {(spec: ReadSpec) => Promise<readonly SyncDoc[]>} read
   */
  async function readSpecs(specs, read) {
    const out = [];
    for (let i = 0; i < specs.length; i++) {
      const rows = await read(specs[i]);
      for (let j = 0; j < rows.length; j++) out.push(fromRemote(rows[j]));
    }
    return out;
  }

  // read(spec) returns raw documents for one query or one id. Watermarks advance
  // only from a successful incremental read, never from a local pending entry.
  // A failed incremental query (missing index or any other error) repeats the
  // sync as a full pull and leaves the stored watermark where it was.
  /** @param {PullCall} opts */
  async function pullChanges(opts) {
    const user = opts.user;
    const mark = opts.watermark || {};
    const entrySpecs = entryReads(user, mark.entries);
    const projectSpecs = projectReads(user, mark.projects);
    const bounded = isBounded(entrySpecs) || isBounded(projectSpecs);
    let incoming;
    let projects;
    let advance = true;
    try {
      incoming = await readSpecs(entrySpecs, opts.read);
      projects = await readSpecs(projectSpecs, opts.read);
    } catch (err) {
      if (!bounded) throw err;
      incoming = await readSpecs(entryReads(user, null), opts.read);
      projects = await readSpecs(projectReads(user, null), opts.read);
      advance = false;
    }
    return {
      entries: mergeById(opts.localEntries, incoming, opts.pendingIds),
      projects: mergeById(opts.localProjects, projects, opts.pendingIds),
      incomingEntries: incoming,
      incomingProjects: projects,
      watermark: advance ? {
        entries: nextWatermark(mark.entries, incoming),
        projects: nextWatermark(mark.projects, projects),
      } : {
        entries: finiteMillis(mark.entries),
        projects: finiteMillis(mark.projects),
      },
      missingProjectIds: missingRequestedIds(projectSpecs, projects),
    };
  }

  /** @returns {SyncStatusApi | null} */
  function statusApi() {
    if (typeof require === 'function') {
      try { return /** @type {SyncStatusApi} */ (require('./sync-status.js')); } catch (e) { /* a missing module falls through to the global */ }
    }
    const g = /** @type {Window} */ (typeof globalThis !== 'undefined' ? globalThis : {});
    return g.SyncStatus || null;
  }

  /**
   * @param {unknown} typed
   * @param {unknown} name
   */
  function exactProjectName(typed, name) {
    return typeof name === 'string' && name.length > 0 && typeof typed === 'string' && typed === name;
  }

  // The project document is its own first batch. Later batches delete children
  // only after that document is gone, which is what the rules require.
  // Terms batches stay small: each terms delete may read its subcontract.
  /**
   * @param {string | undefined} projectId
   * @param {DeleteFound | null | undefined} found
   * @returns {DeleteDoc[]}
   */
  function projectDeleteDocs(projectId, found) {
    const projectKey = projectId || '';
    if (!ID_RE.test(projectKey)) return [];
    const src = found || {};
    /** @type {DeleteDoc[]} */
    const docs = [{ collection: 'projects', id: projectKey }];
    /**
     * @param {string} collection
     * @param {string} id
     */
    const add = (collection, id) => {
      if (!ID_RE.test(id || '')) return;
      if (docs.some(row => row.collection === collection && row.id === id)) return;
      docs.push({ collection, id });
    };
    (src.entryIds || []).forEach(id => add('ledgerEntries', id));
    (src.subcontractIds || []).forEach(id => add('subcontracts', id));
    (src.amendmentIds || []).forEach(id => add('subcontractAmendments', id));
    (src.termIds || []).forEach(id => add('subcontractTerms', id));
    if (src.finance) add('projectFinance', projectKey);
    return docs;
  }

  /** @param {readonly DeleteDoc[] | null | undefined} docs @returns {DeleteDoc[][]} */
  function projectDeleteBatches(docs) {
    const list = docs || [];
    const project = list.filter(row => row && row.collection === 'projects').slice(0, 1);
    const terms = list.filter(row => row && row.collection === 'subcontractTerms');
    const rest = list.filter(row => row && row.collection !== 'projects' && row.collection !== 'subcontractTerms');
    const out = [];
    if (project.length) out.push(project);
    for (let i = 0; i < terms.length; i += 6) out.push(terms.slice(i, i + 6));
    for (let i = 0; i < rest.length; i += 400) out.push(rest.slice(i, i + 400));
    return out;
  }

  /**
   * @param {readonly ReadSpec[] | null | undefined} specs
   * @param {readonly SyncDoc[] | null | undefined} rows
   * @returns {string[]}
   */
  function missingRequestedIds(specs, rows) {
    const found = new Set();
    (rows || []).forEach(row => { if (row && row.id) found.add(row.id); });
    /** @type {string[]} */
    const missing = [];
    (specs || []).forEach(spec => {
      if (!spec || !spec.id || found.has(spec.id) || missing.indexOf(spec.id) >= 0) return;
      missing.push(spec.id);
    });
    return missing;
  }

  // Drop one project's local rows. Pending outbox rows stay when dropPending
  // is false, so another phone can still show that the send was rejected.
  // The deleting phone passes dropPending so its own unsent rows go too.
  /**
   * @param {LocalStore | null | undefined} store
   * @param {string} projectId
   * @param {{ dropPending?: boolean } | null | undefined} opts
   * @returns {DroppedProject}
   */
  function dropProjectLocal(store, projectId, opts) {
    const src = store || {};
    const dropPending = !!(opts && opts.dropPending);
    const pending = new Set(dropPending ? [] : (src.outbox || []));
    const errors = src.syncErrors || {};
    const subIds = new Set((src.subcontracts || []).filter(row => row && row.projectId === projectId).map(row => row.id));
    const removed = new Set([projectId]);
    /** @type {string[]} */
    const removedEntryIds = [];
    // Another phone keeps a row that is still queued or already refused, so the
    // bell can show the rejection. The deleting phone drops those too.
    /** @param {SyncDoc | null | undefined} row */
    const keep = row => !!(row && !dropPending && (pending.has(/** @type {string} */ (row.id)) || !!errors[/** @type {string} */ (row.id)]));
    const entries = (src.entries || []).filter(row => {
      if (!row || row.projectId !== projectId) return true;
      if (keep(row)) return true;
      if (typeof row.id === 'string' && row.id) {
        removed.add(row.id);
        removedEntryIds.push(row.id);
      }
      return false;
    });
    const amendments = (src.amendments || []).filter(row => {
      if (!row || (row.projectId !== projectId && !subIds.has(row.subcontractId))) return true;
      if (keep(row)) return true;
      removed.add(/** @type {string} */ (row.id));
      return false;
    });
    const subcontracts = (src.subcontracts || []).filter(row => {
      if (!row || row.projectId !== projectId) return true;
      if (keep(row)) return true;
      removed.add(/** @type {string} */ (row.id));
      return false;
    });
    const keptSubs = new Set(subcontracts.filter(row => row && row.projectId === projectId).map(row => row.id));
    /** @type {Record<string, { originalAmount?: number }>} */
    const terms = Object.assign({}, src.terms || {});
    subIds.forEach(id => { if (!keptSubs.has(id)) delete terms[/** @type {string} */ (id)]; });
    /** @type {Record<string, { contractAmount?: number }>} */
    const finance = Object.assign({}, src.finance || {});
    delete finance[projectId];
    /** @type {string[]} */
    const removedProjectIds = [];
    const projects = (src.projects || []).filter(row => {
      if (!row || row.id !== projectId) return true;
      if (typeof row.id === 'string' && row.id) removedProjectIds.push(row.id);
      return false;
    });
    /** @type {GoneProjectNames} */
    const goneProjectNames = Object.assign({}, src.goneProjectNames || {});
    const dropped = (src.projects || []).find(row => row && row.id === projectId);
    if (dropped && typeof dropped.name === 'string' && dropped.name) goneProjectNames[projectId] = dropped.name;
    /** @param {readonly SyncDoc[] | null | undefined} rows */
    const rowsForProject = rows => (rows || []).filter(row => {
      if (!row || row.projectId !== projectId) return true;
      if (keep(row)) return true;
      if (typeof row.id === 'string' && row.id) removed.add(row.id);
      return false;
    });
    const agreements = rowsForProject(src.agreements);
    const accountTxns = rowsForProject(src.accountTxns);
    const statementApprovals = rowsForProject(src.statementApprovals);
    /** @type {Record<string, unknown>} */
    const syncErrors = Object.assign({}, src.syncErrors || {});
    removed.forEach(id => { delete syncErrors[id]; });
    const outbox = (src.outbox || []).filter(id => !removed.has(id));
    const statusPending = (src.statusPending || []).filter(id => id !== projectId);
    const foremen = (src.foremen || []).slice();
    const foremanMoves = (src.foremanMoves || []).slice();
    const parties = (src.parties || []).slice();
    /**
     * @param {Readonly<Record<string, SyncDoc>> | null | undefined} map
     * @returns {Record<string, SyncDoc>}
     */
    const filterMap = map => {
      const srcMap = map || {};
      if (!dropPending) return Object.assign({}, srcMap);
      /** @type {Record<string, SyncDoc>} */
      const out = {};
      Object.keys(srcMap).forEach(key => {
        const doc = srcMap[key];
        if (doc && doc.projectId === projectId) return;
        out[key] = doc;
      });
      return out;
    };
    const slotLosers = filterMap(src.slotLosers);
    const linkRefusals = filterMap(src.linkRefusals);
    return {
      entries, projects, subcontracts, amendments, finance, terms, outbox, syncErrors, statusPending, foremen, foremanMoves, goneProjectNames,
      parties, agreements, accountTxns, statementApprovals, slotLosers, linkRefusals,
      removed: { projectIds: removedProjectIds, entryIds: removedEntryIds },
    };
  }

  const ACCOUNTS_MARK = 'accounts';
  const SLOT_ID = /^000[0-9a-f]{32}[1-9]$/;
  /** @type {Record<string, 1>} */
  const ACCOUNT_TYPES = { foreman: 1, foremanMove: 1, party: 1, agreement: 1, accountTxn: 1, statementApproval: 1 };

  /**
   * @param {SyncDoc | null | undefined} doc
   * @returns {string | null}
   */
  function queueRefusal(doc) {
    if (!doc || typeof doc.docType !== 'string' || !doc.docType) return null;
    if (!ACCOUNT_TYPES[doc.docType]) return 'docType';
    if (doc.docType === 'accountTxn' && doc.kind === 'inv') return 'kind';
    return null;
  }

  /**
   * @param {string} id
   * @param {QueueStores | null | undefined} stores
   * @returns {SyncDoc | null}
   */
  function localDoc(id, stores) {
    if (!id || !stores) return null;
    const names = ['entries', 'projects', 'subcontracts', 'amendments', 'foremen', 'foremanMoves', 'parties', 'agreements', 'accountTxns', 'statementApprovals'];
    for (let i = 0; i < names.length; i++) {
      const rows = stores[names[i]];
      if (!rows) continue;
      for (let j = 0; j < rows.length; j++) {
        const row = rows[j];
        if (row && row.id === id) return row;
      }
    }
    return null;
  }

  /**
   * @param {SyncUser | null | undefined} user
   * @param {unknown} since
   * @returns {readonly ReadSpec[]}
   */
  function accountReads(user, since) {
    if (!user || user.role !== 'owner' || user.active !== true) return [];
    return sinceClause([
      { collection: 'parties', where: [] },
      { collection: 'agreements', where: [] },
      { collection: 'accountTxns', where: [] },
      { collection: 'statementApprovals', where: [] },
    ], since);
  }

  /** @param {SubPull} opts */
  async function pullAccounts(opts) {
    const specs = accountReads(opts.user, opts.since);
    const empty = { parties: /** @type {SyncDoc[]} */ ([]), agreements: /** @type {SyncDoc[]} */ ([]), accountTxns: /** @type {SyncDoc[]} */ ([]), statementApprovals: /** @type {SyncDoc[]} */ ([]), watermark: finiteMillis(opts.since) };
    if (!specs.length) return empty;
    /** @type {SyncDoc[]} */
    const parties = [];
    /** @type {SyncDoc[]} */
    const agreements = [];
    /** @type {SyncDoc[]} */
    const accountTxns = [];
    /** @type {SyncDoc[]} */
    const statementApprovals = [];
    for (let i = 0; i < specs.length; i++) {
      const spec = specs[i];
      const rows = await readSpecs([spec], opts.read);
      rows.forEach(row => {
        if (!row) return;
        const tagged = Object.assign({}, row);
        if (spec.collection === 'parties') { tagged.docType = 'party'; parties.push(tagged); }
        else if (spec.collection === 'agreements') { tagged.docType = 'agreement'; agreements.push(tagged); }
        else if (spec.collection === 'accountTxns') { tagged.docType = 'accountTxn'; accountTxns.push(tagged); }
        else { tagged.docType = 'statementApproval'; statementApprovals.push(tagged); }
      });
    }
    return {
      parties, agreements, accountTxns, statementApprovals,
      watermark: nextWatermark(opts.since, parties.concat(agreements, accountTxns, statementApprovals)),
    };
  }

  /** @param {string} id @returns {string} */
  function slotLoserKey(id) { return 'slotLoser:' + id; }

  /**
   * @param {Readonly<Record<string, SyncDoc>> | null | undefined} losers
   * @returns {{ key: string, doc: SyncDoc, readOnly: true }[]}
   */
  function slotLoserViews(losers) {
    const map = losers || {};
    return Object.keys(map).map(key => ({ key, doc: map[key], readOnly: /** @type {true} */ (true) }));
  }

  /**
   * @param {Readonly<Record<string, SyncDoc>> | null | undefined} refusals
   * @returns {{ key: string, doc: SyncDoc, readOnly: true }[]}
   */
  function linkRefusalViews(refusals) {
    const map = refusals || {};
    return Object.keys(map).map(key => ({ key, doc: map[key], readOnly: /** @type {true} */ (true) }));
  }

  /** @param {SyncDoc | null | undefined} doc */
  function isAccountDoc(doc) {
    return !!(doc && (doc.docType === 'party' || doc.docType === 'agreement' || doc.docType === 'accountTxn' || doc.docType === 'statementApproval'));
  }

  /** @param {SyncDoc | null | undefined} doc */
  function isSlotBody(doc) {
    return !!(doc && doc.docType === 'accountTxn' && doc.kind === 'body' && typeof doc.id === 'string' && SLOT_ID.test(doc.id));
  }

  /**
   * Pointers that can be parents. A rev_ id is never a parent.
   * @param {SyncDoc | null | undefined} doc
   * @returns {string[]}
   */
  function parentPointers(doc) {
    /** @type {string[]} */
    const out = [];
    ['targetId', 'reversesId', 'supersedesId', 'settlesId'].forEach(key => {
      const value = doc && doc[key];
      if (typeof value === 'string' && value && value.indexOf('rev_') !== 0) out.push(value);
    });
    return out;
  }

  /** @returns {Record<string, { needsApproval?: boolean, effect?: { cash?: number } }> | null} */
  function purposesTable() {
    if (typeof module === 'object' && module.exports) {
      try { return require('./accounts.js').PURPOSES; } catch (e) { return null; }
    }
    const win = /** @type {Window} */ (typeof globalThis !== 'undefined' ? globalThis : {});
    const accounts = /** @type {{ PURPOSES?: Record<string, { needsApproval?: boolean, effect?: { cash?: number } }> }} */ (win.Accounts);
    return accounts && accounts.PURPOSES ? accounts.PURPOSES : null;
  }

  /**
   * @param {SyncDoc | null | undefined} doc
   * @param {Record<string, { needsApproval?: boolean, effect?: { cash?: number } }>} table
   * @returns {boolean}
   */
  function cashNeverJoins(doc, table) {
    const row = doc && doc.purpose ? table[String(doc.purpose)] : null;
    if (!row || !row.effect) return false;
    return row.needsApproval === false && row.effect.cash !== 0;
  }

  /**
   * No Firebase code, or a client invalid-argument from building the reference.
   * @param {SyncFailure | null | undefined} err
   */
  function isClientRefusal(err) {
    if (!err || err.code == null || err.code === '') return true;
    if (String(err.code) !== 'invalid-argument') return false;
    return err.client === true || /document reference/i.test(String(err.message || ''));
  }

  /** @param {FlushCall} opts */
  async function flushOutbox({ ids, load, write, exists, readServer, projectProbe, readDependency, mintId }) {
    const Status = statusApi();
    /** @type {string[]} */
    const synced = [];
    /** @type {string[]} */
    const kept = [];
    /** @type {{ id: string, message: string }[]} */
    const failed = [];
    /** @type {{ id: string, remote: SyncDoc }[]} */
    const adopted = [];
    /** @type {string[]} */
    const parked = [];
    /** @type {{ key: string, doc: SyncDoc }[]} */
    const slotLosers = [];
    /** @type {{ localId: string, doc: SyncDoc }[]} */
    const linkRefusals = [];
    const syncedSet = new Set();
    const keptSet = new Set();
    const failedSet = new Set();
    const parkedSet = new Set();
    const unresolved = new Set();
    const seen = new Set();
    /** @param {boolean} authDead */
    const pack = authDead => ({ synced, kept, failed, adopted, parked, slotLosers, linkRefusals, authDead });
    /** @param {string} id */
    const keepId = id => { kept.push(id); keptSet.add(id); };
    /** @param {string} id */
    const syncId = id => { synced.push(id); syncedSet.add(id); };
    /** @param {string} id @param {string} message */
    const failId = (id, message) => { failed.push({ id, message }); failedSet.add(id); };
    /**
     * @param {SyncDoc} local
     * @returns {Promise<'auth' | 'failed'>}
     */
    async function failAccount(local) {
      let message = Status ? Status.REJECTED : 'رُفض الإرسال';
      if (local.projectId && Status && typeof projectProbe === 'function') {
        /** @type {ProjectProbe | null | undefined} */
        let probe;
        try {
          probe = await projectProbe(local);
        } catch (probeErr) {
          if (Status.isDeadAuth(/** @type {SyncFailure} */ (probeErr))) {
            keepId(/** @type {string} */ (local.id));
            return 'auth';
          }
          probe = null;
        }
        const project = load(/** @type {string} */ (local.projectId));
        const neverSent = !!(project && !project.createdAtServer && project.id && synced.indexOf(project.id) === -1);
        message = Status.messageAfterProjectProbe(message, probe, neverSent);
      }
      failId(/** @type {string} */ (local.id), message);
      return 'failed';
    }
    /**
     * @param {SyncDoc} local
     * @param {SyncDoc} remote
     */
    function adoptServer(local, remote) {
      syncId(/** @type {string} */ (local.id));
      adopted.push({ id: /** @type {string} */ (local.id), remote });
    }
    /** @param {SyncDoc} slot */
    function parkSubtree(slot) {
      const table = purposesTable();
      slotLosers.push({ key: slotLoserKey(/** @type {string} */ (slot.id)), doc: Object.assign({}, slot) });
      if (!table) { unresolved.add(/** @type {string} */ (slot.id)); return; }
      /** @type {SyncDoc[]} */
      const docs = [];
      const queued = new Set();
      ids.forEach(qid => {
        if (queued.has(qid) || syncedSet.has(qid) || qid === slot.id) return;
        queued.add(qid);
        const doc = load(qid);
        if (doc) docs.push(doc);
      });
      const set = new Set([/** @type {string} */ (slot.id)]);
      let grew = true;
      while (grew) {
        grew = false;
        docs.forEach(doc => {
          if (!doc.id || set.has(doc.id)) return;
          if (cashNeverJoins(doc, table)) return;
          if (parentPointers(doc).some(pointer => set.has(pointer))) { set.add(doc.id); grew = true; return; }
          if (isSlotBody(doc) && doc.agreementId && doc.agreementId === slot.agreementId && String(doc.id).slice(-1) > String(slot.id).slice(-1)) {
            set.add(doc.id);
            grew = true;
          }
        });
      }
      docs.forEach(doc => {
        if (!doc.id || !set.has(doc.id) || parkedSet.has(doc.id)) return;
        parked.push(doc.id);
        parkedSet.add(doc.id);
        slotLosers.push({ key: slotLoserKey(doc.id), doc: Object.assign({}, doc) });
      });
    }
    /**
     * @param {SyncDoc} local
     * @param {SyncDoc} remote
     * @returns {'adopted' | 'queued' | 'refused'}
     */
    function adoptFound(local, remote) {
      if (Status && Status.sameContent(local, remote)) { syncId(/** @type {string} */ (local.id)); return 'adopted'; }
      if (isSlotBody(local) && remote.kind === 'body') {
        const differs = Status && Status.payloadDiffers(local, remote);
        adoptServer(local, remote);
        if (differs) parkSubtree(local);
        return 'adopted';
      }
      if (local.docType === 'accountTxn' && local.kind === 'rev' && remote.kind === 'rev' && local.reversesId && local.reversesId === remote.reversesId) {
        adoptServer(local, remote);
        return 'adopted';
      }
      if (local.docType === 'agreement' && typeof local.id === 'string' && local.id.indexOf('rev_') === 0 && local.reversesId && local.reversesId === remote.reversesId) {
        adoptServer(local, remote);
        return 'adopted';
      }
      const shared = local.kind === 'appr' || local.kind === 'rej' || local.kind === 'revw' || local.kind === 'sup';
      if (shared && remote.kind === local.kind) {
        const sameTarget = local.kind === 'sup'
          ? !!(local.supersedesId && local.supersedesId === remote.supersedesId)
          : !!(local.targetId && local.targetId === remote.targetId);
        if (sameTarget) { adoptServer(local, remote); return 'adopted'; }
      }
      if (local.kind === 'stl' && remote.kind === 'stl' && local.targetId && local.targetId === remote.targetId) {
        const differ = local.settlesId !== remote.settlesId || local.amount !== remote.amount;
        const minted = differ && typeof mintId === 'function' ? mintId() : '';
        if (differ && !minted) return 'queued';
        adoptServer(local, remote);
        if (differ) linkRefusals.push({ localId: minted, doc: Object.assign({}, local) });
        return 'adopted';
      }
      return 'refused';
    }
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      if (seen.has(id)) continue;
      seen.add(id);
      if (parkedSet.has(id)) continue;
      const local = load(id);
      if (!local) { keepId(id); continue; }
      if (isSeed(local)) { syncId(id); continue; }
      if (!collectionFor(local)) { keepId(id); continue; }
      if (isAccountDoc(local)) {
        const pointers = parentPointers(local);
        const table = purposesTable();
        if (table && cashNeverJoins(local, table) && pointers.some(pointer => parkedSet.has(pointer))) { keepId(id); continue; }
        if (unresolved.size && (pointers.some(pointer => unresolved.has(pointer)) || (isSlotBody(local) && [...unresolved].some(slotId => {
          const root = load(slotId);
          return !!(root && local.agreementId && local.agreementId === root.agreementId && String(local.id).slice(-1) > String(slotId).slice(-1));
        })))) { keepId(id); continue; }
        if (pointers.some(pointer => failedSet.has(pointer))) {
          if (await failAccount(local) === 'auth') return pack(true);
          continue;
        }
        if (pointers.some(pointer => parkedSet.has(pointer))) { keepId(id); continue; }
        if (pointers.some(pointer => keptSet.has(pointer) || (!syncedSet.has(pointer) && ids.indexOf(pointer) > index))) { keepId(id); continue; }
      }
      try {
        await write(local);
        syncId(id);
      } catch (err) {
        const failure = /** @type {SyncFailure} */ (err);
        if (Status && Status.isDeadAuth(failure)) { keepId(id); return pack(true); }
        if (!Status || Status.isTransient(failure)) { keepId(id); continue; }
        if (isAccountDoc(local)) {
          if (isClientRefusal(failure) || typeof readDependency !== 'function') {
            if (await failAccount(local) === 'auth') return pack(true);
            continue;
          }
          /** @type {DependencyRead | undefined} */
          let own;
          try {
            own = await readDependency(/** @type {string} */ (local.id));
          } catch (readErr) {
            if (Status.isDeadAuth(/** @type {SyncFailure} */ (readErr))) { keepId(id); return pack(true); }
            const status = Status.dependencyStatus(/** @type {SyncFailure} */ (readErr), null);
            if (status === 'auth') { keepId(id); return pack(true); }
            if (status === 'denied') {
              if (await failAccount(local) === 'auth') return pack(true);
            } else keepId(id);
            continue;
          }
          const ownStatus = own && own.status;
          if (ownStatus === 'transient' || !ownStatus) { keepId(id); continue; }
          if (ownStatus === 'denied') {
            if (await failAccount(local) === 'auth') return pack(true);
            continue;
          }
          if (ownStatus === 'found') {
            const found = /** @type {{ status: 'found', doc: SyncDoc }} */ (own);
            const outcome = adoptFound(local, found.doc || {});
            if (outcome === 'queued') { keepId(id); continue; }
            if (outcome === 'refused') {
              if (local.docType === 'statementApproval') {
                failId(/** @type {string} */ (local.id), Status.failureMessage(failure, local, found.doc, false));
                continue;
              }
              if (await failAccount(local) === 'auth') return pack(true);
            }
            continue;
          }
          const pointers = parentPointers(local);
          if (!pointers.length) {
            if (await failAccount(local) === 'auth') return pack(true);
            continue;
          }
          /** @type {DependencyRead | undefined} */
          let pointer;
          try {
            pointer = await readDependency(pointers[0]);
          } catch (readErr) {
            if (Status.isDeadAuth(/** @type {SyncFailure} */ (readErr))) { keepId(id); return pack(true); }
            const status = Status.dependencyStatus(/** @type {SyncFailure} */ (readErr), null);
            if (status === 'auth') { keepId(id); return pack(true); }
            if (status === 'transient') { keepId(id); continue; }
            if (await failAccount(local) === 'auth') return pack(true);
            continue;
          }
          if (!pointer || pointer.status === 'transient') { keepId(id); continue; }
          if (await failAccount(local) === 'auth') return pack(true);
          continue;
        }
        let remote = null;
        let unverified = false;
        try {
          if (typeof readServer === 'function') remote = /** @type {SyncDoc | null} */ (await readServer(local));
          else if (typeof exists === 'function' && await exists(local)) unverified = true;
        } catch (readErr) {
          if (Status.isDeadAuth(/** @type {SyncFailure} */ (readErr))) { keepId(id); return pack(true); }
          if (Status.isTransient(/** @type {SyncFailure} */ (readErr))) { keepId(id); continue; }
          unverified = true;
        }
        if (remote && Status.sameContent(local, remote)) { syncId(id); continue; }
        if (remote && Status.sameReversal(local, remote)) {
          syncId(id);
          adopted.push({ id, remote });
          continue;
        }
        let message = Status.failureMessage(failure, local, remote, unverified && !remote);
        if (message === Status.REJECTED && local.entryType && typeof projectProbe === 'function') {
          /** @type {ProjectProbe | null} */
          let probe;
          try {
            probe = await projectProbe(local);
          } catch (probeErr) {
            if (Status.isDeadAuth(/** @type {SyncFailure} */ (probeErr))) { keepId(id); return pack(true); }
            probe = null;
          }
          const project = load(/** @type {string} */ (local.projectId));
          const neverSent = !!(project && !project.createdAtServer && project.id && synced.indexOf(project.id) === -1);
          message = Status.messageAfterProjectProbe(message, probe, neverSent);
        }
        failId(id, message);
      }
    }
    return pack(false);
  }

  return {
    isSeed, collectionFor, toRemote, withServerTime, fromRemote, mergeById, siteReads, pullChanges, flushOutbox,
    FOREMEN, FOREMAN_MOVES, usesPutIfMissing, foremanReads, pullForemen,
    contractAmountOf, withoutContractAmount, splitProjectSave, projectsForClient, financeReads, personInput,
    readSetKey, readSetChanged, stripMoney, termsPayload, subcontractReads, pullSubcontracts,
    exactProjectName, projectDeleteDocs, projectDeleteBatches, missingRequestedIds, dropProjectLocal,
    queueRefusal, localDoc, accountReads, pullAccounts, ACCOUNTS_MARK, slotLoserKey, slotLoserViews, linkRefusalViews,
  };
});
