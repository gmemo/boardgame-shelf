import { useNavigate } from 'react-router-dom';
import { Plus, Library, ArrowUpDown, Dices, Share2, X } from 'lucide-react';
import { useCollectionFilter, type SortField } from '../../lib/use-collection-filter';
import GameCard from '../../components/game-card';
import Button from '../../components/ui/button';
import EmptyState from '../../components/ui/empty-state';
import GameNightPicker from '../../components/game-night-picker';
import { useGameStore } from '../../stores';
import { useState, useRef, useCallback } from 'react';
import type { BoardGame } from '../../types';

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'recentlyAdded', label: 'Recent' },
  { value: 'name', label: 'Name' },
  { value: 'rating', label: 'Rating' },
  { value: 'complexity', label: 'Complexity' },
  { value: 'playTime', label: 'Play Time' },
];

function formatGameListShare(games: BoardGame[]): string {
  const lines = games.map(
    (g) =>
      `• ${g.name} (${g.minPlayers === g.maxPlayers ? g.minPlayers : `${g.minPlayers}-${g.maxPlayers}`}p, ${g.playTimeMinutes}min)`
  );
  return `My board games:\n${lines.join('\n')}`;
}

export default function CollectionPage() {
  const navigate = useNavigate();
  const { games } = useGameStore();
  const {
    filters,
    setSortBy,
    setSortDirection,
    resetFilters,
    hasActiveFilters,
    filteredGames,
  } = useCollectionFilter();
  const [showSort, setShowSort] = useState(false);
  const [showNightPicker, setShowNightPicker] = useState(false);

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  const longPressTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const handleSortToggle = (field: SortField) => {
    if (filters.sortBy === field) {
      setSortDirection(filters.sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
    setShowSort(false);
  };

  const handlePointerDown = useCallback((gameId: string) => {
    const timer = setTimeout(() => {
      setSelectMode(true);
      setSelectedIds(new Set([gameId]));
      longPressTimers.current.delete(gameId);
    }, 500);
    longPressTimers.current.set(gameId, timer);
  }, []);

  const handlePointerUp = useCallback((gameId: string) => {
    const timer = longPressTimers.current.get(gameId);
    if (timer) {
      clearTimeout(timer);
      longPressTimers.current.delete(gameId);
    }
  }, []);

  const handlePointerLeave = useCallback((gameId: string) => {
    const timer = longPressTimers.current.get(gameId);
    if (timer) {
      clearTimeout(timer);
      longPressTimers.current.delete(gameId);
    }
  }, []);

  const toggleSelect = useCallback((gameId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      return next;
    });
  }, []);

  const handleCardClick = useCallback(
    (game: BoardGame) => {
      if (selectMode) {
        toggleSelect(game.id);
      } else {
        navigate(`/game/${game.id}`);
      }
    },
    [selectMode, toggleSelect, navigate]
  );

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleShareSelected = async () => {
    const selectedGames = filteredGames.filter((g) => selectedIds.has(g.id));
    if (selectedGames.length === 0) return;
    const text = formatGameListShare(selectedGames);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Board Games', text });
      } catch {
        // cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2000);
      } catch {
        // not available
      }
    }
  };

  if (games.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <EmptyState
          icon={<Library size={48} strokeWidth={1.5} />}
          title="No games yet"
          description="Start building your collection by adding your first board game."
          action={
            <Button onClick={() => navigate('/game/new')}>
              <Plus size={18} />
              Add First Game
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header — title + actions */}
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-gradient-to-b from-background from-60% to-transparent">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">Collection</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-secondary">{filteredGames.length} games</span>
            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center justify-center w-9 h-9 rounded-full glass-pill text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowUpDown size={18} />
              </button>
              {showSort && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                  <div className="absolute right-0 top-full mt-2 z-20 glass-strong rounded-xl depth-float py-1 min-w-[140px]">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleSortToggle(opt.value)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          filters.sortBy === opt.value
                            ? 'text-primary font-medium'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {opt.label}
                        {filters.sortBy === opt.value && (
                          <span className="ml-1 text-xs">
                            {filters.sortDirection === 'asc' ? '\u2191' : '\u2193'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setShowNightPicker(true)}
              className="flex items-center justify-center w-9 h-9 rounded-full glass-pill text-text-secondary hover:text-primary transition-colors"
              title="Game Night"
            >
              <Dices size={18} />
            </button>
            <button
              onClick={() => navigate('/game/new')}
              className="flex items-center justify-center w-9 h-9 rounded-full glass-pill text-text-secondary hover:text-primary transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredGames.length === 0 ? (
          <EmptyState
            title="No matches"
            description="No games match your current filters."
            action={
              hasActiveFilters ? (
                <Button variant="secondary" onClick={resetFilters}>
                  Clear Filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-24">
            {filteredGames.map((game) => (
              <div
                key={game.id}
                className="relative"
                onPointerDown={() => handlePointerDown(game.id)}
                onPointerUp={() => handlePointerUp(game.id)}
                onPointerLeave={() => handlePointerLeave(game.id)}
                onClick={() => handleCardClick(game)}
              >
                <GameCard game={game} disableNav={selectMode} />
                {selectMode && (
                  <div
                    className={`absolute inset-0 rounded-2xl border-2 transition-all pointer-events-none ${
                      selectedIds.has(game.id)
                        ? 'border-primary bg-primary/20'
                        : 'border-transparent'
                    }`}
                  >
                    {selectedIds.has(game.id) && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">✓</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Multi-select action bar */}
      {selectMode && (
        <div className="fixed bottom-20 left-4 right-4 z-20 glass-strong rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="flex-1 text-sm font-medium text-text-primary">
            {selectedIds.size} selected
          </span>
          <button
            onClick={handleShareSelected}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-1.5 text-sm text-primary glass-pill px-3 py-1.5 rounded-full disabled:opacity-50"
          >
            <Share2 size={16} />
            {shareStatus === 'copied' ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={exitSelectMode}
            className="text-text-secondary"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <GameNightPicker open={showNightPicker} onClose={() => setShowNightPicker(false)} />
    </div>
  );
}
