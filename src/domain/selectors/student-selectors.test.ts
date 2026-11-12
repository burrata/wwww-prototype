import { describe, expect, it } from 'vitest'
import { createAdvisor } from '../commands/advisor-commands'
import { createStudent } from '../commands/student-commands'
import { documentWithAdvisor, documentWithStudent } from '../../test/fixtures'
import {
  boardFeasibility,
  isAdvisorEligibleForStudent,
  listPreviousAdvisingForStudent,
  listPreviousStudentsForAdvisor,
  listStudentsForBoard,
} from './student-selectors'
import { listAdvisorsForBoard } from './advisor-selectors'

describe('student selectors', () => {
  it('lists students and derives previous advising in entry order', () => {
    const document = documentWithStudent()
    expect(listStudentsForBoard(document, 'board-1').map((student) => student.id)).toEqual(['student-1'])
    expect(listStudentsForBoard(document, 'missing')).toEqual([])
    expect(listPreviousAdvisingForStudent(document, 'student-1')).toHaveLength(2)
    expect(listPreviousAdvisingForStudent(document, 'missing')).toEqual([])
    expect(listPreviousStudentsForAdvisor(document, 'advisor-1').map((student) => student.id)).toEqual(['student-1'])
  })

  it('excludes linked previous advisors while preferences remain soft guidance', () => {
    const secondAdvisor = createAdvisor(documentWithAdvisor(), {
      id: 'advisor-2', boardId: 'board-1', givenName: 'Taylor', familyName: 'Kim', capacity: 1,
    })
    const document = createStudent(secondAdvisor, {
      id: 'student-1', boardId: 'board-1', givenName: 'Avery', familyName: 'Stone', programStage: 'first',
      studentRequestedAdvisorIds: ['advisor-1', 'advisor-2'],
      previousAdvisors: [{ id: 'r1', name: 'Morgan Lee' }],
    })
    expect(isAdvisorEligibleForStudent(document, 'advisor-1', 'student-1')).toBe(false)
    expect(isAdvisorEligibleForStudent(document, 'advisor-2', 'student-1')).toBe(true)
    expect(isAdvisorEligibleForStudent(document, 'missing', 'student-1')).toBe(false)
  })

  it('reports capacity shortfalls without changing setup', () => {
    const document = documentWithStudent()
    expect(boardFeasibility(
      listAdvisorsForBoard(document, 'board-1'), listStudentsForBoard(document, 'board-1'),
    )).toEqual({ studentCount: 1, totalCapacity: 3, shortfall: 0 })
    expect(boardFeasibility([], listStudentsForBoard(document, 'board-1')).shortfall).toBe(1)
  })
})
