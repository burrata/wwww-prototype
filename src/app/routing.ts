import { useSyncExternalStore } from 'react'

export type Route =
  | { page: 'semesters' }
  | { page: 'semester'; semesterId: string }
  | { page: 'board'; boardId: string }

function routeFromHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'semesters' && parts[1]) return { page: 'semester', semesterId: parts[1] }
  if (parts[0] === 'boards' && parts[1]) return { page: 'board', boardId: parts[1] }
  return { page: 'semesters' }
}

function subscribeToHash(callback: () => void): () => void {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribeToHash, () => window.location.hash, () => '')
  return routeFromHash(hash)
}

export function navigate(path: string): void {
  window.location.hash = path
}
