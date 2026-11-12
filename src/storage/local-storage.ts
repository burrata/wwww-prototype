import { createEmptyDocument, type AppDocument } from '../domain/app-document'
import { parseAppDocument } from '../domain/validation/app-document-validator'

export const STORAGE_KEY = 'wwww-advising-pairing:document'

export type LoadResult =
  | { status: 'empty'; document: AppDocument }
  | { status: 'loaded'; document: AppDocument }
  | { status: 'invalid'; document: AppDocument; message: string }

export type DocumentStorage = {
  load(): LoadResult
  save(document: AppDocument): void
  clear(): void
}

export function createLocalDocumentStorage(storage: Storage): DocumentStorage {
  return {
    load(): LoadResult {
      let stored: string | null
      try {
        stored = storage.getItem(STORAGE_KEY)
      } catch {
        return {
          status: 'invalid',
          document: createEmptyDocument(),
          message: 'Saved data could not be read. Browser storage may be unavailable.',
        }
      }
      if (stored === null) return { status: 'empty', document: createEmptyDocument() }

      try {
        const document = parseAppDocument(JSON.parse(stored))
        if (!document) throw new Error('Invalid document')
        return { status: 'loaded', document }
      } catch {
        return {
          status: 'invalid',
          document: createEmptyDocument(),
          message: 'Saved data is invalid and was not loaded. It has not been overwritten.',
        }
      }
    },
    save(document: AppDocument): void {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(document))
      } catch {
        throw new Error('Changes could not be saved to this browser.')
      }
    },
    clear(): void {
      try {
        storage.removeItem(STORAGE_KEY)
      } catch {
        throw new Error('Saved data could not be removed from this browser.')
      }
    },
  }
}
