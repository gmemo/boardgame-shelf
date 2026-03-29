import { useNavigate } from 'react-router-dom';
import type { WishlistItem } from '../types';

interface WishlistItemCardProps {
  item: WishlistItem;
}

export default function WishlistItemCard({ item }: WishlistItemCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/wishlist/${item.id}`)}
      className="glass rounded-2xl overflow-hidden text-left transition-all active:scale-[0.97] card-active-glow depth-1 flex flex-col w-full"
    >
      {/* Image */}
      <div className="relative aspect-[3/2] max-h-32 bg-surface overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-text-secondary/15">
              {item.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Type badge */}
        <span
          className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            item.type === 'expansion'
              ? 'bg-surface/80 text-text-secondary'
              : 'bg-primary/80 text-white'
          }`}
        >
          {item.type === 'expansion' ? 'Exp' : 'Game'}
        </span>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-sm font-semibold text-text-primary truncate">{item.name}</p>
        {item.price ? (
          <p className="text-xs text-text-secondary">{item.price}</p>
        ) : null}
      </div>
    </button>
  );
}
