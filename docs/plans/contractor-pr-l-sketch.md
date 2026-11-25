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

`LaborReview`, `ReclassCtx`, `ReclassState`, `DuplicatePlan`, `AccountReclassApi`, `StillOwedInput`, and `AdvanceAfterInput` are the interfaces in §3.5 of PLAN-L r5. `ContractorTotals.reclassAdvance` changes from the literal `0` to `number`. Nothing else in J's types changes. The field list is the one the coding agent implemented: a review is `id`, `docType: 'laborReview'`, `entryId`, `projectId`, `decision: 'deducted'`, `reviewedOn`, `createdBy`, `createdByName`, `createdAtServer`, `deviceId`. `rowState` returns the first match in the §3.3 order.

### 3.6 Functions and signatures (`public/accounts-reclass.js`)

The file is a classic script with the same UMD tail as `public/accounts-statement.js`. Pure functions take their inputs; the screen functions call `get`, `set`, `me`, `uuid`, `today`.

```javascript
const TOKEN_RE = /^L:([A-Za-z0-9_-]{1,64});/;
const DESC_MAX = 500;
const SENTENCE = {
  dependent: 'اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً',
};
const STRINGS = {
  owedHeading: 'سلفة لم تُكتب بعد',
  duplicate: 'سلفة مكررة',
  question: 'هل خُصم هذا المبلغ من عمل المقاول؟',
  listHeading: 'قيود مصروف قد تكون سلفاً',
  cancel: 'ملغى',
  corrected: 'سطر مصحّح',
  archived: 'المشروع مؤرشف، لا يُلغى القيد',
};
```

`token`, `tokenOf`, `misbookedCandidates`, `rowState`, `stillOwedReversal`, `advanceAfterReversal`, `advanceStillOwed`, `coveringAdvances`, `duplicatePlan`, `hasLiveDraw`, `refusedAdvanceIds`, `reclassTotal`, and `reviewDoc` have the signatures in §3.6. `stillOwedReversal` calls `Ledger.makeReversal`, replaces only `description` with the token plus `تصحيح: ` plus the original, cut by code points to `DESC_MAX`, then `Ledger.validateEntry`. `advanceAfterReversal` calls `AccountPayment.cashDoc('advanceLabor', …)` and sets `description` to the token, the original date, and the entry id. `reviewDoc` writes `lrv_` + the entry id, with `createdAtServer: null`, and does not check that the project is active.

Screen state is module-local: `openCancel`, `openAdvance`, `advanceIds`, `partyPick`, `msg`. `install` resets it. `onClick` returns false at once unless the button has a `data-rc-*` attribute. `register` pushes 4 `AccountAction` rows, tab `contractor`. `install` wraps `api.views.accounts`.

### 3.7 UI deltas

The «حسابات» tab paints the first list (`data-rc-list="1"`) with heading `قيود مصروف قد تكون سلفاً` plus ` (N)`. `open` rows come first, then `revRefused`, then `reviewed`. An archived project shows S8 instead of `ملغى` and keeps `انخصم`. The «ملغى» card shows the warning `تنبيه فقط، ولا يمنع تسجيل دفعة`, the preview lines `ملغى` and `سطر مصحّح`, and `سبب التصحيح`. The second list heading is `سلفة لم تُكتب بعد`. A duplicate row shows `سلفة مكررة`, «عكس» on `reverseIds`, and the dependent sentence on `blockedIds`. J's totals card adds `أُعيد تصنيفها` after `المدفوع للمقاولين` only when `reclassAdvance > 0`. The amount is already inside `المدفوع للمقاولين` and is not added again.

An accepted L `rev_` lowers that project's spent for good. The advance does not add it back (`advanceLabor` has `cost: 0`). Company cash out, a test-only figure, is unchanged after both steps (`ameer:13`).

### 3.8 Write paths (`onClick`, the only writer)

| Tap | Precondition | Write |
|---|---|---|
| `انخصم` | `rowState` is `open` | `reviewDoc` → `AccountsView.commitDoc` into `K.laborReviews` |
| `ملغى` | `open`, `canCancel` | none; opens the card |
| `حفظ` on the «ملغى» card | still `open`; reason not blank | `stillOwedReversal` → `commitDoc` into `K.entries` |
| `سلفة` | `owed` | none; mints a uuid and opens the card |
| pill | «سلفة» card open | stores the party id |
| `حفظ` on the «سلفة» card | still `owed`; person picked | `advanceAfterReversal` → `commitDoc` into `K.accountTxns` |
| `عكس` on a duplicate | id in `reverseIds`; reason not blank; owner-picks still has two live advances | `AccountCorrect.reversalDoc` → `commitDoc` into `accountTxns` |

Each write re-runs `rowState` first. A stale card writes nothing.

---

## 4. Rules (`firestore.rules`)

### 4.1 Money documents: no rule change

L writes three kinds of money document, and each is already allowed at `27783e1c`: the ledger `rev_<entryId>` with the token description (`allow create` at `firestore.rules:156`, `reversalOk` :131-147), the `advanceLabor` body (`cashBodyCreate`, :870-892), and `accountTxns/rev_<advanceId>` (`revCreate`, :1083-1111). The «انخصم» record is the only new stored fact. Ledger entries have no update, so the mark cannot live on the row. Deploy is rules and hosting as one pair, rules first, only on Ameer's separate go. Rollback is hosting first, then rules. This plan holds no deploy command.

### 4.2 Emulator tests even with no rule change

The emulator file proves the exact L documents pass and the near misses fail.

### 4.3 Not in L: a fixed advance id

Stays (أ). No `lFor` field and no change to `cashBodyCreate`. Duplicates are caught by `سلفة مكررة` and fixed with «عكس».

### 4.4 The «انخصم» record

#### 4.4.1 Document shape

Collection `laborReviews`, document id `lrv_<entryId>`. Fields: `id`, `entryId`, `projectId`, `decision: 'deducted'`, `reviewedOn` (`YYYY-MM-DD`), `createdBy`, `createdByName`, `createdAtServer` (`request.time`), `deviceId`. Create-only.

#### 4.4.2 New block, after `match /statementApprovals/{id}`

`laborReviewPath` sits with the other path helpers, next to `entryPath`, because `reversalOk` calls it. `reviewCreate` requires `ownerOk`, `headerOk`, the nine keys, `id == 'lrv_' + entryId`, `decision == 'deducted'`, `entryDateOk(reviewedOn)`, a labour expense original with `orig.get('isReversal', false) == false` and `orig.get('foremanId', null) == null`, the same `projectId`, and `!existsAfter(entryPath('rev_' + entryId))`. Read is `accountRead()`. Update and delete are false. No `projectOpen`: «انخصم» is allowed on an archived project (`ameer:32`).

#### 4.4.3 One guard added to `reversalOk()`

The clause refuses an L reversal whose description, split on `;`, starts with `L:` plus `reversesEntryId`, when `existsAfter(laborReviewPath('lrv_' + reversesEntryId))` is true. An ordinary reversal with no token is not blocked.

#### 4.4.4 Client touch points

`usesPutIfMissing` includes `laborReviews`. `collectionFor` and `toRemote` know `laborReview`. `LABOR_REVIEW_REMOTE` is the nine fields and drops `docType`. Pull, merge, adopt, project removal, and `accountReads` include the collection. `accountSame` compares `id`, `entryId`, `projectId`, and `decision` only, so a second owner adopts the server copy instead of showing `رُفض الإرسال`. `sameContent` treats `laborReview` as an account doc. The found path calls `adoptServer` for that doc type.

#### 4.4.5 Emulator tests

E10 through E23, including the batch deny (E18), the id boundary (E21), the exact `L:e80` description (E22), and the legacy shape (E23). The `existsAfter` pin at `tests/emulator/account-rules.test.js` counts 7 after `ownerOk` and 9 file-wide, and asserts one `existsAfter(entryPath('rev_'` inside `reviewCreate` and one `existsAfter(laborReviewPath(` inside `reversalOk`. Rule mutants RM1, RM2, RM3, RM4, RM5a, RM5b, and RM5 are one-line edits, run locally, and never committed. RM5a and RM5b are killed by the pin. RM5 is killed by E18.

---

## 5. Named exceptions

E-L1 edits `accounts-statement.js` for `reclassAdvance`. E-L2 does not write `K.refusedLinks`. E-L3 matches the token with `startsWith`. E-L4 changes the two person-page labels. E-L5 treats a number `createdAtServer` as acceptance for the reversal as well as the advance. E-L6 adds the `laborReviews` sync wiring and the rules block. E-L7 puts the card at the end of «حسابات», owner only, with no `costOpen()` gate and no `act-` button.

---

## 6. Strings

Reused, already in the code: `سلفة`, `سبب التصحيح`, `حفظ`, `رُفض الإرسال`, `عكس`, `تاريخ القيد`, `تنبيه فقط، ولا يمنع تسجيل دفعة`, ` د.ع`, `المبلغ ليس عدداً صحيحاً`, and `اعكس الاسترداد أو الإرجاع أو التسوية أو الخصم المرتبط أولاً`.

Approved by Ameer, and the only new Arabic: `انخصم`, `مجموع العمل المعتمد`, `مجموع المدفوع للعمل`, `أُعيد تصنيفها`, and S2-S8 in the `STRINGS` object (`سلفة لم تُكتب بعد`, `سلفة مكررة`, `هل خُصم هذا المبلغ من عمل المقاول؟`, `قيود مصروف قد تكون سلفاً`, `ملغى`, `سطر مصحّح`, `المشروع مؤرشف، لا يُلغى القيد`). Nothing is pending (`ameer:33`).

---

## 7. Test plan

Unit tests U1-U33 and U35-U37 live in `tests/accounts-reclass.test.js`. U34 lives in `tests/sync-status.test.js`. Browser checks B1-B4 live in `tests/browser-check.js`. Emulator tests E1-E23 live in `tests/emulator/account-reclass.test.js`. The floor is 294. The verify drive id is `reclass`. Mutants M1-M55, M9b, M41b, M50b, and M51b, plus RM1-RM5, RM5a, and RM5b, are run one at a time and reverted.

---

## 8. PR shape and order

One draft PR from `cursor/contractor-slice-l` to main `27783e1c`. Commit order: rules and E10-E23, sync wiring and U34, the classifier and the screen, the J seam, the L5 labels, E1-E9, then the shell pins and this plan. No amend, no force-push, no push to main. Merge only on Ameer's go naming the head SHA. Deploy is a separate go.

---

## 9. Hard constraints

`CONTRACTOR_COST_START` stays `null`. `firestore.rules` changes only as §4.4.2-4.4.3. No CSV change. No `.cursor/rules/pstack-models.mdc` edit. Service worker `aj-p0-v83`. Append-only. No deploy command in this file.

---

## 10. Revert and blast radius

`git revert` removes the script, the tests, the seam, the labels, the sync wiring, and the rule block. Documents already written stay. A rules revert deploys with the hosting revert, hosting first. J's D4 test does not load L and stays green.

---

## 11. Risks

R1 two phones can each write an advance; `سلفة مكررة` covers it. R2 an ordinary reversal wins the race and L offers no `سلفة`. R3 the spent drop is permanent (`ameer:13`). R4 offline `انخصم` against offline `ملغى` is settled by `existsAfter`; `bothFacts` offers no `سلفة`. R5 the advance is unreviewed until the contractor screens open. R6 the JS cut follows Firestore `size()`, which counts UTF-16 units (E9). R10 an ordinary reversal of a reviewed row stays allowed. R13 an owner doc with no `active` field sees the card and every write is refused. R14 a legacy row with no boolean `isReversal`, or with a `foremanId` key, can be marked and cannot be cancelled.

---

## 12. Ameer's decisions

`ameer:10` through `ameer:15` (16:18) and `ameer:30` through `ameer:33` (16:51). No Ameer question is pending. The fixed advance id stays (أ).

---

## 13. The accountant's advice

Advice only. The reversal comes first, then one advance for the same amount (`م١`). Cash out is unchanged and cost and balance move by the same amount (`م٢`). The advance is dated today (`م٣`). The mark is on the server (`م٤`). The owner picks across persons (`م٥`). Archived rows stay, without `ملغى` (`م٦`). The r2 file agrees (`acct2:4`, `acct2:5`, `acct2:6`).

---

## 14. Questions for the Architect

AQ1-AQ13 are answered. No question is open. AQ12: `canCancel: false` for the legacy shape, and the count is dropped. AQ13: `bothFacts` shows both facts and offers nothing.

---

## 15. Items in the gj sketch that block or change L

G1 through G11 are closed. «روجع» is «انخصم». The card is on «حسابات». Duplicates across persons are the owner's pick.

---

## 16. pstack

`architect` for the two shapes and the one classifier. Arena was not run.

---

## 17. Changelog

r1 chose shape A and no rules change. r2 moved the mark to the server, added the draw guard, and recorded `ameer:10`-`ameer:15`. r3 added `existsAfter` on both sides, `bothFacts`, and the `sync-status.js` twin. r4 recorded `ameer:30`-`ameer:33` and moved S2-S8 into `STRINGS`. r5 names the `existsAfter` pin (7 after `ownerOk`, 9 file-wide), splits RM5 into RM5a, RM5b, and RM5, and cites `AMEER-answers-L.md` as `6dedd9d4…`.

