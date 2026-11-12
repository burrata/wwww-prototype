import type { AppDocument } from '../app-document'
import { isAdvisor } from './advisor-validator'
import { isBoard } from './board-validator'
import { isSemester } from './semester-validator'
import { isStudent } from './student-validator'
import { isPreviousAdvisingRelationship } from './previous-advising-relationship-validator'
import { isRecord, type UnknownRecord } from './validation-helpers'
import { isAdvisingAssignment } from './advising-assignment-validator'
import { isPairingSession } from './pairing-session-validator'
import type { Board } from '../board'
import type { PairingSessionState } from '../pairing-session'
import type { AdvisingAssignment } from '../advising-assignment'

const recordKeys = [
  'semesters',
  'boards',
  'students',
  'advisors',
  'previousAdvisingRelationships',
  'assignments',
  'pairingSessions',
] as const

function isPairingStateConsistent(
  document: AppDocument,
  board: Board,
  session: PairingSessionState,
  assignments: AdvisingAssignment[],
): boolean {
  if (session.orderedStudentIds.length === 0) return false
  if (session.orderedStudentIds.some((id) => !board.studentIds.includes(id))) return false
  if (session.cursor > session.orderedStudentIds.length) return false
  if (session.status === 'pairing' && session.cursor >= session.orderedStudentIds.length) return false
  if (session.status !== 'pairing' && session.cursor !== session.orderedStudentIds.length) return false
  if (session.consideredStudentIds.some((id) => !board.studentIds.includes(id))) return false
  for (const [studentId, requests] of Object.entries(session.requestsByStudentId)) {
    if (!board.studentIds.includes(studentId)) return false
    if (new Set(requests.map((request) => request.advisorId)).size !== requests.length) return false
    if (requests.some((request) => !board.advisorIds.includes(request.advisorId))) return false
  }

  const assignedStudents = new Set<string>()
  const advisorCounts = new Map<string, number>()
  for (const assignment of assignments) {
    const student = document.students[assignment.studentId]
    const advisor = document.advisors[assignment.advisorId]
    if (assignment.boardId !== board.id || assignment.semesterId !== board.semesterId) return false
    if (!student || !advisor || student.boardId !== board.id || advisor.boardId !== board.id) return false
    if (assignedStudents.has(student.id)) return false
    if (student.previousAdvisingRelationshipIds.some(
      (id) => document.previousAdvisingRelationships[id]?.matchedCurrentAdvisorId === advisor.id,
    )) return false
    assignedStudents.add(student.id)
    advisorCounts.set(advisor.id, (advisorCounts.get(advisor.id) ?? 0) + 1)
    if ((advisorCounts.get(advisor.id) ?? 0) > advisor.capacity) return false
  }
  if (session.resolutionStudentId && (
    session.status !== 'resolving' ||
    !board.studentIds.includes(session.resolutionStudentId) ||
    assignedStudents.has(session.resolutionStudentId)
  )) return false
  return session.status !== 'complete' || assignedStudents.size === board.studentIds.length
}

export function parseAppDocument(value: unknown): AppDocument | null {
  if (!isRecord(value) || value.schemaVersion !== 1) return null
  if (recordKeys.some((key) => !isRecord(value[key]))) return null

  const semesters = value.semesters as UnknownRecord
  const boards = value.boards as UnknownRecord
  const advisors = value.advisors as UnknownRecord
  const students = value.students as UnknownRecord
  const relationships = value.previousAdvisingRelationships as UnknownRecord
  const assignments = value.assignments as UnknownRecord
  const sessions = value.pairingSessions as UnknownRecord
  if (Object.entries(semesters).some(([id, item]) => !isSemester(item, id))) return null
  if (Object.entries(boards).some(([id, item]) => !isBoard(item, id))) return null
  if (Object.entries(advisors).some(([id, item]) => !isAdvisor(item, id))) return null
  if (Object.entries(students).some(([id, item]) => !isStudent(item, id))) return null
  if (Object.entries(relationships).some(([id, item]) => !isPreviousAdvisingRelationship(item, id))) return null
  if (Object.entries(assignments).some(([id, item]) => !isAdvisingAssignment(item, id))) return null
  if (Object.entries(sessions).some(([id, item]) => !isPairingSession(item, id))) return null

  const document = value as AppDocument
  const semesterKeys = new Set(Object.keys(document.semesters))
  const semesterNames = new Set<string>()

  for (const semester of Object.values(document.semesters)) {
    const semesterName = `${semester.term}:${semester.year}`
    if (semesterNames.has(semesterName)) return null
    semesterNames.add(semesterName)

    const genres = new Set<string>()
    for (const boardId of semester.boardIds) {
      const board = document.boards[boardId]
      if (!board || board.semesterId !== semester.id || genres.has(board.genre)) return null
      genres.add(board.genre)
    }
  }

  for (const board of Object.values(document.boards)) {
    if (!semesterKeys.has(board.semesterId)) return null
    if (!document.semesters[board.semesterId]?.boardIds.includes(board.id)) return null
    for (const advisorId of board.advisorIds) {
      const advisor = document.advisors[advisorId]
      if (!advisor || advisor.boardId !== board.id || advisor.semesterId !== board.semesterId) return null
    }
    for (const studentId of board.studentIds) {
      const student = document.students[studentId]
      if (!student || student.boardId !== board.id || student.semesterId !== board.semesterId) return null
    }
  }

  for (const advisor of Object.values(document.advisors)) {
    if (!document.boards[advisor.boardId]?.advisorIds.includes(advisor.id)) return null
  }

  for (const student of Object.values(document.students)) {
    const board = document.boards[student.boardId]
    if (!board?.studentIds.includes(student.id)) return null
    if (student.studentRequestedAdvisorIds.some((id) => !board.advisorIds.includes(id))) return null
    for (const relationshipId of student.previousAdvisingRelationshipIds) {
      const relationship = document.previousAdvisingRelationships[relationshipId]
      if (!relationship || relationship.studentId !== student.id) return null
      if (relationship.matchedCurrentAdvisorId && !board.advisorIds.includes(relationship.matchedCurrentAdvisorId)) return null
    }
  }

  for (const relationship of Object.values(document.previousAdvisingRelationships)) {
    if (!document.students[relationship.studentId]?.previousAdvisingRelationshipIds.includes(relationship.id)) return null
  }

  const assignedStudents = new Set<string>()
  const advisorCounts = new Map<string, number>()
  for (const assignment of Object.values(document.assignments)) {
    const board = document.boards[assignment.boardId]
    const student = document.students[assignment.studentId]
    const advisor = document.advisors[assignment.advisorId]
    if (!board || !student || !advisor) return null
    if (student.boardId !== board.id || advisor.boardId !== board.id || assignment.semesterId !== board.semesterId) return null
    if (assignedStudents.has(student.id)) return null
    if (student.previousAdvisingRelationshipIds.some(
      (id) => document.previousAdvisingRelationships[id]?.matchedCurrentAdvisorId === advisor.id,
    )) return null
    assignedStudents.add(student.id)
    advisorCounts.set(advisor.id, (advisorCounts.get(advisor.id) ?? 0) + 1)
    if ((advisorCounts.get(advisor.id) ?? 0) > advisor.capacity) return null
  }

  for (const session of Object.values(document.pairingSessions)) {
    const board = document.boards[session.boardId]
    if (!board) return null
    const boardAssignments = Object.values(document.assignments).filter((item) => item.boardId === board.id)
    if (!isPairingStateConsistent(document, board, session, boardAssignments)) return null
    for (const entry of session.undoStack) {
      if (!isPairingStateConsistent(document, board, entry.session, entry.assignments)) return null
    }
  }

  return document
}
