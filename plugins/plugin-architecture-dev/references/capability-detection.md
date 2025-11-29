# Capability Detection

The plugin requires **no external MCP**. It runs on native Claude Code subagents alone. Optional
accelerators are used *only if present* (lazy activation, principle 1) and every one has a portable
fallback. This file is the single source of truth for what each accelerator buys and what to do
without it.

## Capability map

| Capability | Detect (tool prefix) | Accelerates | Portable fallback |
|---|---|---|---|
| `codemunch` | `mcp__codemunch__*` (or `mcp__jcodemunch__*`) | Token-efficient code search, blast radius, dead code, symbol graph | `Grep` + `Read` + `Glob` |
| `memory` | `mcp__kb__*` / `mcp__basic-memory__*` (basic-memory) | Persist ADRs + failure reflections; recall prior art | Skip mirroring; keep everything in `.sdlc/` only |
| `web-proof` | `mcp__chrome-devtools__*` / claude-in-chrome / computer-use | As-user web/desktop evidence (navigate, screenshot, HAR) | Project e2e runner, `curl`, or headless screenshot |
| `second-opinion` | `mcp__gemini__*`, `mcp__codex__*` | Independent-model review of high-risk diffs | Native `spec/code-quality/security` reviewers only |
| `web-research` | `WebSearch`, `WebFetch`, Context7, Tavily/Exa | Broader/faster discovery modalities | Whatever web tool is available; else local-only research |

Tool **names drift** — match by prefix/substring, never hard-code a full tool id. Absence is
normal and never an error.

## Detection (single authoritative source)

The **`sdlc-orchestrator` skill** is the sole detector. On entry it inspects which `mcp__*` tools it
actually holds this session and writes `.sdlc/capabilities.json` from that. The model's live view of
its own toolset is authoritative and current, so there is no separate filesystem probe to drift out of
sync. The `session-start` hook only injects the compact phase index — it does **not** touch `.sdlc/`
or probe for accelerators. Absence of any accelerator is normal and never an error.

## capabilities.json schema

```json
{
  "detected_at": "<ISO-8601>",
  "source": "model-reconciled",
  "capabilities": {
    "codemunch": true,
    "memory": false,
    "web_proof": true,
    "second_opinion": false,
    "web_research": true
  },
  "notes": "free text, e.g. which concrete tool ids backed each capability"
}
```

## Degradation rules

- **Never hard-fail on absence.** A missing accelerator downgrades a step's *method*, never its
  *goal*. Research still happens without codemunch; evidence is still captured without chrome.
- **Announce the mode.** Rosters state which capabilities they used so output is reproducible
  ("codebase scout used grep fallback; codemunch not present").
- **Memory is additive.** With `memory`, mirror ADRs and post-run failure reflections; without it,
  `.sdlc/` remains the sole record. Reflexion still works by reading `.sdlc/log/events.ndjson`.
- **Evidence still requires as-user proof.** Absence of chrome/computer-use means "use another
  as-user harness" (curl/e2e/example program) — it does NOT downgrade the gate to unit tests.

## How a skill consults capabilities

Read `.sdlc/capabilities.json` (fall back to assuming all-absent if missing), then choose tools
accordingly. Do not re-probe on every phase; reconcile once per run in the orchestrator and trust
the file thereafter.
