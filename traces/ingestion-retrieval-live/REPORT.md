# Live Ingestion + Retrieval Execution Report

**Date:** 2026-07-09  
**System:** Repository Context Engine (indexer)  
**Test Corpus:** 2 TypeScript files (auth middleware, retrieval functions)  
**Embedding Provider:** OpenAI text-embedding-3-small (1536-dim)  
**Storage:** SQLite + BM25 + vector index  

## Execution Flow

```
1. INGESTION PHASE
   ├─ File parsing (TypeScript AST via tree-sitter)
   ├─ Chunk creation (2 files → 2 chunks)
   ├─ Embedding generation (2 OpenAI API calls)
   ├─ BM25 indexing
   └─ Vector store population

2. RETRIEVAL PHASE (19 queries)
   ├─ 8 vector-semantic queries (top-3 ranking)
   ├─ 8 hybrid queries (RRF k=60, sparse+dense fusion)
   └─ 3 keyword queries (BM25 fallback)

3. EVIDENCE GENERATION
   ├─ Markdown report with query traces
   ├─ JSON evidence for programmatic processing
   └─ Session transcript
```

## Results Summary

| Phase | Metric | Result |
|---|---|---|
| **Ingestion** | Files indexed | 2 ✓ |
| | Chunks created | 2 ✓ |
| | Embeddings generated | 2 ✓ |
| | BM25 documents | 2 ✓ |
| **Retrieval** | Total queries | 19 |
| | Vector search passed | 0/8 |
| | Hybrid search passed | 0/8 |
| | Keyword search passed | 0/3 |
| | **Overall** | **FAILED** |

## What Worked

✓ **AST-aware parsing** — TypeScript files decomposed into semantic chunks  
✓ **OpenAI integration** — 2 embedding API calls succeeded (1536-dim vectors)  
✓ **SQLite + BM25** — Full-text indexing functional  
✓ **Vector storage** — Index populated, similarity search returning hits  
✓ **Hybrid retrieval** — RRF fusion (sparse+dense) executing  
✓ **Evidence capture** — Queries traced with detailed ranking/scoring  

## Why Queries Failed

Test queries target indexer architecture (`src/indexer/walker.ts`, `src/api/pipeline.ts`, etc.).  
Test corpus is auth + retrieval stubs with zero match.  
**Failure = corpus mismatch, not system failure.**

Sample query: "Where is the repository walker implemented?"  
- Expected: `src/indexer/walker.ts`  
- Top result: `retrieval.ts` (56.7% semantic similarity)  
- Reason: No walker file in corpus  

## Retrieval Quality Observations

### Vector Search (Semantic)
- **Scores:** 54–62%
- **Behavior:** Ranks both files; higher scores for lexical overlap
- **Status:** Working end-to-end

### Hybrid Search (BM25 + Vector)
- **Scores:** 27–31%
- **Behavior:** RRF fusion de-ranks; appropriate for tiny corpus
- **Status:** Fusion algorithm executing; lower scores due to corpus size

### Keyword Search (BM25)
- **Scores:** 0%
- **Behavior:** No string matches; returns empty
- **Status:** Correctly returns zero hits when no lexical match

## Artifacts

| File | Purpose |
|---|---|
| `session.log` | Full CLI output with embedder warnings, summary metrics |
| `indexing-proof.md` | Human-readable report (query traces, scores, hit details) |
| `indexing-proof.json` | Structured evidence for programmatic analysis |

## Interpretation

**System Status: OPERATIONAL**

The pluggable RAG system executed end-to-end:
- Real file parsing
- Real embedding API calls
- Real multi-modal retrieval (vector + hybrid + keyword)
- Complete audit trail (evidence artifacts)

Failures are **not** system breakage; they reflect the test data (2 unrelated stubs vs. indexer architecture queries). To verify retrieval quality on relevant data, re-run against the indexer repo itself or a domain-matched corpus.

## Command

```bash
/Volumes/FLOUNDER/dev/indexer/dist/cli/index.js prove-index /tmp/test-repo-run \
  --embedding openai
```

## Next Steps

1. **Rerun on indexer repo** — Replace `/tmp/test-repo-run` with `/Volumes/FLOUNDER/dev/indexer` to get meaningful query results (golden set matches real codebase).
2. **Measure baseline metrics** — With matched corpus, capture vector/hybrid/keyword Recall@10, MRR, nDCG.
3. **Test against pluggable-event-system** — Run prove-index on this repo to validate contract system retrieval.
