import type { AdvisingAssignment } from '../advising-assignment'
import { isRecord } from './validation-helpers'

export function isAdvisingAssignment(value: unknown, key: string): value is AdvisingAssignment {
  if (!isRecord(value)) return false
  return (
    value.id === key &&
    typeof value.id === 'string' && value.id.length > 0 &&
    typeof value.semesterId === 'string' && value.semesterId.length > 0 &&
    typeof value.boardId === 'string' && value.boardId.length > 0 &&
    typeof value.studentId === 'string' && value.studentId.length > 0 &&
    typeof value.advisorId === 'string' && value.advisorId.length > 0 &&
    typeof value.assignedAt === 'string' && value.assignedAt.length > 0 &&
    (value.source === 'sole-request' || value.source === 'resolution')
  )
}
