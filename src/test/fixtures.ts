import { createEmptyDocument, type AppDocument } from '../domain/app-document'
import { createBoard } from '../domain/commands/board-commands'
import { createSemester } from '../domain/commands/semester-commands'
import { createAdvisor } from '../domain/commands/advisor-commands'
import { createStudent } from '../domain/commands/student-commands'

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
    genre: 'fiction',
  })
}

export function documentWithAdvisor(): AppDocument {
  return createAdvisor(documentWithBoard(), {
    id: 'advisor-1',
    boardId: 'board-1',
    givenName: 'Morgan',
    familyName: 'Lee',
    capacity: 3,
  })
}

export function documentWithStudent(): AppDocument {
  return createStudent(documentWithAdvisor(), {
    id: 'student-1',
    boardId: 'board-1',
    givenName: 'Avery',
    familyName: 'Stone',
    programStage: 'first',
    studentRequestedAdvisorIds: ['advisor-1'],
    previousAdvisors: [
      { id: 'relationship-1', name: 'Morgan Lee' },
      { id: 'relationship-2', name: 'Former Advisor' },
    ],
  })
}

export function documentReadyForPairing(): AppDocument {
  const firstAdvisor = createAdvisor(documentWithBoard(), {
    id: 'advisor-1', boardId: 'board-1', givenName: 'Morgan', familyName: 'Lee', capacity: 1,
  })
  const advisors = createAdvisor(firstAdvisor, {
    id: 'advisor-2', boardId: 'board-1', givenName: 'Robin', familyName: 'Shah', capacity: 1,
  })
  const firstStudent = createStudent(advisors, {
    id: 'student-1', boardId: 'board-1', givenName: 'Zoe', familyName: 'Zulu', programStage: 'first',
    studentRequestedAdvisorIds: ['advisor-1'], previousAdvisors: [],
  })
  return createStudent(firstStudent, {
    id: 'student-2', boardId: 'board-1', givenName: 'Avery', familyName: 'Alpha', programStage: 'final',
    studentRequestedAdvisorIds: [], previousAdvisors: [],
  })
}
