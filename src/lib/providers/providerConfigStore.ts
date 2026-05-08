import type { ProviderConfig } from "@/lib/providers/types";
import { testComfyProviderConfig } from "@/lib/providers/comfyConfigTest";
import { testGenericHttpProviderConfig } from "@/lib/providers/genericHttpConfigTest";
import { create } from "zustand";
import { storageProviderConfigs } from "@/lib/storage/storage";

type ActiveMap = Record<string, string>;

type ProviderConfigState = {
  configs: ProviderConfig[];
  activeByProviderId: ActiveMap;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  listProviderConfigs: () => ProviderConfig[];
  getProviderConfig: (id: string) => ProviderConfig | undefined;
  createProviderConfig: (input: Omit<ProviderConfig, "id" | "createdAt" | "updatedAt"> & { id?: string }) => ProviderConfig;
  updateProviderConfig: (id: string, patch: Partial<ProviderConfig>) => ProviderConfig | undefined;
  deleteProviderConfig: (id: string) => void;
  testProviderConfig: (id: string) => Promise<{ ok: boolean; message: string }>;
  setActiveProviderConfig: (providerId: string, configId: string | null) => void;
  getActiveConfigForProvider: (providerId: string) => ProviderConfig | undefined;
};

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `pcfg-${Date.now()}`;
}

function nowIso() {
  return new Date().toISOString();
}

export const useProviderConfigStore = create<ProviderConfigState>((set, get) => ({
  configs: [],
  activeByProviderId: {},
  hydrated: false,

  hydrate: async () => {
    const raw =
      (await storageProviderConfigs.getItem<{
        configs: ProviderConfig[];
        activeByProviderId?: ActiveMap;
      }>("state")) ?? { configs: [] };
    set({
      configs: raw.configs ?? [],
      activeByProviderId: raw.activeByProviderId ?? {},
      hydrated: true,
    });
  },

  persist: async () => {
    const { configs, activeByProviderId } = get();
    await storageProviderConfigs.setItem("state", {
      configs,
      activeByProviderId,
    });
  },

  listProviderConfigs: () => [...get().configs],

  getProviderConfig: (id) => get().configs.find((c) => c.id === id),

  createProviderConfig: (input) => {
    const ts = nowIso();
    const row: ProviderConfig = {
      ...input,
      id: input.id ?? newId(),
      createdAt: ts,
      updatedAt: ts,
    };
    set((s) => ({
      configs: [...s.configs.filter((c) => c.id !== row.id), row],
    }));
    void get().persist();
    return row;
  },

  updateProviderConfig: (id, patch) => {
    let out: ProviderConfig | undefined;
    set((s) => ({
      configs: s.configs.map((c) => {
        if (c.id !== id) return c;
        out = { ...c, ...patch, updatedAt: nowIso() };
        return out;
      }),
    }));
    void get().persist();
    return out;
  },

  deleteProviderConfig: (id) => {
    set((s) => ({
      configs: s.configs.filter((c) => c.id !== id),
      activeByProviderId: Object.fromEntries(
        Object.entries(s.activeByProviderId).filter(([, v]) => v !== id),
      ),
    }));
    void get().persist();
  },

  testProviderConfig: async (id) => {
    const cfg = get().getProviderConfig(id);
    if (!cfg) {
      return { ok: false, message: "Config not found." };
    }
    let result: { ok: boolean; message: string };
    if (cfg.providerId === "generic-http") {
      result = await testGenericHttpProviderConfig(cfg);
    } else if (cfg.providerId === "comfyui-local") {
      result = await testComfyProviderConfig(cfg);
    } else {
      result = { ok: false, message: "Unknown provider for test." };
    }
    get().updateProviderConfig(id, {
      lastTestAt: nowIso(),
      lastTestStatus: result.ok ? "ok" : "failed",
      lastTestMessage: result.message,
    });
    return result;
  },

  setActiveProviderConfig: (providerId, configId) => {
    set((s) => {
      const next = { ...s.activeByProviderId };
      if (configId === null) {
        delete next[providerId];
      } else {
        next[providerId] = configId;
      }
      return { activeByProviderId: next };
    });
    void get().persist();
  },

  getActiveConfigForProvider: (providerId) => {
    const id = get().activeByProviderId[providerId];
    if (!id) return undefined;
    return get().getProviderConfig(id);
  },
}));
