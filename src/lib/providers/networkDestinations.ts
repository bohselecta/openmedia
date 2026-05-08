import { useProviderConfigStore } from "@/lib/providers/providerConfigStore";
import { parseGenericModelId } from "@/lib/providers/genericHttpProvider";
import type { GenerationRequest } from "@/lib/providers/types";

/**
 * Declares network touchpoints for execution tickets, jobs, and receipts.
 * Host-only patterns — no secrets.
 */
export function computeNetworkDestinations(
  request: GenerationRequest,
): string[] {
  if (request.providerId === "mock") return [];
  if (request.providerId === "generic-http") {
    const cid = parseGenericModelId(request.modelId);
    const cfg = cid ? useProviderConfigStore.getState().getProviderConfig(cid) : undefined;
    if (!cfg?.baseUrl?.trim()) return ["generic-http:(missing baseUrl)"];
    try {
      const u = new URL(cfg.baseUrl.trim());
      const path = u.pathname && u.pathname !== "/" ? u.pathname : "";
      return [`generic-http ${cfg.genericHttp?.method ?? "POST"} ${u.host}${path}`];
    } catch {
      return ["generic-http:(invalid baseUrl)"];
    }
  }
  if (request.providerId === "comfyui-local") {
    const cfg = useProviderConfigStore
      .getState()
      .getActiveConfigForProvider("comfyui-local");
    if (!cfg?.baseUrl?.trim()) return ["comfyui-local:(no baseUrl)"];
    try {
      const host = new URL(cfg.baseUrl.trim()).host;
      return [
        "Note: No API key required — local ComfyUI user server.",
        `comfyui-local ${host} GET /system_stats`,
        `comfyui-local ${host} GET /object_info`,
        `comfyui-local ${host} POST /prompt`,
        `comfyui-local ${host} GET /history/{prompt_id}`,
        `comfyui-local ${host} GET /view`,
      ];
    } catch {
      return ["comfyui-local:(invalid baseUrl)"];
    }
  }
  return [];
}
