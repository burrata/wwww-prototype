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
  if (!session) throw new DomainError('Matching session not found.')
  return session
}

function requireCurrentStudent(document: AppDocument, boardId: string, studentId: string): PairingSession {
  const session = requireSession(document, boardId)
  if (session.status !== 'pairing') throw new DomainError('The first matching pass is not active.')
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

function advanceSession(session: PairingSession, studentId: string): PairingSession {
  const consideredStudentIds = session.consideredStudentIds.includes(studentId)
    ? session.consideredStudentIds
    : [...session.consideredStudentIds, studentId]
  const cursor = session.cursor + 1
  const atEnd = cursor >= session.orderedStudentIds.length
  return {
    ...session,
    cursor,
    consideredStudentIds,
    status: atEnd ? 'resolving' : 'pairing',
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

function withUndoEntry(document: AppDocument, session: PairingSession, label: string): PairingSession {
  const { undoStack, ...sessionSnapshot } = session
  const entry = {
    label,
    session: sessionSnapshot,
    assignments: listAssignmentsForBoard(document, session.boardId),
  }
  return { ...session, undoStack: [...undoStack, entry].slice(-50) }
}

export function startBoardPairing(
  document: AppDocument,
  boardId: string,
): AppDocument {
  const board = document.boards[boardId]
  if (!board) throw new DomainError('Board not found.')
  if (document.pairingSessions[boardId]) throw new DomainError('Matching has already started.')
  if (board.studentIds.length === 0) throw new DomainError('Add at least one student before matching.')
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
  const sessionWithUndo = withUndoEntry(document, session, input.requested ? 'Add request' : 'Remove request')
  return {
    ...document,
    pairingSessions: {
      ...document.pairingSessions,
      [input.boardId]: {
        ...sessionWithUndo,
        requestsByStudentId: { ...sessionWithUndo.requestsByStudentId, [input.studentId]: nextRequests },
      },
    },
  }
}

export function deferCurrentStudent(
  document: AppDocument,
  input: { boardId: string; studentId: string },
): AppDocument {
  const session = requireCurrentStudent(document, input.boardId, input.studentId)
  const advanced = advanceSession(withUndoEntry(document, session, 'Defer student'), input.studentId)
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
  if (!input.id || document.assignments[input.id]) throw new DomainError('Match ID must be unique.')
  if (!input.assignedAt) throw new DomainError('Match time is required.')
  if (assignmentForStudent(document, input.studentId)) throw new DomainError('This student is already matched.')
  const eligibleRequests = eligibleRequestsForStudent(document, session, input.studentId)
  if (eligibleRequests.length !== 1 || eligibleRequests[0]?.advisorId !== input.advisorId) {
    throw new DomainError('Confirm a match only when exactly one available advisor has requested the student.')
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
    throw new DomainError('This match would leave another student without an eligible advisor.')
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
  const cleanedSession = cleanRequestsAfterAssignment(
    withAssignment,
    withUndoEntry(document, session, 'Confirm match'),
    assignment,
  )
  const advanced = advanceSession(cleanedSession, input.studentId)
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
  if (assignmentForStudent(document, input.studentId)) throw new DomainError('This student is already matched.')
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
  if (unresolvedStudentIds.length === 0) throw new DomainError('No unmatched students remain.')
  const next: PairingSession = {
    ...withUndoEntry(document, session, 'Start another pass'),
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
  if (!input.id || document.assignments[input.id]) throw new DomainError('Match ID must be unique.')
  if (!input.assignedAt) throw new DomainError('Match time is required.')
  if (assignmentForStudent(document, input.studentId)) throw new DomainError('This student is already matched.')
  if (!isAdvisorAvailableForStudent(document, input.advisorId, input.studentId)) {
    throw new DomainError('This advisor is not available for this student.')
  }
  const student = document.students[input.studentId]
  const advisor = document.advisors[input.advisorId]
  if (!student || !advisor || student.boardId !== input.boardId || advisor.boardId !== input.boardId) {
    throw new DomainError('Student and advisor must belong to this board.')
  }
  if (!assignmentPreservesBoardFeasibility(document, student.id, advisor.id)) {
    throw new DomainError('This match would leave another student without an eligible advisor.')
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
  const nextSession: PairingSession = {
    ...cleanRequestsAfterAssignment(
      withAssignment,
      withUndoEntry(document, session, 'Confirm match'),
      assignment,
    ),
    status: 'resolving',
  }
  delete nextSession.resolutionStudentId
  return {
    ...document,
    assignments,
    pairingSessions: { ...document.pairingSessions, [input.boardId]: nextSession },
  }
}

export function completeBoardPairing(document: AppDocument, boardId: string): AppDocument {
  const session = requireResolvingSession(document, boardId)
  const board = document.boards[boardId]
  if (!board) throw new DomainError('Board not found.')
  const assignedStudentIds = new Set(listAssignmentsForBoard(document, boardId).map((assignment) => assignment.studentId))
  if (board.studentIds.some((studentId) => !assignedStudentIds.has(studentId))) {
    throw new DomainError('Match every student before completing the board.')
  }
  return {
    ...document,
    pairingSessions: {
      ...document.pairingSessions,
      [boardId]: { ...withUndoEntry(document, session, 'Complete board'), status: 'complete' },
    },
  }
}

export function undoLastPairingAction(document: AppDocument, boardId: string): AppDocument {
  const session = requireSession(document, boardId)
  const entry = session.undoStack.at(-1)
  if (!entry) throw new DomainError('There is nothing to undo.')
  const assignments = Object.fromEntries(
    Object.entries(document.assignments).filter(([, assignment]) => assignment.boardId !== boardId),
  )
  for (const assignment of entry.assignments) assignments[assignment.id] = assignment
  return {
    ...document,
    assignments,
    pairingSessions: {
      ...document.pairingSessions,
      [boardId]: { ...entry.session, undoStack: session.undoStack.slice(0, -1) },
    },
  }
}

export function unassignStudent(
  document: AppDocument,
  input: { boardId: string; studentId: string },
): AppDocument {
  const session = requireSession(document, input.boardId)
  if (session.status === 'pairing') throw new DomainError('Finish the current pass before undoing a match.')
  const assignment = assignmentForStudent(document, input.studentId)
  if (!assignment || assignment.boardId !== input.boardId) throw new DomainError('This student is not matched.')

  const assignmentEntry = [...session.undoStack].reverse().find((entry) => (
    (entry.label === 'Confirm match' || entry.label === 'Confirm pairing') && (
      entry.session.resolutionStudentId === input.studentId ||
      entry.session.orderedStudentIds[entry.session.cursor] === input.studentId
    )
  ))
  const sessionWithUndo = withUndoEntry(document, session, 'Undo match')
  let requestsByStudentId = sessionWithUndo.requestsByStudentId
  if (assignmentEntry) {
    requestsByStudentId = Object.fromEntries(
      Object.entries(sessionWithUndo.requestsByStudentId).map(([studentId, requests]) => {
        const priorRequests = assignmentEntry.session.requestsByStudentId[studentId] ?? []
        if (studentId === input.studentId) return [studentId, priorRequests]
        const removedAdvisorRequest = priorRequests.find((request) => request.advisorId === assignment.advisorId)
        if (!removedAdvisorRequest || requests.some((request) => request.advisorId === assignment.advisorId)) {
          return [studentId, requests]
        }
        return [studentId, [...requests, removedAdvisorRequest]]
      }),
    )
  }

  const assignments = { ...document.assignments }
  delete assignments[assignment.id]
  const fullOrder = orderedStudentIds(document, input.boardId)
  const nextSession: PairingSession = {
    ...sessionWithUndo,
    status: 'resolving',
    orderedStudentIds: fullOrder,
    cursor: fullOrder.length,
    requestsByStudentId,
  }
  delete nextSession.resolutionStudentId
  return {
    ...document,
    assignments,
    pairingSessions: { ...document.pairingSessions, [input.boardId]: nextSession },
  }
}

export function reopenCompletedBoard(document: AppDocument, boardId: string): AppDocument {
  const session = requireSession(document, boardId)
  if (session.status !== 'complete') throw new DomainError('Only a completed board can be reopened.')
  const nextSession: PairingSession = {
    ...withUndoEntry(document, session, 'Reopen board'),
    status: 'resolving',
  }
  return {
    ...document,
    pairingSessions: { ...document.pairingSessions, [boardId]: nextSession },
  }
}

export function resetBoardPairing(document: AppDocument, boardId: string): AppDocument {
  if (!document.boards[boardId]) throw new DomainError('Board not found.')
  if (!document.pairingSessions[boardId]) throw new DomainError('Matching has not started.')
  const assignments = Object.fromEntries(
    Object.entries(document.assignments).filter(([, assignment]) => assignment.boardId !== boardId),
  )
  const pairingSessions = { ...document.pairingSessions }
  delete pairingSessions[boardId]
  return { ...document, assignments, pairingSessions }
}
