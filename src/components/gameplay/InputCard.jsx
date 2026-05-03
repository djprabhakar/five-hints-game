import { useRef, useEffect } from 'react'

export default function InputCard({
  value, onChange, onSubmit, onReveal,
  attempts, maxAttempts,
  canReveal = false, disabled = false,
  suggestions = [], onSuggestionSelect,
}) {
  const listRef = useRef(null)

  function selectSuggestion(event, word) {
    event.preventDefault()
    onSuggestionSelect(word)
  }

  const dots = Array.from({ length: maxAttempts }, (_, i) => {
    if (i < attempts) return 'used'
    if (i === attempts) return 'current'
    return 'empty'
  })

  const dotClass = {
    used: 'w-2.5 h-2.5 rounded-full bg-red-400',
    current: 'w-2.5 h-2.5 rounded-full bg-amber-400 motion-safe:animate-pulse',
    empty: 'w-2.5 h-2.5 rounded-full bg-slate-200',
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (listRef.current && !listRef.current.contains(e.target)) {
        // parent clears via onChange('') or user keeps typing — no-op needed here
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const showSuggestions = suggestions.length > 0 && !disabled

  return (
    <div
      className="bg-white border border-slate-200 rounded-[12px] p-3 sm:p-4 space-y-3 fixed left-3 right-3 max-w-full lg:max-w-none lg:static lg:bottom-auto lg:left-auto lg:right-auto"
      style={{
        bottom: 'calc(3.5rem + env(safe-area-inset-bottom))',
        boxShadow: 'var(--shadow-active-input)',
        zIndex: 50,
      }}
    >
      <form onSubmit={handleSubmit} className="flex gap-2 relative max-w-full">
        <div className="flex-1 relative" ref={listRef}>
          <label htmlFor="guess-input" className="sr-only">Your answer</label>
          <input
            id="guess-input"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer…"
            disabled={disabled}
            autoComplete="off"
            className="w-full border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300/40 transition-all"
          />

          {showSuggestions && (
            <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-[10px] shadow-lg overflow-hidden z-10 max-h-48 overflow-y-auto">
              {suggestions.map((word) => (
                <li key={word}>
                  <button
                    type="button"
                    onPointerDown={(e) => selectSuggestion(e, word)}
                    onClick={(e) => selectSuggestion(e, word)}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    {word}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm px-3 sm:px-5 py-2.5 rounded-[10px] transition-colors whitespace-nowrap self-start flex-shrink-0"
        >
          Guess <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-shrink-0">
          {dots.map((type, i) => (
            <span key={i} className={dotClass[type]} />
          ))}
          <span className="text-xs font-semibold text-slate-500 ml-1 whitespace-nowrap">
            {attempts + 1}/{maxAttempts}
          </span>
        </div>

        {canReveal && (
          <button
            type="button"
            onClick={onReveal}
            className="min-h-[44px] flex items-center justify-end text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors text-right min-w-0 px-1"
          >
            <span aria-hidden="true" className="mr-1">▸</span>Reveal hint (−1 pt)
          </button>
        )}
      </div>
    </div>
  )
}
