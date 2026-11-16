# PLAN ONLY: contractor PR E sketch

Revision r6, against Architect NOTES on r5 head `6cc942695657d653a3d9c99965accfebdc0f2ddb` (review sha256 `bd3ca028d980c2ec648ac8428daede1bf64c398587aaf4f696233b4f191086b5`). The r5 blob is `57b990b56f21522982767cc4cd655a486e068f9d`.

Revision r5, against Architect NOTES on r4 head `719e0754641a65c316cfe3895811c5c82b799a88` (review sha256 `806b1ee2bce2ec357962b5c8bf36e56b868a128d45082938d2ba3bf436487c03`). The r4 blob is `02f65c93f34bf24f9775b1a751a97a18e9570f44`.

Revision r4, against Architect NOTES on r3 head `13d0438cac89127af3925d32db5db49cb56ea946` (review sha256 `c3ba08b307778cebd3ed784230170ae5bc477542a8d4ce035d27f2f2ec250710`). The r3 blob is `a7dc4bd3b9d3926ff93d128cac2c503b8f6a5d49`. Citations below were rechecked at main `f1c5070426906e14c2e815c288c7327387115b1a`. D's plan is merged there as #80.

Revision r3, against Architect NOTES on r2 head `e68a892e` (review sha256 `287192927502f2ddb761692160961b4eb6a46c8f06986560d74fa0a1a490c9d5`). The r2 blob is `1877da22260d4acf1b78d39ed2945f1104d18f8f`. Citations below were rechecked at main `6f4bb1ec91660cc3b54d2db0159457d5fa0a0962`. D is cited at r4 head `7ac193c5`.

Revision r2, against Architect NOTES on `d344b3d9` (review sha256 `e1645840cc1be989d0ddfa499efaccafa10b835aa67fc6d64e89b467234a7170`). r1 is that head, 570 lines, blob `5a998ba208e26b1303f938a2c0289f9bfc001b7e`.

EA, on Ameer's delegation, 2026-11-16 00:52 Baghdad, approved the defaults in `QUESTIONS-FOR-EA-r1.md` (sha256 `13723e6e0586d653d55e35be087ab220adb67e32c1a60a61ff1b5dde7d2e5c75`) for Q1–Q47. Where `answers-EA-delegated-0034.md` (sha256 `2b3bb1f0a7b485057c973db203d21930a7c683fbd1d185e6c2c58f68e2bd5bc1`, section «Ameer answers, 2026-11-16 15:35») differs, the earlier answer wins. Later sections of that file do not override Q5 or Q11–Q15. E paints no balance. This lane folds in Q5 and Q11–Q15. The date-fix answer in that earlier file says the date fix merges first as v59 and the rest renumber. That is the Q5 reading used here. Q13's approved default (an unknown dependency error stays queued) replaces the fail-once line r2 had taken from the Architect's M2. The earlier answers file does not speak on Q13, so the approved default stands.

No code in this pull request. No edit to `public/`, `firestore.rules`, or `public/sw.js`. The code PR comes after the Architect reviews this r4 and Ameer says go.

Parent plan: `plan-contractor-module-r2.28.md`, sha256 `ef1c98d08a7118ed35469d250c81605a7f17f518d949f8446b8c63bb1869c8a2`. The r2 sketch cited `baf4f21fc54c156989334e826d19990b8e5e8a74`. This r4 rechecks those lines at main `f1c5070426906e14c2e815c288c7327387115b1a`. #80 changes only D's sketch. Service worker on that main is `aj-p0-v64` (`public/sw.js` line 2). PR A is already on main (`public/accounts.js`).

Arena was not run. Ameer's gate bans it (cost). The shape is the one already approved in r2.28 section 5. This file is the sketch those gates asked for before code.

## Scope

Plan r2.28 lines 145-149 and 929-952, plus the adopt rules in section 5 (lines 522-533) and conflict C1 (line 972). Order is A, B, C, then D merged and deployed by Ameer, then E, then F, then K, then G-J. This sketch does not start B, C, D, F, K, or G-J.

From the table, PR E is:

- The adopt path for the slot body, `appr_`, `rej_`, `sup_`, `rev_`, labor `stl_`, and `revw_`.
- Two owner phones, distinct uids, both `role == owner`. No hard-coded uid. The demo uid `u-ameer` (`public/app.js` line 34, looked up at `public/session.js` line 146) is not copied into these tests.
- No `inv_`.
- A transient error stays queued. Not-found or denied fails once. The fix is to re-enter the record.
- The cash-pointer case is a hand-built guard row, not a `PURPOSES` row.
- `إرسال الآن` flushes the outbox. It does not put a failed id back.
- Not silent `putIfMissing`.
- Unknown `docType` is rejected before `queueDoc`.
- `slotLosers` holds the lost subtree. Membership is taken once, at adoption.

Not in E: material purposes, invoice locks, `linkRefusals` text other than the existing conflict sentence, screens, rules, `projectCost`, and the statement fold. PR K asserts the adopted-`appr_` project figure of 700,000. E does not.

Preconditions, both still in front of the code PR (Q11). D is deployed by Ameer. EA has confirmed the rejected-entries stream is finished. D's deployed rules include the project check on every account leaf. #88 head `aa9c1482` has `projectActive` on all 15 leaves. That head is not merged and not deployed. #72 on this base is not that confirmation. This docs PR does not start the code.

## Files the code PR edits

| File                                                                        | Change                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/sync.js`                                                            | Route `party`, `agreement`, `accountTxn`, and `statementApproval`. `queueRefusal` before any outbox append. `accountReads` / `pullAccounts`, owner only. The adopt step and the one subtree walk live inside `flushOutbox`. `localDoc` is the one id lookup.                                                                                                                        |
| `public/sync-status.js`                                                     | One `sameContent` key list per new kind, a reference copy of D r4 at `7ac193c5`. A reversal is not adopted by `sameContent`. `payloadDiffers` subtracts the owner-identity fields. `dependencyStatus` fails a missing or denied dependency once, and keeps any other server dependency error queued (Q13). `applyFlush` drops `parked` ids and clears any `syncErrors` key on them. |
| `public/firebase-client.js`                                                 | `readDependency` runs only after a dependent write throws a non-transient error. `writeLocal` uses `setDoc`, one document, and strips `docType`. `pull` stores the watermark at `K.pullWatermark.accounts`. `performFlush` (lines 681-882) writes adopted rows, `slotLosers`, and `linkRefusals` before both `applyFlush` calls.                                                    |
| `public/session.js`                                                         | At `6f4bb1ec`, `K` line 5 already has `parties`, `agreements`, and `accountTxns`. E adds `statementApprovals`, `slotLosers`, and `linkRefusals` on that same line. IndexedDB stays version 1. The new values are meta. The watermark is a sub-key of `K.pullWatermark`, not another name.                                                                                           |
| `public/render.js`                                                          | `queueDoc` (lines 89-93) asks `queueRefusal` before the append. `rejectedLogoutBlock` (lines 547-552) and the rejected CSV (lines 1311-1324) also cover account ids in `syncErrors`, `slotLosers`, and `linkRefusals`. No new screen.                                                                                                                                               |
| `public/sync.js` `dropProjectLocal`                                         | Q15. Only `dropPending: true` drops the project's agreements, account rows, statement approvals, `slotLosers`, and `linkRefusals`. `dropPending: false` keeps pending, refused, and those maps. Parties stay. The Q8 button stays PR F.                                                                                                                                             |
| `types/checkjs.d.ts`                                                        | `SyncApi`, `SyncStatusApi`, `FlushCall`, and `FlushResult` gain the fields below. `SyncRow.docType` gains the four new literals.                                                                                                                                                                                                                                                    |
| `tests/sync-status.test.js`                                                 | The flush tests below. Already named by `package.json` `"test"` and by `.github/workflows/ci.yml`.                                                                                                                                                                                                                                                                                  |
| `tests/emulator/account-adopt.test.js`                                      | The two-phone server tests. Architect M4 on #80 moved them here. D keeps the single-client allow/deny matrix.                                                                                                                                                                                                                                                                       |
| `package.json`, `.github/workflows/ci.yml`                                  | The `test:emulator` command in both files gains `tests/emulator/account-adopt.test.js`. The two command strings stay identical. The unit `"test"` script does not change. At `6f4bb1ec` the emulator command is `ci.yml` lines 181-182. E takes those lines from its own base.                                                                                                      |
| `public/sw.js`, `tests/shell-cache.test.js`, `tests/webkit-upgrade.test.js` | Version pins only, after the parallel public PRs. See Sequencing.                                                                                                                                                                                                                                                                                                                   |

`public/accounts.js` is not edited. The walker reads `Accounts.PURPOSES` at flush time. `payLabor` already has `needsApproval: false` and `effect.cash: 1` (`public/accounts.js` line 73, inside `PURPOSES` at lines 69-79). PR B may change `post` and the pointer table. It does not have to change those two fields for this rule to keep working.

The page loads `sync.js` at `public/index.html` line 62 and `accounts.js` at line 71. The factory must not read `Accounts` while the script is evaluating. The read happens inside the flush, after every script has run. In Node, that read uses `require('./accounts.js')`, the same split `public/sync.js` lines 84-88 already use for `Ledger`, but called from the function, not from the top of the factory.

## Files the code PR does not edit

`firestore.rules`, `public/ledger.js`, `public/index.html`, `public/app.js`, `public/foremen.js`, `docs/PSTACK_INVENTORY.md`. The unit `"test"` script in `package.json` stays. F's project-delete guard stays: `Ledger.personProjectDeleteBlock` (`public/ledger.js` line 1109), reached from `projectDeleteBlock` (`public/render.js` line 944) and `deleteProjectNow` (line 1016). E's `dropProjectLocal` extension runs only after that guard and does not bypass it.

`queueDoc` stays the only enqueue. `foremen.js` already calls `screen.queueDoc` (lines 404, 441, 467). A foreman `docType` is known, so the new check lets those calls through. No edit there.

The new emulator file is the one exception to "no new test file". It is added to both emulator command strings, which stay identical. The unit list is not given a second copy.

`post` still returns a document. It does not call `queueDoc`. E does not call `post` to build the guard row.

## Citations checked at baf4f21 (r2 history)

This table is the r2 check against `baf4f21`. It is history. The lines to copy are in «Citations rechecked at main f1c50704», which supersedes this table and the `6f4bb1ec` list. The plan cites older SHAs (`8811b77b`, `020904cd`). A row marked stale was a line number that was no longer the text at `baf4f21`.

Still true:

| Claim                                                                    | At baf4f21                                                                                                   |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `usesPutIfMissing` is the four legacy collections                        | `public/sync.js` lines 18-20                                                                                 |
| `putIfMissing` returns without writing when the server doc exists        | `public/firebase-client.js` lines 239-244                                                                    |
| `mergeById` lets the incoming row win unless the id is still pending     | `public/sync.js` lines 282-291                                                                               |
| Watermark pull is `createdAtServer >=`                                   | `public/sync.js` lines 345-361 (`sinceClause` is 354-361)                                                    |
| Outbox rewrite is clear then put                                         | `public/session.js` line 75                                                                                  |
| A meta value is one `st.put(v, k)`                                       | `public/session.js` line 78                                                                                  |
| `رُفض الإرسال`                                                           | `public/sync-status.js` line 12                                                                              |
| `القيد موجود على الخادم بمحتوى مختلف`                                    | `public/sync-status.js` line 13                                                                              |
| `foremanReads` is owner-only                                             | `public/sync.js` lines 204-210                                                                               |
| `queueDoc` appends an id and flushes only outside the demo               | `public/render.js` lines 89-93                                                                               |
| `isOwner()` is the role, not a uid                                       | `firestore.rules` line 11                                                                                    |
| `idOk` stops at 64                                                       | `firestore.rules` line 19                                                                                    |
| Site role is still in the rules                                          | `firestore.rules` line 12 is `isSite()`. Line 156 is the ledger create that allows `isOwner() \|\| isSite()` |
| Terms and amendments stay off the site read                              | `firestore.rules` line 260 and line 292, both `isOwner()`                                                    |
| CSV split in the project-delete test                                     | `tests/project-delete.test.js` lines 92-96                                                                   |
| `K` is the one name map                                                  | `public/session.js` line 5                                                                                   |
| Service worker guard fails a `public/` edit that does not bump `VERSION` | `tests/sw-version-guard.test.js` lines 31-46                                                                 |

Stale, and the correction:

| Plan said                                                                                                                                                                                                                                                           | At baf4f21                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Service worker `VERSION` on main is `aj-p0-v56`, and the plan does not reserve `aj-p0-v57` (line 151).                                                                                                                                                              | Rechecked at `6f4bb1ec`: `public/sw.js` line 2 is `aj-p0-v64`. The code PR takes the next free number at its own merge. This sketch reserves no number.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| The PR that adds `accounts.js` also adds the script tag (`public/index.html` lines 69-72), `ASSETS` / `SHELL` (`public/sw.js` lines 2-4), and `SHELL_FILES` (`public/session.js` line 263) (line 931).                                                              | Rechecked at `6f4bb1ec`: `accounts.js` is `public/index.html` line 71, before `render.js` line 72. `sync.js` is line 62. `ASSETS` is `public/sw.js` line 3 and `SHELL` is line 5. `SHELL_FILES` is `public/session.js` line 316 and already names it. E does not add the tag.                                                                                                                                                                                                                                                                                                                              |
| `flushOutbox` walks ids at line 601 and on a transient error does `kept.push` at line 616.                                                                                                                                                                          | The function starts at line 594. The loop is line 605. Line 616 is the dead-auth `if`. The `kept.push` is line 617. The transient `kept.push` is line 620. The read-error catch is lines 626-632: a transient read stays queued, and any other read error is unverified and fails once.                                                                                                                                                                                                                                                                                                                    |     |
| A successful `write` marks the id synced at lines 609-610, which is how silent `putIfMissing` hides a clash.                                                                                                                                                        | `write` is line 613. The synced mark is line 614. The behaviour is unchanged: `putIfMissing` does not throw when the doc exists, so the flush treats that id as synced.                                                                                                                                                                                                                                                                                                                                                                                                                                    |     |
| The reversal adopt is lines 631-634.                                                                                                                                                                                                                                | It is lines 635-638.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| An unknown shape is kept at line 607.                                                                                                                                                                                                                               | It is line 611: `if (!collectionFor(local)) { kept.push(id); continue; }`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `applyFlush` is lines 154-165 and never clears the conflict key. `errMap[row.id]` is line 162.                                                                                                                                                                      | `applyFlush` is lines 169-181. Line 176 writes `errMap[row.id]`. Lines 174-175 delete the key for `synced` and for `kept`. A failed id is not deleted. The conflict stays because that id has left the outbox, so a later flush does not see it. The function does clear the key when the same id is later synced or kept.                                                                                                                                                                                                                                                                                 |
| `failureMessage` is lines 142-145.                                                                                                                                                                                                                                  | It is lines 143-147. The conflict return is line 144.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `badgeHtml` is lines 174-177, called from `public/render.js` line 479.                                                                                                                                                                                              | Rechecked at `6f4bb1ec`: `badgeHtml` is lines 189-198. The call is `public/render.js` line 521.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| The bell reads `syncErrors` at `public/render.js` lines 968-970. `إرسال الآن` is lines 1008-1009. `paintBell` is lines 972-1013.                                                                                                                                    | Rechecked at `6f4bb1ec`: `failedMessages` is lines 1073-1076. `paintBell` starts at line 1077. The button text is line 1114. The click is line 1243 and calls `flushRemote({ fromOutside: true })`.                                                                                                                                                                                                                                                                                                                                                                                                        |
| `readServer(local)` is `public/firebase-client.js` lines 639-646 and returns null on any non-auth error.                                                                                                                                                            | Rechecked at `6f4bb1ec`: the callback is lines 755-762. A non-auth throw returns null (lines 759-762). That callback does not drive an account adopt.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `outboxEmpty` is `public/session.js` lines 248-261. Logout alerts are lines 310-312. Logout deletes `aj-u-…` at lines 308-325.                                                                                                                                      | Rechecked at `6f4bb1ec`: `outboxEmpty` is lines 301-314. The alerts are lines 371 and 376. `closeSession` deletes a database whose name starts with `aj-u-` at line 384. `SHELL_FILES` is line 316.                                                                                                                                                                                                                                                                                                                                                                                                        |
| Owner CSV and «عرض جميع القيود» use `countedEntries` at `public/render.js` lines 1196-1199 and `public/ledger.js` lines 469-476. The project card's last eight use `visibleEntries` at `public/render.js` lines 363-366 and 594. `countedEntries` is lines 298-308. | Rechecked at `6f4bb1ec`: `countedEntries` is `public/ledger.js` lines 307-310. `toCSV` is lines 288-296. The owner CSV download is `public/render.js` lines 1326-1330. «عرض جميع القيود» is the link at line 655. The full list is lines 661-668 and calls `projectEntryList` (`public/ledger.js` lines 607-616), which drops refused ids. The last eight rows are line 654. They come from `data()` (lines 363-366), which uses `visibleEntries` and does not drop `syncErrors`. `subcontractBalance` is `public/ledger.js` line 461. The card can show a refused row. The full list and the CSV omit it. |
| #65 is the open pull request for this stream and does not touch `public/sync.js` (C1). #66, #67, #68, and #69 are merged.                                                                                                                                           | Rechecked at `6f4bb1ec`: #72 is merged. The deleted-project sentence and the rejected CSV are on main. E still waits until EA says that stream is finished (Q11). E does not change the CSV or `PROJECT_DELETED` (`public/sync-status.js` line 15).                                                                                                                                                                                                                                                                                                                                                        |
| `projectSummary.spent` for the site user is `public/ledger.js` lines 111-115.                                                                                                                                                                                       | The function is lines 111-115. The site branch returns `spent` only. Still true.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Demo uid cited at `public/session.js` line 93.                                                                                                                                                                                                                      | Rechecked at `6f4bb1ec`: the `u-ameer` lookup is `public/session.js` line 146. The seed is `public/app.js` line 34.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

`dropProjectLocal` starts at `public/sync.js` line 542. The keep rule is line 552. Q15: `slotLosers` and `linkRefusals` leave only when `dropPending` is true. `forgetGoneProjects` (`public/firebase-client.js` line 516) calls it with `dropPending: false` at line 530. The deleting phone passes true at `public/render.js` lines 1023 and 1039, and only after `projectDeleteBlock` (line 944) has called `Ledger.personProjectDeleteBlock` (`public/ledger.js` line 1109) from `deleteProjectNow` (line 1016). E does not bypass that guard.

## Usage

A screen, later, saves one document and calls `queueDoc(id)`. `queueDoc` loads that id through `localDoc`. `queueRefusal` returns a code or null. A code means the id is not appended. Null means today's append, then `flushRemote({ fromOutside: true })` outside the demo (`public/render.js` line 92). The edit keeps that options object.

`flushRemote` (`public/firebase-client.js` line 583) keeps calling `flushOutbox` from `performFlush` (lines 681-882). The new callbacks are `readDependency` and `mintId`. The result gains `parked`, `slotLosers`, and `linkRefusals`. `performFlush` writes the adopted account rows and both maps before every `applyFlush`. Callers of `queueDoc` do not learn the subtree rule. A flush sends one document per write. It does not put an approval and a rejection, or an approval and a supersede, in one batch.

A test builds two docs with the same deterministic id and two `createdBy` uids, points `write` at a function that throws `permission-denied`, and points the own-id read at the winner. It asserts the server doc, the parked ids, and an empty `syncErrors` entry for the shared id.

Second design considered: leave the clash on silent `putIfMissing`. Rejected. `putIfMissing` does not compare content (`public/firebase-client.js` lines 239-244), and the flush then marks the id synced (`public/sync.js` line 614). A refusal stored on the shared id hides the winner. The plan already closed that.

Third design considered: a new `public/account-sync.js` with its own flush. Rejected. The app has one flush, `Sync.flushOutbox`. A second sender is a second way to do the same task.

Fourth design considered: name each dependent (`appr_`, then `stl_`, then `deduct`, then the next generation) and special-case that list. Rejected. The plan records four failed rounds. The lost work is one subtree, membership taken once.

## Types and signatures

`lostSubtree`, `cashNeverJoins`, and `accountKeys` stay inside their factories. Tests reach them through `flushOutbox`, `sameContent`, `payloadDiffers`, and `queueRefusal`. Exporting the walk would make a second copy of the rule in whatever file imported it.

```javascript
/**
 * @typedef {'party'|'agreement'|'accountTxn'|'statementApproval'} AccountDocType
 */

/**
 * @typedef {'body'|'appr'|'rej'|'sup'|'stl'|'rev'|'revw'} AccountKind
 * `inv` is not a v1 kind. queueRefusal rejects it.
 */

/**
 * Shared stored header. createdAtServer and deviceId are stored.
 * sameContent does not compare createdAtServer or deviceId.
 * That is an engineering default, not a question.
 * The compared header is id, kind, projectId, partyId, createdBy, createdByName.
 * @typedef {{
 *   id: string,
 *   docType: AccountDocType,
 *   kind?: AccountKind,
 *   projectId?: string,
 *   partyId?: string,
 *   createdBy: string,
 *   createdByName?: string,
 *   createdAtServer?: unknown,
 *   deviceId?: string,
 *   ledger?: 'labor',
 *   purpose?: string,
 *   agreementId?: string,
 *   qty?: number,
 *   amount?: number,
 *   currency?: 'IQD',
 *   fxRate?: number,
 *   txnDate?: string,
 *   description?: string,
 *   targetId?: string,
 *   settlesId?: string,
 *   reversesId?: string,
 *   reversalReason?: string,
 *   supersedesId?: string,
 *   periodKind?: string,
 *   periodStart?: string,
 *   periodEnd?: string
 * }} AccountSyncDoc
 */

/**
 * @typedef {{
 *   entries?: readonly SyncDoc[] | null,
 *   projects?: readonly SyncDoc[] | null,
 *   subcontracts?: readonly SyncDoc[] | null,
 *   amendments?: readonly SyncDoc[] | null,
 *   foremen?: readonly SyncDoc[] | null,
 *   foremanMoves?: readonly SyncDoc[] | null,
 *   parties?: readonly SyncDoc[] | null,
 *   agreements?: readonly SyncDoc[] | null,
 *   accountTxns?: readonly SyncDoc[] | null,
 *   statementApprovals?: readonly SyncDoc[] | null
 * }} QueueStores
 */

/**
 * @param {SyncDoc | null | undefined} doc
 * @returns {string | null}
 * 'docType' when docType is a non-empty string outside
 * foreman, foremanMove, party, agreement, accountTxn, statementApproval.
 * 'kind' when docType is accountTxn and kind is 'inv'.
 * null when the doc may be queued, including a missing docType
 * (the legacy shape path) and a null doc.
 */
function queueRefusal(doc)

/**
 * @param {string} id
 * @param {QueueStores | null | undefined} stores
 * @returns {SyncDoc | null}
 * One lookup. queueDoc and the flush load callback both call it.
 */
function localDoc(id, stores)

/**
 * @param {SyncUser | null | undefined} user
 * @param {unknown} since
 * @returns {readonly ReadSpec[]}
 * Owner and active: parties, agreements, accountTxns, statementApprovals.
 * Anyone else, including site: [].
 */
function accountReads(user, since)

/**
 * @param {SubPull} opts
 * @returns {Promise<{
 *   parties: SyncDoc[],
 *   agreements: SyncDoc[],
 *   accountTxns: SyncDoc[],
 *   statementApprovals: SyncDoc[],
 *   watermark: number | null
 * }>}
 */
function pullAccounts(opts)

/**
 * The sub-key on K.pullWatermark. Value is the string 'accounts'.
 * firebase-client.js writes pullAccounts().watermark there.
 * readSetChanged clears the whole map, including this key
 * (public/firebase-client.js line 201).
 */
const ACCOUNTS_MARK = 'accounts'

/**
 * @param {string} id
 * @returns {string}
 * 'slotLoser:' plus the shared id. The screen key and data-id.
 * The winner row keeps the shared id and does not read this map.
 */
function slotLoserKey(id)

/**
 * @param {Readonly<Record<string, SyncDoc>> | null | undefined} losers
 * @returns {{ key: string, doc: SyncDoc, readOnly: true }[]}
 * readOnly is the contract. The object has no action field.
 * PR F paints the block. E does not emit HTML.
 */
function slotLoserViews(losers)

/**
 * @param {Readonly<Record<string, SyncDoc>> | null | undefined} refusals
 * @returns {{ key: string, doc: SyncDoc, readOnly: true }[]}
 * key is the local uuid minted at the loss. It is not the stl_ id,
 * not the advance id, and not a cash id.
 */
function linkRefusalViews(refusals)

/**
 * @param {AccountKind} kind
 * @returns {readonly string[]}
 * The only key list for that kind. payloadDiffers subtracts from it.
 * Not exported. sameContent and payloadDiffers are the callers.
 */
function accountKeys(kind)

/**
 * @param {SyncRow | null | undefined} local
 * @param {SyncRow | null | undefined} remote
 * @returns {boolean}
 * Existing foreman, move, and ledger branches stay first.
 * The account branch runs before the line that returns false
 * for a doc with no entryType and no project name
 * (public/sync-status.js line 76).
 */
function sameContent(local, remote)

/**
 * @param {SyncRow | null | undefined} local
 * @param {SyncRow | null | undefined} remote
 * @returns {boolean}
 * True when any body key outside the owner-identity fields differs.
 * Owner identity is createdBy and createdByName.
 * partyId and projectId count as a difference: approveLabor binds
 * them, and a denied write of the shared approval id would hide the winner.
 * createdAtServer and deviceId do not count (Q12).
 * unitName and unitPrice are not on D r4's AccountTxn allowlist
 * (7ac193c5), so they are not compared and not sent.
 */
function payloadDiffers(local, remote)

/**
 * @param {SyncFailure | null | undefined} err
 * @param {boolean | null} exists
 * @returns {'found'|'missing'|'denied'|'transient'|'auth'}
 * exists false and no error is 'missing'.
 * permission-denied is 'denied'.
 * isTransient is 'transient'. isDeadAuth is 'auth'.
 * Any other error is 'transient' (Q13). The dependent stays queued.
 * The legacy read of the row being flushed still uses
 * public/sync.js lines 626-632. This function does not.
 */
function dependencyStatus(err, exists)

/**
 * @typedef {{ status: 'found', doc: SyncDoc } | { status: 'missing' } | { status: 'denied' } | { status: 'transient' }} DependencyRead
 */

/**
 * @param {string} id
 * @returns {Promise<DependencyRead>}
 * Reads that id, not the row being flushed.
 * A missing document is status 'missing'. It is not null.
 * Dead auth throws, and flushOutbox returns authDead as it does today.
 */
function readDependency(id)
```

`FlushCall` gains optional `readDependency` and `mintId`. `mintId` is `uuid` from `public/session.js` line 85. `flushOutbox` does not generate ids itself. If a labor `stl_` loses and `mintId` is missing, that `stl_` stays queued. The test passes a mint function.

`flushOutbox` still returns `synced`, `kept`, `failed`, `adopted`, and `authDead`. It also returns:

```javascript
/**
 * @typedef {{
 *   synced: string[],
 *   kept: string[],
 *   failed: { id: string, message: string }[],
 *   adopted: { id: string, remote: SyncDoc }[],
 *   parked: string[],
 *   slotLosers: { key: string, doc: SyncDoc }[],
 *   linkRefusals: { localId: string, doc: SyncDoc }[],
 *   authDead: boolean
 * }} AccountFlushResult
 */
```

`parked` and `synced` are disjoint. `parked` and `failed` are disjoint. `applyFlush` adds every `parked` id to the drop set and deletes `errMap[id]`. It does not copy `parked` into `synced`. The demo stamp at `public/render.js` lines 340-346 runs on synced entry ids. A parked id must not be in that set, or the lost row would look sent.

`collectionFor` (`public/sync.js` lines 23-31) checks `docType` first, as it does for foremen:

| docType                     | Collection                                                  |
| --------------------------- | ----------------------------------------------------------- |
| `foreman`                   | `foremen`                                                   |
| `foremanMove`               | `foremanMoves`                                              |
| `party`                     | `parties`                                                   |
| `agreement`                 | `agreements`                                                |
| `accountTxn`                | `accountTxns`                                               |
| `statementApproval`         | `statementApprovals`                                        |
| any other non-empty docType | `null`                                                      |
| absent                      | today's shape path: ledger, project, subcontract, amendment |

`usesPutIfMissing` stays the four names at lines 18-20. `usesPutIfMissing('accountTxns')` is false. `writeLocal` calls `setDoc` for the four new collections. Create-only rules turn a second create into a denial. The catch in `flushOutbox` is the adopt step. `putIfMissing` is not that path.

`toRemote` copies D's allowlist and then strips `docType`. The lists below are a reference copy of D r4 at `7ac193c5`, taken again from D's merged SHA when the code PR starts. The code keeps one constant per kind. A test fails if that constant disagrees with the allowlist copied from that SHA. There is no second list in `sync.js`. `unitName` and `unitPrice` are not fields of an account document.

`docType` is a local tag, the same way a foreman tag is local (`docs/petty-cash-plan.md`). It is not on any D allowlist. `toRemote` omits it before `setDoc`. The server copy is untagged. `sameContent` still matches, because `docType` is not a compared key. A test asserts the remote object has no `docType`.

The account allowlist is D's `AccountTxn`: `id`, `kind`, `projectId`, `partyId`, `purpose`, `ledger`, `agreementId`, `targetId`, `settlesId`, `reversesId`, `supersedesId`, `reversalReason`, `txnDate`, `qty`, `amount`, `currency`, `fxRate`, `description`, `createdBy`, `createdByName`, `createdAtServer`, `deviceId`. Not on it, so not sent: `docType`, `unitName`, `unitPrice`, `effect`, `lockId`, `invoiceKey`, `invoiceNumber`, `attachmentIds`, `entryType`, `roles`. `rej_` sends the shared header plus `targetId` only. D says a rejection has no `amount` and no `purpose`. `approveDeduct` and `revw_` send no `amount`. `payLabor` and `advanceLabor` send no pointer.

Party keys: `id`, `name`, `note`, `createdBy`, `createdAtServer`, `deviceId`. No `roles`. Agreement keys, from D r4 at `7ac193c5`: `id`, `partyId`, `projectId`, `method`, `description`, `currency`, and exactly one method group (`lumpAmount`, or `unitRate`+`unitQty`+`unitName`, or `dayRate`, or `milestoneAmount`+`milestoneMode`), plus `createdBy`, `createdAtServer`, `deviceId`. An agreement reversal is the same keys plus `reversesId` and `reversalReason` (1–500). A normal agreement is not written at a `rev_` id. Statement keys: `id`, `partyId`, `projectId` when present, `periodKind`, `periodStart`, `periodEnd`, `createdBy`, `createdAtServer`. No `deviceId` and no figures.

`adoptEntry` (`public/firebase-client.js` line 613) stays the ledger reversal copy. An account adopt stores `fromRemote` of the server doc. It does not pass through `adoptEntry`.

## Data shape

IndexedDB version stays 1 (`public/session.js` lines 33-37). No new object store.

| `K` name             | Value                                              | Who writes it                       |
| -------------------- | -------------------------------------------------- | ----------------------------------- |
| `parties`            | array of docs                                      | pull, and later F's create          |
| `agreements`         | array of docs                                      | pull, and later screens             |
| `accountTxns`        | array of docs                                      | pull, adopt, and the parked removal |
| `statementApprovals` | array of docs                                      | pull, and the later finalise        |
| `slotLosers`         | map of `slotLoser:<id>` to the whole local doc     | the adoption pass, once             |
| `linkRefusals`       | map of a fresh uuid to the whole losing `stl_` doc | the `stl_` loss                     |

`mergeById` still skips ids that are in the outbox (`public/sync.js` lines 282-291). The loser copy is written to `slotLosers` before the shared id leaves the outbox, so the pull cannot replace it first and drop the payload.

`pullAccounts` stores its watermark at `K.pullWatermark.accounts`. The constant is `ACCOUNTS_MARK = 'accounts'`, exported from `sync.js`, so the string is written once. `firebase-client.js` already stores `subcontracts` at line 360 and `foremen` at line 369 on that same map. A role, assignment, or active-flag change runs `readSetChanged` and sets the whole map to null (`public/firebase-client.js` line 201). `accounts` goes with it. The next pull is a full read.

Logout follows the #72 rule. `rejectedLogoutBlock` (`public/render.js` lines 547-552) already refuses logout while a deleted-project ledger row is not in `K.rejectedExportedIds`. E passes three more id lists into that same check: account ids that are keys of `syncErrors`, every key of `slotLosers`, and every key of `linkRefusals`. `closeSession` then alerts the existing sentence at `public/session.js` line 371 and returns false. The rejected CSV click (lines 1311-1324) appends those rows under the existing headers. The message cell is the `syncErrors` text, or the existing conflict sentence for a parked row or a link refusal. After a share or a download, those ids are written into `K.rejectedExportedIds` the same way lines 1319-1324 already write ledger ids. Logout deletes `aj-u-…` (line 384) only after that export. Another phone has no copy of the maps, so it shows no badge for them. The export does not add a string.

`statementApprovals` has no adopt step. Section 9 says two phones can each finalise, each with its own `createdBy`. The id is not one of the deterministic adopt ids. A same-bytes retry still uses `sameContent`. A real clash uses the existing `failureMessage` path, because that id is not a shared slot id and a `syncErrors` key on it does not hide a winner.

Slot id, from D r4 at `7ac193c5`: `000`, plus the 32 hex digits of the agreement id with every hyphen removed by `replaceAll('-', '')`, plus one generation character `1`–`9`. JavaScript `replace` removes one hyphen and is not used. `isSlotBody` is true when `docType` is `accountTxn`, `kind` is `body`, and the id matches `/^000[0-9a-f]{32}[1-9]$/`. Generation for the walk is the document's `agreementId`, not a second parse of the id. The id shape only answers "this is a slot".

`sameContent` lists. One array per kind, in `sync-status.js`. The body list is the shared compared header plus the money and quantity fields, including `ledger`. The slot payload is that list minus `createdBy` and `createdByName`. There is no second array.

| Kind   | Keys beyond the compared header                                                                                |
| ------ | -------------------------------------------------------------------------------------------------------------- |
| `body` | `ledger`, `purpose`, `agreementId`, `qty`, `amount`, `currency`, `fxRate`, `txnDate`, `description`            |
| `appr` | the body keys plus `targetId`. `approveDeduct` has no `amount` on either side, and that matches.               |
| `rej`  | `targetId` only. No `purpose` and no `amount`.                                                                 |
| `sup`  | `supersedesId` plus the body keys                                                                              |
| `stl`  | `targetId`, `settlesId`, `amount`, `ledger`, `purpose`, `agreementId`, `currency`                              |
| `rev`  | `reversesId`, `reversalReason`, plus the body keys the original has. Same-bytes only. Two owners do not match. |
| `revw` | `targetId`. No `amount`.                                                                                       |

Numbers compare with `===`. Strings compare with the existing `norm` (`public/sync-status.js` lines 33-36). A missing amount is not `0`.

## Adopt rules

After `write` throws, and the error is not dead auth and not transient:

1. Same bytes. `sameContent` is true. The id is `synced`. No `syncErrors`. No subtree. This is the lost-ack retry. Two owners do not land here, because `createdBy` is on the compared header.
2. Slot body. Same id. The server doc replaces the local row in `K.accountTxns`. The id is `synced` and `adopted`. It is not a `syncErrors` key. The winner stays in the fold because the fold reads `K.accountTxns` and this id is not in `syncErrors`.
3. If `payloadDiffers` is true, the walk below runs. The local body, the one from before the replace, is stored at `slotLoserKey(id)`. The other parked docs are stored the same way, whole.
4. If `payloadDiffers` is false, there is no subtree. A queued `appr_` of that body is attempted in this pass once the body is in `synced`.
5. `appr_`, `rej_`, `sup_`, and `revw_` with the same id and the same `targetId` adopt the server copy of that same id and clear `syncErrors` for it, only when that copy's `kind` equals the local `kind`. `sup_` is a body with `supersedesId`, matching C r2. An account `rev_` adopts on the same document id plus the same `reversesId`, not on `sameContent`, and only when the server copy's `kind` is `rev`. Two owners differ in `createdBy` and `reversalReason` (D r4 at `7ac193c5`, Architect F3). The server copy replaces the local row and `syncErrors` for that id is cleared.
6. Labor `stl_` with the same id and the same target, and a different `settlesId` or `amount`, adopts the server winner only when its `kind` equals the local `kind`. The shared id is not a `syncErrors` key. The loser's whole doc is stored under `mintId()`. That uuid is not queued and is not the `stl_` id. The advance id and the cash id stay out of `syncErrors`. The fold does not read `linkRefusals`.

7. A `stl_` that the walk already parked is not also a link refusal, and it is not written.
8. An agreement cancellation, `docType: 'agreement'`, id `rev_` plus the agreement id, adopts on that same document id plus the same `reversesId`, not on `sameContent`. Two owners' reversals of one agreement differ in `createdBy` and `reversalReason` (D r4 at `7ac193c5`, Architect F3). The server copy replaces the local row and `syncErrors` for that id is cleared. `collectionFor` sends it to `agreements` because of `docType`. Without this rule the losing phone stores `رُفض الإرسال` on a cancellation the server already holds, and C treats a marker in `syncErrors` as not live.

E adopts a server row only under its own id, and only when the server copy's `kind` matches the local one. A pointer that names a `rev_` id is never a parent: E does not adopt, park, or hold on it as a live parent. This matches #88 N1: a `rev_` copy is never a parent.

The walk, once, on the docs already queued at that moment:

- A queued doc joins when `targetId`, `reversesId`, `settlesId`, or `supersedesId` is the slot id or an id already in the set. Repeat to a fixed point.
- A queued slot body of the same `agreementId` whose generation character is higher, and which is already queued, joins, and then the same walk takes its dependents.
- A slot body queued after this pass is not in the set. A later `queueDoc` does not consult the set.
- A labor `deduct` whose `targetId` is an `approveLabor` in the set joins.
- A purpose with `needsApproval === false` and `effect.cash !== 0` does not join. The read is `Accounts.PURPOSES[purpose]`. The hand-built `payLabor` is that case even though it carries a `targetId`. Q14, approved: this pass does not `write` it.
- If `Accounts.PURPOSES` is missing, the pass does not guess. It does not park anything and it does not send the dependents. They stay queued. The production page has loaded `accounts.js` before a flush.

Parked ids are removed from the outbox and from `K.accountTxns`. They have no `syncErrors` key. `applyFlush` would write `errMap[row.id]` (`public/sync-status.js` line 176) and the fold would hide that id. On a shared id that is the winner. This path does not push the shared id, or a parked dependent, through `failed`.

`rev_<slotId>` is in the set when it is queued, so it is not sent and does not reverse the winner's body. `rev_` of `appr_<slotId>` is in the set the same way and does not reverse the winner's approval.

The badge for a lost row is the existing `badgeHtml` (`public/sync-status.js` lines 189-198) with a one-entry map whose key is `slotLoser:<id>` or the link-refusal uuid, and whose message is `SyncStatus.CONFLICT`. Winner rows are drawn from `K.accountTxns` and do not read the maps, so the counted row has no pill. PR F paints the block on the person statement. E's tests call `slotLoserViews`, `linkRefusalViews`, and `badgeHtml`. E does not add a screen, and the PR table says E creates no rows until F.

## Dependency hold

Nothing is read before `write`. `readServer` (`public/firebase-client.js` lines 755-762) still returns null on any non-auth error, so it cannot tell missing from denied from transient and it does not drive an account adopt. Account ids use `readDependency`. The classifier is one function. The id passed to it changes.

Holds that do not write and do not read:

1. Cash purpose (`needsApproval` false and `effect.cash !== 0`) whose pointer names an id parked in this pass (Q14). Do not `write`. Leave the row in the outbox and in `K.accountTxns`. Do not fail it and do not put it in `slotLosers`. It counts on this phone only, because it is not in `syncErrors`. The next flush writes it. D r4 at `7ac193c5` denies a `payLabor` that carries `targetId`. That denial is the plain-denial step below: own id missing, pointer found, `failed` once with `رُفض الإرسال`, never `synced`, then the #72 export.
2. The pointer id is in `kept` this pass, or still later in the outbox and not yet in `synced`: `kept.push`. Do not `write`.
3. The pointer id is in `failed` this pass: fail the dependent once with `رُفض الإرسال`. Do not keep it and do not park it.
4. The pointer id was parked this pass: the dependent is in the subtree. Do not fail it and do not `write` it.

Otherwise `write` first. A successful write is `synced` and costs no extra client read. Dead auth returns `authDead` (`public/sync.js` line 617). A transient write error is `kept` (line 620). A throw with no Firebase `code`, or a client `invalid-argument` from building the document reference, is not a server error (Q13 says «خطأ من الخادم»). It fails once with `رُفض الإرسال` and enters the #72 export.

When an account `write` throws a non-transient server error, read the account's own id with `readDependency` first. That read has five outcomes. The pointer is read only after `missing`.

1. Own id `found`: apply adopt rules 1-8 to that document. The pointer is not read. A slot body has no pointer, so it always stops here.
2. Own id `missing`: read the pointer (`targetId`, `reversesId`, `supersedesId`, or `settlesId`).
3. Own id `transient`, including a Q13 server code that is not transient and not dead auth: `kept`. The pointer is not read. The id stays queued.
4. Own id `auth`: return `authDead`. The pointer is not read.
5. Own id `denied`: `failed` once with `رُفض الإرسال`. The pointer is not read. The local document stays. It is not `synced` and not `parked`.
6. Own id missing and pointer `found`: a plain rules denial. `failed` once with `رُفض الإرسال`. The local document stays. It is not `synced` and not `parked`.
7. Pointer `missing` or `denied`: `failed` once, the same message.
8. Pointer `transient`, or a server code that is not transient, not dead auth, and not `permission-denied`: Q13. The id stays `kept`. It is not written into `syncErrors`. Logout stays refused by the unsent alert (`public/session.js` line 376) while `outboxEmpty` is false (lines 301-314). Recovery, if the error never clears, is a later pull request Ameer approves. This r4 does not add a cap and does not add a string. The review's optional cap would use the existing `رُفض الإرسال` or `القيد موجود مسبقاً وتعذر مطابقة محتواه` and is left for EA.
9. Pointer `auth`: return `authDead`.
10. After a plain `رُفض الإرسال` on an account row that has a `projectId`, call the existing `projectProbe`. On main `498b64bb` that call is `public/firebase-client.js` line 754 (`readProjectProbe`). Pass the result to `messageAfterProjectProbe` (`public/sync-status.js` line 157). The deleted-project sentence is returned only when the probe says `exists === false` and the project is not an unsent local project. Dead auth on the probe returns `authDead`. Any other probe error keeps `رُفض الإرسال`, the same as #72. A closed or archived project still exists, so the message stays `رُفض الإرسال`. The probe checks existence only. Account rows have no `entryType`, so they do not enter the ledger gate at `public/sync.js` lines 641-654. This step is what produces `رُفض الإرسال لأن المشروع محذوف` for them. The probe runs only after that refusal.

The legacy ledger path still uses `readServer` after its own write throws. An unverified ledger read still fails once (`public/sync.js` lines 626-632). That path is not an account adopt.

`إرسال الآن` is `public/render.js` line 1114. The click is line 1243. It flushes the current outbox. A failed id is already gone from that list.

A body then its approval, body first in the same list: the body is pushed to `synced`, then the approval is written. A transient body keeps the approval and a `rev_` of that body queued. The plan's `inv_` sentence is the same hold. v1 has no `inv_`. The test uses `appr_` and `rev_`.

## Spark

Plan section 16 (line 998). The free quota is 50,000 document reads, 20,000 writes, and 20,000 deletes a day. A rule `get` is billed even when the create is denied. This sketch does not turn on a paid plan. If the first pull of the four collections would pass 50,000 reads, stop and ask Ameer.

Counts E adds:

- First owner pull: one read per existing document in `parties`, `agreements`, `accountTxns`, and `statementApprovals`. Later pulls read only `createdAtServer >= K.pullWatermark.accounts`. A site pull asks for none of them.
- Holds 1-4 above: no client read.
- A dependent write that succeeds: no extra client read. The rules still bill the gets that create performed. D r4 at `7ac193c5` still bills up to 9 gets on a generation-past-1 labor `stl_`.
- A failed account write: at most three client reads per round. The own id is first. The pointer is second, and only when the own id is missing. `readProjectProbe` (`public/firebase-client.js` line 754) is the third, and only after a plain refusal on a row that has a `projectId`. A transient, denied, or dead-auth own-id read stops at one, unless that denial is a plain refusal and then takes the probe. `performFlush`'s tail (lines 869-881) skips `kept` ids, so a Q13 or Q14 kept account id does not arm another round. A trigger from outside can still run at most one extra tail round.

## performFlush

#86's `performFlush` is `public/firebase-client.js` lines 681-882. E edits that function. It has two `applyFlush` calls. The normal one is line 797. The inactive-profile one is line 778: a missing or inactive profile turns `failed` into `kept`, runs `applyFlush`, and holds the session. `applyFlush` drops `parked` ids. The adopted account rows, `slotLosers`, and `linkRefusals` are written before both calls, in one helper both sites use. Otherwise the line 778 branch would drop the parked ids and lose the loser docs.

`pendingAtStart` (lines 736-742) is filled only from `K.finance` and `K.terms`. Account ids are never in that map, so the refusal at lines 846-860 cannot put `رُفض الإرسال` on an account id. The tail (lines 869-881) skips `kept` ids, so a queued account id does not start the extra round.

## Engineering defaults

Q12, approved. `sameContent` does not compare `createdAtServer` or `deviceId`. The server writes the time, so a retry of the same bytes would never match. `deviceId` differs across phones and is not the field that separates two owners. `createdBy` is compared. Two owners therefore take the adopt path. A same-bytes retry from the phone that wrote the row matches and is `synced`.

Q13, approved and not reopened. A server code that is not transient and not dead auth stays queued. `isTransient` is `public/sync-status.js` lines 96-107. `isDeadAuth` is lines 125-134. What those two leave (`invalid-argument` from the server, `failed-precondition`, `internal`, `unknown`, `data-loss`, `out-of-range`, `unimplemented`, `unauthenticated`) stays queued. A throw with no `code`, or a client `invalid-argument` from building the reference, is not that case and fails once. While a real server "other" error lasts, logout shows «يوجد تغييرات لم تُرسل. أرسلها أولاً ثم اخرج» (`public/session.js` line 376).

## Tests

The flush tests are in `tests/sync-status.test.js`. Each asserts a result field, an id's presence, or an existing string. None asserts a helper's source text. The two-phone server tests are in `tests/emulator/account-adopt.test.js`. Architect M4 on #80 moved that set from D to E. D r2 had listed them as the rules half (`two owners: the same slot id... the first create is allowed and the second is denied`, and the three lines under it). E owns those, plus the adopt that follows the denial. D keeps the single-client allow/deny matrix. The emulator file runs only after D's rules are on the branch E codes from.

The plan does not number these. Spec tests 1, 2, 6, 7, 8, 11, 12, and 15 stay with A, B, and C. E does not edit `public/accounts.js`, so `tests/accounts.test.js` stays as it is. The 700,000, 1,300,000, and 100,000 project figures are PR K. E does not call `projectCost`. `CONTRACTOR_COST_START` is null. "Counted once" in the tests below means one adopted doc in the returned account list and no `syncErrors` entry for that id.

Amounts of 600,000 are the Q6 / spec 1 figure, used as data so the adopted approval is recognisable. They are not an assertion that E owns spec 1.

- `E1 two owners, one appr_`. Uids `owner-a` and `owner-b`. `write` throws `permission-denied`. The own-id read returns the server `appr_` and is recorded before any pointer read. That server doc is adopted. The id is not in `failed`. One doc, amount 600,000.
- `E2 two owners, one rej_`. Server doc is adopted. The id is not in `failed`.
- `E3 two owners, one rev_`. `write` throws `permission-denied`. The own-id read returns the other owner's reversal. Same document id, same `reversesId`, different `createdBy`, different `reversalReason`. `sameContent` is false. The server doc is adopted anyway, on the id plus `reversesId`, not on `sameContent` (D r4 at `7ac193c5`, Architect F3). The id is not in `failed`. No pointer read.
- `E4 two owners, one revw_ of one payLabor`. Server doc is adopted. The payment id is a different uuid and is still in the account list once. The `revw_` id is not in `failed`.
- `E5 two owners, one sup_`. Server doc is adopted. The id is not in `failed`.
- `E6 two owners, one labor stl_`. Same id, same target, different `settlesId`. Server doc is adopted. The shared id is not in `failed`. The loser is under a minted uuid. The advance id is not in `failed`. `linkRefusalViews` is `readOnly`. `badgeHtml` on that uuid with a one-entry conflict map returns the existing `القيد موجود على الخادم بمحتوى مختلف`.
- `E7 same-bytes retry`. Same `createdBy`. `write` throws `permission-denied`. The own-id read returns the same bytes. `sameContent` is true. The id is `synced`. No pointer read.
- `E8 usesPutIfMissing('accountTxns')` is false. A differing slot calls `write` first. `write` throws `permission-denied`. The named own-id read returns the other payload and that doc is adopted. The id is not silently `synced`. No pointer read.
- `E9 two phones, same lump slot, different amount, winner unapproved`. The losing phone's result has no `appr_` and no `rev_` in the account list. Those ids are in `parked` and absent from `failed`. They are in `slotLosers`.
- `E10 winner already approved`. The approval id is the adopted server doc and is not in `failed`.
- `E11 slot 2 queued before adoption`. The loser had rejected slot 1 and queued slot 2. Slot 2 is `parked`, in `slotLosers`, absent from the account list, not in `failed`. `write` is not called with slot 2's id.
- `E12 slot 2 queued after the result`. A second `flushOutbox` that contains only that later slot calls `write` with it.
- `E13 loser rows`. Measurement, approval, rejection, labor `stl_`, and a labor `deduct` whose `targetId` is that `approveLabor`: each `slotLoserViews` entry is `readOnly`, the key is `slotLoser:` plus the id, and the key is not the shared id. `badgeHtml` on the winner id with an empty error map is `''`.
- `E14 hand-built guard` (Q14). A `payLabor` with `targetId` aimed at the losing `approveLabor`, built as an object, not by `post`. On the adoption pass `write` is not called. It stays queued and in the account list, so this phone counts it, and it is not in `slotLosers`. The next flush calls `write`, which throws `permission-denied`. The own id is missing and the pointer is found. The id is `failed` once with `رُفض الإرسال`, not `synced`. The document stays. It leaves the counted set because it is in `syncErrors`, and `rejectedLogoutBlock` is true until the export mark.
- `E15 rev_ of the slot id and rev_ of the approval` are `parked`. `write` is not called with either id.
- `E16 missing dependency`. `write` throws a non-transient denial first. `readDependency` is then called and returns `missing`. The dependent is `failed` once, message `رُفض الإرسال`. `readDependency` was not called before `write`. A second flush whose outbox is the `applyFlush` result does not see that id.
- `E17 denied dependency`. Same as E16 with `denied`.
- `E18 queued server error` (Q13). After `permission-denied`, the own id is missing and the pointer read is `transient`: the dependent is `kept`. A server code `internal`, across three flushes: `kept` each time, not in `syncErrors`, at most one write and two reads per flush. A throw with no Firebase `code` fails once on the first flush with `رُفض الإرسال`.
- `E19 body synced on an earlier flush`. The approval is not held. `write` is called with it.
- `E20 body then approval, body first`. Both land in `synced` on one pass.
- `E21 transient body`. The body is `kept`. The `appr_` and the `rev_` are `kept`, not `failed`. The next flush, with `write` succeeding, puts all three in `synced`.
- `E22 queueRefusal`. `docType: 'nope'` is `docType`. `kind: 'inv'` is `kind`. A foreman, a ledger entry, a party, an agreement, an account body, and a statement approval are null. `collectionFor` of an account txn is `accountTxns`. `collectionFor` of `docType: 'nope'` is null.
- `E23 accountReads`. Role `site` returns `[]`. An active owner returns the four collections. `toRemote` of an account doc omits `docType`, `attachmentIds`, `unitName`, and `unitPrice`. A tagged local doc and an untagged server doc with the same compared keys still match `sameContent`.
- `E24 payload`. A different `amount` or `qty` makes `payloadDiffers` true. A different `createdBy` alone makes `sameContent` false and `payloadDiffers` false. A different `createdAtServer` or `deviceId` alone does not. A different `partyId` makes `payloadDiffers` true.
- `E25 watermark`. `ACCOUNTS_MARK` is `accounts`. `accountReads` with a null since has no `createdAtServer` clause. With a numeric since, it does. `readSetChanged` from an owner to a site user is true, which is the condition that sets `K.pullWatermark` to null.
- `E26 logout export`. An account id in `syncErrors`, a `slotLosers` key, and a `linkRefusals` key each make `rejectedLogoutBlock` true until that id is in `K.rejectedExportedIds`. After the export mark, the block is false for those ids. The alert string is the existing sentence at `public/session.js` line 371.
- `E27 two phones, emulator`. Uids `owner-a` and `owner-b`, both `role == owner`, `active == true`. Not `u-ameer`. For one shared slot id, one `appr_`, one `rej_`, one `sup_`, one labor `stl_`, and one `revw_`: the first create is allowed and the second is denied, then the loser's flush adopts the server doc and that id is not in `syncErrors`. The account `rev_` and `agreements/rev_<agreementId>` are the same race, and the two copies differ in `createdBy` and `reversalReason`. Adopt is the same document id plus the same `reversesId`, not `sameContent` (D r4 at `7ac193c5`, Architect F3). The id is not in `syncErrors`. Two `payLabor` uuids both land. An `appr_` and a `rej_` of one body, with neither stored first, can both land. Each owner can read the other's party. A site user cannot read or create the four collections. The fold is not asserted.
- `E28 plain denial`. `write` throws `permission-denied`. The own id is missing. The pointer read is `found`. The id is `failed` once with `رُفض الإرسال`. It is not `synced` and not `parked`. The document remains.
- `E29 project cleanup` (Q15). `dropPending: true` (`public/render.js` lines 1023 and 1039) removes the project's agreements, account rows, and statement approvals, and removes `slotLosers` and `linkRefusals` for that project. `dropPending: false` (`public/firebase-client.js` line 530, `forgetGoneProjects` at line 516) keeps pending rows, refused rows, and those two maps. `pullAccounts` does not skip a row because its `projectId` is in `K.goneProjectNames`. Server rows stay and come back on the next pull. D's merged sketch (`docs/plans/contractor-pr-d-sketch.md` line 646 on main `f1c50704`) says C and F label them.
- `E30 own-id read outcomes`. After `permission-denied` on the write, three fixtures, each at most three reads. Own id `transient`: `kept`, pointer not read, probe not called. Own id `auth`: `authDead`, pointer not read, probe not called. Own id `denied`: `failed` once. The pointer is not read. If the row has a `projectId`, `readProjectProbe` runs. A missing project becomes `رُفض الإرسال لأن المشروع محذوف`. The document stays, not `synced`.
- `E31 inactive profile`. `performFlush`'s line 778 branch runs with a parked id. The loser doc is already in `K.slotLosers` before `applyFlush`. `rejectedLogoutBlock` is true. The id is not dropped from that map.
- `E32 kept id does not arm the tail`. A Q13-kept account id is in `kept`. The tail condition at lines 869-881 is false for that id. No second round starts from it.
- `E33 deleted project, emulator` (EA 2026-11-17 00:15, recorded 02:17, option a, `answers-EA-delegated-0034.md` section «E plan N6», sha256 `e6451babfe4609a1c08187781927a7571e61f3cba8fb87de5d7fadf11067670b`). An owner writes a new account row whose `projectId` is a project the server no longer has. The create is denied. The refusal is plain `رُفض الإرسال` until `readProjectProbe` (`public/firebase-client.js` line 754) reports `exists === false` and `messageAfterProjectProbe` (`public/sync-status.js` line 157) returns `رُفض الإرسال لأن المشروع محذوف`. The test asserts that exact string. A second fixture uses a closed or archived project that still exists: the probe does not relabel it, and the message stays `رُفض الإرسال`. The local document stays in `K.accountTxns`, with its amount and the other fields. The pull does not remove it. The refused export shows that amount and those fields, so the row can be re-entered on another project. E adds no screen.
- `E34 kind match`. Local `appr_`. The own-id server doc has `kind` `rev`. It is not adopted and not `synced`. A pointer whose id starts with `rev_` is not a parent: the flush does not adopt, park, or hold on that pointer.

D's merged sketch tests a missing project only for `agreementCreate`, `cashBodyCreate`, and `statementWithProjectCreate` (`docs/plans/contractor-pr-d-sketch.md` lines 535-539 on main `f1c50704`). The other account leaves that read a project need the same exists-and-active check: `slotBodyCreate` (line 246), `laborQtyCreate` (line 254), `supCreate` (line 267), `approveLaborCreate` (line 278), `laborStlCreate` (line 286), `returnAdvanceCreate` (line 299), `refundLaborCreate` (line 305), `deductCreate` (line 311), `approveDeductCreate` (line 318), `rejCreate` (line 326), `revCreate` (line 333), and `revwCreate` (line 343). E does not edit `firestore.rules`. E33 is the denial those leaves have to produce.

`إرسال الآن` is covered by E16: the second flush's id list is the outbox `applyFlush` returned, which is what the button flushes.

## Strings

Ameer approved all 88 strings in `strings-contractor-module-r2.22.md` (sha256 starts `9d25840a`) and the tab `حسابات` on 2026-11-10 at 11:16 Baghdad. `strings-contractor-module-r2.23` records that approval. E adds none of the 88, and it adds no string outside the 88. `لم يُربط التسديد بالفاتورة` stays out (Q-link-text is phase 2). The Q8 delete sentences are strings 86 and 87. They are approved, and PR F shows them. E does not.

| String                                                | Mark                                              | Where it already is                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `رُفض الإرسال`                                        | reused, already shipped, not one of the 88        | `public/sync-status.js` line 12. A missing or denied dependency.                                                               |
| `رُفض الإرسال لأن المشروع محذوف`                      | reused, already shipped by #72, not one of the 88 | `public/sync-status.js` line 15. A new account row whose project is already deleted. Not a new string.                         |
| `القيد موجود على الخادم بمحتوى مختلف`                 | reused, already shipped, not one of the 88        | `public/sync-status.js` line 13. The pill on a `slotLoser:` key and on a link-refusal uuid.                                    |
| `القيد موجود مسبقاً وتعذر مطابقة محتواه`              | reused, already shipped, not one of the 88        | `public/sync-status.js` line 14. The legacy unverified read of the row being flushed. Not the dependency's fourth error (Q13). |
| `إرسال الآن`                                          | reused, already shipped, not one of the 88        | `public/render.js` line 1114. Flushes the outbox.                                                                              |
| `لم يُرسل`                                            | reused, already shipped, not one of the 88        | `public/sync-status.js` line 195. A row that is still queued.                                                                  |
| `يوجد قيود مرفوضة على هذا الهاتف. صدّرها قبل الخروج.` | reused, already shipped by #72, not one of the 88 | `public/session.js` line 371. Logout while an account refusal or a `slotLosers` row is not exported.                           |

## Sequencing

Parallel work named for this phase: the Baghdad-date fix (`public/session.js`, `public/render.js`; merges first), the foreman export (`public/ledger.js`, `public/render.js`), the PR B code (`public/accounts.js`), and the other phase sketches.

This docs PR adds one file and does not bump the service worker.

The code PR:

| Overlap                                                                                                                | Why it is sequential                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `public/session.js`                                                                                                    | Baghdad-date merges first and edits this file. E adds names on `K` at line 5. Rebase after Baghdad-date. PR B edits `uuid()` only if Ameer includes LOW-3. That is the same file and a different function.                                                                                                         |
| `public/render.js`                                                                                                     | `queueDoc` is lines 89-93. The logout block is lines 547-552 and the rejected CSV is lines 1311-1324. `إرسال الآن` is line 1114 and the click is line 1243. Online flush is line 1486. Startup flush is `public/app.js` line 176. Rebase after the public PRs already on main. E does not edit `public/ledger.js`. |
| `.github/workflows/ci.yml` and `package.json` `test:emulator`                                                          | At `6f4bb1ec` the emulator command is `ci.yml` lines 181-182 and the same string in `package.json`. It already includes `flush-retry.test.js` and `offline-cold-start.test.js`. E appends its file to both copies on its own base.                                                                                 |
| `public/accounts.js`                                                                                                   | No E edit. PR B is not blocked on this file by E.                                                                                                                                                                                                                                                                  |
| `public/sw.js` line 2, `tests/shell-cache.test.js` lines 44, 67, and 98, `tests/webkit-upgrade.test.js` line 19 `MARK` | Q5. Next free at merge time. This docs PR does not bump. Main at `6f4bb1ec` serves `aj-p0-v64`. The code PR does not reserve the next number. Pins, if it edits `public/`, are retaken from those files on its own base.                                                                                           |
| Other phase sketches                                                                                                   | Other paths under `docs/plans/`. This PR does not edit them.                                                                                                                                                                                                                                                       |

`types/checkjs.d.ts` moves if another PR touches `FlushResult` or `SyncRow`. Rebase if it does.

## Revert

The code PR deploys only on Ameer's or EA's go, and only when nobody is entering data. E never edits, migrates, or deletes a Firestore document.

Reverting the code PR does not delete Firestore documents. If phones have queued a new `docType` and E is reverted, `collectionFor` returns null again and `flushOutbox` keeps that id (`public/sync.js` line 611). `outboxEmpty` stays false (`public/session.js` lines 301-314) and logout alerts (lines 371 and 376). Recovery is to ship E again, or a later pull request Ameer approves that drops those specific ids. This sketch does not drop them. Revert writes nothing only before any phone has queued a new id.

`slotLosers` is meta. Reverting the reader leaves the meta value in the database until logout deletes `aj-u-…`. No migration.

## Dependencies

- PR A is on this base. `Accounts.PURPOSES` and `cashPointerErrors` exist. E reads the table and does not change it.
- PR B, when it lands, extends `post`. E's guard row is not built by `post`. The cash test still constructs the object.
- PR C owns the fold. E's job is to keep the winner's id out of `syncErrors` and out of the parked set, so C's fold can see it.
- PR D owns the rules, the allowlists E copies, and the single-client emulator matrix. Ameer deploys the rules. E's code PR states that precondition. If E is in a build before those rules, every new write is denied and becomes a `syncErrors` row. The two-phone server tests are E's (Architect M4 on #80), and they need D's rules on the branch.
- PR F calls `queueDoc` for a party only in a build that contains E. Until then the create button is absent. F also owns the Q8 refusal: the project delete button stays disabled while a person's balance on that project is not zero, using approved strings 86 and 87. E does not add that check. F does not edit `dropProjectLocal`.
- PR K asserts the adopted approval's project figure. E leaves `projectCost` at the null-date `0`.

## Risks

- A `syncErrors` key on a shared id hides the winner. `failed` must not contain that id. The tests E1–E6 and E9 lock it.
- `readServer`'s null (`public/firebase-client.js` lines 755-762) makes not-found, denied, and transient look the same. The dependency path uses `readDependency`. The legacy reader stays for ledger rows.
- `applyFlush` deletes error keys for `synced` and `kept` (lines 174-175). A parked id is deleted too, on purpose, so a previous error on a shared id cannot hide the winner.
- The loser payload has to be copied to `slotLosers` before `mergeById` can replace the row. The flush writes the map first, then drops the outbox ids.
- An approval queued ahead of its body waits one extra flush. It does not spin: the body is still attempted in the first pass, and the next pass finds the body gone from the outbox.
- `dropProjectLocal` (`public/sync.js` lines 542-552) does not yet know the new stores. Q15 says E is the editor of that function for them. F owns the Q8 refusal. The two edits are different functions.
- While a Q13 server error lasts, logout stays refused by «يوجد تغييرات لم تُرسل. أرسلها أولاً ثم اخرج» (`public/session.js` line 376). Recovery is a later pull request Ameer approves. This r3 does not add a retry cap.
- `slotLosers` and `linkRefusals` are removed only when `dropPending` is true. Another phone keeps them until export. The pull does not hide a row because its project was deleted. Server rows stay. A new row for a deleted project is refused and stays on the phone. E never edits, migrates, or deletes a Firestore document.
- Phase 2 stays out: `inv_`, percent milestones, USD, attachments, materials, and the invoice-link sentence.

## Accounting

No new accounting rule. The counted row is the server copy. The lost subtree is not counted, because it is not in `K.accountTxns` and the fold does not read `slotLosers`. A cash row is not removed from the figures by the walk. A labor `deduct` in the subtree is not counted. Rejection wins when both a `rej_` and an `appr_` exist, which is Q7 and is the fold's rule in PR C, not a second rule here.

Those sentences are Ameer's closed decisions in the parent plan (Q1, Q7, Q10). EA, 2026-11-17 00:15, recorded 02:17, chose option a (`answers-EA-delegated-0034.md` section «E plan N6», sha256 `e6451babfe4609a1c08187781927a7571e61f3cba8fb87de5d7fadf11067670b`): the server refuses a new row on a deleted project, the phone shows the existing `رُفض الإرسال لأن المشروع محذوف` (`public/sync-status.js` line 15) only after `readProjectProbe` finds the project missing, a closed or archived project keeps `رُفض الإرسال`, and the row stays. This sketch does not ask محاسب أهل الجزيرة for a new opinion. E paints no balance. Q5 and Q11–Q15 are approved and are not open. C's fold drops an `approveLabor` when a live `rej_` names its body. Live means the `rej_` is in the list, is not a `syncErrors` key, and is not reversed. E does not read `rowIndex`.

## pstack

The app is not pstack-compliant. This sketch does not say it is. No inventory row is marked «مطبّقة» by this docs PR. `docs/PSTACK_INVENTORY.md` is not in the diff.

Plan section 16 names the code PR's rows: `principle-make-operations-idempotent`, `principle-attack-the-premise`, `principle-prove-it-works`, `blast-radius`, `principle-sequence-verifiable-units`. The code PR adds an evidence link on each. It does not flip a status word. Rows that are already «مطبّقة» stay that way. `principle-attack-the-premise` is «ناقصة» today. The code PR can add the evidence. The status word still waits for the inventory's own rule, not for this sketch.

This docs PR uses `architect`. Arena is banned (cost). The slot-adopt shape is the one in section 5, and the alternatives are recorded under Usage. It uses `principle-attack-the-premise` as that record: the pointer list is the premise that failed, and the subtree is the replacement. It uses `principle-exhaust-the-design-space` by writing the rejected shapes down. It does not run the tests, so `principle-prove-it-works` is the code PR's, on E7 through E21.

## Alternatives

The chosen shape hides the walk, the key list, and the dependency read behind `flushOutbox` and `queueRefusal`. The read runs only after a dependent write fails. A caller still uses `queueDoc(id)` and `flushRemote({ fromOutside: true })`.

`putIfMissing` for these ids loses because it cannot tell a retry from a different payload, and the flush would mark the id synced. A named pointer list loses because the next document is always one the list did not name. A second module loses because the flush would exist twice. The public surface adds the refusal, the owner reads, the loser views, and three result fields. That is the whole caller-facing change.

## أسئلة لأمير

ماكو سؤال مفتوح. EA وافق على الافتراضات بتاريخ 2026-11-16 الساعة 00:52 بتوقيت بغداد. النصوص الـ 88 واسم التبويب «حسابات» موافَق عليها من 2026-11-10 الساعة 11:16. ماكو جملة جديدة.

- Q5. رقم الخدمة هو الرقم الفاضي وقت الدمج. تصليح التاريخ هو v59 ويندمج أول. E ما يثبت رقم، ولا v63.
- Q11. كود E ما يبدي. الطلب 72 مو «خلص». ننتظر تأكيد EA إن تيار القيود المرفوضة خلص، وبعد نشر قواعد D.
- Q12. ما نقارن `createdAtServer` ولا `deviceId`. نقارن `createdBy`.
- Q13. خطأ الخادم الغريب على قراءة القيد المعتمد عليه يبقى بالطابور، مثل الانقطاع. الخروج يوقف بجملة التغييرات اللي ما انرسلت، لحد ما القراءة تنجح.
- Q14. دفعة `payLabor` المصنوعة باليد، إذا تشير لموافقة خاسرة، تبقى بالطابور وتنحسب بهالمرور. ما تنفشل وما تدخل `slotLosers`.
- Q15. E يوسّع `dropProjectLocal`. الصف المعلّق أو المرفوض يبقى إذا الحذف مو من هاتف الحاذف. `slotLosers` و`linkRefusals` ينحذفون فقط ويا `dropPending: true`. قواعد الخادم ما تتغير. زر المنع، سؤال Q8، مال PR F.
- صف جديد على مشروع محذوف يرفضه الخادم ويعرض «رُفض الإرسال لأن المشروع محذوف». الصف يبقى على الهاتف بمبلغه وتفاصيله، وما ينمسح بصمت. EA، 2026-11-17 الساعة 00:15، سُجّل 02:17، الخيار أ. المصدر `answers-EA-delegated-0034.md` قسم «E plan N6»، sha256 `e6451babfe4609a1c08187781927a7571e61f3cba8fb87de5d7fadf11067670b`.

## Citations rechecked at main f1c50704

Every `file:line` below was read again on `f1c5070426906e14c2e815c288c7327387115b1a`. #80 adds only `docs/plans/contractor-pr-d-sketch.md`. The `public/` lines from the `6f4bb1ec` list are unchanged, except the four r3 misses:

- `Accounts.PURPOSES` is `public/accounts.js` lines 69-79. `payLabor` is line 73.
- `public/foremen.js` calls `screen.queueDoc` at lines 404, 441, and 467.
- `adoptEntry` is `public/firebase-client.js` line 613.
- `performFlush` is lines 681-882. The inactive-profile `applyFlush` is line 778. The normal one is line 797. `pendingAtStart` is lines 736-742. The finance/terms refusal is lines 846-860. The tail is lines 869-881. `flushRemote` is line 583 and `queueDoc` passes `{ fromOutside: true }` at `public/render.js` line 92.
- F's guard is `public/ledger.js` line 1109, called from `public/render.js` line 944 and reached by `deleteProjectNow` at line 1016.

The `6f4bb1ec` list, for the lines #80 did not move:

- `public/sw.js` line 2 is `const VERSION = 'aj-p0-v64'`. Line 1 is the Q5 comment. `ASSETS` is line 3. `SHELL` is line 5. Pins: `tests/shell-cache.test.js` lines 44, 67, and 98; `tests/webkit-upgrade.test.js` line 19.
- The emulator command is `.github/workflows/ci.yml` lines 181-182, and the same node string is `package.json` `test:emulator`. It includes `flush-retry.test.js` and `offline-cold-start.test.js`.
- `public/sync.js`: `usesPutIfMissing` lines 18-20, `collectionFor` line 23, `foremanReads` line 204, `mergeById` line 282, `sinceClause` line 354, `dropProjectLocal` line 542, keep rule line 552, `flushOutbox` line 594, missing local line 609, unknown shape line 611, `write` line 613, synced mark line 614, dead-auth `kept.push` line 617, transient `kept.push` line 620, unverified catch lines 626-632.
- `public/sync-status.js`: strings lines 12-14, `لم يُرسل` line 195, `isTransient` lines 96-107, `isDeadAuth` lines 125-134, `failureMessage` line 143, conflict return line 144, `applyFlush` lines 169-181, `badgeHtml` lines 189-198.
- `public/firebase-client.js`: `readSetChanged` nulls the map at line 201, `putIfMissing` returns at line 242 when the snap exists, watermark sets at lines 339, 360, and 369, `forgetGoneProjects` line 516 calls `dropProjectLocal` with `dropPending: false` at line 530, `readServer` callback lines 755-762 returns null on a non-auth error.
- `public/render.js`: `queueDoc` lines 89-93, `badgeHtml` call line 521, `rejectedLogoutBlock` lines 547-552, `deleteProjectNow` passes `dropPending: true` at lines 1023 and 1039, `failedMessages` lines 1073-1076, `paintBell` line 1077, `إرسال الآن` line 1114, bell click line 1243, rejected CSV lines 1311-1324, online listener line 1486. Last eight rows are line 654. «عرض جميع القيود» is line 655. Owner CSV is lines 1326-1330.
- `public/session.js`: `K` line 5 already names `parties`, `agreements`, and `accountTxns`. `st.put` line 78. `uuid` line 85. `outboxEmpty` lines 301-314. `SHELL_FILES` line 316. Alerts lines 371 and 376. `aj-u-` delete line 384. Demo lookup line 146.
- `public/app.js` startup flush is line 176. `public/index.html` loads `sync.js` at line 62 and `accounts.js` at line 71. `public/ledger.js`: `countedEntries` lines 307-310, `projectEntryList` line 607.
- D's plan is merged (#80, main `f1c50704`). Blob `4ff65f91118cb3a9e074a72983e488f078b5865a` is the same bytes as r4 head `7ac193c5`. The inline allowlists are a reference copy of that file.

## r3 change table

| Finding | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Lines                               |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| M1      | After a non-transient throw, read the account's own id first. Adopt rules apply to that doc. The pointer is read only when the own id is missing. Own missing plus pointer found is one denial, `رُفض الإرسال`, never synced. A success costs no client read. A failed dependent write costs at most three, the third being `readProjectProbe` only after a refusal. Fixtures throw `permission-denied`. E1 records the own-id read before any pointer read. E28 is the plain denial. | 437-453, 471-472, 488, 494-495, 515 |
| M2      | No Firebase `code`, or a client `invalid-argument` from building the ref, fails once and enters the #72 export. Real server codes other than transient and dead auth stay queued across three flushes, at most one write and two reads, and never enter `syncErrors`. Logout stays refused while that lasts. No new string and no cap.                                                                                                                                                | 446, 454, 478, 505, 575             |
| M3      | `slotLosers` and `linkRefusals` leave only when `dropPending` is true. `dropPending: false` keeps them. r4 N6 removes the pull skip this row used to name. Server rows stay.                                                                                                                                                                                                                                                                                                          | 46, 114, 527                        |
| M4      | Agreement `rev_<agreementId>` is adopted. `collectionFor` routes `docType: 'agreement'` to `agreements`. Slot ids use `replaceAll`. E27 includes that reversal. See F3 for the match.                                                                                                                                                                                                                                                                                                 | 391, 418, 514                       |
| F3      | D r4 at `7ac193c5`. Two owners' reversals differ in `createdBy` and `reversalReason`, so adopt is the same document id plus the same `reversesId`, not `sameContent`. Account `rev_` and the agreement cancellation both say that. E3 and E27 assert `sameContent` is false and the server doc is adopted anyway.                                                                                                                                                                     | 415, 418, 490, 514                  |
| L1      | No claimed service-worker number. Main serves `aj-p0-v64` at `public/sw.js` line 2. The emulator command is `ci.yml` lines 181-182. The code PR retakes pins from its own base.                                                                                                                                                                                                                                                                                                       | 11, 95, 545-547                     |
| L2      | Allowlists are a reference copy of D r4 at `7ac193c5`. One constant per kind. `unitName` and `unitPrice` are not account fields. `unitName` stays on the agreement method group.                                                                                                                                                                                                                                                                                                      | 40, 160-161, 360, 364, 366          |
| L3      | A live `rej_` is in the list, not a `syncErrors` key, and not reversed. E is not a `rowIndex` consumer. `sup_` is a body.                                                                                                                                                                                                                                                                                                                                                             | 415, 583                            |
| L4      | Q14's count is the adoption pass only. The next flush is the M1 denial: failed once, leaves the counted set, and enters the #72 export until exported. E14 has that second flush.                                                                                                                                                                                                                                                                                                     | 441, 501                            |

The M3 row's old pull skip is withdrawn. The pull does not hide a row because its project was deleted.

## r4 change table

| Finding | Fix                                                                                                                                                                                                                                                                                                                             | Lines                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| N1      | The own-id read handles found, missing, transient, dead auth, and denied. Transient stays queued. Dead auth returns `authDead`. Denied fails once with `رُفض الإرسال`. The pointer is not read for those three. E30 covers them, at most three reads each. The third read is `readProjectProbe`, and only after a refusal.      | 450-468, 536                             |
| N2      | `performFlush` writes adopted rows and both maps before the `applyFlush` at line 778 and the one at line 797. Account ids are outside `pendingAtStart`, so #86's refusal cannot hit them. `kept` ids do not arm the tail. Reads are per round. `queueDoc` keeps `flushRemote({ fromOutside: true })`. E31 and E32.              | 43, 118, 120, 477, 481-483, 529-530, 614 |
| N3      | The answers file is sha256 `e6451babfe4609a1c08187781927a7571e61f3cba8fb87de5d7fadf11067670b`. Its «Ameer answers, 2026-11-16 15:35» section is unchanged from `2b3bb1f0`. F's guard is `Ledger.personProjectDeleteBlock` at `ledger.js` line 1109, from `render.js` lines 944 and 1016. `dropProjectLocal` runs only after it. | 13, 59, 114                              |
| N4      | `PURPOSES` is `accounts.js` lines 69-79, `payLabor` line 73. `foremen.js` `queueDoc` is lines 404, 441, 467. `adoptEntry` is `firebase-client.js` line 613. Line 11 says r4. D's plan is merged (#80, main `f1c50704`). The baf4f21 table is labeled r2 history.                                                                | 11, 53, 61, 67, 370, 630-650             |
| N5      | Deploy only on Ameer's or EA's go, and only when nobody is entering data. Never edit, migrate, or delete a Firestore document.                                                                                                                                                                                                  | 571, 595                                 |
| N6      | A new row on a deleted project is refused and stays on the phone with its amount and details. The message is the existing `رُفض الإرسال لأن المشروع محذوف`. The pull does not hide it. D's other account leaves need the exists-and-active check. E33.                                                                          | 536, 550, 609, 635                       |
