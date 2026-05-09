# OpenMediaForge — Status Report

_Generated for internal orientation. Update when milestones ship._

## Snapshot (as of this document)

| Item | Value |
|------|-------|
| **Package version** | `0.5.2-alpha` ([package.json](package.json)) |
| **Git tags** | `v0.4.0-alpha`, `v0.5.0-alpha`, `v0.5.1-alpha`; tag **`v0.5.2-alpha`** after this drop |
| **Stack** | Next.js 16 App Router, React 19, TypeScript, Tailwind, Zustand, TanStack Query, Zod, localForage / desktop SQLite KV |
| **Quality gates** | `npm run typecheck`, `lint`, `build`, `verify` — run on each release |

## Where we are (product arc)

- **Web MVP** — Creator-grade shell, projects, assets, Image Studio, queue, receipts, providers, keys (KeyRail), mock provider end-to-end.
- **Phase 4 — Provider foundations** — Generic HTTP, ComfyUI local, provider activity, dynamic manifests; jobs/receipts use credential refs only.
- **Phase 5 / v0.5 — Desktop local trust** — Electron, SQLite KV, keychain mode, workspace/project folders, import/reveal, ZIP export.
- **v0.5.1-alpha — Desktop Trust Pass + Real Provider Loop** — Failure receipts, packet redaction + Zod, activity/config in export, trust diagnostics v1. See [docs/DESKTOP_TRUST_PASS.md](docs/DESKTOP_TRUST_PASS.md).
- **v0.5.2-alpha — Installable Linux artifact** — `electron-builder` AppImage, embedded Next standalone (`ELECTRON_RUN_AS_NODE`), extended Local trust check, packaging + smoke docs. See [docs/DESKTOP_PACKAGING.md](docs/DESKTOP_PACKAGING.md), [docs/DESKTOP_SMOKE_CHECKLIST.md](docs/DESKTOP_SMOKE_CHECKLIST.md).
- **Roadmap** — [docs/MVP_ROADMAP.md](docs/MVP_ROADMAP.md) (KeyRail remains **inside** OpenMediaForge until spinout gates).

## How to run

| Mode | Command |
|------|---------|
| Web dev | `npm run dev` |
| Desktop dev (Next on **3010** + Electron) | `npm run desktop:dev` |
| Production build (always standalone layout) | `npm run build` |
| Desktop against local standalone | `npm run build && npm run desktop` |
| Linux AppImage | `npm run desktop:pack` |
| Verification | `npm run verify` |

**Linux desktop:** If port **3010** is busy during dev, stop the other process first. Packaged Next uses **38479** by default (see [DESKTOP_PACKAGING.md](docs/DESKTOP_PACKAGING.md)).

## Key paths (implementation)

| Area | Location |
|------|----------|
| Desktop shell | [electron/main.cjs](electron/main.cjs), [electron/preload.cjs](electron/preload.cjs) |
| Desktop types | [src/types/omf-desktop.d.ts](src/types/omf-desktop.d.ts) |
| Storage | [src/lib/storage/indexedDbStorage.ts](src/lib/storage/indexedDbStorage.ts), [src/lib/storage/storage.ts](src/lib/storage/storage.ts) |
| Trust diagnostics | [src/lib/desktop/trustDiagnostics.ts](src/lib/desktop/trustDiagnostics.ts), [useDesktopTrustSnapshot.ts](src/lib/desktop/useDesktopTrustSnapshot.ts) |
| Standalone asset sync | [scripts/copy-standalone-assets.mjs](scripts/copy-standalone-assets.mjs) |
| Packet + redaction | [src/lib/export/projectPacket.ts](src/lib/export/projectPacket.ts), [packetRedaction.ts](src/lib/export/packetRedaction.ts), [projectPacketSchema.ts](src/lib/export/projectPacketSchema.ts) |
| Receipts | [src/lib/jobs/receipt.ts](src/lib/jobs/receipt.ts), [contracts/data-model.contract.ts](contracts/data-model.contract.ts) |
| Providers | [src/lib/providers/](src/lib/providers/) |
| Recipe import | [src/lib/recipe/importGenericHttpRecipe.ts](src/lib/recipe/importGenericHttpRecipe.ts) |
| Verify | [scripts/verify_build.py](scripts/verify_build.py), [scripts/verify_runtime.ts](scripts/verify_runtime.ts) |

## Done vs next (honest)

**Solid now**

- Linux **AppImage** path via `npm run desktop:pack` (embedded Next standalone, no dev server).
- Full creator loop with mock + real adapters; desktop persistence via SQLite KV.
- Export packet redaction, UTF-8 packet in ZIP, verifier checks on packet JSON.
- Local trust check panel (Settings + Provider Activity snapshot).

**Still thin / next milestones**

- **`.deb` / signing / smaller bundle`** after AppImage feedback.
- Richer Comfy template marketplace (v0.5.3+).
- KeyRail grant layer v1 (v0.6.0) — still not a separate product.

## References

- Trust pass: [docs/DESKTOP_TRUST_PASS.md](docs/DESKTOP_TRUST_PASS.md)
- Packaging: [docs/DESKTOP_PACKAGING.md](docs/DESKTOP_PACKAGING.md)
- Smoke checklist: [docs/DESKTOP_SMOKE_CHECKLIST.md](docs/DESKTOP_SMOKE_CHECKLIST.md)
- Build rules: [AGENTS.md](AGENTS.md), [BUILD_DIRECTIVE.txt](BUILD_DIRECTIVE.txt)
- Contracts: [contracts/](contracts/)
