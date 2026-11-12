import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createLocalDocumentStorage } from '../storage/local-storage'
import { documentWithAdvisor, documentWithBoard } from '../test/fixtures'
import { render } from '../test/render'
import { App } from './App'

function openBoard(withAdvisor = false) {
  createLocalDocumentStorage(window.localStorage).save(
    withAdvisor ? documentWithAdvisor() : documentWithBoard(),
  )
  window.history.replaceState(null, '', '#/boards/board-1')
  return render(<App />)
}

describe('advisor setup', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState(null, '', '#/')
  })

  it('supports keyboard entry, defaults capacity to three, restores focus, and persists', async () => {
    const user = userEvent.setup()
    const first = openBoard()
    const givenName = screen.getByRole('textbox', { name: /Given name/ })
    const familyName = screen.getByRole('textbox', { name: /Family name/ })
    const capacity = screen.getByRole('textbox', { name: /Capacity/ })

    givenName.focus()
    await user.keyboard('Alex')
    await user.tab()
    expect(familyName).toHaveFocus()
    await user.keyboard('Rivera')
    await user.tab()
    expect(capacity).toHaveFocus()
    expect(capacity).toHaveValue('3')
    await user.tab()
    expect(screen.getByRole('button', { name: 'Add advisor' })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(await screen.findByText('Alex Rivera')).toBeInTheDocument()
    expect(screen.getByText('1 advisor · 3 total slots')).toBeInTheDocument()
    expect(givenName).toHaveFocus()
    first.unmount()

    render(<App />)
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument()
  })

  it.each(['', '0', '-1', '1.5'])('shows inline feedback for capacity %j', async (invalidCapacity) => {
    const user = userEvent.setup()
    openBoard()
    await user.type(screen.getByRole('textbox', { name: /Given name/ }), 'Alex')
    await user.type(screen.getByRole('textbox', { name: /Family name/ }), 'Rivera')
    const capacity = screen.getByRole('textbox', { name: /Capacity/ })
    await user.clear(capacity)
    if (invalidCapacity) await user.type(capacity, invalidCapacity)
    await user.click(screen.getByRole('button', { name: 'Add advisor' }))

    expect(screen.getByText('Enter a whole number of at least 1.')).toBeInTheDocument()
    expect(screen.queryByText('Alex Rivera')).not.toBeInTheDocument()
  })

  it('edits and removes an advisor through scoped dialogs', async () => {
    const user = userEvent.setup()
    openBoard(true)
    await user.click(screen.getByRole('button', { name: 'Edit advisor Morgan Lee' }))
    const editDialog = await screen.findByRole('dialog', { name: 'Edit Morgan Lee' })
    const familyName = within(editDialog).getByRole('textbox', { name: /Family name/ })
    const capacity = within(editDialog).getByRole('textbox', { name: /Capacity/ })
    await user.clear(familyName)
    await user.type(familyName, 'Li')
    await user.clear(capacity)
    await user.type(capacity, '5')
    await user.click(within(editDialog).getByRole('button', { name: 'Save advisor' }))

    expect(await screen.findByText('Morgan Li')).toBeInTheDocument()
    expect(screen.getByText('Capacity: 5')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete advisor Morgan Li' }))
    const deleteDialog = await screen.findByRole('dialog', { name: 'Delete advisor “Morgan Li”?' })
    await user.click(within(deleteDialog).getByRole('button', { name: 'Delete advisor' }))
    await waitFor(() => expect(screen.queryByText('Morgan Li')).not.toBeInTheDocument())
    expect(screen.getByText('No advisors have been added.')).toBeInTheDocument()
  })
})
