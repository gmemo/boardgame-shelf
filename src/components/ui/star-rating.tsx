import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number | null) => void;
  size?: number;
}

export default function StarRating({ value, onChange, size = 20 }: StarRatingProps) {
  const interactive = !!onChange;

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value !== null && star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => {
              if (!onChange) return;
              onChange(value === star ? null : star);
            }}
            className={`transition-all ${interactive ? 'active:scale-90 cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              size={size}
              className={filled ? 'fill-warning text-warning' : 'text-text-secondary/30'}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
