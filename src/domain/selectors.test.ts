import { describe, expect, it } from 'vitest'
import { createSemester } from './commands/semester-commands'
import { listBoardsForSemester } from './selectors/board-selectors'
import { listSemesters } from './selectors/semester-selectors'
import { documentWithBoard, documentWithSemester } from '../test/fixtures'

describe('document selectors', () => {
  it('sorts newest semesters first and returns board references', () => {
    const document = createSemester(documentWithSemester(), { id: 's2', term: 'fall', year: 2028 })
    expect(listSemesters(document).map((semester) => semester.id)).toEqual(['s2', 'semester-1'])
    expect(listBoardsForSemester(documentWithBoard(), 'semester-1').map((board) => board.id)).toEqual(['board-1'])
    expect(listBoardsForSemester(document, 'missing')).toEqual([])
  })
})
