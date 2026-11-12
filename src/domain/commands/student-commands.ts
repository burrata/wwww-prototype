import type { AppDocument } from '../app-document'
import { DomainError } from '../domain-error'
import { findAdvisorsByName, normalizePersonName } from '../name-matching'
import type { PreviousAdvisingRelationship } from '../previous-advising-relationship'
import type { ProgramStage, Student, StudentId } from '../student'
import { PROGRAM_STAGES } from '../taxonomy'
import { requireEditableRoster } from './roster-guard'

export type PreviousAdvisorInput = {
  id: string
  name: string
  selectedAdvisorId?: string
}

export type StudentInput = {
  givenName: string
  familyName: string
  programStage: ProgramStage
  studentRequestedAdvisorIds: string[]
  previousAdvisors: PreviousAdvisorInput[]
}

function requireStudent(document: AppDocument, studentId: StudentId): Student {
  const student = document.students[studentId]
  if (!student) throw new DomainError('Student not found.')
  return student
}

function prepareStudentData(
  document: AppDocument,
  boardId: string,
  studentId: string,
  input: StudentInput,
): Pick<Student, 'givenName' | 'familyName' | 'programStage' | 'studentRequestedAdvisorIds'> & {
  relationships: PreviousAdvisingRelationship[]
} {
  const board = document.boards[boardId]
  if (!board) throw new DomainError('Board not found.')
  const givenName = input.givenName.trim()
  const familyName = input.familyName.trim()
  if (!givenName) throw new DomainError('Enter a first name.')
  if (!familyName) throw new DomainError('Enter a last name.')
  if (!PROGRAM_STAGES.includes(input.programStage)) throw new DomainError('Select a program stage.')

  const requestedIds = [...new Set(input.studentRequestedAdvisorIds)]
  if (requestedIds.length !== input.studentRequestedAdvisorIds.length) {
    throw new DomainError('An advisor preference cannot be selected twice.')
  }
  if (requestedIds.some((id) => !board.advisorIds.includes(id))) {
    throw new DomainError('Advisor preferences must belong to this board.')
  }

  const boardAdvisors = board.advisorIds.flatMap((id) => document.advisors[id] ?? [])
  const relationshipIds = new Set<string>()
  const previousNames = new Set<string>()
  const relationships = input.previousAdvisors.map((previous): PreviousAdvisingRelationship => {
    if (!previous.id || relationshipIds.has(previous.id) || document.previousAdvisingRelationships[previous.id]) {
      throw new DomainError('Each previous-advisor entry needs a unique ID.')
    }
    relationshipIds.add(previous.id)
    const previousAdvisorName = previous.name.trim().replace(/\s+/g, ' ')
    if (!previousAdvisorName) throw new DomainError('Previous advisor names cannot be blank.')
    const normalizedName = normalizePersonName(previousAdvisorName)
    if (previousNames.has(normalizedName)) throw new DomainError('A previous advisor cannot be listed twice.')
    previousNames.add(normalizedName)
    const matches = findAdvisorsByName(boardAdvisors, previousAdvisorName)
    let matchedCurrentAdvisorId: string | undefined
    if (matches.length === 1) {
      matchedCurrentAdvisorId = matches[0]!.id
    } else if (matches.length > 1) {
      if (!previous.selectedAdvisorId || !matches.some((advisor) => advisor.id === previous.selectedAdvisorId)) {
        throw new DomainError(`Choose which current advisor matches “${previousAdvisorName}”.`)
      }
      matchedCurrentAdvisorId = previous.selectedAdvisorId
    } else if (previous.selectedAdvisorId) {
      throw new DomainError(`The selected advisor does not match “${previousAdvisorName}”.`)
    }
    return {
      id: previous.id,
      studentId,
      previousAdvisorName,
      ...(matchedCurrentAdvisorId ? { matchedCurrentAdvisorId } : {}),
    }
  })

  return { givenName, familyName, programStage: input.programStage, studentRequestedAdvisorIds: requestedIds, relationships }
}

export function createStudent(
  document: AppDocument,
  input: StudentInput & { id: StudentId; boardId: string },
): AppDocument {
  if (!input.id) throw new DomainError('An ID is required.')
  if (document.students[input.id]) throw new DomainError('That student ID is already in use.')
  const board = document.boards[input.boardId]
  if (!board) throw new DomainError('Board not found.')
  requireEditableRoster(document, board.id)
  const prepared = prepareStudentData(document, board.id, input.id, input)
  const relationships = Object.fromEntries(prepared.relationships.map((item) => [item.id, item]))
  const student: Student = {
    id: input.id,
    boardId: board.id,
    semesterId: board.semesterId,
    givenName: prepared.givenName,
    familyName: prepared.familyName,
    programStage: prepared.programStage,
    studentRequestedAdvisorIds: prepared.studentRequestedAdvisorIds,
    previousAdvisingRelationshipIds: prepared.relationships.map((item) => item.id),
  }
  return {
    ...document,
    students: { ...document.students, [student.id]: student },
    previousAdvisingRelationships: { ...document.previousAdvisingRelationships, ...relationships },
    boards: {
      ...document.boards,
      [board.id]: { ...board, studentIds: [...board.studentIds, student.id] },
    },
  }
}

export function updateStudent(
  document: AppDocument,
  studentId: StudentId,
  input: StudentInput,
): AppDocument {
  const student = requireStudent(document, studentId)
  requireEditableRoster(document, student.boardId)
  const documentWithoutOwnedRelationships: AppDocument = {
    ...document,
    previousAdvisingRelationships: Object.fromEntries(
      Object.entries(document.previousAdvisingRelationships).filter(([, item]) => item.studentId !== studentId),
    ),
  }
  const prepared = prepareStudentData(documentWithoutOwnedRelationships, student.boardId, student.id, input)
  const relationships = Object.fromEntries(prepared.relationships.map((item) => [item.id, item]))
  return {
    ...document,
    students: {
      ...document.students,
      [student.id]: {
        ...student,
        givenName: prepared.givenName,
        familyName: prepared.familyName,
        programStage: prepared.programStage,
        studentRequestedAdvisorIds: prepared.studentRequestedAdvisorIds,
        previousAdvisingRelationshipIds: prepared.relationships.map((item) => item.id),
      },
    },
    previousAdvisingRelationships: {
      ...documentWithoutOwnedRelationships.previousAdvisingRelationships,
      ...relationships,
    },
  }
}

export function deleteStudent(document: AppDocument, studentId: StudentId): AppDocument {
  const student = requireStudent(document, studentId)
  const board = document.boards[student.boardId]
  if (!board) throw new DomainError('Board not found.')
  requireEditableRoster(document, board.id)
  const students = { ...document.students }
  const relationships = { ...document.previousAdvisingRelationships }
  delete students[studentId]
  for (const relationshipId of student.previousAdvisingRelationshipIds) delete relationships[relationshipId]
  return {
    ...document,
    students,
    previousAdvisingRelationships: relationships,
    boards: {
      ...document.boards,
      [board.id]: { ...board, studentIds: board.studentIds.filter((id) => id !== studentId) },
    },
  }
}
