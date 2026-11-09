---
name: verify-ahl-aljazeera-accounting
description: >-
  Drive the أهل الجزيرة accounting PWA (Firebase project ahl-aljazeera-accounting)
  in Chrome against the local Auth, Firestore, and Hosting emulators.
  Use when a change to a screen needs a scripted user path, a screenshot, and the
  Firestore row that path wrote. Do not use it against production Firebase, and
  do not start a second emulator while one is already up.
---

# Verify أهل الجزيرة

The surface is the Arabic RTL PWA in `public/index.html`. There is no CLI. Demo `?role=owner` and `?role=site` (`demoRole` in `public/session.js`) skip Firebase and run `seed()` in `public/app.js`. That is not this path. `npm run test:browser` already drives the demo. This skill logs in through `#login-btn`.

`--project ahl-aljazeera-accounting` is only the emulator namespace. It is the same project id the page already uses. The helper starts `emulators:start` with `--only auth,firestore,hosting`. It does not deploy, it does not export, and it does not pass `--import`.

Auth is `127.0.0.1:9099` and Firestore is `127.0.0.1:8080` (`firebase.json` emulator block). `loadFirebase` calls `connectAuthEmulator` and `connectFirestoreEmulator` only when the query is `emulator=1`. The hosting port is not pinned. Read it from the emulator hub, the same way `hostingOrigin` does in `tests/emulator/security-headers.test.js`. Two emulators cannot run: those ports are fixed and `singleProjectMode` is true. A second `launch` exits 2.

Chrome comes from `openChrome` in `tests/chrome-debug.js` (debug port 0, private `userDataDir`). Do not bind `8765`. Do not serve `public/` with python. A static server does not send the emulator Content-Security-Policy that `scripts/emulator-csp-config.js` adds.

## Launch

From the repo root, once:

```bash
npm ci
node scripts/verify-aj.js launch
```

`launch` is finished only when the login form is usable:

1. Refuse when `/tmp/aj-verify-runs/current` names a live emulator pid, or when `9099` or `8080` is already listening. Exit 2.
2. Write `firebase.emulator.json` with `fromFile` in `scripts/emulator-csp-config.js`. Do not edit `firebase.json`.
3. Spawn `npx --no-install firebase --config firebase.emulator.json emulators:start --only auth,firestore,hosting --project ahl-aljazeera-accounting`. Record that pid. No deploy, no export, no `--import`.
4. Wait until the log contains `All emulators ready` and an emulator-hub line (`Emulator Hub running at …` or `Emulator Hub host: … port: …`). `GET http://127.0.0.1:<hub>/emulators`. Auth must be port `9099` and Firestore port `8080`. Hosting's port is whatever the hub reports. Every host must be loopback.
5. `GET {origin}/index.html` must be 200 and the Content-Security-Policy must contain `http://127.0.0.1:9099` and `http://127.0.0.1:8080`.
6. Seed one Auth user `verify.entry@example.invalid` / `emulator-only-pass`, display name `مالك التحقق`, `users/{uid}` role `owner`, and `projects/p-verify` named `مشروع التحقق`. The app cannot create that first user. The seed uses the rules-disabled client. The proof itself starts at the login form.
7. Open Chrome at `390×844` on `{origin}/index.html?emulator=1`.
8. Wait until `document.body.dataset.ready === '1'`, `#login` is shown, `#shell` is hidden, and `#login-btn` includes `دخول`. `healWindows` in `public/sw.js` may add a `sw` query param. `emulator=1` must still be there. Wait again after that navigation.

Ready means step 8, not step 5. The command prints `runId`, `origin`, and `evidenceDir=/tmp/aj-verify-evidence/<runId>`.

## Doctor

Read-only. Run it before the first drive, and again after anything surprising.

```bash
node scripts/verify-aj.js doctor
```

It passes only when all of these hold:

- The recorded emulator pid and Chrome pid are alive.
- Auth, Firestore, and hosting ports are owned by the emulator pid's process tree. The debug port is owned by the Chrome pid's tree. A listener outside that tree is a failure.
- `GET {origin}/sw.js` and the working tree `public/sw.js` contain the same `const VERSION = '…'` assignment. Do not hardcode the cache name. A mismatch means this Chrome is not serving this tree.
- A POST to `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/ahl-aljazeera-accounting/accounts:query` lists `verify.entry@example.invalid`. The hostname is `127.0.0.1`. The path name is the emulator's local route, not a call to `identitytoolkit.googleapis.com`.
- The debug port still has a page target, and the page is ready on either the login form or the shell. Doctor does not click.

Exit 1 with the failed line. Do not launch a replacement from inside doctor.

## Drive

```bash
node scripts/verify-aj.js drive ledger-entry
```

That command is the proved journey. Any other feature id exits 3 and names the feature file. Do not click through an unproved feature and exit 0.

After a successful doctor, `drive ledger-entry` does this:

1. If `#shell` is hidden, set `#login-email` to `verify.entry@example.invalid`, set `#login-password` to `emulator-only-pass`, and click `#login-btn`. Wait until `#shell` is shown and `#who` includes `مالك التحقق`. Screenshot `evidenceDir/ledger-entry/after-login.png`.
2. Click `a[data-tab="entry"]`. Wait until `#title` is `قيد جديد` and `#amt` exists.
3. Click `button[data-type="materials"]`. Wait until `button[data-proj="p-verify"]` exists, then click it. Set `#amt` to `1500000` and `#desc` to `قيد تحقق مواد`. Screenshot `evidenceDir/ledger-entry/form.png`.
4. Click `#save` once. Wait until `#msg` includes `حُفظ على الهاتف`. Screenshot `evidenceDir/ledger-entry/saved.png`.
5. As the signed-in owner, read `ledgerEntries` through the emulator. Wait until exactly one document has that description, `amount` `1500000`, `entryType` `materials`, `direction` `expense`, `projectId` `p-verify`, and `createdByName` `مالك التحقق`. Write it to `evidenceDir/ledger-entry/firestore.json`. Two documents, or a timeout, is a stop. Do not delete the row to make a retry look clean.
6. Click `a[data-tab="projects"]`, then the card `a[href="#project/p-verify"]`. `#title` is `مشروع التحقق` (the name is the heading, not a line in `#main`). The المصروف line shows `1,500,000 د.ع` and not `3,000,000`. The الربح line shows `−1,500,000 د.ع` (U+2212, not a hyphen). The المقبوض line shows `0 د.ع`. The description appears once. The row shows `مواد` and the `entryDate` from the Firestore document. Screenshot `evidenceDir/ledger-entry/project.png`.
7. Open `a[data-tab="home"]`. إجمالي المقبوض is `0 د.ع`. إجمالي المصروف is `1,500,000 د.ع`. صافي الربح includes `−1,500,000`.
8. Reload the page. The shell returns without the login form. Home does not list the row text. Open `a[data-tab="projects"]` and the same card again. `#title` is `مشروع التحقق`. The same amount, `مواد`, and date are still there, still once. Firestore still has one row. Screenshot `evidenceDir/ledger-entry/project-reload.png`.
9. Write `evidenceDir/ledger-entry/network.txt`. Exit 1 if any request hostname is `firestore.googleapis.com`, `identitytoolkit.googleapis.com`, or `securetoken.googleapis.com`. A path on `127.0.0.1` that contains those names is the emulator and is allowed. `www.gstatic.com` is allowed by the page CSP.

Setting an input's `value` and clicking the real button is the same drive the emulator app-entry test uses. The login submit listener reads those values. The save listener reads `#amt` and `#desc`. Do not call `commit`, `flushRemote`, or `AJ.set`.

If the screen does not show those amounts, that one row, or the reload, stop and report the text. Do not change `public/` to make the journey pass.

## Evidence

Directory: `/tmp/aj-verify-evidence/<runId>/`, printed by `launch`. Cleanup never deletes it.

- `launch.txt`, `doctor.txt`
- `ledger-entry/after-login.png`, `form.png`, `saved.png`, `project.png`, `home.png`, `project-reload.png`
- `ledger-entry/firestore.json`, `assertions.txt`, `network.txt`

Proof standard:

- The path is the login form and `#save`. The helper's admin write is only the owner and the empty project.
- Capture the action and the state after it. The saved pill alone is not proof. The Firestore document is the side effect.
- The emulator is the boundary `emulator=1` already uses. Do not mock `fetch`. Do not point `FIREBASE_AUTH_EMULATOR_HOST` or `FIRESTORE_EMULATOR_HOST` at a non-loopback host. `localHost` throws otherwise.
- `?role=` is not a dry-run of this path. It never opens Firebase.

## Cleanup

```bash
node scripts/verify-aj.js cleanup
```

- Signal the recorded emulator pid and Chrome pid, process group first. If a pid is already gone, continue.
- Delete the Chrome `userDataDir`, `firebase.emulator.json`, and `/tmp/aj-verify-runs/<runId>/`, including `current` when it points at this id.
- Do not delete `/tmp/aj-verify-evidence/<runId>/`.
- Do not kill by process name. Do not delete `shots/`. Do not deploy. Do not export.

After every failed launch or drive, run cleanup before the next attempt, then confirm the evidence directory is still there.

## Helpers

One script. It is executable.

```bash
node scripts/verify-aj.js launch
node scripts/verify-aj.js doctor
node scripts/verify-aj.js drive ledger-entry
node scripts/verify-aj.js cleanup
```

`drive` takes the feature id and no other flags. There is no npm script.

`scripts/verify-aj.test.js` refuses a production Firestore, Auth, or token host and refuses a non-loopback emulator host. Run it with `node --test scripts/verify-aj.test.js`. It is not in `npm test` and not in the ledger job's `node --test` list yet.

Keep this map honest with `/maintain-verification-skill`. No cadence.
