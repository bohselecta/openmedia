# 07 — BYOK / KeyRail Spec

## Position

BYOK is not the product at first. The open media studio is the product. BYOK becomes **KeyRail**, the trusted access layer **inside** OpenMediaForge (future desktop/server vaults follow the same execution ticket contract).

Later, if enough users need it, KeyRail can be spun out as its own protocol/product — **Phase 2 intentionally ships KeyRail as an internal trust console**, not a separate SKU.

## Purpose

KeyRail lets users connect their own provider accounts without turning OpenMediaForge into a hidden key sink or reseller gateway.

It answers:

- Which provider may use this credential?
- Which tasks are allowed?
- What cost limits apply?
- Was the user asked or was auto-run allowed?
- What data left the machine?
- How can access be revoked?

## Storage modes

### none

For mock/local providers that need no secret.

### browser-dev

MVP only. Uses browser storage with explicit warnings. Good for local demos and development, not final trust posture.

### desktop-keychain

Future serious local mode. Store secrets in OS credential storage through Tauri/Electron.

### server-vault

Future hosted mode. Secrets encrypted server-side with KMS/envelope encryption and never exposed to browser after save.

### env

For self-hosted deployments where server env vars supply keys.

## KeyRail interface

```ts
interface KeyRail {
  listCredentials(providerId?: string): Promise<CredentialRef[]>
  createCredential(input: CreateCredentialInput): Promise<CredentialRef>
  testCredential(credentialRef: string): Promise<CredentialTestResult>
  revokeCredential(credentialRef: string): Promise<void>
  createExecutionTicket(input: CreateExecutionTicketInput): Promise<ExecutionTicket>
  resolveForServerUse(ticket: ExecutionTicket): Promise<ResolvedSecretHandle>
  logUse(event: CredentialUseEvent): Promise<void>
}
```

## CredentialRef

Credential metadata only. Never store raw key.

```ts
type CredentialRef = {
  id: string
  providerId: string
  label: string
  storageMode: "none" | "browser-dev" | "desktop-keychain" | "server-vault" | "env"
  scopes: MediaTask[]
  status: "connected" | "expired" | "revoked" | "invalid"
  redactedPreview?: string
  dailyLimitUsd?: number
  perJobLimitUsd?: number
  maxConcurrentJobs?: number
  createdAt: string
  lastUsedAt?: string
}
```

## ExecutionTicket

```ts
type ExecutionTicket = {
  id: string
  providerId: string
  credentialRef?: string
  task: MediaTask
  modelId: string
  projectId?: string
  estimatedCost?: number
  maxCost?: number
  inputAssetIds: string[]
  referenceSelections: ReferenceSelection[]
  outputPolicy: "local-only" | "provider-hosted" | "mirror-local"
  approval: "auto" | "ask" | "blocked"
  networkDestinations: string[]
  expiresAt: string
}
```

Tickets mirror structural references from the originating `GenerationRequest` so audits can explain handles without pulling vault material.

## UI requirements

`/keys` must show:

- connected provider
- redacted preview
- storage mode
- scopes
- per-job and daily limits
- last used
- status
- test button
- revoke button
- warning if browser-dev

No raw key is displayed after save.

## Execution policy

Before a provider run:

1. Determine if provider requires credential.
2. Find usable credential ref.
3. Check task scope.
4. Check cost limit.
5. Check concurrency limit.
6. Create execution ticket.
7. Log use.
8. Provider receives ticket, not raw key.

## Spinout later

Only spin out KeyRail after:

- at least three provider integrations need credential authority
- users are asking for cross-app key management
- server/desktop/mobile storage differences become product-level pain
- audit/delegation features matter outside OpenMediaForge

Until then, keep it inside the studio.
