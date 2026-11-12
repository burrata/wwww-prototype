import type { PreviousAdvisingRelationship } from '../previous-advising-relationship'
import { isRecord } from './validation-helpers'

export function isPreviousAdvisingRelationship(
  value: unknown,
  key: string,
): value is PreviousAdvisingRelationship {
  if (!isRecord(value)) return false
  return (
    value.id === key &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.studentId === 'string' &&
    value.studentId.length > 0 &&
    typeof value.previousAdvisorName === 'string' &&
    value.previousAdvisorName.trim().length > 0 &&
    (value.matchedCurrentAdvisorId === undefined || (
      typeof value.matchedCurrentAdvisorId === 'string' && value.matchedCurrentAdvisorId.length > 0
    ))
  )
}
