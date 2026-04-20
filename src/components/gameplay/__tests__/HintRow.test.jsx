import { render, screen } from '@testing-library/react'
import HintRow from '../HintRow'

test('renders locked state with hint label', () => {
  render(<HintRow index={0} state="locked" text="" />)
  expect(screen.getByText('Hint 1')).toBeInTheDocument()
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
  expect(screen.getByText(/correct/i)).toBeInTheDocument()
})
