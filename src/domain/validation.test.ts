import { describe, expect, it } from 'vitest'
import type { AppDocument } from './app-document'
import { parseAppDocument } from './validation/app-document-validator'
import {
  documentReadyForPairing,
  documentWithAdvisor,
  documentWithBoard,
  documentWithSemester,
  documentWithStudent,
} from '../test/fixtures'
import { confirmSoleRequest, setAdvisorRequest, startBoardPairing } from './commands/pairing-commands'

function changed(change: (document: AppDocument) => void): AppDocument {
  const document = structuredClone(documentWithBoard())
  change(document)
  return document
}

function changedAdvisor(change: (document: AppDocument) => void): AppDocument {
  const document = structuredClone(documentWithAdvisor())
  change(document)
  return document
}

function changedStudent(change: (document: AppDocument) => void): AppDocument {
  const document = structuredClone(documentWithStudent())
  change(document)
  return document
}

function pairedDocument(): AppDocument {
  const started = startBoardPairing(documentReadyForPairing(), 'board-1')
  const requested = setAdvisorRequest(started, {
    boardId: 'board-1', studentId: 'student-2', advisorId: 'advisor-1', requested: true, requestedAt: 'now',
  })
  return confirmSoleRequest(requested, {
    id: 'assignment-1', boardId: 'board-1', studentId: 'student-2', advisorId: 'advisor-1', assignedAt: 'now',
  })
}

function changedPairing(change: (document: AppDocument) => void): AppDocument {
  const document = structuredClone(pairedDocument())
  change(document)
  return document
}

describe('application document validation', () => {
  it('accepts valid empty and populated documents', () => {
    expect(parseAppDocument(documentWithSemester())).toEqual(documentWithSemester())
    expect(parseAppDocument(documentWithBoard())).toEqual(documentWithBoard())
    expect(parseAppDocument(documentWithAdvisor())).toEqual(documentWithAdvisor())
    expect(parseAppDocument(documentWithStudent())).toEqual(documentWithStudent())
    expect(parseAppDocument(pairedDocument())).toEqual(pairedDocument())
  })

  it.each([
    ['null', null],
    ['array', []],
    ['wrong schema version', changed((document) => { (document as { schemaVersion: number }).schemaVersion = 2 })],
    ['missing record', changed((document) => { delete (document as unknown as Record<string, unknown>).students })],
    ['bad semester value', changed((document) => { (document.semesters as Record<string, unknown>)['semester-1'] = null })],
    ['mismatched semester ID', changed((document) => { document.semesters['semester-1']!.id = 'other' })],
    ['empty semester ID', changed((document) => { document.semesters['semester-1']!.id = '' })],
    ['noninteger year', changed((document) => { document.semesters['semester-1']!.year = 2027.5 })],
    ['year too low', changed((document) => { document.semesters['semester-1']!.year = 999 })],
    ['year too high', changed((document) => { document.semesters['semester-1']!.year = 10000 })],
    ['bad term', changed((document) => { document.semesters['semester-1']!.term = 'winter' as 'spring' })],
    ['duplicate board reference', changed((document) => { document.semesters['semester-1']!.boardIds.push('board-1') })],
    ['bad board value', changed((document) => { (document.boards as Record<string, unknown>)['board-1'] = null })],
    ['mismatched board ID', changed((document) => { document.boards['board-1']!.id = 'other' })],
    ['empty board semester', changed((document) => { document.boards['board-1']!.semesterId = '' })],
    ['blank board name', changed((document) => { document.boards['board-1']!.name = ' ' })],
    ['bad genre', changed((document) => { document.boards['board-1']!.genre = 'drama' as 'fiction' })],
    ['bad student IDs', changed((document) => { document.boards['board-1']!.studentIds = [4 as unknown as string] })],
    ['bad advisor IDs', changed((document) => { document.boards['board-1']!.advisorIds = [4 as unknown as string] })],
    ['duplicate advisor reference', changedAdvisor((document) => { document.boards['board-1']!.advisorIds.push('advisor-1') })],
    ['missing referenced board', changed((document) => { delete document.boards['board-1'] })],
    ['wrong board owner', changed((document) => { document.boards['board-1']!.semesterId = 'other' })],
    ['orphan board', changed((document) => { document.semesters['semester-1']!.boardIds = [] })],
  ])('rejects %s', (_name, value) => {
    expect(parseAppDocument(value)).toBeNull()
  })

  it.each([
    ['bad assignment', changedPairing((document) => { (document.assignments as unknown as Record<string, unknown>)['assignment-1'] = null })],
    ['mismatched assignment ID', changedPairing((document) => { document.assignments['assignment-1']!.id = 'other' })],
    ['missing assignment advisor', changedPairing((document) => { document.assignments['assignment-1']!.advisorId = 'missing' })],
    ['bad session', changedPairing((document) => { (document.pairingSessions as unknown as Record<string, unknown>)['board-1'] = null })],
    ['wrong session board', changedPairing((document) => { document.pairingSessions['board-1']!.boardId = 'other' })],
    ['missing ordered student', changedPairing((document) => { document.pairingSessions['board-1']!.orderedStudentIds = ['student-1'] })],
    ['cursor past order', changedPairing((document) => { document.pairingSessions['board-1']!.cursor = 3 })],
    ['request from missing advisor', changedPairing((document) => {
      document.pairingSessions['board-1']!.requestsByStudentId['student-2'] = [{ advisorId: 'missing', requestedAt: 'now' }]
    })],
    ['too many undo entries', changedPairing((document) => {
      const session = document.pairingSessions['board-1']!
      session.undoStack = Array.from({ length: 51 }, () => structuredClone(session.undoStack[0]!))
    })],
    ['blank undo label', changedPairing((document) => {
      document.pairingSessions['board-1']!.undoStack[0]!.label = ''
    })],
    ['bad undo session', changedPairing((document) => {
      (document.pairingSessions['board-1']!.undoStack[0] as unknown as Record<string, unknown>).session = null
    })],
    ['bad undo assignments', changedPairing((document) => {
      (document.pairingSessions['board-1']!.undoStack[0] as unknown as Record<string, unknown>).assignments = null
    })],
    ['bad undo assignment value', changedPairing((document) => {
      document.pairingSessions['board-1']!.undoStack[0]!.assignments = [null as never]
    })],
    ['undo assignment from another board', changedPairing((document) => {
      document.pairingSessions['board-1']!.undoStack[0]!.assignments = [{
        ...document.assignments['assignment-1']!, boardId: 'other',
      }]
    })],
  ])('rejects %s', (_name, value) => {
    expect(parseAppDocument(value)).toBeNull()
  })

  it.each([
    ['bad student value', changedStudent((document) => { (document.students as unknown as Record<string, unknown>)['student-1'] = null })],
    ['mismatched student ID', changedStudent((document) => { document.students['student-1']!.id = 'other' })],
    ['blank student name', changedStudent((document) => { document.students['student-1']!.givenName = ' ' })],
    ['bad program stage', changedStudent((document) => { document.students['student-1']!.programStage = 'third' as 'first' })],
    ['missing requested advisor', changedStudent((document) => { document.students['student-1']!.studentRequestedAdvisorIds = ['missing'] })],
    ['duplicate request', changedStudent((document) => { document.students['student-1']!.studentRequestedAdvisorIds.push('advisor-1') })],
    ['orphan student', changedStudent((document) => { document.boards['board-1']!.studentIds = [] })],
    ['bad relationship value', changedStudent((document) => { (document.previousAdvisingRelationships as unknown as Record<string, unknown>)['relationship-1'] = null })],
    ['mismatched relationship ID', changedStudent((document) => { document.previousAdvisingRelationships['relationship-1']!.id = 'other' })],
    ['blank previous advisor name', changedStudent((document) => { document.previousAdvisingRelationships['relationship-1']!.previousAdvisorName = ' ' })],
    ['missing matched advisor', changedStudent((document) => { document.previousAdvisingRelationships['relationship-1']!.matchedCurrentAdvisorId = 'missing' })],
    ['missing relationship', changedStudent((document) => { delete document.previousAdvisingRelationships['relationship-1'] })],
    ['orphan relationship', changedStudent((document) => { document.students['student-1']!.previousAdvisingRelationshipIds = ['relationship-2'] })],
  ])('rejects %s', (_name, value) => {
    expect(parseAppDocument(value)).toBeNull()
  })

  it.each([
    ['bad advisor value', changedAdvisor((document) => { (document.advisors as unknown as Record<string, unknown>)['advisor-1'] = null })],
    ['mismatched advisor ID', changedAdvisor((document) => { document.advisors['advisor-1']!.id = 'other' })],
    ['empty advisor semester', changedAdvisor((document) => { document.advisors['advisor-1']!.semesterId = '' })],
    ['empty advisor board', changedAdvisor((document) => { document.advisors['advisor-1']!.boardId = '' })],
    ['blank advisor given name', changedAdvisor((document) => { document.advisors['advisor-1']!.givenName = ' ' })],
    ['blank advisor family name', changedAdvisor((document) => { document.advisors['advisor-1']!.familyName = ' ' })],
    ['decimal capacity', changedAdvisor((document) => { document.advisors['advisor-1']!.capacity = 1.5 })],
    ['zero capacity', changedAdvisor((document) => { document.advisors['advisor-1']!.capacity = 0 })],
    ['missing advisor entity', changedAdvisor((document) => { delete document.advisors['advisor-1'] })],
    ['advisor on wrong board', changedAdvisor((document) => { document.advisors['advisor-1']!.boardId = 'other' })],
    ['advisor in wrong semester', changedAdvisor((document) => { document.advisors['advisor-1']!.semesterId = 'other' })],
    ['orphan advisor', changedAdvisor((document) => { document.boards['board-1']!.advisorIds = [] })],
  ])('rejects %s', (_name, value) => {
    expect(parseAppDocument(value)).toBeNull()
  })

  it('rejects duplicate semesters and duplicate genres', () => {
    const duplicateSemester = changed((document) => {
      document.semesters.second = { id: 'second', term: 'spring', year: 2027, boardIds: [] }
    })
    expect(parseAppDocument(duplicateSemester)).toBeNull()

    const duplicateGenre = changed((document) => {
      document.boards.second = {
        ...document.boards['board-1']!, id: 'second', name: 'Second', studentIds: [], advisorIds: [],
      }
      document.semesters['semester-1']!.boardIds.push('second')
    })
    expect(parseAppDocument(duplicateGenre)).toBeNull()
  })
})
