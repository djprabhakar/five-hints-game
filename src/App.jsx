import { useEffect, useMemo, useState, useCallback } from 'react'
import AppHeader from './components/layout/AppHeader'
import MobileNav from './components/layout/MobileNav'
import BottomNav from './components/layout/BottomNav'
import LandingPage from './components/layout/LandingPage'
import AppBackground from './components/layout/AppBackground'
import PlayScreen from './components/gameplay/PlayScreen'
import GroupSetup from './components/group/GroupSetup'
import Lobby from './components/group/Lobby'
import EntryResults from './components/group/EntryResults'
import GameSummary from './components/group/GameSummary'
import CreateForm from './components/create/CreateForm'
import JobStatus from './components/create/JobStatus'
import ReviewEntries from './components/create/ReviewEntries'
import MyGamesList from './components/create/MyGamesList'
import { useGameSession } from './hooks/useGameSession'
import { useGroupSession } from './hooks/useGroupSession'

// ─── Constants ────────────────────────────────────────────────────────────────

const NICKNAME_KEY = 'five-hints.nickname'
const CREATED_GAMES_KEY = 'five-hints.created-games'
const API_BASE_URL = 'https://enasollu.enasollu.xyz'
const SYSTEM_CATEGORIES_URL = `${API_BASE_URL}/api/words/Get5HintWordCategories`
const SYSTEM_GAMES_URL = `${API_BASE_URL}/api/words/Get20RandomWordsWith5Clues`
const SYSTEM_ALL_GAMES_URL = `${API_BASE_URL}/api/words/GetAll5HintGames`
const SYSTEM_WORD_SUGGESTIONS_URL = `${API_BASE_URL}/api/words/Get5HintWordBeginningWith`
const CREATE_GAME_URL = `${API_BASE_URL}/api/words/Create5HintGame`
const CREATE_GAME_JOBS_URL = `${API_BASE_URL}/api/words/Create5HintGameJobs`
const USER_GAMES_URL = `${API_BASE_URL}/api/words/GetAll5HintGamesByUser`
const STAGING_GAME_URL = `${API_BASE_URL}/api/words/GetStaging5HintGame`
const APPROVE_GAME_ENTRY_URL = `${API_BASE_URL}/api/words/Approve5HintGameEntry`
const DAILY_PUZZLES_URL = `${API_BASE_URL}/api/words/GetDailyPuzzles`
const DAILY_CATEGORY_NAME = 'Daily Puzzle'

// ─── Normalize helpers (unchanged from original) ──────────────────────────────

const normalizeAudioConfig = (audio) => {
  if (!audio || typeof audio !== 'object') return null
  const type = `${audio.type ?? ''}`.trim().toLowerCase()
  const videoId = `${audio.videoId ?? ''}`.trim()
  const start = Number(audio.start)
  const duration = Number(audio.duration)
  if (type !== 'youtube' || !videoId) return null
  return {
    type, videoId,
    start: Number.isFinite(start) && start >= 0 ? start : 0,
    duration: Number.isFinite(duration) && duration > 0 ? duration : 0,
  }
}

const normalizeGameRecord = (record, fallbackSource) => {
  if (!record || typeof record !== 'object') return null
  const rawHints = Array.isArray(record.hints) ? record.hints : Array.isArray(record.clues) ? record.clues : []
  const hints = rawHints.map((h) => `${h ?? ''}`.trim()).filter(Boolean).slice(0, 5)
  const word = `${record.answer ?? record.word ?? record.song ?? ''}`.trim()
  const audio = normalizeAudioConfig(record.audio ?? record.media)
  if (!word || hints.length !== 5) return null
  return {
    id: `${record.id ?? `${fallbackSource}-${word.toLowerCase()}`}`,
    title: `${record.title ?? record.titleHint ?? ''}`.trim(),
    word, hints,
    category: `${record.category ?? ''}`.trim(),
    band: `${record.band ?? record.meta?.artist ?? ''}`.trim(),
    audio,
    createdBy: `${record.createdBy ?? 'System'}`.trim() || 'System',
    createdAt: `${record.createdAt ?? ''}`,
    source: `${record.source ?? fallbackSource}`,
  }
}

const normalizeSystemGameSummary = (record, fallbackCategory) => {
  if (!record || typeof record !== 'object') return null
  const name = `${record.game_name ?? record.gameName ?? record.name ?? record.title ?? record.game ?? ''}`.trim()
  if (!name) return null
  const category = `${record.category ?? fallbackCategory ?? ''}`.trim()
  const createdBy = `${record.created_by ?? record.createdBy ?? record.nick_name ?? record.nickname ?? record.owner ?? 'System'}`.trim()
  const id = `${record.id ?? `${category || 'system'}-${name}`}`.trim()
  const rawEntries = record.entry_count ?? record.entries ?? record.words_count ?? record.noOfWords ?? record.no_of_words ?? record.count ?? null
  const entries = rawEntries !== null && Number.isFinite(Number(rawEntries)) && Number(rawEntries) > 0 ? Number(rawEntries) : null
  return { id, name, category, createdBy: createdBy || 'System', entries }
}

const normalizeUserGameSummary = (record) => {
  const summary = normalizeSystemGameSummary(record)
  if (!summary) return null
  const status = `${record.status ?? record.game_status ?? record.state ?? ''}`.trim().toLowerCase()
  return {
    ...summary,
    status: status || 'published',
    userName: `${record.user_name ?? record.userName ?? record.created_by ?? record.createdBy ?? summary.createdBy}`.trim(),
  }
}

const normalizeCategoryRecord = (record) => {
  if (!record || typeof record !== 'object') return null
  const name = `${record.category ?? record.name ?? ''}`.trim()
  if (!name) return null
  const games = Number(record.games)
  const createdBy = record.created_by && typeof record.created_by === 'object' ? record.created_by : {}
  return { name, games: Number.isFinite(games) && games >= 0 ? games : null, createdBy }
}

const normalizeDailyPuzzleRecord = (record) => {
  if (!record || typeof record !== 'object') return null
  const date = `${record.date ?? ''}`.trim()
  const gameName = `${record.gameName ?? record.name ?? `Daily Puzzle - ${date}`}`.trim()
  const answer = `${record.answer ?? record.word ?? ''}`.trim()
  const rawHints = Array.isArray(record.hints) ? record.hints : Array.isArray(record.clues) ? record.clues : []
  const hints = rawHints.map((hint) => `${hint ?? ''}`.trim()).filter(Boolean).slice(0, 5)
  if (!date || !gameName || !answer || hints.length !== 5) return null
  return {
    id: `${DAILY_CATEGORY_NAME}-${date}`,
    date,
    gameName,
    title: `${record.title ?? ''}`.trim(),
    answer,
    hints,
    category: DAILY_CATEGORY_NAME,
    createdBy: `${record.createdBy ?? 'System'}`.trim() || 'System',
  }
}

const toDailyGameSummary = (puzzle) => ({
  id: puzzle.id,
  name: puzzle.gameName,
  category: DAILY_CATEGORY_NAME,
  createdBy: puzzle.createdBy,
  entries: 1,
  date: puzzle.date,
  isDaily: true,
  isToday: puzzle.date === new Date().toISOString().slice(0, 10),
})

const toDailyGameEntry = (puzzle) => ({
  id: puzzle.id,
  title: puzzle.title,
  word: puzzle.answer,
  hints: puzzle.hints,
  category: DAILY_CATEGORY_NAME,
  createdBy: puzzle.createdBy,
  createdAt: `${puzzle.date}T00:00:00.000Z`,
  source: 'daily-archive',
})

const mergeCategories = (remoteCategories, dailyGames) => {
  const filtered = remoteCategories.filter((category) => category.name !== DAILY_CATEGORY_NAME)
  if (!dailyGames.length) return filtered
  return [
    { name: DAILY_CATEGORY_NAME, games: dailyGames.length },
    ...filtered,
  ]
}

const parseStoredGames = () => {
  try {
    const raw = localStorage.getItem(CREATED_GAMES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

const parsePlayShortcutPath = () => {
  const hashPath = window.location.hash.startsWith('#/') ? window.location.hash.slice(1) : ''
  const shortcutPath = hashPath || window.location.pathname
  const pathParts = shortcutPath.split('/').filter(Boolean)
  if (pathParts[0]?.toLowerCase() !== 'play' || pathParts.length < 3) return null
  try {
    const category = decodeURIComponent(pathParts[1]).trim()
    const game = decodeURIComponent(pathParts.slice(2).join('/')).trim()
    return category && game ? { category, game } : null
  } catch { return null }
}

const buildGameShortcutUrl = (category, game) => {
  const origin = window.location.origin
  const encodedCategory = encodeURIComponent(`${category ?? ''}`.trim() || 'Game')
  const encodedGame = encodeURIComponent(`${game ?? ''}`.trim() || 'Game')
  return `${origin}/#/play/${encodedCategory}/${encodedGame}`
}


// ─── Game detail card ─────────────────────────────────────────────────────────

function GameDetailCard({ game, poolSize }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = buildGameShortcutUrl(game.category, game.name)
    try {
      if (navigator.share) {
        await navigator.share({ title: game.name, text: `Play "${game.name}" on Five Hints!`, url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
      }
    } catch { /* AbortError on share cancel — ignore */ }
  }

  // Prefer pool size (loaded words) over the API-supplied entries field
  const entryCount = poolSize > 0 ? poolSize : game.entries

  return (
    <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden shadow-sm">
      {/* Accent header */}
      <div className="px-4 pt-3.5 pb-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 mb-1">Game Details</p>
        <h3 className="text-sm font-black text-slate-900 leading-snug">{game.name}</h3>
      </div>

      {/* Metadata rows */}
      <div className="px-4 py-3 space-y-2.5">
        {/* Category */}
        {game.category && (
          <div className="flex items-center gap-2.5">
            <svg aria-hidden="true" className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span className="text-xs text-slate-500">
              Category: <span className="font-semibold text-slate-700">{game.category}</span>
            </span>
          </div>
        )}

        {/* Created by */}
        <div className="flex items-center gap-2.5">
          <svg aria-hidden="true" className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          <span className="text-xs text-slate-500">
            Created by: <span className="font-semibold text-slate-700">{game.createdBy}</span>
          </span>
        </div>

        {/* Entry count */}
        {entryCount != null && (
          <div className="flex items-center gap-2.5">
            <svg aria-hidden="true" className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/>
              <circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>
            </svg>
            <span className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700 tabular-nums">{entryCount}</span>
              {' '}{entryCount === 1 ? 'word' : 'words'} to guess
            </span>
          </div>
        )}
      </div>

      {/* Share action */}
      <div className="px-4 pb-4">
        <button
          onClick={handleShare}
          aria-label={copied ? 'Share link copied to clipboard' : 'Copy share link for this game'}
          className={`w-full min-h-[44px] flex items-center justify-center gap-2 rounded-[10px] py-2.5 text-sm font-bold transition-all duration-200 cursor-pointer ${
            copied
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700'
          }`}
        >
          {copied ? (
            <>
              <svg aria-hidden="true" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Link copied!
            </>
          ) : (
            <>
              <svg aria-hidden="true" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share this game
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Game selector (sidebar on desktop, collapsible panel on mobile) ──────────

function GameSelector({ categories, systemGames, selectedCategory, selectedGame, loading, message, onCategorySelect, onGameSelect, poolSize }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [copiedGameId, setCopiedGameId] = useState(null)

  const handleGameShare = async (e, game) => {
    e.stopPropagation()
    const url = buildGameShortcutUrl(game.category, game.name)
    try {
      if (navigator.share) {
        await navigator.share({ title: game.name, text: `Play "${game.name}" on Five Hints!`, url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopiedGameId(game.id)
        setTimeout(() => setCopiedGameId(null), 2000)
      }
    } catch { /* AbortError on share cancel — ignore */ }
  }

  const pickerContent = (
    <div className="space-y-3">
      {/* Categories panel */}
      <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden">
        <div className="px-4 py-2.5 bg-emerald-800">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-white">Categories</span>
        </div>
        <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => { onCategorySelect(cat.name) }}
              className={`w-full text-left px-4 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
                selectedCategory === cat.name ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.name}
              {cat.games != null && <span className="ml-1.5 text-xs text-slate-500">({cat.games})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Games panel */}
      {systemGames.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden">
          <div className="px-4 py-2.5 bg-emerald-800">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-white">Games</span>
          </div>
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
            {systemGames.map((game) => {
              const isActive = selectedGame?.id === game.id
              const wasCopied = copiedGameId === game.id
              return (
                <div key={game.id} className={`flex items-stretch ${isActive ? 'bg-emerald-50' : ''}`}>
                  {/* Game select button */}
                  <button
                    onClick={() => { onGameSelect(game); setMobileOpen(false) }}
                    className={`flex-1 min-w-0 text-left px-4 py-2.5 text-xs font-semibold transition-colors ${
                      isActive ? 'text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {isActive && (
                        <svg aria-hidden="true" className="w-3 h-3 flex-shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                      <span className="truncate">{game.name}</span>
                      {game.isToday && (
                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-700">
                          Today
                        </span>
                      )}
                    </div>
                    {!isActive && game.createdBy !== 'System' && (
                      <span className="text-xs text-slate-400 font-normal">by {game.createdBy}</span>
                    )}
                  </button>

                  {/* Share button — mobile only */}
                  <button
                    onClick={(e) => handleGameShare(e, game)}
                    aria-label={`Share ${game.name}`}
                    className={`lg:hidden flex-shrink-0 w-11 min-h-[44px] flex items-center justify-center border-l border-slate-200 transition-colors ${
                      wasCopied
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100'
                    }`}
                  >
                    {wasCopied ? (
                      <svg aria-hidden="true" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

      {loading && <p className="text-xs text-slate-400 px-1">Loading…</p>}
      {message && !loading && <p className="text-xs text-slate-500 px-1">{message}</p>}
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 space-y-3">
        {pickerContent}
        {selectedGame && <GameDetailCard game={selectedGame} poolSize={poolSize} />}
      </aside>

      {/* Mobile: pill button + slide-down panel + detail card */}
      <div className="lg:hidden w-full space-y-2">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-[12px] px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"
        >
          <span>
            {selectedGame
              ? <><span className="text-slate-400 font-medium">Playing: </span>{selectedGame.name}</>
              : 'Pick a game'
            }
          </span>
          {mobileOpen
            ? <svg aria-hidden="true" className="w-4 h-4 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15l6-6 6 6"/></svg>
            : <svg aria-hidden="true" className="w-4 h-4 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          }
        </button>

        {mobileOpen && <div>{pickerContent}</div>}

        {/* Detail card visible on mobile when a game is selected and picker is closed */}
        {selectedGame && !mobileOpen && (
          <GameDetailCard game={selectedGame} poolSize={poolSize} />
        )}
      </div>
    </>
  )
}

function OverflowDebugPanel({ panels, hiddenPanels, onToggle }) {
  return (
    <div className="overflow-debug-panel">
      <div className="overflow-debug-title">Overflow panels: {panels.length}</div>
      <div className="overflow-debug-list">
        {panels.map((panel) => (
          <label key={panel.id} className="overflow-debug-row">
            <input
              type="checkbox"
              checked={!hiddenPanels.has(panel.id)}
              onChange={() => onToggle(panel.id)}
            />
            <span>{panel.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [nickname, setNickname] = useState(() => localStorage.getItem(NICKNAME_KEY) ?? '')
  const [appMode, setAppMode] = useState('play')   // 'play' | 'create'
  const [playMode, setPlayMode] = useState('solo')  // 'solo' | 'group'

  // Categories + game list
  const [systemCategories, setSystemCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [systemGames, setSystemGames] = useState([])
  const [selectedGame, setSelectedGame] = useState(null)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingGames, setLoadingGames] = useState(false)
  const [loadingGamePool, setLoadingGamePool] = useState(false)
  const [selectionMessage, setSelectionMessage] = useState('')

  // Create mode
  const [createJob, setCreateJob] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [reviewGame, setReviewGame] = useState(null)
  const [reviewEntries, setReviewEntries] = useState([])
  const [reviewApproved, setReviewApproved] = useState(false)
  const [approvingIds, setApprovingIds] = useState([])
  const [userApiGames, setUserApiGames] = useState([])
  const [createdGames, setCreatedGames] = useState(() => parseStoredGames())
  const [processedJobIds, setProcessedJobIds] = useState([])
  const [dailyArchive, setDailyArchive] = useState([])

  // Group session
  const [pendingGroupSession, setPendingGroupSession] = useState(null)
  const [groupPhase, setGroupPhase] = useState('setup') // 'setup' | 'lobby' | 'playing' | 'results' | 'summary'
  const [groupLobbyMessage, setGroupLobbyMessage] = useState('')
  const [hiddenOverflowPanels, setHiddenOverflowPanels] = useState(() => new Set())

  const gameSession = useGameSession()
  const groupSession = useGroupSession(pendingGroupSession, nickname)
  const overflowDebugEnabled = new URLSearchParams(window.location.search).has('debugOverflow')

  const toggleOverflowPanel = useCallback((panelId) => {
    setHiddenOverflowPanels((current) => {
      const next = new Set(current)
      if (next.has(panelId)) next.delete(panelId)
      else next.add(panelId)
      return next
    })
  }, [])

  const isOverflowPanelHidden = useCallback((panelId) => {
    return overflowDebugEnabled && hiddenOverflowPanels.has(panelId)
  }, [overflowDebugEnabled, hiddenOverflowPanels])

  // Load categories on mount
  useEffect(() => {
    const load = async () => {
      setLoadingCategories(true)
      try {
        const [categoriesRes, dailyRes] = await Promise.all([
          fetch(SYSTEM_CATEGORIES_URL),
          fetch(DAILY_PUZZLES_URL),
        ])
        if (!categoriesRes.ok) throw new Error()
        const payload = await categoriesRes.json()
        const remoteCategories = Array.isArray(payload?.categories)
          ? payload.categories.map(normalizeCategoryRecord).filter(Boolean)
          : []

        let dailyGames = []
        if (dailyRes.ok) {
          const dailyPayload = await dailyRes.json()
          const puzzles = Array.isArray(dailyPayload?.puzzles)
            ? dailyPayload.puzzles.map(normalizeDailyPuzzleRecord).filter(Boolean)
            : []
          dailyGames = puzzles
          setDailyArchive(puzzles)
        } else {
          setDailyArchive([])
        }

        const mergedCategories = mergeCategories(remoteCategories, dailyGames)
        setSystemCategories(mergedCategories)
        setSelectedCategory((cur) => cur || mergedCategories[0]?.name || '')
      } catch {
        setSelectionMessage('Categories could not be loaded.')
      } finally {
        setLoadingCategories(false)
      }
    }
    load()
  }, [])

  // Persist created games
  useEffect(() => {
    localStorage.setItem(CREATED_GAMES_KEY, JSON.stringify(createdGames))
  }, [createdGames])

  // Load user API games in create mode
  useEffect(() => {
    if (appMode !== 'create' || !nickname.trim()) return
    loadUserGames()
  }, [appMode, nickname])

  // Handle URL play shortcut
  useEffect(() => {
    const shortcut = parsePlayShortcutPath()
    if (!shortcut || !nickname.trim()) return

    let cancelled = false

    const loadShortcutGame = async () => {
      try {
        const res = await fetch(`${SYSTEM_ALL_GAMES_URL}?category=${encodeURIComponent(shortcut.category)}`)
        if (!res.ok) throw new Error()
        const payload = await res.json()
        const raw = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.games) ? payload.games : Array.isArray(payload) ? payload : []
        const summary = raw
          .map((record) => normalizeSystemGameSummary(record, shortcut.category))
          .filter(Boolean)
          .find((game) => game.name.toLowerCase() === shortcut.game.toLowerCase())

        if (cancelled) return

        startGameFromName(shortcut.game, summary || {
          id: `${shortcut.category}-${shortcut.game}`,
          name: shortcut.game,
          category: shortcut.category,
          createdBy: '',
        })
      } catch {
        if (cancelled) return
        startGameFromName(shortcut.game, {
          id: `${shortcut.category}-${shortcut.game}`,
          name: shortcut.game,
          category: shortcut.category,
          createdBy: '',
        })
      }
    }

    loadShortcutGame()
    return () => { cancelled = true }
  }, [nickname])

  // Group polling: detect revealReady → switch to results
  useEffect(() => {
    if (groupSession.revealReady && groupPhase === 'playing') {
      setGroupPhase('results')
    }
  }, [groupSession.revealReady, groupPhase])

  useEffect(() => {
    const status = `${groupSession.session?.status ?? ''}`.trim().toLowerCase()
    if (status !== 'inprogress') return

    if (!groupSession.revealReady && groupPhase === 'results') {
      setGroupPhase('playing')
    }
  }, [groupSession.session?.status, groupSession.revealReady, groupPhase, groupSession.session?.currentEntryIndex])

  useEffect(() => {
    const status = `${groupSession.session?.status ?? ''}`.trim().toLowerCase()
    if (status !== 'finished') return

    let cancelled = false

    const finalizeGame = async () => {
      const summary = groupSession.summary ?? await groupSession.finalize()
      if (!cancelled && summary) {
        setGroupPhase('summary')
      }
    }

    finalizeGame()
    return () => { cancelled = true }
  }, [groupSession.session?.status, groupSession.summary, groupSession.finalize])

  const loadGamesForCategory = useCallback(async (category) => {
    if (!category) return
    setLoadingGames(true)
    setSystemGames([])
    setSelectedCategory(category)
    setSelectionMessage('')
    if (category === DAILY_CATEGORY_NAME) {
      const dailyGames = [...dailyArchive]
        .sort((left, right) => right.date.localeCompare(left.date))
        .map(toDailyGameSummary)
      setSystemGames(dailyGames)
      const todaysGame = dailyGames.find((game) => game.isToday)
      setSelectionMessage(
        todaysGame
          ? `Solve today's puzzle or replay an earlier daily from the archive.`
          : dailyGames.length
            ? 'Choose a daily puzzle from the archive.'
            : 'No daily puzzles are available yet.'
      )
      setLoadingGames(false)
      return
    }
    try {
      const res = await fetch(`${SYSTEM_ALL_GAMES_URL}?category=${encodeURIComponent(category)}`)
      if (!res.ok) throw new Error()
      const payload = await res.json()
      const raw = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.games) ? payload.games : Array.isArray(payload) ? payload : []
      const games = raw.map((r) => normalizeSystemGameSummary(r, category)).filter(Boolean)
      setSystemGames(games)
      setSelectionMessage(games.length ? `Choose a game in "${category}".` : `No games in "${category}" yet.`)
    } catch {
      setSystemGames([])
      setSelectionMessage(`Games for "${category}" could not be loaded.`)
    } finally {
      setLoadingGames(false)
    }
  }, [dailyArchive])

  const startGameFromName = useCallback(async (gameName, sourceSummary) => {
    const name = `${gameName ?? ''}`.trim()
    if (!name) return
    setLoadingGamePool(true)
    setSelectionMessage('')
    if ((sourceSummary?.category ?? selectedCategory) === DAILY_CATEGORY_NAME) {
      const puzzle = dailyArchive.find((entry) => entry.gameName.toLowerCase() === name.toLowerCase())
      if (!puzzle) {
        setSelectionMessage(`Daily puzzle "${name}" could not be found in the archive.`)
        setLoadingGamePool(false)
        return
      }
      const summary = sourceSummary || toDailyGameSummary(puzzle)
      gameSession.startPool([toDailyGameEntry(puzzle)], summary)
      setSelectedGame(summary)
      setSelectedCategory(DAILY_CATEGORY_NAME)
      setSelectionMessage(summary.isToday ? 'Solving today\'s daily puzzle.' : `Replaying "${name}".`)
      setLoadingGamePool(false)
      return
    }
    try {
      const res = await fetch(`${SYSTEM_GAMES_URL}?game=${encodeURIComponent(name)}`)
      if (!res.ok) throw new Error()
      const payload = await res.json()
      const pool = (Array.isArray(payload?.data) ? payload.data : [])
        .map((r) => normalizeGameRecord(r, 'system'))
        .filter(Boolean)
      if (!pool.length) {
        setSelectionMessage(`No words available in "${name}" yet.`)
        return
      }
      const summary = sourceSummary || { name, category: selectedCategory }
      gameSession.startPool(pool, summary)
      setSelectedGame(summary)
      setSelectionMessage(`Playing "${name}".`)
    } catch {
      setSelectionMessage(`Game "${name}" could not be loaded.`)
    } finally {
      setLoadingGamePool(false)
    }
  }, [selectedCategory, gameSession, dailyArchive])

  const handlePlayDailyPuzzle = useCallback(() => {
    const todaysPuzzle = dailyArchive.find((puzzle) => puzzle.date === new Date().toISOString().slice(0, 10))
    if (!todaysPuzzle) {
      setSelectedCategory(DAILY_CATEGORY_NAME)
      loadGamesForCategory(DAILY_CATEGORY_NAME)
      return
    }
    const summary = toDailyGameSummary(todaysPuzzle)
    setSelectedCategory(DAILY_CATEGORY_NAME)
    setSystemGames([...dailyArchive].sort((left, right) => right.date.localeCompare(left.date)).map(toDailyGameSummary))
    startGameFromName(summary.name, summary)
  }, [dailyArchive, loadGamesForCategory, startGameFromName])

  const handleStartGroupGame = useCallback(async () => {
    const startedSession = await groupSession.start()
    if (!startedSession) return
    setGroupLobbyMessage('Game started. Joining players...')
    setGroupPhase('playing')
  }, [groupSession.start])

  useEffect(() => {
    const status = `${groupSession.session?.status ?? ''}`.trim().toLowerCase()
    if (status !== 'inprogress') return

    if (groupPhase === 'lobby') {
      setGroupLobbyMessage('The host started the game. Joining now...')
      setGroupPhase('playing')
    }
  }, [groupSession.session?.status, groupPhase])

  const loadUserGames = useCallback(async () => {
    const user = nickname.trim()
    if (!user) return
    try {
      const res = await fetch(`${USER_GAMES_URL}?user_name=${encodeURIComponent(user)}`)
      if (!res.ok) throw new Error()
      const payload = await res.json()
      const raw = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.games) ? payload.games : Array.isArray(payload) ? payload : []
      setUserApiGames(raw.map(normalizeUserGameSummary).filter(Boolean))
    } catch {
      setUserApiGames([])
    }
  }, [nickname])

  const handleCreateSubmit = useCallback(async (form) => {
    const category = form.category.trim()
    const gameName = form.gameName.trim()
    if (!category || !gameName) {
      setCreateError('Choose a category and enter a game name.')
      return
    }
    setIsCreating(true)
    setCreateError('')
    setCreateJob(null)
    try {
      const payload = {
        category,
        game_name: gameName,
        nick_name: nickname,
        'auto-approve': true,
        audio_enabled: form.includeAudio,
        notes: {
          NoOfWords: form.entryCount,
          GamePrompt: form.gamePrompt || form.prompt,
          TitlePrompt: form.titlePrompt,
          CluesPrompt: form.cluesPrompt,
          ...(form.includeAudio ? { AudioPrompt: form.audioPrompt } : {}),
        },
      }
      const res = await fetch(CREATE_GAME_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const text = await res.text()
      const parsed = text ? JSON.parse(text) : {}
      if (!res.ok) throw new Error(parsed.error || 'Could not create game.')
      setCreateJob(parsed)
      setSystemCategories((cur) =>
        cur.some((c) => c.name === category) ? cur : [...cur, { name: category, games: null }]
      )
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setIsCreating(false)
    }
  }, [nickname])

  const handleJobPoll = useCallback(async (jobId) => {
    try {
      const res = await fetch(`${CREATE_GAME_JOBS_URL}/${encodeURIComponent(jobId)}`)
      const parsed = await res.json()
      if (!res.ok) throw new Error(parsed.error || 'Could not poll job.')
      setCreateJob(parsed)
      if (parsed.status === 'completed' && !processedJobIds.includes(jobId)) {
        const created = (Array.isArray(parsed.result?.created) ? parsed.result.created : [])
          .map((r) => normalizeGameRecord(r, 'generated'))
          .filter(Boolean)
          .map((r) => ({ ...r, createdBy: nickname, createdAt: new Date().toISOString(), source: 'generated' }))
        if (created.length) setCreatedGames((cur) => [...created, ...cur])
        setProcessedJobIds((ids) => [...ids, jobId])
        loadUserGames()
      }
    } catch (err) {
      console.error(err)
    }
  }, [processedJobIds, nickname, loadUserGames])

  const handleLoadReview = useCallback(async (game) => {
    setReviewGame(game)
    setReviewEntries([])
    setReviewApproved(false)
    try {
      const user = game.userName || game.createdBy || nickname.trim()
      const res = await fetch(
        `${STAGING_GAME_URL}?category=${encodeURIComponent(game.category)}&game=${encodeURIComponent(game.name)}&createdby=${encodeURIComponent(user)}`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const payload = await res.json()
      const entries = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
      setReviewEntries(entries)
    } catch (err) {
      console.error(err)
    }
  }, [nickname])

  const handleApproveEntry = useCallback(async (entry, idx) => {
    if (!reviewGame) return
    setApprovingIds((ids) => [...ids, idx])
    try {
      const res = await fetch(APPROVE_GAME_ENTRY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_name: reviewGame.name, category: reviewGame.category, user_name: nickname.trim(), entry_json: entry }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setReviewEntries((cur) => cur.filter((_, i) => i !== idx))
      setReviewApproved(reviewEntries.length === 1)
      await loadUserGames()
    } catch (err) {
      console.error(err)
    } finally {
      setApprovingIds((ids) => ids.filter((id) => id !== idx))
    }
  }, [reviewGame, reviewEntries, nickname, loadUserGames])

  const handleApproveAll = useCallback(async () => {
    if (!reviewGame || !reviewEntries.length) return
    setApprovingIds(reviewEntries.map((_, i) => i))
    try {
      for (const entry of reviewEntries) {
        await fetch(APPROVE_GAME_ENTRY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game_name: reviewGame.name, category: reviewGame.category, user_name: nickname.trim(), entry_json: entry }),
        })
      }
      setReviewEntries([])
      setReviewApproved(true)
      await loadUserGames()
    } catch (err) {
      console.error(err)
    } finally {
      setApprovingIds([])
    }
  }, [reviewGame, reviewEntries, nickname, loadUserGames])

  const shareGame = useCallback(async (game) => {
    const url = buildGameShortcutUrl(game?.category, game?.name || game?.title)
    try {
      if (navigator.share) {
        await navigator.share({ title: game.name, text: `Play ${game.name}`, url })
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch { /* ignore AbortError */ }
  }, [])

  const visibleCreatedGames = userApiGames.length ? userApiGames : createdGames.filter(
    (g) => g.createdBy?.toLowerCase() === nickname.trim().toLowerCase()
  )

  const breadcrumbs = useMemo(() => {
    if (!selectedGame) return []
    return [
      { label: 'All Games', onClick: () => { setSelectedGame(null); setSystemGames([]) } },
      { label: selectedGame.category || selectedCategory, onClick: () => loadGamesForCategory(selectedGame.category || selectedCategory) },
      { label: selectedGame.name, onClick: null },
    ]
  }, [selectedGame, selectedCategory, loadGamesForCategory])

  if (!nickname) {
    return <LandingPage onStart={setNickname} />
  }

  const overflowDebugPanels = [
    { id: 'desktop-header', label: 'Desktop header' },
    { id: 'mobile-header', label: 'Mobile header' },
    { id: 'main-content', label: 'Main content' },
    ...(appMode === 'play' && playMode === 'solo'
      ? [
          { id: 'solo-shell', label: 'Solo shell' },
          { id: 'desktop-game-selector', label: 'Desktop game selector' },
          { id: 'play-screen', label: 'Play screen' },
        ]
      : []),
    ...(appMode === 'play' && playMode === 'group'
      ? [{ id: 'group-shell', label: `Group shell (${groupPhase})` }]
      : []),
    ...(appMode === 'create'
      ? [{ id: 'create-shell', label: 'Create shell' }]
      : []),
    { id: 'play-stats', label: 'Play: stats row' },
    { id: 'play-progress', label: 'Play: progress bar' },
    { id: 'play-title', label: 'Play: title block' },
    { id: 'play-hints', label: 'Play: hints stack' },
    { id: 'play-response', label: 'Play: input/result area' },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-[#f0fdf7] via-[#f8fafc] to-[#fefce8] flex flex-col w-full max-w-full overflow-x-hidden">
      <AppBackground />
      {overflowDebugEnabled && (
        <OverflowDebugPanel
          panels={overflowDebugPanels}
          hiddenPanels={hiddenOverflowPanels}
          onToggle={toggleOverflowPanel}
        />
      )}

      {/* Desktop header */}
      <div className={isOverflowPanelHidden('desktop-header') ? 'hidden' : 'hidden lg:block'}>
        <AppHeader
          crumbs={appMode === 'play' ? breadcrumbs : []}
          mode={playMode}
          onModeChange={(m) => { setPlayMode(m); if (m === 'group') setGroupPhase('setup') }}
          nickname={nickname}
          appMode={appMode}
          onAppModeChange={(m) => { setAppMode(m); setCreateJob(null); setReviewGame(null) }}
        />
      </div>

      {/* Mobile header */}
      {!isOverflowPanelHidden('mobile-header') && (
        <MobileNav
          activeGameName={selectedGame?.name ?? ''}
          nickname={nickname}
          categories={systemCategories}
          systemGames={systemGames}
          selectedCategory={selectedCategory}
          loadingGames={loadingCategories || loadingGames || loadingGamePool}
          onCategorySelect={loadGamesForCategory}
          onGameSelect={(g) => startGameFromName(g.name, g)}
          onGameShare={shareGame}
          onNicknameChange={(n) => { localStorage.setItem(NICKNAME_KEY, n); setNickname(n) }}
        />
      )}

      {/* Mobile bottom nav */}
      <BottomNav
        appMode={appMode}
        onAppModeChange={(m) => { setAppMode(m); setCreateJob(null); setReviewGame(null) }}
        playMode={playMode}
        onPlayModeChange={(m) => { setPlayMode(m); if (m === 'group') setGroupPhase('setup') }}
      />

      <div className={isOverflowPanelHidden('main-content') ? 'hidden' : 'flex-1 w-full max-w-full overflow-x-hidden px-3 pt-[64px] sm:px-4 lg:pt-6 lg:py-6 lg:px-6 pb-16 lg:pb-0'}>
        {/* ── Play mode ── */}
        {appMode === 'play' && (
          <>
            {/* Solo */}
            {playMode === 'solo' && (
              <div className={isOverflowPanelHidden('solo-shell') ? 'hidden' : 'mx-auto w-full max-w-7xl flex flex-col lg:flex-row gap-6 items-stretch lg:items-start overflow-hidden lg:overflow-visible'}>
                {/* Game selector: desktop sidebar only — mobile uses MobileNav sheet */}
                <div className={isOverflowPanelHidden('desktop-game-selector') ? 'hidden' : 'hidden lg:block'}>
                  <GameSelector
                    categories={systemCategories}
                    systemGames={systemGames}
                    selectedCategory={selectedCategory}
                    selectedGame={selectedGame}
                    loading={loadingCategories || loadingGames || loadingGamePool}
                    message={selectionMessage}
                    onCategorySelect={loadGamesForCategory}
                    onGameSelect={(g) => startGameFromName(g.name, g)}
                    poolSize={gameSession.pool.length}
                  />
                </div>
                <div className={isOverflowPanelHidden('play-screen') ? 'hidden' : 'flex-1 min-w-0 w-full'}>
                  <PlayScreen
                    gameSession={gameSession}
                    hiddenOverflowPanels={overflowDebugEnabled ? hiddenOverflowPanels : null}
                    nickname={nickname}
                    categories={systemCategories}
                    onCategorySelect={loadGamesForCategory}
                    onPlayDaily={handlePlayDailyPuzzle}
                  />
                </div>
              </div>
            )}

            {/* Group */}
            {playMode === 'group' && (
              <div className={isOverflowPanelHidden('group-shell') ? 'hidden' : 'mx-auto w-full lobby-shell'}>
                {groupPhase === 'setup' && (
                  <GroupSetup
                    nickname={nickname}
                    categories={systemCategories}
                    selectedCategory={selectedCategory}
                    systemGames={systemGames}
                    onCategorySelect={loadGamesForCategory}
                    onSessionCreated={(s) => {
                      setPendingGroupSession(s)
                      setGroupLobbyMessage('')
                      setGroupPhase('lobby')
                    }}
                  />
                )}
                {groupPhase === 'lobby' && (
                  <Lobby
                    session={groupSession.session}
                    nickname={nickname}
                    starting={groupSession.starting}
                    message={groupLobbyMessage || (groupSession.session?.status === 'InProgress' ? 'The host started the game. Join now.' : '')}
                    onStart={handleStartGroupGame}
                    onLeave={() => { groupSession.leave(); setGroupLobbyMessage(''); setGroupPhase('setup') }}
                  />
                )}
                {groupPhase === 'playing' && (
                  <PlayScreen
                    gameSession={gameSession}
                    groupSession={groupSession}
                    hiddenOverflowPanels={overflowDebugEnabled ? hiddenOverflowPanels : null}
                    nickname={nickname}
                    categories={systemCategories}
                    onCategorySelect={loadGamesForCategory}
                  />
                )}
                {groupPhase === 'results' && (
                  <EntryResults
                    session={groupSession.session}
                    myName={nickname}
                    onNext={async () => {
                      const nextSession = await groupSession.advance()
                      if (!nextSession) return
                      if (`${nextSession.status ?? ''}`.trim().toLowerCase() === 'finished') {
                        const summary = groupSession.summary ?? await groupSession.finalize()
                        if (summary) setGroupPhase('summary')
                        return
                      }
                      setGroupPhase('playing')
                    }}
                    onLeave={() => { groupSession.leave(); setGroupLobbyMessage(''); setPlayMode('solo') }}
                  />
                )}
                {groupPhase === 'summary' && (
                  <GameSummary
                    summary={groupSession.summary}
                    myName={nickname}
                    onLeave={() => { groupSession.leave(); setGroupLobbyMessage(''); setGroupPhase('setup'); setPlayMode('solo') }}
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* ── Create mode ── */}
        {appMode === 'create' && (
          <div className={isOverflowPanelHidden('create-shell') ? 'hidden' : 'mx-auto max-w-3xl space-y-6'}>
            <MyGamesList
              games={visibleCreatedGames}
              onReview={handleLoadReview}
              onPlay={(g) => { setAppMode('play'); setPlayMode('solo'); startGameFromName(g.name, g) }}
              onShare={shareGame}
              onNew={() => { setCreateJob(null); setReviewGame(null) }}
            />

            {reviewGame ? (
              <ReviewEntries
                game={reviewGame}
                entries={reviewEntries}
                onApprove={handleApproveEntry}
                onApproveAll={handleApproveAll}
                approvingIds={approvingIds}
                approved={reviewApproved}
              />
            ) : createJob ? (
              <JobStatus job={createJob} onPoll={handleJobPoll} />
            ) : (
              <CreateForm
                categories={systemCategories}
                nickname={nickname}
                onSubmit={handleCreateSubmit}
                loading={isCreating}
                error={createError}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}


