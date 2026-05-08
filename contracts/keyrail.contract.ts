import type { CredentialRef, ExecutionTicket, GenerationRequest, MediaTask } from "./provider-adapter.contract";

export type CreateCredentialInput = {
  providerId: string;
  label: string;
  rawSecret?: string;
  storageMode: CredentialRef["storageMode"];
  scopes: MediaTask[];
  dailyLimitUsd?: number;
  perJobLimitUsd?: number;
  maxConcurrentJobs?: number;
};

export type CredentialTestResult = {
  ok: boolean;
  message: string;
  providerId: string;
  credentialRef: string;
};

export type CreateExecutionTicketInput = {
  request: GenerationRequest;
  credentialRef?: string;
  estimatedCost?: number;
  maxCost?: number;
  approval?: "auto" | "ask" | "blocked";
  networkDestinations?: string[];
};

export type ResolvedSecretHandle = {
  ticketId: string;
  providerId: string;
  credentialRef?: string;
  // Implementation-specific. Do not serialize into jobs/receipts.
  secretHandle: string;
};

export type CredentialUseEvent = {
  id: string;
  providerId: string;
  credentialRef?: string;
  ticketId: string;
  task: MediaTask;
  modelId: string;
  estimatedCost?: number;
  networkDestinations: string[];
  createdAt: string;
};

export interface KeyRail {
  listCredentials(providerId?: string): Promise<CredentialRef[]>;
  createCredential(input: CreateCredentialInput): Promise<CredentialRef>;
  testCredential(credentialRef: string): Promise<CredentialTestResult>;
  revokeCredential(credentialRef: string): Promise<void>;
  createExecutionTicket(input: CreateExecutionTicketInput): Promise<ExecutionTicket>;
  resolveForServerUse(ticket: ExecutionTicket): Promise<ResolvedSecretHandle>;
  logUse(event: CredentialUseEvent): Promise<void>;
}
