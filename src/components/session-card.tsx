import { useGameStore } from '../stores';
import type { PlaySession } from '../types';

interface SessionCardProps {
  session: PlaySession;
  onClick: () => void;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const STATUS_COLORS = {
  active: 'text-primary bg-primary/10',
  completed: 'text-text-secondary bg-surface',
  abandoned: 'text-text-secondary bg-surface',
};

const STATUS_LABELS = {
  active: 'Active',
  completed: 'Completed',
  abandoned: 'Abandoned',
};

export default function SessionCard({ session, onClick }: SessionCardProps) {
  const { games } = useGameStore();
  const game = games.find((g) => g.id === session.gameId);

  const playerText = session.playerNames.filter(Boolean).join(', ');

  return (
    <button
      onClick={onClick}
      className="glass rounded-2xl p-4 w-full text-left active:scale-[0.97] transition-transform card-active-glow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {game?.name ?? 'Unknown Game'}
          </p>
          {playerText && (
            <p className="text-xs text-text-secondary mt-0.5 truncate">{playerText}</p>
          )}
        </div>
        <span
          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[session.status]}`}
        >
          {STATUS_LABELS[session.status]}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-2 flex-wrap">
        <span className="text-xs text-text-secondary">{formatDate(session.date)}</span>
        {session.sessionNumber !== null && (
          <span className="text-xs text-text-secondary">Session {session.sessionNumber}</span>
        )}
        {session.chapter && (
          <span className="text-xs text-text-secondary truncate max-w-[120px]">
            {session.chapter}
          </span>
        )}
      </div>
    </button>
  );
}
