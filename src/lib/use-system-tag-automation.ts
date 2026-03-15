import { useEffect, useRef } from 'react';
import { useGameStore, usePlayLogStore, usePreferencesStore, SYSTEM_TAG_IDS } from '../stores';

export function useSystemTagAutomation() {
  const games = useGameStore((s) => s.games);
  const updateGame = useGameStore((s) => s.updateGame);
  const playLogs = usePlayLogStore((s) => s.playLogs);
  const notPlayedRecentlyDays = usePreferencesStore(
    (s) => s.preferences.notPlayedRecentlyDays,
  );
  const prevStateRef = useRef<string>('');

  useEffect(() => {
    // Build a fingerprint to detect real changes and avoid infinite loops
    const fingerprint = JSON.stringify({
      gameIds: games.map((g) => g.id),
      gameTags: games.map((g) => g.tagIds),
      logCount: playLogs.length,
      threshold: notPlayedRecentlyDays,
    });

    if (fingerprint === prevStateRef.current) return;
    prevStateRef.current = fingerprint;

    const now = new Date();
    const thresholdMs = notPlayedRecentlyDays * 24 * 60 * 60 * 1000;

    for (const game of games) {
      const gameLogs = playLogs.filter((l) => l.gameId === game.id);
      const latestDate = gameLogs.length > 0
        ? Math.max(...gameLogs.map((l) => new Date(l.date).getTime()))
        : new Date(game.createdAt).getTime();

      const daysSince = now.getTime() - latestDate;
      const isStale = daysSince > thresholdMs;
      const hasTag = game.tagIds.includes(SYSTEM_TAG_IDS.NOT_PLAYED_RECENTLY);

      if (isStale && !hasTag) {
        updateGame(game.id, {
          tagIds: [...game.tagIds, SYSTEM_TAG_IDS.NOT_PLAYED_RECENTLY],
        });
      } else if (!isStale && hasTag) {
        updateGame(game.id, {
          tagIds: game.tagIds.filter((t) => t !== SYSTEM_TAG_IDS.NOT_PLAYED_RECENTLY),
        });
      }
    }
  }, [games, playLogs, notPlayedRecentlyDays, updateGame]);
}
