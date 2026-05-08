# AGENTS.md — OpenMediaForge Build Rules

## Mission

Build a serious creator-grade AI media command desk. The app should feel like a professional creative workstation, not a thin API wrapper or a prompt toy.

## Architectural hierarchy

1. Contracts in `contracts/` are the machine-readable source of truth.
2. Docs in `docs/` define behavior, UX, and product law.
3. Implementation must satisfy both.
4. Verifier scripts decide whether the build can be called done.

## Product law

- Studio first.
- BYOK second as KeyRail.
- Spinout later only after the app proves the need.
- Provider-neutral always.
- Local-first posture always.
- Mock provider must work without keys.
- Cloud/provider integrations must be honest.
- No fake buttons that imply live compute.
- No hidden remote calls.
- No single-vendor hardcoding.
- Every generation creates a job and a receipt.
- Every provider interaction must have a visible provider identity.

## GUI standard

The GUI must be visually sharp enough for influencer creators and video artists. It should combine:

- creator dashboard clarity
- music/video workstation density
- cinematic black surfaces
- high-end typography
- reference-board tactility
- timeline/progress energy
- rich asset cards
- crisp key/provider trust badges

Avoid generic SaaS dashboards, childish AI gradients, mascot branding, or crypto-ish clutter.

## Security posture

KeyRail is not an afterthought. Any BYOK surface must be designed as a trusted access layer:

- raw keys never appear in jobs or receipts
- raw keys are not shown after save
- credential refs are used in app records
- execution tickets mediate provider runs
- credential use is auditable
- browser-dev vault is explicitly labeled as temporary

## Cursor behavior

Build incrementally. Run verification after meaningful milestones. Fix type and build failures before adding scope.

Do not claim done until the acceptance criteria pass.
