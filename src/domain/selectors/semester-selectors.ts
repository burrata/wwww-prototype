import type { AppDocument } from '../app-document'
import type { Semester } from '../semester'

export function listSemesters(document: AppDocument): Semester[] {
  return Object.values(document.semesters).sort(
    (a, b) => b.year - a.year || a.term.localeCompare(b.term),
  )
}
