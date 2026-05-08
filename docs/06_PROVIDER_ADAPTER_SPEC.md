# 06 — Provider Adapter Spec

## Principle

Every compute backend is a provider adapter. The UI never calls a provider directly.

## Provider classes

- Mock Provider
- Local provider
- BYOK remote provider
- Generic HTTP provider
- Future hosted provider

## Interface

```ts
export interface GenerationProvider {
  id: string
  name: string
  kind: "mock" | "local" | "remote" | "hybrid"
  capabilities: MediaTask[]

  listModels(): Promise<ModelManifest[]>

  validate(request: GenerationRequest): Promise<ValidationResult>

  estimateCost?(
    request: GenerationRequest,
    credential?: CredentialRef
  ): Promise<CostEstimate>

  submit(
    request: GenerationRequest,
    ticket: ExecutionTicket
  ): Promise<JobHandle>

  poll(
    jobId: string,
    ticket: ExecutionTicket
  ): Promise<JobStatus>

  cancel(
    jobId: string,
    ticket: ExecutionTicket
  ): Promise<void>
}
```

## GenerationRequest

```ts
export type GenerationRequest = {
  projectId?: string
  providerId: string
  modelId: string
  task: MediaTask
  prompt?: string
  negativePrompt?: string
  settings: Record<string, unknown>
  inputAssetIds: string[]
  outputPolicy: "local-only" | "provider-hosted" | "mirror-local"
}
```

## Mock Provider MVP

Required models:

- `mock-image-v1`
- `mock-video-v1`
- `mock-upscale-v1`
- `mock-lipsync-v1`

Behavior:

- validates request
- estimates cost as zero
- simulates job progress
- returns placeholder output assets
- writes receipt
- uses `localOrRemote: "mock"`
- does not call any network destination

## Generic HTTP Provider

MVP can be placeholder or partial.

Future config:

- base URL
- auth header mapping
- request body mapping
- submit path
- poll path
- result extraction path
- cost extraction path

Must use KeyRail execution tickets.

## Local ComfyUI Provider

MVP honest placeholder.

Future:

- configure server URL
- test `/system_stats` or equivalent
- list workflow templates
- submit workflow JSON
- poll queue/history
- import outputs as assets

## sd.cpp Provider

Future desktop/local provider.

- runs locally
- no key required
- model downloads handled separately
- output assets local

## Wan2GP Provider

Future local/LAN/hybrid provider.

- user configures URL
- app tests availability
- user sends prompts/assets to that URL
- KeyRail may not be needed if no auth

## Provider registry

Registry responsibilities:

- register providers
- list enabled providers
- filter providers by capability
- load manifests
- prevent duplicate IDs
- expose mock provider by default

## Forbidden

- hardcoding a single commercial gateway as default architecture
- provider calls inside React components
- raw key arguments in UI functions
- storing provider secrets in job/receipt objects
- fake live provider buttons
