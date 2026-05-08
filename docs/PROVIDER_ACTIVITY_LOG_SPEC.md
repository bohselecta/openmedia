# Provider Activity Log

The provider activity log records **network-transparent execution attempts** across adapters. It complements KeyRail audit events by focusing on HTTP surface area.

## Fields

Each entry includes timestamp, provider id, optional provider config id, optional project/job ids, task label, **lane** (`mock`, `local`, `byok-remote`, `future-hosted`), HTTP method summary, destination **host only**, status, optional HTTP status, duration, optional credential ref, and optional high-level network destination string.

## Privacy rules

- Never store raw API keys, bearer tokens, or full `Authorization` headers.
- Prefer host-only destinations in UI; paths may appear in structured network destination lists on receipts/tickets without secrets.

## UI

`/providers/activity` lists recent entries with links back to queue jobs when available.
