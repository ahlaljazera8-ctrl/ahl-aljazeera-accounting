# Plan: the browser-check hang after the rejected save

Plan only. No application code in this change. Code waits until AgentLab Architect and EA have reviewed it. Ameer approves the merge.

- **Repo.** `ahl-aljazeera-accounting`, read at `main` = `2d21ef03c8cb128ab347a35022b8505d08a417c3`.
- **Gates.** Ameer approves every merge and every behaviour or rules change. All 4 CI checks stay. No spending. `arena` is banned, so the two shapes below were written by hand, not spawned.
- **محاسب أهل الجزيرة was not asked.** This is the browser harness. It does not change a balance, an advance, a ledger rule, an export, or `firestore.rules`.

## 0. What the next agent is building

One call site in `tests/browser-check.js` must stop navigating while the debugger is still offline, and must let the phone database finish its write first. One source test locks that order so a later edit cannot put the navigation back. Nothing under `public/` changes, so the service-worker `VERSION` stays.

Not in this plan's implementation: a longer CDP deadline, a retry of the browser job, a skipped check, a change to `go()` that clears offline for every navigation, a change to `public/sw.js`.

## Problem

CI job "browser checks" sometimes dies with `CdpTimeoutError: browser-check: CDP Runtime.evaluate timed out after 30000ms` (`tests/cdp-session.js` timer at the `Runtime.evaluate` send). The summary line is then `browser checks: missing pass, 0 fail`, because the process throws before it prints `browser checks: N/N passed` and every `check()` that did run passed. Re-runs of the same SHA pass. The 30s deadline landed in PR #83 (`9ba6dfbd`). It is what turns the stall into a failed job. It is not why the stall happens.

The stall is always the same place: the first document navigation after `check('a rejected save still says the person was not saved', ...)`, which is `await go(`${BASE}index.html?role=owner&fresh=rejected#home`)` at `tests/browser-check.js:1589` on this SHA.

## Evidence

### CI logs (proven)

Five failed jobs, pulled from the public Actions API. Each one is 211 `PASS` lines, 0 `FAIL` lines, then the timeout. The last pass is always `a rejected save still says the person was not saved`. The clock from that line to `CdpTimeoutError` is 30.912s or 30.913s.

| SHA | Run | Job | Attempt | Delta |
| --- | --- | --- | --- | --- |
| `298d34ad` | 43827901642 | 133165967824 | 1 | 30.913s |
| `d2dac2ec` | 43851160466 | 133243753949 | 1 | 30.912s |
| `d5cdec44` | 43855735877 | 133259395048 | 1 | 30.912s |
| `e0992beb` | 43858723893 | 133269625757 | 1 | 30.912s |
| `2d21ef03` | 43871065828 | 133312068349 | 1 | 30.913s |

Attempt 2 of `43871065828` (`2d21ef03`) and of `43855735877` (`d5cdec44`) passed. A later run of `298d34ad` (43830436243) passed. The stack is only the timer (`Timeout._onTimeout` in `tests/cdp-session.js`). Node does not keep the async caller, so the stack does not name `go`. The clock does.

`go` for a `?role=owner` URL sleeps 900ms and then evaluates the ready probe (`tests/browser-check.js:50-52` and `:43`). 30.912s is that 900ms plus the 30s timer plus about 12ms for `performance.timeOrigin` and `Page.navigate` to return. A hang on `Page.navigate` itself would name `Page.navigate` and would land near 30.0s. A hang on the `rejectedHome` evaluate after `go` returns would include `sleep(300)` and land near 31.2s. Neither matches. The call that gets no reply is the first `Runtime.evaluate` inside `waitReady`, the expression `({o:performance.timeOrigin,r:document.body&&document.body.dataset.ready==='1'})`.

### What that call site is doing (proven)

`Network.emulateNetworkConditions` is set `offline: true` at `tests/browser-check.js:1482` and is not set back. The earlier offline block is set back at `:1359` before the next `go`. The block at `:1482` used to be the end of the file. `f718c8d9` (#57) added it for the offline person save. `baf4f21f` (#72) appended the rejected-screen `go(...fresh=rejected...)` after that block and did not restore the network. Several `go()` calls between `:344` and `:1151` do run while offline, and they succeed in the same failing jobs (the run reaches `:1589`). So "any offline navigation" is not the bug. This is the first document navigation after the debugger is turned offline the second time, on a document that was loaded online.

That document was opened at `:1422` with `?role=owner`, while the debugger was online (`:1359`). The save tests then call `history.replaceState(null, '', location.pathname)`, which drops `?role=`, so `demoRole()` is false and `savePerson` takes the non-demo branch (`public/render.js` `savePerson`). The rejected-save evaluate clicks `#save-person` and returns after 80ms without awaiting `savePerson` or the `set()` promises. The check can pass as soon as the message is `تعذر حفظ الشخص`. On the traced hang below, that evaluate had already returned, and `performance.timeOrigin` returned on the next CDP call, so the main thread was idle at the moment of `Page.navigate`. The 80ms cutoff is real. It is not what froze the thread before the navigation.

`go` then does `Page.navigate` to a URL the service worker has never cached (`fresh=rejected` is only a cache-buster; `public/` does not read `fresh`). `public/sw.js` answers shell GETs by `fetch(..., { cache: 'no-cache' })` and, on failure, `caches.match` of that exact URL (search included). A unique query is a cache miss.

### Local reproduction (proven)

Machine: Google Chrome `157.0.8103.50` (the ubuntu-24.04 runner image readme lists the same build; the Actions log does not print it). Node `v26.13.0` for the 30-run loop, matching CI. `google-chrome` on this machine is `/usr/local/bin/google-chrome`, which prepends flags and then execs stable Chrome. The per-run `--user-data-dir=/tmp/aj-chrome-*` still received `DevToolsActivePort`, so each run had its own profile. CI's `google-chrome` is the stock binary. That is a caveat, not a different Chrome version.

Full `tests/browser-check.js`, sequential, one Chrome at a time, port 8765, 30 runs:

| Result | Count |
| --- | --- |
| `226/226 passed`, exit 0, 67–70s | 28 |
| `CdpTimeoutError` on `Runtime.evaluate` after the rejected-save pass, exit 2, 91–92s | 2 (runs 12 and 27) |

Hit rate 2/30. No other failure mode. A three-Chrome parallel attempt earlier in the same session produced `document was not ready` and mixed ports in one trace. Those runs are discarded. They are not in the 2/30.

Short replays, same Chrome, did not hang:

| Probe | Result |
| --- | --- |
| Load demo, service worker controlling, `replaceState`, offline, the rejected-save script, navigate to a fresh query. 8 loops. | 8/8 loaded the new URL in about 1.4s |
| Same, with an IndexedDB readwrite transaction held open by chaining `get()` on itself. 4 loops. | 4/4 navigated |
| Offline set on both the page target and the service-worker target. 4 loops. | 4/4 `Runtime.evaluate` returned. The document was `chrome-error://chromewebdata/`. A fast network failure still answers evaluate. It does not sit for 30s. |
| Offline, navigate, online, navigate, offline, rejected-save script, navigate. 30 loops. | 30/30 in about 3.6s |

The hang needs the long suite in front of `:1589`. The tail alone does not trip it.

### CDP trace of a hang (proven, run 27)

Logged from the page target. Times are `Date.now()`.

The save evaluate returned `{hash:"#person/u-ahmed", msg:"تعذر حفظ الشخص"}`. The next calls:

```text
CALL Runtime.evaluate performance.timeOrigin
RES  Runtime.evaluate {"result":{"type":"number","value":1794838409893.5}}
CALL Page.navigate
EVT  Page.frameStartedNavigating http://127.0.0.1:8765/index.html?role=owner&fresh=rejected#home
EVT  Page.frameStartedLoading
EVT  Network.requestWillBeSent
RES  Page.navigate {"frameId":"...","loaderId":"89A465F684E01EA67255720C4C133F9C","isDownload":false}
CALL Runtime.evaluate ({o:performance.timeOrigin,r:document.body&&document.body.dataset.ready==='1'})
```

The ready evaluate is 901ms after `Page.navigate`'s result. Nothing arrives after `requestWillBeSent`: no `Network.loadingFinished`, no `Page.frameNavigated`, no `Runtime.executionContextCreated`, no `Runtime.executionContextsCleared`, no `Page.loadEventFired`, no `Page.javascriptDialogOpening`, no `Inspector.detached`, no target-crash event. The evaluate then has no result for 30s.

A passing run of the same navigation (run 20) has the same `Page.navigate` result shape, then within about 10ms `executionContextsCleared`, `Page.frameNavigated`, and `Network.loadingFinished`. The ready evaluate 900ms later returns `{o: <new time origin>, r: true}`.

On the first hang (run 12, 2026-11-16T13:56:14Z) the static server did log `GET /index.html?role=owner&fresh=rejected HTTP/1.1" 200`. The next server line is 31s later, the following run. The server finished a response. Chrome never committed a frame. Run 12's trace, taken before result logging was on, shows the same hole: `Page.navigate` sent, then 906ms of no `frameNavigated` / `loadEventFired` / context events, then the ready evaluate, then the timeout.

### What this rules out (proven)

- The deadline from PR #83. The call is unanswered; raising 30s would wait longer for the same silence.
- A JavaScript dialog (`alert` / `confirm` / `prompt` / `beforeunload`). `Page.javascriptDialogOpening` was subscribed and did not fire. The app has no `beforeunload` handler. `savePerson` does not call `alert`.
- A crashed target or a dropped socket. Those reject as `CdpSocketError` (`tests/cdp-session.js` `failAll`). The socket stayed open until the timer.
- A fast navigation failure. Forcing the service worker offline produced `chrome-error://chromewebdata/` and a live evaluate.
- The main thread already being stuck before `Page.navigate`. `performance.timeOrigin` returned in the same millisecond as the navigate send.
- An IndexedDB transaction by itself. Holding one open across `Page.navigate` still committed a new document, 4/4.

### Root cause

`Page.navigate` to `index.html?role=owner&fresh=rejected#home` returns a `loaderId` and Chrome emits `Network.requestWillBeSent`, then the load never finishes and the frame never commits. `waitReady` sends `Runtime.evaluate` 900ms later. There is no new execution context, and the old one does not answer, so the CDP call sits until the 30s timer.

That navigation is the one `#72` added after `#57`'s offline block, which never turns the debugger back online. The same file already treats "offline, then a document `go()`" as something to undo (`:1359`) for the previous block. This call site is the one that was left out. The stall is intermittent (2/30 here, and the five CI jobs only on some attempts) because other offline navigations in the same run do commit. The one that does not is this one, after the online document has been switched offline and the person-save script has run.

Confidence: high on the mechanism (the trace). High that the missing `offline: false` is the bug in the test, because it is the difference between this `go()` and the `go()` the file already guards, and because the load is the thing that never finishes. Medium that restoring the network is sufficient by itself, because a 30-loop of only the tail, already offline, did not hang. The long suite is part of the condition. The implementation's proof is another 30-run, not a guess.

## Usage (caller's view)

The caller is the browser job. It still runs `node tests/browser-check.js` once. The rejected-save check still requires `hash` to start with `#person/` and the message `تعذر حفظ الشخص`. The checks after `:1589` still run on a demo owner home, including the deleted-project link and the rejected screen. They do not read `navigator.onLine`.

The new order, in the existing script, immediately after that `check` and before `go`:

```javascript
await ev('AJ.flush()');
await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await go(`${BASE}index.html?role=owner&fresh=rejected#home`);
```

`AJ.flush` is the existing `writing` chain (`public/session.js`, `window.AJ.flush`). `awaitPromise: true` on `ev` waits until it settles. The `send` is the same call the file already makes at `:1359`.

## Shape

No new module and no new type. The load-bearing decision is where the offline flag is owned: each block that turns it on turns it off before the next document navigation that does not mean to stay offline. `go` does not learn about the flag. A global clear inside `go` would break the checks that navigate while offline on purpose between `:344` and `:1151` (`a large project pages 50 rows and stays offline` and the other offline reloads).

`waitReady` stays. It still sleeps 900ms on a role demo and still uses the 30s CDP deadline. The fix makes the load commit, so the evaluate has a document to answer. It does not teach `waitReady` to ignore a missing document.

The source test lives in `tests/chrome-debug.test.js`, which already reads `tests/browser-check.js` and is already on both `node --test` lists (`package.json` `"test"` and the ledger step in `.github/workflows/ci.yml`). A new file would have to be inserted in both lists by hand. This does not.

```javascript
test('the rejected-screen navigation restores the network first', () => {
  const src = fs.readFileSync(path.join(__dirname, 'browser-check.js'), 'utf8');
  const save = src.indexOf("check('a rejected save still says the person was not saved'");
  const go = src.indexOf('fresh=rejected#home', save);
  const between = src.slice(save, go);
  assert.match(between, /AJ\.flush\(\)/);
  assert.match(between, /offline:\s*false/);
});
```

On today's `main` the slice has neither call, so the test fails. After the two lines, it passes.

Interface depth: the public surface is those two existing calls at one site, plus one assertion. The complexity that stays hidden is Chrome's refusal to finish a load. Callers of `go` do not grow a new option.

## Synthesis decision

`arena` was not run. Two shapes were compared by hand.

Shape A is the base: restore the network and flush at this call site, and lock the order with the source test. It uses the pattern already at `:1359`. It does not add a second way to navigate. It does not change `public/`.

Shape B, rejected: change `public/sw.js` so a `fetch` that does not settle falls back to `caches.match` with `ignoreSearch`, and bump `VERSION`. That would also make a stuck load commit, including for a real phone on a network that never answers. It is a behaviour change, it is a wider surface, and the trace does not show a phone hitting it. The test can stop issuing the navigation while the debugger is offline. The service worker is the wrong layer.

Also rejected: making `waitReady` throw `navigation did not commit` when `frameNavigated` never arrives, without restoring the network. Same 30s budget, clearer text, the job still red on the unlucky attempt. Rejected: a retry of the browser job, or a second `go()` after a timeout. That hides the failure. Rejected: raising `DEFAULT_CDP_TIMEOUT_MS`. Rejected: clearing offline inside `go` for every URL.

## Tradeoffs accepted

- We accept that the 2/30 hang was not reproduced by the tail alone, in exchange for a fix that removes the condition the trace shows (a document load that never finishes while the debugger is offline) and that the file already uses one block earlier.
- We accept a source test rather than a test that hangs the suite on purpose. A loop-until-hang test would be red on current `main` only sometimes, which is the bug, and it would stay flaky if the fix were incomplete. The 30-run is the implementation's proof, run by the person who lands the fix, not a new CI loop.
- We accept that `AJ.flush()` could itself sit for 30s if a transaction never settles. On the traced hang the main thread answered `performance.timeOrigin` immediately, so this is the separating check: if the implementation's runs time out on `AJ.flush` instead, the database write is the stall and this plan is wrong. Say so and stop. Do not add a timeout around flush.

## Alternatives considered

Shape B, the service-worker fetch deadline, hides less of Chrome and exposes a new caching policy to every shell request. Shape A hides the Chrome stall behind a call the test already has. Shape B lost.

A harness that only renames the timeout exposes the missing `frameNavigated` to the log and still fails the job. It lost because the goal is a committed document, not a shorter red build.

## Tests that prove it

1. `tests/chrome-debug.test.js` gains the source test above. It fails on `2d21ef03` (the slice has no `offline: false` and no `AJ.flush()`). It passes once those two calls sit between the rejected-save `check` and `fresh=rejected#home`. That is the deterministic failure-before-fix. It does not launch Chrome. The hang itself was 2/30, not 30/30, so a Chrome test cannot honestly fail every time on current code without injecting a different bug.
2. The implementation re-runs the full `node tests/browser-check.js` 30 times, sequential, one Chrome, Node 26, and records hangs. Current code: 2/30, both at this evaluate. The fix is good only if that loop is 0/30 and each run still prints `226/226 passed`. Do not lower the count. The two new lines are not new `check()` calls. The pass floor in the browser job stays.
3. The ledger job runs the new source test because `tests/chrome-debug.test.js` is already on its list. No new list entry. No fifth job.

## How the 4 checks stay intact

- **lint / format / types.** The two lines match the `send` already at `:1359`. The new `test()` matches the style of the existing source slice in `tests/chrome-debug.test.js`. No `public/` edit, so `tsc` inputs do not change and `public/sw.js` `VERSION` does not bump.
- **ledger tests.** Same `node --test` file list. One more passing test inside a file already on the list. The `pass -lt 34` floor still holds.
- **browser checks.** Same script, same 226 checks, same 30s CDP deadline, one run per job, no retry. The rejected-save assertion is unchanged. The checks after `:1589` still navigate, still read the home and the rejected screen, and still fail the job if they fail.
- **emulator rules and sync.** Untouched.

## Risks

- Restoring online on this document fires the `online` listener (`public/render.js`). `replaceState` has cleared `?role=`, and `sessionUser` is set, so the listener calls `flushRemote` and `refreshDirectory('online')` against the test's `ensureFirebase` mock (save rejects, `listUsers` resolves empty). The same listener already runs at `:1359`, which is also after a `replaceState` that strips the query, and those jobs get past it. The implementation confirms the following 226 checks still pass, including the rejected-screen ones. If `flushRemote` on that mock throws into the page, the next `go` still loads a fresh `?role=owner` document. The checks do not read the old page.
- If a 30-run after the fix still hangs at the ready evaluate, Shape A is incomplete. Do not raise the timeout and do not retry the job. Stop and bring the trace (it should still show whether `requestWillBeSent` is missing `loadingFinished`). The next design is a service-worker question and needs Ameer, because it would change `public/sw.js`.
- The local `google-chrome` wrapper is not what CI execs. The 2/30 was still on Chrome `157.0.8103.50`. If the implementation machine's Chrome differs, say the version next to the 30-run count.

## Next implementation step

In `tests/browser-check.js`, after the rejected-save `check` and before `go(...fresh=rejected#home)`, await `AJ.flush()` and send `Network.emulateNetworkConditions` with `offline: false`, then add the source test in `tests/chrome-debug.test.js` and run it so it fails once on the unpatched slice before the two lines exist.
