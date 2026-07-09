# RAG Port Catalog

Generated from `port-registry.yaml`.

## Event Envelope

All messages use a CloudEvents-aligned JSON envelope. Required fields are `specversion`, `id`, `type`, `source`, `time`, `datacontenttype`, `data`, `rag_port`, `rag_direction`, `rag_componentkind`, `rag_pluginname`, and `rag_pluginversion`.

Event type names use `<slot>.<port>.<direction>.v<major>`. Output `data` uses `status: "success"` with `output`, or `status: "error"` with `error`.

## Ports

| Slot | Direction | Port | Payload | Message | Event |
|---|---|---|---|---|---|
| `rag.loader` | input | `loadRequest` | `LoaderLoadRequestInputPayload` | `LoaderLoadRequestInputMessage` | `loader.loadRequest.input.v1` |
| `rag.loader` | output | `sourceArtifact` | `LoaderSourceArtifactOutputPayload` | `LoaderSourceArtifactOutputMessage` | `loader.sourceArtifact.output.v1` |
| `rag.loader` | output | `rawDocument` | `LoaderRawDocumentOutputPayload` | `LoaderRawDocumentOutputMessage` | `loader.rawDocument.output.v1` |
| `rag.parser` | input | `rawDocument` | `ParserRawDocumentInputPayload` | `ParserRawDocumentInputMessage` | `parser.rawDocument.input.v1` |
| `rag.parser` | output | `parsedDocument` | `ParserParsedDocumentOutputPayload` | `ParserParsedDocumentOutputMessage` | `parser.parsedDocument.output.v1` |
| `rag.chunker` | input | `parsedDocument` | `ChunkerParsedDocumentInputPayload` | `ChunkerParsedDocumentInputMessage` | `chunker.parsedDocument.input.v1` |
| `rag.chunker` | output | `chunkSet` | `ChunkerChunkSetOutputPayload` | `ChunkerChunkSetOutputMessage` | `chunker.chunkSet.output.v1` |
| `provider.embedding` | input | `embeddingRequest` | `EmbeddingEmbeddingRequestInputPayload` | `EmbeddingEmbeddingRequestInputMessage` | `embedding.embeddingRequest.input.v1` |
| `provider.embedding` | output | `embeddingBatch` | `EmbeddingEmbeddingBatchOutputPayload` | `EmbeddingEmbeddingBatchOutputMessage` | `embedding.embeddingBatch.output.v1` |
| `rag.embedder` | input | `chunkSet` | `EmbedderChunkSetInputPayload` | `EmbedderChunkSetInputMessage` | `embedder.chunkSet.input.v1` |
| `rag.embedder` | input | `embeddingProvider` | `EmbedderEmbeddingProviderInputPayload` | `EmbedderEmbeddingProviderInputMessage` | `embedder.embeddingProvider.input.v1` |
| `rag.embedder` | output | `embeddingBatch` | `EmbedderEmbeddingBatchOutputPayload` | `EmbedderEmbeddingBatchOutputMessage` | `embedder.embeddingBatch.output.v1` |
| `rag.vectorstore` | input | `collectionRequest` | `VectorstoreCollectionRequestInputPayload` | `VectorstoreCollectionRequestInputMessage` | `vectorstore.collectionRequest.input.v1` |
| `rag.vectorstore` | input | `indexMutation` | `VectorstoreIndexMutationInputPayload` | `VectorstoreIndexMutationInputMessage` | `vectorstore.indexMutation.input.v1` |
| `rag.vectorstore` | input | `vectorQuery` | `VectorstoreVectorQueryInputPayload` | `VectorstoreVectorQueryInputMessage` | `vectorstore.vectorQuery.input.v1` |
| `rag.vectorstore` | output | `collectionRef` | `VectorstoreCollectionRefOutputPayload` | `VectorstoreCollectionRefOutputMessage` | `vectorstore.collectionRef.output.v1` |
| `rag.vectorstore` | output | `candidateSet` | `VectorstoreCandidateSetOutputPayload` | `VectorstoreCandidateSetOutputMessage` | `vectorstore.candidateSet.output.v1` |
| `rag.indexer` | input | `chunkSet` | `IndexerChunkSetInputPayload` | `IndexerChunkSetInputMessage` | `indexer.chunkSet.input.v1` |
| `rag.indexer` | input | `embeddingBatch` | `IndexerEmbeddingBatchInputPayload` | `IndexerEmbeddingBatchInputMessage` | `indexer.embeddingBatch.input.v1` |
| `rag.indexer` | input | `vectorStore` | `IndexerVectorStoreInputPayload` | `IndexerVectorStoreInputMessage` | `indexer.vectorStore.input.v1` |
| `rag.indexer` | output | `indexMutation` | `IndexerIndexMutationOutputPayload` | `IndexerIndexMutationOutputMessage` | `indexer.indexMutation.output.v1` |
| `rag.indexer` | output | `collectionRef` | `IndexerCollectionRefOutputPayload` | `IndexerCollectionRefOutputMessage` | `indexer.collectionRef.output.v1` |
| `rag.retriever` | input | `retrievalQuery` | `RetrieverRetrievalQueryInputPayload` | `RetrieverRetrievalQueryInputMessage` | `retriever.retrievalQuery.input.v1` |
| `rag.retriever` | input | `embeddingProvider` | `RetrieverEmbeddingProviderInputPayload` | `RetrieverEmbeddingProviderInputMessage` | `retriever.embeddingProvider.input.v1` |
| `rag.retriever` | input | `vectorStore` | `RetrieverVectorStoreInputPayload` | `RetrieverVectorStoreInputMessage` | `retriever.vectorStore.input.v1` |
| `rag.retriever` | output | `candidateSet` | `RetrieverCandidateSetOutputPayload` | `RetrieverCandidateSetOutputMessage` | `retriever.candidateSet.output.v1` |
| `rag.reranker` | input | `retrievalQuery` | `RerankerRetrievalQueryInputPayload` | `RerankerRetrievalQueryInputMessage` | `reranker.retrievalQuery.input.v1` |
| `rag.reranker` | input | `candidateSet` | `RerankerCandidateSetInputPayload` | `RerankerCandidateSetInputMessage` | `reranker.candidateSet.input.v1` |
| `rag.reranker` | input | `llmProvider` | `RerankerLlmProviderInputPayload` | `RerankerLlmProviderInputMessage` | `reranker.llmProvider.input.v1` |
| `rag.reranker` | output | `rerankedSet` | `RerankerRerankedSetOutputPayload` | `RerankerRerankedSetOutputMessage` | `reranker.rerankedSet.output.v1` |
| `provider.llm` | input | `llmRequest` | `LlmLlmRequestInputPayload` | `LlmLlmRequestInputMessage` | `llm.llmRequest.input.v1` |
| `provider.llm` | output | `llmResponse` | `LlmLlmResponseOutputPayload` | `LlmLlmResponseOutputMessage` | `llm.llmResponse.output.v1` |
| `rag.generator` | input | `generationRequest` | `GeneratorGenerationRequestInputPayload` | `GeneratorGenerationRequestInputMessage` | `generator.generationRequest.input.v1` |
| `rag.generator` | input | `rerankedSet` | `GeneratorRerankedSetInputPayload` | `GeneratorRerankedSetInputMessage` | `generator.rerankedSet.input.v1` |
| `rag.generator` | input | `llmProvider` | `GeneratorLlmProviderInputPayload` | `GeneratorLlmProviderInputMessage` | `generator.llmProvider.input.v1` |
| `rag.generator` | output | `answer` | `GeneratorAnswerOutputPayload` | `GeneratorAnswerOutputMessage` | `generator.answer.output.v1` |
| `rag.generator` | output | `generationContext` | `GeneratorGenerationContextOutputPayload` | `GeneratorGenerationContextOutputMessage` | `generator.generationContext.output.v1` |
| `rag.evaluator` | input | `evaluationRequest` | `EvaluatorEvaluationRequestInputPayload` | `EvaluatorEvaluationRequestInputMessage` | `evaluator.evaluationRequest.input.v1` |
| `rag.evaluator` | input | `generationContext` | `EvaluatorGenerationContextInputPayload` | `EvaluatorGenerationContextInputMessage` | `evaluator.generationContext.input.v1` |
| `rag.evaluator` | input | `llmProvider` | `EvaluatorLlmProviderInputPayload` | `EvaluatorLlmProviderInputMessage` | `evaluator.llmProvider.input.v1` |
| `rag.evaluator` | output | `evaluationRecord` | `EvaluatorEvaluationRecordOutputPayload` | `EvaluatorEvaluationRecordOutputMessage` | `evaluator.evaluationRecord.output.v1` |
| `observability.sink` | input | `telemetryEvent` | `ObservabilityTelemetryEventInputPayload` | `ObservabilityTelemetryEventInputMessage` | `observability.telemetryEvent.input.v1` |
| `observability.sink` | output | `artifactRef` | `ObservabilityArtifactRefOutputPayload` | `ObservabilityArtifactRefOutputMessage` | `observability.artifactRef.output.v1` |

## Legal Connections

| From | To | Payload |
|---|---|---|
| `rag.loader.rawDocument` | `rag.parser.rawDocument` | `RawDocument` |
| `rag.parser.parsedDocument` | `rag.chunker.parsedDocument` | `ParsedDocument` |
| `rag.chunker.chunkSet` | `rag.embedder.chunkSet` | `ChunkSet` |
| `rag.chunker.chunkSet` | `rag.indexer.chunkSet` | `ChunkSet` |
| `rag.embedder.embeddingBatch` | `rag.indexer.embeddingBatch` | `EmbeddingBatch` |
| `rag.indexer.indexMutation` | `rag.vectorstore.indexMutation` | `IndexMutation` |
| `rag.indexer.collectionRef` | `rag.retriever.vectorStore` | `CollectionRef` |
| `rag.vectorstore.collectionRef` | `rag.indexer.vectorStore` | `CollectionRef` |
| `rag.vectorstore.collectionRef` | `rag.retriever.vectorStore` | `CollectionRef` |
| `rag.vectorstore.candidateSet` | `rag.reranker.candidateSet` | `CandidateSet` |
| `rag.retriever.candidateSet` | `rag.reranker.candidateSet` | `CandidateSet` |
| `rag.reranker.rerankedSet` | `rag.generator.rerankedSet` | `RerankedSet` |
| `rag.generator.generationContext` | `rag.evaluator.generationContext` | `GenerationContext` |
