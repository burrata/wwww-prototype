import type { Semester } from '../semester'
import { TERMS } from '../taxonomy'
import { isRecord, isStringArray } from './validation-helpers'

export function isSemester(value: unknown, key: string): value is Semester {
  if (!isRecord(value)) return false
  return (
    value.id === key &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.year === 'number' &&
    Number.isInteger(value.year) &&
    value.year >= 1000 &&
    value.year <= 9999 &&
    typeof value.term === 'string' &&
    TERMS.includes(value.term as (typeof TERMS)[number]) &&
    isStringArray(value.boardIds) &&
    new Set(value.boardIds).size === value.boardIds.length
  )
}
