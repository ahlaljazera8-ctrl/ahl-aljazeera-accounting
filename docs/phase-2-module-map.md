# Phase 2 module map

Layout A was chosen: more classic scripts, not ES modules. The scripts stay in `public/` and share the window. `public/index.html` loads them in this order: `ledger.js`, `sync.js`, `sync-status.js`, `dom-safe.js`, `appcheck.js`, `firebase-config.js`, `session.js`, `firebase-client.js`, `render.js`, `app.js`. `sw.js` is not in that list. `app.js` registers it.

## What each file owns

Verified from the file's own header and the names it publishes.

- `public/app.js` owns boot, the demo seed, and the login timeout. It declares `LOGIN_MS`, `withTimeout`, `isPoison`, and `seed`, then registers `sw.js`.
- `public/appcheck.js` owns Firebase App Check with the reCAPTCHA v3 provider. It publishes `AppCheck`, including `siteKeyReady` and `initAppCheck`. Enforcement is not turned on in this file.
- `public/dom-safe.js` owns escaping and id checks before a value is placed in an HTML attribute. It publishes `DomSafe`, including `escapeHtml`, `isSafeId`, `projectAttr`, `projectHref`, `entryHref`, and `projectButton`.
- `public/firebase-client.js` owns the Firebase web client and the outbox flush that calls `Sync`. It publishes `ensureFirebase`, `flushRemote`, `disposeFirebase`, `rebuildFirebase`, `isDeadAuth`, and `isImportFailure`.
- `public/firebase-config.js` owns the public web client config. It sets `window.FIREBASE_CONFIG`, including `appCheckSiteKey`.
- `public/ledger.js` owns the ledger rules and does not touch the DOM. It publishes `Ledger`, including `ENTRY_TYPES`, `can`, `totals`, and `MAX_AMOUNT_IQD` (`10000000000`).
- `public/render.js` owns the screens and the click handlers. It declares `L` and `POLICY`, and `render` is the screen function.
- `public/session.js` owns IndexedDB (`aj-p0` and `aj-u-<uid>`), login, and logout. It publishes `get`, `set`, `demoRole`, `enterSession`, and `closeSession`.
- `public/sw.js` owns the shell cache. `VERSION` is `aj-p0-v41`. `isShell` decides which GETs are cached, and a failed network read falls back to that cache.
- `public/sync-status.js` owns the outbox result classes and the per-entry sync state. It publishes `SyncStatus`, including `isDeadAuth`, `applyFlush`, and `badgeHtml`.
- `public/sync.js` owns the outbox flush and does not import Firebase. It publishes `Sync`, including `flushOutbox`, `pullChanges`, and `projectDeleteBatches`. The caller performs the write.

## The split that landed

Layout A was carried out in three merged pull requests:

- [#35](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/pull/35) moved IndexedDB, login, and logout into `public/session.js`. Merge `17433b96d4fc97bd30554bdef85abdfce7afda70`.
- [#36](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/pull/36) moved the Firebase client and the flush into `public/firebase-client.js`. Merge `e41c6fbf90c6753681125ba65e483c544003d9e9`.
- [#37](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/pull/37) moved the views and click handlers into `public/render.js`. Merge `abd3ed265c341c0cfc8d1f02fad062f777c08fa8`.
