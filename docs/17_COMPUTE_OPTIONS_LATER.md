# 17 — Compute Options Later

## Principle

Do not build compute before the studio is strong. The studio must make provider choice modular.

## Compute lanes

### Lane 1 — Mock

Used for development, demos, tests, and onboarding.

### Lane 2 — Local

- ComfyUI
- sd.cpp
- Wan2GP
- local workers
- desktop app with local paths

Best for trust and open-source legitimacy.

### Lane 3 — BYOK remote

- OpenAI
- Google
- Replicate
- Fal
- RunPod
- Modal
- Hugging Face
- custom HTTP

Best for users who already pay providers.

### Lane 4 — Self-hosted GPU endpoint

User deploys own worker and points OpenMediaForge at it.

### Lane 5 — Hosted pooled compute

Only after product demand is proven. This becomes business model, not architecture dependency.

## Evaluation criteria

For each provider:

- task support
- API quality
- polling/webhook model
- upload requirements
- output hosting
- cost predictability
- rate limits
- policy limits
- data retention
- BYOK compatibility
- local mirror support

## Rule

No compute lane may break provider neutrality.
