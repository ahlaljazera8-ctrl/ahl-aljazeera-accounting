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

  /** @param {SyncDoc} doc @returns {SyncDoc} */
  function toRemote(doc) {
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
    /** @type {Record<string, unknown>} */
    const syncErrors = Object.assign({}, src.syncErrors || {});
    removed.forEach(id => { delete syncErrors[id]; });
    const outbox = (src.outbox || []).filter(id => !removed.has(id));
    const statusPending = (src.statusPending || []).filter(id => id !== projectId);
    const foremen = (src.foremen || []).slice();
    const foremanMoves = (src.foremanMoves || []).slice();
    return {
      entries, projects, subcontracts, amendments, finance, terms, outbox, syncErrors, statusPending, foremen, foremanMoves, goneProjectNames,
      removed: { projectIds: removedProjectIds, entryIds: removedEntryIds },
    };
  }

  /** @param {FlushCall} opts */
  async function flushOutbox({ ids, load, write, exists, readServer, projectProbe }) {
    const Status = statusApi();
    /** @type {string[]} */
    const synced = [];
    /** @type {string[]} */
    const kept = [];
    /** @type {{ id: string, message: string }[]} */
    const failed = [];
    /** @type {{ id: string, remote: SyncDoc }[]} */
    const adopted = [];
    const seen = new Set();
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      const local = load(id);
      if (!local) { kept.push(id); continue; }
      if (isSeed(local)) { synced.push(id); continue; }
      if (!collectionFor(local)) { kept.push(id); continue; }
      try {
        await write(local);
        synced.push(id);
      } catch (err) {
        if (Status && Status.isDeadAuth(/** @type {SyncFailure} */ (err))) {
          kept.push(id);
          return { synced, kept, failed, adopted, authDead: true };
        }
        if (!Status || Status.isTransient(/** @type {SyncFailure} */ (err))) { kept.push(id); continue; }
        let remote = null;
        let unverified = false;
        try {
          if (typeof readServer === 'function') remote = /** @type {SyncDoc | null} */ (await readServer(local));
          else if (typeof exists === 'function' && await exists(local)) unverified = true;
        } catch (readErr) {
          if (Status.isDeadAuth(/** @type {SyncFailure} */ (readErr))) {
            kept.push(id);
            return { synced, kept, failed, adopted, authDead: true };
          }
          if (Status.isTransient(/** @type {SyncFailure} */ (readErr))) { kept.push(id); continue; }
          unverified = true;
        }
        if (remote && Status.sameContent(local, remote)) { synced.push(id); continue; }
        if (remote && Status.sameReversal(local, remote)) {
          synced.push(id);
          adopted.push({ id, remote });
          continue;
        }
        let message = Status.failureMessage(/** @type {SyncFailure} */ (err), local, remote, unverified && !remote);
        if (message === Status.REJECTED && local.entryType && typeof projectProbe === 'function') {
          /** @type {ProjectProbe | null} */
          let probe;
          try {
            probe = await projectProbe(local);
          } catch (probeErr) {
            if (Status.isDeadAuth(/** @type {SyncFailure} */ (probeErr))) {
              kept.push(id);
              return { synced, kept, failed, adopted, authDead: true };
            }
            probe = null;
          }
          const project = load(/** @type {string} */ (local.projectId));
          const neverSent = !!(project && !project.createdAtServer && project.id && synced.indexOf(project.id) === -1);
          message = Status.messageAfterProjectProbe(message, probe, neverSent);
        }
        failed.push({ id, message });
      }
    }
    return { synced, kept, failed, adopted, authDead: false };
  }

  return {
    isSeed, collectionFor, toRemote, withServerTime, fromRemote, mergeById, siteReads, pullChanges, flushOutbox,
    FOREMEN, FOREMAN_MOVES, usesPutIfMissing, foremanReads, pullForemen,
    contractAmountOf, withoutContractAmount, splitProjectSave, projectsForClient, financeReads, personInput,
    readSetKey, readSetChanged, stripMoney, termsPayload, subcontractReads, pullSubcontracts,
    exactProjectName, projectDeleteDocs, projectDeleteBatches, missingRequestedIds, dropProjectLocal,
  };
});
