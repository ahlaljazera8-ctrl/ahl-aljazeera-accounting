// Escape and validate ids before they are placed in HTML attributes.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DomSafe = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

  function escapeHtml(s) {
    return String(s ?? '').replace(
      /[&<>"']/g,
      c =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[c],
    );
  }

  function isSafeId(id) {
    return typeof id === 'string' && ID_RE.test(id);
  }

  function projectAttr(id) {
    return isSafeId(id) ? escapeHtml(id) : '';
  }

  function projectHref(kind, id) {
    if ((kind !== 'project' && kind !== 'entry' && kind !== 'entries') || !isSafeId(id)) return '#projects';
    return '#' + kind + '/' + escapeHtml(id);
  }

  function entryHref(id) {
    if (!isSafeId(id)) return '#home';
    return '#detail/' + escapeHtml(id);
  }

  function projectButton(id, name, selected) {
    const attr = projectAttr(id);
    if (!attr) return '';
    return (
      '<button class="' +
      (selected ? 'pill on' : 'pill') +
      '" data-proj="' +
      attr +
      '">' +
      escapeHtml(name) +
      '</button>'
    );
  }

  return { ID_RE, escapeHtml, isSafeId, projectAttr, projectHref, projectButton, entryHref };
});
