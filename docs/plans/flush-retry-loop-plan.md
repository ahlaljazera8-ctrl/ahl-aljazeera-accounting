# Plan: the hot flush loop

Plan only. No application code in this change. Nothing under `public/`, `tests/`, or `firestore.rules`. The code pull request waits until AgentLab Architect and EA have reviewed this sketch. Ameer approves the merge and any behaviour change.

- **Repo.** `ahl-aljazeera-accounting`, read at `main` = `d40535a68714dafff60a8fed0481eb37ce751874`.
- **Gates.** Ameer approves every merge and every behaviour or rules change. All 4 CI checks stay, with no skips and no retries. No spending. `arena` is banned, so the two shapes below were written by hand, not spawned.
- **محاسب أهل الجزيرة was not asked.** This sketch does not change which amounts count, an advance, a ledger rule, an export, or `firestore.rules`. The display questions are for Ameer in the last section. If he wants a refused contract taken out of the profit figure, that later change asks the advisor before it is treated as a house rule.

## 0. What the next agent is building

A stop for the immediate `flushRemote()` tail in `public/firebase-client.js`, and a terminal mark for the two states that feed that tail. The outbox list, the row bodies, and the stored amounts stay. No new on-screen sentence. No new IndexedDB field. No Firestore lock document.

The service-worker `VERSION` in `public/sw.js` is `aj-p0-v63` at this SHA. The code pull request edits `public/firebase-client.js`, so that pull request bumps `VERSION`. This pull request does not.

Not in the code pull request: a longer CDP deadline, a poll, a retry of the browser job, a skip, a second flush entry point, a change to `firestore.rules`, a write to the production project `ahl-aljazeera-accounting`.

## 1. What the code does

`flushRemote` (`public/firebase-client.js:522`) returns immediately when `demoRole()` is set or there is no session user (`:524`). Otherwise it starts `performFlush` (`:618`).

`performFlush` returns before `ensureFirebase` when `navigator.onLine === false` (`:623`). Online, it calls `ensureFirebase` (`:624`), then `Sync.flushOutbox` with `write: local => fb.writeLocal(local)` (`:664-667`). `applyFlush` (`public/sync-status.js:169`) drops synced ids and failed ids from the outbox. A failed id gets `syncErrors[id]`. A synced id has its error deleted.

`writeLocal` (`public/firebase-client.js:246`) writes the project, then `projectFinance`, and clears `pending` only after that finance write when the amount still matches (`:274-283`). `if (!saved.finance) return` (`:274`) leaves `pending` as it was. A subcontract write throws `مبلغ العقد غير صالح` when `termsPayload` returns null (`:252`), after the name `putIfMissing`.

`flushOutbox` (`public/sync.js:594`) marks `isSeed` synced and does not call `write` (`:610`). `isSeed` is `isExample === true`, `deviceId === 'seed'`, or an id starting with `seed-` (`:10-12`). A thrown write is `kept` when `SyncStatus` is missing or `isTransient` (`:620`). Transient codes are `unavailable`, `deadline-exceeded`, `resource-exhausted`, `aborted`, `cancelled`, plus a timeout or a message matching offline / network-request-failed (`public/sync-status.js:96-107`). `permission-denied` is not in that list, so it is `failed`.

The tail (`public/firebase-client.js:752-761`) runs when `keptIds` is an array, the session still matches, the browser is online, and a session user is set. It calls `queuePendingFinance` (`:563`) and `queuePendingSubcontracts` (`:575`). Each one appends an id whose finance or terms row has `pending`, which has no `syncErrors[id]`, and which is not already in the outbox. If any outbox id was not in `keptIds`, the tail `return flushRemote()` with no timer.

A pull that throws is caught by the inner catch (`:732-742`). That catch does not set `keptIds` to null. The outer catch (`:743-747`) is what nulls `keptIds` and skips the tail. A mock with no `pull` still reaches the tail.

`queuePendingFinance` will not re-add an id that has a sticky error. The loop needs an id that was dropped and then put back with `pending` still true and no error. Two production paths do that:

1. A seed document is marked synced. `applyFlush` clears any error. `pending` is untouched because `write` never ran. The tail puts the id back and calls `flushRemote` again.
2. A non-seed project write succeeds, `splitProjectSave` returns no finance (`:274`), `pending` stays, the id is synced, and the tail puts it back.

`saveContract` (`public/render.js:185-204`) always stores an integer with `pending: true`. It does not create path 2. Path 2 is still the branch at `:274`. The demo projects `p-school`, `p-road`, and `p-market` are seeds (`public/app.js:38-39`). The demo subcontract rows are not: they have no `isExample`, no `deviceId: 'seed'`, and the id does not start with `seed-`.

The 20s timer (`FLUSH_MS`, `:537-542`) sets the notice `تعذر الإرسال. أعد المحاولة`. It does not call `flushRemote`. The next flush of a kept id is the online listener (`public/render.js:1485`), a new save, the bell, or boot.

## 2. Measured on the emulator

Measured at `2026-11-16T17:47:12.531Z`. Firestore `127.0.0.1:8080`, Auth `127.0.0.1:9099`, emulator jar `cloud-firestore-emulator-v1.22.0`, client SDK `13.1.0`, Node `v26.13.0`. The project id string was `ahl-aljazeera-accounting` because that is the emulator's project id. Both hosts were loopback. The harness refuses any other host. No production Firebase call was made.

The harness called the real `Sync.flushOutbox`, the real `SyncStatus.applyFlush`, and the real `queuePendingFinance` / `queuePendingSubcontracts` source cut from `public/firebase-client.js`. The write followed `writeLocal`'s calls (`setDoc` of `withServerTime`, then `projectFinance` for an owner). The pull arm called `Sync.pullChanges`, `financeReads`, `pullSubcontracts`, `pullForemen`, one `getDoc` per local project that has `createdAtServer`, and the `users/{uid}` `getDoc` that `refreshProfile` does. It did not call `idToken(true)`, `paintShell`, or `render`. A loop that would not stop was cut by the harness (5,000 rounds or 1.5s). The app has no such cut.

| Case                                                                              |                                                      Rounds | Firestore `setDoc`                          | Read calls                                      | Stop           | Local row and amount                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------: | ------------------------------------------- | ----------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seed `p-school`, finance `{contractAmount:60000000, pending:true}`, pull throws   |               5,000 in 55ms (90,909 rounds/s). Harness cap. | 0                                           | 0                                               | Would not stop | Project and 60,000,000 kept. No error. Outbox still `p-school`.                                                                                                                                                                       |
| Same seed, real pull                                                              |            15 in 1,526ms (9.83 rounds/s). Harness time cap. | 0                                           | 135 (45 `getDoc` + 90 `getDocs`), 88.47 calls/s | Would not stop | Same amount kept. No error.                                                                                                                                                                                                           |
| Site user, non-seed project, rules deny `projects` create (`firestore.rules:189`) |                                                   1 in 59ms | 1 denied, code `permission-denied`          | 1 `getDoc`                                      | Returned       | Project and amount 1,000 kept. `pending` still true. Error `رُفض الإرسال`. Outbox empty.                                                                                                                                              |
| Owner subcontract whose project is not on the server (`firestore.rules:245`)      |                                                   1 in 25ms | 1 denied, `permission-denied`               | 2 `getDoc`                                      | Returned       | Name row and terms 500,000 kept. Error `رُفض الإرسال`.                                                                                                                                                                                |
| Terms amount 0, name already on the server                                        |                                                   1 in 11ms | 0                                           | 2 `getDoc`                                      | Returned       | Terms `{originalAmount:0, pending:true}` kept. Error `القيد موجود على الخادم بمحتوى مختلف`, because the follow-up read saw a different server document. The throw's own sentence is not what is stored.                               |
| `writeLocal` missing, non-seed entry, pull throws                                 |                                                    1 in 6ms | 0                                           | 1 `getDoc`                                      | Returned       | Entry kept. Error `رُفض الإرسال`. The swallowed `pull` TypeError did not start a second round.                                                                                                                                        |
| `unavailable`                                                                     |                                  1 (clock did not move 1ms) | 0 committed. The throw was before `setDoc`. | 0                                               | Returned       | Id stayed in the outbox. No error. No second round.                                                                                                                                                                                   |
| `navigator.onLine === false`                                                      |                                           1, before `write` | 0                                           | 0                                               | Returned       | Outbox and 60,000,000 unchanged.                                                                                                                                                                                                      |
| Owner, valid contract 123,456                                                     |                                                   1 in 13ms | 2 committed (project and `projectFinance`)  | 0                                               | Returned       | Amount 123,456 kept. `pending` cleared. Outbox empty.                                                                                                                                                                                 |
| Constructed `{pending:true}` with no integer, non-seed project                    | 30 in 181ms (165.75 committed writes/s). Harness cap of 30. | 30 committed project writes                 | 0 (pull not in this arm)                        | Would not stop | Project row kept. The bare pending object kept. No error.                                                                                                                                                                             |
| Second owner cache, while the first owner's rules denial ran                      |                                 1 denial on the first cache | 1 denied                                    | 1 `getDoc`                                      | Returned       | The second cache's outbox, finance, and project were deep-equal before and after. The denial on an unassigned project id stored `القيد موجود مسبقاً وتعذر مطابقة محتواه` because the follow-up read was also denied. Still one round. |

### What that says about each failure

- **Rules rejection (`permission-denied`).** The id is dropped, `syncErrors[id]` is set, `queuePending*` does not put it back, `flushRemote` is not called again. Measured for a finance-shaped project write and for a subcontract write. This is not a hot loop. The local amount stays, with `pending` still true, which is why a sticky error is what stops the re-queue.
- **Validation error (`مبلغ العقد غير صالح`).** One round, then stop. Measured when the name was already stored: 0 writes. The source writes the name first (`:249-252`) and throws after that, so a missing name is one create and then the same terminal error. That missing-name order was not given its own emulator run.
- **Missing `writeLocal`.** One round on a non-seed id, then stop. The TypeError is not what repeats. The repeating id in the browser hang is the seed. Architect, on the rejected-save page, counted 3,186 `flushOutbox` rounds in about 3s, round 1 on the other ids and every later round on `p-school` only. `p-school` is `isExample` and `deviceId: 'seed'`, and the earlier contract save in that same page leaves `pending: true`. `isSeed` never calls `write`. That is the microtask arm above (90,909 rounds/s with a thrown `pull`, 0 Firestore calls).
- **Offline.** No write. `performFlush` returns at `:623`. The tail also requires online.
- **`unavailable`.** The id is kept, not dropped, so the tail does not see a fresh id. No immediate second call. No backoff timer exists today, and this plan does not add one.

The hot retry is real in the production functions. It is not "any rules rejection". It is the tail plus a dropped id whose `pending` flag survived. On a real client the seed arm does 0 writes and one pull per round. On the incomplete test mock the pull throws, the inner catch swallows it, and the tail runs as microtasks.

`idToken(true)` (`:631`) was not in the harness. It is an Auth call, not a Firestore write. It would slow a real round. It is not part of the rates below.

## 3. Quota

Cited limits, Spark plan, and the no-cost portion of Blaze. [Firebase pricing](https://firebase.google.com/pricing), Cloud Firestore Standard edition: 50,000 document reads/day, 20,000 document writes/day, 20,000 document deletes/day, 1 GiB stored, 10 GiB/month egress. The same daily read and write numbers are the free quota in [Usage and limits](https://firebase.google.com/docs/firestore/quotas). Quotas reset around midnight Pacific. One free database per project.

[Understand Cloud Firestore billing](https://firebase.google.com/docs/firestore/pricing), last updated 2026-11-12 UTC: there is a minimum charge of one document read for each query, even when it returns nothing. A `set` counts as one write. Requests denied by security rules do not count toward network bandwidth. That page does not say a denied write is free of the write charge.

**Measured.** Seed plus a real pull: 0 `setDoc` per round, 6 `getDocs` and 3 `getDoc` per round, 9.83 rounds/s, 88.47 read SDK calls/s, on an empty database, without `idToken` and without `render`. The bare-pending arm, without pull: 165.75 committed project writes/s until the harness stopped it at 30. A rules denial: 1 `setDoc` attempt, then stop.

**Inferred, not measured.** Each of the 6 queries is at least 1 billed read by the minimum-charge sentence. The `users/{uid}` get reads a document that exists: 1 read. The other two gets were of missing documents; counting each as 1 read is inferred, not a sentence on the page above. That is 9 billed reads per round. At the measured 9.83 rounds/s, about 88.5 billed reads/s. `50000 / 88.47 ≈ 565` seconds of this empty-database loop would pass the free daily read cap. The seed arm's writes stay 0, so it does not consume the 20,000 write cap.

The bare-pending loop does commit writes. `performFlush` also pulls, and the pull arm took 1,526ms for 15 rounds, so a round that does both cannot be faster than that pull. Inferred combined pace: about 9.8 committed writes/s and about 88 reads/s. The read cap arrives first (`≈ 565s`). The write cap at that pace is `20000 / 9.83 ≈ 2035s`. A production phone with rows in the collections bills one read per returned document, which is more than this empty run. `idToken(true)` would add time and is not in the 565s figure.

A single denied `setDoc` is one attempt. It is not the quota risk. Whether that one denial is billed as a write is not stated on the pricing page, beyond bandwidth.

## 4. Two shapes

Screened against the architect red flags. The next reader sees one file and copies the nearest call.

**Shape A. Classify, and leave the tail.** `isSeed` with `pending` still set becomes `failed` with the existing `رُفض الإرسال`, not `synced`. `writeLocal` clears a pending flag that has no integer before the early return, and does not delete a stored integer. The tail still `return flushRemote()` for a genuinely new id.

This hides the decision in `flushOutbox` and `writeLocal`, which already own it. It stops both measured loops: the seed gets an error, so `queuePendingFinance` will not put it back; the bare flag is gone, so there is nothing to put back. A rules denial already stops, and this shape does not add a second way to record it.

It fails the starvation case. The tail is still a microtask. Any later path that drops an id and leaves `pending` with no error freezes the page again, which is the hang Architect measured. Shape A alone is not the fix.

**Shape B. A timer, and no new classification.** The tail sets a flag. After the run, `setTimeout(flushRemote, 0)` starts one more flush. A permanent error does not set the flag. Transient ids stay `kept` and do not set it either.

This yields a task, so CDP and paint can run. It does not stop the quota burn. The seed id is still synced, the error is still cleared, and `queuePendingFinance` still puts it back. The next timer fires, the pull runs, and the reads continue at the pull's pace. A 0ms timer is not a backoff. Adding an exponential delay on top would retry a permanent failure, which is a poll. This plan does not add a poll.

**Synthesis.** Both pieces, one entry.

- Terminal: a seed whose finance or terms row is still `pending` is `failed` with `SyncStatus.REJECTED` (`رُفض الإرسال`). The amount stays. `pending` may stay. The error is what blocks `queuePending*`.
- Bare flag: when `writeLocal` is about to return because there is no finance payload, and the stored finance row has `pending` and no integer `contractAmount`, clear that pending flag. Do not delete the project. Do not delete an integer amount.
- Tail: do not call `flushRemote` from the tail. If an id was added that this flush did not already attempt, arm one `setTimeout(flushRemote, 0)`. A second arm while a timer is pending does not stack. The in-flight contract, the case the comment at `:752-753` describes, still flushes once more, as a task. A stable amount then clears `pending` and stops, as the healthy row above already does in one round.
- Transient and offline: unchanged. Kept ids wait for the online listener, a save, the bell, or boot. No new timer for them. The 20s notice stays a notice.

`flushRemote` remains the only start. The timer calls `flushRemote`. The clock stays in `firebase-client.js`. `sync.js` does not gain a timer. No new exported function.

## 5. Files, types, and functions

`FlushCall`, `flushOutbox`'s result (`synced`, `kept`, `failed`, `adopted`, `authDead`), and `syncErrors` stay the types in `types/checkjs.d.ts`. No new field. No new store. The outbox remains a list of ids (`public/session.js` writes `{id, queuedAt}` and reads the ids back).

| File                                     | Change                                                                                                                                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/sync.js` `flushOutbox`           | Before `synced.push` on `isSeed`, if that id's finance or terms row has `pending`, `failed.push({ id, message: Status.REJECTED })` and `continue`. A seed with no pending row stays `synced`, as today. |
| `public/firebase-client.js` `writeLocal` | On the `if (!saved.finance) return` path, clear `pending` only when `contractAmount` is not an integer. Then return.                                                                                    |
| `public/firebase-client.js` tail         | Replace `return flushRemote()` with one armed 0ms timer that calls `flushRemote`. Do not arm it for an id that this flush put in `failed` or `kept`.                                                    |
| `public/sw.js`                           | Bump `const VERSION`. Required because `public/` changes.                                                                                                                                               |
| `tests/flush-retry.test.js`              | Behaviour listed below that does not need the emulator. Add the file to the ledger job's `node --test` list in `.github/workflows/ci.yml` and to `package.json` `"test"`.                               |
| `tests/emulator/flush-retry.test.js`     | The rules denial, the committed bare-pending write count, and the restore. Add the file to the emulator job's explicit list and to `package.json` `"test:emulator"`.                                    |
| `docs/PSTACK_INVENTORY.md`               | No row in this plan. The code pull request can add a section then. `setup-pstack` stays «ناقصة».                                                                                                        |

`queuePendingFinance` and `queuePendingSubcontracts` keep their predicate. `applyFlush` stays the only writer of the outbox filter. `public/render.js` stays, unless Ameer chooses a new sentence in the questions below. `shownContract` (`public/render.js:154-157`) still returns the integer and does not read `syncErrors`. This sketch does not change that.

```javascript
// public/sync.js, inside flushOutbox, where isSeed is handled today
if (isSeed(local)) {
  if (moneyPending(local)) failed.push({ id, message: Status.REJECTED });
  else synced.push(id);
  continue;
}

// public/firebase-client.js
function armFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => { flushTimer = null; flushRemote(); }, 0);
}
```

`moneyPending` reads `K.finance[id].pending` or `K.terms[id].pending`. It is local to `flushOutbox`'s caller-supplied load, or a predicate passed beside `load`. It is not a new module. One of those two shapes is enough; do not add both a flag on the doc and a side channel.

## 6. No data loss

Nothing in this sketch deletes an outbox id that is still unsent and not terminally failed, and nothing deletes a row body or an integer amount. `applyFlush` already removes a failed id from the id list. The entry, the project, the subcontract, and the amount stay in their stores. That is what the emulator rows above kept.

There is no migration of existing records. Devices already store `outbox`, `projectFinance`, `subcontractTerms`, and `syncErrors` in `aj-u-<uid>`. The new behaviour is decided at flush time from those values. A phone that is offline through the upgrade keeps the same ids and the same amounts. The first online flush classifies them. It does not rewrite the database on boot.

Proof, on the emulator, before any deploy. Build a snapshot with two outbox ids, one finance integer with `pending: true`, one existing `syncErrors` entry, and one ledger row. Run one flush. Assert the ledger row, the project row, the integer, and the other owner's snapshot are deep-equal to the snapshot. Assert a rules-denied id left the outbox, gained the existing refusal string, and did not lose its amount. Restore that snapshot a second time and assert the same result. The restore is the test, not a production import.

## 7. Two or more owners

The outbox is per device database, `aj-u-<uid>` (`public/session.js`). Two owners are two caches. The timer lives on the page that is signed in. There is no shared flush document. `isOwner()` in `firestore.rules` is any active owner, so the rules denial measured above is the same rule for both. The fix must not key a lock on one uid, and it must not write a document the other phone reads in order to flush.

The measured check: owner B's cache was deep-equal after owner A's denial. The code pull request repeats that with two signed-in owners, each with his own cache, and asserts the one who did not flush is unchanged.

## 8. Tests

Behaviour the code pull request has to show. Not a count of internal calls as the assertion, except the write count, which is the quota behaviour.

1. A seed project with a pending integer, online, with a session user: the flush settles, the project and the integer are still there, the error is `رُفض الإرسال`, and a further wait does not issue a project `setDoc`.
2. A rules-denied project write and a rules-denied subcontract write: one `setDoc` attempt each, then stop. The amount is still there.
3. A terms amount the payload rejects: the subcontract row is still there, and the flush does not run a second round.
4. A missing `writeLocal` on a non-seed entry: the entry is still there, one round, the existing refusal string.
5. `unavailable`: the id is still in the outbox after the flush returns, and no second flush starts by itself.
6. Offline: no `setDoc`.
7. A valid owner contract: one project write, one finance write, the integer remains, `pending` is gone, no second round.
8. `{pending:true}` with no integer: the project row remains, and project `setDoc` happens once, not again.
9. An amount that changes during the write: one later flush sends the new integer, then stops. The first integer is not deleted before the second write.
10. Two owners: after one denial, the other owner's outbox, finance, and rows are deep-equal.
11. The restore in section 6, twice, on the emulator.

All four jobs stay: `lint, format, types`, `ledger tests`, `browser checks`, `emulator rules and sync`. The new node file goes on the ledger job's explicit list. The new emulator file goes on the emulator job's explicit list. The pass floors (34 and 45) are not lowered. `tests/browser-check.js` is not edited, so its 226 checks stay, and the 30s CDP deadline stays. No `it.skip`, no retry of a failed check, no second attempt hidden in the test.

## 9. Questions for Ameer

No new sentence is in this sketch. The strings already on the screen are `رُفض الإرسال`, `لم يُرسل`, `القيد موجود على الخادم بمحتوى مختلف`, and `القيد موجود مسبقاً وتعذر مطابقة محتواه`. The bell already speaks the first error (`public/render.js` `failedMessages`). The subcontract card already prints `syncErrors[id]` (`:751`). The contract figure still shows the integer when an error is set, because `shownContract` does not read `syncErrors`.

1. For a refused contract amount, is the bell's existing `رُفض الإرسال` enough, with the typed number still shown as `قيمة العقد`?
2. For a refused subcontract, is the string the card already prints enough?
3. If the answer to either is no, what sentence should the owner see? Nothing below is approved copy. Candidates, only if he wants a new sentence: `تعذر إرسال قيمة العقد` and `تعذر إرسال مبلغ العقد`.
4. A demo phone that leaves `?role=` with the example school contract still pending will show that existing refusal and stop, instead of flushing in a loop. Is that acceptable for the example project?

## 10. Accounting

Not a new rule. Counted entries already skip `syncErrors` (`public/render.js` `counts`). This sketch does not change profit, an advance, or an export. The advisor is not quoted because no opinion was requested. Question 1 is a display question. If Ameer wants the refused contract out of the profit figure, that is a later plan, and that plan asks محاسب أهل الجزيرة.
