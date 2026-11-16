# PLAN ONLY: contractor PR B sketch

No code in this pull request. No edit to `public/`, `firestore.rules`, or `public/sw.js`. The code PR comes after the Architect reviews this sketch and Ameer says go.

Parent plan: `plan-contractor-module-r2.28.md`, sha256 `ef1c98d08a7118ed35469d250c81605a7f17f518d949f8446b8c63bb1869c8a2`. Status note: handoff `plan-status-r2.29.md`. Base for the code PR: `0f17cf31cfb8401323f7d0d1ee3e3ecb6bbfc2e9` (PR #71 squash, service worker `aj-p0-v57`), rebased after PR #72.

Arena was not run. Ameer's gate bans it (cost). The shape is the one already approved in r2.28, plus the deferrals the Architect assigned to PR B. This file is the sketch those gates asked for before code.

Revision r2, against Architect NOTES on `bb3be3d1` (review sha256 starts `bcfbe09d`). Ameer's decisions of 2026-11-15 23:22 Baghdad (UTC+3) via EA are recorded below.

Revision r3, against Architect NOTES on the r2 draft (sha256 starts `421abe84`; review sha256 starts `e2ddf458`).

## Scope

Plan r2.28 lines 937-948. Order is A, then B, then C, then D. PR A is merged. PR B does not start C, D, E, F, K, or G-J.

From the table, PR B is:

- v1 payments and labor advances
- `refundLabor`
- labor `deduct` and `approveDeduct`
- `settle` with effect zeros
- overpayment as a negative person balance, not a new purpose
- the labor fixture `payLabor` 600,000 after `approveLabor` 600,000
- no Firestore rows

Not in B: material purposes, `refundPayment`, the invoice function, screens, rules, the adopt path, and project-cost arithmetic.

Deferrals now assigned to B, from the Architect's review of PR #71 and from `plan-status-r2.29.md`:

1. L-1 / LOW-1. `approveLabor.points.targetId` is `['laborQty']`. `approveDeduct.points.targetId` is `['deduct']`. A cash purpose may not point at `approveLabor`. That closes the plan line 145 hole, where a cash pointer at an `appr_` must fail.
2. LOW-2. `projectCost` becomes `return 0` and a comment that PR K owns the real function. No date-branch logic while `CONTRACTOR_COST_START` is `null`.
3. LOW-4. Tests for the caps, negative or fractional quantities, `approveLabor` with earned 0, and payment bounds.
4. LOW-3. Uuid version-4 bits. Optional. Still undecided. Default is to skip it until Ameer includes it.
5. Spec 8. Amount-milestone math. Percent stays refused.

`returnAdvance` is in the nine purposes and is the cash return of `advanceLabor`. B posts it. It is not a material return and not `refundLabor`.

## Files the code PR may edit

| File                                                                        | Change                                                                                                                                                                             |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/accounts.js`                                                        | Extend `post`, `workPosition`, `PURPOSES` pointers, `cashPointerErrors`, and `projectCost`. Add `personBalance`, the one fold PR C extends into `balances()` (plan 371).           |
| `tests/accounts.test.js`                                                    | Behaviour tests below. The spec 1, 2, 6, and 7 tests stay green. The test that treats every `milestone` as an unknown method changes: amount mode is accepted, percent is refused. |
| `public/session.js`                                                         | Only if Ameer includes LOW-3.                                                                                                                                                      |
| `public/sw.js`, `tests/shell-cache.test.js`, `tests/webkit-upgrade.test.js` | Version pins only, after #72. See Sequencing.                                                                                                                                      |
| `docs/PSTACK_INVENTORY.md`                                                  | Evidence on the PR B rows: `principle-laziness-protocol`, `principle-prove-it-works`, `tdd`. Do not flip a status word.                                                            |

Do not edit `firestore.rules`, `public/ledger.js`, `public/render.js`, `public/sync.js`, `public/index.html`, or `package.json` / `.github/workflows/ci.yml` unless a rebase against #72 makes the two test-list strings differ. They must stay identical. No new test file, so a clean rebase should not need those two files.

`post` still returns a document. It does not call `queueDoc` and does not write IndexedDB or Firestore.

## Usage

A test, or a later screen, already holds the person's in-memory ledger. The caller mints `id` with `uuid()` and calls `post(action, input)`, either with `target`, `siblings`, and `reversedIds`, or with one `ledger` snapshot. When `ledger` is given, `post` derives `target`, `siblings`, and `reversedIds` from it, and refuses with `ledger` if those explicit fields are also given. In either mode `post` itself filters siblings to the same line and the relevant purposes; it never trusts the caller's list. `post` returns `{ doc, errors }` and does not read storage. After a successful post the caller may append `doc` and call `personBalance(docs)` on the same list. PR C extends that one function; it does not write a second fold.

Second design considered: `post` itself reads the ledger from IndexedDB or a module-level store to resolve `targetId`. Rejected because `post` must stay a pure document builder: it already returns a document, does not call `queueDoc`, and does not write IndexedDB or Firestore. Passing the target and siblings, or one ledger snapshot, is enough for the caps and keeps that purity. Arena was not run.

## Types and signatures

All of these stay in `public/accounts.js`. Names already exported stay exported.

```javascript
/**
 * @typedef {'lump'|'unit'|'daily'|'milestone'} LaborMethod
 * LaborMethod is the allowed set. The argument type stays `method?: string`
 * so a bad method is a normal object the function can refuse.
 */

/**
 * @typedef {{
 *   method?: string,
 *   lumpAmount?: number,
 *   unitRate?: number,
 *   unitQty?: number,
 *   dayRate?: number,
 *   unitName?: string,
 *   milestoneAmount?: number,
 *   milestoneMode?: 'amount' | 'percent'
 * }} LaborAgreement
 */

/**
 * @typedef {'payment'|'laborQty'|'approveLabor'|'refundLabor'|'returnAdvance'|'deduct'|'approveDeduct'|'settle'} PostAction
 */

/**
 * @typedef {{
 *   id: string,
 *   purpose: string,
 *   ledger: 'labor',
 *   amount?: number,
 *   paidAs?: 'payLabor' | 'advanceLabor',
 *   targetId?: string,
 *   settlesId?: string,
 *   effect: { cost: number, person: number, cash: number }
 * }} AccountDoc
 * `id` is required so `personBalance` can match an `approveDeduct` to its
 * `deduct`. `amount` is omitted on `approveDeduct` (plan 428). Every other
 * purpose in this sketch still carries an amount.
 */

/**
 * @typedef {{
 *   id: string,
 *   paidAs?: 'payLabor' | 'advanceLabor',
 *   amount?: number,
 *   agreement?: LaborAgreement,
 *   approvedQty?: number,
 *   approved?: boolean,
 *   targetId?: string,
 *   settlesId?: string,
 *   target?: AccountDoc,
 *   siblings?: readonly AccountDoc[],
 *   reversedIds?: ReadonlySet<string>,
 *   ledger?: readonly AccountDoc[]
 * }} PostInput
 * The caller mints `id` with `uuid()`. `post` copies it onto the returned
 * `AccountDoc`. This uses the existing `uuid()`; it does not depend on the
 * optional LOW-3 version-4 bits.
 * Caps need the target's purpose and amount, plus the live unreversed
 * siblings of the same line (M1). The caller passes `target`, `siblings`,
 * and `reversedIds`, or one `ledger` snapshot. When `ledger` is given,
 * `post` derives `target`, `siblings`, and `reversedIds` from it, and
 * refuses with `ledger` if any of those explicit fields are also given.
 * In either mode `post` itself filters siblings to the same
 * `targetId`/`settlesId` line and the relevant purposes. It never trusts
 * the caller's list.
 * `post` refuses with `targetId` when the target is missing or has
 * the wrong purpose, and with `settlesId` when the named field is
 * `settlesId`.
 */

/**
 * @param {PostAction} action
 * @param {PostInput} input
 * @returns {{ doc: AccountDoc | null, errors: string[] }}
 */
function post(action, input)

/**
 * @param {readonly AccountDoc[]} docs
 * @returns {number}
 * Person sign from the effect table. Positive: the company owes the person.
 * Negative: the person holds the company's money.
 * A `deduct` counts only when some doc in the same list is `approveDeduct`
 * whose `targetId` is that deduct's `id`. `settle` adds nothing.
 * B's fold does not filter `rev_`, `sup_`, or `syncErrors`. PR C adds
 * liveness (plan 143) to this same function when it extends it into
 * `balances()` (plan 371). C does not write a second fold.
 */
function personBalance(docs)

/**
 * @param {string} projectId
 * @param {readonly unknown[]} txns
 * @returns {number}
 */
function projectCost(projectId, txns) // return 0. PR K replaces this.
```

`workPosition` keeps its current signature and also accepts `method: 'milestone'`. If `milestoneMode` is missing, it treats the agreement as an amount milestone. If method fields are mixed (more than one method field set), it refuses with `method` (plan 545, 594: exactly one method field set). `milestoneAmount` must be an integer from 1 to 1e10 (plan 545, 594). The #71 test fixture `{ method: 'milestone', lumpAmount: 1 }` then fails as `milestone`, not `method`: `method: 'milestone'` is now a known method, and the fixture has no valid `milestoneAmount`.

`PURPOSES.approveLabor.points` becomes `{ targetId: ['laborQty'] }` and `required` includes `'targetId'`. `PURPOSES.approveDeduct.points` becomes `{ targetId: ['deduct'] }` and `required` includes `'targetId'`. No other purpose row gains a material ledger.

`cashPointerErrors` fails when a cash purpose (`needsApproval` false and `effect.cash` not 0) points at a purpose that has `needsApproval` true, or at `approveLabor`, or at `approveDeduct`. A pointer at `laborQty` or `deduct` fails. `refundLabor` pointing at `payLabor` still passes.

`post` rules, one document or an error list, never both a doc and an error:

| Action          | Accepts                                                              | Refuses                                                                                   |
| --------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `payment`       | `paidAs` `payLabor` or `advanceLabor`, amount from 1 through 1e10    | missing `paidAs`, amount 0, negative, fractional, or above 1e10                           |
| `approveLabor`  | a labor agreement and `targetId`, earned at least 1                  | earned 0, inexact unit split, percent milestone, partial lump or partial amount-milestone |
| `refundLabor`   | `targetId` at a `payLabor`, amount from 1 through that payment       | missing or wrong-type target, amount above that payment, or over the live cumulative cap  |
| `returnAdvance` | `targetId` at an `advanceLabor`, amount from 1 through that advance  | missing or wrong-type target, amount above that advance, or over the live cumulative cap  |
| `deduct`        | `targetId` at an `approveLabor`, amount from 1 through that approval | missing or wrong-type target, amount above that approval, or over the live cumulative cap |
| `approveDeduct` | `targetId` at a `deduct`. Stores no `amount` (plan 428).             | missing or wrong-type target, or over the live cumulative cap                             |
| `settle`        | `settlesId` at an `advanceLabor`, amount from 1 through that advance | missing or wrong-type target, amount above that advance, or over the live cumulative cap  |

A missing or wrong-type target is `targetId`, or `settlesId` when the named field is `settlesId`. The single-row caps (one refund, deduct, return, or settle above its named row) stay refused here and were already approved. `settle` is capped at the named advance, like `returnAdvance`, so «سلف قائمة عليه» (plan 364) cannot go negative from one settle.

Cumulative cap (Approved by Ameer 2026-11-15 23:22 via EA). This replaces the plan 358/603 warn-only behaviour. `post` enforces the cap locally in `accounts.js` and refuses with the error code `cumulative`. It must not claim full enforcement.

The new amount plus the live unreversed siblings must not exceed the line:

- `refundLabor` against the named `payLabor`
- `deduct` against the named `approveLabor`
- `returnAdvance` plus `settle` against the named `advanceLabor`

"Live" means no `rev_` for that id, and, for a deduct, no `rej_`. A pending (unapproved, unrejected) deduct counts toward the cap. That is the conservative choice: it prevents two pending deducts that together exceed the approval. In labor v1 a refund and a deduct never share a line: refunds target `payLabor`, deducts target `approveLabor`.

`post('approveDeduct')` re-runs the deduct-line cumulative cap against the approved, live deducts on that line, plus the deduct being approved. It is local only, like the rest, and refuses with `cumulative`.

Two offline phones can each post a valid row, because each sees no siblings. Rules cannot sum other documents, and a running-total document would need new rules, which are outside v1 and outside Ameer's approved rules change. Both rows sync and both stay, because both are real cash. PR C flags over-limit lines after sync (`overLimit`) and never drops either row. The screens PR shows the existing approved string #53 «المُرجَع أكبر من الدفعة» on that payment, and the approved new string «الخصم أكبر من العمل المعتمد» on a deduct overrun (Approved by Ameer 2026-11-15 23:22 via EA). An advance-line overrun (`returnAdvance` plus `settle`) has no display string: #53 says «الدفعة» and does not fit an advance. The screens PR needs one more string for this and will ask Ameer then. Proposed: «المُرجَع والتسوية أكبر من السلفة». B ships only the `cumulative` code. The statement cannot be finalised while an over-limit line exists, even after `revw_`, until one row is reversed with `rev_` or, for an unapproved deduct, rejected with `rej_`. That uses the existing «لا يُعتمد الكشف وفيه مبلغ غير مدقّق» gate. Rules stay unchanged.

`personBalance` for the brick fixture is 0: `approveLabor` 600,000 then `payLabor` 600,000. A `payLabor` of 700,000 against that approval is -100,000. That negative number is the overpayment. B does not create an `advanceLabor` to hold it. The on-screen label defaults to the approved «مستحق عليه» plus «المتبقي سلفة». The advisor's label «مستحق على الشخص (سلفة)» and any confirm step that shows the excess are deferred to the screens PR, not B (Ameer, 2026-11-15 23:22 via EA).

`projectCost` does not read `txns`. The 600,000 project-cost half of the fixture is PR K, against plan line 629 (legacy `countedEntries` plus approved cost, reversals netted, `syncErrors` and superseded rows omitted, a `deduct` silent until `approveDeduct`). B must not grow the current loop.

Spec 8. An agreement `{ method: 'milestone', milestoneMode: 'amount', milestoneAmount: N }` earns N when approved, and a different `amount` is refused. `{ milestoneMode: 'percent' }` is refused. Missing `milestoneMode` and mixed method fields follow the `workPosition` rules above. B does not build the slot id `000` plus the agreement hex plus a generation. That id is PR D and PR E.

LOW-3, only if Ameer includes it. Still optional and pending. In `uuid()`, after the 16 bytes are filled and before the hex is written:

```javascript
bytes[6] = (bytes[6] & 0x0f) | 0x40;
bytes[8] = (bytes[8] & 0x3f) | 0x80;
```

The test matches `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$` on both the `getRandomValues` path and the `Math.random` path. The plan's `^[0-9a-f-]{36}$` check stays too. Old `id-` rows are not rewritten.

## Tests (behaviour)

All in `tests/accounts.test.js`. Each asserts a number, a purpose, or an error code. None asserts a helper's source text.

- Unchanged: spec 1, spec 2, the inexact 10/4 split, spec 6, spec 7, a missing `paidAs`.
- `payLabor` 600,000 after `approveLabor` 600,000. `personBalance` is 0. `projectCost` is 0.
- `payLabor` 700,000 after that approval. `personBalance` is -100,000. No second purpose is created.
- `advanceLabor` 100,000 then `returnAdvance` 30,000. The return's person effect is +1 and its cash effect is -1. A return of 100,001 is refused.
- `refundLabor` 50,000 against a `payLabor` of 600,000. Person effect +1, cost 0. A refund of 600,001 is refused.
- `deduct` 50,000 with no `approveDeduct` does not change `personBalance`. The same list plus `approveDeduct` aimed at that deduct's `id` lowers `personBalance` by 50,000. `projectCost` stays 0. `post('approveDeduct')` stores no amount.
- `settle` of an advance has cost 0, person 0, and cash 0, and `personBalance` does not move. A settle above the named advance is refused, so the open advance cannot go negative.
- Amount milestone 250,000 earns 250,000. A partial amount is refused. Percent is refused. Missing `milestoneMode` on an amount milestone earns the amount. Mixed method fields are `method`. `milestoneAmount` 0 or above 1e10 is refused. The old `{ method: 'milestone', lumpAmount: 1 }` fixture is `milestone`.
- Caps: `unitQty` 1000001, `qty` 100000001, a product above 1e16, an amount above 1e10, a negative quantity, a fractional quantity, `approveLabor` with earned 0, a payment of 0 and a payment above 1e10.
- `cashPointerErrors` on the real table is empty. A copy that points `payLabor` at `approveLabor` is not empty. A copy that points `refundLabor` at `laborQty` is not empty.
- A missing or wrong-purpose target is `targetId`, or `settlesId` for `settle`. Passing both `ledger` and explicit `target` / `siblings` / `reversedIds` is `ledger`. A sibling that is not on the same line does not count toward the cap.
- Cumulative: a second `refundLabor` of 400,000 against a 600,000 payment that already has a live 400,000 refund is `cumulative`. The same pattern for two `deduct` rows against one `approveLabor`, and for `returnAdvance` plus `settle` against one `advanceLabor`. A rejected (`rej_`) deduct does not count. A pending (unapproved, unrejected) deduct does. `post('approveDeduct')` that, together with already-approved live deducts on the line, exceeds the `approveLabor` is `cumulative`.
- If LOW-3 is in: the fallback id matches the version-4 pattern above.

B ships no new Arabic string in code. Error codes stay the English tokens `paidAs`, `range`, `inexact`, `earned`, `lump`, `milestone`, `percent`, `targetId`, `settlesId`, `cap`, `method`, `overflow`, `amount`, `cumulative`, `ledger`, `agreement`, `id`. The screens PR, not B, shows #53 «المُرجَع أكبر من الدفعة» on a payment overrun and the approved «الخصم أكبر من العمل المعتمد» on a deduct overrun. An advance-line overrun (`returnAdvance` plus `settle` against one advance) has no display string: #53 says «الدفعة» and does not fit an advance. The screens PR needs one more string for this and will ask Ameer then. Proposed: «المُرجَع والتسوية أكبر من السلفة». B ships only the `cumulative` code.

v1 strings 88 → 89: «الخصم أكبر من العمل المعتمد» (Ameer 2026-11-15 23:22 via EA) is added to `strings-contractor-module-r2.22.md` (9d25840a…) in its next revision, and plan r2.28 lines 358/603 (warn → refuse) are amended in the next plan status note.

## Blast radius

Callers of `Accounts` at `0f17cf31`: tests only. `render.js` does not call it. Ledger totals, CSV, and `subcontractBalance` do not change. No rules and no IAM.

`projectCost`'s non-null loop is deleted, so a later edit cannot ship that wrong branch by flipping the constant. PR K writes the plan 629 function in its own PR.

The spec 8 test change is the one behaviour change to an existing assertion: `milestone` is no longer always `method`. The `#71` fixture `{ method: 'milestone', lumpAmount: 1 }` becomes `milestone`.

## Sequencing with PR #72

PR #72 is about to publish service worker `aj-p0-v58`. This sketch does not touch `sw.js`. The code PR rebases onto main after #72 and sets the next free version, `aj-p0-v59` if #72 landed on v58, otherwise one higher than whatever `public/sw.js` says. The same number goes in the three `tests/shell-cache.test.js` pins and in `tests/webkit-upgrade.test.js` `MARK`.

Overlap to rebase, not to edit in parallel: `public/sw.js`, `tests/shell-cache.test.js`, `tests/webkit-upgrade.test.js`, `docs/PSTACK_INVENTORY.md`, and, only if the lists diverge, `.github/workflows/ci.yml` and `package.json`. `public/session.js` overlaps only if LOW-3 is included; #71's hunks are the fallback and `SHELL_FILES`, #72's hunks are elsewhere. Re-run the unit tests after the rebase.

## Accounting advisor

Opinion only. The advisor's answers and Ameer's decisions of 2026-11-15 23:22 Baghdad (UTC+3) via EA are recorded here.

1. A payment larger than approved work. The plan keeps it as one `payLabor` and a negative person balance. The spec's phrase "overpayment beyond earned = advance balance" can be read as a second `advanceLabor` row. The books stay with one `payLabor` and a negative balance. The advisor's label «مستحق على الشخص (سلفة)» and any confirm step are deferred to the screens PR, not B. The default on-screen wording stays the approved «مستحق عليه» plus «المتبقي سلفة».
2. One `refundLabor` or `deduct` larger than its named row is refused. Several refunds or deducts that together exceed that row, and `returnAdvance` plus `settle` against one advance, are refused locally with `cumulative` (Approved by Ameer 2026-11-15 23:22 via EA). This replaces the plan 358/603 warn-only behaviour. Two offline phones can each post a valid row; after sync, C flags the over-limit line, both rows stay, and the statement cannot be finalised until one is reversed with `rev_` or, for an unapproved deduct, rejected with `rej_`. The screens PR reuses «المُرجَع أكبر من الدفعة» and uses the approved new string «الخصم أكبر من العمل المعتمد». An advance-line overrun needs one more string; the screens PR will ask Ameer then. Never claim full enforcement.
3. An amount milestone is earned in full or not at all. Percent stays out. No objection before B codes that.

## Decisions only Ameer can make

- Say go on this sketch before any code PR.
- Include the uuid version-4 bits, or leave the #71 fallback. Still optional and pending. The code PR does not pick.
- Do not set `CONTRACTOR_COST_START` in B. Q2 is still «بعدين». PR K stays gated.
- Merge, later, only after the Architect's review of the code SHA and CI 4/4. This sketch does not merge itself.

Already decided, 2026-11-15 23:22 Baghdad (UTC+3) via EA:

- Cumulative cap: refuse on the phone at posting time. The sum of the live unreversed refunds or deducts must be ≤ the line amount, with the same treatment for `returnAdvance` plus `settle` against the advance. For two offline phones, flag after sync; the statement cannot be finalised until one is reversed with `rev_` or, for an unapproved deduct, rejected with `rej_`. This replaces plan 358/603 warn-only behaviour. (Approved by Ameer 2026-11-15 23:22 via EA)
- New string approved: «الخصم أكبر من العمل المعتمد» for the deduct overrun. B does not add it to the app; the screens PR does. v1 strings 88 → 89: «الخصم أكبر من العمل المعتمد» (Ameer 2026-11-15 23:22 via EA) is added to `strings-contractor-module-r2.22.md` (9d25840a…) in its next revision, and plan r2.28 lines 358/603 (warn → refuse) are amended in the next plan status note. An advance-line overrun has no display string; the screens PR needs one more string and will ask Ameer then. B ships only the `cumulative` code.
- The advisor's overpayment label and confirm step are deferred to the screens PR, not B. Default label: «مستحق عليه» plus «المتبقي سلفة».
