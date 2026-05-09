import type { GenerationJob } from "@/lib/jobs/jobTypes";
import type {
  GenerationReceipt,
  ReceiptLedgerStatus,
} from "@/lib/receipts/receiptTypes";

const REDACTION_VERSION = "1";

function newReceiptId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `rcpt-${Date.now()}`;
}

function executionHintForProvider(providerId: string): GenerationReceipt["localOrRemote"] {
  if (providerId === "mock") return "mock";
  if (providerId === "comfyui-local") return "local";
  if (providerId === "replicate" || providerId === "generic-http") {
    return "remote";
  }
  return "local";
}

function ledgerStatusFromJob(job: GenerationJob): ReceiptLedgerStatus {
  if (job.status === "failed") return "failed";
  if (job.status === "canceled") return "canceled";
  return "succeeded";
}

export function writeReceiptFromJob(
  job: GenerationJob,
  manifestVersion?: string,
): GenerationReceipt {
  const now = new Date().toISOString();
  const status = ledgerStatusFromJob(job);
  const completedAt = job.completedAt ?? (status === "succeeded" ? now : now);
  const est =
    job.estimatedCost === undefined ? null
    : Number.isFinite(job.estimatedCost) ? job.estimatedCost
    : null;
  const act =
    job.actualCost === undefined ? null
    : Number.isFinite(job.actualCost) ? job.actualCost
    : null;

  return {
    id: newReceiptId(),
    jobId: job.id,
    projectId: job.projectId,
    providerId: job.providerId,
    credentialRef: job.credentialRef,
    manifestId: job.modelId,
    modelId: job.modelId,
    task: job.task,
    prompt: job.prompt,
    negativePrompt: job.negativePrompt,
    settings: { ...job.settings },
    inputAssetIds: [...job.inputAssetIds],
    referenceSelections: [...(job.referenceSelections ?? [])],
    outputAssetIds: [...job.outputAssetIds],
    estimatedCost: est,
    actualCost: act,
    providerReportedCostUsd: act,
    localOrRemote: executionHintForProvider(job.providerId),
    networkDestinations: [...(job.networkDestinations ?? [])],
    modelManifestVersion: manifestVersion,
    createdAt: now,
    completedAt,
    ledgerStatus: status,
    redactionVersion: REDACTION_VERSION,
    failureSummary:
      status !== "succeeded" ? sanitizeFailureSummary(job.error) : undefined,
  };
}

/** Deterministic id so repeated failure handling replaces the same row. */
export function failureReceiptIdForJob(jobId: string) {
  return `rcpt-fail-${jobId}`;
}

function sanitizeFailureSummary(raw?: string): string | undefined {
  if (!raw?.trim()) return "Run did not complete.";
  let t = raw.trim();
  t = t
    .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\bToken\s+[a-z0-9._-]{8,}/gi, "Token [redacted]");
  if (t.length > 400) return `${t.slice(0, 397)}…`;
  return t;
}

export function writeFailureReceiptFromJob(
  job: GenerationJob,
  manifestVersion?: string,
): GenerationReceipt {
  const now = new Date().toISOString();
  return {
    id: failureReceiptIdForJob(job.id),
    jobId: job.id,
    projectId: job.projectId,
    providerId: job.providerId,
    credentialRef: job.credentialRef,
    manifestId: job.modelId,
    modelId: job.modelId,
    task: job.task,
    prompt: job.prompt,
    negativePrompt: job.negativePrompt,
    settings: { ...job.settings },
    inputAssetIds: [...job.inputAssetIds],
    referenceSelections: [...(job.referenceSelections ?? [])],
    outputAssetIds: [],
    estimatedCost:
      job.estimatedCost === undefined ? null
      : Number.isFinite(job.estimatedCost) ? job.estimatedCost
      : null,
    actualCost: null,
    providerReportedCostUsd: null,
    localOrRemote: executionHintForProvider(job.providerId),
    networkDestinations: [...(job.networkDestinations ?? [])],
    modelManifestVersion: manifestVersion,
    createdAt: now,
    completedAt: now,
    ledgerStatus: ledgerStatusFromJob(job),
    redactionVersion: REDACTION_VERSION,
    failureSummary: sanitizeFailureSummary(job.error),
  };
}
