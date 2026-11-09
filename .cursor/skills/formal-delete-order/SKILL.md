---
name: formal-delete-order
description: 'Run this on any change to the delete helpers in public/sync.js (projectDeleteDocs, projectDeleteBatches, or ID_RE) or to the delete rules in firestore.rules (projectGone and the allow delete lines that use it, including subcontract terms). Command: node scripts/formal-delete-order.js. This check is run manually; it is not in CI. Wiring it into ci.yml is held for Ameer.'
disable-model-invocation: true
---

# Delete order

Run this from the repo root:

```bash
node scripts/formal-delete-order.js
```

A non-zero exit is a bug in the covered functions, unless a step in the printed case cannot happen in `public/sync.js`. Then the script is wrong. Do not weaken the property to make it pass.

This check is run manually. It is not in CI. Wiring it into `ci.yml` is held for Ameer.

## Properties

For every non-empty list `projectDeleteDocs` returns, the first batch is that project document alone, and no later batch contains a document whose collection is `projects`.

Every document in that list appears in exactly one batch. Nothing in the list is missing, and nothing is repeated.

`projectDeleteBatches` emits the project document, then the `subcontractTerms` slices, then the other children. The check compares those documents. A batch that sends children while the project document still exists is denied, or it leaves money documents behind. A later slice that is never sent leaves those documents in Firestore.

An empty list is the remaining case. `projectDeleteDocs` returns `[]` when the project id fails `ID_RE`, and `projectDeleteBatches([])` returns `[]`. The script accepts that pair only for `bad-project`.

`projectFinance` is not a project document. Its collection is `projectFinance`. It belongs in a later batch. The order check looks for the collection `projects`.

## How to read a failure

The script runs all 8196 cases, then prints. It prints the first pool failure and the pool failure count, not all 8192 lists. A pool failure prints `projectId`, the `found` object, `docs`, `batches`, and `reason`. The reason is `order` or `partition`.

A named-case failure prints the label, the batch lengths, and the first missing or extra document when one exists.

`order` means the first batch is not that project document alone, or a later batch contains `projects`. `partition` means a document from the list is missing or repeated. On `seven-terms` and `rest-401`, the expected lengths are 1, 6, 1 and 1, 400, 1. Those lengths are written in the script. They are not arguments to `projectDeleteBatches`. The literals 6 and 400 stay in `public/sync.js`.

The success line is `ok 8196`. If the script did not run 8196 cases, it prints `ran` and the count, and exits 1.

## Covered code

Last confirmed at `8dfe8c969a7fd230c40b38f43c0218fe5577ded9`.

`projectDeleteDocs`, `projectDeleteBatches`, and `ID_RE` in `public/sync.js`. `projectGone` and the child `allow delete` lines in `firestore.rules`, including subcontract terms at lines 266 to 270 on that SHA. Line numbers move. Find the functions by name.

Move the sync commit only after a fresh run still describes the code. The product files at the landing commit match this SHA. `git diff 8dfe8c969a7fd230c40b38f43c0218fe5577ded9 -- public/ firestore.rules` is empty on this pull request. The sync commit in the skill is that SHA for those files.

## Cases

The inputs are `projectDeleteDocs` outputs. The pool project id is `p`. `entryIds`, `subcontractIds`, `amendmentIds`, and `termIds` are the subsets of `e-a` `e-b` `e-c`, `s-a` `s-b` `s-c`, `m-a` `m-b` `m-c`, and `t-a` `t-b` `t-c`. Subsets keep pool order and start at `[]`. `finance` is `false`, then `true`. That is 8 × 8 × 8 × 8 × 2 = 8192 calls.

Four named cases always run.

- `bad-project`. `projectDeleteDocs('p p', {})`. The space fails `ID_RE`. Both arrays are empty.
- `duplicate-entry`. `projectDeleteDocs('p', { entryIds: ['e-a', 'e-a'] })`. Two documents, the project and one `ledgerEntries` row.
- `seven-terms`. `projectDeleteDocs('p', { termIds: ['t0', 't1', 't2', 't3', 't4', 't5', 't6'] })`. Batch lengths 1, 6, 1. This is the 6 boundary.
- `rest-401`. `projectDeleteDocs('p', { entryIds: ['e0', 'e1', ... 'e400'] })`. Indices 0 through 400 inclusive, 401 ids, no zero-padding. `docs` length 402. Batch lengths 1, 400, 1. This is the 400 boundary.

8192 + 4 = 8196.

## Mutations

Both scratch edits were run on this pull request's tree, on top of `8dfe8c969a7fd230c40b38f43c0218fe5577ded9`, then reverted. `git diff 8dfe8c969a7fd230c40b38f43c0218fe5577ded9 -- public/ firestore.rules` is empty.

Children first. In `projectDeleteBatches`, the terms slices and the rest slices were pushed, and the project batch was pushed after them. The literals 6 and 400 stayed in the loops. Exit 1. The pool failure count is 8191. The first pool case is project id `p` with `finance: true` and empty id lists, and batch 0 is the finance document.

```text
pool failure
projectId p
found {"entryIds":[],"subcontractIds":[],"amendmentIds":[],"termIds":[],"finance":true}
reason order
docs [{"collection":"projects","id":"p"},{"collection":"projectFinance","id":"p"}]
batches [[{"collection":"projectFinance","id":"p"}],[{"collection":"projects","id":"p"}]]
pool failures 8191
named duplicate-entry
lengths 1,1
named seven-terms
lengths 6,1,1
named rest-401
lengths 400,1,1
```

Revert of that edit. Exit 0.

```text
ok 8196
```

Drop after first slice. Each loop was replaced with one push: `terms.slice(0, 6)` when terms is non-empty, and `rest.slice(0, 400)` when rest is non-empty. The project batch stayed first. The literals stayed written in the function. Exit 1. The pool failure count is 0. `seven-terms` fails because `t6` is missing. `rest-401` fails because `e400` is missing.

```text
pool failures 0
named seven-terms
lengths 1,6
missing subcontractTerms/t6
named rest-401
lengths 1,400
missing ledgerEntries/e400
```

Revert of that edit. Exit 0.

```text
ok 8196
```

## What this check does not cover

Ledger totals. `totals` at `public/ledger.js` lines 27 to 40 sets profit to received minus spent. `foremanBalance` at lines 511 to 531 derives holding and what is owed. `subcontractBalance` starts at line 323. `tests/ledger.test.js` already covers that arithmetic.

Outbox idempotency. `flushOutbox` at `public/sync.js` lines 590 to 640 skips an id already in `seen` at line 602. `seen.add` is line 603. `tests/emulator/sync.test.js` line 165 resends one id and expects one server row. The concurrent case is the `flushing` lock in `public/firebase-client.js`: `flushRemote` at line 456, `flushing = run` at line 468, `performFlush` at line 543. That race is a close second target. Suggest it only after this delete-order check is in the repo.

Session and sign-out. The string "Option C" is absent on this SHA. `signout-pending` is in the repo. `holdSession` at `public/session.js` lines 154 to 164 and `closeSession` at lines 308 to 325 still bump `sessionEpoch` and sign out through `disposeFirebase(true)`. `closeSession` increments `sessionEpoch` at line 316 and calls `disposeFirebase(true)` at line 320.

Rules as a whole. The batch order matters because `projectGone` allows a child delete only when that project document is gone. Ledger deletes use it at `firestore.rules` line 157, finance at line 226, subcontracts at line 247, amendments at line 295, and terms at lines 266 to 270. This check does not replace `tests/emulator/rules.test.js`.

Amount ceiling. `MAX_AMOUNT_IQD` is `10000000000` at `public/ledger.js` line 118 and `firestore.rules` line 18. `tests/rules-constant.test.js` ties them together. This skill does not check the ceiling.

Second project rows, null rows, and hand-built lists that did not come from `projectDeleteDocs`. `projectDeleteBatches` drops project rows after the first. The generator never builds them. A later caller that passes its own list is uncovered until `/maintain-formal-verification-skill` extends the check.

Permutations of ids inside one bucket. The functions keep the order they are given. The generator does not permute.

## Later changes

When a change touches the covered code, run the command, tell a bug from a bad counterexample, and move the sync commit only after a fresh run still describes the code. Bring the check back in line with `/maintain-formal-verification-skill`. Copy no `/statechart` command. The row `maintain-formal-verification-skill` stays incomplete until the next pull request that changes `flushOutbox` or `projectDeleteBatches` updates this check in the same change.
