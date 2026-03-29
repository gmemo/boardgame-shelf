import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Plus, X, Minus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore, usePlayLogStore, useSessionStore } from '../../stores';
import Button from '../../components/ui/button';
import ConfirmDialog from '../../components/ui/confirm-dialog';
import IconButton from '../../components/ui/icon-button';

type Player = { name: string; score: number };

const spring = { type: 'spring' as const, damping: 30, stiffness: 300 };

export default function ScorekeeperPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId') ?? undefined;
  const sessionId = searchParams.get('sessionId') ?? undefined;

  const { games } = useGameStore();
  const { addPlayLog } = usePlayLogStore();
  const { updateSession } = useSessionStore();

  const game = gameId ? games.find((g) => g.id === gameId) : undefined;

  const [players, setPlayers] = useState<Player[]>([
    { name: '', score: 0 },
    { name: '', score: 0 },
  ]);
  const [round, setRound] = useState(1);
  const [showRound, setShowRound] = useState(false);
  const [saveSheetOpen, setSaveSheetOpen] = useState(false);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const hasAnyScore = players.some((p) => p.score !== 0);

  const updatePlayerName = (index: number, value: string) => {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, name: value } : p)));
  };

  const changeScore = (index: number, delta: number) => {
    setPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, score: p.score + delta } : p))
    );
  };

  const addPlayer = () => {
    if (players.length >= 8) return;
    setPlayers((prev) => [...prev, { name: '', score: 0 }]);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 1) return;
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePlayLog = () => {
    if (!gameId) return;
    const validPlayers = players.filter((p) => p.name.trim());
    addPlayLog({
      gameId,
      date,
      playerNames: validPlayers.map((p) => p.name.trim()),
      winnerName,
      duration: null,
      notes: '',
    });
    setSaveSheetOpen(false);
    navigate(-1);
  };

  const handleUpdateSession = () => {
    if (!sessionId) return;
    const scores: Record<string, number> = {};
    for (const p of players) {
      if (p.name.trim()) scores[p.name.trim()] = p.score;
    }
    updateSession(sessionId, { scores });
    navigate(`/session/${sessionId}`, { replace: true });
  };

  const handleBack = () => {
    if (hasAnyScore) {
      setShowBackConfirm(true);
    } else {
      navigate(-1);
    }
  };

  const validPlayers = players.filter((p) => p.name.trim());

  return (
    <div className="flex flex-col h-full">
      {/* Ambient glow */}
      <div className="ambient-glow" />

      {/* Top bar */}
      <div className="px-3 pt-4 pb-2 bg-background flex items-center gap-2 relative z-10">
        <IconButton onClick={handleBack}>
          <ChevronLeft size={24} />
        </IconButton>
        <h1 className="flex-1 text-center text-base font-semibold text-text-primary truncate">
          {game?.name ?? 'Scorekeeper'}
        </h1>
        <button
          onClick={() => setShowRound((v) => !v)}
          className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
            showRound ? 'bg-primary text-white tag-glow' : 'glass-pill text-text-secondary'
          }`}
        >
          Round
        </button>
      </div>

      {/* Round counter */}
      {showRound && (
        <div className="flex items-center justify-center gap-6 py-4 relative z-[1]">
          <button
            onClick={() => setRound((r) => Math.max(1, r - 1))}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-text-secondary active:scale-90 transition-all"
          >
            <Minus size={18} />
          </button>
          <span className="text-3xl font-bold text-text-primary w-16 text-center">
            {round}
          </span>
          <button
            onClick={() => setRound((r) => r + 1)}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-text-secondary active:scale-90 transition-all"
          >
            <Plus size={18} />
          </button>
        </div>
      )}

      {/* Players list */}
      <div className="flex-1 overflow-y-auto px-4 py-2 relative z-[1]">
        <div className="flex flex-col gap-3 pb-4">
          {players.map((player, index) => (
            <div key={index} className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  placeholder={`Player ${index + 1}`}
                  value={player.name}
                  onChange={(e) => updatePlayerName(index, e.target.value)}
                  className="flex-1 bg-transparent text-sm font-medium text-text-primary placeholder:text-text-secondary/50 focus:outline-none glass-input rounded-lg px-3 py-2"
                />
                {players.length > 1 && (
                  <button
                    onClick={() => removePlayer(index)}
                    className="text-text-secondary/40 hover:text-danger transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => changeScore(index, -1)}
                  className="w-10 h-10 rounded-full glass-light flex items-center justify-center text-text-secondary active:scale-90 transition-all"
                >
                  <Minus size={18} />
                </button>
                <span className="text-3xl font-bold text-text-primary">{player.score}</span>
                <button
                  onClick={() => changeScore(index, 1)}
                  className="w-10 h-10 rounded-full glass-light flex items-center justify-center text-text-secondary active:scale-90 transition-all"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          ))}

          {players.length < 8 && (
            <button
              onClick={addPlayer}
              className="flex items-center justify-center gap-2 rounded-2xl glass-light py-3 text-sm text-primary"
            >
              <Plus size={16} />
              Add Player
            </button>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-background px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col gap-2 relative z-10">
        <div className="flex gap-2">
          {gameId && (
            <Button
              className="flex-1"
              onClick={() => setSaveSheetOpen(true)}
            >
              Save as Play Log
            </Button>
          )}
          {sessionId && (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleUpdateSession}
            >
              Update Session
            </Button>
          )}
          {!gameId && !sessionId && (
            <Button className="flex-1" onClick={() => navigate(-1)} variant="ghost">
              Done
            </Button>
          )}
        </div>
      </div>

      {/* Save as Play Log bottom sheet */}
      <AnimatePresence>
        {saveSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setSaveSheetOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={spring}
              className="fixed inset-x-0 bottom-0 z-50 glass-strong rounded-t-3xl px-4 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))]"
            >
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-text-secondary/30" />
              </div>
              <h2 className="text-lg font-bold text-text-primary mb-4">Save Play Log</h2>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl glass-input px-4 py-3 text-base text-text-primary focus:outline-none"
                  />
                </div>

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
                        No winner
                      </button>
                      {validPlayers.map((p) => (
                        <button
                          key={p.name}
                          onClick={() => setWinnerName(winnerName === p.name ? null : p.name)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                            winnerName === p.name
                              ? 'bg-primary text-white tag-glow'
                              : 'glass-pill text-text-secondary'
                          }`}
                        >
                          {p.name.trim()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button className="w-full" size="lg" onClick={handleSavePlayLog}>
                  Save Play Log
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={showBackConfirm}
        onOpenChange={setShowBackConfirm}
        title="Discard scores?"
        description="You have unsaved scores. Are you sure you want to go back?"
        confirmLabel="Discard"
        confirmVariant="danger"
        onConfirm={() => navigate(-1)}
      />
    </div>
  );
}
