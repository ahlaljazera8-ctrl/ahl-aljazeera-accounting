const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const AppCheck = require('../appcheck.js');

test('a placeholder or empty site key does not initialize App Check', async () => {
  let calls = 0;
  const importer = async () => { calls += 1; return {}; };
  assert.equal(await AppCheck.initAppCheck({ name: 'app' }, '', importer), null);
  assert.equal(await AppCheck.initAppCheck({ name: 'app' }, AppCheck.PLACEHOLDER, importer), null);
  assert.equal(await AppCheck.initAppCheck({ name: 'app' }, '  REPLACE_WITH_RECAPTCHA_V3_SITE_KEY  ', importer), null);
  assert.equal(calls, 0);
});

test('a site key loads reCAPTCHA v3 App Check from gstatic 13.1.0 and does not enable enforcement', async () => {
  let url = '';
  let seen = null;
  const app = { name: 'ledger' };
  const out = await AppCheck.initAppCheck(app, ' public-site-key ', async next => {
    url = next;
    return {
      initializeAppCheck(gotApp, options) {
        seen = { gotApp, options };
        return { started: true };
      },
      ReCaptchaV3Provider: function Provider(key) { this.key = key; },
    };
  });
  assert.equal(url, 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app-check.js');
  assert.equal(AppCheck.FB_VER, '13.1.0');
  assert.equal(seen.gotApp, app);
  assert.equal(seen.options.provider.key, 'public-site-key');
  assert.equal(seen.options.isTokenAutoRefreshEnabled, true);
  assert.deepEqual(Object.keys(seen.options).sort(), ['isTokenAutoRefreshEnabled', 'provider']);
  assert.equal(seen.options.provider instanceof Object, true);
  assert.equal(out.started, true);
});

test('firebase-config publishes only a placeholder site key', () => {
  const src = fs.readFileSync(path.join(__dirname, '../firebase-config.js'), 'utf8');
  assert.match(src, /appCheckSiteKey:\s*'REPLACE_WITH_RECAPTCHA_V3_SITE_KEY'/);
  assert.equal(src.includes('RECAPTCHA_SECRET'), false);
});
