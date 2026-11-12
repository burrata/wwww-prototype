import type { AppDocument } from '../app-document'
import { DomainError } from '../domain-error'
import type { Semester, SemesterId } from '../semester'
import type { Term } from '../taxonomy'

function requireSemester(document: AppDocument, semesterId: SemesterId): Semester {
  const semester = document.semesters[semesterId]
  if (!semester) throw new DomainError('Semester not found.')
  return semester
}

function validateYear(year: number): void {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new DomainError('Enter a four-digit year.')
  }
}

function validateId(id: string): void {
  if (!id) throw new DomainError('An ID is required.')
}

export function createSemester(
  document: AppDocument,
  input: { id: SemesterId; term: Term; year: number },
): AppDocument {
  validateId(input.id)
  validateYear(input.year)
  if (document.semesters[input.id]) throw new DomainError('That semester ID is already in use.')
  if (Object.values(document.semesters).some((item) => item.term === input.term && item.year === input.year)) {
    throw new DomainError('That semester already exists.')
  }
  return {
    ...document,
    semesters: { ...document.semesters, [input.id]: { ...input, boardIds: [] } },
  }
}

export function updateSemester(
  document: AppDocument,
  semesterId: SemesterId,
  input: { term: Term; year: number },
): AppDocument {
  const semester = requireSemester(document, semesterId)
  validateYear(input.year)
  if (Object.values(document.semesters).some(
    (item) => item.id !== semesterId && item.term === input.term && item.year === input.year,
  )) throw new DomainError('That semester already exists.')
  return {
    ...document,
    semesters: { ...document.semesters, [semesterId]: { ...semester, ...input } },
  }
}

export function deleteSemester(document: AppDocument, semesterId: SemesterId): AppDocument {
  const semester = requireSemester(document, semesterId)
  const semesters = { ...document.semesters }
  const boards = { ...document.boards }
  const advisors = { ...document.advisors }
  delete semesters[semesterId]
  for (const boardId of semester.boardIds) {
    const board = boards[boardId]
    if (board) for (const advisorId of board.advisorIds) delete advisors[advisorId]
    delete boards[boardId]
  }
  return { ...document, semesters, boards, advisors }
}
