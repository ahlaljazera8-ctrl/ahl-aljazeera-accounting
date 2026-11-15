# PLAN ONLY: contractor PR F sketch

No code in this pull request. No edit to `public/`, `firestore.rules`, or `public/sw.js`. The code PR comes after AgentLab Architect reviews this sketch and Ameer says go.

Parent plan: `plan-contractor-module-r2.28.md`, sha256 `ef1c98d08a7118ed35469d250c81605a7f17f518d949f8446b8c63bb1869c8a2`. Spec: `contractor-module-spec.md`. Questions: `QUESTIONS-AMEER-ar-r2.28.md`. Format reference: `contractor-pr-b-sketch-r3.md` (sha256 `bc8c9a1e93da0503e92933d5849d251599e2d0d04d0622581be70853c45dfdc2`). PR B's types and functions are what B adds. This sketch does not re-specify them.

Base for the later code PR: `baf4f21fc54c156989334e826d19990b8e5e8a74` (v58, service worker `aj-p0-v58`). `public/accounts.js` from PR A is already on that commit. Every file:line below was read there. The plan's older line numbers are corrected in Citations.

Arena was not run. Ameer's gate bans it (cost). Three shapes are compared below by hand. The chosen shape is the foremen screen module, applied to the approved v1 cut.

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
| `public/sw.js`                                                        | Add the file to `ASSETS` and `SHELL`. `VERSION` is the next free value at merge time.                                                                                                                                                  |
| `public/session.js`                                                   | Add `accounts-view.js` to `SHELL_FILES` only. Add `K.parties`, `K.agreements`, or `K.accountTxns` only if E has not already added them.                                                                                                |
| `public/style.css`                                                    | No new class is expected. Reuse `.card`, `.kv`, `.pill`, `.pills`, `.note`, `.field`, `.msg`, `.btn`. Edit this file only if a row needs a class that is not already there. A comment-only edit still bumps `VERSION`. Prefer no edit. |
| `tests/accounts-view.test.js`                                         | New behaviour tests below.                                                                                                                                                                                                             |
| `tests/browser-check.js`                                              | The demo empty state and the site gate.                                                                                                                                                                                                |
| `tests/shell-cache.test.js`                                           | Script order, the new precache name, and the three `VERSION` pins.                                                                                                                                                                     |
| `tests/webkit-upgrade.test.js`                                        | `MARK` matches the same `VERSION`.                                                                                                                                                                                                     |
| `package.json`                                                        | Append the new test file to `"test"`. Append `tsc --noEmit -p tsconfig.strict-accounts-view.json` to `"typecheck"`.                                                                                                                    |
| `.github/workflows/ci.yml`                                            | The same test-file string, in the same place, so the ledger job list and `package.json` `"test"` stay identical.                                                                                                                       |
| `tsconfig.strict-accounts-view.json`                                  | New. Same shape as `tsconfig.strict-foremen.json`: extends `tsconfig.json`, `"strict": true`, include `public/accounts-view.js` and `types/checkjs.d.ts`.                                                                              |
| `.cursor/skills/verify-ahl-aljazeera-accounting/SKILL.md`             | Drive steps for the two new ids. An unknown id still exits 3.                                                                                                                                                                          |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/README.md`   | Two new lines.                                                                                                                                                                                                                         |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/accounts.md` | New feature file.                                                                                                                                                                                                                      |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/account.md`  | New feature file.                                                                                                                                                                                                                      |
| `scripts/verify-aj.js`                                                | `drive` accepts `accounts` and `account`. Every other id still throws exit 3 (`scripts/verify-aj.js` lines 1308-1310).                                                                                                                 |
| `docs/PSTACK_INVENTORY.md`                                            | Evidence on the F rows named in section 16 of the plan: `principle-experience-first`, `maintain-verification-skill`. Do not flip a status word.                                                                                        |

`style.css` is listed because the screen has to land in the existing shell. The expected diff is empty.

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

All of these live in `public/accounts-view.js`. `Accounts.balances` and `Accounts.statementLines` stay in `public/accounts.js`, written by C. F calls them. If C's names differ, the code PR maps them in the two functions below and nowhere else.

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
 * names a label (question 6). `docType` is local so `collectionFor` can
 * tell a party from a project (`public/sync.js` lines 23-31). E strips
 * it before the server write. The server row stays the plan's field list.
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
 * Read-only. Percent is not a value this screen renders.
 */

/**
 * @typedef {{
 *   net: number,
 *   payableGross: number,
 *   openAdvances: number,
 *   approvedLabor: number,
 *   laborPaid: number,
 *   advancesPaid: number,
 *   cashReturned: number,
 *   netAdvances: number,
 *   deductions: number,
 *   paymentRefunds: number,
 *   opening: number,
 *   closing: number
 * }} AccountFigures
 * C owns every field. Positive `payableGross`: the company owes the person.
 * Negative `payableGross`: the person holds the company's money.
 * `openAdvances` is «سلف قائمة عليه». `netAdvances` is «صافي السلف».
 * The overview prints `openAdvances` and does not print `netAdvances`.
 * The statement prints both. `closing` equals `net`. F does not recompute it.
 */

/**
 * @typedef {{
 *   partyId: string,
 *   projectId?: string,
 *   periodStart: string,
 *   periodEnd: string
 * }} FiguresScope
 * `projectId` is omitted for «كل المشاريع». Dates are `YYYY-MM-DD`.
 */

/**
 * @typedef {{
 *   id: string,
 *   purpose: string,
 *   amount: number|null,
 *   txnDate: string,
 *   projectId: string,
 *   pending: boolean,
 *   reversed: boolean,
 *   unreviewed: boolean,
 *   overLimit: boolean
 * }} MovementLine
 * `pending` is an unapproved `laborQty` or `deduct`. `unreviewed` is a live
 * cash row with no live `revw_`. `overLimit` is C's flag. The Arabic sentence
 * is chosen from `purpose`, in Strings.
 */

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
 * @param {PeriodKind} kind
 * @param {string} today
 * @returns {{ periodStart: string, periodEnd: string }}
 * Week starts Saturday (Q7). The function splits `today` and uses `Date.UTC`.
 * It does not call `new Date(today)`, which parses UTC midnight and can move
 * the civil day. It does not read the clock. The installed view passes
 * `today()` from `public/session.js` line 94, after the Baghdad-date fix.
 * 2026-11-15 is a Sunday, so the week is 2026-11-14 through 2026-11-20.
 * The month is 2026-11-01 through 2026-11-30.
 */
function periodBounds(kind, today)

/**
 * @param {string} name
 * @returns {string[]}
 * Empty when the trimmed name is 1 to 80 characters. Otherwise `['name']`.
 * The screen maps that token to «أدخل اسم الشخص» if Ameer accepts question 2.
 */
function partyErrors(name)

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
 * `model.screen.tab`. Figures come from `model.figures`.
 */
function accountHtml(model, partyId)

/**
 * Reads the stores, calls `Accounts.balances` and `Accounts.statementLines`,
 * and returns the model `listHtml` and `accountHtml` already accept.
 * This is the only place those two C functions are called.
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

Parties, agreements, and `accountTxns` are create-only on the server. F writes one party, and only through the path above. The party payload has `id`, `name`, `createdBy`, `createdAtServer: null`, `deviceId`, and local `docType: 'party'`. It has no `roles`, no `currency`, and no balance.

`id` is `uuid()` (`public/session.js` lines 85-93), minted once when the form opens and kept until the save succeeds, same as `state.formId` (`public/render.js` line 40). A second click sees the id already in `K.parties` and does not append again. The button is disabled for that click, same as `#save` (`public/render.js` line 1235).

Name is trimmed, 1 to 80 characters. Over 80 or empty: `partyErrors` returns `name`, `queueDoc` is not called.

Owner gate on the screen is `Ledger.can(user, 'owner')`, the same check the people tab uses. It does not also test `active`. The server still requires `active == true` (`firestore.rules` line 11). F does not add a second client rule.

IQD. Amounts go through `money` (`public/render.js` line 46), which uses `Ledger.fmt` (`public/ledger.js` line 451) and the suffix `د.ع`. A negative figure uses U+2212. The recoverable and payable lines print the absolute value, so «مستحق عليه» is not also drawn with a minus. There is no `<select>` for currency and no `USD`.

Overview, for the selected scope:

- `عمل معتمد` = `figures.approvedLabor`
- `مدفوع للعمل` = `figures.laborPaid`
- `سلف قائمة عليه` = `figures.openAdvances`
- `مستحق له` = `max(figures.payableGross, 0)`
- `مستحق عليه` = `max(-figures.payableGross, 0)`

`صافي السلف` is not on the overview. It is on the statement.

Statement order, printed from `figures`, not added up on the page:

opening, approved labor, payments minus `المُرجَع من الدفعة نقداً`, then `السلف المصروفة له` minus and `المُرجَع من السلف نقداً` plus and `صافي السلف`, then `الخصومات ومرتجعات المواد` minus, then `سلف قائمة عليه`, then closing. Settlements stay at 0. Closing is `figures.closing`.

Weekly and monthly are view state. They change `periodStart` and `periodEnd` passed into C. They do not write `statementApprovals`. The approve button is not drawn. While `lines` contain an unreviewed cash row in the period, the page shows `لا يُعتمد الكشف وفيه مبلغ غير مدقّق`. Cash rows show `غير مدقّق` until a live `revw_` names them.

«هذا المشروع» limits `figures` and the lists to one `projectId`. «كل المشاريع» omits `projectId`. The project pills are the projects that already appear on this person's agreements or txns. They reuse `data-proj` (`public/render.js` line 598). Question 7 asks Ameer to confirm that set.

Hashes use `DomSafe` (`public/dom-safe.js` lines 8 and 27). An id that fails `isSafeId` renders `معرّف غير صالح`. A safe id with no party renders `الشخص غير متاح`.

Unknown hashes still fall through to home (`public/render.js` lines 1113-1114). `#accounts` and `#account` become known because `install` adds them to `views`.

## Strings

Grouped by screen. `new` means the v1 inventory string is not in `public/` at baf4f21f. `reused` means it is already on screen. Question 2 asks Ameer to accept the set this page paints. He is not asked to accept the material strings.

The plan's count of 88 is still open (`Q-strings`). PR B added one approved string, `الخصم أكبر من العمل المعتمد`, which this page shows and which is not in the app yet. v1 strings on this page go from that approved set to 89, plus `أدخل اسم الشخص` if question 2 says yes, plus the advance sentence if question 4 says yes.

### Tab and list

| String                  | Mark               | Where it already is, or why it is here                              |
| ----------------------- | ------------------ | ------------------------------------------------------------------- |
| `حسابات`                | new, not approved  | Question 1. The tab and the `#title` on the list.                   |
| `حسابات الأشخاص`        | new                | List heading inside the card.                                       |
| `+ شخص جديد`            | new                | The button. Absent in the demo and absent until E routes `parties`. |
| `اسم الشخص`             | new                | The create field label.                                             |
| `أدخل اسم الشخص`        | new, not in the 88 | Question 2. Empty or too-long name.                                 |
| `لا توجد حسابات أشخاص.` | new                | Empty list.                                                         |
| `الشخص غير متاح`        | new                | Safe id, no row.                                                    |
| `هذه الشاشة للمالك.`    | reused             | `public/render.js` lines 660 and 667. Site user.                    |
| `معرّف غير صالح`        | reused             | `public/render.js` line 668.                                        |
| `رجوع`                  | reused             | Already a kept string. Back to the list.                            |
| `حفظ`                   | reused             | The create button, only when the form is open.                      |

### Tabs and filters

| String         | Mark                                                                              |
| -------------- | --------------------------------------------------------------------------------- |
| `نظرة عامة`    | new                                                                               |
| `العقود`       | new. The shorter v1 name. The page does not say `عقود العمل`.                     |
| `الحركات`      | new                                                                               |
| `كشف الحساب`   | new                                                                               |
| `الدفعات`      | reused. `public/render.js` line 754. Filter, not a tab.                           |
| `السلف`        | reused. `public/foremen.js` line 157. Filter, not a tab.                          |
| `قياسات العمل` | new as a filter label. It was a full-page tab name. Section 14 makes it a filter. |

The page does not say `حركات المواد`, `المرفقات`, `الأدوار`, or any role name.

### Overview

| String           | Mark                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `هذا المشروع`    | new                                                                                      |
| `كل المشاريع`    | new                                                                                      |
| `عمل معتمد`      | new                                                                                      |
| `مدفوع للعمل`    | new                                                                                      |
| `سلف قائمة عليه` | new. The overview uses this, not the shorter `سلف قائمة`.                                |
| `مستحق له`       | reused. `public/foremen.js` lines 148 and 174.                                           |
| `مستحق عليه`     | new. Q9 closed on this word.                                                             |
| `المتبقي سلفة`   | new. Question 3. Shown beside a negative `payableGross` if Ameer keeps the PR B default. |

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

| String                                | Mark                                                               |
| ------------------------------------- | ------------------------------------------------------------------ |
| `بانتظار الاعتماد`                    | new. Unapproved `laborQty` or `deduct`.                            |
| `معتمد`                               | new. Live `approveLabor`.                                          |
| `مرفوض`                               | new. A `rej_` with no live approval.                               |
| `معكوس`                               | reused. `public/render.js` line 512.                               |
| `غير مدقّق`                           | new. Q10 closed. Cash row with no live `revw_`.                    |
| `لم يُرسل`                            | reused. The row id is in the outbox.                               |
| `لا يوجد`                             | reused. `public/render.js` line 559. Empty filter.                 |
| `المُرجَع أكبر من الدفعة`             | new. Approved. `overLimit` on `payLabor` or `refundLabor`.         |
| `الخصم أكبر من العمل المعتمد`         | new. Approved by Ameer 2026-11-15 via EA. `overLimit` on `deduct`. |
| `القيد موجود على الخادم بمحتوى مختلف` | reused. `SyncStatus.CONFLICT`. Slot-loser block.                   |

No `اعتماد`, `رفض السطر`, `عكس`, or `نسخة جديدة` button.

The advance overrun has no sentence until question 4. `#53` says «الدفعة» and does not fit an advance.

### Statement

All new, from the inventory, except where marked. The page prints them from `figures`.

`أسبوعي`, `شهري`, `من`, `إلى`, `رصيد أول المدة`, `السلف المصروفة له`, `المُرجَع من السلف نقداً`, `صافي السلف`, `سلف قائمة عليه`, `الخصومات ومرتجعات المواد`, `المُرجَع من الدفعة نقداً`, `رصيد آخر المدة`, `الصافي`, `الكشف يُعتمد قبل أن يُقفل. الأرقام تُحسب من القيود.`, `لا يُعتمد الكشف وفيه مبلغ غير مدقّق`.

Not on this page: `فرق سعر الصرف`, `لا مرفقات في هذه النسخة.`, `إصدار كشف حساب`, `اعتماد` as a button, `حفظ التسوية`. Those waits are G–J or phase 2.

## Tests

`tests/accounts-view.test.js`. Each test asserts an Arabic string or a number from the fixture. None asserts a helper's source text. The figure tests call the real `Accounts.balances` once C is on the branch. A hardcoded 480,000 that disagrees with `balances` fails.

Fixtures from the plan:

- Spec 12 / the brick screen. `approveLabor` 600,000 and `payLabor` 600,000. Overview shows `عمل معتمد` 600,000, `مدفوع للعمل` 600,000, `مستحق له` 0, `مستحق عليه` 0.
- Partial, spec 11. The same approval and `payLabor` 200,000. `مستحق له` 400,000. `مستحق عليه` 0.
- Overpayment. `payLabor` 700,000 after `approveLabor` 600,000. `مستحق عليه` 100,000. The HTML has one `payLabor` row and no `advanceLabor` row. The 100,000 line does not contain U+2212.
- Statement. Approval 600,000, deduct 50,000, `approveDeduct` of that deduct, advance 100,000, return 30,000. Closing 480,000. `صافي السلف` 70,000. `سلف قائمة عليه` 70,000.
- Same rows plus `settle` 40,000. Closing stays 480,000. `صافي السلف` stays 70,000. `سلف قائمة عليه` is 30,000. The HTML does not contain 520,000.
- Same rows without `approveDeduct`. The deduct shows `بانتظار الاعتماد`. Closing is 530,000.
- `periodBounds('week', '2026-11-15')` is 2026-11-14 through 2026-11-20. `periodBounds('week', '2026-11-14')` and `periodBounds('week', '2026-11-20')` are that same week. `periodBounds('week', '2026-11-21')` is 2026-11-21 through 2026-11-27. `periodBounds('month', '2026-11-15')` is 2026-11-01 through 2026-11-30.

Behaviour:

- Demo owner model: HTML contains `لا توجد حسابات أشخاص.` and does not contain `+ شخص جديد`. The test's `set` is not called with the outbox.
- Site model: HTML is `هذه الشاشة للمالك.` and contains no party name and no create button.
- `canCreateParty` is false when `collectionFor` returns null, and false when `demoRole()` is `owner` even if `collectionFor` returns `parties`.
- Logged-in owner and `collectionFor` returns `parties`: the button is present. Saving `حسن` queues one id, the stored row has no `roles`, and a second click does not add a second id.
- Empty name and an 81-character name do not call `queueDoc`.
- Bad id: `معرّف غير صالح`. Unknown safe id: `الشخص غير متاح`.
- Filters. A `laborQty` is under `قياسات العمل` and not under `الدفعات`. A `payLabor` is under `الدفعات`. An `advanceLabor` is under `السلف`. A `deduct` is on `all` and on neither of those three.
- The four tab strings are present. `حركات المواد`, `المرفقات`, and `العملة` are absent. There is no `<select`.
- The statement HTML has no `#save-statement` and no button labelled `اعتماد`.
- An `overLimit` payment shows `المُرجَع أكبر من الدفعة`. An `overLimit` deduct shows `الخصم أكبر من العمل المعتمد`. An `overLimit` advance shows the amounts and, until question 4 is yes, does not show `المُرجَع والتسوية أكبر من السلفة`.
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
| PR B                 | `public/accounts.js`                                | F does not edit it. The overpayment label and the advance sentence are this sketch's questions.                                                                                                                                                                                                                    |
| PR C                 | `public/accounts.js`                                | F calls `balances` and `statementLines`. The code PR waits until those exist.                                                                                                                                                                                                                                      |
| PR E                 | `public/sync.js`, and the local keys if E adds them | F does not edit `sync.js`. The create button stays absent while `collectionFor` returns null for `docType: 'party'`.                                                                                                                                                                                               |
| Other phase sketches | their own docs files                                | This PR is the one file below. It does not edit them.                                                                                                                                                                                                                                                              |

Service worker. This sketch does not touch `public/sw.js`. At baf4f21f, `VERSION` is `aj-p0-v58` (`public/sw.js` line 1). The code PR sets the next free version at merge time. It does not reserve `aj-p0-v59`. The date fix or the foreman export may take v59. The same string goes in `tests/shell-cache.test.js` (the pins are lines 43, 65, and 93 at this SHA) and in `tests/webkit-upgrade.test.js` line 18 (`MARK`). `tests/sw-version-guard.test.js` lines 31-44 already fail a `public/` edit that does not bump `VERSION`.

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
- C adds `balances` and `statementLines` with the fields in `AccountFigures`. F is blocked on those names.
- D is deployed before E. F does not edit rules and does not need them for the read-only demo. Create-person on a logged-in phone needs D's party create and E's route.
- E routes `docType: 'party'` to `parties` and strips `docType` before the write. The local keys `K.parties`, `K.agreements`, and `K.accountTxns` are E's if E stores rows. At baf4f21f `K` (`public/session.js` line 5) does not have them. If they are still missing when F's code PR rebases onto E, F adds the missing keys and nothing else in that object.
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

## Accounting advisor

Opinion only. This sketch does not ask the advisor again. PR B already recorded the opinion and Ameer's deferral of 2026-11-15 23:22 Baghdad (UTC+3) via EA.

The advisor's label for a payment larger than approved work is `مستحق على الشخص (سلفة)`. The plan keeps one `payLabor` and a negative person balance. PR B left the on-screen words and any confirm step to this screens PR. The recommended words are the approved `مستحق عليه` plus `المتبقي سلفة`. Question 3 is that choice. The confirm step is a write. It belongs with the payment action, not on this read-only page.

The statement layout the advisor already corrected stays the one in section 3 of the plan: advances paid minus, cash returned plus, net advances equal to that difference, deductions negative. F prints those lines from C. It does not put a cash return under `الخصومات ومرتجعات المواد`.

## أسئلة لأمير

الجواب يقفل السؤال. الاقتراح تحت كل واحد.

**1. اسم التبويب.**

التبويب الجديد اسمه «حسابات». هسه بعده مو موافق عليه.

**اقتراح:** موافق. الاسم «حسابات».

**2. نصوص هالصفحة.**

القسم «Strings» بي كل جملة هالصفحة راح تعرضها، جديدة لو قديمة. مو مطلوب توافق على نصوص المواد. جملة «أدخل اسم الشخص» جديدة ومو بالقائمة القديمة، وتطلع إذا الاسم فاضي أو أطول من 80 حرف.

**اقتراح:** موافق على نصوص هالصفحة مثل ما مكتوبة، ونضيف «أدخل اسم الشخص».

**3. إذا الدفع أكبر من الشغل المعتمد.**

المثال: شغل معتمد 600,000 ودفعة 700,000. الصفحة تبيّن 100,000. الكلمة المقترحة «مستحق عليه» ومعها «المتبقي سلفة». المحاسب اقترح «مستحق على الشخص (سلفة)». ما نفتح سلفة ثانية بالسجل. سؤال «تأكد قبل الحفظ» ماله بهالصفحة، لأن زر الدفع يجي بطلب لاحق.

**اقتراح:** نبقى على «مستحق عليه» و«المتبقي سلفة»، وما نضيف جملة جديدة، والتأكيد يأجل لطلب الدفع.

**4. إذا الإرجاع والتسوية أكبر من السلفة.**

جملة «المُرجَع أكبر من الدفعة» للدفعة. جملة «الخصم أكبر من العمل المعتمد» للخصم، وموافقة من قبل. السلفة ما إلها جملة.

**اقتراح:** نضيف «المُرجَع والتسوية أكبر من السلفة».

**5. زر الشخص الجديد بالتجربة.**

بالتجربة (`?role=owner`) الزر «+ شخص جديد» ما يبين، حتى ما ينحط معرف بالصادر. بعد تسجيل الدخول، وإذا إرسال الأشخاص موجود من طلب E، الزر يبين للمالك.

**اقتراح:** أي. الزر للمسجّل بس، مو للتجربة.

**6. ملاحظة الشخص.**

التخزين يسمح بملاحظة. ماكو نص موافق لها. الفورم بي اسم الشخص بس، والملاحظة ما تنرسل.

**اقتراح:** الاسم بس بهالنسخة.

**7. «هذا المشروع».**

الحبة تعرض المشاريع اللي بيها عقد أو حركة لهذا الشخص. ما تعرض كل مشاريع الشركة.

**اقتراح:** أي، بس مشاريعه.

مقفل من قبل، مو سؤال: أربعة تبويبات، دينار بس وبدون اختيار عملة، المالك بس، «مستحق عليه»، «غير مدقّق»، «لا يُعتمد الكشف وفيه مبلغ غير مدقّق»، و«الخصم أكبر من العمل المعتمد». الزر ما يبين قبل ما E تصير بنفس النسخة.

## pstack for the code PR

The app is not claimed to be pstack-compliant. This sketch does not mark an inventory row «مطبّقة».

Plan section 16 names the code PR's inventory rows: `principle-experience-first` and `maintain-verification-skill`.

- `principle-experience-first` is already «مطبّقة». The code PR adds an evidence link. It does not add a next step that reads as if the skill were missing. The decision the row records: the page ships the empty list, the four tabs, and the live statement, and it does not ship the twelve write buttons.
- `maintain-verification-skill` is «ناقصة». The code PR can add a next-step sentence. It does not flip the status word. The sentence names the two ids and the evidence directory. The status stays until a maintain pass actually drives them.

`principle-subtract-before-you-add` is the smaller v1, which Ameer already picked (section 14). F does not reopen that cut. The code PR does not flip that row either.

Skills this phase uses, from the plan and from the screen work: `architect` (this file; arena was not run), `feature` (the code PR, after this sketch is accepted), `tdd` (the tests above, written before the markup), `maintain-verification-skill` (the ids above, edited in the code PR), `principle-experience-first`, `principle-model-the-domain` (one fold, one party shape), `principle-boundary-discipline` (the view reads C's figures), `principle-minimize-reader-load` (one module, four call sites in `render.js`).

## Decisions only Ameer can make

- Say go on this sketch before any code PR.
- Answer the seven questions above. The code PR does not pick the tab name, the overpayment words, the advance sentence, the demo button, the note field, or the project pills.
- Merge, later, only after Architect's review of the code SHA and CI 4/4. This sketch does not merge itself.

Already decided, and not reopened here: IQD only, four tabs, filters on `الحركات`, owner only, create-person absent until E is in the same build, the empty demo list, `مستحق عليه`, `غير مدقّق`, the statement sentence about an unreviewed cash row, and `الخصم أكبر من العمل المعتمد`.
