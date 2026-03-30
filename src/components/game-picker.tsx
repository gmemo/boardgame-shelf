import { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { BoardGame } from '../types';
import { useGameStore } from '../stores';
import { useScrollLock } from '../lib/use-scroll-lock';

interface GamePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (game: BoardGame) => void;
}

export default function GamePicker({ open, onClose, onSelect }: GamePickerProps) {
  const { games } = useGameStore();
  const [search, setSearch] = useState('');
  useScrollLock(open);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return games;
    return games.filter(
      (g) => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q),
    );
  }, [games, search]);

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
            className="fixed inset-x-0 bottom-0 z-50 glass-strong rounded-t-3xl max-h-[85vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-text-secondary/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
              <h2 className="text-lg font-bold text-text-primary">Pick a Game</h2>
              <button onClick={onClose} className="text-text-secondary">
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 rounded-xl glass-input px-3 py-2.5">
                <Search size={16} className="text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-base text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 pb-8">
              {filtered.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-8">No games found</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {filtered.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => {
                        onSelect(game);
                        onClose();
                      }}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-surface-light active:scale-[0.98]"
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
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
