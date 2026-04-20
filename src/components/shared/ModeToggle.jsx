export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="flex bg-slate-100 rounded-lg p-1 gap-0.5">
      {['solo', 'group'].map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-3 py-1 rounded-md text-xs font-bold transition-all capitalize ${
            mode === m
              ? 'bg-white text-slate-900 shadow-sm'
              : 'bg-transparent text-slate-400'
          }`}
        >
          {m.charAt(0).toUpperCase() + m.slice(1)}
        </button>
      ))}
    </div>
  )
}
