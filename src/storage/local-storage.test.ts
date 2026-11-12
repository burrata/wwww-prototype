import { describe, expect, it } from 'vitest'
import { documentWithBoard } from '../test/fixtures'
import { createLocalDocumentStorage, STORAGE_KEY } from './local-storage'

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key) },
    setItem: (key, value) => { values.set(key, value) },
  }
}

describe('local document storage', () => {
  it('round-trips a valid document', () => {
    const adapter = createLocalDocumentStorage(memoryStorage())
    adapter.save(documentWithBoard())
    expect(adapter.load()).toEqual({ status: 'loaded', document: documentWithBoard() })
  })

  it('loads an empty document and clears only the app key', () => {
    const storage = memoryStorage()
    storage.setItem('other-app', 'keep')
    const adapter = createLocalDocumentStorage(storage)
    expect(adapter.load().status).toBe('empty')
    adapter.save(documentWithBoard())
    adapter.clear()
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
    expect(storage.getItem('other-app')).toBe('keep')
  })

  it('fails safely when stored data is invalid', () => {
    const storage = memoryStorage()
    storage.setItem(STORAGE_KEY, '{bad json')
    const result = createLocalDocumentStorage(storage).load()
    expect(result.status).toBe('invalid')
    expect(storage.getItem(STORAGE_KEY)).toBe('{bad json')
  })

  it('reports a failed write', () => {
    const storage = memoryStorage()
    storage.setItem = () => { throw new DOMException('full', 'QuotaExceededError') }
    expect(() => createLocalDocumentStorage(storage).save(documentWithBoard())).toThrow(
      'Changes could not be saved',
    )
  })

  it('reports failed reads and clears', () => {
    const readFailure = memoryStorage()
    readFailure.getItem = () => { throw new DOMException('blocked', 'SecurityError') }
    expect(createLocalDocumentStorage(readFailure).load()).toMatchObject({ status: 'invalid' })

    const clearFailure = memoryStorage()
    clearFailure.removeItem = () => { throw new DOMException('blocked', 'SecurityError') }
    expect(() => createLocalDocumentStorage(clearFailure).clear()).toThrow('could not be removed')
  })
})
