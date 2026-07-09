# AI Engineering Contracts

The contract package represents AI engineering work as typed, idempotent plugins. TypeScript owns the canonical Zod schemas in `packages/ai-contracts`; JSON Schema Draft 2020-12 is the wire format; Python Pydantic v2 models validate parity from shared fixtures.

## Component Kinds

- `project.ingester`
- `project.decomposer`
- `rag.loader`
- `rag.parser`
- `rag.chunker`
- `rag.embedder`
- `rag.indexer`
- `rag.retriever`
- `rag.reranker`
- `rag.generator`
- `rag.evaluator`
- `observability.sink`

## Core Records

`PluginDescriptor` names a component, its semantic version, kind, config/input/output JSON Schemas, effects, MCP-style annotations, and capability tags.

`Invocation<TInput>` carries `runId`, `invocationId`, `idempotencyKey`, project reference, plugin name/version, config digest, input digest, typed input, optional deadline, cache policy, and trace context.

`PluginResult<TOutput>` is one of:

- `ok` with output and artifact refs.
- `noop` with reason and artifact refs.
- `retryable_error` with error and optional retry delay.
- `fatal_error` with error.

Domain payloads include `ProjectSnapshot`, `ComponentGraph`, `RagDocument`, `ChunkSet`, `EmbeddingBatch`, `IndexMutation`, `RetrievalQuery`, `RetrievalResult`, `GenerationContext`, and `EvaluationRecord`.

## Idempotency

Same plugin name + version + config digest + input digest + idempotency key must return the same artifact refs or `noop`. Components should write immutable artifacts addressed by digest or stable `memory://` refs in examples.

## Validation

- TypeScript: `npm test` and `npm run build`.
- Python parity: `python -m pytest python/ai_contracts/tests`.
- Plugin package: `python .sdlc_validate.py`.
