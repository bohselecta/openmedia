# Desktop smoke checklist (packaged Linux)

Manual pass to confirm **v0.5.2-alpha** installable behavior: persistence, mock loop, export safety, and trust diagnostics. Automate later if we add headed E2E; for now this is the release gate for desktop.

## Preconditions

- Fresh or known `dist-electron/OpenMediaForge-*.AppImage` from `npm run desktop:pack`.
- Optional: empty test user account to avoid mixing with real workspaces.

## Steps

1. **Launch** the AppImage using **`dist-electron/OpenMediaForge-*-launch.sh`** (or the `.AppImage` with `--no-sandbox --disable-setuid-sandbox` — see [DESKTOP_PACKAGING.md](DESKTOP_PACKAGING.md)). Confirm the main shell loads without running `npm run desktop:dev`.
2. **Settings → Local trust check**  
   - App mode: **desktop packaged**  
   - Storage: **desktop SQLite KV**  
   - Key surface: matches keytar (available vs unavailable)  
   - Workspace: **missing** until selected  
   - Packet export: **available**  
   - Version / platform: plausible strings  
3. **Provider activity → Runtime snapshot** shows the same mode/storage/key/workspace/packet line without errors.
4. **Workspace** — choose a folder under your home (e.g. `~/omf-smoke-ws`). Confirm trust panel shows **selected (…)**.
5. **Project** — create a new project; confirm it appears in Projects.
6. **Asset** — import one **file-backed** media asset (image) into the project; confirm it appears in Assets and preview works.
7. **Mock job** — run a **mock** image generation for that project; wait for completion.
8. **Outputs** — confirm new output asset and a **receipt** in Receipts; Provider activity shows a completed mock line without raw secrets.
9. **Export** — export a **ZIP project packet**; unzip and open the JSON; confirm `redactedProviderConfigs` / scrubbed activity per product law (no `Bearer`, no API keys).
10. **Quit** the application completely (all windows closed; process exited).
11. **Reopen** the same AppImage.
12. **Survival** — confirm: current **workspace** path, **project**, **imported asset**, **job**, **receipt**, **provider activity** entries, and **provider configs** (mock unchanged) still present.

## Pass / fail

- **Pass** — all steps succeed; trust diagnostics still read **desktop packaged** + **SQLite KV** after reopen.
- **Fail** — note the step, OS, and any console output from terminal launch (`./OpenMediaForge-*.AppImage` stderr).

## Secret safety (spot checks during step 9)

- Packet JSON must not contain env-style `OPENAI_API_KEY=…` lines or `Authorization: Bearer` values.
- No `.env` or `.env.local` files inside the ZIP.

## Automation

`npm run verify` runs static gates (including packet leak heuristics). It does **not** launch Electron; this checklist remains the authoritative packaged smoke until we add a targeted headed verifier.
