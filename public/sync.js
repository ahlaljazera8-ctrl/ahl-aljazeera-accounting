// Outbox flush. No DOM and no Firebase import: the caller performs the write.
// The outbox is a list of ids. There is no syncState field.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Sync = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function isSeed(doc) {
    return !!(
      doc &&
      (doc.isExample === true || doc.deviceId === 'seed' || String(doc.id || '').indexOf('seed-') === 0)
    );
  }

  function collectionFor(doc) {
    if (!doc) return null;
    if (doc.entryType) return 'ledgerEntries';
    if (typeof doc.name === 'string' && doc.currency) return 'projects';
    if (typeof doc.agreedOn === 'string' && doc.projectId && !doc.currency) return 'subcontracts';
    if (doc.subcontractId && doc.date && !doc.entryType) return 'subcontractAmendments';
    return null;
  }

  function copyFields(doc, keys) {
    const out = {};
    keys.forEach(function (k) {
      if (doc[k] !== undefined && doc[k] !== null) out[k] = doc[k];
    });
    return out;
  }

  function toRemote(doc) {
    if (doc.entryType) {
      const out = copyFields(doc, [
        'id',
        'projectId',
        'direction',
        'entryType',
        'amount',
        'currency',
        'entryDate',
        'isReversal',
        'createdAtDevice',
        'createdBy',
        'deviceId',
      ]);
      if (doc.description) out.description = doc.description;
      if (doc.partyName) out.partyName = doc.partyName;
      if (doc.createdByName) out.createdByName = doc.createdByName;
      if (doc.isReversal) {
        out.reversesEntryId = doc.reversesEntryId;
        out.reversalReason = doc.reversalReason;
      }
      if (doc.entryType === 'subcontractor' && doc.subcontractId) out.subcontractId = doc.subcontractId;
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
    const out = copyFields(doc, [
      'id',
      'name',
      'clientName',
      'currency',
      'status',
      'createdAtDevice',
      'createdBy',
      'deviceId',
    ]);
    if (doc.location) out.location = doc.location;
    return out;
  }

  const MAX_CONTRACT = 10000000000;
  const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

  function contractAmountOf(doc) {
    if (!doc || !Number.isInteger(doc.contractAmount)) return null;
    if (doc.contractAmount < 0 || doc.contractAmount > MAX_CONTRACT) return null;
    return doc.contractAmount;
  }

  function withoutContractAmount(doc) {
    if (!doc || !Object.prototype.hasOwnProperty.call(doc, 'contractAmount')) return doc;
    const out = Object.assign({}, doc);
    delete out.contractAmount;
    return out;
  }

  // Owner save: the number moves to projectFinance and is not part of the project write.
  function splitProjectSave(project, amount) {
    const chosen = Number.isInteger(amount) ? amount : contractAmountOf(project);
    const next = withoutContractAmount(project || {});
    if (!Number.isInteger(chosen) || chosen < 0 || chosen > MAX_CONTRACT) return { project: next, finance: null };
    return { project: next, finance: { contractAmount: chosen } };
  }

  function projectsForClient(user, projects) {
    const rows = projects || [];
    if (user && user.role === 'owner') return rows.map(row => Object.assign({}, row));
    return rows.map(withoutContractAmount);
  }

  function financeReads(user, projectIds) {
    if (!user || user.role !== 'owner' || user.active !== true) return [];
    return validProjectIds(projectIds).map(id => ({ collection: 'projectFinance', id }));
  }

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

  function termsPayload(amount) {
    if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_CONTRACT) return null;
    return { originalAmount: amount };
  }

  // Owner reads names and amendments. A site user reads names on assigned projects only, never terms or amendments.
  function subcontractReads(user, since) {
    if (!user || user.active !== true) return [];
    if (user.role === 'owner') {
      return sinceClause(
        [
          { collection: 'subcontracts', where: [] },
          { collection: 'subcontractAmendments', where: [] },
        ],
        since,
      );
    }
    if (user.role !== 'site') return [];
    return validProjectIds(user.assignedProjectIds).map(id => ({
      collection: 'subcontracts',
      where: [['projectId', '==', id]],
    }));
  }

  async function pullSubcontracts(opts) {
    const specs = subcontractReads(opts.user, opts.since);
    if (!specs.length) return { subcontracts: [], amendments: [], watermark: finiteMillis(opts.since) };
    const rows = await readSpecs(specs, opts.read);
    const subcontracts = [];
    const amendments = [];
    rows.forEach(row => {
      if (!row) return;
      if (row.agreedOn && !row.entryType && !row.currency) subcontracts.push(stripMoney(row));
      else if (row.subcontractId && row.date) amendments.push(row);
    });
    return {
      subcontracts,
      amendments,
      watermark: nextWatermark(opts.since, subcontracts.concat(amendments)),
    };
  }

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
    if (!ids || ids.length > 20 || ids.some(id => typeof id !== 'string' || !ID_RE.test(id)))
      errors.push('اختر مشاريع محددة بحد أقصى 20');
    if (errors.length) return { ok: false, errors };
    return {
      ok: true,
      value: { uid, displayName, email, role: src.role, active: src.active, assignedProjectIds: ids.slice() },
    };
  }

  function withServerTime(doc, sentinel) {
    const data = toRemote(doc);
    data.createdAtServer = sentinel;
    return data;
  }

  function fromRemote(data) {
    const out = Object.assign({}, data);
    const ts = out.createdAtServer;
    if (ts && typeof ts.toMillis === 'function') out.createdAtServer = ts.toMillis();
    else if (ts && typeof ts.seconds === 'number')
      out.createdAtServer = ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6);
    return out;
  }

  function mergeById(local, incoming, pendingIds) {
    const pending = new Set(pendingIds || []);
    const map = new Map();
    (local || []).forEach(function (row) {
      if (row && row.id) map.set(row.id, row);
    });
    (incoming || []).forEach(function (row) {
      if (!row || !row.id || pending.has(row.id)) return;
      map.set(row.id, row);
    });
    return Array.from(map.values());
  }

  function validProjectIds(ids) {
    return (ids || []).filter(id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id));
  }

  // What a pull is allowed to read. A display-name edit does not change it.
  // An assignment, role, or active-flag change does: the old watermark was
  // measured on a different set, and an incremental query would skip history.
  function readSetKey(user) {
    const ids = validProjectIds(user && user.assignedProjectIds)
      .slice()
      .sort();
    const role = user && user.role === 'owner' ? 'owner' : 'site';
    return role + '\n' + (user && user.active === true ? '1' : '0') + '\n' + ids.join('\n');
  }
  function readSetChanged(prev, next) {
    return readSetKey(prev) !== readSetKey(next);
  }

  function finiteMillis(v) {
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  }

  // Queries a site client is allowed to run. Rules are not a filter.
  // Own rows are limited to assigned projects (F11); an unconstrained createdBy query is denied.
  function siteReads(uid, projectIds) {
    const reads = [];
    const ids = validProjectIds(projectIds);
    for (let i = 0; i < ids.length; i += 10) {
      const chunk = ids.slice(i, i + 10);
      reads.push({
        collection: 'ledgerEntries',
        where: [
          ['direction', '==', 'expense'],
          ['projectId', 'in', chunk],
        ],
      });
      reads.push({
        collection: 'ledgerEntries',
        where: [
          ['createdBy', '==', uid],
          ['projectId', 'in', chunk],
        ],
      });
    }
    return reads;
  }

  // First sync (since == null) reads the whole allowed set. Later syncs add
  // createdAtServer >= watermark. The inclusive bound re-reads the last instant;
  // mergeById drops ids already stored, and a strict > would skip a row that
  // shares that server time. Null createdAtServer (still offline) is not a bound.
  function sinceClause(specs, since) {
    const ms = finiteMillis(since);
    if (ms === null) return specs;
    return specs.map(spec =>
      spec.id
        ? spec
        : {
            collection: spec.collection,
            where: (spec.where || []).concat([['createdAtServer', '>=', ms]]),
          },
    );
  }

  function entryReads(user, since) {
    const specs =
      user && user.role === 'owner'
        ? [{ collection: 'ledgerEntries', where: [] }]
        : siteReads(user && user.uid, user && user.assignedProjectIds);
    return sinceClause(specs, since);
  }

  function projectReads(user, since) {
    if (user && user.role === 'owner') return sinceClause([{ collection: 'projects', where: [] }], since);
    return validProjectIds(user && user.assignedProjectIds).map(id => ({ collection: 'projects', id }));
  }

  function nextWatermark(previous, rows) {
    let max = finiteMillis(previous);
    (rows || []).forEach(row => {
      const t = finiteMillis(row && row.createdAtServer);
      if (t !== null && (max === null || t > max)) max = t;
    });
    return max;
  }

  function isBounded(specs) {
    return (specs || []).some(spec => (spec.where || []).some(part => part[0] === 'createdAtServer'));
  }

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
      watermark: advance
        ? {
            entries: nextWatermark(mark.entries, incoming),
            projects: nextWatermark(mark.projects, projects),
          }
        : {
            entries: finiteMillis(mark.entries),
            projects: finiteMillis(mark.projects),
          },
      missingProjectIds: missingRequestedIds(projectSpecs, projects),
    };
  }

  function statusApi() {
    if (typeof require === 'function') {
      try {
        return require('./sync-status.js');
      } catch (e) {}
    }
    const g = typeof globalThis !== 'undefined' ? globalThis : {};
    return g.SyncStatus || null;
  }

  function exactProjectName(typed, name) {
    return typeof name === 'string' && name.length > 0 && typeof typed === 'string' && typed === name;
  }

  // The project document is its own first batch. Later batches delete children
  // only after that document is gone, which is what the rules require.
  // Terms batches stay small: each terms delete may read its subcontract.
  function projectDeleteDocs(projectId, found) {
    if (!ID_RE.test(projectId || '')) return [];
    const src = found || {};
    const docs = [{ collection: 'projects', id: projectId }];
    const add = (collection, id) => {
      if (!ID_RE.test(id || '')) return;
      if (docs.some(row => row.collection === collection && row.id === id)) return;
      docs.push({ collection, id });
    };
    (src.entryIds || []).forEach(id => add('ledgerEntries', id));
    (src.subcontractIds || []).forEach(id => add('subcontracts', id));
    (src.amendmentIds || []).forEach(id => add('subcontractAmendments', id));
    (src.termIds || []).forEach(id => add('subcontractTerms', id));
    if (src.finance) add('projectFinance', projectId);
    return docs;
  }

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

  function missingRequestedIds(specs, rows) {
    const found = new Set();
    (rows || []).forEach(row => {
      if (row && row.id) found.add(row.id);
    });
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
  function dropProjectLocal(store, projectId, opts) {
    const src = store || {};
    const dropPending = !!(opts && opts.dropPending);
    const pending = new Set(dropPending ? [] : src.outbox || []);
    const errors = src.syncErrors || {};
    const subIds = new Set(
      (src.subcontracts || []).filter(row => row && row.projectId === projectId).map(row => row.id),
    );
    const removed = new Set([projectId]);
    // Another phone keeps a row that is still queued or already refused, so the
    // bell can show the rejection. The deleting phone drops those too.
    const keep = row => row && !dropPending && (pending.has(row.id) || !!errors[row.id]);
    const entries = (src.entries || []).filter(row => {
      if (!row || row.projectId !== projectId) return true;
      if (keep(row)) return true;
      removed.add(row.id);
      return false;
    });
    const amendments = (src.amendments || []).filter(row => {
      if (!row || (row.projectId !== projectId && !subIds.has(row.subcontractId))) return true;
      if (keep(row)) return true;
      removed.add(row.id);
      return false;
    });
    const subcontracts = (src.subcontracts || []).filter(row => {
      if (!row || row.projectId !== projectId) return true;
      if (keep(row)) return true;
      removed.add(row.id);
      return false;
    });
    const keptSubs = new Set(subcontracts.filter(row => row && row.projectId === projectId).map(row => row.id));
    const terms = Object.assign({}, src.terms || {});
    subIds.forEach(id => {
      if (!keptSubs.has(id)) delete terms[id];
    });
    const finance = Object.assign({}, src.finance || {});
    delete finance[projectId];
    const projects = (src.projects || []).filter(row => !row || row.id !== projectId);
    const syncErrors = Object.assign({}, src.syncErrors || {});
    removed.forEach(id => {
      delete syncErrors[id];
    });
    const outbox = (src.outbox || []).filter(id => !removed.has(id));
    const statusPending = (src.statusPending || []).filter(id => id !== projectId);
    return { entries, projects, subcontracts, amendments, finance, terms, outbox, syncErrors, statusPending };
  }

  /**
   * @param {{ ids: any[], load: (id: any) => any, write: (local: any) => any, exists?: (local: any) => any, readServer?: (local: any) => any }} opts
   */
  async function flushOutbox({ ids, load, write, exists, readServer }) {
    const Status = statusApi();
    const synced = [];
    const kept = [];
    const failed = [];
    const adopted = [];
    const seen = new Set();
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      const local = load(id);
      if (!local) {
        kept.push(id);
        continue;
      }
      if (isSeed(local)) {
        synced.push(id);
        continue;
      }
      if (!collectionFor(local)) {
        kept.push(id);
        continue;
      }
      try {
        await write(local);
        synced.push(id);
      } catch (err) {
        if (Status && Status.isDeadAuth(err)) {
          kept.push(id);
          return { synced, kept, failed, adopted, authDead: true };
        }
        if (!Status || Status.isTransient(err)) {
          kept.push(id);
          continue;
        }
        let remote = null;
        let unverified = false;
        try {
          if (typeof readServer === 'function') remote = await readServer(local);
          else if (typeof exists === 'function' && (await exists(local))) unverified = true;
        } catch (readErr) {
          if (Status.isDeadAuth(readErr)) {
            kept.push(id);
            return { synced, kept, failed, adopted, authDead: true };
          }
          if (Status.isTransient(readErr)) {
            kept.push(id);
            continue;
          }
          unverified = true;
        }
        if (remote && Status.sameContent(local, remote)) {
          synced.push(id);
          continue;
        }
        if (remote && Status.sameReversal(local, remote)) {
          synced.push(id);
          adopted.push({ id, remote });
          continue;
        }
        failed.push({ id, message: Status.failureMessage(err, local, remote, unverified && !remote) });
      }
    }
    return { synced, kept, failed, adopted, authDead: false };
  }

  return {
    isSeed,
    collectionFor,
    toRemote,
    withServerTime,
    fromRemote,
    mergeById,
    siteReads,
    pullChanges,
    flushOutbox,
    contractAmountOf,
    withoutContractAmount,
    splitProjectSave,
    projectsForClient,
    financeReads,
    personInput,
    readSetKey,
    readSetChanged,
    stripMoney,
    termsPayload,
    subcontractReads,
    pullSubcontracts,
    exactProjectName,
    projectDeleteDocs,
    projectDeleteBatches,
    missingRequestedIds,
    dropProjectLocal,
  };
});
