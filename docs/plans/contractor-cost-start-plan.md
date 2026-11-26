# PLAN r11 (final): set CONTRACTOR_COST_START to 2026-11-27, put owner «المصروف» on a cash basis, add two owner lines (date PR)

This is a plan. It has no code, no branch, no PR, no cloud agent, and no deploy.

- **r4 is built on r3:** `/workspace/tmp/cost-start/PLAN-date-pr-r3.md`, sha256 `1e1b3ffc41b0ab02dcd7d38d95bce161e75343f1759b652a457310b47c2e08fe`, 320 lines. I checked it with sha256sum before writing this file. r3 is unchanged. r3 was built on r2, and r2 on r1 (`/workspace/tmp/cost-start/PLAN-date-pr.md`, sha256 `68a8033a3935ba8124002a09141e2dc5ae0bc8aef16026d5c70a362dd9caf068`, 199 lines). r3's title line still said “PLAN r2”, and so did §6 gate 1. r4 fixes both.
- **What r4 changes:** Ameer's 14:57 decision (§1.1) moves owner «المصروف» to a cash basis (§2.6). It also adds two owner-only lines to the project screen (§2.7). Everything else from r3 stays the same:
  - `CONTRACTOR_COST_START = '2026-11-27'`
  - sw v85, hosting only
  - the carried `QTY_ACCEPTED` row
  - rollback to `e72bb887a2e0206d`, fix-forward v86
  - deploy on or after 2026-11-27 00:00 Asia/Baghdad (r6, L-1; Ameer `:58` «تحديث واحد، يننشر يوم 27 أو بعده»)

  §11 lists every change.
- **r5 is built on r4:** `/workspace/tmp/cost-start/PLAN-date-pr-r4.md`, sha256 `d378ca068664d5797e5206d0c0647db7e4fcffc57705f3ef8891a2c27aa9a049`, 597 lines. I checked it with sha256sum before writing this file. r4 is unchanged. r5 adds the accountant's cash-basis opinion, `/workspace/tmp/cost-start/ACCOUNTANT-cash-basis-opinion.md` (sha256 `3e36c1df15f56f13e8c140a1190cccb0d16d3be2ee83b5c627025329e1c33108`, 15 lines), and corrects the 14:53 attribution. Formulas, scope and gates are the same as r4. §12 lists every change.
- **r6 is built on r5:** `/workspace/tmp/cost-start/PLAN-date-pr-r5.md`, sha256 `ea17c99e7288e5d55887c28a229e70ace33721d81b941afa82f387868b9031b2`, 646 lines. I checked it with sha256sum before writing this file; r5 is unchanged. r6 answers the Architect's r5 review (`/workspace/tmp/cost-start/REVIEW-plan-date-pr-r5-ea17c99e.md`, sha256 `1683646763897731977f25d3bffb2b1454d4225d454a2a6e5afa7b5499e90042`, verdict NOTES). That review carries forward the r4 review (`REVIEW-plan-date-pr-r4-d378ca06.md`, sha256 `0525638e192eb2c96c5c265b6c8c814ecdafe7dabcdc4d0b30d5af0bab29c5c3`). r6 also folds in:
  - the accountant's 15:16 answers, `/workspace/tmp/cost-start/ACCOUNTANT-r4-questions-opinion.md` (sha256 `0631059f3de72e7e03bbd4f2175ba54043031a91825ab9d78f8f85d7d0cdc8a8`, 13 lines; header time 15:16 Asia/Baghdad);
  - the accountant's 15:30 H-1 confirmation, `/workspace/tmp/cost-start/ACCOUNTANT-H1-opinion.md` (sha256 `a849134acd5e3f2cc24d049d136bf0017d4fb01e7a281e1f604671be6511ef04`, 9 lines; header time 15:30 Asia/Baghdad);
  - Ameer's 15:31 and 15:32 answers, `AMEER-answers-L.md:58-59`.

  §13 lists the changes and maps every review finding to the r6 lines that address it.
- **r7 is built on r6:** `/workspace/tmp/cost-start/PLAN-date-pr-r6.md`, sha256 `a73af7e0a6c23f6e1a7b9f47068b673031ba91462282de9d8e20128985a4a854`, 796 lines. I checked it with sha256sum before writing this file; r6 is unchanged. r7 answers the Architect's r6 review, `/workspace/tmp/cost-start/REVIEW-plan-date-pr-r6-a73af7e0.md` (sha256 `aa70410d671c04fc537eaf606d535f65482fb7fbcf4ac94408702b68cd8fb327`, 151 lines), verdict NOTES: MEDIUM-1, MEDIUM-2, LOW-1, LOW-2, NIT-1, NIT-2. `AMEER-answers-L.md` is re-cited at 65 lines: EA's 15:41 note is `:61`, and the 15:51/15:52 cards at `:63` and `:65` are recorded beside the placeholders (§8, §5 step 4a). §14 maps every finding to the r7 lines that address it.
- **r8 is built on r7:** `/workspace/tmp/cost-start/PLAN-date-pr-r7.md`, sha256 `877d9a0be60c52b565de5321ccbf4ed0ee1c7d774ee945c066dcdcd3c7747c54`, 875 lines. I checked it with sha256sum before writing this file; r7 is unchanged. r8 replaces the A-1/A-2/A-3 placeholder with Ameer's 15:51 words from `/workspace/tmp/slice-l-plan/AMEER-answers-L.md` (sha256 `256f283c4788ba0bca01c486cd63f4f1c85b414e0ae8d0b8cddea0628ef656a1`, 65 lines, file time 15:52 Asia/Baghdad; its first 63 lines hash to `42f627db62317963e2ef6249880828aaa206f5b376c6e554c2353dad3a72fc29`, the 63-line version EA named), line `:63`, and marks those three deploy-go conditions as met. It flags one partial match (A-1 does not mention the CSV difference) as a question for EA. HOME-NOTE and the step 4a method stay pending as Ameer's choices. §15 lists the changes.
- **r9 (final) is built on r8:** `/workspace/tmp/cost-start/PLAN-date-pr-r8.md`, sha256 `e3b047d87d6c10871b4f5faf8eded7fae92ff28fd19fc170479058fff43f839a`, 900 lines (r7 `877d9a0b…7c54`, 875 lines). I checked both with sha256sum before writing this file; both are unchanged. The answers file is cited throughout r9 as `/workspace/tmp/slice-l-plan/AMEER-answers-L.md` (sha256 `256f283c4788ba0bca01c486cd63f4f1c85b414e0ae8d0b8cddea0628ef656a1`, 65 lines).
  - `:65` (15:52, card t2302s8173) closes the last two Ameer questions. HOME-NOTE: «ملاحظة الربح بشاشة المشروع بس», so the note goes on the project screen only. Pre-deploy check method: «أفحص من التلفون مقاول مقاول», the Architect's phone cross-match.
  - The A-1 CSV-difference question is closed as the accountant's advice (EA, 15:59; §8).
  - Every question is closed. §16 lists the changes.
- **r10 (final, text only) is built on r9:** `/workspace/tmp/cost-start/PLAN-date-pr-r9.md`, sha256 `306d83964a79108a97dc7ad678a1c8e0965bb5091f8ac1fd4c7781bb7f7cb2aa`, 956 lines. Input: the Architect's review `/workspace/tmp/cost-start/REVIEW-plan-date-pr-r9-306d8396.md`, sha256 `130417913c99ec89a12679a2e5f7ef85212f8f7510a8d8a6243ee0333fb8b32a` (verdict NOTES). Only MEDIUM-1, LOW-1, LOW-2, NIT-1 and NIT-2 are addressed. No formula, design or app-string change. §17 lists the changes.
- **r11 (final, text only) is built on r10:** `/workspace/tmp/cost-start/PLAN-date-pr-r10.md`, sha256 `05277440c90442c326322feba96af30a232d21eeb81d339a1f6a6e34d3076a3e`, 996 lines. Input: the Architect's review `/workspace/tmp/cost-start/REVIEW-plan-date-pr-r10-05277440.md`, sha256 `25a1ec0d724f42585160c0719d5ece1e76d47831e43206906382615a1f9b923a` (verdict NOTES, one LOW). Only that LOW is addressed: three buttons and one field added to step 2's do-not-tap list. §18 lists the changes.
- **Architect review of r1:** `/workspace/tmp/cost-start/REVIEW-plan-date-pr-68a8033a.md`, sha256 `17ec0e88afa3d8171546ded56065aa2d36ec58af96b39693bae41c51855f859a`, 130 lines, verdict NOTES (M-1, M-2, L-1..L-5; A-1..A-3 need Ameer and are not code). Verified by sha256sum before this file was written.
- **Base:** main `66d35163eaa44a1503c4e6c80a68a9741431b690` (ahlaljazera8-ctrl/ahl-aljazeera-accounting). Comma fix is live: hosting `e72bb887a2e0206d`, service worker `aj-p0-v84`. Every file:line below was re-read at that SHA from the read-only checkout `/workspace/tmp/deploy-comma-66d3/repo` (`git rev-parse HEAD` matched; `git status` was clean). That checkout was not modified. A later code PR reads the lines again at its own base.
- **Ameer’s answers** are cited from `/workspace/tmp/slice-l-plan/AMEER-answers-L.md`. For r4 the file was hashed again: sha256 `33e3382f972766ff22d836c353fcf26feefdd3fa4001f91ad18e2e5b821edf17`, 56 lines. r3 cited the 53-line version, sha `29bba7cb…a9fd`. Lines `:51`, `:52`, `:53`, `:55` and `:56` are EA-relayed. For r6 the file was hashed again: `/workspace/tmp/slice-l-plan/AMEER-answers-L.md` (sha256 `256f283c4788ba0bca01c486cd63f4f1c85b414e0ae8d0b8cddea0628ef656a1`, 65 lines, file time 15:52 Asia/Baghdad). The new lines are `:58` (15:31) and `:59` (15:32), both EA-relayed, `:61`, EA's 15:41 note on the card text, and two cards that arrived while r7 was being written: `:63` (15:51, A-1/A-2/A-3) and `:65` (15:52, home note and the pre-deploy check). Lines 1–59 are unchanged from the 59-line version r6 cited (sha `53a2dc87…ba74`). The first 61 lines hash to `9dc88953…5c4e`, the version named in the r7 brief and in the Architect's r6 review.
- **Related sources:** Architect answer `/workspace/tmp/cost-start/ANSWER-cost-start-300d5eb.md` (sha256 `7f141dde1dc378106aeb44e4cbf0cf959c673d6beaf6c8e2de06fe57781399e6`); open-row count `/workspace/tmp/cost-start/COUNT-open-rows.md` (live counts were not taken, 403 on document reads); operating rule `/workspace/tmp/cost-start/RULE-one-system-per-contractor-r2.md` (sha256 `2bc3c877a2b3fa631db3bdbdc5c1b155a1b3ff946229be2111d3db72de8e9189`); Architect PR #114 review `/workspace/tmp/cost-start/REVIEW-PR114-967b21df.md` (sha256 `f065e342b0caa47b122c02c6a8810cbd0ef06fb25e0c8add5a6ba313d0abb5a9`, LOW-1 test gap).
- Code starts only after the Architect CONFIRMS this (or a later) revision and Ameer gives a code-start go. Deploy is hosting only, on or after 2026-11-27 00:00 Asia/Baghdad, after the normal gates and the §5 pre-deploy check. This plan does not start a cloud agent.

## 1. Source of the decision

From `AMEER-answers-L.md`, EA-relayed, Asia/Baghdad (UTC+3):

```
2026-11-26 12:18 card: «إي، موافق على قاعدة المقاولين مثل ما هي بالحرف» (`:51`)
2026-11-26 12:19 «ضغطت انخصم» (four rows: driver 25k, Abbas 150k, Diya 300k, blacksmith 150k) (`:52`)
2026-11-26 12:19 card: «تاريخ البداية 2026-11-27» (CONTRACTOR_COST_START) (`:53`)
```

`:51` is the one-system-per-contractor operating rule (`RULE-one-system-per-contractor-r2.md`), approved «مثل ما هي بالحرف». That rule is operating guidance only. This PR adds no code for it. The only new Arabic strings in this PR are N1–N4 in §2.7.

### 1.1 Scope change in r4

Source is the same file, EA-relayed, Asia/Baghdad:

```
- 2026-11-26 14:53 Baghdad (t2291u): «اقصد المصروف يجب ان يطابق المصروف الفعلي اليس ذالك صحيحا يعني ذرعات المقاول الكاملة يبقى يطلبني فلا يسجل في المصروف» (`:55`)
- 2026-11-26 14:57 Baghdad (card t2294s8131): «إي، المصروف بالمدفوع فعلاً، وضيف المستحق للمقاولين والكلفة الكلية لشاشة المشروع» (`:56`)
```

- **`:56` is the decision.** `rg -F` on the exact quote matched `AMEER-answers-L.md:56`.
- **`:55` is Ameer's own message.** `AMEER-answers-L.md:55` (re-read for r5; the file is still sha256 `33e3382f…df17`, 56 lines) records a chat message `t2291u` at 14:53. It is in the first person («يبقى يطلبني») and asks a question. This plan keeps it as Ameer's words, as the record says, and does not change that file.
- **The accountant's cash-basis opinion is a separate source with the same time.** EA saved it as `/workspace/tmp/cost-start/ACCOUNTANT-cash-basis-opinion.md` (sha256 `3e36c1df15f56f13e8c140a1190cccb0d16d3be2ee83b5c627025329e1c33108`, 15 lines). Its heading says it is the accountant's message of 2026-11-26 14:53 Baghdad, quoted word for word. The file was written on the box at 15:14 Asia/Baghdad, after r4. So two different 14:53 messages exist: Ameer's question (`:55`) and the accountant's answer. EA's earlier "his message 14:53" meant the accountant's.
- **Correction of r4.** r4 said there was no accountant text and that the 14:53 basis was only EA's description. That was true of the box when r4 was written, and is no longer true. The cash formula in §2.6 and the deduct rule in §2.7 are now backed by the accountant's own words, quoted in §4(c2).

What `:56` decides, checked against the code in §2.6 and §2.7:

1. Owner «المصروف» is the cash actually paid.
2. The project screen gets two new owner-only lines: «المستحق للمقاولين» and «الكلفة الكلية».
3. `:56` does not decide profit. Ameer decided it later, at `:59` (§1.2).

### 1.2 Ameer's screen decisions (r6)

From `/workspace/tmp/slice-l-plan/AMEER-answers-L.md` (sha256 `256f283c4788ba0bca01c486cd63f4f1c85b414e0ae8d0b8cddea0628ef656a1`, 65 lines, file time 15:52 Asia/Baghdad), EA-relayed, verbatim:

```
- 2026-11-26 15:31 Baghdad (card t2298s8153 «قرارات شاشة المشروع»): الربح ينحسب شلون؟ «الربح = المقبوض − المصروف المدفوع» | ملاحظة الربح: «موافق على ملاحظة الربح بالحرف» | الرئيسية والقائمة: «نفس الأساس بالرئيسية وقائمة المشاريع» | السالب: «"سلف زايدة على المقاولين" برقم موجب» | التحديث: «تحديث واحد، يننشر يوم 27 أو بعده» (`:58`)
- 2026-11-26 15:32 Baghdad (card t2299s8158, resolves the profit conflict above, supersedes the first profit answer): «الربح = المقبوض − الكلفة الكلية، ويا ملاحظة الربح بالحرف» (`:59`)
```

- **Profit.** `:59` (15:32) settles it: «الربح = المقبوض − الكلفة الكلية، ويا ملاحظة الربح بالحرف». It supersedes his first answer at `:58` («الربح = المقبوض − المصروف المدفوع»), which this plan keeps as history only.
- **Profit note (r7: confirmed by `:61`).** `:58` says «موافق على ملاحظة الربح بالحرف», and `:59` repeats «ويا ملاحظة الربح بالحرف». EA's 15:41 note at `:61`, verbatim: Note (EA, 15:41): the card t2298s8153 step 2 question shown to Ameer read exactly: «تنكتب تحت الربح هاي الملاحظة: «الربح = المقبوض − الكلفة الكلية (المصروف + المستحق للمقاولين)»؟» and he answered «موافق على ملاحظة الربح بالحرف». So the approved note text is exactly: «الربح = المقبوض − الكلفة الكلية (المصروف + المستحق للمقاولين)». Placement on the project screen is approved; placement on the home screen is NOT yet his words (pending question). So the exact N3 string is the text the card showed Ameer, and r6's EA-relay flag is dropped. The note is approved **for the project screen only** (`:65` «ملاحظة الربح بشاشة المشروع بس»).
- **Home and list.** `:58`: «نفس الأساس بالرئيسية وقائمة المشاريع».
- **Negative balance, `:58`:** «"سلف زايدة على المقاولين" برقم موجب». In the file the inner quotes are plain ASCII `"`, not «».
- **One update.** `:58`: «تحديث واحد، يننشر يوم 27 أو بعده».
- **Not asked.** Q-LABEL was not put to Ameer, so «المصروف» stays (Architect recommendation, `:56` wording). **A-1/A-2/A-3: answered by Ameer at `:63` (15:51), see §8.** **HOME-NOTE: answered at `:65` (15:52), «ملاحظة الربح بشاشة المشروع بس»: the N3 note is on the project screen only.** `:58` gives home and the list the same profit basis, with no note.

## 2. Exact change

### 2.1 The constant

At 66d35163, the only definition is `public/accounts.js:9-11`:

```
  /** null until an engineer changes this file and deploys, after Ameer says go. */
  /** @type {string | null} */
  const CONTRACTOR_COST_START = null;
```

It is exported on the `Accounts` API at `:1056`. Change **only** the value to `'2026-11-27'`. Update the comment so it records that Ameer named this date. Do not change `MAX_AMOUNT`, `MAX_QTY`, or any other constant. The TypeScript shape already allows a string (`types/checkjs.d.ts:1435`: `CONTRACTOR_COST_START: string | null`); leave it.

`firestore.rules` has **zero** mentions of the constant (confirmed at 66d35163). Rules are not edited. Indexes, functions, and CSV paths are not edited. `CONTRACTOR_COST_START` is set only to `'2026-11-27'`, not to any other value and not left null.

### 2.2 Service worker

`public/sw.js:2` is `const VERSION = 'aj-p0-v84';`. Bump to `aj-p0-v85`. `sw-version-guard` (`.github/workflows/ci.yml:36`) fails any `public/` change without a bump. The four pins that must move with it are `tests/shell-cache.test.js:44`, `:67`, `:113`, and `tests/webkit-upgrade.test.js:19` (`const MARK = 'aj-p0-v84';`).

**Does the scope change affect the sw version? No, not while this stays one PR.** Every `public/` diff needs exactly one bump, so one PR is still v85, and fix-forward after a rollback is still v86. If Ameer picks two PRs in Q-SPLIT, the second PR is v86. The fix-forward number would then be set again at that time, as the next unused version.

### 2.3 Hosting only

No `firestore.rules` change, no `firestore.indexes.json` change, no functions, no CSV change. The only new Arabic strings are N1–N4 in §2.7: N1 and N2 approved by `:56`, N3 by `:58`/`:59`, N4 by `:58`. Every other Arabic string the dated UI paints is already in the tree:

- «مقاول» — tab and screen title (`public/accounts-work.js:835`, `:868`, `:904`)
- «+ عقد مقاول» — old create link, hidden once a date is set (`public/render.js:104`)
- «العقد الجديد من شاشة مقاول» — note on `#subnew` once a date is set (`public/accounts-work.js:33`, used at `public/render.js:902-906`)
- «المصروف» / «إجمالي المصروف» — already the on-screen cost labels (`public/render.js:678`, `:770`)

No new string is needed for the constant change, the `saveSubcontract` guard, or the owner-phone refresh check (that check looks for the existing «مقاول» tab). If a later review wants an on-screen CSV warning, that would be a new string and needs Ameer’s approval. Do not add one in this PR. Profit moves to «الكلفة الكلية» (`:59`), so the note «الربح = المقبوض − المصروف» at `public/render.js:771` is replaced by N3 (§2.7).

### 2.4 Every reader, and what it does once the value is `'2026-11-27'`

Every reader takes the export at call time. There is no stored copy. Two predicates are not the same:

- **Dated** (the string is `YYYY-MM-DD`): `contractorCostDated()` at `public/render.js:96-99`. True as soon as the constant is a date, even if today is still before the start.
- **Open** (`today() >= start`): `costOpen()` in work (`public/accounts-work.js:108-111`), payment (`public/accounts-payment.js:105-108`), correct (`public/accounts-correct.js:163-166`), and statement (`public/accounts-statement.js:1036-1039`). `today()` is the Baghdad calendar day (`public/session.js:171-174`, via `baghdadDate` at `:143-169`).

| Reader at 66d35163 | Once non-null |
|---|---|
| `public/render.js:96-99`, `:103-105` `contractorCostDated` / `subcontractSection` | Hides «+ عقد مقاول» as soon as the date is set. Existing old contract cards stay. |
| `public/render.js:900-907` `views.subnew` | The old name / amount / work form is replaced by the existing note «العقد الجديد من شاشة مقاول». |
| `public/render.js:659-666` `ownerSpent` → `Accounts.projectCost(..., Accounts.CONTRACTOR_COST_START)` | Three places use `ownerSpent`: home «إجمالي المصروف» / «صافي الربح» (`:674-679`), the projects list «ربح/خسارة» (`:752-754`), and the owner project «المصروف» / «الربح» (`:768-771`). At 66d35163 the formula (`public/accounts.js:1043-1053`) adds live `approveLabor` with `txnDate >= start`. r4 changes that: legacy ledger spent plus counted contract **cash** with `txnDate >= '2026-11-27'` (§2.6). |
| `public/accounts-work.js:103-111` `startDate` / `costOpen` | «مقاول» tab is added only when `today() >= '2026-11-27'` (`syncTab` at `:854-873`). Agreement, measurement, and approval writes return immediately when closed (`saveAgreement` `:490`, `saveMeasure` `:538`, and the other `if (!costOpen())` returns at `:584`, `:739`, `:858`, `:890`, `:940`, `:979`). |
| `public/accounts-payment.js:100-108` | Payment / advance / return / refund blocks and writes stay off until the start day (`:650`, `:698`, `:739`, `:786`, `:957`, `:1095`). |
| `public/accounts-correct.js:163-166` | Deduct, reject, supersede, and reverse blocks and writes stay off until the start day (`:960`, `:1060`). |
| `public/accounts-statement.js:1036-1039` | Settle and issue-statement blocks stay off until the start day (`:1200`). |

`public/accounts-reclass.js` does **not** read the constant (0 hits at 66d35163). «انخصم» / «ملغى» keep working the same way before and after the date. At 66d35163 `projectCost` ignores `laborReviews` and `advanceLabor`. After r4 it still ignores `laborReviews`, but it counts `advanceLabor` (§2.6).

The CSV button (`public/render.js:1558-1562`) still calls `Ledger.toCSV` on counted ledger rows only (`public/ledger.js:321-329`). That path is unchanged, which is why on-screen «المصروف» and the CSV spent diverge after the start (risk (c)).

### 2.5 Block old `saveSubcontract` in this PR (L-1)

At 66d35163, `saveSubcontract` (`public/render.js:162-186`) checks only the owner role (`:163`) and is reached from any `#save-sub` click (`:1618`). With a date set, only the hidden form stands in the way, because `#sub-name` is missing.

**Adopt in this PR:** as the first statement in `saveSubcontract`, before `if (button) button.disabled = true` (`:167`), add `if (contractorCostDated()) return;`. That placement matters: a return after the button is disabled would leave it disabled. The guard needs no new Arabic string. It does not change the path for a user who follows the UI. It cannot protect v84 phones; that is §4(d).

The test and the mutant are in §3.7.

### 2.6 Owner «المصروف» on a cash basis (Ameer `:56`)

**Today, checked at 66d35163.**

- `projectCost` is at `public/accounts.js:1043-1053`. Its doc comment is at `:1025-1042`, and it is exported at `:1063`.
- When `start` is a date, it adds `countedAmount(row.amount)` for every row that meets all of these (`:1048-1051`):
  - `row.purpose === 'approveLabor'`
  - the row counts (`rowCounts`)
  - the row is on the project
  - its `txnDate` is `YYYY-MM-DD` and on or after `start`
- Nothing else is added. The comment says so at `:1034`: “A deduct does not reduce the sum. effect.cost is not applied.”
- It never reads `payLabor`, `advanceLabor`, `returnAdvance` or `refundLabor`.

**After r4.** When `start` is a date:

```
المصروف = legacySpent + payLabor + advanceLabor − returnAdvance − refundLabor
```

Each K term is the sum of `countedAmount(amount)` over rows that:

1. have that `purpose` (`PURPOSES`, `public/accounts.js:72-75`);
2. count by `rowCounts(row, index)` (`:746-770`);
3. have `row.projectId === projectId`;
4. **any `txnDate`.** Cash rows are not date-filtered. This is the H-1 exception, confirmed by the accountant at 15:30 (§2.6a). The `>= start` filter applies only to `approveLabor` and `deduct` (§2.7);
5. are in IQD (the same rule as `inScope`, `:795`).

`approveLabor`, `deduct`, `approveDeduct` and `settle` are **not** added. When `start` is not a date, the return is still `legacySpent`. That part is unchanged, so the null-start tests stay.

More detail:

- **No contractor filter is needed.** Every row in `K.accountTxns` with these purposes is contract-system cash. Labour paid outside a contract is a ledger entry, so it is already in `legacySpent`.
- **Cash before 27 Nov does exist (H-1, r6).** r4/r5 said none could exist; that was wrong. Normal payment writes are blocked before the start day (`costOpen`, `public/accounts-payment.js:105-108`, used at `:650`, `:698`, `:739`, `:786`). But «ملغى» on a slice-L row works on any day: `advanceAfterReversal` (`public/accounts-reclass.js:406-425`) builds an `advanceLabor` through `AccountPayment.cashDoc`, which stamps `txnDate: today()` (`public/accounts-payment.js:396`). The browser fixture models such a row (`tests/browser-check.js:2667-2672`). I can't count live rows from the box (403); see the pre-deploy check in §5.
- **Returns and refunds.** `returnAdvance` and `refundLabor` subtract whatever their `txnDate`, like the other cash rows (H-1). r5 said a return and its target could not fall on opposite sides of the start date. The Architect proved that wrong: an 80,000 «ملغى» advance dated 25/11, with a 30,000 return on 28/11, gave «المصروف» −30,000 under the r5 filter.
- **Signs.** They match the purpose table: those four purposes have `cash` `1, 1, -1, -1` (`:72-75`), and `approveLabor` has `cash: 0` (`:71`).
- **Signature unchanged:** `projectCost(projectId, legacySpent, txns, syncErrors, start) → number`. `ownerSpent` (`public/render.js:659-666`) and its three callers (`:674`, `:753`, `:768`) keep calling it. Update two comments so they say cash paid on contracts instead of `approveLabor`: `public/accounts.js:1025-1042` and the `ownerSpent` comment at `public/render.js:650-658`.
- **Effect beyond the project screen.** Home «إجمالي المصروف» / «صافي الربح» (`:674-679`) and the projects list «ربح/خسارة» (`:752-754`) share `ownerSpent`, so they move to the cash basis in the same change. No new line is added there, because `:56` names the project screen only. See Q-HOME.

Proposed shape: one private helper in `public/accounts.js`, so the two exports can't drift apart:

```
/** @returns {{ approved: number, paid: number, advances: number, returned: number, refunded: number, deducts: number }} */
function projectContract(projectId, txns, syncErrors, start)            // private; one loop over rowIndex(txns, syncErrors).byId
function projectCost(projectId, legacySpent, txns, syncErrors, start)   // exported (:1063): legacySpent + paid + advances - returned - refunded
function projectDue(projectId, txns, syncErrors, start)                 // new export, §2.7
```

The row filters (projectId, `rowCounts`, the date regex, `>= start`, IQD) are written once, in `projectContract`. Like today, the helper does not read `entryDate`, does not write, and does not read `slotLosers`, `linkRefusals` or `laborReviews`. Add `projectDue` to the `Accounts` return object next to `projectCost` (`:1063`), and to the type shape next to `projectCost` at `types/checkjs.d.ts:1475`.

### 2.6a H-1: contract cash counts at any date (accountant advice, confirmed 15:30)

**Status: decided on the accountant's advice, not as a separate Ameer decision.** It is consistent with Ameer's `:56` («المصروف بالمدفوع فعلاً»). The Architect's r4 review also calls it an implementation of `:56`, not a new rule. Ameer's own words do not address the date filter directly.

Source: `/workspace/tmp/cost-start/ACCOUNTANT-H1-opinion.md` (sha256 `a849134acd5e3f2cc24d049d136bf0017d4fb01e7a281e1f604671be6511ef04`, 9 lines; header time 15:30 Asia/Baghdad), محاسب أهل الجزيرة, EA-relayed, verbatim (file lines 3–9):

> «أؤكد الاستثناء. نقد العقود (دفعات، سلف، مرتجع، مسترد) ينحسب ب«المصروف» بأي تاريخ، وفلتر 27/11 يبقى بس للمصادقات والخصومات.
> السبب: «ملغى» يشيل القيد من الدفتر وينقله سلفة بالعقد، فإذا انفلترت بالتاريخ تضيع من الاثنين، والفلوس فعلاً طلعت. بهالاستثناء تنحسب مرة وحدة. والمرتجع ما يطلّع مصروف سالب، والمستحق يطابق كشف المقاول.
>
> خطر التكرار ويا الدفتر: يصير بس إذا كو قيد نقدي بالعقود قبل 27/11 ونفس الفلوس بعدها قيد فعّال بالدفتر، يعني ما انشالت بـrev_. مثال ذلك دفعات عقود «+ عقد مقاول» القديمة، أو سلفة انسجلت بالمكانين.
> أوصي بفحص لمرة وحدة قبل النشر: كل قيد نقدي بالعقود تاريخه قبل 27/11 لازم يكون جاي من «ملغى» وقيده الأصلي ملغى بالدفتر، أو ما إله أي قيد بالدفتر. أي واحد غير هيج يطلع سؤال لأمير قبل النشر. و«انخصم» ما يكتب نقد بالعقود، فما بيه خطر.
>
> تصحيح لمعادلة المطابقة اللي قلتها قبل: «المصروف» بالشاشة − مصروف الـ CSV = صافي نقد العقود بأي تاريخ (دفعات + سلف − مرتجع − مسترد)، مو من 27/11 وراح بس.»

**What the plan does:**

- **`projectCost`.** Legacy plus every counted contract-cash row on the project (`payLabor` + `advanceLabor` − `returnAdvance` − `refundLabor`), at any `txnDate`.
- **`projectDue`.** `approveLabor` − `deduct` with `txnDate >= start`, minus the same any-date net cash.
- **The start switch stays.** With a null or non-date start, `projectCost` returns legacy and `projectDue` returns 0 (the v84 behaviour).
- **Why the cash is counted once.** «ملغى» first writes a ledger `rev_`, which takes the original entry out of `legacySpent`, and only then the contract advance. The accountant's words: «بهالاستثناء تنحسب مرة وحدة. والمرتجع ما يطلّع مصروف سالب، والمستحق يطابق كشف المقاول.»
- **Remaining double-count risk.** It exists only if a pre-27/11 contract-cash row has a still-active ledger twin. The accountant's examples are «دفعات عقود «+ عقد مقاول» القديمة، أو سلفة انسجلت بالمكانين». Code note: at 66d35163 the old «+ عقد مقاول» path (`saveSubcontract`, `public/render.js:162-186`) writes only `K.subcontracts` / `K.terms`, never `accountTxns`. So the first example cannot produce contract-cash rows in this code. The pre-deploy check in §5 covers both cases anyway.
- **Not changed:** the `rowCounts`, project, IQD and syncErrors filters.

### 2.7 Two new owner-only lines on the project screen (Ameer `:56`)

**Where, checked at 66d35163.**

- The project screen is `views.project`, at `public/render.js:762-782`.
- The owner block is `if (L.can(u, 'owner')) { … }`, at `:767-772`. It paints «المقبوض», «المصروف» (`:770`), «الربح», and the note «الربح = المقبوض − المصروف» (`:771`).
- Non-owners get the card built at `:766` (ledger «المصروف» by type). They never enter the owner block.

**Add these two rows inside the owner block only**, after the «المصروف» row on `:770` and before «الربح» on `:771`:

```
<div class="kv"><span>المستحق للمقاولين</span>${money(due)}</div>
<div class="kv"><span>الكلفة الكلية</span>${money(spent + due)}</div>
```

- `const due = ownerDue(id)`. `ownerDue` is a new private helper next to `ownerSpent` (`public/render.js:659-666`).
- It reads `K.accountTxns` and `K.syncErrors` the same way `ownerSpent` does, and returns `Accounts.projectDue(id, txns, errs, Accounts.CONTRACTOR_COST_START)`.
- It returns `0` when `Accounts.projectDue` is missing (the same guard as `:663`).
- `money` is the existing helper at `public/render.js:56`. `:771` already passes it a negative profit.

The formulas use the same row filters as §2.6. Only `approveLabor` and `deduct` need `txnDate >= start`; cash rows count at any date (H-1, §2.6a):

```
المستحق للمقاولين = approveLabor − payLabor − advanceLabor + returnAdvance + refundLabor − deduct
الكلفة الكلية     = المصروف + المستحق للمقاولين
```

- **Same as the person balance.** This is the same expression as `net` in the person fold (`public/accounts.js:865`: `approvedLabor - advancesPaid - payments + cashReturned + refunds - deductions`), limited to one project. Only its `approveLabor` and `deduct` terms are limited to `txnDate >= start`; cash terms count at any date (H-1). `settle` is left out, as it is in `net`.
- **Which deducts count.** A `deduct` counts only when `rowCounts` says so: its approval counts and it has a counting `approveDeduct` (`:757-762`).
- **Deducts lower both lines.** A counted deduct **reduces** «المستحق للمقاولين» and «الكلفة الكلية». That closes the gap the current comment admits (`:1034`).
- **Identity to test:** `الكلفة الكلية = legacySpent + approveLabor − deduct`, because the cash terms cancel. Paying a contractor moves money from «المستحق» to «المصروف» and leaves «الكلفة الكلية» unchanged.
- **No start date.** When `start` is not a date, `projectDue` returns 0 and «الكلفة الكلية» equals «المصروف», which equals `legacySpent`.
- **Negative due (Ameer `:58`).** «المستحق للمقاولين» is negative when more cash went out than work was approved. In that case the row's label switches to N4 «سلف زايدة على المقاولين» and the amount is `Math.abs(due)`, a positive number. **«الكلفة الكلية» always uses the signed value:** `spent + due`, which equals `legacySpent + approveLabor − deduct`. For example, `spent` 400,000 and `due` −100,000 shows «سلف زايدة على المقاولين» 100,000 and «الكلفة الكلية» 300,000. When `due >= 0` the label stays N1. When `due === 0`, show N1 with 0. Caution from the Architect: `due` is a net per project across contractors, so a negative total can hide one contractor who is still owed. The person statements remain the per-contractor truth.
- **Nowhere else.** N1, N2 and N4 are not added to home, the projects list, the CSV, or any non-owner view.
- **Profit on all three owner screens (Ameer `:59`, `:58`).**
  - Project screen, `:769`: `profit = s.received − (spent + due)`. The note on `:771` becomes N3.
  - Projects list, `:753`: `profit = s.received − (ownerSpent + ownerDue)`. The «ربح/خسارة» label logic at `:754` is unchanged, and there is no note on the list cards.
  - Home, `:674-679`: «إجمالي المصروف» stays Σ `ownerSpent` (cash, no new line). «صافي الربح» = `t.received − Σ (ownerSpent + ownerDue)`. This profit basis is approved by `:58` «نفس الأساس بالرئيسية وقائمة المشاريع». **No note on home** (`:65` «ملاحظة الربح بشاشة المشروع بس»). Apart from the profit figure, the home card stays as it is.
  - History: r6 put N3 on home. The Architect's r6 review (MEDIUM-1) said that was not approved, r7 made it a question, and Ameer answered at `:65`: project screen only.
  - So on home «صافي الربح» ≠ «إجمالي المقبوض» − «إجمالي المصروف» whenever something is owed, and nothing on screen explains it. Ameer chose this at `:65`. The accountant (15:16) had said a note would explain it («ينشرح بالملاحظة»); that advice is recorded, not adopted. Owners are told once, at the deploy (§4(g)).

**New Arabic strings, exactly as approved:**

| # | Exact string | Where |
|---|---|---|
| N1 | `المستحق للمقاولين` | `public/render.js`, owner block of `views.project` (`:56`) |
| N2 | `الكلفة الكلية` | same (`:56`) |
| N3 | `الربح = المقبوض − الكلفة الكلية (المصروف + المستحق للمقاولين)` | the note replacing `الربح = المقبوض − المصروف` at `public/render.js:771` (project screen **only**). Approved by `:58` «موافق على ملاحظة الربح بالحرف» and `:59` «ويا ملاحظة الربح بالحرف»; the exact text is the card text (EA's `:61`); placement: `:65` «ملاحظة الربح بشاشة المشروع بس». |
| N4 | `سلف زايدة على المقاولين` | the label in place of N1 when `due < 0`, owner project screen only (`:58`) |

At 66d35163, `rg` finds none of N1–N4 anywhere in `public/`. No other new string is allowed in this PR. The old note «الربح = المقبوض − المصروف» is removed from `:771`. The minus sign in N3 is U+2212, the same character the old note uses.

## 3. Tests

### 3.1 Architect LOW-1: pin the qty/days cap

In `tests/accounts-work.test.js`, add `{ input: '100000000', stored: 100000000, boxes: ['qty', 'days'] }` to `QTY_ACCEPTED` (the array starts at `:1280`; the last accepted row today is `:1291`). The Architect’s review of PR #114 (`REVIEW-PR114-967b21df.md`, LOW-1) showed that changing `qty > 100000000` to `qty >= 100000000` left every then-existing PR test green. Rules `qtyOk` allows 100000000, so the cap must stay saveable. `#cw-per` already pins its own cap (`1,000,000`).

**Mutation (`qty-days-cap-off-by-one`):** change `qty > 100000000` to `qty >= 100000000` on `#cw-qty` / `#cw-days` only. The new row must go red; existing rows may stay green.

### 3.2 Pin the date 2026-11-27 (before / on / after) — M-1 harness

Existing tests already cover the *shape* of dated behaviour with fixture dates (`tests/accounts-work.test.js:710` “before the start date… do not save”; `:737` “a start date on or before today hides the old create form and opens مقاول”; `:778` “a start date after today hides the old form and leaves مقاول closed”; `tests/accounts-payment.test.js:804` and `:825`; `tests/accounts.test.js:276` and `:312` “txnDate before the start stays 100000”). Keep those.

r1 §3.6 claimed that setting the shipped constant to `'2026-11-26'` or `'2026-11-28'` would turn the new UI tests red. That claim is false with the current harness (review M-1). Every UI test in `tests/accounts-work.test.js` calls `reset()`, which assigns `Accounts.CONTRACTOR_COST_START = null` (`:125`). Tests that need a date then call `withStart` (`:141-148`). So no UI test ever sees the shipped value. The Architect’s probe confirmed it: with the source at `'2026-11-26'` and at `'2026-11-27'`, the same three unit tests fail; only the exact-string source pin tells the two values apart.

**Fix the harness, then add the pins:**

1. **Capture the shipped value at module load,** before any `reset()`: `const SHIPPED = Accounts.CONTRACTOR_COST_START`. Assert `SHIPPED === '2026-11-27'`.
2. **Source pin.** Rewrite `tests/accounts-work.test.js:1102-1106` (“the source binding stays null”). Assert the source contains `const CONTRACTOR_COST_START = '2026-11-27';` and does not contain `const CONTRACTOR_COST_START = null;`. Also assert `SHIPPED === '2026-11-27'`. Do **not** treat `reset()` as proof of the default.
3. **`projectCost` with `SHIPPED`.** Use `Accounts.projectCost(..., SHIPPED)` for the txnDate trio: `'2026-11-26'` adds nothing; `'2026-11-27'` and `'2026-11-28'` add the live amount. Keep the existing null-argument cases (`tests/accounts.test.js:172-183` already passes `null` as the fifth argument). Change `:271-273`, which today passes `Accounts.CONTRACTOR_COST_START` as that argument: with the new default and `kApproval()` `txnDate` `'2026-12-01'`, that call would become 700000. Pass `null` explicitly for the “start is null” equality, and add a row that uses `SHIPPED`.
   - **r4 change: the trio uses a cash row.** It now uses a `payLabor` row, not an `approveLabor` row, because approvals no longer enter «المصروف». The `approveLabor` trio moves to `projectDue` (§3.8).
   - **The `:271-273` row under r4.** The `CONTRACTOR_COST_START === null` assert at `:272` still fails with the new default. Its 100000 equality would now pass even with `SHIPPED`, because an approval alone adds no cost. Rewrite it as described in §3.4.
4. **UI / writes, `today()` stubbed, start = `SHIPPED`.** Drive the before / on / after UI tests with `withStart(SHIPPED)` (not a handwritten `'2026-11-27'` literal) and `g.today` stubbed to `'2026-11-26'`, `'2026-11-27'`, and `'2026-11-28'`. With `today()` = `'2026-11-26'`: «+ عقد مقاول» is hidden, `#subnew` shows «العقد الجديد من شاشة مقاول», the «مقاول» tab is absent, agreement / measurement / approval / payment writes append nothing. With `today()` = `'2026-11-27'` and again with `'2026-11-28'`: the old form stays hidden, the tab is present, and a valid save is allowed. Then the `'2026-11-26'` and `'2026-11-28'` source mutants go red in these behaviour tests, not only in the regex.
5. **Baghdad date boundary.** `today()` already has pins in `tests/session-get.test.js:379-392` (T-D4: `2026-11-15T20:59:00Z` → `2026-11-15`; T-D1: `2026-11-15T21:30:00Z` → `2026-11-16`) and T-D7 (device zone ignored, `:397-417`). Add one cost-open pin on this start: clock `2026-11-26T20:59:00Z` is still `2026-11-26` (closed); `2026-11-26T21:00:00Z` is `2026-11-27` (open). This uses the phone’s clock value, not its zone setting (risk (a)).

### 3.3 Service-worker pins

Move the four `aj-p0-v84` pins in §2.2 to `aj-p0-v85`. No other product file should still say `aj-p0-v84` after the bump (historical docs and this plan may mention v84 as the live-before-this-PR version).

### 3.4 Tests and drives that currently require a null source (L-3)

These **must** change. They pin the source text, or they use the module default as the `projectCost` start:

- `tests/accounts-work.test.js:1102-1106` (source regex)
- `tests/accounts.test.js:173` and `:272-273` (module default)
- `tests/browser-check.js:273-274` (`separator guard: public/accounts.js keeps CONTRACTOR_COST_START null`)
- Verify-drive **source** stops: `scripts/verify-drives/accounts-correct.js:115`, `accounts-payment.js:277`, `accounts-statement.js:86` (`STOP: source binding is not null`)
- `scripts/verify-drives/accounts-reclass.js:113-114` (`STOP` if the *runtime* export is not `null`). After this PR the loaded page carries `'2026-11-27'`. Update it to accept `'2026-11-27'`.

In addition to those source-null STOPs, these drives **restore** the export to `null` and check that what is left is `null`. After this PR, `null` is no longer the shipped default. They must restore to, and compare against, the source value (read `public/accounts.js`, the same `'2026-11-27'` string):

- `scripts/verify-drives/accounts-work.js:271-277` (`restoreNull`) and `:378-386` (`left !== null` / finally assign `null`)
- `scripts/verify-drives/accounts-payment.js:551-559` (`left !== null` / finally assign `null`)
- `scripts/verify-drives/accounts-statement.js:330` (finally assign `null`)
- `scripts/verify-drives/accounts-correct.js:419` (finally assign `null`)

The matching `restoreNull` helpers in payment (`:269-277`), statement (`:78-86`) and correct (`:107-115`) include the source-null STOP already listed above and must be updated the same way.

These **may stay** as isolation fixtures, because they assign `null` in `reset()` / `beforeEach` and then assert the restored value, or they test “when the export is forced to null”:

- `tests/accounts-work.test.js:734`, `:765`, `:790`, `:928`, `:1099` (after `withStart` / `reset()`)
- `tests/accounts-payment.test.js:783-801` (“a null start renders no payment blocks…”), and `:822`, `:854`
- `tests/accounts-reclass.test.js:118` and `:530` (`reset()` assigns null, then “U20 gate” asserts it)

Keep `reset()` / `withStart()` restoring in `finally`, as they already do. Do not delete the null-behaviour tests; they still describe what a phone on v83/v84 does (risk (d)).

**New in r4: tests that assume the approval basis and must change.** Line numbers are at 66d35163; the agent reads them again at its base.

- **`tests/accounts.test.js:271-356`, the “k equality” block.**
  - These rows expect an approval to add cost: `:291` (700000, “a deduct does not change”), `:296` (750000), `:309` (700000, “counted once”). Rewrite them: the approval goes to `projectDue`, and each `projectCost` case uses a cash row.
  - `:281` (700000) stays green only by accident: it has a 600000 `payLabor` next to the 600000 approval. Change its amounts so cash ≠ approval (for example pay 250000), so the basis is really tested.
  - Keep each guard case: syncErrors `:300`, live reversal `:305`, non-date start `:317` and `:322-323`, non-date or missing txnDate `:328-331`, another project `:335`, `rej_` `:344`, reversed after a deduct `:354-355`. Express each one twice: once for `projectCost` with a cash row, once for `projectDue` with the approval.
- **`tests/accounts.test.js:208` and `:258`** pass a `null` start. They stay.
- **`tests/accounts-correct.test.js` T-I14 (`:658-677`).**
  - `:669` (a counting deduct leaves cost unchanged) is still true under the cash basis. Keep it, and add `projectDue` dropping by 50000.
  - `:676` (reversing the approval drops cost by 600000) becomes false: an approval reversal changes «المستحق», not «المصروف». Rewrite it: `projectCost` is unchanged, and `projectDue` drops by 550000. Reason: the 600000 approval stops counting, and so does its 50000 deduct (`public/accounts.js:760`). The agent confirms the figure from the seeded rows.
- **`tests/accounts-correct.test.js` T-I19 (`:780-796`).** `:796` expects cost to drop by 100000 after an approval reversal. Under r4, `projectCost` stays the same and `projectDue` drops by 100000.
- **`tests/accounts-statement.test.js:1197`, `:1203`** pass a `null` start. They stay.
- **L-3 (review rule for the rewrites).** Every rewritten line keeps its invariant, not just a green result:
  - `:291`, `:296` and `:309` keep their deduct, materials and counted-once meaning on `projectDue` / the total.
  - T-I14 `:676` and T-I19 `:796` move from "cost drops by N" to "`projectDue` drops by N, `projectCost` unchanged", with the same magnitude (550,000 and 100,000) or a magnitude explained from the seeded rows.
  - The code-PR review compares each rewritten line with the deleted one, not only the pass counts.
- **`tests/browser-check.js`.** Any dated-phase check that reads owner «المصروف» / «الربح» numbers must be re-read at the base and updated to the cash basis.

### 3.5 Browser checks must not depend on the CI calendar day (M-1)

With the source set to `'2026-11-27'`, the default loaded page is *dated* even when «مقاول» is still closed. On 2026-11-26 that already breaks the checks that expect the old form; on or after 2026-11-27 it also adds the seventh tab. At 66d35163 those checks are:

- `:913` — owner project section includes «+ عقد مقاول»
- `:974` — `#subnew` is the old form (`#sub-name`, `#sub-amount` = `1,500,000`, «حفظ العقد»)
- `:467` — separator-guard `amountCase('#subnew/p-school', '#sub-amount', ...)` (four `#sub-amount` checks inside that case, around `:450-467`)
- `:1493` — “owner home … keeps six tappable tabs” (order `home,entry,projects,people,foremen,accounts`)

The separator-guard crawl already has a `cost-open` phase that assigns `Accounts.CONTRACTOR_COST_START = '2026-10-01'` (`:485-486`). Rewrite the default / `cost-null` path so those four checks run under an explicit forced-null (or forced `today() < start`) override. The dated phase must **read the page’s shipped value as a string** (it should equal `'2026-11-27'`) and **force a past start** for the 7-tab check, so that check does not depend on the wall clock. In that dated phase: «+ عقد مقاول» is gone, `#sub-amount` is absent, the note «العقد الجديد من شاشة مقاول» is shown, and the owner tab bar has seven tabs including «مقاول». Do not leave `:1493` as a wall-clock test: it would pass on 2026-11-26 and fail on 2026-11-27.

Emulator `tests/emulator/account-correct.test.js:151` already assigns `'2026-11-01'` itself. The 294-test floor is unaffected by the source default. The unit floor (34) and browser floor (45) stay; counts will rise as tests are added, not as tests are deleted.

### 3.6 Mutations for the new date tests (M-1)

Each new test must go red under at least one of:

- leave `const CONTRACTOR_COST_START = null;` (source pin red, and `SHIPPED === '2026-11-27'` red)
- set the constant to `'2026-11-26'` (the before-start UI test, driven with `withStart(SHIPPED)` and `today()` = `'2026-11-26'`, would open «مقاول»; the `projectCost(..., SHIPPED)` row with txnDate `'2026-11-26'` would add cost; the exact-string source pin would fail)
- set the constant to `'2026-11-28'` (the on-start UI test with `today()` = `'2026-11-27'` and `withStart(SHIPPED)` would stay closed; the exact-string source pin would fail)
- `projectCost` start-compare flipped to `txnDate <= start` or `txnDate > start` (the 2026-11-26 / 2026-11-27 pair goes red)
- skip the sw bump or leave a v84 pin (shell-cache / sw-version-guard red)

Because the UI tests now pass `SHIPPED` into `withStart` and `projectCost`, the `'2026-11-26'` and `'2026-11-28'` mutants go red in behaviour tests, not only in the regex.

New mutants in r4 (§3.8 tests):

| Mutant | Change | Must go red |
|---|---|---|
| `readd-approveLabor-to-cost` | `projectCost` adds `approveLabor` again | T-C1, T-C5, T-C8 |
| `drop-deduct-from-due` | `projectDue` stops subtracting `deduct` | T-C4, T-C5, T-C8 |
| `deduct-counts-unapproved` | `deduct` counted without `rowCounts` (no `approveDeduct`) | T-C4 second half |
| `cash-date-filter-restored` (H-1) | put `txnDate >= start` back on any cash purpose, in `projectCost` or `projectDue` | T-C3, T-C11 |
| `reclass-adv-double` (H-1) | count a reclass advance whose ledger `rev_` is missing, or ignore `rev_` in `legacySpent` (for example `Ledger.sign` always 1) | T-C11, **only if legacy is built from the ledger rows** (LOW-1). The Architect's probe: legacy from `L.totals(L.countedEntries(ledger))` kills it (240,000 vs 80,000); a hard-coded legacy of 0 lets it survive. |
| `drop-date-filter-due` | remove `txnDate >= start` for `approveLabor` / `deduct` in `projectDue` | T-C3 |
| `drop-rowCounts` ×2 (M-1) | skip `rowCounts`, separately in `projectCost` cash and in `projectDue` | T-C6 (`rev_`, `rej_`, unapproved deduct cases) |
| `drop-project-filter` ×2 (M-1) | skip `row.projectId === projectId` in each export | T-C6 (another-project case) |
| `drop-IQD-filter` ×2 (M-1) | skip the IQD check in each export | T-C6 (non-IQD case) |
| `drop-syncErrors` ×2 (M-1) | use `rowIndex(txns, {})` in each export | T-C6 (syncErrors case) |
| `neg-label-missing` (Q-NEG) | always paint N1, or paint the signed amount with N4 | T-C9 |
| `total-uses-abs` (Q-NEG) | paint «الكلفة الكلية» as `spent + Math.abs(due)` | T-C9 (would show 500,000, not 300,000) |
| `home-profit-cash` (Q-HOME) | home or list profit uses `spent` without `due` | T-C12 |
| `note-old` (N3) | keep «الربح = المقبوض − المصروف» on `:771` | T-C12 project-screen check |
| `home-note-present` (`:65`) | add N3, or any note, under home «صافي الربح» | T-C12n |
| `returns-add` | `returnAdvance` / `refundLabor` added instead of subtracted in `projectCost` | T-C2 |
| `show-lines-to-non-owner` | move the two rows out of the `L.can(u, 'owner')` block | T-C7 |
| `total-is-cost-only` | paint «الكلفة الكلية» as `spent` (without `due`) | T-C7 numeric check |
| `profit-basis-swap` | profit = received − spent (Ameer's superseded `:58` answer) on any of the three screens | T-C12 |

### 3.7 Forced old-contract save (L-1)

Add a unit or browser test: with a dated start (`withStart(SHIPPED)` or the shipped page value), a forced `#save-sub` click with `#sub-name` filled appends nothing to `K.subcontracts`, `K.terms`, or the outbox.

**Mutation (`drop-saveSubcontract-guard`):** delete the line `if (contractorCostDated()) return;` from `saveSubcontract`. That test must go red. The UI-hidden-form tests may stay green, because `#sub-name` is still missing on the normal `#subnew` path.

### 3.8 Cash basis and the two new lines (r4)

Unit tests go in `tests/accounts.test.js`. Screen tests go in the owner-screen test file the agent finds at the base, or in `tests/browser-check.js`. Use `start = SHIPPED` unless the test says otherwise.

- **T-C1, `approveLabor` is not in «المصروف».** Legacy 100000 and approval 600000 dated on the start day: `projectCost` is 100000, `projectDue` is 600000, total is 700000.
- **T-C2, cash rows add and returns subtract.** `payLabor` 250000 + `advanceLabor` 100000 − `returnAdvance` 30000 − `refundLabor` 20000, all dated on the start day: `projectCost` is legacy + 300000, and `projectDue` changes by −300000.
- **T-C3, the date rule (H-1).** Cash rows (`payLabor`, `advanceLabor`, `returnAdvance`, `refundLabor`) dated `'2026-11-26'` **count**, in both `projectCost` and `projectDue`. An `approveLabor` and a counted `deduct` dated `'2026-11-26'` do **not** count. Dated `'2026-11-27'` and `'2026-11-28'`, everything counts. **NIT-1: keep all four cash purposes in the 26/11 case; do not trim it.** The Architect's probe showed that without `returnAdvance` and `refundLabor` on 26/11, the return-only and refund-only `cash-date-filter-restored` mutants survive.
- **T-C4, a deduct reduces «المستحق» and «الكلفة الكلية».** Approval 600000 + `deduct` 50000 + `approveDeduct`: due is 550000, total is legacy + 550000, and `projectCost` does not change. The same deduct without `approveDeduct`: due stays 600000.
- **T-C5, identity.** On a mixed fixture, `projectCost + projectDue === legacy + approved − deducts`. Adding a 200000 `payLabor` moves 200000 from due to cost and leaves the total unchanged.
- **T-C6, guards on both exports (M-1).** Each case is built so the row **would** count without the guard: a cash row for `projectCost`, an approval (and a deduct) for `projectDue`. Then it asserts the row is excluded. Cases: syncErrors, `rev_`, `rej_`, an unapproved deduct, another project, non-IQD currency, and (approvals and deducts only) a non-date or missing `txnDate`. A null or non-date start gives cost = legacy and due = 0. Each of the eight M-1 mutants in §3.6 must turn at least one case red.
- **T-C7, owner-only visibility.** The owner project screen shows N1 and N2 with the expected numbers, and the total equals «المصروف» + due. The same screen for a site, foreman, or other non-owner role contains neither string. Neither string appears on home or on the projects list.
- **T-C8, a pre-27/11 advance deducted from the first statement (point 4).**
  - Setup: `legacySpent` 300000, which includes an old ledger advance of 300000. On «مقاول», an approval of 1,000,000 dated 27/11 and a counted `deduct` of 300000.
  - Expected: «المصروف» 300000 (the deduct does not change it), «المستحق» 700000, «الكلفة الكلية» 1,000,000.
  - Contrast case, named as the wrong operating path: the same advance entered again as `advanceLabor` 300000, with no deduct and the old entry not «ملغى». Expected: «المصروف» 600000 and «الكلفة الكلية» 1,300,000, which is a double count.
  - The test pins the arithmetic. It can't stop a user from entering the advance again; that is the operating note in risk (f).
- **T-C9, negative «المستحق» (Ameer `:58`).**
  - Rows: `advanceLabor` 400000 and approval 300000, legacy 0.
  - `projectDue` is −100000. The owner screen shows N4 «سلف زايدة على المقاولين» with `100,000 د.ع`, with no minus sign and no N1 row. «الكلفة الكلية» is `300,000 د.ع`.
  - Second branch: approval 500000 shows N1 with `100,000 د.ع`, and no N4.
  - Edge: a due of 0 shows N1 with 0.
- **T-C10, SHIPPED wiring.** In the dated phase, with `today()` stubbed and fixture rows, the owner project screen shows the cash-basis «المصروف» and the two lines.
- **T-C11, «ملغى» advance before the start (H-1).**
  - Setup: a ledger labour entry of 80,000 dated 25/11 and its ledger reversal `rev_`. **Legacy is computed from those two ledger rows, through `ownerSpent` or `L.totals(L.countedEntries(...))`, never passed as a literal 0 (LOW-1).** It comes out as 0. Add a reclass `advanceLabor` of 80,000 dated `'2026-11-25'`. Start = `SHIPPED`.
  - Expected: «المصروف» = 80,000, and `projectDue` = −80,000, equal to the person statement `net` for that party and project.
  - Then add a `returnAdvance` of 30,000 dated `'2026-11-28'`. Expected: «المصروف» = 50,000, never negative.
  - Contrast case: drop the `rev_`, so the ledger row is still active. Legacy is then 80,000 and «المصروف» 160,000. The test names this as the double count that the §5 pre-deploy check exists to find.
- **T-C12, profit on all three screens and the N3 note on the project screen (Ameer `:59`, `:58`, `:61`).**
  - Fixture: received 1,000,000, legacy 100,000, approval 600,000, payLabor 250,000.
  - Project screen: «المصروف» 350,000, «المستحق للمقاولين» 350,000, «الكلفة الكلية» 700,000, «الربح» 300,000. N3 is present and «الربح = المقبوض − المصروف» is absent.
  - Projects list: «ربح» 300,000.
  - Home: «إجمالي المصروف» 350,000, «صافي الربح» 300,000.
  - **T-C12n (`:65`):** home contains no N3, and the **whole home HTML after «صافي الربح»** (not only the summary card) contains no `<div class="note">`. The projects list contains no N3. The project screen contains N3 exactly once.
  - Received 600,000 instead: «خسارة» 100,000 on the list, and «الربح» −100,000 on the project screen (class `bad`).

## 4. Known risks (at 66d35163)

### (a) The date is compared with the phone’s clock

`costOpen()` is `today() >= start`. `today()` is `baghdadDate(Date.now())` (`public/session.js:171-174`). `baghdadDate` (`:143-169`) uses `Intl` `Asia/Baghdad` and falls back to `ms + 3 * 60 * 60 * 1000` (`:132`, `:168`). The comment at `:139` is exact: it ignores the phone’s zone setting and depends only on the clock value. T-D7 already locks the zone part (`tests/session-get.test.js:397-417`).

The rules check only that a date *looks* like a calendar day (`firestore.rules:45-52` `entryDateOk`: year 2000–2100, real month/day, no 31st in a 30-day month). They do not know `CONTRACTOR_COST_START` and they do not require `txnDate >= start`. Approvals are stamped `today()` (`public/accounts-work.js:419` for `approveLabor`, `:562` for the measurement).

**Architect recommendation on r1 Q4 (adopted):** the operational note is enough. No code or rules mitigation in this PR. The gate (`costOpen`: `today() >= start`) and the stamp (`txnDate = today()`, `accounts-work.js:419`) read the same `today()` within the same tap, so every approval a phone can write has `txnDate >= '2026-11-27'` and is counted by `projectCost`. A wrong clock cannot make cost include or drop an approval relative to the start. Once the deploy is after 00:00 on 27 Nov: a phone that is behind stays closed (fail-safe); a phone that is ahead was going to be open anyway, and only stamps a wrong date label on statements. A server check against `request.time` would be a rules change, which needs Ameer, and is not in this PR.

Keep: deploy on or after 2026-11-27 00:00 Asia/Baghdad, and the boundary pin in §3.2 item 5 (20:59Z on the 26th is closed, 21:00Z is open).

### (b) «+ عقد مقاول» hides as soon as a date is set; «مقاول» opens only on the start day

`contractorCostDated()` (`public/render.js:96-99`, used at `:103-105` and `:900-907`) does not consult `today()`. `costOpen()` does. After this value is live, and until Baghdad `today()` is `'2026-11-27'`, neither kind of new contract can be opened from the UI. `#subnew` shows only «العقد الجديد من شاشة مقاول». Existing old contracts remain visible.

The residual write path is closed in this PR by the §2.5 guard.

**Deploy plan (L-1, Ameer `:58`):** hosting only, **on or after 2026-11-27 00:00 Asia/Baghdad**, never before. Merging the PR on 2026-11-26 is fine. Deploying the dated build on 2026-11-26 would open this gap until midnight. Rollback of a premature deploy is hosting back to `e72bb887a2e0206d` (v84, null date). See §5 for what a rollback after writes does.

**If the deploy is on a later day D (L-1):** the start stays `'2026-11-27'`. `costOpen` is already true on the first fresh load, and approvals and deducts are stamped D or later, so nothing is lost. What the gap costs is operational only:
- Between 27/11 and D, payments to contracted contractors must not go into the ledger. Record them on «مقاول» after D; they will carry date D.
- v84 phones still show «+ عقد مقاول», so nobody may open an old contract in the gap.

### (c) CSV export vs «المصروف» after the start

On-screen owner «المصروف» / «إجمالي المصروف» uses `ownerSpent` → `projectCost` (`public/render.js:659-665`, `:674-678`, `:768-771`). The CSV button still writes ledger rows only (`public/render.js:1558-1562`, `public/ledger.js:321-329`). After r6, on-screen «المصروف» = CSV spent + counted net contract cash at **any date** (`payLabor` + `advanceLabor` − `returnAdvance` − `refundLabor`; accountant 15:30, §4(c3)). Approvals and deducts appear in «المستحق للمقاولين» / «الكلفة الكلية» and in the person statement, not in that CSV. This PR does **not** change the CSV (Ameer’s standing rule). An on-screen Arabic warning would be a new string and is out of scope unless Ameer asks for one.

The accountant’s opinion on this divergence, required by `AGENTS.md:12`. Source: `/workspace/tmp/cost-start/ACCOUNTANT-date-pr-opinion.md` (sha256 `e3205e5ed5b55f19a4aa09d2c4d1c18854e714e5b85817899dffc70d738b7bcd`), محاسب أهل الجزيرة, 2026-11-26 12:41 Asia/Baghdad, recommendation only, EA-relayed, verbatim:

> ١) مقبول محاسبياً، بشرط المطابقة تنكتب صريحة: «المصروف» بالشاشة = مصروف الـ CSV + اعتمادات المقاولين اللي تاريخها 2026-11-27 وبعده، وتتطابق بالدينار. أي فرق غير هذا يطلع سؤال لأمير.
>
> ٢) أوافق، وتصير جزء من القاعدة: «أول ذرعة على (مقاول) تشمل شغل من 2026-11-27 وراح بس. الشغل اللي قبل يبقى بالنظام القديم. وإذا ذرعة شملت شغل قبل التاريخ، ينطرح منها اللي اندفع عنه قبل، حتى ما تنحسب الكلفة مرتين».
>
> ٣) حسب كلام أمير المنقول («كلها اندفعت بعد ما اشتغلوا»)، الأربعة أجور وكروة عن شغل خالص، مو سلف مفتوحة، فـ«انخصم» صحيح والمجموع 625,000 (محسوب بالكود). الشيت يأكد اثنين: ضياء 300,000 والحداد 150,000، عندهم سطرين تسديد بتبويب العمّال بتاريخ 20/11 (من جيب أمير). أما عباس 150,000 والسائق 25,000 فمبنيين على كلام أمير بس. أوصي أمير يأكد هالسطر بكلامه قبل 27/11، لأن الضغطة ما تنرجع.
>
> ٤) مقبول هسه كحل مؤقت. بالإقفال الشهري أفحص أي مصروف أجور باسم مقاول عنده عقد بعد 27/11، وأي قيد ألقاه يطلع لأمير، ويتصحح بـ«ملغى» ويتسجل دفعة على العقد بموافقته. وأوصي بعدين بمنع بالكود من تلفون الفورمن كتغيير منفصل.

The four points are pasted unchanged. The PR body carries the same text (L-5). “Should EA tell the accountant” is no longer an open product question: the accountant is to be told, and their quoted opinion is what is missing.

**r4 note: Ameer's 14:57 decision replaces point ١'s basis.**

- **What point ١ assumed.** It was written for r3's approval basis: «المصروف» = CSV + approvals dated ≥ 2026-11-27.
- **What replaces it.** Ameer's 14:57 decision (`:56`, «إي، المصروف بالمدفوع فعلاً، وضيف المستحق للمقاولين والكلفة الكلية لشاشة المشروع») puts «المصروف» on a cash basis instead.
- **The reconciliation the accountant asked for is now:**
  - on-screen «المصروف» = CSV spent + net contract cash (`payLabor` + `advanceLabor` − `returnAdvance` − `refundLabor`) **at any date**, matching to the dinar. r6 correction: r4/r5 said ≥ 2026-11-27. The accountant corrected his own formula at 15:30 (§4(c3));
  - «الكلفة الكلية» = CSV spent + approvals − deducts dated ≥ 2026-11-27.
- **The four points stay above, unchanged, as history.** Point ١'s condition still applies to the new formula: the match is written out and exact to the dinar, and any other difference goes to Ameer.
- **The accountant's cash-basis opinion is now on file** and quoted in §4(c2). It covers this reconciliation (point 2) and satisfies `AGENTS.md:12` for the cash basis.

### (c2) The accountant's opinion on the cash basis (r5)

Source: `/workspace/tmp/cost-start/ACCOUNTANT-cash-basis-opinion.md` (sha256 `3e36c1df15f56f13e8c140a1190cccb0d16d3be2ee83b5c627025329e1c33108`, 15 lines), محاسب أهل الجزيرة, his message of 2026-11-26 14:53 Asia/Baghdad, recommendation only, EA-relayed, verbatim (lines 3–15 of the file, pasted unchanged):

> توصيتي أولاً: طلب أمير صحيح ومقبول. «المصروف» يصير على أساس النقد (المدفوع فعلاً)، وهذا نفس أساس الدفتر والـ CSV الحالي، فيصير متناسق وياه. بس لا يكون الرقم الوحيد بالشاشة. أنصح بثلاث أرقام: «المصروف الفعلي» (المدفوع)، و«المستحق للمقاولين» (اللي باقي بذمته)، و«الكلفة الكلية» = الاثنين سوا.
>
> 1) صحيح محاسبياً كأساس نقدي. اللي يخسره بس: إذا شاف الربح على المدفوع وحده، الربح يطلع أكبر من الحقيقي بمقدار اللي باقي للمقاولين. لهذا «المستحق» لازم يبين جنبه، والربح الحقيقي = الدفعات من العميل − الكلفة الكلية.
>
> 2) بأساس النقد:
> - ينحسب بالمصروف كل دفعة أو سلفة للمقاول بعقد، تاريخها 27/11 وراح (payLabor + advanceLabor)، وينطرح منه المُرجَع والمستردّ (returnAdvance + refundLabor).
> - ما تنحسب مرتين ويا الدفتر بشرط قاعدة «نظام واحد»: دفعة المقاول بعقد تنسجّل بـ«مقاول» بس، ومو كمصروف بالدفتر. وفحص الإقفال الشهري يمسك أي قيد مكرر.
> - السلفة اللي اندفعت قبل 27/11 هي أصلاً بالمصروف (بالدفتر). لما تنخصم من أول مستخلص، الخصم ما يحرّك نقد، فما ينضاف شي للمصروف. وتنقص بس من المستحق. بس لازم ما تنسجّل من جديد كسلفة نقدية (advanceLabor) بالعقد، لو لا تنحسب مرتين. إلا إذا القيد القديم انضغط عليه «ملغى»، فهنا تنسجّل بالعقد مرة وحدة.
>
> 3) نعم، مشكلة الخصم تختفي من «المصروف الفعلي»، لأن الخصم ما يحرّك نقد. بس تبقى برقمين: «المستحق» و«الكلفة الكلية»، لازم الخصم ينطرح منهم (معتمد − خصومات)، وإلا المستحق يطلع أكبر من اللي فعلاً بذمته.
>
> نص لأمير:
> «كلامك صحيح، المصروف يصير بالمدفوع فعلاً بس، والباقي من الذرعة يبقى مستحق للمقاول بكشف حسابه. بس أنصح الشاشة تبيّن جنبه رقم «المستحق للمقاولين» و«الكلفة الكلية»، حتى الربح ما يطلع أكبر من الحقيقي وأنت بعدك مطلوب للمقاول. والسلفة اللي اندفعت قبل 27 محسوبة من قبل، ولما تنخصم من المستخلص ما تنضاف مرة ثانية.»

**How this matches the r4/r5 plan (checked line by line):**

- **Point 2, first bullet = §2.6, with the H-1 exception.** Cash payments and advances, minus returns and refunds: same formula. His «تاريخها 27/11 وراح» is superseded for cash rows by his own 15:30 confirmation (§2.6a, §4(c3)): cash counts at any date, and the 27/11 filter stays only for approvals and deducts.
- **Point 3 = §2.7.** Deducts drop out of «المصروف الفعلي» because a deduct moves no cash, but they must be subtracted from «المستحق» and «الكلفة الكلية» («معتمد − خصومات»). Same rule; tests T-C4 and T-C5 cover it.
- **Point 2, third bullet = risk (f) and T-C8.** A pre-27/11 advance is already in ledger spent. Deducting it from the first statement adds nothing to «المصروف» and only lowers «المستحق». It must not be recorded again as `advanceLabor` unless the old entry was marked «ملغى»; then it is recorded on the contract once.
- **Point 2, second bullet = A-3 and point ٤ of the 12:41 opinion.** No double count with the ledger depends on the one-system rule (contract payments only on «مقاول», not as a ledger expense) and on the monthly-close check. There is no code control for this in this PR.
- **Recommendation and point 1 bear on Q-PROFIT** (§8): the accountant says real profit = client payments − «الكلفة الكلية».

**Where the text adds to, or differs from, the plan. Flagged; formulas are not changed:**

1. **Label «المصروف الفعلي».** The accountant names the cash figure «المصروف الفعلي». The screen label stays «المصروف» (`render.js:770`), as Ameer said at `:56` («المصروف بالمدفوع فعلاً»). Renaming it would be a new Arabic string that Ameer has not approved. Q-LABEL asks him.
2. **"Same basis as the CSV" is not "same number".** The accountant writes that the cash basis is «نفس أساس الدفتر والـ CSV الحالي، فيصير متناسق وياه». The basis is the same (cash), but contract cash on «مقاول» is not in the CSV (`render.js:1558-1562`, `ledger.js:321-329`). So on-screen «المصروف» = CSV spent + net contract cash at any date (corrected by the accountant at 15:30, §4(c3)). No CSV change in this PR.
3. **Dates for returns and refunds (N-3, resolved in r6).** r5 called the `>= start` filter on returns and refunds an engineering choice. The Architect's H-1 shows it was a defect: «ملغى» advances dated before the start dropped out, and a later return made «المصروف» negative. The accountant confirmed the exception at 15:30: all contract cash counts at any date (§2.6a).
4. **Profit names.** The accountant writes «الدفعات من العميل»; the screen's existing word is «المقبوض» (`render.js:770`). Treated as the same figure (client receipts), but Ameer's own words decide any note text.
5. **«نص لأمير».** The file includes a suggested message for Ameer. This plan does not send it. Whether EA uses it is EA's call.

### (c3) The accountant on H-1 and the corrected reconciliation (r6)

Source: `/workspace/tmp/cost-start/ACCOUNTANT-H1-opinion.md` (sha256 `a849134acd5e3f2cc24d049d136bf0017d4fb01e7a281e1f604671be6511ef04`, 9 lines; header time 15:30 Asia/Baghdad). It is quoted in full in §2.6a. The two lines this section relies on, verbatim:

> نقد العقود (دفعات، سلف، مرتجع، مسترد) ينحسب ب«المصروف» بأي تاريخ، وفلتر 27/11 يبقى بس للمصادقات والخصومات.
>
> «المصروف» بالشاشة − مصروف الـ CSV = صافي نقد العقود بأي تاريخ (دفعات + سلف − مرتجع − مسترد)، مو من 27/11 وراح بس.

The reconciliation for the PR body and the monthly close is therefore: on-screen «المصروف» − CSV spent = net contract cash at any date (`payLabor` + `advanceLabor` − `returnAdvance` − `refundLabor`). «الكلفة الكلية» − CSV spent = approvals − deducts dated ≥ 2026-11-27, plus nothing else. The cash cancels because «الكلفة الكلية» = «المصروف» + «المستحق».

### (d) Phones still on v83 or v84, and a tab left open (L-2)

v83 (slice L) and v84 (comma fix) both ship `const CONTRACTOR_COST_START = null;`. The wording is not “open the app online once”. The Architect’s recommendation 3, quoted exactly:

> 3. **Q5, must every phone open online after the deploy: YES for every owner phone, and it must be a fresh load, not resuming the open app.**
>    - The sw fetch is network-first for every shell file (`sw.js:50-67`, `fetch(e.request, { cache: 'no-cache' })` at `:56`). So any **fresh online load** runs the v85 `accounts.js` at once. The new sw then installs with `skipWaiting`, claims and heals open windows (`sw.js:16`, `:34-48`).
>    - A tab or PWA left open since before the deploy keeps the null code in memory, because hash routing never reloads the page.
>    - An offline phone serves the cached v84 files until it loads online.
>    - Until then, that phone still shows «+ عقد مقاول», can save old contracts, and computes «المصروف» with null.
>    - Site or foreman phones are not affected by the constant: the old-contract path is owner-only (`render.js:163`) and the cost screens are owner screens. They do not need this step for correctness. A-3 is the risk on those phones, and that risk does not depend on the app version.
>    - So the deploy go should keep "no pending sends, nobody entering data, app closed". After the deploy, each owner closes the app fully, reopens it online, and checks that «مقاول» is visible before recording any contractor work.

Those `sw.js` lines were re-read at 66d35163: `skipWaiting` at `:16`; activate / `clients.claim` / `healWindows` at `:34-48`; fetch at `:50-67`, with `fetch(e.request, { cache: 'no-cache' })` at `:56`. `saveSubcontract` is owner-only at `render.js:163`. Checking that «مقاول» is visible uses the existing tab label; it is not a new UI string.

This is a deploy-go condition, restricted to **owner** phones. A site or foreman phone does not need this step for the constant (A-3 is a separate operating risk and does not depend on the app version). Leave v83/v84 null-behaviour tests in place so that mix stays described. The §2.5 guard cannot protect a v84 phone.

r4 addition: a v83/v84 phone still shows the legacy-only «المصروف» and neither new line. A refreshed v85 phone shows the cash basis and both lines. The owner refresh check in §5 step 8 covers this.

### (e) Contract cash dated before the start (rewritten in r6, H-1)

- Before the start, contract cash rows come only from «ملغى» (reclass advances, `accounts-reclass.js:406-425`, any day). Normal payment writes are blocked until the start day (`costOpen`).
- After r6 they count in «المصروف» at any date. That is correct when the original ledger entry was reversed by `rev_` (the «ملغى» flow writes it first). It is a double count when a ledger twin is still active.
- The rules don't check `txnDate >= start` (`firestore.rules:45-52`). Under r6 that no longer matters for cash.
- I can't count live rows (403). The one-time read-only pre-deploy check in §5 step 4a is the control the accountant recommended (15:30).

### (f) Double count when an old advance is entered again (r4, EA point 4)

Operating note for EA, Ameer and the accountant. It is English guidance, not a UI string:

- A pre-27/11 advance that is already a ledger entry is already inside legacy «المصروف».
- On «مقاول» it is settled **only** as a deduct from the first statement: a `deduct` plus its `approveDeduct`. The deduct lowers «المستحق» and «الكلفة الكلية» and adds nothing to «المصروف».
- It must **not** be recorded again as an advance (`advanceLabor`) on «مقاول» unless the old ledger entry was first marked «ملغى». Otherwise «المصروف» and «الكلفة الكلية» count it twice (T-C8 contrast case).
- An amount whose «انخصم» review already says it was deducted from a past payment (A-2) must not be deducted again on «مقاول» either.

### (g) Profit and home figures change on deploy (updated in r6)

- Home «إجمالي المصروف» / «صافي الربح» and the list «ربح/خسارة» move to the cash basis together with the project screen.
- Ameer decided at `:59`: profit = «المقبوض» − «الكلفة الكلية», on the project screen, the list and home (`:58`). Approved unpaid work therefore lowers profit straight away, and paying it later does not move profit.
- On home, «صافي الربح» no longer equals «إجمالي المقبوض» − «إجمالي المصروف» when something is owed, and there is no note on home (`:65`). Owners should be told once, at the deploy.

### (h) Larger PR before a midnight deploy (r4)

- The PR now changes cost meaning, adds a screen element, adds an export, and rewrites the k-equality and T-I14/T-I19 tests, on top of the date change.
- More review time is needed. Ameer allows the deploy on 27/11 **or later** (`:58`), so the deploy waits for review rather than splitting (one PR, Q-SPLIT closed).

## 5. Deploy runbook outline (not executed in this plan)

Deploy is **hosting only**, **on or after 2026-11-27 00:00 Asia/Baghdad**, after all of the following, in order:

1. Architect APPROVE of the draft PR at the exact head SHA, plus CI 4/4 on that SHA.
2. Ameer’s verbatim merge go naming that latest head SHA. Squash-merge with no `Co-authored-by` trailers. No `--no-verify`, no hook bypass, no amend, no force-push, no push to main except by the approved squash.
3. Wait until main CI on the new main SHA is 4/4. If any check fails, stop and report; deploy nothing.
4. Ameer’s separate deploy go, including that no phone has pending sends, nobody is entering data, and the app is closed. Deploy nothing without that verbatim go. **A-1/A-2/A-3 are answered (`:63`). The deploy go must also include the result of step 4a, using the method chosen at `:65`.**

4a. **One-time pre-deploy READ-ONLY check (accountant 15:30, H-1).**

- **The rule, verbatim from `/workspace/tmp/cost-start/ACCOUNTANT-H1-opinion.md` (sha256 `a849134acd5e3f2cc24d049d136bf0017d4fb01e7a281e1f604671be6511ef04`, 9 lines; header time 15:30 Asia/Baghdad):** «كل قيد نقدي بالعقود تاريخه قبل 27/11 لازم يكون جاي من «ملغى» وقيده الأصلي ملغى بالدفتر، أو ما إله أي قيد بالدفتر. أي واحد غير هيج يطلع سؤال لأمير قبل النشر.»
- **What to look for.** Every contract-cash row (`payLabor`, `advanceLabor`, `returnAdvance`, `refundLabor`) dated before 2026-11-27 must be either:
  - a «ملغى» advance whose original ledger entry is reversed (`rev_`), or
  - a row with no ledger entry at all.

  Any other row goes to Ameer as a question, and the deploy waits. On the 66d35163 code, the only app path that writes contract cash before the start is «ملغى» (§4(e)), so the expected result is "only «ملغى» rows".
- **Who runs it.** Ameer (owner) himself, on his phone, after the PR is merged and before the deploy go, while the phones are still on v84. EA guides him with a card. No bot runs it, and no bot uses Ameer's login. The box can't run it, because its Firebase service account gets **403** on Firestore reads. This plan proposes **no** IAM or permission change and nothing from `/home/box/secrets`.
- **Rules while it runs.** Read only, no writes, nobody entering data, no pending sends.
- **How: Ameer chose the phone cross-match, contractor by contractor** (`:65` «أفحص من التلفون مقاول مقاول», 15:52). This is the fallback in the Architect's r6 review (§5 of that review, items 1–4).
  - **The Firestore-console option is dropped as not chosen.**
  - r6's option 1 stays dropped, because its premise was false.
  - The CSV export is not part of the chosen method.
- **Limits, from the Architect's review:**
  - It matches by amount only and shows no dates, so it is workable only for a small number of rows.
  - Every phone screen reads only that phone's local cache. That is why "no pending sends on any phone" must hold first.
  - On v84, «ملغى» is the only app path that writes contract cash (§4(e)). So «الدفعات» should be empty, and «السلف» should hold only «ملغى» advances.
  - The «الحركات» cards show no purpose word, project or date (`public/accounts-view.js:430-439`), so a return or settle row would look like an advance. That is why the count and the amounts are matched one by one.
- **One reversed ledger row per advance (r9 review MEDIUM-1).** Two live «ملغى» advances for the same expense would both match one reversed ledger row. Both count (`rowCounts`), so cash would be counted twice, and the reclass state is `duplicate`. So the steps match one-to-one (step 10) and Ameer looks, without tapping, at «سلفة لم تُكتب بعد» for «سلفة مكررة» (step 3).
- **The movements tab has no write buttons.** Every registered account action uses `tab: 'contractor'`, for example `public/accounts-work.js:783`. The «الحركات» tab paints only filter pills and cards (`public/accounts-view.js:336`, `:403-444`). On v84 the «مقاول» tab is not shown.
- **The steps below are instructions for Ameer, sent by EA. They are not app strings and add nothing to the app.** Every quoted label was checked at 66d35163, with its file:line next to it.

#### خطوات الفحص لأمير (قراءة بس، مقاول مقاول)

**قبل ما تبدي**

1. بكل تلفون يدخّل بيانات، اضغط الجرس اللي فوق (`public/index.html:39`). تنفتح لوحة:
   - تحت «لم يُرسل بعد» لازم يكون الرقم 0 (`public/render.js:1322`).
   - لازم يكون مكتوب «متصل» (`public/render.js:1317`، `:1325`).
   - «آخر مزامنة» لازم يكون وقت قريب، مو قديم (`public/render.js:1324`).
   - **لا تضغط «إرسال الآن»** (`public/render.js:1329`). سد اللوحة بضغطة ثانية على الجرس (`public/render.js:1463`).
   - كلمة «لم يُرسل» على القيود تطلع بس بـ«آخر القيود» وبالحركات (`public/render.js:590`، `:779`، `public/accounts-view.js:435`)، فما تكفي. الجرس هو اللي يبين العدد الكامل.
   - وماكو أحد يدخّل بيانات هسه.
2. هذا الفحص قراءة بس. **لا تضغط أي زر يغيّر شي.** هاي الأزرار ممنوعة:
   - «انخصم» (`public/accounts-reclass.js:33`)
   - «ملغى» (`public/accounts-reclass.js:22`)
   - «سلفة» (`public/accounts-reclass.js:31`)
   - «عكس» (`public/accounts-reclass.js:32`، `public/render.js:594`)
   - «حفظ» (`public/accounts-reclass.js:30`)
   - «+ شخص جديد» (`public/accounts-view.js:296`)
   - «+ قيد جديد» (`public/render.js:681`)
   - «+ قيد لهذا المشروع» (`public/render.js:781`)
   - «إدارة المشروع» (`public/render.js:777`)
   - «استعادة» بالمشاريع المؤرشفة (`public/render.js:747`)
   - «حفظ قيمة العقد» بشاشة المشروع (`public/render.js:248`)
   - ولا تكتب أي شي بخانة «تعديل قيمة العقد» (`public/render.js:247`)
   - «+ مشروع جديد» بقائمة المشاريع (`public/render.js:758`)
   - «+ عقد مقاول» بشاشة المشروع (`public/render.js:104`)
   - وبشاشة «تفاصيل القيد» ما تحتاج «طباعة» ولا «حفظ PDF» ولا «حفظ كملف» (`public/render.js:853-855`).
3. القوائم اللي بآخر شاشة «حسابات»:
   - «قيود مصروف قد تكون سلفاً» (`public/accounts-reclass.js:21`): ما نحتاجها. لا تضغط بيها أي شي.
   - «سلفة لم تُكتب بعد» (`public/accounts-reclass.js:18`، `:599`): **باوع بيها بس، بدون ما تضغط أي زر أو تكتب بأي خانة.** إذا بيها كلمة «سلفة مكررة» (`public/accounts-reclass.js:19`، `:577`)، فهذا استثناء. اكتب شنو مكتوب بذاك السطر (المبلغ والاسم).
4. المسموح بس:
   - تفتح الشاشات.
   - تضغط الأزرار الصغيرة «كل» و«الدفعات» و«السلف».
   - تضغط أزرار المشاريع بـ«نظرة عامة»: «كل المشاريع» وأسماء المشاريع (`public/accounts-view.js:319`، `:359`).
   - تضغط «المؤرشفة» بقائمة المشاريع (`public/render.js:742`).
   - تضغط «المزيد».
   - تضغط «عرض قيد العكس».
   - تضغط «رجوع».

**لكل شخص بـ«حسابات الأشخاص»، واحد واحد**

5. افتح تبويب «حسابات» (`public/accounts-view.js:573`). تطلع «حسابات الأشخاص» (`public/accounts-view.js:305`). **مر على كل اسم بالقائمة، مو بس المقاولين**، لأن «ملغى» تقبل أي شخص. اضغط على الاسم (`public/accounts-view.js:291`).
   - اضغط «نظرة عامة» (`public/accounts-view.js:319`). فوق تطلع أزرار: «كل المشاريع» وأسماء مشاريع هذا الشخص (`public/accounts-view.js:359`). اكتب أسماء المشاريع.
   - تأكد «كل المشاريع» هو المختار قبل ما تكمل.
6. اضغط «الحركات» (`public/accounts-view.js:319`). فوق تطلع أزرار صغيرة: «كل» و«الدفعات» و«السلف» (`public/accounts-view.js:406-408`).
7. اضغط «الدفعات» (`public/accounts-view.js:407`).
   - **الصحيح:** تطلع «لا يوجد» (`public/accounts-view.js:442`).
   - إذا طلع أي سطر، فهذا استثناء. اكتب كم سطر وشكد مبلغ كل واحد.
8. اضغط «السلف» (`public/accounts-view.js:408`). كل سطر بيه كلمة حالة ومبلغ.
   - **الصحيح:** كل سطر مكتوب بيه «معتمد» (`public/accounts-view.js:250`).
   - إذا جنبه «غير مدقّق» (`public/accounts-view.js:434`) فهذا عادي، بس اكتبه.
   - إذا سطر مكتوب بيه «معكوس» أو «مرفوض» (`public/accounts-view.js:251-252`) أو «بانتظار الاعتماد» (`public/accounts-view.js:433`)، فهذا استثناء.
   - سطر **بدون أي كلمة**، وجنبه سطر «معكوس» بنفس المبلغ: هذا هو قيد العكس نفسه. اكتبه، بس هو مو استثناء. أي سطر بدون كلمة غير هيج، استثناء.
   - اكتب كم سطر، ومبلغ كل واحد.
9. لكل مبلغ سلفة:
   - افتح تبويب «المشاريع» (`public/index.html:57`)، وافتح كل مشروع من الأسماء اللي كتبتها بخطوة 5.
   - إذا المشروع مو بالقائمة، اضغط «المؤرشفة» (`public/render.js:742`) وافتحه من هناك. **لا تضغط «استعادة»** (`public/render.js:747`).
   - اضغط «عرض جميع القيود» (`public/render.js:780`). تطلع «كل القيود» وفوقها عدّاد «… من …» (`public/render.js:793`).
   - إذا موجود زر «المزيد» (`public/render.js:792`)، اضغطه لحد ما يصير الرقمين بالعدّاد نفس الشي.
10. دوّر على قيد بنفس المبلغ، ومكتوب جنبه «معكوس» (`public/ledger.js:654`). اسم الشخص يطلع بنفس السطر (`public/ledger.js:661`).
    - الاسم بالدفتر مكتوب باليد. إذا الاسم مختلف شوية عن اسم الشخص، اكتب الفرق. هذا بروحه مو استثناء.
    - **كل قيد «معكوس» يمشي لسلفة وحدة بس.** إذا سلفتين بنفس المبلغ وماكو غير قيد «معكوس» واحد، فوحدة منهن استثناء.
    - اضغط عليه. تنفتح «تفاصيل القيد» (`public/render.js:985`).
    - لازم يطلع سطر «قيد العكس». اضغط «عرض قيد العكس» (`public/render.js:839`).
    - بالقيد اللي ينفتح، اقرا «الوصف» (`public/render.js:847`). **لازم يبدي بـ «L:».** هاي العلامة تكتبها «ملغى» بالوصف (`public/accounts-reclass.js:59-60`، `:389`).
    - ارجع بـ «رجوع» (`public/render.js:826`).
11. **الصحيح لهذا الشخص:**
    - «الدفعات» فارغة.
    - كل سلفة بـ«السلف» إلها قيد خاص بيها، بنفس المبلغ، مكتوب جنبه «معكوس»، ومو مشترك ويا سلفة ثانية.
    - قيد العكس مالته «الوصف» يبدي بـ «L:».

    أي سلفة ما إلها هيج قيد، هي استثناء. الإرجاع أو التسوية يطلع بالضبط مثل السلفة، فإذا ما لكيتله قيد، اكتبه استثناء عادي.

    قبل ما تروح للشخص اللي بعده، ارجع لـ«نظرة عامة» واضغط «كل المشاريع» (`public/accounts-view.js:359`)، لأن اختيار المشروع يبقى للشخص اللي بعده.

**شنو ترسل لـ EA**

12. لكل شخص:
    - اسمه، وأسماء مشاريعه.
    - كم سطر بـ«الدفعات» (المفروض صفر).
    - كم سطر بـ«السلف»، ومبلغ كل واحد.
    - كم سلفة منها لكيت إلها قيد «معكوس» خاص بيها ووصف قيد العكس مالها يبدي بـ «L:».
    - أي سطر بدون كلمة، وأي فرق بالاسم.
    - أي استثناء: المبلغ، وشنو الناقص.
13. بالأخير، المجموع لكل الأشخاص: كم سلفة لكيت، كم وحدة صحيحة، وكم استثناء. وقول إذا لكيت «سلفة مكررة» بخطوة 3، وشنو مكتوب بيها.
14. إذا طلع أي استثناء، **لا تصلّح شي ولا تضغط أي زر.** بس بلّغ EA، ويصير سؤال قبل النشر.

#### End of the Arabic steps

- **Result format.** EA records Ameer's report from steps 12–13 verbatim: each person's projects, counts and amounts, the totals, any «سلفة مكررة» row, and any exceptions. Any exception becomes a question for Ameer before the deploy. No data is edited as part of this check.

5. Read-only: record the live hosting version (expected `e72bb887a2e0206d`, sw `aj-p0-v84`) and save it under `/workspace/backups/`. If it is not that version, stop and report.
6. In a clean checkout of exactly the new main SHA, confirm `public/sw.js` says `aj-p0-v85`, `public/accounts.js` says `const CONTRACTOR_COST_START = '2026-11-27';`, and `public/render.js` contains N1–N4 and no longer contains «الربح = المقبوض − المصروف». Then run only `firebase deploy --only hosting --project ahl-aljazeera-accounting`. No rules, no indexes, no functions. Use `npx -y firebase-tools@15.34.2`. Do not put that command inside a file-writing command. Do not print `/home/box/secrets`.
7. Wait 2 minutes. Report the new hosting version/release, and confirm `sw.js` is `aj-p0-v85` on both `web.app` and `firebaseapp.com`.
8. After the deploy, each **owner** closes the app fully, reopens it online (a fresh load, not resuming a tab or PWA left open), and checks two things before recording any contractor work: «مقاول» is visible, and one project screen shows «المستحق للمقاولين» (or «سلف زايدة على المقاولين»), «الكلفة الكلية» and the N3 note.

**Rollback (L-4)** only if EA says so: hosting only, back to `e72bb887a2e0206d` (v84, null date). Do **not** use `c15f6301` (or `c15f63011788147f`). That is the pre-comma-fix (v83) target and would also undo PR #114. Do not roll rules (rules are not changed).

If a rollback happens after writes on or after 27 Nov: the approvals and contract cash stay in Firestore, but the v84 build ignores them in «المصروف» (cost looks lower), drops the two r4 lines, and shows «+ عقد مقاول» again. While rolled back, owners must not use the old contract path. A later fix-forward needs sw **v86**.

## 6. Gates

1. This plan (r4).
2. Architect CONFIRMED of this (or a later) revision. Ameer's answers are all in: Q-PROFIT, Q-HOME (profit basis), Q-NEG and Q-SPLIT (`:58`, `:59`; note text `:61`); HOME-NOTE and the step 4a method (`:65`). A-1/A-2/A-3 are deploy-go conditions and are **met** (`:63`). A-1 part (ii), the CSV reconciliation, is closed as the accountant's advice (§8). No question for Ameer is open.
3. Ameer’s verbatim code-start go.
4. One Cursor cloud agent only, model grok-4.7, draft PR against main, hosting only, sw v85. Scope: `CONTRACTOR_COST_START = '2026-11-27'`, the `saveSubcontract` guard, the cash-basis `projectCost`, the new `projectDue`, and the two owner lines (§2.5–§2.7), and nothing else (one PR, Ameer `:58`), plus the H-1 date rule, the profit basis on three screens, N3 and N4. No merge and no deploy by that agent.
5. Architect APPROVE of the exact head SHA, with the box re-runs, plus CI 4/4.
6. Merge only with Ameer’s verbatim approval naming the latest head SHA. Then main CI 4/4.
7. Ameer’s separate deploy go (A-1/A-2/A-3 met at `:63`; with the step 4a result), then the runbook in §5, on or after 2026-11-27 00:00 Asia/Baghdad.

## 7. PR body and pstack inventory (L-5)

The draft PR body must contain:

- `:51`, `:52`, `:53`, `:55`, `:56`, `:58` and `:59` quoted verbatim, labelled EA-relayed (`:58`'s profit answer marked as superseded by `:59`);
- the accountant’s quote (M-2): the same four points and source line as §4(c), pasted unchanged, followed by the r4 note that `:56` replaces point ١’s approval basis with the cash basis, then the accountant’s cash-basis opinion of 14:53 (§4(c2)), his 15:16 recommendations (§8) and his 15:30 H-1 confirmation (§2.6a), each pasted unchanged with its source line;
- scope: hosting only, rules untouched, CSV untouched; owner «المصروف» on the cash basis with contract cash at any date (H-1); profit = «المقبوض» − «الكلفة الكلية» on three screens; new Arabic strings N1–N4 only, as listed in §2.7 with their approvals;
- the mutation table, including the carried `100000000` row (`qty-days-cap-off-by-one`) and the M-1 mutants (`SHIPPED` / `'2026-11-26'` / `'2026-11-28'`), plus `drop-saveSubcontract-guard`, plus the r4 mutants in §3.6 (`readd-approveLabor-to-cost`, `drop-deduct-from-due`, `deduct-counts-unapproved`, `drop-date-filter-cash`, `drop-date-filter-due`, `returns-add`, `show-lines-to-non-owner`, `total-is-cost-only`), the r6 mutants (`cash-date-filter-restored`, `reclass-adv-double`, the eight M-1 guard mutants, `neg-label-missing`, `total-uses-abs`, `home-profit-cash`, `note-old`, `profit-basis-swap`), and the §5 step 4a check result;
- do not merge, do not deploy.

The code PR appends a new section to `docs/PSTACK_INVENTORY.md` after `## Quantity comma refuse`. Status words on existing rows stay. Historical rows that say `CONTRACTOR_COST_START` “stays null” stay as history of those earlier PRs. The new section states the date `'2026-11-27'`, the cash-basis «المصروف», the two owner lines, sw v85, hosting only, that the verify drives were updated, and that the earlier “stays null” rows are history. Proposed shape (the agent reads the file again at the PR base):

```
## Contractor cost start 2026-11-27 and cash-basis cost

Statuses above stay as they are. This file does not say the app is pstack-compliant. `arena` stays banned. The scope is hosting only. `firestore.rules` is not edited. `CONTRACTOR_COST_START` is `'2026-11-27'`. Owner «المصروف» is legacy spent plus contract cash at any date. Approvals and deducts from the start date feed «المستحق للمقاولين»; «الكلفة الكلية» is «المصروف» plus «المستحق للمقاولين». Profit on the project screen, the projects list and home is «المقبوض» minus «الكلفة الكلية». The project screen note is «الربح = المقبوض − الكلفة الكلية (المصروف + المستحق للمقاولين)». A negative «المستحق للمقاولين» shows as «سلف زايدة على المقاولين» with a positive amount. No note on home (`:65`). CSV output stays plain. The earlier rows in this file that say the constant stays null are history of those pull requests. The verify drives were updated to restore to, and compare against, the shipped source value. Do not merge. Do not deploy.

| Skill          | This pull request |
| -------------- | ----------------- |
| `feature`      | `public/accounts.js` sets `CONTRACTOR_COST_START` to `'2026-11-27'`. `saveSubcontract` returns when `contractorCostDated()` is true. `projectCost` counts contract cash at any date, not approvals. New `projectDue`. `public/render.js` adds two owner-only lines. Service worker `aj-p0-v85`. Proof is the SHIPPED pin, the before/on/after tests, the forced `#save-sub` test, the T-C1..T-C10 tests, and the carried `100000000` qty/days row in `tests/accounts-work.test.js`. |
| `opening-a-pr` | One draft pull request against `main`. The body has the file list, the commands, the pass counts, and the scope limits. It waits for Ameer. It does not merge and it does not deploy. |
```

## 8. Needs Ameer (behaviour or rule questions; no code in this PR)

These three items are from the r1 review. They are operating or rule questions, not code in this slice. The accountant’s opinions (§4(c) points ٢ to ٤; 15:16 on A-1 and A-2, below) bear on them, as advice only. **A-1, A-2 and A-3 are deploy-go conditions, not code-start conditions (L-2). r8: Ameer answered all three at `:63`; the conditions are met, A-1 part (ii), the CSV reconciliation, is closed as the accountant's advice (below).**

**Ameer’s answers to A-1, A-2, A-3 (verbatim, EA-relayed), from `/workspace/tmp/slice-l-plan/AMEER-answers-L.md` (sha256 `256f283c4788ba0bca01c486cd63f4f1c85b414e0ae8d0b8cddea0628ef656a1`, 65 lines, file time 15:52 Asia/Baghdad; its first 63 lines hash to `42f627db62317963e2ef6249880828aaa206f5b376c6e554c2353dad3a72fc29`, the 63-line version EA named), line `:63`:**

```
- 2026-11-26 15:51 Baghdad (card t2300s8166 «النقاط الثلاث قبل النشر»): A-1 «موافق: أول ذرعة تحسب شغل من 27/11 وراح بس» | A-2 «عباس 150,000 والسائق 25,000 صحيحين» | A-3 «موافق على الحل المؤقت لتلفون الفورمن» (`:63`)
```

- A-1: «موافق: أول ذرعة تحسب شغل من 27/11 وراح بس»
- A-2: «عباس 150,000 والسائق 25,000 صحيحين»
- A-3: «موافق على الحل المؤقت لتلفون الفورمن»

**Deploy-go conditions (L-2): A-1 MET, A-2 MET, A-3 MET** (Ameer `:63`, 15:51). A-1's answer covers part (i). Part (ii) is closed as the accountant's advice; see the note under the table.

**Each answer checked against its question as written in this plan (no reinterpretation):**

| Item | What the question asks (§8 below) | Ameer's answer | Match? |
|---|---|---|---|
| A-1 | (i) the operating instruction "the first measurement on «مقاول» covers only work from 27 Nov, and earlier work stays in the old system" (last bullet of A-1); (ii) since r6, "the answer to A-1 should cover this [CSV] difference": on-screen «المصروف» − CSV spent = net contract cash at any date. | «موافق: أول ذرعة تحسب شغل من 27/11 وراح بس» | **Part (i): yes.** Part (ii) was not on the card (EA, 15:59), so it is closed as the accountant's advice, not as Ameer's words (note below). |
| A-2 | Confirm the meaning of the «انخصم» rows: each was already deducted from a past payment (wages for finished work), so «انخصم» was right. Since r6, narrowed to "the two rows that rest on his word only (Abbas 150,000 and the driver 25,000)". Diya 300,000 and the blacksmith 150,000 are backed by the sheet (accountant 12:41 point ٣). | «عباس 150,000 والسائق 25,000 صحيحين» | **Yes**, for the narrowed question: the same two rows and amounts. «صحيحين» is taken as written, "correct"; the plan does not add a meaning beyond the question it answers. |
| A-3 | Accept for now that a foreman or site phone can still record a ledger labour expense for a contracted contractor (a double cost), with the monthly-close check as the only control, and a code block later as a separate change. | «موافق على الحل المؤقت لتلفون الفورمن» | **Yes.** "The interim solution for the foreman phone" is the monthly-close control described in A-3. |

**A-1 part (ii), the CSV reconciliation: CLOSED in r9 as the accountant's advice, not as Ameer's words.** EA relays (15:59) that card t2300s8166 showed only part (i): the first measurement from 27/11, with old paid work deducted. So Ameer's `:63` A-1 answer covers part (i) only. Part (ii) is recorded from `/workspace/tmp/cost-start/ACCOUNTANT-H1-opinion.md` (sha256 `a849134acd5e3f2cc24d049d136bf0017d4fb01e7a281e1f604671be6511ef04`, header time 15:30 Asia/Baghdad), verbatim: ««المصروف» بالشاشة − مصروف الـ CSV = صافي نقد العقود بأي تاريخ (دفعات + سلف − مرتجع − مسترد)، مو من 27/11 وراح بس.» It follows from Ameer's 14:57 cash-basis decision (`:56` «إي، المصروف بالمدفوع فعلاً، وضيف المستحق للمقاولين والكلفة الكلية لشاشة المشروع»). Ameer does not need to be asked (EA's decision).

**A-1. Which date puts contract work into the figures, and the CSV difference (wording updated in r4).**
- In r3, `projectCost` added an approval when its `txnDate` (the day of approval, `accounts-work.js:419`) was ≥ 2026-11-27.
- After r4, approvals are not in «المصروف». They feed «المستحق للمقاولين» and «الكلفة الكلية», by approval date. «المصروف» takes contract cash by payment date (`accounts-payment.js:396`).
- The approved rule says «القيود اللي قبل التاريخ تبقى مثل ما هي، والعقد يحسب شغل ما بعد التاريخ بس».
- **Pre-27 work in the first measurement.** A first measurement on 27 Nov or later that includes work done before 27 Nov inflates «المستحق» and «الكلفة الكلية». If that work was already paid as ledger «عمالة/سلفة», «الكلفة الكلية» counts it twice, and «المصروف» does too once the contractor is paid for it again on «مقاول».
- **The fix is operational.** The accountant's point ٢ says to subtract what was paid before. A deduct on the statement does that and lowers both lines (§2.7).
- **The CSV difference (corrected in r6).** On-screen «المصروف» − CSV spent = **net contract cash at any date** (`payLabor` + `advanceLabor` − `returnAdvance` − `refundLabor`). Source: the accountant's 15:30 correction, `/workspace/tmp/cost-start/ACCOUNTANT-H1-opinion.md` (sha256 `a849134acd5e3f2cc24d049d136bf0017d4fb01e7a281e1f604671be6511ef04`, 9 lines; header time 15:30 Asia/Baghdad): ««المصروف» بالشاشة − مصروف الـ CSV = صافي نقد العقود بأي تاريخ (دفعات + سلف − مرتجع − مسترد)، مو من 27/11 وراح بس.» r4/r5 said cash dated ≥ 27/11; that is superseded. r9: this part is the accountant's advice (15:30), following from Ameer's `:56`; Ameer's `:63` covers part (i) only (EA, 15:59). Tests T-C3 and T-C11, the mutant `cash-date-filter-restored`, and risk (e) follow this rule.
- **Accountant 15:16 on A-1 (advice), verbatim from `/workspace/tmp/cost-start/ACCOUNTANT-r4-questions-opinion.md` (sha256 `0631059f3de72e7e03bbd4f2175ba54043031a91825ab9d78f8f85d7d0cdc8a8`, 13 lines; header time 15:16 Asia/Baghdad):**

> A-1: الصياغة صحيحة محاسبياً.
> - الفرق مع الـ CSV = النقد اللي اندفع بالعقود من 27/11، بشرط ما تنسجّل دفعة المقاول بالدفتر كمان.
> - الخصم ينزّل «المستحق» و«الكلفة الكلية»، مو «المصروف»، وهذا صحيح.
> - ملاحظة وحدة تنضاف: إذا المقاول فعلاً اندفعله مرتين عن نفس الشغل، الخصم ما يصلح «المصروف»، لأن الفلوس طلعت فعلاً. هاي زيادة تنسترد من المقاول، وتبين مستحق سالب عليه لحد ما تنسترد. لهذا أول ذرعة لازم تغطي شغل 27/11 وراح بس.
> - A-2 بالخطة صحيح هم: السلفة المفتوحة قبل 27 تنخصم من أول مستخلص وتنحسب مرة وحدة. واللي انضغط عليه «انخصم» ما ينخصم مرة ثانية.

- Ameer and the accountant should confirm the operating instruction: the first measurement on «مقاول» covers only work from 27 Nov, and earlier work stays in the old system.
- **r9 status:** Ameer accepted the operating instruction at `:63` «موافق: أول ذرعة تحسب شغل من 27/11 وراح بس». The card showed part (i) only: the first measurement from 27/11, with old paid work deducted (EA, 15:59). The CSV reconciliation is the accountant's advice (`/workspace/tmp/cost-start/ACCOUNTANT-H1-opinion.md` (sha256 `a849134acd5e3f2cc24d049d136bf0017d4fb01e7a281e1f604671be6511ef04`, header time 15:30 Asia/Baghdad)), following from `:56`. Closed.

**A-2. The four «انخصم» rows (625,000 IQD total).**
- «انخصم» keeps the row in legacy spent. It writes only a `laborReviews` marker (`lrv_…`, decision `deducted`). Rules forbid updating or deleting it, and it cannot be switched to «ملغى» afterwards.
- That is correct only if each amount was **already deducted from a past payment**.
- If any of them is an open advance that the rule says should "move to the contract and be deducted from the first statement" (rule bullet 2), it needed «ملغى». Otherwise its amount is counted twice: once in legacy spent, and again inside the gross approval it is deducted from.
- Ameer should confirm the meaning for these four rows before the 27th. The press is EA-relayed (`:52`) and live reads still return 403 (`COUNT-open-rows.md`).
- r4 adds two cases:
  - **A real open pre-27 advance.** Now that deducts lower «المستحق» and «الكلفة الكلية», it can be deducted from the first «مقاول» statement without «ملغى». Its cash stays in legacy «المصروف», counted once (risk (f), T-C8).
  - **An amount already deducted from a past payment** (what «انخصم» records). It must not be deducted again.

- r6: the accountant (15:16, last line above) confirms the A-2 handling: deducted once from the first statement, and rows already marked «انخصم» are not deducted again. Ameer still has to confirm the two rows that rest on his word only (Abbas 150,000 and the driver 25,000; 12:41 point ٣).
- **r8 status:** confirmed by Ameer, `:63` «عباس 150,000 والسائق 25,000 صحيحين». Condition met.

**A-3. Foreman custody payments to a contracted contractor.**
- The rule says these go through the contract "even if paid from the foreman's custody".
- In code, contract payments are owner-only («مقاول» writes). A foreman or site phone can still record a ledger labour expense for that contractor, on any app version, and it counts in legacy spent.
- Nothing in the code prevents that double cost. The monthly-close check in the rule is the only control.
- Ameer and the accountant should confirm this is accepted for now. Adding a block in code would be a separate behaviour change.
- **r8 status:** accepted by Ameer, `:63` «موافق على الحل المؤقت لتلفون الفورمن». Condition met. The monthly close stays the only control; a code block would still be a separate change.

### Questions from r4 and r5: closed in r6

**Accountant recommendations, 15:16 (advice only), verbatim from `/workspace/tmp/cost-start/ACCOUNTANT-r4-questions-opinion.md` (sha256 `0631059f3de72e7e03bbd4f2175ba54043031a91825ab9d78f8f85d7d0cdc8a8`, 13 lines; header time 15:16 Asia/Baghdad):**

> Q-PROFIT: أوصي بـB: «الربح» = «المقبوض» − «الكلفة الكلية». السبب: الربح لازم ما يتغير بس لأن دفعة المقاول تأخرت، والمستحق كلفة حقيقية بذمة أمير. الملاحظة تحت الربح: «الربح = المقبوض − الكلفة الكلية (المصروف + المستحق للمقاولين)».
>
> Q-HOME: نعم. «إجمالي المصروف» بالرئيسية والقائمة يصير بالمدفوع فعلاً، بدون أسطر جديدة. بس «صافي الربح» و«ربح/خسارة» لازم يمشون على نفس أساس Q-PROFIT، حتى ربح المشروع يطلع نفس الرقم بكل الشاشات. وهذا يعني بالرئيسية الربح ما يساوي «المقبوض − إجمالي المصروف» المعروض إذا كو مستحق، وهذا متوقع وينشرح بالملاحظة.
>
> Q-NEG: السالب ينطرح من الكلفة الكلية، وهذا صحيح. السلفة الزايدة على الشغل مو كلفة، هي فلوس بذمة المقاول، والمعادلة (الكلفة الكلية = الدفتر + المعتمد − الخصومات) تسويها تلقائياً. للعرض أوصي بكلمة مو بإشارة سالب بس، لأن السالب سهل ينغلط بقرايته بالتلفون. مثلاً «سلف زايدة على المقاولين» بمكان «المستحق للمقاولين»، والرقم موجب. هذا نص جديد ويحتاج موافقة أمير، وإذا ما وافق السالب مقبول.
>
> A-1: الصياغة صحيحة محاسبياً.
> - الفرق مع الـ CSV = النقد اللي اندفع بالعقود من 27/11، بشرط ما تنسجّل دفعة المقاول بالدفتر كمان.
> - الخصم ينزّل «المستحق» و«الكلفة الكلية»، مو «المصروف»، وهذا صحيح.
> - ملاحظة وحدة تنضاف: إذا المقاول فعلاً اندفعله مرتين عن نفس الشغل، الخصم ما يصلح «المصروف»، لأن الفلوس طلعت فعلاً. هاي زيادة تنسترد من المقاول، وتبين مستحق سالب عليه لحد ما تنسترد. لهذا أول ذرعة لازم تغطي شغل 27/11 وراح بس.
> - A-2 بالخطة صحيح هم: السلفة المفتوحة قبل 27 تنخصم من أول مستخلص وتنحسب مرة وحدة. واللي انضغط عليه «انخصم» ما ينخصم مرة ثانية.

**Ameer's answers:** `AMEER-answers-L.md:58` (15:31) and `:59` (15:32), quoted in §1.2.

| Q | Status | Ameer (verbatim, file:line) | Accountant 15:16 (verbatim) | What the plan does |
|---|---|---|---|---|
| Q-PROFIT | **CLOSED** | `:59` «الربح = المقبوض − الكلفة الكلية، ويا ملاحظة الربح بالحرف». It supersedes `:58` «الربح = المقبوض − المصروف المدفوع» (history). Note: `:58` «موافق على ملاحظة الربح بالحرف»; the card text is in EA's `:61`. | «أوصي بـB: «الربح» = «المقبوض» − «الكلفة الكلية».» | Profit = received − «الكلفة الكلية»; N3 replaces the note at `render.js:771` (§2.7, T-C12). The N3 text is confirmed by `:61`. |
| Q-HOME (profit basis) | **CLOSED** | `:58` «نفس الأساس بالرئيسية وقائمة المشاريع» | Q-HOME line above | Home and list profit = received − Σ «الكلفة الكلية»; «إجمالي المصروف» stays cash; no new lines; no note on home (`:65` «ملاحظة الربح بشاشة المشروع بس»). |
| Q-NEG | **CLOSED** | `:58` «"سلف زايدة على المقاولين" برقم موجب» | Q-NEG line above | When due < 0: N4 label and `Math.abs(due)`; «الكلفة الكلية» stays `spent + due` (signed) (§2.7, T-C9). |
| Q-SPLIT | **CLOSED** | `:58` «تحديث واحد، يننشر يوم 27 أو بعده» | — | One PR, sw v85, deploy on or after 2026-11-27 00:00 Asia/Baghdad. |
| Q-LABEL | **CLOSED, not asked** | — | (14:53 used «المصروف الفعلي») | Keep «المصروف», per the Architect's r5 recommendation and `:56`'s wording. No rename, no string. |

The earlier option texts (A/B/C, the split options) are in r5 §8. They are not repeated here.

**HOME-NOTE (new in r7). CLOSED in r9.** Ameer, `/workspace/tmp/slice-l-plan/AMEER-answers-L.md` (sha256 `256f283c4788ba0bca01c486cd63f4f1c85b414e0ae8d0b8cddea0628ef656a1`, 65 lines), line `:65`, verbatim:

```
- 2026-11-26 15:52 Baghdad (card t2302s8173 «سؤالين قبل الكود»): home note «ملاحظة الربح بشاشة المشروع بس» | pre-deploy check «أفحص من التلفون مقاول مقاول» (`:65`)
```

- **Answer:** «ملاحظة الربح بشاشة المشروع بس».
- **What the plan does.** The N3 note goes on the project screen only (`render.js:771`). Home and the projects list keep the profit basis «المقبوض − الكلفة الكلية» (`:58`), with no note.
- **Removed:** variant H-NOTE, its test T-C12h and its mutant `home-note-missing`.
- **Kept:** T-C12n and `home-note-present`, which check that home does **not** render the note.

**Pre-deploy check method. CLOSED in r9.** Same line `:65`: «أفحص من التلفون مقاول مقاول». This is the phone cross-match, written out as Arabic steps in §5 step 4a. The console option is dropped as not chosen.

**Q-ACC.** ANSWERED in r5. The accountant's cash-basis opinion of 14:53 is on file, `/workspace/tmp/cost-start/ACCOUNTANT-cash-basis-opinion.md` (sha256 `3e36c1df15f56f13e8c140a1190cccb0d16d3be2ee83b5c627025329e1c33108`, 15 lines), quoted verbatim in §4(c2). It covers the cash basis (point 2), the «المستحق» formula with deducts (point 3), and pre-27 advances (point 2, third bullet). This satisfies `AGENTS.md:12` for this plan. (r4 had asked for it because no accountant text was on the box then.)

Q-LABEL: closed in r6 (table above).

r1 Q1 (hard-gate `saveSubcontract`) is closed: yes, in this PR (§2.5, §3.7). r1 Q4 (phone clock) is closed: the operational note is enough; no code or rules mitigation (§4(a)). r1 Q5 is closed as a deploy-go condition for owner phones, worded as in §4(d). r1 Q3 is waiting on the M-2 quote, not on a product decision to tell the accountant.

Not asked as new product questions, because they are already decided: the start date is `2026-11-27`; one PR, hosting only, deploy on or after 2026-11-27 00:00 Asia/Baghdad (`:58`); the one-system-per-contractor rule is operating only, with no code in this PR; no new Arabic strings other than N1–N4 (§2.7); no CSV change; owner «المصروف» is cash paid (`:56`), at any date (H-1, accountant advice); profit = «المقبوض» − «الكلفة الكلية» on three screens (`:59`, `:58`); no `firestore.rules` change; rollback is `e72bb887a2e0206d`, not `c15f6301`; fix-forward after a rollback is v86.

## 9. Changes since r1

| Note | Where r2 changes r1 |
|---|---|
| M-1 | §3.2, §3.5, §3.6: capture `SHIPPED` at module load; drive UI tests with `withStart(SHIPPED)` and stubbed `today()`; use `projectCost(..., SHIPPED)` for the 26/27/28 trio; dated browser phase reads the shipped string and forces a past start for the 7-tab check. The `'2026-11-26'` / `'2026-11-28'` mutants now go red in behaviour tests, not only in the regex. |
| M-2 | §4(c) and §7: `AGENTS.md:12` accountant quote is a marked placeholder, `[[M-2 ACCOUNTANT QUOTE PENDING — EA will supply exact text]]`. The quote is not invented or paraphrased. |
| L-1 | §2.5 and §3.7: `if (contractorCostDated()) return;` is required in this PR, first statement in `saveSubcontract`, before `button.disabled = true`. Forced `#save-sub` test; mutant `drop-saveSubcontract-guard`. r1 Q1 is closed. |
| L-2 | §4(d) and §5 step 8: recommendation 3 is quoted exactly. Deploy-go wording is “close the app fully and open it fresh while online”, owner phones only, then check that «مقاول» is visible. No new UI string. r1 Q5 is closed. |
| L-3 | §3.4: verify-drive restore / `left !== null` paths (`accounts-work.js:271-277` and `:378-386`, `accounts-payment.js:551-559`, `accounts-statement.js:330`, `accounts-correct.js:419`) restore to and compare against the shipped source value, not `null`. |
| L-4 | §5: rollback target is only `e72bb887a2e0206d`, not `c15f6301` (that would also undo #114). After 27 Nov writes, a rollback leaves approvals in Firestore but hides them from «المصروف» and brings «+ عقد مقاول» back; owners must not use the old path; fix-forward is v86. |
| L-5 | New §7: required PR-body contents, and the new `docs/PSTACK_INVENTORY.md` section (date, v85, hosting only, drives updated, earlier “stays null” rows are history). |
| A-1, A-2, A-3 | New §8: kept as Needs Ameer, not as code in this PR. r1 Q2 is A-2; r1 Q4 is closed in §4(a). |

## 10. Changes since r2

| Item | Change |
| --- | --- |
| M-2 | §4(c) now holds the accountant’s four numbered points verbatim from `ACCOUNTANT-date-pr-opinion.md` (sha256 `e3205e5e…7bcd`); §7 points the PR body at the same text. The §9 row above is r1-to-r2 history. |
| A-1, A-2, A-3 | §8 gets a marked placeholder for Ameer’s verbatim answers. No other change. |

## 11. Changes since r3

| Item | Change |
|---|---|
| Source | (r4 history; r5 corrects the accountant part, see §12.) §1.1 adds `:55` (Ameer, 14:53, t2291u) and `:56` (Ameer, 14:57, card t2294s8131), both verbatim. `:56` matched by `rg -F` at `AMEER-answers-L.md:56`. `AMEER-answers-L.md` re-hashed: `33e3382f…df17`, 56 lines. No accountant text after 12:41 found (Q-ACC). |
| Title | r3 still said “PLAN r2” in its title and in §6 gate 1. Both now say r4. |
| §2.2 | sw stays v85 for one PR. If split, the second PR is v86. |
| §2.3 | “No new Arabic strings” becomes “only N1 and N2”. A Q-PROFIT option B note would be a third string, not approved. |
| §2.4 | The `ownerSpent` row is updated to the cash basis, and all three callers are listed (`render.js:674`, `:753`, `:768`). |
| §2.6 (new) | `projectCost` (`accounts.js:1043-1053`, comment `:1025-1042`, `:1034` “A deduct does not reduce the sum”) moves from `approveLabor` to cash: `payLabor + advanceLabor − returnAdvance − refundLabor`, with `txnDate >= start`, `rowCounts`, project and IQD filters. Private `projectContract` helper. |
| §2.7 (new) | New export `projectDue` (same expression as `net`, `accounts.js:865`, scoped to the project and the start). Two owner-only rows in `render.js:767-772`: N1 «المستحق للمقاولين» and N2 «الكلفة الكلية» = «المصروف» + «المستحق». A counted deduct lowers both. |
| §3.2, §3.4 | The `projectCost` date trio uses a cash row. The k-equality block (`tests/accounts.test.js:271-356`), T-I14 `:676` and T-I19 `:796` (`tests/accounts-correct.test.js`) must be rewritten. `:281` is green only by accident. |
| §3.6 | Eight new mutants, plus `profit-basis-swap` after Ameer answers. |
| §3.8 (new) | T-C1..T-C10: approvals not in «المصروف»; cash add and subtract; pre-start rows excluded; a deduct lowers «المستحق» and the total; the identity; guards; owner-only visibility; pre-27 advance by deduct (with the double-count contrast); negative due; SHIPPED wiring. |
| §4(c) | The CSV difference is now cash. The accountant's four points are kept verbatim as history, plus a note that `:56` replaces point ١'s approval basis. |
| §4(d)–(h) | v84 phones show neither line. New risks: (e) cash before the start, (f) double count when an old advance is entered again (operating note), (g) profit and home figures, (h) a larger PR before midnight. |
| §5, §6, §7 | The runbook checks N1/N2 in the build and on an owner phone. Gates add Q-PROFIT/Q-SPLIT answers before code-start. Scope line widened. The PR body and PSTACK section mention the cash basis, N1/N2 and the new mutants. |
| §8 | A-1 reworded for the cash basis and the new CSV difference. A-2 gains the deduct-path note. The A-1/A-2/A-3 placeholder is unchanged. New questions: Q-PROFIT, Q-HOME, Q-NEG, Q-SPLIT, Q-ACC. |
| Unchanged | `CONTRACTOR_COST_START = '2026-11-27'`; the `saveSubcontract` guard; the `QTY_ACCEPTED` 100000000 row; hosting only; rules and CSV untouched; deploy on 2026-11-27 after 00:00 Asia/Baghdad; rollback `e72bb887a2e0206d`, not `c15f6301`; fix-forward v86; one grok-4.7 cloud agent after Architect CONFIRMED and Ameer's code-start. |

## 12. Changes since r4

| Item | Change |
|---|---|
| Header | Title says r5. New r5 source bullet: r4 sha `d378ca06…a049` (597 lines, unchanged) and the accountant file `/workspace/tmp/cost-start/ACCOUNTANT-cash-basis-opinion.md` (sha256 `3e36c1df15f56f13e8c140a1190cccb0d16d3be2ee83b5c627025329e1c33108`, 15 lines). |
| §1.1 attribution | Fixed. `AMEER-answers-L.md:55` (14:53, `t2291u`) stays Ameer's own message, as the record says. The accountant's cash-basis opinion is a separate message also timed 14:53, in `ACCOUNTANT-cash-basis-opinion.md` (written on the box at 15:14 Asia/Baghdad, after r4). r4's "no accountant text found" / "EA's description only" bullets are replaced by a correction note. |
| §4(c) | The "no accountant opinion on the cash basis yet" bullet now points to §4(c2). |
| §4(c2) (new) | The accountant's 14:53 opinion, lines 3–15, pasted verbatim with path and sha. Line-by-line match to §2.6, §2.7, risk (f), T-C8 and A-3. Five flagged differences: the label «المصروف الفعلي»; same basis as the CSV but not the same number; return/refund dates not named; «الدفعات من العميل» vs «المقبوض»; the «نص لأمير» draft is not sent by this plan. |
| §7 | The PR body also quotes §4(c2) with its source line. |
| §8 Q-PROFIT | Still OPEN for Ameer. Adds the accountant's verbatim line «والربح الحقيقي = الدفعات من العميل − الكلفة الكلية» (option B, advice only). |
| §8 Q-HOME, Q-NEG | Still OPEN; EA is asking the accountant for a recommendation. |
| §8 Q-ACC | ANSWERED by the accountant file; satisfies `AGENTS.md:12`. |
| §8 Q-LABEL (new) | Whether to rename «المصروف» to the accountant's «المصروف الفعلي» (would be a new string). |
| Unchanged | All formulas (§2.6, §2.7), tests T-C1..T-C10, mutants, risks (a)–(h), runbook, gates, sw v85, rollback `e72bb887a2e0206d`, fix-forward v86, deploy on 2026-11-27 after 00:00 Asia/Baghdad, and the A-1/A-2/A-3 placeholder. |

## 13. Changes since r5

### 13.1 Review findings → r6 lines

| Finding (review) | Addressed at r6 lines | How |
|---|---|---|
| H-1 (r4 review, carried forward in the r5 review) | 186, 161, 169, 170, 229, 394, 410, 366, 367, 534, 570 | Cash counts at any date; approvals and deducts stay ≥ start; accountant 15:30 quoted verbatim; T-C3 rewritten; T-C11 added; two mutants; risk (e) rewritten; read-only pre-deploy check. |
| M-1 (r4 review) | 369–372, 397 | Eight guard mutants (4 × 2 exports); T-C6 cases built to count without the guard. |
| L-1 (r4 review) | 11, 25, 440, 442, 563, 607 | "On or after 2026-11-27 00:00", plus the gap operating note. |
| L-2 (r4 review) | 634, 602, 568 | A-items are deploy-go conditions; the placeholder is kept, once. |
| L-3 (r4 review) | 328 | Invariant-preserving rewrites; line-by-line comparison in code review. |
| N-1 (r5 review) | §13.2 below | r5's §12 left out the title, line 14, §7 line 499, the Q-PROFIT/Q-HOME/Q-NEG/Q-ACC edits and §12 itself. All were documentation-only; acknowledged. |
| N-2 (r5 review) | 676, 696, 256, 257 | 15:16 answers quoted verbatim; Ameer's `:58`/`:59` answers close the questions; N3/N4 added with tests and mutants. |
| N-3 (r5 review) | 502 | Difference 3 is now marked as the H-1 defect, resolved by the accountant at 15:30. |
| r4 M-2, r1 items | — | Closed in the r5 review; unchanged. |

### 13.2 Other changes

| Item | Change |
|---|---|
| Header | Title r6; r6 source bullet with the r5, review and accountant shas; `AMEER-answers-L.md` re-hashed (`53a2dc87…ba74`, 59 lines). |
| §1.2 (new) | Ameer's `:58`/`:59` verbatim. The N3 text comes from the accountant's file plus EA's relay, flagged. |
| §2.3, §2.7 | New strings N1–N4 exact. Profit on three screens. N4 label switch with a signed «الكلفة الكلية». Per-project netting caution. |
| §2.6, §2.6a | H-1 any-date cash, accountant 15:30 verbatim. Note that the old «+ عقد مقاول» path writes no `accountTxns` (`render.js:162-186`). |
| §3.4, §3.6, §3.8 | L-3 rule; r6 mutants; T-C3, T-C6, T-C9 rewritten; T-C11 and T-C12 added; the old "Profit" placeholder bullet removed. |
| §4 | (b) on-or-after and the gap; (c)/(c2) reconciliation at any date; new (c3); (e) rewritten; (g) and (h) updated. |
| §5 | Step 4: deploy go includes A-1/A-2/A-3 and the step 4a result. New step 4a: read-only pre-deploy check, run by Ameer on his phone. **Which option to use is open for EA/Ameer**; no IAM change, no Ameer login, no secrets. Steps 6 and 8 check N1–N4. |
| §6, §7 | Gates and PR body updated; accountant 15:16 and 15:30 quotes in the PR body. |
| §8 | A-1 CSV difference corrected (any date) with the accountant's 15:16 and 15:30 words. A-2 accountant confirmation. Q-PROFIT, Q-HOME, Q-NEG, Q-SPLIT and Q-LABEL closed. Placeholder kept once. |
| Unchanged | `CONTRACTOR_COST_START = '2026-11-27'`; the `saveSubcontract` guard; the `QTY_ACCEPTED` row; sw v85; hosting only; rules and CSV untouched; rollback `e72bb887a2e0206d`; fix-forward v86; one grok-4.7 cloud agent after CONFIRMED and code-start. |

## 14. Changes since r6

### 14.1 Review findings (r6 review) → r7 lines

| Finding | Addressed at r7 lines | How |
|---|---|---|
| MEDIUM-1 (home note not approved) | 70, 74, 247, 248, 257, 378, 379, 423, 424, 736, 738, 626 | Home note is a pending question with a placeholder; both variants have their own strings, tests and mutants; the home profit basis (`:58`) stays; `:61` quoted for the N3 text; the EA-relay flag on the text is dropped. |
| MEDIUM-2 (step 4a option 1 false) | 583, 585 – 611 | r6 option 1 dropped, with the proof cited; the Architect's console option (Ameer himself, in his browser) and phone cross-match quoted verbatim; CSV as a complement only; choice is Ameer's, before the deploy go; result must be counted. No IAM change, no bot uses Ameer's login, no secrets. |
| LOW-1 (T-C11 legacy) | 414, 368 | Legacy is built from the ledger rows, never a literal 0. |
| LOW-2 (stale text) | 237, 648 | The `net` line limits only approvals and deducts by date; the PSTACK text says "at any date" and mentions profit, N3 and N4. |
| NIT-1 (T-C3 four purposes) | 397 | Four-purpose 26/11 case kept, with a "do not trim" note. |
| NIT-2 | — | No action: the review says the N-items are closed and the old wording in §11/§12 is history. |
| Re-cite `AMEER-answers-L.md` | 24, 62 | Now 65 lines, sha `256f283c…56a1` (the first 61 lines = `9dc88953…5c4e`); `:58`, `:59`, `:61` cited. |
| New answers that arrived during r7 (`:63`, `:65`) | 666, 742, 609 | Quoted verbatim beside the placeholders; placeholders kept once each, per the brief; EA to confirm, then r8 fills them. |

### 14.2 Other changes

| Item | Change |
|---|---|
| Header | Title r7; r7 source bullet (r6 sha, review sha). |
| Unchanged | Formulas (§2.6, §2.6a, §2.7), H-1, M-1 mutants, N1/N2/N4, project-screen N3, profit basis on three screens, sw v85, hosting only, rules and CSV untouched, deploy on or after 2026-11-27 00:00 Asia/Baghdad, rollback `e72bb887a2e0206d`, fix-forward v86, the A-1/A-2/A-3 placeholder (once). |

## 15. Changes since r7

| Item | r8 lines | Change |
|---|---|---|
| Header | 22 | Title r8; r8 source bullet (r7 sha). The answers file is cited as 65 lines, sha `256f283c…56a1`; its first 63 lines = `42f627db…fc29`, the version EA named. |
| §1.2 | 75 | A-1/A-2/A-3 answered at `:63`. |
| §8 placeholder | 661, 671 | The A-1/A-2/A-3 placeholder is replaced by `:63`, verbatim. All three conditions are marked MET. The r7 "recorded beside the placeholder" block is removed (its content is now the answer). |
| §8 match check | 673 | A-1 is a partial match: it covers the first-measurement rule, not the CSV reconciliation (question for EA). A-2 matches the narrowed two-row question. A-3 matches. |
| A-1, A-2, A-3 sections | 697, 709, 716 | Status lines added. |
| §5 step 4, §6 gates 2 and 7 | 574, 627, 632 | A-items met; the deploy go still needs the step 4a result; HOME-NOTE is still needed before code-start. |
| HOME-NOTE, step 4a | 758, 610 | Both still pending as Ameer's choices; the HOME-NOTE placeholder is kept once. Question for EA: does `:65` answer them? |
| Unchanged | — | All formulas, tests, mutants, strings N1–N4, the project-screen N3, sw v85, hosting only, rules and CSV untouched, deploy on or after 2026-11-27 00:00 Asia/Baghdad, rollback `e72bb887a2e0206d`, fix-forward v86. |

## 16. Changes since r8

| Item | r9 lines | Change |
|---|---|---|
| Header | 23 | Title "r9 (final)"; source bullet with the r8 and r7 shas. The answers file is cited as 65 lines, sha `256f283c…56a1`. |
| §1.2 | 75, 79 | Note on the project screen only; HOME-NOTE answered at `:65`. |
| §2.7 home | 252, 254, 262 | No note on home; home and list keep the «الكلفة الكلية» profit basis. |
| §3.6, §3.8 | 383, 427 | `home-note-missing` and T-C12h removed. T-C12n and `home-note-present` kept: they prove home renders no note. |
| §4(g) | 562 | No note on home. |
| §5 step 4 / 4a | 576, 588, 600–663, 665 | Method chosen at `:65`; console option dropped. Arabic step-by-step instructions, with every label checked at 66d35163 and cited by file:line; banned buttons listed; what to report to EA. |
| §6 gate 2 | 679 | All questions answered. |
| §8 A-1 | 729, 733, 751 | Per EA (15:59), the card showed part (i) only. Ameer's answer covers part (i). The CSV reconciliation is the accountant's advice (15:30, `a849134a…`), following from `:56`. Closed, with no Ameer question. |
| §8 HOME-NOTE, method | 800, 811, 793 | HOME-NOTE placeholder replaced by `:65`; the method closed. |
| Still open | — | No Ameer or EA questions. Normal gates only: Architect CONFIRMED of r9, Ameer's code-start go, one grok-4.7 cloud agent, the PR review and merge gates, the step 4a result, and the deploy go on or after 2026-11-27 00:00 Asia/Baghdad. |
| Unchanged | — | Formulas, H-1, the M-1 mutants, N1–N4, sw v85, hosting only, rules and CSV untouched, rollback `e72bb887a2e0206d`, fix-forward v86. |

## 17. Changes since r9

Text only. Review: `REVIEW-plan-date-pr-r9-306d8396.md` (`13041791…b32a`). No formula, design or app-string change; the phone check stays read-only.

| Item | r10 lines | Change |
|---|---|---|
| History | 27 | r10 source bullet. |
| MEDIUM-1 | 598, 627, 659, 666, 682 | Each «معكوس» row matches one advance only. Ameer looks, without tapping, at «سلفة لم تُكتب بعد» for «سلفة مكررة». |
| LOW-1 (a) bell | 606–612 | Step 1 uses the bell panel («لم يُرسل بعد» 0, «متصل», recent «آخر مزامنة»); «إرسال الآن» banned. |
| LOW-1 (b) marker card | 650 | An empty-status card beside a «معكوس» row of the same amount is the reversal; noted, not an exception. |
| LOW-1 (c) return/settle | 669 | Kept the safe direction: reported as an exception. |
| LOW-1 (d) every person | 637, 639, 658, 687 | Every name, not only contractors; a name difference is noted, not a failure. |
| LOW-1 (e) project pills | 631, 640, 671 | Pills allowed and used to list projects; «كل المشاريع» reset before the next person. |
| LOW-1 (f) archived | 632, 654, 623 | The real label at 66d35163 is «المؤرشفة» (`public/render.js:742`), not «المشاريع المؤرشفة»; «استعادة» (`:747`) banned. |
| LOW-2 | 428 | T-C12n checks the whole home HTML after «صافي الربح». |
| NIT-1 | 723 | PSTACK text. |
| NIT-2 | 427 | "(both variants)" removed. |

## 18. Changes since r10

Text only. Review: `REVIEW-plan-date-pr-r10-05277440.md` (`25a1ec0d…923a`). No formula, design or app-string change; the phone check stays read-only.

| Item | r11 lines | Change |
|---|---|---|
| History | 28 | r11 source bullet. |
| LOW-1 (r10 review) | 625–628 | Step 2's do-not-tap list adds «حفظ قيمة العقد» (`render.js:248`), «+ مشروع جديد» (`render.js:758`) and «+ عقد مقاول» (`render.js:104`), plus a line not to type in «تعديل قيمة العقد» (`render.js:247`). All four labels and lines match 66d35163 exactly. |
