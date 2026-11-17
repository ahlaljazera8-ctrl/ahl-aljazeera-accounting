# Plan: the refused-entry click in login-relogin

Plan only. No application code in this change. The code pull request waits until AgentLab Architect and EA have reviewed this plan. Ameer approves the merge.

- **Repo.** `ahl-aljazeera-accounting`, read at `main` = `d7dc8e9b437a3bb8fc20c0bebe784d2c01f3b5c6`.
- **Gates.** Ameer approves every merge and every behaviour or rules change. All 4 CI checks stay. No spending. `arena` is banned, so the two shapes below were written by hand.
- **محاسب أهل الجزيرة was not asked.** This plan does not change a balance, an advance, a ledger rule, an export, or `firestore.rules`.

## 0. What the next agent is building

One wait in `tests/emulator/login-relogin.test.js`, then the refused save runs in the same page evaluation as the hash change. `session.ev` reports the page exception instead of the generic CDP word `Uncaught`.

Nothing under `public/` changes, so `const VERSION` in `public/sw.js` stays. No retry, no skip, no extra sleep, and no larger timeout.

## 1. Root cause

The page exception is `TypeError: Cannot read properties of null (reading 'click')`. CDP puts that sentence on `exceptionDetails.exception.description` and puts the word `Uncaught` on `exceptionDetails.text`. `session.ev` throws `details.text` first (`tests/emulator/login-relogin.test.js:90`), and `Uncaught` is truthy, so the description is never read. Both CI failures therefore print `Error: Uncaught`.

The null is the project pill `[data-proj="p-relogin"]`. It is not `#amt` and it is not `#save`. After the throw, the new-entry screen is up (`#title` is `قيد جديد`, `#amt` and `#save` exist, `#render-error` is empty) and `AJ.get('projects')` is `[]`. `AJ.get('goneProjectNames')` is `{ "p-relogin": "مشروع إعادة الدخول" }`. That name is written only by `dropProjectLocal` (`public/sync.js:582`).

The test deletes `projects/p-relogin` with rules disabled (`tests/emulator/login-relogin.test.js:370-372`) and then clicks the pill (`:375`). It decides the offline entry has been sent when the outbox length is 0 (`:367-368`). `performFlush` clears that outbox at `public/firebase-client.js:796-799`, and only then calls `fb.pull` (`:819`). `pull` ends in `forgetGoneProjects` (`:384` and `:516-530`). For an owner, that function reads each local project that already has `createdAtServer`. `p-relogin` was seeded with `createdAtServer`, so it is in that scan. A missing server document is passed to `dropProjectLocal` (`public/sync.js:542-590`), which removes the project from the memory cache and stores the name. `mergeById` does not do this removal. It keeps local rows that were not in the incoming set (`public/sync.js:282-290`). The owner project read is a collection query (`public/sync.js:381`), and `missingRequestedIds` only records a spec that has an id (`:521-530`), so `missingProjectIds` is not how this project disappears.

`performFlush` then sets `flushing` to null and calls `paintShell` (`public/firebase-client.js:834-836`). `paintShell` calls `render` (`:650-651`). The entry screen builds its pills from `L.projectList` (`public/render.js:578` and `:610`). With the project gone, the pill is not in the document. The next evaluation calls `.click()` on null.

`render` catches its own throws and shows `#render-error` (`public/render.js:1191-1202`). That node was empty in the failure snapshot, so the app did not throw. The hash-change listener is `render` (`:1484`). Line 374 of the test only sets the hash. The stack is line 375 because that is the evaluation that clicks.

This is not a user-visible crash. When the phone's pull learns that the server project is gone, the new-entry form stays on screen and the pill goes away. `#amt` and `#save` remain. A later save would fail inside `validateEntry` with `المشروع غير موجود` (`public/ledger.js:178-179`) and `commit` would not store a row (`public/render.js:332-336`). The test wants the other order. The phone still lists the project, the person saves, and the server refuses the create because `projectOpen` requires the project document (`firestore.rules:52-54` and `:121-123`). `flushOutbox` turns that refusal into `رُفض الإرسال`, and `messageAfterProjectProbe` changes it to `رُفض الإرسال لأن المشروع محذوف` when the project read says the document is missing (`public/sync-status.js:12`, `:15`, `:143-160`, and `public/sync.js:641-657`). The entry stays on the device and leaves the outbox. That path is what the assertions at `tests/emulator/login-relogin.test.js:376-387` already require. The flake is the test clicking before that path, after the in-flight pull has already removed the pill.

The 20ms samples in section 3 are `[milliseconds since the online event, outbox length, 1 while flushRemote is running, 1 while p-relogin is still in the local list]`. A passing click often lands on the sample where the outbox is already empty, the flush is still running, and the project is still listed. The failure lands on the later sample, where the flush has finished and the project is gone.

## 2. The two CI failures are the same click

|           | `d7dc8e9b` on main                                                                                    | `b3faf9a1`, the commit before `85e944b6` on PR #87                                                    |
| --------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Run       | [43983515317](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/actions/runs/43983515317) | [43975051302](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/actions/runs/43975051302) |
| Job       | 133705696236, emulator rules and sync                                                                 | 133676764677, emulator rules and sync                                                                 |
| Result    | 210 pass, 1 fail                                                                                      | 86 pass, 1 fail                                                                                       |
| Test time | 2097.319793ms                                                                                         | 1710.558048ms                                                                                         |
| Error     | `Error: Uncaught`                                                                                     | `Error: Uncaught`                                                                                     |
| Stack     | `session.ev` at `login-relogin.test.js:90`, called from `:375`                                        | the same two lines                                                                                    |

`b3faf9a1` and `85e944b6` share tree `48a7b0cab5828d1eb194782e1c3cbdd485001d38`. The retrigger run [43975913522](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/actions/runs/43975913522) on that same tree passed. `git diff --stat b3faf9a1 d7dc8e9b` is empty for `tests/emulator/login-relogin.test.js`, `public/firebase-client.js`, `public/render.js`, `public/sync.js`, and `public/session.js`. The 86 versus 210 gap is `tests/emulator/account-rules.test.js`, which the PR #87 job did not run. The failing test was not edited between the two red runs.

The same test passed on #88 head `930072edfed3f75eaa669bace7409f571a57d752`, run [43981507984](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/actions/runs/43981507984), and on `498b64bba3ba9c66829faa0137d70349660466cf`, run [43977102993](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/actions/runs/43977102993). Both emulator jobs were green.

`PERMISSION_DENIED` with `maximum of 1000 expressions` at rules line 156 is in both red logs, and it is already in runs from before #88. In run 43983515317 those lines are at 00:00:17Z, from earlier tests in the same job. The login-relogin failure is at 00:00:33Z, and the test had been running for about 2.1s. The click throws in the page before the refused create is sent. Those log lines are not this failure.

## 3. Measured locally

Machine: Node `v26.13.0`, Google Chrome `157.0.8103.50`, Firestore emulator `cloud-firestore-emulator-v1.22.0`. Auth `127.0.0.1:9099`, Firestore `127.0.0.1:8080`. The test's own static server is `127.0.0.1:8765`. No production Firebase call was made. The project id string `ahl-aljazeera-accounting` is the emulator namespace.

The unmodified test, this file only, one run at a time, 17 November 2026 00:26:07Z through 00:27:21Z:

| Result                  | Count |
| ----------------------- | ----- |
| Pass                    | 24    |
| `Uncaught` at the click | 0     |

On this machine the click usually happens while the flush is still running and the pill is still there, so the unmodified test did not fail in those 24 runs. CI's gap from `deleteDoc` to the click evaluation is sometimes long enough for `paintShell` to land first. That is why the same bytes fail in one run and pass in the next.

A 20ms sample inside the page, same test, 00:29:45Z through 00:30:08Z, 8 runs, 0 failures. In 4 of the 8 the click evaluation itself saw `flushing` set, `aria-busy="true"`, outbox length 0, and the pill still present. One of those traces was `[20,1,1,1]`, then `[180,0,1,1]`, and the click was taken on that second sample. A run in the same loop that kept sampling through the end of the flush was `[120,0,1,1]`, then `[200,0,0,1]`. The outbox was empty 80ms before the flush ended, and the project was still listed when it ended.

The same test with the old outbox-only wait, plus a 500ms pause after `deleteDoc` and before the click, 00:31:33Z through 00:32:09Z:

| Result                                                                            | Count |
| --------------------------------------------------------------------------------- | ----- |
| `TypeError: Cannot read properties of null (reading 'click')`                     | 7     |
| Pass, pill still present because the flush had already finished before the delete | 3     |

Failure snapshot, run 1, after the throw:

```json
{
  "hash": "#entry",
  "projects": [],
  "gone": { "p-relogin": "مشروع إعادة الدخول" },
  "flushing": 0,
  "out": 0,
  "btn": false,
  "amt": true,
  "save": true,
  "renderErr": "",
  "title": "قيد جديد"
}
```

The trace for that run was `[22,1,1,1]`, `[300,0,1,1]`, `[520,0,0,0]`. The project disappears at the moment the flush ends, not at the moment the outbox hits 0.

The 500ms pause is a probe. It is not part of the fix, and it must not be committed.

The candidate wait below, with that same 500ms pause still after the delete, 00:34:12Z through 00:34:48Z: 10 pass, 0 fail. Every trace shows the flush ending with the project still listed, for example `[221,0,0,1]`. The pause then cannot remove the pill, because no pull is running. Runs 3, 5, and 8 go on to queue the refused entry (`outbox` length returns to 1) and the existing refusal assertions pass.

Before any fix, the rate on this quiet emulator for the unmodified test is 0/24. The rate for the old wait once the pull is allowed to finish after the delete is 7/10. The two CI failures are that second rate, reached without an artificial pause because the runner's gap was long enough.

## 4. The fix

The phone is doing what `forgetGoneProjects` is for. The test has to save while the phone still lists the project, and it has to delete the server document only after the flush that followed the offline send has finished.

### Shape A, chosen

Wait for three facts that are already on screen or in the cache the screen renders, then delete, then save in one evaluation.

```javascript
const settled = await waitFor(
  session,
  `(() => {
  const bell = document.querySelector('#outbox');
  const busy = !!(bell && bell.getAttribute('aria-busy') === 'true');
  const n = (AJ.get('outbox') || []).length;
  const still = (AJ.get('projects') || []).some(p => p && p.id === ${JSON.stringify(PROJECT_ID)});
  return n === 0 && !busy && still;
})()`,
  20000,
);
```

`paintBell` sets `aria-busy` from `flushing` and removes it when the flush is done (`public/render.js:1084-1091`). `paintShell` runs after `forgetGoneProjects`, in the same turn that clears `flushing` (`public/firebase-client.js:834-836`). A poll in the test process cannot see a gap between those two lines. When the bell is idle and `p-relogin` is still in the cache, the probe saw the project, the server delete has not happened yet, and nothing in the page starts another pull until the next save. The online handler (`public/render.js:1485-1486`) has already run. `armFlushTail` does not arm for this entry. The traces show `flushing` staying clear until the refused save.

Then `deleteDoc`, unchanged. Then one evaluation does the hash change, the pill click, the amount, the description, and `#save`. Today those are two evaluations (`:374` and `:375`). A `paintShell` between them is the red run. Folding them removes that gap. The 10/10 above already passed with the two evaluations kept separate, after this wait, including a 500ms pause. The fold is the same wait plus no yield between render and click.

`session.ev` throws `exception.description` when CDP sent one, and `details.text` otherwise. A future null click fails as the `TypeError`, not as `Uncaught`.

The 20000ms bound stays. It is the existing bound on "the send finished", not a longer timeout. The condition is what changes.

### Shape B, not chosen

Wait until `window.flushing` is null and the project is still in the cache. That is the same bit `paintBell` reads. The bell is the fact a person can see, and it is set only after `paintShell`. Shape A uses the bell. Shape B would pass the same 10 runs and would miss a screen that still said it was sending if `paintBell` and the variable ever diverged.

Not chosen, and not a fix: retrying the click, skipping the test, sleeping, or raising the 20000ms bound. A pause makes this fail more often. It does not make it deterministic.

## 5. Files, types, and functions

No new type. No new function. One file.

| File                                   | Change                                                                                                                                                                                                      |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/emulator/login-relogin.test.js` | `session.ev` (`:87-91`) reports `exception.description`. The wait at `:367-368` gains the idle bell and the still-present project. The hash change at `:374` and the click at `:375` become one evaluation. |

The refusal wait at `:376-387`, the logout block, and the other five tests in the file stay. `public/` stays, including `public/sw.js`.

### Tests that prove it

The old wait plus a pause after `deleteDoc` failed 7/10 with the `TypeError` and the empty project list above. That pause is the demonstration, run locally against the emulator, and it is not committed.

The new wait plus the same pause passed 10/10, and the existing assertions still required the refused entry to leave the outbox, keep an error matching `رُفض` or `محتوى`, and remain in IndexedDB after reload.

The code pull request runs this file 24 times with no pause. The expected result is 24 pass. It runs `npm run test:emulator` once. The expected result is the current emulator count, all pass.

### Blast radius

The one fact this is safe because of: after the bell goes idle, no code path in this test starts `flushRemote` until `#save`. The server delete is invisible to the page until that save's pull. The pill is still rendered from the cache that just survived `forgetGoneProjects`. That was run, not only read. 10 of 10 runs with a 500ms pause after the delete still found the pill and passed the refusal assertions. The old wait, same pause, lost the pill 7 of 10 times.

| Risk                                                              | Where                               | Likelihood after the wait                                                                                                      | What to check                                                                                  |
| ----------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| The bell stays busy and the wait uses the whole 20s               | `public/render.js:1084`             | Low. The traces clear `flushing` about 80ms to 180ms after the outbox hits 0.                                                  | The assertion names the unsettled bell. It does not click.                                     |
| The pull drops `p-relogin` while the server document still exists | `public/firebase-client.js:526-530` | Not seen. Every settled trace kept the project.                                                                                | The wait fails the assertion instead of throwing `Uncaught`. That failure would be an app bug. |
| `session.ev` hides a failure that only set `details.text`         | `login-relogin.test.js:90`          | None for this throw. The description is present. If a future evaluation has text and no description, the text is still thrown. | One deliberate bad evaluation in this file.                                                    |

Cleared. `render` did not throw. `#render-error` was empty, and `#amt` and `#save` were present, so the null is the pill. `entry()` does replace `state.projectId` when the selected id is no longer listed (`public/render.js:585`). With one project that id becomes undefined. It does not throw, and it is not this fix. The `1000 expressions` lines are not this click. `set` for a list store puts rows and does not delete the dropped project from IndexedDB (`public/session.js:77`). The screen reads the memory cache through `get`. The failure snapshot's project list was already empty. This change does not rewrite IndexedDB.

## 6. Verification

On the code pull request, emulator only, from the repo root:

1. 24 sequential runs of `node --test --test-concurrency=1 --test-force-exit tests/emulator/login-relogin.test.js` against the local Auth and Firestore emulators. 24 pass. No pause added.
2. `npm run test:emulator` once. Every test in that script passes, including this one.
3. CI on that head, all 4 checks green: lint, format, types; ledger tests; browser checks; emulator rules and sync.

This plan pull request does not change the test. Its emulator job can still hit the old race. A red emulator job on this plan, with the same `Uncaught` at line 375, is the bug this plan describes. It is not a defect in the plan text.

## 7. Not in the code pull request

A retry of the click or of the job. A skip. A sleep. A timeout above 20000ms. A change to `forgetGoneProjects`, `dropProjectLocal`, or `firestore.rules`. A production deploy, a rules deploy, or any write to the live project `ahl-aljazeera-accounting`.
