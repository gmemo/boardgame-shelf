import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createIDBStorage } from '../lib/idb-storage';
import type { PlayLog } from '../types';
import { useGameStore } from './game-store';
import { SYSTEM_TAG_IDS } from './tag-store';

interface PlayLogState {
  playLogs: PlayLog[];
  addPlayLog: (log: Omit<PlayLog, 'id' | 'createdAt' | 'updatedAt'>) => PlayLog;
  updatePlayLog: (id: string, updates: Partial<PlayLog>) => void;
  deletePlayLog: (id: string) => void;
  setPlayLogs: (playLogs: PlayLog[]) => void;
}

export const usePlayLogStore = create<PlayLogState>()(
  persist(
    (set) => ({
      playLogs: [],
      addPlayLog: (log) => {
        const now = new Date().toISOString();
        const newLog: PlayLog = {
          ...log,
          id: crypto.randomUUID(),
          categories: log.categories ?? [],
          playerScores: log.playerScores ?? [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ playLogs: [newLog, ...state.playLogs] }));

        // Remove "New" tag from the game on first play
        const gameStore = useGameStore.getState();
        const game = gameStore.games.find((g) => g.id === log.gameId);
        if (game?.tagIds.includes(SYSTEM_TAG_IDS.NEW)) {
          gameStore.updateGame(game.id, {
            tagIds: game.tagIds.filter((t) => t !== SYSTEM_TAG_IDS.NEW),
          });
        }

        return newLog;
      },
      updatePlayLog: (id, updates) => {
        set((state) => ({
          playLogs: state.playLogs.map((l) =>
            l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
          ),
        }));
      },
      deletePlayLog: (id) => {
        set((state) => ({ playLogs: state.playLogs.filter((l) => l.id !== id) }));
      },
      setPlayLogs: (playLogs) => set({ playLogs }),
    }),
    {
      name: 'bg-shelf-play-logs',
      storage: createIDBStorage<PlayLogState>(),
    },
  ),
);
