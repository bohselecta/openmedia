# ComfyUI Local Provider (Phase 4)

The **ComfyUI (local)** adapter targets a user-run ComfyUI server (default `http://127.0.0.1:8188`). OpenMediaForge does not bundle Comfy graphs or checkpoints.

## Server routes (reference)

The client uses REST first:

- `GET /system_stats` — connectivity and device hints
- `GET /object_info` — node catalog hints
- `POST /prompt` — queue a workflow with `{ prompt, client_id }`
- `GET /history/{prompt_id}` — poll completion and outputs
- `GET /view` — resolve output filenames to view URLs
- `POST /interrupt` — best-effort cancel (may affect the global Comfy queue)

WebSocket `/ws` is reserved for a future progressive enhancement; Phase 4 does not require it.

## Workflow templates

Users paste **ComfyUI API-format** workflow JSON and map:

- Prompt / negative / seed / width / height paths (dot notation inside the graph)
- Optional image input path for image-to-image (after `POST /upload/image`)
- Output node ids (or auto-scan when omitted)

Templates are validated structurally before the provider advertises runnable models. **Without a validated template, ComfyUI stays connected-but-not-runnable.**

## Auth (v1)

Local v1 assumes **no API key** for localhost. Execution tickets still mint with `credentialRef` unset; audit text clarifies that no third-party key is involved.
