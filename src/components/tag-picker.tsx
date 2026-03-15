import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, Plus, X } from 'lucide-react';
import { useTagStore, SYSTEM_TAG_IDS } from '../stores';
import type { Tag } from '../types';
import Input from './ui/input';
import IconButton from './ui/icon-button';

interface TagPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

// System tags that are auto-managed and shouldn't appear in the picker
const HIDDEN_SYSTEM_TAGS: string[] = [SYSTEM_TAG_IDS.NEW, SYSTEM_TAG_IDS.NOT_PLAYED_RECENTLY];

export default function TagPicker({ selectedIds, onChange }: TagPickerProps) {
  const { tags, addTag } = useTagStore();
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const visibleTags = tags.filter((t) => !HIDDEN_SYSTEM_TAGS.includes(t.id));

  const grouped: Record<string, Tag[]> = {
    system: visibleTags.filter((t) => t.type === 'system'),
    default: visibleTags.filter((t) => t.type === 'default'),
    custom: visibleTags.filter((t) => t.type === 'custom'),
  };

  const toggle = (tagId: string) => {
    onChange(
      selectedIds.includes(tagId)
        ? selectedIds.filter((id) => id !== tagId)
        : [...selectedIds, tagId],
    );
  };

  const handleCreateTag = () => {
    const name = newTagName.trim();
    if (!name) return;
    const existing = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!selectedIds.includes(existing.id)) toggle(existing.id);
    } else {
      const tag = addTag(name, 'custom');
      onChange([...selectedIds, tag.id]);
    }
    setNewTagName('');
  };

  const renderGroup = (label: string, groupTags: Tag[]) => {
    if (groupTags.length === 0) return null;
    return (
      <div key={label}>
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
          {label}
        </p>
        <div className="flex flex-wrap gap-2">
          {groupTags.map((tag) => {
            const selected = selectedIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all active:scale-95 ${
                  selected
                    ? 'bg-primary text-white tag-glow'
                    : 'glass-pill text-text-secondary'
                }`}
              >
                {selected && <Check size={14} />}
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-secondary">Tags</label>

      {/* Selected tags preview */}
      <div className="flex flex-wrap gap-1.5 min-h-[2rem] items-center">
        {selectedIds.map((id) => {
          const tag = tags.find((t) => t.id === id);
          if (!tag || HIDDEN_SYSTEM_TAGS.includes(id)) return null;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full bg-primary/20 text-primary px-2.5 py-1 text-xs font-medium"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => toggle(id)}
                className="hover:text-danger transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          );
        })}
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full glass-pill px-3 py-1 text-xs font-medium text-text-secondary hover:text-primary transition-colors"
            >
              <Plus size={14} />
              Add Tag
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 glass rounded-t-2xl p-6 max-h-[70vh] overflow-y-auto depth-float">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-semibold text-text-primary">
                  Select Tags
                </Dialog.Title>
                <IconButton size="sm" onClick={() => setOpen(false)}>
                  <X size={18} />
                </IconButton>
              </div>

              <div className="flex gap-2 mb-5">
                <Input
                  placeholder="Create new tag..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  className="shrink-0 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all self-end"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {renderGroup('System', grouped.system)}
                {renderGroup('Categories', grouped.default)}
                {renderGroup('Custom', grouped.custom)}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}
