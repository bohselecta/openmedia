# 04 — Architecture

## Phase 2 implementation notes

- **Active project** threads jobs, assets, receipts, and workspace bundles (storyboard + prompt notes) together via Zustand stores backed by IndexedDB.
- **Asset Map v1** stores `AssetMapEntry` rows keyed per project with stable handles derived from labels; assets carry canonical roles (`AssetRole`).
- **Reference Budget v1** reads manifest `referenceBudget` blocks plus selected assets to emit warnings (too many refs, missing primary, generic labels).
- `/studio` is a real dashboard (command desk), not a passive hub — Queue/Receipts/Keys surfaces reinforce operational posture.

## Phase 3 implementation notes

- Image Studio + Asset Map share **ReferenceSelection** semantics; validation runs client-side before JobRunner accepts work (blocking vs warning split).
- Jobs/receipts persist both structured references and flat `inputAssetIds`; packets stitch the graph for export without embedding binaries.
- Queue surfaces **compute lanes** derived from provider `kind` so Mock/BYOK/local posture stays obvious.

## Stack

MVP web app:

- Next.js App Router
- TypeScript
- Tailwind
- shadcn/ui
- Zustand
- TanStack Query
- Zod
- IndexedDB/localForage

Future desktop:

- Tauri preferred
- SQLite
- OS keychain
- local worker for media probes and local engines

## Architecture layers

```txt
UI / Studio Components
  ↓
Application Services
  ↓
Domain Stores
  ↓
Provider Adapter Registry
  ↓
KeyRail Execution Tickets
  ↓
Provider Implementations
  ↓
Local / BYOK / Remote Compute
```

## Core modules

```txt
lib/
  providers/
  keyrail/
  models/
  jobs/
  assets/
  projects/
  workflows/
  receipts/
  storage/
  verify/
```

## Provider boundary

The UI never calls provider APIs directly. The UI creates a `GenerationRequest`, asks JobRunner to submit, and JobRunner coordinates:

1. validate provider/model
2. resolve credential policy through KeyRail
3. create execution ticket
4. create job record
5. call provider adapter
6. poll/update progress
7. write output assets
8. write receipt

## MVP execution flow

```txt
ImageStudio submit
  → jobRunner.createAndRun(request)
  → providerRegistry.get(providerId)
  → keyrail.createExecutionTicket(request)
  → jobStore.create(queued)
  → provider.submit(request, ticket)
  → provider.poll(jobId, ticket)
  → assetStore.create(output)
  → receiptWriter.create(job, request, outputs)
  → jobStore.complete(job)
```

## Storage

MVP:

- IndexedDB/localForage through `StorageDriver`
- All stores must use stable typed interfaces
- Raw keys only in browser-dev vault with warning; normal records store refs only

Future:

- SQLite for domain data
- OS keychain for secrets
- local object store folder for assets

## State

Use Zustand for app/UI state:

- active project
- active studio mode
- selected provider/model
- inspector panel state
- selected assets
- local settings

Use TanStack Query for:

- provider list
- model list
- job polling
- receipt queries
- asset queries

## Error handling

All errors must show:

- plain English summary
- provider
- model
- job id if available
- suggested repair/retry action
- whether data left the machine

## Logging

Log domains:

- provider calls
- key usage events
- job events
- asset imports
- receipt writes
- verification failures

MVP logs can be stored in IndexedDB.

## Project packets

Export must be deterministic:

```txt
project-packet/
  project.json
  assets.json
  jobs.json
  receipts.json
  asset-map.json
  prompts.md
  rights-log.md
```

MVP may export JSON/Markdown without bundling binary assets.

## Source tree target

```txt
app/
components/
lib/
contracts/
docs/
scripts/
```

Do not overbuild backend routes in MVP. Keep the first version client-local except for future provider adapter stubs.

## Phase 4 — Provider foundations

IndexedDB-backed **provider config** and **provider run log** stores join existing job/receipt pipelines. **Generic HTTP** and **ComfyUI** adapters are real client-side executors; other vendor cards remain placeholders. Execution tickets carry **networkDestinations** derived from adapter previews (hosts/routes, no secrets).
