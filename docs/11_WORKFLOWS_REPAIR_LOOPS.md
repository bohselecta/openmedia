# 11 — Workflows and Repair Loops

## Workflow philosophy

Workflows are not required for the first mock generation, but the data model must prepare for them.

A workflow is a graph of generation and transformation steps:

- prompt → image
- image → variation
- image → video
- video → upscale
- video → lip sync
- output → receipt/export

## Workflow MVP

MVP page can be a polished placeholder with:

- "Workflow graph coming next"
- visible node cards
- explanation of adapter-based execution
- no fake run buttons

## Future workflow node

```ts
type WorkflowNode = {
  id: string
  workflowId: string
  type: "input" | "generation" | "transform" | "review" | "export"
  providerId?: string
  modelId?: string
  task?: MediaTask
  inputRefs: string[]
  outputRefs: string[]
  settings: Record<string, unknown>
}
```

## Repair loops

Repair prompts are production tools. They should help users fix bad outputs without restarting the whole project.

Repair types:

- Fix asset mismatch
- Reduce identity drift
- Simplify overloaded prompt
- Clarify camera path
- Improve first frame
- Improve last frame
- Match reference priority
- Remove rights-risk asset
- Increase realism
- Make motion more literal
- Re-run with cheaper provider
- Re-run with higher-quality provider

## MVP repair behavior

MVP should include repair prompt templates as UI copy but does not need real prompt compilation.

Completed mock job card can show:

- Branch variation
- Repair prompt
- Re-run

If not implemented, mark disabled with "coming after MVP".
