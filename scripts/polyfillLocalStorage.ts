/** Minimal localStorage stub so localforage can fall back under Node (verify_runtime). */
const memory = new Map<string, string>();

if (typeof globalThis.localStorage === "undefined") {
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      get length() {
        return memory.size;
      },
      clear() {
        memory.clear();
      },
      getItem(key: string) {
        return memory.get(key) ?? null;
      },
      key(index: number) {
        return [...memory.keys()][index] ?? null;
      },
      removeItem(key: string) {
        memory.delete(key);
      },
      setItem(key: string, value: string) {
        memory.set(key, value);
      },
    } satisfies Storage,
    configurable: true,
  });
}
