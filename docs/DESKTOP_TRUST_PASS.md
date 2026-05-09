# Desktop Trust Pass (v0.5.1-alpha)

This document describes how OpenMediaForge earns **desktop trust** for the creator spine: import → provider → job → output → receipt → activity → export packet.

## Storage model

| Surface | Behavior |
|---------|----------|
| **Web** | `localForage` → IndexedDB (or localStorage fallback). Same Zustand stores. |
| **Desktop (Electron)** | When `window.omfDesktop` is present, every store in `src/lib/storage/storage.ts` reads/writes through **SQLite-backed KV** in the main process (`electron/main.cjs`). Data persists under the app userData path as `openmediaforge.sqlite`. |
| **Workspace folder** | Chosen in Settings; stored in the `meta` KV namespace as `workspaceRoot`. Project folders and exports must stay under this root (enforced in IPC path checks). |

IndexedDB is **not** mirrored in parallel on desktop: the app uses one path only (SQLite KV), avoiding split-brain between two backends.

## Key model (KeyRail inside OpenMediaForge)

| Mode | Behavior |
|------|----------|
| **browser-dev** | Secrets in a labeled dev vault (not for production trust). |
| **desktop-keychain** | Secrets in OS keychain via keytar; renderer sees **credential refs** only. |
| **none / mock** | Mock lane needs no secrets. |

Jobs, receipts, provider activity, and export packets carry **credential ref ids** only — never raw tokens.

## Provider refs and activity

- **Provider configs** live in `provider_configs` store; optional `credentialRef` on config is metadata, not the secret.
- **Provider activity** (`provider_run_log` store) records lane, host, method, duration, errors, and credential ref. No Authorization header values.

## Receipts

Each terminal job produces a **ledger receipt** (`GenerationReceipt`):

- **Succeeded:** UUID receipt, full IO ids, costs when known, `ledgerStatus: "succeeded"`, `manifestId`, `redactionVersion`.
- **Failed / canceled:** deterministic id `rcpt-fail-<jobId>` so retries do not duplicate rows; `failureSummary` is scrubbed (no `Bearer …` fragments). On later success for the same job id, the failure row is removed.

## Export packet contents

`buildProjectPacket` (used for JSON download and desktop ZIP) emits:

- `packetSchemaVersion` **0.5.1**
- Project, assets, asset map, jobs (**settings redacted**), receipts, storyboard/prompt notes
- `providersUsed`, `credentialRefsMetadata` (metadata only)
- `providerActivitySummary` (project-scoped log lines, scrubbed errors)
- `redactedProviderConfigs` (Comfy workflow JSON omitted; template ids preserved)

Desktop ZIP additionally includes **UTF-8** `packet-<timestamp>.json` (via `writeTextFile`) plus **media/** files for file-backed assets. Pre-export validation refuses ZIP if `packetJsonLikelyContainsSecretMaterial` matches.

Runtime validation: `parseProjectPacketJson` (Zod) in `src/lib/export/projectPacketSchema.ts`.

## Known limitations

- **Linux packaging:** AppImage is automated via `npm run desktop:pack` (see [DESKTOP_PACKAGING.md](DESKTOP_PACKAGING.md)). `.deb` is deferred. Packaged runtime uses **Next standalone** + `ELECTRON_RUN_AS_NODE`, not static export.
- **Recipe import:** Generic HTTP JSON only; secrets in files are rejected by pattern scan. Comfy workflow import remains manual or template UI.
- **Replicate output:** First-class support assumes image URLs; other modalities return a clear unsupported-shape error.
- **Web mode:** Without `window.omfDesktop`, ZIP export and keychain are unavailable; UI degrades with honest copy.

## Developer commands

| Goal | Command |
|------|---------|
| Web dev | `npm run dev` |
| Desktop dev | `npm run desktop:dev` (Next on 3010 + Electron; passes Linux sandbox CLI flags) |
| Desktop (production Next, after `npm run build`) | `npm run desktop` |
| Quality gates | `npm run typecheck && npm run lint && npm run build && npm run verify` |

## Packaging (v0.5.2)

1. `electron-builder` targets **Linux AppImage**; metadata `appId`: `com.openmediaforge.app`, product name **OpenMediaForge**, version from `package.json`.
2. `OMF_STANDALONE=1` `next build` + `scripts/copy-standalone-assets.mjs` feeds `resources/omf-next/` — **no dev server** in packaged mode.
3. macOS and Windows installers after Linux path is proven in the field.
