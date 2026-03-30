import { useState, useRef } from 'react';
import { Pencil, Trash2, Trophy, Clock, Users, Share2 } from 'lucide-react';
import ShareCard from './share-card';
import { generateShareImage, shareImage } from '../lib/share-image';
import { AnimatePresence, motion } from 'framer-motion';
import type { PlayLog } from '../types';
import { usePlayLogStore, useGameStore } from '../stores';
import Button from './ui/button';
import ConfirmDialog from './ui/confirm-dialog';

interface PlayLogDetailProps {
  log: PlayLog | null;
  open: boolean;
  onClose: () => void;
}

const spring = { type: 'spring' as const, damping: 30, stiffness: 300 };

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PlayLogDetail({ log, open, onClose }: PlayLogDetailProps) {
  const { updatePlayLog, deletePlayLog } = usePlayLogStore();
  const { games } = useGameStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Edit state
  const [editDate, setEditDate] = useState('');
  const [editPlayers, setEditPlayers] = useState('');
  const [editWinner, setEditWinner] = useState<string | null>(null);
  const [editDuration, setEditDuration] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const game = log ? games.find((g) => g.id === log.gameId) : undefined;

  const shareCardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!shareCardRef.current || sharing) return;
    setSharing(true);
    try {
      const file = await generateShareImage(shareCardRef.current);
      await shareImage(file);
    } catch (e) {
      console.error('Share failed', e);
    } finally {
      setSharing(false);
    }
  };

  const startEdit = () => {
    if (!log) return;
    setEditDate(log.date);
    setEditPlayers(log.playerNames.join(', '));
    setEditWinner(log.winnerName);
    setEditDuration(log.duration !== null ? String(log.duration) : '');
    setEditNotes(log.notes);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!log) return;
    const playerNames = editPlayers
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);
    updatePlayLog(log.id, {
      date: editDate,
      playerNames,
      winnerName: editWinner,
      duration: editDuration ? parseInt(editDuration, 10) : null,
      notes: editNotes,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!log) return;
    deletePlayLog(log.id);
    setShowDelete(false);
    onClose();
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const validPlayers = editPlayers
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);

  return (
    <>
      <AnimatePresence>
        {open && log && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={handleClose}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={spring}
              className="fixed inset-x-0 bottom-0 z-50 glass-strong rounded-t-3xl px-4 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-text-secondary/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary truncate flex-1">
                  {game?.name ?? 'Play Log'}
                </h2>
                <div className="flex gap-1">
                  {!isEditing && (
                    <button
                      onClick={startEdit}
                      className="p-2 text-text-secondary hover:text-primary transition-colors"
                    >
                      <Pencil size={18} />
                    </button>
                  )}
                  <button
                    onClick={handleShare}
                    disabled={sharing}
                    className="p-2 text-text-secondary hover:text-primary transition-colors disabled:opacity-50"
                  >
                    <Share2 size={18} />
                  </button>
                  <button
                    onClick={() => setShowDelete(true)}
                    className="p-2 text-text-secondary hover:text-danger transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {isEditing ? (
                /* Edit mode */
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-secondary">Date</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full rounded-xl glass-input px-4 py-3 text-base text-text-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-secondary">Players (comma-separated)</label>
                    <input
                      type="text"
                      value={editPlayers}
                      onChange={(e) => setEditPlayers(e.target.value)}
                      placeholder="Alice, Bob, Charlie"
                      className="w-full rounded-xl glass-input px-4 py-3 text-base text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
                    />
                  </div>

                  {validPlayers.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-text-secondary">Winner</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setEditWinner(null)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                            editWinner === null ? 'bg-primary text-white tag-glow' : 'glass-pill text-text-secondary'
                          }`}
                        >
                          No winner
                        </button>
                        {validPlayers.map((name) => (
                          <button
                            key={name}
                            onClick={() => setEditWinner(editWinner === name ? null : name)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                              editWinner === name ? 'bg-primary text-white tag-glow' : 'glass-pill text-text-secondary'
                            }`}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-secondary">Duration (minutes, optional)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g. 90"
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      className="w-full rounded-xl glass-input px-4 py-3 text-base text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-secondary">Notes</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl glass-input px-4 py-3 text-base text-text-primary placeholder:text-text-secondary/50 focus:outline-none resize-none"
                      placeholder="Notes..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleSave}>Save</Button>
                    <Button variant="secondary" className="flex-1" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex flex-col gap-4">
                  {/* Meta pills */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs glass-pill px-3 py-1.5 rounded-full text-text-secondary">
                      {formatDate(log.date)}
                    </span>
                    {log.duration && (
                      <span className="text-xs glass-pill px-3 py-1.5 rounded-full text-text-secondary flex items-center gap-1">
                        <Clock size={12} />
                        {log.duration}m
                      </span>
                    )}
                  </div>

                  {/* Players & winner */}
                  {log.playerNames.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                        <Users size={14} />
                        Players
                      </h3>
                      <div className="flex flex-col gap-1">
                        {log.playerNames.map((name) => (
                          <div key={name} className="flex items-center gap-2">
                            {name === log.winnerName && <Trophy size={14} className="text-primary shrink-0" />}
                            {name !== log.winnerName && <div className="w-[14px] shrink-0" />}
                            <span
                              className={`text-sm ${name === log.winnerName ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}
                            >
                              {name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Score table */}
                  {(log.categories?.length ?? 0) > 0 && (
                    <div className="glass rounded-2xl overflow-hidden">
                      <div className="flex px-3 py-2 border-b border-white/5">
                        <div className="flex-1 text-xs font-semibold text-text-secondary">Category</div>
                        {log.playerNames.map((name) => (
                          <div key={name} className="w-16 text-center text-xs font-semibold text-text-secondary truncate">
                            {name}
                          </div>
                        ))}
                      </div>
                      {log.categories!.map((cat) => (
                        <div key={cat.id} className="flex px-3 py-2 border-b border-white/5 last:border-0">
                          <div className="flex-1 text-sm text-text-primary">{cat.name}</div>
                          {log.playerNames.map((name) => {
                            const ps = log.playerScores?.find((p) => p.playerName === name);
                            const score = ps?.scores[cat.id] ?? 0;
                            return (
                              <div key={name} className="w-16 text-center text-sm font-medium text-text-primary">
                                {score}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {log.notes && (
                    <div className="glass-light rounded-2xl p-4">
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">{log.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Offscreen share card — positioned offscreen so html-to-image can capture it */}
            <div style={{ position: 'absolute', left: -9999, top: 0, visibility: 'hidden' }} aria-hidden="true">
              <ShareCard ref={shareCardRef} variant="session" gameName={game?.name ?? ''} log={log} />
            </div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete play log?"
        description="This will permanently remove this play log entry."
        onConfirm={handleDelete}
      />
    </>
  );
}
