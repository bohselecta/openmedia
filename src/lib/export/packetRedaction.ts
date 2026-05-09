import type { GenerationJob } from "@/lib/jobs/jobTypes";
import type { ProviderConfig } from "@/lib/providers/types";
import type { ProviderRunLogEntry } from "@/lib/providers/providerRunLog";

const SETTINGS_DENY = new Set([
  "authorization",
  "bearer",
  "apikey",
  "x-api-key",
  "cookie",
]);

function scrubMessage(msg: string): string {
  return msg
    .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\bToken\s+[a-z0-9._-]{8,}/gi, "Token [redacted]")
    .replace(/\bsk-[a-z0-9]{8,}/gi, "sk-[redacted]");
}

export function redactJobSettingsForExport(
  settings: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(settings)) {
    const kl = k.toLowerCase();
    if (
      SETTINGS_DENY.has(kl) ||
      kl.includes("secret") ||
      kl.includes("password") ||
      kl.endsWith("token")
    ) {
      out[k] = "[redacted]";
      continue;
    }
    out[k] = v;
  }
  return out;
}

export function redactJobForExport(job: GenerationJob): GenerationJob {
  return {
    ...job,
    settings: redactJobSettingsForExport({ ...job.settings }),
    error: job.error ? scrubMessage(job.error) : job.error,
  };
}

export function summarizeProviderActivityForProject(
  entries: ProviderRunLogEntry[],
  projectId: string,
): ProviderRunLogEntry[] {
  return entries
    .filter((e) => e.projectId === projectId)
    .map((e) => ({
      ...e,
      errorMessage: e.errorMessage ? scrubMessage(e.errorMessage) : e.errorMessage,
    }));
}

export type RedactedProviderConfigSnapshot = Pick<
  ProviderConfig,
  | "id"
  | "providerId"
  | "label"
  | "kind"
  | "baseUrl"
  | "authMode"
  | "enabled"
  | "createdAt"
  | "updatedAt"
> & {
  credentialRef?: string;
  genericHttp?: ProviderConfig["genericHttp"];
  comfy?: {
    timeoutMs: number;
    pollIntervalMs: number;
    maxPollAttempts: number;
    templates: Array<{
      id: string;
      label: string;
      task: string;
      workflowOmitted: true;
      requiredInputs: string[];
      outputNodeIds: string[];
    }>;
  };
};

export function redactProviderConfigsForExport(
  configs: ProviderConfig[],
): RedactedProviderConfigSnapshot[] {
  return configs.map((cfg) => ({
    id: cfg.id,
    providerId: cfg.providerId,
    label: cfg.label,
    kind: cfg.kind,
    baseUrl: cfg.baseUrl,
    authMode: cfg.authMode,
    enabled: cfg.enabled,
    createdAt: cfg.createdAt,
    updatedAt: cfg.updatedAt,
    credentialRef: cfg.credentialRef,
    genericHttp: cfg.genericHttp,
    comfy: cfg.comfy ?
      {
        timeoutMs: cfg.comfy.timeoutMs,
        pollIntervalMs: cfg.comfy.pollIntervalMs,
        maxPollAttempts: cfg.comfy.maxPollAttempts,
        templates: cfg.comfy.templates.map((t) => ({
          id: t.id,
          label: t.label,
          task: t.task,
          workflowOmitted: true as const,
          requiredInputs: [...t.requiredInputs],
          outputNodeIds: [...t.outputNodeIds],
        })),
      }
    : undefined,
  }));
}
