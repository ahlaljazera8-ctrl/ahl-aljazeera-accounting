I had the pstack models block. Budget large, xhigh. The same block is on `origin/main` in `AGENTS.md` and in `.cursor/rules/pstack-models.mdc` after #63. This plan does not edit either copy. No subagent was started. Arena stays banned.

# Plan: formal verification skill, r3.1

PLAN ONLY. Nothing here is committed, pushed, or opened as a pull request. Code waits until Architect and EA accept this r3 text.

Checked `origin/main` at `272e2074dd25df14ca0cf9d3f83582fe6a733426`, subject "Keep a signed-out account closed until Auth sign-out finishes (#64)". The parent is `3c00811`, "docs(pstack): record the large model budget in the repo (#63)". r2 cited `b4fcd213bcf0b3f9579eff37d0e69388933e3ac6`. Every line below was read on `272e2074`. r3.1 rebases onto current main `8dfe8c969a7fd230c40b38f43c0218fe5577ded9` ("Add a local skill that drives one ledger entry on the emulators (#61)"). #61 has landed. GitHub compare `272e2074...8dfe8c96` (1 commit ahead) lists 13 files, none of them `public/sync.js`, `firestore.rules`, or `docs/PSTACK_INVENTORY.md`, so every line cited below is unchanged on `8dfe8c96`. Implement on `8dfe8c96`.

Ameer confirmed via EA, recorded in r2: «التحقق الرسمي: هسه».

## In my words

Ameer asked for the formal verification skill now. The ledger tests check lists someone already wrote. A delete that sends child documents before the project document, or that drops a later slice of terms or of the other documents, can still get past those tests. This skill loads the real delete functions, runs them on a finite set of inputs, and fails when the order or the partition breaks. It stays separate from the browser skill.

## What r3 changes

Architect's notes on r2, applied here.

1. The id bound in r2 is not a finite check. One id of length 1 to 4 over the 64-character alphabet is 64 + 4,096 + 262,144 + 16,777,216 = 17,043,520 strings, before a list or a collection is chosen. r3 names the generator, uses `projectDeleteDocs` outputs, and runs 8,196 cases.
2. `projectDeleteBatches` chunks terms by 6 at line 511 and the rest by 400 at line 512. A list of 8 documents never reaches 400, and the pool below never reaches 6. r3 adds the partition property, a 7-term fixture, a 401-rest fixture, and a second scratch mutation named drop-after-first-slice. The literals 6 and 400 stay in `public/sync.js`. They are not parameters.
3. The `create-formal-verification-skill` cell covers delete order only and points at `tests/rules-constant.test.js` for the amount ceiling. `maintain-formal-verification-skill` stays «ناقصة». The header was counted from the table on this SHA. #63 has landed and did not flip a status.
4. The skill frontmatter says when to run it. The skill records both mutation failures and both reverts.

Shape B stays. Shape A, a TLA+ model read with `/statechart`, stays declined. It would need a jar and a network fetch, and it would not run on `public/sync.js`.

## Playbook

Read this session from `/home/ubuntu/.cursor/plugins/cache/cursor-public/9717366/236e5481d05cbadc315b374a5de54971858c27bb/skills/create-formal-verification-skill/SKILL.md`. The file is on disk. It is not in the ledger repo.

- Lines 11-15. The target is delete order. A break denies the delete or leaves money documents behind. `tests/project-delete.test.js` checks one 7-term shape at lines 48-61. It does not check every list in the pool, and it does not check 401 rest documents.
- Lines 17-19. The question is whether these two functions behave for every input in a bound. No verifier for this JavaScript is already installed. The check `require`s the real functions and generates the inputs. TLA+ answers a different question and adds a cost Ameer has not approved.
- Lines 21-29. The check calls `projectDeleteDocs` and `projectDeleteBatches`. Both scratch edits must fail. The properties are not weakened to pass. The bound is the 8,196 cases below. The properties are readable without the script. The command is `node scripts/formal-delete-order.js`. The skill records the files and `272e2074dd25df14ca0cf9d3f83582fe6a733426`.
- Lines 31-35. The project skill has frontmatter. The next agent can see when a change touches the covered code, run the one command, tell a bug from a bad counterexample, and move the sync commit only after the script still describes the code. This check is not TLA+. The skill copies no `/statechart` command.
- Lines 37-39. The later implementation runs the skill on two scratch breaks in `public/sync.js`, then reverts each one. A skill that was never run is a draft.
- Lines 41-43. The hand-off is the pull request body below. It points at `/maintain-formal-verification-skill`.

`principle-redesign-from-first-principles` applies because r3 takes Architect's new requirements as the shape of the generator. The finite pool, the partition, and both boundaries are the check. They are not extra asserts glued onto the 17,043,520-string bound.

Architect. Arena is banned in `AGENTS.md`. The two shapes were compared in r2, in this plan, with no extra model runs. r3 does not open a third shape.

## Lines re-read on 272e2074

| What r2 cited                          | r2 lines                               | Lines on 272e2074                                                                                                                                        |
| -------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delete comment                         | 472-474                                | 472-474, unchanged                                                                                                                                       |
| `projectDeleteDocs`                    | 480-502                                | 480-501. The `return` is line 500. The closing brace is line 501                                                                                         |
| `projectDeleteBatches`                 | 504-520                                | 504-514. Terms step 6 is line 511. Rest step 400 is line 512. `slice(0, 1)` on project rows is line 506                                                  |
| `projectGone`                          | 55-60                                  | Comment lines 55-57. Function lines 58-60. The body is `idOk(pid) && !existsAfter(projectPath(pid))`                                                     |
| Ledger `allow delete`                  | 157                                    | 157, unchanged                                                                                                                                           |
| Finance `allow delete`                 | 226                                    | 226, unchanged                                                                                                                                           |
| Subcontracts `allow delete`            | 247                                    | 247, unchanged                                                                                                                                           |
| Amendments `allow delete`              | 295                                    | 295, unchanged                                                                                                                                           |
| Terms `allow delete`                   | not cited                              | 267-271. Terms have no `projectId`. The rule reads the subcontract, then calls `projectGone`, or allows the delete when that subcontract is already gone |
| `MAX_AMOUNT_IQD` in rules              | 18                                     | 18, unchanged. `idOk` is line 19                                                                                                                         |
| `MAX_AMOUNT_IQD` in `public/ledger.js` | 118                                    | 118, unchanged                                                                                                                                           |
| `totals`                               | 27-42                                  | 27-40. Line 42 is the next comment                                                                                                                       |
| `foremanBalance`                       | 511-537                                | 511-531                                                                                                                                                  |
| `subcontractBalance`                   | 323                                    | 323, unchanged                                                                                                                                           |
| `flushOutbox`                          | 590-640                                | 590-640, unchanged. `seen` is line 600. The skip is line 602. `seen.add` is line 603                                                                     |
| Resend test                            | `tests/emulator/sync.test.js` line 165 | 165, unchanged                                                                                                                                           |
| `flushRemote`                          | 437                                    | 456. `flushing = run` is line 468                                                                                                                        |
| `performFlush`                         | 524                                    | 543                                                                                                                                                      |
| `holdSession`                          | 154-166                                | 154-164. It still increments `sessionEpoch` and calls `disposeFirebase(true)` only when the message is `SESSION_DEAD_MSG`                                |
| `closeSession`                         | 276-290                                | 308-325. It increments `sessionEpoch` at line 316 and calls `disposeFirebase(true)` at line 320                                                          |
| `ID_RE`                                | not cited                              | `public/sync.js` line 89, `/^[A-Za-z0-9_-]{1,64}$/`                                                                                                      |
| The words "Option C"                   | absent                                 | Still absent on this SHA                                                                                                                                 |
| `signout-pending`                      | absent                                 | Present. `public/session.js` line 177 sets `SIGNOUT_PENDING` to `aj-signout-pending`. `tests/signout-pending.test.js` exists. #64 added them             |

`require('../public/sync.js')` works. Line 4 assigns `module.exports` when Node loads the file. `tests/project-delete.test.js` already does this require.

## Targets

### In this skill: delete order

`projectDeleteDocs` at lines 480-501 builds the list. A project id that fails `ID_RE` returns an empty list at line 482. A valid id starts the list with `{ collection: 'projects', id: projectKey }` at line 485. `add` at lines 490-494 skips an id that fails `ID_RE` and skips a `collection` plus `id` already in the list. The order of a valid list is the project, then `ledgerEntries`, then `subcontracts`, then `subcontractAmendments`, then `subcontractTerms`, then `projectFinance` when `found.finance` is truthy. The finance id is the project id, at line 499.

`projectDeleteBatches` at lines 504-514 takes that list. Line 506 keeps the first row whose collection is `projects` and drops any later project row. Line 507 collects `subcontractTerms`. Line 508 collects every other non-null row. Line 510 pushes the project row as its own batch. Line 511 pushes terms in slices of 6. Line 512 pushes the rest in slices of 400. Null rows and a second project row never come back.

The comment at lines 472-474 says later batches run only after the project document is gone, because the rules require it, and that terms batches stay small because each terms delete may read its subcontract.

`projectGone` at lines 58-60 allows a child delete only when that project document is gone by the end of the request. `!existsAfter` sees the rest of the same batch. Ledger deletes use it at line 157. Finance at line 226. Subcontracts at line 247. Amendments at line 295. Terms at lines 267-271 use it when the subcontract document is still there.

Harm. A batch that sends children while the project document still exists is denied, or it leaves money documents behind. A later slice that is never sent leaves those documents in Firestore.

Properties, two sentences.

For every non-empty list `projectDeleteDocs` returns, the first batch is that project document alone, and no later batch contains a document whose collection is `projects`.

Every document in that list appears in exactly one batch. Nothing in the list is missing, and nothing is repeated.

An empty list is the remaining case. `projectDeleteDocs` returns `[]` when the project id fails `ID_RE`, and `projectDeleteBatches([])` returns `[]`. The script accepts that pair only for the bad-project case below.

`projectFinance` is not a project document. Its collection is `projectFinance`. It belongs in a later batch. The order check looks for the collection `projects`.

### Generator

The inputs are `projectDeleteDocs` outputs. The script builds `DeleteFound` values, calls `projectDeleteDocs`, then calls `projectDeleteBatches` on that return value. It does not invent arbitrary lists.

An arbitrary list is outside this check. Line 506 drops every project row after the first, and lines 506-508 drop null rows. `projectDeleteDocs` never emits those rows. A list with two project documents would fail "nothing lost" on the current function, and the product does not build that list. Hand-built lists from a future caller are named under "What this check does not cover".

Pool, exact strings. All of them match `ID_RE`.

- Project id: `p`. Always the `projectId` argument for the pool.
- `entryIds`: subsets of `e-a`, `e-b`, `e-c`.
- `subcontractIds`: subsets of `s-a`, `s-b`, `s-c`.
- `amendmentIds`: subsets of `m-a`, `m-b`, `m-c`.
- `termIds`: subsets of `t-a`, `t-b`, `t-c`.
- `finance`: `false`, then `true`.

Those are the six collections. Projects contribute the one id `p`. The four child lists contribute three ids each. Finance is present or absent, and its id is `p`, which is what line 499 does.

Subsets keep pool order. The generator does not permute. `subsets(['e-a', 'e-b', 'e-c'])` starts from `[[]]` and, for each id, appends that id to a copy of every subset already produced. The first subset is `[]`. Then `['e-a']`, `['e-b']`, `['e-a', 'e-b']`, `['e-c']`, `['e-a', 'e-c']`, `['e-b', 'e-c']`, `['e-a', 'e-b', 'e-c']`. The same order is used for the other three lists. There are 8 subsets of a 3-element list.

The pool loop is nested in this order: `entryIds`, `subcontractIds`, `amendmentIds`, `termIds`, `finance`.

Count. 8 × 8 × 8 × 8 × 2 = 8,192.

The fullest pool case has 3 terms and 10 other child documents: 3 entries, 3 subcontracts, 3 amendments, and 1 finance. 3 is below the 6 step at line 511. 10 is below the 400 step at line 512. The pool cannot catch a mutation that drops only the second slice. The two fixtures do that.

Four named cases sit outside the product, and the script always runs them.

- `bad-project`. `projectDeleteDocs('p p', {})`. The space fails `ID_RE`. Expect `docs` to be `[]` and `batches` to be `[]`.
- `duplicate-entry`. `projectDeleteDocs('p', { entryIds: ['e-a', 'e-a'] })`. Line 492 drops the second `e-a`. Expect two documents, the project and one `ledgerEntries` row, and the partition to hold.
- `seven-terms`. `projectDeleteDocs('p', { termIds: ['t0', 't1', 't2', 't3', 't4', 't5', 't6'] })`. Expect batch lengths 1, 6, 1. Batch 0 is the project alone. Batch 1 is `t0` through `t5`, collection `subcontractTerms`. Batch 2 is `t6` alone. Concatenation equals `docs`. This is the 6 boundary. 7 = 6 + 1.
- `rest-401`. `projectDeleteDocs('p', { entryIds: ['e0', 'e1', ... 'e400'] })`. Indices 0 through 400 inclusive, 401 ids, no zero-padding. Expect `docs` length 402. Expect batch lengths 1, 400, 1. Batch 0 is the project alone. Batch 1 is `e0` through `e399`, collection `ledgerEntries`. Batch 2 is `e400` alone. Concatenation equals `docs`. This is the 400 boundary. 401 = 400 + 1.

Total. 8,192 + 4 = 8,196. The script counts the cases it actually ran and fails if that count is not 8,196. The success line is `ok 8196`.

On this SHA the real functions already return those fixture shapes. One local call returned lengths 1, 6, 1 for seven terms and 1, 400, 1 for 401 entries. `docs` lengths were 8 and 402. The duplicate list had length 2. The bad project id returned an empty batch list.

### What the script checks on each case

`docs` is the array `projectDeleteDocs` returned. `batches` is the array `projectDeleteBatches(docs)` returned.

For `bad-project`, both arrays are empty.

For every other case:

- `docs[0]` is `{ collection: 'projects', id: 'p' }`.
- `batches[0]` deep-equals `[docs[0]]`.
- No later batch contains a row whose collection is `projects`.
- The partition counts how many times each document appears. `partitionHolds` at `scripts/formal-delete-order.js` lines 157-165 sets `left` to `countsOf(docs)` and `right` to `countsOf(flatten(batches))`, and passes only when `left.size` equals `right.size` and `right.get(key)` equals `count` for every key. Nothing in the list is missing, and nothing is repeated.
- For `seven-terms` and `rest-401`, the batch lengths are the ones named above. A change of the literal 6 or the literal 400 fails here even when the concatenation still matches.

The expected lengths are written in the script. They are not arguments to `projectDeleteBatches`. The function signature stays `(docs)`.

### Out of this skill

Ledger totals. `totals` at `public/ledger.js` lines 27-40 sets profit to received minus spent. `foremanBalance` at lines 511-531 derives holding and what is owed. `subcontractBalance` starts at line 323. `tests/ledger.test.js` already covers that arithmetic. A second checker would repeat it.

Outbox idempotency. `flushOutbox` at `public/sync.js` lines 590-640 skips an id already in `seen` at line 602. `tests/emulator/sync.test.js` line 165 resends one id and expects one server row. The concurrent case is the `flushing` lock in `public/firebase-client.js`: `flushRemote` at line 456, `flushing = run` at line 468, `performFlush` at line 543. That race is a close second target. It is not this skill. Suggest it only after this delete-order check is in the repo. It would be a TLA+ model, which is the cost declined above.

Session and sign-out. The string "Option C" is still absent. `signout-pending` is in the repo now, from #64. `holdSession` at lines 154-164 and `closeSession` at lines 308-325 still bump `sessionEpoch` and sign out through `disposeFirebase(true)`. A model of that timing is the declined TLA+ case. This plan does not edit `public/session.js`, `public/firebase-client.js`, `public/app.js`, `public/sw.js`, or `tests/signout-pending.test.js`.

Rules as a whole. The skill cites `projectGone` and the `allow delete` lines as the reason the batch order matters. It does not model the rules language, and it does not replace `tests/emulator/rules.test.js`.

Amount ceiling. `MAX_AMOUNT_IQD` is `10000000000` at `public/ledger.js` line 118 and `firestore.rules` line 18. `tests/rules-constant.test.js` already ties them together. The inventory cell points there. This skill does not check the ceiling.

Second project rows, null rows, and hand-built lists that did not come from `projectDeleteDocs`. Line 506 drops the extra project rows. The generator never builds them. A later caller that passes its own list is uncovered until `/maintain-formal-verification-skill` extends the check.

Permutations of ids inside one bucket. The functions keep the order they are given. The partition and the project-first batch do not depend on swapping `e-a` with `e-b`. The generator does not permute.

## Tool, cost, runtime

Command: `node scripts/formal-delete-order.js`.

It `require`s `public/sync.js` and calls `Sync.projectDeleteDocs` and `Sync.projectDeleteBatches`. Nothing to install. No npm package, no TLC jar, no Java fetch. Install size is 0 bytes beyond the script and the skill file. Install time is 0.

Expected cost of the change: zero. No new CI job, no edit to `.github/workflows/ci.yml`, no edit to `package.json`. The workflow has no path filter, so the four jobs still run: `quality` at line 18, `ledger` at line 47, `browser` at line 78, `emulator` at line 123. They do not gain a step. The ledger job at line 74 requires at least 34 passes and does not invoke this script. Putting the script on that job would be a CI edit and a floor change. Do not do it until Ameer says so. The same flag covers TLC later.

Paid service or model runs for the check: none. The mutations are local Node.

Expected runtime: under one second. Ballpark from one local run on this VM, against `public/sync.js` at this SHA. The timed region was the 8,192 pool calls plus the two fixtures. It took 18 ms. The process exited 0. The returned batch lengths were 1, 6, 1 and 1, 400, 1. Benchmark checklist questions 4 and 7 held for that one run: a wrong first collection would have thrown, and the printed lengths are the arrays the functions returned. Load average was not recorded. This is not a CI time, and it is not a claim about what limits the 18 ms. The decision it supports is that the check does not need a CI job to stay cheap.

`tsconfig.json` includes `scripts/**/*.js` with `checkJs` true. The script must pass `npm run typecheck` with no tsconfig edit. `eslint.config.js` lints `scripts/**/*.js` as CommonJS. The script must pass `npm run lint` and `npm run format:check` with no config edit. Follow the require style in `tests/project-delete.test.js`.

## Sketch

`scripts/formal-delete-order.js`. No new type in `types/checkjs.d.ts`.

```javascript
// DeleteFound is the object projectDeleteDocs already takes:
// { entryIds?, subcontractIds?, amendmentIds?, termIds?, finance? }
// DeleteDoc is { collection: string, id: string }
// DeleteDoc[][] is what projectDeleteBatches returns.

function subsets(ids) {
  /* 8 lists, pool order, [] first */
}

function runPool() {
  /* 8192 calls, nested in the order above */
}

function runBadProject() {}
function runDuplicateEntry() {}
function runSevenTerms() {}
function runRest401() {}

function check(label, docs, batches) {
  /* order, partition, and for the two fixtures the lengths */
}

function main() {
  // run all 8196
  // if the ran count is not 8196, exit 1
  // if any case failed: print the first pool failure, the pool failure count,
  // and every failed named case; exit 1
  // print "ok 8196"; exit 0
}
```

A pool failure prints the `projectId`, the `found` object, `docs`, `batches`, and the reason `order` or `partition`. A named-case failure prints the label, the batch lengths, and the first missing or extra document. The script does not print all 8,192 failures.

The first children-first failure in the pool is predictable. The first subset of every list is `[]`, and `finance` runs `false` then `true`. The all-empty `found` has only the project, so a children-first edit still passes it. The next case is `finance: true` and empty id lists. Its first batch becomes `[{ collection: 'projectFinance', id: 'p' }]`.

## Skill file

`.cursor/skills/formal-delete-order/SKILL.md`

Frontmatter, this text:

```yaml
---
name: formal-delete-order
description: 'Run this on any change to the delete helpers in public/sync.js (projectDeleteDocs, projectDeleteBatches, or ID_RE) or to the delete rules in firestore.rules (projectGone and the allow delete lines that use it, including subcontract terms). Command: node scripts/formal-delete-order.js. This check is run manually; it is not in CI. Wiring it into ci.yml is held for Ameer.'
disable-model-invocation: true
---
```

The body tells the next agent:

- Run `node scripts/formal-delete-order.js` from the repo root.
- A non-zero exit is a bug in the covered functions, unless a step in the printed case cannot happen in `public/sync.js`. Then the script is wrong. Do not weaken the property to make it pass.
- Covered code, by name, last confirmed at `272e2074dd25df14ca0cf9d3f83582fe6a733426`: `projectDeleteDocs`, `projectDeleteBatches`, and `ID_RE` in `public/sync.js`. `projectGone` and the child `allow delete` lines in `firestore.rules`, including terms at lines 267-271 on that SHA. Line numbers move. Find the functions by name.
- Move the sync commit only after a fresh run still describes the code. The product files at the landing commit match this SHA. `git diff 272e2074dd25df14ca0cf9d3f83582fe6a733426 -- public/sync.js firestore.rules` is empty on the pull request. The sync commit in the skill is that SHA for those files.
- Both mutation transcripts and both reverts, pasted from the runs below.
- What the check does not cover, copied from the section above.
- Point at `/maintain-formal-verification-skill`. Copy no `/statechart` command.

## Mutations

The playbook requires a scratch break in the real code, then a revert. Two breaks. Both are reverted before the commit. `git diff -- public/sync.js` is empty. No file under `public/` is in the diff.

The script runs every case on each of these runs, so a failure in the pool does not hide a fixture failure.

1. Children first. In `projectDeleteBatches`, push the terms slices and the rest slices, then push the project batch. Leave the literals 6 and 400 in the loops. Do not add a parameter. Run the script. It must exit 1. The pool failure count is greater than 0. The first printed pool case is `projectId` `p` with `finance: true` and empty id lists, and batch 0 is the finance document. Save stdout.
2. Revert that edit. Run the script. It must exit 0 and print `ok 8196`. Save stdout.
3. Drop after first slice. Replace the two loops with one push each: if `terms.length` is non-zero, push `terms.slice(0, 6)` once. If `rest.length` is non-zero, push `rest.slice(0, 400)` once. The project batch stays first. The literals stay written in the function. They are not parameters. The 8,192 pool cases still pass, because none of them has a second slice. Run the script. It must exit 1. The pool failure count is 0. `seven-terms` fails because `t6` is missing. `rest-401` fails because `e400` is missing. Save stdout.
4. Revert that edit. Run the script. It must exit 0 and print `ok 8196`. Save stdout.

Paste all four outputs into the skill under a Mutations heading, with the sync SHA. A script that only reads the source text, and has never exited 1, does not count.

Order for the later implementation. Write the script and see `ok 8196` on the untouched tree. Then mutation 1, revert, mutation 3, revert. Then write the transcripts into the skill. Then edit the inventory and recount. Then `npm run lint`, `npm run format:check`, `npm run typecheck`, and `npm test`. Run the formal script again after the reverts. `npm test` does not include it, because `package.json` is not edited.

## Inventory

Counted on `272e2074` from the status column of the table, ignoring the legend bullets. 32 «مطبّقة», 41 «ناقصة», 8 «لا تنطبق», 81 rows. 32 + 41 + 8 + 0 = 81. Header line 3 matches that count. #63 rewrote the `setup-pstack` evidence and left the status «ناقصة», so the header did not move.

`create-formal-verification-skill` flips to «مطبّقة» only when the skill file, the script, the passing run, and both recorded mutation failures with their reverts are in the same pull request. The cell covers delete order only. It cites `.cursor/skills/formal-delete-order/SKILL.md` and `scripts/formal-delete-order.js`. It does not cite a home directory. For the amount ceiling it points at `tests/rules-constant.test.js`, which ties `MAX_AMOUNT_IQD` in `public/ledger.js` to `firestore.rules`. The cell does not say this skill checks the ceiling.

Suggested cell text, status «مطبّقة»:

`.cursor/skills/formal-delete-order/SKILL.md` and `scripts/formal-delete-order.js` check delete order only. The project document is alone in the first batch, and every document `projectDeleteDocs` returns appears in exactly one batch. The skill records both scratch mutations and both reverts, confirmed at `272e2074dd25df14ca0cf9d3f83582fe6a733426`. The amount ceiling stays with `tests/rules-constant.test.js`. The check is run manually and is not in CI; wiring it into `ci.yml` is held for Ameer.

Whichever of this PR and the 37-triggers PR lands second recounts the header from the table. Recount the status column after that one flip. If the table is still the one counted here, the header becomes 33 «مطبّقة», 40 «ناقصة», 8 «لا تنطبق», 0. 33 + 40 + 8 + 0 = 81. Count again. Do not only edit the header. If `origin/main` has moved before implementation, count the table on that SHA and do not reuse 33/40/8/0 from this paragraph.

`maintain-formal-verification-skill` stays «ناقصة». Do not edit that row. Its current next step is still right: after this skill exists, the next pull request that changes `flushOutbox` or `projectDeleteBatches` updates the check in the same change.

`create-verification-skill` stays as it is. Do not edit that row. This plan does not create or edit any file #61 added.

`setup-pstack` stays as #63 left it. Do not edit that row.

## Files touched

The later change adds or edits only:

- `.cursor/skills/formal-delete-order/SKILL.md`, new
- `scripts/formal-delete-order.js`, new
- `docs/PSTACK_INVENTORY.md`, the header line and the `create-formal-verification-skill` row
- `docs/plans/formal-verification-skill.md`, this sketch

The scratch edits to `public/sync.js` are reverted before the commit.

Overlap.

- #64 owns `public/app.js`, `public/session.js`, `public/firebase-client.js`, `public/sw.js`, `public/render.js`, `tests/signout-pending.test.js`, `tests/firebase-load.test.js`, `tests/shell-cache.test.js`, `tests/webkit-upgrade.test.js`, `types/checkjs.d.ts`, `package.json`, `.github/workflows/ci.yml`, and `eslint.config.js`. This plan reads `public/session.js` and `public/firebase-client.js` to place the sign-out code outside the skill. It edits none of those paths.
- #61 has landed on `8dfe8c96`. This plan does not create or edit any of its files (`.cursor/skills/verify-ahl-aljazeera-accounting/`, `scripts/verify-aj.js`, `scripts/verify-aj.test.js`, `docs/plans/verification-skill.md`, `.gitignore`). It does not edit `package.json` or `ci.yml`.
- #63 owns `.cursor/rules/pstack-models.mdc` and the `setup-pstack` row. Both have landed. Do not edit them. The shared file is `docs/PSTACK_INVENTORY.md`, on a different row. Recount the header from the table so a stale 32/41/8/0 is not written back over a later count.

## Accounting

No. This check does not change a balance, an advance, a stored total, an export, or `firestore.rules`. It restates the delete order already in `projectDeleteBatches` and the `projectGone` rule. Profit, foreman holding, and the amount ceiling stay on their current functions. No opinion is asked of محاسب أهل الجزيرة, because no new accounting rule is proposed.

## What this pull request must not include

No file under `public/`. No service worker bump. No rules change. No `package.json` or `ci.yml` edit. No `.cursor/rules/pstack-models.mdc`. No edit to `AGENTS.md`. No change to the chunk-size literals except the reverted scratch edits. No second project-document behavior change. Findings in the current functions stay findings. Do not change product code to make the check pass.

## Pull request body

Use this after Architect and EA accept r3. Until then, do not open the pull request. The heading `## Plan (sketch, reviewed by Architect)` is the template heading. The sentence under it names the acceptance when they accept. `## Awaiting Ameer` stays until Ameer says to merge.

```
## Why

Ameer asked for the formal verification skill now. The delete tests check lists someone already wrote. A delete that sends children before the project document, or that drops a later slice, can still get past them. This adds one Node command that runs the real delete functions on 8196 finite cases and fails when that order or that partition breaks.

## Plan (sketch, reviewed by Architect)

The sketch is docs/plans/formal-verification-skill.md, r3.1, checked against origin/main 272e2074dd25df14ca0cf9d3f83582fe6a733426 and rebased onto 8dfe8c969a7fd230c40b38f43c0218fe5577ded9 (#61 landed; public/sync.js and firestore.rules unchanged). The check is run manually and is not in CI; wiring it into ci.yml is held for Ameer. Architect's notes on r2 are applied there: a finite generator of 8192 projectDeleteDocs outputs plus 4 named cases, the partition property, the 7-term and 401-rest fixtures, and the drop-after-first-slice mutation. Arena was not run. It is banned. Shape B stays. TLA+ stays out.

## What changed

- .cursor/skills/formal-delete-order/SKILL.md tells the next agent when to run the check, how to read a failure, and records both scratch mutations and both reverts.
- scripts/formal-delete-order.js require()s public/sync.js and checks projectDeleteDocs and projectDeleteBatches on 8196 cases.
- docs/PSTACK_INVENTORY.md marks create-formal-verification-skill applied, for delete order only, and points at tests/rules-constant.test.js for the amount ceiling. The header was counted again from the status column. maintain-formal-verification-skill stays incomplete.
- docs/plans/formal-verification-skill.md is the accepted sketch.

## Scope

The script, the skill, the inventory row and header, and this plan. No file under public/. No firestore.rules change. No package.json. No ci.yml. No pstack-models rule. No AGENTS.md edit. The scratch edits to public/sync.js were reverted. Chunk sizes stay the literals 6 and 400.

Accounting: none. This change does not change a balance, an advance, a ledger rule, or an export.

Expected cost: zero. No install, no new CI step, no paid run. Expected runtime: under one second. One local ballpark of the 8192 pool calls plus the two fixtures was 18 ms on the planning VM. The command is node scripts/formal-delete-order.js.

## Blast Radius

Two new files and two markdown files. The app cache does not load them. The service worker version does not change. The four CI jobs do not gain a step. The ledger job still requires at least 34 passes and does not run this script.

## Verification

node scripts/formal-delete-order.js prints ok 8196 on the reverted tree. The children-first scratch exited 1 and named the finance-only list. The drop-after-first-slice scratch exited 1, with pool failure count 0, missing t6 and missing e400. Both edits were reverted and the script exited 0 again. git diff -- public/sync.js is empty. npm run lint, npm run format:check, npm run typecheck, and npm test were run. The status column was counted after the inventory edit.

## 4/4 CI

The four jobs still run: quality, ledger, browser, emulator. There is no path filter. This section does not claim they are already green. The script is not a fifth job.

## Awaiting Ameer

Do not merge until Ameer says so.

Template headings used: Why, Plan (sketch, reviewed by Architect), What changed, Scope, Blast Radius, Verification, 4/4 CI, Awaiting Ameer.

Unslop scan: checked this body for em dashes, en dashes, the unslop AI-vocabulary list, "not just X but Y", and a stock closer. No hits.

## Playbooks

- create-formal-verification-skill. Output is .cursor/skills/formal-delete-order/SKILL.md and scripts/formal-delete-order.js. The check require()s the real functions, both scratch edits failed, and both were reverted.
- architect. Output is docs/plans/formal-verification-skill.md. Arena was not run. It is banned. r2 compared TLA+ with this Node check. r3 keeps the Node check and replaces the unbounded id space with the 8196-case generator.
- in-your-own-words. Output is the Why above.
- opening-a-pr. Output is this body. The headings line lists the template headings used.
- technical-writing. The skill is the instructions the next agent runs. The inventory stays one cell and the header count.
- unslop. Output is the scan line above.
- benchmark-checklist. One-run ballpark for the 18 ms. Questions 4 and 7 held. Not a before-and-after, and not a CI time.
- maintain-formal-verification-skill. Not run. The row stays incomplete. The skill points at it for a later change to flushOutbox or projectDeleteBatches.
- babysit. Not started. When Ameer asks, mode is drive for this code-and-docs pull request. Do not merge.

Not used: feature, bug-fix, prototype, visual-parity, perf-issue, runtime-forensics, trace-forensics, shipping, refactoring, hillclimb, eval, statechart, arena, swarm, autopilot-full, autopilot-stack, orchestrate, autonomous-run, and worktree-cleanup. The check is not a new ledger behavior, and TLA+ was declined.

## Principles

- principle-attack-the-premise. N/A. No failed fix pair.
- principle-boundary-discipline. N/A. No validation moved.
- principle-build-the-lever. Met. scripts/formal-delete-order.js is the check a reviewer reruns.
- principle-encode-lessons-in-structure. Met. The delete-order rule is the script, not another comment.
- principle-exhaust-the-design-space. N/A for a third shape. r2 already compared the TLA+ model with the Node check. Arena was not run.
- principle-experience-first. N/A. No screen changed. The harm of a bad delete is why this property was chosen.
- principle-explain-the-number. Met. 8192 is 8 × 8 × 8 × 8 × 2. The total is 8196. The inventory header is a fresh count of the status column. The 18 ms figure is one local run, with questions 4 and 7 checked.
- principle-fix-root-causes. N/A. No product bug is fixed here. A failure of the script on the current code would be reported, not patched to pass.
- principle-foundational-thinking. Met. The data shape is DeleteFound, then the DeleteDoc list from projectDeleteDocs, then the batches. The generator was fixed before the script logic.
- principle-guard-the-context-window. Met. The script prints the first pool failure and the named-case failures, not all 8192 lists.
- principle-laziness-protocol. Met. No new tool, no CI job, no chunk-size parameter, no edit under public/.
- principle-make-operations-idempotent. N/A. No retry path added.
- principle-migrate-callers-then-delete-legacy-apis. N/A. No API changed.
- principle-minimize-reader-load. Met. One command. Two properties. The script calls the functions a reviewer opens.
- principle-model-the-domain. Met. The generator builds the DeleteFound values projectDeleteDocs already accepts. It does not invent a second list shape.
- principle-never-block-on-the-human. N/A for the merge. Ameer's gate stays. The pool of three ids was chosen in the plan.
- principle-outcome-oriented-execution. Met. The row flips to applied only when the skill, the script, the pass, and both mutation records are in the same pull request.
- principle-prove-it-works. Met. The script require()s the real functions. Both scratch edits must exit 1, and both reverts must exit 0.
- principle-redesign-from-first-principles. Met. The finite pool, the partition, and both chunk boundaries are the generator. The old "at most 4 characters" bound is gone.
- principle-separate-before-serializing-shared-state. Met. This branch does not edit the files #63 and #64 own. The shared inventory header is recounted from the table.
- principle-sequence-verifiable-units. Met. Green run, children-first failure, revert, green run, drop-after-first-slice failure, revert, green run, then the inventory edit.
- principle-subtract-before-you-add. Met. TLA+ stays out. Chunk sizes are not promoted to parameters. The unbounded id space is removed.
- principle-test-behavior-not-implementation. Met. The script asserts the arrays the functions return. It does not assert the source text. The two scratch edits change the function body and the same assertions fail.
- principle-type-system-discipline. N/A. No new type in types/checkjs.d.ts. The script still has to pass the existing checkJs include.
```
