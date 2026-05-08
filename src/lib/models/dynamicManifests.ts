import { useProviderConfigStore } from "@/lib/providers/providerConfigStore";
import {
  defaultReferenceBudgetForComfyTask,
  modelIdForComfyTemplate,
  parseComfyModelId,
  validateComfyTemplate,
} from "@/lib/providers/comfyWorkflowTemplates";
import { modelIdForGenericConfig, parseGenericModelId } from "@/lib/providers/genericHttpProvider";
import type { ModelManifest } from "@/lib/models/manifestTypes";

export function resolveDynamicManifest(modelId: string): ModelManifest | undefined {
  const gid = parseGenericModelId(modelId);
  if (gid) {
    const cfg = useProviderConfigStore.getState().getProviderConfig(gid);
    if (!cfg?.genericHttp || !cfg.enabled) return undefined;
    const gh = cfg.genericHttp;
    return {
      id: modelIdForGenericConfig(cfg.id),
      providerId: "generic-http",
      name: cfg.label,
      task: gh.task,
      description: "User-configured Generic HTTP endpoint.",
      version: "1.0.0",
      inputSchema: { type: "object" },
      outputSchema: { type: "object" },
      tags: ["generic-http", "byo-endpoint"],
      estimatedCost: {
        amount: 0,
        currency: "USD",
        unit: "unknown",
        explanation: "User-controlled endpoint — cost unknown.",
      },
      referenceBudget: gh.referenceBudget ?? {
        maxReferences: gh.task === "image-to-image" ? 4 : 0,
        requiresPrimaryReference: gh.task === "image-to-image",
      },
      localOrRemote: "remote",
    };
  }
  const tid = parseComfyModelId(modelId);
  if (tid) {
    const cfg = useProviderConfigStore
      .getState()
      .getActiveConfigForProvider("comfyui-local");
    if (!cfg?.comfy || !cfg.enabled) return undefined;
    const tpl = cfg.comfy.templates.find((t) => t.id === tid);
    if (!tpl) return undefined;
    const v = validateComfyTemplate(tpl);
    if (!v.ok) return undefined;
    const rb = defaultReferenceBudgetForComfyTask(tpl.task);
    return {
      id: modelIdForComfyTemplate(tpl.id),
      providerId: "comfyui-local",
      name: tpl.label,
      task: tpl.task,
      description: tpl.description ?? "User-defined ComfyUI workflow template.",
      version: "1.0.0",
      inputSchema: { type: "object" },
      outputSchema: { type: "object" },
      tags: ["comfyui", "local"],
      estimatedCost: {
        amount: 0,
        currency: "USD",
        unit: "unknown",
        explanation: "Local ComfyUI — no OpenMediaForge metering.",
      },
      referenceBudget: rb,
      localOrRemote: "local",
    };
  }
  return undefined;
}
