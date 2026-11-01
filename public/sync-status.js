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

  // The reversal id is rev_ + the original id, so a second device that loses
  // the race is the same correction. The server row is the one that landed.
  function sameReversal(local, remote) {
    if (!local || !remote || local.isReversal !== true || remote.isReversal !== true) return false;
    if (local.id && remote.id && local.id !== remote.id) return false;
    const orig = norm(local.reversesEntryId);
    return orig !== '' && orig === norm(remote.reversesEntryId);
  }

  function sameContent(local, remote) {
    if (!local || !remote) return false;
    if (!local.entryType && !(local.currency && local.name)) return false;
    const keys = ['projectId', 'direction', 'entryType', 'amount', 'currency', 'entryDate', 'isReversal', 'createdBy'];
    for (const k of keys) if (local[k] !== remote[k]) return false;
    if (norm(local.description) !== norm(remote.description)) return false;
    if (norm(local.partyName) !== norm(remote.partyName)) return false;
    if (norm(local.createdByName) !== norm(remote.createdByName)) return false;
    if (norm(local.subcontractId) !== norm(remote.subcontractId)) return false;
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

  // The refresh token was revoked or the access token can no longer be renewed.
  // This is not a rules rejection and not a network blip: the entry must stay queued.
  function isDeadAuth(err) {
    if (!err) return false;
    const code = String(err.code || '');
    const blob = code + ' ' + String(err.message || '');
    if (code === 'auth/user-token-expired'
      || code === 'auth/invalid-user-token'
      || code === 'auth/invalid-refresh-token'
      || code === 'auth/user-disabled') return true;
    return /auth\/user-token-expired|auth\/invalid-user-token|auth\/invalid-refresh-token|auth\/user-disabled|INVALID_REFRESH_TOKEN|TOKEN_EXPIRED|user-token-expired/i.test(blob);
  }

  function failureMessage(err, local, remote, unverified) {
    if (remote && !sameContent(local, remote)) return CONFLICT;
    if (isAlreadyExists(err) || unverified) return UNVERIFIED;
    return REJECTED;
  }

  function applyFlush(outbox, errors, result) {
    const drop = new Set((result && result.synced) || []);
    ((result && result.failed) || []).forEach(row => { if (row && row.id) drop.add(row.id); });
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
    sameContent, sameReversal, isTransient, isAlreadyExists, isDeadAuth, failureMessage,
    applyFlush, badgeHtml, readRemote,
  };
});
