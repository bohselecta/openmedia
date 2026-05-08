import type { CredentialRef } from "@/lib/providers/types";
import { create } from "zustand";
import { storageCredentials } from "@/lib/storage/storage";

type CredentialState = {
  credentials: CredentialRef[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  upsertCredential: (c: CredentialRef) => void;
  removeCredential: (id: string) => void;
};

export const useCredentialStore = create<CredentialState>((set, get) => ({
  credentials: [],
  hydrated: false,
  hydrate: async () => {
    const list =
      (await storageCredentials.getItem<CredentialRef[]>("credentials")) ??
      [];
    set({ credentials: list, hydrated: true });
  },
  persist: async () => {
    await storageCredentials.setItem("credentials", get().credentials);
  },
  upsertCredential: (c) => {
    set((s) => ({
      credentials: [...s.credentials.filter((x) => x.id !== c.id), c],
    }));
    void get().persist();
  },
  removeCredential: (id) => {
    set((s) => ({
      credentials: s.credentials.filter((x) => x.id !== id),
    }));
    void get().persist();
  },
}));
