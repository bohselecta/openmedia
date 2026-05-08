import type { ProviderConfig } from "@/lib/providers/types";
import {
  fetchComfyObjectInfo,
  fetchComfySystemStats,
} from "@/lib/providers/comfyClient";

export async function testComfyProviderConfig(
  cfg: ProviderConfig,
): Promise<{ ok: boolean; message: string }> {
  const base = (cfg.baseUrl ?? "").trim();
  if (!base) {
    return { ok: false, message: "baseUrl is required." };
  }
  const timeoutMs = cfg.comfy?.timeoutMs ?? 12_000;
  try {
    const stats = await fetchComfySystemStats(base, timeoutMs);
    const info = await fetchComfyObjectInfo(base, timeoutMs);
    const nodeHint =
      info && typeof info === "object" ?
        `${Object.keys(info as object).length} node types in object_info`
      : "object_info present";
    const sys =
      stats && typeof stats === "object" ?
        JSON.stringify(stats).slice(0, 240)
      : "system_stats present";
    return {
      ok: true,
      message: `ComfyUI reachable. ${nodeHint}. Stats preview: ${sys}`,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Connection failed.",
    };
  }
}
