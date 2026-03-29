import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { WishlistItem } from '../types';
import { useWishlistStore, useGameStore } from '../stores';
import Button from './ui/button';

interface WishlistItemCardProps {
  item: WishlistItem;
}

export default function WishlistItemCard({ item }: WishlistItemCardProps) {
  const navigate = useNavigate();
  const { deleteItem } = useWishlistStore();
  const { games, addGame } = useGameStore();

  const linkedGame = item.linkedGameId ? games.find((g) => g.id === item.linkedGameId) : null;

  const handleConvert = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newGame = addGame({
      name: item.name,
      description: '',
      minPlayers: 1,
      maxPlayers: 4,
      playTimeMinutes: 60,
      complexity: 3,
      rating: null,
      imageUrl: null,
      notes: item.notes,
      quickRulesNotes: '',
      tagIds: item.tagIds,
      expansions: [],
    });
    deleteItem(item.id);
    navigate(`/game/${newGame.id}/edit`);
  };

  return (
    <div className="glass rounded-2xl p-4 active:scale-[0.97] transition-transform card-active-glow">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-text-primary truncate flex-1">{item.name}</p>
            <span
              className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                item.type === 'game'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-surface text-text-secondary'
              }`}
            >
              {item.type === 'game' ? 'Game' : 'Expansion'}
            </span>
          </div>

          {linkedGame && (
            <p className="text-xs text-text-secondary mb-1">For: {linkedGame.name}</p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {item.price && (
              <span className="text-xs text-text-secondary">{item.price}</span>
            )}
            {item.store && (
              <span className="text-xs text-text-secondary">{item.store}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        {item.type === 'game' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleConvert}
            className="text-xs"
          >
            <ArrowRight size={14} />
            Add to Collection
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/wishlist/${item.id}/edit`)}
          className="text-xs ml-auto"
        >
          Edit
        </Button>
      </div>
    </div>
  );
}
