import { useTagStore, SYSTEM_TAG_IDS } from '../stores';

interface TagFilterBarProps {
  selectedIds: string[];
  onToggle: (tagId: string) => void;
}

const HIDDEN_FILTER_TAGS: string[] = [SYSTEM_TAG_IDS.NEW, SYSTEM_TAG_IDS.NOT_PLAYED_RECENTLY];

export default function TagFilterBar({ selectedIds, onToggle }: TagFilterBarProps) {
  const { tags } = useTagStore();
  const visibleTags = tags.filter((t) => !HIDDEN_FILTER_TAGS.includes(t.id));

  if (visibleTags.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
      {visibleTags.map((tag) => {
        const active = selectedIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            onClick={() => onToggle(tag.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
              active
                ? 'bg-primary text-white tag-glow'
                : 'glass-pill text-text-secondary'
            }`}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
