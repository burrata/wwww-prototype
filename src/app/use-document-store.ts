import { useState } from 'react'
import type { AppDocument } from '../domain/app-document'
import type { DocumentStorage, LoadResult } from '../storage/local-storage'

export type DocumentStore = {
  document: AppDocument
  loadResult: LoadResult
  message: string
  commit(change: (current: AppDocument) => AppDocument): boolean
  discardInvalidData(): void
}

export function useDocumentStore(storage: DocumentStorage): DocumentStore {
  const [loadResult, setLoadResult] = useState<LoadResult>(() => storage.load())
  const [message, setMessage] = useState('')

  function commit(change: (current: AppDocument) => AppDocument): boolean {
    setMessage('')
    try {
      const next = change(loadResult.document)
      storage.save(next)
      setLoadResult({ status: 'loaded', document: next })
      return true
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The change could not be completed.')
      return false
    }
  }

  function discardInvalidData(): void {
    try {
      storage.clear()
      setLoadResult(storage.load())
      setMessage('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Saved data could not be removed.')
    }
  }

  return { document: loadResult.document, loadResult, message, commit, discardInvalidData }
}
