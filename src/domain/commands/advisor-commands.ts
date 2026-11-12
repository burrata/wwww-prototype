import type { Advisor, AdvisorId } from '../advisor'
import type { AppDocument } from '../app-document'
import { DomainError } from '../domain-error'

export type AdvisorInput = {
  givenName: string
  familyName: string
  capacity?: number
}

function requireAdvisor(document: AppDocument, advisorId: AdvisorId): Advisor {
  const advisor = document.advisors[advisorId]
  if (!advisor) throw new DomainError('Advisor not found.')
  return advisor
}

function normalizeInput(input: AdvisorInput): Required<AdvisorInput> {
  const givenName = input.givenName.trim()
  const familyName = input.familyName.trim()
  const capacity = input.capacity ?? 3
  if (!givenName) throw new DomainError('Enter a given name.')
  if (!familyName) throw new DomainError('Enter a family name.')
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new DomainError('Capacity must be a whole number of at least 1.')
  }
  return { givenName, familyName, capacity }
}

export function createAdvisor(
  document: AppDocument,
  input: AdvisorInput & { id: AdvisorId; boardId: string },
): AppDocument {
  if (!input.id) throw new DomainError('An ID is required.')
  const board = document.boards[input.boardId]
  if (!board) throw new DomainError('Board not found.')
  if (document.advisors[input.id]) throw new DomainError('That advisor ID is already in use.')
  const advisor: Advisor = {
    id: input.id,
    boardId: board.id,
    semesterId: board.semesterId,
    ...normalizeInput(input),
  }
  return {
    ...document,
    advisors: { ...document.advisors, [advisor.id]: advisor },
    boards: {
      ...document.boards,
      [board.id]: { ...board, advisorIds: [...board.advisorIds, advisor.id] },
    },
  }
}

export function updateAdvisor(
  document: AppDocument,
  advisorId: AdvisorId,
  input: AdvisorInput,
): AppDocument {
  const advisor = requireAdvisor(document, advisorId)
  return {
    ...document,
    advisors: {
      ...document.advisors,
      [advisorId]: { ...advisor, ...normalizeInput(input) },
    },
  }
}

export function deleteAdvisor(document: AppDocument, advisorId: AdvisorId): AppDocument {
  const advisor = requireAdvisor(document, advisorId)
  const board = document.boards[advisor.boardId]
  if (!board) throw new DomainError('Board not found.')
  const advisors = { ...document.advisors }
  delete advisors[advisorId]
  return {
    ...document,
    advisors,
    boards: {
      ...document.boards,
      [board.id]: { ...board, advisorIds: board.advisorIds.filter((id) => id !== advisorId) },
    },
  }
}
