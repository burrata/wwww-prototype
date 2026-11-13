import type { Advisor } from '../advisor'
import type { AdvisingAssignment } from '../advising-assignment'
import type { AppDocument } from '../app-document'
import type { Student } from '../student'
import { PROGRAM_STAGES } from '../taxonomy'
import { listAssignmentsForBoard } from './pairing-selectors'

export type MatchResultSort = 'student' | 'advisor' | 'program-stage'

export type MatchResult = {
  student: Student
  advisor: Advisor
  assignment: AdvisingAssignment
}

function compareNames(
  left: { givenName: string; familyName: string },
  right: { givenName: string; familyName: string },
): number {
  const family = left.familyName.localeCompare(right.familyName, undefined, { sensitivity: 'base' })
  return family || left.givenName.localeCompare(right.givenName, undefined, { sensitivity: 'base' })
}

export function listMatchResultsForBoard(
  document: AppDocument,
  boardId: string,
  sort: MatchResultSort = 'student',
): MatchResult[] {
  const rows = listAssignmentsForBoard(document, boardId).flatMap((assignment) => {
    const student = document.students[assignment.studentId]
    const advisor = document.advisors[assignment.advisorId]
    return student && advisor ? [{ student, advisor, assignment }] : []
  })

  return rows.sort((left, right) => {
    if (sort === 'advisor') {
      return compareNames(left.advisor, right.advisor) || compareNames(left.student, right.student)
    }
    if (sort === 'program-stage') {
      return PROGRAM_STAGES.indexOf(left.student.programStage) - PROGRAM_STAGES.indexOf(right.student.programStage)
        || compareNames(left.student, right.student)
    }
    return compareNames(left.student, right.student)
  })
}
