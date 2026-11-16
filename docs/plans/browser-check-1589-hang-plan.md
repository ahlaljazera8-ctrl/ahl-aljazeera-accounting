# Plan: the browser-check hang after the rejected save (r2)

Revision after AgentLab Architect NOTES on PR #85 at `8b372a10`. Not an approval. Plan only. No application code in this change. The code pull request waits until Architect and EA have reviewed this revision. Ameer approves the merge.

- **Repo.** `ahl-aljazeera-accounting`, read at `main` = `2d21ef03c8cb128ab347a35022b8505d08a417c3`. This revision sits on `8b372a10`.
- **Gates.** Ameer approves every merge and every behaviour or rules change. All 4 CI checks stay. No spending. `arena` is banned, so the shapes were written by hand, not spawned.
- **محاسب أهل الجزيرة was not asked.** This is the browser harness. It does not change a balance, an advance, a ledger rule, an export, or `firestore.rules`.

## 0. What the next agent is building

A harness invariant in `tests/browser-check.js`, plus the two calls that make `:1589` legal under it. Nothing under `public/` changes, so the service-worker `VERSION` stays.

`setNetwork(offline)` is the only sender of `Network.emulateNetworkConditions`, and it remembers the flag. `go(url, opts)` and `reload(params, opts)` throw `browser-check: navigating while offline; pass {offline:true}` when that flag is set and the caller did not pass `{offline:true}`. They do not clear the flag. The navigations that mean to stay offline pass `{offline:true}`: the reload at `:345`, the `go` calls from `:523` through `:1151`, and the reload at `:700` (the check "a large project pages 50 rows and stays offline"), which was a raw `send('Page.reload')` and now goes through `reload`. `assertDeclared` also throws when `{offline:true}` is passed while the debugger is online. Before `:1589` the script calls `setNetwork(false)`, then `await ev('AJ.flush().then(()=>1)')`, then `go` with no offline option.

Not in this implementation: a longer CDP deadline, a retry of the browser job or of `ready()`, a skipped check, clearing offline inside `go`, a change to `public/sw.js`.

## Problem

CI job "browser checks" sometimes dies with `CdpTimeoutError: browser-check: CDP Runtime.evaluate timed out after 30000ms` (`tests/cdp-session.js` timer at the `Runtime.evaluate` send). The summary line is then `browser checks: missing pass, 0 fail`, because the process throws before it prints `browser checks: N/N passed` and every `check()` that did run passed. Re-runs of the same SHA pass. The 30s deadline landed in PR #83 (`9ba6dfbd`). It is what turns the stall into a failed job. It is not why the stall happens.

The stall is always the same place: the first document navigation after `check('a rejected save still says the person was not saved', ...)`, which is `await go(`${BASE}index.html?role=owner&fresh=rejected#home`)` at `tests/browser-check.js:1589` on this SHA.

## Evidence

### CI logs (proven)

Seven failed jobs. Each one is 211 `PASS` lines, 0 `FAIL` lines, then the timeout. The last pass is always `a rejected save still says the person was not saved`. The clock from that line to `CdpTimeoutError` is 30.910s, 30.912s, 30.913s, or 30.917s.

| SHA        | Run         | Job          | Attempt | Delta   |
| ---------- | ----------- | ------------ | ------- | ------- |
| `298d34ad` | 43827901642 | 133165967824 | 1       | 30.913s |
| `d2dac2ec` | 43851160466 | 133243753949 | 1       | 30.912s |
| `d5cdec44` | 43855735877 | 133259395048 | 1       | 30.912s |
| `e0992beb` | 43858723893 | 133269625757 | 1       | 30.912s |
| `2d21ef03` | 43871065828 | 133312068349 | 1       | 30.913s |
| `ddaaae97` | 43884682133 | 133359496487 | 1       | 30.917s |
| `d88c28e0` | 43888537617 | 133373155733 | 1       | 30.910s |

The sixth row is this pull request, attempt 1 of `ddaaae97`, job `133359496487`, timeout logged at 14:22:25Z. The seventh is the same pull request at `d88c28e0`, run `43888537617`, job `133373155733`: the last PASS was at 14:43:51.20Z and `CdpTimeoutError: browser-check: CDP Runtime.evaluate timed out after 30000ms` (`tests/cdp-session.js:233`) was at 14:44:22.11Z, then `browser checks: missing pass, 0 fail`. The other three checks on that run passed. Lint on that commit was already green. Attempt 2 of `43871065828` (`2d21ef03`) and of `43855735877` (`d5cdec44`) passed. A later run of `298d34ad` (43830436243) passed. The stack is only the timer (`Timeout._onTimeout` in `tests/cdp-session.js`). Node does not keep the async caller, so the stack does not name `go`. The clock does.

That 30.91s is `sleep(900)` plus the 30s deadline plus about 12ms, not a different call. `go` evaluates `performance.timeOrigin`, then sends `Page.navigate`, then `waitReady`. `roleDemo` is true for `role=owner` (`tests/browser-check.js:28-33`), so `waitReady` sleeps 900ms (`:50-52`) and then `ready()` evaluates `document.body.dataset.ready` (`:43`). A `CdpTimeoutError` from that evaluate is rethrown (`:46`). The deadline is `DEFAULT_CDP_TIMEOUT_MS = 30000` (`tests/cdp-session.js:3`). `check()` logs the PASS synchronously, then `go` starts. 900ms + 30000ms = 30.900s. The extra 12ms to 17ms is `performance.timeOrigin` and `Page.navigate` returning before the sleep. A hang on `Page.navigate` itself would name `Page.navigate` and would land near 30.0s. A hang on the `rejectedHome` evaluate after `go` returns would include `sleep(300)` at `:1590` and land near 31.2s. Neither matches. The call that gets no reply is the first `Runtime.evaluate` inside `waitReady`.

### What that call site is doing (proven)

Offline is one continuous period from `:344` to `:1359`. `:1338` sends `offline: true` again while it is already on. `:1359` sends `offline: false` before the `go` at `:1360`. `:1482` starts a second offline period and nothing after it sends `offline: false`. `f718c8d9` (#57) added `:1482` for the offline person save. `baf4f21f` (#72) appended `go(...fresh=rejected...)` at `:1589` and did not restore the network. Leaving the debugger offline across that navigation is a verified harness bug. We fix it whether or not it is what stalls Chrome.

While the first period is on, a reload at `:345` and `go` calls at `:523`, `:847`, `:918`, `:989`, `:1019`, `:1067`, `:1094`, and `:1151` all commit. Three of those are uncached `fresh=` URLs: `:847` `fresh=long`, `:918` `fresh=csv`, `:989` `fresh=viewall`. They do not hang. So "any offline navigation" is not the stall, and "an uncached query cannot load while offline" is not the stall.

The document at `:1589` was opened at `:1422` with `?role=owner`, while the debugger was online. From `:1423` through `:1588` the script strips `?role=` with `history.replaceState(null, '', location.pathname)`, so `demoRole()` is false (`public/session.js:140`) and `savePerson` takes the non-demo branch. `:1566` is the `replaceState` inside the rejected-save evaluate. That block is `savedRefresh`, `savedOffline`, `savedThenThrow`, and `saveFailed`: mocked `ensureFirebase`, clicks on `#save-person`, and `set()` calls the evaluate does not await. The rejected-save evaluate returns after 80ms. On the traced hang it had already returned `{hash:"#person/u-ahmed", msg:"تعذر حفظ الشخص"}`, and the next `performance.timeOrigin` returned in the same millisecond as `Page.navigate`. The main thread was idle at the navigate. The pending non-demo work is still uncontrolled. The tail probes replayed only the last script, not `:1423-1588`.

`fresh=` is only a cache-buster. `public/` does not read it. `public/sw.js` answers a shell GET with `fetch(..., { cache: 'no-cache' })` and, on failure, `caches.match` of that exact URL, search included. A unique query is a cache miss if the network fetch fails. On hung run 12 the static server logged `GET /index.html?role=owner&fresh=rejected HTTP/1.1" 200` at 2026-11-16T13:56:14Z. Offline emulation on the page target did not stop the request. The stall is after that response and before the frame commits.

### Local reproduction (proven)

Machine: Google Chrome `157.0.8103.50`. Node `v26.13.0` for the 30-run loop, matching CI. `google-chrome` on this machine is `/usr/local/bin/google-chrome`, which prepends flags and then execs stable Chrome. The per-run `--user-data-dir=/tmp/aj-chrome-*` still received `DevToolsActivePort`, so each run had its own profile. CI's `google-chrome` is the stock binary.

Full `tests/browser-check.js`, sequential, one Chrome at a time, port 8765, 30 runs:

| Result                                                                               | Count              |
| ------------------------------------------------------------------------------------ | ------------------ |
| `226/226 passed`, exit 0, 67–70s                                                     | 28                 |
| `CdpTimeoutError` on `Runtime.evaluate` after the rejected-save pass, exit 2, 91–92s | 2 (runs 12 and 27) |

Hit rate 2/30. No other failure mode in that loop. A three-Chrome parallel attempt produced `document was not ready` and mixed ports. Those runs are discarded. They are not in the 2/30.

Tail-only replays were 0/38 hangs: 0/8 for load, service worker, `replaceState`, offline, the rejected-save script, then a fresh navigation; 0/30 for offline, navigate, online, navigate, offline, that same script, navigate. Two other probes are not that tail: holding an IndexedDB transaction open still navigated, 4/4; forcing the service-worker target offline returned `chrome-error://chromewebdata/` and the evaluate still answered, 4/4. A fast failure is not this hang.

### CDP trace of a hang (proven, run 27)

Logged from the page target. Times are `Date.now()`.

```text
RES  Runtime.evaluate {"result":{"type":"object","value":{"hash":"#person/u-ahmed","msg":"تعذر حفظ الشخص"}}}
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

### What this rules out (proven)

- The deadline from PR #83. The call is unanswered. Raising 30s would wait longer for the same silence.
- A JavaScript dialog. `Page.javascriptDialogOpening` was subscribed and did not fire. The app has no `beforeunload` handler. `savePerson` does not call `alert`.
- A crashed target or a dropped socket. Those reject as `CdpSocketError`. The socket stayed open until the timer.
- A fast navigation failure. The service-worker-offline probe got an error page and a live evaluate.
- The main thread already being stuck before `Page.navigate`. `performance.timeOrigin` returned in the same millisecond as the navigate send.
- Offline as a sufficient cause. `:847`, `:918`, and `:989` already navigate offline to uncached `fresh=` URLs and commit. Run 12 got HTTP 200, so the bytes left the server. The tail-only runs were 0/38.

### Most likely trigger

The mechanism of the hang is proven. `Page.navigate` returns a `loaderId`, Chrome emits `Network.requestWillBeSent`, the load never finishes, the frame never commits, and the first `ready()` evaluate gets no CDP reply.

What produces that stall is not proven. Offline is the most likely trigger, and it is confounded with the pending non-demo save state at `:1423-1588`. Every hang has the debugger offline, but only because `:1589` always does. #72 brought the navigation and the leftover offline flag in together, so the CI timeline cannot separate them. The tail probes never rebuilt `:1423-1588`.

Two statements, kept apart:

- Leaving offline set at `:1482` is a verified harness bug. The fix removes it regardless.
- That this flag causes the hang is a hypothesis. The 60-run below is the test of that hypothesis. Until those runs are clean, this section does not say "root cause".

## Usage (caller's view)

The caller is the browser job. It still runs `node tests/browser-check.js` once. The 226 `check()` calls stay. The rejected-save check still requires `hash` to start with `#person/` and the message `تعذر حفظ الشخص`. The checks after `:1589` still run. They do not read `navigator.onLine`.

Order immediately after that `check` and before `go`. Online first, then flush, then navigate:

```javascript
await setNetwork(false);
await ev('AJ.flush().then(()=>1)');
await go(`${BASE}index.html?role=owner&fresh=rejected#home`);
```

`setNetwork(false)` is what turns the debugger back online. The `online` listener at `public/render.js:1485` then runs. The page is not in demo mode: `:1566` replaced the URL with `location.pathname`, so `demoRole()` is false and `sessionUser` is set. The listener calls `flushRemote()` and `refreshDirectory('online')`. The app files are shared-global scripts, so the rejected-save `window.ensureFirebase` mock is what `performFlush` calls (`public/firebase-client.js:624`). That mock has no `writeLocal`. The write throws, the id is dropped from the outbox, `queuePendingFinance` puts `p-school` back, and the tail at `firebase-client.js:747-755` calls `flushRemote()` again. The awaits resolve as microtasks, so the loop does not yield a task. Architect measured 3,186 flush rounds in about 3s once the debugger was paused. The page stops answering `Runtime.evaluate`. Without the stubs, going online reproduced that 30s hang 2 of 2 times. With the stubs, 4 of 4 runs were clean. The stubs, not `offline: false` by itself, most likely do the work. How the old offline code at `:1589` enters the same loop is still unproven: `performFlush` returns early while `navigator.onLine === false`. Before `setNetwork(false)` the script replaces `flushRemote` and `refreshDirectory` with no-ops on this page only. The next `go` discards the page. `AJ.flush().then(()=>1)` is the idiom already at `:331`.

The fix has three parts: the `setNetwork` guard, then `offline: false`, the flush, and `go`, and the stubs on the discarded page. A clean 60-run cannot split those parts. That is acceptable for a harness fix. It is not a root-cause claim. The online-only arm below is not a merge gate.

```javascript
let netOffline = false;
const setNetwork = async offline => {
  netOffline = !!offline;
  await send('Network.emulateNetworkConditions', {
    offline: netOffline,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
};
const assertDeclared = opts => {
  if (netOffline && !(opts && opts.offline)) {
    throw new Error('browser-check: navigating while offline; pass {offline:true}');
  }
};
const go = async (url, opts) => {
  assertDeclared(opts);
  /* the rest of today's go */
};
const reload = async (params, opts) => {
  assertDeclared(opts);
  /* the rest of today's reload */
};
```

`go` and `reload` only read `netOffline`. They never change it. Intentional offline navigations pass the flag: `reload({ ignoreCache: false }, { offline: true })` at `:345` and at `:700`, and `{ offline: true }` on the `go` calls at `:523`, `:847`, `:918`, `:989`, `:1019`, `:1067`, `:1094`, and `:1151`. `assertDeclared` throws the other way when `{offline:true}` is passed while `netOffline` is false. `:1589` does not pass it. On today's control flow, after `setNetwork` replaces the raw sends, `:1589` throws on every run until `setNetwork(false)` is added in front of it. After that call, the same `go` proceeds. The throw is not a new `check()`. The pass count stays 226.

`Network.enable` stays a direct `send`. Only `emulateNetworkConditions` moves into `setNetwork`. The first offline period becomes `await send('Network.enable'); await setNetwork(true);`. `:1338` and `:1482` become `setNetwork(true)`. `:1359` becomes `setNetwork(false)`.

## Shape

One owner for the offline flag: `setNetwork`. `go` and `reload` assert the caller's declaration. They are not a second way to change the network.

`waitReady` still sleeps 900ms on a role demo and still uses the 30s deadline. On `CdpTimeoutError` it logs whether `Page.frameNavigated` and `Network.loadingFinished` were seen for that `loaderId`, then rethrows. The `onEvent` hook at `:20` is where those two events are recorded, next to the `frameStartedNavigating` loader list that is already there. `Network.enable` is already on before `:1589` (`:344`), so `loadingFinished` can be observed there. No second navigate, no second evaluate, no retry. The job stays red. A later CI hit then carries the same facts run 27 had to be traced locally to get.

The deterministic red-to-green check is that throw, not a regex of the source. The regex sketched in r1 is weak, and it is not the lock:

- It passes if the calls are commented out (`// AJ.flush()` or `// offline: false` still match).
- It fails a harmless rename to `setNetwork(false)`.
- It does not notice `indexOf` returning −1 when the check name changes. `slice(-1, -1)` is empty, and `assert.match` on an empty slice fails for a different reason, or a later edit can make the slice the whole file.

The source guard lives in `tests/chrome-debug.test.js`, which already reads `tests/browser-check.js` and is already on both `node --test` lists. It requires both indexes (`const setNetwork` and `const assertDeclared`, and the same for `go` / `reload`) to be found and `start < end`, so a renamed `assertDeclared` cannot make the slice run to the end of the file and pass. It then bans `Network.emulateNetworkConditions` outside `setNetwork`, and `Page.navigate` / `Page.reload` outside `go` / `reload`. The behaviour lock is still the throw at `:1589`.

## Synthesis decision

`arena` was not run.

Shape A is the base. `setNetwork` owns the flag. `go` and `reload` throw unless an offline navigation is declared. `:1589` is declared online by `setNetwork(false)`, then the script flushes, then it navigates. The fix bundles those two calls and does not call the result a proven root cause.

Shape B, rejected: change `public/sw.js` so a `fetch` that does not settle falls back to `caches.match` with `ignoreSearch`, and bump `VERSION`. The server already returned 200 on a hung run. A phone-facing cache change is a behaviour change, and the trace does not show a phone hitting it.

Also rejected: clearing offline inside `go` for every URL. That would break the checks that navigate while offline on purpose. Also rejected: a retry in `ready()` or `sameDocument()`. Also rejected: raising `DEFAULT_CDP_TIMEOUT_MS`. Also rejected: the r1 regex as the proof that the hang is fixed.

## Tests that prove it

1. Behaviour, every run, before and after. With `setNetwork`, the throw, and `{offline:true}` on `:345`, `:700`, and `:523-1151`, and without `setNetwork(false)` before `:1589`, one full `node tests/browser-check.js` throws `browser-check: navigating while offline; pass {offline:true}` at `:1589`. The checks before that line still pass. Add `setNetwork(false)`, the flush, and the plain `go`. The same script then passes `:1589` and prints `226/226 passed`. The code pull request records both runs. The landing commit is the green one. This is the deterministic failure. It does not depend on Chrome stalling.
2. Source guard in `tests/chrome-debug.test.js`, as sketched. It fails if a second `Network.emulateNetworkConditions` appears outside `setNetwork`. The ledger job already runs that file. No new list entry. No fifth job. The `pass -lt 34` floor still holds.
3. At least 60 sequential full-suite runs after the fix, one Chrome, zero hangs, each printing `226/226 passed`. Record the Chrome version and the Node version next to the count. This is the test of the hypothesis, not of the throw. The throw is red or green on every run. These 60 ask whether the stall is gone.

Why 60, not 30. The baseline is 2 hangs in 30 runs, 6.7%. If nothing changed, P(0/30) = (28/30)^30 = 12.6%. A clean 30 happens about one time in eight by chance. Fisher one-sided for 2/30 against 0/30 is p = 0.25. That does not separate a real fix from luck. P(0/60) at the same 6.7% is (28/30)^60 = 1.6%. The code pull request's claim, if those 60 are clean, is that the change removes the trigger at that bar. It is still not a proof that offline was the only cause, because the fix bundles two changes.

4. After merge, watch the next 30 browser-check attempts on `main`. At about a 10% hang rate, P(0/30) is about 4% (0.9^30). Any `:1589` hang in that window reopens this plan and reopens the backlog line below. Zero hangs in that window is the CI half of the same watch. It is not a retry loop inside the job.
5. Optional, time-boxed to about 30 minutes, not a merge gate. Run the full prefix once, then loop the whole non-demo block `:1422-1589` in the same Chrome. The tail probes only replayed the last script, which is why they were 0/38. If that loop's hit rate is well above 10%, it becomes the before/after instrument and the 60-run can shrink to whatever that rate supports. Optionally attach the service-worker target during one of those loops and log whether `respondWith` settled and whether `cache.put` completed. Do not block the landing on that log.

## Diagnostic

When `waitReady`'s `ready()` catches `CdpTimeoutError`, log one line before rethrowing:

`browser-check: navigation <loaderId> frameNavigated=<yes|no|n/a> loadingFinished=<yes|no|n/a>`

`loadingFinished` is `n/a` until `Network.enable` (`:344`). Both fields are `n/a` when the loader id is the `'reload'` placeholder, because that id is not a real loader and printing `no` would be wrong.

Record those two events in the existing `onEvent` at `:20`, keyed by `loaderId`. Then rethrow the same `CdpTimeoutError`. Do not navigate again. Do not evaluate again. Do not treat a late `frameNavigated` as success. The 30s deadline stays.

## Backlog

`BACKLOG-accounting.md` line 5 is the per-poll timeout and retry in `ready()` / `sameDocument()`, opened for run `43827901642` (the first row of the table above). The file is not in this tree at `8b372a10`. This plan only records the decision. The code pull request edits that backlog line: mark it superseded by #85. A shorter per-poll timeout with a retry would keep timing out until `document was not ready`, or it would hide a late commit. On the traced hang nothing arrives for 30s. Reopen the line only if the 60-run or the 30-attempt CI watch shows a `:1589`-style hang after the fix. Otherwise the line points at the diagnostic above.

## pstack inventory (code pull request)

`docs/PSTACK_INVENTORY.md` updates only the rows this code change touches. Statuses stay as they are. The file does not say the app is pstack-compliant. `setup-pstack` stays «ناقصة». `arena` stays banned. The evidence to append, with no compliance claim:

| Row                                          | What the code pull request adds                                                                                                                                                                                                                                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `principle-fix-root-causes`                  | The leftover offline flag is a real harness bug. The leading mechanism is the online-listener re-flush livelock against an incomplete mock. The stubs keep that loop from firing. A longer CDP deadline and a poll retry are not the fix. How the old offline navigation enters the loop is unproven. |
| `principle-prove-it-works`                   | One full run throws `navigating while offline` at `:1589` before `setNetwork(false)`. After it, the run prints `226/226 passed`. Then 60 sequential runs, 0 hangs.                                                                                                                                    |
| `principle-test-behavior-not-implementation` | The throw is the behaviour: navigating while `netOffline` is set, without `{offline:true}`, fails the process. The source guard is not that test.                                                                                                                                                     |
| `principle-explain-the-number`               | 60 runs because P(0/30) at 2/30 is 12.6% and Fisher p for 0/30 against 2/30 is 0.25. P(0/60) at 6.7% is 1.6%. The CI watch is 30 attempts because P(0/30) at 10% is about 4%. The 30.91s gap is 900ms + 30000ms + about 12ms.                                                                         |
| `principle-encode-lessons-in-structure`      | `Network.emulateNetworkConditions` lives only in `setNetwork`. `go` and `reload` refuse an undeclared offline navigation, so the next block appended after an offline section cannot repeat #72.                                                                                                      |

## How the 4 checks stay intact

- **lint / format / types.** The new helper matches the `send` already in the file. The source guard matches the existing source-slice tests in `tests/chrome-debug.test.js`. No `public/` edit, so `tsc` inputs do not change and `public/sw.js` `VERSION` does not bump.
- **ledger tests.** Same `node --test` file list. One more test inside a file already on the list.
- **browser checks.** Same 226 checks, same 30s deadline, one run per job, no retry. Before `setNetwork(false)`, the process throws at `:1589` and the job is red on every run. After it, those 226 checks still run, including the rejected-save assertion and the rejected screen.
- **emulator rules and sync.** Untouched.

## Risks

- Going online on this page starts `flushRemote`. The rejected-save mock has no `writeLocal`, so the tail at `firebase-client.js:747-755` calls `flushRemote` again as microtasks and the page stops answering. The stubs stop that loop on the discarded page. How the old offline navigation entered it is unproven. Do not wrap the flush in a shorter timeout.
- A clean 60-run does not attribute the result to offline rather than the flush. Say that in the code pull request. Run the online-only arm (60 runs, flush omitted) only if a later reader needs the split. Do not claim the split from the bundled 60.
- If any of the 60 hangs, or any of the next 30 CI attempts hangs at `:1589`, stop. Do not raise the timeout and do not retry the job. Bring the new diagnostic line. Reopen `BACKLOG-accounting.md` line 5. A service-worker change would be a new plan, and it would need Ameer, because it touches `public/`.
- The local `google-chrome` wrapper is not what CI execs. Record the Chrome and Node versions beside the 60-run count.

## Tradeoffs accepted

- We accept a bundled fix, in exchange for not calling offline the proven cause.
- We accept 60 full runs of wall time, in exchange for a bar where a clean result is unlikely at the observed 2/30 rate.
- We accept that the deterministic red run throws before the rejected-screen checks execute. That run is evidence, not the landing commit. The landing commit still runs all 226 checks.
- We accept a log line on the timeout path. It does not change the verdict.

## Next implementation step

In `tests/browser-check.js`, add `setNetwork`, make `go` and `reload` throw when `netOffline` is set without `{offline:true}`, mark `:345` and `:523-1151`, and run once so `:1589` throws on every such run. Then add `setNetwork(false)`, `await ev('AJ.flush().then(()=>1)')`, and the plain `go`, and run once so the script prints `226/226 passed`.
