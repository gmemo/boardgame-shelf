import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { BoardGame, WishlistItem } from '../types';
import { useWishlistStore } from '../stores';
import Button from './ui/button';
import Input from './ui/input';
import Textarea from './ui/textarea';
import ToggleGroup from './ui/toggle-group';
import GamePicker from './game-picker';
import TagPicker from './tag-picker';
import IconButton from './ui/icon-button';

type ItemType = 'game' | 'expansion';

const TYPE_OPTIONS: { value: ItemType; label: string }[] = [
  { value: 'game', label: 'Game' },
  { value: 'expansion', label: 'Expansion' },
];

interface WishlistItemFormProps {
  item?: WishlistItem;
}

export default function WishlistItemForm({ item }: WishlistItemFormProps) {
  const navigate = useNavigate();
  const { addItem, updateItem } = useWishlistStore();
  const isEdit = !!item;

  const [name, setName] = useState(item?.name ?? '');
  const [type, setType] = useState<ItemType>(item?.type ?? 'game');
  const [linkedGameId, setLinkedGameId] = useState<string | null>(item?.linkedGameId ?? null);
  const [linkedGameName, setLinkedGameName] = useState<string>('');
  const [showGamePicker, setShowGamePicker] = useState(false);
  const [price, setPrice] = useState(item?.price ?? '');
  const [store, setStore] = useState(item?.store ?? '');
  const [link, setLink] = useState(item?.link ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [tagIds, setTagIds] = useState<string[]>(item?.tagIds ?? []);

  const handleSelectGame = (game: BoardGame) => {
    setLinkedGameId(game.id);
    setLinkedGameName(game.name);
    setShowGamePicker(false);
  };

  const handleSave = () => {
    const trimName = name.trim();
    if (!trimName) return;

    const data = {
      name: trimName,
      type,
      linkedGameId: type === 'expansion' ? linkedGameId : null,
      price: price.trim(),
      store: store.trim(),
      link: link.trim(),
      notes: notes.trim(),
      tagIds,
    };

    if (isEdit) {
      updateItem(item.id, data);
    } else {
      addItem(data);
    }
    navigate('/wishlist', { replace: true });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Ambient glow */}
      <div className="ambient-glow" />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 bg-background sticky top-0 z-10 relative">
        <IconButton onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </IconButton>
        <h1 className="text-lg font-semibold text-text-primary">
          {isEdit ? 'Edit Item' : 'New Wishlist Item'}
        </h1>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto relative z-[1]">
        <div className="flex flex-col gap-5 p-4 pb-28">
          <Input
            label="Name"
            placeholder="Game or expansion name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Type</label>
            <ToggleGroup
              options={TYPE_OPTIONS}
              value={type}
              onChange={setType}
              layoutId="wishlist-type"
            />
          </div>

          {/* Linked Game — only for expansions */}
          {type === 'expansion' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">
                Linked Game (optional)
              </label>
              <button
                onClick={() => setShowGamePicker(true)}
                className="flex items-center gap-3 rounded-xl glass-input px-4 py-3 text-left"
              >
                {linkedGameId ? (
                  <span className="text-sm text-text-primary">
                    {linkedGameName || 'Selected'}
                  </span>
                ) : (
                  <span className="text-sm text-text-secondary/70">
                    Select Game (optional)
                  </span>
                )}
              </button>
            </div>
          )}

          <Input
            label="Price (optional)"
            placeholder="e.g. €24.99"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <Input
            label="Store (optional)"
            placeholder="e.g. Amazon, FLGS"
            value={store}
            onChange={(e) => setStore(e.target.value)}
          />

          <Input
            label="Link (optional)"
            type="url"
            placeholder="https://..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />

          <Textarea
            label="Notes"
            placeholder="Why you want it, notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <TagPicker selectedIds={tagIds} onChange={setTagIds} />
        </div>
      </div>

      {/* Sticky Save */}
      <div className="fixed bottom-0 left-0 right-0 p-4 glass-strong z-10">
        <Button
          className="w-full"
          size="lg"
          onClick={handleSave}
          disabled={!name.trim()}
        >
          {isEdit ? 'Save Changes' : 'Add to Wishlist'}
        </Button>
      </div>

      <GamePicker
        open={showGamePicker}
        onClose={() => setShowGamePicker(false)}
        onSelect={handleSelectGame}
      />
    </div>
  );
}
