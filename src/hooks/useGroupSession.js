import { useState, useEffect, useCallback, useRef } from 'react'
import { pollSession, startSession, submitAnswer, advanceEntry, finalizeSession, leaveSession } from '../api/sessions'
import { recordGroupSessionMetrics } from './lifetimeStats'

const POLL_MS = 2500

export function useGroupSession(initialSession, nickname) {
  const [session, setSession] = useState(initialSession)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [summary, setSummary] = useState(null)
  const pollRef = useRef(null)
  const recordedSummaryRef = useRef('')
  const activeSession = session ?? initialSession ?? null

  useEffect(() => {
    const summarySessionId = `${summary?.sessionId ?? summary?.code ?? ''}`.trim()
    if (!summarySessionId || recordedSummaryRef.current === summarySessionId) return
    recordGroupSessionMetrics(summary, nickname)
    recordedSummaryRef.current = summarySessionId
  }, [summary, nickname])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const poll = useCallback(async () => {
    if (!activeSession?.sessionId) return
    try {
      const data = await pollSession(activeSession.sessionId)
      setSession(data)
      if (data.status === 'finished') stopPolling()
    } catch (e) {
      setError(e.message)
    }
  }, [activeSession?.sessionId, stopPolling])

  useEffect(() => {
    if (!activeSession?.sessionId) return
    poll()
    pollRef.current = setInterval(poll, POLL_MS)
    return stopPolling
  }, [activeSession?.sessionId, poll, stopPolling])

  const submit = useCallback(async (entryIndex, answer, hintsUsed) => {
    if (!activeSession?.sessionId) return
    try {
      const data = await submitAnswer(activeSession.sessionId, nickname, entryIndex, answer, hintsUsed)
      setSession(data)
      return data
    } catch (e) {
      setError(e.message)
      return null
    }
  }, [activeSession?.sessionId, nickname])

  const start = useCallback(async () => {
    if (!activeSession?.sessionId) return null
    setStarting(true)
    setError('')
    try {
      const data = await startSession(activeSession.sessionId, nickname)
      setSession(data)
      return data
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setStarting(false)
    }
  }, [activeSession?.sessionId, nickname])

  const advance = useCallback(async () => {
    if (!activeSession?.sessionId) return
    try {
      const data = await advanceEntry(activeSession.sessionId, nickname)
      setSession(data)
      return data
    } catch (e) {
      setError(e.message)
      return null
    }
  }, [activeSession?.sessionId, nickname])

  const leave = useCallback(async () => {
    stopPolling()
    if (!activeSession?.sessionId) return
    try {
      await leaveSession(activeSession.sessionId, nickname)
    } catch {
      // best-effort
    }
    setSession(null)
    setSummary(null)
  }, [activeSession?.sessionId, nickname, stopPolling])

  const finalize = useCallback(async () => {
    if (!activeSession?.sessionId) return null
    try {
      const data = await finalizeSession(activeSession.sessionId, nickname)
      setSummary(data)
      return data
    } catch (e) {
      setError(e.message)
      return null
    }
  }, [activeSession?.sessionId, nickname])

  const myPlayer = activeSession?.players?.find((p) => p.name === nickname) ?? null
  const revealReady = activeSession?.revealReady ?? false
  const allSubmitted = activeSession?.players?.every((p) => p.submitted) ?? false

  return { session: activeSession, myPlayer, revealReady, allSubmitted, error, starting, summary, start, submit, advance, finalize, leave }
}
