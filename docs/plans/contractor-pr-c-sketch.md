# PLAN ONLY: contractor PR C sketch

No code in this pull request. No edit to `public/`, `firestore.rules`, or `public/sw.js`. The code PR comes after the Architect reviews this sketch and Ameer says go.

Parent plan: `plan-contractor-module-r2.28.md`, sha256 `ef1c98d08a7118ed35469d250c81605a7f17f518d949f8446b8c63bb1869c8a2`. Status note: handoff `plan-status-r2.29.md`. PR B is merged. `docs/plans/contractor-pr-b-sketch.md` on main still says a missing `milestoneMode` earns the amount. C's PR corrects those sentences.

Base for the citations below: `24fb839556bae41d9f721ad8f09ce61a0e0f55b5`. That commit is current `origin/main`. It contains the date fix (#82, service worker v59), the foreman custody export (#84, v60), and PR B (#81, v61). `personBalance` is already in `public/accounts.js`.

Arena was not run. Ameer's gate bans it (cost). The shape is the one already approved in r2.28 sections 3, 9, and 13. This file is the sketch those gates asked for before code.

Revision r2, against Architect NOTES on `17e8c678` (review sha256 starts `d17c5ebd`). M1, L1, L2, and L4 of that review are in the fold below. The 88 strings are approved.

EA, 2026-11-16 00:52 Baghdad, on Ameer's delegation. QUESTIONS-FOR-EA-r1 (sha256 `13723e6e0586d653d55e35be087ab220adb67e32c1a60a61ff1b5dde7d2e5c75`) defaults Q1 through Q47 are approved. Where `answers-EA-delegated-0034.md` (sha256 `c14b9c8425287d9b787b28a9afae45bf25aaf8aa2a482319e1c9d63d9c91a7da`) differs, the earlier answer wins. This lane folds in Q5 and EA Q7 only. EA Q7 is that file's reversal question. Plan Q7 is the closed race and the Saturday week. The two names are not the same.

Revision r3, against Architect NOTES on `604d7346` (review of blob `1470902675132b98e6836786b119861ed9d6680d`). One recursive liveness rule, `sup_` is a body, and `rowIndex` is built from the unfiltered list.

Revision r4, on local `771835d8`, re-cited at `24fb8395`. B's L1 through L4 move here. F r5 calls the exports below. C claims no service-worker number. The next free value is v62 unless another lane takes it first.

Revision r5, against Architect NOTES on r4 (sha256 `b37dad03760a27bd384418a9d0b6d7400635064e90467243e8e940bee677f611`, blob `a865343675d7910be0b26ac4f254d05be465bf65`, review sha256 `66b0fbc7803534fd44e8d16833e001f3558c68dc0af6ed05d3217c2c546ac01d`). The delete guard reads `net`. `rowLive` is exported. Supersede wins for an approval. `FoldDoc` does not require `effect`.

## Scope

Plan r2.28 lines 941 and 948. Order is A, then B, then C, then D merged and deployed by Ameer, then E, F, K, G-J. PR A is merged. PR C does not start D, E, F, K, or G-J, and it does not redo B.

From the table, PR C is:

- IQD balances only. Per-currency balances and USD stay phase 2 (plan section 8, section 14).
- Statement order, one statement line per v1 purpose.
- Opening computed from the live fold. It is not a stored closing (plan section 9, lines 617-623).
- Property: statement closing equals `balances().net` for the same scope, currency, and project filter (plan line 371).
- The fixture approval 600,000, deduction 50,000, advance 100,000, return 30,000, no payment, with its `approveDeduct`. Net and closing are 480,000.
- The same rows when that `appr_` is absent. Net and closing are 530,000.
- Spec 9, 10, 13, and 15, cut to v1. No Firestore rows.

Not in C: material purposes, `refundPayment`, invoices, USD, `fxRate` other than the IQD rule of ignoring it, attachments, screens, rules, the adopt path, `statementApprovals` writes, and project-cost arithmetic. The 600,000 project-cost half of the brick fixture stays PR K. B's sketch already turns `projectCost` into `return 0`. C does not edit that function.

`overLimit` is in C because B's sketch assigned it here: after sync, both over-cap rows stay, and the fold flags the parent line. C does not drop a row to make the cap look held. The display strings for that flag stay on the screens PR.

## Files the code PR may edit

| File                                                        | Change                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/accounts.js`                                        | Split the shared `statementLine` tokens. Add `rowIndex`, `rowLive`, `rowCounts`, `balances`, `statementLines`, and `periodBounds`. Change B's `personBalance` so its body is `balances(...).net`. One fold. Change `countedAmount` to the integer bound. |
| `tests/accounts.test.js`                                    | The behaviour tests below. Spec 1, 2, 6, and 7 stay green. B's payment, cap, and `personBalance` tests stay green.                                                                                                                                       |
| `public/sw.js`                                              | `VERSION` only, the next free value at merge time (Q5). This sketch does not pick the number. See Sequencing.                                                                                                                                            |
| `tests/shell-cache.test.js`, `tests/webkit-upgrade.test.js` | The same version pins, after that bump.                                                                                                                                                                                                                  |
| `types/checkjs.d.ts`                                        | C owns the one `FoldDoc` and the one `Window.Accounts`, including `rowLive`. F does not add a second `Accounts`. See F.                                                                                                                                  |
| `docs/plans/contractor-pr-b-sketch.md`                      | Three sentences only. A missing `milestoneMode` is refused with `milestone`. It does not earn the amount.                                                                                                                                                |
| `docs/PSTACK_INVENTORY.md`                                  | Evidence on the PR C rows: `principle-explain-the-number`, `principle-prove-it-works`, `tdd`. Do not flip a status word. Those three rows are already «مطبّقة» (`docs/PSTACK_INVENTORY.md` lines 29, 40, and 82 at `24fb8395`).                          |

## Files the code PR must not touch

`firestore.rules`. `public/ledger.js`. `public/render.js`. `public/sync.js`. `public/session.js`. `public/index.html`. `public/foremen.js`. `package.json`. `.github/workflows/ci.yml`.

`tests/accounts.test.js` is already on both test lists (`package.json` script `test`, and `.github/workflows/ci.yml` line 68 at `24fb8395`). No new test file, so those two lists stay identical.

`post` still returns a document. C does not change the payment rules B shipped. It does not call `queueDoc` and does not write IndexedDB or Firestore. `projectCost` stays `return 0` (`public/accounts.js` lines 532-536 at `24fb8395`). `CONTRACTOR_COST_START` is still null (line 11).

Callers of `Accounts` at `24fb8395` are `tests/accounts.test.js` only. `render.js` does not call it. F will, after C.

## Usage

A test, or a later screen, already holds the person's in-memory rows. It calls `balances(docs, filter)` for the numbers and `statementLines(docs, filter)` for the ordered lines. The same filter object is the scope, the currency, the project, and, when the statement has an end date, `periodEnd`. `statementLines(...).closing` is `balances(...).net` for that object. The caller does not keep a second sum.

`personBalance(docs)` stays the call B's tests use. After C it is the net of the same fold, with no party or project filter. A list of two projects is the consolidated net. Pass `projectId` to `balances` when the number is one project.

`periodBounds('week', day)` and `periodBounds('month', day)` turn a civil `YYYY-MM-DD` into `periodStart` and `periodEnd`. The screen passes those strings in. The fold compares the strings. It does not read a clock and it does not read `statementApprovals`.

Second design considered: a separate statement sum that walks the purposes again. Rejected. B's sketch says C extends the one fold and does not write a second one. Two sums drift, and the property test would be the only thing holding them together. Calling `balances` twice, once for the opening cutoff and once for `periodEnd`, is still that one function.

Third design considered: store the closing on the approval document. Rejected. Plan section 9. The opening is the live fold before `periodStart`. A late row dated inside a closed period changes the live opening. The stored approval does not.

## Types and signatures

All of these stay in `public/accounts.js`. Names already exported stay exported. The return at `public/accounts.js` line 538 at `24fb8395` is `CONTRACTOR_COST_START`, `PURPOSES`, `unitPrice`, `workPosition`, `post`, `personBalance`, `cashPointerErrors`, and `projectCost`. C adds `rowIndex`, `rowLive`, `rowCounts`, `balances`, `statementLines`, and `periodBounds` to that return. `rowIndex` and `rowLive` are functions, not only types. `rowCounts` is `rowLive` plus the approval rules. `balances` calls them. K, F, and G-J call them. None writes a second copy.

`FoldDoc` is the stored row the fold reads. D does not store `effect`. A `rej_` and a `revw_` store no `purpose`. `paidAs` is optional and the fold does not read it. A missing `currency` counts as IQD. A row with `currency: 'USD'` is out. A missing `txnDate` counts in an all-time fold and in no dated statement. The sign comes from `PURPOSES[purpose]` only. A missing or unknown `purpose` adds 0.

```javascript
/**
 * @typedef {{
 *   id: string,
 *   purpose?: string,
 *   ledger?: 'labor',
 *   amount?: number,
 *   paidAs?: 'payLabor' | 'advanceLabor',
 *   targetId?: string,
 *   settlesId?: string,
 *   reversesId?: string,
 *   supersedesId?: string,
 *   partyId?: string,
 *   projectId?: string,
 *   currency?: 'IQD' | 'USD',
 *   txnDate?: string,
 *   kind?: 'body' | 'appr' | 'rej' | 'sup' | 'rev' | 'revw' | 'stl'
 * }} FoldDoc
 * No effect field. The fold multiplies amount by PURPOSES[purpose].
 */

/**
 * @typedef {{
 *   partyId?: string,
 *   projectId?: string,
 *   currency?: 'IQD',
 *   periodEnd?: string,
 *   syncErrors?: Readonly<Record<string, unknown>> | null
 * }} BalanceFilter
 * Absent partyId: every party in the list. Absent projectId: every project.
 * currency omitted: IQD, including a row with no currency field.
 * periodEnd omitted: every date, including a row with no txnDate.
 * periodEnd set: txnDate <= periodEnd, compared as strings. A row with no txnDate is out.
 * syncErrors is the id-keyed record already stored as K.syncErrors.
 * countedEntries reads err[id] (public/ledger.js lines 305-309 at 24fb8395).
 * A Set or an array is not this type. A present key means the id is refused. The value is ignored.
 */

/**
 * @typedef {{
 *   net: number,
 *   payableGross: number,
 *   payable: number,
 *   recoverable: number,
 *   openAdvances: number,
 *   netAdvances: number,
 *   approvedLabor: number,
 *   payments: number,
 *   refunds: number,
 *   advancesPaid: number,
 *   cashReturned: number,
 *   deductions: number,
 *   settlements: number,
 *   overLimitIds: readonly string[],
 *   unreviewedCashIds: readonly string[],
 *   pendingIds: readonly string[]
 * }} Balance
 * payable is max(payableGross, 0). recoverable is max(-payableGross, 0).
 * Neither one is net. openAdvances is «سلف قائمة عليه».
 * netAdvances is «صافي السلف».
 */

/**
 * @param {readonly FoldDoc[]} docs
 * @param {BalanceFilter} [filter]
 * @returns {Balance}
 * IQD person fold. Positive net: the company owes the person.
 * Negative net: the person holds the company's money.
 * Does not read storage. Does not write a total.
 */
function balances(docs, filter)

/**
 * @typedef {{
 *   byId: Readonly<Record<string, FoldDoc>>,
 *   byReversesId: Readonly<Record<string, readonly string[]>>,
 *   bySupersedesId: Readonly<Record<string, readonly string[]>>,
 *   byTargetId: Readonly<Record<string, readonly string[]>>,
 *   syncErrors: Readonly<Record<string, unknown>>
 * }} RowIndex
 * byReversesId, bySupersedesId, and byTargetId map the pointer to the ids of
 * the docs that carry it. There is no LiveIndex. This is that map.
 */

/**
 * @param {readonly FoldDoc[]} docs
 * @param {Readonly<Record<string, unknown>> | null | undefined} syncErrors
 * @returns {RowIndex}
 * Built from the full unfiltered list, before party, project, currency, and
 * date filters. D's rej_ carries partyId on the shared header. The index is
 * still unfiltered, so a filtered list cannot hide a rejection.
 * The same id twice is one entry in byId, so it counts once.
 */
function rowIndex(docs, syncErrors)

/**
 * @param {FoldDoc | null | undefined} row
 * @param {RowIndex} index
 * @returns {boolean}
 * True when the doc is in byId, its id is not a syncErrors key, no live
 * rev_ names it, no live rej_ names it, and no live sup_ supersedes it.
 * Approval state does not matter. A pending laborQty and a pending deduct
 * are live. G-J M3 uses this for targets. F uses it for the row badges.
 * rowCounts is this plus the approval rules. Depth and cycle rules match
 * markerLive, which this function is.
 */
function rowLive(row, index)

/**
 * @param {FoldDoc | null | undefined} row
 * @param {RowIndex} index
 * @returns {boolean}
 * True when rowLive is true and the approval rules below also hold.
 * Party, project, currency, and dates stay in balances.
 * Markers are kind rev, rej, and revw, or an id with those prefixes.
 * A marker never enters the buckets. A sup_ doc is a body, not a marker.
 * rowLive is recursive. Depth stops at 8. A cycle is not live.
 * D denies rev-of-rev and rev_ of rej_. Restoring an original because its
 * rev_ was itself reversed is defensive only.
 * A refused marker is not live, so it does not drop the 600,000 approval
 * and it does not restore one.
 * A rej_ names a target when its id is rej_ plus that id, or its targetId
 * equals that id. A rev_ names a target the same way.
 * Rejection wins (plan Q7, plan line 1054) for deduct and for approveLabor.
 * Supersede wins the same way. An approveLabor is out when a live rej_
 * names its target, and when that body is reversed, refused, or superseded
 * by a live sup_. If the body has not arrived, the approval still counts.
 * The amount is on the approval. The multiplier is PURPOSES[purpose] only.
 * A deduct is out unless a live approveDeduct points at it, and it is out
 * when a live rej_ names the deduct, and it is out when rowCounts of its
 * target approval is false.
 * A settle is out when rowCounts of appr_ plus the measurement id is false.
 * The measurement id is the body id inside stl_<bodyId>_<generation>.
 * targetId, when set, is that same body.
 */
function rowCounts(row, index)

/**
 * @param {readonly FoldDoc[]} docs
 * @param {Readonly<Record<string, unknown>> | null | undefined} [syncErrors]
 * @returns {number}
 * B's function. C's body is balances(docs, { syncErrors }).net.
 * One argument still matches B's tests. There is no second sum.
 * The index is rowIndex(docs, syncErrors) on the list B passed, unfiltered.
 */
function personBalance(docs, syncErrors)

/**
 * @typedef {{
 *   key: string,
 *   label: string,
 *   amount: number,
 *   sign: number,
 *   entersClosing: boolean
 * }} StatementLine
 * contribution is amount * sign, and only when entersClosing is true.
 * A subtotal that restates two lines above it has entersClosing false
 * on the detail, or the reverse, so the closing adds the term once.
 */

/**
 * @typedef {BalanceFilter & { periodStart?: string }} StatementFilter
 * Both period dates, or neither. One without the other is not a statement:
 * lines is empty and closing is null. The caller uses periodBounds first.
 */

/**
 * @param {readonly FoldDoc[]} docs
 * @param {StatementFilter} [filter]
 * @returns {{
 *   lines: readonly StatementLine[],
 *   opening: number,
 *   closing: number | null,
 *   pendingIds: readonly string[],
 *   unreviewedCashIds: readonly string[],
 *   overLimitIds: readonly string[]
 * }}
 * With no period, opening is 0 and closing is balances(docs, filter).net.
 * With both dates, opening is that same fold on the same rowIndex, limited
 * to txnDate strings strictly before periodStart. It is not a second walk.
 * The compare is string order. It does not compute the previous calendar day.
 * Figure amounts are the rows inside the period. Closing is
 * balances(docs, the same party, project, currency, periodEnd, syncErrors).net.
 * The openAdvances line is balances at that periodEnd. It is cumulative,
 * not the advances dated inside the week alone.
 * The lines are read from PURPOSES.statementLine. One line per purpose.
 */
function statementLines(docs, filter)

/**
 * @param {'week' | 'month'} kind
 * @param {string} day
 * @returns {{ periodStart: string, periodEnd: string } | null}
 * Week starts Saturday (plan Q7). Month is the calendar month of day.
 * day is YYYY-MM-DD. A bad day returns null.
 * Build the calendar with Date.UTC and getUTCDay, then format with the UTC
 * year, month, and date. Do not call toISOString on a local Date.
 * session.js today() is public/session.js lines 137-138 at 24fb8395. It already uses Baghdad. The date fix owns that line. C does not edit it.
 * 2026-02-15 is 2026-02-01 through 2026-02-28.
 * The same strings come back under TZ=UTC and under TZ=Asia/Baghdad.
 */
function periodBounds(kind, day)
```

`PURPOSES` keeps the nine keys in the order already asserted by `tests/accounts.test.js`. `statementSign` stays `effect.person` (`public/accounts.js` line 91 at `24fb8395`). C changes three shared tokens. At `24fb8395` the collisions are:

- `advanceLabor` and `returnAdvance` both `'advances'` (lines 72 and 74).
- `payLabor` and `refundLabor` both `'payments'` (lines 73 and 75).
- `laborQty` and `approveDeduct` both `'out'` (lines 70 and 77).

After C, each of the nine has its own non-empty `statementLine`:

| Purpose         | statementLine   | In the figure                          | Sign |
| --------------- | --------------- | -------------------------------------- | ---- |
| `laborQty`      | `outside`       | no                                     | 0    |
| `approveLabor`  | `approvedLabor` | yes                                    | +1   |
| `payLabor`      | `payments`      | yes                                    | -1   |
| `refundLabor`   | `paymentRefund` | yes                                    | +1   |
| `advanceLabor`  | `advancesPaid`  | yes, detail                            | -1   |
| `returnAdvance` | `cashReturned`  | yes, detail                            | +1   |
| `deduct`        | `deduct`        | yes, only once `approveDeduct` is live | -1   |
| `approveDeduct` | `notInSum`      | no                                     | 0    |
| `settle`        | `settle`        | yes, amount shown, contribution 0      | 0    |

A later material purpose may share a line with its labor twin. v1 has no twin, so the nine tokens are distinct. `outside` and `notInSum` are not figure lines. The test fails if any purpose has an empty `statementLine`, a second line, or a token shared with another of the nine.

The figure order is one array in `accounts.js`, not a second copy of the purpose table. Labels are looked up from the key. Computed keys that are not purposes are `opening`, `netAdvances`, `closing`, and `openAdvances`.

1. `opening`, «رصيد أول المدة». Enters the closing.
2. `approvedLabor`, «عمل معتمد». Enters.
3. `payments`, «مدفوع للعمل». Enters.
4. `paymentRefund`, «المُرجَع من الدفعة نقداً». Enters.
5. `advancesPaid`, «السلف المصروفة له». Shown. Does not enter. The subtotal enters.
6. `cashReturned`, «المُرجَع من السلف نقداً». Shown. Does not enter.
7. `netAdvances`, «صافي السلف». Amount is advances paid minus cash returned. Sign -1. Enters. This is the term the formula subtracts.
8. `deduct`, «الخصومات ومرتجعات المواد». Enters.
9. `settle`, «تسوية سلفة». Amount is the settled total. Sign 0, so the contribution is 0.
10. `closing`, «رصيد آخر المدة». The sum. Does not enter itself.
11. `openAdvances`, «سلف قائمة عليه». Closing split. Amount is advances paid minus cash returned minus settlements, cumulative through `periodEnd`. It is not only the advances dated inside the period. Does not enter.

«الصافي» is the label of `balances().net`. It is the same number as closing. It is not a second figure line.

The sum of `amount * sign` over lines with `entersClosing` true equals `closing`. On the 480,000 fixture that sum is `0 + 600,000 - 0 + 0 - 70,000 - 50,000 + 0 = 480,000`. Adding the advance detail lines on top of «صافي السلف» would double-count. The test fails if a line's `entersClosing` flag does that.

Unapproved rows are `pendingIds`. They are listed by the later screen under «بانتظار الاعتماد» and they are not in the arithmetic (plan section 9, line 623). C returns the ids. It does not draw them.

## Fold rules

`balances` calls `rowIndex` on the full list, then `rowCounts` for each doc, then the party, project, currency, and `periodEnd` filters. A `rev_` dated after `periodEnd` still removes its original from that statement. The date filter does not build a second index. The rules below are `rowCounts`. They are not copied into `balances`, B, or K.

- `syncErrors` is a record keyed by id, the same input `countedEntries` already takes (`public/ledger.js` lines 305-309 at `24fb8395`). A present key means the id is refused, including a marker. The stored value is ignored. Callers pass `get(K.syncErrors, {})`. They do not pass a Set.
- A doc is superseded when a live `sup_` has that id as `supersedesId`, or its id is `sup_` plus this id. The `sup_` doc is the replacement body. It counts by the normal rules, including its own approval when the purpose needs one, and it drops out if it is itself superseded, reversed, or refused. It is not a marker.
- It is not reversed by a live `rev_`. A doc whose id is `rev_` plus this id, or whose `reversesId` is this id, reverses it. Live is the one recursive rule above, so a refused `rev_` does not reverse anything, and a refused rev-of-rev does not restore the original. D denies rev-of-rev. The restore branch is defensive. The `rev_` row is not a second subtraction. A reversed approval of 600,000 leaves net 0, not -600,000. EA Q7 is approved: the balance returns to zero (EA, 00:52 Baghdad). That is the same reading as plan Q1.
- Markers are `rev`, `rej`, and `revw` only. `approveLabor` and `approveDeduct` are money rows through the purpose table, and `approveDeduct` has zeros.
- `needsApproval` is false, or `rowCounts` is true for the approval that points at this id. An approval is out when a live `rej_` names its target. A `rej_` names that target when its id is `rej_` plus the target id, or its `targetId` is that id.
- Rejection wins for approvals, not only for deducts (plan Q7, plan line 1054). Supersede wins the same way. An `approveLabor` whose target body also has a live `rej_` is out of every bucket, even though `needsApproval` on `approveLabor` is false (`public/accounts.js` line 71 at `24fb8395`). The same approval is out when that body is reversed, refused, or superseded by a live `sup_`. Two offline phones can each land one create before the other commits. Rules close the sequential orders. The fold is the side that sees both. A `deduct` aimed at that approval is out too, because `rowCounts` of the approval is false. `appr_m` 600,000 plus `appr_sup_m` 500,000 is 500,000, not 1,100,000.
- A `deduct` counts only when a live `approveDeduct` points at it and no live `rej_` names the deduct. `laborQty` has zeros either way. A `sup_` of an unapproved deduct replaces it. The old deduct adds nothing.
- A `settle` adds 0 to `net`. Its amount counts in `settlements` and lowers `openAdvances` only while `rowCounts` is true. It is out when `rowCounts` of `appr_` plus the measurement id is false. That covers a rejected measurement, a reversed approval, and an approval in `syncErrors`. Dropping it does not change `net`. It puts the settled amount back into `openAdvances`.

Plan line 419 says a row is rejected when `rej_` exists and no approval exists. That display rule disagrees with rejection-wins: both can land, and the fold then counts the approval as 0. F must align the screen so it does not show «معتمد» on that approval. This sketch does not edit F.

`net` = approved labor - advances paid - payments + cash returned + labor refunds - counted deductions.

`payableGross` = approved labor - payments + labor refunds - counted deductions - settlements.

`openAdvances` = advances paid - cash returned - settlements. «سلف قائمة عليه».

`netAdvances` = advances paid - cash returned. «صافي السلف». Settlements are not in it.

`payableGross - openAdvances` = `net`. `payable` is `max(payableGross, 0)` and `recoverable` is `max(-payableGross, 0)`. Neither is the statement closing and neither is the delete guard. The guard blocks when `net !== 0`. String 87 shows `net` when `net` is above 0. String 86 shows the absolute value when `net` is below 0. `net` must be a finite number. A person with `net` 0 and open advances is the question in «أسئلة لأمير». The recommended answer is that the guard does not block, because Q8 is a non-zero balance. On the person screen, «مستحق له» and «مستحق عليه» sit next to `net` («الصافي»), not next to `payable`.

`overLimitIds` names the parent line. It does not remove either child from `net`. A parent is in this list only when `rowCounts` is true for it. A pending deduct is the one row that still counts toward the cap while `rowCounts` is false. A rejected approval is not a parent.

- Live `refundLabor` rows whose `targetId` is one `payLabor`, summed above that payment's amount.
- `deduct` rows that are not reversed and not rejected, including a pending deduct, whose `targetId` is one `approveLabor`, summed above that approval. This matches B's cap: a pending deduct counts toward the flag and does not count in `net` until `approveDeduct`.
- Live `returnAdvance` plus live `settle` on one `advanceLabor`, summed above that advance.

`unreviewedCashIds` names a counted cash row (`payLabor`, `advanceLabor`, `returnAdvance`, `refundLabor`) that has no live `revw_`. The first mark is `revw_` plus the body id. A later mark, after `rev_` of the earlier one, is `revw_` plus the body id plus `_` and a generation `1` through `9` (plan lines 240-242). Live is the same `markerLive` rule: in the list, not a `syncErrors` key, and no live `rev_` names it. The flag does not change `net`. Cash counts when it is written (Q10 أ). C returns the ids so the later screen can hide the finalise button. C does not create `statementApprovals` and does not draw the button.

A reversed `settle`, a settle of a rejected measurement, and a settle whose approval was reversed all drop out the same way. `openAdvances` goes back up by that amount. `net` does not move because of the settle. If the approval itself leaves, `net` moves by that approval only.

## B follow-ups now in C

PR B is merged at `24fb8395`. REVIEW-pr81-298d34ad moves L1 through L4 here. The approve condition at that review's line 297 makes L2 mandatory before C ships any labor reversal.

B-L2. `personBalance` lines 489-493 add `doc.targetId` for every `approveDeduct` purpose, including an id that starts with `rev_` or `rej_`. `approvedDeductSum` line 420 already skips `markerId` (lines 240-242). A `rev_` that copies `purpose: 'approveDeduct'` and `targetId` would approve the deduct again. The fix and its test land in C's code PR, in the same change that makes `personBalance` return `balances(...).net`. The approval set is built only from rows where `rowCounts` is true. A marker returns false. No pull request that creates a labor `rev_` merges before that code PR. That includes D's labor `revCreate`, F's correct action, and G-J.

B-L3. A missing `milestoneMode` is refused. `milestonePosition` lines 200-202 set `errors` to `milestone` unless the mode is `amount` or `percent`. Percent is then `percent`. The amount is not earned. C does not change `workPosition`. C's PR edits `docs/plans/contractor-pr-b-sketch.md` at the three sentences near lines 162, 200, and 222 so they say the missing mode is refused with `milestone`. Those sentences on main still say the amount is earned.

B-L4. `countedAmount` lines 315-317 keeps any finite number, and `post`'s caps (`sumLine`, `approvedDeductSum`) call it. C changes `countedAmount` itself to the `intIn` rule at line 98: an integer from 0 through `MAX_AMOUNT` (line 12, `10000000000`). The fold and the caps then share one helper. `NaN`, `Infinity`, a fraction, a negative, a string, and an amount above the max add 0. D still bounds writes. This guard is for a malformed row that already synced.

## What F calls

F r5 calls `Accounts.rowIndex(docs, syncErrors)`, `Accounts.rowLive`, `Accounts.rowCounts`, `Accounts.balances`, `Accounts.statementLines`, and `Accounts.periodBounds`. All six are on the return at the bottom of `public/accounts.js`. `rowIndex` is the function, not only the `RowIndex` type. G-J M3 uses `rowLive` for a target that is still pending. `rowCounts` would hide that target.

The delete guard C exposes to F reads `net`, not `payable` or `recoverable`. It blocks when `net !== 0`. String 87 is used when `net` is above 0, with the amount `net`. String 86 is used when `net` is below 0, with the amount `-net`. The check is that `net` is a finite number. An advance of 100,000 and nothing else has `net` -100,000, so the guard blocks with string 86. Approved labor of 100,000 and an advance of 100,000 has `net` 0, so the guard does not block. F's `balancesFn` returns `{ net: number }`. F's code PR makes that change. This sketch does not edit F.

C owns the one `Window.Accounts` and the one `FoldDoc` in `types/checkjs.d.ts`. F's code PR drops the declaration at F r5's file-table line 52 and keeps C's. `balances` is `(docs: readonly FoldDoc[], filter?: BalanceFilter) => Balance`. Passing `Accounts.balances` as `balancesFn` typechecks only after F types that parameter's `docs` as `readonly FoldDoc[]`. Before that edit the assignment fails, because a plain object is missing `id`. F still owns `AccountsView` and the action names.

## Tests (behaviour)

All in `tests/accounts.test.js`. Each asserts a number, a line key, a label, or an id. None asserts a helper's source text. Spec 1, 2, 6, and 7 stay as they are. B's tests stay as they are.

- `spec 15: 600000, deduct 50000, advance 100000, return 30000, with approveDeduct`. No payment. `balances().net` is 480,000. `payableGross` is 550,000. `payable` is 550,000. `recoverable` is 0. `netAdvances` is 70,000. `openAdvances` is 70,000. `payableGross - openAdvances` is 480,000.
- `spec 15: the 530000 case when that appr_ is absent`. Same rows, no `approveDeduct`. `net` is 530,000. The deduct is in `pendingIds` and its figure amount is 0. `openAdvances` stays 70,000.
- `property: closing equals net on the 480000 fixture`. Same party, project, and `currency: 'IQD'`. `statementLines(...).closing` is 480,000 and equals `balances(...).net`.
- `property: closing equals net on the 530000 case`. Same filter shape. Both numbers are 530,000.
- `property: closing equals net through periodEnd`. One approval dated before `periodStart`, one payment inside the period. `closing` equals `balances` called with the same party, project, currency, and `periodEnd`. A row dated after `periodEnd` is in neither number.
- `second fixture: settle 40000`. Same 480,000 rows plus `settle` 40,000. `net` is 480,000. `payableGross` is 510,000. `payable` is 510,000. `netAdvances` is 70,000. `openAdvances` is 30,000. Closing is 480,000. A statement that subtracted `openAdvances` (30,000) instead of «صافي السلف» (70,000) would close at 520,000. The test fails that.
- `advance 100 returned in full`. `advanceLabor` 100 and `returnAdvance` 100. `netAdvances` is 0. Closing is 0. The return's line key is `cashReturned`, not `deduct`. Parking that return under deductions would show -200.
- `payments term, labor shape of plan line 350`. `payLabor` 200,000 and `refundLabor` 50,000. `net` is -150,000. The payments contribution is -200,000 and the refund contribution is +50,000. No `refundPayment` row is built. That purpose is phase 2.
- `spec 9 and 13: opening is the live fold before periodStart`. `periodStart` `2026-11-14`, `periodEnd` `2026-11-20`. An `approveLabor` 600,000 dated `2026-11-13` is the opening and is not on the period's approved-labor line. A `payLabor` 100,000 dated `2026-11-15` is on the payments line and not in the opening. Closing is 500,000. Adding another row dated `2026-11-13` changes the opening on the next call. Nothing is read from a stored closing.
- `spec 9 and 13: opening uses txnDate < periodStart`. The compare is the strings. A row dated `2026-11-14` is not in the opening when `periodStart` is `2026-11-14`. No test builds "the day before" with `Date`.
- `spec 13: the week starts Saturday, and February has 28 days in 2026`. `periodBounds('week', '2026-11-15')`, and the same call for `2026-11-14` and `2026-11-20`, all return `2026-11-14` through `2026-11-20`. `2026-11-21` returns `2026-11-21` through `2026-11-27`. `periodBounds('month', '2026-11-15')` is `2026-11-01` through `2026-11-30`. `periodBounds('month', '2026-02-15')` is `2026-02-01` through `2026-02-28`. A bad day returns null. The same assertions run in this process and in a child with `TZ=Asia/Baghdad`. Both must match. A local `Date` plus `toISOString` fails the Baghdad child.
- `spec 10: IQD only, balances come from the rows`. A `payLabor` of 100 with `currency: 'USD'` does not change `net`. No rate is applied. A row with no `currency` field still counts, so B's documents stay in the fold. Two calls with a different list return different numbers. No total is written back onto the input.
- `spec 15: one project and the consolidated person`. Same party. Project A is `approveLabor` 600,000. Project B is `advanceLabor` 100,000. Project A net is 600,000. Project B net is -100,000. The filter with no `projectId` is 500,000. A row for another `partyId` is out of all three.
- `one statement line per purpose`. The nine `statementLine` strings are distinct and non-empty. `statementSign` equals `effect.person` on each. The emitted keys on the 480,000 fixture are, in order, `opening`, `approvedLabor`, `payments`, `paymentRefund`, `advancesPaid`, `cashReturned`, `netAdvances`, `deduct`, `settle`, `closing`, `openAdvances`. `outside` and `notInSum` are absent. No key appears twice. The sum of entering contributions is 480,000. There is no `approvedMaterials` line and no «مواد معتمدة».
- `a reversed approval of 600000 nets to 0`. The `rev_` row is in the list. `net` is 0. The approved-labor amount is 0. It is not -600,000.
- `syncErrors drops the approval and not a second copy`. `syncErrors` is `{ [approvalId]: 'رُفض الإرسال' }`. `net` is 0. `personBalance(docs, { syncErrors })` is the same 0. The argument is that record. It is not a Set and not an array.
- `M2: a sup_ replaces an unapproved deduct`. On the 480,000 rows, the approved 50,000 deduct is replaced by an unapproved `deduct` 50,000, a `sup_` of it for 40,000, and `approveDeduct` of that `sup_`. `net` is 490,000. The old deduct adds nothing. The `sup_` row is not a marker. `rowCounts` is true for it once approved.
- `rejection wins over approveDeduct`. The 480,000 rows, the deduct's `approveDeduct`, and a `rej_` of that deduct. `net` is 530,000, the same as the absent-`appr_` case.
- `M1: rejection wins over approveLabor`. `laborQty` id `m`, `approveLabor` 600,000 with `targetId` `m`, and `rej_` of `m`. `rowCounts` is false for the approval. `net` is 0. The approved-labor line is 0. The same list plus a `deduct` 50,000 aimed at that approval, with its `approveDeduct`, stays at net 0. The deduct's target does not count.
- `L1: a settle drops when the measurement is rejected`. `advanceLabor` 100,000, `approveLabor` 600,000 on measurement `m`, `settle` 40,000 of that advance against `m`. Before the `rej_`: `net` is 500,000, `settlements` is 40,000, `openAdvances` is 60,000. After `rej_` of `m`: `net` is -100,000, `settlements` is 0, `openAdvances` is 100,000. The 600,000 left because of M1. The 40,000 left `settlements` and returned to `openAdvances`. `net` did not move by the 40,000.
- `L1: a settle drops when the approval is reversed`. The same three rows, then `rev_` of the `appr_`. `net` is -100,000, `settlements` is 0, `openAdvances` is 100,000.
- `rev-of-rev puts the approval back, and D denies that path`. `approveLabor` 600,000, then a live `rev_` of it, is net 0. A live `rev_` of that reversal is net 600,000. `rowCounts` is false for both marker rows. The test is labeled defensive. D denies rev-of-rev.
- `rowCounts is false for a marker`. A `rej_` row, a `rev_` row, and a `revw_` row each return false. A `sup_` row is not in this list.
- `M1: a refused rej_ does not drop the approval`. `approveLabor` 600,000 and a `rej_` of its body, with that `rej_` id in `syncErrors`. `net` is 600,000.
- `M1: a refused rev_ does not drop the approval`. `approveLabor` 600,000 and a `rev_` of it whose id is in `syncErrors`. `net` is 600,000.
- `M1: a refused rev-of-rev does not restore`. `approveLabor` 600,000, a live `rev_` of it, and a `rev_` of that reversal whose id is in `syncErrors`. `net` stays 0.
- `M3: the index is the full list`. D gives a `rej_` a `partyId`. The test still builds the index from every doc, then filters. `balances` with the approval's `partyId` returns net 0. A second copy of the same id in the input does not double the amount.
- `M3: a rev_ after periodEnd still removes the original`. The approval is dated inside the period. The `rev_` is dated after `periodEnd`. Closing is 0.
- `L4: order does not matter, and a rev_ alone is 0`. The same docs in two orders return the same `Balance`. A `rev_` whose original is not in the list, carrying the same purpose and amount, gives net 0. It is not -600,000 and not 600,000.
- `L4: a reversed approveDeduct returns 480000 to 530000`. The 480,000 rows, then `rev_` of the `approveDeduct`. `net` is 530,000. The deduct no longer counts.
- `L4: an approveLabor whose body is reversed or refused is out`. Body reversed: net 0. Body id in `syncErrors`: net 0. Body absent from the list: the approval still counts, net 600,000.
- `overLimit keeps both rows`. `payLabor` 600,000 and two live `refundLabor` rows of 400,000 against it. Both refunds stay in the net: `net` is 200,000 (`-600,000 + 400,000 + 400,000`). `overLimitIds` contains the payment id. Dropping either refund would not yield 200,000.
- `personBalance matches balances().net`. On the 480,000 list the two calls return 480,000. `approveLabor` 600,000 then `payLabor` 600,000 is 0. `payLabor` 700,000 after that approval is -100,000. A `deduct` of 50,000 with no `approveDeduct` does not move the number. The same list plus `approveDeduct` moves it by -50,000.
- `an unreviewed payment still counts`. `payLabor` 100,000 and no `revw_`. `net` is -100,000 and the id is in `unreviewedCashIds`. A live `revw_` of that id keeps `net` at -100,000 and clears the flag. `rev_` of that mark puts the flag back and leaves `net` at -100,000. A later `revw_<id>_1` clears the flag again.
- `B-L1 A9: a deduct on another approval does not count toward the cap`. Two `approveLabor` rows. A `deduct` aimed at the second does not raise the first line's sum. The first line still accepts a deduct up to its own amount.
- `B-L1 A29: a reversed approved deduct is not inside approveDeduct`. The reversed deduct is not in the sum that caps the next `approveDeduct`.
- `B-L1 A10: a rejected deduct that also has approveDeduct is not in that sum`.
- `B-L1 A14: a reversed approveDeduct does not approve the deduct`. `net` does not fall by the deduct.
- `B-L1 A15: the approval of a reversed deduct does not lower net`.
- `B-L1 A16: a rejected deduct stays out of net` when an `approveDeduct` names it.
- `B-L1 A19: an empty id is id`. `post` with `id: ''` returns `errors: ['id']` and no doc.
- `B-L1 A24: a target with no numeric amount is targetId`, or `settlesId` when the field is `settlesId`.
- `B-L1 A25: a rev_ that copies a refund's purpose and targetId does not count on that payment line`.
- `B-L2: a rev_ or rej_ approveDeduct does not approve the deduct`. `id` `rev_ad` or `rej_ad`, `purpose` `approveDeduct`, `targetId` the deduct. `net` stays at the unapproved-deduct figure. This test is in C's code PR, with the `personBalance` body change. No labor `rev_` pull request merges before that PR.
- `B-L3: a missing milestoneMode is milestone`. `{ method: 'milestone', milestoneAmount: 250000 }` with `approved: true` earns 0 and the error is `milestone`. It does not earn 250000.
- `B-L4: a fractional, negative, huge, NaN, Infinity, or string amount adds 0`. `payLabor` amounts `1.5`, `-100`, `1e20`, `NaN`, `Infinity`, and `'100'` each leave `net` at 0 and do not move a cap. An integer `100` still counts as `-100`.
- `N2: a pending row is live and does not count`. A pending `laborQty` and a pending `deduct` are `rowLive` true and `rowCounts` false. The same rows with a live `rej_`, or with their ids in `syncErrors`, are false for both.
- `N3: supersede wins`. `laborQty` `m`, `appr_m` 600,000, `sup_m`, and `appr_sup_m` 500,000. `net` is 500,000. Without `appr_sup_m`, `net` is 0 and `sup_m` is in `pendingIds`.
- `N4: the 480000 fixture with effect removed is still 480000`. No row carries `effect`. The sign is `PURPOSES` only.
- `L-e: a reversal inside the period of an earlier approval`. The approval is dated before `periodStart`. The `rev_` is dated inside the period. Opening is 0, the approved-labor line is 0, and closing is 0. The same shape with the approval id in `syncErrors` is also opening 0 and closing 0.

v1 strings are the approved 88 in `strings-contractor-module-r2.22.md` (sha256 `9d25840a01257eb76cba6ce6323d32436bd08c471e5e49a703af9d6bb10a6d3a`). Strings r2.23 records Ameer's approval of that list and of the tab «حسابات» on 2026-11-10 at 11:16 Baghdad. C adds no Arabic. A label that is not one of those 88 is a question in «أسئلة لأمير», with a recommended default. Plan lines 1034 and 1076 still say the list is open. That sentence is stale. r2.23 is the record this sketch follows.

## Strings

This docs PR adds none. The code PR adds none that are new. Each label below is reused.

| Label                                 | Mark                 | Where it already is                                                                                                                                                                                                          |
| ------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| «عمل معتمد»                           | reused, v1 string 13 | the approved 88                                                                                                                                                                                                              |
| «مدفوع للعمل»                         | reused, v1 string 14 | the approved 88. The statement line for `payLabor`. «الدفعات» stays the subcontract card at `public/render.js` line 766 at `24fb8395`.                                                                                       |
| «المُرجَع من الدفعة نقداً»            | reused, v1 string 70 | the approved 88                                                                                                                                                                                                              |
| «السلف المصروفة له»                   | reused, v1 string 65 | the approved 88                                                                                                                                                                                                              |
| «المُرجَع من السلف نقداً»             | reused, v1 string 66 | the approved 88                                                                                                                                                                                                              |
| «صافي السلف»                          | reused, v1 string 67 | the approved 88                                                                                                                                                                                                              |
| «الخصومات ومرتجعات المواد»            | reused, v1 string 62 | the approved 88                                                                                                                                                                                                              |
| «تسوية سلفة»                          | reused, v1 string 21 | the approved 88                                                                                                                                                                                                              |
| «رصيد أول المدة»                      | reused, v1 string 61 | the approved 88                                                                                                                                                                                                              |
| «رصيد آخر المدة»                      | reused, v1 string 63 | the approved 88                                                                                                                                                                                                              |
| «سلف قائمة عليه»                      | reused, v1 string 68 | the approved 88                                                                                                                                                                                                              |
| «الصافي»                              | reused, v1 string 69 | label of `net`, not a second figure line                                                                                                                                                                                     |
| «مستحق له»                            | reused, sentence 87  | EA decided C reuses sentence 87. On the person screen it labels `net` («الصافي»), not payable. See «أسئلة لأمير». The foreman badge at `public/foremen.js` lines 148 and 181 at `24fb8395` is a different account and stays. |
| «مستحق عليه»                          | reused, v1 string 16 | recoverable, `max(-payableGross, 0)`. The screen draws it.                                                                                                                                                                   |
| «بانتظار الاعتماد»                    | reused, v1 string 45 | the screen's heading for `pendingIds`                                                                                                                                                                                        |
| «غير مدقّق»                           | reused, v1 string 71 | the screen's badge for `unreviewedCashIds`                                                                                                                                                                                   |
| «لا يُعتمد الكشف وفيه مبلغ غير مدقّق» | reused, v1 string 72 | the screen, while `unreviewedCashIds` or `overLimitIds` is non-empty. C does not show it.                                                                                                                                    |
| «معكوس»                               | reused               | already in `public/render.js`. Not a new statement line.                                                                                                                                                                     |

Not used, and not added: «مواد معتمدة», «فرق سعر الصرف», «رصيد افتتاحي», «من إقفال الكشف السابق». Materials, USD, and a stored opening are out of v1. The advance-line overrun sentence is still the screens PR's question, as B's sketch left it. C ships the id list only.

## Sequencing

This docs PR touches one new file. It does not bump `VERSION`.

Parallel work, and what makes the later code PR sequential:

- The date fix (#82) and the foreman export (#84) are on main. C's code does not edit `public/session.js`, `public/render.js`, or `public/ledger.js`. A later `public/` edit still rebases `public/sw.js`, the three pins in `tests/shell-cache.test.js` (lines 44, 67, and 96 at `24fb8395`), and `tests/webkit-upgrade.test.js` line 19 `MARK`.
- PR B is merged. C edits `public/accounts.js` and `tests/accounts.test.js` on top of that file. `countedAmount` becomes the integer bound, so `post`'s caps and the fold share it. The B-L2 fix and its test are in C's code PR. No pull request that creates a labor `rev_` merges before that PR.
- Other phase sketches. Other files under `docs/plans/`. This file's name is only C. No sequential dependency for this docs PR.

`VERSION` at `24fb8395` is `aj-p0-v61` (`public/sw.js` line 2; line 1 is the Q5 comment). Q5 stays: the code PR takes the next free number at merge time and does not pin one now. v59 is the date fix and v60 is the export. v61 is B. The next free number is v62 unless another lane takes it first. C does not claim v62. This docs PR does not bump `VERSION`.

`accounts.js` is already on the page (`public/index.html` line 71) and on `SHELL_FILES` (`public/session.js` line 316). C does not add a script tag.

## Accounting advisor

Opinion only. These two notes already cover this phase's numbers. EA Q7 is closed: a reversed approval of 600,000 returns to 0. The open point is which number sits next to «مستحق له». It is in «أسئلة لأمير». No new Arabic string.

محاسب أهل الجزيرة, 2026-11-10 02:33 Asia/Baghdad, verbatim, from `accountant-advice-returns-2026-11-10-0233.md`:

> نعم، المقترح صحيح محاسبياً. المثال: 600,000 − 50,000 − 100,000 + 30,000 = 480,000، وهي 550,000 مستحق له ناقص 70,000 سلفة مفتوحة عليه.
>
> ونعم، قصدي بـ«المرتجعات» كان مرتجع المواد، أي مواد معتمدة رجعت فنقصت المستحق. هذا خطأ بصياغتي، شكراً للتنبيه.
>
> نصيحة واحدة: لا تحطّ مرتجع السلفة النقدي تحت «خصومات ومرتجعات»، لأنه ينخلط بمرتجع المواد وله إشارة معاكسة. الأوضح أن يكون تحت قسم السلف بهالشكل:
> − السلف المصروفة له 100,000
>
> - المُرجَع من السلف نقداً 30,000
>   = صافي السلف 70,000
>   ويبقى قسم «الخصومات ومرتجعات المواد» كله بالناقص. ومثال السلفة 100 التي رجعت كلها يطلع صفراً. والقرار لأمير.

That layout is the 480,000 fixture. The return of 100 that closes at 0 is the full-return test. Ameer already accepted this layout (Q9). The sketch does not move the cash return under deductions.

محاسب أهل الجزيرة, 2026-11-10 02:44 Asia/Baghdad, verbatim, from `accountant-advice-approval-2026-11-10-0244.md`:

> 1. الترتيب صحيح: «سلف رجّعها» سطر مستقل بالزائد تحت قسم السلف، وقسم «الخصومات ومرتجعات المواد» كله بالناقص.
>
> 2. الموافقة قبل الاحتساب تعتمد على نوع الحركة:
>
> - المبالغ النقدية (الدفعة، والسلفة، ومرتجع السلفة النقدي): تُحتسب بالرصيد أول ما تنسجّل، مع شارة «غير مدقّق» حتى تُراجَع. السبب أن الفلوس طلعت أو دخلت فعلاً، فهي واقعة وليست تقديراً. لو انتظرنا الموافقة، يظهر المستحق للشخص أكبر من الحقيقة، وهذا أخطر شي لأنه قد يؤدي للدفع مرتين. التصحيح يتم بقيد عكس، ومو بالحجب.
> - الخصم: لازم ينوافق عليه قبل ما ينحسب. السبب أنه مو حركة فلوس، هو قرار أو مطالبة تنقص حق الشخص وقد يعترض عليها، فحكمه حكم اعتماد العمل والمواد.
> - بالكشف، الحركات غير المعتمدة (خصومات، أعمال، مواد) تظهر بقسم «بانتظار الاعتماد» خارج الرصيد، والمبالغ النقدية غير المدقّقة تظهر داخل الرصيد مع شارتها. والكشف النهائي ما ينعتمد وبيه مبالغ غير مدقّقة.

Q1 and Q10 أ already match this note. Cash counts when written. A deduct counts only after `approveDeduct`. Unapproved rows stay out of the arithmetic. The phrase «التصحيح يتم بقيد عكس، ومو بالحجب» is why an unreviewed payment stays in the net. It is not an instruction to subtract the `rev_` row on top of dropping the original.

## Citation fixes at 24fb8395

The plan cites older SHAs. These sentences are checked at `24fb839556bae41d9f721ad8f09ce61a0e0f55b5`. The code PR uses the lines in this list.

- Plan lines 151 and 931. Service worker `VERSION` on main was `aj-p0-v56`. At this SHA `public/sw.js` line 2 is `aj-p0-v61`. Line 1 is a comment. v59 is #82. v60 is #84. v61 is #81.
- Plan line 555. `state.formId` is replaced after save at `public/render.js` line 1177 in the plan. The field is still created at `public/render.js` line 40. The reset after save is line 1270. The entry object is built at line 1260.
- Plan line 641. «قيود بلا عقد» is `public/render.js` line 767. «المقاولون» is still line 85. «الدفعات» is line 766.
- Plan line 629. `countedEntries` is `public/ledger.js` lines 307-310. The record parameter is lines 305-309. `sign` is line 24. `foremanDeleteBlock` is line 755.
- Plan line 931. `SHELL_FILES` is `public/session.js` line 316, and `accounts.js` is on it. The script tag is `public/index.html` line 71.
- Plan line 434. `messageAfterProjectProbe` starts at `public/sync-status.js` line 157. The error map is read at line 190. `sameContent` is `public/sync.js` line 634 and `sameReversal` is line 635.
- `today()` is `public/session.js` lines 137-138. It is the Baghdad date, not the old UTC slice.
- `public/app.js` lines 34-35 are still the demo owner and the demo site user. `firestore.rules` line 11 is still `isOwner()`, line 19 is still `idOk`, and lines 52-54 are still `projectOpen`. `public/foremen.js` line 396 is `draft.formId || uuid()`.
- `personBalance` is `public/accounts.js` lines 484-501. `approvedDeductSum` is lines 415-430. `countedAmount` is lines 315-317. `markerId` is lines 240-242. `milestonePosition` is lines 199-218. The missing-mode check is lines 200-202.

`types/checkjs.d.ts` has no `Accounts` interface at this SHA (`interface Window` is line 831, `interface LedgerApi` is line 353). C adds both `FoldDoc` and `Accounts`.

## Revert

This docs commit reverts with `git revert`. It has no app bytes and no service-worker bump.

The later code PR also reverts with `git revert`. C creates no Firestore documents, so the revert deletes nothing on the server. If that code PR has already bumped `VERSION`, the revert puts the previous version back, and the next `public/` change takes whatever is then free. Do not reuse a version a phone has already cached.

## Dependencies

- PR A and PR B are on main. The nine purposes, `post`, and `personBalance` are in `public/accounts.js`. C replaces the body of `personBalance` with `balances(...).net` and does not add a second fold.
- F r5 calls `Accounts.rowIndex`, `rowLive`, `rowCounts`, `balances`, `statementLines`, and `periodBounds`. The delete guard reads `net`. F's code PR types `balancesFn` docs as `readonly FoldDoc[]` and returns `{ net: number }`. G-J M3 cites `rowLive`.
- D owns rules and `statementApprovals` creates. E owns adopt. F owns the screen that will call `statementLines`. K owns `projectCost`. K and B call `rowIndex` and `rowCounts`. They do not keep their own index or a second rev-of-rev rule. None of K's cost arithmetic is this phase.
- Q2 stays «بعدين». `CONTRACTOR_COST_START` stays `null`. C does not set it.

## Risks

- Leaving `returnAdvance` on the token `'advances'` puts the 30,000 on the same line as the 100,000, and «صافي السلف» cannot be shown. The distinct-token test catches it.
- Subtracting the `rev_` row after dropping the original turns a reversed 600,000 into -600,000. The reversal test catches it.
- Subtracting `openAdvances` instead of «صافي السلف» closes the settle fixture at 520,000. That test catches it.
- A second walk inside `statementLines` that does not call `balances` will fail the property tests.
- Treating a missing `currency` as "not IQD" turns B's `personBalance` tests red. The contract counts a missing currency as IQD.
- Flagging `overLimit` by deleting a row changes the 200,000 two-refund net. The test catches a drop.
- Showing payable 550,000 as the statement closing fails the 480,000 property. Payable is a different number, on purpose (plan lines 371-378).

## Alternatives

One fold that both `personBalance` and `statementLines` call, which is this sketch. The rejected shapes are the second statement walk, and a stored closing. A third shape, exporting the bucket math for the screen to add up, was rejected because the screen would then be a second fold. `statementLines` returns the lines. The screen prints them.

## pstack for this phase

Plan section 16. The app is not claimed to be pstack-compliant. Arena was not run.

The code PR updates the evidence cell of these inventory rows, and does not flip the status word:

- `principle-explain-the-number`. The tests name which number is `net`, which is payable, and which is `openAdvances`.
- `principle-prove-it-works`. `tests/accounts.test.js` asserts the fixtures.
- `tdd`. Those tests are written against this sketch and land with the functions.

This docs PR does not edit `docs/PSTACK_INVENTORY.md`.

Also used while drawing the sketch, not as an inventory edit: `architect` (this file), `principle-foundational-thinking` (the `Balance` object before any code), `principle-subtract-before-you-add` (no second fold, no USD, no materials line), `principle-model-the-domain` (the line key lives on `PURPOSES`), `principle-test-behavior-not-implementation` (the tests assert numbers and keys), and `principle-sequence-verifiable-units` (this sketch is the unit; the code waits).

## Next implementation step

After the Architect's review of this r5 and Ameer's go, add `rowIndex`, `rowLive`, `rowCounts`, `balances`, `statementLines`, and `periodBounds` on top of main's `public/accounts.js`, and correct the three `milestoneMode` sentences in `docs/plans/contractor-pr-b-sketch.md`.

## أسئلة لأمير

EA Q7 انحسم: عكس اعتماد 600,000 يرجّع الرصيد صفر. ما نضيف جملة جديدة.

**1. وين يطلع رقم «مستحق له».**

الجملة 87 توافق عليها، ونعيدها. بس الجملة 86 و87 تحط الرصيد الصافي بعد «مستحق له» و«مستحق عليه». على مثال 600,000 وخصم 50,000 وسلفة 100,000 ومرتجع 30,000، الصافي 480,000 والمستحق قبل طرح السلفة 550,000. لو كتبنا 550,000 جنب «مستحق له» و480,000 جنب «الصافي»، نفس الكلمة تطلع برقمين.

المقترح، بلا جملة جديدة:

- شاشة الشخص: «مستحق له» جنب «الصافي»، والرقم 480,000. وتحتهم «سلف قائمة عليه» 70,000. ما نكتب 550,000 جنب «مستحق له».
- منع حذف المشروع، الجملتان 86 و87: نفس الصافي. إذا الصافي أكبر من صفر تطلع الجملة 87. إذا أصغر من صفر تطلع الجملة 86 بالمبلغ الموجب. سلفة 100,000 وحدها تمنع الحذف بالجملة 86، لأن الصافي سالب 100,000. شغل 100,000 مع سلفة 100,000 صافيه صفر، فالحذف ما ينمنع.
- شارة الخلفة تبقى كما هي. حساب ثاني.

سؤال زيادة: إذا الصافي صفر وبقيت سلفة قائمة عليه، نمنع الحذف؟ الاقتراح: لا. المنع على الصافي غير الصفر بس. ما نضيف جملة جديدة.

اكتب «تأكيد»، أو سمّ الشاشة والرقم.
