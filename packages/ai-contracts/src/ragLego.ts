import {
  ComponentKind,
  JsonSchemaObjectSchema,
  PluginDescriptor,
  Slot,
  contractName,
  eventType,
  portRegistry,
  toJsonSchema
} from "./schemas.js";
import { validateRegistry } from "./registry.js";

function schemaRef(name: string): Record<string, unknown> {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $ref: `https://schemas.pluggable-event-system.local/ai/${name}.schema.json`
  };
}

function aggregateSchema(slot: Slot, direction: "input" | "output"): Record<string, unknown> {
  const ports = direction === "input" ? slot.inputs : slot.outputs;
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `https://schemas.pluggable-event-system.local/ai/${slot.slot}.${direction}.schema.json`,
    type: "object",
    properties: Object.fromEntries(
      ports.map((port) => [
        port.port,
        schemaRef(contractName(slot.slot, port.port, direction, "Event"))
      ])
    ),
    required: ports.map((port) => port.port),
    additionalProperties: false
  };
}

const emptyConfig = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false
};

const slotByKind = new Map(portRegistry.slots.map((slot) => [slot.kind, slot]));

type Variant = {
  name: string;
  kind: ComponentKind;
  title: string;
  description: string;
  capabilities: string[];
  effects: PluginDescriptor["effects"];
};

const variants: Variant[] = [
  {
    name: "filesystem-loader",
    kind: "rag.loader",
    title: "Filesystem loader",
    description: "Loads source files from configured local or mounted project paths.",
    capabilities: ["filesystem", "live", "source-loading"],
    effects: ["read_artifact", "compute"]
  },
  {
    name: "http-url-loader",
    kind: "rag.loader",
    title: "HTTP URL loader",
    description: "Loads source documents from HTTP and HTTPS URLs.",
    capabilities: ["http", "live", "source-loading"],
    effects: ["network", "read_artifact", "compute"]
  },
  {
    name: "markdown-text-parser",
    kind: "rag.parser",
    title: "Markdown and text parser",
    description: "Normalizes plain text and Markdown into parsed document sections.",
    capabilities: ["markdown", "text", "live"],
    effects: ["compute"]
  },
  {
    name: "html-parser",
    kind: "rag.parser",
    title: "HTML parser",
    description: "Extracts readable text and metadata from HTML documents.",
    capabilities: ["html", "live"],
    effects: ["compute"]
  },
  {
    name: "heading-window-chunker",
    kind: "rag.chunker",
    title: "Heading-window chunker",
    description: "Builds chunks around heading boundaries and token windows.",
    capabilities: ["heading-window", "live"],
    effects: ["compute"]
  },
  {
    name: "semantic-overlap-chunker",
    kind: "rag.chunker",
    title: "Semantic-overlap chunker",
    description: "Builds overlapping chunks optimized for semantic retrieval.",
    capabilities: ["semantic-overlap", "live"],
    effects: ["compute"]
  },
  {
    name: "ollama-nomic-embed-provider",
    kind: "provider.embedding",
    title: "Ollama nomic embedding provider",
    description: "Calls the Ollama embedding API with nomic-embed-text-v2-moe:latest.",
    capabilities: ["ollama", "nomic-embed-text-v2-moe:latest", "live"],
    effects: ["network", "compute"]
  },
  {
    name: "ollama-bge-m3-embed-provider",
    kind: "provider.embedding",
    title: "Ollama BGE-M3 embedding provider",
    description: "Calls the Ollama embedding API with bge-m3:567m.",
    capabilities: ["ollama", "bge-m3:567m", "live"],
    effects: ["network", "compute"]
  },
  {
    name: "nomic-backed-embedder",
    kind: "rag.embedder",
    title: "Nomic-backed embedder",
    description: "Converts chunk sets into embedding batches using the Nomic Ollama provider.",
    capabilities: ["ollama", "nomic-embed-text-v2-moe:latest", "live"],
    effects: ["network", "compute"]
  },
  {
    name: "bge-m3-backed-embedder",
    kind: "rag.embedder",
    title: "BGE-M3-backed embedder",
    description: "Converts chunk sets into embedding batches using the BGE-M3 Ollama provider.",
    capabilities: ["ollama", "bge-m3:567m", "live"],
    effects: ["network", "compute"]
  },
  {
    name: "qdrant-vectorstore",
    kind: "rag.vectorstore",
    title: "Qdrant vector store",
    description: "Creates collections, applies vector mutations, and runs vector queries in Qdrant.",
    capabilities: ["qdrant", "live", "vector-store"],
    effects: ["network", "read_artifact", "write_artifact", "compute"]
  },
  {
    name: "chromadb-vectorstore",
    kind: "rag.vectorstore",
    title: "ChromaDB vector store",
    description: "Creates collections, applies vector mutations, and runs vector queries in ChromaDB.",
    capabilities: ["chromadb", "live", "vector-store"],
    effects: ["network", "read_artifact", "write_artifact", "compute"]
  },
  {
    name: "qdrant-indexer",
    kind: "rag.indexer",
    title: "Qdrant indexer",
    description: "Builds Qdrant index mutations from chunks and embeddings.",
    capabilities: ["qdrant", "live"],
    effects: ["network", "write_artifact", "compute"]
  },
  {
    name: "chromadb-indexer",
    kind: "rag.indexer",
    title: "ChromaDB indexer",
    description: "Builds ChromaDB index mutations from chunks and embeddings.",
    capabilities: ["chromadb", "live"],
    effects: ["network", "write_artifact", "compute"]
  },
  {
    name: "qdrant-retriever",
    kind: "rag.retriever",
    title: "Qdrant retriever",
    description: "Retrieves candidate chunks from Qdrant collections.",
    capabilities: ["qdrant", "live"],
    effects: ["network", "read_artifact", "compute"]
  },
  {
    name: "chromadb-retriever",
    kind: "rag.retriever",
    title: "ChromaDB retriever",
    description: "Retrieves candidate chunks from ChromaDB collections.",
    capabilities: ["chromadb", "live"],
    effects: ["network", "read_artifact", "compute"]
  },
  {
    name: "ollama-llm-reranker",
    kind: "rag.reranker",
    title: "Ollama LLM reranker",
    description: "Reranks candidate chunks with deepseek-v4-flash:cloud through Ollama.",
    capabilities: ["ollama", "deepseek-v4-flash:cloud", "live"],
    effects: ["network", "compute"]
  },
  {
    name: "openai-llm-reranker",
    kind: "rag.reranker",
    title: "OpenAI LLM reranker",
    description: "Reranks candidate chunks with gpt-4o-mini through OpenAI.",
    capabilities: ["openai", "gpt-4o-mini", "live"],
    effects: ["network", "compute"]
  },
  {
    name: "ollama-deepseek-provider",
    kind: "provider.llm",
    title: "Ollama DeepSeek provider",
    description: "Calls the Ollama generation API with deepseek-v4-flash:cloud.",
    capabilities: ["ollama", "deepseek-v4-flash:cloud", "live"],
    effects: ["network", "compute"]
  },
  {
    name: "openai-gpt-4o-mini-provider",
    kind: "provider.llm",
    title: "OpenAI GPT-4o mini provider",
    description: "Calls OpenAI chat completions with gpt-4o-mini.",
    capabilities: ["openai", "gpt-4o-mini", "live"],
    effects: ["network", "compute"]
  },
  {
    name: "ollama-generator",
    kind: "rag.generator",
    title: "Ollama generator",
    description: "Generates grounded answers with deepseek-v4-flash:cloud through Ollama.",
    capabilities: ["ollama", "deepseek-v4-flash:cloud", "live"],
    effects: ["network", "compute"]
  },
  {
    name: "openai-generator",
    kind: "rag.generator",
    title: "OpenAI generator",
    description: "Generates grounded answers with gpt-4o-mini through OpenAI.",
    capabilities: ["openai", "gpt-4o-mini", "live"],
    effects: ["network", "compute"]
  },
  {
    name: "ollama-groundedness-evaluator",
    kind: "rag.evaluator",
    title: "Ollama groundedness evaluator",
    description: "Scores answer groundedness with deepseek-v4-flash:cloud through Ollama.",
    capabilities: ["ollama", "deepseek-v4-flash:cloud", "groundedness", "live"],
    effects: ["network", "compute"]
  },
  {
    name: "openai-groundedness-evaluator",
    kind: "rag.evaluator",
    title: "OpenAI groundedness evaluator",
    description: "Scores answer groundedness with gpt-4o-mini through OpenAI.",
    capabilities: ["openai", "gpt-4o-mini", "groundedness", "live"],
    effects: ["network", "compute"]
  },
  {
    name: "jsonl-observability-sink",
    kind: "observability.sink",
    title: "JSONL observability sink",
    description: "Writes telemetry events to newline-delimited JSON artifacts.",
    capabilities: ["jsonl", "live", "observability"],
    effects: ["write_artifact", "compute"]
  },
  {
    name: "opentelemetry-observability-sink",
    kind: "observability.sink",
    title: "OpenTelemetry-compatible sink",
    description: "Emits telemetry events using OpenTelemetry-compatible attributes.",
    capabilities: ["opentelemetry", "live", "observability"],
    effects: ["network", "write_artifact", "compute"]
  }
];

function descriptor(variant: Variant): PluginDescriptor {
  const slot = slotByKind.get(variant.kind);
  if (!slot) {
    throw new Error(`no port slot registered for ${variant.kind}`);
  }

  return {
    name: variant.name,
    version: "1.0.0",
    kind: variant.kind,
    description: variant.description,
    configSchema: JsonSchemaObjectSchema.parse(emptyConfig),
    inputSchema: aggregateSchema(slot, "input"),
    outputSchema: aggregateSchema(slot, "output"),
    ports: {
      inputs: slot.inputs,
      outputs: slot.outputs
    },
    effects: variant.effects,
    annotations: {
      title: variant.title,
      idempotentHint: true,
      destructiveHint: false,
      openWorldHint: variant.effects.includes("network")
    },
    capabilities: variant.capabilities
  };
}

export const liveRagDescriptors: PluginDescriptor[] = variants.map(descriptor);
export const ragLegoDescriptors = liveRagDescriptors;

export const ragPipelineEdges = portRegistry.legalConnections.map((edge) => {
  const source = resolvePort(edge.from, "output");
  const target = resolvePort(edge.to, "input");
  return {
    ...edge,
    payload: source.port.payload,
    eventType: eventType(source.slot.slot, source.port.port, "output"),
    targetEventType: eventType(target.slot.slot, target.port.port, "input")
  };
});
export const ragLegoEdges = ragPipelineEdges.map((edge) => [edge.from, edge.to] as const);

function resolvePort(ref: string, direction: "input" | "output"): { slot: Slot; port: Slot["inputs"][number] } {
  const [kindPartOne, kindPartTwo, portName] = ref.split(".");
  const kind = `${kindPartOne}.${kindPartTwo}` as ComponentKind;
  const slot = portRegistry.slots.find((candidate) => candidate.kind === kind);
  if (!slot) {
    throw new Error(`unknown slot reference: ${ref}`);
  }
  const ports = direction === "input" ? slot.inputs : slot.outputs;
  const port = ports.find((candidate) => candidate.port === portName);
  if (!port) {
    throw new Error(`unknown ${direction} port reference: ${ref}`);
  }
  return { slot, port };
}

export function validatePortRegistryContracts(): void {
  const seen = new Set<string>();
  for (const slot of portRegistry.slots) {
    for (const direction of ["input", "output"] as const) {
      const ports = direction === "input" ? slot.inputs : slot.outputs;
      if (ports.length === 0) {
        throw new Error(`${slot.kind} must declare ${direction} ports`);
      }
      for (const port of ports) {
        for (const suffix of ["Payload", "Message", "Event"] as const) {
          const name = contractName(slot.slot, port.port, direction, suffix);
          toJsonSchema(name as never);
          seen.add(name);
        }
      }
    }
  }
  if (seen.size === 0) {
    throw new Error("no port contracts registered");
  }
}

export function validateGraphCompatibility(): void {
  for (const edge of portRegistry.legalConnections) {
    const source = resolvePort(edge.from, "output");
    const target = resolvePort(edge.to, "input");
    if (source.port.payload !== target.port.payload) {
      throw new Error(`incompatible graph edge: ${edge.from} -> ${edge.to}`);
    }
  }
}

export function validateLiveRagRegistry(): PluginDescriptor[] {
  const kinds = portRegistry.slots.map((slot) => slot.kind);
  const descriptors = validateRegistry(liveRagDescriptors, kinds);
  for (const kind of kinds) {
    const count = descriptors.filter((descriptor) => descriptor.kind === kind).length;
    if (count !== 2) {
      throw new Error(`${kind} must have exactly two live plugin variants; found ${count}`);
    }
  }
  return descriptors;
}

export const validateRagLegoRegistry = validateLiveRagRegistry;
