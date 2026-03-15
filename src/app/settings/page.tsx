import { useState } from 'react';
import { Moon, Sun, Download, Upload, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePreferencesStore } from '../../stores';
import ToggleGroup from '../../components/ui/toggle-group';
import ConfirmDialog from '../../components/ui/confirm-dialog';
import { exportData, pickAndParseImportFile, applyImportData } from '../../lib/export-import';

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

const THEME_OPTIONS = [
  { value: 'dark' as const, label: 'Dark', icon: <Moon size={16} /> },
  { value: 'light' as const, label: 'Light', icon: <Sun size={16} /> },
];

export default function SettingsPage() {
  const { preferences, setPreferences } = usePreferencesStore();
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<Parameters<
    typeof applyImportData
  >[0] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

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

  return (
    <div className="p-4 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 pt-2 pb-4 bg-gradient-to-b from-background from-60% to-transparent">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      </div>

      <div className="flex flex-col gap-4">
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

        {/* About */}
        <section className="glass-light depth-1 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">
            About
          </h2>
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Meeply</span>{' '}
            v0.1.0
          </p>
          <p className="text-xs text-text-secondary mt-2 leading-relaxed">
            All data stays on your device — no accounts, no cloud, no tracking.
            Built with love for board game nights.
          </p>
        </section>
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
    </div>
  );
}
