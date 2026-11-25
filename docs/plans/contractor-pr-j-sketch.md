# PLAN ONLY: contractor PR J (settle, statement issue, booked periods, displays), r11

This is a plan. It has no code, no branch, no PR, no cloud agent, and no deploy. Nothing in the repo was edited.

- **r9 is built on r8:** `PLAN-J-r8.md`, sha256 `e0e739d9d14a236dc76f1a010082a7a2ca72f8e14b1777c3df2f1d14bf8abe36`, 1350 lines (unchanged on disk). The Architect **CONFIRMED r7** (`REVIEW-plan-J-r7-5afdb946.md`, `fe5e403a3c577e460b7632569d70fa3fe69c8ae817294046cd0e8cdfe2d51f66`) before seeing r8, with one LOW (mutation 28's claim). r9 fixes that LOW and, per the r8 steering, **holds the opening-balance switch** (held in r9 until card t2191s7670 was filed; released in r10): Ameer's `answers:55` says «الرصيد», not «رصيد أول المدة». The closing-balance switch and «الصافي» stay decided. **§20** maps every r8 → r9 change. §13-§19 are kept as history.
- **r8 header (kept; still accurate unless §20 says otherwise):**
- **r8 is built on r7:** `PLAN-J-r7.md`, sha256 `5afdb946bb0ec50ddf97c86c17bdafa97e2b1709c951d32a4b31254e4f03213f`, 1333 lines (unchanged on disk). r8 applies Ameer's 09:08 answer to the one [NEEDS AMEER] item and changes nothing else. **§19** maps every r7 → r8 change. §13-§18 are kept as history.
- **New inputs for r8** (sha256 checked 2026-11-25 Baghdad; all matched):
  - **Ameer's answers, current copy** `AMEER-answers-J.md`, `7b7600e427f6825d51f799122d502937f19384884ddb8eeea128ebf4568901b8`, **56 lines**. Prefix hashes re-checked: first 52 lines = `3534154a…01ad71e` (the r7 copy), first 43 = `6a32a854…24c32a`, first 37 = `451559e4…2a777215`. So every earlier `answers:N` cite stands. New: **`:54-56`** (09:08, card t2191s7670), Ameer's verbatim answers, EA-relayed:
    - `:55` «١: إي، الرصيد يصير «مستحق عليه» بدل الناقص»
    - `:56` «٢: الأول، «الصافي ... مستحق له» وإذا سالب «مستحق عليه»»
  - **EA's card t2187s7642, filed verbatim** `AMEER-card-J5-t2187s7642.md`, `ba9fc6f806eeca339f57aeaf82cfc382f15696c7876cb578a30c2d5308cbe502`, 20 lines (08:45). It is the card that `answers:40` and `:45-47` answer (closes the Architect's r6 LOW-1 request).
- **r7 header (kept; still accurate unless §19 says otherwise):**
- **r7 is built on r6:** `PLAN-J-r6.md`, sha256 `0b0319aead46548426d3455c100b7ee540e82d479afe6bc9ef79cfcfed61830f`, 1268 lines (unchanged on disk). The Architect gave r6 **NOTES** (0 BLOCKING, 2 MEDIUM, 4 LOW; `REVIEW-plan-J-r6-0b0319ae.md`). r7 fixes all six, closes the accountant's R6-Q1..Q3, records the one open Ameer item (**[NEEDS AMEER]**, §11) and holds the two display changes it covers, and reflects the cap's move to r3 and Ameer's 09:00 cap answers. **§18** maps every r6 → r7 change to its source. §13-§17 are kept as history.
- **New inputs for r7.** Each sha256 was checked before use on 2026-11-25 Baghdad; all matched.
  - **Architect review of r6** `REVIEW-plan-J-r6-0b0319ae.md`, `10a7155abf5f4d69f65f60cff991f8ee029e559cb32dc59a70f928af80b11453`, 165 lines. NOTES: MEDIUM-1 (B24(c) expectation), MEDIUM-2 (R6-Q4 ruling: two display changes not approved by Ameer), LOW-1 to LOW-4.
  - **Accountant advice on r6** `ACCOUNTANT-advice-J-r6.md`, `3b1586745afca63e5bc49216af49dac8299a562ca1fb2e844116de9684a937c9` (08:58). **Advice only** (answered on the message text, not r6 itself). Closes R6-Q1, R6-Q2, R6-Q3 (:2-4). Its :5 (R6-Q4) is overtaken by the Architect's MEDIUM-2 ruling (§11).
  - **Ameer's answers, current copy** `AMEER-answers-J.md`, `3534154a2129966c4735b227b1dc6f40a0f7a910b00330e972fa76efc01ad71e`, **52 lines**. Its first 43 lines hash to `6a32a854…c32a` (the r6 copy) and its first 37 to `451559e4…7215`, so every earlier `answers:N` cite stands. Labels (Architect r6 review §1, LOW-1):
    - `:39-43` (08:47): `:40` is Ameer's reply «رئي المحاسب», EA-relayed; **`:41-43` are EA's record of the accountant's picks, not Ameer's words.**
    - **`:45-47` (08:52) are Ameer's own words**, EA-relayed, answering card t2187s7642 directly: «صافي السلف: رقم موجب وجنبه «يزيد المستحق»» (`:46`) and «الخصم المربوط: إي، نمنع الإصدار لحد ما ينعكس» (`:47`). **They are the source for the «صافي السلف» form and the orphan-deduct block.**
    - `:49-52` (09:00) are Ameer's verbatim answers to the cap plan r3 card t2190s7664: Q19 shown on a true over-cap at send (`:50`), the deploy steps (`:51`), #110 ships with the cap in one deploy (`:52`). They belong to the cap job; J uses them in §4.5.
  - **Cap plan r3** `/workspace/tmp/cap-plan/PLAN-cap-r3.md`, `e02a588007b6797cc15c2317536134cf3fffa832ef4c4c6035ac97c5ac35791c`, 617 lines, Architect **CONFIRMED** (`REVIEW-plan-cap-r3-e02a5880.md`, `d0428faf…4f93`). Its code is now being built by **one** cloud agent from `cloud-prompt-cap.md` (`3f23ece1…eeae`); J does not touch that work.
- **Base is unchanged:** main `4d30d117`, checkout `/workspace/tmp/cap-plan/repo` (read-only, clean).

**r6 header (kept; still accurate unless §18 says otherwise):**

- **r6 is built on r5:** `PLAN-J-r5.md`, sha256 `fcdf5b0f52fafc20c3ea8900ca37ce1b300acca6b0127cc4971cd18c8318aa52`, 1167 lines (unchanged on disk). The Architect gave r5 **NOTES** (0 BLOCKING, 2 MEDIUM, 7 LOW; `REVIEW-plan-J-r5-fcdf5b0f.md`). r6 fixes all nine, folds in the accountant's r5 advice, and applies Ameer's 08:47 decisions (`answers:39-43`): R5-Q3 option (b) and the orphan-deduct issue block, with the tail row kept. **§17** maps every r5 → r6 change to its source. §13-§16 are kept as history.
- **New inputs for r6.** Each sha256 was checked before use on 2026-11-25 Baghdad; all matched.
  - **Architect review of r5** `REVIEW-plan-J-r5-fcdf5b0f.md`, `8c4b62f214db9365a677c57d128307ad6a926184af138eae749c380627dbfc47`, 215 lines. NOTES: M-1 (deduct cascade), M-2 (E7 expectation), LOW-1 to LOW-7; R5-Q1, Q2, Q5, Q6 and Q7 accepted; Q3 to Ameer; Q4 to the accountant.
  - **Accountant advice on r5** `ACCOUNTANT-advice-J-r5.md`, `4285d75dec78a568f1f72d3ff52e2e9cdf1b3b627344ba19f342d0666c4cbc89` (08:35). **Advice only.**
  - **EA's M-2 card, filed verbatim** `AMEER-card-M2-t2173s7591.md`, `5212bf5dcfd334d92ee449b1687099b852cd6497b53cd1c0bc2ca7a4fb7441fd` (card t2173s7591, 08:11; Ameer's answer 08:12). It shows option 2 with the accountant's mock character for character, and Ameer's answer equals `answers:37`. Cited together with `AMEER-answers-J.md` `451559e4…` (closes the r5 review's LOW-3 request).
  - **Cap plan r2** `/workspace/tmp/cap-plan/PLAN-cap-r2.md`, `db91057687bee30043535cd544434eab6cf82ff948b3a9dab8085405cb8961ae`, with the Architect's cap reviews `REVIEW-plan-cap-a74a0514.md` (`c0ecd5db…239845`, r1: B-1, B-2, M-1, M-2/C19, M-3) and `REVIEW-plan-cap-r2-db910576.md` (`556b80a7…c4a112`, r2: NOTES, 0 BLOCKING, 0 MEDIUM, 7 LOW). J's named dependencies on them are in §4.5.
  - **Ameer's answers, r6 copy** `AMEER-answers-J.md`, `6a32a8549b21e9e8b34e8538d68f8754195e3bb31219d443edcfddc50624c32a`, 43 lines. Lines 1-37 are byte-identical to the r5 copy `451559e4…` (the sha256 of the first 37 lines is `451559e4…`), so every earlier `answers:N` cite stands. New: lines 39-43 (08:47). Line 40 is Ameer's verbatim reply «رئي المحاسب» to the r5-questions card t2187s7642; lines 41-43 are EA's record of the accountant's picks that his reply applies. Not edited by the engineer.
  - **Cloud-agent model block** `/workspace/pstack-block-grok-only.md`, `d5cfc070a40e0832d168c63b0ddf9052f6c053cd0268a378b2ebe6a4d5bf5d38` (grok-4.7 only, Ameer 08:32 via EA). It replaces the older pstack models block for J's agent (§9).
- **Base is unchanged:** main `4d30d1176a01e812429ae866124da710e08a4660`, checkout `/workspace/tmp/cap-plan/repo` (read-only; `git status` clean, re-checked for r6). Every new cite in r6 was read there.

**r5 header (kept; still accurate unless §17 says otherwise):**

- **r5 is built on r4:** `PLAN-J-r4.md`, sha256 `66468cbd3ab68a48b01e31c133eeebe2fc53537f4d8382a06eec62c01ca7aa74`, 1019 lines. The Architect **CONFIRMED** r4 with LOW-15, LOW-16 and LOW-17 (`REVIEW-plan-J-r4-66468cbd.md`, sha256 `c333398154b2dba786a96e28614e9c6ea422f60111570b06cf8f5464fd8a4e9f`). r5 folds in Ameer's answers of 2026-11-25 and those three LOWs. **§16** maps every r4 → r5 change to its source, so the Architect can diff against `66468cbd`. §13-§15 are kept as history.
- **Why r5 exists.** Ameer answered the four open J items (relayed by EA; `AMEER-answers-J.md:31-34`, 07:56, and `:37`, 08:12 Baghdad):
  - **M-2 is replaced.** The raw negative display was rejected («لا», `answers:34`). Ameer picked the accountant's option (ب) and approved the two words «ينقص المستحق» and «يزيد المستحق» (`answers:37`). See §3.3 "Display".
  - **L-12 (b) is in J** (`answers:32`). See §4.4.
  - **OPEN-15 «صافي السلف» is in J** (`answers:33`). See §3.6 `mustakhlas`.
  - **OPEN-6 is a separate cap job that merges before J** (`answers:31`). See §4.5 and §7. Every J item that depends on it is marked **[DEPENDS ON CAP FINAL]**, because `PLAN-cap.md` r1 is still under Architect review.
- **Approval to plan:** Ameer at 22:23, relayed by EA at 22:24 Baghdad on 2026-11-24. That approval covers the plan only. A code PR still needs:
  - an Architect **CONFIRMED** on this r5 (at least on the r4 → r5 delta in §16);
  - **the cap job merged first** (`/workspace/tmp/cap-plan/PLAN-cap.md`); J's code head is cut from main only after that merge (§7);
  - EA's go for one cloud agent;
  - later, a merge approval that names the head SHA.
- **The wording mini-PR is done.** #110 was squash-merged at head `80bd29ba` into main `4d30d117` (`answers:30`). r4's "mini-PR first" gate is closed.
- **Base:** main `4d30d1176a01e812429ae866124da710e08a4660` (#110).
  - The checkout is `/workspace/tmp/cap-plan/repo`, used read-only (it is shared with the cap plan and was not edited). `git rev-parse HEAD` = `4d30d117…` and `git status` is clean, checked on 2026-11-25 Baghdad.
  - **How r4's cites were re-based.** `git diff --stat 32bccf81 4d30d117` touches only `public/accounts-payment.js`, `public/accounts-view.js` (:388, edited in place), `public/accounts-work.js` (:29, :55, in place), `public/sw.js` (:2) and tests, drives and feature docs. `git diff --quiet` is clean for `firestore.rules`, `public/accounts.js`, `public/sync.js`, `public/firebase-client.js`, `public/session.js`, `public/render.js`, `public/index.html`, `public/accounts-correct.js`, `types/`, `package.json`, `.github/` and `scripts/verify-aj.js`, so every r4 cite into those files stands at 4d30d117. The cites that moved (`public/accounts-payment.js`, `tests/accounts-view.test.js`, `public/sw.js`) were re-read and are updated in place; §16 lists them.
  - **A code PR re-reads every line at its own base**, which is main after the cap merge. The cap PR edits `firestore.rules`, `public/sync.js`, `public/firebase-client.js`, `public/sw.js`, `package.json` and two emulator test files (`PLAN-cap.md` §3.4, :235-248), so the rules, sync and firebase-client cites below will move.
- **Inputs carried from r2** (sha256 checked in r2): gj-sketch r18 `9faad713…c7e6` (J section 393-482), i-sketch `7a03fe20…d2e8`, `PLAN-I-r5.md` `3f95553b…73f8`, `AMEER-answers-r2.md` `7f3aa0bb…78b4`, `QUESTIONS.md` `229a6b10…7711`, r1 review `bf0538c9…6cd8`, `ARCHITECT-answers-J-r1.md` `c5724a58…3b4d`, `ACCOUNTANT-advice-J-r1.md` `cc4ab75d…03fc`.
- **Inputs carried from r3** (sha256 checked in r3): `REVIEW-plan-J-r2-dd431aec.md` `5d4882a4…6c`, `REVIEW-plan-H-jq6-9a8dd97e.md` `2dd385f8…3de3`, `ACCOUNTANT-advice-J-r2.md` `ad722dc6…246`, `ACCOUNTANT-advice-J-M2-2311.md` `2e246959…6f3`, `ACCOUNTANT-advice-J-r2-2304.md` `bb7e62c0…588` (item 3 superseded, unused).
- **Inputs carried from r4** (sha256 checked in r4): `REVIEW-plan-J-r3-1740e26b.md` `4dfd7753…e36e`, `ACCOUNTANT-advice-J-r3.md` `9f176774…e418e873`, probe `windows-fix.js` `95915130…36ad8` → `windows-fix.out` `a65180de…4706`.
- **New inputs for r5.** Each sha256 was checked before use on 2026-11-25 Baghdad; all matched.
  - **Architect review of r4** `REVIEW-plan-J-r4-66468cbd.md`, `c333398154b2dba786a96e28614e9c6ea422f60111570b06cf8f5464fd8a4e9f`. Verdict CONFIRMED; LOW-15, LOW-16, LOW-17; INFO-1 to INFO-3.
  - **Ameer's answers, current copy** `AMEER-answers-J.md`, `451559e44e4e2a8f9a6f56a5b2010acb324f3113ae67e53b4f5ec3992a777215`, 37 lines. Not edited by the engineer. All `answers:N` cites below are to this sha. Every r4 cite (`answers:7, 11-14, 17-21, 25-27`) still points at the same text. In lines 29-34 and 36-37, only the Arabic after each item label is Ameer's widget answer as relayed by EA; the labels and the notes in parentheses or after "->" are EA's (as `PROPOSAL-M2-signs-r1.md` §0 also notes).
  - **Accountant's M-2 alternatives** `ACCOUNTANT-advice-M2-alt.md`, `31dc959aa43b28889485c0c004751912cbd7e55b700f98b980755bc9ee879365` (08:02). **Advice only.** Ameer picked its option (ب) (`answers:37`).
  - **Architect's M-2 proposal** `PROPOSAL-M2-signs-r1.md`, `56ffc9a84f89ebf7fc905faacc8302f77d4ce0e9410404871fd29756c173b085` (08:06). Its Option A was not picked. r5 takes from it: the facts in §1 (:41-47), the late/reversed split rule (§2, :51-54), and the test ideas B20, D11 and B21 (:105-108), adapted to option (ب).
  - **Cap plan** `/workspace/tmp/cap-plan/PLAN-cap.md`, `a74a05146d5a08548cc53f2c8e321750336898a5a70dfd6ceb4fbe8b8191a81a` (r1, under Architect review). It owns OPEN-6. J's dependencies on it are in §4.5.
- **Skill:** `architect` (pstack). Arena was not run, because Ameer's gate bans it for cost (gj-sketch:5).

**What r5 rests on (EA-relayed from Ameer unless marked):**

| Item | Decision | Source |
|---|---|---|
| OPEN-1 / OPEN-10 | Heading `تصحيحات فترات سابقة` above the correction rows, before `الصافي` | answers:11 (23:09) |
| OPEN-2 | Issue only after the period ends (M-1 unchanged) | answers:13 |
| OPEN-3 | Queued-record block sentence `لا يُعتمد الكشف وفيه قيد لم يُرسل بعد` | answers:12 |
| OPEN-4 | A14(b) becomes `اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً` | answers:17 (23:12) |
| OPEN-7 | Six strings approved; `النقد الخارج` is replaced everywhere by `المدفوع للمقاولين` | answers:18-19 (23:12) |
| OPEN-9 | Cash out by actual payment status; 820,000 confirmed | answers:13, 25 (23:13) |
| OPEN-9b | Custody-paid contractor rows count in this screen's cash out, never summed with company cash | answers:26 (23:13); accountant 2304 item 2, r2 item 4 |
| OPEN-12 | Past-date issuing through the «حسابات» date field accepted; no 'previous period' option | answers:20 (23:12) |
| Second owner phone | YES → OPEN-11 raised (§4.3) | answers:21 (23:12) |
| **M-2 (r5)** | Each correction row shows the **positive** amount under its existing FIGURES label, then «ينقص المستحق» or «يزيد المستحق» by its effect on the balance owed, then `من`/`إلى` of the issued window it corrects (accountant's option (ب)). The internal maths is unchanged (raw delta + FIGURES sign). Two new strings approved. | **Ameer, verbatim 08:12:** «M-2: الخيار الثاني، وأوافق على الكلمتين «ينقص المستحق» و«يزيد المستحق»» (`answers:37`); option (ب) = `ACCOUNTANT-advice-M2-alt.md:5`. It replaces r4's raw-negative display, which Ameer rejected («لا», `answers:34`). |
| L-12 (b) | Block issuing while an orphan settle or return exists; show the «عكس» button with «اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً». Part of J. | `answers:32` (07:56) |
| OPEN-15 | Add «صافي السلف» to «مستخلص». Part of J. | `answers:33` (07:56) |
| OPEN-6 | The server cap is a separate job that merges **before** J | `answers:31` (07:56); `PLAN-cap.md`, now `PLAN-cap-r3.md` (CONFIRMED; code in progress) |
| R5-Q3 (r6) **DECIDED** | A negative period «صافي السلف» in «مستخلص» (returns > advances) prints the **positive** amount + «يزيد المستحق». No new words. (r7: this rule covers «صافي السلف» only; the rest of «مستخلص» is covered by the [NEEDS AMEER] item below.) | **Ameer 08:52, his own words: «صافي السلف: رقم موجب وجنبه «يزيد المستحق»»** (`answers:46`); earlier `:40` «رئي المحاسب» with EA's record of the accountant's pick at `:42`; accountant `ACCOUNTANT-advice-J-r5.md:4` |
| r6 M-1 block **DECIDED: YES** | Block «إصدار» while a reversed approval has a live linked deduction, until the deduction is reversed; same «عكس» button and the approved sentence «اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً» (L-12 (b) path). r7 (Architect r6 MEDIUM-1): a deduct reversed **after its days were issued** keeps its **window** row in later statements (B24(d), the "baseline" in EA's record `:43`); a deduct reversed while its days are unissued books on its own day, so its tail row disappears and the opening absorbs it (B24(c)). No issued statement ever carries a tail deduct row, because the block stops the issue while the orphan lives. | **Ameer 08:52, his own words: «الخصم المربوط: إي، نمنع الإصدار لحد ما ينعكس»** (`answers:47`); `:40` with EA's record `:43`; Architect r5 review M-1 (:112) |
| Card balance lines and «الصافي» form (r7 → r8 → r10) **DECIDED** | (1) On the statement card, **both** `رصيد أول المدة` and `رصيد آخر المدة` print |amount| + «مستحق له» (≥ 0) or «مستحق عليه» (< 0) instead of a minus sign. (r9 held the opening line because `answers:55` says «الرصيد»; r10 releases it: the card's question ١ included the opening line.) (2) «الصافي» in «مستخلص» prints |net| + «مستحق له» (≥ 0) or «مستحق عليه» (< 0) (option الأول). Existing words (`public/accounts-view.js:372`). The card's own «صافي السلف» stays as today (an optional third question was **not** asked). | **Ameer 09:08 verbatim** `answers:55` «إي، الرصيد يصير «مستحق عليه» بدل الناقص», `:56` «الأول، «الصافي ... مستحق له» وإذا سالب «مستحق عليه»»; card evidence `AMEER-card-J6-t2191s7670.md` (`e4d3529b…c697`): `:7` explanation ends «ونفس الشي لرصيد أول المدة.», `:17` step prompt «الرصيد يصير «100,000 د.ع مستحق عليه» بدل الناقص؟», `:18` Ameer's answer «١: إي، الرصيد يصير «مستحق عليه» بدل الناقص»; Architect r6 review MEDIUM-2 |
| r4 M-2 (superseded) | Raw delta under the same FIGURES label | **Not an Ameer answer.** Decided by the accountant under Ameer's A6/C3 delegation «المحاسب يقرر» (`AMEER-answers-r2.md:13`); accountant M2-2311 (a) + r2 item 3; Architect r2 review §5. `answers:14` listed it as pending Ameer and `answers:27` (sha `82763a82…`) records "decided by the accountant, not put to Ameer". Put to Ameer after r4: **rejected** («لا», `answers:34`), and replaced by the M-2 (r5) row above. |
| JQ5 | **Never asked.** Keeps its fallback (`عمل معتمد`, `مدفوع للعمل` unchanged) | answers:7 |
| JQ3, Q19-on-H, JQ6 | Done in the wording mini-PR #110, merged at 4d30d117 before J | `answers:30`; mini review §4; J review L-10 |

**Every Ameer-facing J item is now answered** (`answers:31-34`, `:37`). r4's open Ameer items (OPEN-6, L-12 (b), OPEN-15 and the M-2 confirm) are closed by those lines. The new questions r5 raises are for the Architect and the accountant (§11); none needs Ameer unless they say so.

---

## 0. Binding decision A6/C3, verbatim

From `/workspace/tmp/slice-i-plan/AMEER-answers-r2.md`:

> line 13: `١١- المحاسب يقرر          -> A6/C3 (before J): Accountant decides.`
>
> line 19: `A6/C3 (for J): issued statement never changes; correction shows in the period it was made as a negative line. Engineer checks whether createdAtServer on rev_ works without rules change; if rules change needed -> back to Ameer.`

**r5 note on "as a negative line".** The A6/C3 property (an issued statement never changes; the correction shows in the period it was made) stands. How the correction's direction is **shown** is now Ameer's later, more specific answer: a positive amount plus «ينقص المستحق» or «يزيد المستحق» (`answers:37`), after he rejected the minus-sign display (`answers:34`). Internally a reduction is still a negative contribution to the net (§3.3).

**The engineer check needs no rules change.** The Architect confirmed this in review §1.

- Every marker carries `createdAtServer == request.time` through `headerOk` (`firestore.rules:478-480`):
  - `rev_`: `revCreate` (1073-1100), keys at 1086;
  - `rej_`: keys at 1061;
  - `approveDeduct`: keys at 1031;
  - `revw_`: keys at 1116.
- None of those markers carries a `txnDate`.
- `fromRemote` turns the stamp into milliseconds (`public/sync.js:335-341`).
- `mergeById` replaces the local copy once the id has left the outbox (`public/sync.js:350-359`).

**The gap at 4d30d117** (these files are unchanged since 32bccf81):

- `inScope` dates a row by `txnDate` only (`public/accounts.js:792-807`).
- `walkLive` kills a row as soon as a live marker exists, whatever the day (`public/accounts.js:629-650`, 657-688).
- So today a November `rev_` rewrites October.
- B3 is the test that is red at base.

---


## 1. Goal

J does four things:

1. **Save 11, `تسوية سلفة`.** A `settle`, id `stl_<measurementId>_<gen>`.
2. **Save 12, `إصدار كشف حساب`.** A `statementApprovals/{uuid}` row. The button shows only for a **closed** period (M-1), and the card shows the figures being issued (L-9).
3. **The displays** (gj-sketch:395): the balance sentence, the quantity tile, the period «مستخلص», and the project totals.
4. **A6/C3.** An issued statement never changes. A correction shows in the period it was made, under the heading `تصحيحات فترات سابقة`. Each row shows the **positive** amount under the same FIGURES label, then «ينقص المستحق» or «يزيد المستحق» by its effect on the balance owed, then the issued window it corrects (M-2, option (ب), `answers:37`). No row ever shows a minus sign.
5. **L-12 (b).** Issuing is blocked while a live settle or return hangs on a reversed advance. The issue card lists those rows, each with `عكس`, under the approved sentence (`answers:32`).
6. **OPEN-15.** «مستخلص» gains the existing line `صافي السلف` (`answers:33`).

---

## 2. Scope

### 2.1 In J

1. **`settle`.** The builder, the form on «مقاول», generations 1-9, and reversal through I's `reversalDoc` (`public/accounts-correct.js:539-580` accepts kind `stl`).
   - Approved (EA-relayed): on `cap` or `cumulative` the form paints `المُرجَع والتسوية أكبر من السلفة` (**Q19**). H's return form already paints it since #110 (`public/accounts-payment.js:36`, :287).
   - **After the cap job [DEPENDS ON CAP FINAL]:** the settle is still committed through the outbox (`commitDoc`). On flush, the cap's `writeLocal` branch sends it through `writeCapped` with its counter (`PLAN-cap.md` §3.3 :209-228, §7 :375). J calls no cap function itself. Q19 stays the entry-time message; r7: a true over-cap refusal at send shows the same approved Q19 sentence `المُرجَع والتسوية أكبر من السلفة` on that row, not `رُفض الإرسال` (Ameer `answers:50`; the cap PR's placement; §4.5).
2. **`statement-approval`.** The builder and the button on «مقاول».
   - It covers the agreement's person and project for `AccountsView.accountPeriod()` (`public/accounts-view.js:119-123`).
   - It shows only when `periodEnd < today()` (M-1).
   - The card shows the booked figures it will issue, with existing labels (L-9).
   - The online, flush, pull and recompute gate applies, with the L-8 conditions (§3.6, §4.2).
3. **Booked periods (A6/C3), display only.** Pure functions in `public/accounts-statement.js`. There is no second fold.
4. **«حسابات» displays.**
   - The balance sentence.
   - The quantity tile.
   - The period «مستخلص».
   - The project totals, rendered **outside** the statement card (L-4), with `المدفوع للمقاولين` (OPEN-7).
   - The booked statement tab (E-1).
   - **Not JQ3.** #110 already changed the unit label on both screens (`public/accounts-view.js:388`, `public/accounts-work.js:55`). J does not edit line 388.
5. **E-2.** In I's file, an `advanceLabor` with a live `settle` (matched on **`settlesId`**) is `dependent`. The A14(b) sentence becomes `اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً` (OPEN-4), at `public/accounts-correct.js:54`.
6. **E-3.** The issue tap calls the existing global `flushRemote` (`public/firebase-client.js:709`) under the L-8 conditions, and reads `api.lastSyncAt()` (`types/checkjs.d.ts:841`, passed at `public/render.js:1692`). See §5.
7. **L-12 (b), in J (`answers:32`).** `orphanDrawIds` joins `'review'`; the issue card lists each orphan row with `عكس` under the approved OPEN-4 sentence (§4.4).
8. **OPEN-15, in J (`answers:33`).** The `صافي السلف` line in «مستخلص» (§3.6).
9. **LOW-15.** In the all-projects «حسابات» view, correction rows are built per project (§3.3).

### 2.2 Not in J

- **No `firestore.rules` change.**
  - `laborStlCreate` (818-859) allows the settle.
  - `statementWithProjectCreate` (1174-1185) allows the issue.
  - `revCreate` with `stl` (1085) allows the settle reversal.
  - The Architect confirmed this, and the emulator ran 137/137 at base (r1 review §1).
- **No `public/sync.js` change.** `STL_REMOTE` (:76, :95), `STATEMENT_REMOTE` (:60, :123), `collectionFor` (:30), the refusal path (:1095-1097). The cap PR adds `capOpOf`, `capSeed`, `capStep` and `CAP_COLLECTION` there (`PLAN-cap.md` §3.4 :239); J does not touch them.
- **No `public/accounts.js` change** (gj-sketch:591). `CONTRACTOR_COST_START` stays `null` (`public/accounts.js:11`).
- **No CSV change.** Contractor rows in the CSV are A9, "later" (AMEER-answers-r2.md line 7).
- **No edit to `.cursor/rules/pstack-models.mdc`.**
- **No `public/render.js` edit.** `AccountStatement` is already in the install list (`public/render.js:1697-1698`).
- **No `public/firebase-client.js` edit.** The cap PR adds `writeCapped` and `readCapSeed` there (`PLAN-cap.md` §3.4 :240); J never calls them directly. J reads the globals `flushRemote` (:709), `flushing` (:468) and `FLUSH_MS` (:471), and `sessionEpoch` (`public/session.js:13`).
- **The wording mini-PR is done, not in J.** #110 (`PLAN-H-jq6-mini-r2.md`) merged at 4d30d117 (`answers:30`). It dropped `السلفة ليست مصروفاً` (JQ6), painted Q19 on H's `returnAdvance` form (`public/accounts-payment.js:36`, :287) and changed `METHOD_LABEL.unit` (`public/accounts-work.js:55`) and `public/accounts-view.js:388` (JQ3). It took `VERSION` `aj-p0-v80` (`public/sw.js:2`).
- **The cap job is not in J (OPEN-6, `answers:31`).** It merges **before** J and takes `aj-p0-v81` (`PLAN-cap.md` §3.4 :241). J is cut after it and takes the next free number, expected `aj-p0-v82` (`PLAN-cap.md` §7 :379) **[DEPENDS ON CAP FINAL]**.
- **No `public/accounts-payment.js` or `public/accounts-work.js` edit in J.** J reads `AccountPayment.groupThousands` and `plainAmount` only.
- **`reclassAdvance`** is hard-zeroed and its line hidden until slice L (L-3). `أُعيد تصنيفها` (JQ4) is painted in L.
- **These stay out of J:** L, S (`AccountShare`), the «عهد» link, materials, USD, retention, `آخر معتمد`, migrations, and any edit or delete.
- **No server-side cumulative settle cap in J.** It is the separate cap job (OPEN-6, `answers:31`; `PLAN-cap.md`), merged before J. J's §4.3 R3 and §4.5 are closed as "done by the cap job" (§4.5) **[DEPENDS ON CAP FINAL]**.

---

## 3. Design

### 3.1 Two shapes (architect)

**Shape A (chosen): a booking filter in J's own file.**

- `public/accounts-statement.js` decides which documents land by Baghdad day `t`, as `bookedBy(docs, t)`.
- It then calls the existing `Accounts.balances` (`public/accounts.js:893-895`) and `Accounts.statementLines` (942-969).
- `accounts.js` keeps the money math. J owns only the landing day.

**Shape B (not chosen): `bookedStatementLines` in `public/accounts.js`.**

- It would edit B/C/K's file, which gj-sketch:591 forbids.

The Architect accepted shape A in review §2.

### 3.2 Module structure

| File | Owns | Reads |
|---|---|---|
| `public/accounts-statement.js` (NEW, global `AccountStatement`) | booking, `periodStatement`, `correctionRows` (r5 split and effect), `orphanDrawIds` (L-12 (b)), `mustakhlas` (with `صافي السلف`), `contractorTotals`, `approvedUnitQty`, `balanceSentence`, `settleDoc`, `statementApprovalDoc`, `issueGate`, the «مقاول» cards for saves 11 and 12 (with the orphan list), `register()` | `Accounts.*` (incl. `rowIndex`, `rowLive`), `AccountsView.accountPeriod/commitDoc/readAccountScope`, `AccountPayment.groupThousands/plainAmount`, `AccountCorrect.reversalDoc`, `Ledger.fmt/sign/countedEntries`, `baghdadDate` (`public/session.js:143`), `today()` (172), `flushRemote` (`public/firebase-client.js:709`), `flushing` (:468), `FLUSH_MS` (:471), `sessionEpoch` (`public/session.js:13`) (E-3, L-8), `api.lastSyncAt()` |
| `public/accounts-view.js` (EDIT) | calls J when `typeof AccountStatement !== 'undefined'`; this is a test seam (review §3) | — |
| `public/accounts-correct.js` (EDIT, E-2) | one `dependent` branch | — |

- **Script order:** `accounts-statement.js` goes after `accounts-correct.js` (`public/index.html:75`) and before `render.js` (76).
- **Install:** `install(api)` wraps `api.views.contractor`, the same way as `public/accounts-correct.js:1132-1136` and `public/accounts-payment.js:1073`.

### 3.3 Booked periods (A6/C3): data model and rule

There are no new fields and no new collection.

**Natural day `nd(doc)`:**

- It is `doc.txnDate` when that is `YYYY-MM-DD`.
- Otherwise it follows the pointer to the target's day, to depth 8 or less:
  - `rev_` uses `reversesId`, or the id after `rev_`;
  - `rej_` uses `targetId`, or the id after `rej_`;
  - `approveDeduct` uses `targetId`;
  - `revw_` uses `targetId`;
  - `sup_` uses `supersedesId`.
- If the chain has no date, `nd` is `serverDay(doc)`.

**Server day `serverDay(doc)`:**

- It is `baghdadDate(doc.createdAtServer)` when that is a finite number.
- It is `today()` while the doc is queued. That value is provisional.

**Scope:**

- Scope is `{ partyId, projectId }` from the doc.
- A missing field comes from the target. A `rej_` has no party or project (`firestore.rules:1061`).

**Closing approvals for a document `d`** are the rows A in `statementApprovals` where all of these hold:

- A's `createdAtServer` is a number;
- A is not in `syncErrors`;
- `A.partyId == d.partyId`;
- A has no `projectId`, or `A.projectId == d.projectId`;
- `A.createdAtServer < arrival(d)`, where arrival is d's stamp, or +∞ while d is queued;
- `nd(d) <= A.periodEnd`.

**The booking rule:**

```
book(d) = nd(d)                                              if no closing approval
        = max(nd(d), serverDay(d), nextDay(max A.periodEnd)) otherwise
marker:  book(d) = max(book(d), book(target))
bookedBy(docs, t) = docs with book <= t, filtered BEFORE rowIndex
```

**The period statement, P = [s, e], filter F (r4 windows, M-3/M-4; r5 display, M-2 option (ب); LOW-15):**

```
opening(P)      = Accounts.balances(bookedBy(docs, s-1), F + { periodEnd: s-1 }).net
period(P)       = Accounts.statementLines(bookedBy(docs, e), F + { periodStart: s, periodEnd: e })   (in-period figures only)
pool(P)         = approvals A in P's scope (same partyId; A.projectId absent or == F.projectId;
                  every approval of the party when F has no projectId),
                  with numeric createdAtServer, not in syncErrors, and
                    A.createdAtServer < issuedAt(P)        if P is issued (issuedAt = earliest exact issue row, §3.6)
                    (every such synced approval)           if P is not issued
                  ANY periodEnd (also >= s)                                                     (M-3)
order           = by (periodEnd, periodStart, id) ascending                                    (M-4 ties)
windows W_k     = walk the ordered pool with prevEnd = none:
                    end_k = min(A_k.periodEnd, s-1)
                    skip A_k if prevEnd != none and end_k <= prevEnd                           (no empty or duplicate window)
                    W_k = (prevEnd, end_k], labelled by A_k; prevEnd = end_k
amt(D, W_k)_f   = figure f of Accounts.statementLines(D, F + { periodStart: nextDay(prevEnd), periodEnd: end_k })
                  (first window: Accounts.balances(D, F + { periodEnd: end_1 })_f, no lower bound)
tail T          = (r6, M-1) the days after the last window up to s-1: (end_K, s-1] if a window exists and end_K < s-1;
                  every day <= s-1 if the pool gives no window; none if end_K == s-1.
                  amt(D, T)_f = statementLines(D, F + { periodStart: nextDay(end_K), periodEnd: s-1 })_f
                  (no window: Accounts.balances(D, F + { periodEnd: s-1 })_f). T is treated as one more window,
                  kind 'tail', with the same parts below; label من <first tail day> إلى <s-1>, where the first tail day
                  is nextDay(end_K), or (no window) the earliest nd among Be's docs in scope.
Bs              = bookedBy(docs, s-1);  Be = bookedBy(docs, e)
Bl              = Bs ∪ { d in Be \ Bs : d is not a rev_/rej_ marker }                         (r5: the late docs)
parts           = for each window W_k, then the tail T, and figure f (r5, M-2 option (ب); r6 tail):
                    late_f     = amt(Bl, W_k)_f - amt(Bs, W_k)_f
                    reversed_f = amt(Be, W_k)_f - amt(Bl, W_k)_f
                    (late_f + reversed_f = amt(Be, W_k)_f - amt(Bs, W_k)_f = r4's raw delta, by telescoping)
                    each part with raw != 0 gives one CorrectionRow:
                    { key f, part 'late' | 'reversed', label FIGURES label, amount: raw (signed, internal only),
                      effect: sign(SIGN[f] * raw)  (+1, -1, or 0 for settlements),
                      kind 'window' | 'tail',
                      source: { periodStart: A_k.periodStart, periodEnd: A_k.periodEnd }   (window)
                            | { periodStart: first tail day, periodEnd: s-1 }              (tail) }
printed rows    = parts with effect != 0, in order: project (LOW-15, all-projects view only), window k (tail last),
                  FIGURES order of f, then 'late' before 'reversed'
SIGN[f]         = the `sign` on the StatementLine for f (figureLines, public/accounts.js:928-934; FIGURES at 535-547)
                  approvedLabor +1, payments -1, refunds +1, advancesPaid -1, cashReturned +1, deductions -1, settlements 0
closing(P)      = Accounts.balances(bookedBy(docs, e), F + { periodEnd: e }).net
                = opening(P) + net(period) + Σ SIGN[row.key] * row.amount          (B9; over all parts)
                = opening(P) + net(period) + Σ row.effect * |row.amount|           (over printed rows: effect-0 parts add 0)
```

- **Display (r5, M-2 replaced by Ameer's option (ب), `answers:37`).** A printed row's text is exactly

  ```
  <FIGURES label> <fmt(|amount|)> د.ع، <effect word>، من <source.periodStart> إلى <source.periodEnd>
  ```

  The accountant's mock that EA put to Ameer is `مدفوع للعمل 600,000 د.ع، يزيد المستحق، من 2026-10-01 إلى 2026-10-31` (`ACCOUNTANT-advice-M2-alt.md:5`; the card as shown, `AMEER-card-M2-t2173s7591.md`, option 2). Ameer's own words are only his answer (`answers:37`; the card file's last line). The amount is `Ledger.fmt(Math.abs(row.amount))` (`public/ledger.js:484`), so it never carries U+2212 or `-`.
- **How the effect word is derived (one rule, no table of cases).**
  - `SIGN[f]` is the `sign` of the `StatementLine` that `statementLines` returns for `LINE_KEY[f]` (`public/accounts.js:928-934`; FIGURES at 535-547). J keeps no copy.
  - `effect = Math.sign(SIGN[f] * raw)`. This is the part's contribution to `closing` (B9), which is the balance in the contractor's favour (`net > 0` is `مستحق له`, `public/accounts-view.js:372`).
  - `effect = +1` → «يزيد المستحق». `effect = -1` → «ينقص المستحق».
  - `raw = 0` → no part at all (skipped, as r4 skipped a zero delta).
  - `raw != 0` but `effect = 0` → the part is kept in `corrections` (so B9 and B12 still see it) but **not printed**. Only `settlements` has `SIGN 0` (`public/accounts.js:544`). Neither approved word is true of a settle, because it does not move the balance owed. Its change still shows in the closing line `سلف قائمة عليه`. This is a default; see §11 R5-Q2.
  - **Advance rows.** `advancesPaid` (`السلف المصروفة له`, sign −1) and `cashReturned` (`المُرجَع من السلف نقداً`, sign +1) use their own FIGURES signs, as in r4. Their signed sum equals the change in `netAdvances` (sign −1, `public/accounts.js:542`), which is what enters closing. So a reversed advance reads `يزيد المستحق` and a late return of advance cash reads `يزيد المستحق`; a late advance reads `ينقص المستحق`.
  - **«صافي السلف» is never a correction-row label.** Advance corrections keep their two labels, in the statement card and in «مستخلص». `صافي السلف` is only the period line (OPEN-15, §3.6).
- **Worked rows** (all from the B tests; `من/إلى` omitted):

  | Case | f, part | raw | SIGN | effect | Printed |
  |---|---|---|---|---|---|
  | B2: approval 600,000 reversed | approvedLabor, reversed | −600,000 | +1 | −1 | `عمل معتمد 600,000 د.ع، ينقص المستحق، …` |
  | B4: late `approveDeduct` 50,000 | deductions, late | +50,000 | −1 | −1 | `الخصومات ومرتجعات المواد 50,000 د.ع، ينقص المستحق، …` |
  | B5: late `payLabor` 100,000 | payments, late | +100,000 | −1 | −1 | `مدفوع للعمل 100,000 د.ع، ينقص المستحق، …` |
  | B5r: `payLabor` 600,000 reversed | payments, reversed | −600,000 | −1 | +1 | `مدفوع للعمل 600,000 د.ع، يزيد المستحق، …` (the accountant's mock that EA put to Ameer) |
  | advance 100,000 reversed | advancesPaid, reversed | −100,000 | −1 | +1 | `السلف المصروفة له 100,000 د.ع، يزيد المستحق، …` |
  | deduct 50,000 reversed | deductions, reversed | −50,000 | −1 | +1 | `الخصومات ومرتجعات المواد 50,000 د.ع، يزيد المستحق، …` |
  | refund 20,000 reversed | refunds (`paymentRefund`), reversed | −20,000 | +1 | −1 | `المُرجَع من الدفعة نقداً 20,000 د.ع، ينقص المستحق، …` |
  | settle 40,000 reversed | settlements, reversed | −40,000 | 0 | 0 | not printed (R5-Q2) |

- **Mixed window: the known downside of (ب), and how r5 handles it.** With one row per (figure, window), a late entry and a reversal in the same window net into one row (Architect E2: a late 100,000 payment plus a 600,000 reversal print as one `مدفوع للعمل 500,000 … يزيد المستحق`, and neither entry is visible; `PROPOSAL-M2-signs-r1.md:125`). r5 keeps the Architect's late/reversed split (`PROPOSAL-M2-signs-r1.md:51-54`), so each (figure, window) prints **up to two** rows in the same approved format. E2 prints `مدفوع للعمل 100,000 د.ع، ينقص المستحق، …` and then `مدفوع للعمل 600,000 د.ع، يزيد المستحق، …`. The Architect's objection to splitting under his own option B (that `مستحق عليه` reads badly on a payment row, :125) does not apply here, because «ينقص المستحق» reads naturally on any row. The split is built from `Accounts.statementLines`/`balances` only (one extra call per window), and the sum is unchanged. The word is taken from each part's own sign. It does not assume `late ≥ 0` or `reversed ≤ 0`; the Architect's fuzz saw those hold in 3,600 views (:76-81), but a late `sup_` could break them, and the word would still be right. A single netted row is the fallback if the Architect or the accountant prefers it (§11 R5-Q1).
- **One sign convention per card (internal).** The net and B9 apply `SIGN` to the raw parts, exactly as the period lines are folded. Display never changes a number.
- **Why per window.** Each row must say what it corrects and its source period (accountant). A row per (figure, issued window) carries both, and it uses only `Accounts.statementLines` and `Accounts.balances` (exported, `public/accounts.js`). J re-implements no counting rule (`countedAmount` at :317 is not exported and is not copied).
- **Completeness (r4, M-3; r3's line 225 claim was false).** r3 said "the windows partition every day a closing approval can reach". That was wrong: r3 used only approvals with `periodEnd < s`, but an approval ending on or after `s` can close a doc with `nd < s` (week 11-01..11-07 issued on 11-08 closes a `payLabor` dated 10-20 that arrives 11-10; viewed as the month of November, r3 printed no row, Architect probe `windows.out` W1). r4's argument:
  1. Every doc d booked inside P arrived before `issuedAt(P)` (else P's own issue row closes it and it books after `e`). Its closing approvals were created before `arrival(d)`, so all of them are in `pool(P)`. When P is not issued, the pool holds every synced approval, which is a superset.
  2. The clipped windows are contiguous from the start of time to `min(max pool periodEnd, s-1)`, so every day `<= s-1` that any pool approval reaches is in exactly one window.
  3. ~~An unclosed doc books at `nd < s` and has no delta.~~ **False for a deduct (r5 review M-1).** A deduct counts only while its `approveLabor` is live. A `rev_` of an approval in a closed window books inside P and stops a deduct dated on an **unclosed** day `< s` from counting; that change lies outside every window (Architect probe `cascade-r5.out`: `appr_m1` 300,000 on 10-05, October issued; `d1` 50,000 on 11-18; `rev_appr_m1` 11-24; view 11-23..11-29: B9 off by 50,000). Refunds on a reversed payment and returns on a reversed advance keep counting, so they do not have this problem (`cascade2-r5.out`).
  4. **r6 fix: the tail part.** The windows plus the tail T cover every day `<= s-1` exactly once, so per figure Σ parts = the `balances` delta over `periodEnd: s-1` **by construction**, whatever caused the delta (B12, B15, B24). B9 holds. The tail is the residual the review describes (delta minus Σ windows), computed directly as one more `statementLines` call.
- **The tail row (r6, M-1).** It is printed in the same approved format as any row, with `من <first tail day> إلى <s-1>`: the existing words, naming the days whose figures changed rather than an issued statement. No new string, no behaviour change. With an empty pool its delta is always 0 (no doc is closed, so every doc and marker books at its natural day before s); B20 asserts that. For an issued P the tail's bounds come from the frozen pool and s, so the issued card still never changes. How it happens: on one device it can't (I blocks reversing an approval with a live deduct, `public/accounts-correct.js:54`, `reversible` :707-733); it needs a second phone or a race, the same class as L-12.
- **Decided (`answers:47`, Ameer's own words; earlier `:40` with EA's record `:43`): block issuing on an orphan deduct; the tail row stays the display rule (r7, Architect r6 MEDIUM-1).** The **block** (§4.4, "Orphan deducts") stops «إصدار» while a live, approved `deduct` sits on an `approveLabor` that is not live, until the owner reverses the deduct with the same «عكس» button under the same approved sentence. What a reader sees after the reversal `rev_d1` depends on whether `d1`'s days were issued:
  - **`d1`'s days not issued** (B24(c)): `rev_d1` books at `d1`'s own day (11-18, no approval closes it), so it joins Bs for every later view. The tail delta goes to 0 and **the tail row disappears**; the opening rises by 50,000; B9 holds. The tail row only ever shows on an **unissued** display while the orphan lives; B25 blocks issuing any period with `nd(d1) ≤ periodEnd` in that time, so **no issued statement carries a tail deduct row**.
  - **`d1`'s days issued before `rev_appr_m1`** (B24(d)): the change is a **window** row `الخصومات ومرتجعات المواد 50,000 د.ع، يزيد المستحق، من 2026-11-16 إلى 2026-11-22`, present before and after `rev_d1`. This is the "baseline correction row for deductions reversed after an issue" in EA's record (`answers:43`).
  - No change to the tail definition. No new string.
- **Labels are frozen at issue (M-4).** The pool is fixed by `issuedAt(P)`, and approvals are append-only, so an older period issued later (allowed by M-1) cannot split a window of an issued P (Architect probe W2: the label stays `2026-10-01..2026-10-31`; B16). Before P is issued, its labels follow the approvals present at view time; that is display of an unissued statement and is allowed to move.
- **Ties (M-4).** Two approvals with the same `periodEnd` (an R2 duplicate, or a week ending on a month's last day) are ordered by `periodStart`, then `id`; the second clips to the same end and is skipped. One row per figure (probe W3; B17).
- **A label can name a shorter statement inside the viewed period (INFO for the accountant).** W1 under the fix labels the row `من 2026-11-01` `إلى 2026-11-07` in a month-of-November view. That is accurate: it is the issued statement whose opening the late doc changed. It is new to the accountant and is included in the OPEN-15 note (§11).
- **What a row says:** the FIGURES label (what is corrected), the positive amount and `د.ع` (`public/render.js:56`), the approved effect word (`answers:37`), then `من <periodStart>` and `إلى <periodEnd>` of the issued statement it corrects (the existing words at `public/accounts-view.js:459`). Dates are digits. The only new strings are the two approved words (§8). A doc dated in a gap before `A_k.periodStart` changed `A_k`'s opening, so it is labelled with `A_k`. J does not call `Accounts.periodBounds` (gj-sketch:473 respected).
- **All-projects view (LOW-15, Architect review r4 §4).** With no `projectId` in F, r4's pool was "every approval of the party", so a p2 document could fall into a window cut by a p1 approval and be labelled with a p1 statement it never touched (Architect probe `allproj.out`). r5 builds the parts **per project**: for each project p of the party (the resolved `projectId` of the party's docs; markers take their target's, §3.3 "Scope"), in ascending `projectId` order, using that project's docs and that project's pool (approvals with `projectId == p` or with no `projectId`). The parts are concatenated in that order. Each figure adds across projects, so B9 and B12 still hold. B19 tests it. Each project also gets its own tail (r6, M-1).
  - **Which issue time freezes the all-projects view (r6, LOW-4).** Every per-project pool is frozen at the **viewed P's** `issuedAt` in the all-projects scope, which is the earliest exact party-wide row (no `projectId`) for P's dates (§3.6 `issuedAt` with `projectId` absent). A project's own issue row does not freeze the all-projects view. The app never issues an all-projects statement (the issue card is always the agreement's project, §3.7), so normally that `issuedAt` is null and the pools are every synced approval: an unissued display, whose labels may move while the figures do not. A party-wide row from another client freezes it like any issued P. B16-all tests both.
- **Heading.** When at least one **printed** row exists, `تصحيحات فترات سابقة` (approved, answers:11) heads the rows. The rows sit after the period lines and before the closing/net line.

**Proof that an issued statement never changes.** The Architect reproduced this on the base fold (r1 review §2, P1/P2/P6/P7). The r3 sign change and the r5 display (split, effect word, absolute amount) are presentation only and do not touch it: the split parts are computed from the same frozen `Bs`, `Be` and pool.

1. Take any doc d in scope S with `arrival(d) > T`. Either A closes it, so `book >= nextDay(e)`, or `nd > e`.
2. So `bookedBy(·, e)` and `bookedBy(·, s-1)` depend only on docs that arrived by T.
3. Documents are append-only.
4. Therefore an issued statement's figures never change.
5. Its correction-row labels never change either, because `pool(P)` is frozen at `issuedAt(P)` (M-4).

**With no approval, `book = nd`, and the output equals today's `statementLines`.** B1 tests this.

**Issue only for a closed period (M-1, OPEN-2 decided).**

- The button shows only when `accountPeriod()` returns a period with `periodEnd < today()`.
- When the period is still open, the card shows `من` and `إلى` and no button. No new string.
- A mid-period issue cannot happen from the app. `nextDay(maxEnd)` stays in the rule because the rules permit any dates (`firestore.rules:1159-1168`), and a statement can come from another client.
- **OPEN-12 accepted (answers:20).** `accountPeriod()` follows the shared anchor (`public/accounts-view.js:97-123`). To issue last week, the owner types a date in last week into the existing `#statement-from` field on «حسابات» (`public/accounts-view.js:459`, `onInput` 609-615), then issues on «مقاول». The date picker stays as is; there is **no** 'previous period' option. J does not compute a period itself (gj-sketch:117-119, 473).

**Additivity.** One `book` per document, from its own scope. So the per-project statements add up to the consolidated one (B8).

### 3.4 Files touched

**New:**

| Path | Why |
|---|---|
| `public/accounts-statement.js` | The J module (§3.2). |
| `tests/accounts-statement.test.js` | J behaviour tests (§6.1). |
| `tests/strict-accounts-statement.test.js` | Strict-tsc gate. Same pattern as `tests/strict-accounts-correct.test.js`. |
| `tsconfig.strict-accounts-statement.json` | Includes `public/accounts-statement.js` and `types/checkjs.d.ts`. Same as `tsconfig.strict-accounts-correct.json:6`. |
| `scripts/verify-drives/accounts-statement.js` | Drives for `settle` and `statement-approval`. |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/settle.md`, `statement-approval.md` | Feature files (gj-sketch:395). |
| `tests/emulator/account-statement.test.js` | Sync round trip (§6.3). Any fixture that writes a settle, a `returnAdvance`, or a `rev_` of one directly uses the cap PR's `sendCapped` helper (`PLAN-cap.md` §6.3 :334-336) **[DEPENDS ON CAP FINAL]**. |
| `docs/plans/contractor-pr-j-sketch.md` | This plan, committed in the code PR. |

**Edited:**

| Path | Why |
|---|---|
| `public/accounts-view.js` | Overview (366-380): `owed` (372) becomes `balanceSentence(net)`, plus the `الكمية` tile. `statementHtml` (452-475): booked lines, the `تصحيحات فترات سابقة` heading and the r5 correction rows (positive amount, effect word, `من`/`إلى` source), «مستخلص» (with `صافي السلف`), then the project totals (with `المدفوع للمقاولين`) in a **separate card after** the statement card (L-4) (E-1). **Line 388 is not edited by J** (#110 already changed it). `commitDoc`, `syncTab`, and `actionHtml` are not edited. |
| `public/accounts-correct.js` | E-2: one branch after line 713 in `reversible` (707-733). OPEN-4: `SENTENCE.dependent` at line 54 becomes `اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً`. Painted at :927, unchanged. |
| `tests/accounts-correct.test.js` | `S5` at line 76 takes the new text; the three uses (689, 753, 1011) keep asserting it, and each also asserts the old text is absent. |
| `public/index.html` | One `<script src="accounts-statement.js">` between lines 75 and 76. |
| `public/sw.js` | `VERSION` (line 2: `aj-p0-v80` at 4d30d117; the cap PR takes `aj-p0-v81`; J takes the next free number at its cut, expected `aj-p0-v82` **[DEPENDS ON CAP FINAL]**), and `accounts-statement.js` in `ASSETS` (3) and `SHELL` (5). |
| `public/session.js` | `SHELL_FILES` key only (line 351). |
| `tests/shell-cache.test.js` | Script-order pin, like lines 82 and 92-93. |
| `tests/webkit-upgrade.test.js` | `MARK` (line 19). |
| `tests/accounts-view.test.js` | Lines 145, 214, 229, 245, and 260 (r4's 144-259, each +1 after #110 added an import at :15) move to `الرصيد المستحق` plus the direction (gj-sketch:465). The JQ3 assertion was added by #110 (:337-356), not by J. |
| `tests/browser-check.js` | J hashes in the scan lists (172, 179), and `cs-amount` in `AMOUNT_IDS` (line 17). |
| `package.json` | `"test"` (line 5, **45** files at 4d30d117: 44 under `tests/` plus `scripts/verify-aj.test.js`). The cap PR adds `tests/advance-cap.test.js` (46); J adds 2 (48) **[DEPENDS ON CAP FINAL]**; the code PR counts again at its base. `"typecheck"` (10) gains the strict tsconfig. `"test:emulator"` (7) gains the new file. |
| `.github/workflows/ci.yml` | The unit list (line 68, **45** files at 4d30d117, identical to `"test"`) and the emulator list (210). CI runs these explicit lists, not `npm test` (R5-Q6, confirmed by the r5 review LOW-5). **r6:** J adds `tests/accounts-statement.test.js` and `tests/strict-accounts-statement.test.js` to `ci.yml:68` **and** `"test"`, and `tests/emulator/account-statement.test.js` to `ci.yml:210` **and** `"test:emulator"`. |
| `types/checkjs.d.ts` | `AccountStatementApi`. `AccountStatement?: AccountModule` is already at :1273. `ActionTab` already has `'contractor'` (:861). |
| `scripts/verify-aj.js` | Dispatch `settle` and `statement-approval`, beside 1389-1392. |
| `.cursor/skills/verify-ahl-aljazeera-accounting/SKILL.md`, `features/README.md` | The two feature ids. |
| `docs/PSTACK_INVENTORY.md` | Evidence links only, like lines 274-275. |

**Not touched:** `public/accounts.js`, `public/sync.js`, `public/ledger.js`, `public/render.js`, `public/foremen.js`, `public/firebase-client.js`, `public/app.js`, `public/accounts-payment.js`, `public/accounts-work.js`, `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `.cursor/rules/pstack-models.mdc`.

### 3.5 Types (`types/checkjs.d.ts`)

```ts
type BookedFigure = 'approvedLabor' | 'payments' | 'refunds' | 'advancesPaid' | 'cashReturned' | 'deductions' | 'settlements';
interface CorrectionRow {
  key: BookedFigure; label: string;        // existing FIGURES label
  part: 'late' | 'reversed';               // r5: which telescoping part (§3.3); late + reversed = r4's raw delta
  kind: 'window' | 'tail';                 // r6 (M-1): tail = days after the last window up to s-1
  amount: number;                          // RAW signed part. Internal only: never printed with its sign
  effect: 1 | -1 | 0;                      // Math.sign(SIGN[key]·amount): +1 «يزيد المستحق», -1 «ينقص المستحق», 0 not printed
  source: { periodStart: string; periodEnd: string };  // the issued statement it corrects, or the tail days (من / إلى)
}
interface BookedStatement {
  periodStart: string; periodEnd: string;
  opening: number;
  lines: readonly StatementLine[];       // in-period FIGURES lines; opening line carries opening(P)
  corrections: readonly CorrectionRow[]; // raw != 0 only; heading تصحيحات فترات سابقة when one has effect != 0
  closing: number;                       // = opening + periodNet + Σ SIGN[key]·amount (B9)
  issuedAt: number | null;
  queuedIds: readonly string[];          // L-2: every in-scope doc still in the outbox with nd <= periodEnd
  pendingIds: readonly string[]; unreviewedCashIds: readonly string[]; overLimitIds: readonly string[];
  orphanDrawIds: readonly string[];      // L-12 (b), in J (answers:32): live settle/returnAdvance on a dead advance (§4.4)
}
interface Mustakhlas { work: number; deductions: number; advancesNet: number; corrections: readonly CorrectionRow[]; net: number; }
                                         // advancesNet is printed as the صافي السلف line (OPEN-15, answers:33)
interface ContractorTotals { cost: number; paidToContractors: number; oldPaid: number; unlinked: number; newApproved: number; newCash: number; reclassAdvance: 0; }
type IssueGateError = 'offline' | 'queued' | 'pull' | 'changed' | 'review' | 'period' | 'open' | 'inactive' | 'epoch';
interface IssueGateResult { ok: boolean; errors: readonly IssueGateError[]; }
interface AccountStatementApi extends AccountModule {
  bookDay(doc: FoldDoc, ctx: BookContext): string;
  bookedBy(docs: readonly FoldDoc[], day: string, ctx: BookContext): FoldDoc[];
  periodStatement(input: PeriodStatementInput): BookedStatement | null;
  mustakhlas(statement: BookedStatement): Mustakhlas;
  contractorTotals(entries: readonly LedgerEntry[], txns: readonly FoldDoc[], syncErrors: Readonly<Record<string, unknown>>, filter: { projectId: string }): ContractorTotals;
  approvedUnitQty(txns: readonly FoldDoc[], agreements: readonly object[], partyId: string, index: RowIndex, projectId?: string): number;
  balanceSentence(net: number): { label: string; direction: string; amountText: string };
  settleDoc(input: SettleInput): { doc: object | null; errors: string[] };
  statementApprovalDoc(input: StatementApprovalInput): { doc: object | null; errors: string[] };
  issueGate(input: IssueGateInput): Promise<IssueGateResult>;
}
interface BookContext { byId: Readonly<Record<string, FoldDoc>>; approvals: readonly StatementApprovalRow[]; syncErrors: Readonly<Record<string, unknown>>; today: string; }
interface PeriodStatementInput { docs: readonly FoldDoc[]; approvals: readonly StatementApprovalRow[]; syncErrors: Readonly<Record<string, unknown>>; outbox: readonly string[]; partyId: string; projectId?: string; periodKind: 'week' | 'month'; periodStart: string; periodEnd: string; today: string; }
interface IssueGateInput {
  shown: BookedStatement; recompute: () => BookedStatement | null;
  online: () => boolean;
  inFlight: () => Promise<unknown> | null;   // the global `flushing` (firebase-client.js:468), L-8
  flush: () => Promise<unknown>;             // flushRemote({ fromOutside: true })
  timeoutMs: number;                         // FLUSH_MS (firebase-client.js:471), L-8
  epoch: () => number;                       // sessionEpoch (session.js:13), L-8
  lastSyncAt: () => number; outbox: () => readonly string[]; now: () => number;
  demo: boolean; projectActive: boolean; today: string;
}
interface StatementApprovalRow { id: string; partyId: string; projectId?: string; periodKind: 'week' | 'month'; periodStart: string; periodEnd: string; createdBy: string; createdAtServer: number | null; }
interface SettleInput { measurementId: string; settlesId: string; amount: number; gen: string; txnDate: string; createdBy: string; deviceId: string; createdByName?: string; }
interface StatementApprovalInput { id: string; partyId: string; projectId?: string; periodKind: 'week' | 'month'; periodStart: string; periodEnd: string; createdBy: string; }
```

J does not extend `AccountsApi` or `RenderApi` (gj-sketch:113, 138). `lastSyncAt` is already on `RenderApi` (`types/checkjs.d.ts:841`). `ContractorTotals.cashOut` (r2) is renamed `paidToContractors` so the code name matches the approved label and is never mistaken for company cash (OPEN-7, OPEN-9b).

### 3.6 Functions and signatures (`public/accounts-statement.js`)

```javascript
function serverDay(doc, today)                       // baghdadDate(createdAtServer) or today() while queued
function naturalDay(doc, ctx)                        // nd(doc), depth ≤ 8
function bookDay(doc, ctx)                           // §3.3
function bookedBy(docs, day, ctx)                    // filter before rowIndex
function issuedAt(approvals, syncErrors, partyId, projectId, periodKind, periodStart, periodEnd)  // earliest exact match, else null
function tailWindow(windowsList, docsBe, periodStart) // §3.3 (r6, M-1): (last end, s-1], or all days <= s-1 with no window
function windows(approvals, ctx, scope, periodStart, issuedAtMs) // §3.3 (r4): pool frozen at issuedAtMs (all synced if null),
                                                     // any periodEnd, order (periodEnd, periodStart, id), clip at s-1, skip empty
function correctionRows(docs, ctx, filter, s, e)     // §3.3 (r5): late and reversed parts per (window, figure), raw != 0;
                                                     // with no filter.projectId, built per project and concatenated (LOW-15)
function correctionText(row)                         // label + ' ' + Ledger.fmt(Math.abs(amount)) + ' د.ع، ' + EFFECT_WORD[effect]
                                                     // + '، من ' + start + ' إلى ' + end; only for effect != 0
const EFFECT_WORD = { 1: 'يزيد المستحق', '-1': 'ينقص المستحق' };   // approved new strings (answers:37)
function orphanDrawIds(docs, index, filter, periodEnd) // L-12 (b), §4.4
const LINE_KEY = { approvedLabor: 'approvedLabor', payments: 'payments', refunds: 'paymentRefund', advancesPaid: 'advancesPaid',
                   cashReturned: 'cashReturned', deductions: 'deduct', settlements: 'settle' };
                                                     // label and sign of a correction row are read from the StatementLine
                                                     // that statementLines returns for LINE_KEY[f] (figureLines carries
                                                     // key, label, amount, sign: public/accounts.js:928-934). FIGURES is not
                                                     // exported; J keeps no copy of the labels or signs (one owner).
                                                     // The first window reads Accounts.balances, whose figure names are
                                                     // 'refunds'/'deductions'/'settlements'; later windows read statementLines,
                                                     // whose keys are 'paymentRefund'/'deduct'/'settle' (accounts.js:539, :543,
                                                     // :544). A wrong LINE_KEY silently zeroes those rows (Architect probe; B21).

/** The A6/C3 statement. Display only. null when bounds are missing.
 * queuedIds (L-2) = ids in outbox whose scope matches (party, project) and nd <= periodEnd
 * (not only in-period: the issue also locks the opening). */
function periodStatement(input)

/** «مستخلص» (gj-sketch:60, 463, 648; OPEN-1/OPEN-10; OPEN-15 answers:33; M-2 option (ب) answers:37):
 * rows in order: مستخلص; عمل معتمد (period approvedLabor); الخصومات ومرتجعات المواد (period deductions);
 *   صافي السلف (period netAdvances = advancesPaid − cashReturned, printed exactly as the statement card prints
 *   its صافي السلف line when advancesNet >= 0 (e.g. «صافي السلف 100,000 د.ع»). When advancesNet < 0 (returns >
 *   advances in the period; DECIDED answers:46, Ameer 08:52): «صافي السلف <fmt(|advancesNet|)> د.ع، يزيد المستحق»,
 *   reusing EFFECT_WORD[1]. Only in «مستخلص»; the statement card's own صافي السلف line is unchanged (out of scope);
 *   then, when one has effect != 0, the heading تصحيحات فترات سابقة and the printed correction rows for
 *   approvedLabor, deductions, advancesPaid, cashReturned (correctionText: positive amount, effect word, من/إلى);
 *   then الصافي (DECIDED, Ameer 09:08 answers:56, option الأول):
 *     fmt(|net|) + ' د.ع ' + (net >= 0 ? 'مستحق له' : 'مستحق عليه')   e.g. «الصافي 450,000 د.ع مستحق له»,
 *     «الصافي 80,000 د.ع مستحق عليه»  (existing words, public/accounts-view.js:372). No − or U+2212 on any line (D16).
 *   (History: r7 also carried option الثاني as a delta; Ameer chose الأول, so it is removed.)
 *   عمل معتمد and الخصومات ومرتجعات المواد are sums of counted docs booked in the period, never negative.
 * net = work - deductions - advancesNet + Σ SIGN[key]·amount over those rows (= Σ effect·|amount|).
 * There is no «صافي السلف» correction row: advance corrections keep their own two labels.
 * Payment, refund and settle corrections are not in «مستخلص» (it never subtracts payments). Writes nothing. */
function mustakhlas(statement)

/** Project totals, all time, not booked. Rendered OUTSIDE the statement card (L-4).
 * oldPaid     = Σ sign·amount of counted live 'subcontractor' entries on projectId WITH subcontractId
 *               (custody-paid rows with foremanId included: OPEN-9b approved).
 * unlinked    = the same, WITHOUT subcontractId («قيود بلا عقد», public/render.js:890).
 * newApproved = Σ rowCounts approveLabor on projectId (a deduct does not reduce it).
 * newCash     = rowCounts walk: +payLabor +advanceLabor −returnAdvance −refundLabor on projectId.
 * reclassAdvance = 0 (L-3).
 * cost              = oldPaid + unlinked + newApproved   (a record with no contract is always in cost)
 * paidToContractors = oldPaid + unlinked + newCash       (by actual payment status, §3.8; label المدفوع للمقاولين)
 * Returned to the statement tab's totals card only. Never passed to, or summed with, Ledger.totals,
 * Accounts.projectCost, the home figures or any project summary (OPEN-9b condition; D9). */
function contractorTotals(entries, txns, syncErrors, filter)

function approvedUnitQty(txns, agreements, partyId, index, projectId)
function balanceSentence(net)   // net 0 → الرصيد المستحق / 0 د.ع (JQ2, EA-relayed approved)

/** id 'stl_' + measurementId + '_' + gen; kind 'stl'; purpose 'settle'; targetId = measurementId; settlesId = advance.
 * Calls Accounts.post('settle', …) for 'range' | 'cap' | 'cumulative'. Fields = STL_REMOTE (sync.js:76) = hasOnly (rules:837).
 * errors also: 'targetId', 'settlesId', 'method' (gen order), 'inactive' (L-5). */
function settleDoc(input)      // after the cap job, the flush sends it via writeCapped (PLAN-cap §3.3); no J change
function settleGen(measurementId, index)

/** statementApprovals row with no figures, no deviceId, no createdAtDevice (rules:1183).
 * errors: 'period' (null bounds), 'open' (periodEnd >= today, M-1), 'review' (unreviewed, overLimit, queuedIds, or orphanDrawIds),
 * 'inactive' (L-5). */
function statementApprovalDoc(input)

/** L-1 with the L-8 conditions. Only onClick on [data-st-issue] calls this (never blocks(), a view, or render()).
 * shown is screen.shown, the exact object issueBlock rendered (L-13). onClick passes that reference; it never recomputes
 * before the gate.
 * 1. if !demo and !online() → 'offline'. No flush.
 * 2. e0 = epoch().
 * 3. Wait for any in-flight flush: p = inFlight(); if p, await race(p, timeoutMs) (settled or timed out, errors swallowed).
 *    Its pull may have started before the tap, so it never counts as the gate's pull.
 * 4. t0 = now()   (taken AFTER step 3).
 * 5. try { r = await race(flush(), timeoutMs) } catch → 'pull'.  r === TIMEOUT → 'pull'.
 *    (The FLUSH_MS watchdog clears `flushing` but does not settle `run`: firebase-client.js:726-731.)
 * 6. if epoch() !== e0 → 'epoch' (logout or re-login during the gate): no write, no redraw of the old session.
 * 7. if !demo: outbox() must be empty → else 'queued'; lastSyncAt() >= t0 → else 'pull'.
 * 8. next = recompute(); require deep-equal(next, shown) for opening, lines, corrections, closing, orphanDrawIds AND issuedAt
 *    → else 'changed' (issuedAt catches a second phone that already issued this period: §4.3 R2).
 * 9. if epoch() !== e0 → 'epoch'.  10. ok. The caller builds statementApprovalDoc and commitDoc in the same tick.
 * On any error, nothing is written; the button stays off and the screen redraws with the recomputed figures.
 * The redraw renders only; it never re-enters the gate (G11).
 * Demo (no network; queueDoc skips the flush, render.js:122-129): steps 1, 3, 5 and 7 are skipped. */
function issueGate(input)

function settleBlock(agreement, index)   // hidden unless projectOpen(agreement.projectId) (L-5)
function orphanBlock(statement)          // L-12 (b): the OPEN-4 sentence once, then each orphan row with its own عكس (§4.4)
function issueBlock(agreement, index)    // hidden unless projectOpen(...) (L-5); computes shown = periodStatement(...) for
                                         // { partyId, projectId: agreement.projectId } ONCE per render, stores it in screen.shown,
                                         // and renders THAT object (L-9, L-13); button only when periodEnd < today() (M-1),
                                         // issuedAt is null and orphanDrawIds is empty (L-12 (b))
function statementCardHtml(statement)    // the one renderer for a BookedStatement (issue card and «حسابات» statement card)
function blocks(arg)                     // '' unless owner && costOpen() && agreement resolves (same gate as H and I)
function onClick(button) / onInput(el)
function register()                      // 'settle', 'statement-approval', tab 'contractor'
function install(api)
```

`projectOpen` follows `public/accounts-correct.js:175-180`: the local project row must have `status === 'active'`. That mirrors `projectActive` in the rules (`firestore.rules:374-376`).

`groupThousands` and `plainAmount` come from `AccountPayment` (`public/accounts-payment.js:156`, 187; the digit fold is at 174; each moved −2 lines in #110).

### 3.7 UI deltas

**«مقاول» (`#contractor/<agreementId>`).**

- The cards show only for the owner, only while `costOpen()`, and only when the project is active (L-5). With the constant null nothing paints (`public/accounts-payment.js:1095`, `public/accounts-correct.js:947`). Drives set the constant at runtime (`scripts/verify-drives/accounts-correct.js:110`, 168).

**Save 11 card:**

- Heading: `تسوية سلفة`.
- A list of live advances. Each row is labelled `سلفة` and shows the amount and `txnDate`.
- `#cs-amount`, formatted with `groupThousands`.
- Button: `حفظ التسوية` (OPEN-7 approved).
- With no target or no `settlesId`, the button is off and no sentence shows (gj-sketch:620).
- On `cap` or `cumulative`, paint `المُرجَع والتسوية أكبر من السلفة` (Q19). The three amounts `السلف المصروفة له`, `المُرجَع من السلف نقداً`, and `تسوية سلفة` also show.
- On `range`, `amount`, `overflow`, or `inexact`: `المبلغ ليس عدداً صحيحاً`.
- A refused send shows `رُفض الإرسال`.
- Each settle row has `عكس`, which needs `سبب التصحيح` (§4.4 "The «عكس» button" describes the field and the flow; the same flow serves the orphan rows).

**Save 12 card (L-9):**

- `من` and `إلى` with the period dates.
- **The figures being issued** (L-9, L-13)
  - `issueBlock` computes `shown = periodStatement({ partyId, projectId: agreement.projectId, … })` once per render and keeps it in `screen.shown`. The card renders **that object** with `statementCardHtml`, and the tap hands **that same reference** to `issueGate` as `shown`, which step 8 deep-equals against `recompute()`. There is no second computation for the card.
  - Labels: `رصيد أول المدة`, the in-period FIGURES lines, then (if any printed row) `تصحيحات فترات سابقة` with the r5 rows (`correctionText`, §3.3), then `رصيد آخر المدة` in the r6 closing-line form (§3.7 statement tab).
  - The issue card is always scoped to the agreement's project. The «حسابات» statement card renders whatever scope the user picked there (one project or all, `readAccountScope`). The two are byte-equal **only** when «حسابات» is set to the agreement's project (D10 sets that). With «كل المشاريع» they can differ, by design.
- When `periodEnd < today()`, `issuedAt` is null and `orphanDrawIds` is empty, the button `إصدار كشف حساب` shows (OPEN-7 approved). Otherwise no button.
- Tapping runs `issueGate` (§3.6).
- Block notes, existing or approved:
  - `لا يُعتمد الكشف وفيه مبلغ غير مدقّق` (`public/accounts-view.js:463`) for unreviewed or over-limit cash;
  - `لا يُعتمد الكشف وفيه قيد لم يُرسل بعد` (OPEN-3, approved, answers:12) when `queuedIds` or the gate's `'queued'` blocks. It replaces r2's `لم يُرسل` fallback on this card.
  - **L-12 (b), in J:** when `orphanDrawIds` is non-empty, `اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً` once, then each orphan row with its label, amount, date and `عكس` (§4.4). The issue button is absent while the list is non-empty.
- `'offline'`, `'pull'`, `'changed'`, and `'epoch'` paint no sentence. The button stays off and the screen redraws.
- The card is hidden when the period is null.
- One tap writes one row.

**«حسابات» person page:**

**Overview:**

- `الرصيد المستحق` (OPEN-7 approved), then the direction, then `X د.ع`.
- `money(Math.abs(net))` is used, so U+2212 never shows.
- Net 0 shows `الرصيد المستحق` and `0 د.ع` (JQ2).
- `عمل معتمد`, `مدفوع للعمل`, and `سلف قائمة عليه` stay. **JQ5: Ameer was never asked, so this is its fallback** (answers:7).
- `الكمية` shows when above 0.

**Agreement card:** J does not change it. Since #110, `unit` already shows `حسب الإنجاز (الكمية × سعر الوحدة)` on both screens (L-10). J's D3 only asserts it.

**Statement tab:**

- **Statement card** (the issued content):
  - booked lines, with the opening line = opening(P);
  - when there are printed corrections: the heading `تصحيحات فترات سابقة` (approved), then up to two rows per (figure, issued window), each `correctionText(row)` (§3.3): the FIGURES label, the **positive** amount and `د.ع`, «ينقص المستحق» or «يزيد المستحق», and `من <start>` `إلى <end>` of the statement it corrects (M-2 option (ب), `answers:37`). No row shows U+2212 or `-` (D11);
  - `رصيد أول المدة` = opening and `رصيد آخر المدة` = closing. **DECIDED (Ameer 09:08, `answers:55` «إي، الرصيد يصير «مستحق عليه» بدل الناقص»; the question he answered covered both lines, `AMEER-card-J6-t2191s7670.md` (`e4d3529b…c697`): `:7` explanation ends «ونفس الشي لرصيد أول المدة.», `:17` step prompt «الرصيد يصير «100,000 د.ع مستحق عليه» بدل الناقص؟», `:18` Ameer's answer «١: إي، الرصيد يصير «مستحق عليه» بدل الناقص»).** Today this live screen prints both balance lines with `money(line.amount)` (`public/accounts-view.js:452-475`, so U+2212 when negative). J changes **both** lines: each prints the label, `money(Math.abs(x))`, then `مستحق له` when x ≥ 0 or `مستحق عليه` when x < 0 (the rule and words at `public/accounts-view.js:372`; 0 → `0 د.ع مستحق له`). J renders both lines in `statementCardHtml`; `statementLines` is unchanged. D14 and mutation 29.
  - (History: r9 held the opening line pending the filed card t2191s7670; r10 released it on the evidence above.)
  - The period lines, including the card's own `صافي السلف`, keep today's look (the optional question about the card's «صافي السلف» was not asked). (History: r7 also carried a "no" delta for both lines; it was removed in r8.);
  - the existing notes (`public/accounts-view.js:462-464`);
  - when the scope is one project and the period is set, the «مستخلص» block: `مستخلص`, `عمل معتمد`, `الخصومات ومرتجعات المواد`, `صافي السلف` (OPEN-15, `answers:33`), then (if any printed row) `تصحيحات فترات سابقة` and its rows, then `الصافي` (OPEN-7 approved).
- **A separate card after it** (L-4) holds the project totals, all time and not part of an issued statement:
  - `تكلفة المقاول`;
  - `قيود بلا عقد`;
  - `المدفوع للمقاولين` (OPEN-7: replaces `النقد الخارج` everywhere).
  - There is no `سلفة` or reclass line (L-3).
  - These figures appear on this card only (OPEN-9b condition, D9).
- There is no `act-` button.

### 3.8 OPEN-9: paid to contractors by payment status (DECIDED)

**Decision:** cash out follows actual payment status, not whether a contract exists (answers:13). Ameer confirmed **820,000** (answers:25). The accountant confirmed the arithmetic (r2 advice item 5).

**What the data model has at 4d30d117** (unchanged since 32bccf81):

- A ledger entry has **no payment-status field**. `shapeOk` lists the allowed keys (`firestore.rules:83`), and none of them is a paid/unpaid flag.
- A `subcontractor` row is always `direction == 'expense'` (`firestore.rules:118`): money already spent.
- A linked `subcontractor` row is counted as **paid** on the contract card (`الدفعات`, `public/render.js:889`; `subcontractBalance`, `public/ledger.js:499-502`).
- The unlinked card says only that the row is outside «المدفوع» and «المتبقي» because it has no contract (`public/render.js:890`).
- A row with `foremanId` was paid from custody. That is still a payment to the contractor.

**So every live, counted `subcontractor` ledger row is a payment**, and `paidToContractors` includes `unlinked`. The new-model half is already payment-based (`payLabor`, `advanceLabor` out; `returnAdvance`, `refundLabor` back; `approveLabor` never cash).

**The sketch example (gj-sketch:479), under this rule:**

| Item | Amount |
|---|---|
| oldPaid | 200,000 |
| unlinked | 40,000 |
| newApproved | 600,000 |
| new cash: `payLabor` 400,000 + ordinary `advanceLabor` 100,000 + the L-style advance 80,000 | 580,000 |

- **`تكلفة المقاول`** = 200,000 + 40,000 + 600,000 = **840,000**.
- **`المدفوع للمقاولين`** = 200,000 + 40,000 + 580,000 = **820,000** (confirmed; the sketch's 780,000 is replaced).
- The 80,000 advance stays inside new cash. L-3 only hides its separate line.

**OPEN-9b (DECIDED, answers:26).** Custody-paid (`foremanId`) `subcontractor` rows count in `المدفوع للمقاولين`, because the money reached the contractor. **Condition (accountant, 2304 item 2 and r2 item 4):** this figure is never summed with company cash. Company cash counts the money once, when custody is handed to the foreman. So:

- `paidToContractors` has exactly one consumer: the statement tab's totals card (§3.7).
- It is not passed to `Ledger.totals` (`public/ledger.js:27`), `Accounts.projectCost` (`public/accounts.js:1043`), the home `إجمالي المصروف` (`public/render.js:676`), the project card `المصروف` (`public/render.js:749`, 764, 768), the box, or any CSV.
- Test D9 and mutation 13 hold this.

---

## 4. Rules for the writes, and the issue gate

### 4.1 Rules deltas

**None.** The Architect confirmed this (r1 review §1, emulator 137/137). `firestore.rules` must not appear in J's diff. The cap job's rules change is its own PR, merged and deployed under its own approvals (§4.5).

### 4.2 Issue gate

`statementApprovalDoc` builds no document and returns an error in these cases:

- `'period'`: the bounds are null.
- `'open'`: `periodEnd >= today()` (M-1).
- `'inactive'`: the project is not active (L-5).
- `'review'`: the statement has any `unreviewedCashIds`, `overLimitIds`, `queuedIds`, or `orphanDrawIds`. `queuedIds` covers every in-scope doc with `nd <= periodEnd`, including docs dated before `periodStart` (L-2). `orphanDrawIds` is L-12 (b) (§4.4, `answers:32`).

`issueGate` then adds `'offline'`, `'queued'`, `'pull'`, `'changed'` (L-1) and `'epoch'` (L-8), with the L-8 conditions in §3.6 steps 2-9.

**Screen sentences:**

- `لا يُعتمد الكشف وفيه مبلغ غير مدقّق` (`public/accounts-view.js:463`) for unreviewed or over-limit cash.
- `لا يُعتمد الكشف وفيه قيد لم يُرسل بعد` for `queuedIds` or `'queued'` (OPEN-3, approved new string, answers:12).
- `اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً` for `orphanDrawIds`, with the orphan list (L-12 (b), `answers:32`; §4.4). Each sentence shows only for its own cause, so one card can show more than one.
- `'offline'`, `'pull'`, `'changed'`, and `'epoch'` paint no sentence. The button stays off and the screen redraws (render only).

### 4.3 OPEN-11 raised: a second owner phone exists (answers:21)

r2 rated OPEN-11 LOW, on the assumption of one owner device. Ameer says a second owner phone is in use, so **r3 rates it MEDIUM** and shows the cover.

**What the L-1 / L-8 gate covers** (phone A issues; phone B writes):

| Case | Cover | Test |
|---|---|---|
| B wrote a doc in P that reached the server before A's tap, but A has not pulled it | Step 5 forces a flush whose pull starts after t0; step 8 recompute differs → `'changed'`, no row, redraw with the new figures | G4, E6 |
| A pull was already running when A tapped (it may have started before B's write) | Step 3 waits for it and step 4 takes t0 after it, so only a fresh pull passes `lastSyncAt >= t0` | G7 |
| The flush hangs (watchdog clears `flushing` but never settles `run`, `public/firebase-client.js:726-731`) | Step 5 races `FLUSH_MS` → `'pull'` | G8 |
| The flush rejects | try/catch → `'pull'` | G9 |
| Logout or account switch during the gate | `'epoch'`, no write | G10 |
| A redraw re-entering the gate (PR #86-style loop) | Only `onClick` calls `issueGate` | G11 |
| B already issued the same period, and A pulls it | `issuedAt` is in the compare → `'changed'`; after the redraw the button is hidden because `issuedAt` is set | G12 |
| B's doc arrives after A's approval stamp | Booked into a later period by the closing-approval rule; the issued statement is unchanged | B2, B5, E3 |
| B's settle with the same id as A's (`stl_<m>_<gen>`) | **r6 (r5 review M-2):** the id is deterministic and the rules refuse the second create (no update), but the client does **not** show `رُفض الإرسال`. On `permission-denied`, `readDependency` finds the server row and `adoptFound` adopts it: a same-content settle is a plain adopt; a different `settlesId` or amount is adopted and the local one goes to `linkRefusals` with a minted id (`public/sync.js:1013-1019`; E27 asserts `failed.length === 0` and `linkRefusals[0].localId === 'minted-stl'`, `tests/emulator/account-adopt.test.js:329-345`). Never `syncErrors`. After the cap, an op already on the server takes the same path through the coded `already-exists` error (cap review B-1; `PLAN-cap-r2.md` :253, :280). | E7 |

**Residual risks: Architect rulings recorded (r3 review §4).** OPEN-11 is **accepted as MEDIUM** as a risk class, with the cover above.

- **R1. Seconds-wide race between A's recompute and A's approval stamp. Ruled INFO, option (a).** A doc from B stamped after A's step 8 but before A's approval reaches the server is not closed, so it counts inside P. From the stamp on, the issued statement is fixed (A6/C3 proof). It can differ from what A saw for those seconds only. Option (b) is dropped: the card always shows the canonical figures, so it adds nothing.
- **R2. Both phones issue the same period within that window. Ruled harmless after M-4.** Two `statementApprovals` rows (uuid ids; `firestore.rules:1174-1185` allows both). Figures are unaffected (`issuedAt` = earliest; B10). With the M-4 tie order, the duplicate gives one window and one row per figure (B17). No deterministic id; no rules or sync change.
- **R3. Two phones settling or returning the same advance. Was LOW-MEDIUM (OPEN-6); r5: closed as "done by the cap job" [DEPENDS ON CAP FINAL].** At 4d30d117 the server caps are per document only: a settle at `firestore.rules:858`, a return in `returnAdvanceCreate` (`firestore.rules:893-918`, cap at :914). The cumulative check is client-side (`public/accounts.js:404`). Ameer chose a server cap as a separate job before J (`answers:31`). Its INV-1 (`PLAN-cap.md` §1.1 :50) refuses any settle or return that would take the advance's live draws past its amount, at commit time, also across two phones (:55, test C7). What stays in J:
  - J's `'review'` gate on `overLimitIds` stays, for legacy advances that were already over before the cap (`PLAN-cap.md` §5 :280-283, §7 :377);
  - L-12 orphans are not seen by the cap (a reversal of the **advance** moves no counter, `PLAN-cap.md` §7 :371), so §4.4 stays;
  - `refundLabor` on a `payLabor` keeps the old race class (`PLAN-cap.md` Q-A2, R7). It is not an advance draw and not in J's scope.
- **R4. Ruled LOW. It is L-12** (§4.4). r5: option (b) is in J (`answers:32`).

### 4.4 L-12: an advance reversed while a settle or return on it is live. **Option (b) is in J** (`answers:32`)

**The gap, at 4d30d117** (unchanged since 32bccf81). `overLimitIds` (`public/accounts.js:857-863`) loops only over docs that count (`rowCounts`, :859). A reversed (dead) `advanceLabor` is skipped. Its live `settle` and `returnAdvance` rows still add to `drawOn` (:851-852) and to `settlements`. So `سلف قائمة عليه` can go negative, nothing is flagged, and r4's `'review'` check lets the issue through. E-2 blocks this order of events on one device only; a second phone can race it (A reverses the advance while B settles it, or B's settle is already on the server but not yet pulled by A). The cap job does not close it: a reversal of the advance moves no counter (`PLAN-cap.md` §7 :371, :377).

**Ameer's answer (verbatim, `answers:32`):** «إي، نمنع الإصدار ويطلع زر «عكس» ويا جملة «اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً»». Accountant recommended it (`ACCOUNTANT-advice-J-r3.md` item 2). It is now commit 4 of J (§7), not optional.

- **Detection (J's file, display only).** `orphanDrawIds(docs, index, filter, periodEnd)` = ids of docs in P's scope with `nd <= periodEnd` that are live (`Accounts.rowLive`) and are either a `settle` whose `settlesId`, or a `returnAdvance` whose `targetId`, names an `advanceLabor` that is **not** live in the same index. It uses only the exported `Accounts.rowIndex`/`rowLive`; no `accounts.js` change.
- **Orphan deducts (r6, DECIDED; source `answers:47`, Ameer 08:52 «الخصم المربوط: إي، نمنع الإصدار لحد ما ينعكس»; Architect r5 review M-1).** `orphanDrawIds` also takes every doc in P's scope with `nd <= periodEnd` that is a live `deduct` with a live `approveDeduct` (`appr_<id>`, so it was approved) whose `targetId` names an `approveLabor` that is **not** live. The field keeps its name (one list, one gate); its rows are labelled `الخصومات ومرتجعات المواد` (`public/accounts.js:543`). It is not limited to undated or uncovered days, nor to the deduct's own week: **every** period with `nd <= periodEnd` is blocked while the orphan lives (r7, Architect r6 LOW-2; B25 control (e)). A `rev_` of a deduct is accepted by the rules (`revCreate` allows kind `body` with no liveness check, `firestore.rules:1073-1100`) and is not a cap draw (`PLAN-cap.md` §1.2 :60-63), so the cap does not touch it. How it can arise: only by a second phone or a race, because I blocks reversing an approval with a live deduct on one device (`public/accounts-correct.js:54`, :707-733).
- **Gate.** `BookedStatement.orphanDrawIds` is a field of the type in §3.5, filled by `periodStatement`. It joins `'review'` in `statementApprovalDoc`, and the step 8 deep-equal compares it too.
- **LOW-16 (one wording everywhere).** r4 §4.4 called `orphanDrawIds` a "new field, empty in the default scope" while r4 §7 said commit 4 "is not written (no dead flag)". With (b) in J, both now say the same: the field is part of `BookedStatement` (§3.5), added by commit 4, and it is always computed. There is no flag and no "default scope" any more.
- **Message.** Above the orphan list, the **approved OPEN-4 sentence** `اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً` (`answers:17`), in the new place Ameer approved (`answers:32`; Architect INFO-1). Each orphan row then shows existing labels only: `تسوية سلفة`, `المُرجَع من السلف نقداً` or (r6) `الخصومات ومرتجعات المواد` (`public/accounts.js:544`, 541, 543), its amount and its date. The sentence names «الخصم المرتبط», so it fits the deduct case literally (`answers:43`). No new Arabic string.
- **The «عكس» button, described accurately (LOW-17).** This is a **write path in a new place**, not a read-only list:
  - Each orphan row has a button labelled `عكس` (`public/accounts-correct.js:39`). It runs I's existing reversal: J builds the doc with `AccountCorrect.reversalDoc({ targetId, reason, … })` (`public/accounts-correct.js:539-580`, which accepts kind `stl` and `returnAdvance`) and commits it with `AccountsView.commitDoc`, exactly as J's settle-row `عكس` on the Save 11 card. It writes one `rev_<orphanId>` with `reversalReason`.
  - It needs a reason. The button is off until the existing `سبب التصحيح` field (`public/accounts-correct.js:41`) holds a non-empty reason, as in I's card (`public/accounts-correct.js:913-937`). One tap then writes it. There is no confirm step: I asks for a confirm only when reversing an approval would leave the contractor owing (`public/accounts-correct.js:1011-1016`), which never applies to a settle or a return.
  - A second tap, or a second button for the same row (I's own reversal card on the same page lists a live orphan `returnAdvance`, `public/accounts-correct.js:707-733`), writes nothing new: the id `rev_<orphanId>` is deterministic and `commitDoc` dedupes it.
  - **After the cap job [DEPENDS ON CAP FINAL]:** the `rev_` is a capped op with a negative delta. It is sent through `writeCapped` and frees capacity. J relies on the cap's rule **"reversals are always accepted"**, even on a dead advance and even with no counter yet. That holds **only after cap review M-1** (the reversal clamp `drawn = max(0, prev + delta)`, no `negative` refusal; `PLAN-cap-r3.md` :66-68, :229) and with cap **C19** and **C21** (`PLAN-cap-r3.md` :413-414). Cap r1 as written (`PLAN-cap.md` U2 `negative`) would not give it. E9 proves it end to end.
  - The button is hidden when the project is not active (L-5) and while the cost constant is null (D7).
- **Tests.** B18 flips; S9 drives the full reversal flow (tap and reason, not a direct builder call); D12 checks the card text; E9 runs the reversal through the real flush; mutation 22. r6 orphan deducts: B25, S10, E10, mutation 32.
- **Effect.** Stricter issuing, and one new place to reverse a row that I can already reverse. It never hides data.

### 4.5 OPEN-6: server-side cumulative cap. **Done by the separate cap job, merged before J** (`answers:31`)

**Ameer's answer (verbatim, `answers:31`):** «إي، السقف بشغلة منفصلة قبل J». The plan is `/workspace/tmp/cap-plan/PLAN-cap.md` (sha `a74a0514…`, r1, under Architect review). Its rules deploy needs its own Ameer approval, with the live ruleset saved first (`PLAN-cap.md` §9 :397-417).

**r7 status (cap; r10 card cite `AMEER-card-CAP-t2190s7664.md` (`699871c9…e13b`): `:17` «١: إي، تطلع «المُرجَع والتسوية أكبر من السلفة»», `:19` «٢: إي، خطوات النشر تمام», `:21` «٣: إي، طلب 110 ينزل ويا السقف بنشرة وحدة»):** `PLAN-cap-r3.md` (`e02a5880…`) is **CONFIRMED** and its code is being built by one cloud agent (`cloud-prompt-cap.md`, `3f23ece1…`). Ameer's 09:00 answers to the cap card (`answers:50-52`): a **true over-cap refusal at send** shows the approved Q19 sentence «المُرجَع والتسوية أكبر من السلفة» instead of «رُفض الإرسال» (`:50`; the cap's only new string placement); the deploy steps with the 2-minute wait are approved (`:51`); #110 ships in the same deploy as the cap (`:52`). The line cites below are to r3; r2's cites in r6 moved as follows: clamp r2 :59-63/:224 → r3 :66-68/:229; B-1 r2 :253/:280 → r3 :258/:278, :290; C19/C21 r2 :403-404 → r3 :413-414; CI lists r3 :308, :460, :462; J's deploy and «عكس» r3 :480-481; failure UX r3 §8 :488-495.

**What J takes from the cap job. Every item is [DEPENDS ON CAP FINAL]:** if the Architect's review changes the cap plan, J follows its final shape and §16 records it.

| Item | J at r5 | Cap plan source |
|---|---|---|
| Order | J's code head is cut from main **after** the cap PR merges. | `answers:31`; `PLAN-cap.md` :5, §7 :374-379 |
| sw version | Cap takes `aj-p0-v81`; J takes the next free number at its cut, expected `aj-p0-v82`. | §3.4 :241; §7 :379 |
| J's settles | `settleDoc` commits through the outbox; the cap's `writeLocal` branch sends it through `writeCapped` with its counter. No J code calls the cap. | §3.3 :209-228; §7 :375 |
| J's reversals of a settle or a return (Save 11 `عكس`, orphan `عكس`) | A `rev_` of a draw, also sent through `writeCapped`; it frees capacity. "Reversals are always accepted" holds only after cap M-1 (clamp) with C19/C21. | r1 §1.1 :52, §7 :370; r2 :59-63, :224, :403-404 |
| Returns | J writes no `returnAdvance`; H's form does, and it is capped with no J change. | §3.4 :252; §7 :369-373 |
| Test fixtures | J's emulator fixtures that write a settle, a return or a `rev_` of one directly go through `sendCapped`. Real-flush tests (E1, E8, E9) go through `writeCapped`. | §6.3 :334-336; §7 :378 |
| Send-time refusal (r7) | A **true over-cap** refusal at send (J's settle from a second phone or an offline replay) shows the approved Q19 sentence `المُرجَع والتسوية أكبر من السلفة` on that row (Ameer `answers:50`, 09:00), not `رُفض الإرسال`; the row is final and leaves the balances. Q19 also stays the entry-time message on J's settle form. An op already on the server is adopted (B-1), and a stale read is retried (B-2), so neither shows either string. J adds no string for this: the placement is the cap PR's. E8 asserts it. | `answers:50`; `cloud-prompt-cap.md:7`; r3 §8 :488-495 (r3's "default no change" is superseded by `:50`) |
| J's `'review'` gate | Kept: `overLimitIds` for legacy over-limit advances, and `orphanDrawIds` (L-12 (b)) that the cap cannot see. | §7 :377 |
| Rules cites in J | Re-read at J's base; the cap PR adds lines to `firestore.rules`. | §7 :379 |
| Deploy order (r6, LOW-2; r7: steps approved, `answers:51`; r10: the card `AMEER-card-CAP-t2190s7664.md` (`699871c9…e13b`) `:9` shows the steps apply to every later update «ومنه J، وكل تحديث يحتاج موافقتك بوقته.») | **After the cap merge, any hosting deploy from main (J included) is rules + hosting together, with the cap's pre-check, saved live ruleset, 2-minute wait and rollback pair.** No hosting from any main SHA at or after the cap merge may go live before the cap rules are live plus the 2-minute wait. Reason: every such SHA carries the cap client, whose `writeCapped` write to `advanceCaps` the pre-cap rules deny. | cap review r1 M-3; cap review r2 LOW-2 (`REVIEW-plan-cap-r2-db910576.md:65`); §9 |

- **Named cap dependencies (r6, LOW-1; r7 cites `PLAN-cap-r3.md`).** J relies on these cap review items being in the merged cap PR:
  - **B-1** (op already on the server → coded `already-exists` → `readDependency` → `adoptFound`, never a false refusal; r3 :258, :278, :290). E7 and every J re-send rely on it.
  - **B-2** (a stale transaction is retried, not refused). E8's loser may reach its refusal through the retry path; E8 stays a true over-cap (60,000 + 50,000 on 100,000).
  - **M-1** (the reversal clamp; "reversals are always accepted"; r3 :66-68, :229, :481). S9, E9 and the Save 11 `عكس` rely on it. (A `rev_` of a deduct is not a capped op, r3 §1.2; S10/E10 do not rely on M-1.)
  - **C19 / C21** (a `rev_` of a draw on a reversed advance, with and without a counter; the first op with no counter may be a reversal; r3 :413-414). E9 relies on them. This was R5-Q7.
  - **M-3** (the 2-minute wait after deploy and rollback; r3 :508, :527, :536; approved by Ameer `answers:51`). The deploy rule above relies on it.
  - **Q-A1 = yes** (`answers:50`): the true over-cap row shows `المُرجَع والتسوية أكبر من السلفة`. E8 relies on it.
  - **Rule for J's tests:** no J test may expect a **fitting** capped op to be refused.
- **PLAN-J R3 (§4.3) and this section close as "done by the cap job"** once the cap PR is merged. Until the cap plan is CONFIRMED and merged, they stay open in §11.
- **In J:** still no rules, `sync.js`, `firebase-client.js` or `accounts.js` change.

---

## 5. Named exceptions to the sketch

- **E-1. ACCEPTED (r1 review §3).** `statementHtml` (`public/accounts-view.js:452-475`) shows booked lines and the correction rows. The totals sit in a separate card (L-4).
- **E-2. ACCEPTED (r1 review §3), `settlesId` fix in r2, sentence in r3.**
  - In `reversible` (`public/accounts-correct.js:707-733`), right after line 713 (the `returnAdvance` dependent): an `advanceLabor` returns `'dependent'` when a live `settle` row exists with `settlesId === row.id`.
  - It does **not** use `livePointer`, which matches `targetId` (`public/accounts-correct.js:735-741`).
  - The A14(b) sentence at `public/accounts-correct.js:54` becomes `اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً` (OPEN-4, approved, answers:17), so the owner knows to reverse the settle first. It is shown for every `dependent` case, as today (:927).
- **E-3. ACCEPTED WITH CONDITIONS (r2 review §2, OPEN-8b).**
  - The issue tap calls the global `flushRemote({ fromOutside: true })` (`public/firebase-client.js:709-734`) and `api.lastSyncAt()`. gj-sketch:121 says these screens "do not call `flushRemote`", because `queueDoc` already flushes; the gate is a different need (a pull that starts after the tap).
  - Conditions, all in §3.6 steps 2-9 and tested by G7-G11: await any in-flight flush (`flushing`, :714) before t0; race the flush against `FLUSH_MS` (:471) → `'pull'`; try/catch → `'pull'`; abort with no write if `sessionEpoch` changes (`public/session.js:13`, bumped at 243 and 416); never reached from a render or redraw path.
  - `fromOutside` resets `flushRearm` (:711), like every user-initiated flush; one call per tap is not a loop.

---

## 6. Test plan

### 6.1 Unit: `tests/accounts-statement.test.js`

Expected numbers are fixture constants. They are never computed by calling the walk (gj-sketch:479).

**Booking and A6/C3 (r5 correction rows, M-2 option (ب)).** Row texts below are the full `correctionText`; `من …` stands for the source dates given in each test.

- **B1 – no approvals.** For every `accounts-view` fixture and the 600k/50k/100k/30k fixture, the lines equal `Accounts.statementLines`, there are no corrections, no heading, and `issuedAt` is null.
- **B2 – correction after the issue.**
  - Setup: `approveLabor` 600,000 dated 10-10; October issued 11-02; `rev_` stamped 11-05.
  - October deep-equals before and after the `rev_`: `عمل معتمد` 600,000, closing 600,000.
  - November: opening 600,000; heading `تصحيحات فترات سابقة`; one row, `عمل معتمد 600,000 د.ع، ينقص المستحق، من 2026-10-01 إلى 2026-10-31` (internal raw −600,000, part `reversed`); closing 0.
- **B3 – no approval.** October shows 0, retroactive, which is today's behaviour. November has no correction. Red at base for the A6/C3 property.
- **B4 – late approval of a deduct.** A deduct dated 10-20; October issued 11-01; `approveDeduct` arrives 11-03. October has no deduction. November has the row `الخصومات ومرتجعات المواد 50,000 د.ع، ينقص المستحق، من 2026-10-01 إلى 2026-10-31` (raw +50,000, part `late`), and closing falls by 50,000 through `SIGN` −1.
- **B5 – late body.** October issued; a `payLabor` dated 10-25, stamped 11-04. It books 11-04 and shows as the November row `مدفوع للعمل 100,000 د.ع، ينقص المستحق، من 2026-10-01 إلى 2026-10-31` (raw +100,000, part `late`); closing falls by 100,000. October is unchanged.
- **B5r – reversed payment (Architect probe P1).** A 600,000 `payLabor` dated 10-15, October issued, `rev_` stamped 11-03: November row `مدفوع للعمل 600,000 د.ع، يزيد المستحق، من 2026-10-01 إلى 2026-10-31`, which is the accountant's mock that EA put to Ameer (`AMEER-card-M2-t2173s7591.md`), character for character (raw −600,000, part `reversed`); closing rises by 600,000.
- **B6 – closed period only (M-1).**
  - (a) Today 2026-11-24, anchor in week 11-22..11-28: no `إصدار كشف حساب` button; `statementApprovalDoc` returns `['open']`.
  - (b) Anchor 2026-11-18, week 11-15..11-21: the button shows. Issuing writes one row. An `approveLabor` dated 11-20 that arrives 11-25 books 11-25 (the open week) as a correction row. The issued week deep-equals itself.
  - (c) A statement approval created mid-period by another client (admin fixture) still freezes: a row dated inside it that arrives later books `nextDay(periodEnd)`.
- **B7 – queued.**
  - (a) A queued `rev_` books today provisionally, appears in `queuedIds`, and the builder returns `['review']`. Once stamped later, it books on that day.
  - (b) **L-2:** a queued `payLabor` dated 2026-11-10, before `periodStart` 11-15, appears in `queuedIds` for week 11-15..11-21 and blocks the issue; the card paints `لا يُعتمد الكشف وفيه قيد لم يُرسل بعد`.
  - (c) A queued doc of another project, or dated after `periodEnd`, does not block.
- **B8 – scope.** A project-X approval does not close project Y. A consolidated approval closes both. X + Y = consolidated, for opening, each line, the corrections (per figure), and closing.
- **B9 – identity.** `closing === opening + periodNet + Σ SIGN[row.key] * row.amount`, for every fixture.
- **B10 – edge rules.** An approval in `syncErrors`, or a queued approval, closes nothing. With two approvals, the earlier `issuedAt` wins. A `rej_` takes its scope from its target. A tie of equal stamps leaves the doc unclosed (the `<` rule).
- **B11 – Baghdad day.** 21:30Z gives 11-01, and 20:59Z gives 10-31. A spy proves that `baghdadDate` is the function called.
- **B12 – parts add up per figure.** For every fixture, Σ of `corrections` (all parts, printed or not) of figure f = `balances(bookedBy(e), periodEnd s-1)_f − balances(bookedBy(s-1), periodEnd s-1)_f`.
- **B13 – one sign convention and one word rule.** (a) In every fixture where the only late documents are `rev_`/`rej_` markers, every part is `reversed` and its raw amount is `< 0`. (b) Each row's sign used by B9 equals the `sign` of the `statementLines` line with the same label (no second copy of FIGURES). (c) Every printed row's word is `يزيد المستحق` exactly when `SIGN·amount > 0` and `ينقص المستحق` exactly when it is `< 0`.
- **B14 – source window.** Weeks 10-04..10-10 and 10-18..10-24 issued. A late doc dated 10-07 is labelled `من 2026-10-04` `إلى 2026-10-10`; one dated 10-14 (gap, opening of the second week) is labelled `من 2026-10-18` `إلى 2026-10-24`. Two rows, not merged.
- **B15 – approval ending on or after s (M-3, probe W1).** Week 11-01..11-07 issued 11-08; a `payLabor` 100,000 dated 10-20 arrives 11-10; view the month 11-01..11-30 (October not issued). One row `مدفوع للعمل 100,000 د.ع، ينقص المستحق، من 2026-11-01 إلى 2026-11-07`; Σ parts = per-figure delta = 100,000; B9 holds on the printed card.
- **B16 – an older period issued later leaves P's card byte-equal (M-4, probe W2).** October issued 11-01; a `payLabor` 100,000 dated 10-20 arrives 11-10; November issued 12-02: row labelled `من 2026-10-01` `إلى 2026-10-31`. Then the week 10-18..10-24 is issued on 12-05. November's issued statement card is byte-equal before and after; the label is still October.
- **B16-all (r6, LOW-4).** The B16 world, two projects. (a) No party-wide row: the all-projects view's figures are equal before and after the 12-05 issue; its labels may move (unissued display), and the test records that. (b) An admin fixture writes a party-wide November row on 12-02: the all-projects November card is byte-equal before and after the 12-05 issue, because each project's pool is frozen at that row's `issuedAt`.
- **B17 – ties (M-4, probe W3).** (a) A duplicate October approval (same dates, later stamp, different id) gives one window and one row per figure. (b) A week 10-25..10-31 and the month 10-01..10-31 (same `periodEnd`) give one window, labelled by the order `(periodEnd, periodStart, id)` (the month, earlier `periodStart`). Rows sum to the delta in both.
- **B18 – L-12 (b), flipped from r4 (`answers:32`).** Advance `adv` 100,000; an approved measurement `m` (`appr_m` 500,000); live `stl_m_1` 40,000 with `settlesId: 'adv'`; then `rev_adv`, written by a fixture that bypasses E-2 (as a second phone would). r4 measured the base fold: `overLimitIds` empty and `سلف قائمة عليه` −40,000 (`probe-r4/l12.js`). r5 asserts: `orphanDrawIds` is `['stl_m_1']`, `statementApprovalDoc` returns `['review']`, and the issue card shows the OPEN-4 sentence, the row `تسوية سلفة` 40,000 with its date and `عكس`, and no `إصدار كشف حساب`. With a live `returnAdvance` 30,000 added, both ids are listed. A live advance (control) gives `orphanDrawIds` empty.
- **B19 – all-projects labels (LOW-15, Architect probe `allproj.js`).** A p2 `payLabor` 100,000 dated 10-20 arrives 11-10 and is closed by p2's October approval; a p1 week 10-18..10-24 was issued 10-25. The p2 view and the all-projects view both print `مدفوع للعمل 100,000 د.ع، ينقص المستحق، من 2026-10-01 إلى 2026-10-31`. In the all-projects view no row is labelled `من 2026-10-18 إلى 2026-10-24`, and B9 and B12 hold.
- **B20 – the r5 invariant (adapted from the Architect's B20, `PROPOSAL-M2-signs-r1.md:106`).** For every B fixture, plus a seeded generator in the test file (approvals, deducts with `approveDeduct`, refunds, advances, returns, settles, `rev_` of each, party-wide approvals, **two projects**, and **r6 (M-1): a deduct on a later-reversed approval, dated on an unclosed day**; seed and counts are fixture constants), with windows and the tail: per (figure, window) `late + reversed` equals r4's raw delta, computed independently as `amt(Be) − amt(Bs)`; every part has `raw != 0`; `effect === Math.sign(SIGN·raw)`; `Σ effect·|amount|` over printed rows equals `closing − opening − periodNet`; and with an empty pool the tail's parts are all zero. Sign bounds (`late ≥ 0`, `reversed ≤ 0`) are asserted only on the fixtures with no `sup_` doc; the word does not rely on them.
- **B21 – refunds and deductions in a non-first window (Architect, `PROPOSAL-M2-signs-r1.md:108`).** Weeks 10-04..10-10 and 10-18..10-24 issued. A `refundLabor` 20,000 and a deduct 50,000 dated 10-20 are reversed in November. Rows `المُرجَع من الدفعة نقداً 20,000 د.ع، ينقص المستحق، من 2026-10-18 إلى 2026-10-24` and `الخصومات ومرتجعات المواد 50,000 د.ع، يزيد المستحق، من 2026-10-18 إلى 2026-10-24`. B9 and B12 hold. This guards `LINE_KEY` (`refunds → paymentRefund`, `deductions → deduct`), which a wrong mapping zeroes silently after the first window.
- **B22 – mixed window (Architect E2).** Approved 1,000,000 and paid 600,000 in October; October issued 11-01; the payment reversed 11-05; a late 100,000 `payLabor` dated 10-20 arrives 11-10. November prints two rows, in this order: `مدفوع للعمل 100,000 د.ع، ينقص المستحق، من 2026-10-01 إلى 2026-10-31` (late), then `مدفوع للعمل 600,000 د.ع، يزيد المستحق، من 2026-10-01 إلى 2026-10-31` (reversed). Opening 400,000, closing 900,000.
- **B24 – deduct cascade, tail row (r6, M-1; Architect `cascade-r5.js`).** `appr_m1` 300,000 dated 10-05, October issued 11-01; `d1` 50,000 dated 11-18 on `appr_m1`, approved; `rev_appr_m1` stamped 11-24 by a fixture that bypasses I's `dependent` block (as a second phone would); view the week 11-23..11-29. Rows: `عمل معتمد 300,000 د.ع، ينقص المستحق، من 2026-10-01 إلى 2026-10-31` and the tail row `الخصومات ومرتجعات المواد 50,000 د.ع، يزيد المستحق، من 2026-11-01 إلى 2026-11-22`. B9 and B12 hold (r5 was off by 50,000). (b) Two projects, same world in p2 only: the tail is p2's; p1 has none. (c) **r7 (Architect r6 MEDIUM-1):** after the deduct is also reversed (`rev_d1` stamped 11-25), `rev_d1` books at `d1`'s day 11-18 (unclosed), so in the 11-23..11-29 view **the tail row is gone**, the opening rises by 50,000 (250,000 → 300,000), and B9 and B12 hold. **B24(c) asserts "no tail row" and "opening 300,000" explicitly, not B9 alone:** B9 still holds under mutation 34 (Architect r7 review :41). (d) **Baseline row kept (EA's record `answers:43`):** the same world, but the week 11-16..11-22 was issued (11-23) **before** `rev_appr_m1`. The 11-23..11-29 view prints the **window** row `الخصومات ومرتجعات المواد 50,000 د.ع، يزيد المستحق، من 2026-11-16 إلى 2026-11-22`, unchanged before and after `rev_d1`; no tail row; B9 and B12 hold.
- **B25 – orphan deduct blocks the issue (r6, DECIDED; source `answers:47`).** B24's world before `rev_d1`, viewing the closed week 11-16..11-22 (d1 dated 11-18): `orphanDrawIds` is `['d1']`, `statementApprovalDoc` returns `['review']`, and the issue card shows the OPEN-4 sentence once, the row `الخصومات ومرتجعات المواد` 50,000 with its date and `عكس`, and no `إصدار كشف حساب`. Controls: a deduct on a live approval does not block; an unapproved deduct (no `appr_d1`) does not block; a reversed deduct does not block. Two projects: an orphan deduct in p2 does not block p1's issue. (e) **r7 (Architect r6 LOW-2): a later week is blocked too.** The week 11-23..11-29 (`nd(d1) = 11-18 ≤ periodEnd`) also returns `['review']` with the same row until `rev_d1`; after `rev_d1` it issues, and its statement has **no** tail row (B24(c)).
- **B23 – a settle-only correction prints no row (R5-Q2 default).** October issued with live `stl_m_1` 40,000; `rev_stl_m_1` stamped 11-03. November's `corrections` holds one `settlements` part (raw −40,000, effect 0); no row is printed, and with nothing else there is no heading. `سلف قائمة عليه` in the closing reflects the reversal. B9 and B12 hold.

**Issue gate (L-1, L-8):**

- **G1.** `online()` false gives `['offline']`, and neither `inFlight` nor `flush` is called.
- **G2.** `flush` resolves but `outbox()` still has an id: `['queued']`.
- **G3.** `flush` resolves but `lastSyncAt()` < t0: `['pull']`.
- **G4.** The flush delivers a doc from another phone, dated inside P. Recompute differs: `['changed']`, no row, the card redraws with the new figures (probe P4).
- **G5.** Everything clean: ok. One `statementApprovals` row and one outbox id.
- **G6.** Demo: no flush, ok when the figures are unchanged.
- **G7 – in-flight flush at the tap.** `inFlight()` returns a promise whose pull set `lastSyncAt` to a value before the tap and resolves after it. The gate awaits it, then takes t0, then calls `flush` exactly once. If that second flush does not move `lastSyncAt` past t0, the result is `['pull']`. (Mutation 15: taking t0 before the wait makes this pass wrongly.)
- **G8 – flush never settles.** `flush` returns a promise that never resolves; with `timeoutMs` 50 and fake timers, the gate returns `['pull']` and writes nothing.
- **G9 – flush rejects.** `['pull']`, no throw out of the gate, nothing written.
- **G10 – epoch change.** `epoch()` changes while `flush` is pending: `['epoch']`, no row, no outbox id.
- **G11 – redraw never gates.** Rendering «مقاول» and «حسابات» 20 times, including after each G error, calls `flush` 0 times (spy).
- **G12 – the other phone already issued.** The pull brings a `statementApprovals` row for the same period. `issuedAt` differs from `shown` → `['changed']`; after the redraw the issue button is absent.

**Saves:**

- **S1.** Settle 40,000 against an advance of 100,000: id `stl_<m>_1`; zero effect (`public/accounts.js:78`); keys `STL_REMOTE`.
- **S2.** 100,001 gives `cap`. A `returnAdvance` of 70,000 plus a settle of 40,000 gives `cumulative`.
- **S3.** Gen 2 gives `method` until `rev_stl_<m>_1` counts. After gen 9 is reversed, `settleGen` returns ''. An advance in `syncErrors`, or reversed, gives `settlesId`. A reversed `appr_` gives `targetId`.
- **S4. Arabic digits:** `٤٠٬٠٠٠` saves 40000 and redraws `40,000`; `٤٠٠٠٠` redraws `40,000`; `1,50000` redraws `150,000`; `2,5` is refused.
- **S5.** Two taps of each save write one document and one outbox id.
- **S6.** `statementApprovalDoc`: no `includedIds`, figures, `deviceId`, or `createdAtDevice`; keys ⊆ `firestore.rules:1183`; null bounds give `['period']`; unreviewed cash gives `['review']`.
- **S7 (E-2, OPEN-4).** An advance with a live settle (matched on `settlesId`) is `dependent`, and the page shows `اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً` and **not** the old `اعكس الاسترداد أو الإرجاع أو الخصم المرتبط أولاً`. A settle whose `targetId` equals the advance id but whose `settlesId` differs does **not** make it dependent.
- **S8 (L-5).** Project `status: 'closed'`: no `data-cs-*` and no `data-st-*`; both builders return `['inactive']`; no outbox id.
- **S9 (LOW-17): the full orphan reversal flow, through the UI.** From B18's state, render «مقاول» and click through `onClick` with the real button elements, never by calling `reversalDoc` directly: (a) with the `سبب التصحيح` field empty, the orphan row's `عكس` is disabled and a click writes nothing; (b) type a reason, click `عكس` once: exactly one outbox id `rev_stl_m_1`, built by `AccountCorrect.reversalDoc` (spy), with `reversalReason` equal to the typed reason; (c) click again: still one id; (d) after the redraw, `orphanDrawIds` is empty, the sentence and the list are gone, and the `إصدار كشف حساب` button shows (closed period); issuing writes one row. The same for an orphan `returnAdvance`.

**Displays:**

- **D1. Balance sentence:** 480000 → `الرصيد المستحق`, `مستحق له`, `480,000 د.ع`; −100000 → `مستحق عليه`, `100,000 د.ع`, no U+2212, no `(سلفة)`; 0 → `الرصيد المستحق`, `0 د.ع`, and not `لا شيء (مسدّد)` (JQ2); the H fixture shows `مستحق عليه` 100,000.
- **D2. «مستخلص»** (OPEN-15 in, `answers:33`):
  - A week with approved 600,000, deduct 50,000, advances 100,000: `عمل معتمد` 600,000, `الخصومات ومرتجعات المواد` 50,000, `صافي السلف` 100,000, `الصافي` 450,000; no heading.
  - Add a reversed earlier approval of 100,000 that booked in this week: the heading `تصحيحات فترات سابقة`, then `عمل معتمد 100,000 د.ع، ينقص المستحق، من … إلى …` with its source, before `الصافي`. **`الصافي` stays 350,000** (600,000 − 50,000 − 100,000 − 100,000; the accountant's required test, `ACCOUNTANT-advice-M2-alt.md:6`).
  - The `statementApprovals` length is unchanged.
- **D2b – printed lines sum to the net.** Parsed back from the rendered HTML, not from the model. A correction row counts `+amount` for `يزيد المستحق` and `−amount` for `ينقص المستحق`. For «مستخلص»: `work − deductions − صافي السلف + Σ word·row = الصافي` as printed (600,000 − 50,000 − 100,000 − 100,000 = 350,000). For the statement card, over every fixture: `opening + Σ sign·amount of the printed entersClosing lines + Σ word·row = رصيد آخر المدة` as printed, where the closing is read as `+amount` with `مستحق له` and `−amount` with `مستحق عليه` (D14, `answers:55`); the opening is read the same way (`+amount` with `مستحق له`, `−amount` with `مستحق عليه`).
- **D2d – settles and the printed sum (r6, accountant Q2 condition, `ACCOUNTANT-advice-J-r5.md:3`).** The accountant accepts unprinted settle parts on condition that settles appear elsewhere and the printed lines sum to «الصافي». **D2b already asserts "Σ printed lines = الصافي" (and "= رصيد آخر المدة" on the card), parsed from the HTML.** Evidence that a settle never breaks that sum: the fold's `net` has no settle term (`net = approvedLabor − advancesPaid − payments + cashReturned + refunds − deductions`, `public/accounts.js:865`), settles enter only `openAdvances` (:867), and the FIGURES `settle` line has sign 0 (:544). Where settles appear: the statement card's period line `تسوية سلفة` (FIGURES :544) and its closing line `سلف قائمة عليه` (:546). «مستخلص» has no settle term in `الصافي`, so it needs no settle line for its sum. D2d runs D2b on a world with an in-period settle 40,000 plus a reversed earlier settle (B23): «مستخلص» printed lines = `الصافي`, card printed lines = `رصيد آخر المدة`, and the card shows `تسوية سلفة` 40,000. If the accountant wants a visible settle line inside «مستخلص» too, that changes the layout Ameer approved (gj-sketch:60, OPEN-15) and goes to Ameer (§11 R6-Q2).
- **D2c – no hidden term (OPEN-15).** In D2, every number that enters `الصافي` is printed: `600,000`, `50,000`, `100,000` (`صافي السلف`) and `100,000 … ينقص المستحق`. Removing the `صافي السلف` line makes D2b fail.
- **D3.** Unit quantity 8,000 shows `الكمية` and `8,000`. The agreement card shows `حسب الإنجاز (الكمية × سعر الوحدة)` (put there by #110; J asserts it stays).
- **D4. Totals (OPEN-9):** §3.8 fixture: `تكلفة المقاول` 840,000, `قيود بلا عقد` 40,000, `المدفوع للمقاولين` **820,000**, person new cash 580,000. **No** `النقد الخارج` anywhere. **No** `سلفة` line and `reclassAdvance === 0`, even with `L:e1;` in an advance description (L-3). The test does not call `balances()`.
- **D5. Q19:** a `cap` or `cumulative` settle page **contains** `المُرجَع والتسوية أكبر من السلفة` and the three amount labels; a valid settle does not.
- **D6. Thousands:** a reversed payment of 1,234,567 renders `مدفوع للعمل 1,234,567 د.ع، يزيد المستحق، …`, with no U+2212. Every amount goes through `money` and then `Ledger.fmt` (`public/ledger.js:484`).
- **D7.** With `CONTRACTOR_COST_START = null`, «مقاول» has no `data-cs-*` and no `data-st-*`. The «حسابات» displays still render.
- **D8 (L-4).** The totals are outside the statement card. B2's byte-equal check of the issued October card passes even though a later `payLabor` changes `المدفوع للمقاولين`. The totals card did change.
- **D9 (OPEN-9b condition).** Fixture: a custody hand-over to a foreman of 300,000, and a custody-paid `subcontractor` row of 120,000 with `foremanId`. `المدفوع للمقاولين` includes the 120,000. Then: `Ledger.totals(entries)` and `Accounts.projectCost(...)` equal their fixture constants and are identical before and after rendering the statement tab; the home page and the project page HTML contain neither `المدفوع للمقاولين` nor the `paidToContractors` amount; the CSV exports are byte-equal with and without J loaded.
- **D11 – no minus sign under the heading (accountant `ACCOUNTANT-advice-M2-alt.md:6`; Architect D11, `PROPOSAL-M2-signs-r1.md:107`).** Over every B and D fixture, on the statement card, the issue card and «مستخلص», each row under `تصحيحات فترات سابقة` matches `^<label> \d{1,3}(,\d{3})* د\.ع، (يزيد|ينقص) المستحق، من \d{4}-\d{2}-\d{2} إلى \d{4}-\d{2}-\d{2}$` after whitespace is collapsed, so the only `-` characters are inside the two dates; and the text under the heading contains no U+2212.
- **D12 – the L-12 card text (`answers:32`).** B18's issue card contains `اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً` exactly once, then per orphan row the label (`تسوية سلفة` or `المُرجَع من السلف نقداً`), the amount, the date and one `عكس`; it contains no `إصدار كشف حساب`.
- **D13 – exactly one reason field (r6, LOW-7; R5-Q5).** In each of the four render cases of «مقاول» (I's block renders `cc-reason` only; J's only; both; neither), the page has exactly one `#cc-reason` when any `عكس` needs it, and none in the "neither" case. J's two `عكس` buttons (Save 11 and the orphan list) read that field. The first-one-wins rule is at `public/accounts-correct.js:955-957`.
- **D14 – the card balance lines (r7; r8; r9 split; r10 both lines active, `answers:55`, card t2191s7670 `:7`, `:17-18`).** Both balance lines print |amount| + `مستحق له`/`مستحق عليه`:
  - **D14-closing.** Closing −100,000 prints `رصيد آخر المدة 100,000 د.ع مستحق عليه`; 480,000 prints `… 480,000 د.ع مستحق له`; 0 prints `… 0 د.ع مستحق له`. No U+2212 on the line. Same on the issue card (D10 byte-equal still holds).
  - **D14-opening.** Opening −100,000 → `رصيد أول المدة 100,000 د.ع مستحق عليه`; 250,000 → `… 250,000 د.ع مستحق له`; 0 → `… 0 د.ع مستحق له`. No U+2212 on the line. Same on the issue card (D10 byte-equal still holds).
  - The card's `صافي السلف` line is unchanged.
- **D15 – negative period «صافي السلف» (r6, DECIDED; source `answers:46`).** A period with advances 50,000 and returned advance cash 100,000: «مستخلص» prints `صافي السلف 50,000 د.ع، يزيد المستحق`, with no U+2212. With advances 100,000 and returns 0 it prints `صافي السلف 100,000 د.ع` (no word, as D2). D2b reads the word: a negative «صافي السلف» counts `+50,000` toward `الصافي`. The statement card's own `صافي السلف` line is not changed by J.
- **D16 – no minus sign in «مستخلص» (r6; r7 split per Architect r6 MEDIUM-2).** Over every B and D fixture, plus a fixture where deductions and advances exceed the work (net −80,000):
  - **D16 (proceeds):** every «مستخلص» line **except `الصافي`** has no U+2212 and no `-` outside the `من/إلى` dates.
  - **D16-الصافي (r8 DECIDED, `answers:56`, option الأول):** D2's **first world** (no correction; 600,000 − 50,000 − 100,000 = 450,000) prints `الصافي 450,000 د.ع مستحق له`; the −80,000 fixture prints `الصافي 80,000 د.ع مستحق عليه`. With this, the whole «مستخلص» block has no U+2212. (D2's 350,000 is its second world, with the reversed-approval correction row; both numbers are right.)
  - D2b reads `مستحق عليه` on `الصافي` as a negative net.
- **S10 – reverse the orphan deduct through the UI (r6).** From B25: type a reason in `سبب التصحيح`, click the deduct row's `عكس` via `onClick`: one outbox id `rev_d1` built by `AccountCorrect.reversalDoc` (spy) with `reversalReason`; a second click adds nothing; after the redraw `orphanDrawIds` is empty, the button shows and issuing writes one row; after the redraw the 11-23..11-29 view has no tail row and its opening is 300,000 (B24(c)).
- **D10 (L-9, L-13).** Precondition: «حسابات» scope is set (`writeAccountScope`) to **the agreement's project** and the same period. Then the issue card's statement block is byte-equal to the «حسابات» statement card. Also: the object rendered on the issue card is the same reference (`===`) passed to `issueGate` as `shown` (spy on the gate), and a second case with «حسابات» on «كل المشاريع» shows the cards may differ while the issue card is unchanged.

**Strict:** `tests/strict-accounts-statement.test.js`.

**Updated:** `tests/accounts-view.test.js` lines 145, 214, 229, 245, and 260 (at 4d30d117); `tests/accounts-correct.test.js` line 76 (`S5`) and its uses at 689, 753, 1011.

### 6.2 Browser checks (`tests/browser-check.js`)

- Scan `#contractor/<id>` with the settle and issue cards in the cost-open phase.
- Add `cs-amount` to `AMOUNT_IDS` (line 17). Type `١٥٠٠٠٠` into `cs-amount`, the same as the `cp-amount` pattern at 533-536.
- `#account/p1` statement and print (522-524): the totals card is outside the statement card and says `المدفوع للمقاولين`; no `النقد الخارج`.
- The issue card shows the figures (L-9).
- Two taps per save.

### 6.3 Emulator (`tests/emulator/account-statement.test.js`)

Every fixture that writes a settle, a `returnAdvance` or a `rev_` of one directly uses the cap's `sendCapped` helper; E1, E8 and E9 use the real flush, so they go through `writeCapped` **[DEPENDS ON CAP FINAL]**.

- **E1.** A `stl_` flush is accepted; after the pull `createdAtServer` is numeric, and the advance's `advanceCaps` counter shows the settle (cap job).
- **E2.** A statement approval is accepted. A re-flush is adopted, not duplicated.
- **E3.** A `rev_` made after the approval: after the pull, its stamp is greater than the approval's, `bookDay` is after `periodEnd`, and the next period shows the row with the effect word from §3.3 and no minus sign (D11). Real stamps.
- **E4.** Gen 2 before the gen-1 reversal is refused and shows `رُفض الإرسال`.
- **E5.** A settle above the advance, forced past the client, is refused.
- **E6 (L-1).** `issueGate` with a real flush. A second client writes a doc before the tap: `'changed'`, no row. After the redraw and a second tap: ok.
- **E7 (second phone; r6, r5 review M-2).** Two clients build `stl_<m>_1` for the same measurement. The second create is denied by the rules, and the client **adopts** the server row: (a) same `settlesId` and amount → plain adopt, `failed.length === 0`; (b) a different `settlesId` or amount → adopt plus one `linkRefusals` entry with a minted id, as E27 (`tests/emulator/account-adopt.test.js:329-345`; `public/sync.js:1013-1019`). Never `syncErrors`, never `رُفض الإرسال`. After the cap, the same via `already-exists` (cap B-1). E4 (gen 2 before the gen-1 reversal → `رُفض الإرسال`) is unchanged and correct.
- **E8 (R3 closed by the cap, through J's settle) [DEPENDS ON CAP FINAL].** Advance 100,000. Client A settles 60,000 against measurement m1 and client B 50,000 against m2, both built by J's `settleDoc` and each within the per-doc cap. Exactly one is accepted; the other is refused at send, shows `المُرجَع والتسوية أكبر من السلفة` (r7: Ameer `answers:50`; not `رُفض الإرسال`), and moves to `syncErrors` (it is a true over-cap; with cap B-2 it may get there through the retry path). The counter never exceeds 100,000.
- **E10 (r6, orphan deduct; source `answers:47`).** Real stamps: `appr_m1`, `d1` + `appr_d1`, then `rev_appr_m1` from a second client that has not pulled `d1`. After the pull the issue is blocked (B25); `rev_d1` through S10's flow is accepted by the rules and is not a capped op; after the pull the issue goes through.
- **E9 (L-12 (b) reversal through the real flush) [DEPENDS ON CAP FINAL].** B18's world with real stamps: the orphan `stl_m_1` exists and `rev_adv` is accepted. Through S9's UI flow, `rev_stl_m_1` is flushed, accepted by the cap rules on a dead advance ("reversals always accepted": cap M-1 clamp with C19; also run with no counter yet, C21), and lowers the counter by 40,000 (clamped at 0). After the pull the issue goes through.

### 6.4 Verify drives (`scripts/verify-drives/accounts-statement.js`)

L-6: rows are chosen by id or `targetId` only, never by amount.

- **`settle`:** set the constant at runtime; approve the measurement, remember `m`, `appr_m`, and the advance id `adv` from the rows the drive created; settle `٤٠٬٠٠٠`; assert `id === 'stl_' + m + '_1'` with `settlesId === adv`, then the outbox, then the statement line; reverse with `rev_stl_<m>_1`, by id; settle gen 2, `id === 'stl_' + m + '_2'`; try to reverse `adv` and assert the new A14(b) sentence.
- **`statement-approval`:** set the anchor with `writeAccountScope` to a date in the **closed** week before the current one (M-1); assert the button is absent for the current week; assert the issue card shows the figures (L-9); issue, and find the new row by the uuid from the screen state; add a `rev_<id>` after sync; assert the issued week's statement card is byte-equal, and the next week shows `تصحيحات فترات سابقة` with a row that matches D11's pattern, carries the word §3.3 gives for that reversal, contains no U+2212, and ends with the issued week's `من`/`إلى` dates.
- L-12 (b) is not driven in the browser: E-2 blocks creating an orphan on one device, so S9 (unit) and E9 (emulator) cover it.
- Both drives refuse a production host and reset the constant to `null` (`scripts/verify-drives/accounts-correct.js:110-115`, 419).

### 6.5 Mutations that must go RED

1. Ignore approvals in `bookDay`: B2, B5, B6b fail.
2. Use `<=` in the arrival compare: B10 tie fails.
3. Filter after `rowIndex`: B2 fails.
4. Drop the scope match: B8 fails.
5. Drop `nextDay(maxEnd)`: B6c fails.
6. Remove E-2, or match `targetId`: S7 fails.
7. Hide the Q19 sentence: D5 fails.
8. Drop the M-1 check: B6a fails.
9. Restrict `queuedIds` to in-period: B7b fails.
10. Skip the recompute-equal check: G4 fails.
11. Drop `unlinked` from `paidToContractors`: D4 fails.
12. Paint `reclassAdvance`: D4 fails.
13. Add `paidToContractors` to the project card or `Ledger.totals`: D9 fails.
14. (r5, replaces r4's 14) (a) Print `money(raw)`, the signed amount: D11 fails. (b) Take the word from the raw sign instead of `SIGN·raw`: B5r and B13c fail. (c) Drop the late/reversed split: B22 fails.
15. Take t0 before awaiting the in-flight flush: G7 fails.
16. Drop the `FLUSH_MS` race: G8 times out (fails).
17. Drop `issuedAt` from the compare: G12 fails.
18. Call `issueGate` from `issueBlock`: G11 fails.
19. Keep the old A14(b) sentence: S7 fails.
20. Restrict the window pool to `periodEnd < s` (r3's rule): B15 fails.
21. Take the pool from every approval at view time instead of freezing it at `issuedAt(P)`: B16 fails.
22. Drop `orphanDrawIds` from `'review'`: B18 fails (L-12 (b), `answers:32`).
23. Drop the `صافي السلف` line from «مستخلص»: D2c fails (OPEN-15, `answers:33`).
24. Build all-projects rows from one party-wide pool (r4's rule): B19 fails (LOW-15).
25. Map `LINE_KEY` `refunds → 'refunds'` and `deductions → 'deductions'`: B21 fails.
26. Print effect-0 (settle) parts: B23 fails.
27. Build the orphan `عكس` by writing the `rev_` directly instead of through `reversalDoc` with the reason field: S9 fails (spy and `reversalReason`).
28. (r6, M-1) Drop the tail part: B24(a)/(b) and B20 fail. (r9, Architect r7 LOW-1: not B24(d), which has no tail.)
29. (r6, Q4; r8 un-held, `answers:55-56`; r10 opening released) Print the opening with `money(opening)`: D14-opening fails. Print the closing with `money(closing)`: D14-closing fails. Print `الصافي` with `money(net)`: D16-الصافي fails.
30. (r6, LOW-7) Render a second `#cc-reason` when both I's and J's blocks need it: D13 fails.
31. (r6, M-2) Expect `syncErrors` for the second `stl_m_1`: E7 fails against the base (documents the r5 error).
32. (r6, decided block) Drop orphan deducts from `orphanDrawIds`: B25 fails.
33. (r6, R5-Q3 decided) Print «صافي السلف» with `money(advancesNet)`: D15 and D16 fail.
34. (r7, MEDIUM-1) Book `rev_d1` at its stamp day instead of `d1`'s natural day: B24(c) fails on its explicit asserts (the tail row stays and the opening stays 250,000); B9 alone would stay green.

### 6.6 CI: four jobs, green on the final head

1. `lint, format, types` (`ci.yml:18-46`).
2. `ledger tests` (`ci.yml:47-77`, list at 68).
3. `browser checks` (`ci.yml:78-123`).
4. `emulator rules and sync` (`ci.yml:124+`, list at 210).

Superseded commits are ignored.

---

## 7. PR split (OPEN-5, Architect ruling: ONE PR)

**One code PR**, with commits in this order:

1. **Booking:** `periodStatement`, `bookDay`, `windows`, `correctionRows` (r5 split, effect, LOW-15 per-project), B-tests.
2. **Displays:** balance sentence, quantity, «مستخلص» with `صافي السلف` (OPEN-15), r5 correction rows with heading and the two approved words, totals card (`المدفوع للمقاولين`), E-1, D-tests (incl. D11).
3. **Saves:** settle, issue (with the L-9/L-13 figures), `issueGate` with L-8, E-2 with the OPEN-4 sentence, E-3, S/G-tests, drives, emulator (with the cap's fixtures).
4. **L-12 (b):** `orphanDrawIds`, the orphan list with `عكس`, B18 flipped, S9, D12, E9 (§4.4).

r4's optional commits 4 and 5 are no longer optional: Ameer said go to both (`answers:32`, `:33`). OPEN-15 sits in commit 2 because it is one line of the «مستخلص» display.

The fallback to J-a and J-b applies only if the diff goes beyond §3.4's file list (r1 review §3).

**Gates and order:**

- **The wording mini-PR is merged** (#110 → 4d30d117, `answers:30`).
- **The cap job merges first** (`answers:31`). J's code head is cut from main only after that merge, so an Architect-approved J head never needs a re-pin push. J takes the next free `VERSION`, expected `aj-p0-v82` **[DEPENDS ON CAP FINAL]**.
- K, G, H, and I are on main. F's guard is on main. L comes after J.
- Merge needs Ameer's go naming the head SHA, after the Architect APPROVEs that SHA and CI is 4/4.
- All of J's strings are approved (§8), including the two M-2 words (`answers:37`). Nothing string-related blocks the merge.
- Deploy is hosting only, with Ameer's own go, after confirming nobody is entering data. J has no rules delta. **After the cap merge, any hosting deploy from main (J included) is rules + hosting together, with the cap's pre-check, saved live ruleset, 2-minute wait and rollback pair** (§4.5, deploy order; cap review r2 LOW-2).

---

## 8. Strings

Every user-visible string J paints is listed here with its source. **J adds no string beyond this list.**

**Reused (already on main):**

| String | Source |
|---|---|
| `تسوية سلفة` | `public/accounts.js:544` |
| `رصيد أول المدة`, `عمل معتمد`, `مدفوع للعمل`, `المُرجَع من الدفعة نقداً`, `السلف المصروفة له`, `المُرجَع من السلف نقداً`, `صافي السلف`, `الخصومات ومرتجعات المواد`, `رصيد آخر المدة`, `سلف قائمة عليه` | `public/accounts.js:536-546` |
| `أسبوعي`, `شهري`, `من`, `إلى` | `public/accounts-view.js:459`, 466 |
| `لا يُعتمد الكشف وفيه مبلغ غير مدقّق` | `public/accounts-view.js:463` |
| `الكشف يُعتمد قبل أن يُقفل. الأرقام تُحسب من القيود.` | `public/accounts-view.js:464` |
| `بانتظار الاعتماد`, `غير مدقّق`, `لم يُرسل` | `public/accounts-view.js:435-437` (row tags; no longer used as the issue-block note) |
| `مستحق له`, `مستحق عليه` | `public/accounts-view.js:372` |
| `الكمية` | `public/accounts-work.js:974` |
| `قيود بلا عقد` | `public/render.js:890` |
| `سلفة` | `public/accounts-payment.js:23` |
| `مبلغ`, `المبلغ ليس عدداً صحيحاً`, `رُفض الإرسال` | `public/accounts-payment.js:31-40` |
| `عكس`, `معكوس`, `سبب التصحيح` | `public/accounts-correct.js:39-41` |
| `د.ع` | `public/render.js:56` |

**Approved, already in `public/`, newly painted by J** (EA-relayed, answers:2-4):

| String | Where it comes from | Use in J |
|---|---|---|
| `المُرجَع والتسوية أكبر من السلفة` (Q19) | `public/accounts-payment.js:36` (painted on H's return form at :287 since #110) | Settle form on `cap` or `cumulative`. J keeps its own SENTENCE entry with the same text. |
| `الرصيد المستحق` + `0 د.ع` (JQ2) | Zero-balance wording | Overview |

`حسب الإنجاز (الكمية × سعر الوحدة)` (JQ3) was painted by #110, not J. `أُعيد تصنيفها` (JQ4) is painted in L, not J (L-3).

**OPEN-7, approved (EA-relayed, answers:18-19).** Six strings as listed, and the seventh renamed:

| String | Use | Source |
|---|---|---|
| `الرصيد المستحق` | balance label | gj-sketch:50; answers:19 |
| `إصدار كشف حساب` | save 12 button | gj-sketch:99, 467; answers:19 |
| `حفظ التسوية` | save 11 button | gj-sketch:467; answers:19 |
| `مستخلص` | block heading | gj-sketch:467; answers:19 |
| `الصافي` | «مستخلص» net | gj-sketch:467; answers:19 |
| `تكلفة المقاول` | project cost | gj-sketch:467; answers:19 |
| `المدفوع للمقاولين` | paid to contractors (**replaces `النقد الخارج` everywhere**; `النقد الخارج` is never painted) | answers:18; accountant r2 item 2 |

**New strings, approved (EA-relayed):**

| String | Use | Source |
|---|---|---|
| `تصحيحات فترات سابقة` | heading above the correction rows, before `الصافي` / `رصيد آخر المدة` | answers:11 (OPEN-1/OPEN-10) |
| `لا يُعتمد الكشف وفيه قيد لم يُرسل بعد` | issue block caused by queued records | answers:12 (OPEN-3) |
| `اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً` | A14(b), replaces the text at `public/accounts-correct.js:54`; also above the L-12 (b) orphan list on the issue card (new placement, approved) | answers:17 (OPEN-4); placement answers:32 (L-12) |
| `يزيد المستحق` | correction-row effect word when the row raises the balance owed (§3.3) | **answers:37 (M-2, 08:12)** |
| `ينقص المستحق` | correction-row effect word when the row lowers the balance owed (§3.3) | **answers:37 (M-2, 08:12)** |

**Strings removed from J's paint:** `النقد الخارج` (renamed), and the old A14(b) text (replaced). `لم يُرسل` as the issue-block note (replaced by the OPEN-3 sentence; the row tag at :437 is unchanged).

**M-2 (r5) uses two new strings, both approved by Ameer verbatim (`answers:37`):** `يزيد المستحق` and `ينقص المستحق`. Everything else on a correction row is existing: the FIGURES labels (`public/accounts.js:536-546`), `د.ع` (`public/render.js:56`), `من`/`إلى` (`public/accounts-view.js:459`) and digits. The Arabic comma `،` between the parts is punctuation from the mock Ameer approved (`مدفوع للعمل 600,000 د.ع، يزيد المستحق، من 2026-10-01 إلى 2026-10-31`), not a word.

**L-12 (b)** reuses the approved OPEN-4 sentence in a place Ameer approved (`answers:32`) and the existing labels `تسوية سلفة`, `المُرجَع من السلف نقداً`, `عكس`, `سبب التصحيح`. **OPEN-15** reuses the existing `صافي السلف` (`public/accounts.js:542`; `answers:33`).

**r6 adds no string.** The tail row reuses the row format and `من`/`إلى`; the decided «صافي السلف» form reuses `يزيد المستحق` (`answers:37`; source `answers:46`); the orphan-deduct row reuses `الخصومات ومرتجعات المواد` and the approved OPEN-4 sentence.

**r7 adds no string.** (r8: the balance lines and `الصافي` use the existing `مستحق له`/`مستحق عليه`, `public/accounts-view.js:372`, as Ameer decided at `answers:55-56`; r8 adds no string either.) The over-cap placement of Q19 `المُرجَع والتسوية أكبر من السلفة` at send (`answers:50`) is the cap PR's change, not J's; J only asserts it in E8.

**r5 adds exactly the two approved words. No other new Arabic string.** r4's raw-negative rows (`مدفوع للعمل −600,000`) are removed from J's paint.

---

## 9. Hard constraints

- `CONTRACTOR_COST_START` stays `null` (`public/accounts.js:11`). It is set only at runtime, in tests and drives. The drive checks that the source binding is still null.
- These need separate approval, and none is planned: a `firestore.rules` change, a CSV output change, and any Arabic string beyond §8.
- No edit to `.cursor/rules/pstack-models.mdc`.
- Rules and code ship and revert together. J has no rules delta. The live ruleset when J deploys is whatever the cap deploy left live (expected: the cap's ruleset; I's `749bf343…` is the cap's rollback target, `PLAN-cap.md` §9 :414-415). J's hosting goes live only after the cap's rules are live (§4.5).
- No `firestore.rules` change in J. No CSV change. No new Arabic string beyond §8 (the only r5 additions are the two words Ameer approved).
- Append-only: the only creates are `stl_`, `rev_stl_` (through I), and `statementApprovals`. Never an edit or a delete. Update and delete are false in the rules.
- `paidToContractors` is never summed with company cash (OPEN-9b condition, D9).
- No `--no-verify`, no hook bypass, no Co-authored-by, no amend or force-push, no push to main.
- One cloud agent at a time, and only after CONFIRMED plus EA's go, after the cap PR has merged (the cap job's own agent must be finished first). **r6:** the agent runs on grok-4.7 only, and its prompt carries `/workspace/pstack-block-grok-only.md` (sha `d5cfc070…5d38`; Ameer 08:32 via EA), which replaces the older models block. `.cursor/rules/pstack-models.mdc` is not edited.

---

## 10. Revert and blast radius

**A revert of J:**

- removes the script, the tests, the verify ids, and E-1, E-2 (with the OPEN-4 sentence), E-3;
- puts the statement tab back on the retroactive fold;
- leaves issued rows in place, which is harmless;
- takes the next service-worker number;
- does not undo #110 (JQ3, JQ6, Q19 on H stay);
- does not undo the cap job: settles and returns stay capped, and the cap's rules stay live.

**Blast radius:**

- Every person page shows the new balance label.
- The statement tab changes only once a statement is issued (B1).
- The «مقاول» cards are invisible while the constant is null.
- Every `dependent` reversal block shows the new A14(b) sentence (I's existing return/refund/deduct cases too).
- An issue is refused while an orphan settle or return exists (L-12 (b)); the owner reverses it from the issue card.
- No change to home `إجمالي المصروف`, the project `المصروف`, `projectCost`, or any CSV (D9).

---

## 11. [OPEN] and pending items

**Answered (EA-relayed from Ameer):** everything in the header table. On 2026-11-25: OPEN-6 (`answers:31`), L-12 (b) (`:32`), OPEN-15 (`:33`), and M-2 (`:34` rejected the raw-negative display; `:37` picked option (ب) and approved «ينقص المستحق» and «يزيد المستحق»). JQ5 was **never asked**, so it keeps its fallback (`عمل معتمد`, `مدفوع للعمل` unchanged); that is a fallback, not an answer. **r8: the r7 [NEEDS AMEER] item is DECIDED (`answers:54-56`). r10: the opening-balance part, held in r9, is released on card t2191s7670 (`:7`, `:17-18`). No Ameer item is open for J.**

**M-2 provenance (r5).** r4's M-2 rested on the accountant's «المحاسب يقرر» delegation (`AMEER-answers-r2.md:13`; r4 L-14). That is superseded: M-2 is now Ameer's own answer (`answers:37`), and **M-2 is no longer pending**. The format in §3.3 is his pick. Two details inside it are engineer choices for the Architect to check: the late/reversed split (R5-Q1) and not printing settle parts (R5-Q2).

**Depends on the cap job [DEPENDS ON CAP FINAL]** (§4.5; r6 names the items: cap B-1, B-2, M-1, C19/C21, M-3; r7: cap plan r3 CONFIRMED, code in progress, Q-A1 = yes at `answers:50`): J is cut after the cap merge; sw `aj-p0-v82`; settles and reversals of draws go through `writeCapped`; emulator fixtures use `sendCapped`; E1, E8 and E9 run on the cap. §4.3 R3 and §4.5 close as "done by the cap job" when the cap PR merges. If the cap plan's review changes any of these, J follows the final shape and the change is recorded in §16.

**r5 questions, resolved (r5 review §3; accountant `ACCOUNTANT-advice-J-r5.md`):**

- **R5-Q1 split: accepted** (Architect; accountant agrees, :2).
- **R5-Q2 settle parts not printed: accepted** (Architect); accountant's condition folded as D2d (:3).
- **R5-Q3 negative «صافي السلف»: DECIDED** (Ameer 08:52, `answers:46`; earlier `:40` with EA's record `:42`): positive amount + «يزيد المستحق» (§3.6, D15, D16). r7: this covers «صافي السلف» only; "no minus" at `:42` is EA's description of that option, not a rule for the whole «مستخلص».
- **R5-Q4 «المستحق» when he owes:** accountant (:5) suggested the closing line show `مستحق له`/`مستحق عليه`. DECIDED by Ameer for both card balance lines (`answers:55`; card t2191s7670 `:7`, `:17-18`; D14).
- **R5-Q5 one reason field: accepted**, plus D13.
- **R5-Q6 CI lists: confirmed**; folded into the cap plan r2 and into §3.4 for J.
- **R5-Q7: confirmed** = cap C19/C21 (§4.5).

**Ameer, 08:52 (`answers:45-47`), his own words, EA-relayed** (stronger than `:40` «رئي المحاسب» at 08:47, whose `:41-43` are EA's record of the accountant's picks):

- **R5-Q3:** «صافي السلف: رقم موجب وجنبه «يزيد المستحق»» (`:46`), decided (above).
- **M-1 block:** «الخصم المربوط: إي، نمنع الإصدار لحد ما ينعكس» (`:47`). Issuing is blocked while a reversed approval has a live linked deduction; same «عكس» and approved sentence (§3.3, §4.4, B24, B25, S10, E10). r7: a deduct reversed after its days were issued keeps its window row (B24(d)); otherwise the tail row disappears after `rev_d1` (B24(c)).

**DECIDED (r8; Ameer 09:08, card t2191s7670, `answers:54-56`, verbatim, EA-relayed). Was r7's [NEEDS AMEER] item (Architect r6 review MEDIUM-2):**
  1. **Card balance lines** (`answers:55` «إي، الرصيد يصير «مستحق عليه» بدل الناقص»): **both** `رصيد أول المدة` and `رصيد آخر المدة` print |amount| + `مستحق له`/`مستحق عليه` (§3.7, D14, mutation 29). The opening line was held in r9 because his words say «الرصيد»; r10 releases it: `AMEER-card-J6-t2191s7670.md` (`e4d3529b…c697`): `:7` explanation ends «ونفس الشي لرصيد أول المدة.», `:17` step prompt «الرصيد يصير «100,000 د.ع مستحق عليه» بدل الناقص؟», `:18` Ameer's answer «١: إي، الرصيد يصير «مستحق عليه» بدل الناقص».
  2. **«الصافي» in «مستخلص»** (`answers:56` «الأول، «الصافي ... مستحق له» وإذا سالب «مستحق عليه»»): |net| + `مستحق له`/`مستحق عليه` (§3.6, D16-الصافي, mutation 29). R6-Q4 is closed.
  - **Not asked:** the optional third question (whether the card's own «صافي السلف» switches to the new form, `ACCOUNTANT-advice-J-r6.md:5`) was not put to Ameer, so **the card's «صافي السلف» stays as today**.
  - History: r7 wrote both variants of each question as deltas; the variants not chosen (card stays signed; الصافي الثاني) are removed in r8.

**For the accountant (r6) — all closed in r7 (`ACCOUNTANT-advice-J-r6.md`, 08:58):**

- **R6-Q1 closed** (:2): the example maths is right; the closing line is enough; no new words. The accountant's note for Ameer («ينقص/يزيد المستحق» always means in the contractor's favour, so when he owes, «ينقص المستحق» means his debt grew) has been sent to Ameer as a note only. With `answers:55`, the example's closing reads `150,000 د.ع مستحق عليه`.
- **R6-Q2 closed** (:3): condition met (printed lines sum to «الصافي»; no settle term; D2d). No settle line in «مستخلص».
- **R6-Q3 closed** (:4): days are clear, better than a statement number (a period may have no issued statement).
- **R6-Q4 closed** (r8): moved to Ameer in r7 and answered `answers:56` (option الأول).

The r6 text of these questions, kept for the record:

- **R6-Q1 (LOW-6), a concrete case.** The contractor owes 100,000 (closing `رصيد آخر المدة 100,000 د.ع مستحق عليه`). A late payment of 50,000 then prints `مدفوع للعمل 50,000 د.ع، ينقص المستحق، من … إلى …`. In r6's reading «المستحق» is the balance in his favour, so it went down by 50,000 and his debt went **up** to 150,000; the new closing line says `150,000 د.ع مستحق عليه`. A reader may take «ينقص المستحق» as "his debt went down", which is the wrong direction. Is the closing line enough, or does the accountant want another wording (which would go to Ameer)?
- **R6-Q4 (Architect).** r6 used the closing-line form for «الصافي»; the Architect ruled it outside Ameer's approval (r6 review MEDIUM-2). r8: Ameer chose exactly that form (`answers:56`); closed.
- **R6-Q2.** Settles show on the statement card (`تسوية سلفة`, `سلف قائمة عليه`), not in «مستخلص», whose `الصافي` has no settle term (D2d). Is that enough for the Q2 condition? A visible settle line in «مستخلص» would change the approved layout and go to Ameer.
- **R6-Q3.** The tail row (B24) names days (`من 2026-11-01 إلى 2026-11-22`), not an issued statement. Is that clear enough?

**For EA:** the card text request (r5 review LOW-3) is done: `AMEER-card-M2-t2173s7591.md` is filed and cited.

**Architect rulings recorded (r3 review §4):**

- **E-3 gate: CONFIRMED** (G7-G9 match L-8; G10, G11 and mutations 15, 16, 18 confirmed).
- **OPEN-11: MEDIUM accepted.** R1 INFO (option (a)); R2 harmless after M-4; R3 LOW-MEDIUM (= OPEN-6, now closed by the cap job); R4 LOW (= L-12, now option (b) in J). G12 and E7 confirmed.
- **OPEN-16: accepted with the M-3/M-4 fix** (frozen pool, any `periodEnd`, clip at `s-1`, tie order, skip empty; B15-B17).
- **OPEN-17: accepted with L-13** (one renderer, and the issue card renders the same `shown` object the gate compares; D10 precondition).

**Architect rulings recorded (r4 review, `REVIEW-plan-J-r4-66468cbd.md`):** CONFIRMED. LOW-15 (§3.3, B19, mutation 24), LOW-16 (§4.4) and LOW-17 (§4.4, S9, mutation 27) are folded in. INFO-1: the OPEN-4 sentence's new placement is now covered by Ameer's go (`answers:32`). INFO-2 (seconds-wide labelling window before the approval stamp): unchanged, figures unaffected. INFO-3 (OPEN-6 positions): settled by Ameer (`answers:31`).

**Note for the accountant (kept from r4):** a month view can label a correction row with an issued week inside that month (`من 2026-11-01` `إلى 2026-11-07`), because that is the statement whose opening the document changed (B15).

**Architect rulings recorded (r5 review, `REVIEW-plan-J-r5-fcdf5b0f.md`):** NOTES. M-1 fixed by the tail part (B24, B20 generator); M-2 fixed (E7, §4.3); LOW-1 to LOW-7 folded (§17).

**Architect rulings recorded (r6 review, `REVIEW-plan-J-r6-0b0319ae.md`):** NOTES. MEDIUM-1 fixed (B24(c)/(d), §3.3, header row, mutation 34); MEDIUM-2 recorded as the [NEEDS AMEER] item with D14, D16-الصافي, mutation 29 and R6-Q4 held; LOW-1 to LOW-4 folded (§18). His request that EA file card t2187s7642 verbatim (LOW-1) is for EA.

**Architect rulings recorded (r7 review, `REVIEW-plan-J-r7-5afdb946.md`, `fe5e403a…`):** CONFIRMED (with the r7 hold). LOW-1 (mutation 28 claim) fixed in r9; keep B24(c)'s explicit no-tail and opening asserts (mutation 34).

**Opening-balance hold: released (r10).** Card t2191s7670 is filed (`AMEER-card-J6-t2191s7670.md` (`e4d3529b…c697`): `:7` explanation ends «ونفس الشي لرصيد أول المدة.», `:17` step prompt «الرصيد يصير «100,000 د.ع مستحق عليه» بدل الناقص؟», `:18` Ameer's answer «١: إي، الرصيد يصير «مستحق عليه» بدل الناقص»). r9's release condition is met.

**[PENDING ARCHITECT]:** confirmation of the r7 → r8 delta (§19: the decided closing line and «الصافي» form, D16-الصافي and mutation 29 un-held, the card files cited), the r8 → r9 delta (§20: mutation 28 claim, the opening-balance hold with D14 split, B24(c) explicit asserts), and the r9 → r10 release (§21). The r6 → r7 delta (§18) was CONFIRMED in the r7 review.

**Carried forward unchanged** (gj-sketch:652-662): Jabbar, retention, contractor-supplied bricks, the cutover date, the per-row L question, and the fixed L advance id.

---

## 12. pstack-skill applicability

- **`architect`:** used. r3's new shapes: per-window rows (vs per-document) and the shared card renderer (L-9).
- **`principle-model-the-domain`:** one `net`, one fold, booking as a pure function; one sign convention per card; `paidToContractors` named for what it is.
- **`principle-subtract-before-you-add`:** no rules, sync, or `accounts.js` change; no copy of FIGURES or `countedAmount`; the cap stays its own job; the effect word is one derived rule, not a per-figure table.
- **`principle-make-operations-idempotent`:** a held id, `commitDoc` dedupe, deterministic `stl_` ids, two-tap tests, E7.
- **`principle-prove-it-works`:** B9, B12, B13, B15-B17, B20 (r5 invariant), D2b and D11 parsed from the rendered HTML, 27 numbered mutations (14 has three parts), E3/E6-E9 on real stamps; the Architect's window probe re-run here byte-identical (r4).
- **`principle-sequence-verifiable-units`:** wording mini-PR (merged, #110), then the cap job, then J (head cut after the cap merge) with commits booking → displays → saves → L-12 (b), then L.
- **Not applicable:** `tdd` (not asked) and `arena` (banned).
- **The code PR updates** `feature`, `maintain-verification-skill`, and `opening-a-pr` in `docs/PSTACK_INVENTORY.md`, with evidence links only (gj-sketch:735).

---

## 13. Changelog r2 (dd431aec) → r3

| r2 note (source) | r3 change | Where in r3 |
|---|---|---|
| **M-2** (r2 review §4-5; accountant M2-2311 (a), r2 items 3 and third reply) | Correction rows show the **raw** delta under the same FIGURES label; a reversal is negative (`مدفوع للعمل −600,000`). Net and B9 apply the line `sign` internally, read from `statementLines` (no FIGURES copy). r2's `NET_SIGN` signing undone. Each row says what it corrects (label) and its source period (`من`/`إلى` of the issued statement); rows are per (figure, issued window). No new string. Tests B5r, B12, B13, B14, D2 (net stays 350), D2b (rows sum to the net). Mutation 14. | §1(4), §3.3, §3.5, §3.6, §3.7, §6.1 |
| **L-8** (E-3 conditions, r2 review §2) | Gate steps 2-9: await in-flight flush before t0; race `FLUSH_MS` → `'pull'`; try/catch → `'pull'`; `'epoch'` abort; only `onClick` reaches the gate. New inputs `inFlight`, `timeoutMs`, `epoch`. Tests G7, G8, G9 (+ G10, G11). Mutations 15, 16, 18. E-3 marked ACCEPTED WITH CONDITIONS. | §3.5, §3.6, §4.2, §5, §6.1 G |
| **L-9** (OPEN-12 ruling) | The issue card shows the figures being issued, existing labels, same renderer as the statement card. D10, drive check. | §1(2), §2.1(2), §3.6, §3.7, §6.1 D10, §6.4 |
| **L-10** (OPEN-13 / OPEN-14 rulings) | JQ3 (both screens) and Q19 on H's return form moved to the mini-PR. J drops the `accounts-view.js:388` edit and the JQ3 assertion in `tests/accounts-view.test.js`; D3 asserts only. | §2.1, §2.2, §3.4, §3.7, §6.1 D3, §8 |
| **L-11** (citation nit) | §14 (the old r1 → r2 table) now cites JQ6 as "follow-up line 2". | §14 |
| **INFO** (version pins) | J's code head is cut only after the mini-PR merges; J takes the next `VERSION`. | header, §2.2, §7 |
| **OPEN-1 / OPEN-10** (answers:11) | Heading `تصحيحات فترات سابقة` above the rows, before the net/closing. Approved new string. | §3.3, §3.7, §8 |
| **OPEN-2** (answers:13) | M-1 stays; marked decided. | §3.3 |
| **OPEN-3** (answers:12) | Issue-block sentence `لا يُعتمد الكشف وفيه قيد لم يُرسل بعد`; replaces the `لم يُرسل` fallback. B7b asserts it. | §3.7, §4.2, §8 |
| **OPEN-4** (answers:17) | A14(b) at `accounts-correct.js:54` becomes `…أو التسوية…`. `tests/accounts-correct.test.js:76` updated. S7, mutation 19, drive check. | §2.1(5), §3.4, §5, §6.1 S7, §8 |
| **OPEN-7** (answers:18-19) | Six strings approved; `النقد الخارج` → `المدفوع للمقاولين` everywhere; `cashOut` → `paidToContractors`. Merge no longer blocked by strings. | §3.5-§3.8, §6, §7, §8 |
| **OPEN-9** (answers:13, 25) | 820,000 confirmed; section marked decided. | §3.8, §6.1 D4 |
| **OPEN-9b** (answers:26; accountant condition) | Custody-paid rows count; the figure is never summed with company cash. D9 test, mutation 13, hard constraint. | §3.6, §3.8, §6.1 D9, §9 |
| **OPEN-11** (second owner phone: YES, answers:21) | Raised to MEDIUM. §4.3 shows the cover (G4, G7-G12, E6, E7) and lists residual risks R1-R4 for the Architect. G12: `issuedAt` in the compare, button hidden once issued. Mutation 17. E7 added. | §4.3, §3.6, §6.1 G12, §6.3 E7, §11 |
| **OPEN-12** (answers:20) | Accepted; date field as is, no 'previous period' option. | §3.3 |
| **JQ5** (answers:7) | Never asked; keeps its fallback, stated as such. | §3.7, §11 |
| **OPEN-8b** (E-3) | Accepted with conditions (L-8). | §5 |
| **OPEN-13 / OPEN-14** | Resolved by the mini-PR. | §2.2 |
| **Pending list** | Only Architect rulings remain (OPEN-11 R1-R4 and rating, OPEN-15, OPEN-16, OPEN-17, E-3 confirm). | §11 |
| Inputs | Six new inputs, each sha256-checked; 2304 item 3 marked superseded and unused. | header |

---

## 14. History: changelog r1 (78d23067) → r2 (kept from r2 §13; L-11 citation fixed)

| r1 note (source) | r2 change | Where in r2 |
|---|---|---|
| **M-1** (review §6): mid-period issue pushes the rest of the period into the next one | The button shows only when `periodEnd < today()`. `'open'` error. B6 rewritten as a/b/c. The drive issues a closed week. Mutation 8. | §2.1(2), §3.3 "Issue only for a closed period", §3.6, §3.7, §4.2, §6.1 B6, §6.4, §6.5 |
| **L-1** (review §6, OPEN-11 ruling) | `issueGate`: online, flush, pull (`lastSyncAt >= t0`), outbox empty, recompute-equal. Tests G1-G6 and E6. Mutation 10. New exception E-3. | §2.1(6), §3.5, §3.6, §4.2, §5 E-3, §6.1 G, §6.3 E6 |
| **L-2** | `queuedIds` = every in-scope doc with `nd <= periodEnd`. B7b covers a doc dated before `periodStart`. Mutation 9. | §3.5, §3.6, §4.2, §6.1 B7 |
| **L-3** + follow-up line 3 | `reclassAdvance` is hard-zeroed, with no line. JQ4's label is painted in L. D4 asserts no line, even with an `L:e1;` description. Mutation 12. | §2.2, §3.5, §3.6, §3.7, §6.1 D4, §8 |
| **L-4** | The project totals are in a separate card outside the statement card and outside the byte-equal check. D8 added. | §3.4, §3.6, §3.7, §6.1 D8, §6.2 |
| **L-5** | Saves 11 and 12 are hidden on inactive projects. `'inactive'` error. S8 added. | §3.6, §3.7, §4.2, §6.1 S8 |
| **L-6** | Drives pick rows by id or `targetId`, never by amount. | §6.4 |
| **L-7** | The test lists are 45 files (44 `tests/` + `scripts/verify-aj.test.js`), and become 47 after J. | §3.4 |
| **E-2** must match `settlesId` (review §3) | Exact predicate stated. Not `livePointer`. S7 adds a negative case. Mutation 6 extended. | §2.1(5), §5, §6.1 S7 |
| **OPEN-5** (Architect: one PR) | One PR, commit order booking → displays → saves. | §7 |
| **OPEN-8** (E-1 and E-2 accepted) | Marked ACCEPTED. E-3 added for the Architect. | §5, §11 |
| **OPEN-9** (accountant advice) | `cashOut` includes `unlinked`, because every ledger row is a payment (no status field, `firestore.rules:83`). The example is rechecked: cost 840,000, cash out **820,000** instead of the sketch's 780,000. OPEN-9b added. Mutation 11. | §3.6, §3.8, §6.1 D4 |
| **OPEN-10** (accountant advice) | «مستخلص» includes that period's correction rows, signed, before `الصافي`. Correction rows are now signed by their effect on the balance (NET_SIGN), and B9 sums them. D2 has a correction case. Heading → OPEN-1 fallback. | §3.3, §3.6, §3.7, §6.1 D2, B9 |
| **OPEN-2** (accountant agrees with M-1) | Closed by the M-1 default. | §3.3, §11 |
| **OPEN-11** | Mitigated by L-1. Optional fact question kept. | §5, §11 |
| **Q19** approved (EA-relayed) | Painted on the settle form. D5 now asserts it is present on cap or cumulative and absent otherwise. Mutation 7 inverted. Q19 on H's form → OPEN-14. | §2.1(1), §3.7, §6.1 D5, §8, §11 |
| **JQ2** (EA-relayed) | `الرصيد المستحق 0 د.ع` kept; now approved rather than a fallback. | §3.6, §3.7, §8 |
| **JQ3** (EA-relayed) | `public/accounts-view.js:388` `unit` becomes `حسب الإنجاز (الكمية × سعر الوحدة)`. D3 updated. «مقاول» scope → OPEN-13. | §3.4, §3.7, §6.1 D3, §8, §11 |
| **JQ4** (EA-relayed) + follow-up line 3 | Approved label, not painted in J. | §2.2, §8 |
| **JQ5** | Not asked. Fallback stays. | §3.7, §11 |
| **JQ6** (EA-relayed) + follow-up line 2 | Out of J. Separate mini PR `PLAN-H-jq6-mini.md` in `public/accounts-payment.js` (:27-28, :914-915). It lands **before** J. The only shared files are the version pins. | §2.2, §7 |
| **OPEN-1, 3, 4, 7** (follow-up line 4-7; accountant items 3-4) | Fallbacks written. Accountant suggestions listed as new strings for Ameer. OPEN-7 blocks merge. | §4.2, §8, §11 |
| **OPEN-6** | Still a rules item outside J. | §2.2, §11 |
| Inputs | Four new inputs, each sha256-checked. Ameer's answers labelled EA-relayed; the accountant's as advice. | header |

---

## 15. Changelog r3 (1740e26b) → r4

Source for every row: `REVIEW-plan-J-r3-1740e26b.md` (`4dfd7753…e36e`) unless marked.

| r3 note (source) | r4 change | Where in r4 |
|---|---|---|
| **M-3** (review §3): a doc closed by an approval ending on or after `s` got no row; B9/B12 failed; §3.3:225 partition claim false | Pool takes approvals with **any** `periodEnd`; each window clips at `s-1`. The false claim is replaced by a four-step completeness argument. B15 (probe W1); mutation 20. | §3.3 (pool, windows, "Completeness"), §3.6 `windows`, §6.1 B15, §6.5 |
| **M-4** (review §3): issuing an older period later changed an issued card's labels; ties undefined | Pool frozen at `issuedAt(P)` (all synced approvals if unissued); order `(periodEnd, periodStart, id)`; skip a window whose clipped end ≤ previous end. Proof gains step 5 (labels frozen). B16 (probe W2), B17 (probe W3 + equal-end week/month); mutation 21. | §3.3, §3.6, §6.1 B16-B17, §6.5 |
| Probe `windows-fix.out` | Hashes checked against review §0; the engineer re-ran `windows-fix.js` on this checkout: output byte-identical (`a65180de…`). | header |
| **L-12** (review §3; accountant r3 item 2) | Gap named (`public/accounts.js:857-863`, `drawOn` :851-852). Default (a): B18 documents current behaviour (numbers checked on the base fold, `probe-r4/l12.js`). Option (b) **[PENDING AMEER]**: `orphanDrawIds` joins `'review'`, message reuses the approved OPEN-4 sentence + existing labels and `عكس`; no new string; optional commit 4; mutation 22 only if included. | §4.3 R4, §4.4, §6.1 B18, §6.5, §7, §8, §11 |
| **L-13** (review §3, OPEN-17) | The issue card renders `screen.shown`, the same reference the gate deep-equals; one renderer `statementCardHtml`. D10 sets «حسابات» to the agreement's project, asserts `===` on the object, and shows the all-projects case may differ. | §3.6 `issueBlock`/`issueGate`, §3.7 Save 12 card, §6.1 D10 |
| **L-14** (review §1, §3) | Header and §11: M-2 rests on the accountant's «المحاسب يقرر» delegation (`AMEER-answers-r2.md:13`), not an Ameer answer; r3's "all answered" removed. `AMEER-answers-J.md` cited at its current sha `82763a82…` (line 27). Optional one-word M-2 confirm listed. | header table + note, §11 |
| **E-3 ruling** (review §4) | Recorded CONFIRMED (G7-G9; G10, G11). | §11 |
| **OPEN-11 ruling** (review §4) | Recorded MEDIUM accepted; R1 INFO (option (b) dropped), R2 harmless after M-4, R3 LOW-MED, R4 LOW. | §4.3, §11 |
| **OPEN-6 ruling** (review §4; accountant r3 item 1) | Ameer decision before J merges, not a blocker; separate rules item. Architect and accountant positions both recorded. | §4.3 R3, §4.5, §11 |
| **OPEN-15 ruling** (review §4; accountant r3 item 3) | **[PENDING AMEER]** one-line go; design ready as optional commit 5 (`صافي السلف` between `الخصومات` and the corrections), D2c, mutation 23; fallback three lines + D2b. Includes the W1 label note for the accountant. | §7, §8, §11 |
| **OPEN-16 ruling** | Accepted with the M-3/M-4 fix. | §3.3, §11 |
| **OPEN-17 ruling** | Accepted with L-13. | §3.7, §11 |
| INFO: mini-plan r2 off-by-one in the 597-621 test lines | J not affected; handled in the mini-plan's own review. | — |
| Scope | Unchanged: no rules, sync.js, accounts.js or CSV change; J's code head still cut after the mini-PR merges. | §2.2, §4.1, §7, §9 |

---

## 16. Changelog r4 (66468cbd) → r5

Sources: `AMEER-answers-J.md` at `451559e4…` (`answers:N`), `REVIEW-plan-J-r4-66468cbd.md` (`c3333981…`), `ACCOUNTANT-advice-M2-alt.md` (`31dc959a…`), `PROPOSAL-M2-signs-r1.md` (`56ffc9a8…`), `PLAN-cap.md` (`a74a0514…`).

| Item (source) | r5 change | Where in r5 |
|---|---|---|
| **M-2 replaced** (`answers:34` «لا»; `answers:37` verbatim «M-2: الخيار الثاني، وأوافق على الكلمتين «ينقص المستحق» و«يزيد المستحق»»; option (ب) = `ACCOUNTANT-advice-M2-alt.md:5`) | Rows show the positive amount, the existing FIGURES label, «يزيد المستحق» or «ينقص المستحق», then `من`/`إلى`. `effect = sign(SIGN·raw)`; raw 0 → no part; effect 0 (settle) → kept, not printed. Advance rows use their own signs; «صافي السلف» is never a correction label. Internal maths, B9 and D2's 350,000 unchanged. Two approved new strings. `CorrectionRow` gains `part` and `effect`. r4's raw-negative rows removed. | header table, §0 note, §1(4), §3.3 "Display", §3.5, §3.6 `correctionText`/`EFFECT_WORD`, §3.7, §8 |
| **Mixed-window downside of (ب)** (`PROPOSAL-M2-signs-r1.md:125`) | Handled by the Architect's late/reversed split (:51-54): up to two rows per (figure, window), each with its own word. Single netted row is the fallback (R5-Q1). | §3.3, §6.1 B22, §11 |
| **Architect test ideas adapted** (`PROPOSAL-M2-signs-r1.md:105-108`) | B20 (late + reversed = raw delta; effect rule; printed rows sum to closing − opening − periodNet; sign bounds only without `sup_`), D11 (row regex; no U+2212; `-` only inside dates), B21 (`paymentRefund`/`deduct` in a non-first window), B22 (mixed window). B2, B4, B5, B5r, B13, B15, D2, D2b, D6, E3 and the statement-approval drive rewritten to the new text. Mutation 14 becomes 14(a) signed print, 14(b) raw-sign word, 14(c) no split; new 25, 26. | §6.1, §6.3, §6.4, §6.5 |
| **L-12 (b) in J** (`answers:32`) | No longer optional: commit 4. `orphanDrawIds` in `BookedStatement`, in `'review'` and in the gate compare. Issue card shows the OPEN-4 sentence and each orphan row with `عكس`. B18 flipped, D12, S9, E9, mutation 22 (now default) and 27. | §1(5), §2.1(7), §3.5, §3.6, §3.7, §4.2, §4.4, §6, §7 |
| **LOW-16** (r4 review §4) | §4.4 and §7 now agree: the field is part of the type, added by commit 4, always computed; no "default scope", no flag. | §3.5, §4.4, §7 |
| **LOW-17** (r4 review §4) | The `عكس` button is described as a write path in a new place: I's `reversalDoc` + `commitDoc`, the `سبب التصحيح` reason, one tap, no confirm (I confirms only for approvals, `accounts-correct.js:1011-1016`), deterministic id. S9 drives the full UI flow (not a direct write); mutation 27. | §4.4, §6.1 S9, §6.5 |
| **OPEN-15 in J** (`answers:33`) | `صافي السلف` between `الخصومات ومرتجعات المواد` and the corrections in «مستخلص»; D2/D2b/D2c updated; mutation 23 now default. In commit 2. Negative period value → R5-Q3. | §1(6), §2.1(8), §3.6, §3.7, §6.1, §7 |
| **LOW-15** (r4 review §4, probe `allproj.out`) | All-projects view builds parts per project (that project's docs and pool, plus party-wide approvals), concatenated in `projectId` order. B19, mutation 24. | §2.1(9), §3.3, §6.1 B19, §6.5 |
| **OPEN-6 → separate cap job before J** (`answers:31`; `PLAN-cap.md`) | §4.3 R3 and §4.5 close as "done by the cap job". J cut after the cap merge; sw `aj-p0-v82`; settles and draw reversals go through `writeCapped` with no J call; fixtures use `sendCapped`; E8 (two-phone cap through J's settle) and E9 (orphan reversal on a dead advance). Deploy order: J's hosting only after the cap's rules are live. All marked [DEPENDS ON CAP FINAL]. | header, §2.1(1), §2.2, §3.4, §4.3, §4.5, §6.3, §7, §9, §10, §11 |
| **Mini-PR merged** (`answers:30`) | The "mini-PR first" gate is closed; mini-PR wording now cites #110 and its lines at 4d30d117. | header, §2.1(4), §2.2, §3.4, §3.7, §7, §8, §10 |
| Re-base: `public/accounts-payment.js` (#110 turned lines 14-16 into two lines, removed :28 and :915, and added :287) | `:24 → :23` (`سلفة`), `:33-42 → :31-40`, `:38 → :36` (Q19), `:158/189/176 → :156/187/174`, `:1075 → :1073`, `:1097 → :1095`; r4's `:28`/`:915` (JQ6) and `:288` (Q19 on H) now read as done at :36/:287. | §2.1, §2.2, §3.2, §3.6, §3.7, §8 |
| Re-base: `tests/accounts-view.test.js` (+1 from :15) | `144/213/228/244/259 → 145/214/229/245/260`. | §3.4, §6.1 |
| Re-base: `public/sw.js:2` | `aj-p0-v80` at base; cap v81; J v82 expected. | §2.2, §3.4, §7 |
| Re-base: every other cite | Unchanged files (`git diff --quiet 32bccf81 4d30d117`), so the cites stand. "at 32bccf81" wording updated to 4d30d117. | header, §0, §3.8, §4.4 |
| Provenance and §11 | M-2 no longer pending; no Ameer item pending; new questions R5-Q1 to R5-Q7 for the Architect and accountant; r4 review rulings recorded. | header, §11 |
| Hard rules | Unchanged and restated: `CONTRACTOR_COST_START` stays `null`; no CSV change; no `firestore.rules` change in J; no new Arabic string beyond the two approved words; no edit to `.cursor/rules/pstack-models.mdc`. | §8, §9 |

---

## 17. Changelog r5 (fcdf5b0f) → r6

Sources: `AMEER-answers-J.md` `6a32a854…` (lines 39-43), `REVIEW-plan-J-r5-fcdf5b0f.md` (`8c4b62f2…dfc47`, "review"), `ACCOUNTANT-advice-J-r5.md` (`4285d75d…`, "acct"), `AMEER-card-M2-t2173s7591.md` (`5212bf5d…`), `PLAN-cap-r2.md` (`db910576…`), cap reviews `c0ecd5db…` and `556b80a7…`.

| Item (source) | r6 change | Where in r6 |
|---|---|---|
| **M-1** (review :96-112): deduct cascade; completeness step 3 false | Tail part per scope and project: `(last window end, s-1]` (all days ≤ s-1 with no window), same parts and row format, `من <first tail day> إلى <s-1>`; Σ parts = delta by construction. Step 3 struck and replaced. B24 (+ two-project case), B20 generator gains the cascade world and two projects; mutation 28. The issue block on orphan deducts was then decided YES (next row). No new string. | §3.3 (code, Completeness, tail bullets), §3.5, §3.6 `tailWindow`, §6.1 B20/B24, §6.5, §11 |
| **M-1 block** (review :112; **Ameer 08:47 `answers:39-40`, `:43`**) | DECIDED YES: `orphanDrawIds` also takes a live approved deduct on a non-live approval; same «عكس», same approved sentence; tail row kept as the baseline (B24(c)). B25, S10, E10, mutation 32. | header table, §3.3, §4.4, §6.1, §6.3, §6.5, §11 |
| **M-2** (review :114-122): E7 and §4.3 expected a refusal | Second `stl_m_1` is adopted: plain adopt, or adopt + `linkRefusals` with a minted id (`sync.js:1013-1019`; E27 `account-adopt.test.js:329-345`); never `syncErrors` or `رُفض الإرسال`. After the cap, via `already-exists` (cap B-1). Mutation 31. | §4.3 table, §6.3 E7, §6.5 |
| **LOW-1** (review :126-130; cap r2 review) | Named cap dependencies B-1, B-2, M-1 (clamp), C19/C21, M-3. "Reversals are always accepted" stated to hold only after cap M-1. No J test may expect a fitting capped op to be refused. E8/E9 wording. | §4.4, §4.5, §6.3, §11 |
| **LOW-2** (review :131-133; cap r2 review LOW-2 `:65`) | Any hosting deploy from main after the cap merge (J included) is rules + hosting together, with pre-check, saved ruleset, 2-minute wait and rollback pair. | §4.5 table, §7 |
| **LOW-3** (review :134) | "Ameer's mock" → "the accountant's mock that EA put to Ameer"; the filed card `AMEER-card-M2-t2173s7591.md` cited with `answers:37`. | header, §3.3, §6.1 B5r, §11 |
| **LOW-4** (review :135-138) | All-projects pools freeze at the viewed P's all-projects `issuedAt` (the party-wide row); normally null, so an unissued display. B16-all. | §3.3, §6.1 |
| **LOW-5** (review :139-142) | J's unit files in `ci.yml:68` + `"test"`, emulator file in `ci.yml:210` + `"test:emulator"`. | §3.4 |
| **LOW-6** (review :143) | Concrete "he owes, late payment reads «ينقص المستحق»" example for the accountant. | §11 R6-Q1 |
| **LOW-7** (review :144) | D13: exactly one `#cc-reason` in all four render cases; mutation 30. | §6.1, §6.5 |
| **Acct Q2** (acct :3) | D2b already asserts printed lines = `الصافي` / closing (evidence: `net` has no settle term, `accounts.js:865`; settle sign 0, :544). D2d adds a settle world. Settles shown on the card (`تسوية سلفة`, `سلف قائمة عليه`). R6-Q2 asks if that is enough. | §6.1 D2b/D2d, §11 |
| **Acct Q4** (acct :5) | Closing line `رصيد آخر المدة` = positive amount + existing `مستحق له`/`مستحق عليه` (`accounts-view.js:372`). D14, mutation 29. | header table, §3.7, §6.1, §8 |
| **R5-Q3** (review §3; acct :4; **Ameer 08:47 `answers:39-42`**) | DECIDED option (b): a negative period «صافي السلف» prints the positive amount + «يزيد المستحق»; «الصافي» uses `مستحق له`/`مستحق عليه`; no minus anywhere in «مستخلص». D15 rewritten, D16 added, mutation 33. | header table, §3.6, §6.1, §8, §11 |
| **R5-Q1/Q2/Q5/Q6/Q7** (review §3) | Recorded as accepted/confirmed. | §11 |
| Cloud-agent models | J's agent: grok-4.7 only, prompt carries `/workspace/pstack-block-grok-only.md` (`d5cfc070…`). | header, §9 |
| Hard rules | Unchanged: `CONTRACTOR_COST_START` stays `null`; no CSV change; no `firestore.rules` change in J; no new Arabic string (r6 adds none); `.cursor/rules/pstack-models.mdc` not edited. | §8, §9 |

---

## 18. Changelog r6 (0b0319ae) → r7

Sources: `REVIEW-plan-J-r6-0b0319ae.md` (`10a7155a…1453`, "review"), `ACCOUNTANT-advice-J-r6.md` (`3b158674…37c9`, "acct6"), `AMEER-answers-J.md` (52 lines, `3534154a…1e`) (prefix 43 = `6a32a854…`, prefix 37 = `451559e4…`), `PLAN-cap-r3.md` (`e02a5880…`), `REVIEW-plan-cap-r3-e02a5880.md` (`d0428faf…`), `cloud-prompt-cap.md` (`3f23ece1…`).

| Item | Change | Where |
|---|---|---|
| **MEDIUM-1** (review §5) B24(c) | `rev_d1` books at `d1`'s day 11-18 (unclosed): the tail row is gone, the opening rises by 50,000, B9/B12 hold. New B24(d): week 11-16..11-22 issued before `rev_appr_m1` → window row `… من 2026-11-16 إلى 2026-11-22` before and after `rev_d1`. §3.3 bullet and the header row reworded: no issued statement carries a tail deduct row. Mutation 34 added. Tail definition unchanged. | header table, §3.3, §6.1 B24, §6.5 |
| **MEDIUM-2** (review §5) R6-Q4 ruling | "No Ameer item is pending" → ONE **[NEEDS AMEER]** item (two questions now with EA): (1) card `رصيد آخر/أول المدة` signed vs `مستحق له/عليه`, both or neither; (2) «الصافي» الأول vs الثاني. **Held:** D14, D16's «الصافي» clause (now D16-الصافي), mutation 29, R6-Q4. Both variants written as small deltas. Everything else proceeds; J does not merge before the answer. | header table, §3.6, §3.7, §6.1 D14/D16, §6.5, §8, §11 |
| D2 "first world" | 450,000 = 600,000 − 50,000 − 100,000 is D2's first world; 350,000 is the reversed-approval world. Said in D16-الصافي, §11 question 2 and R6-Q4. | §6.1, §11 |
| **LOW-1** answers re-cite | `AMEER-answers-J.md` as it now stands (52 lines, `3534154a…`; prefix 43 `6a32a854…`, prefix 37 `451559e4…`). `:45-47` (Ameer's own 08:52 words) are the source for «صافي السلف» and the block; `:41-43` labelled EA's record of the accountant's picks; "no minus" at `:42` no longer used as a rule for the whole «مستخلص». | header, header table, §3.3, §3.6, §4.4, §6.1, §6.3, §11 |
| **LOW-2** B25 control | (e): the later week 11-23..11-29 is also blocked until `rev_d1`, then issues with no tail row. §4.4 says every period with `nd ≤ periodEnd` is blocked. | §4.4, §6.1 B25 |
| **LOW-3** mutation order | §6.5 sorted 28-34. | §6.5 |
| **LOW-4** / acct6 :2-4 | R6-Q1, R6-Q2, R6-Q3 closed by the accountant (closing line enough, note sent to Ameer; Q2 condition met, no settle line in «مستخلص»; days clear). R6-Q4 moved to [NEEDS AMEER]. | §11 |
| acct6 :5 | The accountant's wish that the card's «صافي السلف» also switch is recorded as a possible extra question for EA; not added to the [NEEDS AMEER] item as given; the card stays as today unless Ameer says otherwise. | §11 |
| Cap r3 | Cap plan r3 `e02a5880…` CONFIRMED, code being built by one cloud agent. §4.5 cites moved to r3 lines. Ameer 09:00 (`answers:50-52`): Q19 `المُرجَع والتسوية أكبر من السلفة` on a true over-cap at send (E8 now expects it instead of `رُفض الإرسال`; the placement is the cap PR's, J adds no string); deploy steps approved; #110 ships with the cap. | header, §4.5, §6.3 E8, §8, §11 |
| Hard rules | Unchanged: no new Arabic string; `CONTRACTOR_COST_START` stays `null`; no `firestore.rules` or CSV change in J; `.cursor/rules/pstack-models.mdc` and `AMEER-answers-J.md` not edited; J's cloud agent grok-4.7 only with `/workspace/pstack-block-grok-only.md`. | §8, §9 |

---

## 19. Changelog r7 (5afdb946) → r8

Sources: `AMEER-answers-J.md` (`7b7600e4…01b8`, 56 lines; prefix 52 = `3534154a…`, prefix 43 = `6a32a854…`, prefix 37 = `451559e4…`), lines `:54-56`; `AMEER-card-J5-t2187s7642.md` (`ba9fc6f8…e502`).

| Item | Change | Where |
|---|---|---|
| [NEEDS AMEER] Q1 → **DECIDED** (`answers:55`) | Both card balance lines, `رصيد أول المدة` and `رصيد آخر المدة`, print |amount| + `مستحق له`/`مستحق عليه`. D14 un-held and extended to the opening; mutation 29 un-held. The "لا" delta removed (one-line history note kept). | header table, §3.7, §6.1 D2b/D14, §6.5, §11 |
| [NEEDS AMEER] Q2 → **DECIDED** (`answers:56`) | «الصافي» = |net| + `مستحق له`/`مستحق عليه` (option الأول). D16-الصافي un-held; R6-Q4 closed. The الثاني delta removed (one-line history note kept). | header table, §3.6, §6.1 D16, §6.5, §11 |
| Optional Q3 | Not asked; the card's own «صافي السلف» stays as today. | header table, §3.7, §6.1 D14, §11 |
| Architect r6 LOW-1 (card filed) | `AMEER-card-J5-t2187s7642.md` cited. | header |
| Answers file | Re-cited at 56 lines; prefix hashes 52/43/37 re-checked and stated. | header, §19 |
| §11 | "One Ameer item is open" → no Ameer item is open for J. [PENDING ARCHITECT] now covers §18 and §19. | §11 |
| Unchanged | Everything else, and all hard rules: no new Arabic string; `CONTRACTOR_COST_START` null; no `firestore.rules` or CSV change in J; `.cursor/rules/pstack-models.mdc` and `AMEER-answers-J.md` not edited; J's cloud agent grok-4.7 only with `/workspace/pstack-block-grok-only.md`. | — |

---

## 20. Changelog r8 (e0e739d9) → r9

Sources: `REVIEW-plan-J-r7-5afdb946.md` (`fe5e403a…1f66`, CONFIRMED r7, "review7"); the r8 steering (09:20); `AMEER-answers-J.md` `:55` (unchanged file, `7b7600e4…`).

| Item | Change | Where |
|---|---|---|
| review7 LOW-1 | Mutation 28 turns **B24(a)/(b) and B20** red, not B24(d) (no tail there). | §6.5 |
| Opening balance (held in r9; released in r10) | `:55` says «الرصيد», not «رصيد أول المدة». The opening switch is held and kept as a ready delta; the closing switch stays decided. D14 split into D14-closing (active) and D14-opening (held; until release D14 asserts the opening is unchanged). Mutation 29 covers the closing and «الصافي»; its opening part is held. D2b reads the opening as printed. Release only after EA files card t2191s7670 showing question ١ included «(ونفس الشي لرصيد أول المدة)». | header table, §3.7, §6.1 D2b/D14, §6.5, §11 |
| review7 (mutation 34) | B24(c) states its explicit "no tail row" and "opening 300,000" asserts; B9 alone stays green under mutation 34. | §6.1 B24, §6.5 |
| Kept (no change) | D16-الصافي / §3.6 option الأول only; D2b reads `مستحق عليه` on «الصافي» as negative; R6-Q4 answered. | §3.6, §6.1, §11 |
| Unchanged | Everything else and all hard rules (no new Arabic string; `CONTRACTOR_COST_START` null; no `firestore.rules` or CSV change in J; `.cursor/rules/pstack-models.mdc` and `AMEER-answers-J.md` not edited; grok-4.7 only). | — |

---

## 21. Changelog r9 (79acf4ff) → r10

Only change: **release the opening-balance hold.** Evidence (sha256 verified 2026-11-25 Baghdad): `AMEER-card-J6-t2191s7670.md` `e4d3529b3bf72cb8e78741f318c2111ebd86c9cd83d3c8fb331b392b8579c697`, quoted exactly:
- `:7` «**١:** بكشف الحساب، إذا المقاول عليه فلوس، الرصيد هسه يطلع بالناقص، مثلاً «رصيد آخر المدة −100,000 د.ع». نغيّره ويصير «رصيد آخر المدة 100,000 د.ع مستحق عليه»؟ ونفس الشي لرصيد أول المدة.»
- `:17` «- Step 1 prompt: الرصيد يصير «100,000 د.ع مستحق عليه» بدل الناقص؟»
- `:18` «  - Answer: ١: إي، الرصيد يصير «مستحق عليه» بدل الناقص»

Also cited where relevant: `AMEER-card-CAP-t2190s7664.md` `699871c952969ab01b76e5ad6a74e4a4d1a9cfb5ffd0d7bcfcf5298231e9e13b` (`:9`, `:17`, `:19`, `:21`). No new Arabic string (the balance lines reuse `مستحق له`/`مستحق عليه`, `public/accounts-view.js:372`); no other behaviour change; line count of the body unchanged (every edit is in place).

Every edited line (r9 line = r10 line):

| Line | Edit |
|---|---|
| 1 | Title r9 → r10. |
| 5 | r9 header bullet: marker replaced by "(held in r9 until card t2191s7670 was filed; released in r10)". |
| 85 | Header-table row: DECIDED for both balance lines and «الصافي»; card t2191s7670 `:7`, `:17`, `:18` cited. |
| 633 | §3.7: both `رصيد أول المدة` and `رصيد آخر المدة` print |amount| + `مستحق له`/`مستحق عليه`; D14 and mutation 29. |
| 634 | §3.7: the held "ready delta" bullet replaced by a one-line history note. |
| 757 | §4.5 cap status: cites `AMEER-card-CAP-t2190s7664.md` `:17`, `:19`, `:21`. |
| 772 | §4.5 deploy row: cites the cap card `:9` (steps apply to every later update, including J, each with Ameer's approval at the time). |
| 880 | D2b: the opening is read like the closing (`مستحق له` +, `مستحق عليه` −). |
| 893 | D14 heading: both lines active, card evidence cited. |
| 894 | D14-closing: "(active …)" tag removed. |
| 895 | D14-opening: active (no hold, no "unchanged opening" assert). |
| 971 | Mutation 29 covers the opening, the closing and «الصافي». |
| 1118 | §11 Answered: the opening part is released; no Ameer item is open for J. |
| 1129 | §11 R5-Q4: decided for both balance lines. |
| 1140 | §11 decided item 1: both lines; r9 hold → r10 release with the evidence. |
| 1178 | §11: the hold paragraph → "Opening-balance hold: released (r10)". |
| 1180 | §11 [PENDING ARCHITECT]: adds the r9 → r10 release (§21); marker removed. |
| 1372 | §20 history row: marker replaced by "(held in r9; released in r10)". |
| 1376-end | This §21 added. |

## §22 Changelog r10 → r11 (final)
- :902 S10 last clause fixed per Architect LOW-1 (REVIEW-plan-J-r10-7a45e22a.md sha 549cf2cc…f0af3, :53-56): "the November view still shows B24's tail row (baseline kept)." → "after the redraw the 11-23..11-29 view has no tail row and its opening is 300,000 (B24(c))." No other change; no re-review required per the Architect.
