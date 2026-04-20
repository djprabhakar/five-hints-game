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

test('renders fallback when no nickname', () => {
  render(<Avatar nickname="" />)
  expect(screen.getByText('?')).toBeInTheDocument()
})
