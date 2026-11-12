export type BoardId = string

export type Board = {
  id: BoardId
  semesterId: string
  name: string
  genre: 'fiction' | 'poetry' | 'creative-nonfiction'
  studentIds: string[]
  advisorIds: string[]
}
