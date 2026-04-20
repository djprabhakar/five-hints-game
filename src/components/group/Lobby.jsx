export default function Lobby({ session, nickname, onStart, onLeave }) {
  const isHost = session?.players?.find((p) => p.name === nickname)?.isHost ?? false
  const playerCount = session?.players?.length ?? 0
  const canStart = isHost && playerCount >= 2

  const copyCode = () => navigator.clipboard.writeText(session.code)

  return (
    <div className="mx-auto w-full space-y-4" style={{ maxWidth: 'var(--max-w-lobby)' }}>
      <div className="bg-white border border-slate-200 rounded-[16px] p-6 text-center space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Session code</p>
        <div className="text-3xl sm:text-[2.2rem] font-black tracking-[0.2em] sm:tracking-[0.3em] text-slate-900">{session.code}</div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={copyCode}
            className="text-xs font-bold text-slate-500 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors"
          >
            Copy code
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">
            Players ({playerCount}/8)
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {session.players?.map((player) => (
            <div key={player.name} className="px-5 py-3 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
              >
                {player.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="font-semibold text-slate-800 flex-1 min-w-0 truncate">{player.name}</span>
              {player.isHost && (
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white bg-slate-900 px-2 py-0.5 rounded-full">
                  Host
                </span>
              )}
              <span className="text-[10px] font-semibold text-emerald-600">Joined</span>
            </div>
          ))}
          {playerCount < 8 && (
            <div className="px-5 py-3 flex items-center gap-3 border-dashed border-slate-200">
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-200 flex-shrink-0" />
              <span className="text-sm text-slate-300 font-medium">Waiting for players…</span>
            </div>
          )}
        </div>
      </div>

      {isHost && (
        <button
          onClick={onStart}
          disabled={!canStart}
          className="w-full bg-slate-900 hover:bg-slate-700 disabled:opacity-40 text-white font-bold py-3 rounded-[12px] transition-colors"
        >
          {canStart ? `Start Game ▶ (${playerCount} players)` : 'Waiting for at least 2 players…'}
        </button>
      )}

      <button
        onClick={onLeave}
        className="w-full text-sm font-semibold text-slate-400 hover:text-slate-600 py-2 transition-colors"
      >
        Leave session
      </button>
    </div>
  )
}
