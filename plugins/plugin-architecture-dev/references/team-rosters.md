# Team Rosters

Named multi-agent rosters, one per SDLC phase. Each phase skill fans these out as native
Claude Code subagents (the `Task` tool with `subagent_type` pointing at an agent in `agents/`).
Rosters are the unit of parallelism: dispatch the whole roster in a **single message with
multiple `Task` calls** so members run concurrently, then synthesize.

## Fan-out doctrine (applies to every roster)

1. **Parallel by default.** Independent members launch together. Only serialize on a true data
   dependency (e.g. synthesis waits for researchers).
2. **>=2 modalities per member** where the member gathers information (web, docs via Context7,
   GitHub, local code via codemunch/grep, memory via basic-memory). One source is a rumor; two
   is a finding.
3. **Fresh context per critic.** Reviewers and verifiers must NOT see the author's reasoning —
   spawn them clean so they judge the artifact, not the story behind it.
4. **Citation-anchored output.** Every claim carries its source (URL, file:line, repo@sha, doc id).
5. **Synthesize, don't concatenate.** The orchestrating skill merges member outputs into the
   one phase artifact, resolving conflicts explicitly.
6. **Reflexion.** Before re-running a roster after a failure, read `.sdlc/log/events.ndjson`
   for prior failures on this run and inject them as "avoid repeating" notes.
7. **Degrade gracefully.** If a roster's size exceeds what is useful for a small task, shrink it
   (documented minimums below). Never block on an absent optional accelerator.

## research-team  (phase: research-discovery)

| Member | Agent | Focus | Modalities (>=2) |
|---|---|---|---|
| Domain scout | `research-analyst` | Prior art, SOTA, competing approaches | WebSearch + Context7 |
| Ecosystem scout | `research-analyst` | Libraries, frameworks, reference repos | GitHub + Context7 |
| Codebase scout | `research-analyst` | Existing code, blast radius, conventions | codemunch (fallback grep/Read) + Read |
| Constraints scout | `research-analyst` | Requirements, risks, non-functionals, memory | basic-memory (if present) + WebSearch |

- **Fan-out:** all scouts in parallel; each writes `.sdlc/research/<slug>.md` (question, findings,
  citations, confidence, open items).
- **Synthesis:** orchestrator/planning reads all briefs; contradictions become explicit open questions.
- **Minimum (small task):** 2 scouts (codebase + one external).

## planning-team  (phase: planning)

| Member | Agent | Focus |
|---|---|---|
| Planner | `system-architect` (planning mode) | Decompose goal into a task DAG; success criteria |
| Risk reviewer | `spec-reviewer` | Stress the plan: missing tasks, wrong ordering, unstated assumptions |

- **Fan-out:** planner drafts; risk reviewer critiques with fresh context; planner revises.
- **Artifact:** `.sdlc/plans/<feat>.md` with a DAG and a task->interface map for later evidence.
- **Minimum:** planner only (still write the DAG).

## architecture-team  (phase: architecting)

| Member | Agent | Focus |
|---|---|---|
| System architect | `system-architect` | Structure, boundaries, data flow, interfaces |
| Pluggable-arch specialist | `system-architect` (pluggable mode) | Apply the 8 principles when target is extensible |
| Architecture critic | `code-quality-reviewer` | Challenge coupling, cohesion, reversibility |

- **Fan-out:** architect + specialist draft ADRs in parallel by concern; critic reviews fresh.
- **Artifact:** `.sdlc/adr/NNN-<title>.md` (context, options, decision, consequences). If the
  target is a plugin/extensible system, attach the pluggable-architecture checklist result.
- **Minimum:** system architect only.

## implementation-team  (phase: implementation)

| Member | Agent | Focus |
|---|---|---|
| Implementer(s) | `implementer` | Build tasks; one member per independent DAG branch/worktree |
| TDD driver | `implementer` (test-first mode) | Write failing tests before code for core behaviors |

- **Fan-out:** parallelize by independent DAG branches; serialize within a branch. Use codemunch
  `get_blast_radius` / `find_importers` (if present) before edits to bound impact.
- **Artifact:** `.sdlc/impl/<task>.md` (files touched, blast radius, decisions, follow-ups).
- **Minimum:** one implementer working tasks in dependency order.

## review-team  (phase: review)

| Member | Agent | Focus |
|---|---|---|
| Spec reviewer | `spec-reviewer` | Does it satisfy the plan and ADRs? Gaps vs intent |
| Code-quality reviewer | `code-quality-reviewer` | Readability, cohesion, dead code, error handling |
| Security reviewer | `security-reviewer` | Injection, authz, secrets, unsafe deserialization, OWASP |
| Second opinion (optional) | via `gemini`/`codex` MCP | Independent model cross-check on high-risk diffs |

- **Fan-out:** all reviewers in parallel with fresh context over the diff/artifacts.
- **Artifact:** `.sdlc/review/<reviewer>.md` (findings with severity: blocker/major/minor/nit,
  each with a suggested fix). Gate blocks on any open `blocker`.
- **Minimum:** spec + code-quality + security (the three native reviewers are always run).

## testing-team  (phase: testing)

| Member | Agent | Focus |
|---|---|---|
| Test engineer | `test-engineer` | Author/extend the suite; map each expected behavior to a test |
| Coverage auditor | `test-engineer` (audit mode) | Find untested expected behaviors (codemunch get_untested_symbols if present) |

- **Fan-out:** engineer authors; auditor cross-checks behavior coverage.
- **Artifact:** `.sdlc/testing/<suite>.md` (what runs, how to run, behavior->test map, results).
- **Minimum:** test engineer only.

## verification-team  (phase: quality-gate)  — the hard gate

| Member | Agent | Focus |
|---|---|---|
| Evidence verifier | `evidence-verifier` | Run the software AS A USER over the detected interface |
| Adversarial user | `evidence-verifier` (edge mode) | Exhaust edge cases, invalid input, failure paths |

- **Fan-out:** verifier exercises the golden path; adversarial member attacks edges — both
  capture artifacts (screenshots, transcripts, HAR, exit codes) per `evidence-based-verification.md`.
- **Artifact:** `.sdlc/evidence/<run>.json` (the schema the Stop hook checks). Status is `pass`
  only if every expected behavior was demonstrated as a user with >=1 artifact.
- **Minimum:** evidence verifier covering every expected behavior including at least one failure path.
