import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEY } from '../storage/local-storage'
import { render } from '../test/render'
import { App } from './App'

describe('semester and board setup', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState(null, '', '#/')
  })

  it('creates a semester and board using the labeled forms', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText('Term'), 'spring')
    await user.clear(screen.getByRole('spinbutton', { name: /Year/ }))
    await user.type(screen.getByRole('spinbutton', { name: /Year/ }), '2027')
    await user.click(screen.getByRole('button', { name: 'Create semester' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Spring 2027' })).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /Board name/ }), 'First Fiction')
    await user.selectOptions(screen.getByLabelText('Genre'), 'fiction')
    await user.click(screen.getByRole('button', { name: 'Create board' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Add advisors' })).toBeInTheDocument()
    expect(window.location.hash).toMatch(/^#\/boards\/.+\/advisors$/)
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('First Fiction')

    await user.click(screen.getByRole('link', { name: /Spring 2027/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Spring 2027' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'First Fiction' })).toBeInTheDocument()
  })

  it('loads saved data after remounting', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await user.clear(screen.getByRole('spinbutton', { name: /Year/ }))
    await user.type(screen.getByRole('spinbutton', { name: /Year/ }), '2028')
    await user.click(screen.getByRole('button', { name: 'Create semester' }))
    await screen.findByRole('heading', { name: 'Spring 2028' })
    first.unmount()

    window.history.replaceState(null, '', '#/')
    render(<App />)
    expect(screen.getByRole('link', { name: 'Spring 2028' })).toBeInTheDocument()
  })

  it('names a board in its deletion confirmation', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.clear(screen.getByRole('spinbutton', { name: /Year/ }))
    await user.type(screen.getByRole('spinbutton', { name: /Year/ }), '2029')
    await user.click(screen.getByRole('button', { name: 'Create semester' }))
    await screen.findByRole('heading', { name: 'Spring 2029' })
    await user.type(screen.getByRole('textbox', { name: /Board name/ }), 'Poetry Group')
    await user.selectOptions(screen.getByLabelText('Genre'), 'poetry')
    await user.click(screen.getByRole('button', { name: 'Create board' }))
    await user.click(await screen.findByRole('link', { name: /Spring 2029/ }))
    await user.click(screen.getByRole('button', { name: 'Delete board Poetry Group' }))

    expect(await screen.findByRole('dialog', { name: 'Delete board “Poetry Group”?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete board' }))
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Poetry Group' })).not.toBeInTheDocument())
  })
})
