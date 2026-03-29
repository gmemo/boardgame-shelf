import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Plus, X, Minus, Pencil } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore, usePlayLogStore, useSessionStore } from '../../stores';
import type { ScoreCategory, PlayerScore } from '../../types';
import Button from '../../components/ui/button';
import ConfirmDialog from '../../components/ui/confirm-dialog';
import IconButton from '../../components/ui/icon-button';

const spring = { type: 'spring' as const, damping: 30, stiffness: 300 };

const INCREMENT_PRESETS = [1, 5, 10, 20];

function makeCategory(name: string): ScoreCategory {
  return { id: crypto.randomUUID(), name, increment: 1 };
}

export default function ScorekeeperPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId') ?? undefined;
  const sessionId = searchParams.get('sessionId') ?? undefined;

  const { games } = useGameStore();
  const { addPlayLog } = usePlayLogStore();
  const { sessions, addSession, updateSession, deleteSession } = useSessionStore();

  const game = gameId ? games.find((g) => g.id === gameId) : undefined;
  const existingSession = sessionId ? sessions.find((s) => s.id === sessionId) : undefined;

  // Local state
  const [playerNames, setPlayerNames] = useState<string[]>(() => {
    if (existingSession) return existingSession.playerNames.length >= 2 ? existingSession.playerNames : [...existingSession.playerNames, ...Array(2 - existingSession.playerNames.length).fill('')];
    return ['', ''];
  });
  const [categories, setCategories] = useState<ScoreCategory[]>(() => {
    if (existingSession?.categories?.length) return existingSession.categories;
    return [makeCategory('Score')];
  });
  const [scores, setScores] = useState<Record<string, Record<string, number>>>(() => {
    // scores[playerName][categoryId] = value
    if (existingSession?.playerScores?.length) {
      const result: Record<string, Record<string, number>> = {};
      for (const ps of existingSession.playerScores) {
        result[ps.playerName] = { ...ps.scores };
      }
      return result;
    }
    return {};
  });
  const [round, setRound] = useState(() => existingSession?.round ?? 1);

  // End game sheet state
  const [endSheetOpen, setEndSheetOpen] = useState(false);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDuration, setEndDuration] = useState('');
  const [endNotes, setEndNotes] = useState('');

  // Pause confirm
  const [pauseConfirmOpen, setPauseConfirmOpen] = useState(false);
  // Back confirm
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);

  // Inline category name editing
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // Custom increment input
  const [customIncrementCategoryId, setCustomIncrementCategoryId] = useState<string | null>(null);
  const [customIncrementValue, setCustomIncrementValue] = useState('');

  // Direct score edit
  const [editingScore, setEditingScore] = useState<{ playerName: string; categoryId: string } | null>(null);
  const [editingScoreValue, setEditingScoreValue] = useState('');

  const hasAnyScore = Object.values(scores).some((catScores) =>
    Object.values(catScores).some((v) => v !== 0)
  );

  const validPlayerNames = playerNames.filter((n) => n.trim());

  // Score helpers
  const getScore = (playerName: string, categoryId: string) =>
    scores[playerName]?.[categoryId] ?? 0;

  const changeScore = (playerName: string, categoryId: string, delta: number) => {
    setScores((prev) => ({
      ...prev,
      [playerName]: {
        ...(prev[playerName] ?? {}),
        [categoryId]: (prev[playerName]?.[categoryId] ?? 0) + delta,
      },
    }));
  };

  const setScoreDirect = (playerName: string, categoryId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [playerName]: {
        ...(prev[playerName] ?? {}),
        [categoryId]: value,
      },
    }));
  };

  // Player management
  const addPlayer = () => {
    if (playerNames.length >= 8) return;
    setPlayerNames((prev) => [...prev, '']);
  };

  const removePlayer = (index: number) => {
    const removedName = playerNames[index];
    setPlayerNames((prev) => prev.filter((_, i) => i !== index));
    if (removedName.trim()) {
      setScores((prev) => {
        const next = { ...prev };
        delete next[removedName];
        return next;
      });
    }
  };

  const updatePlayerName = (index: number, value: string) => {
    const old = playerNames[index];
    setPlayerNames((prev) => prev.map((n, i) => (i === index ? value : n)));
    // Migrate scores to new name
    if (old.trim() && value !== old) {
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

  // Category management
  const addCategory = () => {
    setCategories((prev) => [...prev, makeCategory(`Cat ${prev.length + 1}`)]);
  };

  const deleteCategory = (id: string) => {
    if (categories.length <= 1) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setScores((prev) => {
      const next: Record<string, Record<string, number>> = {};
      for (const [pName, catScores] of Object.entries(prev)) {
        const { [id]: _removed, ...rest } = catScores;
        next[pName] = rest;
      }
      return next;
    });
  };

  const startEditCategoryName = (cat: ScoreCategory) => {
    setEditingCategoryId(cat.id);
    setEditingCategoryName(cat.name);
  };

  const commitCategoryName = () => {
    if (editingCategoryId && editingCategoryName.trim()) {
      setCategories((prev) =>
        prev.map((c) => (c.id === editingCategoryId ? { ...c, name: editingCategoryName.trim() } : c))
      );
    }
    setEditingCategoryId(null);
  };

  const setIncrement = (categoryId: string, increment: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, increment } : c))
    );
  };

  // Totals per player
  const getTotal = (playerName: string) =>
    categories.reduce((sum, cat) => sum + getScore(playerName, cat.id), 0);

  // Build PlayerScore array from current state
  const buildPlayerScores = (): PlayerScore[] => {
    return validPlayerNames.map((name) => ({
      playerName: name,
      scores: Object.fromEntries(categories.map((cat) => [cat.id, getScore(name, cat.id)])),
    }));
  };

  // Pause
  const handlePause = () => {
    if (!gameId) return;
    const data = {
      gameId,
      date: new Date().toISOString().split('T')[0],
      playerNames: validPlayerNames,
      categories,
      playerScores: buildPlayerScores(),
      round,
      notes: '',
    };
    if (sessionId && existingSession) {
      updateSession(sessionId, data);
    } else {
      addSession(data);
    }
    navigate('/sessions');
  };

  // End game
  const handleEndGame = () => {
    if (!gameId) return;
    addPlayLog({
      gameId,
      date: endDate,
      playerNames: validPlayerNames,
      winnerName,
      duration: endDuration ? parseInt(endDuration, 10) : null,
      notes: endNotes.trim(),
      categories,
      playerScores: buildPlayerScores(),
    });
    if (sessionId && existingSession) {
      deleteSession(sessionId);
    }
    setEndSheetOpen(false);
    navigate(gameId ? `/game/${gameId}` : '/', { replace: true });
  };

  const handleBack = () => {
    if (hasAnyScore) {
      setBackConfirmOpen(true);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="ambient-glow" />

      {/* Top bar */}
      <div className="px-3 pt-4 pb-2 bg-gradient-to-b from-background from-60% to-transparent sticky top-0 z-10 flex items-center gap-2">
        <IconButton onClick={handleBack}>
          <ChevronLeft size={24} />
        </IconButton>
        <h1 className="flex-1 text-center text-base font-semibold text-text-primary truncate">
          {game?.name ?? 'Scorekeeper'}
        </h1>
        {/* Round counter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRound((r) => Math.max(1, r - 1))}
            className="w-7 h-7 rounded-full glass flex items-center justify-center text-text-secondary active:scale-90 transition-all"
          >
            <Minus size={14} />
          </button>
          <span className="text-sm font-bold text-text-primary w-12 text-center">Rd {round}</span>
          <button
            onClick={() => setRound((r) => r + 1)}
            className="w-7 h-7 rounded-full glass flex items-center justify-center text-text-secondary active:scale-90 transition-all"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Player header row (sticky under top bar) */}
      <div className="sticky top-[52px] z-10 bg-gradient-to-b from-background from-80% to-transparent px-2 pb-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {/* Add category button */}
          <button
            onClick={addCategory}
            className="shrink-0 flex items-center gap-1 text-xs text-primary glass-pill px-2 py-1.5 rounded-lg"
          >
            <Plus size={12} />
            Cat
          </button>

          {/* Player name inputs */}
          {playerNames.map((name, idx) => (
            <div key={idx} className="flex items-center gap-0.5 min-w-[80px] max-w-[110px]">
              <input
                type="text"
                placeholder={`P${idx + 1}`}
                value={name}
                onChange={(e) => updatePlayerName(idx, e.target.value)}
                className="flex-1 min-w-0 glass-input rounded-lg px-2 py-1 text-xs font-medium text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
              />
              {playerNames.length > 1 && (
                <button
                  onClick={() => removePlayer(idx)}
                  className="text-text-secondary/40 hover:text-danger transition-colors shrink-0"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}

          {/* Add player button */}
          {playerNames.length < 8 && (
            <button
              onClick={addPlayer}
              className="shrink-0 w-7 h-7 rounded-full glass flex items-center justify-center text-primary"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Score table */}
      <div className="flex-1 overflow-y-auto relative z-[1] px-2">
        <div className="flex flex-col gap-2 pb-4">
          {categories.map((cat) => (
            <div key={cat.id} className="glass rounded-2xl overflow-hidden">
              {/* Category header row */}
              <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1.5 border-b border-white/5">
                {/* Category name */}
                {editingCategoryId === cat.id ? (
                  <input
                    type="text"
                    value={editingCategoryName}
                    onChange={(e) => setEditingCategoryName(e.target.value)}
                    onBlur={commitCategoryName}
                    onKeyDown={(e) => e.key === 'Enter' && commitCategoryName()}
                    autoFocus
                    className="flex-1 min-w-0 text-sm font-semibold text-text-primary bg-transparent focus:outline-none border-b border-primary"
                  />
                ) : (
                  <button
                    onClick={() => startEditCategoryName(cat)}
                    className="flex-1 min-w-0 text-sm font-semibold text-text-primary text-left truncate"
                  >
                    {cat.name}
                  </button>
                )}

                {/* Delete category */}
                {categories.length > 1 && (
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="text-text-secondary/40 hover:text-danger transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}

                {/* Increment selector */}
                <div className="flex items-center gap-1 ml-1">
                  {INCREMENT_PRESETS.map((inc) => (
                    <button
                      key={inc}
                      onClick={() => setIncrement(cat.id, inc)}
                      className={`w-7 h-6 rounded text-[10px] font-medium transition-all ${
                        cat.increment === inc
                          ? 'bg-primary text-white'
                          : 'glass-pill text-text-secondary'
                      }`}
                    >
                      {inc}
                    </button>
                  ))}
                  {/* Custom increment */}
                  {customIncrementCategoryId === cat.id ? (
                    <input
                      type="number"
                      value={customIncrementValue}
                      onChange={(e) => setCustomIncrementValue(e.target.value)}
                      onBlur={() => {
                        const n = parseInt(customIncrementValue, 10);
                        if (!isNaN(n) && n > 0) setIncrement(cat.id, n);
                        setCustomIncrementCategoryId(null);
                        setCustomIncrementValue('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const n = parseInt(customIncrementValue, 10);
                          if (!isNaN(n) && n > 0) setIncrement(cat.id, n);
                          setCustomIncrementCategoryId(null);
                          setCustomIncrementValue('');
                        }
                      }}
                      autoFocus
                      className="w-10 text-[10px] glass-input rounded px-1 py-0.5 focus:outline-none text-text-primary"
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setCustomIncrementCategoryId(cat.id);
                        setCustomIncrementValue('');
                      }}
                      className="w-7 h-6 rounded glass-pill flex items-center justify-center"
                    >
                      <Pencil size={10} className="text-text-secondary" />
                    </button>
                  )}
                </div>
              </div>

              {/* Score cells row */}
              <div className="flex items-center gap-1 px-2 py-2">
                {/* Left spacer to align with category name column */}
                <div className="w-0" />

                {playerNames.map((playerName, idx) => {
                  const score = getScore(playerName, cat.id);
                  const isEditing =
                    editingScore?.playerName === playerName &&
                    editingScore?.categoryId === cat.id;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex items-center justify-center gap-1"
                    >
                      <button
                        onClick={() => changeScore(playerName, cat.id, -cat.increment)}
                        className="w-8 h-8 rounded-full glass-light flex items-center justify-center text-text-secondary active:scale-90 transition-all shrink-0"
                      >
                        <Minus size={14} />
                      </button>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editingScoreValue}
                          onChange={(e) => setEditingScoreValue(e.target.value)}
                          onBlur={() => {
                            const n = parseInt(editingScoreValue, 10);
                            if (!isNaN(n)) setScoreDirect(playerName, cat.id, n);
                            setEditingScore(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const n = parseInt(editingScoreValue, 10);
                              if (!isNaN(n)) setScoreDirect(playerName, cat.id, n);
                              setEditingScore(null);
                            }
                          }}
                          autoFocus
                          className="w-14 text-center text-lg font-bold text-text-primary glass-input rounded-lg focus:outline-none py-0.5"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingScore({ playerName, categoryId: cat.id });
                            setEditingScoreValue(String(score));
                          }}
                          className="min-w-[40px] text-center text-lg font-bold text-text-primary"
                        >
                          {score}
                        </button>
                      )}
                      <button
                        onClick={() => changeScore(playerName, cat.id, cat.increment)}
                        className="w-8 h-8 rounded-full glass-light flex items-center justify-center text-text-secondary active:scale-90 transition-all shrink-0"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Totals row */}
          {playerNames.length > 0 && categories.length > 1 && (
            <div className="glass-light rounded-2xl px-3 py-2 flex items-center">
              <span className="text-xs font-semibold text-text-secondary flex-shrink-0 w-16">TOTAL</span>
              <div className="flex-1 flex">
                {playerNames.map((name, idx) => (
                  <div key={idx} className="flex-1 text-center">
                    <span className="text-base font-bold text-primary">{getTotal(name)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-gradient-to-t from-background from-60% to-transparent px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] flex gap-2 relative z-10">
        {gameId && (
          <>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setPauseConfirmOpen(true)}
            >
              Pause
            </Button>
            <Button
              className="flex-1"
              onClick={() => setEndSheetOpen(true)}
            >
              End Game
            </Button>
          </>
        )}
        {!gameId && (
          <Button className="flex-1" onClick={() => navigate(-1)} variant="ghost">
            Done
          </Button>
        )}
      </div>

      {/* End Game Sheet */}
      <AnimatePresence>
        {endSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setEndSheetOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={spring}
              className="fixed inset-x-0 bottom-0 z-50 glass-strong rounded-t-3xl px-4 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-text-secondary/30" />
              </div>
              <h2 className="text-lg font-bold text-text-primary mb-4">End Game</h2>

              <div className="flex flex-col gap-4">
                {/* Winner */}
                {validPlayerNames.length > 0 && (
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
                      {validPlayerNames.map((name) => (
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

                {/* Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl glass-input px-4 py-3 text-base text-text-primary focus:outline-none"
                  />
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">Duration (minutes, optional)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="e.g. 90"
                    value={endDuration}
                    onChange={(e) => setEndDuration(e.target.value)}
                    className="w-full rounded-xl glass-input px-4 py-3 text-base text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">Notes (optional)</label>
                  <textarea
                    placeholder="How was the game?"
                    value={endNotes}
                    onChange={(e) => setEndNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl glass-input px-4 py-3 text-base text-text-primary placeholder:text-text-secondary/50 focus:outline-none resize-none"
                  />
                </div>

                <Button className="w-full" size="lg" onClick={handleEndGame}>
                  Save Play
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={pauseConfirmOpen}
        onOpenChange={setPauseConfirmOpen}
        title="Pause game?"
        description="Your scores will be saved and you can resume later from the Sessions tab."
        confirmLabel="Pause"
        onConfirm={handlePause}
      />

      <ConfirmDialog
        open={backConfirmOpen}
        onOpenChange={setBackConfirmOpen}
        title="Discard scores?"
        description="You have unsaved scores. Are you sure you want to go back?"
        confirmLabel="Discard"
        confirmVariant="danger"
        onConfirm={() => navigate(-1)}
      />
    </div>
  );
}
