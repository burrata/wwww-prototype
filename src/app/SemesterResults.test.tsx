import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createBoard } from '../domain/commands/board-commands'
import { createAdvisor } from '../domain/commands/advisor-commands'
import {
  completeBoardPairing,
  confirmSoleRequest,
  setAdvisorRequest,
  startBoardPairing,
} from '../domain/commands/pairing-commands'
import { createStudent } from '../domain/commands/student-commands'
import { createLocalDocumentStorage } from '../storage/local-storage'
import { documentReadyForPairing, documentWithBoard } from '../test/fixtures'
import { render } from '../test/render'
import { App } from './App'

function completedFictionWithIncompletePoetry() {
  let document = startBoardPairing(documentReadyForPairing(), 'board-1')
  document = setAdvisorRequest(document, {
    boardId: 'board-1', studentId: 'student-2', advisorId: 'advisor-1', requested: true, requestedAt: 'now',
  })
  document = confirmSoleRequest(document, {
    id: 'assignment-1', boardId: 'board-1', studentId: 'student-2', advisorId: 'advisor-1', assignedAt: 'now',
  })
  document = setAdvisorRequest(document, {
    boardId: 'board-1', studentId: 'student-1', advisorId: 'advisor-2', requested: true, requestedAt: 'later',
  })
  document = confirmSoleRequest(document, {
    id: 'assignment-2', boardId: 'board-1', studentId: 'student-1', advisorId: 'advisor-2', assignedAt: 'later',
  })
  document = completeBoardPairing(document, 'board-1')
  return createBoard(document, { id: 'board-2', semesterId: 'semester-1', genre: 'poetry' })
}

function completedFictionAndPoetry() {
  let document = createAdvisor(completedFictionWithIncompletePoetry(), {
    id: 'advisor-3', boardId: 'board-2', givenName: 'Casey', familyName: 'Ng', capacity: 1,
  })
  document = createStudent(document, {
    id: 'student-3', boardId: 'board-2', givenName: 'Sam', familyName: 'Rivera', programStage: 'second',
    studentRequestedAdvisorIds: [], previousAdvisors: [],
  })
  document = startBoardPairing(document, 'board-2')
  document = setAdvisorRequest(document, {
    boardId: 'board-2', studentId: 'student-3', advisorId: 'advisor-3', requested: true, requestedAt: 'now',
  })
  document = confirmSoleRequest(document, {
    id: 'assignment-3', boardId: 'board-2', studentId: 'student-3', advisorId: 'advisor-3', assignedAt: 'now',
  })
  return completeBoardPairing(document, 'board-2')
}

function openSemester(document: ReturnType<typeof documentWithBoard>) {
  createLocalDocumentStorage(window.localStorage).save(document)
  window.history.replaceState(null, '', '#/semesters/semester-1')
  return render(<App />)
}

describe('semester results', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState(null, '', '#/')
  })

  it('prints completed boards and omits incomplete boards', async () => {
    const user = userEvent.setup()
    openSemester(completedFictionWithIncompletePoetry())

    expect(screen.getByRole('heading', { name: 'Completed matches' })).toBeInTheDocument()
    expect(screen.getByText('1 of 2 boards complete')).toBeInTheDocument()
    expect(screen.queryByRole('table', { name: 'Spring 2027 - Fiction' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'View completed matches' }))

    expect(await screen.findByRole('heading', { name: 'Semester results' })).toBeInTheDocument()
    const fiction = screen.getByRole('table', { name: 'Spring 2027 - Fiction' })
    expect(within(fiction).getAllByRole('row')).toHaveLength(3)
    expect(screen.queryByRole('table', { name: 'Spring 2027 - Poetry' })).not.toBeInTheDocument()
    expect(screen.getByText('Incomplete boards are not included.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show customizations' }))
    await user.click(screen.getByRole('checkbox', { name: 'Program stage' }))
    expect(within(fiction).queryByRole('columnheader', { name: 'Program stage' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Print all boards / Save PDF' }))
    expect(window.print).toHaveBeenCalledOnce()
  })

  it('waits for one completed board before offering semester printing', () => {
    openSemester(documentWithBoard())

    expect(screen.getByText('0 of 1 boards complete')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View completed matches' })).toBeDisabled()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('optionally starts each additional completed board on a new printed page', async () => {
    const user = userEvent.setup()
    openSemester(completedFictionAndPoetry())
    await user.click(screen.getByRole('button', { name: 'View completed matches' }))

    const fictionSection = (await screen.findByRole('heading', { name: 'Spring 2027 - Fiction' }))
      .closest('.semester-board-results')
    const poetrySection = screen.getByRole('heading', { name: 'Spring 2027 - Poetry' })
      .closest('.semester-board-results')
    expect(fictionSection).not.toHaveClass('print-new-page')
    expect(poetrySection).not.toHaveClass('print-new-page')

    await user.click(screen.getByRole('button', { name: 'Show customizations' }))
    expect(screen.getByRole('heading', { name: 'Preferences' })).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Start each board on a new page' }))
    expect(fictionSection).not.toHaveClass('print-new-page')
    expect(poetrySection).toHaveClass('print-new-page')
  })
})
