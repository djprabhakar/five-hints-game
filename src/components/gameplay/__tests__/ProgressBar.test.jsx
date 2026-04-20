import { render, screen } from '@testing-library/react'
import ProgressBar from '../ProgressBar'

test('shows current and total entries', () => {
  render(<ProgressBar current={7} total={20} />)
  expect(screen.getByText(/7 of 20/i)).toBeInTheDocument()
})

test('shows remaining count', () => {
  render(<ProgressBar current={7} total={20} />)
  expect(screen.getByText(/13 remaining/i)).toBeInTheDocument()
})
