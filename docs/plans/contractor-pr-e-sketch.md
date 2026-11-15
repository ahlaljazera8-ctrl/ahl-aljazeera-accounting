# PLAN ONLY: contractor PR E sketch

No code in this pull request. No edit to `public/`, `firestore.rules`, or `public/sw.js`. The code PR comes after the Architect reviews this sketch and Ameer says go.

Parent plan: `plan-contractor-module-r2.28.md`, sha256 `ef1c98d08a7118ed35469d250c81605a7f17f518d949f8446b8c63bb1869c8a2`. Base for every line cited below: `baf4f21fc54c156989334e826d19990b8e5e8a74` (v58, #72). PR A is already on that commit (`public/accounts.js`).

Arena was not run. Ameer's gate bans it (cost). The shape is the one already approved in r2.28 section 5. This file is the sketch those gates asked for before code.

## Scope

Plan r2.28 lines 145-149 and 929-952, plus the adopt rules in section 5 (lines 522-533) and conflict C1 (line 972). Order is A, B, C, then D merged and deployed by Ameer, then E, then F, then K, then G-J. This sketch does not start B, C, D, F, K, or G-J.

From the table, PR E is:

- The adopt path for the slot body, `appr_`, `rej_`, `sup_`, `rev_`, labor `stl_`, and `revw_`.
- Two owner phones, distinct uids, both `role == owner`. No hard-coded uid. The demo uid `u-ameer` (`public/app.js` line 34, looked up at `public/session.js` line 101) is not copied into these tests.
- No `inv_`.
- A transient error stays queued. Not-found or denied fails once. The fix is to re-enter the record.
- The cash-pointer case is a hand-built guard row, not a `PURPOSES` row.
- `إرسال الآن` flushes the outbox. It does not put a failed id back.
- Not silent `putIfMissing`.
- Unknown `docType` is rejected before `queueDoc`.
- `slotLosers` holds the lost subtree. Membership is taken once, at adoption.

Not in E: material purposes, invoice locks, `linkRefusals` text other than the existing conflict sentence, screens, rules, `projectCost`, and the statement fold. PR K asserts the adopted-`appr_` project figure of 700,000. E does not.

Preconditions, both still in front of the code PR. D is deployed by Ameer. Ameer says the rejected-entries stream is finished (Q7, C1). This docs PR does not wait on those and does not start the code.

## Files the code PR edits

| File                                                                        | Change                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `public/sync.js`                                                            | Route `party`, `agreement`, `accountTxn`, and `statementApproval`. `queueRefusal` before any outbox append. `accountReads` / `pullAccounts`, owner only. The adopt step and the one subtree walk live inside `flushOutbox`. `localDoc` is the one id lookup. |
| `public/sync-status.js`                                                     | One `sameContent` key list per new kind. `payloadDiffers` is that list minus the owner-identity fields. `dependencyStatus` splits missing, denied, and transient. `applyFlush` drops `parked` ids and clears any `syncErrors` key on them.                   |
| `public/firebase-client.js`                                                 | `readDependency` for the dependency id. `writeLocal` uses `setDoc` for the new collections. `pull` merges the owner reads. The flush applies adopted rows, `slotLosers`, and `linkRefusals`, then `applyFlush`.                                              |
| `public/session.js`                                                         | Six names on `K` (line 5): `parties`, `agreements`, `accountTxns`, `statementApprovals`, `slotLosers`, `linkRefusals`. IndexedDB stays version 1. The new values are meta, same as `K.foremen`.                                                              |
| `public/render.js`                                                          | `queueDoc` (`public/render.js` lines 89-93) asks `queueRefusal` and returns before the append when the answer is set. No new screen.                                                                                                                         |
| `types/checkjs.d.ts`                                                        | `SyncApi`, `SyncStatusApi`, `FlushCall`, and `FlushResult` gain the fields below. `SyncRow.docType` gains the four new literals.                                                                                                                             |
| `tests/sync-status.test.js`                                                 | The behaviour tests below. Already named by `package.json` and by `.github/workflows/ci.yml`.                                                                                                                                                                |
| `public/sw.js`, `tests/shell-cache.test.js`, `tests/webkit-upgrade.test.js` | Version pins only, after the parallel public PRs. See Sequencing.                                                                                                                                                                                            |

`public/accounts.js` is not edited. The walker reads `Accounts.PURPOSES` at flush time. `payLabor` already has `needsApproval: false` and `effect.cash: 1` (`public/accounts.js` lines 28-38). PR B may change `post` and the pointer table. It does not have to change those two fields for this rule to keep working.

The page loads `sync.js` at `public/index.html` line 62 and `accounts.js` at line 71. The factory must not read `Accounts` while the script is evaluating. The read happens inside the flush, after every script has run. In Node, that read uses `require('./accounts.js')`, the same split `public/sync.js` lines 84-88 already use for `Ledger`, but called from the function, not from the top of the factory.

## Files the code PR does not edit

`firestore.rules`, `public/ledger.js`, `public/index.html`, `public/app.js`, `public/foremen.js`, `package.json`, `.github/workflows/ci.yml`, `docs/PSTACK_INVENTORY.md`.

`queueDoc` stays the only enqueue. `foremen.js` already calls `screen.queueDoc` (lines 375, 412, 438). A foreman `docType` is known, so the new check lets those calls through. No edit there.

No new test file. A second file would have to be added to both `package.json` and `ci.yml`, and those two lists have to stay identical.

`post` still returns a document. It does not call `queueDoc`. E does not call `post` to build the guard row.

## Citations checked at baf4f21

The plan cites older SHAs (`8811b77b`, `020904cd`). These are the lines on this base. A row marked stale is a line number or a claim that is no longer the text at `baf4f21`.

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

| Plan said                                                                                                                                                                                                                                                           | At baf4f21                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Service worker `VERSION` on main is `aj-p0-v56`, and the plan does not reserve `aj-p0-v57` (line 151).                                                                                                                                                              | `public/sw.js` line 1 is `aj-p0-v58`. #71 took v57. #72 took v58. The sentence that remains: the bump is the next free version at merge time. This sketch reserves no number.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| The PR that adds `accounts.js` also adds the script tag (`public/index.html` lines 69-72), `ASSETS` / `SHELL` (`public/sw.js` lines 2-4), and `SHELL_FILES` (`public/session.js` line 263) (line 931).                                                              | Already on this SHA. `accounts.js` is `public/index.html` line 71, before `render.js` line 72. It is on `ASSETS` (line 2) and `SHELL` (line 4). `SHELL_FILES` is `public/session.js` line 271 and already names it. E does not add the tag.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `flushOutbox` walks ids at line 601 and on a transient error does `kept.push` at line 616.                                                                                                                                                                          | The function starts at line 594. The loop is line 605. Line 616 is the dead-auth `kept.push`. The transient `kept.push` is line 620.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| A successful `write` marks the id synced at lines 609-610, which is how silent `putIfMissing` hides a clash.                                                                                                                                                        | The mark is lines 612-614. The behaviour is unchanged: `putIfMissing` does not throw when the doc exists, so the flush treats that id as synced.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| The reversal adopt is lines 631-634.                                                                                                                                                                                                                                | It is lines 635-638.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| An unknown shape is kept at line 607.                                                                                                                                                                                                                               | It is line 611: `if (!collectionFor(local)) { kept.push(id); continue; }`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `applyFlush` is lines 154-165 and never clears the conflict key. `errMap[row.id]` is line 162.                                                                                                                                                                      | `applyFlush` is lines 169-181. Line 176 writes `errMap[row.id]`. Lines 174-175 delete the key for `synced` and for `kept`. A failed id is not deleted. The conflict stays because that id has left the outbox, so a later flush does not see it. The function does clear the key when the same id is later synced or kept.                                                                                                                                                                                                                                                                                                                                                            |
| `failureMessage` is lines 142-145.                                                                                                                                                                                                                                  | It is lines 143-147. The conflict return is line 144.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `badgeHtml` is lines 174-177, called from `public/render.js` line 479.                                                                                                                                                                                              | `badgeHtml` is lines 189-198. The call is `public/render.js` line 509.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| The bell reads `syncErrors` at `public/render.js` lines 968-970. `إرسال الآن` is lines 1008-1009. `paintBell` is lines 972-1013.                                                                                                                                    | `failedMessages` is lines 1048-1051. `paintBell` is lines 1052-1093. The button text is line 1089. The click is line 1209: demo calls `sendNow`, otherwise `flushRemote`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `readServer(local)` is `public/firebase-client.js` lines 639-646 and returns null on any non-auth error.                                                                                                                                                            | Lines 639-646 are the token refresh. The reader is lines 670-678. A non-auth throw is swallowed and the callback returns null (lines 674-677). That is the collapse E replaces for the dependency id.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `outboxEmpty` is `public/session.js` lines 248-261. Logout alerts are lines 310-312. Logout deletes `aj-u-…` at lines 308-325.                                                                                                                                      | `outboxEmpty` is lines 256-269. The alerts are lines 326 and 331. `closeSession` deletes a database whose name starts with `aj-u-` at line 339.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Owner CSV and «عرض جميع القيود» use `countedEntries` at `public/render.js` lines 1196-1199 and `public/ledger.js` lines 469-476. The project card's last eight use `visibleEntries` at `public/render.js` lines 363-366 and 594. `countedEntries` is lines 298-308. | `countedEntries` is lines 307-310. `toCSV` is lines 288-296. The owner CSV download is `public/render.js` lines 1292-1295. «عرض جميع القيود» is the link at line 643 and the view at lines 649-656, which calls `projectEntryList` (`public/ledger.js` lines 607-616) and that helper drops refused ids. The last eight rows are line 642. They come from `data()` (lines 363-365), which uses `visibleEntries` and does not drop `syncErrors`. Line 594 is the party input on the old entry form. `public/ledger.js` lines 469-476 are `subcontractBalance`. The behaviour the plan describes is still true: the card can show a refused row, and the full list and the CSV omit it. |
| #65 is the open pull request for this stream and does not touch `public/sync.js` (C1). #66, #67, #68, and #69 are merged.                                                                                                                                           | #66 through #69 are merged. #72 is this SHA: the deleted-project sentence and the rejected CSV. #65 is still open and still does not touch `public/sync.js`, and its subject is the model table in `AGENTS.md`, not the rejected-entries stream. E still waits until Ameer says that stream is finished. E does not change the CSV or `PROJECT_DELETED` (`public/sync-status.js` line 15).                                                                                                                                                                                                                                                                                            |
| `projectSummary.spent` for the site user is `public/ledger.js` lines 111-115.                                                                                                                                                                                       | The function is lines 111-115. The site branch returns `spent` only. Still true.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Demo uid cited at `public/session.js` line 93.                                                                                                                                                                                                                      | Line 93 is the end of `uuid()`. The `u-ameer` lookup is line 101.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

`dropProjectLocal` starts at `public/sync.js` line 542. The keep rule is line 552. Its return value has no parties, agreements, or account rows. That gap is question 5.

## Usage

A screen, later, saves one document and calls `queueDoc(id)`. `queueDoc` loads that id through `localDoc`. `queueRefusal` returns a code or null. A code means the id is not appended. Null means today's append, then `flushRemote` outside the demo.

`flushRemote` keeps calling `flushOutbox`. The new callbacks are `readDependency` and `mintId`. The result gains `parked`, `slotLosers`, and `linkRefusals`. `firebase-client.js` writes those maps and then calls `applyFlush`. Callers of `queueDoc` do not learn the subtree rule.

A test builds two docs with the same deterministic id and two `createdBy` uids, points `write` at a function that throws `already-exists`, and points `readDependency` at the winner. It asserts the server doc, the parked ids, and an empty `syncErrors` entry for the shared id.

Second design considered: leave the clash on silent `putIfMissing`. Rejected. `putIfMissing` does not compare content (`public/firebase-client.js` lines 239-244), and the flush then marks the id synced (`public/sync.js` lines 612-614). A refusal stored on the shared id hides the winner. The plan already closed that.

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
 * Whether sameContent compares them is question 2. The proposed
 * compared header is id, kind, projectId, partyId, createdBy, createdByName.
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
 *   unitName?: string,
 *   unitPrice?: number,
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
 * unitName and unitPrice count. They are money fields.
 * Question 2 decides createdAtServer and deviceId. Proposed: they do not count.
 */
function payloadDiffers(local, remote)

/**
 * @param {SyncFailure | null | undefined} err
 * @param {boolean | null} exists
 * @returns {'found'|'missing'|'denied'|'transient'|'auth'}
 * exists false and no error is 'missing'.
 * permission-denied is 'denied'.
 * isTransient is 'transient'. isDeadAuth is 'auth'.
 * Question 3 is any other error. Proposed: 'transient', so the row stays queued.
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

`toRemote` copies an allowlist. v1 omits `invoiceNumber`, `invoiceKey`, `lockId`, `custodyAgreementId`, `attachmentIds`, and `roles`. A doc that carries one of those still queues, and the remote copy does not include the key.

`adoptEntry` (`public/firebase-client.js` lines 550-561) stays the ledger reversal copy. An account adopt stores `fromRemote` of the server doc. It does not pass through `adoptEntry`.

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

Logout deletes the whole `aj-u-…` database (`public/session.js` line 339). `slotLosers` and `linkRefusals` go with it. C1 already says that about refused account rows. The same sentence covers these two maps. Another phone has no copy, so it shows no badge for them.

`statementApprovals` has no adopt step. Section 9 says two phones can each finalise, each with its own `createdBy`. The id is not one of the deterministic adopt ids. A same-bytes retry still uses `sameContent`. A real clash uses the existing `failureMessage` path, because that id is not a shared slot id and a `syncErrors` key on it does not hide a winner.

Slot id, already fixed by the plan: `000`, plus the 32 hex digits of the agreement id with hyphens removed, plus one generation character `1`–`9`. `isSlotBody` is true when `docType` is `accountTxn`, `kind` is `body`, and the id matches `/^000[0-9a-f]{32}[1-9]$/`. Generation for the walk is the document's `agreementId`, not a second parse of the id. The id shape only answers "this is a slot".

`sameContent` lists. One array per kind, in `sync-status.js`. The body list is the shared compared header plus the money and quantity fields, including `ledger`. The slot payload is that list minus `createdBy` and `createdByName`. There is no second array.

| Kind   | Keys beyond the compared header                                                                                              |
| ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `body` | `ledger`, `purpose`, `agreementId`, `qty`, `unitName`, `unitPrice`, `amount`, `currency`, `fxRate`, `txnDate`, `description` |
| `appr` | the body keys plus `targetId`. A missing `amount` on both sides matches (`approveDeduct`).                                   |
| `rej`  | `targetId`, `ledger`, `purpose`                                                                                              |
| `sup`  | `supersedesId` plus the body keys                                                                                            |
| `stl`  | `targetId`, `settlesId`, `amount`, `ledger`, `purpose`, `agreementId`, `currency`                                            |
| `rev`  | `reversesId`, `reversalReason`, plus the body keys                                                                           |
| `revw` | `targetId`                                                                                                                   |

Numbers compare with `===`. Strings compare with the existing `norm` (`public/sync-status.js` lines 33-36). A missing amount is not `0`.

## Adopt rules

After `write` throws, and the error is not dead auth and not transient:

1. Same bytes. `sameContent` is true. The id is `synced`. No `syncErrors`. No subtree. This is the lost-ack retry. Two owners do not land here, because `createdBy` is on the compared header.
2. Slot body. Same id. The server doc replaces the local row in `K.accountTxns`. The id is `synced` and `adopted`. It is not a `syncErrors` key. The winner stays in the fold because the fold reads `K.accountTxns` and this id is not in `syncErrors`.
3. If `payloadDiffers` is true, the walk below runs. The local body, the one from before the replace, is stored at `slotLoserKey(id)`. The other parked docs are stored the same way, whole.
4. If `payloadDiffers` is false, there is no subtree. A queued `appr_` of that body is attempted in this pass once the body is in `synced`.
5. `appr_`, `rej_`, `sup_`, and `revw_` with the same id and the same `targetId` adopt the server copy and clear `syncErrors` for that id. `rev_` does the same on `reversesId`. `createdBy` may differ. The adopt still takes the server copy.
6. Labor `stl_` with the same id and the same target, and a different `settlesId` or `amount`, adopts the server winner. The shared id is not a `syncErrors` key. The loser's whole doc is stored under `mintId()`. That uuid is not queued and is not the `stl_` id. The advance id and the cash id stay out of `syncErrors`. The fold does not read `linkRefusals`.
7. A `stl_` that the walk already parked is not also a link refusal, and it is not written.

The walk, once, on the docs already queued at that moment:

- A queued doc joins when `targetId`, `reversesId`, `settlesId`, or `supersedesId` is the slot id or an id already in the set. Repeat to a fixed point.
- A queued slot body of the same `agreementId` whose generation character is higher, and which is already queued, joins, and then the same walk takes its dependents.
- A slot body queued after this pass is not in the set. A later `queueDoc` does not consult the set.
- A labor `deduct` whose `targetId` is an `approveLabor` in the set joins.
- A purpose with `needsApproval === false` and `effect.cash !== 0` does not join. The read is `Accounts.PURPOSES[purpose]`. The hand-built `payLabor` is that case even though it carries a `targetId`. Question 4 is whether this pass also skips `write` for it.
- If `Accounts.PURPOSES` is missing, the pass does not guess. It does not park anything and it does not send the dependents. They stay queued. The production page has loaded `accounts.js` before a flush.

Parked ids are removed from the outbox and from `K.accountTxns`. They have no `syncErrors` key. `applyFlush` would write `errMap[row.id]` (`public/sync-status.js` line 176) and the fold would hide that id. On a shared id that is the winner. This path does not push the shared id, or a parked dependent, through `failed`.

`rev_<slotId>` is in the set when it is queued, so it is not sent and does not reverse the winner's body. `rev_` of `appr_<slotId>` is in the set the same way and does not reverse the winner's approval.

The badge for a lost row is the existing `badgeHtml` (`public/sync-status.js` lines 189-198) with a one-entry map whose key is `slotLoser:<id>` or the link-refusal uuid, and whose message is `SyncStatus.CONFLICT`. Winner rows are drawn from `K.accountTxns` and do not read the maps, so the counted row has no pill. PR F paints the block on the person statement. E's tests call `slotLoserViews`, `linkRefusalViews`, and `badgeHtml`. E does not add a screen, and the PR table says E creates no rows until F.

## Dependency hold

`readServer` on the row being flushed stays for the legacy clash. The dependency read is `readDependency` on `targetId`, `reversesId`, `supersedesId`, or `settlesId`. It is not `readServer(local)`.

For a dependent id, before `write`:

1. Cash purpose (`needsApproval` false and `effect.cash !== 0`): question 4. Proposed: do not `write` it in the adoption pass when its pointer names an id parked in this pass. Leave it in the outbox and in `K.accountTxns`. Do not fail it. The next flush, with that target gone from the outbox, uses the normal write.
2. The pointer id is in `kept` this pass, or still later in the outbox and not yet in `synced`: `kept.push` the dependent. Do not `write`. An approval queued ahead of its body stays queued. The loop still reaches the body. The next flush attempts the approval, because a body that synced in an earlier flush is not a hold.
3. The pointer id is in `failed` this pass: fail the dependent once. Message is `رُفض الإرسال`. Do not keep it and do not park it.
4. The pointer id was parked this pass: the dependent is in the subtree. Do not fail it and do not `write` it.
5. Otherwise `readDependency`:
   - `transient`: `kept`. The next flush tries again.
   - `missing`: `failed` once. Not sent again.
   - `denied`: `failed` once. Not sent again.
   - `found`: `write`.
   - `auth`: return `authDead`, as today's dead-auth branch does (lines 616-618).

There is no retry counter. `إرسال الآن` (`public/render.js` line 1089, click at line 1209) calls `flushRemote` on the current outbox. `applyFlush` has already removed a failed id. The button does not put it back. The correction is to re-enter the record.

A body then its approval, body first in the same list: the body is pushed to `synced`, then the approval is attempted. A transient body keeps the approval and a `rev_` of that body queued. The plan's `inv_` sentence is the same hold. v1 has no `inv_`. The test uses `appr_` and `rev_`.

## Tests

All in `tests/sync-status.test.js`. Each asserts a result field, an id's presence, or the existing conflict string. None asserts a helper's source text. No emulator. D owns the rules tests. E's fakes do not need Firestore.

The plan does not number these. Spec tests 1, 2, 6, 7, 8, 11, 12, and 15 stay with A, B, and C. E does not edit `public/accounts.js`, so `tests/accounts.test.js` stays as it is. The 700,000, 1,300,000, and 100,000 project figures are PR K. E does not call `projectCost`. `CONTRACTOR_COST_START` is null. "Counted once" in the tests below means one adopted doc in the returned account list and no `syncErrors` entry for that id.

Amounts of 600,000 are the Q6 / spec 1 figure, used as data so the adopted approval is recognisable. They are not an assertion that E owns spec 1.

- `E1 two owners, one appr_`. Uids `owner-a` and `owner-b`. Same `appr_` id, same `targetId`, different `createdBy`. Server doc is adopted. The id is not in `failed`. One doc, amount 600,000.
- `E2 two owners, one rej_`. Server doc is adopted. The id is not in `failed`.
- `E3 two owners, one rev_`. Server doc is adopted. The id is not in `failed`.
- `E4 two owners, one revw_ of one payLabor`. Server doc is adopted. The payment id is a different uuid and is still in the account list once. The `revw_` id is not in `failed`.
- `E5 two owners, one sup_`. Server doc is adopted. The id is not in `failed`.
- `E6 two owners, one labor stl_`. Same id, same target, different `settlesId`. Server doc is adopted. The shared id is not in `failed`. The loser is under a minted uuid. The advance id is not in `failed`. `linkRefusalViews` is `readOnly`. `badgeHtml` on that uuid with a one-entry conflict map returns the existing `القيد موجود على الخادم بمحتوى مختلف`.
- `E7 same-bytes retry`. Same `createdBy`. `write` throws `already-exists`. `sameContent` is true. The id is `synced`, not `failed`, not `parked`.
- `E8 usesPutIfMissing('accountTxns')` is false. A differing slot is `adopted`, not silently `synced` with an empty `readDependency`.
- `E9 two phones, same lump slot, different amount, winner unapproved`. The losing phone's result has no `appr_` and no `rev_` in the account list. Those ids are in `parked` and absent from `failed`. They are in `slotLosers`.
- `E10 winner already approved`. The approval id is the adopted server doc and is not in `failed`.
- `E11 slot 2 queued before adoption`. The loser had rejected slot 1 and queued slot 2. Slot 2 is `parked`, in `slotLosers`, absent from the account list, not in `failed`. `write` is not called with slot 2's id.
- `E12 slot 2 queued after the result`. A second `flushOutbox` that contains only that later slot calls `write` with it.
- `E13 loser rows`. Measurement, approval, rejection, labor `stl_`, and a labor `deduct` whose `targetId` is that `approveLabor`: each `slotLoserViews` entry is `readOnly`, the key is `slotLoser:` plus the id, and the key is not the shared id. `badgeHtml` on the winner id with an empty error map is `''`.
- `E14 hand-built guard`. A `payLabor` with `targetId` aimed at the losing `approveLabor`, built as an object, not by `post`. It is not in `parked` and not in `slotLosers`. It is not in `failed`. It remains available to count. `cashPointerErrors` on the real `PURPOSES` table is not this test. Question 4 decides whether `write` is called on this pass.
- `E15 rev_ of the slot id and rev_ of the approval` are `parked`. `write` is not called with either id.
- `E16 missing dependency`. `readDependency` returns `missing`. The dependent is `failed` once, message `رُفض الإرسال`. A second flush whose outbox is the `applyFlush` result does not see that id.
- `E17 denied dependency`. Same as E16 with `denied`.
- `E18 transient dependency`. The dependent is `kept`, not `failed`.
- `E19 body synced on an earlier flush`. The approval is not held. `write` is called with it.
- `E20 body then approval, body first`. Both land in `synced` on one pass.
- `E21 transient body`. The body is `kept`. The `appr_` and the `rev_` are `kept`, not `failed`. The next flush, with `write` succeeding, puts all three in `synced`.
- `E22 queueRefusal`. `docType: 'nope'` is `docType`. `kind: 'inv'` is `kind`. A foreman, a ledger entry, a party, an agreement, an account body, and a statement approval are null. `collectionFor` of an account txn is `accountTxns`. `collectionFor` of `docType: 'nope'` is null.
- `E23 accountReads`. Role `site` returns `[]`. An active owner returns the four collections. `toRemote` of an account doc that has `attachmentIds` omits that key.
- `E24 payload`. A different `unitName` or `unitPrice` makes `payloadDiffers` true. A different `createdBy` alone makes `sameContent` false and `payloadDiffers` false. A different `partyId` makes `payloadDiffers` true.

`إرسال الآن` is covered by E16: the second flush's id list is the outbox `applyFlush` returned, which is what the button flushes.

## Strings

No new Arabic string. v1 count unchanged. `لم يُربط التسديد بالفاتورة` stays out (Q-link-text is phase 2).

| String                                | Mark   | Where it already is                                                                         |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| `رُفض الإرسال`                        | reused | `public/sync-status.js` line 12. Failed dependency. The bell already shows `syncErrors`.    |
| `القيد موجود على الخادم بمحتوى مختلف` | reused | `public/sync-status.js` line 13. The pill on a `slotLoser:` key and on a link-refusal uuid. |
| `إرسال الآن`                          | reused | `public/render.js` line 1089. Flushes the outbox.                                           |
| `لم يُرسل`                            | reused | `public/sync-status.js` line 195. A row that is still queued.                               |

## Sequencing

Parallel work named for this phase: the Baghdad-date fix (`public/session.js`, `public/render.js`; merges first), the foreman export (`public/ledger.js`, `public/render.js`), the PR B code (`public/accounts.js`), and the other phase sketches.

This docs PR adds one file and does not bump the service worker.

The code PR:

| Overlap                                                                                                                | Why it is sequential                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/session.js`                                                                                                    | Baghdad-date merges first and edits this file. E adds names on `K` at line 5. Rebase after Baghdad-date. PR B edits `uuid()` only if Ameer includes LOW-3. That is the same file and a different function.                       |
| `public/render.js`                                                                                                     | `queueDoc` is lines 89-93. Baghdad-date and the foreman export both edit this file. E's hunk is the refusal check in `queueDoc`. Rebase. E does not edit `public/ledger.js`, so the foreman export's ledger hunks do not meet E. |
| `public/accounts.js`                                                                                                   | No E edit. PR B is not blocked on this file by E.                                                                                                                                                                                |
| `public/sw.js` line 1, `tests/shell-cache.test.js` lines 43, 65, and 93, `tests/webkit-upgrade.test.js` line 18 `MARK` | Every public PR bumps these. The value is the next free version at merge time. v58 is what main says now. This sketch does not pick v59.                                                                                         |
| Other phase sketches                                                                                                   | Other paths under `docs/plans/`. This PR does not edit them.                                                                                                                                                                     |

`types/checkjs.d.ts` moves if another PR touches `FlushResult` or `SyncRow`. Rebase if it does.

## Revert

Reverting the code PR does not delete Firestore documents. If phones have queued a new `docType` and E is reverted, `collectionFor` returns null again and `flushOutbox` keeps that id (`public/sync.js` line 611). `outboxEmpty` stays false (`public/session.js` lines 256-269) and logout alerts (lines 326 and 331). Recovery is to ship E again, or a later pull request Ameer approves that drops those specific ids. This sketch does not drop them. Revert writes nothing only before any phone has queued a new id.

`slotLosers` is meta. Reverting the reader leaves the meta value in the database until logout deletes `aj-u-…`. No migration.

## Dependencies

- PR A is on this base. `Accounts.PURPOSES` and `cashPointerErrors` exist. E reads the table and does not change it.
- PR B, when it lands, extends `post`. E's guard row is not built by `post`. The cash test still constructs the object.
- PR C owns the fold. E's job is to keep the winner's id out of `syncErrors` and out of the parked set, so C's fold can see it.
- PR D owns the rules and the emulator tests, and Ameer deploys them. E's code PR states that precondition in its body. If E is in a build before those rules, every new write is denied and becomes a `syncErrors` row.
- PR F calls `queueDoc` for a party only in a build that contains E. Until then the create button is absent. A read-only empty list is F's, and it does not need this adopt path.
- PR K asserts the adopted approval's project figure. E leaves `projectCost` at the null-date `0`.

## Risks

- A `syncErrors` key on a shared id hides the winner. `failed` must not contain that id. The tests E1–E6 and E9 lock it.
- `readServer`'s null (`public/firebase-client.js` lines 674-677) makes not-found, denied, and transient look the same. The dependency path uses `readDependency`. The legacy reader stays for ledger rows.
- `applyFlush` deletes error keys for `synced` and `kept` (lines 174-175). A parked id is deleted too, on purpose, so a previous error on a shared id cannot hide the winner.
- The loser payload has to be copied to `slotLosers` before `mergeById` can replace the row. The flush writes the map first, then drops the outbox ids.
- An approval queued ahead of its body waits one extra flush. It does not spin: the body is still attempted in the first pass, and the next pass finds the body gone from the outbox.
- `dropProjectLocal` does not know the new stores. Question 5.
- Logout drops `slotLosers`. Re-entry after logout needs the person to type the row again. C1 already states that for refused rows.
- Phase 2 stays out: `inv_`, percent milestones, USD, attachments, materials, and the invoice-link sentence.

## Accounting

No new accounting rule. The counted row is the server copy. The lost subtree is not counted, because it is not in `K.accountTxns` and the fold does not read `slotLosers`. A cash row is not removed from the figures by the walk. A labor `deduct` in the subtree is not counted. Rejection wins when both a `rej_` and an `appr_` exist, which is Q7 and is the fold's rule in PR C, not a second rule here.

Those sentences are Ameer's closed decisions in the parent plan (Q1, Q7, Q10). This sketch does not ask محاسب أهل الجزيرة for a new opinion. Questions 2 through 5 are sync behaviour, not a new balance, advance, or export rule.

## pstack

The app is not pstack-compliant. This sketch does not say it is. No inventory row is marked «مطبّقة» by this docs PR. `docs/PSTACK_INVENTORY.md` is not in the diff.

Plan section 16 names the code PR's rows: `principle-make-operations-idempotent`, `principle-attack-the-premise`, `principle-prove-it-works`, `blast-radius`, `principle-sequence-verifiable-units`. The code PR adds an evidence link on each. It does not flip a status word. Rows that are already «مطبّقة» stay that way. `principle-attack-the-premise` is «ناقصة» today. The code PR can add the evidence. The status word still waits for the inventory's own rule, not for this sketch.

This docs PR uses `architect`. Arena is banned (cost). The slot-adopt shape is the one in section 5, and the alternatives are recorded under Usage. It uses `principle-attack-the-premise` as that record: the pointer list is the premise that failed, and the subtree is the replacement. It uses `principle-exhaust-the-design-space` by writing the rejected shapes down. It does not run the tests, so `principle-prove-it-works` is the code PR's, on E7 through E21.

## Alternatives

The chosen shape hides the walk, the key list, and the three-way dependency read behind `flushOutbox` and `queueRefusal`. A caller still uses `queueDoc(id)` and `flushRemote()`.

`putIfMissing` for these ids loses because it cannot tell a retry from a different payload, and the flush would mark the id synced. A named pointer list loses because the next document is always one the list did not name. A second module loses because the flush would exist twice. The public surface adds the refusal, the owner reads, the loser views, and three result fields. That is the whole caller-facing change.

## أسئلة لأمير

هاي الأسئلة الباقية لهاي المرحلة. الباقي محسوب بالخطة. الكود ما يختار الجواب.

**1. تيار القيود المرفوضة.**

كود E ينتظر كلمتك إن التيار خلص، وينتظر نشرك لقواعد D. على `baf4f21` الطلب 72 نازل: جملة «رُفض الإرسال لأن المشروع محذوف» وتصدير القيود المرفوضة. الطلب 65 لسه مفتوح، بس هو نقل جدول النماذج، مو هذا التيار.

اقتراح: اكتب «خلص» لما التيار يخلص عندك، وبعد ما تنشر قواعد D. لحدها ما نكتب كود E. هذي المسودة ما تبدي الكود.

**2. وقت الخادم ومعرّف الجهاز.**

إذا `sameContent` قارن `createdAtServer` أو `deviceId`، إعادة إرسال نفس القيد من نفس الهاتف ما تطابق، لأن الخادم هو اللي يحط الوقت.

اقتراح: ما نقارن هالثنين. نقارن `createdBy`. نفس المالك يعيد الإرسال وينجح. مالكان، كل واحد بمعرّفه، ما يطابقان، والهاتف الخاسر ياخذ نسخة الخادم.

**3. خطأ من الخادم غير الثلاثة.**

قراءة القيد المعتمد عليه ترجع: انقطاع ويبقى بالطابور، مو موجود ويفشل مرة، أو مرفوض صلاحية ويفشل مرة. إذا رجع خطأ رابع؟

اقتراح: يبقى بالطابور، مثل الانقطاع. ما نخليه يفشل مرة، لأن التصحيح إعادة إدخال، والخطأ الغريب ممكن يروح.

**4. دفعة تشير لموافقة خاسرة.**

سطر `payLabor` مصنوع باليد، و`targetId` ماله على موافقة داخل الشغل الخاسر. الخطة تقول يبقى بالطابور وينحسب، وتقول هم إن صف الفلوس ما ينتظر إرسالاً ثانياً.

اقتراح: بمرور التبني نفسه ما نرسله وما نفشله وما ندخله `slotLosers`. يبقى بالطابور وينحسب. الإرسال الجاي يعامله كأي دفعة. إذا القواعد رفضته لأن المؤشر ما يجوز، هذا رفض عادي على معرّف الدفعة، مو إخفاء لموافقة الفائز.

**5. حذف المشروع والقيود الجديدة.**

`dropProjectLocal` اليوم ما يعرف مخازن الشخص الجديدة. إذا أضفناها وما نوسّع الحذف، قيود الشخص تبقى على الهاتف بعد حذف المشروع.

اقتراح: E يوسّع نفس القاعدة الحالية. الصف المعلّق أو المرفوض يبقى إذا الحذف مو من هاتف الحاذف. `slotLosers` و`linkRefusals` لنفس المشروع تنحذف وياه. قواعد الخادم ما تتغير.
