import Breadcrumb from './Breadcrumb'
import ModeToggle from '../shared/ModeToggle'
import Avatar from '../shared/Avatar'

export default function AppHeader({ crumbs = [], mode, onModeChange, nickname, appMode, onAppModeChange }) {
  return (
    <header className="bg-white border-b border-slate-200 h-14 flex items-center px-4 sm:px-5 gap-2 sm:gap-3">
      {/* Logo */}
      <div className="text-base font-black text-slate-900 tracking-tight flex-shrink-0">
        five<span className="text-emerald-500">.</span>hints
      </div>

      <span className="text-slate-200 hidden sm:block">|</span>

      {/* Breadcrumb — desktop only */}
      <div className="hidden sm:flex flex-1 overflow-hidden min-w-0">
        <Breadcrumb crumbs={crumbs} />
      </div>

      {/* Mobile: active game chip fills centre */}
      {crumbs.length > 0 ? (
        <div className="flex sm:hidden flex-1 overflow-hidden min-w-0">
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full truncate max-w-full">
            {crumbs[crumbs.length - 1]?.label}
          </span>
        </div>
      ) : (
        <div className="flex-1 sm:hidden" />
      )}

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-shrink-0">
        {/* Play / Create toggle */}
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 p-1 shadow-[0_10px_25px_rgba(15,23,42,0.08)] backdrop-blur-sm">
          {['play', 'create'].map((m) => (
            <button
              key={m}
              onClick={() => onAppModeChange(m)}
              className={`rounded-full px-3 sm:px-4 py-1.5 text-xs font-bold uppercase tracking-[0.1em] leading-none transition-all duration-200 ${
                appMode === m
                  ? m === 'play'
                    ? 'bg-[linear-gradient(135deg,#10b981,#0d9488)] text-white shadow-[0_8px_18px_rgba(16,185,129,0.28)]'
                    : 'bg-[linear-gradient(135deg,#0f172a,#334155)] text-white shadow-[0_8px_18px_rgba(15,23,42,0.22)]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Solo / Group toggle — hidden on mobile to save space; accessible via breadcrumb area */}
        {appMode === 'play' && (
          <div className="hidden sm:block">
            <ModeToggle mode={mode} onChange={onModeChange} />
          </div>
        )}

        <Avatar nickname={nickname} />
      </div>
    </header>
  )
}
