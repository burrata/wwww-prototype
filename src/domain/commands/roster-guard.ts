import type { AppDocument } from '../app-document'
import { DomainError } from '../domain-error'

export function requireEditableRoster(document: AppDocument, boardId: string): void {
  if (document.pairingSessions[boardId]) {
    throw new DomainError('Reset pairing before editing this roster.')
  }
}
