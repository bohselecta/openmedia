import type { CredentialUseEvent } from "@/lib/keyrail/types";
import { storageAudit } from "@/lib/storage/storage";

export async function appendAuditEvent(event: CredentialUseEvent) {
  const key = "events";
  const prev =
    (await storageAudit.getItem<CredentialUseEvent[]>(key)) ?? ([] as CredentialUseEvent[]);
  await storageAudit.setItem(key, [...prev, event]);
}

export async function listAuditEvents(): Promise<CredentialUseEvent[]> {
  return (await storageAudit.getItem<CredentialUseEvent[]>("events")) ?? [];
}
