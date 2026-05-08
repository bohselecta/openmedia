# Project packet export

Project packets bundle **metadata-only** production state for archival, hand-off, or downstream tooling.

## Scope

JSON exports include:

- App name / version and ISO export timestamp.
- Project record.
- Assets + Asset Map rows scoped to the project.
- `referenceSelectionsByJobId` map for quick lineage joins.
- Jobs and receipts (credential refs only — never raw secrets).
- Storyboard shots and saved prompt notes.
- Provider IDs touched plus **credential ref metadata** (labels, storage mode, scopes, status, timestamps).

## Explicit non-goals (MVP)

- Binary media bytes are **not** embedded. The packet carries URIs and IDs only until an optional ZIP exporter ships.
- Packet JSON must remain safe to share relative to KeyRail rules: no vault materialization.

## Implementation

`src/lib/export/projectPacket.ts` exposes `buildProjectPacket` and `projectPacketToJson`. The project workspace **Export project packet** button downloads `openmediaforge-project-<id>.json`.

The receipts page can export the entire ledger as JSON for cross-project audits.
