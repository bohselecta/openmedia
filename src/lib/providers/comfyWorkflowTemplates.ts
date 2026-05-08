import type {
  ComfyWorkflowTemplate,
  MediaTask,
} from "@/lib/providers/types";

export function parseWorkflowJson(workflowJson: string): {
  ok: boolean;
  error?: string;
  graph?: Record<string, unknown>;
} {
  try {
    const g = JSON.parse(workflowJson) as unknown;
    if (!g || typeof g !== "object" || Array.isArray(g)) {
      return { ok: false, error: "Workflow must be a JSON object (Comfy API format)." };
    }
    return { ok: true, graph: g as Record<string, unknown> };
  } catch {
    return { ok: false, error: "Invalid workflow JSON." };
  }
}

function nodeExists(graph: Record<string, unknown>, nodeId: string): boolean {
  return Object.prototype.hasOwnProperty.call(graph, nodeId);
}

function checkPathRoot(graph: Record<string, unknown>, path: string): boolean {
  const root = path.split(".")[0];
  if (!root) return false;
  return nodeExists(graph, root);
}

/**
 * Validates template metadata against a workflow graph.
 * Does not guarantee runtime Comfy success — only structural checks.
 */
export function validateComfyTemplate(
  tpl: ComfyWorkflowTemplate,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const parsed = parseWorkflowJson(tpl.workflowJson);
  if (!parsed.ok || !parsed.graph) {
    errors.push(parsed.error ?? "Invalid workflow.");
    return { ok: false, errors };
  }
  const graph = parsed.graph;
  for (const id of tpl.outputNodeIds) {
    if (!nodeExists(graph, id)) {
      errors.push(`outputNodeIds: node "${id}" not found in workflow.`);
    }
  }
  const paths: Array<[string | undefined, string]> = [
    [tpl.promptPath, "promptPath"],
    [tpl.negativePromptPath, "negativePromptPath"],
    [tpl.seedPath, "seedPath"],
    [tpl.widthPath, "widthPath"],
    [tpl.heightPath, "heightPath"],
    [tpl.imageInputPath, "imageInputPath"],
  ];
  for (const [p, label] of paths) {
    if (!p) continue;
    if (!checkPathRoot(graph, p)) {
      errors.push(`${label} root node missing in workflow (${p}).`);
    }
  }
  for (const req of tpl.requiredInputs) {
    if (req === "prompt" && !tpl.promptPath) {
      errors.push("promptPath required when prompt is marked required.");
    }
    if (req === "negativePrompt" && !tpl.negativePromptPath) {
      errors.push("negativePromptPath required when negativePrompt is marked required.");
    }
    if (req === "seed" && !tpl.seedPath) {
      errors.push("seedPath required when seed is marked required.");
    }
    if ((req === "width" || req === "height") && (!tpl.widthPath || !tpl.heightPath)) {
      errors.push("widthPath and heightPath required when dimensions are required.");
    }
    if (req === "image" && !tpl.imageInputPath) {
      errors.push("imageInputPath required when image is marked required.");
    }
  }
  return { ok: errors.length === 0, errors };
}

export function defaultReferenceBudgetForComfyTask(
  task: MediaTask,
): { maxReferences: number; requiresPrimaryReference?: boolean } {
  if (task === "image-to-image") {
    return { maxReferences: 1, requiresPrimaryReference: true };
  }
  return { maxReferences: 0, requiresPrimaryReference: false };
}

export function newTemplateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `tpl-${Date.now()}`;
}

export function modelIdForComfyTemplate(templateId: string) {
  return `comfy:${templateId}`;
}

export function parseComfyModelId(modelId: string): string | null {
  if (!modelId.startsWith("comfy:")) return null;
  return modelId.slice("comfy:".length);
}
