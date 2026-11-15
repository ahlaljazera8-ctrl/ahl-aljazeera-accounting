# PLAN ONLY: contractor PRs G–J sketch

No code in this pull request. No edit to `public/`, `firestore.rules`, or `public/sw.js`. The four code pull requests come after the Architect reviews this sketch and Ameer says go.

Revision r2, against Architect NOTES on `9262d7c09040cf2597b395c352d67f17be8b0c9a` (review sha256 starts `c36dded8`). EA approved the defaults in `QUESTIONS-FOR-EA-r1` at 00:46 Baghdad on 2026-11-16. Where `answers-EA-delegated-0034.md` (sha256 `c14b9c8425287d9b787b28a9afae45bf25aaf8aa2a482319e1c9d63d9c91a7da`) differs, that earlier answer wins.

Parent plan: `plan-contractor-module-r2.28.md`, sha256 `ef1c98d08a7118ed35469d250c81605a7f17f518d949f8446b8c63bb1869c8a2`. Status note: handoff `plan-status-r2.29.md`. Strings list: `strings-contractor-module-r2.22.md`, sha256 `9d25840a01257eb76cba6ce6323d32436bd08c471e5e49a703af9d6bb10a6d3a`. PR B's types and `post` are the ones in `contractor-pr-b-sketch-r3.md`. This sketch treats that file as what B will add. It does not re-specify B.

Arena was not run. Ameer's gate bans it (cost). Two shapes are compared below. The shape that won is four flow files and twelve one-document saves.

Base for these citations: `baf4f21fc54c156989334e826d19990b8e5e8a74` (v58). Service worker `VERSION` is `aj-p0-v58` (`public/sw.js` line 1). The code pull requests rebase onto whatever main is when they start. They do not reserve a service-worker number.

## Scope

Plan r2.28 lines 929-948. Order is A, B, C, then D merged and deployed by Ameer, then E, F, K, then G–J. G–J are the write screens. Each save queues one document. At this base, F and K are not on main. The code pull requests start after F has painted `#accounts` and the read-only `#account/<id>` page, and after K has put `projectCost` on the owner home and the owner project screen.

v1 is the smaller cut (plan section 14). In: a labor agreement (lump, unit, daily, amount milestone), a measurement, its approval, a payment, an advance, a cash return, a labor refund, a labor deduct and its approval, a settle, a reversal, a live statement, and `statementApprovals`. IQD only. Four tabs, which F owns: `نظرة عامة`, `العقود`, `الحركات`, `كشف الحساب`.

Out of every G–J file, type, test, and string: materials, invoices, USD, attachments, the role list, milestone percent, and `otherApproved` / `آخر معتمد`. Percent stays denied (Q-percent, phase 2). `otherApproved` stays out of `PURPOSES` and off the payment form (EA Q26). The two project-delete sentences stay off these four pull requests (EA Q27).

`CONTRACTOR_COST_START` stays `null` (`public/accounts.js` lines 11 and 176 at this base). An approval document is still written. The home and project figures do not move while the constant is null. Plan line 946 says G–J come after K so an approval moves the project figure. That sentence is the reason these screens follow K. It is not true on screen while the constant is null, which plan section 10 already says. The drives below assert the document and the person page. They do not assert a new home total.

## The twelve saves

The plan's twelve (r2.2 onward, the Q-screens note) are the spec's nine actions plus `اعتماد`, `رفض السطر`, and `نسخة جديدة`. Three of the nine are material buttons. Section 14 removes them: `تسجيل شراء مواد`, `صرف سلفة مواد`, `تسجيل توريد مواد`. They are not in G–J.

A single `تسجيل دفعة` button that picks among four purposes hides three documents inside one revert. Plan line 946 is the twelve actions, one document each. Plan line 73 is the shared-id rule: one deterministic id is one document. `PURPOSES` already has four labor cash rows. EA Q24 counts each cash save as its own action. That replaces the three material buttons and keeps the count at twelve. `تسجيل دفعة` stays the title of the payment form.

| #   | Save                     | Document                          | Collection                  | PR  | Verify id                 |
| --- | ------------------------ | --------------------------------- | --------------------------- | --- | ------------------------- |
| 1   | `عقد عمل جديد`           | agreement                         | `agreements/{uuid}`         | G   | `accounts-agreement`      |
| 2   | `تسجيل عمل منجز`         | `laborQty` body                   | `accountTxns`               | G   | `accounts-labor-qty`      |
| 3   | `اعتماد قياس العمل`      | `approveLabor`                    | `appr_<bodyId>`             | G   | `accounts-approve-labor`  |
| 4   | `عن عمل معتمد`           | `payLabor`                        | uuid body                   | H   | `accounts-pay-labor`      |
| 5   | `سلفة عمل قادم`          | `advanceLabor`                    | uuid body                   | H   | `accounts-advance-labor`  |
| 6   | `إرجاع سلفة لم تُصرف`    | `returnAdvance`                   | uuid body                   | H   | `accounts-return-advance` |
| 7   | `استرداد نقدي من العامل` | `refundLabor`                     | uuid body                   | H   | `accounts-refund-labor`   |
| 8   | `نسخة جديدة`             | `sup_` of an unapproved uuid body | `sup_<oldId>`               | I   | `accounts-supersede`      |
| 9   | `رفض السطر`              | `rej_`                            | `rej_<bodyId>`              | I   | `accounts-reject`         |
| 10  | `اعتماد`                 | `approveDeduct`                   | `appr_<deductId>`           | I   | `accounts-approve-deduct` |
| 11  | `تسوية سلفة`             | `settle`                          | `stl_<bodyId>_<gen>`        | J   | `accounts-settle`         |
| 12  | `إصدار كشف حساب`         | statement approval                | `statementApprovals/{uuid}` | J   | `accounts-statement`      |

`خصم` writes the deduct body that save 10 approves. It is a thirteenth document. EA Q25 puts it inside I, beside `اعتماد`, and not in a fifth pull request. Its verify id is `accounts-deduct`.

Two more writes are already decided and are not members of the twelve. H's `تدقيق` writes `revw_` (Q10 أ). I's `عكس` writes `rev_<id>` (section 14, reversal). Verify ids: `accounts-review`, `accounts-reverse`.

Second shape, not chosen. Keep one `تسجيل دفعة` action with a purpose picker, drop the three material buttons, and ship nine actions. H is then one action. A revert of the refund takes the wage payment with it. The four purposes already differ in target, cap, and sentence, so they do not belong in one revert. Arena was not run.

Copied from PR #76 head `507f312c3eb4651871a70a522841bbb1c852ee8f`, file `docs/plans/contractor-pr-f-sketch.md`. The section under the heading matches that file.

## F to G-J contract

G–J copy this section as it stands. Names here do not change. F owns the registry, the stored scope, and the four guarded calls. G, H, I, and J do not edit `public/render.js`.

Script order: `accounts.js`, `accounts-view.js`, then `accounts-work.js`, `accounts-payment.js`, `accounts-correct.js`, `accounts-statement.js`, then `render.js`. `accounts-view.js` creates the registry at load. An action script pushes only inside its `install`.

`render.js`, in the same block as `ForemenUI.install` (`public/render.js` lines 1423-1430), after `AccountsView.install(api)`:

```javascript
if (window.AccountWork) AccountWork.install(api);
if (window.AccountPayment) AccountPayment.install(api);
if (window.AccountCorrect) AccountCorrect.install(api);
if (window.AccountStatement) AccountStatement.install(api);
```

`api` is the object already passed to `ForemenUI.install`: `views`, `titles`, `state`, `render`, `esc`, `money`, `queueDoc`, `confirmShell`, `lastSyncAt`, `formatSyncTime`. `get`, `set`, `uuid`, `me`, and `today` stay the existing globals. F does not add them to `api`. G–J call those globals. They do not extend `RenderApi`.

```javascript
/**
 * @typedef {'agreements'|'movements'|'statement'} ActionTab
 * F's screen tab `الحركات` is `movements`. It is not `moves`.
 */

/**
 * @typedef {{
 *   id: string,
 *   tab: ActionTab,
 *   label: string,
 *   buttonId: string,
 *   renderForm: () => string,
 *   onClick: (button: HTMLButtonElement) => boolean,
 *   save: (input: object) => { doc: object | null, errors: string[] }
 * }} AccountAction
 * renderForm returns '' when that action's form is closed.
 * onClick returns true when this action handled the button.
 * save does not call Firestore and does not call queueDoc. The action appends
 * the doc, then calls the global queueDoc, the same way create-person does.
 */

/** @type {AccountAction[]} */
globalThis.AccountActions = [];
```

Each `install` pushes its own actions onto `globalThis.AccountActions` and does not replace the array. A second push of the same `id` is a no-op. Reverting one script removes its buttons. The other three stay.

Stable action ids and tabs. The label is that PR's approved string. `buttonId` is `act-` plus the id.

| id                   | tab          | module             |
| -------------------- | ------------ | ------------------ |
| `new-agreement`      | `agreements` | `AccountWork`      |
| `labor-qty`          | `movements`  | `AccountWork`      |
| `approve-labor`      | `movements`  | `AccountWork`      |
| `pay-labor`          | `movements`  | `AccountPayment`   |
| `advance-labor`      | `movements`  | `AccountPayment`   |
| `return-advance`     | `movements`  | `AccountPayment`   |
| `refund-labor`       | `movements`  | `AccountPayment`   |
| `review-cash`        | `movements`  | `AccountPayment`   |
| `supersede`          | `movements`  | `AccountCorrect`   |
| `reject`             | `movements`  | `AccountCorrect`   |
| `deduct`             | `movements`  | `AccountCorrect`   |
| `approve-deduct`     | `movements`  | `AccountCorrect`   |
| `reverse`            | `movements`  | `AccountCorrect`   |
| `settle`             | `statement`  | `AccountStatement` |
| `statement-approval` | `statement`  | `AccountStatement` |

`accountHtml` paints, inside the open tab only, one `<button type="button" class="btn" id="...">` per action whose `tab` equals that tab, then that action's `renderForm()`. The overview tab has no action. F does not hardcode these labels. An empty registry paints no write button.

`AccountsView.onClick` walks `AccountActions` in order and returns on the first `onClick` that returns true. Party-create handling runs only when none of them returns true.

Scope is not view state and not a field of `AccountScreen`. One module flag, written by the project pills and the week/month pills, read by J:

```javascript
/**
 * @typedef {{
 *   scope: 'project' | 'all',
 *   projectId: string,
 *   periodKind: 'week' | 'month'
 * }} AccountScopeFlag
 * projectId is '' when scope is 'all'. Default: { scope: 'all', projectId: '', periodKind: 'week' }.
 */

/**
 * @returns {AccountScopeFlag}
 */
function readAccountScope()

/**
 * @param {AccountScopeFlag} next
 */
function writeAccountScope(next)

/**
 * @returns {{ periodStart: string, periodEnd: string } | null}
 * Accounts.periodBounds(readAccountScope().periodKind, today()).
 * C's function. accounts-view.js does not define periodBounds.
 * There is no statementPeriod.
 */
function accountPeriod()
```

`AccountsView` exports `readAccountScope`, `writeAccountScope`, and `accountPeriod`. J reads those three. It does not keep a second toggle and it does not compute a week or a month. A null `accountPeriod` means the statement dates are not shown and `statement-approval` does not save.

Create-person, once E can route a party:

```javascript
const id = screen.formId || uuid();
set(K.parties, parties.concat([{ id, docType: 'party', name, createdBy: user.uid, createdAtServer: null, deviceId }]));
queueDoc(id);
```

`queueDoc` appends the outbox before it decides whether to flush (`public/render.js` lines 89-92). The demo path never reaches those two lines. A build whose `collectionFor` does not return `parties` never reaches them either.

Second design considered: put the four tabs inside `views` in `public/render.js` (1,437 lines at this SHA). Rejected. The Baghdad-date fix and the foreman-export PR both edit `render.js` and merge before F. A page the size of `foremen.js` (490 lines) inside `views` collides with both. The foremen module already hides a screen behind `install` and `onClick`.

Third design considered: sum the overview in the view. Rejected. B's `personBalance` and C's `balances` are the one fold. A second sum will drift from the statement, which is the 520,000 bug the plan already names (closing must stay 480,000 when a 40,000 settle is added).

## Files each code PR edits

Each code PR adds one flow script before `render.js`, the same pattern as `public/foremen.js` lines 1-25, and edits this shared set:

1. `public/sw.js` (`ASSETS`, `SHELL`, `VERSION`)
2. `public/index.html` (one script tag)
3. `public/session.js` (`SHELL_FILES` only, line 271)
4. `tests/shell-cache.test.js` (pins at lines 43, 65, 93, and the script order at lines 74-79)
5. `tests/webkit-upgrade.test.js` (`MARK`, line 18)
6. `package.json` (`"test"` and `"typecheck"`)
7. `.github/workflows/ci.yml` (the unit-test list, kept identical to `"test"`)
8. `docs/PSTACK_INVENTORY.md` (evidence link only; the status word stays)
9. `scripts/verify-aj.js` (dispatch only)
10. `.cursor/skills/verify-ahl-aljazeera-accounting/SKILL.md`
11. `.cursor/skills/verify-ahl-aljazeera-accounting/features/README.md`
12. `types/checkjs.d.ts` (that PR's `Window` global: `AccountWork`, `AccountPayment`, `AccountCorrect`, or `AccountStatement`). `RenderApi` stays the baf4 shape. The contract says G–J do not extend it.

That is the shared edit. The flow file, its two tests, its tsconfig, its verify-drive file, and its feature recipes are the only paths unique to that PR. This is not a new-files-only lane, and it is not parallel with B.

`VERSION` is the next free value at merge time (EA Q5). This sketch reserves no number. The date-fix answer that names v59 is the date fix's own merge, not a number G–J claim.

At baf4f21f both unit lists are 34 files and they match (`package.json` line 5 and `.github/workflows/ci.yml` line 68). Each G–J PR adds its behaviour test and its strict test to both lists. `"typecheck"` (`package.json` line 10) gains `tsc --noEmit -p tsconfig.strict-accounts-<flow>.json`. The lint job runs that script. It is not a fifth CI job. The tsconfig includes the new script and `types/checkjs.d.ts`, the same shape as F's `tsconfig.strict-accounts-view.json`.

F adds the `accounts-view.js` script tag in `index.html`. G rebases onto that tag. The `حسابات` tab itself is injected by F's `syncTab`, the same idea as `syncPeopleTab` (`public/render.js` line 1137).

### G

| File                                                                                | Change                                                                         |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `public/accounts-work.js`                                                           | New. Agreement, `laborQty`, `approveLabor`.                                    |
| `public/index.html`                                                                 | One script tag after `accounts.js` (line 71) and before `render.js` (line 72). |
| `public/sw.js`                                                                      | `ASSETS`, `SHELL`, `VERSION`.                                                  |
| `public/session.js`                                                                 | One key in `SHELL_FILES` (line 271). Nothing else in this file.                |
| `tests/accounts-work.test.js`                                                       | Behaviour tests below.                                                         |
| `tests/strict-accounts-work.test.js`                                                | New. Same shape as `tests/strict-accounts.test.js`.                            |
| `tsconfig.strict-accounts-work.json`                                                | New. Include `public/accounts-work.js` and `types/checkjs.d.ts`.               |
| `types/checkjs.d.ts`                                                                | `Window.AccountWork` only. `RenderApi` is not extended.                        |
| `package.json` `"typecheck"`                                                        | Append `tsc --noEmit -p tsconfig.strict-accounts-work.json`.                   |
| `tests/shell-cache.test.js`                                                         | Version pins and the script-order assertion (lines 74-79).                     |
| `tests/webkit-upgrade.test.js`                                                      | `MARK`.                                                                        |
| `package.json`, `.github/workflows/ci.yml`                                          | The two new test paths, both lists.                                            |
| `docs/PSTACK_INVENTORY.md`                                                          | Evidence on `feature`, `maintain-verification-skill`, `opening-a-pr`.          |
| `.cursor/skills/verify-ahl-aljazeera-accounting/SKILL.md`                           | `drive` accepts the three G ids. An unknown id still exits 3.                  |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/README.md`                 | One line per id.                                                               |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/accounts-agreement.md`     | New recipe.                                                                    |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/accounts-labor-qty.md`     | New recipe.                                                                    |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/accounts-approve-labor.md` | New recipe.                                                                    |
| `scripts/verify-aj.js`                                                              | Dispatch only. The steps live in `scripts/verify-drives/accounts-work.js`.     |

### H

Same shell, inventory, skill, and list files as G, with these names instead: `public/accounts-payment.js`, `tests/accounts-payment.test.js`, `tests/strict-accounts-payment.test.js`, `tsconfig.strict-accounts-payment.json`, `scripts/verify-drives/accounts-payment.js`, and feature files `accounts-pay-labor.md`, `accounts-advance-labor.md`, `accounts-return-advance.md`, `accounts-refund-labor.md`, `accounts-review.md`.

### I

Same pattern: `public/accounts-correct.js`, `tests/accounts-correct.test.js`, `tests/strict-accounts-correct.test.js`, `tsconfig.strict-accounts-correct.json`, `scripts/verify-drives/accounts-correct.js`, and feature files `accounts-supersede.md`, `accounts-reject.md`, `accounts-approve-deduct.md`, `accounts-deduct.md`, `accounts-reverse.md`.

### J

Same pattern: `public/accounts-statement.js`, `tests/accounts-statement.test.js`, `tests/strict-accounts-statement.test.js`, `tsconfig.strict-accounts-statement.json`, `scripts/verify-drives/accounts-statement.js`, and feature files `accounts-settle.md`, `accounts-statement.md`.

### Files the code PRs do not edit

`public/accounts.js` (B, then C, then K). `public/render.js` (F, K, the Baghdad-date fix, the foreman export). `public/ledger.js` (foreman export). `public/sync.js` (E). `public/foremen.js`, `public/app.js`, `public/firebase-client.js`. `firestore.rules`. `public/session.js` except the one `SHELL_FILES` key: not `today()` (line 94), not `uuid()` (line 85), not `closeSession` (line 319).

No new test assertion reads a helper's source text.

## Sequencing

These four run last. They depend on B, C, D deployed by Ameer, E, F, K, and the Baghdad-date fix. Plan lines 946-948 are that order. A code branch may be opened only as a draft stacked on B. It does not merge. Real G–J lanes start after F and K are merged and this contract is in both sketches.

Inside the four, the order is G, then H, then I, then J. A revert of one does not require reverting the others. They still rebase the shared files, because each of them edits that set:

- `public/sw.js` and the two pin tests, also shared with B, F, K, the date fix, and the foreman export whenever those change `public/`.
- `public/index.html`, after F's `accounts-view.js` tag.
- `public/session.js` line 271 only. The date fix edits `today()` (line 94) and merges first. E adds the K keys. Different lines, same file.
- `scripts/verify-aj.js`, `package.json`, `.github/workflows/ci.yml`, the skill files, and `types/checkjs.d.ts`.

They do not edit `public/render.js`, `public/accounts.js`, or `public/ledger.js`. That does not make them parallel with B. B shares `sw.js`, both pin tests, and the inventory, and G's tests call codes B adds (`cumulative`, amount `milestone`, `approveDeduct`, and `agreement` at `public/accounts.js` line 348 on PR #81 head `2b2356d62066e72f730d632be2802158985ac813`).

`queueDoc` (`public/render.js` lines 89-92) appends the id and skips the flush in the demo. These screens call that function. They do not add a second demo gate.

## Usage

The owner opens `#account/<partyId>` on `العقود`, `الحركات`, or `كشف الحساب`. F has painted the tab and the registry. The button is `action.button`. The form is `action.form`.

A save mints `id` with `api.uuid()` when the form opens and keeps it until the append succeeds (`public/render.js` line 40). The click disables the button for that tap, the same way `#save` does (`public/render.js` line 1235). The module then appends the document to the K list only when that id is absent, then calls `api.queueDoc(id)`, then clears the form and mints a new id. A failed `post` does not append and does not mint. A second tap, including a tap after the first success, finds the id already stored and does not append again. `queueDoc` only pushes an id (`public/render.js` lines 89-92). The append is what puts the document in the local list.

`install` receives the baf4 `RenderApi` (`types/checkjs.d.ts` lines 701-711). `get`, `set`, `uuid`, `me`, and `today` stay the session globals. `save` returns the document and does not call `queueDoc`. The action appends the doc when that id is absent, then calls the global `queueDoc`, then mints a new id. `createdAtServer` is left null. `withServerTime` already on main (`public/sync.js` line 262, called from `public/firebase-client.js` lines 250, 264, and 267) sets it at flush. A site user sees `هذه الشاشة للمالك.` (`public/render.js` line 660).

`today()` is the Baghdad civil date after the date-fix pull request. H's `txnDate` uses it. J calls `AccountsView.accountPeriod()`, which calls `Accounts.periodBounds`. Neither calls `toISOString`. At this base, `today()` is still UTC (`public/session.js` line 94). The date fix merges first.

## Types and signatures

After B, and on PR #81 head `2b2356d6`, `Accounts` exports `LaborMethod` (including `milestone`), `LaborAgreement`, `AccountDoc`, `PostInput`, `post`, and `personBalance`. At baf4f21f, `public/accounts.js` is still PR A's `post` (lines 132-148) and `LaborMethod` has no `milestone` (line 19). C then extends `personBalance` into `balances()` and adds `statementLines` and `periodBounds`. These screens call those. They do not declare a second fold or a second period function.

`AccountAction` is the contract type above: `id`, `tab`, `label`, `buttonId`, `renderForm`, `onClick`, and `save`. `buttonId` is `act-` plus the id.

```javascript
/**
 * @typedef {{
 *   kind: 'body'|'appr'|'rej'|'sup'|'stl'|'rev'|'revw',
 *   projectId: string,
 *   partyId: string,
 *   createdBy: string,
 *   createdByName?: string,
 *   createdAtDevice: number,
 *   deviceId: string,
 *   txnDate: string,
 *   currency: 'IQD',
 *   fxRate: 1
 * }} AccountHeader
 * The screen sets currency and fxRate. The form has no عملة field (section 14).
 * createdByName is set when the display name is 1 to 80 characters.
 */
```

### G, `public/accounts-work.js`

```javascript
/**
 * @param {RenderApi} api
 */
function install(api)

/**
 * '000' + agreementId with every hyphen removed + one generation character.
 * The strip is replaceAll('-', '') or replace(/-/g, ''). replace('-', '') is wrong:
 * it removes only the first hyphen. 36 characters. Generation is '1' through '9'.
 * Unit and daily bodies use uuid() instead.
 * Lock: agreementId aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee and gen '1'
 * returns 000aaaaaaaabbbbccccddddeeeeeeeeeeee1.
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
 * milestoneMode is stored as 'amount'. A percent field is not on the form.
 * Codes this function emits, and post does not:
 * `method` when the method is outside the four or more than one method group is set.
 * `percent` when milestoneMode is percent.
 * `range` when an amount is not an integer from 1 to 1e10, or unitQty is outside 1 to 1000000.
 * `description` when description is empty or longer than 500. The button stays off. No new sentence.
 * The code `agreement` is not one of these. post emits it (PR #81, public/accounts.js line 348)
 * when laborQty or approveLabor is called with no agreement object.
 */
function agreementDoc(input)

/**
 * @param {{ agreement: AgreementRow, reversalReason?: string }} input
 * @returns {{ doc: object | null, errors: string[] }}
 * id is 'rev_' + the agreement id. The row is written to agreements, not accountTxns.
 * Same fields as the agreement, plus reversesId. No reversalReason field: D's shape
 * does not add one (EA Q9 and Q28). The agreement row is not edited and not deleted.
 */
function agreementReversalDoc(input)

/**
 * @param {PostInput & AccountHeader & { agreement: LaborAgreement, gen?: string }} input
 * @returns {{ doc: object | null, errors: string[] }}
 * Calls Accounts.post('laborQty', input). Lump and amount-milestone ids are slotBodyId.
 * A uuid body on a lump or amount-milestone agreement is errors ['method'].
 * When agreements holds rev_ plus this agreement id, the result is errors ['cancelled']
 * and nothing is queued. approveLaborDoc does the same. EA س٢-ب: the server also refuses.
 * The two buttons are hidden in that case. No new sentence.
 */
function laborQtyDoc(input)

/**
 * @param {PostInput & AccountHeader} input
 * @returns {{ doc: object | null, errors: string[] }}
 * id is 'appr_' + the body id. Calls Accounts.post('approveLabor', input).
 * Stores the earned amount. A partial lump or a partial amount milestone is refused by post.
 */
function approveLaborDoc(input)
```

### H, `public/accounts-payment.js`

```javascript
/**
 * @param {'payLabor'|'advanceLabor'|'returnAdvance'|'refundLabor'} purpose
 * @param {PostInput & AccountHeader} input
 * @returns {{ doc: object | null, errors: string[] }}
 * payLabor and advanceLabor call Accounts.post('payment', { paidAs: purpose, ... }).
 * returnAdvance and refundLabor call Accounts.post with that action name.
 * One call writes one document. The form shows one purpose at a time.
 */
function cashDoc(purpose, input)

/**
 * @param {AccountHeader & { targetId: string, generation?: string }} input
 * @returns {{ doc: object | null, errors: string[] }}
 * kind 'revw', no amount, effect zeros. id is 'revw_' + the cash id, or that id plus '_'
 * and a generation character after rev_ of the previous mark. Does not call post.
 * The cash row's person and cash effects stay as they are.
 */
function reviewDoc(input)
```

The payment form shows `قبل هذه الدفعة` and the person balance from `balances()` before save. `عن عمل معتمد` is a label. It is not a `targetId`. `payLabor` does not point at approved work. A `payLabor` larger than earned work is a successful save. The person balance goes negative. The screen shows `مستحق عليه` and `المتبقي سلفة` (EA Q18). It does not write an `advanceLabor` to hold the excess. There is no confirm step.

`returnAdvance` names an `advanceLabor`. `refundLabor` names a `payLabor`. The lists show live rows only. `post` still refuses a missing or wrong-purpose target with `targetId`. The save button stays disabled while no row is chosen, so that refusal has no new sentence. A server denial uses the existing `رُفض الإرسال`.

### I, `public/accounts-correct.js`

```javascript
/**
 * @param {PostInput & AccountHeader} input
 * @returns {{ doc: object | null, errors: string[] }}
 * Calls Accounts.post('deduct', input). targetId is a live approveLabor.
 */
function deductDoc(input)

/**
 * @param {PostInput & AccountHeader} input
 * @returns {{ doc: object | null, errors: string[] }}
 * id is 'appr_' + the deduct id. Calls Accounts.post('approveDeduct', input).
 * The queued document has no amount.
 */
function approveDeductDoc(input)

/**
 * @param {AccountHeader & { targetId: string }} input
 * @returns {{ doc: object | null, errors: string[] }}
 * id is 'rej_' + the body id. The body has needsApproval, and no live appr_.
 * Slot bodies and uuid measurements and deducts can be rejected. Cash cannot.
 */
function rejectDoc(input)

/**
 * @param {AccountHeader & { supersedesId: string }} input
 * @returns {{ doc: object | null, errors: string[] }}
 * id is 'sup_' + the old id. The old row is an unapproved uuid laborQty or an unapproved deduct.
 * A slot body, a cash row, and a row that already has appr_ are refused with 'method'.
 * Depth 5 is refused with 'method'. The button is hidden at depth 4. No new sentence.
 */
function supersedeDoc(input)

/**
 * @param {AccountHeader & { reversesId: string, reversalReason: string }} input
 * @returns {{ doc: object | null, errors: string[] }}
 * id is 'rev_' + reversesId. kind 'rev', collection accountTxns.
 * The original kind must be body, sup, appr, stl, or revw. A rev_ of a rev_ is errors ['kind'].
 * Copies purpose, ledger, currency, fxRate, projectId, and partyId.
 * Copies amount only when the original has amount. Copies agreementId only when the original has agreementId.
 * approveDeduct has no amount, so the reversal omits amount.
 * reversalReason is 1 to 500 characters. Does not call post.
 */
function reversalDoc(input)
```

Agreement reversal is `agreementReversalDoc` in G, stored in `agreements`. I's `reversalDoc` is only an `accountTxns` reversal.

`نسخة جديدة` is hidden on a slot. The slot's next try is the next generation, and the screen shows `المحاولة <n> من 9` with n from 1 to 9. Generation 9 reversed or rejected ends the slot. The button to measure again is hidden. No new sentence.

### J, `public/accounts-statement.js`

```javascript
/**
 * @param {PostInput & AccountHeader & { measurementId: string, gen: string }} input
 * @returns {{ doc: object | null, errors: string[] }}
 * id is 'stl_' + measurementId + '_' + gen. gen is '1' through '9'.
 * Calls Accounts.post('settle', input). settlesId is the advanceLabor.
 * The measurement is the body whose live approveLabor the rules read.
 */
function settleDoc(input)

/**
 * @param {readonly object[]} docs
 * @param {{ periodStart: string, periodEnd: string }} period
 * @returns {boolean}
 * True when a live payLabor, advanceLabor, returnAdvance, or refundLabor in the period
 * has no live revw_. The issue button stays hidden. The live fold still paints.
 */
function hasUnreviewedCash(docs, period)

/**
 * @param {{
 *   id: string,
 *   partyId: string,
 *   projectId?: string,
 *   periodKind: 'week'|'month',
 *   periodStart: string,
 *   periodEnd: string,
 *   createdBy: string,
 *   createdAtDevice: number,
 *   deviceId: string
 * }} input
 * @returns {{ doc: object | null, errors: string[] }}
 * No reviewGen, no includedIds, no figures. projectId is omitted when readAccountScope().scope is 'all'.
 * periodStart and periodEnd come from AccountsView.accountPeriod(). This file does not store a second toggle.
 */
function statementApprovalDoc(input)
```

The statement lines and the closing number come from C's `statementLines` and `balances().net`. J does not add a second arithmetic.

## Error sentences

`post` returns the English codes from B. The screen maps a code to an Arabic sentence it already has. Each flow file holds the rows it can show. There is no shared mapper, so reverting G does not blank H.

| Code                                               | Sentence                                                                               | Where                                                                       |
| -------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `method` from `agreementDoc`                       | `طريقة الدفع لا تطابق القياس`                                                          | G. More than one method group, or a method outside the four.                |
| `percent` from `agreementDoc` or `post`            | `طريقة الدفع لا تطابق القياس`                                                          | G. The form does not offer `نسبة`.                                          |
| `lump` from `post` / `workPosition`                | `المبلغ ليس عدداً صحيحاً`                                                              | G. A typed amount is not `lumpAmount`. The form has no second box.          |
| `milestone` from `post`                            | `المبلغ ليس عدداً صحيحاً`                                                              | G. A typed amount is not `milestoneAmount`.                                 |
| `earned`                                           | `لا اعتماد بلا قياس`                                                                   | G                                                                           |
| `agreement` from `post`                            | `الاتفاق غير موجود`                                                                    | G. PR #81 `public/accounts.js` line 348. `agreementDoc` does not emit it.   |
| `description` from `agreementDoc`                  | no new sentence. The save stays off while the description is empty or longer than 500. | G                                                                           |
| `range`, `amount`, `overflow`, `inexact`           | `المبلغ ليس عدداً صحيحاً`                                                              | G, H, I, J. `inexact` is EA Q29.                                            |
| `paidAs`                                           | the purpose control stays on `عن عمل معتمد` or `سلفة عمل قادم`                         | H                                                                           |
| `cap`, `cumulative` on a `refundLabor`             | `المُرجَع أكبر من الدفعة`                                                              | H                                                                           |
| `cap`, `cumulative` on a `deduct`                  | `الخصم أكبر من العمل المعتمد`                                                          | I. Approved 2026-11-15. Outside the 88.                                     |
| `cap`, `cumulative` on `returnAdvance` or `settle` | `المُرجَع والتسوية أكبر من السلفة`                                                     | H and J. EA Q19. Outside the 88.                                            |
| `targetId`, `settlesId`                            | no new sentence. The button stays off until a live row is chosen.                      | H, I, J                                                                     |
| `cancelled`                                        | no new sentence. The work buttons stay hidden.                                         | G, after `rev_<agreementId>` is in `agreements`.                            |
| `kind`                                             | no new sentence. `عكس` stays hidden on a `rev_` row.                                   | I                                                                           |
| `review`                                           | `لا يُعتمد الكشف وفيه مبلغ غير مدقّق`                                                  | J. `hasUnreviewedCash` is true. The save returns this code and no document. |
| `ledger`                                           | the form does not send both a ledger and an explicit target                            | not shown                                                                   |

A lump or an amount milestone has no amount box on the measurement, so a partial amount is not something the owner can type. `post` still refuses it.

## Strings

The 88 in the strings file are approved (status r2.29, 2026-11-10). The tab name `حسابات` is approved. This list is only the sentences these four pull requests put on screen. F's list and overview sentences are F's. `new` means the sentence is not in `public/` at this base. `reused` means it is already on screen.

Kept, reused, not in the 88: `حفظ` (`public/render.js` line 602), `رجوع` (line 651), `هذه الشاشة للمالك.` (line 660), `لا يمكن تعديل القيد أو حذفه بعد الحفظ.` (line 603), `لم يُرسل` (line 375), `د.ع` (line 46), `عكس` (line 514), `رُفض الإرسال`, `سبب التصحيح` (`public/ledger.js` line 225), `معكوس` (`public/render.js` line 512), `الوصف` (line 710), `المبلغ المتفق عليه` (line 773).

### G, new

`عقد عمل جديد`, `تسجيل عمل منجز`, `اعتماد قياس العمل`, `طريقة الدفع`, `مبلغ مقطوع`, `بسعر الوحدة`, `باليوم`, `مرحلة`, `سعر الوحدة`, `لكل كم`, `اسم الوحدة`, `أجرة اليوم`, `قيمة المرحلة`, `مبلغ`, `بعد الحفظ لا يتغير الاتفاق إلا بقيد عكس.`, `الكمية`, `الوحدة`, `كمية منجزة`, `أيام معتمدة`, `اعتماد المرحلة`, `منجز`, `بانتظار الاعتماد`, `معتمد`, `مرفوض`, `الاتفاق غير موجود`, `طريقة الدفع لا تطابق القياس`, `المبلغ ليس عدداً صحيحاً`, `لا اعتماد بلا قياس`, `القياس معتمد مسبقاً`, `بعد الحفظ تصبح الحالة:` (string 80), `المحاولة <n> من 9` (string 88).

`الوصف` and `المبلغ المتفق عليه` are reused on the agreement form.

### H, new

`تسجيل دفعة`, `الغرض`, `عن عمل معتمد`, `سلفة عمل قادم`, `إرجاع سلفة لم تُصرف`, `استرداد نقدي من العامل`, `المُرجَع أكبر من الدفعة`, `سلفة، ليست مصروفاً.`, `السلفة ليست مصروفاً`, `قبل هذه الدفعة` (string 81), `تظهر الدفعة في الكشف` (string 82), `حتى يدقّقها المالك.` (string 83), `تدقيق` (string 84), `غير مدقّق` (string 71). `مستحق عليه` and `المتبقي سلفة` are in the 88. F shows `مستحق عليه` on the overview. H shows the pair after a `payLabor` that leaves a negative balance.

### I, new

`نسخة جديدة`, `رفض السطر`, `اعتماد`, `خصم` (string 85), `الخصم أكبر من العمل المعتمد` (the 89th, approved, not in the 88-file yet). `عكس`, `سبب التصحيح`, and `معكوس` are reused.

### J, new

`تسوية سلفة`, `إصدار كشف حساب`, `السلفة`, `المتبقي سلفة`, `حفظ التسوية`, `أسبوعي`, `شهري`, `من`, `إلى`, `رصيد أول المدة`, `الخصومات ومرتجعات المواد`, `رصيد آخر المدة`, `الكشف يُعتمد قبل أن يُقفل. الأرقام تُحسب من القيود.`, `السلف المصروفة له`, `المُرجَع من السلف نقداً`, `صافي السلف`, `سلف قائمة عليه`, `الصافي`, `المُرجَع من الدفعة نقداً`, `لا يُعتمد الكشف وفيه مبلغ غير مدقّق` (string 72).

Not in these four: the two delete sentences (strings 86 and 87), EA Q27. Not in these four: `نسبة`, `آخر معتمد`, `عملة`, and every material sentence. `المُرجَع والتسوية أكبر من السلفة` is on H and J. It is outside the 88 and is not folded into that count.

## Tests

Node tests assert a purpose, an id, an effect, or an error code. Verify drives assert the Arabic sentence, the button, and the Firestore document. `drive` of an id this helper does not know exits 3 (`scripts/verify-aj.js` lines 1308-1310). The skill file says the same at its line 67.

### G, `tests/accounts-work.test.js`

- Spec 1. Unit rate 300,000 per 4,000. Approved qty 8,000. `approveLaborDoc` amount is 600,000, effect cost +1 and person +1. The body id is a uuid.
- Spec 6. A lump of 600,000 approves 600,000. `slotBodyId('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '1')` is `000aaaaaaaabbbbccccddddeeeeeeeeeeee1`. A `replace` that strips one hyphen fails this. A second body at generation 1 is the same id.
- Spec 7. Daily rate 50,000 and 3 days earns 150,000.
- Spec 8. Amount milestone 250,000 earns 250,000. The stored `milestoneMode` is `amount`. The returned document has no percent field.
- Generation 9 is the last slot id. `المحاولة 9 من 9` is the label text the screen function returns.
- A uuid body on a lump agreement is `method`.
- `unitQty` 1000001, a product above 1e16, a negative qty, and a fractional qty are `range` or `overflow`.
- `approveLabor` with earned 0 is `earned`.
- `agreementDoc` with two method groups is `method`. `agreementDoc` with `milestoneMode: 'percent'` is `percent`. An empty description is `description`.
- `post('approveLabor')` with no agreement object is `agreement`. That is #81 line 348, not `agreementDoc`.
- Two taps of the agreement save append one `agreements` row and one outbox id. The button is disabled on the first tap.
- `agreementReversalDoc` id is `rev_` plus the agreement id, collection `agreements`, and the body has `reversesId` and no `amount` key the original lacked. After that row, `laborQtyDoc` and `approveLaborDoc` return `cancelled`.

`accounts-approve-labor` drive: sign in, open the person, save the brick agreement, save the measurement, approve it. Firestore has one `agreements` row, one `laborQty`, and one `appr_`. The person page shows `عمل معتمد` 600,000. Home المصروف is unchanged. Screenshot and `firestore.json` under that id.

### H, `tests/accounts-payment.test.js`

- Spec 11. Two `payLabor` documents, 400,000 then 200,000, after the 600,000 approval. Two ids. Person effect of each is −1.
- Spec 12. `payLabor` 700,000 after that approval. The document purpose is `payLabor`. No `advanceLabor` is created.
- `advanceLabor` 100,000. `returnAdvance` 30,000 has person +1 and cash −1. 100,001 is `cap`.
- `refundLabor` 50,000 against `payLabor` 600,000. 600,001 is `cap`. A second refund that crosses the payment is `cumulative`.
- `reviewDoc` has no amount and effect zeros. A second live `revw_` of the same cash id is refused. After `rev_` of the mark, the next id carries the generation character.
- Two taps of a `payLabor` save append one document and one outbox id.

`accounts-pay-labor` drive: the brick payment 600,000. Firestore one `payLabor`. The person net on the page is 0. `accounts-refund-labor` checks the sentence `المُرجَع أكبر من الدفعة` and that no second document was queued.

### I, `tests/accounts-correct.test.js`

- `deduct` 50,000 against the 600,000 approval. `approveDeduct` stores no amount. Its id is `appr_` plus the deduct id.
- A deduct of 600,001 is `cap`. A second live deduct that crosses the approval is `cumulative`.
- `rejectDoc` id is `rej_` plus the body id. A cash id is `method`.
- `supersedeDoc` of a uuid measurement. Depth 5 is `method`. A slot id is `method`. A `payLabor` id is `method`.
- `reversalDoc` of a `payLabor` copies `amount` and omits nothing that row has. `reversalDoc` of an `approveDeduct` omits `amount`. `reversalDoc` copies `agreementId` only when the original has it. `reversalDoc` of a `rev_` is `kind`. `reversalReason` empty is refused.
- Two taps of a deduct save append one document and one outbox id.

The 600,000 / 50,000 / 100,000 / 30,000 fixture with its `approveDeduct` is C's. I's test checks the two documents, not the closing number.

### J, `tests/accounts-statement.test.js`

- Spec 13. J calls `AccountsView.accountPeriod()`. It does not define `statementPeriod` and it does not call `Accounts.periodBounds` itself. `accountPeriod` is F's wrapper around C's `periodBounds`. A null return does not save `statement-approval`.
- `settle` of 40,000 against an advance has effect zeros. A settle above the named advance is `cap`. `returnAdvance` plus `settle` over the advance is `cumulative`.
- `statementApprovalDoc` has no `includedIds` and no figures. With `hasUnreviewedCash` true, the save returns `errors: ['review']` and no document. The screen sentence is `لا يُعتمد الكشف وفيه مبلغ غير مدقّق`.
- Spec 15. The drive reads the closing on `كشف الحساب` and the Firestore `statementApprovals` row. The closing number is C's `balances().net` for that scope. This test does not reimplement the fold.
- Two taps of `إصدار كشف حساب` append one `statementApprovals` row and one outbox id.

## Citations that moved at baf4f21f

The plan's file cites were taken at older SHAs. These are the ones this sketch would otherwise copy.

| Plan said                                                                                                                   | At baf4f21f                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Service worker `aj-p0-v56`, pins at `tests/shell-cache.test.js` lines 43, 65, 90 and `tests/webkit-upgrade.test.js` line 18 | `public/sw.js` line 1 is `aj-p0-v58`. Shell pins are lines 43, 65, and 93. WebKit `MARK` is line 18. All four say v58. `README.md` line 22 still says `aj-p0-v41`.                                                                      |
| `uuid()` at `public/session.js` line 85, demo uid at line 93                                                                | `uuid` is line 85. Line 93 is the end of `uuid`. `u-ameer` is `public/app.js` line 34 and `public/session.js` line 101.                                                                                                                 |
| `SHELL_FILES` at `public/session.js` line 263                                                                               | Line 271. It lists `accounts.js`. It does not list `foremen.js`, `people-dir.js`, or `print.css`, which `public/sw.js` lines 2 and 4 do list. These PRs do not close that gap. They add their own file the way `accounts.js` was added. |
| `render.js` form id reset at line 1177                                                                                      | The field is line 40. The reset after save is line 1258.                                                                                                                                                                                |
| `renderScreen` falls back to home at lines 1033-1034                                                                        | Line 1114.                                                                                                                                                                                                                              |
| In-page `.pills` at lines 561-562                                                                                           | Lines 544, 595, and 610.                                                                                                                                                                                                                |
| `#person` at lines 610-619                                                                                                  | `#person` is the people screen. The owner gate is line 660. It is still not a contractor page.                                                                                                                                          |
| `الدفعات` at `render.js` line 706                                                                                           | Line 754.                                                                                                                                                                                                                               |
| `المبلغ المتفق عليه` at line 725                                                                                            | Line 773.                                                                                                                                                                                                                               |
| `الوصف` at line 662                                                                                                         | Line 710.                                                                                                                                                                                                                               |
| `معكوس` at line 482                                                                                                         | Line 512.                                                                                                                                                                                                                               |
| `قيد العكس يجب أن ينسخ المبلغ` at `ledger.js` line 562                                                                      | The ledger row copies fields at line 222. The sentence with `المبلغ` is the foreman reversal at line 700.                                                                                                                               |
| `سبب التصحيح` at `ledger.js` line 401                                                                                       | Lines 225, 539, and 544.                                                                                                                                                                                                                |
| `countedEntries` at lines 298-308                                                                                           | The function starts at line 307.                                                                                                                                                                                                        |
| `shapeOk` at `firestore.rules` line 83                                                                                      | The function is line 82.                                                                                                                                                                                                                |
| `flushOutbox` keeps an unknown id at `sync.js` line 607                                                                     | Line 611.                                                                                                                                                                                                                               |
| Logout alert at `session.js` lines 310-312                                                                                  | The outbox alert is lines 330-332. Lines 326-327 are the rejected-entries alert from the v58 change. `outboxEmpty` is lines 256-269. A queued account id still blocks logout.                                                           |
| `projectCost` has no date loop                                                                                              | Lines 175-184 still contain the loop, and line 176 returns 0 while the constant is not a string. B's sketch deletes the loop. G–J do not.                                                                                               |

`queueDoc` lines 89-92, `isOwner` at `firestore.rules` line 11, `idOk` line 19, `idListOk` lines 21-24, ledger create line 156, foreman create-only lines 316-317 and 363-364, `MAX_AMOUNT_IQD` at `public/ledger.js` lines 117-118, `مستخدم غير مسموح` line 175, `المشروع غير موجود` line 179, and `مستحق له` at `public/foremen.js` lines 148 and 174 still match.

`PURPOSES` at this base (`public/accounts.js` lines 28-38) does not yet point `approveLabor` at `laborQty`. B adds that. These screens call `post`. They do not edit the table. `otherApproved` is already absent.

## Revert

`git revert` of one code pull request removes that script, its tests, and its verify ids. Firestore documents already written stay. A phone that queued an id keeps it. `collectionFor` is E's. While E is still on the phone, the queued id can still flush. `outboxEmpty` stays false until it does (`public/session.js` lines 256-269 and 330-332). This sketch does not drop queued ids. Reverting the screen does not delete the service-worker bump; the revert pull request takes the next free version again if `public/` changes.

## Dependencies

- B: `post`, the caps, `cumulative`, amount milestones, `approveDeduct` with no amount, and the `agreement` code at #81 line 348. G–J do not merge before B.
- C: `balances`, `statementLines`, `periodBounds`, the live opening, closing equals `net`.
- D: deployed rules, including `rev_<agreementId>` in `agreements` and the refusal of new work on a cancelled agreement. These screens do not change rules. A write before D is deployed becomes `syncErrors`.
- E: `collectionFor` for `agreements`, `accountTxns`, and `statementApprovals`; the K keys; the adopt path. These screens do not paint `slotLosers`. `withServerTime` is already `public/sync.js` line 262.
- F: `#accounts`, `#account/<id>`, the four tabs, `AccountActions`, the four guarded `install` calls, and `readAccountScope` / `accountPeriod`. The contract section is the list.
- K: `projectCost` on home and the project screen. G and I do not add cost themselves.
- The Baghdad-date fix: `today()` is a Baghdad date before H or J queues `txnDate`. It merges before these four.

## Risks

An agent that only opens `public/render.js` will add the form next to the subcontract warning at line 730. That warning does not block a payment. The person screens live in the new files and call `post`, which does block a cap. The subcontract sentence stays on the subcontract card.

An agent that edits `public/accounts.js` to build a slot id will collide with B, C, and K. `slotBodyId` lives in `public/accounts-work.js`.

Two owners can each queue a cash uuid. Both land. A lump slot is one id. The second create is denied, and E adopts the winner. These screens do not add a second conflict pill.

While `CONTRACTOR_COST_START` is null, a green `accounts-approve-labor` drive that expected home المصروف to become 600,000 would be wrong. The drive asserts the document and an unchanged home total.

`public-canon-diff.sh` fails when the set of files under `public/` changes. CI runs `tests/public-canon-diff.test.js`, which uses a temp repo. The code PRs do not point that script at their own base and head.

## pstack for this phase

The app is not claimed to be pstack-compliant. Arena was not run.

Plan section 16 names the inventory rows for the code pull requests. Each of G, H, I, and J updates `feature`, `maintain-verification-skill`, and `opening-a-pr`. Evidence links only. The status word stays. This docs pull request does not edit the inventory.

This sketch uses `architect` (files, types, signatures, tests, and strings before code). `principle-subtract-before-you-add` is the v1 cut in section 14, already decided. `principle-sequence-verifiable-units` is one flow file and one verify id per save, after B, C, D, E, F, K, and the date fix. `principle-make-operations-idempotent` is the append-if-absent save plus the disabled button, with one test in each of G, H, I, and J. The code PRs are what make that test pass. This docs PR does not claim the app already does it.

Plan section 16 covers Spark. A v1 create is at most 9 rule reads. These screens add no listener. The verify drives stay on the emulator and refuse a production host (`scripts/verify-aj.js` lines 1308-1310 are the unknown-id exit; the allowlist is the skill's network rule). Cost of this sketch is zero.

## Accounting advisor

Opinion only. The advisor's earlier note stands: a payment above approved work is one `payLabor` and a negative person balance, and an amount milestone is earned in full. EA Q18 closes the label: `مستحق عليه` plus `المتبقي سلفة`, with no confirm step.

The advisor's advance layout stays the one in plan section 3: advances paid minus, cash returned plus, net advances that difference. J paints that from C. It does not put a cash return under `الخصومات ومرتجعات المواد`.

## EA, closed

Nothing in this lane is still an open question. EA approved every default in `QUESTIONS-FOR-EA-r1` at 00:46 Baghdad on 2026-11-16, including Q24–Q29. The earlier file `answers-EA-delegated-0034.md` (sha256 `c14b9c8425287d9b787b28a9afae45bf25aaf8aa2a482319e1c9d63d9c91a7da`) wins where the two differ.

- Q24. The three cash saves replace the three material buttons.
- Q25. `خصم` ships inside I.
- Q19, which was this sketch's sentence question. `المُرجَع والتسوية أكبر من السلفة` is the advance-line sentence. It stays outside the 88.
- Q18. The overpayment label is `مستحق عليه` and `المتبقي سلفة`. No confirm step.
- Q26. `آخر معتمد` stays out of `PURPOSES` and off the payment form.
- Q27. The two project-delete sentences stay out of G–J.
- Q28 follows Q9 and D. `rev_<agreementId>` is a row in `agreements`, the same fields plus `reversesId`. The old agreement row is not edited. س٢-ب: after that reversal, new work and a new approval on that agreement are refused. This sketch drops the old question that put the same id in `accountTxns`.
- Q29. An inexact unit split shows `المبلغ ليس عدداً صحيحاً`. No new sentence.
- Q5. The service-worker number is the next free one at merge time. This sketch reserves none.

## Decisions this sketch does not make

Percent milestones stay out. The 88 strings and the tab name `حسابات` stay as approved. The rules change stays D's, and Ameer deploys it. The start date stays null. Q2 stays «بعدين». Merge of each code pull request waits for his go, after the Architect's review of that SHA and CI 4/4. This sketch does not merge itself. A draft stacked on B is the furthest a code branch goes before F and K are merged.
