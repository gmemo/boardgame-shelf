import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { BoardGame, Expansion } from '../types';
import { useGameStore, SYSTEM_TAG_IDS } from '../stores';
import Input from './ui/input';
import Textarea from './ui/textarea';
import Button from './ui/button';
import IconButton from './ui/icon-button';
import ImagePicker from './ui/image-picker';
import StarRating from './ui/star-rating';
import ComplexityDots from './ui/complexity-dots';
import TagPicker from './tag-picker';
import ExpansionList from './expansion-list';

interface GameFormProps {
  game?: BoardGame;
}

interface FormState {
  name: string;
  description: string;
  minPlayers: string;
  maxPlayers: string;
  playTimeMinutes: string;
  complexity: 1 | 2 | 3 | 4 | 5;
  rating: number | null;
  imageUrl: string | null;
  notes: string;
  quickRulesNotes: string;
  tagIds: string[];
  expansions: Expansion[];
}

function gameToForm(game?: BoardGame): FormState {
  if (!game) {
    return {
      name: '',
      description: '',
      minPlayers: '1',
      maxPlayers: '4',
      playTimeMinutes: '60',
      complexity: 3,
      rating: null,
      imageUrl: null,
      notes: '',
      quickRulesNotes: '',
      tagIds: [],
      expansions: [],
    };
  }
  return {
    name: game.name,
    description: game.description,
    minPlayers: String(game.minPlayers),
    maxPlayers: String(game.maxPlayers),
    playTimeMinutes: String(game.playTimeMinutes),
    complexity: game.complexity,
    rating: game.rating,
    imageUrl: game.imageUrl,
    notes: game.notes,
    quickRulesNotes: game.quickRulesNotes,
    tagIds: game.tagIds.filter((id) => id !== SYSTEM_TAG_IDS.NEW),
    expansions: game.expansions,
  };
}

export default function GameForm({ game }: GameFormProps) {
  const navigate = useNavigate();
  const { addGame, updateGame } = useGameStore();
  const [form, setForm] = useState<FormState>(() => gameToForm(game));
  const isEdit = !!game;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = () => {
    const name = form.name.trim();
    if (!name) return;

    const data = {
      name,
      description: form.description.trim(),
      minPlayers: Math.max(1, parseInt(form.minPlayers) || 1),
      maxPlayers: Math.max(1, parseInt(form.maxPlayers) || 4),
      playTimeMinutes: Math.max(1, parseInt(form.playTimeMinutes) || 60),
      complexity: form.complexity,
      rating: form.rating,
      imageUrl: form.imageUrl,
      notes: form.notes.trim(),
      quickRulesNotes: form.quickRulesNotes.trim(),
      tagIds: form.tagIds,
      expansions: form.expansions,
    };

    if (isEdit) {
      updateGame(game.id, data);
      navigate(`/game/${game.id}`, { replace: true });
    } else {
      const newGame = addGame(data);
      navigate(`/game/${newGame.id}`, { replace: true });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <IconButton onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </IconButton>
        <h1 className="text-lg font-semibold text-text-primary">
          {isEdit ? 'Edit Game' : 'Add Game'}
        </h1>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 pb-28">
          <ImagePicker
            value={form.imageUrl}
            onChange={(url) => set('imageUrl', url)}
          />

          <Input
            label="Name"
            placeholder="Game name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />

          <Textarea
            label="Description"
            placeholder="Brief description..."
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={2}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min Players"
              type="number"
              min={1}
              value={form.minPlayers}
              onChange={(e) => set('minPlayers', e.target.value)}
            />
            <Input
              label="Max Players"
              type="number"
              min={1}
              value={form.maxPlayers}
              onChange={(e) => set('maxPlayers', e.target.value)}
            />
          </div>

          <Input
            label="Play Time (min)"
            type="number"
            min={1}
            value={form.playTimeMinutes}
            onChange={(e) => set('playTimeMinutes', e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Complexity</label>
            <ComplexityDots
              value={form.complexity}
              onChange={(v) => set('complexity', v)}
              size="md"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Rating</label>
            <StarRating
              value={form.rating}
              onChange={(v) => set('rating', v)}
              size={28}
            />
          </div>

          <TagPicker
            selectedIds={form.tagIds}
            onChange={(ids) => set('tagIds', ids)}
          />

          <ExpansionList
            value={form.expansions}
            onChange={(exps) => set('expansions', exps)}
          />

          <Textarea
            label="Quick Rules Notes"
            placeholder="Things you always forget..."
            value={form.quickRulesNotes}
            onChange={(e) => set('quickRulesNotes', e.target.value)}
            rows={3}
          />

          <Textarea
            label="Notes"
            placeholder="Any other notes..."
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Sticky Save */}
      <div className="fixed bottom-0 left-0 right-0 p-4 glass-strong z-10">
        <Button
          className="w-full"
          size="lg"
          onClick={handleSave}
          disabled={!form.name.trim()}
        >
          {isEdit ? 'Save Changes' : 'Add Game'}
        </Button>
      </div>
    </div>
  );
}
