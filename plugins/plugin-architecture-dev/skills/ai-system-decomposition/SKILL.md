---
name: ai-system-decomposition
description: Use to model AI engineering systems as typed, idempotent plugin components with JSON Schema contracts, including project ingestion, component decomposition, and deterministic RAG lego pipelines.
---

# AI System Decomposition

Model AI engineering work as small plugin components with explicit contracts.

## Start

1. Use CodeMunch first when available (`plan_turn`, `resolve_repo`, symbol/text search). If it is not available, state that and use the repository's best local search/index fallback.
2. Identify the requested mode:
   - **ingestion:** produce or validate a `ProjectSnapshot`.
   - **decomposition:** produce a `ComponentGraph` of typed plugins.
   - **RAG lego:** scaffold or explain a loader -> parser -> chunker -> embedder -> indexer and query -> retriever -> reranker -> generator -> evaluator graph.
3. Use `${CLAUDE_PLUGIN_ROOT}/references/ai-engineering-contracts.md` as the wire-contract source and `${CLAUDE_PLUGIN_ROOT}/references/rag-component-taxonomy.md` for RAG component boundaries.

## Contract Rules

- TypeScript Zod schemas in `packages/ai-contracts` are canonical.
- JSON Schema Draft 2020-12 is the wire format.
- Python Pydantic models in `python/ai_contracts` are parity validators, not a second schema source.
- Every plugin invocation includes `runId`, `invocationId`, `idempotencyKey`, project reference, plugin name/version, config digest, input digest, and typed input.
- Same plugin name + version + config digest + input digest + idempotency key returns the same artifact refs or `noop`.
- Examples must be cloud-safe: no local model downloads, no vector database dependency, no large cache writes.

## Output

- For ingestion: `ProjectSnapshot` JSON plus the ingester `PluginDescriptor`.
- For decomposition: `ComponentGraph` JSON and descriptors for each node.
- For RAG lego: compatible descriptors and graph edges; prove each upstream output schema equals the downstream input schema.

Return concise artifact paths and validation commands when files are created.
