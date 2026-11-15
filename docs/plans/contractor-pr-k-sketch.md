# PLAN ONLY: contractor PR K sketch

No code in this pull request. No edit to `public/`, `firestore.rules`, or `public/sw.js`. The code PR comes after the Architect reviews this sketch and Ameer says go.

Parent plan: `plan-contractor-module-r2.28.md`, sha256 `ef1c98d08a7118ed35469d250c81605a7f17f518d949f8446b8c63bb1869c8a2`. This sketch is plan section 10 (Project cost, H3) and the PR K row in section 13. Base for the later code PR: `baf4f21fc54c156989334e826d19990b8e5e8a74` (v58, service worker `aj-p0-v58`). PR A is already on that commit (`public/accounts.js`).

Arena was not run. Ameer's gate bans it (cost). The shape is the one already approved in r2.28. This file is the sketch those gates asked for before code.

Format follows the Architect-approved PR B sketch. PR B's types and functions are what B will add. K does not redo them.

Revision r2, against Architect NOTES on `b5624404` (review sha256 starts `84ddfb4e`). C lands first and exports `rowCounts(row, index)`. K calls that function. K does not define a second live-row rule.

## Scope

Plan r2.28 sections 10 and 13. Order is A, B, C, then D merged and deployed by Ameer, then E, F, K, then G-J. K is after C and before G-J. C's code, including the exported `rowCounts`, is on the base before K's code. K reuses it. K does not land against a C that still has the check inline.

PR K puts `projectCost` on the owner home and the owner project screen. The owner's profit is received minus that number. Received stays the legacy income fold. Site `spent` stays the legacy figure. `CONTRACTOR_COST_START` stays `null`. An engineer sets that constant and deploys only after Ameer says go through EA, on the day the new section ships. While it is `null`, K adds no new cost. K does not edit legacy rows. K creates no new document kind.

The open question in section 10 (a new legacy `عمالة/سلفة` or `مقاول` row on or after that later date) stays open. K implements none of options (1) through (5). The code PR does not filter legacy rows by `entryDate`, does not block a legacy save, and does not add a warning.

In K, once a test passes a real date:

- Legacy labour 100,000 plus a labour approval 600,000 plus `payLabor` 600,000 is project spent **700,000**.
- A mutation that lets the payment add cost would be 1,300,000. The test expects 700,000.
- A mutation that drops the approval's cost would be 100,000. The test expects 700,000.
- Reversal of the approval is 100,000.
- The approval id in `syncErrors` is 100,000.
- An adopted `appr_` (one id, server copy kept, that id absent from `syncErrors`) is still 700,000.

While the constant is `null`, the same approval adds nothing, and the owner figure stays the legacy spent.

Outside K: material purposes, `inv_`, screens G-J, the adopt path (E), parties and agreements (F), rules (D), the statement fold (C), CSV, `subcontractBalance`, `countedEntries`, `toCSV`, and any write of `CONTRACTOR_COST_START`. The live-row rule is C's `rowCounts`. K calls it.

The projects list already shows the same owner profit as the project screen (`public/render.js` lines 617-621 and 631-634). K uses one function for the home total, that list's open-project profit, and the project screen. Archived cards stay a name and a restore button (lines 612-616). They gain no figure.

## Files the code PR edits

| File                           | Change                                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/accounts.js`           | Replace `projectCost` so it calls C's exported `rowCounts(row, index)`. Do not declare `rowCounts`. Keep `CONTRACTOR_COST_START` as `null`. |
| `public/render.js`             | Owner home (lines 546-551), open project cards (lines 617-621), and the owner project screen (lines 631-634) call the helper below.         |
| `tests/accounts.test.js`       | The behaviour tests below. The null-date test at lines 78-81 is rewritten for the new signature and still expects no new cost.              |
| `public/sw.js`                 | `VERSION` only, the next free value at merge time. At this base it is `aj-p0-v58` (`public/sw.js` line 1). Do not reserve the next number.  |
| `tests/shell-cache.test.js`    | The three pins at lines 43, 65, and 93, same string as `VERSION`.                                                                           |
| `tests/webkit-upgrade.test.js` | `MARK` at line 18, same string as `VERSION`.                                                                                                |
| `docs/PSTACK_INVENTORY.md`     | A next-step sentence on the «ناقصة» redesign row (line 41). Evidence links only on the two «مطبّقة» rows (lines 29 and 58).                 |

Behaviour lives in `public/accounts.js` and `public/render.js`. `public/ledger.js` is not one of them.

`ownerSpent` is a local function in `public/render.js`. It is the only screen caller of `Accounts.projectCost`.

```javascript
function ownerSpent(projectId, entries) {
  const errs = get(K.syncErrors, {}) || {};
  const counted = L.countedEntries(entries, errs).filter(e => e.projectId === projectId);
  const legacy = L.totals(counted).spent;
  const txns = get(K.accountTxns);
  return Accounts.projectCost(projectId, legacy, txns, errs, Accounts.CONTRACTOR_COST_START);
}
```

Owner home sums `ownerSpent` over `data().projects`. Received stays `L.totals(counts(entries)).received` (`counts` is lines 360-362). Profit is received minus that sum. The owner project screen keeps `projectSummary`'s received and sets المصروف from `ownerSpent` and الربح to received minus that. The open project card uses the same pair.

## Files the code PR leaves unchanged

`public/ledger.js`. `countedEntries` (lines 307-310), `totals` (lines 27-39), `projectSummary` (lines 111-115), `toCSV` (lines 288-296), `subcontractBalance` (line 461), and `foremanBalance` (lines 649-668) stay as they are. The owner CSV stays `public/render.js` lines 1294-1295.

`public/session.js`. The Baghdad-date fix owns the date change. E adds `accountTxns` on `K` (E sketch, the six names on line 5). At `baf4f21f` that name is absent (`public/session.js` line 5). K does not add it. The code PR's base includes E's key. `ownerSpent` calls `get(K.accountTxns)` with no default list. A missing name fails `tests/strict-render.test.js`. An empty array stored under the key is a real empty log, and the new half is 0. `get` at line 63 is unchanged.

`public/foremen.js`, `public/sync.js`, `public/app.js`, `public/index.html`, `firestore.rules`. `accounts.js` is already the script before `render.js` (`public/index.html` lines 71-72).

Site branches stay on the legacy figure: home today-spend at `public/render.js` lines 555-558, the site card at line 621, and the site project block at line 635. `projectSummary` for a site user returns `spent` only (line 114).

No new test file, so `.github/workflows/ci.yml` and `package.json` stay as they are. `tests/accounts.test.js` is already on the unit list. A rebase that makes those two lists differ is a mistake. They must stay identical.

`tests/strict-accounts.test.js` and `tests/strict-render.test.js` stay green. K adds no `tsconfig`.

## Usage

The owner home already holds visible ledger entries. For each visible project it computes legacy spent with `Ledger.countedEntries` and `Ledger.totals`, then calls `Accounts.projectCost(projectId, legacySpent, txns, syncErrors, Accounts.CONTRACTOR_COST_START)`. The call returns one integer. The screen adds those integers for إجمالي المصروف. It does not walk `PURPOSES` itself.

The project screen makes the same call for that project id. المصروف is the return value. الربح is المقبوض minus it. المقبوض is still the legacy income total.

A test that needs the 700,000 figure passes the date `'2026-12-01'` as `start`. The screen never passes a date literal. It passes the exported constant, which stays `null`.

`projectCost` does not read IndexedDB, does not call `queueDoc`, and does not write a ledger row. `post` is unchanged.

Second design considered: teach `Ledger.projectSummary` to add account cost when the user is the owner. Rejected. Home uses `totals`, not `projectSummary` (lines 546-547). The site return is the other branch of the same function (line 114). The cost rule is the `PURPOSES` table in `accounts.js`. Moving it into `ledger.js` copies that table, and plan section 10 leaves `countedEntries` as the legacy source. A third design, a loop in each of the three screens, was rejected because the date gate, the deduct rule, and the reversal rule would exist three times. Arena was not run.

## Types and signatures

`projectCost` stays in `public/accounts.js`. Names C already exported stay exported. `rowCounts` is one of those names. K does not declare it and does not add it to the return.

```javascript
/**
 * @typedef {{
 *   id?: string,
 *   projectId?: string,
 *   purpose?: string,
 *   amount?: number,
 *   txnDate?: string,
 *   targetId?: string,
 *   reversesId?: string,
 *   supersedesId?: string
 * }} CostTxn
 * One accountTxns row, as the fold sees it. K does not add fields.
 * amount is omitted on approveDeduct (plan 428, PR B). A reversal copies
 * purpose and amount (plan 360) and sets reversesId.
 */

/**
 * Defined and exported by PR C. K does not declare this function.
 * Rejection-wins, rev-of-rev, and marker detection stay inside C.
 * @param {CostTxn} row
 * @param {object} index
 * @returns {boolean}
 */
// Accounts.rowCounts(row, index)

/**
 * Owner cost for one project: legacy spent plus the cost column.
 * legacySpent is Ledger.totals(countedEntries for this project).spent.
 * start is CONTRACTOR_COST_START on the screen. Tests pass a date or null.
 * The new half is 0 unless start matches /^\d{4}-\d{2}-\d{2}$/.
 * A row adds cost only when Accounts.rowCounts(row, index) is true.
 * Does not read entryDate. Does not write. Does not read slotLosers
 * or linkRefusals.
 * @param {string} projectId
 * @param {number} legacySpent
 * @param {readonly CostTxn[]} txns
 * @param {Record<string, unknown>} syncErrors
 * @param {string | null} start
 * @returns {number}
 */
function projectCost(projectId, legacySpent, txns, syncErrors, start)
```

`CONTRACTOR_COST_START` stays the binding at `public/accounts.js` lines 9-11: `null`, type `string | null`. K does not assign it.

There is one `projectCost`. The code PR replaces the function at lines 175-185, and PR B's `return 0` stub, with the signature above. The old two-argument call goes away in that same change.

`projectCost` calls `rowCounts(row, index)` and does not keep a second predicate beside it. C lands first. The code PR rebases onto that export.

Fold, in order:

1. If `start` is not `YYYY-MM-DD`, return `legacySpent`.
2. Build `index` once from `txns`, in the shape C's `rowCounts` takes. One id, one row. A later row with the same `id` replaces the earlier row.
3. For each row whose `projectId` is this project, whose `txnDate` is a `YYYY-MM-DD` string, and whose `txnDate` is greater than or equal to `start`: if `rowCounts(row, index)` is true, add `PURPOSES[purpose].effect.cost * amount`.
4. A missing purpose, a missing `txnDate`, or an amount that is not an integer adds 0 for that row. `approveDeduct` has no amount and effect cost 0, so it adds 0. The deduct body carries the amount.
5. Return `legacySpent` plus that sum.

`effect.cost` stays the table at lines 28-38. `approveLabor` is cost +1 and `needsApproval` false (line 30). `payLabor` is cost 0 (line 32). `deduct` is cost -1 and `needsApproval` true (line 35). `approveDeduct` is cost 0 (line 36). K does not edit the table. A payment adds no cost because its multiplier is 0, with or without `revw_`.

Rejection-wins, marker detection (id prefix or pointer field), and rev-of-rev stay in C's function. K does not restate them. D's rules sketch denies a `rev_` of a `rev_` (PR #80, test `rev: a rev_ of a rev_ is denied`). `rev_` of a `revw_` is a different create and that sketch allows it (`s7.13`). If a list still holds a `rev_` of a `rev_`, C's `rowCounts` is the reading. K does not write another.

`slotLosers` and `linkRefusals` are not arguments. The adopted snapshot has one approval row. The loser's copy is absent. K does not read those maps.

Legacy rows are every counted expense `totals().spent` already includes, including a row whose `entryDate` is on or after a future start. That is the open question left unanswered.

## Tests (behaviour)

All in `tests/accounts.test.js`. Each asserts a number. None asserts a helper's source text. The legacy 100,000 is `Ledger.totals(Ledger.countedEntries(...)).spent` for one labour expense `{ id: 'leg-1', projectId: 'p', direction: 'expense', entryType: 'labour', amount: 100000, isReversal: false }`. The test requires `public/ledger.js` and `public/accounts.js`. The approval's `txnDate` is `'2026-12-01'` and the passing `start` is `'2026-12-01'`.

Section 10 and section 13:

- `legacy 100000 plus approveLabor 600000 plus payLabor 600000 is 700000`. The payment row is in the list. Its purpose is `payLabor` and its amount is 600,000. The assertion kills a payment that adds cost (that result would be 1,300,000) and an approval that adds no cost (that result would be 100,000).
- `reversal of the approval is 100000`. A row with `reversesId` of the approval is in the list. The approval adds nothing. The `rev_` row adds nothing. The result is 100,000. Ignoring the reversal would leave 700,000. Subtracting the 600,000 a second time would leave -500,000.
- `approval id in syncErrors is 100000`. Legacy stays. The approval is out.
- `adopted appr_ counted once is 700000`. Two objects share one approval id, amount 600,000, and that id is absent from `syncErrors`. `payLabor` 600,000 is present. The result is 700,000. A second id would be a different document. This fixture is the post-adopt list E leaves behind. K does not run the adopt path.

Same section 10 rules, locked so the code PR cannot drop them:

- `null start keeps legacy 100000`. `Accounts.CONTRACTOR_COST_START` is `null`. `projectCost(..., null)` with the approval and the payment returns 100,000. The old call at lines 78-81 expected 0 because it passed no legacy spent. The rewritten test expects 0 when `legacySpent` is 0, and 100,000 when `legacySpent` is 100,000.
- `txnDate before the start is 100000`. Approval `txnDate` `'2026-11-30'` and start `'2026-12-01'` returns 100,000. The start day itself is the 700,000 case (`txnDate` greater than or equal to `start`, which is what line 179 does today with `<`).
- `a non-date start keeps legacy 100000`. `start` `'soon'` returns 100,000. Only `YYYY-MM-DD` opens the gate.
- `deduct 50000 against approveLabor 600000`. The list is legacy 100,000, `approveLabor` 600,000 (id `appr_labor-1`, `targetId` `labor-1`), and `deduct` 50,000 (id `ded-1`, `targetId` `appr_labor-1`). With no `approveDeduct`, the result is 700,000. The same list plus `approveDeduct` (`appr_ded-1`, `targetId` `ded-1`, no amount) is 650,000.
- `reversed target approval: the deduct adds nothing`. That 650,000 list plus a `rev_` of `appr_labor-1` is 100,000. The approval's cost is out, and the deduct adds nothing.
- `rejection wins: appr_ plus rej_ of the body is 100000`. The 700,000 rows plus `rej_labor-1` (`targetId` `labor-1`). The approval's 600,000 is out. Counting it would leave 700,000.
- `rejection wins: rej_ of the deduct adds no deduct effect`. Legacy 100,000, `approveLabor` 600,000, `deduct` 50,000, `approveDeduct` of that deduct, and `rej_ded-1` (`targetId` `ded-1`). The result is 700,000. The -50,000 is absent.
- `a live supersede of the approval is 100000`. A row with `supersedesId` of the approval, not in `syncErrors`, drops the 600,000.
- `an approval on another project stays 100000`. The approval's `projectId` is `'q'`.
- `a refused legacy labour row is not in the 100000`. The labour id is in the `syncErrors` map passed to `countedEntries`, so the number handed to `projectCost` is 0. With the approval and a real date, the result is 600,000.
- `a refused rev_ does not remove the approval`. The `rev_` id is in `syncErrors`. The result stays 700,000.

`tests/browser-check.js` line 1544 (owner home total) stays green. The constant is `null`, so the home total is the legacy spent the check already sees. K adds no browser path that sets the date. `tests/strict-accounts.test.js` stays green.

## Strings

No new Arabic string. The v1 count stays 88. Ameer approved that list in `strings-contractor-module-r2.22.md` (sha256 starts `9d25840a`) and the tab «حسابات» on 2026-11-10 11:16 Baghdad. This sketch adds no string outside those 88.

Reused, already on these screens:

| String                      | Where it already is                        |
| --------------------------- | ------------------------------------------ |
| `إجمالي المقبوض`            | `public/render.js` line 549                |
| `إجمالي المصروف`            | `public/render.js` line 550                |
| `صافي الربح`                | `public/render.js` line 551                |
| `المقبوض`                   | `public/render.js` line 633                |
| `المصروف`                   | `public/render.js` lines 621, 633, and 635 |
| `ربح` and `خسارة`           | `public/render.js` lines 620 and 634       |
| `الربح = المقبوض − المصروف` | `public/render.js` line 634                |

That last sentence stays true: الربح is المقبوض minus the figure المصروف shows.

## Sequencing

This docs PR adds one file and does not touch `public/sw.js`. Parallel sketches are other files.

The later code PR is sequential where the files overlap:

- `public/accounts.js` with PR B and PR C. B replaces the loop at lines 175-185 with `return 0`. C lands first and exports `rowCounts(row, index)`. K rebases onto that export and replaces B's stub. K does not move an inlined check and does not declare `rowCounts`.
- `public/render.js` with the Baghdad-date fix (`session.js` and `render.js`; that fix merges first) and with the foreman export (`ledger.js` and `render.js`). K does not edit `session.js` or `ledger.js`. The overlap is `render.js`.
- `public/sw.js`, `tests/shell-cache.test.js`, and `tests/webkit-upgrade.test.js` with every public PR that bumps `VERSION`. The code PR takes the next free value at merge time.
- `docs/PSTACK_INVENTORY.md` with any PR that edits the same evidence cells. The code PR only.

K is after E and F. E's `K.accountTxns` is required on the code PR's base. K does not create the store and does not treat a missing key as `[]`. G-J come after K, so an approval can move this figure. K does not build those actions.

## Accounting advisor

Opinion only. Q1 is closed: cost is booked when work is approved, not when it is paid. The 700,000 fixture is that rule plus the legacy 100,000. A payment adds no cost. A `deduct` adds cost only after `approveDeduct`.

The advisor's option (5) in section 10 (block by person, custody link, opening balances) stays advice. It is not adopted. K does not ship it. The five options stay the question in [أسئلة لأمير](#أسئلة-لأمير).

## Citations at baf4f21

Lines above were read at `baf4f21fc54c156989334e826d19990b8e5e8a74`. The plan cites older SHAs. These statements in sections 10 and 13 are no longer true at this commit:

- Service worker `VERSION` is not `aj-p0-v56`. Line 1 is `aj-p0-v58`.
- The next build step is not PR A. PR A is merged. `public/accounts.js` is on the page at `public/index.html` line 71.
- `projectCost` is not yet legacy spent plus the cost column. Lines 175-185 return 0 while the constant is not a string. When the constant is a string, the loop adds `effect.cost * amount` for purposes with `needsApproval` false, and it skips every `deduct`. Legacy `countedEntries`, `syncErrors`, reversals, and superseded rows are outside that loop. PR B's sketch replaces that body with `return 0`. K replaces the stub with the function in this sketch.
- `countedEntries` is lines 307-310, not 298-308. It still drops an id that is in `syncErrors`.
- The owner CSV call is `public/render.js` lines 1294-1295, not 1196-1199. `toCSV` is `public/ledger.js` lines 288-296. `CSV_COLS` is line 275.
- `SHELL_FILES` is `public/session.js` line 271, not line 263. It lists `accounts.js`. It does not list `foremen.js` or `people-dir.js`. `public/sw.js` lines 2-4 do list those two. K does not reconcile that.
- The script tags are `public/index.html` lines 61-73, not 69-72. `accounts.js` is still immediately before `render.js`.
- `قيود بلا عقد` is `public/render.js` line 755, not 707. The مقاولون card and `+ عقد مقاول` are lines 85-86.
- The من عهدة control on the entry form is `public/render.js` lines 581-587, not 462-468.
- `foremanBalance` is `public/ledger.js` lines 649-668, not 511-531.
- `uuid()` at `public/session.js` lines 85-93 already returns 36 hex characters. The plan's `id-` plus timestamp fallback is not the code at this commit. K does not change `uuid`.

Still true at this commit, and K relies on them:

- `CONTRACTOR_COST_START` is `null` (`public/accounts.js` lines 9-11).
- `totals` is lines 27-39 and `projectSummary` is lines 111-115. Site `spent` is line 114.
- `isOwner` is `firestore.rules` line 11. `isSite` is line 12. The ledger create allows a site user at line 156. `linkOk` is lines 110-116. A مقاول payment checks the subcontract at lines 105-107. `shapeOk` is lines 82-83. `idOk` is line 19.
- Labour is `entryType` `labour`, label `عمالة/سلفة` (`public/ledger.js` line 12).
- The demo seed still has the owner and the site row (`public/app.js` lines 34-35). That site row is not a person who enters the live books.
- `foremanReads` is `public/sync.js` lines 204-210. K does not change pulls.
- The last eight project rows are `public/render.js` line 642. K does not change that list.
- `tests/sw-version-guard.test.js` lines 31-44 still fail a `public/` edit that does not bump `VERSION`. The docs PR does not edit `public/`.

## Blast radius

Callers of `Accounts.projectCost` at this base: the one test at `tests/accounts.test.js` lines 78-81. `render.js` does not call it yet. After the code PR, the callers are `ownerSpent` and that test file.

Ledger totals, CSV, subcontract paid and remaining, and the خلفة balance do not change. Site home, site project cards, and site project المصروف do not change. No rules and no IAM. No new collection. A phone that has not synced still shows the rows it has. K adds no counter document.

While the constant is `null`, owner home and the owner project screen show the same integers they show today, because `projectCost` returns `legacySpent`.

## Revert

The code PR reverts with `git revert`. Revert puts the screens back on `totals` and `projectSummary`. It does not delete Firestore documents, because K writes none. It does not leave a date behind, because K does not assign `CONTRACTOR_COST_START`. No new `docType` is queued, so logout and the outbox do not gain a K row. The service-worker version reverts with the commit. Inventory evidence reverts with the commit.

## Dependencies

- A, merged at this base. The nine purposes and `projectCost`'s current body are in `public/accounts.js`.
- B, before K. Payments, `refundLabor`, `deduct`, `approveDeduct`, `settle`, and the `return 0` stub. K uses B's effect table and B's rule that `approveDeduct` stores no amount. K does not post those rows.
- C, before K, and C's code is merged before K's code is written. C exports `rowCounts(row, index)`. K calls it.
- D, deployed by Ameer before E. K does not edit rules.
- E, before K. E adds `accountTxns` on `K`. K's code PR requires that key and fails `tests/strict-render.test.js` without it. The adopted `appr_` test is a snapshot of E's result: one server row, that id not in `syncErrors`, the loser absent. K does not implement adopt.
- F, before K. The cache key may exist. K reads it and tolerates a miss.
- G-J, after K.

## Risks

- Keeping the loop at lines 175-185, or wrapping it, still skips `deduct` and still ignores legacy spent. The code PR replaces the whole function.
- A second live-row check inside `projectCost` will drift from C. The code PR calls `rowCounts` and does not grow a copy.
- `render.js` will conflict with the date fix and the foreman export. Rebase those hunks. Do not take their date or export edits out.
- Assigning `CONTRACTOR_COST_START` in the code PR turns cost on before the ship-day go.
- Dropping a legacy row because its `entryDate` is on or after `start` answers the open question. K does not.
- Calling `ownerSpent` from lines 555-558, 621, or 635 changes the site figure.
- Reading `slotLosers` would add a copy E already removed from the fold.
- Summing home only over open projects would drop archived projects from إجمالي المصروف even while the date is `null`. Home uses `data().projects`, which includes archived projects for the owner.

## pstack

The app is not claimed to be pstack-compliant. This docs PR does not flip a row in `docs/PSTACK_INVENTORY.md`.

Plan section 16 names the code PR's rows: `principle-redesign-from-first-principles`, `principle-explain-the-number`, `blast-radius`. At `baf4f21f`, redesign is «ناقصة» (`docs/PSTACK_INVENTORY.md` line 41). The code PR writes a next-step sentence on that row: `projectCost` is the owner figure, legacy counted spent plus the cost column, and the loop at `public/accounts.js` lines 175-185 is replaced rather than extended. That row does not get an evidence link. `principle-explain-the-number` (line 29) and `blast-radius` (line 58) are «مطبّقة». Those two gain an evidence link only. A status-word change follows the inventory's own rule. This sketch does not flip one. The 700,000 split is 100,000 legacy plus 600,000 approval, and the payment adds 0. `blast-radius` is the site figure, CSV, and `countedEntries` staying on their current functions.

This docs PR is the architect sketch. Arena was not run. The code PR is the `feature` playbook, after this review, and it is not this commit.

`principle-subtract-before-you-add` is the smaller v1 in plan section 14, already decided. K adds no purpose and no string.

## أسئلة لأمير

**1. بعد ما ينحط تاريخ البداية، شنسوي بقيود «عمالة/سلفة» و«مقاول» الجديدة؟**

هسه التاريخ فاضي. بهالنسخة ما تنضاف كلفة جديدة، والسؤال هذا يبقى مفتوح. يوم ينحط التاريخ، إذا انكتب قيد جديد نوعه «عمالة/سلفة» أو «مقاول» وتاريخه بنفس اليوم أو بعده، شنو يصير؟

1. نمنعهن كلهن. دفع المقاول الحالي يوقف. و«من عهدة» ما تنزل من الخلفة إلا إذا انكتبت مصروف.
2. نمنع «عمالة/سلفة» بس. دفع المقاول يبقى. المصروف، ومقاول بلا عقد، يكدّرن يتكرران، والخلفة تنضرب.
3. نخليهن تنكتب، بس ما ندخلهن بكلفة المالك. دفع المقاول الحقيقي يختفي من كلفتك، والمصروف يكدّر يتكرر.
4. نخليهن وينحسبن، وطلّع تنبيه. الشغل كله يبقى، والتكرار يبقى.
5. رأي المحاسب، مو قرار: المنع يصير على الشخص، وهذا أوسع من النسخة الأولى. إذا ربط العهدة مو جاهز، نأجّل التاريخ.

**الاقتراح:** اكتب «بعدين». ما نختار خيار بهالنسخة. نرجعلك قبل لا ينحط التاريخ.

هالمرحلة ما تطبق ولا خيار من الخمسة. القيد القديم المحسوب يبقى داخل الكلفة، والدالة ما تشوف تاريخه.

قائمة النصوص، 88 جملة، واسم التبويب «حسابات»، موافَق عليها بتاريخ 2026-11-10 الساعة 11:16 بتوقيت بغداد. هالمرحلة ما تضيف جملة خارج الـ 88، فما تعيد سؤال النصوص.

## Decisions only Ameer can make

- Say go on this sketch before any code PR.
- Answer the question above, or leave it as «بعدين». This sketch does not pick an option.
- Do not set `CONTRACTOR_COST_START` in the code PR. The constant stays `null` until an engineer changes it and deploys, after Ameer says go through EA, on the ship day.
- Merge the later code PR only after the Architect's review of that SHA and CI 4/4. This sketch does not merge itself.
