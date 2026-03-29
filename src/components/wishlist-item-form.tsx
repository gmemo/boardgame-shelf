import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import type { BoardGame, WishlistItem } from '../types';
import { useWishlistStore } from '../stores';
import Button from './ui/button';
import Input from './ui/input';
import Textarea from './ui/textarea';
import ToggleGroup from './ui/toggle-group';
import GamePicker from './game-picker';
import TagPicker from './tag-picker';
import IconButton from './ui/icon-button';
import ImagePicker from './ui/image-picker';

type ItemType = 'game' | 'expansion';

const TYPE_OPTIONS: { value: ItemType; label: string }[] = [
  { value: 'game', label: 'Game' },
  { value: 'expansion', label: 'Expansion' },
];

interface WishlistItemFormProps {
  item?: WishlistItem;
}

function hasGameDetails(item?: WishlistItem) {
  return (
    item?.minPlayers != null ||
    item?.maxPlayers != null ||
    item?.playTimeMinutes != null ||
    item?.complexity != null
  );
}

function hasPurchaseInfo(item?: WishlistItem) {
  return !!(item?.price || item?.store || item?.link);
}

export default function WishlistItemForm({ item }: WishlistItemFormProps) {
  const navigate = useNavigate();
  const { addItem, updateItem } = useWishlistStore();
  const isEdit = !!item;

  const [imageUrl, setImageUrl] = useState<string | null>(item?.imageUrl ?? null);
  const [name, setName] = useState(item?.name ?? '');
  const [type, setType] = useState<ItemType>(item?.type ?? 'game');
  const [linkedGameId, setLinkedGameId] = useState<string | null>(item?.linkedGameId ?? null);
  const [linkedGameName, setLinkedGameName] = useState<string>('');
  // Note: linkedGameName starts empty on edit (shows "Selected" instead of the game name).
  // This is acceptable for this initial implementation — the link itself is preserved.
  const [showGamePicker, setShowGamePicker] = useState(false);

  // Optional game details
  const [showGameDetails, setShowGameDetails] = useState(() => hasGameDetails(item));
  const [minPlayers, setMinPlayers] = useState<string>(item?.minPlayers?.toString() ?? '');
  const [maxPlayers, setMaxPlayers] = useState<string>(item?.maxPlayers?.toString() ?? '');
  const [playTimeMinutes, setPlayTimeMinutes] = useState<string>(item?.playTimeMinutes?.toString() ?? '');
  const [complexity, setComplexity] = useState<number | null>(item?.complexity ?? null);

  // Purchase info
  const [showPurchaseInfo, setShowPurchaseInfo] = useState(() => hasPurchaseInfo(item));
  const [price, setPrice] = useState(item?.price ?? '');
  const [store, setStore] = useState(item?.store ?? '');
  const [link, setLink] = useState(item?.link ?? '');

  // Notes
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [quickRulesNotes, setQuickRulesNotes] = useState(item?.quickRulesNotes ?? '');
  const [tagIds, setTagIds] = useState<string[]>(item?.tagIds ?? []);

  const handleSelectGame = (game: BoardGame) => {
    setLinkedGameId(game.id);
    setLinkedGameName(game.name);
    setShowGamePicker(false);
  };

  const handleSave = () => {
    const trimName = name.trim();
    if (!trimName) return;

    const data: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'> = {
      name: trimName,
      imageUrl,
      type,
      linkedGameId: type === 'expansion' ? linkedGameId : null,
      minPlayers: minPlayers ? parseInt(minPlayers, 10) : null,
      maxPlayers: maxPlayers ? parseInt(maxPlayers, 10) : null,
      playTimeMinutes: playTimeMinutes ? parseInt(playTimeMinutes, 10) : null,
      complexity: complexity as WishlistItem['complexity'],
      price: price.trim(),
      store: store.trim(),
      link: link.trim(),
      notes: notes.trim(),
      quickRulesNotes: quickRulesNotes.trim(),
      tagIds,
    };

    if (isEdit) {
      updateItem(item.id, data);
      navigate(-1);
    } else {
      addItem(data);
      navigate('/wishlist', { replace: true });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="ambient-glow" />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 bg-gradient-to-b from-background from-60% to-transparent sticky top-0 z-10">
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
          {/* Image */}
          <ImagePicker value={imageUrl} onChange={setImageUrl} />

          {/* Name */}
          <Input
            label="Name"
            placeholder="Game or expansion name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Type</label>
            <ToggleGroup
              options={TYPE_OPTIONS}
              value={type}
              onChange={setType}
              layoutId="wishlist-type"
            />
          </div>

          {/* Linked game — expansion only */}
          {type === 'expansion' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Linked Game (optional)</label>
              <button
                onClick={() => setShowGamePicker(true)}
                className="flex items-center gap-3 rounded-xl glass-input px-4 py-3 text-left"
              >
                {linkedGameId ? (
                  <span className="text-sm text-text-primary">{linkedGameName || 'Selected'}</span>
                ) : (
                  <span className="text-sm text-text-secondary/70">Select game (optional)</span>
                )}
              </button>
            </div>
          )}

          {/* ── Collapsible: Game Details ── */}
          <button
            onClick={() => setShowGameDetails((v) => !v)}
            className="flex items-center justify-between text-sm font-medium text-text-secondary glass-pill px-4 py-2.5 rounded-xl"
          >
            <span>Game Details</span>
            {showGameDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showGameDetails && (
            <div className="flex flex-col gap-4 -mt-2">
              <div className="flex gap-3">
                <Input
                  label="Min Players"
                  type="number"
                  inputMode="numeric"
                  placeholder="1"
                  value={minPlayers}
                  onChange={(e) => setMinPlayers(e.target.value)}
                />
                <Input
                  label="Max Players"
                  type="number"
                  inputMode="numeric"
                  placeholder="4"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                />
              </div>
              <Input
                label="Play Time (minutes)"
                type="number"
                inputMode="numeric"
                placeholder="60"
                value={playTimeMinutes}
                onChange={(e) => setPlayTimeMinutes(e.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Complexity</label>
                <div className="flex gap-2">
                  {([1, 2, 3, 4, 5] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setComplexity(complexity === v ? null : v)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                        complexity === v
                          ? 'bg-primary text-white tag-glow'
                          : 'glass-pill text-text-secondary'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Collapsible: Purchase Info ── */}
          <button
            onClick={() => setShowPurchaseInfo((v) => !v)}
            className="flex items-center justify-between text-sm font-medium text-text-secondary glass-pill px-4 py-2.5 rounded-xl"
          >
            <span>Purchase Info</span>
            {showPurchaseInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showPurchaseInfo && (
            <div className="flex flex-col gap-4 -mt-2">
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
            </div>
          )}

          {/* Notes + Quick Note */}
          <Textarea
            label="Notes"
            placeholder="Why you want it..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Textarea
            label="Quick Note"
            placeholder="e.g. saw it at Dragon's Lair, booth 12"
            value={quickRulesNotes}
            onChange={(e) => setQuickRulesNotes(e.target.value)}
          />

          <TagPicker selectedIds={tagIds} onChange={setTagIds} />
        </div>
      </div>

      {/* Sticky Save */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] glass-strong z-10">
        <Button className="w-full" size="lg" onClick={handleSave} disabled={!name.trim()}>
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
