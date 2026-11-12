import type { Board } from '../board'
import { GENRES } from '../taxonomy'
import { isRecord, isStringArray } from './validation-helpers'

export function isBoard(value: unknown, key: string): value is Board {
  if (!isRecord(value)) return false
  return (
    value.id === key &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.semesterId === 'string' &&
    value.semesterId.length > 0 &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    typeof value.genre === 'string' &&
    GENRES.includes(value.genre as (typeof GENRES)[number]) &&
    isStringArray(value.studentIds) &&
    isStringArray(value.advisorIds)
  )
}
