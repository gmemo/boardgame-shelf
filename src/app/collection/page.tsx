import { useNavigate } from 'react-router-dom';
import { Plus, Library, ArrowUpDown, Dices } from 'lucide-react';
import { useCollectionFilter, type SortField } from '../../lib/use-collection-filter';
import { useCollectionFilterStore } from '../../stores';
import GameCard from '../../components/game-card';
import Button from '../../components/ui/button';
import EmptyState from '../../components/ui/empty-state';
import GameNightPicker from '../../components/game-night-picker';
import { useGameStore } from '../../stores';
import { useState } from 'react';

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'recentlyAdded', label: 'Recent' },
  { value: 'name', label: 'Name' },
  { value: 'rating', label: 'Rating' },
  { value: 'complexity', label: 'Complexity' },
  { value: 'playTime', label: 'Play Time' },
];

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
  const { isSearchOpen } = useCollectionFilterStore();
  const [showSort, setShowSort] = useState(false);
  const [showNightPicker, setShowNightPicker] = useState(false);

  const handleSortToggle = (field: SortField) => {
    if (filters.sortBy === field) {
      setSortDirection(filters.sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
    setShowSort(false);
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
      {/* Header — title + count + sort only */}
      <div className="sticky top-0 z-10 glass-strong px-4 pt-4 pb-3 header-fade">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">Collection</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNightPicker(true)}
              className="flex items-center gap-1 text-primary hover:text-primary-dark transition-colors"
              title="Game Night"
            >
              <Dices size={18} />
            </button>
            <span className="text-xs text-text-secondary">{filteredGames.length} games</span>
            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors text-xs"
              >
                <ArrowUpDown size={14} />
                {SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label}
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
          <div className="grid grid-cols-2 gap-3 pb-4">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </div>

      {/* FAB — hidden when search is open */}
      {!isSearchOpen && (
        <button
          onClick={() => navigate('/game/new')}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center fab-halo active:scale-90 transition-all z-10"
        >
          <Plus size={24} />
        </button>
      )}

      <GameNightPicker open={showNightPicker} onClose={() => setShowNightPicker(false)} />
    </div>
  );
}
