---
name: phase-planning
description: Use to run the Planning phase of the SDLC - synthesize research into a concrete plan with a task DAG, success criteria, and a map from each task to the interface that will later prove it works. Fans out the planning-team roster and writes .sdlc/plans/.
---

# Phase: Planning

Convert goal + research into an executable plan that later phases can follow and verify against.

**Inputs:** `.sdlc/research/*.md` (if any); the goal.
**Roster:** `planning-team` (planner + risk reviewer; see `../../references/team-rosters.md`).
**Artifact:** `.sdlc/plans/<feat>.md`.
**Exit gate:** a task DAG (nodes = tasks, edges = dependencies), explicit success criteria, and a
`task -> target interface` map (web/cli/api/library/desktop) so the quality gate knows what to prove.

## Steps

1. **Draft (planner).** Dispatch the `system-architect` (planning mode) to decompose the goal into
   tasks. For each task record: intent, affected area, dependencies, and the **interface a user will
   exercise** to confirm it. Express dependencies as a DAG (a list of `task: [depends-on...]` is fine).
2. **Stress it (risk reviewer).** Dispatch a `spec-reviewer` with **fresh context** to attack the
   draft: missing tasks, wrong ordering, unstated assumptions, untestable success criteria.
3. **Revise.** Fold findings back in until the reviewer has no blockers.
4. **Write the artifact.** `.sdlc/plans/<feat>.md`:
   `Goal -> Success criteria -> Task DAG -> task->interface map -> Risks/assumptions -> Out of scope`.
5. **Log + hand off** to `phase-architecting` (or `phase-implementation` if no new structure).

## Notes

- Success criteria must be **observable by a user**, not "code compiles". These become the expected
  behaviors the evidence gate exercises.
- Prefer the smallest plan that satisfies the goal; do not design for hypothetical futures.
- Keep the DAG honest — only real data dependencies are edges, so implementation can parallelize.
- Follow the superpowers writing-plans spirit: concrete, ordered, reviewable.
