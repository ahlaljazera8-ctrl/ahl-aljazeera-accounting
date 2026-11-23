# PLAN ONLY: thousand separators on amount fields

Revision r2 after Architect NOTES on `069eb1bb15296854ec5aa4a36591471641eefeda`. The review sha256 is `728be828547493c8b72a26a95856df778c1aca998f4e0292ffcf2f19d6717f1b`. Not an approval. M1, M2, M3, M4, and L1 through L6 are addressed below. Where a later item could be read as decided, this sketch says addressed. The inventory stands. The stored amount stays a plain number.

No code in this pull request. No edit under `public/`, `tests/`, `firestore.rules`, `firestore.indexes.json`, `scripts/`, `.cursor/`, `.github/`, or `docs/PSTACK_INVENTORY.md`. The later code pull requests are sketched below and are not started. This sketch does not merge itself and does not deploy.

Base is main `3aeec9ac97f6464f40b6b81a17d13ab11f1a90de` (#100, H payments, `const VERSION` `aj-p0-v72` at `public/sw.js` line 2). Citations below were read on that SHA. A code pull request reads the lines again at its own base. Arena was not run. Ameer's gate bans it (cost).

محاسب أهل الجزيرة was not asked. The display rule is already Ameer's, and the comma rules already shipped in H. The stored amount stays the integer the screen already stores. This sketch changes no balance, no advance, no ledger rule, no export, and no `firestore.rules`.

Slice 0 may open. «في 20:00 بغداد 2026-11-23، اختار أمير خيار «ادمج الخطة وابدأ الجزء 0» على بطاقة EA رقم t2056s7036 (السؤال: «نبدأ الجزء 0 هسه، لو ننتظر جوابك؟»؛ نص الخيار من EA). المصدر: تقرير EA عن اختيار البطاقة.» Merging #101 and starting slice 0 already happened on this choice. This sketch does not ask that question again. Later slices still wait on an [OPEN] item they depend on. This sketch does not answer the items that stay open.

## The rule

Ameer, 2026-11-23 12:36: «إذا كتبت أرقام عربية، تبين أرقام إنجليزية مع فوارز مثل 100,000». Arabic-Indic (`٠-٩`) and Eastern Arabic (`۰-۹`) digits fold to Western digits while typing. The field shows English thousand separators. `١٠٠٠٠٠` shows `100,000`. The saved value is the plain number `100000`, never the string `"100,000"`.

The comma rules already shipped on `cp-amount`, `cp-return`, and `cp-refund` stay identical:

- A short group is refused. `2,5`, `٢,٥`, `٢\u066C٥`, and `1,0,0` stay refused. They are not stored as a shorter number (`2,5` is not stored as `25`). This refusal is the amount-field rule. `#cw-qty` and `#cw-days` do not use it. On those two fields only, a comma is a decimal point (M3, closed).
- A long mis-group, typed or pasted, is regrouped on screen. `1,50000` and `١` + U+066C + `٥٠٠٠٠` show `150,000` and save as `150000`. `plainAmount('1,50000')` is `null` (`public/accounts-payment.js` lines 189-194 and the test at `tests/accounts-payment.test.js` line 1257). The save reads the field after `groupThousands` has rewritten it.
- U+066C is a comma, the same replacement `L.parseAmount` does at `public/ledger.js` line 171.

`L.parseAmount` (`public/ledger.js` lines 166-182) and `foldAmountDigits` (`public/accounts-payment.js` lines 176-182) fold the same three things: `٠-٩`, `۰-۹`, and U+066C, and both map U+066B to `.`. `ledger.js` stays as it is. There is no second parser.

On قيد جديد, on `#contract`, and on `#fm-amount`, `L.parseAmount` refuses `1,50000` today. After that field is connected, the listener rewrites it to `150,000` and the save stores `150000`. Each of those slices tests that change. Slice 0 does not connect a field, so it does not make that change.

## Inventory

Every `inputmode="numeric"` field under `public/`, read on this SHA. The Architect confirmed this list: no amount field is missing, and none is wrongly included. The login email (`public/index.html` line 25) is `inputmode="email"`.

| Screen                                                                     | Field                     | Where                                  | Current behavior                                                                                                                                                                                                             | Slice   |
| -------------------------------------------------------------------------- | ------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| قيد جديد (`views.entry`, title at `public/render.js` line 982)             | `#amt`                    | `public/render.js` line 725            | Paints `state.amountDraft`. Save calls `L.parseAmount` at line 1508. No input listener groups the field.                                                                                                                     | 1       |
| same form                                                                  | `+ ألف`, `+ مليون`, `مسح` | lines 726 and 1445-1458                | `L.parseAmount` of the field, then `L.fmt` into the field, then `render`. `captureForm` (line 1053) stores that.                                                                                                             | 1       |
| عقد مقاول (`views.subnew`)                                                 | `#sub-amount`             | line 916                               | Opens as `L.fmt(1500000)`, which is `1,500,000` (line 909). Save calls `L.parseAmount` at line 168.                                                                                                                          | 5       |
| ملحق (`views.amend`)                                                       | `#am-amount`              | line 941                               | Opens as `L.fmt(200000)`, which is `200,000` (line 933). Save calls `L.parseAmount` at line 202.                                                                                                                             | 5       |
| سلفة جديدة, تسديد المستحق, استلام المتبقي (one sheet, `views.foremanmove`) | `#fm-amount`              | `public/foremen.js` line 301           | Prefill is `Ledger.fmt` (lines 317-324). `onInput` (lines 494-515) stores the raw value and parses it with `L.parseAmount` for the sentence. Save calls `L.parseAmount` at line 423. The list heading is `السلف` (line 235). | 2       |
| مقاول, عقد عمل جديد                                                        | `#cw-lump` مبلغ           | `public/accounts-work.js` line 895     | Empty. `digits` (lines 136-141) strips every comma, so `2,5` becomes `25`. No Arabic fold.                                                                                                                                   | 3       |
| same form, unit                                                            | `#cw-rate` سعر الوحدة     | line 898                               | Same `digits`. Stored as `unitRate` (line 487). Cap `100000000` (`agreementDoc`, lines 243-244).                                                                                                                             | 3       |
| same form, daily                                                           | `#cw-day` أجرة اليوم      | line 902                               | Same `digits`. Stored as `dayRate` (line 490).                                                                                                                                                                               | 3       |
| same form, milestone                                                       | `#cw-mile` قيمة المرحلة   | line 903                               | Same `digits`. Stored as `milestoneAmount` (line 491).                                                                                                                                                                       | 3       |
| مقاول, تسجيل دفعة                                                          | `#cp-amount`              | `public/accounts-payment.js` line 1098 | Already grouped. `bindDraft` (lines 1016-1036).                                                                                                                                                                              | shipped |
| مقاول, إرجاع سلفة                                                          | `#cp-return`              | line 1135                              | Already grouped. `pointerBlock` (lines 1110-1138).                                                                                                                                                                           | shipped |
| مقاول, استرداد                                                             | `#cp-refund`              | line 1135                              | Already grouped. Same `pointerBlock`.                                                                                                                                                                                        | shipped |
| project, قيمة العقد                                                        | `#contract`               | `public/render.js` line 244            | Paints `String(amount)` with no commas (line 242). The label beside it already uses `money` (line 56), which calls `L.fmt` (`public/ledger.js` line 484). Save calls `L.parseAmount` with `allowZero` (line 258).            | 4       |

`L.fmt` is `toLocaleString('en-US')` (`public/ledger.js` line 484). Painted totals, statements, CSV cells, and `#fm-amt-text` already go through it. They are not inputs. No slice edits them.

The open values `1,500,000` and `200,000` are the hard-coded samples at `public/render.js` lines 906-910 and 930-934. They are pre-existing. No slice edits them.

## Not amount fields

These are numeric inputs on «مقاول». They are counts. This sketch does not put thousand separators on them, and slice 4 does not pick them up.

| Field      | Label       | Where                              | Stored as                                                                                         |
| ---------- | ----------- | ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| `#cw-per`  | لكل كم      | `public/accounts-work.js` line 899 | `unitQty`, cap `1000000` (lines 243-244 and 488)                                                  |
| `#cw-qty`  | كمية منجزة  | line 951                           | today `digits` (line 514) stores `2,5` as `25`. Slice 3 stores `2.5`. Cap `100000000` (line 515). |
| `#cw-days` | أيام معتمدة | line 953                           | the same call today. Slice 3 stores a comma as a decimal point.                                   |

`#cw-per` stays a count on `digits`. `#cw-qty` and `#cw-days` do not take thousand separators. M3 is closed under Decided: those two accept Arabic digits, and a comma is a decimal point, so `2,5` is stored as `2.5`. It is not refused, and it is not stored as `25`. The live `digits` call still turns `2,5` into `25` until the later work slice. Slice 0 does not change that call. The «حسابات» pill `السلف` (`public/accounts-view.js` line 410) filters rows. It is not an input. `AccountsView.onInput` only reads `#statement-from` (lines 609-614).

## Reuse

`AccountPayment` already exports `groupThousands`, `plainAmount`, and `applyGroupedAmount` (`public/accounts-payment.js` lines 1178-1180). `groupThousands` is lines 158-169. `plainAmount` is lines 189-194. `applyGroupedAmount` is lines 237-251. Later pull requests call these. They do not copy the regex, and they do not add a parser.

The typing behavior also uses two functions that are not exported today:

- `isAmountField` (lines 981-983) is `cp-amount`, `cp-return`, and `cp-refund` only.
- `deleteDigitBeforeComma` (lines 999-1014) deletes the digit before a grouping comma on Backspace. `bindDraft` (lines 1020-1028) listens for `key === 'Backspace'`.

Slice 0 changes those helpers and adds no field id. Each later slice adds its own ids to that same `isAmountField`. A second listener is not added.

A key the shared listener cancels is followed by a bubbling `input` event on that field. On the base SHA, Backspace is the only cancelled key: `preventDefault` runs after `deleteDigitBeforeComma` returns true, and no `input` event follows. `refreshAmountField` (lines 988-992) updates the H preview only. Slice 0 dispatches the bubbling `input` event and does not call `refreshAmountField` again, because the document `input` listener already does. The rule covers any later cancelled key, not only Backspace.

`foremen.js` loads before `accounts-payment.js` (`public/index.html` lines 69-74). The guard at the call is `globalThis.AccountPayment`, or a `typeof` check, not a bare `window.AccountPayment`, because the foremen unit tests have no `window`. It is not a new shared file. A new file is another script in `index.html`, in `ASSETS`, in `SHELL`, and in `SHELL_FILES`, and another `VERSION` bump, to move functions that are already exported. Those functions run on input, after `AccountPayment.install` (`public/render.js` lines 1696-1700). The load order does not hide them then. The guard is for a call from a script that was evaluated earlier. If that binding is missing, the call does not throw and the field stays as typed. Slice 2 is that call site. Slice 0 does not edit `foremen.js`.

`render.js` registers its `input` listener first (line 1618) and calls `ForemenUI.onInput` (line 1621). The payment listener is registered later, inside `install`. On a normal keystroke, `onInput` copies the value before `applyGroupedAmount` runs. Slice 2 calls `applyGroupedAmount` at the start of `onInput`, then copies, and the call is inside the guard. Calling it twice is safe: the second call sees an unchanged value and returns (line 243).

`digits` in `public/accounts-work.js` (lines 136-141) strips every comma, so `2,5` becomes `25`, and it refuses Arabic digits. Slice 3 reads the four IQD fields with `plainAmount` in the same pull request that adds them to `isAmountField`. `#cw-per` stays on `digits`. `#cw-qty` and `#cw-days` do not use that amount-field comma rule. M3 is closed: on those two only, Arabic digits are accepted and a comma is a decimal point, so `2,5` is stored as `2.5`. That reader lands in slice 3, not in slice 0.

Screens that already save through `L.parseAmount` keep that call, on the field text. `parseAmount` already accepts a proper group and a plain integer, folds Arabic digits, refuses a short group, and carries the ceiling and `allowZero`. `plainAmount` replaces `digits` on the four IQD fields, because `digits` does not refuse `2,5`.

A value set without an `input` event is still saved by the existing parser. The emulator checks that set `#amt` and click `#save` without dispatching `input` stay valid (`tests/browser-check.js` lines 581-612, `tests/emulator/app-entry.test.js` lines 304 and 331).

`public/ledger.js` is not edited. The fold there and the fold in `foldAmountDigits` match on this SHA. A later pull request edits `ledger.js` only if those two folds have diverged, and it says why in that pull request.

Each code pull request that edits `public/` bumps `const VERSION`. This sketch reserves no number. Slice 0 deployed `aj-p0-v73`. Slice 1 takes `aj-p0-v74`. A later code pull request takes the next free value at its own base.

## Later code pull requests

One slice each. Slice 0 is first. It is the smaller first diff, and it is the order later code follows. The helper fixes are not part of قيد جديد: that would mix the entry form with a Backspace bug that shows on the سلفة sentence. Slice 0 adds no field id, so it cannot connect a screen. Slices 1, 2, 3, 4, and 5 start only after slice 0 is on main, in that order. The slice numbers are this plan's sequence.

Architect reviews that code SHA before it is treated as ready. One cloud agent at a time. CI is 4/4. Ameer merges. No deploy from the sketch. The hold on opening code until the [OPEN] answers is lifted for slice 0 only. «في 20:00 بغداد 2026-11-23، اختار أمير خيار «ادمج الخطة وابدأ الجزء 0» على بطاقة EA رقم t2056s7036 (السؤال: «نبدأ الجزء 0 هسه، لو ننتظر جوابك؟»؛ نص الخيار من EA). المصدر: تقرير EA عن اختيار البطاقة.» Merging #101 and starting slice 0 already happened on this choice. This sketch does not ask that question again. Later slices still do not open while they depend on an [OPEN] item.

### 0. Shared helpers

No screen. The r5 helper fixes and M1 land here. M3 does not.

- r5 LOW 1. `groupThousands` line 167 returns the folded text when the group is refused (`return folded`). `٢,٥` and `2,٥` show Western digits, and the comma stays (`tests/accounts-payment.test.js` lines 1117 and 1234). They do not become `25`.
- r5 LOW 2. The selected-range Backspace test (`tests/accounts-payment.test.js` lines 1090-1098) selects `2`–`5` of `1,500,000`. The handler ignores a selection (`deleteDigitBeforeComma` returns false unless `start === end`, line 1003). The test expects Backspace to leave that selection alone.
- M1. The Architect proved this on a scratch copy of main. Typing `١٠٠٠٠٠` and then one Backspace with the caret after the comma leaves the field at `10,000` while the sentence underneath still says `100,000`. The over-settle warning stays stale. A save would store `10000`. `deleteDigitBeforeComma` (lines 999-1014) updates the field and the key listener then calls `preventDefault` (lines 1026-1028), so no `input` event fires and `ForemenUI.onInput` (lines 494-515) does not run. After a delete that returns true, dispatch a bubbling `input` event on that field. The document `input` listener already calls `refreshAmountField`, so do not call it again after that event. Add a test that the `input` listener runs.
- Carried note. `groupThousands('0700000')` is `0,700,000`. `plainAmount` of that display is `700000`.
- Carried note. The listener compares `key` with `Backspace` (line 1022). The Android name of that key is the carried note. This slice does not add a second key name.
- The r5 note that `,500` shows as `500` is withdrawn. On this SHA `groupThousands(',500')` is `,500`.

Files: `public/accounts-payment.js`, `tests/accounts-payment.test.js`, and `public/sw.js` for `VERSION`. No field id is added. `public/render.js` and `public/foremen.js` stay.

### 1. القيد الجديد

Starts after slice 0 is on main. Add `amt` to `isAmountField`. The entry template keeps painting `state.amountDraft` (`public/render.js` line 725). After a keystroke the listener has grouped the field, `captureForm` stores that string, and the redraw shows it. The template does not call `groupThousands` itself. The checks that set `#amt` to `٧` and expect `٧` after a redraw without an `input` event stay (`tests/browser-check.js` line 580, `tests/emulator/app-entry.test.js` lines 339 and 345).

The chips stay. They already write `L.fmt`. Save stays `L.parseAmount` at line 1508, so `2,5` is still refused and `٧` still stores `7` (`tests/browser-check.js` lines 604-607).

`1,50000` is refused today. This slice regroups it to `150,000` and the save stores `150000`. The slice tests that.

Files: `public/accounts-payment.js` (the id), the entry behavior test, and the `VERSION` bump. `public/render.js` stays unless the test shows a typed redraw losing the grouped draft.

### 2. السلف

Starts after slice 0 is on main. One field, three kinds. `#fm-amount` is the amount on سلفة جديدة, تسديد المستحق, and استلام المتبقي. Add `fm-amount` to `isAmountField`. At the start of `ForemenUI.onInput`, if `globalThis.AccountPayment` is present, or a `typeof` check says so, call `applyGroupedAmount`, then copy (`public/foremen.js` lines 500-503). Save stays `L.parseAmount` (line 423). The prefill stays `Ledger.fmt`. The foremen unit tests have no `window`, so the guard is not a bare `window.AccountPayment`.

Slice 0 has already made the cancelled Backspace dispatch `input`, so `onInput` runs and the sentence and the over-settle warning follow the field. This slice tests that path: `١٠٠٠٠٠`, Backspace after the comma, field `10,000`, sentence `10,000`, and a save of `10000`.

`1,50000` is refused today. This slice regroups it to `150,000` and the save stores `150000`. The slice tests that.

`tests/browser-check.js` lines 1346-1355 dispatch `input` and assert the preview text `50,000` and a stored settle of `35000`. `parseAmount` accepts both `50000` and `50,000`, so those checks stay. The slice also asserts the field text.

Files: `public/accounts-payment.js`, `public/foremen.js`, the behavior test, and the `VERSION` bump.

### 3. المقاول, leftover IQD fields

Starts after slice 0 is on main. H already grouped `#cp-amount`, `#cp-return`, and `#cp-refund`. This slice adds `cw-lump`, `cw-rate`, `cw-day`, and `cw-mile` to `isAmountField`. `saveAgreement` (`public/accounts-work.js` lines 486-491) reads those four with `plainAmount`. `#cw-per` stays on `digits`. `#cw-qty` and `#cw-days` are not amount fields and are not added to `isAmountField`. This same later slice, not slice 0, is where M3 is implemented: those two accept Arabic digits, and a comma is a decimal point. `2,5` is stored as `2.5`. It is not refused, and it is not stored as `25`. They do not use the amount-field comma rule. Both IQD edits for the four amount fields land in this pull request: a listener that leaves `2,5` on those amount fields, read by `digits`, would store `25`.

`digits('1,50000')` is already `150000`, because `digits` strips every comma. This slice is not the refuse-to-save change. The four IQD fields go through `groupThousands` and then `plainAmount`, and the slice tests that `2,5` is refused.

Files: `public/accounts-payment.js`, `public/accounts-work.js`, the work behavior test, and the `VERSION` bump.

### 4. قيمة العقد

The sequence heading already places this after slice 0. This section does not restate that. `#contract` is the IQD input this slice assigns. Add `contract` to `isAmountField`. Paint `groupThousands` of the integer so an opened contract shows separators. `0` stays `0`. Save stays `L.parseAmount` with `{ allowZero: true }` (`public/render.js` line 258).

`1,50000` is refused today. This slice regroups it to `150,000` and the save stores `150000`. The slice tests that.

`tests/browser-check.js` line 210 expects `#contract` value `60000000`. This slice updates that assertion to the grouped text in the same pull request. The label already shows `60,000,000` through `money`. Line 559 sets the value to `1234567` and clicks save without `input`; the stored `contractAmount` stays `1234567` (line 561).

Files: `public/accounts-payment.js` (the id), `public/render.js` (the painted value), `tests/browser-check.js` (line 210), and `public/sw.js` for `VERSION`. `public/render.js` and `tests/browser-check.js` were must-not-edit through #100. This slice does not start without explicit permission to edit those two files.

`#sub-amount` and `#am-amount` are not in this slice. Slice 5 names them. The slice number is this plan's sequence, not a decision recorded from Ameer.

### 5. عقد مقاول and ملحق

Starts after slice 0 is on main, in sequence after slices 1, 2, 3, and 4. `#sub-amount` is the amount on «عقد مقاول». `#am-amount` is the amount on «ملحق». Ameer's words at 11:26 were «بكل التطبيق حتى عندما اسجل قيد جديد», so both are amount fields and in scope. Save stays `L.parseAmount`. `1,50000` is refused today. This slice regroups it to `150,000` and the save stores `150000`. The slice tests that. EA asks Ameer for permission to edit `public/render.js` when this slice starts, not now.

Files: `public/render.js` (both forms), `public/accounts-payment.js` (the ids), and the `VERSION` bump. This pull request does not implement this slice.

## Decided

- M3. Closed. Ameer, 2026-11-23 20:03 Asia/Baghdad: «نعم دعها تقبل». `#cw-qty` and `#cw-days` accept Arabic digits. Ameer, 2026-11-23 20:04 Asia/Baghdad, a correction that supersedes any reading of the 20:03 exchange as refusing `2,5` the way an amount field does: «2,5 تتحول الى 2.5». On these two fields only, a comma is a decimal point. `2,5` is stored as `2.5`. It is not refused, and it is not stored as `25`. Amount fields keep the H rule: a short group is refused, a long mis-group is regrouped, and Arabic digits show as Western grouped amounts. The code lands in the later work / مقاول slice that already touches `#cw-qty` and `#cw-days` (slice 3, `public/accounts-work.js`), not in slice 0. Slice 0 does not edit that file and does not add a field id.
- The question of what «الأسطة» names is dropped. Ameer did not use that word. EA's correction records that, and Ameer said «شوكت قلت الاسطة». `#sub-amount` and `#am-amount` are amount fields under slice 5. That slice number is this plan's sequence, not a decision recorded from Ameer.

## [OPEN]

This sketch does not answer these. It adds no Arabic string. A later slice that needs a new string stops and leaves that string for Ameer.

- C's L5. The same words `عمل معتمد` and `مدفوع للعمل` are two numbers, the overview field and the statement line (`docs/plans/contractor-pr-f-sketch.md` line 642). This sketch does not pick a second wording.
- Q19. `q19ReturnOverAdvance` is `المُرجَع والتسوية أكبر من السلفة` (`public/accounts-payment.js` line 38). It is defined and not painted. It stays unpainted.
- `advanceNoteComma` (`سلفة، ليست مصروفاً.`) and `advanceNotePlain` (`السلفة ليست مصروفاً`) both stay (`public/accounts-payment.js` lines 15-16 and 27-28). Whether they show together is open.
- `CONTRACTOR_COST_START` is `null` (`public/accounts.js` line 11). Setting it needs a later go from Ameer. This sketch does not write a date.

## This pull request

r2 of the sketch. The diff is this file, plus the dated note already at the end of `docs/plans/flake-login-relogin-plan.md`. That note records a 2026-11-23 box run. It does not scope a flake fix. These NOTES are not an approval.

Slice 0 is merged on main `a9f3bf0390db95bd0f28f943a5a8e67804841da9` and deployed as `aj-p0-v73`. Slice 1 bumps `const VERSION` to `aj-p0-v74`.
