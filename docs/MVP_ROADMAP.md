# 13 — MVP Roadmap

## Build phases — OpenMediaForge Cursor pack

- **Phase 1 — complete:** contracts, mock provider, Image Studio end-to-end, jobs/receipts, KeyRail metadata, verifier gates.
- **Phase 2 — shipped:** creator-grade GUI pass, `/studio` command dashboard, project workspace + Asset Map + Reference Budget UI, honest provider catalog, docs + verification alignment.
- **Phase 3 — active:** operational references (selection → job → receipt), validation gate in Image Studio, storyboard → studio bootstrap, queue lane honesty, project packet + ledger JSON exports, KeyRail audit surfacing.

## Phase 0 — Repo scaffold

- Next.js app
- TypeScript
- Tailwind
- shadcn/ui
- base layout
- route skeletons
- docs copied into repo

Exit gate:
- app loads
- routes exist
- build passes

## Phase 1 — Domain contracts

- project types
- asset types
- provider types
- model manifest types
- job types
- receipt types
- KeyRail types

Exit gate:
- typecheck passes
- no secret fields in job/receipt types

## Phase 2 — Storage

- StorageDriver
- IndexedDB/localForage implementation
- in-memory fallback if needed
- stores for projects/assets/jobs/receipts/providers/credentials metadata

Exit gate:
- can create/read/update/delete local records

## Phase 3 — Provider registry and Mock Provider

- provider registry
- mock provider
- mock manifests
- mock job simulation

Exit gate:
- mock provider lists models
- mock provider completes fake generation

## Phase 4 — Studio GUI

- shell
- left rail
- top bar
- inspector
- Image Studio
- prompt composer
- model picker
- provider picker
- result grid

Exit gate:
- user can run image mock job end-to-end

## Phase 5 — Jobs and Receipts

- job queue
- polling/progress
- receipt writer
- receipts page
- queue page

Exit gate:
- every completed mock job creates visible receipt

## Phase 6 — Assets and Asset Map

- asset page
- upload/import placeholder
- asset cards
- stable labels
- reference budget panel
- rights status

Exit gate:
- selected asset IDs appear in job and receipt

## Phase 7 — Providers and Keys

- provider cards
- honest placeholders
- KeyRail page
- browser-dev warning
- credential metadata
- test/revoke UI shell

Exit gate:
- mock provider needs no key
- future providers show needs-key/coming-soon honestly

## Phase 8 — Verifier and polish

- npm run verify
- forbidden string scan
- mock demo test
- visual polish pass
- copy cleanup

Exit gate:
- typecheck/lint/build/verify pass
- demo flow works

## Post-MVP

- desktop app with keychain
- local media probe worker
- workflow graph
- actual video provider adapters
- hosted collaboration/sync
- KeyRail spinout decision

_Note: Generic HTTP and local ComfyUI provider foundations shipped in Phase 4 (see provider specs)._
