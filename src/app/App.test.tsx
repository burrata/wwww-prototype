import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { render } from '../test/render'

describe('App shell', () => {
  it('shows the empty semester list', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Semesters' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('No semesters have been created.'),
    ).toBeInTheDocument()
  })
})
