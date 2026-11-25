# أهل الجزيرة verification map

This directory is the verification recipes for the PWA. The product map is [docs/feature-map.md](../../../docs/feature-map.md), owned by the docs stream. This index does not copy it. If that file is absent, the link stays. Absence is not a reason to restate the product map here.

Read this index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- One `node scripts/verify-aj.js launch` per machine. A second launch exits 2.
- `node scripts/verify-aj.js doctor` before the first drive.
- Never drive an emulator or a Chrome this run did not start.
- Never use `?role=` as a stand-in for login.
- `--project ahl-aljazeera-accounting` is only the emulator namespace. `--only auth,firestore,hosting`. No deploy, no export.
- Evidence stays under `/tmp/aj-verify-evidence/<runId>/`.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer ids, `data-tab`, `data-type`, and `data-proj`. ARIA on this app is the bell and its panel.
- Treat every command as literal.
- Run browser actions through `node scripts/verify-aj.js drive <feature-id>`.
- A feature id this helper does not implement exits 3. That is not a pass.
- Do not remove proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes a screenshot with the project name or the login heading visible.
- Mutation proof includes the Firestore document read back as the signed-in owner.
- Record the feature id with every artifact.
- Report an unreachable path with the command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 and one paragraph of user-visible behaviour, then exactly four H2 sections in this order.

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with verify-aj`
4. `Gotchas`

## Features

- [Login](./login.md) is the gate. The proved drive signs in on the way to a new entry.
- [New ledger entry](./ledger-entry.md) is the journey `drive ledger-entry` proves.
- [Projects](./projects.md) includes project delete, which this helper does not drive yet.
- [Offline reopen](./offline-reopen.md) needs a network switch this helper does not have yet.
- [Foreman balances](./foremen.md) is the owner «العُهد» tab. This helper does not drive it yet.
- [Accounts](./accounts.md) is the owner «حسابات» list. The demo proof is `tests/browser-check.js`.
- [Account](./account.md) is the read-only person page. It is not a passing drive yet.
- [New agreement](./new-agreement.md) saves one labor agreement from «مقاول».
- [Cancel agreement](./cancel-agreement.md) queues a reversal the server refuses when the project is closed.
- [Labor quantity](./labor-qty.md) saves one measurement on that agreement.
- [Approve labor](./approve-labor.md) approves the brick measurement. `drive new-agreement`, `drive labor-qty`, `drive approve-labor`, and `drive cancel-agreement` each printed `proved`.
- [Pay labor](./pay-labor.md) saves the split on «مقاول»: 600,000 `payLabor` and 100,000 `advanceLabor`.
- [Advance labor](./advance-labor.md) is that same 700,000 tap. It asserts the 100,000 `advanceLabor`.
- [Return advance](./return-advance.md) returns 30,000 of that advance.
- [Refund labor](./refund-labor.md) refunds 50,000 of that payment.
- [Review cash](./review-cash.md) marks that payment `تدقيق`. An unknown id still exits 3.
- [Supersede](./supersede.md) saves `نسخة جديدة` of one unit measurement.
- [Reject](./reject.md) saves `رفض السطر` on a measurement that is not approved yet.
- [Deduct](./deduct.md) saves one deduct position under a counting approval.
- [Approve deduct](./approve-deduct.md) saves `اعتماد الخصم` on that position.
- [Reverse](./reverse.md) ends one counting approval with `عكس`. The source binding stays null.
- [Settle](./settle.md) saves `تسوية سلفة` against one advance. The id is `stl_` plus the measurement id plus the generation.
- [Statement approval](./statement-approval.md) issues `إصدار كشف حساب` for a week that has already ended.
- [Reclass](./reclass.md) marks one legacy labour row `انخصم` and turns another into an advance. The source binding stays null.

The owner tab «الأشخاص» (`syncPeopleTab` in `public/render.js`) is a real screen and is not in this seed. Add it in a `/maintain-verification-skill` run. Do not claim it was verified. «الرئيسية» is the landing state inside login and the balance check inside the new-entry journey, not a sixth file.
