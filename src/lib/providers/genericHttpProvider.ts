import { loadDevSecret } from "@/lib/keyrail/browserDevVault";
import { useProviderConfigStore } from "@/lib/providers/providerConfigStore";
import type {
  ExecutionTicket,
  GenerationProvider,
  GenerationRequest,
  JobHandle,
  JobStatus,
  ModelManifest,
  ProviderConfig,
  ValidationResult,
} from "@/lib/providers/types";

type GenericRuntime = {
  phase: "submit" | "poll" | "done";
  remoteJobId?: string;
  pollAttempt: number;
  configId: string;
  lastResponse?: unknown;
  outputResolved?: JobStatus["outputAssets"];
  error?: string;
  pollContext?: {
    prompt?: string;
    negativePrompt?: string;
    settings: Record<string, unknown>;
    projectId?: string;
    inputAssetIds: string[];
    referenceSelections: GenerationRequest["referenceSelections"];
  };
};

const runtime = new Map<string, GenericRuntime>();

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `gh-${Date.now()}`;
}

export function modelIdForGenericConfig(configId: string) {
  return `generic-http:${configId}`;
}

export function parseGenericModelId(modelId: string): string | null {
  if (!modelId.startsWith("generic-http:")) return null;
  return modelId.slice("generic-http:".length);
}

export function getValueByPath(obj: unknown, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    if (Array.isArray(cur) && /^\d+$/.test(p)) {
      cur = cur[Number(p)];
    } else if (typeof cur === "object" && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

function stringifyInterpolationVars(request: GenerationRequest): Record<string, string> {
  const w = Number((request.settings?.width as number | undefined) ?? 512);
  const h = Number((request.settings?.height as number | undefined) ?? 512);
  const seed =
    request.settings?.seed !== undefined ? String(request.settings.seed) : "0";
  const handles =
    request.referenceSelections?.map((r) => r.stableHandle).join(", ") ?? "";
  return {
    prompt: request.prompt ?? "",
    negativePrompt: request.negativePrompt ?? "",
    modelId: request.modelId,
    seed,
    projectId: request.projectId ?? "",
    referenceHandles: handles,
    inputAssetUrls: JSON.stringify([]),
    "settings.width": String(w),
    "settings.height": String(h),
  };
}

export function interpolateTemplate(
  template: string,
  request: GenerationRequest,
  extra: Record<string, string> = {},
): string {
  const vars = { ...stringifyInterpolationVars(request), ...extra };
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    const k = String(key).trim();
    if (k in vars) return vars[k] ?? "";
    return "";
  });
}

export function validateGenericHttpConfig(cfg: ProviderConfig): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (cfg.providerId !== "generic-http") {
    errors.push("Not a Generic HTTP config.");
  }
  if (!cfg.baseUrl?.trim()) {
    errors.push("baseUrl is required.");
  } else {
    try {
      new URL(cfg.baseUrl.trim());
    } catch {
      errors.push("baseUrl must be a valid URL.");
    }
  }
  const gh = cfg.genericHttp;
  if (!gh) {
    errors.push("genericHttp adapter settings are required.");
    return { ok: false, errors };
  }
  if (!gh.requestTemplateJson?.trim()) {
    errors.push("requestTemplateJson is required.");
  } else {
    const probe = interpolateTemplate(
      gh.requestTemplateJson,
      {
        providerId: "generic-http",
        modelId: modelIdForGenericConfig(cfg.id),
        task: gh.task,
        prompt: "x",
        settings: { width: 1, height: 1, seed: 1 },
        inputAssetIds: [],
        referenceSelections: [],
        outputPolicy: "local-only",
      } as GenerationRequest,
      { inputAssetUrls: "[]" },
    );
    try {
      JSON.parse(probe);
    } catch {
      errors.push(
        "requestTemplateJson must be valid JSON after placeholder substitution.",
      );
    }
  }
  if (
    gh.outputType !== "jsonOnly" &&
    !gh.responseMapping.outputUrlPath &&
    !gh.responseMapping.outputBase64Path
  ) {
    errors.push(
      "responseMapping must include outputUrlPath or outputBase64Path unless outputType is jsonOnly.",
    );
  }
  if (gh.polling.mode !== "none") {
    if (!gh.polling.pollUrlTemplate?.trim()) {
      errors.push("pollUrlTemplate is required when polling is enabled.");
    }
    if (gh.polling.intervalMs < 200) {
      errors.push("polling.intervalMs must be at least 200.");
    }
    if (gh.polling.maxAttempts < 1) {
      errors.push("polling.maxAttempts must be at least 1.");
    }
  }
  return { ok: errors.length === 0, errors };
}

function resolveConfigForRequest(request: GenerationRequest): ProviderConfig | undefined {
  const id = parseGenericModelId(request.modelId);
  if (!id) return undefined;
  return useProviderConfigStore.getState().getProviderConfig(id);
}

async function buildAuthHeaders(
  cfg: ProviderConfig,
  ticket: ExecutionTicket,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (cfg.authMode === "none") return headers;
  const ref = ticket.credentialRef ?? cfg.credentialRef;
  if (!ref) return headers;
  const secret = await loadDevSecret(ref);
  if (!secret) return headers;
  if (cfg.authMode === "bearer") {
    headers.Authorization = `Bearer ${secret}`;
  } else if (cfg.authMode === "header" || cfg.authMode === "byok") {
    headers["X-API-Key"] = secret;
  } else if (cfg.authMode === "custom") {
    const name = cfg.genericHttp?.customAuthHeaderName?.trim();
    if (name) headers[name] = secret;
  }
  return headers;
}

async function doFetch(
  url: string,
  init: RequestInit,
): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }
  return { ok: res.ok, status: res.status, json, text };
}

function outputsFromGeneric(
  body: unknown,
  cfg: ProviderConfig,
): JobStatus["outputAssets"] | undefined {
  const gh = cfg.genericHttp;
  if (!gh) return undefined;
  const map = gh.responseMapping;
  if (gh.outputType === "jsonOnly") {
    return [
      {
        kind: "text" as const,
        uri: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(body))}`,
        mimeType: "application/json",
        label: "JSON response",
      },
    ];
  }
  const urlPath = map.outputUrlPath;
  const b64Path = map.outputBase64Path;
  if (urlPath) {
    const u = getValueByPath(body, urlPath);
    if (typeof u === "string" && u.length > 0) {
      return [
        {
          kind: "image" as const,
          uri: u,
          mimeType: u.startsWith("data:") ? undefined : "image/png",
          label: "HTTP output",
        },
      ];
    }
  }
  if (b64Path) {
    const b = getValueByPath(body, b64Path);
    if (typeof b === "string" && b.length > 0) {
      const uri = b.startsWith("data:") ? b : `data:image/png;base64,${b}`;
      return [{ kind: "image" as const, uri, mimeType: "image/png", label: "HTTP output" }];
    }
  }
  if (gh.outputType === "videoUrl" && urlPath) {
    const u = getValueByPath(body, urlPath);
    if (typeof u === "string") {
      return [{ kind: "video" as const, uri: u, label: "HTTP output" }];
    }
  }
  return undefined;
}

function manifestFromGenericConfig(c: ProviderConfig): ModelManifest {
  const gh = c.genericHttp!;
  return {
    id: modelIdForGenericConfig(c.id),
    providerId: "generic-http",
    name: c.label,
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

export const genericHttpProvider: GenerationProvider = {
  id: "generic-http",
  name: "Generic HTTP",
  kind: "remote",
  capabilities: ["text-to-image", "image-to-image", "text-to-video"],
  listModels: async (): Promise<ModelManifest[]> => {
    const list = useProviderConfigStore
      .getState()
      .listProviderConfigs()
      .filter((c) => c.providerId === "generic-http" && c.enabled);
    return list.map((c) => manifestFromGenericConfig(c));
  },
  validate: async (request: GenerationRequest): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (request.providerId !== "generic-http") {
      errors.push("Provider mismatch.");
    }
    const cfg = resolveConfigForRequest(request);
    if (!cfg) {
      errors.push("Unknown or missing Generic HTTP config for model id.");
      return { ok: false, errors, warnings };
    }
    if (!cfg.enabled) {
      errors.push("Generic HTTP config is disabled.");
    }
    const v = validateGenericHttpConfig(cfg);
    errors.push(...v.errors);
    if (request.task !== cfg.genericHttp?.task) {
      errors.push("Studio task does not match Generic HTTP config task.");
    }
    if (
      cfg.authMode === "bearer" ||
      cfg.authMode === "header" ||
      cfg.authMode === "custom" ||
      cfg.authMode === "byok"
    ) {
      const cred =
        (request.settings?.credentialRef as string | undefined) ?? cfg.credentialRef;
      if (!cred) {
        errors.push("Credential ref required for this auth mode (set in studio or config).");
      }
    }
    if (request.task === "text-to-video") {
      warnings.push(
        "Generic HTTP text-to-video is mapping-supported only — remote behavior is not guaranteed.",
      );
    }
    if (!request.prompt?.trim()) {
      errors.push("Prompt is required.");
    }
    return { ok: errors.length === 0, errors, warnings };
  },
  submit: async (request: GenerationRequest, ticket: ExecutionTicket): Promise<JobHandle> => {
    const cfg = resolveConfigForRequest(request)!;
    const gh = cfg.genericHttp!;
    const credRef =
      (request.settings?.credentialRef as string | undefined) ?? cfg.credentialRef;
    const headers = await buildAuthHeaders(
      { ...cfg, credentialRef: credRef ?? cfg.credentialRef },
      { ...ticket, credentialRef: credRef ?? ticket.credentialRef },
    );
    const bodyStr = interpolateTemplate(gh.requestTemplateJson, request, {
      inputAssetUrls: JSON.stringify([]),
    });
    const bodyJson = JSON.parse(bodyStr) as unknown;
    const method = gh.method;
    const internalId = newId();
    const init: RequestInit = {
      method,
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: method === "GET" ? undefined : JSON.stringify(bodyJson),
    };
    const { ok, status, json, text } = await doFetch(cfg.baseUrl!.trim(), init);
    if (!ok && status >= 400) {
      throw new Error(`HTTP ${status}: ${text.slice(0, 400)}`);
    }
    const payload = json ?? (text ? text : undefined);
    const errPath = gh.responseMapping.errorPath;
    if (errPath) {
      const errVal = getValueByPath(payload, errPath);
      if (errVal !== undefined && errVal !== null && String(errVal).length > 0) {
        throw new Error(String(errVal));
      }
    }
    const immediate = outputsFromGeneric(payload, cfg);
    if (immediate && gh.polling.mode === "none") {
      runtime.set(internalId, {
        phase: "done",
        pollAttempt: 0,
        configId: cfg.id,
        lastResponse: payload,
        outputResolved: immediate,
      });
      return { providerJobId: internalId, status: "running" };
    }
    const jobPath = gh.responseMapping.jobIdPath;
    let remoteJobId: string | undefined;
    if (jobPath) {
      const j = getValueByPath(payload, jobPath);
      if (typeof j === "string" || typeof j === "number") {
        remoteJobId = String(j);
      }
    }
    if (gh.polling.mode !== "none" && remoteJobId) {
      runtime.set(internalId, {
        phase: "poll",
        remoteJobId,
        pollAttempt: 0,
        configId: cfg.id,
        lastResponse: payload,
        pollContext: {
          prompt: request.prompt,
          negativePrompt: request.negativePrompt,
          settings: { ...request.settings },
          projectId: request.projectId,
          inputAssetIds: [...request.inputAssetIds],
          referenceSelections: [...(request.referenceSelections ?? [])],
        },
      });
      return { providerJobId: internalId, status: "running" };
    }
    if (immediate) {
      runtime.set(internalId, {
        phase: "done",
        pollAttempt: 0,
        configId: cfg.id,
        lastResponse: payload,
        outputResolved: immediate,
      });
      return { providerJobId: internalId, status: "running" };
    }
    throw new Error(
      "Generic HTTP response did not yield output or remote job id — check response mapping.",
    );
  },
  poll: async (jobId: string, ticket: ExecutionTicket): Promise<JobStatus> => {
    void ticket;
    const row = runtime.get(jobId);
    if (!row) {
      return {
        providerJobId: jobId,
        status: "failed",
        progress: 0,
        error: "Unknown Generic HTTP job.",
      };
    }
    if (row.phase === "done" && row.outputResolved) {
      return {
        providerJobId: jobId,
        status: "completed",
        progress: 100,
        outputAssets: row.outputResolved,
      };
    }
    if (row.phase === "done") {
      return {
        providerJobId: jobId,
        status: "failed",
        progress: 0,
        error: row.error ?? "Completed without outputs.",
      };
    }
    if (row.phase === "submit") {
      return { providerJobId: jobId, status: "running", progress: 20 };
    }
    const cfg = useProviderConfigStore.getState().getProviderConfig(row.configId);
    if (!cfg?.genericHttp) {
      return {
        providerJobId: jobId,
        status: "failed",
        progress: 0,
        error: "Config missing during poll.",
      };
    }
    const gh = cfg.genericHttp;
    if (row.remoteJobId === undefined || gh.polling.mode === "none") {
      return {
        providerJobId: jobId,
        status: "failed",
        progress: 0,
        error: "Polling misconfigured.",
      };
    }
    if (row.pollAttempt >= gh.polling.maxAttempts) {
      runtime.delete(jobId);
      return {
        providerJobId: jobId,
        status: "failed",
        progress: 0,
        error: "Polling exhausted without completion.",
      };
    }
    const pollUrl = interpolateTemplate(
      gh.polling.pollUrlTemplate ?? "",
      {
        projectId: row.pollContext?.projectId,
        providerId: "generic-http",
        modelId: modelIdForGenericConfig(cfg.id),
        task: gh.task,
        prompt: row.pollContext?.prompt ?? "",
        negativePrompt: row.pollContext?.negativePrompt,
        settings: row.pollContext?.settings ?? {},
        inputAssetIds: row.pollContext?.inputAssetIds ?? [],
        referenceSelections: row.pollContext?.referenceSelections ?? [],
        outputPolicy: "local-only",
      } as GenerationRequest,
      { jobId: row.remoteJobId },
    );
    const credRef =
      (ticket.credentialRef as string | undefined) ?? cfg.credentialRef;
    const headers = await buildAuthHeaders(
      { ...cfg, credentialRef: credRef },
      { ...ticket, credentialRef: credRef },
    );
    const pollMethod = gh.polling.mode === "get" ? "GET" : "POST";
    const pollInit: RequestInit =
      pollMethod === "GET" ?
        { method: "GET", headers }
      : {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: row.remoteJobId }),
        };
    const { ok, status, json } = await doFetch(pollUrl, pollInit);
    row.pollAttempt += 1;
    const payload = json;
    const statusVal =
      gh.responseMapping.statusPath ?
        getValueByPath(payload, gh.responseMapping.statusPath)
      : undefined;
    const done =
      typeof statusVal === "string" &&
      ["succeeded", "completed", "done", "success"].includes(statusVal.toLowerCase());
    const outs = outputsFromGeneric(payload, cfg);
    if (done && outs) {
      runtime.set(jobId, {
        ...row,
        phase: "done",
        outputResolved: outs,
        lastResponse: payload,
      });
      return {
        providerJobId: jobId,
        status: "completed",
        progress: 100,
        outputAssets: outs,
      };
    }
    if (outs && gh.responseMapping.statusPath === undefined) {
      runtime.set(jobId, {
        ...row,
        phase: "done",
        outputResolved: outs,
        lastResponse: payload,
      });
      return {
        providerJobId: jobId,
        status: "completed",
        progress: 100,
        outputAssets: outs,
      };
    }
    if (!ok && status >= 400) {
      runtime.delete(jobId);
      return {
        providerJobId: jobId,
        status: "failed",
        progress: 0,
        error: `Poll HTTP ${status}`,
      };
    }
    const progress = Math.min(95, 25 + row.pollAttempt * 10);
    runtime.set(jobId, { ...row, lastResponse: payload });
    return { providerJobId: jobId, status: "running", progress };
  },
  cancel: async (jobId: string) => {
    runtime.delete(jobId);
  },
};

export function resetGenericHttpRuntimeForTests() {
  runtime.clear();
}
