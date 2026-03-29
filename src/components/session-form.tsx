import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X } from 'lucide-react';
import type { BoardGame, PlaySession } from '../types';
import { useSessionStore, useGameStore } from '../stores';
import Button from './ui/button';
import Input from './ui/input';
import Textarea from './ui/textarea';
import ToggleGroup from './ui/toggle-group';
import GamePicker from './game-picker';
import IconButton from './ui/icon-button';

type SessionStatus = 'active' | 'completed' | 'abandoned';

const STATUS_OPTIONS: { value: SessionStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Abandoned' },
];

interface SessionFormProps {
  session?: PlaySession;
  initialGameId?: string | null;
}

export default function SessionForm({ session, initialGameId }: SessionFormProps) {
  const navigate = useNavigate();
  const { addSession, updateSession } = useSessionStore();
  const { games } = useGameStore();
  const isEdit = !!session;

  const today = new Date().toISOString().split('T')[0];

  const preselectedGame = session
    ? games.find((g) => g.id === session.gameId)
    : initialGameId
    ? games.find((g) => g.id === initialGameId)
    : undefined;

  const [selectedGame, setSelectedGame] = useState<BoardGame | undefined>(preselectedGame);
  const [showPicker, setShowPicker] = useState(false);
  const [status, setStatus] = useState<SessionStatus>(session?.status ?? 'active');
  const [date, setDate] = useState(session?.date ?? today);
  const [playerNames, setPlayerNames] = useState<string[]>(
    session?.playerNames.length ? session.playerNames : ['', '']
  );
  const [winnerName, setWinnerName] = useState<string | null>(session?.winnerName ?? null);
  const [scores, setScores] = useState<Record<string, string>>(() => {
    if (!session?.scores) return {};
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(session.scores)) {
      result[k] = String(v);
    }
    return result;
  });
  const [sessionNumber, setSessionNumber] = useState(
    session?.sessionNumber !== null && session?.sessionNumber !== undefined
      ? String(session.sessionNumber)
      : ''
  );
  const [chapter, setChapter] = useState(session?.chapter ?? '');
  const [duration, setDuration] = useState(session?.duration !== null && session?.duration !== undefined ? String(session.duration) : '');
  const [notes, setNotes] = useState(session?.notes ?? '');

  const validPlayers = playerNames.filter((n) => n.trim());
  const hasScores = validPlayers.length > 0;
  const canSave = !!selectedGame && !!date;

  const addPlayer = () => {
    if (playerNames.length >= 8) return;
    setPlayerNames((prev) => [...prev, '']);
  };

  const updatePlayer = (index: number, value: string) => {
    const old = playerNames[index];
    setPlayerNames((prev) => prev.map((n, i) => (i === index ? value : n)));
    // Update winner if name changed
    if (winnerName === old && old !== value) setWinnerName(null);
    // Update scores key if name changed
    if (old && value !== old) {
      setScores((prev) => {
        const next = { ...prev };
        if (old in next) {
          next[value] = next[old];
          delete next[old];
        }
        return next;
      });
    }
  };

  const removePlayer = (index: number) => {
    const removed = playerNames[index];
    setPlayerNames((prev) => prev.filter((_, i) => i !== index));
    if (winnerName === removed) setWinnerName(null);
    if (removed) {
      setScores((prev) => {
        const next = { ...prev };
        delete next[removed];
        return next;
      });
    }
  };

  const handleSave = () => {
    if (!selectedGame) return;

    const parsedScores: Record<string, number> = {};
    for (const name of validPlayers) {
      const val = scores[name];
      if (val !== undefined && val !== '') {
        const n = parseInt(val, 10);
        if (!isNaN(n)) parsedScores[name] = n;
      }
    }

    const data = {
      gameId: selectedGame.id,
      date,
      playerNames: validPlayers,
      playerIds: session?.playerIds ?? [],
      winnerName: status === 'completed' ? winnerName : null,
      winnerId: session?.winnerId ?? null,
      duration: duration ? parseInt(duration, 10) : null,
      notes: notes.trim(),
      scores: parsedScores,
      status,
      sessionNumber: sessionNumber ? parseInt(sessionNumber, 10) : null,
      chapter: chapter.trim(),
    };

    if (isEdit) {
      updateSession(session.id, data);
      navigate(`/session/${session.id}`, { replace: true });
    } else {
      const newSession = addSession(data);
      navigate(`/session/${newSession.id}`, { replace: true });
    }
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
          {isEdit ? 'Edit Session' : 'New Session'}
        </h1>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto relative z-[1]">
        <div className="flex flex-col gap-5 p-4 pb-28">
          {/* Game Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Game</label>
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-3 rounded-xl glass-input px-4 py-3 text-left"
            >
              {selectedGame ? (
                <>
                  {selectedGame.imageUrl ? (
                    <img
                      src={selectedGame.imageUrl}
                      alt={selectedGame.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                      <span className="text-sm font-bold text-text-secondary/30">
                        {selectedGame.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-text-primary flex-1">
                    {selectedGame.name}
                  </span>
                  <span className="text-xs text-text-secondary">Change</span>
                </>
              ) : (
                <span className="text-sm text-text-secondary/70">Select Game</span>
              )}
            </button>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Status</label>
            <ToggleGroup
              options={STATUS_OPTIONS}
              value={status}
              onChange={setStatus}
              layoutId="session-status"
            />
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
                  {playerNames.length > 2 && (
                    <button
                      onClick={() => removePlayer(i)}
                      className="text-text-secondary hover:text-danger transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
              {playerNames.length < 8 && (
                <button
                  onClick={addPlayer}
                  className="flex items-center gap-1.5 text-sm text-primary py-1"
                >
                  <Plus size={16} />
                  Add Player
                </button>
              )}
            </div>
          </div>

          {/* Winner — only when completed */}
          {status === 'completed' && validPlayers.length > 0 && (
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
                  No winner
                </button>
                {validPlayers.map((name) => (
                  <button
                    key={name}
                    onClick={() => setWinnerName(winnerName === name ? null : name)}
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

          {/* Scores */}
          {hasScores && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Scores (optional)</label>
              <div className="flex flex-col gap-2">
                {validPlayers.map((name) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-sm text-text-primary flex-1 min-w-0 truncate">{name}</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={scores[name] ?? ''}
                      onChange={(e) =>
                        setScores((prev) => ({ ...prev, [name]: e.target.value }))
                      }
                      className="w-24 rounded-xl glass-input px-3 py-2 text-base text-text-primary text-right placeholder:text-text-secondary/50 focus:outline-none transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session Number */}
          <Input
            label="Session # (optional)"
            type="number"
            placeholder="e.g. 3"
            value={sessionNumber}
            onChange={(e) => setSessionNumber(e.target.value)}
          />

          {/* Chapter */}
          <Input
            label="Chapter / Scenario (optional)"
            type="text"
            placeholder="e.g. Chapter 4: The Dark Forest"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
          />

          {/* Duration */}
          <Input
            label="Duration (minutes, optional)"
            type="number"
            placeholder="e.g. 90"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />

          {/* Notes */}
          <Textarea
            label="Notes"
            placeholder="What happened this session?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Sticky Save */}
      <div className="fixed bottom-0 left-0 right-0 p-4 glass-strong z-10">
        <Button
          className="w-full"
          size="lg"
          onClick={handleSave}
          disabled={!canSave}
        >
          {isEdit ? 'Save Changes' : 'Create Session'}
        </Button>
      </div>

      <GamePicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={(game) => {
          setSelectedGame(game);
          setShowPicker(false);
        }}
      />
    </div>
  );
}
