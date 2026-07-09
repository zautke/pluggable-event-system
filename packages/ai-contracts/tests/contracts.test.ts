import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import descriptorFixture from "../../../fixtures/ai-contracts/plugin-descriptor-loader.json" with { type: "json" };
import loadRequestEventFixture from "../../../fixtures/ai-contracts/loader-load-request-event.json" with { type: "json" };
import rawDocumentEventFixture from "../../../fixtures/ai-contracts/loader-raw-document-output-event.json" with { type: "json" };
import errorEventFixture from "../../../fixtures/ai-contracts/output-error-event.json" with { type: "json" };
import documentFixture from "../../../fixtures/ai-contracts/rag-document.json" with { type: "json" };
import {
  BaseRagEventSchema,
  PluginDescriptorSchema,
  RagDocumentSchema,
  contractName,
  contractSchemas,
  descriptorToMcpTool,
  eventType,
  exportJsonSchemas,
  idempotencyFingerprint,
  liveRagDescriptors,
  loadPortRegistry,
  payloadSchemas,
  portRegistry,
  ragPipelineEdges,
  validateGraphCompatibility,
  validateLiveRagRegistry,
  validatePortRegistryContracts,
  validateRegistry,
  wireSchemas
} from "../src/index.js";

const root = process.cwd();
const fixturesDir = join(root, "fixtures", "ai-contracts");
const csharpContractsFile = join(root, "csharp", "AiContracts", "Contracts.cs");
const pythonModelsFile = join(root, "python", "ai_contracts", "ai_contracts", "models.py");

function readFixtureText(): string {
  return readdirSync(fixturesDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => readFileSync(join(fixturesDir, name), "utf8"))
    .join("\n");
}

describe("port registry", () => {
  it("loads port-registry.yaml as the contract source", () => {
    const registry = loadPortRegistry();
    expect(registry.eventSchemaDraft).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(registry.slots).toHaveLength(13);
    expect(registry.slots.map((slot) => slot.kind)).toContain("provider.llm");
    expect(registry.slots.map((slot) => slot.kind)).toContain("provider.embedding");
    expect(registry.slots.map((slot) => slot.kind)).toContain("rag.vectorstore");
  });

  it("declares concrete contracts for every port direction", () => {
    expect(() => validatePortRegistryContracts()).not.toThrow();
    for (const slot of portRegistry.slots) {
      for (const direction of ["input", "output"] as const) {
        const ports = direction === "input" ? slot.inputs : slot.outputs;
        expect(ports.length).toBeGreaterThan(0);
        for (const port of ports) {
          expect(payloadSchemas[port.payload as keyof typeof payloadSchemas]).toBeDefined();
          for (const suffix of ["Payload", "Message", "Event"] as const) {
            const name = contractName(slot.slot, port.port, direction, suffix);
            expect(contractSchemas[name], name).toBeDefined();
          }
          expect(eventType(slot.slot, port.port, direction)).toBe(`${slot.slot}.${port.port}.${direction}.v1`);
        }
      }
    }
  });

  it("registers compatible legal graph edges", () => {
    expect(() => validateGraphCompatibility()).not.toThrow();
    for (const edge of ragPipelineEdges) {
      expect(edge.payload).toBeTruthy();
      expect(edge.eventType).toMatch(/\.output\.v1$/);
      expect(edge.targetEventType).toMatch(/\.input\.v1$/);
    }
  });
});

describe("event contracts", () => {
  it("validates shared event fixtures", () => {
    expect(PluginDescriptorSchema.parse(descriptorFixture).name).toBe("filesystem-loader");
    const inputEvent = contractSchemas.LoaderLoadRequestInputEvent.parse(loadRequestEventFixture) as { type: string };
    const successEvent = contractSchemas.LoaderRawDocumentOutputEvent.parse(rawDocumentEventFixture) as { data: { status: string } };
    const errorEvent = contractSchemas.LoaderRawDocumentOutputEvent.parse(errorEventFixture) as { data: { status: string } };
    expect(inputEvent.type).toBe("loader.loadRequest.input.v1");
    expect(successEvent.data.status).toBe("success");
    expect(errorEvent.data.status).toBe("error");
    expect(RagDocumentSchema.parse(documentFixture).documentId).toBe("doc-001");
    expect(BaseRagEventSchema.parse(rawDocumentEventFixture).datacontenttype).toBe("application/json");
  });

  it("uses success/error output discriminators", () => {
    expect(() => contractSchemas.LoaderRawDocumentOutputPayload.parse({ status: "ok", output: {} })).toThrow();
    expect(() => contractSchemas.LoaderRawDocumentOutputPayload.parse(errorEventFixture.data)).not.toThrow();
  });

  it("exports every concrete event as JSON Schema draft 2020-12", () => {
    const schemas = exportJsonSchemas();
    const eventNames = Object.keys(contractSchemas).filter((name) => name.endsWith("Event"));
    expect(eventNames.length).toBeGreaterThan(20);
    for (const name of eventNames) {
      expect(schemas[name].$schema, name).toBe("https://json-schema.org/draft/2020-12/schema");
      expect(schemas[name].$id, name).toContain(`${name}.schema.json`);
    }
    expect(Object.keys(wireSchemas)).toContain("GeneratorAnswerOutputEvent");
  });
});

describe("live plugin descriptors", () => {
  it("has exactly two live plugin variants per slot", () => {
    const descriptors = validateLiveRagRegistry();
    expect(descriptors).toHaveLength(portRegistry.slots.length * 2);
    for (const slot of portRegistry.slots) {
      expect(descriptors.filter((descriptor) => descriptor.kind === slot.kind)).toHaveLength(2);
    }
    expect(() => validateRegistry([descriptorFixture, descriptorFixture], ["rag.loader"])).toThrow(/duplicate/);
  });

  it("maps descriptors to MCP-style tool metadata", () => {
    const tool = descriptorToMcpTool(PluginDescriptorSchema.parse(descriptorFixture));
    expect(tool.name).toBe("filesystem-loader");
    expect(tool.inputSchema).toEqual(descriptorFixture.inputSchema);
    expect(tool.annotations.idempotentHint).toBe(true);
  });

  it("does not contain retired scaffold markers in descriptors or fixtures", () => {
    const descriptorText = JSON.stringify(liveRagDescriptors);
    const fixtureText = readFixtureText();
    for (const text of [descriptorText, fixtureText]) {
      expect(text).not.toMatch(/\bmock\b/i);
      expect(text).not.toMatch(/\bfake\b/i);
      expect(text).not.toContain("deterministic.fake.embedding");
      expect(text).not.toContain("memory://");
    }
  });
});

describe("cross-language surfaces", () => {
  it("has Python and C# concrete contract names for every generated event", () => {
    expect(existsSync(pythonModelsFile)).toBe(true);
    expect(existsSync(csharpContractsFile)).toBe(true);
    const python = readFileSync(pythonModelsFile, "utf8");
    const csharp = readFileSync(csharpContractsFile, "utf8");
    expect(python).toContain("CONTRACT_MODELS");
    expect(python).toContain("CONTRACT_TYPED_DICTS");
    for (const name of Object.keys(contractSchemas).filter((item) => item.endsWith("Event"))) {
      expect(csharp, name).toContain(`record ${name}`);
    }
  });

  it("keeps the shared idempotency fingerprint stable", () => {
    expect(idempotencyFingerprint({
      name: "filesystem-loader",
      version: "1.0.0",
      configDigest: "sha256:config",
      inputDigest: "sha256:input",
      idempotencyKey: "project-a:load:001"
    })).toBe("filesystem-loader:1.0.0:sha256:config:sha256:input:project-a:load:001");
  });
});

describe("gated live smoke contracts", () => {
  const runLive = process.env.RUN_LIVE_SMOKE === "1";
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? "https://ollama2.braisenly.com";

  it.skipIf(!runLive)("sees required Ollama models", async () => {
    const response = await fetch(`${ollamaBaseUrl}/api/tags`);
    expect(response.ok).toBe(true);
    const body = await response.text();
    expect(body).toContain("deepseek-v4-flash:cloud");
    expect(body).toContain("nomic-embed-text-v2-moe:latest");
    expect(body).toContain("bge-m3:567m");
  }, 30_000);

  it.skipIf(!runLive)("gets numeric Ollama embeddings", async () => {
    const response = await fetch(`${ollamaBaseUrl}/api/embed`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: "nomic-embed-text-v2-moe:latest", input: "contract smoke" })
    });
    expect(response.ok).toBe(true);
    const body = await response.json() as { embeddings?: unknown[][] };
    expect(typeof body.embeddings?.[0]?.[0]).toBe("number");
  }, 30_000);

  it.skipIf(!runLive)("gets non-empty Ollama LLM output", async () => {
    const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: "deepseek-v4-flash:cloud", prompt: "Reply with ok.", stream: false })
    });
    expect(response.ok).toBe(true);
    const body = await response.json() as { response?: string };
    expect(body.response?.trim()).toBeTruthy();
  }, 60_000);
});
