import type { AdvisorRequest, PairingSession, PairingSessionState, PairingUndoEntry } from '../pairing-session'
import { isAdvisingAssignment } from './advising-assignment-validator'
import { isRecord, isStringArray } from './validation-helpers'

function isAdvisorRequest(value: unknown): value is AdvisorRequest {
  return isRecord(value) &&
    typeof value.advisorId === 'string' && value.advisorId.length > 0 &&
    typeof value.requestedAt === 'string' && value.requestedAt.length > 0
}

function isPairingSessionState(value: unknown, key: string): value is PairingSessionState {
  if (!isRecord(value) || !isRecord(value.requestsByStudentId)) return false
  if (Object.values(value.requestsByStudentId).some(
    (requests) => !Array.isArray(requests) || requests.some((request) => !isAdvisorRequest(request)),
  )) return false
  return (
    value.boardId === key &&
    typeof value.boardId === 'string' && value.boardId.length > 0 &&
    (value.status === 'pairing' || value.status === 'resolving' || value.status === 'complete') &&
    value.studentOrderMode === 'last-name' &&
    isStringArray(value.orderedStudentIds) &&
    new Set(value.orderedStudentIds).size === value.orderedStudentIds.length &&
    typeof value.cursor === 'number' && Number.isInteger(value.cursor) && value.cursor >= 0 &&
    isStringArray(value.consideredStudentIds) &&
    new Set(value.consideredStudentIds).size === value.consideredStudentIds.length &&
    (value.resolutionStudentId === undefined || typeof value.resolutionStudentId === 'string')
  )
}

function isPairingUndoEntry(value: unknown, boardId: string): value is PairingUndoEntry {
  if (!isRecord(value) || typeof value.label !== 'string' || value.label.length === 0) return false
  if (!isPairingSessionState(value.session, boardId) || !Array.isArray(value.assignments)) return false
  return value.assignments.every((assignment) => (
    isRecord(assignment) &&
    typeof assignment.id === 'string' &&
    isAdvisingAssignment(assignment, assignment.id) &&
    assignment.boardId === boardId
  ))
}

export function isPairingSession(value: unknown, key: string): value is PairingSession {
  if (!isRecord(value)) return false
  const undoStack = value.undoStack
  return isPairingSessionState(value, key) &&
    Array.isArray(undoStack) &&
    undoStack.length <= 50 &&
    undoStack.every((entry) => isPairingUndoEntry(entry, key))
}
