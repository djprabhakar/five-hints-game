import { useState } from 'react'

export default function ReviewEntries({ game, entries = [], onApprove, onApproveAll, approvingIds = [], approved }) {
  const [expanded, setExpanded] = useState(null)

  if (!game) return null

  const pending = entries.filter((_, i) => !approvingIds.includes(i))

  return (
    <div className="mx-auto w-full space-y-4" style={{ maxWidth: 'var(--max-w-solo)' }}>
      <div className="bg-white border border-slate-200 rounded-[16px] p-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-black text-slate-900">{game.name}</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">{game.category} · {entries.length} entries</p>
        </div>
        {!approved && entries.length > 0 && (
          <button
            onClick={onApproveAll}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-4 py-2.5 rounded-[10px] transition-colors flex-shrink-0"
          >
            Approve All
          </button>
        )}
        {approved && (
          <span className="text-xs font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Published
          </span>
        )}
      </div>

      <div className="space-y-2">
        {entries.map((entry, i) => {
          const isExpanded = expanded === i
          const isApproving = approvingIds.includes(i)
          const answer = entry.answer ?? entry.word ?? '—'

          return (
            <div key={i} className="bg-white border border-slate-200 rounded-[12px] overflow-hidden">
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : i)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-black flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="font-bold text-slate-800 flex-1">{answer}</span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isApproving ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 text-amber-600 border border-amber-200'
                }`}>
                  {isApproving ? 'Approving…' : 'Pending'}
                </span>
                {!isApproving && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onApprove(entry, i) }}
                    className="text-xs font-bold text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full transition-colors ml-1"
                  >
                    Approve
                  </button>
                )}
                <span className="text-slate-300 ml-1">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 px-4 py-3 space-y-2 bg-slate-50/50">
                  {(entry.clues ?? entry.hints ?? []).map((clue, ci) => (
                    <div key={ci} className="flex gap-2 text-sm">
                      <span className="text-[11px] font-black text-slate-400 mt-0.5 w-4 flex-shrink-0">{ci + 1}</span>
                      <span className="text-slate-700">{typeof clue === 'object' ? clue.text ?? JSON.stringify(clue) : clue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
