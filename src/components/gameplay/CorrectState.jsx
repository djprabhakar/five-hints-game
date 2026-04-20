export default function CorrectState({ answer, hintIndex, points, streak, onNext }) {
  return (
    <div className="bg-white border border-emerald-200 rounded-[12px] p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
        <svg aria-hidden="true" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-emerald-600 mb-0.5">
          Correct on hint {hintIndex + 1}!
        </div>
        <div className="text-lg sm:text-xl font-black text-slate-900 break-words">{answer}</div>
        <div className="text-xs font-semibold text-slate-500 mt-1">
          +{points} points · Streak ×{streak}
        </div>
      </div>
      {onNext && (
        <button
          onClick={onNext}
          className="bg-slate-900 hover:bg-slate-700 text-white font-bold text-sm px-5 py-2.5 rounded-[10px] transition-colors flex-shrink-0"
        >
          Next <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  )
}
