// Firebase App Check with the free reCAPTCHA v3 provider.
// Enforcement is a console setting and is intentionally not turned on here.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AppCheck = factory();
})(typeof self !== 'undefined' ? self : /** @type {Window} */ (/** @type {unknown} */ (this)), /** @returns {AppCheckApi} */ function () {
  'use strict';

  const FB_VER = '13.1.0';
  const SDK_URL = 'https://www.gstatic.com/firebasejs/' + FB_VER + '/firebase-app-check.js';
  const PLACEHOLDER = 'REPLACE_WITH_RECAPTCHA_V3_SITE_KEY';

  /**
   * @param {unknown} siteKey
   * @returns {siteKey is string}
   */
  function siteKeyReady(siteKey) {
    if (typeof siteKey !== 'string') return false;
    const key = siteKey.trim();
    if (!key || key === PLACEHOLDER || key.indexOf('REPLACE_WITH_') === 0) return false;
    return true;
  }

  /**
   * @param {string} url
   * @returns {Promise<unknown>}
   */
  function loadAppCheckSdk(url) {
    return import(url);
  }

  /**
   * @param {unknown} app
   * @param {unknown} siteKey
   * @param {unknown} [importSdk]
   * @returns {Promise<AppCheckHandle | null>}
   */
  async function initAppCheck(app, siteKey, importSdk) {
    if (!siteKeyReady(siteKey)) return null;
    const load = /** @type {(url: string) => Promise<unknown>} */ (importSdk || loadAppCheckSdk);
    const sdk = /** @type {AppCheckSdk} */ (await load(SDK_URL));
    return sdk.initializeAppCheck(app, {
      provider: new sdk.ReCaptchaV3Provider(siteKey.trim()),
      isTokenAutoRefreshEnabled: true,
    });
  }

  return { FB_VER, SDK_URL, PLACEHOLDER, siteKeyReady, initAppCheck };
});
