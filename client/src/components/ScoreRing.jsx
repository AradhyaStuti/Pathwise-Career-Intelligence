function tone(pct) {
  if (pct >= 75) return { stroke: '#16a34a', text: 'text-green-600', bar: 'bg-green-500' };
  if (pct >= 50) return { stroke: '#ca8a04', text: 'text-yellow-600', bar: 'bg-yellow-500' };
  return { stroke: '#dc2626', text: 'text-red-600', bar: 'bg-red-500' };
}

export function ScoreRing({ score, label = 'out of 100', size = 144 }) {
  const pct = Math.max(0, Math.min(100, score || 0));
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const t = tone(pct);
  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score ${pct} out of 100`}
    >
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={t.stroke}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-3xl font-bold tabular-nums ${t.text}`}>{pct}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export function ScoreBar({ value, weight }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  const t = tone(pct);
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="font-medium tabular-nums">{value}/100</span>
        <span className="text-slate-500">weight {weight}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${t.bar} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
