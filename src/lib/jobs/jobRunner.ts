import { mirrorRemoteOutputsForJobDesktop } from "@/lib/desktop/assetMirror";
import type { Asset } from "@/lib/assets/assetTypes";
import type { AssetMapEntry } from "@/lib/assetMap/assetMapTypes";
import { suggestedStableHandle } from "@/lib/assetMap/handles";
import { useAssetStore } from "@/lib/assets/assetStore";
import { credentialAllowsTask, omfKeyRail } from "@/lib/keyrail/keyrail";
import { useCredentialStore } from "@/lib/keyrail/credentialStore";
import { writeReceiptFromJob } from "@/lib/jobs/receipt";
import type { GenerationJob } from "@/lib/jobs/jobTypes";
import { useJobStore } from "@/lib/jobs/jobStore";
import { getManifestById } from "@/lib/models/sampleManifests";
import { getProviderById } from "@/lib/providers/registry";
import { computeNetworkDestinations } from "@/lib/providers/networkDestinations";
import { useProviderConfigStore } from "@/lib/providers/providerConfigStore";
import {
  hostOnlyFromUrl,
  inferRunLane,
  useProviderRunLogStore,
} from "@/lib/providers/providerRunLog";
import { parseGenericModelId } from "@/lib/providers/genericHttpProvider";
import type {
  GenerationRequest,
  ReferenceSelection,
} from "@/lib/providers/types";
import { useReceiptStore } from "@/lib/receipts/receiptStore";
import { useProjectStore } from "@/lib/projects/projectStore";

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `job-${Date.now()}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function submitStudioGeneration(params: {
  projectId?: string;
  providerId: string;
  modelId: string;
  task: GenerationJob["task"];
  prompt: string;
  negativePrompt?: string;
  credentialRef?: string;
  inputAssetIds: string[];
  referenceSelections?: ReferenceSelection[];
  targetProfile?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}): Promise<{ jobId: string }> {
  const now = new Date().toISOString();
  const manifest = getManifestById(params.modelId);
  const referenceSelections = params.referenceSelections ?? [];
  const job: GenerationJob = {
    id: newId(),
    projectId: params.projectId,
    providerId: params.providerId,
    credentialRef: params.credentialRef,
    modelId: params.modelId,
    task: params.task,
    status: "queued",
    progress: 0,
    prompt: params.prompt,
    negativePrompt: params.negativePrompt,
    settings: {
      ...(params.settings ?? {}),
      ...(params.targetProfile ?
        { targetProfile: params.targetProfile }
      : {}),
    },
    inputAssetIds: params.inputAssetIds,
    referenceSelections,
    outputAssetIds: [],
    networkDestinations: [],
    estimatedCost: manifest?.estimatedCost?.amount,
    createdAt: now,
    updatedAt: now,
  };

  useJobStore.getState().upsertJob(job);
  void runJob(job.id);
  return { jobId: job.id };
}

export async function runJob(jobId: string): Promise<void> {
  const job = useJobStore.getState().jobs.find((j) => j.id === jobId);
  if (!job) return;

  const provider = getProviderById(job.providerId);
  if (!provider) {
    patchJob(jobId, {
      status: "failed",
      error: "Unknown provider.",
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  const effectiveCredentialRef =
    job.credentialRef ??
    (job.providerId === "generic-http" ?
      (job.settings?.credentialRef as string | undefined)
    : undefined);

  const cred = effectiveCredentialRef
    ? useCredentialStore
        .getState()
        .credentials.find((c) => c.id === effectiveCredentialRef)
    : undefined;
  if (effectiveCredentialRef && !cred) {
    patchJob(jobId, {
      status: "failed",
      error: "Credential reference not found in KeyRail.",
      updatedAt: new Date().toISOString(),
    });
    return;
  }
  if (effectiveCredentialRef && cred && !credentialAllowsTask(cred, job.task)) {
    patchJob(jobId, {
      status: "failed",
      error: "Credential scope does not allow this task.",
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  const request: GenerationRequest = {
    projectId: job.projectId,
    providerId: job.providerId,
    modelId: job.modelId,
    task: job.task,
    prompt: job.prompt,
    negativePrompt: job.negativePrompt,
    settings: {
      ...job.settings,
      ...(effectiveCredentialRef &&
      (job.providerId === "generic-http" || job.providerId === "replicate") ?
        { credentialRef: effectiveCredentialRef }
      : {}),
    },
    inputAssetIds: job.inputAssetIds,
    referenceSelections: job.referenceSelections ?? [],
    targetProfile:
      (job.settings?.targetProfile as Record<string, unknown> | undefined) ??
      undefined,
    outputPolicy: "local-only",
  };

  const validation = await provider.validate(request);
  if (!validation.ok) {
    patchJob(jobId, {
      status: "failed",
      error: validation.errors.join(" · "),
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  const networkDestinations = computeNetworkDestinations(request);
  const providerConfigId =
    parseGenericModelId(job.modelId) ??
    (job.providerId === "comfyui-local" ?
      useProviderConfigStore.getState().getActiveConfigForProvider("comfyui-local")?.id
    : undefined);
  const cfgRow =
    job.providerId === "generic-http" && providerConfigId ?
      useProviderConfigStore.getState().getProviderConfig(providerConfigId)
    : job.providerId === "comfyui-local" ?
      useProviderConfigStore.getState().getActiveConfigForProvider("comfyui-local")
    : undefined;
  const endpointHost =
    cfgRow?.baseUrl ? hostOnlyFromUrl(cfgRow.baseUrl) : undefined;

  const t0 = Date.now();
  useProviderRunLogStore.getState().append({
    providerId: job.providerId,
    providerConfigId,
    projectId: job.projectId,
    jobId,
    task: job.task,
    lane: inferRunLane({
      providerId: job.providerId,
      authMode: cfgRow?.authMode ?? "none",
      endpointHost,
      credentialRef: effectiveCredentialRef,
    }),
    endpointHost,
    method: job.providerId === "generic-http" ? "POST" : "MULTI",
    status: "started",
    credentialRef: effectiveCredentialRef,
    networkDestination: networkDestinations[0],
  });

  const ticket = await omfKeyRail.createExecutionTicket({
    request,
    credentialRef: effectiveCredentialRef,
    estimatedCost: getManifestById(job.modelId)?.estimatedCost?.amount,
    approval: "auto",
    networkDestinations,
  });

  await omfKeyRail.logUse({
    id: newId(),
    providerId: ticket.providerId,
    credentialRef: ticket.credentialRef,
    ticketId: ticket.id,
    task: ticket.task,
    modelId: ticket.modelId,
    estimatedCost: ticket.estimatedCost,
    networkDestinations: ticket.networkDestinations,
    createdAt: new Date().toISOString(),
  });

  const baseAfterTicket = useJobStore.getState().jobs.find((j) => j.id === jobId)!;
  patchJob(jobId, {
    status: "running",
    progress: 6,
    updatedAt: new Date().toISOString(),
    networkDestinations: ticket.networkDestinations,
    settings: {
      ...baseAfterTicket.settings,
      executionTicketId: ticket.id,
    },
  });

  let handle;
  try {
    handle = await provider.submit(request, ticket);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Submit failed.";
    useProviderRunLogStore.getState().append({
      providerId: job.providerId,
      providerConfigId,
      projectId: job.projectId,
      jobId,
      task: job.task,
      lane: inferRunLane({
        providerId: job.providerId,
        authMode: cfgRow?.authMode ?? "none",
        endpointHost,
        credentialRef: effectiveCredentialRef,
      }),
      endpointHost,
      method: "POST",
      status: "failed",
      durationMs: Date.now() - t0,
      errorMessage: msg,
      credentialRef: effectiveCredentialRef,
      networkDestination: networkDestinations[0],
    });
    patchJob(jobId, {
      status: "failed",
      error: msg,
      updatedAt: new Date().toISOString(),
      networkDestinations: ticket.networkDestinations,
    });
    return;
  }

  const pollMs =
    job.providerId === "comfyui-local" ?
      (useProviderConfigStore
        .getState()
        .getActiveConfigForProvider("comfyui-local")?.comfy?.pollIntervalMs ?? 800)
    : job.providerId === "replicate" ?
      1200
    : 280;

  let status = await provider.poll(handle.providerJobId, ticket);
  while (status.status === "queued" || status.status === "running") {
    const current = useJobStore.getState().jobs.find((j) => j.id === jobId);
    patchJob(jobId, {
      status: status.status === "queued" ? "queued" : "running",
      progress: Math.max(current?.progress ?? 0, status.progress),
      updatedAt: new Date().toISOString(),
      networkDestinations: ticket.networkDestinations,
    });
    await sleep(pollMs);
    status = await provider.poll(handle.providerJobId, ticket);
  }

  if (status.status === "failed" || status.status === "canceled") {
    useProviderRunLogStore.getState().append({
      providerId: job.providerId,
      providerConfigId,
      projectId: job.projectId,
      jobId,
      task: job.task,
      lane: inferRunLane({
        providerId: job.providerId,
        authMode: cfgRow?.authMode ?? "none",
        endpointHost,
        credentialRef: effectiveCredentialRef,
      }),
      endpointHost,
      method: "POST",
      status: status.status === "canceled" ? "canceled" : "failed",
      durationMs: Date.now() - t0,
      errorMessage: status.error,
      credentialRef: effectiveCredentialRef,
      networkDestination: networkDestinations[0],
    });
    patchJob(jobId, {
      status: status.status === "canceled" ? "canceled" : "failed",
      progress: status.progress,
      error: status.error ?? "Job failed.",
      updatedAt: new Date().toISOString(),
      networkDestinations: ticket.networkDestinations,
    });
    return;
  }

  const outputs = status.outputAssets ?? [];
  const outputIds: string[] = [];
  const now = new Date().toISOString();
  const createdAssets: Asset[] = [];
  for (const o of outputs) {
    const remoteHttp =
      o.uri.startsWith("http://") || o.uri.startsWith("https://");
    const asset: Asset = {
      id: newId(),
      projectId: job.projectId,
      kind: o.kind === "document" ? "unknown" : o.kind,
      role: "output",
      label: o.label ?? "Generated output",
      uri: o.uri,
      local: !remoteHttp,
      mimeType: o.mimeType,
      rightsStatus: "unknown",
      createdAt: now,
      updatedAt: now,
    };
    useAssetStore.getState().upsertAsset(asset);
    createdAssets.push(asset);
    outputIds.push(asset.id);
    if (job.projectId) {
      ensureAssetMapOutputEntry(asset, job.projectId);
    }
  }

  if (
    job.providerId === "comfyui-local" &&
    typeof window !== "undefined" &&
    window.omfDesktop?.enabled
  ) {
    void mirrorRemoteOutputsForJobDesktop(job, createdAssets);
  }

  useProviderRunLogStore.getState().append({
    providerId: job.providerId,
    providerConfigId,
    projectId: job.projectId,
    jobId,
    task: job.task,
    lane: inferRunLane({
      providerId: job.providerId,
      authMode: cfgRow?.authMode ?? "none",
      endpointHost,
      credentialRef: effectiveCredentialRef,
    }),
    endpointHost,
    method: "POST",
    status: "succeeded",
    durationMs: Date.now() - t0,
    credentialRef: effectiveCredentialRef,
    networkDestination: networkDestinations[0],
  });

  patchJob(jobId, {
    status: "completed",
    progress: 100,
    outputAssetIds: outputIds,
    actualCost: getManifestById(job.modelId)?.estimatedCost?.amount ?? 0,
    completedAt: now,
    updatedAt: now,
    networkDestinations: ticket.networkDestinations,
  });

  const completed = useJobStore.getState().jobs.find((j) => j.id === jobId)!;
  const manifest = getManifestById(job.modelId);
  const receipt = writeReceiptFromJob(completed, manifest?.version);
  useReceiptStore.getState().upsertReceipt(receipt);
  if (completed.projectId) {
    useProjectStore.getState().touchProject(completed.projectId);
  }
}

function patchJob(jobId: string, patch: Partial<GenerationJob>) {
  const prev = useJobStore.getState().jobs.find((j) => j.id === jobId);
  if (!prev) return;
  useJobStore.getState().upsertJob({ ...prev, ...patch });
}

function ensureAssetMapOutputEntry(asset: Asset, projectId: string) {
  const store = useAssetStore.getState();
  if (store.assetMap.some((e) => e.assetId === asset.id)) return;
  const handle = suggestedStableHandle(asset.label);
  const entry: AssetMapEntry = {
    id: newId(),
    assetId: asset.id,
    projectId,
    stableLabel: handle,
    bracketLabel: `[${handle.slice(1)}]`,
    role: "output",
    priority: "medium",
    includePolicy: "all-jobs",
    rightsStatus: asset.rightsStatus,
  };
  store.upsertMapEntry(entry);
}
