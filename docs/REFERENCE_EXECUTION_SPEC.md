# Reference execution

Phase 3 binds **Asset Map handles**, **reference tiers**, and **Image Studio selections** into generation contracts.

## ReferenceSelection

Each picked reference carries:

- `assetId` — library pointer only (no embedded media).
- `stableHandle` — `@`-prefixed continuity token aligned with Asset Map labels.
- `role` — creative role string (often mirrors `AssetRole`).
- `priority` — `must_preserve` · `guide_style` · `optional_inspiration`.
- optional `note` — operator intent.

## Contracts

- `GenerationRequest` includes `referenceSelections`, `inputAssetIds`, and optional `targetProfile`.
- `GenerationJob` / `GenerationReceipt` persist both `inputAssetIds` and `referenceSelections` separately from `outputAssetIds`.
- Mock provider echoes counts into output labels and validates manifest reference budgets without network I/O.

## Validation

`src/lib/validation/referenceValidation.ts` emits **blocking errors** (duplicate handles, assets outside the project, missing assets) and **warnings** (budget overages, generic labels, role drift, missing primary reference for image-to-image manifests). Image Studio surfaces warnings but blocks submission on hard errors.

## Storyboard bridge

Storyboard shots already store `referenceHandles`. **Send to Image Studio** writes a short-lived session bootstrap payload that restores prompt text, project binding, and resolves handles against Asset Map rows.
