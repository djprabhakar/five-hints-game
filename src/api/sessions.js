const API_BASE_URL = 'https://enasollu.enasollu.xyz'

const req = async (method, path, body) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const createSession = (nickname, category, game, entryCount, gameCreatedBy) =>
  req('POST', '/api/sessions/create', { nickname, category, game, entryCount, gameCreatedBy })

export const joinSession = (code, nickname) =>
  req('POST', '/api/sessions/join', { code, nickname })

export const listSessions = () =>
  req('GET', '/api/sessions')

export const listHostedSessions = (nickname) =>
  req('GET', `/api/sessions?nickname=${encodeURIComponent(nickname)}&status=all`)

export const pollSession = (sessionId) =>
  req('GET', `/api/sessions/${encodeURIComponent(sessionId)}`)

export const startSession = (sessionId, nickname) =>
  req('POST', `/api/sessions/${encodeURIComponent(sessionId)}/start`, { nickname })

export const submitAnswer = (sessionId, nickname, entryIndex, answer, hintsUsed) =>
  req('POST', `/api/sessions/${encodeURIComponent(sessionId)}/submit`, { nickname, entryIndex, answer, hintsUsed })

export const advanceEntry = (sessionId, nickname) =>
  req('POST', `/api/sessions/${encodeURIComponent(sessionId)}/next`, { nickname })

export const finalizeSession = (sessionId, nickname) =>
  req('POST', `/api/sessions/${encodeURIComponent(sessionId)}/finalize`, { nickname })

export const deactivateSession = (sessionId, nickname) =>
  req('POST', `/api/sessions/${encodeURIComponent(sessionId)}/deactivate`, { nickname })

export const leaveSession = (sessionId, nickname) =>
  req('DELETE', `/api/sessions/${encodeURIComponent(sessionId)}/leave`, { nickname })
