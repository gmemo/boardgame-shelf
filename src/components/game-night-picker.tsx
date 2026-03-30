import { useState, useMemo, useCallback } from 'react';
import { X, Minus, Plus, Dices, Shuffle, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore, useTagStore, SYSTEM_TAG_IDS } from '../stores';
import { filterGames } from '../lib/filter-games';
import type { BoardGame } from '../types';
import { useScrollLock } from '../lib/use-scroll-lock';

interface GameNightPickerProps {
  open: boolean;
  onClose: () => void;
}

const TIME_PRESETS = [
  { label: '30m', value: 30 },
  { label: '60m', value: 60 },
  { label: '90m', value: 90 },
  { label: '120m', value: 120 },
  { label: 'Any', value: null },
];

function formatGameList(games: BoardGame[]): string {
  const lines = games.map(
    (g) =>
      `• ${g.name} (${g.minPlayers === g.maxPlayers ? g.minPlayers : `${g.minPlayers}-${g.maxPlayers}`}p, ${g.playTimeMinutes}min)`
  );
  return `Games for tonight:\n${lines.join('\n')}`;
}

export default function GameNightPicker({ open, onClose }: GameNightPickerProps) {
  const navigate = useNavigate();
  const { games } = useGameStore();
  const { tags } = useTagStore();

  const [playerCount, setPlayerCount] = useState<number>(2);
  const [maxPlayTime, setMaxPlayTime] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [pickedGame, setPickedGame] = useState<BoardGame | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  useScrollLock(open);

  const filterableTags = useMemo(
    () =>
      tags.filter(
        (t) =>
          t.id !== SYSTEM_TAG_IDS.NEW &&
          t.id !== SYSTEM_TAG_IDS.NOT_PLAYED_RECENTLY,
      ),
    [tags],
  );

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }, []);

  const results = useMemo(
    () =>
      filterGames(games, {
        playerCount,
        maxPlayTime,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      }),
    [games, playerCount, maxPlayTime, selectedTagIds],
  );

  const pickRandom = () => {
    if (results.length === 0) return;
    const idx = Math.floor(Math.random() * results.length);
    setPickedGame(results[idx]);
  };

  const handleSelectGame = (game: BoardGame) => {
    onClose();
    navigate(`/game/${game.id}`);
  };

  const handleShare = async () => {
    if (results.length === 0) return;
    const text = formatGameList(results);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Game Night', text });
      } catch {
        // User cancelled or not supported
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2000);
      } catch {
        // Clipboard not available
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 glass-strong rounded-t-3xl max-h-[90vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-text-secondary/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-2">
                <Dices size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-text-primary">Game Night</h2>
              </div>
              <button onClick={onClose} className="text-text-secondary">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-8">
              {/* Player Count Stepper */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-text-secondary">Players</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPlayerCount((p) => Math.max(1, p - 1))}
                    className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-secondary active:scale-90 transition-all"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-lg font-bold text-text-primary w-6 text-center">
                    {playerCount}
                  </span>
                  <button
                    onClick={() => setPlayerCount((p) => Math.min(20, p + 1))}
                    className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-secondary active:scale-90 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Play Time Presets */}
              <div className="mb-4">
                <span className="text-sm font-medium text-text-secondary block mb-2">
                  Max Play Time
                </span>
                <div className="flex gap-2">
                  {TIME_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setMaxPlayTime(preset.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all flex-1 ${
                        maxPlayTime === preset.value
                          ? 'bg-primary text-white tag-glow'
                          : 'glass-pill text-text-secondary'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* More filters collapsible */}
              <div className="mb-4">
                <button
                  onClick={() => setShowMoreFilters((v) => !v)}
                  className="flex items-center justify-between w-full text-sm font-medium text-text-secondary glass-pill px-4 py-2.5 rounded-xl"
                >
                  <span>More Filters</span>
                  {showMoreFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showMoreFilters && filterableTags.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs text-text-secondary block mb-2">Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {filterableTags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                            selectedTagIds.includes(tag.id)
                              ? 'bg-primary text-white tag-glow'
                              : 'glass-pill text-text-secondary'
                          }`}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions row */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={pickRandom}
                  disabled={results.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-white py-3 font-medium active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Shuffle size={18} />
                  Pick one ({results.length})
                </button>

                {results.length > 0 && (
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 rounded-xl glass-pill px-4 py-3 font-medium text-text-secondary active:scale-95 transition-all"
                  >
                    <Share2 size={18} />
                    {shareStatus === 'copied' ? 'Copied!' : 'Share'}
                  </button>
                )}
              </div>

              {/* Random Pick Highlight */}
              <AnimatePresence mode="wait">
                {pickedGame && (
                  <motion.div
                    key={pickedGame.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="mb-4"
                  >
                    <button
                      onClick={() => handleSelectGame(pickedGame)}
                      className="w-full glass rounded-2xl overflow-hidden border-2 border-primary depth-float text-left"
                    >
                      <div className="flex items-center gap-3 p-4">
                        {pickedGame.imageUrl ? (
                          <img
                            src={pickedGame.imageUrl}
                            alt={pickedGame.name}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-surface flex items-center justify-center">
                            <span className="text-2xl font-bold text-text-secondary/20">
                              {pickedGame.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-primary truncate">
                            {pickedGame.name}
                          </p>
                          <p className="text-xs text-text-secondary mt-0.5">
                            {pickedGame.minPlayers}–{pickedGame.maxPlayers} players ·{' '}
                            {pickedGame.playTimeMinutes} min
                          </p>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results List */}
              <div className="flex flex-col gap-1">
                {results.slice(0, 5).map((game) => (
                  <button
                    key={game.id}
                    onClick={() => handleSelectGame(game)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all active:scale-[0.98] ${
                      pickedGame?.id === game.id
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-surface-light'
                    }`}
                  >
                    {game.imageUrl ? (
                      <img
                        src={game.imageUrl}
                        alt={game.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                        <span className="text-sm font-bold text-text-secondary/30">
                          {game.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {game.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {game.minPlayers}–{game.maxPlayers} players · {game.playTimeMinutes} min
                      </p>
                    </div>
                  </button>
                ))}
                {results.length === 0 && (
                  <p className="text-sm text-text-secondary text-center py-6">
                    No games match these filters
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
