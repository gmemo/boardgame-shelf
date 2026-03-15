import { usePreferencesStore } from '../../stores';

const THRESHOLD_PRESETS = [
  { label: '30d', value: 30 },
  { label: '60d', value: 60 },
  { label: '90d', value: 90 },
  { label: '180d', value: 180 },
];

export default function SettingsPage() {
  const { preferences, setPreferences } = usePreferencesStore();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Not Played Recently Threshold */}
      <div className="glass-light rounded-2xl p-4">
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
              onClick={() => setPreferences({ notPlayedRecentlyDays: preset.value })}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all flex-1 ${
                preferences.notPlayedRecentlyDays === preset.value
                  ? 'bg-primary text-white'
                  : 'glass-pill text-text-secondary'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
