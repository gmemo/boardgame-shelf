import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ToggleOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface ToggleGroupProps<T extends string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId?: string;
}

export default function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  layoutId = 'toggle-group',
}: ToggleGroupProps<T>) {
  return (
    <div className="glass-light rounded-full p-1 flex">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className="relative flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors z-[1]"
          style={{
            color:
              value === option.value
                ? 'var(--background)'
                : 'var(--text-secondary)',
          }}
        >
          {value === option.value && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 bg-primary rounded-full"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{ zIndex: -1 }}
            />
          )}
          {option.icon}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
