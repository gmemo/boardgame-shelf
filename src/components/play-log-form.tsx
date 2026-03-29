import { useState } from 'react';
import { ChevronLeft, Plus, X, Dices } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { BoardGame } from '../types';
import { usePlayLogStore, useGameStore } from '../stores';
import Button from './ui/button';
import Input from './ui/input';
import Textarea from './ui/textarea';
import GamePicker from './game-picker';

interface PlayLogFormProps {
  gameId?: string;
  onComplete?: () => void;
}

export default function PlayLogForm({ gameId, onComplete }: PlayLogFormProps) {
  const navigate = useNavigate();
  const { games } = useGameStore();
  const { addPlayLog } = usePlayLogStore();

  const preselectedGame = gameId ? games.find((g) => g.id === gameId) : undefined;
  const [selectedGame, setSelectedGame] = useState<BoardGame | undefined>(preselectedGame);
  const [showPicker, setShowPicker] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [playerNames, setPlayerNames] = useState<string[]>(['']);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  const validPlayers = playerNames.filter((n) => n.trim());

  const canSave = selectedGame && date;

  const addPlayer = () => setPlayerNames((prev) => [...prev, '']);

  const updatePlayer = (index: number, value: string) => {
    setPlayerNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  };

  const removePlayer = (index: number) => {
    const removed = playerNames[index];
    setPlayerNames((prev) => prev.filter((_, i) => i !== index));
    if (winnerName === removed) setWinnerName(null);
  };

  const handleSave = () => {
    if (!selectedGame) return;

    addPlayLog({
      gameId: selectedGame.id,
      date,
      playerNames: validPlayers,
      winnerName,
      duration: duration ? parseInt(duration, 10) : null,
      notes: notes.trim(),
      categories: [],
      playerScores: [],
    });

    if (onComplete) {
      onComplete();
    } else {
      navigate('/plays', { replace: true });
    }
  };

  const handleBack = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="glass-strong px-4 py-3 flex items-center gap-3">
        <button onClick={handleBack} className="text-text-secondary">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-text-primary">Log Play</h1>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="flex flex-col gap-5">
          {/* Game Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Game</label>
            {selectedGame ? (
              <button
                onClick={() => !gameId && setShowPicker(true)}
                className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 border border-border text-left"
              >
                {selectedGame.imageUrl ? (
                  <img
                    src={selectedGame.imageUrl}
                    alt={selectedGame.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center">
                    <Dices size={18} className="text-text-secondary/40" />
                  </div>
                )}
                <span className="text-sm font-medium text-text-primary flex-1">
                  {selectedGame.name}
                </span>
                {!gameId && (
                  <span className="text-xs text-text-secondary">Change</span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowPicker(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-surface px-4 py-4 border border-dashed border-border text-text-secondary hover:border-primary hover:text-primary transition-colors"
              >
                <Dices size={18} />
                <span className="text-sm">Select a game</span>
              </button>
            )}
          </div>

          {/* Date */}
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          {/* Players */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Players</label>
            <div className="flex flex-col gap-2">
              {playerNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Player ${i + 1}`}
                    value={name}
                    onChange={(e) => updatePlayer(i, e.target.value)}
                    className="flex-1 rounded-xl glass-input px-4 py-3 text-base text-text-primary placeholder:text-text-secondary/50 focus:outline-none transition-colors"
                  />
                  {playerNames.length > 1 && (
                    <button
                      onClick={() => removePlayer(i)}
                      className="text-text-secondary hover:text-danger transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addPlayer}
                className="flex items-center gap-1.5 text-sm text-primary py-1"
              >
                <Plus size={16} />
                Add Player
              </button>
            </div>
          </div>

          {/* Winner */}
          {validPlayers.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Winner</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setWinnerName(null)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    winnerName === null
                      ? 'bg-primary text-white tag-glow'
                      : 'glass-pill text-text-secondary'
                  }`}
                >
                  None
                </button>
                {validPlayers.map((name) => (
                  <button
                    key={name}
                    onClick={() => setWinnerName(name)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      winnerName === name
                        ? 'bg-primary text-white tag-glow'
                        : 'glass-pill text-text-secondary'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Duration */}
          <Input
            label="Duration (minutes)"
            type="number"
            inputMode="numeric"
            placeholder="e.g. 60"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />

          {/* Notes */}
          <Textarea
            label="Notes"
            placeholder="How was the game?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Sticky Save */}
      <div className="fixed bottom-0 inset-x-0 glass-strong p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button
          className="w-full"
          size="lg"
          disabled={!canSave}
          onClick={handleSave}
        >
          Save Play
        </Button>
      </div>

      <GamePicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={setSelectedGame}
      />
    </div>
  );
}
