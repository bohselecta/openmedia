import { create } from "zustand";
import { storageProviderRunLog } from "@/lib/storage/storage";

export type ProviderRunLane =
  | "mock"
  | "local"
  | "byok-remote"
  | "future-hosted";

export type ProviderRunLogStatus = "started" | "succeeded" | "failed" | "canceled";

export type ProviderRunLogEntry = {
  id: string;
  timestamp: string;
  providerId: string;
  providerConfigId?: string;
  projectId?: string;
  jobId?: string;
  task: string;
  lane: ProviderRunLane;
  /** Host only when sensitive — no path/query secrets */
  endpointHost?: string;
  method: string;
  status: ProviderRunLogStatus;
  httpStatus?: number;
  durationMs?: number;
  errorMessage?: string;
  credentialRef?: string;
  networkDestination?: string;
};

type RunLogState = {
  entries: ProviderRunLogEntry[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  append: (e: Omit<ProviderRunLogEntry, "id" | "timestamp"> & { id?: string }) => ProviderRunLogEntry;
  list: () => ProviderRunLogEntry[];
};

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `plog-${Date.now()}`;
}

export const useProviderRunLogStore = create<RunLogState>((set, get) => ({
  entries: [],
  hydrated: false,

  hydrate: async () => {
    const list =
      (await storageProviderRunLog.getItem<ProviderRunLogEntry[]>("entries")) ??
      [];
    set({ entries: list, hydrated: true });
  },

  persist: async () => {
    await storageProviderRunLog.setItem("entries", get().entries);
  },

  append: (e) => {
    const row: ProviderRunLogEntry = {
      ...e,
      id: e.id ?? newId(),
      timestamp: new Date().toISOString(),
    };
    set((s) => ({
      entries: [row, ...s.entries].slice(0, 500),
    }));
    void get().persist();
    return row;
  },

  list: () => [...get().entries],
}));

export function hostOnlyFromUrl(url: string): string | undefined {
  try {
    return new URL(url).host;
  } catch {
    return undefined;
  }
}

export function inferRunLane(params: {
  providerId: string;
  authMode: string;
  endpointHost?: string;
  credentialRef?: string;
}): ProviderRunLane {
  if (params.providerId === "mock") return "mock";
  if (params.providerId === "comfyui-local") return "local";
  const h = (params.endpointHost ?? "").toLowerCase();
  if (
    h.startsWith("127.") ||
    h === "localhost" ||
    h.endsWith(".local")
  ) {
    return "local";
  }
  if (
    params.credentialRef ||
    params.authMode === "bearer" ||
    params.authMode === "header" ||
    params.authMode === "custom" ||
    params.authMode === "byok"
  ) {
    return "byok-remote";
  }
  return "byok-remote";
}
