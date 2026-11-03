# Agent notes

## Agent workflow (pstack)

Ameer's gates override every skill.

- Ameer approves every merge.
- Ameer approves every behaviour or rules change.
- All 4 CI checks green.
- No spending.
- Plan before code (architect skill): for every addition or update, sketch the files, types and functions first, send the plan to AgentLab Architect and EA for review, and write code only after the review.

### Yes

- `recall`
- `session-pickup`
- `babysit`. Never merges.
- `pause-safely`. The resume note goes in the repo.
- `opening-a-pr`
- `in-your-own-words`
- `unslop`

### Limited

- `poteto-mode`. Ameer's gates override it.
- `poteto-help`. Orientation only.
- `autonomous-run`. Done means all 4 CI checks green and waiting for Ameer, never merged.
- `autopilot-stack`. One owner. Never merges.
- `swarm`. Only with Ameer's cost approval.

### Banned

- `autopilot-full`. The playbook's owner merges without Ameer.
- `orchestrate`. The playbook's owner merges without Ameer.
- `arena`. Cost.
- `automate-me`. Personal style.
- `worktree-cleanup`. Fresh cloud VMs.

## When to use

Ameer's gates override every trigger below.

Each line is a trigger from that skill's own file. The wording is the source wording.

- "Apply when two or more fixes that share one premise have failed the same gate.": use `principle-attack-the-premise`
- "Apply when integrating a new requirement into an existing design.": use `principle-redesign-from-first-principles`
- "When integrating a change": use `principle-redesign-from-first-principles`
- "Vet a perf measurement (limiter, tuning, limits, errors, repeatability, relevance, and whether the work happened) before you report or act on it.": use `benchmark-checklist`
- "Use when you run a benchmark or report a speedup or regression you measured.": use `benchmark-checklist`
- "Use this when you produce a performance number: a PR's before and after, a regression claim, a hillclimb harness, or a library or config choice.": use `benchmark-checklist`
- "For a quick ballpark the user asked for": use `benchmark-checklist`
- "Vet the Perf issue playbook's baseline before the playbook plans from it, and every number after that.": use `benchmark-checklist`
- "Vet the Hillclimb playbook's harness before it is frozen.": use `benchmark-checklist`
- "Running a benchmark, measuring perf yourself, or reporting a speedup or regression you measured": use `benchmark-checklist`
- "A reported defect to reproduce, root-cause, and fix with runtime evidence.": use `bug-fix`
- "Read-only question: how does X work, why was Y built this way, are we sure about Z, should we do X or Y.": use `investigation`
- "If the task is a read-only Investigation whose deliverable is a cited answer": use `investigation`
- "Diagnose a runtime symptom (leak, idle-CPU spin, glitch) from live instrumentation. The deliverable is a diagnosis, not a fix.": use `runtime-forensics`
- "Diagnose a captured profiling artifact (cpuprofile, trace, spindump, heap snapshot) handed to you after the fact. The deliverable is a diagnosis, not a fix.": use `trace-forensics`
- "A measured slowness to trace and improve against a baseline.": use `perf-issue`
- "New or changed behavior, built from a named data shape.": use `feature`
- "No decision means no prototype. Route to Feature.": use `feature`
- "You own the design decision, not the code. The prototype is a throwaway instrument. The real build follows Feature.": use `prototype`
- A throwaway sketch to make a design or behavioral decision cheaply, or to settle an empirical fork by observing it instead of asking the human ("prototype", "mock it up", "try this layout", "sketch it to decide").: use `prototype`
- "If the answer is a fact you could observe by running something (behavior, timing, layout, output, perf, even whether an eval separates)": use `prototype`
- "Pixel-exact UI equivalence: matching two implementations or migrating a styling system.": use `visual-parity`
- "Asked to land or ship a green stack": use `shipping` (merge only with Ameer's approval; see Ameer's gates)
- "The half after Babysit. Independently verifying a green stack, then landing the contiguous verified run bottom-up through `gh` by default or Origin when its CLI is available.": use `shipping` (merge only with Ameer's approval; see Ameer's gates)
