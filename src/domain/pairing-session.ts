export type StudentOrderMode = 'last-name'
export type PairingStatus = 'pairing' | 'resolving' | 'complete'

export type AdvisorRequest = {
  advisorId: string
  requestedAt: string
}

export type PairingSession = {
  boardId: string
  status: PairingStatus
  studentOrderMode: StudentOrderMode
  orderedStudentIds: string[]
  cursor: number
  requestsByStudentId: Record<string, AdvisorRequest[]>
  consideredStudentIds: string[]
  resolutionStudentId?: string
  undoStack: unknown[]
}
