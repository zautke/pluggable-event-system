# Evidence-Based Verification (EBV)

The quality gate does not accept "the tests pass" or "it should work." It accepts **proof that the
software was exercised as a user would exercise it**, with captured artifacts, covering every
expected behavior including failure paths. `hooks/quality-gate` enforces this: no fresh passing
evidence file, no completion.

## Core principle: as-user, not as-author

- **As-author** (insufficient alone): unit tests, type checks, "I ran the function in my head."
- **As-user** (required): drive the *actual* interface the user will use, observe real output,
  capture an artifact a human could inspect. Green unit tests are supporting evidence, never the
  gate itself.

## The evidence artifact

Written to `.sdlc/evidence/<run>.json`. Exact schema the hook validates:

```json
{
  "run": "<run-id, matches .sdlc/run-<id>.json>",
  "interface": "web | cli | api | library | desktop",
  "status": "pass | fail",
  "as_user": true,
  "generated_at": "<ISO-8601 timestamp>",
  "behaviors": [
    {
      "name": "short behavior name",
      "expected": "what a user should observe",
      "actual": "what was actually observed",
      "pass": true,
      "artifacts": ["relative/path/to/screenshot.png", "relative/path/to/transcript.txt"]
    }
  ]
}
```

**`status` is `pass` only if:** `as_user` is true, `behaviors` is non-empty, **every** behavior has
`pass:true` AND at least one artifact, at least one behavior exercises a **failure/edge path**, and
`generated_at` is newer than the newest source-file mtime for this run (freshness — see below).
Any behavior with `pass:false` forces `status:"fail"`.

## Freshness (anti-stale-evidence)

Evidence from before the last code change is worthless. The gate treats evidence as valid only when
`generated_at` is newer than the most recent modification to tracked source in the run. Practically:
re-run the verifier after the final edit. If you edit again, you re-verify.

## Per-interface harness

Pick the harness by the interface the user actually touches. Prefer a detected accelerator; always
have a portable fallback.

### web  (a UI in a browser)
- **Preferred:** `chrome-devtools` / claude-in-chrome MCP — navigate, interact, screenshot each
  asserted state; capture a network HAR for API-backed behaviors.
- **Fallback:** headless run (e.g. the project's own e2e runner) that emits screenshots; or a
  scripted `curl` against the served page for pure-HTML checks.
- **Artifacts:** `screenshot-<behavior>.png`, `network.har`, console log excerpt.

### cli  (a command-line tool)
- **Harness:** execute the real binary/script with representative args; capture stdout, stderr,
  and exit code. Include at least one invalid-input run and assert the non-zero exit + message.
- **Artifacts:** `transcript-<behavior>.txt` (command + full output + `echo "exit=$?"`).

### api  (an HTTP/RPC service)
- **Harness:** start the service; issue real requests (curl/httpie) for each endpoint/behavior;
  record request, response status, headers, body. Include an auth-failure and a validation-failure.
- **Artifacts:** `http-<behavior>.txt` or `.har` (request + response).

### library  (imported by other code)
- **Harness:** write and run a small **example program** that consumes the public API exactly as a
  downstream user would (not the internal test harness); capture its output/return values.
- **Artifacts:** `example-<behavior>.<ext>` + its `transcript.txt`.

### desktop  (a native GUI app)
- **Harness:** computer-use MCP — launch, drive the UI, screenshot each asserted state.
- **Artifacts:** `screenshot-<behavior>.png`.

## Behavior coverage (exhaust, don't sample)

Enumerate expected behaviors from `.sdlc/plans/*.md` and the ADRs. Cover:
1. **Golden path** — the primary success flow.
2. **Boundaries** — empty input, max input, unicode, zero/negative, large.
3. **Failure paths** — invalid input, missing auth, unavailable dependency; assert the *graceful*
   failure the user should see, not a crash.
4. **Idempotence/repeat** where relevant (run twice; state stays correct).

Think `pass^k` (every behavior passes every time), not `pass@k` (passed at least once). One flaky
behavior fails the gate.

## Writing the file

The `evidence-verifier` agent composes `.sdlc/evidence/<run>.json` after collecting artifacts under
`.sdlc/evidence/<run>/`. Keep artifact paths **relative to the repo root** so the file is portable.
If basic-memory is available, mirror a short pass/fail reflection to memory (see capability-detection).

## Escape hatch

A run legitimately stuck (environment can't run the software) is aborted explicitly with
`/sdlc-status --abort`, which clears `.sdlc/active` and records the reason in the run log. The gate
never silently passes — it either sees fresh passing evidence or is explicitly aborted.
