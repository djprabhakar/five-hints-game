import HintRow from './HintRow'

export default function HintStack({ hints, hintStates, wrongGuesses = {}, correctGuesses = {} }) {
  return (
    <div className="flex flex-col gap-2 max-w-full overflow-hidden">
      {hints.map((hint, i) => (
        <HintRow
          key={i}
          index={i}
          state={hintStates[i] ?? 'locked'}
          text={hint}
          wrongGuess={wrongGuesses[i]}
          correctGuess={correctGuesses[i]}
        />
      ))}
    </div>
  )
}
