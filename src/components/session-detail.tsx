import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Pencil, Trash2, Trophy, Clock, Hash, BookOpen, CalendarPlus, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PlaySession } from '../types';
import { useSessionStore, useGameStore } from '../stores';
import IconButton from './ui/icon-button';
import Button from './ui/button';
import ConfirmDialog from './ui/confirm-dialog';

interface SessionDetailProps {
  session: PlaySession;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

export default function SessionDetail({ session }: SessionDetailProps) {
  const navigate = useNavigate();
  const { deleteSession } = useSessionStore();
  const { games } = useGameStore();
  const [showDelete, setShowDelete] = useState(false);

  const game = games.find((g) => g.id === session.gameId);

  const handleDelete = () => {
    deleteSession(session.id);
    navigate('/sessions', { replace: true });
  };

  const playerScores = session.playerNames.filter(Boolean).map((name) => ({
    name,
    score: session.scores[name] ?? null,
    isWinner: name === session.winnerName,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="flex flex-col h-full"
    >
      {/* Ambient glow */}
      <div className="ambient-glow" />

      {/* Top action bar */}
      <div className="flex items-center justify-between px-3 pt-4 pb-2 relative z-10">
        <IconButton onClick={() => navigate('/sessions')}>
          <ChevronLeft size={24} />
        </IconButton>
        <div className="flex gap-1">
          <IconButton onClick={() => navigate(`/session/${session.id}/edit`)}>
            <Pencil size={18} />
          </IconButton>
          <IconButton onClick={() => setShowDelete(true)}>
            <Trash2 size={18} />
          </IconButton>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto relative z-[1]">
        <div className="flex flex-col gap-5 px-4 pb-24">
          {/* Game heading */}
          <div>
            <button
              onClick={() => game && navigate(`/game/${game.id}`)}
              className="text-left"
            >
              <h1 className="text-2xl font-bold text-text-primary">
                {game?.name ?? 'Unknown Game'}
              </h1>
            </button>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[session.status]}`}
              >
                {STATUS_LABELS[session.status]}
              </span>
            </div>
          </div>

          {/* Info pills row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs glass-pill px-2.5 py-1 rounded-full text-text-secondary">
              {formatDate(session.date)}
            </span>
            {session.duration !== null && (
              <span className="text-xs glass-pill px-2.5 py-1 rounded-full text-text-secondary flex items-center gap-1">
                <Clock size={12} />
                {session.duration} min
              </span>
            )}
            {session.sessionNumber !== null && (
              <span className="text-xs glass-pill px-2.5 py-1 rounded-full text-text-secondary flex items-center gap-1">
                <Hash size={12} />
                Session {session.sessionNumber}
              </span>
            )}
            {session.chapter && (
              <span className="text-xs glass-pill px-2.5 py-1 rounded-full text-text-secondary flex items-center gap-1">
                <BookOpen size={12} />
                <span className="truncate max-w-[120px]">{session.chapter}</span>
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/game/${session.gameId}/log-play`)}
              className="flex-1"
            >
              <CalendarPlus size={18} />
              Log Play
            </Button>
            <Button
              onClick={() => navigate(`/scorekeeper?gameId=${session.gameId}&sessionId=${session.id}`)}
              variant="secondary"
              className="flex-1"
            >
              <Swords size={18} />
              Score
            </Button>
          </div>

          {/* Players & Scores */}
          {playerScores.length > 0 && (
            <div className="glass rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Players</h2>
              <div className="flex flex-col gap-2">
                {playerScores.map(({ name, score, isWinner }) => (
                  <div key={name} className="flex items-center gap-2">
                    {isWinner && <Trophy size={14} className="text-primary shrink-0" />}
                    {!isWinner && <div className="w-[14px] shrink-0" />}
                    <span
                      className={`text-sm flex-1 ${
                        isWinner ? 'font-semibold text-text-primary' : 'text-text-secondary'
                      }`}
                    >
                      {name}
                    </span>
                    {score !== null && (
                      <span className="text-sm font-medium text-text-primary">{score}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {session.notes && (
            <div className="glass-light rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-2">Notes</h2>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{session.notes}</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete session?"
        description="This will permanently remove this session and all its data. This cannot be undone."
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
