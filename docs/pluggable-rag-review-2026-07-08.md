# Pluggable RAG Contract System — SOTA Review & Verdict

*Date: 2026-07-08. Method: codemunch-indexed codebase exam + 3-agent research fan-out (web SOTA, GitHub OSS survey, Context7 docs verification). All external claims current to date checked.*

## System under review (verified from working tree)

Contracts-only layer, deliberately runtime-free:

- **`port-registry.yaml`** — single source of truth: 13 slots (9 `rag.*` + `provider.llm` + `provider.embedding` + `observability.sink`), named input/output ports with payload types, 13 legal connections, event naming `<slot>.<port>.<direction>.v1`.
- **`packages/ai-contracts`** — Zod v4 canonical schemas, native `z.toJSONSchema(..., { target: "draft-2020-12" })` wire export; CloudEvents 1.0 envelope (`BaseRagEventSchema`) with `rag_*` extensions (runId, invocationId, idempotencyKey, correlationid, causationid, traceparent, attempt, deadline); 26 live plugin descriptors (2 variants per slot, Ollama-cloud-backed); MCP tool metadata mapping (`mcp.ts`); registry validation + idempotency fingerprint (`registry.ts`).
- **Parity surfaces** — `python/ai_contracts` (Pydantic v2), `csharp/AiContracts` (133 records), shared `fixtures/ai-contracts`.
- **Discipline** — retired-scaffold test (no `mock`/`fake`/`memory://` in live surfaces), env-gated live Ollama smoke tests (`RUN_LIVE_SMOKE=1`), `.sdlc_validate.py` hard gate.

### Verification evidence

| Check | Result |
|---|---|
| `npm test` (vitest) | 11 pass, 3 gated-live skip |
| `pytest python/ai_contracts/tests` (via uv) | 6 pass |
| `python .sdlc_validate.py` | 100/100 |
| C# build | **not run** (no dotnet invoked) |
| Live Ollama smokes | **not run** (env-gated) |

## Pros

1. **Fills a real gap.** No OSS framework combines all four pillars — schema-checked edges + semver'd kind registry + idempotency digests + `ok/noop/retryable_error/fatal_error` result algebra. Haystack 2.x has typed sockets but no registry/semver; Dify/Flowise have registries/marketplaces but only nominal port categories; Dagster/Temporal have idempotency/durability but no RAG contracts. Closest newcomer (Atomic Agents) validates typed-I/O-schema composition but lacks the other three pillars.
2. **Thin contracts over heavy framework = 2026 SOTA convergence.** Avoids the documented LangChain abstraction-tax/churn failure mode; pluggability comes from the contract, not framework base classes.
3. **Correct wire dialect.** JSON Schema 2020-12 is still the latest stable dialect (next version "v1/2026" is IETF-draft only — do not target). Zod v4 native export is current best practice; no `zod-to-json-schema` dependency.
4. **CloudEvents envelope done right.** Versioned event types, correlation/causation/traceparent extensions — replay- and event-sourcing-ready ("The Log is the Agent", arXiv 2605.21997).
5. **Provider slots decoupled** (`provider.llm`, `provider.embedding` first-class; downstream stages take provider *refs*) — reusable beyond RAG.
6. **Real 3-language parity from shared fixtures** plus anti-drift scaffold-marker test.
7. **Cloud-safe live testing** — gated smokes hit cloud Ollama; no local model downloads.

## Cons

1. **Edge check brittle:** `JSON.stringify(A.outputSchema) !== B.inputSchema` (ragLego.ts `validateGraphCompatibility`). Key-order-sensitive — identical schemas serialized in different property order register incompatible. Strict equality is also stricter than anything shipped (Haystack: subtype-compatible Python types; schema registries: backward/forward/full levels) and rejects legitimate adapters and backward-compatible evolution.
2. **No runtime.** Zero executor/bus/dispatch code. Descriptors claim `filesystem-loader`, `ollama-nomic-embed-provider`, etc. — nothing implements them. The longer contracts sit unexecuted, the higher the drift risk.
3. **Python event parity shallow.** `CONTRACT_TYPED_DICTS` entries are `{"data": Any}` — names exist, payload structure unvalidated.
4. **52× deprecated `.strict()`** in schemas.ts. Zod v4 deprecates it; replacement is `z.strictObject()`. Parity trap: plain `z.object()` *strips* unknown keys while Pydantic `extra='forbid'` *raises* — only the strictObject / extra-forbid pair is a true semantic mirror.
5. **`idempotentHint ?? true` in `descriptorToMcpTool`** inverts the MCP spec default (`false`, safe-pessimistic; spec rev 2025-06-18). Hosts would skip confirmation on tools never proven idempotent.
6. **Semver decorative.** No rule connects version bumps to schema-compatibility classes; `1.0.1` may legally break its input schema.
7. **Fingerprint = colon-join, not hash.** Digests are free-form strings; no canonical digest computation exists. Content-addressing is declared, not implemented.
8. **Docs drifted behind code.** `references/rag-component-taxonomy.md`, `references/ai-engineering-contracts.md`, and `skills/ai-system-decomposition/SKILL.md` still describe the retired mock scaffold (deterministic fake vectors, `memory://`, 12 kinds vs the registry's 13 slots, "no external services" vs live Ollama descriptors).
9. **No retrieval-quality architecture.** Single retriever slot; SOTA baseline is sparse+dense concurrent → RRF (k=60) → cross-encoder rerank (~9pt MRR gain reported). No sparse/fusion slot; no per-component metric contract making variant swaps A/B-comparable.
10. **`$ref`s point at `schemas.pluggable-event-system.local`** — unresolvable for real validators; no `$defs` bundle or serving story.

## Suggestions (ranked)

1. **Fix the edge check** — canonicalize before compare (RFC 8785 JCS or sorted-key stringify), then upgrade strict equality to compatibility levels (backward/forward/full, Confluent data-contract semantics) keyed to semver. This also gives semver teeth: contract test asserting a minor bump is backward-compatible.
2. **Build a minimal runtime host next** — load descriptors, validate invocations, run component functions, enforce the result algebra, fingerprint-keyed cache returning `noop` on hit (Dagster `code_version`+`data_version` hash-and-skip; Temporal retryable-vs-fatal). Append events to a log for replay/fork. `filesystem-loader` → `markdown-text-parser` → one Ollama embedder = walkable skeleton.
3. **Real digests** — canonical-JSON + SHA-256 helpers in all three languages; fingerprint = hash, not colon-join; cross-language fixture test asserting identical digests.
4. **Migrate `.strict()` → `z.strictObject()`** (52 sites, mechanical); add both-language unknown-key-rejection parity tests.
5. **Deepen Python parity via codegen** — generate Pydantic event models from the exported JSON Schemas (e.g. datamodel-code-generator) instead of `data: Any` TypedDicts; the wire format becomes the actual SSoT.
6. **Flip `idempotentHint` default to `false`**; keep MCP annotations advisory only (spec: hints, never security gates).
7. **Sync the three stale reference docs** to port-registry reality.
8. **Add retrieval SOTA slots** — sparse-retriever variant + `rag.fusion` (RRF) slot; ship a per-slot metric contract (RAGAS panel: faithfulness / answer relevancy / context precision / context recall) so every variant swap is measurable.
9. **Schema bundle** — `exportJsonSchemas` should emit one bundle with `$defs` and resolvable `$id`s (or serve the registry) so external validators can resolve refs.

## Bottom line

The contract layer is genuinely novel and well-built — parity discipline, event envelope, and test gating are all above par. Two structural risks: the brittle equality check (bug-adjacent today) and the absent runtime (drift accumulator). Fix (1), build (2); everything else follows.

## Key sources

- Agentic RAG survey: arXiv 2501.09136 · Modular toolkit prior art: FlashRAG (WWW 2025 demo)
- Hybrid retrieval recipe (BM25+dense → RRF k=60 → rerank): digitalapplied.com hybrid-search reference 2026
- Content-addressed caching: OxyMake arXiv 2606.20989 · Event-sourced agent runs: arXiv 2605.21997
- Zod v4 JSON Schema: zod.dev/json-schema (v4.3.0) · Pydantic v2 dialect: docs/concepts/json_schema
- MCP tool annotations: modelcontextprotocol.io/specification/2025-06-18/server/tools
- Haystack connect-time validation: deepset-ai/haystack (+PR #8875) · Dagster data versioning docs · Atomic Agents RAG walkthrough (2026-02)
