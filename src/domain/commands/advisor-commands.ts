import type { Advisor, AdvisorId } from '../advisor'
import type { AppDocument } from '../app-document'
import { DomainError } from '../domain-error'
import { requireEditableRoster } from './roster-guard'

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
  if (!givenName) throw new DomainError('Enter a first name.')
  if (!familyName) throw new DomainError('Enter a last name.')
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
  requireEditableRoster(document, board.id)
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
  requireEditableRoster(document, advisor.boardId)
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
  requireEditableRoster(document, board.id)
  const advisors = { ...document.advisors }
  const students = { ...document.students }
  const relationships = { ...document.previousAdvisingRelationships }
  delete advisors[advisorId]
  for (const studentId of board.studentIds) {
    const student = students[studentId]
    if (student?.studentRequestedAdvisorIds.includes(advisorId)) {
      students[studentId] = {
        ...student,
        studentRequestedAdvisorIds: student.studentRequestedAdvisorIds.filter((id) => id !== advisorId),
      }
    }
  }
  for (const [id, relationship] of Object.entries(relationships)) {
    if (relationship.matchedCurrentAdvisorId === advisorId) {
      const unlinked = { ...relationship }
      delete unlinked.matchedCurrentAdvisorId
      relationships[id] = unlinked
    }
  }
  return {
    ...document,
    advisors,
    students,
    previousAdvisingRelationships: relationships,
    boards: {
      ...document.boards,
      [board.id]: { ...board, advisorIds: board.advisorIds.filter((id) => id !== advisorId) },
    },
  }
}
