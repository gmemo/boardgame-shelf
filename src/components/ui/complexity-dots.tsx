interface ComplexityDotsProps {
  value: 1 | 2 | 3 | 4 | 5;
  onChange?: (value: 1 | 2 | 3 | 4 | 5) => void;
  size?: 'sm' | 'md';
}

export default function ComplexityDots({ value, onChange, size = 'md' }: ComplexityDotsProps) {
  const interactive = !!onChange;
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  const gap = size === 'sm' ? 'gap-1' : 'gap-1.5';

  return (
    <div className={`inline-flex items-center ${gap}`}>
      {([1, 2, 3, 4, 5] as const).map((dot) => {
        const filled = dot <= value;
        return (
          <button
            key={dot}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(dot)}
            className={`rounded-full transition-all ${dotSize} ${
              filled ? 'bg-primary' : 'bg-text-secondary/20'
            } ${interactive ? 'cursor-pointer active:scale-90' : 'cursor-default'}`}
          />
        );
      })}
    </div>
  );
}
