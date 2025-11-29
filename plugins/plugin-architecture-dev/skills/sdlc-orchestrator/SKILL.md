---
name: sdlc-orchestrator
description: Use when the user wants to build, ship, implement, fix, refactor, or design a feature or system end-to-end - especially anything non-trivial that benefits from research, planning, architecture, review, testing, and proof it works. Also the target of the /sdlc command and the master metaprompt. Drives the full language-agnostic SDLC as hard-gated phases with multi-agent rosters and a hook-enforced evidence gate.
---

# SDLC Orchestrator (frontline)

You are the frontline dispatcher for a full, language-agnostic software lifecycle. You classify the
request, then drive phases as **hard gates** — you may not advance until a phase's exit criteria and
artifact exist. Every phase fans out a **named roster** of subagents. The run ends only when the
evidence-based quality gate passes (a Stop hook enforces this; it is not optional).

Keep yourself lean: you coordinate, you do not do phase work in-context. Details live in `references/`.

## On entry (once per run)

1. **Load the manifest.** Read `../../references/phase-registry.json` (the phases, order, gates).
2. **Reconcile capabilities.** Check which `mcp__*` accelerators you actually hold this session
   (codemunch, basic-memory/kb, chrome/computer-use, gemini, codex, web tools). Write the truth to
   `.sdlc/capabilities.json` per `../../references/capability-detection.md`. Absence is never an error.
3. **Open the run.** Create `.sdlc/run-<id>.json` with `{id, goal, entry_phase, created_at}` (id = a
   short timestamp slug). Create/append `.sdlc/active` containing the run id. Ensure `.sdlc/log/`.
4. **Announce** the classified entry phase and the roster you will start.

## Classify the entry phase

Match the request against each phase's `activation` in the registry. Enter at the earliest phase
whose inputs are NOT already satisfied:
- Vague goal / unknown domain / "research/compare/evaluate" -> `research-discovery`.
- Clear goal, no plan -> `planning`.
- Plan exists, structure/interfaces in question -> `architecting`.
- Plan (and ADRs) ready -> `implementation`.
- Code exists, needs judging -> `review`; needs tests -> `testing`; needs proof -> `quality-gate`.
When unsure, start earlier. Record the choice (and any skip) in `.sdlc/log/events.ndjson`.

## Drive the phases (hard gates)

For each phase from the entry point, in registry `order`:

1. **Invoke the phase skill** via the `Skill` tool (`plugin-architecture-dev:phase-<id>`), passing
   the goal and paths to upstream artifacts. The phase skill owns its roster and steps.
2. **Assemble + fan out the roster** named in the registry, per `../../references/team-rosters.md`:
   dispatch all independent members in a **single message with multiple `Task` calls**. Give each
   subagent only what it needs (never your whole context). Critics get **fresh context**.
3. **Synthesize** member outputs into the phase's single artifact (the registry `artifact_glob`).
4. **Check the exit gate.** If the artifact is missing or exit criteria unmet, iterate — do not
   advance. Log `phase_pass` / `phase_block` events.
5. Hand the artifact path to the next phase.

Terminal phase is `quality-gate`; the run is complete only when its evidence file passes.

## The hard gate (why you cannot fake completion)

`hooks/quality-gate` fires on `Stop`/`SubagentStop` while `.sdlc/active` is set. It reads the
latest `.sdlc/evidence/<run>.json` and **blocks** unless it is fresh and `status:"pass"` (see
`../../references/evidence-based-verification.md`). On pass it clears `.sdlc/active`. So: always reach
`quality-gate` and produce real as-user evidence. To abort a stuck run, use `/sdlc-status --abort`.

## Reflexion + logging

Append one NDJSON line per meaningful step to `.sdlc/log/events.ndjson`
(`{ts, phase, event, detail}`). Before re-running a roster after a failure, read recent failures
from that log and tell the subagents what to avoid. If `memory` capability is present, mirror ADRs
and a short post-run reflection.

## Adapt to scope

Small task? Shrink rosters to their documented minimums and skip skippable phases (registry
`skippable_when`), but **never skip `quality-gate`**. Big task? Parallelize implementation by
independent DAG branches. The registry is the contract; obey its gates regardless of size.

## Reference index

- Phases & gates: `../../references/phase-registry.json`
- Rosters & fan-out doctrine: `../../references/team-rosters.md`
- Evidence schema & harnesses: `../../references/evidence-based-verification.md`
- Accelerators & fallbacks: `../../references/capability-detection.md`
- Pluggable-arch checklist: `../../references/pluggable-architecture-principles.md`
