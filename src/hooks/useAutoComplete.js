import { useState, useEffect, useRef } from 'react'

const API_BASE_URL = 'https://enasollu.enasollu.xyz'
const SUGGESTIONS_URL = `${API_BASE_URL}/api/words/Get5HintWordBeginningWith`
const DEBOUNCE_MS = 220
const MIN_PREFIX_LEN = 3

export function useAutoComplete({ prefix, category, gameName, createdBy, disabled }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  // Track the last prefix we committed so re-selecting a suggestion suppresses re-fetch
  const committedRef = useRef('')

  useEffect(() => {
    setSuggestions([])

    if (
      disabled ||
      !prefix ||
      prefix.length < MIN_PREFIX_LEN ||
      !category ||
      prefix.toLowerCase() === committedRef.current.toLowerCase()
    ) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const timerId = setTimeout(async () => {
      try {
        const url = `${SUGGESTIONS_URL}?category=${encodeURIComponent(category)}&game=${encodeURIComponent(gameName ?? '')}&createdby=${encodeURIComponent(createdBy ?? '')}&startsWith=${encodeURIComponent(prefix)}`
        const res = await fetch(url)
        if (!res.ok) throw new Error()
        const payload = await res.json()
        const words = Array.isArray(payload?.words)
          ? payload.words.map((w) => `${w ?? ''}`.trim()).filter(Boolean)
          : []
        if (!cancelled) setSuggestions(words)
      } catch {
        if (!cancelled) setSuggestions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timerId)
    }
  }, [prefix, category, gameName, createdBy, disabled])

  const commit = (word) => {
    committedRef.current = word
    setSuggestions([])
  }

  // Reset committed ref when the entry changes (new game/word)
  const reset = () => {
    committedRef.current = ''
    setSuggestions([])
  }

  return { suggestions, loading, commit, reset }
}
