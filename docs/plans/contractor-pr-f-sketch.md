# PLAN ONLY: contractor PR F sketch

No code in this pull request. No edit to `public/`, `firestore.rules`, or `public/sw.js`. The code PR comes after AgentLab Architect reviews this sketch and Ameer says go.

Parent plan: `plan-contractor-module-r2.28.md`, sha256 `ef1c98d08a7118ed35469d250c81605a7f17f518d949f8446b8c63bb1869c8a2`. Spec: `contractor-module-spec.md`. Questions: `QUESTIONS-AMEER-ar-r2.28.md`. Format reference: `contractor-pr-b-sketch-r3.md` (sha256 `bc8c9a1e93da0503e92933d5849d251599e2d0d04d0622581be70853c45dfdc2`). PR B's types and functions are what B adds. This sketch does not re-specify them.

Base for the later code PR: `baf4f21fc54c156989334e826d19990b8e5e8a74` (v58, service worker `aj-p0-v58`). `public/accounts.js` from PR A is already on that commit. Every file:line below was read there. The plan's older line numbers are corrected in Citations.

Arena was not run. Ameer's gate bans it (cost). Three shapes are compared below by hand. The chosen shape is the foremen screen module, applied to the approved v1 cut.

Revision r2, against Architect NOTES on `5ab3cb3e` (review sha256 `1110e9c617fa318d8f355b33b05ce23ddbb19eebab2fa521e31b9c17068d59d1`). This revision also keeps the milestoneMode follow-up: PR D requires the field, so every milestone this screen writes sets `milestoneMode: 'amount'`.

EA, on Ameer's delegation, approved the defaults in `QUESTIONS-FOR-EA-r1.md` (sha256 prefix `13723e6e`) at 00:52 Baghdad on 2026-11-16. Where `answers-EA-delegated-0034.md` (sha256 prefix `c14b9c84`) differs, the earlier answer wins. This lane folds in Q5, Q16–Q22, and Q47. Q18 stays «مستحق عليه».

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
- The write actions that belong to G–J: new agreement, completed work, approve measurement, payment, settle, statement approval, return, labor refund, deduct, approve deduct, reject, supersede, and reversal. This page draws none of those buttons.
- `projectCost`, home totals, the owner project spent figure, site `spent`. Those are K, and K stays gated while `CONTRACTOR_COST_START` is null.
- Rules, the adopt path, and `accounts.js`.

`#person` stays the login-user form (`public/render.js` lines 665-684, title at line 838). The new hashes are `#accounts` and `#account/<id>`.

## Files the code PR may edit

| File                                                                  | Change                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/accounts-view.js`                                             | New module. The list, the four tabs, the filters, the live statement, and the create-person form. Same wrapper as `public/foremen.js`.                                                                                                 |
| `public/render.js`                                                    | Call `install`, `syncTab`, and `onClick`. Point `#accounts` and `#account` at the accounts tab. Set the heading from the party name. No markup for the four tabs in this file.                                                         |
| `public/index.html`                                                   | One script tag for `accounts-view.js` after `accounts.js` and before `render.js`.                                                                                                                                                      |
| `public/sw.js`                                                        | Add the file to `ASSETS` and `SHELL`. `VERSION` is the next free value at merge time (Q5). The date fix is v59. This file does not claim a number.                                                                                     |
| `public/session.js`                                                   | Add `accounts-view.js` to `SHELL_FILES` only. Add `K.parties`, `K.agreements`, or `K.accountTxns` only if E has not already added them.                                                                                                |
| `public/style.css`                                                    | No new class is expected. Reuse `.card`, `.kv`, `.pill`, `.pills`, `.note`, `.field`, `.msg`, `.btn`. Edit this file only if a row needs a class that is not already there. A comment-only edit still bumps `VERSION`. Prefer no edit. |
| `tests/accounts-view.test.js`                                         | New behaviour tests below.                                                                                                                                                                                                             |
| `tests/browser-check.js`                                              | The demo empty state and the site gate.                                                                                                                                                                                                |
| `tests/shell-cache.test.js`                                           | Script order, the new precache name, and the three `VERSION` pins.                                                                                                                                                                     |
| `tests/webkit-upgrade.test.js`                                        | `MARK` matches the same `VERSION`.                                                                                                                                                                                                     |
| `package.json`                                                        | Append the new test file to `"test"`. Append `tsc --noEmit -p tsconfig.strict-accounts-view.json` to `"typecheck"`. CI runs that script in the `lint, format, types` job (`.github/workflows/ci.yml` line 44).                         |
| `.github/workflows/ci.yml`                                            | The same test-file string, in the same place, so the ledger job list and `package.json` `"test"` stay identical.                                                                                                                       |
| `tsconfig.strict-accounts-view.json`                                  | New. Same shape as `tsconfig.strict-foremen.json`: extends `tsconfig.json`, `"strict": true`, include `public/accounts-view.js` and `types/checkjs.d.ts`.                                                                              |
| `.cursor/skills/verify-ahl-aljazeera-accounting/SKILL.md`             | Drive steps for the two new ids. An unknown id still exits 3.                                                                                                                                                                          |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/README.md`   | Two new lines.                                                                                                                                                                                                                         |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/accounts.md` | New feature file.                                                                                                                                                                                                                      |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/account.md`  | New feature file.                                                                                                                                                                                                                      |
| `scripts/verify-aj.js`                                                | `drive` accepts `accounts` and `account`. Every other id still throws exit 3 (`scripts/verify-aj.js` lines 1308-1310).                                                                                                                 |
| `docs/PSTACK_INVENTORY.md`                                            | Evidence on the F rows named in section 16 of the plan: `principle-experience-first`, `maintain-verification-skill`. Do not flip a status word.                                                                                        |

`style.css` is listed because the screen has to land in the existing shell. The expected diff is empty.

At `baf4f21f` both unit-test lists are 34 files and they match: `package.json` `"test"` and the `node --test` list in `.github/workflows/ci.yml` (ledger job). F adds `tests/accounts-view.test.js` to both, in the same place. The count at merge is 35, or 36 if the approved CDP plan's test file lands first. The two lists stay identical. The new `tsc --noEmit -p tsconfig.strict-accounts-view.json` runs inside `npm run typecheck`, which the `lint, format, types` job calls. It is not a fifth job.

## Files the code PR must not touch

`public/accounts.js`, `public/ledger.js`, `public/sync.js`, `public/foremen.js`, `public/people-dir.js`, `firestore.rules`, `firebase.json`, `README.md`, `tests/accounts.test.js`.

`firebase.json` already sends `no-cache` for `/*.js` (`firebase.json` line 17). A new script does not need a new header.

Do not fix the stale `aj-p0-v41` sentence in `README.md` line 22. Do not add `foremen.js` or `people-dir.js` to `SHELL_FILES`. Those gaps are older than F.

`post` still returns a document. F does not call `post`. Create-person writes a party row, not an `accountTxns` row.

## Usage

An owner opens the new tab. The list reads `K.parties`. Each name is a link to `#account/<id>`. The person page reads that party's agreements and `accountTxns` and asks C for the figures. The three filters hide rows. They do not recompute money.

```javascript
AccountsView.install(renderApi);
AccountsView.syncTab(user);
if (AccountsView.onClick(button)) return;
```

`install` registers `views.accounts` and `views.account` the way `ForemenUI.install` registers the foremen views (`public/foremen.js` lines 17-27). `render.js` stays the shell: hash, heading, tab highlight, click dispatch.

Create-person, once E can route a party:

```javascript
const id = screen.formId || uuid();
set(K.parties, parties.concat([{ id, docType: 'party', name, createdBy: user.uid, createdAtServer: null, deviceId }]));
queueDoc(id);
```

`queueDoc` appends the outbox before it decides whether to flush (`public/render.js` lines 89-92). The demo path never reaches those two lines. A build whose `collectionFor` does not return `parties` never reaches them either.

Second design considered: put the four tabs inside `views` in `public/render.js` (1,437 lines at this SHA). Rejected. The Baghdad-date fix and the foreman-export PR both edit `render.js` and merge before F. A page the size of `foremen.js` (490 lines) inside `views` collides with both. The foremen module already hides a screen behind `install` and `onClick`.

Third design considered: sum the overview in the view. Rejected. B's `personBalance` and C's `balances` are the one fold. A second sum will drift from the statement, which is the 520,000 bug the plan already names (closing must stay 480,000 when a 40,000 settle is added).

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
 *   milestoneMode?: 'amount'
 * }} AgreementRow
 * Read-only on screen. Percent is not rendered.
 * Every milestone this screen writes goes through `writtenMilestone`.
 * That sets `milestoneMode: 'amount'` and does not omit the field.
 * PR D's rules require `milestoneMode` (EA, after Architect #80 review M2).
 * A missing mode would be a denied create. The default is `'amount'`.
 */
```

F does not declare a second balance type, a second statement order, or a second `periodBounds`. It calls `Accounts.balances`, `Accounts.statementLines`, and `Accounts.periodBounds` as C specifies them in `docs/plans/contractor-pr-c-sketch.md` (PR #75). The screen prints that return value. It does not rename fields and it does not map them.

The overview reads `Balance` by C's names: `approvedLabor`, `payments`, `openAdvances`, `payable`, `recoverable`. `payable` and `recoverable` are already the split. The page does not call `max` itself. `netAdvances` is not on the overview.

The statement tab prints `statementLines(...).lines` in the order C returns, each row `label` and `amount`. F does not insert a line, drop a line, or move `openAdvances` above `closing`. A row id in `pendingIds` is listed under `بانتظار الاعتماد` and is not added into a total. A row id in `unreviewedCashIds` shows `غير مدقّق`. A row id in `overLimitIds` uses the sentence for that purpose, in Strings. Opening and closing are the numbers on C's return value, not a sum the page builds.

`modelFor` passes C's `BalanceFilter` and `StatementFilter`. It does not declare a second filter type. `periodStart` and `periodEnd` are `Accounts.periodBounds(kind, today())`. A null from that function does not become a local calendar.

```javascript
/**
 * @typedef {{
 *   tab: AccountTab,
 *   filter: MovementFilter,
 *   scope: AccountScope,
 *   projectId: string,
 *   periodKind: PeriodKind,
 *   creating: boolean,
 *   formId: string,
 *   name: string,
 *   msg: string,
 *   today: string
 * }} AccountScreen
 * Held in this module, the way `foremen.js` holds `draft`. It is not added
 * to `ScreenState` in `render.js` (`public/render.js` line 40).
 */

/**
 * @param {string} name
 * @returns {string[]}
 * Empty when the trimmed name is 1 to 80 characters. Otherwise `['name']`.
 * The screen maps that token to «أدخل اسم الشخص» (Q17). That string is outside the 88 and is listed separately.
 */
function partyErrors(name)

/**
 * @param {{ milestoneAmount: number, milestoneMode?: 'amount' }} input
 * @returns {{ method: 'milestone', milestoneAmount: number, milestoneMode: 'amount' } | null}
 * Always sets `milestoneMode` to `'amount'`. A missing mode becomes `'amount'`.
 * `'percent'` returns null and writes nothing. The new-agreement button stays G.
 * Any milestone F itself writes uses this function, so the field is never absent.
 */
function writtenMilestone(input)

/**
 * @param {{ role?: string }|null|undefined} user
 * @returns {boolean}
 * False when `demoRole()` is set (`public/session.js` line 95).
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
 */
function accountHtml(model, partyId)

/**
 * Reads the stores and calls `Accounts.balances`, `Accounts.statementLines`,
 * and `Accounts.periodBounds`. This is the only place those three are called.
 * The model keeps C's objects. It does not copy them into new field names.
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
 * `syncPeopleTab` (`public/render.js` lines 855-870).
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

A deduct has no fourth pill. Reversed rows stay in the list with `معكوس` and stay out of `figures`, because `balances` omits them. The view prints `figures`. It does not add a row amount into a total.

`approveDeduct` stores no amount (PR B). The list shows the purpose label and no money for that row.

Slot-loser rows, when E has stored them, render in their own block, read-only, with `SyncStatus.CONFLICT` (`public/sync-status.js` line 13) and no buttons. Winner rows do not read that map. If the key is absent, the block is empty. F does not create the key.

## Data and rules

Parties, agreements, and `accountTxns` are create-only on the server. F writes one party, and only through the path above. The local row has `id`, `name`, `createdBy`, `createdAtServer: null`, `deviceId`, and `docType: 'party'`. It has no `roles`, no `currency`, and no balance. D's party `hasOnly` list decides whether `docType` is on the server row. If that list omits `docType`, the write omits it, the same way `toRemote` keeps foremen fields and drops `docType` (`public/sync.js` lines 56-57) and the pull puts `docType` back (`public/sync.js` lines 225-226). If D's list includes `docType`, the write keeps it. F does not add a third rule. E's `toRemote` follows that same list.

One party create is 1 write and 1 rule `get` (D's `partyCreate`, one read). The page reads local caches only. E owns the pulls. That is the Spark cost for this phase (plan section 16).

`id` is `uuid()` (`public/session.js` lines 85-93), minted once when the form opens and kept until the save succeeds, same as `state.formId` (`public/render.js` line 40). A second click sees the id already in `K.parties` and does not append again. The button is disabled for that click, same as `#save` (`public/render.js` line 1235).

Name is trimmed, 1 to 80 characters. Over 80 or empty: `partyErrors` returns `name`, `queueDoc` is not called.

Owner gate on the screen is `Ledger.can(user, 'owner')`, the same check the people tab uses. It does not also test `active`. The server still requires `active == true` (`firestore.rules` line 11). F does not add a second client rule.

IQD. Amounts go through `money` (`public/render.js` line 46), which uses `Ledger.fmt` (`public/ledger.js` line 451) and the suffix `د.ع`. `مستحق له` prints `Balance.payable`. `مستحق عليه` prints `Balance.recoverable`. The page does not compute either one. There is no `<select>` for currency and no `USD`.

The overview and the statement are the C calls named in Types and signatures. Weekly and monthly only choose the `kind` passed to `Accounts.periodBounds`. They do not write `statementApprovals`. The approve button is not drawn. While `unreviewedCashIds` names a cash row in the period, the page shows `لا يُعتمد الكشف وفيه مبلغ غير مدقّق`. Those rows show `غير مدقّق`.

«هذا المشروع» sets `projectId` on C's filter. «كل المشاريع» omits it. Q22: the project pills are the projects that already appear on this person's agreements or txns, not every company project. They reuse `data-proj` (`public/render.js` line 598).

Hashes use `DomSafe` (`public/dom-safe.js` lines 8 and 27). An id that fails `isSafeId` renders `معرّف غير صالح`. A safe id with no party renders `الشخص غير متاح`.

Unknown hashes still fall through to home (`public/render.js` lines 1113-1114). `#accounts` and `#account` become known because `install` adds them to `views`.

## Strings

Grouped by screen. `new` means the string is one of the 88 Ameer approved on 2026-11-10 at 11:16 Baghdad (Q47; the earlier answer in `c14b9c84` is the same approval) and is not yet in `public/` at baf4f21f. The list is `strings-contractor-module-r2.22.md` (sha256 prefix `9d25840a`). The tab `حسابات` is closed by that approval and by Q16. `reused` means the words are already on a screen at baf4f21f. `outside` means the words are not in the 88. EA approved them on this lane. They stay listed here and are not folded into the 88.

### Tab and list

| String                  | Mark           | Where it already is, or why it is here                              |
| ----------------------- | -------------- | ------------------------------------------------------------------- |
| `حسابات`                | approved       | The tab and the `#title` on the list. Q16 and Q47.                  |
| `حسابات الأشخاص`        | new            | List heading inside the card.                                       |
| `+ شخص جديد`            | new            | The button. Absent in the demo and absent until E routes `parties`. |
| `اسم الشخص`             | new            | The create field label.                                             |
| `أدخل اسم الشخص`        | outside the 88 | Q17. Empty or too-long name. Listed separately.                     |
| `لا توجد حسابات أشخاص.` | new            | Empty list.                                                         |
| `الشخص غير متاح`        | new            | Safe id, no row.                                                    |
| `هذه الشاشة للمالك.`    | reused         | `public/render.js` lines 660 and 667. Site user.                    |
| `معرّف غير صالح`        | reused         | `public/render.js` line 668.                                        |
| `رجوع`                  | reused         | Already a kept string. Back to the list.                            |
| `حفظ`                   | reused         | The create button, only when the form is open.                      |

### Tabs and filters

| String         | Mark                                                          |
| -------------- | ------------------------------------------------------------- |
| `نظرة عامة`    | new                                                           |
| `العقود`       | new. The shorter v1 name. The page does not say `عقود العمل`. |
| `الحركات`      | new                                                           |
| `كشف الحساب`   | new                                                           |
| `الدفعات`      | reused. `public/render.js` line 754. Filter, not a tab.       |
| `السلف`        | reused. `public/foremen.js` line 157. Filter, not a tab.      |
| `قياسات العمل` | outside the 88. Q17 approved it as a filter label, not a tab. |

The page does not say `حركات المواد`, `المرفقات`, `الأدوار`, or any role name.

### Overview

| String           | Mark                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `هذا المشروع`    | new                                                                                             |
| `كل المشاريع`    | new                                                                                             |
| `عمل معتمد`      | new                                                                                             |
| `مدفوع للعمل`    | new                                                                                             |
| `سلف قائمة عليه` | new. The overview uses this, not the shorter `سلف قائمة`.                                       |
| `مستحق له`       | reused. `public/foremen.js` lines 148 and 174.                                                  |
| `مستحق عليه`     | new. Q9 closed on this word.                                                                    |
| `المتبقي سلفة`   | new. Q18. Shown with `مستحق عليه` when `Balance.recoverable` is not 0. No new advisor sentence. |

Do not reuse `مستحق للخلفة` or `المتبقي معه` (`public/foremen.js` lines 182-184).

### Contracts

Method labels, new, read from the agreement: `مبلغ مقطوع`, `بسعر الوحدة`, `باليوم`, `مرحلة`. `مرحلة` here is the amount milestone. The page does not say `نسبة`.

| String               | Mark                                 |
| -------------------- | ------------------------------------ |
| `الوصف`              | reused. `public/render.js` line 710. |
| `المبلغ المتفق عليه` | reused. `public/render.js` line 773. |
| `لا توجد عقود.`      | reused. `public/render.js` line 85.  |
| `د.ع`                | reused, via `money`.                 |

`العملة`, `دولار`, and `سعر الدولار` are not on the form. There is no form. The agreement button `عقد عمل جديد` is G.

### Movements

| String                                | Mark                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `بانتظار الاعتماد`                    | new. Unapproved `laborQty` or `deduct`.                                      |
| `معتمد`                               | new. Live `approveLabor`.                                                    |
| `مرفوض`                               | new. A `rej_` with no live approval.                                         |
| `معكوس`                               | reused. `public/render.js` line 512.                                         |
| `غير مدقّق`                           | new. Q10 closed. Cash row with no live `revw_`.                              |
| `لم يُرسل`                            | reused. The row id is in the outbox.                                         |
| `لا يوجد`                             | reused. `public/render.js` line 559. Empty filter.                           |
| `المُرجَع أكبر من الدفعة`             | new. Approved. `overLimit` on `payLabor` or `refundLabor`.                   |
| `الخصم أكبر من العمل المعتمد`         | outside the 88. Approved 2026-11-15 23:22 via EA. Q17 keeps the page string. |
| `المُرجَع والتسوية أكبر من السلفة`    | outside the 88. Q19. `overLimit` on `returnAdvance` or `settle`.             |
| `القيد موجود على الخادم بمحتوى مختلف` | reused. `SyncStatus.CONFLICT`. Slot-loser block.                             |

No `اعتماد`, `رفض السطر`, `عكس`, or `نسخة جديدة` button. Q20: the create button is absent in the demo.

### Statement

These labels are in the 88 (Q47). The page prints whichever of them C's `statementLines().lines` returns, in C's order. F does not reorder them.

`أسبوعي`, `شهري`, `من`, `إلى`, `رصيد أول المدة`, `السلف المصروفة له`, `المُرجَع من السلف نقداً`, `صافي السلف`, `سلف قائمة عليه`, `الخصومات ومرتجعات المواد`, `المُرجَع من الدفعة نقداً`, `رصيد آخر المدة`, `الصافي`, `الكشف يُعتمد قبل أن يُقفل. الأرقام تُحسب من القيود.`, `لا يُعتمد الكشف وفيه مبلغ غير مدقّق`.

Not on this page: `فرق سعر الصرف`, `لا مرفقات في هذه النسخة.`, `إصدار كشف حساب`, `اعتماد` as a button, `حفظ التسوية`. Those waits are G–J or phase 2.

## Tests

`tests/accounts-view.test.js`. Each test asserts an Arabic string or a number C returned for the fixture. None asserts a helper's source text, and none restates C's line order. The figure tests call the real `Accounts.balances` and `Accounts.statementLines` once C is on the branch. A rendered closing that disagrees with `statementLines().closing` fails.

Fixtures from the plan:

- Spec 12 / the brick screen. `approveLabor` 600,000 and `payLabor` 600,000. Overview shows `عمل معتمد` 600,000, `مدفوع للعمل` 600,000, `مستحق له` 0, `مستحق عليه` 0.
- Partial, spec 11. The same approval and `payLabor` 200,000. `مستحق له` 400,000. `مستحق عليه` 0.
- Overpayment. `payLabor` 700,000 after `approveLabor` 600,000. `مستحق عليه` 100,000. The HTML has one `payLabor` row and no `advanceLabor` row. The 100,000 line does not contain U+2212.
- Statement. Approval 600,000, deduct 50,000, `approveDeduct` of that deduct, advance 100,000, return 30,000. The rendered lines equal `statementLines().lines` in that order, and the closing text equals `statementLines().closing`.
- Same rows plus `settle` 40,000. The closing text still equals C's closing. The HTML does not contain 520,000.
- Same rows without `approveDeduct`. The deduct id is in `pendingIds` and shows `بانتظار الاعتماد`. The closing text equals C's closing.
- The statement's `من` and `إلى` equal `Accounts.periodBounds(kind, today)` for that same call. `accounts-view.js` does not define `periodBounds`.

Behaviour:

- Demo owner model (Q20): HTML contains `لا توجد حسابات أشخاص.` and does not contain `+ شخص جديد`. The test's `set` is not called with the outbox.
- Site model: HTML is `هذه الشاشة للمالك.` and contains no party name and no create button.
- `canCreateParty` is false when `collectionFor` returns null, and false when `demoRole()` is `owner` even if `collectionFor` returns `parties`.
- Logged-in owner and `collectionFor` returns `parties`: the button is present. Saving `حسن` queues one id, the stored row has no `roles`, and a second click does not add a second id.
- Empty name and an 81-character name do not call `queueDoc`.
- `writtenMilestone({ milestoneAmount: 250000 })` stores `milestoneMode: 'amount'`. Omitting the mode still stores `'amount'`. `'percent'` returns null and does not write.
- Bad id: `معرّف غير صالح`. Unknown safe id: `الشخص غير متاح`.
- Filters. A `laborQty` is under `قياسات العمل` and not under `الدفعات`. A `payLabor` is under `الدفعات`. An `advanceLabor` is under `السلف`. A `deduct` is on `all` and on neither of those three.
- The four tab strings are present. `حركات المواد`, `المرفقات`, and `العملة` are absent. There is no `<select`.
- The statement HTML has no `#save-statement` and no button labelled `اعتماد`.
- An `overLimit` payment shows `المُرجَع أكبر من الدفعة`. An `overLimit` deduct shows `الخصم أكبر من العمل المعتمد`. An `overLimit` advance shows `المُرجَع والتسوية أكبر من السلفة` (Q19).
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

| Other work           | Files                                               | What F does                                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Baghdad-date fix     | `public/session.js`, `public/render.js`             | Merges first. F rebases. F's `render.js` edit is `install`, `syncTab`, `onClick`, the tab highlight (`public/render.js` lines 1139-1141), and the heading (`public/render.js` lines 1148-1152). F's `session.js` edit is `SHELL_FILES` (`public/session.js` line 271). F calls `today()`. It does not add a clock. |
| Foreman export       | `public/ledger.js`, `public/render.js`              | Merges first. F does not edit `ledger.js`. The `render.js` overlap is the same four call sites.                                                                                                                                                                                                                    |
| PR B                 | `public/accounts.js`                                | F does not edit it. Q18 and Q19 close the label and the advance sentence that B deferred.                                                                                                                                                                                                                          |
| PR C                 | `public/accounts.js`                                | F calls `balances` and `statementLines`. The code PR waits until those exist.                                                                                                                                                                                                                                      |
| PR E                 | `public/sync.js`, and the local keys if E adds them | F does not edit `sync.js`. The create button stays absent while `collectionFor` returns null for `docType: 'party'`.                                                                                                                                                                                               |
| Other phase sketches | their own docs files                                | This PR is the one file below. It does not edit them.                                                                                                                                                                                                                                                              |

Service worker (Q5). This sketch does not touch `public/sw.js`. At baf4f21f, `VERSION` is `aj-p0-v58` (`public/sw.js` line 1). The date fix is v59. F does not claim a number. The code PR takes the next free version at merge time, and renumbers if another PR takes that integer first. The same string goes in `tests/shell-cache.test.js` (the pins are lines 43, 65, and 93 at this SHA) and in `tests/webkit-upgrade.test.js` line 18 (`MARK`). `tests/sw-version-guard.test.js` lines 31-44 already fail a `public/` edit that does not bump `VERSION`.

`index.html` at this SHA already loads `accounts.js` before `render.js` (lines 71-72). `SHELL` and `ASSETS` already name `accounts.js` (`public/sw.js` lines 2-4). `SHELL_FILES` already names it (`public/session.js` line 271). F adds `accounts-view.js` beside that script. It does not add `accounts.js` again.

Script order the shell test will require: `accounts.js`, then `accounts-view.js`, then `render.js`, then `app.js`. `tests/shell-cache.test.js` line 79 is the current chain and gains `accounts-view.js` between `accounts.js` and `render.js`.

## Revert

Revert the code PR with `git revert`. That does not delete Firestore parties already created.

If phones have queued a party id and E is still in the build, E can still send it. The screen is gone. The id remains until it flushes.

If E is reverted as well, `collectionFor` returns null, `flushOutbox` keeps the id (`public/sync.js` line 611), `outboxEmpty` stays false (`public/session.js` lines 256-268), and logout alerts (`public/session.js` line 331). Recovery is to ship E and F again, or a later pull request Ameer approves that drops those specific ids. This sketch does not drop them.

A revert that touches `public/` bumps `VERSION` again, to whatever is free at that merge. This docs PR has nothing to bump.

## Dependencies

- A is on baf4f21f. `render.js` does not call `Accounts`. `accounts.js` exports `CONTRACTOR_COST_START`, `PURPOSES`, `unitPrice`, `workPosition`, `post`, `cashPointerErrors`, and `projectCost` (`public/accounts.js` line 187). It does not export `balances` or `statementLines`.
- B adds the labor posts, `personBalance`, and the `cumulative` code. F does not call `post` or `personBalance`. The overview uses C's `payableGross`, because a negative net and «مستحق عليه» are not the same number as the open-advance split.
- C adds `balances`, `statementLines`, and `periodBounds`. F prints those return values and does not re-specify them.
- D is deployed before E. F does not edit rules. D's party `hasOnly` list is what decides the `docType` strip. Create-person on a logged-in phone needs D's party create and E's route.
- E routes `docType: 'party'` to `parties`. E's `toRemote` follows D's allowed-field list for whether `docType` is sent. The local keys `K.parties`, `K.agreements`, and `K.accountTxns` are E's if E stores rows. At baf4f21f `K` (`public/session.js` line 5) does not have them. If they are still missing when F's code PR rebases onto E, F adds the missing keys and nothing else in that object.
- `projectCost` at baf4f21f still has the date loop and returns 0 while the constant is null (`public/accounts.js` lines 175-176). B's sketch replaces that loop with `return 0`. Either way F does not call it.

## Risks

- `render.js` is the shared file. Keeping F's hunk to the four call sites is what makes the rebase onto the date fix and the foreman export reviewable. Growing `ScreenState` or pasting HTML into `views` brings the collision back.
- `canCreateParty` probes `collectionFor` with a tiny party. If E's route demands a field the probe omits, the button stays hidden on a build that can actually queue. The code PR matches E's required fields. It does not fork a second router.
- `Ledger.can` ignores `active`. An inactive owner who can still open the shell sees this tab, as he sees «الأشخاص» today. The server denies the create (`firestore.rules` line 11). F does not invent a stricter client check.
- Two owners mint two uuids. Both parties land. F does not dedupe names.
- The statement looks like a total the page computed. It is C's number. The 480,000 versus 520,000 test is what catches a local sum.
- The verify drive cannot show the brick fixture until G–J write rows. Shipping F does not make spec 8 pass on screen. Spec 8 on screen is K, and K is gated.
- `SHELL_FILES` omits `foremen.js` and `people-dir.js` while `sw.js` includes them. Copying that omission for `accounts-view.js` would leave the new script out of the session shell check. F adds the new name and does not sweep the old gap.

## Citations rechecked at baf4f21f

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

Q16–Q22 and Q47 are closed. EA approved those defaults at 00:52 Baghdad on 2026-11-16. Nothing in this lane is still open. Strings outside the 88 stay listed here so they are not folded into that count.

| Question | Decision                                                                                      |
| -------- | --------------------------------------------------------------------------------------------- |
| Q5       | `VERSION` is the next free number at merge time. The date fix is v59. F claims no number.     |
| Q16      | The tab is `حسابات`.                                                                          |
| Q17      | The page strings stand, including `أدخل اسم الشخص`.                                           |
| Q18      | `مستحق عليه` and `المتبقي سلفة`. No new advisor sentence. No confirm step on this page.       |
| Q19      | Add `المُرجَع والتسوية أكبر من السلفة`.                                                       |
| Q20      | The create button is absent in the demo.                                                      |
| Q21      | The create form is the name only. `note` is not sent.                                         |
| Q22      | «هذا المشروع» lists only this person's projects.                                              |
| Q47      | The 88 stand, including `المحاولة <n> من 9`. Same approval Ameer gave on 2026-11-10 at 11:16. |

Outside the 88, listed separately:

- `أدخل اسم الشخص` (Q17)
- `قياسات العمل` (Q17, filter label)
- `المُرجَع والتسوية أكبر من السلفة` (Q19)
- `الخصم أكبر من العمل المعتمد` (Ameer, 2026-11-15 23:22 via EA; Q17 keeps it on this page)

## pstack for the code PR

The app is not claimed to be pstack-compliant. This sketch does not mark an inventory row «مطبّقة».

Plan section 16 names the code PR's inventory rows: `principle-experience-first` and `maintain-verification-skill`.

- `principle-experience-first` is already «مطبّقة». The code PR adds an evidence link. It does not add a next step that reads as if the skill were missing. The decision the row records: the page ships the empty list, the four tabs, and the live statement, and it does not ship the twelve write buttons.
- `maintain-verification-skill` is «ناقصة». The code PR can add a next-step sentence. It does not flip the status word. The sentence names the two ids and the evidence directory. The status stays until a maintain pass actually drives them.

`principle-subtract-before-you-add` is the smaller v1, which Ameer already picked (section 14). F does not reopen that cut. The code PR does not flip that row either.

Skills this phase uses, from the plan and from the screen work: `architect` (this file; arena was not run), `feature` (the code PR, after this sketch is accepted), `tdd` (the tests above, written before the markup), `maintain-verification-skill` (the ids above, edited in the code PR), `principle-experience-first`, `principle-model-the-domain` (one fold, one party shape), `principle-boundary-discipline` (the view reads C's figures), `principle-minimize-reader-load` (one module, four call sites in `render.js`).

## Decisions only Ameer can make

- Say go on this sketch before any code PR.
- Merge, later, only after Architect's review of the code SHA and CI 4/4. This sketch does not merge itself.

Already decided: Q5, Q16–Q22, and Q47, plus the tab `حسابات`, the 88 strings, IQD only, four tabs, filters on `الحركات`, owner only, create-person absent until E is in the same build, and the empty demo list. Strings outside the 88 are listed under أسئلة لأمير and are not renumbered into the 88.
