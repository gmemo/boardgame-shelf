import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createIDBStorage } from '../lib/idb-storage';
import type { PlaySession } from '../types';

interface SessionState {
  sessions: PlaySession[];
  addSession: (session: Omit<PlaySession, 'id' | 'createdAt' | 'updatedAt'>) => PlaySession;
  updateSession: (id: string, updates: Partial<PlaySession>) => void;
  deleteSession: (id: string) => void;
  setSessions: (sessions: PlaySession[]) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessions: [],
      addSession: (session) => {
        const now = new Date().toISOString();
        const newSession: PlaySession = { ...session, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        set((state) => ({ sessions: [newSession, ...state.sessions] }));
        return newSession;
      },
      updateSession: (id, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
          ),
        }));
      },
      deleteSession: (id) => set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
      setSessions: (sessions) => set({ sessions }),
    }),
    { name: 'bg-shelf-sessions', storage: createIDBStorage<SessionState>() }
  )
);
