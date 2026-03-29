import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayLogStore, useGameStore, usePreferencesStore } from '../../stores';
import PlayLogDetail from '../../components/play-log-detail';
import PlayLogEntry from '../../components/play-log-entry';
import type { PlayLog } from '../../types';

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysSince(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export default function StatsPage() {
  const navigate = useNavigate();
  const { playLogs } = usePlayLogStore();
  const { games } = useGameStore();
  const { preferences } = usePreferencesStore();
  const [selectedLog, setSelectedLog] = useState<PlayLog | null>(null);

  const notPlayedDays = preferences.notPlayedRecentlyDays ?? 30;

  const stats = useMemo(() => {
    const totalPlays = playLogs.length;
    const uniqueGameIds = new Set(playLogs.map((l) => l.gameId)).size;
    const totalMinutes = playLogs.reduce((sum, l) => sum + (l.duration ?? 0), 0);
    const totalTime = totalMinutes > 0 ? formatDuration(totalMinutes) : '—';

    // Last play date per game
    const lastPlayMap = new Map<string, string>();
    for (const log of playLogs) {
      const existing = lastPlayMap.get(log.gameId);
      if (!existing || log.date > existing) lastPlayMap.set(log.gameId, log.date);
    }

    // "Collecting dust" — owned games with no play in last N days
    const collectingDust = games
      .filter((g) => {
        const lastPlay = lastPlayMap.get(g.id);
        if (!lastPlay) return true; // never played
        return daysSince(lastPlay) >= notPlayedDays;
      })
      .map((g) => ({
        game: g,
        lastPlay: lastPlayMap.get(g.id) ?? null,
        daysSince: lastPlayMap.get(g.id) ? daysSince(lastPlayMap.get(g.id)!) : null,
      }))
      .sort((a, b) => (b.daysSince ?? 99999) - (a.daysSince ?? 99999))
      .slice(0, 10);

    // "This month" — plays in current calendar month
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthLogs = playLogs
      .filter((l) => l.date.startsWith(thisMonth))
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((log) => ({
        ...log,
        gameName: games.find((g) => g.id === log.gameId)?.name ?? 'Unknown',
      }));

    // "Favorites vs Reality" — rating >= 4, no play or last play > 60 days ago
    const favoritesVsReality = games
      .filter((g) => g.rating !== null && g.rating >= 4)
      .filter((g) => {
        const lastPlay = lastPlayMap.get(g.id);
        if (!lastPlay) return true;
        return daysSince(lastPlay) > 60;
      })
      .map((g) => ({
        game: g,
        lastPlay: lastPlayMap.get(g.id) ?? null,
      }))
      .slice(0, 8);

    // Recent plays (last 10)
    const recentPlays = [...playLogs]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);

    return { totalPlays, uniqueGameIds, totalTime, collectingDust, thisMonthLogs, favoritesVsReality, recentPlays };
  }, [playLogs, games, notPlayedDays]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-gradient-to-b from-background from-60% to-transparent">
        <h1 className="text-xl font-bold text-text-primary">Stats</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="flex flex-col gap-4">
          {/* Overview — compact stat cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-primary">{stats.totalPlays}</p>
              <p className="text-[10px] text-text-secondary mt-0.5">Plays</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-primary">{stats.uniqueGameIds}</p>
              <p className="text-[10px] text-text-secondary mt-0.5">Games</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-primary">{stats.totalTime}</p>
              <p className="text-[10px] text-text-secondary mt-0.5">Total Time</p>
            </div>
          </div>

          {/* Collecting Dust */}
          <div className="glass rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-1">Collecting Dust</h2>
            <p className="text-xs text-text-secondary mb-3">Not played in {notPlayedDays}+ days</p>
            {stats.collectingDust.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-2">All games played recently</p>
            ) : (
              <div className="flex flex-col gap-2">
                {stats.collectingDust.map(({ game, daysSince: days }) => (
                  <button
                    key={game.id}
                    onClick={() => navigate(`/game/${game.id}`)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-surface-light transition-colors active:scale-[0.98]"
                  >
                    <span className="text-sm text-text-primary flex-1 truncate">{game.name}</span>
                    <span className="text-xs text-text-secondary shrink-0">
                      {days === null ? 'Never played' : `${days}d ago`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* This Month */}
          <div className="glass rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">This Month</h2>
            {stats.thisMonthLogs.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-2">No plays this month yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {stats.thisMonthLogs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-surface-light transition-colors active:scale-[0.98]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{log.gameName}</p>
                      {log.playerNames.length > 0 && (
                        <p className="text-xs text-text-secondary truncate">{log.playerNames.join(', ')}</p>
                      )}
                    </div>
                    <span className="text-xs text-text-secondary shrink-0">{formatDate(log.date)}</span>
                  </button>
                ))}
                <p className="text-xs text-text-secondary text-center mt-1">
                  {stats.thisMonthLogs.length} play{stats.thisMonthLogs.length !== 1 ? 's' : ''} this month
                </p>
              </div>
            )}
          </div>

          {/* Favorites vs Reality */}
          {stats.favoritesVsReality.length > 0 && (
            <div className="glass rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-1">Favorites vs Reality</h2>
              <p className="text-xs text-text-secondary mb-3">You love these but haven&apos;t played them lately</p>
              <div className="flex flex-col gap-2">
                {stats.favoritesVsReality.map(({ game, lastPlay }) => (
                  <button
                    key={game.id}
                    onClick={() => navigate(`/game/${game.id}`)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-surface-light transition-colors active:scale-[0.98]"
                  >
                    <span className="text-sm text-text-primary flex-1 truncate">{game.name}</span>
                    <span className="text-xs text-primary shrink-0">
                      {'★'.repeat(Math.round(game.rating ?? 0))}
                    </span>
                    <span className="text-xs text-text-secondary shrink-0">
                      {lastPlay ? formatDate(lastPlay) : 'Never'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Plays */}
          {stats.recentPlays.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-3">Recent Plays</h2>
              <div className="flex flex-col gap-2">
                {stats.recentPlays.map((log) => (
                  <PlayLogEntry
                    key={log.id}
                    log={log}
                    showGameName
                    onClick={() => setSelectedLog(log)}
                  />
                ))}
              </div>
            </div>
          )}

          {stats.totalPlays === 0 && (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="text-text-secondary text-sm">
                Log some plays to see your stats here.
              </p>
            </div>
          )}
        </div>
      </div>

      <PlayLogDetail
        log={selectedLog}
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
