# PLAN ONLY: contractor PR C sketch

No code in this pull request. No edit to `public/`, `firestore.rules`, or `public/sw.js`. The code PR comes after the Architect reviews this sketch and Ameer says go.

Parent plan: `plan-contractor-module-r2.28.md`, sha256 `ef1c98d08a7118ed35469d250c81605a7f17f518d949f8446b8c63bb1869c8a2`. Status note: handoff `plan-status-r2.29.md`. PR B contract: `docs/plans/contractor-pr-b-sketch.md` revision r3 (Architect-approved). This sketch treats that file's types and functions as what B will add.

Base for the citations below: `baf4f21fc54c156989334e826d19990b8e5e8a74` (v58, PR #72). `public/accounts.js` on that commit is PR A's file. PR B's code is not on it yet.

Arena was not run. Ameer's gate bans it (cost). The shape is the one already approved in r2.28 sections 3, 9, and 13. This file is the sketch those gates asked for before code.

Revision r2, against Architect NOTES on `17e8c678` (review sha256 starts `d17c5ebd`). M1, L1, L2, and L4 of that review are in the fold below. The 88 strings are approved.

EA, 2026-11-16 00:52 Baghdad, on Ameer's delegation. QUESTIONS-FOR-EA-r1 (sha256 `13723e6e0586d653d55e35be087ab220adb67e32c1a60a61ff1b5dde7d2e5c75`) defaults Q1 through Q47 are approved. Where `answers-EA-delegated-0034.md` (sha256 `c14b9c8425287d9b787b28a9afae45bf25aaf8aa2a482319e1c9d63d9c91a7da`) differs, the earlier answer wins. This lane folds in Q5 and EA Q7 only. EA Q7 is that file's reversal question. Plan Q7 is the closed race and the Saturday week. The two names are not the same.

Revision r3, against Architect NOTES on `604d7346` (review of blob `1470902675132b98e6836786b119861ed9d6680d`). One recursive liveness rule, `sup_` is a body, and `rowIndex` is built from the unfiltered list.

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

| File                                                        | Change                                                                                                                                                                                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/accounts.js`                                        | Split the shared `statementLine` tokens. Add `rowIndex`, `rowCounts`, `balances`, `statementLines`, and `periodBounds`. Change B's `personBalance` so its body is `balances(...).net`. One fold.                                |
| `tests/accounts.test.js`                                    | The behaviour tests below. Spec 1, 2, 6, and 7 stay green. B's payment, cap, and `personBalance` tests stay green.                                                                                                              |
| `public/sw.js`                                              | `VERSION` only, the next free value at merge time (Q5). This sketch does not pick the number. See Sequencing.                                                                                                                   |
| `tests/shell-cache.test.js`, `tests/webkit-upgrade.test.js` | The same version pins, after that bump.                                                                                                                                                                                         |
| `docs/PSTACK_INVENTORY.md`                                  | Evidence on the PR C rows: `principle-explain-the-number`, `principle-prove-it-works`, `tdd`. Do not flip a status word. Those three rows are already «مطبّقة» (`docs/PSTACK_INVENTORY.md` lines 29, 40, and 82 at `baf4f21f`). |

## Files the code PR must not touch

`firestore.rules`. `public/ledger.js`. `public/render.js`. `public/sync.js`. `public/session.js`. `public/index.html`. `public/foremen.js`. `package.json`. `.github/workflows/ci.yml`.

`tests/accounts.test.js` is already on both test lists (`package.json` script `test`, and `.github/workflows/ci.yml` line 68 at `baf4f21f`). No new test file, so those two lists stay identical.

`post` still returns a document. C does not change `post`. It does not call `queueDoc` and does not write IndexedDB or Firestore. `projectCost` stays the function B left: `return 0` while `CONTRACTOR_COST_START` is `null` (`public/accounts.js` lines 11 and 175-185 at `baf4f21f`, before B's edit).

Callers of `Accounts` at `baf4f21f` are `tests/accounts.test.js` only. `render.js` does not call it.

## Usage

A test, or a later screen, already holds the person's in-memory rows. It calls `balances(docs, filter)` for the numbers and `statementLines(docs, filter)` for the ordered lines. The same filter object is the scope, the currency, the project, and, when the statement has an end date, `periodEnd`. `statementLines(...).closing` is `balances(...).net` for that object. The caller does not keep a second sum.

`personBalance(docs)` stays the call B's tests use. After C it is the net of the same fold, with no party or project filter. A list of two projects is the consolidated net. Pass `projectId` to `balances` when the number is one project.

`periodBounds('week', day)` and `periodBounds('month', day)` turn a civil `YYYY-MM-DD` into `periodStart` and `periodEnd`. The screen passes those strings in. The fold compares the strings. It does not read a clock and it does not read `statementApprovals`.

Second design considered: a separate statement sum that walks the purposes again. Rejected. B's sketch says C extends the one fold and does not write a second one. Two sums drift, and the property test would be the only thing holding them together. Calling `balances` twice, once for the opening cutoff and once for `periodEnd`, is still that one function.

Third design considered: store the closing on the approval document. Rejected. Plan section 9. The opening is the live fold before `periodStart`. A late row dated inside a closed period changes the live opening. The stored approval does not.

## Types and signatures

All of these stay in `public/accounts.js`. Names already exported stay exported. B's names stay exported. C adds `rowIndex`, `rowCounts`, `balances`, `statementLines`, and `periodBounds` to the return at the bottom of the file (`public/accounts.js` line 187 at `baf4f21f` is the PR A return; B will have added `personBalance` before this edit). `rowCounts` is the only row-count rule. `rowIndex` is the only index. `balances` calls both. PR K and PR B call both. Neither writes a second copy.

`FoldDoc` is B's `AccountDoc` plus the fields the fold reads when the caller has them. `post` does not have to fill them. A missing `currency` counts as IQD, so B's documents still sum. A row with `currency: 'USD'` is out. A missing `txnDate` counts in an all-time fold and in no dated statement.

```javascript
/**
 * @typedef {{
 *   id: string,
 *   purpose: string,
 *   ledger: 'labor',
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
 *   kind?: 'body' | 'appr' | 'rej' | 'sup' | 'rev' | 'revw' | 'stl',
 *   effect: { cost: number, person: number, cash: number }
 * }} FoldDoc
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
 * countedEntries reads err[id] (public/ledger.js lines 305-309 at baf4f21f).
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
 * date filters. A rej_ has no partyId. balances, B, and K all call this.
 * A caller that filters first turns rejection-wins off.
 */
function rowIndex(docs, syncErrors)

/**
 * @param {FoldDoc | null | undefined} row
 * @param {RowIndex} index
 * @returns {boolean}
 * The only exported answer to "does this row's amount enter the buckets?".
 * Party, project, currency, and dates stay in balances.
 * Markers are kind rev, rej, and revw, or an id with those prefixes.
 * A marker never enters the buckets. A sup_ doc is a body, not a marker.
 * One recursive rule, markerLive: the doc is in byId, its id is not a
 * syncErrors key, and no live rev_ names it. Depth stops at 8. A cycle is
 * not live. The same rule covers rej_, rev_, sup_, and revw_.
 * D denies rev-of-rev and rev_ of rej_. Restoring an original because its
 * rev_ was itself reversed is defensive only.
 * A refused marker is not live, so it does not drop the 600,000 approval
 * and it does not restore one.
 * Rejection wins (plan Q7, plan line 1054) for deduct and for approveLabor.
 * An approveLabor is out when a live rej_ names its target, and when that
 * body is reversed or refused. If the body has not arrived, the approval
 * still counts. The amount is on the approval.
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
 * With both dates, opening is the fold of rows whose txnDate is a string
 * strictly before periodStart. That compare is string order. It does not
 * compute the previous calendar day.
 * Figure amounts are the rows inside the period. Closing is
 * balances(docs, the same party, project, currency, periodEnd, syncErrors).net.
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
 * session.js line 94 today() is the bug class this avoids. The date fix owns that line.
 * 2026-02-15 is 2026-02-01 through 2026-02-28.
 * The same strings come back under TZ=UTC and under TZ=Asia/Baghdad.
 */
function periodBounds(kind, day)
```

`PURPOSES` keeps the nine keys in the order already asserted by `tests/accounts.test.js` (the test "the nine purposes are labor"). `statementSign` stays `effect.person` (`public/accounts.js` line 50). C changes three shared tokens. At `baf4f21f` the collisions are:

- `advanceLabor` and `returnAdvance` both `'advances'` (lines 31 and 33).
- `payLabor` and `refundLabor` both `'payments'` (lines 32 and 34).
- `laborQty` and `approveDeduct` both `'out'` (lines 29 and 36).

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
11. `openAdvances`, «سلف قائمة عليه». Closing split. Amount is advances paid minus cash returned minus settlements. Does not enter.

«الصافي» is the label of `balances().net`. It is the same number as closing. It is not a second figure line.

The sum of `amount * sign` over lines with `entersClosing` true equals `closing`. On the 480,000 fixture that sum is `0 + 600,000 - 0 + 0 - 70,000 - 50,000 + 0 = 480,000`. Adding the advance detail lines on top of «صافي السلف» would double-count. The test fails if a line's `entersClosing` flag does that.

Unapproved rows are `pendingIds`. They are listed by the later screen under «بانتظار الاعتماد» and they are not in the arithmetic (plan section 9, line 623). C returns the ids. It does not draw them.

## Fold rules

`balances` calls `rowIndex` on the full list, then `rowCounts` for each doc, then the party, project, currency, and `periodEnd` filters. A `rev_` dated after `periodEnd` still removes its original from that statement. The date filter does not build a second index. The rules below are `rowCounts`. They are not copied into `balances`, B, or K.

- `syncErrors` is a record keyed by id, the same input `countedEntries` already takes (`public/ledger.js` lines 305-309 at `baf4f21f`). A present key means the id is refused, including a marker. The stored value is ignored. Callers pass `get(K.syncErrors, {})`. They do not pass a Set.
- A doc is superseded when a live `sup_` has that id as `supersedesId`, or its id is `sup_` plus this id. The `sup_` doc is the replacement body. It counts by the normal rules, including its own approval when the purpose needs one, and it drops out if it is itself superseded, reversed, or refused. It is not a marker.
- It is not reversed by a live `rev_`. A doc whose id is `rev_` plus this id, or whose `reversesId` is this id, reverses it. Live is the one recursive rule above, so a refused `rev_` does not reverse anything, and a refused rev-of-rev does not restore the original. D denies rev-of-rev. The restore branch is defensive. The `rev_` row is not a second subtraction. A reversed approval of 600,000 leaves net 0, not -600,000. EA Q7 is approved: the balance returns to zero (EA, 00:52 Baghdad). That is the same reading as plan Q1.
- Markers are `rev`, `rej`, and `revw` only. `approveLabor` and `approveDeduct` are money rows through the purpose table, and `approveDeduct` has zeros.
- `needsApproval` is false, or `rowCounts` is true for the approval that points at this id. An approval is out when a live `rej_` names its target.
- Rejection wins for approvals, not only for deducts (plan Q7, plan line 1054). An `approveLabor` whose target body also has a live `rej_` is out of every bucket, even though `needsApproval` on `approveLabor` is false (`public/accounts.js` line 30). The same approval is out when that body is reversed or refused. Two offline phones can each land one create before the other commits. Rules close the sequential orders. The fold is the side that sees both. A `deduct` aimed at that approval is out too, because `rowCounts` of the approval is false.
- A `deduct` counts only when a live `approveDeduct` points at it and no live `rej_` names the deduct. `laborQty` has zeros either way. A `sup_` of an unapproved deduct replaces it. The old deduct adds nothing.
- A `settle` adds 0 to `net`. Its amount counts in `settlements` and lowers `openAdvances` only while `rowCounts` is true. It is out when `rowCounts` of `appr_` plus the measurement id is false. That covers a rejected measurement, a reversed approval, and an approval in `syncErrors`. Dropping it does not change `net`. It puts the settled amount back into `openAdvances`.

Plan line 419 says a row is rejected when `rej_` exists and no approval exists. That display rule disagrees with rejection-wins: both can land, and the fold then counts the approval as 0. F must align the screen so it does not show «معتمد» on that approval. This sketch does not edit F.

`net` = approved labor - advances paid - payments + cash returned + labor refunds - counted deductions.

`payableGross` = approved labor - payments + labor refunds - counted deductions - settlements.

`openAdvances` = advances paid - cash returned - settlements. «سلف قائمة عليه».

`netAdvances` = advances paid - cash returned. «صافي السلف». Settlements are not in it.

`payableGross - openAdvances` = `net`. `payable` is `max(payableGross, 0)` and `recoverable` is `max(-payableGross, 0)`. Neither is the statement closing. On the person screen, «مستحق له» and «مستحق عليه» sit next to `net` («الصافي»), not next to `payable`. The delete block uses that same `net`. See «أسئلة لأمير».

`overLimitIds` names the parent line. It does not remove either child from `net`. A parent is in this list only when `rowCounts` is true for it. A pending deduct is the one row that still counts toward the cap while `rowCounts` is false. A rejected approval is not a parent.

- Live `refundLabor` rows whose `targetId` is one `payLabor`, summed above that payment's amount.
- `deduct` rows that are not reversed and not rejected, including a pending deduct, whose `targetId` is one `approveLabor`, summed above that approval. This matches B's cap: a pending deduct counts toward the flag and does not count in `net` until `approveDeduct`.
- Live `returnAdvance` plus live `settle` on one `advanceLabor`, summed above that advance.

`unreviewedCashIds` names a counted cash row (`payLabor`, `advanceLabor`, `returnAdvance`, `refundLabor`) that has no live `revw_`. The first mark is `revw_` plus the body id. A later mark, after `rev_` of the earlier one, is `revw_` plus the body id plus `_` and a generation `1` through `9` (plan lines 240-242). Live is the same `markerLive` rule: in the list, not a `syncErrors` key, and no live `rev_` names it. The flag does not change `net`. Cash counts when it is written (Q10 أ). C returns the ids so the later screen can hide the finalise button. C does not create `statementApprovals` and does not draw the button.

A reversed `settle`, a settle of a rejected measurement, and a settle whose approval was reversed all drop out the same way. `openAdvances` goes back up by that amount. `net` does not move because of the settle. If the approval itself leaves, `net` moves by that approval only.

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
- `M3: a rej_ with no partyId still wins under a party filter`. The approval has `partyId`. The `rej_` has none. `balances` with that `partyId` returns net 0. The index was built from both docs.
- `M3: a rev_ after periodEnd still removes the original`. The approval is dated inside the period. The `rev_` is dated after `periodEnd`. Closing is 0.
- `L4: order does not matter, and a rev_ alone is 0`. The same docs in two orders return the same `Balance`. A `rev_` whose original is not in the list, carrying the same purpose and amount, gives net 0. It is not -600,000 and not 600,000.
- `L4: a reversed approveDeduct returns 480000 to 530000`. The 480,000 rows, then `rev_` of the `approveDeduct`. `net` is 530,000. The deduct no longer counts.
- `L4: an approveLabor whose body is reversed or refused is out`. Body reversed: net 0. Body id in `syncErrors`: net 0. Body absent from the list: the approval still counts, net 600,000.
- `overLimit keeps both rows`. `payLabor` 600,000 and two live `refundLabor` rows of 400,000 against it. Both refunds stay in the net: `net` is 200,000 (`-600,000 + 400,000 + 400,000`). `overLimitIds` contains the payment id. Dropping either refund would not yield 200,000.
- `personBalance matches balances().net`. On the 480,000 list the two calls return 480,000. `approveLabor` 600,000 then `payLabor` 600,000 is 0. `payLabor` 700,000 after that approval is -100,000. A `deduct` of 50,000 with no `approveDeduct` does not move the number. The same list plus `approveDeduct` moves it by -50,000.
- `an unreviewed payment still counts`. `payLabor` 100,000 and no `revw_`. `net` is -100,000 and the id is in `unreviewedCashIds`. A live `revw_` of that id keeps `net` at -100,000 and clears the flag. `rev_` of that mark puts the flag back and leaves `net` at -100,000. A later `revw_<id>_1` clears the flag again.

v1 strings are the approved 88 in `strings-contractor-module-r2.22.md` (sha256 `9d25840a01257eb76cba6ce6323d32436bd08c471e5e49a703af9d6bb10a6d3a`). Strings r2.23 records Ameer's approval of that list and of the tab «حسابات» on 2026-11-10 at 11:16 Baghdad. C adds no Arabic. A label that is not one of those 88 is a question in «أسئلة لأمير», with a recommended default. Plan lines 1034 and 1076 still say the list is open. That sentence is stale. r2.23 is the record this sketch follows.

## Strings

This docs PR adds none. The code PR adds none that are new. Each label below is reused.

| Label                                 | Mark                 | Where it already is                                                                                                                                                                                            |
| ------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| «عمل معتمد»                           | reused, v1 string 13 | the approved 88                                                                                                                                                                                                |
| «مدفوع للعمل»                         | reused, v1 string 14 | the approved 88. The statement line for `payLabor`. «الدفعات» stays the subcontract card at `public/render.js` line 754.                                                                                       |
| «المُرجَع من الدفعة نقداً»            | reused, v1 string 70 | the approved 88                                                                                                                                                                                                |
| «السلف المصروفة له»                   | reused, v1 string 65 | the approved 88                                                                                                                                                                                                |
| «المُرجَع من السلف نقداً»             | reused, v1 string 66 | the approved 88                                                                                                                                                                                                |
| «صافي السلف»                          | reused, v1 string 67 | the approved 88                                                                                                                                                                                                |
| «الخصومات ومرتجعات المواد»            | reused, v1 string 62 | the approved 88                                                                                                                                                                                                |
| «تسوية سلفة»                          | reused, v1 string 21 | the approved 88                                                                                                                                                                                                |
| «رصيد أول المدة»                      | reused, v1 string 61 | the approved 88                                                                                                                                                                                                |
| «رصيد آخر المدة»                      | reused, v1 string 63 | the approved 88                                                                                                                                                                                                |
| «سلف قائمة عليه»                      | reused, v1 string 68 | the approved 88                                                                                                                                                                                                |
| «الصافي»                              | reused, v1 string 69 | label of `net`, not a second figure line                                                                                                                                                                       |
| «مستحق له»                            | reused, sentence 87  | EA decided C reuses sentence 87. On the person screen it labels `net` («الصافي»), not payable. See «أسئلة لأمير». The foreman badge at `public/foremen.js` lines 148 and 174 is a different account and stays. |
| «مستحق عليه»                          | reused, v1 string 16 | recoverable, `max(-payableGross, 0)`. The screen draws it.                                                                                                                                                     |
| «بانتظار الاعتماد»                    | reused, v1 string 45 | the screen's heading for `pendingIds`                                                                                                                                                                          |
| «غير مدقّق»                           | reused, v1 string 71 | the screen's badge for `unreviewedCashIds`                                                                                                                                                                     |
| «لا يُعتمد الكشف وفيه مبلغ غير مدقّق» | reused, v1 string 72 | the screen, while `unreviewedCashIds` or `overLimitIds` is non-empty. C does not show it.                                                                                                                      |
| «معكوس»                               | reused               | already in `public/render.js`. Not a new statement line.                                                                                                                                                       |

Not used, and not added: «مواد معتمدة», «فرق سعر الصرف», «رصيد افتتاحي», «من إقفال الكشف السابق». Materials, USD, and a stored opening are out of v1. The advance-line overrun sentence is still the screens PR's question, as B's sketch left it. C ships the id list only.

## Sequencing

This docs PR touches one new file. It does not bump `VERSION`.

Parallel work, and what makes the later code PR sequential:

- Baghdad-date bug fix. Files `public/session.js` and `public/render.js`. It merges first. C's code does not edit those files. Both PRs bump `public/sw.js` if they edit `public/`, so the code PR rebases the version after that fix. Pins: `tests/shell-cache.test.js` (three `aj-p0-v58` asserts, lines 43, 65, and 93 at `baf4f21f`) and `tests/webkit-upgrade.test.js` line 18 `MARK`.
- Foreman export. Files `public/ledger.js` and `public/render.js`. C's code does not edit them. Shared bump is `public/sw.js` and those same pins.
- PR B code. Files `public/accounts.js` and `tests/accounts.test.js`. C is sequential after B on those two files. Rebase C's code onto B. Do not edit them in parallel.
- Other phase sketches. Other files under `docs/plans/`. This file's name is only C. No sequential dependency for this docs PR.

`VERSION` at `baf4f21f` is `aj-p0-v58` (`public/sw.js` line 1). Q5 is approved: the code PR takes the next free number at merge time and does not pin one now. The date fix merges first as `aj-p0-v59` (earlier answer, 00:38 Baghdad, which wins over the proposed table that numbered C as v62). C does not claim v59, v62, or any other number. If a later edit of this lane does bump `public/sw.js`, that pin stays renumberable until merge. This docs PR does not bump it.

`accounts.js` is already on the page (`public/index.html` line 71) and on `SHELL_FILES` (`public/session.js` line 271). C does not add a script tag.

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

## Citation fixes at baf4f21f

The plan cites older SHAs. These sentences are no longer true at `baf4f21fc54c156989334e826d19990b8e5e8a74`. The code PR uses the lines in this list.

- Plan lines 151 and 931. Service worker `VERSION` on main is `aj-p0-v56`, and the plan does not reserve `aj-p0-v57`. At this SHA `public/sw.js` line 1 is `aj-p0-v58`. v57 shipped in #71. v58 shipped in #72.
- Plan line 555. `state.formId` is replaced after save at `public/render.js` line 1177. The field is still created at `public/render.js` line 40. The reset after save is line 1258. The entry object is built at line 1248.
- Plan line 641. «قيود بلا عقد» at `public/render.js` line 707. It is line 755. «المقاولون» is still line 85. Plan line 734 puts «الدفعات» at `public/render.js` line 706. It is line 754.
- Plan line 629. `countedEntries` at `public/ledger.js` lines 298-308. `totals` is still lines 27-39. `sign` is line 24. `countedEntries` is lines 307-310.
- Plan line 931. `SHELL_FILES` at `public/session.js` line 263. It is line 271, and `accounts.js` is already on it. The script tag is `public/index.html` line 71, inside the plan's lines 69-72.
- Plan line 434. `public/sync-status.js` lines 154-165 hide a refused id. Those lines are `messageAfterProjectProbe` (the function starts at line 157). The error map is read at line 190. The adopt compare the plan puts at `public/sync.js` lines 631-634 is `sameContent` at line 634 and `sameReversal` at line 635.
- Plan lines 1034, 1038, and 1076. Q-strings and Q-rules still open in the plan text. Strings r2.23 records the 11:16 approval of the 88 and of «حسابات». Q-rules stays D. This sketch does not edit rules.
- `public/app.js` lines 34-35 are still the demo owner and the demo site user. `firestore.rules` line 11 is still `isOwner()`, line 19 is still `idOk`, and lines 52-54 are still `projectOpen`. #72 did not edit the rules. `public/foremen.js` lines 367-368 are still `draft.formId || uuid()`.

`public/accounts.js` did not change between PR A (`0f17cf31`) and this SHA. The shared statement tokens above are the PR A tokens.

## Revert

This docs commit reverts with `git revert`. It has no app bytes and no service-worker bump.

The later code PR also reverts with `git revert`. C creates no Firestore documents, so the revert deletes nothing on the server. If that code PR has already bumped `VERSION`, the revert puts the previous version back, and the next `public/` change takes whatever is then free. Do not reuse a version a phone has already cached.

## Dependencies

- PR A is on main. The nine purposes, `statementSign`, and the labor math are in `public/accounts.js`.
- PR B's code lands first on `public/accounts.js` and `tests/accounts.test.js`. C rebases onto that. B adds `personBalance`, the payment actions, the cumulative cap, and the `approveLabor` / `approveDeduct` pointers. C does not rewrite `post` and does not add a second fold.
- This docs PR does not wait for B's code. The r3 sketch is the contract.
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

After the Architect's review and Ameer's go, rebase onto PR B's `public/accounts.js` and add `rowIndex`, `rowCounts`, `balances`, `statementLines`, and `periodBounds` so the 480,000 test, the 530,000 test, and the refused-`rej_` test all pass.

## أسئلة لأمير

EA Q7 انحسم: عكس اعتماد 600,000 يرجّع الرصيد صفر. ما نضيف جملة جديدة.

**1. وين يطلع رقم «مستحق له».**

الجملة 87 توافق عليها، ونعيدها. بس الجملة 86 و87 تحط الرصيد الصافي بعد «مستحق له» و«مستحق عليه». على مثال 600,000 وخصم 50,000 وسلفة 100,000 ومرتجع 30,000، الصافي 480,000 والمستحق قبل طرح السلفة 550,000. لو كتبنا 550,000 جنب «مستحق له» و480,000 جنب «الصافي»، نفس الكلمة تطلع برقمين.

المقترح، بلا جملة جديدة:

- شاشة الشخص: «مستحق له» جنب «الصافي»، والرقم 480,000. وتحتهم «سلف قائمة عليه» 70,000. ما نكتب 550,000 جنب «مستحق له».
- منع حذف المشروع، الجملتان 86 و87: نفس الصافي، 480,000، على هذا المشروع.
- شارة الخلفة تبقى كما هي. حساب ثاني.

اكتب «تأكيد»، أو سمّ الشاشة والرقم.
