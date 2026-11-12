import type { AppDocument } from '../app-document'
import type { Advisor } from '../advisor'
import type { AdvisingAssignment } from '../advising-assignment'
import type { AdvisorRequest, PairingSession } from '../pairing-session'
import type { Student } from '../student'
import { isAdvisorEligibleForStudent, listPreviousAdvisingForStudent } from './student-selectors'

export function listAssignmentsForBoard(document: AppDocument, boardId: string): AdvisingAssignment[] {
  return Object.values(document.assignments).filter((assignment) => assignment.boardId === boardId)
}

export function assignmentForStudent(document: AppDocument, studentId: string): AdvisingAssignment | undefined {
  return Object.values(document.assignments).find((assignment) => assignment.studentId === studentId)
}

export function assignedCountForAdvisor(document: AppDocument, advisorId: string): number {
  return Object.values(document.assignments).filter((assignment) => assignment.advisorId === advisorId).length
}

export function remainingCapacityForAdvisor(document: AppDocument, advisor: Advisor): number {
  return Math.max(0, advisor.capacity - assignedCountForAdvisor(document, advisor.id))
}

export function advisorIneligibilityReason(
  document: AppDocument,
  advisorId: string,
  studentId: string,
): 'Not on board' | 'Already assigned' | 'Previous advisor' | 'Full' | undefined {
  const advisor = document.advisors[advisorId]
  const student = document.students[studentId]
  if (!advisor || !student || advisor.boardId !== student.boardId) return 'Not on board'
  if (assignmentForStudent(document, studentId)) return 'Already assigned'
  if (listPreviousAdvisingForStudent(document, studentId).some(
    (relationship) => relationship.matchedCurrentAdvisorId === advisorId,
  )) return 'Previous advisor'
  if (remainingCapacityForAdvisor(document, advisor) === 0) return 'Full'
  return undefined
}

export function isAdvisorAvailableForStudent(document: AppDocument, advisorId: string, studentId: string): boolean {
  return advisorIneligibilityReason(document, advisorId, studentId) === undefined
}

export function assignmentPreservesBoardFeasibility(
  document: AppDocument,
  studentId: string,
  advisorId: string,
): boolean {
  const student = document.students[studentId]
  const advisor = document.advisors[advisorId]
  if (!student || !advisor || student.boardId !== advisor.boardId) return false
  if (!isAdvisorAvailableForStudent(document, advisorId, studentId)) return false
  const board = document.boards[student.boardId]
  if (!board) return false

  const assignments = listAssignmentsForBoard(document, board.id)
  const assignedStudentIds = new Set(assignments.map((assignment) => assignment.studentId))
  assignedStudentIds.add(studentId)
  const assignedByAdvisor = new Map<string, number>()
  for (const assignment of assignments) {
    assignedByAdvisor.set(assignment.advisorId, (assignedByAdvisor.get(assignment.advisorId) ?? 0) + 1)
  }
  assignedByAdvisor.set(advisorId, (assignedByAdvisor.get(advisorId) ?? 0) + 1)

  const advisorSlots = board.advisorIds.flatMap((id) => {
    const item = document.advisors[id]
    if (!item) return []
    const remaining = item.capacity - (assignedByAdvisor.get(id) ?? 0)
    return Array.from({ length: Math.max(0, remaining) }, () => id)
  })
  const remainingStudentIds = board.studentIds.filter((id) => !assignedStudentIds.has(id))
  if (advisorSlots.length < remainingStudentIds.length) return false

  const eligibleSlotCount = (id: string) => advisorSlots.filter(
    (slotAdvisorId) => isAdvisorEligibleForStudent(document, slotAdvisorId, id),
  ).length
  const orderedStudentIds = [...remainingStudentIds].sort(
    (left, right) => eligibleSlotCount(left) - eligibleSlotCount(right),
  )
  const studentBySlot: Array<string | undefined> = Array.from({ length: advisorSlots.length })

  function match(studentToPlace: string, visitedSlots: Set<number>): boolean {
    for (let slot = 0; slot < advisorSlots.length; slot += 1) {
      if (visitedSlots.has(slot)) continue
      const slotAdvisorId = advisorSlots[slot]
      if (!slotAdvisorId || !isAdvisorEligibleForStudent(document, slotAdvisorId, studentToPlace)) continue
      visitedSlots.add(slot)
      const occupyingStudent = studentBySlot[slot]
      if (!occupyingStudent || match(occupyingStudent, visitedSlots)) {
        studentBySlot[slot] = studentToPlace
        return true
      }
    }
    return false
  }

  return orderedStudentIds.every((id) => match(id, new Set()))
}

export function currentPairingStudent(document: AppDocument, boardId: string): Student | undefined {
  const session = document.pairingSessions[boardId]
  if (!session || session.status !== 'pairing') return undefined
  const id = session.orderedStudentIds[session.cursor]
  return id ? document.students[id] : undefined
}

export function requestsForStudent(session: PairingSession, studentId: string): AdvisorRequest[] {
  return session.requestsByStudentId[studentId] ?? []
}

export function eligibleRequestsForStudent(
  document: AppDocument,
  session: PairingSession,
  studentId: string,
): AdvisorRequest[] {
  return requestsForStudent(session, studentId).filter(
    (request) => isAdvisorAvailableForStudent(document, request.advisorId, studentId),
  )
}
