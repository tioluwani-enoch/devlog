import { useState, useEffect } from 'react';

export interface UserSettings {
  defaultRange: number;
  showCommits: boolean;
  showPRs: boolean;
  showReviews: boolean;
  summaryFormat: 'markdown' | 'plain';
  customRangeDays: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  defaultRange: 1,
  showCommits: true,
  showPRs: true,
  showReviews: true,
  summaryFormat: 'markdown',
  customRangeDays: 14,
};

// Persist to localStorage
function loadSettings(): UserSettings {
  try {
    const stored = localStorage.getItem('devlog-settings');
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: UserSettings) {
  localStorage.setItem('devlog-settings', JSON.stringify(settings));
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      saveSettings(next);
      return next;
    });
  };

  return { settings, updateSettings };
}

// --- Component ---

interface Props {
  open: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdate: (updates: Partial<UserSettings>) => void;
}

const RANGE_OPTIONS = [
  { label: '1 day (today)', value: 1 },
  { label: '3 days', value: 3 },
  { label: '7 days (this week)', value: 7 },
  { label: 'Custom', value: -1 },
];

export default function SettingsPanel({ open, onClose, settings, onUpdate }: Props) {
  const [customDays, setCustomDays] = useState(String(settings.customRangeDays));
  const isCustom = !RANGE_OPTIONS.some(
    (o) => o.value === settings.defaultRange && o.value !== -1
  );

  useEffect(() => {
    setCustomDays(String(settings.customRangeDays));
  }, [settings.customRangeDays]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-card border-l border-border z-50 overflow-y-auto shadow-2xl shadow-black/60">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Settings</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border/30 transition-colors text-muted hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Default time range */}
          <section className="mb-6">
            <h3 className="text-sm font-medium mb-1">Default time range</h3>
            <p className="text-xs text-muted mb-3">How far back to look when you hit generate.</p>
            <div className="space-y-1.5">
              {RANGE_OPTIONS.map((opt) => {
                const isSelected =
                  opt.value === -1 ? isCustom : settings.defaultRange === opt.value;
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
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-all duration-200 ${
                      isSelected
                        ? 'bg-accent/10 border-accent/30 text-white'
                        : 'border-border/50 text-muted hover:text-white hover:border-border'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {isCustom && (
              <div className="mt-2 flex items-center gap-2">
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
                <span className="text-xs text-muted">days (1–90)</span>
              </div>
            )}
          </section>

          {/* Activity types */}
          <section className="mb-6">
            <h3 className="text-sm font-medium mb-1">Activity types</h3>
            <p className="text-xs text-muted mb-3">Choose which GitHub events to include.</p>
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
                      <div className="text-sm text-gray-200 group-hover:text-white transition-colors">
                        {item.label}
                      </div>
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
          </section>

          {/* Summary format */}
          <section className="mb-6">
            <h3 className="text-sm font-medium mb-1">Summary format</h3>
            <p className="text-xs text-muted mb-3">How your standup text is formatted.</p>
            <div className="flex gap-2">
              {[
                { value: 'markdown' as const, label: 'Markdown', desc: '**bold**, `code`' },
                { value: 'plain' as const, label: 'Plain text', desc: 'No formatting' },
              ].map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => onUpdate({ summaryFormat: fmt.value })}
                  className={`flex-1 text-left px-3 py-2.5 rounded-lg border transition-all duration-200 ${
                    settings.summaryFormat === fmt.value
                      ? 'bg-accent/10 border-accent/30'
                      : 'border-border/50 hover:border-border'
                  }`}
                >
                  <div className="text-sm font-medium">{fmt.label}</div>
                  <div className="text-[11px] text-muted">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Reset */}
          <section className="pt-4 border-t border-border/30">
            <button
              onClick={() => {
                onUpdate(DEFAULT_SETTINGS);
                setCustomDays('14');
              }}
              className="text-xs text-muted hover:text-red-400 transition-colors"
            >
              Reset to defaults
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
