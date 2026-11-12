export type StudentId = string
export type ProgramStage = 'first' | 'second' | 'essay' | 'final' | 'extra'

export type Student = {
  id: StudentId
  semesterId: string
  boardId: string
  givenName: string
  familyName: string
  programStage: ProgramStage
  previousAdvisingRelationshipIds: string[]
  studentRequestedAdvisorIds: string[]
}
