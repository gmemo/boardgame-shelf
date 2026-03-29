import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createIDBStorage } from '../lib/idb-storage';
import type { Player } from '../types';

interface PlayerState {
  players: Player[];
  addPlayer: (player: Omit<Player, 'id' | 'createdAt'>) => Player;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  deletePlayer: (id: string) => void;
  setPlayers: (players: Player[]) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      players: [],
      addPlayer: (player) => {
        const newPlayer: Player = { ...player, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        set((state) => ({ players: [...state.players, newPlayer] }));
        return newPlayer;
      },
      updatePlayer: (id, updates) => {
        set((state) => ({
          players: state.players.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },
      deletePlayer: (id) => set((state) => ({ players: state.players.filter((p) => p.id !== id) })),
      setPlayers: (players) => set({ players }),
    }),
    { name: 'bg-shelf-players', storage: createIDBStorage<PlayerState>() }
  )
);
