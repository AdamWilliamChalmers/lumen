"use client";

interface SparklineChartProps {
  scores: number[];
}

export default function SparklineChart({ scores }: SparklineChartProps) {
  const data = scores.slice(-14);
  const max = Math.max(...data, 1);

  return (
    <div className="flex items-end gap-1 h-16">
      {data.length === 0 ? (
        <p className="text-[11px] text-[var(--lm-muted)]">No session data yet</p>
      ) : (
        data.map((score, i) => (
          <div
            key={i}
            className="flex-1 min-w-[4px] rounded-t"
            style={{
              height: `${Math.max(4, (score / max) * 64)}px`,
              background: score >= 60 ? "var(--lm-drift)" : "var(--lm-loop)",
              opacity: score >= 60 ? 0.85 : 1,
            }}
          />
        ))
      )}
    </div>
  );
}
