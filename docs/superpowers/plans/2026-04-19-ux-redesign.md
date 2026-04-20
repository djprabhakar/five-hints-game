# Five Hints UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the UI from a monolithic App.jsx into a clean component-based layout supporting solo play, group sessions (host+polling), and a simplified Create mode.

**Architecture:** Extract state into custom hooks (`useGameSession`, `useGroupSession`), build new components alongside existing code, then wire everything together in a thin App.jsx routing shell. Group play uses a polling model — client polls `/api/sessions/:id` every 2–3s; results reveal when `revealReady` is true.

**Tech Stack:** React 19, Tailwind CSS 4, Vite 8, Vitest + @testing-library/react (added in Task 1)

---

## File Map

**New files (create):**
- `src/tokens.css` — CSS custom properties for all design tokens
- `src/components/layout/AppHeader.jsx` — logo, breadcrumb, mode toggle, avatar
- `src/components/layout/Breadcrumb.jsx` — category/game nav with dropdown
- `src/components/shared/ModeToggle.jsx` — Solo|Group pill toggle
- `src/components/shared/Avatar.jsx` — initials avatar circle
- `src/components/gameplay/StatsRow.jsx` — Solved/Points/Streak pills
- `src/components/gameplay/ProgressBar.jsx` — entry progress bar
- `src/components/gameplay/HintRow.jsx` — single hint row, 5 visual states
- `src/components/gameplay/HintStack.jsx` — renders 5 HintRows
- `src/components/gameplay/InputCard.jsx` — guess input + attempt dots + reveal link
- `src/components/gameplay/WrongMessage.jsx` — inline wrong feedback
- `src/components/gameplay/CorrectState.jsx` — correct answer card + Next button
- `src/components/gameplay/PlayScreen.jsx` — solo gameplay screen assembly
- `src/hooks/useGameSession.js` — solo game state extracted from App.jsx
- `src/components/group/GroupSetup.jsx` — host/join tabs
- `src/components/group/Lobby.jsx` — session code, player list, start button
- `src/components/group/PlayerStrip.jsx` — player chips with status indicators
- `src/components/group/WaitingBanner.jsx` — "waiting for others" bar
- `src/components/group/EntryResults.jsx` — per-player results + running totals
- `src/hooks/useGroupSession.js` — session polling, submit, advance
- `src/api/sessions.js` — group session API client
- `src/components/create/CategoryPicker.jsx` — chip grid + inline new-category input
- `src/components/create/CreateForm.jsx` — 3-section form + advanced toggle
- `src/components/create/JobStatus.jsx` — step-progress view with auto-poll
- `src/components/create/ReviewEntries.jsx` — collapsible entry list + approve
- `src/components/create/MyGamesList.jsx` — created games list with status badges

**Modified files:**
- `package.json` — add vitest, @testing-library/react, @testing-library/user-event, jsdom, @vitest/coverage-v8
- `vite.config.js` — add vitest config block
- `src/index.css` — import tokens.css, update global styles
- `src/App.jsx` — replace internals with routing shell; preserve all API URLs and normalize helpers

---

## Task 1: Test framework + design tokens

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Create: `src/tokens.css`
- Modify: `src/index.css`

- [ ] **Install test dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @vitest/coverage-v8
```

- [ ] **Add vitest config to `vite.config.js`**

Read current `vite.config.js` first, then add the `test` block:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
  },
})
```

- [ ] **Create `src/test-setup.js`**

```js
import '@testing-library/jest-dom'
```

- [ ] **Create `src/tokens.css`**

```css
:root {
  --color-primary: #10b981;
  --color-primary-dark: #059669;
  --color-slate-900: #0f172a;
  --color-page-bg: #f8fafc;
  --color-card-bg: #ffffff;
  --color-border: #e2e8f0;
  --color-red: #ef4444;
  --color-amber: #f59e0b;

  --color-hint-active-bg: #f0fdf9;
  --color-hint-active-border: #6ee7b7;
  --color-hint-wrong-bg: #fff5f5;
  --color-hint-wrong-border: #fecaca;
  --color-hint-correct-bg: #f0fdf4;
  --color-hint-correct-border: #86efac;
  --color-hint-locked-bg: #f8fafc;
  --color-hint-locked-border: #f1f5f9;

  --radius-row: 10px;
  --radius-card: 12px;
  --radius-panel: 16px;
  --radius-pill: 999px;

  --shadow-active-input: 0 0 0 3px rgba(16,185,129,0.08);

  --max-w-solo: 680px;
  --max-w-group: 720px;
  --max-w-lobby: 560px;
}
```

- [ ] **Import tokens in `src/index.css`** (add as first line after existing `@import 'tailwindcss'`):

```css
@import './tokens.css';
```

- [ ] **Verify test runner works**

```bash
npx vitest run
```

Expected: "No test files found" (exit 0 — runner is wired up correctly)

- [ ] **Commit**

```bash
git add package.json vite.config.js src/test-setup.js src/tokens.css src/index.css
git commit -m "feat: add vitest + design tokens"
```

---

## Task 2: Shared components — Avatar + ModeToggle

**Files:**
- Create: `src/components/shared/Avatar.jsx`
- Create: `src/components/shared/ModeToggle.jsx`
- Create: `src/components/shared/__tests__/Avatar.test.jsx`
- Create: `src/components/shared/__tests__/ModeToggle.test.jsx`

- [ ] **Write failing tests**

`src/components/shared/__tests__/Avatar.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import Avatar from '../Avatar'

test('renders initials from nickname', () => {
  render(<Avatar nickname="Priya" />)
  expect(screen.getByText('PR')).toBeInTheDocument()
})

test('uses first two chars uppercased', () => {
  render(<Avatar nickname="raj" />)
  expect(screen.getByText('RA')).toBeInTheDocument()
})
```

`src/components/shared/__tests__/ModeToggle.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModeToggle from '../ModeToggle'

test('renders both mode labels', () => {
  render(<ModeToggle mode="solo" onChange={() => {}} />)
  expect(screen.getByText('Solo')).toBeInTheDocument()
  expect(screen.getByText('Group')).toBeInTheDocument()
})

test('calls onChange with new mode on click', async () => {
  const onChange = vi.fn()
  render(<ModeToggle mode="solo" onChange={onChange} />)
  await userEvent.click(screen.getByText('Group'))
  expect(onChange).toHaveBeenCalledWith('group')
})

test('active button has distinct styling class', () => {
  render(<ModeToggle mode="group" onChange={() => {}} />)
  expect(screen.getByText('Group').closest('button')).toHaveClass('bg-white')
})
```

- [ ] **Run tests — verify they fail**

```bash
npx vitest run src/components/shared/__tests__
```

Expected: FAIL — modules not found

- [ ] **Create `src/components/shared/Avatar.jsx`**

```jsx
export default function Avatar({ nickname = '' }) {
  const initials = nickname.slice(0, 2).toUpperCase() || '?'
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white cursor-pointer flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
    >
      {initials}
    </div>
  )
}
```

- [ ] **Create `src/components/shared/ModeToggle.jsx`**

```jsx
export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="flex bg-slate-100 rounded-lg p-1 gap-0.5">
      {['solo', 'group'].map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-3 py-1 rounded-md text-xs font-bold transition-all capitalize ${
            mode === m
              ? 'bg-white text-slate-900 shadow-sm'
              : 'bg-transparent text-slate-400'
          }`}
        >
          {m.charAt(0).toUpperCase() + m.slice(1)}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Run tests — verify they pass**

```bash
npx vitest run src/components/shared/__tests__
```

Expected: PASS (3 tests)

- [ ] **Commit**

```bash
git add src/components/shared/
git commit -m "feat: add Avatar and ModeToggle components"
```

---

## Task 3: Breadcrumb + AppHeader

**Files:**
- Create: `src/components/layout/Breadcrumb.jsx`
- Create: `src/components/layout/AppHeader.jsx`
- Create: `src/components/layout/__tests__/Breadcrumb.test.jsx`

- [ ] **Write failing tests**

`src/components/layout/__tests__/Breadcrumb.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Breadcrumb from '../Breadcrumb'

const crumbs = [
  { label: 'All Games', onClick: vi.fn() },
  { label: 'Geography', onClick: vi.fn() },
  { label: 'World Capitals', onClick: null },
]

test('renders all crumb labels', () => {
  render(<Breadcrumb crumbs={crumbs} />)
  expect(screen.getByText('All Games')).toBeInTheDocument()
  expect(screen.getByText('Geography')).toBeInTheDocument()
  expect(screen.getByText('World Capitals')).toBeInTheDocument()
})

test('calls onClick when clickable crumb is tapped', async () => {
  render(<Breadcrumb crumbs={crumbs} />)
  await userEvent.click(screen.getByText('All Games'))
  expect(crumbs[0].onClick).toHaveBeenCalled()
})

test('last crumb with null onClick is not a button', () => {
  render(<Breadcrumb crumbs={crumbs} />)
  const last = screen.getByText('World Capitals')
  expect(last.tagName).not.toBe('BUTTON')
})
```

- [ ] **Run — verify fail**

```bash
npx vitest run src/components/layout/__tests__/Breadcrumb.test.jsx
```

- [ ] **Create `src/components/layout/Breadcrumb.jsx`**

```jsx
export default function Breadcrumb({ crumbs = [] }) {
  return (
    <nav className="flex items-center gap-1 overflow-hidden flex-1">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-300 text-sm">›</span>}
          {crumb.onClick ? (
            <button
              onClick={crumb.onClick}
              className="text-sm font-semibold text-slate-400 hover:text-slate-900 hover:bg-slate-100 px-1.5 py-1 rounded-md transition-colors whitespace-nowrap"
            >
              {crumb.label}
            </button>
          ) : (
            <span className="text-sm font-semibold text-emerald-600 px-1.5 py-1 whitespace-nowrap">
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
```

- [ ] **Create `src/components/layout/AppHeader.jsx`**

```jsx
import Breadcrumb from './Breadcrumb'
import ModeToggle from '../shared/ModeToggle'
import Avatar from '../shared/Avatar'

export default function AppHeader({ crumbs = [], mode, onModeChange, nickname, appMode, onAppModeChange }) {
  return (
    <header className="bg-white border-b border-slate-200 h-14 flex items-center px-5 gap-3">
      <div className="text-base font-black text-slate-900 tracking-tight flex-shrink-0">
        five<span className="text-emerald-500">.</span>hints
      </div>
      <span className="text-slate-200 hidden sm:block">|</span>

      {/* Breadcrumb — hidden on mobile, replaced by game chip */}
      <div className="hidden sm:flex flex-1 overflow-hidden">
        <Breadcrumb crumbs={crumbs} />
      </div>

      {/* Mobile: active game chip */}
      {crumbs.length > 0 && (
        <div className="flex sm:hidden flex-1 overflow-hidden">
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full truncate">
            {crumbs[crumbs.length - 1]?.label}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
        {/* Play / Create toggle */}
        <div className="flex bg-slate-100 rounded-lg p-1 gap-0.5">
          {['play', 'create'].map((m) => (
            <button
              key={m}
              onClick={() => onAppModeChange(m)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all capitalize ${
                appMode === m ? 'bg-white text-slate-900 shadow-sm' : 'bg-transparent text-slate-400'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* Solo / Group toggle — only in play mode */}
        {appMode === 'play' && (
          <ModeToggle mode={mode} onChange={onModeChange} />
        )}

        <Avatar nickname={nickname} />
      </div>
    </header>
  )
}
```

- [ ] **Run tests — verify pass**

```bash
npx vitest run src/components/layout/__tests__/Breadcrumb.test.jsx
```

Expected: PASS (3 tests)

- [ ] **Commit**

```bash
git add src/components/layout/
git commit -m "feat: add Breadcrumb and AppHeader components"
```

---

## Task 4: HintRow + HintStack

**Files:**
- Create: `src/components/gameplay/HintRow.jsx`
- Create: `src/components/gameplay/HintStack.jsx`
- Create: `src/components/gameplay/__tests__/HintRow.test.jsx`

- [ ] **Write failing tests**

`src/components/gameplay/__tests__/HintRow.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import HintRow from '../HintRow'

test('renders locked state with no text', () => {
  render(<HintRow index={0} state="locked" text="" />)
  expect(screen.getByText('Hint 1')).toBeInTheDocument()
  expect(screen.queryByText(/unlocks/i)).toBeInTheDocument()
})

test('renders hint text when revealed', () => {
  render(<HintRow index={1} state="revealed" text="Located on the Bosphorus Strait." />)
  expect(screen.getByText('Located on the Bosphorus Strait.')).toBeInTheDocument()
})

test('renders active state with "Guess now" label', () => {
  render(<HintRow index={2} state="active" text="Named for the moon." />)
  expect(screen.getByText(/guess now/i)).toBeInTheDocument()
})

test('renders wrong state with guess tag', () => {
  render(<HintRow index={0} state="wrong" text="Clue text." wrongGuess="Istanbul" />)
  expect(screen.getByText('✗ Istanbul')).toBeInTheDocument()
})

test('renders correct state with correct badge', () => {
  render(<HintRow index={2} state="correct" text="Named for the moon." />)
  expect(screen.getByText('✓ Correct')).toBeInTheDocument()
})
```

- [ ] **Run — verify fail**

```bash
npx vitest run src/components/gameplay/__tests__/HintRow.test.jsx
```

- [ ] **Create `src/components/gameplay/HintRow.jsx`**

```jsx
const STATE_STYLES = {
  locked:   { row: 'bg-[#f8fafc] border-[#f1f5f9] opacity-50',  badge: 'bg-slate-100 text-slate-400',   label: 'text-slate-400' },
  revealed: { row: 'bg-white border-slate-200',                   badge: 'bg-slate-100 text-slate-500',   label: 'text-slate-500' },
  active:   { row: 'bg-[#f0fdf9] border-[#6ee7b7] shadow-[0_0_0_3px_rgba(16,185,129,0.08)]', badge: 'bg-emerald-100 text-emerald-700', label: 'text-emerald-600' },
  wrong:    { row: 'bg-[#fff5f5] border-[#fecaca]',               badge: 'bg-red-100 text-red-500',       label: 'text-red-500' },
  correct:  { row: 'bg-[#f0fdf4] border-[#86efac]',               badge: 'bg-emerald-100 text-emerald-700', label: 'text-emerald-600' },
}

const BADGE_NUM_STYLES = {
  locked:   'bg-slate-100 text-slate-400',
  revealed: 'bg-slate-100 text-slate-500',
  active:   'bg-emerald-100 text-emerald-700',
  wrong:    'bg-red-100 text-red-500',
  correct:  'bg-emerald-100 text-emerald-700',
}

export default function HintRow({ index, state = 'locked', text = '', wrongGuess = '' }) {
  const s = STATE_STYLES[state] ?? STATE_STYLES.locked
  const numStyle = BADGE_NUM_STYLES[state] ?? BADGE_NUM_STYLES.locked

  const labelText =
    state === 'active'   ? `Hint ${index + 1} · Guess now` :
    state === 'locked'   ? `Hint ${index + 1}` :
    `Hint ${index + 1}`

  const bodyText =
    state === 'locked'   ? 'Unlocks on wrong guess' :
    text

  return (
    <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-[10px] border-[1.5px] transition-all ${s.row}`}>
      <div className={`w-6 h-6 rounded-[7px] flex items-center justify-center text-[0.65rem] font-black flex-shrink-0 mt-0.5 ${numStyle}`}>
        {state === 'correct' ? '✓' : index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[0.65rem] font-bold tracking-wide uppercase mb-1 ${s.label}`}>
          {labelText}
        </div>
        <div className={`text-[0.87rem] leading-[1.55] font-medium ${state === 'active' ? 'text-slate-900 font-semibold' : state === 'locked' ? 'text-slate-400 italic' : 'text-slate-700'}`}>
          {bodyText}
        </div>
      </div>
      {state === 'wrong' && wrongGuess && (
        <div className="flex-shrink-0 self-start px-2 py-0.5 rounded-full bg-red-100 text-red-500 text-[0.62rem] font-bold whitespace-nowrap">
          ✗ {wrongGuess}
        </div>
      )}
      {state === 'correct' && (
        <div className="flex-shrink-0 self-start px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[0.62rem] font-bold whitespace-nowrap">
          ✓ Correct
        </div>
      )}
    </div>
  )
}
```

- [ ] **Create `src/components/gameplay/HintStack.jsx`**

```jsx
import HintRow from './HintRow'

// guesses: array of 5 strings (empty = no guess made for that attempt)
// currentAttempt: 0-4 index
// finished: bool — game is over
// won: bool
export default function HintStack({ hints = [], guesses = [], currentAttempt = 0, finished = false, won = false }) {
  return (
    <div className="flex flex-col gap-2">
      {hints.map((text, i) => {
        const isUnlocked = i <= currentAttempt
        const guessForThisHint = guesses[i] ?? ''
        const wasWrong = guessForThisHint && !won && (i < currentAttempt || finished)

        let state = 'locked'
        if (won && i === currentAttempt) state = 'correct'
        else if (won && i < currentAttempt) state = wasWrong ? 'wrong' : 'revealed'
        else if (!isUnlocked) state = 'locked'
        else if (i === currentAttempt && !finished) state = 'active'
        else if (wasWrong) state = 'wrong'
        else state = 'revealed'

        return (
          <HintRow
            key={i}
            index={i}
            state={state}
            text={text}
            wrongGuess={wasWrong ? guessForThisHint : ''}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Run tests — verify pass**

```bash
npx vitest run src/components/gameplay/__tests__/HintRow.test.jsx
```

Expected: PASS (5 tests)

- [ ] **Commit**

```bash
git add src/components/gameplay/HintRow.jsx src/components/gameplay/HintStack.jsx src/components/gameplay/__tests__/
git commit -m "feat: add HintRow and HintStack components"
```

---

## Task 5: StatsRow + ProgressBar + WrongMessage + CorrectState

**Files:**
- Create: `src/components/gameplay/StatsRow.jsx`
- Create: `src/components/gameplay/ProgressBar.jsx`
- Create: `src/components/gameplay/WrongMessage.jsx`
- Create: `src/components/gameplay/CorrectState.jsx`
- Create: `src/components/gameplay/__tests__/StatsRow.test.jsx`

- [ ] **Write failing tests**

`src/components/gameplay/__tests__/StatsRow.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import StatsRow from '../StatsRow'

test('renders solved, points, and streak values', () => {
  render(<StatsRow solved={6} points={24} streak={3} />)
  expect(screen.getByText('6')).toBeInTheDocument()
  expect(screen.getByText('24')).toBeInTheDocument()
  expect(screen.getAllByText(/solved/i)[0]).toBeInTheDocument()
  expect(screen.getAllByText(/points/i)[0]).toBeInTheDocument()
  expect(screen.getAllByText(/streak/i)[0]).toBeInTheDocument()
})
```

- [ ] **Run — verify fail**

```bash
npx vitest run src/components/gameplay/__tests__/StatsRow.test.jsx
```

- [ ] **Create `src/components/gameplay/StatsRow.jsx`**

```jsx
export default function StatsRow({ solved = 0, points = 0, streak = 0 }) {
  const items = [
    { value: solved, label: 'Solved', color: 'text-slate-900' },
    { value: points, label: 'Points', color: 'text-emerald-500' },
    { value: streak > 0 ? `🔥 ${streak}` : streak, label: 'Streak', color: 'text-amber-500' },
  ]
  return (
    <div className="flex gap-2 mb-5">
      {items.map(({ value, label, color }) => (
        <div key={label} className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex flex-col items-center gap-0.5">
          <div className={`text-xl font-black leading-none ${color}`}>{value}</div>
          <div className="text-[0.62rem] font-semibold text-slate-400 uppercase tracking-wider">{label}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Create `src/components/gameplay/ProgressBar.jsx`**

```jsx
export default function ProgressBar({ current = 0, total = 1, solved = 0 }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  const remaining = total - current
  return (
    <div className="mb-5">
      <div className="h-[5px] bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[0.7rem] font-medium text-slate-400">Entry {current} of {total}</span>
        <span className="text-[0.7rem] font-medium text-slate-400">{solved} solved · {remaining} remaining</span>
      </div>
    </div>
  )
}
```

- [ ] **Create `src/components/gameplay/WrongMessage.jsx`**

```jsx
export default function WrongMessage({ guess = '', attemptsLeft = 0 }) {
  if (!guess) return null
  return (
    <div className="mt-1 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-[10px] text-[0.82rem] font-semibold text-red-500 flex items-center gap-2">
      <span>✕</span>
      <span>"{guess}" was incorrect — {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining</span>
    </div>
  )
}
```

- [ ] **Create `src/components/gameplay/CorrectState.jsx`**

```jsx
export default function CorrectState({ answer = '', hintIndex = 0, pointsEarned = 0, streak = 0, onNext }) {
  return (
    <div className="bg-emerald-50 border-[1.5px] border-emerald-300 rounded-2xl p-4 flex items-center gap-3.5">
      <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xl flex-shrink-0">
        ✓
      </div>
      <div className="flex-1">
        <div className="text-[0.68rem] font-bold text-emerald-600 uppercase tracking-wide">
          Correct on hint {hintIndex + 1}!
        </div>
        <div className="text-lg font-black text-slate-900 mt-0.5">{answer}</div>
        <div className="text-[0.8rem] font-semibold text-emerald-500 mt-0.5">
          +{pointsEarned} points{streak > 0 ? ` · Streak 🔥${streak}` : ''}
        </div>
      </div>
      {onNext && (
        <button
          onClick={onNext}
          className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl flex-shrink-0 hover:bg-slate-700 transition-colors"
        >
          Next →
        </button>
      )}
    </div>
  )
}
```

- [ ] **Run tests — verify pass**

```bash
npx vitest run src/components/gameplay/__tests__/StatsRow.test.jsx
```

Expected: PASS (1 test)

- [ ] **Commit**

```bash
git add src/components/gameplay/StatsRow.jsx src/components/gameplay/ProgressBar.jsx src/components/gameplay/WrongMessage.jsx src/components/gameplay/CorrectState.jsx src/components/gameplay/__tests__/StatsRow.test.jsx
git commit -m "feat: add StatsRow, ProgressBar, WrongMessage, CorrectState"
```

---

## Task 6: InputCard

**Files:**
- Create: `src/components/gameplay/InputCard.jsx`
- Create: `src/components/gameplay/__tests__/InputCard.test.jsx`

- [ ] **Write failing tests**

`src/components/gameplay/__tests__/InputCard.test.jsx`:
```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InputCard from '../InputCard'

test('calls onGuess with current input value on button click', async () => {
  const onGuess = vi.fn()
  render(<InputCard currentAttempt={0} maxAttempts={5} onGuess={onGuess} onRevealHint={() => {}} suggestions={[]} />)
  await userEvent.type(screen.getByPlaceholderText(/type your answer/i), 'Ankara')
  await userEvent.click(screen.getByRole('button', { name: /guess/i }))
  expect(onGuess).toHaveBeenCalledWith('Ankara')
})

test('clears input after guess submitted', async () => {
  const onGuess = vi.fn()
  render(<InputCard currentAttempt={0} maxAttempts={5} onGuess={onGuess} onRevealHint={() => {}} suggestions={[]} />)
  const input = screen.getByPlaceholderText(/type your answer/i)
  await userEvent.type(input, 'Istanbul')
  await userEvent.click(screen.getByRole('button', { name: /guess/i }))
  expect(input.value).toBe('')
})

test('shows correct number of attempt dots', () => {
  render(<InputCard currentAttempt={2} maxAttempts={5} onGuess={() => {}} onRevealHint={() => {}} suggestions={[]} />)
  expect(screen.getByText(/attempt 3 of 5/i)).toBeInTheDocument()
})

test('calls onRevealHint when reveal link clicked', async () => {
  const onRevealHint = vi.fn()
  render(<InputCard currentAttempt={1} maxAttempts={5} onGuess={() => {}} onRevealHint={onRevealHint} suggestions={[]} />)
  await userEvent.click(screen.getByText(/reveal next hint/i))
  expect(onRevealHint).toHaveBeenCalled()
})
```

- [ ] **Run — verify fail**

```bash
npx vitest run src/components/gameplay/__tests__/InputCard.test.jsx
```

- [ ] **Create `src/components/gameplay/InputCard.jsx`**

```jsx
import { useState } from 'react'

export default function InputCard({ currentAttempt = 0, maxAttempts = 5, onGuess, onRevealHint, suggestions = [], disabled = false }) {
  const [value, setValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onGuess(trimmed)
    setValue('')
    setShowSuggestions(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') submit()
  }

  const attemptsLeft = maxAttempts - currentAttempt

  return (
    <div
      className="bg-white border-[1.5px] border-[#6ee7b7] rounded-2xl p-3.5 mb-2"
      style={{ boxShadow: '0 0 0 3px rgba(16,185,129,0.08)' }}
    >
      <div className="flex gap-2 mb-2.5 relative">
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setShowSuggestions(e.target.value.length > 0 && suggestions.length > 0) }}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer…"
          disabled={disabled}
          className="flex-1 bg-slate-50 border-[1.5px] border-slate-200 rounded-[10px] px-3.5 py-2.5 text-[0.95rem] font-semibold text-slate-900 outline-none focus:border-emerald-400 transition-colors disabled:opacity-50"
        />
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-[10px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Guess →
        </button>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-16 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
            {suggestions.slice(0, 6).map((s) => (
              <button
                key={s}
                className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => { setValue(s); setShowSuggestions(false) }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: maxAttempts }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < currentAttempt ? 'bg-red-400' :
                  i === currentAttempt ? 'bg-amber-400 animate-pulse' :
                  'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-[0.72rem] font-semibold text-slate-400">
            Attempt {currentAttempt + 1} of {maxAttempts}
          </span>
        </div>
        {currentAttempt < maxAttempts - 1 && (
          <button
            onClick={onRevealHint}
            disabled={disabled}
            className="text-[0.75rem] font-semibold text-slate-400 hover:text-emerald-500 transition-colors bg-transparent border-none cursor-pointer disabled:opacity-40"
          >
            ▸ Reveal next hint (−1 pt)
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Run tests — verify pass**

```bash
npx vitest run src/components/gameplay/__tests__/InputCard.test.jsx
```

Expected: PASS (4 tests)

- [ ] **Commit**

```bash
git add src/components/gameplay/InputCard.jsx src/components/gameplay/__tests__/InputCard.test.jsx
git commit -m "feat: add InputCard with autocomplete and attempt dots"
```

---

## Task 7: useGameSession hook

**Files:**
- Create: `src/hooks/useGameSession.js`
- Create: `src/hooks/__tests__/useGameSession.test.js`

The hook extracts solo game state from App.jsx. It manages guesses, attempt tracking, scoring, and session record updates. The existing API fetch logic in App.jsx (`loadGameEntries`, etc.) stays in App.jsx for now — the hook receives a `gameEntries` array as input.

- [ ] **Write failing tests**

`src/hooks/__tests__/useGameSession.test.js`:
```js
import { renderHook, act } from '@testing-library/react'
import useGameSession from '../useGameSession'

const mockEntries = [
  { id: '1', word: 'Ankara', hints: ['h1','h2','h3','h4','h5'], title: '', audio: null, createdBy: 'test' },
  { id: '2', word: 'Tokyo',  hints: ['t1','t2','t3','t4','t5'], title: '', audio: null, createdBy: 'test' },
]

test('starts at entry 0 with empty guesses', () => {
  const { result } = renderHook(() => useGameSession(mockEntries))
  expect(result.current.currentEntryIndex).toBe(0)
  expect(result.current.guesses).toEqual(['','','','',''])
  expect(result.current.currentAttempt).toBe(0)
})

test('wrong guess increments attempt and stores guess', () => {
  const { result } = renderHook(() => useGameSession(mockEntries))
  act(() => result.current.submitGuess('Istanbul'))
  expect(result.current.currentAttempt).toBe(1)
  expect(result.current.guesses[0]).toBe('Istanbul')
  expect(result.current.won).toBe(false)
})

test('correct guess sets won=true and awards points', () => {
  const { result } = renderHook(() => useGameSession(mockEntries))
  act(() => result.current.submitGuess('Ankara'))
  expect(result.current.won).toBe(true)
  expect(result.current.sessionRecord.totalPoints).toBe(5)
})

test('correct on attempt 2 awards 4 points', () => {
  const { result } = renderHook(() => useGameSession(mockEntries))
  act(() => result.current.submitGuess('Wrong'))
  act(() => result.current.submitGuess('Ankara'))
  expect(result.current.sessionRecord.totalPoints).toBe(4)
})

test('advanceEntry moves to next entry and resets play state', () => {
  const { result } = renderHook(() => useGameSession(mockEntries))
  act(() => result.current.submitGuess('Ankara'))
  act(() => result.current.advanceEntry())
  expect(result.current.currentEntryIndex).toBe(1)
  expect(result.current.guesses).toEqual(['','','','',''])
  expect(result.current.won).toBe(false)
})

test('5 wrong guesses sets finished=true', () => {
  const { result } = renderHook(() => useGameSession(mockEntries))
  for (let i = 0; i < 5; i++) act(() => result.current.submitGuess('Wrong'))
  expect(result.current.finished).toBe(true)
})
```

- [ ] **Run — verify fail**

```bash
npx vitest run src/hooks/__tests__/useGameSession.test.js
```

- [ ] **Create `src/hooks/useGameSession.js`**

```js
import { useState, useCallback } from 'react'

const MAX_ATTEMPTS = 5

function calcPoints(attemptIndex) {
  return Math.max(0, MAX_ATTEMPTS - attemptIndex)
}

function makeSessionRecord(entries) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    totalEntries: entries.length,
    currentEntry: 1,
    solved: 0,
    totalPoints: 0,
    solvedEntryIds: [],
    streak: 0,
    startedAt: new Date().toISOString(),
  }
}

export default function useGameSession(entries = []) {
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0)
  const [guesses, setGuesses] = useState(['', '', '', '', ''])
  const [currentAttempt, setCurrentAttempt] = useState(0)
  const [finished, setFinished] = useState(false)
  const [won, setWon] = useState(false)
  const [sessionRecord, setSessionRecord] = useState(() => makeSessionRecord(entries))

  const currentEntry = entries[currentEntryIndex] ?? null

  const submitGuess = useCallback((guess) => {
    if (!currentEntry || finished || won) return
    const isCorrect = guess.trim().toLowerCase() === currentEntry.word.trim().toLowerCase()

    setGuesses((prev) => {
      const next = [...prev]
      next[currentAttempt] = guess
      return next
    })

    if (isCorrect) {
      const pts = calcPoints(currentAttempt)
      setWon(true)
      setFinished(true)
      setSessionRecord((prev) => ({
        ...prev,
        solved: prev.solved + 1,
        totalPoints: prev.totalPoints + pts,
        solvedEntryIds: [...prev.solvedEntryIds, currentEntry.id],
        streak: prev.streak + 1,
      }))
    } else {
      const nextAttempt = currentAttempt + 1
      if (nextAttempt >= MAX_ATTEMPTS) {
        setFinished(true)
        setSessionRecord((prev) => ({ ...prev, streak: 0 }))
      }
      setCurrentAttempt(nextAttempt)
    }
  }, [currentEntry, currentAttempt, finished, won])

  const revealNextHint = useCallback(() => {
    if (currentAttempt < MAX_ATTEMPTS - 1 && !finished) {
      // Costs 1 point — recorded as a penalty on solve
      setCurrentAttempt((a) => a + 1)
    }
  }, [currentAttempt, finished])

  const advanceEntry = useCallback(() => {
    setCurrentEntryIndex((i) => i + 1)
    setGuesses(['', '', '', '', ''])
    setCurrentAttempt(0)
    setFinished(false)
    setWon(false)
    setSessionRecord((prev) => ({ ...prev, currentEntry: prev.currentEntry + 1 }))
  }, [])

  return {
    currentEntry,
    currentEntryIndex,
    guesses,
    currentAttempt,
    finished,
    won,
    sessionRecord,
    submitGuess,
    revealNextHint,
    advanceEntry,
  }
}
```

- [ ] **Run tests — verify pass**

```bash
npx vitest run src/hooks/__tests__/useGameSession.test.js
```

Expected: PASS (6 tests)

- [ ] **Commit**

```bash
git add src/hooks/useGameSession.js src/hooks/__tests__/useGameSession.test.js
git commit -m "feat: add useGameSession hook with scoring and advance logic"
```

---

## Task 8: PlayScreen — solo gameplay assembly

**Files:**
- Create: `src/components/gameplay/PlayScreen.jsx`

- [ ] **Create `src/components/gameplay/PlayScreen.jsx`**

```jsx
import useGameSession from '../../hooks/useGameSession'
import StatsRow from './StatsRow'
import ProgressBar from './ProgressBar'
import HintStack from './HintStack'
import InputCard from './InputCard'
import WrongMessage from './WrongMessage'
import CorrectState from './CorrectState'

export default function PlayScreen({ gameEntries = [], gameName = '', category = '', suggestions = [], onFetchSuggestions }) {
  const {
    currentEntry,
    currentEntryIndex,
    guesses,
    currentAttempt,
    finished,
    won,
    sessionRecord,
    submitGuess,
    revealNextHint,
    advanceEntry,
  } = useGameSession(gameEntries)

  if (!currentEntry) {
    return (
      <div className="max-w-[680px] mx-auto px-5 py-12 text-center text-slate-400 font-semibold">
        Select a game from the menu above to start playing.
      </div>
    )
  }

  const lastWrongGuess = !won && currentAttempt > 0 ? guesses[currentAttempt - 1] : ''
  const attemptsLeft = 5 - currentAttempt

  return (
    <main className="max-w-[680px] mx-auto px-5 py-6 pb-28">
      <StatsRow
        solved={sessionRecord.solved}
        points={sessionRecord.totalPoints}
        streak={sessionRecord.streak}
      />
      <ProgressBar
        current={currentEntryIndex + 1}
        total={gameEntries.length}
        solved={sessionRecord.solved}
      />

      <div className="mb-4">
        <div className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-widest">{category}</div>
        <div className="text-lg font-black text-slate-900 mt-0.5">{gameName}</div>
      </div>

      <HintStack
        hints={currentEntry.hints}
        guesses={guesses}
        currentAttempt={currentAttempt}
        finished={finished}
        won={won}
      />

      <div className="mt-4">
        {won || finished ? (
          <CorrectState
            answer={currentEntry.word}
            hintIndex={won ? currentAttempt - 1 : 4}
            pointsEarned={won ? Math.max(0, 5 - (currentAttempt - 1)) : 0}
            streak={sessionRecord.streak}
            onNext={currentEntryIndex < gameEntries.length - 1 ? advanceEntry : null}
          />
        ) : (
          <>
            <InputCard
              currentAttempt={currentAttempt}
              maxAttempts={5}
              onGuess={submitGuess}
              onRevealHint={revealNextHint}
              suggestions={suggestions}
            />
            <WrongMessage guess={lastWrongGuess} attemptsLeft={attemptsLeft} />
          </>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Smoke-test in browser**

```bash
npm run dev
```

Open `http://localhost:5173` — navigate to a game. The old UI still renders (App.jsx unchanged). No errors in console. PlayScreen is not wired yet — that happens in Task 12.

- [ ] **Commit**

```bash
git add src/components/gameplay/PlayScreen.jsx
git commit -m "feat: add PlayScreen assembly component"
```

---

## Task 9: Group session API client + useGroupSession hook

**Files:**
- Create: `src/api/sessions.js`
- Create: `src/hooks/useGroupSession.js`
- Create: `src/hooks/__tests__/useGroupSession.test.js`

- [ ] **Create `src/api/sessions.js`**

```js
const API_BASE = 'https://enasollu.enasollu.xyz'

export async function createSession({ nickname, category, gameName, totalEntries }) {
  const res = await fetch(`${API_BASE}/api/sessions/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, category, gameName, totalEntries }),
  })
  if (!res.ok) throw new Error('Failed to create session')
  return res.json() // { sessionId, code }
}

export async function joinSession({ nickname, code }) {
  const res = await fetch(`${API_BASE}/api/sessions/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, code }),
  })
  if (!res.ok) throw new Error('Invalid session code')
  return res.json() // session state
}

export async function pollSession(sessionId) {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`)
  if (!res.ok) throw new Error('Session not found')
  return res.json()
}

export async function submitAnswer({ sessionId, nickname, answer, hintIndex, pointsEarned }) {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, answer, hintIndex, pointsEarned }),
  })
  if (!res.ok) throw new Error('Submit failed')
  return res.json()
}

export async function advanceEntry(sessionId) {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/next`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Advance failed')
  return res.json()
}

export async function leaveSession(sessionId, nickname) {
  await fetch(`${API_BASE}/api/sessions/${sessionId}/leave`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  })
}
```

- [ ] **Write failing tests**

`src/hooks/__tests__/useGroupSession.test.js`:
```js
import { renderHook, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import useGroupSession from '../useGroupSession'

vi.mock('../../api/sessions', () => ({
  pollSession: vi.fn().mockResolvedValue({
    sessionId: 'abc',
    code: '4827',
    status: 'playing',
    currentEntry: 1,
    totalEntries: 20,
    players: [{ name: 'Priya', isHost: true, submitted: false, score: 0 }],
    revealReady: false,
  }),
  submitAnswer: vi.fn().mockResolvedValue({}),
  advanceEntry: vi.fn().mockResolvedValue({}),
  leaveSession: vi.fn().mockResolvedValue({}),
}))

test('initialises with null session state', () => {
  const { result } = renderHook(() => useGroupSession(null, 'Priya'))
  expect(result.current.session).toBeNull()
  expect(result.current.polling).toBe(false)
})

test('starts polling when sessionId provided', async () => {
  const { result } = renderHook(() => useGroupSession('abc', 'Priya'))
  await waitFor(() => expect(result.current.session).not.toBeNull())
  expect(result.current.session.code).toBe('4827')
})
```

- [ ] **Run — verify fail**

```bash
npx vitest run src/hooks/__tests__/useGroupSession.test.js
```

- [ ] **Create `src/hooks/useGroupSession.js`**

```js
import { useState, useEffect, useRef, useCallback } from 'react'
import { pollSession, submitAnswer, advanceEntry, leaveSession } from '../api/sessions'

const POLL_INTERVAL_MS = 2500

export default function useGroupSession(sessionId, nickname) {
  const [session, setSession] = useState(null)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  const poll = useCallback(async () => {
    if (!sessionId) return
    try {
      const data = await pollSession(sessionId)
      setSession(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) return
    setPolling(true)
    poll()
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)
    return () => { clearInterval(intervalRef.current); setPolling(false) }
  }, [sessionId, poll])

  const submit = useCallback(async ({ answer, hintIndex, pointsEarned }) => {
    if (!sessionId) return
    await submitAnswer({ sessionId, nickname, answer, hintIndex, pointsEarned })
    await poll()
  }, [sessionId, nickname, poll])

  const advance = useCallback(async () => {
    if (!sessionId) return
    await advanceEntry(sessionId)
    await poll()
  }, [sessionId, poll])

  const leave = useCallback(async () => {
    if (!sessionId) return
    clearInterval(intervalRef.current)
    setPolling(false)
    await leaveSession(sessionId, nickname)
    setSession(null)
  }, [sessionId, nickname])

  const isHost = session?.players?.find((p) => p.name === nickname)?.isHost ?? false
  const myPlayer = session?.players?.find((p) => p.name === nickname) ?? null

  return { session, polling, error, isHost, myPlayer, submit, advance, leave }
}
```

- [ ] **Run tests — verify pass**

```bash
npx vitest run src/hooks/__tests__/useGroupSession.test.js
```

Expected: PASS (2 tests)

- [ ] **Commit**

```bash
git add src/api/sessions.js src/hooks/useGroupSession.js src/hooks/__tests__/useGroupSession.test.js
git commit -m "feat: add group session API client and useGroupSession hook"
```

---

## Task 10: Group UI components

**Files:**
- Create: `src/components/group/GroupSetup.jsx`
- Create: `src/components/group/Lobby.jsx`
- Create: `src/components/group/PlayerStrip.jsx`
- Create: `src/components/group/WaitingBanner.jsx`
- Create: `src/components/group/EntryResults.jsx`

- [ ] **Create `src/components/group/PlayerStrip.jsx`**

```jsx
// players: [{ name, isHost, submitted, score }]
// myName: string
export default function PlayerStrip({ players = [], myName = '' }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {players.map((p) => {
        const isMe = p.name === myName
        const chipCls = isMe
          ? 'border-[#6ee7b7] bg-emerald-50'
          : p.submitted
          ? 'border-blue-200 bg-blue-50'
          : 'border-slate-200 bg-slate-50'
        const dotCls = isMe
          ? 'bg-emerald-500'
          : p.submitted
          ? 'bg-blue-400'
          : 'bg-amber-400 animate-pulse'
        const nameCls = isMe ? 'text-emerald-600' : p.submitted ? 'text-blue-600' : 'text-slate-700'

        return (
          <div key={p.name} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] border-[1.5px] ${chipCls}`}>
            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[0.58rem] font-black text-slate-500">
              {p.name.slice(0, 2).toUpperCase()}
            </div>
            <span className={`text-[0.75rem] font-bold ${nameCls}`}>{p.name}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Create `src/components/group/WaitingBanner.jsx`**

```jsx
// submittedNames: string[] — players who have submitted
// pendingNames: string[] — players still playing
export default function WaitingBanner({ submittedNames = [], pendingNames = [] }) {
  if (pendingNames.length === 0) return null
  const submittedText = submittedNames.length > 0
    ? `${submittedNames.join(', ')} submitted · `
    : ''
  const waitText = `waiting for ${pendingNames.join(', ')}…`
  return (
    <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-[10px] mb-3 text-[0.78rem] font-semibold text-amber-700">
      <span>⏳</span>
      <span>{submittedText}{waitText}</span>
      <span className="ml-auto text-[0.68rem] opacity-70">Results reveal when everyone submits</span>
    </div>
  )
}
```

- [ ] **Create `src/components/group/EntryResults.jsx`**

```jsx
const MEDALS = ['🥇', '🥈', '🥉']

export default function EntryResults({ answer = '', players = [], myName = '', isHost = false, onNext, onLeave }) {
  const sorted = [...players].sort((a, b) => (b.entryPoints ?? 0) - (a.entryPoints ?? 0))

  return (
    <div className="max-w-[560px] mx-auto px-5 py-6">
      <div className="text-center mb-5">
        <div className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider mb-1">Round Results</div>
        <div className="text-lg font-black text-slate-900">Entry Results</div>
      </div>

      {/* Answer reveal */}
      <div className="bg-emerald-50 border-2 border-emerald-300 rounded-[18px] p-5 text-center mb-5">
        <div className="text-[0.68rem] font-bold text-emerald-600 uppercase tracking-wider mb-1">The answer was</div>
        <div className="text-4xl font-black text-slate-900 tracking-tight">{answer}</div>
      </div>

      {/* Per-player rows */}
      <div className="flex flex-col gap-2 mb-4">
        {sorted.map((p, i) => (
          <div
            key={p.name}
            className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border-[1.5px] ${
              i === 0 ? 'bg-emerald-50 border-emerald-200' :
              p.name === myName ? 'bg-blue-50 border-blue-200' :
              'bg-white border-slate-200'
            }`}
          >
            <div className="w-7 text-center text-base">{MEDALS[i] ?? `${i + 1}`}</div>
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[0.7rem] font-black text-slate-500 flex-shrink-0">
              {p.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-900">{p.name}</div>
              <div className={`text-xs font-semibold mt-0.5 ${p.correct ? 'text-emerald-600' : 'text-red-500'}`}>
                {p.correct
                  ? `✓ ${p.answer} · hint ${(p.hintIndex ?? 0) + 1}`
                  : '✗ Didn\'t get it'}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-black text-slate-900">{p.score}</div>
              <div className="text-[0.62rem] font-semibold text-emerald-500">+{p.entryPoints ?? 0}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={onLeave} className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-sm">
          Leave
        </button>
        {isHost && (
          <button onClick={onNext} className="flex-[2] py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm">
            Next Entry →
          </button>
        )}
        {!isHost && (
          <div className="flex-[2] py-3.5 rounded-xl bg-slate-100 text-slate-400 font-semibold text-sm text-center">
            Waiting for host…
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Create `src/components/group/GroupSetup.jsx`**

```jsx
import { useState } from 'react'
import { createSession, joinSession } from '../../api/sessions'

export default function GroupSetup({ nickname, categories = [], onSessionCreated, onSessionJoined }) {
  const [tab, setTab] = useState('host')
  const [gameName, setGameName] = useState('')
  const [category, setCategory] = useState('')
  const [entries, setEntries] = useState('20')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!gameName || !category) { setError('Choose a game and category'); return }
    setLoading(true); setError('')
    try {
      const data = await createSession({ nickname, category, gameName, totalEntries: Number(entries) })
      onSessionCreated(data)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  const handleJoin = async () => {
    if (!code.trim()) { setError('Enter a session code'); return }
    setLoading(true); setError('')
    try {
      const data = await joinSession({ nickname, code: code.replace(/\s/g, '') })
      onSessionJoined(data)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="max-w-[520px] mx-auto px-5 py-8">
      <h2 className="text-xl font-black text-slate-900 mb-1">Play with Friends</h2>
      <p className="text-sm text-slate-500 mb-6">Start a group game or join one with a code.</p>

      <div className="flex bg-slate-100 rounded-xl p-1 gap-1 mb-6">
        {['host', 'join'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-[9px] text-sm font-bold transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
            {t === 'host' ? 'Host a Game' : 'Join a Game'}
          </button>
        ))}
      </div>

      {tab === 'host' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[0.7rem] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border-[1.5px] border-slate-200 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none">
              <option value="">Select a category…</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[0.7rem] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Game</label>
            <input value={gameName} onChange={(e) => setGameName(e.target.value)}
              placeholder="Game name"
              className="w-full bg-slate-50 border-[1.5px] border-slate-200 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-400" />
          </div>
          <div>
            <label className="block text-[0.7rem] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Entries</label>
            <select value={entries} onChange={(e) => setEntries(e.target.value)}
              className="w-full bg-slate-50 border-[1.5px] border-slate-200 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none">
              {['10','20','30'].map((n) => <option key={n} value={n}>{n} entries</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
          <button onClick={handleCreate} disabled={loading}
            className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Session →'}
          </button>
        </div>
      )}

      {tab === 'join' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[0.7rem] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Session Code</label>
            <input value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="4827"
              maxLength={4}
              className="w-full bg-slate-50 border-[1.5px] border-slate-200 rounded-[10px] px-3.5 py-3 text-3xl font-black text-slate-900 tracking-[0.2em] text-center outline-none focus:border-emerald-400" />
          </div>
          {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
          <button onClick={handleJoin} disabled={loading}
            className="w-full py-3.5 bg-emerald-500 text-white font-bold rounded-xl disabled:opacity-50">
            {loading ? 'Joining…' : 'Join →'}
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Create `src/components/group/Lobby.jsx`**

```jsx
export default function Lobby({ session, nickname, isHost, onStart, onLeave }) {
  if (!session) return null
  const { code, players = [], gameName, totalEntries } = session
  const canStart = isHost && players.length >= 2

  const copyCode = () => navigator.clipboard.writeText(code)
  const shareLink = () => {
    const url = `${window.location.origin}/#/group/${code}`
    if (navigator.share) navigator.share({ title: 'Join my Five Hints game', url })
    else navigator.clipboard.writeText(url)
  }

  return (
    <div className="max-w-[560px] mx-auto px-5 py-8">
      <h2 className="text-xl font-black text-slate-900 mb-1">Game Lobby</h2>
      <p className="text-sm text-slate-500 mb-5">{gameName} · {totalEntries} entries</p>

      {/* Session code */}
      <div className="bg-emerald-50 border-[1.5px] border-emerald-200 rounded-2xl p-4 flex items-center justify-between mb-5">
        <div>
          <div className="text-[0.65rem] font-bold text-emerald-600 uppercase tracking-wider mb-1">Session Code</div>
          <div className="text-4xl font-black text-slate-900 tracking-[0.2em]">{code}</div>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={copyCode} className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-600 text-xs font-bold rounded-lg">Copy</button>
          <button onClick={shareLink} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg">Share 🔗</button>
        </div>
      </div>

      {/* Players */}
      <div className="mb-5">
        <div className="flex justify-between mb-3">
          <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wide">Players</span>
          <span className="text-[0.7rem] font-semibold text-slate-400">{players.length} / 8</span>
        </div>
        <div className="flex flex-col gap-2">
          {players.map((p) => (
            <div key={p.name} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${p.name === nickname ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-black text-slate-500">
                {p.name.slice(0,2).toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-bold text-slate-900">{p.name}</span>
              {p.name === nickname && <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">You</span>}
              {p.isHost && <span className="text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded-full">Host</span>}
            </div>
          ))}
          <div className="border border-dashed border-slate-200 rounded-xl py-3 text-center text-xs text-slate-300 font-medium">
            Waiting for more players…
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onLeave} className="flex-1 py-3.5 bg-slate-100 text-slate-500 font-bold rounded-xl text-sm">Leave</button>
        {isHost && (
          <button onClick={onStart} disabled={!canStart}
            className="flex-[2] py-3.5 bg-slate-900 text-white font-bold rounded-xl text-sm disabled:opacity-40">
            Start Game ▶ ({players.length} players)
          </button>
        )}
        {!isHost && (
          <div className="flex-[2] py-3.5 bg-slate-100 text-slate-400 font-semibold rounded-xl text-sm text-center">
            Waiting for host to start…
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/group/
git commit -m "feat: add group UI components (PlayerStrip, WaitingBanner, EntryResults, GroupSetup, Lobby)"
```

---

## Task 11: Create mode components

**Files:**
- Create: `src/components/create/CategoryPicker.jsx`
- Create: `src/components/create/CreateForm.jsx`
- Create: `src/components/create/JobStatus.jsx`
- Create: `src/components/create/ReviewEntries.jsx`
- Create: `src/components/create/MyGamesList.jsx`

- [ ] **Create `src/components/create/CategoryPicker.jsx`**

```jsx
import { useState } from 'react'

const CAT_ICONS = { Geography: '🌍', 'Pop Culture': '🎬', Science: '🔬', Sports: '🏅', History: '📚', Music: '🎵', Food: '🍜', Movies: '🎥' }

export default function CategoryPicker({ categories = [], value, newValue, onSelect, onNewChange }) {
  const [showNew, setShowNew] = useState(false)

  const handleNewClick = () => { setShowNew(true); onSelect('__new__') }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {categories.map((cat) => (
          <button key={cat} onClick={() => { onSelect(cat); setShowNew(false) }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] border-[1.5px] text-sm font-semibold text-left transition-all ${
              value === cat ? 'border-[#6ee7b7] bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50'
            }`}>
            <span>{CAT_ICONS[cat] ?? '📂'}</span>
            <span>{cat}</span>
          </button>
        ))}
        <button onClick={handleNewClick}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] border-[1.5px] border-dashed text-sm font-semibold transition-all ${
            value === '__new__' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-400 hover:border-emerald-300 hover:text-emerald-600'
          }`}>
          <span>＋</span>
          <span>New category…</span>
        </button>
      </div>
      {showNew && (
        <input
          value={newValue}
          onChange={(e) => onNewChange(e.target.value)}
          placeholder="Category name (e.g. Indian Cinema)"
          autoFocus
          className="mt-2 w-full bg-slate-50 border-[1.5px] border-emerald-300 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none"
        />
      )}
    </div>
  )
}
```

- [ ] **Create `src/components/create/CreateForm.jsx`**

```jsx
import { useState } from 'react'
import CategoryPicker from './CategoryPicker'

const EXAMPLES = ['Identify the Animal', 'Identify the Actor', 'Identify the Movie', 'Guess the Country', 'Name the Scientist']

export default function CreateForm({ categories = [], onSubmit, loading = false }) {
  const [prompt, setPrompt] = useState('')
  const [gameName, setGameName] = useState('')
  const [numWords, setNumWords] = useState('20')
  const [category, setCategory] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [includeAudio, setIncludeAudio] = useState(false)
  const [visibility, setVisibility] = useState('public')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [gamePrompt, setGamePrompt] = useState('')
  const [titlePrompt, setTitlePrompt] = useState('')
  const [cluesPrompt, setCluesPrompt] = useState('')
  const [audioPrompt, setAudioPrompt] = useState('')

  const resolvedCategory = category === '__new__' ? newCategory : category

  const handleSubmit = () => {
    onSubmit({ prompt, gameName, numWords, category: resolvedCategory, includeAudio, visibility, gamePrompt, titlePrompt, cluesPrompt, audioPrompt })
  }

  const inputCls = 'w-full bg-slate-50 border-[1.5px] border-slate-200 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-400 transition-colors'
  const labelCls = 'block text-[0.7rem] font-bold text-slate-500 uppercase tracking-wide mb-1.5'
  const cardCls = 'bg-white border border-slate-200 rounded-2xl p-5 mb-3'

  return (
    <div className="max-w-[600px] mx-auto px-5 py-7">
      <h2 className="text-xl font-black text-slate-900 mb-1">Create a New Game</h2>
      <p className="text-sm text-slate-500 mb-6">Tell us what your game is about — we'll generate the hints automatically.</p>

      {/* Section 1 */}
      <div className={cardCls}>
        <div className="mb-4">
          <label className={labelCls}>What should players identify?</label>
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder='e.g. "Identify the World Capital"' className={inputCls} />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setPrompt(ex)}
                className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className={labelCls}>Game Name</label>
          <input value={gameName} onChange={(e) => setGameName(e.target.value)} placeholder="e.g. World Capitals" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>How many entries to generate?</label>
          <select value={numWords} onChange={(e) => setNumWords(e.target.value)} className={inputCls + ' cursor-pointer'}>
            {['10','20','30','50'].map((n) => <option key={n} value={n}>{n} entries</option>)}
          </select>
        </div>
      </div>

      {/* Section 2 — Category */}
      <div className={cardCls}>
        <label className={labelCls}>Category</label>
        <CategoryPicker categories={categories} value={category} newValue={newCategory} onSelect={setCategory} onNewChange={setNewCategory} />
      </div>

      {/* Section 3 — Options */}
      <div className={cardCls}>
        <div className="mb-4">
          <label className={labelCls}>Include audio hint</label>
          <select value={includeAudio ? 'yes' : 'no'} onChange={(e) => setIncludeAudio(e.target.value === 'yes')} className={inputCls + ' cursor-pointer'}>
            <option value="no">No</option>
            <option value="yes">Yes — add a music / audio clue</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Visibility</label>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className={inputCls + ' cursor-pointer'}>
            <option value="public">Public — anyone can play</option>
            <option value="private">Private — only people you share with</option>
          </select>
        </div>
      </div>

      {/* Advanced toggle */}
      <button onClick={() => setShowAdvanced((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-[10px] bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors mb-3">
        <span>⚙</span>
        <span>Advanced — customize AI prompts</span>
        <span className={`ml-auto text-xs transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {showAdvanced && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700 leading-relaxed">
            ℹ Leave these blank to use smart defaults based on your game description above.
          </div>
          {[
            { label: 'Game prompt', value: gamePrompt, set: setGamePrompt, placeholder: 'Describe in detail what the AI should generate…' },
            { label: 'Title prompt', value: titlePrompt, set: setTitlePrompt, placeholder: 'How should the title hint be phrased?' },
            { label: 'Clues prompt', value: cluesPrompt, set: setCluesPrompt, placeholder: 'Describe the style of each clue…' },
            { label: 'Audio prompt', value: audioPrompt, set: setAudioPrompt, placeholder: 'How should audio hints be selected?' },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label} className="mb-4 last:mb-0">
              <label className={labelCls}>{label} <span className="normal-case font-normal text-slate-400">— optional</span></label>
              <textarea value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} rows={2}
                className="w-full bg-slate-50 border-[1.5px] border-slate-200 rounded-[10px] px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 resize-y leading-relaxed" />
            </div>
          ))}
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading || !prompt || !gameName || !resolvedCategory}
        className="w-full py-4 bg-slate-900 text-white font-black text-base rounded-xl disabled:opacity-40 transition-colors hover:bg-slate-700">
        {loading ? 'Submitting…' : '✨ Generate Game'}
      </button>
      <p className="text-xs text-slate-400 text-center mt-2">Generation usually takes 1–3 minutes. You'll review before publishing.</p>
    </div>
  )
}
```

- [ ] **Create `src/components/create/JobStatus.jsx`**

```jsx
import { useEffect } from 'react'

const STEPS = [
  { key: 'queued',     label: 'Job queued',          sub: (job) => `Submitted · Job #${job.jobId ?? '…'}` },
  { key: 'generating', label: 'Generating entries',   sub: () => 'AI is writing hints for all entries' },
  { key: 'review',     label: 'Quality check',        sub: () => 'Reviewing generated entries for accuracy' },
  { key: 'ready',      label: 'Ready to review',      sub: () => 'Check My Games to review and publish' },
]

const STATUS_STEP = { queued: 0, generating: 1, processing: 2, complete: 3, done: 3 }

export default function JobStatus({ job, onRefresh, onBack }) {
  const stepIndex = STATUS_STEP[job?.status?.toLowerCase()] ?? 0

  useEffect(() => {
    if (!job || stepIndex >= 3) return
    const t = setInterval(onRefresh, 5000)
    return () => clearInterval(t)
  }, [job, stepIndex, onRefresh])

  if (!job) return null

  return (
    <div className="max-w-[560px] mx-auto px-5 py-7">
      <h2 className="text-xl font-black text-slate-900 mb-1">Generating Your Game</h2>
      <p className="text-sm text-slate-500 mb-6">{job.gameName} · {job.category} · {job.totalEntries} entries</p>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-4">
        <div className="flex flex-col gap-0">
          {STEPS.map((step, i) => {
            const done = i < stepIndex
            const active = i === stepIndex
            const pending = i > stepIndex
            return (
              <div key={step.key} className="flex items-start gap-3 pb-5 relative last:pb-0">
                {i < STEPS.length - 1 && (
                  <div className="absolute left-[13px] top-7 w-0.5 h-[calc(100%-28px)] bg-slate-200" />
                )}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 relative z-10 ${
                  done ? 'bg-emerald-500 text-white' :
                  active ? 'bg-amber-400 text-white' :
                  'bg-slate-200 text-slate-400'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <div className="pt-0.5">
                  <div className={`text-sm font-bold ${pending ? 'text-slate-400' : 'text-slate-900'}`}>{step.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{step.sub(job)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="text-sm font-bold text-emerald-700 mb-1">Meanwhile, go play!</div>
        <div className="text-xs text-emerald-600 leading-relaxed">Your game will appear in My Games once it's ready. You can close this page — generation keeps running.</div>
        <button onClick={onBack} className="mt-3 px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg">
          ← Back to Create / Play
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Create `src/components/create/ReviewEntries.jsx`**

```jsx
import { useState } from 'react'

export default function ReviewEntries({ game, entries = [], onApprove, onApproveAll }) {
  const [expanded, setExpanded] = useState(null)
  const pending = entries.filter((e) => !e.approved).length

  return (
    <div className="max-w-[600px] mx-auto px-5 py-7">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between mb-4">
        <div>
          <div className="text-base font-black text-slate-900">{game?.gameName}</div>
          <div className="text-xs text-slate-400 mt-0.5">{game?.category} · {entries.length} entries generated</div>
        </div>
        {pending > 0 && (
          <span className="px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-xs font-bold text-amber-700">{pending} pending</span>
        )}
      </div>

      <button onClick={onApproveAll} className="w-full py-3.5 bg-emerald-500 text-white font-bold text-sm rounded-xl mb-4 hover:bg-emerald-600 transition-colors">
        ✓ Approve All & Publish
      </button>

      <div className="flex flex-col gap-2">
        {entries.map((entry, i) => (
          <div key={entry.id ?? i} className={`bg-white border-[1.5px] rounded-xl overflow-hidden ${entry.approved ? 'border-emerald-200' : 'border-slate-200'}`}>
            <div
              className="flex items-center gap-2.5 px-3.5 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className={`w-6 h-6 rounded-[7px] flex items-center justify-center text-[0.65rem] font-black flex-shrink-0 ${entry.approved ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {entry.approved ? '✓' : i + 1}
              </div>
              <div className="flex-1 text-sm font-bold text-slate-900">{entry.word ?? entry.answer}</div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${entry.approved ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {entry.approved ? 'Approved' : 'Pending'}
              </span>
              {!entry.approved && (
                <button
                  onClick={(e) => { e.stopPropagation(); onApprove(entry.id ?? i) }}
                  className="px-2.5 py-1 border border-emerald-200 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg flex-shrink-0"
                >
                  Approve
                </button>
              )}
            </div>
            {expanded === i && (
              <div className="px-3.5 pb-3.5 border-t border-slate-100">
                <div className="flex flex-col gap-1.5 mt-3">
                  {(entry.hints ?? []).map((hint, hi) => (
                    <div key={hi} className="flex gap-2 items-start">
                      <div className="w-5 h-5 bg-slate-100 rounded-[5px] flex items-center justify-center text-[0.6rem] font-black text-slate-500 flex-shrink-0 mt-0.5">{hi + 1}</div>
                      <div className="text-xs text-slate-600 leading-[1.5]">{hint}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Create `src/components/create/MyGamesList.jsx`**

```jsx
const STATUS_BADGE = {
  published: 'bg-emerald-100 text-emerald-600',
  review:    'bg-amber-100 text-amber-600',
  generating:'bg-amber-100 text-amber-600',
  local:     'bg-slate-100 text-slate-500',
}
const STATUS_LABEL = { published: 'Published', review: 'Pending review', generating: 'Generating…', local: 'Local' }
const CAT_ICONS = { Geography: '🌍', 'Pop Culture': '🎬', Science: '🔬', Sports: '🏅', History: '📚', Music: '🎵' }

export default function MyGamesList({ games = [], onReview, onPlay, onShare, onStatus, onNewGame }) {
  return (
    <div className="max-w-[600px] mx-auto px-5 py-7">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wide">My Games</span>
        <button onClick={onNewGame} className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg">+ New Game</button>
      </div>

      {games.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm font-medium">
          No games yet. Create your first one above!
        </div>
      )}

      <div className="flex flex-col gap-2">
        {games.map((game) => {
          const status = game.status ?? 'local'
          return (
            <div key={game.id ?? game.gameName} className="bg-white border border-slate-200 rounded-xl px-3.5 py-3 flex items-center gap-3">
              <div className="text-xl flex-shrink-0">{CAT_ICONS[game.category] ?? '📂'}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">{game.gameName ?? game.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{game.category} · {game.entryCount ?? '?'} entries</div>
              </div>
              <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_BADGE[status] ?? STATUS_BADGE.local}`}>
                {STATUS_LABEL[status] ?? status}
              </span>
              <div className="flex gap-1.5 flex-shrink-0">
                {status === 'review'     && <button onClick={() => onReview(game)} className="px-2.5 py-1 border border-slate-200 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg">Review</button>}
                {status === 'published'  && <><button onClick={() => onPlay(game)} className="px-2.5 py-1 border border-slate-200 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg">Play</button><button onClick={() => onShare(game)} className="px-2.5 py-1 border border-slate-200 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg">Share</button></>}
                {status === 'generating' && <button onClick={() => onStatus(game)} className="px-2.5 py-1 border border-slate-200 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg">Status</button>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/create/
git commit -m "feat: add Create mode components (form, job status, review, my games)"
```

---

## Task 12: Wire everything into App.jsx

This is the integration task. App.jsx becomes a thin routing shell. All API fetch logic, URL constants, and normalize helpers stay in App.jsx — they are passed as props or called inside App.jsx and passed down as data. No logic moves to other files; only rendering moves to components.

**Files:**
- Modify: `src/App.jsx`

- [ ] **Read the current App.jsx routing/state structure**

```bash
# Count lines in App.jsx to confirm it's the monolith
wc -l src/App.jsx
```

- [ ] **Replace App.jsx with the new shell**

The new App.jsx keeps ALL existing constants, normalize helpers, and API fetch functions. It adds:
1. `appMode` state: `'play'` | `'create'`
2. `playMode` state: `'solo'` | `'group'`
3. `groupStep` state: `'setup'` | `'lobby'` | `'playing'` | `'results'`
4. `sessionId` + `nickname` passed into `useGroupSession`
5. Renders the appropriate screen component based on state

Replace the JSX return value of the top-level component with:

```jsx
// At the top of App.jsx, add these imports after existing imports:
import AppHeader from './components/layout/AppHeader'
import PlayScreen from './components/gameplay/PlayScreen'
import GroupSetup from './components/group/GroupSetup'
import Lobby from './components/group/Lobby'
import EntryResults from './components/group/EntryResults'
import WaitingBanner from './components/group/WaitingBanner'
import PlayerStrip from './components/group/PlayerStrip'
import CreateForm from './components/create/CreateForm'
import JobStatus from './components/create/JobStatus'
import ReviewEntries from './components/create/ReviewEntries'
import MyGamesList from './components/create/MyGamesList'
import useGroupSession from './hooks/useGroupSession'
```

Add new state variables inside the App component (alongside existing state):
```jsx
const [appMode, setAppMode] = useState('play')   // 'play' | 'create'
const [playMode, setPlayMode] = useState('solo')  // 'solo' | 'group'
const [groupStep, setGroupStep] = useState('setup') // 'setup'|'lobby'|'playing'|'results'
const [sessionId, setSessionId] = useState(null)
const [groupEntryResults, setGroupEntryResults] = useState(null)

const { session, isHost, myPlayer, submit: groupSubmit, advance: groupAdvance, leave: groupLeave } = useGroupSession(sessionId, nickname)
```

Replace the existing JSX `return (...)` block with:
```jsx
return (
  <div className="min-h-screen" style={{ background: 'var(--color-page-bg)' }}>
    {/* Nickname gate — keep existing logic */}
    {!nickname && (
      /* existing nickname entry UI — keep as-is */
    )}

    {nickname && (
      <>
        <AppHeader
          crumbs={buildBreadcrumbs()}   /* see helper below */
          mode={playMode}
          onModeChange={(m) => { setPlayMode(m); if (m === 'group') setGroupStep('setup') }}
          nickname={nickname}
          appMode={appMode}
          onAppModeChange={setAppMode}
        />

        {appMode === 'create' && (
          <div>
            <MyGamesList
              games={createdGames}
              onNewGame={() => setCreateView('form')}
              onReview={(g) => { setSelectedReviewGame(g); setCreateView('review') }}
              onPlay={(g) => { setAppMode('play'); /* load game */ }}
              onShare={handleShare}
              onStatus={(g) => { setCreateJobId(g.jobId); setCreateView('status') }}
            />
            {createView === 'form' && (
              <CreateForm
                categories={systemCategories.map((c) => c.name)}
                onSubmit={handleCreateSubmit}
                loading={creatingGame}
              />
            )}
            {createView === 'status' && createJobStatus && (
              <JobStatus job={createJobStatus} onRefresh={handleRefreshJob} onBack={() => setCreateView('list')} />
            )}
            {createView === 'review' && (
              <ReviewEntries
                game={selectedReviewGame}
                entries={stagingEntries}
                onApprove={handleApproveEntry}
                onApproveAll={handleApproveAll}
              />
            )}
          </div>
        )}

        {appMode === 'play' && playMode === 'solo' && (
          <PlayScreen
            gameEntries={gameEntries}
            gameName={selectedGame?.name ?? ''}
            category={selectedCategory ?? ''}
            suggestions={wordSuggestions}
            onFetchSuggestions={fetchWordSuggestions}
          />
        )}

        {appMode === 'play' && playMode === 'group' && groupStep === 'setup' && (
          <GroupSetup
            nickname={nickname}
            categories={systemCategories.map((c) => c.name)}
            onSessionCreated={(data) => { setSessionId(data.sessionId); setGroupStep('lobby') }}
            onSessionJoined={(data) => { setSessionId(data.sessionId); setGroupStep('lobby') }}
          />
        )}

        {appMode === 'play' && playMode === 'group' && groupStep === 'lobby' && (
          <Lobby
            session={session}
            nickname={nickname}
            isHost={isHost}
            onStart={() => setGroupStep('playing')}
            onLeave={async () => { await groupLeave(); setGroupStep('setup'); setSessionId(null) }}
          />
        )}

        {appMode === 'play' && playMode === 'group' && groupStep === 'playing' && (
          /* PlayScreen with group overlay */
          <div>
            {session && (
              <div className="max-w-[720px] mx-auto px-5 pt-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 mb-3">
                  <div className="flex justify-between mb-2.5 text-sm font-bold text-slate-900">
                    <span>{session.gameName}</span>
                    <span className="text-slate-400">Entry {session.currentEntry} / {session.totalEntries}</span>
                  </div>
                  <PlayerStrip players={session.players} myName={nickname} />
                </div>
                {myPlayer?.submitted && !session.revealReady && (
                  <WaitingBanner
                    submittedNames={session.players.filter((p) => p.submitted && p.name !== nickname).map((p) => p.name)}
                    pendingNames={session.players.filter((p) => !p.submitted).map((p) => p.name)}
                  />
                )}
              </div>
            )}
            <PlayScreen
              gameEntries={gameEntries}
              gameName={selectedGame?.name ?? ''}
              category={selectedCategory ?? ''}
              suggestions={wordSuggestions}
              onFetchSuggestions={fetchWordSuggestions}
            />
          </div>
        )}

        {appMode === 'play' && playMode === 'group' && groupStep === 'results' && (
          <EntryResults
            answer={groupEntryResults?.answer ?? ''}
            players={session?.players ?? []}
            myName={nickname}
            isHost={isHost}
            onNext={async () => { await groupAdvance(); setGroupStep('playing') }}
            onLeave={async () => { await groupLeave(); setGroupStep('setup'); setSessionId(null) }}
          />
        )}
      </>
    )}
  </div>
)
```

Add the `buildBreadcrumbs` helper inside App component:
```jsx
const buildBreadcrumbs = () => {
  const crumbs = [{ label: 'All Games', onClick: () => { setSelectedGame(null); setSelectedCategory(null) } }]
  if (selectedCategory) crumbs.push({ label: selectedCategory, onClick: () => setSelectedGame(null) })
  if (selectedGame) crumbs.push({ label: selectedGame.name, onClick: null })
  return crumbs
}
```

Add state variables for create mode (alongside existing state):
```jsx
const [createView, setCreateView] = useState('list') // 'list' | 'form' | 'status' | 'review'
const [selectedReviewGame, setSelectedReviewGame] = useState(null)
```

- [ ] **Run dev server and smoke-test**

```bash
npm run dev
```

Check these paths manually in browser:
1. Open `http://localhost:5173` — nickname screen appears
2. Enter nickname — header with breadcrumb + Play/Create toggle appears
3. Play mode → select a category and game — game loads and hints render
4. Input a wrong answer — hint turns red with inline wrong tag
5. Input correct answer — CorrectState card appears with Next button
6. Switch to Create mode — MyGamesList and CreateForm appear
7. Switch to Group mode — GroupSetup tabs appear

- [ ] **Run all tests**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire all components into App.jsx routing shell"
```

---

## Task 13: Polish — CSS cleanup + mobile sticky input

**Files:**
- Modify: `src/index.css`

- [ ] **Replace all custom CSS classes in `index.css` that are no longer used**

After Task 12, the following classes in `src/index.css` are no longer needed (they were part of the old layout):
- `.category-panel`, `.category-panel-summary`, `.category-panel-content`
- `.category-owner-title`
- `.game-chip`
- `.play-stack`
- `.hints-grid`
- `.category-picker-button`
- `.next-fab-portal`, `.next-fab-image`, `.next-inline`
- `.play-action-row`

Remove them from `src/index.css`. Keep only:
- `@import 'tailwindcss'`
- `@import './tokens.css'`
- `:root` font/rendering settings
- `* { box-sizing: border-box }`
- `body { margin: 0; min-height: 100vh }`
- `button, input { font: inherit }`

Add mobile sticky input rule:
```css
@media (max-width: 640px) {
  .input-card-sticky {
    position: sticky;
    bottom: 0;
    z-index: 10;
    background: var(--color-page-bg);
    padding-bottom: max(12px, env(safe-area-inset-bottom));
  }
}
```

Then add `input-card-sticky` class to the wrapping `<div>` around `<InputCard>` in `PlayScreen.jsx`:
```jsx
<div className="mt-4 input-card-sticky">
  {/* InputCard or CorrectState */}
</div>
```

- [ ] **Run dev server — verify mobile layout**

Open browser DevTools → toggle mobile viewport (375px width). Confirm:
- Input card sticks to the bottom of the screen while scrolling through hints
- No horizontal overflow

- [ ] **Commit**

```bash
git add src/index.css src/components/gameplay/PlayScreen.jsx
git commit -m "polish: remove legacy CSS, add mobile sticky input"
```

---

## Task 14: Final test pass + lint

- [ ] **Run full test suite**

```bash
npx vitest run --reporter=verbose
```

Expected output: all tests pass. Note failing tests and fix before proceeding.

- [ ] **Run linter**

```bash
npm run lint
```

Fix any errors reported. Common issues to expect:
- Unused imports in App.jsx (remove them)
- Missing prop-types (ignore — project doesn't use prop-types)
- React Hook dependency warnings (add missing deps or annotate with `// eslint-disable-line`)

- [ ] **Build check**

```bash
npm run build
```

Expected: build succeeds with no errors. Warnings about bundle size are acceptable.

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat: complete UX redesign — solo + group play + create mode"
```
