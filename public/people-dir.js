// People-directory load policy. No DOM and no Firebase import.
// The caller reads and writes K.users. A failed load never writes it.
(function (factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(globalThis, { PeopleDir: api });
})(/** @returns {PeopleDirApi} */ function () {
  'use strict';

  const TIMEOUT_MS = 8000;
  const COOLDOWN_MS = 8000;
  const SUCCESS_TTL_MS = 30000;
  const OFFLINE_LEAD = 'غير متصل';
  const UPDATE_LEAD = 'تعذّر التحديث';
  const LOAD_ERROR = 'تعذّر تحميل الأشخاص. تحقّق من الاتصال.';
  const RETRY_LABEL = 'إعادة المحاولة';
  const RENDER_ERROR = 'حدث خطأ في العرض. أعد فتح الصفحة.';

  /**
   * @param {PeopleRow | null | undefined} row
   * @returns {string}
   */
  function personKey(row) {
    if (!row || typeof row.uid !== 'string' || row.uid === '') return '';
    const ids = Array.isArray(row.assignedProjectIds) ? row.assignedProjectIds.map(id => String(id)).sort() : [];
    return [
      row.uid,
      row.displayName == null ? '' : String(row.displayName),
      row.email == null ? '' : String(row.email),
      row.role == null ? '' : String(row.role),
      row.active ? '1' : '0',
      ids.join('\u0001'),
    ].join('\u0002');
  }

  /**
   * @param {readonly PeopleRow[] | null | undefined} list
   * @returns {string[]}
   */
  function peopleKeys(list) {
    return (Array.isArray(list) ? list : []).map(personKey).filter(key => key !== '').sort();
  }

  /**
   * Shown fields only: uid, displayName, email, role, active, assignedProjectIds.
   * Order of people and of project ids does not count. Other fields do not count.
   * @param {readonly PeopleRow[] | null | undefined} a
   * @param {readonly PeopleRow[] | null | undefined} b
   */
  function samePeople(a, b) {
    const left = peopleKeys(a);
    const right = peopleKeys(b);
    if (left.length !== right.length) return false;
    for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) return false;
    return true;
  }

  /**
   * @param {PeopleLoadState | null | undefined} state
   * @param {number} now
   * @param {string} reason
   * @returns {'inflight' | 'offline' | 'cooldown' | 'fresh' | 'start'}
   */
  function loadPlan(state, now, reason) {
    const s = state || {};
    if (s.inflight) return 'inflight';
    if (reason === 'retry') return 'start';
    if (!s.online) return 'offline';
    if (reason === 'online' || reason === 'save') return 'start';
    if (s.failedAt && now - s.failedAt < COOLDOWN_MS) return 'cooldown';
    if (!s.failedAt && s.syncedAt && now - s.syncedAt < SUCCESS_TTL_MS) return 'fresh';
    return 'start';
  }

  /**
   * An empty list keeps a retry even when a stamp is stored.
   * A non-empty list keeps the note. A live load shows the rows.
   * @param {number} count
   * @param {number} stamp
   * @param {boolean} offline
   * @param {boolean} failed
   * @returns {'ready' | 'note' | 'retry' | 'error'}
   */
  function directoryView(count, stamp, offline, failed) {
    if (!offline && !failed) return 'ready';
    if (count > 0) return 'note';
    if (stamp > 0) return 'retry';
    return 'error';
  }

  /**
   * Offline keeps «غير متصل». An online refresh that failed keeps «تعذّر التحديث».
   * @param {boolean} offline
   * @param {boolean} failed
   * @returns {string}
   */
  function syncNoteLead(offline, failed) {
    if (offline) return OFFLINE_LEAD;
    if (failed) return UPDATE_LEAD;
    return '';
  }

  /**
   * @param {string} lead
   * @param {string} time
   * @returns {string}
   */
  function syncNote(lead, time) {
    return lead + ' · آخر تحديث: ' + (time || '—');
  }

  /**
   * @param {number} token
   * @param {number} current
   */
  function acceptGeneration(token, current) {
    return token === current;
  }

  /**
   * @param {number} token
   * @param {number} current
   * @param {readonly PeopleRow[] | null | undefined} prev
   * @param {readonly PeopleRow[] | null | undefined} rows
   * @returns {PeopleApply}
   */
  function applyPeople(token, current, prev, rows) {
    const prior = Array.isArray(prev) ? prev.slice() : [];
    if (!acceptGeneration(token, current)) return { stale: true, next: prior, changed: false };
    const nextRows = Array.isArray(rows) ? rows.slice() : [];
    const changed = !samePeople(prior, nextRows);
    return { stale: false, next: changed ? nextRows : prior, changed: changed };
  }

  /**
   * A settled refresh redraws when the directory changed.
   * An identical directory redraws only when the offline note or the error card is up,
   * so that note can leave. A skipped plan never redraws.
   * @param {PeopleLoadResult | null | undefined} result
   * @param {boolean} [bannerShowing]
   */
  function shouldRedraw(result, bannerShowing) {
    if (!result || result.stale === true || result.skipped) return false;
    if (result.changed === true) return true;
    return bannerShowing === true;
  }

  /**
   * @param {PeopleLoaderDeps} deps
   * @returns {PeopleLoader}
   */
  function createLoader(deps) {
    let generation = 0;
    /** @type {Promise<PeopleLoadResult> | null} */
    let inflight = null;
    let failedAt = 0;
    let syncedAt = 0;
    const timeoutMs = deps.timeoutMs || TIMEOUT_MS;

    function retireInflight() {
      generation += 1;
      inflight = null;
    }

    /**
     * @param {string} [reason]
     * @returns {Promise<PeopleLoadResult>}
     */
    function run(reason) {
      const why = reason || 'render';
      if (why === 'save' && inflight) retireInflight();
      const plan = loadPlan({
        inflight: inflight !== null,
        failedAt: failedAt,
        syncedAt: syncedAt,
        online: deps.online() === true,
      }, deps.now(), why);
      if (plan === 'inflight' && inflight) return inflight;
      if (plan !== 'start') return Promise.resolve({ skipped: plan, changed: false });
      const token = ++generation;
      const pending = deps.load();
      const job = deps.timeout(Promise.resolve(pending), timeoutMs).then(rows => {
        if (!acceptGeneration(token, generation)) return { stale: true, changed: false };
        const applied = applyPeople(token, generation, deps.read(), /** @type {PeopleRow[] | null | undefined} */ (rows));
        if (applied.stale) return { stale: true, changed: false };
        if (applied.changed) deps.write(applied.next);
        syncedAt = deps.now();
        deps.stamp(syncedAt);
        failedAt = 0;
        return { stale: false, changed: applied.changed };
      }).catch(err => {
        if (acceptGeneration(token, generation)) failedAt = deps.now();
        throw err;
      });
      const tracked = job.finally(() => {
        if (inflight === tracked) inflight = null;
      });
      inflight = tracked;
      return tracked;
    }

    function failed() { return failedAt > 0; }

    function reset() {
      generation += 1;
      failedAt = 0;
      syncedAt = 0;
      inflight = null;
    }

    return { run, failed, reset };
  }

  return {
    TIMEOUT_MS, COOLDOWN_MS, SUCCESS_TTL_MS,
    OFFLINE_LEAD, UPDATE_LEAD, LOAD_ERROR, RETRY_LABEL, RENDER_ERROR,
    samePeople, loadPlan, directoryView, syncNoteLead, syncNote, acceptGeneration, applyPeople, shouldRedraw, createLoader,
  };
});
