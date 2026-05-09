# OpenMediaForge

**Local-first, provider-neutral AI media command desk** — a creator-grade workstation for planning generations, managing references, running jobs, and keeping **honest provenance** (queue → receipt → project packet). Current release: **`0.5.2-alpha`** ([`package.json`](./package.json)). Built clean-room: not a fork of MuAPI, Open-Generative-AI, or other stacks.

```text
Plan · generate · repair · prove  —  across your own adapters, keys, and storage
```

---

## Why it exists

Studios need a single surface that respects **project context**, **reference discipline**, and **BYOK as policy**, not as an afterthought. OpenMediaForge treats every run as a **job** with a **receipt**, wires credentials through **KeyRail** (credential refs and execution tickets in persisted data — never raw keys in jobs, receipts, packets, or activity logs), and keeps **mock** as the always-on demo lane while **real** lanes stay explicit and provider-identified.

---

## What you get today (v0.5.2-alpha)

| Area | Status |
|------|--------|
| **Studio & shell** | Dashboard, Image Studio, storyboard handoff, project workspace |
| **Web persistence** | **IndexedDB / localForage** for all app stores when `window.omfDesktop` is absent |
| **Desktop persistence** | **Electron + SQLite KV** in the main process; single storage path (no split-brain with IndexedDB) |
| **Desktop OS features** | Workspace folder (pick / enforce paths), import file-backed assets, reveal in OS, **ZIP project packet** export (UTF-8 JSON + `media/`), **keytar** keychain lane when available |
| **Jobs & receipts** | Queue, ledger receipts (success + scrubbed failure paths), execution tickets |
| **KeyRail** | Credential refs, browser-dev vault (labeled temporary), desktop keychain mode, audit-oriented metadata |
| **Mock provider** | Text-to-image and image-to-image, no keys, full pipeline |
| **Generic HTTP** | BYO endpoint: templates, response mapping, optional polling, KeyRail-aware auth |
| **ComfyUI (local)** | Connect, test, workflow templates, `/prompt` + history polling |
| **Replicate** | BYOK remote lane with explicit configuration; honest unsupported-shape errors where applicable |
| **Provider activity** | `/providers/activity` — run log and diagnostics without raw secrets |
| **Project packet export** | Redacted JSON (Zod + leak heuristics); desktop ZIP includes media for file-backed assets |
| **Linux installable app** | **AppImage** via `npm run desktop:pack`; optional **`*-launch.sh`** for Chromium sandbox flags (see [docs/DESKTOP_PACKAGING.md](./docs/DESKTOP_PACKAGING.md)) |

Hosted OpenMediaForge compute is **not** part of this product. Third-party catalog entries that are not real adapters stay **honest placeholders** until wired.

---

## Requirements

- **Node.js** ≥ 20.9.0  
- **npm** (or compatible client)

**Desktop packaging (Linux):** native **keytar** may need distro headers (for example `libsecret-1-dev` on Debian/Ubuntu). See [docs/DESKTOP_PACKAGING.md](./docs/DESKTOP_PACKAGING.md).

---

## Quick start

### Web (browser)

```bash
git clone https://github.com/bohselecta/openmedia.git
cd openmedia
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Attach a **project**, run **Image Studio** with the **Mock** provider, then inspect **Queue**, **Receipts**, and **Providers**. ZIP export and OS keychain require the desktop app.

### Desktop (development)

Runs Next on **port 3010** plus Electron (sandbox relaxed on Linux for typical dev machines):

```bash
npm install
npm run desktop:dev
```

If **3010** is busy, free the port or adjust `OMF_DEV_PORT` in [`package.json`](./package.json) `desktop:dev` and match `OMF_DEV_PORT` / `OMF_DEV_URL` in the Electron flow.

### Desktop (production Next, unpackaged)

After a normal production build:

```bash
npm run build
npm run desktop
```

Loads the **Next.js standalone** server embedded from `.next/standalone` (not `next dev`).

### Desktop (Linux AppImage)

```bash
npm run desktop:pack
```

Artifacts under **`dist-electron/`**: `OpenMediaForge-<version>.AppImage` and **`OpenMediaForge-<version>-launch.sh`** (preferred on Linux — forwards Chromium flags). Details: [docs/DESKTOP_PACKAGING.md](./docs/DESKTOP_PACKAGING.md). Post-install smoke: [docs/DESKTOP_SMOKE_CHECKLIST.md](./docs/DESKTOP_SMOKE_CHECKLIST.md).

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server (default port 3000) |
| `npm run build` | **`OMF_STANDALONE=1`** production build + sync static assets into `.next/standalone/` |
| `npm run start` | `next start` (after `build`) |
| `npm run desktop:dev` | Next **3010** + Electron with preload / IPC |
| `npm run desktop` | Electron + local **standalone** Next (run `build` first) |
| `npm run desktop:pack` | `build` then **electron-builder** Linux **AppImage** → `dist-electron/` |
| `npm run typecheck` | TypeScript — no emit |
| `npm run lint` | ESLint |
| `npm run verify` | **Gate:** `verify_build.py` + `verify_runtime.ts` (contracts, forbidden strings, mock/packet smoke) |

**Definition of done** for changes: **`npm run typecheck`**, **`npm run lint`**, **`npm run build`**, and **`npm run verify`** all pass.

---

## Web vs desktop

| | **Web** | **Desktop** |
|---|---------|-------------|
| **Storage** | IndexedDB / localForage | SQLite KV (`openmediaforge.sqlite` under app userData) |
| **Secrets** | Browser-dev vault (temporary) | Keychain via **keytar** when the module loads; same KeyRail ref model |
| **Workspace / ZIP** | JSON packet download; no ZIP of media | Workspace folder + **ZIP** packet with redacted JSON |
| **UI entry** | Any modern browser | Electron window; packaged app bundles **standalone Next** (child process with `ELECTRON_RUN_AS_NODE`) |

Trust and export semantics: [docs/DESKTOP_TRUST_PASS.md](./docs/DESKTOP_TRUST_PASS.md). **Settings → Local trust check** summarizes app mode, storage, key surface, workspace, packet export, version, and platform.

---

## Tech stack

- **Next.js** 16 (App Router) · **React** 19 · **TypeScript**
- **Tailwind CSS** · Radix-based UI primitives
- **Zustand** + **localforage** (web) / **SQLite** (desktop via **sql.js** in main) for persistence
- **TanStack Query** · **Zod**
- **Electron** 42 (desktop shell), **keytar**, **archiver** (ZIP), **electron-builder** (Linux AppImage)
- **`contracts/`** — machine-readable source of truth for tooling and verify scripts  
- **`docs/`** — product law, architecture, provider specs, security, desktop packaging

---

## Repository layout

```text
contracts/          # Types, JSON schemas, provider/job contracts
docs/               # Product, architecture, KeyRail, security, desktop packaging & smoke
electron/           # bootstrap.cjs (Linux sandbox env), main.cjs, preload.cjs
scripts/            # verify_build.py, verify_runtime.ts, standalone copy, electron-builder hooks
src/
  app/              # App Router (studio, projects, queue, receipts, settings, …)
  components/       # Shell, studio, boards, UI kit
  lib/              # Jobs, receipts, KeyRail, providers, export, storage, desktop helpers
dist-electron/      # Build output: AppImage + launcher (gitignored; produced by desktop:pack)
AGENTS.md           # Build rules for humans and agents
BUILD_DIRECTIVE.txt # Phased implementation prompt
STATUS.md           # Version snapshot and milestone pointers
```

---

## Provider lanes (mental model)

1. **Demo** — **Mock**: deterministic local outputs, zero network.
2. **Local** — **ComfyUI** against your server; workflow templates you validate.
3. **BYO HTTP** — **Generic HTTP**: your URL, templates, mapping, polling, KeyRail auth metadata.
4. **BYOK remote** — **Replicate**: configured adapter; errors and modalities are handled honestly.

Every adapter implements the same **manifest + validate + submit + poll** surface; models are driven by **manifests**, not hardcoded vendor SKUs in core app logic.

---

## Documentation map

| Doc | Topic |
|-----|--------|
| [LICENSE](./LICENSE) | **MIT** — permissive open-source terms for this repository |
| [AGENTS.md](./AGENTS.md) | Mission, GUI bar, security, verifier discipline |
| [STATUS.md](./STATUS.md) | Current version, how to run, key file paths |
| [docs/MVP_ROADMAP.md](./docs/MVP_ROADMAP.md) | Phases and milestones (v0.5.x desktop → v0.6 KeyRail depth) |
| [docs/PRODUCT_SPEC.md](./docs/PRODUCT_SPEC.md) | Product scope and law |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System shape and storage |
| [docs/DATA_MODEL.md](./docs/DATA_MODEL.md) | Domain data model |
| [docs/PROVIDER_ADAPTER_SPEC.md](./docs/PROVIDER_ADAPTER_SPEC.md) | Adapter contract |
| [docs/BYOK_KEYRAIL_SPEC.md](./docs/BYOK_KEYRAIL_SPEC.md) | KeyRail and execution tickets |
| [docs/GENERIC_HTTP_PROVIDER_SPEC.md](./docs/GENERIC_HTTP_PROVIDER_SPEC.md) | Generic HTTP lane |
| [docs/COMFYUI_PROVIDER_SPEC.md](./docs/COMFYUI_PROVIDER_SPEC.md) | Local ComfyUI lane |
| [docs/PROVIDER_ACTIVITY_LOG_SPEC.md](./docs/PROVIDER_ACTIVITY_LOG_SPEC.md) | Activity log semantics |
| [docs/PROJECT_PACKET_SPEC.md](./docs/PROJECT_PACKET_SPEC.md) | Export packet shape |
| [docs/SECURITY.md](./docs/SECURITY.md) | Threats and forbidden patterns |
| [docs/DESKTOP_TRUST_PASS.md](./docs/DESKTOP_TRUST_PASS.md) | Desktop trust: storage, keys, packets, receipts |
| [docs/DESKTOP_PACKAGING.md](./docs/DESKTOP_PACKAGING.md) | Linux AppImage build, runtime model, sandbox notes |
| [docs/DESKTOP_SMOKE_CHECKLIST.md](./docs/DESKTOP_SMOKE_CHECKLIST.md) | Manual packaged-app smoke test |

For a guided implementation pass, follow **`BUILD_DIRECTIVE.txt`**.

---

## Product law (short)

- **Studio first** — the UI must stand alone without paid remote compute.
- **No single-vendor gateway** baked into the architecture.
- **No fake buttons** that imply live cloud runs.
- **Jobs + receipts** for generations; packets for export — **no raw keys** in those artifacts.
- **KeyRail** stays **inside** OpenMediaForge until spinout gates are met; it is the trusted access layer for BYOK.

---

## Contributing & agents

- Prefer small, verified increments; run **`npm run verify`** (and **`build`** for desktop-touched changes) before calling a milestone complete.
- Keep new provider work **adapter-shaped**: manifests, validation, honest errors, ticketed network destinations.
- Do not introduce `muapi` or other forbidden vendor strings (enforced in verify).

---

## License

OpenMediaForge is released under the **[MIT License](./LICENSE)** — a widely used, permissive license (use, modify, distribute, sublicense, and sell) with minimal conditions: keep the copyright and permission notice, and accept the software “as is.” It is about as liberal as standard open-source gets without using a public-domain dedication such as **Unlicense** (which this project intentionally avoids).

The npm package remains **`"private": true`** for registry purposes only; that does not restrict your rights under the MIT license to the source code in this repository.
