import type { AdvisingAssignment } from './advising-assignment'

export type StudentOrderMode = 'last-name'
export type PairingStatus = 'pairing' | 'resolving' | 'complete'

export type AdvisorRequest = {
  advisorId: string
  requestedAt: string
}

export type PairingSessionState = {
  boardId: string
  status: PairingStatus
  studentOrderMode: StudentOrderMode
  orderedStudentIds: string[]
  cursor: number
  requestsByStudentId: Record<string, AdvisorRequest[]>
  consideredStudentIds: string[]
  resolutionStudentId?: string
}

export type PairingUndoEntry = {
  label: string
  session: PairingSessionState
  assignments: AdvisingAssignment[]
}

export type PairingSession = PairingSessionState & {
  undoStack: PairingUndoEntry[]
}
