import localforage from "localforage";

export function createOmfStore(name: string) {
  return localforage.createInstance({
    name: "openmediaforge",
    storeName: name,
    driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
  });
}
