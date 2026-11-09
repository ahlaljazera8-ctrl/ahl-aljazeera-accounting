# Plan: five pstack rows stay incomplete

Architect and EA approved this version. No row is marked «مطبّقة». This change only records Ameer's decision and where the evidence will have to live.

## In my words

Ameer said «طبّقوا المهارات الخمس». The five skills that were «لا تنطبق» are now work this ledger still owes. A status of «مطبّقة» would be a lie until a later change produces the artifact each skill actually asks for. This pull request moves the five rows to «ناقصة», names that future evidence, and puts two dropped sentences back into the Layout B quote.

## Tip

Branched from `origin/main` `3994211ca896c0936c29957b6fb31572fe82db69` (pull request #58). Before the edit, `docs/PSTACK_INVENTORY.md` was counted from the table as 32 «مطبّقة», 36 «ناقصة», 13 «لا تنطبق», 81 rows. That matched the header. The edit was not stopped.

## What this change does

- `bro`, `ketchup`, `ketchup-video`, `setup-pstack`, and `sharpen` move from «لا تنطبق» to «ناقصة».
- Each evidence cell starts with `Ameer 2026-11-09: apply` and names the trigger and where evidence will live.
- The header is rewritten from a fresh count of the status column: 32 «مطبّقة», 41 «ناقصة», 8 «لا تنطبق», 0 for Ameer. 32 + 41 + 8 + 0 = 81.
- `docs/feature-map.md` puts two sentences from commit `a2944b4` back into the Layout B quote, verbatim. `window.AJ` remains only if the browser checks still need it. The demo URL and the heal redirect (`?sw=`) stay.
- This plan file is the approved sketch.

No file named `docs/bro-pr-58.md`, `docs/ketchup-after-map.md`, or `docs/sharpen-feature-map-prompt.md` is created. No mp4 is added. No model config is written.

`figure-it-out`, `investigation`, and `pause-safely` stay «ناقصة» and their cells are not edited. `create-verification-skill` and `authoring-a-skill` are not edited. `recall` stays «ناقصة».

Out of the diff: `public/**`, `tests/**`, `firestore.rules`, `firebase.json`, `package.json`, `package-lock.json`, `.github/workflows/ci.yml`, `tsconfig*.json`.

## Where evidence will live

`bro`. Trigger: the next pull request whose body has a plain-language restatement section for Ameer. Evidence: that pull request. This pull request is not that restatement.

`sharpen`. Trigger: the next task from Ameer's own request. Evidence: the plan in `docs/plans/` for that task, and it must show the sharpen questions and the rewritten prompt. This plan records the decision. It does not rewrite a prompt.

`ketchup`. Trigger: the first real catch-up Ameer asks for after a pause. Evidence: the pull request or plan where that catch-up was used. No standing status doc.

`ketchup-video`. Trigger: only when a real catch-up calls for a video. Evidence lives outside the repo: a link plus a frame-check note. No mp4 in git. Any render that costs money needs Ameer's prior approval.

`setup-pstack`. Open until Ameer's recorded budget choice, plus wherever that config is committed or set. A file in an ephemeral cloud-agent home is not evidence. The budget question is pending via EA. This change does not pick a budget and does not start the verification-skill offers.

## Accounting

None. Nothing here changes a balance, an advance, a ledger rule, or an export.

## Pull request body

```
## Why

Five skills were marked as not applying. Ameer said to apply them. This records that decision as incomplete work and names the evidence each one still needs. None is marked done.

## Plan (sketch, reviewed by Architect)

Architect and EA approved docs/plans/pstack-five-rows.md with one change: flip no row to «مطبّقة». The evidence files that an earlier draft would have added are not in this diff.

## What changed

- docs/PSTACK_INVENTORY.md moves bro, ketchup, ketchup-video, setup-pstack, and sharpen to «ناقصة» with the note "Ameer 2026-11-09: apply". The header was counted again from the table: 32 «مطبّقة», 41 «ناقصة», 8 «لا تنطبق», 0.
- Each of those cells names the trigger and where the evidence will live.
- docs/feature-map.md puts the window.AJ sentence and the demo and ?sw= heal sentence back into the Layout B quote, verbatim from a2944b4.

## Scope

Docs only. No application code, no service worker bump, no rules change, no test change, no package.json, no ci.yml. figure-it-out, investigation, and pause-safely stay incomplete and unedited. create-verification-skill and authoring-a-skill are not edited. No row is marked done.

Accounting: none. This change does not change a balance, an advance, a ledger rule, or an export.

## Blast Radius

Three markdown files. The app cache does not load them. The service worker version does not change.

## Verification

The status column was counted after the edit: 32, 41, 8, and 81 rows. prettier --check on the markdown. npm test locally. git diff --stat names no public/ file.

## 4/4 CI

The four jobs still run. There is no path filter. This section does not claim they are already green.

## Awaiting Ameer

Do not merge until Ameer says so. The setup-pstack budget question is still pending via EA. This pull request does not pick a budget.

Template headings used: Why, Plan (sketch, reviewed by Architect), What changed, Scope, Blast Radius, Verification, 4/4 CI, Awaiting Ameer.

Unslop scan: checked this body for em dashes, en dashes, the unslop AI-vocabulary list, "not just X but Y", and a stock closer. No hits.

## Playbooks

- investigation. Output is the reading of the five skill files in the earlier draft, kept as the trigger rules above. No code.
- architect. Output is this approved sketch. Arena was not run. It is banned. The change from the first draft is that no row is marked done and no evidence file is invented.
- technical-writing. The inventory stays a reference table. This plan is the decision record.
- in-your-own-words. Output is the Why above.
- opening-a-pr. Output is this body. The headings line lists the template headings used.
- unslop. Output is the scan line above.
- babysit. Not started. When Ameer asks, mode is check. Do not merge.

Not used: bro, ketchup, ketchup-video, sharpen, and setup-pstack are the rows being opened, not playbooks this change carries out. bug-fix, feature, prototype, visual-parity, perf-issue, runtime-forensics, trace-forensics, shipping, refactoring, hillclimb, eval, autopilot-full, autopilot-stack, orchestrate, autonomous-run, worktree-cleanup, and multi-phase-plan do not apply to this docs edit.

## Principles

- principle-attack-the-premise. N/A. No failed fix pair.
- principle-boundary-discipline. N/A. No validation moved.
- principle-build-the-lever. N/A. No new script. The header is a count of the table.
- principle-encode-lessons-in-structure. N/A. Ameer's note is in the row. No new lint.
- principle-exhaust-the-design-space. N/A. No new layout. Two sentences from a2944b4 are put back into the quote.
- principle-experience-first. N/A. No screen changed.
- principle-explain-the-number. Met. 32/41/8/0 was counted from the status column after the five moves. 32 + 41 + 8 + 0 = 81.
- principle-fix-root-causes. N/A. No bug fix.
- principle-foundational-thinking. N/A. No new data type.
- principle-guard-the-context-window. Met. One docs change. No evidence files were added to stand in for the skills.
- principle-laziness-protocol. Met. Status text and two quoted sentences. No model file, no video, no restatement page.
- principle-make-operations-idempotent. N/A. No operation added.
- principle-migrate-callers-then-delete-legacy-apis. N/A. No API changed.
- principle-minimize-reader-load. Met. Each of the five cells names one trigger and one place the evidence will live.
- principle-model-the-domain. N/A. No domain type changed.
- principle-never-block-on-the-human. Met for this docs edit. The budget choice stays with Ameer, pending via EA. It is not guessed.
- principle-outcome-oriented-execution. Met. No row is «مطبّقة» without its artifact.
- principle-prove-it-works. Met when the header matches the count and npm test passes. The four CI jobs are still required.
- principle-redesign-from-first-principles. N/A. No new product requirement.
- principle-separate-before-serializing-shared-state. Met. This branch starts after #58 merged. It does not edit that branch.
- principle-sequence-verifiable-units. Met. One docs commit. The count is after the status edit.
- principle-subtract-before-you-add. Met. The earlier evidence files are not added. The quote only regains sentences the commit already had.
- principle-test-behavior-not-implementation. N/A. No test added.
- principle-type-system-discipline. N/A. No types changed.
```
