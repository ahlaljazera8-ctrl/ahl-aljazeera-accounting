// Outbox flush. No DOM and no Firebase import: the caller performs the write.
// The outbox is a list of ids. There is no syncState field.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Sync = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function isSeed(doc) {
    return !!(doc && (doc.isExample === true || doc.deviceId === 'seed' || String(doc.id || '').indexOf('seed-') === 0));
  }

  function collectionFor(doc) {
    if (!doc) return null;
    if (doc.entryType) return 'ledgerEntries';
    if (typeof doc.name === 'string' && doc.currency) return 'projects';
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
      const out = copyFields(doc, ['id', 'projectId', 'direction', 'entryType', 'amount', 'currency', 'entryDate', 'isReversal', 'createdAtDevice', 'createdBy', 'deviceId']);
      if (doc.description) out.description = doc.description;
      if (doc.partyName) out.partyName = doc.partyName;
      if (doc.isReversal) {
        out.reversesEntryId = doc.reversesEntryId;
        out.reversalReason = doc.reversalReason;
      }
      return out;
    }
    const out = copyFields(doc, ['id', 'name', 'clientName', 'currency', 'status', 'createdAtDevice', 'createdBy', 'deviceId']);
    if (doc.location) out.location = doc.location;
    if (typeof doc.contractAmount === 'number') out.contractAmount = doc.contractAmount;
    return out;
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
    else if (ts && typeof ts.seconds === 'number') out.createdAtServer = ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6);
    return out;
  }

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

  // Queries a site client is allowed to run. Rules are not a filter.
  function siteReads(uid, projectIds) {
    const reads = [{ collection: 'ledgerEntries', where: [['createdBy', '==', uid]] }];
    const ids = (projectIds || []).filter(Boolean);
    for (let i = 0; i < ids.length; i += 10) {
      reads.push({
        collection: 'ledgerEntries',
        where: [['direction', '==', 'expense'], ['projectId', 'in', ids.slice(i, i + 10)]],
      });
    }
    return reads;
  }

  async function flushOutbox({ ids, load, write, exists }) {
    const synced = [];
    const kept = [];
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
        let there = false;
        try { there = await exists(local); } catch (e) { there = false; }
        if (there) synced.push(id);
        else kept.push(id);
      }
    }
    return { synced, kept };
  }

  return { isSeed, collectionFor, toRemote, withServerTime, fromRemote, mergeById, siteReads, flushOutbox };
});
