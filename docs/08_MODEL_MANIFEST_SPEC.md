# 08 — Model Manifest Spec

## Purpose

Model manifests make models inspectable, editable, and community-maintainable without changing UI code.

## Manifest fields

```ts
type ModelManifest = {
  id: string
  providerId: string
  name: string
  task: MediaTask
  description?: string
  version?: string
  license?: string
  inputSchema: Record<string, unknown>
  outputSchema: Record<string, unknown>
  estimatedCost?: CostEstimate
  hardwareRequirements?: HardwareRequirements
  tags: string[]
}
```

## Example

```json
{
  "id": "mock-image-v1",
  "providerId": "mock",
  "name": "Mock Image v1",
  "task": "text-to-image",
  "description": "Zero-cost local demo model that returns placeholder image assets.",
  "version": "1.0.0",
  "license": "demo-only",
  "inputSchema": {
    "prompt": { "type": "string", "required": true },
    "aspectRatio": { "type": "string", "default": "1:1" }
  },
  "outputSchema": {
    "image": { "type": "asset", "kind": "image" }
  },
  "estimatedCost": { "amount": 0, "currency": "USD", "unit": "job" },
  "tags": ["mock", "demo", "image"]
}
```

## UI behavior

The model picker reads manifests and renders:

- name
- provider
- task
- cost estimate
- required inputs
- tags
- local/remote/mock badge

## Validation

Use Zod or JSON Schema. Invalid manifests should not crash the app. Show a readable error in Providers/Models.

## Future

Manifests can be loaded from:

- bundled sample manifests
- user-imported JSON
- provider adapter list
- community registry
- local model folders
