import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function SearchBar({ value, onChange, placeholder = 'Search games...', autoFocus }: SearchBarProps) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleChange = (v: string) => {
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 300);
  };

  const clear = () => {
    setLocal('');
    onChange('');
  };

  return (
    <div className="relative">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
      <input
        ref={inputRef}
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl glass-input pl-10 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none transition-colors"
      />
      {local && (
        <button
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
