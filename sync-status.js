// Classify outbox results and render the per-entry sync state.
// A rejected write is an error. An existing server document counts as synced
// only when its content matches the local entry.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SyncStatus = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const FB_VER = '13.1.0';
  const FIRESTORE_URL = 'https://www.gstatic.com/firebasejs/' + FB_VER + '/firebase-firestore.js';
  const REJECTED = 'رُفض الإرسال';
  const CONFLICT = 'القيد موجود على الخادم بمحتوى مختلف';
  const UNVERIFIED = 'القيد موجود مسبقاً وتعذر مطابقة محتواه';

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function norm(v) {
    return v == null ? '' : String(v);
  }

  function sameContent(local, remote) {
    if (!local || !remote) return false;
    const keys = ['projectId', 'direction', 'entryType', 'amount', 'currency', 'entryDate', 'isReversal', 'createdBy'];
    for (const k of keys) if (local[k] !== remote[k]) return false;
    if (norm(local.description) !== norm(remote.description)) return false;
    if (norm(local.partyName) !== norm(remote.partyName)) return false;
    if (local.isReversal || remote.isReversal) {
      if (norm(local.reversesEntryId) !== norm(remote.reversesEntryId)) return false;
    }
    if (local.id && remote.id && local.id !== remote.id) return false;
    return true;
  }

  function isTransient(err) {
    if (!err) return false;
    if (err.timeout) return true;
    const code = String(err.code || '');
    const msg = String(err.message || '');
    return code === 'unavailable'
      || code === 'deadline-exceeded'
      || code === 'resource-exhausted'
      || code === 'aborted'
      || code === 'cancelled'
      || /offline|network-request-failed|unavailable|deadline/i.test(code + ' ' + msg);
  }

  function isAlreadyExists(err) {
    const code = String((err && err.code) || '');
    const msg = String((err && err.message) || '');
    return code === 'already-exists' || /already exists/i.test(msg);
  }

  function failureMessage(err, local, remote, unverified) {
    if (remote && !sameContent(local, remote)) return CONFLICT;
    if (isAlreadyExists(err) || unverified) return UNVERIFIED;
    return REJECTED;
  }

  function applyFlush(outbox, errors, result) {
    const drop = new Set((result && result.synced) || []);
    const errMap = Object.assign({}, errors || {});
    ((result && result.synced) || []).forEach(id => { delete errMap[id]; });
    ((result && result.kept) || []).forEach(id => { delete errMap[id]; });
    ((result && result.failed) || []).forEach(row => { if (row && row.id) errMap[row.id] = row.message; });
    return {
      outbox: (outbox || []).filter(id => !drop.has(id)),
      errors: errMap,
    };
  }

  function badgeHtml(id, outboxIds, errors) {
    const message = errors && errors[id];
    if (message) {
      return '<span class="pill bad" data-sync="error" style="font-size:11px">' + escapeHtml(message) + '</span>';
    }
    if ((outboxIds || []).indexOf(id) !== -1) {
      return '<span class="pill warn" data-sync="pending" style="font-size:11px">لم يُرسل</span>';
    }
    return '';
  }

  async function readRemote(db, collectionName, id, importSdk) {
    const load = importSdk || (url => import(url));
    const fsMod = await load(FIRESTORE_URL);
    const snap = await fsMod.getDocFromServer(fsMod.doc(db, collectionName, id));
    return snap.exists() ? snap.data() : null;
  }

  return {
    FB_VER, FIRESTORE_URL, REJECTED, CONFLICT, UNVERIFIED,
    sameContent, isTransient, isAlreadyExists, failureMessage,
    applyFlush, badgeHtml, readRemote,
  };
});
