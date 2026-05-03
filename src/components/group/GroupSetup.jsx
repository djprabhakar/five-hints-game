import { useEffect, useState } from 'react'
import { createSession, deactivateSession, joinSession, listHostedSessions, listSessions } from '../../api/sessions'

export default function GroupSetup({
  nickname,
  categories = [],
  selectedCategory = '',
  systemGames = [],
  onCategorySelect,
  onSessionCreated,
}) {
  const [tab, setTab] = useState('host')
  const [hostForm, setHostForm] = useState({ category: selectedCategory || (categories[0]?.name ?? ''), game: '' })
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [availableSessions, setAvailableSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] = useState('')
  const [hostedSessions, setHostedSessions] = useState([])
  const [hostedLoading, setHostedLoading] = useState(false)
  const [hostedError, setHostedError] = useState('')

  const loadAvailableSessions = async () => {
    setSessionsLoading(true)
    setSessionsError('')
    const payload = await listSessions()
    const rawSessions = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.sessions)
          ? payload.sessions
          : []

    const sessions = rawSessions
      .map((session) => {
        const code = `${session?.code ?? session?.sessionCode ?? ''}`.trim()
        if (!code) return null
        return {
          code,
          category: `${session?.category ?? session?.gameCategory ?? ''}`.trim(),
          game: `${session?.game ?? session?.gameName ?? session?.game_name ?? ''}`.trim(),
          hostName: `${session?.hostName ?? session?.createdBy ?? session?.nickname ?? ''}`.trim(),
          playerCount: Number(session?.playerCount ?? session?.players?.length ?? 0) || 0,
          status: `${session?.status ?? 'in_progress'}`.trim(),
        }
      })
      .filter(Boolean)

    setAvailableSessions(sessions)
    setSessionsLoading(false)
  }

  const loadHostedSessions = async () => {
    if (!nickname.trim()) return
    setHostedLoading(true)
    setHostedError('')
    try {
      const payload = await listHostedSessions(nickname)
      const rawSessions = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.sessions)
            ? payload.sessions
            : []

      const sessions = rawSessions
        .map((session) => {
          const sessionId = `${session?.sessionId ?? ''}`.trim()
          if (!sessionId) return null
          return {
            sessionId,
            code: `${session?.code ?? ''}`.trim(),
            category: `${session?.category ?? ''}`.trim(),
            game: `${session?.game ?? ''}`.trim(),
            hostName: `${session?.hostName ?? ''}`.trim(),
            status: `${session?.status ?? ''}`.trim(),
            active: session?.active !== false,
            playerCount: Number(session?.playerCount ?? 0) || 0,
            deactivatedAt: `${session?.deactivatedAt ?? ''}`.trim(),
          }
        })
        .filter(Boolean)

      setHostedSessions(sessions)
    } catch (err) {
      setHostedSessions([])
      setHostedError(err.message || 'Could not load hosted games.')
    } finally {
      setHostedLoading(false)
    }
  }

  useEffect(() => {
    const nextCategory = selectedCategory || categories[0]?.name || ''
    setHostForm((current) => {
      if (current.category === nextCategory) return current
      return { ...current, category: nextCategory, game: '' }
    })
  }, [categories, selectedCategory])

  useEffect(() => {
    if (!tab || tab !== 'host' || !hostForm.category) return
    onCategorySelect?.(hostForm.category)
  }, [hostForm.category, onCategorySelect, tab])

  useEffect(() => {
    setHostForm((current) => {
      if (!current.category) return current
      const matchingGame = systemGames.find((game) => game.name === current.game)
      if (matchingGame) return current
      return {
        ...current,
        game: systemGames[0]?.name ?? '',
      }
    })
  }, [systemGames])

  useEffect(() => {
    if (tab !== 'join') return

    let cancelled = false

    const loadSessions = async () => {
      try {
        await loadAvailableSessions()
      } catch (err) {
        if (!cancelled) {
          setAvailableSessions([])
          setSessionsError(err.message || 'Could not load active sessions.')
          setSessionsLoading(false)
        }
      }
    }

    loadSessions()
    return () => { cancelled = true }
  }, [tab])

  useEffect(() => {
    if (tab !== 'host') return

    let cancelled = false

    const loadHosted = async () => {
      try {
        await loadHostedSessions()
      } catch (err) {
        if (!cancelled) {
          setHostedSessions([])
          setHostedError(err.message || 'Could not load hosted games.')
          setHostedLoading(false)
        }
      }
    }

    loadHosted()
    return () => { cancelled = true }
  }, [tab, nickname])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!hostForm.category || !hostForm.game) {
      setError('Choose a category and game name.')
      return
    }

    const selectedGame = systemGames.find((game) => game.name === hostForm.game)
    const gameCreatedBy = `${selectedGame?.createdBy ?? 'System'}`.trim() || 'System'
    const requestedEntryCount = Number.isFinite(selectedGame?.entries) && selectedGame.entries > 0
      ? Math.min(20, selectedGame.entries)
      : 20

    setLoading(true)
    setError('')
    try {
      const session = await createSession(nickname, hostForm.category, hostForm.game, requestedEntryCount, gameCreatedBy)
      await loadHostedSessions()
      onSessionCreated(session)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    const code = joinCode.trim()
    if (code.length !== 4) {
      setError('Enter a 4-digit session code.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const session = await joinSession(code, nickname)
      onSessionCreated(session)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinListedSession = async (code) => {
    setJoinCode(code)
    setLoading(true)
    setError('')
    try {
      const session = await joinSession(code, nickname)
      onSessionCreated(session)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivateHostedSession = async (sessionId) => {
    setLoading(true)
    setError('')
    try {
      await deactivateSession(sessionId, nickname)
      await loadHostedSessions()
      await loadAvailableSessions()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full bg-white border border-slate-200 rounded-[16px] overflow-hidden" style={{ maxWidth: 'var(--max-w-lobby)' }}>
      <div className="flex border-b border-slate-200">
        {['host', 'join'].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError('') }}
            className={`flex-1 py-3 text-sm font-bold transition-colors capitalize ${
              tab === t ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t === 'host' ? 'Host a game' : 'Join a game'}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === 'host' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.1em] text-slate-400 mb-1.5">Category</label>
              <select
                value={hostForm.category}
                onChange={(e) => setHostForm((f) => ({ ...f, category: e.target.value, game: '' }))}
                className="w-full border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-400"
              >
                {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.1em] text-slate-400 mb-1.5">Game</label>
              <select
                value={hostForm.game}
                onChange={(e) => setHostForm((f) => ({ ...f, game: e.target.value }))}
                disabled={!systemGames.length}
                className="w-full border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-400"
              >
                <option value="">{systemGames.length ? 'Select a game' : 'No games available'}</option>
                {systemGames.map((game) => (
                  <option key={game.id} value={game.name}>{game.name}</option>
                ))}
              </select>
            </div>
            <div className="rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              Group sessions use up to 20 entries, or {hostForm.game ? 'the selected game\'s actual entry count if it has fewer.' : 'the full game if it has fewer than 20.'}
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">Hosted group games</p>
                <button
                  type="button"
                  onClick={loadHostedSessions}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                >
                  Refresh
                </button>
              </div>

              {hostedLoading && (
                <div className="rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                  Loading hosted games...
                </div>
              )}

              {hostedError && !hostedLoading && (
                <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {hostedError}
                </div>
              )}

              {!hostedLoading && !hostedError && !hostedSessions.length && (
                <div className="rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                  No hosted group games found.
                </div>
              )}

              {!hostedLoading && !hostedError && hostedSessions.length > 0 && (
                <div className="space-y-2">
                  {hostedSessions.map((session) => (
                    <div key={session.sessionId} className="rounded-[12px] border border-slate-200 bg-white px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black tracking-[0.18em] text-slate-900">{session.code || '----'}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full ${session.active ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-100'}`}>
                            {session.active ? session.status || 'Active' : 'Deactivated'}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-800 truncate">{session.game || 'Unknown game'}</div>
                        <div className="text-xs text-slate-500 truncate">
                          {session.category || 'Unknown category'}
                          {session.playerCount ? ` · ${session.playerCount} players` : ''}
                          {session.deactivatedAt ? ` · Deactivated` : ''}
                        </div>
                      </div>
                      {session.active && session.hostName.toLowerCase() === nickname.trim().toLowerCase() && (
                        <button
                          type="button"
                          onClick={() => handleDeactivateHostedSession(session.sessionId)}
                          disabled={loading}
                          className="flex-shrink-0 bg-white border border-red-200 hover:bg-red-50 disabled:opacity-50 text-red-600 text-sm font-bold px-4 py-2 rounded-[10px] transition-colors"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-[10px] transition-colors"
            >
              {loading ? 'Creating…' : 'Create Session →'}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.1em] text-slate-400 mb-1.5">Session code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                  className="w-full border-2 border-slate-200 rounded-[10px] px-4 py-4 text-3xl font-black text-center text-slate-900 tracking-[0.3em] outline-none focus:border-emerald-400"
                />
              </div>
              {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-[10px] transition-colors"
              >
                {loading ? 'Joining…' : 'Join →'}
              </button>
            </form>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">Games in progress</p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await loadAvailableSessions()
                    } catch (err) {
                      setAvailableSessions([])
                      setSessionsError(err.message || 'Could not load active sessions.')
                      setSessionsLoading(false)
                    }
                  }}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                >
                  Refresh
                </button>
              </div>

              {sessionsLoading && (
                <div className="rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                  Loading active sessions…
                </div>
              )}

              {sessionsError && !sessionsLoading && (
                <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {sessionsError}
                </div>
              )}

              {!sessionsLoading && !sessionsError && !availableSessions.length && (
                <div className="rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                  No active group games found.
                </div>
              )}

              {!sessionsLoading && !sessionsError && availableSessions.length > 0 && (
                <div className="space-y-2">
                  {availableSessions.map((session) => (
                    <div key={session.code} className="rounded-[12px] border border-slate-200 bg-white px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black tracking-[0.18em] text-slate-900">{session.code}</span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {session.status || 'In progress'}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-800 truncate">{session.game || 'Unknown game'}</div>
                        <div className="text-xs text-slate-500 truncate">
                          {session.category || 'Unknown category'}
                          {session.hostName ? ` · Host ${session.hostName}` : ''}
                          {session.playerCount ? ` · ${session.playerCount} players` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleJoinListedSession(session.code)}
                        disabled={loading}
                        className="flex-shrink-0 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-[10px] transition-colors"
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
