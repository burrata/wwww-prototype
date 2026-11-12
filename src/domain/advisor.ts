export type AdvisorId = string

export type Advisor = {
  id: AdvisorId
  semesterId: string
  boardId: string
  givenName: string
  familyName: string
  capacity: number
}
