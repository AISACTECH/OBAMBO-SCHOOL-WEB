"use client";

export function SubjectBarChart({ data }: { data: { subject: string; marks: number }[] }) {
  const max = 100;
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.subject} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-xs text-[var(--color-muted)]">{d.subject}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--color-bg)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-700"
              style={{ width: `${Math.min(100, (d.marks / max) * 100)}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs font-semibold">{d.marks}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendLineChart({ points }: { points: { label: string; value: number }[] }) {
  if (points.length === 0) return null;
  const width = 320;
  const height = 100;
  const max = Math.max(...points.map((p) => p.value), 1);
  const min = Math.min(...points.map((p) => p.value), 0);
  const range = Math.max(max - min, 1);
  const step = width / Math.max(points.length - 1, 1);

  const coords = points.map((p, i) => {
    const x = i * step;
    const y = height - ((p.value - min) / range) * (height - 20) - 10;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Performance trend over time">
      <polyline points={coords.join(" ")} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" />
      {points.map((p, i) => (
        <circle key={i} cx={i * step} cy={height - ((p.value - min) / range) * (height - 20) - 10} r="3.5" fill="var(--color-secondary)" />
      ))}
    </svg>
  );
}
