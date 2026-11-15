# PLAN ONLY: contractor PR D sketch

Revision r2, against Architect NOTES on `22f00d41` (review sha256 `dd9ed13ad0758f0bbcf5f621e063453633da5d1b729abaa83b9c66508f0417b5`). r1 blob `8a90b306099ec2fa6511f98c40f36dc26c39ad57`. Ameer's answers of 2026-11-16 00:34 Baghdad, and the 00:36 follow-up, via EA, are recorded in «أجوبة أمير». QUESTIONS-FOR-EA-r1 (sha256 `13723e6e0586d653d55e35be087ab220adb67e32c1a60a61ff1b5dde7d2e5c75`) Q5, Q8, Q9, and Q10 are approved as their defaults (00:52 via EA). Where `answers-EA-delegated-0034` (sha256 `c14b9c8425287d9b787b28a9afae45bf25aaf8aa2a482319e1c9d63d9c91a7da`) differs, that earlier answer wins.

No code in this pull request. No edit to `firestore.rules`, `public/`, or `public/sw.js`. The code PR comes after the Architect reviews this r2 and Ameer says go. Merging the rules and deploying them need the real-data conditions below. This sketch does not merge and does not deploy.

Parent plan: `plan-contractor-module-r2.28.md`, sha256 `ef1c98d08a7118ed35469d250c81605a7f17f518d949f8446b8c63bb1869c8a2`. Base for the citations below: `baf4f21fc54c156989334e826d19990b8e5e8a74` (PR #72, service worker `aj-p0-v58`). `public/accounts.js` from PR A (#71) is already on that commit.

Arena was not run. Ameer's gate bans it (cost). Two shapes were compared below. The chosen shape is the one already written in plan r2.28: each create check is its own function, `let user = get(...)` is the first line inside that function, and the project `get` is inside that same function.

## Scope

Plan r2.28 lines 942 and 145-147, and the v1 cut in section 14. Order is A, B, C, then D merged and deployed by Ameer, then E, F, K, G-J. This sketch is D only. It does not start E, F, K, or G-J.

D is v1 `firestore.rules` and the emulator tests:

- `parties`, `agreements`, `accountTxns`, and `statementApprovals`
- labor slot body, `appr_`, `rej_`, labor `stl_`, `revw_`, and `statementApprovals`
- the nine purposes already in `Accounts.PURPOSES` at this base: `laborQty`, `approveLabor`, `advanceLabor`, `payLabor`, `returnAdvance`, `refundLabor`, `deduct`, `approveDeduct`, `settle`
- agreements: `lump`, `unit`, `daily`, and amount `milestone`. Percent is denied
- writes and reads are any active user with `role == 'owner'`. A second owner is another `users/{uid}` row with that role. No check names a uid
- each create check is a function. The first line inside it is one `let user = get(...)`. A row that has a project has one `let project = get(...)` in that same function. Neither call is `isOwner()`, `me()`, `allowlisted()`, or `projectOpen()`
- create only. `allow update, delete: if false`
- the id-length table from plan section 5, including the rows that are length arithmetic only
- the v1 rows of plan section 7, including generation-2 labor `stl_` touching every document in the 9-read row
- the read-count budget per create, below

Not in D: `inv_`, `hashing.sha256`, `lockId`, `invoiceKey`, `invoiceNumber`, `attachmentIds`, `entryType` on the new rows, a `roles` field, material purposes, `refundPayment`, `payMaterial`, `advanceMaterial`, `approveOwnMoney`, USD as a stored currency, `fxRate` other than 1, `legacyLinks`, a change to `ledgerEntries` / `shapeOk`, project-delete rules, the adopt path, screens, and `public/accounts.js`. Phase 2 stays out (plan lines 105-109 and section 14).

`accountTxnCreate` is the only `allow create` on `accountTxns`. It reads `kind` and `purpose` and calls exactly one leaf. It does not call `get` or `exists`. An `||` of the leaves is the rejected shape: a failing leaf would still perform its gets, and the next leaf would get the user again, so a legal `payLabor` could pass 10 accesses before it was allowed.

## Files the code PR may edit

| File                                   | Change                                                                                                                                                                                                                                                                                                      |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `firestore.rules`                      | Append the four matches and the functions below. Do not edit the ledger match, `shapeOk` (line 83), `projectOpen` (lines 52-54), `isOwner` (line 11), or `idOk` (line 19). Those stay for the rows that already use them.                                                                                   |
| `tests/emulator/account-rules.test.js` | New. The behaviour tests and the length, budget, and `PURPOSES` source checks below.                                                                                                                                                                                                                        |
| `.github/workflows/ci.yml`             | Two edits. On line 181, add `tests/emulator/account-rules.test.js` immediately after `tests/emulator/rules.test.js`. On line 188, raise `"$pass" -lt 45` to the pass total of one green full emulator run, so a skipped `describe` fails CI. Do not guess the number.                                       |
| `docs/PSTACK_INVENTORY.md`             | Evidence on `principle-prove-it-works` and `blast-radius`. `tdd` gets a link only when the code PR's history shows a failing emulator run committed before the rules that make it pass. Do not flip a status word. `setup-pstack` stays «ناقصة» (`docs/PSTACK_INVENTORY.md` line 77). Do not edit that row. |

`tests/rules-constant.test.js` lines 8-30 stay the ceiling check. D does not edit that file. The `PURPOSES` source check lives in the new emulator file.

## Files the code PR must not touch

`public/` (including `public/sw.js`, `public/accounts.js`, `public/session.js`, `public/sync.js`, `public/sync-status.js`, `public/ledger.js`, `public/render.js`, `public/firebase-client.js`, `public/index.html`), `package.json`, `README.md`, `firebase.json`, `firestore.indexes.json`, and every existing test file.

No service-worker bump (Q5). D edits no file under `public/`, so `scripts/sw-version-guard.sh` has nothing to bump. The version at this base is `aj-p0-v58` (`public/sw.js` line 1). D does not reserve a number. A later PR that edits `public/` takes the next free version at its own merge, and that number stays renumberable until then.

`package.json` `test:emulator` (line 7) is a different command from ci.yml line 181. At this base it also lists `tests/emulator/offline-cold-start.test.js`, which the CI line does not. D does not edit `package.json` and does not try to make those two strings identical. The unit lists at `ci.yml` line 68 and `package.json` line 5 are the same 34 files. D adds no unit file, so both stay at 34.

The local command that runs the new file is the CI command with that one path added:

```bash
bash scripts/emulators-exec.sh --only auth,firestore,hosting --project ahl-aljazeera-accounting \
  "node --test --test-concurrency=1 --test-force-exit tests/emulator/rules.test.js tests/emulator/account-rules.test.js tests/emulator/sync.test.js tests/emulator/incremental-pull.test.js tests/emulator/login-relogin.test.js tests/emulator/logout-fields.test.js tests/emulator/app-entry.test.js tests/emulator/offline-reconnect.test.js tests/emulator/session-live.test.js tests/sw-cache.test.js tests/webkit-upgrade.test.js tests/emulator/security-headers.test.js"
```

No composite index. The owner pull is the whole collection, then `createdAtServer >= watermark` (`public/sync.js` `sinceClause`, lines 355-360, applied in `public/firebase-client.js` lines 308-309). A single-field automatic index covers that. `firestore.indexes.json` stays untouched. A later per-project or per-party query, in C or F, needs its own composite, and receipt PR-R also edits that file. Those land in their own PRs, after D.

## Usage

An emulator test signs in as `owner-a`. The admin context has already written `users/owner-a` with `role: 'owner'` and `active: true`, and `projects/p1` with `status: 'active'`. The test calls `setDoc` on `parties/{id}`. `partyCreate` gets that user document once and allows the create. `owner-b` is a second uid with the same role and `active: true`. His create is allowed, and `createdBy` is his uid. A site user, an inactive owner, and a signed-out client are denied. No test uses the demo uid `u-ameer`.

The same pattern covers agreements and `accountTxns`. The test never calls `isOwner()`. The rules function does not either.

Second design considered: one shared helper that calls the existing `isOwner()` and `projectOpen()`. Rejected. `isOwner()` is `allowlisted()` plus `me()` (`firestore.rules` lines 10-11), which is `exists` plus `get` of the same user. `projectOpen()` is `exists` plus `get` of the same project (line 53). The plan forbids that pair. On the generation-past-1 labor `stl_` those two pairs would add four accesses to the 9 and the allow would be over 10. Arena was not run.

## Types and signatures

The document types live in `tests/emulator/account-rules.test.js`. The rules functions live in `firestore.rules`. Rules have no JSDoc parser; the `/** */` blocks below are comments the code PR pastes above each function. Helpers that are not create checks take no document `get`. `purposeOk` is the only purpose list in the rules file. The source test fails if it drifts from `Accounts.PURPOSES`, or if a purpose in that table is missing from `accountTxnCreate`. There is no third list. Rules cannot import `public/accounts.js`.

```javascript
/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   note?: string,
 *   createdBy: string,
 *   createdAtServer: unknown,
 *   deviceId: string
 * }} Party
 * No `roles` field. No balance.
 */

/**
 * @typedef {'lump'|'unit'|'daily'|'milestone'} AgreementMethod
 */

/**
 * @typedef {{
 *   id: string,
 *   partyId: string,
 *   projectId: string,
 *   method: AgreementMethod,
 *   description: string,
 *   currency: 'IQD',
 *   lumpAmount?: number,
 *   unitRate?: number,
 *   unitQty?: number,
 *   unitName?: string,
 *   dayRate?: number,
 *   milestoneAmount?: number,
 *   milestoneMode?: 'amount',
 *   createdBy: string,
 *   createdAtServer: unknown,
 *   deviceId: string
 * }} Agreement
 * Exactly one method group is set. `milestoneMode: 'percent'` is not a value
 * this type accepts. v1 currency is `'IQD'` only. The field stays named
 * `currency` so a later USD allow is a rules change, not a migration.
 */

/**
 * @typedef {'body'|'appr'|'rej'|'sup'|'stl'|'rev'|'revw'} AccountKind
 */

/**
 * @typedef {'laborQty'|'approveLabor'|'advanceLabor'|'payLabor'|'returnAdvance'|'refundLabor'|'deduct'|'approveDeduct'|'settle'} V1Purpose
 */

/**
 * @typedef {{
 *   id: string,
 *   kind: AccountKind,
 *   projectId: string,
 *   partyId: string,
 *   purpose?: V1Purpose,
 *   ledger?: 'labor',
 *   agreementId?: string,
 *   targetId?: string,
 *   settlesId?: string,
 *   reversesId?: string,
 *   supersedesId?: string,
 *   reversalReason?: string,
 *   txnDate?: string,
 *   qty?: number,
 *   amount?: number,
 *   currency?: 'IQD',
 *   fxRate?: 1,
 *   description?: string,
 *   createdBy: string,
 *   createdByName?: string,
 *   createdAtServer: unknown,
 *   deviceId: string
 * }} AccountTxn
 * `lockId`, `invoiceKey`, `invoiceNumber`, `attachmentIds`, `entryType`,
 * and `roles` are absent. `approveDeduct` and `revw_` store no `amount`.
 */

/**
 * @typedef {{
 *   id: string,
 *   partyId: string,
 *   projectId?: string,
 *   periodKind: 'week' | 'month',
 *   periodStart: string,
 *   periodEnd: string,
 *   createdBy: string,
 *   createdAtServer: unknown
 * }} StatementApproval
 * No `reviewGen`, no `includedIds`, no figures, no `deviceId`.
 * `periodKind` is `week` or `month` only (Q10). Answered, 2026-11-16 00:36 via EA.
 * The screen shows «أسبوعي» and «شهري». Saturday-to-Friday is the screen, not a rule.
 */
```

```javascript
/**
 * Dispatcher. No `get` and no `exists`. Exactly one leaf runs.
 * `kind` is read with `in`. `purpose` is read only when the key is present,
 * so a marker that has no `purpose` does not throw.
 * @returns {boolean}
 */
function accountTxnCreate()

/**
 * @returns {boolean}
 * Reads: 1. `user`. No project. A party has no `projectId`.
 */
function partyCreate()

/**
 * @returns {boolean}
 * Reads: 3. `user`, project, party.
 */
function agreementCreate()

/**
 * @returns {boolean}
 * Reads: 3. `user`, the original agreement, project.
 * Id is `rev_` plus the agreement uuid (Q9). Same keys as an agreement, plus `reversesId`.
 * Answered, 2026-11-16 00:34 via EA. The original id must be a uuid, not a `rev_`.
 */
function agreementReversalCreate()

/**
 * @returns {boolean}
 * Lump or amount-milestone body. Generation 1 reads 5: `user`, agreement,
 * project, party, `!exists(agreements/rev_<agreementId>)`.
 * Generation past 1 reads 7: those five, plus `exists` of `rev_` of the
 * previous `appr_`, plus `exists` of `rej_` of the previous slot.
 * Both generations require `uuidOk(agreementId)` and
 * `!exists(agreements/rev_<agreementId>)`. A `rev_<id>` is not an agreement id.
 */
function slotBodyCreate()

/**
 * @returns {boolean}
 * Unit or daily `laborQty` whose id is a uuid. Reads: 5. `user`, agreement,
 * project, party, `!exists(agreements/rev_<agreementId>)`.
 * `agreementId` must pass `uuidOk`. A lump or amount-milestone agreement is denied here.
 */
function laborQtyCreate()

/**
 * @returns {boolean}
 * Reads: 5, or 6 when the body stores `agreementId`. `user`, project, party,
 * the old body, `exists` of `appr_` of that body, and, when `agreementId` is
 * present, `!exists(agreements/rev_<agreementId>)`. That check is an
 * `exists` behind `&&`, not a `get` of a document that may be absent.
 * Allowed only when the old purpose has `needsApproval` (`laborQty` or `deduct`)
 * and the old id is not a slot id. Depth 5 is denied. A stored `agreementId` must pass `uuidOk`.
 */
function supCreate()

/**
 * @returns {boolean}
 * Reads: 8. `user`, target, agreement, project, party, `exists` of `rej_` of
 * the target, `exists` of `sup_` of the target, `!exists(agreements/rev_<agreementId>)`.
 * `agreementId` must pass `uuidOk`. A cancelled agreement denies the approval.
 */
function approveLaborCreate()

/**
 * @returns {boolean}
 * Call sites: 9. Generation 1 requires 8. Generation past 1 requires all 9.
 * The ninth is `exists` of `rev_` of the previous `stl_`, not a `get`.
 * This is the worst v1 create. Do not add another `let`. The cap is 10.
 */
function laborStlCreate()

/**
 * @returns {boolean}
 * `payLabor` or `advanceLabor`. Reads: 3. `user`, project, party.
 * Does not read `revw_`.
 */
function cashBodyCreate()

/**
 * @returns {boolean}
 * Reads: 5. `user`, project, party, the named `advanceLabor`, `exists` of `rev_` of that advance.
 */
function returnAdvanceCreate()

/**
 * @returns {boolean}
 * Reads: 5. `user`, project, party, the named `payLabor`, `exists` of `rev_` of that payment.
 */
function refundLaborCreate()

/**
 * @returns {boolean}
 * Reads: 5. `user`, project, party, `get` of the `approveLabor`, `exists` of `rev_` of that approval.
 */
function deductCreate()

/**
 * @returns {boolean}
 * Reads: 6. `user`, the `deduct` body, project, party, `exists` of `rej_` of that body,
 * `exists` of `sup_` of that body. Stores no `amount`.
 */
function approveDeductCreate()

/**
 * @returns {boolean}
 * Reads: 5. `user`, the target body, project, party, `exists` of `appr_` of that body.
 * Denied when that `appr_` is already stored. A race where neither doc exists yet
 * can still land both. The fold that lets `rej_` win is not this PR.
 */
function rejCreate()

/**
 * @returns {boolean}
 * Reads: 3. `user`, the row named by `reversesId`, project. No separate party get.
 * The original's `kind` is `body`, `sup`, `appr`, `stl`, or `revw`. `kind == 'rev'` is denied.
 */
function revCreate()

/**
 * @returns {boolean}
 * First mark (`revw_` plus the cash id): 3 reads. `user`, the cash row, project.
 * A later mark (`revw_` plus that id plus `_` plus `1`–`9`): 4 reads. Those three,
 * plus `exists` of `rev_` of the previous mark. The plan's table says 3 and does
 * not name that fourth access. Section 7 test 13 needs it, or `revw_<id>_1` would
 * be allowed while the first mark is still live. 4 is still under the 9-read worst case.
 */
function revwCreate()

/**
 * @returns {boolean}
 * Reads: 3. `user`, party, project. Used only when `projectId` is present.
 * The dispatcher chooses this leaf from the key, before any `get`.
 * Does not get `accountTxns` and does not look for `revw_`.
 */
function statementWithProjectCreate()

/**
 * @returns {boolean}
 * Reads: 2. `user`, party. No project `get`. A missing project must not be got.
 * Consolidated statement: `projectId` is absent.
 */
function statementConsolidatedCreate()

/**
 * @returns {boolean}
 * Reads: 1. `user`. Owner and `active == true`. Used for `allow read` on the
 * four new collections. A site user reads none of them.
 */
function accountRead()

/**
 * Pure. No document access.
 * @param {string} purpose
 * @param {string} ledger
 * @returns {boolean}
 */
function purposeOk(purpose, ledger)

/**
 * Pure. True only for `laborQty` and `deduct`.
 * @param {string} purpose
 * @returns {boolean}
 */
function needsApproval(purpose)
```

`ownerOk`, `projectActive`, `uuidOk`, `bodyIdOk`, `isSlotId`, `headerOk`, `iqdOk`, and `prevGen` are pure. They are not create checks and they do not call `get` or `exists`. `headerOk` compares `createdByName` to `user.data.displayName` from the user binding the leaf already holds. It does not call `me()`.

The first line of every create function above, except `accountTxnCreate` and the two pure predicates, is:

```
let user = get(/databases/$(database)/documents/users/$(request.auth.uid));
```

A missing user makes `get` fail, so the request is denied. That is the allowlist check. `signedIn()` is not required as a second read: a null `request.auth` fails the path and the request is denied.

## Rules shape

Shared writer checks on every new create: `idOk` (existing, line 19), `hasOnly` the key list for that kind, `createdBy == request.auth.uid`, `createdAtServer == request.time`, `deviceId` a string of length 1–128 where the document has `deviceId`. `createdByName`, when present, is 1–80 characters and equals `user.data.displayName`.

Money, where the document has it: `currency == 'IQD'`, `fxRate == 1`, `amount` an int from 1 through `MAX_AMOUNT_IQD()` (rules line 18, the same 10000000000 as `public/ledger.js` lines 117-118). `txnDate` uses the existing `entryDateOk`. A fraction, 0, and 10000000001 fail.

`purposeOk` pairs, each with ledger `labor`:

| Purpose         | needsApproval | Effect the rules do not store                |
| --------------- | ------------- | -------------------------------------------- |
| `laborQty`      | yes           | zeros until `approveLabor`                   |
| `approveLabor`  | no            | the approval carries the cost                |
| `advanceLabor`  | no            | cash body                                    |
| `payLabor`      | no            | cash body                                    |
| `returnAdvance` | no            | names an `advanceLabor`                      |
| `refundLabor`   | no            | names a `payLabor`                           |
| `deduct`        | yes           | counts only after `approveDeduct`            |
| `approveDeduct` | no            | no `amount`                                  |
| `settle`        | no            | kind `stl`, amount capped at the one advance |

The effect column is the plan's table. The rules do not store `effect`. They store the purpose, and the fold in a later PR applies the multipliers.

Caps the rules do enforce, each against the one named document:

- `refundLabor.amount` ≤ `get(payLabor).amount`
- `returnAdvance.amount` ≤ `get(advanceLabor).amount`
- `deduct.amount` ≤ `get(approveLabor).amount`
- `settle.amount` ≤ `get(advanceLabor).amount`
- `partyId`, `projectId`, and `currency` equal that named document

A running total of several refunds, several deducts, or `returnAdvance` plus `settle` is not a rules check. Rules cannot see the sibling rows. Two creates that each fit the named row both succeed. The phone refuses the cumulative sum in PR B. D does not add that sum and does not claim the server enforces it.

`payLabor` and `advanceLabor` have no `targetId`, `settlesId`, `supersedesId`, or `reversesId`. `عن عمل معتمد` is a label, not a pointer. `sup_` of either purpose is denied. `refundLabor` requires `targetId` at a live `payLabor`. That pointer is legal.

`approveLabor` id is `appr_` plus the measurement id. The measurement id matches `^(sup_){0,4}[0-9a-f-]{36}$`. Identity fields equal to `get(target)`: `partyId`, `projectId`, `agreementId`, `ledger`, `currency`, `fxRate`. The target's purpose is `laborQty`. For `unit` and `daily`, `qty` is on the measurement and on the approval, and those two `qty` values are equal. The formula then uses that `qty` and the agreement:

- `unit`: `amount * unitQty == qty * unitRate`, every operand an int. `qty` and `unitRate` and `dayRate` each at most 100000000. `unitQty` at most 1000000. Each product at most 10000000000000000.
- `daily`: `amount == qty * dayRate`
- `lump`: `amount == lumpAmount`, no `qty`
- `milestone`: the key `milestoneMode` is required and must be `'amount'`, and `amount == milestoneAmount`. A missing `milestoneMode` is denied. Percent is denied. No `qty`. B's sketch treats a missing mode as amount for old in-memory fixtures. D does not. F's writer always sets `'amount'`. That is the one contract (Architect M2, accepted 2026-11-16 00:36 via EA)

`unitQty` 1000001 is denied. `unitQty` 1000000 with `amount` 10000000000 is allowed. The product 10000000000000000 is inside the rules bound. The phone checks that product with `BigInt` because it is above `Number.MAX_SAFE_INTEGER`. D does not change the phone.

Slot id, for `lump` and amount `milestone` only: `'000' + agreementId.replace('-', '') + gen` with `gen` one character `1`–`9`, length 36. The plan's expression is the one the code PR writes. The test vector locks it: agreement `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee` produces `000aaaaaaaabbbbccccddddeeeeeeeeeeee1`. If the emulator replaces only the first hyphen, that test fails and the code PR stops. It does not ship a second formula in advance. Generation `n` greater than 1 is allowed when `rev_` of `appr_` of slot `n-1` exists, or when `rej_` of slot `n-1` exists. A uuid body on that agreement is denied. `sup_` of a slot id is denied. There is no generation 10.

`stl_` id is `stl_` plus the measurement id plus `_` plus one generation character. It does not contain `appr_`. Generation past 1 requires `rev_` of the previous `stl_`. The approval `appr_` plus the measurement id must be live: the approval exists and `rev_` of it does not. The advance named by `settlesId` must be a live `advanceLabor`. `rej_` of the measurement must be absent. Same party, project, and currency on the measurement, the approval, and the advance. Currency is `IQD` on both sides.

`revw_` names a cash body: `payLabor`, `advanceLabor`, `returnAdvance`, or `refundLabor`. `revw_` of a `deduct` is denied. The cash create does not read `revw_`. The first id is `revw_` plus the cash id. After `rev_` of that id, the next id is `revw_` plus the cash id plus `_` plus `1`, and so on through `9`. No `amount`.

`statementApprovals` stores only the `StatementApproval` keys. `periodKind` is `week` or `month` (Q10). Anything else is denied. The server accepts the document while cash rows are still unreviewed. Two owners can each create one, because each id is a fresh uuid. `periodStart` and `periodEnd` pass `entryDateOk`, and `periodStart <= periodEnd`. A start after the end is denied. An extra key, including `includedIds` or a figure, is denied. A missing party is denied. The week starting on Saturday is a screen rule. It is not a rules predicate. The project `get` lives only in `statementWithProjectCreate`. `statementConsolidatedCreate` does not get a project.

The reversal document is `agreements/rev_<agreementId>` (Q9). Every labor measurement (`laborQtyCreate`), every slot body (`slotBodyCreate`, both generations), and `approveLaborCreate` require `uuidOk(agreementId)` and `!exists(/databases/$(database)/documents/agreements/$('rev_' + agreementId))`. That is one `exists`, not a `get`, and not a document under `accountTxns`. `rev_` plus a uuid does not pass `uuidOk`, so the reversal itself cannot be named as the agreement. Q9 does not drop this check. س٢-ب (2026-11-16 00:36 via EA) is the earlier answer and it wins: a cancelled agreement refuses new work and new approval. The counts stay inside 10: measurement 5, slot generation 1 is 5, slot past generation 1 is 7, `approveLabor` is 8. A `sup_` of a `laborQty` uses the same `exists` when it stores `agreementId` (the sixth read). Deny tests cover each of those paths.

`rej_` is a marker: shared header plus `targetId`. No `amount` and no `purpose`. It is denied when `appr_` of that target is already stored. The target purpose has `needsApproval`. A slot may be rejected. That rejection is what frees the next slot generation.

A reversal copies `purpose`, `ledger`, `amount` (only when the original has it), `currency`, `fxRate`, `projectId`, `partyId`, and `agreementId` (only when the original has it). `reversalReason` is 1–500 characters. `createdBy` is the owner who writes the reversal, not the original's author. Any active owner may reverse another owner's row.

Agreement method groups, `hasOnly` plus the one group: `lumpAmount`, or `unitRate`+`unitQty`+`unitName`, or `dayRate`, or `milestoneAmount`+`milestoneMode`. `unitName` is a trimmed string, 1–80, the same cap as a party `name`. The plan names the field and does not give it a second cap. `description` on an agreement is 1–500. Party `name` is a trimmed string, 1–80. `note`, when present, is a string of length 0–200.

`entryType` is absent on every new document, so `collectionFor` (`public/sync.js` lines 23-31) cannot send the row to `ledgerEntries`. A ledger create that adds `partyId` still fails `shapeOk`. That match is not edited.

## Read budget

One access per named document. No `exists` plus `get` of the same document. No call to `projectOpen` or `isOwner` from a new function. Firebase documents `&&` and `||` as short-circuit, and documents a cap of 10 `let` bindings per function. It does not document that `let` is lazy. This sketch does not claim that. A binding that is not required on every allow path of that function is an `exists`, never a `get` of a document that may be missing. A `get` that is not on every allow path is a separate function, chosen by the dispatcher before any `get`. The source test fails a function with more than 10 `let` bindings. `laborStlCreate` has 9. One more `let` would reach the cap, so ids are written inline in the `get` and `exists` paths. The emulator does not return a read counter. The behaviour matrix below is the proof that each condition can change allow into deny.

| Create                           | Reads     | What is read                                                                                                                   |
| -------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `partyCreate`                    | 1         | `user`                                                                                                                         |
| `agreementCreate`                | 3         | `user`, project, party                                                                                                         |
| `agreementReversalCreate`        | 3         | `user`, original agreement, project                                                                                            |
| Slot body, generation 1          | 5         | `user`, agreement, project, party, `exists` `agreements/rev_<agreementId>`                                                     |
| Slot body, generation past 1     | 7         | those five, `rev_` of the previous `appr_`, `rej_` of the previous slot                                                        |
| Unit or daily `laborQty`         | 5         | `user`, agreement, project, party, `exists` `agreements/rev_<agreementId>`                                                     |
| `supCreate`                      | 5, or 6   | `user`, project, party, old body, `appr_` of that body, and `agreements/rev_<agreementId>` when `agreementId` is present       |
| `approveLabor`                   | 8         | `user`, target, agreement, project, party, `rej_` of the target, `sup_` of the target, `exists` `agreements/rev_<agreementId>` |
| Labor `stl_`, generation 1       | 8         | `user`, project, measurement, `appr_`, that approval's `rev_`, the advance, the advance's `rev_`, `rej_` of the measurement    |
| Labor `stl_`, generation past 1  | 9         | the generation-1 list plus `rev_` of the previous `stl_`                                                                       |
| `payLabor` or `advanceLabor`     | 3         | `user`, project, party                                                                                                         |
| `returnAdvance` or `refundLabor` | 5         | `user`, project, party, the named row, `rev_` of that row                                                                      |
| Labor `deduct`                   | 5         | `user`, project, party, the `approveLabor`, `rev_` of that approval                                                            |
| `approveDeduct`                  | 6         | `user`, the `deduct` body, project, party, `rej_` of that body, `sup_` of that body                                            |
| `rejCreate`                      | 5         | `user`, target body, project, party, `appr_` of that body                                                                      |
| `revCreate`                      | 3         | `user`, the row named by `reversesId`, project                                                                                 |
| `revw_`, first mark              | 3         | `user`, the cash row, project                                                                                                  |
| `revw_`, generation mark         | 4         | those three, plus `rev_` of the previous mark                                                                                  |
| `statementWithProjectCreate`     | 3         | `user`, party, project                                                                                                         |
| `statementConsolidatedCreate`    | 2         | `user`, party                                                                                                                  |
| `accountRead`                    | 1 per doc | `user`                                                                                                                         |

The worst create is still 9. `approveLabor` is 8 after the reversal `exists`. Slot generation past 1 is 7. Unit or daily `laborQty` is 5. All stay under 10. Party, agreement, `sup_`, `rej_`, and the unit/daily body are not separate rows in the plan's v1 table. The counts above are that same convention, plus the one `exists` Ameer required for a reversed agreement. They are not a new cap.

`laborStlCreate` generation past 1, in order:

1. `get` user
2. `get` project
3. `get` the measurement
4. `get` `appr_` plus the measurement id
5. `exists` `rev_` of that approval (must be absent)
6. `get` the advance
7. `exists` `rev_` of the advance (must be absent)
8. `exists` `rej_` of the measurement (must be absent)
9. `exists` `rev_` of the previous `stl_` (must be present)

Generation 1 does not require item 9. Item 9 is an `exists`, so a missing previous reversal does not fail a `get`. The generation-1 allow test is the proof of that short path. The function still has 9 access call sites and 9 `let` bindings, which is under the documented cap of 10.

## Id-length table

Plan section 5. `idOk` is `^[A-Za-z0-9_-]{1,64}$` (`firestore.rules` line 19). The test builds these strings and asserts the lengths. It does not call `hashing.sha256`. It does not create an `inv_` document. The `inv_` rows are length arithmetic only, because those rules are phase 2.

| Chain                                               | Id length | `rev_` of that id | Fits 64                                       | What D does with it                                             |
| --------------------------------------------------- | --------- | ----------------- | --------------------------------------------- | --------------------------------------------------------------- |
| Body uuid                                           | 36        | 40                | yes                                           | labor and cash ids                                              |
| `appr_` + uuid                                      | 41        | 45                | yes                                           | `approveLabor`, `approveDeduct`                                 |
| `rej_` + uuid                                       | 40        | 44                | yes                                           | `rej_`                                                          |
| `sup_` once + uuid                                  | 40        | 44                | yes                                           | `sup_` of a unit/daily body or a deduct                         |
| `sup_` four times + uuid                            | 52        | 56                | yes                                           | depth 4 is the last legal body                                  |
| `appr_` + four `sup_` + uuid                        | 57        | 61                | yes                                           | allowed                                                         |
| `rej_` + four `sup_` + uuid                         | 56        | 60                | yes                                           | allowed                                                         |
| `inv_` + 54 hex + `_` + gen                         | 60        | 64                | yes                                           | length only. No rule                                            |
| `stl_` + body (36, or 52 at depth 4) + `_` + gen    | 42, or 58 | 46, or 62         | yes                                           | labor `stl_`                                                    |
| r2.5 `stl_` + `appr_` of a depth-4 body + `_` + gen | 63        | 67                | no, withdrawn                                 | length only. The `rev_` fails `idOk`. D does not use this shape |
| `revw_` + body (36, or 52)                          | 41, or 57 | 45, or 61         | yes                                           | first mark                                                      |
| `revw_` + depth-4 body + `_` + gen                  | 59        | 63                | yes                                           | later mark                                                      |
| `sup_` five times + uuid                            | 56        | 60                | the id fits, and `rev_` + `appr_` of it is 65 | depth 5 is denied                                               |
| r2 `inv_` + 58 hex + `_` + gen                      | 64        | 68                | no, withdrawn                                 | length only                                                     |

The slot id is also 36 characters, so its `appr_` and `rev_` lengths match the uuid row. The test still builds the hyphen-stripped vector above so a bad `replace` cannot hide behind the uuid row.

## Tests

All in `tests/emulator/account-rules.test.js`. Each name is the test the code PR copies. Behaviour tests assert allow or deny. They do not assert a helper's source. Source tests are named `source:`. `rules-constant.test.js` is not edited.

Owners in every fixture: `owner-a` and `owner-b`, distinct uids, both `role == 'owner'` and `active: true`. Also `site-1` (`role == 'site'`, active) and `owner-off` (`role == 'owner'`, `active: false`). No fixture copies `u-ameer`.

Header spoof, one leaf per collection. Each of these denies `createdBy` other than the auth uid, `createdAtServer` other than `request.time`, `createdByName` other than that user's `displayName`, `deviceId` of length 0, `deviceId` of length 129, and one extra key:

- `header: partyCreate denies a spoofed header and an extra key`
- `header: agreementCreate denies a spoofed header and an extra key`
- `header: cashBodyCreate denies a spoofed header and an extra key`
- `header: statementWithProjectCreate denies a spoofed header and an extra key`

Project state, on a create that has `projectId`:

- `project: agreementCreate denies a closed project, an archived project, and a missing project`
- `project: cashBodyCreate denies a closed project, an archived project, and a missing project`
- `project: statementWithProjectCreate denies a closed project, an archived project, and a missing project`

Cancelled agreement. The document is `agreements/rev_<agreementId>`. Each path below is denied when that document exists, and allowed when it does not:

- `cancel: slot generation 1 denies agreements/rev_<agreementId>`
- `cancel: slot generation past 1 denies agreements/rev_<agreementId>`
- `cancel: laborQty denies agreements/rev_<agreementId>`
- `cancel: approveLabor denies agreements/rev_<agreementId>`
- `cancel: sup_ of a laborQty denies agreements/rev_<agreementId>`
- `cancel: an agreementId of rev_<uuid> is denied on slot, laborQty, and approveLabor`

Section 7, v1 rows. The plan's item numbers stay in the name.

- `s7.1 signed-out client cannot read or write the four collections`
- `s7.1 inactive owner cannot read or write the four collections`
- `s7.2 party create once; second setDoc, update, and delete fail`
- `s7.2 agreement create once; second setDoc, update, and delete fail`
- `s7.2 agreementReversalCreate allows rev_<agreementId> with the same fields plus reversesId; a second setDoc, an update, and a delete fail`
- `s7.2 an accountTxn update and delete fail`
- `s7.3 lump, unit, daily, and amount milestone each succeed with only their fields`
- `s7.3 a mixed method fails; amount 0, a fraction, and 10000000001 fail`
- `s7.3 milestoneMode percent fails; a missing milestoneMode fails; on the agreement and on approveLabor`
- `s7.4 IQD with fxRate 1450, a fraction, or no fxRate fails; currency USD fails; fxRate 1 succeeds`
- `s7.5 approveLabor whose partyId, projectId, agreementId, currency, or fxRate differs from the measurement fails`
- `s7.5 approveLabor denies when rej_ of the target exists, and denies when sup_ of the target exists`
- `s7.5 unit denies an inexact split; daily, lump, and amount milestone deny a different amount`
- `s7.5 unitQty 1000001 is denied; unitQty 1000000 with amount 10000000000 is allowed`
- `s7.5 a second body with the same slot id fails; a uuid body on a lump agreement fails`
- `s7.5 generation n succeeds when rev_ of appr_ of slot n-1 exists`
- `s7.5 generation n succeeds when rej_ of slot n-1 exists`
- `s7.5 sup_ of a slot body fails`
- `s7.5 sup_ denies when appr_ of the old body exists`
- `s7.5 depth 5 sup_ is denied as a create, not only as a length`
- `s7.5 update and delete of a labor stl_ fail`
- `s7.6 generation-1 labor stl_ is allowed when its 8 documents are in the allowing state`
- `s7.6 generation-1 labor stl_ denies an amount above the advance`
- `s7.6 generation-1 labor stl_ denies a party, project, or currency mismatch`
- `s7.6 generation-2 labor stl_ succeeds only when all 9 documents are in the allowing state`
- `s7.6 dropping the measurement, the appr_, the advance, or the previous stl_ reversal denies`
- `s7.6 a rev_ of the approval, a rev_ of the advance, or a rej_ of the measurement denies`
- `s7.7 a ledger row with partyId still fails`
- `s7.8 a project-delete batch that also deletes a parties id fails`
- `s7.8 a project-delete batch that deletes an accountTxns row of that project fails`
- `s7.8 a project-delete batch that deletes an agreements row of that project fails`
- `s7.8 the existing project-delete cascade still succeeds when no account row exists`. `tests/project-delete.test.js` is not edited. This case lives in the new emulator file
- `s7.9 sup_ of payLabor fails; sup_ of advanceLabor fails`
- `s7.9 a deduct body with no appr_ succeeds`
- `s7.9 an appr_ of that deduct whose purpose is approveLabor fails`
- `s7.9 approveDeduct with no amount succeeds; a second one fails`
- `s7.10 a labor deduct whose target is not a live approveLabor fails`
- `s7.10 a labor deduct larger than that approval fails`
- `s7.10 a deduct whose partyId, projectId, or currency differs from the approval fails`
- `s7.11 returnAdvance against a live advanceLabor succeeds`
- `s7.11 returnAdvance above that advance fails; a party, project, or currency mismatch fails; a rev_ of the advance fails`
- `s7.11 refundLabor against a live payLabor succeeds and has no entryType`
- `s7.11 refundLabor with no payLabor target fails`
- `s7.12 one deduct above the approval fails; a second deduct that itself fits the approval succeeds`
- `s7.13 payLabor succeeds while no revw_ exists`
- `s7.13 revw_ of that payLabor succeeds with no amount; rev_ of that revw_ succeeds`
- `s7.13 a second revw_ of the same id fails while the first exists; after the reversal, revw_ plus _1 succeeds`
- `s7.13 revw_ of refundLabor, advanceLabor, and returnAdvance succeed; revw_ of deduct fails`
- `s7.15 refundLabor above the payment fails; a party, project, or currency mismatch fails`
- `s7.15 two refunds that each fit the payment both succeed`
- `rej: a rej_ of a laborQty is allowed before appr_; it is denied once that appr_ exists`
- `rej: a rej_ of a cash row is denied`
- `rev: owner-b may rev_ owner-a's payLabor`
- `rev: a rev_ of a rev_ is denied`
- `rev: a rev_ whose purpose, amount, partyId, projectId, or currency differs from the original is denied`
- `statement: week with projectId is allowed; month with projectId is allowed; week without projectId is allowed`
- `statement: a periodKind other than week or month is denied`
- `statement: periodStart after periodEnd is denied`
- `statement: a date entryDateOk rejects is denied`
- `statement: includedIds, or a figure key, is denied`
- `statement: a missing party is denied`

Two owners, rules half. The adopt step stays in E. These are creates only:

- `two owners: the same slot id, appr_, rej_, sup_, rev_, labor stl_, and revw_ — the first create is allowed and the second is denied`
- `two owners: two payLabor rows with fresh uuids both land`
- `two owners: an appr_ and a rej_ of one body, with neither stored first, both land`
- `two owners, distinct uids, each create a party as themselves, and each can read the other's party`
- `a site user cannot read or create any of the four collections`

Also:

- `payLabor with a targetId is denied`
- `the brick ids: unit agreement, laborQty 8000, approveLabor 600000, and payLabor 600000 are allowed`. This does not assert a balance. Balance is PR B and PR C
- `slot vector 000aaaaaaaabbbbccccddddeeeeeeeeeeee1`
- `length table`: every row above. The 54-hex `inv_` id is 60 and matches `idOk`. Its `rev_` is 64 and matches. A 55-hex variant's `rev_` is 65 and fails `idOk`. `rev_` + `appr_` + four `sup_` + a 36-character uuid is 61. Labor `stl_` of a 52-character body is 58 and its `rev_` is 62. The withdrawn `stl_` + `appr_` shape is 63 and its `rev_` is 67 and fails `idOk`. `revw_` + a 52-character body + `_` + gen is 59 and its `rev_` is 63
- source: `laborStlCreate` contains one user `get`, one project `get`, and the nine access call sites. No function has more than 10 `let` bindings. `accountTxnCreate` contains no `get` and no `exists`. Every create leaf contains one user `get`
- source: `purposeOk` and `needsApproval` match `Accounts.PURPOSES` for ledger and `needsApproval`. Every purpose name in that table appears in `accountTxnCreate`
- source: `firestore.rules` contains no `hashing.sha256`, no `lockId`, and no `inv_`. The parties key list contains no `roles`. The new functions contain no uid literal
- source: `slotBodyCreate`, `laborQtyCreate`, and `approveLaborCreate` each contain `agreements` and `'rev_' +`

After a project delete at a zero balance, the account rows stay. `revCreate` gets the project, so those rows cannot be reversed once the project is gone. C and F label them. D does not delete them.

Left out of D, phase 2 or a later PR: section 7 items 14 and 15's `refundPayment` / `payMaterial` / `inv_` / hash / golden-vector cases, the USD success path, `approveOwnMoney`, material `deduct`, extra A, extra B, the adopt step (PR E), and any test that expects the rules to sum sibling refunds or deducts.

## Strings

D ships no new Arabic string. The rules file has no user-facing sentence. A denied create still shows the existing `رُفض الإرسال` (`public/sync-status.js` line 12). D does not add a second sentence and does not change that file. #72 added `رُفض الإرسال لأن المشروع محذوف` at line 15. D does not use it and does not edit it.

No reused string is added to a screen. The v1 string count does not change.

## Sequencing

Parallel work, and the files that make D wait:

| Other work                     | Files it edits                                                              | Shared with D                                                                                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Baghdad-date fix, merges first | `public/session.js`, `public/render.js`                                     | none. D does not bump `sw.js`                                                                                                                                                              |
| Foreman export                 | `public/ledger.js`, `public/render.js`                                      | none                                                                                                                                                                                       |
| PR B code                      | `public/accounts.js`, and a `sw.js` bump if that PR edits `public/`         | no `public/` file. Both may append `docs/PSTACK_INVENTORY.md`. Rebase the evidence sentence. The `PURPOSES` source test reads ledger and `needsApproval`, which B's sketch does not change |
| PR C                           | balances in `public/accounts.js`                                            | none, aside from the inventory file if C also appends it                                                                                                                                   |
| Another phase sketch           | a different file under `docs/plans/`                                        | none. This sketch is `docs/plans/contractor-pr-d-sketch.md` only                                                                                                                           |
| Receipt-photo PR-R             | `firestore.rules`, `firestore.indexes.json`, `tests/emulator/rules.test.js` | `firestore.rules`. D merges first. PR-R rebases onto that merge.                                                                                                                           |

The one code file that can make the code PR sequential is `.github/workflows/ci.yml` line 181, and the pass floor on line 188, if another PR edits that same command. Rebase and keep both paths.

Merge and deploy order:

1. D merges first. PR-R rebases onto D and merges after it.
2. Rules deploy only from `main`, at the merged SHA, from a clean checkout. The full emulator job on that SHA is green first. Never deploy from the D branch, and never deploy a file that is not that SHA.
3. A revert is a revert of D's commit on `main`, then a deploy of that new `main`. Never deploy an older file by hand.
4. If E is already live, turn E's writer off before reverting D. Otherwise every new account write fails closed.

Q8 approves the sketch and leaves the deploy for later. The earlier 00:34 answer is the list that wins: no rules deploy without a fresh Drive backup, an emulator restore test of that backup against the new rules, CI 4/4, Architect APPROVE on the SHA, and EA's go. Ameer still deploys (`README.md` line 24). Q8's shorter list (green code, backup, emulator) is inside that one. It does not drop the Architect APPROVE or EA's go.

The four new collections are create-only, so a backup cannot delete them. The backup-gaps seed list does not name `parties`, `agreements`, `accountTxns`, or `statementApprovals`. That list gains these four, and a restore keeps create-only. The daily full dump adds about one read per account document to the Spark count. D does not edit the backup script.

Service worker version for this phase: none (Q5). The rule is the next free number at merge time. D does not edit `public/`, so it claims no number, and nothing here is a reservation that a later merge would have to keep. The earlier date-fix answer (00:38) wins on one point Q5 leaves open: the date fix merges first as v59. Every later `public/` bump renumbers after that. D takes no number.

## Accounting advisor

No new accounting question. The rules encode decisions Ameer already closed. The advisor's earlier notes, quoted so the code PR does not reopen them:

- Q1. Cost is booked when work is approved, not when it is paid. An advance is not an expense. A `deduct` counts only after `approveDeduct`.
- The 02:44 split. A cash row counts on create and is corrected by `rev_`, not by `sup_`. `sup_` of `payLabor` is denied. `revw_` is a separate mark. It does not change the cash multipliers, and a cash create is not refused for lack of it.
- One refund or one deduct larger than the named row is denied. A running total is not a rules check (plan lines 358 and 602). Ameer later made the phone refuse that sum (PR B sketch, 2026-11-15). D leaves the sum on the phone.

## Revert

This docs PR reverts with `git revert`. It changes no behaviour.

The code PR reverts with `git revert` of that commit on `main`, then a deploy of the new `main`. Reverting the rules file does not delete Firestore documents already created. The ledger match is untouched. Never deploy an older rules file from the branch. If E is live, turn E's writer off before that revert, because the new writes would all be denied. D adds no service worker and no new `docType`, so a phone does not queue a new kind because of D alone. The outbox warning in the plan is about reverting E, not D.

## Dependencies

- PR A is on this base. `Accounts.PURPOSES` already has the nine purposes, all ledger `labor`, with `needsApproval` true only on `laborQty` and `deduct` (`public/accounts.js`). `workPosition` at this base has no `milestone`. The rules still deny percent and allow an amount milestone, because that is the v1 cut, not a new purpose row.
- PR B's sketch is the client half: payments, the cumulative phone refuse, and amount-milestone math. D does not edit `accounts.js`. The code PR rebases onto B if B changes a ledger or a `needsApproval` flag. B's sketch does not.
- PR C computes balances and the statement. `statementApprovals` stores no figures, so C remains the source of the numbers.
- E's adopt path waits until Ameer has deployed D. This sketch does not deploy. If E merged first, every new write would be denied. That precondition is E's, and it is why D stays rules-only.
- `uuid()` (`public/session.js` lines 85-93) already returns 36 lowercase hex characters with hyphens. Agreement ids and cash ids use that shape. D does not change `uuid()`.

## Risks

- A leaf that calls `isOwner()` or `projectOpen()` adds an `exists` plus a second `get`. The 9-read `stl_` would go over 10. The source test counts one user `get` per leaf so that call is visible.
- `accountTxnCreate` must be one `allow create`. Thirteen `allow create` lines, or an `||` of the leaves, can evaluate more than one leaf's gets.
- `let` laziness is not documented. The budget is the call sites in the function. A binding that is not on every allow path is an `exists`, never a `get` of a document that may be missing. Helpers stay pure, so a `get` is not hidden. `laborStlCreate` has 9 `let` bindings. The documented cap is 10.
- `agreementId.replace('-', '')` is the plan's expression. The slot vector is the check. A first-only replace fails that test.
- The cumulative sum is a real hole on the server. Two phones can each write a legal refund or deduct. Closing it in rules would need a query or a running-total document, which v1 does not add. The code PR must not "fix" it.
- A site user who could read `agreements` could infer a contract amount. `accountRead` is owner-only. The site labour create on `ledgerEntries` (rules line 156) stays. The legacy-after-date question is not this PR.
- A denied create is still billed for the gets it performed. None of these allow paths is above 9. D does not turn on a paid Firebase plan.
- `revw_` generation is 4 reads, not the 3 in the plan's table. Shipping the table's 3 would allow a second live mark. The sketch takes 4 so test 13 can be true.
- Deploying these rules replaces the whole ruleset. Deploy only from `main` at the merged SHA, after the real-data conditions in Sequencing. `firebase deploy` from the D branch would drop PR-R's rules, or the other way around.

## pstack for this phase

The app is not claimed to be pstack-compliant. This docs PR is the architect sketch. Arena was not run (cost). No inventory row is marked «مطبّقة» by this PR.

Plan section 16 assigns the code PR these rows: `principle-prove-it-works`, `blast-radius`, `tdd`. The code PR appends an evidence link on the first two and does not flip a status word. `tdd` gets a link only when that PR's history shows a failing emulator run committed before the rules that make it pass. Writing the tests in the same commit as the rules is not that evidence. `principle-subtract-before-you-add` is the v1 cut Ameer already picked. D obeys it by leaving phase 2 out. It does not edit that inventory row. `setup-pstack` stays «ناقصة» at `docs/PSTACK_INVENTORY.md` line 77. This sketch does not touch that row.

This sketch uses `architect` (the signatures and the two shapes), `principle-foundational-thinking` (the document keys and the read budget before any rules code), `principle-boundary-discipline` (the server is the check; the cumulative sum stays a phone check), and `principle-explain-the-number` (9 is a count of named documents, not an emulator counter). The app is not claimed to be pstack-compliant.

## Citations rechecked at baf4f21

`firestore.rules` is unchanged since #49. These plan citations are still the lines at this base, and the sketch uses them:

- `isOwner` line 11, `isSite` line 12, `allowlisted` line 10, `me` line 9
- `MAX_AMOUNT_IQD` line 18, `idOk` line 19, `projectOpen` lines 52-54
- `shapeOk` hasOnly line 83, `createdBy` line 87, `currency == 'IQD'` line 93
- ledger `allow create` line 156, `typeOk` labour line 118, `linkOk` lines 110-116
- `createdByNameOk` lines 76-80
- users create lines 212-213
- foremen `update`/`delete` false lines 316-317, moves lines 363-364
- subcontract `update: if false` line 246, terms line 262, amendments line 294
- `usesPutIfMissing` `public/sync.js` lines 18-20
- `collectionFor` `public/sync.js` lines 23-31
- `uuid` `public/session.js` lines 85-93
- demo seed `public/app.js` lines 34-35
- `MAX_AMOUNT_IQD` `public/ledger.js` lines 117-118
- `رُفض الإرسال` `public/sync-status.js` line 12
- `README.md` line 24
- ci.yml emulator command line 181
- `tests/rules-constant.test.js` lines 8-30

Plan statements that are no longer true at this base. #72 moved the lines. D does not repair those files. The corrected line is here so the code PR does not copy the stale one:

- Plan lines 151 and 931 say the service worker on main is `aj-p0-v56`. It is `aj-p0-v58` at `public/sw.js` line 1.
- Plan line 71 puts the demo uid fallback at `public/session.js` line 93. Line 93 is the closing brace of `uuid()`. The fallback is line 101. `public/app.js` lines 34-35 are still the seed.
- Plan line 931 puts `SHELL_FILES` at `public/session.js` line 263. It is line 271.
- Plan lines 435, 629, and 972 put `countedEntries` at `public/ledger.js` lines 298-308. The function starts at line 307. Line 298 is `canExportCSV`.
- Plan line 645 puts `foremanBalance` at `public/ledger.js` lines 511-531. The function starts at line 649.
- Plan line 201 puts `projectGone` at `firestore.rules` lines 55-59. The function is lines 58-60. `existsAfter` is line 59. Lines 55-57 are the comment.
- Plan line 621 cites `idListOk` as lines 20-24. The function is lines 21-43. The 20-slot cap is line 22. `statementApprovals` still does not use that list. It stores no transaction ids.
- Plan line 533 says `flushOutbox` walks ids at `public/sync.js` line 601 and does `kept.push` on a transient error at line 616. `flushOutbox` starts at line 594. Line 601 is `const failed = []`. The transient `kept.push` is line 631. Lines 609-610 are the missing-local and seed branches.
- Plan lines 434, 522, and 533 put `applyFlush` at `public/sync-status.js` lines 154-165. `applyFlush` starts at line 169. Lines 154-165 are the project-deleted failure text from #72.
- Plan line 533 puts `readServer` at `public/firebase-client.js` lines 639-646. The call is line 672.
- Plan line 925 cites `.pills` at `public/render.js` lines 561-562. Those lines are the new-entry link. `.pills` is on line 598. D has no screen.
- Plan line 1078 says the next build step is PR A only, and that nothing in the plan edits `firestore.rules`. PR A and #72 are already on this base. This sketch is the D step. It still does not edit `firestore.rules`.
- `package.json` `test:emulator` and ci.yml line 181 are not the same command. The package script includes `tests/emulator/offline-cold-start.test.js`. CI does not.

`putIfMissing` still starts at `public/firebase-client.js` line 239. D does not use it. The adopt path is E.

## أجوبة أمير

Recorded from EA, on Ameer's delegation, 2026-11-16 00:34 Baghdad, and the 00:36 follow-up. Q5, Q8, Q9, and Q10 of QUESTIONS-FOR-EA-r1 are the same decisions, approved again at 00:52. Where the two files differ, the 00:34 and 00:36 answers win. This r2 does not ask them again.

**Q5. رقم الخدمة.**

القاعدة: الرقم الفاضي الجاي وقت الدمج. D ما يلمس `public/` فما يحجز رقماً. جواب 00:38 يثبت تصليح التاريخ على v59، والباقي يتعاد ترقيمه بعدين.

**Q8. قواعد الخادم. جواب: موافق على السكتش.**

النشر ما يصير من هذا الطلب. جواب 00:34 هو القائمة المعتمدة، وهي أوسع من نص Q8: ينزل من `main` على الـ SHA المدموج، بعد نسخة احتياطية جديدة على Drive، وتجربة استرجاع على المحاكي، و CI 4/4، وموافقة المعماري على الـ SHA، وموافقة EA. أمير ينشر بنفسه.

**Q9. عكس الاتفاق. جواب: إي. الوثيقة في `agreements`.**

إذا انكتب اتفاق وطلع بيه غلط، ما ينمسح وما يتعدّل. تنكتب وثيقة إلغاء في `agreements`، والمعرّف `rev_` زائد معرّف الاتفاق، بنفس الحقول زائد `reversesId`. معرّف الاتفاق يبقى uuid.

**س٢-ب. جواب 00:36، ويبقى فوق Q9.**

بعد الإلغاء، السيرفر يرفض أي قياس أو اعتماد جديد على هذا الاتفاق. الفحص هو `!exists(agreements/rev_<agreementId>)` على القياس، وعلى جسم الـ slot، وعلى `approveLabor`. Q9 ما يلغي هذا الفحص.

**Q10. فترة الكشف. جواب: `week` أو `month` بس.**

الشاشة تعرض «أسبوعي» و«شهري». بداية الأسبوع من السبت تبقى بالشاشة.

**M2. جواب المهندس، مقبول.**

D يطلب `milestoneMode` بقيمة `amount`. F يكتبها دائماً. غياب المفتاح ينرفض على السيرفر.

مو لهذا الطلب: تاريخ الكلفة يبقى فاضي، ونصوص النسخة الأولى واسم التبويب «حسابات»، وسؤال القيود القديمة بعد التاريخ يبقى «بعدين». D ما يغيّر قيد `عمالة/سلفة` ولا قيد `مقاول`.

## Decisions only Ameer can make

- The sketch questions above are answered. Rules code still waits for Architect APPROVE on this r2.
- Deploy only under the real-data conditions in Sequencing. CI 4/4 is not a deploy.
- Do not set `CONTRACTOR_COST_START` in D. Q2 stays «بعدين». PR K stays gated.
