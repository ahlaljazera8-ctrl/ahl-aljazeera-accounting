# Phase 2 module map

This is a map for review. It does not move code. The split waits until one layout is chosen.

## Figure-it-out

Done means: Phase 1 is either a green pull request with no behaviour or UI change, or an explicit stop, and this document is the only Phase 2 artifact.

Scope was six Phase 1 units plus this map. The demo deletion was the one-way door. It stopped. The resend test was the unknown that could have been a bug. It passed, so nothing was fixed. Rigor was high on permissions and the demo, and low on comments and the CI script.

Order that was run:

1. Resend test. Passed on the current flush. No production edit.
2. Demo removal. Stopped. See below.
3. One amount ceiling in `ledger.js`. Rules file not edited.
4. CI guard for a `public/` change without a service worker version bump.
5. `Ledger.can(user, action)` for the owner checks.
6. A justification on each empty catch in `public/`.
7. This map.

Open: pick layout A or layout B. Do not start the file split in the same step as the pick.

## Demo removal, stopped

`?role=owner` and `?role=site` are a visible mode. README says they open the local demo with no Firebase. The boot path calls `showApp()` and opens IndexedDB `aj-p0`. The role switcher is shown, logout is hidden, the header names أمير and أحمد, the connection pill says `متصل (محاكاة)`, and «إرسال الآن» calls `sendNow` instead of `flushRemote`. The browser suite and `tests/sw-cache.test.js` drive that URL. Deleting `demoRole` would change that screen and those tests. It was not done.

## How the shell works today

Classic scripts, in this order, from `public/index.html`: `ledger.js`, `sync.js`, `sync-status.js`, `dom-safe.js`, `appcheck.js`, `firebase-config.js`, `app.js`. Each ledger-style file is a UMD wrapper: Node gets `module.exports`, the browser gets a property on `window`. There is no bundler.

`app.js` is the only file that touches the DOM, IndexedDB, and the Firebase SDK. It calls `Ledger` and `Sync`. It publishes `window.AJ` as `{ get, flush }` for tests and the console. `get` deep-clones a cache key.

## What each module owns

| Module                      | Owns                                                                                                                             | Does not own                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `public/ledger.js`          | Entry types, validation, totals, reversals, CSV, the project entry list, subcontract balance, `can(user, action)` once #32 lands | DOM, Firebase, IndexedDB                                      |
| `public/sync.js`            | Outbox flush decisions, remote field copies, pull query specs, project-delete batches, splitting `contractAmount` off a project  | The actual Firestore write. The caller passes `write`         |
| `public/sync-status.js`     | Whether a flush error is transient, dead auth, or a conflict, and the badge HTML                                                 | When to flush                                                 |
| `public/dom-safe.js`        | Escaping and the safe-id check before a value is placed in HTML                                                                  | Layout                                                        |
| `public/appcheck.js`        | App Check init when the site key is not the placeholder                                                                          | Enforcement, which stays a console setting                    |
| `public/firebase-config.js` | `window.FIREBASE_CONFIG`                                                                                                         | Secrets. The site key placeholder is public                   |
| `public/app.js`             | Screens, the in-memory cache, IndexedDB, login, the outbox flush wiring, render                                                  | Ledger rules. It calls `Ledger`                               |
| `public/sw.js`              | Precache of the shell, claiming clients, healing an old cache by navigating to `?sw=VERSION`                                     | API responses. Non-shell requests are not answered from cache |
| `firestore.rules`           | Who may read or write which document                                                                                             | Not part of any of these pull requests                        |

## Interfaces

`Ledger` is a bag of pure functions. Inputs are plain objects (`user`, `entry`, `project`, `policy`). Outputs are numbers, arrays, or thrown `Error` with `errors` on validation failure. `can(user, action)` is the new narrow surface: `owner` or `manageProject`.

`Sync.flushOutbox({ ids, load, write, exists, readServer })` returns `{ synced, kept, failed, adopted, authDead }`. `Sync.pullChanges` takes `read(spec)` and returns merged rows plus a watermark. `spec` is either `{ collection, id }` or `{ collection, where }`.

`SyncStatus.applyFlush` and `badgeHtml` are the UI-facing status. `readRemote` is the one function that imports the Firestore SDK, and only when called.

`AJ.get(key, fallback)` and `AJ.flush()` are the test seam. Browser checks call them.

## Where state lives

| State            | Place                                                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Demo ledger      | IndexedDB `aj-p0` (projects, entries, outbox, meta) plus the `cache` object in `app.js`                                                                     |
| Signed-in ledger | IndexedDB `aj-u-<uid>`, same stores                                                                                                                         |
| Outbox           | Ids only. No `syncState` field                                                                                                                              |
| Meta keys        | users, projectFinance, subcontracts, subcontractTerms, subcontractAmendments, role, deviceId, seeded, sessionUser, syncErrors, pullWatermark, statusPending |
| Auth session     | Firebase Auth persistence, separate from IndexedDB                                                                                                          |
| Server documents | Firestore. The rules file is the authority                                                                                                                  |
| Shell bytes      | Cache Storage name `aj-p0-vNN` in `public/sw.js`                                                                                                            |

`pullWatermark` is per read-set. An assignment change drops it because the allowed query changed. Pending outbox ids are not overwritten by a pull.

## Service worker precache

`ASSETS` in `public/sw.js` is the list that must stay in sync with the files the page loads:

`index.html`, `style.css`, `print.css`, `ledger.js`, `sync.js`, `sync-status.js`, `dom-safe.js`, `appcheck.js`, `firebase-config.js`, `app.js`, `manifest.json`, `icon.svg`.

`SHELL` is the same set as path keys, plus `/`. A new script tag is a new precache entry. Shipping it without a new `VERSION` leaves phones on the previous set. That is what the version guard in #31 checks.

## Layout A: more classic scripts

Split `app.js` by ownership, still as classic scripts, still as globals.

- `session.js` owns IndexedDB, `cache`, `AJ`, login, and logout.
- `firebase-client.js` owns `loadFirebase` and the flush that calls `Sync`.
- `render.js` owns the views and the click handlers.
- `ledger.js`, `sync.js`, and `sync-status.js` stay as they are.

`index.html` gains script tags in that order. `ASSETS` and `SHELL` gain the same names. One service worker bump per pull request that adds a file. Tests that call `Ledger`, `Sync`, `SyncStatus`, `DomSafe`, and `AJ` keep working. This is the smaller blast radius. The cost is more globals and a longer precache list.

## Layout B: one ES module entry

`app.js` becomes `type=module` and imports ledger, sync, and the Firebase SDK. The UMD wrappers can stay so Node tests keep `require('../public/ledger.js')`, or the tests move to `import`. `window.AJ` remains only if the browser checks still need it.

The precache list can shrink if the module graph is bundled into one file, or grow if each module is its own URL. Either way `ASSETS` changes and `VERSION` bumps. The browser checks that eval `Ledger` and `AJ` as globals break until those names are still published. The demo URL and the heal redirect (`?sw=`) stay. This is the larger blast radius and the cleaner long-term import graph. It should not be the first cut.

## What not to do in the same change

Do not edit `firestore.rules` in the split. Do not remove the demo while the browser suite depends on it. Do not bundle and change the precache list in the same pull request as a behaviour change. Layout A can land one file at a time. Layout B wants a single pull request that updates the script tag, the precache list, and the tests together, after Layout A has made `app.js` boring.
