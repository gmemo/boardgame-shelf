import { useMemo } from 'react';
import { usePlayLogStore, useGameStore } from '../../stores';
import { Trophy, Users } from 'lucide-react';

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

export default function StatsPage() {
  const { playLogs } = usePlayLogStore();
  const { games } = useGameStore();

  const stats = useMemo(() => {
    const totalPlays = playLogs.length;
    const uniqueGameIds = new Set(playLogs.map((l) => l.gameId)).size;

    const totalMinutes = playLogs.reduce((sum, l) => sum + (l.duration ?? 0), 0);
    const totalTime = totalMinutes > 0 ? formatDuration(totalMinutes) : '—';

    // Top 5 games by play count
    const playCounts = new Map<string, { count: number; lastDate: string }>();
    for (const log of playLogs) {
      const existing = playCounts.get(log.gameId);
      if (!existing) {
        playCounts.set(log.gameId, { count: 1, lastDate: log.date });
      } else {
        existing.count += 1;
        if (log.date > existing.lastDate) existing.lastDate = log.date;
      }
    }

    const topGames = Array.from(playCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([gameId, { count, lastDate }]) => {
        const game = games.find((g) => g.id === gameId);
        return { gameId, name: game?.name ?? 'Unknown', count, lastDate };
      });

    // Recent plays (last 5)
    const recentPlays = [...playLogs]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map((log) => {
        const game = games.find((g) => g.id === log.gameId);
        return { ...log, gameName: game?.name ?? 'Unknown' };
      });

    return { totalPlays, uniqueGameIds, totalTime, topGames, recentPlays };
  }, [playLogs, games]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-gradient-to-b from-background from-60% to-transparent">
        <h1 className="text-xl font-bold text-text-primary">Stats</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="flex flex-col gap-4">
          {/* Overview — 3 stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.totalPlays}</p>
              <p className="text-xs text-text-secondary mt-1">Total Plays</p>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.uniqueGameIds}</p>
              <p className="text-xs text-text-secondary mt-1">Games Played</p>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.totalTime}</p>
              <p className="text-xs text-text-secondary mt-1">Total Time</p>
            </div>
          </div>

          {/* Most Played */}
          {stats.topGames.length > 0 && (
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-primary" />
                <h2 className="text-sm font-semibold text-text-primary">Most Played</h2>
              </div>
              <div className="flex flex-col gap-3">
                {stats.topGames.map((entry, i) => (
                  <div key={entry.gameId} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-text-secondary/50 w-4 shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-text-primary flex-1 truncate">{entry.name}</span>
                    <span className="text-xs text-text-secondary shrink-0">
                      {entry.count} play{entry.count !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-text-secondary/50 shrink-0 hidden sm:block">
                      {formatDate(entry.lastDate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Plays */}
          {stats.recentPlays.length > 0 && (
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-primary" />
                <h2 className="text-sm font-semibold text-text-primary">Recent Plays</h2>
              </div>
              <div className="flex flex-col gap-3">
                {stats.recentPlays.map((log) => (
                  <div key={log.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{log.gameName}</p>
                      {log.playerNames.length > 0 && (
                        <p className="text-xs text-text-secondary truncate">
                          {log.playerNames.join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-text-secondary shrink-0">
                      {formatDate(log.date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {stats.totalPlays === 0 && (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="text-text-secondary text-sm">
                Log some play sessions to see your stats here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
