import { useEffect } from 'react'

export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-[20px] max-h-[80vh] flex flex-col shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {title && (
          <div className="px-5 pb-3 border-b border-slate-100 flex-shrink-0">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{title}</p>
          </div>
        )}

        <div className="overflow-y-auto flex-1 pb-safe">
          {children}
        </div>
      </div>
    </div>
  )
}
