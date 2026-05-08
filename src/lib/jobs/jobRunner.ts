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

  const cred = job.credentialRef
    ? useCredentialStore
        .getState()
        .credentials.find((c) => c.id === job.credentialRef)
    : undefined;
  if (job.credentialRef && !cred) {
    patchJob(jobId, {
      status: "failed",
      error: "Credential reference not found in KeyRail.",
      updatedAt: new Date().toISOString(),
    });
    return;
  }
  if (job.credentialRef && cred && !credentialAllowsTask(cred, job.task)) {
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
    settings: job.settings,
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

  const ticket = await omfKeyRail.createExecutionTicket({
    request,
    credentialRef: job.credentialRef,
    estimatedCost: getManifestById(job.modelId)?.estimatedCost?.amount,
    approval: "auto",
    networkDestinations: [],
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
    settings: {
      ...baseAfterTicket.settings,
      executionTicketId: ticket.id,
    },
  });

  let handle;
  try {
    handle = await provider.submit(request, ticket);
  } catch (e) {
    patchJob(jobId, {
      status: "failed",
      error: e instanceof Error ? e.message : "Submit failed.",
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  let status = await provider.poll(handle.providerJobId, ticket);
  while (status.status === "queued" || status.status === "running") {
    const current = useJobStore.getState().jobs.find((j) => j.id === jobId);
    patchJob(jobId, {
      status: status.status === "queued" ? "queued" : "running",
      progress: Math.max(current?.progress ?? 0, status.progress),
      updatedAt: new Date().toISOString(),
    });
    await sleep(280);
    status = await provider.poll(handle.providerJobId, ticket);
  }

  if (status.status === "failed" || status.status === "canceled") {
    patchJob(jobId, {
      status: status.status === "canceled" ? "canceled" : "failed",
      progress: status.progress,
      error: status.error ?? "Job failed.",
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  const outputs = status.outputAssets ?? [];
  const outputIds: string[] = [];
  const now = new Date().toISOString();
  for (const o of outputs) {
    const asset: Asset = {
      id: newId(),
      projectId: job.projectId,
      kind: o.kind === "document" ? "unknown" : o.kind,
      role: "output",
      label: o.label ?? "Generated output",
      uri: o.uri,
      local: true,
      mimeType: o.mimeType,
      rightsStatus: "unknown",
      createdAt: now,
      updatedAt: now,
    };
    useAssetStore.getState().upsertAsset(asset);
    outputIds.push(asset.id);
    if (job.projectId) {
      ensureAssetMapOutputEntry(asset, job.projectId);
    }
  }

  patchJob(jobId, {
    status: "completed",
    progress: 100,
    outputAssetIds: outputIds,
    actualCost: getManifestById(job.modelId)?.estimatedCost?.amount ?? 0,
    completedAt: now,
    updatedAt: now,
    networkDestinations: [],
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
