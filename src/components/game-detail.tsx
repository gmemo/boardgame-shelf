import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Pencil, Trash2, Users, Clock, BookOpen, StickyNote, Puzzle, CalendarPlus } from 'lucide-react';
import type { BoardGame } from '../types';
import { useGameStore, useTagStore, usePlayLogStore, SYSTEM_TAG_IDS } from '../stores';
import IconButton from './ui/icon-button';
import Badge from './ui/badge';
import StarRating from './ui/star-rating';
import ComplexityDots from './ui/complexity-dots';
import ConfirmDialog from './ui/confirm-dialog';
import Button from './ui/button';
import PlayLogEntry from './play-log-entry';

interface GameDetailProps {
  game: BoardGame;
}

export default function GameDetail({ game }: GameDetailProps) {
  const navigate = useNavigate();
  const { deleteGame } = useGameStore();
  const { tags } = useTagStore();
  const { playLogs } = usePlayLogStore();
  const [showDelete, setShowDelete] = useState(false);

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

  const handleDelete = () => {
    deleteGame(game.id);
    navigate('/', { replace: true });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="ambient-glow" />
      {/* Hero / Header */}
      <div className="relative">
        {game.imageUrl ? (
          <div className="relative">
            <img
              src={game.imageUrl}
              alt={game.name}
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </div>
        ) : (
          <div className="w-full aspect-[3/2] bg-surface flex items-center justify-center">
            <span className="text-6xl font-bold text-text-secondary/20">
              {game.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Floating header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2">
          <IconButton
            onClick={() => navigate(-1)}
            className="bg-black/40 text-white hover:bg-black/60"
          >
            <ChevronLeft size={24} />
          </IconButton>
          <div className="flex gap-1">
            <IconButton
              onClick={() => navigate(`/game/${game.id}/edit`)}
              className="bg-black/40 text-white hover:bg-black/60"
            >
              <Pencil size={18} />
            </IconButton>
            <IconButton
              onClick={() => setShowDelete(true)}
              className="bg-black/40 text-white hover:bg-black/60"
            >
              <Trash2 size={18} />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto -mt-8 relative z-[1]">
        <div className="flex flex-col gap-5 p-4 pb-24">
          {/* Title + Rating */}
          <div>
            <div className="flex items-start gap-2">
              <h1 className="text-2xl font-bold text-text-primary flex-1">
                {game.name}
              </h1>
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
                  : `${game.minPlayers}–${game.maxPlayers}`} players
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

          {/* Log Play Button */}
          <Button
            onClick={() => navigate(`/game/${game.id}/log-play`)}
            className="w-full"
          >
            <CalendarPlus size={18} />
            Log Play
          </Button>

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
            <p className="text-sm text-text-secondary leading-relaxed">
              {game.description}
            </p>
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
                      className={`w-2 h-2 rounded-full ${
                        exp.owned ? 'bg-primary' : 'bg-text-secondary/30'
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        exp.owned ? 'text-text-primary' : 'text-text-secondary line-through'
                      }`}
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
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {game.notes}
              </p>
            </div>
          )}

          {/* Recent Plays */}
          {recentPlays.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-3">Recent Plays</h2>
              <div className="flex flex-col gap-2">
                {recentPlays.map((log) => (
                  <PlayLogEntry key={log.id} log={log} showGameName={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={`Delete ${game.name}?`}
        description="This will permanently remove this game and all its data. This cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
