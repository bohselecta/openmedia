import localforage from "localforage";
import type { OmfStorage } from "@/lib/storage/storage";

function lfInstance(name: string) {
  return localforage.createInstance({
    name: "openmediaforge",
    storeName: name,
    driver: [
      localforage.INDEXEDDB,
      localforage.WEBSQL,
      localforage.LOCALSTORAGE,
    ],
  });
}

function serializeValue(value: unknown): string {
  return JSON.stringify(value);
}

function deserializeValue<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

export function createOmfStore(name: string): OmfStorage {
  const lf = lfInstance(name);
  const store: OmfStorage = {
    getItem: async <T>(key: string) => {
      if (typeof window !== "undefined" && window.omfDesktop?.kvGet) {
        const raw = await window.omfDesktop.kvGet(name, key);
        if (raw == null || raw === "") return null;
        return deserializeValue<T>(raw);
      }
      return lf.getItem<T>(key);
    },
    setItem: async (key: string, value: unknown) => {
      if (typeof window !== "undefined" && window.omfDesktop?.kvSet) {
        await window.omfDesktop.kvSet(name, key, serializeValue(value));
        return;
      }
      await lf.setItem(key, value);
    },
    removeItem: async (key: string) => {
      if (typeof window !== "undefined" && window.omfDesktop?.kvRemove) {
        await window.omfDesktop.kvRemove(name, key);
        return;
      }
      await lf.removeItem(key);
    },
    clear: async () => {
      if (typeof window !== "undefined" && window.omfDesktop?.kvClearStore) {
        await window.omfDesktop.kvClearStore(name);
        return;
      }
      await lf.clear();
    },
  };
  return store;
}
