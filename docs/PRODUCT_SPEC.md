# 01 — Product Spec

## One-liner

Plan, generate, repair, and prove AI media work across your own models, keys, and providers.

## Phase 2 — GUI direction (active build)

- Founder-grade dark workstation: deep graphite surfaces, glass panels, one disciplined accent (cyan/lime system), cinematic previews, compact metadata.
- **Projects are center gravity**: active project drives submissions, workspace routes (`/projects/[id]`), stats, and receipts association.
- **Asset Map v1 + Reference Budget v1** explain labeled handles (`@HeroFace`), roles, manifest caps, and warning states — honest UI over fake engines.
- Mock lane stays visibly labeled; providers page sells adapter architecture without implying unwired execution.
- KeyRail stays **inside** the app as the trusted access layer (spinout remains optional later).

## Phase 3 — Reference execution + project packets (active build)

- **ReferenceSelection** is first-class: asset id, `@handle`, role, preservation tier, optional note — carried on `GenerationRequest`, jobs, receipts, and execution tickets (metadata only).
- Image Studio persists per-project drafts, validates references against manifests, and blocks hard errors before submit while surfacing warnings.
- Asset Map exposes reference tiers plus **Use as reference** deep links into Image Studio; shot planner can bootstrap the studio with prompts + handles.
- Project workspace exports **project packet JSON** (metadata-only warning included); receipts page can export the full ledger.

## Expanded line

OpenMediaForge is a local-first AI media command desk for creators who need one place to manage prompts, reference assets, provider runs, key access, generation jobs, repair loops, and receipts.

## Core workflow

1. **Create a project**
   - name, type, output intent, format, platform target

2. **Collect references**
   - images, video clips, audio, text notes, style boards, character/performer references

3. **Build an asset map**
   - label every reference with stable names like `@LeadIdentity`, `@MainLocation`, `@CameraMotionRef`
   - set role, priority, rights status, and usage rules

4. **Choose a target**
   - image, video, edit/upscale, lip sync, storyboard, workflow

5. **Choose a provider/model**
   - mock provider in MVP
   - local/provider/BYOK adapters later

6. **Run a job**
   - every request enters queue
   - progress is visible
   - logs are readable

7. **Review result**
   - output becomes an asset
   - job becomes a receipt

8. **Repair or branch**
   - create variation, fix drift, re-run selected part, simplify prompt, change provider

9. **Export project packet**
   - assets, prompts, job receipts, rights log, provider/model metadata, manifest JSON

## Primary personas

### Creator-artist

Makes AI video, social content, music visuals, and images. Wants taste, speed, control, and visual continuity.

Needs:
- beautiful studio
- fast prompt-to-result loop
- reference handling
- project history
- quick export

### Power user / local model operator

Runs ComfyUI, Wan2GP, sd.cpp, or custom endpoints.

Needs:
- adapters
- local paths
- model manifests
- logs
- deterministic queues

### Agency / small studio

Produces repeatable content for brands, creators, and campaigns.

Needs:
- receipts
- cost logs
- rights fields
- project packets
- reproducible runs

### Experimental musician / video artist

Uses songs, stage concepts, character references, and clip chains.

Needs:
- storyboard
- timeline/shot cards
- audio/video references
- repair prompts
- export to editor

## MVP scope

### In scope

- Landing page
- Premium app shell
- Project creation
- Asset library
- Asset map and reference budget
- Provider registry
- Mock provider
- Model manifests
- Image Studio end-to-end
- Job queue
- Receipts
- KeyRail UI shell
- Honest provider placeholders
- Verification script

### Out of scope for MVP

- Real hosted compute supplied by OpenMediaForge
- Marketplace
- Multi-user collaboration
- OAuth production vault
- Desktop keychain production implementation
- Final video editing timeline
- Automatic publishing
- Native mobile app

## Product law

- The app never pretends to provide compute it does not provide.
- The app can function as a planning/queue/receipt studio without cloud accounts.
- Every provider integration is explicit and swappable.
- Every provider call is visible to the user.
- BYOK exists inside the app as KeyRail until it is worth spinning out.

## Differentiators

1. **Provider-neutral architecture** — not locked to one API.
2. **Reference Budget** — makes multimodal references manageable.
3. **Generation Receipts** — trust, repeatability, cost tracking, and provenance.
4. **KeyRail** — BYOK with authority, limits, and revocation.
5. **Repair loops** — production-oriented iteration, not one-shot prompting.
6. **Project packets** — assets and metadata survive outside the app.

## Success metric for v1

A first-time user can complete the mock demo flow in under 5 minutes and understand the product promise without external explanation.

A power user can inspect the code and see exactly where providers, keys, jobs, receipts, and manifests plug in.
