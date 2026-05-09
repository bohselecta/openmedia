export interface OmfZipEntry {
  absPath: string;
  arcName: string;
}

export interface OmfDesktopBridge {
  readonly enabled: boolean;
  platform: string;

  kvGet(store: string, key: string): Promise<string | null>;
  kvSet(store: string, key: string, value: string): Promise<void>;
  kvRemove(store: string, key: string): Promise<void>;
  kvClearStore(store: string): Promise<void>;

  workspaceGet(): Promise<string | null>;
  workspaceSet(dirPath: string | null): Promise<string | null>;
  workspacePick(): Promise<string | null>;

  shellOpenPath(targetPath: string): Promise<{ ok: boolean; error?: string }>;
  shellReveal(targetPath: string): Promise<{ ok: boolean; error?: string }>;

  pickMediaFiles(): Promise<string[]>;
  copyFilesIntoDir(
    files: string[],
    dir: string,
  ): Promise<{ copied: string[] }>;
  writeBufferFile(absPath: string, base64: string): Promise<{ ok: boolean }>;
  /** UTF-8 text (preferred for JSON packets). */
  writeTextFile(absPath: string, utf8: string): Promise<{ ok: boolean }>;

  exportZip(
    entries: OmfZipEntry[],
    destAbsPath: string,
  ): Promise<{ ok: boolean }>;

  keychainSet(account: string, secret: string): Promise<void>;
  keychainGet(account: string): Promise<string | null>;
  keychainDelete(account: string): Promise<boolean>;

  ensureDir(absPath: string): Promise<{ ok: boolean }>;
  joinPath(...parts: string[]): Promise<string>;

  defaultComfyBaseUrl(): Promise<string>;

  /** Main-process runtime (packaging, version, keytar load). */
  getRuntimeInfo(): Promise<{
    packaged: boolean;
    nextDevServer: boolean;
    appVersion: string;
    platform: string;
    keytarModuleLoaded: boolean;
    nextPort: number | null;
  }>;
}

declare global {
  interface Window {
    omfDesktop?: OmfDesktopBridge;
  }
}

export {};
