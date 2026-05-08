import { z } from "zod";
import type { ModelManifest } from "@/lib/models/manifestTypes";

const manifestSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  name: z.string().min(1),
  task: z.enum([
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
  ]),
  inputSchema: z.record(z.unknown()),
  outputSchema: z.record(z.unknown()),
  tags: z.array(z.string()),
});

export function validateManifest(m: unknown): {
  ok: boolean;
  errors: string[];
  data?: ModelManifest;
} {
  const parsed = manifestSchema.safeParse(m);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (e) => `${e.path.join(".")}: ${e.message}`,
      ),
    };
  }
  return { ok: true, errors: [], data: m as ModelManifest };
}
