import { useSyncExternalStore } from 'react'

export type Route =
  | { page: 'semesters' }
  | { page: 'semester'; semesterId: string }
  | { page: 'semester-results'; semesterId: string }
  | { page: 'board'; boardId: string; step?: BoardStep }

export type BoardStep = 'advisors' | 'students' | 'review' | 'pairing'

function routeFromHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'semesters' && parts[1] && parts[2] === 'results') {
    return { page: 'semester-results', semesterId: parts[1] }
  }
  if (parts[0] === 'semesters' && parts[1]) return { page: 'semester', semesterId: parts[1] }
  if (parts[0] === 'boards' && parts[1]) {
    const step = parts[2]
    const validStep = step === 'advisors' || step === 'students' || step === 'review' || step === 'pairing'
      ? step
      : undefined
    return { page: 'board', boardId: parts[1], ...(validStep ? { step: validStep } : {}) }
  }
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
