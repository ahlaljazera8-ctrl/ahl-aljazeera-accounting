# PLAN r3: comma fix for #cw-qty, #cw-days, and #cw-per

This is a plan. It has no code, no branch, no PR, no cloud agent, and no deploy.

- **r3 is built on r2:** `/workspace/tmp/cost-start/PLAN-comma-fix-r2.md`, sha256 `5c2f0f3eadd0727cbc5683f6d4323d9a60072300320792d75471498f2ceb2c08`, 404 lines. r2 is unchanged. The changelog at the end maps r2 → r3.
- **Architect review of r2:** `/workspace/tmp/cost-start/REVIEW-plan-comma-fix-r2-5c2f0f3e.md`, sha256 `c1c5ebfa8b05ee7fcb46f3b5409c3aa4fc5771e7be4bea5408ba060d032bb84f`, verdict NOTES (one MEDIUM, three LOW). Verified by sha256sum before this file was written.
- **Base:** main `300d5eb72943bf4b3e64d2300603dd62891a364b` (ahlaljazera8-ctrl/ahl-aljazeera-accounting). Read-only checkout `/workspace/deploy-300d`; `git rev-parse HEAD` matched that SHA and `git status` was clean.
- **Ameer's answers** are cited from `/workspace/tmp/slice-l-plan/AMEER-answers-L.md` (sha256 `3cfa3fb1f5f7b9d1cc39368777c7e8e16803b1aeec1ed588bb2ca19efd8e96e4`, 45 lines, read for this r3). Lines `:38` and `:39` are **EA-relayed**. The plan-start go is filed as **01:26**, not 01:25 (review LOW-1). Lines `:44` and `:45` (09:19 card) are the byte-exact wording OK and the zero / over-cap answer (review MEDIUM-1 and LOW-3). Quoted in §2.
- **Line numbers** in the repo were read at `300d5eb`. A later code PR reads them again at its own base.
- This revision is still plan only. Code starts only after the Architect CONFIRMS this (or a later) revision and Ameer gives a code-start go.

## 1. Summary

`digits()` in `public/accounts-work.js:136-141` strips every ASCII comma, so «2,5» typed in `#cw-qty`, `#cw-days`, or `#cw-per` is stored as `25`. The fix stops that, on all three fields, with the same rules.

After the fix, `digits()` reuses the already-exported `AccountPayment.plainAmount` (`public/accounts-payment.js:187-193`), which folds digits with `foldAmountDigits` (`:174-181`) and then accepts only a plain integer or a **strict** thousands group via `groupedDigits` (`:125-129`). It does **not** call `regroupedDigits` / `groupThousands`, so a long mis-group is not rewritten.

So: `25`, `1,000`, `8,000`, `1,000,000`, and Arabic-Indic whole numbers (with or without a legal group) are accepted; `2,5`, `1,50000`, `1,00`, and `,100` are refused. Every failed parse, a quantity of `0`, and a quantity over the cap paint the Ameer-approved sentence «الكمية لازم رقم صحيح بدون كسور، مثل 25 أو 1,000». That sentence **replaces** the old `SENTENCE.range` «المبلغ ليس عدداً صحيحاً» behaviour on these three qty boxes. Hosting only, service-worker cache `aj-p0-v83` → `aj-p0-v84`. No `firestore.rules` change, no CSV change, and `CONTRACTOR_COST_START` stays `null`.

The date PR is a separate slice. It takes `aj-p0-v85`. It is cut from main only after this fix is merged and live, or it ships in the same hosting release as this fix; never before. See §8.

This is still the refuse-«2,5»-as-25 safety fix. It is **not** the deferred M3 decimal plan («2,5» stored as `2.5`). A note for that future plan is in §2.1.

## 2. Ameer's answers (cited from AMEER-answers-L.md)

### 2.0 Plan-start go and the 01:45 answers (EA-relayed)

From `/workspace/tmp/slice-l-plan/AMEER-answers-L.md`, quoted here as read:

`:38` (EA-relayed; the plan-start go is filed as **01:26**, not 01:25):

```
2026-11-26 01:26 «إي، ابدوا بعدّ الصفوف وخطة تصليح الفارزة»
```

`:39` (EA-relayed, 01:45):

```
2026-11-26 01:45 comma-fix: «نقبل فارزة الآلاف مثل 1,000 بس» / «جملة جديدة تشرح شنو يكتب بالكمية» / «نقبل الأرقام العربية هسه وية التصليح»
```

`:39` is the source of Q1, of the request for a new sentence (not yet the wording), and of Q3. The exact sentence and the zero / over-cap rule are `:44`–`:45` below.

### 2.1 Q1 — thousands groups (r1 MEDIUM-1, closed in r2)

> «نقبل فارزة الآلاف مثل 1,000 بس»

**Accept strict thousands grouping only.** `1,000`, `8,000`, and `1,000,000` are accepted (as `1000`, `8000`, `1000000`). `2,5` and `1,50000` are refused, and so are other bad groupings such as `1,00` and `,100`.

`#cw-per` is «لكل كم» (`accounts-work.js:915`). `unitPrice` is `rate / unitQty` (`accounts.js:124-126`). A rate "per 1,000" and a quantity like `8,000` are real typings; today they already save as `1000` and `8000` because of the strip. After this fix they stay accepted, but only when the group is strict.

**Note for the future M3 plan:** three digits after a comma stay thousands, so `2,500` = `2500`. Under a later rule «2,5 → 2.5», `2,500` would be ambiguous. M3 must keep this 3-digit group as thousands, not as a decimal. This slice does not start M3.

### 2.2 Q2 — refusal sentence (r2 MEDIUM-1 / r1 MEDIUM-2, closed here)

`:39` asked only for «جملة جديدة تشرح شنو يكتب بالكمية». That is a request for a new sentence, not the wording. r2 §2.2 claimed the wording was already approved; the r2 review correctly said that was not supported, and pointed at the L precedent of a byte-for-byte OK (`AMEER-answers-L.md:33`).

The wording OK is now filed at `:44` (09:19 card), quoted as read:

```
2026-11-26 09:19 card: الجملة «الكمية لازم رقم صحيح بدون كسور، مثل 25 أو 1,000» — «موافق على الجملة مثل ما هي بالحرف»
```

**The refusal sentence is exactly** «الكمية لازم رقم صحيح بدون كسور، مثل 25 أو 1,000», approved «مثل ما هي بالحرف». The text contains «،» (U+060C) as Arabic punctuation in the sentence, and ASCII `1,000` (U+002C) as the example, which matches the accepted input (r2 review MEDIUM-1).

It is added to the `SENTENCE` table in `public/accounts-work.js:38-50`, as a new key `qty`, immediately after `range` (`:43`). A test pins the exact string in the source and on the painted path (§6.3).

`:45` (09:19 card), quoted as read:

```
2026-11-26 09:19 card: الصفر وفوق الحد — «إي، الصفر واللي فوق الحد تطلع نفس الجملة»
```

**A quantity of 0, and a quantity over the cap, paint the same `SENTENCE.qty` sentence.** This **replaces** the old `SENTENCE.range` «المبلغ ليس عدداً صحيحاً» behaviour on the three qty boxes (`#cw-per`, `#cw-qty`, `#cw-days`): a failed parse (`digits()` returns `null`), a `0`, and a value above the cap all show «الكمية لازم رقم صحيح بدون كسور، مثل 25 أو 1,000». r2 had kept `SENTENCE.range` for `0` and over-cap (r2 review LOW-3); that split is dropped.

`SENTENCE.range` is **kept** for the non-qty paths that already use it: `agreementDoc` `unitRate` / `unitName` / `dayRate` (`accounts-work.js:254-257`, `:262`), and the programmatic `laborQtyDoc` / `workDoc` builders (`:373`). Those are not the typed qty boxes. The same Arabic amount string also remains on `lump`, `milestone`, `amount`, `overflow`, and `inexact` (`:41-46`).

### 2.3 Q3 — Arabic-Indic digits (r1 LOW-4, closed in r2)

> «نقبل الأرقام العربية هسه وية التصليح»

**Accept Arabic-Indic digits (٠-٩) for whole numbers now,** including with strict grouping. The Arabic decimal mark «٫» (U+066B) stays refused.

Integer Arabic-Indic digits need no `firestore.rules` change (`qtyOk` at `:501-503` is still an int). When the date later goes live, site phones with an Arabic keyboard may type `٢٥`; this slice accepts that as `25`.

### 2.4 The two Arabic marks, now decided (r2 review, "The engineer's open points")

The r2 review agrees with both choices. They are decided here, not minor notes, and need no further Ameer question.

**(a) Refuse «،» (U+060C) even as a thousands mark: agreed.** Quoted from the review: both money parsers refuse it at 300d5eb (`1،000` → refused), so refusing keeps the quantity boxes consistent; «،» is ordinary Arabic punctuation and is ambiguous with a decimal (`2،5`); Ameer's «…مثل 1,000 بس» supports accepting nothing else; the «،»-as-group mutant is killed. So `2،5` and `1،000` are refused.

**(b) Accept «٬» (U+066C) as a group separator: agreed.** Quoted from the review: it is the proper Arabic thousands mark; both money parsers already accept `١٬٠٠٠` = 1000, while `٢٬٥` is still refused (strict group); Arabic numeric keypads offer «٬» and «٫»; accepting the first and refusing the second is exactly Ameer's Q1 and Q3. So `١٬٠٠٠` is `1000`.

How the fold applies these marks is in §4.1.

## 3. Current code (quoted at 300d5eb)

### 3.1 The helper that is wrong today

`public/accounts-work.js:132-141`:

```
  /**
   * @param {string} raw
   * @returns {number | null}
   */
  function digits(raw) {
    const text = String(raw || '').trim().replace(/,/g, '');
    if (!/^\d+$/.test(text)) return null;
    const n = Number(text);
    return Number.isSafeInteger(n) ? n : null;
  }
```

`replace(/,/g, '')` is the bug. `/^\d+$/` (no `u` flag) is ASCII `0-9` only, so Arabic-Indic digits are refused today. The Arabic comma «،» (U+060C), the Arabic decimal «٫» (U+066B), the Arabic thousands mark «٬» (U+066C), and an ASCII period in «2.5» are not stripped, so those strings already return `null`. Only the ASCII comma is swallowed: «2,5», «25,», and «1,000» become `25` / `25` / `1000`.

`digits` is not exported from `AccountWork` (`:1005-1016`). It stays unexported.

### 3.2 Every caller of this `digits()` (only two; same rules)

| Call | File:line | Field | What it stores |
|---|---|---|---|
| `unitQty: digits(field('cw-per'))` | `accounts-work.js:498` | `#cw-per` («لكل كم»), unit agreement form | `agreement.unitQty` (cap `1`..`1000000` at `:254`) |
| `const qty = digits(field('cw-qty') || field('cw-days'))` | `accounts-work.js:524` | `#cw-qty` («كمية منجزة») or `#cw-days` («أيام معتمدة») | `laborQty` `qty` / `approvedQty` (cap `1`..`100000000` at `:525`) |

Fields are painted at `:915` (`#cw-per`), `:968` (`#cw-qty`), and `:970` (`#cw-days`). There is no third caller in `accounts-work.js`. Both callers get the same new rules. Money fields on the same form do **not** use this helper; they go through `plainField` (`:147-151`) → `AccountPayment.plainAmount`:

- `:496` `#cw-lump` → `lumpAmount`
- `:497` `#cw-rate` → `unitRate`
- `:500` `#cw-day` → `dayRate`
- `:501` `#cw-mile` → `milestoneAmount`

### 3.3 The other `digits()` and the helpers this slice reuses (must not change their money behaviour)

`public/accounts-payment.js:255-257` is a different, local function that already returns `plainAmount(raw)`. Callers: `:651` `#cp-amount`, `:707` `#cp-return` / `#cp-refund`, `:940` draft split, `:949` pointer preview. This plan does not edit `accounts-payment.js`.

The existing parse path, already used by money fields:

- `foldAmountDigits` (`accounts-payment.js:174-181`): trim; fold `٠-٩` (U+0660) and `۰-۹` (U+06F0) to ASCII digits; fold «٬» (U+066C) to `','`; fold «٫» (U+066B) to `'.'`. Same fold as `L.parseAmount` (`ledger.js:166-183`). Comment at `:171` says so.
- `groupedDigits` (`:125-129`): accept `/^\d+$/`, or a strict group `/^\d{1,3}(,\d{3})+$/` with the commas then stripped; anything else (including `2,5`, `1,50000`, `1,00`, `,100`) returns `null`.
- `plainAmount` (`:187-193`): `groupedDigits(foldAmountDigits(raw))`, then `Number.isSafeInteger`. Already exported (`:1193-1194`).
- `regroupedDigits` (`:137-145`) and `groupThousands` (`:156-167`) rewrite a long mis-group such as `1,50000` to `150,000` for **display** only. `plainAmount('1,50000')` is already `null` (`tests/accounts-payment.test.js:1272`). This slice must not use the regrouping path.

The Architect's reviews confirmed these other normalisers are unaffected: `L.parseAmount`, `plainAmount`, and `qtyOf` (`accounts-correct.js:978-984`, used at `:1087` for `#cc-sup-qty`). `#cc-sup-qty` is out of this slice. It still refuses Arabic-Indic digits; note that for consistency later (r2 review INFO).

### 3.4 Thousand-separators workstream (listener still does not touch these fields)

Workstream `accounts-app-thousand-separators`, sketch `docs/plans/amount-thousand-separators-sketch.md` (read at this SHA). `#cw-qty`, `#cw-days`, and `#cw-per` were left on `digits` on purpose and are not in `AMOUNT_FIELD_IDS` (`accounts-payment.js:976-990`). The shared listener comment at `:976` is «Ids the shared listener groups. #cw-qty, #cw-days, and #cw-per stay out.» Test `tests/accounts-payment.test.js:1678-1681` asserts the three ids are absent. `tests/browser-check.js:19` lists them in `NON_AMOUNT_IDS`. This slice does not add them to the listener: the boxes are not auto-grouped while typing. The user may type `1000` or `1,000`; both save as `1000`.

The sketch's line that «`2,5` stays `25`» becomes historical; this plan is the record of the refuse-to-save change. The old sketches are not edited in the code PR.

### 3.5 Why there is no live data risk today (Architect, verified)

`CONTRACTOR_COST_START` has been `null` on main since #71. `saveAgreement` (`:487`) and `saveMeasure` (`:522`) return early when `!costOpen()`. `digits()` runs only at tap time. Queued docs are already integers, and rules `qtyOk` is unchanged. A quantity will feed `approveLabor` amount, which is cost, once the date is live — that is why this fix ships before or with the date PR (§8). J, L, and the cap read stored integers and are unaffected.

## 4. Proposed change

### 4.1 `digits()` (chosen)

Replace the body of `digits()` so it reuses `AccountPayment.plainAmount`. Same name, same signature `(raw: string) => number | null`, same two callers. Proposed `public/accounts-work.js:132-141`:

```
  /**
   * Whole number for quantity, days, or unit count. Reuses plainAmount:
   * Arabic-Indic digits are folded, a strict thousands group is kept,
   * and a short or irregular comma is refused.
   * @param {string} raw
   * @returns {number | null}
   */
  function digits(raw) {
    const host = /** @type {typeof globalThis & { AccountPayment?: { plainAmount?: (value: string) => number | null } }} */ (globalThis);
    if (typeof host.AccountPayment === 'undefined' || !host.AccountPayment || typeof host.AccountPayment.plainAmount !== 'function') return null;
    return host.AccountPayment.plainAmount(raw);
  }
```

The guard matches `plainField` (`:147-151`). `digits()` runs at tap time, after `accounts-payment.js` has loaded. Script order is `public/index.html:73-74` (`accounts-work.js` then `accounts-payment.js`; the r2 review cites these lines). The work unit tests already do `g.AccountPayment = require('../public/accounts-payment.js')` at `tests/accounts-work.test.js:87`. If the payment script is missing, `digits` returns `null` and nothing is stored as `25`.

**Not chosen:** copying a second fold into `accounts-work.js`. **Not chosen:** `L.parseAmount`, which also applies the IQD ceiling and amount error strings. **Not chosen:** `groupThousands` / `regroupedDigits`, which would turn `1,50000` into `150000`. **Not chosen:** adding the three ids to `AMOUNT_FIELD_IDS`.

**Fold and mark choices** (reuse of `foldAmountDigits`, then `groupedDigits`):

| Input feature | Choice | Why |
|---|---|---|
| ASCII digits, `25` / `8000` | accept | already accepted |
| Strict group `1,000`, `8,000`, `1,000,000` | accept | Ameer Q1, `:39` |
| Short or irregular group `2,5`, `1,50000`, `1,00`, `,100` | refuse | Ameer Q1, `:39` |
| Strict 3-digit group `2,500` | accept as `2500` | consequence of Q1; note for M3 |
| Arabic-Indic `٢٥`, `١,٠٠٠` | accept (`25`, `1000`) | Ameer Q3, `:39`; the helper folds then applies the same group rule |
| Persian / Eastern digits `۰-۹` | accept, same fold | the existing helper already folds them, as money fields do; no second fold |
| Arabic thousands mark «٬» (U+066C), e.g. `١٬٠٠٠` | **accept** as a group separator | decided, r2 review (b): the helper maps it to `','`; `١٬٠٠٠` is a strict group; `٢٬٥` becomes `2,5` and is refused |
| Arabic decimal «٫» (U+066B), e.g. `2٫5` | **refuse** | Ameer Q3; the helper maps it to `'.'`, then `groupedDigits` returns `null` |
| Arabic comma «،» (U+060C), e.g. `2،5` or `1،000` | **refuse** | decided, r2 review (a): conservative, and consistent with both money parsers |
| ASCII period `2.5` | refuse | already `null` today; not M3 |

### 4.2 New sentence and when it paints

In `SENTENCE` (`accounts-work.js:38-50`), add:

```
    qty: 'الكمية لازم رقم صحيح بدون كسور، مثل 25 أو 1,000',
```

immediately after `range` (`:43`). No other new Arabic string. Wording is byte-exact per `:44`.

**`saveMeasure` (`:524-528`).** Today any failed or out-of-range qty does `screen.msg = sentence(['range']); return;` at `:526`. Replace that with two branches, both painting `SENTENCE.qty`:

```
    if (needsQty && qty == null) {
      screen.msg = sentence(['qty']);
      return;
    }
    if (needsQty && qty != null && (qty < 1 || qty > 100000000)) {
      screen.msg = sentence(['qty']);
      return;
    }
```

The `qty != null` guard is required (r2 review LOW-2). Written as `if (needsQty && (qty < 1 || qty > 100000000))` after the null branch, strict checkJs reports TS18047 "'qty' is possibly 'null'" and `tests/strict-accounts-work.test.js:8` goes red. `needsQty && qty != null && (…)` is green, which the Architect proved. Even though both branches now paint the same sentence (`:45`), the guard stays.

**`saveAgreement` (`:486-516`).** Today a null or out-of-range `unitQty` fails `intBetween` at `:254` and paints `sentence(['range'])` via `:506-507`. For `screen.method === 'unit'`, intercept before that path:

```
    const unitQty = digits(field('cw-per'));
    if (screen.method === 'unit' && unitQty == null) {
      screen.msg = sentence(['qty']);
      /* same disable / render as the existing error path, no commit */
      return;
    }
    if (screen.method === 'unit' && unitQty != null && (unitQty < 1 || unitQty > 1000000)) {
      screen.msg = sentence(['qty']);
      return;
    }
```

The same `!= null` guard is used, with the `#cw-per` cap `1`..`1000000`. Lump, daily, and milestone do not read `#cw-per`. `unitRate`, `unitName`, and `dayRate` still go through `agreementDoc` and may still paint `SENTENCE.range`.

`agreementDoc` and `laborQtyDoc` / `workDoc` keep their current `['range']` (and `['overflow']` where they already do) for programmatic callers. The UI tests at `tests/accounts-work.test.js:1030` and `:471-504` stay on those error codes. The new sentence is the typed-field path on `#cw-per`, `#cw-qty`, and `#cw-days`.

### 4.3 Service worker

`public/sw.js:2` `const VERSION = 'aj-p0-v83';` → `const VERSION = 'aj-p0-v84';`. `ASSETS` (`:3`) and `SHELL` (`:5`) are unchanged.

Pins that must follow:

- `tests/shell-cache.test.js:44`, `:67`, `:113` — `assert.match(sw, /const VERSION = 'aj-p0-v83'/)` → `aj-p0-v84`
- `tests/webkit-upgrade.test.js:19` — `const MARK = 'aj-p0-v83';` → `aj-p0-v84`

CI job `lint, format, types` runs `scripts/sw-version-guard.sh` against the PR base, so the bump is required. The Architect confirmed this pin list is complete. The date PR, later, takes `aj-p0-v85` (§8).

### 4.4 Files (code PR, after a code-start go)

| File | Change |
|---|---|
| `public/accounts-work.js` | `digits()` as in §4.1; `SENTENCE.qty` as in §4.2; `saveMeasure` / `saveAgreement` paint paths, including the `qty != null` guard |
| `public/sw.js` | `VERSION` line 2, `v83` → `v84` |
| `tests/accounts-work.test.js` | flip the existing `:1200-1207` tail; field matrix; new-string pin; update empty-qty message asserts at `:1021` and `:1040`; add `0` and over-cap UI asserts for the three boxes |
| `tests/shell-cache.test.js` | three `VERSION` pins → `v84` |
| `tests/webkit-upgrade.test.js` | `MARK` → `v84` |
| `docs/plans/comma-fix-plan.md` | this plan (the Architect-confirmed revision) is committed here in the code PR |
| `docs/PSTACK_INVENTORY.md` | new section, exactly the text in §7; evidence links only; status words on existing rows stay |

**Do not edit:** `firestore.rules`, `public/accounts.js` (`const CONTRACTOR_COST_START = null;` stays), any CSV path, `public/accounts-payment.js` (reuse `plainAmount` as already exported; no new export), `public/accounts-correct.js`, `tests/browser-check.js` (the three ids already sit in `NON_AMOUNT_IDS`), or the old sketches under `docs/plans/` (`amount-thousand-separators-sketch.md` and earlier slice sketches).

## 5. Functions

| Function | File | Current | Proposed |
|---|---|---|---|
| `digits(raw: string) => number \| null` | `accounts-work.js:136-141` | `trim`, strip `,`, then `/^\d+$/` and `Number.isSafeInteger` | `AccountPayment.plainAmount(raw)` (fold + strict group). `null` if the helper is missing. Same rules on both callers (`:498` and `:524`). |
| `plainField(id)` | `:147-151` | `AccountPayment.plainAmount(field(id))` | unchanged |
| `plainAmount` / `foldAmountDigits` / `groupedDigits` | `accounts-payment.js:187`, `:174`, `:125` | money parse | unchanged; `digits()` now calls `plainAmount` |
| `saveAgreement` | `:486-516` | `:498` `digits(field('cw-per'))`; parse or cap failure paints `range` | same call; on a unit form, `null`, `0`, or over `1000000` paints `SENTENCE.qty` (with the `unitQty != null` guard) and does not commit; `unitRate` / `unitName` cap failures still `range` |
| `saveMeasure` | `:521-556` | `:524` `digits(field('cw-qty') \|\| field('cw-days'))`; any bad qty paints `range` at `:526` | same call; `null`, `0`, or over `100000000` paints `SENTENCE.qty`; the second branch is `needsQty && qty != null && (qty < 1 \|\| qty > 100000000)` |
| `agreementDoc` / `laborQtyDoc` | `:225`, `:450` | integer caps, `['range']` / `['overflow']` | unchanged for programmatic callers |
| `AccountPayment.digits` / `groupThousands` / `AMOUNT_FIELD_IDS` | `accounts-payment.js` | money grouping | unchanged |
| `qtyOf` | `accounts-correct.js:978` | trim + `/^\d+$/` only (no fold, no group) | unchanged, out of scope |
| `SENTENCE` | `accounts-work.js:38-50` | no `qty` key; `range` at `:43` is «المبلغ ليس عدداً صحيحاً» | add `qty` with Ameer's exact sentence; keep `range` for the non-qty paths in §2.2 |

## 6. Tests

Runner: `npm test` is `node --test` with the file list in `package.json` `scripts.test`. New cases go in `tests/accounts-work.test.js`, already on that list. No new test file, no emulator file (nothing reaches Firestore; no rules change).

CI has **four** checks in `.github/workflows/ci.yml`:

1. `lint, format, types` — `sw-version-guard.sh`, `npm run lint`, `format:check`, `typecheck` (this last includes `tests/strict-accounts-work.test.js`, which LOW-2 keeps green)
2. `ledger tests` — the `npm test` / `node --test` list, including `tests/accounts-work.test.js`
3. `browser checks` — `npm run test:browser` (`tests/browser-check.js`)
4. `emulator rules and sync` — `npm run test:emulator` (includes `tests/webkit-upgrade.test.js`, which pins `MARK`)

A green head is 4/4. Local proof before the PR is at least `npx prettier --check` on the touched files, `npx eslint` on them, `npx tsc --noEmit -p tsconfig.strict-accounts-work.json`, and `node --test tests/accounts-work.test.js tests/shell-cache.test.js`.

`oldDigits` remains dropped. The behavioural matrix, the flipped tail, and the `0` / over-cap UI asserts kill the regression.

The Architect's r2 probe matrix (18 inputs × 3 boxes) is the coverage bar. Cases it named that were not already in r2 are included below (`10,00,000`, `100,`, `1 000`, empty, spaces only, trimmed `25`).

### 6.1 Killer: flip the test that records the old bug

`tests/accounts-work.test.js:1135` `IQD agreement fields group and refuse 2,5` already proves money fields refuse `2,5` and store `1,50000` as `150000`. Keep that loop unchanged.

The tail is `:1200-1207`, quoted at 300d5eb:

```
1200|    begin('unit');
1201|    setFields({ 'cw-desc': 'لكل', 'cw-rate': '1000', 'cw-per': '2,5', 'cw-unit': 'طوبة' });
1202|    group('cw-rate');
1203|    UI.onClick(/** @type {any} */ ({ id: 'act-new-agreement', disabled: false, dataset: {} }));
1204|    const per = store.agreements[store.agreements.length - 1];
1205|    assert.equal(per.unitRate, 1000);
1206|    assert.equal(per.unitQty, 25);
1207|  });
```

**Flip it.** After the click: `store.agreements.length` is unchanged, no row has `unitQty === 25`, and the painted HTML includes the new sentence «الكمية لازم رقم صحيح بدون كسور، مثل 25 أو 1,000» (and does not show «المبلغ ليس عدداً صحيحاً» on this path). `unitRate` is not written because the agreement is not saved. Restoring `.replace(/,/g, '')` makes `unitQty` `25` and this assert fails. That is the killer.

### 6.2 Field matrix (same rules on all three fields)

Drive the existing UI harness (`withStart`, `install`, `setFields`, `UI.onClick`), not an exported `digits`.

- **`#cw-qty`** — a unit agreement already in the store (same setup as `:933-941`), button `act-labor-qty`.
- **`#cw-days`** — a daily agreement (`method: 'daily'`, `dayRate` set; same shape as `:413`), same button, field id `cw-days`.
- **`#cw-per`** — the unit agreement form (the flipped tail, plus the accept cases).

**Accepted** — a new row is stored with the number shown; no refuse sentence:

| Input | Stored |
|---|---|
| `'25'` | `25` |
| `'  25  '` (leading / trailing spaces) | `25` (`plainAmount` trims) |
| `'8000'` (qty / days) or `'4000'` (per, already used at `:924`) | as typed |
| `'1,000'` | `1000` |
| `'8,000'` | `8000` |
| `'1,000,000'` | `1000000` (at the `unitQty` cap for `#cw-per`; legal for qty/days) |
| `'2,500'` | `2500` (strict thousands; the M3 note) |
| `'٢٥'` (U+0662 U+0665) | `25` |
| `'١,٠٠٠'` | `1000` (Arabic-Indic with ASCII group commas) |
| `'١٬٠٠٠'` (U+066C) | `1000` (Arabic-Indic with the Arabic thousands mark) |

**Refused** — no new row; stored value is not the stripped form; the new `SENTENCE.qty` sentence is painted, and «المبلغ ليس عدداً صحيحاً» is not used on this path:

| Input | Why |
|---|---|
| `'2,5'` (U+002C) | short group; the original bug |
| `'1,50000'` | irregular group; not rewritten to `150000` |
| `'1,00'` | short group |
| `'10,00,000'` | loose group; not rewritten to `1000000` |
| `',100'` | leading comma |
| `'100,'` | trailing comma |
| `'1 000'` | space is not a group mark |
| `''` and spaces only | failed parse |
| `'2.5'` | ASCII period; stay refused, not M3 |
| `'2٫5'` (U+066B) | Arabic decimal mark; Ameer Q3 |
| `'2،5'` (U+060C) | Arabic comma; decided (a) |
| `'1،000'` (U+060C) | Arabic comma is not a group separator; decided (a) |
| `'0'` | Ameer `:45`; same sentence; no row |
| `'100000001'` on `#cw-qty` / `#cw-days` | over the measure cap `100000000`; same sentence; no row |
| `'1000001'` on `#cw-per` | over the `unitQty` cap `1000000`; same sentence; no row |

A valid larger ASCII integer still saves (reuse `'8000'` on `#cw-qty` as in `:1032`).

### 6.3 Pin the new sentence, and flip the existing qty UI asserts

In `tests/accounts-work.test.js`:

- Read `public/accounts-work.js` and assert it contains the exact string `الكمية لازم رقم صحيح بدون كسور، مثل 25 أو 1,000` (this pin may sit next to the source-null test style of `:1100-1104`, without weakening that test).
- On a refused «2,5» save of `#cw-qty` and of `#cw-per`, the painted HTML includes that exact string and does not include «المبلغ ليس عدداً صحيحاً».
- On `'0'` and on an over-cap value, for each of the three boxes, the same: no new row, the new sentence is painted, the old amount sentence is not.

**Update the empty-qty UI asserts** that currently expect the range sentence for qty (review LOW-3). Quoted at 300d5eb:

```
1021|    assert.equal(view.views.contractor(id).includes('المبلغ ليس عدداً صحيحاً'), true);
1040|    assert.equal(view.views.contractor(id).includes('المبلغ ليس عدداً صحيحاً'), true);
```

Both become includes of «الكمية لازم رقم صحيح بدون كسور، مثل 25 أو 1,000» (and not of «المبلغ ليس عدداً صحيحاً»).

**Keep** the programmatic builder asserts that use the `range` / `overflow` **error codes**, not the painted qty sentence:

- `:1030` `assert.deepEqual(missing.errors, ['range']);` — `laborQtyDoc` with no qty, not the typed-field path.
- `:471-504` `a uuid body on a lump agreement is method, and bad quantities are range or overflow` — `laborQtyDoc` / `approveLaborDoc` builders. Leave them on `['range']` / `['overflow']`.

`SENTENCE.range` remains in the table and stays in use for `unitRate`, `unitName`, and `dayRate` as in §2.2 and §4.2. Do not delete the key, and do not retarget those paths to `SENTENCE.qty`.

### 6.4 Money fields unaffected

Do not weaken `:1135`. After the `digits()` edit, the four IQD agreement fields still regroup `1,50000` → `150,000` and store `150000`, and still refuse `2,5` without writing a row. Leave `tests/accounts-payment.test.js:1261-1292` and `:1678-1681` untouched; they already lock `plainAmount('2,5') === null`, `plainAmount('1,50000') === null`, `plainAmount('100,000') === 100000`, Arabic-Indic money folding, and the three qty ids staying out of `amountFieldIds`. The r2 review re-ran `parseAmount` and `plainAmount` at 300d5eb; the quantity boxes now match those amount results, while the money files themselves are not edited.

### 6.5 `CONTRACTOR_COST_START` stays null

The null asserts, quoted at 300d5eb, are:

```
734|  assert.equal(Accounts.CONTRACTOR_COST_START, null);
765|  assert.equal(Accounts.CONTRACTOR_COST_START, null);
790|  assert.equal(Accounts.CONTRACTOR_COST_START, null);
928|  assert.equal(Accounts.CONTRACTOR_COST_START, null);
1097|  assert.equal(Accounts.CONTRACTOR_COST_START, null);
1100|test('the source binding stays null', () => {
1101|  reset();
1102|  const src = fs.readFileSync(path.join(ROOT, 'public/accounts.js'), 'utf8');
1103|  assert.match(src, /const CONTRACTOR_COST_START = null;/);
1104|  assert.equal(Accounts.CONTRACTOR_COST_START, null);
```

These stay. Source `public/accounts.js` is not edited. New tests that use `withStart` restore the constant in `finally`, as the existing helper already does.

### 6.6 Version pins

The four `aj-p0-v83` pins in §4.3 become `aj-p0-v84`. No other product file mentions `aj-p0-v83` (docs-only sketch lines are not edited).

## 7. pstack inventory

The code PR appends this section to `docs/PSTACK_INVENTORY.md`. It follows the shape of `## Thousand separators` (`:259`) and `## Contractor PR J` (`:278`): a short preamble, then a skill table. Status words on existing rows stay. No status word is flipped. The header counts are not edited. The file still does not say the app is pstack-compliant.

Proposed text (the agent reads the file again at the PR base and appends after the last slice section):

```
## Quantity comma refuse

Statuses above stay as they are. This file does not say the app is pstack-compliant. `arena` stays banned. The scope is hosting only. `firestore.rules` is not edited. `CONTRACTOR_COST_START` stays null. CSV output stays plain. Do not merge. Do not deploy.

| Skill          | This pull request |
| -------------- | ----------------- |
| `feature`      | `digits()` in `public/accounts-work.js` reuses `AccountPayment.plainAmount` for `#cw-qty`, `#cw-days`, and `#cw-per`. A short or irregular comma is refused; a strict thousands group and Arabic-Indic whole numbers are accepted. A failed parse, a 0, and an over-cap quantity paint «الكمية لازم رقم صحيح بدون كسور، مثل 25 أو 1,000». Money fields stay on `plainAmount` as they are. Proof is `tests/accounts-work.test.js` (the flipped tail of `IQD agreement fields group and refuse 2,5`, the field matrix including 0 and over-cap, and the pin of that sentence). Service worker `aj-p0-v84`. |
| `opening-a-pr` | One draft pull request against `main`. The body has the file list, the commands, the pass counts, and the scope limits. It waits for Ameer. It does not merge and it does not deploy. |
```

The preamble is the evidence that the scope is hosting only, rules are not edited, and `CONTRACTOR_COST_START` stays null.

The same code PR also commits this plan at **`docs/plans/comma-fix-plan.md`**.

## 8. Rollout, and the date PR

This fix is blocker 1 of `ANSWER-cost-start-300d5eb.md`.

The date PR is cut from main only after this fix is merged and live, or it ships in the same release; never before. This fix takes `aj-p0-v84` and does not set `CONTRACTOR_COST_START`. The date PR then takes `aj-p0-v85`. If they ship in the same hosting release, the date PR is based on this fix (or merged immediately after it) and the single deploy is `v85`, which already contains the comma fix. Any phone running the dated build then also has the fix. A phone still on `v83` has `CONTRACTOR_COST_START` null, so «مقاول» stays closed and the old strip cannot be reached.

Gates for **this** slice: plan → Architect CONFIRMED on this revision → Ameer approves a **code start** (verbatim, via EA) → one cloud agent, one draft PR off current main, including `docs/plans/comma-fix-plan.md` and the inventory section → Architect APPROVE of the exact head SHA → CI 4/4 → EA squash-merges only after Ameer names that SHA → main CI 4/4 → **hosting deploy only after Ameer's separate go** (verbatim).

Deploy (when that go comes; not now):

1. No rules backup step is required for a product change, because rules are not deployed. Do not run `firestore:rules`.
2. Clean checkout of the merged main. `public/sw.js` is `aj-p0-v84`. `CONTRACTOR_COST_START` is still `null`. `firestore.rules` is unchanged vs live.
3. `npx -y firebase-tools@15.34.2 deploy --only hosting` only, with `GOOGLE_APPLICATION_CREDENTIALS` set inline, never printed.
4. Wait 2 minutes.
5. Read back the hosting version and release, and confirm `sw` `aj-p0-v84` on both `ahl-aljazeera-accounting.web.app` and `ahl-aljazeera-accounting.firebaseapp.com`, files byte-match.

Live at plan time (L deploy, already verified): hosting `c15f63011788147f`, release `1795635344084000`, sw `aj-p0-v83`, ruleset `6a368703-f0bd-48be-9003-120766f6eca6` (source sha `306776a1fd2350200aeafbc51de7b7286f21e90be9e48d7c0ec33827971b720d`). Re-read live immediately before any later deploy.

## 9. Rollback

Hosting first, then rules — but rules are not changed, so rollback is hosting only: restore the pre-fix hosting version (currently `c15f63011788147f`, sw `aj-p0-v83`) after Ameer's rollback go. Do not roll rules back to `16a4c047-25db-4c91-b307-58ae493622c2` (that is the pre-L ruleset). Wait 2 minutes and confirm sw `v83` on both domains.

## 10. Notes (not blocking, none open on the sentence or the marks)

No blocking [OPEN] item remains for this slice. The wording is approved at `:44`. Zero and over-cap use the same sentence (`:45`). Points (a) and (b) are decided in §2.4.

- **M3** (decimal qty, «2,5» stored as `2.5`) stays a separate future plan. It still needs a `qtyOk` rules change and earned-amount math. When it is planned, record that three digits after a comma are thousands (`2,500` = `2500`).
- Inherited from `plainAmount` and not changed here (r2 review INFO): `025` → `25` and `0,700,000` → `700000`, the same as money.
- `#cc-sup-qty` (`qtyOf` in `accounts-correct.js:978-984`) still refuses Arabic-Indic digits. Out of scope; note it for consistency later (r2 review INFO).

## 11. Risks and blast radius

- **Intended behaviour change:** `#cw-per` / `#cw-qty` / `#cw-days` «2,5» no longer save as `25` (today's killer at `:1206`). Irregular groups (`1,50000`) are newly refused (today they save as `150000` because of the strip). Strict groups (`1,000`, `8,000`, `2,500`) still save the same integers they do today, but now because they are legal groups, not because commas are stripped.
- **Arabic-Indic** in these three boxes is newly accepted (`٢٥` → `25`). Money fields already did this. `qtyOf` (`#cc-sup-qty`) still refuses them; that is out of scope.
- **New Arabic string,** approved byte for byte at `:44`, on the typed path for a failed parse, a `0`, and an over-cap value. Empty qty / cleared second tap (`:1021`, `:1040`) and the old range-sentence behaviour on these three boxes switch to that string.
- **Unchanged on purpose:** money fields and their regroup-for-display behaviour; payment `digits` / `plainAmount` / `AMOUNT_FIELD_IDS`; `#cc-sup-qty`; rules; CSV; `CONTRACTOR_COST_START`; M3 decimals; `SENTENCE.range` on non-qty paths.
- **No data migration:** already-saved integers are untouched. The bug only affects new typings.
- **New dependency:** `digits()` now needs `AccountPayment` at tap time. Script order `index.html:73-74` loads it, and `plainField` already relies on it (r2 review).
- **SW bump:** phones on v83 pick up v84 after one open, same as prior hosting-only slices. «مقاول» stays closed until the later date PR (`v85`).
- **Cost:** once the date is live, a quantity feeds `approveLabor` amount. Shipping this fix before or with that PR is what stops a typed `2,5` becoming a 10× (or similar) cost.

## 12. Not in this slice

Code, PR, cloud agent, merge, or deploy, until the later goes. `firestore.rules`. CSV. Setting `CONTRACTOR_COST_START` (the date PR, `v85`, after this is live or in the same release). Editing `.cursor/rules/pstack-models.mdc`. Folding a short comma or «٫» to a decimal. Editing `accounts-payment.js` or `AMOUNT_FIELD_IDS`. Changing `#cc-sup-qty`. Editing the old thousand-separator sketches.

## 13. Changelog, r2 → r3

r2 sha256 `5c2f0f3eadd0727cbc5683f6d4323d9a60072300320792d75471498f2ceb2c08`. Review sha256 `c1c5ebfa8b05ee7fcb46f3b5409c3aa4fc5771e7be4bea5408ba060d032bb84f` (NOTES). Answers file now `AMEER-answers-L.md` sha256 `3cfa3fb1f5f7b9d1cc39368777c7e8e16803b1aeec1ed588bb2ca19efd8e96e4`, 45 lines.

| Item | r2 | r3 |
|---|---|---|
| MEDIUM-1 (r2), exact sentence | §2.2 said Ameer had approved the wording, with no filed line | Cites `AMEER-answers-L.md:44`: «موافق على الجملة مثل ما هي بالحرف» for the exact string. Notes U+060C in the sentence and ASCII `1,000`. Precedent `:33` acknowledged. |
| LOW-3 (r2), `0` and over-cap | kept `SENTENCE.range` «المبلغ ليس عدداً صحيحاً» | Cites `:45` «إي، الصفر واللي فوق الحد تطلع نفس الجملة». `SENTENCE.qty` replaces `SENTENCE.range` on `#cw-per`, `#cw-qty`, and `#cw-days` for a failed parse, a `0`, and an over-cap value. Tests: flip `:1021`/`:1040`; add `0` and over-cap UI cases; keep builder `['range']`/`['overflow']` at `:1030` and `:471-504`. `SENTENCE.range` stays for `unitRate` / `unitName` / `dayRate` and the builders. |
| LOW-2 (r2), checkJs | the second `saveMeasure` branch was written without a null guard | Both `saveMeasure` and the unit `saveAgreement` intercept use `qty != null` / `unitQty != null` before the cap test, as the review described, so `tests/strict-accounts-work.test.js:8` stays green. |
| LOW-1 (r2), citations | plan-start go written as 01:25; answers not cited by file:line | Cites `:38` and `:39`, labelled EA-relayed. The plan-start go is filed as **01:26**, not 01:25. |
| (a) refuse «،», (b) accept «٬» | listed as a conservative minor note in r2 §10 | Moved to decided §2.4, citing the r2 review's "agree" wording. No further Ameer question. |
| Other, from the r2 review | — | Script order cited at `index.html:73-74`. Probe cases `10,00,000`, `100,`, `1 000`, empty, spaces only, and trimmed `25` added to the matrix. INFO notes kept: `025` / `0,700,000` inherited from `plainAmount`; `#cc-sup-qty` still refuses Arabic-Indic, out of scope, for consistency later. |
