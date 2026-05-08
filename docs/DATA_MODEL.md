# 05 — Data Model

## Phase 3 updates

- `ReferenceSelection` captures `{ assetId, stableHandle, role, priority, note? }` and travels with generation requests, jobs, receipts, and tickets.
- `GenerationRequest` adds `referenceSelections`, optional `targetProfile`, and keeps `inputAssetIds` distinct from outputs.
- Validation helper (`referenceValidation.ts`) enforces duplicate-handle blocking, project binding checks, and manifest-aware warnings.

## Phase 2 updates

- `Project` now includes `projectKind` (`image-set`, `video-piece`, `music-video`, `lipsync`, `social-campaign`, `workflow-experiment`) with legacy `mode` migrated on hydrate.
- `Asset.role` expanded to the `AssetRole` union (voice, product, logo, etc.).
- `ModelManifest` may include optional `referenceBudget` metadata (`maxReferences`, `requiresPrimaryReference`).

## Project

```ts
type Project = {
  id: string
  title: string
  description?: string
  projectKind: "image-set" | "video-piece" | "music-video" | "lipsync" | "social-campaign" | "workflow-experiment"
  platformTarget?: "youtube" | "tiktok" | "instagram" | "x" | "film" | "portfolio" | "other"
  createdAt: string
  updatedAt: string
}
```

## Asset

```ts
type Asset = {
  id: string
  projectId?: string
  kind: "image" | "video" | "audio" | "text" | "document" | "receipt" | "unknown"
  role?: "source" | "reference" | "input" | "output" | "thumbnail" | "mask" | "style" | "identity" | "location" | "motion" | "audio-ref"
  label: string
  uri: string
  local: boolean
  mimeType?: string
  width?: number
  height?: number
  durationSec?: number
  sha256?: string
  rightsStatus: "unknown" | "owned" | "licensed" | "public-domain" | "permission-granted" | "do-not-use"
  createdAt: string
  updatedAt: string
}
```

## AssetMapEntry

```ts
type AssetMapEntry = {
  id: string
  assetId: string
  projectId: string
  stableLabel: string
  bracketLabel?: string
  role: AssetRole
  priority: "high" | "medium" | "low"
  includePolicy: "all-jobs" | "selected-jobs" | "manual-only" | "do-not-use"
  notes?: string
  rightsStatus: Asset["rightsStatus"]
}
```

## Provider

```ts
type Provider = {
  id: string
  name: string
  kind: "mock" | "local" | "remote" | "hybrid"
  capabilities: MediaTask[]
  authMode: "none" | "byok" | "oauth" | "local-daemon" | "server-vault"
  status: "available" | "needs-config" | "disabled" | "coming-soon"
}
```

## CredentialRef

```ts
type CredentialRef = {
  id: string
  providerId: string
  label: string
  storageMode: "none" | "browser-dev" | "desktop-keychain" | "server-vault" | "env"
  scopes: MediaTask[]
  status: "connected" | "expired" | "revoked" | "invalid"
  redactedPreview?: string
  dailyLimitUsd?: number
  perJobLimitUsd?: number
  maxConcurrentJobs?: number
  createdAt: string
  lastUsedAt?: string
}
```

## ModelManifest

```ts
type ModelManifest = {
  id: string
  providerId: string
  name: string
  task: MediaTask
  description?: string
  version?: string
  license?: string
  inputSchema: Record<string, unknown>
  outputSchema: Record<string, unknown>
  estimatedCost?: CostEstimate
  hardwareRequirements?: HardwareRequirements
  tags: string[]
}
```

## GenerationJob

`ReferenceSelection` is imported alongside provider contracts — see `contracts/provider-adapter.contract.ts`.

```ts
type GenerationJob = {
  id: string
  projectId?: string
  providerId: string
  credentialRef?: string
  modelId: string
  task: MediaTask
  status: "queued" | "running" | "completed" | "failed" | "canceled"
  progress: number
  prompt?: string
  negativePrompt?: string
  settings: Record<string, unknown>
  inputAssetIds: string[]
  referenceSelections: ReferenceSelection[]
  outputAssetIds: string[]
  estimatedCost?: number
  actualCost?: number
  error?: string
  networkDestinations?: string[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}
```

## GenerationReceipt

```ts
type GenerationReceipt = {
  id: string
  jobId: string
  projectId?: string
  providerId: string
  credentialRef?: string
  modelId: string
  task: MediaTask
  prompt?: string
  negativePrompt?: string
  settings: Record<string, unknown>
  seed?: number
  inputAssetIds: string[]
  referenceSelections: ReferenceSelection[]
  outputAssetIds: string[]
  estimatedCost?: number
  actualCost?: number
  localOrRemote: "local" | "remote" | "hybrid" | "mock"
  networkDestinations?: string[]
  modelManifestVersion?: string
  createdAt: string
}
```

## MediaTask

```ts
type MediaTask =
  | "text-to-image"
  | "image-to-image"
  | "text-to-video"
  | "image-to-video"
  | "video-to-video"
  | "lip-sync"
  | "upscale"
  | "background-remove"
  | "frame-extract"
  | "audio-to-video"
```

## Important constraint

`GenerationJob` and `GenerationReceipt` must never contain raw key fields such as:

- apiKey
- secret
- token
- accessToken
- bearer
- password

They may only contain `credentialRef`.
