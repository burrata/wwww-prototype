import { createEmptyDocument, type AppDocument } from '../domain/app-document'
import { createBoard } from '../domain/commands/board-commands'
import { createSemester } from '../domain/commands/semester-commands'

export function documentWithSemester(): AppDocument {
  return createSemester(createEmptyDocument(), {
    id: 'semester-1',
    term: 'spring',
    year: 2027,
  })
}

export function documentWithBoard(): AppDocument {
  return createBoard(documentWithSemester(), {
    id: 'board-1',
    semesterId: 'semester-1',
    name: 'Fiction Board',
    genre: 'fiction',
  })
}
