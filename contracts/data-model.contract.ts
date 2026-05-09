import type { MediaTask, ReferenceSelection } from "./provider-adapter.contract";

export type ProjectKind =
  | "image-set"
  | "video-piece"
  | "music-video"
  | "lipsync"
  | "social-campaign"
  | "workflow-experiment";

/** Legacy project mode — migrated into projectKind at hydrate time */
export type LegacyProjectMode =
  | "image"
  | "video"
  | "music-video"
  | "lipsync"
  | "storyboard"
  | "workflow"
  | "mixed";

export type Project = {
  id: string;
  title: string;
  description?: string;
  /** Canonical production type */
  projectKind: ProjectKind;
  /** Present on older records until migration */
  mode?: LegacyProjectMode;
  platformTarget?: "youtube" | "tiktok" | "instagram" | "x" | "film" | "portfolio" | "other";
  /** Desktop: sanitized folder name under the workspace root */
  diskFolderName?: string;
  createdAt: string;
  updatedAt: string;
};

export type AssetKind = "image" | "video" | "audio" | "text" | "document" | "receipt" | "unknown";
export type RightsStatus = "unknown" | "owned" | "licensed" | "public-domain" | "permission-granted" | "do-not-use";

/** Roles used by Asset Map v1 */
export type AssetRole =
  | "source"
  | "reference"
  | "input"
  | "output"
  | "thumbnail"
  | "mask"
  | "audio"
  | "voice"
  | "character"
  | "location"
  | "style"
  | "product"
  | "logo"
  | "identity"
  | "motion"
  | "audio-ref";

export type Asset = {
  id: string;
  projectId?: string;
  kind: AssetKind;
  role?: AssetRole;
  label: string;
  uri: string;
  local: boolean;
  mimeType?: string;
  width?: number;
  height?: number;
  durationSec?: number;
  sha256?: string;
  rightsStatus: RightsStatus;
  createdAt: string;
  updatedAt: string;
};

export type AssetMapEntry = {
  id: string;
  assetId: string;
  projectId: string;
  stableLabel: string;
  bracketLabel?: string;
  role: AssetRole | string;
  priority: "high" | "medium" | "low";
  includePolicy: "all-jobs" | "selected-jobs" | "manual-only" | "do-not-use";
  notes?: string;
  rightsStatus: RightsStatus;
};

export type GenerationJob = {
  id: string;
  projectId?: string;
  providerId: string;
  credentialRef?: string;
  modelId: string;
  task: MediaTask;
  status: "queued" | "running" | "completed" | "failed" | "canceled";
  progress: number;
  prompt?: string;
  negativePrompt?: string;
  settings: Record<string, unknown>;
  inputAssetIds: string[];
  referenceSelections: ReferenceSelection[];
  outputAssetIds: string[];
  estimatedCost?: number;
  actualCost?: number;
  error?: string;
  networkDestinations?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

/** Provenance outcome for a generation ledger row (distinct from queue job status). */
export type ReceiptLedgerStatus = "succeeded" | "failed" | "canceled";

export type GenerationReceipt = {
  id: string;
  jobId: string;
  projectId?: string;
  providerId: string;
  credentialRef?: string;
  /** Canonical manifest id (same semantic as modelId for OMF manifests). */
  manifestId: string;
  modelId: string;
  task: MediaTask;
  prompt?: string;
  negativePrompt?: string;
  settings: Record<string, unknown>;
  seed?: number;
  inputAssetIds: string[];
  referenceSelections: ReferenceSelection[];
  outputAssetIds: string[];
  estimatedCost?: number | null;
  actualCost?: number | null;
  localOrRemote: "local" | "remote" | "hybrid" | "mock";
  networkDestinations?: string[];
  modelManifestVersion?: string;
  createdAt: string;
  /** When the run finished (success, failure, or cancel). */
  completedAt?: string;
  /** Ledger outcome — persisted for failed runs as well as successes. */
  ledgerStatus: ReceiptLedgerStatus;
  /** Non-null provider spend when known; otherwise null. */
  providerReportedCostUsd?: number | null;
  /** Schema version for redaction / export semantics (bump when packet rules change). */
  redactionVersion: string;
  /** Human-safe summary for failed/canceled receipts (no raw secrets). */
  failureSummary?: string;
};

/** Reference Budget v1 — declarative warning kinds (computed in UI) */
export type ReferenceBudgetWarningKind =
  | "too-many-references"
  | "missing-primary-reference"
  | "unlabeled-references";

/** Priority tier for references when budgeting guidance */
export type ReferencePriorityTier =
  | "must-preserve"
  | "guide-style"
  | "optional-inspiration";
