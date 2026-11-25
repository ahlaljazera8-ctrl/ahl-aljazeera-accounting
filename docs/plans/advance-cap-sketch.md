# PLAN-cap (r3): server-side cumulative cap on draws against one advance (OPEN-6)

**Status:** implemented on this branch as one draft PR. Not merged. Not deployed.
**Plan sha256:** `e02a588007b6797cc15c2317536134cf3fffa832ef4c4c6035ac97c5ac35791c`
**Base:** `main` `4d30d1176a01e812429ae866124da710e08a4660`
**Approval:** Architect CONFIRMED (review sha `d0428faf…`). Ameer, through EA, 2026-11-25 07:56 Baghdad: «إي، السقف بشغلة منفصلة قبل J».

This file is the repo copy of PLAN-cap r3. The code in this PR follows it. The three answers below are the only places the code moves past the plan's written default.

## Ameer's answers (2026-11-25 09:00 Baghdad, via EA)

1. On a true over-cap refusal at the final read, the row shows «المُرجَع والتسوية أكبر من السلفة» instead of «رُفض الإرسال». This is the existing Q19 sentence (`public/accounts-payment.js`). It is the only new placement. A dead-advance refusal and a rules denial still show «رُفض الإرسال». Covered by U8 and C15.
2. The deploy steps in §9, including the 2-minute wait, stand. This PR does not deploy.
3. #110's wording is already on main, so it ships with the cap. No extra diff.

## 1. The invariant

For every live `accountTxns` body `A` with `purpose == 'advanceLabor'`:

```
Draws(A) = live stl/settle with settlesId == A.id
         or live body/returnAdvance with targetId == A.id
live(d)  = no accountTxns/rev_<d.id>
```

- **INV-1.** After an accepted write that adds a live draw, `advanceCaps/A.id.drawn ≤ A.amount`.
- **INV-2.** `drawn` is the counted sum once the doc was seeded. A low seed loosens the cap. A high seed, or a reversal written under the old rules, tightens it. There is no in-app repair. The remedy is the R4 collection rename.
- **INV-3.** A reversal is never refused for capacity or liveness. `drawn = max(0, drawn − amount)`, including when `drawn > cap`, when the seed was low, and when the advance is already reversed.
- **INV-4.** No settle, returnAdvance, or `rev_` of either is created unless the same write sets `advanceCaps/<advance>.lastOpId` to that doc's id. No counter write is accepted unless the same write creates the op it names.

Deduct, refundLabor, reclassAdvance, and `revw_` are not draws. A `rev_` of a `revw_` keeps purpose `returnAdvance`, so the rules test `kind`.

## 2. Design

`accountTxns` stays create-only. Rules cannot sum a query. The outbox writes one doc per `write()` call. The chosen shape is one counter doc, `advanceCaps/{advanceId}`, written in the same transaction as the op. `advanceCaps` is the single mutable accounting collection. The header comment in `firestore.rules` says so. Every transition is bound to one new immutable op, so `drawn` can be recomputed from the ledger.

## 3. Rules

`match /advanceCaps/{advId}` sits after `accountTxns` and before `statementApprovals`.

Keys, all required: `advanceId`, `partyId`, `projectId`, `currency`, `cap`, `drawn`, `lastOpId`, `updatedBy`, `updatedAtServer`.

`capWrite(prevDrawn, isCreate)` reads the user, `getAfter` of the op, `exists` of the op, the original only for a `rev_`, and `exists` of `rev_` of the advance. A positive delta must move `drawn` by exactly that amount (on create, `drawn − delta ≥ 0`), the advance must be live, and `drawn ≤ cap`. A negative delta clamps at 0 and is never refused. On create the seed is unknown, so any `drawn ≥ 0` is accepted for a reversal.

`capCreate` copies `cap`, `partyId`, `projectId`, and `currency` from the advance. `capUpdate` freezes those fields. Read is `accountRead()`. Delete is false.

Leaf conjuncts, each one `getAfter` of the counter with `lastOpId == id`:

- `laborStlCreate` on `settlesId`. Generation past 1 makes 10 accesses, the per-operation limit. The next read in that leaf must drop `advanceLive` (the A-1 fallback). This PR keeps `advanceLive`.
- `returnAdvanceCreate` on `targetId`.
- `revCreate`, only when `isDraw(original)`. A `rev_` of a `revw_` does not read the counter.

## 4. Client

Pure helpers live in `public/sync.js` and are attached with `Object.assign` so `types/checkjs.d.ts` stays unchanged: `capOpOf`, `capSeed`, `capStep`, `capChanged`, `CAP_COLLECTION`, `CAP_TRIES` (3), and `CAP_OVER`.

`writeLocal` calls `writeCapped` when `capOpOf` returns an op. `flushOutbox` is unchanged.

`writeCapped`:

1. Read the counter. If it is missing, `readCapSeed` sums the live draws (the two queries in parallel, then the `rev_` lookups in parallel).
2. Up to 3 attempts, each one `runTransaction` call. The attempt reads the op first. If the op exists it throws a plain `{code:'already-exists'}` and writes nothing, so the flush adopts. Otherwise it reads the counter, the advance, and `rev_` of the advance, runs `capStep`, and writes both docs.
3. On `permission-denied` or a cap refusal, it re-reads the counter. If the counter changed, it retries. If it did not, a reason of `over` throws `{client:true, capOver:true}` and `failAccount` shows `CAP_OVER`. Any other cap reason throws `{client:true}` and shows «رُفض الإرسال». An unchanged `permission-denied` is rethrown for the existing `readDependency` path.
4. Still changing after the last attempt throws `{code:'aborted'}`. That is transient, so the row stays queued. Kept rows do not arm the tail re-flush.
5. `unavailable`, `deadline-exceeded`, `aborted`, and timeouts pass through unchanged.

Thrown values are plain objects, never `FirebaseError`, so the SDK does not retry them. An attempt is one loop pass, not one run of the transaction update function.

## 5. Migration

No script and no admin write. The first capped op on an advance with no counter seeds `drawn` from the server's live draws. New advances seed at 0. The rules check `drawn ≥ 0`. They cannot check that the seed equals the true sum. A legacy advance already over its amount refuses new draws. Reversals are accepted and clamped. If the rules are rolled back and later redeployed, the collection is renamed so every advance re-seeds. No data edit.

## 6. Tests

`tests/advance-cap.test.js` (U1–U9, ledger CI list and `npm test`):

- U1 `capOpOf` for settle, return, `rev_` of each, and the non-draws.
- U2 `capStep`: exact cap, over, dead draw, clamp, dead reversal, legacy over-limit reversal, copied fields.
- U3–U6 `capSeed`.
- U7 offline `unavailable` and exhausted `aborted` both stay queued with `SEND_RETRY`.
- U8 retry on a changed counter, true over-cap shows «المُرجَع والتسوية أكبر من السلفة», a dead refusal still shows «رُفض الإرسال», and an unchanged `permission-denied` goes through `readDependency`.
- U8(d) a stale over-cap read is retried when the re-read moved. The row syncs. The advance sentence is not shown.
- U9 an op already on the server is adopted, `tx.set` is not called, `tx.get(opRef)` runs once, and the thrown value is not a `FirestoreError`.

`tests/emulator/advance-cap.test.js` (C1–C22, C16b, C17b, emulator CI list and `npm run test:emulator`). Legacy rows are written with the rules disabled. C7 does not count attempts. C8 counts loop passes. C22 fills the advance, then the other phone's first read is over the cap and the re-read sees a reversal; that phone syncs, with two attempts and `drawn` 30000.

`tests/emulator/account-rules.test.js` writes settle, return, and rev-of-draw fixtures through `sendCapped`. The `laborStlCreate` access count is 10, with the A-1 note in the title. `getAfter(` is exactly 4. `capCreate` and `capUpdate` are in the one-user-get list.

`tests/emulator/account-adopt.test.js` E27 runs the loser through `writeCapped`.

No `types/checkjs.d.ts` change. `FirestoreModule` still types only `doc` and `getDocFromServer`. `fsMod` is `any`.

## 7. Slices I, J, and L

Slice I's `عكس` of a settle or a return goes through `writeCapped` and frees capacity. Reversing the advance itself moves no counter. No I file changes.

Slice J waits for this merge and takes service worker `aj-p0-v82`, not v81. J's settle commits through the outbox, so it is capped with no J change. J's L-12(b) «عكس» is a negative delta and is never refused (C19, C21). J's fixtures that write settles must use `sendCapped`. J's hosting deploy follows §9.

`reclassAdvance`, when slice L adds it, must join `capOpOf` and `drawsHere`.

## 8. Failure UX

| When                                                                       | Shown                                                                      |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Typed over the advance                                                     | «المُرجَع والتسوية أكبر من السلفة» (unchanged entry check)                 |
| True over-cap on the final read                                            | «المُرجَع والتسوية أكبر من السلفة» (Ameer, 2026-11-25). Final for that row |
| Rules denial, including an old cached app, or a draw on a reversed advance | «رُفض الإرسال»                                                             |
| Op already on the server                                                   | adopted, nothing new                                                       |
| Still contended after 3 attempts, or no network                            | «تعذر الإرسال. أعد المحاولة», row stays queued                             |

## 9. Deploy (docs only; not performed)

These steps apply to this deploy and to any later hosting deploy from main after the cap merge, J included. Each one needs Ameer's own go.

1. No phone has anything waiting to send. Nobody is entering data. All phones close the app.
2. Save the live ruleset and the live hosting version before deploying.
3. `firebase deploy --only firestore:rules,hosting --project ahl-aljazeera-accounting` from the merged main SHA. One command. No index deploy. #110's wording is already on main and ships with it.
4. Wait at least 2 minutes after the command returns. Record the timestamps.
5. Confirm the release, the served `sw.js` (`aj-p0-v81`), and the served rules. Then phones may reopen.
6. Rollback moves rules and hosting back together, then waits at least 2 minutes. `advanceCaps` docs stay and are inert under the old rules. A later re-deploy renames the collection.

## 10. Risks (unchanged)

- R1 MEDIUM, accepted. The legacy seed is trusted on the client, once per advance.
- R2 LOW. A settle past generation 1 makes exactly 10 reads. No headroom.
- R3 LOW. An old cached app is denied on draws.
- R4 LOW. Rollback then re-deploy renames the collection.
- R5 LOW. The watchdog's second flush adopts an op that already landed. At most 3 counter re-reads. Kept rows do not re-arm the tail.
- R6–R9 as in the approved plan.

## 11. Mutation checks

Run on the PR head, each change reverted.

| #                                                                | Must turn red                      | Result                      |
| ---------------------------------------------------------------- | ---------------------------------- | --------------------------- |
| M1 drop `drawn <= cap`                                           | C2, C9                             | red                         |
| M2 drop `opIsNew`                                                | C4                                 | red                         |
| M3 drop the return conjunct                                      | C3                                 | red                         |
| M4 drop the settle conjunct                                      | C3 stl twin                        | red                         |
| M5 drop the rev conjunct                                         | C9                                 | red                         |
| M6 flip the rev sign                                             | C9                                 | red                         |
| M7 drop the `kind` test                                          | C14                                | red                         |
| M8 drop the field freeze                                         | C5                                 | red                         |
| M9 drop `advanceLive` in `capWrite`                              | expected survivor while A-1 holds  | green (survivor)            |
| M10 `capSeed` counts reversed draws                              | U3, C10                            | red                         |
| M11 `writeLocal` skips the cap branch                            | C15                                | red                         |
| M12 `capStep` ignores over                                       | U2, and also U8, C7, C10, C11, C15 | red                         |
| M13 drop the op-exists check                                     | U9, C16/C16b, C17/C17b, E27        | red                         |
| M14 one attempt, no retry                                        | U8, C8                             | red                         |
| M15 drop the clamp                                               | U2, C20                            | red                         |
| M16 `advanceLive` required for reversals                         | C19, C21                           | red                         |
| M17 create path requires `drawn − delta >= 0` for a reversal too | C21 twin                           | green (equivalent survivor) |
| M18 check `capRefused === 'over'` before `capChanged`            | C22, U8(d)                         | red                         |

M12 still leaves `drawn` at or under the cap, because the rules deny the over-cap write. The row goes red on the message: it shows «رُفض الإرسال» instead of the advance sentence.

M17 does not change the accepted set. For a reversal `delta` is negative and `drawn ≥ 0`, so `drawn − delta ≥ 0` is already implied by `drawn >= 0`. The honest client and the low-seed twin both send `drawn` 0. The rules cannot tell them apart. Recorded as an equivalent survivor, same class as M9.

M18 swaps the two checks in `writeCapped`, so a stale over-read shows the advance sentence without looking at whether the counter moved. C22 and U8(d) turn red. The production order is unchanged: `capChanged` is tested first, and the sentence is thrown only when the final re-read is unchanged.

## 12. Service worker

`public/sw.js` is `aj-p0-v81`. The version pins in `tests/shell-cache.test.js` and `tests/webkit-upgrade.test.js` move with it. `scripts/public-canon-diff.sh` is unchanged.
