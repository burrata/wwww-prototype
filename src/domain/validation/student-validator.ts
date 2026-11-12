import type { Student } from '../student'
import { PROGRAM_STAGES } from '../taxonomy'
import { isRecord, isStringArray } from './validation-helpers'

export function isStudent(value: unknown, key: string): value is Student {
  if (!isRecord(value)) return false
  return (
    value.id === key &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.semesterId === 'string' &&
    value.semesterId.length > 0 &&
    typeof value.boardId === 'string' &&
    value.boardId.length > 0 &&
    typeof value.givenName === 'string' &&
    value.givenName.trim().length > 0 &&
    typeof value.familyName === 'string' &&
    value.familyName.trim().length > 0 &&
    typeof value.programStage === 'string' &&
    PROGRAM_STAGES.includes(value.programStage as Student['programStage']) &&
    isStringArray(value.previousAdvisingRelationshipIds) &&
    new Set(value.previousAdvisingRelationshipIds).size === value.previousAdvisingRelationshipIds.length &&
    isStringArray(value.studentRequestedAdvisorIds) &&
    new Set(value.studentRequestedAdvisorIds).size === value.studentRequestedAdvisorIds.length
  )
}
