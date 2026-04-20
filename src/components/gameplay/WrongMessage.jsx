export default function WrongMessage({ guess, onDismiss }) {
  if (!guess) return null
  return (
    <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3 flex items-start gap-3">
      <span className="text-sm font-semibold text-red-600 flex-1 min-w-0 break-words">
        ✗ &ldquo;{guess}&rdquo; is not the answer. Try again.
      </span>
      <button
        onClick={onDismiss}
        className="text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
