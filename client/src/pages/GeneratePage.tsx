import { useState } from 'react';
import { fetchActivity, saveSummary } from '../utils/api';
import type { Activity } from '../utils/types';
import { renderMarkdown } from '../utils/markdown';
import ActivityBreakdown from '../components/ActivityBreakdown';
import { type UserSettings } from '../components/SettingsPanel';

const TIME_RANGES = [
  { label: 'Today', days: 1 },
  { label: '3 days', days: 3 },
  { label: 'Week', days: 7 },
];

type SummaryTab = 'ai' | 'raw';

interface Props {
  settings: UserSettings;
}

export default function GeneratePage({ settings }: Props) {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [rawSummary, setRawSummary] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedRange, setSelectedRange] = useState(settings.defaultRange);
  const [activeTab, setActiveTab] = useState<SummaryTab>('ai');
  const [isEditing, setIsEditing] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setSaved(false);
    setIsEditing(false);
    try {
      const res = await fetchActivity(selectedRange);
      let fetched = res.data.activities as Activity[];

      if (!settings.showCommits) fetched = fetched.filter((a) => a.type !== 'commit');
      if (!settings.showPRs) fetched = fetched.filter((a) => a.type !== 'pr');
      if (!settings.showReviews) fetched = fetched.filter((a) => a.type !== 'review');

      setActivities(fetched);
      setAiSummary(res.data.aiSummary);
      setRawSummary(res.data.rawSummary);

      const defaultSummary = res.data.aiSummary || res.data.rawSummary;
      setEditedSummary(defaultSummary);
      setActiveTab(res.data.aiSummary ? 'ai' : 'raw');
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabSwitch = (tab: SummaryTab) => {
    setActiveTab(tab);
    setEditedSummary(tab === 'ai' && aiSummary ? aiSummary : rawSummary);
    setSaved(false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await saveSummary(today, editedSummary);
      setSaved(true);
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const commitCount = activities.filter((a) => a.type === 'commit').length;
  const prCount = activities.filter((a) => a.type === 'pr').length;
  const reviewCount = activities.filter((a) => a.type === 'review').length;
  const isCustomRange = !TIME_RANGES.some((r) => r.days === selectedRange);
  const hasSummary = editedSummary && editedSummary !== 'No activity found for this period.';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Generate standup</h2>
        <p className="text-muted text-sm">Pull your GitHub activity and create a standup summary.</p>
      </div>

      {/* Controls */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex gap-1.5 bg-bg rounded-lg p-1 border border-border/50">
            {TIME_RANGES.map((range) => (
              <button
                key={range.days}
                onClick={() => setSelectedRange(range.days)}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-200 ${
                  selectedRange === range.days ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
            {isCustomRange && (
              <button className="text-xs font-medium px-3 py-1.5 rounded-md bg-accent text-white shadow-sm">
                {selectedRange}d
              </button>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-accent hover:bg-blue-400 disabled:opacity-50 text-white font-medium rounded-xl py-2.5 px-5 transition-all duration-200 text-sm flex items-center justify-center gap-2 sm:ml-auto"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              'Generate standup'
            )}
          </button>
        </div>

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

      {/* Stats */}
      {activities.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Activities', value: activities.length, color: 'text-accent' },
            { label: 'Commits', value: commitCount, color: 'text-green-400' },
            { label: 'PRs', value: prCount, color: 'text-purple-400' },
            { label: 'Reviews', value: reviewCount, color: 'text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl px-4 py-3 text-center">
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-muted text-[11px] mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Activity breakdown */}
      {activities.length > 0 && (
        <div className="mb-5">
          <ActivityBreakdown activities={activities} />
        </div>
      )}

      {/* Summary with tabs */}
      {hasSummary && (
        <div className="bg-card border border-border rounded-2xl p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleTabSwitch('ai')}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  activeTab === 'ai' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-muted hover:text-white'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                  <path d="M16 14a4 4 0 0 1 4 4v2H4v-2a4 4 0 0 1 4-4" />
                </svg>
                Smart summary
                {!aiSummary && <span className="text-[10px] text-muted/50 ml-1">(no API key)</span>}
              </button>
              <button
                onClick={() => handleTabSwitch('raw')}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  activeTab === 'raw' ? 'bg-border/30 text-white border border-border' : 'text-muted hover:text-white'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Raw
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`text-xs border rounded-lg px-3 py-1.5 transition-all duration-200 ${
                  isEditing
                    ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                    : 'text-muted hover:text-white border-border'
                }`}
              >
                {isEditing ? 'Preview' : 'Edit'}
              </button>
              <button onClick={handleCopy} className="text-xs text-muted hover:text-white border border-border rounded-lg px-3 py-1.5 transition-all duration-200">
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={handleSave} className="text-xs bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 rounded-lg px-3 py-1.5 transition-all duration-200">
                {saved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>

          {/* Tab indicator */}
          {activeTab === 'ai' && aiSummary && !isEditing && (
            <div className="flex items-center gap-1.5 mb-3 text-[11px] text-accent/60">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              AI-generated summary
            </div>
          )}
          {activeTab === 'raw' && !isEditing && (
            <div className="flex items-center gap-1.5 mb-3 text-[11px] text-muted/50">
              <div className="w-1.5 h-1.5 rounded-full bg-muted/50" />
              Raw GitHub activity
            </div>
          )}
          {isEditing && (
            <div className="flex items-center gap-1.5 mb-3 text-[11px] text-amber-400/60">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Editing — click Preview to see formatted output
            </div>
          )}

          {/* Content: rendered markdown or editable textarea */}
          {isEditing ? (
            <textarea
              value={editedSummary}
              onChange={(e) => { setEditedSummary(e.target.value); setSaved(false); }}
              rows={Math.max(8, editedSummary.split('\n').length + 2)}
              className="w-full bg-bg/50 border border-border/50 rounded-xl p-4 font-mono text-sm text-gray-200 resize-y focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-200 leading-relaxed"
            />
          ) : (
            <div
              className="bg-bg/50 border border-border/50 rounded-xl p-5 text-sm text-gray-200 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(editedSummary) }}
            />
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasSummary && !loading && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-card border border-border rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <p className="text-muted text-sm">Pick a time range and hit generate.</p>
          <p className="text-muted/50 text-xs mt-1">We'll pull your commits, PRs, and reviews from GitHub.</p>
        </div>
      )}
    </div>
  );
}
