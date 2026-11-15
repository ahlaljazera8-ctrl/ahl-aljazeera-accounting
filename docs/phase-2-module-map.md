# Phase 2 module map

## History

#34 was opened at 09:05 Baghdad on 2026-11-03 (GitHub `createdAt` `2026-11-03T06:05:56Z`). The original commit `fa7192fafeb6431d17468736a2a78f306578d43a` is 09:05 Baghdad the same morning (`2026-11-03T06:05:38Z`). [#35](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/pull/35) merged at 10:53 Baghdad (`2026-11-03T07:53:00Z`, `17433b96d4fc97bd30554bdef85abdfce7afda70`). The plan was on the pull request before the first split merged.

## Layout A vs Layout B (ES modules)

The original map (`fa7192f`) offered both layouts and said not to start the file split in the same step as the pick.

Layout A is more classic scripts. `app.js` would split by ownership, still as classic scripts and still as globals: `session.js` for IndexedDB, the cache, `AJ`, login, and logout; `firebase-client.js` for `loadFirebase` and the flush that calls `Sync`; `render.js` for the views and the click handlers. `ledger.js`, `sync.js`, and `sync-status.js` stay. `index.html`, `ASSETS`, and `SHELL` gain the new names, with one service-worker bump per pull request that adds a file. Tests that call `Ledger`, `Sync`, `SyncStatus`, `DomSafe`, and `AJ` keep working. This is the smaller blast radius. The cost is more globals and a longer precache list.

Layout B is one ES module entry. `app.js` becomes `type=module` and imports ledger, sync, and the Firebase SDK. The UMD wrappers can stay so Node tests keep `require('../public/ledger.js')`, or the tests move to `import`. The precache list can shrink if the module graph is bundled into one file, or grow if each module is its own URL. Either way `ASSETS` changes and `VERSION` bumps. Browser checks that eval `Ledger` and `AJ` as globals break until those names are still published. This is the larger blast radius and the cleaner long-term import graph. It should not be the first cut.

Ameer chose Layout A (plain-script modules, one per PR; ES modules only later, if proven safe and with his approval), per Ameer in chat with EA, 2026-11-03 10:39 Baghdad, before #35 merged (10:53). [#35](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/pull/35) then opened at 10:48 Baghdad (`2026-11-03T07:48:22Z`) as the first Layout A file, and its body says Layout B (ES modules) was not used. `public/session.js`, `public/firebase-client.js`, and `public/render.js` are the classic scripts that landed.

## What landed

The scripts stay in `public/` and share the window. `public/index.html` loads them in this order: `ledger.js`, `sync.js`, `sync-status.js`, `dom-safe.js`, `appcheck.js`, `firebase-config.js`, `session.js`, `firebase-client.js`, `render.js`, `app.js`. `sw.js` is not in that list. `app.js` registers it.

## What each file owns

Verified from the file's own header and the names it publishes.

- `public/app.js` owns boot, the demo seed, and the login timeout. It declares `LOGIN_MS`, `withTimeout`, `isPoison`, and `seed`, then registers `sw.js`.
- `public/appcheck.js` owns Firebase App Check with the reCAPTCHA v3 provider. It publishes `AppCheck`, including `siteKeyReady` and `initAppCheck`. Enforcement is not turned on in this file.
- `public/dom-safe.js` owns escaping and id checks before a value is placed in an HTML attribute. It publishes `DomSafe`, including `escapeHtml`, `isSafeId`, `projectAttr`, `projectHref`, `entryHref`, and `projectButton`.
- `public/firebase-client.js` owns the Firebase web client and the outbox flush that calls `Sync`. It publishes `ensureFirebase`, `flushRemote`, `disposeFirebase`, `rebuildFirebase`, `isDeadAuth`, and `isImportFailure`.
- `public/firebase-config.js` owns the public web client config. It sets `window.FIREBASE_CONFIG`, including `appCheckSiteKey`.
- `public/foremen.js` owns the foreman list, the detail, and the settle sheet. It publishes `ForemenUI`, including `install` and `onClick`. `render.js` passes it a `RenderApi`.
- `public/ledger.js` owns the ledger rules and does not touch the DOM. It publishes `Ledger`, including `ENTRY_TYPES`, `can`, `totals`, and `MAX_AMOUNT_IQD` (`10000000000`).
- `public/people-dir.js` owns the people-directory load policy. It publishes `PeopleDir`, including `samePeople`, `loadPlan`, `applyPeople`, and `createLoader`. `render.js` calls it. The file does not import Firebase.
- `public/render.js` owns the screens and the click handlers. It declares `L` and `POLICY`, and `render` is the screen function.
- `public/session.js` owns IndexedDB (`aj-p0` and `aj-u-<uid>`), login, and logout. It publishes `get`, `set`, `demoRole`, `enterSession`, and `closeSession`.
- `public/sw.js` owns the shell cache. `VERSION` is `aj-p0-v58`. `isShell` decides which GETs are cached, and a failed network read falls back to that cache.
- `public/sync-status.js` owns the outbox result classes and the per-entry sync state. It publishes `SyncStatus`, including `isDeadAuth`, `applyFlush`, and `badgeHtml`.
- `public/sync.js` owns the outbox flush and does not import Firebase. It publishes `Sync`, including `flushOutbox`, `pullChanges`, and `projectDeleteBatches`. The caller performs the write.

## The split that landed

Layout A was carried out in three merged pull requests:

- [#35](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/pull/35) moved IndexedDB, login, and logout into `public/session.js`. Merge `17433b96d4fc97bd30554bdef85abdfce7afda70`.
- [#36](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/pull/36) moved the Firebase client and the flush into `public/firebase-client.js`. Merge `e41c6fbf90c6753681125ba65e483c544003d9e9`.
- [#37](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/pull/37) moved the views and click handlers into `public/render.js`. Merge `abd3ed265c341c0cfc8d1f02fad062f777c08fa8`.
