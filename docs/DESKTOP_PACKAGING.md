# Desktop packaging (Linux AppImage)

OpenMediaForge **v0.5.2-alpha** ships an installable Linux desktop artifact built with **electron-builder**. The UI is a **production Next.js standalone server** bundled under `resources/omf-next/` — not `next dev` and not a static HTML export.

## Runtime model

On **Linux**, `electron/bootstrap.cjs` (the package `main` entry) sets **`ELECTRON_DISABLE_SANDBOX=1`** before Electron loads unless `OMF_PRESERVE_CHROMIUM_SANDBOX=1` is set. **`npm run desktop` / `desktop:dev`** also pass **`--no-sandbox --disable-setuid-sandbox`** on the Electron CLI so Chromium’s zygote sees them at startup. Packaged installs should use **`*-launch.sh`** (see below) or pass the same flags to the `.AppImage`.

| Layer | Role |
|-------|------|
| **Electron main** | Window shell, SQLite KV, filesystem ZIP export, keytar, dialogs |
| **Next standalone** | Child process: same Electron binary with `ELECTRON_RUN_AS_NODE=1` runs `server.js` from the standalone tree (default loopback port **38479**, or next free port / `OMF_INTERNAL_NEXT_PORT`) |
| **Renderer** | Creator UI; talks to Next over HTTP; uses `window.omfDesktop` for OS-backed features |

There is **no separate Node.js install** required: the embedded Next server uses Electron’s bundled Node ABI via `ELECTRON_RUN_AS_NODE`.

`npm run build` always sets `OMF_STANDALONE=1` and runs `scripts/copy-standalone-assets.mjs` so `.next/static` and `public` are copied into `.next/standalone/` before packaging.

`electron-builder` runs **`scripts/after-pack-omf-next.mjs`** after the unpack step so **`resources/omf-next/`** contains the **full** standalone tree including `node_modules` (the default `extraResources` copy omits those folders).

## Prerequisites

- Node **≥ 20.9**
- Linux build host (AppImage target)
- Build tools for **keytar** (libsecret / `libsecret-1-dev` on Debian/Ubuntu) if native compile is triggered

## Commands

| Goal | Command |
|------|---------|
| Web / CI production build | `npm run build` |
| Desktop against dev server | `npm run desktop:dev` |
| Desktop against local standalone (after build) | `npm run build && npm run desktop` |
| Linux AppImage | `npm run desktop:pack` |

Output directory: **`dist-electron/`** — e.g. `OpenMediaForge-0.5.2-alpha.AppImage` plus **`OpenMediaForge-0.5.2-alpha-launch.sh`** (use this for a one-command start on Linux).

## Install & launch (AppImage)

1. Build the artifact on Linux: `npm run desktop:pack`.
2. **Preferred:** run the generated launcher (same directory as the AppImage):  
   `chmod +x dist-electron/OpenMediaForge-*-launch.sh` then  
   `./dist-electron/OpenMediaForge-0.5.2-alpha-launch.sh`  
   The launcher forwards **`--no-sandbox --disable-setuid-sandbox`**, which Chromium needs on many Linux/AppImage/AppArmor combinations.
3. **Alternative:** run the AppImage directly with the same flags:  
   `./dist-electron/OpenMediaForge-0.5.2-alpha.AppImage --no-sandbox --disable-setuid-sandbox`
4. `chmod +x` the `.AppImage` if your filesystem stripped execute bits.

FUSE on some systems may require `libfuse2` for AppImage v2; if launch fails, install distro packages for FUSE/AppImage support (documented by the AppImage project).

## Linux sandbox / GPU notes

Chromium’s Linux sandbox stack often conflicts with **AppImage mounts** and **AppArmor user-namespace** rules. Mitigations in this repo:

- **`electron/bootstrap.cjs`** — sets `ELECTRON_DISABLE_SANDBOX` on Linux before Electron loads (unless `OMF_PRESERVE_CHROMIUM_SANDBOX=1`).
- **`npm run desktop` / `desktop:dev`** — pass **`--no-sandbox --disable-setuid-sandbox`** to the Electron binary so the zygote sees them at process start.
- **`*-launch.sh`** next to the AppImage — forwards the same flags for packaged installs.

For GPU-only issues, try appending Chromium flags after those (see Electron / Chromium docs).

## AppImage limitations (honest)

- **No system-wide “installer”** — the AppImage is a single file; desktop integration depends on optional `appimaged` / menu tools.
- **Updates** — replace the AppImage manually until an auto-update story exists.
- **Size** — the artifact includes Next standalone `node_modules` plus Electron’s `node_modules` subset for main-process deps; first ship prioritizes correctness over minimal bytes.

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| **Port in use** | Another process may be using **38479**. Set `OMF_INTERNAL_NEXT_PORT` to a free port before launch, or stop the conflicting service. |
| **Keychain unavailable** | Install OS keychain deps for **keytar**; diagnostics show “keytar not loaded” when the native module fails. Mock provider still works without secrets. |
| **Workspace permission denied** | Pick a folder you own; avoid system-only paths. |
| **AppImage not executable** | `chmod +x OpenMediaForge-*.AppImage`. |
| **GPU / sandbox launch** | Use **`OpenMediaForge-*-launch.sh`**, or pass **`--no-sandbox --disable-setuid-sandbox`** to the `.AppImage`, or set `ELECTRON_DISABLE_SANDBOX=1` in the environment. |

## `.deb` package

Not generated in this pass to keep scope on a single stable Linux target. AppImage remains the primary artifact; `.deb` can follow once CI and maintainer signing are ready.

## Partial path / blockers

If `electron-builder` or **keytar** compile fails on a given machine, capture the **exact npm / node-gyp log**, install the listed system headers, and retry. The app remains usable via **`npm run desktop:dev`** (development only) until packaging succeeds on that host.
