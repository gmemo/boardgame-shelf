import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createIDBStorage } from '../lib/idb-storage';
import type { UserPreferences } from '../types';

interface PreferencesState {
  preferences: UserPreferences;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  accentColor: 'indigo',
  hasSeenWelcome: false,
  notPlayedRecentlyDays: 90,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      preferences: defaultPreferences,
      setPreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
    }),
    {
      name: 'bg-shelf-preferences',
      storage: createIDBStorage<PreferencesState>(),
    },
  ),
);
