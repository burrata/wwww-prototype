import type { Board } from './board'
import type { Semester } from './semester'
import type { ProgramStage } from './student'

export type Term = Semester['term']
export type Genre = Board['genre']

export const TERMS: readonly Term[] = ['spring', 'fall']
export const GENRES: readonly Genre[] = ['fiction', 'poetry', 'creative-nonfiction']
export const PROGRAM_STAGES: readonly ProgramStage[] = ['first', 'second', 'essay', 'final', 'extra']

export function termLabel(term: Term): string {
  return term === 'spring' ? 'Spring' : 'Fall'
}

export function programStageLabel(stage: ProgramStage): string {
  const labels: Record<ProgramStage, string> = {
    first: '1st semester',
    second: '2nd semester',
    essay: 'Essay semester',
    final: 'Final semester',
    extra: 'Extra',
  }
  return labels[stage]
}

export function genreLabel(genre: Genre): string {
  const labels: Record<Genre, string> = {
    fiction: 'Fiction',
    poetry: 'Poetry',
    'creative-nonfiction': 'Creative Nonfiction',
  }
  return labels[genre]
}
