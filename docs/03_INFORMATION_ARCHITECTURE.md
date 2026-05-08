# 03 — Information Architecture

## Navigation map

```txt
/
/studio
  /image
  /video
  /edit
  /lipsync
  /storyboard
  /workflows
/projects
  /[id]
/assets
/queue
/receipts
/providers
/keys
/settings
```

## Top-level objects

- Project
- Asset
- AssetMapEntry
- Provider
- CredentialRef
- ModelManifest
- GenerationJob
- GenerationReceipt
- Workflow
- RepairInstruction
- ExportPack

## App sections

### Dashboard / Forge

Purpose: orient the creator.

Shows:
- recent projects
- active queue
- provider status
- key status
- recent outputs
- demo project CTA

### Studio

Purpose: run creative work.

Sub-studios:
- Image
- Video
- Edit
- Lip Sync
- Storyboard
- Workflows

### Projects

Purpose: persistent project containers.

Project fields:
- title
- intent
- target format
- platform
- notes
- source assets
- created/updated timestamps

### Assets

Purpose: all media and references.

Supports:
- upload/import
- generated outputs
- labels
- roles
- rights status
- priority
- project association
- usage history

### Queue

Purpose: all jobs, live and historical.

Supports:
- progress
- logs
- cancel/retry
- provider/model filters
- failure reason

### Receipts

Purpose: provenance and repeatability.

Supports:
- receipt cards
- JSON export
- prompt/settings inspection
- input/output trace
- network/cost trace

### Providers

Purpose: compute configuration.

Provider classes:
- Mock
- Local
- BYOK remote
- Generic HTTP
- Future hosted

### Keys

Purpose: KeyRail credential authority.

Supports:
- credential metadata
- redacted status
- limits
- permission scopes
- test/revoke
- audit log

## First-use flow

1. User lands on `/`.
2. Clicks "Open the Studio".
3. App loads demo-ready local mode.
4. Mock Provider is active by default.
5. User enters prompt in Image Studio.
6. User runs mock generation.
7. Result appears.
8. Receipt link is shown.
9. User learns the product without needing keys.

## Provider connection flow

1. User visits Providers.
2. Chooses provider card.
3. Provider explains capabilities and data egress.
4. User goes to Keys if key is required.
5. User saves/test credential through KeyRail.
6. Provider becomes available in Studio.

## Asset map flow

1. User uploads/imports asset.
2. User assigns label.
3. User chooses role and priority.
4. User marks rights status.
5. Asset becomes selectable in Studio.
6. Job receipt records asset IDs.

## Receipt flow

1. Job completes.
2. Outputs are stored as Asset records.
3. Receipt is written.
4. Receipt links job, prompt, provider, model, key ref, inputs, outputs, settings, cost, and network destinations.
5. User can export receipt or full project pack.
