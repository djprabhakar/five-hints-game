const RANK_ICONS = ['🥇', '🥈', '🥉']

export default function GameSummary({ summary, myName, onLeave }) {
  const players = Array.isArray(summary?.players) ? summary.players : []
  const winnerNames = new Set((summary?.winners ?? []).map((winner) => winner.name))

  return (
    <div className="mx-auto w-full space-y-4" style={{ maxWidth: 'var(--max-w-lobby)' }}>
      <div className="bg-white border-2 border-emerald-300 rounded-[16px] p-5 text-center space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-emerald-600">Game Complete</p>
        <p className="text-2xl font-black text-slate-900">{summary?.game ?? 'Group Game'}</p>
        <p className="text-sm font-semibold text-slate-500">{summary?.code ? `Code ${summary.code}` : ''}</p>
        {!!summary?.winners?.length && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {summary.winners.map((winner) => (
              <span
                key={winner.name}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-sm font-black text-emerald-700"
              >
                <span aria-hidden="true">🏆</span>
                {winner.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">Final Standings</span>
          {summary?.resultFileName && (
            <span className="text-[11px] font-semibold text-slate-400 truncate">{summary.resultFileName}</span>
          )}
        </div>
        <div className="divide-y divide-slate-100">
          {players.map((player, index) => {
            const isWinner = winnerNames.has(player.name)
            const isMe = player.name === myName

            return (
              <div
                key={player.name}
                className={`px-5 py-4 flex items-center gap-3 ${isWinner ? 'bg-emerald-50/70' : 'bg-white'}`}
              >
                <span className={`w-8 text-center flex-shrink-0 ${isWinner ? 'text-2xl' : 'text-lg'}`}>
                  {RANK_ICONS[index] ?? player.rank ?? index + 1}
                </span>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                  style={{ background: isWinner ? 'linear-gradient(135deg, #10b981, #0d9488)' : 'linear-gradient(135deg, #0f172a, #334155)' }}
                >
                  {player.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`truncate ${isWinner ? 'text-xl font-black text-slate-900' : 'text-base font-bold text-slate-800'}`}>
                    {player.name}
                    {isMe ? ' (you)' : ''}
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    {player.isHost ? 'Host' : 'Player'}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {isWinner && (
                    <div className="inline-flex items-center rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-700 mb-1">
                      Winner
                    </div>
                  )}
                  <div className={`${isWinner ? 'text-3xl' : 'text-2xl'} font-black text-slate-900`}>{player.score ?? 0}</div>
                  <div className="text-xs text-slate-400">points</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={onLeave}
        className="w-full bg-slate-900 hover:bg-slate-700 text-white font-bold py-3 rounded-[12px] transition-colors"
      >
        Leave Game
      </button>
    </div>
  )
}
