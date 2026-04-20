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
      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto flex-shrink-0">
        {/* Play / Create toggle */}
        <div className="flex bg-slate-100 rounded-lg p-0.5 sm:p-1 gap-0.5">
          {['play', 'create'].map((m) => (
            <button
              key={m}
              onClick={() => onAppModeChange(m)}
              className={`px-2 sm:px-3 py-1 rounded-md text-xs font-bold transition-all capitalize ${
                appMode === m ? 'bg-white text-slate-900 shadow-sm' : 'bg-transparent text-slate-400'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
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
