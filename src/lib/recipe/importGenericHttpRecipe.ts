"use client";

import { z } from "zod";
import type {
  GenericHttpAdapterSettings,
  MediaTask,
  ProviderConfig,
} from "@/lib/providers/types";

const mediaTaskZ = z.custom<MediaTask>(
  (v) =>
    typeof v === "string" &&
    [
      "text-to-image",
      "image-to-image",
      "text-to-video",
      "image-to-video",
      "video-to-video",
      "lip-sync",
      "upscale",
      "background-remove",
      "frame-extract",
      "audio-to-video",
    ].includes(v as string),
);

const recipeZ = z
  .object({
    exportKind: z.literal("openmediaforge-generic-http-recipe"),
    version: z.number(),
    label: z.string().min(1),
    providerId: z.literal("generic-http"),
    kind: z.enum(["mock", "local", "remote", "hybrid"]),
    baseUrl: z.string().url().optional(),
    authMode: z.enum(["none", "byok", "header", "bearer", "custom"]),
    enabled: z.boolean().optional(),
    genericHttp: z.object({
      method: z.enum(["GET", "POST", "PUT"]),
      task: mediaTaskZ,
      requestTemplateJson: z.string().min(1),
      responseMapping: z.record(z.string(), z.unknown()),
      polling: z.object({
        mode: z.enum(["none", "get", "post"]),
        intervalMs: z.number(),
        maxAttempts: z.number(),
        pollUrlTemplate: z.string().optional(),
      }),
      outputType: z.enum([
        "imageUrl",
        "imageBase64",
        "videoUrl",
        "jsonOnly",
      ]),
    }),
  })
  .strict();

export type ParsedGenericHttpRecipe = z.infer<typeof recipeZ>;

export function parseGenericHttpRecipeJson(
  raw: string,
): { ok: true; data: ParsedGenericHttpRecipe } | { ok: false; error: string } {
  const forbidden = /\b(apiKey|accessToken|bearerToken|password|secret)\s*:/i;
  if (forbidden.test(raw)) {
    return {
      ok: false,
      error:
        "This file looks like it contains embedded secrets. Remove secret fields and bind credentials from the Keys page after import.",
    };
  }
  let obj: unknown;
  try {
    obj = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, error: "Invalid JSON." };
  }
  const parsed = recipeZ.safeParse(obj);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors.map((e) => e.message).join("; "),
    };
  }
  return { ok: true, data: parsed.data };
}

export function recipeToProviderConfigInput(
  data: ParsedGenericHttpRecipe,
): Omit<ProviderConfig, "id" | "createdAt" | "updatedAt"> {
  return {
    providerId: "generic-http",
    label: data.label,
    kind: data.kind,
    baseUrl: data.baseUrl,
    authMode: data.authMode,
    enabled: data.enabled ?? false,
    genericHttp: data.genericHttp as GenericHttpAdapterSettings,
  };
}
