import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InputCard from '../InputCard'

test('renders guess input and submit button', () => {
  render(<InputCard value="" onChange={() => {}} onSubmit={() => {}} onReveal={() => {}} attempts={0} maxAttempts={5} />)
  expect(screen.getByPlaceholderText(/type your answer/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /guess/i })).toBeInTheDocument()
})

test('calls onSubmit when form submitted', async () => {
  const onSubmit = vi.fn()
  render(<InputCard value="Ankara" onChange={() => {}} onSubmit={onSubmit} onReveal={() => {}} attempts={0} maxAttempts={5} />)
  await userEvent.click(screen.getByRole('button', { name: /guess/i }))
  expect(onSubmit).toHaveBeenCalled()
})

test('shows attempt count', () => {
  render(<InputCard value="" onChange={() => {}} onSubmit={() => {}} onReveal={() => {}} attempts={2} maxAttempts={5} />)
  expect(screen.getByText(/attempt 3 of 5/i)).toBeInTheDocument()
})

test('shows reveal next hint link', () => {
  render(<InputCard value="" onChange={() => {}} onSubmit={() => {}} onReveal={() => {}} attempts={0} maxAttempts={5} canReveal={true} />)
  expect(screen.getByText(/reveal next hint/i)).toBeInTheDocument()
})
