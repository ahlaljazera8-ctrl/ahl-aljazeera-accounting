# Feature map

Reference for the screens at `f718c8d995c7bae378a7380b802e90aa02afabaa`. How to run the checks stays in the [README](../README.md). This page does not repeat those commands.

## Shell

`public/index.html` holds the markup. `#boot` is lines 16-19. `#login` is lines 20-33. `#shell` is lines 35-59. The bell wrap is lines 38-44. The demo role control is lines 47-51 (`select#role` is line 49). The static tabs are lines 54-58 (`home`, `entry`, `projects`). People and foremen tabs are inserted later.

Script order is lines 61-72: `ledger.js`, `sync.js`, `sync-status.js`, `dom-safe.js`, `appcheck.js`, `firebase-config.js`, `session.js`, `firebase-client.js`, `foremen.js`, `people-dir.js`, `render.js`, `app.js`.

`public/sw.js` line 1 is `VERSION = 'aj-p0-v53'`. `ASSETS` and `SHELL` are lines 2-4. `isShell` is line 7.

`renderScreen` is `public/render.js` lines 931-984. An unknown hash falls through to `home` at line 942. `render` at lines 985-997 catches a throw and shows `PeopleDir.RENDER_ERROR` (`public/people-dir.js` line 17). Clicks start at `public/render.js` line 999. Login submit is lines 1194-1226.

## Boot, demo, and login

A cold open shows «أهل الجزيرة», then the login form or the ledger. `?role=owner` and `?role=site` skip Firebase. Any other visit shows «تسجيل الدخول».

`seed` is `public/app.js` line 21. Demo boot is lines 162-168: open IndexedDB `aj-p0`, call `seed`, and store the `role` query. `demoRole` is `public/session.js` line 87. It accepts only `owner` and `site`.

The signed-in path is `public/app.js` lines 90-160. `LOGIN_MS` is line 5 (20000). `withTimeout` is line 6. `isPoison` is line 15. A restored session calls `flushRemote()` at line 150. Service worker registration is line 170.

`showLogin` and `showApp` are `public/session.js` lines 118-119. `enterSession` is line 309. `closeSession` is line 276. The logout button is `public/render.js` lines 1037-1040. Email sign-in is lines 1194-1226 and calls `fb.signIn` (`public/firebase-client.js` line 70). Repair, suspended, dead session, and missing profile strings are `public/session.js` lines 17-20.

Demo data uses IndexedDB `aj-p0`. A signed-in user uses `aj-u-<uid>`. Stores are `projects`, `entries`, `outbox`, and `meta` (`public/session.js` lines 2-4 and 32-37). Auth is Firebase Auth. Cache keys are `K` at line 5.

Tests: `tests/browser-check.js` lines 20-33, `tests/emulator/logout-fields.test.js`, `tests/emulator/offline-cold-start.test.js`, `tests/emulator/login-relogin.test.js`, `tests/emulator/session-live.test.js`, `tests/session-get.test.js`, `tests/shell-cache.test.js`, `tests/sw-cache.test.js`, `tests/emulator/security-headers.test.js`.

## Home (`#home`)

`views.home` is `public/render.js` lines 426-444. The owner sees received, spent, and profit from `Ledger.totals` (`public/ledger.js` line 27) and a CSV button. A site user sees today's spend on assigned projects and the last three own entries. Both see `connectionLabel` (line 417) and the example banner when the rows are demo data.

Data is `K.entries`, `K.projects`, and `K.sessionUser`. This paint does not read Firestore. Totals are derived.

Tests: `tests/browser-check.js` (`o1: totals shown`, `s1: own client payment listed`). `tests/ledger.test.js` covers `totals`, negative profit, and an empty ledger.

## New entry (`#entry` and `#entry/<projectId>`)

`views.entry` is `public/render.js` lines 445-485. Types come from `Ledger.ENTRY_TYPES` (`public/ledger.js` lines 9-15): مصروف, مواد, عمالة/سلفة, مقاول, دفعة عميل. With the default policy a site user sees all five. «مقاول» is included because the role is site. Client payment is included because `DEFAULT_POLICY.siteCanCreateClientPayment` is true (`public/ledger.js` line 18). The owner-only «من عهدة» block is lines 462-468. Save is the `#save` handler at line 1061, through `commit` at line 272. Amount chips are lines 1020-1033. `MAX_AMOUNT_IQD` is `10000000000` at `public/ledger.js` line 118. `parseAmount` is line 133. `validateEntry` is line 170.

A new row is appended to `K.entries` and its id is appended to `K.outbox`. There is no `syncState` field (`public/sync.js` lines 1-2). The server collection is `ledgerEntries` (`collectionFor`, `public/sync.js` lines 23-31). The rules match is `firestore.rules` line 62.

Tests: `tests/browser-check.js` (`o2`, `s2`). `tests/ledger.test.js`. `tests/emulator/app-entry.test.js`. `tests/emulator/rules.test.js` from the `testSeq` at line 116.

## Projects (`#projects`) and one project (`#project/<id>`)

`views.projects` is `public/render.js` lines 486-507. The owner switches open and archived at the handler on line 1111. A site user has no archive filter. `views.project` is lines 508-525. The owner sees the contract field, received, spent, and profit. A site user sees spent and a by-type split, and no contract. «إدارة المشروع» is lines 519-521, only when `Ledger.can(u, 'manageProject')` (`public/ledger.js` line 76). The new-project handler is line 1155. `saveContract` is line 131.

Projects live in `K.projects` and Firestore `projects` (`firestore.rules` line 169). After save, `contractAmount` is not on the project. It is `K.finance` and `projectFinance/{projectId}` (`public/session.js` line 5, `firestore.rules` line 216). The same split is `README.md` line 20. A site user does not query `projectFinance`.

Tests: `tests/browser-check.js` (`o3`, `o4`, `s3`, `s4`). `tests/owner-access.test.js`. `tests/emulator/rules.test.js` lines 275, 395, and 419. `tests/ledger.test.js` (archived projects leave the open list).

## All entries (`#entries/<projectId>`) and detail (`#detail/<id>`)

The cache-only comment is `public/render.js` lines 526-527. `views.entries` is lines 528-536. «المزيد» is line 1057. `Ledger.projectEntryList` is `public/ledger.js` line 469. `views.detail` is `public/render.js` lines 564-596. Print and PDF are line 1099. One-entry CSV uses `downloadCsv` (line 347), `saveEntryFile` (line 359), and `Ledger.entryToCSV` (`public/ledger.js` line 418).

The list reads `K.entries` only. A row with a sync error hides the export buttons (`public/render.js` lines 591-595).

Tests: `tests/browser-check.js` (`o4`, `s4`, «عرض جميع القيود»). `tests/ledger.test.js` (project entry list, in-memory paging, entry CSV). `tests/dom-safe.test.js`.

## Reversal

The button is `data-rev` in `entryRow` (`public/render.js` line 414). The click path starts at line 1011. `Ledger.makeReversal` is `public/ledger.js` line 262. `reversalId` is line 256 (`rev_` plus the original id). A reversal is a new row. The original stays. The collection is still `ledgerEntries`.

Tests: `tests/ledger.test.js`. `tests/browser-check.js` (site reverse buttons only on own rows). `tests/emulator/app-entry.test.js`. `tests/emulator/rules.test.js` lines 190 and 203. `tests/sync-status.test.js` line 103.

## People (`#people`, `#person`, `#person/<uid>`)

`views.people` is `public/render.js` lines 537-542. `views.person` is lines 543-563. Owner only. `UID_HELP` is line 121. The app does not create Auth users. `savePerson` is line 176. The handler is line 1162. `syncPeopleTab` is line 695.

`public/people-dir.js` owns the load policy. `createLoader` is line 152. `loadPlan` is line 64. `SUCCESS_TTL_MS` is line 12 (30000). `OFFLINE_LEAD` is line 13 (`غير متصل`). `UPDATE_LEAD` is line 14 (`تعذّر التحديث`). `syncNote` is lines 108-109 and returns `lead + ' · آخر تحديث: ' + time`. `ensureDirectory` is `public/render.js` line 230. `refreshDirectory` is line 260. Line 983 refreshes when the owner is on a people screen and not in the demo.

Local keys are `K.users` and `K.peopleSynced`. The server collection is `users/{uid}` (`firestore.rules` line 199). A failed load does not write `K.users` (`public/people-dir.js` lines 1-2).

Tests: `tests/people-dir.test.js`. `tests/browser-check.js` (`o5`). `tests/emulator/rules.test.js` line 222. `tests/owner-access.test.js`.

## Subcontracts (`#sub/<id>`, `#subnew/<projectId>`, `#amend/<id>`)

`views.sub` is `public/render.js` lines 597-631. `views.subnew` is lines 632-653. `views.amend` is lines 654-677. Owner only. Project cards use `subcontractSection` at line 39. `subFigures` is line 20. `Ledger.subcontractBalance` is `public/ledger.js` line 323. «مسدّد بالكامل» is painted from that derived balance. It is not a stored field.

Keys are `K.subcontracts`, `K.terms`, and `K.amendments`. Server collections are `subcontracts`, `subcontractTerms`, and `subcontractAmendments` (`firestore.rules` lines 230, 250, and 273). `collectionFor` routes them at `public/sync.js` lines 29-30. `stripMoney` is line 140. `termsPayload` is line 152.

Tests: `tests/browser-check.js` from line 131. `tests/ledger.test.js`. `tests/owner-access.test.js`. `tests/emulator/rules.test.js` line 472.

## Archive, restore, and permanent delete

`deleteConfirm` is `public/render.js` line 768. `manageChoice` is line 782. `confirmDialog` is line 789. Archive confirm is line 1121. `deleteProjectNow` is line 822. `Ledger.nextProjectStatus` is `public/ledger.js` line 88. `Ledger.foremanDeleteBlock` is line 617. A counted foreman expense blocks the delete. `Sync.exactProjectName` is `public/sync.js` line 468. `Sync.projectDeleteBatches` is line 504. `Sync.dropProjectLocal` is line 542.

The server delete removes the project, its ledger rows, `projectFinance/{projectId}`, and that project's subcontracts, terms, and amendments. Foremen and foreman moves stay (`tests/project-delete.test.js`). The dialog at `public/render.js` line 780 says the delete is final and the app keeps no backup.

Tests: `tests/project-delete.test.js`. `tests/emulator/rules.test.js` line 554. `tests/browser-check.js` (`s4` has no project management).

## Foremen (`#foremen`, `#foreman/<id>`, `#foremannew`, `#foremanmove/<id>`)

`ForemenUI.install` is `public/foremen.js` lines 17-27. It assigns `views.foremen`, `views.foreman`, `views.foremannew`, and `views.foremanmove`. `syncForemenTab` is `public/render.js` line 725. `onClick` is `public/foremen.js` line 322. A save calls `flushRemote` at line 331. `Ledger.foremanBalance` is `public/ledger.js` line 511. `settleGuard` is line 591. `validateForemanMove` is line 538.

Keys are `K.foremen` and `K.foremanMoves`. Server collections are `foremen` and `foremanMoves` (`firestore.rules` lines 299 and 321). `collectionFor` uses local `docType` (`public/sync.js` lines 25-26).

Tests: `tests/foremen-ui.test.js`. `tests/ledger.test.js` from `foremanBalance`. `tests/strict-foremen.test.js`. `tests/emulator/sync.test.js`. `tests/emulator/rules.test.js` from line 653. `tests/sync-status.test.js` (SS1 through SS6, and T-FC1).

## Bell, outbox, and flush

`paintBell` is `public/render.js` lines 881-922. «إرسال الآن» is line 1036. The demo calls `sendNow` (line 278). A signed-in user calls `flushRemote`.

`flushRemote` is `public/firebase-client.js` line 366. It returns immediately when `deleteLock` is set (line 367), when `demoRole()` is set, or when there is no `K.sessionUser` (line 368). One `flushing` promise is reused (line 369). After `FLUSH_MS` (line 306, 20000) the notice is `SEND_RETRY` or `PULL_RETRY` (lines 307-308 and 381-386). Those strings are `تعذر الإرسال. أعد المحاولة` and `تعذر التحديث. أعد المحاولة`.

Callers at this SHA:

- `public/app.js` line 150, after a restored session.
- `public/session.js` line 319, inside `enterSession`.
- `public/firebase-client.js` line 593, when a new id was queued during the flush.
- `public/foremen.js` line 331.
- `public/render.js` lines 47, 149, 276, 864, 1036, 1160, and 1241.

`performFlush` is `public/firebase-client.js` line 453. It refreshes the id token (line 465), refreshes the profile (line 478), calls `Sync.flushOutbox` with `write: fb.writeLocal` (lines 500-502), applies `SyncStatus.applyFlush` to `K.outbox` and `K.syncErrors` (lines 543-546), flushes project status (line 557), then `fb.pull` (line 566). A kept id sets `syncNotice` to `SEND_RETRY` (line 548). Badge HTML is `SyncStatus.badgeHtml` (`public/sync-status.js` line 174).

Tests: `tests/emulator/sync.test.js`. `tests/emulator/offline-reconnect.test.js`. `tests/sync-status.test.js`. `tests/browser-check.js` line 30. `tests/emulator/incremental-pull.test.js`.

## CSV export from home

The `#csv` handler is `public/render.js` line 1104. `Ledger.toCSV` is `public/ledger.js` line 286. `canExportCSV` is line 296 (owner and active). A site user does not get the button (`views.home` lines 430-443).

Tests: `tests/ledger.test.js` (owner only, BOM, formula guard, party name).

## Not a screen

`public/appcheck.js` `initAppCheck` is line 38. `public/firebase-config.js` has no screen. `public/dom-safe.js` `escapeHtml` is line 14 and `projectButton` is line 64.

Tests: `tests/appcheck.test.js`, `tests/strict-appcheck.test.js`, `tests/dom-safe.test.js`, `tests/strict-dom-safe.test.js`.

## Layout A and Layout B

The tradeoff text is commit `a2944b4` ("Add a Phase 2 module map with two layouts and no code split"). The current record, including the later choice sentence, is [Phase 2 module map](phase-2-module-map.md).

Layout A, from that commit:

> Split `app.js` by ownership, still as classic scripts, still as globals.
>
> `index.html` gains script tags in that order. `ASSETS` and `SHELL` gain the same names. One service worker bump per pull request that adds a file. Tests that call `Ledger`, `Sync`, `SyncStatus`, `DomSafe`, and `AJ` keep working. This is the smaller blast radius. The cost is more globals and a longer precache list.

Layout B, from that commit:

> `app.js` becomes `type=module` and imports ledger, sync, and the Firebase SDK. The UMD wrappers can stay so Node tests keep `require('../public/ledger.js')`, or the tests move to `import`. `window.AJ` remains only if the browser checks still need it.
>
> The precache list can shrink if the module graph is bundled into one file, or grow if each module is its own URL. Either way `ASSETS` changes and `VERSION` bumps. The browser checks that eval `Ledger` and `AJ` as globals break until those names are still published. The demo URL and the heal redirect (`?sw=`) stay. This is the larger blast radius and the cleaner long-term import graph. It should not be the first cut.

Same commit, "What not to do in the same change":

> Layout A can land one file at a time. Layout B wants a single pull request that updates the script tag, the precache list, and the tests together, after Layout A has made `app.js` boring.

That commit also says not to start the file split in the same step as the pick. The chat in which Ameer chose Layout A is not in this repository. Pull request #35 says Layout B was not used. `public/session.js`, `public/firebase-client.js`, and `public/render.js` are the classic scripts that landed.
