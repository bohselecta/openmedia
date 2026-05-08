# OpenMediaForge — Cursor Spec Pack

OpenMediaForge is a ground-up, local-first AI media command desk for creators, video artists, musicians, influencers, and small studios.

## Requirements

- **Node.js** >= 20.9.0 (see `.nvmrc` for the recommended major version)
- **Next.js** 16.x (pinned in `package.json`)

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run verify
```

It is not a fork, skin, or clone of any existing app. It is a new product built around five durable primitives:

1. **Studio first** — a beautiful, fast creative workspace that works before compute is attached.
2. **Provider adapters** — every compute source is swappable: mock, local, remote, BYOK, future hosted.
3. **Asset maps** — references are labeled, budgeted, prioritized, and reused across jobs.
4. **Job receipts** — every generation has a traceable prompt, provider, model, key reference, cost, input/output set, and rights state.
5. **KeyRail inside** — BYOK begins as the trusted access layer inside the studio and can be spun out later once the need is obvious.

## Cursor usage

1. Create a fresh repo.
2. Copy this pack into the repo root.
3. Open Cursor Composer.
4. Paste the contents of `BUILD_DIRECTIVE.txt`.
5. Let Cursor implement in phases.
6. Do not accept "done" unless `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run verify` pass.

## Recommended first app name

**OpenMediaForge**

Public-facing line:

> Plan, generate, repair, and prove AI media work across your own models, keys, and providers.

## Build order summary

1. Scaffold the app and workstation GUI.
2. Implement domain types and storage.
3. Implement provider registry and mock provider.
4. Implement job queue and receipts.
5. Build the Image Studio end-to-end.
6. Add Asset Map / Reference Budget.
7. Add Queue, Receipts, Providers, and Keys pages.
8. Add honest provider placeholders.
9. Add verifier gates.
10. Polish into a creator-grade visual product.

## Non-negotiable product law

- No hardcoded single provider gateway.
- No fake compute claims.
- Mock provider is allowed only when clearly labeled.
- BYOK is an authority layer, not a casual API-key input.
- The UI never gets raw keys after save.
- Every job creates a receipt.
- Every provider is an adapter.
- Every model is a manifest.
- Every asset can be labeled, role-tagged, and rights-tagged.
- Verify before claiming complete.
