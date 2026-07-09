import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as z from "zod";

export const componentKinds = [
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
  "observability.sink"
] as const;

export const ComponentKindSchema = z.enum(componentKinds);
export type ComponentKind = z.infer<typeof ComponentKindSchema>;
export type Direction = "input" | "output";

export const JsonSchemaObjectSchema = z.record(z.string(), z.unknown()).refine(
  (value) => typeof value.type === "string" || typeof value.$ref === "string" || typeof value.$id === "string",
  "schema must include type, $ref, or $id"
);

export const ArtifactRefSchema = z.object({
  uri: z.string().min(1),
  digest: z.string().min(1).optional(),
  mediaType: z.string().min(1).optional()
}).strict();

export const ProjectRefSchema = z.object({
  uri: z.string().min(1),
  revision: z.string().min(1).optional()
}).strict();

const MetadataSchema = z.record(z.string(), z.unknown());

export const ErrorPayloadSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  retryable: z.boolean(),
  details: MetadataSchema.optional()
}).strict();

export const successOutput = <T extends z.ZodType>(schema: T) => z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), output: schema }).strict(),
  z.object({ status: z.literal("error"), error: ErrorPayloadSchema }).strict()
]);

export const LoadRequestSchema = z.object({
  requestId: z.string().min(1),
  uri: z.string().min(1),
  mediaType: z.string().min(1).optional(),
  metadata: MetadataSchema.default({})
}).strict();

export const RawDocumentSchema = z.object({
  documentId: z.string().min(1),
  source: ArtifactRefSchema,
  bytesRef: ArtifactRefSchema.optional(),
  text: z.string(),
  mediaType: z.string().min(1),
  metadata: MetadataSchema.default({})
}).strict();

export const ParsedDocumentSchema = RawDocumentSchema.extend({
  sections: z.array(z.object({
    sectionId: z.string().min(1),
    heading: z.string().optional(),
    text: z.string()
  }).strict()).default([])
}).strict();

export const ChunkSchema = z.object({
  chunkId: z.string().min(1),
  documentId: z.string().min(1),
  text: z.string(),
  ordinal: z.number().int().nonnegative(),
  metadata: MetadataSchema.default({})
}).strict();

export const ChunkSetSchema = z.object({
  documentId: z.string().min(1),
  chunks: z.array(ChunkSchema)
}).strict();

export const EmbeddingProviderRefSchema = z.object({
  provider: z.enum(["ollama"]),
  model: z.enum(["nomic-embed-text-v2-moe:latest", "bge-m3:567m"]),
  baseUrl: z.string().url()
}).strict();

export const EmbeddingRequestSchema = z.object({
  requestId: z.string().min(1),
  provider: EmbeddingProviderRefSchema,
  inputs: z.array(z.object({
    inputId: z.string().min(1),
    text: z.string()
  }).strict()).min(1)
}).strict();

export const EmbeddingVectorSchema = z.object({
  inputId: z.string().min(1),
  values: z.array(z.number())
}).strict();

export const EmbeddingBatchSchema = z.object({
  provider: EmbeddingProviderRefSchema,
  vectors: z.array(EmbeddingVectorSchema)
}).strict();

export const CollectionRefSchema = z.object({
  store: z.enum(["qdrant", "chromadb"]),
  collection: z.string().min(1),
  url: z.string().min(1),
  dimension: z.number().int().positive()
}).strict();

export const CollectionRequestSchema = z.object({
  collection: z.string().min(1),
  dimension: z.number().int().positive(),
  distance: z.enum(["cosine", "dot", "euclidean"])
}).strict();

export const IndexMutationSchema = z.object({
  collection: CollectionRefSchema,
  operation: z.enum(["upsert", "delete"]),
  points: z.array(z.object({
    id: z.string().min(1),
    vector: z.array(z.number()).optional(),
    metadata: MetadataSchema.default({})
  }).strict())
}).strict();

export const VectorQuerySchema = z.object({
  queryId: z.string().min(1),
  collection: CollectionRefSchema,
  vector: z.array(z.number()),
  topK: z.number().int().positive(),
  filter: MetadataSchema.optional()
}).strict();

export const RetrievalQuerySchema = z.object({
  queryId: z.string().min(1),
  text: z.string().min(1),
  topK: z.number().int().positive(),
  collection: CollectionRefSchema.optional()
}).strict();

export const CandidateSchema = z.object({
  chunkId: z.string().min(1),
  documentId: z.string().min(1),
  text: z.string(),
  score: z.number(),
  metadata: MetadataSchema.default({})
}).strict();

export const CandidateSetSchema = z.object({
  queryId: z.string().min(1),
  candidates: z.array(CandidateSchema)
}).strict();

export const LlmProviderRefSchema = z.object({
  provider: z.enum(["ollama", "openai"]),
  model: z.enum(["deepseek-v4-flash:cloud", "gpt-4o-mini"]),
  baseUrl: z.string().min(1).optional()
}).strict();

export const RerankedSetSchema = z.object({
  queryId: z.string().min(1),
  candidates: z.array(CandidateSchema.extend({
    rank: z.number().int().positive(),
    rationale: z.string().optional()
  }).strict())
}).strict();

export const LlmRequestSchema = z.object({
  requestId: z.string().min(1),
  provider: LlmProviderRefSchema,
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string()
  }).strict()).min(1),
  temperature: z.number().min(0).max(2).optional()
}).strict();

export const LlmResponseSchema = z.object({
  requestId: z.string().min(1),
  provider: LlmProviderRefSchema,
  content: z.string(),
  usage: z.object({
    inputTokens: z.number().int().nonnegative().optional(),
    outputTokens: z.number().int().nonnegative().optional()
  }).strict().optional()
}).strict();

export const GenerationRequestSchema = z.object({
  queryId: z.string().min(1),
  question: z.string().min(1),
  instructions: z.string().optional()
}).strict();

export const AnswerSchema = z.object({
  queryId: z.string().min(1),
  text: z.string(),
  citations: z.array(z.object({
    chunkId: z.string().min(1),
    documentId: z.string().min(1)
  }).strict()).default([])
}).strict();

export const GenerationContextSchema = z.object({
  request: GenerationRequestSchema,
  rerankedSet: RerankedSetSchema,
  answer: AnswerSchema,
  llm: LlmProviderRefSchema
}).strict();

export const EvaluationRequestSchema = z.object({
  evaluationId: z.string().min(1),
  metric: z.enum(["groundedness", "relevance", "faithfulness"]),
  rubric: z.string().optional()
}).strict();

export const EvaluationRecordSchema = z.object({
  evaluationId: z.string().min(1),
  queryId: z.string().min(1),
  metric: z.string().min(1),
  score: z.number(),
  passed: z.boolean(),
  notes: z.string().optional()
}).strict();

export const TelemetryEventSchema = z.object({
  name: z.string().min(1),
  time: z.string().datetime(),
  attributes: MetadataSchema.default({})
}).strict();

export const payloadSchemas = {
  ArtifactRef: ArtifactRefSchema,
  LoadRequest: LoadRequestSchema,
  RawDocument: RawDocumentSchema,
  ParsedDocument: ParsedDocumentSchema,
  ChunkSet: ChunkSetSchema,
  EmbeddingProviderRef: EmbeddingProviderRefSchema,
  EmbeddingRequest: EmbeddingRequestSchema,
  EmbeddingBatch: EmbeddingBatchSchema,
  CollectionRequest: CollectionRequestSchema,
  CollectionRef: CollectionRefSchema,
  IndexMutation: IndexMutationSchema,
  VectorQuery: VectorQuerySchema,
  RetrievalQuery: RetrievalQuerySchema,
  CandidateSet: CandidateSetSchema,
  LlmProviderRef: LlmProviderRefSchema,
  RerankedSet: RerankedSetSchema,
  LlmRequest: LlmRequestSchema,
  LlmResponse: LlmResponseSchema,
  GenerationRequest: GenerationRequestSchema,
  Answer: AnswerSchema,
  GenerationContext: GenerationContextSchema,
  EvaluationRequest: EvaluationRequestSchema,
  EvaluationRecord: EvaluationRecordSchema,
  TelemetryEvent: TelemetryEventSchema
} as const;

export type PayloadName = keyof typeof payloadSchemas;
export type ArtifactRef = z.infer<typeof ArtifactRefSchema>;
export type LoadRequest = z.infer<typeof LoadRequestSchema>;
export type RawDocument = z.infer<typeof RawDocumentSchema>;
export type ParsedDocument = z.infer<typeof ParsedDocumentSchema>;
export type ChunkSet = z.infer<typeof ChunkSetSchema>;
export type EmbeddingProviderRef = z.infer<typeof EmbeddingProviderRefSchema>;
export type EmbeddingRequest = z.infer<typeof EmbeddingRequestSchema>;
export type EmbeddingBatch = z.infer<typeof EmbeddingBatchSchema>;
export type CollectionRequest = z.infer<typeof CollectionRequestSchema>;
export type CollectionRef = z.infer<typeof CollectionRefSchema>;
export type IndexMutation = z.infer<typeof IndexMutationSchema>;
export type VectorQuery = z.infer<typeof VectorQuerySchema>;
export type RetrievalQuery = z.infer<typeof RetrievalQuerySchema>;
export type CandidateSet = z.infer<typeof CandidateSetSchema>;
export type LlmProviderRef = z.infer<typeof LlmProviderRefSchema>;
export type RerankedSet = z.infer<typeof RerankedSetSchema>;
export type LlmRequest = z.infer<typeof LlmRequestSchema>;
export type LlmResponse = z.infer<typeof LlmResponseSchema>;
export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;
export type Answer = z.infer<typeof AnswerSchema>;
export type GenerationContext = z.infer<typeof GenerationContextSchema>;
export type EvaluationRequest = z.infer<typeof EvaluationRequestSchema>;
export type EvaluationRecord = z.infer<typeof EvaluationRecordSchema>;
export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;

export const RagDocumentSchema = RawDocumentSchema;
export const RetrievalResultSchema = CandidateSetSchema;
export type RagDocument = RawDocument;
export type RetrievalResult = CandidateSet;

export const PortSchema = z.object({
  port: z.string().min(1),
  payload: z.string().min(1)
}).strict();

export const SlotSchema = z.object({
  kind: ComponentKindSchema,
  slot: z.string().min(1),
  inputs: z.array(PortSchema),
  outputs: z.array(PortSchema)
}).strict();

export const LegalConnectionSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1)
}).strict();

export const PortRegistrySchema = z.object({
  schemaVersion: z.string().min(1),
  eventSchemaDraft: z.literal("https://json-schema.org/draft/2020-12/schema"),
  eventNaming: z.string().min(1),
  slots: z.array(SlotSchema),
  legalConnections: z.array(LegalConnectionSchema)
}).strict();

export type PortRegistry = z.infer<typeof PortRegistrySchema>;
export type Slot = z.infer<typeof SlotSchema>;
export type Port = z.infer<typeof PortSchema>;
export type LegalConnection = z.infer<typeof LegalConnectionSchema>;

function findRegistryPath(): string {
  const candidates = [
    join(process.cwd(), "port-registry.yaml"),
    join(dirname(fileURLToPath(import.meta.url)), "../../../port-registry.yaml"),
    join(dirname(fileURLToPath(import.meta.url)), "../../../../port-registry.yaml")
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error("port-registry.yaml not found");
  }
  return found;
}

export function loadPortRegistry(path = findRegistryPath()): PortRegistry {
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  return PortRegistrySchema.parse(parsed);
}

export const portRegistry = loadPortRegistry();

function pascal(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/(?:^|\s)([a-zA-Z0-9])/g, (_, letter: string) => letter.toUpperCase())
    .replace(/\s+/g, "");
}

export function contractName(slot: string, port: string, direction: Direction, suffix: "Payload" | "Message" | "Event"): string {
  return `${pascal(slot)}${pascal(port)}${pascal(direction)}${suffix}`;
}

export function eventType(slot: string, port: string, direction: Direction): string {
  return `${slot}.${port}.${direction}.v1`;
}

export const BaseRagEventSchema = z.object({
  specversion: z.literal("1.0"),
  id: z.string().min(1),
  type: z.string().min(1),
  source: z.string().min(1),
  time: z.string().datetime(),
  datacontenttype: z.literal("application/json"),
  data: z.unknown(),
  rag_port: z.string().min(1),
  rag_direction: z.enum(["input", "output"]),
  rag_componentkind: ComponentKindSchema,
  rag_pluginname: z.string().min(1),
  rag_pluginversion: z.string().min(1),
  subject: z.string().min(1).optional(),
  dataschema: z.string().min(1).optional(),
  rag_runid: z.string().min(1).optional(),
  rag_invocationid: z.string().min(1).optional(),
  rag_idempotencykey: z.string().min(1).optional(),
  rag_correlationid: z.string().min(1).optional(),
  rag_causationid: z.string().min(1).optional(),
  rag_traceparent: z.string().min(1).optional(),
  rag_tracestate: z.string().min(1).optional(),
  rag_status: z.enum(["accepted", "running", "completed", "failed"]).optional(),
  rag_attempt: z.number().int().positive().optional(),
  rag_deadline: z.string().datetime().optional()
}).strict();

export const PluginDescriptorSchema = z.object({
  name: z.string().regex(/^[a-z0-9][a-z0-9.-]*$/),
  version: z.string().regex(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/),
  kind: ComponentKindSchema,
  description: z.string().min(1),
  configSchema: JsonSchemaObjectSchema,
  inputSchema: JsonSchemaObjectSchema,
  outputSchema: JsonSchemaObjectSchema,
  ports: z.object({
    inputs: z.array(PortSchema),
    outputs: z.array(PortSchema)
  }).strict(),
  effects: z.array(z.enum(["read_project", "write_artifact", "read_artifact", "network", "compute"])).default([]),
  annotations: z.object({
    title: z.string().min(1).optional(),
    readOnlyHint: z.boolean().optional(),
    destructiveHint: z.boolean().optional(),
    idempotentHint: z.boolean().optional(),
    openWorldHint: z.boolean().optional()
  }).strict().default({}),
  capabilities: z.array(z.string().min(1)).default([])
}).strict();
export type PluginDescriptor = z.infer<typeof PluginDescriptorSchema>;

export const ProjectSnapshotSchema = z.object({
  projectId: z.string().min(1),
  root: ProjectRefSchema,
  files: z.array(z.object({
    path: z.string().min(1),
    digest: z.string().min(1),
    mediaType: z.string().min(1).optional()
  }).strict()),
  observedAt: z.string().datetime()
}).strict();

export const ComponentGraphSchema = z.object({
  graphId: z.string().min(1),
  nodes: z.array(z.object({
    id: z.string().min(1),
    kind: ComponentKindSchema,
    descriptor: PluginDescriptorSchema
  }).strict()),
  edges: z.array(z.object({
    from: z.string().min(1),
    to: z.string().min(1),
    payload: z.string().min(1),
    eventType: z.string().min(1)
  }).strict())
}).strict();

export type ProjectSnapshot = z.infer<typeof ProjectSnapshotSchema>;
export type ComponentGraph = z.infer<typeof ComponentGraphSchema>;

function schemaForContract(slot: Slot, port: Port, direction: Direction, suffix: "Payload" | "Message" | "Event"): z.ZodType {
  const basePayloadSchema = payloadSchemas[port.payload as PayloadName];
  if (!basePayloadSchema) {
    throw new Error(`unknown payload ${port.payload} for ${slot.kind}.${port.port}`);
  }
  const payloadSchema = direction === "output" ? successOutput(basePayloadSchema) : basePayloadSchema;
  if (suffix === "Payload" || suffix === "Message") {
    return payloadSchema;
  }
  return BaseRagEventSchema.extend({
    type: z.literal(eventType(slot.slot, port.port, direction)),
    data: payloadSchema,
    rag_port: z.literal(port.port),
    rag_direction: z.literal(direction),
    rag_componentkind: z.literal(slot.kind)
  }).strict();
}

export const contractSchemas = Object.fromEntries(
  portRegistry.slots.flatMap((slot) => [
    ...slot.inputs.flatMap((port) => (["Payload", "Message", "Event"] as const).map((suffix) => [
      contractName(slot.slot, port.port, "input", suffix),
      schemaForContract(slot, port, "input", suffix)
    ])),
    ...slot.outputs.flatMap((port) => (["Payload", "Message", "Event"] as const).map((suffix) => [
      contractName(slot.slot, port.port, "output", suffix),
      schemaForContract(slot, port, "output", suffix)
    ]))
  ])
) as Record<string, z.ZodType>;

export const PluginResultSchema = successOutput(z.unknown());
export type PluginResult<TOutput = unknown> =
  | { status: "success"; output: TOutput }
  | { status: "error"; error: z.infer<typeof ErrorPayloadSchema> };

export const wireSchemas = {
  PluginDescriptor: PluginDescriptorSchema,
  PluginResult: PluginResultSchema,
  ProjectSnapshot: ProjectSnapshotSchema,
  ComponentGraph: ComponentGraphSchema,
  PortRegistry: PortRegistrySchema,
  BaseRagEvent: BaseRagEventSchema,
  ...payloadSchemas,
  ...contractSchemas
} as const;

export function toJsonSchema(name: keyof typeof wireSchemas): Record<string, unknown> {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `https://schemas.pluggable-event-system.local/ai/${name}.schema.json`,
    ...z.toJSONSchema(wireSchemas[name], { target: "draft-2020-12" })
  };
}

export function exportJsonSchemas(): Record<string, Record<string, unknown>> {
  return Object.fromEntries(
    Object.keys(wireSchemas).map((name) => [name, toJsonSchema(name as keyof typeof wireSchemas)])
  );
}
