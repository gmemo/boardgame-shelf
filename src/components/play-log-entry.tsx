import { Trash2, Trophy, Clock, Users } from 'lucide-react';
import type { PlayLog } from '../types';
import { useGameStore, usePlayLogStore } from '../stores';
import { useState } from 'react';
import ConfirmDialog from './ui/confirm-dialog';

interface PlayLogEntryProps {
  log: PlayLog;
  showGameName?: boolean;
}

export default function PlayLogEntry({ log, showGameName = true }: PlayLogEntryProps) {
  const { games } = useGameStore();
  const { deletePlayLog } = usePlayLogStore();
  const [showDelete, setShowDelete] = useState(false);

  const game = games.find((g) => g.id === log.gameId);

  return (
    <>
      <div className="glass-light rounded-2xl p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {showGameName && game && (
            <p className="text-sm font-semibold text-text-primary truncate mb-1">
              {game.name}
            </p>
          )}
          <p className="text-xs text-text-secondary mb-2">{formatDate(log.date)}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
            {log.playerNames.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Users size={12} />
                {log.playerNames.join(', ')}
              </span>
            )}
            {log.winnerName && (
              <span className="inline-flex items-center gap-1 text-primary font-medium">
                <Trophy size={12} />
                {log.winnerName}
              </span>
            )}
            {log.duration && (
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                {log.duration}m
              </span>
            )}
          </div>

          {log.notes && (
            <p className="text-xs text-text-secondary mt-2 line-clamp-2">{log.notes}</p>
          )}
        </div>

        <button
          onClick={() => setShowDelete(true)}
          className="text-text-secondary/40 hover:text-danger transition-colors mt-0.5"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete play log?"
        description="This will permanently remove this play log entry."
        onConfirm={() => deletePlayLog(log.id)}
      />
    </>
  );
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
