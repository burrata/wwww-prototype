export type SemesterId = string

export type Semester = {
  id: SemesterId
  term: 'spring' | 'fall'
  year: number
  boardIds: string[]
}
