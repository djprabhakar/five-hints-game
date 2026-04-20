import { useMemo } from 'react'
import { readLifetimeStats } from '../../hooks/useGameSession'

function greeting(name) {
  const h = new Date().getHours()
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  return `Good ${time}, ${name}!`
}

function StatTile({ label, value, sub, color }) {
  const colorMap = {
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber:   'bg-amber-50   border-amber-100   text-amber-700',
    violet:  'bg-violet-50  border-violet-100  text-violet-700',
    sky:     'bg-sky-50     border-sky-100     text-sky-700',
  }
  const numColor = {
    emerald: 'text-emerald-600',
    amber:   'text-amber-600',
    violet:  'text-violet-600',
    sky:     'text-sky-600',
  }
  return (
    <div className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl border px-3 py-4 ${colorMap[color]}`}>
      <span className={`text-3xl font-black tabular-nums leading-none ${numColor[color]}`}>{value}</span>
      {sub && <span className={`text-[11px] font-bold ${numColor[color]} opacity-70`}>{sub}</span>}
      <span className="text-[11px] font-semibold text-slate-500 mt-0.5 text-center leading-tight">{label}</span>
    </div>
  )
}

const HOW_TO_PLAY = [
  {
    step: '1',
    color: 'bg-emerald-500',
    title: 'Read the first hint',
    desc: 'Each word has 5 progressively easier hints. Start with just hint 1.',
  },
  {
    step: '2',
    color: 'bg-amber-500',
    title: 'Make your guess',
    desc: 'Type your answer — correct on hint 1 earns 5 pts, hint 5 earns 1 pt.',
  },
  {
    step: '3',
    color: 'bg-violet-500',
    title: 'Reveal more if needed',
    desc: 'Tap "Reveal hint" to unlock the next clue if you\'re stuck.',
  },
]

export default function WelcomeDashboard({ nickname, categories = [], onCategorySelect }) {
  const stats = useMemo(() => readLifetimeStats(), [])

  const winRate = stats.wordsAttempted > 0
    ? Math.round((stats.wordsSolved / stats.wordsAttempted) * 100)
    : null

  const hasPlayed = stats.wordsAttempted > 0

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 py-2">

      {/* ── Greeting ── */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">{greeting(nickname)}</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {hasPlayed
            ? 'Welcome back — pick up where you left off or try a new category.'
            : 'Pick a category from the sidebar to start your first game.'}
        </p>
      </div>

      {/* ── Lifetime stats ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">Your stats</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Words Solved"  value={stats.wordsSolved}    color="emerald" />
          <StatTile label="Total Points"  value={stats.totalPoints}    color="amber" />
          <StatTile label="Best Streak"   value={stats.bestStreak}     color="violet" />
          <StatTile
            label="Win Rate"
            value={winRate !== null ? `${winRate}%` : '—'}
            sub={winRate !== null ? `${stats.wordsAttempted} played` : undefined}
            color="sky"
          />
        </div>
      </div>

      {/* ── How to play ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">How to play</p>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {HOW_TO_PLAY.map(({ step, color, title, desc }) => (
            <div key={step} className="flex items-start gap-3.5 px-4 py-3.5">
              <span className={`${color} text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                {step}
              </span>
              <div>
                <p className="text-sm font-bold text-slate-800">{title}</p>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  )
}
