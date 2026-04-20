import { useState } from 'react'
import CategoryPicker from './CategoryPicker'

const ENTRY_COUNTS = [10, 20, 30, 50]
const EXAMPLE_PROMPTS = [
  'Identify the Animal', 'Identify the Actor', 'Guess the Country',
  'Name the Movie', 'Identify the Scientist',
]

export default function CreateForm({ categories = [], nickname, onSubmit, loading, error }) {
  const [form, setForm] = useState({
    prompt: '',
    gameName: '',
    entryCount: 20,
    category: categories[0]?.name ?? '',
    includeAudio: false,
    visibility: 'public',
    gamePrompt: '',
    titlePrompt: '',
    cluesPrompt: '',
    audioPrompt: '',
  })
  const [showAdvanced, setShowAdvanced] = useState(false)

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }))
  const setE = (field) => (e) => set(field)(e.target.type === 'checkbox' ? e.target.checked : e.target.value)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 1 */}
      <div className="bg-white border border-slate-200 rounded-[16px] p-5 space-y-4">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-[0.1em]">What & How many</h3>
        <div>
          <label className="block text-xs font-black uppercase tracking-[0.1em] text-slate-400 mb-1.5">
            What should players identify?
          </label>
          <input
            type="text"
            value={form.prompt}
            onChange={setE('prompt')}
            placeholder="e.g. Identify the Animal"
            className="w-full border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-400"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => set('prompt')(p)}
                className="text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-500 px-2.5 py-1 rounded-full transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-[0.1em] text-slate-400 mb-1.5">Game name</label>
          <input
            type="text"
            value={form.gameName}
            onChange={setE('gameName')}
            placeholder="Shown to players in the game picker"
            className="w-full border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-400"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-[0.1em] text-slate-400 mb-1.5">Number of entries</label>
          <div className="flex gap-2">
            {ENTRY_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => set('entryCount')(n)}
                className={`flex-1 py-2 rounded-[10px] text-sm font-bold transition-colors ${
                  form.entryCount === n ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="bg-white border border-slate-200 rounded-[16px] p-5 space-y-4">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-[0.1em]">Category</h3>
        <CategoryPicker categories={categories} selected={form.category} onSelect={set('category')} />
      </div>

      {/* Section 3 */}
      <div className="bg-white border border-slate-200 rounded-[16px] p-5 space-y-4">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-[0.1em]">Options</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.includeAudio} onChange={setE('includeAudio')} className="w-4 h-4 accent-emerald-500" />
          <span className="text-sm font-semibold text-slate-700">Include audio hint</span>
        </label>
        <div>
          <label className="block text-xs font-black uppercase tracking-[0.1em] text-slate-400 mb-1.5">Visibility</label>
          <div className="flex gap-2">
            {['public', 'private'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => set('visibility')(v)}
                className={`flex-1 py-2 rounded-[10px] text-sm font-bold capitalize transition-colors ${
                  form.visibility === v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced */}
      <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full px-5 py-3 flex items-center justify-between text-xs font-black uppercase tracking-[0.1em] text-slate-400 hover:bg-slate-50 transition-colors"
        >
          <span>⚙ Advanced — customize AI prompts</span>
          <span>{showAdvanced ? '▲' : '▼'}</span>
        </button>
        {showAdvanced && (
          <div className="p-5 space-y-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Leave blank to use smart defaults</p>
            {[
              { field: 'gamePrompt', label: 'Game prompt' },
              { field: 'titlePrompt', label: 'Title prompt' },
              { field: 'cluesPrompt', label: 'Clues prompt' },
              ...(form.includeAudio ? [{ field: 'audioPrompt', label: 'Audio prompt' }] : []),
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="block text-xs font-black uppercase tracking-[0.1em] text-slate-400 mb-1.5">{label}</label>
                <textarea
                  value={form[field]}
                  onChange={setE(field)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-400 resize-y"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs font-semibold text-red-500 px-1">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-[12px] text-base transition-colors"
      >
        {loading ? 'Generating…' : '✨ Generate Game'}
      </button>
    </form>
  )
}
