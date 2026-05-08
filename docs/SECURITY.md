# 12 — Security, Privacy, and Safety

## Runtime baseline

Ship and verify the web app on **Node.js 20 LTS** with **Next.js 16** (see repository `engines`, `.nvmrc`, and `package.json` pins). Track upstream security advisories for both.

## Privacy posture

Default to local-first. The app should be useful without signing in, uploading to a central service, or providing a key.

## Key rules

- Raw keys must not appear in job or receipt records.
- Raw keys must not appear inside exported **project packets** or ledger dumps — only credential metadata refs.
- Raw keys must not be visible after save.
- Browser-dev key storage must be explicitly labeled temporary.
- Provider calls must disclose destination provider.
- Receipts must include network destinations where applicable.

## Browser-dev warning copy

> Browser-dev vault is for local testing and early access only. For production, OpenMediaForge will use desktop keychain or encrypted server vault storage. Do not store high-value production keys here unless you understand the risk.

## Provider transparency

Before any remote run, show:

- provider name
- model name
- task
- credential ref
- estimated cost if available
- data that may leave the device
- output hosting policy

## User-generated content responsibility

OpenMediaForge is a planning, routing, and media-workflow tool. Users are responsible for ensuring they have the right to use uploaded assets, including likenesses, trademarks, copyrighted references, audio, and private materials.

## Likeness warning

Show near identity/reference upload:

> Use only people, brands, characters, images, and audio you own, licensed, or have permission to use.

## Moderation posture

Do not market as "unrestricted" or "no guardrails." Say:

> OpenMediaForge is provider-neutral. Each connected provider may apply its own policies. Users are responsible for lawful and permitted use.

## Deletion

Delete must remove:

- project metadata
- local asset blobs where stored
- jobs
- receipts
- asset map entries
- credential metadata if deleting provider/key

Future cloud mode must also delete server DB rows and storage objects.

## Network transparency

Future page or panel:

- recent provider calls
- destination host
- task
- model
- job id
- credential ref
- timestamp

## Forbidden implementation patterns

- hardcoded vendor gateway
- webSecurity disabled without a documented desktop reason
- storing keys in ordinary app state
- logging raw keys
- putting secrets in receipts
- hidden remote analytics for job data

## Phase 4

The **provider activity log** records execution attempts with host-level destinations only — never full Authorization headers. See `docs/PROVIDER_ACTIVITY_LOG_SPEC.md`.
