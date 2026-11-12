import { describe, expect, it } from 'vitest'
import { createAdvisor } from '../commands/advisor-commands'
import { documentWithAdvisor, documentWithBoard } from '../../test/fixtures'
import { listAdvisorsForBoard, totalAdvisorCapacity } from './advisor-selectors'

describe('advisor selectors', () => {
  it('lists advisors in entry order and totals capacity', () => {
    const document = createAdvisor(documentWithAdvisor(), {
      id: 'advisor-2', boardId: 'board-1', givenName: 'Taylor', familyName: 'Kim', capacity: 5,
    })
    const advisors = listAdvisorsForBoard(document, 'board-1')
    expect(advisors.map((advisor) => advisor.id)).toEqual(['advisor-1', 'advisor-2'])
    expect(totalAdvisorCapacity(advisors)).toBe(8)
    expect(listAdvisorsForBoard(documentWithBoard(), 'missing')).toEqual([])
  })
})
