# Pluggable Architecture Principles

Two uses:
1. **Checklist** the architecting and review phases apply when the *target* system is meant to be
   extensible (a plugin host, an editor, an event platform — Obsidian/VSCode style).
2. **Self-model** — this plugin is built on these same principles, so it is its own worked example.

## The 8 principles

1. **Lazy activation.** Nothing loads or runs until it is needed. Contributions declare *when* they
   activate (event, command, file type); the host defers cost until then.
   - *Obsidian:* plugins load on vault open but register handlers lazily.
   - *VSCode:* `activationEvents` (`onCommand:`, `onLanguage:`) — the extension host starts an
     extension only when a trigger fires.
   - *This plugin:* phases activate by predicate (`phase-registry.json.activation`); optional
     accelerators activate only when `capability-detection` finds them.

2. **Contribution-point manifest.** Extensions extend the host only through declared, named
   contribution points listed in a manifest — never by mutating host internals.
   - *VSCode:* `contributes` in `package.json` (commands, menus, languages, views).
   - *Obsidian:* `manifest.json` + registration APIs (`addCommand`, `registerView`).
   - *This plugin:* `phase-registry.json` is the contribution-point manifest. Add a phase = add a
     manifest entry + skill + agent. Core files are untouched.

3. **Event bus over mutation.** Components communicate by emitting/handling events on a shared bus,
   not by reaching into each other's state. Loose coupling; many listeners per event.
   - *VSCode:* `onDidChange*` event emitters; *Obsidian:* `workspace.on(...)`.
   - *This plugin:* Claude Code **hooks** are the event bus (`SessionStart`, `UserPromptSubmit`,
     `Stop`, `SubagentStop`). Phases coordinate through `.sdlc/` artifacts + the event log, not by
     calling each other.

4. **Sandbox / isolation.** A contribution runs in its own context; a failure or a heavy workload
   in one does not corrupt the host or its peers.
   - *VSCode:* the separate extension host process; *browsers:* per-extension isolation.
   - *This plugin:* each roster member is a **fresh subagent** with its own context window; a bad
     member fails in isolation and is retried, not cascaded.

5. **Capability / permission scoping.** A contribution requests the minimum capabilities it needs;
   the host grants no more. Least privilege is declared, not assumed.
   - *VSCode:* narrow API surface; *browsers:* `permissions` manifest.
   - *This plugin:* every agent declares a **minimal `tools`** list (researchers/reviewers are
     read-only; only the implementer writes). The evidence gate is the only path to completion.

6. **Semver-gated public API.** The host exposes a versioned, stable API; breaking changes bump the
   major version so extensions can depend on a contract.
   - *This plugin:* `plugin.json.version` (semver) and `phase-registry.json.schema_version`. Skills
     depend on the registry contract, not on each other's prose.

7. **Dependency resolution.** Contributions may depend on other contributions or host features;
   the host resolves order and reports missing/incompatible dependencies instead of failing opaquely.
   - *VSCode:* `extensionDependencies`; *this plugin:* `phase-registry.json` `order` + `next` define
     the phase DAG; `capability-detection` reports which optional deps are present.

8. **Registry + (hot) reload.** A registry enumerates installed contributions and can add/remove
   them without rebuilding the host; ideally without a full restart.
   - *Obsidian/VSCode:* enable/disable a plugin live; *this plugin:* the phase registry is read at
     runtime, and the marketplace install/enable flow adds the plugin without touching the host.

## Applying the checklist (architect + review phases)

When the target IS an extensible system, produce ADR answers to each:

- [ ] **Activation model** — what triggers each contribution? Is anything eagerly loaded that
      should be lazy?
- [ ] **Manifest** — is there a single declarative contribution manifest? Can you add a feature
      without editing core?
- [ ] **Communication** — events vs direct calls? Any hidden shared-mutable state?
- [ ] **Isolation** — blast radius of one misbehaving contribution? Crash containment?
- [ ] **Permissions** — least-privilege capability grants declared per contribution?
- [ ] **Versioning** — is the public API semver'd? Deprecation path?
- [ ] **Dependencies** — resolution order, missing-dependency behavior?
- [ ] **Registry/reload** — enumerate, enable/disable, hot-reload story?

Record gaps as ADR consequences or review findings (severity per impact).
