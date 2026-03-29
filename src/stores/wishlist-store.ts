import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createIDBStorage } from '../lib/idb-storage';
import type { WishlistItem } from '../types';

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>) => WishlistItem;
  updateItem: (id: string, updates: Partial<WishlistItem>) => void;
  deleteItem: (id: string) => void;
  setItems: (items: WishlistItem[]) => void;
}

// Idempotent: existing fields in `raw` override the defaults via spread order
function migrateWishlistItem(raw: Record<string, unknown>): WishlistItem {
  return {
    minPlayers: null,
    maxPlayers: null,
    playTimeMinutes: null,
    complexity: null,
    quickRulesNotes: '',
    ...raw,
  } as WishlistItem;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => {
        const now = new Date().toISOString();
        const newItem: WishlistItem = { ...item, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        set((state) => ({ items: [newItem, ...state.items] }));
        return newItem;
      },
      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
          ),
        }));
      },
      deleteItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setItems: (items) => set({ items }),
    }),
    {
      name: 'bg-shelf-wishlist',
      storage: createIDBStorage<WishlistState>(),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.items = state.items.map((item) =>
            migrateWishlistItem(item as unknown as Record<string, unknown>)
          );
        }
      },
    }
  )
);
