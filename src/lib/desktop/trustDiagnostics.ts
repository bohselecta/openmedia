export type AppStorageMode = "web-indexeddb" | "desktop-sqlite-kv";

export function getAppStorageMode(): AppStorageMode {
  if (
    typeof window !== "undefined" &&
    window.omfDesktop?.enabled &&
    typeof window.omfDesktop.kvGet === "function"
  ) {
    return "desktop-sqlite-kv";
  }
  return "web-indexeddb";
}

export type KeyStoragePosture =
  | "browser-dev-vault"
  | "desktop-keychain"
  | "mixed"
  | "none";

export function inferKeyStoragePosture(
  credentials: Array<{ storageMode: string }>,
): KeyStoragePosture {
  const hasDev = credentials.some((c) => c.storageMode === "browser-dev");
  const hasKc = credentials.some((c) => c.storageMode === "desktop-keychain");
  if (hasDev && hasKc) return "mixed";
  if (hasKc) return "desktop-keychain";
  if (hasDev) return "browser-dev-vault";
  return "none";
}

export function describeAppMode(input: {
  hasBridge: boolean;
  packaged: boolean;
  nextDevServer: boolean;
}): string {
  if (!input.hasBridge) return "web";
  if (input.packaged) return "desktop packaged";
  if (input.nextDevServer) return "desktop dev";
  return "desktop local (production Next)";
}

export function describeKeyModeSurface(input: {
  hasBridge: boolean;
  keytarModuleLoaded: boolean;
  posture: KeyStoragePosture;
}): string {
  if (!input.hasBridge) {
    return "browser-dev (KeyRail dev vault only on web)";
  }
  if (!input.keytarModuleLoaded) {
    return "unavailable (keytar not loaded — OS keychain path disabled)";
  }
  if (input.posture === "desktop-keychain") return "desktop-keychain";
  if (input.posture === "browser-dev-vault") return "browser-dev";
  if (input.posture === "mixed") return "mixed (browser-dev + desktop-keychain refs)";
  return "none stored (mock lane needs no secrets)";
}
