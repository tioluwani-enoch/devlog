import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchActivity, saveSummary, getSummaries } from '../utils/api';
import type { Activity, Summary } from '../utils/types';
import SummaryHistory from '../components/SummaryHistory';
import ActivityBreakdown from '../components/ActivityBreakdown';
import SettingsPanel, { useSettings } from '../components/SettingsPanel';

const TIME_RANGES = [
  { label: 'Today', days: 1 },
  { label: '3 days', days: 3 },
  { label: 'Week', days: 7 },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [summary, setSummary] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [history, setHistory] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedRange, setSelectedRange] = useState(settings.defaultRange);

  const handleGenerate = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetchActivity(selectedRange);
      let fetched = res.data.activities as Activity[];

      // Filter by user's activity type preferences
      if (!settings.showCommits) fetched = fetched.filter((a) => a.type !== 'commit');
      if (!settings.showPRs) fetched = fetched.filter((a) => a.type !== 'pr');
      if (!settings.showReviews) fetched = fetched.filter((a) => a.type !== 'review');

      setActivities(fetched);
      setSummary(res.data.summary);
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await saveSummary(today, summary);
      setSaved(true);
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShowHistory = async () => {
    if (!showHistory) {
      try {
        const res = await getSummaries(14);
        setHistory(res.data.summaries);
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    }
    setShowHistory(!showHistory);
  };

  const commitCount = activities.filter((a) => a.type === 'commit').length;
  const prCount = activities.filter((a) => a.type === 'pr').length;
  const reviewCount = activities.filter((a) => a.type === 'review').length;

  // Check if current range matches a preset or is custom
  const isCustomRange = !TIME_RANGES.some((r) => r.days === selectedRange);

  return (
    <div className="min-h-screen relative">
      {/* Grid bg */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">DevLog</h1>
              <p className="text-muted text-xs">standup generator</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:border-border/80 hover:bg-card transition-all text-muted hover:text-white"
              title="Settings"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>

            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
              <img
                src={user?.avatar_url}
                alt={user?.username}
                className="w-5 h-5 rounded-full"
              />
              <span className="text-sm text-muted">{user?.username}</span>
            </div>
            <button
              onClick={logout}
              className="text-xs text-muted hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Generate card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Time range pills */}
            <div className="flex gap-1.5 bg-bg rounded-lg p-1 border border-border/50">
              {TIME_RANGES.map((range) => (
                <button
                  key={range.days}
                  onClick={() => setSelectedRange(range.days)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-200 ${
                    selectedRange === range.days
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  {range.label}
                </button>
              ))}
              {/* Show custom pill if user set a custom range in settings */}
              {isCustomRange && (
                <button
                  className="text-xs font-medium px-3 py-1.5 rounded-md bg-accent text-white shadow-sm"
                >
                  {selectedRange}d
                </button>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-accent hover:bg-blue-400 disabled:opacity-50 disabled:hover:bg-accent text-white font-medium rounded-xl py-2.5 px-5 transition-all duration-200 text-sm flex items-center justify-center gap-2 sm:ml-auto"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Fetching...
                </>
              ) : (
                'Generate standup'
              )}
            </button>
          </div>

          {/* Active filters indicator */}
          {(!settings.showCommits || !settings.showPRs || !settings.showReviews) && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filtering:
              {settings.showCommits && <span className="text-green-400/70">commits</span>}
              {settings.showPRs && <span className="text-purple-400/70">PRs</span>}
              {settings.showReviews && <span className="text-amber-400/70">reviews</span>}
            </div>
          )}
        </div>

        {/* Stats bar */}
        {activities.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Activities', value: activities.length, color: 'text-accent' },
              { label: 'Commits', value: commitCount, color: 'text-green-400' },
              { label: 'PRs', value: prCount, color: 'text-purple-400' },
              { label: 'Reviews', value: reviewCount, color: 'text-amber-400' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-card border border-border rounded-xl px-4 py-3 text-center"
              >
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-muted text-[11px] mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Activity breakdown */}
        {activities.length > 0 && (
          <ActivityBreakdown activities={activities} />
        )}

        {/* Summary editor */}
        {summary && (
          <div className="bg-card border border-border rounded-2xl p-5 mb-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <h2 className="text-sm font-medium">Your standup</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="text-xs text-muted hover:text-white border border-border rounded-lg px-3 py-1.5 transition-all duration-200 hover:border-border/80"
                >
                  {copied ? '  Copied!  ' : '  Copy  '}
                </button>
                <button
                  onClick={handleSave}
                  className="text-xs bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 rounded-lg px-3 py-1.5 transition-all duration-200"
                >
                  {saved ? 'Saved!' : 'Save'}
                </button>
              </div>
            </div>
            <textarea
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                setSaved(false);
              }}
              rows={Math.max(8, summary.split('\n').length + 2)}
              className="w-full bg-bg/50 border border-border/50 rounded-xl p-4 font-mono text-sm text-gray-200 resize-y focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-200 leading-relaxed"
            />
          </div>
        )}

        {/* Empty state */}
        {!summary && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-card border border-border rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <p className="text-muted text-sm">Pick a time range and hit generate.</p>
            <p className="text-muted/50 text-xs mt-1">We'll pull your commits, PRs, and reviews from GitHub.</p>
          </div>
        )}

        {/* History */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <button
            onClick={handleShowHistory}
            className="text-sm text-muted hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-200 ${showHistory ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Past standups
          </button>
          {showHistory && <SummaryHistory summaries={history} />}
        </div>
      </div>

      {/* Settings panel */}
      <SettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdate={updateSettings}
      />
    </div>
  );
}
