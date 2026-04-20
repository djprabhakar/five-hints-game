import { useState, useMemo, useCallback } from 'react'

// ── Lifetime stats persistence ─────────────────────────────────────────────
const STATS_KEY = 'five-hints.stats'

export const readLifetimeStats = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATS_KEY) || '{}')
    return {
      wordsSolved:    Number(parsed.wordsSolved)    || 0,
      wordsAttempted: Number(parsed.wordsAttempted) || 0,
      totalPoints:    Number(parsed.totalPoints)    || 0,
      bestStreak:     Number(parsed.bestStreak)     || 0,
    }
  } catch {
    return { wordsSolved: 0, wordsAttempted: 0, totalPoints: 0, bestStreak: 0 }
  }
}

const writeLifetimeStats = (updater) => {
  try {
    const current = readLifetimeStats()
    const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater }
    localStorage.setItem(STATS_KEY, JSON.stringify(next))
  } catch {}
}
// ──────────────────────────────────────────────────────────────────────────

const initialEntryState = () => ({
  game: null,
  guesses: ['', '', '', '', ''],
  currentAttempt: 0,
  finished: false,
  won: false,
  lastWrongGuess: '',
})

const createSessionRecord = (gameSummary, totalEntries) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  gameName: gameSummary?.name || 'Game',
  category: gameSummary?.category || '',
  totalEntries,
  currentEntry: totalEntries ? 1 : 0,
  solved: 0,
  totalPoints: 0,
  streak: 0,
  solvedEntryIds: [],
  startedAt: new Date().toISOString(),
})

export function useGameSession() {
  const [pool, setPool] = useState([])
  const [poolIndex, setPoolIndex] = useState(0)
  const [gameSummary, setGameSummary] = useState(null)
  const [session, setSession] = useState(null)
  const [entry, setEntry] = useState(initialEntryState())
  const [inputValue, setInputValue] = useState('')

  const activeHintIndex = entry.game
    ? entry.finished
      ? entry.won
        ? entry.currentAttempt
        : 4
      : entry.currentAttempt
    : -1

  const pointsForAttempt = (attempt) => Math.max(5 - attempt, 1)

  const startPool = useCallback((games, summary) => {
    if (!games.length) return
    const sessionRecord = createSessionRecord(summary, games.length)
    setPool(games)
    setPoolIndex(0)
    setGameSummary(summary)
    setSession(sessionRecord)
    setEntry({
      ...initialEntryState(),
      game: games[0],
    })
    setInputValue('')
  }, [])

  const submitGuess = useCallback(() => {
    if (!entry.game || entry.finished) return

    const guess = inputValue.trim()
    if (!guess) return

    const isCorrect = guess.toLowerCase() === entry.game.word.toLowerCase()

    if (isCorrect) {
      const pts = pointsForAttempt(entry.currentAttempt)
      setEntry((prev) => ({ ...prev, finished: true, won: true, lastWrongGuess: '' }))
      setSession((prev) => {
        if (!prev) return prev
        const newStreak = prev.streak + 1
        writeLifetimeStats((s) => ({
          wordsSolved:    s.wordsSolved + 1,
          wordsAttempted: s.wordsAttempted + 1,
          totalPoints:    s.totalPoints + pts,
          bestStreak:     Math.max(s.bestStreak, newStreak),
        }))
        return {
          ...prev,
          solved: prev.solved + 1,
          totalPoints: prev.totalPoints + pts,
          streak: newStreak,
          solvedEntryIds: [...prev.solvedEntryIds, entry.game.id],
        }
      })
      setInputValue('')
      return
    }

    const newGuesses = [...entry.guesses]
    newGuesses[entry.currentAttempt] = guess

    if (entry.currentAttempt === 4) {
      setEntry((prev) => ({
        ...prev,
        guesses: newGuesses,
        finished: true,
        won: false,
        lastWrongGuess: guess,
      }))
      setSession((prev) => {
        if (!prev) return prev
        writeLifetimeStats((s) => ({
          ...s,
          wordsAttempted: s.wordsAttempted + 1,
        }))
        return { ...prev, streak: 0 }
      })
    } else {
      setEntry((prev) => ({
        ...prev,
        guesses: newGuesses,
        currentAttempt: prev.currentAttempt + 1,
        lastWrongGuess: guess,
      }))
    }
    setInputValue('')
  }, [entry, inputValue])

  const revealNextHint = useCallback(() => {
    if (!entry.game || entry.finished || entry.currentAttempt >= 4) return
    setEntry((prev) => ({ ...prev, currentAttempt: prev.currentAttempt + 1 }))
  }, [entry])

  const nextEntry = useCallback(() => {
    const nextIndex = poolIndex + 1
    if (nextIndex < pool.length) {
      setPoolIndex(nextIndex)
      setSession((prev) => prev ? { ...prev, currentEntry: nextIndex + 1 } : prev)
      setEntry({ ...initialEntryState(), game: pool[nextIndex] })
      setInputValue('')
    }
  }, [pool, poolIndex])

  const breadcrumbs = useMemo(() => {
    if (!gameSummary) return []
    return [
      { label: 'All Games', onClick: null },
      { label: gameSummary.category || 'Game', onClick: null },
      { label: gameSummary.name, onClick: null },
    ]
  }, [gameSummary])

  return {
    entry,
    session,
    gameSummary,
    pool,
    poolIndex,
    activeHintIndex,
    inputValue,
    setInputValue,
    startPool,
    submitGuess,
    revealNextHint,
    nextEntry,
    breadcrumbs,
    hasMore: poolIndex + 1 < pool.length,
  }
}
