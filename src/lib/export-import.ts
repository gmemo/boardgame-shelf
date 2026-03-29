import { useGameStore } from '../stores/game-store';
import { useTagStore } from '../stores/tag-store';
import { usePlayLogStore } from '../stores/play-log-store';
import { usePreferencesStore } from '../stores/preferences-store';
import { useSessionStore } from '../stores/session-store';
import { useWishlistStore } from '../stores/wishlist-store';
import { usePlayerStore } from '../stores/player-store';
import type { BoardGame, Tag, PlayLog, UserPreferences, PlaySession, WishlistItem, Player } from '../types';

interface BackupDataV1 {
  version: 1;
  exportedAt: string;
  games: BoardGame[];
  tags: Tag[];
  playLogs: PlayLog[];
  preferences: UserPreferences;
}

interface BackupDataV2 {
  version: 2;
  exportedAt: string;
  games: BoardGame[];
  tags: Tag[];
  playLogs: PlayLog[];
  sessions: PlaySession[];
  wishlistItems: WishlistItem[];
  players: Player[];
  preferences: UserPreferences;
}

type BackupData = BackupDataV1 | BackupDataV2;

export function exportData() {
  const data: BackupDataV2 = {
    version: 2,
    exportedAt: new Date().toISOString(),
    games: useGameStore.getState().games,
    tags: useTagStore.getState().tags,
    playLogs: usePlayLogStore.getState().playLogs,
    sessions: useSessionStore.getState().sessions,
    wishlistItems: useWishlistStore.getState().items,
    players: usePlayerStore.getState().players,
    preferences: usePreferencesStore.getState().preferences,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meeply-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function pickAndParseImportFile(): Promise<
  { ok: true; data: BackupData } | { ok: false; error: string | null }
> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve({ ok: false, error: null });

      try {
        const text = await file.text();
        const data = JSON.parse(text) as BackupData;

        if (
          !data.version ||
          !Array.isArray(data.games) ||
          !Array.isArray(data.tags) ||
          !Array.isArray(data.playLogs)
        ) {
          throw new Error('Invalid backup format');
        }

        resolve({ ok: true, data });
      } catch {
        resolve({ ok: false, error: 'Invalid backup file' });
      }
    };
    input.oncancel = () => resolve({ ok: false, error: null });
    input.click();
  });
}

export function applyImportData(data: BackupData) {
  useGameStore.getState().setGames(data.games);
  useTagStore.getState().setTags(data.tags);
  usePlayLogStore.getState().setPlayLogs(data.playLogs);
  if (data.preferences) {
    usePreferencesStore.getState().setPreferences(data.preferences);
  }
  if (data.version === 2) {
    if (Array.isArray(data.sessions)) {
      useSessionStore.getState().setSessions(data.sessions);
    }
    if (Array.isArray(data.wishlistItems)) {
      useWishlistStore.getState().setItems(data.wishlistItems);
    }
    if (Array.isArray(data.players)) {
      usePlayerStore.getState().setPlayers(data.players);
    }
  }
}
