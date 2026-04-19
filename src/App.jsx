import { useEffect, useMemo, useState } from 'react'

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

const emptyCreateForm = {
  categoryMode: 'existing',
  existingCategory: '',
  newCategory: '',
  gameName: '',
  autoApprove: true,
  includeAudioHint: false,
  numberOfWords: '1',
  gamePrompt: '',
  audioPrompt: '',
  titlePrompt: '',
  cluesPrompt: '',
}

const initialPlayState = {
  game: null,
  guesses: ['', '', '', '', ''],
  currentAttempt: 0,
  finished: false,
  won: false,
  resultMessage: '',
}

const createSessionRecord = (gameSummary, totalEntries) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  gameName: gameSummary?.name || 'Game',
  category: gameSummary?.category || '',
  createdBy: gameSummary?.createdBy || gameSummary?.userName || '',
  totalEntries,
  currentEntry: totalEntries ? 1 : 0,
  solved: 0,
  totalPoints: 0,
  solvedEntryIds: [],
  startedAt: new Date().toISOString(),
})

const parseStoredGames = () => {
  try {
    const raw = localStorage.getItem(CREATED_GAMES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const normalizeAudioConfig = (audio) => {
  if (!audio || typeof audio !== 'object') {
    return null
  }

  const type = `${audio.type ?? ''}`.trim().toLowerCase()
  const videoId = `${audio.videoId ?? ''}`.trim()
  const start = Number(audio.start)
  const duration = Number(audio.duration)

  if (type !== 'youtube' || !videoId) {
    return null
  }

  return {
    type,
    videoId,
    start: Number.isFinite(start) && start >= 0 ? start : 0,
    duration: Number.isFinite(duration) && duration > 0 ? duration : 0,
  }
}

const buildYouTubeEmbedUrl = (audio) => {
  if (!audio || audio.type !== 'youtube' || !audio.videoId) {
    return ''
  }

  const params = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1' })

  if (audio.start > 0) {
    params.set('start', `${audio.start}`)
  }

  if (audio.duration > 0) {
    params.set('end', `${audio.start + audio.duration}`)
  }

  return `https://www.youtube.com/embed/${encodeURIComponent(audio.videoId)}?${params.toString()}`
}

const normalizeGameRecord = (record, fallbackSource) => {
  if (!record || typeof record !== 'object') {
    return null
  }

  const rawHints = Array.isArray(record.hints)
    ? record.hints
    : Array.isArray(record.clues)
      ? record.clues
      : []

  const hints = rawHints.map((hint) => `${hint ?? ''}`.trim()).filter(Boolean).slice(0, 5)
  const word = `${record.answer ?? record.word ?? record.song ?? ''}`.trim()
  const audio = normalizeAudioConfig(record.audio ?? record.media)

  if (!word || hints.length !== 5) {
    return null
  }

  return {
    id: `${record.id ?? `${fallbackSource}-${word.toLowerCase()}`}`,
    title: `${record.title ?? record.titleHint ?? ''}`.trim(),
    word,
    hints,
    category: `${record.category ?? ''}`.trim(),
    band: `${record.band ?? record.meta?.artist ?? ''}`.trim(),
    audio,
    createdBy: `${record.createdBy ?? 'System'}`.trim() || 'System',
    createdAt: `${record.createdAt ?? ''}`,
    source: `${record.source ?? fallbackSource}`,
  }
}

const normalizeSystemGameSummary = (record, fallbackCategory) => {
  if (!record || typeof record !== 'object') {
    return null
  }

  const name = `${record.game_name ?? record.gameName ?? record.name ?? record.title ?? record.game ?? ''}`.trim()
  if (!name) {
    return null
  }

  const category = `${record.category ?? fallbackCategory ?? ''}`.trim()
  const createdBy = `${record.created_by ?? record.createdBy ?? record.nick_name ?? record.nickname ?? record.owner ?? 'System'}`.trim()
  const id = `${record.id ?? `${category || 'system'}-${name}`}`.trim()

  return {
    id,
    name,
    category,
    createdBy: createdBy || 'System',
  }
}

const normalizeUserGameSummary = (record) => {
  const summary = normalizeSystemGameSummary(record)

  if (!summary) {
    return null
  }

  const status = `${record.status ?? record.game_status ?? record.state ?? ''}`.trim().toLowerCase()

  return {
    ...summary,
    status: status || 'published',
    userName: `${record.user_name ?? record.userName ?? record.created_by ?? record.createdBy ?? summary.createdBy}`.trim(),
  }
}

const normalizeCategoryRecord = (record) => {
  if (!record || typeof record !== 'object') {
    return null
  }

  const name = `${record.category ?? record.name ?? ''}`.trim()
  if (!name) {
    return null
  }

  const games = Number(record.games)
  const createdBy = record.created_by && typeof record.created_by === 'object' ? record.created_by : {}

  return {
    name,
    games: Number.isFinite(games) && games >= 0 ? games : null,
    createdBy,
  }
}

const buttonBaseClass =
  'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition duration-150'

const activeButtonClass = `${buttonBaseClass} bg-slate-900 text-white shadow-lg shadow-slate-900/20`
const idleButtonClass =
  `${buttonBaseClass} border border-slate-300 bg-white/70 text-slate-700 hover:border-slate-400 hover:bg-white`
const accentButtonClass =
  `${buttonBaseClass} bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 hover:bg-amber-400`
const selectClass =
  'border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-amber-500'
const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-amber-500'

const updateJsonAtPath = (value, path, nextLeafValue) => {
  if (!path.length) {
    return nextLeafValue
  }

  const [head, ...tail] = path
  const nextValue = Array.isArray(value) ? [...value] : { ...value }
  nextValue[head] = updateJsonAtPath(nextValue[head], tail, nextLeafValue)
  return nextValue
}

const parsePlayShortcutPath = () => {
  const hashPath = window.location.hash.startsWith('#/') ? window.location.hash.slice(1) : ''
  const shortcutPath = hashPath || window.location.pathname
  const pathParts = shortcutPath.split('/').filter(Boolean)

  if (pathParts[0]?.toLowerCase() !== 'play' || pathParts.length < 3) {
    return null
  }

  try {
    const category = decodeURIComponent(pathParts[1]).trim()
    const game = decodeURIComponent(pathParts.slice(2).join('/')).trim()

    return category && game ? { category, game } : null
  } catch {
    return null
  }
}

const buildGameShortcutUrl = (category, game) => {
  const origin = window.location.origin
  const encodedCategory = encodeURIComponent(`${category ?? ''}`.trim() || 'Game')
  const encodedGame = encodeURIComponent(`${game ?? ''}`.trim() || 'Game')

  return `${origin}/#/play/${encodedCategory}/${encodedGame}`
}

const formatReadOnlyValue = (value) => {
  if (value === null || value === undefined) {
    return ''
  }

  return typeof value === 'object' ? JSON.stringify(value) : `${value}`
}

const EditableJsonValue = ({ value, path = [], onChange }) => {
  if (Array.isArray(value)) {
    return (
      <div className="space-y-3">
        {value.map((item, index) => (
          <div className="rounded-2xl border border-slate-200 bg-white p-3" key={`${path.join('.')}-${index}`}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{index + 1}</p>
            <EditableJsonValue value={item} path={[...path, index]} onChange={onChange} />
          </div>
        ))}
      </div>
    )
  }

  if (value && typeof value === 'object') {
    return (
      <div className="space-y-3">
        {Object.entries(value)
          .filter(([key]) => !['category', 'game_name', 'created_by', 'is_confirmed'].includes(key))
          .map(([key, childValue]) => {
            const nextPath = [...path, key]
            const isReadOnly = key === 'id' || key === 'answer'
            const hideLabel = key === 'text' && path[path.length - 2] === 'clues'

            if (isReadOnly) {
              return (
                <div
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                  key={nextPath.join('.')}
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{key}</span>
                  <span className="font-semibold text-slate-900">
                    {formatReadOnlyValue(childValue)}
                  </span>
                </div>
              )
            }

            return (
              <label className="block" key={nextPath.join('.')}>
                {hideLabel ? null : (
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{key}</span>
                )}
                <EditableJsonValue value={childValue} path={nextPath} onChange={onChange} />
              </label>
            )
          })}
      </div>
    )
  }

  return (
    <textarea
      className={`${inputClass} min-h-12 resize-y`}
      value={value ?? ''}
      onChange={(event) => onChange(path, event.target.value)}
    />
  )
}

function App() {
  const [nickname, setNickname] = useState(() => localStorage.getItem(NICKNAME_KEY) ?? '')
  const [nicknameInput, setNicknameInput] = useState(() => localStorage.getItem(NICKNAME_KEY) ?? '')
  const [systemCategories, setSystemCategories] = useState([])
  const [selectedSystemCategory, setSelectedSystemCategory] = useState('')
  const [systemGames, setSystemGames] = useState([])
  const [selectedSystemGame, setSelectedSystemGame] = useState(null)
  const [systemGamePool, setSystemGamePool] = useState([])
  const [systemGameIndex, setSystemGameIndex] = useState(0)
  const [createdGames, setCreatedGames] = useState(() => parseStoredGames())
  const [userApiGames, setUserApiGames] = useState([])
  const [isLoadingUserApiGames, setIsLoadingUserApiGames] = useState(false)
  const [userApiGamesMessage, setUserApiGamesMessage] = useState('')
  const [reviewGame, setReviewGame] = useState(null)
  const [reviewEntries, setReviewEntries] = useState([])
  const [isLoadingReviewEntries, setIsLoadingReviewEntries] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')
  const [approvingEntryIds, setApprovingEntryIds] = useState([])
  const [isReviewApproved, setIsReviewApproved] = useState(false)
  const [mode, setMode] = useState('play')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showProfilePanel, setShowProfilePanel] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [createMessage, setCreateMessage] = useState('')
  const [isCreatingGame, setIsCreatingGame] = useState(false)
  const [createJob, setCreateJob] = useState(null)
  const [isRefreshingCreateJob, setIsRefreshingCreateJob] = useState(false)
  const [processedCreateJobIds, setProcessedCreateJobIds] = useState([])
  const [loadingMessage, setLoadingMessage] = useState('')
  const [selectionMessage, setSelectionMessage] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [playState, setPlayState] = useState(initialPlayState)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isLoadingSystemGames, setIsLoadingSystemGames] = useState(false)
  const [isLoadingSelectedGame, setIsLoadingSelectedGame] = useState(false)
  const [guessSuggestions, setGuessSuggestions] = useState([])
  const [isLoadingGuessSuggestions, setIsLoadingGuessSuggestions] = useState(false)
  const [committedGuessSuggestion, setCommittedGuessSuggestion] = useState('')
  const [isAudioPreviewEnabled, setIsAudioPreviewEnabled] = useState(false)
  const [openCategory, setOpenCategory] = useState('')
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState('')
  const [hasHandledPlayShortcut, setHasHandledPlayShortcut] = useState(false)

  useEffect(() => {
    const loadSystemCategories = async () => {
      setIsLoadingCategories(true)
      setLoadingMessage('Loading system categories...')

      try {
        const response = await fetch(SYSTEM_CATEGORIES_URL)

        if (!response.ok) {
          throw new Error('System categories could not be fetched.')
        }

        const payload = await response.json()
        const nextCategories = Array.isArray(payload?.categories)
          ? payload.categories.map((record) => normalizeCategoryRecord(record)).filter(Boolean)
          : []

        setSystemCategories(nextCategories)
        setSelectedSystemCategory((current) => current || nextCategories[0]?.name || '')
        setCreateForm((current) => ({
          ...current,
          existingCategory: current.existingCategory || nextCategories[0]?.name || '',
        }))
        setLoadingMessage(nextCategories.length ? '' : 'No system categories are available yet.')
      } catch {
        setLoadingMessage('System categories could not be loaded.')
      } finally {
        setIsLoadingCategories(false)
      }
    }

    loadSystemCategories()
  }, [])

  useEffect(() => {
    localStorage.setItem(CREATED_GAMES_KEY, JSON.stringify(createdGames))
  }, [createdGames])

  useEffect(() => {
    if (mode !== 'create' || !nickname.trim()) {
      return
    }

    loadUserCreatedGames()
  }, [mode, nickname])

  useEffect(() => {
    setIsAudioPreviewEnabled(false)
  }, [playState.game?.id])

  const userCreatedGames = useMemo(
    () => createdGames.filter((game) => game.createdBy.toLowerCase() === nickname.trim().toLowerCase()),
    [createdGames, nickname],
  )

  const visibleCreatedGames = userApiGames.length ? userApiGames : userCreatedGames

  const visibleHints = useMemo(() => {
    if (!playState.game) {
      return []
    }

    const count = playState.finished
      ? playState.won
        ? playState.currentAttempt + 1
        : 5
      : playState.currentAttempt + 1

    return playState.game.hints.slice(0, count)
  }, [playState])

  const profileInitials = useMemo(() => nickname.trim().slice(0, 2).toUpperCase() || 'PL', [nickname])
  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || null,
    [activeSessionId, sessions],
  )
  const activeGuess = playState.game ? playState.guesses[playState.currentAttempt] ?? '' : ''
  const audioEmbedUrl = useMemo(() => buildYouTubeEmbedUrl(playState.game?.audio), [playState.game?.audio])
  useEffect(() => {
    if (!playState.game || playState.finished) {
      setGuessSuggestions([])
      setIsLoadingGuessSuggestions(false)
      return
    }

    const prefix = activeGuess.trim()
    const category = (selectedSystemCategory || playState.game.category || '').trim()

    if (!category || prefix.length < 3) {
      setGuessSuggestions([])
      setIsLoadingGuessSuggestions(false)
      return
    }

    if (committedGuessSuggestion && prefix.toLowerCase() === committedGuessSuggestion.toLowerCase()) {
      setGuessSuggestions([])
      setIsLoadingGuessSuggestions(false)
      return
    }

    let cancelled = false
    const timeoutId = window.setTimeout(async () => {
      setIsLoadingGuessSuggestions(true)

      try {
        const requestUrl = `${SYSTEM_WORD_SUGGESTIONS_URL}?category=${encodeURIComponent(
          category,
        )}&game=${encodeURIComponent(selectedSystemGame?.name || playState.game?.title || '')}&createdby=${encodeURIComponent(
          selectedSystemGame?.createdBy || '',
        )}&startsWith=${encodeURIComponent(prefix)}`
        const response = await fetch(requestUrl)

        if (!response.ok) {
          throw new Error('Suggestions could not be fetched.')
        }

        const payload = await response.json()
        const nextSuggestions = Array.isArray(payload?.words)
          ? payload.words.map((word) => `${word ?? ''}`.trim()).filter(Boolean)
          : []

        if (!cancelled) {
          setGuessSuggestions(nextSuggestions)
        }
      } catch {
        if (!cancelled) {
          setGuessSuggestions([])
        }
      } finally {
        if (!cancelled) {
          setIsLoadingGuessSuggestions(false)
        }
      }
    }, 220)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [
    activeGuess,
    committedGuessSuggestion,
    playState.currentAttempt,
    playState.finished,
    playState.game,
    selectedSystemCategory,
  ])

  const saveNickname = (event) => {
    event.preventDefault()

    const trimmedNickname = nicknameInput.trim()
    if (!trimmedNickname) {
      return
    }

    localStorage.setItem(NICKNAME_KEY, trimmedNickname)
    setNickname(trimmedNickname)
    setShowProfilePanel(false)
  }

  const setCreateMode = () => {
    setMode('create')
    setShowCreateForm(false)
    setCreateMessage('')
    setSelectionMessage('')
    setReviewGame(null)
    setReviewEntries([])
    setReviewMessage('')
    setIsReviewApproved(false)
    setPlayState(initialPlayState)
  }

  const setPlayMode = () => {
    setMode('play')
    setShowCreateForm(false)
    setCreateMessage('')
    setSelectionMessage('')
    setReviewGame(null)
    setReviewEntries([])
    setReviewMessage('')
    setIsReviewApproved(false)
  }

  const handleModeChange = (event) => {
    if (event.target.value === 'create') {
      setCreateMode()
      return
    }

    setPlayMode()
  }

  const handleCreateChange = (field) => (event) => {
    const nextValue = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setCreateForm((current) => ({ ...current, [field]: nextValue }))
  }

  const shareGameShortcut = async (game) => {
    const gameName = game?.name || game?.title || ''
    const url = buildGameShortcutUrl(game?.category, gameName)

    try {
      if (navigator.share) {
        await navigator.share({
          title: gameName,
          text: `Play ${gameName}`,
          url,
        })
        setShareMessage(`Share link ready for "${gameName}".`)
        return
      }

      await navigator.clipboard.writeText(url)
      setShareMessage(`Copied share link for "${gameName}".`)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      setShareMessage('The share link could not be copied.')
    }
  }

  const resetCreateForm = () => {
    setCreateForm({
      ...emptyCreateForm,
      existingCategory: systemCategories[0]?.name || '',
    })
  }

  const loadUserCreatedGames = async () => {
    const userName = nickname.trim()
    if (!userName) {
      return
    }

    setIsLoadingUserApiGames(true)
    setUserApiGamesMessage('Loading your games...')

    try {
      const response = await fetch(`${USER_GAMES_URL}?user_name=${encodeURIComponent(userName)}`)

      if (!response.ok) {
        throw new Error('Your games could not be loaded.')
      }

      const payload = await response.json()
      const rawGames = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.games)
          ? payload.games
          : Array.isArray(payload)
            ? payload
            : []
      const normalizedGames = rawGames.map((record) => normalizeUserGameSummary(record)).filter(Boolean)

      setUserApiGames(normalizedGames)
      setUserApiGamesMessage(normalizedGames.length ? '' : 'No games were found for this user.')
    } catch (error) {
      setUserApiGames([])
      setUserApiGamesMessage(error instanceof Error ? error.message : 'Your games could not be loaded.')
    } finally {
      setIsLoadingUserApiGames(false)
    }
  }

  const loadReviewEntries = async (game) => {
    if (!game) {
      return
    }

    const reviewUser = game.userName || game.createdBy || nickname.trim()
    setReviewGame(game)
    setReviewEntries([])
    setReviewMessage(`Loading "${game.name}" for review...`)
    setIsReviewApproved(false)
    setIsLoadingReviewEntries(true)

    try {
      const response = await fetch(
        `${STAGING_GAME_URL}?category=${encodeURIComponent(game.category)}&game=${encodeURIComponent(
          game.name,
        )}&createdby=${encodeURIComponent(reviewUser)}`,
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          errorText.trim() || `Review entries could not be loaded. The API returned HTTP ${response.status}.`,
        )
      }

      const payload = await response.json()
      const rawEntries = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.entries)
          ? payload.entries
          : Array.isArray(payload)
            ? payload
            : []

      setReviewEntries(rawEntries)
      setReviewMessage(rawEntries.length ? '' : 'No staging entries were found for this game.')
    } catch (error) {
      setReviewEntries([])
      setReviewMessage(error instanceof Error ? error.message : 'Review entries could not be loaded.')
    } finally {
      setIsLoadingReviewEntries(false)
    }
  }

  const updateReviewEntry = (entryIndex, path, value) => {
    setReviewEntries((current) =>
      current.map((entry, index) => (index === entryIndex ? updateJsonAtPath(entry, path, value) : entry)),
    )
  }

  const approveEntryRequest = async (entry) => {
    const payload = {
      game_name: reviewGame.name,
      category: reviewGame.category,
      user_name: nickname.trim(),
      entry_json: entry,
    }

    const response = await fetch(APPROVE_GAME_ENTRY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText.trim() || 'The entry could not be approved.')
    }
  }

  const approveReviewEntry = async (entry, entryIndex) => {
    if (!reviewGame) {
      return
    }

    setApprovingEntryIds((current) => [...current, entryIndex])
    setReviewMessage('Approving entry...')

    try {
      await approveEntryRequest(entry)
      setReviewEntries((current) => current.filter((_, index) => index !== entryIndex))
      setReviewMessage('Entry approved.')
      setIsReviewApproved(reviewEntries.length === 1)
      await loadUserCreatedGames()
    } catch (error) {
      setReviewMessage(error instanceof Error ? error.message : 'The entry could not be approved.')
    } finally {
      setApprovingEntryIds((current) => current.filter((id) => id !== entryIndex))
    }
  }

  const approveAllReviewEntries = async () => {
    if (!reviewGame || !reviewEntries.length) {
      return
    }

    const entryIndexes = reviewEntries.map((_, index) => index)
    setApprovingEntryIds(entryIndexes)
    setReviewMessage(`Approving ${reviewEntries.length} entries...`)

    try {
      for (const entry of reviewEntries) {
        await approveEntryRequest(entry)
      }

      setReviewEntries([])
      setReviewMessage('All entries approved.')
      setIsReviewApproved(true)
      await loadUserCreatedGames()
    } catch (error) {
      setReviewMessage(error instanceof Error ? error.message : 'The entries could not be approved.')
    } finally {
      setApprovingEntryIds([])
    }
  }

  const syncCreatedJobResult = (jobPayload) => {
    if (!jobPayload || jobPayload.status !== 'completed' || !jobPayload.result) {
      return
    }

    if (processedCreateJobIds.includes(jobPayload.jobId)) {
      return
    }

    const createdRecords = (Array.isArray(jobPayload.result.created) ? jobPayload.result.created : [])
      .map((record) => normalizeGameRecord(record, 'generated'))
      .filter(Boolean)

    if (createdRecords.length) {
      setCreatedGames((current) => [
        ...createdRecords.map((record) => ({
          ...record,
          createdBy: nickname,
          createdAt: new Date().toISOString(),
          source: 'generated',
        })),
        ...current,
      ])
    }

    setProcessedCreateJobIds((current) => [...current, jobPayload.jobId])
  }

  const refreshCreateJobStatus = async (jobId = createJob?.jobId) => {
    const safeJobId = `${jobId ?? ''}`.trim()
    if (!safeJobId) {
      return
    }

    setIsRefreshingCreateJob(true)

    try {
      const response = await fetch(`${CREATE_GAME_JOBS_URL}/${encodeURIComponent(safeJobId)}`)
      const parsed = await response.json()

      if (!response.ok) {
        throw new Error(parsed?.error || 'The job status could not be refreshed.')
      }

      setCreateJob(parsed)
      syncCreatedJobResult(parsed)

      if (parsed.status === 'completed') {
        const totalCreated = Number(parsed.result?.totalCreated) || 0
        setCreateMessage(`Job ${safeJobId} completed. ${totalCreated} game${totalCreated === 1 ? '' : 's'} created.`)
      } else if (parsed.status === 'failed') {
        setCreateMessage(parsed.error?.message || `Job ${safeJobId} failed.`)
      } else {
        setCreateMessage(`Job ${safeJobId} is ${parsed.status}.`)
      }
    } catch (error) {
      setCreateMessage(error instanceof Error ? error.message : 'The job status could not be refreshed.')
    } finally {
      setIsRefreshingCreateJob(false)
    }
  }

  const submitCreatedGame = async (event) => {
    event.preventDefault()

    const category =
      createForm.categoryMode === 'new'
        ? createForm.newCategory.trim()
        : createForm.existingCategory.trim()
    const gameName = createForm.gameName.trim()
    const numberOfWords = Number(createForm.numberOfWords)
    const gamePrompt = createForm.gamePrompt.trim()
    const audioPrompt = createForm.audioPrompt.trim()
    const titlePrompt = createForm.titlePrompt.trim()
    const cluesPrompt = createForm.cluesPrompt.trim()

    if (!category) {
      setCreateMessage('Choose an existing category or enter a new category name.')
      return
    }

    if (!gameName) {
      setCreateMessage('Enter a game name.')
      return
    }

    if (!Number.isFinite(numberOfWords) || numberOfWords <= 0) {
      setCreateMessage('Enter a valid number of words.')
      return
    }

    if (!gamePrompt) {
      setCreateMessage('Enter a game prompt.')
      return
    }

    if (createForm.includeAudioHint && !audioPrompt) {
      setCreateMessage('Enter an audio prompt or disable audio hint.')
      return
    }

    if (!titlePrompt) {
      setCreateMessage('Enter a title prompt.')
      return
    }

    if (!cluesPrompt) {
      setCreateMessage('Enter a clues prompt.')
      return
    }

    setIsCreatingGame(true)
    setCreateJob(null)
    setCreateMessage('Submitting create request...')

    const payload = {
      category,
      game_name: gameName,
      nick_name: nickname,
      'auto-approve': createForm.autoApprove,
      audio_enabled: createForm.includeAudioHint,
    }

    const notes = {}

    notes.NoOfWords = numberOfWords
    notes.GamePrompt = gamePrompt
    if (createForm.includeAudioHint) {
      notes.AudioPrompt = audioPrompt
    }
    notes.TitlePrompt = titlePrompt
    notes.CluesPrompt = cluesPrompt

    if (Object.keys(notes).length > 0) {
      payload.notes = notes
    }

    try {
      const response = await fetch(CREATE_GAME_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const responseText = await response.text()
      let parsed = null

      if (responseText) {
        try {
          parsed = JSON.parse(responseText)
        } catch {
          parsed = null
        }
      }

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Create5HintGame is not available on the deployed API yet.')
        }

        throw new Error(parsed?.error || 'The game could not be created.')
      }

      setCreateJob(parsed)
      setSystemCategories((current) =>
        current.some((record) => record.name === category)
          ? current
          : [...current, { name: category, games: null }],
      )
      setCreateMessage(`Job ${parsed.jobId} queued. Use refresh to check status.`)
    } catch (error) {
      setCreateMessage(error instanceof Error ? error.message : 'The game could not be created.')
    } finally {
      setIsCreatingGame(false)
    }
  }

  const loadSystemGamesForCategory = async (category) => {
    const normalizedCategory = `${category ?? ''}`.trim()

    if (!normalizedCategory) {
      setSelectionMessage('Choose a category to start a system game.')
      return
    }

    setIsLoadingSystemGames(true)
    setSelectedSystemCategory(normalizedCategory)
    setSelectedSystemGame(null)
    setSystemGames([])
    setSystemGamePool([])
    setSystemGameIndex(0)
    setOpenCategory(normalizedCategory)
    setPlayState(initialPlayState)
    setCommittedGuessSuggestion('')
    setGuessSuggestions([])
    setSelectionMessage('')
    setLoadingMessage(`Loading ${normalizedCategory} games...`)

    try {
      const response = await fetch(
        `${SYSTEM_ALL_GAMES_URL}?category=${encodeURIComponent(normalizedCategory)}`,
      )

      if (!response.ok) {
        throw new Error('Game list could not be fetched.')
      }

      const payload = await response.json()
      const rawGames = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.games)
          ? payload.games
          : Array.isArray(payload)
            ? payload
            : []

      const normalizedGames = rawGames
        .map((record) => normalizeSystemGameSummary(record, normalizedCategory))
        .filter(Boolean)

      setSystemGames(normalizedGames)
      setSelectionMessage(
        normalizedGames.length
          ? `Choose a game in "${normalizedCategory}".`
          : `No games are available in "${normalizedCategory}" yet.`,
      )
      setLoadingMessage('')
    } catch {
      setSystemGames([])
      setSelectionMessage(`Games for "${normalizedCategory}" could not be loaded.`)
      setLoadingMessage('')
    } finally {
      setIsLoadingSystemGames(false)
    }
  }

  const startSystemGameFromList = async (gameName, sourceGame = null) => {
    const normalizedGame = `${gameName ?? ''}`.trim()

    if (!normalizedGame) {
      setSelectionMessage('Choose a game to start.')
      return
    }

    setIsLoadingSelectedGame(true)
    setSelectedSystemGame(sourceGame || systemGames.find((game) => game.name === normalizedGame) || null)
    setSelectedSystemCategory(sourceGame?.category || selectedSystemCategory)
    setSelectionMessage('')
    setLoadingMessage(`Loading ${normalizedGame}...`)

    try {
      const response = await fetch(`${SYSTEM_GAMES_URL}?game=${encodeURIComponent(normalizedGame)}`)

      if (!response.ok) {
        throw new Error('System games could not be fetched.')
      }

      const payload = await response.json()
      const normalizedGames = (Array.isArray(payload?.data) ? payload.data : [])
        .map((record) => normalizeGameRecord(record, 'system'))
        .filter(Boolean)

      if (!normalizedGames.length) {
        setSystemGamePool([])
        setSystemGameIndex(0)
        setPlayState(initialPlayState)
        setCommittedGuessSuggestion('')
        setGuessSuggestions([])
        setSelectionMessage(`No words are available in "${normalizedGame}" yet.`)
        setLoadingMessage('')
        return
      }

      setSystemGamePool(normalizedGames)
      setSystemGameIndex(0)
      const nextGame = normalizedGames[0]
      const sessionRecord = createSessionRecord(
        sourceGame || systemGames.find((game) => game.name === normalizedGame) || {
          name: normalizedGame,
          category: sourceGame?.category || selectedSystemCategory,
        },
        normalizedGames.length,
      )

      setPlayState({
        game: nextGame,
        guesses: ['', '', '', '', ''],
        currentAttempt: 0,
        finished: false,
        won: false,
        resultMessage: '',
      })
      setSessions((current) => [sessionRecord, ...current])
      setActiveSessionId(sessionRecord.id)
      setCommittedGuessSuggestion('')
      setGuessSuggestions([])
      setSelectionMessage(`Playing "${normalizedGame}".`)
      setLoadingMessage('')
    } catch {
      setSystemGamePool([])
      setSystemGameIndex(0)
      setPlayState(initialPlayState)
      setCommittedGuessSuggestion('')
      setGuessSuggestions([])
      setSelectionMessage(`Game "${normalizedGame}" could not be loaded.`)
      setLoadingMessage('')
    } finally {
      setIsLoadingSelectedGame(false)
    }
  }

  const loadNextGameInPool = async () => {
    if (!selectedSystemGame?.name) {
      setSelectionMessage('Choose a game to start.')
      return
    }

    const nextIndex = systemGameIndex + 1
    if (nextIndex < systemGamePool.length) {
      const nextGame = systemGamePool[nextIndex]
      setSystemGameIndex(nextIndex)
      setSessions((current) =>
        current.map((session) =>
          session.id === activeSessionId ? { ...session, currentEntry: nextIndex + 1 } : session,
        ),
      )
      setPlayState({
        game: nextGame,
        guesses: ['', '', '', '', ''],
        currentAttempt: 0,
        finished: false,
        won: false,
        resultMessage: '',
      })
      setCommittedGuessSuggestion('')
      setGuessSuggestions([])
      setSelectionMessage(`Playing "${selectedSystemGame.name}".`)
      return
    }

    await startSystemGameFromList(selectedSystemGame.name)
  }

  const openSystemGamePicker = () => {
    setPlayMode()
    setPlayState(initialPlayState)
    setCommittedGuessSuggestion('')
    setGuessSuggestions([])
    setSystemGames([])
    setSelectedSystemGame(null)
    setSystemGamePool([])
    setSystemGameIndex(0)
    setSelectionMessage(systemCategories.length ? 'Choose a category to start.' : '')
  }

  useEffect(() => {
    if (!openCategory) {
      return
    }

    loadSystemGamesForCategory(openCategory)
  }, [openCategory])

  useEffect(() => {
    if (hasHandledPlayShortcut || !nickname.trim()) {
      return
    }

    const shortcut = parsePlayShortcutPath()
    if (!shortcut) {
      setHasHandledPlayShortcut(true)
      return
    }

    setHasHandledPlayShortcut(true)
    setMode('play')
    setShowCreateForm(false)
    setReviewGame(null)
    setReviewEntries([])
    setReviewMessage('')
    setIsReviewApproved(false)
    setSelectedSystemCategory(shortcut.category)
    setSelectedSystemGame({
      id: `${shortcut.category}-${shortcut.game}`,
      name: shortcut.game,
      category: shortcut.category,
      createdBy: '',
    })
    startSystemGameFromList(shortcut.game, {
      id: `${shortcut.category}-${shortcut.game}`,
      name: shortcut.game,
      category: shortcut.category,
      createdBy: '',
    })
  }, [hasHandledPlayShortcut, nickname])

  const updateGuess = (event) => {
    const nextValue = event.target.value
    setCommittedGuessSuggestion('')

    setPlayState((current) => {
      const guesses = [...current.guesses]
      guesses[current.currentAttempt] = nextValue
      return { ...current, guesses }
    })
  }

  const applyGuessSuggestion = (suggestion) => {
    setCommittedGuessSuggestion(suggestion.trim())
    setPlayState((current) => {
      const guesses = [...current.guesses]
      guesses[current.currentAttempt] = suggestion
      return { ...current, guesses }
    })
    setGuessSuggestions([])
  }

  const submitGuess = (event) => {
    event.preventDefault()

    if (!playState.game || playState.finished) {
      return
    }

    const guess = playState.guesses[playState.currentAttempt].trim()
    if (!guess) {
      setPlayState((current) => ({ ...current, resultMessage: 'Enter a guess before checking it.' }))
      return
    }

    setGuessSuggestions([])
    setCommittedGuessSuggestion('')

    const isCorrect = guess.toLowerCase() === playState.game.word.toLowerCase()

    if (isCorrect) {
      const points = Math.max(6 - (playState.currentAttempt + 1), 0)
      setSessions((current) =>
        current.map((session) => {
          if (session.id !== activeSessionId || session.solvedEntryIds.includes(playState.game.id)) {
            return session
          }

          return {
            ...session,
            solved: session.solved + 1,
            totalPoints: session.totalPoints + points,
            solvedEntryIds: [...session.solvedEntryIds, playState.game.id],
          }
        }),
      )
      setPlayState((current) => ({
        ...current,
        finished: true,
        won: true,
        resultMessage: `Correct. The answer is "${current.game.word}".`,
      }))
      return
    }

    if (playState.currentAttempt === 4) {
      setPlayState((current) => ({
        ...current,
        finished: true,
        won: false,
        resultMessage: `No more tries left. The answer was "${current.game.word}".`,
      }))
      return
    }

    setPlayState((current) => ({
      ...current,
      currentAttempt: current.currentAttempt + 1,
      resultMessage: `Wrong guess. Hint ${current.currentAttempt + 2} is now available.`,
    }))
  }

  if (!nickname) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.28),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-600">Five hints</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Choose a nickname</h1>
          <p className="mt-4 text-base text-slate-600">
            This nickname is stored in local browser storage and reused on the next visit.
          </p>

          <form className="mt-8 space-y-4" onSubmit={saveNickname}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Nickname</span>
              <input
                autoFocus
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none ring-0 transition focus:border-amber-500"
                value={nicknameInput}
                onChange={(event) => setNicknameInput(event.target.value)}
                placeholder="Player name"
              />
            </label>
            <button className={`${accentButtonClass} w-full`} type="submit">
              Continue
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_24%),radial-gradient(circle_at_right,_rgba(59,130,246,0.18),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-900/10">
          <div className="flex flex-col gap-3 bg-[#0c4863] px-4 py-4 text-white sm:px-5">
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <h2 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">Guess, you have 5 clues !!</h2>
              </div>
              <button
                className="ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/35 bg-white/10 text-sm font-black tracking-wide text-white"
                type="button"
                onClick={() => setShowProfilePanel((current) => !current)}
              >
                {profileInitials}
              </button>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-3 lg:flex-nowrap">
              <select className={`${selectClass} border-white/20 bg-white text-slate-900`} value={mode} onChange={handleModeChange}>
                <option value="create">Create</option>
                <option value="play">Play</option>
              </select>
              {mode === 'create' ? (
                <button
                  className={showCreateForm ? activeButtonClass : accentButtonClass}
                  type="button"
                  onClick={() => setShowCreateForm((current) => !current)}
                >
                  New
                </button>
              ) : null}
              <div className="hidden flex-1 lg:block" />
            </div>
          </div>

          {showProfilePanel && (
            <div className="bg-[#ffb53a] px-4 py-4 sm:px-5">
              <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={saveNickname}>
                <label className="min-w-0 flex-1">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-800/80">
                    Nickname
                  </span>
                  <input
                    className="w-full rounded-full border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-700"
                    value={nicknameInput}
                    onChange={(event) => setNicknameInput(event.target.value)}
                  />
                </label>
                <div className="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700">
                  {nickname}
                </div>
                <button className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-slate-50" type="submit">
                  Save
                </button>
              </form>

              <div className="mt-4 rounded-[1.5rem] bg-white/75 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Sessions</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">{sessions.length}</span>
                </div>
                {sessions.length ? (
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    {sessions.map((session) => (
                      <article className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700" key={session.id}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-slate-950">{session.gameName}</h3>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              {session.category || 'Category'}
                            </p>
                          </div>
                          {session.id === activeSessionId ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Active</span>
                          ) : null}
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl bg-slate-50 px-2 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Entries</p>
                            <p className="mt-1 font-bold text-slate-900">{session.totalEntries}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-2 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Solved</p>
                            <p className="mt-1 font-bold text-slate-900">{session.solved}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-2 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Points</p>
                            <p className="mt-1 font-bold text-slate-900">{session.totalPoints}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-slate-600">No sessions yet.</p>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-6">
          {mode === 'create' ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Create mode</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Your saved games</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Create, review, and play the 5-hint games attached to your nickname.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className={idleButtonClass} disabled={isLoadingUserApiGames} type="button" onClick={loadUserCreatedGames}>
                    {isLoadingUserApiGames ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                    {visibleCreatedGames.length} saved
                  </div>
                </div>
              </div>

              {showCreateForm && (
                <form className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5" onSubmit={submitCreatedGame}>
                  {!createJob ? (
                  <div className="grid gap-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Game name</span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                        value={createForm.gameName}
                        onChange={handleCreateChange('gameName')}
                        placeholder="Example: Greatest Classic Rock Hits"
                      />
                    </label>

                    <div className="flex flex-wrap gap-3">
                      <button
                        className={createForm.categoryMode === 'existing' ? accentButtonClass : idleButtonClass}
                        type="button"
                        onClick={() => setCreateForm((current) => ({ ...current, categoryMode: 'existing' }))}
                      >
                        Existing category
                      </button>
                      <button
                        className={createForm.categoryMode === 'new' ? accentButtonClass : idleButtonClass}
                        type="button"
                        onClick={() => setCreateForm((current) => ({ ...current, categoryMode: 'new' }))}
                      >
                        New category
                      </button>
                    </div>

                    {createForm.categoryMode === 'existing' ? (
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700">Category</span>
                        <select
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                          value={createForm.existingCategory}
                          onChange={handleCreateChange('existingCategory')}
                        >
                          {systemCategories.map((category) => (
                            <option key={category.name} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700">New category name</span>
                        <input
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                          value={createForm.newCategory}
                          onChange={handleCreateChange('newCategory')}
                          placeholder="Example: 90's Hip-Hop Classics"
                        />
                      </label>
                    )}

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <input
                        checked={createForm.autoApprove}
                        className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        onChange={handleCreateChange('autoApprove')}
                        type="checkbox"
                      />
                      <span className="text-sm font-semibold text-slate-700">Auto Approve</span>
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <input
                        checked={createForm.includeAudioHint}
                        className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        onChange={handleCreateChange('includeAudioHint')}
                        type="checkbox"
                      />
                      <span className="text-sm font-semibold text-slate-700">Include audio hint</span>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Number of words</span>
                      <input
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                        min="1"
                        step="1"
                        type="number"
                        value={createForm.numberOfWords}
                        onChange={handleCreateChange('numberOfWords')}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Game prompt</span>
                      <textarea
                        className="min-h-32 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                        value={createForm.gamePrompt}
                        onChange={handleCreateChange('gamePrompt')}
                        placeholder="Describe the overall style and feel of the generated game."
                      />
                    </label>

                    {createForm.includeAudioHint ? (
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700">Audio prompt</span>
                        <textarea
                          className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                          value={createForm.audioPrompt}
                          onChange={handleCreateChange('audioPrompt')}
                          placeholder="Describe the kind of audio clue or media object the generator should add."
                        />
                      </label>
                    ) : null}

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Title prompt</span>
                      <textarea
                        className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                        value={createForm.titlePrompt}
                        onChange={handleCreateChange('titlePrompt')}
                        placeholder="Guide how the title hint should sound."
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Clues prompt</span>
                      <textarea
                        className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                        value={createForm.cluesPrompt}
                        onChange={handleCreateChange('cluesPrompt')}
                        placeholder="Guide how the clues should progress."
                      />
                    </label>

                    {createForm.categoryMode === 'existing' && !systemCategories.length ? (
                      <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                        Categories are still loading. You can switch to <span className="font-semibold">New category</span> if needed.
                      </p>
                    ) : null}
                  </div>
                  ) : null}

                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Request preview</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Game name: <span className="font-semibold text-slate-900">{createForm.gameName.trim() || 'Enter a game name'}</span>
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Category:{' '}
                      <span className="font-semibold text-slate-900">
                        {createForm.categoryMode === 'new'
                          ? createForm.newCategory.trim() || 'New category'
                          : createForm.existingCategory || 'Pick a category'}
                      </span>
                    </p>
                    <>
                      <p className="mt-2 text-sm text-slate-600">
                        Auto Approve:{' '}
                        <span className="font-semibold text-slate-900">
                          {createForm.autoApprove ? 'Enabled' : 'Disabled'}
                        </span>
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Audio hint:{' '}
                        <span className="font-semibold text-slate-900">
                          {createForm.includeAudioHint ? 'Enabled' : 'Disabled'}
                        </span>
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Number of words: <span className="font-semibold text-slate-900">{createForm.numberOfWords || '1'}</span>
                      </p>
                      {createForm.gamePrompt.trim() ? (
                        <p className="mt-2 text-sm text-slate-600">
                          Game prompt: <span className="text-slate-900">{createForm.gamePrompt.trim()}</span>
                        </p>
                      ) : null}
                      {createForm.includeAudioHint && createForm.audioPrompt.trim() ? (
                        <p className="mt-2 text-sm text-slate-600">
                          Audio prompt: <span className="text-slate-900">{createForm.audioPrompt.trim()}</span>
                        </p>
                      ) : null}
                      {createForm.titlePrompt.trim() ? (
                        <p className="mt-2 text-sm text-slate-600">
                          Title prompt: <span className="text-slate-900">{createForm.titlePrompt.trim()}</span>
                        </p>
                      ) : null}
                      {createForm.cluesPrompt.trim() ? (
                        <p className="mt-2 text-sm text-slate-600">
                          Clues prompt: <span className="text-slate-900">{createForm.cluesPrompt.trim()}</span>
                        </p>
                      ) : null}
                    </>
                  </div>

                  {createJob ? (
                    <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Create job</p>
                          <h3 className="mt-2 text-lg font-bold text-slate-950">{createJob.game_name}</h3>
                        </div>
                        <button
                          className={`${buttonBaseClass} bg-[#0c4863] text-white shadow-lg shadow-slate-900/20 hover:bg-[#08364a] disabled:opacity-70`}
                          disabled={isRefreshingCreateJob}
                          type="button"
                          onClick={() => refreshCreateJobStatus()}
                        >
                          {isRefreshingCreateJob ? 'Refreshing...' : 'Refresh status'}
                        </button>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          <span className="font-semibold text-slate-900">Job ID:</span> {createJob.jobId}
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          <span className="font-semibold text-slate-900">Status:</span> {createJob.status}
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          <span className="font-semibold text-slate-900">Category:</span> {createJob.category}
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          <span className="font-semibold text-slate-900">Queued by:</span> {createJob.nick_name}
                        </div>
                      </div>
                    </section>
                  ) : null}

                  {!createJob ? (
                  <div className="flex flex-wrap gap-3">
                    <button className={accentButtonClass} disabled={isCreatingGame} type="submit">
                      {isCreatingGame ? 'Creating...' : 'Create game'}
                    </button>
                    <button
                      className={idleButtonClass}
                      type="button"
                      onClick={() => {
                        resetCreateForm()
                        setShowCreateForm(false)
                        setCreateMessage('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  ) : null}

                  {createMessage && (
                    <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                      {createMessage}
                    </p>
                  )}
                </form>
              )}

              {reviewGame ? (
                <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Review</p>
                        <h3 className="mt-2 text-xl font-black text-slate-950">{reviewGame.name}</h3>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Category</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{reviewGame.category || 'Category'}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Game name</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{reviewGame.name}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">User</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{reviewGame.userName || reviewGame.createdBy || nickname}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {isReviewApproved ? (
                          <button
                            className={accentButtonClass}
                            disabled={isLoadingSelectedGame}
                            type="button"
                            onClick={() => {
                              setMode('play')
                              startSystemGameFromList(reviewGame.name, {
                                ...reviewGame,
                                status: 'published',
                              })
                            }}
                          >
                            Play
                          </button>
                        ) : (
                          <button
                            className={accentButtonClass}
                            disabled={isLoadingReviewEntries || !reviewEntries.length || approvingEntryIds.length > 0}
                            type="button"
                            onClick={approveAllReviewEntries}
                          >
                            {approvingEntryIds.length === reviewEntries.length && reviewEntries.length ? 'Approving...' : 'Approve All'}
                          </button>
                        )}
                        <button
                          className={idleButtonClass}
                          type="button"
                          onClick={() => {
                            setReviewGame(null)
                            setReviewEntries([])
                            setReviewMessage('')
                            setIsReviewApproved(false)
                          }}
                        >
                          Back to games
                        </button>
                      </div>
                    </div>
                  </div>

                  {reviewMessage ? (
                    <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">{reviewMessage}</p>
                  ) : null}

                  {isLoadingReviewEntries ? (
                    <p className="mt-4 text-sm font-semibold text-slate-500">Loading entries...</p>
                  ) : reviewEntries.length ? (
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      {reviewEntries.map((entry, index) => {
                        const isApproving = approvingEntryIds.includes(index)
                        const entryId = entry?.id ?? `${reviewGame.id}-${index}`

                        return (
                          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm" key={entryId}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Entry</p>
                                <h4 className="mt-1 text-lg font-bold text-slate-950">{entry?.answer || entry?.title || `Entry ${index + 1}`}</h4>
                              </div>
                              <button
                                className={accentButtonClass}
                                disabled={isApproving}
                                type="button"
                                onClick={() => approveReviewEntry(entry, index)}
                              >
                                {isApproving ? 'Approving...' : 'Approve'}
                              </button>
                            </div>
                            <div className="mt-4">
                              <EditableJsonValue value={entry} onChange={(path, value) => updateReviewEntry(index, path, value)} />
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  ) : null}
                </section>
              ) : visibleCreatedGames.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {visibleCreatedGames.map((game) => {
                    const status = `${game.status ?? 'local'}`.toLowerCase()
                    const isPublished = status === 'published'
                    const isReviewable = !isPublished

                    return (
                    <article
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm"
                      key={game.id}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {game.name || game.title || (game.word ? `${game.word.length}-letter answer` : 'Saved game')}
                          </h3>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {game.category || 'Category'} by {game.userName || game.createdBy}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            aria-label={`Share ${game.name || game.title || 'game'}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:border-amber-300"
                            title="Share game"
                            type="button"
                            onClick={() => shareGameShortcut(game)}
                          >
                            <img src="/share.png" alt="" className="h-5 w-5 object-contain" />
                          </button>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-500">
                            {status}
                          </span>
                        </div>
                      </div>

                      {game.hints ? (
                        <ol className="mt-4 space-y-2 text-sm text-slate-600">
                          {game.hints.map((hint, index) => (
                            <li key={`${game.id}-${index}`} className="rounded-xl bg-white px-3 py-2">
                              <span className="mr-2 font-semibold text-slate-900">{index + 1}.</span>
                              {hint}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="mt-4 text-sm text-slate-600">
                          {isReviewable ? 'Review staged entries before publishing.' : 'Published games are ready to play.'}
                        </p>
                      )}

                      <div className="mt-5 flex flex-wrap gap-3">
                        {isPublished ? (
                          <button
                            className={accentButtonClass}
                            disabled={isLoadingSelectedGame}
                            type="button"
                            onClick={() => {
                              setMode('play')
                              startSystemGameFromList(game.name, game)
                            }}
                          >
                            Play
                          </button>
                        ) : null}
                        {isReviewable ? (
                          <button className={idleButtonClass} type="button" onClick={() => loadReviewEntries(game)}>
                            Review
                          </button>
                        ) : null}
                      </div>
                    </article>
                  )})}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                  <h3 className="text-xl font-bold text-slate-900">No saved games yet</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Click <span className="font-semibold text-slate-900">New</span> in the control panel to create your first entry.
                  </p>
                  {userApiGamesMessage ? <p className="mt-3 text-sm font-medium text-slate-500">{userApiGamesMessage}</p> : null}
                </div>
              )}
              {shareMessage ? (
                <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">{shareMessage}</p>
              ) : null}
            </div>
          ) : playState.game ? (
            <div className="play-stack">
              <div className="play-action-row flex w-full items-center gap-3">
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                  {selectedSystemCategory || playState.game.category || 'System'}
                </div>
                <div className="ml-auto flex items-center gap-3">
                  {audioEmbedUrl ? (
                    <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                      <img src="/speaker.png" alt="Audio" className="h-5 w-5" />
                      <span className="sr-only">Enable audio preview</span>
                    <button
                      aria-pressed={isAudioPreviewEnabled}
                      role="switch"
                      title="Audio preview"
                      className={`relative h-7 w-12 rounded-full transition ${
                        isAudioPreviewEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                        type="button"
                        onClick={() => setIsAudioPreviewEnabled((current) => !current)}
                      >
                        <span
                          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                            isAudioPreviewEnabled ? 'left-6' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  ) : null}
                  <button
                    className="category-picker-button"
                    type="button"
                    onClick={openSystemGamePicker}
                    aria-label="Choose another category"
                    title="Choose another category"
                  >
                    <img src="/category-picker.svg" alt="" className="h-6 w-6" />
                  </button>
                </div>
                <button
                  className={`${accentButtonClass} next-inline w-full sm:w-auto`}
                  disabled={!playState.game || isLoadingSelectedGame}
                  type="button"
                  onClick={loadNextGameInPool}
                >
                  Next
                </button>
              </div>

              {playState.game.title ? (
                <section className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Title</p>
                  <h2 className="mt-2 text-lg font-bold text-slate-950 sm:text-xl">{playState.game.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
                    <span>
                      Entry:{' '}
                      <span className="text-slate-900">
                        {activeSession?.currentEntry || systemGameIndex + 1}/{activeSession?.totalEntries || systemGamePool.length || 1}
                      </span>
                    </span>
                    <span>
                      Solved: <span className="text-slate-900">{activeSession?.solved ?? 0}</span>
                    </span>
                    <span>
                      Points: <span className="text-slate-900">{activeSession?.totalPoints ?? 0}</span>
                    </span>
                  </div>
                </section>
              ) : null}

              {audioEmbedUrl && isAudioPreviewEnabled ? (
                <div className="absolute h-0 w-0 overflow-hidden">
                  <iframe
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="pointer-events-none absolute h-px w-px opacity-0"
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    src={audioEmbedUrl}
                    title={`${playState.game.word} audio preview`}
                  />
                </div>
              ) : null}

              <div className="hints-grid grid gap-3 xl:grid-cols-5">
                {playState.game.hints.map((hint, index) => {
                  const isVisible = index < visibleHints.length
                  const isCurrent = !playState.finished && index === playState.currentAttempt
                  const isPast = playState.guesses[index].trim().length > 0
                  const isCorrect =
                    isPast && playState.guesses[index].trim().toLowerCase() === playState.game.word.toLowerCase()
                  const isExpanded = isCurrent

                  return (
                    <article
                      className={`flex flex-col rounded-[1.35rem] border p-3 shadow-sm transition ${
                        isExpanded
                          ? 'min-h-56 border-slate-900 bg-white shadow-lg shadow-slate-900/10'
                          : isVisible
                            ? 'min-h-20 border-slate-200 bg-white'
                            : 'min-h-20 border-slate-200/70 bg-slate-100/70 text-slate-400'
                      }`}
                      key={`${hint}-${index}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">{`Hint ${index + 1}`}</p>
                          <h3 className={`mt-1 font-bold ${isExpanded ? 'text-lg text-slate-950' : 'text-sm text-slate-700'}`}>
                            {isVisible ? hint : 'Locked'}
                          </h3>
                        </div>
                        {!isExpanded && isPast ? (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {isCorrect ? 'Correct' : 'Wrong'}
                          </span>
                        ) : null}
                      </div>

                        {isExpanded ? (
                          <form className="mt-auto space-y-2.5" onSubmit={submitGuess}>
                            <label className="block">
                              <div className="relative">
                                <input
                                  autoFocus
                                  className={inputClass}
                                  value={playState.guesses[index]}
                                  onChange={updateGuess}
                                  placeholder="Type your guess"
                                />

                                {(isLoadingGuessSuggestions || guessSuggestions.length > 0) && (
                                  <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-10 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-xl shadow-slate-900/10 backdrop-blur">
                                    {isLoadingGuessSuggestions ? (
                                      <p className="px-4 py-3 text-left text-sm text-slate-500">Looking up matching titles...</p>
                                    ) : (
                                      <div className="max-h-56 overflow-y-auto py-1">
                                        {guessSuggestions.map((suggestion) => (
                                          <button
                                            className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-amber-50 hover:text-slate-950"
                                            key={suggestion}
                                            type="button"
                                            onClick={() => applyGuessSuggestion(suggestion)}
                                          >
                                            {suggestion}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </label>
                            <button className={`${accentButtonClass} w-full py-2`} type="submit">
                              Check guess
                          </button>
                        </form>
                      ) : isPast ? (
                        <p className="mt-3 truncate rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          {playState.guesses[index]}
                        </p>
                      ) : (
                        <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-500">
                          {isVisible ? 'Waiting for your turn.' : 'Collapsed until active.'}
                        </p>
                      )}
                    </article>
                  )
                })}
              </div>


                  {(playState.resultMessage || selectionMessage) && (
                    <div
                      className={`rounded-[1.5rem] px-5 py-4 text-sm font-semibold ${
                        playState.finished
                          ? playState.won
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {playState.resultMessage || selectionMessage}
                    </div>
                  )}

                </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Play mode</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  Game panel
                </h2>

                {systemCategories.length ? (
                  <>
                    <div className="mt-8 grid gap-3 text-left">
                      {systemCategories.map((category) => {
                        const isActiveCategory = openCategory === category.name
                        const totalCount = category.games ?? Object.values(category.createdBy ?? {}).reduce((total, value) => {
                          const parsed = Number(value)
                          return Number.isFinite(parsed) ? total + parsed : total
                        }, 0)
                        const label = `${category.name}${totalCount ? ` (${totalCount})` : ''}`
                        return (
                          <div className={`category-panel ${isActiveCategory ? 'open' : ''}`} key={category.name}>
                            <button
                              className="category-panel-summary"
                              type="button"
                              onClick={() => {
                                if (isActiveCategory) {
                                  setOpenCategory('')
                                  return
                                }
                                loadSystemGamesForCategory(
                                  category.name,
                                )
                              }}
                            >
                              <span className="text-sm font-semibold text-slate-900">{label}</span>
                              <span className="category-panel-chevron" aria-hidden="true">
                                v
                              </span>
                            </button>
                            <div className={`category-panel-content ${isActiveCategory ? 'open' : ''}`}>
                              {isActiveCategory ? (
                                systemGames.length ? (
                                  <div className="grid gap-3">
                                    {Object.entries(
                                      systemGames.reduce((groups, game) => {
                                        const key = game.createdBy || 'System'
                                        if (!groups[key]) {
                                          groups[key] = []
                                        }
                                        groups[key].push(game)
                                        return groups
                                      }, {}),
                                    ).map(([owner, games]) => (
                                      <div className="category-owner-panel" key={owner}>
                                        <p className="category-owner-title">{owner || 'System'}</p>
                                        <div className="flex flex-wrap gap-3">
                                          {games.map((game) => (
                                            <div
                                              className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm"
                                              key={game.id}
                                            >
                                              <button
                                                className={`${selectedSystemGame?.name === game.name ? activeButtonClass : 'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-amber-50 hover:text-slate-950'} game-chip border-0 bg-transparent shadow-none`}
                                                disabled={isLoadingSelectedGame}
                                                type="button"
                                                onClick={() => startSystemGameFromList(game.name)}
                                                title={game.createdBy ? `Created by ${game.createdBy}` : undefined}
                                              >
                                                {game.name}
                                              </button>
                                              <button
                                                aria-label={`Share ${game.name}`}
                                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 transition hover:bg-amber-50"
                                                title="Share game"
                                                type="button"
                                                onClick={() => shareGameShortcut(game)}
                                              >
                                                <img src="/share.png" alt="" className="h-5 w-5 object-contain" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-500">
                                    {isLoadingSystemGames
                                      ? loadingMessage || 'Loading games...'
                                      : 'No games are available for this category yet.'}
                                  </p>
                                )
                              ) : (
                                <p className="text-sm text-slate-500">Expand to view games.</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <p className="mt-5 text-sm text-slate-500">
                      {isLoadingSystemGames
                        ? loadingMessage || 'Loading system games...'
                        : isLoadingSelectedGame
                          ? loadingMessage || 'Loading selected game...'
                          : selectionMessage || 'Select one of the available categories to begin.'}
                    </p>
                    {shareMessage ? (
                      <p className="mt-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">{shareMessage}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-6 text-sm font-medium text-slate-500">
                    {isLoadingCategories ? loadingMessage || 'Loading system categories...' : loadingMessage}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
        {playState.game ? (
          <div className="next-fab-portal">
            <button
              className="next-fab-image"
              disabled={!playState.game || isLoadingSelectedGame}
              type="button"
              aria-label="Next"
              title="Next"
              onClick={loadNextGameInPool}
            >
              <img src="/next.png" alt="" className="next-fab-icon" />
            </button>
          </div>
        ) : null}
      </div>
    </main>
  )
}

export default App
