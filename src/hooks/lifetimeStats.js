const STATS_KEY = 'five-hints.stats'
const GROUP_RECORDED_SESSIONS_KEY = 'five-hints.group-recorded-sessions'

const defaultStats = () => ({
  wordsSolved: 0,
  wordsAttempted: 0,
  totalPoints: 0,
  bestStreak: 0,
  groupGamesParticipated: 0,
  groupGamesWon: 0,
  groupRoundsSolved: 0,
  groupRoundsPlayed: 0,
})

export const readLifetimeStats = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATS_KEY) || '{}')
    return {
      wordsSolved: Number(parsed.wordsSolved) || 0,
      wordsAttempted: Number(parsed.wordsAttempted) || 0,
      totalPoints: Number(parsed.totalPoints) || 0,
      bestStreak: Number(parsed.bestStreak) || 0,
      groupGamesParticipated: Number(parsed.groupGamesParticipated) || 0,
      groupGamesWon: Number(parsed.groupGamesWon) || 0,
      groupRoundsSolved: Number(parsed.groupRoundsSolved) || 0,
      groupRoundsPlayed: Number(parsed.groupRoundsPlayed) || 0,
    }
  } catch {
    return defaultStats()
  }
}

export const writeLifetimeStats = (updater) => {
  try {
    const current = readLifetimeStats()
    const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater }
    localStorage.setItem(STATS_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage failures so gameplay can continue.
  }
}

const readRecordedGroupSessions = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(GROUP_RECORDED_SESSIONS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeRecordedGroupSessions = (sessionIds) => {
  try {
    localStorage.setItem(GROUP_RECORDED_SESSIONS_KEY, JSON.stringify(sessionIds))
  } catch {
    // Ignore storage failures so gameplay can continue.
  }
}

export const recordGroupSessionMetrics = (summary, nickname) => {
  const sessionId = `${summary?.sessionId ?? summary?.code ?? ''}`.trim()
  const playerName = `${nickname ?? ''}`.trim().toLowerCase()
  if (!sessionId || !playerName) return false

  const players = Array.isArray(summary?.players) ? summary.players : []
  const me = players.find((player) => `${player?.name ?? ''}`.trim().toLowerCase() === playerName)
  if (!me) return false

  const recorded = readRecordedGroupSessions()
  if (recorded.includes(sessionId)) return false

  const winners = Array.isArray(summary?.winners) ? summary.winners : []
  const wonGame = winners.some((winner) => `${winner?.name ?? ''}`.trim().toLowerCase() === playerName)
  const roundsPlayed = Number(summary?.totalEntries ?? summary?.entries ?? 0)
  const roundsSolved = Number(
    me?.solvedEntries
    ?? me?.entriesSolved
    ?? me?.correctEntries
    ?? me?.correctCount
    ?? 0
  )
  const points = Number(me?.score ?? me?.totalPoints ?? 0)

  writeLifetimeStats((stats) => ({
    ...stats,
    wordsSolved: stats.wordsSolved + (Number.isFinite(roundsSolved) ? roundsSolved : 0),
    wordsAttempted: stats.wordsAttempted + (Number.isFinite(roundsPlayed) ? roundsPlayed : 0),
    totalPoints: stats.totalPoints + (Number.isFinite(points) ? points : 0),
    groupGamesParticipated: stats.groupGamesParticipated + 1,
    groupGamesWon: stats.groupGamesWon + (wonGame ? 1 : 0),
    groupRoundsSolved: stats.groupRoundsSolved + (Number.isFinite(roundsSolved) ? roundsSolved : 0),
    groupRoundsPlayed: stats.groupRoundsPlayed + (Number.isFinite(roundsPlayed) ? roundsPlayed : 0),
  }))

  writeRecordedGroupSessions([...recorded, sessionId].slice(-100))
  return true
}
