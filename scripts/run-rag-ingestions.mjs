#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

function Usage() {
  return `Usage: run-rag-ingestions -c <env-file> -d <docs-dir> -o <output-dir>

Options:
  -c, --config       Env file with QDRANT_URL, CHROMA_URL, and OLLAMA_* values.
  -d, --docs-dir     Directory containing example Markdown documents.
  -o, --output-dir   Directory for ingestion evidence output.
  -h, --help         Show this help.
`;
}

function parseArgs(argv) {
  const args = {
    config: ".env.rag-ingestion",
    docsDir: "fixtures/rag-ingestion/docs",
    outputDir: ".sdlc/evidence/rag-ingestions"
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "-h" || arg === "--help") {
      console.log(Usage());
      process.exit(0);
    }
    if ((arg === "-c" || arg === "--config") && next) {
      args.config = next;
      index += 1;
    } else if ((arg === "-d" || arg === "--docs-dir") && next) {
      args.docsDir = next;
      index += 1;
    } else if ((arg === "-o" || arg === "--output-dir") && next) {
      args.outputDir = next;
      index += 1;
    } else {
      throw new Error(`unknown or incomplete argument: ${arg}\n${Usage()}`);
    }
  }
  return args;
}

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (match) env[match[1]] = match[2];
  }
  return { ...process.env, ...env };
}

function sha(value) {
  return createHash("sha256").update(value).digest("hex");
}

function pointId(value) {
  return Number.parseInt(sha(value).slice(0, 12), 16);
}

function chunksFor(text, mode, documentId) {
  const paragraphs = text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  if (mode === "heading-window") {
    return paragraphs.map((paragraph, ordinal) => ({
      chunkId: `${documentId}-${mode}-${ordinal}`,
      documentId,
      ordinal,
      text: paragraph,
      metadata: { chunker: mode }
    }));
  }
  return paragraphs.map((paragraph, ordinal) => ({
    chunkId: `${documentId}-${mode}-${ordinal}`,
    documentId,
    ordinal,
    text: ordinal === 0 ? paragraph : `${paragraphs[ordinal - 1]}\n${paragraph}`,
    metadata: { chunker: mode, overlap: ordinal === 0 ? 0 : 1 }
  }));
}

async function jsonFetch(url, init = {}) {
  const curlArgs = ["-sS", "--max-time", "90"];
  if (init.method) curlArgs.push("-X", init.method);
  curlArgs.push("-H", "content-type: application/json");
  if (init.body) curlArgs.push("-d", init.body);
  curlArgs.push(url);
  try {
    const text = execFileSync("curl", curlArgs, { encoding: "utf8", maxBuffer: 1024 * 1024 * 100 });
    return text ? JSON.parse(text) : null;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${init.method ?? "GET"} ${url} failed: ${detail}`);
  }
}

async function embedTexts(env, model, texts) {
  const body = await jsonFetch(`${env.OLLAMA_BASE_URL}/api/embed`, {
    method: "POST",
    body: JSON.stringify({ model, input: texts })
  });
  if (!Array.isArray(body.embeddings) || body.embeddings.length !== texts.length) {
    throw new Error(`unexpected embedding response for ${model}`);
  }
  return body.embeddings;
}

async function upsertQdrant(env, collection, dimension, points) {
  await jsonFetch(`${env.QDRANT_URL}/collections/${collection}`, {
    method: "PUT",
    body: JSON.stringify({ vectors: { size: dimension, distance: "Cosine" } })
  });
  await jsonFetch(`${env.QDRANT_URL}/collections/${collection}/points?wait=true`, {
    method: "PUT",
    body: JSON.stringify({ points })
  });
  const details = await jsonFetch(`${env.QDRANT_URL}/collections/${collection}`);
  return {
    url: env.QDRANT_URL,
    collection,
    points: details.result.points_count,
    status: details.result.status
  };
}

async function chromaCollection(env, name) {
  const created = await jsonFetch(`${env.CHROMA_URL}/api/v2/tenants/default_tenant/databases/default_database/collections`, {
    method: "POST",
    body: JSON.stringify({ name, get_or_create: true, metadata: { runner: "run-rag-ingestions" } })
  });
  return created.id;
}

async function upsertChroma(env, collection, chunks, embeddings) {
  const collectionId = await chromaCollection(env, collection);
  await jsonFetch(`${env.CHROMA_URL}/api/v2/tenants/default_tenant/databases/default_database/collections/${collectionId}/upsert`, {
    method: "POST",
    body: JSON.stringify({
      ids: chunks.map((chunk) => chunk.chunkId),
      embeddings,
      documents: chunks.map((chunk) => chunk.text),
      metadatas: chunks.map((chunk) => ({
        documentId: chunk.documentId,
        ordinal: chunk.ordinal,
        chunker: chunk.metadata.chunker,
        overlap: chunk.metadata.overlap ?? 0
      }))
    })
  });
  const count = await jsonFetch(`${env.CHROMA_URL}/api/v2/tenants/default_tenant/databases/default_database/collections/${collectionId}/count`);
  return {
    url: env.CHROMA_URL,
    collection,
    collectionId,
    points: Number(count)
  };
}

function loadDocuments(docsDir) {
  return [
    "incident-response.md",
    "plugin-contracts.md",
    "vector-search.md"
  ].map((name) => {
    const path = join(docsDir, name);
    const text = readFileSync(path, "utf8");
    return {
      documentId: basename(name, ".md"),
      path,
      uri: `file://${resolve(path)}`,
      mediaType: "text/markdown",
      text
    };
  });
}

const configurations = [
  {
    runId: "ingest-001",
    loader: "filesystem-loader",
    parser: "markdown-text-parser",
    chunker: "heading-window-chunker",
    chunkerMode: "heading-window",
    embeddingProvider: "ollama-nomic-embed-provider",
    embeddingModelEnv: "OLLAMA_EMBED_NOMIC_MODEL",
    embedder: "nomic-backed-embedder",
    vectorStore: "qdrant-vectorstore",
    indexer: "qdrant-indexer",
    store: "qdrant"
  },
  {
    runId: "ingest-002",
    loader: "filesystem-loader",
    parser: "markdown-text-parser",
    chunker: "semantic-overlap-chunker",
    chunkerMode: "semantic-overlap",
    embeddingProvider: "ollama-bge-m3-embed-provider",
    embeddingModelEnv: "OLLAMA_EMBED_BGE_MODEL",
    embedder: "bge-m3-backed-embedder",
    vectorStore: "qdrant-vectorstore",
    indexer: "qdrant-indexer",
    store: "qdrant"
  },
  {
    runId: "ingest-003",
    loader: "filesystem-loader",
    parser: "markdown-text-parser",
    chunker: "heading-window-chunker",
    chunkerMode: "heading-window",
    embeddingProvider: "ollama-bge-m3-embed-provider",
    embeddingModelEnv: "OLLAMA_EMBED_BGE_MODEL",
    embedder: "bge-m3-backed-embedder",
    vectorStore: "chromadb-vectorstore",
    indexer: "chromadb-indexer",
    store: "chromadb"
  },
  {
    runId: "ingest-004",
    loader: "filesystem-loader",
    parser: "markdown-text-parser",
    chunker: "semantic-overlap-chunker",
    chunkerMode: "semantic-overlap",
    embeddingProvider: "ollama-nomic-embed-provider",
    embeddingModelEnv: "OLLAMA_EMBED_NOMIC_MODEL",
    embedder: "nomic-backed-embedder",
    vectorStore: "chromadb-vectorstore",
    indexer: "chromadb-indexer",
    store: "chromadb"
  }
];

async function runOne(env, docs, config) {
  const phases = [];
  const rawDocuments = docs.map((doc) => ({
    documentId: doc.documentId,
    source: { uri: doc.uri, mediaType: doc.mediaType },
    text: doc.text,
    mediaType: doc.mediaType,
    metadata: { path: doc.path }
  }));
  phases.push({ phase: "loader", plugin: config.loader, documents: rawDocuments.length });

  const parsedDocuments = rawDocuments.map((doc) => ({
    ...doc,
    sections: doc.text.split(/^# /m).filter(Boolean).map((section, index) => ({
      sectionId: `${doc.documentId}-section-${index}`,
      text: section.trim()
    }))
  }));
  phases.push({ phase: "parser", plugin: config.parser, documents: parsedDocuments.length });

  const chunks = parsedDocuments.flatMap((doc) => chunksFor(doc.text, config.chunkerMode, doc.documentId));
  phases.push({ phase: "chunker", plugin: config.chunker, chunks: chunks.length, mode: config.chunkerMode });

  const model = env[config.embeddingModelEnv];
  const embeddings = await embedTexts(env, model, chunks.map((chunk) => chunk.text));
  phases.push({
    phase: "embedding-provider",
    plugin: config.embeddingProvider,
    model,
    vectors: embeddings.length,
    dimension: embeddings[0].length
  });
  phases.push({ phase: "embedder", plugin: config.embedder, vectors: embeddings.length });

  const collection = `pes_${config.runId.replaceAll("-", "_")}`;
  let vectorStore;
  if (config.store === "qdrant") {
    vectorStore = await upsertQdrant(env, collection, embeddings[0].length, chunks.map((chunk, index) => ({
      id: pointId(chunk.chunkId),
      vector: embeddings[index],
      payload: {
        documentId: chunk.documentId,
        chunkId: chunk.chunkId,
        ordinal: chunk.ordinal,
        text: chunk.text,
        chunker: chunk.metadata.chunker,
        overlap: chunk.metadata.overlap ?? 0,
        model
      }
    })));
  } else {
    vectorStore = await upsertChroma(env, collection, chunks, embeddings);
  }
  phases.push({ phase: "vectorstore", plugin: config.vectorStore, store: config.store, ...vectorStore });
  phases.push({ phase: "indexer", plugin: config.indexer, operation: "upsert", points: chunks.length });

  return {
    runId: config.runId,
    configuration: {
      loader: config.loader,
      parser: config.parser,
      chunker: config.chunker,
      embeddingProvider: config.embeddingProvider,
      embedder: config.embedder,
      vectorStore: config.vectorStore,
      indexer: config.indexer
    },
    documents: docs.map((doc) => ({ documentId: doc.documentId, uri: doc.uri })),
    phases
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!existsSync(args.config)) throw new Error(`config file not found: ${args.config}`);
  if (!existsSync(args.docsDir)) throw new Error(`docs dir not found: ${args.docsDir}`);
  mkdirSync(args.outputDir, { recursive: true });

  const env = loadEnv(args.config);
  const docs = loadDocuments(args.docsDir);
  const startedAt = new Date().toISOString();
  const results = [];
  for (const config of configurations) {
    console.log(`running ${config.runId}: ${config.chunker} + ${config.embeddingProvider} + ${config.vectorStore}`);
    results.push(await runOne(env, docs, config));
  }

  const evidence = {
    generatedAt: new Date().toISOString(),
    startedAt,
    configFile: args.config,
    docsDir: args.docsDir,
    outputDir: args.outputDir,
    documentCount: docs.length,
    ingestionCount: results.length,
    results
  };
  const outFile = join(args.outputDir, `rag-ingestions-${startedAt.replace(/[:.]/g, "-")}.json`);
  const latestFile = join(args.outputDir, "latest.json");
  writeFileSync(outFile, `${JSON.stringify(evidence, null, 2)}\n`);
  writeFileSync(latestFile, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`wrote ${outFile}`);
  console.log(`wrote ${latestFile}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
