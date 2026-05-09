import { z } from "zod";

/** Validates portable project packet JSON (export); ignores unknown top-level keys for forward compatibility. */
export const projectPacketZ = z
  .object({
    packetSchemaVersion: z.string().optional(),
    appName: z.string().optional(),
    appVersion: z.string().optional(),
    exportedAt: z.string().optional(),
    warning: z.string().optional(),
    project: z.record(z.string(), z.unknown()),
    assets: z.array(z.record(z.string(), z.unknown())),
    assetMap: z.array(z.record(z.string(), z.unknown())),
    jobs: z.array(z.record(z.string(), z.unknown())),
    receipts: z.array(z.record(z.string(), z.unknown())),
    referenceSelectionsByJobId: z
      .record(z.string(), z.array(z.record(z.string(), z.unknown())))
      .optional(),
    storyboardShots: z.array(z.record(z.string(), z.unknown())).optional(),
    promptNotes: z.array(z.record(z.string(), z.unknown())).optional(),
    providersUsed: z.array(z.string()).optional(),
    credentialRefsMetadata: z.array(z.record(z.string(), z.unknown())).optional(),
    providerActivitySummary: z.array(z.record(z.string(), z.unknown())).optional(),
    redactedProviderConfigs: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough();

export type ParsedProjectPacket = z.infer<typeof projectPacketZ>;

export function parseProjectPacketJson(json: string) {
  let raw: unknown;
  try {
    raw = JSON.parse(json) as unknown;
  } catch {
    return { ok: false as const, error: "Invalid JSON" };
  }
  const parsed = projectPacketZ.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.errors.map((e) => e.message).join("; "),
    };
  }
  return { ok: true as const, data: parsed.data };
}

const FORBIDDEN_SUBSTRINGS = [
  "Bearer ",
  "sk-live",
  "sk-ant",
  "-----BEGIN",
  "apiKey",
  "accessToken",
  "bearerToken",
];

export function packetJsonLikelyContainsSecretMaterial(json: string): string | null {
  for (const s of FORBIDDEN_SUBSTRINGS) {
    if (json.includes(s)) return `forbidden pattern: ${s}`;
  }
  return null;
}
