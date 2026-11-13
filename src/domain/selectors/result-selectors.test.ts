import { describe, expect, it } from 'vitest'
import { documentReadyForPairing } from '../../test/fixtures'
import { listMatchResultsForBoard } from './result-selectors'

describe('result selectors', () => {
  it('projects each board assignment once and sorts by student, advisor, or program stage', () => {
    const document = documentReadyForPairing()
    document.assignments = {
      'assignment-1': {
        id: 'assignment-1', semesterId: 'semester-1', boardId: 'board-1',
        studentId: 'student-1', advisorId: 'advisor-1', assignedAt: 'now', source: 'resolution',
      },
      'assignment-2': {
        id: 'assignment-2', semesterId: 'semester-1', boardId: 'board-1',
        studentId: 'student-2', advisorId: 'advisor-2', assignedAt: 'now', source: 'resolution',
      },
    }

    expect(listMatchResultsForBoard(document, 'board-1').map((row) => row.student.id))
      .toEqual(['student-2', 'student-1'])
    expect(listMatchResultsForBoard(document, 'board-1', 'advisor').map((row) => row.student.id))
      .toEqual(['student-1', 'student-2'])
    expect(listMatchResultsForBoard(document, 'board-1', 'program-stage').map((row) => row.student.id))
      .toEqual(['student-1', 'student-2'])
    expect(listMatchResultsForBoard(document, 'missing')).toEqual([])

    const missingStudent = structuredClone(document)
    delete missingStudent.students['student-1']
    expect(listMatchResultsForBoard(missingStudent, 'board-1')).toHaveLength(1)

    const missingAdvisor = structuredClone(document)
    delete missingAdvisor.advisors['advisor-1']
    expect(listMatchResultsForBoard(missingAdvisor, 'board-1')).toHaveLength(1)
  })
})
