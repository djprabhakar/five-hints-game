export default function StatsRow({ solved, points, streak }) {
  return (
    <>
      {/* Mobile: compact, wrapping stats line */}
      <div className="lg:hidden flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500 max-w-full">
        <span className="whitespace-nowrap"><strong className="text-slate-800 font-black">{solved}</strong> solved</span>
        <span className="text-slate-200">{'\u00b7'}</span>
        <span className="whitespace-nowrap"><strong className="text-emerald-600 font-black">{points}</strong> pts</span>
        {streak > 0 && (
          <>
            <span className="text-slate-200">{'\u00b7'}</span>
            <span className="text-amber-500 font-black whitespace-nowrap">Streak {streak}</span>
          </>
        )}
      </div>

      {/* Desktop: three pill cards */}
      <div className="hidden lg:grid grid-cols-3 gap-3">
        {[
          { label: 'Solved', value: solved },
          { label: 'Points', value: points },
          { label: 'Streak', value: streak },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-[12px] px-4 py-3 text-center">
            <div className="text-xl font-black text-slate-900 leading-tight">{value}</div>
            <div className="text-[11px] font-bold uppercase tracking-tight text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </>
  )
}
