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
