---
description: Show the current SDLC run state from .sdlc/ (active run, phase, artifacts, latest evidence). Pass --abort to explicitly end a stuck run and clear the hard gate.
argument-hint: [--abort [reason]]
allowed-tools: Read, Glob, Bash(cat:*), Bash(ls:*), Bash(rm:.sdlc/active), Bash(date:*)
---

Report the SDLC run state for this repository. Arguments: $ARGUMENTS

## If arguments contain `--abort`

The user is explicitly ending a stuck run. Do this:
1. Read `.sdlc/active` to identify the run id (if any).
2. Append an `{ts, phase:"abort", event:"run_aborted", detail:"<reason from arguments>"}` line to
   `.sdlc/log/events.ndjson`.
3. Remove `.sdlc/active` (this releases the Stop/SubagentStop quality gate).
4. Confirm which run was aborted and that the gate is now released. Do NOT delete artifacts.

## Otherwise (status report)

Inspect `.sdlc/` and print a compact summary:
- **Active run:** contents of `.sdlc/active` (or "none").
- **Run meta:** the latest `.sdlc/run-*.json` (goal, entry phase, created_at).
- **Capabilities:** `.sdlc/capabilities.json` (which accelerators are active).
- **Artifacts by phase:** counts/paths under `.sdlc/research`, `.sdlc/plans`, `.sdlc/adr`,
  `.sdlc/impl`, `.sdlc/review`, `.sdlc/testing`, `.sdlc/evidence`.
- **Latest evidence:** newest `.sdlc/evidence/*.json` — its `status`, `interface`, `generated_at`,
  and whether it looks fresh vs. recent source changes.
- **Next step:** the earliest phase whose exit gate is not yet satisfied.

If `.sdlc/` does not exist, say there is no active SDLC run and suggest `/sdlc <goal>` to start one.
