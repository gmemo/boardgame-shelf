import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createIDBStorage } from '../lib/idb-storage';
import type { BoardGame } from '../types';
import { SYSTEM_TAG_IDS } from './tag-store';

type NewGame = Omit<BoardGame, 'id' | 'createdAt' | 'updatedAt'>;

interface GameState {
  games: BoardGame[];
  addGame: (game: NewGame) => BoardGame;
  updateGame: (id: string, updates: Partial<BoardGame>) => void;
  deleteGame: (id: string) => void;
  removeTagFromAllGames: (tagId: string) => void;
  setGames: (games: BoardGame[]) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      games: [],
      addGame: (game) => {
        const now = new Date().toISOString();
        const newGame: BoardGame = {
          ...game,
          id: crypto.randomUUID(),
          tagIds: game.tagIds.includes(SYSTEM_TAG_IDS.NEW)
            ? game.tagIds
            : [SYSTEM_TAG_IDS.NEW, ...game.tagIds],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ games: [newGame, ...state.games] }));
        return newGame;
      },
      updateGame: (id, updates) => {
        set((state) => ({
          games: state.games.map((g) =>
            g.id === id
              ? { ...g, ...updates, updatedAt: new Date().toISOString() }
              : g,
          ),
        }));
      },
      deleteGame: (id) => {
        set((state) => ({ games: state.games.filter((g) => g.id !== id) }));
      },
      removeTagFromAllGames: (tagId) => {
        set((state) => ({
          games: state.games.map((g) =>
            g.tagIds.includes(tagId)
              ? { ...g, tagIds: g.tagIds.filter((t) => t !== tagId) }
              : g,
          ),
        }));
      },
      setGames: (games) => set({ games }),
    }),
    {
      name: 'bg-shelf-games',
      storage: createIDBStorage<GameState>(),
    },
  ),
);
