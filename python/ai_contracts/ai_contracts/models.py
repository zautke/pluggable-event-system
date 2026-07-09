from __future__ import annotations

import json
from pathlib import Path
from typing import Annotated, Any, Literal, TypedDict, Union

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, create_model, field_validator

ComponentKind = Literal[
    "project.ingester",
    "project.decomposer",
    "provider.llm",
    "provider.embedding",
    "rag.loader",
    "rag.parser",
    "rag.chunker",
    "rag.embedder",
    "rag.vectorstore",
    "rag.indexer",
    "rag.retriever",
    "rag.reranker",
    "rag.generator",
    "rag.evaluator",
    "observability.sink",
]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class ArtifactRef(StrictModel):
    uri: str
    digest: str | None = None
    mediaType: str | None = None


class ProjectRef(StrictModel):
    uri: str
    revision: str | None = None


class ErrorPayload(StrictModel):
    code: str
    message: str
    retryable: bool
    details: dict[str, Any] | None = None


class SuccessResult(StrictModel):
    status: Literal["success"]
    output: Any


class ErrorResult(StrictModel):
    status: Literal["error"]
    error: ErrorPayload


PluginResult = Annotated[Union[SuccessResult, ErrorResult], Field(discriminator="status")]


class LoadRequest(StrictModel):
    requestId: str
    uri: str
    mediaType: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class RawDocument(StrictModel):
    documentId: str
    source: ArtifactRef
    bytesRef: ArtifactRef | None = None
    text: str
    mediaType: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class Section(StrictModel):
    sectionId: str
    heading: str | None = None
    text: str


class ParsedDocument(RawDocument):
    sections: list[Section] = Field(default_factory=list)


class Chunk(StrictModel):
    chunkId: str
    documentId: str
    text: str
    ordinal: int = Field(ge=0)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ChunkSet(StrictModel):
    documentId: str
    chunks: list[Chunk]


class EmbeddingProviderRef(StrictModel):
    provider: Literal["ollama"]
    model: Literal["nomic-embed-text-v2-moe:latest", "bge-m3:567m"]
    baseUrl: str


class EmbeddingInput(StrictModel):
    inputId: str
    text: str


class EmbeddingRequest(StrictModel):
    requestId: str
    provider: EmbeddingProviderRef
    inputs: list[EmbeddingInput]


class EmbeddingVector(StrictModel):
    inputId: str
    values: list[float]


class EmbeddingBatch(StrictModel):
    provider: EmbeddingProviderRef
    vectors: list[EmbeddingVector]


class CollectionRef(StrictModel):
    store: Literal["qdrant", "chromadb"]
    collection: str
    url: str
    dimension: int = Field(gt=0)


class CollectionRequest(StrictModel):
    collection: str
    dimension: int = Field(gt=0)
    distance: Literal["cosine", "dot", "euclidean"]


class IndexPoint(StrictModel):
    id: str
    vector: list[float] | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class IndexMutation(StrictModel):
    collection: CollectionRef
    operation: Literal["upsert", "delete"]
    points: list[IndexPoint]


class VectorQuery(StrictModel):
    queryId: str
    collection: CollectionRef
    vector: list[float]
    topK: int = Field(gt=0)
    filter: dict[str, Any] | None = None


class RetrievalQuery(StrictModel):
    queryId: str
    text: str
    topK: int = Field(gt=0)
    collection: CollectionRef | None = None


class Candidate(StrictModel):
    chunkId: str
    documentId: str
    text: str
    score: float
    metadata: dict[str, Any] = Field(default_factory=dict)


class CandidateSet(StrictModel):
    queryId: str
    candidates: list[Candidate]


class LlmProviderRef(StrictModel):
    provider: Literal["ollama", "openai"]
    model: Literal["deepseek-v4-flash:cloud", "gpt-4o-mini"]
    baseUrl: str | None = None


class RerankedCandidate(Candidate):
    rank: int = Field(gt=0)
    rationale: str | None = None


class RerankedSet(StrictModel):
    queryId: str
    candidates: list[RerankedCandidate]


class LlmMessage(StrictModel):
    role: Literal["system", "user", "assistant"]
    content: str


class LlmRequest(StrictModel):
    requestId: str
    provider: LlmProviderRef
    messages: list[LlmMessage]
    temperature: float | None = Field(default=None, ge=0, le=2)


class LlmUsage(StrictModel):
    inputTokens: int | None = Field(default=None, ge=0)
    outputTokens: int | None = Field(default=None, ge=0)


class LlmResponse(StrictModel):
    requestId: str
    provider: LlmProviderRef
    content: str
    usage: LlmUsage | None = None


class GenerationRequest(StrictModel):
    queryId: str
    question: str
    instructions: str | None = None


class Citation(StrictModel):
    chunkId: str
    documentId: str


class Answer(StrictModel):
    queryId: str
    text: str
    citations: list[Citation] = Field(default_factory=list)


class GenerationContext(StrictModel):
    request: GenerationRequest
    rerankedSet: RerankedSet
    answer: Answer
    llm: LlmProviderRef


class EvaluationRequest(StrictModel):
    evaluationId: str
    metric: Literal["groundedness", "relevance", "faithfulness"]
    rubric: str | None = None


class EvaluationRecord(StrictModel):
    evaluationId: str
    queryId: str
    metric: str
    score: float
    passed: bool
    notes: str | None = None


class TelemetryEvent(StrictModel):
    name: str
    time: str
    attributes: dict[str, Any] = Field(default_factory=dict)


RagDocument = RawDocument
RetrievalResult = CandidateSet


class PortContract(StrictModel):
    port: str
    payload: str


class DescriptorPorts(StrictModel):
    inputs: list[PortContract]
    outputs: list[PortContract]


class Annotations(StrictModel):
    title: str | None = None
    readOnlyHint: bool | None = None
    destructiveHint: bool | None = None
    idempotentHint: bool | None = None
    openWorldHint: bool | None = None


class PluginDescriptor(StrictModel):
    name: str = Field(pattern=r"^[a-z0-9][a-z0-9.-]*$")
    version: str = Field(pattern=r"^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$")
    kind: ComponentKind
    description: str
    configSchema: dict[str, Any]
    inputSchema: dict[str, Any]
    outputSchema: dict[str, Any]
    ports: DescriptorPorts
    effects: list[Literal["read_project", "write_artifact", "read_artifact", "network", "compute"]] = Field(default_factory=list)
    annotations: Annotations = Field(default_factory=Annotations)
    capabilities: list[str] = Field(default_factory=list)

    @field_validator("configSchema", "inputSchema", "outputSchema")
    @classmethod
    def schema_like(cls, value: dict[str, Any]) -> dict[str, Any]:
        if not any(key in value for key in ("type", "$ref", "$id")):
            raise ValueError("schema must include type, $ref, or $id")
        return value


class ProjectFile(StrictModel):
    path: str
    digest: str
    mediaType: str | None = None


class ProjectSnapshot(StrictModel):
    projectId: str
    root: ProjectRef
    files: list[ProjectFile]
    observedAt: str


class ComponentNode(StrictModel):
    id: str
    kind: ComponentKind
    descriptor: PluginDescriptor


class ComponentEdge(StrictModel):
    from_: str = Field(alias="from")
    to: str
    payload: str
    eventType: str


class ComponentGraph(StrictModel):
    graphId: str
    nodes: list[ComponentNode]
    edges: list[ComponentEdge]


class PluginRef(StrictModel):
    name: str
    version: str


class Invocation(StrictModel):
    runId: str
    invocationId: str
    idempotencyKey: str
    project: ProjectRef
    plugin: PluginRef
    configDigest: str
    inputDigest: str
    input: Any


class BaseRagEvent(StrictModel):
    specversion: Literal["1.0"]
    id: str
    type: str
    source: str
    time: str
    datacontenttype: Literal["application/json"]
    data: Any
    rag_port: str
    rag_direction: Literal["input", "output"]
    rag_componentkind: ComponentKind
    rag_pluginname: str
    rag_pluginversion: str
    subject: str | None = None
    dataschema: str | None = None
    rag_runid: str | None = None
    rag_invocationid: str | None = None
    rag_idempotencykey: str | None = None
    rag_correlationid: str | None = None
    rag_causationid: str | None = None
    rag_traceparent: str | None = None
    rag_tracestate: str | None = None
    rag_status: Literal["accepted", "running", "completed", "failed"] | None = None
    rag_attempt: int | None = Field(default=None, gt=0)
    rag_deadline: str | None = None


PAYLOAD_MODELS: dict[str, type[BaseModel] | TypeAdapter[Any]] = {
    "ArtifactRef": ArtifactRef,
    "LoadRequest": LoadRequest,
    "RawDocument": RawDocument,
    "ParsedDocument": ParsedDocument,
    "ChunkSet": ChunkSet,
    "EmbeddingProviderRef": EmbeddingProviderRef,
    "EmbeddingRequest": EmbeddingRequest,
    "EmbeddingBatch": EmbeddingBatch,
    "CollectionRequest": CollectionRequest,
    "CollectionRef": CollectionRef,
    "IndexMutation": IndexMutation,
    "VectorQuery": VectorQuery,
    "RetrievalQuery": RetrievalQuery,
    "CandidateSet": CandidateSet,
    "LlmProviderRef": LlmProviderRef,
    "RerankedSet": RerankedSet,
    "LlmRequest": LlmRequest,
    "LlmResponse": LlmResponse,
    "GenerationRequest": GenerationRequest,
    "Answer": Answer,
    "GenerationContext": GenerationContext,
    "EvaluationRequest": EvaluationRequest,
    "EvaluationRecord": EvaluationRecord,
    "TelemetryEvent": TelemetryEvent,
}


def _registry() -> dict[str, Any]:
    return json.loads((Path(__file__).resolve().parents[3] / "port-registry.yaml").read_text())


def _pascal(value: str) -> str:
    return "".join(part[:1].upper() + part[1:] for part in value.replace("-", " ").replace("_", " ").split())


def _contract_name(slot: str, port: str, direction: str, suffix: str) -> str:
    return f"{_pascal(slot)}{_pascal(port)}{_pascal(direction)}{suffix}"


def _event_type(slot: str, port: str, direction: str) -> str:
    return f"{slot}.{port}.{direction}.v1"


def _payload_annotation(payload: str, direction: str) -> Any:
    model = PAYLOAD_MODELS[payload]
    if direction == "input":
        return model
    return PluginResult


CONTRACT_TYPED_DICTS: dict[str, type[TypedDict]] = {}
CONTRACT_MODELS: dict[str, type[BaseModel] | TypeAdapter[Any]] = {}

for _slot in _registry()["slots"]:
    for _direction, _ports in (("input", _slot["inputs"]), ("output", _slot["outputs"])):
        for _port in _ports:
            _payload_name = _contract_name(_slot["slot"], _port["port"], _direction, "Payload")
            _message_name = _contract_name(_slot["slot"], _port["port"], _direction, "Message")
            _event_name = _contract_name(_slot["slot"], _port["port"], _direction, "Event")
            _data_annotation = _payload_annotation(_port["payload"], _direction)
            CONTRACT_TYPED_DICTS[_payload_name] = TypedDict(_payload_name, {"data": Any})
            CONTRACT_TYPED_DICTS[_message_name] = TypedDict(_message_name, {"data": Any})
            CONTRACT_TYPED_DICTS[_event_name] = TypedDict(_event_name, {"type": str, "data": Any})
            CONTRACT_MODELS[_payload_name] = TypeAdapter(_data_annotation)
            CONTRACT_MODELS[_message_name] = TypeAdapter(_data_annotation)
            CONTRACT_MODELS[_event_name] = create_model(
                _event_name,
                __base__=BaseRagEvent,
                type=(Literal[_event_type(_slot["slot"], _port["port"], _direction)], ...),
                data=(_data_annotation, ...),
                rag_port=(Literal[_port["port"]], ...),
                rag_direction=(Literal[_direction], ...),
                rag_componentkind=(Literal[_slot["kind"]], ...),
            )
            globals()[_payload_name] = CONTRACT_MODELS[_payload_name]
            globals()[_message_name] = CONTRACT_MODELS[_message_name]
            globals()[_event_name] = CONTRACT_MODELS[_event_name]


def idempotency_fingerprint(invocation: Invocation | dict[str, str]) -> str:
    if isinstance(invocation, dict):
        return ":".join(
            [
                invocation["name"],
                invocation["version"],
                invocation["configDigest"],
                invocation["inputDigest"],
                invocation["idempotencyKey"],
            ]
        )
    return ":".join(
        [
            invocation.plugin.name,
            invocation.plugin.version,
            invocation.configDigest,
            invocation.inputDigest,
            invocation.idempotencyKey,
        ]
    )
