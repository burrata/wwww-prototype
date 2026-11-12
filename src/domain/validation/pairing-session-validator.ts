import type { AdvisorRequest, PairingSession } from '../pairing-session'
import { isRecord, isStringArray } from './validation-helpers'

function isAdvisorRequest(value: unknown): value is AdvisorRequest {
  return isRecord(value) &&
    typeof value.advisorId === 'string' && value.advisorId.length > 0 &&
    typeof value.requestedAt === 'string' && value.requestedAt.length > 0
}

export function isPairingSession(value: unknown, key: string): value is PairingSession {
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
    (value.resolutionStudentId === undefined || typeof value.resolutionStudentId === 'string') &&
    Array.isArray(value.undoStack)
  )
}
