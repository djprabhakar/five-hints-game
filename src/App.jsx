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

const emptyCreateForm = {
  categoryMode: 'existing',
  existingCategory: '',
  newCategory: '',
  gameName: '',
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

const buildYouTubeWatchUrl = (audio) => {
  if (!audio || audio.type !== 'youtube' || !audio.videoId) {
    return ''
  }

  const params = new URLSearchParams({ v: audio.videoId })

  if (audio.start > 0) {
    params.set('t', `${audio.start}s`)
  }

  return `https://www.youtube.com/watch?${params.toString()}`
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

const buttonBaseClass =
  'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition duration-150'

const activeButtonClass = `${buttonBaseClass} bg-slate-900 text-white shadow-lg shadow-slate-900/20`
const idleButtonClass =
  `${buttonBaseClass} border border-slate-300 bg-white/70 text-slate-700 hover:border-slate-400 hover:bg-white`
const accentButtonClass =
  `${buttonBaseClass} bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 hover:bg-amber-400`
const selectClass =
  'rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-amber-500'
const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-amber-500'

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
  const [mode, setMode] = useState('play')
  const [playSelection, setPlaySelection] = useState('system')
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
  const [playState, setPlayState] = useState(initialPlayState)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isLoadingSystemGames, setIsLoadingSystemGames] = useState(false)
  const [isLoadingSelectedGame, setIsLoadingSelectedGame] = useState(false)
  const [guessSuggestions, setGuessSuggestions] = useState([])
  const [isLoadingGuessSuggestions, setIsLoadingGuessSuggestions] = useState(false)
  const [committedGuessSuggestion, setCommittedGuessSuggestion] = useState('')
  const [isAudioPreviewEnabled, setIsAudioPreviewEnabled] = useState(false)

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
          ? payload.categories.map((category) => `${category ?? ''}`.trim()).filter(Boolean)
          : []

        setSystemCategories(nextCategories)
        setSelectedSystemCategory((current) => current || nextCategories[0] || '')
        setCreateForm((current) => ({
          ...current,
          existingCategory: current.existingCategory || nextCategories[0] || '',
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
    setIsAudioPreviewEnabled(false)
  }, [playState.game?.id])

  const userCreatedGames = useMemo(
    () => createdGames.filter((game) => game.createdBy.toLowerCase() === nickname.trim().toLowerCase()),
    [createdGames, nickname],
  )

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
  const activeGuess = playState.game ? playState.guesses[playState.currentAttempt] ?? '' : ''
  const audioEmbedUrl = useMemo(() => buildYouTubeEmbedUrl(playState.game?.audio), [playState.game?.audio])
  const audioWatchUrl = useMemo(() => buildYouTubeWatchUrl(playState.game?.audio), [playState.game?.audio])

  useEffect(() => {
    if (!playState.game || playState.finished || (playSelection !== 'system' && playSelection !== 'user')) {
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
          selectedSystemGame?.createdBy || (playSelection === 'user' ? 'user' : 'system'),
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
    playSelection,
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
    setPlayState(initialPlayState)
  }

  const setPlayMode = () => {
    setMode('play')
    setShowCreateForm(false)
    setCreateMessage('')
    setSelectionMessage('')
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

  const resetCreateForm = () => {
    setCreateForm({
      ...emptyCreateForm,
      existingCategory: systemCategories[0] || '',
    })
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
      setSystemCategories((current) => (current.includes(category) ? current : [...current, category]))
      setCreateMessage(`Job ${parsed.jobId} queued. Use refresh to check status.`)
    } catch (error) {
      setCreateMessage(error instanceof Error ? error.message : 'The game could not be created.')
    } finally {
      setIsCreatingGame(false)
    }
  }

  const loadSystemGamesForCategory = async (category, createdByOverride) => {
    const normalizedCategory = `${category ?? ''}`.trim()

    if (!normalizedCategory) {
      setSelectionMessage('Choose a category to start a system game.')
      return
    }

    const createdBy = `${createdByOverride ?? ''}`.trim()

    setIsLoadingSystemGames(true)
    setSelectedSystemCategory(normalizedCategory)
    setSelectedSystemGame(null)
    setSystemGames([])
    setSystemGamePool([])
    setSystemGameIndex(0)
    setPlayState(initialPlayState)
    setCommittedGuessSuggestion('')
    setGuessSuggestions([])
    setSelectionMessage('')
    setLoadingMessage(`Loading ${normalizedCategory} games...`)

    try {
      const response = await fetch(
        `${SYSTEM_ALL_GAMES_URL}?category=${encodeURIComponent(normalizedCategory)}&createdby=${encodeURIComponent(createdBy)}`,
      )

      if (!response.ok) {
        throw new Error('System game list could not be fetched.')
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
      setSelectionMessage(`System games for "${normalizedCategory}" could not be loaded.`)
      setLoadingMessage('')
    } finally {
      setIsLoadingSystemGames(false)
    }
  }

  const startSystemGameFromList = async (gameName) => {
    const normalizedGame = `${gameName ?? ''}`.trim()

    if (!normalizedGame) {
      setSelectionMessage('Choose a game to start.')
      return
    }

    setIsLoadingSelectedGame(true)
    setSelectedSystemGame(systemGames.find((game) => game.name === normalizedGame) || null)
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
      setSelectionMessage(`Playing "${normalizedGame}".`)
      setLoadingMessage('')
    } catch {
      setSystemGamePool([])
      setSystemGameIndex(0)
      setPlayState(initialPlayState)
      setCommittedGuessSuggestion('')
      setGuessSuggestions([])
      setSelectionMessage(`System game "${normalizedGame}" could not be loaded.`)
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
    setPlaySelection('system')
    setPlayState(initialPlayState)
    setCommittedGuessSuggestion('')
    setGuessSuggestions([])
    setSystemGames([])
    setSelectedSystemGame(null)
    setSystemGamePool([])
    setSystemGameIndex(0)
    setSelectionMessage(systemCategories.length ? 'Choose a category to start.' : '')
  }

  const showUserPlayPlaceholder = () => {
    setPlayMode()
    setPlaySelection('user')
    setPlayState(initialPlayState)
    setCommittedGuessSuggestion('')
    setGuessSuggestions([])
    setSystemGames([])
    setSelectedSystemGame(null)
    setSystemGamePool([])
    setSystemGameIndex(0)
    setSelectionMessage(systemCategories.length ? 'Choose a category to start.' : '')
  }

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
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg text-white">
                ≡
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-amber-300">Pick modes</p>
                <h1 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">Five hints control panel</h1>
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
              ) : (
                <>
                    <button
                      className={playSelection === 'system' ? accentButtonClass : idleButtonClass}
                      type="button"
                      onClick={openSystemGamePicker}
                    >
                      System
                    </button>
                  <button
                    className={playSelection === 'user' ? activeButtonClass : idleButtonClass}
                    type="button"
                    onClick={showUserPlayPlaceholder}
                  >
                    User
                  </button>
                </>
              )}
              <div className="hidden flex-1 lg:block" />
            </div>
          </div>

          {showProfilePanel && (
            <form className="flex flex-col gap-3 bg-[#ffb53a] px-4 py-4 sm:flex-row sm:items-end sm:px-5" onSubmit={saveNickname}>
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
                    Generate a new 5-hint game into an existing or brand-new category, then keep the created entry in browser storage.
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                  {userCreatedGames.length} saved
                </div>
              </div>

              {showCreateForm && (
                <form className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5" onSubmit={submitCreatedGame}>
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
                            <option key={category} value={category}>
                              {category}
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
                        <button className={idleButtonClass} disabled={isRefreshingCreateJob} type="button" onClick={() => refreshCreateJobStatus()}>
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

                  {createMessage && (
                    <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                      {createMessage}
                    </p>
                  )}
                </form>
              )}

              {userCreatedGames.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {userCreatedGames.map((game) => (
                    <article
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm"
                      key={game.id}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {game.title || game.word.length ? `${game.word.length}-letter answer` : 'Saved game'}
                          </h3>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Created by {game.createdBy}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                          local
                        </span>
                      </div>

                      <ol className="mt-4 space-y-2 text-sm text-slate-600">
                        {game.hints.map((hint, index) => (
                          <li key={`${game.id}-${index}`} className="rounded-xl bg-white px-3 py-2">
                            <span className="mr-2 font-semibold text-slate-900">{index + 1}.</span>
                            {hint}
                          </li>
                        ))}
                      </ol>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                  <h3 className="text-xl font-bold text-slate-900">No saved games yet</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Click <span className="font-semibold text-slate-900">New</span> in the control panel to create your first entry.
                  </p>
                </div>
              )}
            </div>
          ) : playState.game ? (
            <div className="space-y-4">
              {playState.game.title ? (
                <section className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Title</p>
                  <h2 className="mt-2 text-lg font-bold text-slate-950 sm:text-xl">{playState.game.title}</h2>
                </section>
              ) : null}

              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                  Category: {selectedSystemCategory || playState.game.category || 'System'}
                </div>
                {audioEmbedUrl ? (
                  <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                    <span>Audio preview</span>
                    <button
                      aria-pressed={isAudioPreviewEnabled}
                      role="switch"
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
                <button className={`${idleButtonClass} w-full sm:w-auto`} type="button" onClick={openSystemGamePicker}>
                  Choose another category
                </button>
                <button
                  className={`${accentButtonClass} w-full sm:w-auto`}
                  disabled={!playState.game || isLoadingSelectedGame}
                  type="button"
                  onClick={loadNextGameInPool}
                >
                  Next
                </button>
              </div>

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

              <div className="grid gap-3 xl:grid-cols-5">
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
                              <span className="mb-2 block text-sm font-semibold text-slate-700">Your guess</span>
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
                  {playSelection === 'user' ? 'User game panel' : 'System game panel'}
                </h2>
                <p className="mt-3 text-sm text-slate-600">
                  Choose a category, then pick a game to load its words.
                </p>

                {systemCategories.length ? (
                  <>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                      {systemCategories.map((category) => (
                        <button
                          className={selectedSystemCategory === category ? accentButtonClass : idleButtonClass}
                          disabled={isLoadingSystemGames || isLoadingSelectedGame}
                          key={category}
                          type="button"
                          onClick={() =>
                            loadSystemGamesForCategory(
                              category,
                              playSelection === 'user' ? 'user' : 'system',
                            )
                          }
                        >
                          {category}
                        </button>
                      ))}
                    </div>

                    {systemGames.length ? (
                      <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {systemGames.map((game) => (
                          <button
                            className={selectedSystemGame?.name === game.name ? accentButtonClass : idleButtonClass}
                            disabled={isLoadingSelectedGame}
                            key={game.id}
                            type="button"
                            onClick={() => startSystemGameFromList(game.name)}
                            title={game.createdBy ? `Created by ${game.createdBy}` : undefined}
                          >
                            {game.name}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <p className="mt-5 text-sm text-slate-500">
                      {isLoadingSystemGames
                        ? loadingMessage || 'Loading system games...'
                        : isLoadingSelectedGame
                          ? loadingMessage || 'Loading selected game...'
                          : selectionMessage || 'Select one of the available categories to begin.'}
                    </p>
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
      </div>
    </main>
  )
}

export default App
