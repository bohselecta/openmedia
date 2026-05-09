import type { ModelManifest } from "@/lib/models/manifestTypes";
import { resolveDynamicManifest } from "@/lib/models/dynamicManifests";

export const SAMPLE_MANIFESTS: ModelManifest[] = [
  {
    id: "mock-image-v1",
    providerId: "mock",
    name: "Mock Image v1",
    task: "text-to-image",
    description:
      "Deterministic local mock for demos. No external compute; produces a labeled placeholder frame.",
    version: "1.0.0",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string" },
        width: { type: "number", default: 512 },
        height: { type: "number", default: 512 },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        imageUri: { type: "string" },
      },
    },
    estimatedCost: {
      amount: 0,
      currency: "USD",
      unit: "job",
      explanation: "Mock provider — no charge.",
    },
    tags: ["mock", "image", "mvp"],
    referenceBudget: {
      maxReferences: 8,
      requiresPrimaryReference: false,
    },
  },
  {
    id: "mock-image-i2i-v1",
    providerId: "mock",
    name: "Mock Image-to-Image v1",
    task: "image-to-image",
    description:
      "Mock adapter for structured reference passes — still local SVG output, no remote compute.",
    version: "1.0.0",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string" },
        referenceAssetIds: { type: "array", items: { type: "string" } },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        imageUri: { type: "string" },
      },
    },
    estimatedCost: {
      amount: 0,
      currency: "USD",
      unit: "job",
      explanation: "Mock provider — no charge.",
    },
    tags: ["mock", "image", "i2i"],
    referenceBudget: {
      maxReferences: 6,
      requiresPrimaryReference: true,
    },
  },
  {
    id: "replicate-image-byok-v1",
    providerId: "replicate",
    name: "Replicate image (BYOK)",
    task: "text-to-image",
    description:
      "Call Replicate predictions with your own API token. Set job settings.replicateVersion to a model version (owner/name:version_hash).",
    version: "1.0.0",
    inputSchema: { type: "object" },
    outputSchema: { type: "object" },
    estimatedCost: {
      amount: 0,
      currency: "USD",
      unit: "unknown",
      explanation: "Billed by Replicate to your account — not by OpenMediaForge.",
    },
    tags: ["replicate", "byok", "cloud"],
    referenceBudget: { maxReferences: 0, requiresPrimaryReference: false },
    localOrRemote: "remote",
  },
];

export function getManifestById(id: string): ModelManifest | undefined {
  return SAMPLE_MANIFESTS.find((m) => m.id === id) ?? resolveDynamicManifest(id);
}
