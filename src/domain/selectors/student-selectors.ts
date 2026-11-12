import type { Advisor } from '../advisor'
import type { AppDocument } from '../app-document'
import type { PreviousAdvisingRelationship } from '../previous-advising-relationship'
import type { Student } from '../student'
import { totalAdvisorCapacity } from './advisor-selectors'

export function listStudentsForBoard(document: AppDocument, boardId: string): Student[] {
  const board = document.boards[boardId]
  if (!board) return []
  return board.studentIds.flatMap((id) => document.students[id] ?? [])
}

export function listPreviousAdvisingForStudent(
  document: AppDocument,
  studentId: string,
): PreviousAdvisingRelationship[] {
  const student = document.students[studentId]
  if (!student) return []
  return student.previousAdvisingRelationshipIds.flatMap(
    (id) => document.previousAdvisingRelationships[id] ?? [],
  )
}

export function listPreviousStudentsForAdvisor(document: AppDocument, advisorId: string): Student[] {
  const studentIds = new Set(
    Object.values(document.previousAdvisingRelationships)
      .filter((relationship) => relationship.matchedCurrentAdvisorId === advisorId)
      .map((relationship) => relationship.studentId),
  )
  return Object.values(document.students).filter((student) => studentIds.has(student.id))
}

export function isAdvisorEligibleForStudent(
  document: AppDocument,
  advisorId: string,
  studentId: string,
): boolean {
  const advisor = document.advisors[advisorId]
  const student = document.students[studentId]
  if (!advisor || !student || advisor.boardId !== student.boardId) return false
  return !listPreviousAdvisingForStudent(document, studentId).some(
    (relationship) => relationship.matchedCurrentAdvisorId === advisorId,
  )
}

export function boardFeasibility(
  advisors: Advisor[],
  students: Student[],
): { studentCount: number; totalCapacity: number; shortfall: number } {
  const totalCapacity = totalAdvisorCapacity(advisors)
  return {
    studentCount: students.length,
    totalCapacity,
    shortfall: Math.max(0, students.length - totalCapacity),
  }
}
