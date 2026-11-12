import type { Advisor } from '../advisor'
import { isRecord } from './validation-helpers'

export function isAdvisor(value: unknown, key: string): value is Advisor {
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
    typeof value.capacity === 'number' &&
    Number.isInteger(value.capacity) &&
    value.capacity >= 1
  )
}
