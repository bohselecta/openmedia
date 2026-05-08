import { storageCredentials } from "@/lib/storage/storage";

/**
 * Browser-dev vault: secrets live here only, addressed by credential id.
 * Never serialize vault payloads into jobs or receipts.
 */
export async function saveDevSecret(credentialId: string, rawSecret: string) {
  await storageCredentials.setItem(`vault:${credentialId}`, rawSecret);
}

export async function loadDevSecret(
  credentialId: string,
): Promise<string | null> {
  const v = await storageCredentials.getItem<string>(`vault:${credentialId}`);
  return v ?? null;
}

export async function wipeDevSecret(credentialId: string) {
  await storageCredentials.removeItem(`vault:${credentialId}`);
}
