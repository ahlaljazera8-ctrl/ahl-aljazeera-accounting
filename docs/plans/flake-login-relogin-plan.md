# Plan: the refused-entry click in login-relogin (r3)

Revision after AgentLab Architect NOTES on PR #89 r2 at `d8361bcf`. Not an approval. Plan only. No application code in this change. The code pull request waits until Architect and EA have reviewed this revision. Ameer approves the merge.

- **Repo.** `ahl-aljazeera-accounting`, read at `d7dc8e9b437a3bb8fc20c0bebe784d2c01f3b5c6`. `main` has since moved to `ae13d27c` with a docs-only file. This plan's line numbers are `d7dc8e9b`. The Architect confirmed them.
- **Gates.** Ameer approves every merge and every behaviour or rules change. All 4 CI checks stay. No spending. `arena` is banned, so the shapes were written by hand.
- **محاسب أهل الجزيرة was not asked.** The flake fix does not change a balance, an advance, a ledger rule, an export, or `firestore.rules`. A1 below would ask the accountant when it goes to Ameer. It is not this fix.
- **r1's proof is not the bar.** A 0/24 pass on the unmodified test cannot separate a fix from the old wait. The 500ms pause went red only 7/10. Both are withdrawn. Section 4 is the bar.

## 0. What the next agent is building

Test and helper changes only. Nothing under `public/`, so `const VERSION` in `public/sw.js` stays.

In `tests/emulator/login-relogin.test.js`, the online event and the capture of `window.flushing` are one evaluation. The test awaits that promise, then asserts the end state, including the idle bell. It does not poll. The hash change and the refused save stay one evaluation. `session.ev` reports the page exception.

The same exception order is fixed in the other four harnesses through one helper. `tests/emulator/offline-cold-start.test.js` awaits the in-flight flush before logout. `docs/PSTACK_INVENTORY.md` gains the rows in section 7.

No retry, no skip, no sleep, and no timeout used as the fix.

## 1. Root cause

Confirmed by the Architect at `817a0d36`. The page exception is `TypeError: Cannot read properties of null (reading 'click')`. CDP puts that sentence on `exceptionDetails.exception.description` and the word `Uncaught` on `exceptionDetails.text`. `session.ev` throws `details.text` first (`tests/emulator/login-relogin.test.js:90`). With the description read first, the same failure is the `TypeError`. The Architect reproduced that on the box.

The null is the project pill `[data-proj="p-relogin"]`. After the throw, the new-entry screen is up and `#render-error` is empty. `render` catches its own throws (`public/render.js:1191-1202`). The app did not throw. A person cannot click null. A tap lands on the DOM that is there.

`performFlush` clears the outbox at `public/firebase-client.js:798`, then `await fb.pull` at `:819`. `pull` calls `forgetGoneProjects` (`:384`, `:516-530`). For an owner that reads each local project which already has `createdAtServer`. A missing document goes to `dropProjectLocal` (`public/sync.js:542-590`), which stores the name at `:582` and removes the project from the memory cache. The `finally` sets `flushing = null` (`firebase-client.js:835`) and then `paintShell()` (`:836`), which calls `render` (`:650-651`). The pills come from `L.projectList` (`public/render.js:578`, `:610`). There is no `onSnapshot` and no `setInterval` in `public/`. `armFlushTail` (`firebase-client.js:841-881`) does not arm for this entry.

The test's `outbox.length === 0` wait (`login-relogin.test.js:367`) is not "send finished". The bell keeps `جارٍ الإرسال` and `aria-busy` while `flushing` is set, even at count 0 (`public/render.js:1078-1091`). The only code that treats an empty outbox as done is the test.

The test wants the phone to still list the project, then save, then have the server refuse the create because `projectOpen` requires the document (`firestore.rules:52-54`, `:121-123`). `messageAfterProjectProbe` stores `رُفض الإرسال لأن المشروع محذوف` (`public/sync-status.js:15`, `:157-160`). The assertions at `login-relogin.test.js:376-387` already require that. The flake is the click after the in-flight pull has removed the pill.

## 2. The two CI failures are the same click

|           | `d7dc8e9b` on main                                                                                    | `b3faf9a1`, the commit before `85e944b6` on PR #87                                                    |
| --------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Run       | [43983515317](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/actions/runs/43983515317) | [43975051302](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/actions/runs/43975051302) |
| Job       | 133705696236, emulator rules and sync                                                                 | 133676764677, emulator rules and sync                                                                 |
| Result    | 210 pass, 1 fail                                                                                      | 86 pass, 1 fail                                                                                       |
| Test time | 2097.319793ms                                                                                         | 1710.558048ms                                                                                         |
| Error     | `Error: Uncaught`                                                                                     | `Error: Uncaught`                                                                                     |
| Stack     | `session.ev` at `login-relogin.test.js:90:24`, called from `:375:5`                                   | the same two lines                                                                                    |

On run 43983515317 the live failure line is `23:59:28.98Z`, which is 02:59 on 17 Nov in Baghdad. `00:00:33Z` is only the end-of-run summary (`ℹ pass 210`, `ℹ fail 1`). The `maximum of 1000 expressions` lines in that job are 1 at `23:58:32Z`, then 68 from `23:59:58Z` through `00:00:17Z`. Those 68 come after the test has already failed. They are not this click. The same lines exist in runs from before #88.

`b3faf9a1` and `85e944b6` share tree `48a7b0cab5828d1eb194782e1c3cbdd485001d38`. Rerun [43975913522](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/actions/runs/43975913522) passed. So did [43981507984](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/actions/runs/43981507984) (`930072ed`) and [43977102993](https://github.com/ahlaljazera8-ctrl/ahl-aljazeera-accounting/actions/runs/43977102993) (`498b64bb`). `git diff --stat b3faf9a1 d7dc8e9b` is empty for this test and for `public/firebase-client.js`, `public/render.js`, `public/sync.js`, and `public/session.js`.

## 3. The wait

Shape A in r1 polled `waitFor` (`login-relogin.test.js:129-135`), which sleeps 200ms and swallows exceptions, up to 20s. That is a poll with a timeout. It is not the fix. `waitFor` stays for the other checks in this file. The settled check does not use it, so a throw there is visible. A `waitFor` timeout still hides the page exception. This revision does not rewrite every `waitFor`.

The online listener calls `flushRemote` and does not await it (`public/render.js:1485-1486`). `flushRemote` assigns `window.flushing` before the body yields (`public/firebase-client.js:597-598`) and returns that promise (`:607`). One evaluation fires the event and keeps the promise:

```javascript
await session.ev(`dispatchEvent(new Event('online')); window.__run = window.flushing; 1`);
await session.ev(`(async () => {
  let run = window.__run;
  while (run) { await run; run = window.flushing; }
  const bell = document.querySelector('#outbox');
  const busy = !!(bell && bell.getAttribute('aria-busy') === 'true');
  const n = (AJ.get('outbox') || []).length;
  const still = (AJ.get('projects') || []).some(p => p && p.id === ${JSON.stringify(PROJECT_ID)});
  return { n, busy, still, armed: !!window.flushTimer };
})()`);
```

`session.ev` already passes `awaitPromise: true`. The second call awaits the app's own flush. The `while` covers a flush that replaced `window.flushing` before the first promise settled. Then the test asserts, in the Node process, `n === 0`, `busy === false`, `still === true`, and `armed === false`. A failed assert does not delete the project and does not click.

The bell check stays. It is the fact on screen. `paintBell` sets `aria-busy` from `flushing` and clears it only when `paintShell` runs (`public/render.js:1084-1091`). The 20s watchdog inside `flushRemote` (`firebase-client.js:600-605`) sets `flushing = null` and calls `render`, and it does not clear `aria-busy`. The Architect's v4 held the pull forever: a bell wait failed the assertion `the offline entry sends once the phone is back`, and a wait on `window.flushing` alone would have been released by that watchdog. The assertion on the bell is what still fails in that case.

`window.flushTimer` is the tail timer (`firebase-client.js:433-434`). This entry does not arm it. If it is set, the assert fails closed instead of deleting under a flush that is about to start.

Then `deleteDoc`, unchanged. Then one evaluation does the hash change, the pill click, the amount, the description, and `#save`. Today those are `:374` and `:375`.

The 20000ms bound is not the signal and it is not raised.

### Shape not chosen

Waiting only until `window.flushing` is null, without the bell assert. The watchdog nulls `flushing` at 20s and leaves `aria-busy`. v4 is that case.

## 4. Proof bar

The gate is test-only. It does not edit `public/`. Before the online dispatch, the page holds `forgetGoneProjects` on a promise the test opens:

```javascript
window.__gate = new Promise(resolve => {
  window.__open = resolve;
});
const orig = forgetGoneProjects;
forgetGoneProjects = async function () {
  await window.__gate;
  return orig.apply(this, arguments);
};
```

`forgetGoneProjects` is a classic-script function, so the page can replace it. The hold is released by `window.__open()`.

The Architect ran this on the box against `d7dc8e9b` (Firestore emulator v1.22.0, Chrome, `node --test --test-name-pattern='refused entry stays'`). Each variant used description-first `session.ev`.

| Variant                                                                      | Result                                                                                           |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Old outbox wait, gate opened after `deleteDoc`, then `await window.flushing` | 10/10 red, `TypeError: Cannot read properties of null (reading 'click')`                         |
| r1's bell wait with the `!busy` term removed, same gate                      | 10/10 red, the same `TypeError`                                                                  |
| Promise wait, then settle after the delete instead of a pause (Architect v6) | 10/10 green                                                                                      |
| r1's poll, gate never opened                                                 | Red on `the offline entry sends once the phone is back`. The watchdog did not clear `aria-busy`. |
| Unmodified test, no gate                                                     | 9/10. The one red is the login WebChannel in section 6, before the click.                        |

The code pull request repeats that bar and raises the green count:

1. Old outbox wait under the gate, opened only after `deleteDoc`: red, at least 10/10, and the thrown text is `TypeError: Cannot read properties of null (reading 'click')`. That also proves description-first `session.ev`.
2. The section 3 wait under the same gate. Open the gate before the await, in the same evaluation as the online event or as soon as the page shows that `forgetGoneProjects` has been entered, and before `await window.__run`. Then assert, then delete, then save. Green, at least 30/30, on the local emulator. Opened that early, the gate only delays the pull until the open. The fix cannot proceed until that held pull settles. That delay is the determinism. Opening the gate only after `deleteDoc` leaves the await waiting on a promise the gate still holds, and the run deadlocks.
3. Mutation: remove the await of the flush and use the old outbox-only wait. Open the gate after `deleteDoc`, then `await window.flushing`, then click. Red, 10/10, `TypeError: Cannot read properties of null (reading 'click')`. That is the Architect's v1. The code pull request runs it again and pastes the count. The mutation is not left in the tree. Removing only the bell assert, while the test still awaits the flush and the gate stays shut until after `deleteDoc`, hung until the 80s test timeout (2 of 3 on the box, 82042ms and 80584ms). That is a cancel, not the `TypeError`, so it is not the mutation. The bell assert stays in the fix. It is defence in depth for the watchdog: if the gate is never opened, the assert fails and the test does not click (Architect v4).
4. About 30 reruns of the emulator job on the code-PR head. Zero failures of this click. Any other failure is named in the PR, including the two in section 6. GitHub Actions minutes on this plan are not a spend.

A permanent test stays in the file, beside the fixed save. It holds the pull across the delete and asserts that the pill is gone and `#render-error` is empty. It does not click. It does not sleep. It is the app behaviour the gate made deterministic: a pull that learns the project is gone removes the pill and does not throw.

## 5. Files, types, and functions

No new type. One helper function. No `public/` function changes.

| File                                        | Change                                                                                                                                                                                                                                                                      |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/page-exception.js`                   | New. `pageExceptionText(details)` returns `exception.description`, then `exception.value`, then `details.text`, then `eval failed`.                                                                                                                                         |
| `tests/emulator/login-relogin.test.js`      | `:73` log and `:90` throw use the helper. The online dispatch at `:366` captures `window.flushing`. The outbox wait at `:367-368` becomes the await plus the assert in section 3. `:374` and `:375` become one evaluation. The permanent gate test from section 4 is added. |
| `tests/emulator/app-entry.test.js`          | `:81` log and `:94` throw use the helper.                                                                                                                                                                                                                                   |
| `tests/emulator/session-live.test.js`       | `:107` uses the helper. `:388` stays.                                                                                                                                                                                                                                       |
| `tests/emulator/security-headers.test.js`   | `:150` uses the helper.                                                                                                                                                                                                                                                     |
| `tests/sw-cache.test.js`                    | `:62` uses the helper. The 8000ms race around that evaluate stays.                                                                                                                                                                                                          |
| `tests/emulator/offline-cold-start.test.js` | `:444` stops treating an empty outbox as done. See below.                                                                                                                                                                                                                   |
| `docs/PSTACK_INVENTORY.md`                  | The section in section 7. `setup-pstack` stays «ناقصة».                                                                                                                                                                                                                     |

`session-live.test.js:388` waits for an empty outbox and then reads the server document (`:390-394`). The server row is the "sent" check. That wait stays.

`offline-cold-start.test.js` signs in, and login calls `flushRemote` before it returns (`public/app.js:176`). `:444` then waits until the outbox length is 0 and clicks `#logout` while `forgetGoneProjects` may still be running. The code pull request, after the shell is up and before that click, evaluates `let run = window.flushing; while (run) { await run; run = window.flushing; }` and asserts the bell is not `aria-busy` and the outbox length is 0. Then it clicks logout. No new timeout.

`tests/cdp-session.js` `ev` (`:250-256`) does not read `exceptionDetails` at all. It is a different gap. This change does not pretend to fix it.

The refusal assertions, the logout block, and the other tests in `login-relogin.test.js` stay. The code pull request's squash message drops `Co-authored-by: ameer`. r1's commit `817a0d36` carries that trailer.

### Blast radius

The safe fact for the save is the assert after the awaited flush: the bell is idle, the project is still listed, and `flushTimer` is clear, so the delete is not inside `forgetGoneProjects`. The Architect's v6 promise wait was 10/10 green. The code pull request's bar is 30/30, with the gate opened before that await. Opened that early, the gate only delays the pull. The mutation removes the await and uses the old outbox-only wait, gate opened after `deleteDoc`: 10/10 `TypeError: Cannot read properties of null (reading 'click')`. Removing only the bell assert hangs. The bell assert stays.

The helper is text only. It changes the `Error` message when an evaluation throws. Passing calls do not throw. `waitFor` in `login-relogin.test.js:132` still swallows, so those timeouts do not gain the new sentence. The settled check is outside `waitFor`.

### Known neighbours, not this change

Architect review of PR #89 at `817a0d36`, section 3, and the r2 review at `d8361bcf`. Both need `public/`. Both are deferred to a separate plan, at EA's call, and then to Ameer. A1 also asks محاسب أهل الجزيرة. This pull request does not change them and does not claim to.

- **A1.** If the selected project is dropped while the entry form is open and another project remains, `entry()` sets `state.projectId` to `projects[0].id` (`public/render.js:585`). A later save would book the entry on that other project. With one project the id becomes undefined and `validateEntry` stores nothing (`public/ledger.js:178-179`). The Architect read this and did not run it. The separate plan blocks the save, or forces an explicit re-pick, instead of switching to `projects[0]`. The exact behaviour stays open for accounting review.
- **A2.** `set` for a list store puts rows and does not delete them (`public/session.js:77`). `dropProjectLocal` removes the project from memory only. A reload can show it again until the next owner pull. The Architect read this. A reload probe was not in that review. The separate plan deletes no real data, and it never drops an unsynced or refused line. Those are rows still in the outbox or named in `syncErrors`, which is the keep-rule `dropProjectLocal` already uses.

## 6. Other failures the 30 reruns can hit

These are not the pill click. The code pull request does not change `public/` to chase them. A rerun that fails on either is named, with the run id and the assertion text, and is not counted as this fix failing. Neither is given a longer timeout.

**Project arrival, `login-relogin.test.js:345-346`.** The assertion is `the project should arrive from the emulator`. The wait is 15s for `مشروع إعادة الدخول` in `#main` after forcing `#projects`. It runs before the online event and before the gate. The 2 misses in 20 were in r1's polling wait (Architect v2). The promise wait, v6, was 10/10 with no misses. Not root-caused past that. `set` does not render. The name appears when `paintShell` runs at the end of the login pull (`public/app.js:176`, `public/firebase-client.js:836`). The 15s wait returned false on those 2 polls anyway. Cause of those 2 misses is unproven.

**Login, `login-relogin.test.js:344` and `:145-147`.** The assertion text starts with `login.` The shell did not show within 20s. The Architect's unmodified run was 9/10, and the one red carried a WebChannel `Listen` stream error in the page log. The app does not call `onSnapshot`. Firestore still opens a Listen stream. `memoryLocalCache` (`public/firebase-client.js:121-127`) is there so a failed watch is not replayed from IndexedDB. It does not stop the SDK from logging a Listen error. Not root-caused to a line that throws. The login button path is unchanged by this plan.

browser-check.js:1820 (site user export) failed once on 97871185, job 133741201310, docs-only head, r2 4/4. It's timing-based (sleep 200 / setTimeout 30 / 40), and the log doesn't say which of its 6 conditions missed. Out of scope here; it gets its own root-cause plan later (same rules: no retries, skips or longer sleeps; first make the check print which condition failed).

## 7. Inventory row, in the code pull request

`docs/PSTACK_INVENTORY.md` gets one section. Statuses above it stay. `setup-pstack` stays «ناقصة». The file does not say the app is pstack-compliant. `arena` stays banned. `principle-attack-the-premise` does not apply. One fix, not two failed fixes of the same premise.

| Skill                       | This pull request                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `principle-fix-root-causes` | The test treated an empty outbox as a finished pull. The pull then drops a project deleted in that gap, and the click hits a missing pill. The fix awaits `flushRemote`'s promise and asserts the idle bell before the delete. A pause, a retry, and a longer timeout are not the fix.                                                                                                          |
| `principle-prove-it-works`  | The gate holds `forgetGoneProjects` until the test opens it. Old outbox-only wait, gate opened after the delete: at least 10/10 `TypeError: Cannot read properties of null (reading 'click')`. That is the mutation. The promise wait opens the gate before the await and is at least 30/30 green. The bell assert stays. About 30 emulator reruns on the head, and any other failure is named. |
| `blast-radius`              | `pageExceptionText` is what the five harnesses throw. `offline-cold-start.test.js` awaits `window.flushing` before logout. `session-live.test.js:388` stays, because the next lines read the server document. No `public/` change. A1 and A2 are named and not edited.                                                                                                                          |

## 8. Not in the code pull request

A retry of the click or of a job as the fix. A skip. A sleep. A larger timeout. A change to `forgetGoneProjects`, `dropProjectLocal`, `render.js:585`, `session.js:77`, or `firestore.rules`. A production deploy, a rules deploy, or any write to the live project `ahl-aljazeera-accounting`.
