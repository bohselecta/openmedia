import localforage from "localforage";
import { createOmfStore } from "@/lib/storage/indexedDbStorage";

export type OmfStorage = ReturnType<typeof localforage.createInstance>;

export const storageProjects = createOmfStore("projects");
export const storageAssets = createOmfStore("assets");
export const storageAssetMap = createOmfStore("asset_map");
export const storageJobs = createOmfStore("jobs");
export const storageReceipts = createOmfStore("receipts");
export const storageCredentials = createOmfStore("credentials");
export const storageAudit = createOmfStore("audit");
export const storageWorkspace = createOmfStore("workspace");
export const storageProviderConfigs = createOmfStore("provider_configs");
export const storageProviderRunLog = createOmfStore("provider_run_log");

export async function clearAllOmfStores(): Promise<void> {
  await Promise.all([
    storageProjects.clear(),
    storageAssets.clear(),
    storageAssetMap.clear(),
    storageJobs.clear(),
    storageReceipts.clear(),
    storageCredentials.clear(),
    storageAudit.clear(),
    storageWorkspace.clear(),
    storageProviderConfigs.clear(),
    storageProviderRunLog.clear(),
  ]);
}
