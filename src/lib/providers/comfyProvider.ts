import { useAssetStore } from "@/lib/assets/assetStore";
import {
  comfyViewUrl,
  fetchComfyHistory,
  postComfyInterrupt,
  postComfyPrompt,
  uploadComfyImage,
} from "@/lib/providers/comfyClient";
import { useProviderConfigStore } from "@/lib/providers/providerConfigStore";
import {
  defaultReferenceBudgetForComfyTask,
  modelIdForComfyTemplate,
  parseComfyModelId,
  parseWorkflowJson,
  validateComfyTemplate,
} from "@/lib/providers/comfyWorkflowTemplates";
import type {
  ComfyWorkflowTemplate,
  ExecutionTicket,
  GenerationProvider,
  GenerationRequest,
  JobHandle,
  JobStatus,
  ModelManifest,
  ProviderConfig,
  ValidationResult,
} from "@/lib/providers/types";

type ComfyRuntime = {
  promptId: string;
  baseUrl: string;
  template: ComfyWorkflowTemplate;
  timeoutMs: number;
  pollIntervalMs: number;
  maxPollAttempts: number;
  pollCount: number;
  phase: "queued" | "running" | "done" | "failed";
  outputs?: JobStatus["outputAssets"];
  error?: string;
};

const comfyRuntime = new Map<string, ComfyRuntime>();

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `comfy-job-${Date.now()}`;
}

function setByPath(workflow: unknown, path: string, value: unknown): void {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = workflow;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]!;
    if (!cur || typeof cur !== "object") return;
    cur = (cur as Record<string, unknown>)[k];
  }
  const last = parts[parts.length - 1]!;
  if (cur && typeof cur === "object" && !Array.isArray(cur)) {
    (cur as Record<string, unknown>)[last] = value;
  }
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function findTemplateAndConfig(
  templateId: string,
): { cfg: ProviderConfig; tpl: ComfyWorkflowTemplate } | undefined {
  const cfg = useProviderConfigStore.getState().getActiveConfigForProvider("comfyui-local");
  if (!cfg?.comfy) return undefined;
  const tpl = cfg.comfy.templates.find((t) => t.id === templateId);
  if (!tpl) return undefined;
  return { cfg, tpl };
}

function manifestFromComfyTemplate(
  cfg: ProviderConfig,
  tpl: ComfyWorkflowTemplate,
): ModelManifest {
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

export const comfyProvider: GenerationProvider = {
  id: "comfyui-local",
  name: "ComfyUI (local)",
  kind: "local",
  capabilities: ["text-to-image", "image-to-image"],
  listModels: async (): Promise<ModelManifest[]> => {
    const cfg = useProviderConfigStore.getState().getActiveConfigForProvider("comfyui-local");
    if (!cfg?.enabled || !cfg.comfy) return [];
    const out: ModelManifest[] = [];
    for (const tpl of cfg.comfy.templates) {
      const v = validateComfyTemplate(tpl);
      if (v.ok) out.push(manifestFromComfyTemplate(cfg, tpl));
    }
    return out;
  },
  validate: async (request: GenerationRequest): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (request.providerId !== "comfyui-local") {
      errors.push("Provider mismatch.");
    }
    const tid = parseComfyModelId(request.modelId);
    if (!tid) {
      errors.push("Model id must be comfy:{templateId}.");
      return { ok: false, errors, warnings };
    }
    const found = findTemplateAndConfig(tid);
    if (!found) {
      errors.push("No runnable Comfy template on active config — import and validate a workflow.");
      return { ok: false, errors, warnings };
    }
    const { cfg, tpl } = found;
    if (!cfg.enabled) {
      errors.push("ComfyUI config is disabled.");
    }
    const v = validateComfyTemplate(tpl);
    if (!v.ok) {
      errors.push(...v.errors);
    }
    if (request.task !== tpl.task) {
      errors.push("Studio task does not match template task.");
    }
    if (!request.prompt?.trim()) {
      errors.push("Prompt is required.");
    }
    if (tpl.task === "image-to-image") {
      const refs = request.referenceSelections?.length ?? 0;
      if (refs < 1 && request.inputAssetIds.length < 1) {
        errors.push("Image-to-image requires at least one reference or input asset.");
      }
      if (!tpl.imageInputPath) {
        errors.push("Template needs imageInputPath for image-to-image.");
      }
    }
    return { ok: errors.length === 0, errors, warnings };
  },
  submit: async (request: GenerationRequest, ticket: ExecutionTicket): Promise<JobHandle> => {
    void ticket;
    const tid = parseComfyModelId(request.modelId)!;
    const { cfg, tpl } = findTemplateAndConfig(tid)!;
    const parsed = parseWorkflowJson(tpl.workflowJson);
    if (!parsed.graph) throw new Error("Invalid workflow JSON.");
    const workflow = deepClone(parsed.graph) as Record<string, unknown>;
    if (tpl.promptPath) setByPath(workflow, tpl.promptPath, request.prompt ?? "");
    if (tpl.negativePromptPath && request.negativePrompt) {
      setByPath(workflow, tpl.negativePromptPath, request.negativePrompt);
    }
    if (tpl.seedPath) {
      const seed =
        request.settings?.seed !== undefined ?
          Number(request.settings.seed)
        : Math.floor(Math.random() * 1e9);
      setByPath(workflow, tpl.seedPath, seed);
    }
    if (tpl.widthPath) {
      setByPath(
        workflow,
        tpl.widthPath,
        Number((request.settings?.width as number | undefined) ?? 512),
      );
    }
    if (tpl.heightPath) {
      setByPath(
        workflow,
        tpl.heightPath,
        Number((request.settings?.height as number | undefined) ?? 512),
      );
    }
    if (tpl.task === "image-to-image" && tpl.imageInputPath) {
      const assetId =
        request.referenceSelections?.[0]?.assetId ?? request.inputAssetIds[0];
      const asset = useAssetStore.getState().assets.find((a) => a.id === assetId);
      if (!asset) throw new Error("Reference asset not found for Comfy upload.");
      const res = await fetch(asset.uri);
      const blob = await res.blob();
      const up = await uploadComfyImage(
        cfg.baseUrl!.replace(/\/+$/, ""),
        blob,
        `omf-${asset.id}.png`,
        cfg.comfy!.timeoutMs,
      );
      if (!up.name) throw new Error("Comfy upload did not return filename.");
      setByPath(workflow, tpl.imageInputPath, up.name);
    }
    const clientId = newId();
    const body = await postComfyPrompt(
      cfg.baseUrl!.replace(/\/+$/, ""),
      { prompt: workflow, client_id: clientId },
      cfg.comfy!.timeoutMs,
    );
    if (!body.prompt_id) {
      throw new Error(
        typeof body.error === "string" ?
          body.error
        : "ComfyUI /prompt did not return prompt_id.",
      );
    }
    const internalId = newId();
    comfyRuntime.set(internalId, {
      promptId: body.prompt_id,
      baseUrl: cfg.baseUrl!.replace(/\/+$/, ""),
      template: tpl,
      timeoutMs: cfg.comfy!.timeoutMs,
      pollIntervalMs: cfg.comfy!.pollIntervalMs,
      maxPollAttempts: cfg.comfy!.maxPollAttempts,
      pollCount: 0,
      phase: "running",
    });
    return { providerJobId: internalId, status: "running" };
  },
  poll: async (jobId: string, ticket: ExecutionTicket): Promise<JobStatus> => {
    void ticket;
    const row = comfyRuntime.get(jobId);
    if (!row) {
      return {
        providerJobId: jobId,
        status: "failed",
        progress: 0,
        error: "Unknown Comfy job.",
      };
    }
    if (row.phase === "done" && row.outputs) {
      return {
        providerJobId: jobId,
        status: "completed",
        progress: 100,
        outputAssets: row.outputs,
      };
    }
    if (row.phase === "failed") {
      return {
        providerJobId: jobId,
        status: "failed",
        progress: 0,
        error: row.error ?? "Comfy job failed.",
      };
    }
    if (row.pollCount >= row.maxPollAttempts) {
      comfyRuntime.delete(jobId);
      return {
        providerJobId: jobId,
        status: "failed",
        progress: 0,
        error: "Comfy history polling exhausted.",
      };
    }
    row.pollCount += 1;
    const hist = (await fetchComfyHistory(
      row.baseUrl,
      row.promptId,
      row.timeoutMs,
    )) as Record<string, unknown>;
    let entry = hist[row.promptId] as Record<string, unknown> | undefined;
    if (!entry && hist.outputs && typeof hist.outputs === "object") {
      entry = hist;
    }
    if (!entry) {
      const progress = Math.min(90, 15 + row.pollCount * 8);
      comfyRuntime.set(jobId, row);
      return { providerJobId: jobId, status: "running", progress };
    }
    const status = entry.status as Record<string, unknown> | undefined;
    if (status && status.completed === false && status.error) {
      row.phase = "failed";
      row.error = String(status.error);
      comfyRuntime.set(jobId, row);
      return {
        providerJobId: jobId,
        status: "failed",
        progress: 0,
        error: row.error,
      };
    }
    const outputs = entry.outputs as Record<string, { images?: Array<Record<string, string>> }> | undefined;
    const assetsOut: NonNullable<JobStatus["outputAssets"]> = [];
    if (outputs) {
      const nodeIds =
        row.template.outputNodeIds.length > 0 ?
          row.template.outputNodeIds
        : Object.keys(outputs);
      for (const nodeId of nodeIds) {
        const block = outputs[nodeId];
        const images = block?.images;
        if (!images?.length) continue;
        for (const im of images) {
          const filename = im.filename;
          const subfolder = im.subfolder ?? "";
          const type = im.type ?? "output";
          if (!filename) continue;
          const uri = comfyViewUrl(row.baseUrl, filename, subfolder, type);
          assetsOut.push({
            kind: "image",
            uri,
            mimeType: "image/png",
            label: `Comfy · ${nodeId}`,
          });
        }
      }
    }
    if (assetsOut.length > 0) {
      row.phase = "done";
      row.outputs = assetsOut;
      comfyRuntime.set(jobId, row);
      return {
        providerJobId: jobId,
        status: "completed",
        progress: 100,
        outputAssets: assetsOut,
      };
    }
    const progress = Math.min(92, 20 + row.pollCount * 6);
    comfyRuntime.set(jobId, row);
    return { providerJobId: jobId, status: "running", progress };
  },
  cancel: async (jobId: string, ticket: ExecutionTicket) => {
    void ticket;
    const row = comfyRuntime.get(jobId);
    if (!row) return;
    try {
      await postComfyInterrupt(row.baseUrl, row.timeoutMs);
    } catch {
      /* best-effort */
    }
    row.phase = "failed";
    row.error = "Canceled";
    comfyRuntime.set(jobId, row);
  },
};

export function resetComfyRuntimeForTests() {
  comfyRuntime.clear();
}
