export default function ProgressBar({ current, total }) {
  const pct = total > 0 ? (current / total) * 100 : 0
  const remaining = total - current

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 min-w-0 truncate">
          Entry {current} of {total} · {remaining} remaining
        </span>
        <span className="text-xs font-bold text-emerald-600 flex-shrink-0">{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
