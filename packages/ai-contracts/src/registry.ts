import { ComponentKind, PluginDescriptor, PluginDescriptorSchema, portRegistry } from "./schemas.js";

export function validateDescriptor(value: unknown): PluginDescriptor {
  return PluginDescriptorSchema.parse(value);
}

export function validateRegistry(
  values: unknown[],
  requiredKinds: readonly ComponentKind[] = portRegistry.slots.map((slot) => slot.kind)
): PluginDescriptor[] {
  const descriptors = values.map(validateDescriptor);
  const seen = new Set<string>();
  for (const descriptor of descriptors) {
    const key = `${descriptor.name}@${descriptor.version}`;
    if (seen.has(key)) {
      throw new Error(`duplicate plugin descriptor: ${key}`);
    }
    seen.add(key);
  }

  const present = new Set(descriptors.map((descriptor) => descriptor.kind));
  const missing = requiredKinds.filter((kind) => !present.has(kind));
  if (missing.length > 0) {
    throw new Error(`registry missing component kinds: ${missing.join(", ")}`);
  }

  return descriptors;
}

export function idempotencyFingerprint(input: {
  name: string;
  version: string;
  configDigest: string;
  inputDigest: string;
  idempotencyKey: string;
}): string {
  return [
    input.name,
    input.version,
    input.configDigest,
    input.inputDigest,
    input.idempotencyKey
  ].join(":");
}
