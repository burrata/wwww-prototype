import type { Board, BoardId } from './board'
import type { Advisor, AdvisorId } from './advisor'
import type { Semester, SemesterId } from './semester'
import type { Student, StudentId } from './student'
import type {
  PreviousAdvisingRelationship,
  PreviousAdvisingRelationshipId,
} from './previous-advising-relationship'
import type { AdvisingAssignment, AdvisingAssignmentId } from './advising-assignment'
import type { PairingSession } from './pairing-session'

export type AppDocument = {
  schemaVersion: 1
  semesters: Record<SemesterId, Semester>
  boards: Record<BoardId, Board>
  students: Record<StudentId, Student>
  advisors: Record<AdvisorId, Advisor>
  previousAdvisingRelationships: Record<PreviousAdvisingRelationshipId, PreviousAdvisingRelationship>
  assignments: Record<AdvisingAssignmentId, AdvisingAssignment>
  pairingSessions: Record<BoardId, PairingSession>
}

export function createEmptyDocument(): AppDocument {
  return {
    schemaVersion: 1,
    semesters: {},
    boards: {},
    students: {},
    advisors: {},
    previousAdvisingRelationships: {},
    assignments: {},
    pairingSessions: {},
  }
}
