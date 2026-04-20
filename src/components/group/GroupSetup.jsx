import { useState } from 'react'
import { createSession, joinSession } from '../../api/sessions'

export default function GroupSetup({ nickname, categories = [], onSessionCreated }) {
  const [tab, setTab] = useState('host')
  const [hostForm, setHostForm] = useState({ category: categories[0]?.name ?? '', game: '', entryCount: 20 })
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!hostForm.category || !hostForm.game) {
      setError('Choose a category and game name.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const session = await createSession(nickname, hostForm.category, hostForm.game, hostForm.entryCount)
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
                onChange={(e) => setHostForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-400"
              >
                {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.1em] text-slate-400 mb-1.5">Game</label>
              <input
                type="text"
                value={hostForm.game}
                onChange={(e) => setHostForm((f) => ({ ...f, game: e.target.value }))}
                placeholder="Game name"
                className="w-full border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.1em] text-slate-400 mb-1.5">Number of entries</label>
              <div className="flex gap-2">
                {[10, 20, 'All'].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setHostForm((f) => ({ ...f, entryCount: n === 'All' ? 0 : n }))}
                    className={`flex-1 py-2 rounded-[10px] text-sm font-bold transition-colors ${
                      (n === 'All' ? hostForm.entryCount === 0 : hostForm.entryCount === n)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
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
        )}
      </div>
    </div>
  )
}
