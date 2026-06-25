import { formatDelta } from "@/lib/scoring";

interface SelfComparisonProps {
  thisWeek: { intentional_pct: number; questions_asked: number; depth_moments: number };
  lastWeek?: { intentional_pct: number; questions_asked: number; depth_moments: number } | null;
  baseline?: { intentional_pct: number } | null;
}

export default function SelfComparison({ thisWeek, lastWeek, baseline }: SelfComparisonProps) {
  const rows = [
    {
      label: "Intentional use",
      delta: lastWeek ? formatDelta(thisWeek.intentional_pct, lastWeek.intentional_pct) : "—",
    },
    {
      label: "Questions asked",
      delta: lastWeek ? formatDelta(thisWeek.questions_asked, lastWeek.questions_asked) : "—",
    },
    {
      label: "Depth moments",
      delta: lastWeek ? formatDelta(thisWeek.depth_moments, lastWeek.depth_moments) : "—",
    },
  ];

  return (
    <div className="lm-surface p-4">
      <p className="lm-label mb-3">This week vs last week</p>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-[12px]">
            <span className="text-[var(--lm-secondary)]">{r.label}</span>
            <span className="text-[var(--lm-primary)]">{r.delta}</span>
          </div>
        ))}
      </div>
      {baseline && (
        <p className="text-[10px] text-[var(--lm-muted)] mt-3 pt-3 border-t border-[var(--lm-raised)]">
          vs your 4-week baseline: {baseline.intentional_pct}% intentional
        </p>
      )}
    </div>
  );
}
