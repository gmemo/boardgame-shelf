import { createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

/**
 * Creates a Zustand-compatible storage adapter backed by IndexedDB.
 * Provides offline persistence for all app data.
 */
export function createIDBStorage<T>() {
  return createJSONStorage<T>(() => ({
    getItem: async (name: string) => {
      const val = await idbGet(name);
      return val ?? null;
    },
    setItem: async (name: string, value: string) => {
      await idbSet(name, value);
    },
    removeItem: async (name: string) => {
      await idbDel(name);
    },
  }));
}
