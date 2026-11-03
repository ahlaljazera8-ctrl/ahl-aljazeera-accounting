# Plan v3: foreman petty-cash advances (عُهد الخِلفات)

PLAN ONLY. Nothing has been coded, opened as a PR, pushed, or deployed.

- **Source.** The repo was read at `main` = `0ca42c2`, through the cursor-github `get_file_contents` connector, into `/workspace/plan-petty-cash` (read-only). A plain https clone needs credentials on this box.
- **Citations.** Every `file:line` below refers to that snapshot. v2 adds `public/sync-status.js` and `public/firebase-client.js`.
- **Gates** (`AGENTS.md:5-11`):
  - Ameer approves every behaviour change, every rules change, and every merge.
  - AgentLab Architect and EA review the plan before any code is written.
  - `arena` is banned (`AGENTS.md:35`), so the "design twice" step was done by hand (§1.3).

## Changes since v2 (Architect and EA review of v2)

| Note                      | Change in v3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Where                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| N1 staleness source       | `settleGuard` now uses `lastSyncAt`, not the pull watermarks, because a watermark holds the newest row's server time, not the time of the pull. **Source check:** `lastSyncAt` is an in-memory `var` (`firebase-client.js:296`), set only after a successful `fb.pull` (`:553-555`). It is **not persisted** and is `0` after a reload, and then `render.js:746-750` falls back to the watermarks. So when `lastSyncAt === 0` the guard treats the device as stale ("لم يُحدَّث منذ فتح التطبيق") instead of trusting a watermark. | §2.5, T-L8, T-2D3                        |
| N2 dispatch               | `sameContent`/`sameReversal` dispatch on `local.docType` **only**. The remote copy comes from the server without the tag, because `docType` is never sent (§2.2).                                                                                                                                                                                                                                                                                                                                                                  | §2.3, SS1/SS4 use untagged server copies |
| N3 strict-foremen globals | **Chosen: a typed `RenderApi` passed in by `render.js`.** Declaring `views`/`state` as ambient globals was rejected. Reasons below.                                                                                                                                                                                                                                                                                                                                                                                                | §2.6, T-TS1                              |
| N4                        | Q-13 covers the `subcontractId` reversal rule (default: deferred to its own PR). A `foremen.projectId` that points at a deleted project is handled.                                                                                                                                                                                                                                                                                                                                                                                | §1.1, §5.1, Q-13                         |
| Questions                 | Q-5 and Q-6 are split up. New: over-settle, the note prefill, project-less advances. The «نقداً» prefill is removed from mockup 4 and the mockup re-rendered.                                                                                                                                                                                                                                                                                                                                                                      | §7, mockups                              |
| Tests                     | Added: reversal of a reversal, a `rev_` id on a normal move, totals with old «سلفة» rows, an untagged server copy, staleness from the pull time, strict-foremen globals, and the server delete list.                                                                                                                                                                                                                                                                                                                               | §6 (v3 additions)                        |
| Optional                  | Mockup 2 shows the project name on each expense row and the foreman's default project.                                                                                                                                                                                                                                                                                                                                                                                                                                             | §4                                       |

## Changes since v1 (review notes → where addressed)

EA's numbers are mapped from the review order I was given. If EA's list is ordered differently, please re-map.

| #        | Note                                                                                                                                                                 | Addressed in                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1 (HIGH) | `sameContent` / `sameReversal` have no foreman or move branches, so a resent move becomes a false conflict                                                           | §2.3 and §6 T-SS*                                                                   |
| 2 (HIGH) | `writeLocal` must use `putIfMissing` for the new collections. Also needed: `pullForemen` with a watermark, and a `cacheSnapshot` / `writeCache` decision             | §2.4 and §6 T-FC*                                                                   |
| 3 (HIGH) | Deleting a project changes a foreman's balance. Options plus a default for Ameer                                                                                     | §5.1 and Q-8                                                                        |
| 4        | Do not write the foreman name into `partyName` without Ameer's approval                                                                                              | §1.2 and Q-9                                                                        |
| 5        | v1 contradicted itself about CSV (§2 vs §5)                                                                                                                          | §2.1: CSV unchanged in v1, with a snapshot test                                     |
| 6        | Make the routing choice explicit (shape heuristic at `sync.js:18`). Use a local tag or an exact key set; if `isForeman` is stored, it must be in the rules allowlist | §2.2: a local-only `docType` tag, never sent, so there is no rules allowlist change |
| 7        | Settling from a stale device: show the last-update time, warn on pending rows, add a two-device test                                                                 | §2.5, mockup 4, and §6 T-2D*                                                        |
| 12       | Finish the architect sketch: signatures, handler locations, rules functions, inventory, tsconfig                                                                     | §2 and §3                                                                           |
| 14       | Add the missing red tests (sync-status, retry after the row landed, project delete, double settle, rules denials, CSV snapshot)                                      | §6                                                                                  |
| 15       | Turn Ameer's questions into single-choice questions with a recommended default                                                                                       | §7                                                                                  |
| LOW      | Correct the claims about site users and about reversal rules                                                                                                         | §3.3 and §1.2                                                                       |

## 0. Grounding (what exists today)

- **Entries are append-only.**
  - Ledger rows are frozen, and corrections are written as `rev_<id>` (`public/ledger.js:225-250`).
  - `ledgerEntries` has no `allow update` (`firestore.rules:146-152`). A second create on an id that already exists is therefore an update, and it is denied.
- **Entry types and totals.**
  - The types are listed at `ledger.js:9-15`. `labour` is labelled «عمالة/سلفة» (`:12`).
  - `totals()` counts everything that is not income as an expense (`ledger.js:33`).
- **The subcontract pattern to mirror.**
  - `subcontractBalance` is derived and nothing is stored (`ledger.js:308-329`).
  - Rules: `firestore.rules:219-286`.
  - UI: `render.js:14-102` and `:518-552`.
- **Sync routing is by shape** (`sync.js:15-22`). `toRemote` copies fields from an allowlist (`sync.js:39-63`).
- **Writes.**
  - `writeLocal` uses `putIfMissing` (a server read, then `setDoc`) only for `subcontracts` and `subcontractAmendments` (`firebase-client.js:135-160`).
  - Everything else uses a plain `setDoc` (`:162`). A retry of a row that already landed is then denied, which falls back to `readServer` and `sameContent` (`sync.js:563-582`).
- **`sameContent` returns false** for any row that is neither an entry nor a project (`sync-status.js:58`). It compares `subcontractId` at `:65`.
- **`sameReversal` keys on `reversesEntryId`** (`sync-status.js:44-49`).
- **`adoptEntry`** has its own field allowlist (`firebase-client.js:377-388`).
- **Pull.**
  - The subcontract pull is at `firebase-client.js:232-241`, with the watermark key `pullWatermark.subcontracts`.
  - The cache snapshot is at `firebase-client.js:300-323`.
  - Project delete reads ids at `:275-284` and drops local rows through `Sync.dropProjectLocal` (`sync.js:490-532`, called at `render.js:704-716`).
- **Last sync time.** `lastSyncMillis()` reads `pullWatermark.entries` and `.projects` (`render.js:746-750`). `formatSyncTime` is at `:751-756`.
- **Typecheck scope.** The strict scope for sync-status is `tsconfig.strict-sync-status.json` (include `public/sync-status.js` and `types/checkjs.d.ts`).

## 1. Data model

### 1.1 Records

1. **`foremen/{id}`** `{ id, name (1..100), note? (≤200), projectId?, createdAtServer, createdBy }`. `projectId` is only a **default** for the expense form. It is not a hard link. If that project is deleted, archived, or no longer readable, the form falls back to "no default" and shows «المشروع الافتراضي محذوف». The foreman document stays as it is (`update: false`). The project-delete id list does **not** include foremen. T-D4 covers this.
   - Only the owner may create one. `update: false`.
2. **`foremanMoves/{id}`** `{ id, foremanId, kind: 'advance'|'settle'|'return', amount:int>0, date, note (≤200), isReversal, reversesMoveId?, reversalReason?, createdAtDevice, createdAtServer, createdBy, deviceId }`
   - Owner only. `update: false`.
   - A correction is a new row with id `rev_<moveId>`.
3. **Foreman expenses are ordinary `ledgerEntries`** with one new optional field, `foremanId`.
   - Only for types whose direction is expense.
   - Each one stays a real project expense.

**The balance is derived and never stored:**

```
held = Σ(advance+settle) − Σ(return) − Σ(foreman expenses)
```

- Each row counts with its `sign` (a reversal counts as −1).
- Rows are counted only if they pass `countedEntries` (`ledger.js:298`).
- `remaining = max(held,0)`, `owedToForeman = max(−held,0)`.

**Other properties.**

- **Integer IQD.** Amounts are parsed with `parseAmount` and checked with `isPosInt` (`ledger.js:123-149`).
- **One id per form.** The id is kept across retries (`render.js:61,93`).
- **Reversal ids are deterministic**, so a second reversal is a create on an id that already exists. That is an update, which is denied. It is not caught by `:133`; `:133` only checks the id format.

### 1.2 Roles, projects, and what site users see (corrected)

- **v1 is owner-only.** The owner enters the foreman's WhatsApp reports.
  - Site users cannot read `foremen` or `foremanMoves`.
  - Site users cannot write `foremanId` (the rules check `isOwner()`).
- **v1 incorrectly said site users would see nothing new.**
  - Site users can read every expense row on their assigned projects (`firestore.rules:152`), and the site pull reads them (`sync.js:281-284`). So they **will receive `foremanId`** on those rows.
  - The id is opaque, and site users cannot resolve it to a name, because the `foremen` read is owner-only.
  - The UI shows nothing for it.
  - Options are in Q-9. The default is to accept the opaque id. The alternative is a `foremanLinks/{entryId}` side collection that only the owner can read. That costs more reads and more rules, so it is not the default.
- **`partyName` is not touched.** v1 copied the foreman name into `partyName`, the way `render.js:915` does for subcontractors. v2 does not do this. `partyName` stays whatever was typed, and Q-9 decides whether the name may appear there.

### 1.3 Alternatives (unchanged from v1)

- **A. New `entryType`s in `ledgerEntries`.** Rejected. `totals` (`ledger.js:33`), the site read at `:152`, and `projectOpen` (`firestore.rules:120`) would all be affected.
- **B. A stored balance.** Rejected. It is mutable state and races between devices.
- **C. Local-only storage.** Rejected. There is no backup.
- **Chosen: mirror the subcontract pattern.**

## 2. Files, types, signatures (full sketch)

### 2.1 `public/ledger.js` (strict-ledger scope)

```js
/** @returns {ForemanFigures} */ function foremanBalance(foremanId, moves, entries) {} // pure
/** @returns {string[]} */ function validateForemanMove(move, { user, moves, foremen }) {}
/** @returns {ForemanMove} */ function foremanMoveReversal(orig, { user, reason, now, deviceId, date }) {}
/** @returns {{ stale: boolean, pendingIds: string[], lastSync: number|null }} */
function settleGuard(foremanId, { outbox, moves, entries, lastSyncMs, nowMs }) {} // §2.5
```

Changes to existing functions:

- **`validateEntry`** (`:170-223`): add a `foremanId` block next to the `subcontractId` block (`:200-207`). It requires the owner, `direction==='expense'`, a valid id, and a foreman that exists in `ctx.foremen`.
- **`makeReversal`** (`:256-266`): copy `foremanId`, the same way `:262` copies `subcontractId`.
- **CSV: no change in v1.** `CSV_COLS` (`:268`) and `entryExportFields` (`:361-403`) stay exactly as they are, and a snapshot test pins the CSV header. Adding a foreman column is Q-6. This resolves note 5.

### 2.2 `public/sync.js`: routing decision (note 6)

**Decision: a local-only tag `docType: 'foreman' | 'foremanMove'`.**

- It is set when a row is created locally, and set again by `pullForemen` on every row it pulls.
- `collectionFor` checks it **first** (before `sync.js:17`). That way the tagged rows never reach the `name` + `currency` heuristic (`:18`) or the `subcontractId` + `date` heuristic (`:20`).
- `toRemote` builds the payload from an explicit `copyFields` allowlist that leaves `docType` out, so the tag is **never written to Firestore**. No rules allowlist change is needed for it.
- I rejected matching on an exact key set. Optional fields such as `note` and `projectId` make a key set ambiguous, and a future field would silently re-route the row.
- I rejected a stored `isForeman` flag. It would need an entry in the rules allowlist and adds a field that only exists for routing.

```js
function collectionFor(doc)       // + if (doc.docType==='foreman') return 'foremen'; if (doc.docType==='foremanMove') return 'foremanMoves';
function toRemote(doc)            // + entry branch: if (doc.foremanId) out.foremanId = doc.foremanId;
                                  // + foremen:  copyFields(doc,['id','name','note','projectId','createdBy'])
                                  // + moves:    copyFields(doc,['id','foremanId','kind','amount','date','note','isReversal','reversesMoveId','reversalReason','createdAtDevice','createdBy','deviceId'])
/** @returns {readonly ReadSpec[]} */ function foremanReads(user, since) {}   // owner only: [{foremen},{foremanMoves}] + sinceClause; site → []
/** @returns {Promise<{ foremen: SyncDoc[], moves: SyncDoc[], watermark: number|null }>} */
async function pullForemen({ user, since, read }) {}                          // tags docType, mirrors pullSubcontracts :144-178
function dropProjectLocal(store, projectId, opts)  // unchanged signature; behaviour per §5.1
```

### 2.3 `public/sync-status.js` (strict-sync-status scope): note 1

- **`sameContent(local, remote)`** (`:56-71`):
  - Replace the early return at `:58` with a dispatch on **`local.docType` only**. `remote` is the untagged server copy (`docType` is stripped by `toRemote` and never stored), so the remote shape is never inspected to choose a branch. An untagged local row keeps today's entry/project path.
  - Foremen: compare `id`, `name`, `note`, `projectId`, `createdBy`.
  - Moves: compare `id`, `foremanId`, `kind`, `amount`, `date`, `note`, `isReversal`, `reversesMoveId`, `createdBy`.
  - Entries: add `if (norm(local.foremanId) !== norm(remote.foremanId)) return false;` after `:65`.
- **`sameReversal(local, remote)`** (`:44-49`):
  - Use `reversesMoveId` when `local.docType==='foremanMove'`. The remote copy is untagged.
  - Keep `reversesEntryId` for ledger rows.
  - Never match across the two kinds.
- **Types:** `SyncRow` in `types/checkjs.d.ts` gains `docType?`, `foremanId?`, `kind?`, `reversesMoveId?`, `date?`, and `note?`.

Without these changes, a move that landed and was then resent is first refused (because of `update:false`). It is then classified as a conflict and goes into `syncErrors`. `countedEntries` / `foremanBalance` would then **drop a row that did land**, so the balance shown would be wrong.

### 2.4 `public/firebase-client.js`: note 2

- **`writeLocal(local)`** (`:141-163`):
  - Add `if (col === 'foremen' || col === 'foremanMoves') { await this.putIfMissing(col, clean.id, S.withServerTime(clean, serverTimestamp())); return; }`, using the same shape as `:158-161`.
  - A retry after the row landed is then a no-op instead of a denied update.
  - Belt and braces: §2.3 also handles the case where the denial still happens, for example if the server read races.
- **The ledger-entry path keeps `setDoc`** (`:162`). `toRemote` now carries `foremanId`.
- **`adoptEntry`** (`:377-388`): add `'foremanId'` to the key list and to the delete-if-empty list (`:382`).
- **`pull(user)`**: after the subcontract block (`:232-241`), add:
  ```js
  const fm = await S.pullForemen({ user, since: previousMark.foremen, read: readSpec });
  set(K.foremen, S.mergeById(get(K.foremen, []), fm.foremen, pendingNow));
  set(K.foremanMoves, S.mergeById(get(K.foremanMoves, []), fm.moves, pendingNow));
  set(K.pullWatermark, { ...get(K.pullWatermark, {}), foremen: fm.watermark });
  ```
  The watermark is a separate key, the same as `subcontracts`.
- **The flush `load`** (`:487`) also searches `K.foremen` and `K.foremanMoves`.
- **`cacheSnapshot` / `writeCache`** (`:300-323`): **include** `foremen` and `foremanMoves`.
  - `dropProjectLocal` then receives them, and has to implement the §5.1 decision explicitly instead of silently losing or keeping rows.
  - Its return value (`sync.js:532`) gains the two keys and passes them through unchanged under the default (option A blocks the delete before this point).

### 2.5 Stale-device settle guard: note 7

`settleGuard` returns `stale` when either of these is true:

- (a) Any outbox id is a move or entry for this foreman.
- (b) `lastSyncAt === 0`, meaning no successful pull since the app opened (`firebase-client.js:296`, set at `:555`), **or** `nowMs − lastSyncAt > 10 min`. Watermarks are **not** used. They are the newest row's `createdAtServer` (`sync.js:337`), so a quiet foreman would look stale forever and a busy one would look fresh. `settleGuard` receives `lastSyncAt` as a parameter, so it stays pure.

The settle and return sheets:

- Always show «آخر تحديث من الخادم: …» from `lastSyncAt`, formatted with `formatSyncTime` (`render.js:751`). When it is 0, show «لم يُحدَّث منذ فتح التطبيق».
- When stale, show a warnbox and a «تحديث الآن» button that calls `flushRemote()`. The button warns but does not block, because the app is offline-first.
- Pre-fill the amount from `owedToForeman` or `remaining`. Ameer can edit it; whether partial payments are allowed is Q-5b. The note field starts **empty**, with no «نقداً» prefill until Q-15 is answered. If the typed amount is more than what is owed, the over-settle rule from Q-14 applies.

The rules cannot enforce a balance (Firestore rules cannot sum rows). So a double settle from two devices is possible. Because the balance is derived, it then simply shows as `remaining > 0` («المتبقي معه»). That is visible and can be corrected with a `rev_` or a `return`, and it is covered by a test. Mockup 4 shows this guard.

### 2.6 `public/session.js`, UI files, types, inventory

- **`session.js:5`**: `K` gains `foremen: 'foremen'` and `foremanMoves: 'foremanMoves'`.
- **New classic script `public/foremen.js`.** It is loaded before `render.js` (`index.html:69`). See N3 below for why.
  - Following Layout A (`docs/phase-2-module-map.md:11`), it registers its views into the `views` object from `render.js`.
  - Views: `foremen()`, `foreman(id)`, `foremannew()`, and `foremanmove(id)` (with the kind in state).
  - **Globals (N3): typed `RenderApi`.** `render.js` declares `views`, `state`, and `titles` with top-level `const` (`render.js:4,359,600`). Classic-script `const` shares the global lexical scope but is not on `window`, and `types/checkjs.d.ts` does not declare these names today (it declares `render` `:573`, `$` `:558`, `get` `:550`, `set` `:551`, `K` `:538`). The choice is:
    ```ts
    interface RenderApi {
      views: Record<string, (arg: string) => string>;
      titles: Record<string, string>;
      state: Record<string, unknown>;
      render(): void;
      esc(s: unknown): string;
      money(n: number, cls?: string): string;
      queueDoc(id: string): void;
      confirmShell(inner: string): string;
      lastSyncAt(): number;
    }
    interface ForemenUiApi {
      install(api: RenderApi): void;
      onClick(b: HTMLButtonElement): boolean;
    }
    ```
    `render.js` calls `ForemenUI.install({ views, titles, state, render, esc, money, queueDoc, confirmShell, lastSyncAt: () => lastSyncAt })` once, at the end of the file.
    - **Why this over ambient declarations:** the dependency surface is explicit and small, and it is checked under `strict`. It also avoids typing `state`/`views` as global `any` for every file, and avoids hiding the load-order dependency between `render.js` and `foremen.js`.
    - Load order: `foremen.js` must load **before** `render.js` so that `install` exists. It only defines and does not run until `install` is called.
  - Handlers: `saveForeman(u, button)`, `saveForemanMove(u, button, kind)`, `reverseForemanMove(u, id, reason)`, and `foremanSheet(foreman, kind)` for the confirm and settle sheet.
  - `render.js` changes stay minimal:
    - the tab map (`:833`) and heading (`:843-849`) learn the new views;
    - the click dispatcher (`:853+`) forwards `data-fm*` buttons to `ForemenUI.onClick(b)`;
    - `sendNow` (`:214-231`) stamps the two new keys;
    - the entry form (`:905-934`) gets an owner-only «من عهدة» select that sets `e.foremanId` and does **not** set `partyName`.
- **`index.html`:**
  - a script tag for `foremen.js`;
  - an owner-only 4th tab «العُهد» (`:54-58`), hidden for site users the same way the people tab is (`syncPeopleTab`, `render.js:832`).
- **`sw.js`:** add the file to `ASSETS` and bump `VERSION` (`docs/phase-2-module-map.md:33`). Also update `tests/sw-cache.test.js` and `shell-cache.test.js`.
- **`types/checkjs.d.ts`:** `Foreman`, `ForemanMove`, `ForemanMoveKind`, and `ForemanFigures`. `LedgerEntry.foremanId?`, `SyncRow` additions, `LedgerApi` / `SyncApi` additions, and a `ForemenUiApi` global.
- **`tsconfig.strict-foremen.json`.** This is a new file mirroring `tsconfig.strict-sync-status.json`, with include `public/foremen.js` and `types/checkjs.d.ts`. Add `tests/strict-foremen.test.js`, mirroring `tests/strict-sync-status.test.js`, and wire it into CI (`.github/workflows/ci.yml`).
- **`docs/phase-2-module-map.md`:** add a line for `foremen.js` under "What each file owns".
- **`docs/PSTACK_INVENTORY.md`:** add the new file, collections, tests, and tsconfig to the inventory, plus a link to this plan.

## 3. firestore.rules: YES, this changes, and it needs Ameer

### 3.1 New blocks (modelled on `:220-238` and `:263-286`)

```
match /foremen/{id} {
  function foremanShape() { keys().hasOnly(['id','name','note','projectId','createdAtServer','createdBy'])
    && id==entry id && idOk(id) && name is string 1..100 && optString note ≤200
    && (!('projectId' in d) || idOk(projectId)) && createdAtServer==request.time && createdBy==auth.uid }
  allow read, create: if isOwner() (create && foremanShape()); allow update: if false; allow delete: if false; // v1, Q-8
}
match /foremanMoves/{id} {
  function moveShape() { keys().hasOnly([... §1.1 fields ...]) && idOk(id) && d.id==id && idOk(foremanId)
    && exists(foremen/foremanId) && kind in ['advance','settle','return'] && amount is int && 0<amount<=MAX_AMOUNT_IQD()
    && entryDateOk(date) && note string ≤200 && isReversal is bool && createdAtDevice is int && deviceId 1..128
    && createdAtServer==request.time && createdBy==auth.uid }
  function moveNormalOk()   { !isReversal && !id.matches('^rev_.*') && !('reversesMoveId' in d) && !('reversalReason' in d) }
  function moveReversalOk() { isReversal && id=='rev_'+reversesMoveId && exists(orig) && orig.isReversal==false
    && orig.foremanId==d.foremanId && orig.kind==d.kind && orig.amount==d.amount && reason 1..500 }
  allow read: if isOwner(); allow create: if isOwner() && moveShape() && (moveNormalOk() || moveReversalOk());
  allow update: if false; allow delete: if false;
}
```

The `docType` tag is never sent (§2.2), so it is not in either allowlist.

### 3.2 Changes to `ledgerEntries`

- Add `'foremanId'` to `hasOnly` at `:81`.
- Add `foremanOk()`:
  ```
  !('foremanId' in d()) || (idOk(d().foremanId) && exists(foremen/…) && d().direction=='expense' && isOwner())
  ```
- `create` becomes `... && linkOk() && foremanOk()` (`:146`).

### 3.3 Reversal-rule claims (corrected, LOW)

- v1 said a duplicate reversal "is refused by `:133`". **That was wrong.** `:133` only checks that the id is `'rev_' + reversesEntryId`. The second reversal is refused because a create on an existing document is an update, and `ledgerEntries` has no `allow update`.
- v1 implied that today's `reversalOk` keeps the link fields. **It does not.** `reversalOk` (`:129-144`) does not compare `subcontractId` today. A reversal with no `subcontractId` passes, because `linkOk` (`:108-114`) allows an absent `subcontractId` for the owner.
- For foremen, v2 adds to `reversalOk`:
  ```
  (('foremanId' in orig) ? (d().foremanId == orig.foremanId) : !('foremanId' in d()))
  ```
  This is a **strengthening specific to foremen**. Whether to apply the same fix to `subcontractId` is a separate rules question for Ameer, and it is not bundled into this feature.

Deploying the rules stays manual (`firestore.rules:1`), done by Ameer after `tests/emulator/rules.test.js` is green.

## 4. Mockups

These are rendered with the real `public/style.css` in headless Chrome. The HTML is in `/workspace/pc-mock/`.

- `/workspace/petty-cash-mockup-1.png`: the list, showing a foreman holding cash, one who is owed, and one who is settled.
- `/workspace/petty-cash-mockup-2.png`: the detail screen with cash remaining.
- `/workspace/petty-cash-mockup-3.png`: the detail screen when the foreman is owed.
- `/workspace/petty-cash-mockup-4.png`: **updated in v2.** The settle sheet now shows the last server update, a warning about rows still pending on this phone, and «تحديث الآن».
- `/workspace/petty-cash-mockup.png`: all four screens combined.

## 5. Blast radius

### 5.1 Project delete changes a foreman's balance (note 3): options for Ameer

Deleting a project removes its `ledgerEntries` (`firestore.rules:147`, `sync.js:443`). Any foreman expenses on it disappear, so `held` jumps up and the foreman suddenly appears to hold cash he spent.

- **Server delete list:** `projectDeleteDocs` adds ids by collection (`sync.js:443-447`): ledgerEntries, subcontracts, amendments, terms, and finance. v3 adds **no** foremen or foremanMoves ids there, so foremen survive a delete by design. Test T-D5 pins this. Under option A no foreman entries are deleted anyway.
- **A. Block the delete (recommended default).**
  - When any counted entry on the project has a `foremanId`, the delete dialog (`render.js:654-669`) shows «لا يمكن الحذف: فيه مصاريف عهدة لـ …. سوِّ العهدة أو أرشف المشروع» and the delete button is disabled. Archiving still works.
  - This is enforced in the client (`deleteProjectNow`, `render.js:704`). Rules cannot see it, but the owner is the only one who can delete.
  - Cost: small. Data loss: none.
- **B. Write a closing move automatically.** Before deleting, write a move of kind `adjust` (a new kind, which needs rules) equal to the deleted foreman spend, so `held` is unchanged.
  - Cost: a new kind, a two-step write that can half-fail offline, and an audit row that points at a project that no longer exists.
- **C. Warn only.** Show the per-foreman balance impact in the confirm dialog and delete anyway.
  - Cost: balances change silently later.

### 5.2 Other effects

| Area                        | Effect                                                                      | Guard                       |
| --------------------------- | --------------------------------------------------------------------------- | --------------------------- |
| Totals and home             | Unchanged. Moves are not entries.                                           | T-L4                        |
| CSV and entry export        | **Unchanged in v1** (§2.1)                                                  | T-CSV1 snapshot             |
| `toRemote` / `adoptEntry`   | Must carry `foremanId`, or it is silently dropped                           | T-S2, T-FC3                 |
| Routing                     | Tagged rows bypass the heuristics                                           | T-S1                        |
| Resend after the row landed | `putIfMissing` + `sameContent`                                              | T-FC1, T-SS1-3              |
| Site users                  | Receive an opaque `foremanId` on expense rows (§1.2). The UI shows nothing. | T-R9, Q-9                   |
| Reversals                   | `foremanId` must match (§3.3)                                               | T-L3, T-R6                  |
| Archived projects           | No new foreman expenses (`projectOpen`). Moves still work.                  | T-R10                       |
| Service worker              | `VERSION` bump                                                              | sw tests                    |
| Spark reads                 | 2 small owner-only collections, read incrementally by watermark             | `isBounded` (`sync.js:347`) |

## 6. Red tests first

- **ledger (`tests/ledger.test.js`)**
  - L1: `foremanBalance` for holding, owed, settled, multiple advances, and return.
  - L2: rows in `syncErrors` are excluded.
  - L3: `makeReversal` keeps `foremanId`, and the balance is restored.
  - L4: `totals` and `projectSummary` are unchanged when moves are present.
  - L5: `validateEntry` with `foremanId` passes for the owner, and fails for site, for income types, and for a bad id or an unknown foreman.
  - L6: `validateForemanMove` checks kind, amount (rejects floats, zero, and amounts above the max), duplicates, and the `rev_` rule.
  - L7: **double settle** from two settles leaves `remaining = settled amount`, with state `holding`.
  - L8: `settleGuard` flags a pending id and also flags an old `lastSync`.
- **sync-status (`tests/sync-status.test.js` + `strict-sync-status`)**
  - SS1: `sameContent` is true for an identical move and false for a different `amount`, `kind`, or `foremanId`.
  - SS2: `sameContent` for a foreman document.
  - SS3: entries that differ only in `foremanId` are not the same.
  - SS4: `sameReversal` on moves uses `reversesMoveId`, and a move never matches an entry reversal.
  - SS5: `npx tsc -p tsconfig.strict-sync-status.json` stays clean.
- **sync (`tests/emulator/sync.test.js`)**
  - S1: `collectionFor` handles tags, and a foreman with a `name` is never routed to `projects`.
  - S2: `toRemote` keeps `foremanId` and never emits `docType`.
  - S3: `foremanReads` returns `[]` for site, and adds the `since` clause for the owner.
  - S4: `pullForemen` tags its rows and advances the watermark.
- **firebase-client and emulator**
  - FC1: **retry after the row landed.** Write a move, simulate a lost acknowledgement, and flush again. The result is `synced`, with no `syncErrors` and one document.
  - FC2: the same test for a foreman document.
  - FC3: `adoptEntry` keeps `foremanId`.
  - FC4: `cacheSnapshot` / `writeCache` round-trip the new keys.
- **Two-device tests (`tests/emulator/offline-reconnect.test.js` style)**
  - 2D1: device A records an expense offline while device B settles from a stale view. After both sync, both devices show the same `held`, and the settle sheet on B showed the stale warning.
  - 2D2: both devices settle. The result is visible as remaining with the foreman, with no lost rows.
- **Project delete (`tests/project-delete.test.js`)**
  - D1: option A. The delete is blocked while foreman expenses exist, and archive still works.
  - D2: without foreman rows, the delete is unchanged.
  - D3: `dropProjectLocal` passes `foremen` and moves through unchanged.
- **Rules (`tests/emulator/rules.test.js`), denials**
  - R1: site create or read on `foremen` and `foremanMoves` is denied.
  - R2: update is denied.
  - R3: delete is denied.
  - R4: wrong shape, extra key, `docType` present, float amount, or amount above the max are denied.
  - R5: a move for an unknown foreman is denied.
  - R6: a reversal with a mismatched `foremanId`, `kind`, or `amount` is denied, and so is a second reversal.
  - R7: an entry with `foremanId` from a site user is denied.
  - R8: an entry with `foremanId` on an income type is denied.
  - R9: a site user can read an assigned expense row that has `foremanId` (documents Q-9).
  - R10: a foreman expense on an archived project is denied.
  - R11: a non-allowlisted uid is denied everything.
- **CSV**
  - CSV1: snapshot of the `toCSV` header and of a foreman expense row. The output is byte-identical to the same row without a foreman.
- **Browser (`tests/browser-check.js`)**
  - The tab is visible for the owner and hidden for site.
  - The figures match the mockups.
  - Double-tapping save creates one row.
  - Settle zeroes the balance.
  - The stale banner appears.
  - `.num` text stays LTR.
- **v3 additions**
  - L9: a reversal of a reversal (`rev_rev_x`) is rejected by `validateForemanMove`. R12: the rules deny it (`orig.isReversal==false`).
  - L10 / R13: a normal move whose id starts with `rev_` is rejected (`moveNormalOk`).
  - L11: `totals` with old «عمالة/سلفة» `labour` rows next to foreman expenses gives the same figures as today, and `foremanBalance` ignores labour rows that have no `foremanId`.
  - SS6: the server copy is untagged (no `docType`) while the local copy is tagged, and the result is still `sameContent === true`. An untagged local entry against a remote that has move-like fields stays on the entry path.
  - L8b / T-2D3: staleness from the pull time. With `lastSyncAt=0` the result is stale. With `lastSyncAt=now−5min` it is fresh. With `lastSyncAt=now−11min` it is stale. A watermark from a day ago with `lastSyncAt=now` is fresh.
  - TS1: `npx tsc -p tsconfig.strict-foremen.json` passes using only `RenderApi`. A test fixture that references a bare `views` fails to compile.
  - D4: a foreman whose default project was deleted shows no default and the warning.
  - D5: `projectDeleteDocs` output never contains `foremen`/`foremanMoves` (`sync.js:443-447`).
- **CI:** all 4 checks, including the new `strict-foremen` scope.

## 7. Questions for Ameer (choose one each; ★ = recommended default)

1. **Who enters expenses?**
   - ★ (a) Ameer, from WhatsApp
   - (b) the foreman, in the app
   - (c) both
2. **What is a foreman?**
   - ★ (a) just a name
   - (b) a site user with a login
3. **Project for expenses:**
   - ★ (a) every expense picks a project, defaulting to the foreman's usual one
   - (b) one fixed project per foreman
4. **Multiple advances:**
   - ★ (a) one running balance per foreman
   - (b) each advance closes separately
5. **Settlement** (split in v3):
   - **5a. How is paying back the foreman recorded?**
     - ★ (a) one «تسديد» row
     - (b) as a new advance
   - **5b. Are partial settlements allowed?**
     - ★ (a) yes
     - (b) full amount only
   - **5c. What happens to cash the foreman has left?**
     - ★ (a) it carries forward
     - (b) he must return it («استلام المتبقي») before a new advance
6. **Reports** (split in v3):
   - **6a. How do foreman expenses count?**
     - ★ (a) as normal project expenses
     - (b) excluded from project totals
   - **6b. Which type do they get?**
     - ★ (a) chosen per expense (materials, labour, and so on)
     - (b) always «مصروف»
   - **6c. Does the CSV change?**
     - ★ (a) unchanged
     - (b) add a foreman column
7. **Old «عمالة/سلفة» advances:**
   - ★ (a) leave them as they are, with a note
   - (b) plan corrections
8. **Deleting a project that has foreman expenses:**
   - ★ (a) block the delete
   - (b) write a closing move automatically
   - (c) warn only
9. **What site users can see:**
   - ★ (a) the opaque `foremanId` only; the name never goes in `partyName`
   - (b) the name also goes in `partyName`
   - (c) an owner-only link collection
10. **Removing a foreman:**
    - ★ (a) no delete in v1
    - (b) delete when he has no moves
11. **WhatsApp:**
    - ★ (a) typing manually is enough
    - (b) add a «share balance» text
12. **Stale-settle warning:**
    - ★ (a) warn when there are pending rows, when there has been no pull since the app opened, or when the last pull was more than 10 minutes ago
    - (b) pending rows only
    - (c) block settling while offline
13. **`subcontractId` reversal rule** (today `firestore.rules:129-144` does not compare it):
    - ★ (a) defer it to its own separate rules PR
    - (b) fix it in the same rules PR as foremen
    - (c) leave it as is
14. **Over-settle** (paying more than is owed):
    - ★ (a) allow it with a warning; the extra shows as «المتبقي معه»
    - (b) block amounts above what is owed
15. **Note prefill on settle and advance:**
    - ★ (a) empty, optional
    - (b) prefill «نقداً»
    - (c) a required cash/transfer choice
16. **Advances not tied to a project:**
    - ★ (a) yes; advances are never project-bound, only the expenses are
    - (b) every advance must name a project

## 8. Next steps

Ameer approved this plan at 16:37 Baghdad on 2026-11-03, including all 16 default answers and the `firestore.rules` change. The work is five pull requests, not the four listed in earlier drafts. Each one starts with its red tests, waits for all 4 CI checks, and waits for Ameer to merge it. Rules are not deployed from a pull request.

- **A. Ledger.** Types, `foremanBalance`, `validateForemanMove`, `foremanMoveReversal`, and `settleGuard`, plus the ledger tests. `settleGuard` takes `nowMs` as a required parameter and does not default it to 0. Sync-status tests are not in this pull request.
- **B. Rules.** `firestore.rules` and the emulator rules tests. Ameer deploys the rules after that pull request merges.
- **C. Sync.** `sync.js`, `sync-status.js`, and `firebase-client.js`. Sync-status tests SS1–SS6 move here. They land before or with the sync code, not in A.
- **D. UI.** `foremen.js`, the render wiring, `tsconfig.strict-foremen`, and the service-worker bump. The settle sheet passes `nowMs` into `settleGuard`.
- **E. Docs.** The module map and `PSTACK_INVENTORY`.
