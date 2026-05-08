import type { CreateExecutionTicketInput } from "@/lib/keyrail/types";
import type {
  ExecutionTicket,
  GenerationRequest,
} from "@/lib/providers/types";

function newTicketId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `ticket-${Date.now()}`;
}

export function mintExecutionTicket(
  input: CreateExecutionTicketInput,
): ExecutionTicket {
  const r = input.request;
  const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
  return {
    id: newTicketId(),
    providerId: r.providerId,
    credentialRef: input.credentialRef,
    task: r.task,
    modelId: r.modelId,
    projectId: r.projectId,
    estimatedCost: input.estimatedCost,
    maxCost: input.maxCost,
    inputAssetIds: [...r.inputAssetIds],
    referenceSelections: [...(r.referenceSelections ?? [])],
    outputPolicy: r.outputPolicy,
    approval: input.approval ?? "auto",
    networkDestinations: input.networkDestinations ?? [],
    expiresAt,
  };
}

export function requestFromTicketBase(
  ticket: ExecutionTicket,
  extras: Pick<
    GenerationRequest,
    "prompt" | "negativePrompt" | "settings"
  > &
    Partial<GenerationRequest>,
): GenerationRequest {
  return {
    projectId: ticket.projectId,
    providerId: ticket.providerId,
    modelId: ticket.modelId,
    task: ticket.task,
    prompt: extras.prompt,
    negativePrompt: extras.negativePrompt,
    settings: extras.settings ?? {},
    inputAssetIds: [...ticket.inputAssetIds],
    referenceSelections: [...(extras.referenceSelections ?? ticket.referenceSelections ?? [])],
    targetProfile: extras.targetProfile,
    outputPolicy: ticket.outputPolicy,
  };
}
