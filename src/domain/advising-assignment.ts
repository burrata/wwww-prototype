export type AdvisingAssignmentId = string

export type AdvisingAssignment = {
  id: AdvisingAssignmentId
  semesterId: string
  boardId: string
  studentId: string
  advisorId: string
  assignedAt: string
  source: 'sole-request' | 'resolution'
}
