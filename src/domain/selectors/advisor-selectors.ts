import type { Advisor } from '../advisor'
import type { AppDocument } from '../app-document'

export function listAdvisorsForBoard(document: AppDocument, boardId: string): Advisor[] {
  const board = document.boards[boardId]
  if (!board) return []
  return board.advisorIds.flatMap((id) => document.advisors[id] ?? [])
}

export function totalAdvisorCapacity(advisors: Advisor[]): number {
  return advisors.reduce((total, advisor) => total + advisor.capacity, 0)
}
