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
├─ README.md                          # this file
└─ plugins/
   └─ plugin-architecture-dev/        # the plugin (see its README)
```
