/** OS keychain backing for desktop builds — never serialize payloads into jobs/receipts. */

export async function saveKeychainSecret(
  credentialId: string,
  rawSecret: string,
): Promise<void> {
  const d = typeof window !== "undefined" ? window.omfDesktop : undefined;
  if (!d?.keychainSet) {
    throw new Error("Desktop keychain is not available in this runtime.");
  }
  await d.keychainSet(`omf-cred-${credentialId}`, rawSecret);
}

export async function loadKeychainSecret(
  credentialId: string,
): Promise<string | null> {
  const d = typeof window !== "undefined" ? window.omfDesktop : undefined;
  if (!d?.keychainGet) return null;
  return (await d.keychainGet(`omf-cred-${credentialId}`)) ?? null;
}

export async function wipeKeychainSecret(credentialId: string): Promise<void> {
  const d = typeof window !== "undefined" ? window.omfDesktop : undefined;
  await d?.keychainDelete?.(`omf-cred-${credentialId}`);
}
