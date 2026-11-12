import type { Board, BoardId } from './board'
import type { Advisor, AdvisorId } from './advisor'
import type { Semester, SemesterId } from './semester'

export type AppDocument = {
  schemaVersion: 1
  semesters: Record<SemesterId, Semester>
  boards: Record<BoardId, Board>
  students: Record<string, unknown>
  advisors: Record<AdvisorId, Advisor>
  previousAdvisingRelationships: Record<string, unknown>
  assignments: Record<string, unknown>
  pairingSessions: Record<string, unknown>
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
