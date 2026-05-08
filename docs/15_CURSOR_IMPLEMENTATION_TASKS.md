# 15 — Cursor Implementation Tasks

## Task 1 — Scaffold

Create Next.js App Router app with TypeScript, Tailwind, shadcn/ui, Zustand, TanStack Query, Zod, localForage.

Routes:

- `/`
- `/studio`
- `/studio/image`
- `/studio/video`
- `/studio/edit`
- `/studio/lipsync`
- `/studio/storyboard`
- `/studio/workflows`
- `/projects`
- `/assets`
- `/queue`
- `/receipts`
- `/providers`
- `/keys`
- `/settings`

## Task 2 — GUI shell

Build:

- `components/shell/AppShell.tsx`
- `components/shell/LeftRail.tsx`
- `components/shell/TopBar.tsx`
- `components/shell/InspectorPanel.tsx`

Use the design system in `02_GUI_AND_DESIGN_SYSTEM.md`.

## Task 3 — Domain types

Implement:

- `lib/projects/projectTypes.ts`
- `lib/assets/assetTypes.ts`
- `lib/providers/types.ts`
- `lib/keyrail/types.ts`
- `lib/models/manifestTypes.ts`
- `lib/jobs/jobTypes.ts`
- `lib/receipts/receiptTypes.ts`

## Task 4 — Storage

Implement:

- `lib/storage/storage.ts`
- `lib/storage/indexedDbStorage.ts`
- `lib/projects/projectStore.ts`
- `lib/assets/assetStore.ts`
- `lib/jobs/jobStore.ts`
- `lib/receipts/receiptStore.ts`
- `lib/keyrail/credentialStore.ts`

## Task 5 — Provider registry

Implement:

- `lib/providers/registry.ts`
- `lib/providers/mockProvider.ts`
- `lib/providers/genericHttpProvider.ts` placeholder
- `lib/providers/comfyProvider.ts` placeholder
- `lib/providers/sdcppProvider.ts` placeholder
- `lib/providers/wan2gpProvider.ts` placeholder

## Task 6 — Model manifests

Implement:

- `lib/models/sampleManifests.ts`
- `lib/models/validateManifest.ts`

Include mock manifests.

## Task 7 — KeyRail MVP

Implement:

- `lib/keyrail/keyrail.ts`
- `lib/keyrail/browserDevVault.ts`
- `lib/keyrail/executionTickets.ts`
- `lib/keyrail/auditLog.ts`

MVP can use browser-dev warnings and placeholder secret resolution, but app records must use credential refs.

## Task 8 — Job runner

Implement:

- `lib/jobs/jobRunner.ts`
- `lib/jobs/receipt.ts`

Job runner must call provider through registry and create receipt on completion.

## Task 9 — Image Studio

Implement:

- provider picker
- model picker
- prompt composer
- reference selector
- submit button
- progress panel
- result grid
- receipt link

## Task 10 — Assets

Implement:

- asset grid
- upload/import placeholder
- asset role/priority/rights metadata
- stable label copy
- reference budget panel

## Task 11 — Queue and Receipts

Implement:

- `/queue` job list
- `/receipts` receipt list
- receipt detail/card
- export JSON

## Task 12 — Providers and Keys

Implement:

- `/providers` provider cards
- `/keys` KeyRail cards
- add key modal with browser-dev warning
- test/revoke UI shell

## Task 13 — Verify

Implement `scripts/verify_build.py` and package.json script `verify`.

## Task 14 — Polish

Run a founder-grade polish pass:

- no broken empty states
- no raw placeholder ugliness
- clear language
- strong visual hierarchy
- responsive enough
- no fake claims

## Done

Only after:

```bash
npm run typecheck
npm run lint
npm run build
npm run verify
```
