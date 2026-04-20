import { useState, useEffect, useCallback, useRef } from 'react'
import { pollSession, submitAnswer, advanceEntry, leaveSession } from '../api/sessions'

const POLL_MS = 2500

export function useGroupSession(initialSession, nickname) {
  const [session, setSession] = useState(initialSession)
  const [error, setError] = useState('')
  const pollRef = useRef(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const poll = useCallback(async () => {
    if (!session?.sessionId) return
    try {
      const data = await pollSession(session.sessionId)
      setSession(data)
      if (data.status === 'finished') stopPolling()
    } catch (e) {
      setError(e.message)
    }
  }, [session?.sessionId, stopPolling])

  useEffect(() => {
    if (!session?.sessionId) return
    poll()
    pollRef.current = setInterval(poll, POLL_MS)
    return stopPolling
  }, [session?.sessionId])

  const submit = useCallback(async (entryIndex, answer, hintsUsed) => {
    if (!session?.sessionId) return
    try {
      await submitAnswer(session.sessionId, entryIndex, answer, hintsUsed)
    } catch (e) {
      setError(e.message)
    }
  }, [session?.sessionId])

  const advance = useCallback(async () => {
    if (!session?.sessionId) return
    try {
      await advanceEntry(session.sessionId)
    } catch (e) {
      setError(e.message)
    }
  }, [session?.sessionId])

  const leave = useCallback(async () => {
    stopPolling()
    if (!session?.sessionId) return
    try {
      await leaveSession(session.sessionId, nickname)
    } catch {
      // best-effort
    }
    setSession(null)
  }, [session?.sessionId, nickname, stopPolling])

  const myPlayer = session?.players?.find((p) => p.name === nickname) ?? null
  const revealReady = session?.revealReady ?? false
  const allSubmitted = session?.players?.every((p) => p.submitted) ?? false

  return { session, myPlayer, revealReady, allSubmitted, error, submit, advance, leave }
}
