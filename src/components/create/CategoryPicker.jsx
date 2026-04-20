import { useState } from 'react'

const CATEGORY_ICONS = {
  Geography: '🌍', Music: '🎵', Movies: '🎬', Sports: '⚽', Science: '🔬',
  History: '📜', Animals: '🐾', Food: '🍕', Technology: '💻', Art: '🎨',
}

export default function CategoryPicker({ categories = [], selected, onSelect }) {
  const [showNewInput, setShowNewInput] = useState(false)
  const [newName, setNewName] = useState('')

  const handleNewSubmit = (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    onSelect(name)
    setNewName('')
    setShowNewInput(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.name}
            type="button"
            onClick={() => { onSelect(cat.name); setShowNewInput(false) }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] border text-sm font-semibold transition-colors ${
              selected === cat.name
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'
            }`}
          >
            <span>{CATEGORY_ICONS[cat.name] ?? '📁'}</span>
            {cat.name}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setShowNewInput(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-dashed border-slate-300 text-sm font-semibold text-slate-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
        >
          ＋ New category…
        </button>
      </div>

      {showNewInput && (
        <form onSubmit={handleNewSubmit} className="flex gap-2">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            className="flex-1 border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-4 py-2.5 rounded-[10px] transition-colors"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setShowNewInput(false); setNewName('') }}
            className="text-slate-400 hover:text-slate-600 px-2 font-bold"
          >
            ✕
          </button>
        </form>
      )}
    </div>
  )
}
