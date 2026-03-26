import { useState, useEffect } from 'react';
import { getSummaries } from '../utils/api';
import type { Summary } from '../utils/types';
import { renderMarkdown } from '../utils/markdown';

function parseDate(dateStr: string): Date {
  // Handle "2026-03-25", "2026-03-25T00:00:00.000Z", etc.
  // Split to just get YYYY-MM-DD and create date in local timezone
  const parts = dateStr.split('T')[0].split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function formatDate(date: Date) {
  if (isNaN(date.getTime())) {
    return { dayShort: '?', dayNum: '?', dayName: 'Unknown', fullDate: 'Unknown date' };
  }
  return {
    dayShort: date.toLocaleDateString('en-US', { weekday: 'short' }),
    dayNum: date.getDate(),
    dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
    fullDate: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

export default function HistoryPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    getSummaries(30)
      .then((res) => setSummaries(res.data.summaries))
      .catch((err) => console.error('Failed to load history:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted text-sm">Loading history...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Standup history</h2>
        <p className="text-muted text-sm">Your saved standups from past days. Click to expand.</p>
      </div>

      {summaries.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-card border border-border rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className="text-muted text-sm">No saved standups yet.</p>
          <p className="text-muted/50 text-xs mt-1">Generate and save your first one from the Generate tab.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {summaries.map((s) => {
            const date = parseDate(s.summary_date);
            const { dayShort, dayNum, dayName, fullDate } = formatDate(date);
            const isExpanded = expandedId === s.id;

            return (
              <button
                key={s.id}
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
                className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-border/80 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/5 border border-accent/10 rounded-lg flex flex-col items-center justify-center leading-none">
                      <span className="text-[9px] text-accent/60 font-medium">{dayShort}</span>
                      <span className="text-sm text-accent font-bold">{dayNum}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium group-hover:text-white transition-colors">{dayName}</p>
                      <p className="text-[11px] text-muted">{fullDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.is_edited && (
                      <span className="text-[10px] text-muted/50 bg-border/30 rounded px-1.5 py-0.5">edited</span>
                    )}
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`text-muted/40 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>

                {!isExpanded && (
                  <p className="text-xs text-muted/60 mt-2 ml-[52px] line-clamp-2 font-mono">
                    {s.content.slice(0, 150)}...
                  </p>
                )}

                {isExpanded && (
                  <div
                    className="text-sm text-gray-300 leading-relaxed mt-3 ml-[52px] bg-bg/30 rounded-lg p-4 border border-border/30"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(s.content) }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
