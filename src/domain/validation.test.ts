import { describe, expect, it } from 'vitest'
import type { AppDocument } from './app-document'
import { parseAppDocument } from './validation/app-document-validator'
import { documentWithBoard, documentWithSemester } from '../test/fixtures'

function changed(change: (document: AppDocument) => void): AppDocument {
  const document = structuredClone(documentWithBoard())
  change(document)
  return document
}

describe('application document validation', () => {
  it('accepts valid empty and populated documents', () => {
    expect(parseAppDocument(documentWithSemester())).toEqual(documentWithSemester())
    expect(parseAppDocument(documentWithBoard())).toEqual(documentWithBoard())
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
    ['missing referenced board', changed((document) => { delete document.boards['board-1'] })],
    ['wrong board owner', changed((document) => { document.boards['board-1']!.semesterId = 'other' })],
    ['orphan board', changed((document) => { document.semesters['semester-1']!.boardIds = [] })],
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
