# PLAN ONLY: contractor PRs G–J sketch

No code in this pull request. No edit to `public/`, `firestore.rules`, or `public/sw.js`. The four code pull requests come after the Architect reviews this sketch and Ameer says go.

Revision r7, on head `33fbcadf`. Revision r6, on head `b2914047`. D citations were rechecked at main `d7dc8e9b437a3bb8fc20c0bebe784d2c01f3b5c6`. Revision r5, on main `f1c5070426906e14c2e815c288c7327387115b1a`. The contract below is unchanged from r4. r3's three rulings stay: the verify id is the action id, `buttonId` is `act-` plus that id, and `syncTab` stays F's nav helper, which G–J do not call. The answers file is `answers-EA-delegated-0034.md`, sha256 `5ba855cff8b3a72b07fc4bb645a88697b1c2a869f391d7489d84134f946fe8f8`, section "Ameer answers, 2026-11-16 15:35". A person balance is one net: `مستحق له` or `مستحق عليه`. There is no `المتبقي سلفة` line, and `مستحق عليه` has no `(سلفة)`. Revision r2, against Architect NOTES on `9262d7c09040cf2597b395c352d67f17be8b0c9a` (review sha256 starts `c36dded8`). EA approved the defaults in `QUESTIONS-FOR-EA-r1` at 00:46 Baghdad on 2026-11-16.

Parent plan: `plan-contractor-module-r2.28.md`, sha256 `ef1c98d08a7118ed35469d250c81605a7f17f518d949f8446b8c63bb1869c8a2`. Status note: handoff `plan-status-r2.29.md`. Strings list: `strings-contractor-module-r2.22.md`, sha256 `9d25840a01257eb76cba6ce6323d32436bd08c471e5e49a703af9d6bb10a6d3a`. PR B's types and `post` are the ones in `contractor-pr-b-sketch-r3.md`. This sketch treats that file as what B will add. It does not re-specify B.

Arena was not run. Ameer's gate bans it (cost). Two shapes are compared below. The shape that won is four flow files and twelve one-document saves.

Base for these citations: `6f4bb1ec91660cc3b54d2db0159457d5fa0a0962`. Service worker `VERSION` is `aj-p0-v64` (`public/sw.js` line 2). A code pull request reads line numbers and the unit lists from main at its own base. This sketch does not reserve a service-worker number.

## Scope

Plan r2.28 lines 929-948. Order is A, B, C, then D merged and deployed by Ameer, then E, F, K, then G–J. G–J are the write screens. Each save queues one document. F is on this main (`public/accounts-view.js`, PR #76), including the project-delete guard. K's `projectCost` is still the stub at `public/accounts.js` lines 1031-1034, which returns 0. The code pull requests start after that stub is the real cost, and they do not drop F's guard.

v1 is the smaller cut (plan section 14). In: a labor agreement (lump, unit, daily, amount milestone), a measurement, its approval, a payment, an advance, a cash return, a labor refund, a labor deduct and its approval, a settle, a reversal, a live statement, and `statementApprovals`. IQD only. Four tabs, which F owns: `نظرة عامة`, `العقود`, `الحركات`, `كشف الحساب`.

Out of every G–J file, type, test, and string: materials, invoices, USD, attachments, the role list, milestone percent, and `otherApproved` / `آخر معتمد`. Percent stays denied (Q-percent, phase 2). `otherApproved` stays out of `PURPOSES` and off the payment form (EA Q26). The project-delete guard is F's. G–J depend on it and do not write a second one (EA Q27). Strings 86 and 87 stay F's sentences. G–J do not paint them.

`CONTRACTOR_COST_START` stays `null` (`public/accounts.js` line 11). `projectCost` (`public/accounts.js` lines 1031-1034) returns 0 and has no date loop. An approval document is still written. The home and project figures do not move while the constant is null. Plan line 946 says G–J come after K so an approval moves the project figure. That sentence is the reason these screens follow K. It is not true on screen while the constant is null, which plan section 10 already says. The drives below assert the document and the person page. They do not assert a new home total.

## The twelve saves

The plan's twelve (r2.2 onward, the Q-screens note) are the spec's nine actions plus `اعتماد`, `رفض السطر`, and `نسخة جديدة`. Three of the nine are material buttons. Section 14 removes them: `تسجيل شراء مواد`, `صرف سلفة مواد`, `تسجيل توريد مواد`. They are not in G–J.

A single `تسجيل دفعة` button that picks among four purposes hides three documents inside one revert. Plan line 946 is the twelve actions, one document each. Plan line 73 is the shared-id rule: one deterministic id is one document. `PURPOSES` already has four labor cash rows. EA Q24 counts each cash save as its own action. That replaces the three material buttons and keeps the count at twelve. `تسجيل دفعة` stays the title of the payment form.

| #   | Save                     | Document                          | Collection                  | PR  | Verify id            |
| --- | ------------------------ | --------------------------------- | --------------------------- | --- | -------------------- |
| 1   | `عقد عمل جديد`           | agreement                         | `agreements/{uuid}`         | G   | `new-agreement`      |
| 2   | `تسجيل عمل منجز`         | `laborQty` body                   | `accountTxns`               | G   | `labor-qty`          |
| 3   | `اعتماد قياس العمل`      | `approveLabor`                    | `appr_<bodyId>`             | G   | `approve-labor`      |
| 4   | `عن عمل معتمد`           | `payLabor`                        | uuid body                   | H   | `pay-labor`          |
| 5   | `سلفة عمل قادم`          | `advanceLabor`                    | uuid body                   | H   | `advance-labor`      |
| 6   | `إرجاع سلفة لم تُصرف`    | `returnAdvance`                   | uuid body                   | H   | `return-advance`     |
| 7   | `استرداد نقدي من العامل` | `refundLabor`                     | uuid body                   | H   | `refund-labor`       |
| 8   | `نسخة جديدة`             | `sup_` of an unapproved uuid body | `sup_<oldId>`               | I   | `supersede`          |
| 9   | `رفض السطر`              | `rej_`                            | `rej_<bodyId>`              | I   | `reject`             |
| 10  | `اعتماد`                 | `approveDeduct`                   | `appr_<deductId>`           | I   | `approve-deduct`     |
| 11  | `تسوية سلفة`             | `settle`                          | `stl_<bodyId>_<gen>`        | J   | `settle`             |
| 12  | `إصدار كشف حساب`         | statement approval                | `statementApprovals/{uuid}` | J   | `statement-approval` |

`خصم` writes the deduct body that save 10 approves. It is a thirteenth document. EA Q25 puts it inside I, beside `اعتماد`, and not in a fifth pull request. Its verify id is `deduct`.

Three more writes are already decided and are not members of the twelve. H's `تدقيق` writes `revw_` (Q10 أ). I's `عكس` writes `rev_<id>` (section 14, reversal). G's `cancel-agreement` writes `agreementReversalDoc` (`rev_<agreementId>` in `agreements`). Verify ids: `review-cash`, `reverse`, `cancel-agreement`. The label reuses `عكس` and `معكوس`. No new Arabic word.

The twelve, plus `deduct`, `review-cash`, `reverse`, and `cancel-agreement`, are the sixteen G–J action ids. The contract's seventeenth row is `statement-share`, reserved for S. G–J do not implement it.

Second shape, not chosen. Keep one `تسجيل دفعة` action with a purpose picker, drop the three material buttons, and ship nine actions. H is then one action. A revert of the refund takes the wage payment with it. The four purposes already differ in target, cap, and sentence, so they do not belong in one revert. Arena was not run.

Copied from main `6f4bb1ec91660cc3b54d2db0159457d5fa0a0962`, file `docs/plans/contractor-pr-f-sketch.md`, blob `a3703c4651c7e2928b5d13aa1a2940ef0b1a5925`. The slice from `## F to G-J contract` up to, and not including, `## Contract hash` is byte-identical. Its sha256 is `5b9524fc9875744245131be80a515fb3a8873d610647717cbb4d5d248199865f`.

## F to G-J contract

G–J r4 copies this section as it stands, after this r4, and records the hash below. S cites that same hash and does not edit this section. Names here do not change. F owns the registry, the module flag, and the guarded install list. G, H, I, and J do not edit `public/render.js`. S does not edit this text.

Script order: `accounts.js`, `accounts-view.js`, then `accounts-work.js`, `accounts-payment.js`, `accounts-correct.js`, `accounts-statement.js`, then the reserved `accounts-share.js`, then `render.js`. F's code PR adds only the `accounts-view.js` tag. The other new tags belong to G, H, I, J, and S. `accounts-view.js` creates the registry at load. An action script pushes only inside its `install`.

`render.js` builds `api` once. `AccountsView.install(api)` and the install list below sit outside `if (window.ForemenUI)` (`public/render.js` line 1435 at `24fb8395`). `ForemenUI.install(api)` stays inside that `if`. The accounts tab does not depend on `foremen.js`.

The list already contains `AccountShare`, so S needs no further edit of this contract to be installed. A missing global is skipped. F does not ship `AccountShare`.

```javascript
const accountInstalls = ['AccountWork', 'AccountPayment', 'AccountCorrect', 'AccountStatement', 'AccountShare'];
accountInstalls.forEach(name => {
  const mod = window[name];
  if (mod && mod.install) mod.install(api);
});
```

`api` is the object built at `public/render.js` lines 1437-1442 at `24fb8395` and passed to `ForemenUI.install`. At that SHA its members are `views`, `titles`, `state`, `render`, `esc`, `money`, `queueDoc`, `confirmShell`, `lastSyncAt`, `formatSyncTime`, and `saveCsvFiles` (`public/render.js` line 1441). `RenderApi.saveCsvFiles?` is `types/checkjs.d.ts` line 738. Two optional members are named here so S does not change this contract to receive them: `saveFiles?` and `lastSyncMillis?`. They are not on the object at `24fb8395`. `lastSyncMillis` is a function at `public/render.js` line 1048 and is not on `api` yet. F does not add those two and does not extend `RenderApi` for them. S adds them. `get`, `set`, `uuid`, `me`, and `today` stay the existing globals. F does not add them to `api`. G–J and S call those globals.

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
 * save does not call Firestore, does not append, and does not call queueDoc.
 * AccountsView.commitDoc is the one append for every save, including
 * create-person and every action. It appends the doc only when that id is
 * absent, then calls the global queueDoc once. The button is disabled from
 * the tap until save returns. The id is minted when the form opens and kept
 * until success. On errors the same id stays.
 */

/** @type {AccountAction[]} */
globalThis.AccountActions = [];
```

Each `install` pushes its own actions onto `globalThis.AccountActions` and does not replace the array. A second push of the same `id` is a no-op. Reverting one script removes its buttons. The other installs stay.

Stable action ids and tabs. The label is that PR's approved string. `buttonId` is `act-` plus the id. `statement-share` is reserved for S. F does not implement it and does not paint its label.

| id                   | tab          | module             |
| -------------------- | ------------ | ------------------ |
| `new-agreement`      | `agreements` | `AccountWork`      |
| `cancel-agreement`   | `agreements` | `AccountWork`      |
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
| `statement-share`    | `statement`  | `AccountShare`     |

`accountHtml` paints, inside the open tab only, one `<button type="button" class="btn" id="...">` per action whose `tab` equals that tab, then that action's `renderForm()`. The overview tab has no action and paints no `act-` button. F does not hardcode these labels. An empty registry paints no write button.

`AccountsView.onClick` walks `AccountActions` in order and returns on the first `onClick` that returns true. Party-create handling runs only when none of them returns true.

`AccountsView.commitDoc` is the only append. `save` does not append. Every save, including create-person and every action above, calls `commitDoc`. The button is disabled from the tap until `save` returns, so a second tap does not call `save`. `commitDoc` appends the document only when that id is absent, then calls `queueDoc` once. `queueDoc` itself is append-if-absent (`public/render.js` line 91). The id is minted when the form opens and kept until success. On errors the same id stays. Two taps store one document and one outbox id. G, H, I, J, and S do not write a second guard.

```javascript
/**
 * @param {string} id
 * @param {object} doc
 * @param {readonly object[]} rows
 * @param {(next: object[]) => void} write
 * One owner. Appends only when no row has this id, then calls queueDoc once.
 */
function commitDoc(id, doc, rows, write)
```

Scope is not view state and not a field of `AccountScreen`. One module flag, written by the project pills and the week/month pills, read by J:

```javascript
/**
 * @typedef {{
 *   scope: 'project' | 'all',
 *   projectId: string,
 *   periodKind: 'week' | 'month',
 *   anchorDate: string
 * }} AccountScopeFlag
 * projectId is '' when scope is 'all'. anchorDate is YYYY-MM-DD.
 * Default: { scope: 'all', projectId: '', periodKind: 'week', anchorDate: today() }.
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
 * Accounts.periodBounds(readAccountScope().periodKind, readAccountScope().anchorDate).
 * anchorDate defaults to today(). C's function (`contractor-pr-c-sketch.md` line 239 at `604d734`).
 * accounts-view.js does not define periodBounds. There is no statementPeriod.
 * The statement من input writes anchorDate, so last week is the same flag J reads.
 */
function accountPeriod()
```

`AccountsView` exports `readAccountScope`, `writeAccountScope`, `accountPeriod`, `modelFor`, `accountHtml`, `statementFor`, and `commitDoc`. J reads the first three. It does not keep a second toggle and it does not compute a week or a month. A null `accountPeriod` means the statement dates are not shown and `statement-approval` does not save.

`modelFor(user)` does not select a party. The caller passes `partyId` into `accountHtml(model, partyId)` or into `statementFor(user, partyId)`. Both reads are built from the full `K.accountTxns` list and `get(K.syncErrors, {})`. F does not drop rows that lack `partyId` before C's call. `accountHtml` is exported because S renders a synthetic model through it. `statementFor` returns C's `statementLines` result for that party and is the narrower read S may call. S does not call `statementLines` itself.

```javascript
/**
 * @param {{ role?: string, uid?: string }|null} user
 * @param {string} partyId
 * @returns {object}
 * C's statementLines result. Same full list and syncErrors as modelFor.
 */
function statementFor(user, partyId)
```

Create-person, once E can route a party, uses the same `commitDoc`. The id is kept on the screen until success.

```javascript
const id = screen.formId || uuid();
screen.formId = id;
const row = { id, docType: 'party', name, createdBy: user.uid, createdAtServer: null, deviceId };
commitDoc(id, row, parties, next => set(K.parties, next));
```

`queueDoc` appends the outbox before it decides whether to flush (`public/render.js` lines 89-92). The demo path never reaches `commitDoc`. A build whose `collectionFor` does not return `parties` never reaches it either.

Second design considered: put the four tabs inside `views` in `public/render.js` (1,450 lines at `24fb8395`). Rejected. The Baghdad-date fix (#82) and the foreman-export PR (#84) are already on that commit. A page the size of `foremen.js` (519 lines) inside `views` would still collide with the next lane that edits `render.js`. The foremen module already hides a screen behind `install` and `onClick`.

Third design considered: sum the overview in the view. Rejected. C's `balances` is the one fold. C replaces `personBalance`'s body with `balances(...).net`. F does not call `personBalance` and does not add a second sum. A second sum will drift from the statement, which is the 520,000 bug the plan already names (closing must stay 480,000 when a 40,000 settle is added).

## Files each code PR edits

Each code PR adds one flow script before `render.js`, the same pattern as `public/foremen.js` lines 1-25, and edits this shared set:

1. `public/sw.js` (`ASSETS`, `SHELL`, `VERSION`)
2. `public/index.html` (one script tag)
3. `public/session.js` (`SHELL_FILES` only, line 316)
4. `tests/shell-cache.test.js` (pins at lines 44, 67, and 98, and the script order at lines 71-82)
5. `tests/webkit-upgrade.test.js` (`MARK`, line 19)
6. `package.json` (`"test"` and `"typecheck"`)
7. `.github/workflows/ci.yml` (the unit-test list, kept identical to `"test"`)
8. `docs/PSTACK_INVENTORY.md` (evidence link only; the status word stays)
9. `scripts/verify-aj.js` (dispatch only)
10. `.cursor/skills/verify-ahl-aljazeera-accounting/SKILL.md`
11. `.cursor/skills/verify-ahl-aljazeera-accounting/features/README.md`
12. `types/checkjs.d.ts` (that PR's `Window` global: `AccountWork`, `AccountPayment`, `AccountCorrect`, or `AccountStatement`). `RenderApi` is `types/checkjs.d.ts` lines 734-746. The contract says G–J do not extend it. `saveFiles?` and `lastSyncMillis?` are S's.

That is the shared edit. The flow file, its two tests, its tsconfig, its verify-drive file, and its feature recipes are the only paths unique to that PR. This is not a new-files-only lane, and it is not parallel with B.

`VERSION` is the next free value at merge time (EA Q5). This sketch reserves no number. The date-fix answer that names v59 is the date fix's own merge, not a number G–J claim.

At main `6f4bb1ec` both unit lists are 39 files and they match (`package.json` line 5 and `.github/workflows/ci.yml` line 68). The 35 in L2 was the count after #83, before C, B's code, F, and the later test files. A code PR reads both lists at its own base and adds its behaviour test and its strict test to both. It does not copy 39 forward. `"typecheck"` (`package.json` line 10) gains `tsc --noEmit -p tsconfig.strict-accounts-<flow>.json`. The lint job runs that script. It is not a fifth CI job. The tsconfig includes the new script and `types/checkjs.d.ts`, the same shape as F's `tsconfig.strict-accounts-view.json`.

F adds the `accounts-view.js` script tag in `index.html` (line 72). G rebases onto that tag. `render.js` calls `AccountsView.install` at line 1466, which the contract names. `render.js` line 1164 calls `AccountsView.syncTab(user)`. `syncTab` (`public/accounts-view.js` line 506) only adds or removes the `حسابات` nav link, the same idea as `syncPeopleTab` (`public/render.js` line 867). It is not in the contract. G–J do not call `syncTab`.

### G

| File                                                                          | Change                                                                                                              |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `public/accounts-work.js`                                                     | New. Agreement, `cancel-agreement`, `laborQty`, `approveLabor`.                                                     |
| `public/index.html`                                                           | One script tag after `accounts-view.js` (line 72) and before `render.js` (line 73).                                 |
| `public/sw.js`                                                                | `ASSETS`, `SHELL`, `VERSION`.                                                                                       |
| `public/session.js`                                                           | One key in `SHELL_FILES` (line 316). Nothing else in this file.                                                     |
| `tests/accounts-work.test.js`                                                 | Behaviour tests below.                                                                                              |
| `tests/strict-accounts-work.test.js`                                          | New. Same shape as `tests/strict-accounts.test.js`.                                                                 |
| `tsconfig.strict-accounts-work.json`                                          | New. Include `public/accounts-work.js` and `types/checkjs.d.ts`.                                                    |
| `types/checkjs.d.ts`                                                          | `Window.AccountWork` only. `RenderApi` is not extended.                                                             |
| `package.json` `"typecheck"`                                                  | Append `tsc --noEmit -p tsconfig.strict-accounts-work.json`.                                                        |
| `tests/shell-cache.test.js`                                                   | Version pins and the script-order assertion (lines 71-82).                                                          |
| `tests/webkit-upgrade.test.js`                                                | `MARK`.                                                                                                             |
| `package.json`, `.github/workflows/ci.yml`                                    | The two new test paths, both lists.                                                                                 |
| `docs/PSTACK_INVENTORY.md`                                                    | Evidence on `feature`, `maintain-verification-skill`, `opening-a-pr`.                                               |
| `.cursor/skills/verify-ahl-aljazeera-accounting/SKILL.md`                     | `drive` accepts `new-agreement`, `cancel-agreement`, `labor-qty`, and `approve-labor`. An unknown id still exits 3. |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/README.md`           | One line per id.                                                                                                    |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/new-agreement.md`    | New recipe.                                                                                                         |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/cancel-agreement.md` | New recipe.                                                                                                         |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/labor-qty.md`        | New recipe.                                                                                                         |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/approve-labor.md`    | New recipe.                                                                                                         |
| `scripts/verify-aj.js`                                                        | Dispatch only. The steps live in `scripts/verify-drives/accounts-work.js`.                                          |

### H

Same shell, inventory, skill, and list files as G, with these names instead: `public/accounts-payment.js`, `tests/accounts-payment.test.js`, `tests/strict-accounts-payment.test.js`, `tsconfig.strict-accounts-payment.json`, `scripts/verify-drives/accounts-payment.js`, and feature files `pay-labor.md`, `advance-labor.md`, `return-advance.md`, `refund-labor.md`, `review-cash.md`.

### I

Same pattern: `public/accounts-correct.js`, `tests/accounts-correct.test.js`, `tests/strict-accounts-correct.test.js`, `tsconfig.strict-accounts-correct.json`, `scripts/verify-drives/accounts-correct.js`, and feature files `supersede.md`, `reject.md`, `approve-deduct.md`, `deduct.md`, `reverse.md`.

### J

Same pattern: `public/accounts-statement.js`, `tests/accounts-statement.test.js`, `tests/strict-accounts-statement.test.js`, `tsconfig.strict-accounts-statement.json`, `scripts/verify-drives/accounts-statement.js`, and feature files `settle.md`, `statement-approval.md`.

### Files the code PRs do not edit

`public/accounts.js` (B, then C, then K). `public/render.js` (F, K, the Baghdad-date fix, the foreman export). `public/ledger.js` (the foreman export and F's `personProjectDeleteBlock` at line 1109). `public/sync.js` (E). `public/foremen.js`, `public/app.js`, `public/firebase-client.js`. `firestore.rules`. `public/session.js` except the one `SHELL_FILES` key: not `today()` (line 137), not `uuid()` (line 85), not `closeSession` (line 364).

No new test assertion reads a helper's source text.

## Sequencing

These four run last. They depend on B, C, D deployed by Ameer, E, F, K, and the Baghdad-date fix. Plan lines 946-948 are that order. No G–J code pull request merges before F's project-delete guard is on main. On this main the guard is `Ledger.personProjectDeleteBlock` (`public/ledger.js` line 1109), reached from `projectDeleteBlock` (`public/render.js` line 944) and `deleteProjectNow` (line 1016). A later base that lacks that function is not a base these four merge onto. A code branch may be opened only as a draft stacked on B. It does not merge. Real G–J lanes start after K is merged and this contract is in both sketches. F is already on this main.

Inside the four, the order is G, then H, then I, then J. A revert of one does not require reverting the others. They still rebase the shared files, because each of them edits that set:

- `public/sw.js` and the two pin tests, also shared with B, F, K, the date fix, and the foreman export whenever those change `public/`.
- `public/index.html`, after F's `accounts-view.js` tag.
- `public/session.js` line 316 only. The date fix already edited `today()` (line 137). E adds the K keys. Different lines, same file.
- `scripts/verify-aj.js`, `package.json`, `.github/workflows/ci.yml`, the skill files, and `types/checkjs.d.ts`.

They do not edit `public/render.js`, `public/accounts.js`, or `public/ledger.js`. That does not make them parallel with B. B shares `sw.js`, both pin tests, and the inventory, and G's tests call codes that are on this main (`cumulative`, amount `milestone`, `approveDeduct`, and `agreement` at `public/accounts.js` line 370).

`queueDoc` (`public/render.js` lines 89-92) appends the id and skips the flush in the demo. These screens call that function. They do not add a second demo gate. G–J never call `flushRemote`. `queueDoc` passes `{ fromOutside: true }` (`public/render.js` line 92). A direct call would need that flag.

## Usage

The owner opens `#account/<partyId>` on `العقود`, `الحركات`, or `كشف الحساب`. F has painted the tab and the registry. F's `accountHtml` paints one button and that action's `renderForm()` inside the open tab. G–J never paint their own buttons. The button id is `buttonId`, which is `act-` plus the action id. `new-agreement` is the button `act-new-agreement`. `review-cash` is `act-review-cash`. `cancel-agreement` is `act-cancel-agreement`.

The form mints `id` with the global `uuid()` when it opens and keeps that id until success. `uuid` is not a member of `api`. On errors the same id stays. The button is disabled from the tap until `save` returns, so a second tap does not call `save`. That is the same idea as `#save` (`public/render.js` line 1269). `save` does not append and does not call `queueDoc`. `AccountsView.commitDoc` is the only append. It appends the document only when that id is absent, then calls `queueDoc` once. `queueDoc` is on `api` (`public/render.js` lines 1460-1465) and is append-if-absent (`public/render.js` lines 89-92). G–J do not write a second guard.

A deterministic id (`appr_`, `rej_`, `stl_`, `rev_`, `revw_`, and a slot id) is one document because `commitDoc` skips an id that is already stored. A uuid save is one document because the button stays disabled until `save` returns, and a later tap on the cleared form fails validation instead of writing a second row. A failed `post` does not append and does not mint a new id.

`install` receives the `RenderApi` at `types/checkjs.d.ts` lines 734-746. `get`, `set`, `uuid`, `me`, and `today` stay the session globals. `createdAtServer` is left null. `withServerTime` (`public/sync.js` line 262, called from `public/firebase-client.js` lines 253, 267, and 270) sets it at flush. A site user sees `هذه الشاشة للمالك.` (`public/render.js` line 672).

`today()` is the Baghdad civil date (`public/session.js` line 137). H's `txnDate` uses it. J calls `AccountsView.accountPeriod()`, which calls `Accounts.periodBounds` (`public/accounts.js` line 987). Neither calls `toISOString`.

## Types and signatures

On this main, `Accounts` exports `LaborAgreement`, `AccountDoc`, `PostInput`, `post`, `personBalance`, `rowIndex`, `rowLive`, `rowCounts`, `balances`, `statementLines`, and `periodBounds`. `milestone` is a method inside `workPosition` (`public/accounts.js` line 167). `personBalance` (line 902) returns `balances(...).net`. `rowIndex` (line 586) and `rowCounts` (line 746) are the liveness fold. A row whose id is in `syncErrors` is dead (`walkLive`, line 668). These screens call those functions. They do not declare a second fold, a second period function, or a second meaning of live.

`AccountAction` is the contract type above: `id`, `tab`, `label`, `buttonId`, `renderForm`, `onClick`, and `save`. `buttonId` is `act-` plus the id.

```javascript
/**
 * @typedef {{
 *   kind: 'body'|'appr'|'rej'|'sup'|'stl'|'rev'|'revw',
 *   projectId: string,
 *   partyId: string,
 *   createdBy: string,
 *   createdByName?: string,
 *   deviceId: string,
 *   txnDate: string,
 *   currency: 'IQD',
 *   fxRate: 1
 * }} AccountHeader
 * The screen sets currency and fxRate. The form has no عملة field (section 14).
 * That sentence is not agreementReversalDoc. Its output has no fxRate and no txnDate.
 * createdByName is set when the display name is 1 to 80 characters.
 * No createdAtDevice. Each builder also sets docType.
 * The other keys, minus docType, are a subset of D's allowlist for that kind.
 * D is docs/plans/contractor-pr-d-sketch.md on main d7dc8e9b.
 * AccountTxn is lines 147-171. StatementApproval is lines 176-187.
 * AgreementReversal is lines 113-137. Those three ranges were rechecked at that SHA.
 * The 1-500 reversalReason bound is firestore.rules lines 639-641, and D sketch line 232.
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
 * The code `agreement` is not one of these. post emits it (public/accounts.js line 370)
 * when laborQty or approveLabor is called with no agreement object.
 */
function agreementDoc(input)

/**
 * @typedef {LaborAgreement & {
 *   id: string,
 *   partyId: string,
 *   projectId: string,
 *   description: string,
 *   currency: 'IQD'
 * }} StoredAgreement
 * LaborAgreement is public/accounts.js lines 19-28: method and the method-group fields only.
 * StoredAgreement adds id, partyId, projectId, description, and currency, the row the reversal copies.
 */

/**
 * Action id cancel-agreement. Tab agreements. Module AccountWork.
 * @param {{ agreement: StoredAgreement, reversalReason: string, createdBy: string, deviceId: string }} input
 * createdBy and deviceId are the reverser's. The output has no fxRate and no txnDate.
 * @returns {{ doc: object | null, errors: string[] }}
 * id is 'rev_' + the agreement id. The row is written to agreements, not accountTxns.
 * docType is 'agreement'. Copies the original's values, not only its keys.
 * An original whose id already starts with rev_ is errors ['kind']. Nothing is queued.
 * reversalReason is 1 to 500 characters (firestore.rules lines 639-641 at d7dc8e9b,
 * agreementReversalCreate; D sketch line 232 states the same bound).
 * Lines 129 and 135 of that sketch name the key and the hasOnly rule, not the length.
 * The label reuses سبب التصحيح. No new sentence.
 * Ameer's recorded Q9 is the same fields plus reversesId. The reason is D's engineering note.
 * The agreement row is not edited and not deleted. The button label reuses عكس.
 * projectActive (firestore.rules line 626 at 29ada0bc) also covers this create.
 * It is status == 'active' (line 375). On a closed, archived, or deleted project
 * the cancel is refused. The agreement row stays, with its existing text.
 * The phone shows the existing رُفض الإرسال, or the deleted-project sentence once E's probe lands.
 * The button stays off. No new sentence.
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
 * A non-slot target on lump or amount-milestone is errors ['method'].
 * A slot target on unit or daily is errors ['method'].
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

The payment form shows `قبل هذه الدفعة` and the person balance from `balances().net` before save. `عن عمل معتمد` is a label. It is not a `targetId`. `payLabor` does not point at approved work. A `payLabor` larger than earned work is a successful save. The person balance goes negative. The screen shows `مستحق عليه` and the absolute value, with no `(سلفة)` and no `المتبقي سلفة`. It does not write an `advanceLabor` to hold the excess. There is no confirm step. Ameer, 2026-11-16 15:02 and 15:35, `answers-EA-delegated-0034.md` sha256 `5ba855cff8b3a72b07fc4bb645a88697b1c2a869f391d7489d84134f946fe8f8`, section "Ameer answers, 2026-11-16 15:35".

`returnAdvance` names an `advanceLabor`. `refundLabor` names a `payLabor`. Every target picker, every button-hide rule, and `hasUnreviewedCash` call `Accounts.rowIndex(allDocs, syncErrors)` and `Accounts.rowCounts`. `allDocs` is the whole unfiltered list. `syncErrors` is `get(K.syncErrors, {})`. A row in `syncErrors` is never offered. Q13's cap leaves a refused body in `syncErrors`. The picker does not offer it, so the next write is not a dependent the server refuses again. The screen shows the existing `رُفض الإرسال` and, when E's code defines one, E's reason string. G–J add no sentence of their own. `post` still refuses a missing or wrong-purpose target with `targetId`. The save button stays disabled while no row is chosen, so that refusal has no new sentence.

### I, `public/accounts-correct.js`

```javascript
/**
 * @param {PostInput & AccountHeader} input
 * @returns {{ doc: object | null, errors: string[] }}
 * Calls Accounts.post('deduct', input). targetId is an approveLabor that rowCounts says is live.
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
 * id is 'rej_' + the body id. The body has needsApproval, and rowCounts finds no live appr_.
 * Slot bodies and uuid measurements and deducts can be rejected. Cash cannot.
 */
function rejectDoc(input)

/**
 * @param {AccountHeader & { supersedesId: string }} input
 * @returns {{ doc: object | null, errors: string[] }}
 * id is 'sup_' + the old id. The old row is an unapproved uuid laborQty or an unapproved deduct.
 * Copies purpose, ledger, partyId, projectId, agreementId, currency, and fxRate unchanged.
 * A sup_ cannot switch agreement. A slot body, a cash row, and a row that already has appr_ are refused with 'method'.
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

`نسخة جديدة` is hidden on a slot. The slot's next try is the next generation, and the screen shows `المحاولة <n> من 9` with n from 1 to 9. That string is string 88. Generation n+1 is offered only when slot n is reversed or rejected under `rowCounts`, so the screen never offers a generation the server denies. A generation that is only in `syncErrors` is not treated as reversed or rejected. Generation 9 reversed or rejected ends the slot. The button to measure again is hidden. No new sentence.

### J, `public/accounts-statement.js`

```javascript
/**
 * @param {PostInput & AccountHeader & { measurementId: string, gen: string }} input
 * @returns {{ doc: object | null, errors: string[] }}
 * id is 'stl_' + measurementId + '_' + gen. gen is '1' through '9'.
 * Calls Accounts.post('settle', input). settlesId is the advanceLabor.
 * The measurement is the body whose approveLabor rowCounts says is live.
 */
function settleDoc(input)

/**
 * @param {readonly object[]} docs
 * @param {Readonly<Record<string, unknown>>} syncErrors
 * @param {{ periodStart: string, periodEnd: string }} period
 * @returns {boolean}
 * Builds rowIndex(docs, syncErrors) from the whole list. True when a payLabor,
 * advanceLabor, returnAdvance, or refundLabor that rowCounts says is live, in the period,
 * has no revw_ that rowCounts says is live. A row in syncErrors is not live.
 * The issue button stays hidden. The live fold still paints.
 */
function hasUnreviewedCash(docs, syncErrors, period)

/**
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
| `agreement` from `post`                            | `الاتفاق غير موجود`                                                                    | G. `public/accounts.js` line 370. `agreementDoc` does not emit it.          |
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

Kept, reused, not in the 88: `حفظ` (`public/render.js` line 614), `رجوع` (line 663), `هذه الشاشة للمالك.` (line 672), `لا يمكن تعديل القيد أو حذفه بعد الحفظ.` (line 615), `لم يُرسل` (line 375), `د.ع` (line 46), `عكس` (`public/render.js` line 526), `رُفض الإرسال`, `سبب التصحيح` (`public/ledger.js` line 225), `معكوس` (`public/render.js` line 524 and `public/accounts-view.js` line 247), `الوصف` (`public/render.js` line 722), `المبلغ المتفق عليه` (`public/render.js` line 785). `cancel-agreement` reuses `عكس` and `معكوس`. It adds no word.

### G, new

`عقد عمل جديد`, `تسجيل عمل منجز`, `اعتماد قياس العمل`, `طريقة الدفع`, `مبلغ مقطوع`, `بسعر الوحدة`, `باليوم`, `مرحلة`, `سعر الوحدة`, `لكل كم`, `اسم الوحدة`, `أجرة اليوم`, `قيمة المرحلة`, `مبلغ`, `بعد الحفظ لا يتغير الاتفاق إلا بقيد عكس.`, `الكمية`, `الوحدة`, `كمية منجزة`, `أيام معتمدة`, `اعتماد المرحلة`, `منجز`, `بانتظار الاعتماد`, `معتمد`, `مرفوض`, `الاتفاق غير موجود`, `طريقة الدفع لا تطابق القياس`, `المبلغ ليس عدداً صحيحاً`, `لا اعتماد بلا قياس`, `القياس معتمد مسبقاً`, `بعد الحفظ تصبح الحالة:` (string 80), `المحاولة <n> من 9` (string 88).

`الوصف` and `المبلغ المتفق عليه` are reused on the agreement form.

### H, new

`تسجيل دفعة`, `الغرض`, `عن عمل معتمد`, `سلفة عمل قادم`, `إرجاع سلفة لم تُصرف`, `استرداد نقدي من العامل`, `المُرجَع أكبر من الدفعة`, `سلفة، ليست مصروفاً.`, `السلفة ليست مصروفاً`, `قبل هذه الدفعة` (string 81), `تظهر الدفعة في الكشف` (string 82), `حتى يدقّقها المالك.` (string 83), `تدقيق` (string 84), `غير مدقّق` (string 71). `مستحق عليه` (string 16) and the reused `مستحق له` (inside string 87, not a string of its own) are the labels. H shows one of them from `balances().net`. A negative net is `مستحق عليه` only. `المتبقي سلفة` is not painted.

### I, new

`نسخة جديدة`, `رفض السطر`, `اعتماد`, `خصم` (string 85), `الخصم أكبر من العمل المعتمد` (the 89th, approved, not in the 88-file yet). `عكس`, `سبب التصحيح`, and `معكوس` are reused.

### J, new

`تسوية سلفة`, `إصدار كشف حساب`, `السلفة`, `حفظ التسوية`, `أسبوعي`, `شهري`, `من`, `إلى`, `رصيد أول المدة`, `الخصومات ومرتجعات المواد`, `رصيد آخر المدة`, `الكشف يُعتمد قبل أن يُقفل. الأرقام تُحسب من القيود.`, `السلف المصروفة له`, `المُرجَع من السلف نقداً`, `صافي السلف`, `سلف قائمة عليه`, `الصافي`, `المُرجَع من الدفعة نقداً`, `لا يُعتمد الكشف وفيه مبلغ غير مدقّق` (string 72). The settle form uses `سلف قائمة عليه` and `صافي السلف` from C's fold. It does not add a remaining-advance sentence. Any other wording is a question for Ameer via EA, not a default.

Not in these four: the two delete sentences (strings 86 and 87). F paints them. EA Q27 is that dependence, not a second copy. Not in these four: `نسبة`, `آخر معتمد`, `عملة`, and every material sentence. `المُرجَع والتسوية أكبر من السلفة` is on H and J. It is outside the 88 and the approved 89th (`الخصم أكبر من العمل المعتمد`). It stays pending Ameer (`STRINGS-PENDING-AMEER` row 3). H and J do not merge that sentence before his answer. No other new Arabic is added.

## Tests

Node tests assert a purpose, an id, an effect, or an error code. Verify drives assert the Arabic sentence, the button, and the Firestore document. `drive` of an id this helper does not know exits 3 (`scripts/verify-aj.js` line 1310). The skill file says the same at its line 67. Each builder test asserts that its keys, minus `docType`, are a subset of D's allowlist for that kind.

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
- `post('approveLabor')` with no agreement object is `agreement`. That is `public/accounts.js` line 370, not `agreementDoc`.
- Two taps of the agreement save append one `agreements` row and one outbox id. The button is disabled until `save` returns.
- Two taps of `approve-labor` append one `appr_` and one outbox id.
- `agreementReversalDoc` id is `rev_` plus the agreement id, collection `agreements`, `docType` is `agreement`, and the body copies the original's values. An original that is itself `rev_` is `kind`. `reversalReason` is 1 to 500 characters and the label is the reused `سبب التصحيح`. An empty reason is refused. After a real reversal, `laborQtyDoc` and `approveLaborDoc` return `cancelled`.
- Two taps of `cancel-agreement` append one `rev_<agreementId>` row in `agreements` and one outbox id.
- A `cancel-agreement` whose project is closed, archived, or deleted queues nothing. The agreement row is unchanged. The button is off. The shown sentence is the existing `رُفض الإرسال`.
- A body whose id is in `syncErrors` is not offered to `approve-labor`.
- `approveLaborDoc` refuses a non-slot target on a lump agreement and a slot target on a unit agreement.
- The builder's keys, minus `docType`, are a subset of D's allowlist. `createdAtDevice` is absent.

`approve-labor` drive: sign in, open the person, save the brick agreement, save the measurement, approve it. Firestore has one `agreements` row, one `laborQty`, and one `appr_`. The person page shows `عمل معتمد` 600,000. Home المصروف is unchanged. Screenshot and `firestore.json` under that id.

`cancel-agreement` drive: cancel that agreement, then the measurement and approval buttons are hidden, and a new `laborQty` is refused. Firestore has `rev_<agreementId>` in `agreements`. The label on screen is `عكس`.

### H, `tests/accounts-payment.test.js`

- Spec 11. Two `payLabor` documents, 400,000 then 200,000, after the 600,000 approval. Two ids. Person effect of each is −1.
- Spec 12. `payLabor` 700,000 after `approveLabor` 600,000. The document purpose is `payLabor`. No `advanceLabor` is created. The screen shows `مستحق عليه` 100,000. The HTML contains neither `المتبقي سلفة` nor `(سلفة)`. The 100,000 line contains no U+2212.
- `advanceLabor` 100,000. `returnAdvance` 30,000 has person +1 and cash −1. 100,001 is `cap`.
- `refundLabor` 50,000 against `payLabor` 600,000. 600,001 is `cap`. A second refund that crosses the payment is `cumulative`.
- `reviewDoc` has no amount and effect zeros. A second `revw_` that `rowCounts` says is live, of the same cash id, is refused. After `rev_` of the mark, the next id carries the generation character.
- Two taps of a `payLabor` save append one document and one outbox id. The second tap does not call `save`.
- A `payLabor` whose id is in `syncErrors` is not offered to `refund-labor`.

`pay-labor` drive: the brick payment 600,000. Firestore one `payLabor`. The person net on the page is 0. A second payment of 100,000 shows `مستحق عليه` 100,000, with no `المتبقي سلفة`, no `(سلفة)`, and no U+2212. `refund-labor` checks the sentence `المُرجَع أكبر من الدفعة` and that no second document was queued.

### I, `tests/accounts-correct.test.js`

- `deduct` 50,000 against the 600,000 approval. `approveDeduct` stores no amount. Its id is `appr_` plus the deduct id.
- A deduct of 600,001 is `cap`. A second deduct that `rowCounts` says is live and that crosses the approval is `cumulative`.
- A body whose id is in `syncErrors` is not offered to `reject` or `deduct`.
- `rejectDoc` id is `rej_` plus the body id. A cash id is `method`.
- `supersedeDoc` of a uuid measurement copies `purpose`, `ledger`, `partyId`, `projectId`, `agreementId`, `currency`, and `fxRate` unchanged. Depth 5 is `method`. A slot id is `method`. A `payLabor` id is `method`.
- `reversalDoc` of a `payLabor` copies `amount` and omits nothing that row has. `reversalDoc` of an `approveDeduct` omits `amount`. `reversalDoc` copies `agreementId` only when the original has it. `reversalDoc` of a `rev_` is `kind`. `reversalReason` empty is refused.
- Two taps of a deduct save append one document and one outbox id.

The 600,000 / 50,000 / 100,000 / 30,000 fixture with its `approveDeduct` is C's. I's test checks the two documents, not the closing number.

### J, `tests/accounts-statement.test.js`

- Spec 13. J calls `AccountsView.accountPeriod()`. It does not define `statementPeriod` and it does not call `Accounts.periodBounds` itself. `accountPeriod` is F's wrapper around C's `periodBounds`. A null return does not save `statement-approval`.
- `settle` of 40,000 against an advance has effect zeros. A settle above the named advance is `cap`. `returnAdvance` plus `settle` over the advance is `cumulative`.
- `statementApprovalDoc` has no `includedIds`, no figures, no `createdAtDevice`, and no `deviceId`. With `hasUnreviewedCash` true, the save returns `errors: ['review']` and no document. The screen sentence is `لا يُعتمد الكشف وفيه مبلغ غير مدقّق`.
- Spec 15. The drive reads the closing on `كشف الحساب` and the Firestore `statementApprovals` row. The closing number is C's `balances().net` for that scope. This test does not reimplement the fold.
- Two taps of `إصدار كشف حساب` append one `statementApprovals` row and one outbox id.

## Citations rechecked at main 6f4bb1ec

Every file:line in this sketch was read at `6f4bb1ec91660cc3b54d2db0159457d5fa0a0962`. A code pull request reads them again at its own base. The contract slice keeps F's own cites, including `24fb8395`, and this section does not edit that slice.

| What the older sketch cited                       | At main `6f4bb1ec`                                                                                                                                                                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Service worker version and the pin tests          | `public/sw.js` line 2 is `aj-p0-v64`. Shell pins are `tests/shell-cache.test.js` lines 44, 67, and 98. WebKit `MARK` is `tests/webkit-upgrade.test.js` line 19. `README.md` line 22 still says `aj-p0-v41`.                |
| `uuid()` and the demo uid                         | `uuid` is `public/session.js` line 85. `u-ameer` is `public/app.js` line 34 and `public/session.js` line 146.                                                                                                              |
| `SHELL_FILES`                                     | Line 316. It lists `accounts.js` and `accounts-view.js`. It still omits `foremen.js`, `people-dir.js`, and `print.css`, which `public/sw.js` lines 3 and 5 list. These PRs add their own file. They do not close that gap. |
| Form id                                           | The field is `public/render.js` line 40. `#save` disables the button at line 1269 and mints the next id at line 1292.                                                                                                      |
| `renderScreen` home fallback                      | Line 1139.                                                                                                                                                                                                                 |
| In-page `.pills`                                  | Lines 556, 607, 609, 610, and 622.                                                                                                                                                                                         |
| `#person` and the owner gate                      | `#person` is the people screen. `هذه الشاشة للمالك.` is line 672. It is still not a contractor page.                                                                                                                       |
| `الدفعات`, `المبلغ المتفق عليه`, `الوصف`, `معكوس` | Lines 766, 785, 722, and 524.                                                                                                                                                                                              |
| `قيد العكس يجب أن ينسخ المبلغ`                    | The ledger copy is `public/ledger.js` line 266. The sentence is the foreman reversal at line 700.                                                                                                                          |
| `سبب التصحيح`                                     | Lines 225, 539, and 544.                                                                                                                                                                                                   |
| `countedEntries`                                  | The function starts at line 307.                                                                                                                                                                                           |
| `shapeOk`                                         | `firestore.rules` line 82.                                                                                                                                                                                                 |
| `flushOutbox` keeps an unknown id                 | `public/sync.js` line 611, inside `flushOutbox` at line 594.                                                                                                                                                               |
| Logout                                            | `outboxEmpty` is `public/session.js` lines 301-309. The rejected-entries alert is lines 370-372. The outbox alert is lines 375-377. A queued account id still blocks logout.                                               |
| `projectCost`                                     | Lines 1031-1034 return 0. There is no date loop. `CONTRACTOR_COST_START` is line 11.                                                                                                                                       |

These still match this main: `queueDoc` at `public/render.js` lines 89-92, `isOwner` at `firestore.rules` line 11, `idOk` line 19, `idListOk` lines 21-24, ledger create line 156, foreman create-only lines 316-317 and 363-364, `MAX_AMOUNT_IQD` at `public/ledger.js` lines 117-118, `مستخدم غير مسموح` line 175, `المشروع غير موجود` line 179, and `مستحق له` at `public/foremen.js` lines 148 and 181. `Accounts.rowIndex` is `public/accounts.js` line 586. `rowCounts` is line 746. A `syncErrors` id is dead at line 668. `balances` is line 893. `statementLines` is line 942. `periodBounds` is line 987. `withServerTime` is `public/sync.js` line 262. `personProjectDeleteBlock` is `public/ledger.js` line 1109.

`PURPOSES` is `public/accounts.js` lines 69-79. `approveLabor` already points at `laborQty` (line 71). These screens call `post`. They do not edit the table. `otherApproved` is absent.

## Revert

`git revert` of one code pull request removes that script, its tests, and its verify ids. Firestore documents already written stay. A phone that queued an id keeps it. `collectionFor` is E's. While E is still on the phone, the queued id can still flush. `outboxEmpty` stays false until it does (`public/session.js` lines 301-309 and 375-377). This sketch does not drop queued ids. Reverting the screen does not delete the service-worker bump; the revert pull request takes the next free version again if `public/` changes.

## Dependencies

- B: `post`, the caps, `cumulative`, amount milestones, `approveDeduct` with no amount, and the `agreement` code at `public/accounts.js` line 370. B's code is on this main. G–J do not merge before it.
- C: `balances`, `statementLines`, `periodBounds`, `rowIndex`, and `rowCounts`. Closing equals `net`. A row in `syncErrors` is not live. C's code is on this main.
- D: deployed rules, including `rev_<agreementId>` in `agreements` and the refusal of new work on a cancelled agreement. These screens do not change rules. A write before D is deployed becomes `syncErrors`, and the pickers do not offer that row.
- E: `collectionFor` for `agreements`, `accountTxns`, and `statementApprovals`; the K keys; the adopt path. These screens do not paint `slotLosers`. `withServerTime` is `public/sync.js` line 262. G–J show `رُفض الإرسال` and do not invent E's reason sentence.
- F: `#accounts`, `#account/<id>`, the four tabs, `AccountActions`, `commitDoc`, `accountHtml`, and `readAccountScope` / `accountPeriod`. The contract section is the list. F also owns the project-delete guard. No G–J code pull request merges before that guard is on main. On this main it is `public/ledger.js` line 1109.
- K: `projectCost` on home and the project screen. The function on this main still returns 0. G and I do not add cost themselves.
- The Baghdad-date fix: `today()` is already a Baghdad date (`public/session.js` line 137). H and J use it for `txnDate`.

## Risks

An agent that only opens `public/render.js` will add the form next to the subcontract warning at line 742. That warning does not block a payment. The person screens live in the new files and call `post`, which does block a cap. The subcontract sentence stays on the subcontract card.

An agent that edits `public/accounts.js` to build a slot id will collide with B, C, and K. `slotBodyId` lives in `public/accounts-work.js`.

Two owners can each queue a cash uuid. Both land. A lump slot is one id. The second create is denied, and E adopts the winner. These screens do not add a second conflict pill.

While `CONTRACTOR_COST_START` is null, a green `approve-labor` drive that expected home المصروف to become 600,000 would be wrong. The drive asserts the document and an unchanged home total.

`public-canon-diff.sh` fails when the set of files under `public/` changes. CI runs `tests/public-canon-diff.test.js`, which uses a temp repo. The code PRs do not point that script at their own base and head.

## pstack for this phase

The app is not claimed to be pstack-compliant. Arena was not run.

Plan section 16 names the inventory rows for the code pull requests. Each of G, H, I, and J updates `feature`, `maintain-verification-skill`, and `opening-a-pr`. Evidence links only. The status word stays. This docs pull request does not edit the inventory.

This sketch uses `architect` (files, types, signatures, tests, and strings before code). `principle-subtract-before-you-add` is the v1 cut in section 14, already decided. `principle-sequence-verifiable-units` is one flow file and one verify id per save, after B, C, D, E, F, K, and the date fix. `principle-make-operations-idempotent` is the append-if-absent save plus the disabled button, with one test in each of G, H, I, and J. The code PRs are what make that test pass. This docs PR does not claim the app already does it.

Plan section 16 covers Spark. A v1 create is at most 9 rule reads. These screens add no listener. The verify drives stay on the emulator and refuse a production host (`scripts/verify-aj.js` line 1310 is the unknown-id exit; the allowlist is the skill's network rule). Cost of this sketch is zero.

## Accounting advisor

Opinion only. The advisor's earlier note stands: a payment above approved work is one `payLabor` and a negative person balance, and an amount milestone is earned in full. The label is `مستحق عليه` from `balances().net`, with no `(سلفة)` and no `المتبقي سلفة`. There is no confirm step. Ameer, 2026-11-16 15:35, section "Ameer answers, 2026-11-16 15:35" of `answers-EA-delegated-0034.md` sha256 `5ba855cff8b3a72b07fc4bb645a88697b1c2a869f391d7489d84134f946fe8f8`.

The advisor's advance layout stays the one in plan section 3: advances paid minus, cash returned plus, net advances that difference. J paints that from C. It does not put a cash return under `الخصومات ومرتجعات المواد`.

## EA, closed

EA approved every default in `QUESTIONS-FOR-EA-r1` at 00:46 Baghdad on 2026-11-16, including Q24–Q29. The answers file to cite is `answers-EA-delegated-0034.md`, sha256 `5ba855cff8b3a72b07fc4bb645a88697b1c2a869f391d7489d84134f946fe8f8`. Where that file differs from `QUESTIONS-FOR-EA-r1`, the answers file wins. Ameer's 15:02 and 15:35 answers in it are the person-balance label. One string is still pending Ameer, below.

- Q24. The three cash saves replace the three material buttons.
- Q25. `خصم` ships inside I.
- Q19, which was this sketch's sentence question. `المُرجَع والتسوية أكبر من السلفة` is the advance-line sentence. It stays outside the 88 and outside the approved 89th. It is pending Ameer. H and J do not merge it before his answer.
- Q18. The overpayment label is `مستحق عليه` only, from `balances().net`, with no `(سلفة)` and no `المتبقي سلفة`. Open advances stay in `سلف قائمة عليه`. No confirm step. Ameer, 2026-11-16 15:35, section "Ameer answers, 2026-11-16 15:35".
- Q26. `آخر معتمد` stays out of `PURPOSES` and off the payment form.
- Q27. The guard is F's. G–J depend on it. Strings 86 and 87 stay F's. G–J do not paint them and do not write a second guard. No G–J code pull request merges before that guard is on main.
- Q28 follows Q9 and D. `rev_<agreementId>` is a row in `agreements`, reached by `cancel-agreement`. Ameer's recorded words are the same fields plus `reversesId`. On main `d7dc8e9b`, `firestore.rules` lines 639-641 require `reversalReason` of 1 to 500 characters. The D sketch states that bound at line 232. Lines 129 and 135 name the key and the hasOnly rule. The screen reuses `سبب التصحيح`. The old agreement row is not edited. س٢-ب: after that reversal, new work and a new approval on that agreement are refused. This sketch drops the old question that put the same id in `accountTxns`.
- Q29. An inexact unit split shows `المبلغ ليس عدداً صحيحاً`. No new sentence.
- Q5. The service-worker number is the next free one at merge time. This sketch reserves none.

## Decisions this sketch does not make

Percent milestones stay out. The 88 strings and the tab name `حسابات` stay as approved. `المُرجَع والتسوية أكبر من السلفة` stays pending Ameer. The rules change stays D's, and Ameer deploys it. The start date stays null. Q2 stays «بعدين». Merge of each code pull request waits for his go, after the Architect's review of that SHA and CI 4/4, and only while F's project-delete guard is on that main. Each code pull request deploys only on Ameer's go, or on EA's delegated go, and only when nobody is entering data. No migration, no edit, and no delete of existing Firestore documents. This sketch does not merge itself. A draft stacked on B is the furthest a code branch goes before K is merged. F is already on this main.

## Review checklist

- Net only. A person balance is one number from `balances().net`. `مستحق له` when net is above 0. `مستحق عليه` when net is below 0, printing `-net` in Western digits, with no U+2212, no `(سلفة)`, and no `المتبقي سلفة`. Open advances stay in `سلف قائمة عليه`. This is Ameer, 2026-11-16 15:02 and 15:35, `answers-EA-delegated-0034.md` sha256 `5ba855cff8b3a72b07fc4bb645a88697b1c2a869f391d7489d84134f946fe8f8`, section "Ameer answers, 2026-11-16 15:35". It closes the FU-1 follow-up for G–J.
