import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createAdvisor, updateAdvisor } from '../domain/commands/advisor-commands'
import { createStudent } from '../domain/commands/student-commands'
import { createLocalDocumentStorage } from '../storage/local-storage'
import { documentWithAdvisor, documentWithStudent } from '../test/fixtures'
import { render } from '../test/render'
import { App } from './App'

const browserStorage = () => createLocalDocumentStorage(window.localStorage)

function openBoard(document = documentWithAdvisor(), step = 'students') {
  browserStorage().save(document)
  window.history.replaceState(null, '', `#/boards/board-1/${step}`)
  return render(<App />)
}

describe('student setup', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState(null, '', '#/')
  })

  it('adds a student with keyboard-ordered fields, preferences, and previous history', async () => {
    const user = userEvent.setup()
    const first = openBoard()
    const form = screen.getByRole('region', { name: 'Add student' })
    const givenName = within(form).getByRole('textbox', { name: /First name/ })
    const familyName = within(form).getByRole('textbox', { name: /Last name/ })
    const stage = within(form).getByRole('combobox', { name: 'Program stage' })
    const preferences = within(form).getByRole('combobox', { name: /Requested advisors/ })
    const history = within(form).getByRole('textbox', { name: /Previous advisors/ })

    givenName.focus()
    await user.keyboard('Avery')
    await user.tab()
    expect(familyName).toHaveFocus()
    await user.keyboard('Stone')
    await user.tab()
    expect(stage).toHaveFocus()
    await user.selectOptions(stage, 'essay')
    await user.tab()
    expect(preferences).toHaveFocus()
    await user.type(preferences, 'Morgan')
    await user.keyboard('{ArrowDown}{Enter}')
    await user.tab()
    expect(history).toHaveFocus()
    await user.type(history, '  MORGAN   lee, Former Advisor')
    await user.tab()
    expect(within(form).getByRole('button', { name: 'Add student' })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(await screen.findByText('Avery Stone')).toBeInTheDocument()
    expect(screen.getByLabelText('Morgan Lee: Excluded from matching')).toBeInTheDocument()
    expect(screen.getByLabelText('MORGAN lee: Excluded from matching')).toBeInTheDocument()
    expect(screen.getByLabelText('Former Advisor: Not active')).toBeInTheDocument()
    expect(givenName).toHaveFocus()
    first.unmount()

    render(<App />)
    expect(screen.getByText('Avery Stone')).toBeInTheDocument()
  })

  it('requires a choice when duplicate advisors match a history name', async () => {
    const user = userEvent.setup()
    const duplicateAdvisors = createAdvisor(documentWithAdvisor(), {
      id: 'advisor-2', boardId: 'board-1', givenName: 'Morgan', familyName: 'Lee', capacity: 2,
    })
    openBoard(duplicateAdvisors)
    const form = screen.getByRole('region', { name: 'Add student' })
    await user.type(within(form).getByRole('textbox', { name: /First name/ }), 'Avery')
    await user.type(within(form).getByRole('textbox', { name: /Last name/ }), 'Stone')
    await user.type(within(form).getByRole('textbox', { name: /Previous advisors/ }), 'morgan lee')
    await user.click(within(form).getByRole('button', { name: 'Add student' }))

    expect(screen.getByText('Choose the matching advisor')).toBeInTheDocument()
    const choice = screen.getByRole('combobox', { name: 'Which current advisor matches “morgan lee”?' })
    await user.selectOptions(choice, 'advisor-2')
    await user.click(within(form).getByRole('button', { name: 'Add student' }))

    await screen.findByText('Avery Stone')
    const loaded = browserStorage().load()
    expect(loaded.status).toBe('loaded')
    if (loaded.status === 'loaded') {
      expect(Object.values(loaded.document.previousAdvisingRelationships)[0]?.matchedCurrentAdvisorId).toBe('advisor-2')
    }
  })

  it('edits and removes a student through scoped dialogs', async () => {
    const user = userEvent.setup()
    openBoard(documentWithStudent())
    await user.click(screen.getByRole('button', { name: 'Edit student Avery Stone' }))
    const editDialog = await screen.findByRole('dialog', { name: 'Edit Avery Stone' })
    const familyName = within(editDialog).getByRole('textbox', { name: /Last name/ })
    await user.clear(familyName)
    await user.type(familyName, 'Stones')
    await user.selectOptions(within(editDialog).getByRole('combobox', { name: 'Program stage' }), 'final')
    await user.click(within(editDialog).getByRole('button', { name: 'Save student' }))

    expect(await screen.findByText('Avery Stones')).toBeInTheDocument()
    expect(screen.getByLabelText('Program stage: Final semester')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete student Avery Stones' }))
    const deleteDialog = await screen.findByRole('dialog', { name: 'Delete student “Avery Stones”?' })
    await user.click(within(deleteDialog).getByRole('button', { name: 'Delete student' }))
    await waitFor(() => expect(screen.queryByText('Avery Stones')).not.toBeInTheDocument())
  })

  it('warns when students exceed total advisor capacity', () => {
    const capacityOne = updateAdvisor(documentWithAdvisor(), 'advisor-1', {
      givenName: 'Morgan', familyName: 'Lee', capacity: 1,
    })
    const first = createStudent(capacityOne, {
      id: 'student-1', boardId: 'board-1', givenName: 'A', familyName: 'One', programStage: 'first',
      studentRequestedAdvisorIds: [], previousAdvisors: [],
    })
    const second = createStudent(first, {
      id: 'student-2', boardId: 'board-1', givenName: 'B', familyName: 'Two', programStage: 'second',
      studentRequestedAdvisorIds: [], previousAdvisors: [],
    })
    openBoard(second, 'review')
    expect(screen.getByRole('alert')).toHaveTextContent('2 students · 1 advisor slot. Add 1 slot.')
  })
})
