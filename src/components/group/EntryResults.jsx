const RANK_ICONS = ['🥇', '🥈', '🥉']

export default function EntryResults({ session, myName, onNext, onLeave }) {
  const isHost = session?.players?.find((p) => p.name === myName)?.isHost ?? false

  const sorted = [...(session?.players ?? [])].sort((a, b) => (b.entryPoints ?? 0) - (a.entryPoints ?? 0))

  return (
    <div className="mx-auto w-full space-y-4" style={{ maxWidth: 'var(--max-w-lobby)' }}>
      <div className="bg-white border-2 border-emerald-300 rounded-[16px] p-5 text-center space-y-1">
        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-emerald-600">Correct answer</p>
        <p className="text-2xl font-black text-slate-900">{session?.correctAnswer ?? '—'}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">Results</span>
        </div>
        <div className="divide-y divide-slate-100">
          {sorted.map((player, rank) => (
            <div key={player.name} className="px-5 py-3 flex items-center gap-3">
              <span className="text-lg w-6 text-center flex-shrink-0">
                {RANK_ICONS[rank] ?? rank + 1}
              </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
              >
                {player.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800">{player.name}</div>
                <div className={`text-xs font-semibold ${player.correct ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {player.correct ? `✓ ${player.answer}` : '✗ didn\'t get it'}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-black text-slate-900">+{player.entryPoints ?? 0}</div>
                <div className="text-xs text-slate-400">{player.score} total</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        {isHost ? (
          <button
            onClick={onNext}
            className="flex-1 bg-slate-900 hover:bg-slate-700 text-white font-bold py-3 rounded-[12px] transition-colors"
          >
            Next Entry →
          </button>
        ) : (
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-[12px] py-3 text-center text-sm font-semibold text-slate-400">
            Waiting for host…
          </div>
        )}
        <button
          onClick={onLeave}
          className="px-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 font-semibold py-3 rounded-[12px] transition-colors text-sm"
        >
          Leave
        </button>
      </div>
    </div>
  )
}
