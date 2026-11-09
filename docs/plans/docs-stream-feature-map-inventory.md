# Docs stream plan: feature map and inventory

This file is the sketch Architect approved with four amendments. EA then approved that sketch. The implementation commit cites `f718c8d995c7bae378a7380b802e90aa02afabaa`. No file under `public/` is edited. `public/sw.js` is not bumped. `firestore.rules`, tests, and app code are not edited.

## In my words

Ameer wants a map a later reader can trust. Each screen should point at the modules that draw it, the data it reads, and the tests that already drive it. He also wants every «ناقصة» inventory row sorted. A row that a document can close stays in this docs stream. A row that needs code or a behaviour change goes back to the queue. The problem is that a docs change can still be mistaken for a product change, or can collide with the other agent's `ensureFirebase` timeout and service-worker v54 work. The smallest change that meets the ask is one reference page, plus inventory rows whose evidence is in that same diff. Nothing under `public/` moves.

## Tip

`main` is `f718c8d995c7bae378a7380b802e90aa02afabaa` (`f718c8d`, "Keep a saved person when the directory refresh fails (#57)"). `git fetch origin main` on 2026-11-09 returned the same SHA. `gh pr list --state open` returned no open pull requests from this environment. The v54 work is not in this checkout. Line numbers below are from this SHA. If that other pull request merges first and edits `public/firebase-client.js` or `public/render.js`, the implementation pass re-reads those lines before it cites them. It still does not edit those files.

## Gates

From `AGENTS.md` lines 5-12.

- Ameer approves every merge.
- Ameer approves every behaviour or rules change.
- All 4 CI checks green.
- No spending.
- The plan is sketched before the docs are written. Code waits for Architect and EA. This stream writes no app code either way.
- Accounting advisor when a plan raises an accounting question. See the accounting section. No opinion is invented here.

`arena` is banned (`AGENTS.md` line 37). `swarm` needs Ameer's cost approval (`AGENTS.md` line 30). Those two bans are why this sketch was not farmed out to extra models.

## Recall

Scope of the sweep: this ledger repo, the docs stream named in the request, checked with `git rev-parse HEAD`, `git fetch origin main`, and `gh pr list --state open`. Chat transcripts were not mined. The request already named the SHA, the parallel code PR, and the file limits.

Capsule:

- This is a docs plan on `main` at `f718c8d`. It is not started as a branch.
- No open pull request was visible from this environment.
- The other agent owns the `ensureFirebase` timeout and `sw.js` v54. This stream does not touch `public/`.
- `docs/PSTACK_INVENTORY.md` has 43 «ناقصة» rows. Seven can close in the docs pull request. `recall` stays «ناقصة». The rest are classified below.
- Next move: after Architect and EA review, write `docs/feature-map.md` and the inventory edits on `cursor/docs-feature-map-a2af`.

Threads:

- `[planned, not started]` feature map and the inventory edits. This file is the sketch.
- `[merged #57]` saved person kept when the directory refresh fails. That commit is `main`.
- `[merged #34]` Layout A recorded in `docs/phase-2-module-map.md`.
- `[merged #35]`, `[merged #36]`, `[merged #37]` the three Layout A file moves.
- The v54 branch was not visible here. It is another agent's work, not an open PR in this `gh` result.

Problems:

- `README.md` line 22 still says the service worker cache is `aj-p0-v41`. `public/sw.js` line 1 is `aj-p0-v53`. Do not "fix" that sentence here. The other agent is about to change the version.
- `docs/PSTACK_INVENTORY.md` still lists `public/session.js` among the strict files that lack a type choice. `tsconfig.strict-session.json` and `tests/strict-session.test.js` already exist. Correct the sentence. Leave the row «ناقصة».
- The code-map stop named in the `pause-safely` row has no resume note in the repo. The facts are not here to reconstruct.

This capsule was written after the files were read. The facts above were checked with git and `gh`. A brief written after the reads is not the `recall` skill's output. The row stays «ناقصة».

## What the later pull request writes

One branch, `cursor/docs-feature-map-a2af`, off the then-current `main`. One pull request. Base `main`. Not stacked on the v54 branch. The user asked for a sequence only if the diff is large. This scope is two markdown files plus a one-line README link. One pull request is enough.

Files:

- `docs/feature-map.md`, new. Reference only. See the mode note below.
- `docs/PSTACK_INVENTORY.md`, status and next-step edits for the rows this diff actually closes, plus the `session.js` wording fix. Recount the header totals from the table after the edit.
- `README.md`, one link to the feature map, placed with the existing command block. Do not change the `aj-p0-v41` sentence. Do not copy the command block into the feature map.
- This plan file, committed with the docs so the sketch is in the diff. It stays a sketch. It is not rewritten into a second feature map.

Out of the diff: `public/**`, `firestore.rules`, `firebase.json`, `tests/**`, `package.json`, `tsconfig*.json`, `.github/workflows/ci.yml`.

### Two shapes for the feature map

Shape 1, chosen. One reference file, `docs/feature-map.md`. Screens, data, and tests live in that file. The Layout A comparison is a short quote plus a link to `docs/phase-2-module-map.md`, not a second argument. `README.md` keeps the commands.

Shape 2, not chosen. One markdown file per screen under `docs/features/`. Same facts, more files, and the same risk that a screen page starts repeating the README commands. `principle-laziness-protocol` says the smallest change that solves the problem. One file is that change. The user also named `docs/feature-map.md` as the example path.

`technical-writing` picks one mode per landed document. The feature map informs a reader who already works the ledger and needs a fact. That is reference. It describes. It does not teach a procedure, and it does not argue. The A versus B record is already an explanation in `docs/phase-2-module-map.md`. The feature map quotes the recorded sentences and links there. If Architect says a quote inside the reference is still a mixed mode, drop the quote and leave only the link. Do not add `docs/flush-remote.md` unless Architect asks for a separate explanation. The flush facts the inventory asks for are reference facts (callers, writes, tests, on-screen strings) and fit the feature map.

`how` wanted explorer subagents and an explainer subagent. They were not spawned. No spending, and the arena ban, override that fan-out. The grounding below is from reading the files at this SHA.

## Feature map to copy into `docs/feature-map.md`

Reference. Each screen names the hash or the DOM id, the functions, the data, and the tests. Citations are `file:line` at `f718c8d`.

Shared shell, not a hash:

- Markup is `public/index.html`. Boot splash `#boot` is lines 16-19. Login `#login` is lines 20-33. App shell `#shell` is lines 35-59. The bell is lines 38-44. The demo role `<select id="role">` is lines 47-51. The three static tabs are lines 54-58 (`home`, `entry`, `projects`). People and foremen tabs are inserted later.
- Script order is `public/index.html` lines 61-72. `ledger.js`, `sync.js`, `sync-status.js`, `dom-safe.js`, `appcheck.js`, `firebase-config.js`, `session.js`, `firebase-client.js`, `foremen.js`, `people-dir.js`, `render.js`, `app.js`.
- `public/sw.js` line 1 is `VERSION = 'aj-p0-v53'`. `ASSETS` and `SHELL` are lines 2-4. `isShell` is line 7. This stream does not change that version.
- Screen dispatch is `renderScreen` in `public/render.js` lines 931-984. Unknown hashes fall through to `home` at line 942. `render` at lines 985-997 catches a throw and shows `PeopleDir.RENDER_ERROR` (`public/people-dir.js` line 17).
- Click dispatch starts at `public/render.js` line 999. Login submit is lines 1194-1226.

### Boot, demo, and login

What the person sees. A cold open shows «أهل الجزيرة» and then either the login form or the ledger. `?role=owner` and `?role=site` skip Firebase and open the demo. A normal visit shows «تسجيل الدخول».

Code:

- `seed` is `public/app.js` line 21. It fills the demo rows once.
- Demo boot after `seed()` is `public/app.js` lines 162-168. `demoRole` is `public/session.js` line 87. It accepts only `owner` and `site`.
- Signed-in reopen and Firebase login timeout are `public/app.js` lines 90-160. `LOGIN_MS` is line 5 (20000). `withTimeout` is line 6. `isPoison` is line 15. A live session calls `flushRemote()` at line 150.
- Service worker registration is `public/app.js` line 170.
- `showLogin` and `showApp` are `public/session.js` lines 118-119. `enterSession` is line 309. `closeSession` is line 276. Logout button is `public/render.js` lines 1037-1040.
- Email sign-in is `public/render.js` lines 1194-1226, calling `fb.signIn` from `public/firebase-client.js` line 70.
- Suspended, dead session, and missing profile strings are `public/session.js` lines 17-20.

Data. Demo database name `aj-p0`. Signed-in database `aj-u-<uid>`. Stores `projects`, `entries`, `outbox`, `meta` (`public/session.js` lines 2-4 and 32-37). Auth session is Firebase Auth, not those stores. Cache keys are the `K` object at `public/session.js` line 5.

Tests:

- `tests/browser-check.js` lines 25-33 (login shell, empty submit) and the `?role=` screen list at lines 20-22.
- `tests/emulator/logout-fields.test.js` (login fields empty after logout).
- `tests/emulator/offline-cold-start.test.js` (signed-in startup skips the form, signed-out stays on it).
- `tests/emulator/login-relogin.test.js`.
- `tests/emulator/session-live.test.js`.
- `tests/session-get.test.js` (`enterSession` accepts owner and site).
- `tests/shell-cache.test.js` (classic script order and precache).
- `tests/sw-cache.test.js` and `tests/emulator/security-headers.test.js` (shell still boots).

### Home (`#home`)

`views.home` is `public/render.js` lines 426-444. Owner sees received, spent, and profit from `Ledger.totals` (`public/ledger.js` line 27) and a CSV button. Site sees today's spend on assigned projects and the last three own entries. Both see the connection pill (`connectionLabel`, `public/render.js` line 417) and the example banner when the rows are demo data.

Data. `K.entries`, `K.projects`, `K.sessionUser`. No Firestore read on this paint. Totals are derived.

Tests. `tests/browser-check.js` checks `o1: totals shown` and `s1: own client payment listed`. `tests/ledger.test.js` covers `totals`, negative profit, and the empty ledger.

### New entry (`#entry` and `#entry/<projectId>`)

`views.entry` is `public/render.js` lines 445-485. Types come from `Ledger.ENTRY_TYPES` (`public/ledger.js` lines 9-15). Labels are مصروف, مواد, عمالة/سلفة, مقاول, دفعة عميل. With the default policy a site user sees all five. «مقاول» is included because the role is site. Client payment is included because `DEFAULT_POLICY.siteCanCreateClientPayment` is true (`public/ledger.js` lines 17-18). The owner-only «من عهدة» select is lines 462-468. Save is the `#save` handler at `public/render.js` line 1061, which commits through `commit` at line 272. Amount chips are lines 1020-1033. `MAX_AMOUNT_IQD` is `10000000000` in `public/ledger.js` (the inventory and `tests/rules-constant.test.js` name that constant). `parseAmount` is `public/ledger.js` line 133. `validateEntry` is line 170.

Data. A new row is appended in `K.entries` and its id is appended to `K.outbox`. There is no `syncState` field (`public/sync.js` lines 1-2). Server collection is `ledgerEntries` (`collectionFor`, `public/sync.js` lines 23-31). Rules match is `firestore.rules` line 62. Entries are not updated or deleted there.

Tests. `tests/browser-check.js` `o2` and `s2` (five types, no «من عهدة» for site, payee input). `tests/ledger.test.js` (direction, amount ceiling, reversals, party name, foreman expense). `tests/emulator/app-entry.test.js` (createdByName, partyName, save during a pull). `tests/emulator/rules.test.js` `testSeq` cases from line 116 (create, no update, no delete, amount ceiling, partyName, createdByName).

### Projects (`#projects`) and one project (`#project/<id>`)

`views.projects` is `public/render.js` lines 486-507. Owner can switch open and archived (`data-list`, handler at line 1111). Site has no archive filter. `views.project` is lines 508-525. Owner sees the contract field, received, spent, and profit. Site sees spent and a by-type split, and no contract. «إدارة المشروع» is lines 519-521, only when `Ledger.can(u, 'manageProject')` (`public/ledger.js` line 76). New project button handler is line 1155. Contract save is `saveContract` at line 131.

Data. Projects live in `K.projects` and Firestore `projects` (`firestore.rules` line 169). `contractAmount` is not stored on the project after save. It is `K.finance` / `projectFinance/{projectId}` (`public/session.js` line 5, `firestore.rules` line 216). `README.md` line 20 says the same split. Site does not query `projectFinance`.

Tests. `tests/browser-check.js` `o3`, `o4`, `s3`, `s4` (assigned projects, contract shown or hidden, manage button placement). `tests/owner-access.test.js` (finance copy, site drops money). `tests/emulator/rules.test.js` archive and restore at line 275, leftover `contractAmount` at line 419, site cannot read `projectFinance` at line 395. `tests/ledger.test.js` archived projects leave the open list.

### All entries (`#entries/<projectId>`) and entry detail (`#detail/<id>`)

`views.entries` is `public/render.js` lines 526-536. The comment there says the list reads the local cache, 50 more rows at a time (`#more-entries`, line 1057). `Ledger.projectEntryList` is `public/ledger.js` line 469. `views.detail` is `public/render.js` lines 564-596. Print, PDF, and file buttons are in that view. Handlers for print and PDF are line 1099. CSV for one entry uses `downloadCsv` and `saveEntryFile` (`public/render.js` lines 347 and 359) and `Ledger.entryToCSV` (`public/ledger.js` line 418).

Data. Local `K.entries` only for the list. Export fields are derived. A row with a sync error hides the export buttons (`public/render.js` lines 591-595).

Tests. `tests/browser-check.js` `o4` and `s4` include «عرض جميع القيود». `tests/ledger.test.js` covers the project entry list, paging in memory, and entry CSV. `tests/dom-safe.test.js` covers hostile ids in the detail href.

### Reversal

The button is `data-rev` in `entryRow` (`public/render.js` line 414). The click path starts at line 1011. `Ledger.makeReversal` is `public/ledger.js` line 262. `reversalId` is line 256 (`rev_` plus the original id). A reversal is a new row. The original stays.

Data. Same `ledgerEntries` collection. Rules reject a second reversal and a reversal of a reversal (`tests/emulator/rules.test.js` lines 190 and 203).

Tests. `tests/ledger.test.js` reversal cases. `tests/browser-check.js` site reverse buttons only on own rows. `tests/emulator/app-entry.test.js` lost reversal race. `tests/sync-status.test.js` line 103.

### People (`#people`, `#person`, `#person/<uid>`)

`views.people` is `public/render.js` lines 537-542. `views.person` is lines 543-563. Owner only. Help text is `UID_HELP` at line 121. The app does not create Auth users. Save is `savePerson` at line 176, handler at line 1162. The tab is inserted by `syncPeopleTab` at line 695.

Load policy is `public/people-dir.js`. `createLoader` is line 152. `loadPlan` is line 64. `SUCCESS_TTL_MS` is line 12 (30000). Offline lead is line 13 (`غير متصل`). Failed refresh lead is line 14 (`تعذّر التحديث`). `syncNote` at lines 108-109 returns `lead + ' · آخر تحديث: ' + time`. `render.js` calls the loader from `ensureDirectory` (line 230) and `refreshDirectory` (line 260). `renderScreen` line 983 refreshes when the owner is on the people screens and not in demo.

Data. Local `K.users` and `K.peopleSynced`. Server `users/{uid}` (`firestore.rules` line 199). A failed load does not write `K.users` (`public/people-dir.js` lines 1-2).

Tests. `tests/people-dir.test.js` (one `listUsers` on a failed render, stale generation, cooldown, offline versus failed copy). `tests/browser-check.js` `o5` (UID instructions and project checkboxes). `tests/emulator/rules.test.js` line 222 (site cannot write users, owner cannot delete a user). `tests/owner-access.test.js` assignment.

### Subcontracts (`#sub/<id>`, `#subnew/<projectId>`, `#amend/<id>`)

`views.sub` is `public/render.js` lines 597-631. `views.subnew` is lines 632-653. `views.amend` is lines 654-677. Owner only on these screens. Cards on the project use `subcontractSection` at line 39. Balance is `Ledger.subcontractBalance` (`public/ledger.js` line 323). «مسدّد بالكامل» is derived. It is not a stored field. The screen says so in the sense that the badge is painted from `subFigures` (`public/render.js` line 20) and the tests assert the stored keys.

Data. `K.subcontracts`, `K.terms`, `K.amendments`. Server collections `subcontracts`, `subcontractTerms`, `subcontractAmendments` (`firestore.rules` lines 230, 250, 273). `collectionFor` routes them at `public/sync.js` lines 29-30. Amounts stay off the name document (`public/sync.js` `stripMoney` at line 140, `termsPayload` at line 152).

Tests. `tests/browser-check.js` subcontract checks from line 131 (bars, badge, no link control, overpayment warning). `tests/ledger.test.js` derived balance and unlinked «مقاول» rows. `tests/owner-access.test.js` site reads names only. `tests/emulator/rules.test.js` line 472.

### Archive, restore, and permanent delete

`deleteConfirm` is `public/render.js` line 768. `manageChoice` is line 782. Archive confirm is line 1121. `deleteProjectNow` is line 822. `Ledger.nextProjectStatus` is `public/ledger.js` line 88. `Ledger.foremanDeleteBlock` is line 617. A counted foreman expense blocks the delete. `Sync.projectDeleteBatches` is `public/sync.js` line 504. `Sync.exactProjectName` is line 468. `Sync.dropProjectLocal` is line 542.

Data. Server delete removes the project, its ledger rows, `projectFinance/{projectId}`, and that project's subcontracts, terms, and amendments. Foremen and foreman moves stay (`tests/project-delete.test.js`). The dialog copy at `public/render.js` lines 780 says the delete is final and there is no backup the app keeps.

Tests. `tests/project-delete.test.js`. `tests/emulator/rules.test.js` line 554. `tests/browser-check.js` site has no project management (`s4`).

### Foremen (`#foremen`, `#foreman/<id>`, `#foremannew`, `#foremanmove/<id>`)

`ForemenUI.install` is `public/foremen.js` lines 17-27. It assigns `views.foremen`, `views.foreman`, `views.foremannew`, and `views.foremanmove`. The tab glyph is `syncForemenTab` in `public/render.js` line 725. `onClick` is `public/foremen.js` line 322. A save calls `flushRemote` at line 331. Balance is `Ledger.foremanBalance` (`public/ledger.js` line 511). `settleGuard` is line 591. `validateForemanMove` is line 538.

Data. `K.foremen` and `K.foremanMoves`. Server `foremen` and `foremanMoves` (`firestore.rules` lines 299 and 321). `collectionFor` uses `docType` (`public/sync.js` lines 25-26). That tag is local. The petty-cash plan records that it is not sent.

Tests. `tests/foremen-ui.test.js`. `tests/ledger.test.js` from the `foremanBalance` case onward. `tests/strict-foremen.test.js`. `tests/emulator/sync.test.js` (a move, its reversal, and an entry with `foremanId`). `tests/emulator/rules.test.js` from line 653. `tests/sync-status.test.js` SS1 through SS6 and T-FC1.

### Bell, outbox, and flush

`paintBell` is `public/render.js` lines 881-922. «إرسال الآن» is line 1036. Demo calls `sendNow` (line 278). A signed-in user calls `flushRemote`.

`flushRemote` is `public/firebase-client.js` line 366. It returns immediately when `deleteLock` is set, when `demoRole()` is set, or when there is no `K.sessionUser` (lines 367-368). One `flushing` promise is reused (line 369). After `FLUSH_MS` (line 306, 20000) the notice is `SEND_RETRY` or `PULL_RETRY` (lines 307-308 and 381-386). Those strings are `تعذر الإرسال. أعد المحاولة` and `تعذر التحديث. أعد المحاولة`.

Callers at this SHA:

- `public/app.js` line 150, after a restored session.
- `public/session.js` line 319, inside `enterSession`.
- `public/firebase-client.js` line 593, when a new id was queued during the flush.
- `public/foremen.js` line 331.
- `public/render.js` lines 47, 149, 276, 864, 1036, 1160, and 1241.

`performFlush` is `public/firebase-client.js` line 453. It refreshes the id token (line 465), refreshes the profile (line 478), calls `Sync.flushOutbox` with `write: fb.writeLocal` (lines 500-502), applies `SyncStatus.applyFlush` to `K.outbox` and `K.syncErrors` (lines 543-546), flushes project status (line 557), then `fb.pull` (line 566). A dead session calls `holdSession` with `SESSION_DEAD_MSG`. A kept id sets `syncNotice` to `SEND_RETRY` (line 548). Badge HTML is `SyncStatus.badgeHtml` (`public/sync-status.js` line 174).

Tests. `tests/emulator/sync.test.js` (one server row on a resend, concurrent double flush, seed rows not uploaded). `tests/emulator/offline-reconnect.test.js` («إرسال الآن» sends once). `tests/sync-status.test.js` (Arabic error versus «لم يُرسل», dead session stays queued). `tests/browser-check.js` line 30 (rejected sync badge). `tests/emulator/incremental-pull.test.js`.

This section is the inventory evidence for `how` and for `teach`. `how` asked who calls `flushRemote`, what `performFlush` writes, and which tests cover it. `teach` asked for those callers and what a failed send looks like on screen. The strings and the badge tests are that screen fact.

### CSV export from home

The `#csv` handler is `public/render.js` line 1104. `Ledger.toCSV` is `public/ledger.js` line 286. `canExportCSV` is line 296 (owner and active). Site does not get the button (`views.home` lines 430-443).

Tests. `tests/ledger.test.js` CSV cases (owner only, BOM, formula guard, party name).

### What is not a separate screen

App Check (`public/appcheck.js`, `initAppCheck` line 38) and `public/firebase-config.js` have no screen. `public/dom-safe.js` is the escape and id check the screens call (`escapeHtml` line 14, `projectButton` line 64). Tests are `tests/appcheck.test.js`, `tests/strict-appcheck.test.js`, `tests/dom-safe.test.js`, `tests/strict-dom-safe.test.js`.

## Layout A versus Layout B

The record has two layers. The tradeoff text is in the repo. Ameer's own chat sentence is not.

Readable original. Commit `a2944b4` ("Add a Phase 2 module map with two layouts and no code split") is the earliest copy of `docs/phase-2-module-map.md` in this clone. It says the split waits until one layout is chosen, and "Do not start the file split in the same step as the pick."

Layout A, from that commit:

> Split `app.js` by ownership, still as classic scripts, still as globals.
>
> `index.html` gains script tags in that order. `ASSETS` and `SHELL` gain the same names. One service worker bump per pull request that adds a file. Tests that call `Ledger`, `Sync`, `SyncStatus`, `DomSafe`, and `AJ` keep working. This is the smaller blast radius. The cost is more globals and a longer precache list.

Layout B, from that commit:

> `app.js` becomes `type=module` and imports ledger, sync, and the Firebase SDK. The UMD wrappers can stay so Node tests keep `require('../public/ledger.js')`, or the tests move to `import`.
>
> The precache list can shrink if the module graph is bundled into one file, or grow if each module is its own URL. Either way `ASSETS` changes and `VERSION` bumps. The browser checks that eval `Ledger` and `AJ` as globals break until those names are still published. This is the larger blast radius and the cleaner long-term import graph. It should not be the first cut.

Same commit, "What not to do in the same change":

> Layout A can land one file at a time. Layout B wants a single pull request that updates the script tag, the precache list, and the tests together, after Layout A has made `app.js` boring.

That is the reason the map itself gives for not cutting with B first. It is a blast-radius reason, written before the file split.

What this clone does not contain. `docs/phase-2-module-map.md` and pull request #34 name original commit `fa7192fafeb6431d17468736a2a78f306578d43a`. `git show` of that object failed in this clone. Pull request #34's body attributes the same tradeoffs to `fa7192f`. The sentences quoted above are from `a2944b4`, which is present.

The choice. Current `docs/phase-2-module-map.md` lines 9-15, `docs/PSTACK_INVENTORY.md` on `principle-exhaust-the-design-space`, and pull request #34 say Ameer chose Layout A (plain-script modules, one per PR, ES modules only later if proven safe and with his approval), per Ameer in chat with EA, 2026-11-03 10:39 Baghdad, before #35 merged at 10:53 Baghdad. The chat transcript is not in the repo. The repo does not quote a further reason from Ameer beyond that sentence. Do not invent one.

Pull request #35's body says: "First Layout A file, from `docs/phase-2-module-map.md`." and "No ES modules." and "Layout B (ES modules) was not used." The files that landed are `public/session.js` (#35), `public/firebase-client.js` (#36), and `public/render.js` (#37). `AGENTS.md` does not discuss Layout A or Layout B. `docs/plans/` did not exist before this sketch.

`principle-exhaust-the-design-space` is already «مطبّقة» for this decision. This docs stream does not reopen it and does not switch the app to modules.

## Every «ناقصة» row

Counted from `docs/PSTACK_INVENTORY.md` at this SHA. 43 rows. Header says 25 «مطبّقة», 43 «ناقصة», 13 «لا تنطبق», 0 for Ameer. After the edits below, recount. Do not flip a row whose evidence is not in the diff.

### Closes in the docs pull request

The evidence is `docs/feature-map.md`, this plan once it is committed, the README link, or the pull request body.

| Skill               | What closes it                                                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `how`               | Feature map section "Bell, outbox, and flush". Callers, `performFlush` writes, tests.                                                                          |
| `teach`             | Same section. Callers plus the on-screen strings `SEND_RETRY`, `PULL_RETRY`, and `badgeHtml`.                                                                  |
| `technical-writing` | Feature map is reference. README keeps the commands and gains one link. The feature map does not repeat the command block.                                     |
| `in-your-own-words` | The pull request `## Why` restates the goal and the problem in the author's words, before the file list.                                                       |
| `opening-a-pr`      | Closes only when the pull request body has a line that lists the template headings it uses. The draft below has that line.                                     |
| `unslop`            | Closes only when the pull request body records the scan, what it checked, and what it changed, or "no hits". The draft below has that line.                    |
| `poteto-mode`       | This task names one bundled playbook, `investigation`. Gates that win where they conflict: no merge, no `public/` edit, no spending, so no arena and no swarm. |

Seven rows. Proposed header after this pull request, if nothing else flips: 32 «مطبّقة», 36 «ناقصة», 13 «لا تنطبق», 0 for Ameer. Recount these four numbers from `docs/PSTACK_INVENTORY.md` at implementation time.

`recall` stays «ناقصة». The capsule in this file was written after the reads. That brief is not the skill's output.

`show-me-your-work` stays «ناقصة». Correct its next step only. Drop `public/session.js` from the remaining list. Cite `tsconfig.strict-session.json` and `tests/strict-session.test.js`. The files still without a strict pass are `public/firebase-client.js`, `public/app.js`, and `public/render.js`. No type choice exists for those three, so a TSV cannot record a proof. That correction does not change the counts.

### Docs can close them later, not in this pull request

| Skill              | Doc that would close it                                                                                                                                                                                              | Why it waits                                                                                                                                                                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `multi-phase-plan` | A later `docs/plans/strict-remaining.md` with one phase per remaining strict file (`public/firebase-client.js`, then `public/app.js`, then `public/render.js`), each ending in `tsc` exit 0 and the existing suites. | This stream is the feature map. The playbook's own skeleton also asks for swarm lanes and a perf gate. Swarm needs cost approval, and there is no perf number here. A plain phase list is the inventory's next step. It is a separate docs pull request if Ameer wants it. |
| `session-pickup`   | The implementation turn writes the branch, the SHA, what landed, and the resume point before it opens a file.                                                                                                        | This planning session already opened files. This file cannot be that evidence.                                                                                                                                                                                             |
| `babysit`          | On the docs pull request, declare `check` (docs, not `drive`), watch the four jobs to green, and leave the merge for Ameer. Flip the row only after those four are green.                                            | The first commit cannot honestly say the watch already happened.                                                                                                                                                                                                           |

### Back to the queue

These need code, a test, a new skill, a measured run, or a later product change. They are out of this stream.

| Skill                                      | Why a document does not close it                                                                                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `principle-attack-the-premise`             | The skill applies the next time two fixes fail the same gate. No such pair is recorded. A note that says "none yet" does not do the skill.                                                     |
| `principle-never-block-on-the-human`       | The row's next step is the `public/firebase-client.js` strict pass choosing its type shape in that pull request. This plan does not choose that type.                                          |
| `principle-redesign-from-first-principles` | The next step is a write-up before the next feature that does not fit `public/ledger.js` and `public/sync.js`. This stream adds no feature.                                                    |
| `benchmark-checklist`                      | No sync time or test duration is treated as a result here.                                                                                                                                     |
| `correct`                                  | The next step is a test that fails when two classic scripts declare the same top-level `const`. Tests are out of scope.                                                                        |
| `create-formal-verification-skill`         | A new project skill. That is an agent-behaviour change, and Ameer approves those. When it is written it also raises an accounting question (amount ceiling and delete order). Not this stream. |
| `interrogate`                              | The skill fans out adversaries through `arena`, and a finding counts only when a run proves it. `arena` is banned. No spending. A single written review would not match the skill.             |
| `maintain-formal-verification-skill`       | It waits on the formal skill, then on a pull request that changes `flushOutbox` or `projectDeleteBatches`.                                                                                     |
| `maintain-verification-skill`              | It waits on the verification skill, then on a screen or sync change.                                                                                                                           |
| `no-comments`                              | The next step edits comments in `public/app.js`, `public/sw.js`, `public/session.js`, and `public/firebase-client.js`, or encodes them as tests. Both are out of scope.                        |
| `poteto-help`                              | It closes when a later question is answered by naming one skill and stopping. This task is not that question.                                                                                  |
| `reflect`                                  | Three review subagents, then lesson files under `.cursor/skills/`. Not `docs/`. Also a cost.                                                                                                   |
| `statechart`                               | The skill's deliverable is a TLA+ spec checked by its script. The first run installs TLC. A Mermaid picture in `docs/` does not close the row.                                                 |
| `swarm`                                    | The next step is to not fan out unless Ameer approves the cost. Writing that sentence does not apply the skill. This stream does not fan out.                                                  |
| `why`                                      | The next non-obvious type gets a sentence before the JSDoc. That happens in a type change.                                                                                                     |
| `autonomous-run`                           | This session is not an unattended run. The predicate is written at the start of that run.                                                                                                      |
| `autopilot-stack`                          | The next dependent change is one owner's stack. This docs pull request is separate from v54 on purpose.                                                                                        |
| `bug-fix`                                  | No bug is being fixed.                                                                                                                                                                         |
| `feature`                                  | No new user-visible behaviour. The acceptance check belongs to that behaviour.                                                                                                                 |
| `perf-issue`                               | An emulator timeout is the other agent's code pull request. This stream does not measure it.                                                                                                   |
| `prototype`                                | No screen is being replaced.                                                                                                                                                                   |
| `refactoring`                              | The `public/firebase-client.js` strict pass freezes behaviour and lands types. Code.                                                                                                           |
| `runtime-forensics`                        | No failing emulator run is in hand.                                                                                                                                                            |
| `shipping`                                 | No merge is requested. Ameer merges. The cache bump in that playbook applies only if `public/` changed. This diff does not.                                                                    |
| `trace-forensics`                          | No sync bug is being traced.                                                                                                                                                                   |
| `visual-parity`                            | No screen change to compare with `tests/browser-check.js`.                                                                                                                                     |

`create-verification-skill` and `authoring-a-skill` are not edited. A separate verification-skill stream owns those rows. This plan does not change their status or their next step.

### Flag for Ameer, not decided here

`figure-it-out` is «ناقصة». Its next step is "write the module sketch/plan before the next split or design work." This file plus `docs/feature-map.md` are a sketch of the current screens. Pull request #34 already had a module map and still left this row open, with the next step pointed at the following sketch. So it is not obvious that a feature map is the sketch that row means. Do not flip it unless Ameer says the feature map is that sketch. If he says yes, the evidence is this file and `docs/feature-map.md`, and the header becomes 33 «مطبّقة» and 35 «ناقصة». Recount from the inventory file at implementation time.

`investigation` was used for this read-only answer. `AGENTS.md` triggers it for a cited read-only question. The inventory next step is different. It asks for the next unexplained emulator failure, with the command, the log line, and the owning file. This plan is not that failure. Do not flip the row. Ameer can say the read-only use is enough. Until then it stays «ناقصة».

`pause-safely` says the code-map stop still has no note in the repo. A resume note would be docs. The branch, the SHA, what was verified, and the first action are not in the repo. Do not invent them. Ameer has to supply those facts, or the row stays «ناقصة».

Doubtful «لا تنطبق» rows. They stay as written until Ameer says otherwise. The reason on each is close to "this skill does not touch the ledger" or "the repo has no file of that kind," which the inventory itself says is not enough ("Not used" and "was not run" are not reasons).

| Skill           | Reason in the inventory                                                            | Why it is doubtful                                                                                           |
| --------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `bro`           | It only restates a chat message and does not describe, test, or change the ledger. | That is "the skill was not applied," not a missing product part.                                             |
| `ketchup`       | It recaps a chat and does not read or change the ledger.                           | Same.                                                                                                        |
| `ketchup-video` | No video surface, and the skill does not exercise the ledger.                      | The skill is a subtitled chat recap. "The product has no video" answers a different skill.                   |
| `setup-pstack`  | The repo has no model configuration. The ledger does not choose a model.           | The skill writes which models an agent uses. Absence of the file is not proof the ledger can never have one. |
| `sharpen`       | No prompt file or task file. The source is the ledger.                             | Same shape. "We do not have a prompt file" is not a product gap the skill requires.                          |

These five are not moved to "For Ameer to decide" in the docs pull request. Moving them is a status decision. The table above is the flag.

The other «لا تنطبق» rows are left alone. `arena`, `automate-me`, `autopilot-full`, `orchestrate`, and `worktree-cleanup` are banned in `AGENTS.md`, which is an owner decision already. `make-bot-ui` names a missing product surface (no bot UI). `eval` and `hillclimb` name a missing eval set and a missing scored prompt. Those three reasons say what the product does not have. They are not re-decided here.

## Pull request shape

One docs pull request. Title, conventional commit style, `docs(map): list screens and close the docs inventory rows`. Branch `cursor/docs-feature-map-a2af`. Ready for review, not draft. Merge waits for Ameer.

`opening-a-pr` prefers a body a reviewer can read in under a minute, and a squash body under about 40 lines. Pull request #34 and Ameer's template are the local practice. The template at `.github/pull_request_template.md` adds `## Plan (sketch, reviewed by Architect)`, `## 4/4 CI`, and `## Awaiting Ameer`. The user also asked for all 24 principles and the playbooks with their output. Those win over the 40-line cap. The long lists live in the body, as they did on #34. The feature-map line table does not. It lives in `docs/feature-map.md`.

Draft body. Architect and EA approved the sketch. `## Awaiting Ameer` stays as drafted. Merge waits for Ameer.

```
## Why

A later reader cannot see which file owns a screen, or which missing pstack rows a document can close, without reading the whole app. This adds that map and updates only the inventory rows the map and this body actually close. The ensureFirebase timeout and the service worker bump stay on their own pull request.

## Plan (sketch, reviewed by Architect)

Architect and EA approved the sketch with four amendments. Sketch: docs/plans/docs-stream-feature-map-inventory.md.

## What changed

- docs/feature-map.md lists each screen, the functions, the data, and the tests, at the main SHA named in the plan.
- docs/PSTACK_INVENTORY.md flips the seven rows the plan names, leaves recall «ناقصة», does not edit create-verification-skill or authoring-a-skill, corrects the session.js strict note, and recounts the header from the inventory file at implementation time.
- README.md links to the feature map. The command block and the cache version sentence stay.

## Scope

Docs only. No application code, no service worker bump, no firestore.rules change, no test change. The v54 pull request is out of scope. recall stays «ناقصة». figure-it-out, investigation, and pause-safely stay incomplete until Ameer decides. The five doubtful "does not apply" rows stay as they are. create-verification-skill and authoring-a-skill are not edited.

## Blast Radius

Markdown only. Phones do not load these files. The service worker version guard does not require a bump when public/ is unchanged.

## Verification

prettier --check on the markdown. The inventory header matches a fresh count of the table. git diff --stat names only docs and README. CI is the four jobs below. No browser scenario changed, so no new screenshot.

## 4/4 CI

Filled after the four jobs finish. Job names: lint, format, types; ledger tests; browser checks; emulator rules and sync.

## Awaiting Ameer

Do not merge until Ameer says so.

Template headings used: Why, Plan (sketch, reviewed by Architect), What changed, Scope, Blast Radius, Verification, 4/4 CI, Awaiting Ameer.

Unslop scan: checked this body for em dashes, en dashes, the unslop AI-vocabulary list, "not just X but Y", and a stock closer. No hits.

## Playbooks

- investigation. Output is the feature map and the inventory sort. Read-only. Throughput checkpoint: n/a, read-only investigation. No code.
- how. Output is the feature map's file, function, data, and test citations. Explorer subagents were not spawned. No spending overrides that fan-out.
- architect. Output is this sketch. Arena was not run. It is banned. Two doc shapes were compared by hand. Shape 1 (one reference file) was chosen. Implementation waits for review.
- figure-it-out. Output is the workflow in the plan (one docs pull request, a falsifiable diff check, no public/ files). The inventory row is not flipped unless Ameer says this is the sketch that row means.
- technical-writing. Output is the mode split. The feature map is reference. README stays the how-to for commands. The plan file is the review sketch, not a second reference.
- in-your-own-words. Output is the Why above.
- recall. The capsule was written after the reads. That is not the skill's output. The row stays «ناقصة».
- opening-a-pr. Closes only because this body lists the template headings it uses. See the headings line above.
- unslop. Closes only because this body records the scan. See the scan line above. Checked em dashes, en dashes, the unslop AI-vocabulary list, "not just X but Y", and a stock closer. No hits.
- babysit. Not started by opening the pull request. When Ameer asks, mode is check. Watch the four jobs. Do not merge.

Not used, and why: bug-fix, feature, prototype, visual-parity, perf-issue, runtime-forensics, trace-forensics, shipping, refactoring, hillclimb, eval, autopilot-full, autopilot-stack, orchestrate, autonomous-run, worktree-cleanup, multi-phase-plan. Each is either banned, a code trigger, or a later docs file. The plan names the queue.

## Principles

- principle-attack-the-premise. N/A. No failed fix pair.
- principle-boundary-discipline. Met. The map names the file that owns each screen. No validation moved.
- principle-build-the-lever. N/A. No new script. The existing service worker guard is the check that a docs diff needs no version bump.
- principle-encode-lessons-in-structure. N/A. No new lint or script. The inventory stays the list.
- principle-exhaust-the-design-space. Met earlier. The feature map quotes Layout A and Layout B from a2944b4 and links the choice. It does not pick a third layout. Arena was not run.
- principle-experience-first. N/A. No screen changed.
- principle-explain-the-number. Met. Inventory totals are recounted from the table. LOGIN_MS, FLUSH_MS, SUCCESS_TTL_MS, and MAX_AMOUNT_IQD are cited, not remeasured.
- principle-fix-root-causes. N/A. No bug fix. The stale session.js sentence is a wrong next step, corrected in the same inventory edit.
- principle-foundational-thinking. Met. The map follows the data that already exists (K keys, Firestore matches). No new type.
- principle-guard-the-context-window. Met. One reference file. The line table is not pasted into the body.
- principle-laziness-protocol. Met. One feature file, not one file per screen. README keeps the commands.
- principle-make-operations-idempotent. N/A. No operation added.
- principle-migrate-callers-then-delete-legacy-apis. N/A. No API changed.
- principle-minimize-reader-load. Met. One page answers "which file owns this screen." The phase-2 map stays the layout record.
- principle-model-the-domain. N/A. No domain type changed. The map names the existing collections.
- principle-never-block-on-the-human. Met for this docs sketch. The firebase-client type choice stays in that code pull request. Doubtful inventory rows are flagged, not decided.
- principle-outcome-oriented-execution. Met. The body matches the files. No compatibility copy of the command block.
- principle-prove-it-works. Met when the four jobs are green and git diff --stat shows no public/ file. Until then this line stays unmet.
- principle-redesign-from-first-principles. N/A. No new product requirement.
- principle-separate-before-serializing-shared-state. Met. This branch does not edit files the v54 agent owns.
- principle-sequence-verifiable-units. Met. One docs commit sequence. The babysit row flips only after CI is green, not in the same claim as an unrun watch.
- principle-subtract-before-you-add. Met. The feature map does not add a second flush essay unless Architect asks. The v41 sentence is not rewritten beside the real version.
- principle-test-behavior-not-implementation. N/A. No test added. The map points at existing behaviour tests.
- principle-type-system-discipline. N/A. No types changed. session.js is already in the strict set. The inventory sentence is corrected to say that.
```

## CI on a docs-only change

Yes. The four jobs still run. `.github/workflows/ci.yml` lines 12-16 trigger on every `pull_request`, and on a push to `main`. There is no path filter.

The four jobs are:

- `quality`, name "lint, format, types" (line 18).
- `ledger`, name "ledger tests" (line 47).
- `browser`, name "browser checks" (line 78).
- `emulator`, name "emulator rules and sync" (line 123).

A docs diff does not skip them. `tests/sw-version-guard.test.js` line 59 says a change outside `public/` does not need a service worker bump. The workflow step at `.github/workflows/ci.yml` lines 32-38 still runs `scripts/sw-version-guard.sh`. It should report `public/` unchanged, the same way that test's README fixture does.

`npm run format:check` is `prettier --check .` (`package.json` line 9). `.prettierignore` does not exclude `docs/` or `README.md`. The new markdown has to pass Prettier. `printWidth` is 120 (`.prettierrc.json`). Lint is ESLint on JavaScript (`eslint.config.js`). A markdown file is not a lint target. `npm run typecheck` is `tsc` on the existing tsconfig files. Markdown is outside that.

So a clean docs diff should be 4/4, and the jobs still execute. This plan does not claim they have already passed. The pull request fills `## 4/4 CI` after the run. Babysit mode for that run is `check`.

## Accounting

No item in this stream raises an accounting question.

The feature map restates behaviour that is already in the code and in `README.md`. That includes derived totals (`Ledger.totals`), the contract amount living on `projectFinance`, the subcontract remaining from `Ledger.subcontractBalance`, «مسدّد بالكامل» as a derived badge, foreman balances from `Ledger.foremanBalance`, CSV export, and the project delete list. Those sentences describe the current functions. They do not change a balance, an advance, a ledger rule, or an export.

The rows that would raise a question are out of this stream. `create-formal-verification-skill` would encode the amount ceiling and the delete order. That later plan needs محاسب أهل الجزيرة. This sketch does not ask for a ruling, and it does not invent a quote.

Ameer can still send the feature map to the advisor if he wants the restatements checked. That is his call. Architect's review and Ameer's gates stay the same either way.

## Done when

The docs pull request is open on its own branch. `git diff` against `main` shows only `docs/` and the README link. The feature map's citations match the `main` SHA at implementation time. The seven inventory rows above are «مطبّقة» and point at that diff. `recall` stays «ناقصة». The header is recounted from `docs/PSTACK_INVENTORY.md` at implementation time. The expected count, if nothing else flips, is 32 «مطبّقة», 36 «ناقصة», 13 «لا تنطبق», 0 for Ameer. The five doubtful «لا تنطبق» rows are unchanged. `figure-it-out`, `investigation`, and `pause-safely` are unchanged unless Ameer has answered. All four CI jobs are green. The merge is waiting for Ameer.

## Not done

- No commit, no push, no pull request.
- Architect and EA approved this sketch. The merge still waits for Ameer.
- The feature map file is not written yet. This plan is the source for it.
- The v54 code is untouched and unreviewed here.
