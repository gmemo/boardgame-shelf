import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CalendarDays } from 'lucide-react';
import { usePlayLogStore } from '../../stores';
import PlayLogEntry from '../../components/play-log-entry';
import EmptyState from '../../components/ui/empty-state';

export default function PlaysPage() {
  const navigate = useNavigate();
  const { playLogs } = usePlayLogStore();

  // Group logs by date
  const grouped = useMemo(() => {
    const map = new Map<string, typeof playLogs>();
    const sorted = [...playLogs].sort((a, b) => b.date.localeCompare(a.date));
    for (const log of sorted) {
      const existing = map.get(log.date);
      if (existing) {
        existing.push(log);
      } else {
        map.set(log.date, [log]);
      }
    }
    return Array.from(map.entries());
  }, [playLogs]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">Plays</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-secondary">
              {playLogs.length} play{playLogs.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => navigate('/plays/log')}
              className="flex items-center justify-center w-9 h-9 rounded-full glass-pill text-text-secondary hover:text-primary transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 bg-transparent">
        {playLogs.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={48} strokeWidth={1.5} />}
            title="No plays logged"
            description="Log your first play session to start tracking your games."
          />
        ) : (
          <div className="flex flex-col gap-5">
            {grouped.map(([date, logs]) => (
              <div key={date}>
                <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  {formatGroupDate(date)}
                </h2>
                <div className="flex flex-col gap-2">
                  {logs.map((log) => (
                    <PlayLogEntry key={log.id} log={log} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function formatGroupDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}
