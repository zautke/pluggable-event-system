---
name: phase-implementation
description: Use to run the Implementation phase of the SDLC - build the plan's tasks with test-first discipline, parallelizing by independent DAG branches. Fans out the implementation-team roster (implementer subagents) and writes .sdlc/impl/ notes with files touched and blast radius.
---

# Phase: Implementation

Build the plan. Prefer test-first for core behaviors. Parallelize only where the DAG says it is safe.

**Inputs:** `.sdlc/plans/*.md` (task DAG), `.sdlc/adr/*.md`.
**Roster:** `implementation-team` (implementer + TDD driver; see `../../references/team-rosters.md`).
**Artifact:** `.sdlc/impl/<task>.md`, per task.
**Exit gate:** all plan tasks implemented; each note records files touched + blast radius; the code
builds where a build exists.

## Steps

1. **Order by the DAG.** Topologically sort tasks. Independent branches may run in parallel; tasks
   within a branch run in order.
2. **Bound the blast radius first.** Before editing, use `codemunch` (`get_blast_radius`,
   `find_importers`, `get_related_symbols`) if present, else `Grep`/`Read`, to see what a change
   touches. Record it.
3. **Dispatch implementers.** One `implementer` subagent per independent branch, each with the full
   task text and context (never your whole session). For core behaviors, write a failing test first
   (TDD driver), then make it pass. **Do not** run multiple implementers on the *same* files.
4. **Self-review + notes.** Each implementer writes `.sdlc/impl/<task>.md`: files touched, blast
   radius, key decisions, follow-ups, and how it verified locally.
5. **Integrate.** Reconcile branches; ensure the whole builds. Log `phase_pass`.
6. **Hand off** to `phase-review`.

## Notes

- Keep changes minimal and focused; no speculative abstractions or unrequested features.
- Never disable lint/tests to make progress; fix the root cause.
- Never start on `main`/`master` without explicit user consent; prefer a branch/worktree.
- Secrets stay out of code — environment variables only.
- Handle implementer status honestly (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED); re-dispatch
  with more context or a stronger model rather than forcing a silent retry.
