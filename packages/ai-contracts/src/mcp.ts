import { PluginDescriptor } from "./schemas.js";

export interface McpToolMetadata {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  annotations: PluginDescriptor["annotations"];
}

export function descriptorToMcpTool(descriptor: PluginDescriptor): McpToolMetadata {
  return {
    name: descriptor.name,
    description: descriptor.description,
    inputSchema: descriptor.inputSchema,
    outputSchema: descriptor.outputSchema,
    annotations: {
      ...descriptor.annotations,
      idempotentHint: descriptor.annotations.idempotentHint ?? true
    }
  };
}
