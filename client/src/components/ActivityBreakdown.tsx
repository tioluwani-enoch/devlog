import { useState } from 'react';
import type { Activity } from '../utils/types';

interface Props {
  activities: Activity[];
}

const TYPE_CONFIG = {
  commit: { label: 'Commit', color: 'bg-green-400', textColor: 'text-green-400' },
  pr: { label: 'PR', color: 'bg-purple-400', textColor: 'text-purple-400' },
  review: { label: 'Review', color: 'bg-amber-400', textColor: 'text-amber-400' },
} as const;

function RepoSection({ repo, items }: { repo: string; items: Activity[] }) {
  const [expanded, setExpanded] = useState(false);
  const PREVIEW_COUNT = 4;
  const hasMore = items.length > PREVIEW_COUNT;
  const visibleItems = expanded ? items : items.slice(0, PREVIEW_COUNT);

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted/60">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span className="text-sm font-medium">{repo}</span>
        <span className="text-xs text-muted ml-auto">{items.length} events</span>
      </div>

      {/* Activity bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden bg-border/30 mb-2">
        {(['commit', 'pr', 'review'] as const).map((type) => {
          const count = items.filter((i) => i.type === type).length;
          if (count === 0) return null;
          const pct = (count / items.length) * 100;
          return (
            <div
              key={type}
              className={`${TYPE_CONFIG[type].color} transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>

      {/* Items list */}
      <div className="space-y-1 ml-5">
        {visibleItems.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${TYPE_CONFIG[item.type].color}`} />
            <span className="text-gray-400 truncate">{item.title}</span>
            <span className={`flex-shrink-0 ${TYPE_CONFIG[item.type].textColor} opacity-60`}>
              {TYPE_CONFIG[item.type].label}
            </span>
          </div>
        ))}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-accent/70 hover:text-accent ml-3 transition-colors"
          >
            {expanded ? 'Show less' : `+${items.length - PREVIEW_COUNT} more`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ActivityBreakdown({ activities }: Props) {
  const byRepo: Record<string, Activity[]> = {};
  for (const a of activities) {
    const short = a.repo_name.split('/').pop() || a.repo_name;
    if (!byRepo[short]) byRepo[short] = [];
    byRepo[short].push(a);
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
        Activity breakdown
      </h3>
      <div className="space-y-3">
        {Object.entries(byRepo).map(([repo, items]) => (
          <RepoSection key={repo} repo={repo} items={items} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 pt-3 border-t border-border/30">
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5 text-[11px] text-muted">
            <div className={`w-2 h-2 rounded-full ${cfg.color}`} />
            {cfg.label}
          </div>
        ))}
      </div>
    </div>
  );
}
