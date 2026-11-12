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

describe('first matching pass', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState(null, '', '#/')
  })

  it('records a request separately, confirms it, consumes capacity, and restores after refresh', async () => {
    const user = userEvent.setup()
    const first = openReview()
    await user.click(screen.getByRole('button', { name: 'Proceed to matching' }))

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
    expect(await screen.findByText('All students matched')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Complete board' }))
    expect(await screen.findByText('Matching complete')).toBeInTheDocument()
    expect(screen.queryByText('Morgan Lee · Full')).not.toBeInTheDocument()
    expect(screen.getAllByText('Morgan Lee')).not.toHaveLength(0)
    expect(screen.getAllByText('Robin Shah')).not.toHaveLength(0)
    expect(screen.getByText('1st semester')).toBeInTheDocument()
    expect(screen.getByText('Final semester')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Undo match' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reopen board' }))
    const reopenDialog = await screen.findByRole('dialog', { name: 'Reopen Fiction board?' })
    await user.click(within(reopenDialog).getByRole('button', { name: 'Reopen board' }))
    expect(await screen.findByText('All students matched')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Complete board' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Undo match' })).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Reset matching' }))
    const resetDialog = await screen.findByRole('dialog', { name: 'Reset Fiction matching?' })
    await user.click(within(resetDialog).getByRole('button', { name: 'Reset matching' }))
    expect(await screen.findByRole('heading', { name: 'Review board' })).toBeInTheDocument()
    const resetState = storage().load()
    expect(resetState.status).toBe('loaded')
    if (resetState.status === 'loaded') {
      expect(resetState.document.assignments).toEqual({})
      expect(resetState.document.pairingSessions).toEqual({})
      expect(resetState.document.boards['board-1']?.advisorIds).toHaveLength(2)
      expect(resetState.document.boards['board-1']?.studentIds).toHaveLength(2)
    }
  })

  it('starts in last-name order and defers multiple and no requests', async () => {
    const user = userEvent.setup()
    openReview()
    await user.click(screen.getByRole('button', { name: 'Proceed to matching' }))

    expect(await screen.findByRole('heading', { name: 'Avery Alpha' })).toBeInTheDocument()
    const requests = screen.getByRole('region', { name: 'Advisor requests' })
    await user.click(within(requests).getByRole('checkbox', { name: 'Add request from Morgan Lee' }))
    await user.click(within(requests).getByRole('checkbox', { name: 'Add request from Robin Shah' }))
    expect(screen.queryByRole('button', { name: /Confirm/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Defer student' }))

    expect(await screen.findByRole('heading', { name: 'Zoe Zulu' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Defer student' }))
    expect(await screen.findByText('First pass complete')).toBeInTheDocument()
    expect(screen.getByText('0 matched · 2 unmatched')).toBeInTheDocument()
    expect(screen.getAllByText('Morgan Lee')).not.toHaveLength(0)
    expect(screen.getByText('No requests')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Resolve Zoe Zulu' }))
    expect(await screen.findByText('Resolve match')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Select Robin Shah' }))
    await user.click(screen.getByRole('button', { name: 'Confirm match' }))
    expect(await screen.findByText('1 matched · 1 unmatched')).toBeInTheDocument()
    expect(screen.getByText('Robin Shah')).toBeInTheDocument()
    expect(screen.getByText('1st semester')).toBeInTheDocument()
    expect(screen.getByText('Final semester')).toBeInTheDocument()
    expect(screen.queryByText('Robin Shah · Full')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Undo match' }))
    expect(await screen.findByText('0 matched · 2 unmatched')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resolve Zoe Zulu' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(await screen.findByText('1 matched · 1 unmatched')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Start another pass' }))
    expect(await screen.findByRole('heading', { name: 'Avery Alpha' })).toBeInTheDocument()
    expect(screen.getByText('Student 1 of 1')).toBeInTheDocument()
  })

  it('undoes confirmed matches across a refresh', async () => {
    const user = userEvent.setup()
    const first = openReview()
    await user.click(screen.getByRole('button', { name: 'Proceed to matching' }))
    await user.click(screen.getByRole('checkbox', { name: 'Add request from Morgan Lee' }))
    await user.click(screen.getByRole('button', { name: 'Confirm Morgan Lee' }))
    expect(await screen.findByRole('heading', { name: 'Zoe Zulu' })).toBeInTheDocument()

    first.unmount()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(await screen.findByRole('heading', { name: 'Avery Alpha' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Remove request from Morgan Lee' })).toBeChecked()

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByRole('checkbox', { name: 'Add request from Morgan Lee' })).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
  })
})
