import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createLocalDocumentStorage } from '../storage/local-storage'
import { documentReadyForPairing } from '../test/fixtures'
import { render } from '../test/render'
import { App } from './App'

const storage = () => createLocalDocumentStorage(window.localStorage)

function openReview() {
  storage().save(documentReadyForPairing())
  window.history.replaceState(null, '', '#/boards/board-1/review')
  return render(<App />)
}

describe('first pairing pass', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState(null, '', '#/')
  })

  it('records a request separately, confirms it, consumes capacity, and restores after refresh', async () => {
    const user = userEvent.setup()
    const first = openReview()
    await user.click(screen.getByRole('button', { name: 'Proceed to pairing' }))

    expect(await screen.findByRole('heading', { name: 'Avery Alpha' })).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Add request from Morgan Lee' }))
    expect(screen.getByRole('button', { name: 'Confirm Morgan Lee' })).toBeInTheDocument()
    const requestedState = storage().load()
    expect(requestedState.status).toBe('loaded')
    if (requestedState.status === 'loaded') expect(requestedState.document.assignments).toEqual({})

    await user.click(screen.getByRole('button', { name: 'Confirm Morgan Lee' }))
    expect(await screen.findByRole('heading', { name: 'Zoe Zulu' })).toBeInTheDocument()
    expect(screen.getByText('Full')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Add request from Morgan Lee' })).toBeDisabled()

    first.unmount()
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Zoe Zulu' })).toBeInTheDocument()
    expect(screen.getByText('Student 2 of 2')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Add request from Robin Shah' }))
    await user.click(screen.getByRole('button', { name: 'Confirm Robin Shah' }))
    expect(await screen.findByText('Pairing complete')).toBeInTheDocument()
    expect(screen.queryByText('Morgan Lee · Full')).not.toBeInTheDocument()
    expect(screen.getAllByText('Morgan Lee')).not.toHaveLength(0)
    expect(screen.getAllByText('Robin Shah')).not.toHaveLength(0)
    expect(screen.getByText('1st semester')).toBeInTheDocument()
    expect(screen.getByText('Final semester')).toBeInTheDocument()
  })

  it('starts in last-name order and defers multiple and no requests', async () => {
    const user = userEvent.setup()
    openReview()
    await user.click(screen.getByRole('button', { name: 'Proceed to pairing' }))

    expect(await screen.findByRole('heading', { name: 'Avery Alpha' })).toBeInTheDocument()
    const requests = screen.getByRole('region', { name: 'Advisor requests' })
    await user.click(within(requests).getByRole('checkbox', { name: 'Add request from Morgan Lee' }))
    await user.click(within(requests).getByRole('checkbox', { name: 'Add request from Robin Shah' }))
    expect(screen.queryByRole('button', { name: /Confirm/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Defer student' }))

    expect(await screen.findByRole('heading', { name: 'Zoe Zulu' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Defer student' }))
    expect(await screen.findByText('First pass complete')).toBeInTheDocument()
    expect(screen.getByText('0 assigned · 2 unresolved')).toBeInTheDocument()
    expect(screen.getAllByText('Morgan Lee')).not.toHaveLength(0)
    expect(screen.getByText('No requests')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Resolve Zoe Zulu' }))
    expect(await screen.findByText('Resolve pairing')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Select Robin Shah' }))
    await user.click(screen.getByRole('button', { name: 'Confirm pairing' }))
    expect(await screen.findByText('1 assigned · 1 unresolved')).toBeInTheDocument()
    expect(screen.getByText('Robin Shah')).toBeInTheDocument()
    expect(screen.getByText('1st semester')).toBeInTheDocument()
    expect(screen.getByText('Final semester')).toBeInTheDocument()
    expect(screen.queryByText('Robin Shah · Full')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Start another pass' }))
    expect(await screen.findByRole('heading', { name: 'Avery Alpha' })).toBeInTheDocument()
    expect(screen.getByText('Student 1 of 1')).toBeInTheDocument()
  })
})
