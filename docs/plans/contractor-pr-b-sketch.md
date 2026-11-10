# PLAN ONLY: contractor PR B sketch

No code in this pull request. No edit to `public/`, `firestore.rules`, or `public/sw.js`. The code PR comes after the Architect reviews this sketch and Ameer says go.

Parent plan: `plan-contractor-module-r2.28.md`, sha256 `ef1c98d08a7118ed35469d250c81605a7f17f518d949f8446b8c63bb1869c8a2`. Status note: handoff `plan-status-r2.29.md`. Base for the code PR: `0f17cf31cfb8401323f7d0d1ee3e3ecb6bbfc2e9` (PR #71 squash, service worker `aj-p0-v57`), rebased after PR #72.

Arena was not run. Ameer's gate bans it (cost). The shape is the one already approved in r2.28, plus the deferrals the Architect assigned to PR B. This file is the sketch those gates asked for before code.

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
4. LOW-3. Uuid version-4 bits. Optional. Default is to skip it. Ameer can put it in this code PR.
5. Spec 8. Amount-milestone math. Percent stays refused.

`returnAdvance` is in the nine purposes and is the cash return of `advanceLabor`. B posts it. It is not a material return and not `refundLabor`.

## Files the code PR may edit

| File                                                                        | Change                                                                                                                                                                             |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/accounts.js`                                                        | Extend `post`, `workPosition`, `PURPOSES` pointers, `cashPointerErrors`, and `projectCost`. Add `personBalance`.                                                                   |
| `tests/accounts.test.js`                                                    | Behaviour tests below. The spec 1, 2, 6, and 7 tests stay green. The test that treats every `milestone` as an unknown method changes: amount mode is accepted, percent is refused. |
| `public/session.js`                                                         | Only if Ameer includes LOW-3.                                                                                                                                                      |
| `public/sw.js`, `tests/shell-cache.test.js`, `tests/webkit-upgrade.test.js` | Version pins only, after #72. See Sequencing.                                                                                                                                      |
| `docs/PSTACK_INVENTORY.md`                                                  | Evidence on the PR B rows: `principle-laziness-protocol`, `principle-prove-it-works`, `tdd`. Do not flip a status word.                                                            |

Do not edit `firestore.rules`, `public/ledger.js`, `public/render.js`, `public/sync.js`, `public/index.html`, or `package.json` / `.github/workflows/ci.yml` unless a rebase against #72 makes the two test-list strings differ. They must stay identical. No new test file, so a clean rebase should not need those two files.

`post` still returns a document. It does not call `queueDoc` and does not write IndexedDB or Firestore.

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
 *   paidAs?: 'payLabor' | 'advanceLabor',
 *   amount?: number,
 *   agreement?: LaborAgreement,
 *   approvedQty?: number,
 *   approved?: boolean,
 *   targetId?: string,
 *   settlesId?: string
 * }} PostInput
 */

/**
 * @typedef {{
 *   purpose: string,
 *   ledger: 'labor',
 *   amount: number,
 *   paidAs?: 'payLabor' | 'advanceLabor',
 *   targetId?: string,
 *   settlesId?: string,
 *   effect: { cost: number, person: number, cash: number }
 * }} AccountDoc
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
 * whose `targetId` is that deduct. `settle` adds nothing.
 */
function personBalance(docs)

/**
 * @param {string} projectId
 * @param {readonly unknown[]} txns
 * @returns {number}
 */
function projectCost(projectId, txns) // return 0. PR K replaces this.
```

`workPosition` keeps its current signature and also accepts `method: 'milestone'`.

`PURPOSES.approveLabor.points` becomes `{ targetId: ['laborQty'] }` and `required` includes `'targetId'`. `PURPOSES.approveDeduct.points` becomes `{ targetId: ['deduct'] }` and `required` includes `'targetId'`. No other purpose row gains a material ledger.

`cashPointerErrors` fails when a cash purpose (`needsApproval` false and `effect.cash` not 0) points at a purpose that has `needsApproval` true, or at `approveLabor`, or at `approveDeduct`. A pointer at `laborQty` or `deduct` fails. `refundLabor` pointing at `payLabor` still passes.

`post` rules, one document or an error list, never both a doc and an error:

| Action          | Accepts                                                              | Refuses                                                                                   |
| --------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `payment`       | `paidAs` `payLabor` or `advanceLabor`, amount from 1 through 1e10    | missing `paidAs`, amount 0, negative, fractional, or above 1e10                           |
| `approveLabor`  | a labor agreement and `targetId`, earned at least 1                  | earned 0, inexact unit split, percent milestone, partial lump or partial amount-milestone |
| `refundLabor`   | `targetId`, amount from 1 through the named payment's amount         | amount above that payment                                                                 |
| `returnAdvance` | `targetId` at an `advanceLabor`, amount from 1 through that advance  | amount above that advance                                                                 |
| `deduct`        | `targetId` at an `approveLabor`, amount from 1 through that approval | amount above that approval                                                                |
| `approveDeduct` | `targetId` at a `deduct`                                             | any other target                                                                          |
| `settle`        | `settlesId` at an `advanceLabor`, amount from 1 through 1e10         | missing `settlesId`                                                                       |

Several refunds that together exceed one payment are not refused here. The plan says the rules cannot see the other rows. The warning string is already in the 88. The screen that shows it is not B.

`personBalance` for the brick fixture is 0: `approveLabor` 600,000 then `payLabor` 600,000. A `payLabor` of 700,000 against that approval is -100,000. That negative number is the overpayment. B does not create an `advanceLabor` to hold it.

`projectCost` does not read `txns`. The 600,000 project-cost half of the fixture is PR K, against plan line 629 (legacy `countedEntries` plus approved cost, reversals netted, `syncErrors` and superseded rows omitted, a `deduct` silent until `approveDeduct`). B must not grow the current loop.

Spec 8. An agreement `{ method: 'milestone', milestoneMode: 'amount', milestoneAmount: N }` earns N when approved, and a different `amount` is refused. `{ milestoneMode: 'percent' }` is refused. B does not build the slot id `000` plus the agreement hex plus a generation. That id is PR D and PR E.

LOW-3, only if Ameer includes it. In `uuid()`, after the 16 bytes are filled and before the hex is written:

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
- `deduct` 50,000 with no `approveDeduct` does not change `personBalance`. The same list plus `approveDeduct` aimed at that deduct lowers `personBalance` by 50,000. `projectCost` stays 0.
- `settle` of an advance has cost 0, person 0, and cash 0, and `personBalance` does not move.
- Amount milestone 250,000 earns 250,000. A partial amount is refused. Percent is refused.
- Caps: `unitQty` 1000001, `qty` 100000001, a product above 1e16, an amount above 1e10, a negative quantity, a fractional quantity, `approveLabor` with earned 0, a payment of 0 and a payment above 1e10.
- `cashPointerErrors` on the real table is empty. A copy that points `payLabor` at `approveLabor` is not empty. A copy that points `refundLabor` at `laborQty` is not empty.
- If LOW-3 is in: the fallback id matches the version-4 pattern above.

No new Arabic string. Error codes stay the English tokens `paidAs`, `range`, `inexact`, `earned`, `lump`, `milestone`, `percent`, `targetId`, `settlesId`, `cap`, `method`, `overflow`, `amount`.

## Blast radius

Callers of `Accounts` at `0f17cf31`: tests only. `render.js` does not call it. Ledger totals, CSV, and `subcontractBalance` do not change. No rules and no IAM.

`projectCost`'s non-null loop is deleted, so a later edit cannot ship that wrong branch by flipping the constant. PR K writes the plan 629 function in its own PR.

The spec 8 test change is the one behaviour change to an existing assertion: `milestone` is no longer always `method`.

## Sequencing with PR #72

PR #72 is about to publish service worker `aj-p0-v58`. This sketch does not touch `sw.js`. The code PR rebases onto main after #72 and sets the next free version, `aj-p0-v59` if #72 landed on v58, otherwise one higher than whatever `public/sw.js` says. The same number goes in the three `tests/shell-cache.test.js` pins and in `tests/webkit-upgrade.test.js` `MARK`.

Overlap to rebase, not to edit in parallel: `public/sw.js`, `tests/shell-cache.test.js`, `tests/webkit-upgrade.test.js`, `docs/PSTACK_INVENTORY.md`, and, only if the lists diverge, `.github/workflows/ci.yml` and `package.json`. `public/session.js` overlaps only if LOW-3 is included; #71's hunks are the fallback and `SHELL_FILES`, #72's hunks are elsewhere. Re-run the unit tests after the rebase.

## Accounting advisor

Opinion only. Ameer decides.

1. A payment larger than approved work. The plan keeps it as one `payLabor` and a negative person balance. The spec's phrase "overpayment beyond earned = advance balance" can be read as a second `advanceLabor` row. Which reading should the books use?
2. One `refundLabor` or `deduct` larger than its named row is refused. Several refunds that together exceed that row wait for the screen warning. Is that split still right?
3. An amount milestone is earned in full or not at all. Percent stays out. Any objection before B codes that?

## Decisions only Ameer can make

- Say go on this sketch before any code PR.
- Include the uuid version-4 bits, or leave the #71 fallback.
- If the advisor's answer on overpayment differs from one `payLabor` and a negative balance, pick one. The code PR does not pick.
- Do not set `CONTRACTOR_COST_START` in B. Q2 is still «بعدين». PR K stays gated.
- Merge, later, only after the Architect's review of the code SHA and CI 4/4. This sketch does not merge itself.
