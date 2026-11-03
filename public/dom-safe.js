// Escape and validate ids before they are placed in HTML attributes.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DomSafe = factory();
})(typeof self !== 'undefined' ? self : /** @type {Window} */ (/** @type {unknown} */ (this)), /** @returns {DomSafeApi} */ function () {
  'use strict';

  const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

  /**
   * @param {unknown} value
   * @returns {string}
   */
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => {
      const entities = {
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      };
      return entities[/** @type {'&' | '<' | '>' | '"' | "'"} */ (ch)];
    });
  }

  /**
   * @param {unknown} id
   * @returns {boolean}
   */
  function isSafeId(id) {
    return typeof id === 'string' && ID_RE.test(id);
  }

  /**
   * @param {unknown} id
   * @returns {string}
   */
  function projectAttr(id) {
    return isSafeId(id) ? escapeHtml(id) : '';
  }

  /**
   * @param {unknown} kind
   * @param {unknown} id
   * @returns {string}
   */
  function projectHref(kind, id) {
    if ((kind !== 'project' && kind !== 'entry' && kind !== 'entries') || !isSafeId(id)) return '#projects';
    return '#' + kind + '/' + escapeHtml(id);
  }

  /**
   * @param {unknown} id
   * @returns {string}
   */
  function entryHref(id) {
    if (!isSafeId(id)) return '#home';
    return '#detail/' + escapeHtml(id);
  }

  /**
   * @param {unknown} id
   * @param {unknown} name
   * @param {boolean} selected
   * @returns {string}
   */
  function projectButton(id, name, selected) {
    const attr = projectAttr(id);
    if (!attr) return '';
    return '<button class="' + (selected ? 'pill on' : 'pill') + '" data-proj="' + attr + '">' + escapeHtml(name) + '</button>';
  }

  return { ID_RE, escapeHtml, isSafeId, projectAttr, projectHref, projectButton, entryHref };
});
