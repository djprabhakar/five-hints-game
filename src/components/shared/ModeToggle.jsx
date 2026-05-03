export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/85 p-1 shadow-[0_10px_25px_rgba(15,23,42,0.08)] backdrop-blur-sm">
      {['solo', 'group'].map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.1em] uppercase leading-none transition-all duration-200 ${
            mode === m
              ? 'bg-[linear-gradient(135deg,#0f172a,#1e293b)] text-white shadow-[0_8px_18px_rgba(15,23,42,0.24)]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  )
}
