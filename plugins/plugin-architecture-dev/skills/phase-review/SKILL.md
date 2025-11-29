---
name: phase-review
description: Use to run the Review phase of the SDLC - fan out parallel reviewers (spec compliance, code quality, security, plus optional second-opinion models) over the implementation with fresh context, and block on unresolved blocker findings. Writes .sdlc/review/.
---

# Phase: Review

Judge the implementation against intent, quality, and safety — with reviewers who did NOT write the
code, so they judge the artifact, not the author's story.

**Inputs:** `.sdlc/impl/*.md`, the diff, `.sdlc/plans/*.md`, `.sdlc/adr/*.md`.
**Roster:** `review-team` (spec-reviewer + code-quality-reviewer + security-reviewer; optional
gemini/codex second opinion).
**Artifact:** `.sdlc/review/<reviewer>.md`, per reviewer.
**Exit gate:** all three native reviewers reported; every finding resolved or explicitly waived with
rationale; **no open `blocker`-severity finding remains**.

## Steps

1. **Fan out in parallel (fresh context).** In one message, dispatch:
   - `spec-reviewer` — does it satisfy the plan + ADRs? gaps vs intent, over/under-building;
   - `code-quality-reviewer` — readability, cohesion, dead code, error handling, naming;
   - `security-reviewer` — injection, authz, secrets, unsafe deserialization, OWASP top-10.
   If `second_opinion` capability is present, also ask `gemini`/`codex` to cross-check high-risk diffs.
2. **Severity-tag findings.** Each writes `.sdlc/review/<reviewer>.md` with findings as
   `blocker | major | minor | nit`, each with a concrete suggested fix and file:line.
3. **Resolve.** Route findings to an `implementer` for fixes; re-review changed areas. A `blocker`
   must be fixed or explicitly waived (with written rationale) before advancing.
4. **Log + hand off** to `phase-testing`.

## Notes

- Do the reviews in parallel, but treat spec-compliance as the gate on *what* was built and quality/
  security as gates on *how* — all three must clear.
- Reviewers are read-only; they propose fixes, the implementer applies them, then re-review.
- Don't accept "close enough" on spec compliance — a spec gap is an open finding.
