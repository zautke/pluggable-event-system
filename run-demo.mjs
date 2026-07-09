#!/usr/bin/env node
import {
  RagDocumentSchema,
  runMockIngestion,
  runMockQuery
} from './packages/ai-contracts/src/ragLego.js';

console.log('=== PLUGGABLE RAG LIVE DEMO ===\n');

// Document 1: About the system
const doc1 = {
  documentId: 'doc-001',
  source: { uri: 'memory://pluggable-rag-system', digest: 'abc123' },
  text: `The pluggable event-driven RAG system uses JSON Schema contracts to define component I/O.
Each component declares versioned input and output schemas. Components connect when output schema
equals input schema. Event envelopes follow CloudEvents 1.0 with rag_* extensions for tracing.
The port registry specifies 13 slots across ingestion, retrieval, and generation pipelines.
Idempotency is keyed on (component name, version, config digest, input digest, idempotency key).`,
  metadata: { type: 'system-architecture', source: 'docs' }
};

// Document 2: About RAG best practices
const doc2 = {
  documentId: 'doc-002',
  source: { uri: 'memory://rag-sota-2026', digest: 'def456' },
  text: `Modular RAG in 2026 uses hybrid retrieval: run BM25 sparse and dense vector ANN concurrently,
fuse top-50 from each with Reciprocal Rank Fusion (k=60), then cross-encoder rerank top-20 hits.
This hybrid+rerank approach achieves ~66% MRR versus ~57% for semantic-only retrieval.
Idempotency via content-addressed cache keys means same input always returns same cached artifact.
Eval metrics (faithfulness, answer relevancy, context precision/recall) should be per-component.`,
  metadata: { type: 'rag-best-practices', source: 'sota-2026' }
};

console.log('📥 INGESTION PHASE\n');
console.log('--- Document 1: System Architecture ---');
console.log(`ID: ${doc1.documentId}`);
console.log(`Chunks: `, doc1.text.split(/\n/).length, 'lines\n');

const ingest1 = runMockIngestion(RagDocumentSchema.parse(doc1));
console.log(`✓ Ingested: ${ingest1.chunks.chunks.length} chunks`);
console.log(`✓ Embeddings: ${ingest1.embeddings.vectors.length} vectors (deterministic)\n`);

console.log('--- Document 2: RAG Best Practices ---');
console.log(`ID: ${doc2.documentId}`);
console.log(`Chunks: `, doc2.text.split(/\n/).length, 'lines\n');

const ingest2 = runMockIngestion(RagDocumentSchema.parse(doc2));
console.log(`✓ Ingested: ${ingest2.chunks.chunks.length} chunks`);
console.log(`✓ Embeddings: ${ingest2.embeddings.vectors.length} vectors (deterministic)\n`);

console.log('=== RETRIEVAL PHASE ===\n');

const corpus = [doc1, doc2];
console.log('📤 Query: "How do you achieve high retrieval quality?"\n');

const query = {
  queryId: 'query-001',
  text: 'How do you achieve high retrieval quality?',
  topK: 3
};

const result = runMockQuery(query, corpus);

console.log(`Query: "${result.query.text}"`);
console.log(`Top-${result.retrieval.hits.length} hits:\n`);

result.retrieval.hits.forEach((hit, i) => {
  console.log(`  ${i + 1}. Score: ${hit.score.toFixed(2)} | ${hit.chunkId}`);
  console.log(`     "${hit.text.substring(0, 70)}..."\n`);
});

console.log('--- Answer from Generation ---');
console.log(result.answer);
console.log('\n=== REPORT ===\n');

const stats = {
  documentsIngested: 2,
  totalChunks: ingest1.chunks.chunks.length + ingest2.chunks.chunks.length,
  totalEmbeddings: ingest1.embeddings.vectors.length + ingest2.embeddings.vectors.length,
  queriesExecuted: 1,
  retrievedHits: result.retrieval.hits.length,
  indexMutations: 2
};

console.log('Ingestion Summary:');
console.log(`  • Documents: ${stats.documentsIngested}`);
console.log(`  • Total chunks: ${stats.totalChunks}`);
console.log(`  • Embeddings generated: ${stats.totalEmbeddings} (deterministic, 4-dim)`);
console.log(`  • Index mutations: ${stats.indexMutations}\n`);

console.log('Retrieval Summary:');
console.log(`  • Queries: ${stats.queriesExecuted}`);
console.log(`  • Results retrieved: ${stats.retrievedHits}/${stats.totalChunks}`);
console.log(`  • Scoring: keyword match (1.0 if query in chunk, 0.25 else)\n`);

console.log('✓ System operational: contracts validated, deterministic pipeline executed.');
