# PLAN ONLY: contractor PR F sketch

No code in this pull request. No edit to `public/`, `firestore.rules`, or `public/sw.js`. The code PR comes after AgentLab Architect reviews this sketch and Ameer says go.

Parent plan: `plan-contractor-module-r2.28.md`, sha256 `ef1c98d08a7118ed35469d250c81605a7f17f518d949f8446b8c63bb1869c8a2`. Spec: `contractor-module-spec.md`. Questions: `QUESTIONS-AMEER-ar-r2.28.md`. Format reference: `contractor-pr-b-sketch-r3.md` (sha256 `bc8c9a1e93da0503e92933d5849d251599e2d0d04d0622581be70853c45dfdc2`). PR B's types and functions are what B adds. This sketch does not re-specify them.

Citations of the app are from `origin/main` `24fb839556bae41d9f721ad8f09ce61a0e0f55b5` unless a line says otherwise. That commit is the date fix (#82, v59), the foreman custody export (#84, v60), and PR B (#81, v61). C's names are from `docs/plans/contractor-pr-c-sketch.md` at `604d73466d8564e055908fcb1dcf56df0c0b0957`.

Arena was not run. Ameer's gate bans it (cost). Three shapes are compared below by hand. The chosen shape is the foremen screen module, applied to the approved v1 cut.

Revision r2, against Architect NOTES on `5ab3cb3e` (review sha256 `1110e9c617fa318d8f355b33b05ce23ddbb19eebab2fa521e31b9c17068d59d1`). This revision also keeps the milestoneMode follow-up: PR D requires the field, so every milestone this screen writes sets `milestoneMode: 'amount'`.

EA, on Ameer's delegation, approved the defaults in `QUESTIONS-FOR-EA-r1.md` (sha256 prefix `13723e6e`) at 00:52 Baghdad on 2026-11-16. Where `answers-EA-delegated-0034.md` (sha256 prefix `c14b9c84`) differs, the earlier answer wins. This lane folds in Q5, Q16–Q22, and Q47. Q18 stays «مستحق عليه».

Revision r3, against Architect NOTES on `f553b504`. H1: F owns the project-delete guard. M1 through M4, and L1 through L8, are in the sections named in the closing table. No new Arabic is treated as final. Strings that are not in the 88, and not the already approved «الخصم أكبر من العمل المعتمد», sit under strings for Ameer and are not painted.

Revision r4, against Architect NOTES on blob `9e9b97bbf9194e0f80ae17baac5852d238bd0815` (file sha256 `6c581c4da191da367ada712180d5c0fab39d59b1330934262954edb4abb08cf5`, review sha256 `961b279dec8a4705ceb1c6e430ab9263e845a284ac2876d23ab8000dda389625`). N1 is the fail-closed guard. N2 is the five statement-share rows and the contract hash. M4 is one double-tap owner for every save. L-a through L-g are in the sections below. No new Arabic is final. The statement-share plan is `plan-contractor-statement-share-r2.2.md`, sha256 `66c45a8631aa776eeb732968a3de4b9957f6ab21361cdffbe6ab88fc1c1a70bd`.

## Scope

Plan r2.28 section 13, the F row, and section 14. Order is A, B, C, then D merged and deployed by Ameer, then E, then F, then K, then G–J. This sketch does not start G–J or K.

F is the owner screen `#accounts` and the read-only person page `#account/<id>`.

- Four tabs: `نظرة عامة`, `العقود`, `الحركات`, `كشف الحساب`.
- Payments, advances, and measurements are filters on `الحركات`, not tabs.
- IQD only. No currency chooser. The string `العملة` is not on this screen.
- Owner only. A site user does not get the tab and does not see agreement amounts.
- The list can be empty. The demo `?role=owner` shows that empty state and does not put a party id in the outbox.
- Create-person exists only when E is in the same build. Until then the button is absent. The demo never shows the button. See the questions: the demo half is the recommended reading of the empty-state test, and Ameer still confirms it.
- The page reads `Accounts.balances` and `Accounts.statementLines` from C. It does not add a second fold.
- The overpayment label deferred from PR B is on this page. The words are a question for Ameer. The recommended words are the ones already approved.

Out of F. Phase 2 and the later action PRs stay out:

- Materials, invoices, USD, attachments, the role list, percent milestones, `fxRate` other than 1.
- The 16 save ids for G, H, I, and J, plus the reserved `statement-share` row for S, are in the F to G-J contract. F does not implement them. F paints a button only for an action that is already in `AccountActions`. With none registered, no write button is drawn.
- `projectCost`, home totals, the owner project spent figure, site `spent`. Those are K, and K stays gated while `CONTRACTOR_COST_START` is null.
- Rules, the adopt path, and `accounts.js`.

`#person` stays the login-user form (`public/render.js` lines 677-696, title at line 850). The new hashes are `#accounts` and `#account/<id>`.

## Files the code PR may edit

| File                                                                  | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/accounts-view.js`                                             | New module. The list, the four tabs, the filters, the live statement, and the create-person form. Same wrapper as `public/foremen.js`.                                                                                                                                                                                                                                                                                                                                                          |
| `public/render.js`                                                    | Call `AccountsView.install`, `syncTab`, and `onClick` outside `if (window.ForemenUI)` (`public/render.js` line 1435 at `24fb8395`). The guarded install list sits there too, including the reserved `AccountShare` name. `deleteConfirm` (`public/render.js` line 944) also shows the person-balance block, passing `Accounts.balances` into `personProjectDeleteBlock`. Point `#accounts` and `#account` at the accounts tab. Set the heading from the party name. No tab markup in this file. |
| `public/ledger.js`                                                    | Add `personProjectDeleteBlock(projectId, docs, parties, syncErrors, balancesFn)` next to `foremanDeleteBlock` (`public/ledger.js` line 755). Export it on the return (line 1076) and declare it on `LedgerApi`. The function does not name `Accounts`. No other edit.                                                                                                                                                                                                                           |
| `types/checkjs.d.ts`                                                  | On `Window`: `AccountActions`, `AccountAction`, `AccountScopeFlag`, `AccountWork`, `AccountPayment`, `AccountCorrect`, `AccountStatement`, the reserved `AccountShare`, and `AccountsView`. On `LedgerApi`: `personProjectDeleteBlock`. `RenderApi` stays the interface at line 727. `saveCsvFiles?` is already line 738. F does not add `saveFiles?` or `lastSyncMillis?`; S does.                                                                                                             |
| `public/index.html`                                                   | One script tag for `accounts-view.js` after `accounts.js` and before `render.js`.                                                                                                                                                                                                                                                                                                                                                                                                               |
| `public/sw.js`                                                        | Add the file to `ASSETS` and `SHELL`. `VERSION` is the next free value at merge time (Q5). At `24fb8395` it is `aj-p0-v61`. The next free number is v62 unless the receipt lane, E, or S takes it first. This file does not claim a number.                                                                                                                                                                                                                                                     |
| `public/session.js`                                                   | Add `accounts-view.js` to `SHELL_FILES` only. Add `K.parties`, `K.agreements`, or `K.accountTxns` only if E has not already added them.                                                                                                                                                                                                                                                                                                                                                         |
| `public/style.css`                                                    | No new class is expected. Reuse `.card`, `.kv`, `.pill`, `.pills`, `.note`, `.field`, `.msg`, `.btn`. Edit this file only if a row needs a class that is not already there. A comment-only edit still bumps `VERSION`. Prefer no edit.                                                                                                                                                                                                                                                          |
| `tests/accounts-view.test.js`                                         | Screen tests and the contract tests below.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `tests/person-delete.test.js`                                         | Strings 86 and 87. A rejected approval, a reversed row, and a `syncErrors` row do not block. A missing or throwing `balancesFn` blocks. A queued unsynced payable blocks. The test passes `balancesFn`. It does not set `Accounts`. `tests/project-delete.test.js` stays the project-delete file and is not this guard.                                                                                                                                                                         |
| `tests/browser-check.js`                                              | The demo empty state and the site gate.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `tests/shell-cache.test.js`                                           | Script order, the new precache name, and the three `VERSION` pins.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `tests/webkit-upgrade.test.js`                                        | `MARK` matches the same `VERSION`.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `package.json`                                                        | Append the new test file to `"test"`. Append `tsc --noEmit -p tsconfig.strict-accounts-view.json` to `"typecheck"`. CI runs that script in the `lint, format, types` job (`.github/workflows/ci.yml` line 44).                                                                                                                                                                                                                                                                                  |
| `.github/workflows/ci.yml`                                            | The same test-file string, in the same place, so the ledger job list and `package.json` `"test"` stay identical.                                                                                                                                                                                                                                                                                                                                                                                |
| `tsconfig.strict-accounts-view.json`                                  | New. Same shape as `tsconfig.strict-foremen.json`: extends `tsconfig.json`, `"strict": true`, include `public/accounts-view.js` and `types/checkjs.d.ts`.                                                                                                                                                                                                                                                                                                                                       |
| `.cursor/skills/verify-ahl-aljazeera-accounting/SKILL.md`             | Drive steps for the two new ids. An unknown id still exits 3.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/README.md`   | Two new lines.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/accounts.md` | New feature file.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/account.md`  | New feature file.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `scripts/verify-aj.js`                                                | `drive` accepts `accounts` and `account`. Every other id still throws exit 3 (`scripts/verify-aj.js` lines 1308-1310).                                                                                                                                                                                                                                                                                                                                                                          |
| `docs/PSTACK_INVENTORY.md`                                            | Evidence on the F rows named in section 16 of the plan: `principle-experience-first`, `maintain-verification-skill`. Do not flip a status word.                                                                                                                                                                                                                                                                                                                                                 |

`style.css` is listed because the screen has to land in the existing shell. The expected diff is empty.

At `24fb8395` both unit-test lists are 35 files and they match: `package.json` `"test"` and the `node --test` list in `.github/workflows/ci.yml` (ledger job). F adds `tests/accounts-view.test.js` and `tests/person-delete.test.js` to both, in the same order. The count at merge is 37, unless another file lands first, in which case both lists grow by the same files. The new `tsc --noEmit -p tsconfig.strict-accounts-view.json` runs inside `npm run typecheck`, which the `lint, format, types` job calls (`.github/workflows/ci.yml` line 44). It is not a fifth job.

## Files the code PR must not touch

`public/accounts.js`, `public/sync.js`, `public/foremen.js`, `public/people-dir.js`, `firestore.rules`, `firebase.json`, `README.md`, `tests/accounts.test.js`. `public/ledger.js` is in the edit list for `personProjectDeleteBlock` only (H1). No other function in that file changes.

`firebase.json` already sends `no-cache` for `/*.js` (`firebase.json` line 17). A new script does not need a new header.

Do not fix the stale `aj-p0-v41` sentence in `README.md` line 22. Do not add `foremen.js` or `people-dir.js` to `SHELL_FILES`. Those gaps are older than F.

`post` still returns a document. F does not call `post`. Create-person writes a party row, not an `accountTxns` row.

## Usage

An owner opens the new tab. The list reads `K.parties`. Each name is a link to `#account/<id>`. The person page passes the full `K.accountTxns` list and `get(K.syncErrors, {})` into C's `balances` and `statementLines`. C builds one `RowIndex` (`contractor-pr-c-sketch.md` lines 144-147 and 286 at `604d734`). F does not drop rows that lack `partyId` before that call. A `rej_` has no `partyId`. Dropping it first would leave an approval counted here and at 0 on a phone that kept the rejection. The party filter is C's `BalanceFilter`, applied after the index exists. The three filters hide rows. They do not recompute money.

```javascript
AccountsView.install(renderApi);
AccountsView.syncTab(user);
if (AccountsView.onClick(button)) return;
```

The four action modules install through the contract below. They do not edit `render.js`.

`install` registers `views.accounts` and `views.account` the way `ForemenUI.install` registers the foremen views (`public/foremen.js` lines 17-27). `render.js` stays the shell: hash, heading, tab highlight, click dispatch.

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

## Contract hash

The sha256 below is the UTF-8 of this file from the first character of the heading `## F to G-J contract` up to, and not including, the heading `## Contract hash`. That slice is what G–J r4 recopies. The hash line is outside the slice.

`5b9524fc9875744245131be80a515fb3a8873d610647717cbb4d5d248199865f`

## Types and signatures

All of these live in `public/accounts-view.js`. `Accounts.balances`, `Accounts.statementLines`, and `Accounts.periodBounds` stay in `public/accounts.js`, written by C. F calls them and prints what they return. It does not map the names.

```javascript
/**
 * @typedef {'overview'|'agreements'|'movements'|'statement'} AccountTab
 */

/**
 * @typedef {'all'|'payments'|'advances'|'measurements'} MovementFilter
 */

/**
 * @typedef {'week'|'month'} PeriodKind
 */

/**
 * @typedef {'project'|'all'} AccountScope
 */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   createdBy: string,
 *   createdAtServer: unknown,
 *   deviceId: string,
 *   docType: 'party'
 * }} PartyRow
 * Plan section 6. No `roles`. No balance. `note` is omitted until Ameer
 * names a label. Q21: the form is the name only, so `note` is not sent.
 * `docType` is local so
 * `collectionFor` can tell a party from a project (`public/sync.js` lines 23-31).
 * Whether the server row keeps `docType` is D's allowed-field list, not a
 * choice F makes. See Data and rules.
 */

/**
 * @typedef {{
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
 *   milestoneAmount?: number,
 *   milestoneMode?: 'amount',
 *   currency: 'IQD',
 *   reversesId?: string,
 *   reversalReason?: string
 * }} AgreementRow
 * Read-only on screen. Percent is not rendered.
 * F does not write agreements. D r3 requires `currency: 'IQD'` on the row
 * and `reversesId` plus `reversalReason` on the `rev_` row (D r3 lines 97 and 132-134, blob `f579d3c6`).
 * G's `new-agreement` sets `milestoneMode: 'amount'`
 * on every milestone it writes. PR D requires the field. F does not export
 * `writtenMilestone`. A `rev_` of an agreement (D Q2, EA Q9) is not a second card.
 * The named agreement shows once, with `معكوس` when that `rev_` is live.
 * The card word is `rowCounts` false because of that live `rev_`, not a local rule.
 * `cancel-agreement` reuses `معكوس` (`public/render.js` line 524). The button label is G's.
 */
```

F does not declare a second balance type, a second statement order, or a second `periodBounds`. It calls `Accounts.balances`, `Accounts.statementLines`, and `Accounts.periodBounds` as C specifies them in `docs/plans/contractor-pr-c-sketch.md` (PR #75). The screen prints that return value. It does not rename fields and it does not map them.

The overview reads `Balance` by C's names: `approvedLabor`, `payments`, `openAdvances`, `payable`, `recoverable`. `payable` and `recoverable` are already the split. The page does not call `max` itself. `netAdvances` is not on the overview.

The statement tab prints `statementLines(...).lines` in the order C returns, each row `label` and `amount`. F does not insert a line, drop a line, or move `openAdvances` above `closing`. A row id in `pendingIds` is listed under `بانتظار الاعتماد` and is not added into a total. A row id in `unreviewedCashIds` shows `غير مدقّق`. A row id in `overLimitIds` uses the sentence for that purpose, in Strings. Opening and closing are the numbers on C's return value, not a sum the page builds.

`modelFor` passes C's `BalanceFilter` and `StatementFilter`. It does not declare a second filter type. `periodStart` and `periodEnd` are `Accounts.periodBounds(periodKind, anchorDate)`, and `anchorDate` defaults to `today()`. A null from that function does not become a local calendar.

```javascript
/**
 * @typedef {{
 *   tab: AccountTab,
 *   filter: MovementFilter,
 *   creating: boolean,
 *   formId: string,
 *   name: string,
 *   msg: string,
 *   today: string
 * }} AccountScreen
 * Held in this module, the way `foremen.js` holds `draft`. It is not added
 * to `ScreenState` in `render.js` (`public/render.js` line 40).
 * Scope, projectId, and periodKind are not here. They are AccountScopeFlag
 * in the F to G-J contract.
 */

/**
 * @param {string} name
 * @returns {string[]}
 * Empty when the trimmed name is 1 to 80 characters. Otherwise `['name']`.
 * The screen does not paint «أدخل اسم الشخص». That sentence is under strings for Ameer.
 */
function partyErrors(name)

/**
 * @param {{ role?: string }|null|undefined} user
 * @returns {boolean}
 * False when `demoRole()` is set (`public/session.js` line 140).
 * False when `Ledger.can(user, 'owner')` is false (`public/ledger.js` lines 76-78).
 * False when `Sync.collectionFor({ id: 'x', docType: 'party', name: 'x' })`
 * is not `'parties'`. That export is `public/sync.js` line 664.
 * At baf4f21f the probe returns null (`public/sync.js` lines 23-31).
 * E is what makes it return `'parties'`. F does not edit `collectionFor`.
 */
function canCreateParty(user)

/**
 * @param {AccountModel} model
 * @returns {string}
 * The `#accounts` list. Owner gate, empty state, party links, and the
 * create form when `model.canCreate` and `model.screen.creating` are both set.
 */
function listHtml(model)

/**
 * @param {AccountModel} model
 * @param {string} partyId
 * @returns {string}
 * The `#account/<id>` page. Four tabs. The open tab comes from
 * `model.screen.tab`. Figures are C's `Balance` and `statementLines().lines`.
 * Exported. S renders a synthetic model through this function. See the contract.
 */
function accountHtml(model, partyId)

/**
 * Passes the full txn list and syncErrors into `Accounts.balances` and
 * `Accounts.statementLines`. Builds one index with `Accounts.rowIndex(allDocs, syncErrors)`
 * and passes that index to `rowCounts(row, index)`. C r2 exports `rowCounts`
 * (`contractor-pr-c-sketch.md` lines 153 and 171 at `604d734`) and no builder.
 * `rowIndex` is the C r3 name this sketch calls. C r3 is not the blob cited here.
 * If C r3 exports a different name, the code PR uses that name.
 * `accounts-view.js` does not define the builder.
 * `accountPeriod` is the only call to `Accounts.periodBounds`, with `anchorDate` (default `today()`).
 * This file does not call `personBalance`. B's loop at `public/accounts.js`
 * lines 484-507 on `24fb8395` does not skip a reversed or rejected `approveLabor`.
 * C's replacement is `balances(...).net` (`contractor-pr-c-sketch.md` lines 181-185 at `604d734`).
 * Does not select a party. Exported. See the contract.
 * @param {{ role?: string, uid?: string }|null} user
 * @returns {AccountModel}
 */
function modelFor(user)

/**
 * @param {RenderApi} next
 */
function install(next)

/**
 * @param {{ role?: string }|null|undefined} user
 * Adds or removes `a[data-tab="accounts"]`. Same owner rule as
 * `syncPeopleTab` (`public/render.js` lines 867-882).
 */
function syncTab(user)

/**
 * @param {HTMLButtonElement} button
 * @returns {boolean}
 * True when this module handled the button.
 */
function onClick(button)
```

`AccountModel` is the bag `modelFor` returns: `user`, `parties`, `agreements`, `txns`, `projects`, `figures`, `lines`, `pending`, `canCreate`, `screen`. Tests build one and call `listHtml` or `accountHtml`. They do not need a document.

`FILTERS` is the only purpose list in this file:

| Filter         | Purposes shown                                                             |
| -------------- | -------------------------------------------------------------------------- |
| `all`          | every labor purpose on this person, including `deduct` and `approveDeduct` |
| `payments`     | `payLabor`, `refundLabor`                                                  |
| `advances`     | `advanceLabor`, `returnAdvance`, `settle`                                  |
| `measurements` | `laborQty`, `approveLabor`                                                 |

A deduct has no fourth pill. Reversed rows stay in the list with `معكوس` and stay out of `figures`, because `balances` omits them. `معكوس` is printed when `rowCounts` is false because a live `rev_` names the row. That is C's rule, not a second test in this file. The view prints `figures`. It does not add a row amount into a total. A row whose id is in `syncErrors` shows `رُفض الإرسال` (`public/sync-status.js` line 12) and no status word.

`approveDeduct` stores no amount (PR B). The list shows the purpose label and no money for that row.

Slot-loser rows, when E has stored them, render in their own block, read-only, with `SyncStatus.CONFLICT` (`public/sync-status.js` line 13) and no buttons. Winner rows do not read that map. If the key is absent, the block is empty. F does not create the key. `K.linkRefusals` is the same kind of block: one existing conflict sentence, no button, and no card when the key is absent. F does not create that key either.

## Data and rules

Parties, agreements, and `accountTxns` are create-only on the server. F writes one party, and only through the path above. The local row has `id`, `name`, `createdBy`, `createdAtServer: null`, `deviceId`, and `docType: 'party'`. It has no `roles`, no `currency`, and no balance. D's party `hasOnly` list decides whether `docType` is on the server row. If that list omits `docType`, the write omits it, the same way `toRemote` keeps foremen fields and drops `docType` (`public/sync.js` lines 56-57) and the pull puts `docType` back (`public/sync.js` lines 225-226). If D's list includes `docType`, the write keeps it. F does not add a third rule. E's `toRemote` follows that same list.

One party create is 1 write and 1 rule `get` (D's `partyCreate`, one read). The page reads local caches only. E owns the pulls. That is the Spark cost for this phase (plan section 16).

`id` is `uuid()` (`public/session.js` lines 85-93), minted once when the form opens and kept until the save succeeds, same as `state.formId` (`public/render.js` line 40). Create-person calls `AccountsView.commitDoc`. A second click does not append, because the id is already in `K.parties` and the button is disabled until that save returns, same as `#save` (`public/render.js` lines 1246-1247). Two taps store one party and one outbox id.

Name is trimmed, 1 to 80 characters. Over 80 or empty: `partyErrors` returns `name`, `queueDoc` is not called.

Owner gate on the screen is `Ledger.can(user, 'owner')`, the same check the people tab uses. It does not also test `active`. The server still requires `active == true` (`firestore.rules` line 11). F does not add a second client rule.

IQD. Amounts go through `money` (`public/render.js` line 46), which uses `Ledger.fmt` (`public/ledger.js` line 451) and the suffix `د.ع`. `مستحق له` prints `Balance.payable`. `مستحق عليه` prints `Balance.recoverable`. The page does not compute either one. There is no `<select>` for currency and no `USD`.

The overview and the statement are the C calls named in Types and signatures. The week and month pills call `writeAccountScope`. Dates are `accountPeriod()`, which is `Accounts.periodBounds(periodKind, anchorDate)`, and `anchorDate` defaults to `today()`. F does not write `statementApprovals`. That save is the `statement-approval` action, painted only after `AccountStatement.install`. While `unreviewedCashIds` or `overLimitIds` names a row in the period, the page shows `لا يُعتمد الكشف وفيه مبلغ غير مدقّق` (`contractor-pr-c-sketch.md` line 372 at `604d734`, share plan line 577). Those cash rows show `غير مدقّق`.

«هذا المشروع» sets `projectId` on C's filter. «كل المشاريع» omits it. Q22: the project pills are the projects that already appear on this person's agreements or txns, not every company project. They reuse `data-proj` (`public/render.js` line 610).

Hashes use `DomSafe` (`public/dom-safe.js` lines 8 and 27). An id that fails `isSafeId` renders `معرّف غير صالح`. A safe id with no party renders `الشخص غير متاح`.

Unknown hashes still fall through to home (`public/render.js` lines 1125-1126). `#accounts` and `#account` become known because `install` adds them to `views`.

## Project delete

H1. F owns the guard. The record is `answers-EA-delegated-0034.md`, sha256 `5a1375e8524c20dab38cea82fe97796d4417893672c32533986a44cdd828e4bc`, lines 49-50, section "Project-delete guard owner, EA 01:29 (Baghdad, 2026-11-16), under Ameer's delegation". The text there is: "F (#76) owns the project-delete guard (Ameer's rule, plan Q8 أ, answered 2026-11-10: no project delete while any person's balance is not zero), with tests. E and G–J reference F's guard and must not drop it; G–J Q27 must not exclude it. No contractor PR merges before F's guard is in with tests." EA also approved the Architect's fail-closed note: refuse the delete if the balance cannot be checked.

The check is the fold on this phone (plan line 81). Rules cannot query the other rows, and account rows are append-only, so v1 does not add a counter document. A phone that has not synced can miss a balance recorded on another phone, and the block would not see it. Rows queued on this phone do count, because they are in `K.accountTxns` and not in `syncErrors`. `projectDeleteBatches` (`public/sync.js` lines 503-514) is untouched. F does not change rules.

`personProjectDeleteBlock` lives in `public/ledger.js` next to `foremanDeleteBlock` (line 755 at `24fb8395`) and is exported on the return (line 1076). `ledger.js` is a dependency-free factory. It does not name `Accounts`. In the browser `ledger.js` loads at `public/index.html` line 61, and `accounts.js` loads at line 71. `render.js` passes `window.Accounts && window.Accounts.balances`. A Node test passes its own function and does not set `Accounts`. `tsconfig.strict-ledger.json` includes `ledger.js` and `types/checkjs.d.ts` only, so the balances function is a parameter, not a free `Accounts` name. The new member is on `LedgerApi`.

The shape matches `guardedForemanDelete` (`public/ledger.js` lines 1064-1072). If `balancesFn` is missing or not a function, or the call throws, or `payable` and `recoverable` are not both numbers, the return is the person unchecked sentence and the delete does not proceed. That sentence is not `DELETE_UNCHECKED`. The custody sentence stays the foreman guard's. The person words are under strings for Ameer and are not final.

```javascript
/**
 * @param {string} projectId
 * @param {readonly object[] | null | undefined} docs
 * @param {readonly { id?: string, name?: string }[] | null | undefined} parties
 * @param {Record<string, unknown> | null | undefined} syncErrors
 * @param {Function | null | undefined} balancesFn
 * @returns {string}
 * '' when every person with a row on projectId has payable 0 and recoverable 0.
 * String 87 when payable is not 0 and recoverable is 0.
 * String 86 when recoverable is not 0 and payable is 0.
 * The person unchecked sentence when balancesFn is missing, throws, or both figures are non-zero.
 * Does not read window.Accounts. Does not call personBalance.
 * Calls balancesFn(docs, { partyId, projectId, syncErrors }) on the full docs
 * list, once per person who has a row on projectId. The party filter is C's.
 */
function personProjectDeleteBlock(projectId, docs, parties, syncErrors, balancesFn)
```

A non-zero `payable` returns string 87, with the person's name and the amount in Western digits. A non-zero `recoverable` returns string 86 the same way. C's split means one of those is zero (`contractor-pr-c-sketch.md` lines 113-114 at `604d734`; line 112 is `payableGross`). If a `balancesFn` returns both non-zero, that is not a C `Balance`, and the function returns the unchecked sentence. Zero returns `''`. People are walked in list order. The first non-zero sentence is the one shown. There is no combined sentence.

`deleteConfirm` (`public/render.js` line 944) already blocks on `foremanExpenseBlock` (line 941). When that block is empty, it shows `personProjectDeleteBlock`. A non-empty return keeps the yes button disabled. The sentence is the returned string.

`tests/person-delete.test.js` (not `tests/project-delete.test.js`, which already covers project delete):

- Net 0 returns `''`.
- `recoverable` 100,000 returns string 86 and the name.
- `payable` 100,000 returns string 87 and the name.
- `approveLabor` 600,000 plus a `rej_` of its measurement: `rowCounts` is false, so the block is `''`. Filtering that `rej_` off before the fold would block a zero balance. This test keeps the `rej_`.
- A reversed row does not block. A live `rev_` of the approval leaves the block `''`.
- An id in `syncErrors` does not block.
- A missing `balancesFn` returns the unchecked sentence. A `balancesFn` that throws returns the same sentence. The delete does not proceed.
- A payable that is only in the local doc list, and not in `syncErrors`, blocks. That is the queued unsynced row.

## Strings

Grouped by screen. `new` means the string is one of the 88 Ameer approved on 2026-11-10 at 11:16 Baghdad (Q47; the earlier answer in `c14b9c84` is the same approval) and is not yet in `public/` at `24fb8395`. The list is `strings-contractor-module-r2.23.md` (sha256 prefix `8ce56945`). Line 14 of that file records the approval. The r2.22 header (`9d25840a`) still said the approval was open. The tab `حسابات` is closed by that approval and by Q16. `reused` means the words are already on a screen at `24fb8395`. `outside` means the words are not in the 88. EA approved them on this lane. They stay listed here and are not folded into the 88.

### Tab and list

| String                  | Mark              | Where it already is, or why it is here                              |
| ----------------------- | ----------------- | ------------------------------------------------------------------- |
| `حسابات`                | approved          | The tab and the `#title` on the list. Q16 and Q47.                  |
| `حسابات الأشخاص`        | new               | List heading inside the card.                                       |
| `+ شخص جديد`            | new               | The button. Absent in the demo and absent until E routes `parties`. |
| `اسم الشخص`             | new               | The create field label.                                             |
| `أدخل اسم الشخص`        | strings for Ameer | Not painted. Q17 asked for it. It is outside the 88.                |
| `لا توجد حسابات أشخاص.` | new               | Empty list.                                                         |
| `الشخص غير متاح`        | new               | Safe id, no row.                                                    |
| `هذه الشاشة للمالك.`    | reused            | `public/render.js` lines 672 and 679. Site user.                    |
| `معرّف غير صالح`        | reused            | `public/render.js` line 680.                                        |
| `رجوع`                  | reused            | Already a kept string. Back to the list.                            |
| `حفظ`                   | reused            | The create button, only when the form is open.                      |

### Tabs and filters

| String         | Mark                                                                           |
| -------------- | ------------------------------------------------------------------------------ |
| `نظرة عامة`    | new                                                                            |
| `العقود`       | new. The shorter v1 name. The page does not say `عقود العمل`.                  |
| `الحركات`      | new                                                                            |
| `كشف الحساب`   | new                                                                            |
| `الدفعات`      | reused. `public/render.js` line 766. Filter, not a tab.                        |
| `السلف`        | reused. `public/foremen.js` line 157. Filter, not a tab.                       |
| `قياسات العمل` | strings for Ameer. The filter id is `measurements`. The Arabic is not painted. |

The page does not say `حركات المواد`, `المرفقات`, `الأدوار`, or any role name.

### Overview

| String           | Mark                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `هذا المشروع`    | new                                                                                             |
| `كل المشاريع`    | new                                                                                             |
| `عمل معتمد`      | new                                                                                             |
| `مدفوع للعمل`    | new                                                                                             |
| `سلف قائمة عليه` | new. The overview uses this, not the shorter `سلف قائمة`.                                       |
| `مستحق له`       | reused. `public/foremen.js` lines 148 and 181. Line 174 is the owner gate.                      |
| `مستحق عليه`     | new. Q9 closed on this word.                                                                    |
| `المتبقي سلفة`   | new. Q18. Shown with `مستحق عليه` when `Balance.recoverable` is not 0. No new advisor sentence. |

Do not reuse `مستحق للخلفة` or `المتبقي معه` (`public/foremen.js` lines 149, 189, and 191).

### Project delete

Strings 86 and 87. Mark `new`. They are in the 88, approved, `strings-contractor-module-r2.23.md` lines 112-113. `<الاسم>` is the person's name. `<المبلغ>` is the amount in Western digits. The words themselves are the table under strings for Ameer. This section does not restate them as a new final sentence. The person unchecked sentence is not one of these two. It is under strings for Ameer and is not final.

### Contracts

Method labels, new, read from the agreement: `مبلغ مقطوع`, `بسعر الوحدة`, `باليوم`, `مرحلة`. `مرحلة` here is the amount milestone. The page does not say `نسبة`.

| String               | Mark                                 |
| -------------------- | ------------------------------------ |
| `الوصف`              | reused. `public/render.js` line 722. |
| `المبلغ المتفق عليه` | reused. `public/render.js` line 785. |
| `لا توجد عقود.`      | reused. `public/render.js` line 85.  |
| `د.ع`                | reused, via `money`.                 |

`العملة`, `دولار`, and `سعر الدولار` are not on the form. There is no form. The agreement button `عقد عمل جديد` is G.

### Movements

| String                                | Mark                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `بانتظار الاعتماد`                    | new. Unapproved `laborQty` or `deduct`.                                      |
| `معتمد`                               | new. Only when `rowCounts` is true. A rejected approval is not this word.    |
| `مرفوض`                               | new. `rowCounts` is false and a live `rej_` names the row.                   |
| `معكوس`                               | reused. `public/render.js` line 524 at `24fb8395`.                           |
| `غير مدقّق`                           | new. Q10 closed. Cash row with no live `revw_`.                              |
| `لم يُرسل`                            | reused. The row id is in the outbox.                                         |
| `لا يوجد`                             | reused. `public/render.js` line 571. Empty filter.                           |
| `المُرجَع أكبر من الدفعة`             | new. Approved. `overLimit` on `payLabor` or `refundLabor`.                   |
| `الخصم أكبر من العمل المعتمد`         | outside the 88. Approved 2026-11-15 23:22 via EA. Q17 keeps the page string. |
| `المُرجَع والتسوية أكبر من السلفة`    | strings for Ameer. Not painted. Outside the 88.                              |
| `القيد موجود على الخادم بمحتوى مختلف` | reused. `SyncStatus.CONFLICT`. Slot-loser block.                             |

No `اعتماد`, `رفض السطر`, `عكس`, or `نسخة جديدة` button. Q20: the create button is absent in the demo.

### Statement

These labels are in the 88 (Q47). The page prints whichever of them C's `statementLines().lines` returns, in C's order. F does not reorder them.

`أسبوعي`, `شهري`, `من`, `إلى`, `رصيد أول المدة`, `عمل معتمد`, `مدفوع للعمل`, `السلف المصروفة له`, `المُرجَع من السلف نقداً`, `صافي السلف`, `سلف قائمة عليه`, `الخصومات ومرتجعات المواد`, `تسوية سلفة`, `المُرجَع من الدفعة نقداً`, `رصيد آخر المدة`, `الصافي`, `الكشف يُعتمد قبل أن يُقفل. الأرقام تُحسب من القيود.`, `لا يُعتمد الكشف وفيه مبلغ غير مدقّق`.

C's L5 is C's open item: the same words, `عمل معتمد` and `مدفوع للعمل`, are two numbers, the overview field and the statement line (`contractor-pr-c-sketch.md` lines 356-357 and 267-268 at `604d734`). It is not in `STRINGS-PENDING-AMEER.md` (sha256 prefix `64e4b480`). F does not add it there. F prints C's `label`. It does not pick a second wording.

Not on this page: `فرق سعر الصرف`, `لا مرفقات في هذه النسخة.`, `إصدار كشف حساب`, `اعتماد` as a button, `حفظ التسوية`. Those waits are G–J or phase 2.

## Tests

`tests/accounts-view.test.js`. Each test asserts an Arabic string or a number C returned for the fixture. None asserts a helper's source text, and none restates C's line order. The figure tests call the real `Accounts.balances` and `Accounts.statementLines` once C is on the branch. A rendered closing that disagrees with `statementLines().closing` fails.

Fixtures from the plan:

- Spec 12 / the brick screen. `approveLabor` 600,000 and `payLabor` 600,000. Overview shows `عمل معتمد` 600,000, `مدفوع للعمل` 600,000, `مستحق له` 0, `مستحق عليه` 0.
- Partial, spec 11. The same approval and `payLabor` 200,000. `مستحق له` 400,000. `مستحق عليه` 0.
- Overpayment. `payLabor` 700,000 after `approveLabor` 600,000. `مستحق عليه` 100,000. The HTML has one `payLabor` row and no `advanceLabor` row. The 100,000 line does not contain U+2212.
- Statement. Approval 600,000, deduct 50,000, `approveDeduct` of that deduct, advance 100,000, return 30,000. The rendered lines equal `statementLines().lines` in that order. The closing text is the digits 480,000, and that is `statementLines().closing` on this fixture (C line 321 at `604d734`).
- Same rows plus `settle` 40,000. The closing text still equals C's closing. The HTML does not contain 520,000.
- Same rows without `approveDeduct`. The deduct id is in `pendingIds` and shows `بانتظار الاعتماد`. The closing text equals C's closing.
- The statement's `من` and `إلى` equal `Accounts.periodBounds(periodKind, anchorDate)` for that same call. `anchorDate` defaults to `today()`. `accounts-view.js` does not define `periodBounds`.

Behaviour:

- Demo owner model (Q20): HTML contains `لا توجد حسابات أشخاص.` and does not contain `+ شخص جديد`. The test's `set` is not called with the outbox.
- Site model: HTML is `هذه الشاشة للمالك.` and contains no party name and no create button.
- `canCreateParty` is false when `collectionFor` returns null, and false when `demoRole()` is `owner` even if `collectionFor` returns `parties`.
- Logged-in owner and `collectionFor` returns `parties`: the button is present. Saving `حسن` queues one id, the stored row has no `roles`, and two taps store one party and one outbox id.
- Empty name and an 81-character name do not call `queueDoc`.
- `accounts-view.js` does not export `writtenMilestone`. A milestone agreement is G's `new-agreement`.
- Bad id: `معرّف غير صالح`. Unknown safe id: `الشخص غير متاح`.
- Filters. A `laborQty` is under `قياسات العمل` and not under `الدفعات`. A `payLabor` is under `الدفعات`. An `advanceLabor` is under `السلف`. A `deduct` is on `all` and on neither of those three.
- The four tab strings are present. `حركات المواد`, `المرفقات`, and `العملة` are absent. There is no `<select`.
- With `AccountActions` empty, the statement HTML has no `act-statement-approval` button. After that action is registered, the button id is `act-statement-approval`.
- An `overLimit` payment shows `المُرجَع أكبر من الدفعة`. An `overLimit` deduct shows `الخصم أكبر من العمل المعتمد`. An `overLimit` advance shows the amounts and does not show the unapproved advance sentence.
- `approveLabor` 600,000 with a live `rej_` of its measurement: the row is not `معتمد`. `rowCounts` is false (C lines 171 and 339 at `604d734`). The full list, including that `rej_`, is what the screen passed in.
- An id in `K.syncErrors` is out of the figures and out of the statement. The row shows `رُفض الإرسال` and does not show `معتمد`, `مرفوض`, or `معكوس`.
- An agreement and `rev_` of that agreement id render as one card with `معكوس`, not two cards.
- `K.linkRefusals` with one id renders `القيد موجود على الخادم بمحتوى مختلف` and no button. An absent key renders no card.
- Setting `anchorDate` to `2026-11-07` makes `من` and `إلى` equal `Accounts.periodBounds(periodKind, '2026-11-07')`. `statement-approval` reads that same `accountPeriod()`.
- Contract: `AccountActions` empty paints no `act-` button. Registering `pay-labor` paints `act-pay-labor` on `movements` only. The overview paints no `act-` button even when actions are registered. `onClick` calls that action and does not also create a party. Two taps give one doc and one outbox id, and the second tap does not call `save`. A second push of the same id is a no-op. `readAccountScope()` defaults to `{ scope: 'all', projectId: '', periodKind: 'week', anchorDate: today() }`. A tab change does not change that flag. `accountPeriod()` equals `Accounts.periodBounds(periodKind, anchorDate)` and is null when that call is null. `AccountsView.install` runs when `ForemenUI` is missing. `AccountShare.install` runs when that global is set, and is skipped when it is absent.
- A reversed payment shows `معكوس`. `مستحق له` still matches `balances` for those docs.
- The overview HTML does not contain `إجمالي المصروف`.

`tests/browser-check.js`, demo only:

- `?role=owner`, hash `#accounts`. `#main` contains `لا توجد حسابات أشخاص.`. The outbox length is unchanged. No `+ شخص جديد`.
- `?role=site`. No `a[data-tab="accounts"]`. Hash `#accounts` shows `هذه الشاشة للمالك.`

`tests/accounts.test.js` is not edited. Spec 1, 2, 6, 7, and 8 stay there.

## Screen ids and the verify skill

New ids, added with the maintain-verification skill in the code PR. This docs PR does not edit the skill. `drive` of an unknown id exits 3 (skill line 67, `scripts/verify-aj.js` lines 1308-1310).

| Id         | File                   | What the code PR drives                                                                       |
| ---------- | ---------------------- | --------------------------------------------------------------------------------------------- |
| `accounts` | `features/accounts.md` | The owner list, the empty sentence, and create-person when the button is on screen.           |
| `account`  | `features/account.md`  | The read-only person page: four tabs, three filters, the live statement, no currency control. |

`features/README.md` gains those two lines and keeps the sentence that «الأشخاص» is not in the seed (line 51). Do not claim «الأشخاص» was verified.

`accounts` sub-features: `accounts-tab`, `accounts-empty`, `accounts-create`.

`account` sub-features: `account-tabs`, `account-filters`, `account-statement`.

The drive is the emulator login, not `?role=`. The skill's launch already seeds the owner and `p-verify`. F does not add a rules-disabled party seed. The demo proof stays in `tests/browser-check.js`.

`node scripts/verify-aj.js drive accounts`, after `launch` and `doctor`:

1. Sign in if `#shell` is hidden. `#who` includes `مالك التحقق`.
2. Click `a[data-tab="accounts"]`. `#title` is the approved tab name. `#main` contains `لا توجد حسابات أشخاص.`. Screenshot `evidenceDir/accounts/empty.png`.
3. If `#party-new` is absent, stop and report that. Do not write a party from the admin client.
4. If it is present, click it, set `#party-name` to `شخص التحقق`, click `#save-party` once. Wait until `parties` has one document with that name, `createdBy` the signed-in uid, and no `roles` field. Screenshot `evidenceDir/accounts/created.png`. Write `evidenceDir/accounts/firestore.json`. Two documents, or a timeout, is a stop.

`node scripts/verify-aj.js drive account` continues in that same session, after the party exists:

1. Open the link `a[href^="#account/"]`. `#title` is `شخص التحقق`.
2. The pills `نظرة عامة`, `العقود`, `الحركات`, `كشف الحساب` are present. No currency `<select>`. `#main` does not contain `العملة`.
3. `العقود` shows `لا توجد عقود.`. Agreements are G.
4. `الحركات`, then `الدفعات`, `السلف`, and `قياسات العمل`, each shows `لا يوجد`.
5. `كشف الحساب` shows `رصيد أول المدة`, `رصيد آخر المدة`, and `0 د.ع`.
6. Reload. The URL still has `emulator=1` and no `role`. The party name is still there, still once. Firestore still has one party.
7. Screenshots `evidenceDir/account/overview.png` and `evidenceDir/account/statement.png`. The network file uses the skill's existing allowlist.

The brick numbers and the 480,000 statement are the unit fixtures. They are not this drive. G–J are what put agreements and txns on the server. Extending `drive account` with those clicks is a later PR. F does not add them.

CI runs the demo assertions through the browser job. CI does not run `drive accounts`. The code PR does not say that drive passed unless the evidence files exist.

## Sequencing

Parallel work that touches the same files, and what F does about it:

| Other work           | Files                                               | What F does                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baghdad-date fix     | `public/session.js`, `public/render.js`             | Already on `24fb8395` (#82, v59). F rebases onto that tip. F's `render.js` edit is `AccountsView.install`, `syncTab`, `onClick`, the guarded install list, `deleteConfirm`'s person block, the tab highlight (`public/render.js` lines 1151-1153), and the heading (`public/render.js` lines 1155-1166). F's `session.js` edit is `SHELL_FILES` (`public/session.js` line 316). F calls `today()`. It does not add a clock. |
| Foreman export       | `public/ledger.js`, `public/render.js`              | Already on `24fb8395` (#84, v60), including `saveCsvFiles` on `api` (`public/render.js` line 1441). F's only `ledger.js` edit is `personProjectDeleteBlock`, rebased after that export.                                                                                                                                                                                                                                     |
| PR B                 | `public/accounts.js`                                | F does not edit it. Q18 and Q19 close the label and the advance sentence that B deferred.                                                                                                                                                                                                                                                                                                                                   |
| PR C                 | `public/accounts.js`                                | F calls `balances` and `statementLines`. The code PR waits until those exist.                                                                                                                                                                                                                                                                                                                                               |
| PR E                 | `public/sync.js`, and the local keys if E adds them | F does not edit `sync.js`. The create button stays absent while `collectionFor` returns null for `docType: 'party'`.                                                                                                                                                                                                                                                                                                        |
| Other phase sketches | their own docs files                                | This PR is the one file below. It does not edit them.                                                                                                                                                                                                                                                                                                                                                                       |

Service worker (Q5). This sketch does not touch `public/sw.js`. At `24fb8395`, `VERSION` is `aj-p0-v61` (`public/sw.js` line 2). The date fix is v59, the custody export is v60, and PR B is v61. F does not claim a number. The next free number at merge is v62, unless the receipt lane, E, or S takes it first. The code PR renumbers if another PR takes that integer. The same string goes in `tests/shell-cache.test.js` lines 44, 67, and 96 and in `tests/webkit-upgrade.test.js` line 19 (`MARK`). `tests/sw-version-guard.test.js` line 31 already fails a `public/` edit that does not bump `VERSION`.

`index.html` at this SHA already loads `accounts.js` before `render.js` (lines 71-72). `SHELL` and `ASSETS` already name `accounts.js` (`public/sw.js` lines 2-4). `SHELL_FILES` already names it (`public/session.js` line 316). F adds `accounts-view.js` beside that script. It does not add `accounts.js` again.

Script order the shell test will require: `accounts.js`, then `accounts-view.js`, then `render.js`, then `app.js`. `tests/shell-cache.test.js` line 79 is the current chain and gains `accounts-view.js` between `accounts.js` and `render.js`.

## Revert

Revert the code PR with `git revert`. That does not delete Firestore parties already created.

If phones have queued a party id and E is still in the build, E can still send it. The screen is gone. The id remains until it flushes.

If E is reverted as well, `collectionFor` returns null, `flushOutbox` keeps the id (`public/sync.js` line 611), `outboxEmpty` stays false (`public/session.js` lines 301-314), and logout alerts (`public/session.js` lines 371 and 376). Recovery is to ship E and F again, or a later pull request Ameer approves that drops those specific ids. This sketch does not drop them.

A revert that touches `public/` bumps `VERSION` again, to whatever is free at that merge. This docs PR has nothing to bump.

## Dependencies

- A is on baf4f21f. `render.js` does not call `Accounts`. `accounts.js` exports `CONTRACTOR_COST_START`, `PURPOSES`, `unitPrice`, `workPosition`, `post`, `cashPointerErrors`, and `projectCost` (`public/accounts.js` line 187). It does not export `balances` or `statementLines`.
- B is on `24fb8395`. `personBalance` is `public/accounts.js` lines 484-507. Its approval loop does not skip a reversed or rejected `approveLabor`. C replaces that body with `balances(...).net`. F does not display `personBalance`. The overview prints `Balance.payable` and `Balance.recoverable` (C lines 113-114 and 128 at `604d734`). Line 112 is `payableGross`.
- C adds `balances`, `statementLines`, and `periodBounds`. F prints those return values and does not re-specify them.
- D is deployed before E. F does not edit rules. D's party `hasOnly` list is what decides the `docType` strip. Create-person on a logged-in phone needs D's party create and E's route.
- E routes `docType: 'party'` to `parties`. E's `toRemote` follows D's allowed-field list for whether `docType` is sent. The local keys `K.parties`, `K.agreements`, and `K.accountTxns` are E's if E stores rows. At baf4f21f `K` (`public/session.js` line 5) does not have them. If they are still missing when F's code PR rebases onto E, F adds the missing keys and nothing else in that object.
- `projectCost` at baf4f21f still has the date loop and returns 0 while the constant is null (`public/accounts.js` lines 175-176). B's sketch replaces that loop with `return 0`. Either way F does not call it.

## Risks

- `render.js` is the shared file. F's hunk is `AccountsView.install`, `syncTab`, `onClick`, the guarded install list, and the person block inside `deleteConfirm`, plus the tab highlight and the heading. The date fix and the foreman export are already on `24fb8395`. Growing `ScreenState` or pasting HTML into `views` brings the collision back.
- `canCreateParty` probes `collectionFor` with a tiny party. If E's route demands a field the probe omits, the button stays hidden on a build that can actually queue. The code PR matches E's required fields. It does not fork a second router.
- `Ledger.can` ignores `active`. An inactive owner who can still open the shell sees this tab, as he sees «الأشخاص» today. The server denies the create (`firestore.rules` line 11). F does not invent a stricter client check.
- Two owners mint two uuids. Both parties land. F does not dedupe names.
- The statement looks like a total the page computed. It is C's number. The 480,000 versus 520,000 test is what catches a local sum.
- The verify drive cannot show the brick fixture until G–J write rows. Shipping F does not make spec 8 pass on screen. Spec 8 on screen is K, and K is gated.
- `SHELL_FILES` omits `foremen.js` and `people-dir.js` while `sw.js` includes them. Copying that omission for `accounts-view.js` would leave the new script out of the session shell check. F adds the new name and does not sweep the old gap.

## Citations rechecked at baf4f21f

These numbers are baf4f21f. They are not the `24fb8395` default used above.

These plan sentences are still true:

- `#person` is the login profile, not a contractor (`public/render.js` lines 665-684 and 838).
- `queueDoc` does not flush in the demo (`public/render.js` lines 89-92). It does append the outbox on line 91 before that check.
- In-page tabs use `.pills` (`public/style.css` line 38). The markup is `public/render.js` lines 595, 598, and 610.
- Owner-only tabs are added in script (`syncPeopleTab` lines 855-870, `syncForemenTab` lines 886-901).
- The demo seed has a site user (`public/app.js` line 35) and no parties (`public/app.js` has no party write).
- `isOwner()` is `firestore.rules` line 11. The site role is line 12. Ledger create still allows a site user (`firestore.rules` line 156).
- Contract amounts stay off the site screen (`README.md` line 20, `public/render.js` line 182, `firestore.rules` lines 260 and 292).
- `drive` of an unknown id exits 3 (skill line 67).
- `CONTRACTOR_COST_START` is null (`public/accounts.js` line 11). While it is null, `projectCost` returns 0.

These plan sentences are not true at baf4f21f:

- Service worker `VERSION` is not `aj-p0-v56`. It is `aj-p0-v58` (`public/sw.js` line 1). The third shell pin is `tests/shell-cache.test.js` line 93, not line 90. Line 90 is the click-listener assert. `tests/webkit-upgrade.test.js` line 18 is `aj-p0-v58`.
- `public/index.html` lines 69-72 are not "the PR that adds `accounts.js`". That tag is already line 71. Lines 69-73 are `foremen.js`, `people-dir.js`, `accounts.js`, `render.js`, `app.js`.
- `SHELL_FILES` is `public/session.js` line 271, not line 263.
- Hash fallback is `public/render.js` lines 1113-1114, not 1033-1034.
- `outboxEmpty` is `public/session.js` lines 256-268, not 248-261. The logout alert is line 331, not 310-312. `deleteDb` of `aj-u-` is line 339.
- `flushOutbox` keeps an unknown id at `public/sync.js` line 611, not line 607.
- The plan's reused-string lines have moved. `الدفعات` is `public/render.js` line 754, not 706. `الوصف` is line 710, not 662. `المبلغ المتفق عليه` is line 773, not 725. `معكوس` is line 512, not 482. `مستحق له` is `public/foremen.js` lines 148 and 174, which matches the plan. `السلف` is line 157, which matches.
- C2's "screen text at `public/render.js` lines 705 and 754" does not match. Line 753 is `لا يُعدَّل صف ولا يُحذف`. Line 754 is the `الدفعات` heading. Line 705 is inside the entry detail. The rule itself is unchanged: F does not edit agreements.
- `K.parties`, `K.agreements`, and `K.accountTxns` are not on `public/session.js` line 5.
- `projectCost` is not yet `return 0` with the loop deleted. The loop is `public/accounts.js` lines 175-185. B's sketch removes it. F leaves it alone.
- `README.md` line 22 still says `aj-p0-v41`. That stale sentence is still there. F does not edit it.
- The plan's "open pull request #65" list is not a dependency of F. #72 is the commit this branch starts from.
- Plan line 89 says `public/accounts.js` is the only new module in v1. F adds `public/accounts-view.js`. That is a deliberate deviation. Architect review of `5ab3cb3e` (M1) accepts the shape. With the file come the script tag, `ASSETS`, `SHELL`, `SHELL_FILES`, the shell-cache chain, `tsconfig.strict-accounts-view.json`, the `typecheck` entry, and `tests/accounts-view.test.js`.

## Accounting advisor

Opinion only. This sketch does not ask the advisor again. PR B already recorded the opinion and Ameer's deferral of 2026-11-15 23:22 Baghdad (UTC+3) via EA.

The advisor's label for a payment larger than approved work is `مستحق على الشخص (سلفة)`. Q18 keeps `مستحق عليه` (the earlier answer in `c14b9c84` names that word) plus `المتبقي سلفة`, both inside the 88. The advisor's sentence is not added. The confirm step stays with the payment action, not on this page. One `payLabor` stays one row.

The statement layout the advisor already corrected stays the one in section 3 of the plan: advances paid minus, cash returned plus, net advances equal to that difference, deductions negative. F prints those lines from C. It does not put a cash return under `الخصومات ومرتجعات المواد`.

## أسئلة لأمير

Q16–Q22 and Q47 are closed. EA approved those defaults at 00:52 Baghdad on 2026-11-16. The person unchecked sentence, and the three screen sentences already under strings for Ameer, are not final. Strings outside the 88 stay listed there so they are not folded into that count.

| Question | Decision                                                                                                                                                             |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q5       | `VERSION` is the next free number at merge time. At `24fb8395` it is v61. The next free number is v62 unless the receipt lane, E, or S takes it. F claims no number. |
| Q16      | The tab is `حسابات`.                                                                                                                                                 |
| Q17      | The page strings stand, including `أدخل اسم الشخص`.                                                                                                                  |
| Q18      | `مستحق عليه` and `المتبقي سلفة`. No new advisor sentence. No confirm step on this page.                                                                              |
| Q19      | The sentence is under strings for Ameer. The screen does not paint it.                                                                                               |
| Q20      | The create button is absent in the demo.                                                                                                                             |
| Q21      | The create form is the name only. `note` is not sent.                                                                                                                |
| Q22      | «هذا المشروع» lists only this person's projects.                                                                                                                     |
| Q47      | The 88 stand, including `المحاولة <n> من 9`. Same approval Ameer gave on 2026-11-10 at 11:16.                                                                        |

## strings for Ameer

Not final. The three screen sentences and the person unchecked sentence are not painted and are not folded into the 88. Strings 86 and 87 are the exception: they are already in the 88. The table shows those words. It is not a new sentence and it is not a new approval.

- `أدخل اسم الشخص` (Q17). Empty name refuses the save and shows no new sentence.
- `قياسات العمل` (Q17). The filter id is `measurements`. No Arabic label until this is accepted.
- `المُرجَع والتسوية أكبر من السلفة` (Q19). An advance overrun shows the amounts only.
- `لا يمكن الحذف: تعذر التحقق من رصيد الشخص.` The person unchecked sentence. Used when `balancesFn` is missing or throws. It is not `DELETE_UNCHECKED`, whose words are the custody check. EA approved the refusal. These words are not final.

C's L5 is not in this list. It is C's open item, and it is not in `STRINGS-PENDING-AMEER.md` (sha256 prefix `64e4b480`). F does not add it.

### Project delete words

Mark `new`. In the 88, approved, `strings-contractor-module-r2.23.md` lines 112-113 (sha256 prefix `8ce56945`). `<الاسم>` is the person's name. `<المبلغ>` is the amount in Western digits, then ` د.ع`. Not a new final sentence.

| String                                                                                                        | When                                                    |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `لا يمكن الحذف: رصيد <الاسم> في هذا المشروع ليس صفراً (مستحق عليه <المبلغ> د.ع). سوِّ الحساب أو أرشف المشروع` | String 86. `recoverable` is not 0. Owed to the company. |
| `لا يمكن الحذف: رصيد <الاسم> في هذا المشروع ليس صفراً (مستحق له <المبلغ> د.ع). سوِّ الحساب أو أرشف المشروع`   | String 87. `payable` is not 0. Owed to the person.      |

`الخصم أكبر من العمل المعتمد` is the approved extra from 2026-11-15 23:22 via EA. It is painted. It is not one of the sentences above.

## pstack for the code PR

The app is not claimed to be pstack-compliant. This sketch does not mark an inventory row «مطبّقة».

Plan section 16 names the code PR's inventory rows: `principle-experience-first` and `maintain-verification-skill`.

- `principle-experience-first` is already «مطبّقة». The code PR adds an evidence link. It does not add a next step that reads as if the skill were missing. The decision the row records: the page ships the empty list, the four tabs, and the live statement, and it does not implement the 16 G–J save ids or the reserved `statement-share` row.
- `maintain-verification-skill` is «ناقصة». The code PR can add a next-step sentence. It does not flip the status word. The sentence names the two ids and the evidence directory. The status stays until a maintain pass actually drives them.

`principle-subtract-before-you-add` is the smaller v1, which Ameer already picked (section 14). F does not reopen that cut. The code PR does not flip that row either.

Skills this phase uses, from the plan and from the screen work: `architect` (this file; arena was not run), `feature` (the code PR, after this sketch is accepted), `tdd` (the tests above, written before the markup), `maintain-verification-skill` (the ids above, edited in the code PR), `principle-experience-first`, `principle-model-the-domain` (one fold, one party shape), `principle-boundary-discipline` (the view reads C's figures), `principle-minimize-reader-load` (one module; `render.js` keeps the install list and the `deleteConfirm` block).

## Decisions only Ameer can make

- Say go on this sketch before any code PR.
- Merge, later, only after Architect's review of the code SHA and CI 4/4. This sketch does not merge itself.

Already decided: Q5, Q16–Q22, and Q47, plus the tab `حسابات`, the 88 strings, IQD only, four tabs, filters on `الحركات`, owner only, create-person absent until E is in the same build, and the empty demo list. Strings outside the 88 are listed under strings for Ameer and are not renumbered into the 88. EA approved the fail-closed refusal. The person unchecked words are not final.
