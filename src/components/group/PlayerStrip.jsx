export default function PlayerStrip({ players = [], myName }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {players.map((player) => {
        const isMe = player.name === myName
        const chipColor = isMe
          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
          : player.submitted
            ? 'bg-blue-50 border-blue-300 text-blue-700'
            : 'bg-slate-50 border-slate-200 text-slate-500'
        const dotColor = isMe
          ? 'bg-emerald-500'
          : player.submitted
            ? 'bg-blue-500'
            : 'bg-amber-400 animate-pulse'

        return (
          <div
            key={player.name}
            className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-full text-xs font-bold ${chipColor}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
            {player.name}
            {player.isHost && <span className="text-[10px] opacity-60 ml-0.5">(host)</span>}
          </div>
        )
      })}
    </div>
  )
}
