# OpenMediaForge — Status Report

_Generated for internal orientation. Update when milestones ship._

## Snapshot (as of this document)

| Item | Value |
|------|--------|
| **Package version** | `0.5.0-alpha` ([package.json](package.json)) |
| **Git tags** | `v0.4.0-alpha` (Phase 4 lock), `v0.5.0-alpha` (desktop + depth pass) |
| **Stack** | Next.js 16 App Router, React 19, TypeScript, Tailwind, Zustand, TanStack Query, Zod, localForage / desktop SQLite KV |
| **Quality gates** | `npm run typecheck`, `lint`, `build`, `verify` — all expected to pass on main |

## Where we are (product arc)

- **Web MVP** — Creator-grade shell, projects, assets, Image Studio, queue, receipts, providers, keys (KeyRail), mock provider end-to-end.
- **Phase 4 — Provider foundations** — Generic HTTP (BYO endpoint), ComfyUI local adapter with workflow templates, provider activity log, dynamic manifests; **no** single-vendor gateway; jobs/receipts use credential refs only.
- **Phase 5 / v0.5 — Desktop local trust (in progress / first slice shipped)** — **Electron** wraps the same Next UI; **SQLite-backed KV** (sql.js in main process) mirrors IndexedDB stores when `window.omfDesktop` is present; **OS keychain** via keytar for `desktop-keychain` KeyRail mode; **workspace folder** + **project disk folders**; **import media**, **reveal file assets**, **ZIP project packet** export on desktop; Comfy outputs can mirror to project disk; **Replicate BYOK** adapter for first paid-style cloud path.
- **Roadmap alignment** — See [docs/MVP_ROADMAP.md](docs/MVP_ROADMAP.md) (includes KeyRail spinout gate). Hosted OpenMediaForge compute gateway is explicitly out of scope.

## What was built recently (recent commits)

1. **`Phase 4: provider foundations with Generic HTTP and ComfyUI`** (`4dc04b2`) — Tagged **`v0.4.0-alpha`**.
2. **`Phase 5: Electron desktop shell, KeyRail keychain, SQLite KV, Comfy/Replicate depth`** (`0017678`) — Large delivery: `electron/`, desktop IPC, storage bridge, asset mirror, replicate provider, UI hooks. Tagged **`v0.5.0-alpha`**.
3. **`fix(desktop): disable Electron sandbox on Linux; allow 127.0.0.1 dev HMR for Electron`** (`d339882`) — `ELECTRON_DISABLE_SANDBOX=1` in npm scripts; `allowedDevOrigins: ["127.0.0.1"]` in [next.config.ts](next.config.ts) for Electron loading dev server.

Follow-on fixes in session work (media import / recipe export / port conflict guidance) may be additional commits; see `git log`.

## How to run

| Mode | Command |
|------|---------|
| Web dev | `npm run dev` |
| Desktop dev (Next on **3010** + Electron) | `npm run desktop:dev` |
| Production build | `npm run build` then `npm run start` |
| Verification | `npm run verify` |

**Linux desktop:** If port **3010** is busy (`EADDRINUSE`), stop the other Next/Electron process first. Only one `desktop:dev` at a time.

## Key paths (implementation)

| Area | Location |
|------|----------|
| Desktop shell | [electron/main.cjs](electron/main.cjs), [electron/preload.cjs](electron/preload.cjs) |
| Desktop types | [src/types/omf-desktop.d.ts](src/types/omf-desktop.d.ts) |
| Storage (web vs desktop KV) | [src/lib/storage/indexedDbStorage.ts](src/lib/storage/indexedDbStorage.ts) |
| KeyRail / vault | [src/lib/keyrail/](src/lib/keyrail/), [src/lib/keyrail/vaultSecrets.ts](src/lib/keyrail/vaultSecrets.ts) |
| Providers | [src/lib/providers/](src/lib/providers/) — mock, generic HTTP, Comfy, **replicate**, placeholders |
| Verify scripts | [scripts/verify_build.py](scripts/verify_build.py), [scripts/verify_runtime.ts](scripts/verify_runtime.ts) |

## Done vs next (honest)

**In place**

- Mock + Generic HTTP + ComfyUI foundation + run log.
- Electron + SQLite KV + keychain-backed secrets + workspace/project folders + desktop import/reveal/ZIP export.
- Comfy template UI extensions (mapper fields, desktop default base URL hint), optional WS helper module, output mirroring hook.
- Generic HTTP dry-run preview + redacted recipe JSON export per saved config.
- Replicate BYOK adapter + manifest (`replicate-image-byok-v1`); tickets/secrets via KeyRail like other BYOK lanes.

**Still thin / follow-ups**

- Tauri remains a later option; Electron is the chosen bridge for now.
- Standalone Next packaging for production Electron (`OMF_STANDALONE=1` build) is scaffolded in config but not fully documented as a one-click artifact.
- Recipe **import** from JSON file is manual vs one-click UI.
- Workflow DAG across providers, additional cloud adapters, and KeyRail product spinout stay roadmap-only until gates in [docs/MVP_ROADMAP.md](docs/MVP_ROADMAP.md).

## References

- Build rules: [AGENTS.md](AGENTS.md), [BUILD_DIRECTIVE.txt](BUILD_DIRECTIVE.txt)
- Contracts: [contracts/](contracts/)
- Product/docs: [docs/](docs/)
