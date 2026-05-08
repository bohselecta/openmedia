# 14 — Acceptance Criteria

## Demo flow

The app is acceptable when a user can:

1. Open `/`.
2. Understand the product in under 30 seconds.
3. Open `/studio/image`.
4. See Mock Provider selected.
5. Select `mock-image-v1`.
6. Enter a prompt.
7. Submit a job.
8. Watch progress.
9. See a placeholder output asset.
10. Open the generated receipt.
11. See provider/model/task/prompt/settings/input/output/cost/network fields.
12. Visit `/assets` and see the output asset.
13. Visit `/queue` and see the job.
14. Visit `/providers` and see provider cards.
15. Visit `/keys` and understand KeyRail status.

## Build checks

Must pass:

```bash
npm run typecheck
npm run lint
npm run build
npm run verify
```

## Verify script checks

- provider registry loads
- mock provider exists
- model manifests load
- mock generation creates a job
- mock job completes
- receipt is created
- no forbidden `muapi` string in source
- no raw secret fields in job/receipt contract
- no hardcoded single-provider gateway in production source

## Visual acceptance

- App looks like a serious premium creator workstation.
- The Image Studio is attractive and usable.
- Provider/model/key status is visible.
- Queue state is clear.
- Receipts are readable.
- Empty states are polished.
- Placeholders are honest.

## Security acceptance

- No raw key in job.
- No raw key in receipt.
- Browser-dev key warning exists.
- Credential refs are used.
- Mock provider requires no key.

## Product acceptance

- No claim that MVP supplies hosted compute.
- No fake provider integration.
- BYOK remains internal as KeyRail.
- The architecture supports future compute adapters without rewriting UI.
