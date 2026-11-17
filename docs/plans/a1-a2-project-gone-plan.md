# Plan: a gone project must not take the entry, and must not come back on reload

Revision r4. r3 is `d54e95425d6ea033688c25d0376f0780c0802ed6`. r2 is `bedd054390acc8fdb4d22d09628c8d07d10ebf2b`, after Architect NOTES on r1 at `2d93c6aac46670acf74055f595967492a1cdcff5`. r1's IndexedDB delete would have erased a queued line and a refused line on the deleting phone. r2 does not. r3 records EA's answers and the accountant's reply, both on 2026-11-17 under Ameer's delegation. Plan only. No application code in this change. No file under `public/`. No test run. The code pull request waits until Architect and EA have reviewed this revision. Ameer approves every merge and every behaviour change.

- **Repo.** `ahl-aljazeera-accounting`, read at `main` `818039a518a3b2f5ffbab74ee47a3a3b9298d3bf`. Every `file:line` below is that commit. The answers file named by the E sketch is not in this tree, so this plan cites the sketch that records it.
- **Where the bugs were written down.** Architect review of PR #89, recorded in `docs/plans/flake-login-relogin-plan.md:147-150`. That plan did not change them.
- **Gates.** All 4 CI checks stay. No spending. `arena` is banned, so the two shapes below were written by hand.
- **محاسب أهل الجزيرة answered on 2026-11-17, via EA, under Ameer's delegation.** The reply is under questions 5 and 6. A2 does not change a balance, an advance, an export, or `firestore.rules`.

## Words

- **Entry form.** The screen «قيد جديد». Its paint function is `entry` (`public/render.js:576`).
- **Pill.** A project button on that form (`public/render.js:610`). The selected pill is the one whose id equals `state.projectId`.
- **Open list.** Projects the form offers. `projectList(..., 'open')` starts from `visibleProjects` (`public/ledger.js:60`, `:68`) and then keeps rows whose status is not archived (`public/ledger.js:69-70`). `isArchived` is `status === 'archived'` (`public/ledger.js:43`). `canSeeProject` is false for a site user who is not assigned. The default policy sets `siteSeesOnlyAssigned` (`public/ledger.js:20`), and the check is `public/ledger.js:49-53`. The form uses that list (`public/render.js:578`).
- **Outbox.** Ids saved on the phone and not sent yet (`public/session.js:4`).
- **syncErrors.** A map from an id to a refusal sentence. A refused row stays on the phone.
- **Owner.** A user whose role is `owner`. The check is `Ledger.can(user, 'owner')` (`public/ledger.js:76-78`). The code does not look at a person's name. A second owner phone is any other signed-in user with that role.
- **Memory.** The object `cache` (`public/session.js:9`). The screen reads it through `get` (`public/session.js:63`).
- **IndexedDB.** The phone's database `aj-u-<uid>` (`public/session.js:2`). `openUserDb` opens that name and then calls `loadAll` (`public/session.js:394-398`). The stores are `projects`, `entries`, `outbox`, and `meta` (`public/session.js:36-37`). A reload reads them in `loadAll` (`public/session.js:43-56`).
- **Kept line.** A row whose id was in the outbox, or named in `syncErrors`, on the snapshot taken before the drop. `dropProjectLocal` keeps those in its returned list only when `dropPending` is false (`public/sync.js:545-552`). r2 also keeps them in IndexedDB when `dropPending` is true.

## 0. What the code pull request will change

Two local behaviours. No Firestore write, no rules edit, no migration, and no edit or delete of an existing Firestore document.

**A1.** The entry form stops copying the selection onto another project. If the project the form was using is no longer in the open list, حفظ does not store a row. The user can tap a pill. That tap is the only way the selection changes.

**A2.** After the server has already confirmed that a project document is gone, the phone deletes that project's local row from IndexedDB, and it deletes the synced entry rows `dropProjectLocal` removed. It does not delete an entry id that was in the outbox or named in `syncErrors` before the drop. A reload does not bring the project back, and it does not lose that kept line.

The live books include the health-center project in قضاء العلال. This plan does not read that project, does not name its document id, and does not write to the live Firebase project `ahl-aljazeera-accounting`. A local IndexedDB delete runs only for an id `dropProjectLocal` already removed after a missing-document read, or after `deleteProject` has returned.

The service worker is `aj-p0-v64` today (`public/sw.js:2`). The code pull request edits `public/`, so it bumps `const VERSION` in that file. This plan does not.

## 1. Already decided

EA, under Ameer's delegation, 2026-11-17 03:56 Baghdad. This plan designs inside these decisions.

- Block the save with a clear "this project is gone" message. Never switch projects silently. If a re-pick is offered, the user chooses. Nothing is auto-switched.
- A1 needs the accountant. The exact words and the exact re-pick details are questions in section 9, each with a recommended default.
- Never delete or alter the real server data. Drop locally only what the server confirmed dropped.
- Never drop a kept line. That is the keep-rule `dropProjectLocal` already uses, and it is the same idea as answers-file option أ (E plan N6): a row the server refused stays on the phone with its amount. The sketch records that choice at `docs/plans/contractor-pr-e-sketch.md:612` and `:638`, and the emulator note at `:539`. The answers file itself is not in this commit.
- No `firestore.rules` change. No migration. No edit or delete of an existing Firestore document.
- Prefer a sentence the app already shows. A new Arabic sentence is a question for EA and Ameer. It is not typed into the app in this plan.
- Say what happens offline, after reconnect, and on two owner phones.

Option أ, as the E sketch records it: the server refuses a new row whose project document is gone, the phone shows the existing «رُفض الإرسال لأن المشروع محذوف» only after the project probe says the document is missing, and the row stays. That sentence is `public/sync-status.js:15`. The probe relabels only the generic refusal, and only when the document is missing (`public/sync-status.js:157-160`). A create on a project that still exists and is active is a different case: `projectOpen` requires the document and `status == 'active'` (`firestore.rules:52-54`, used from `firestore.rules:121-123`). An entry that was silently moved onto another active project would pass that rule. That is why A1 must not move it.

## 2. Root cause

### A1. The form hands the entry to another project

`state` starts with no `projectId` (`public/render.js:40`). The field is optional (`public/render.js:37`). The hash `#entry` calls `entry` with no id. The hash `#entry/<id>` passes that id (`public/render.js:1138`, `:1188`).

Inside `entry`:

1. Line `public/render.js:584` copies a hash id into `state.projectId` when the hash has one.
2. Line `public/render.js:585` then asks whether that id is in the open list. If it is not, it sets `state.projectId` to `projects[0].id`.

`projects` here is the open list, not the full stored list (`public/render.js:578`). So this line runs when the selected project was removed, and it also runs when the selected project is archived, and it also runs the first time the form opens and nothing was chosen yet.

حفظ reads `state.projectId` and builds the entry (`public/render.js:1268-1284`). `commit` appends it and puts the id in the outbox (`public/render.js:332-336`). `append` stores the row only when `validateEntry` returns no errors (`public/ledger.js:245-247`).

Two projects, the selected one gone, the other still open. Line 585 points the form at the other project. The pill for that other project is drawn as selected (`public/render.js:610`). حفظ then stores a normal entry on it. The server accepts that entry, because the other project is still active (`firestore.rules:52-54`). The amount lands on the wrong project. The typed amount and note are still the ones the user entered (`captureForm` keeps them, `public/render.js:915-922`).

One project, and that project is gone. `projects[0]` is missing, so line 585 sets `state.projectId` to `undefined`. `validateEntry` does not find a project and pushes «المشروع غير موجود» (`public/ledger.js:178-179`). `append` throws. The `catch` shows that message and does not store a row (`public/render.js:1300`). So the one-project case already stores nothing. It does it by clearing the id. The two-project case is the one that stores a row on the wrong project.

A pull that learns the project is gone calls `paintShell`, which calls `render` (`public/firebase-client.js:650-651`, and again at `:836`). That repaint is what runs line 585 while the form is open. The pill tap is a different path: it sets `state.projectId` from the button the user pressed (`public/render.js:1226`). That path is the explicit choice. Line 585 is the silent one.

`validateEntry` does not look at archived status. An archived project that is still stored would pass the "project exists" check (`public/ledger.js:178-179`). The form's open list is what hides it. Stopping line 585 is what stops the jump. The save guard has to refuse an archived id as well, because `validateEntry` would otherwise store the row.

### A2. The drop is remembered in memory and forgotten by IndexedDB

`dropProjectLocal` (`public/sync.js:542-590`) returns a new memory snapshot. The project is filtered out (`public/sync.js:578`). The name is copied into `goneProjectNames` when the name is a non-empty string (`public/sync.js:580-582`). A row whose id is in the outbox or in `syncErrors` stays when `dropPending` is false (`public/sync.js:545-552`). The comment above the function says the same thing (`public/sync.js:533-535`).

`writeCache` copies that snapshot into memory by calling `set` (`public/firebase-client.js:497-509`). `set` replaces the memory value immediately (`public/session.js:70`). For `projects` and `entries`, the IndexedDB write is a `put` of each row in the new array (`public/session.js:77`). There is no `delete` of a row that was left out. The comment on that line says entries and projects are never deleted. `outbox` is the exception: it clears, then writes the new ids (`public/session.js:75`). Every key that is not in `LIST` goes to `meta` as one whole value (`public/session.js:73`, `:78`), so a dropped subcontract, a dropped finance key, `syncErrors`, and `goneProjectNames` do survive a reload.

`loadAll` then does `getAll` on `projects` and `entries` (`public/session.js:47-51`). The project row that `put` never deleted comes back. The synced entry rows that were removed from the memory array come back the same way. A kept entry is still in the array that was `put`, and it was never deleted, so it also comes back. The bug is the resurrection of the project and of the synced entries. The kept line is not deleted today. The danger is a later "fix" that clears the store and loses that line, and a reload that shows the project again so the kept line looks like it belongs to a live project.

Who calls the drop:

- Another phone, or the same phone on a later pull. `pull` calls `forgetGoneProjects` (`public/firebase-client.js:384`, function at `:516-530`) with `dropPending: false` (`:530`). Today that call does not wait for IndexedDB. An owner, and only an owner, reads each local project that already has `createdAtServer`. The id-read returns an empty array when `exists()` is false (`public/firebase-client.js:310-312`), and an empty array adds the id (`:522-528`). A thrown read never becomes that empty array, so a failure does not add the id, and the drop at `:530` does not run. A project that is still unsent and still in the outbox is held and is not dropped (`:517-520`). A site user does not run that extra loop. A site user's project reads are one read per assigned id (`public/sync.js:382`), and a missing id is reported as `missingProjectIds` (`public/sync.js:451`). Those ids are dropped with the same `dropPending: false`.
- The phone that deleted it. `deleteProjectNow` calls the server first (`public/render.js:1038`). Only after that returns does it drop locally with `dropPending: true` (`public/render.js:1039`). Offline, it stores nothing and shows «الحذف يحتاج اتصالاً. لم يُحذف شيء.» (`public/render.js:1029-1031`).
- Demo. `?role=` calls `writeCache` (`public/render.js:1022-1023`). Memory and `meta` update. The project row stays in the `projects` object store, because `set` does not delete it. There is no server.

An owner's project read is one collection query (`public/sync.js:381`). A later sync adds a time bound and still has no document id (`public/sync.js:354-360`). `missingRequestedIds` skips a spec that has no id (`public/sync.js:527`). So an owner does not learn about a gone project from `missingProjectIds` (`public/sync.js:451`). The owner learns from the per-document read in `forgetGoneProjects`.

`pull` also `put`s the merged project list before that drop (`public/firebase-client.js:337-338`). `mergeById` keeps a local row the server did not send (`public/sync.js:282-290`). The IndexedDB delete has to be queued after that `put`. If it runs first, the pull's `put` writes the project back.

The existing unit fake shows the hole. Its `put` replaces a row with the same id and never deletes (`tests/rejected-entries.test.js:290-293`). The test drops two projects, reloads, and checks an exported-id list. It does not check that the projects stayed gone (`tests/rejected-entries.test.js:338-345`). `set` of a project array records one `put` and no delete (`tests/session-get.test.js:240-242`).

A kept refused row is listed on «رُفض الإرسال لأن المشروع محذوف» when its `syncErrors` value is that exact sentence (`public/ledger.js:351-356`, `public/render.js:539`, screen at `public/render.js:817-847`). A row that is only in the outbox is not on that screen (`tests/rejected-entries.test.js:255-256`). The bell still shows the unsent count (`public/render.js:1080-1084`). `visibleEntries` hides a row whose project is not in the visible project list (`public/ledger.js:101-103`). So after a real drop, a still-queued line stays in memory and in the bell count. It does not stay on a project card. Section 9 asks whether that is enough.

## 3. Two shapes

The architect pass is two shapes. One owner for each piece of state. One way to do the task. Callers learn as little as possible.

### Shape A, not chosen

Change `set` so a `projects` or `entries` write deletes IndexedDB keys that are absent from the new array. Memory and the database would match after every `set`.

This makes every caller of `set` a drop policy. A short list would delete a real local project, including a project the server still has. The health-center project would be one reload away from disappearing off the phone until the next pull could bring it back, and an offline phone would not get that pull. A short `entries` list would delete a kept line. The comment on `public/session.js:77` is there so that does not happen. `outbox` already clears because the outbox is a small id list (`public/session.js:75`). Projects and entries are not that list.

### Shape B, chosen

Leave `set` as it is. `dropProjectLocal` remains the only function that decides which rows leave the memory snapshot. It reports the ids it removed. A new function in `session.js` deletes project ids and synced entry ids from the two object stores, in one IndexedDB transaction. It never deletes an entry id that was in the outbox or in `syncErrors` on the snapshot taken before the drop. `writeCache` copies the snapshot and then puts those kept ids back into the stored outbox and `syncErrors`, because `set` would otherwise clear them (`public/session.js:75`, `:78`). The delete has two callers, and both already know the server agreed: `forgetGoneProjects`, and `deleteProjectNow` after `deleteProject` has returned. Demo calls `writeCache` and does not call the delete. Ordinary `set` cannot delete a project.

One owner for "which row leaves memory": `dropProjectLocal`. One owner for "which of those ids may leave IndexedDB": the new session function, using the pre-drop snapshot. The callers are the two confirmed paths, not every `set`. `entryProjectChoice` is the one owner for "which project the form is bound to". `entry` and حفظ both call it. The pill tap stays the only writer of a new choice.

### Shape not chosen, the hide-on-load

Keep the IndexedDB rows, and filter them out in `loadAll` by `goneProjectNames`. An empty name never gets a key (`public/sync.js:582`), so a nameless project would come back. Synced entries would also come back, and `loadAll` would need its own copy of the keep-rule. The screen and the database would still disagree. The bug named at `public/session.js:77` would still be there.

## 4. Types and functions

Signatures only. No bodies in this pull request.

```javascript
/**
 * '' means the save may store a row.
 * 'missing' means the id is not stored, or it is stored and this user cannot see it.
 * 'archived' means the stored row has status 'archived'.
 * @typedef {'missing' | 'archived' | ''} EntryProjectBlock
 */

/**
 * @typedef {{
 *   projectId: string,
 *   blocked: EntryProjectBlock,
 * }} EntryProjectChoice
 */

/**
 * @param {{
 *   requestedId?: string,
 *   currentId?: string,
 *   openIds: readonly string[],
 *   stored?: readonly { id?: string, status?: string }[] | null,
 * }} input
 * @returns {EntryProjectChoice}
 */
function entryProjectChoice(input)
```

Lives in `public/ledger.js` and is exported on `Ledger`, next to `projectList`. `openIds` is the open list. `stored` is every project still in memory, including archived and including a project this user can no longer see. The rules:

1. A non-empty `requestedId` that is in `openIds` wins. `blocked` is `''`. This is the hash `#entry/<id>` and it is an explicit open.
2. A non-empty `requestedId` that is not in `openIds` is kept as `projectId`. The function does not look at `currentId` and does not look at `openIds[0]`. `blocked` is `'archived'` only when the stored row's status is archived (`public/ledger.js:43`). Otherwise `blocked` is `'missing'`. That includes an id that is not stored, and a stored active project a site user is no longer assigned to (`public/ledger.js:53`).
3. A non-empty `currentId` that is in `openIds` stays. `blocked` is `''`.
4. A non-empty `currentId` that is not in `openIds` stays. Same `blocked` split as rule 2. `openIds[0]` is not used.
5. When nothing was requested and nothing is current, and `openIds` has a row, `projectId` is `openIds[0]` and `blocked` is `''`. This is the first paint only.
6. When nothing was requested, nothing is current, and `openIds` is empty, `projectId` is `''` and `blocked` is `'missing'`.
7. After a block, rule 5 does not run. The blocked id stays, even when `openIds` has exactly one id. Nothing fills it in. The screen does not clear `state.projectId` while the result is blocked. Rule 1 does not run either. A typed or changed hash, including `#entry/<open id>`, does not clear the block. The only way back to `blocked: ''` is a tap on a project pill (`public/render.js:1226`). EA answers (2026-11-17): only that tap clears it.

```javascript
/**
 * Ids dropProjectLocal took out of the memory lists.
 * With dropPending true this includes queued and refused entry ids.
 * The IndexedDB delete does not treat that as permission to remove them.
 * @typedef {{
 *   projectIds: string[],
 *   entryIds: string[],
 * }} RemovedLocalIds
```

`DroppedProject` (`types/checkjs.d.ts:641-654`) gains one field, `removed: RemovedLocalIds`. `dropProjectLocal`'s return type (`types/checkjs.d.ts:727-731`) stays `DroppedProject` with that field. Existing checks read named fields (`tests/project-delete.test.js:64-83`). An extra field does not change those checks.

`dropProjectLocal` fills `removed` from the ids it already filters out of the memory lists. With `dropPending: false`, a queued id and a refused id are absent from `removed.entryIds` (`public/sync.js:552`). With `dropPending: true`, they are present, because that flag also removes them from the returned `entries`, `outbox`, and `syncErrors` (`tests/rejected-entries.test.js:495-496`). This plan does not change that memory split.

The Architect's fixture, checked again on `public/sync.js` at this commit, is project A and project B, entries `s`, `q`, and `r` on A, entry `b` on B, outbox `['q']`, and `syncErrors.r` set to «رُفض الإرسال لأن المشروع محذوف». `dropPending: false` returns entries `q,r,b`, outbox `["q"]`, and that `syncErrors` key. `dropPending: true` returns entries `b`, outbox `[]`, and `syncErrors` `{}`. r1 would have passed that second result as the guard, so `q` and `r` would have been deleted from the entries store. The server never had those two lines.

`projectDeleteBlock` does not look at the outbox or at `syncErrors` (`public/render.js:944-954`). It does not stop a delete while queued or refused ledger lines are still on the project.

```javascript
/**
 * One transaction on the projects and entries stores.
 * No clear. No Firestore read. No Firestore write.
 * Never delete an entry id that before.outbox contains.
 * Never delete an entry id that before.syncErrors names.
 * When the transaction runs, also skip an entry id that
 * get(K.outbox) contains or get(K.syncErrors) names.
 * Never delete a project id that get(K.projects) still contains.
 * before is the snapshot taken before dropProjectLocal.
 * The get calls read memory. A missing removed field deletes nothing.
 * @param {RemovedLocalIds | null | undefined} removed
 * @param {LocalStore | null | undefined} before
 * @returns {Promise<void>}
 */
function deleteRemovedLocalIds(removed, before)
```

Lives in `public/session.js`. It queues on the same `writing` chain as `set` (`public/session.js:71`). The caller passes the snapshot it already took for `dropProjectLocal`. There is no new server read.

```javascript
/**
 * @param {DroppedProject} next
 * @returns {Promise<unknown>}
 */
function writeCache(next)
```

`public/firebase-client.js`. The body still calls the same `set`s (`public/firebase-client.js:498-509`) and does not decide which ids to delete. It returns the `writing` promise. r3, after the Architect's NOTES on r2: the put-back is a union, written in that same `writing` chain, immediately after those puts and before `deleteRemovedLocalIds(next.removed, before)`. It is not `set(K.outbox, before.outbox)` and it is not `set(K.syncErrors, before.syncErrors)`.

The outbox value is `get(K.outbox)` at that moment, plus every id in `before.outbox` whose entry on `before` has the dropped project's id. The `syncErrors` value is `get(K.syncErrors)` at that moment, plus every key in `before.syncErrors` for those same entries. An id queued after `before` was taken stays, because it is already in the live `get`. `deleteLock` stops `flushRemote` (`public/firebase-client.js:586`) and does not stop `commit` from appending an outbox id (`public/render.js:335`), so that live `get` is what keeps the newer id.

`set` writes memory first (`public/session.js:70`), so the in-memory outbox and `syncErrors` become that same union in the same tick as the IndexedDB write. In that same tick the in-memory entries list is `next.entries` plus the kept rows from `before.entries` for the dropped project, the rows whose ids are in the union. Otherwise the outbox would name a row `dropPending: true` had already taken out of memory. `K.projects` is not put back. The project stays gone in memory and in IndexedDB.

The union is required because the outbox `set` clears the store (`public/session.js:75`) and the `syncErrors` `set` replaces the meta value (`public/session.js:78`). Without it, `dropPending: true` would drop `q` from the outbox store and `r` from `syncErrors` even though their entry rows stay. EA rejected question 8 option (b). The code pull request does not build it. The union and the guard stay anyway, because `forgetGoneProjects` still runs them with `dropPending: false` (`public/firebase-client.js:530`). On that path `next` already keeps the queued and refused ids, and the union adds back only an id `next` had dropped. Option (a) is what `deleteProjectNow` does: it returns before `deleteProject` (`public/render.js:1038`), so that phone does not reach `writeCache` or the put-back. Today the call at `:530` does not wait. The demo branch (`public/render.js:1022-1023`) calls `writeCache` only. The delete is queued on `writing` after the union, so it runs after the pull's earlier `put` of the merged list (`public/firebase-client.js:337-338`). The delete transaction still reads `get(K.outbox)` and `get(K.syncErrors)` when it runs.

`entry` (`public/render.js:576`) and the حفظ click (`public/render.js:1268`) both call `entryProjectChoice`. When `blocked` is not `''`, the حفظ button is disabled. A click does not run. `commit` is not called. `state.formId` does not change. The amount, the note, and the party stay. The accountant confirmed that a blocked save stores nothing. The pills are drawn from the open list, so a blocked id matches no pill and no pill gets the selected class. After the user taps a pill, the next paint has `blocked: ''` and the button is enabled.

The message on that paint depends on `blocked`. `missing` and the id is not stored: «هذا المشروع لم يعد موجوداً. لم يُحفظ القيد، اختر مشروعاً ثم احفظ.» `missing` and the row is stored but this user cannot see it: the existing «مشروع غير مسند» (`public/ledger.js:180`). `archived`: «هذا المشروع مؤرشف. اختر مشروعاً مفتوحاً ثم احفظ.» `validateEntry` still pushes «المشروع غير موجود» when a row is checked and the project is absent (`public/ledger.js:179`). The form does not use that sentence for this block. A bad amount still shows «المبلغ يجب أن يكون رقماً صحيحاً موجباً» (`public/ledger.js:119`) once the button is enabled, and stores nothing.

The new-entry form has no date box. حفظ sets `entryDate` to `today()` at the click (`public/render.js:1283`). EA answers (2026-11-17): that stays, with no change to today's code. The accountant says the form has no date box, so the "typed date" condition does not apply. The code pull request does not add a date test. A test of this line would only repeat behaviour the plan does not change.

The subcontract line (`public/render.js:587`) still fills an empty subcontract from the first contract of the current project. This plan does not change it. While the form is blocked, حفظ does not run, so that fill cannot store a row. After the user taps a project, the existing line may select that project's first contract. That is today's pill-tap behaviour. It stays out of this change.

Files the code pull request touches:

| File                                  | What                                                                                                                                                                                                                                                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/ledger.js`                    | `entryProjectChoice`, exported.                                                                                                                                                                                                                                                                           |
| `public/render.js`                    | `entry` and حفظ call it. حفظ is disabled while the choice is blocked. `deleteProjectNow` blocks when this phone still has a queued or refused line on that project, and shows the approved question 8 sentence. It does not call `deleteProject`. Option (b) is not built. Demo does not call the delete. |
| `public/sync.js`                      | `dropProjectLocal` fills `removed`. The keep-rule stays.                                                                                                                                                                                                                                                  |
| `public/session.js`                   | `deleteRemovedLocalIds(removed, before)`. `set` stays put-only for projects and entries.                                                                                                                                                                                                                  |
| `public/firebase-client.js`           | `writeCache` returns the promise. The next step in the `writing` chain unions the live outbox and `syncErrors` with `before`'s kept ids for the dropped project, and unions those kept entry rows back into memory. Then it waits for `deleteRemovedLocalIds(next.removed, before)`.                      |
| `types/checkjs.d.ts`                  | `EntryProjectChoice`, `RemovedLocalIds`, and `DroppedProject.removed`.                                                                                                                                                                                                                                    |
| `public/sw.js`                        | Bump `const VERSION`. Required because `public/` changed.                                                                                                                                                                                                                                                 |
| `tests/ledger.test.js`                | The choice function.                                                                                                                                                                                                                                                                                      |
| `tests/project-delete.test.js`        | `removed` matches the keep-rule.                                                                                                                                                                                                                                                                          |
| `tests/rejected-entries.test.js`      | The reload probe, on the fake IndexedDB this file already has.                                                                                                                                                                                                                                            |
| `tests/session-get.test.js`           | `set` of a shorter project list does not delete the missing id.                                                                                                                                                                                                                                           |
| `tests/emulator/project-gone.test.js` | New. Local emulator only.                                                                                                                                                                                                                                                                                 |
| `tests/browser-check.js`              | One check appended after the last check. The check at line 1820 is not edited.                                                                                                                                                                                                                            |
| `docs/PSTACK_INVENTORY.md`            | One new section. No status word flipped.                                                                                                                                                                                                                                                                  |

## 5. State transitions

`entryProjectChoice` is the whole transition. `render` is what runs it. A pill tap writes `state.projectId` and then renders (`public/render.js:1226`).

| Now                                     | Event                        | Next `projectId`    | `blocked`               | حفظ                             |
| --------------------------------------- | ---------------------------- | ------------------- | ----------------------- | ------------------------------- |
| Nothing chosen, open list has a project | First paint of `#entry`      | The first open id   | `''`                    | Stores, as today                |
| Nothing chosen, open list empty         | First paint                  | `''`                | `missing`               | Does not store                  |
| An open id                              | Repaint, id still open       | That id             | `''`                    | Stores                          |
| A chosen id                             | That id leaves the open list | The same id         | `missing` or `archived` | Button disabled, stores nothing |
| Blocked, one open project left          | Repaint                      | The same blocked id | `missing` or `archived` | Button stays disabled           |
| Blocked                                 | User taps a pill             | The tapped id       | `''`                    | Stores on the tapped project    |
| Not blocked                             | Hash `#entry/<open id>`      | That id             | `''`                    | Stores on that project          |
| Blocked                                 | Hash `#entry/<open id>`      | The same blocked id | `missing` or `archived` | Button stays disabled           |
| Any                                     | Hash `#entry/<id not open>`  | That id             | `missing` or `archived` | Does not store                  |

`archived` in that table is only `isArchived` (`public/ledger.js:43`). A stored project this user cannot see, including a site user whose assignment was removed (`public/ledger.js:53`), is `missing`. The words for that case are question 10. `validateEntry` already uses «مشروع غير مسند» for that user (`public/ledger.js:180`).

Leaving the entry screen still clears the form message (`public/render.js:1148`). The amount and the note stay in `state` while the form stays up, because `captureForm` runs at the start of the next paint (`public/render.js:915-922`). A reload builds a new `state` (`public/render.js:40`). The typed draft is not in IndexedDB today, and this plan does not start storing it. The blocked id is not stored, so rule 5 may select the first open project, and there is no leftover draft to put on it. Rule 7 applies only while that same draft is still on screen.

```text
nothing chosen
    | first paint, some open project
    v
selected ---- repaint, id still open ----> selected
    | id leaves the open list
    v
blocked ---- tap a pill ----> selected
    | حفظ
    v
message, no row, same draft, same form id
```

## 6. Offline, reconnect, two phones

**Offline, before anyone has confirmed the delete.** `forgetGoneProjects` runs only from `pull` (`public/firebase-client.js:384`), and `pull` runs from the flush. The offline listener only repaints (`public/render.js:1489`). The open list does not change. The form stays on the project the user picked. حفظ stores a local row and queues it, which is today's offline save. The phone that would delete is refused offline (`public/render.js:1029-1031`). No IndexedDB delete runs, because the server has not confirmed anything.

**After reconnect.** The online listener starts a flush when someone is signed in and the page is not in demo (`public/render.js:1485-1486`). Demo only repaints (`public/render.js:1487`). The flush sends the outbox, then pulls (`public/firebase-client.js:819`, paint at `:836`).

- A row that was saved while the project still existed on the server follows the existing path. If the project document is now gone, the probe can relabel the refusal to «رُفض الإرسال لأن المشروع محذوف» (`public/sync-status.js:157-160`), and `dropProjectLocal` keeps that row because it is in `syncErrors`. A1 does not run, because the row was already stored. Option أ already covers it.
- If the pull then removes the project from memory while the form is still open, A1 blocks the next حفظ. The row that was already stored is not rewritten onto another project.
- The code pull request waits for the IndexedDB delete before `forgetGoneProjects` returns. `pull` already waits for that function (`public/firebase-client.js:384`), and `paintShell` in the flush `finally` runs after the pull (`public/firebase-client.js:834-836`). A reload after that paint reads the deleted keys as gone. A reload that kills the page during the one transaction keeps the previous database: IndexedDB commits the whole transaction or none of it. The kept line is not in the delete list, so it is still there either way. The next online pull tries the drop again. `deleteRemovedLocalIds` on an id that is already gone is a no-op.

**Two owner phones.** Both are `role == 'owner'`. No name is compared.

- Phone A is the deleting phone. If it still has a queued or refused line on that project, it blocks the delete before `deleteProject` and shows the approved question 8 sentence. Nothing is removed from the server or from IndexedDB. Option (b) is not built. Option (c) stays ruled out. `forgetGoneProjects` on either phone still passes `before` into `deleteRemovedLocalIds`, so a queued or refused id is not deleted from IndexedDB.
- Phone B has the form open on that project, or it has a queued line, or it has a refused line. Phone B learns on its next pull, including the pull after it comes back online. `dropPending` is false. The queued line and the refused line stay in the entries store, the outbox, and `syncErrors`. The project row leaves IndexedDB. If phone B's form is open, A1 blocks حفظ and does not point it at phone B's other project.
- Both phones offline. Neither drop runs. Each one drops on its own reconnect, under the same rules. A kept line on phone B is phone B's row. Phone A's delete does not reach into phone B's IndexedDB.

A site phone uses the same `deleteRemovedLocalIds`. It gets there from `missingProjectIds`, not from the owner-only probe. It cannot press the delete button (`manageProject` is owner-only, `public/ledger.js:79`). Its kept lines follow `dropPending: false`.

## 7. Test plan

No test in this pull request. The code pull request runs these. None of them talk to the live Firebase project. The emulator tests use the local Auth and Firestore emulators. The reload probe uses the fake IndexedDB in the unit file, and the emulator repeats it with a fresh page load.

Each new test has a mutation that makes that test fail. Tests 16 and 17 each name two, and each is run separately. The mutation is not left in the tree.

### Unit

1. **Choice, two projects.** `openIds` is `['p-b']`, `stored` is `[{ id: 'p-b' }]`, `currentId` is `'p-a'`. The result is `{ projectId: 'p-a', blocked: 'missing' }`. Mutation: return `openIds[0]` and `blocked: ''`. That is line `public/render.js:585`. The test goes red.
2. **Choice, first paint.** `currentId` and `requestedId` empty, `openIds` is `['p-a', 'p-b']`. The result is `{ projectId: 'p-a', blocked: '' }`. Mutation: always return `blocked: 'missing'`. The test goes red.
3. **Choice, hash.** `requestedId` is `'p-b'` and it is open, `currentId` is `'p-a'`. The result uses `'p-b'`. Mutation: ignore `requestedId`. The test goes red.
4. **Choice, hash of a gone id.** `requestedId` is `'p-a'`, not open, not stored, and `openIds` is `['p-b']`. The result stays `'p-a'` and `missing`. Mutation: fall through to `'p-b'`. The test goes red.
5. **Choice, archived.** `currentId` is `'p-a'`, the stored row has `status: 'archived'`, and `openIds` does not contain it. The result is `blocked: 'archived'` and the id stays. Mutation: treat it as `openIds[0]`. The test goes red.
   5b. **Choice, not assigned.** The stored row for `'p-a'` is active, `openIds` does not contain it, and the user is a site user who is no longer assigned (`public/ledger.js:53`). The result is `blocked: 'missing'`, not `'archived'`. Mutation: return `'archived'`. The test goes red. That is the N3 mix-up.
6. **Keep-rule ids.** `dropProjectLocal(..., { dropPending: false })` on a store with a synced entry, a queued entry, and a refused entry. `removed.projectIds` is the project. `removed.entryIds` contains the synced id and does not contain the queued id or the refused id. The queued and refused rows are still in `entries`. Mutation: push the queued id into `removed.entryIds`. The test goes red. The existing keep assertions stay (`tests/project-delete.test.js:77-81`, `tests/rejected-entries.test.js:491-494`).
7. **Reload probe, other phone.** Fake IndexedDB, the same shape as `tests/rejected-entries.test.js:271-301`. Seed project A, project B, a synced entry on A, a queued entry on A, a refused entry on A. Take `before`, call `dropProjectLocal(before, A, { dropPending: false })`, `writeCache`, put back nothing new because `before` and the result agree on the kept ids, then `deleteRemovedLocalIds(next.removed, before)`, await, then `loadAll`. A is absent. B is present. The synced entry is absent. The queued entry is present. The refused entry is present. `goneProjectNames.A` is A's name. Mutation: `deleteRemovedLocalIds` does nothing. `loadAll` shows A again. The test goes red.
8. **Outbox guard.** Call `deleteRemovedLocalIds` with the queued id inside `removed.entryIds` and also inside `before.outbox`. The live outbox and the live `syncErrors` do not contain that id. After `loadAll` the queued row is present. Mutation: ignore `before.outbox` and delete every passed entry id. The test goes red.
   8b. **syncErrors guard.** The same call with the refused id inside `removed.entryIds` and `before.syncErrors`. The live outbox and the live `syncErrors` do not contain that id. After `loadAll` the refused row is present and its `syncErrors` value is unchanged. Mutation: ignore `before.syncErrors`. The refused row is gone. The test goes red.
   8c. **Project guard.** `removed.projectIds` lists A and B. After `writeCache`, `get(K.projects)` still contains B and does not contain A. `deleteRemovedLocalIds` runs. After `loadAll`, A is absent and B is present. Mutation: delete every project id in `removed` and ignore `get(K.projects)`. B is gone. The test goes red.
9. **set stays append-only.** `set('projects', [one of two rows])`, then `loadAll`. Both rows are present. Mutation: make `set` delete keys that are not in the array. The test goes red. This is the lock that keeps Shape A out.
10. **No clear.** The fake records calls. `deleteRemovedLocalIds` does not call `clear` on `projects` or `entries`. Mutation: `clear` then `put`. The test goes red. A `clear` is how a crash in the middle would lose a kept line. The one transaction deletes by id instead.

### Emulator

New file `tests/emulator/project-gone.test.js`. Local emulators only.

11. **Two projects, form open.** Sign in as an owner (the role, not a fixed display name). Create project A and project B on the emulator. Open `#entry`, tap A, type an amount and a note. Delete A's document the way the app already deletes a project. Let the pull finish. Assert no pill has the selected class, the amount and the note are still in the fields, and حفظ does not create a `ledgerEntries` document. B's entry count is unchanged. The on-screen sentence is the one EA approved in section 9. Mutation: put line `public/render.js:585` back. حفظ creates a document whose `projectId` is B. The test goes red.
12. **One project.** The same, with only A. حفظ stores nothing. `state`'s project id is still A's id. Mutation: set the id to `undefined` and call `commit`. The choice assertion goes red even though `validateEntry` would still store nothing.
13. **Reload probe.** Owner, project A with a synced entry and a second entry that the server has refused with «رُفض الإرسال لأن المشروع محذوف». Pull, await the cache promise, load the page again against the same `aj-u-` database. A is not in the project list. The refused row is on the rejected screen. The bell count for a separate still-queued id is unchanged. Mutation: skip `deleteRemovedLocalIds`. The reloaded page shows A's name. The test goes red.
14. **Second owner phone.** Two users, both `role: 'owner'`, different uids. Phone A deletes. Phone B has a queued entry on that project and the form open. After phone B's pull, reload. The queued entry row is still in the entries store, the id is still in the outbox, the form does not select phone B's other project, and حفظ on phone B creates no document. Phone B uses `dropPending: false` (`public/firebase-client.js:530`), so `removed.entryIds` does not contain that queued id (`public/sync.js:552`). Passing `next` instead of `before` still deletes only the project and the synced entry. That mutation stays green. The mutation that goes red pushes the queued id into `removed.entryIds` and drops the `before` guard and the live outbox and `syncErrors` guards. After reload the queued entry row is gone.
15. **Offline.** With the form open and the project still present, set the page offline before any confirming pull. حفظ queues one entry on that same project. The other project does not gain a row. Then go online. The existing refusal path may relabel the queued row. It must not create a second row on the other project. Mutation: while offline, replace the chosen id with `openIds[0]` before حفظ. The queued entry's `projectId` is the other project. The test goes red.
16. **Probe, deleting phone.** Unit, on the fake IndexedDB, not the emulator. Use the fixture in section 4: entries `s`, `q`, `r` on A, `b` on B, outbox `['q']`, `syncErrors.r` set. After `before` is taken, queue a new id `n` on project B, a save that lands before the union. `dropPending: true`, then the union, then `deleteRemovedLocalIds(next.removed, before)`, then `loadAll`. A is absent. `s` is absent. `b` is present. `q` and `r` are present in the entries store. The outbox still contains `q` and `n`. `syncErrors.r` is still «رُفض الإرسال لأن المشروع محذوف». Two mutations, run separately, neither left in the tree. Passing `next` instead of `before` stays green, because the union has already put `q` and `r` into the live lists and the delete reads those lists. The mutation that goes red drops the `before` guard and the live outbox and `syncErrors` guards, and it skips the union. `q` and `r` are deleted. Replace the union with `set(K.outbox, before.outbox)`: `n` is absent. Each of those two turns the test red.
17. **deleteProjectNow survives a reload.** On the local emulator, an owner has project A, a synced entry `s`, and `q` and `r` still on the phone, and starts the delete. The new outbox and `syncErrors` check in `projectDeleteBlock` (`public/render.js:944-954`) stops the delete before `deleteProject` (`public/render.js:1038`). A reload still shows A, `q`, and `r`. A's server document still exists. The screen shows «في هذا المشروع قيود لم تُرسل أو رُفض إرسالها. أرسلها أو صدّرها قبل الحذف.» Mutation: remove that new check. The server delete runs, and after a reload A is gone. The test goes red. Option (b) is not built. The guard that would have kept `q` and `r` if a delete did run is test 16, not a second product path.
18. **Demo does not persist.** `?role=owner` runs the demo branch (`public/render.js:1022-1023`) and does not call `deleteRemovedLocalIds`. `loadAll` still has the project row. Mutation: the demo branch calls `deleteRemovedLocalIds`. The project is absent after `loadAll`. The test goes red.
19. **Thrown read does not drop.** The owner probe's read throws. `forgetGoneProjects` does not call `dropProjectLocal`. The project is still in memory and in IndexedDB. Mutation: treat the throw as an empty array and drop. The project is gone. The test goes red. An empty array is still the only confirmation (`public/firebase-client.js:310-312`).

### Browser

Append checks 21–24 after the last current check. Do not edit the check at `tests/browser-check.js:1820`. That line is the site-user export flake. It gets its own plan. Appending after it leaves that statement where it is.

21. **Demo form.** `?role=owner`, open `#entry`, remember the selected project id, remove that project from the local project list, render, type a valid amount. The message is «هذا المشروع لم يعد موجوداً. لم يُحفظ القيد، اختر مشروعاً ثم احفظ.» حفظ is disabled. The other demo project does not gain an entry. Mutation: the old line 585, and the button is enabled. The entry's `projectId` is the other demo project. The test goes red. This check does not open a Firebase project.
22. **No auto-select after a block.** `currentId` is the gone id, `openIds` has exactly one other id. The result keeps the gone id and stays blocked. No pill is selected. Mutation: when `openIds.length === 1`, return that id and `blocked: ''`. The test goes red.
23. **حفظ stays disabled.** The form is blocked. The حفظ button is disabled. A click stores nothing. The amount, the note, and the party are still in the fields. Mutation: render the button without `disabled`. A click stores a row. The test goes red.
24. **A hash does not clear a block.** The form is blocked. Set the hash to `#entry/` plus an open project id and fire `hashchange`. The choice stays blocked, no pill is selected, and حفظ stays disabled. Mutation: let that hash change clear the block and select the open id. The test goes red.

The code pull request does not add a retry, a skip, or a longer sleep. It does not edit the login-relogin wait. It does not point the new emulator file at production.

## 8. Blast radius

- **Wrong project.** The behaviour that changes is line `public/render.js:585`. A first paint with nothing chosen still selects the first open project (rule 5). A hash of an open id still selects it (rule 1). A pill tap still selects it (`public/render.js:1226`).
- **Archived.** The same line today also jumps away from an archived project, because the open list omits it (`public/ledger.js:69-70`). The chosen shape blocks that jump too. `blocked` is `'archived'` only when `isArchived` is true (`public/ledger.js:43`). `validateEntry` would have stored an archived row that is still in the list (`public/ledger.js:178-179`). The block is what stops it. The form shows the approved question 2 sentence.
- **Not assigned.** A site user who lost the assignment is `missing`, not `archived` (`public/ledger.js:53`). The words are question 10, the existing «مشروع غير مسند» (`public/ledger.js:180`).
- **Amounts already stored.** A1 does not rewrite them. A refused row stays a refused row. `countedEntries` still leaves `syncErrors` ids out of totals (`public/ledger.js:307-309`).
- **Server.** No new call to `deleteProject`. No rules change. `projectOpen` stays the server's answer to a create (`firestore.rules:52-54`). The local delete cannot remove a project the server still has, because that id is never placed in `removed`.
- **Keep-rule.** `dropPending: false` at `public/firebase-client.js:530` stays for the other phone. `dropPending: true` at `public/render.js:1039` still describes the memory snapshot on the deleting phone. The IndexedDB delete is stricter than that snapshot: an id in `before.outbox` or `before.syncErrors` is not deleted. r1 followed `removed` alone, and that was the error.
- **Other stores.** Subcontracts, amendments, finance, terms, foremen, `syncErrors`, and `goneProjectNames` already go through `meta` (`public/session.js:73`, `:78`). This plan does not move them into object stores. `dropProjectLocal` at this commit does not return parties, agreements, or account rows. Those values are not passed to `writeCache`, so they are not deleted. E's later edit of `dropProjectLocal` has to keep the `removed` field and the keep-rule. This plan does not do E's edit.
- **Order.** The pull `put`s projects before the drop (`public/firebase-client.js:337-338`, then `:384`). `forgetGoneProjects` queues the delete after `writeCache` returns its place on `writing`, so the delete runs after that `put`.
- **Crash.** One transaction for both object stores. No `clear`. A crash rolls back to the previous database, which is today's resurrection, and the next pull tries again. A crash cannot commit a deleted kept line and a surviving project as a half-finished pair.
- **Demo.** The recommended default does not persist the demo drop. Browser checks that use `?role=` keep today's memory-only demo delete. Question 9.
- **Neighbours left alone.** The subcontract auto-fill (`public/render.js:587`). The reversal button (`public/render.js:1301-1304`), which already fails `validateEntry` when the original project is gone. The login-relogin flake. `tests/browser-check.js:1820`. `firestore.rules`. The live project.

`docs/PSTACK_INVENTORY.md` is not in this pull request. The code pull request adds a section and does not flip a status. `setup-pstack` stays «ناقصة» (`docs/PSTACK_INVENTORY.md:77`). The header counts stay as they are (`docs/PSTACK_INVENTORY.md:3`) unless some other change has already edited the file. The code pull request recounts from the table if it touches the file, and it still does not flip a word.

## 9. Questions for EA

The question text below is unchanged. EA answered on 2026-11-17 under Ameer's delegation. The accountant answered questions 5 and 6 the same day, via EA. Each answer is the line under the question.

1. **Words when the project is not stored.** Recommended: the existing «المشروع غير موجود» (`public/ledger.js:179`). Leave «رُفض الإرسال لأن المشروع محذوف» (`public/sync-status.js:15`) for a send the server refused. Proposed sentence, unused unless approved: «هذا المشروع لم يعد موجوداً. اختر مشروعاً ثم احفظ.»

   EA answers (2026-11-17): On the entry form, the not-stored case uses «هذا المشروع لم يعد موجوداً. لم يُحفظ القيد، اختر مشروعاً ثم احفظ.» «المشروع غير موجود» stays everywhere else it is used today, including `validateEntry` (`public/ledger.js:179`). The proposed sentence above is not approved and stays unused.

2. **Words when the project is archived and still stored.** Recommended: do not reuse «المشروع غير موجود», and do not reuse «أرشفة هذا المشروع؟» (`public/render.js:984`). Proposed sentence, unused unless approved: «هذا المشروع مؤرشف. اختر مشروعاً مفتوحاً ثم احفظ.» Until a sentence is approved, an archived block shows no message. The save stays blocked, and the form does not switch projects.

   EA answers (2026-11-17): Approved. The form uses «هذا المشروع مؤرشف. اختر مشروعاً مفتوحاً ثم احفظ.»

3. **When the message shows.** Recommended: on the paint that first notices the block, and again if they tap حفظ. The amount, the note, and the party stay. The form id stays. A bad amount still shows the existing «المبلغ يجب أن يكون رقماً صحيحاً موجباً» (`public/ledger.js:119`) and stores nothing. The gone check runs only after the amount is valid.

   EA answers (2026-11-17): Default.

4. **First open, nothing chosen.** Recommended: the form may start on the first open project. That is not a switch. A later loss of a chosen id never replaces it.

   EA answers (2026-11-17): Default.

5. **Re-pick.** Recommended: the other pills stay, none of them is selected, and a tap is the choice. After the tap, حفظ stores one new entry on the tapped project, using the amount and the note already typed. It is not a transfer and not a reversal. The accountant should confirm that a typed amount may be saved onto a different project once the user has tapped it.

   EA answers (2026-11-17): Yes, with two conditions; the accountant withdrew the third (the form has no date box). After a block, the form never auto-selects a project, even when only one project is left. That is rule 7 and test 22. حفظ stays disabled until the user taps a project. That is test 23. A typed amount may be saved on the tapped project. EA answers (2026-11-17): only a tap on a project pill clears the block. A hash change does not. That is test 24. EA answers (2026-11-17): the date is the date of the click on حفظ, `today()` at the click (`public/render.js:1283`), with no change to today's code. The accountant says the form has no date box, so the "typed date" condition does not apply. There is no date test.

6. **What a blocked save stores.** Recommended, for the accountant: it stores nothing. It does not write a refused row, and it does not move the amount. Option أ stays the rule for a row that was already saved and then refused. This bug is a row that has not been saved.

   EA answers (2026-11-17): Yes. The default stands. A blocked save stores nothing. The amount, the note, and the party stay in the form.

7. **Where a kept line is visible.** Recommended: leave the screens as they are. A row whose `syncErrors` value is «رُفض الإرسال لأن المشروع محذوف» stays on the rejected screen. A row that is only in the outbox stays in the bell count (`public/render.js:1080-1084`) until the existing flush labels it. No new screen and no new sentence. The row stays in IndexedDB either way.

   EA answers (2026-11-17): Default.

8. **Deleting phone, queued or refused lines.** r1's default is withdrawn. It let `dropPending: true` (`public/render.js:1039`) remove those lines from memory, and the IndexedDB delete would then have erased them. The A2 rule rules that out. The other phone stays on `dropPending: false` (`public/firebase-client.js:530`). On this phone, pick one:
   - **(a) Recommended.** Block the project delete while this phone has a queued or refused line on that project. `projectDeleteBlock` does not do that today (`public/render.js:944-954`). The delete does not call the server. Proposed sentence, unused unless EA and Ameer approve it: «في هذا المشروع قيود لم تُرسل أو رُفض إرسالها. أرسلها أو صدّرها قبل الحذف.» The nearby logout sentences stay where they are (`public/session.js:371`, `:376`). Until that sentence is approved, a blocked delete shows no new Arabic.
   - **(b)** Allow the delete. The project row and the synced entries leave IndexedDB. The queued and refused rows stay, including the outbox id and the `syncErrors` key they had before the drop.
   - **(c)** Today's behaviour: `dropPending: true` drops those lines from memory, and a reload can still show the entry rows only because `set` does not delete them (`public/session.js:77`). Making that loss permanent is what r1 did. The A2 rule rules this option out.

   EA answers (2026-11-17): (a). Block the delete. Approved sentence: «في هذا المشروع قيود لم تُرسل أو رُفض إرسالها. أرسلها أو صدّرها قبل الحذف.» (b) and (c) are rejected. (b) is not built. The union in section 4 stays, because the guard still runs on `forgetGoneProjects`.

9. **Demo delete.** Recommended: do not persist it. There is no server confirmation (`public/render.js:1022-1023`). The example seed is not the health-center project. The missing-document path and the successful `deleteProject` path do persist.

   EA answers (2026-11-17): Default. A demo delete is not persisted.

10. **Words when a stored project is no longer assigned.** A site user can lose the assignment while the row is still stored and not archived (`public/ledger.js:53`). r1 called that `archived`. r2 calls it `missing`. Recommended: show the existing «مشروع غير مسند» (`public/ledger.js:180`). That sentence is already what `validateEntry` pushes. No new Arabic for this case unless EA rejects the reuse.

    EA answers (2026-11-17): Default. Reuse «مشروع غير مسند».

## 10. Inventory rows the code pull request would touch

This docs pull request does not edit `docs/PSTACK_INVENTORY.md`. The code pull request appends one section, in the same style as «Login-relogin pill» (`docs/PSTACK_INVENTORY.md:178-186`). Statuses above it stay. The file does not say the app is pstack-compliant. `arena` stays banned. `principle-attack-the-premise` does not apply (`docs/PSTACK_INVENTORY.md:23`): this is one plan, not two failed fixes of the same gate. `principle-redesign-from-first-principles` does not apply (`docs/PSTACK_INVENTORY.md:41`): the drop decision and the entry form already exist. The work stops one assignment and persists a drop the code already computed.

| Skill                           | What the code pull request can record                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `principle-fix-root-causes`     | Line 585 replaces the selected project. The fix stops that replacement and refuses the save. Line 77 puts rows and never deletes them. The fix deletes a confirmed-gone project and its synced entries, and it does not delete an id that was in the outbox or in `syncErrors` before the drop. A retry, a hide-on-load, a clear of the store, and guarding on the post-drop snapshot are not the fix. |
| `principle-prove-it-works`      | Unit tests 1–10, 5b, 8b, 8c, 16, 19. Emulator tests 11–15 and 17. Demo test 18. Browser checks 21–24. Each mutation above is run and pasted. The reload probes are tests 7, 13, 16, and 17. The probe fixture is test 16.                                                                                                                                                                              |
| `blast-radius`                  | Section 8. No rules diff. No live write. The check at `tests/browser-check.js:1820` is unchanged. `set` still does not delete.                                                                                                                                                                                                                                                                         |
| `bug-fix`                       | The defect is the one at `docs/plans/flake-login-relogin-plan.md:149-150`. The failing tests are written against the current lines, then the functions land.                                                                                                                                                                                                                                           |
| `principle-boundary-discipline` | `ledger.js` owns the choice. `render.js` paints it and handles the tap. `sync.js` owns which ids leave. `session.js` owns the IndexedDB delete. The callers are `forgetGoneProjects` and the successful branch of `deleteProjectNow`.                                                                                                                                                                  |
| `tdd`                           | A link only if the code pull request's history shows a failing run committed before the change that makes it pass. Landing the tests in the same commit is not that evidence.                                                                                                                                                                                                                          |

`principle-fix-root-causes` is line 30, `principle-prove-it-works` is line 40, `blast-radius` is line 58, `bug-fix` is line 104, `principle-boundary-discipline` is line 24, and `tdd` is line 82. Those status words stay «مطبّقة». The new section is evidence. It is not a new status.

## 11. Not in this pull request, and not in the code pull request

A retry, a skip, or a longer sleep. An edit to `tests/browser-check.js:1820`. An edit to the login-relogin wait. A change to `firestore.rules`. A migration. A write, an edit, or a delete of an existing document in the live project `ahl-aljazeera-accounting`. A production deploy. A second copy of the keep-rule inside `loadAll`. A change to `set` that deletes missing keys. Option (b) of question 8. Option (c) of question 8.

Three sentences are approved and are used. The entry form, when the project is not stored: «هذا المشروع لم يعد موجوداً. لم يُحفظ القيد، اختر مشروعاً ثم احفظ.» An archived block: «هذا المشروع مؤرشف. اختر مشروعاً مفتوحاً ثم احفظ.» A blocked project delete: «في هذا المشروع قيود لم تُرسل أو رُفض إرسالها. أرسلها أو صدّرها قبل الحذف.»

Still excluded: the earlier question 1 proposal «هذا المشروع لم يعد موجوداً. اختر مشروعاً ثم احفظ.» `validateEntry` keeps «المشروع غير موجود» (`public/ledger.js:179`). The unassigned form keeps «مشروع غير مسند» (`public/ledger.js:180`).
