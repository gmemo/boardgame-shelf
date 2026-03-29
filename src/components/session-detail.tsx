import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Play, Flag } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { PlaySession } from '../types';
import { useSessionStore, useGameStore, usePlayLogStore } from '../stores';
import IconButton from './ui/icon-button';
import Button from './ui/button';
import ConfirmDialog from './ui/confirm-dialog';

interface SessionDetailProps {
  session: PlaySession;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const spring = { type: 'spring' as const, damping: 30, stiffness: 300 };

export default function SessionDetail({ session }: SessionDetailProps) {
  const navigate = useNavigate();
  const { deleteSession, updateSession } = useSessionStore();
  const { games } = useGameStore();
  const { addPlayLog } = usePlayLogStore();
  const [showDelete, setShowDelete] = useState(false);
  const [endSheetOpen, setEndSheetOpen] = useState(false);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDuration, setEndDuration] = useState('');
  const [endNotes, setEndNotes] = useState(session.notes);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(session.notes);

  const game = games.find((g) => g.id === session.gameId);

  const handleDelete = () => {
    deleteSession(session.id);
    navigate('/sessions', { replace: true });
  };

  const handleEndIt = () => {
    addPlayLog({
      gameId: session.gameId,
      date: endDate,
      playerNames: session.playerNames,
      winnerName,
      duration: endDuration ? parseInt(endDuration, 10) : null,
      notes: endNotes.trim(),
      categories: session.categories,
      playerScores: session.playerScores,
    });
    deleteSession(session.id);
    setEndSheetOpen(false);
    navigate(game ? `/game/${game.id}` : '/', { replace: true });
  };

  const saveNotes = () => {
    updateSession(session.id, { notes: notesValue });
    setEditingNotes(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="flex flex-col h-full"
    >
      <div className="ambient-glow" />

      {/* Top action bar */}
      <div className="flex items-center justify-between px-3 pt-4 pb-2 relative z-10">
        <IconButton onClick={() => navigate('/sessions')}>
          <ChevronLeft size={24} />
        </IconButton>
        <IconButton onClick={() => setShowDelete(true)}>
          <Trash2 size={18} />
        </IconButton>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto relative z-[1]">
        <div className="flex flex-col gap-5 px-4 pb-32">
          {/* Game heading */}
          <div>
            <button
              onClick={() => game && navigate(`/game/${game.id}`)}
              className="text-left"
            >
              <h1 className="text-2xl font-bold text-text-primary">
                {game?.name ?? 'Unknown Game'}
              </h1>
            </button>
            <p className="mt-1 text-sm text-text-secondary">
              {formatDate(session.date)} · Round {session.round}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/scorekeeper?gameId=${session.gameId}&sessionId=${session.id}`)}
              className="flex-1"
            >
              <Play size={18} />
              Resume
            </Button>
            <Button
              onClick={() => setEndSheetOpen(true)}
              variant="secondary"
              className="flex-1"
            >
              <Flag size={18} />
              End It
            </Button>
          </div>

          {/* Scores table */}
          {session.playerNames.length > 0 && (
            <div className="glass rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex px-3 py-2 border-b border-white/5">
                <div className="flex-1 text-xs font-semibold text-text-secondary">Category</div>
                {session.playerNames.map((name) => (
                  <div key={name} className="w-16 text-center text-xs font-semibold text-text-secondary truncate">
                    {name}
                  </div>
                ))}
              </div>

              {session.categories.length > 0 ? (
                session.categories.map((cat) => (
                  <div key={cat.id} className="flex px-3 py-2 border-b border-white/5 last:border-0">
                    <div className="flex-1 text-sm text-text-primary">{cat.name}</div>
                    {session.playerNames.map((name) => {
                      const ps = session.playerScores.find((p) => p.playerName === name);
                      const score = ps?.scores[cat.id] ?? 0;
                      return (
                        <div key={name} className="w-16 text-center text-sm font-medium text-text-primary">
                          {score}
                        </div>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="px-3 py-4 text-xs text-text-secondary text-center">
                  No scores yet — resume to start tracking
                </div>
              )}

              {/* Totals */}
              {session.categories.length > 1 && (
                <div className="flex px-3 py-2 bg-white/5">
                  <div className="flex-1 text-xs font-bold text-text-secondary">TOTAL</div>
                  {session.playerNames.map((name) => {
                    const ps = session.playerScores.find((p) => p.playerName === name);
                    const total = session.categories.reduce(
                      (sum, cat) => sum + (ps?.scores[cat.id] ?? 0),
                      0
                    );
                    return (
                      <div key={name} className="w-16 text-center text-sm font-bold text-primary">
                        {total}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="glass-light rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-text-primary">Notes</h2>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="text-xs text-primary"
                >
                  Edit
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  rows={4}
                  autoFocus
                  className="w-full rounded-xl glass-input px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none resize-none"
                  placeholder="Add notes..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveNotes}>Save</Button>
                  <Button size="sm" variant="secondary" onClick={() => { setNotesValue(session.notes); setEditingNotes(false); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {notesValue || <span className="italic opacity-50">No notes yet</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* End It sheet */}
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
                {session.playerNames.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-secondary">Winner</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setWinnerName(null)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                          winnerName === null ? 'bg-primary text-white tag-glow' : 'glass-pill text-text-secondary'
                        }`}
                      >
                        No winner
                      </button>
                      {session.playerNames.map((name) => (
                        <button
                          key={name}
                          onClick={() => setWinnerName(winnerName === name ? null : name)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                            winnerName === name ? 'bg-primary text-white tag-glow' : 'glass-pill text-text-secondary'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl glass-input px-4 py-3 text-base text-text-primary focus:outline-none"
                  />
                </div>

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

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">Notes (optional)</label>
                  <textarea
                    value={endNotes}
                    onChange={(e) => setEndNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl glass-input px-4 py-3 text-base text-text-primary placeholder:text-text-secondary/50 focus:outline-none resize-none"
                    placeholder="How was the game?"
                  />
                </div>

                <Button className="w-full" size="lg" onClick={handleEndIt}>
                  Save Play
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete session?"
        description="This will permanently remove this paused game. This cannot be undone."
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
