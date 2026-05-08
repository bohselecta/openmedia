# 09 — Job Queue and Receipts

## Job queue purpose

Every generation is a job. Jobs make progress, failures, retries, costs, and provider behavior visible.

## Job states

```txt
queued → running → completed
queued → running → failed
queued → canceled
running → canceled
failed → retry
completed → branch
```

## Job card requirements

- task
- provider
- model
- project
- prompt preview
- input asset count
- progress
- status
- estimated/actual cost
- created date
- cancel/retry/receipt buttons

## Receipt purpose

Receipts make generation auditable and repeatable.

A receipt answers:

- What made this output?
- Which provider/model was used?
- Which key reference authorized it?
- What prompt/settings/assets were used?
- What did it cost?
- Did data leave the device?
- Which outputs were created?

## Receipt card requirements

- receipt id
- job id
- provider/model
- task
- local/remote/mock badge
- credential ref if used
- prompt preview
- settings summary
- input asset chips
- output asset chips
- estimated/actual cost
- network destinations
- created timestamp
- export JSON button

## Receipt writer

The receipt writer runs only after job completion and output asset creation.

It must not store:

- raw API key
- access token
- bearer token
- password
- full secret value

It may store:

- credentialRef
- redacted provider label
- network destination hostnames

## Repair and branch

Completed jobs can be:

- branched into a variation
- repaired with adjusted prompt/settings
- re-run with another provider/model

The new job must link back to original job id as `parentJobId` later.

## Export

Receipts should export individually and inside project packets.
