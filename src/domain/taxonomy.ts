import type { Board } from './board'
import type { Semester } from './semester'

export type Term = Semester['term']
export type Genre = Board['genre']

export const TERMS: readonly Term[] = ['spring', 'fall']
export const GENRES: readonly Genre[] = ['fiction', 'poetry', 'creative-nonfiction']

export function termLabel(term: Term): string {
  return term === 'spring' ? 'Spring' : 'Fall'
}

export function genreLabel(genre: Genre): string {
  const labels: Record<Genre, string> = {
    fiction: 'Fiction',
    poetry: 'Poetry',
    'creative-nonfiction': 'Creative Nonfiction',
  }
  return labels[genre]
}
