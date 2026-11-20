# PLAN ONLY: contractor PRs G–J, the middle way

No code in this pull request. No edit to `public/`, `firestore.rules`, or `public/sw.js`. No test data. The code pull requests come after the Architect reviews this sketch and Ameer says go.

Revision r11, on main `a1ca326b7149203998c296352b9178ece68fb447`. It replaces the sketch merged as #79 at `818039a518a3b2f5ffbab74ee47a3a3b9298d3bf`. That file calls itself r10 and names r7 as head `33fbcadf`. The comparison below is against the behaviour that file still specifies. This revision adopts Ameer's decision of 2026-11-20 18:16 Baghdad: the architect and accountant middle way. Arena was not run. Ameer's gate bans it (cost), and this run was told not to run it.

Citations below were read on this main. A code pull request reads line numbers again at its own base. A fact this repo does not contain is marked [OPEN] in that section. It does not block this sketch.

## What changed vs r7

r7 put the write buttons on the «حسابات» tabs and treated a payment above approved work as one `payLabor` with a negative balance and no preview. r8 through r10 added the refused-cancellation rules. Those r8–r10 rules stay. The 2026-11-20 decision changes the six items below. r7's twelve saves, the slot id, the caps, the deduct, and the reversal ids stay.

| Item | What the decision does                                                                                                                                                                                                      | Screens, files, functions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Removed or moved                                                                                                                                                                                                                                                                                            |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Two input places, «مقاول» and «عهد». «حسابات» is the read-only statement per person. New contracts use the new model. Old contracts finish on their own screens. No opening balance. No migration.                          | G adds `views.contractor` in `public/accounts-work.js` and the nav call beside `AccountsView.syncTab` (`public/render.js` line 1334). H, I, and J paint their save buttons on that screen. «عهد» stays `ForemenUI` (`public/foremen.js` line 23, nav `syncForemenTab` at `public/render.js` lines 988-1002). «حسابات» stays `accountHtml` (`public/accounts-view.js` lines 312-327). The file's first line already names that page read-only. Old contract detail stays `views.sub` (`public/render.js` lines 823-856). | Write buttons move off the «حسابات» tabs. `actionHtml` (`public/accounts-view.js` lines 270-280) paints only `agreements`, `movements`, and `statement`. G–J push `tab: 'contractor'`, so those tabs stay empty of `act-` buttons. No opening-balance field. No copy from `subcontracts` into `agreements`. |
| 2    | Cost is recognised when a measurement is approved, as in r7. The period «مستخلص» is a display of approved measurements minus advances. No new record type. No rules change.                                                 | G's `approveLaborDoc` still calls `Accounts.post('approveLabor')`. The cost effect is already `{ cost: 1, person: 1, cash: 0 }` (`public/accounts.js` line 71). K's `projectCost` is what puts that cost on the project figure. J paints the period «مستخلص» from `balances` (`public/accounts.js` lines 865-871) inside the period `statementLines` already returns (`public/accounts.js` line 942).                                                                                                                   | No «مستخلص» collection. No new match in `firestore.rules`. The period view does not write `statementApprovals`. That collection stays the r7 issue record (`firestore.rules` lines 1134-1181), and its button moves to «مقاول».                                                                             |
| 3a   | Deduct advances from approved work.                                                                                                                                                                                         | The fold already does this: `net` at `public/accounts.js` line 865 is approved labor, minus advances, minus payments, plus cash returned, plus refunds, minus deductions. J prints that number. It does not add a second sum.                                                                                                                                                                                                                                                                                           | No new balance function.                                                                                                                                                                                                                                                                                    |
| 3b   | One statement reads old and new contracts and shows two totals. Cost is old paid plus new approved, and that is the contractor cost in the P&L. Cash out is all payments and advances, and that equals the payment entries. | J's `contractorTotals` reads `K.entries` and `K.accountTxns`. Old paid is a live `subcontractor` ledger row (`public/ledger.js` line 13, `countedEntries` at line 340). New approved is a live `approveLabor` minus a live approved deduct. K's real `projectCost` is the P&L side. The stub at `public/accounts.js` lines 1031-1034 returns 0.                                                                                                                                                                         | The statement does not store either total. The equality with the home figure waits for K.                                                                                                                                                                                                                   |
| 3c   | Hide «+ عقد مقاول» for new contracts.                                                                                                                                                                                       | G edits `subcontractSection` (`public/render.js` lines 93-96) so the anchor is not painted, and `views.subnew` (`public/render.js` lines 859-879) so a direct hash does not save a new old-model contract. `tests/browser-check.js` line 268 currently expects the anchor text.                                                                                                                                                                                                                                         | The button goes away. The old card, «المدفوع», and `views.sub` stay. Payments on an existing old contract stay on the entry form (`public/render.js` lines 1458-1463).                                                                                                                                      |
| 4    | A payment above approved-unpaid work defaults to «سلفة» and is shown before saving. A quantity tile on the person page, display only.                                                                                       | H's `paymentSplit` caps «عن عمل معتمد» at `max(0, balances().net)` (`public/accounts.js` line 865). `payable` (line 871) does not subtract advances, so it is not the cap. The form shows the split before `commitDoc`. J paints «الكمية» on the «حسابات» person page from live approved unit qty. The tile is not an input and not a stored field.                                                                                                                                                                     | r7's single `payLabor` for the excess is gone. r7's "no preview" is gone. There is still no second dialog. The split is the form.                                                                                                                                                                           |
| 5    | Old expense rows that may be advances: a list. The owner decides each row. A correction is «ملغى» plus one corrected line. No bulk edit. No automatic recalculation.                                                        | L, `public/accounts-reclass.js`. The list is live `labour` rows with no `foremanId`. «ملغى» stores `Ledger.makeReversal` (`public/ledger.js` lines 295-306). The corrected line is one `advanceLabor`.                                                                                                                                                                                                                                                                                                                  | No bulk write. No rewrite of any other row. No new Firestore field. Subcontractor rows stay on the old contract (item 1, item 3b). A row with `foremanId` stays on «عهد» (item 6).                                                                                                                          |
| 6    | Linking «عهد» is after this phase, by an entry the owner approves: «تسوية العهدة من المستحق».                                                                                                                               | Out of G–J and out of L. No file in this sketch implements it.                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Not a save in the twelve. Not a rules change.                                                                                                                                                                                                                                                               |

Deferred, because the owner chose not to add them: half day, overtime, close-by-date on a rate change, suggested settlement, one-step owner approval, engineer entering days. They are not a screen, a type, a test, or a string in G–J or L.

## PR order

This sketch's code pull requests are five: G, H, I, J, then L.

K is not one of the five. K is the real `projectCost`. On this main the function is the stub at `public/accounts.js` lines 1031-1034 and it returns 0. Item 2's recognition in the P&L, and item 3(b)'s equality with that P&L figure, depend on K. K is gated on the cutover date [OPEN]. `CONTRACTOR_COST_START` is `null` at `public/accounts.js` line 11. K does not merge until Ameer sets that date. While it is null, an approval still writes its document, and the home figure does not move.

What must run first: K. G, H, I, and J merge only after K is merged and F's project-delete guard is on main. The guard is on this main: `Ledger.personProjectDeleteBlock` (`public/ledger.js` line 1142), called from `projectDeleteBlock` (`public/render.js` lines 1111-1121) and `deleteProjectNow` (`public/render.js` line 1184). F is #76, merge `2d21ef03c8cb128ab347a35022b8505d08a417c3`. B is #81, merge `24fb839556bae41d9f721ad8f09ce61a0e0f55b5`. L merges after J.

The date gates K's merge, and the rule above then gates G–J's merge. The date does not block this sketch.

Inside the five, the order is G, H, I, J, L. A revert of one does not require reverting the others. They still rebase the shared files, because each of them edits that set.

## Two shapes

Chosen shape. «مقاول» is the only place a new contract, a measurement, an approval, a payment, a correction, or a statement issue is saved. «عهد» stays the custody screen that already exists. «حسابات» reads. It paints the balance, the quantity, the period «مستخلص», and the two totals. It appends nothing. Old contracts stay in `subcontracts` and finish there. Each piece of money has one owner: `balances` owns the person number, `projectCost` owns the project cost, `makeReversal` owns «ملغى», `post` owns the new-model document.

Shape not chosen. r7's writes stay on the «حسابات» tabs, a payment above approved work is one `payLabor`, the excess is not shown as «سلفة», and there is no old-plus-new total. That shape fights the 2026-11-20 decision. Arena was not run.

## Domain

One person balance. It is `balances().net` (`public/accounts.js` lines 865 and 893). The line is:

`net = approvedLabor - advancesPaid - payments + cashReturned + refunds - deductions`

That is work value minus total paid. Work value is approved labor minus deductions. Total paid is payments, minus refunds, plus advances, minus cash returned. `settle` has effect zeros (`public/accounts.js` line 78) and is not in `net`. J does not add a second fold. The overview test already expects 480,000 from this net, not 550,000 (`tests/accounts-view.test.js` lines 200-213).

The balance line, X always positive, no U+2212, never «(سلفة)»:

- `net > 0`: `الرصيد: مستحق له X د.ع`
- `net < 0`: `الرصيد: مستحق عليه X د.ع` with X = `-net`
- `net === 0`: `الرصيد: لا شيء (مسدّد)`

`money` (`public/render.js` line 56) calls `Ledger.fmt` (`public/ledger.js` line 484), which prefixes a negative with U+2212. The balance line passes the absolute value. The project-delete sentences stay F's. `personProjectDeleteBlock` still says `مستحق له` and `مستحق عليه` (`public/ledger.js` lines 1160-1161). Those are strings 86 and 87. G–J do not paint them.

The period «مستخلص» is a display for the open period: that period's approved labor minus that period's advances. `statementLines` already folds a period (`public/accounts.js` lines 960-968). J reads those two figures. It does not write them. A `settle` row is not required for the subtraction. `settle` stays the explicit r7 link, with effect zeros, and its button is on «مقاول».

`contractorTotals` is a display. `oldPaid` is the signed sum of live `subcontractor` ledger rows (`sign` is `public/ledger.js` line 24, `countedEntries` drops a `syncErrors` id at line 340). `newApproved` is the sum of live `approveLabor` amounts minus live approved deducts. `cost = oldPaid + newApproved`. `cashOut` is `oldPaid` plus live `payLabor` plus live `advanceLabor` minus live `returnAdvance` minus live `refundLabor`. The payment entries are those rows. The function returns both numbers. It does not call `projectCost`. K is what makes `cost` equal the contractor part of the project figure, and only after the cutover date.

`paymentSplit(amount, approvedUnpaid)` returns `{ payLabor, advanceLabor }`. `approvedUnpaid` is `max(0, balances().net)` (`public/accounts.js` line 865), so advances already paid are deducted from approved work before the new payment is classified. `payable` (line 871) is `max(payableGross, 0)`, and `payableGross` (line 866) does not subtract `advancesPaid`, so it is not this cap. `payLabor` is `min(amount, approvedUnpaid)`. `advanceLabor` is the rest. Both are integers and neither is negative. One purpose cannot carry both effects (`public/accounts.js` lines 72-73), so a positive part is its own document. The form shows both parts before the save. One tap then appends the documents the preview named. Each builder still returns one document.

The unit method's label is `حسب الإنجاز (الكمية × سعر الوحدة)`. The card today says `بسعر الوحدة` (`public/accounts-view.js` line 388). Lump, daily, and milestone keep `مبلغ مقطوع`, `باليوم`, and `مرحلة`.

The quantity tile sums `qty` on live `approveLabor` rows whose agreement `method` is `unit`, for that person. Display only.

«ملغى» is not a string in `public/` or `firestore.rules` on this main. The stored row is the reversal that already exists: id `rev_` plus the original id (`public/ledger.js` line 289), `isReversal: true` (`firestore.rules` lines 131-136). The entry screen already says `معكوس` (`public/render.js` line 580) and the existing button says `عكس` (`public/render.js` line 582). L uses the owner's word `ملغى` on its own button. It does not add a status field.

## Scope that r7 already fixed

v1 stays the smaller cut. In: a labor agreement (lump, unit, daily, amount milestone), a measurement, its approval, a payment, an advance, a cash return, a labor refund, a labor deduct and its approval, a settle, a reversal, a live statement, and `statementApprovals`. IQD only. «حسابات» keeps F's four tabs: `نظرة عامة`, `العقود`, `الحركات`, `كشف الحساب` (`public/accounts-view.js` line 319). Those tabs read. They do not save.

Out of every G–J and L file, type, test, and string: materials, invoices, USD, attachments, the role list, milestone percent, and `otherApproved` / `آخر معتمد`. Percent stays denied. `otherApproved` stays out of `PURPOSES` (`public/accounts.js` lines 69-79) and off the payment form. The project-delete guard is F's. These pull requests depend on it and do not write a second one. Strings 86 and 87 stay F's sentences.

`CONTRACTOR_COST_START` stays `null` until the [OPEN] date is set. An approval document is still written. The drives assert the document and the person page. They do not assert a new home total while the constant is null.

The twelve saves stay one document each, except the two owner-required taps that name two existing document kinds before saving: H's split, and L's «ملغى» plus one `advanceLabor`. Each builder still returns one document. `commitDoc` (`public/accounts-view.js` lines 131-135) still appends one id.

| #   | Save                     | Document           | Collection                  | PR  | Verify id            | Screen |
| --- | ------------------------ | ------------------ | --------------------------- | --- | -------------------- | ------ |
| 1   | `عقد عمل جديد`           | agreement          | `agreements/{uuid}`         | G   | `new-agreement`      | مقاول  |
| 2   | `تسجيل عمل منجز`         | `laborQty` body    | `accountTxns`               | G   | `labor-qty`          | مقاول  |
| 3   | `اعتماد قياس العمل`      | `approveLabor`     | `appr_<bodyId>`             | G   | `approve-labor`      | مقاول  |
| 4   | `عن عمل معتمد`           | `payLabor`         | uuid body                   | H   | `pay-labor`          | مقاول  |
| 5   | `سلفة عمل قادم`          | `advanceLabor`     | uuid body                   | H   | `advance-labor`      | مقاول  |
| 6   | `إرجاع سلفة لم تُصرف`    | `returnAdvance`    | uuid body                   | H   | `return-advance`     | مقاول  |
| 7   | `استرداد نقدي من العامل` | `refundLabor`      | uuid body                   | H   | `refund-labor`       | مقاول  |
| 8   | `نسخة جديدة`             | `sup_`             | `sup_<oldId>`               | I   | `supersede`          | مقاول  |
| 9   | `رفض السطر`              | `rej_`             | `rej_<bodyId>`              | I   | `reject`             | مقاول  |
| 10  | `اعتماد`                 | `approveDeduct`    | `appr_<deductId>`           | I   | `approve-deduct`     | مقاول  |
| 11  | `تسوية سلفة`             | `settle`           | `stl_<bodyId>_<gen>`        | J   | `settle`             | مقاول  |
| 12  | `إصدار كشف حساب`         | statement approval | `statementApprovals/{uuid}` | J   | `statement-approval` | مقاول  |

`خصم` writes the deduct body that save 10 approves. It is a thirteenth document, inside I. Verify id `deduct`.

Three more writes stay outside the twelve. H's `تدقيق` writes `revw_`. I's `عكس` writes `rev_<id>` in `accountTxns`. G's `cancel-agreement` writes `agreementReversalDoc` (`rev_<agreementId>` in `agreements`). Verify ids: `review-cash`, `reverse`, `cancel-agreement`. The label reuses `عكس` and `معكوس`.

The twelve, plus `deduct`, `review-cash`, `reverse`, and `cancel-agreement`, are the sixteen G–J action ids. L adds `reclass`. It is not one of the sixteen. `statement-share` stays reserved for S. G–J and L do not implement it.

`buttonId` is `act-` plus the id. `syncTab` (`public/accounts-view.js` line 506) stays F's nav helper for «حسابات». G–J do not call it. G calls its own `syncTab` for «مقاول».

Script order on this main: `accounts.js` then `accounts-view.js` then `render.js` (`public/index.html` lines 71-73). G inserts `accounts-work.js` after `accounts-view.js`. H, I, J, and L insert their scripts in that order, before `render.js`. `render.js` already installs `AccountWork`, `AccountPayment`, `AccountCorrect`, `AccountStatement`, and `AccountShare` (`public/render.js` lines 1653-1658). A missing global is skipped. L adds `AccountReclass` to that list.

`commitDoc`, `readAccountScope`, `writeAccountScope`, `accountPeriod`, `modelFor`, `accountHtml`, and `statementFor` stay F's exports. J reads the scope helpers. It does not keep a second toggle and it does not compute a week or a month. A null `accountPeriod` means the statement dates are not shown and `statement-approval` does not save. The «مستخلص» block is hidden with them.

`queueDoc` (`public/render.js` lines 113-119) appends the id and skips the flush in the demo. These screens call that function. They do not add a second demo gate and they do not call `flushRemote`.

## Files each code PR edits

Each code PR adds one flow script before `render.js` and edits this shared set:

1. `public/sw.js` (`ASSETS`, `SHELL`, `VERSION`). On this main `VERSION` is `aj-p0-v67` (line 2).
2. `public/index.html` (one script tag).
3. `public/session.js` (`SHELL_FILES` only, line 351). Not `today()` (line 172), not `uuid()` (line 120), not `closeSession` (line 399).
4. `tests/shell-cache.test.js` (pins at lines 44, 67, and 98, and the script order at lines 71-82).
5. `tests/webkit-upgrade.test.js` (`MARK`, line 19).
6. `package.json` (`"test"` line 5 and `"typecheck"` line 10).
7. `.github/workflows/ci.yml` (the unit-test list, line 68, kept identical to `"test"`).
8. `docs/PSTACK_INVENTORY.md` (evidence link only, on the code PR; the status word stays). This docs PR does not edit it.
9. `scripts/verify-aj.js` (dispatch only).
10. `.cursor/skills/verify-ahl-aljazeera-accounting/SKILL.md`
11. `.cursor/skills/verify-ahl-aljazeera-accounting/features/README.md`
12. `types/checkjs.d.ts` (that PR's `Window` global). `RenderApi` is lines 832-844. G–J and L do not extend it.

At this main both unit lists are 39 files and they match. A code PR reads both lists at its own base and adds its behaviour test and its strict test to both. It does not copy 39 forward. `"typecheck"` gains `tsc --noEmit -p tsconfig.strict-accounts-<flow>.json`. The lint job runs that script. It is not a fifth CI job.

`VERSION` is the next free value at merge time. This sketch reserves no number.

### G

| File                                                        | Change                                                                                                                                                                       |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/accounts-work.js`                                   | New. «مقاول» screen, agreement, `cancel-agreement`, `laborQty`, `approveLabor`.                                                                                              |
| `public/render.js`                                          | Three sites only. Drop the anchor in `subcontractSection` (lines 93-96). `subnew` (lines 859-879) does not save a new contract. Call `AccountWork.syncTab` beside line 1334. |
| `public/index.html`                                         | One script tag after `accounts-view.js` and before `render.js`.                                                                                                              |
| `public/sw.js`                                              | `ASSETS`, `SHELL`, `VERSION`.                                                                                                                                                |
| `public/session.js`                                         | One key in `SHELL_FILES`.                                                                                                                                                    |
| `tests/accounts-work.test.js`                               | Behaviour tests below.                                                                                                                                                       |
| `tests/strict-accounts-work.test.js`                        | New. Same shape as `tests/strict-accounts.test.js`.                                                                                                                          |
| `tsconfig.strict-accounts-work.json`                        | New. Include `public/accounts-work.js` and `types/checkjs.d.ts`.                                                                                                             |
| `types/checkjs.d.ts`                                        | `Window.AccountWork` only.                                                                                                                                                   |
| `package.json`, `.github/workflows/ci.yml`                  | The two new test paths, both lists, and the typecheck script.                                                                                                                |
| `tests/shell-cache.test.js`, `tests/webkit-upgrade.test.js` | Pins and script order.                                                                                                                                                       |
| `tests/browser-check.js`                                    | Line 268 keeps the contractor names and stops expecting `+ عقد مقاول`.                                                                                                       |
| `docs/PSTACK_INVENTORY.md`                                  | Evidence on `feature`, `maintain-verification-skill`, `opening-a-pr`. Status word stays.                                                                                     |
| Skill files                                                 | `drive` accepts `new-agreement`, `cancel-agreement`, `labor-qty`, `approve-labor`. An unknown id still exits 3 (`scripts/verify-aj.js` line 1310, skill line 67).            |
| `scripts/verify-drives/accounts-work.js`                    | The steps. `scripts/verify-aj.js` dispatches.                                                                                                                                |

```javascript
/**
 * @param {RenderApi} api
 */
function install(api)

/**
 * Adds or removes the «مقاول» nav link. Does not call AccountsView.syncTab.
 * @param {{ role?: string } | null | undefined} user
 */
function syncTab(user)

/**
 * '000' + agreementId with every hyphen removed + one generation character.
 * replaceAll('-', '') or replace(/-/g, ''). replace('-', '') removes one hyphen.
 * 36 characters. Generation is '1' through '9'. Unit and daily bodies use uuid().
 * @param {string} agreementId
 * @param {string} gen
 * @returns {string}
 */
function slotBodyId(agreementId, gen)

/**
 * @param {{
 *   id: string,
 *   partyId: string,
 *   projectId: string,
 *   method: 'lump'|'unit'|'daily'|'milestone',
 *   description: string,
 *   lumpAmount?: number,
 *   unitRate?: number,
 *   unitQty?: number,
 *   unitName?: string,
 *   dayRate?: number,
 *   milestoneAmount?: number
 * }} input
 * @returns {{ doc: object | null, errors: string[] }}
 * milestoneMode is stored as 'amount'. The unit method's label is
 * حسب الإنجاز (الكمية × سعر الوحدة).
 */
function agreementDoc(input)

/**
 * @typedef {LaborAgreement & {
 *   method: 'lump'|'unit'|'daily'|'milestone',
 *   id: string,
 *   partyId: string,
 *   projectId: string,
 *   description: string,
 *   currency: 'IQD'
 * }} StoredAgreement
 * LaborAgreement is public/accounts.js lines 19-28.
 */

/**
 * id is 'rev_' + the agreement id, stored in agreements.
 * reversalReason is 1 to 500 characters (firestore.rules lines 639-641).
 * The label reuses سبب التصحيح (public/render.js line 801, public/ledger.js line 258).
 * @param {{ agreement: StoredAgreement, reversalReason: string, createdBy: string, deviceId: string }} input
 * @returns {{ doc: object | null, errors: string[] }}
 */
function agreementReversalDoc(input)

/**
 * @param {PostInput & AccountHeader & { agreement: LaborAgreement, gen?: string }} input
 * @returns {{ doc: object | null, errors: string[] }}
 */
function laborQtyDoc(input)

/**
 * Calls Accounts.post('approveLabor', input). Stores the earned amount.
 * @param {PostInput & AccountHeader} input
 * @returns {{ doc: object | null, errors: string[] }}
 */
function approveLaborDoc(input)
```

`AccountHeader` stays r7's header: `kind`, `projectId`, `partyId`, `createdBy`, `createdByName?`, `deviceId`, `txnDate`, `currency: 'IQD'`, `fxRate: 1`. The form has no `عملة` field. `agreementReversalDoc` has no `fxRate` and no `txnDate`.

r7's cancel rules stay. A live `rev_` of the agreement returns `cancelled` from `laborQtyDoc` and `approveLaborDoc`. A refused `rev_` whose id is in `syncErrors` does not. `cancel-agreement` stays off on that phone while the refused id is in `syncErrors`. Measurement and approval stay on. Logout and the rejected CSV for an `agreements` id come from E. On this main `rejectedLogoutBlock` (`public/render.js` lines 603-608) lists ledger rows refused with `رُفض الإرسال لأن المشروع محذوف` (`public/sync-status.js` line 15) plus `refusalDocs`. G does not widen it.

`projectActive` (`firestore.rules` lines 374-376) is `status == 'active'`. (a) The phone already knows the project is not active: the button is off, nothing is queued. (b) The phone still shows it active and the server has closed or deleted it: the cancel is queued, the server refuses it, the agreement row is unchanged.

Strings, new, on G: `مقاول`, `عقد عمل جديد`, `تسجيل عمل منجز`, `اعتماد قياس العمل`, `طريقة الدفع`, `مبلغ مقطوع`, `حسب الإنجاز (الكمية × سعر الوحدة)`, `باليوم`, `مرحلة`, `سعر الوحدة`, `لكل كم`, `اسم الوحدة`, `أجرة اليوم`, `قيمة المرحلة`, `مبلغ`, `بعد الحفظ لا يتغير الاتفاق إلا بقيد عكس.`, `الكمية`, `الوحدة`, `كمية منجزة`, `أيام معتمدة`, `اعتماد المرحلة`, `منجز`, `بانتظار الاعتماد`, `معتمد`, `مرفوض`, `الاتفاق غير موجود`, `طريقة الدفع لا تطابق القياس`, `المبلغ ليس عدداً صحيحاً`, `لا اعتماد بلا قياس`, `القياس معتمد مسبقاً`, `بعد الحفظ تصبح الحالة:`, `المحاولة <n> من 9`.

Reused on G: `حفظ`, `رجوع`, `هذه الشاشة للمالك.`, `الوصف`, `عكس`, `معكوس`, `سبب التصحيح`. `الكمية` on G is the measurement field. The person-page tile of the same word is J's display.

Tests in `tests/accounts-work.test.js` assert behaviour:

- Unit rate 300,000 per 4,000, approved qty 8,000. The approval amount is 600,000. The body id is a uuid. The returned document's effect is cost +1 and person +1.
- A lump of 600,000 approves 600,000. `slotBodyId('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '1')` is `000aaaaaaaabbbbccccddddeeeeeeeeeeee1`. A second body at generation 1 is the same id.
- Daily rate 50,000 and 3 days earns 150,000.
- Amount milestone 250,000 earns 250,000. The stored `milestoneMode` is `amount`. The document has no percent field.
- Generation 9 is the last slot. The screen text is `المحاولة 9 من 9`.
- A uuid body on a lump agreement is `method`. `unitQty` 1000001, a product above 1e16, a negative qty, and a fractional qty are `range` or `overflow`.
- `approveLabor` with earned 0 is `earned`. Two method groups are `method`. `milestoneMode: 'percent'` is `percent`. An empty description leaves the save off.
- `post('approveLabor')` with no agreement object is `agreement` (`public/accounts.js` line 370).
- Two taps of the agreement save append one `agreements` row and one outbox id. The button is disabled until `save` returns.
- Two taps of `approve-labor` append one `appr_` and one outbox id.
- `agreementReversalDoc` copies the original's values. An original that is itself `rev_` is `kind`. An empty reason is refused. After a live `rev_`, measurement and approval return `cancelled`. A refused `rev_` in `syncErrors` does not.
- The project page HTML for a project that already has a contract contains the contractor's name and `المدفوع`, and does not contain `+ عقد مقاول`. Opening the old contract still shows `المتفق عليه` and `الدفعات` (`public/render.js` lines 848-855).
- A body whose id is in `syncErrors` is not offered to `approve-labor`.
- The «حسابات» HTML for that person contains no `act-new-agreement` button.
- The builder's keys, minus `docType`, are a subset of D's allowlist. `createdAtDevice` is absent.

`approve-labor` drive: sign in, open «مقاول», save the brick agreement, save the measurement, approve it. Firestore has one `agreements` row, one `laborQty`, and one `appr_`. The person page shows `عمل معتمد` 600,000. Home `المصروف` is unchanged. The agreement form says `حسب الإنجاز (الكمية × سعر الوحدة)`. The quantity tile and the «حسابات» card label are J's.

### H

Same shell, inventory, skill, and list files as G, with `public/accounts-payment.js`, `tests/accounts-payment.test.js`, `tests/strict-accounts-payment.test.js`, `tsconfig.strict-accounts-payment.json`, `scripts/verify-drives/accounts-payment.js`, and feature files `pay-labor.md`, `advance-labor.md`, `return-advance.md`, `refund-labor.md`, `review-cash.md`. H does not edit `public/render.js`.

```javascript
/**
 * @param {number} amount
 * @param {number} approvedUnpaid
 * @returns {{ payLabor: number, advanceLabor: number }}
 * approvedUnpaid is max(0, balances().net). payLabor is min(amount, approvedUnpaid).
 * advanceLabor is amount - payLabor. payable (public/accounts.js line 871) is not this cap.
 */
function paymentSplit(amount, approvedUnpaid)

/**
 * @param {'payLabor'|'advanceLabor'|'returnAdvance'|'refundLabor'} purpose
 * @param {PostInput & AccountHeader} input
 * @returns {{ doc: object | null, errors: string[] }}
 * One call writes one document.
 */
function cashDoc(purpose, input)

/**
 * id is 'revw_' + the cash id, or that plus a generation after a reversal of the mark.
 * No amount. Effect zeros. Does not call post.
 * @param {AccountHeader & { targetId: string, generation?: string }} input
 * @returns {{ doc: object | null, errors: string[] }}
 */
function reviewDoc(input)
```

The payment form shows `قبل هذه الدفعة` and the split before save. When the typed amount is above `approvedUnpaid`, the preview contains `عن عمل معتمد` for that part and `سلفة` for the rest, and the document list is still unchanged. The save then appends a `payLabor` for a positive work part and an `advanceLabor` for a positive rest. Each id is minted when the form opens. A second tap does not call `save`. When the typed amount is within `approvedUnpaid`, the preview has no `سلفة` and the save appends one `payLabor`.

This replaces r7's rule that a `payLabor` larger than earned work is a successful `payLabor` and that the screen writes no `advanceLabor`. The balance line still has no `(سلفة)` and no `المتبقي سلفة`. There is no second dialog.

`returnAdvance` names an `advanceLabor`. `refundLabor` names a `payLabor`. Every target picker uses `Accounts.rowIndex` and `Accounts.rowCounts`. A row in `syncErrors` is not offered (`walkLive` treats that id as dead at `public/accounts.js` line 668).

Strings, new, on H: `تسجيل دفعة`, `الغرض`, `عن عمل معتمد`, `سلفة عمل قادم`, `سلفة`, `إرجاع سلفة لم تُصرف`, `استرداد نقدي من العامل`, `المُرجَع أكبر من الدفعة`, `سلفة، ليست مصروفاً.`, `السلفة ليست مصروفاً`, `قبل هذه الدفعة`, `تظهر الدفعة في الكشف`, `حتى يدقّقها المالك.`, `تدقيق`, `غير مدقّق`.

The balance sentences are J's. H's preview uses `سلفة` and `عن عمل معتمد`. It does not paint `الرصيد:`.

Tests:

- Two `payLabor` documents, 400,000 then 200,000, after a 600,000 approval, while each amount is within the remaining approved-unpaid work. Two ids. Person effect of each is −1.
- Typed 700,000 after approved-unpaid 600,000. Before save, the HTML contains `عن عمل معتمد`, `سلفة`, 600,000, and 100,000, and the txn list has no new id. After the tap, one `payLabor` of 600,000 and one `advanceLabor` of 100,000. The balance sentence for that net is J's.
- Approval 600,000 and an existing advance of 100,000 leave approved-unpaid at 500,000. Typed 600,000 previews `عن عمل معتمد` 500,000 and `سلفة` 100,000.
- Typed amount equal to approved-unpaid work. One `payLabor`. The preview has no `سلفة`.
- Approved-unpaid work is 0. The whole amount is `سلفة` in the preview, then one `advanceLabor`.
- `returnAdvance` 30,000 against an advance of 100,000 has person +1 and cash −1. 100,001 is `cap`.
- `refundLabor` 50,000 against `payLabor` 600,000. 600,001 is `cap`. A second refund that crosses the payment is `cumulative`.
- `reviewDoc` has no amount and effect zeros. A second live `revw_` of the same cash id is refused. After `rev_` of the mark, the next id carries the generation.
- A `payLabor` whose id is in `syncErrors` is not offered to `refund-labor`.

`pay-labor` drive: the preview is on screen before the Firestore write. After save, the two documents match the preview.

### I

Same pattern: `public/accounts-correct.js`, `tests/accounts-correct.test.js`, `tests/strict-accounts-correct.test.js`, `tsconfig.strict-accounts-correct.json`, `scripts/verify-drives/accounts-correct.js`, and feature files `supersede.md`, `reject.md`, `approve-deduct.md`, `deduct.md`, `reverse.md`. I does not edit `public/render.js`. Buttons are on «مقاول».

```javascript
/**
 * @param {PostInput & AccountHeader} input
 * @returns {{ doc: object | null, errors: string[] }}
 * Calls Accounts.post('deduct', input).
 */
function deductDoc(input)

/**
 * id is 'appr_' + the deduct id. The queued document has no amount.
 * @param {PostInput & AccountHeader} input
 * @returns {{ doc: object | null, errors: string[] }}
 */
function approveDeductDoc(input)

/**
 * id is 'rej_' + the body id. Cash cannot be rejected.
 * @param {AccountHeader & { targetId: string }} input
 * @returns {{ doc: object | null, errors: string[] }}
 */
function rejectDoc(input)

/**
 * id is 'sup_' + the old id. A slot, a cash row, a row that already has appr_, and depth 5 are 'method'.
 * @param {AccountHeader & { supersedesId: string }} input
 * @returns {{ doc: object | null, errors: string[] }}
 */
function supersedeDoc(input)

/**
 * id is 'rev_' + reversesId, kind 'rev', collection accountTxns.
 * A rev_ of a rev_ is 'kind'. reversalReason is 1 to 500 characters.
 * @param {AccountHeader & { reversesId: string, reversalReason: string }} input
 * @returns {{ doc: object | null, errors: string[] }}
 */
function reversalDoc(input)
```

Agreement reversal stays in G, stored in `agreements`. I's `reversalDoc` is only an `accountTxns` reversal.

`نسخة جديدة` is hidden on a slot. The slot's next try is the next generation, and the screen shows `المحاولة <n> من 9`. Generation n+1 is offered only when slot n is reversed or rejected under `rowCounts`. A generation that is only in `syncErrors` is not treated as reversed or rejected. Generation 9 reversed or rejected ends the slot.

Strings, new, on I: `نسخة جديدة`, `رفض السطر`, `اعتماد`, `خصم`, `الخصم أكبر من العمل المعتمد`. `عكس`, `سبب التصحيح`, and `معكوس` are reused.

Tests:

- `deduct` 50,000 against the 600,000 approval. `approveDeduct` stores no amount. Its id is `appr_` plus the deduct id.
- A deduct of 600,001 is `cap`. A second live deduct that crosses the approval is `cumulative`.
- A body whose id is in `syncErrors` is not offered to `reject` or `deduct`.
- `rejectDoc` id is `rej_` plus the body id. A cash id is `method`.
- `supersedeDoc` of a uuid measurement copies `purpose`, `ledger`, `partyId`, `projectId`, `agreementId`, `currency`, and `fxRate`. Depth 5 is `method`. A slot id is `method`. A `payLabor` id is `method`.
- `reversalDoc` of a `payLabor` copies `amount`. `reversalDoc` of an `approveDeduct` omits `amount`. A `rev_` of a `rev_` is `kind`. An empty reason is refused.
- Two taps of a deduct save append one document and one outbox id.
- The «حسابات» page contains no `act-deduct` button.

The 600,000 / 50,000 / 100,000 / 30,000 fixture's closing number is C's. I's test checks the two documents, not the closing number.

### J

Same pattern: `public/accounts-statement.js`, `tests/accounts-statement.test.js`, `tests/strict-accounts-statement.test.js`, `tsconfig.strict-accounts-statement.json`, `scripts/verify-drives/accounts-statement.js`, and feature files `settle.md`, `statement-approval.md`. J also edits `public/accounts-view.js` for the four displays, and only these: the balance line in `overviewHtml` (lines 366-380), the unit method label (line 388), the quantity tile, the period «مستخلص» block, and the two totals. J does not edit `commitDoc`, `syncTab`, or `actionHtml`'s tab filter.

```javascript
/**
 * @param {PostInput & AccountHeader & { measurementId: string, gen: string }} input
 * @returns {{ doc: object | null, errors: string[] }}
 * id is 'stl_' + measurementId + '_' + gen. gen is '1' through '9'.
 * Calls Accounts.post('settle', input).
 */
function settleDoc(input)

/**
 * @param {readonly object[]} docs
 * @param {Readonly<Record<string, unknown>>} syncErrors
 * @param {{ periodStart: string, periodEnd: string }} period
 * @returns {boolean}
 */
function hasUnreviewedCash(docs, syncErrors, period)

/**
 * No reviewGen, no includedIds, no figures.
 * @param {{
 *   id: string,
 *   partyId: string,
 *   projectId?: string,
 *   periodKind: 'week'|'month',
 *   periodStart: string,
 *   periodEnd: string,
 *   createdBy: string
 * }} input
 * @returns {{ doc: object | null, errors: string[] }}
 */
function statementApprovalDoc(input)

/**
 * Period approved labor minus period advances. Display only. Writes nothing.
 * @param {ReturnType<AccountsApi['statementLines']>} statement
 * @returns {number}
 */
function mustakhlas(statement)

/**
 * @param {readonly object[]} entries
 * @param {readonly object[]} txns
 * @param {Readonly<Record<string, unknown>>} syncErrors
 * @param {{ partyId?: string, projectId?: string }} filter
 * @returns {{ cost: number, cashOut: number, oldPaid: number, newApproved: number }}
 */
function contractorTotals(entries, txns, syncErrors, filter)

/**
 * Sum of qty on live unit approveLabor rows for this person. Display only.
 * @param {readonly object[]} txns
 * @param {readonly object[]} agreements
 * @param {string} partyId
 * @param {object} index
 * @returns {number}
 */
function approvedUnitQty(txns, agreements, partyId, index)

/**
 * The one balance sentence. X is a positive integer with thousands separators, or the zero sentence.
 * @param {number} net
 * @returns {string}
 */
function balanceSentence(net)
```

`mustakhlas` reads the period's `approvedLabor` and `advancesPaid` off the statement fold. It does not walk the rows again. Opening the period view appends nothing and does not add a `statementApprovals` row.

`balanceSentence` is the only painter of the three approved sentences. `tests/accounts-view.test.js` currently expects the old words: line 144 (`مستحق له` 400,000), line 213 (480,000), line 228 (`مستحق عليه` 100,000), line 244 (a net of 0 shows `مستحق له` 0), and line 259 (overpayment). J updates those assertions to the three sentences. A net of 0 is `الرصيد: لا شيء (مسدّد)`, not `مستحق له` 0.

Strings, new, on J: `تسوية سلفة`, `إصدار كشف حساب`, `السلفة`, `حفظ التسوية`, `أسبوعي`, `شهري`, `من`, `إلى`, `رصيد أول المدة`, `الخصومات ومرتجعات المواد`, `رصيد آخر المدة`, `الكشف يُعتمد قبل أن يُقفل. الأرقام تُحسب من القيود.`, `السلف المصروفة له`, `المُرجَع من السلف نقداً`, `صافي السلف`, `سلف قائمة عليه`, `الصافي`, `المُرجَع من الدفعة نقداً`, `لا يُعتمد الكشف وفيه مبلغ غير مدقّق`, `مستخلص`, `تكلفة المقاول`, `النقد الخارج`, `الرصيد: مستحق له`, `الرصيد: مستحق عليه`, `الرصيد: لا شيء (مسدّد)`, `الكمية`.

`حسب الإنجاز (الكمية × سعر الوحدة)` is the same string G uses. J paints it on the agreement card.

Tests:

- J calls `AccountsView.accountPeriod()`. It does not define `statementPeriod` and it does not call `Accounts.periodBounds` itself. A null return does not save `statement-approval`, and the «مستخلص» block is not shown.
- `settle` of 40,000 against an advance has effect zeros. A settle above the named advance is `cap`. `returnAdvance` plus `settle` over the advance is `cumulative`.
- `statementApprovalDoc` has no `includedIds`, no figures, no `createdAtDevice`, and no `deviceId`. With `hasUnreviewedCash` true, the save returns `errors: ['review']` and no document. The screen sentence is `لا يُعتمد الكشف وفيه مبلغ غير مدقّق`.
- Opening the week view with approved 600,000 and advances 100,000 shows `مستخلص` 500,000. The `statementApprovals` list length is unchanged.
- `balanceSentence(480000)` is `الرصيد: مستحق له 480,000 د.ع`. `balanceSentence(-100000)` is `الرصيد: مستحق عليه 100,000 د.ع` and contains no `(سلفة)` and no U+2212. `balanceSentence(0)` is `الرصيد: لا شيء (مسدّد)`. The H fixture, approval 600,000 plus `payLabor` 600,000 plus `advanceLabor` 100,000, paints `الرصيد: مستحق عليه 100,000 د.ع`.
- Approved unit qty 8,000 paints `الكمية` and `8,000` on the person page. The party row gains no `qty` field.
- Old paid 200,000, new approved 600,000, new `payLabor` 400,000, new `advanceLabor` 100,000. The statement shows `تكلفة المقاول` 800,000 and `النقد الخارج` 700,000. `projectCost` is not called. The test does not assert the home total.
- The «مستخلص» and the two totals are inside «حسابات». The `إصدار كشف حساب` button is on «مقاول» and is absent from «حسابات».
- Two taps of `إصدار كشف حساب` append one `statementApprovals` row and one outbox id.

### L

`public/accounts-reclass.js`, `tests/accounts-reclass.test.js`, `tests/strict-accounts-reclass.test.js`, `tsconfig.strict-accounts-reclass.json`, `scripts/verify-drives/accounts-reclass.js`, and `features/reclass.md`. L adds `AccountReclass` to the install list (`public/render.js` lines 1653-1658) and one script tag. L does not edit `firestore.rules`.

The list shows a live ledger row whose `entryType` is `labour`, whose `direction` is `expense`, which is not a reversal, which has no live reversal, which is not in `syncErrors`, and which has no `foremanId`. `labour`'s label is `عمالة/سلفة` and its direction is still `expense` (`public/ledger.js` line 12). A `subcontractor` row is not on the list. A row with `foremanId` is not on the list. The list does not say the row is an advance. The heading is `قيود مصروف قد تكون سلفاً`.

```javascript
/**
 * @param {readonly object[]} entries
 * @param {Readonly<Record<string, unknown>>} syncErrors
 * @returns {readonly object[]}
 * Display only.
 */
function misbookedCandidates(entries, syncErrors)

/**
 * One reversal plus one advanceLabor. Both ids are minted when the row's form opens.
 * The reversal is Ledger.makeReversal. The advance is cashDoc('advanceLabor', ...).
 * partyId is the person the owner picks. No party, no save.
 * The advance amount defaults to the row's amount and the owner can type another integer before save.
 * @param {{
 *   entry: object,
 *   partyId: string,
 *   advanceAmount: number,
 *   reversalReason: string,
 *   advanceId: string,
 *   user: object,
 *   deviceId: string,
 *   entryDate: string
 * }} input
 * @returns {{ reversal: object | null, advance: object | null, errors: string[] }}
 */
function reclassPair(input)
```

The form shows `ملغى` and the corrected amount before save. One tap appends those two documents and no others. Every other ledger row keeps its amount. The screen does not loop the list. There is no button that corrects more than the open row.

Strings, new, on L: `قيود مصروف قد تكون سلفاً`, `ملغى`, `سطر مصحّح`, `سلفة`. `سبب التصحيح` is reused. `ملغى` is the button. The stored reversal is still `isReversal: true`.

Tests:

- Two live `labour` rows, 80,000 and 30,000, neither with `foremanId`. The list shows both amounts. A `subcontractor` row of 200,000 is absent. A `labour` row with `foremanId` is absent.
- Correcting the 80,000 row, after the owner picks a person, appends one `rev_` ledger row for that id and one `advanceLabor` of 80,000. The 30,000 row's amount is unchanged. No third ledger row is rewritten.
- Before the tap, the HTML contains `ملغى` and the amount, and neither document is stored.
- An empty person leaves the save off and appends nothing.
- Two taps append one reversal and one advance.
- The «حسابات» page does not gain an `act-reclass` button. «عهد» HTML is unchanged.

### Files the code PRs do not edit

`public/accounts.js` (B, then C, then K). `public/ledger.js`. `public/foremen.js`. `public/sync.js`. `public/app.js`. `public/firebase-client.js`. `firestore.rules`. `public/session.js` except the one `SHELL_FILES` key.

G edits `public/render.js` at the three sites named above. L adds `AccountReclass` to the install list in that file. H, I, and J do not edit `public/render.js`. J edits the four displays in `public/accounts-view.js` and nothing else in that file.

No new test assertion reads a helper's source text.

## Rules, items 2 and 5

Item 2 needs no rules change. Cost on approval is the `approveLabor` create that `accountTxnCreate` already allows (`firestore.rules` line 1119). The period «مستخلص» writes no document, so it needs no match. There is no `مستخلص` match in `firestore.rules`. `statementApprovals` (lines 1134-1181) stays the r7 issue record. Its keys are still `id`, `partyId`, optional `projectId`, `periodKind`, `periodStart`, `periodEnd`, `createdBy`, `createdAtServer`. J does not add a figure field, so the `hasOnly` lists at lines 1160 and 1173 stay.

Item 5 needs no rules change. A ledger reversal is already `reversalOk` (`firestore.rules` lines 131-147) and the create is line 156. `allow delete` is only when the project is gone (line 157). There is no update that would let a bulk edit rewrite a row. The corrected line is an `advanceLabor` body, already `cashBodyCreate` (line 1123). `accountTxns` update and delete are false (line 1131). L adds no field, so `shapeOk` (line 82) stays the ledger allowlist.

## Error sentences

`post` returns the English codes from B. Each flow file maps a code to an Arabic sentence it already has. There is no shared mapper.

| Code                                               | Sentence                                                          | Where                                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `method` from `agreementDoc`                       | `طريقة الدفع لا تطابق القياس`                                     | G                                                                               |
| `percent`                                          | `طريقة الدفع لا تطابق القياس`                                     | G. The form does not offer `نسبة`.                                              |
| `lump`, `milestone`                                | `المبلغ ليس عدداً صحيحاً`                                         | G                                                                               |
| `earned`                                           | `لا اعتماد بلا قياس`                                              | G                                                                               |
| `agreement` from `post`                            | `الاتفاق غير موجود`                                               | G. `public/accounts.js` line 370.                                               |
| `description`                                      | no new sentence. The save stays off.                              | G                                                                               |
| `range`, `amount`, `overflow`, `inexact`           | `المبلغ ليس عدداً صحيحاً`                                         | G, H, I, J, L                                                                   |
| `paidAs`                                           | the purpose control stays on `عن عمل معتمد` or `سلفة عمل قادم`    | H                                                                               |
| `cap`, `cumulative` on a `refundLabor`             | `المُرجَع أكبر من الدفعة`                                         | H                                                                               |
| `cap`, `cumulative` on a `deduct`                  | `الخصم أكبر من العمل المعتمد`                                     | I                                                                               |
| `cap`, `cumulative` on `returnAdvance` or `settle` | `المُرجَع والتسوية أكبر من السلفة`                                | H and J. Pending Ameer. Those two do not merge this sentence before his answer. |
| `targetId`, `settlesId`                            | no new sentence. The button stays off until a live row is chosen. | H, I, J                                                                         |
| `cancelled`                                        | no new sentence. The work buttons stay hidden.                    | G, after a live `rev_<agreementId>`                                             |
| `kind`                                             | no new sentence. `عكس` stays hidden on a `rev_` row.              | I                                                                               |
| `review`                                           | `لا يُعتمد الكشف وفيه مبلغ غير مدقّق`                             | J                                                                               |
| `ledger`                                           | the form does not send both a ledger and an explicit target       | not shown                                                                       |

A lump or an amount milestone has no amount box on the measurement. `post` still refuses a partial amount.

## Deferred

The owner chose not to add these. They are not in G, H, I, J, or L:

- half day
- overtime
- close-by-date on a rate change
- suggested settlement
- one-step owner approval
- engineer entering days

## Later, not this phase

Linking «عهد» waits until after G–J and L. The entry is `تسوية العهدة من المستحق`, and the owner approves each one. No file, type, test, or string in this sketch implements it. `public/foremen.js` stays as it is, including the custody badges `مستحق له` at lines 148 and 181. Those badges are not the person balance line.

## [OPEN]

These do not block this sketch. No pull request here decides them.

- Whether Jabbar (جبار) is a contractor at 75 IQD per brick. The name is not in this repo. `unitPrice` says "300000 per 4000 is 75" (`public/accounts.js` lines 121-125). That is the arithmetic example. It does not say Jabbar is a contractor. His custody entries stay as they are.
- Retention. No retention field is in `PURPOSES` or `firestore.rules`.
- Contractor-supplied bricks. No such agreement field is on `LaborAgreement` (`public/accounts.js` lines 19-28).
- The cutover date. `CONTRACTOR_COST_START` is `null` at `public/accounts.js` line 11. K is gated on it.

## Citations rechecked at main a1ca326b

| What                        | On this main                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Service worker              | `public/sw.js` line 2 is `aj-p0-v67`. Pins: `tests/shell-cache.test.js` lines 44, 67, and 98. `tests/webkit-upgrade.test.js` line 19. |
| Script order                | `public/index.html` lines 71-73. The assertion is `tests/shell-cache.test.js` lines 71-82.                                            |
| `SHELL_FILES`               | `public/session.js` line 351. It lists `accounts.js` and `accounts-view.js`.                                                          |
| `uuid`, `today`             | `public/session.js` lines 120 and 172.                                                                                                |
| `queueDoc`                  | `public/render.js` lines 113-119.                                                                                                     |
| Install loop                | `public/render.js` lines 1644-1658.                                                                                                   |
| `AccountsView.syncTab` call | `public/render.js` line 1334. The function is `public/accounts-view.js` line 506.                                                     |
| Click walk                  | `public/render.js` line 1393 calls `AccountsView.onClick`. The walk is `public/accounts-view.js` lines 528-532.                       |
| `commitDoc`                 | `public/accounts-view.js` lines 131-135.                                                                                              |
| Balance fold                | `public/accounts.js` lines 865-871. `balances` is line 893. `statementLines` is line 942. `periodBounds` is line 987.                 |
| `projectCost`               | `public/accounts.js` lines 1031-1034 return 0.                                                                                        |
| Old contract button         | `public/render.js` lines 93-96. Detail is lines 823-856.                                                                              |
| Ledger reversal             | `public/ledger.js` lines 289 and 295-306. Rules: `firestore.rules` lines 131-147 and 156.                                             |
| `labour` is an expense      | `public/ledger.js` line 12. `subcontractor` is line 13.                                                                               |
| Delete guard                | `public/ledger.js` line 1142, reached from `public/render.js` lines 1111-1121 and 1184.                                               |
| Unit lists                  | `package.json` line 5 and `.github/workflows/ci.yml` line 68. Both are 39 files and they match.                                       |
| Unknown verify id           | `scripts/verify-aj.js` line 1310 exits 3. The skill says the same at line 67.                                                         |
| B and F                     | #81 merged at `24fb839556bae41d9f721ad8f09ce61a0e0f55b5`. #76 merged at `2d21ef03c8cb128ab347a35022b8505d08a417c3`.                   |

`withServerTime` is `public/sync.js` line 328. `flushOutbox` starts at line 862. `applyFlush` deletes a `syncErrors` key for `synced` and `kept` (`public/sync-status.js` lines 280-281). `outboxEmpty` is `public/session.js` lines 336-348. The logout alerts are lines 406 and 411. `isOwner` is `firestore.rules` line 11. `idOk` is line 19. `MAX_AMOUNT_IQD` in the ledger is `public/ledger.js` line 151. `مستخدم غير مسموح` is line 208. `المشروع غير موجود` is line 212.

## Sequencing

K first, gated on the [OPEN] date. Then G, H, I, J, L. G–J merge only after K is merged and F's guard is on main. The guard is on this main. L merges after J.

They are not parallel with B. B's `post` is what G and H call. C's `balances` is what J reads. D's rules are what the writes already match. E's `collectionFor` is what flushes `agreements`, `accountTxns`, and `statementApprovals`. F's screen is what J paints on.

`today()` is the Baghdad civil date (`public/session.js` line 172). H and L use it for `txnDate` and `entryDate`. J calls `AccountsView.accountPeriod()`. None of them call `toISOString`.

## Revert

`git revert` of one code pull request removes that script, its tests, and its verify ids. Firestore documents already written stay. A phone that queued an id keeps it until `outboxEmpty` (`public/session.js` lines 336-348 and 410-412). Reverting the screen does not delete the service-worker bump. The revert pull request takes the next free version again if `public/` changes.

Reverting G puts the «+ عقد مقاول» anchor back, because that edit lives in G. Old contracts that already exist are untouched either way.

## Dependencies

- B: `post`, the caps, `cumulative`, amount milestones, `approveDeduct` with no amount, and the `agreement` code at `public/accounts.js` line 370. B is merged (#81).
- C: `balances`, `statementLines`, `periodBounds`, `rowIndex`, and `rowCounts`. C is on this main (#75, `d5cdec4452749e16b131e773fe6cb9f97e7349d5`).
- D: the rules cited above. These screens do not change rules. A write the server refuses becomes `syncErrors`, and the pickers do not offer that row. D is on this main (#88, `d7dc8e9b437a3bb8fc20c0bebe784d2c01f3b5c6`).
- E: `collectionFor` for the three account collections. E is on this main (#93, `a1ca326`). G–J show `رُفض الإرسال` (`public/sync-status.js` line 12) and do not invent a new refusal sentence.
- F: `#accounts`, `#account/<id>`, the four tabs, `commitDoc`, and the delete guard. F is #76. No G–J code pull request merges before that guard is on main.
- K: `projectCost`. The stub returns 0. G and I do not add cost themselves. J's two totals are a display. The P&L equality is K's, after the date.
- L depends on H's `cashDoc` and on `Ledger.makeReversal`. It does not depend on a new rule.

## Risks

An agent that only opens `public/render.js` will add the new form next to the subcontract warning at line 830. That warning does not block a payment. New-model saves live in the flow files and call `post`.

An agent that edits `public/accounts.js` to build a slot id or a second balance will collide with B, C, and K. `slotBodyId` lives in `public/accounts-work.js`. `balanceSentence` reads `net`. It does not recompute it.

An agent that hides `views.sub` as well as the new-contract button will take the old contract's details away. Item 1 says those details stay.

An agent that bulk-writes the labour list will break item 5. The test with two rows is the check.

While `CONTRACTOR_COST_START` is null, a drive that expected home `المصروف` to become 600,000 would be wrong. The drive asserts the document and an unchanged home total.

`public-canon-diff.sh` fails when the set of files under `public/` changes. CI runs `tests/public-canon-diff.test.js`, which uses a temp repo. The code PRs do not point that script at their own base and head.

## pstack for this phase

The app is not claimed to be pstack-compliant. Arena was not run.

This sketch uses `architect`: the files, the types, the signatures, the tests, and the strings are above, and the two shapes are named. `principle-subtract-before-you-add` is the cut: no opening balance, no migration, no «مستخلص» document, no second balance fold, no bulk rewrite, no daily-worker extras, no «عهد» link, and the old new-contract button goes away before the new screen is the way in. `principle-sequence-verifiable-units` is K, then G, then H, then I, then J, then L, each ending in the behaviour tests above. `principle-model-the-domain` is one `net`, one `projectCost`, one reversal row, and one purpose per saved document. `principle-make-operations-idempotent` is `commitDoc` plus the disabled button, with one two-tap test in each pull request.

These screens add no listener. The verify drives stay on the emulator and refuse a production host. Cost of this sketch is zero.

Each code PR updates `feature`, `maintain-verification-skill`, and `opening-a-pr` in `docs/PSTACK_INVENTORY.md`. Evidence links only. The status word stays. This docs pull request does not edit the inventory. The inventory sentence that says #76 does not implement the 16 G–J save ids is still true, so it stays.

## Accounting advisor

This revision does not re-ask محاسب أهل الجزيرة. Ameer, 2026-11-20 18:16 Baghdad, adopted the architect and accountant middle way and stated the six items. That statement is the ruling this sketch follows. A verbatim advisor message dated 2026-11-20 is not in this repo.

The earlier opinion that a payment above approved work is one `payLabor` and a negative balance is replaced by item 4: the excess defaults to «سلفة» and is shown before saving. The ban on `(سلفة)` in the balance line stays, and the line is now the three approved sentences. Work value minus total paid is `net`.

The advisor's advance layout stays the one C already folds: advances paid minus, cash returned plus, net advances that difference (`public/accounts.js` lines 867-874). J paints that from C. It does not put a cash return under `الخصومات ومرتجعات المواد`.

## EA, closed

EA's earlier answers stay where this decision does not replace them. The 2026-11-16 15:35 path that saved an overpayment as one `payLabor` with no preview is replaced by item 4. The 15:35 ban on `(سلفة)` and on `المتبقي سلفة` in the balance line stays, and the zero case is now `الرصيد: لا شيء (مسدّد)` rather than `مستحق له` 0.

- Q24. The cash saves stay separate documents. H's preview can name two of them, and each builder still returns one.
- Q25. `خصم` ships inside I.
- Q19. `المُرجَع والتسوية أكبر من السلفة` stays pending Ameer. H and J do not merge it before his answer.
- Q26. `آخر معتمد` stays out of `PURPOSES` and off the payment form.
- Q27. The guard is F's. Strings 86 and 87 stay F's. No G–J code pull request merges before that guard is on main.
- Q28. `rev_<agreementId>` is a row in `agreements`. The screen reuses `سبب التصحيح`. The old agreement row is not edited.
- Q29. An inexact unit split shows `المبلغ ليس عدداً صحيحاً`.
- Q5. The service-worker number is the next free one at merge time. This sketch reserves none.

The refused-cancellation choice stays (i): no re-cancel in v1. Measurement and approval stay available. The cancel button stays off for that agreement on the phone that holds the refused id. Nothing is deleted, no new text, no rules change. Another owner phone can still cancel, because `syncErrors` is stored on that phone only.

## Decisions this sketch does not make

The four [OPEN] items. Percent milestones. The pending sentence `المُرجَع والتسوية أكبر من السلفة`. The «عهد» settlement. The six deferred daily-worker extras. Whether a `subcontractor` row belongs on L's list: this sketch leaves it on the old contract. Merge of each code pull request waits for Ameer's go, after the Architect's review of that SHA and CI 4/4, and only while K is merged and F's guard is on that main. No migration, no edit, and no delete of existing Firestore documents. This sketch does not merge itself.

## Review checklist

- «حسابات» appends nothing. «مقاول» is where the sixteen saves and L's correction are painted. «عهد» is unchanged.
- The balance line is one of the three approved sentences. X is positive. The line has no `(سلفة)` and no U+2212.
- The period «مستخلص» is approved measurements minus advances, and opening it writes nothing.
- The two totals are a display. Their equality with the P&L waits for K, and K waits for the cutover date.
- «+ عقد مقاول» is not painted. An existing old contract still shows its details.
- A payment above approved-unpaid work shows «سلفة» before save, then stores the split as the two existing purposes.
- L lists, the owner decides one row, and the other rows keep their amounts.
- `firestore.rules` is not in the diff of any of these five.
