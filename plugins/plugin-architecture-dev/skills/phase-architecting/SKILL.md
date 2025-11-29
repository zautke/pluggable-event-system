---
name: phase-architecting
description: Use to run the Architecting phase of the SDLC - make and record structural decisions as ADRs before implementation. Applies the pluggable-architecture principles checklist when the target is an extensible/plugin system. Fans out the architecture-team roster and writes .sdlc/adr/.
---

# Phase: Architecting

Decide structure, boundaries, and interfaces deliberately, and record the reasoning as ADRs so review
and future maintainers can trace *why*.

**Inputs:** `.sdlc/plans/*.md`, `.sdlc/research/*.md`.
**Roster:** `architecture-team` (system architect + pluggable-arch specialist + critic).
**Artifact:** `.sdlc/adr/NNN-<title>.md`, one per non-trivial decision.
**Exit gate:** every non-trivial decision has an ADR (context, options, decision, consequences); if
the target is extensible, the pluggable-architecture checklist is answered and attached.

## Steps

1. **Identify decisions.** From the plan, list the structural choices that are costly to reverse
   (module boundaries, data flow, public interfaces, storage, concurrency, extension model).
2. **Fan out.** Dispatch `system-architect` members in parallel by decision area. If the target is a
   plugin host / editor / extensible platform, also dispatch the **pluggable-arch specialist** to
   apply `../../references/pluggable-architecture-principles.md` (all 8 principles).
3. **Critique (fresh context).** Dispatch a `code-quality-reviewer` to challenge coupling, cohesion,
   and reversibility of each proposed decision.
4. **Write ADRs.** For each decision: `Context -> Options considered -> Decision -> Consequences
   (trade-offs, risks, follow-ups)`. Number them (`001-`, `002-`...). Attach the pluggable checklist
   result where relevant.
5. **Log + hand off** to `phase-implementation`.

## Notes

- One decision per ADR; keep them short and durable. Do not restate the plan.
- Favor the event-bus/contribution-point patterns over shared-mutable-state when extensibility matters.
- If a decision turns out wrong later, add a superseding ADR rather than editing history.
- Skippable when the change introduces no new interfaces or cross-cutting structure — log the skip.
