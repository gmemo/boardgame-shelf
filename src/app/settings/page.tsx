import { useState } from 'react';
import { Moon, Sun, Download, Upload, Check, Heart, Plus, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePreferencesStore, usePlayerStore } from '../../stores';
import ToggleGroup from '../../components/ui/toggle-group';
import ConfirmDialog from '../../components/ui/confirm-dialog';
import { exportData, pickAndParseImportFile, applyImportData } from '../../lib/export-import';
import type { Player } from '../../types';

const THRESHOLD_PRESETS = [
  { label: '30d', value: 30 },
  { label: '60d', value: 60 },
  { label: '90d', value: 90 },
  { label: '180d', value: 180 },
];

const ACCENT_COLORS = [
  { value: 'indigo', color: '#6366F1' },
  { value: 'emerald', color: '#10B981' },
  { value: 'red', color: '#EF4444' },
  { value: 'blue', color: '#3B82F6' },
  { value: 'amber', color: '#F59E0B' },
  { value: 'purple', color: '#7C3AED' },
];

const PLAYER_COLORS = [
  '#EF4444',
  '#3B82F6',
  '#10B981',
  '#EAB308',
  '#F97316',
  '#7C3AED',
  '#EC4899',
  '#14B8A6',
];

const THEME_OPTIONS = [
  { value: 'dark' as const, label: 'Dark', icon: <Moon size={16} /> },
  { value: 'light' as const, label: 'Light', icon: <Sun size={16} /> },
];

export default function SettingsPage() {
  const { preferences, setPreferences } = usePreferencesStore();
  const { players, addPlayer, updatePlayer, deletePlayer } = usePlayerStore();

  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<Parameters<
    typeof applyImportData
  >[0] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Player state
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerColor, setNewPlayerColor] = useState(PLAYER_COLORS[0]);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [deletePlayerTarget, setDeletePlayerTarget] = useState<Player | null>(null);

  const handleImport = async () => {
    setImportError(null);
    const result = await pickAndParseImportFile();
    if (!result.ok) {
      if (result.error) setImportError(result.error);
      return;
    }
    setPendingImport(result.data);
    setImportConfirmOpen(true);
  };

  const confirmImport = () => {
    if (pendingImport) {
      applyImportData(pendingImport);
      setPendingImport(null);
    }
  };

  const handleAddPlayer = () => {
    const name = newPlayerName.trim();
    if (!name) return;
    addPlayer({ name, color: newPlayerColor });
    setNewPlayerName('');
    setNewPlayerColor(PLAYER_COLORS[0]);
    setAddingPlayer(false);
  };

  const startEdit = (player: Player) => {
    setEditingPlayer(player);
    setEditName(player.name);
    setEditColor(player.color);
  };

  const handleSaveEdit = () => {
    if (!editingPlayer || !editName.trim()) return;
    updatePlayer(editingPlayer.id, { name: editName.trim(), color: editColor });
    setEditingPlayer(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-8">
        {/* Appearance */}
        <section className="glass rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-4">
            Appearance
          </h2>

          {/* Theme toggle */}
          <div className="mb-5">
            <p className="text-xs text-text-secondary mb-2">Theme</p>
            <ToggleGroup
              options={THEME_OPTIONS}
              value={preferences.theme}
              onChange={(theme) => setPreferences({ theme })}
              layoutId="theme-toggle"
            />
          </div>

          {/* Accent color */}
          <div>
            <p className="text-xs text-text-secondary mb-3">Accent Color</p>
            <div className="flex gap-3 justify-center">
              {ACCENT_COLORS.map((accent) => (
                <button
                  key={accent.value}
                  onClick={() => setPreferences({ accentColor: accent.value })}
                  className="relative w-10 h-10 rounded-full transition-transform"
                  style={{
                    backgroundColor: accent.color,
                    transform:
                      preferences.accentColor === accent.value
                        ? 'scale(1.15)'
                        : 'scale(1)',
                  }}
                >
                  <AnimatePresence>
                    {preferences.accentColor === accent.value && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <Check size={18} className="text-white drop-shadow" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Collection */}
        <section className="glass rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-1">
            "Not Played Recently" Threshold
          </h2>
          <p className="text-xs text-text-secondary mb-3">
            Games without a play log within this period get tagged automatically.
          </p>
          <div className="flex gap-2">
            {THRESHOLD_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() =>
                  setPreferences({ notPlayedRecentlyDays: preset.value })
                }
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all flex-1 ${
                  preferences.notPlayedRecentlyDays === preset.value
                    ? 'bg-primary text-white tag-glow'
                    : 'glass-pill text-text-secondary'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </section>

        {/* Players */}
        <section className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Players</h2>
            <button
              onClick={() => {
                setAddingPlayer(true);
                setEditingPlayer(null);
              }}
              className="flex items-center gap-1 text-xs text-primary font-medium"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          {/* Add player form */}
          {addingPlayer && (
            <div className="mb-4 flex flex-col gap-3 glass-light rounded-xl p-3">
              <input
                type="text"
                placeholder="Player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                autoFocus
                className="w-full bg-transparent glass-input rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
              />
              <div className="flex gap-2 flex-wrap">
                {PLAYER_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewPlayerColor(color)}
                    className="w-7 h-7 rounded-full transition-transform"
                    style={{
                      backgroundColor: color,
                      transform: newPlayerColor === color ? 'scale(1.2)' : 'scale(1)',
                      outline: newPlayerColor === color ? `2px solid ${color}` : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAddingPlayer(false)}
                  className="flex-1 text-xs text-text-secondary py-2 rounded-lg glass-pill"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPlayer}
                  disabled={!newPlayerName.trim()}
                  className="flex-1 text-xs text-white py-2 rounded-lg bg-primary disabled:opacity-50"
                >
                  Add Player
                </button>
              </div>
            </div>
          )}

          {/* Player list */}
          <div className="flex flex-col gap-2">
            {players.length === 0 && !addingPlayer && (
              <p className="text-xs text-text-secondary">No players yet. Add one above.</p>
            )}
            {players.map((player) => (
              <div key={player.id}>
                {editingPlayer?.id === player.id ? (
                  <div className="flex flex-col gap-2 glass-light rounded-xl p-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      className="w-full bg-transparent glass-input rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none"
                    />
                    <div className="flex gap-2 flex-wrap">
                      {PLAYER_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setEditColor(color)}
                          className="w-7 h-7 rounded-full transition-transform"
                          style={{
                            backgroundColor: color,
                            transform: editColor === color ? 'scale(1.2)' : 'scale(1)',
                            outline: editColor === color ? `2px solid ${color}` : 'none',
                            outlineOffset: '2px',
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingPlayer(null)}
                        className="flex-1 text-xs text-text-secondary py-2 rounded-lg glass-pill"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 text-xs text-white py-2 rounded-lg bg-primary"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="text-sm text-text-primary flex-1">{player.name}</span>
                    <button
                      onClick={() => startEdit(player)}
                      className="text-text-secondary/40 hover:text-text-secondary transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeletePlayerTarget(player)}
                      className="text-text-secondary/40 hover:text-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Data */}
        <section className="glass rounded-2xl overflow-hidden">
          <h2 className="text-sm font-semibold text-text-primary px-4 pt-4 pb-3">
            Data
          </h2>
          <button
            onClick={exportData}
            className="flex items-center gap-3 w-full px-4 py-3 text-left active:bg-white/5 transition-colors"
          >
            <Download size={20} className="text-primary" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                Export Data
              </p>
              <p className="text-xs text-text-secondary">
                Download a JSON backup of all your data
              </p>
            </div>
          </button>
          <div className="h-px bg-glass-border mx-4" />
          <button
            onClick={handleImport}
            className="flex items-center gap-3 w-full px-4 py-3 text-left active:bg-white/5 transition-colors"
          >
            <Upload size={20} className="text-primary" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                Import Data
              </p>
              <p className="text-xs text-text-secondary">
                Restore from a JSON backup file
              </p>
            </div>
          </button>
          {importError && (
            <p className="text-xs text-danger px-4 pb-3">{importError}</p>
          )}
        </section>

        {/* About + Support */}
        <section className="glass rounded-2xl p-4 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">About</h2>
          <p className="text-sm text-text-primary leading-relaxed">
            I built Meeply because my game nights had a problem: I'd forget
            which games I own, nobody could remember who won last time, and
            picking what to play took longer than actually playing.
          </p>
          <p className="text-sm text-text-primary leading-relaxed">
            So I made this — a dead-simple app that lives on your phone, works
            offline, and doesn't need you to create yet another account.
          </p>
          <p className="text-sm text-text-primary leading-relaxed">
            If Meeply saves your group from the "what should we play" spiral,
            consider buying me a coffee (or a new set of dice).
          </p>
          <div className="flex gap-3">
            <a
              href="https://ko-fi.com/U7U41MX9IQ"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#FF5E5B] py-3 text-white text-sm font-semibold active:scale-95 transition-transform"
            >
              <Heart size={16} />
              Ko-fi
            </a>
            <a
              href="https://www.paypal.com/paypalme/GuillermoSerrano775"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#0070BA] py-3 text-white text-sm font-semibold active:scale-95 transition-transform"
            >
              PayPal
            </a>
          </div>
        </section>

        {/* Privacy + Version */}
        <div className="glass-light rounded-2xl p-4">
          <p className="text-xs text-text-secondary text-center leading-relaxed">
            All data stays on your device — no accounts, no cloud, no tracking.
          </p>
        </div>
        <p className="text-xs text-text-secondary text-center pb-2">
          Meeply v0.2.0
        </p>
      </div>

      <ConfirmDialog
        open={importConfirmOpen}
        onOpenChange={setImportConfirmOpen}
        title="Import Data"
        description="This will replace all your current data with the imported backup. This action cannot be undone."
        confirmLabel="Import"
        confirmVariant="primary"
        onConfirm={confirmImport}
      />

      <ConfirmDialog
        open={!!deletePlayerTarget}
        onOpenChange={(open) => { if (!open) setDeletePlayerTarget(null); }}
        title={`Delete ${deletePlayerTarget?.name ?? 'player'}?`}
        description="This will permanently remove this player."
        onConfirm={() => {
          if (deletePlayerTarget) deletePlayer(deletePlayerTarget.id);
          setDeletePlayerTarget(null);
        }}
      />
    </div>
  );
}
