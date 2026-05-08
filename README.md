# OpenMediaForge

**Local-first, provider-neutral AI media command desk** — a creator-grade workstation for planning generations, managing references, running jobs, and keeping **honest provenance** (queue → receipt → project packet). Built clean-room: not a fork of MuAPI, Open-Generative-AI, or other stacks.

```text
Plan · generate · repair · prove  —  across your own adapters, keys, and storage
```

---

## Why it exists

Studios need a single surface that respects **project context**, **reference discipline**, and **BYOK as policy**, not as an afterthought. OpenMediaForge treats every run as a **job** with a **receipt**, wires credentials through **KeyRail** (refs and execution tickets only in persisted data), and keeps **mock** as the always-on demo lane while **real** lanes stay explicit.

---

## What you get today

| Area | Status |
|------|--------|
| **Studio & shell** | Dashboard, Image Studio, Storyboard handoff, project workspace |
| **Projects & assets** | IndexedDB persistence, asset map, reference budget validation |
| **Jobs & receipts** | Queue, receipts, execution tickets, network destination hints |
| **KeyRail** | Credential refs, browser-dev vault (labeled temporary), audit trail |
| **Mock provider** | Text-to-image & image-to-image, no keys, full pipeline |
| **Generic HTTP** | BYO endpoint lane: templates, mapping, optional polling, KeyRail auth |
| **ComfyUI (local)** | Connect, test, import API workflow templates, `/prompt` + history polling |
| **Provider activity** | `/providers/activity` — run log without raw secrets |
| **Project packet export** | JSON lineage export (no embedded media binaries in MVP) |

Hosted OpenMediaForge compute is **not** part of this product; third-party cards stay **honest placeholders** until real adapters land.

---

## Requirements

- **Node.js** ≥ 20.9.0  
- **npm** (or compatible client)

Optional: match the repo’s Node major via `.nvmrc` if present.

---

## Quick start

```bash
git clone <repository-url>
cd <repo-directory>
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Attach a **project**, try **Image Studio** with the **Mock** provider, then inspect **Queue**, **Receipts**, and **Providers**.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server (after `build`) |
| `npm run typecheck` | TypeScript — no emit |
| `npm run lint` | ESLint |
| `npm run verify` | **Gate:** Python static checks + Node smoke (mock job, packet, provider markers) |

**Definition of done** for changes: `typecheck`, `lint`, `build`, and `verify` all pass.

---

## Tech stack

- **Next.js** 16 (App Router) · **React** 19 · **TypeScript**
- **Tailwind CSS** · Radix-based UI primitives
- **Zustand** + **localforage** (IndexedDB) for client persistence
- **TanStack Query** · **Zod**
- **Contracts** in `contracts/` as the machine-readable source of truth; **`docs/`** for product law and specs

---

## Repository layout

```text
contracts/          # Types & provider contracts (source of truth for tooling)
docs/               # Product, architecture, provider, KeyRail, security specs
scripts/            # verify_build.py, verify_runtime.ts
src/
  app/              # App Router pages (studio, projects, queue, receipts, …)
  components/       # Shell, studio, boards, UI kit
  lib/              # Jobs, receipts, KeyRail, providers, export, storage, …
AGENTS.md           # Build rules for humans and agents
BUILD_DIRECTIVE.txt # Phased build prompt for greenfield implementation
```

---

## Provider lanes (mental model)

1. **Demo** — Mock: deterministic local outputs, zero network.
2. **Local** — ComfyUI against *your* server; workflow templates you supply.
3. **BYO HTTP** — Generic HTTP: advanced users, your URL, your contract; mapping and polling you configure.
4. **Planned BYOK** — Replicate, Fal, RunPod, etc.: UI placeholders only until adapters exist.

Every adapter implements the same **manifest + validate + submit + poll** surface; models are not hardcoded vendor SKUs in app logic.

---

## Documentation map

| Doc | Topic |
|-----|--------|
| [AGENTS.md](./AGENTS.md) | Mission, GUI bar, security, verifier discipline |
| [docs/PRODUCT_SPEC.md](./docs/PRODUCT_SPEC.md) | Product scope and law |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System shape and storage |
| [docs/PROVIDER_ADAPTER_SPEC.md](./docs/PROVIDER_ADAPTER_SPEC.md) | Adapter contract |
| [docs/BYOK_KEYRAIL_SPEC.md](./docs/BYOK_KEYRAIL_SPEC.md) | KeyRail & execution tickets |
| [docs/GENERIC_HTTP_PROVIDER_SPEC.md](./docs/GENERIC_HTTP_PROVIDER_SPEC.md) | Generic HTTP lane |
| [docs/COMFYUI_PROVIDER_SPEC.md](./docs/COMFYUI_PROVIDER_SPEC.md) | Local ComfyUI lane |
| [docs/PROVIDER_ACTIVITY_LOG_SPEC.md](./docs/PROVIDER_ACTIVITY_LOG_SPEC.md) | Activity log semantics |
| [docs/SECURITY.md](./docs/SECURITY.md) | Threats and forbidden patterns |

For a guided first read when extending the product, follow **`BUILD_DIRECTIVE.txt`** (or the ordered list inside it).

---

## Product law (short)

- **Studio first** — the UI must stand alone without paid remote compute.
- **No single-vendor gateway** baked into the architecture.
- **No fake buttons** that imply live cloud runs.
- **Jobs + receipts** for generations; packets for export — **no raw keys** in those artifacts.
- **KeyRail** is the internal trusted access layer; spinout is a later decision.

---

## Contributing & agents

- Prefer small, verified increments; run **`npm run verify`** before calling a milestone complete.
- Keep new provider work **adapter-shaped**: manifests, validation, honest errors, ticketed network destinations.
- Do not introduce `muapi` or other forbidden vendor strings (enforced in verify).

---

## License

This package is **private** (`"private": true` in `package.json`). Add a public license file when you open-source the project.
