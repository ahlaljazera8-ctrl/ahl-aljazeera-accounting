# Plan: project-local verification skill

Reviewed plan. The skill and helper are on this branch (draft PR #61). This file is no longer a plan-only draft. Line references below are as of f718c8d9.

- **Repo.** `ahl-aljazeera-accounting`, read at `main` = `f718c8d995c7bae378a7380b802e90aa02afabaa`. Line references below are as of f718c8d9.
- **Product.** Offline-first Arabic RTL ledger PWA. Firebase project `ahl-aljazeera-accounting`. Screens live in `public/`. The phone database is `aj-u-<uid>` (`public/session.js:296-299`). The demo database is `aj-p0` (`public/app.js:163`). Service worker cache name is the `VERSION` string in `public/sw.js:1` (`aj-p0-v53` at this SHA). This stream does not bump it.
- **Gates** (`AGENTS.md:5-12`). Ameer approves every merge and every behaviour or rules change. All 4 CI checks stay green. No spending. This plan is the architect sketch. Code waits until AgentLab Architect and EA have reviewed it. `arena` is banned (`AGENTS.md:35`), so the two shapes below were written by hand, not spawned.
- **This run did not ask محاسب أهل الجزيرة.** The accounting questions are listed in §8 so that quote can be added before the implementation run treats a balance as a house rule. The journey still asserts the screen the code already paints. It does not change `public/ledger.js`.
- **Docs stream.** `docs/feature-map.md` is not in this checkout. `docs/PSTACK_INVENTORY.md` is not edited here. The inventory line for the follow-up is in §6.

## 0. What the next agent is building

A cold agent, mid-task, must be able to launch this PWA, drive one user path, and keep the proof after teardown. The generator's output is the skill, not this plan. Implementation writes:

- `.cursor/skills/verify-ahl-aljazeera-accounting/SKILL.md`
- `.cursor/skills/verify-ahl-aljazeera-accounting/features/README.md`
- one file per feature under that `features/` directory
- `scripts/verify-aj.js`
- `scripts/verify-aj.test.js` (required). It is the failing-first production-host refusal test. This run does not wire it into CI.

Not touched in this run: `public/**`, `tests/**`, `firestore.rules`, `firebase.json`, `package.json`, `.github/workflows/ci.yml`, `docs/feature-map.md`, `docs/PSTACK_INVENTORY.md`.

`scripts/verify-aj.test.js` stays unwired on purpose. The ledger job does not run `npm test`. It has its own `node --test` file list (`.github/workflows/ci.yml`, ledger job, the `node --test` step). `package.json` `"test"` is a second explicit list. v54 (PR #59) is editing both lines. After that merges, one follow-up commit on a rebase onto `main` appends `scripts/verify-aj.test.js` to both lists. No fifth job. The ledger pass floor stays (`pass -lt 34`). This run does not edit either file.

The skill name is `verify-ahl-aljazeera-accounting`, matching `package.json` `"name"` and `.firebaserc` project id.

## 1. Interview

### 1.1 Surface

Primary surface: the browser PWA. `public/index.html` is what a person touches. `lang="ar"` and `dir="rtl"` (`public/index.html:2`). There is no CLI, no desktop shell, and no public HTTP API for the ledger.

What a person sees, in order:

1. Boot title «أهل الجزيرة» (`public/index.html:16-18`), then either the login form or the shell.
2. Login form `#login-form`: `#login-email`, `#login-password`, submit button `#login-btn` labelled «دخول» (`public/index.html:20-32`). A normal visit shows this form. `?role=` is the local demo and is not this path (`README.md:14`).
3. Shell `#shell` (`public/index.html:35-58`): heading `#title`, who-line `#who`, bell `#outbox` (`aria-label` starts «التنبيهات، لم يُرسل بعد: 0»), panel `#bell-panel` (`role="region"`, `aria-label="حالة الإرسال"`), sync line `#sync-msg`.
4. Tabs in `nav.tabs`, each `a[data-tab]`: `home` «الرئيسية», `entry` «قيد جديد», `projects` «المشاريع» (`public/index.html:54-58`). Owner-only tabs are added in script, not in the HTML: `data-tab="people"` «الأشخاص» (`public/render.js:695-709`) and `data-tab="foremen"` «العُهد» (`public/render.js:725-739`).
5. Screen body is `#main`, chosen from `location.hash` (`public/render.js:931-982`). Hash keys that exist today: `home`, `entry`, `projects`, `project`, `entries`, `detail`, `people`, `person`, `sub`, `subnew`, `amend`, `foremen`, `foreman`, `foremannew`, `foremanmove` (`public/render.js:425`, `public/render.js:679`, `public/render.js:967-980`).

Other surfaces, not the one this skill drives:

- Demo mode `index.html?role=owner` or `?role=site` (`public/session.js:87`). It skips Firebase, opens `aj-p0`, and runs `seed()` (`public/app.js:85-167`). The connection pill says «متصل (محاكاة)» (`public/render.js:417-419`). `tests/browser-check.js` drives this mode. It is a preview, not the user path.
- Firestore security rules, exercised by `tests/emulator/rules.test.js` inside `npm run test:emulator`. Not a user surface.
- CSV download from `#csv` «تصدير نسخة (CSV)» (`public/render.js:436`, handler `public/render.js:1104-1108`). Listed inside the home screen, not a separate feature file in this seed.

### 1.2 Run

Documented commands (`README.md:6-14`, `package.json:4-11`):

| Command                                       | What it does                                                                                                                   | Stays up?                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `npm test`                                    | Node unit tests. Explicit file list.                                                                                           | No                                                                   |
| `npm run test:browser`                        | `node tests/browser-check.js` against a server the human starts on `127.0.0.1:8765`                                            | No                                                                   |
| `npm run test:emulator`                       | `bash scripts/emulators-exec.sh --only auth,firestore,hosting --project ahl-aljazeera-accounting` then the emulator node tests | No. `emulators:exec` tears the emulators down when the command exits |
| `npm run lint` / `format:check` / `typecheck` | ESLint, Prettier, `tsc`                                                                                                        | No                                                                   |

There is no `start` script and no long-lived dev server. The verification launch has to be a new helper. It must not be wired into `package.json`.

Ports and hosts, from this tree:

- Auth emulator `127.0.0.1:9099` (`firebase.json:48-50`). The page connects only when the query is `emulator=1` (`public/firebase-client.js:54-55`).
- Firestore emulator `127.0.0.1:8080` (`firebase.json:51-53`, `public/firebase-client.js:63`).
- Emulator UI is off (`firebase.json:56-58`). `singleProjectMode` is true (`firebase.json:59`).
- Hosting emulator port is **not** in `firebase.json`. CI's hosting tests discover it from the hub: `GET $FIREBASE_EMULATOR_HUB/emulators` and read `body.hosting.port` (`tests/emulator/security-headers.test.js:81-90`). The skill does the same. It does not hardcode a hosting port.
- Hub port is not in `firebase.json` either. `emulators:exec` injects `FIREBASE_EMULATOR_HUB` for the child. A long-lived `emulators:start` must be parsed from its own log line, then queried the same way.
- Chrome DevTools port is ephemeral. `tests/chrome-debug.js:83` passes `--remote-debugging-port=0`.
- Do not bind `8765`. That port is the documented browser-check server (`README.md:7`) and is hardcoded in `tests/emulator/login-relogin.test.js:20`. The (c) stream owns `tests/browser-check.js`.

Env vars the page reads: none. The switch is the `emulator` query param. The helper's own seed process must set `FIRESTORE_EMULATOR_HOST` and `FIREBASE_AUTH_EMULATOR_HOST` to the loopback ports it just observed, and must refuse any other value. Copy the refusal in `tests/emulator/app-entry.test.js:35-42` (`localHost`).

Auth. The app does not create accounts (`README.md:16`). An admin creates the email, then the owner pastes the uid. For verification the helper is that admin, against the emulator only:

- Email `verify.entry@example.invalid`
- Password `emulator-only-pass` (the same kind of emulator-only password already in `tests/emulator/app-entry.test.js:17` and `tests/emulator/security-headers.test.js:18`)
- `users/{uid}` with `displayName: 'مالك التحقق'`, `role: 'owner'`, `active: true`, `assignedProjectIds: []`, `createdBy: uid` (shape from `tests/emulator/app-entry.test.js:151-154`)
- One project `projects/p-verify`, name «مشروع التحقق», `status: 'active'`, `currency: 'IQD'` (shape from `tests/emulator/app-entry.test.js:155-158`). `p-verify` matches `idOk` (`firestore.rules:19`).

No `--import`, no production export, no service account. `users/{uid}` is written with rules disabled, the same way `app-entry.test.js:148` does, because the rules cannot bootstrap the owner (`README.md:16`). That write is scaffolding. The proof starts at the login form.

Seed data the app itself would have written does not apply. `seed()` runs only on the demo path (`public/app.js:162-166`). An emulator login opens an empty `aj-u-<uid>` (`public/session.js:296-302`).

Ready means the login form is usable, not that a port accepted TCP:

1. Hub JSON lists auth, firestore, and hosting, each on `127.0.0.1` or `localhost`.
2. `GET {origin}/index.html` is 200 and the `Content-Security-Policy` header contains `http://127.0.0.1:9099` and `http://127.0.0.1:8080`. Those two origins are added only by `scripts/emulator-csp-config.js:8-9`. Production `firebase.json` must not contain them (`scripts/emulator-csp-config.js:12`). A python static server does not send this header, so this check rejects that stand-in.
3. The seeded Auth emulator account exists (read the emulator account list; do not call production Identity Toolkit).
4. Headless Chrome has opened `{origin}/index.html?emulator=1`, `document.body.dataset.ready === '1'` (`public/session.js:109`, set from `showLogin` at `public/session.js:118`), `#login` is shown, `#shell` is hidden, `#login-btn` text includes «دخول».

`npm ci` once before the first launch. This VM currently has Node `v22.23.4`; CI uses Node `26.13.0` (`.github/workflows/ci.yml:27`). The helper stays on CommonJS that both run. Java 21 is already on this VM (the emulator job installs Temurin 21, `ci.yml:133-136`). `google-chrome` is on `PATH`; `openChrome` spawns that name (`tests/chrome-debug.js:79`).

Teardown is §3 Cleanup. `scripts/emulators-exec.sh` deletes `firebase.emulator.json` on exit (`scripts/emulators-exec.sh:8-9`). The long-lived helper must delete that same file itself. The file is gitignored (`.gitignore:2`).

### 1.3 Drive

Reuse, in this order. Do not edit these files. The (c) stream is changing `public/**` and tests such as `tests/browser-check.js` and `tests/shell-cache.test.js`.

1. **Browser checks.** `tests/browser-check.js` plus `tests/chrome-debug.js`. CDP on headless Chrome, mobile viewport `390×844` (`tests/browser-check.js:16`), screenshots under `shots/` (gitignored). It drives `?role=owner` and `?role=site`, asserts Arabic copy, and refuses horizontal overflow. It does not log in and it does not talk to Firestore. Selectors it already proved stable: `#login-email`, `#login-password`, `#login-btn`, `#login`, `#shell`, `#main`, `#outbox`, `#bell-panel`, `#party`, `#contract`, `#project-manage`, `#manage-project`, `[data-rev]`, `[data-assign]`, `a[data-tab]`.
2. **Emulator tests.** `npm run test:emulator` covers rules, sync idempotency, login/relogin, offline reopen, app entry (a real `#save` that lands in `ledgerEntries`), security headers, and the service worker. The closest existing user journey is `tests/emulator/app-entry.test.js:170-188`: navigate `?emulator=1`, fill `#login-email` / `#login-password`, click `#login-btn`, wait until `#shell` is shown, set `location.hash='#entry'`, click `[data-proj="…"]`, fill `#desc`, click `#save`, then read the Firestore document. `tests/emulator/security-headers.test.js:81-90` is the hosting-origin recipe. `tests/emulator/login-relogin.test.js` is the offline recipe, but it serves `public/` with python on port 8765 and therefore skips the hosting CSP. The skill must not copy that server.
3. **Ledger tests.** `tests/ledger.test.js` and `npm test`. Pure `Ledger` totals, reversals, CSV. No browser. The skill does not re-run them as its proof. CI already does.

Generic recipe, because no Cypress spec exists. Playwright is a devDependency but the browser job uses system Chrome, and the WebKit install is a 15-minute CI step (`ci.yml:141-173`). The helper requires `../tests/chrome-debug.js` and speaks CDP. It does not add a browser library and does not edit `chrome-debug.js`.

Stable handles that exist. ARIA is sparse (the bell and its panel). Prefer ids, `data-tab`, `data-type`, `data-proj`, `data-add`, `data-fm`. Do not use coordinates.

Login (`public/render.js:1194-1225`):

- Fill `#login-email`, fill `#login-password`, click `#login-btn` (the form submit listener, not a synthetic `signIn` call).
- Empty submit stays on the form with a message (`public/render.js:1201`, already asserted in `tests/browser-check.js:31-33`).
- Success: `#shell` hidden becomes false, `#who` contains the profile `displayName`, `#logout` is visible, `#role-label` is hidden (`public/render.js:959-963`).

New entry (`public/render.js:445-484`, save at `1061-1092`):

- `a[data-tab="entry"]` or hash `#entry`. Default type is already `materials` (`public/render.js:4`). Still click `button[data-type="materials"]` so the action is visible. Label «مواد» (`public/ledger.js:11`).
- Fill `#amt` with digits `parseAmount` accepts (`public/ledger.js:133-148`). `1500000` is valid. Do not click `+ ألف` fifteen hundred times.
- Click `button[data-proj="p-verify"]` and wait until that button exists. The project arrives from the pull, not from `seed()` (`tests/emulator/app-entry.test.js:184-186`).
- Fill `#desc`. Leave `#party` empty (rules allow a missing or empty `partyName`, `firestore.rules:68-72`). Leave `#foreman` on «—».
- Click `#save`. The button is disabled for that tap so a double-tap cannot duplicate (`public/render.js:1062`).
- Resulting state: `#msg` contains the saved pill «حُفظ على الهاتف · لم يُرسل بعد» (`public/render.js:483` and `928`). `commit` appends the row and calls `flushRemote` when not in demo (`public/render.js:272-276`).
- Side effect: a `ledgerEntries` document whose `description` is the unique note, `entryType` is `materials`, `direction` is `expense`, `amount` is `1500000`, `createdByName` equals `مالك التحقق` (`public/render.js:1081-1082`, rule `firestore.rules:76-80`). Read it through the emulator with rules disabled, the same client `serverEntry` uses (`tests/emulator/app-entry.test.js:122-128`). Finding the row by that description avoids treating `AJ.get` as the proof. The screen must also show it.

Project screen after the save (`public/render.js:508-524`):

- Hash `#project/p-verify`.
- «المصروف» shows `1,500,000` (`Ledger.fmt`, `public/ledger.js:313`, wrapped by `money` at `public/render.js:8` as `1,500,000 د.ع`).
- «الربح» shows `−1,500,000` (U+2212, because profit is negative and `fmt` prefixes that character). The note «الربح = المقبوض − المصروف» is on the card (`public/render.js:514`).
- A pending row still counts. `countedEntries` drops only ids listed in `syncErrors` (`public/ledger.js:299-307`). Wait for the Firestore document anyway, so the proof is not only the local pill.

Production guard, copied in spirit from `tests/emulator/app-entry.test.js:27`: fail the run if any request URL matches `firestore.googleapis.com`, `identitytoolkit.googleapis.com`, or `securetoken.googleapis.com`. Loading the Firebase scripts from `www.gstatic.com` is what the CSP allows (`firebase.json:33`) and is not a failure.

### 1.4 Observe

- CDP screenshot (`Page.captureScreenshot`), as `tests/browser-check.js:37-38`.
- Text of `#title`, `#who`, `#main`, `#msg`, `#login-msg`.
- Exit code of `scripts/verify-aj.js`.
- The Firestore emulator document JSON.
- Chrome and emulator logs the helper already captured.
- A network list that is empty of production Auth/Firestore hosts.

Evidence directory, named so cleanup cannot be "clever" about it:

`/tmp/aj-verify-evidence/<runId>/`

Not `shots/`. `shots/` belongs to `tests/browser-check.js`. Not the repo. Nothing under `public/`.

### 1.5 Isolate

Two full instances cannot run side by side.

- Auth `9099` and Firestore `8080` are fixed in `firebase.json`. A second `emulators:start` will fail to bind, or worse, the helper might attach to someone else's emulator.
- `singleProjectMode: true` means that one emulator is the whole project (`firebase.json:59`).
- Two Chromes with different `--user-data-dir` values can run (`openChrome` already requires a private dir, `tests/chrome-debug.js:72-75`), but they would share the one Firestore emulator and corrupt each other's ledger.
- IndexedDB `aj-u-<uid>` lives inside the Chrome profile (`public/session.js:299`). A fresh `userDataDir` is an empty phone. Deleting that directory is the phone teardown. Do not `killall chrome` or `killall java`.

The helper keeps a single run record at `/tmp/aj-verify-runs/current`. `launch` exits 2 if that record's emulator pid is still alive. `doctor` and `drive` refuse a Chrome or an emulator they did not start.

## 2. Design

`architect` Phase B asks for arena. Arena is banned (cost). Two shapes, compared by hand.

**Shape A, chosen.** One CommonJS CLI, `scripts/verify-aj.js`, with four subcommands: `launch`, `doctor`, `drive`, `cleanup`. It requires `tests/chrome-debug.js` and `scripts/emulator-csp-config.js`. It spawns `npx --no-install firebase emulators:start` on a throwaway config. Feature markdown tells the cold agent the exact subcommand and the selectors that subcommand uses. One public surface. The production-host check and the "port owned by our pid" check sit in that file, so a later feature file cannot fork a python server and still look like the skill.

**Shape B, rejected.** No helper. The skill tells the agent to re-run `tests/emulator/app-entry.test.js` and read `shots/`. That file serves `public/` itself on port 0 (`tests/emulator/app-entry.test.js:44-57`), so the CSP check never runs, and editing it collides with the (c) stream. A cold agent will also copy `login-relogin.test.js`'s python server on `8765`. The skill's own rule is that a helper the reader must reverse-engineer is not a helper.

**Shape C, rejected.** Playwright WebKit, matching the emulator job's browser install. That install is a large CI step and is not required for `google-chrome`, which this VM and the browser job already have. A second browser stack is a larger surface for the same clicks.

Synthesis: Shape A. The caller's usage is the four subcommands. Types are derived from that.

### 2.1 Module

`scripts/verify-aj.js` only. No new package. No new workflow. `tsconfig.json:14` already includes `scripts/**/*.js` with `checkJs`. `eslint.config.js:227` already lints `scripts/**/*.js`. Prettier is not ignoring `scripts/` or `.cursor/` (`.prettierignore` ignores `public/`, `tests/`, `firebase.json`, rules, the lockfile, `shots/`, `.firebase/`).

### 2.2 Types and signatures

Bodies stay unimplemented until the implementation run. No `any`. CDP payloads are `unknown` until narrowed at this boundary.

```js
/**
 * @typedef {Object} RunRecord
 * @property {string} runId
 * @property {number} firebasePid
 * @property {number} chromePid
 * @property {number} debugPort
 * @property {string} userDataDir
 * @property {string} origin
 * @property {number} authPort
 * @property {number} firestorePort
 * @property {number} hostingPort
 * @property {number} hubPort
 * @property {string} evidenceDir
 * @property {string} email
 * @property {string} displayName
 * @property {string} projectId
 * @property {string} projectName
 */

/**
 * @param {string[]} argv
 * @returns {Promise<number>}
 */
async function main(argv) {}

/**
 * Start emulators from an empty dataset, seed the one owner and one project,
 * open Chrome on the login form. Write RunRecord to
 * /tmp/aj-verify-runs/<runId>/run.json and point
 * /tmp/aj-verify-runs/current at that id.
 * Exit 2 if current's firebasePid is alive.
 * @returns {Promise<RunRecord>}
 */
async function launch() {}

/**
 * Read-only. Throws if the instance is not worth driving.
 * @param {RunRecord} run
 * @returns {Promise<void>}
 */
async function doctor(run) {}

/**
 * @param {RunRecord} run
 * @param {string} featureId
 * @returns {Promise<void>}
 */
async function drive(run, featureId) {}

/**
 * Kill firebasePid and chromePid only (process group of those pids).
 * Remove userDataDir, the throwaway firebase.emulator.json, and the run record.
 * Never remove evidenceDir.
 * @param {RunRecord} run
 * @returns {Promise<void>}
 */
async function cleanup(run) {}

/**
 * @param {string} raw
 * @returns {{ host: string, port: number }}
 */
function localHost(raw) {}

/**
 * @param {number} pid
 * @param {number} port
 * @returns {Promise<boolean>}
 */
async function portOwnedByTree(pid, port) {}
```

`drive` accepts `ledger-entry` in the implementation run. Any other id exits 3 with the feature file name and the sentence "not proved in this run", so a cold agent cannot treat an unwritten journey as a pass.

Seed constants live next to `launch`, not in `public/`:

- `email` `verify.entry@example.invalid`
- `password` `emulator-only-pass`
- `displayName` `مالك التحقق`
- `projectId` `p-verify`
- `projectName` `مشروع التحقق`
- entry `description` `قيد تحقق مواد`
- entry `amount` `1500000`
- entry `entryType` `materials`

### 2.3 Why this is safe to add

The safety fact: the diff does not touch `public/`, `tests/`, rules, `package.json`, or CI, so the four existing jobs execute the same commands they execute on `f718c8d`. **Unproven in this plan run** (there is no diff yet). The implementation run proves it with `git diff --name-only origin/main` and with `npm run lint`, `npm run format:check`, and `npm run typecheck`.

## 3. SKILL.md outline

YAML frontmatter, or the skill never registers:

```yaml
---
name: verify-ahl-aljazeera-accounting
description: >-
  Drive the أهل الجزيرة accounting PWA (Firebase project ahl-aljazeera-accounting)
  in Chrome against the local Auth, Firestore, and Hosting emulators.
  Use when a change to a screen needs a scripted user path, a screenshot, and the
  Firestore row that path wrote. Do not use it against production Firebase, and
  do not start a second emulator while one is already up.
---
```

Sections below are the skill body. Commands are exact. Paths are from the repo root.

### Launch

From an empty emulator (no `--import`) and an empty Chrome profile.

```bash
npm ci
node scripts/verify-aj.js launch
```

`launch` does all of the following. The skill spells that out so the agent does not improvise a server:

1. Refuse if `/tmp/aj-verify-runs/current` names a live `firebasePid`.
2. Write `firebase.emulator.json` with `node scripts/emulator-csp-config.js firebase.emulator.json` (same call as `scripts/emulators-exec.sh:7`). Do not edit `firebase.json`.
3. Spawn `npx --no-install firebase --config firebase.emulator.json emulators:start --only auth,firestore,hosting --project ahl-aljazeera-accounting`. Record the pid. No `--import`. No deploy.
4. Wait until the log says the emulators are ready, then `GET http://127.0.0.1:<hub>/emulators`. Require loopback auth, firestore, and hosting. Auth must be port `9099` and Firestore port `8080`, because those are what `public/firebase-client.js:55` and `:63` dial. Hosting's port is whatever the hub reports.
5. `GET {origin}/index.html` and require the CSP substrings `http://127.0.0.1:9099` and `http://127.0.0.1:8080`.
6. Seed the one owner and `projects/p-verify` with the Admin/rules-disabled client. Set `FIRESTORE_EMULATOR_HOST` and `FIREBASE_AUTH_EMULATOR_HOST` only after `localHost` accepts them.
7. `openChrome({ userDataDir: '/tmp/aj-verify-runs/<runId>/chrome', detached: true })`.
8. Navigate to `{origin}/index.html?emulator=1`. Set device metrics `390×844`, `mobile: true`, matching `tests/browser-check.js:16`.
9. Wait until `document.body.dataset.ready === '1'` and `#login` is shown and `#shell` is hidden. The service worker may add `sw=<VERSION>` (`public/sw.js:27`). `emulator=1` must still be in the query. Wait again after that navigation.
10. Print `runId`, `origin`, and `evidenceDir=/tmp/aj-verify-evidence/<runId>`.

Ready is step 9, not step 5.

### Doctor

Read-only. Run it before the first drive, and again after anything surprising.

```bash
node scripts/verify-aj.js doctor
```

It passes only when all of these are true:

- `firebasePid` and `chromePid` from the run record are alive.
- `portOwnedByTree(firebasePid, authPort)`, the same for `8080`, and the same for the hosting port. A listener that is not in that process tree is a failure even if the port number matches.
- `GET {origin}/sw.js` contains the same `const VERSION = '…'` line as the working tree `public/sw.js`. Do not hardcode `aj-p0-v53`. The (c) stream may land `v54`. A mismatch means this Chrome is not serving this tree.
- The Auth emulator's account list contains `verify.entry@example.invalid`. This is a GET to the emulator on `127.0.0.1:9099`, not a sign-in, and not `identitytoolkit.googleapis.com`.
- The debug port still has a `page` target (`tests/chrome-debug.js:50-68`).
- The page is still `dataset.ready === '1'` and is either the login form or the shell. Doctor does not click.

Exit 1 with the failed line. Do not launch a replacement from inside doctor.

### Drive

```bash
node scripts/verify-aj.js drive ledger-entry
```

That command is the proved journey in §5. The skill also prints the selector sequence so a later feature file can reuse the same Chrome session. Other feature ids exit 3 until a later run implements them. Do not "helpfully" click through an unproved feature and exit 0.

Selector sequence the command runs, after a successful doctor:

1. If `#shell` is hidden, fill `#login-email` with `verify.entry@example.invalid`, fill `#login-password` with `emulator-only-pass`, click `#login-btn`. Wait until `#shell` is shown and `#who` includes `مالك التحقق`. Screenshot `evidenceDir/ledger-entry/after-login.png`.
2. Click `a[data-tab="entry"]`. Wait until `#title` is «قيد جديد» and `#amt` exists.
3. Click `button[data-type="materials"]`. Wait until `[data-proj="p-verify"]` exists (the pull). Click it. Set `#amt` to `1500000` and `#desc` to `قيد تحقق مواد`. Screenshot `evidenceDir/ledger-entry/form.png`.
4. Click `#save`. Wait until `#msg` text includes «حُفظ على الهاتف». Screenshot `evidenceDir/ledger-entry/saved.png`.
5. Wait until the emulator `ledgerEntries` collection has one document with that description, `amount === 1500000`, `entryType === 'materials'`, `direction === 'expense'`, `projectId === 'p-verify'`, `createdByName === 'مالك التحقق'`. Write it to `evidenceDir/ledger-entry/firestore.json`. If the wait times out, exit 1 and leave the screenshot. Do not delete the row to make a retry look clean; `cleanup` drops the whole emulator.
6. Navigate hash `#project/p-verify`. Wait until `#main` text includes «مشروع التحقق», «المصروف», `1,500,000`, and `−1,500,000`. Screenshot `evidenceDir/ledger-entry/project.png`.
7. Write `evidenceDir/ledger-entry/network.txt`. Exit 1 if any URL matched the production Auth/Firestore hosts.

Setting an input's `value` and then clicking the real button is the same drive `tests/emulator/app-entry.test.js:180` and `:188` already use. The login listener reads those values on submit (`public/render.js:1199`). The save listener reads `#amt` and `#desc` (`public/render.js:1063-1073`). Do not call `commit`, `flushRemote`, or `AJ.set`.

### Evidence

Directory: `/tmp/aj-verify-evidence/<runId>/`. `launch` prints it. Files from the drive above, plus `launch.txt` (origin, pids, hub JSON) and `doctor.txt`.

Proof standard, written into the skill in these words:

- The path is the login form and `#save`, not a direct `setDoc` from the helper. The helper's `setDoc` is only the owner bootstrap and the empty project, which the app cannot create (`README.md:16`).
- Capture the action and the state after it: form screenshot, saved pill, project screenshot, Firestore JSON.
- The Firestore document is the side effect. The pill alone is not proof.
- The emulator is the production boundary the app already has (`?emulator=1`). Do not mock `fetch`. Do not point `FIREBASE_AUTH_EMULATOR_HOST` at a non-loopback host.
- Demo mode is not a dry-run of this path. `?role=owner` never opens Firebase (`public/app.js:86` versus `:162`). A proof that used it would skip Auth, rules, and the outbox. The skill forbids that substitution. `npm run test:browser` remains the demo harness; this skill does not replace it.

### Cleanup

```bash
node scripts/verify-aj.js cleanup
```

- Signal the recorded `firebasePid` and `chromePid` process groups only (`tests/chrome-debug.js:42-47` already kills the Chrome group when `detached` is set). If a pid is already gone, say so and continue.
- Delete `userDataDir`, `firebase.emulator.json`, and `/tmp/aj-verify-runs/<runId>/` including `current` when it points at this id.
- Do not delete `/tmp/aj-verify-evidence/<runId>/`.
- Do not kill by process name. Do not delete `shots/`. Do not run `firebase deploy`. Do not export the emulator.

After every failed launch or drive, run cleanup before the next attempt, then confirm the evidence directory from the failed attempt is still there.

### Helpers

One script. It is executable as `node scripts/verify-aj.js <launch|doctor|drive|cleanup>`. `drive` takes the feature id. No other flags. No npm script.

The skill points at `/maintain-verification-skill` for keeping the map honest. No cadence.

## 4. Feature map seed

Index: `.cursor/skills/verify-ahl-aljazeera-accounting/features/README.md`.

First paragraph: this directory is the verification recipes for the PWA. The product map is `docs/feature-map.md`, owned by the docs stream. Link to it. Do not copy it. If that file is still absent when the skill lands, the link stays and the index says the docs stream has not added it yet. Absence is not a reason to restate the product map here.

Then the same blocks as the skill's example index: baseline preconditions, driving conventions, proof and skip reporting, the feature list.

Baseline preconditions to write:

- One `node scripts/verify-aj.js launch` per machine. A second launch must fail.
- `node scripts/verify-aj.js doctor` before the first drive.
- Never drive an emulator or a Chrome this run did not start.
- Never use `?role=` as a stand-in for login.
- Evidence stays under `/tmp/aj-verify-evidence/<runId>/`.

Each feature file: H1, one paragraph of user-visible behaviour, then these four H2s in order:

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with verify-aj`
4. `Gotchas`

`Driving it with verify-aj` starts with `Preconditions:`. If the seeded owner and `p-verify` are not enough for a journey, that journey fails and the reason goes under Gotchas. Do not add demo data to make it pass.

| File                         | User-facing feature      | Why this one                                                                                                           |
| ---------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `features/login.md`          | تسجيل الدخول             | The gate. Form in `public/index.html:20-32`, submit in `public/render.js:1194`.                                        |
| `features/ledger-entry.md`   | قيد جديد                 | The core loop. This is the file the implementation run proves.                                                         |
| `features/projects.md`       | المشاريع                 | List, project card, «إدارة المشروع», archive, permanent delete (`public/render.js:486-524`, delete confirm `773-787`). |
| `features/offline-reopen.md` | Reopen without a network | The shell stays up from `aj-u-<uid>` (`public/app.js:89-98`, `public/session.js:296-302`).                             |
| `features/foremen.md`        | العُهد                   | Owner tab `public/render.js:725-739`, screens in `public/foremen.js`. Not proved in this implementation.               |

«الأشخاص» is a real owner tab (`public/render.js:695-709`) and is **not** in this seed. The index says so, with the source path, and tells the reader to add it in a `/maintain-verification-skill` run rather than claiming it was verified. Home «الرئيسية» is the landing state inside `login.md` and the balance check inside `ledger-entry.md`, not a sixth file.

### 4.1 `login.md` (recipe the implementation writes, not proved as its own drive)

Sub-features: `login-empty` (empty submit stays on the form), `login-ok` (owner lands on «الرئيسية»), `login-who` (`#who` shows «المالك · مالك التحقق»).

User POV: open the site, type the email and password, press «دخول». There is no in-app sign-up.

Drive: the steps in §3 Drive item 1. Observable: `#title` is «الرئيسية», `#logout` is shown, `#role` is hidden (`public/render.js:959-963`). The home card for an owner includes «ملخص كل المشاريع» (`public/render.js:430-436`). With no entries yet, المقبوض and المصروف are 0.

Gotchas: a missing `users/{uid}` shows `MISSING_PROFILE_MSG` (`public/render.js:1220`). Wrong password shows «البريد أو كلمة المرور غير صحيحة» (`public/session.js:135`). Demo `?role=owner` never reaches this form.

### 4.2 `ledger-entry.md`

Sub-features: `entry-open`, `entry-save-materials`, `entry-on-project`, `entry-on-server`.

User POV: tab «قيد جديد», or «+ قيد جديد» on the home card (`public/render.js:436`), or «+ قيد لهذا المشروع» on the project card (`public/render.js:524`).

Drive: §3 Drive items 2-7. Preconditions: doctor ok, no existing `ledgerEntries` row with description `قيد تحقق مواد`.

Gotchas:

- The project pill is absent until the pull finishes. Waiting on `#amt` alone is not enough.
- «حُفظ على الهاتف · لم يُرسل بعد» is the local commit. The Firestore document is the send. Both are required.
- A second click on `#save` is a no-op for the same form id (`public/render.js:1062`) only while that button stays disabled. The recipe clicks once.
- Amount text must be plain digits or grouped thousands (`public/ledger.js:140`). The assertion on screen is `1,500,000`, which is `fmt`, not the input text.
- This journey does not record «مقاول», a reversal, a contract value, or a CSV.

### 4.3 `projects.md`

Sub-features: `projects-list`, `project-open`, `project-manage`, `project-delete`. `project-delete` is described and **not** driven in the implementation run.

User POV: tab «المشاريع». Open the card. «إدارة المشروع» (`#manage-project`) then «حذف» (`#choose-delete`) then «نعم» (`#confirm-yes`) then type the project name into `#delete-name` and press «حذف نهائياً» (`#confirm-delete`, `public/render.js:773-787` and `1114-1148`).

Drive, when a later run adds it: `node scripts/verify-aj.js drive project-delete` does not exist yet. The file says the command is not implemented and a run that needs it reports that, with the route `#project/p-verify`. It does not tell the agent to click delete by hand and call it verified.

Gotchas: delete needs a connection (`public/render.js:836` sets «الحذف يحتاج اتصالاً. لم يُحذف شيء.»). The confirm requires the project name typed exactly. Deleting `p-verify` removes the fixture the other journeys use; it is a separate run, after `ledger-entry`, on a fresh launch. The app does not keep a backup (`README.md:20`).

### 4.4 `offline-reopen.md`

Sub-features: `offline-stay`, `offline-row-still-there`.

User POV: after a real login, lose the network, close the tab, open the same origin again. The shell comes back from the phone database without showing the login form (`public/app.js:92-98`).

Drive: not in `scripts/verify-aj.js` this run. The file names the unmet piece: the helper does not toggle `navigator.onLine`. Copying `tests/emulator/login-relogin.test.js` would also start python on `8765`, which this skill refuses. Gotchas records that. The journey fails closed until the helper grows an explicit offline switch. Do not weaken it to a `?role=` reload.

### 4.5 `foremen.md`

Sub-features: `foremen-tab`, `foreman-new`, `foreman-advance`, `foreman-settle`. None are driven this run.

User POV: owner tab «العُهد». The list and the settle sheet are `public/foremen.js` (`data-fm="advance"`, `data-fm="settle"`, `#fm-amount`, `#fm-name`).

Drive: command not implemented. Report `verified-unreachable` only in the sense the maintain skill uses: the tab is reachable for an owner, but this helper has no `drive foremen` yet. Do not claim the balances.

Gotchas: a site user does not get the tab (`public/render.js:730`). Settle copy depends on fresh sync (`public/foremen.js` warn box). The accounting questions in §8 cover this screen. Until the advisor is quoted, the file describes the buttons and does not state a second balance formula.

## 5. The one feature the implementation run proves

`ledger-entry`. Command: `node scripts/verify-aj.js drive ledger-entry`, after `launch` and `doctor`, then `cleanup`, then a check that these files still exist and are non-empty:

- `/tmp/aj-verify-evidence/<runId>/ledger-entry/saved.png`
- `/tmp/aj-verify-evidence/<runId>/ledger-entry/project.png`
- `/tmp/aj-verify-evidence/<runId>/ledger-entry/firestore.json` with `amount` 1500000, `entryType` `materials`, `description` `قيد تحقق مواد`

`login` is exercised inside that drive (the form is the entry point). It does not get a separate pass stamp. `projects`, `offline-reopen`, and `foremen` are map seed only.

### Stand-in versus the real target

The real target of this skill is this repo's hosting emulator plus Auth `9099` plus Firestore `8080`, in Chrome, with `?emulator=1`. Production Firebase is out of bounds, not a "more real" target.

If the implementation run proves the journey here, these are the differences from a person's phone on the deployed hosting:

| Step this run takes                                                                                                         | The phone will not                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci` on this VM (Node 22.23.4 today; CI image is Node 26.13.0)                                                          | The phone does not install Node                                                                                                                                           |
| Java 21 already installed, used by the Firestore emulator                                                                   | The phone does not run the emulator                                                                                                                                       |
| `google-chrome --headless=new` at 390×844 (`tests/chrome-debug.js:79-83`)                                                   | A phone browser, online, with a real viewport                                                                                                                             |
| Auth and Firestore are the emulators. The helper fails the run if a request hits the production hosts                       | The phone uses the live project. This skill must not be that run                                                                                                          |
| `appCheckSiteKey` is still `REPLACE_WITH_RECAPTCHA_V3_SITE_KEY` (`public/firebase-config.js:13`). App Check is not attested | A later console key would change that. This stream does not                                                                                                               |
| Owner and project are created with rules disabled, because the app cannot bootstrap `users/{uid}`                           | An admin does that in the console. The skill's seed is the emulator stand-in for that admin step, and it is the one step the drive itself does not perform through the UI |
| Service worker `VERSION` is whatever `public/sw.js` says at the SHA under test                                              | A phone may still hold an older cache. Doctor compares the served file to the tree; it does not prove an upgrade from `v53` to a later version                            |

Forbidden stand-in: `python3 -m http.server` on `8765` or any other port. It skips the hosting CSP and the security headers `tests/emulator/security-headers.test.js` exists to check. If the hosting emulator will not start, the implementation run stops and says so. It does not switch servers and call the skill proved.

This plan run did not execute the skill. A never-executed skill is a draft. The implementation run is the execution the generator requires.

## 6. Files, blast radius, CI

### Files the implementation adds

- `.cursor/skills/verify-ahl-aljazeera-accounting/SKILL.md`
- `.cursor/skills/verify-ahl-aljazeera-accounting/features/README.md`
- `.cursor/skills/verify-ahl-aljazeera-accounting/features/login.md`
- `.cursor/skills/verify-ahl-aljazeera-accounting/features/ledger-entry.md`
- `.cursor/skills/verify-ahl-aljazeera-accounting/features/projects.md`
- `.cursor/skills/verify-ahl-aljazeera-accounting/features/offline-reopen.md`
- `.cursor/skills/verify-ahl-aljazeera-accounting/features/foremen.md`
- `scripts/verify-aj.js`
- `scripts/verify-aj.test.js` (required; run with `node --test scripts/verify-aj.test.js`)

Not touched, and why: `package.json` and `.github/workflows/ci.yml`. The ledger job does not run `npm test`. It lists files itself in the `node --test` step. `npm test` is a separate explicit list in `package.json`. v54 (PR #59) edits both lines. Wiring this test is a one-line append to each list, in a follow-up commit after rebasing onto `main` once v54 has merged. That follow-up does not add a fifth job and does not change the pass floor. This run leaves both files as they are. No `package.json` script is added for the helper. The skill body shows `node scripts/verify-aj.js`.

### Blast radius

What can break elsewhere:

- **CI quality job** if `scripts/verify-aj.js` fails ESLint or `tsc`, or if any new Markdown or JS fails Prettier. That is the real risk. `eslint .` does not lint `.cursor/**` (no matching block in `eslint.config.js`; unmatched files are not linted). `prettier --check .` **does** check `.cursor/**/*.md` and `scripts/**/*.js`, because `.prettierignore` does not exclude them. `npm run typecheck` **does** check `scripts/**/*.js` (`tsconfig.json:14`).
- **sw-version-guard** (`ci.yml:31-39`) only when `public/` changes. This diff does not.
- **secret-guard** (`scripts/secret-guard.sh`) flags private keys, PEM files, and service-account JSON. The emulator password literal is the same class of string the emulator tests already commit. Do not add a key file.
- **Ledger, browser, and emulator jobs** do not execute `scripts/verify-aj.js`. They stay green if the tree they already run is untouched.
- **Port 9099 / 8080 / 8765** during the proof. The proof must not run beside `npm run test:emulator` or the browser job's server. Cleanup after the proof, including after a failure.
- **`firebase.emulator.json`** left behind. Cleanup removes it. It is gitignored.

Cleared: no rules change, no hosting header change, no service-worker byte change, no `tests/browser-check.js` change, no `tests/shell-cache.test.js` change.

Before merge (implementation run, not this run): `git diff --name-only origin/main` is only the files in the list above, then `npm run lint`, `npm run format:check`, `npm run typecheck`. The pull request's four GitHub jobs are the rest of the proof. Do not add a fifth job.

### Inventory line, for a follow-up after the docs stream merges

Do not apply this in the skill PR.

Replace the `create-verification-skill` cell that today says «ناقصة» and "Add a project skill that drives login, one entry, an offline reopen, and a project delete…" (`docs/PSTACK_INVENTORY.md` Playbooks table) with:

```text
| `create-verification-skill` | «مطبّقة» | `.cursor/skills/verify-ahl-aljazeera-accounting/SKILL.md` and `features/` drive the hosting emulator. `scripts/verify-aj.js drive ledger-entry` logs in and saves one «مواد» row. `offline-reopen`, project delete, and «العُهد» are mapped and not driven yet. |
```

Replace the `authoring-a-skill` cell (`docs/PSTACK_INVENTORY.md` playbooks-in-poteto table) with:

```text
| `authoring-a-skill` | «مطبّقة» | `.cursor/skills/verify-ahl-aljazeera-accounting/SKILL.md` is one job (launch, doctor, drive, evidence, cleanup). It names when to run it (a screen change) and when not to (production Firebase, or a second emulator). |
```

Leave `maintain-verification-skill` as «ناقصة» until a maintain run actually drives the map again.

Branch for the implementation PR: `cursor/verify-skill-2de0`, based on current `main`. Not created in this run.

## 7. pstack

### 7.1 The 24 principles

| Principle                                            | How this work meets it                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `principle-attack-the-premise`                       | n/a. Trigger is two failed fixes that share a premise. Nothing has failed yet. If `drive ledger-entry` fails twice for the same reason, write that premise down before a third patch. Do not relax the journey.                                                                                                                                 |
| `principle-boundary-discipline`                      | Met. `localHost`, the production-host URL check, and `portOwnedByTree` are the boundary inside `scripts/verify-aj.js`. Feature files do not re-validate ports. The helper does not reimplement `Ledger.totals`.                                                                                                                                 |
| `principle-build-the-lever`                          | Met. One CLI is the lever. Feature files call it. They do not each spawn Chrome.                                                                                                                                                                                                                                                                |
| `principle-encode-lessons-in-structure`              | Met inside the helper: doctor fails when the served `sw.js` `VERSION` differs from the tree, and the drive fails when a request hits production Auth or Firestore. Not encoded as a new CI job. A fifth job would break the "4 checks" gate.                                                                                                    |
| `principle-exhaust-the-design-space`                 | Met in §2. Shape A versus a markdown-only skill versus Playwright WebKit. Arena was not run (banned, cost).                                                                                                                                                                                                                                     |
| `principle-experience-first`                         | Met. The proved path is the login form and «قيد جديد», the path a person uses. Five feature files, one of them proved, rather than a rough drive of every tab.                                                                                                                                                                                  |
| `principle-explain-the-number`                       | Met. The amount is the integer `1500000` IQD. The screen shows `1,500,000` because `Ledger.fmt` uses `toLocaleString('en-US')` (`public/ledger.js:313`). Negative profit uses U+2212 (`−1,500,000`). This is not a timing number.                                                                                                               |
| `principle-fix-root-causes`                          | Met as a rule for the implementation. A failed drive is fixed in the helper or reported as an app bug. The journey is not weakened, and `tests/browser-check.js` is not edited to match the helper.                                                                                                                                             |
| `principle-foundational-thinking`                    | Met. Launch, doctor, and the production-host guard come before the feature drive. This plan is the sketch those functions implement.                                                                                                                                                                                                            |
| `principle-guard-the-context-window`                 | Met. One JS file and five feature files. No app code in the diff.                                                                                                                                                                                                                                                                               |
| `principle-laziness-protocol`                        | Met. Reuse `openChrome`, `emulator-csp-config.js`, and the `app-entry` seed shape. No new dependency.                                                                                                                                                                                                                                           |
| `principle-make-operations-idempotent`               | Met. `cleanup` may run twice (dead pids are skipped). `launch` will not start a second emulator. Seed runs on an emulator that was started with no import, so it is not "create or reuse" against a dirty project. A dirty emulator is a failed launch, not a second seed.                                                                      |
| `principle-migrate-callers-then-delete-legacy-apis`  | n/a. No existing verification CLI to migrate. `tests/browser-check.js` stays the demo CI harness.                                                                                                                                                                                                                                               |
| `principle-minimize-reader-load`                     | Met. A cold agent reads `SKILL.md`, then one feature file. Selectors are in the feature file, not only in the JS.                                                                                                                                                                                                                               |
| `principle-model-the-domain`                         | Met. `RunRecord` is the run. Feature ids are `login`, `ledger-entry`, `projects`, `offline-reopen`, `foremen`. No new ledger type.                                                                                                                                                                                                              |
| `principle-never-block-on-the-human`                 | Overridden for this task. The user said plan only, and `AGENTS.md` says the plan is reviewed before code. The implementation run does not stop to ask which port hosting picked; it reads the hub.                                                                                                                                              |
| `principle-outcome-oriented-execution`               | Met. Done means the evidence files in §5 still exist after `cleanup`, and the four CI jobs are green. A skill file that was not executed is not done.                                                                                                                                                                                           |
| `principle-prove-it-works`                           | Met by the implementation run, not by this plan. Check the PNG bytes and the JSON fields. Do not treat "the script exited 0" as the only proof. Open `firestore.json`.                                                                                                                                                                          |
| `principle-redesign-from-first-principles`           | Applied. Trigger: integrating a verification requirement into a repo that already has `tests/browser-check.js`. Rebuilding the agent-facing path as its own helper, and leaving the demo CI harness alone, is the redesign. Patching `browser-check.js` to also log in would mix demo mode with the emulator and would collide with stream (c). |
| `principle-separate-before-serializing-shared-state` | Met. One run record, one emulator, one Chrome profile, one evidence directory per `runId`. `launch` refuses a second owner of `9099`.                                                                                                                                                                                                           |
| `principle-sequence-verifiable-units`                | Met. Order in the implementation run: (1) `localHost` / production-host guard, (2) `launch` until the login form is up, (3) `doctor`, (4) `drive ledger-entry`, (5) `cleanup`, (6) evidence still present, (7) lint, format, typecheck. Each one before the next.                                                                               |
| `principle-subtract-before-you-add`                  | Met. Nothing is removed, because the new path is not a rewrite of an old CLI. What was not added: a dependency, an npm script, a CI job, a python server, a Playwright browser, a `public/` change.                                                                                                                                             |
| `principle-test-behavior-not-implementation`         | Met. Assertions are the Arabic pill, the project card text, and the Firestore fields. Not " `commit` was called".                                                                                                                                                                                                                               |
| `principle-type-system-discipline`                   | Met. JSDoc on the helper, `checkJs` via the existing tsconfig. No `any`, no checkJs disable. `unknown` for raw CDP and hub JSON, narrowed in `localHost` and the hub parser.                                                                                                                                                                    |

### 7.2 Playbook skills the implementation run uses

| Skill            | Expected output                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `architect`      | This document is the sketch (usage, `RunRecord`, the four functions). Phase D fills in `scripts/verify-aj.js` against those signatures. A new parameter is a reason to stop and say the sketch was wrong. Arena stays off.                                                                                                                                                                                                                                                                                     |
| `figure-it-out`  | The workflow is the sequence in `principle-sequence-verifiable-units`. Done predicate is §5 plus a clean `git diff --name-only`. Rigor is high on the production-host refusal and on cleanup-leaves-evidence, lower on the prose of the three undriven feature files. No fan-out.                                                                                                                                                                                                                              |
| `blast-radius`   | Writeup in §6. The one safety fact is unproven until the implementation run shows the diff names and the three local quality commands. Do not claim the emulator job was re-proved by inspection if the diff is dirty.                                                                                                                                                                                                                                                                                         |
| `tdd`            | Required red check: `scripts/verify-aj.test.js` feeds `https://firestore.googleapis.com/...` and expects a throw. It failed first with `Missing expected exception`, then passed after `assertNoProductionUrl` and `localHost` threw. It is not in `npm test` and not in the ledger job's own `node --test` list. Both lists get a one-line append in a follow-up after v54 (PR #59) merges and this branch is rebased onto `main`. No fifth job. The pass floor stays. The user journey stays the live drive. |
| `interrogate`    | The skill fans out arena adversaries. Arena is banned for cost, so do not spawn that fan-out. One local adversary, in-process: `launch` twice and expect exit 2; pass a non-loopback `FIRESTORE_EMULATOR_HOST` and expect a throw; `cleanup` and then `test -f` the evidence files. Record the commands and the output. "No verified findings" is an acceptable result.                                                                                                                                        |
| `no-comments`    | After the helper exists, run comment-sicko on `scripts/verify-aj.js` only. Expected output: deletion count, anything restored, any constraint left open. Do not let it edit `public/` or `tests/`. Prefer no comment over an empty-catch narration. The repo's ESLint allows empty catches (`eslint.config.js:19`); that allowance is not a reason to add one.                                                                                                                                                 |
| `prove-it-works` | After `cleanup`, read `firestore.json` and confirm the three evidence files are still on disk. Screenshot files must be non-empty PNGs. This is the gate that turns the skill from a draft into the deliverable.                                                                                                                                                                                                                                                                                               |

`how` was the grounding for §1. It was done by reading the files cited above. Explorers were not spawned (same cost gate as swarm / arena).

## 8. Accounting questions for محاسب أهل الجزيرة

محاسب أهل الجزيرة, quoted:

> Counting an unsynced row in المصروف and الربح immediately is correct as long as it is visibly pending. Silently dropping a failed-send row is wrong. The over-settle sentence «يظهر كمتبقي معه» is ambiguous about direction.

Ameer declined those product suggestions. This stream does not change app behaviour. The journey asserts the screen the app already paints: the amount is exactly `1,500,000` (no rounding, thousands separators), الربح is `−1,500,000` with U+2212, the entry appears once and is still once after sync, a reload keeps the amount, the type «مواد», and the date, and المقبوض stays `0`. If the current screen does not do that, the run stops and reports it. It does not patch `public/`.

The journey does not record «دفعة عميل», «مقاول», a reversal, `projectFinance.contractAmount`, a CSV, or a settle. «العُهد» stays a map file only. The buttons already on screen are «+ سلفة جديدة», «+ مصروف من العهدة», «تسديد المستحق», and «استلام المتبقي» (`public/foremen.js`). The over-settle copy already on screen is «المبلغ أكبر من المستحق. الفرق يظهر كمتبقي معه.» The map names that sentence and does not add a second formula.

## 9. User-visible strings

None in the app. This stream does not edit `public/`.

The emulator fixture is visible inside the throwaway session only: project name «مشروع التحقق», entry note «قيد تحقق مواد», display name «مالك التحقق». Those strings are Firestore documents the helper writes, not new copy in `index.html` or `render.js`. They must not be added to the demo `seed()` in `public/app.js`.

CLI logs from `scripts/verify-aj.js` are terminal text. They are not shown in the PWA.

## 10. Implementation order (after review)

1. Branch `cursor/verify-skill-2de0` from `main`.
2. Add `scripts/verify-aj.test.js` for the production-host refusal. Run it. It fails.
3. Add `scripts/verify-aj.js` with the signatures in §2.2. The refusal test passes. `launch` reaches the login form or the run stops.
4. `doctor`, then `drive ledger-entry`, then `cleanup`, then confirm the evidence files.
5. Write `SKILL.md` and the five feature files so they match the commands that just ran. Run comment-sicko on the helper.
6. `npm run lint`, `npm run format:check`, `npm run typecheck`.
7. Commit, push, open the PR. Body sections follow `.github/pull_request_template.md`: Why, Plan, What changed, Scope, Blast Radius, Verification, 4/4 CI, Awaiting Ameer. Do not merge.

Quote §8 in that PR, including Ameer's decline of the product suggestions. Do not change ledger behaviour.

## Draft PR body (not posted)

Paste this when the branch is pushed with the post-#59 test-list appends. These seven wiring mutations still survive the unit tests, because each one needs a live emulator, a Chrome page, or a real pid. The pure-function tests do not reach the call site.

1. **Drive-failure network check.** Delete the `catch` in `driveLedgerEntry` that stores the error and the following `finishSession` call. A drive that throws before the end never writes `network.txt`, so a production request during a failed drive is not recorded.
2. **adoptEmulatorHost, Auth.** Make `adoptEmulatorHost` assign `FIREBASE_AUTH_EMULATOR_HOST` even when the caller already set a non-loopback value. `seed` then overwrites it instead of refusing.
3. **adoptEmulatorHost, Firestore.** The same overwrite for `FIRESTORE_EMULATOR_HOST`.
4. **Pid identity check.** Make `signalIfOurs` call `signalGroup` without comparing `/proc/<pid>` start time and command line. Cleanup can signal a recycled pid.
5. **Home omits the row.** Remove both checks that throw when `#main` contains `قيد تحقق مواد`. Home can list the saved row and the drive still exits 0.
6. **Launch call site, launchBlock.** Skip the `launchBlock` call that exits 2 when an emulator or port `8765` is already up. A second `launch` no longer refuses.
7. **Launch call sites, page and CSP.** Remove the `urlModeOk(location.href)` check after navigation and the `cspOk` call on the hosting response. A page with `?role=owner`, or a hosting response without the emulator CSP, is treated as ready.
