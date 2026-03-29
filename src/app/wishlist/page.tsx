import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Plus } from 'lucide-react';
import { useWishlistStore } from '../../stores';
import WishlistItemCard from '../../components/wishlist-item-card';
import EmptyState from '../../components/ui/empty-state';

type FilterType = 'all' | 'game' | 'expansion';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'game', label: 'Games' },
  { value: 'expansion', label: 'Expansions' },
];

export default function WishlistPage() {
  const navigate = useNavigate();
  const { items } = useWishlistStore();
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => i.type === filter);
  }, [items, filter]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary">Wishlist</h1>
            {items.length > 0 && (
              <span className="text-xs font-medium text-text-secondary glass-pill px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </div>
        </div>

        {/* Filter pills */}
        {items.length > 0 && (
          <div className="flex gap-2 mt-3">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === opt.value
                    ? 'bg-primary text-white tag-glow'
                    : 'glass-pill text-text-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {items.length === 0 ? (
          <EmptyState
            icon={<Bookmark size={48} strokeWidth={1.5} />}
            title="No items yet"
            description="Add games or expansions you want to buy to your wishlist."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No matches"
            description="No items match the selected filter."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item) => (
              <WishlistItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/wishlist/new')}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center fab-halo active:scale-95 transition-transform z-30"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
