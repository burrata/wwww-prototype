import type { AppDocument } from '../app-document'
import { isAdvisor } from './advisor-validator'
import { isBoard } from './board-validator'
import { isSemester } from './semester-validator'
import { isStudent } from './student-validator'
import { isPreviousAdvisingRelationship } from './previous-advising-relationship-validator'
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
  const advisors = value.advisors as UnknownRecord
  const students = value.students as UnknownRecord
  const relationships = value.previousAdvisingRelationships as UnknownRecord
  if (Object.entries(semesters).some(([id, item]) => !isSemester(item, id))) return null
  if (Object.entries(boards).some(([id, item]) => !isBoard(item, id))) return null
  if (Object.entries(advisors).some(([id, item]) => !isAdvisor(item, id))) return null
  if (Object.entries(students).some(([id, item]) => !isStudent(item, id))) return null
  if (Object.entries(relationships).some(([id, item]) => !isPreviousAdvisingRelationship(item, id))) return null

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
    for (const advisorId of board.advisorIds) {
      const advisor = document.advisors[advisorId]
      if (!advisor || advisor.boardId !== board.id || advisor.semesterId !== board.semesterId) return null
    }
    for (const studentId of board.studentIds) {
      const student = document.students[studentId]
      if (!student || student.boardId !== board.id || student.semesterId !== board.semesterId) return null
    }
  }

  for (const advisor of Object.values(document.advisors)) {
    if (!document.boards[advisor.boardId]?.advisorIds.includes(advisor.id)) return null
  }

  for (const student of Object.values(document.students)) {
    const board = document.boards[student.boardId]
    if (!board?.studentIds.includes(student.id)) return null
    if (student.studentRequestedAdvisorIds.some((id) => !board.advisorIds.includes(id))) return null
    for (const relationshipId of student.previousAdvisingRelationshipIds) {
      const relationship = document.previousAdvisingRelationships[relationshipId]
      if (!relationship || relationship.studentId !== student.id) return null
      if (relationship.matchedCurrentAdvisorId && !board.advisorIds.includes(relationship.matchedCurrentAdvisorId)) return null
    }
  }

  for (const relationship of Object.values(document.previousAdvisingRelationships)) {
    if (!document.students[relationship.studentId]?.previousAdvisingRelationshipIds.includes(relationship.id)) return null
  }

  return document
}
