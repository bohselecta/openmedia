import type {
  ExecutionTicket,
  GenerationProvider,
  GenerationRequest,
  JobHandle,
  JobStatus,
  ModelManifest,
  ReferenceSelection,
  ValidationResult,
} from "@/lib/providers/types";

const MOCK_SVG = (label: string) => {
  const safe = label.replace(/[<>&"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#16171a"/><stop offset="100%" stop-color="#070708"/></linearGradient></defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <rect x="24" y="24" width="464" height="464" rx="28" fill="none" stroke="rgba(200,255,95,0.35)" stroke-width="2"/>
  <text x="256" y="236" text-anchor="middle" fill="#7dd7ff" font-family="Inter,system-ui,sans-serif" font-size="22" font-weight="700">OpenMediaForge</text>
  <text x="256" y="278" text-anchor="middle" fill="#c8ff5f" font-family="Inter,system-ui,sans-serif" font-size="16">Mock output</text>
  <text x="256" y="318" text-anchor="middle" fill="rgba(244,241,234,0.55)" font-family="Inter,system-ui,sans-serif" font-size="13">${safe.slice(0, 120)}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

type MockJob = {
  progress: number;
  phase: "queued" | "running" | "done" | "failed";
  prompt?: string;
  referenceSelections?: ReferenceSelection[];
};

const mockRuntime = new Map<string, MockJob>();

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const mockProvider: GenerationProvider = {
  id: "mock",
  name: "Mock Provider",
  kind: "mock",
  capabilities: ["text-to-image", "image-to-image"],
  listModels: async (): Promise<ModelManifest[]> => {
    const { SAMPLE_MANIFESTS } = await import("@/lib/models/sampleManifests");
    return SAMPLE_MANIFESTS.filter((m) => m.providerId === "mock");
  },
  validate: async (request: GenerationRequest): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (request.providerId !== "mock") {
      errors.push("Mock provider mismatch.");
    }
    if (
      request.modelId !== "mock-image-v1" &&
      request.modelId !== "mock-image-i2i-v1"
    ) {
      errors.push("Unknown mock model.");
    }
    if (!request.prompt?.trim()) {
      errors.push("Prompt is required.");
    }
    if (request.modelId === "mock-image-v1" && request.task !== "text-to-image") {
      errors.push("mock-image-v1 only accepts text-to-image.");
    }
    if (request.modelId === "mock-image-i2i-v1" && request.task !== "image-to-image") {
      errors.push("mock-image-i2i-v1 only accepts image-to-image.");
    }

    const { SAMPLE_MANIFESTS } = await import("@/lib/models/sampleManifests");
    const manifest = SAMPLE_MANIFESTS.find((m) => m.id === request.modelId);
    const maxRefs = manifest?.referenceBudget?.maxReferences ?? 8;
    const refCount = request.referenceSelections?.length ?? 0;
    if (refCount > maxRefs) {
      warnings.push(`Reference count exceeds manifest budget (${refCount} > ${maxRefs}).`);
    }

    if (request.modelId === "mock-image-i2i-v1") {
      const inputs =
        request.inputAssetIds?.length ?? request.referenceSelections?.length ?? 0;
      if (inputs === 0) {
        errors.push("Image-to-image mock job requires at least one input reference.");
      }
    }

    return { ok: errors.length === 0, errors, warnings };
  },
  submit: async (
    request: GenerationRequest,
    ticket: ExecutionTicket,
  ): Promise<JobHandle> => {
    void ticket;
    const id = newId();
    mockRuntime.set(id, {
      progress: 8,
      phase: "running",
      prompt: request.prompt,
      referenceSelections: [...(request.referenceSelections ?? [])],
    });
    return { providerJobId: id, status: "running" };
  },
  poll: async (
    jobId: string,
    ticket: ExecutionTicket,
  ): Promise<JobStatus> => {
    void ticket;
    const row = mockRuntime.get(jobId);
    if (!row) {
      return {
        providerJobId: jobId,
        status: "failed",
        progress: 0,
        error: "Unknown mock job.",
      };
    }
    if (row.phase === "failed") {
      return {
        providerJobId: jobId,
        status: "failed",
        progress: row.progress,
        error: "Canceled or failed.",
      };
    }
    if (row.phase === "done") {
      const uri = MOCK_SVG(row.prompt ?? "");
      const refHint =
        row.referenceSelections?.length ?
          ` · refs:${row.referenceSelections.length}`
          : "";
      return {
        providerJobId: jobId,
        status: "completed",
        progress: 100,
        outputAssets: [
          {
            kind: "image",
            uri,
            mimeType: "image/svg+xml",
            label: `Mock frame${refHint}`,
          },
        ],
      };
    }
    row.progress = Math.min(100, row.progress + 22);
    if (row.progress >= 100) {
      row.phase = "done";
    }
    const doneNow = row.phase === "done";
    return {
      providerJobId: jobId,
      status: doneNow ? "completed" : "running",
      progress: row.progress,
      outputAssets: doneNow
        ? [
            {
              kind: "image",
              uri: MOCK_SVG(row.prompt ?? ""),
              mimeType: "image/svg+xml",
              label: row.referenceSelections?.length
                ? `Mock frame · refs:${row.referenceSelections.length}`
                : "Mock frame",
            },
          ]
        : undefined,
    };
  },
  cancel: async (jobId: string, ticket: ExecutionTicket) => {
    void ticket;
    const row = mockRuntime.get(jobId);
    if (row) {
      row.phase = "failed";
      row.progress = 0;
    }
  },
};

export function resetMockRuntimeForTests() {
  mockRuntime.clear();
}
