# RAG Component Taxonomy

The RAG contract set models every pipeline slot as a plugin and every port as an event boundary. The source of truth is `port-registry.yaml`.

Generated references:

- `rag-port-catalog.md` lists every slot, port, payload type, message type, event type, and legal connection.
- `rag-pipeline-slots.mmd` shows the event-based pipeline graph.
- `rag-aota-2026-07-08.md` records the current implementation basis.

## Slot Families

| Family | Kinds | Responsibility |
|---|---|---|
| Source preparation | `rag.loader`, `rag.parser`, `rag.chunker` | Load, normalize, and split source content. |
| Providers | `provider.embedding`, `provider.llm` | Wrap live model/provider APIs behind event contracts. |
| Indexing and storage | `rag.embedder`, `rag.indexer`, `rag.vectorstore` | Produce embeddings, write vector mutations, and expose collections. |
| Query and answer | `rag.retriever`, `rag.reranker`, `rag.generator`, `rag.evaluator` | Retrieve candidates, rank context, generate answers, and score outputs. |
| Operations | `observability.sink` | Persist or emit telemetry and artifact references. |

## Live Variants

Each slot has exactly two registered live plugin variants. Provider and vector-store slots are first-class components rather than hidden configuration:

- Embedding providers: Ollama `nomic-embed-text-v2-moe:latest` and Ollama `bge-m3:567m`.
- LLM providers: Ollama `deepseek-v4-flash:cloud` and OpenAI `gpt-4o-mini`.
- Vector stores: Qdrant and ChromaDB.

## Compatibility Rule

A legal graph edge always connects an output port to an input port with the same payload shape. Tests validate the registry, generated event contracts, descriptor coverage, and legal edge compatibility.
