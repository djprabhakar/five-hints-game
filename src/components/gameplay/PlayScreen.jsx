import { useEffect } from 'react'
import StatsRow from './StatsRow'
import ProgressBar from './ProgressBar'
import HintStack from './HintStack'
import InputCard from './InputCard'
import WrongMessage from './WrongMessage'
import CorrectState from './CorrectState'
import WelcomeDashboard from '../layout/WelcomeDashboard'
import { useAutoComplete } from '../../hooks/useAutoComplete'

export default function PlayScreen({ gameSession, hiddenOverflowPanels, nickname, categories, onCategorySelect }) {
  const {
    entry,
    session,
    inputValue,
    setInputValue,
    submitGuess,
    revealNextHint,
    nextEntry,
    hasMore,
    gameSummary,
  } = gameSession

  const { suggestions, commit: commitSuggestion, reset: resetSuggestions } = useAutoComplete({
    prefix: inputValue,
    category: gameSummary?.category ?? '',
    gameName: gameSummary?.name ?? '',
    createdBy: gameSummary?.createdBy ?? '',
    disabled: entry.finished,
  })

  useEffect(() => { resetSuggestions() }, [entry.game?.id])

  if (!entry.game) {
    return (
      <WelcomeDashboard
        nickname={nickname || 'Player'}
        categories={categories}
        onCategorySelect={onCategorySelect}
      />
    )
  }

  const hints = entry.game.hints
  const wrongGuesses = {}
  entry.guesses.forEach((guess, i) => {
    if (guess && i < entry.currentAttempt && !entry.won) {
      wrongGuesses[i] = guess
    }
  })

  const hintStates = hints.map((_, i) => {
    if (entry.finished && entry.won && i === entry.currentAttempt) return 'correct'
    if (entry.finished && entry.won && i < entry.currentAttempt) return 'revealed'
    if (entry.finished && !entry.won) return i <= entry.currentAttempt ? 'revealed' : 'locked'
    if (i < entry.currentAttempt) return wrongGuesses[i] ? 'wrong' : 'revealed'
    if (i === entry.currentAttempt) return 'active'
    return 'locked'
  })

  const canReveal = !entry.finished && entry.currentAttempt < 4
  const isPanelHidden = (panelId) => hiddenOverflowPanels?.has(panelId)

  return (
    <div className="mx-auto w-full solo-play-shell space-y-2 lg:space-y-4 pb-40 lg:pb-0">
      {session && !isPanelHidden('play-stats') && (
        <StatsRow
          solved={session.solved}
          points={session.totalPoints}
          streak={session.streak}
        />
      )}

      {session && session.totalEntries > 1 && !isPanelHidden('play-progress') && (
        <ProgressBar current={session.currentEntry} total={session.totalEntries} />
      )}

      {entry.game.title && !isPanelHidden('play-title') && (
        <>
          <div className="text-center hidden lg:block">
            {gameSummary?.name && (
              <p className="text-sm font-black text-slate-900">
                {gameSummary.name}
              </p>
            )}
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {entry.game.category}
            </p>
            <h2 className="text-2xl font-black text-slate-900 mt-0.5">{entry.game.title}</h2>
          </div>
          <div className="lg:hidden text-center px-1 max-w-full overflow-hidden">
            {gameSummary?.name && (
              <p className="text-sm font-black text-slate-900 leading-tight line-clamp-1 break-words">
                {gameSummary.name}
              </p>
            )}
            <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500 break-words">
              {entry.game.category}
            </p>
            <h2 className="text-base font-black text-slate-900 mt-0.5 leading-tight line-clamp-2 break-words">
              {entry.game.title}
            </h2>
          </div>
        </>
      )}

      {!isPanelHidden('play-hints') && (
        <HintStack
          hints={hints}
          hintStates={hintStates}
          wrongGuesses={wrongGuesses}
        />
      )}

      {!isPanelHidden('play-response') && (
        entry.finished && entry.won ? (
          <CorrectState
            answer={entry.game.word}
            hintIndex={entry.currentAttempt}
            points={Math.max(5 - entry.currentAttempt, 1)}
            streak={session?.streak ?? 0}
            onNext={hasMore ? nextEntry : undefined}
          />
        ) : entry.finished && !entry.won ? (
          <div className="bg-white border border-slate-200 rounded-[12px] px-5 py-4 text-center space-y-1">
            <div className="text-sm font-semibold text-slate-500">The answer was</div>
            <div className="text-2xl font-black text-slate-900">{entry.game.word}</div>
            {hasMore && (
              <button
                onClick={nextEntry}
                className="mt-3 bg-slate-900 hover:bg-slate-700 text-white font-bold text-sm px-5 py-2.5 rounded-[10px] transition-colors"
              >
                Next
              </button>
            )}
          </div>
        ) : (
          <>
            {entry.lastWrongGuess && (
              <WrongMessage
                guess={entry.lastWrongGuess}
                onDismiss={() => {}}
              />
            )}
            <InputCard
              value={inputValue}
              onChange={(v) => { setInputValue(v) }}
              onSubmit={() => { commitSuggestion(inputValue); submitGuess() }}
              onReveal={revealNextHint}
              attempts={entry.currentAttempt}
              maxAttempts={5}
              canReveal={canReveal}
              suggestions={suggestions}
              onSuggestionSelect={(word) => { commitSuggestion(word); setInputValue(word) }}
            />
          </>
        )
      )}
    </div>
  )
}
