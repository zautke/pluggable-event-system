---
name: phase-testing
description: Use to run the Testing phase of the SDLC - author and run an automated test suite that maps each expected behavior from the plan to at least one test, and audit for untested behaviors. Fans out the testing-team roster and writes .sdlc/testing/.
---

# Phase: Testing

Make the expected behaviors executable and repeatable. This is supporting evidence for the gate — it
does not replace the as-user proof, but it must exist and pass.

**Inputs:** `.sdlc/plans/*.md` (expected behaviors), `.sdlc/review/*.md`.
**Roster:** `testing-team` (test-engineer + coverage auditor; see `../../references/team-rosters.md`).
**Artifact:** `.sdlc/testing/<suite>.md`.
**Exit gate:** a suite exists and runs; every expected behavior maps to >=1 test; suite is green or
each failure is triaged with a reason.

## Steps

1. **Map behaviors to tests.** Dispatch a `test-engineer` to enumerate expected behaviors from the
   plan and write/extend tests covering the golden path, boundaries, and failure paths — using the
   project's own test framework and idioms (language-agnostic: detect the runner, don't impose one).
2. **Run the suite.** Execute it; capture pass/fail counts. Fix flakiness at the root, not by retry.
3. **Audit coverage.** Dispatch a `test-engineer` (audit mode) to find expected behaviors with no
   test (use `codemunch get_untested_symbols` if present, else reason from the behavior->test map).
   Close the gaps.
4. **Write the artifact.** `.sdlc/testing/<suite>.md`: how to run, the `behavior -> test` map,
   results, and any triaged failures.
5. **Log + hand off** to `phase-quality-gate`.

## Notes

- Prefer real integration over mocks for anything that crosses a boundary the user depends on.
- Tests assert behavior a user cares about, not implementation details.
- Green tests are necessary but NOT sufficient — the quality gate still requires as-user evidence.
