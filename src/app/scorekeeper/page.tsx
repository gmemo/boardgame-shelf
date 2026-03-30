import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { useScrollLock } from '../../lib/use-scroll-lock';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore, usePlayLogStore, useSessionStore, usePlayerStore } from '../../stores';
import type { ScoreCategory, PlayerScore } from '../../types';
import Button from '../../components/ui/button';
import ConfirmDialog from '../../components/ui/confirm-dialog';
import IconButton from '../../components/ui/icon-button';

const spring = { type: 'spring' as const, damping: 30, stiffness: 300 };

const INCREMENT_PRESETS = [1, 5, 10, 20];

function makeCategory(name: string, increment = 1): ScoreCategory {
  return { id: crypto.randomUUID(), name, increment };
}

export default function ScorekeeperPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId') ?? undefined;
  const sessionId = searchParams.get('sessionId') ?? undefined;

  const { games } = useGameStore();
  const { addPlayLog } = usePlayLogStore();
  const { sessions, addSession, updateSession, deleteSession } = useSessionStore();
  const { players: registeredPlayers } = usePlayerStore();

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
    if (existingSession?.playerScores?.length) {
      const result: Record<string, Record<string, number>> = {};
      for (const ps of existingSession.playerScores) {
        result[ps.playerName] = { ...ps.scores };
      }
      return result;
    }
    return {};
  });
  // Player colors — track which player names came from player store
  const [playerColors, setPlayerColors] = useState<Record<string, string>>({});

  // Sheet states
  const [addCategorySheetOpen, setAddCategorySheetOpen] = useState(false);
  const [addPlayerSheetOpen, setAddPlayerSheetOpen] = useState(false);
  const [endSheetOpen, setEndSheetOpen] = useState(false);

  useScrollLock(addCategorySheetOpen || addPlayerSheetOpen || endSheetOpen);

  // End game state
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDuration, setEndDuration] = useState('');
  const [endNotes, setEndNotes] = useState('');

  // Confirm dialogs
  const [pauseConfirmOpen, setPauseConfirmOpen] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);

  // Inline category name editing
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // Direct score edit
  const [editingScore, setEditingScore] = useState<{ playerName: string; categoryId: string } | null>(null);
  const [editingScoreValue, setEditingScoreValue] = useState('');

  // Add category sheet state
  const [newCatName, setNewCatName] = useState('');
  const [newCatIncrement, setNewCatIncrement] = useState<number>(1);
  const [newCatCustomIncrement, setNewCatCustomIncrement] = useState('');
  const [newCatUseCustom, setNewCatUseCustom] = useState(false);

  // Add player sheet state
  const [guestPlayerName, setGuestPlayerName] = useState('');

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
  const removePlayer = (index: number) => {
    const removedName = playerNames[index];
    setPlayerNames((prev) => prev.filter((_, i) => i !== index));
    if (removedName.trim()) {
      setScores((prev) => {
        const next = { ...prev };
        delete next[removedName];
        return next;
      });
      setPlayerColors((prev) => {
        const next = { ...prev };
        delete next[removedName];
        return next;
      });
    }
  };

  const updatePlayerName = (index: number, value: string) => {
    const old = playerNames[index];
    setPlayerNames((prev) => prev.map((n, i) => (i === index ? value : n)));
    if (old.trim() && value !== old) {
      setScores((prev) => {
        const next = { ...prev };
        if (old in next) {
          next[value] = next[old];
          delete next[old];
        }
        return next;
      });
      setPlayerColors((prev) => {
        const next = { ...prev };
        if (old in next) {
          next[value] = next[old];
          delete next[old];
        }
        return next;
      });
    }
  };

  const addRegisteredPlayer = (name: string, color: string) => {
    if (playerNames.length >= 8) return;
    setPlayerNames((prev) => [...prev, name]);
    setPlayerColors((prev) => ({ ...prev, [name]: color }));
    setAddPlayerSheetOpen(false);
  };

  const addGuestPlayer = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || playerNames.length >= 8) return;
    setPlayerNames((prev) => [...prev, trimmed]);
    setAddPlayerSheetOpen(false);
    setGuestPlayerName('');
  };

  // Category management
  const addCategoryFromSheet = () => {
    const name = newCatName.trim() || `Cat ${categories.length + 1}`;
    const increment = newCatUseCustom
      ? (parseInt(newCatCustomIncrement, 10) || 1)
      : newCatIncrement;
    setCategories((prev) => [...prev, makeCategory(name, increment)]);
    setNewCatName('');
    setNewCatIncrement(1);
    setNewCatCustomIncrement('');
    setNewCatUseCustom(false);
    setAddCategorySheetOpen(false);
  };

  const deleteCategory = (id: string) => {
    if (categories.length <= 1) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setScores((prev) => {
      const next: Record<string, Record<string, number>> = {};
      for (const [pName, catScores] of Object.entries(prev)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Row color tint from player's registered color
  const rowBg = (playerName: string, opacity: number) => {
    const hex = playerColors[playerName];
    if (!hex) return undefined;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

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
      round: 1,
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

  // Players not already in the scorekeeper
  const availableRegisteredPlayers = registeredPlayers.filter(
    (p) => !playerNames.includes(p.name)
  );

  return (
    <div className="flex flex-col h-full">
      <div className="ambient-glow" />

      {/* Top bar */}
      <div className="px-3 pt-4 pb-2 bg-gradient-to-b from-background from-60% to-transparent sticky top-0 z-20 flex items-center gap-2">
        <IconButton onClick={handleBack}>
          <ChevronLeft size={24} />
        </IconButton>
        <h1 className="flex-1 text-center text-base font-semibold text-text-primary truncate">
          {game?.name ?? 'Scorekeeper'}
        </h1>
      </div>

      {/* Player cards area */}
      <div className="flex-1 overflow-y-auto relative z-[1] px-3 pb-4">
        {/* Controls row */}
        <div className="py-2 flex items-center justify-between">
          <span className="text-xs text-text-secondary">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </span>
          <button
            onClick={() => setAddCategorySheetOpen(true)}
            className="flex items-center gap-1 text-xs text-primary glass-pill px-3 py-1.5 rounded-full"
          >
            <Plus size={12} /> Category
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {playerNames.map((playerName, idx) => {
            const total = categories.reduce(
              (sum, cat) => sum + getScore(playerName, cat.id),
              0
            );
            return (
              <div
                key={idx}
                className="glass rounded-2xl overflow-hidden"
                style={{ borderLeft: playerColors[playerName] ? `3px solid ${playerColors[playerName]}` : undefined }}
              >
                {/* Player header */}
                <div
                  className="flex items-center gap-2 px-4 py-3"
                  style={{ backgroundColor: rowBg(playerName, 0.1) }}
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: playerColors[playerName] ?? 'rgba(128,128,128,0.4)' }}
                  />
                  <input
                    type="text"
                    placeholder={`Player ${idx + 1}`}
                    value={playerName}
                    onChange={(e) => updatePlayerName(idx, e.target.value)}
                    className="flex-1 bg-transparent text-sm font-semibold text-text-primary focus:outline-none placeholder:text-text-secondary/50"
                  />
                  <span className="text-xs text-text-secondary shrink-0">
                    Total: <span className="font-bold text-text-primary">{total}</span>
                  </span>
                  {playerNames.length > 1 && (
                    <button
                      onClick={() => removePlayer(idx)}
                      className="text-text-secondary/50 hover:text-danger transition-colors shrink-0"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Category rows */}
                <div className="divide-y divide-white/5">
                  {categories.map((cat) => {
                    const score = getScore(playerName, cat.id);
                    const isEditing =
                      editingScore?.playerName === playerName &&
                      editingScore?.categoryId === cat.id;

                    return (
                      <div key={cat.id} className="flex items-center gap-3 px-4 py-2">
                        {/* Category name */}
                        <div className="flex-1 min-w-0">
                          {editingCategoryId === cat.id ? (
                            <input
                              type="text"
                              value={editingCategoryName}
                              onChange={(e) => setEditingCategoryName(e.target.value)}
                              onBlur={commitCategoryName}
                              onKeyDown={(e) => e.key === 'Enter' && commitCategoryName()}
                              autoFocus
                              className="text-xs font-medium text-text-primary bg-transparent focus:outline-none border-b border-primary w-full"
                            />
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditCategoryName(cat)}
                                className="text-xs font-medium text-text-secondary truncate"
                              >
                                {cat.name}
                              </button>
                              {categories.length > 1 && (
                                <button
                                  onClick={() => deleteCategory(cat.id)}
                                  className="text-text-secondary/30 hover:text-danger transition-colors shrink-0"
                                >
                                  <X size={10} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => changeScore(playerName, cat.id, -cat.increment)}
                            className="w-11 h-11 rounded-full glass-pill flex items-center justify-center text-text-secondary active:scale-90 transition-all text-lg font-medium"
                          >
                            −
                          </button>
                          {isEditing ? (
                            <input
                              type="number"
                              className="glass-input rounded-lg w-16 text-center text-base font-bold text-text-primary focus:outline-none py-1"
                              autoFocus
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
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setEditingScore({ playerName, categoryId: cat.id });
                                setEditingScoreValue(String(score));
                              }}
                              className="w-16 text-center font-bold text-text-primary text-base"
                            >
                              {score}
                            </button>
                          )}
                          <button
                            onClick={() => changeScore(playerName, cat.id, cat.increment)}
                            className="w-11 h-11 rounded-full glass-pill flex items-center justify-center text-text-secondary active:scale-90 transition-all text-lg font-medium"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Add Player */}
          <button
            onClick={() => setAddPlayerSheetOpen(true)}
            className="flex items-center gap-1.5 text-sm text-primary glass-pill px-4 py-3 rounded-2xl w-full justify-center"
          >
            <Plus size={16} /> Add Player
          </button>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-gradient-to-t from-background from-60% to-transparent px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] flex gap-2 relative z-10 shrink-0">
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

      {/* Add Category Sheet */}
      <AnimatePresence>
        {addCategorySheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setAddCategorySheetOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={spring}
              className="fixed inset-x-0 bottom-0 z-50 glass-strong rounded-t-2xl px-4 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))]"
            >
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-text-secondary/30" />
              </div>
              <h2 className="text-lg font-bold text-text-primary mb-4">New Category</h2>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">Category name</label>
                  <input
                    type="text"
                    placeholder="VP, Gold, Stars..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    autoFocus
                    className="w-full rounded-xl glass-input px-4 py-3 text-base text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-secondary">Increment</label>
                  <div className="flex gap-2 flex-wrap">
                    {INCREMENT_PRESETS.map((inc) => (
                      <button
                        key={inc}
                        onClick={() => { setNewCatIncrement(inc); setNewCatUseCustom(false); }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          !newCatUseCustom && newCatIncrement === inc
                            ? 'bg-primary text-white tag-glow'
                            : 'glass-pill text-text-secondary'
                        }`}
                      >
                        {inc}
                      </button>
                    ))}
                    <button
                      onClick={() => setNewCatUseCustom(true)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        newCatUseCustom
                          ? 'bg-primary text-white tag-glow'
                          : 'glass-pill text-text-secondary'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                  {newCatUseCustom && (
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g. 25"
                      value={newCatCustomIncrement}
                      onChange={(e) => setNewCatCustomIncrement(e.target.value)}
                      className="w-full rounded-xl glass-input px-4 py-3 text-base text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
                    />
                  )}
                </div>
                <Button className="w-full" size="lg" onClick={addCategoryFromSheet}>
                  Add
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Player Sheet */}
      <AnimatePresence>
        {addPlayerSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setAddPlayerSheetOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={spring}
              className="fixed inset-x-0 bottom-0 z-50 glass-strong rounded-t-2xl px-4 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))] max-h-[75vh] overflow-y-auto"
            >
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-text-secondary/30" />
              </div>
              <h2 className="text-lg font-bold text-text-primary mb-4">Add Player</h2>

              {availableRegisteredPlayers.length > 0 && (
                <div className="flex flex-col gap-2 mb-4">
                  {availableRegisteredPlayers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addRegisteredPlayer(p.name, p.color)}
                      className="flex items-center gap-3 rounded-xl glass px-4 py-3 text-left active:scale-[0.98] transition-all"
                    >
                      <span
                        className="inline-block w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-sm font-medium text-text-primary">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {availableRegisteredPlayers.length > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-text-secondary">or add a guest</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              )}

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Guest name"
                  value={guestPlayerName}
                  onChange={(e) => setGuestPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGuestPlayer(guestPlayerName)}
                  className="w-full rounded-xl glass-input px-4 py-3 text-base text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
                />
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => addGuestPlayer(guestPlayerName)}
                  disabled={!guestPlayerName.trim()}
                >
                  Add Guest
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
