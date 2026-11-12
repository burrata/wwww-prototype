import type { AppDocument } from '../app-document'
import type { Board } from '../board'

export function listBoardsForSemester(document: AppDocument, semesterId: string): Board[] {
  const semester = document.semesters[semesterId]
  if (!semester) return []
  return semester.boardIds.flatMap((id) => document.boards[id] ?? [])
}
