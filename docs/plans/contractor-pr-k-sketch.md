# PLAN ONLY: contractor PR K sketch

No code in this pull request. No edit under `public/`, `tests/`, `firestore.rules`, `scripts/`, `.cursor/`, or `.github/`. The code pull request waits until the AgentLab Architect reviews this sketch and Ameer says go.

Revision r3. r2 was the sketch at `22ed63a5407a6988ff1711bb7ca8dfdbc0101fbd`, based on `baf4f21fc54c156989334e826d19990b8e5e8a74`. This revision was read against main `840b48dcd5bb475075f2499eda1b276c77d5044a`. Arena was not run. Ameer's gate bans it (cost).

K replaces the `projectCost` stub with the real contractor cost, and the cutover is a runtime gate. K merges while `CONTRACTOR_COST_START` stays `null`. The function then returns exactly the legacy figure. It adds no new cost until a later deploy sets that constant to a date, after Ameer says go. This sketch has no other deploy step. Nothing here writes to production. The behaviour tests are fixtures in `tests/accounts.test.js`. They do not call production Firebase.

## What r2 said that this main no longer matches

Citations below were read on `840b48dcd5bb475075f2499eda1b276c77d5044a`. A code pull request reads the lines again at its own base.

- `projectCost` is not the loop r2 placed at `public/accounts.js` lines 175-185. B and C are merged. The function is the stub at lines 1031-1034 and it returns 0.
- `CONTRACTOR_COST_START` is still `null`. The binding is line 11. The type comment is line 10. The deploy sentence is line 9.
- `rowCounts` is exported at line 746. `rowIndex` is exported at line 586. The first id wins (line 591). A later row with the same id does not replace it. K calls those two functions and does not build a second index.
- `statementLines` is line 942. `balances` is line 893. The fold that feeds them starts at line 815. K does not edit those functions.
- `render.js` does not call `projectCost`. The owner home is lines 643-648. Open project cards are lines 718-723. The owner project screen is lines 732-735. Archived cards are lines 713-717 and show a name and a restore button.
- The service worker is `aj-p0-v67` at `public/sw.js` line 2. The pins are `tests/shell-cache.test.js` lines 44, 67, and 98, and `tests/webkit-upgrade.test.js` line 19. r2's `aj-p0-v58` and `aj-p0-v59` are not this main. K reserves no number.
- `K.accountTxns` is already on `public/session.js` line 5. E is merged (#93). K does not add the key.
- r2's deduct result of 650,000 disagrees with the G–J equality fixture. That number is not in `docs/plans/contractor-pr-gj-sketch.md` line 480. K does not use it.
- r2's 1,300,000 payment mutant is not in that fixture. K does not use it.

## Scope

Parent behaviour for this function is the G–J sketch, which is on this main.

Item 2 (`docs/plans/contractor-pr-gj-sketch.md` line 16). Cost is recognised when a measurement is approved. The effect on `approveLabor` is already `{ cost: 1, person: 1, cash: 0 }` (`public/accounts.js` line 71). K's `projectCost` is what puts that cost on the project figure. A payment does not.

Item 3(b) (line 18). Cost is old paid plus new approved, and that is the contractor cost in the P&L. `oldPaid` is the signed sum of live `subcontractor` rows that have a `subcontractId`. `newApproved` is the full live `approveLabor` on that project. A deduct does not reduce it (line 62 and line 480).

The equality fixture K's behaviour test owns is line 480, quoted here and not recomputed:

`legacySpent` 100,000 and `approveLabor` 600,000 with `start` null: `projectCost` returns 100,000. The same rows with `start` on or before the approval's date: `projectCost` returns 700,000. A deduct of 50,000 against that approval does not change either result, which disagrees with B's `deduct` cost of −1 (`public/accounts.js` line 76). A materials row of 50,000 inside `legacySpent` makes `projectCost` 150,000 when `start` is null and 750,000 when `start` is set. The statement cost `oldPaid + unlinked + newApproved` equals `projectCost` minus the non-contractor legacy. While `start` is null, the «حسابات» statement still shows `newApproved` and does not expect it inside home `المصروف`.

J names those numbers and does not ship the assertion (line 480, and again at lines 710 and 769). K's test does.

When the constant is `null`, `projectCost` returns `legacySpent` and nothing from `accountTxns`. Home `المصروف` stays the legacy spent the screen shows today. The 600,000 approval is not in that figure. That is the runtime gate (G–J lines 30, 82, and 659).

When the constant is a `YYYY-MM-DD` date, the same call returns `legacySpent` plus the live `approveLabor` amounts on that project whose `txnDate` is on or after that date. That is item 2 on the P&L: the cost appears because the measurement was approved, not because it was paid. It is item 3(b) because `legacySpent` already holds the old ledger spent for that project, including old paid and «قيود بلا عقد», and the added half is the new approved work. The statement's `oldPaid + unlinked + newApproved` then equals this return minus the non-contractor part of `legacySpent`. K does not compute `oldPaid`, the unlinked line, or cash out. The G–J sketch says K does not compute cash out (line 64). J paints the statement.

`payLabor` is cost 0 (line 73). `approveDeduct` is cost 0 (line 77). K does not apply `deduct`'s cost of −1 (line 76). The person fold still does: `deductions` is line 844 and `net` subtracts it at line 865. K does not edit that fold. The table stays B's.

Q23 stays «بعدين», as r2 recorded from EA on 2026-11-16 00:52 Baghdad. K does not pick option 1, 2, 3, 4, or 5. Legacy rows stay inside the `legacySpent` number. The function does not read `entryDate` and does not drop a legacy row because of the start date.

Order on this main: K's code is first among the unmerged contractor screens. G, H, I, and J merge after K, while F's project-delete guard is on main (G–J lines 30 and 32, and line 691). The guard is on this main (`public/ledger.js` line 1142). L merges after J. None of them wait for the date.

## Files the code PR edits

| File                           | Change                                                                                                                                                                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/accounts.js`           | Replace the stub at lines 1031-1034. Keep `CONTRACTOR_COST_START` as `null` (line 11). Call `rowIndex` and `rowCounts`. Do not declare them. Do not edit `PURPOSES`, `fold`, `balances`, or `statementLines`.                       |
| `public/render.js`             | Owner home (lines 643-648), the owner half of an open project card (lines 720-721), and the owner project screen (lines 733-735) call `ownerSpent`.                                                                                 |
| `types/checkjs.d.ts`           | `AccountsApi.projectCost` at line 1124 gains the signature below. `FoldDoc` (line 1019) is reused. No new interface.                                                                                                                |
| `tests/accounts.test.js`       | The behaviour tests below. The three stub assertions at lines 174, 199, and 249 are rewritten for the new signature. With `legacySpent` 0 and a null start they still expect 0.                                                     |
| `public/sw.js`                 | `VERSION` only, the next free value at merge time. Line 2 is `aj-p0-v67` on this main. K reserves no number.                                                                                                                        |
| `tests/shell-cache.test.js`    | The three pins at lines 44, 67, and 98, the same string as `VERSION`.                                                                                                                                                               |
| `tests/webkit-upgrade.test.js` | `MARK` at line 19, the same string as `VERSION`.                                                                                                                                                                                    |
| `docs/PSTACK_INVENTORY.md`     | The code PR only. It updates the rows named below. It does not edit the header counts. Another pull request, #95, may change that header first. The code PR reads the rows again at its base. This docs PR does not touch the file. |

`ownerSpent` is a local function in `public/render.js`. It is the only screen caller of `Accounts.projectCost`. `public/render.js` has no such call today.

```javascript
/**
 * Owner spent for one project. Owned by public/render.js. Not exported.
 * legacy is Ledger.totals of the counted entries for this project.
 * The last argument is Accounts.CONTRACTOR_COST_START.
 * While that constant is null, the return is legacy.
 * @param {string} projectId
 * @param {readonly object[]} entries
 * @returns {number}
 */
function ownerSpent(projectId, entries) {
  const errs = get(K.syncErrors, {}) || {};
  const counted = L.countedEntries(entries, errs).filter(e => e.projectId === projectId);
  const legacy = L.totals(counted).spent;
  const txns = get(K.accountTxns, []);
  return Accounts.projectCost(projectId, legacy, txns, errs, Accounts.CONTRACTOR_COST_START);
}
```

`get` is `public/session.js` line 63. `countedEntries` is `public/ledger.js` line 340. `totals` is lines 27-39. `K.accountTxns` is `public/session.js` line 5.

Owner home (`public/render.js` lines 643-648) keeps `L.totals(counts(entries)).received` as إجمالي المقبوض. `counts` is lines 416-418. إجمالي المصروف becomes the sum of `ownerSpent` over `data().projects`. `data` is lines 419-421. For the owner, `canSeeProject` returns true at `public/ledger.js` line 50, before the archive check on line 51, so `visibleProjects` includes archived projects. صافي الربح is that received minus that sum. The open-card filter at line 708 is not the home sum. Dropping archived projects from the home sum would change today's figure while the constant is still null.

The owner half of an open card (lines 720-721) keeps `projectSummary`'s received and uses `ownerSpent` for the spent that الربح or خسارة is built from. The site half (line 722) stays `projectSummary`'s spent.

The owner project screen (lines 733-735) keeps المقبوض from `projectSummary`. المصروف becomes `ownerSpent`. الربح is المقبوض minus that. The sentence `الربح = المقبوض − المصروف` stays on line 735.

Archived cards (lines 713-717) stay a name and a restore button.

## Files the code PR leaves unchanged

`public/ledger.js`. `sign` (line 24), `totals` (lines 27-39), `projectSummary` (lines 144-148), `makeReversal` (line 295), `toCSV` (line 321), `countedEntries` (line 340), `subcontractBalance` (line 494), and `foremanBalance` (line 682) stay as they are. Site `spent` is the return at line 147. The owner CSV stays `public/render.js` lines 1512-1516.

`public/session.js`. The key is already there. K does not add `laborReviews` or `refusedLinks`. Those are L and H.

`public/foremen.js`, `public/sync.js`, `public/app.js`, `public/accounts-view.js`, `public/index.html`, `firestore.rules`. Script order is `accounts.js`, then `accounts-view.js`, then `render.js` (`public/index.html` lines 71-73).

Site figures stay on the legacy number. Home today-spend is `public/render.js` lines 652-655. The site card is line 722. The site project block is line 736.

`fold`, `balances`, `statementLines`, `rowIndex`, and `rowCounts` stay C's. `PURPOSES` stays B's, including `deduct`'s cost of −1.

No new test file. `package.json` and `.github/workflows/ci.yml` stay as they are. `tests/accounts.test.js` is already on both unit lists. `tests/strict-accounts.test.js` and `tests/strict-render.test.js` stay green. K adds no `tsconfig`.

K does not hide «+ عقد مقاول». That hide is G, and it uses the same constant at runtime (G–J line 19). While the constant is null the anchor stays.

## Usage

The screen passes `Accounts.CONTRACTOR_COST_START`. It never passes a date literal. A test that needs 700,000 passes a `YYYY-MM-DD` start that is on or before the approval's `txnDate`. The approval date in the existing null test is `'2026-12-01'` (`tests/accounts.test.js` line 174). The 700,000 case uses that same string as both `txnDate` and `start`.

`projectCost` does not read IndexedDB, does not call `queueDoc`, and does not write. `post` (line 468) is unchanged.

Second design, rejected. Teach `Ledger.projectSummary` to add account cost for the owner. Home uses `totals`, not `projectSummary` (lines 644-648). The site return is the other branch of `projectSummary` (line 147). The cost rule is the `approveLabor` amount plus `rowCounts`, in `accounts.js`. Moving it into `ledger.js` copies that rule. A third design, a loop in each of the three owner sites, was rejected because the date gate would exist three times. Arena was not run.

## Types and signatures

`projectCost` stays in `public/accounts.js`. `FoldDoc` is already declared there at line 483 and in `types/checkjs.d.ts` at line 1019. K adds no fields. `rowIndex` and `rowCounts` stay C's exports. K does not redeclare them.

```javascript
/**
 * Owner project cost. Owned by public/accounts.js.
 * legacySpent is the ledger spent for this project. The screen passes
 * Ledger.totals(counted entries for the project).spent.
 * start is CONTRACTOR_COST_START on the screen. Tests pass a date or null.
 * When start is not YYYY-MM-DD, the return is legacySpent and the new half is 0.
 * When start is a date, the return is legacySpent plus live approveLabor
 * amounts on this project whose txnDate is YYYY-MM-DD and on or after start.
 * Which row is live is rowCounts(row, rowIndex(txns, syncErrors)).
 * A deduct does not reduce the sum. effect.cost is not applied.
 * Does not read entryDate. Does not write. Does not read slotLosers or linkRefusals.
 * @param {string} projectId
 * @param {number} legacySpent
 * @param {readonly FoldDoc[] | null | undefined} txns
 * @param {Readonly<Record<string, unknown>> | null | undefined} syncErrors
 * @param {string | null} start
 * @returns {number}
 */
function projectCost(projectId, legacySpent, txns, syncErrors, start)
```

`types/checkjs.d.ts` line 1124 becomes that parameter list. The return stays `number`.

`CONTRACTOR_COST_START` stays `string | null` and stays `null`.

Fold, in order:

1. If `start` is not a string matching `/^\d{4}-\d{2}-\d{2}$/`, return `legacySpent`.
2. `index = rowIndex(txns, syncErrors)`. One id, the first row (line 591). K does not copy that loop.
3. For each value in `index.byId`, add `countedAmount(row.amount)` only when `row.projectId` is this project, `row.purpose` is `approveLabor`, `rowCounts(row, index)` is true, and `row.txnDate` is a `YYYY-MM-DD` string greater than or equal to `start`.
4. Every other purpose adds 0, including `payLabor`, `advanceLabor`, `refundLabor`, `returnAdvance`, `deduct`, `approveDeduct`, `settle`, and `laborQty`. `countedAmount` (line 317) is the existing integer check. A missing amount or a non-integer adds 0 for that row. K does not export `countedAmount`.
5. Return `legacySpent` plus that sum.

Rejection, reversal, and supersede stay inside `rowCounts` (line 746) and `rowLive` (line 694). An id in `syncErrors` is dead at line 668. An `approveLabor` whose target is in the index and not live does not count (lines 751-754). K does not restate those walks.

`slotLosers` and `linkRefusals` are not arguments. The adopted list has one row per id. K does not read those maps.

## Tests (behaviour)

All in `tests/accounts.test.js`. Each asserts a number from the G–J line 480 fixture, or the 0 the stub's callers already expect when `legacySpent` is 0. None asserts a helper's source text. The approval's `txnDate` and the passing `start` are the `'2026-12-01'` already at line 174. A `txnDate` strictly before that start is the case that must stay 100,000. The labour row used to build `legacySpent`, when a test builds it instead of passing the number, is `{ id: 'leg-1', projectId: 'p', direction: 'expense', entryType: 'labour', amount: 100000, isReversal: false }`. `labour` is an expense (`public/ledger.js` line 12). `countedEntries` drops a row whose id is in the error map (line 340). The test requires `public/ledger.js` and `public/accounts.js`.

The equality fixture:

- `k equality: legacySpent 100000 and approveLabor 600000 with start null is 100000`. `Accounts.CONTRACTOR_COST_START` is `null`. The approval is in the list. The return is 100,000. A mutant that returns 0, which is what lines 1031-1034 do today, turns this red. A mutant that adds the 600,000 while `start` is null turns this red.
- `k equality: the same rows with start on or before the approval date is 700000`. `start` and `txnDate` are `'2026-12-01'`. The return is 700,000. A mutant that ignores the approval turns this red. A mutant that also adds a `payLabor` of 600,000 turns this red. That 600,000 is the payment amount already asserted at `tests/accounts.test.js` line 191. The expected number stays 700,000. This is item 2: cost at approval, not at payment.
- `k equality: a deduct of 50000 does not change 100000 or 700000`. The list is the same approval plus a `deduct` of 50,000 and the `approveDeduct` of that deduct. `approveDeduct` stores no amount (`tests/accounts.test.js` line 246). With `start` null the return is 100,000. With `start` on the approval date the return is 700,000. A mutant that applies B's cost of −1 (`public/accounts.js` line 76) turns the 700,000 assertion red.
- `k equality: a materials row of 50000 inside legacySpent is 150000 when start is null and 750000 when start is set`. `legacySpent` is the number that already includes that 50,000. The approval is the same 600,000. The returns are 150,000 and 750,000. A mutant that drops the materials out of `legacySpent`, or that adds the 50,000 a second time from `accountTxns`, turns these red. There is no materials purpose in `PURPOSES` (`public/accounts.js` lines 69-78).

Same fixture, so a second live-row rule cannot grow beside `rowCounts`:

- `k equality: approval id in syncErrors stays 100000`. The approval id is a key of the `syncErrors` argument. `rowLive` marks that id dead (line 668). The return is 100,000 with a real start. Counting the approval turns this red.
- `k equality: a live reversal of the approval stays 100000`. A live `rev_` of the approval is in the list. The return is 100,000 with a real start. Leaving the 700,000 in place turns this red.
- `k equality: one approval id counted once is 700000`. Two objects share one approval id and the amount 600,000. `rowIndex` keeps the first (line 591). The return is 700,000. Counting that id twice turns this red.
- `k equality: txnDate before the start stays 100000`. The approval's `txnDate` is strictly before `'2026-12-01'` and `start` is `'2026-12-01'`. The return is 100,000. Returning 700,000 turns this red.
- `k equality: a non-date start stays 100000`. `start` is `null` in the first test. This one passes `'soon'`. The return is 100,000. Returning 700,000 turns this red.
- `k equality: an approval on another project stays 100000`. The approval's `projectId` is `'q'`. The return is 100,000 with a real start.

The statement half of line 480 is the relationship, not a second sum inside `projectCost`. J's display numbers stay J's: old paid 200,000, unlinked 40,000, and new approved 600,000 show `تكلفة المقاول` 840,000 (line 479). K's test does not assert 840,000. It asserts the four `projectCost` returns on line 480. The sentence that connects them is the one on that line: statement cost equals `projectCost` minus the non-contractor legacy. While `start` is null, K's 100,000 does not contain the 600,000, and the statement is still allowed to show `newApproved`.

Existing stub callers, rewritten and still 0 when there is no legacy spent:

- Line 174 keeps `Accounts.CONTRACTOR_COST_START === null`. The call passes `legacySpent` 0, the same approval, and `null`. The return is 0.
- Line 199 is the `projectCost` call in the test that also asserts the person balance at 0 (line 198) after `payLabor` 600,000. `projectCost` is called with `legacySpent` 0 and a null start. The return is 0.
- The test that contains line 249 keeps the person balances 600,000 (line 242) and 550,000 (line 248). `projectCost` at line 249 is called with `legacySpent` 0 and a null start. The return is 0. The equality test above is what locks the 50,000 deduct out of project cost. This line does not.

`tests/browser-check.js` line 224 still looks for `صافي الربح` on the owner home. The constant is null, so the home number is the legacy spent. K adds no browser path that sets the date. `tests/strict-accounts.test.js` stays green because the new signature is the one in `types/checkjs.d.ts`.

## Strings

No new Arabic string. K paints none of the G–J sentences. The strings file named by earlier sketches is not in this checkout. The approval of the 88 and of the tab «حسابات» is recorded at `docs/plans/contractor-pr-c-sketch.md` line 440. This sketch adds no string outside that list.

Reused, already on these screens:

| String                      | Where it already is                        |
| --------------------------- | ------------------------------------------ |
| `إجمالي المقبوض`            | `public/render.js` line 646                |
| `إجمالي المصروف`            | `public/render.js` line 647                |
| `صافي الربح`                | `public/render.js` line 648                |
| `المقبوض`                   | `public/render.js` line 734                |
| `المصروف`                   | `public/render.js` lines 722, 734, and 736 |
| `ربح` and `خسارة`           | `public/render.js` line 721                |
| `الربح`                     | `public/render.js` line 735                |
| `الربح = المقبوض − المصروف` | `public/render.js` line 735                |

Line 736 is the site block. K does not change it. The note on line 735 stays true: الربح is المقبوض minus the figure المصروف shows.

## Deliberately not done

- No assignment of `CONTRACTOR_COST_START`. Setting it is a later deploy after Ameer says go. No other deploy step.
- No new collection, no migration, no edit of an existing Firestore document, no `firestore.rules` change.
- No second live-row function and no second index. `rowIndex` and `rowCounts` are the ones C exported.
- No edit of `PURPOSES`. `deduct` keeps cost −1 for the person fold. Project cost does not apply it.
- No edit of `fold`, `balances`, `statementLines`, `post`, or `personBalance`.
- No cash-out walk. No `oldPaid` function. No «قيود بلا عقد» line. Those are J's display.
- No hide of «+ عقد مقاول». That is G.
- No `laborReviews` key and no «روجع» mark. That is L, and Ameer's 2026-11-20 20:05 answer makes it single-phone. The G–J sketch records that answer. K does not.
- No new Arabic string. No screen for G, H, I, J, or L.
- No reserved service-worker number.
- No inventory edit in this docs pull request.
- No production write. The new tests are fixtures. K adds no emulator test.

## Sequencing

This docs pull request edits two plan files and does not touch `public/sw.js`.

The later code pull request is sequential on the files it shares:

- `public/accounts.js` with any later edit of the stub, the fold, or the exports. K replaces lines 1031-1034 and does not move `rowCounts`.
- `public/render.js` with G and with L. The G–J sketch names G's three sites as lines 93-96, 859-879, and the call beside line 1334 (G–J line 149). On this main the «+ عقد مقاول» anchor is line 96, inside `subcontractSection` which starts at line 93. `#subnew` starts at line 859. `AccountsView.syncTab` is called at line 1334. L's install list is lines 1653-1658. K's hunks are the three owner figures. They do not include those sites.
- `public/sw.js` and the two pin files with every public pull request that bumps `VERSION`. The code PR takes the next free value at merge time. It does not claim `aj-p0-v67` and it does not claim the number after it in this sketch.
- `docs/PSTACK_INVENTORY.md` with any pull request that edits the same evidence cells, including #95 if it lands first. The code PR only. It cites rows, not the header.

K is after B, C, D, E, and F, which are on this main. G–J code comes after K so an approval can move this figure once the constant is a date. K does not build those actions.

## Accounting advisor

This docs pull request does not re-ask محاسب أهل الجزيرة. The G–J sketch records the ruling K follows. Ameer, 2026-11-20 18:16 Baghdad, adopted the architect and accountant middle way (G–J line 5). A verbatim advisor message dated 2026-11-20 is not in this repo (G–J line 739).

Quoted from `docs/plans/contractor-pr-gj-sketch.md` line 60: cost on the period block is the approved work value alone. A deduction repays a debt and does not reduce cost. `PURPOSES.deduct` still has `cost: -1` (line 76). That is B's table. K's new cost half does not apply that effect.

Quoted from line 648, point 2 of رأي المعماري والمحاسب: the period «مستخلص» shows the approved work value, then a deduction line, then the net due. Cost stays the full work value. A deduction does not reduce cost. That advice is not an Ameer decision (line 645). The equality fixture states the same numbers (line 480). K's test asserts them. K does not edit the table.

Q23's five options stay unchosen. The advisor's option in the old section 10 is not adopted.

## Inventory rows the code PR updates

This docs pull request does not edit `docs/PSTACK_INVENTORY.md`. The header counts are not cited. #95 may change that header. The code PR reads these rows again and updates their evidence cells only. It does not flip a status word.

| Row                                        | On this main      | What the code PR adds                                                                                                                                                                   |
| ------------------------------------------ | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `principle-explain-the-number`             | line 29, «مطبّقة» | An evidence link for the line 480 numbers: 100,000, 700,000, 150,000, and 750,000.                                                                                                      |
| `principle-laziness-protocol`              | line 33, «مطبّقة» | The cell already says `projectCost` returns 0 until PR K. The code PR points that sentence at the new function. Line 129 says the same in the PR B table.                               |
| `principle-redesign-from-first-principles` | line 41, «ناقصة»  | A next-step sentence only. No evidence link. The owner figure is `projectCost`, legacy spent plus live `approveLabor`, and the stub at lines 1031-1034 is replaced rather than wrapped. |
| `principle-subtract-before-you-add`        | line 44, «مطبّقة» | No new row. The code PR does not add a purpose, a collection, or a string.                                                                                                              |
| `blast-radius`                             | line 58, «مطبّقة» | An evidence link. Site `spent`, the CSV, `countedEntries`, and `fold` stay on their current functions.                                                                                  |

The app is not claimed to be pstack-compliant.

## Blast radius

Callers of `Accounts.projectCost` on this main are the three assertions at `tests/accounts.test.js` lines 174, 199, and 249. Each expects 0. `render.js` does not call it. After the code PR the callers are `ownerSpent` and that test file.

While the constant is `null`, owner home, the open owner card, and the owner project screen show the same integers they show today, because `projectCost` returns `legacySpent` and those three sites display that return. Site home, site cards, and site المصروف do not change. Ledger totals, CSV, subcontract paid and remaining, and the خلفة balance do not change. No rules and no IAM. No new collection. K writes no Firestore document.

`tests/sw-version-guard.test.js` lines 31-44 fail a `public/` edit that does not bump `VERSION`. The code PR bumps it. This docs pull request does not edit `public/`.

## Revert

The code PR reverts with `git revert`. The screens go back to `totals` and `projectSummary` for those three owner figures. K writes no document, so the revert deletes none. It does not leave a date behind, because K does not assign `CONTRACTOR_COST_START`. The service-worker version reverts with the commit. Inventory evidence reverts with the commit.

## Dependencies

- A, on this main. The nine purposes and the stub are in `public/accounts.js`.
- B, on this main (#81). `approveDeduct` stores no amount. `deduct` keeps cost −1. K uses the amount rule and does not apply the cost multiplier.
- C, on this main (#75). `rowIndex`, `rowCounts`, `balances`, and `statementLines` are exported. K calls the first two and does not edit the others.
- D, on this main. K does not edit rules.
- E, on this main (#93). `K.accountTxns` exists. K does not implement adopt. The one-id assertion is `rowIndex`'s first-wins on a list the test builds.
- F, on this main (#76). The project-delete guard is what G–J wait for. K does not edit it.
- G–J, after K. Their sketch is on this main (#94). Their code is not.

## Risks

- Leaving the stub's `return 0` in place, or wrapping it, still ignores `legacySpent`. The null-start equality test turns that red.
- A second live-row check inside `projectCost` drifts from C. The code PR calls `rowCounts`.
- Applying `effect.cost` for `deduct` turns the 700,000 assertion red. The person `net` must keep subtracting deductions.
- Calling `ownerSpent` from lines 652-655, 722, or 736 changes the site figure.
- Summing home only over the open list at line 708 drops archived projects from إجمالي المصروف while the date is still null.
- Assigning `CONTRACTOR_COST_START` in the code PR turns cost on before Ameer says go.
- Filtering legacy rows by `entryDate` would pick a Q23 option. K does not.
- Reading `slotLosers` would add a copy E already removed from the fold.

## pstack

This docs pull request is the architect sketch. It names the files, the `FoldDoc` reuse, the `projectCost` and `ownerSpent` signatures, the module that owns each, the call sites, the behaviour tests, the strings, and what is not done. Arena was not run.

`principle-subtract-before-you-add`. The stub is replaced. Nothing is added beside it: no purpose, no collection, no string, no second index, no rules match, no migration.

`principle-laziness-protocol`. One function returns the owner number. It calls `rowIndex`, `rowCounts`, and `countedAmount`, which already exist. The screen calls `countedEntries` and `totals`, which already exist. `public/ledger.js` stays unchanged.

The code PR is the `feature` playbook, after this review, and it is not this commit.

## G–J lines this docs pull request touched

`docs/plans/contractor-pr-gj-sketch.md` line 661 was the open question about more than one phone deciding L rows. Ameer answered on 2026-11-20 20:05 «حاليا فقط اني فاتح البرنامج» (right now only I have the app open). That bullet now records the answer. The «روجع» mark in local IndexedDB `laborReviews` is single-phone for now. The local mark does not follow to another phone. Logout still wipes it (`public/session.js` line 419).

Line 662 is a different open item, the fixed id for the still-owed `advanceLabor`. The 20:05 answer is not about that id. The line was left as it is.

Two optional notes from the #94 review were not applied, because the lines no longer match the note:

- Around line 494, the note was to make the covering-advance wording say "every live or queued advance". Line 494 is the two-live-advances paragraph (`سلفة مكررة`, lowest `createdAtServer`). The covering-advance sentence is line 490, and it already says the advance is live or queued and not in `syncErrors`. The note's line is not that sentence, so the wording was not changed.
- Around line 582, the note was to keep that case as a fixture test. Line 582 is already a bullet under L's tests: two live `advanceLabor` rows of 80,000, `createdAtServer` 1,000 on id `b` and 2,000 on id `a`, offered reversal `rev_a`, and `balances().net` of −80,000 after that reversal. It was left as that fixture.

## [OPEN]

These are for Ameer. This sketch does not decide them.

- Say go on this sketch before any code pull request.
- The date itself. `CONTRACTOR_COST_START` stays `null` (`public/accounts.js` line 11). Setting it is a later deploy after Ameer says go. K's merge does not set it.
- Q23 stays «بعدين». Options 1 through 5 are not chosen. Ask again before the constant is set.
- Merge of the later code pull request waits for the Architect's review of that SHA, CI 4/4, and Ameer's go. This sketch does not merge itself.

The deduct rule is not in this list. The G–J sketch already states it (lines 60, 480, and 648), and K's test copies those numbers.

## أسئلة لأمير

**بعد ما ينحط تاريخ البداية، شنسوي بقيود «عمالة/سلفة» و«مقاول» الجديدة؟**

هسه التاريخ فاضي (`public/accounts.js` سطر 11). بهالنسخة الدالة ترجع رقم الصرف القديم نفسه، وما تنضاف كلفة القياس المعتمد. يوم ينحط التاريخ، بعد ما أمير يقول امشوا، السؤال يرجع: القيد الجديد نوعه «عمالة/سلفة» أو «مقاول» وتاريخه بنفس اليوم أو بعده، شنو يصير؟

الجواب المسجّل يبقى «بعدين». EA وافق على الافتراضي بتاريخ 2026-11-16 الساعة 00:52 بتوقيت بغداد، وهذا اللي سجّله رسم r2. ما نختار خيار من الخمسة بهالمرحلة. القيد القديم يبقى داخل الرقم اللي ينمرر للدالة، والدالة ما تشوف تاريخه.

قائمة النصوص واسم التبويب «حسابات» موافَق عليها، والمصدر `docs/plans/contractor-pr-c-sketch.md` سطر 440. هالمرحلة ما تضيف جملة.
