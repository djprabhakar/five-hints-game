import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CorrectState from '../CorrectState'

test('shows the correct answer', () => {
  render(<CorrectState answer="Ankara" hintIndex={2} points={3} streak={4} onNext={() => {}} />)
  expect(screen.getByText('Ankara')).toBeInTheDocument()
})

test('shows points earned', () => {
  render(<CorrectState answer="Ankara" hintIndex={2} points={3} streak={4} onNext={() => {}} />)
  expect(screen.getByText(/\+3 points/i)).toBeInTheDocument()
})

test('calls onNext when Next button clicked', async () => {
  const onNext = vi.fn()
  render(<CorrectState answer="Ankara" hintIndex={2} points={3} streak={4} onNext={onNext} />)
  await userEvent.click(screen.getByRole('button', { name: /next/i }))
  expect(onNext).toHaveBeenCalled()
})
