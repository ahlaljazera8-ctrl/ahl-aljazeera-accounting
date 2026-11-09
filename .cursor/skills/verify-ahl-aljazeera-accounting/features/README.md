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

The owner tab «الأشخاص» (`syncPeopleTab` in `public/render.js`) is a real screen and is not in this seed. Add it in a `/maintain-verification-skill` run. Do not claim it was verified. «الرئيسية» is the landing state inside login and the balance check inside the new-entry journey, not a sixth file.
