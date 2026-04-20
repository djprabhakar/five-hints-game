import { render, screen } from '@testing-library/react'
import StatsRow from '../StatsRow'

test('renders solved count', () => {
  render(<StatsRow solved={5} points={17} streak={3} />)
  expect(screen.getByText('5')).toBeInTheDocument()
})

test('renders points', () => {
  render(<StatsRow solved={5} points={17} streak={3} />)
  expect(screen.getByText('17')).toBeInTheDocument()
})

test('renders streak', () => {
  render(<StatsRow solved={5} points={17} streak={3} />)
  expect(screen.getByText('3')).toBeInTheDocument()
})
