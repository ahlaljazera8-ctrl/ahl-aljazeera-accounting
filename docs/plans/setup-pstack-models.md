# Plan: record the large pstack budget in the repo

Architect approved r2. This change writes the rule file and leaves the inventory row «ناقصة» until the no-tool-call proof. `origin/main` is `b4fcd213bcf0b3f9579eff37d0e69388933e3ac6`.

Ameer's answers via EA on 2026-11-10 at 00:00 Baghdad: «الجدول مقبول مثل ما هو» and «التحقق الرسمي: هسه». The 17-line table below is accepted as-is. Formal verification is a separate plan. It is not this change. His budget choice at 23:53 was «setup-pstack: large».

Revision r2. Step 7 is covered by #61 (open). Step 8 is not declined. The proof agent must not be told the file path, and a transcript that read a file does not flip the row.

## In my words

Ameer chose the setup-pstack budget `large — xhigh reasoning`, which is the skill default. The problem is that the skill writes that choice into a home directory a cloud agent does not keep and a reviewer cannot see. The follow-up should put the same rule in the repo, where cloud agents read project rules, and mark the inventory row done only after a cloud agent has quoted the line back.

## What the skill writes

Read this session from `/home/ubuntu/.cursor/plugins/cache/cursor-public/9717366/236e5481d05cbadc315b374a5de54971858c27bb/skills/setup-pstack/SKILL.md`. The file is on disk. It is not in the ledger repo.

The skill's own instruction, line 8:

> Write `~/.cursor/rules/pstack-models.mdc`, an always-applied rule that sets pstack's model per role.

Step 5 says to write that path with `alwaysApply: true`, a `# budget` line, and one line per role, using the labels in poteto-mode. Re-runs overwrite the whole file. The shape in the skill is:

```
---
description: pstack per-role model choices (overrides skill defaults)
alwaysApply: true
---
# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit-parent` or `auto` as a value: the role runs on the parent chat model (omit Task `model`). Alias entries in a panel list still count toward its fan-out.
# budget: large (xhigh)
feature, refactoring: grok-4.7-xhigh-fast
bug-fix: grok-4.7-xhigh-fast
perf-issue: grok-4.7-xhigh-fast
hillclimb: grok-4.7-xhigh-fast
judgment and prose: claude-opus-5-5-xhigh
hardest tasks: claude-opus-5-5-xhigh
how explorer: grok-4.7-xhigh-fast
how explainer: claude-opus-5-5-xhigh
why investigators: grok-4.7-xhigh-fast
why synthesizer: claude-opus-5-5-xhigh
reflect tooling: grok-4.7-xhigh-fast
reflect judgment, divergent, synthesizer: claude-opus-5-5-xhigh
arena runners: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
arena cross-judge pool: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
swarm workers: grok-4.7-xhigh-fast
architect runners: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
interrogate reviewers: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
```

Step 3 says `large` keeps those two default slugs. `unlimited` would raise Claude to `max` and leave Grok at `xhigh`. Ameer did not choose that.

`~/.cursor/rules/pstack-models.mdc` does not exist on this machine (`ls` returned "No such file or directory"). Even if it did, a file in a cloud agent's home is not evidence. It is not in git, and a later cloud agent does not receive another machine's home directory.

Step 7 is covered by #61 (open). Do not create a second verification skill. Do not treat #61 as merged, and do not cite its files as landed evidence.

Step 8 is not declined. Ameer answered «التحقق الرسمي: هسه» at 00:00 Baghdad. That skill is a separate plan. This change does not write it. The formal-verification inventory row stays unchanged.

## Where the repo should put it

Put the same bytes at `.cursor/rules/pstack-models.mdc`.

This repo has no `.cursor/` directory at `d928783`. The committed agent instructions that do exist are `AGENTS.md` at the repo root. This cloud agent was given that file as its agent notes, which shows a committed repo instruction is loaded. It does not by itself prove an `.mdc` rule loads. The docs do.

[Cursor rules](https://cursor.com/docs/rules) say project rules live in `.cursor/rules` as `.mdc` files and are version-controlled. A plain `.md` file in that folder is ignored because it has no frontmatter. With `alwaysApply: true`, the rule is always included. Globs and the description are ignored for that decision. The same page says rule content reaches Agent as written, and that this is the same in the editor, the CLI, and Cloud Agents. Anything that must always be in context has to be in the rule body, not behind a file mention.

[Cloud agent best practices](https://cursor.com/docs/cloud-agent/best-practices) say cloud agents read rules at three levels, and the repo level is `.cursor/rules/*.mdc` files committed to the repository. Those apply to all agents using that repository.

A Cursor forum reply on user rules says the opposite about the home path: `.mdc` files in `~/.cursor/rules` stay on the machine and are not uploaded, so a cloud agent will not see them. That is why the skill's path is not acceptable evidence here.

Frontmatter for this file, matching the skill and the docs:

```
---
description: pstack per-role model choices (overrides skill defaults)
alwaysApply: true
---
```

Do not set `metadata.environments`. That filter is not in the public rules page. We want the rule in cloud and in the editor.

## How to prove a cloud agent loads it

The docs say a committed `.cursor/rules/*.mdc` with `alwaysApply: true` is included. This repo has never had that file, so the load is not yet observed.

Proof, before the inventory row flips:

1. Commit and push `.cursor/rules/pstack-models.mdc` on the follow-up branch.
2. Start one new cloud agent on that branch. Its prompt must not name the rule file or any path. It must tell the agent to answer only from the rules already in its context, and to use no file reads, no searches, and no shell. It edits nothing. The task is to quote the pstack budget line and the model for feature and refactoring work.
3. The reply must contain `# budget: large (xhigh)` and `feature, refactoring: grok-4.7-xhigh-fast`.
4. The pull request body includes the agent link and states that the transcript shows zero tool calls before the quote.

If the quote is missing, or the transcript shows the agent read a file, leave `setup-pstack` «ناقصة». The rule file can still land. The row flips only in the same pull request as the file and a quote that came with zero tool calls.

That proof is one short cloud run. It does not spawn the panel roles. `AGENTS.md` still bans `arena` and still requires Ameer's cost approval for `swarm`. Those lines in the rule do not start those playbooks.

## Detection

Method. The Task tool rejects an unknown `model` and returns the allowed slugs. The call used `not-a-real-slug` and did no work. The returned list includes both skill defaults at the large tier:

- `claude-opus-5-5-xhigh`
- `grok-4.7-xhigh-fast`

Also present, and not used, because `large` keeps the defaults: `claude-opus-5-5-xhigh-fast`, `grok-4.7-xhigh`, `claude-opus-5-5-max`, `grok-4.7-high-fast`.

The full allowed list from that rejection:

```
claude-fable-5-2-high
claude-fable-5-2-low
claude-fable-5-2-max
claude-fable-5-2-medium
claude-fable-5-2-xhigh
claude-opus-5-5-high
claude-opus-5-5-high-fast
claude-opus-5-5-low
claude-opus-5-5-low-fast
claude-opus-5-5-max
claude-opus-5-5-max-fast
claude-opus-5-5-medium
claude-opus-5-5-medium-fast
claude-opus-5-5-xhigh
claude-opus-5-5-xhigh-fast
claude-sonnet-5-5-high
claude-sonnet-5-5-low
claude-sonnet-5-5-max
claude-sonnet-5-5-medium
claude-sonnet-5-5-xhigh
composer-2.5
composer-2.5-fast
cursor-grok-4.6-high
cursor-grok-4.6-high-fast
cursor-grok-4.6-low
cursor-grok-4.6-low-fast
cursor-grok-4.6-medium
cursor-grok-4.6-medium-fast
cursor-grok-4.6-xhigh
cursor-grok-4.6-xhigh-fast
gemini-4-argon-high
gemini-4-argon-low
gemini-4-argon-medium
gpt-5.6-sol-high
gpt-5.6-sol-high-fast
gpt-5.6-sol-low
gpt-5.6-sol-low-fast
gpt-5.6-sol-max
gpt-5.6-sol-max-fast
gpt-5.6-sol-medium
gpt-5.6-sol-medium-fast
gpt-5.6-sol-none
gpt-5.6-sol-none-fast
gpt-5.6-sol-xhigh
gpt-5.6-sol-xhigh-fast
grok-4.7-high
grok-4.7-high-fast
grok-4.7-low
grok-4.7-low-fast
grok-4.7-medium
grok-4.7-medium-fast
grok-4.7-xhigh
grok-4.7-xhigh-fast
muse-wonder-1.0-high
muse-wonder-1.0-low
muse-wonder-1.0-max
muse-wonder-1.0-medium
muse-wonder-1.0-minimal
muse-wonder-1.0-xhigh
```

No retired role line exists to drop. There is no current rule file. `inherit-parent` and `auto` are valid aliases and are not needed, because both real slugs were in the list.

The implementation re-detected on 2026-11-10. Both `claude-opus-5-5-xhigh` and `grok-4.7-xhigh-fast` were in the Task allow-list. If either slug is missing on a later run, stop. Do not substitute another family.

Step 3(c). Ameer accepted the 17-line table as-is at 00:00 Baghdad («الجدول مقبول مثل ما هو»). No role change, so the file uses the detected defaults. The formal-verification question is answered in a separate plan.

## Exact file

`.cursor/rules/pstack-models.mdc`:

```
---
description: pstack per-role model choices (overrides skill defaults)
alwaysApply: true
---
# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit-parent` or `auto` as a value: the role runs on the parent chat model (omit Task `model`). Alias entries in a panel list still count toward its fan-out.
# budget: large (xhigh)
feature, refactoring: grok-4.7-xhigh-fast
bug-fix: grok-4.7-xhigh-fast
perf-issue: grok-4.7-xhigh-fast
hillclimb: grok-4.7-xhigh-fast
judgment and prose: claude-opus-5-5-xhigh
hardest tasks: claude-opus-5-5-xhigh
how explorer: grok-4.7-xhigh-fast
how explainer: claude-opus-5-5-xhigh
why investigators: grok-4.7-xhigh-fast
why synthesizer: claude-opus-5-5-xhigh
reflect tooling: grok-4.7-xhigh-fast
reflect judgment, divergent, synthesizer: claude-opus-5-5-xhigh
arena runners: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
arena cross-judge pool: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
swarm workers: grok-4.7-xhigh-fast
architect runners: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
interrogate reviewers: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
```

## Inventory row

At `b4fcd213` the header, counted from the table, is 32 «مطبّقة», 41 «ناقصة», 8 «لا تنطبق», 0. 81 rows. `setup-pstack` stays «ناقصة» in this change. Do not flip it until the proof transcript shows zero tool calls before the quote.

Suggested cell, only after that proof:

`Ameer 2026-11-09 23:53 Baghdad chose large — xhigh reasoning. .cursor/rules/pstack-models.mdc has alwaysApply true and # budget: large (xhigh). A cloud agent quoted that line from its context. The transcript shows zero tool calls before the quote.`

Replace the last sentence with the agent link once that transcript exists. If the agent read a file, do not use this cell.

Recount after that one flip: 33 «مطبّقة», 40 «ناقصة», 8 «لا تنطبق», 0. 33 + 40 + 8 + 0 = 81. Count the status column. Do not only edit the header sentence.

If the quote is missing, or the agent read a file, do not flip. The header stays 32/41/8/0.

## What this does not change

No file under `public/`. No service worker version bump. No edit to `.github/workflows/ci.yml`. The four CI jobs still run on a pull request, because the workflow has no path filter. That is existing behavior, not a CI change.

Cost. `large` is the skill default, xhigh, not a raise to max. Recording the file does not start a model run. The proof is one short cloud agent that only quotes two lines from context, with no tools. Arena and swarm stay banned by `AGENTS.md`, so the panel lines in the rule do not spend money unless Ameer later approves those playbooks. Step 7 does not add a skill. Step 8 waits for Ameer and does not write one in this change.

## Accounting

None. Model choice does not change a balance, an advance, a ledger rule, or an export.
