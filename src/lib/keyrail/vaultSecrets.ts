import { loadDevSecret } from "@/lib/keyrail/browserDevVault";
import { loadKeychainSecret } from "@/lib/keyrail/desktopKeychainVault";
import { useCredentialStore } from "@/lib/keyrail/credentialStore";

/**
 * Resolve a raw secret for adapter use — browser-dev vault or desktop keychain only.
 */
export async function loadVaultSecretForCredentialRef(
  credentialRef: string,
): Promise<string | null> {
  const cred = useCredentialStore
    .getState()
    .credentials.find((c) => c.id === credentialRef);
  if (cred?.storageMode === "desktop-keychain") {
    return loadKeychainSecret(credentialRef);
  }
  return loadDevSecret(credentialRef);
}
