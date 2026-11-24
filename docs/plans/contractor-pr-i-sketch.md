# PLAN ONLY: contractor PR I (corrections, التصحيحات), r5

r5 is built on r4 (`PLAN-I-r4.md`, sha256 `22ed11e85a8a8e8c0bb721cf34f352e3e14ee81f24374c89f78b0e4ab01a2a51`). It fixes **only** the Architect's NOTES on r4. Their source is **REVIEW-plan-I-r4-22ed11e8.md** (sha256 `8244944bc1003f1a43e818de5038304e4fbd4c87e511a7d59d7bd8890042de02`). There are no blockers. Each fix is mapped in §8.r5:

- M-C;
- the D-7 edit-4 conditions;
- L-6 (rest);
- S6 wording;
- the M-A queued-docs note;
- the §7.7 fixed-id wording.

The answers file is unchanged (`7f3aa0bb…78b4`). Nothing is pending Ameer except the separate rules-deploy go (§7.4).

### r4 header (kept)

r4 is built on r3 (`PLAN-I-r3.md`, sha256 `05bad4ab88584544c55bc850da8622ae1e0055b8520a00496cbadbaeaf3862d5`), with text and design fixes only. It folds in:

- the Architect NOTES on r3 (`REVIEW-plan-I-r3-05bad4ab.md`, sha256 `e1a7512a60328e43d6f7cff2900b11ad67f245e8f8a8fcbea86ee061cd7e919a`; scratch rules patch `/workspace/tmp/slice-i-plan-rv/probe/a13-rules-scratch.patch`), mapped item by item in §8.0;
- the answers file, now frozen as `AMEER-answers-r2.7f3aa0bb.frozen.md` (sha256 `7f3aa0bbe52ef6bb5abd8c52ad490da67445d91c8b169a8d620cbf3984d878b4`, 29 lines).
  - Checked: its first 22 lines are byte-identical to `b7bfa0b8…d021`. Lines 23-29 are appended:
    - L24-26: accountant 19:27 on Q-2/Q-3;
    - L27-28: N-1 FINAL, an Ameer widget answer relayed by EA, 19:29: «إي، عدّلوا ملف المزامنة لفحص الخصم بالسيرفر بس»;
    - L29: the rules deploy needs a separate Ameer go at deploy time.

**Nothing is pending Ameer** except that deploy-time go for `firestore.rules` (§7.4).

### Base: r3's inputs (kept)

r3 was built on r2 (`PLAN-I-r2.md`, sha256 `ebab827425108278cc7b54572089a35e4601f6229377bb0027c3536792f11af0`). It folded in two inputs:

1. **Ameer's answers to r2**, from the frozen copy `AMEER-answers-r2.b7bfa0b8.frozen.md` (sha256 `b7bfa0b8b09ca30b08c9e77a98defb832a9d244052b2f659bd5d2e68e2e2d021`).
   - That file is `AMEER-answers-r2.4ccff51d.frozen.md` (sha256 `4ccff51db236919c5be64c1ce7481f8f753108f94e9bef20f7bbaa0c11d23e61`) plus one line, line 22, appended at the end. Checked: the first 21 lines are byte-identical, and the first N bytes hash to `4ccff51d…`.
   - Sources are cited by line:
     - **Ameer 19:08** (t2135u via EA): lines 3-13.
     - **Accountant 19:09**, deciding the items Ameer delegated in his own words («دع المحاسب يختار الاصح» / «دع المحاسب يقرر» / «المحاسب يقرر»): lines 16-20.
     - **A5 final**: line 21, an Ameer widget answer relayed by EA, 19:10. We have no raw line of our own.
     - **D-4 and the C1 two-tap confirm**: line 22, an Ameer widget answer relayed by EA, 19:13: «إي، صلحوا السطر وخلوا التأكيد بضغطتين». We have no raw line of our own.
   - **L-1 (r4).** Line 11's "(Ameer approves the firestore.rules change for this only)" is EA's note. Ameer's own words are only «٩-فحص بالسيرفر». r4 quotes only that as his. The scope of the cap change rests on his 19:29 widget answer (L28: «…لفحص الخصم بالسيرفر بس»).
2. **The Architect's NOTES on r2**, `REVIEW-plan-I-r2-ebab8274.md` (sha256 `af1d52b78ddf6c52396463fbceb7e40cf2ddade200a85a386fe8b29d57a27857`), with probes in `/workspace/tmp/slice-i-plan-rv/probe/`. Every item is mapped in §8.2.

Earlier inputs are unchanged and still apply:

- `ACCOUNTANT-answers-r1.md` (sha256 `08e6edf58e0c71919d08db56707e02ea4a6e50f1c0788b763e595035a9525efc`; C1-C11);
- `REVIEW-plan-I-1328c999.md` (sha256 `ef73dcd2…8432`).

**Delegation (N4).** The 18:56 line, as the brief quotes it raw from EA's transcript (pos 7344; the brief verified it, not this plan): «لا ااعرف ماهوة صحيح حسابيا اعملوه واشروحلي ع البرنامج بعد الاكمال». It covers **accounting choices only**. r3 no longer cites it for:

- the G screen change (D-1);
- the CSV;
- wording.

Those now cite Ameer's own 19:08-19:29 answers. §7.4 holds only the deploy-time rules go.

Base: main `f09a57e5e2a656abfea8860110d80a1402fba29a` (#108, v78 live). Source of truth: `docs/plans/contractor-pr-gj-sketch.md` at that commit (r18, 774 lines; cited below as `sketch:N`). Every other `file:line` below was read at that commit. A code PR reads the line numbers again at its own base.

No code, no PR, no push, and no cloud agent come with this plan. The code PR waits for the Architect's and the accountant's review of this plan, then EA's GO quoting Ameer. After that, one cloud agent builds it.

Skill: pstack `architect`. The plan traces every system the change touches, compares two shapes (§2.1), and picks the one where each piece of state has one owner. Arena is not run (banned).

---

## 0. What main already has that I builds on

| Already on main                                                                                                                | Where                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| K: `projectCost` adds live `approveLabor` after the start date. A deduct does not reduce it (`effect.cost` not applied).       | `public/accounts.js:1025-1053` (#96)                                                                                                               |
| G: «مقاول» screen, `slotBodyId`, `slotAttempt`, `currentBody`, `liveApproval`, measurement and approval saves, agreement `عكس` | `public/accounts-work.js:117-121, 315-333, 640-658, 433-444, 521-587, 592-609` (#98)                                                               |
| H: payments, `cashDoc`, `reviewDoc`, `localLedger`, `AMOUNT_FIELD_IDS`, and the `views.contractor` wrapper pattern             | `public/accounts-payment.js:306-330, 365-406, 470-514, 979-992, 1073-1077` (#100)                                                                  |
| The install list already names `AccountCorrect`                                                                                | `public/render.js:1697-1702`                                                                                                                       |
| `Window.AccountCorrect?: AccountModule` already declared                                                                       | `types/checkjs.d.ts:1257` (`AccountModule` is lines 920-922)                                                                                       |
| `post('deduct')` and `post('approveDeduct')`, with the cap, cumulative, and `targetId` codes                                   | `public/accounts.js:395-410, 417-461, 468-480`                                                                                                     |
| Fold markers `rev_`, `rej_`, and `sup_` already kill rows; `rowCounts` already gates a deduct on its `appr_`                   | `public/accounts.js:224-242, 586-619, 629-648, 657-687, 746-770`                                                                                   |
| Rules for every I write: `deductCreate`, `approveDeductCreate`, `rejCreate`, `revCreate`, `supCreate`                          | `firestore.rules:957-984, 989-1019, 1024-1044, 1050-1077, 731-768`; dispatcher 1112-1127                                                           |
| Remote key lists for every I write                                                                                             | `public/sync.js:73-74, 77, 79, 81` (`REJ_REMOTE`, `REV_REMOTE`, `SUP_REMOTE`, `DEDUCT_APPR_REMOTE`, `POINTER_CASH_REMOTE`); `txnRemoteKeys` 90-103 |
| Parent hold-back for queued pointers (`targetId`, `reversesId`, `supersedesId`)                                                | `public/sync.js:820-828`                                                                                                                           |
| Status words `مرفوض`, `معكوس`, `بانتظار الاعتماد` already paint on «حسابات»                                                    | `public/accounts-view.js:241-255, 425-441`                                                                                                         |

r2 said I needs no change to rules, sync, the fold, or `post`. r3 changes that in three named places:

- **A13**: `firestore.rules` `deductCreate` only (Ameer 19:08, answers line 11);
- **D-4**: one condition in `public/accounts.js:848` (Ameer 19:13, answers line 22);
- **D-7**: four edits in `public/sync.js`, all for the server cap only. Approved: an Ameer widget answer relayed by EA, 19:29, «إي، عدّلوا ملف المزامنة لفحص الخصم بالسيرفر بس» (answers L28).

Everything else is one flow file. It builds document kinds the server already accepts, plus the position-id deduct of §2.12.

---

## 1. Scope

### 1.1 What I delivers (sketch lines implemented)

| sketch                  | Quote (shortened only where marked …)                                                                                                                                                                                                                                                                                                                                     | How I implements it                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 15                      | "H, I, and J paint their save buttons on that screen." … "G–J push `tab: 'contractor'`, so those tabs stay empty of `act-` buttons."                                                                                                                                                                                                                                      | I's five actions register with `tab: 'contractor'` and paint only inside `#contractor/<agreementId>`.                                                     |
| 60                      | "A deduction repays a debt and does not reduce cost. `PURPOSES.deduct` still has `cost: -1` … K's new cost half does not apply that effect"                                                                                                                                                                                                                               | `خصم` changes `balances().deductions` and `net` only. `projectCost` is unchanged (test T-I14).                                                            |
| 84                      | "Each builder still returns one document. `commitDoc` … still appends one id."                                                                                                                                                                                                                                                                                            | Four builders return one document. `endMeasurementDocs` (A12) returns 2 to 6 documents for one tap. That is named exception **D-5** (§2.10).              |
| 95                      | "`نسخة جديدة` \| `sup_` \| `sup_<oldId>` \| I \| `supersede` \| مقاول"                                                                                                                                                                                                                                                                                                    | `supersedeDoc`, action id `supersede`                                                                                                                     |
| 96                      | "`رفض السطر` \| `rej_` \| `rej_<bodyId>` \| I \| `reject` \| مقاول"                                                                                                                                                                                                                                                                                                       | `rejectDoc`, action id `reject`                                                                                                                           |
| 97                      | "`اعتماد` \| `approveDeduct` \| `appr_<deductId>` \| I \| `approve-deduct` \| مقاول"                                                                                                                                                                                                                                                                                      | `approveDeductDoc`, action id `approve-deduct`. Button label **«اعتماد الخصم»** (A5 final, Ameer 19:10, answers line 21), not the sketch's bare `اعتماد`. |
| 101                     | "`خصم` writes the deduct body that save 10 approves. It is a thirteenth document, inside I. Verify id `deduct`."                                                                                                                                                                                                                                                          | `deductDoc`, action id `deduct`. The id is now a position id, not a uuid (A13, §2.12).                                                                    |
| 103                     | "I's `عكس` writes `rev_<id>` in `accountTxns`. … Verify ids: … `reverse` … The label reuses `عكس` and `معكوس`."                                                                                                                                                                                                                                                           | `reversalDoc`, action id `reverse`                                                                                                                        |
| 105                     | "Q13 leaves a refused body in `syncErrors`. The picker does not offer it (`walkLive` marks that id dead …)"                                                                                                                                                                                                                                                               | Every I picker drops `syncErrors` ids (T-I3).                                                                                                             |
| 107                     | "The twelve, plus `deduct`, `review-cash`, `reverse`, and `cancel-agreement`, are the sixteen G–J action ids."                                                                                                                                                                                                                                                            | I owns 5 of the 16: `supersede`, `reject`, `approve-deduct`, `deduct`, `reverse`.                                                                         |
| 113                     | "Write actions use `tab: 'contractor'`, so `actionHtml` … paints none of them on «حسابات»."                                                                                                                                                                                                                                                                               | T-I12                                                                                                                                                     |
| 117                     | "H, I, J, and L insert their scripts in that order, before `render.js`. `render.js` already installs … `AccountCorrect` …"                                                                                                                                                                                                                                                | `accounts-correct.js` tag after `accounts-payment.js` (`public/index.html:74`) and before `render.js` (line 75).                                          |
| 119, 121                | "`commitDoc` … stay F's exports." / "`queueDoc` … These screens call that function. They do not add a second demo gate and they do not call `flushRemote`."                                                                                                                                                                                                               | Saves go through `AccountsView.commitDoc` only.                                                                                                           |
| 125-142                 | The shared set of 12 files; "adds its behaviour test and its strict test to both. It does not copy 39 forward."; "`VERSION` is the next free value at merge time."                                                                                                                                                                                                        | §2.3                                                                                                                                                      |
| 332-334                 | "Same pattern: `public/accounts-correct.js`, `tests/accounts-correct.test.js`, `tests/strict-accounts-correct.test.js`, `tsconfig.strict-accounts-correct.json`, `scripts/verify-drives/accounts-correct.js`, and feature files `supersede.md`, `reject.md`, `approve-deduct.md`, `deduct.md`, `reverse.md`. I does not edit `public/render.js`. Buttons are on «مقاول»." | §2.2, §2.3                                                                                                                                                |
| 336-372                 | The five signatures `deductDoc`, `approveDeductDoc`, `rejectDoc`, `supersedeDoc`, `reversalDoc`                                                                                                                                                                                                                                                                           | §2.4 (same names; input shapes narrowed, see D-2)                                                                                                         |
| 374                     | "Agreement reversal stays in G, stored in `agreements`. I's `reversalDoc` is only an `accountTxns` reversal."                                                                                                                                                                                                                                                             | `reversalDoc` refuses agreement ids (it reads `K.accountTxns` only).                                                                                      |
| 376                     | "`نسخة جديدة` is hidden on a slot. … Generation n+1 is offered only when slot n is reversed or rejected … Generation 9 reversed or rejected ends the slot."                                                                                                                                                                                                               | §2.6. G's `slotAttempt` already moves on after a `rej_` or `rev_appr_` (`public/accounts-work.js:315-333`).                                               |
| 378                     | "Strings, new, on I: `نسخة جديدة`, `رفض السطر`, `اعتماد`, `خصم`, `الخصم أكبر من العمل المعتمد`. `عكس`, `سبب التصحيح`, and `معكوس` are reused."                                                                                                                                                                                                                            | §2.8. `اعتماد` becomes `اعتماد الخصم` (A5). Two more strings come from A14 (S4, S5).                                                                      |
| 380-391                 | The I test list and "I's test checks the two documents, not the closing number."                                                                                                                                                                                                                                                                                          | §3.1, T-I1 to T-I8                                                                                                                                        |
| 591-595                 | Files the code PRs do not edit; "No new test assertion reads a helper's source text."                                                                                                                                                                                                                                                                                     | §4; see D-1 and D-3 for the two named exceptions this plan asks for                                                                                       |
| 605, 615, 618, 620, 622 | Error codes: `range`/`amount`/`overflow`/`inexact` → `المبلغ ليس عدداً صحيحاً`; deduct `cap`/`cumulative` → `الخصم أكبر من العمل المعتمد`; `targetId` → "button stays off until a live row is chosen"; `kind` → "`عكس` stays hidden on a `rev_` row"                                                                                                                      | §2.7                                                                                                                                                      |
| 699                     | "`git revert` of one code pull request removes that script, its tests, and its verify ids. Firestore documents already written stay."                                                                                                                                                                                                                                     | §5                                                                                                                                                        |
| 705, 710                | B: "`approveDeduct` with no amount"; K: "G and I do not add cost themselves."                                                                                                                                                                                                                                                                                             | T-I1, T-I14                                                                                                                                               |
| 717                     | "An agent that edits `public/accounts.js` … will collide with B, C, and K."                                                                                                                                                                                                                                                                                               | `public/accounts.js` gets one condition only (D-4, Ameer 19:13). No other line.                                                                           |
| 731, 733                | `principle-make-operations-idempotent` "with one two-tap test in each pull request"; "These screens add no listener."                                                                                                                                                                                                                                                     | T-I7; I adds no document listener (see D-3 for how its amount field gets grouped)                                                                         |
| 735                     | "Each code PR updates `feature`, `maintain-verification-skill`, and `opening-a-pr` in `docs/PSTACK_INVENTORY.md`. Evidence links only."                                                                                                                                                                                                                                   | §6                                                                                                                                                        |
| 750                     | "Q25. `خصم` ships inside I."                                                                                                                                                                                                                                                                                                                                              | `deductDoc` ships in I.                                                                                                                                   |
| 766, 773                | "«مقاول» is where the sixteen saves … are painted."; "`firestore.rules` is not in the diff of any of these five."                                                                                                                                                                                                                                                         | §4. **Changed by A13:** I's diff contains `firestore.rules`, the deduct cap only (Ameer 19:08 «فحص بالسيرفر», answers line 11).                           |

### 1.2 Explicitly out of I

- **Retention (ضمان).** Not in I, and not planned (A1, Ameer 19:08 «لا اخذ ضمان», answers line 3).
- **CSV contractor rows.** Later, as a separate change (A9, Ameer 19:08 «نضيف المقاولين للملف بعدين», answers line 7).
- **J** (sketch:393-483): `settle`/`stl_`, `statement-approval`, the balance sentences, the period «مستخلص», `contractorTotals`, the quantity tile. `reversalDoc` can technically build a `rev_` of a `stl_` row (rules allow `kind == 'stl'`, `firestore.rules:1062`). I paints no `عكس` on settle rows, because none can exist before J.
- **L** (sketch:484-588): `AccountReclass`, `reclass`, «ملغى», `K.laborReviews`, old-expense reclassification, `سلفة مكررة`.
- **K behaviour changes**: none. `projectCost` (`public/accounts.js:1043-1053`) is read only in a test.
- **Q19** `المُرجَع والتسوية أكبر من السلفة` (sketch:619, 751): H/J. I does not paint it.
- **L5**: an L item, out with L.
- **The advance notes** `advanceNoteComma`/`advanceNotePlain` (`public/accounts-payment.js:12-17, 27-28`, [OPEN] via EA): untouched.
- The [OPEN] items (sketch:652-662), the deferred list (sketch:628-637), and «عهد» linking (sketch:639-641).
- Materials, invoices, USD, percent milestones, `otherApproved` (sketch:80).
- Re-sending a refused document. There is no re-send in `public/` (sketch:66). I keeps each fixed-id button off while its id is in `syncErrors` (§2.6).
- A `rev_` of a `rej_`, a `rev_` of a `rev_`, or undoing a rejection. Rules refuse these (`firestore.rules:1062`, original kind must be in `['body','sup','appr','stl','revw']`).
- Supersede of a `deduct` body (rules allow it at `firestore.rules:765-767`). It is never offered (C6 decided: «رفض السطر» plus a new `خصم`).

---

## 2. Design

### 2.1 Two shapes

**Chosen (A): one flow file, six builders, builders read the target row themselves.** `public/accounts-correct.js` exports `deductDoc`, `approveDeductDoc`, `rejectDoc`, `supersedeDoc`, `reversalDoc`, and (r3, A12) `endMeasurementDocs`. Each builder takes the _id_ of the row it corrects plus the actor, then looks that row up in `K.accountTxns` through `Accounts.rowIndex(rows, syncErrors)`. It copies `projectId`, `partyId`, `agreementId`, `purpose`, `ledger`, `currency`, `fxRate`, and `amount` from that row. That is the same rule the server enforces (`revCreate` 1064-1071, `supCreate` 752-759, `approveDeductCreate` 1013-1017, `deductCreate` 979-981), so a caller cannot build a mismatching correction. This follows H's `reviewDoc` (`public/accounts-payment.js:470-514`). Liveness has one owner: `Accounts.rowLive`/`rowCounts`. Caps have one owner: `Accounts.post`.

**Not chosen (B): sketch-literal `AccountHeader & {...}` inputs, where the caller passes `projectId`, `partyId`, `txnDate`, `currency`, and `fxRate`.** Every caller would have to copy fields that must equal the target. A wrong copy becomes a server refusal, which lands in `syncErrors` and blocks logout (`public/render.js:613-623`). It also carries keys the rules forbid on these kinds: `txnDate` on `rev`/`rej`/`approveDeduct`, and `projectId`/`partyId` on `rej` (`firestore.rules:1038, 1063, 1008`). `toRemote` would strip them silently (`public/sync.js:90-103`), which hides the mismatch instead of preventing it.

### 2.2 Module structure

```
public/accounts-correct.js                 NEW   AccountCorrect global, UMD like accounts-payment.js:1-6
  ├─ pure builders (exported)    deductDoc, approveDeductDoc, rejectDoc, supersedeDoc, reversalDoc,
  │                              endMeasurementDocs (A12), deductPosition (A13)
  ├─ local helpers (private)     rows, syncErrors, indexNow, liveLedger, costOpen, projectOpen,
  │                              refusedFixed, hasLiveDependent, reversible, supDepth, measurementChain,
  │                              orphanDeducts, actor, esc, money
  ├─ screen (private)            blocks(arg) → measureCard + deductCard + reverseCard
  ├─ onClick(button)             handles only act-supersede-*, act-reject-*, act-deduct, act-approve-deduct-*, act-reverse-*
  ├─ register()                  pushes 5 AccountAction rows, tab 'contractor'
  └─ install(api)                wraps api.views.contractor like accounts-payment.js:1073-1077, then register()
```

`install` wraps `api.views.contractor` as `arg => prior(arg) + blocks(arg)`. `render.js` installs `AccountWork`, then `AccountPayment`, then `AccountCorrect` (`public/render.js:1698`), so I's blocks paint after H's. `blocks` returns `''` unless all of these hold: `arg` is an agreement id that resolves, `me()` is owner (`Ledger.can(user,'owner')`), and `costOpen()` (§2.9).

### 2.3 Files

| File                                                                                                                                              | New/changed                                                                                | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `public/accounts-correct.js`                                                                                                                      | NEW                                                                                        | The module above.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `public/index.html`                                                                                                                               | changed                                                                                    | One `<script src="accounts-correct.js">` between line 74 (`accounts-payment.js`) and line 75 (`render.js`).                                                                                                                                                                                                                                                                                                                                                                                |
| `public/sw.js`                                                                                                                                    | changed                                                                                    | `VERSION` to the next free value at merge (today `aj-p0-v78` at line 2, so likely `aj-p0-v79`; not reserved, sketch:142). Add `./accounts-correct.js` to `ASSETS` (line 3) and `'/accounts-correct.js': 1` to `SHELL` (line 5).                                                                                                                                                                                                                                                            |
| `public/session.js`                                                                                                                               | changed                                                                                    | `SHELL_FILES` (line 351) gains `'accounts-correct.js':1`. Nothing else. `K` (line 5) is not touched.                                                                                                                                                                                                                                                                                                                                                                                       |
| `public/accounts-work.js`                                                                                                                         | changed, **exception D-1 + M2**, approved by Ameer: A8, 19:08, «٤-نشيله» (answers line 6). | `currentBody` (640-658) skips a unit/daily body that is not `Accounts.rowLive`, or that has an `appr_` row outside `syncErrors` (reversed or not), so a rejected, superseded, or approval-reversed measurement is no longer offered to `اعتماد قياس العمل`. Two conditions.                                                                                                                                                                                                                |
| `public/accounts.js`                                                                                                                              | changed, **exception D-4** (Ameer 19:13, answers line 22)                                  | Line 848 gains `!markerKind(doc)`: `if (live && purpose && purpose.needsApproval && !counts && !markerKind(doc)) pendingIds.push(doc.id);`. One condition. No total changes. `markerKind` is already defined at 564-572.                                                                                                                                                                                                                                                                   |
| `firestore.rules`                                                                                                                                 | changed, **exception D-6 / A13** (Ameer 19:08 «٩-فحص بالسيرفر», L11; scope «…بس», L28)     | `deductCreate` (957-984) plus **four** new helpers (`dedGen`, `dedId`, `prevCumOk`, `cumOk`) **inside `match /accountTxns/{id}`**. They use `id` and `d()`, which exist only there (`d()` at 656). Full design in §2.12. No other leaf, helper, or match block changes.                                                                                                                                                                                                                    |
| `public/sync.js`                                                                                                                                  | changed, **exception D-7**: approved, cap only (Ameer widget 19:29 via EA, L28)            | (1) `DEDUCT_REMOTE` (= `POINTER_CASH_REMOTE` + `cumAmount`) for a deduct at line 101. (2) The prev-position parent pointer. (3) **M-B**: a deduct hold on a queued, kept, or refused `rev_`/`rej_` of position g-1. (4) `adoptFound` adopts and parks a lost position. §2.12 (e).                                                                                                                                                                                                          |
| `tests/emulator/account-rules.test.js`                                                                                                            | changed (A13)                                                                              | The helper `deductOf` (239-244) builds position ids and `cumAmount`; its 28 call sites follow. Line 1405 (a second 600,000 deduct on a 600,000 approval, **allowed today**) flips to `deny`. New rules tests R0-R12 (§2.12 f).                                                                                                                                                                                                                                                             |
| `tests/sync-status.test.js`                                                                                                                       | changed (D-7)                                                                              | `Sync.toRemote` of a deduct keeps `cumAmount` (pattern at 157-160, 228-248). A `flushOutbox` case like its existing `slotLosers` cases (514-539): a lost deduct position is parked, and the server copy is adopted.                                                                                                                                                                                                                                                                        |
| `public/accounts-payment.js`                                                                                                                      | changed, **exception D-3**                                                                 | `AMOUNT_FIELD_IDS` (979-992) gains `'cc-deduct'`. One array entry.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `types/checkjs.d.ts`                                                                                                                              | changed                                                                                    | `interface AccountCorrectApi` (NEW, next to `AccountPaymentApi` at 931-947); `Window.AccountCorrect?: AccountCorrectApi` (line 1257, was `AccountModule`). `RenderApi` (832-844) and `ActionTab` (861) unchanged.                                                                                                                                                                                                                                                                          |
| `tsconfig.strict-accounts-correct.json`                                                                                                           | NEW                                                                                        | Same shape as `tsconfig.strict-accounts-payment.json`; includes `public/accounts-correct.js` and `types/checkjs.d.ts`.                                                                                                                                                                                                                                                                                                                                                                     |
| `tests/accounts-correct.test.js`                                                                                                                  | NEW                                                                                        | Behaviour tests §3.1. Same harness as `tests/accounts-payment.test.js:1-60` (vm globals, in-memory `get`/`set`). Loads `accounts-work.js`, `accounts-payment.js`, and `accounts-correct.js` together.                                                                                                                                                                                                                                                                                      |
| `tests/strict-accounts-correct.test.js`                                                                                                           | NEW                                                                                        | Same as `tests/strict-accounts-payment.test.js`.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `tests/accounts-payment.test.js`                                                                                                                  | changed                                                                                    | The exact-list pin at 1645-1660 gains `'cc-deduct'`.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `tests/browser-check.js`                                                                                                                          | changed                                                                                    | Guard lists: `AMOUNT_IDS` (line 17) `+ 'cc-deduct'`; `NON_AMOUNT_IDS` (19-21) `+ 'cc-reason':'reason', 'cc-ded-reason':'reason', 'cc-sup-qty':'qty'` (N5: r2 missed `cc-ded-reason`, which would fail `unlisted-input`, `tests/browser-check.js:98`). `__seedLocal` (104-119) gains one pending deduct on `appr_m1`, so the guard scans I's cards. One new owner check: `#contractor/ag-unit` cost-open, `cc-deduct` typed `١٥٠٠٠٠` shows `150,000`, saves `150000`, and `2,5` is refused. |
| `tests/shell-cache.test.js`                                                                                                                       | changed                                                                                    | `VERSION` pins (lines 44, 67, 104); the script-order assertion (71-84) adds `accountsCorrectAt`; `ASSETS`/`SHELL` matches like lines 89-90.                                                                                                                                                                                                                                                                                                                                                |
| `tests/webkit-upgrade.test.js`                                                                                                                    | changed                                                                                    | `MARK` (line 19).                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `tests/emulator/account-correct.test.js`                                                                                                          | NEW                                                                                        | §3.3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `package.json`                                                                                                                                    | changed                                                                                    | `"test"` (line 5): two new unit paths. `"test:emulator"`: one new path. `"typecheck"` (line 10): `&& tsc --noEmit -p tsconfig.strict-accounts-correct.json`.                                                                                                                                                                                                                                                                                                                               |
| `.github/workflows/ci.yml`                                                                                                                        | changed                                                                                    | Unit list (line 68) identical to `"test"` (today 42 files, equal). Emulator list (line 210) identical to `"test:emulator"` (today 17, equal). No fifth job.                                                                                                                                                                                                                                                                                                                                |
| `scripts/verify-aj.js`                                                                                                                            | changed                                                                                    | Dispatch only: `correctIds = ['supersede','reject','deduct','approve-deduct','reverse']` beside `paymentIds` (1343-1388). An unknown id still exits 3.                                                                                                                                                                                                                                                                                                                                     |
| `scripts/verify-drives/accounts-correct.js`                                                                                                       | NEW                                                                                        | The steps, modelled on `scripts/verify-drives/accounts-payment.js` (flip the runtime `Accounts.CONTRACTOR_COST_START` in the page at 144, restore null at 272-277/528, assert the source still says null).                                                                                                                                                                                                                                                                                 |
| `.cursor/skills/verify-ahl-aljazeera-accounting/SKILL.md`                                                                                         | changed                                                                                    | Line 67: list the five ids.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/README.md` + `supersede.md`, `reject.md`, `approve-deduct.md`, `deduct.md`, `reverse.md` | changed + 5 NEW                                                                            | Feature files                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `docs/PSTACK_INVENTORY.md`                                                                                                                        | changed                                                                                    | §6                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

### 2.4 Types and signatures

```javascript
/**
 * Who taps. Copied from G's actor() (public/accounts-work.js:183-191).
 * @typedef {{ createdBy: string, createdByName?: string, deviceId: string }} CorrectActor
 */

/**
 * Calls Accounts.post('deduct', { id, amount, targetId, ledger: liveLedger() }) (client cumulative over LIVE deducts, accounts.js:404).
 * targetId is an appr_ id whose row is purpose 'approveLabor' and Accounts.rowCounts true.
 * id and cumAmount come from deductPosition(targetId) (A13, §2.12): id 'd' + g + targetId, g 1..9.
 * The id is computed when the card opens and kept until success, so two taps give one id (T-I7).
 * txnDate is today() (session.js:172; A10). No agreementId (firestore.rules:973 hasOnly has none).
 * reason (C8, mandatory client-side) is trimmed, 1..500, and stored as description (firestore.rules:973, 502-504).
 * Errors: 'targetId' (not a counting approval, or in syncErrors), 'range', 'cap', 'cumulative'
 *         (the live sum over the approval), 'spent' (cumAmount over the approval while the live sum fits: Q-3),
 *         'full' (positions 1..9 used: Q-2), 'blocked' (a position of this approval is in syncErrors: M-A), 'reason'.
 * @param {CorrectActor & { targetId: string, amount: number, reason: string }} input
 * @returns {{ doc: DeductBody | null, errors: string[] }}
 */
function deductDoc(input)

/**
 * A13 server-cap chain. Pure; reads K.accountTxns and syncErrors only.
 * g = the smallest 1..9 with no local row 'd' + g + targetId (any state, in syncErrors or not).
 * prevId = 'd' + (g - 1) + targetId when g > 1. prevGone = a rev_prevId or rej_prevId row exists locally.
 * cumAmount = g == 1 ? amount : prev.cumAmount - (prevGone ? prev.amount : 0) + amount.
 * This is the same arithmetic the rule checks (§2.12). The client refuses before queueing anything the rule would deny.
 * @param {string} targetId
 * @param {number} amount
 * Returns 'blocked' first when any 'd1'..'d9' + targetId id is in syncErrors (M-A, §2.12 i).
 * Returns 'spent' when cumAmount > approval.amount while the live sum + amount <= approval.amount (Q-3).
 * @returns {{ id: string, cumAmount: number } | { error: 'full' | 'blocked' | 'spent' | 'cumulative' | 'targetId' }}
 */
function deductPosition(targetId, amount)

/**
 * The one owner of the "no more deducts on this measurement" line (Q-2, Q-3, M-A).
 * cause → lead line S10/S11/S12; then S13 if another card-2 block of the same agreement counts and is open,
 * else S14 (remedy order, accountant 19:27, L26).
 * @param {string} approvalId
 * @param {'full' | 'blocked' | 'spent'} cause
 * @returns {string} escaped HTML: two <div class="note"> lines
 */
function noMoreDeductLine(approvalId, cause)

/**
 * A12/C9 (accountant 19:09, answers line 16): reversing a measurement's approval ENDS the measurement.
 * One tap, one reason. Returns every missing rev_ doc, in this order:
 *   rev_appr_<top>, rev_<top>, rev_<each lower sup_ link>, rev_<root>
 * where top is approval.targetId (a body or a sup_ chain head) and the chain is walked through supersedesId
 * (measurementChain; at most root + 4 sup_ links, firestore.rules:383-392). Up to 6 docs.
 * Each doc is built by reversalDoc (same copy rules, same reason). A doc whose id already exists locally
 * outside syncErrors is skipped, so the call is idempotent and also repairs a partial state (N2, recovery).
 * Refuses: 'dependent' (a live deduct on the approval, A11/H1(2)), 'reason', 'targetId' (approval in syncErrors),
 *          'kind' (not an approveLabor appr_).
 * @param {CorrectActor & { approvalId: string, reversalReason: string }} input
 * @returns {{ docs: RevDoc[], errors: string[] }}
 */
function endMeasurementDocs(input)

/**
 * id is 'appr_' + the deduct id. No amount. No txnDate.
 * Calls Accounts.post('approveDeduct', { id, targetId, ledger: liveLedger() }).
 * Errors: 'targetId' (deduct reversed, rejected, refused, or its approval no longer counts), 'cumulative'.
 * An existing local appr_ of that deduct (not in syncErrors) returns { doc: null, errors: [] }.
 * @param {CorrectActor & { targetId: string }} input
 * @returns {{ doc: ApproveDeductDoc | null, errors: string[] }}
 */
function approveDeductDoc(input)

/**
 * id is 'rej_' + targetId. Stored keys: id, kind 'rej', targetId, createdBy, createdByName?,
 * createdAtServer null, deviceId (firestore.rules:1038, sync.js:73). No purpose, amount, projectId, partyId.
 * Target must be live (Accounts.rowLive), not in syncErrors, kind 'body' or 'sup',
 * purpose with needsApproval true (laborQty or deduct), and no local appr_ of it outside syncErrors.
 * Errors: 'method' (cash or any purpose without needsApproval: "Cash cannot be rejected"),
 *         'approved' (an appr_ exists), 'targetId' (missing, dead, or refused).
 * @param {CorrectActor & { targetId: string }} input
 * @returns {{ doc: RejDoc | null, errors: string[] }}
 */
function rejectDoc(input)

/**
 * id is 'sup_' + supersedesId. Old row: live, not in syncErrors, purpose 'laborQty', uuid or sup_ chain,
 * not a slot id (/^000[0-9a-f]{32}[1-9]$/, same as sync.js:704), no appr_ outside syncErrors,
 * and the new id's sup_ depth at most 4 (firestore.rules:383-392, 746-748).
 * Copies purpose, ledger, partyId, projectId, agreementId, currency, fxRate (rules 752-759).
 * Carries the new qty (integer 1..100000000, firestore qtyOk) and txnDate today(). No amount, no targetId (766).
 * Errors: 'method' (slot, cash, deduct, approved, depth 5), 'cancelled' (agreement has a live rev_,
 *         the same code G returns, accounts-work.js:361), 'range' (qty), 'targetId'.
 * @param {CorrectActor & { supersedesId: string, qty: number }} input
 * @returns {{ doc: SupDoc | null, errors: string[] }}
 */
function supersedeDoc(input)

/**
 * id is 'rev_' + reversesId, kind 'rev', collection accountTxns only.
 * Copies purpose, ledger, projectId, partyId, currency, fxRate, and amount and agreementId only when the original has them
 * (firestore.rules:1064-1071; sync.js:74). No txnDate (not in rules 1063).
 * Original kinds accepted: body, sup, appr, revw (and stl, which I does not paint).
 * Errors: 'kind' (original is rev_ or rej_), 'reason' (trimmed length not 1..500, G's code at accounts-work.js:282),
 *         'targetId' (missing or in syncErrors). An existing live rev_ returns { doc: null, errors: [] }.
 * @param {CorrectActor & { reversesId: string, reversalReason: string }} input
 * @returns {{ doc: RevDoc | null, errors: string[] }}
 */
function reversalDoc(input)

/** @param {RenderApi} api */
function install(api)
```

Stored local shapes. Each also carries `docType: 'accountTxn'` and, where `post` returns one, `effect`, the same as H (`public/accounts-payment.js:386-402`). `toRemote` drops both (`public/sync.js:117-121`).

| Type               | Keys (minus `docType`, `effect`)                                                                                                                                                                                                              | Must be a subset of                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `DeductBody`       | `id ('d'+g+targetId), kind:'body', purpose:'deduct', projectId, partyId, ledger:'labor', currency:'IQD', fxRate:1, amount, cumAmount, targetId, txnDate, description (the reason), createdBy, createdByName?, createdAtServer:null, deviceId` | `firestore.rules:973` + `cumAmount` (A13); new `DEDUCT_REMOTE` (D-7) |
| `ApproveDeductDoc` | `id, kind:'appr', purpose:'approveDeduct', projectId, partyId, ledger, currency, fxRate, targetId, createdBy, createdByName?, createdAtServer, deviceId`                                                                                      | `firestore.rules:1008`; `DEDUCT_APPR_REMOTE` `sync.js:79`            |
| `RejDoc`           | `id, kind:'rej', targetId, createdBy, createdByName?, createdAtServer, deviceId`                                                                                                                                                              | `firestore.rules:1038`; `REJ_REMOTE` `sync.js:73`                    |
| `SupDoc`           | `id, kind:'sup', purpose:'laborQty', projectId, partyId, agreementId, ledger, currency, fxRate, supersedesId, qty, txnDate, createdBy, createdByName?, createdAtServer, deviceId`                                                             | `firestore.rules:744`; `SUP_REMOTE` `sync.js:77`                     |
| `RevDoc`           | `id, kind:'rev', purpose, ledger, projectId, partyId, agreementId?, amount?, currency, fxRate, reversesId, reversalReason, createdBy, createdByName?, createdAtServer, deviceId`                                                              | `firestore.rules:1063`; `REV_REMOTE` `sync.js:74`                    |

```ts
// types/checkjs.d.ts, NEW, beside AccountPaymentApi (931-947)
interface AccountCorrectApi {
  install(api: RenderApi): void;
  deductDoc(input: object): { doc: object | null; errors: string[] };
  approveDeductDoc(input: object): { doc: object | null; errors: string[] };
  rejectDoc(input: object): { doc: object | null; errors: string[] };
  supersedeDoc(input: object): { doc: object | null; errors: string[] };
  reversalDoc(input: object): { doc: object | null; errors: string[] };
  endMeasurementDocs(input: object): { docs: object[]; errors: string[] };
  deductPosition(targetId: string, amount: number): { id: string; cumAmount: number } | { error: string };
  noMoreDeductLine(approvalId: string, cause: string): string;
}
```

### 2.5 How corrections stay append-only

- No original is ever edited or deleted. `accountTxns` has `allow update, delete: if false` (`firestore.rules:1131`), and I never calls `set` with a changed copy of an existing row. Every I save is `AccountsView.commitDoc(id, doc, rows, write)` (`public/accounts-view.js:131-135`), which appends only when the id is absent, then calls `queueDoc` once (`public/render.js:122-129`).
- Every correction is a **new row that points at the original**: `rej_<id>` (`targetId`), `sup_<id>` (`supersedesId`), `rev_<id>` (`reversesId` and `reversalReason`, "سبب التصحيح"). Each id is derived from the original, so the server allows only one of each (create-only on a fixed id). That is the same idea as the ledger's `rev_` + `reversalReason` (`public/ledger.js:250-306`, `firestore.rules:131-147`) and the foreman moves' `rev_` (`firestore.rules:320-359`).
- What a correction does to totals is decided only by the existing fold. `killerIds` and `walkLive` (`public/accounts.js:629-687`) treat a live `rev_`/`rej_`/`sup_` as killing its target. `rowCounts` (746-770) drops a deduct whose `appr_` does not count, and drops an `approveLabor`/`approveDeduct` whose target is dead. I adds no second fold.
- A queued correction cannot overtake its parent. `parentPointers` holds back a record whose `targetId`/`reversesId`/`supersedesId` names a still-queued id (`public/sync.js:820-828`).
- A `deduct` and its `appr_` are two documents, because `deduct` has `needsApproval: true` (`public/accounts.js:76`). One-step owner approval is deferred (sketch:636), so the owner taps `خصم`, then `اعتماد`.
- **Across devices (L4).** `adoptFound` (`public/sync.js:964-1000`) adopts the server copy when a same-id `appr`/`rej`/`sup`/`rev` already exists. What follows:
  - Two phones write `sup_<m>` with different `qty`. The second phone silently takes the first phone's `qty`. If the second phone also queued `appr_sup_<m>` for its own qty, `approveLaborCreate`'s `approvalAmountOk` refuses it. That id lands in `syncErrors` and must be exported before logout.
  - Two phones each write a `deduct` on the same approval. In r2 they could together exceed it, because the server checked only `amount <= approval.amount` (`firestore.rules:978`). **r3 (A13):** both phones compute the same next position id `d<g>…`. The second create on that id is denied, `adoptFound` parks the loser (D-7), and the owner re-enters it. A chain that would pass the approval amount is denied by the rule (§2.12). The client warning (C11(2)) stays.
  - A queued `appr_`/`approveDeduct` meets a `rej_` another phone already wrote. It is refused (`noRej`, `firestore.rules:779, 994`) and goes to the refused export.
  - The emulator test covers the first and third cases through `flushOutbox` (§3.3 steps 7-8).

### 2.6 What each card offers (owner, cost open, agreement resolves)

Card 1, measurements of this agreement. These are rows with `purpose 'laborQty'` and `agreementId === agreement.id`, `Accounts.rowLive` true, not in `syncErrors`, and no `appr_` outside `syncErrors`.

- `رفض السطر` (`act-reject-<id>`, `data-cc-rej`) on every such row, whether slot, uuid, or `sup_`.
  - On a slot, the accepted `rej_` makes G's `slotAttempt` move to n+1 (`public/accounts-work.js:322-329`), and G already paints `المحاولة <n> من 9` (957).
  - Generation 9 rejected ends the slot. That is G's existing `if (closed && n < 9)` at line 329.
- `نسخة جديدة` (`act-supersede-<id>`, `data-cc-sup`) with a qty input `cc-sup-qty`.
  - Its label reuses G's `كمية منجزة`/`أيام معتمدة` (961, 963).
  - Offered only on unit/daily uuid or `sup_` bodies whose next depth is at most 4. **Hidden on a slot** (sketch:376).
  - On a lump or milestone, the next try is `رفض السطر`, then G's next generation.
  - Accountant C1: a fix to quantity only uses `نسخة جديدة` before approval (`supCreate` needs no `appr_`, `firestore.rules:736, 761`). After approval, the fix is A12 below: end the measurement, then record a new one.

Card 2, `خصم`. One block per approval of this agreement that `Accounts.rowCounts` counts and that is not in `syncErrors`:

- The block holds:
  - the approval amount `money(amount)` and `معتمد`;
  - the input `cc-deduct` (label reuses H's `مبلغ`, `public/accounts-payment.js:40`);
  - a **mandatory** reason input `cc-ded-reason` labelled with the existing `سبب التصحيح` (C8);
  - `حفظ` (`act-deduct`).
- Typed digits are grouped through `AMOUNT_FIELD_IDS` (D-3) and saved through `AccountPayment.plainAmount` (`public/accounts-payment.js:189`), the same as `cw-lump` (`public/accounts-work.js:147-151`).
- Deducts are listed under their approval. States are defined by `appr_` presence, not liveness (L-c):
  - **pending**: live, and **no `appr_<deductId>` outside `syncErrors`**. Shows `بانتظار الاعتماد`, then **`اعتماد الخصم`** (`act-approve-deduct-<id>`; A5 final, Ameer 19:10, answers line 21), then `رفض السطر`.
    - A deduct whose `appr_` exists but was reversed is neither pending nor counting. No I button builds that state (H1(1)). It gets no `اعتماد الخصم` and no `رفض السطر` (`rej_` is refused once an `appr_` exists). It gets `عكس` on the deduct body, like an orphan.
  - **counting**: `معتمد`, its reason, and `عكس` on **the deduct body itself** (`act-reverse-<deductId>`, writes `rev_<deductId>`). That is H1(1) and C5. With D-4 the `rev_` row is not pending (T-I18).
- **Orphan block (N3).** After the approval blocks, one more block lists live deducts on this agreement's approvals where the approval does **not** count: it was reversed on another phone after this deduct synced.
  - The rules let that happen: `revCreate` checks no dependents (Architect probe).
  - Heading: the approval's `FIGURES` label `عمل معتمد` plus `معكوس`, both existing words.
  - Per deduct:
    - pending (no `appr_` outside `syncErrors`) → `رفض السطر` (probe: `rej_` of an orphan is allowed);
    - has an `appr_` → `عكس` on the deduct body (needs D-4 so the `rev_` is not pending).
  - Test T-I25.
- C6 (decided): a pending deduct is corrected only by `رفض السطر` plus a new `خصم`. `نسخة جديدة` is never offered on a deduct.
- C7 (decided): the cap is per approved measurement, cumulative.
- C10 / A10 (Ameer 19:08 «مقبول», answers line 8): the deduct `txnDate` is today (`today()`, `public/session.js:172`). It links to the work through `targetId`.
- C11 and A13:
  - (1) `approveDeductDoc` re-runs the client cumulative check at approval time (`approvedDeductSum`, `public/accounts.js:417-433, 454-456`), with a fresh `liveLedger()` on every tap.
  - (2) When the live deducts on one approval sum above it, card 2 shows the existing `الخصم أكبر من العمل المعتمد` on that approval, and the owner reverses the excess. «حسابات» shows the same word from `overLimitIds` (`public/accounts.js:850, 862`; `public/accounts-view.js:439`). Kept as defence in depth.
  - (3) **Server enforcement is now in I** (A13, §2.12). With the rule in place, the over-cap state can no longer be created through the server.
  - When `deductPosition` returns `full` (Q-2: 9 is enough, accountant 19:27, L25), `blocked` (M-A), or `spent` (Q-3), card 2 hides `cc-deduct` and `حفظ` for that approval and shows `noMoreDeductLine` (§2.12 i): a reason line S10/S11/S12, then the remedy S13 (another approved measurement of the same agreement) or S14 (end this one).
- **C8 reason storage, verified against the rules.**
  - `deductCreate`'s `hasOnly` has `description` and no `reversalReason` (`firestore.rules:973`). `optDesc` allows at most 500 characters (502-504).
  - So the reason is stored in `description`, trimmed, 1 to 500 characters. "Mandatory" is client-side only.
  - The label reuses `سبب التصحيح` (`public/accounts-work.js:983`, `public/render.js:835, 838, 1532`, `public/ledger.js:258, 572, 577, 803`, `public/foremen.js:458`). An empty reason returns `reason` (G's code, `public/accounts-work.js:282`).

Card 3, `عكس`. One reason input `cc-reason` labelled `سبب التصحيح` (**mandatory**: the builders return `reason` when the trimmed length is not 1-500; rules 1072-1074 require it too). One `عكس` (`act-reverse-<id>`, `data-cc-rev`) per row of this party on this project that `reversible(row)` accepts:

- **An `approveLabor` approval: `عكس` ENDS the measurement (A12/C9).** Accountant 19:09, deciding under Ameer's «دع المحاسب يختار الاصح» (answers lines 10, 16): «reversing an approval ENDS the measurement (one tap, one reason); if work is correct, record a new measurement».
  - One tap calls `endMeasurementDocs`, then `commitDoc` once per returned doc, in order (D-5).
  - The docs are `rev_appr_<top>`, `rev_<top>`, and a `rev_` of every lower link of a `sup_` chain down to the root, all with the one reason.
  - **This replaces r2's two-step H1(3)** (reverse the approval, then a separate `عكس` on the body), which conflicted with "one tap".
  - Why every link: `walkLive` makes a row dead while any live killer exists (`public/accounts.js:657-687`). Reversing only the head `sup_` row brings the row below back to life as pending (Architect N2, S19). Reversing every link leaves no live link.
  - For a slot, the chain is the one slot body. `rev_appr_` makes `slotAttempt` open n+1 (`public/accounts-work.js:323-329`).
  - **Recovery, not a second path.** If an approval-reversed chain still has a live link (a refused `rev_`, or N2 data from before I), that live link shows `عكس`. It calls the same `endMeasurementDocs`, which skips docs that already exist. This keeps r2's H1(3) exit only as a repair, with the same builder and the same end state.
  - §2.11 has the totals evidence and tests.
- `approveDeduct` is **never** reversible from the screen (H1(1)). An approved deduct is undone through `rev_<deductId>` in card 2.
- A cash body (`payLabor`, `advanceLabor`, `returnAdvance`, `refundLabor`) or a live `revw` mark: `Accounts.rowLive(row)` true, not in `syncErrors`.
- **Not** a row with a live dependent (C2; A11, Ameer 19:08 «مقبول», answers line 9):
  - a `payLabor` with a live `refundLabor`;
  - an `advanceLabor` with a live **`returnAdvance`**. Verified at source:
    - `returnAdvance` is a pointer cash body with `targetId` → `advanceLabor` (`public/accounts.js:74`; rules `returnAdvanceCreate` `firestore.rules:893-906`, dispatcher 1124);
    - `rowCounts` does not drop it when its target is reversed (746-770 has no target check for it);
    - the fold sums it into `cashReturned` (843) and `drawOn` (851).
  - an `approveLabor` with a live deduct, pending or counting (H1(2), A11).
  - (J's `settle` on an `advanceLabor` would be a fourth dependent. None can exist before J.)
  - In each case the row shows **one line in place of the button**: «اعكس الاسترداد أو الإرجاع أو الخصم المرتبط أولاً». That is A14(b), accountant 19:09 (answers line 18) under Ameer's «لم افهما دع المحاسب يقرر» (line 12). It names the return case too (Architect L-a). Test T-I27.
- **Not** a `rev_`/`rej_` row (`kind`, sketch:622).
- Row label: the existing statement word for the purpose from `FIGURES` (`public/accounts.js:535-547`), `تدقيق` for a `revw`, or G's `منجز` for a `laborQty` link. Amount via `money`.
- After a `rev_` of a `revw_` mark, H's `nextGeneration` offers `تدقيق` again (`public/accounts-payment.js:444-457`).
- **Negative-net warning and two-tap confirm (C1).** The two taps are approved by Ameer 19:13, «إي، صلحوا السطر وخلوا التأكيد بضغطتين» (answers line 22). The wording is A14(a), accountant 19:09 (line 17).
  - Before an approval reversal saves, the card computes `net` after it on a local copy: `Accounts.balances(rows + all candidate docs, { partyId, projectId, syncErrors }).net`, read-only.
  - When that net is below 0, the first tap shows «بعد العكس يصير مستحق عليه [المبلغ] د.ع». The amount is `Ledger.fmt(-net)`, exact. `Ledger.fmt` is `Math.abs(n).toLocaleString('en-US')` (`public/ledger.js:484`), and amounts are integers, so nothing is rounded. It is followed by `د.ع`, as in `public/accounts-view.js:48`.
  - The second tap commits. Test T-I20.

Buttons that are off (not hidden), with nothing queued:

- the project is not `active` (G's `projectOpen`, `public/accounts-work.js:216-219`; rules `projectActive` 374-376);
- **the fixed id is already in `syncErrors`** (`rej_<id>`, `sup_<id>`, `rev_<id>`, `appr_<deductId>`; for an approval `عكس`, any of the `endMeasurementDocs` ids). That id cannot be sent again, and there is no re-send (sketch:66). Same rule as G's `refusedReversal` (`public/accounts-work.js:209-211`). The refused id shows `رُفض الإرسال` (`public/sync-status.js:12`) and goes to the refused export (`refusalDocs`, `public/render.js:134-150`; the export CSV text is built at 619-640);
- the reason is empty (for `عكس` and `خصم`);
- for an approval `عكس`: until the second confirm tap, when the C1 warning shows.

### 2.7 Error sentences (no new mapper, sketch:605)

| Code                                                  | Sentence                                                                                                                                  | Source                                              |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `range`, `amount`, `overflow`, `inexact`              | `المبلغ ليس عدداً صحيحاً`                                                                                                                 | sketch:615; already in `public/accounts-work.js:43` |
| `cap`, `cumulative` on `deduct`/`approveDeduct`       | `الخصم أكبر من العمل المعتمد`                                                                                                             | sketch:618                                          |
| `targetId`                                            | none; the button stays off                                                                                                                | sketch:620                                          |
| `full` / `blocked` / `spent` (Q-2, M-A, Q-3)          | S10 / S11 / S12, then S13 or S14 in place of the input and `حفظ` (recommendations, shown at merge)                                        | §2.12 i                                             |
| `dependent` (`endMeasurementDocs` with a live deduct) | the A14(b) line in place of `عكس`                                                                                                         | A11                                                 |
| `kind`                                                | none; `عكس` stays hidden                                                                                                                  | sketch:622                                          |
| `method`, `approved`, `cancelled`, `reason`           | none; the button is hidden (method, approved, cancelled) or stays off (reason). G's `القياس معتمد مسبقاً` is G's and I does not paint it. | G's pattern, `public/accounts-work.js:592-609`      |

### 2.8 Strings

New on I (sketch:378), with A5 applied: `نسخة جديدة`, `رفض السطر`, **`اعتماد الخصم`** (replaces the sketch's bare `اعتماد`), `خصم`, `الخصم أكبر من العمل المعتمد`.

- **`اعتماد الخصم`** is Ameer's final choice (19:10, answers line 21). His first answer, «اعتماد قياس العمل» (line 5), equals G's measurement-approval card title (`public/accounts-work.js:973`) and its action label (`public/accounts-work.js:776`). The accountant flagged the clash (line 20), and Ameer re-chose. On «مقاول», G's card says `اعتماد قياس العمل` and I's deduct button says `اعتماد الخصم`. No label is shared, so there is no ambiguity.
- Checked at f09a57e5: `اعتماد الخصم`, `نسخة جديدة`, `رفض السطر`, and `خصم` as a button are absent from `public/`. `الخصم أكبر من العمل المعتمد` **already exists** (`public/accounts-view.js:439`).

New from A14 (accountant 19:09 under Ameer's «لم افهما دع المحاسب يقرر», answers lines 12, 17-18). These are final, not proposals:

- **S4**: «بعد العكس يصير مستحق عليه [المبلغ] د.ع». `[المبلغ]` is `Ledger.fmt(-net)`, exact.
- **S5**: «اعكس الاسترداد أو الإرجاع أو الخصم المرتبط أولاً».
- Neither is in `public/` today. `مستحق عليه` exists (`public/accounts-view.js:372`), and `د.ع` follows amounts at `public/accounts-view.js:48`.

Reused: `عكس`, `معكوس`, `سبب التصحيح`, `حفظ`, `مبلغ`, `معتمد`, `مرفوض`, `بانتظار الاعتماد`, `كمية منجزة`, `أيام معتمدة`, `رُفض الإرسال`, `تدقيق`, `عمل معتمد`, and the `FIGURES` labels.

New in r4, **recommendations shown to Ameer at merge** (Q-2, Q-3, M-A; the accountant asked for "a clear line instead of the button", L25):

- S10 «هذا القياس وصل حد 9 خصومات.»
- S11 «رُفض إرسال خصم على هذا القياس.»
- S12 «ما بقى مجال خصم على هذا القياس.»
- S13 «سجّل الخصم على قياس معتمد ثاني لنفس الاتفاق.»
- S14 «ما أكو قياس معتمد ثاني: اعكس الخصومات ثم الاعتماد، وسجّل قياس جديد.»

None of them is in `public/` today.

No other new string. All of I's strings live in one `SENTENCE` table, so EA can swap any recommendation with a single edit.

### 2.9 CONTRACTOR_COST_START

Stays `null` (`public/accounts.js:11`). I reads the export each call, like G's `startDate`/`costOpen` (`public/accounts-work.js:102-110`). While null, the «مقاول» link is gone (G `syncTab` 828-848), `blocks` returns `''`, and every I save returns before `commitDoc`. Tests flip the runtime export in the vm and the drive flips it in the page. The source stays null, and browser-check already asserts that (`tests/browser-check.js:267-268`). So I ships **dark** in production until an engineer sets the date after Ameer's go.

### 2.10 Named exceptions to the sketch's file lists (need Architect OK)

- **D-1 + M2 (Architect: AGREE with M2; Ameer APPROVED: A8, 19:08, «٤-نشيله», answers line 6, "hide «اعتماد قياس العمل» on rejected/superseded/approval-reversed rows").** The sketch's I section (332-391) does not list G's file. At f09a57e5 `currentBody` (`public/accounts-work.js:640-658`) picks the last unit/daily `laborQty` row that is not in `syncErrors` and has no _live_ approval. That causes two failures:
  - (a) after `rej_<m>` or `sup_<m>`, G still offers `اعتماد قياس العمل` on `m`, and `approveLaborCreate` refuses it (`noRej`/`noSup`, `firestore.rules:779-780, 790-791`);
  - (b) **M2**: after `rev_appr_<m>`, `liveApproval(m)` is false (444), so G offers `m` again. A tap builds `appr_m`, and `commitDoc` silently appends nothing because the id is already local. The Architect probe on f09a57e5 shows `offered:true, rowsAdded:0, outboxAdded:0`.

  Fix, unit/daily loop only (slots already move on through `slotAttempt`): skip a row when `!Accounts.rowLive(row, index)` **or** when an `appr_<row.id>` row exists outside `syncErrors`, reversed or not. That is two conditions in one place.

  Effect (L5 wording): in case (a), a refused `appr_` lands in `syncErrors`, and logout is blocked **until the refused export is saved** (`rejectedLogoutBlock`, `public/render.js:613-618`, with `K.rejectedExportedIds`), not for ever. I adds no flush call, so the #86 tail cap is untouched.

  **Where in the UI code (A8):**
  - The card `اعتماد قياس العمل` and its `act-approve-labor` button are painted only when `offered && !approved` (`public/accounts-work.js:939-953, 971-975`).
  - `offered` comes from `currentBody` (640-658).
  - So the single change in `currentBody` hides the button on rejected, superseded, and approval-reversed rows. Nothing else in G changes.
  - The `onClick` path (733) also reads `currentBody`, so a stale tap builds nothing.

  **Tests:** T-I10, with three cases: rej, sup ordered first (L1), and rev_appr (M2). Mutations M10 and M10b. T-I28 covers G's screen after A12.

  The alternative, I hiding G's approve button from outside, would put two owners on one button.

- **D-2 input shapes.** The sketch's signatures take `AccountHeader & {...}` (sketch:241, 353-371). Shape A takes the target id plus the actor and copies the rest from the target. `rev_`, `rej_`, and `approveDeduct` carry no `txnDate`, and `rej_` carries no `projectId`/`partyId`, because the rules' `hasOnly` lists forbid them (`firestore.rules:1008, 1038, 1063`).
- **D-4 `public/accounts.js:848` (Architect N1; APPROVED by Ameer 19:13, «إي، صلحوا السطر وخلوا التأكيد بضغطتين», answers line 22).**
  - The rules force a `rev_` to copy its original's `purpose` (`firestore.rules:1064`). So `rev_<laborQty>` and `rev_<deduct>` have a `needsApproval` purpose.
  - They never count (`rowCounts` 750 returns false for a marker), and so they sat in `pendingIds` for ever. «حسابات» painted `بانتظار الاعتماد` on them (`public/accounts-view.js:435, 462`).
  - Fix: `&& !markerKind(doc)` at 848. Totals are untouched, because the `counts` branch (838-846) is unchanged. A `rej_` has no purpose and was already clean.
  - Tests: T-I18, T-I19, T-I24 and T-I26 assert `pendingIds` is **empty** and the statement HTML has no `بانتظار الاعتماد`. Mutation M25.
- **D-5 one tap, several documents (A12).** sketch:84 says each builder returns one document.
  - `endMeasurementDocs` returns 2-6 `rev_` docs. The click handler calls `commitDoc` once per doc, in the order returned, inside one synchronous handler, so there is no await between them. Each `commitDoc` still appends one id.
  - All docs are fixed-id `rev_`, so a second tap appends nothing (T-I7).
  - `parentPointers` never treats a `rev_` id as a parent (`public/sync.js:816-828`). So the docs flush independently in queue order. If one is refused, it is in `syncErrors`, and the recovery `عكس` (§2.6 card 3) re-offers the remainder.
- **D-6 `firestore.rules` deduct cap (A13).** §2.12. The scope guard is §2.12 (g).
- **D-7 `public/sync.js`** (needed by A13). Approved for the cap only: Ameer widget answer relayed by EA, 19:29, «إي، عدّلوا ملف المزامنة لفحص الخصم بالسيرفر بس» (L28). Four edits, §2.12 (e).
- **D-3 `public/accounts-payment.js` `AMOUNT_FIELD_IDS`.** The sketch predates the separator work. Ameer's 13:50 «اريد الحفظ ايضا به فوارز» and the slice-5 guard (`tests/browser-check.js:17-21, 401-403`) fail any screen input that is in neither `AMOUNT_IDS` nor `NON_AMOUNT_IDS` (`unlisted-input`). The one owner of grouping is H's listener (`public/accounts-payment.js:1032-1052`). Adding `'cc-deduct'` there keeps "These screens add no listener" (sketch:733) true for I.

### 2.11 A12: an ended measurement counts in no total and never shows «بانتظار الاعتماد»

The accountant asked the engineer to confirm this (answers line 16). Evidence at f09a57e5, for the end state after `endMeasurementDocs`: `rev_appr_<top>`, plus a `rev_` on every chain link.

**Totals.**

| Where                                  | Why the ended measurement is not in it                                                                                                                                  | file:line                                       |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| A `laborQty` row itself                | It is in no total at all: effect `{cost:0, person:0, cash:0}`, statement line `outside`. The fold has no `laborQty` branch.                                             | `public/accounts.js:70`, `838-846`              |
| `approvedLabor`, `net`, `payableGross` | `appr_<top>` has a live `rev_` killer, so `rowLive` is false and `rowCounts` is false. Separately, its target is dead, which also gives false.                          | `public/accounts.js:747, 751-754, 839, 865-866` |
| `projectCost` (K)                      | It sums only `approveLabor` with `rowCounts` true.                                                                                                                      | `public/accounts.js:1048`                       |
| Deducts                                | None is live (A11 blocks the tap while one is). An orphan from another phone stops counting, because its approval no longer counts (757-761), and card 2 lists it (N3). | `public/accounts.js:757-761`                    |
| CSV                                    | `accountTxns` are never exported.                                                                                                                                       | `public/render.js:1557-1560`                    |

**Never «بانتظار الاعتماد».**

| Screen                  | Source of the word                               | Why it does not show                                                                                                                          | file:line                                               |
| ----------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| «حسابات» row            | `pendingIds`                                     | Each chain link is dead (`live` false at 848). The `rev_` rows are markers, excluded by D-4.                                                  | `public/accounts.js:848`; `public/accounts-view.js:435` |
| «حسابات» statement note | `pendingIds.length`                              | Empty, as above (all-time mode included, since a `rev_` has no `txnDate`).                                                                    | `public/accounts-view.js:462`                           |
| «مقاول» (G) detail      | `currentBody` → `notes.push('بانتظار الاعتماد')` | Unit/daily: D-1 skips a row that is not `rowLive`. Slot: `rev_appr_` makes `slotAttempt` move to n+1, so the old body is never `currentBody`. | `public/accounts-work.js:947-950, 640-658, 323-329`     |
| Status word             | `statusWord`                                     | A dead row with a live `rev_` shows `معكوس`.                                                                                                  | `public/accounts-view.js:242-254`                       |

**What r2 got wrong.** r2 reversed only the approval in one tap. At f09a57e5 that leaves the body live, needing approval, and not counting, so it is in `pendingIds` (848). The Architect's state table shows the same ("m approved, no D → `عكس` A → m pending"). The second tap then left `rev_m` pending (N1). r3's one tap plus D-4 closes both.

**Tests:**

- **T-I19 (rewritten):** unit `m2` approved, then `عكس` on `appr_m2` with a reason. Exactly 2 docs are appended, `rev_appr_m2` and `rev_m2`. Then:
  - `balances().pendingIds` deep-equals `[]`;
  - `approvedLabor` drops by the approval;
  - `projectCost` drops (date set);
  - the «حسابات» HTML has no `بانتظار الاعتماد`;
  - G's detail has no `act-approve-labor` and no `بانتظار الاعتماد` for `m2`.
- **T-I24 (N2):** chain `m2` ← `sup_m2` ← `sup_sup_m2`, with `appr_sup_sup_m2`.
  - One tap appends 4 docs: `rev_appr_sup_sup_m2`, `rev_sup_sup_m2`, `rev_sup_m2`, `rev_m2`.
  - `pendingIds` is `[]`, and no chain link is `rowLive`.
  - A control state with only the head reversed shows `sup_m2` pending. That is the reason for every link.
- **T-I26 (D-4):** for each exit (`rev_<deductId>`, `rev_<slot gen 1>`, `rev_sup_…`), `pendingIds` is `[]`. On a scratch copy without D-4, T-I26 is RED (M25).
- **T-I28:** slot gen 1 ended → G paints `المحاولة 2 من 9`, and there is no pending note for gen 1. A new measurement afterwards is offered normally (C9: "if work is correct, record a new measurement").
- Recovery: with `rev_appr_m2` present and `rev_m2` in `syncErrors`, card 3 shows `عكس` on `m2`, and the tap appends nothing new for `rev_m2`, whose fixed id is refused, so the button is off (T-I12 pattern). With `rev_m2` simply absent, the tap appends only `rev_m2`.

### 2.12 A13: server-side cumulative deduct cap (rules design for Architect review)

Ameer 19:08, raw: «٩-فحص بالسيرفر» (L11; the parenthetical on that line is EA's note, L-1). The scope is his 19:29 «إي، عدّلوا ملف المزامنة لفحص الخصم بالسيرفر بس» (L28). D-6 (rules), R0-R12, the `deductOf` rewrite, the line-1405 flip, and D-7 (`sync.js`) **ship together in one PR and revert together** (L-2). Rules without D-7(1) deny every deduct. D-7 without the rules hunk builds `d<g>` ids that the old `uuidOk` denies.

**(a) Where the gap is today.**

- `deductCreate` (`firestore.rules:957-984`) checks only `d().amount <= approval.data.amount` (978). The cumulative check exists only on the phone (`post` `sumLine`, `public/accounts.js:334-342, 404`; `approvedDeductSum` 417-433, 454).
- The rules suite **pins the gap as allowed**: `tests/emulator/account-rules.test.js:1404-1405` allows two 600,000 deducts on one 600,000 approval.
- D's sketch already named the hole: "Closing it in rules would need a query or a running-total document, which v1 does not add" (`docs/plans/contractor-pr-d-sketch.md:725`).

**(b) Options, judged honestly.** Firestore rules cannot sum a query, and `accountTxns` is create-only (`allow update, delete: if false`, `firestore.rules:1131`).

| Option                                                     | How                                                                                                                                                        | Verdict                                                                                                                                                                                                                              |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Running-total field on the approval doc                 | Each deduct also updates `appr_<m>.deducted` in a batch; the rule checks `getAfter`.                                                                       | **Rejected.** It needs `update` on `accountTxns`, which ends append-only for every kind and widens the rules beyond the cap. `flushOutbox` writes one doc per `write(local)` (`public/sync.js:1029`), with no batches.               |
| 2. Per-approval counter doc in a new collection            | A batch of {deduct, counter update}. The rule checks `getAfter(counter).total == get(counter).total + amount <= approval`. A reversal batch decrements it. | **Rejected.** It needs a new collection, an update rule, a pull spec, batched writes in `sync.js`, and edits to `revCreate`/`rejCreate` for release. Large and not "the cap only".                                                   |
| 3. A uuid deduct with a `prevDeductId` + `cumAmount` chain | The rule checks `cum = prev.cum + amount`.                                                                                                                 | **Unsound.** Two phones can both chain off the same `prev`. Nothing makes the successor unique.                                                                                                                                      |
| 4. Read every earlier deduct in the rule                   | Sum `get`s of positions 1..n-1.                                                                                                                            | **Unsound within budget.** `deductCreate` already uses 5 reads. The cap is 10 (`docs/plans/contractor-pr-d-sketch.md:721-723`).                                                                                                      |
| **5. Position ids + carried cumulative (chosen)**          | Deduct id is `'d' + g + targetId`, g 1..9, create-only. It carries `cumAmount`. The rule reads only position g-1.                                          | **Simplest sound.** A fixed id makes each position unique: a second create on it is an update and is denied (1131). So two phones cannot both take position g, and `cumAmount` is checked against the one real predecessor. 8 reads. |

**(c) Chosen design.**

- **Id.** `'d' + g + targetId`, where `targetId` is `appr_<bodyId>`. There is no separator, to keep the length inside `idOk`'s 64 (`firestore.rules:19`).
  - Worst case is a depth-4 `sup_` body: `appr_` + `sup_`×4 + 36 = 57, so the deduct id is 59.
  - `appr_<deductId>` = 64 ✓. `rev_<deductId>` and `rej_<deductId>` = 63 ✓.
  - The id starts with `d`, so `markerId`/`markerKind`/`SLOT_ID`/`isSlotBody` never match it (`public/accounts.js:240-242, 564-572`; `public/sync.js:704, 811-813`).
  - No deduct exists in production (I is dark, and nothing in `public/` builds one today: `rg deduct public` finds only `accounts.js`, `accounts-view.js`, and `sync.js:101`). So switching from uuid ids needs no migration.
- **Field.** `cumAmount`, an int.
  - Position 1: `cumAmount == amount`.
  - Position g > 1: `cumAmount == prev.cumAmount - (prevGone ? prev.amount : 0) + amount`, where `prev` is position g-1 and `prevGone` is a `rev_` or `rej_` of it existing.
  - Always `cumAmount <= approval.amount`.
  - Invariant: the sum of live deducts on the approval is ≤ `cumAmount` of the last position ≤ the approval.
- **Rule diff sketch.** All four helpers go **inside `match /accountTxns/{id}`**, next to `deductCreate`. They use `id` and `d()`, and `d()` exists only there (`firestore.rules:656`). They do not go in service scope beside `charGen` (394-404) or `prevRevwId` (505-515) (L-6):

```diff
+      // A13 (Ameer 19:08 «فحص بالسيرفر»). Deduct position ids: 'd1'..'d9' + targetId.
+      function dedGen(t) {
+        return id == 'd1' + t ? 1 : id == 'd2' + t ? 2 : id == 'd3' + t ? 3
+          : id == 'd4' + t ? 4 : id == 'd5' + t ? 5 : id == 'd6' + t ? 6
+          : id == 'd7' + t ? 7 : id == 'd8' + t ? 8 : id == 'd9' + t ? 9 : 0;
+      }
+      function dedId(t, g) {
+        return 'd' + string(g) + t;
+      }
+      function prevCumOk(prev, prevId) {
+        let gone = exists(/databases/$(database)/documents/accountTxns/$('rev_' + prevId))
+          || exists(/databases/$(database)/documents/accountTxns/$('rej_' + prevId));
+        return prev.data.purpose == 'deduct'
+          && prev.data.targetId == d().targetId
+          && prev.data.cumAmount is int
+          && d().cumAmount == prev.data.cumAmount - (gone ? prev.data.amount : 0) + d().amount;
+      }
+      function cumOk(g) {
+        return g == 1
+          ? d().cumAmount == d().amount
+          : prevCumOk(get(/databases/$(database)/documents/accountTxns/$(dedId(d().targetId, g - 1))), dedId(d().targetId, g - 1));
+      }
       function deductCreate() {
         ...
-          && uuidOk(id)
+          && idOk(id)
+          && dedGen(d().targetId) >= 1
           && d().id == id
           ...
-          && d().keys().hasOnly(['id', 'kind', 'purpose', 'projectId', 'partyId', 'ledger', 'currency', 'fxRate', 'amount', 'targetId', 'txnDate', 'description', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'])
+          && d().keys().hasOnly(['id', 'kind', 'purpose', 'projectId', 'partyId', 'ledger', 'currency', 'fxRate', 'amount', 'cumAmount', 'targetId', 'txnDate', 'description', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'])
           && moneyOk(d())
           && live
           && approval.data.purpose == 'approveLabor'
           && approval.data.kind == 'appr'
           && d().amount <= approval.data.amount
+          && d().cumAmount is int
+          && d().cumAmount <= approval.data.amount
+          && cumOk(dedGen(d().targetId))
           ...
```

`string(int)` is not used in today's rules, but the Architect's emulator run confirmed it (review §3, R0: d2 at the limit allowed through `dedId(…, g-1)`). There is no ternary fallback. R0 stays as a regression test.

**Never batch positions.** `get` does not see a doc written in the same batch (`getAfter` would). So d1+d2 in one batch is denied, and so is d(g)+`appr_d(g)` (review §3, INFO). `flushOutbox` writes one doc per `write(local)` (`public/sync.js:1029`). The code PR must not add batching for deducts, and a sync test asserts one write per deduct.

**Read budget.** user, project, party, approval, `exists rev_appr` (5, today) + `get` prev + 2 `exists` = **8 ≤ 10**. The `get` of position g-1 runs only when g > 1, and that doc must exist: a gap is denied. That follows D's rule "a `get` only of a document that must exist" (`docs/plans/contractor-pr-d-sketch.md:723`).

**(d) Reversals and rejections: do they release cap? (Q-3, accepted by the accountant at 19:27 with conditions, L26)**

- **Yes, for the latest position.** If a `rev_`/`rej_` of position g-1 exists when position g is written, g-1's amount is released (`gone`).
- **No, for an older position** killed after a later one was written. Its amount stays inside `cumAmount` for good.
  - The Architect's emulator example: d1 = d2 = 300,000, both reversed, d1 first. d3 must carry cum 600,000, so 300,000 of cap space is lost on that measurement, even though nothing is live.
  - This is conservative: the server never allows more than the approval.
- **Condition (1): a reversed deduct only uses up cap space.** It never reduces `net` and never shows in deductions. At source:
  - a `rev_`/`rej_` makes the deduct dead, so `rowCounts` is false (`public/accounts.js:747`), and the fold adds it to `deductions` only when it counts (845);
  - `net` and `payableGross` read `deductions` (865-866);
  - `statementLines` reads the same fold;
  - card 2 lists a reversed deduct only as `معكوس`, with no amount in any sum;
  - «حسابات» shows the row with `معكوس` (`statusWord`, `public/accounts-view.js:242-254`).

  `cumAmount` is read by `deductPosition` and the rule only. The fold never reads it. Test T-I31 proves it (fold + UI).

- **Condition (2): remedy order**, used by every "no more deducts here" line in §2.12 (i):
  - first, record the deduct on **another approved measurement of the same agreement** (another card-2 block that counts and is open);
  - only if none exists, end this measurement: reverse its deducts, then its approval (A12, C9 order), and record a new measurement.
- Approval reversed: the existing `live` check (962, 977) already refuses any new position. `approveDeductCreate` is unchanged. Capping the bodies is enough, because approved deducts are a subset.

**(e) `sync.js` and the offline queue (D-7).** Approved for the cap only: Ameer widget answer relayed by EA, 19:29, «إي، عدّلوا ملف المزامنة لفحص الخصم بالسيرفر بس» (L28).

1. **Keys.**
   - `txnRemoteKeys` returns `POINTER_CASH_REMOTE` for a deduct (`public/sync.js:101`), and `toRemote` keeps only listed keys, so `cumAmount` would be stripped and every deduct denied.
   - Fix: `DEDUCT_REMOTE = POINTER_CASH_REMOTE.concat(['cumAmount'])` for a deduct at 101. Refunds and returns keep `POINTER_CASH_REMOTE`.
2. **Parent hold-back.**
   - `parentPointers` (816-828) gives a deduct only `targetId`. If position g-1 fails transiently (`keepId`, 1032), the loop `continue`s and sends position g. Its `get` of g-1 fails, and it is **refused for good**.
   - Fix: for an id matching `^d[2-9]appr_`, also return `'d' + (g-1) + targetId` as a parent pointer, derived from the id with no new field. Then the existing `keptSet` hold-back (1019) applies.
3. **Hold on the reversal or rejection of g-1 (M-B).**
   - `deductPosition` uses `prevGone` when a `rev_`/`rej_` of g-1 exists locally. If that marker is still queued, or was kept after a transient failure, position g would go first. The rule would then see no marker, the cum would not match, and g would be refused for good.
   - `parentPointers` must keep excluding `rev_` ids (816 comment), so this is a separate function:
     - `deductHoldIds(doc)` returns `['rev_' + prevId, 'rej_' + prevId]` for a position deduct with g > 1. `prevId` is derived from the id; for g = 1 it returns `[]`.
     - **M-C (r5): hold only on a marker that is EARLIER in the queue and not synced.** In the flush loop, right after the `parentPointers` checks (1010-1019), for each hold id h with `0 <= ids.indexOf(h) < index` and `!syncedSet.has(h)`:
       - h in `keptSet` (transient) → `keepId(id); continue`;
       - h in `failedSet` → `failAccount(local)`. That marker never reached the server, and g was built with `prevGone`, so the rule would deny it. M-A's block line applies.
     - A hold id that is **later** in the queue, or not queued at all, or already synced, does nothing.
     - Why "earlier": `deductPosition` sets `prevGone` only when the marker already exists locally. `queueDoc` appends to the outbox in tap order (`public/render.js:122-129`), so a marker that g relied on is always earlier than g.
       - A marker that is later was written **after** g. So g was built with g-1 live: `cumAmount = prev.cumAmount + amount`.
       - When g is sent first, the rule's `gone` is false (the `rev_`/`rej_` is not on the server yet), so it expects exactly that cum and **accepts** g. The marker is then sent and accepted (`revCreate`/`rejCreate` do not look at g).
       - r4's condition (`ids.indexOf(h) > index`) held g behind that later marker, the reverse of what is needed. The Architect reproduced on real `sync.js` that main accepts deduct 2 while r4 refuses it for good.
     - After that order, the reversed g-1 is an **older** dead position for g+1 (g is the latest and live). So its amount stays inside the cap space (Q-3, accepted). It never reduces net (T-I31).
   - No new retry trigger is added (PR #86 hot loop): a held deduct is `keepId`'d through the existing path.
4. **Lost position.**
   - Phone B's position g collides with phone A's. Today the write is denied, `readDependency` finds A's doc, and `adoptFound` returns `refused` for a `body` that is not a slot (964-1000).
   - Fix: in `adoptFound`, adopt A's copy for a lost position-id deduct. `adoptServer` stores A's copy, and B's own doc is parked in `slotLosers` (`slotLoserKey`, 785).
   - **This edit stays in scope (cap only) under three conditions, all binding on the code PR** (REVIEW-plan-I-r4-22ed11e8.md, sha256 8244944bc1003f1a43e818de5038304e4fbd4c87e511a7d59d7bd8890042de02):
     - (a) it matches **only deduct position ids**: `local.docType === 'accountTxn' && local.kind === 'body' && local.purpose === 'deduct'` and the id matches `^d[1-9]appr_`. It is a **new, separate branch** placed after the slot-body branch;
     - (b) the **slot-body branch (970-975) is unchanged** byte for byte. The PR diff shows no edit inside it;
     - (c) a test proves **other bodies are still refused**: a same-id collision of a `payLabor`, a `returnAdvance`, a uuid `laborQty` body, and a uuid-id `deduct` built by hand still returns `refused` (they land in `syncErrors`, as on main). The test goes in `tests/sync-status.test.js`, beside the existing `slotLosers` cases (514-539). Mutation M40.
   - The parked loser shows in the refused export with the existing message «القيد موجود على الخادم بمحتوى مختلف» (`SyncStatus.CONFLICT`, `public/sync-status.js:13`; used for `slotLosers` keys at `public/render.js:151`), **not** «رُفض الإرسال».
   - `parkSubtree` (926-959) then parks every queued descendant whose pointer is the lost id: B's `appr_d(g)`, `rev_d(g)`, and (through edit 2) `d(g+1)`. That is correct, because their cum and approval were built on B's copy (L-3, test T-I33).
   - The refused export lists `slotLosers` (`public/render.js:149-151`), and they block logout until exported (`rejectedLogoutBlock` 613-618). B re-enters the amount at the next free position.

- `public/accounts.js` needs **no** change for A13. `post('deduct')` never checks the id format (`postCapped` 395-410).
- The client keeps its interim check and the over-cap warning (C11(1)(2)). `deductPosition` refuses with `cumulative` before queueing anything the rule would deny.

**(i) M-A: a refused position must not poison later deducts. Chosen: stop on that measurement with a clear line, and point to the remedy order.**

_Reuse of the refused id, judged and rejected as unsound inside I's scope._ The id `d(g)` never reached the server, so on the server it is free. On the phone it is not:

- `commitDoc` appends only when the id is absent (`public/accounts-view.js:131-135`), so a new `d(g)` cannot be queued while the refused row is stored.
- `syncErrors` is keyed by id, and `walkLive` treats that id as dead (`public/accounts.js:668-670`). So a re-sent `d(g)` would be invisible on the phone that sent it.
- The refused export reads the row by id (`refusalDocs`, `public/render.js:134-147`). Replacing the row would drop the refused amount from the export that logout waits for.
- Freeing the id would need a new "move refused row aside" path in `sync.js`/`render.js` and in `rejectedExportedIds` handling. That is beyond the cap-only edits Ameer approved.

_Chosen design (no new sync behaviour)._

- `deductPosition(targetId, amount)` returns `{ error: 'blocked' }` when **any** local position id of that approval (`d1`..`d9` + targetId) is in `syncErrors`.
  - A position adopted from the server (edit 4) is a server copy, not in `syncErrors`, so it does not block.
  - A parked loser lives under a `slotLoser:` key, not under the position id, so it does not block either.
- Card 2 then hides `cc-deduct` and `حفظ` for that approval and shows one line (§2.8, S10/S12): the reason, then the remedy.
  - A refused deduct is dead on the phone (in `syncErrors`), so it does not count, is not live, and does not trigger A11's block on ending the measurement.
  - **Docs already queued behind the refused deduct fail too** (REVIEW-plan-I-r4-22ed11e8.md, sha256 8244944bc1003f1a43e818de5038304e4fbd4c87e511a7d59d7bd8890042de02):
    - its `appr_d(g)` has pointer `d(g)` and fails through the existing `failedSet` check (`public/sync.js:1015-1018`);
    - a later `d(g+1)` has `d(g)` as its parent pointer (D-7(2)) and fails the same way;
    - a `rev_`/`rej_` of `d(g)` fails the same way (pointer `reversesId`/`targetId`).

    Each lands in `syncErrors` as «رُفض الإرسال» and in the refused export, and blocks logout until exported. That is existing behaviour, written down here, and it is why `blocked` checks **any** position of the approval. Test: emulator step 12b.
- The same line pattern serves Q-2's cap (`full`) and Q-3's lost space (`spent`), so all three "no more deducts here" cases have one owner, `noMoreDeductLine(approvalId, cause)`:

| Cause           | When                                                                                                                  | Line (recommendation, shown at merge)                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `full` (Q-2)    | positions 1..9 all used                                                                                               | S10 «هذا القياس وصل حد 9 خصومات.» + remedy             |
| `blocked` (M-A) | a position of this approval is in `syncErrors`                                                                        | S11 «رُفض إرسال خصم على هذا القياس.» + remedy          |
| `spent` (Q-3)   | the next `cumAmount` would pass the approval, while the live sum leaves room (space held by an older reversed deduct) | S12 «ما بقى مجال خصم على هذا القياس.» + remedy         |
| true over-cap   | the live sum itself would pass the approval                                                                           | the existing `الخصم أكبر من العمل المعتمد` (unchanged) |

The remedy is one of two lines:

- S13 «سجّل الخصم على قياس معتمد ثاني لنفس الاتفاق.», when another card-2 block of this agreement counts and is not itself `full`/`blocked`/`spent`;
- S14 «ما أكو قياس معتمد ثاني: اعكس الخصومات ثم الاعتماد، وسجّل قياس جديد.», otherwise (always for lump/milestone, which have one approval).

- **Known limit: I extends the fixed-id limit TO deducts.** Before I, a deduct would have had a unique uuid id, so this could not happen to deducts. It exists today only for `rej_`/`rev_`/`sup_`/`appr_` fixed ids.
  - What happens: phone A's `d(g)` is refused, and phone B later writes `d(g)` (B never saw A's row). A's pull overwrites its local copy with B's doc (`mergeById`, `public/sync.js:348-356`), while A's `syncErrors[d(g)]` stays. B's deduct is then hidden on A, so **A shows a wrong balance**, and A's refused export shows B's doc under A's error. This lasts until A exports the refused rows and logs out.
  - The server cap is still right. A stays `blocked` on that measurement and is told to use another one.
  - Fixing it is a sync-wide change, not the cap. It goes on the backlog (§7.7, item B-1) and is shown to Ameer at merge (S16).

**(f) Emulator rules tests** (`tests/emulator/account-rules.test.js`; `deductOf` builds the position id and `cumAmount`):

| #   | Case                                                                                                                                                             | Expect                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| R0  | `dedId` form (`string(g)`) evaluates (confirmed by the Architect, kept as regression)                                                                            | allow d1, d2                        |
| R1  | d1 at exactly the approval (600,000, cum 600,000)                                                                                                                | allow                               |
| R2  | d1 400,000 then d2 200,000 (cum 600,000), at the limit                                                                                                           | allow                               |
| R3  | d1 400,000 then d2 200,001 (cum 600,001), over the limit                                                                                                         | **deny**                            |
| R4  | Forged counter: d2 with cum 200,000 after d1 400,000 (true 600,000); also cum below, above, non-int, missing                                                     | **deny** each                       |
| R5  | Gap: d2 with no d1; d10 id; d0 id; uuid id; id for another approval (`'d1' + otherAppr`)                                                                         | **deny** each                       |
| R6  | Concurrent: owner A and owner B both create `d1…` (different amounts)                                                                                            | first allow, second **deny**        |
| R7  | Release: d1 500,000, `rev_d1…`, then d2 500,000 with cum 500,000                                                                                                 | allow. Without the `rev_`: **deny** |
| R8  | Release by `rej_` of pending d1, then d2                                                                                                                         | allow                               |
| R9  | Old line 1405 (two 600,000 on one approval)                                                                                                                      | now **deny** (the gap closed)       |
| R10 | Approval reversed, then d1                                                                                                                                       | **deny** (existing `live`)          |
| R11 | Q-3 example: d1 = d2 = 300,000, `rev_d1` then `rev_d2`; d3 300,000 with cum 300,000 → **deny**; with cum 600,000 → allow; d3 300,001 with cum 600,001 → **deny** | as stated                           |
| R12 | Batch: d1+d2 in one `writeBatch`, and d(g)+`appr_d(g)` in one batch                                                                                              | **deny** (documents "never batch")  |

Emulator flows in `tests/emulator/account-correct.test.js`:

- **Step 10 (lost position, L-3).** Two phone stores both queue `d1…`. Phone B also queues `appr_d1…` and `rev_d1…` (as if built locally) and `d2…`. After `flushOutbox`:
  - B has A's `d1` adopted;
  - B's `d1`, `appr_d1`, `rev_d1` and `d2` are all in `slotLosers`;
  - B's outbox is empty, and the write count equals the docs attempted, with no retry loop.

  B's next deduct is at `d2…` with the right `cumAmount` and is accepted.

- **Step 11 (M-B).** Phone A: d1 accepted, then `rev_d1` queued with a transient failure injected, then d2 queued with `prevGone`. First flush: `rev_d1` kept and d2 **kept, not written**. Second flush: `rev_d1` written, then d2 written and accepted with cum = d2.amount.
- **Step 11b (M-C).** Phone A: d1 accepted and synced. Offline, the owner writes d2 (d1 live, so cum = d1.amount + d2.amount), **then** reverses d1, so `rev_d1` is queued after d2. One flush:
  - d2 is written first and **accepted**: the rule's `gone` is false, because `rev_d1` is not on the server yet;
  - then `rev_d1` is accepted;
  - nothing is kept or refused, and the outbox is empty.

  Then d3 is built with cum = d2.cum + d3.amount (d2 is live, and d1's space stays used, per Q-3) and is accepted. Mutation M39 (r4's `indexOf(h) > index`) makes this step RED.

- **Step 12 (M-A).** Phone A: d1 with a forged cum, refused. `deductPosition` on that approval returns `blocked`. Card 2 shows S11 + S13 when a second counting approval exists, and S11 + S14 when not. No `d2` is queued.
- **Step 12b (M-A, queued behind).** Phone A, offline: d1 with a forged cum, then `appr_d1`, then d2. One flush:
  - d1 is refused;
  - `appr_d1` and d2 are both refused through `failedSet`, without being written (the write count is 1);
  - all three are in `syncErrors` and in `refusalDocs()`, and `rejectedLogoutBlock()` is true until they are exported.

**(g) Scope guard (L-7).** There is no rules CI job for this. The **code PR's own diff check** applies: the PR body shows `git diff <base> -- firestore.rules` and states that only `deductCreate` and the four helpers inside `match /accountTxns/{id}` changed. The Architect checks it in review. No other leaf, no `revCreate`/`rejCreate`, and no other match block changes.

**(h) Deploy and rollback.**

- **Rules deploy needs its own go from Ameer via EA at deploy time**, separate from the hosting go (answers L29; L-5).
- Before deploying, the deployer **downloads and saves the live ruleset** (L-4): the Firebase console Rules tab, or the Firebase Rules API `releases`/`rulesets` GET, into a dated file. They record its ruleset name and compare it with the expected `cf3654b6`. That id comes from EA and is not verified here. The saved file, not `cf3654b6`, is the rollback source.
- Rules deploy separately from hosting (`firebase deploy --only firestore:rules`; whole-ruleset replace, `docs/plans/contractor-pr-d-sketch.md:729`).
- Deploy order: rules first, then hosting.
- Rollback order: hosting first, then rules (from the saved file).
  - With old rules and new phones, every position-id deduct is denied (`uuidOk`, `hasOnly`), goes to `syncErrors` as «رُفض الإرسال», and enters the refused export: safe and visible, not silent.
  - With new rules and old phones there is no effect, because old phones have no deduct button.
- While `CONTRACTOR_COST_START` is null, no deduct is written at all, so either order is safe today.
- `git revert` of I reverts the rules file and D-7 together (L-2). The rules redeploy is a separate step, with its own go.

### 2.13 A6/C3 (for J; not built in I): does `createdAtServer` on `rev_` already work?

**Yes, with no rules change.**

- `revCreate` calls `headerOk(d(), user)` (`firestore.rules:1055`), which requires `data.createdAtServer == request.time` (`firestore.rules:480`). So every accepted `rev_` carries the server's own time.
- `REV_REMOTE` includes `createdAtServer` (`public/sync.js:74`).
- `withServerTime` sets the sentinel on send (`public/sync.js:328-331`).
- `fromRemote` turns the pulled timestamp into milliseconds (`public/sync.js:335-341`), and the pull path runs every row through it (`readSpecs`, 473-478; accountTxns, 768-774).
- The same holds for `rej_` (`rejCreate` → `headerOk`, 1031).

**Limits J must handle (design, not rules):**

- A queued `rev_` has `createdAtServer: null` on the phone until it is pulled back. J must not issue a statement while a correction in its period is unsent. The existing «لم يُرسل» status (`public/accounts-view.js:437`) is the signal.
- The period must come from the millisecond timestamp in Asia/Baghdad.
- The fold's `inScope` dates rows by `txnDate` only (`public/accounts.js:792-808`), so J needs a fold change to put a correction in the period it was made, as a negative line.

So the accountant's rule (answers line 19: "issued statement never changes; correction shows in the period it was made as a negative line") needs **no rules change**. It is a J code item, so it is **not** "back to Ameer". It stays deferred X2 for J.

---

## 3. Tests

### 3.1 Unit: `tests/accounts-correct.test.js` (NEW)

Fixture: C's 600,000 approval, plus 50,000 / 100,000 / 30,000 where needed (sketch:391). Each test asserts documents and the outbox, not the closing number. The vm runs with `Accounts.CONTRACTOR_COST_START = '2026-10-01'` unless the test says null.

| #     | Test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Sketch             |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| T-I1  | `deductDoc` 50,000 against `appr_m1` 600,000 returns one body: id `d1appr_m1`, `cumAmount` 50000, `targetId` `appr_m1`, `amount` 50000. `approveDeductDoc` returns id `appr_d1appr_m1` with no `amount` key and no `txnDate`.                                                                                                                                                                                                                                                                                                                  | 382                |
| T-I2  | Deduct 600,001 is `cap`. With a live 550,000 deduct (pending or approved), a second 60,000 is `cumulative`. `approveDeductDoc` of a deduct that would cross the approved sum is `cumulative`.                                                                                                                                                                                                                                                                                                                                                  | 383                |
| T-I3  | An approval id in `syncErrors` is not offered to `deduct`. A body in `syncErrors` is not offered to `reject`. Each builder returns `targetId`.                                                                                                                                                                                                                                                                                                                                                                                                 | 384                |
| T-I4  | `rejectDoc` id is `rej_`+bodyId; its keys ⊆ `REJ_REMOTE`. A `payLabor` id is `method`. A body with a local `appr_` is `approved`.                                                                                                                                                                                                                                                                                                                                                                                                              | 385                |
| T-I5  | `supersedeDoc` of a uuid measurement copies `purpose, ledger, partyId, projectId, agreementId, currency, fxRate`, and carries the new `qty`. `sup_`×4 old → `sup_`×5 new is `method`. A slot id is `method`. A `payLabor` id is `method`. An approved body is `method`. After a live agreement `rev_`, the result is `cancelled`.                                                                                                                                                                                                              | 386                |
| T-I6  | `reversalDoc` of a target in `syncErrors` is `targetId`. `reversalDoc` of a `payLabor` copies `amount`. Of an `approveDeduct`, it omits `amount`. A `rev_` of a `rev_` is `kind`. A `rev_` of a `rej_` is `kind`. An empty or whitespace reason is `reason`. 501 characters is `reason`. No `txnDate` key.                                                                                                                                                                                                                                     | 387                |
| T-I7  | Two taps each for `deduct`, `approve-deduct`, `reject`, `supersede`, `reverse`, and the approval `عكس` (A12, 2-6 docs) append each document and outbox id once. The `deduct` id is fixed when the card opens, so the second tap reuses `d<g>…`. The button is disabled until save returns.                                                                                                                                                                                                                                                     | 388, 731           |
| T-I8  | The «حسابات» HTML for that person has no `act-deduct`, `act-approve-deduct`, `act-reject`, `act-supersede`, or `act-reverse` button.                                                                                                                                                                                                                                                                                                                                                                                                           | 389, 113           |
| T-I9  | Each builder's keys, minus `docType` and `effect`, ⊆ the remote list in §2.4, checked by comparing with `Sync.toRemote(doc)` keys. No source-text read (sketch:595).                                                                                                                                                                                                                                                                                                                                                                           | 272 pattern        |
| T-I10 | D-1 + M2: after a live `rej_m2`, G's detail for `ag-unit` paints no `act-approve-labor` for `m2`. Separately with `sup_m2`, the fixture puts the `sup_m2` row **before** `m2` in `K.accountTxns`, so the test is RED on main (L1). G offers `sup_m2` and not `m2`. Separately after `appr_m2` + live `rev_appr_m2`, G offers no `act-approve-labor` for `m2` (M2).                                                                                                                                                                             | D-1, M2, L1        |
| T-I11 | Slot: `rej_` of slot gen 1 accepted → G paints `المحاولة 2 من 9`. `rev_appr_` of gen 1 → the same. `نسخة جديدة` is absent on a lump body. Gen 9 rejected → no `act-labor-qty`.                                                                                                                                                                                                                                                                                                                                                                 | 376                |
| T-I12 | A refused fixed id: `rev_pay1` in `syncErrors` → `act-reverse-pay1` is disabled, the tap appends nothing, and the outbox is unchanged. The same for `rej_`, `sup_`, and `appr_` of a deduct.                                                                                                                                                                                                                                                                                                                                                   | 66                 |
| T-I13 | `CONTRACTOR_COST_START = null` → `views.contractor('ag-unit')` contains none of I's buttons, and each save path appends nothing.                                                                                                                                                                                                                                                                                                                                                                                                               | 82                 |
| T-I14 | No accounting change: with a date set, `Accounts.projectCost('p-school', L, txns, errs, start)` is equal before and after a counting deduct. `balances().deductions` rises by 50,000 and `net` falls by 50,000. After `rev_` of the `approveLabor`, `projectCost` falls by 600,000. That is K's existing rule, not I's.                                                                                                                                                                                                                        | 60, 710            |
| T-I15 | Dependent guard (C2, A14(b)): `pay1` with a live `refundLabor` → no `act-reverse-pay1`, and the S5 line shows. After `rev_` of the refund, it is offered.                                                                                                                                                                                                                                                                                                                                                                                      | §2.6               |
| T-I16 | Separators: typing `١٥٠٠٠٠` in `cc-deduct` shows `150,000` and saves `150000`. `2,5` appends nothing. (The pin in `tests/accounts-payment.test.js:1645-1660` gains `cc-deduct`.)                                                                                                                                                                                                                                                                                                                                                               | D-3                |
| T-I17 | A non-active project → every I button is off, and nothing is queued.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | G 268 pattern      |
| T-I18 | H1(1)+(2), A11: with a counting deduct on `appr_m1`, card 3 has no `act-reverse-appr_m1` and shows the S5 line «اعكس الاسترداد أو الإرجاع أو الخصم المرتبط أولاً» in its place. Card 2 offers `act-reverse-<deductId>` and no reverse on `appr_<deductId>`. After `rev_<deductId>`: **`balances().pendingIds` deep-equals `[]`** and the «حسابات» HTML has no `بانتظار الاعتماد` (N1/D-4), and `act-reverse-appr_m1` is offered. The same with a pending deduct cleared by `rej_`. `approveDeductDoc` of a reversed deduct is `targetId` (L3). | H1, A11, D-4       |
| T-I19 | A12 (§2.11): one `عكس` on `appr_m2` appends exactly `rev_appr_m2` and `rev_m2` with the same reason. Afterwards **`pendingIds` is `[]`**, `approvedLabor` and `projectCost` drop, the «حسابات» HTML and G's detail have no `بانتظار الاعتماد`, and G paints no `act-approve-labor` for `m2`. A `laborQty` link is never offered `عكس` except by recovery (§2.6).                                                                                                                                                                               | A12, D-4           |
| T-I20 | C1 (Ameer 19:13 two taps): a reversal that would turn `net` below 0 first shows «بعد العكس يصير مستحق عليه 150,000 د.ع» for net −150,000 (exact, and 150,001 shows `150,001`). The first tap appends nothing; the second appends the docs. A reversal that keeps `net >= 0` saves on one tap. The reason is mandatory for both.                                                                                                                                                                                                                | C1, A14(a)         |
| T-I21 | C8: `deductDoc` with an empty or whitespace reason is `reason`, and nothing is appended. A deduct with a reason stores it as `description`, and `description ⊆ POINTER_CASH_REMOTE`.                                                                                                                                                                                                                                                                                                                                                           | C8                 |
| T-I22 | `rejectDoc` of a dead target (live `rev_` or `rej_`) is `targetId` (L3).                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | L3                 |
| T-I23 | C11: two live deducts of 400,000 on a 600,000 approval, the second injected as if synced from another phone, since the server now refuses it (R3). `approveDeductDoc` of the second is `cumulative`. Card 2 and «حسابات» both show `الخصم أكبر من العمل المعتمد`. After `rev_` of one deduct the word is gone.                                                                                                                                                                                                                                 | C11                |
| T-I24 | N2: `sup_` chain end (§2.11): 4 docs, `pendingIds` `[]`, no live link. A control with only the head reversed shows `sup_m2` pending.                                                                                                                                                                                                                                                                                                                                                                                                           | N2, A12            |
| T-I25 | N3 orphan block: deduct D on `appr_m1` (synced), then `rev_appr_m1` injected (other phone). Card 2 shows the orphan block. Pending D → `act-reject-D`; approved D → `act-reverse-D`; after either, `pendingIds` is `[]`. Card 2 L-c: D with `appr_D` + `rev_appr_D` is not offered `اعتماد الخصم` or `رفض السطر`.                                                                                                                                                                                                                              | N3, L-c            |
| T-I26 | D-4: after each exit (`rev_<deductId>`, `rev_<slot gen 1>` via A12, `rev_sup_…`), `pendingIds` is `[]`. On a scratch copy without D-4: RED.                                                                                                                                                                                                                                                                                                                                                                                                    | N1                 |
| T-I27 | A14(b) and `returnAdvance`: `adv1` with a live `returnAdvance` → no `act-reverse-adv1`, and the S5 line shows. After `rev_` of the return, `عكس` is offered.                                                                                                                                                                                                                                                                                                                                                                                   | A14(b), L-a        |
| T-I28 | Slot gen 1 ended by A12 → G paints `المحاولة 2 من 9`, and there is no pending note for gen 1. A new measurement is offered normally.                                                                                                                                                                                                                                                                                                                                                                                                           | A12                |
| T-I29 | `deductPosition`: g=1 gives cum=amount. d1 400,000 live → d2 cum 400,000+x. `rev_d1` → d2 cum x. `rej_d1` → the same. d1 dead after d2 exists → d3 still counts d1 (Q-3). 9 used → `full`. Live sum over the approval → `cumulative`. Cum over while the live sum fits → `spent`. A position in `syncErrors` → `blocked`. A position adopted from the server (not in `syncErrors`) is used normally. Nothing is queued on any error.                                                                                                           | A13, Q-2, Q-3, M-A |
| T-I31 | Q-3 condition (1): d1 = d2 = 300,000 on a 600,000 approval, both approved, then `rev_d1`, then `rev_d2`. `balances().deductions` is 0. `net` equals the net of the same ledger with no deducts at all. The statement lines have no deduct amount. Card 2 shows both as `معكوس`, with no amount in any sum. «حسابات» shows `معكوس` and nothing in `pendingIds`. `deductPosition(…, 300,001)` is `spent`, and card 2 shows S12 + S13/S14. `deductPosition(…, 300,000)` gives d3 with cum 600,000.                                                | Q-3 (1)            |
| T-I32 | Remedy order (Q-3 (2), Q-2, M-A): agreement with approvals A1 and A2. With A1 `full` → S10 + S13. A1 `blocked` → S11 + S13. A2 also `full` → S10 + S14 on both. A lump agreement (one approval) → S14. The S14 text names deducts before approval (C9 order).                                                                                                                                                                                                                                                                                  | Q-2, Q-3, M-A      |
| T-I30 | A5: the deduct approve button text is exactly `اعتماد الخصم`. G's card title on the same screen stays `اعتماد قياس العمل`.                                                                                                                                                                                                                                                                                                                                                                                                                     | A5                 |

### 3.2 Browser check: `tests/browser-check.js`

- Separator guard: `AMOUNT_IDS` and `NON_AMOUNT_IDS` as in §2.3, including `'cc-ded-reason':'reason'` (N5). `idsEqual` stays true (`guardSameIds`, 162-167). A seeded pending deduct makes cards 1-3 render on `#contractor/ag-unit` in the cost-open phase, so `owner cost-open #contractor/ag-` (already required, 184) scans them. No new required label.
- One new owner check on `#contractor/ag-unit` cost-open: `#cc-deduct` typed `١٥٠٠٠٠` shows `150,000`; `حفظ` appends one deduct of 150000 (id `d1…`, `cumAmount` 150000); `2,5` appends nothing and keeps `2,5`; the RTL card has no horizontal overflow at 390px (the existing pattern at `tests/browser-check.js:829, 857`).
- `__resetLocal` (120-133) still clears `accountTxns`, so the seed row does not leak.
- The existing line-268 `+ عقد مقاول` check stays (constant null).

### 3.3 Emulator: `tests/emulator/account-correct.test.js` (NEW)

Through the app's builders and `Sync.toRemote`, the same way `tests/emulator/payment-half-refused.test.js` drives H:

1. Agreement → measurement → `appr_` → `deductDoc` 50,000 → `approveDeductDoc`: both accepted.
2. `rejectDoc` of a second unit measurement accepted. Then an `appr_` of that body is refused (proves D-1 matters).
3. Slot gen 1 `rej_` accepted → gen 2 body accepted (`firestore.rules:689-690`).
4. `supersedeDoc` of a uuid body accepted; depth-5 is not built (client `method`), and a hand-built depth-5 doc is refused by the rules.
5. `reversalDoc` of a `payLabor` accepted with `amount`; of the `approveDeduct` accepted without `amount`; a hand-built `rev_` of that `rev_` refused.
6. Project set `closed` by admin with rules disabled → a queued `rev_` refused → `syncErrors` has `رُفض الإرسال`, the button stays off, and nothing is re-sent.
7. (L4) Through `flushOutbox` on two phone stores: phone A writes `sup_m3` qty 10. Phone B queues `sup_m3` qty 12, then `appr_sup_m3`. B's `sup_` is adopted (server qty 10), B's `appr_` is refused (`approvalAmountOk`), and the refused id is in B's refused export.
8. (L4) Phone A writes `rej_m4`. Phone B's queued `appr_m4` is refused (`noRej`).
9. H1 + A12: `rev_<deductId>` accepted, then the A12 tap's `rev_appr_m1` and `rev_m1` accepted. A `sup_` chain end is accepted for every link. **This step proves only that the rules accept the chain (Architect L-d).** The fold side (`pendingIds` `[]`) is proven by the unit tests T-I18, T-I19, T-I24, and T-I26.
10. (A13, L-3) Lost position: see §2.12 (f) step 10. Both phones queue `d1…`; B's `d1`, `appr_d1`, `rev_d1` and `d2` end up in `slotLosers`, the outbox is quiet, and B's next deduct is accepted.
11. (M-B) A transient `rev_d1` queued **before** `d2` holds `d2` back; on the next flush both are accepted (§2.12 f).
    11b. (M-C) `rev_d1` queued **after** `d2`: `d2` is sent first and accepted, then `rev_d1` (§2.12 f).
    12b. (M-A) Docs queued behind a refused `d1` (`appr_d1`, `d2`) fail into the refused export (§2.12 f).
12. (M-A) A refused `d1` gives `blocked`, the line S11 + S13/S14, and no `d2` queued (§2.12 f).

`tests/emulator/account-rules.test.js` changes for A13 only: `deductOf` builds position ids and `cumAmount`, line 1405 flips to deny, and R0-R12 are added (§2.12 f).

### 3.4 Mutations that must go RED (run on a scratch copy; result in the PR body, like #100's "7/7 killed")

| M    | Mutation                                                                                         | Goes RED in                                                           |
| ---- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| M1   | `rejectDoc` accepts a cash purpose                                                               | T-I4                                                                  |
| M2   | supersede depth check `<= 4` → `<= 5`                                                            | T-I5, emulator 4                                                      |
| M3   | supersede slot check removed                                                                     | T-I5, T-I11                                                           |
| M4   | `reversalDoc` always copies `amount` (also: never copies)                                        | T-I6, emulator 5                                                      |
| M5   | `reversalDoc` accepts a `rev_` original                                                          | T-I6                                                                  |
| M6   | `deductDoc` calls `post` without `ledger` (cumulative lost)                                      | T-I2                                                                  |
| M7   | `approveDeductDoc` adds `amount`                                                                 | T-I1, T-I9                                                            |
| M8   | pickers stop dropping `syncErrors` ids                                                           | T-I3                                                                  |
| M9   | refused-fixed-id guard removed                                                                   | T-I12                                                                 |
| M10  | D-1 `rowLive` condition removed                                                                  | T-I10 (rej case)                                                      |
| M10b | M2 `appr_`-exists condition removed                                                              | T-I10 (rev_appr_ case)                                                |
| M11  | `costOpen` gate removed from `blocks`                                                            | T-I13                                                                 |
| M12  | `'cc-deduct'` dropped from `AMOUNT_FIELD_IDS`                                                    | T-I16, browser guard `idsEqual` + `unlisted-input`                    |
| M13  | `txnDate` added to `rev_`                                                                        | T-I6, T-I9                                                            |
| M14  | dependent guard removed                                                                          | T-I15                                                                 |
| M15  | I's actions registered with `tab: 'movements'`                                                   | T-I8                                                                  |
| M16  | `approveDeductDoc` accepts a reversed deduct                                                     | T-I18                                                                 |
| M17  | `rejectDoc` liveness check removed                                                               | T-I22                                                                 |
| M18  | `reversalDoc` accepts a target in `syncErrors`                                                   | T-I6                                                                  |
| M19  | H1(1): `عكس` offered on `approveDeduct`                                                          | T-I18                                                                 |
| M20  | H1(2): approval-with-live-deduct guard removed                                                   | T-I18                                                                 |
| M21  | A12: `endMeasurementDocs` skips the lower `sup_` links (or the body `rev_`)                      | T-I19, T-I24                                                          |
| M22  | C1 confirm step removed                                                                          | T-I20                                                                 |
| M23  | C8 mandatory reason removed                                                                      | T-I21                                                                 |
| M24  | C11 card-2 over-cap warning removed, or `approveDeductDoc` given a cached ledger                 | T-I23                                                                 |
| M25  | D-4 `!markerKind(doc)` removed                                                                   | T-I18, T-I19, T-I26                                                   |
| M26  | orphan block removed                                                                             | T-I25                                                                 |
| M27  | `returnAdvance` dropped from the dependent guard                                                 | T-I27                                                                 |
| M28  | rules: `cumOk` line removed (or `cumAmount <= approval` removed)                                 | R3, R4, R9                                                            |
| M29  | rules: `gone` release removed                                                                    | R7, R8                                                                |
| M30  | sync: `DEDUCT_REMOTE` reverted to `POINTER_CASH_REMOTE`                                          | sync-status test, emulator 10                                         |
| M31  | sync: prev-position parent pointer removed                                                       | emulator 10 (`d2` not parked), sync-status test (transient hold-back) |
| M32  | sync: lost position not parked (back to `refused`)                                               | sync-status test, emulator 10                                         |
| M33  | `اعتماد الخصم` label changed to `اعتماد`                                                         | T-I30                                                                 |
| M34  | `deductPosition` ignores `syncErrors` (no `blocked`)                                             | T-I29, emulator 12                                                    |
| M35  | `noMoreDeductLine` always shows S14 (remedy order lost)                                          | T-I32                                                                 |
| M36  | sync: `deductHoldIds` check removed                                                              | emulator 11, sync-status test                                         |
| M37  | fold counts a reversed deduct in `deductions` (scratch only, a guard test)                       | T-I31                                                                 |
| M38  | `parkSubtree` skips a deduct position's descendants (D-7(2) pointer removed)                     | emulator 10                                                           |
| M39  | M-C: hold condition reverted to r4's (`ids.indexOf(h) > index`), or holding on any queued marker | emulator 11b                                                          |
| M40  | D-7(4) widened to every `body` (or the slot branch edited)                                       | sync-status "other bodies still refused" test                         |

---

## 4. Hard constraints

- **`firestore.rules`: the deduct cumulative cap only** (A13: Ameer 19:08 «٩-فحص بالسيرفر», L11; scope «…لفحص الخصم بالسيرفر بس», L28). `deductCreate` plus four helpers inside `match /accountTxns/{id}` (§2.12 g). Every other I write matches an existing leaf (`firestore.rules:1112-1127`). sketch:773 ("`firestore.rules` is not in the diff") is superseded for I. **Deploy needs its own Ameer go at deploy time** (L29).
- **`CONTRACTOR_COST_START` stays `null`** (`public/accounts.js:11`). `public/accounts.js` gets one condition only, D-4 at 848 (Ameer 19:13, answers line 22). Nothing else in that file (sketch:591, 717).
- **No accounting behaviour change** beyond the sketch and Ameer's answers. I writes only documents whose effects B/C/K already define (`public/accounts.js:69-79, 815-886, 1043-1053`). No change to `PURPOSES`, `post`, `rowCounts`, `balances` totals, `statementLines`, or `projectCost`. D-4 changes only which rows are listed as pending.
- **CSV unchanged** (A9, Ameer 19:08 «نضيف المقاولين للملف بعدين», answers line 7: contractor rows come later, as a separate change). I edits no CSV or export code (`public/ledger.js`, `public/render.js` `saveCsvFiles`/refused export). Refused I ids and parked deduct positions flow into the existing refused export (`public/render.js:134-151`). Amounts there stay plain (Ameer 14:23 «CSV يبقى بدون فوارز»).
- **M3 (stated plainly; A9 decided by Ameer 19:08, line 7; S2 explains it at merge).** The `#csv` export is `L.toCSV(L.countedEntries(K.entries, …))` (`public/render.js:1557-1560`). `accountTxns` are never exported. So no contractor row (G, H, or I, including any correction) ever appears in the CSV. Once `CONTRACTOR_COST_START` is set, home «إجمالي المصروف» includes `projectCost` (`public/render.js:663`) while the CSV does not, and the two totals will differ. This is not I's to fix.
- Not edited: `public/render.js` (sketch:334, 593), `public/ledger.js`, `public/foremen.js`, `public/sync-status.js`, `public/app.js`, `public/firebase-client.js`, `public/accounts-view.js`, and `public/session.js` except `SHELL_FILES`. The named exceptions: D-1 (one condition pair, G), D-3 (one array entry, H), D-4 (one condition, `accounts.js`), D-6 (rules, cap only), and D-7 (`sync.js`, four edits, cap only, approved 19:29, L28).
- No decimal qty or days (`qtyOk`, integers only). New Arabic beyond sketch:378 is only what Ameer's answers bring: `اعتماد الخصم` (A5), S4 and S5 (A14). Not touched: #107, `.cursor/rules/pstack-models.mdc`, or I/J/L beyond this plan's I.
- **Service worker bump**: `VERSION` → next free at merge (sketch:142), with pins in `tests/shell-cache.test.js` and `tests/webkit-upgrade.test.js`. `scripts/sw-version-guard.sh` enforces the bump.
- **One cloud agent later**, from the exact base SHA, after this plan is approved and EA's GO quotes Ameer. Its prompt includes the pstack models block (`/workspace/pstack-block-for-prompts.md`). It opens a draft PR. No merge or deploy by the agent. There is no `Co-authored-by` in the squash message, and no `--no-verify`.

## 5. Revert and blast radius

Blast radius:

- G's «مقاول» detail: D-1 + M2 change which measurement G offers; A12 makes a slot open n+1 after an approval `عكس`.
- H's cash list: I adds `عكس` next to H's rows; H's `تدقيق` generation reopens after `rev_` of a `revw_`.
- «حسابات»: status words (`مرفوض`, `معكوس`); **`pendingIds`** (D-4 drops every `rev_` marker, and A12 leaves no live link, N1); the over-limit word.
- K's `projectCost`: it drops when a measurement is ended, under K's existing rule.
- **Firestore rules**: the deduct create path (A13). Every deduct id changes from uuid to position. The emulator rules suite changes with it.
- **`sync.js`** (D-7): deduct remote keys, the deduct parent hold-back, and `adoptFound` for lost positions. These run in every flush, but only deduct docs take the new branches. The `slotLosers` store also gains deduct positions (`public/render.js:149-151` lists them).

`git revert` of I removes `accounts-correct.js`, its tag, its tests, its verify ids, D-4, D-7, and the rules hunk. The rules need their own redeploy (§2.12 h). Documents already written stay. The fold still reads `rej_`/`sup_`/`rev_`/`deduct`/`appr_`, so totals are unchanged by the revert. Reverting D-1 is safe only together with I. The revert takes the next free SW version (sketch:699).

## 6. pstack inventory impact (`docs/PSTACK_INVENTORY.md`, on the code PR only)

- Add a section `## Contractor PR I` after `## Contractor PR H` (lines 239-247), with three rows, evidence only (sketch:735):
  - `feature`: named screen corrections on «مقاول» in `public/accounts-correct.js`; shapes `deductDoc`, `approveDeductDoc`, `rejectDoc`, `supersedeDoc`, `reversalDoc`; behaviour `tests/accounts-correct.test.js`. Status stays «ناقصة» (row at line 111).
  - `maintain-verification-skill`: feature files `supersede`, `reject`, `deduct`, `approve-deduct`, `reverse`; `scripts/verify-aj.js` accepts them; unknown id exits 3. Status stays «ناقصة» (row at line 74).
  - `opening-a-pr`: draft; plan reference; constant null; rules change limited to the deduct cap (A13) with its deploy order; D-7 status. Status stays «مطبّقة» (row at line 115).
- The header `81 rows: 39 «مطبّقة», 35 «ناقصة», 7 «لا تنطبق», 0 for Ameer to decide.` (line 3) **does not change**. No status word flips. The `architect` row (line 58) and the `reframe` row (line 80) are not edited.
- If this plan becomes a docs PR (precedent: #97 for G, #99 for H), that docs PR does not edit the inventory (sketch:735).

---

## 7. Decisions, deferred items, and items to show at merge

### 7.1 Accountant answers and how r2/r3 apply them

| #           | Accountant advice (18:45 / 18:57 Baghdad)                                                                                                                                                                                                                                                                                                                                       | How r2 applies it                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| C1          | Don't block reversing an approval after payment. «مستحق عليه» is correct. Mandatory «سبب التصحيح». Warn before confirm that net goes negative. Quantity-only fixes: prefer «نسخة جديدة».                                                                                                                                                                                        | Not blocked. Reason mandatory (card 3). Two-tap warning (§2.6, T-I20); wording S4. `نسخة جديدة` preferred before approval.                    |
| C2          | Order correct (reverse refund/return first). Show a line explaining why «عكس» is hidden.                                                                                                                                                                                                                                                                                        | Guard kept and extended (H1(2), `returnAdvance` included). Explanation line S5 (A14(b)).                                                      |
| C3          | Not acceptable for periods with an issued statement; must show in the period made. OK for I only while no approved statement exists (J). Must be decided before J; Ameer (rules change).                                                                                                                                                                                        | No change in I. r3: decided at 19:09 (period it was made, as a negative line). `createdAtServer` needs no rules change (§2.13). **X2** for J. |
| C4          | Depends on deduct type: personal debt → reduces due only (plan OK). Company materials, fine, or defective work → possible double counting. Needs deduct type or Ameer decision (linked to A2).                                                                                                                                                                                  | I builds the safe case (debts only). Others deferred **X4**.                                                                                  |
| C5          | Reverse the deduct itself (`rev_<deductId>`).                                                                                                                                                                                                                                                                                                                                   | Applied (card 2; H1(1)).                                                                                                                      |
| C6          | Only «رفض السطر» + new خصم.                                                                                                                                                                                                                                                                                                                                                     | Applied.                                                                                                                                      |
| C7          | Per approved measurement with cumulative check OK for I; maybe per agreement later.                                                                                                                                                                                                                                                                                             | Applied. A later per-agreement change would go back to EA.                                                                                    |
| C8          | Reason needed, preferably mandatory; reuse existing «سبب التصحيح».                                                                                                                                                                                                                                                                                                              | Applied: stored in `description` (rules 973, 502-504), mandatory client-side.                                                                 |
| C9 (18:57)  | Correct. Order: reverse deduct, then measurement approval, then measurement body; new measurement if work correct. Block reversing approval while live deduct; show line why button hidden. C1 unchanged (payments don't block; net shows «مستحق عليه»).                                                                                                                        | Applied. r3: approval `عكس` ends the measurement in one tap (A12, §2.11).                                                                     |
| C10 (18:57) | Today's date (recording date); link via targetId.                                                                                                                                                                                                                                                                                                                               | Applied (§2.6 card 2).                                                                                                                        |
| C11 (18:57) | Server enforcement is right; interim for I accepted if: (1) approving a deduct re-runs the cumulative check at approval time; (2) if live deducts on a measurement exceed it, clear warning on screen and in summary, owner reverses excess; (3) server enforcement added before multiple people record deducts and before J statement approvals — rules change, goes to Ameer. | (1)(2) applied (T-I23); (3) **built in I** (A13, §2.12).                                                                                      |

- **C9 (asked from Architect H1(3), now answered).** The question sent to the accountant was: بعد عكس الاعتماد، القياس يُعكس أيضاً؟ That is: after an approved measurement's approval is reversed (`rev_appr_<m>`), should the measurement body itself also be reversed (`rev_<m>`), so it stops showing «بانتظار الاعتماد» for ever? The accountant answered at 18:57 (row C9 above): yes, in the order deduct, then approval, then body.

### 7.2 Decisions log

Sources:

- **Ameer L<n>**: line n of `AMEER-answers-r2.7f3aa0bb.frozen.md`. Lines 3-13 are Ameer's 19:08 answers (t2135u via EA, raw text matched by the Architect). On each of those lines, only the Arabic before `->` is Ameer's. The English after it is EA's note (L-1). L21 (A5, 19:10), L22 (D-4 + two-tap, 19:13) and L28 (N-1, 19:29) are **Ameer widget answers relayed by EA**; we have no raw line of our own.
- **Acc19:09 L<n>**: the accountant's decision on an item **Ameer delegated in his own words** (L10, L12, L13).
- **Acc 18:45 / 18:57**: `ACCOUNTANT-answers-r1.md` (advice, adopted).
- **Arch**: the Architect reviews.
- The 18:56 delegation («لا ااعرف ماهوة صحيح حسابيا اعملوه واشروحلي ع البرنامج بعد الاكمال», as raw in the brief) is cited **only** for accounting choices (N4).

| Question                    | Decision for I                                                                                                                                                                                                                     | Source                                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| A1 retention                | **No retention.** Not in I and not planned. (r2's X1 is closed.)                                                                                                                                                                   | Ameer L3 «لا اخذ ضمان»                                                                                                      |
| A2 / A7 / C4 deduct type    | Option (a): `خصم` = personal debts only, reducing only the contractor's due, not project cost. Materials, fines, and defects come later (X4).                                                                                      | Ameer L4 «خيار أ»; Acc 18:45 C4                                                                                             |
| A3 start date               | Stays null; I ships dark (X5).                                                                                                                                                                                                     | sketch; Ameer has not set it                                                                                                |
| A5 deduct-approve label     | **`اعتماد الخصم`**. It differs from G's `اعتماد قياس العمل` (`public/accounts-work.js:776, 973`).                                                                                                                                  | Ameer L21 (widget, relayed by EA; it supersedes L5 after Acc L20)                                                           |
| A6 / C3 issued periods (J)  | An issued statement never changes. A correction shows in the period it was made, as a negative line. `createdAtServer` on `rev_` already works with no rules change (§2.13). So it is a J code item, X2.                           | Acc19:09 L19 under Ameer L13 «المحاسب يقرر»                                                                                 |
| A8 / D-1 + M2               | **Hide `اعتماد قياس العمل`** on rejected, superseded, and approval-reversed rows (`currentBody`, §2.10).                                                                                                                           | Ameer L6 «نشيله»                                                                                                            |
| A9 CSV                      | **CSV unchanged in I.** Contractor rows come later, as a separate change.                                                                                                                                                          | Ameer L7                                                                                                                    |
| A10 / C10 deduct date       | Entry date (today).                                                                                                                                                                                                                | Ameer L8 «مقبول»; Acc 18:57 C10                                                                                             |
| A11 / C9 block              | Block reversing an approved measurement while a live deduct exists, with the S5 line.                                                                                                                                              | Ameer L9 «مقبول»; Acc 18:57 C9                                                                                              |
| A12 / C9 end                | **Reversing an approval ENDS the measurement**: one tap, one reason (all links reversed, §2.11). If the work is correct, record a new measurement.                                                                                 | Acc19:09 L16 under Ameer L10 «دع المحاسب يختار الاصح»                                                                       |
| A13 / C11(3) server cap     | **Server-side cumulative deduct cap in I** (§2.12): `deductCreate` + four helpers, and D-7 `sync.js` for the cap only. The client check and warning stay.                                                                          | Ameer L11 raw «٩-فحص بالسيرفر»; L28 «إي، عدّلوا ملف المزامنة لفحص الخصم بالسيرفر بس» (widget, relayed by EA); Acc 18:57 C11 |
| A14(a) / S4                 | «بعد العكس يصير مستحق عليه [المبلغ] د.ع», exact net, no rounding.                                                                                                                                                                  | Acc19:09 L17 under Ameer L12 «لم افهما دع المحاسب يقرر»                                                                     |
| A14(b) / S5                 | «اعكس الاسترداد أو الإرجاع أو الخصم المرتبط أولاً». It covers `returnAdvance`.                                                                                                                                                     | Acc19:09 L18 under Ameer L12                                                                                                |
| D-4 (N1)                    | `!markerKind(doc)` at `public/accounts.js:848`. No totals change (Architect: 28 states identical).                                                                                                                                 | Ameer L22 «إي، صلحوا السطر…» (widget, relayed by EA)                                                                        |
| C1 two-tap confirm          | Two taps when net goes below 0, with S4.                                                                                                                                                                                           | Ameer L22 «…وخلوا التأكيد بضغطتين» (widget, relayed by EA); Acc 18:45 C1                                                    |
| C1 rest                     | Not blocked; reason mandatory; quantity-only fixes use `نسخة جديدة` before approval.                                                                                                                                               | Acc 18:45 C1 (accounting; delegation)                                                                                       |
| C2                          | Reverse the dependent first; the S5 line.                                                                                                                                                                                          | Acc 18:45 C2; Ameer L9                                                                                                      |
| C5                          | `rev_<deductId>`; no `عكس` on `approveDeduct`.                                                                                                                                                                                     | Acc 18:45 C5; Arch H1(1)                                                                                                    |
| C6                          | `رفض السطر` + new `خصم`; no `نسخة جديدة` on a deduct.                                                                                                                                                                              | Acc 18:45 C6                                                                                                                |
| C7                          | Per approved measurement, cumulative.                                                                                                                                                                                              | Acc 18:45 C7                                                                                                                |
| C8                          | Mandatory reason in `description`, labelled `سبب التصحيح`.                                                                                                                                                                         | Acc 18:45 C8; rules 973, 502-504                                                                                            |
| C11(1)(2)                   | Re-check at approval; over-cap warning on «مقاول» and «حسابات».                                                                                                                                                                    | Acc 18:57 C11                                                                                                               |
| Q-2 nine positions          | 9 deducts per approved measurement is enough. At the cap, a clear line replaces the button, and further deducts go on another approved measurement of the same agreement.                                                          | Acc 19:27 L25 (within the delegation)                                                                                       |
| Q-3 release only the latest | Accepted on two conditions: (1) a reversed deduct only uses cap space and never reduces net or shows in deductions (T-I31); (2) the remedy is first another approved measurement, and ending this one only if none exists (T-I32). | Acc 19:27 L26 (within the delegation)                                                                                       |
| N-1 / D-7 `sync.js`         | Approved, for the server deduct cap only.                                                                                                                                                                                          | Ameer L28 «إي، عدّلوا ملف المزامنة لفحص الخصم بالسيرفر بس» (widget, relayed by EA)                                          |
| Rules deploy                | Needs its own Ameer go at deploy time, separate from hosting.                                                                                                                                                                      | L29 (EA, at the Architect's request)                                                                                        |
| M-A refused position        | Stop deducts on that measurement with S11 + remedy. The refused id is not reused (unsound within the cap-only scope, §2.12 i).                                                                                                     | Arch M-A; Acc L26 remedy order                                                                                              |
| Hidden decisions (a)-(e)    | (a) = A10. (b) = A11. (c) = A12. (d) = A13. (e) = A12 order.                                                                                                                                                                       | Arch; Ameer L8-L11; Acc19:09 L16                                                                                            |

### 7.3 Deferred, back to EA (not built in I; nothing here is open for I)

- **X2. Issued-statement periods (A6/C3), for J.**
  - Decided: the correction goes in the period it was made, as a negative line (Acc19:09 L19).
  - `createdAtServer` works with no rules change (§2.13), so this is not back to Ameer.
  - J needs a fold/period change and must not issue a statement while a correction in its period is unsent.
- **X4. Deduct types: materials, fines, defects (A2/A7 option (a)).** Later. They need a type field (rules) or K applying deduct cost. Not open: Ameer chose (a).
- **X5. Setting `CONTRACTOR_COST_START`.** Stays null.
  - **Precondition:** the A13 server cap (r2's X3) must be live first, because more than one phone can record deducts, and two phones of one owner already qualify (Architect Check 4).
  - r3 brings that cap into I. So X5 may only follow the deploy of I's rules hunk (§2.12 h), never precede it.
- r2's X1 (retention) is **closed** (A1, no retention). r2's X3 (server cap) is **closed into I** (A13).

### 7.4 Pending Ameer

- **Nothing before merge.**
- **At deploy time only:** the `firestore.rules` deploy needs its own go from Ameer via EA, separate from the hosting go (L29; §2.12 h).
- The createdAtServer item needed no rules change (§2.13), so it was never asked.
- N-1 was answered at 19:29 (L28).

### 7.5 New questions

None that block. Q-2 and Q-3 were answered by the accountant at 19:27 (L25-26) and are applied.

The only open choice is the wording of S10-S14. Those are recommendations shown at merge (§7.6), and EA can swap any of them with one edit each.

### 7.6 Shown to Ameer at code merge (explanation only, nothing to approve)

- **S1.** «مقاول» no longer offers `اعتماد قياس العمل` on rejected, superseded, or approval-reversed measurements (A8, his «نشيله»).
- **S2.** The CSV has no contractor rows yet (A9, his «بعدين»). Once the start date is set, the home total includes contractor cost and the CSV does not.
- **S3.** The deduct approve button says `اعتماد الخصم` (A5, his 19:10 choice).
- **S4.** «بعد العكس يصير مستحق عليه [المبلغ] د.ع» plus the two-tap confirm (A14(a), his 19:13 «خلوا التأكيد بضغطتين»).
- **S5.** «اعكس الاسترداد أو الإرجاع أو الخصم المرتبط أولاً» (A14(b)).
- **S6.** The deduct cap is now checked on the server (A13). A second phone that writes the same deduct position gets the existing «القيد موجود على الخادم بمحتوى مختلف» (`public/sync-status.js:13`) in its refused list, and re-enters the deduct.
- **S7.** `خصم` is for contractor debts only (A2, «خيار أ»).
- **S8.** `عكس` on an approved measurement ends it: one tap, one reason (A12). If the work was right, record a new measurement.
- **S9.** Correction rows no longer show «بانتظار الاعتماد» (D-4, his 19:13 «صلحوا السطر»).
- **S10-S14 (recommended wording, new in r4).** When a measurement can take no more deducts, the button is replaced by one reason line and one remedy line:
  - S10 «هذا القياس وصل حد 9 خصومات.» (the cap of 9);
  - S11 «رُفض إرسال خصم على هذا القياس.» (a refused send);
  - S12 «ما بقى مجال خصم على هذا القياس.» (space held by an older reversed deduct);
  - then either S13 «سجّل الخصم على قياس معتمد ثاني لنفس الاتفاق.», or, when there is no other, S14 «ما أكو قياس معتمد ثاني: اعكس الخصومات ثم الاعتماد، وسجّل قياس جديد.».
- **S15.** A reversed deduct no longer reduces anything. Its amount only stays counted inside that measurement's limit (Q-3).
- **S16 (note, REVIEW-plan-I-r4-22ed11e8.md, sha256 8244944bc1003f1a43e818de5038304e4fbd4c87e511a7d59d7bd8890042de02).** «إذا انرفض خصم على تلفون وسجّل تلفون ثاني نفس الخانة، التلفون الأول يعرض رصيد غلط لحد ما يصدّر المرفوض ويطلع».

### 7.7 For the Architect (design, not accounting)

- D-1 to D-7 (§2.10).
- D-5: one tap, several `commitDoc`s.
- §2.12: rules option 5 against options 1-4; the read budget of 8; `string(g)` confirmed (R0); never batch positions; deploy order with the saved live ruleset.
- §2.12 (i): M-A by blocking rather than reusing the id.
- **Backlog B-1 (after I, not in I):** sync-wide handling for a fixed id that is refused locally but later written by another phone. Today that pull overwrites the local copy while the local `syncErrors` entry stays (`public/sync.js:348-356`; `public/accounts.js:668-670`). I **extends** this limit to deducts, which had unique uuid ids before (§2.12 i, S16).
- D-7(3) `deductHoldIds`, kept apart from `parentPointers` so that "a `rev_` is never a parent" stays true. It holds only on an earlier, unsynced marker (M-C).
- D-7(4) is limited to deduct position ids, leaves the slot branch unchanged, and is tested to refuse other bodies (conditions a-c, §2.12 e).
- The deduct reason is stored in `description` (naming only).
- `reversalDoc` still builds a `rev_` of an `approveDeduct`, but no button uses it. Note that `rev_appr_d<g>…` can exceed `idOk`'s 64 for a depth-4 `sup_` body. That is moot, since it is never built.
- The seed row in the browser guard uses a position id.

## 8. Changes

### 8.r5 r4 → r5: REVIEW-plan-I-r4-22ed11e8.md (sha256 8244944bc1003f1a43e818de5038304e4fbd4c87e511a7d59d7bd8890042de02)

| Note                                                          | Severity | How r5 handles it                                                                                                                                                                                                                                                            | Where               |
| ------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| M-C: M-B holds on a later marker and refuses a valid deduct 2 | MEDIUM   | Hold only when the `rev_`/`rej_` of g-1 is **earlier** in the queue and unsynced. Kept → keep; failed → fail; later, absent or synced → no hold. The cum for deduct 2 in that order is checked: `prev.cum + amount`, accepted by the rule (`gone` false). Emulator 11b, M39. | §2.12 e(3), f; §3.3 |
| D-7 edit 4 scope                                              | note     | Three binding conditions: (a) deduct position ids only, as a separate branch; (b) the slot branch unchanged; (c) a test that other bodies are still refused. M40.                                                                                                            | §2.12 e(4); §7.7    |
| L-6 (rest): helpers "beside charGen/prevRevwId"               | LOW      | §2.12 (c) now says inside `match /accountTxns/{id}` (`d()` at 656), not in service scope.                                                                                                                                                                                    | §2.12 c             |
| S6 wording                                                    | LOW      | A lost position shows «القيد موجود على الخادم بمحتوى مختلف» (`public/sync-status.js:13`, `public/render.js:151`), not «رُفض الإرسال».                                                                                                                                        | §2.12 e(4); S6      |
| M-A note: queued docs behind a refused deduct                 | LOW      | Written down (`appr_`, later positions and markers fail via `failedSet`, `public/sync.js:1015-1018`) and tested: emulator 12b.                                                                                                                                               | §2.12 i, f; §3.3    |
| §7.7 "does not widen"                                         | LOW      | Reworded: I **extends** the fixed-id limit to deducts. Backlog B-1, and the S16 note line for Ameer at merge.                                                                                                                                                                | §2.12 i; §7.6; §7.7 |

### 8.0 r3 → r4: Architect NOTES on r3 (`REVIEW-plan-I-r3-05bad4ab.md`) and the answers L24-L29

| Item                                      | Severity / source | How r4 handles it                                                                                                                                                                                                                            | Where                   |
| ----------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Verdict NOTES, D-4 CONFIRMED (28 states)  | Arch §1           | Noted in the decisions log; no change.                                                                                                                                                                                                       | §7.2                    |
| D-5 / A12 CONFIRMED                       | Arch §2           | No change.                                                                                                                                                                                                                                   | —                       |
| A13 rules tested, R0-R10 as predicted     | Arch §3           | R0 is kept as a regression test and the ternary fallback is dropped. R4/R5 gain "above" and `d0`. New R11 (the Q-3 300k example) and R12 (batches denied).                                                                                   | §2.12 c, f              |
| Never batch positions                     | Arch §3 INFO      | Stated, with R12 and a one-write-per-deduct sync test.                                                                                                                                                                                       | §2.12 c                 |
| M-A refused position poisons the chain    | MEDIUM            | Chosen: block deducts on that measurement with S11 + remedy (S13/S14). Reusing the id was judged unsound within scope (commitDoc by id, syncErrors by id, export by id). `deductPosition` returns `blocked`; T-I29, T-I32, emulator 12; M34. | §2.4, §2.6, §2.12 i     |
| M-B hold-back misses `rev_`/`rej_` of g-1 | MEDIUM            | D-7(3) `deductHoldIds`: hold on a queued or kept marker of g-1, and fail on a refused one. Emulator 11; M36.                                                                                                                                 | §2.12 e                 |
| L-1 L11 parenthetical is EA's             | LOW               | Only «٩-فحص بالسيرفر» is quoted as Ameer's. L21, L22 and L28 are marked "widget answer, relayed by EA".                                                                                                                                      | header, §2.12, §4, §7.2 |
| L-2 fallback must list what drops         | LOW               | Moot (D-7 approved, L28). r4 states that D-6, R0-R12, the `deductOf` rewrite, the 1405 flip and D-7 ship and revert together.                                                                                                                | §2.12 header, h         |
| L-3 lost-position descendants parked      | LOW               | Emulator step 10 asserts `appr_d1`, `rev_d1` and `d2` are in `slotLosers`, the outbox is quiet, and there is no retry loop. M38.                                                                                                             | §2.12 e, f              |
| L-4 `cf3654b6` unverified                 | LOW               | Download and save the live ruleset before deploy; the saved file is the rollback source.                                                                                                                                                     | §2.12 h                 |
| L-5 own deploy go                         | LOW               | Rules deploy needs its own Ameer go at deploy time (L29).                                                                                                                                                                                    | §2.12 h, §7.4           |
| L-6 helper count and placement            | LOW               | Four helpers (`dedGen`, `dedId`, `prevCumOk`, `cumOk`), all inside `match /accountTxns/{id}` (`d()` at 656).                                                                                                                                 | §2.3, §2.12 c, g, §4    |
| L-7 no "Rules CI"                         | LOW               | The code PR's own `git diff -- firestore.rules` in the PR body, checked by the Architect.                                                                                                                                                    | §2.12 g                 |
| Hot loop (#86) on held deducts            | Arch §4 note      | No new retry trigger. Emulator 10/11 assert the write count and a quiet outbox.                                                                                                                                                              | §2.12 e, f              |
| Q-2 (Acc 19:27, L25)                      | answer            | 9 is OK. At the cap, S10 + remedy replaces the button. T-I29, T-I32.                                                                                                                                                                         | §2.6, §2.12 i           |
| Q-3 (Acc 19:27, L26)                      | answer            | Condition (1) is proven by T-I31 (fold + UI). Condition (2) is the remedy order in `noMoreDeductLine` (T-I32).                                                                                                                               | §2.12 d, i              |
| N-1 FINAL (Ameer 19:29, L28)              | answer            | D-7 approved, cap only. The pending item is removed.                                                                                                                                                                                         | §2.3, §2.10, §7.2, §7.4 |
| Rules deploy go (L29)                     | answer            | The only pending item, at deploy time.                                                                                                                                                                                                       | §7.4                    |
| Pending-Ameer list                        | brief             | Emptied, except the deploy-time go.                                                                                                                                                                                                          | §7.4, §7.5              |

### 8.1 r2 → r3: Ameer's 19:08-19:13 answers

| Item                             | Where in r3                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| A1 no retention                  | §1.2; §7.2; X1 closed                                                                                        |
| A2/A7 option (a)                 | §7.2; X4 kept deferred (not open)                                                                            |
| A5 «اعتماد الخصم»                | §1.1 row 97; §2.6 card 2; §2.8; T-I30; M33; S3                                                               |
| A8 hide approve (D-1+M2)         | §2.10 (where in code + tests); T-I10; S1                                                                     |
| A9 CSV later                     | §1.2; §4; S2                                                                                                 |
| A10 date                         | §2.6 card 2                                                                                                  |
| A11 block                        | §2.6 card 3; T-I18                                                                                           |
| A12/C9 end in one tap            | §2.4 `endMeasurementDocs`; §2.6 card 3; §2.10 D-5; §2.11 evidence; T-I19, T-I24, T-I28; M21; S8              |
| A13 server cap                   | §2.12 (full design); §2.3 files; §2.10 D-6, D-7; R0-R10; emulator 10; T-I29; M28-M32; N-1 (closed in r4); S6 |
| A14(a)/(b)                       | §2.6; §2.8; T-I15, T-I20, T-I27; S4, S5                                                                      |
| A6/C3 createdAtServer            | §2.13; X2                                                                                                    |
| D-4 + C1 two taps (19:13)        | §2.10 D-4; §2.3; T-I18/19/24/26; M25; S4, S9                                                                 |
| Answers file b7bfa0b8, re-frozen | header (only line 22 appended to 4ccff51d)                                                                   |

### 8.2 Architect NOTES on r2 (`REVIEW-plan-I-r2-ebab8274.md`)

| Note                                                | Severity | How r3 handles it                                                                                                                                                                                                                                                                               | Where              |
| --------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| N1 `rev_` rows pending forever                      | HIGH     | D-4 `!markerKind(doc)` at `accounts.js:848`, **approved by Ameer** (L22). T-I18 and T-I19 assert `pendingIds` is `[]` and there is no `بانتظار الاعتماد`. Plus T-I26 and M25.                                                                                                                   | §2.10, §2.11, §3.1 |
| N2 `sup_` measurement with a reversed approval      | MEDIUM   | A12 reverses every chain link in one tap, so the root never comes back pending, and r2's "reject the revived root" path is not needed. "Kind `body` or `sup`" holds by construction, plus recovery. T-I24.                                                                                      | §2.4, §2.6, §2.11  |
| N3 orphan deduct has no place                       | MEDIUM   | An orphan block in card 2: `رفض السطر` if pending, `عكس` if it has an `appr_`. T-I25, M26.                                                                                                                                                                                                      | §2.6 card 2        |
| N4 delegation over-used                             | MEDIUM   | The raw spelling is quoted, and the delegation is cited for accounting only. D-1 (A8), CSV (A9), A5, S4/S5 (A14), C1 two-tap and D-4 (L22) now cite Ameer's own answers. The "no blocking question" claim is withdrawn. §7.4 lists only the conditional item (not needed) and the new item N-1. | header, §7.2, §7.4 |
| N5 `cc-ded-reason` missing from the separator guard | MEDIUM   | Added to `NON_AMOUNT_IDS`.                                                                                                                                                                                                                                                                      | §2.3, §3.2         |
| L-a S5 omits returns                                | LOW      | S5 is now A14(b), which names الإرجاع. T-I27 covers `returnAdvance`.                                                                                                                                                                                                                            | §2.6, §2.8         |
| L-b stale r1 text                                   | LOW      | §1.2 C6 is fixed. The §2.6 "accountant question C9" line is gone (card 3 rewritten). §4 "no new strings" is replaced.                                                                                                                                                                           | §1.2, §2.6, §4     |
| L-c card 2 pending definition                       | LOW      | Pending means "no `appr_` outside `syncErrors`". The reversed-`appr_` deduct gets only `عكس`. T-I25.                                                                                                                                                                                            | §2.6 card 2        |
| L-d emulator step 9                                 | LOW      | It says it proves the rules side only. The fold is proven by the unit tests.                                                                                                                                                                                                                    | §3.3               |
| Check 4: X3 before X5                               | —        | X5's precondition is stated. X3 is now in I (A13).                                                                                                                                                                                                                                              | §7.3               |
| Check 5: blast radius add `pendingIds`              | —        | Added, with rules and `sync.js`.                                                                                                                                                                                                                                                                | §5                 |
| For-Ameer list 1-5                                  | —        | 1 (A8), 2 (A9), 3 (A14 + L22) and 4 (L22) are answered by Ameer. 5: X2 is resolved without rules (§2.13), and X3 is in I.                                                                                                                                                                       | §7.2-§7.4          |

### 8.3 r1 → r2 (kept from r2)

| Item                                                                                         | Where in r2                                                                   |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| H1 (BLOCKING) (1) no `عكس` on `approveDeduct`; undo an approved deduct with `rev_<deductId>` | §2.6 cards 2-3; T-I18; M16, M19                                               |
| H1 (2) approval with a live deduct is not reversible; explanation line                       | §2.6 card 3; T-I18; M20; C9; S5                                               |
| H1 (3) after an accepted `rev_appr_<m>`, offer `عكس` on body `m` (unit/daily and slot)       | §2.6 card 3; T-I19; M21; emulator 9; C9                                       |
| M1 (§2.6 contradicted C5)                                                                    | Resolved by H1(1)                                                             |
| M2 (D-1 misses `rev_appr_`)                                                                  | §2.10 D-1 + M2; T-I10; M10b; S1                                               |
| M3 (CSV has no contractor rows)                                                              | §4; S2                                                                        |
| L1 (T-I10 `sup` case not RED on main)                                                        | T-I10 fixture order                                                           |
| L2 (M10 cited emulator 2)                                                                    | Mapping dropped                                                               |
| L3 (more mutations)                                                                          | M16-M18, T-I6, T-I22                                                          |
| L4 (cross-device idempotency)                                                                | §2.5; emulator 7-8; C11; X3; S6                                               |
| L5 (refusal blocks logout overstated)                                                        | §2.10 D-1 wording                                                             |
| L6 (stale sketch cites, imprecise refused-export cite)                                       | §9; §2.6 cite fixed                                                           |
| Accountant C1-C11                                                                            | §2.6, §7.1, §7.2                                                              |
| Hidden decisions (a)-(e)                                                                     | Decisions log (C9, C10, C11)                                                  |
| Ameer 18:56 delegation + accountant C9-C11 (steering)                                        | §7.2 Decisions log, §7.3 Deferred, §7.4 show-at-merge; no blocking Ameer list |

## 9. Stale sketch citations (L6)

The sketch's code citations are from older bases. This plan uses current lines at f09a57e5.

| Sketch line     | Sketch cites                          | At f09a57e5                                                                             |
| --------------- | ------------------------------------- | --------------------------------------------------------------------------------------- |
| sketch:117      | `public/index.html` 71-73             | 71-75 (accounts.js, accounts-view.js, accounts-work.js, accounts-payment.js, render.js) |
| sketch:117      | `public/render.js` 1653-1658          | 1697-1702                                                                               |
| sketch:121      | `queueDoc` `public/render.js` 113-119 | 122-129                                                                                 |
| sketch:127, 668 | `VERSION` `aj-p0-v67`                 | `aj-p0-v78` (`public/sw.js:2`)                                                          |
| sketch:140, 683 | unit lists 39 files                   | 42 (`package.json:5` = `ci.yml:68`)                                                     |
