const STATUS_CONFIG = {
  published: { label: 'Published', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', pulse: false },
  pending:   { label: 'Pending review', cls: 'bg-amber-50 text-amber-600 border-amber-200', pulse: false },
  generating: { label: 'Generating', cls: 'bg-amber-50 text-amber-600 border-amber-200', pulse: true },
}

const relativeDate = (dateStr) => {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export default function MyGamesList({ games = [], onReview, onPlay, onShare, onNew }) {
  if (!games.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-[16px] p-8 text-center space-y-3">
        <p className="text-slate-400 text-sm font-semibold">No games yet</p>
        <button
          onClick={onNew}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-5 py-2.5 rounded-[10px] transition-colors"
        >
          + New Game
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">My Games</span>
        <button
          onClick={onNew}
          className="text-xs font-bold text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full transition-colors"
        >
          + New Game
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {games.map((game, i) => {
          const status = game.status?.toLowerCase() ?? 'published'
          const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.published

          return (
            <div key={game.id ?? i} className="px-5 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800 truncate">{game.name}</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${cfg.cls} ${cfg.pulse ? 'animate-pulse' : ''}`}>
                    {cfg.label}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">
                  {game.category} · {relativeDate(game.createdAt)}
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {status === 'pending' && (
                  <button
                    onClick={() => onReview(game)}
                    className="text-xs font-bold text-amber-600 border border-amber-200 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-full transition-colors"
                  >
                    Review
                  </button>
                )}
                {status === 'published' && (
                  <>
                    <button
                      onClick={() => onPlay(game)}
                      className="text-xs font-bold text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full transition-colors"
                    >
                      Play
                    </button>
                    <button
                      onClick={() => onShare(game)}
                      className="text-xs font-bold text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1 rounded-full transition-colors"
                    >
                      Share
                    </button>
                  </>
                )}
                {status === 'generating' && (
                  <span className="text-xs font-semibold text-slate-400 px-2">In progress…</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
