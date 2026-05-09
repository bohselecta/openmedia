const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("omfDesktop", {
  enabled: true,
  platform: process.platform,

  kvGet: (store, key) => ipcRenderer.invoke("omf:kv-get", store, key),
  kvSet: (store, key, value) => ipcRenderer.invoke("omf:kv-set", store, key, value),
  kvRemove: (store, key) => ipcRenderer.invoke("omf:kv-remove", store, key),
  kvClearStore: (store) => ipcRenderer.invoke("omf:kv-clear-store", store),

  workspaceGet: () => ipcRenderer.invoke("omf:workspace-get"),
  workspaceSet: (dirPath) => ipcRenderer.invoke("omf:workspace-set", dirPath),
  workspacePick: () => ipcRenderer.invoke("omf:workspace-pick"),

  shellOpenPath: (targetPath) =>
    ipcRenderer.invoke("omf:shell-open-path", targetPath),
  shellReveal: (targetPath) => ipcRenderer.invoke("omf:shell-reveal", targetPath),

  pickMediaFiles: () => ipcRenderer.invoke("omf:pick-media-files"),
  copyFilesIntoDir: (files, dir) =>
    ipcRenderer.invoke("omf:copy-files-into-dir", files, dir),
  writeBufferFile: (absPath, base64) =>
    ipcRenderer.invoke("omf:write-buffer-file", absPath, base64),

  exportZip: (entries, destAbsPath) =>
    ipcRenderer.invoke("omf:export-zip", entries, destAbsPath),

  keychainSet: (account, secret) =>
    ipcRenderer.invoke("omf:keychain-set", account, secret),
  keychainGet: (account) => ipcRenderer.invoke("omf:keychain-get", account),
  keychainDelete: (account) =>
    ipcRenderer.invoke("omf:keychain-delete", account),

  ensureDir: (absPath) => ipcRenderer.invoke("omf:ensure-dir", absPath),
  joinPath: (...parts) => ipcRenderer.invoke("omf:join-path", parts),

  defaultComfyBaseUrl: () => ipcRenderer.invoke("omf:default-comfy-base-url"),
});
