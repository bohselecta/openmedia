import type { Asset, AssetMapEntry } from "@/lib/assets/assetTypes";
import { useProjectStore } from "@/lib/projects/projectStore";
import { create } from "zustand";
import { storageAssetMap, storageAssets } from "@/lib/storage/storage";

type AssetState = {
  assets: Asset[];
  assetMap: AssetMapEntry[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  upsertAsset: (a: Asset) => void;
  upsertMapEntry: (e: AssetMapEntry) => void;
};

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],
  assetMap: [],
  hydrated: false,
  hydrate: async () => {
    const assets = (await storageAssets.getItem<Asset[]>("assets")) ?? [];
    const assetMap =
      (await storageAssetMap.getItem<AssetMapEntry[]>("assetMap")) ?? [];
    set({ assets, assetMap, hydrated: true });
  },
  persist: async () => {
    await storageAssets.setItem("assets", get().assets);
    await storageAssetMap.setItem("assetMap", get().assetMap);
  },
  upsertAsset: (a) => {
    set((s) => ({
      assets: [...s.assets.filter((x) => x.id !== a.id), a],
    }));
    void get().persist();
    if (a.projectId) {
      useProjectStore.getState().touchProject(a.projectId);
    }
  },
  upsertMapEntry: (e) => {
    set((s) => ({
      assetMap: [...s.assetMap.filter((x) => x.id !== e.id), e],
    }));
    void get().persist();
    useProjectStore.getState().touchProject(e.projectId);
  },
}));
