const js = require('@eslint/js');
const globals = require('globals');

// Names published by the classic scripts in public/.
const pageGlobals = {
  Ledger: 'readonly',
  Sync: 'readonly',
  SyncStatus: 'readonly',
  DomSafe: 'readonly',
  AppCheck: 'readonly',
  AJ: 'readonly',
};

// Empty catches are best-effort cleanup (close a database, kill Chrome, ignore a
// failed cache write). The binding is unused on purpose. Replacing an internal
// failure with a fixed Arabic message must not keep that failure on `cause`.
const rules = {
  ...js.configs.recommended.rules,
  'no-empty': ['error', { allowEmptyCatch: true }],
  'no-unused-vars': ['error', { caughtErrors: 'none' }],
  'preserve-caught-error': 'off',
};

module.exports = [
  { ignores: ['node_modules/**', 'shots/**', '.firebase/**'] },
  {
    files: ['public/sw.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: globals.serviceworker,
    },
    rules,
  },
  {
    files: ['public/session.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...pageGlobals,
        ensureFirebase: 'readonly',
        disposeFirebase: 'readonly',
        render: 'readonly',
        flushRemote: 'readonly',
        isDeadAuth: 'readonly',
      },
    },
    rules,
  },
  {
    files: ['public/app.js', 'public/firebase-config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...pageGlobals,
        K: 'readonly',
        cache: 'writable',
        db: 'writable',
        writing: 'writable',
        sessionEpoch: 'writable',
        deviceId: 'writable',
        directoryPromise: 'writable',
        syncNotice: 'writable',
        REPAIR_MSG: 'readonly',
        SUSPENDED_MSG: 'readonly',
        SESSION_DEAD_MSG: 'readonly',
        MISSING_PROFILE_MSG: 'readonly',
        $: 'readonly',
        get: 'readonly',
        set: 'readonly',
        openDB: 'readonly',
        loadAll: 'readonly',
        uuid: 'readonly',
        today: 'readonly',
        demoRole: 'readonly',
        me: 'readonly',
        showLogin: 'readonly',
        showApp: 'readonly',
        markReady: 'readonly',
        profileFrom: 'readonly',
        loginError: 'readonly',
        showLoginMessage: 'readonly',
        holdSession: 'readonly',
        localSession: 'readonly',
        openUserDb: 'readonly',
        enterSession: 'readonly',
        closeSession: 'readonly',
      },
    },
    rules,
  },
  {
    files: ['public/ledger.js', 'public/sync.js', 'public/sync-status.js', 'public/dom-safe.js', 'public/appcheck.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, ...globals.node },
    },
    rules,
  },
  {
    files: ['tests/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules,
  },
  {
    files: [
      'tests/emulator/offline-cold-start.test.js',
      'tests/emulator/offline-reconnect.test.js',
      'tests/emulator/logout-fields.test.js',
      'tests/webkit-upgrade.test.js',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.browser, ...pageGlobals },
    },
    rules,
  },
];
