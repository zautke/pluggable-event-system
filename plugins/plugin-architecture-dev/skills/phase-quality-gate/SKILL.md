---
name: phase-quality-gate
description: Use to run the Evidence-Based Hard Quality Gate - the terminal SDLC phase. Exercises the software AS A USER over its real interface, exhausts expected behaviors including failure paths, captures artifacts, and writes the .sdlc/evidence/<run>.json that the Stop/SubagentStop hook requires before a run may complete.
---

# Phase: Evidence-Based Hard Quality Gate

This is the wall. A run is not done because tests pass or because it "should work" — it is done when
there is **proof it was exercised as a user would**, over the real interface, for every expected
behavior including failure paths. `hooks/quality-gate` blocks completion until fresh passing
evidence exists. Read `../../references/evidence-based-verification.md` in full before proceeding.

**Inputs:** the running software; expected behaviors from `.sdlc/plans/*.md`; `.sdlc/capabilities.json`.
**Roster:** `verification-team` (evidence-verifier + adversarial user).
**Artifact:** `.sdlc/evidence/<run>.json` (+ artifacts under `.sdlc/evidence/<run>/`).
**Exit gate:** `status:"pass"` with `as_user:true`, every behavior `pass:true` with >=1 artifact, at
least one failure/edge behavior, and `generated_at` newer than the newest source change this run.

## Steps

1. **Detect the interface.** web / cli / api / library / desktop — pick the harness from the
   evidence reference. Prefer a detected accelerator (chrome/computer-use for web/desktop), else a
   portable fallback (curl, the project e2e runner, or a small example program).
2. **Enumerate behaviors.** From the plan's success criteria: golden path, boundaries, failure paths,
   idempotence where relevant. Exhaust them — think `pass^k` (every behavior every time), not `pass@k`.
3. **Fan out.** Dispatch the `evidence-verifier` on the golden path and the adversarial member on
   edges/failures. Each **runs the software for real** and saves an artifact per behavior
   (`screenshot-*.png`, `transcript-*.txt`, `http-*.har`, exit codes) under `.sdlc/evidence/<run>/`.
4. **Compose the evidence file.** Write `.sdlc/evidence/<run>.json` exactly to schema:
   `{run, interface, status, as_user, generated_at, behaviors:[{name, expected, actual, pass,
   artifacts}]}`. Any `pass:false` -> `status:"fail"`. Use repo-relative artifact paths.
5. **Re-verify after any edit.** If code changed to fix a failure, regenerate evidence so
   `generated_at` stays fresh — stale evidence is rejected by the hook.
6. **Clear on pass.** When `status:"pass"`, the hook clears `.sdlc/active` on the next Stop. Log
   `run_complete`. If `memory` is present, mirror a short pass/fail reflection.

## If verification is impossible here

If the environment genuinely cannot run the software, do NOT fake a pass. Explain the blocker and use
`/sdlc-status --abort` to clear the run explicitly, recording the reason in the log. The gate only
ever sees real passing evidence or an explicit abort.

## Notes

- "It compiles" / "tests are green" are supporting evidence, never the gate.
- A crash where a graceful error was expected is a `fail`, not an artifact of success.
- Keep artifacts small but inspectable by a human.
