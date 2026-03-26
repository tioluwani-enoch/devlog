import { useState } from 'react';
import type { UserSettings } from '../components/SettingsPanel';

interface Props {
  settings: UserSettings;
  onUpdate: (updates: Partial<UserSettings>) => void;
}

const RANGE_OPTIONS = [
  { label: '1 day (today)', value: 1 },
  { label: '3 days', value: 3 },
  { label: '7 days (this week)', value: 7 },
  { label: 'Custom', value: -1 },
];

const DEFAULT_SETTINGS: UserSettings = {
  defaultRange: 1,
  showCommits: true,
  showPRs: true,
  showReviews: true,
  summaryFormat: 'markdown',
  customRangeDays: 14,
};

export default function SettingsPage({ settings, onUpdate }: Props) {
  const [customDays, setCustomDays] = useState(String(settings.customRangeDays));
  const isCustom = !RANGE_OPTIONS.some((o) => o.value === settings.defaultRange && o.value !== -1);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Settings</h2>
        <p className="text-muted text-sm">Customize how DevLog generates your standups.</p>
      </div>

      <div className="space-y-6 max-w-lg">
        {/* Default time range */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-medium mb-1">Default time range</h3>
          <p className="text-xs text-muted mb-4">How far back to look when you hit generate.</p>
          <div className="space-y-1.5">
            {RANGE_OPTIONS.map((opt) => {
              const isSelected = opt.value === -1 ? isCustom : settings.defaultRange === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (opt.value === -1) {
                      onUpdate({ defaultRange: settings.customRangeDays });
                    } else {
                      onUpdate({ defaultRange: opt.value });
                    }
                  }}
                  className={`w-full text-left text-sm px-3 py-2.5 rounded-lg border transition-all duration-200 ${
                    isSelected ? 'bg-accent/10 border-accent/30 text-white' : 'border-border/50 text-muted hover:text-white hover:border-border'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {isCustom && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={90}
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                onBlur={() => {
                  const val = Math.max(1, Math.min(90, Number(customDays) || 14));
                  setCustomDays(String(val));
                  onUpdate({ customRangeDays: val, defaultRange: val });
                }}
                className="w-20 bg-bg border border-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent/50"
              />
              <span className="text-xs text-muted">days (1-90)</span>
            </div>
          )}
        </div>

        {/* Activity types */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-medium mb-1">Activity types</h3>
          <p className="text-xs text-muted mb-4">Choose which GitHub events to include in your standup.</p>
          <div className="space-y-2">
            {[
              { key: 'showCommits' as const, label: 'Commits', desc: 'Push events', color: 'bg-green-400' },
              { key: 'showPRs' as const, label: 'Pull requests', desc: 'Opened or updated', color: 'bg-purple-400' },
              { key: 'showReviews' as const, label: 'Reviews', desc: 'Code reviews on PRs', color: 'bg-amber-400' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-border transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <div>
                    <div className="text-sm text-gray-200 group-hover:text-white transition-colors">{item.label}</div>
                    <div className="text-[11px] text-muted">{item.desc}</div>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings[item.key]}
                    onChange={(e) => onUpdate({ [item.key]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-border/60 rounded-full peer-checked:bg-accent transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Summary format */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-medium mb-1">Summary format</h3>
          <p className="text-xs text-muted mb-4">How your standup text is formatted.</p>
          <div className="flex gap-2">
            {[
              { value: 'markdown' as const, label: 'Markdown', desc: '**bold**, `code`' },
              { value: 'plain' as const, label: 'Plain text', desc: 'No formatting' },
            ].map((fmt) => (
              <button
                key={fmt.value}
                onClick={() => onUpdate({ summaryFormat: fmt.value })}
                className={`flex-1 text-left px-3 py-2.5 rounded-lg border transition-all duration-200 ${
                  settings.summaryFormat === fmt.value ? 'bg-accent/10 border-accent/30' : 'border-border/50 hover:border-border'
                }`}
              >
                <div className="text-sm font-medium">{fmt.label}</div>
                <div className="text-[11px] text-muted">{fmt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Reset */}
        <div className="pt-2">
          <button
            onClick={() => {
              onUpdate(DEFAULT_SETTINGS);
              setCustomDays('14');
            }}
            className="text-xs text-muted hover:text-red-400 transition-colors"
          >
            Reset all settings to defaults
          </button>
        </div>
      </div>
    </div>
  );
}
