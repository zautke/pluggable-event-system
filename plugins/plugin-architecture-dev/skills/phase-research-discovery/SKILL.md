---
name: phase-research-discovery
description: Use to run the Research & Discovery phase of the SDLC - when a goal is vague, the domain is unfamiliar, or you need SOTA/prior-art/codebase grounding before planning. Fans out the research-team roster (parallel analysts, >=2 modalities each) and writes citation-anchored briefs to .sdlc/research/.
---

# Phase: Research & Discovery

Turn open questions into citation-anchored briefs so planning stands on evidence, not guesses.

**Inputs:** the goal (from `.sdlc/run-<id>.json`); `.sdlc/capabilities.json`.
**Roster:** `research-team` (see `../../references/team-rosters.md`).
**Artifact:** `.sdlc/research/<slug>.md`, one per open question.
**Exit gate:** every open question has a brief; each claim carries >=2 modalities OR is flagged
low-confidence; key unknowns resolved or explicitly deferred with rationale.

## Steps

1. **Frame the questions.** Decompose the goal into 3-6 answerable questions (prior art / SOTA,
   ecosystem & libraries, existing codebase & blast radius, constraints & non-functionals).
2. **Fan out the roster.** In a single message, dispatch parallel `research-analyst` subagents — one
   per question — each instructed to use **>=2 modalities**:
   - external SOTA: `WebSearch`/`WebFetch` + Context7 (docs) + GitHub search;
   - existing code: `codemunch` (`search_symbols`, `get_repo_outline`, `find_importers`) if present,
     else `Grep`/`Glob`/`Read`;
   - memory: `basic-memory`/`kb` search if present.
   Consult `.sdlc/capabilities.json` and use fallbacks silently when an accelerator is absent.
3. **Require citations.** Each subagent writes `.sdlc/research/<slug>.md`:
   `Question -> Findings (each with source: URL / file:line / repo@sha / doc-id) -> Confidence ->
   Open items`. Reject uncited claims.
4. **Synthesize.** Merge briefs; surface contradictions as explicit open questions; note which
   unknowns you are deferring and why.
5. **Log + hand off.** Append a `phase_pass` event; hand the brief paths to `phase-planning`.

## Notes

- One source is a rumor; two is a finding. Push back on single-source claims.
- Keep briefs short and skimmable — planning reads all of them.
- If `memory` is present, mirror durable findings so future runs recall them.
- Skippable when the goal is fully specified and the domain is well understood — record the skip
  rationale in the run log; do not skip silently.
