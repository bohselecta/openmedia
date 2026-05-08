import type { GenerationJob } from "@/lib/jobs/jobTypes";
import type { GenerationReceipt } from "@/lib/receipts/receiptTypes";

export function writeReceiptFromJob(
  job: GenerationJob,
  manifestVersion?: string,
): GenerationReceipt {
  const now = new Date().toISOString();
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `rcpt-${Date.now()}`,
    jobId: job.id,
    projectId: job.projectId,
    providerId: job.providerId,
    credentialRef: job.credentialRef,
    modelId: job.modelId,
    task: job.task,
    prompt: job.prompt,
    negativePrompt: job.negativePrompt,
    settings: { ...job.settings },
    inputAssetIds: [...job.inputAssetIds],
    referenceSelections: [...(job.referenceSelections ?? [])],
    outputAssetIds: [...job.outputAssetIds],
    estimatedCost: job.estimatedCost,
    actualCost: job.actualCost,
    localOrRemote:
      job.providerId === "mock" ? "mock"
      : job.providerId === "comfyui-local" ? "local"
      : job.providerId === "generic-http" ? "remote"
      : "local",
    networkDestinations: job.networkDestinations ?? [],
    modelManifestVersion: manifestVersion,
    createdAt: now,
  };
}
