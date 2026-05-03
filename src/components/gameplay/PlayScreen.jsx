import { useState } from 'react'
import StatsRow from './StatsRow'
import ProgressBar from './ProgressBar'
import HintStack from './HintStack'
import InputCard from './InputCard'
import CorrectState from './CorrectState'
import WelcomeDashboard from '../layout/WelcomeDashboard'
import WaitingBanner from '../group/WaitingBanner'
import PlayerStrip from '../group/PlayerStrip'
import { useAutoComplete } from '../../hooks/useAutoComplete'

function GameTitle({ gameName, category, title }) {
  if (!title) return null

  return (
    <>
      <div className="text-center hidden lg:block">
        {gameName && <p className="text-sm font-black text-slate-900">{gameName}</p>}
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{category}</p>
        <h2 className="text-2xl font-black text-slate-900 mt-0.5">{title}</h2>
      </div>
      <div className="lg:hidden text-center px-1 max-w-full overflow-hidden">
        {gameName && <p className="text-sm font-black text-slate-900 leading-tight line-clamp-1 break-words">{gameName}</p>}
        <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500 break-words">{category}</p>
        <h2 className="text-base font-black text-slate-900 mt-0.5 leading-tight line-clamp-2 break-words">{title}</h2>
      </div>
    </>
  )
}

function GroupRound({ groupSession, nickname, hiddenOverflowPanels }) {
  const session = groupSession.session
  const myPlayer = groupSession.myPlayer
  const entry = session.currentEntry
  const [inputValue, setInputValue] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [wrongGuesses, setWrongGuesses] = useState({})
  const [correctGuesses, setCorrectGuesses] = useState({})
  const [submitted, setSubmitted] = useState(() => Boolean(myPlayer?.submitted))
  const [submittedCorrect, setSubmittedCorrect] = useState(() => Boolean(myPlayer?.correct))
  const effectiveSubmitted = submitted || Boolean(myPlayer?.submitted)
  const effectiveSubmittedCorrect = submittedCorrect || Boolean(myPlayer?.correct)

  const { suggestions, commit: commitSuggestion } = useAutoComplete({
    prefix: inputValue,
    category: session?.category ?? '',
    gameName: session?.game ?? '',
    createdBy: session?.gameCreatedBy ?? session?.createdBy ?? '',
    disabled: effectiveSubmitted || session?.revealReady,
  })

  const hints = Array.isArray(entry?.clues) ? entry.clues : []
  const hintStates = hints.map((_, index) => {
    if (session?.revealReady) {
      if (effectiveSubmittedCorrect && index === attempts) return 'correct'
      return index <= attempts ? 'revealed' : 'locked'
    }
    if (effectiveSubmittedCorrect && index === attempts) return 'correct'
    if (effectiveSubmitted) return index <= attempts ? 'revealed' : 'locked'
    if (index < attempts) return wrongGuesses[index] ? 'wrong' : 'revealed'
    if (index === attempts) return 'active'
    return 'locked'
  })
  const isPanelHidden = (panelId) => hiddenOverflowPanels?.has(panelId)

  const submitGroupGuess = async () => {
    const guess = inputValue.trim()
    if (!guess || effectiveSubmitted) return
    const normalizedAnswer = `${entry?.answer ?? ''}`.trim().toLowerCase()
    const isCorrect = Boolean(normalizedAnswer) && guess.toLowerCase() === normalizedAnswer

    commitSuggestion(guess)

    if (isCorrect) {
      setSubmitted(true)
      setSubmittedCorrect(true)
      setCorrectGuesses((current) => ({ ...current, [attempts]: guess }))
      const nextSession = await groupSession.submit(session.currentEntryIndex, guess, attempts)
      const nextPlayer = nextSession?.players?.find((player) => player.name === nickname)
      if (nextPlayer) {
        setSubmitted(Boolean(nextPlayer.submitted))
        setSubmittedCorrect(Boolean(nextPlayer.correct))
        if (nextPlayer.correct && nextPlayer.answer) {
          setCorrectGuesses((current) => ({ ...current, [attempts]: nextPlayer.answer }))
        }
      }
      setInputValue('')
      return
    }

    setWrongGuesses((current) => ({ ...current, [attempts]: guess }))

    if (attempts >= 4) {
      setSubmitted(true)
      setSubmittedCorrect(false)
      const nextSession = await groupSession.submit(session.currentEntryIndex, guess, attempts)
      const nextPlayer = nextSession?.players?.find((player) => player.name === nickname)
      if (nextPlayer) {
        setSubmitted(Boolean(nextPlayer.submitted))
        setSubmittedCorrect(Boolean(nextPlayer.correct))
      }
      setInputValue('')
      return
    }

    setAttempts((current) => Math.min(current + 1, 4))
    setInputValue('')
  }

  if (!entry) {
    return (
      <div className="mx-auto w-full solo-play-shell space-y-4 pb-40 lg:pb-0">
        <div className="bg-white border border-slate-200 rounded-[12px] px-5 py-4 text-center text-sm font-semibold text-slate-500">
          Waiting for the next group round...
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full solo-play-shell space-y-2 lg:space-y-4 pb-40 lg:pb-0">
      {!isPanelHidden('play-stats') && (
        <StatsRow
          solved={session?.players?.filter((player) => player.correct).length ?? 0}
          points={myPlayer?.score ?? 0}
          streak={0}
        />
      )}

      {session?.totalEntries > 1 && !isPanelHidden('play-progress') && (
        <ProgressBar current={(session.currentEntryIndex ?? 0) + 1} total={session.totalEntries} />
      )}

      {!isPanelHidden('play-title') && (
        <GameTitle gameName={session?.game} category={entry.category || session?.category} title={entry.title} />
      )}

      <PlayerStrip players={session?.players ?? []} myName={nickname} />

      {!isPanelHidden('play-hints') && (
        <HintStack hints={hints} hintStates={hintStates} wrongGuesses={wrongGuesses} correctGuesses={correctGuesses} />
      )}

      {!isPanelHidden('play-response') && (
        session?.revealReady ? (
          effectiveSubmittedCorrect ? (
            <CorrectState answer={entry.answer} hintIndex={attempts} points={myPlayer?.entryPoints ?? 0} streak={0} />
          ) : (
            <div className="bg-white border border-slate-200 rounded-[12px] px-5 py-4 text-center space-y-1">
              <div className="text-sm font-semibold text-slate-500">The answer was</div>
              <div className="text-2xl font-black text-slate-900">{entry.answer}</div>
            </div>
          )
        ) : (
          <>
            <WaitingBanner players={session?.players ?? []} myName={nickname} />
            {effectiveSubmitted ? (
              <div className="bg-white border border-slate-200 rounded-[12px] px-5 py-4 text-center space-y-1">
                <div className="text-sm font-semibold text-slate-500">Answer submitted</div>
                <div className="text-base font-bold text-slate-900">Waiting for the other players...</div>
              </div>
            ) : (
              <InputCard
                value={inputValue}
                onChange={setInputValue}
                onSubmit={submitGroupGuess}
                onReveal={() => setAttempts((current) => Math.min(current + 1, 4))}
                attempts={attempts}
                maxAttempts={5}
                canReveal={attempts < 4}
                suggestions={suggestions}
                onSuggestionSelect={(word) => { commitSuggestion(word); setInputValue(word) }}
              />
            )}
          </>
        )
      )}
    </div>
  )
}

function SoloPlayScreen({ gameSession, hiddenOverflowPanels, nickname, categories, onCategorySelect, onPlayDaily }) {
  const { entry, session, inputValue, setInputValue, submitGuess, revealNextHint, nextEntry, hasMore, gameSummary } = gameSession
  const { suggestions, commit: commitSuggestion } = useAutoComplete({
    prefix: inputValue,
    category: gameSummary?.category ?? '',
    gameName: gameSummary?.name ?? '',
    createdBy: gameSummary?.createdBy ?? '',
    disabled: entry.finished,
  })

  if (!entry.game) {
    return (
      <WelcomeDashboard
        nickname={nickname || 'Player'}
        categories={categories}
        onCategorySelect={onCategorySelect}
        onPlayDaily={onPlayDaily}
      />
    )
  }

  const hints = entry.game.hints
  const wrongGuesses = {}
  entry.guesses.forEach((guess, i) => {
    if (guess && i < entry.currentAttempt && !entry.won) wrongGuesses[i] = guess
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
      {!isPanelHidden('play-stats') && session && <StatsRow solved={session.solved} points={session.totalPoints} streak={session.streak} />}
      {session && session.totalEntries > 1 && !isPanelHidden('play-progress') && <ProgressBar current={session.currentEntry} total={session.totalEntries} />}
      {!isPanelHidden('play-title') && <GameTitle gameName={gameSummary?.name} category={entry.game.category} title={entry.game.title} />}
      {!isPanelHidden('play-hints') && <HintStack hints={hints} hintStates={hintStates} wrongGuesses={wrongGuesses} />}
      {!isPanelHidden('play-response') && (
        entry.finished && entry.won ? (
          <CorrectState answer={entry.game.word} hintIndex={entry.currentAttempt} points={Math.max(5 - entry.currentAttempt, 1)} streak={session?.streak ?? 0} onNext={hasMore ? nextEntry : undefined} />
        ) : entry.finished && !entry.won ? (
          <div className="bg-white border border-slate-200 rounded-[12px] px-5 py-4 text-center space-y-1">
            <div className="text-sm font-semibold text-slate-500">The answer was</div>
            <div className="text-2xl font-black text-slate-900">{entry.game.word}</div>
            {hasMore && (
              <button onClick={nextEntry} className="mt-3 bg-slate-900 hover:bg-slate-700 text-white font-bold text-sm px-5 py-2.5 rounded-[10px] transition-colors">
                Next
              </button>
            )}
          </div>
        ) : (
          <>
            <InputCard
              value={inputValue}
              onChange={setInputValue}
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

export default function PlayScreen(props) {
  const { groupSession } = props
  if (groupSession?.session?.status === 'InProgress') {
    return (
      <GroupRound
        key={`${groupSession.session?.sessionId ?? 'group'}-${groupSession.session?.currentEntryIndex ?? 0}`}
        groupSession={groupSession}
        nickname={props.nickname}
        hiddenOverflowPanels={props.hiddenOverflowPanels}
      />
    )
  }
  return <SoloPlayScreen {...props} />
}
