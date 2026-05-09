import type {
  CreateCredentialInput,
  CredentialTestResult,
  CredentialUseEvent,
  KeyRail,
  ResolvedSecretHandle,
} from "@/lib/keyrail/types";
import { appendAuditEvent } from "@/lib/keyrail/auditLog";
import {
  saveDevSecret,
  wipeDevSecret,
} from "@/lib/keyrail/browserDevVault";
import {
  saveKeychainSecret,
  wipeKeychainSecret,
} from "@/lib/keyrail/desktopKeychainVault";
import { loadVaultSecretForCredentialRef } from "@/lib/keyrail/vaultSecrets";
import { useCredentialStore } from "@/lib/keyrail/credentialStore";
import { mintExecutionTicket } from "@/lib/keyrail/executionTickets";
import type {
  CredentialRef,
  ExecutionTicket,
  GenerationRequest,
  MediaTask,
} from "@/lib/providers/types";

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `cred-${Date.now()}`;
}

function preview(label: string) {
  return `${label.slice(0, 2)}••••`;
}

export const omfKeyRail: KeyRail = {
  listCredentials: async (providerId?: string) => {
    const all = useCredentialStore.getState().credentials;
    return providerId
      ? all.filter((c) => c.providerId === providerId)
      : [...all];
  },

  createCredential: async (input: CreateCredentialInput) => {
    const id = newId();
    const ref: CredentialRef = {
      id,
      providerId: input.providerId,
      label: input.label,
      storageMode: input.storageMode,
      scopes: input.scopes,
      status: "connected",
      redactedPreview: preview(input.label),
      dailyLimitUsd: input.dailyLimitUsd,
      perJobLimitUsd: input.perJobLimitUsd,
      maxConcurrentJobs: input.maxConcurrentJobs,
      createdAt: new Date().toISOString(),
    };
    if (input.rawSecret && input.storageMode === "browser-dev") {
      await saveDevSecret(id, input.rawSecret);
    }
    if (input.rawSecret && input.storageMode === "desktop-keychain") {
      await saveKeychainSecret(id, input.rawSecret);
    }
    useCredentialStore.getState().upsertCredential(ref);
    return ref;
  },

  testCredential: async (
    credentialRef: string,
  ): Promise<CredentialTestResult> => {
    const cred = useCredentialStore
      .getState()
      .credentials.find((c) => c.id === credentialRef);
    if (!cred) {
      return {
        ok: false,
        message: "Credential not found.",
        providerId: "unknown",
        credentialRef,
      };
    }
    return {
      ok: true,
      message:
        cred.providerId === "mock"
          ? "Mock provider ignores secrets."
          : "Placeholder — connectivity check not implemented.",
      providerId: cred.providerId,
      credentialRef,
    };
  },

  revokeCredential: async (credentialRef: string) => {
    const cred = useCredentialStore
      .getState()
      .credentials.find((c) => c.id === credentialRef);
    useCredentialStore.getState().removeCredential(credentialRef);
    if (cred?.storageMode === "browser-dev") {
      await wipeDevSecret(credentialRef);
    }
    if (cred?.storageMode === "desktop-keychain") {
      await wipeKeychainSecret(credentialRef);
    }
  },

  createExecutionTicket: async (input) => mintExecutionTicket(input),

  resolveForServerUse: async (
    ticket: ExecutionTicket,
  ): Promise<ResolvedSecretHandle> => {
    if (!ticket.credentialRef) {
      return {
        ticketId: ticket.id,
        providerId: ticket.providerId,
        credentialRef: undefined,
        secretHandle: "none",
      };
    }
    const secret = await loadVaultSecretForCredentialRef(
      ticket.credentialRef,
    );
    return {
      ticketId: ticket.id,
      providerId: ticket.providerId,
      credentialRef: ticket.credentialRef,
      secretHandle: secret ? `dev:${ticket.credentialRef}` : "missing",
    };
  },

  logUse: async (event: CredentialUseEvent) => {
    await appendAuditEvent(event);
    if (event.credentialRef) {
      const cred = useCredentialStore
        .getState()
        .credentials.find((c) => c.id === event.credentialRef);
      if (cred) {
        useCredentialStore.getState().upsertCredential({
          ...cred,
          lastUsedAt: event.createdAt,
        });
      }
    }
  },
};

export function credentialAllowsTask(
  cred: CredentialRef | undefined,
  task: MediaTask,
): boolean {
  if (!cred) return true;
  return cred.scopes.length === 0 || cred.scopes.includes(task);
}

export function normalizeGenerationRequest(
  partial: GenerationRequest,
): GenerationRequest {
  return {
    ...partial,
    settings: partial.settings ?? {},
    inputAssetIds: partial.inputAssetIds ?? [],
    referenceSelections: partial.referenceSelections ?? [],
    outputPolicy: partial.outputPolicy ?? "local-only",
  };
}
