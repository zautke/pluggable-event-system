# Indexing Proof Report

Generated: 2026-07-09T18:59:59.812Z
Repository: `/private/tmp/test-repo-run`
Database: `/private/tmp/test-repo-run/.repo-context/proof-index.db`
Embedding: `openai` / `text-embedding-3-small`

## Status

- Files: 2
- Chunks: 2
- Embeddings: 2
- BM25 documents: 2
- Embedding models: text-embedding-3-small (2; dims 1536)

## Summary

- Overall: FAIL
- Runs: 0/19 passed
- Vector: 0/8
- Hybrid: 0/8
- Keyword: 0/3

## Failures

- Hybrid search acceptance failed: 0/8 runs passed (expected all).
- Vector search acceptance failed: 0/8 runs passed (expected at least 6).
- Keyword search acceptance failed: 0/3 runs passed (expected all).
- vector:Where is the repository walker implemented? -> Expected file not found in top 3
- hybrid:Where is the repository walker implemented? -> Expected file not found in top 3
- keyword:Where is the repository walker implemented? -> Expected file not found in top 5
- vector:How does the indexing pipeline store chunks and embeddings? -> Expected file not found in top 3
- hybrid:How does the indexing pipeline store chunks and embeddings? -> Expected file not found in top 3
- vector:Which file defines the SQLite chunks schema? -> Expected file not found in top 3
- hybrid:Which file defines the SQLite chunks schema? -> Expected file not found in top 3
- keyword:Which file defines the SQLite chunks schema? -> Expected file not found in top 5
- vector:How are local Ollama embeddings fetched? -> Expected file not found in top 3
- hybrid:How are local Ollama embeddings fetched? -> Expected file not found in top 3
- vector:How does chunking fall back when AST parsing fails? -> Expected file not found in top 3
- hybrid:How does chunking fall back when AST parsing fails? -> Expected file not found in top 3
- vector:How is TSX parsing selected instead of plain TypeScript? -> Expected file not found in top 3
- hybrid:How is TSX parsing selected instead of plain TypeScript? -> Expected file not found in top 3
- vector:Where is the ingestion pipeline walkthrough documented? -> Expected file not found in top 3
- hybrid:Where is the ingestion pipeline walkthrough documented? -> Expected file not found in top 3
- vector:Which file implements the ingestion API route? -> Expected file not found in top 3
- hybrid:Which file implements the ingestion API route? -> Expected file not found in top 3
- keyword:Which file implements the ingestion API route? -> Expected file not found in top 5

## Query Evidence

### VECTOR - Where is the repository walker implemented?

- Expected: `src/indexer/walker.ts`
- Required rank: top 3
- Result: FAIL
- Top hit: `retrieval.ts`
- Failure reason: Expected file not found in top 3

1. `retrieval.ts:1-10` score 56.7%
   // Retrieval and ranking functions
export function rankByRelevance(hits: any[], query: string) {
  return hits.sort((a, b) => b.score - a.score);
2. `auth.ts:1-12` score 55.9%
   // Authentication middleware
export function validateToken(token: string): boolean {
  if (!token) return false;

### HYBRID - Where is the repository walker implemented?

- Expected: `src/indexer/walker.ts`
- Required rank: top 3
- Result: FAIL
- Top hit: `retrieval.ts`
- Failure reason: Expected file not found in top 3

1. `retrieval.ts:1-10` score 28.3%
   // Retrieval and ranking functions
export function rankByRelevance(hits: any[], query: string) {
  return hits.sort((a, b) => b.score - a.score);
2. `auth.ts:1-12` score 28.0%
   // Authentication middleware
export function validateToken(token: string): boolean {
  if (!token) return false;

### KEYWORD - Where is the repository walker implemented?

- Expected: `src/indexer/walker.ts`
- Required rank: top 5
- Result: FAIL
- Top hit: none
- Failure reason: Expected file not found in top 5

No hits returned.

### VECTOR - How does the indexing pipeline store chunks and embeddings?

- Expected: `src/api/pipeline.ts`, `src/storage/store.ts`
- Required rank: top 3
- Result: FAIL
- Top hit: `retrieval.ts`
- Failure reason: Expected file not found in top 3

1. `retrieval.ts:1-10` score 62.7%
   // Retrieval and ranking functions
export function rankByRelevance(hits: any[], query: string) {
  return hits.sort((a, b) => b.score - a.score);
2. `auth.ts:1-12` score 55.2%
   // Authentication middleware
export function validateToken(token: string): boolean {
  if (!token) return false;

### HYBRID - How does the indexing pipeline store chunks and embeddings?

- Expected: `src/api/pipeline.ts`, `src/storage/store.ts`
- Required rank: top 3
- Result: FAIL
- Top hit: `retrieval.ts`
- Failure reason: Expected file not found in top 3

1. `retrieval.ts:1-10` score 31.4%
   // Retrieval and ranking functions
export function rankByRelevance(hits: any[], query: string) {
  return hits.sort((a, b) => b.score - a.score);
2. `auth.ts:1-12` score 27.6%
   // Authentication middleware
export function validateToken(token: string): boolean {
  if (!token) return false;

### VECTOR - Which file defines the SQLite chunks schema?

- Expected: `src/storage/schema.ts`
- Required rank: top 3
- Result: FAIL
- Top hit: `retrieval.ts`
- Failure reason: Expected file not found in top 3

1. `retrieval.ts:1-10` score 56.5%
   // Retrieval and ranking functions
export function rankByRelevance(hits: any[], query: string) {
  return hits.sort((a, b) => b.score - a.score);
2. `auth.ts:1-12` score 54.1%
   // Authentication middleware
export function validateToken(token: string): boolean {
  if (!token) return false;

### HYBRID - Which file defines the SQLite chunks schema?

- Expected: `src/storage/schema.ts`
- Required rank: top 3
- Result: FAIL
- Top hit: `retrieval.ts`
- Failure reason: Expected file not found in top 3

1. `retrieval.ts:1-10` score 28.2%
   // Retrieval and ranking functions
export function rankByRelevance(hits: any[], query: string) {
  return hits.sort((a, b) => b.score - a.score);
2. `auth.ts:1-12` score 27.0%
   // Authentication middleware
export function validateToken(token: string): boolean {
  if (!token) return false;

### KEYWORD - Which file defines the SQLite chunks schema?

- Expected: `src/storage/schema.ts`
- Required rank: top 5
- Result: FAIL
- Top hit: none
- Failure reason: Expected file not found in top 5

No hits returned.

### VECTOR - How are local Ollama embeddings fetched?

- Expected: `src/indexer/embedder.ts`
- Required rank: top 3
- Result: FAIL
- Top hit: `retrieval.ts`
- Failure reason: Expected file not found in top 3

1. `retrieval.ts:1-10` score 59.9%
   // Retrieval and ranking functions
export function rankByRelevance(hits: any[], query: string) {
  return hits.sort((a, b) => b.score - a.score);
2. `auth.ts:1-12` score 54.9%
   // Authentication middleware
export function validateToken(token: string): boolean {
  if (!token) return false;

### HYBRID - How are local Ollama embeddings fetched?

- Expected: `src/indexer/embedder.ts`
- Required rank: top 3
- Result: FAIL
- Top hit: `retrieval.ts`
- Failure reason: Expected file not found in top 3

1. `retrieval.ts:1-10` score 29.9%
   // Retrieval and ranking functions
export function rankByRelevance(hits: any[], query: string) {
  return hits.sort((a, b) => b.score - a.score);
2. `auth.ts:1-12` score 27.5%
   // Authentication middleware
export function validateToken(token: string): boolean {
  if (!token) return false;

### VECTOR - How does chunking fall back when AST parsing fails?

- Expected: `src/indexer/chunker.ts`
- Required rank: top 3
- Result: FAIL
- Top hit: `retrieval.ts`
- Failure reason: Expected file not found in top 3

1. `retrieval.ts:1-10` score 59.3%
   // Retrieval and ranking functions
export function rankByRelevance(hits: any[], query: string) {
  return hits.sort((a, b) => b.score - a.score);
2. `auth.ts:1-12` score 58.3%
   // Authentication middleware
export function validateToken(token: string): boolean {
  if (!token) return false;

### HYBRID - How does chunking fall back when AST parsing fails?

- Expected: `src/indexer/chunker.ts`
- Required rank: top 3
- Result: FAIL
- Top hit: `retrieval.ts`
- Failure reason: Expected file not found in top 3

1. `retrieval.ts:1-10` score 29.6%
   // Retrieval and ranking functions
export function rankByRelevance(hits: any[], query: string) {
  return hits.sort((a, b) => b.score - a.score);
2. `auth.ts:1-12` score 29.1%
   // Authentication middleware
export function validateToken(token: string): boolean {
  if (!token) return false;

### VECTOR - How is TSX parsing selected instead of plain TypeScript?

- Expected: `src/indexer/parser.ts`
- Required rank: top 3
- Result: FAIL
- Top hit: `retrieval.ts`
- Failure reason: Expected file not found in top 3

1. `retrieval.ts:1-10` score 62.1%
   // Retrieval and ranking functions
export function rankByRelevance(hits: any[], query: string) {
  return hits.sort((a, b) => b.score - a.score);
2. `auth.ts:1-12` score 60.5%
   // Authentication middleware
export function validateToken(token: string): boolean {
  if (!token) return false;

### HYBRID - How is TSX parsing selected instead of plain TypeScript?

- Expected: `src/indexer/parser.ts`
- Required rank: top 3
- Result: FAIL
- Top hit: `retrieval.ts`
- Failure reason: Expected file not found in top 3

1. `retrieval.ts:1-10` score 31.0%
   // Retrieval and ranking functions
export function rankByRelevance(hits: any[], query: string) {
  return hits.sort((a, b) => b.score - a.score);
2. `auth.ts:1-12` score 30.3%
   // Authentication middleware
export function validateToken(token: string): boolean {
  if (!token) return false;

### VECTOR - Where is the ingestion pipeline walkthrough documented?

- Expected: `docs/INGESTION_PIPELINE_WALKTHROUGH.md`
- Required rank: top 3
- Result: FAIL
- Top hit: `retrieval.ts`
- Failure reason: Expected file not found in top 3

1. `retrieval.ts:1-10` score 54.1%
   // Retrieval and ranking functions
export function rankByRelevance(hits: any[], query: string) {
  return hits.sort((a, b) => b.score - a.score);
2. `auth.ts:1-12` score 53.2%
   // Authentication middleware
export function validateToken(token: string): boolean {
  if (!token) return false;

### HYBRID - Where is the ingestion pipeline walkthrough documented?

- Expected: `docs/INGESTION_PIPELINE_WALKTHROUGH.md`
- Required rank: top 3
- Result: FAIL
- Top hit: `retrieval.ts`
- Failure reason: Expected file not found in top 3

1. `retrieval.ts:1-10` score 27.1%
   // Retrieval and ranking functions
export function rankByRelevance(hits: any[], query: string) {
  return hits.sort((a, b) => b.score - a.score);
2. `auth.ts:1-12` score 26.6%
   // Authentication middleware
export function validateToken(token: string): boolean {
  if (!token) return false;

### VECTOR - Which file implements the ingestion API route?

- Expected: `ui/src/app/api/ingestion/route.ts`
- Required rank: top 3
- Result: FAIL
- Top hit: `auth.ts`
- Failure reason: Expected file not found in top 3

1. `auth.ts:1-12` score 56.6%
   // Authentication middleware
export function validateToken(token: string): boolean {
  if (!token) return false;
2. `retrieval.ts:1-10` score 56.0%
   // Retrieval and ranking functions
export function rankByRelevance(hits: any[], query: string) {
  return hits.sort((a, b) => b.score - a.score);

### HYBRID - Which file implements the ingestion API route?

- Expected: `ui/src/app/api/ingestion/route.ts`
- Required rank: top 3
- Result: FAIL
- Top hit: `auth.ts`
- Failure reason: Expected file not found in top 3

1. `auth.ts:1-12` score 28.3%
   // Authentication middleware
export function validateToken(token: string): boolean {
  if (!token) return false;
2. `retrieval.ts:1-10` score 28.0%
   // Retrieval and ranking functions
export function rankByRelevance(hits: any[], query: string) {
  return hits.sort((a, b) => b.score - a.score);

### KEYWORD - Which file implements the ingestion API route?

- Expected: `ui/src/app/api/ingestion/route.ts`
- Required rank: top 5
- Result: FAIL
- Top hit: none
- Failure reason: Expected file not found in top 5

No hits returned.
