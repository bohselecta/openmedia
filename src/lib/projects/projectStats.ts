import type { GenerationJob } from "@/lib/jobs/jobTypes";
import type { GenerationReceipt } from "@/lib/receipts/receiptTypes";
import type { Asset } from "@/lib/assets/assetTypes";

export type ProjectStatPack = {
  assetCount: number;
  jobCount: number;
  receiptCount: number;
  providerIds: string[];
};

export function computeProjectStats(
  projectId: string,
  assets: Asset[],
  jobs: GenerationJob[],
  receipts: GenerationReceipt[],
): ProjectStatPack {
  const assetCount = assets.filter((a) => a.projectId === projectId).length;
  const projectJobs = jobs.filter((j) => j.projectId === projectId);
  const jobCount = projectJobs.length;
  const receiptCount = receipts.filter((r) => r.projectId === projectId).length;
  const providerIds = [
    ...new Set(projectJobs.map((j) => j.providerId).filter(Boolean)),
  ];
  return { assetCount, jobCount, receiptCount, providerIds };
}
