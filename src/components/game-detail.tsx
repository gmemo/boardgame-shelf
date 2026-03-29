import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Pencil, Trash2, Users, Clock, BookOpen, StickyNote, Puzzle, Play, Gamepad2 } from 'lucide-react';
import type { BoardGame } from '../types';
import { useGameStore, useTagStore, usePlayLogStore, useSessionStore, SYSTEM_TAG_IDS } from '../stores';
import IconButton from './ui/icon-button';
import Badge from './ui/badge';
import StarRating from './ui/star-rating';
import ComplexityDots from './ui/complexity-dots';
import ConfirmDialog from './ui/confirm-dialog';
import Button from './ui/button';
import PlayLogEntry from './play-log-entry';
import PlayLogDetail from './play-log-detail';
import { motion } from 'framer-motion';
import type { PlayLog } from '../types';

interface GameDetailProps {
  game: BoardGame;
}

export default function GameDetail({ game }: GameDetailProps) {
  const navigate = useNavigate();
  const { deleteGame } = useGameStore();
  const { tags } = useTagStore();
  const { playLogs } = usePlayLogStore();
  const { sessions } = useSessionStore();
  const [showDelete, setShowDelete] = useState(false);
  const [selectedLog, setSelectedLog] = useState<PlayLog | null>(null);

  const gameTags = game.tagIds
    .filter((id) => id !== SYSTEM_TAG_IDS.NEW && id !== SYSTEM_TAG_IDS.NOT_PLAYED_RECENTLY)
    .map((id) => tags.find((t) => t.id === id))
    .filter(Boolean);

  const isFavorite = game.tagIds.includes(SYSTEM_TAG_IDS.FAVORITE);

  const recentPlays = useMemo(() => {
    return playLogs
      .filter((l) => l.gameId === game.id)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [playLogs, game.id]);

  // Check for a paused session for this game
  const pausedSession = useMemo(
    () => sessions.find((s) => s.gameId === game.id),
    [sessions, game.id]
  );

  const handleDelete = () => {
    deleteGame(game.id);
    navigate('/', { replace: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="flex flex-col h-full"
    >
      {/* Top action bar */}
      <div className="flex items-center justify-between px-3 pt-4 pb-2 relative z-10">
        <IconButton onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </IconButton>
        <div className="flex gap-1">
          <IconButton onClick={() => navigate(`/game/${game.id}/edit`)}>
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
          {/* Hero image */}
          {game.imageUrl ? (
            <div className="rounded-2xl overflow-hidden aspect-[16/9] depth-2">
              <img src={game.imageUrl} alt={game.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden aspect-[16/9] bg-surface flex items-center justify-center depth-2">
              <span className="text-6xl font-bold text-text-secondary/20">
                {game.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Title + Rating */}
          <div>
            <div className="flex items-start gap-2">
              <h1 className="text-2xl font-bold text-text-primary flex-1">{game.name}</h1>
              {isFavorite && <span className="text-danger text-xl mt-1">&#9829;</span>}
            </div>
            {game.rating !== null && (
              <div className="mt-1">
                <StarRating value={game.rating} size={18} />
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Users size={16} />
              <span className="text-sm">
                {game.minPlayers === game.maxPlayers
                  ? `${game.minPlayers}`
                  : `${game.minPlayers}–${game.maxPlayers}`}{' '}
                players
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Clock size={16} />
              <span className="text-sm">{game.playTimeMinutes} min</span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary">
              <ComplexityDots value={game.complexity} size="sm" />
            </div>
          </div>

          {/* Play button(s) */}
          {pausedSession ? (
            <div className="flex gap-2">
              <Button
                onClick={() => navigate(`/scorekeeper?gameId=${game.id}`)}
                className="flex-1"
              >
                <Gamepad2 size={18} /> Play
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate(`/scorekeeper?gameId=${game.id}&sessionId=${pausedSession.id}`)}
                className="flex-1"
              >
                <Play size={18} /> Resume
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => navigate(`/scorekeeper?gameId=${game.id}`)}
              className="w-full"
            >
              <Gamepad2 size={18} /> Play
            </Button>
          )}

          {/* Tags */}
          {gameTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {gameTags.map((tag) => (
                <Badge
                  key={tag!.id}
                  label={tag!.name}
                  variant={tag!.type === 'system' ? 'primary' : 'default'}
                />
              ))}
            </div>
          )}

          {/* Description */}
          {game.description && (
            <p className="text-sm text-text-secondary leading-relaxed">{game.description}</p>
          )}

          {/* Quick Rules Notes */}
          {game.quickRulesNotes && (
            <div className="glass-light rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={16} className="text-primary" />
                <span className="text-sm font-semibold text-text-primary">Quick Rules</span>
              </div>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {game.quickRulesNotes}
              </p>
            </div>
          )}

          {/* Expansions */}
          {game.expansions.length > 0 && (
            <div className="glass-light rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Puzzle size={16} className="text-primary" />
                <span className="text-sm font-semibold text-text-primary">Expansions</span>
              </div>
              <div className="flex flex-col gap-2">
                {game.expansions.map((exp) => (
                  <div key={exp.id} className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${exp.owned ? 'bg-primary' : 'bg-text-secondary/30'}`}
                    />
                    <span
                      className={`text-sm ${exp.owned ? 'text-text-primary' : 'text-text-secondary line-through'}`}
                    >
                      {exp.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {game.notes && (
            <div className="glass-light rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote size={16} className="text-primary" />
                <span className="text-sm font-semibold text-text-primary">Notes</span>
              </div>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{game.notes}</p>
            </div>
          )}

          {/* Recent Plays — always show header with log link */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">Recent Plays</h2>
              <button
                onClick={() => navigate(`/game/${game.id}/log-play`)}
                className="text-xs text-primary"
              >
                + Log past play
              </button>
            </div>
            {recentPlays.length > 0 && (
              <div className="flex flex-col gap-2">
                {recentPlays.map((log) => (
                  <PlayLogEntry
                    key={log.id}
                    log={log}
                    showGameName={false}
                    onClick={() => setSelectedLog(log)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Play Log Detail sheet */}
      <PlayLogDetail
        log={selectedLog}
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={`Delete ${game.name}?`}
        description="This will permanently remove this game and all its data. This cannot be undone."
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
