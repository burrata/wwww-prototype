import { describe, expect, it } from 'vitest'
import {
  createBoard,
  deleteBoard,
  updateBoard,
} from './commands/board-commands'
import {
  createSemester,
  deleteSemester,
  updateSemester,
} from './commands/semester-commands'
import {
  DomainError,
} from './domain-error'
import { createEmptyDocument } from './app-document'
import { documentReadyForPairing, documentWithBoard, documentWithSemester } from '../test/fixtures'
import { startBoardPairing } from './commands/pairing-commands'

describe('semester commands', () => {
  it('creates and updates a semester without mutating the input', () => {
    const original = createEmptyDocument()
    const created = createSemester(original, { id: 's1', term: 'spring', year: 2027 })
    const updated = updateSemester(created, 's1', { term: 'fall', year: 2028 })

    expect(original.semesters).toEqual({})
    expect(updated.semesters.s1).toMatchObject({ term: 'fall', year: 2028 })
  })

  it('rejects a duplicate term and year without changing the document', () => {
    const document = documentWithSemester()
    expect(() => createSemester(document, { id: 's2', term: 'spring', year: 2027 })).toThrow(DomainError)
    expect(Object.keys(document.semesters)).toEqual(['semester-1'])
  })

  it('deletes a semester and its boards', () => {
    const result = deleteSemester(startBoardPairing(documentReadyForPairing(), 'board-1'), 'semester-1')
    expect(result.semesters).toEqual({})
    expect(result.boards).toEqual({})
    expect(result.advisors).toEqual({})
    expect(result.students).toEqual({})
    expect(result.previousAdvisingRelationships).toEqual({})
    expect(result.assignments).toEqual({})
    expect(result.pairingSessions).toEqual({})
  })

  it('rejects invalid IDs, years, duplicate IDs, missing records, and duplicate updates', () => {
    const document = documentWithSemester()
    expect(() => createSemester(document, { id: '', term: 'fall', year: 2028 })).toThrow('ID')
    expect(() => createSemester(document, { id: 's2', term: 'fall', year: 99 })).toThrow('four-digit')
    expect(() => createSemester(document, { id: 'semester-1', term: 'fall', year: 2028 })).toThrow('ID is already')
    expect(() => updateSemester(document, 'missing', { term: 'fall', year: 2028 })).toThrow('not found')
    expect(() => deleteSemester(document, 'missing')).toThrow('not found')

    const second = createSemester(document, { id: 's2', term: 'fall', year: 2028 })
    expect(() => updateSemester(second, 's2', { term: 'spring', year: 2027 })).toThrow('already exists')
  })
})

describe('board commands', () => {
  it('creates, updates, and deletes a board while maintaining its semester reference', () => {
    const semester = documentWithSemester()
    const created = createBoard(semester, {
      id: 'b1', semesterId: 'semester-1', name: '  First Board  ', genre: 'fiction',
    })
    const updated = updateBoard(created, 'b1', { name: 'Revised', genre: 'poetry' })
    const deleted = deleteBoard(updated, 'b1')

    expect(semester.semesters['semester-1']?.boardIds).toEqual([])
    expect(created.boards.b1?.name).toBe('First Board')
    expect(updated.boards.b1).toMatchObject({ name: 'Revised', genre: 'poetry' })
    expect(deleted.semesters['semester-1']?.boardIds).toEqual([])
    expect(deleted.boards).toEqual({})
  })

  it('deletes the advisors owned by a deleted board', () => {
    const result = deleteBoard(startBoardPairing(documentReadyForPairing(), 'board-1'), 'board-1')
    expect(result.boards).toEqual({})
    expect(result.advisors).toEqual({})
    expect(result.students).toEqual({})
    expect(result.previousAdvisingRelationships).toEqual({})
    expect(result.assignments).toEqual({})
    expect(result.pairingSessions).toEqual({})
  })

  it('rejects duplicate genres and invalid semester references atomically', () => {
    const document = documentWithBoard()
    expect(() => createBoard(document, {
      id: 'b2', semesterId: 'semester-1', name: 'Another', genre: 'fiction',
    })).toThrow('already has a board')
    expect(() => createBoard(document, {
      id: 'b3', semesterId: 'missing', name: 'Poetry', genre: 'poetry',
    })).toThrow('Semester not found')
    expect(document.semesters['semester-1']?.boardIds).toEqual(['board-1'])
    expect(Object.keys(document.boards)).toEqual(['board-1'])
  })

  it('rejects invalid board inputs and conflicting updates', () => {
    const document = documentWithBoard()
    expect(() => createBoard(document, {
      id: '', semesterId: 'semester-1', name: 'Poetry', genre: 'poetry',
    })).toThrow('ID')
    expect(() => createBoard(document, {
      id: 'b2', semesterId: 'semester-1', name: '  ', genre: 'poetry',
    })).toThrow('board name')
    expect(() => createBoard(document, {
      id: 'board-1', semesterId: 'semester-1', name: 'Poetry', genre: 'poetry',
    })).toThrow('ID is already')
    expect(() => updateBoard(document, 'missing', { name: 'Name', genre: 'poetry' })).toThrow('Board not found')
    expect(() => deleteBoard(document, 'missing')).toThrow('Board not found')
    expect(() => updateBoard(document, 'board-1', { name: '', genre: 'fiction' })).toThrow('board name')

    const twoBoards = createBoard(document, {
      id: 'board-2', semesterId: 'semester-1', name: 'Poetry', genre: 'poetry',
    })
    expect(() => updateBoard(twoBoards, 'board-2', { name: 'Conflict', genre: 'fiction' })).toThrow('already has a board')
  })
})
