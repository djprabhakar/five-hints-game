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
