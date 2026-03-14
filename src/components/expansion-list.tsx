import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';
import type { Expansion } from '../types';
import Input from './ui/input';

interface ExpansionListProps {
  value: Expansion[];
  onChange: (expansions: Expansion[]) => void;
}

export default function ExpansionList({ value, onChange }: ExpansionListProps) {
  const [newName, setNewName] = useState('');

  const addExpansion = () => {
    const name = newName.trim();
    if (!name) return;
    onChange([...value, { id: crypto.randomUUID(), name, owned: true }]);
    setNewName('');
  };

  const toggleOwned = (id: string) => {
    onChange(value.map((e) => (e.id === id ? { ...e, owned: !e.owned } : e)));
  };

  const remove = (id: string) => {
    onChange(value.filter((e) => e.id !== id));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-secondary">Expansions</label>

      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          {value.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center gap-3 glass-light rounded-xl px-3 py-2.5"
            >
              <Switch.Root
                checked={exp.owned}
                onCheckedChange={() => toggleOwned(exp.id)}
                className="w-9 h-5 rounded-full bg-surface-light data-[state=checked]:bg-primary transition-colors shrink-0"
              >
                <Switch.Thumb className="block w-4 h-4 rounded-full bg-white translate-x-0.5 data-[state=checked]:translate-x-[18px] transition-transform" />
              </Switch.Root>
              <span className={`text-sm flex-1 ${exp.owned ? 'text-text-primary' : 'text-text-secondary line-through'}`}>
                {exp.name}
              </span>
              <button
                type="button"
                onClick={() => remove(exp.id)}
                className="text-text-secondary hover:text-danger transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Add expansion..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addExpansion();
            }
          }}
        />
        <button
          type="button"
          onClick={addExpansion}
          disabled={!newName.trim()}
          className="shrink-0 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all self-end"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
