export default function BottomNav({ appMode, onAppModeChange, playMode, onPlayModeChange }) {
  const tabs = [
    {
      id: 'solo',
      label: 'Solo',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ),
      active: appMode === 'play' && playMode === 'solo',
      onClick: () => { onAppModeChange('play'); onPlayModeChange('solo') },
    },
    {
      id: 'group',
      label: 'Group',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <circle cx="9" cy="8" r="3.5" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
          <path d="M17.5 14c2.5 0 4.5 1.6 4.5 4" />
        </svg>
      ),
      active: appMode === 'play' && playMode === 'group',
      onClick: () => { onAppModeChange('play'); onPlayModeChange('group') },
    },
    {
      id: 'create',
      label: 'Create',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
      active: appMode === 'create',
      onClick: () => onAppModeChange('create'),
    },
  ]

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={tab.onClick}
          className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
            tab.active
              ? 'text-emerald-600'
              : 'text-slate-500'
          }`}
        >
          {tab.icon}
          <span className={`text-[10px] font-bold ${tab.active ? 'text-emerald-600' : 'text-slate-500'}`}>
            {tab.label}
          </span>
          {tab.active && (
            <span className="absolute bottom-0 h-0.5 w-8 bg-emerald-500 rounded-full" />
          )}
        </button>
      ))}
    </nav>
  )
}
