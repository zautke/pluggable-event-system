# pluggable-event-system

A Claude Code **plugin marketplace** hosting one plugin:

## [`plugin-architecture-dev`](plugins/plugin-architecture-dev/README.md)

A language-agnostic, full-SDLC master plugin. A frontline orchestrator classifies any
build/change/design request and drives it through seven hard-gated phases — **research → planning →
architecting → implementation → review → testing → an evidence-based hard quality gate** — fanning
out a **named multi-agent roster** at every phase. A `Stop` hook blocks completion until the software
has been exercised *as a user* over its real interface and a fresh passing evidence file exists.

It is itself **internally pluggable** (the repo's namesake): phases are contribution points, hooks
are the event bus, and capability detection lazily activates optional accelerators (codemunch,
basic-memory, chrome, gemini, codex) — each with a portable fallback, so no external MCP is required.

The repository also contains the first concrete AI-engineering scaffold for that plugin:
`packages/ai-contracts` defines Zod-first JSON Schema contracts, `python/ai_contracts` mirrors them
with Pydantic v2, and shared fixtures exercise a deterministic RAG lego pipeline with no local model
downloads or external services.

Full documentation: **[plugins/plugin-architecture-dev/README.md](plugins/plugin-architecture-dev/README.md)**.

## Install

```
/plugin marketplace add /Volumes/MACDEV/pluggable-event-system
/plugin install plugin-architecture-dev
```

Start a new session, then:

```
/sdlc <your goal>
```

## Repository layout

```
.
├─ .claude-plugin/marketplace.json    # marketplace manifest (one plugin entry)
├─ packages/ai-contracts/             # TypeScript Zod contract package
├─ python/ai_contracts/               # Python Pydantic parity package
├─ fixtures/ai-contracts/             # Shared contract fixtures
├─ README.md                          # this file
└─ plugins/
   └─ plugin-architecture-dev/        # the plugin (see its README)
```
