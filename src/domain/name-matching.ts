import type { Advisor } from './advisor'

export function normalizePersonName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export function findAdvisorsByName(advisors: Advisor[], name: string): Advisor[] {
  const normalizedName = normalizePersonName(name)
  return advisors.filter(
    (advisor) => normalizePersonName(`${advisor.givenName} ${advisor.familyName}`) === normalizedName,
  )
}
