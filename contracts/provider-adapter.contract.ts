export type MediaTask =
  | "text-to-image"
  | "image-to-image"
  | "text-to-video"
  | "image-to-video"
  | "video-to-video"
  | "lip-sync"
  | "upscale"
  | "background-remove"
  | "frame-extract"
  | "audio-to-video";

export type ProviderKind = "mock" | "local" | "remote" | "hybrid";

/** Reference attached to a generation request (handles + provenance, no media bytes). */
export type ReferenceSelection = {
  assetId: string;
  stableHandle: string;
  role: string;
  priority: "must_preserve" | "guide_style" | "optional_inspiration";
  note?: string;
};

export type GenerationRequest = {
  projectId?: string;
  providerId: string;
  modelId: string;
  task: MediaTask;
  prompt?: string;
  negativePrompt?: string;
  settings: Record<string, unknown>;
  inputAssetIds: string[];
  /** Structured reference picks (mirrors inputAssetIds for refs; extra semantics per slot). */
  referenceSelections: ReferenceSelection[];
  /** Optional render/target profile blob for adapters. */
  targetProfile?: Record<string, unknown>;
  outputPolicy: "local-only" | "provider-hosted" | "mirror-local";
};

export type ValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export type CostEstimate = {
  amount: number;
  currency: "USD" | string;
  unit: "job" | "second" | "image" | "token" | "unknown";
  explanation?: string;
};

export type JobHandle = {
  providerJobId: string;
  status: "queued" | "running" | "completed" | "failed";
};

export type JobStatus = {
  providerJobId: string;
  status: "queued" | "running" | "completed" | "failed" | "canceled";
  progress: number;
  outputAssets?: Array<{
    kind: "image" | "video" | "audio" | "text" | "document" | "unknown";
    uri: string;
    mimeType?: string;
    label?: string;
  }>;
  error?: string;
};

export type ModelManifest = {
  id: string;
  providerId: string;
  name: string;
  task: MediaTask;
  description?: string;
  version?: string;
  license?: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  estimatedCost?: CostEstimate;
  hardwareRequirements?: Record<string, unknown>;
  tags: string[];
  /** Reference Budget defaults for manifests that consume references */
  referenceBudget?: {
    maxReferences: number;
    requiresPrimaryReference?: boolean;
  };
  /** Declared execution posture for UI and receipts */
  localOrRemote?: "local" | "remote" | "hybrid";
};

/** Stored provider adapter configuration — never includes raw secrets */
export type ProviderAuthMode =
  | "none"
  | "byok"
  | "header"
  | "bearer"
  | "custom";

export type GenericHttpOutputType =
  | "imageUrl"
  | "imageBase64"
  | "videoUrl"
  | "jsonOnly";

export type GenericHttpPollingMode = "none" | "get" | "post";

export type GenericHttpResponseMapping = {
  jobIdPath?: string;
  outputUrlPath?: string;
  outputBase64Path?: string;
  statusPath?: string;
  errorPath?: string;
};

export type GenericHttpAdapterSettings = {
  method: "GET" | "POST" | "PUT";
  task: MediaTask;
  /** JSON string with {{prompt}} style placeholders */
  requestTemplateJson: string;
  responseMapping: GenericHttpResponseMapping;
  polling: {
    mode: GenericHttpPollingMode;
    /** URL template; may include {{jobId}} */
    pollUrlTemplate?: string;
    intervalMs: number;
    maxAttempts: number;
  };
  outputType: GenericHttpOutputType;
  /** Optional override; defaults from task */
  referenceBudget?: ModelManifest["referenceBudget"];
  /** When authMode is custom, header name to populate from credential */
  customAuthHeaderName?: string;
};

export type ComfyWorkflowRequiredInputs = "prompt" | "negativePrompt" | "seed" | "width" | "height" | "image";

export type ComfyWorkflowTemplate = {
  id: string;
  label: string;
  task: MediaTask;
  description?: string;
  /** API-format workflow JSON string (object serialized) */
  workflowJson: string;
  requiredInputs: ComfyWorkflowRequiredInputs[];
  outputNodeIds: string[];
  /** Dot paths inside workflow JSON, e.g. "12.inputs.text" */
  promptPath?: string;
  negativePromptPath?: string;
  seedPath?: string;
  widthPath?: string;
  heightPath?: string;
  /** LoadImage node image filename input path */
  imageInputPath?: string;
  createdAt: string;
  updatedAt: string;
};

export type ComfyAdapterSettings = {
  timeoutMs: number;
  pollIntervalMs: number;
  maxPollAttempts: number;
  templates: ComfyWorkflowTemplate[];
};

export type ProviderConfig = {
  id: string;
  providerId: "generic-http" | "comfyui-local" | string;
  label: string;
  kind: ProviderKind;
  baseUrl?: string;
  authMode: ProviderAuthMode;
  credentialRef?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastTestAt?: string;
  lastTestStatus?: "ok" | "failed";
  lastTestMessage?: string;
  /** Provider-specific settings (no secrets) */
  genericHttp?: GenericHttpAdapterSettings;
  comfy?: ComfyAdapterSettings;
};

export type CredentialRef = {
  id: string;
  providerId: string;
  label: string;
  storageMode: "none" | "browser-dev" | "desktop-keychain" | "server-vault" | "env";
  scopes: MediaTask[];
  status: "connected" | "expired" | "revoked" | "invalid";
  redactedPreview?: string;
  dailyLimitUsd?: number;
  perJobLimitUsd?: number;
  maxConcurrentJobs?: number;
  createdAt: string;
  lastUsedAt?: string;
};

export type ExecutionTicket = {
  id: string;
  providerId: string;
  credentialRef?: string;
  task: MediaTask;
  modelId: string;
  projectId?: string;
  estimatedCost?: number;
  maxCost?: number;
  inputAssetIds: string[];
  referenceSelections: ReferenceSelection[];
  outputPolicy: "local-only" | "provider-hosted" | "mirror-local";
  approval: "auto" | "ask" | "blocked";
  networkDestinations: string[];
  expiresAt: string;
};

export interface GenerationProvider {
  id: string;
  name: string;
  kind: ProviderKind;
  capabilities: MediaTask[];
  listModels(): Promise<ModelManifest[]>;
  validate(request: GenerationRequest): Promise<ValidationResult>;
  estimateCost?(request: GenerationRequest, credential?: CredentialRef): Promise<CostEstimate>;
  submit(request: GenerationRequest, ticket: ExecutionTicket): Promise<JobHandle>;
  poll(jobId: string, ticket: ExecutionTicket): Promise<JobStatus>;
  cancel(jobId: string, ticket: ExecutionTicket): Promise<void>;
}
