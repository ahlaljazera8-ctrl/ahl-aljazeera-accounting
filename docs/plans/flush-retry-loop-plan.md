# Plan: the hot flush loop (r3)

The code for the plan at `7c7fb287` is in this pull request, together with this text. Not an approval. EA 21:52, delegated, is the go for that code. `main` is still `aj-p0-v63`, so this pull request sets `aj-p0-v64`. Ameer approves the merge and any behaviour change.

- **Repo.** `ahl-aljazeera-accounting`, read at `main` = `d40535a68714dafff60a8fed0481eb37ce751874`.
- **Gates.** Ameer approves every merge and every behaviour or rules change. All 4 CI checks stay, with no skips and no retries. No spending. `arena` is banned, so the shapes below were written by hand, not spawned.
- **محاسب أهل الجزيرة was not asked.** This sketch does not change which amounts count, an advance, a ledger rule, an export, or `firestore.rules`. Section 9 records the display answers, EA 21:02, delegated. Section 11 records the behaviour answers, EA 21:20, 21:36, and 21:52, delegated. Any change to the profit figure asks the advisor before it is treated as a house rule.

## 0. What the next agent is building

A bound on the immediate `flushRemote()` tail in `public/firebase-client.js`, and one refusal for a pending finance or terms id this round tried to send and did not. The outbox list, the row bodies, the stored amounts, and the `pending` flag stay. No new on-screen sentence. No new IndexedDB field. No edit to a stored flag. No Firestore lock document. No backoff.

r1 named two endless paths and three changes: refuse a seed, clear a bare `pending` flag, and a 0ms timer. Those three do not stop a third path. Architect's model, which is not the app and not the emulator, still did a project write on every round of that path (445 writes in 1,023ms; the review summary is 449 rounds/s). The 0ms timer only stops the page freezing. It does not cap the rate. r2 adds the cap and the general refusal. The timer stays as defence in depth.

The service-worker `VERSION` in `public/sw.js` was `aj-p0-v63` on `main` when this code was written. No other file in the repo used `aj-p0-v64`. This pull request sets `const VERSION` to `aj-p0-v64`.

Deploy that code pull request only when nobody is entering data, and only after the emulator restore in section 6 has passed.

Not in the code pull request: a longer CDP deadline, a poll, a backoff, a retry of the browser job, a skip, a second flush entry point, a change to `firestore.rules`, a write to the production project `ahl-aljazeera-accounting`.

## 1. What the code does

`flushRemote` (`public/firebase-client.js:522`) returns immediately when `demoRole()` is set or there is no session user (`:524`). Otherwise it starts `performFlush` (`:618`). `flushing` makes a second call on the same page wait for the run already going (`:525-526`).

`performFlush` returns before `ensureFirebase` when `navigator.onLine === false` (`:623`). Online, it calls `ensureFirebase` (`:624`), then `Sync.flushOutbox` with `write: local => fb.writeLocal(local)` (`:664-667`). `applyFlush` (`public/sync-status.js:169`) drops synced ids and failed ids from the outbox. A failed id gets `syncErrors[id]`. A synced id has its error deleted.

`writeLocal` (`public/firebase-client.js:246`) writes the project, then `projectFinance`, and clears `pending` only after that finance write when the amount still matches (`:274-283`). `if (!saved.finance) return` (`:274`) leaves `pending` as it was. `splitProjectSave` (`public/sync.js:112-116`) returns `finance: null` when the chosen amount is not an integer, is below 0, or is above `MAX_AMOUNT_IQD`. The chosen amount is the finance row's integer when there is one, and otherwise `contractAmountOf` on the project, which is how a legacy amount on the project row is still sent. A subcontract write throws `مبلغ العقد غير صالح` when `termsPayload` returns null (`firebase-client.js:252`), after the name `putIfMissing`.

`flushOutbox` (`public/sync.js:594`) marks `isSeed` synced and does not call `write` (`:610`). `isSeed` is `isExample === true`, `deviceId === 'seed'`, or an id starting with `seed-` (`:10-12`). A thrown write is `kept` when `SyncStatus` is missing or `isTransient` (`:620`). Transient codes are `unavailable`, `deadline-exceeded`, `resource-exhausted`, `aborted`, `cancelled`, plus a timeout or a message matching offline / network-request-failed (`public/sync-status.js:96-107`). `permission-denied` is not in that list, so it is `failed`.

The tail (`public/firebase-client.js:752-761`) runs when `keptIds` is an array, the session still matches, the browser is online, and a session user is set. It calls `queuePendingFinance` (`:563`) and `queuePendingSubcontracts` (`:575`). Each one appends an id whose finance or terms row has `pending`, which has no `syncErrors[id]`, and which is not already in the outbox. If any outbox id was not in `keptIds`, the tail `return flushRemote()` with no timer.

A pull that throws is caught by the inner catch (`:732-742`). That catch does not set `keptIds` to null. The outer catch (`:743-747`) is what nulls `keptIds` and skips the tail. A mock with no `pull` still reaches the tail. The pull does not overwrite a finance row that is still `pending` (`:336-343`).

`queuePendingFinance` will not re-add an id that has a sticky error. The loop needs an id that was dropped and then put back with `pending` still true and no error. Three paths do that:

1. **(a) Seed.** A seed document is marked synced. `applyFlush` clears any error. `pending` is untouched because `write` never ran. The tail puts the id back and calls `flushRemote` again.
2. **(b) No integer.** A non-seed project write succeeds, `splitProjectSave` returns no finance, `pending` stays, the id is synced, and the tail puts it back. `saveContract` does not create this row.
3. **(c) Integer out of range.** The finance row has `pending: true` and an integer `contractAmount` below 0 or above `MAX_AMOUNT_IQD`. `splitProjectSave` returns no finance (`sync.js:115`). `writeLocal` has already committed the project `setDoc` (`firebase-client.js:268`) and then returns at `:274`, so `pending` stays. The id is synced. The tail puts it back. r1's bare-flag clear does not apply, because there is an integer. r1's seed refusal does not apply, because the project is not a seed. The 0ms timer still arms.

`saveContract` (`public/render.js:185-204`) stores an integer with `pending: true`. `parseAmount` (`public/ledger.js:133-149`) rejects a typed amount below 1, except 0 when `allowZero` is set, and rejects an amount above `MAX_AMOUNT_IQD`. The demo projects `p-school`, `p-road`, and `p-market` are seeds (`public/app.js:38-39`). The demo subcontract rows are not: they have no `isExample`, no `deviceId: 'seed'`, and the id does not start with `seed-`. Real ids come from `uuid()` and real device ids are random, so `isSeed` does not match a normal phone.

The 20s timer (`FLUSH_MS`, `:537-542`) sets the notice `تعذر الإرسال. أعد المحاولة`. It does not call `flushRemote`. The callers that start a flush today are a save (`public/render.js:92`, `:203`, `:336`, `:1059`, `:1382`), the bell (`:1243`), the online listener (`:1486`), boot (`public/app.js:176`), `public/session.js:417`, and `public/foremen.js:360`. There is no visibility listener that calls `flushRemote`. This plan does not add one.

### Open question: can path (c) occur on a phone

`saveContract` cannot store path (c), because `parseAmount` rejects it. Whether a phone already holds such a row is open. It could be legacy or migrated data, a constructed row, or a later change to `MAX_AMOUNT_IQD`. This plan covers the path anyway. It does not claim the current screens create it.

## 2. Measured on the emulator

Measured at `2026-11-16T17:47:12.531Z`. Firestore `127.0.0.1:8080`, Auth `127.0.0.1:9099`, emulator jar `cloud-firestore-emulator-v1.22.0`, client SDK `13.1.0`, Node `v26.13.0`. The project id string was `ahl-aljazeera-accounting` because that is the emulator's project id. Both hosts were loopback. The harness refuses any other host. No production Firebase call was made.

The harness called the real `Sync.flushOutbox`, the real `SyncStatus.applyFlush`, and the real `queuePendingFinance` / `queuePendingSubcontracts` source cut from `public/firebase-client.js`. The write followed `writeLocal`'s calls (`setDoc` of `withServerTime`, then `projectFinance` for an owner). The pull arm called `Sync.pullChanges`, `financeReads`, `pullSubcontracts`, `pullForemen`, one `getDoc` per local project that has `createdAtServer`, and the `users/{uid}` `getDoc` that `refreshProfile` does. It did not call `idToken(true)`, `paintShell`, or `render`. A loop that would not stop was cut by the harness (5,000 rounds or 1.5s). The app has no such cut. Path (c) was not in this run.

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

### Architect's model of path (c)

Not the emulator and not the app. It calls the real `Sync.flushOutbox`, `SyncStatus.applyFlush`, `Sync.splitProjectSave`, and `Ledger`, and it copies the queue predicate and the tail. The attached output, for an integer `MAX_AMOUNT_IQD + 1` with `pending: true`:

- Today: 899 rounds and 899 project writes in 1,021ms.
- With r1's three changes (seed refusal, bare-flag clear, 0ms timer): 445 rounds and 445 project writes in 1,023ms. The review summary of that row is 449 rounds/s, a write each round.
- With those three plus a cap of one re-arm per trigger: 2 rounds and 2 writes.
- A valid contract of 123,456, with the same cap: 1 round and 2 writes (project and finance).

### What that says about each failure

- **Rules rejection (`permission-denied`).** The id is dropped, `syncErrors[id]` is set, `queuePending*` does not put it back, `flushRemote` is not called again. Measured for a finance-shaped project write and for a subcontract write. This is not a hot loop. The local amount stays, with `pending` still true, which is why a sticky error is what stops the re-queue.
- **Validation error (`مبلغ العقد غير صالح`).** One round, then stop. Measured when the name was already stored: 0 writes. The source writes the name first (`:249-252`) and throws after that, so a missing name is one create and then the same terminal error. That missing-name order was not given its own emulator run.
- **Missing `writeLocal`.** One round on a non-seed id, then stop. The TypeError is not what repeats. The repeating id in the browser hang is the seed. Architect, on the rejected-save page, counted 3,186 `flushOutbox` rounds in about 3s, round 1 on the other ids and every later round on `p-school` only. `p-school` is `isExample` and `deviceId: 'seed'`, and the earlier contract save in that same page leaves `pending: true`. `isSeed` never calls `write`. That is the microtask arm above (90,909 rounds/s with a thrown `pull`, 0 Firestore calls).
- **Offline.** No write. `performFlush` returns at `:623`. The tail also requires online.
- **`unavailable`.** The id is kept, not dropped, so the tail does not see a fresh id. No immediate second call. No backoff timer exists today, and this plan does not add one.
- **Path (c).** A write every round, including after r1's three changes. The cap of one re-arm brings the model to 2 rounds. The refusal in section 4 is what should make the second write unnecessary: the first project `setDoc` still happens, then the unsent amount is `failed`, and the tail does not arm.

The hot retry is real in the production functions. It is not "any rules rejection". It is the tail plus a dropped id whose `pending` flag survived. On a real client the seed arm does 0 writes and one pull per round. On the incomplete test mock the pull throws, the inner catch swallows it, and the tail runs as microtasks.

`idToken(true)` (`:631`) was not in the harness. It is an Auth call, not a Firestore write. It would slow a real round. It is not part of the rates below.

## 3. Quota

Cited limits, Spark plan, and the no-cost portion of Blaze. [Firebase pricing](https://firebase.google.com/pricing), Cloud Firestore Standard edition: 50,000 document reads/day, 20,000 document writes/day, 20,000 document deletes/day, 1 GiB stored, 10 GiB/month egress. The same daily read and write numbers are the free quota in [Usage and limits](https://firebase.google.com/docs/firestore/quotas). Quotas reset around midnight Pacific. One free database per project.

[Understand Cloud Firestore billing](https://firebase.google.com/docs/firestore/pricing), last updated 2026-11-12 UTC: there is a minimum charge of one document read for each query, even when it returns nothing. A `set` counts as one write. Requests denied by security rules do not count toward network bandwidth. That page does not say a denied write is free of the write charge.

**Measured.** Seed plus a real pull: 0 `setDoc` per round, 6 `getDocs` and 3 `getDoc` per round, 9.83 rounds/s, 88.47 read SDK calls/s, on an empty database, without `idToken` and without `render`. The bare-pending arm, without pull: 165.75 committed project writes/s until the harness stopped it at 30. A rules denial: 1 `setDoc` attempt, then stop.

**Inferred, not measured.** Each of the 6 queries is at least 1 billed read by the minimum-charge sentence. The `users/{uid}` get reads a document that exists: 1 read. The other two gets were of missing documents; counting each as 1 read is inferred, not a sentence on the page above. That is 9 billed reads per round. At the measured 9.83 rounds/s, about 88.5 billed reads/s. `50000 / 88.47 ≈ 565` seconds of this empty-database loop would pass the free daily read cap. The seed arm's writes stay 0, so it does not consume the 20,000 write cap.

The bare-pending loop does commit writes. `performFlush` also pulls, and the pull arm took 1,526ms for 15 rounds, so a round that does both cannot be faster than that pull. Inferred combined pace: about 9.8 committed writes/s and about 88 reads/s. The read cap arrives first (`≈ 565s`). The write cap at that pace is `20000 / 9.83 ≈ 2035s`. A production phone with rows in the collections bills one read per returned document, which is more than this empty run. `idToken(true)` would add time and is not in the 565s figure.

A pull that throws is caught at `:732-742` and the tail still runs. Inferred, that puts a writing loop near the measured no-pull ceiling of 165.75 project writes/s. `20000 / 165.75 ≈ 121` seconds to the 20,000 write cap. That 121s figure is inferred from the bare-pending emulator arm. It was not a separate path-(c) emulator run. Architect's model of path (c) with r1's three changes was faster than that ceiling (445 writes in 1,023ms) because the model does not wait on Firestore.

A single denied `setDoc` is one attempt. It is not the quota risk. Whether that one denial is billed as a write is not stated on the pricing page, beyond bandwidth.

## 4. The fix

Screened against the architect red flags. The next reader sees one file and copies the nearest call. r1 had two tail sentences that do not agree. "Arm only for an id this flush did not already attempt" drops the in-flight contract, which was attempted, synced, and then re-queued because the amount changed. "Arm unless the id was `failed` or `kept`" re-arms path (c) forever, because that id was `synced`. Both sentences are withdrawn.

**One tail rule.** EA 21:36, delegated. The cap is still one extra round per trigger. The counter resets only on these named events, and on no others: a user save, the online event, a bell tap, and app open or session entry. A call that arrives during a flush still only joins the run already going (`:525`), and it resets the count only when it is one of these events:

- A user save: `queueDoc` (`public/render.js:92`), which the subcontract save (`:114`), the amendment save (`:145`), `public/accounts-view.js:134`, and `public/foremen.js:404`, `:441`, and `:467` use; `saveContract` (`public/render.js:203`); `commit` (`public/render.js:336`); `finishConfirm` (`public/render.js:1059`); and the new-project save (`public/render.js:1382`).
- The online event: `addEventListener('online')` (`public/render.js:1485`).
- The bell: the `#bell-send` click (`public/render.js:1243`).
- App open: the login path (`public/app.js:176`) and `enterSession` (`public/session.js:417`).

`public/foremen.js:360` is not in that list. EA 21:52, delegated. The foremen refresh still calls `flushRemote()` with no argument, so it still starts a flush, and it does not reset the count.

The counter never resets on the flush's own writes or acks, on the 0ms timer, or on anything that arrives through the pull or a snapshot. A change from another device does not reset the count, or two devices could chain each other. The loop cannot restart itself. Within that same cap of one, the tail may arm one `setTimeout(flushRemote, 0)` when any of these is true: an outbox id was not in this round's `ids`; `statusPending` gained an id this round (`freshStatus`, the check already at `:752-760`); or an id this round did try to send, and its pending amount now differs from the amount this round sent. It does not arm for an id this flush marked `failed` or `kept`. The timer does not count as a new trigger. No backoff. A backoff would be a poll.

Only those outside callers pass an argument, `flushRemote({ fromOutside: true })`. The timer's module-local starter, `writeLocal`, `applyFlush`, and any ack or snapshot callback do not pass it. The argument is not stored. There is no new exported function and no new stored field. When the timer fires it checks `sessionEpoch` and does nothing if the session changed. `disposeFirebase` (`:505`) and a session change clear both the count and the timer.

**One refusal, no stored-flag edit.** Only an id in this round's `ids` snapshot. If that id is a seed, or its write returned without sending `projectFinance` or `subcontractTerms`, it is `failed` with `SyncStatus.REJECTED` (`رُفض الإرسال`). A row whose `pending` was set after the snapshot was not attempted, so it is not refused: a contract typed during the flush must not gain a sticky error. The integer stays. `pending` is not cleared and not deleted. This is decided after `writeLocal` returns and before `queuePendingFinance` runs, so the error is already set when the tail looks. It covers:

- (a) a seed in this round's `ids`, because `write` never runs and the pending amount was not sent;
- (b) a `pending` row with no integer, because `splitProjectSave` returns no finance;
- (c) an integer below 0 or above `MAX_AMOUNT_IQD`, because `splitProjectSave` returns no finance after the project `setDoc`;
- (d) a non-owner, because `writeLocal` returns at `:270` (`!Ledger.can(user, 'owner')`) before any finance write.

A legacy amount on the project row is not this case. `splitProjectSave` uses `contractAmountOf` when the finance row has no integer, sends that amount, and the existing success path clears `pending` only after that send. The code pull request must not refuse that row and must not clear it before the send.

The amount this round sent comes from a local map for that round only, filled by the `write` wrapper inside `performFlush`. It is not a stored field.

The in-flight contract is not a refusal. `writeLocal` sends the amount it had and leaves `pending` when a newer amount arrived during the write (`:278-283`). The pending amount differs from the amount in that map, so the one allowed re-arm sends the newer amount. A stable amount then clears `pending` and stops, as the valid-contract row already does in one round.

The NOTES on `172f6f55` include a model, not the app and not the emulator. Under this wider rule, paths (a), (b), and (c) stay one round with the amount and `pending` kept, and an amount that changes on every round without a new save still stops at two rounds. Those are the same results as the narrower r2 rule. The wider rule is what also sends an entry saved during the pull, and a contract re-saved during the re-flush.

The 0ms timer is only so a mistaken re-arm yields a task, and the page can paint. It is not the rate cap. The cap is. The refusal is what stops (a), (b), and (c) from being re-queued at all.

`flushRemote` remains the only start for a caller. The 0ms timer uses the module-local internal starter, and that starter does not pass `{ fromOutside: true }`. The clock stays in `firebase-client.js`. `sync.js` does not gain a timer. The refusal can live next to `applyFlush` in `firebase-client.js`, using the flush result and the finance and terms maps. It is not a new module. No new exported function.

Shapes that were not chosen: r1's clear of a bare flag, because it rewrites stored data and leaves path (c) writing every round (445 writes in 1,023ms in the model). A timer with no cap, because the same model still writes every round. A backoff, because that is a poll.

## 5. Files, types, and functions

`FlushCall`, `flushOutbox`'s result (`synced`, `kept`, `failed`, `adopted`, `authDead`), and `syncErrors` stay the types in `types/checkjs.d.ts`. No new field. No new store. The outbox remains a list of ids (`public/session.js` writes `{id, queuedAt}` and reads the ids back).

| File                                 | Change                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/firebase-client.js`          | After `applyFlush`, refuse only an id in this round's `ids` that was not sent, including the non-owner return at `:270`. The amount just sent is a per-round local map. The tail is the one rule in section 4. Only the outside events listed there pass `{ fromOutside: true }`. Clear the count and the timer on session change. |
| `public/sw.js`                       | `aj-p0-v64`, as section 0 says. Required because `public/` changes.                                                                                                                                                                                                                                                                |
| `tests/flush-retry.test.js`          | The behaviour in section 8 that does not need the emulator, with fake timers. Add the file to the ledger job's `node --test` list in `.github/workflows/ci.yml` and to `package.json` `"test"`.                                                                                                                                    |
| `tests/emulator/flush-retry.test.js` | The rules denial, the one project write then stop for path (c), and the restore. Add the file to the emulator job's explicit list and to `package.json` `"test:emulator"`.                                                                                                                                                         |
| `docs/PSTACK_INVENTORY.md`           | No row in this plan. The code pull request can add a section then. `setup-pstack` stays «ناقصة».                                                                                                                                                                                                                                   |

`queuePendingFinance` and `queuePendingSubcontracts` keep their predicate. `applyFlush` stays the writer of the outbox filter; the refusal adds the error before the tail, by the same `failed` shape `applyFlush` already understands. The named callers in section 4 pass `{ fromOutside: true }`. `public/foremen.js:360` does not. EA 21:52, delegated. It still starts a flush and it does not reset the count. `public/render.js` gains no new sentence. EA 21:02, delegated. `shownContract` (`public/render.js:154-157`) still returns the integer and does not read `syncErrors`. This sketch does not change that.

There is no second statement of the tail rule in this section.

## 6. No data loss

Nothing in this sketch deletes an outbox id that is still unsent and not terminally failed, and nothing deletes a row body, an integer amount, or a `pending` flag. `applyFlush` already removes a failed id from the id list. The entry, the project, the subcontract, and the amount stay in their stores. That is what the emulator rows above kept. r1's clear of a bare `pending` flag is withdrawn.

There is no migration of existing records. Devices already store `outbox`, `projectFinance`, `subcontractTerms`, and `syncErrors` in `aj-u-<uid>`. The new behaviour is decided at flush time from those values. A phone that is offline through the upgrade keeps the same ids and the same amounts. The first online flush classifies them. It does not rewrite the database on boot.

Proof, on the emulator, before any deploy. Build a snapshot with two outbox ids, one finance integer with `pending: true`, one integer above `MAX_AMOUNT_IQD` with `pending: true`, one existing `syncErrors` entry, and one ledger row. Run one flush. Assert the ledger row, the project row, both integers, both `pending` flags, and the other owner's snapshot are deep-equal to the snapshot. Assert a rules-denied id and the out-of-range id left the outbox, gained the existing refusal string, and did not lose their amounts. Restore that snapshot a second time and assert the same result. The restore is the test, not a production import. Deploy only after that, and only when nobody is entering data.

## 7. Two or more owners, and two tabs

The outbox is per device database, `aj-u-<uid>` (`public/session.js`). Two owners are two caches. The timer and the re-arm count live on the page that is signed in. There is no shared flush document. `isOwner()` in `firestore.rules` is any active owner, so the rules denial measured above is the same rule for both. The fix must not key a lock on one uid, and it must not write a document the other phone reads in order to flush.

The measured check: owner B's cache was deep-equal after owner A's denial. The code pull request repeats that with two signed-in owners, each with his own cache, and asserts the one who did not flush is unchanged.

Two tabs of the same user share IndexedDB and do not share memory. `get` and `set` in `public/session.js` read and write that tab's `cache`. `set` writes the whole `syncErrors` map, so one tab's memory can overwrite the other's. That overwrite already happens today. One tab can record the refusal while the other tab's memory still has no error and would re-queue. Each tab also has its own `flushing` flag and its own re-arm count, so a loop on one tab does not stop the other. The cap in section 4 applies per tab, so path (c) costs at most one project write per real trigger per tab. The code pull request's test uses one shared store and two memories, runs path (c) on both, and asserts each tab stops inside the cap and the shared integer is still there.

## 8. Tests

Behaviour the code pull request has to show. Drain fake timers. Do not wait on the wall clock. The write count is the quota behaviour. "A further wait" is not an assertion.

These fail on `d40535a6`, where the cap and the refusal are absent. Run them there and expect them red. After the fix, the same tests are green:

1. A seed project with a pending integer, online, with a session user: after the fake timers drain, at most 2 rounds, no project `setDoc`, the project and the integer still there, `pending` still set, the error `رُفض الإرسال`.
2. Path (c), an integer above `MAX_AMOUNT_IQD` with `pending`: one project `setDoc`, then stop. The integer and `pending` stay. The error is `رُفض الإرسال`. A second project write after the drain fails the test.
3. `{pending:true}` with no integer: one project `setDoc`, then stop. The project row stays. `pending` is not deleted.
4. An id whose pending amount changes on every round, with no new save: at most 2 rounds, at most 2 project writes, and at most 2 finance writes. This is the cap's own test.

These stay green on the fix, and the mutations below must turn the matching ones red:

5. A rules-denied project write and a rules-denied subcontract write: one `setDoc` attempt each, then stop. The amount is still there.
6. A terms amount the payload rejects: the subcontract row is still there, and draining timers does not start a second round.
7. A missing `writeLocal` on a non-seed entry: the entry is still there, one round, the existing refusal string.
8. `unavailable`: the id is still in the outbox after the flush returns, and draining timers does not start a second flush.
9. Offline: no `setDoc`.
10. A valid owner contract: one round, one project write, one finance write, the integer remains, `pending` is gone.
11. A legacy `contractAmount` on the project row, with a finance row that is `pending` and has no integer: that legacy amount is sent. It is not refused, and it is not cleared before the send.
12. An amount that changes during the one write, with no further save: the single re-arm sends the new integer, then stops. At most 2 rounds, at most 2 project writes, and at most 2 finance writes. The first integer is not deleted before the second write. A third round fails the test only in that case, where the amount changes without a save. A save during the re-flush is a user save: it resets the count, and the new amount is sent.
13. Two owners: after one denial, the other owner's outbox, finance, and rows are deep-equal.
14. Two tabs, one user: shared store, separate memory, path (c) on both. Each tab stays inside the cap. The shared integer remains. The whole-map overwrite of `syncErrors` is the one that already exists today.
15. The restore in section 6, twice, on the emulator.
16. An entry saved during the pull is sent after the timers drain.
17. A contract re-saved during the re-flush is sent.
18. A contract saved on a second project during the flush is not refused and is sent.
19. A non-owner return at `writeLocal` `:270`, with a pending finance row on that id: the row is refused, the amount stays, and `pending` is not cleared.

**20a.** An amount that changes every round with no user save: at most 2 rounds, 2 project writes, and 2 finance writes. This fails on `d40535a6`.

**20b.** A write that keeps failing with no user save: at most 2 rounds and 2 writes. This also passes on `d40535a6`. It is a regression guard. The fails-on-base proof is the seed, the bare pending row, and the out-of-range integer (tests 1, 2, and 3), plus 20a. The flush's own acks, and anything that arrives through the pull or a snapshot, do not reset the count.

Mutations, each of which must make a green test red: remove the one-re-arm cap (test 4 exceeds 2 rounds); drop only the unsent-pending refusal (tests 1, 2, and 3 no longer stop); remove only the cap, with the refusal left in place (test 4 still exceeds 2 rounds); restore `return flushRemote()` and drop the refusal together (tests 1, 2, and 3 no longer stop); refuse a legacy project-level amount (test 11 goes red). The refusal-only mutation and the cap-only mutation are run on their own, not only as a pair.

Carried from #85, and not part of this fix: the browser-check source guard matches single-quoted `send('Page...')` only, and the timeout diagnostic covers only the wait after navigation.

All four jobs stay: `lint, format, types`, `ledger tests`, `browser checks`, `emulator rules and sync`. The new node file goes on the ledger job's explicit list. The new emulator file goes on the emulator job's explicit list. The pass floors (34 and 45) are not lowered. `tests/browser-check.js` is not edited, so its 226 checks stay, and the 30s CDP deadline stays. No `it.skip`, no retry of a failed check, no second attempt hidden in the test.

## 9. Questions for Ameer

Answered by EA 21:02, delegated. These are plan decisions only. The strings already on the screen stay: `رُفض الإرسال`, `لم يُرسل`, `القيد موجود على الخادم بمحتوى مختلف`, and `القيد موجود مسبقاً وتعذر مطابقة محتواه`. The bell already speaks the first error (`public/render.js` `failedMessages`). The subcontract card already prints `syncErrors[id]` (`:751`). The contract figure still shows the integer when an error is set, because `shownContract` does not read `syncErrors`.

1. Yes. EA 21:02, delegated. The existing bell message `رُفض الإرسال` is enough, and the typed number stays shown under `قيمة العقد`.
2. Yes. EA 21:02, delegated. The message the card shows now is enough for a rejected subcontract.
3. Moot. EA 21:02, delegated. No new sentence. The candidate strings `تعذر إرسال قيمة العقد` and `تعذر إرسال مبلغ العقد` are rejected. Do not add them.
4. Yes. EA 21:02, delegated. On the demo device, a pending contract amount in the sample project shows the existing rejection message and stops instead of retrying. That is acceptable.

Question 4 is a behaviour change, not only a display answer. The sample project stops retrying, and the bell keeps a permanent refusal. Section 11 records EA's answers for that behaviour and for the re-flush cap.

## 10. Accounting

Not a new rule. Counted entries already skip `syncErrors` (`public/render.js` `counts`). This sketch does not change profit, an advance, or an export. The advisor is not quoted because no opinion was requested. The refused contract still shows under `قيمة العقد` (section 9, EA 21:02, delegated) and `shownContract` still feeds that number to the profit display. Any change to that profit figure goes to محاسب أهل الجزيرة. This plan does not make that change.

## 11. Decisions for Ameer via EA

Answered by EA 21:20, delegated, under Ameer's 00:19 delegation. No new strings.

### Refuse, or clear the stored flag

Yes. EA 21:20, delegated. Refuse, never clear. Record the existing «رُفض الإرسال». The number stays on the phone. Nothing is deleted or cleared (Ameer's condition: never delete his real data). Clearing the flag does not fix path (c): an out-of-range amount is still a whole number, so a clear that only removes a flag with no integer leaves that row pending, and the project write repeats.

### Are example projects terminal

Yes. EA 21:20, delegated. Demo or sample projects with a pending amount become terminal. The amount stays, the existing refusal shows in the bell, and sending stops. This applies to demo projects only; real projects keep their data.

### How many re-flushes per trigger

Yes. EA 21:20, delegated. One extra re-flush per trigger, only when the pending amount differs from what was sent. At most two rounds, no backoff. In the Architect's model, not an emulator run, about 449 writes a second drops to 2 rounds, and a normal contract stays at 1 round.

Yes. EA 21:36, delegated. The widened cap is confirmed, with this condition. The counter resets only on these named events: a user save, the online event, a bell tap, and app open or session entry, at the call sites in section 4. The counter never resets on the flush's own writes or acks, on the 0ms timer, or on anything that arrives through the pull or a snapshot. A change from another device does not reset the count. The loop cannot restart itself. Still at most one extra round per trigger. The same cap also re-arms for an outbox id that was not in this round and for a new status change.

`public/foremen.js:360`, the foremen refresh, is not one of those reset events. EA 21:52, delegated. It still calls `flushRemote()` and starts a flush. It does not reset the count.

### Profit

Any change to the profit figure goes to محاسب أهل الجزيرة. This plan does not change it.

### For the reviewer

The Architect must confirm in review that profits, advances and exports are unchanged.
