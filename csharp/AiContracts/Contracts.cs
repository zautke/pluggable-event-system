using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Schema;
using System.Text.Json.Serialization;

namespace AiContracts;

public sealed record RagError
{
    [JsonPropertyName("code")]
    public required string Code { get; init; }

    [JsonPropertyName("message")]
    public required string Message { get; init; }

    [JsonPropertyName("retryable")]
    public required bool Retryable { get; init; }

    [JsonPropertyName("details")]
    public Dictionary<string, JsonElement>? Details { get; init; }
}

public abstract record ContractPayload;

public abstract record ContractMessage<TPayload>
{
    [JsonPropertyName("status")]
    public string? Status { get; init; }

    [JsonPropertyName("output")]
    public TPayload? Output { get; init; }

    [JsonPropertyName("error")]
    public RagError? Error { get; init; }
}

public abstract record RagEvent
{
    [JsonPropertyName("specversion")]
    public required string Specversion { get; init; }

    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("type")]
    public required string Type { get; init; }

    [JsonPropertyName("source")]
    public required string Source { get; init; }

    [JsonPropertyName("time")]
    public required DateTimeOffset Time { get; init; }

    [JsonPropertyName("datacontenttype")]
    public required string DataContentType { get; init; }

    [JsonPropertyName("data")]
    public required JsonElement Data { get; init; }

    [JsonPropertyName("rag_port")]
    public required string RagPort { get; init; }

    [JsonPropertyName("rag_direction")]
    public required string RagDirection { get; init; }

    [JsonPropertyName("rag_componentkind")]
    public required string RagComponentKind { get; init; }

    [JsonPropertyName("rag_pluginname")]
    public required string RagPluginName { get; init; }

    [JsonPropertyName("rag_pluginversion")]
    public required string RagPluginVersion { get; init; }

    [JsonPropertyName("subject")]
    public string? Subject { get; init; }

    [JsonPropertyName("dataschema")]
    public string? DataSchema { get; init; }

    [JsonPropertyName("rag_runid")]
    public string? RagRunId { get; init; }

    [JsonPropertyName("rag_invocationid")]
    public string? RagInvocationId { get; init; }

    [JsonPropertyName("rag_idempotencykey")]
    public string? RagIdempotencyKey { get; init; }

    [JsonPropertyName("rag_correlationid")]
    public string? RagCorrelationId { get; init; }

    [JsonPropertyName("rag_causationid")]
    public string? RagCausationId { get; init; }

    [JsonPropertyName("rag_traceparent")]
    public string? RagTraceParent { get; init; }

    [JsonPropertyName("rag_tracestate")]
    public string? RagTraceState { get; init; }

    [JsonPropertyName("rag_status")]
    public string? RagStatus { get; init; }

    [JsonPropertyName("rag_attempt")]
    public int? RagAttempt { get; init; }

    [JsonPropertyName("rag_deadline")]
    public DateTimeOffset? RagDeadline { get; init; }
}

public sealed record LoaderLoadRequestInputPayload : ContractPayload;
public sealed record LoaderLoadRequestInputMessage : ContractMessage<LoaderLoadRequestInputPayload>;
public sealed record LoaderLoadRequestInputEvent : RagEvent;
public sealed record LoaderSourceArtifactOutputPayload : ContractPayload;
public sealed record LoaderSourceArtifactOutputMessage : ContractMessage<LoaderSourceArtifactOutputPayload>;
public sealed record LoaderSourceArtifactOutputEvent : RagEvent;
public sealed record LoaderRawDocumentOutputPayload : ContractPayload;
public sealed record LoaderRawDocumentOutputMessage : ContractMessage<LoaderRawDocumentOutputPayload>;
public sealed record LoaderRawDocumentOutputEvent : RagEvent;
public sealed record ParserRawDocumentInputPayload : ContractPayload;
public sealed record ParserRawDocumentInputMessage : ContractMessage<ParserRawDocumentInputPayload>;
public sealed record ParserRawDocumentInputEvent : RagEvent;
public sealed record ParserParsedDocumentOutputPayload : ContractPayload;
public sealed record ParserParsedDocumentOutputMessage : ContractMessage<ParserParsedDocumentOutputPayload>;
public sealed record ParserParsedDocumentOutputEvent : RagEvent;
public sealed record ChunkerParsedDocumentInputPayload : ContractPayload;
public sealed record ChunkerParsedDocumentInputMessage : ContractMessage<ChunkerParsedDocumentInputPayload>;
public sealed record ChunkerParsedDocumentInputEvent : RagEvent;
public sealed record ChunkerChunkSetOutputPayload : ContractPayload;
public sealed record ChunkerChunkSetOutputMessage : ContractMessage<ChunkerChunkSetOutputPayload>;
public sealed record ChunkerChunkSetOutputEvent : RagEvent;
public sealed record EmbeddingEmbeddingRequestInputPayload : ContractPayload;
public sealed record EmbeddingEmbeddingRequestInputMessage : ContractMessage<EmbeddingEmbeddingRequestInputPayload>;
public sealed record EmbeddingEmbeddingRequestInputEvent : RagEvent;
public sealed record EmbeddingEmbeddingBatchOutputPayload : ContractPayload;
public sealed record EmbeddingEmbeddingBatchOutputMessage : ContractMessage<EmbeddingEmbeddingBatchOutputPayload>;
public sealed record EmbeddingEmbeddingBatchOutputEvent : RagEvent;
public sealed record EmbedderChunkSetInputPayload : ContractPayload;
public sealed record EmbedderChunkSetInputMessage : ContractMessage<EmbedderChunkSetInputPayload>;
public sealed record EmbedderChunkSetInputEvent : RagEvent;
public sealed record EmbedderEmbeddingProviderInputPayload : ContractPayload;
public sealed record EmbedderEmbeddingProviderInputMessage : ContractMessage<EmbedderEmbeddingProviderInputPayload>;
public sealed record EmbedderEmbeddingProviderInputEvent : RagEvent;
public sealed record EmbedderEmbeddingBatchOutputPayload : ContractPayload;
public sealed record EmbedderEmbeddingBatchOutputMessage : ContractMessage<EmbedderEmbeddingBatchOutputPayload>;
public sealed record EmbedderEmbeddingBatchOutputEvent : RagEvent;
public sealed record VectorstoreCollectionRequestInputPayload : ContractPayload;
public sealed record VectorstoreCollectionRequestInputMessage : ContractMessage<VectorstoreCollectionRequestInputPayload>;
public sealed record VectorstoreCollectionRequestInputEvent : RagEvent;
public sealed record VectorstoreIndexMutationInputPayload : ContractPayload;
public sealed record VectorstoreIndexMutationInputMessage : ContractMessage<VectorstoreIndexMutationInputPayload>;
public sealed record VectorstoreIndexMutationInputEvent : RagEvent;
public sealed record VectorstoreVectorQueryInputPayload : ContractPayload;
public sealed record VectorstoreVectorQueryInputMessage : ContractMessage<VectorstoreVectorQueryInputPayload>;
public sealed record VectorstoreVectorQueryInputEvent : RagEvent;
public sealed record VectorstoreCollectionRefOutputPayload : ContractPayload;
public sealed record VectorstoreCollectionRefOutputMessage : ContractMessage<VectorstoreCollectionRefOutputPayload>;
public sealed record VectorstoreCollectionRefOutputEvent : RagEvent;
public sealed record VectorstoreCandidateSetOutputPayload : ContractPayload;
public sealed record VectorstoreCandidateSetOutputMessage : ContractMessage<VectorstoreCandidateSetOutputPayload>;
public sealed record VectorstoreCandidateSetOutputEvent : RagEvent;
public sealed record IndexerChunkSetInputPayload : ContractPayload;
public sealed record IndexerChunkSetInputMessage : ContractMessage<IndexerChunkSetInputPayload>;
public sealed record IndexerChunkSetInputEvent : RagEvent;
public sealed record IndexerEmbeddingBatchInputPayload : ContractPayload;
public sealed record IndexerEmbeddingBatchInputMessage : ContractMessage<IndexerEmbeddingBatchInputPayload>;
public sealed record IndexerEmbeddingBatchInputEvent : RagEvent;
public sealed record IndexerVectorStoreInputPayload : ContractPayload;
public sealed record IndexerVectorStoreInputMessage : ContractMessage<IndexerVectorStoreInputPayload>;
public sealed record IndexerVectorStoreInputEvent : RagEvent;
public sealed record IndexerIndexMutationOutputPayload : ContractPayload;
public sealed record IndexerIndexMutationOutputMessage : ContractMessage<IndexerIndexMutationOutputPayload>;
public sealed record IndexerIndexMutationOutputEvent : RagEvent;
public sealed record IndexerCollectionRefOutputPayload : ContractPayload;
public sealed record IndexerCollectionRefOutputMessage : ContractMessage<IndexerCollectionRefOutputPayload>;
public sealed record IndexerCollectionRefOutputEvent : RagEvent;
public sealed record RetrieverRetrievalQueryInputPayload : ContractPayload;
public sealed record RetrieverRetrievalQueryInputMessage : ContractMessage<RetrieverRetrievalQueryInputPayload>;
public sealed record RetrieverRetrievalQueryInputEvent : RagEvent;
public sealed record RetrieverEmbeddingProviderInputPayload : ContractPayload;
public sealed record RetrieverEmbeddingProviderInputMessage : ContractMessage<RetrieverEmbeddingProviderInputPayload>;
public sealed record RetrieverEmbeddingProviderInputEvent : RagEvent;
public sealed record RetrieverVectorStoreInputPayload : ContractPayload;
public sealed record RetrieverVectorStoreInputMessage : ContractMessage<RetrieverVectorStoreInputPayload>;
public sealed record RetrieverVectorStoreInputEvent : RagEvent;
public sealed record RetrieverCandidateSetOutputPayload : ContractPayload;
public sealed record RetrieverCandidateSetOutputMessage : ContractMessage<RetrieverCandidateSetOutputPayload>;
public sealed record RetrieverCandidateSetOutputEvent : RagEvent;
public sealed record RerankerRetrievalQueryInputPayload : ContractPayload;
public sealed record RerankerRetrievalQueryInputMessage : ContractMessage<RerankerRetrievalQueryInputPayload>;
public sealed record RerankerRetrievalQueryInputEvent : RagEvent;
public sealed record RerankerCandidateSetInputPayload : ContractPayload;
public sealed record RerankerCandidateSetInputMessage : ContractMessage<RerankerCandidateSetInputPayload>;
public sealed record RerankerCandidateSetInputEvent : RagEvent;
public sealed record RerankerLlmProviderInputPayload : ContractPayload;
public sealed record RerankerLlmProviderInputMessage : ContractMessage<RerankerLlmProviderInputPayload>;
public sealed record RerankerLlmProviderInputEvent : RagEvent;
public sealed record RerankerRerankedSetOutputPayload : ContractPayload;
public sealed record RerankerRerankedSetOutputMessage : ContractMessage<RerankerRerankedSetOutputPayload>;
public sealed record RerankerRerankedSetOutputEvent : RagEvent;
public sealed record LlmLlmRequestInputPayload : ContractPayload;
public sealed record LlmLlmRequestInputMessage : ContractMessage<LlmLlmRequestInputPayload>;
public sealed record LlmLlmRequestInputEvent : RagEvent;
public sealed record LlmLlmResponseOutputPayload : ContractPayload;
public sealed record LlmLlmResponseOutputMessage : ContractMessage<LlmLlmResponseOutputPayload>;
public sealed record LlmLlmResponseOutputEvent : RagEvent;
public sealed record GeneratorGenerationRequestInputPayload : ContractPayload;
public sealed record GeneratorGenerationRequestInputMessage : ContractMessage<GeneratorGenerationRequestInputPayload>;
public sealed record GeneratorGenerationRequestInputEvent : RagEvent;
public sealed record GeneratorRerankedSetInputPayload : ContractPayload;
public sealed record GeneratorRerankedSetInputMessage : ContractMessage<GeneratorRerankedSetInputPayload>;
public sealed record GeneratorRerankedSetInputEvent : RagEvent;
public sealed record GeneratorLlmProviderInputPayload : ContractPayload;
public sealed record GeneratorLlmProviderInputMessage : ContractMessage<GeneratorLlmProviderInputPayload>;
public sealed record GeneratorLlmProviderInputEvent : RagEvent;
public sealed record GeneratorAnswerOutputPayload : ContractPayload;
public sealed record GeneratorAnswerOutputMessage : ContractMessage<GeneratorAnswerOutputPayload>;
public sealed record GeneratorAnswerOutputEvent : RagEvent;
public sealed record GeneratorGenerationContextOutputPayload : ContractPayload;
public sealed record GeneratorGenerationContextOutputMessage : ContractMessage<GeneratorGenerationContextOutputPayload>;
public sealed record GeneratorGenerationContextOutputEvent : RagEvent;
public sealed record EvaluatorEvaluationRequestInputPayload : ContractPayload;
public sealed record EvaluatorEvaluationRequestInputMessage : ContractMessage<EvaluatorEvaluationRequestInputPayload>;
public sealed record EvaluatorEvaluationRequestInputEvent : RagEvent;
public sealed record EvaluatorGenerationContextInputPayload : ContractPayload;
public sealed record EvaluatorGenerationContextInputMessage : ContractMessage<EvaluatorGenerationContextInputPayload>;
public sealed record EvaluatorGenerationContextInputEvent : RagEvent;
public sealed record EvaluatorLlmProviderInputPayload : ContractPayload;
public sealed record EvaluatorLlmProviderInputMessage : ContractMessage<EvaluatorLlmProviderInputPayload>;
public sealed record EvaluatorLlmProviderInputEvent : RagEvent;
public sealed record EvaluatorEvaluationRecordOutputPayload : ContractPayload;
public sealed record EvaluatorEvaluationRecordOutputMessage : ContractMessage<EvaluatorEvaluationRecordOutputPayload>;
public sealed record EvaluatorEvaluationRecordOutputEvent : RagEvent;
public sealed record ObservabilityTelemetryEventInputPayload : ContractPayload;
public sealed record ObservabilityTelemetryEventInputMessage : ContractMessage<ObservabilityTelemetryEventInputPayload>;
public sealed record ObservabilityTelemetryEventInputEvent : RagEvent;
public sealed record ObservabilityArtifactRefOutputPayload : ContractPayload;
public sealed record ObservabilityArtifactRefOutputMessage : ContractMessage<ObservabilityArtifactRefOutputPayload>;
public sealed record ObservabilityArtifactRefOutputEvent : RagEvent;

[JsonSourceGenerationOptions(
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    WriteIndented = false,
    GenerationMode = JsonSourceGenerationMode.Metadata)]
[JsonSerializable(typeof(LoaderLoadRequestInputPayload))]
[JsonSerializable(typeof(LoaderLoadRequestInputMessage))]
[JsonSerializable(typeof(LoaderLoadRequestInputEvent))]
[JsonSerializable(typeof(LoaderSourceArtifactOutputPayload))]
[JsonSerializable(typeof(LoaderSourceArtifactOutputMessage))]
[JsonSerializable(typeof(LoaderSourceArtifactOutputEvent))]
[JsonSerializable(typeof(LoaderRawDocumentOutputPayload))]
[JsonSerializable(typeof(LoaderRawDocumentOutputMessage))]
[JsonSerializable(typeof(LoaderRawDocumentOutputEvent))]
[JsonSerializable(typeof(ParserRawDocumentInputEvent))]
[JsonSerializable(typeof(ParserParsedDocumentOutputEvent))]
[JsonSerializable(typeof(ChunkerParsedDocumentInputEvent))]
[JsonSerializable(typeof(ChunkerChunkSetOutputEvent))]
[JsonSerializable(typeof(EmbeddingEmbeddingRequestInputEvent))]
[JsonSerializable(typeof(EmbeddingEmbeddingBatchOutputEvent))]
[JsonSerializable(typeof(EmbedderChunkSetInputEvent))]
[JsonSerializable(typeof(EmbedderEmbeddingProviderInputEvent))]
[JsonSerializable(typeof(EmbedderEmbeddingBatchOutputEvent))]
[JsonSerializable(typeof(VectorstoreCollectionRequestInputEvent))]
[JsonSerializable(typeof(VectorstoreIndexMutationInputEvent))]
[JsonSerializable(typeof(VectorstoreVectorQueryInputEvent))]
[JsonSerializable(typeof(VectorstoreCollectionRefOutputEvent))]
[JsonSerializable(typeof(VectorstoreCandidateSetOutputEvent))]
[JsonSerializable(typeof(IndexerChunkSetInputEvent))]
[JsonSerializable(typeof(IndexerEmbeddingBatchInputEvent))]
[JsonSerializable(typeof(IndexerVectorStoreInputEvent))]
[JsonSerializable(typeof(IndexerIndexMutationOutputEvent))]
[JsonSerializable(typeof(IndexerCollectionRefOutputEvent))]
[JsonSerializable(typeof(RetrieverRetrievalQueryInputEvent))]
[JsonSerializable(typeof(RetrieverEmbeddingProviderInputEvent))]
[JsonSerializable(typeof(RetrieverVectorStoreInputEvent))]
[JsonSerializable(typeof(RetrieverCandidateSetOutputEvent))]
[JsonSerializable(typeof(RerankerRetrievalQueryInputEvent))]
[JsonSerializable(typeof(RerankerCandidateSetInputEvent))]
[JsonSerializable(typeof(RerankerLlmProviderInputEvent))]
[JsonSerializable(typeof(RerankerRerankedSetOutputEvent))]
[JsonSerializable(typeof(LlmLlmRequestInputEvent))]
[JsonSerializable(typeof(LlmLlmResponseOutputEvent))]
[JsonSerializable(typeof(GeneratorGenerationRequestInputEvent))]
[JsonSerializable(typeof(GeneratorRerankedSetInputEvent))]
[JsonSerializable(typeof(GeneratorLlmProviderInputEvent))]
[JsonSerializable(typeof(GeneratorAnswerOutputEvent))]
[JsonSerializable(typeof(GeneratorGenerationContextOutputEvent))]
[JsonSerializable(typeof(EvaluatorEvaluationRequestInputEvent))]
[JsonSerializable(typeof(EvaluatorGenerationContextInputEvent))]
[JsonSerializable(typeof(EvaluatorLlmProviderInputEvent))]
[JsonSerializable(typeof(EvaluatorEvaluationRecordOutputEvent))]
[JsonSerializable(typeof(ObservabilityTelemetryEventInputEvent))]
[JsonSerializable(typeof(ObservabilityArtifactRefOutputEvent))]
public partial class AiContractJsonContext : JsonSerializerContext;

public static class AiContractSchemaExporter
{
    public static JsonNode ExportSchema(Type type)
    {
        var exporter = new JsonSchemaExporter();
        return exporter.GetJsonSchema(type);
    }
}
