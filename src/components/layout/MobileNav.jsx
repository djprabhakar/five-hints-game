import { useEffect, useState } from 'react'
import BottomSheet from './BottomSheet'

export default function MobileNav({
  activeGameName,
  nickname,
  categories, systemGames, selectedCategory,
  loadingGames,
  onCategorySelect, onGameSelect,
  onGameShare,
  onNicknameChange,
}) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editingNickname, setEditingNickname] = useState(false)
  const [nickDraft, setNickDraft] = useState(nickname)
  const [copiedGameId, setCopiedGameId] = useState(null)

  useEffect(() => {
    if (!pickerOpen || loadingGames || systemGames.length > 0) return
    const categoryToLoad = selectedCategory || categories[0]?.name
    if (categoryToLoad) onCategorySelect(categoryToLoad)
  }, [categories, loadingGames, onCategorySelect, pickerOpen, selectedCategory, systemGames.length])

  function saveNickname() {
    const trimmed = nickDraft.trim()
    if (trimmed && trimmed !== nickname) onNicknameChange?.(trimmed)
    setEditingNickname(false)
  }

  async function shareGame(event, game) {
    event.stopPropagation()
    await onGameShare?.(game)
    setCopiedGameId(game.id)
    window.setTimeout(() => setCopiedGameId(null), 1800)
  }

  return (
    <>
      {/* ── Compact mobile header — fixed so it stays at the top while scrolling ── */}
      <header className="fixed inset-x-0 top-0 z-[70] bg-white border-b border-slate-200 h-[52px] flex items-center px-3 gap-2 lg:hidden w-full overflow-hidden">
        {/* Logo */}
        <span className="text-sm font-black text-slate-900 tracking-tight flex-shrink-0">
          five<span className="text-emerald-500">.</span>hints
        </span>

        {/* Game selector chip — tappable, opens picker sheet */}
        <button
          onClick={() => setPickerOpen(true)}
          type="button"
          aria-label={activeGameName ? `Now playing: ${activeGameName}. Tap to change.` : 'Pick a game'}
          className="flex-1 min-w-0 flex items-center justify-center gap-1.5 mx-1 overflow-hidden"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full truncate">
            Pick a game
            <svg aria-hidden="true" className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </span>
        </button>

        {/* Profile / avatar button */}
        <button
          onClick={() => setProfileOpen(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
          aria-label="Profile"
        >
          {nickname.slice(0, 2).toUpperCase()}
        </button>
      </header>

      {/* ── Game picker sheet ── */}
      <BottomSheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Pick a game">
        <div className="p-4 space-y-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => onCategorySelect(cat.name)}
                  type="button"
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    selectedCategory === cat.name
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {systemGames.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 mb-2">Game</p>
              <div className="divide-y divide-slate-100 rounded-[12px] border border-slate-200 overflow-hidden">
                {systemGames.map((game) => {
                  const wasCopied = copiedGameId === game.id
                  return (
                    <div key={game.id} className="flex items-stretch bg-white">
                      <button
                        onClick={() => { onGameSelect(game); setPickerOpen(false) }}
                        type="button"
                        className="flex-1 min-w-0 text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="block truncate">{game.name}</span>
                          {game.isToday && (
                            <span className="flex-shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-700">
                              Today
                            </span>
                          )}
                        </span>
                        {game.createdBy !== 'System' && (
                          <span className="block text-xs text-slate-400 font-normal truncate">by {game.createdBy}</span>
                        )}
                      </button>
                      <button
                        onClick={(event) => shareGame(event, game)}
                        type="button"
                        aria-label={wasCopied ? `Share link copied for ${game.name}` : `Share ${game.name}`}
                        className={`w-12 min-h-[48px] flex flex-shrink-0 items-center justify-center border-l border-slate-100 transition-colors ${
                          wasCopied
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100'
                        }`}
                      >
                        {wasCopied ? (
                          <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : (
                          <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {loadingGames && (
            <p className="text-xs text-slate-400 text-center py-4">Loading…</p>
          )}

          {!loadingGames && categories.length > 0 && systemGames.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">Choose a category to load games.</p>
          )}
        </div>
      </BottomSheet>

      {/* ── Profile sheet ── */}
      <BottomSheet open={profileOpen} onClose={() => { setProfileOpen(false); setEditingNickname(false) }} title="Profile">
        <div className="p-4 space-y-4">
          {/* Avatar + name */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
            >
              {nickname.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Playing as</p>
              <p className="text-base font-bold text-slate-900 truncate">{nickname}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            {editingNickname ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={nickDraft}
                  onChange={(e) => setNickDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveNickname() }}
                  className="flex-1 border border-slate-200 rounded-[8px] px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  placeholder="New nickname"
                />
                <button
                  onClick={saveNickname}
                  className="bg-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-[8px]"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditingNickname(false); setNickDraft(nickname) }}
                  className="text-slate-400 text-sm font-bold px-3 py-2"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setNickDraft(nickname); setEditingNickname(true) }}
                className="w-full text-left px-4 py-3 rounded-[10px] bg-slate-50 hover:bg-slate-100 text-sm font-semibold text-slate-700 transition-colors flex items-center justify-between"
              >
                <span>Change nickname</span>
                <span className="text-slate-400">›</span>
              </button>
            )}
          </div>
        </div>
      </BottomSheet>
    </>
  )
}
