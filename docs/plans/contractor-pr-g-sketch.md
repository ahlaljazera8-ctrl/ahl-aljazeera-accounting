# PLAN ONLY: contractor PR G sketch

No code in this pull request. No edit under `public/`, `tests/`, `firestore.rules`, `firestore.indexes.json`, `scripts/`, `.cursor/`, `.github/`, or `docs/PSTACK_INVENTORY.md`. `docs/plans/contractor-pr-gj-sketch.md` stays as it is. The G code pull request waits until the AgentLab Architect reviews this sketch and Ameer says go. This sketch does not merge itself and does not deploy.

Base is main `16de84c67b032f29a889258bf99c62b1146c44e4` (#96, K code, already merged). Citations below were read on that commit. A code pull request reads the lines again at its own base. Arena was not run. Ameer's gate bans it (cost).

G is the «مقاول» screen: a new labor agreement, its cancellation, a measurement, and the approval of that measurement. «حسابات» still appends nothing. The writes live on «مقاول». «عهد» is unchanged. H, I, J, and L are later pull requests. This sketch does not specify their files, types, or tests.

## What the parent G section still says that this main does not

The parent is `docs/plans/contractor-pr-gj-sketch.md` (#94, `840b48d`). Its G section was written while K was a stub and `VERSION` was `aj-p0-v67`. On this main:

- `CONTRACTOR_COST_START` is `null` at `public/accounts.js` line 11. The deploy sentence is line 9. The type is line 10. G does not assign it.
- `projectCost` is the real function at `public/accounts.js` lines 1025-1053. It is not the stub the parent describes at lines 1031-1034. While `start` is not `YYYY-MM-DD`, line 1044 returns `legacySpent` and adds no live `approveLabor`. A `YYYY-MM-DD` `txnDate` on or after `start` is what line 1049 admits.
- `const VERSION` is `aj-p0-v68` at `public/sw.js` line 2. The pins are `tests/shell-cache.test.js` lines 44, 67, and 98, and `tests/webkit-upgrade.test.js` line 19. This sketch reserves no number. The later G code pull request takes the next free value at merge time.
- F's project-delete guard is on this main. `Ledger.personProjectDeleteBlock` is `public/ledger.js` line 1142. `projectDeleteBlock` calls it at `public/render.js` lines 1135-1147. `deleteProjectNow` calls `projectDeleteBlock` at line 1212. B is #81 (`24fb839`). C is #75 (`d5cdec4`). D is #88 (`d7dc8e9`). E is #93 (`a1ca326`). F is #76 (`2d21ef0`). K is #96 (`16de84c`).

`#subnew` is `public/render.js` lines 883-904, not 859-879. `AccountsView.syncTab` is called at line 1358, not 1334. The install list is lines 1677-1682, not 1653-1658. `views.sub` is lines 847-881. `المتفق عليه` is line 872. `الدفعات` is line 879.

## Screens

«مقاول» is the only place G saves. `install` registers `views.contractor`. The nav call sits beside `AccountsView.syncTab` (`public/render.js` line 1358), the same way line 1357 calls `syncForemenTab`. G's `syncTab` adds or removes the «مقاول» link. It does not call `AccountsView.syncTab`.

The link is present while `CONTRACTOR_COST_START` is null. The approve-labor drive opens «مقاول» with the constant null. The date gates only the two old-contract screens below.

«حسابات» stays `accountHtml` (`public/accounts-view.js` lines 312-327). The file's first line already names that page read-only. `actionHtml` (lines 270-280) paints a button only when `action.tab` is the open «حسابات» tab. G's writes use `tab: 'contractor'`, so those tabs stay empty of `act-` buttons. G does not edit `public/accounts-view.js`. The click walk stays `AccountsView.onClick` at `public/render.js` line 1417, which walks the registry at `public/accounts-view.js` lines 528-532. G does not add a second walk.

«عهد» stays `ForemenUI` (`public/foremen.js` lines 17-27, title `العُهد` at line 23, nav `syncForemenTab` at `public/render.js` lines 1012-1027). G does not edit `public/foremen.js`.

Old contracts stay `views.sub` (`public/render.js` lines 847-881). The anchor `+ عقد مقاول` is line 96, inside `subcontractSection` (lines 93-97). While the constant is null, that anchor stays, and `#subnew` (lines 883-904) stays the create form. When the constant is a date, G hides the anchor and `#subnew` shows no create form. The old card, «المدفوع», and `views.sub` stay either way. A payment on an existing old contract stays on the entry form (`public/render.js` lines 1482-1488). That form already stores `entryDate: today()` at line 1492. G does not edit that form.

`commitDoc` (`public/accounts-view.js` lines 131-135) still appends one id and calls `queueDoc` (`public/render.js` lines 113-120). G calls that path. It does not add a second demo gate and it does not call `flushRemote`.

## Files the G code pull request edits

| File                                                        | Change                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/accounts-work.js`                                   | New. «مقاول» screen, agreement, `cancel-agreement`, `laborQty`, `approveLabor`.                                                                                                                                                                                                                                                                         |
| `public/render.js`                                          | Three sites. Call `AccountWork.syncTab` beside line 1358. That call is not gated on the date. Only when `CONTRACTOR_COST_START` is a date: hide the anchor (line 96) and make `#subnew` (lines 883-904) show no create form. While the constant is null, those two screens stay as they are.                                                            |
| `public/index.html`                                         | One script tag after `accounts-view.js` (line 72) and before `render.js` (line 73).                                                                                                                                                                                                                                                                     |
| `public/sw.js`                                              | `ASSETS` (line 3), `SHELL` (line 5), `VERSION` (line 2). `VERSION` is the next free value at merge time. This sketch reserves none. Line 2 is `aj-p0-v68` on this main.                                                                                                                                                                                 |
| `public/session.js`                                         | One key in `SHELL_FILES` (line 351). Not `today()` (lines 171-174), not `uuid()` (line 120), not `closeSession` (line 399). Not `K` (line 5).                                                                                                                                                                                                           |
| `tests/accounts-work.test.js`                               | Behaviour tests below.                                                                                                                                                                                                                                                                                                                                  |
| `tests/strict-accounts-work.test.js`                        | New. Same shape as `tests/strict-accounts.test.js`.                                                                                                                                                                                                                                                                                                     |
| `tsconfig.strict-accounts-work.json`                        | New. Include `public/accounts-work.js` and `types/checkjs.d.ts`. `today` is already declared at `types/checkjs.d.ts` line 1204.                                                                                                                                                                                                                         |
| `types/checkjs.d.ts`                                        | `Window.AccountWork` (line 1161) gains `syncTab` beside `install`. `AccountModule` (lines 920-922) stays `install` only, so the other reserved globals are not given `syncTab`. `ActionTab` (line 861) gains `'contractor'`. `RenderApi` (lines 832-844) is not extended.                                                                               |
| `package.json`, `.github/workflows/ci.yml`                  | The two new test paths, both lists, and the typecheck script. `package.json` line 5 and `.github/workflows/ci.yml` line 68 are 39 files and they match. The code pull request reads both lists at its own base and adds its two tests. It does not copy 39 forward. `"typecheck"` (line 10) gains `tsc --noEmit -p tsconfig.strict-accounts-work.json`. |
| `tests/shell-cache.test.js`, `tests/webkit-upgrade.test.js` | Pins at lines 44, 67, and 98, `MARK` at line 19, and the script-order assert at `tests/shell-cache.test.js` line 82. The new script sits between `accounts-view.js` and `render.js`.                                                                                                                                                                    |
| `tests/browser-check.js`                                    | Line 268 stays while `CONTRACTOR_COST_START` is null. It still expects `+ عقد مقاول`. G does not change that line on the null build. Lines 323-330 stay on the null build.                                                                                                                                                                              |
| `docs/PSTACK_INVENTORY.md`                                  | The code pull request only. Evidence on `feature`, `maintain-verification-skill`, `opening-a-pr`. Status word stays. This docs pull request does not edit the inventory.                                                                                                                                                                                |
| Skill files                                                 | `drive` accepts `new-agreement`, `cancel-agreement`, `labor-qty`, `approve-labor`. One feature file per id, under `.cursor/skills/verify-ahl-aljazeera-accounting/features/`, named for that id. An unknown id still exits 3 (`scripts/verify-aj.js` line 1310, skill line 67, features README line 21).                                                |
| `scripts/verify-drives/accounts-work.js`                    | The steps. `scripts/verify-aj.js` dispatches.                                                                                                                                                                                                                                                                                                           |

`buttonId` is `act-` plus the id. The module exports `install`, `syncTab`, `slotBodyId`, `agreementDoc`, `agreementReversalDoc`, `laborQtyDoc`, and `approveLaborDoc`.

`public/render.js` already installs `AccountWork` (`public/render.js` lines 1677-1682). A missing global is skipped. G does not add a name to that list.

## Types and signatures

```javascript
/**
 * @param {RenderApi} api
 */
function install(api)

/**
 * Adds or removes the «مقاول» nav link. Does not call AccountsView.syncTab.
 * The link is shown to the owner while CONTRACTOR_COST_START is null.
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
 * milestoneMode is stored as 'amount'. The unit method's label stays بسعر الوحدة.
 * حسب الإنجاز (الكمية × سعر الوحدة) is بانتظار أمير and is not painted.
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
 * The label reuses سبب التصحيح (public/render.js lines 825 and 828, public/ledger.js line 258).
 * No fxRate. No txnDate. reversalKeys (firestore.rules lines 444-454) has neither key.
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
 * Always writes txnDate from today() in public/session.js. See the txnDate section.
 * @param {PostInput & AccountHeader} input
 * @returns {{ doc: object | null, errors: string[] }}
 */
function approveLaborDoc(input)
```

`AccountHeader` stays the parent header: `kind`, `projectId`, `partyId`, `createdBy`, `createdByName?`, `deviceId`, `txnDate`, `currency: 'IQD'`, `fxRate: 1`. The form has no `عملة` field.

`laborQtyDoc` still takes `PostInput & AccountHeader`, so that input type still includes `txnDate`. This sketch does not add a second rule that `laborQtyDoc` calls `today()`. The mandatory write is `approveLaborDoc`.

`agreementReversalDoc` has no `fxRate` and no `txnDate`.

r7's cancel rules stay. A live `rev_` of the agreement returns `cancelled` from `laborQtyDoc` and `approveLaborDoc`. A refused `rev_` whose id is in `syncErrors` does not. `cancel-agreement` stays off on that phone while the refused id is in `syncErrors`. Measurement and approval stay on. Logout and the rejected CSV for an `agreements` id come from E. On this main `rejectedLogoutBlock` (`public/render.js` lines 603-608) lists ledger rows refused with `رُفض الإرسال لأن المشروع محذوف` (`public/sync-status.js` line 15) plus `refusalDocs`. G does not widen it.

`projectActive` (`firestore.rules` lines 374-375) is `status == 'active'`. (a) The phone already knows the project is not active: the button is off, nothing is queued. (b) The phone still shows it active and the server has closed or deleted it: the cancel is queued, the server refuses it, the agreement row is unchanged.

`post('approveLabor')` with no agreement object is `agreement` (`public/accounts.js` line 370). The effect on a stored approval is `{ cost: 1, person: 1, cash: 0 }` (`public/accounts.js` line 71). G calls `post`. It does not edit `PURPOSES`.

## approveLabor.txnDate

G always writes the approval date into `approveLabor.txnDate`.

`approveLaborDoc` sets `txnDate` to the string `today()` returns. `today()` is the Baghdad civil date (`public/session.js` lines 171-174), `YYYY-MM-DD`, via `baghdadDate` (lines 143-169). G calls that function. G does not call `toISOString`. G does not edit `today()` or the fallback inside `baghdadDate` (line 168).

The field is present on every successful approval document. A missing input, a non-date input, or an input date other than `today()` does not leave the field off and does not replace that call. The written value is `today()`.

Why: `optDate` allows `txnDate` to be missing (`firestore.rules` lines 499-501). `approveLaborCreate` calls `optDate` (line 810) and its `hasOnly` list includes `txnDate` (line 797), so a present `YYYY-MM-DD` date is already legal. `entryDateOk` is lines 44-51. Once `CONTRACTOR_COST_START` is a date, `projectCost` skips an `approveLabor` row whose `txnDate` is missing or not `YYYY-MM-DD` (line 1049). That skip is INFO-1 on the Architect's APPROVE of #96 at `95ce8a2200dda834daf936cf5ddc378ce72761eb`, squash-merged as `16de84c6`. The in-repo record is the comment at `tests/accounts.test.js` lines 326-327, and the assertions at lines 328-331.

This is a tightening of G's existing header. It is not a behaviour change that waits on Ameer. It is not a `firestore.rules` change. G does not make `txnDate` required in the rules.

A behaviour test asserts that a successful approval document has a `YYYY-MM-DD` `txnDate`, and that the string equals `today()` for that call. The test does not build the expected date with `toISOString`. Omitting the field, writing a non-date, or writing a UTC timestamp fails the test.

The approve-labor drive reads that `appr_` back from the emulator. Its `txnDate` is `YYYY-MM-DD`.

## Strings

Strings, new, on G: `مقاول`, `عقد عمل جديد`, `تسجيل عمل منجز`, `اعتماد قياس العمل`, `طريقة الدفع`, `مبلغ مقطوع`, `باليوم`, `مرحلة`, `سعر الوحدة`, `لكل كم`, `اسم الوحدة`, `أجرة اليوم`, `قيمة المرحلة`, `مبلغ`, `بعد الحفظ لا يتغير الاتفاق إلا بقيد عكس.`, `الكمية`, `الوحدة`, `كمية منجزة`, `أيام معتمدة`, `اعتماد المرحلة`, `منجز`, `بانتظار الاعتماد`, `معتمد`, `مرفوض`, `الاتفاق غير موجود`, `طريقة الدفع لا تطابق القياس`, `المبلغ ليس عدداً صحيحاً`, `لا اعتماد بلا قياس`, `القياس معتمد مسبقاً`, `بعد الحفظ تصبح الحالة:`, `المحاولة <n> من 9`.

`بانتظار أمير`, on G: `العقد الجديد من شاشة مقاول`, and `حسب الإنجاز (الكمية × سعر الوحدة)`. The first is the sentence `#subnew` shows once `CONTRACTOR_COST_START` is a date. Neither is treated as approved. `حسب الإنجاز (الكمية × سعر الوحدة)` is not painted. The unit method's label stays `بسعر الوحدة` (`public/accounts-view.js` line 388).

Reused on G: `حفظ`, `رجوع`, `هذه الشاشة للمالك.`, `الوصف`, `عكس`, `معكوس`, `سبب التصحيح`. `الكمية` on G is the measurement field. The person-page tile of the same word is J's display. G does not paint that tile.

A UI string that is not in those three lists, and not in a G row of the error table below, is `[OPEN]` for Ameer. This sketch does not invent wording.

## Error sentences

`post` returns the English codes from B. G maps a code to an Arabic sentence it already has. There is no shared mapper. Rows that name G, from the parent table:

| Code                                     | Sentence                                       | Where                                                           |
| ---------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| `method` from `agreementDoc`             | `طريقة الدفع لا تطابق القياس`                  | G                                                               |
| `percent`                                | `طريقة الدفع لا تطابق القياس`                  | G. The form does not offer `نسبة`.                              |
| `lump`, `milestone`                      | `المبلغ ليس عدداً صحيحاً`                      | G                                                               |
| `earned`                                 | `لا اعتماد بلا قياس`                           | G                                                               |
| `agreement` from `post`                  | `الاتفاق غير موجود`                            | G. `public/accounts.js` line 370.                               |
| `description`                            | no new sentence. The save stays off.           | G                                                               |
| `range`, `amount`, `overflow`, `inexact` | `المبلغ ليس عدداً صحيحاً`                      | G, and also H, I, J, L in the parent. G uses the same sentence. |
| `cancelled`                              | no new sentence. The work buttons stay hidden. | G, after a live `rev_<agreementId>`                             |

A lump or an amount milestone has no amount box on the measurement. `post` still refuses a partial amount. `المُرجَع والتسوية أكبر من السلفة` is H and J in the parent. It is pending Ameer. G does not use it.

## Behaviour tests

`tests/accounts-work.test.js` asserts behaviour. No assertion reads a helper's source text.

- Unit rate 300,000 per 4,000, approved qty 8,000. The approval amount is 600,000. The body id is a uuid. The returned document's effect is cost +1 and person +1. `unitPrice` states the arithmetic "300000 per 4000 is 75" (`public/accounts.js` lines 121-125). That sentence does not name a contractor.
- A successful approval document has `txnDate`. The value matches `/^\d{4}-\d{2}-\d{2}$/` and equals `today()` from `public/session.js`. The expected string is not built with `toISOString`.
- A lump of 600,000 approves 600,000. `slotBodyId('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '1')` is `000aaaaaaaabbbbccccddddeeeeeeeeeeee1`. A second body at generation 1 is the same id.
- Daily rate 50,000 and 3 days earns 150,000.
- Amount milestone 250,000 earns 250,000. The stored `milestoneMode` is `amount`. The document has no percent field.
- Generation 9 is the last slot. The screen text is `المحاولة 9 من 9`.
- A uuid body on a lump agreement is `method`. `unitQty` 1000001, a product above 1e16, a negative qty, and a fractional qty are `range` or `overflow`.
- `approveLabor` with earned 0 is `earned`. Two method groups are `method`. `milestoneMode: 'percent'` is `percent`. An empty description leaves the save off.
- `post('approveLabor')` with no agreement object is `agreement` (`public/accounts.js` line 370).
- Two taps of the agreement save append one `agreements` row and one outbox id. The button is disabled until `save` returns.
- Two taps of `approve-labor` append one `appr_` and one outbox id.
- `agreementReversalDoc` copies the original's values. The reversal document has no `txnDate` key and no `fxRate` key. An original that is itself `rev_` is `kind`. An empty reason is refused. After a live `rev_`, measurement and approval return `cancelled`. A refused `rev_` in `syncErrors` does not.
- While `CONTRACTOR_COST_START` is null, the project page HTML contains `+ عقد مقاول`. That is the check `tests/browser-check.js` line 268 already makes. `#subnew` is the form at lines 323-329: the name is `مقاول السباكة`, the amount is `1,500,000`, the work is `تمديد شبكة الماء للمجمع المدرسي`, and the text includes `حفظ العقد` and `لا يتغير المبلغ إلا بملحق` (line 329). Line 330 checks rtl, 390px, and no overflow. G does not change those checks. The source binding at `public/accounts.js` line 11 stays `null`.
- When the constant is a date, the same project HTML contains the contractor's name and `المدفوع` and does not contain `+ عقد مقاول`. `#subnew` does not paint `#sub-name`, `#sub-amount`, `#sub-work`, or `حفظ العقد`. It shows the project name and `العقد الجديد من شاشة مقاول`, and it does not save. Opening the old contract still shows `المتفق عليه` and `الدفعات` (`public/render.js` lines 872 and 879). The test sets the exported `Accounts.CONTRACTOR_COST_START` to a `YYYY-MM-DD` fixture for that assertion and restores `null`. It does not edit `public/accounts.js`. The fixture date is not a decision to deploy that date.
- (a) The local project is not `active`. `cancel-agreement` is off. Nothing is queued. The agreement row is unchanged.
- (b) Emulator. The owner phone is online and still shows the project as active. An admin sets the project to `closed` with rules disabled. The cancel is queued and refused. `syncErrors` has `رُفض الإرسال` (`public/sync-status.js` line 12). A deleted project uses `رُفض الإرسال لأن المشروع محذوف` (line 15). There is no live `rev_`. The agreement row is unchanged.
- A body whose id is in `syncErrors` is not offered to `approve-labor`. `walkLive` marks that id dead at `public/accounts.js` line 668.
- The «حسابات» HTML for that person contains no `act-new-agreement` button.
- The builder's keys, minus `docType`, are a subset of the live allowlist. `createdAtDevice` is absent. For an approval the list is `firestore.rules` line 797 and `APPR_REMOTE` (`public/sync.js` line 78). For a measurement it is `firestore.rules` lines 680 and 716 and `QTY_REMOTE` (`public/sync.js` line 82). For an agreement reversal it is `reversalKeys` (`firestore.rules` lines 444-454). G does not edit those lists.

`approve-labor` drive: sign in, open «مقاول», save the brick agreement, save the measurement, approve it. Firestore has one `agreements` row, one `laborQty`, and one `appr_`. That `appr_` has a `YYYY-MM-DD` `txnDate`. The person page shows `عمل معتمد` 600,000. That label is the existing overview line (`public/accounts-view.js` line 374). G does not edit it. Home `إجمالي المصروف` (`public/render.js` line 666) is unchanged. `ownerSpent` (lines 647-654) passes `Accounts.CONTRACTOR_COST_START`, and `projectCost` line 1044 returns `legacySpent` while that value is null, so the approval adds nothing. The agreement form says `بسعر الوحدة`. The quantity tile is J's. The drive runs with the constant null. It does not assert a new home total. A drive that expected home spent to become 600,000 would be wrong.

The same `ownerSpent` path feeds project `المصروف` at `public/render.js` line 758. While the constant is null that figure stays legacy too. G does not add a second cost function.

## CONTRACTOR_COST_START

The constant stays `null` in this sketch and in the later G code pull request. Setting it waits for Ameer's approval and is a later deploy, not part of G. It stays `[OPEN]`. A date of 2026-12-01 has been mentioned. This sketch does not choose it and does not write it into `public/accounts.js`.

While the constant is null, G does not hide `+ عقد مقاول` and does not change `#subnew`. Those two screens stay as they are. The date-gated sentence `العقد الجديد من شاشة مقاول` stays `بانتظار أمير` and is not treated as approved.

K is already merged. While the constant is null, an approval still writes its document, including `txnDate`, and home `المصروف` does not move. The date does not gate G's merge.

## What G does not edit

From the parent section "Files the code PRs do not edit", applied to G:

`public/accounts.js` (B, then C, then K). `public/ledger.js`. `public/foremen.js`. `public/sync.js`. `public/app.js`. `public/firebase-client.js`. `firestore.rules`. `firestore.indexes.json`. `public/accounts-view.js`. `public/session.js` except the one `SHELL_FILES` key.

`firestore.rules` is not in G's later code diff. G does not add a rule that makes `txnDate` required. `optDate` stays.

G edits `public/render.js` at the three sites named above. H, I, and J do not edit `public/render.js`. L is the later pull request that adds `AccountReclass` to the install list. This sketch does not plan that edit.

G does not add `refusedLinks` or `laborReviews` on `K` (`public/session.js` line 5). Those names belong to H and L in the parent. G does not edit `closeSession` or the logout wipe at line 419.

No new test assertion reads a helper's source text.

`public-canon-diff.sh` fails when the set of files under `public/` changes. CI runs `tests/public-canon-diff.test.js`, which uses a temp repo. The G code pull request does not point that script at its own base and head.

## F to G-J contract

The contract lives in `docs/plans/contractor-pr-f-sketch.md`. The slice from `## F to G-J contract` up to, and not including, `## Contract hash` is still that file's lines 102-255. Its sha256 is still `5b9524fc9875744245131be80a515fb3a8873d610647717cbb4d5d248199865f`. This sketch does not recopy that slice. Line 104 of that file says G, H, I, and J do not edit `public/render.js`. The named exception for G is the three sites in the file table above.

`ActionTab` on this main is `'agreements' | 'movements' | 'statement'` (`types/checkjs.d.ts` line 861). G widens it with `'contractor'`. Until that edit, a strict check of an action whose `tab` is `contractor` fails.

Script order on this main: `accounts.js` then `accounts-view.js` then `render.js` (`public/index.html` lines 71-73). G inserts `accounts-work.js` after `accounts-view.js` and before `render.js`.

## Sequencing and dependencies

K is merged (#96). G's code pull request is next among the contractor screens. It merges after this sketch is reviewed and Ameer says go, and only while F's project-delete guard is on that main. The guard is on this main. The cutover date does not gate that merge.

H, then I, then J, then L are later pull requests. This sketch names that order and does not plan them. `today()` is what H and L use for `txnDate` and `entryDate` in the parent. G's approval uses the same function. This sketch does not specify H or L.

G depends on work that is already merged:

- B: `post`, the caps, amount milestones, and the `agreement` code at `public/accounts.js` line 370.
- C: `balances` (`public/accounts.js` line 893) is what the existing person page reads. `net` is line 865. G does not edit the fold. The drive reads `عمل معتمد` from the page F already paints.
- D: the rules cited above. G does not change them. A write the server refuses becomes `syncErrors`, and the picker does not offer that row.
- E: `collectionFor` (`public/sync.js` line 23) flushes `agreements` and `accountTxns`. G shows `رُفض الإرسال` (`public/sync-status.js` line 12) and does not invent a new refusal sentence.
- F: `#accounts`, `#account/<id>`, the four tabs, `commitDoc`, and the delete guard. Strings 86 and 87 stay F's (`public/ledger.js` lines 1160-1161). G does not paint them.
- K: `projectCost`. Merged. The constant stays null. G does not add cost itself. While the constant is null, K adds no live `approveLabor`.

An agent that edits `public/accounts.js` to build a slot id or to assign `CONTRACTOR_COST_START` will collide with B, C, and K. `slotBodyId` lives in `public/accounts-work.js`. An agent that hides `views.sub` as well as the new-contract button will take the old contract's details away. Those details stay.

Reverting the G code pull request removes that script, its tests, and its verify ids. Firestore documents already written stay. Reverting G puts the `+ عقد مقاول` anchor back, because that edit lives in G. Old contracts that already exist are untouched. The revert pull request takes the next free service-worker value again if `public/` changes. This docs pull request does not change `public/`, so it bumps no version.

## [OPEN] and deferred

These do not block this sketch. G decides none of them.

- The cutover date. `CONTRACTOR_COST_START` stays `null` (`public/accounts.js` line 11). Setting it is a later deploy after Ameer says go. A mentioned date is not chosen here.
- `حسب الإنجاز (الكمية × سعر الوحدة)` stays `بانتظار أمير` and is not painted.
- `العقد الجديد من شاشة مقاول` stays `بانتظار أمير`. The date-gated `#subnew` path shows it when the constant is a date. The wording is not treated as approved.
- Any new UI string outside the G lists above. Any `firestore.rules` change, including making `txnDate` required.
- Whether Jabbar (جبار) is a contractor. The name is not in this repo. The `unitPrice` comment is the arithmetic example only. His custody entries stay as they are.
- Retention. No retention field is in `PURPOSES` or `firestore.rules`.
- Contractor-supplied bricks. No such agreement field is on `LaborAgreement` (`public/accounts.js` lines 19-28).

The parent also leaves these open, and they are not G: the per-row L question, the `روجع` mark, a fixed id for the still-owed `advanceLabor`, and `المُرجَع والتسوية أكبر من السلفة`. H, I, J, and L answer their own sketches.

The owner chose not to add these. They are not a screen, a type, a test, or a string in G: half day, overtime, close-by-date on a rate change, suggested settlement, one-step owner approval, engineer entering days.

Linking «عهد» is after G, H, I, J, and L. No file in this sketch implements `تسوية العهدة من المستحق`.

## Accounting advisor

This sketch does not re-ask محاسب أهل الجزيرة. Ameer, 2026-11-20 18:16 Baghdad, adopted the architect and accountant middle way and stated the six items. That statement is the ruling the parent sketch follows (`docs/plans/contractor-pr-gj-sketch.md` lines 737-739). A verbatim advisor message dated 2026-11-20 is not in this repo.

Item 2 of that ruling is the part G carries: cost is recognised when a measurement is approved. The effect is already `{ cost: 1, person: 1, cash: 0 }` (`public/accounts.js` line 71). K's `projectCost` is what later puts that cost on the project figure, and only for a live `approveLabor` whose `txnDate` is `YYYY-MM-DD` on or after the start date. Writing `txnDate` from `today()` is how that later recognition can see the row. While the constant is null, `projectCost` returns `legacySpent` and the home figure does not move. G changes no balance, no advance, no export, and no rule. No new advisor quote is invented.

## pstack

The app is not claimed to be pstack-compliant. Arena was not run.

This file is the architect sketch for G: the files, the types, the signatures, the tests, and the strings are above. `principle-subtract-before-you-add` for G is the cut already in the parent: no opening balance, no migration, no second balance fold, and the old new-contract button stays until the constant is a date. `principle-sequence-verifiable-units` is this sketch, then the G code pull request, ending in the behaviour tests above. `principle-model-the-domain` for G is one approval document, one `txnDate` from `today()`, and one purpose per saved document. `principle-make-operations-idempotent` is `commitDoc` plus the disabled button, with one two-tap test for the agreement and one for `approve-labor`.

The G code pull request updates `feature`, `maintain-verification-skill`, and `opening-a-pr` in `docs/PSTACK_INVENTORY.md`. Evidence links only. The status word stays. This docs pull request does not edit the inventory.

## Citations rechecked at 16de84c6

| What                        | On this main                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Service worker              | `public/sw.js` line 2 is `aj-p0-v68`. Pins: `tests/shell-cache.test.js` lines 44, 67, and 98. `tests/webkit-upgrade.test.js` line 19.    |
| `CONTRACTOR_COST_START`     | `public/accounts.js` line 11 is `null`. Line 9 is the deploy sentence.                                                                   |
| `projectCost`               | `public/accounts.js` lines 1025-1053. Line 1044 returns `legacySpent` when `start` is not `YYYY-MM-DD`. Line 1049 requires `txnDate`.    |
| K test comment              | `tests/accounts.test.js` lines 326-331. Undated and non-date `approveLabor` add nothing once `start` is a date.                          |
| `today`                     | `public/session.js` lines 171-174. `baghdadDate` is lines 143-169. Declared at `types/checkjs.d.ts` line 1204.                           |
| `optDate`                   | `firestore.rules` lines 499-501. `approveLaborCreate` calls it at line 810. `hasOnly` includes `txnDate` at line 797.                    |
| Script order                | `public/index.html` lines 71-73. The assert is `tests/shell-cache.test.js` line 82.                                                      |
| `SHELL_FILES`               | `public/session.js` line 351.                                                                                                            |
| Old-contract anchor         | `public/render.js` line 96. `#subnew` is lines 883-904. `views.sub` is lines 847-881. `المتفق عليه` line 872. `الدفعات` line 879.        |
| Nav call                    | `AccountsView.syncTab` at `public/render.js` line 1358. `syncForemenTab` is lines 1012-1027. Click walk is line 1417.                    |
| Install list                | `public/render.js` lines 1677-1682. `AccountWork` is already named.                                                                      |
| Delete guard                | `public/ledger.js` line 1142. `projectDeleteBlock` is `public/render.js` lines 1135-1147. `deleteProjectNow` is line 1208, call at 1212. |
| `commitDoc`, `queueDoc`     | `public/accounts-view.js` lines 131-135. `public/render.js` lines 113-120.                                                               |
| `actionHtml`, `accountHtml` | `public/accounts-view.js` lines 270-280 and 312-327.                                                                                     |
| Unit lists                  | `package.json` line 5 and `.github/workflows/ci.yml` line 68. Both are 39 files and they match.                                          |
| Unknown verify id           | `scripts/verify-aj.js` line 1310 exits 3. The skill says the same at line 67.                                                            |
| F contract hash             | `docs/plans/contractor-pr-f-sketch.md` lines 102-255. sha256 `5b9524fc9875744245131be80a515fb3a8873d610647717cbb4d5d248199865f`.         |

## This pull request

The diff is `docs/plans/contractor-pr-g-sketch.md` only. No `public/` edit, so `VERSION` stays `aj-p0-v68`. No rules edit. No inventory edit. No test edit. No assignment of `CONTRACTOR_COST_START`. The later G code pull request is not started. Nothing here is deployed, and the live Firebase project is not touched.
