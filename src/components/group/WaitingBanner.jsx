export default function WaitingBanner({ players = [], myName }) {
  const submitted = players.filter((p) => p.submitted && p.name !== myName)
  const waiting = players.filter((p) => !p.submitted && p.name !== myName)

  if (!players.length || waiting.length === 0) return null

  const submittedNames = submitted.map((p) => p.name).join(', ')
  const waitingNames = waiting.map((p) => p.name).join(', ')

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-[10px] px-4 py-3 flex items-center gap-3">
      <span className="text-lg">⏳</span>
      <div className="flex-1 min-w-0">
        {submittedNames && (
          <span className="text-xs font-semibold text-amber-700">{submittedNames} submitted · </span>
        )}
        <span className="text-xs font-semibold text-amber-700">waiting for {waitingNames}…</span>
      </div>
      <span className="text-[10px] font-bold text-amber-500 whitespace-nowrap">Results reveal when everyone submits</span>
    </div>
  )
}
