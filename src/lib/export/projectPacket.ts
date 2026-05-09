import type { AssetMapEntry } from "@/lib/assetMap/assetMapTypes";
import type { Asset } from "@/lib/assets/assetTypes";
import type { GenerationJob } from "@/lib/jobs/jobTypes";
import type { Project } from "@/lib/projects/projectTypes";
import type { GenerationReceipt } from "@/lib/receipts/receiptTypes";
import type { CredentialRef } from "@/lib/providers/types";
import type { ProviderRunLogEntry } from "@/lib/providers/providerRunLog";
import type { ProviderConfig } from "@/lib/providers/types";
import type { SavedPrompt, StoryboardShot } from "@/lib/workspace/workspaceTypes";
import {
  redactJobForExport,
  redactProviderConfigsForExport,
  summarizeProviderActivityForProject,
  type RedactedProviderConfigSnapshot,
} from "@/lib/export/packetRedaction";

export const PROJECT_PACKET_SCHEMA_VERSION = "0.5.1";

export type ProjectPacket = {
  packetSchemaVersion: string;
  appName: string;
  appVersion: string;
  exportedAt: string;
  warning: string;
  project: Project;
  assets: Asset[];
  assetMap: AssetMapEntry[];
  referenceSelectionsByJobId: Record<string, GenerationJob["referenceSelections"]>;
  jobs: GenerationJob[];
  receipts: GenerationReceipt[];
  storyboardShots: StoryboardShot[];
  promptNotes: SavedPrompt[];
  providersUsed: string[];
  credentialRefsMetadata: Array<
    Pick<
      CredentialRef,
      | "id"
      | "providerId"
      | "label"
      | "storageMode"
      | "scopes"
      | "status"
      | "createdAt"
      | "lastUsedAt"
    >
  >;
  providerActivitySummary: ProviderRunLogEntry[];
  redactedProviderConfigs: RedactedProviderConfigSnapshot[];
};

export function buildProjectPacket(params: {
  project: Project;
  assets: Asset[];
  assetMap: AssetMapEntry[];
  jobs: GenerationJob[];
  receipts: GenerationReceipt[];
  shots: StoryboardShot[];
  prompts: SavedPrompt[];
  credentials: CredentialRef[];
  appVersion?: string;
  providerRunLog?: ProviderRunLogEntry[];
  providerConfigs?: ProviderConfig[];
}): ProjectPacket {
  const projectAssets = params.assets.filter((a) => a.projectId === params.project.id);
  const projectMap = params.assetMap.filter((e) => e.projectId === params.project.id);
  const jobs = params.jobs
    .filter((j) => j.projectId === params.project.id)
    .map((j) => redactJobForExport(j));
  const receipts = params.receipts.filter((r) => r.projectId === params.project.id);
  const providerSet = new Set<string>();
  for (const j of jobs) providerSet.add(j.providerId);
  const credentialRefsMetadata = params.credentials
    .filter((c) => providerSet.has(c.providerId))
    .map((c) => ({
      id: c.id,
      providerId: c.providerId,
      label: c.label,
      storageMode: c.storageMode,
      scopes: c.scopes,
      status: c.status,
      createdAt: c.createdAt,
      lastUsedAt: c.lastUsedAt,
    }));

  const referenceSelectionsByJobId: ProjectPacket["referenceSelectionsByJobId"] =
    {};
  for (const j of jobs) {
    referenceSelectionsByJobId[j.id] = j.referenceSelections ?? [];
  }

  const activity = summarizeProviderActivityForProject(
    params.providerRunLog ?? [],
    params.project.id,
  );

  const redactedProviderConfigs = redactProviderConfigsForExport(
    params.providerConfigs ?? [],
  );

  return {
    packetSchemaVersion: PROJECT_PACKET_SCHEMA_VERSION,
    appName: "OpenMediaForge",
    appVersion: params.appVersion ?? "0.1.0",
    exportedAt: new Date().toISOString(),
    warning:
      "Portable packet: jobs and provider configs are redacted. Media may be bundled separately in desktop ZIP exports.",
    project: params.project,
    assets: projectAssets,
    assetMap: projectMap,
    referenceSelectionsByJobId,
    jobs,
    receipts,
    storyboardShots: params.shots,
    promptNotes: params.prompts,
    providersUsed: [...providerSet],
    credentialRefsMetadata,
    providerActivitySummary: activity,
    redactedProviderConfigs,
  };
}

export function projectPacketToJson(packet: ProjectPacket): string {
  return JSON.stringify(packet, null, 2);
}
