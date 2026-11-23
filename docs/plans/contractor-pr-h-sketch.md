# PLAN ONLY: contractor PR H sketch

No code in this pull request. No edit under `public/`, `tests/`, `firestore.rules`, `firestore.indexes.json`, `scripts/`, `.cursor/`, `.github/`, or `docs/PSTACK_INVENTORY.md`. `docs/plans/contractor-pr-gj-sketch.md` stays as it is. `docs/plans/contractor-pr-g-sketch.md` stays as it is. The H code pull request waits until the AgentLab Architect reviews that later code SHA, CI is 4/4, and Ameer says go. This sketch does not merge itself and does not deploy.

Base is main `8bb20ebc4d69088c2a1f37f2be32384dd1f613b1` (#98, G code, already merged). K is #96 (`16de84c`). Citations below were read on `8bb20ebc`. A code pull request reads the lines again at its own base. Arena was not run. Ameer's gate bans it (cost).

H is payments on the «مقاول» screen G already ships: `payLabor`, `advanceLabor`, return of an advance, `refundLabor`, and review-cash. «حسابات» still appends nothing. «عهد» is unchanged. I, J, and L are later pull requests. This sketch does not specify their files, types, or tests.

## What the parent H section still says that this main does not

The parent is `docs/plans/contractor-pr-gj-sketch.md` (#94, `840b48d`). Its H section is lines 276-330. That section was written while K was a stub, G's screen did not exist, and `VERSION` was `aj-p0-v67`. On this main:

- `const VERSION` is `aj-p0-v69` at `public/sw.js` line 2. The parent shared-file list (line 127) and the parent citation table (line 668) still say `aj-p0-v67`. The pins are `tests/shell-cache.test.js` lines 44, 67, and 101, and `tests/webkit-upgrade.test.js` line 19. The parent still says the third pin is line 98. This sketch reserves no number. The later H code pull request takes the next free value at merge time.
- Both unit lists are 41 files and they match. `package.json` line 5 and `.github/workflows/ci.yml` line 68. The parent line 140 still says 39. The H code pull request reads both lists at its own base and adds its two tests. It does not copy 41 forward.
- `CONTRACTOR_COST_START` is `null` at `public/accounts.js` line 11. The deploy sentence is line 9. The type is line 10. H does not assign it. The agreed rule would give 2026-12-01, because K went live on 2026-11-22. Setting the constant is a later deploy after Ameer's go. This sketch does not write that date into code and does not treat the go as given.
- `projectCost` is the real function at `public/accounts.js` lines 1043-1053. The parent citation table (line 678) still says the stub at lines 1031-1034 returns 0. While `start` is not `YYYY-MM-DD`, line 1044 returns `legacySpent`. A live `approveLabor` is added only when its `txnDate` is `YYYY-MM-DD` and on or after `start` (line 1049). A `payLabor` or an `advanceLabor` is not in that sum. Their `cost` effect is 0 (`public/accounts.js` lines 72-73).
- `public/accounts-work.js` exists. G owns `views.contractor` (`install` at lines 788-800). The parent H section says H does not edit `public/render.js`. That part is still true. The install list is `public/render.js` lines 1696-1700, and `AccountPayment` is already named. A missing global is skipped at line 1700. The parent still cites the install list as lines 1653-1658.
- `AccountsView.syncTab` is called at `public/render.js` line 1376. `AccountWork.syncTab` is line 1377. The parent still cites line 1334. `#subnew` is lines 892-922. The anchor `+ عقد مقاول` is line 104. `views.sub` is lines 856-890. `المتفق عليه` is line 881. `الدفعات` is line 888. The parent still cites `#subnew` as lines 859-879.
- `queueDoc` is `public/render.js` lines 122-129. `today()` is `public/session.js` lines 172-174. `uuid()` is line 120. `closeSession` is line 399. `SHELL_FILES` is still line 351, and it already lists `accounts-work.js`. It does not list `accounts-payment.js`. The parent's `today()` line 172 still points at the function.
- `walkLive` still marks a `syncErrors` id dead at `public/accounts.js` line 668. `rowIndex` is line 586. `rowCounts` is line 746. `balances` is line 893. `net` is line 865. `payable` is line 871.
- F's project-delete guard is on this main. `Ledger.personProjectDeleteBlock` is `public/ledger.js` line 1142. `projectDeleteBlock` is `public/render.js` lines 1153-1164. `deleteProjectNow` calls it at line 1230. The parent still cites `public/render.js` lines 1111-1121 and 1184. B is #81 (`24fb839`). C is #75 (`d5cdec4`). D is #88 (`d7dc8e9`). E is #93 (`a1ca326`). F is #76 (`2d21ef0`). K is #96 (`16de84c`). G is #98 (`8bb20eb`).

## Screens

«مقاول» is the only place H saves. The nav link and `views.contractor` are G's. H does not add a link and does not call `syncTab`.

G's `install` runs first. The loop at `public/render.js` lines 1696-1700 then calls `AccountPayment.install` when that global exists. H's `install` wraps the function G stored on `api.views.contractor` and appends H's blocks under that HTML. H does not replace the title `مقاول`. H does not edit `public/render.js`. H does not edit `public/accounts-work.js`.

The click walk stays `AccountsView.onClick` at `public/render.js` line 1436, which walks the registry at `public/accounts-view.js` lines 528-532. G pushes its actions at `public/accounts-work.js` lines 741-782 and returns false for any other button (line 679). H pushes its own actions onto that same registry. `buttonId` is `act-` plus the id. H does not add a second walk.

G's `contractorHtml` (`public/accounts-work.js` lines 843-849) is the list, the `new` form, or one agreement. A payment needs the agreement's `partyId` and `projectId`. H appends its blocks only when the argument is an agreement id that resolves. The list and `new` stay G's HTML. The cap is that person on that project. It is not the one agreement's own amount. An agreement with a live `rev_` still shows the payment blocks. Approved-unpaid reads the person and the project. Measurement and approval stay G's, and G still hides those two when the agreement is cancelled.

The save reads the exported `Accounts.CONTRACTOR_COST_START`, the same way `ownerSpent` reads it at `public/render.js` line 662. H does not keep a local copy. The blocks are appended, and a save can append, only when that export is a `YYYY-MM-DD` date and `today()` is on or after that date. While the export is null, or while `today()` is before the start, H appends nothing and a save appends nothing. G already removes the «مقاول» link in that case (`public/accounts-work.js` lines 107-109 and 818-825). The parent H section has no such gate, because the screen did not exist yet. Opening a payment before the start would reverse the gate G shipped. This sketch keeps the gate.

«حسابات» stays `accountHtml` (`public/accounts-view.js` lines 312-327). The file's first line already names that page read-only. `actionHtml` (lines 270-280) paints a button only when `action.tab` is the open «حسابات» tab. H's writes use `tab: 'contractor'`, so those tabs stay empty of `act-` buttons. H does not edit `public/accounts-view.js`. The person page already paints `غير مدقّق` (line 436) and `المُرجَع أكبر من الدفعة` (line 438). H reuses those words on «مقاول». It does not edit those lines.

«عهد» stays `ForemenUI` (`public/foremen.js` lines 17-27, title `العُهد` at line 23, nav `syncForemenTab` at `public/render.js` lines 1030-1045). H does not edit `public/foremen.js`.

Old contracts stay `views.sub` (`public/render.js` lines 856-890). A payment on an existing old contract stays on the entry form (`public/render.js` lines 1486-1511). That form already stores `entryDate: today()` at line 1511. H does not edit that form.

`commitDoc` (`public/accounts-view.js` lines 131-135) still appends one id and calls `queueDoc` (`public/render.js` lines 122-129). One tap of a split calls `commitDoc` once per positive part. Each builder still returns one document. H does not add a second demo gate and does not call `flushRemote`.

## Files the H code pull request edits

The parent H section (line 278) names the flow files. The shared set is the parent list at lines 127-138, read again on this main.

| File | Change |
| --- | --- |
| `public/accounts-payment.js` | New. Payment form, `paymentSplit`, `cashDoc`, `reviewDoc`, on the «مقاول» screen G already paints. |
| `public/index.html` | One script tag after `accounts-work.js` (line 73) and before `render.js` (line 74). |
| `public/sw.js` | `ASSETS` (line 3), `SHELL` (line 5), `VERSION` (line 2). `VERSION` is the next free value at merge time. This sketch reserves none. Line 2 is `aj-p0-v69` on this main. |
| `public/session.js` | One key in `SHELL_FILES` (line 351). One name on `K` (line 5): `refusedLinks: 'refusedLinks'`. `set` stores that value in the IndexedDB `meta` store (lines 69-83; the store name is line 73 and the put is line 78). Not `today()` (lines 172-174), not `uuid()` (line 120), not `closeSession` (line 399). Logout already deletes the user database at line 419, so the link goes with it. H does not edit that function. |
| `tests/accounts-payment.test.js` | Behaviour tests below. |
| `tests/strict-accounts-payment.test.js` | New. Same shape as `tests/strict-accounts-work.test.js`. |
| `tsconfig.strict-accounts-payment.json` | New. Same shape as `tsconfig.strict-accounts-work.json`. Include `public/accounts-payment.js` and `types/checkjs.d.ts`. `today` is already declared at `types/checkjs.d.ts` line 1273. |
| `types/checkjs.d.ts` | `Window.AccountPayment` (line 1231) is `AccountModule` today, and `AccountModule` (lines 920-922) is `install` only. H gives `AccountPayment` `install`, `paymentSplit`, `cashDoc`, and `reviewDoc`. It does not gain `syncTab`. `ActionTab` (line 861) already includes `'contractor'`. `RenderApi` (lines 832-844) is not extended. |
| `package.json`, `.github/workflows/ci.yml` | The two new test paths, both lists, and the typecheck script. Line 5 and line 68 are 41 files and they match. `"typecheck"` (line 10) gains `tsc --noEmit -p tsconfig.strict-accounts-payment.json`. |
| `tests/shell-cache.test.js`, `tests/webkit-upgrade.test.js` | Pins at lines 44, 67, and 101, `MARK` at line 19, and the script-order assert at `tests/shell-cache.test.js` line 83. The new script sits between `accounts-work.js` and `render.js`. |
| `docs/PSTACK_INVENTORY.md` | The code pull request only. Evidence on `feature`, `maintain-verification-skill`, `opening-a-pr`. Status word stays. This docs pull request does not edit the inventory. |
| Skill files | `drive` accepts `pay-labor`, `advance-labor`, `return-advance`, `refund-labor`, `review-cash`. One feature file per id, under `.cursor/skills/verify-ahl-aljazeera-accounting/features/`, named for that id. An unknown id still exits 3 (`scripts/verify-aj.js` line 1367, skill line 67, features README line 22). The work ids G already accepts stay the list at `scripts/verify-aj.js` line 1343. |
| `scripts/verify-drives/accounts-payment.js` | The `pay-labor` steps below. `scripts/verify-aj.js` dispatches. |

`public/render.js` is not in this table. The name `AccountPayment` is already on the install list.

## Types and signatures

```javascript
/**
 * @param {RenderApi} api
 * Wraps api.views.contractor after AccountWork.install.
 * Pushes pay-labor, advance-labor, return-advance, refund-labor,
 * and review-cash onto AccountActions with tab: 'contractor'.
 * Does not call syncTab. Does not call AccountsView.syncTab.
 */
function install(api)

/**
 * @param {number} amount
 * @param {number} approvedUnpaid
 * @returns {{ payLabor: number, advanceLabor: number }}
 * approvedUnpaid is max(0, balances(txns, { partyId, projectId, syncErrors }).net).
 * payLabor is min(amount, approvedUnpaid). advanceLabor is amount - payLabor.
 * Both are integers and neither is negative.
 * payable (public/accounts.js line 871) is not this cap.
 */
function paymentSplit(amount, approvedUnpaid)

/**
 * @param {'payLabor'|'advanceLabor'|'returnAdvance'|'refundLabor'} purpose
 * @param {PostInput & AccountHeader} input
 * @returns {{ doc: object | null, errors: string[] }}
 * One call returns one document.
 * payLabor and advanceLabor call Accounts.post('payment', input) with paidAs set
 * to that purpose. post has no action named payLabor (public/accounts.js lines 468-480).
 * returnAdvance and refundLabor call Accounts.post(purpose, input).
 * The stored document has no paidAs key. CASH_REMOTE does not list it.
 */
function cashDoc(purpose, input)

/**
 * id is 'revw_' + the cash id when generation is absent.
 * generation '1' through '9' stores 'revw_' + the cash id + '_' + that character.
 * That matches charGen (firestore.rules lines 394-405) and prevRevwId (lines 505-515).
 * No amount. No txnDate. Effect zeros on the local object only.
 * Does not call post.
 * @param {AccountHeader & { targetId: string, generation?: string }} input
 * @returns {{ doc: object | null, errors: string[] }}
 */
function reviewDoc(input)
```

`AccountHeader` stays the parent header: `kind`, `projectId`, `partyId`, `createdBy`, `createdByName?`, `deviceId`, `txnDate`, `currency: 'IQD'`, `fxRate: 1`. The form has no `عملة` field.

`cashDoc` always writes `txnDate` from `today()` on a successful cash document. `today()` is the Baghdad civil date (`public/session.js` lines 172-174), via `baghdadDate` (lines 143-169). H calls that function. H does not call `toISOString`. H does not edit `today()`. A missing input date, or an input date other than `today()`, does not replace that call. `optDate` still allows a missing `txnDate` (`firestore.rules` lines 499-501). `cashBodyCreate` includes `txnDate` in `hasOnly` (line 880) and calls `optDate` (line 886). Writing the field is already legal. H does not make `txnDate` required in the rules.

`reviewDoc` takes a header and then omits `txnDate`, `amount`, and `description`. `revwCreate` `hasOnly` is `firestore.rules` line 1093, and `REVW_REMOTE` is `public/sync.js` line 75. Neither list has those three keys. Line 1092 forbids `amount`. The purpose, project, party, currency, and `fxRate` match the named cash row (lines 1094-1102). The local object may carry `effect: { cost: 0, person: 0, cash: 0 }`. That key is not remote. A second live `revw_` of the same cash id returns no document. A generation is returned only when a live `rev_` of the previous mark is already in the local rows. H does not paint `عكس`. That button is a later pull request. The behaviour test builds the `rev_` fixture itself.

`returnAdvance` names an `advanceLabor`. `refundLabor` names a `payLabor`. The rules already require that (`firestore.rules` lines 913 and 945) and already refuse one document whose own amount is above the named row (lines 914 and 946). They do not sum earlier returns. H does not add that sum to the rules. `post` still returns `cumulative` when the running sum crosses the named row (`public/accounts.js` line 404).

The server still has no cap against approved work. `cashBodyCreate` reads the user, the project, and the party (`firestore.rules` lines 867-869) and checks `moneyOk` (line 881). It does not read another `accountTxns` row. Two phones can each preview the same `approvedUnpaid` and each save a `payLabor` for it. H does not add a server cap.

`parentPointers` (`public/sync.js` lines 820-828) holds a queued record back only when it has `targetId`, `reversesId`, `supersedesId`, or `settlesId`. `cashBodyCreate` forbids those keys (lines 882-885). A `payLabor` and an `advanceLabor` from one tap are not linked. A refusal is known when the flush returns. The accepted document stays. H adds `refusedLinks` on `K` and stores `{ refusedId, nextId }` through `set`. The card on «مقاول» shows the new id next to the refused id. The refused id is not sent again. One record is what the parent stores. A later refusal replaces that record. A list would be a different shape, and this sketch does not store a list.

`PURPOSES` has no `otherApproved` and no `آخر معتمد` (`public/accounts.js` lines 69-79). The payment form does not offer that purpose. Q26 stays closed.

## Payment form

The form shows `قبل هذه الدفعة` and the split before save. Amounts go through `money` (`public/render.js` line 56), which calls `Ledger.fmt` (`public/ledger.js` line 484). The preview passes the positive part, so the painted amount has no U+2212.

`approvedUnpaid` is `max(0, balances(txns, { partyId, projectId, syncErrors }).net)` (`public/accounts.js` line 865). `balanceFilter` (`public/accounts-view.js` lines 142-149) reads `readAccountScope` (line 97). That filter is not this cap. `payable` (line 871) does not subtract advances, so it is not the cap. `payLabor` is `min(amount, approvedUnpaid)`. `advanceLabor` is the rest. One purpose cannot carry both effects (`public/accounts.js` lines 72-73), so a positive part is its own document.

When the typed amount is above `approvedUnpaid`, the preview contains `عن عمل معتمد` for that part and `سلفة` for the rest, and the document list is still unchanged. The save then appends one `payLabor` for a positive work part and one `advanceLabor` for a positive rest. When the typed amount is within `approvedUnpaid`, the preview has no `سلفة` and the save appends one `payLabor`. When `approvedUnpaid` is 0, the preview is `سلفة` for the whole amount and the save appends one `advanceLabor`.

Each id is minted with `uuid()` when that form opens. A later render of the same open form keeps the ids. A second tap does not mint and does not call save. The save button is disabled until `save` returns, the same way G disables `act-new-agreement` at `public/accounts-work.js` line 711. There is no second dialog. H does not call `confirmShell` for the split. The split is the form.

The purpose control shows `عن عمل معتمد`, `سلفة عمل قادم`, or both, matching the parts that will be saved. It does not offer a third purpose. A `paidAs` outside `payLabor` and `advanceLabor` adds no new sentence. The control stays on those two labels.

`returnAdvance` and `refundLabor` are their own forms on the same agreement. Each mints its id when that form opens. The picker offers a row only when `Accounts.rowCounts` is true for `Accounts.rowIndex` of the local `accountTxns`. A row whose id is in `syncErrors` is not offered, because `walkLive` marks that id dead at `public/accounts.js` line 668 and `rowCounts` requires `rowLive` (line 747).

`تدقيق` is offered on a cash row that `rowCounts` and that `hasLiveReview` does not already mark (`public/accounts.js` lines 776-785). After a live `rev_` of that mark, `hasLiveReview` is false and the next id carries the generation.

This replaces the earlier path that saved an overpayment as one `payLabor` and wrote no `advanceLabor`. The balance line still has no `(سلفة)` and no `المتبقي سلفة`. The balance sentences are J's. H's preview does not paint `الرصيد:`.

## Strings

Strings, new, on H, from the parent H section (line 313): `تسجيل دفعة`, `الغرض`, `عن عمل معتمد`, `سلفة عمل قادم`, `سلفة`, `إرجاع سلفة لم تُصرف`, `استرداد نقدي من العامل`, `سلفة، ليست مصروفاً.`, `السلفة ليست مصروفاً`, `قبل هذه الدفعة`, `تظهر الدفعة في الكشف`, `حتى يدقّقها المالك.`, `تدقيق`.

Where they sit: `تسجيل دفعة` is the payment heading. `الغرض` labels the purpose control. `قبل هذه الدفعة` is the preview heading. A positive work part shows `عن عمل معتمد`. A positive rest shows `سلفة`, and under it both `سلفة، ليست مصروفاً.` and `السلفة ليست مصروفاً`. The parent lists both notes and marks neither pending, so both stay, and a wording swap edits the string object only. A within-cap preview has neither note. `إرجاع سلفة لم تُصرف` and `استرداد نقدي من العامل` are the headings of those two forms. An unreviewed cash row shows `تظهر الدفعة في الكشف`, `حتى يدقّقها المالك.`, and the button `تدقيق`.

`بانتظار أمير`, on H: `المُرجَع والتسوية أكبر من السلفة`. Q19. It is not painted. It is not approved to merge. See the error table.

Reused on H: `حفظ` under those headings, `مبلغ` on the amount box, `غير مدقّق` (`public/accounts-view.js` line 436), `المُرجَع أكبر من الدفعة` (line 438), `رُفض الإرسال` (`public/sync-status.js` line 12). `رجوع` and `هذه الشاشة للمالك.` stay the words G already paints. H does not paint a second copy of either.

A UI string that is not in those three lists, and not in an H row of the error table below, is `[OPEN]` for Ameer. This sketch does not invent wording. The sentences live in one object in `public/accounts-payment.js`, the same way G keeps `SENTENCE` in `public/accounts-work.js` lines 38-50.

## Error sentences

`post` returns the English codes from B. H maps a code to an Arabic sentence it already has. There is no shared mapper. Rows that name H, from the parent table (lines 615-617 and 619-620):

| Code | Sentence | Where |
| --- | --- | --- |
| `range`, `amount`, `overflow`, `inexact` | `المبلغ ليس عدداً صحيحاً` | H. The same sentence G already stores. H keeps its own copy. |
| `paidAs` | no new sentence. The purpose control stays on `عن عمل معتمد` or `سلفة عمل قادم`. | H |
| `cap`, `cumulative` on a `refundLabor` | `المُرجَع أكبر من الدفعة` | H. Already painted at `public/accounts-view.js` line 438. |
| `cap`, `cumulative` on a `returnAdvance` | `المُرجَع والتسوية أكبر من السلفة` | H. Pending Ameer. Q19. The builder returns the code. The screen does not paint this sentence. H does not merge it before his answer. |
| `targetId` | no new sentence. The button stays off until a live row is chosen. | H |

A typed amount that is empty or not an integer at least 1 does not append. When `post` returns `range`, `amount`, `overflow`, or `inexact`, the sentence is `المبلغ ليس عدداً صحيحاً`.

## Behaviour tests

`tests/accounts-payment.test.js` asserts behaviour. No assertion reads a helper's source text.

- Two `payLabor` documents, 400,000 then 200,000, after a 600,000 approval, while each amount is within the remaining approved-unpaid work. Two ids. Person effect of each is -1. Cash effect of each is +1. Cost effect of each is 0 (`public/accounts.js` line 73).
- Typed 700,000 after approved-unpaid 600,000. Before save, the HTML contains `عن عمل معتمد`, `سلفة`, `600,000`, and `100,000`, and the txn list has no new cash id. After the tap, one `payLabor` of 600,000 and one `advanceLabor` of 100,000. The preview HTML does not contain `الرصيد:`, `(سلفة)`, or `المتبقي سلفة`. The balance sentence for that net is J's. This sketch does not specify it.
- Approval 600,000 and an existing advance of 100,000 leave approved-unpaid at 500,000. Typed 600,000 previews `عن عمل معتمد` 500,000 and `سلفة` 100,000.
- Typed amount equal to approved-unpaid work. One `payLabor`. The preview has no `سلفة`.
- Approved-unpaid work is 0. The whole amount is `سلفة` in the preview, then one `advanceLabor`.
- The two cash ids are minted when the payment form opens. A second render keeps them. Two taps append one `payLabor` and one `advanceLabor`, not four. The second tap does not call save.
- A successful cash document has `txnDate`. The value matches `/^\d{4}-\d{2}-\d{2}$/` and equals `today()` from `public/session.js`. The test calls `today()` in the same tick as the save, or it stubs the clock. The expected string is not built with `toISOString`. The stored document has no `paidAs` key and no `createdAtDevice` key.
- `returnAdvance` 30,000 against an advance of 100,000 has person +1 and cash -1 (`public/accounts.js` line 74). 100,001 is `cap`. The HTML does not contain `المُرجَع والتسوية أكبر من السلفة`.
- `refundLabor` 50,000 against `payLabor` 600,000. 600,001 is `cap`. A second refund that crosses the payment is `cumulative`. The sentence is `المُرجَع أكبر من الدفعة`.
- `reviewDoc` has no amount, no `txnDate` key, and effect zeros. A second live `revw_` of the same cash id returns no document. After a `rev_` of the mark, the next id is `revw_` plus the cash id plus `_1`.
- A `payLabor` whose id is in `syncErrors` is not offered to `refund-labor`.
- While the exported `Accounts.CONTRACTOR_COST_START` is null, a payment save appends nothing. The project page HTML still contains `+ عقد مقاول`. That is the check `tests/browser-check.js` line 268 already makes. `#subnew` stays the form at lines 323-329, and line 330 stays the rtl check. H does not change those checks. The source binding at `public/accounts.js` line 11 stays `null`. The test sets the export for the open-gate cases and restores `null`. It does not edit `public/accounts.js`.
- When the export is a `YYYY-MM-DD` date and `today()` is before that date, a payment save appends nothing. The fixture is not a decision to deploy that date.
- Emulator, one half refused. Both documents name the same party, so a missing party cannot refuse only one. The `payLabor` is created while the project is active. An admin then sets the project to `closed` with rules disabled. The `advanceLabor` is denied because `projectActive` fails (`firestore.rules` line 872). The `payLabor` remains. No `rev_` is written. The advance id shows `رُفض الإرسال` (`public/sync-status.js` line 12) and is in the refused export. After the project is active again, the owner re-enters a new advance id. `K.refusedLinks` stores `{ refusedId, nextId }`. The card shows that new id next to the refused id. The refused id is not written again. The screen shows both ids on one card while the advance is refused.
- The «حسابات» HTML for that person contains no `act-pay-labor`, `act-advance-labor`, `act-return-advance`, `act-refund-labor`, or `act-review-cash` button.
- The builder's keys, minus `docType` and `effect`, are a subset of the live allowlist. `createdAtDevice` is absent. For a `payLabor` or an `advanceLabor` the list is `firestore.rules` line 880 and `CASH_REMOTE` (`public/sync.js` line 80). For a `returnAdvance` or a `refundLabor` it is `firestore.rules` lines 909 and 941 and `POINTER_CASH_REMOTE` (`public/sync.js` line 81). For a review it is `firestore.rules` line 1093 and `REVW_REMOTE` (`public/sync.js` line 75). H does not edit those lists.

`pay-labor` drive: sign in, set the exported `Accounts.CONTRACTOR_COST_START` to a `YYYY-MM-DD` fixture on or before `today()` so «مقاول» opens, save the brick agreement, the measurement, and the 600,000 approval, then open the payment form on that agreement. Type 700,000. The preview is on screen before the cash Firestore write. After save, one `payLabor` of 600,000 and one `advanceLabor` of 100,000 match the preview, and each `txnDate` is `YYYY-MM-DD`. Restore the export to `null`, then read home. The source binding stays `null`. Home `إجمالي المصروف` (`public/render.js` line 675) is unchanged, because `ownerSpent` (lines 656-663) passes `Accounts.CONTRACTOR_COST_START` and `projectCost` line 1044 returns `legacySpent` while that value is null. The drive does not leave the fixture in place, and it does not assert a new home total. The parent drive says the constant is null. The fixture is the adjustment this main requires, because G closes «مقاول» while the export is null. The home assertion runs after the restore.

The other four feature files name their ids and the «مقاول» screen, and they say an unknown id still exits 3. This sketch does not add a second drive. The behaviour tests above cover those four ids.

The same `ownerSpent` path feeds project `المصروف` at `public/render.js` line 767. While the constant is null that figure stays legacy too. H does not add a second cost function.

## CONTRACTOR_COST_START

The constant stays `null` in this sketch and in the later H code pull request. H does not write a date into `public/accounts.js`. The agreed rule is the first of the month after K deploys. K went live on 2026-11-22, so that date is 2026-12-01. Setting the constant is a separate deploy after Ameer's go. This sketch does not treat that go as already given.

While the constant is null, H saves no payment, no return, no refund, and no review. Home `المصروف` does not move. The date does not gate merging this docs pull request. The later H code merge also does not wait on the date. It still does not assign the constant. It merges only while F's project-delete guard is on that main. The guard is on this main.

## Rules

`firestore.rules` is not in the H code diff. The creates H calls are already `cashBodyCreate` (line 1123), `returnAdvanceCreate` (line 1124), `refundLaborCreate` (line 1125), and `revwCreate` (line 1116). `refusedLinks` is a local `meta` record. It is not a Firestore field. No rule on this main is missing for those writes. This docs pull request does not touch `firestore.rules` or `firestore.indexes.json`.

A rules change, including a server cap against approved work or a server sum of earlier returns, is `[OPEN]` for Ameer. This sketch does not make that change.

## What H does not edit

`public/accounts.js`. `public/accounts-work.js`. `public/accounts-view.js`. `public/render.js`. `public/ledger.js`. `public/foremen.js`. `public/sync.js`. `public/app.js`. `public/firebase-client.js`. `firestore.rules`. `firestore.indexes.json`. `public/session.js` except the one `SHELL_FILES` key and `refusedLinks` on `K`.

H does not add a name to the install list. `AccountPayment` is already there. H does not add `laborReviews` on `K`. H does not edit `closeSession` or the logout wipe at line 419.

H does not paint `الرصيد المستحق`, `مستحق له`, `مستحق عليه`, or `الرصيد:`. Those balance sentences are the later statement pull request. Strings 86 and 87 stay F's (`public/ledger.js` lines 1160-1161).

H does not paint the figure labels in `FIGURES` (`public/accounts.js` lines 535-547). H does not paint `لا يُعتمد الكشف وفيه مبلغ غير مدقّق` (`public/accounts-view.js` line 463).

No new test assertion reads a helper's source text.

`public-canon-diff.sh` fails when the set of files under `public/` changes. CI runs `tests/public-canon-diff.test.js`, which uses a temp repo. The H code pull request does not point that script at its own base and head.

## F to G-J contract

The contract lives in `docs/plans/contractor-pr-f-sketch.md`. The slice from `## F to G-J contract` up to, and not including, `## Contract hash` is still that file's lines 102-255. Its sha256 is still `5b9524fc9875744245131be80a515fb3a8873d610647717cbb4d5d248199865f`. This sketch does not recopy that slice. Line 104 of that file says G, H, I, and J do not edit `public/render.js`. H keeps that line. G's three sites are already on this main. H adds none.

`ActionTab` on this main already includes `'contractor'` (`types/checkjs.d.ts` line 861). H uses that tab. H does not widen it.

Script order on this main: `accounts.js`, `accounts-view.js`, `accounts-work.js`, `render.js` (`public/index.html` lines 71-74). H inserts `accounts-payment.js` after `accounts-work.js` and before `render.js`.

## Sequencing and dependencies

G is merged (#98). H's code pull request is the next contractor screen. It merges after the Architect reviews that code SHA, CI is 4/4, and Ameer says go, and only while F's project-delete guard is on that main. The guard is on this main. The cutover date does not gate that merge. H does not assign `CONTRACTOR_COST_START`.

I, then J, then L are later pull requests. They are not started. This sketch names that order and does not plan them.

A revert of the H code pull request removes `public/accounts-payment.js`, its tests, and its verify ids. G's screen, G's nav link, and G's three `public/render.js` sites stay. Firestore documents already written stay. A phone that queued an id keeps it until `outboxEmpty` (`public/session.js` lines 336-348). The revert pull request takes the next free service-worker value again if `public/` changes. This docs pull request does not change `public/`, so it bumps no version. Reverting H does not require reverting G.

H depends on work that is already merged:

- B: `post`, `paidAs`, `cap`, and `cumulative` (`public/accounts.js` lines 348-357 and 395-409).
- C: `balances`, `rowIndex`, and `rowCounts`. The drive reads the person page F already paints. H does not edit the fold.
- D: the rules cited above. H does not change them. A write the server refuses becomes `syncErrors`, and the picker does not offer that row.
- E: `collectionFor` (`public/sync.js` line 23) flushes `accountTxns`. H shows `رُفض الإرسال` and does not invent a new refusal sentence.
- F: `#accounts`, `#account/<id>`, the four tabs, `commitDoc`, and the delete guard.
- G: the «مقاول» screen, the registry, and the install order. H wraps that screen.
- K: `projectCost`. Merged. The constant stays null. A payment does not add cost. While the constant is null, home `المصروف` does not move.

An agent that puts the payment form on the entry screen will miss «مقاول». An agent that edits `public/accounts.js` to split a payment will collide with B, C, and K. `paymentSplit` lives in `public/accounts-payment.js`.

## Review checklist, the rows that are H's

From the parent checklist (lines 766-773):

- «حسابات» appends nothing. H's five saves are painted on «مقاول». «عهد» is unchanged.
- The preview has no `(سلفة)` and no U+2212. H does not paint the balance line.
- A payment above approved-unpaid work for that person on that project shows `سلفة` before save. If one half is refused, the accepted half stays, the refused id shows `رُفض الإرسال`, and the owner re-enters a new id shown next to it.
- `firestore.rules` is not in the H diff.

The period «مستخلص», the two totals, and the old-contract button are not H's rows. H leaves them as they are on this main.

## [OPEN] and deferred

These do not block this sketch. H decides none of them.

- Setting `CONTRACTOR_COST_START`. The binding stays `null` (`public/accounts.js` line 11). The agreed rule yields 2026-12-01. Setting the constant is a separate deploy after Ameer's go. This sketch does not write that date into code, and it does not treat the go as already given.
- `المُرجَع والتسوية أكبر من السلفة` stays `بانتظار أمير`. The screen does not paint it. H does not merge it before Ameer's answer.
- Any new UI string outside the H lists above. Any `firestore.rules` change.
- Whether Jabbar (جبار) is a contractor. The name is not in this repo. His custody entries stay as they are.
- Retention. No retention field is in `PURPOSES` or `firestore.rules`.
- Contractor-supplied bricks. No such agreement field is on `LaborAgreement` (`public/accounts.js` lines 19-28).
- The per-row question on old labour rows, a fixed id for a still-owed `advanceLabor`, and `laborReviews`. Those belong to a later pull request. H does not decide them.
- I, J, and L. Not started.

The owner chose not to add these. They are not a screen, a type, a test, or a string in H: half day, overtime, close-by-date on a rate change, suggested settlement, one-step owner approval, engineer entering days.

Linking «عهد» is after G, H, I, J, and L. No file in this sketch implements `تسوية العهدة من المستحق`.

## Accounting advisor

This sketch does not re-ask محاسب أهل الجزيرة. Ameer, 2026-11-20 18:16 Baghdad, adopted the architect and accountant middle way and stated the six items. That statement is the ruling the parent sketch follows (`docs/plans/contractor-pr-gj-sketch.md` lines 737-739). A verbatim advisor message dated 2026-11-20 is not in this repo.

The money rules H carries from that ruling, and from رأي المعماري والمحاسب point 1 (parent line 647):

- The «سلفة» cap is per project. `approvedUnpaid` is filtered by that project and that person.
- A payment above approved-unpaid work for that person on that project defaults to «سلفة» and is shown before save. This replaces the earlier one-`payLabor` overpayment path.
- The ban on `(سلفة)` in the balance line stays. H's preview does not paint `الرصيد:`.
- Q24. Cash saves stay separate documents. H's preview can name two. Each builder returns one (`docs/plans/contractor-pr-gj-sketch.md` line 749).
- Q26. `آخر معتمد` stays out of `PURPOSES` and off the payment form (parent line 752).

Q19 stays pending. It is not covered as an approved sentence. A money rule that is not in that adopted advice is `[OPEN]` for the accountant and Ameer. This sketch does not invent a policy and does not invent an advisor quote.

## pstack

The app is not claimed to be pstack-compliant. Arena was not run.

This file is the architect sketch for H: the files, the types, the signatures, the tests, and the strings are above. `principle-subtract-before-you-add` for H is the cut already in the parent: the excess is a separate `advanceLabor`, there is no second dialog, there is no second balance fold, and «حسابات» stays read-only. `principle-sequence-verifiable-units` is this sketch, then the H code pull request, ending in the behaviour tests above. `principle-model-the-domain` for H is one purpose per saved document, and one preview that names both parts before the tap. `principle-make-operations-idempotent` is `commitDoc` plus the disabled button, with one two-tap test for the split.

The H code pull request updates `feature`, `maintain-verification-skill`, and `opening-a-pr` in `docs/PSTACK_INVENTORY.md`. Evidence links only. The status word stays. This docs pull request does not edit the inventory.

## Citations rechecked at 8bb20ebc

| What | On this main |
| --- | --- |
| Service worker | `public/sw.js` line 2 is `aj-p0-v69`. Pins: `tests/shell-cache.test.js` lines 44, 67, and 101. `tests/webkit-upgrade.test.js` line 19. |
| `CONTRACTOR_COST_START` | `public/accounts.js` line 11 is `null`. Line 9 is the deploy sentence. Line 10 is the type. |
| `projectCost` | `public/accounts.js` lines 1043-1053. Line 1044 returns `legacySpent` when `start` is not `YYYY-MM-DD`. Line 1049 admits an `approveLabor` whose `txnDate` is on or after `start`. |
| `PURPOSES` | `public/accounts.js` lines 69-79. `advanceLabor` line 72. `payLabor` line 73. `returnAdvance` line 74. `refundLabor` line 75. No `آخر معتمد`. |
| `post` | `public/accounts.js` lines 468-480. `postPayment` lines 348-357. `paidAs` line 349. `postCapped` lines 395-409. `cap` line 403. `cumulative` line 404. |
| Fold | `net` line 865. `payable` line 871. `balances` line 893. `rowIndex` line 586. `walkLive` dead at line 668. `rowCounts` line 746. `hasLiveReview` lines 776-785. |
| `today` | `public/session.js` lines 172-174. `baghdadDate` lines 143-169. `uuid` line 120. Declared at `types/checkjs.d.ts` line 1273. |
| `K` and logout | `public/session.js` line 5 has no `refusedLinks`. `set` lines 69-83. `closeSession` line 399. `deleteDb` line 419. `SHELL_FILES` line 351. `outboxEmpty` lines 336-348. |
| Script order | `public/index.html` lines 71-74. The assert is `tests/shell-cache.test.js` line 83. |
| Install list | `public/render.js` lines 1696-1700. `AccountPayment` is named. Line 1700 skips a missing global. |
| «مقاول» screen | `public/accounts-work.js` `install` lines 788-800. `contractorHtml` lines 843-849. Registry push lines 741-782. Foreign button returns false at line 679. |
| Nav and click | `AccountsView.syncTab` at `public/render.js` line 1376. `AccountWork.syncTab` line 1377. `syncForemenTab` lines 1030-1045. Click walk line 1436. Registry walk `public/accounts-view.js` lines 528-532. |
| Old contract | Anchor `public/render.js` line 104. `#subnew` lines 892-922. `views.sub` lines 856-890. `المتفق عليه` line 881. `الدفعات` line 888. Entry form lines 1486-1511. |
| Home spent | `ownerSpent` lines 656-663. `إجمالي المصروف` line 675. Project `المصروف` line 767. `money` line 56. `Ledger.fmt` `public/ledger.js` line 484. |
| `commitDoc`, `queueDoc` | `public/accounts-view.js` lines 131-135. `public/render.js` lines 122-129. |
| Read-only person page | `public/accounts-view.js` line 1. `actionHtml` lines 270-280. `accountHtml` lines 312-327. `غير مدقّق` line 436. `المُرجَع أكبر من الدفعة` line 438. |
| Delete guard | `public/ledger.js` line 1142. `projectDeleteBlock` `public/render.js` lines 1153-1164. `deleteProjectNow` line 1226, call at 1230. Strings 86 and 87 are lines 1160-1161. |
| Cash rules | `cashBodyCreate` `firestore.rules` lines 866-888. `projectActive` call line 872. Pointer ban lines 882-885. `returnAdvanceCreate` lines 893-919. Named purpose line 913. Amount line 914. `refundLaborCreate` lines 925-947. Named purpose line 945. `revwCreate` lines 1082-1107. `hasOnly` line 1093. `prevRevwId` lines 505-515. `charGen` lines 394-405. `optDate` lines 499-501. `projectActive` function lines 374-375. `uuidOk` line 377. Dispatcher lines 1116 and 1123-1125. |
| Remote keys | `CASH_REMOTE` `public/sync.js` line 80. `POINTER_CASH_REMOTE` line 81. `REVW_REMOTE` line 75. `parentPointers` lines 820-828. `collectionFor` line 23. |
| Refusal sentence | `public/sync-status.js` line 12. Deleted-project sentence line 15. |
| Unit lists | `package.json` line 5 and `.github/workflows/ci.yml` line 68. Both are 41 files and they match. `"typecheck"` is line 10. |
| Unknown verify id | `scripts/verify-aj.js` line 1367 exits 3. G's ids are line 1343. The skill says the same at line 67. Features README line 22. |
| F contract hash | `docs/plans/contractor-pr-f-sketch.md` lines 102-255. sha256 `5b9524fc9875744245131be80a515fb3a8873d610647717cbb4d5d248199865f`. |
| Parent, still stale | `docs/plans/contractor-pr-gj-sketch.md` line 127 says `aj-p0-v67`. Line 140 says 39 files. Line 668 repeats `aj-p0-v67`. Line 678 says `projectCost` lines 1031-1034 return 0. H section is lines 276-330. |
| Browser check | `tests/browser-check.js` line 268 expects `+ عقد مقاول`. The add form is lines 323-329. Line 330 checks rtl, 390px, and no overflow. |

## This pull request

The diff is `docs/plans/contractor-pr-h-sketch.md` only. No `public/` edit, so `VERSION` stays `aj-p0-v69`. No rules edit. No inventory edit. No test edit. `CONTRACTOR_COST_START` stays `null`. The later H code pull request is not started. I, J, and L are not started. Nothing here is deployed, and the live Firebase project is not touched.
