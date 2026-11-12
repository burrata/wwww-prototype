import type { AppDocument } from '../app-document'
import type { AdvisingAssignment } from '../advising-assignment'
import { DomainError } from '../domain-error'
import type { PairingSession } from '../pairing-session'
import {
  assignmentForStudent,
  assignmentPreservesBoardFeasibility,
  currentPairingStudent,
  eligibleRequestsForStudent,
  isAdvisorAvailableForStudent,
  listAssignmentsForBoard,
  remainingCapacityForAdvisor,
  requestsForStudent,
} from '../selectors/pairing-selectors'
import { totalAdvisorCapacity } from '../selectors/advisor-selectors'

function requireSession(document: AppDocument, boardId: string): PairingSession {
  const session = document.pairingSessions[boardId]
  if (!session) throw new DomainError('Pairing session not found.')
  return session
}

function requireCurrentStudent(document: AppDocument, boardId: string, studentId: string): PairingSession {
  const session = requireSession(document, boardId)
  if (session.status !== 'pairing') throw new DomainError('The first pairing pass is not active.')
  if (currentPairingStudent(document, boardId)?.id !== studentId) {
    throw new DomainError('This student is not currently being considered.')
  }
  return session
}

function orderedStudentIds(document: AppDocument, boardId: string): string[] {
  const board = document.boards[boardId]
  if (!board) throw new DomainError('Board not found.')
  return board.studentIds
    .map((id, entryIndex) => ({ student: document.students[id], entryIndex }))
    .sort((left, right) => {
      if (!left.student || !right.student) return left.entryIndex - right.entryIndex
      const family = left.student.familyName.localeCompare(right.student.familyName, undefined, { sensitivity: 'base' })
      return family || left.entryIndex - right.entryIndex
    })
    .flatMap(({ student }) => student?.id ?? [])
}

function advanceSession(document: AppDocument, session: PairingSession, studentId: string): PairingSession {
  const consideredStudentIds = session.consideredStudentIds.includes(studentId)
    ? session.consideredStudentIds
    : [...session.consideredStudentIds, studentId]
  const cursor = session.cursor + 1
  const atEnd = cursor >= session.orderedStudentIds.length
  const boardAssignments = listAssignmentsForBoard(document, session.boardId)
  const boardStudentCount = document.boards[session.boardId]?.studentIds.length ?? 0
  const allAssigned = boardAssignments.length === boardStudentCount
  return {
    ...session,
    cursor,
    consideredStudentIds,
    status: atEnd ? (allAssigned ? 'complete' : 'resolving') : 'pairing',
  }
}

function requireResolvingSession(document: AppDocument, boardId: string): PairingSession {
  const session = requireSession(document, boardId)
  if (session.status !== 'resolving') throw new DomainError('Conflict resolution is not active.')
  return session
}

function cleanRequestsAfterAssignment(
  document: AppDocument,
  session: PairingSession,
  assignment: AdvisingAssignment,
): PairingSession {
  const advisor = document.advisors[assignment.advisorId]
  const advisorIsFull = Boolean(advisor && remainingCapacityForAdvisor(document, advisor) === 0)
  const requestsByStudentId = Object.fromEntries(
    Object.entries(session.requestsByStudentId).map(([studentId, requests]) => [
      studentId,
      requests.filter((request) => {
        if (studentId === assignment.studentId) return request.advisorId === assignment.advisorId
        return !advisorIsFull || request.advisorId !== assignment.advisorId
      }),
    ]),
  )
  return { ...session, requestsByStudentId }
}

export function startBoardPairing(
  document: AppDocument,
  boardId: string,
): AppDocument {
  const board = document.boards[boardId]
  if (!board) throw new DomainError('Board not found.')
  if (document.pairingSessions[boardId]) throw new DomainError('Pairing has already started.')
  if (board.studentIds.length === 0) throw new DomainError('Add at least one student before pairing.')
  const advisors = board.advisorIds.flatMap((id) => document.advisors[id] ?? [])
  if (totalAdvisorCapacity(advisors) !== board.studentIds.length) {
    throw new DomainError('Advisor capacity must match the student count.')
  }
  const session: PairingSession = {
    boardId,
    status: 'pairing',
    studentOrderMode: 'last-name',
    orderedStudentIds: orderedStudentIds(document, boardId),
    cursor: 0,
    requestsByStudentId: {},
    consideredStudentIds: [],
    undoStack: [],
  }
  return { ...document, pairingSessions: { ...document.pairingSessions, [boardId]: session } }
}

export function setAdvisorRequest(
  document: AppDocument,
  input: { boardId: string; studentId: string; advisorId: string; requested: boolean; requestedAt: string },
): AppDocument {
  const session = requireCurrentStudent(document, input.boardId, input.studentId)
  const requests = requestsForStudent(session, input.studentId)
  const exists = requests.some((request) => request.advisorId === input.advisorId)
  if (input.requested) {
    if (exists) return document
    if (!input.requestedAt) throw new DomainError('Request time is required.')
    if (!isAdvisorAvailableForStudent(document, input.advisorId, input.studentId)) {
      throw new DomainError('This advisor is not available for this student.')
    }
  } else if (!exists) return document
  const nextRequests = input.requested
    ? [...requests, { advisorId: input.advisorId, requestedAt: input.requestedAt }]
    : requests.filter((request) => request.advisorId !== input.advisorId)
  return {
    ...document,
    pairingSessions: {
      ...document.pairingSessions,
      [input.boardId]: {
        ...session,
        requestsByStudentId: { ...session.requestsByStudentId, [input.studentId]: nextRequests },
      },
    },
  }
}

export function deferCurrentStudent(
  document: AppDocument,
  input: { boardId: string; studentId: string },
): AppDocument {
  const session = requireCurrentStudent(document, input.boardId, input.studentId)
  const advanced = advanceSession(document, session, input.studentId)
  return { ...document, pairingSessions: { ...document.pairingSessions, [input.boardId]: advanced } }
}

export function confirmSoleRequest(
  document: AppDocument,
  input: {
    id: string
    boardId: string
    studentId: string
    advisorId: string
    assignedAt: string
  },
): AppDocument {
  const session = requireCurrentStudent(document, input.boardId, input.studentId)
  if (!input.id || document.assignments[input.id]) throw new DomainError('Assignment ID must be unique.')
  if (!input.assignedAt) throw new DomainError('Assignment time is required.')
  if (assignmentForStudent(document, input.studentId)) throw new DomainError('This student is already assigned.')
  const eligibleRequests = eligibleRequestsForStudent(document, session, input.studentId)
  if (eligibleRequests.length !== 1 || eligibleRequests[0]?.advisorId !== input.advisorId) {
    throw new DomainError('Confirm pairing only when exactly one available advisor has requested the student.')
  }
  const advisor = document.advisors[input.advisorId]
  const student = document.students[input.studentId]
  if (!advisor || !student || advisor.boardId !== input.boardId || student.boardId !== input.boardId) {
    throw new DomainError('Student and advisor must belong to this board.')
  }
  if (!isAdvisorAvailableForStudent(document, advisor.id, student.id)) {
    throw new DomainError('This advisor is not available for this student.')
  }
  if (!assignmentPreservesBoardFeasibility(document, student.id, advisor.id)) {
    throw new DomainError('This pairing would leave another student without an eligible advisor.')
  }
  const assignment: AdvisingAssignment = {
    id: input.id,
    semesterId: student.semesterId,
    boardId: input.boardId,
    studentId: student.id,
    advisorId: advisor.id,
    assignedAt: input.assignedAt,
    source: 'sole-request',
  }
  const withAssignment: AppDocument = {
    ...document,
    assignments: { ...document.assignments, [assignment.id]: assignment },
  }
  const cleanedSession = cleanRequestsAfterAssignment(withAssignment, session, assignment)
  const advanced = advanceSession(withAssignment, cleanedSession, input.studentId)
  return {
    ...withAssignment,
    pairingSessions: { ...document.pairingSessions, [input.boardId]: advanced },
  }
}

export function selectStudentForResolution(
  document: AppDocument,
  input: { boardId: string; studentId: string },
): AppDocument {
  const session = requireResolvingSession(document, input.boardId)
  const board = document.boards[input.boardId]
  if (!board?.studentIds.includes(input.studentId)) throw new DomainError('Student not found on this board.')
  if (assignmentForStudent(document, input.studentId)) throw new DomainError('This student is already assigned.')
  return {
    ...document,
    pairingSessions: {
      ...document.pairingSessions,
      [input.boardId]: { ...session, resolutionStudentId: input.studentId },
    },
  }
}

export function cancelStudentResolution(document: AppDocument, boardId: string): AppDocument {
  const session = requireResolvingSession(document, boardId)
  const next = { ...session }
  delete next.resolutionStudentId
  return { ...document, pairingSessions: { ...document.pairingSessions, [boardId]: next } }
}

export function restartUnresolvedPass(document: AppDocument, boardId: string): AppDocument {
  const session = requireResolvingSession(document, boardId)
  const unresolvedStudentIds = session.orderedStudentIds.filter(
    (studentId) => !assignmentForStudent(document, studentId),
  )
  if (unresolvedStudentIds.length === 0) throw new DomainError('No unpaired students remain.')
  const next: PairingSession = {
    ...session,
    status: 'pairing',
    orderedStudentIds: unresolvedStudentIds,
    cursor: 0,
    consideredStudentIds: [],
  }
  delete next.resolutionStudentId
  return { ...document, pairingSessions: { ...document.pairingSessions, [boardId]: next } }
}

export function confirmResolution(
  document: AppDocument,
  input: { id: string; boardId: string; studentId: string; advisorId: string; assignedAt: string },
): AppDocument {
  const session = requireResolvingSession(document, input.boardId)
  if (session.resolutionStudentId !== input.studentId) throw new DomainError('Select this student for resolution first.')
  if (!input.id || document.assignments[input.id]) throw new DomainError('Assignment ID must be unique.')
  if (!input.assignedAt) throw new DomainError('Assignment time is required.')
  if (assignmentForStudent(document, input.studentId)) throw new DomainError('This student is already assigned.')
  if (!isAdvisorAvailableForStudent(document, input.advisorId, input.studentId)) {
    throw new DomainError('This advisor is not available for this student.')
  }
  const student = document.students[input.studentId]
  const advisor = document.advisors[input.advisorId]
  if (!student || !advisor || student.boardId !== input.boardId || advisor.boardId !== input.boardId) {
    throw new DomainError('Student and advisor must belong to this board.')
  }
  if (!assignmentPreservesBoardFeasibility(document, student.id, advisor.id)) {
    throw new DomainError('This pairing would leave another student without an eligible advisor.')
  }
  const assignment: AdvisingAssignment = {
    id: input.id,
    semesterId: student.semesterId,
    boardId: input.boardId,
    studentId: student.id,
    advisorId: advisor.id,
    assignedAt: input.assignedAt,
    source: 'resolution',
  }
  const assignments = { ...document.assignments, [assignment.id]: assignment }
  const withAssignment = { ...document, assignments }
  const boardStudentCount = document.boards[input.boardId]?.studentIds.length ?? 0
  const boardAssignmentCount = Object.values(assignments).filter((item) => item.boardId === input.boardId).length
  const nextSession: PairingSession = {
    ...cleanRequestsAfterAssignment(withAssignment, session, assignment),
    status: boardAssignmentCount === boardStudentCount ? 'complete' : 'resolving',
  }
  delete nextSession.resolutionStudentId
  return {
    ...document,
    assignments,
    pairingSessions: { ...document.pairingSessions, [input.boardId]: nextSession },
  }
}
