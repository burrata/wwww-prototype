import type { AppDocument } from '../app-document'
import type { Board, BoardId } from '../board'
import { DomainError } from '../domain-error'
import type { Genre } from '../taxonomy'

function requireBoard(document: AppDocument, boardId: BoardId): Board {
  const board = document.boards[boardId]
  if (!board) throw new DomainError('Board not found.')
  return board
}

export function createBoard(
  document: AppDocument,
  input: { id: BoardId; semesterId: string; name: string; genre: Genre },
): AppDocument {
  if (!input.id) throw new DomainError('An ID is required.')
  const semester = document.semesters[input.semesterId]
  if (!semester) throw new DomainError('Semester not found.')
  const name = input.name.trim()
  if (!name) throw new DomainError('Enter a board name.')
  if (document.boards[input.id]) throw new DomainError('That board ID is already in use.')
  if (semester.boardIds.some((id) => document.boards[id]?.genre === input.genre)) {
    throw new DomainError('This semester already has a board for that genre.')
  }

  const board: Board = { ...input, name, studentIds: [], advisorIds: [] }
  return {
    ...document,
    semesters: {
      ...document.semesters,
      [semester.id]: { ...semester, boardIds: [...semester.boardIds, board.id] },
    },
    boards: { ...document.boards, [board.id]: board },
  }
}

export function updateBoard(
  document: AppDocument,
  boardId: BoardId,
  input: { name: string; genre: Genre },
): AppDocument {
  const board = requireBoard(document, boardId)
  const semester = document.semesters[board.semesterId]
  if (!semester) throw new DomainError('Semester not found.')
  const name = input.name.trim()
  if (!name) throw new DomainError('Enter a board name.')
  if (semester.boardIds.some((id) => id !== boardId && document.boards[id]?.genre === input.genre)) {
    throw new DomainError('This semester already has a board for that genre.')
  }
  return { ...document, boards: { ...document.boards, [boardId]: { ...board, ...input, name } } }
}

export function deleteBoard(document: AppDocument, boardId: BoardId): AppDocument {
  const board = requireBoard(document, boardId)
  const semester = document.semesters[board.semesterId]
  if (!semester) throw new DomainError('Semester not found.')
  const boards = { ...document.boards }
  const advisors = { ...document.advisors }
  const students = { ...document.students }
  const relationships = { ...document.previousAdvisingRelationships }
  delete boards[boardId]
  for (const advisorId of board.advisorIds) delete advisors[advisorId]
  for (const studentId of board.studentIds) {
    const student = students[studentId]
    if (student) {
      for (const relationshipId of student.previousAdvisingRelationshipIds) delete relationships[relationshipId]
      delete students[studentId]
    }
  }
  return {
    ...document,
    boards,
    advisors,
    students,
    previousAdvisingRelationships: relationships,
    semesters: {
      ...document.semesters,
      [semester.id]: { ...semester, boardIds: semester.boardIds.filter((id) => id !== boardId) },
    },
  }
}
