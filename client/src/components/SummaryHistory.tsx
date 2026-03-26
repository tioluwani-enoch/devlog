import type { Summary } from '../utils/types';

interface Props {
  summaries: Summary[];
}

export default function SummaryHistory({ summaries }: Props) {
  if (summaries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted text-sm">No saved standups yet.</p>
        <p className="text-muted/50 text-xs mt-1">Generate and save your first one above.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {summaries.map((s) => {
        const date = new Date(s.summary_date + 'T00:00:00');
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return (
          <div
            key={s.id}
            className="bg-card border border-border rounded-xl p-4 hover:border-border/80 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent/5 border border-accent/10 rounded-lg flex flex-col items-center justify-center leading-none">
                  <span className="text-[9px] text-accent/60 font-medium">{dayName}</span>
                  <span className="text-[11px] text-accent font-bold">{date.getDate()}</span>
                </div>
                <span className="text-sm font-medium text-gray-300">{monthDay}</span>
              </div>
              {s.is_edited && (
                <span className="text-[10px] text-muted/50 bg-border/30 rounded px-1.5 py-0.5">
                  edited
                </span>
              )}
            </div>
            <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap leading-relaxed line-clamp-6 group-hover:text-gray-300 transition-colors">
              {s.content}
            </pre>
          </div>
        );
      })}
    </div>
  );
}
