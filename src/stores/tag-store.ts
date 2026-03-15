import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createIDBStorage } from '../lib/idb-storage';
import type { Tag } from '../types';

// Deterministic IDs for system tags so other code can reference them
export const SYSTEM_TAG_IDS = {
  NEW: 'system-new',
  UP_FOR_TRADE: 'system-up-for-trade',
  FAVORITE: 'system-favorite',
  NOT_PLAYED_RECENTLY: 'system-not-played-recently',
} as const;

const SYSTEM_TAGS: Tag[] = [
  { id: SYSTEM_TAG_IDS.NEW, name: 'New', type: 'system' },
  { id: SYSTEM_TAG_IDS.FAVORITE, name: 'Favorite', type: 'system' },
  { id: SYSTEM_TAG_IDS.UP_FOR_TRADE, name: 'Up for Trade', type: 'system' },
  { id: SYSTEM_TAG_IDS.NOT_PLAYED_RECENTLY, name: 'Not Played Recently', type: 'system' },
];

const DEFAULT_TAGS: Tag[] = [
  { id: 'default-strategy', name: 'Strategy', type: 'default' },
  { id: 'default-party', name: 'Party', type: 'default' },
  { id: 'default-cooperative', name: 'Cooperative', type: 'default' },
  { id: 'default-deckbuilder', name: 'Deck Builder', type: 'default' },
  { id: 'default-worker-placement', name: 'Worker Placement', type: 'default' },
  { id: 'default-area-control', name: 'Area Control', type: 'default' },
  { id: 'default-dice', name: 'Dice', type: 'default' },
  { id: 'default-card', name: 'Card', type: 'default' },
  { id: 'default-family', name: 'Family', type: 'default' },
];

const INITIAL_TAGS = [...SYSTEM_TAGS, ...DEFAULT_TAGS];

interface TagState {
  tags: Tag[];
  addTag: (name: string, type: 'default' | 'custom') => Tag;
  updateTag: (id: string, name: string) => void;
  deleteTag: (id: string) => void;
  setTags: (tags: Tag[]) => void;
}

export const useTagStore = create<TagState>()(
  persist(
    (set, get) => ({
      tags: INITIAL_TAGS,
      addTag: (name, type) => {
        const tag: Tag = {
          id: crypto.randomUUID(),
          name,
          type,
        };
        set((state) => ({ tags: [...state.tags, tag] }));
        return tag;
      },
      updateTag: (id, name) => {
        const tag = get().tags.find((t) => t.id === id);
        if (!tag || tag.type === 'system') return;
        set((state) => ({
          tags: state.tags.map((t) => (t.id === id ? { ...t, name } : t)),
        }));
      },
      deleteTag: (id) => {
        const tag = get().tags.find((t) => t.id === id);
        if (!tag || tag.type === 'system') return;
        set((state) => ({
          tags: state.tags.filter((t) => t.id !== id),
        }));
      },
      setTags: (tags) => set({ tags }),
    }),
    {
      name: 'bg-shelf-tags',
      storage: createIDBStorage<TagState>(),
    },
  ),
);
