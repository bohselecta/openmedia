import type {
  GenerationProvider,
  JobHandle,
  JobStatus,
  ValidationResult,
} from "@/lib/providers/types";

export function placeholderProvider(
  id: string,
  name: string,
  kind: GenerationProvider["kind"],
): GenerationProvider {
  return {
    id,
    name,
    kind,
    capabilities: [],
    listModels: async () => [],
    validate: async (): Promise<ValidationResult> => ({
      ok: false,
      errors: [
        `${name} is not wired in MVP — honest placeholder. No remote calls are made.`,
      ],
      warnings: [],
    }),
    submit: async (): Promise<JobHandle> => {
      throw new Error(
        `${name} is a placeholder adapter. Connect a real adapter later.`,
      );
    },
    poll: async (): Promise<JobStatus> => {
      throw new Error(
        `${name} is a placeholder adapter. Connect a real adapter later.`,
      );
    },
    cancel: async () => {},
  };
}
