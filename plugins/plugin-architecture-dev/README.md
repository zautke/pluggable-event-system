# plugin-architecture-dev

A **language-agnostic, full-SDLC master plugin** for Claude Code. One frontline orchestrator
classifies any build/change/design request and drives it through seven hard-gated phases —
**research → planning → architecting → implementation → review → testing → an evidence-based hard
quality gate** — fanning out a **named multi-agent roster** at every phase.

The gate is real: a `Stop` hook **blocks completion** until the software has been exercised *as a
user* over its real interface and a fresh passing evidence file exists. No "it should work."

It is also **internally pluggable** (the repo's namesake): phases are contribution points, hooks are
the event bus, capability detection lazily activates optional accelerators. Adding a phase is adding
a skill + agent + one registry entry — core files never change.

---

## Install

```
/plugin marketplace add /Volumes/MACDEV/pluggable-event-system
/plugin install plugin-architecture-dev
```

Then start a new session (the `SessionStart` hook injects a compact phase index).

## Quick start

```
/sdlc build a tiny CLI that reverses stdin
```

The orchestrator opens a run under `.sdlc/`, classifies the entry phase, and drives the pipeline with
roster fan-out until the quality gate passes. You can also enter any phase directly with its command
(below), or just describe delivery work in plain language — the master metaprompt routes it.

---

## The pipeline (each phase is a hard gate)

| # | Phase | Command | Roster | Artifact (exit gate) |
|---|---|---|---|---|
| 1 | Research & Discovery | `/research` | `research-team` | `.sdlc/research/*.md` |
| 2 | Planning | `/plan` | `planning-team` | `.sdlc/plans/*.md` (task DAG) |
| 3 | Architecting | `/architect` | `architecture-team` | `.sdlc/adr/*.md` |
| 4 | Implementation | `/implement` | `implementation-team` | `.sdlc/impl/*.md` |
| 5 | Review | `/review` | `review-team` | `.sdlc/review/*.md` (no open blockers) |
| 6 | Testing | `/test` | `testing-team` | `.sdlc/testing/*.md` |
| 7 | **Quality Gate** | `/quality-gate` | `verification-team` | `.sdlc/evidence/<run>.json` (`status:"pass"`) |

A phase advances **only when its artifact exists** and its exit criteria are met. The registry
(`references/phase-registry.json`) is the machine-readable contract for order, activation, and gates.
Phases marked `skippable_when` (research, architecting) may be skipped for small work with a logged
rationale — but **the quality gate is never skipped**.

## Multi-agent rosters

Every phase dispatches a named roster of native Claude Code subagents **in parallel** (one message,
multiple `Task` calls), then synthesizes their output into the single phase artifact. Doctrine:

- **≥2 modalities** per information-gathering member (web + docs + code + memory).
- **Fresh context per critic** — reviewers judge the artifact, not the author's story.
- **Citation-anchored** claims (URL, `file:line`, `repo@sha`, doc id).
- **Reflexion** — prior failures from `.sdlc/log/events.ndjson` are re-injected before re-runs.

See `references/team-rosters.md` for each roster's members and documented minimums.

## The evidence-based hard quality gate

The terminal phase produces `.sdlc/evidence/<run>.json` and the `Stop`/`SubagentStop` hook enforces
it. `status` is `pass` only when:

- `as_user: true` and `behaviors` is non-empty;
- **every** behavior has `pass:true` **and** ≥1 captured artifact;
- at least one behavior exercises a **failure/edge path**;
- the file is **fresh** — newer than the latest source change in the run.

```json
{
  "run": "<run-id>",
  "interface": "web | cli | api | library | desktop",
  "status": "pass",
  "as_user": true,
  "generated_at": "<ISO-8601>",
  "behaviors": [
    { "name": "reverses a line", "expected": "dcba", "actual": "dcba", "pass": true,
      "artifacts": ["evidence/<run>/transcript-golden.txt"] }
  ]
}
```

Harness by interface: **web** → chrome/computer-use screenshots + HAR; **cli** → real invocation with
captured stdout/stderr/exit; **api** → real HTTP request/response; **library** → a small example
program; **desktop** → computer-use screenshots. Full playbook in
`references/evidence-based-verification.md`.

## Commands

| Command | Does |
|---|---|
| `/sdlc <goal>` | Entry point — invoke the orchestrator for the whole lifecycle |
| `/research`, `/plan`, `/architect`, `/implement`, `/review`, `/test`, `/quality-gate` | Run a single phase directly |
| `/sdlc-status` | Print the current run state from `.sdlc/` |
| `/sdlc-status --abort [reason]` | End a stuck run: log it and clear the hard gate (no faked evidence) |
| `/ai-ingest` | Create or validate a typed `ProjectSnapshot` for AI engineering work |
| `/ai-decompose` | Turn a project snapshot into a typed plugin `ComponentGraph` |
| `/rag-lego` | Scaffold or explain the deterministic pluggable RAG component pipeline |

## AI engineering contracts

This plugin now includes a concrete AI-engineering use case: reusable contracts for project
ingestion, component decomposition, and RAG pipeline stages.

- TypeScript package: `packages/ai-contracts`. Zod v4 schemas are canonical and export JSON Schema
  Draft 2020-12 wire contracts.
- Python parity: `python/ai_contracts`. Pydantic v2 models validate the same shared fixtures.
- Fixtures: `fixtures/ai-contracts`. These cover descriptors, invocations, results, and a mock RAG
  document.
- References: `references/ai-engineering-contracts.md` and
  `references/rag-component-taxonomy.md`.

The RAG lego example is intentionally local-light: loader -> parser -> chunker -> embedder ->
indexer and query -> retriever -> reranker -> generator -> evaluator. Embeddings are deterministic
fake vectors, artifact refs are `memory://`, and compatibility is verified by matching each
component output schema to the next input schema.

Validation:

```
npm test
npm run build
python -m pytest python/ai_contracts/tests
python .sdlc_validate.py
```

## Hooks

| Event | Script | Purpose |
|---|---|---|
| `SessionStart` | `hooks/session-start` | Inject the compact phase index (read-only; never writes `.sdlc/`) |
| `UserPromptSubmit` | `hooks/prompt-enhance` | Master metaprompt — route SDLC-intent prompts into the orchestrator |
| `Stop` | `hooks/quality-gate` | **Hard gate** — block until fresh passing evidence; clear `.sdlc/active` on pass |
| `SubagentStop` | `hooks/quality-gate` | Non-blocking (workers must finish; per-phase gates are model-side) |

All hooks run through `hooks/run-hook.cmd`, a bash/cmd **polyglot** so the plugin works on Windows
(Git Bash) and Unix alike. Scripts are intentionally **extensionless** (so Claude Code's Windows
`.sh`→`bash` auto-prefix doesn't interfere).

**Disable the master metaprompt** by creating `~/.claude/.sdlc-metaprompt-off` (per user) or
`<project>/.sdlc/metaprompt-off` (per project). It only fires on delivery-intent prompts anyway;
ordinary chat is untouched.

## Optional accelerators (used only if present)

No external MCP is required. Detected from the orchestrator's live tools and recorded in
`.sdlc/capabilities.json`; each has a portable fallback:

| Capability | Backed by | Fallback |
|---|---|---|
| Token-efficient code search | `codemunch` | `Grep`/`Read`/`Glob` |
| Persistent memory | `basic-memory` / `kb` | `.sdlc/` files only |
| As-user web/desktop proof | chrome-devtools / claude-in-chrome / computer-use | e2e runner, `curl`, headless screenshot |
| Second-opinion review | `gemini` / `codex` | native spec/quality/security reviewers |
| Web research | WebSearch/WebFetch/Context7/Tavily | whatever web tool exists; else local-only |

See `references/capability-detection.md`.

## Internal pluggability — add a phase without touching core

1. Add `skills/phase-<id>/SKILL.md` (worker instructions).
2. Add any new `agents/<role>.md` the roster needs.
3. Add a command `commands/<id>.md` that spawns the skill.
4. Add one entry to `references/phase-registry.json` (`id, order, skill, command, roster, activation,
   artifact_glob, exit_criteria, gate, next`).

The orchestrator reads the registry, so the new phase is picked up with **no edits to existing
files** — lazy activation + contribution-point manifest, principle-for-principle the same pattern the
architect/review phases apply to *your* extensible targets (`references/pluggable-architecture-principles.md`).

## Layout

```
plugin-architecture-dev/
├─ .claude-plugin/plugin.json
├─ skills/            sdlc-orchestrator + 7 phase skills + AI decomposition skill
├─ commands/          SDLC commands + AI engineering contract commands
├─ agents/            roster members + AI system decomposer
├─ hooks/             hooks.json + run-hook.cmd polyglot + 3 scripts + phase-index.txt
└─ references/        registry, rosters, principles, evidence playbook, capability map
```

## Run artifacts (`.sdlc/`, created in the target repo)

```
.sdlc/
├─ active                 run id while a run is in flight (gate armed)
├─ run-<id>.json          {id, goal, entry_phase, created_at}
├─ capabilities.json      detected accelerators
├─ log/events.ndjson      append-only event + reflexion log
├─ research/ plans/ adr/ impl/ review/ testing/
└─ evidence/<run>.json    the gate artifact (+ evidence/<run>/ captured artifacts)
```

## Escape hatch

A run that genuinely cannot be verified (environment can't run the software) is ended honestly with
`/sdlc-status --abort <reason>` — it logs the reason and clears `.sdlc/active`. The gate only ever
sees real passing evidence or an explicit abort; it never silently passes.
