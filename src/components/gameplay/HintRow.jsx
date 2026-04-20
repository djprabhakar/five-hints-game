const STATE_STYLES = {
  locked:   'bg-[var(--color-hint-locked-bg)] border-[var(--color-hint-locked-border)] opacity-40',
  revealed: 'bg-white border-slate-200',
  active:   'bg-[var(--color-hint-active-bg)] border-[var(--color-hint-active-border)] border-l-4 border-l-emerald-400 shadow-[var(--shadow-active-input)]',
  wrong:    'bg-[var(--color-hint-wrong-bg)] border-[var(--color-hint-wrong-border)]',
  correct:  'bg-[var(--color-hint-correct-bg)] border-[var(--color-hint-correct-border)]',
}

export default function HintRow({ index, state, text, wrongGuess }) {
  const isLocked = state === 'locked'
  const label = state === 'active' ? `Hint ${index + 1} · Guess now` : `Hint ${index + 1}`

  // Locked rows are much shorter on mobile — just a slim placeholder
  if (isLocked) {
    return (
      <div className={`rounded-[10px] border flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-3 max-w-full overflow-hidden ${STATE_STYLES.locked}`}>
        <span className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-slate-100 text-slate-400 text-[10px] font-black flex items-center justify-center flex-shrink-0">
          {index + 1}
        </span>
        <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-tight text-slate-400 truncate">
          Hint {index + 1}
        </span>
      </div>
    )
  }

  return (
    <div className={`rounded-[10px] border px-3 lg:px-4 py-2.5 lg:py-3 flex items-start gap-2 lg:gap-3 max-w-full overflow-hidden ${STATE_STYLES[state]}`}>
      <span className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] lg:text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] lg:text-[11px] font-bold uppercase tracking-tight lg:tracking-[0.1em] text-slate-500 mb-1">
          {label}
        </div>
        {text && (
          <div className="text-sm font-medium text-slate-700 leading-snug lg:leading-[1.55] break-words whitespace-normal">{text}</div>
        )}
      </div>
      {state === 'wrong' && wrongGuess && (
        <span className="inline-flex items-center gap-0.5 text-[10px] lg:text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-1.5 lg:px-2 py-0.5 rounded-full flex-shrink-0 max-w-[6rem]">
          <svg aria-hidden="true" className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          <span className="truncate">{wrongGuess}</span>
        </span>
      )}
      {state === 'correct' && (
        <span className="inline-flex items-center justify-center text-emerald-600 bg-emerald-50 border border-emerald-200 p-0.5 lg:p-1 rounded-full flex-shrink-0">
          <svg aria-hidden="true" className="w-3 h-3 lg:w-3.5 lg:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
      )}
    </div>
  )
}
