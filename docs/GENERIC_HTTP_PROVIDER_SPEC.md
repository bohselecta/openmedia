# Generic HTTP Provider (Phase 4)

OpenMediaForge includes a **Generic HTTP** adapter for advanced users who operate their own inference HTTP services. This lane is intentionally user-controlled: you supply the base URL, HTTP method, JSON request template with simple `{{placeholder}}` interpolation, response field paths, and optional polling.

## Principles

- **No OpenMediaForge hosted compute** — the app never implies bundled credits or a single vendor gateway.
- **BYO endpoint** — you are responsible for the remote system, data handling, and compliance.
- **KeyRail** — when auth requires a secret, jobs and receipts store **credential refs only**; vault resolution happens at request time inside the adapter.
- **Honest failures** — invalid templates, unreachable hosts, or mapping errors surface as job failures with readable messages.

## Interpolation

Supported placeholders include: `{{prompt}}`, `{{negativePrompt}}`, `{{modelId}}`, `{{seed}}`, `{{projectId}}`, `{{referenceHandles}}`, `{{inputAssetUrls}}`, `{{settings.width}}`, `{{settings.height}}`, and `{{jobId}}` during polling.

## Polling

Optional GET or POST polling uses a URL template and simple dot-path reads from JSON responses. This is not a full scripting engine.
