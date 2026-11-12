export type PreviousAdvisingRelationshipId = string

export type PreviousAdvisingRelationship = {
  id: PreviousAdvisingRelationshipId
  studentId: string
  previousAdvisorName: string
  matchedCurrentAdvisorId?: string
}
