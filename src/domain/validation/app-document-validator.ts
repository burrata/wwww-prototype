import type { AppDocument } from '../app-document'
import { isBoard } from './board-validator'
import { isSemester } from './semester-validator'
import { isRecord, type UnknownRecord } from './validation-helpers'

const recordKeys = [
  'semesters',
  'boards',
  'students',
  'advisors',
  'previousAdvisingRelationships',
  'assignments',
  'pairingSessions',
] as const

export function parseAppDocument(value: unknown): AppDocument | null {
  if (!isRecord(value) || value.schemaVersion !== 1) return null
  if (recordKeys.some((key) => !isRecord(value[key]))) return null

  const semesters = value.semesters as UnknownRecord
  const boards = value.boards as UnknownRecord
  if (Object.entries(semesters).some(([id, item]) => !isSemester(item, id))) return null
  if (Object.entries(boards).some(([id, item]) => !isBoard(item, id))) return null

  const document = value as AppDocument
  const semesterKeys = new Set(Object.keys(document.semesters))
  const semesterNames = new Set<string>()

  for (const semester of Object.values(document.semesters)) {
    const semesterName = `${semester.term}:${semester.year}`
    if (semesterNames.has(semesterName)) return null
    semesterNames.add(semesterName)

    const genres = new Set<string>()
    for (const boardId of semester.boardIds) {
      const board = document.boards[boardId]
      if (!board || board.semesterId !== semester.id || genres.has(board.genre)) return null
      genres.add(board.genre)
    }
  }

  for (const board of Object.values(document.boards)) {
    if (!semesterKeys.has(board.semesterId)) return null
    if (!document.semesters[board.semesterId]?.boardIds.includes(board.id)) return null
  }

  return document
}
