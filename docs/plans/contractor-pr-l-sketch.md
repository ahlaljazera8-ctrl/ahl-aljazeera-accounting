# PLAN ONLY: contractor PR L (old labour rows that may be advances), r5

This is a plan. It has no code, no branch, no PR, no cloud agent, no Firebase or gcloud call, and no deploy. Nothing in the repo was edited. r5 (like r2-r4) was written by Python scripts that write literal strings into the file (Ameer's rule of 2026-11-25 15:35: no deploy commands inside file-writing commands). The plan text holds no executable deploy command, and no credential was exported while writing it.

- **Base:** main `27783e1c9babe9b63f2492705093909697f92e7a` (J merged as #112). Read in a separate clean clone, `/workspace/tmp/slice-l-plan/repo`, detached at that SHA. The deploy worktree `/workspace/tmp/deploy-j-112/repo` was only read (`git rev-parse`), not changed.
- **Scope source:** `docs/plans/contractor-pr-gj-sketch.md` (r18, sha256 `9faad7130f4f36f21da6a489c1f670789ab08999d61011322763cfeeb128c7e6`, blob `542e0a89`), section `### L` (:484-587), decision item 5 (:21), the rules note (:601), the advice point 4 (:650), and the [OPEN] items (:652-662).
- **Conventions:** `docs/plans/contractor-pr-j-sketch.md` (= `/workspace/tmp/slice-j-plan/PLAN-J-r11.md`, sha256 `07ab82bb…a8d2a96`, byte-equal), `contractor-pr-i-sketch.md` (sha256 `7a03fe20…d2e8`), `contractor-pr-k-sketch.md` (sha256 `7d7a1da1…7da4`), `contractor-pr-h-sketch.md`.
- **Ameer's J wording file** (outside the repo): `/workspace/tmp/slice-j-plan/AMEER-answers-J.md`, sha256 `7b7600e427f6825d51f799122d502937f19384884ddb8eeea128ebf4568901b8`, 56 lines. Cited as `answers:N`.
- **Skill:** `architect` was loaded and followed: trace every system L touches, sketch two shapes, pick the one where each piece of state has one owner (§3.1). Arena was not run (cost gate, gj-sketch:5).
- **r5 inputs (the Architect's r3 review; no other design change):**
  - r4: `/workspace/tmp/slice-l-plan/PLAN-L-r4.md`, sha256 `0d1ece6554639b8884387164d093ab73181f5e043ec51f36004f9c34a3906321`, 993 lines.
  - Architect review of r3: `/workspace/tmp/slice-l-plan/REVIEW-plan-L-r3-ce459cf1.md`, sha256 `bd4a68e844d8038637e44afc858c5b6de6a968834cda54739b3eb0f0ba5e5e1d`. Verdict **NOTES**: MEDIUM-C (an existing `existsAfter` pin goes red, §3.4, §4.4.5, §8), LOW-8 (RM5 split, §4.4.5), LOW-9 (stale citations, header), AQ12 and AQ13 agreed (§14). Its emulator probe of the r3 rules (11/11 pass; regression 213/214, the one red is MEDIUM-C) is in `/workspace/tmp/pr112-rv/lprobe-tests/` (`run3*.txt`, `zz-lprobe-r3.test.js`, `rules-r3-applied.diff`); the engineer read none of it as a reason to change the rules.
  - LOW-9: the review cites `AMEER-answers-L.md` as `45a52f50…`, an older version. That sha was superseded at 16:51, when EA appended Ameer's 16:51 answers; the file is now `AMEER-answers-L.md` sha256 `6dedd9d4eb56a6dbf4a08fbe858e34b7008d410f6a19f44b9758faa0a492fa9c` (mtime 16:51:27; it supersedes `d178073c…` and the Architect's cited `45a52f50…`). Every `ameer:N` in this plan refers to that version.
- **r4 inputs (decisions only; no design change from r3):**
  - r3: `/workspace/tmp/slice-l-plan/PLAN-L-r3.md`, sha256 `ce459cf1e007b411da4ba32a3be27861e426ba3edf39a108041e0f6dafd0306e`, 997 lines.
  - Ameer's answers to r3's س١-س٤: `/workspace/tmp/slice-l-plan/AMEER-answers-L.md`, now sha256 `6dedd9d4eb56a6dbf4a08fbe858e34b7008d410f6a19f44b9758faa0a492fa9c`, section "2026-11-25 16:51 Baghdad, card t2217s7785" (lines 28-34; the card replaces the unanswered words card `t2215s7779`, :26). Cited `ameer:30`-`ameer:33`. The earlier lines `ameer:10`-`ameer:15` are unchanged in the new file.
  - The accountant's advice on the three behaviour points: `/workspace/tmp/slice-l-plan/ACCOUNTANT-advice-L-r2.md`, sha256 `0eeffbe3d48cf2d27a466c428430b80e4d6b14efcbec617fbf489085c8224e80`, written 16:40, advisory only, agrees on all three. Cited `acct2:N`.
  - The accountant's r1 file stays as cited in r3: `ACCOUNTANT-advice-L-r1.md`, sha256 `84de25de…`, time 16:12.
- **r3 inputs:**
  - r2: `/workspace/tmp/slice-l-plan/PLAN-L-r2.md`, sha256 `3a71d03cc88f8a8d0b2c425b5c82e32a69dd396ca73a67540f913fe2c592ec42`, 934 lines.
  - Architect review of r2: `/workspace/tmp/slice-l-plan/REVIEW-plan-L-r2-3a71d03c.md`, sha256 `2dfe928b9bd97ac9842703153dcf4ed3126d712fd0e85d809f02ce3313d71a58`. Verdict **NOTES**: MEDIUM-A, MEDIUM-B, LOW-1..7, and three points beyond Ameer's words (§5 there). `CHANGES-r2-r3.md` maps each note.
  - The Architect's emulator probes of the r2 rule text (read only; the engineer ran nothing): `/workspace/tmp/pr112-rv/lprobe-tests/` — `rules-r2-applied.diff` `0e253e99…`, `zz-lprobe.test.js` `51011f7a…`, `run1.txt` `815810b0…`, `run2.txt` `80885d40…`. Cited as `probe:P<n>`.
- **r2 inputs:**
  - r1: `/workspace/tmp/slice-l-plan/PLAN-L-r1.md`, sha256 `a1382790249b6233d0de82e85fde59835a458938e8f10aa3f6041914b7c72d7c`, 683 lines.
  - Architect review of r1: `/workspace/tmp/slice-l-plan/REVIEW-plan-L-r1-a1382790.md`, sha256 `5901e4e1c5fd61ca95eca8cfac6f101633c9335b9cceda865d81f558c6ab26b9`. Verdict **NOTES**: MEDIUM-1..4, LOW-1..4, INFO-1..2, and AQ1-AQ7 answered. `CHANGES-r1-r2.md` maps each note to its r2 section.
  - The accountant's advice on r1 (محاسب أهل الجزيرة, **advice only, not a decision**): message of 2026-11-25 16:05 Baghdad (UTC+3), sent to the engineer via SendToAgent (relayed; the Arabic in that message is not on file). The filed version is `/workspace/tmp/slice-l-plan/ACCOUNTANT-advice-L-r1.md`, written **16:12** (its header now says 16:12; it was corrected at 16:40 from a wrong 16:15, so its sha256 changed from `e2bc01f6…` to `84de25de0d35c06e72518dd1e564baa34c1b8d5abd350ed04523511d7094b81a`). r3 uses one time for the file: 16:12. Cited as `acct:م<n>`; where the file has no such text, the citation says "(relayed)".
- **Relayed sources (INFO-2).** The Architect found neither of these on the box at review time. Both are relayed, not verbatim from Ameer or the accountant to the engineer:
  - Ameer's «اكمل خطواة L»: EA relay, 2026-11-25 15:45 Baghdad (chat msg `t2211u`). EA has since recorded it at `/workspace/tmp/slice-l-plan/AMEER-answers-L.md`, now `AMEER-answers-L.md` sha256 `6dedd9d4eb56a6dbf4a08fbe858e34b7008d410f6a19f44b9758faa0a492fa9c` (mtime 16:51:27; it supersedes `d178073c…` and the Architect's cited `45a52f50…`). Scope: **plan only**. No code, cloud agent or deploy without a further go.
  - The accountant's re-agreement to the two-step answer (4) (G1, م١): the accountant's message of 2026-11-25 16:05 via SendToAgent (relayed), filed at 16:12 in `ACCOUNTANT-advice-L-r1.md` ("I agree again with the revised answer (4)"). Advice only.
- **Ameer's decisions on the L questions (2026-11-25 16:18 Baghdad, card `t2214s7772`, verbatim, recorded by EA in `AMEER-answers-L.md` sha256 `6dedd9d4eb56a6dbf4a08fbe858e34b7008d410f6a19f44b9758faa0a492fa9c` (mtime 16:51:27; it supersedes `d178073c…` and the Architect's cited `45a52f50…`), lines 9-15).** These are EA-relayed card answers. The card's question text is on file at `AMEER-answers-L.md`:17-24, and the Architect checked each answer against it (r3 review §3, all six match). The plan treats them as decisions, cited `ameer:N`:
  - `ameer:10` «بالسيرفر حتى تبين بكل التلفونات، ويحتاج نشر القواعد بموافقتي»: the "already deducted" mark is stored **on the server** (who, when, which entry; create-only). This needs a `firestore.rules` change (§4.4). Rules and hosting deploy together, only on Ameer's separate go. The local-only design of r1 is dropped (§3.1 says why).
  - `ameer:11` «الزر «انخصم»»: the "already deducted" button and its mark are **«انخصم»** (r1 called it «روجع»). Approved word.
  - `ameer:12` «مجموع العمل المعتمد» و«مجموع المدفوع للعمل»: L5 wording, the person-page summary labels change (E-L4, now in scope). Approved words.
  - `ameer:13` «إي موافق، المصروف ينزل والربح يصعد»: the permanent drop in project spent and rise in profit after an accepted L `rev_` is accepted (MEDIUM-2 closed, §3.7).
  - `ameer:14` «بتاريخ اليوم، والتاريخ القديم ورقم القيد بالوصف»: the corrected advance is dated today; the old date and the entry id go in its description (§3.6, as r1).
  - `ameer:15` «نبين كل القيود حتى القديمة»: the list shows all old rows and is **not** held behind the contractor start date. `CONTRACTOR_COST_START` still stays `null`. Because the «مقاول» tab is hidden while the constant is null (`public/accounts-work.js:838-842`), the L card moves to the owner-only «حسابات» tab (§3.2, E-L7). **This reading is wider than his words** (no date gate, the card on «حسابات», and live writes that change the books from now), so it was confirmed by Ameer at 16:51 (`ameer:30`).
  - **Ameer's decisions of 16:51** (`AMEER-answers-L.md` :28-33 (2026-11-25 16:51 Baghdad, card `t2217s7785`, verbatim, EA-relayed)):
    - `ameer:30` «إي موافق، القائمة تشتغل من هسه وللمالك بس»: the list is live from deploy, owner only, at the end of «حسابات»; «ملغى» really reverses the old entry and changes the expense, before the contractor start date is set (r3 س٢ (أ)). `acct2:4` agrees.
    - `ameer:31` «إي موافق على السلف المكررة»: duplicate advances on different persons → Ameer (the owner) picks which stays; on the same person the oldest by server time stays (r3 س٣ (أ), §3.3 `ownerPicks`/`oldest`). `acct2:5` agrees.
    - `ameer:32` «إي موافق على المشاريع المؤرشفة»: archived-project rows have no «ملغى», «انخصم» is allowed, and S8 is shown beside them (r3 س٤ (أ)). `acct2:6` agrees.
    - `ameer:33` approves the seven words S2-S8 verbatim (r3 س١). No new Arabic string is left pending (§6).
- **Gates.**
  - **Code does not start** until the Architect confirms r5 and EA relays Ameer's go for code.
  - **L does not merge** until the Architect has reviewed the PR head SHA, CI is 4/4 on that head, and EA relays Ameer's merge go quoting him and naming that SHA. **No Ameer question blocks merge any more:** r3's four blockers (S2-S8, placement/live effect, owner picks across persons, «انخصم» on archived projects) were decided at 16:51 (`ameer:30`-`ameer:33`).
  - **Deploy:** rules first, then hosting, on Ameer's separate go, after saving the live ruleset and a read-only check that the diff is §4.4 only, then the 2-minute wait. Rollback is hosting first, then rules (§4.1, §10).

---

## 0. What moved since the gj sketch was written (read again at 27783e1c)

| gj sketch says | At 27783e1c | Effect on L |
|---|---|---|
| install list `public/render.js` lines 1653-1658 (:486) | `public/render.js:1697-1698`, and it already holds `'AccountShare'` | L adds `'AccountReclass'` after `'AccountStatement'`, before `'AccountShare'`. |
| `public/ledger.js` line 253 blocks a second reversal (:560, :585) | the check is `public/ledger.js:254` (`القيد معكوس مسبقاً`) | Same behaviour, new line. |
| the «عكس» button stores `today()` at `public/render.js` line 1489 (:560) | `public/render.js:1531-1533` | Same `entryDate: today()`. |
| warning clause at `public/render.js` line 831 (:566) | `public/render.js:865` | Same clause `تنبيه فقط، ولا يمنع تسجيل دفعة`. |
| `killerIds` `public/accounts.js` lines 629-636 (:490) | `public/accounts.js:629-648` | Same function. |
| `walkLive` syncErrors check line 668 (:490) | `public/accounts.js:668` | Same. |
| `balances().net` line 865 (:494) | `public/accounts.js:865` | Same. |
| `cashBodyCreate` at `firestore.rules` 871-880 (:490-494) | `firestore.rules:870-892`, keys at :884, `uuidOk` :378-380, `headerOk` :479-490, `optDesc` :503-505 | Same rule. `description` is an allowed key. |
| `revCreate` `firestore.rules` 1050-1076 (:494) | `firestore.rules:1083-1111`, kind list :1095, id rule :1093 | Same rule. |
| `public/sync.js` 337-339 stores server time as ms (:494) | `fromRemote`, `public/sync.js:337-344`; `withServerTime` :330-334; null bound note :414-417 | Same. |
| "K.refusedLinks stores `{ refusedId, nextId }`" (:562, :586) | `K.refusedLinks` is **one object**, written by H at `public/accounts-payment.js:553` and painted by H on **every** agreement screen at :1178-1183 when the refused id is in `syncErrors` | L does **not** write it (named exception E-L2, §5). |
| "the advance description starts with the token" (:560) | H's `cashDoc` builds a body **without** `description` (`public/accounts-payment.js:364-405`); the sync field list for a cash body keeps `description` (`public/sync.js:80`); the rule allows it (`firestore.rules:884`, :503-505) | L calls `cashDoc` and then sets `description` on the returned doc. No H edit. |
| "a second phone" is deferred: Ameer 2026-11-20 20:05 «حاليا فقط اني فاتح البرنامج» (:661) | Ameer 2026-11-24 23:12, `answers:21`: «تلفون ثاني للمالك: إي»; J rated it MEDIUM (`PLAN-J-r11.md` §4.3 :705-707) | **r1 flag, closed in r2.** The single-phone premise behind a local mark no longer held (MEDIUM-4). Ameer chose a server record (`ameer:10`, §4.4). |
| `reclassAdvance` | J hard-zeroed it: `public/accounts-statement.js:689`, type `types/checkjs.d.ts:1003` (`reclassAdvance: 0`); J says "`أُعيد تصنيفها` (JQ4) is painted in L" (`docs/plans/contractor-pr-j-sketch.md:180`, :1042, :1248) | L fills it and paints its line (§3.7, named exception E-L1). |
| `«مقاول»` tab | shown only when owner **and** `costOpen()` (`public/accounts-work.js:838-842`); `CONTRACTOR_COST_START = null` (`public/accounts.js:11`) | r1: L invisible while the constant is null, like H, I and J. **r2:** Ameer wants all old rows shown now (`ameer:15`), so the card moves to «حسابات» (E-L7). |
| (r2) I's dependency check for reversing an advance | lives in the unexported `reversible()` (`public/accounts-correct.js:707-728`): a live `returnAdvance` (:713) or a live `settle` (:714) returns `'dependent'`. `reversalDoc` (:539-575) has no such check, and the helpers `liveSettle` (:735-741) and `livePointer` (:748-754) are not exported (export list :1154-1164) | L must gate its duplicate «عكس» itself (MEDIUM-1, §3.3). |
| (r2) the sentence for that case | `dependent: 'اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً'` at `public/accounts-statement.js:33` and, byte-equal, at `public/accounts-correct.js:54`; neither `SENTENCE` object is exported (`public/accounts-statement.js:1407-1425`) | L keeps a byte-equal copy and a test pins it to both (U31). Reused, not new. |
| (r2) J's owner test | `ownerOn()` at `public/accounts-statement.js:1036-1039`: `role === 'owner' && active !== false`; not exported | L uses the same two-line test (INFO-1). |
| (r2) unit file lists | `package.json` `"test"` and `.github/workflows/ci.yml:68` each hold **48** files and are identical (counted at 27783e1c) | L makes 50 (LOW-1). r1 said 47 → 49. |

---

## 1. Goal

Decision item 5 (gj-sketch:21): "Old expense rows that may be advances: a list. The owner decides each row. A correction is «ملغى» plus one corrected line. No bulk edit. No automatic recalculation."

L gives the owner, at the end of the owner-only «حسابات» tab (`ameer:15`, E-L7), one list of old `labour` ledger rows that may really have been advances. For each row the owner answers one question:

- **Already deducted from the contractor's work:** no money document is written. The owner taps «انخصم» (`ameer:11`), and one create-only server record `laborReviews/lrv_<entryId>` is written: who, when, which entry (`ameer:10`, `acct:م٤`). It needs a `firestore.rules` change (§4.4).
- **Still owed:** first a ledger reversal `rev_<entryId>` («ملغى»). Only after that reversal is accepted by the server, one `advanceLabor` for the same amount on a person the owner picks («سلفة», the corrected line). The two documents are linked by the token `L:<entryId>;` at the start of both descriptions (gj-sketch:490, :560).

Every other row keeps its amount. There is no loop over the list (gj-sketch:564).

---

## 2. Scope

### 2.1 In L

1. **First list** (gj-sketch:488): `labour` rows (`public/ledger.js:12`, label `عمالة/سلفة`, direction `expense`), not a reversal (`isReversal !== true`), no `foremanId`, and the row's own id not in `syncErrors`. That last test is `Ledger.countedEntries` (`public/ledger.js:340-343`), which drops **only** ids in `syncErrors`. **r1 was wrong (LOW-1):** `countedEntries` is not a "no live reversal" filter. A reversed original stays a candidate, and `rowState` sorts it into `other` (ordinary «عكس») or an L kind (§3.3). `subcontractor` rows (`public/ledger.js:13`) and rows with `foremanId` are not listed. Heading `قيود مصروف قد تكون سلفاً` (S5, approved `ameer:33`) followed by the number of rows shown, in digits, in parentheses (no new word). `open` rows come first, then `revRefused`, then `reviewed` (LOW-4, §3.7).
2. **The per-row question** and its two answers (§3.6). The question text is [OPEN] in the sketch (gj-sketch:568) → approved by Ameer (S4, `ameer:33`, §6.2).
3. **«ملغى»** (still owed, step 1): `stillOwedReversal` → `Ledger.makeReversal` (`public/ledger.js:295-306`), description replaced by the token plus the original reversal text, cut to 500 (gj-sketch:524 block, :560).
4. **Second list** (gj-sketch:490): accepted L reversals with no covering advance. Heading `سلفة لم تُكتب بعد` (S2, approved `ameer:33`). The `سلفة` button is here.
5. **«سلفة»** (still owed, step 2): `advanceAfterReversal` → `AccountPayment.cashDoc('advanceLabor', …)` (`public/accounts-payment.js:364`) plus the token description.
6. **Refused advance** (gj-sketch:562): the row returns to the second list; the refused id is shown next to the newly minted id, derived from the token (E-L2), with `رُفض الإرسال` (`public/accounts-payment.js:40`).
7. **Duplicate advances** (gj-sketch:494): `سلفة مكررة` (S3, approved `ameer:33`). «عكس» (I's `AccountCorrect.reversalDoc`, `public/accounts-correct.js:539-575`) is offered only when every covering advance has a server time, and every «عكس» needs `سبب التصحيح` (`acct:م٥`):
   - **All on the same person:** keep the oldest by server time (then lowest id); «عكس» on the others.
   - **On different persons (`acct:م٥`):** nothing is kept by default. The owner picks: each advance shows its person's name and its own «عكس». Once one live advance is left the row is `done`.
   - **Draw guard (MEDIUM-1):** an advance with a live `returnAdvance` (`targetId`) or a live `settle` (`settlesId`) gets no «عكس». The row shows the existing sentence `اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً` instead. Without this, L's reversal would leave orphan draws, and J's `orphanDrawIds` (`public/accounts-statement.js:598-615`, gate :846) would block every later statement issue for that person.
8. **The «انخصم» record** (gj-sketch:558, `ameer:10`): a synced list `K.laborReviews` mirrored to the new server collection `laborReviews`, one create-only document per entry, id `lrv_<entryId>` (§4.4). Every owner phone sees it, and it survives logout (a pull restores it).
9. **`reclassAdvance` and its line `أُعيد تصنيفها`** on J's totals card (J sketch:180; label approved, `answers:5`).
10. **L5 (decision item 5)** is items 1-9 above. **L5 (C's wording item)**: decided by Ameer (`ameer:12`), item 12 below and §2.3.
11. **Archived-project rows (`acct:م٦`, AQ5):** listed, never hidden, with no `ملغى` button. Next to the row the reason `المشروع مؤرشف، لا يُلغى القيد` (S8, approved `ameer:33`) is shown. «انخصم» stays available, because it writes no money document; the §4.4 rule allows it on an archived project. Decided by Ameer at 16:51 (`ameer:32`); the accountant agrees (`acct2:6`).
12. **L5 wording (`ameer:12`):** the person-page summary labels `عمل معتمد` / `مدفوع للعمل` at `public/accounts-view.js:373-374` become `مجموع العمل المعتمد` / `مجموع المدفوع للعمل`. The statement lines (`public/accounts.js:537-538`, `public/accounts-statement.js:1003`) keep their words.

### 2.2 Not in L

- **`firestore.rules` changes once, for the «انخصم» record only** (§4.4, `ameer:10`). No fixed advance id (§4.3 stays the default (أ), no rule for it).
- No edit to `public/accounts.js`, `public/ledger.js`, `public/foremen.js`, `public/app.js`, `public/accounts-payment.js`, `public/accounts-work.js`, `public/accounts-correct.js` (gj-sketch:589-593). **Named exceptions:** `public/sync.js`, `public/firebase-client.js` and `public/sync-status.js` (E-L6, the server record, §4.4), and `public/accounts-view.js:373-374` (E-L4, `ameer:12`).
- `CONTRACTOR_COST_START` stays `null` (`public/accounts.js:11`). L writes no date.
- No CSV change. The ledger file already exports `description` (`public/ledger.js:308`, `CSV_COLS`); the token appears there as text. No column is added or removed.
- No edit to `.cursor/rules/pstack-models.mdc`.
- No `تسوية سلفة` in L, no settle against an old advance (gj-sketch:556; `laborStlCreate` needs a new-model measurement, `firestore.rules:821`).
- No «حسابات» button (`act-reclass`, gj-sketch:587). No «عهد» change (gj-sketch:641; `public/foremen.js` untouched).
- No bulk action, no migration, no edit or delete of any existing document.
- No re-send of a refused document (there is no re-send in `public/`; gj-sketch:66).
- The deferred list (gj-sketch:628-637) and the «عهد» link (gj-sketch:641).
- `لا شيء (مسدّد)` is not painted (gj-sketch:767). L paints no person balance line; the balance line stays J's `balanceSentence` (`public/accounts-statement.js:727-733`) with `الرصيد المستحق` / `مستحق له` / `مستحق عليه` (Ameer 2026-11-19 12:49 «اقصد نستهدم الرصيد المستحق»; gj-sketch:767).
- `حسب الإنجاز (الكمية × سعر الوحدة)` is not touched (it is already painted, `public/accounts-work.js:34`, `public/accounts-view.js:386`, `answers:4`).

### 2.3 "L5", both meanings

The name "L5" is used twice in the repo, so this plan covers both:

1. **Decision item 5** (gj-sketch:21, "Old expense rows that may be advances … No bulk edit"). The gj sketch's risk line "An agent that bulk-writes the labour list will break item 5" (gj-sketch:721) and the checklist line (gj-sketch:772) are this item. It is the whole of §2.1.
2. **C's L5**, the wording item: the same words `عمل معتمد` and `مدفوع للعمل` name two different numbers, the «حسابات» overview field (`public/accounts-view.js:373-374`) and the statement line (`public/accounts.js:537-538`; J paints `عمل معتمد` at `public/accounts-statement.js:1003`). Source: `docs/plans/contractor-pr-f-sketch.md:642`, `docs/plans/amount-thousand-separators-sketch.md:173`. The I sketch parks it "an L item, out with L" (`docs/plans/contractor-pr-i-sketch.md:132`). J did not ask (`answers:7`: «L5: not asked (no alternative proposed)»). **Ameer decided (`ameer:12`):** the summary labels at `public/accounts-view.js:373-374` become `مجموع العمل المعتمد` and `مجموع المدفوع للعمل`; the statement keeps `عمل معتمد` / `مدفوع للعمل`. That is two string edits in `public/accounts-view.js` (E-L4), U33, and one wait string in `scripts/verify-drives/accounts-work.js:358` (it waits for `عمل معتمد` on the person page).

---
## 3. Design

### 3.1 Two shapes (architect)

**Shape A (chosen): one classifier, derived state.** One pure function, `rowState(expense, ctx)`, reads the stored documents (`entries`, `accountTxns`, `laborReviews`, `syncErrors`, `outbox`) and returns exactly one state per old row (§3.3). Both lists, every button, the refused-id display, the duplicate card, and `reclassTotal` are views of that one result. L adds one stored fact, the «انخصم» record, and the server owns it (`ameer:10`, §4.4). The link between the reversal and the advance is the description token, which both documents already carry to the server (`public/sync.js:80`; ledger `description` is in `shapeOk`, `firestore.rules:83`, capped at :100).

**Dropped: the r1 local mark.** r1 kept «روجع» in IndexedDB `meta` only. Logout deletes that database (`public/session.js:419`), and a second owner phone (`answers:21`) never saw it, so a row answered "already deducted" could come back as open and be turned into an advance, charging the person twice (MEDIUM-4, `acct:م٤`). Ameer chose the server (`ameer:10`).

**Shape B (not chosen): stored workflow state.** Keep a local map `{ entryId → step, revId, advanceId, refusedId }` and advance it on each tap and each flush. It survives nothing a logout wipes (`public/session.js:419` deletes the database), it is wrong on a second phone (`answers:21`), and it duplicates what `entries` and `accountTxns` already say. It would also need a hook in the flush result, which lives in `public/firebase-client.js:1130-1140` (not editable, gj-sketch:591). Rejected.

**Why A meets the architect test:** each fact has one owner. The server owns "reversed", "advanced" and "deducted". `rowState` is the one way to ask "what is this row now". Callers (lists, buttons, J's totals) need only the state kind.

### 3.2 Module structure

| File | Owns | Reads |
|---|---|---|
| `public/accounts-reclass.js` (NEW, global `AccountReclass`) | token helpers, `misbookedCandidates`, `rowState`, `stillOwedReversal`, `advanceAfterReversal`, `advanceStillOwed`, `coveringAdvances`, `duplicatePlan`, `refusedAdvanceIds`, `reclassTotal`, `hasLiveDraw`, `reviewDoc`, the L card on «حسابات», `register()`, `install()` | `Ledger.makeReversal/validateEntry/countedEntries/fmt/DEFAULT_POLICY` (`public/ledger.js:1170`), `Accounts.rowIndex/rowLive/rowCounts/CONTRACTOR_COST_START` (`public/accounts.js:1055-1070`), `AccountPayment.cashDoc` (`public/accounts-payment.js:364`, exported :1191), `AccountCorrect.reversalDoc` (`public/accounts-correct.js:539`, exported :1162), `get(K.laborReviews)`, `AccountsView.commitDoc` (`public/accounts-view.js:131-135`), `get/set/K/me/uuid/today/deviceId` (`public/session.js`) |
| `public/accounts-statement.js` (EDIT, E-L1) | `contractorTotals` reads `AccountReclass.reclassTotal` when the global exists; `totalsCardHtml` paints one `أُعيد تصنيفها` line when it is above 0 | `globalThis.AccountReclass` (same seam style as `public/accounts-view.js:462`) |
| `public/session.js` (EDIT) | `K.laborReviews:'laborReviews'` (line 5) and `'accounts-reclass.js':1` in `SHELL_FILES` (line 351). Nothing else. | — |
| `public/sync.js`, `public/firebase-client.js`, `public/sync-status.js` (EDIT, E-L6) | the `laborReviews` collection: push, pull, merge, adopt, the project-removal lists; the same touch points J added for `statementApprovals` (§4.4.4) | — |
| `public/accounts-view.js` (EDIT, E-L4) | the two labels at :373-374 (`ameer:12`). Nothing else. | — |
| `firestore.rules` (EDIT) | `match /laborReviews/{id}` and one guard in the ledger `reversalOk` (§4.4) | — |
| `public/render.js` (EDIT) | `'AccountReclass'` in the install list and its type union (`public/render.js:1697-1698`). Nothing else. | — |

- **Script order:** `accounts-reclass.js` goes after `accounts-statement.js` (`public/index.html:76`) and before `render.js` (:77).
- **Install (E-L7, `ameer:15`):** `install(api)` wraps `api.views.accounts` (set by `AccountsView.install` at `public/accounts-view.js:534-540`, which runs at `public/render.js:1696`, before the install loop at :1698-1702) and appends its card after the «حسابات» list. Nothing else wraps `views.accounts` at 27783e1c. r1 placed the card on the «مقاول» home, but that tab is hidden while `CONTRACTOR_COST_START` is null (`public/accounts-work.js:838-842`), and Ameer wants all old rows shown now (`ameer:15`). The card never uses the id `cc-reason` (J tests the base HTML for it, `public/accounts-statement.js:1385`).
- **Gate (INFO-1, `ameer:15`):** the card paints only for an active owner, using J's `ownerOn()` test (`public/accounts-statement.js:1036-1039`: `role === 'owner' && active !== false`; not exported, so L repeats the same two lines). There is **no** `costOpen()` gate: r1's start-date question is answered by `ameer:15` (confirmed by Ameer at 16:51, `ameer:30`). The «حسابات» tab itself is owner-only (`public/accounts-view.js:560-577`). r1 used `Ledger.can(user, 'owner')`, which checks the role only. `CONTRACTOR_COST_START` stays `null` (`public/accounts.js:11`); L neither reads nor writes it.

### 3.3 State model (one classifier)

`rowState` takes one old ledger row `e` that passed `misbookedCandidates` **or** has an L reversal, and returns one of these kinds. Definitions used:

- `revId = 'rev_' + e.id` (`public/ledger.js:289`; rules `firestore.rules:134`).
- `rev` = the local ledger row with that id, if any.
- `isL(rev)` = `rev.isReversal === true && typeof rev.description === 'string' && rev.description.startsWith(token(e.id))`.
- **accepted ledger row** = present, `typeof createdAtServer === 'number'`, id not in `syncErrors`, id not in `outbox`. A row this phone wrote keeps `createdAtServer: null` until the next pull replaces it (`mergeById`, `public/sync.js:350-359`, skips only ids still pending; `fromRemote` turns the server stamp into ms, :337-344).
- **covering advance** = an `accountTxns` row with `purpose === 'advanceLabor'`, `kind === 'body'`, `description.startsWith(token(e.id))`, and `Accounts.rowLive(row, index)` true for `index = Accounts.rowIndex(txns, syncErrors)`. `rowLive` already treats an id in `syncErrors` as dead (`public/accounts.js:668`) and a live `rev_` as a killer (:629-648), so a refused advance and a reversed advance do not cover (gj-sketch:490). A queued advance is in `byId` and not in `syncErrors`, so it counts as covering (gj-sketch:581).
- **startsWith, not contains.** The sketch says "contains" (gj-sketch:490) and "starts with" (:560). Only L writes an advance description: H's `cashDoc` writes none (`public/accounts-payment.js:385-402`). So "starts with" covers every L advance and is stricter. The token's `;` keeps `L:e1;` from matching `L:e10;` (gj-sketch:490, `idOk` at `firestore.rules:19`). Flagged to the Architect (AQ1).

**First match wins (LOW-1).** `rowState` tests the kinds in the order of this table and returns the first that matches. Definitions: an **accepted review** = `lrv_<e.id>` in `K.laborReviews` with a number `createdAtServer` and not in `syncErrors`; a **live review** = present and not in `syncErrors` (queued or accepted); an **accepted L rev** = `isL(rev)` and accepted.

| # | Kind | When (after no earlier row matched) | First list | Second list | Buttons |
|---|---|---|---|---|---|
| 1 | `bothFacts` (MEDIUM-A) | accepted review **and** accepted L rev | yes, at the top, with `انخصم` + date + name **and** `ملغى` + the `rev_` id; covering advance ids, if any, in `<code>` | no | **none, never `سلفة`**. The rules make this unreachable (§4.4.2-4.4.3 use `existsAfter`, E18); the state is the client's defence if it ever appears. Fixing it is the owner's call on I's screens, not L's (AQ13). |
| 2 | `duplicate` | accepted L rev, two or more covering advances | — | yes, with `سلفة مكررة` | per `duplicatePlan` (§3.5): «عكس» on each id in `reverseIds`; for each id in `blockedIds`, the sentence `اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً` and no button; nothing while any covering advance has `createdAtServer` null (gj-sketch:494) |
| 3 | `done` | accepted L rev, exactly one covering advance with a number `createdAtServer` | no | no | none |
| 4 | `advQueued` | accepted L rev, exactly one covering advance with `createdAtServer` null | — | yes | `سلفة` **off** (gj-sketch:581) |
| 5 | `owed` | accepted L rev, no covering advance | — | yes | `سلفة` **on**; refused advance ids for this token shown with `رُفض الإرسال`. If `lrv_<e.id>` is in `syncErrors`, it is shown as a note with `رُفض الإرسال` (the accepted rev decides the kind) |
| 6 | `revQueued` | `isL(rev)`, not accepted, not refused | — | yes | `سلفة` **off** (gj-sketch:560) |
| 7 | `other` | `rev` exists, not refused, not an L reversal (the ordinary «عكس», `public/render.js:1531-1533`) | no | no | none |
| 8 | `reviewed` | a live review (a refused `rev`, if any, is shown as a note) | yes (last), with `انخصم`, the date and `createdByName` | — | none |
| 9 | `revRefused` | `rev` in `syncErrors` | yes, with `رُفض الإرسال` | — | none. `public/ledger.js:254` blocks a second reversal while the refused one is local; it clears only on export plus logout (gj-sketch:560) |
| 10 | `reviewRefused` | `lrv_<e.id>` in `syncErrors` | yes, with `رُفض الإرسال` | — | none; the next pull decides |
| 11 | `open` | none of the above | yes (first after `bothFacts`) | — | question, `انخصم`, `ملغى`. `ملغى` only if the project is active (`projectOpen`, `firestore.rules:52-54`) and the row has the shape the ledger rule needs (`typeof isReversal === 'boolean'` and no `foremanId` key, see below); otherwise `canCancel: false` and, for an archived project, S8 in its place (`acct:م٦`) |

`misbookedCandidates` alone decides who enters the table: a `labour` row not in `syncErrors` (`Ledger.countedEntries`, which filters `syncErrors` only, `public/ledger.js:340-343`), `direction === 'expense'`, `isReversal !== true`, and `foremanId == null` (absent **or** null). A reversed original is still a candidate, because `countedEntries` keeps it; `rowState` then returns `other`, an L kind, or `revRefused` (LOW-1).

**Client and rule use the same test (LOW-2).** The §4.4.2 rule reads `orig.get('isReversal', false) == false` and `orig.get('foremanId', null) == null`, so a legacy row with no `isReversal` field, or with `foremanId: null`, can be marked «انخصم», exactly as the client lists it (`probe:P3` showed the r2 text denied such a row with an evaluation error). The ledger reversal rule is **not** changed for this: its existing `orig.isReversal == false` (`firestore.rules:137`) still refuses an L `rev_` of a row with no `isReversal` field, and when the original holds `foremanId: null` its foreman clause (:146) needs the reversal to carry `foremanId: null`, which `foremanOk` (:148-154) then refuses (`idOk(null)` fails). So `canCancel` is false for a row whose `isReversal` is not a boolean or that has a `foremanId` key at all (no `ملغى`, and no new word: the row still offers «انخصم»). E23 pins both sides. How many legacy rows have this shape is not known; a read-only count is AQ12.

**Draw guard (MEDIUM-1).** `hasLiveDraw(advanceId, index)` is true when `index.byId` holds a `returnAdvance` with `targetId === advanceId` or a `settle` with `settlesId === advanceId`, and `Accounts.rowLive(row, index)` is true for it. This is the same test as I's `livePointer('returnAdvance', …)` (`public/accounts-correct.js:748-754`) and `liveSettle` (:735-741), which are not exported. `duplicatePlan` puts such an advance in `blockedIds`, never in `reverseIds`. The server would accept the `rev_` (`revCreate`, `firestore.rules:1083-1111`; an advance is not a draw, `isDraw` :1073-1076), so the client gate is the only guard. The owner must first reverse the return or settle on I's or J's screens.

**Same person or not (`acct:م٥`).** If every covering advance has the same `partyId`, `duplicatePlan` returns `mode: 'oldest'` (keep the lowest `createdAtServer`, then the lowest id). Otherwise it returns `mode: 'ownerPicks'` with `keepId: ''`, and every covering advance not in `blockedIds` gets «عكس». A tap re-runs `rowState` first: once the queued `rev_` makes one advance dead, the count drops, and the last live advance can never be offered (U26).

### 3.4 Files touched

| File | Change |
|---|---|
| `public/accounts-reclass.js` | NEW. §3.6. |
| `public/accounts-statement.js` | E-L1: `contractorTotals` (:666-693) sets `reclassAdvance` from `AccountReclass.reclassTotal` when `globalThis.AccountReclass` exists, else 0; `totalsCardHtml` (:1023-1029) adds `<div class="kv" data-st-reclass="1"><span>أُعيد تصنيفها</span>…</div>` after `المدفوع للمقاولين` only when `reclassAdvance > 0`; `SENTENCE` (:28-60) gains `reclass: 'أُعيد تصنيفها'`. `cost` and `paidToContractors` formulas do not change. |
| `public/session.js` | `K` (line 5) gains `laborReviews:'laborReviews'`. `SHELL_FILES` (line 351) gains `'accounts-reclass.js':1`. Not `today()` (172), `uuid()` (120), `closeSession` (399-424), `LIST` (7). |
| `public/render.js` | `public/render.js:1697-1698`: the union and the array gain `'AccountReclass'` after `'AccountStatement'`. `accountStores()` (:107-119) gains `laborReviews: get(K.laborReviews, [])` after `statementApprovals` (:118), so `Sync.localDoc` finds a queued review. The refused-row list gains `fromList(get(K.laborReviews, []))` after :148. |
| `public/accounts-view.js` | E-L4 (`ameer:12`): :373 `'عمل معتمد'` → `'مجموع العمل المعتمد'`, :374 `'مدفوع للعمل'` → `'مجموع المدفوع للعمل'`. Nothing else. |
| `scripts/verify-drives/accounts-work.js` | :358 waits for `عمل معتمد` on the person page; it becomes `مجموع العمل المعتمد`. Other `عمل معتمد` asserts at 27783e1c are on statement or correction text (`tests/accounts-statement.test.js:1091`, `tests/accounts-correct.test.js:946`, `tests/browser-check.js:622`) and stay; the agent re-greps on the PR head. |
| `firestore.rules` | §4.4.2 and §4.4.3 (exact text). |
| `public/sync.js`, `public/firebase-client.js`, `public/sync-status.js` | §4.4.4 (exact touch points; `sync-status.js:117` and :133 added in r3, MEDIUM-B). |
| `public/index.html` | one tag after line 76. |
| `public/sw.js` | `VERSION` (line 2) `aj-p0-v82` → **`aj-p0-v83`**; `ASSETS` (line 3) gains `'./accounts-reclass.js'` after `'./accounts-statement.js'`; `SHELL` (line 5) gains `'/accounts-reclass.js': 1`. |
| `types/checkjs.d.ts` | §3.5. `ContractorTotals.reclassAdvance` (:1003) becomes `number`. `Window` (:1396-1418) gains `AccountReclass?: AccountReclassApi`. |
| `tests/shell-cache.test.js` | pins at :44, :67, :110 → `aj-p0-v83`; script order (:72-86) gains `accountsReclassAt` between statement and render; two asserts like :95-96 for `accounts-reclass.js`. |
| `tests/webkit-upgrade.test.js` | `MARK` (:19) → `aj-p0-v83`. |
| `tests/accounts-reclass.test.js` | NEW. §7.1. |
| `tests/strict-accounts-reclass.test.js`, `tsconfig.strict-accounts-reclass.json` | NEW, copies of `tests/strict-accounts-statement.test.js` (17 lines) and `tsconfig.strict-accounts-statement.json` (8 lines) with the file name changed. |
| `tests/emulator/account-reclass.test.js` | NEW. §7.3. |
| `tests/emulator/account-rules.test.js` | **Existing security pin edited (MEDIUM-C), not a new test.** The `testSeq` at :1959 ("source: exactly six existsAfter calls …") asserts 6 `existsAfter(` after `function ownerOk` and 7 file-wide. With §4.4.2-4.4.3, `reviewCreate` (after `ownerOk`) adds one and the `reversalOk` guard (:131-147, before `ownerOk`) adds one: **7** after `ownerOk`, **9** file-wide (Architect measured 9). Edit: `6` → `7`, `7` → `9`, the title's "six" → "seven" with the two new places named, and add two asserts: `fnBody(RULES, 'reviewCreate')` has exactly one `existsAfter(` and it is `existsAfter(entryPath('rev_'` (ledgerEntries/rev_); `fnBody(RULES, 'reversalOk')` has exactly one `existsAfter(` and it is `existsAfter(laborReviewPath(`. Every other assert in that test is unchanged. Test count unchanged, so the floor stays 294. |
| `tests/browser-check.js` | §7.2. No new amount field, so `AMOUNT_IDS` (:17) is unchanged. |
| `package.json` | `"test"` (line 5, **48** files) gains the two unit files → **50** (LOW-1); `"test:emulator"` (line 7) gains the emulator file; `"typecheck"` (line 10) gains `&& tsc --noEmit -p tsconfig.strict-accounts-reclass.json`. |
| `.github/workflows/ci.yml` | unit list (line 68, **48** files, identical to `"test"`) gains the same two → **50**; emulator list (line 210) gains the file; the emulator floor (line 217, `-lt 271`) rises by the number of new emulator tests (23 in §7.3 and §4.4.5 → **294** = 271 + 9 (E1-E9) + 8 (E10-E17) + 6 (E18-E23)). The browser floor (line 120, `-lt 45`) is not lowered. |
| `scripts/verify-aj.js` | one dispatch block like :1389-1411 for id `reclass`, before the unknown-id error (:1435-1436). |
| `scripts/verify-drives/accounts-reclass.js` | NEW. §7.4. |
| `.cursor/skills/verify-ahl-aljazeera-accounting/SKILL.md` | line 67 lists `reclass`. |
| `.cursor/skills/verify-ahl-aljazeera-accounting/features/README.md`, `features/reclass.md` | one line like :66-67; one new feature file. |
| `docs/PSTACK_INVENTORY.md` | a `## Contractor PR L` section like J's (:278-285): `feature`, `maintain-verification-skill`, `opening-a-pr`. Evidence links only; status words stay. |
| `docs/plans/contractor-pr-l-sketch.md`, `.prettierignore` | the final plan copied in, and its ignore line, the same way J did (#112 added both). |

**Not touched:** `public/accounts.js`, `public/ledger.js`, `public/app.js`, `public/foremen.js`, `public/accounts-payment.js`, `public/accounts-work.js`, `public/accounts-correct.js`, `tests/accounts-statement.test.js` (its D4 at :1130-1150 stays green: that test does not load `accounts-reclass.js`, so `reclassAdvance` stays 0 and the card has no `سلفة` word), any CSV code (`laborReviews` is not exported; `CSV_COLS`, `public/ledger.js:308`, is unchanged), `.cursor/rules/pstack-models.mdc`.

### 3.5 Types (`types/checkjs.d.ts`)

```ts
/** One «انخصم» answer (ameer:10, ameer:11). Synced doc in collection laborReviews, id 'lrv_' + entryId (§4.4). */
interface LaborReview {
  id: string;                  // 'lrv_' + entryId
  docType: 'laborReview';      // local tag only; not sent (LABOR_REVIEW_REMOTE, §4.4.4)
  entryId: string;
  projectId: string;           // the entry's projectId
  decision: 'deducted';
  reviewedOn: string;          // today(), YYYY-MM-DD Baghdad (public/session.js:172-174)
  createdBy: string;           // auth uid
  createdByName: string;       // users/{uid}.displayName (headerOk, firestore.rules:479-490)
  createdAtServer: number | null;
  deviceId: string;
}

interface ReclassCtx {
  entries: readonly LedgerEntry[];
  txns: readonly FoldDoc[];
  syncErrors: Readonly<Record<string, unknown>>;
  outbox: readonly string[];
  reviews: readonly LaborReview[];
  index: RowIndex;             // Accounts.rowIndex(txns, syncErrors), built once per paint
  activeProjectIds: ReadonlySet<string>;
}

type ReclassState =   // rowState returns the first match in the §3.3 order
  | { kind: 'bothFacts'; expense: LedgerEntry; review: LaborReview; revId: string; advanceIds: readonly string[] }
  | { kind: 'open'; expense: LedgerEntry; canCancel: boolean }   // canCancel false → reason S8 shown
  | { kind: 'reviewed'; expense: LedgerEntry; review: LaborReview }
  | { kind: 'reviewRefused'; expense: LedgerEntry; reviewId: string }
  | { kind: 'revRefused'; expense: LedgerEntry; revId: string }
  | { kind: 'other'; expense: LedgerEntry }
  | { kind: 'revQueued'; expense: LedgerEntry; revId: string }
  | { kind: 'owed'; expense: LedgerEntry; revId: string; refusedAdvanceIds: readonly string[] }
  | { kind: 'advQueued'; expense: LedgerEntry; advanceId: string }
  | { kind: 'done'; expense: LedgerEntry; advanceId: string }
  | { kind: 'duplicate'; expense: LedgerEntry; plan: DuplicatePlan };

interface DuplicatePlan {
  mode: 'oldest' | 'ownerPicks';     // 'oldest' only when every covering advance has the same partyId (acct:م٥)
  keepId: string;                    // 'oldest': lowest createdAtServer, then lowest id; 'ownerPicks': ''
  reverseIds: readonly string[];     // may get «عكس»; [] while any covering advance has createdAtServer null
  blockedIds: readonly string[];     // would be in reverseIds but hasLiveDraw (MEDIUM-1): no «عكس», show SENTENCE.dependent
}

interface AccountReclassApi extends AccountModule {
  token(expenseId: string): string;
  tokenOf(description: unknown): string;
  misbookedCandidates(entries: readonly LedgerEntry[], syncErrors: Readonly<Record<string, unknown>>): readonly LedgerEntry[];
  rowState(expense: LedgerEntry, ctx: ReclassCtx): ReclassState;
  stillOwedReversal(input: StillOwedInput): { doc: LedgerEntry | null; errors: string[] };
  advanceAfterReversal(input: AdvanceAfterInput): { doc: object | null; errors: string[] };
  advanceStillOwed(entries: readonly LedgerEntry[], txns: readonly FoldDoc[], syncErrors: Readonly<Record<string, unknown>>): readonly LedgerEntry[];
  coveringAdvances(expenseId: string, txns: readonly FoldDoc[], index: RowIndex): readonly FoldDoc[];
  duplicatePlan(covering: readonly FoldDoc[], index: RowIndex): DuplicatePlan;
  hasLiveDraw(advanceId: string, index: RowIndex): boolean;
  refusedAdvanceIds(expenseId: string, txns: readonly FoldDoc[], syncErrors: Readonly<Record<string, unknown>>): readonly string[];
  reclassTotal(entries: readonly LedgerEntry[], txns: readonly FoldDoc[], syncErrors: Readonly<Record<string, unknown>>, projectId: string): number;
  reviewDoc(input: { entry: LedgerEntry; user: LedgerUser; deviceId: string; day: string }): { doc: LaborReview | null; errors: string[] };
}

interface StillOwedInput {
  entry: LedgerEntry;
  reversalReason: string;
  user: LedgerUser;
  deviceId: string;
  entryDate: string;           // today()
  now: number;                 // Date.now(), becomes createdAtDevice (public/ledger.js:300)
}

interface AdvanceAfterInput {
  expenseId: string;
  partyId: string;
  projectId: string;
  amount: number;
  advanceId: string;           // uuid() minted when the سلفة form opens
  createdBy: string;
  createdByName: string;
  deviceId: string;
  originalDate: string;        // the old row's entryDate, cited in the description
}
```

`ContractorTotals.reclassAdvance` changes from the literal `0` to `number` (:1003). Nothing else in J's types changes.

### 3.6 Functions and signatures (`public/accounts-reclass.js`)

The file is a classic script with the same UMD tail as `public/accounts-statement.js` (it is `require`d by the unit test and loaded by `index.html`). Pure functions take their inputs; only the screen functions call `get`, `set`, `me`, `uuid`, `today`.

```javascript
const TOKEN_RE = /^L:([A-Za-z0-9_-]{1,64});/;   // the id part is idOk (firestore.rules:19)
const DESC_MAX = 500;                             // ledger: firestore.rules:100; cash: :503-505
/** Byte-equal copies of existing sentences; U31 pins them. Not new strings. */
const SENTENCE = {
  dependent: 'اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً',  // accounts-statement.js:33, accounts-correct.js:54
};
/** Approved L strings S2-S8 (ameer:33), one object so wording lives in one place (§6.2). No pendingAmeer object: nothing is pending. */
const STRINGS = { /* S2-S8, §6.2 */ };

/** @param {string} expenseId @returns {string} 'L:' + expenseId + ';' */
function token(expenseId)

/** @param {unknown} description @returns {string} the expense id, or '' */
function tokenOf(description)

/**
 * Display only. Counted (Ledger.countedEntries, public/ledger.js:340-343) labour rows,
 * direction 'expense', isReversal !== true, no foremanId. Sorted by entryDate, then id.
 * @param {readonly LedgerEntry[]} entries
 * @param {Readonly<Record<string, unknown>>} syncErrors
 * @returns {readonly LedgerEntry[]}
 */
function misbookedCandidates(entries, syncErrors)

/** The one classifier (§3.3). Pure. @param {LedgerEntry} expense @param {ReclassCtx} ctx @returns {ReclassState} */
function rowState(expense, ctx)

/**
 * The reversal only (gj-sketch:524 block). Id 'rev_' + entry.id (public/ledger.js:289).
 * Calls Ledger.makeReversal (public/ledger.js:295-306) and replaces only description:
 *   token(entry.id) + makeReversal's description ('تصحيح: ' + original, public/ledger.js:298),
 *   cut by code points (Array.from) so the whole string is at most DESC_MAX. The token is never cut.
 * No partyId. No advanceId.
 * Then Ledger.validateEntry(doc, { user, ledger: entries, projects, policy: Ledger.DEFAULT_POLICY })
 * (public/ledger.js:203-262). Any error → { doc: null, errors }. 'سبب التصحيح مطلوب' (:258) and
 * 'القيد معكوس مسبقاً' (:254) come from there; L adds no sentence.
 * Also errors 'kind' unless entryType === 'labour' && direction === 'expense' && !isReversal && !foremanId,
 * and 'inactive' unless the project is active (rules: projectOpen, firestore.rules:52-54, :122).
 * @param {StillOwedInput} input
 * @returns {{ doc: LedgerEntry | null, errors: string[] }}
 */
function stillOwedReversal(input)

/**
 * The advance only (gj-sketch:542 block). advanceId is a uuid minted when the سلفة form opens,
 * which is after the rev_ is accepted. Calls AccountPayment.cashDoc('advanceLabor', { id: advanceId,
 * amount, projectId, partyId, createdBy, createdByName, deviceId }) (public/accounts-payment.js:364-405),
 * then sets doc.description = token(expenseId) + originalDate + ' ' + expenseId, cut to DESC_MAX.
 * No Arabic words in the description, so no new string. txnDate is today() (cashDoc, :396).
 * errors: cashDoc's codes ('range' etc., public/accounts.js:349-351), plus 'partyId' when empty
 * (the save stays off; no sentence), plus 'targetId' when advanceId is not a uuid.
 * @param {AdvanceAfterInput} input
 * @returns {{ doc: object | null, errors: string[] }}
 */
function advanceAfterReversal(input)

/**
 * The second list's expenses: rowState kind in revQueued | owed | advQueued | duplicate.
 * @returns {readonly LedgerEntry[]}
 */
function advanceStillOwed(entries, txns, syncErrors)

/** Covering advances for one expense id (§3.3), sorted by duplicatePlan order. */
function coveringAdvances(expenseId, txns, index)

/**
 * §3.3. mode 'oldest' when every covering advance has the same partyId, else 'ownerPicks' (acct:م٥).
 * 'oldest': keepId = lowest createdAtServer, then lowest id; candidates = the rest.
 * 'ownerPicks': keepId = ''; candidates = all.
 * Then blockedIds = candidates with hasLiveDraw, reverseIds = the other candidates.
 * Both are [] while any covering advance has createdAtServer null.
 */
function duplicatePlan(covering, index)

/** True when a live returnAdvance (targetId) or a live settle (settlesId) points at advanceId (MEDIUM-1). Same test as accounts-correct.js:735-754. */
function hasLiveDraw(advanceId, index)

/** advanceLabor rows whose description starts with token(expenseId) and whose id is in syncErrors. Display only. */
function refusedAdvanceIds(expenseId, txns, syncErrors)

/**
 * For J's totals card (E-L1). Sum of counted (Accounts.rowCounts) advanceLabor rows on projectId whose tokenOf()
 * names an expense that has a counted L reversal (isL, not in syncErrors) on the same project.
 * An advance whose token names no L reversal adds 0 (so J's D4 fixture 'L:e1;' alone stays 0).
 * @returns {number}
 */
function reclassTotal(entries, txns, syncErrors, projectId)

/**
 * The «انخصم» record (§4.4). Pure. id 'lrv_' + entry.id; createdAtServer null (stamped by the server).
 * errors 'kind' unless entryType === 'labour' && direction === 'expense' && !isReversal && !foremanId;
 * 'owner' unless ownerOn; 'DUPLICATE' when the entry already has an L or ordinary rev_ in entries.
 * No project-active check: archived projects are allowed (acct:م٦).
 */
function reviewDoc(input)

// Screen (not exported for unit use except through install):
function blocks()               // '' unless ownerOn(); builds ReclassCtx once (no costOpen gate, ameer:15)
function firstListHtml(states)  // heading + (count), open first, then revRefused, then reviewed (LOW-4)
function secondListHtml(states) // heading, one card per revQueued | owed | advQueued | duplicate
function cancelFormHtml(state)  // the «ملغى» card (§3.7)
function advanceFormHtml(state) // the «سلفة» card (§3.7)
function onClick(button)        // the only place that writes (§3.8). Runs for every button in the app (render.js:1434-1437 → AccountsView.onClick → registry loop accounts-view.js:584-586), so it returns false at once unless the button has a data-rc-* attribute (U36)
function register()             // pushes 4 AccountAction rows (types/checkjs.d.ts:865-873), tab 'contractor': actionHtml (accounts-view.js:270-281, callers :335-337) never paints them; clicks reach onClick through the registry loop (accounts-view.js:584-586)
function install(api)           // wraps api.views.accounts (§3.2, E-L7)
```

**Screen state** (module-local, like `screen` in `public/accounts-payment.js:47-62`): `openCancel` (the expense id whose «ملغى» card is open, or ''), `openAdvance` (the expense id whose «سلفة» card is open), `advanceIds` (`Record<expenseId, uuid>`; a new uuid replaces the old one when the old one is in `syncErrors`), `partyPick` (`Record<expenseId, partyId>`), `msg`. Install resets all of it (as `public/accounts-payment.js:1056-1072` does).

### 3.7 UI deltas

**«حسابات» tab (`#accounts`)** (E-L7, `ameer:15`), after the existing list (`listHtml`, `public/accounts-view.js:536`):

1. **First list card** (`data-rc-list="1"`), heading `قيود مصروف قد تكون سلفاً` (S5) followed by ` (N)`, where N is the number of rows on the card, in digits (LOW-4; no new word). Rows are sorted `open` first, then `revRefused`, then `reviewed`; inside each group by `entryDate`, then id. Each row shows: the amount (`Ledger.fmt` + ` د.ع`), `تاريخ القيد` (reused, `public/ledger.js:347`) with the original `entryDate`, the original id in `<code>`, `partyName` and `description` if any (escaped).
   - `open`: the question (S4, approved `ameer:33`), then two buttons: `انخصم` (approved, `ameer:11`, `data-rc-review="<id>"`, the answer "already deducted") and `ملغى` (S6, `data-rc-cancel="<id>"`, the answer "still owed"). When `canCancel` is false (archived project), `ملغى` is not painted and `المشروع مؤرشف، لا يُلغى القيد` (S8, `data-rc-closed="<id>"`) is shown in its place; `انخصم` stays (`acct:م٦`).
   - `reviewed`: `انخصم`, the `reviewedOn` date and `createdByName` (a name, not a new word), no button.
   - `reviewRefused`: `رُفض الإرسال` (reused), no button.
   - `revRefused`: `رُفض الإرسال` (reused), no button.
2. **«ملغى» card** (opens on the `ملغى` tap; nothing is stored by that tap): the warning — `تاريخ القيد` + original date, the original id, then the clause `تنبيه فقط، ولا يمنع تسجيل دفعة` (`public/render.js:865`, gj-sketch:566) — then a preview with two kv lines: `ملغى` + amount and `سطر مصحّح` + amount (gj-sketch:564), then `سبب التصحيح` (reused, `public/accounts-correct.js:41`) as `<input id="rc-reason" maxlength="500">`, then `حفظ` (reused, `public/accounts-payment.js:37`) as `data-rc-save-rev="<id>"`. `حفظ` is disabled until the reason is not blank. Opening the card and tapping `حفظ` are the two steps that "confirm the card" (gj-sketch:560).
3. **Second list card** (`data-rc-owed="1"`), heading `سلفة لم تُكتب بعد` (S2, approved `ameer:33`). One row per `revQueued`, `owed`, `advQueued`, `duplicate`, with the same amount/date/id lines.
   - `revQueued` and `advQueued`: `سلفة` button rendered `disabled`.
   - `owed`: `سلفة` (`data-rc-advance="<id>"`). If `refusedAdvanceIds` is not empty, each refused id is shown in `<code>` with `رُفض الإرسال`, and when the «سلفة» card is open the new id is shown next to it (gj-sketch:562, :586).
   - `duplicate`: `سلفة مكررة` (S3, approved `ameer:33`). Each covering advance is listed with its id in `<code>` and its person's name. In mode `oldest` the kept id is marked with `<strong>` (no word). Each id in `reverseIds` gets a `عكس` button (`data-rc-dup-rev="<advanceId>"`) with `سبب التصحيح` (`<input id="rc-dup-reason">`). Each id in `blockedIds` shows `اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً` (reused, `data-rc-dup-blocked="<advanceId>"`) and no button (MEDIUM-1). No button while `reverseIds` is empty.
4. **«سلفة» card**: the amount (fixed, the expense amount, not an input), the person pills from `K.parties` (the same pill pattern as `public/accounts-work.js:890-896`, no label), and `حفظ` (`data-rc-save-adv="<id>"`), disabled until a person is picked.

**J's totals card** (`public/accounts-statement.js:1023-1029`, shown on the «حسابات» statement tab for one project, `public/accounts-view.js:467-469`): one extra kv line `أُعيد تصنيفها` with `reclassAdvance`, after `المدفوع للمقاولين`, only when `reclassAdvance > 0`. It is an explanation line: the amount is **already inside** `المدفوع للمقاولين` (through `newCash`, `public/accounts-statement.js:677-683`) and is not added again. `تكلفة المقاول` is unchanged (an advance has cost effect 0, `public/accounts.js:72`).

**Not changed by L's screen:** «حسابات» gets no `act-` button (gj-sketch:587). «عهد» HTML is unchanged.

**Changed by the documents L writes (MEDIUM-2, stated plainly).** An accepted L `rev_` lowers that project's spent **for good**, not only between the two steps:
- `ownerSpent` (`public/render.js:657-664`) takes `Ledger.totals` of the counted entries and passes it to `Accounts.projectCost`, which returns that legacy figure unchanged while `CONTRACTOR_COST_START` is null (`public/accounts.js:1043-1053`). The `rev_` subtracts the amount (`Ledger.sign`, `public/ledger.js:24`).
- The advance never adds it back: `advanceLabor` has `cost: 0` (`public/accounts.js:72`), and no company figure reads `accountTxns` cash.
- So the project's المصروف on the home and project cards falls by the amount and stays down, and its profit rises by the same amount. The ledger CSV shows the `rev_` row with the `L:<id>;` token in `description`. «المدفوع للمقاولين» rises by the advance (new there, because `labour` rows were never in it), with `أُعيد تصنيفها` as its explanation line.
- The company's cash out is unchanged after both steps: the money left once, and only its class changed (ledger expense → advance to a person). **"Cash out" here is a test-only figure** (the U29 helper); no screen shows it (LOW-4, `acct:م٢`).
- This is the right accounting per the accountant (`acct:م٢`). Ameer accepted it (`ameer:13`); r2's leftover "س٦" reference is removed (LOW-4).

### 3.8 Write paths (`onClick`, the only writer)

| Tap | Precondition (re-read at tap time) | Write | After |
|---|---|---|---|
| `انخصم` | `rowState` is `open` (archived project allowed) | `reviewDoc` → `AccountsView.commitDoc(doc.id, doc, get(K.laborReviews, []), next => set(K.laborReviews, next))` (`public/accounts-view.js:131-135`): appends only if the id is new, then queues it. The button is disabled before the call. | state `reviewed`; redraw |
| `ملغى` | `open`, `canCancel` | none; `screen.openCancel = id` | redraw |
| `حفظ` on the «ملغى» card | still `open`; reason not blank | `stillOwedReversal` → `AccountsView.commitDoc(doc.id, doc, entries, next => set(K.entries, next))` (`public/accounts-view.js:131-135`): appends only if the id is new, then `queueDoc` (`public/render.js:122-128`; an entry has no `docType`, so `Sync.queueRefusal` returns null, `public/sync.js:714-718`). The button is disabled before the call. | `openCancel = ''`; redraw |
| `سلفة` | `owed` | none; mint `advanceIds[id] = uuid()` if absent or in `syncErrors`; `openAdvance = id` | redraw |
| pill | «سلفة» card open | `partyPick[id] = partyId` | redraw |
| `حفظ` on the «سلفة» card | still `owed`; person picked | `advanceAfterReversal` → `AccountsView.commitDoc(advanceId, doc, txns, next => set(K.accountTxns, next))` (the same call as H's `commitBuilt`, `public/accounts-payment.js:518-527`). | state becomes `advQueued`; redraw |
| `عكس` on a duplicate | `duplicate`; id in `reverseIds` (so not in `blockedIds`: `hasLiveDraw` is re-checked at tap time); in mode `ownerPicks`, at least two covering advances still live; reason not blank | `AccountCorrect.reversalDoc({ targetId, reason, createdBy, createdByName, deviceId })` (`public/accounts-correct.js:539-575`) → `commitDoc` into `accountTxns`. Not built by hand. | redraw |

Each write re-runs `rowState` first; a stale card writes nothing. `ملغى` never asks for a person (gj-sketch:573, :576). No write happens in `blocks()` or in a view (the J rule, `docs/plans/contractor-pr-j-sketch.md:544`).

---

## 4. Rules (`firestore.rules`)

### 4.1 Money documents: **no rule change**

L writes three kinds of money document, and each is already allowed at `27783e1c`:

| Document | Rule | Why it passes |
|---|---|---|
| ledger `rev_<entryId>` with the token description | `allow create` `firestore.rules:156`: `baseOk()` (:121-124: `shapeOk` :82-103 incl. `optString('description', 500)` :100, `typeOk` :117-120, `projectOpen` :52-54) and `reversalOk()` (:131-147: id `rev_` + original :134, original not a reversal, same project/direction/type/amount, reason 1-500 :142-144, owner :145, no `foremanId` when the original has none :146) | `description` is free text ≤ 500. The original `labour` row has no `foremanId` (L filters them out). |
| `accountTxns/<uuid>` `advanceLabor` body with the token description | `accountTxnCreate` → `cashBodyCreate` (`firestore.rules:1146-1164`, :870-892): owner, `headerOk` (:479-490), `projectActive` (:375-377), party exists (:877), `uuidOk(id)` (:378-380), keys `hasOnly` incl. `description` (:884), `moneyOk` (:494-496), no pointer fields (:886-889), `optDesc` (:503-505) | The body the phone sends is the `CASH_REMOTE` field list (`public/sync.js:80`), which includes `description` and drops `docType` and `effect`. |
| `accountTxns/rev_<advanceId>` (duplicate path) | `revCreate` (`firestore.rules:1083-1111`): original kind `body` is in the list (:1095), same purpose/party/project/amount, reason 1-500 | An advance is not a draw (`isDraw`, :1073-1076), so the advance-cap clause (:1110) does not apply. |

The «انخصم» record is the only new stored fact. Ledger entries have no update (`firestore.rules:156-157`), so it cannot live on the row (gj-sketch:558). Ameer chose the server (`ameer:10`), so it gets its own collection (§4.4).

**Deploy consequence (LOW-6):** because of §4.4, L's deploy is rules and hosting as one pair, only on Ameer's separate go (`ameer:10` «ويحتاج نشر القواعد بموافقتي»).
- **Forward order:** (1) read the live ruleset read-only and save a copy (as for J: 14:24 readback, ruleset `16a4c047`, source sha `61759553…`, equal to main); (2) a read-only check that main's `firestore.rules` differs from the saved copy only by §4.4.2-4.4.3; (3) **rules first**; (4) **then hosting**; (5) nobody opens the app until 2 minutes after.
- **Rollback order:** **hosting first, then rules** (the saved copy).
- **Why this order:** a new client on old rules gets every `lrv_` refused, and that refusal is sticky until export plus logout. An old client on new rules is harmless (§10).
- The deploy steps are written in a separate runbook at deploy time, with a method that cannot execute them (Ameer's 15:35 rule). This plan holds no deploy command.

### 4.2 Emulator tests even with no rule change

The emulator file (§7.3) proves the exact L documents pass and the near misses fail, so a later rule change that breaks L goes red in CI.

### 4.3 Not in L: a fixed advance id (stays (أ), no rule)

Kept for the record; Ameer was not asked again, and nothing in his answers forces it. **The engineer and the Architect both advise (أ), no change** (review §5 item 3: duplicates are visible and reversible, U17, and the cost below is real). It would need all of:

```diff
   function cashBodyCreate() {
 ...
-          && uuidOk(id)
+          && (uuidOk(id)
+            || (d().purpose == 'advanceLabor'
+              && 'lFor' in d() && idOk(d().lFor)
+              && id == 'ladv_' + d().lFor
+              && exists(entryPath('rev_' + d().lFor))
+              && get(entryPath('rev_' + d().lFor)).data.amount == d().amount
+              && get(entryPath('rev_' + d().lFor)).data.projectId == d().projectId))
 ...
-          && d().keys().hasOnly(['id', 'kind', 'purpose', 'projectId', 'partyId', 'ledger', 'currency', 'fxRate', 'amount', 'txnDate', 'description', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'])
+          && d().keys().hasOnly(['id', 'kind', 'purpose', 'projectId', 'partyId', 'ledger', 'currency', 'fxRate', 'amount', 'txnDate', 'description', 'lFor', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'])
```

plus `'lFor'` in `CASH_REMOTE` (`public/sync.js:80`) and in `BODY_KEYS` (`public/sync-status.js:63`), plus two reads per create, plus emulator tests. It is **not** part of §4.4. The duplicate case is caught by `سلفة مكررة` and fixed with «عكس», with the draw guard (§3.3).


### 4.4 The «انخصم» record on the server (`ameer:10`): **the one `firestore.rules` change in L**

**This is a `firestore.rules` change.** It adds one collection and one guard in the ledger reversal rule. Nothing else in the file changes. It deploys as a pair with hosting, rules first, only on Ameer's separate go (§4.1). r3 changes the r2 text in three places: `existsAfter` on both sides (MEDIUM-A, `probe:P7`), and `orig.get(...)` defaults for `isReversal` and `foremanId` (LOW-2, `probe:P3`).

#### 4.4.1 Document shape

Collection `laborReviews`, document id `lrv_<entryId>` (fixed, so one record per entry and a second create is refused). Fields, exactly:

| Field | Value |
|---|---|
| `id` | `'lrv_' + entryId` |
| `entryId` | the old `labour` row's id (`idOk`, `firestore.rules:19`) |
| `projectId` | that row's `projectId` |
| `decision` | `'deducted'` (the only value) |
| `reviewedOn` | `today()`, `YYYY-MM-DD` (`entryDateOk`, `firestore.rules:44-50`) |
| `createdBy` | `request.auth.uid` |
| `createdByName` | the user's `displayName` (`headerOk`, `firestore.rules:479-490`) |
| `createdAtServer` | `request.time` |
| `deviceId` | 1-128 chars (`headerOk`) |

Who: `createdBy`/`createdByName`. When: `createdAtServer` (server) and `reviewedOn` (day). Which entry: `entryId`. Create-only: no update, no delete (`acct:م٤`).

#### 4.4.2 New block, placed after `match /statementApprovals/{id}` (`firestore.rules:1233-1280`), before the closing braces (:1281-1283)

```
    function laborReviewPath(id) { return /databases/$(database)/documents/laborReviews/$(id); }

    match /laborReviews/{id} {
      function d() { return request.resource.data; }
      /**
       * @returns {boolean}
       * Reads: 3. user, the ledger entry (get and exists on the same doc), rev_ of the entry (existsAfter).
       */
      function reviewCreate() {
        let user = get(/databases/$(database)/documents/users/$(request.auth.uid));
        let orig = get(entryPath(d().entryId)).data;
        return ownerOk(user)
          && headerOk(d(), user)
          && 'createdByName' in d()
          && d().keys().hasOnly(['id', 'entryId', 'projectId', 'decision', 'reviewedOn', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'])
          && idOk(d().entryId)
          && id == 'lrv_' + d().entryId
          && d().id == id
          && d().decision == 'deducted'
          && entryDateOk(d().reviewedOn)
          && exists(entryPath(d().entryId))
          && orig.entryType == 'labour'
          && orig.direction == 'expense'
          && orig.get('isReversal', false) == false
          && orig.get('foremanId', null) == null
          && orig.projectId == d().projectId
          && !existsAfter(entryPath('rev_' + d().entryId));
      }
      allow read: if accountRead();
      allow create: if reviewCreate();
      allow update, delete: if false;
    }
```

- `laborReviewPath` sits with the other path helpers at the top level (`entryPath` is at `firestore.rules:14`); it is listed here so the diff is in one place.
- `existsAfter` (MEDIUM-A): `exists` sees the state before the request, so one batch holding both `lrv_e80` and an L `rev_e80` passed both checks (`probe:P7`). `existsAfter` sees the rest of the batch. The file already uses it this way (`firestore.rules:57-59`, :737, :780-781). E18 pins it.
- `orig.get('isReversal', false)` and `orig.get('foremanId', null)` (LOW-2): a legacy row with no `isReversal` field, or with `foremanId: null`, is accepted, matching the client's `isReversal !== true` and `foremanId == null` (§3.3). E23 pins it.
- No `projectOpen`/`projectActive`: «انخصم» is allowed on archived projects. Decided by Ameer at 16:51 (`ameer:32`); the accountant agrees (`acct2:6`).
- `accountRead()` (`firestore.rules:527-530`) is owner-only, like the other account collections.
- **Owner gate drift (LOW-3):** `ownerOk` needs `active == true` (`firestore.rules:372-374`), while the client's `ownerOn()` accepts a missing `active` (`active !== false`). An owner doc with no `active` field sees the card, but every write is refused (`probe:P2`). This is J's existing pattern; L keeps it, notes it as R13, and U20 has the fixture.

#### 4.4.3 One guard added to the ledger `reversalOk()` (`firestore.rules:131-147`)

```diff
           && (isOwner() || (isSite() && orig.createdBy == request.auth.uid))
-          && (('foremanId' in orig) ? (d().foremanId == orig.foremanId) : !('foremanId' in d()));
+          && (('foremanId' in orig) ? (d().foremanId == orig.foremanId) : !('foremanId' in d()))
+          && !(('description' in d()) && d().description is string
+               && d().description.split(';')[0] == 'L:' + d().reversesEntryId
+               && existsAfter(laborReviewPath('lrv_' + d().reversesEntryId)));
```

- It refuses only an **L** reversal (description starts with `L:<id>;`, or is exactly `L:<id>`) of a row that has a «انخصم» record, before or in the same batch. So if phone A marks «انخصم» and phone B taps «ملغى» on the same row, whichever reaches the server second is refused (`رُفض الإرسال`), and the person is not charged twice (MEDIUM-4). `probe:P4`, `probe:P5`.
- `split(';')[0]` avoids a regex on the id. Ids are `idOk` (`[A-Za-z0-9_-]`), so they hold no `;`. `probe:P5`: `" L:e80;x"`, `"l:e80;x"` and `"L:e8;x"` pass the guard, and the client's `startsWith('L:e80;')` does not read them as L either, so there is no bypass. `probe:P6`: a review on `e1` does not block `e10`.
- An ordinary «عكس» (no token, `public/render.js:1531-1533`) is **not** blocked (AQ8 agreed), so a genuine data-entry mistake can still be reversed. Residual risk R10.
- Reads for a ledger `rev_`: 3 as now, or 4 only when the description is an L token (the `&&` stops early). The limit is 10.
- The ledger `create` line (`firestore.rules:156`) is unchanged; only `reversalOk` gains the clause.
- **Concurrency.** Two separate requests at the same moment: the emulator gave one-wins in 20 of 20 rounds (`probe:P8`). That is emulator only and proves nothing about production either way. If both ever land, row state `bothFacts` (§3.3) never offers «سلفة».

#### 4.4.4 Client touch points (named exception E-L6; the same set J added for `statementApprovals` / `statementApproval`)

| File:line at 27783e1c | Change |
|---|---|
| `public/sync.js:18-20` `usesPutIfMissing` | add `col === 'laborReviews'`: a second phone sending the same `lrv_` finds it present and stops, with no refusal (`putIfMissing`, `public/firebase-client.js:363-368`, used at :390-392; AQ10 agreed) |
| `public/sync.js:30` `collectionFor` | `if (doc.docType === 'laborReview') return 'laborReviews';` |
| `public/sync.js:60` | `const LABOR_REVIEW_REMOTE = ['id', 'entryId', 'projectId', 'decision', 'reviewedOn', 'createdBy', 'createdByName', 'createdAtServer', 'deviceId'];` |
| `public/sync.js:123` `toRemote` | `if (doc.docType === 'laborReview') return copyFields(doc, LABOR_REVIEW_REMOTE);` |
| `public/sync.js:671`, :700 | `laborReviews` filtered by project and returned, like `statementApprovals` |
| `public/sync.js:708` `ACCOUNT_TYPES` | `laborReview: 1` |
| `public/sync.js:728` `localDoc` names | `'laborReviews'` |
| `public/sync.js:746-753` `accountReads` | `{ collection: 'laborReviews', where: [] }` (owner only, as now) |
| `public/sync.js:757-783` `pullAccounts` | an empty `laborReviews` list; tag `docType = 'laborReview'`; include it in the watermark |
| `public/sync.js:809` | `doc.docType === 'laborReview'` counts as an account doc |
| `public/sync.js:1226` | a refused `laborReview` takes the same `failId` branch as `statementApproval` |
| **`public/sync-status.js:117`** `accountSame` (MEDIUM-B) | `if (local.docType === 'laborReview') return keysEqual(['id', 'entryId', 'projectId', 'decision'], local, remote);` |
| **`public/sync-status.js:133`** `sameContent` (MEDIUM-B) | add `\|\| local.docType === 'laborReview'` to the account branch |
| `public/firebase-client.js:408`, :463, :684, :1079 | `laborReviews: get(K.laborReviews, [])` in each store snapshot |
| `public/firebase-client.js:561` | `set(K.laborReviews, S.mergeById(get(K.laborReviews, []), accounts.laborReviews, pendingAccounts));` |
| `public/firebase-client.js:771` | `set(K.laborReviews, next.laborReviews \|\| []);` |
| `public/firebase-client.js:909` | `[K.laborReviews, 'laborReview']` in the adopt list |
| `types/checkjs.d.ts:56`, :570 | `'laborReview'` in both `docType` unions |
| `types/checkjs.d.ts:635`, :653, :726, :770 | `laborReviews` next to each `statementApprovals` |

**Why the `sameContent` keys leave out `createdBy` (MEDIUM-B).** In the "found" path (`public/sync.js:1220-1228` → `adoptFound` :1114-1115 → `Status.sameContent`), a phone whose `lrv_e80` meets a server copy compares the two. If owner B's phone meets owner A's record, `createdBy`, `createdByName`, `deviceId` and `reviewedOn` differ, but the fact is the same: entry `e80` was deducted. Comparing `id`, `entryId`, `projectId` and `decision` lets B adopt A's record (the server copy, with A's name and time, replaces B's local row) instead of showing `رُفض الإرسال`. The server copy keeps who and when (`acct:م٤`). Without this twin the row would show `reviewRefused` although the server holds the record.

**Completeness check.** On the PR head the coding agent greps **both** `statementApproval` (singular: `sync-status.js:117`, :133, `sync.js:30`, :123, :708, :777, :809, :1226, `firebase-client.js:909`, `accounts-statement.js:852`, `types/checkjs.d.ts:56`, :570) **and** `statementApprovals` (plural) across `public/` and `types/`, and shows that every site has a `laborReview`/`laborReviews` twin or a written reason why not (for example `accounts-statement.js:852` is J's own doc builder; L's twin is `reviewDoc`).

#### 4.4.5 Emulator tests for the rule (in `tests/emulator/account-reclass.test.js`)

| Test | Assert |
|---|---|
| **E10** | owner creates `laborReviews/lrv_e80` with the exact §4.4.1 shape → allowed |
| **E11** | a second create of `lrv_e80` (any content) → denied; update → denied; delete → denied |
| **E12** | site user → denied; owner with `active: false` → denied; owner doc with **no** `active` field → denied (R13); another uid in `createdBy` → denied; `createdAtServer` not `request.time` → denied |
| **E13** | `rev_e80` exists first → `lrv_e80` denied |
| **E14** | `lrv_e80` exists first → an L `rev_e80` (description `L:e80;…`) denied; an ordinary `rev_e80` with no token → allowed (R10) |
| **E15** | entry is `subcontractor`, has a `foremanId` id, is a reversal, or `projectId` differs → denied; an extra key, `decision: 'other'`, or a bad `reviewedOn` → denied |
| **E16** | the entry's project archived → `lrv_` allowed (`ameer:32`) |
| **E17** | the owner reads `laborReviews`; a site user's read → denied |
| **E18** (MEDIUM-A) | **one batch** with `lrv_e80` and an L `rev_e80` (both creates) → denied, in both write orders |
| **E19** (LOW-5) | id/`entryId` mismatch (`lrv_e1` with `entryId: 'e80'`) → denied |
| **E20** (LOW-5) | `createdByName` missing → denied; `createdByName` not equal to the user's `displayName` → denied |
| **E21** (LOW-5) | `lrv_e1` exists → an L `rev_e10` (`L:e10;…`) is allowed; an L `rev_e1` is denied (the `;` boundary) |
| **E22** (LOW-5) | `lrv_e80` exists → a `rev_e80` whose description is exactly `L:e80` (no `;`) → denied |
| **E23** (LOW-2, LOW-5) | legacy shape: a `labour` row seeded with rules disabled, with no `isReversal` field → `lrv_` allowed; the same with `foremanId: null` → `lrv_` allowed; an L `rev_` of the no-`isReversal` row → denied by the existing `orig.isReversal == false` (pins why `canCancel` is false, §3.3) |

Plus a regression check that every existing ledger-reversal emulator test still passes with the new clause (it is in the same CI job). One existing test changes, the `existsAfter` source pin at `tests/emulator/account-rules.test.js:1959` (§3.4, MEDIUM-C): without the edit it goes red (Architect's regression run, 213/214). With the edit, every other existing rules test is unchanged.

**Rule near-miss mutants (LOW-5).** Each one is a one-line edit of `firestore.rules` on the box, run on the local emulator only, never committed, and shown red in the PR body:

| Mutant | Edit | Killed by |
|---|---|---|
| **RM1** | drop `&& !existsAfter(entryPath('rev_' + d().entryId))` | E13, E18 |
| **RM2** | drop the whole §4.4.3 guard | E14, E18, E22 |
| **RM3** | drop `&& id == 'lrv_' + d().entryId` | E19 |
| **RM4** | drop `&& orig.projectId == d().projectId` | E15 |
| **RM5a** | `existsAfter` → `exists` in `reviewCreate` only | the edited pin (§3.4: `reviewCreate` has exactly one `existsAfter(entryPath('rev_'`). E18 stays green for this mutant (Architect, `run3-rm5-review.txt`) |
| **RM5b** | `existsAfter` → `exists` in the `reversalOk` guard only | the edited pin (§3.4: `reversalOk` has exactly one `existsAfter(laborReviewPath(`). E18 stays green for this mutant (`run3-rm5-guard.txt`) |
| **RM5** | `existsAfter` → `exists` on **both** sides | E18 (and the pin) |

---

## 5. Named exceptions to the gj sketch

| Id | The sketch says | L does | Why |
|---|---|---|---|
| **E-L1** | "J edits … nothing else" in `accounts-view.js` (gj-sketch:593); J's own plan hands `reclassAdvance` and `أُعيد تصنيفها` to L (J sketch:180, :1042, :1233, :1248) | L edits `public/accounts-statement.js` at two functions and `SENTENCE`, and the one type at `types/checkjs.d.ts:1003` | J hard-zeroed the field for L. A wrapper that replaces J's exported functions at install would be hidden coupling. The seam reads `globalThis.AccountReclass`, like `public/accounts-view.js:462`. |
| **E-L2** | "`K.refusedLinks` stores `{ refusedId, nextId }`. The card shows the new id next to the refused id" (gj-sketch:562, :586) | L does **not** write `K.refusedLinks`. It derives the refused ids from the token (`refusedAdvanceIds`) and shows the current `advanceIds[id]` next to them | `K.refusedLinks` is one object owned by H (`public/accounts-payment.js:553`); H paints it on every agreement screen whenever the refused id is in `syncErrors` (:1178-1183). An L write would overwrite H's pending link and show L's pair on unrelated agreements. The token already links them. Same display, one owner. |
| **E-L3** | "contains the token" (gj-sketch:490) | "starts with the token" | §3.3. Only L writes advance descriptions. |
| **E-L4** | — | two labels in `public/accounts-view.js:373-374` and one wait string in `scripts/verify-drives/accounts-work.js:358` | Ameer decided the L5 wording (`ameer:12`). C's L5 was parked "out with L" (`docs/plans/contractor-pr-i-sketch.md:132`). |
| **E-L5** | "`createdAtServer` … null is still offline" as the acceptance signal for the advance race (gj-sketch:494) | the same signal is also used for the ledger `rev_` ("accepted" = number `createdAtServer`, not in `outbox`, not in `syncErrors`) | A row this phone wrote stays `createdAtServer: null` until the next pull (`public/sync.js:350-359`). "Not in outbox" alone would turn `سلفة` on before the server time is known. |
| **E-L6** | "`public/sync.js`, `public/firebase-client.js` … not edited" (gj-sketch:591); "the review mark never leaves the phone" (gj-sketch:558, :601) | L adds the `laborReviews` collection to push, pull, merge and adopt (§4.4.4), and one rules block plus one ledger guard (§4.4.2-4.4.3) | Ameer chose the server (`ameer:10`) after the second owner phone (`answers:21`) made the local mark unsafe (MEDIUM-4, `acct:م٤`). |
| **E-L7** | the card sits on the «مقاول» home, which shows only while `costOpen()` (gj-sketch `### L`, :484-587, and r1 §3.2; the tab gate is `public/accounts-work.js:838-842`); no «حسابات» `act-` button (gj-sketch:587) | the card sits at the end of the «حسابات» tab, gated by owner only. Still no `act-` button and no `AccountActions` row on `statement` | Ameer: «نبين كل القيود حتى القديمة» (`ameer:15`), with `CONTRACTOR_COST_START` still null. The «مقاول» tab is hidden while it is null; «حسابات» is owner-only and always shown (`public/accounts-view.js:560-577`). |

---

## 6. Strings

### 6.1 Reused, already in the code (no approval needed)

| String | Where it already is |
|---|---|
| `سلفة` | `public/accounts-payment.js:23`, `public/accounts-statement.js:47`; listed as an L string in gj-sketch:566 |
| `سبب التصحيح` | `public/accounts-correct.js:41`; gj-sketch:566 "is reused" |
| `حفظ` | `public/accounts-payment.js:37`, `public/accounts-correct.js:38` |
| `رُفض الإرسال` | `public/sync-status.js:12`, `public/accounts-payment.js:40` |
| `عكس` | `public/accounts-correct.js:39` |
| `تاريخ القيد` | `public/ledger.js:347` |
| `تنبيه فقط، ولا يمنع تسجيل دفعة` | `public/render.js:865`; gj-sketch:566 fixes this clause |
| ` د.ع` | `public/accounts-correct.js:53` |
| `المبلغ ليس عدداً صحيحاً` | `public/accounts-payment.js:31-34` (shown only on a `range` code; the amount is fixed, so it should never show) |

- `اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً`: `public/accounts-statement.js:33`, `public/accounts-correct.js:54` (MEDIUM-1; L holds a byte-equal copy, U31).

### 6.2 New strings approved by Ameer (verbatim)

| String | Use | Source |
|---|---|---|
| `انخصم` | the "already deducted" button and the mark on a reviewed row (r1's «روجع») | `ameer:11` «الزر «انخصم»» |
| `مجموع العمل المعتمد` | person-page summary label, `public/accounts-view.js:373` | `ameer:12` |
| `مجموع المدفوع للعمل` | person-page summary label, `public/accounts-view.js:374` | `ameer:12` |
| `أُعيد تصنيفها` | J's totals card line | `answers:5` «سطر المبلغ المصحّح: «أُعيد تصنيفها»»; J sketch:1248 |
| `سلفة لم تُكتب بعد` | S2, second list heading | `ameer:33` |
| `سلفة مكررة` | S3, duplicate label | `ameer:33` |
| `هل خُصم هذا المبلغ من عمل المقاول؟` | S4, the per-row question | `ameer:33` |
| `قيود مصروف قد تكون سلفاً` | S5, first list heading | `ameer:33` |
| `ملغى` | S6, the "still owed" button and the preview line | `ameer:33` |
| `سطر مصحّح` | S7, preview line for the advance to come | `ameer:33` |
| `المشروع مؤرشف، لا يُلغى القيد` | S8, shown instead of `ملغى` on an archived-project row | `ameer:33`; behaviour `ameer:32` |

### 6.3 Strings still pending Ameer: **none**

r3 held S2-S8 in `pendingAmeer`. Ameer approved all seven verbatim at 16:51 (`ameer:33`), so they move to §6.2 with their exact text, and there is no `pendingAmeer` object in L. The approved strings live in one object at the top of `public/accounts-reclass.js`:

```javascript
const STRINGS = {
  owedHeading: 'سلفة لم تُكتب بعد',                 // S2
  duplicate: 'سلفة مكررة',                          // S3
  question: 'هل خُصم هذا المبلغ من عمل المقاول؟',    // S4
  listHeading: 'قيود مصروف قد تكون سلفاً',          // S5
  cancel: 'ملغى',                                    // S6
  corrected: 'سطر مصحّح',                            // S7
  archived: 'المشروع مؤرشف، لا يُلغى القيد',         // S8
};
```

Any Arabic string the coding agent adds beyond §6.1 and §6.2 is new and must go back to Ameer before merge.

**Not used by L:** `لا شيء (مسدّد)` (pending, gj-sketch:767), `تسوية سلفة` (J's, gj-sketch:568), `المُرجَع والتسوية أكبر من السلفة` (H/J's).

---
## 7. Test plan

Fixture names: project `JOB` (active), project `OLD` (`status: 'archived'`), owner `u-ameer`, party `p1`, expenses `e80` (labour 80,000, `2026-03-04`), `e30` (labour 30,000, `2026-03-09`), `e1`, `e10`. `today()` is `2026-11-25`. The harness is the one in `tests/accounts-statement.test.js:1-60` (globals `get/set/me/uuid/today/queueDoc`, an in-memory `store`), plus `public/accounts-payment.js`, `public/accounts-correct.js`, `public/accounts-view.js` loaded the same way J's tests load them. `CONTRACTOR_COST_START` is `null` in every test unless a test says otherwise (`ameer:15`). The card is read from `views.accounts()` after `install`.

Every new test is shown **red on its mutant and green on the real code** in the PR body (the Architect's rule on #112). A mutant is a one-line edit of `public/accounts-reclass.js` (or of the J seam for M27-M28), run on the box, never committed.

### 7.1 Unit: `tests/accounts-reclass.test.js`

| Test | What it asserts | Kills |
|---|---|---|
| **U1** candidates | `e80` and `e30` listed with amount, `تاريخ القيد` date, id; a `subcontractor` 200,000 row, a `labour` row with `foremanId`, a `labour` row in `syncErrors`, a `clientPayment` row and a reversal row are absent (gj-sketch:572) ; `e30` with an ordinary token-less `rev_e30` is still a candidate and lands in `other` (LOW-1) | M1 include `subcontractor`; M2 drop the `foremanId` filter; M3 ignore `syncErrors` |
| **U2** «ملغى» tap writes nothing | after `ملغى`: `entries`, `accountTxns`, `outbox` unchanged; the card shows `ملغى 80,000 د.ع`, `سطر مصحّح 80,000 د.ع`, the date, the id, and `تنبيه فقط، ولا يمنع تسجيل دفعة`; no person pill (gj-sketch:573, :575) | M4 write on the `ملغى` tap |
| **U3** reversal written | `حفظ` with a reason appends exactly one ledger row: id `rev_e80`, `isReversal: true`, `reversesEntryId: 'e80'`, `entryDate: '2026-11-25'`, amount 80,000, `description` starts with `L:e80;تصحيح: `; `outbox` ends with `rev_e80`; `accountTxns` unchanged; `e30` unchanged; no `settle` doc (gj-sketch:573) | M5 also write the advance; M6 drop the token |
| **U4** blank reason | `حفظ` disabled; a forced click writes nothing | M7 skip the reason check |
| **U5** two taps | two `حفظ` taps → one `rev_e80` in `entries`, one in `outbox` (gj-sketch:577) | M8 push to `entries` without `commitDoc` |
| **U6** 500 cap | original description 500 Arabic letters → reversal description is 500 code points, starts with `L:e80;`, the tail is cut; a 10-letter original is not cut (gj-sketch:579); **non-BMP (LOW-3):** an original of 497 Arabic letters + `😀` + 10 letters → the cut never splits the emoji's surrogate pair, and the result passes E9 on the emulator | M9 cut from the front (token lost); M9b no cut; M40 cut by UTF-16 units with `slice` (splits the pair) |
| **U7** already deducted | `انخصم` on `e30`: `entries`, `accountTxns` unchanged; `K.laborReviews` = one doc `{ id: 'lrv_e30', docType: 'laborReview', entryId: 'e30', projectId: 'JOB', decision: 'deducted', reviewedOn: '2026-11-25', createdBy: 'u-ameer', createdByName, createdAtServer: null, deviceId }`; `outbox` ends with `lrv_e30`; a second tap appends nothing; the row shows `انخصم`, the date and the name, and no button (gj-sketch:574, `ameer:10`) | M10 write to `meta` only (not queued); M11 append a second doc |
| **U8** reversal queued | `rev_e80` stored with `createdAtServer: null`, in `outbox` → second list, `سلفة` disabled; the same row out of `outbox` but still null → still disabled (E-L5) | M12 treat "not in outbox" as accepted |
| **U9** reversal accepted, reload | `rev_e80` with `createdAtServer: 1700000000000`, not in `outbox` → kind `owed`, `سلفة` on; re-`require` the module (fresh screen state) → still `owed` (gj-sketch:578) | M13 keep the step in module memory |
| **U10** reversal refused | `rev_e80` in `syncErrors` → first list with `رُفض الإرسال`, no `ملغى`, not on the second list; `stillOwedReversal` returns `validateEntry`'s errors (`DUPLICATE`, `public/ledger.js:210`, and `القيد معكوس مسبقاً`, :254) and no doc | M14 offer `ملغى` again |
| **U11** ordinary «عكس» | `rev_e80` without the token → kind `other`, on neither list | M15 count any `rev_` as an L reversal |
| **U12** person required | «سلفة» card with no pill picked: `حفظ` disabled, a forced click appends nothing (gj-sketch:576) | M16 skip the party check |
| **U13** advance written | pill `p1`, `حفظ` → one `accountTxns` body: `purpose: 'advanceLabor'`, `kind: 'body'`, amount 80,000, `partyId: 'p1'`, `projectId: 'JOB'`, `txnDate: '2026-11-25'`, uuid id, `description` starts with `L:e80;` and contains `2026-03-04` and `e80`; it is queued; state `advQueued`, button off; a second tap appends nothing (gj-sketch:578, :581) | M17 amount not from the expense; M18 button stays on while queued |
| **U14** `e1` vs `e10` | a live advance `L:e10;…` does not cover `e1`; `e1` stays `owed` (gj-sketch:580) | M19 match `'L:' + id` without `;` |
| **U15** refused advance | the advance id in `syncErrors` → back to `owed`; the refused id is shown with `رُفض الإرسال`; opening «سلفة» mints a different uuid and shows it next to the refused id; `K.refusedLinks` is not written (gj-sketch:583, E-L2) | M20 reuse the refused id; M21 write `K.refusedLinks` |
| **U16** reversed advance | a live `rev_<advanceId>` → back to `owed` (gj-sketch:584) | M22 ignore killers (`rowLive`) |
| **U17** duplicates | two covering advances 80,000: (`createdAtServer` 1,000, id `b`) and (2,000, `a`) → `سلفة مكررة`, keep `b`, «عكس» only on `a`; after a live `rev_a` → `done`, label gone, `Accounts.balances(txns, { partyId: 'p1', projectId: 'JOB' }).net === -80000`; equal times on `a`, `b` → keep `a`, offer `b`; one with `createdAtServer: null` → no «عكس» (gj-sketch:582) ; all on `p1` → mode `oldest` | M23 keep the latest; M24 tie keeps the higher id; M25 offer while one is null |
| **U18** duplicate reversal | «عكس» on `a` with a reason → `accountTxns` gains `rev_a`, `kind: 'rev'`, `reversesId: 'a'`, the reason, from `AccountCorrect.reversalDoc`; blank reason → nothing | M26 hand-build the `rev_` |
| **U19** `reclassTotal` and J's card | accepted `rev_e80` (L) + counted covering advance 80,000 on `JOB` → `reclassTotal` 80,000; `contractorTotals(...).reclassAdvance` 80,000 with `AccountReclass` loaded; `totalsCardHtml` has `data-st-reclass` and `أُعيد تصنيفها` with 80,000; `cost` and `paidToContractors` equal the values without L (the line is not added again); an advance `L:e1;` with no L reversal → 0 and no line; an advance on another project → 0; the L `rev_e80` in `syncErrors` → 0 (LOW-2) | M27 count advances without a matching L reversal; M28 add `reclassAdvance` into `paidToContractors`; M38 drop the project filter; M39 count an L `rev_` that is in `syncErrors` |
| **U20** gate | constant **null** → the card **is** painted for an active owner (`ameer:15`); site user → `''`; owner with `active: false` → `''` (J's `ownerOn()`, INFO-1); owner doc with **no** `active` field → the card paints (J's pattern; every write is then refused by the rule, R13, E12); the «مقاول» views are not wrapped by L | M29 add a `costOpen()` gate back; M37 use `Ledger.can(user, 'owner')` (role only) |
| **U21** archived project | an `OLD` row is `open` with `canCancel: false`, no `ملغى` button, `data-rc-closed` with S8 in its place; `انخصم` is present and writes `lrv_` (`acct:م٦`); `stillOwedReversal` → `['inactive']` | M30 drop the project check; M42 hide archived rows |
| **U22** no bulk | three `open` rows; `ملغى` + `حفظ` on one → `entries` length +1, the other two unchanged and still `open` (gj-sketch:564, :721) | M31 loop over the list |
| **U23** stale card | the card is open, then a pull adds `rev_e80` from another phone; `حفظ` writes nothing | M32 skip the re-check in `onClick` |
| **U24** registry and «حسابات» | `AccountActions` gains 4 rows, all `tab: 'contractor'`; `actionHtml('agreements' | 'movements' | 'statement')` output has no `act-reclass` / `data-rc-` (gj-sketch:587); the card appears only in `views.accounts()` (E-L7) | M33 register on `statement` |
| **U25** draw guard (MEDIUM-1) | U17 fixture plus a live `settle` with `settlesId: 'a'` → `a` is in `blockedIds`, no `data-rc-dup-rev="a"`, `data-rc-dup-blocked="a"` shows `اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً`; a forced click writes nothing; the same with a live `returnAdvance` `targetId: 'a'`; after a live `rev_` of that settle → `a` is back in `reverseIds` | M34 offer «عكس» despite a live settle; M35 despite a live `returnAdvance` |
| **U26** different persons (`acct:م٥`) | covering advances `a` on `p1` and `b` on `p2` → mode `ownerPicks`, `keepId ''`, «عكس» on both with each person's name; «عكس» on `b` with a reason → state `done` with `a`; a second forced «عكس» on `a` in the same paint writes nothing (re-check) | M36 force keep-oldest across persons; M41b skip the "two still live" re-check |
| **U27** count and order (LOW-4) | rows `open` e1, `reviewed` e30, `revRefused` e10 → heading ends with ` (3)`, DOM order e1, e10, e30 | M41 sort reviewed first / count only open |
| **U28** server review states | `lrv_e30` in `syncErrors` → `reviewRefused` with `رُفض الإرسال`; `lrv_e30` with a number `createdAtServer` and a refused `rev_e30` → `reviewed`; after a fresh `K.laborReviews` from a pull (second phone) → `reviewed` without any local tap; a logout-and-pull fixture → still `reviewed` (`ameer:10`) | M45 read reviews from `meta` only; M46 let a refused `rev` beat an accepted review |
| **U29** cash out unchanged (`acct:م٢`) | test helper `cashOut(projectId) = Ledger.totals(countedEntries(entries)).spent on the project + Σ counted accountTxns amount × Accounts.PURPOSES[purpose].effect.cash on the project` (`public/ledger.js:27`, `public/accounts.js:70-78`): before 80,000; after both steps 80,000; the advance has the same `amount` and `projectId` as the expense | M17 amount not from the expense; M43 `projectId` not from the expense |
| **U30** cost and balance move by the same amount (`acct:م٢`, `ameer:13`) | after both steps: the project spent (`ownerSpent` logic with the constant null: `Ledger.totals(...).spent`) falls by exactly 80,000 and stays down; `Accounts.balances(txns, { partyId: 'p1', projectId: 'JOB' }).net` falls by exactly 80,000 (0 → −80,000) | M47 write the advance on another project |
| **U31** reused sentence | L's `SENTENCE.dependent` is byte-equal to the `dependent` text read from `public/accounts-statement.js` and `public/accounts-correct.js` source | M44 any drift |
| **U32** description date and id (`ameer:14`) | the advance `txnDate` is `today()` `2026-11-25`; its `description` starts with `L:e80;` and contains `2026-03-04` and `e80` | M48 use the old date as `txnDate` |
| **U33** L5 labels (`ameer:12`) | `AccountsView` person overview shows `مجموع العمل المعتمد` and `مجموع المدفوع للعمل` and no bare `عمل معتمد` kv label; the statement still prints `عمل معتمد` (`tests/accounts-statement.test.js:1091` stays green) | M49 keep the old labels |
| **U35** `bothFacts` (MEDIUM-A) | an accepted `lrv_e80` and an accepted L `rev_e80` (with and without a covering advance) → kind `bothFacts`, at the top of the first list with both facts; no `data-rc-advance`, no `سلفة` button, and a forced click on a stale `data-rc-advance="e80"` writes nothing | M52 let `owed` win over `bothFacts` |
| **U36** foreign buttons (AQ9) | `onClick` on a button with no `data-rc-*` attribute returns `false` and changes no store; with `data-rc-review` it returns `true` | M53 return `true` for every button |
| **U37** first-match order and legacy shape (LOW-1, LOW-2) | `lrv_e80` in `syncErrors` + an accepted L `rev_e80` → `owed` with the refused note; a row with no `isReversal` field and one with `foremanId: null` are candidates, `open`, with «انخصم» and `canCancel: false` | M54 put `reviewRefused` before the L kinds; M55 filter the client with `'foremanId' in e` |
| **U34** sync of `laborReview` (in `tests/sync-status.test.js` or a new block of the L test) | `collectionFor({ docType: 'laborReview' }) === 'laborReviews'`; `toRemote` keeps exactly the 9 fields of §4.4.1 and drops `docType`; `usesPutIfMissing('laborReviews')`; `accountReads(owner)` includes it, site user `[]`; `pullAccounts` tags `docType: 'laborReview'`; **`Status.sameContent` (MEDIUM-B):** a local `lrv_e80` from owner B and a server `lrv_e80` from owner A (different `createdBy`, `createdByName`, `deviceId`, `reviewedOn`) → `true`, and the found path adopts the server copy (no `syncErrors` entry, row `reviewed` with A's name); a server doc with a different `entryId` or `decision` → `false` | M50 send `docType`; M50b forget `usesPutIfMissing`; M51 omit the `sameContent` twin; M51b compare `createdBy` too |

`tests/strict-accounts-reclass.test.js`: `accounts-reclass.js` passes `tsc` strict with `checkJs` (the same 17-line test as `tests/strict-accounts-statement.test.js`).

`tests/shell-cache.test.js`: v83 at the three pins; `accounts-reclass.js` after `accounts-statement.js` and before `render.js`; in `ASSETS` and `SHELL`. `tests/webkit-upgrade.test.js`: `MARK` v83.

### 7.2 Browser checks (`tests/browser-check.js`)

| Check | Kills |
|---|---|
| **B1** owner, constant **null** (`ameer:15`), `#accounts` with the U1 fixture: `[data-rc-list]` is present with the count, no console error, no horizontal overflow on the 390 px viewport (`tests/browser-check.js:684`), `dir="rtl"` holds | layout break; M29 in the browser |
| **B2** site user on the same fixture: no `[data-rc-list]` and no `[data-rc-owed]`; owner with `active: false` the same | M37 in the browser |
| **B3** constant set at runtime (as J's checks do), «حسابات» statement tab for `JOB` with the U19 fixture: `[data-st-reclass]` present | E-L1 seam not wired |
| **B4** person page `#account/p1`: `مجموع العمل المعتمد` and `مجموع المدفوع للعمل` visible (`ameer:12`) | M49 in the browser |

The CI floor (line 120, `-lt 45`) is a floor, not the total; it is not lowered.

### 7.3 Emulator (`tests/emulator/account-reclass.test.js`)

Seeded like `tests/emulator/account-statement.test.js` (owner user, project `JOB` active, project `OLD` archived, party `p1`, ledger `labour` rows `e80` on `JOB` and `e81` on `OLD`).

| Test | Assert | Rule cited |
|---|---|---|
| **E1** | owner creates `ledgerEntries/rev_e80` with a 500-letter Arabic description starting `L:e80;` → allowed | `firestore.rules:100`, :131-147 |
| **E2** | the same with 501 letters → denied | :100 |
| **E3** | `reversalReason: ''` → denied; no `advanceLabor` is written by the test flow (gj-sketch:585) | :142-144 |
| **E4** | `accountTxns/<uuid>` `advanceLabor` body with a 500-letter description starting `L:e80;` → allowed | :870-892, :503-505 |
| **E5** | the same with 501 → denied | :503-505 |
| **E6** | after E1, set `JOB` to archived with rules disabled; the advance → denied; `rev_e80` still exists (gj-sketch:586) | :876, :375-377 |
| **E7** | a second create of `rev_e80` (different reason) → denied (no update) | :156-157 |
| **E8** | `accountTxns/rev_<advanceId>` for an L advance with a reason → allowed; with `''` → denied | :1083-1111 |
| **E9** (LOW-3) | the description L's cut produces from 497 Arabic letters + `😀` + 10 letters (§3.6) is accepted on both the ledger `rev_` and the advance body; a raw 501-code-point string with the emoji is denied. The test records what `size()` counts, and the JS cut follows it | :100, :503-505 |
| **E10-E23** | the `laborReviews` rule and the ledger guard, §4.4.5 (E18 batch, E19-E23 LOW-5) | §4.4.2, §4.4.3 |

`.github/workflows/ci.yml:217` floor 271 → **294**: 271 (at 27783e1c) + 9 (E1-E9) + 8 (E10-E17) + 6 (E18-E23), each one `test()`. (r2's 288 was 271 + 9 + 8; the review's note that "279 + 9" is the wrong breakdown is taken.) The final number is the real total on the PR head, as #112 did.

### 7.4 Verify drive (`scripts/verify-drives/accounts-reclass.js`, id `reclass`)

Emulator only; it refuses a non-local host first (`scripts/verify-drives/accounts-statement.js:21` pattern). With the constant **null**, it seeds two `labour` rows, opens `#accounts`, answers `انخصم` on one and `ملغى` + `حفظ` on the other, waits for flush and pull, opens `سلفة`, picks the party, saves, and reads `ledgerEntries`, `accountTxns` and `laborReviews` back. Then it logs out, logs in, and checks that the `انخصم` row is still `reviewed` after the pull (`ameer:10`). It picks rows by id, never by amount (J's L-6). Feature file `features/reclass.md`.

### 7.5 Mutants that must go red

M1-M55 (plus M9b, M41b, M50b, M51b) in §7.1, the rule mutants RM1-RM5, RM5a, RM5b (§4.4.5), and the emulator near-misses in §4.4.5. r3 adds M51-M55 and RM1-RM5. r2 adds M34-M50 for MEDIUM-1 (M34, M35), `acct:م٥` (M36, M41b), the owner gate (M37, LOW-2), `reclassTotal`'s project filter and a refused `rev_` (M38, M39, LOW-2), non-BMP (M40, LOW-3), count/order (M41, LOW-4), archived rows (M42), same project/amount (M43, M17), the sentence copy (M44), the server record (M45, M46, M50, M50b), the advance project (M47), the date (M48) and L5 (M49). M10 and M11 now target the server record. Each one is listed in the PR body with the test that kills it and the red output line. A mutant that no test kills is either covered by a new test or argued **equivalent** in the PR body for the Architect to accept, as M30 was on #112.

### 7.6 CI

Four jobs (lint/typecheck, unit, browser, emulator), green on the final head. Superseded heads are ignored.

---

## 8. PR shape and order

- **One** draft PR from main (after J; gj-sketch:691 "L merges after J" holds: J is #112, main `27783e1c`). Branch `cursor/contractor-slice-l`.
- Commit order: (1) `firestore.rules` §4.4.2-4.4.3 + E10-E23, the edited `existsAfter` pin in `tests/emulator/account-rules.test.js:1959` (counts 7 after `ownerOk` and 9 file-wide, plus the `reviewCreate` and `reversalOk` one-each asserts, §3.4), and RM1-RM5b (the rule first, proven alone); (2) sync and client wiring §4.4.4, including `sync-status.js`, + U34; (3) pure functions + U1-U19, U25-U32; (4) screen, `register`, `install` on «حسابات», U20-U24, U27, U28; (5) the J seam (E-L1) + U19 card asserts; (6) L5 labels (E-L4) + U33 + B4 + the drive wait string; (7) emulator E1-E9 + floor; (8) wiring and pins (`index.html`, `sw.js` v83, `session.js`, `render.js`, `package.json`, `ci.yml`, `verify-aj.js`, drive, skill files, inventory, plan copy, `.prettierignore`).
- **One** cloud agent, model **grok-4.7**, with `/workspace/pstack-block-grok-only.md` in its prompt. Not started by this plan; it needs EA's go for code.
- The approved strings S2-S8 live in one `STRINGS` object at the top of `public/accounts-reclass.js` (§6.3), with the exact text Ameer approved (`ameer:33`). The PR body cites `ameer:30`-`ameer:33` and says no Ameer question is pending.
- The squash message strips every `Co-authored-by` line. No amend, no force-push, no push to main, no hook bypass.
- Merge only on EA's go that quotes Ameer and names the head SHA, after the Architect's review of that SHA and CI 4/4.
- Deploy is a separate go: rules + hosting together (§4.1, §4.4).

---

## 9. Hard constraints

- `CONTRACTOR_COST_START` stays `null` (`public/accounts.js:11`). L does not read it for its own gate (`ameer:15`) and never writes it.
- **`firestore.rules`: edited, only as §4.4.2-4.4.3** (`ameer:10`). No other rule changes; no fixed advance id (§4.3).
- Rules and hosting deploy as a pair, only on Ameer's separate go: save the live ruleset, read-only check the diff is §4.4 only, **rules first, then hosting**, then the 2-minute wait before anyone opens the app. Rollback: **hosting first, then rules** (§4.1).
- No CSV change. No `.cursor/rules/pstack-models.mdc` edit.
- Every Arabic string in L is approved (§6.2): `انخصم`, `مجموع العمل المعتمد`, `مجموع المدفوع للعمل`, `أُعيد تصنيفها`, S2-S8. Any other new string goes to Ameer before merge.
- `sw.js` `VERSION` `aj-p0-v83` with the shell-cache and webkit-upgrade pins (§3.4).
- No migration, no edit or delete of an existing document. Append-only, like the ledger (`public/ledger.js:264-284`). `laborReviews` is create-only.
- Ameer's rule of 2026-11-25 15:35: no deploy or other executable command inside a file-writing command; runbooks and plans are written with a method that cannot execute their content; no deploy credential is exported while preparing; prep-only work never runs anything that can deploy. The cloud-agent prompt repeats it.

---

## 10. Revert and blast radius

- `git revert` of the L PR removes the script, its tests, the drive, the J seam line, the `laborReviews` sync wiring, the L5 labels and the rule block. Documents already written stay: an accepted `rev_` keeps the old row reversed, an advance stays a debt on the person, and `laborReviews` docs stay on the server. That is the intended accounting state, not damage. The service-worker number is not reused; a revert takes the next free one.
- **A revert of the rules must deploy with the hosting revert**, on Ameer's go: **hosting first, then rules** (§4.1). If hosting is reverted alone, the old client never reads `laborReviews` and the guard in `reversalOk` still refuses an L `rev_` of a reviewed row (harmless: the old client writes no L token). If rules are reverted alone, the new client's `lrv_` writes are refused (`رُفض الإرسال`) and the guard is gone.
- Callers of what L edits: `contractorTotals` has one caller (`public/accounts-view.js:468`); `totalsCardHtml` the same. `views.accounts` has no other wrapper. `K` is read everywhere by name; adding a key changes nothing for others. The install list loop (`public/render.js:1699-1702`) skips a missing global. The ledger guard touches every ledger reversal: E14 and the existing reversal emulator tests cover it.
- J's D4 test (`tests/accounts-statement.test.js:1130-1150`) does not load L and stays green.

---

## 11. Risks

| # | Risk | Cover |
|---|---|---|
| R1 | Two owner phones (`answers:21`) each write one advance before either syncs (uuid ids, `firestore.rules:878`). | `سلفة مكررة` with «عكس» (U17, U26), with the draw guard (U25). The ledger `rev_` has a fixed id, so only one reversal exists. The «انخصم» record is on the server, so the second phone sees it (`ameer:10`). |
| R2 | Phone A taps «ملغى» (with token) while phone B uses the ordinary «عكس» (no token) on the same row. The race adopts the server copy (`sameReversal`, `public/sync-status.js:45-55`). If B's row wins, L sees `other` and offers no `سلفة`. | LOW (AQ6 agreed). The owner can still record an advance on H's form. |
| R3 | **Permanent effect (MEDIUM-2):** after an accepted L `rev_` the project's spent stays lower by the amount and its profit higher, also after the advance (§3.7). Between the steps the person owes nothing yet. | Accepted by Ameer (`ameer:13`). The accountant: correct accounting (`acct:م٢`). Company cash out is unchanged after both steps (U29); cost and balance move by the same amount (U30). The row stays on the second list with `سلفة` on across reload, logout and phone change (U9). |
| R4 | Phone A marks «انخصم» offline while phone B taps «ملغى» offline on the same row. | The server takes the first one to arrive; the second is refused (§4.4.2 `!existsAfter(rev_)`, §4.4.3 guard; E13, E14, E18 for one batch). The refused side shows `رُفض الإرسال`. If both ever land, `bothFacts` never offers «سلفة» (U35). |
| R5 | L's advance is cash, so it is "unreviewed" until H's «تدقيق» (`public/accounts.js:854`). H's review button is on the agreement screen, which is hidden while the constant is null. | By design. The advance shows now on the person page under `سلف قائمة عليه` (`public/accounts-view.js:375`); its «تدقيق» comes when the contractor screens open. Accepted with the placement decision (`ameer:30`). |
| R6 | Firestore's `size()` and the JS cut may count a 500-character string with a non-BMP character differently. | E9 records the server count; U6 makes the JS cut follow it (LOW-3). |
| R7 | An agent edits `accounts-payment.js` to accept a description, or writes `K.refusedLinks`. | Files list (§3.4), U15 (M21). |
| R8 | An agent loops the list. | U22. |
| R9 | A refused L advance also shows on H's agreement screen as a refused cash row (`public/accounts-payment.js:1166-1168`). | Same words `رُفض الإرسال`; no conflict. |
| R10 | The ordinary «عكس» (no token) on a row already marked «انخصم» is not blocked by the guard; an owner could then record an advance by hand on H's form. | Deliberate, so a genuine data-entry mistake can still be reversed. It needs two separate manual acts on other screens. E14 pins it. |
| R11 | The ledger guard adds one read to every ledger reversal (3 → 4). | Within the 10-read limit. The existing reversal tests run in the same CI job. |
| R13 | Owner gate drift (LOW-3): the client's `ownerOn()` accepts a missing `active`, the rule's `ownerOk` needs `active == true` (`firestore.rules:372-374`). An owner doc with no `active` field sees the card but every write is refused (`probe:P2`). | J's existing pattern, kept for consistency. U20 and E12 pin both sides. The refusal shows `رُفض الإرسال`. |
| R14 | Legacy `labour` rows with no `isReversal` field or with `foremanId: null` (LOW-2). They can take «انخصم» but not «ملغى», because the unchanged ledger rule refuses their reversal. | `canCancel: false` (U37, E23). The count is not taken: the Architect agrees `canCancel: false` is enough and found no read-only inspect path at 27783e1c (AQ12, r3 review §6). A later plan may change `reversalOk`; L does not. |
| R12 | `laborReviews` is a new synced collection; a missed touch point would drop it on pull or merge. | §4.4.4 table (now with `sync-status.js:117`, :133), the grep of both `statementApproval` and `statementApprovals` on the PR head, U34, U28 (pull on a second phone, logout), and the verify drive's logout step. |

---

## 12. Ameer's decisions (all recorded; no open question for Ameer)

**16:18, card `t2214s7772`** (`AMEER-answers-L.md` :9-15): where «انخصم» is stored (:10), the button word «انخصم» (:11), the L5 labels (:12), the permanent cost effect (:13), the advance date (:14), and showing all old rows (:15).

**16:51, card `t2217s7785`** (`AMEER-answers-L.md` :28-33 (2026-11-25 16:51 Baghdad, card `t2217s7785`, verbatim, EA-relayed); it replaces the unanswered words card `t2215s7779`, :26). r3's four questions, now decisions:

| r3 question | Ameer's answer (verbatim) | Decision in the plan | Accountant (advisory) |
|---|---|---|---|
| س٢ placement and live effect | `ameer:30` «إي موافق، القائمة تشتغل من هسه وللمالك بس» | the card at the end of «حسابات», owner only, live from deploy; «ملغى» changes the books from then (§3.2, E-L7) | agrees, `acct2:4` |
| س٣ duplicates on different persons | `ameer:31` «إي موافق على السلف المكررة» | different persons → the owner picks; same person → the oldest by server time stays (§3.3) | agrees, `acct2:5` |
| س٤ archived projects | `ameer:32` «إي موافق على المشاريع المؤرشفة» | no «ملغى»; «انخصم» allowed; S8 beside the row (§2.1(11), §4.4.2, E16) | agrees, `acct2:6` |
| س١ the seven words | `ameer:33` «إي، أوافق على الكلمات السبع: «قيود مصروف قد تكون سلفاً»، «هل خُصم هذا المبلغ من عمل المقاول؟»، «ملغى»، «سلفة لم تُكتب بعد»، «سلفة مكررة»، «سطر مصحّح»، «المشروع مؤرشف، لا يُلغى القيد»» | S2-S8 approved with the exact text (§6.2) | (S8 "needs Ameer's OK", `acct2:6`: given) |

The fixed advance id stays (أ) and was not asked again (§4.3; the Architect agrees).

---

## 13. The accountant's advice (محاسب أهل الجزيرة, advice only, not a decision)

Sources (LOW-7): the accountant's message of 2026-11-25 16:05, sent to the engineer via SendToAgent (**relayed**; its Arabic is not on file), and the filed English version `ACCOUNTANT-advice-L-r1.md`, written 16:12, sha256 `84de25de0d35c06e72518dd1e564baa34c1b8d5abd350ed04523511d7094b81a` (the parent cited `e2bc01f6…`, the sha before the file's header was corrected at 16:40). Arabic quotes below are marked **(relayed)**; "File:" gives the filed text.

| # | The accountant's advice | In r3 |
|---|---|---|
| م١ | (relayed) «إي، أوافق.» File: "I agree again with the revised answer (4)": the reversal first; only after the server accepts it, one `advanceLabor` for the same amount, same project, on the person the owner picks. | Closes G1 (§15). Design unchanged (§3.8, U8, U9). |
| م٢ | (relayed) «صحيحة محاسبياً.» File: "Conditions: tests that company cash is unchanged after both steps, and that project cost and the person's balance each move by the same amount." | Amount and project come from the expense (§3.6; U29 M17/M43). U29 (cash out, a test-only figure); U30 (cost and balance). Ameer accepted the effect (`ameer:13`). |
| م٣ | (relayed) «مقبول.» File: "dated today … The original date and original entry id stay in the description (token L:<entryId>;). Past periods and issued statements do not change." | §3.6; U32. Ameer decided the same (`ameer:14`). |
| م٤ | (relayed) «ما تكفي.» File: "save it on the server (option ب), because a second owner phone is approved (answers:21) and the mark is an accounting decision. A rules change goes to Ameer." | Ameer chose the server (`ameer:10`). §4.4. |
| م٥ | File: "keep the oldest by server time only if all are on the same person; otherwise the owner picks which stays." The relayed message also said every reversal carries a reason (not in the file). | §3.3 `ownerPicks`; U26 (M36). Decided by Ameer (`ameer:31`). `سبب التصحيح` is required anyway by `reversalDoc` (U18). |
| م٦ | File: "Closed projects: show the rows without «ملغى»; do not hide them." The relayed message also said a reason should show next to them and «روجع» stays available (not in the file). | S8 approved (`ameer:33`); «انخصم» on archived projects decided (`ameer:32`, `acct2:6`); U21, E16. |

**The accountant's r2 file** (`ACCOUNTANT-advice-L-r2.md`, sha256 `0eeffbe3…`, written 16:40, advisory): agrees on the list going live now, owner only, at the end of «حسابات» (`acct2:4`); on owner-picks across persons and oldest on the same person (`acct2:5`, "the condition from my r1 advice"); and on archived projects with no «ملغى», «انخصم» allowed, S8 beside it (`acct2:6`). This file is in English and is quoted from its own text.

**One optional advisory question (م٧).** The corrected advance appears now on the person page under «سلف قائمة عليه», but its «تدقيق» waits until the contractor screens open (R5). Acceptable for the books, or should anything be noted on paper meanwhile?

---

## 14. Questions for the Architect

AQ1-AQ7 were answered in the r1 review. AQ8-AQ11 were answered in the r2 review, and AQ12-AQ13 in the r3 review (`REVIEW-plan-L-r3-ce459cf1.md` §6, below). In the r2 review (`REVIEW-plan-L-r2-3a71d03c.md` §6): AQ8 agree, plus `existsAfter` (done, §4.4); AQ9 confirmed (`public/render.js:1434-1437` → `AccountsView.onClick`; L's `onClick` returns `false` without `data-rc-*`, U36); AQ10 agree, with the `sync-status.js` twin (done, §4.4.4); AQ11 decided by Ameer (`ameer:30`). 

- **AQ12** (answered, r3 review §6): agreed, L ships `canCancel: false` for legacy rows (no `isReversal` field, or `foremanId: null`) and nothing more. The optional read-only count is **dropped**: there is no existing read-only inspect path in `scripts/` at 27783e1c, and it is not needed.
- **AQ13** (answered, r3 review §6): agreed, `bothFacts` shows both facts and offers nothing; no «عكس» from L. Any fix is the owner's on I's reversal screens.

No question for the Architect is open.

---

## 15. Items in the gj sketch that block or change L

| # | Item | Blocks? |
|---|---|---|
| G1 | **The held "L yes pair"** and the accountant's re-agreement to the two-step answer (4). | **Closed** on the accountant side: message 2026-11-25 16:05 (relayed) and `ACCOUNTANT-advice-L-r1.md` (filed 16:12). The Architect's side was closed by #94. |
| G2 | `روجع`, `سلفة لم تُكتب بعد`, `سلفة مكررة` were `بانتظار أمير`; the question text was [OPEN] (gj-sketch:568). | **Closed.** «روجع» is replaced by «انخصم» (`ameer:11`); S2-S8 approved (`ameer:33`). |
| G3 | Single-phone premise (gj-sketch:661) vs `answers:21`. | **Closed** by `ameer:10` (server record, §4.4). |
| G4 | `K.refusedLinks` as the link store (gj-sketch:562, :586) conflicts with H's single-slot use. | No: E-L2 (AQ3 agreed). |
| G5 | The advance needs a description; `cashDoc` writes none. | No: L sets it on the returned doc (§3.6). |
| G6 | `أُعيد تصنيفها` "pending" in gj-sketch:650. | No: approved later (`answers:5`). |
| G7 | Line drift (§0). | No. |
| G8 | "L merges after J" (gj-sketch:691). | Met (J is #112 on main). |
| G9 | Ameer's «اكمل خطواة L» (INFO-2). | Relayed by EA at 15:45, recorded in `AMEER-answers-L.md` :3. Plan only. |
| G10 | The card's place: the gj sketch puts it on the «مقاول» home. | Changed by `ameer:15` (E-L7), confirmed by `ameer:30`. Closed. |
| G11 | The gj sketch keeps the oldest duplicate (gj-sketch:494). | Changed to "owner picks" across persons (`acct:م٥`), decided by Ameer (`ameer:31`). Closed. |

---

## 16. pstack

- `architect`: §3.1 two shapes, §3.2 module structure, §3.5 types, §3.6 signatures, §7 tests.
- `principle-model-the-domain` / one owner of state: `rowState` is the only classifier; the server owns "reversed", "advanced" and "deducted" (`laborReviews`).
- `principle-subtract-before-you-add`: no `K.refusedLinks` write, no stored workflow, no fixed advance id, no H edit; the local-only mark is dropped rather than kept beside the server record.
- `principle-make-operations-idempotent`: fixed `rev_` id, `commitDoc` dedupe, the disabled button, U5 and U13 two-tap tests.
- `principle-sequence-verifiable-units`: the commit order in §8.
- Arena: not run (cost gate).

---

## 17. Changelog

### r1

- First plan for L at main `27783e1c`, from gj-sketch r18 `### L` (:484-587), item 5 (:21), :601, :650, :652-662.
- Re-cited every moved line (§0).
- Chose shape A (one classifier, derived state) over stored workflow state (§3.1).
- Added E-L1..E-L5 (§5): J's `reclassAdvance` seam, no `K.refusedLinks` write, "starts with", the optional L5 wording edit, and the acceptance signal.
- Rules: no change (§4.1); the fixed-id alternative is shown with its exact diff only for Ameer's Q5 (§4.3).
- Strings: 4 new from the sketch, 4 [NEEDS AMEER] (+2 only if Q2 = ب) (§6).
- Tests: U1-U24, B1-B3, E1-E8, 33 mutants (§7). sw `aj-p0-v83`.
- Flagged: the accountant side of the held L yes pair (G1) and the second owner phone (G3).


### r2

- Inputs: r1 `a1382790…`, the Architect's review `5901e4e1…` (NOTES), the accountant's advice (16:05, advice only), and Ameer's answers of 16:18 (`AMEER-answers-L.md` :9-15, sha256 `d178073c…`), folded in as decisions.
- MEDIUM-1: draw guard on the duplicate «عكس», reusing `اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً` (§3.3, U25, M34-M35).
- MEDIUM-2: the permanent drop in spent and rise in profit stated plainly (§3.7, R3); accepted by Ameer (`ameer:13`); U29-U30 per `acct:م٢`.
- MEDIUM-3: merge blocked until Ameer approves S2-S8; the three sketch-only strings moved to `pendingAmeer`; the «ملغى» meaning check in س١.
- MEDIUM-4: the local mark is dropped; the «انخصم» record goes on the server with a `firestore.rules` change (§4.4, `ameer:10`, `acct:م٤`). r1's س٥ is answered; the fixed id stays (أ) (§4.3).
- `ameer:11` «انخصم» replaces «روجع»; `ameer:12` L5 labels (E-L4); `ameer:14` date; `ameer:15` no start-date gate, card on «حسابات» (E-L7).
- `acct:م٥` owner picks across persons (U26); `acct:م٦` archived rows shown with S8 (U21).
- LOWs: `countedEntries` citation fixed; 48 → 50 files; mutants M37-M39; non-BMP U6/E9; count and order U27; J's `ownerOn()`.
- Tests: U1-U34, B1-B4, E1-E17 (floor 288), M1-M50.

### r3

- Inputs: r2 `3a71d03c…`, the Architect's r2 review `2dfe928b…` (NOTES), and the Architect's emulator probes (`probe:P1`-`P9`, read only).
- MEDIUM-A: `existsAfter` on both sides (§4.4.2, §4.4.3); E18 (batch denied); row state `bothFacts` that never offers «سلفة» (§3.3, U35, M52).
- MEDIUM-B: the `laborReview` twin in `sync-status.js:117` and :133 with keys `id`/`entryId`/`projectId`/`decision`, no `createdBy` (reason in §4.4.4); U34 extended (M51, M51b); grep of both `statementApproval` and `statementApprovals`.
- LOW-1 first-match order (§3.3, U37). LOW-2 `orig.get(...)` defaults, client filter matched, `canCancel: false` for legacy shapes (R14, E23). LOW-3 owner gate drift (R13, U20, E12). LOW-4 §3.7 س٦ removed; cash out marked test-only. LOW-5 E19-E23 and RM1-RM5; floor 271 + 9 + 8 + 6 = 294. LOW-6 deploy order: rules then hosting; rollback hosting then rules. LOW-7 accountant quotes marked relayed; one file time (16:12); file sha now `84de25de…`.
- Architect §5: merge blockers for Ameer are S2-S8 (س١), the placement and live effect (س٢), owner picks across persons (س٣, new), «انخصم» on archived projects (س٤, new).

### r4

- Decisions only, no design change to the r3 rules, tests or code shape.
- Inputs: r3 `ce459cf1…`; Ameer's 16:51 answers (`AMEER-answers-L.md` sha256 `6dedd9d4…`, card `t2217s7785`, :28-33); the accountant's r2 file (`ACCOUNTANT-advice-L-r2.md` sha256 `0eeffbe3…`, 16:40, agrees on 1-3). The r1 accountant file stays `84de25de…`, 16:12.
- §12: r3's س١-س٤ are now recorded decisions (`ameer:30`-`ameer:33`).
- §6: S2-S8 moved from `pendingAmeer` to approved strings with exact text; the object is renamed `STRINGS`; no Arabic string is pending.
- Header gates: the Ameer merge blockers are removed; §2.1(11), §4.4.2, E16, §8, §9, §13, §15 updated to cite the decisions.

### r5

- Input: the Architect's r3 review `bd4a68e8…` (NOTES). No other design change.
- MEDIUM-C: the existing pin `tests/emulator/account-rules.test.js:1959` is named in §3.4, §4.4.5 and §8 step (1). Counts go to 7 after `ownerOk` and 9 file-wide, and it gains one-each asserts for `reviewCreate` (`existsAfter(entryPath('rev_'`) and `reversalOk` (`existsAfter(laborReviewPath(`). The floor stays 294.
- LOW-8: RM5 is split into RM5a and RM5b (one side only, killed by the pin) and RM5 (both sides, killed by E18).
- LOW-9: "question text not on the box" is dropped. `AMEER-answers-L.md` is cited as `6dedd9d4…`; `45a52f50…` and `d178073c…` were superseded at 16:51.
- AQ12 (canCancel:false, the count is dropped) and AQ13 (show only) are recorded as agreed.
