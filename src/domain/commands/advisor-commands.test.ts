import { describe, expect, it } from 'vitest'
import { documentWithAdvisor, documentWithBoard } from '../../test/fixtures'
import { createAdvisor, deleteAdvisor, updateAdvisor } from './advisor-commands'

describe('advisor commands', () => {
  it('adds an advisor to one board with capacity defaulting to three', () => {
    const original = documentWithBoard()
    const result = createAdvisor(original, {
      id: 'a1', boardId: 'board-1', givenName: '  Robin ', familyName: ' Shah  ',
    })
    expect(result.advisors.a1).toMatchObject({
      givenName: 'Robin', familyName: 'Shah', capacity: 3, boardId: 'board-1', semesterId: 'semester-1',
    })
    expect(result.boards['board-1']?.advisorIds).toEqual(['a1'])
    expect(original.boards['board-1']?.advisorIds).toEqual([])
  })

  it.each([0, -1, 1.5, Number.NaN])('rejects invalid capacity %s', (capacity) => {
    expect(() => createAdvisor(documentWithBoard(), {
      id: 'a1', boardId: 'board-1', givenName: 'Robin', familyName: 'Shah', capacity,
    })).toThrow('whole number of at least 1')
  })

  it('rejects invalid identity, names, board references, and duplicate IDs', () => {
    const document = documentWithAdvisor()
    expect(() => createAdvisor(document, {
      id: '', boardId: 'board-1', givenName: 'A', familyName: 'B',
    })).toThrow('ID')
    expect(() => createAdvisor(document, {
      id: 'a2', boardId: 'missing', givenName: 'A', familyName: 'B',
    })).toThrow('Board not found')
    expect(() => createAdvisor(document, {
      id: 'advisor-1', boardId: 'board-1', givenName: 'A', familyName: 'B',
    })).toThrow('ID is already')
    expect(() => createAdvisor(documentWithBoard(), {
      id: 'a2', boardId: 'board-1', givenName: ' ', familyName: 'B',
    })).toThrow('given name')
    expect(() => createAdvisor(documentWithBoard(), {
      id: 'a2', boardId: 'board-1', givenName: 'A', familyName: ' ',
    })).toThrow('family name')
  })

  it('keeps duplicate names as separate identities', () => {
    const first = documentWithAdvisor()
    const result = createAdvisor(first, {
      id: 'advisor-2', boardId: 'board-1', givenName: 'Morgan', familyName: 'Lee', capacity: 1,
    })
    expect(result.boards['board-1']?.advisorIds).toEqual(['advisor-1', 'advisor-2'])
    expect(Object.keys(result.advisors)).toHaveLength(2)
  })

  it('edits and removes an advisor without mutating the prior document', () => {
    const original = documentWithAdvisor()
    const updated = updateAdvisor(original, 'advisor-1', {
      givenName: 'Morgan', familyName: 'Li', capacity: 5,
    })
    const deleted = deleteAdvisor(updated, 'advisor-1')
    expect(updated.advisors['advisor-1']).toMatchObject({ familyName: 'Li', capacity: 5 })
    expect(original.advisors['advisor-1']).toMatchObject({ familyName: 'Lee', capacity: 3 })
    expect(deleted.advisors).toEqual({})
    expect(deleted.boards['board-1']?.advisorIds).toEqual([])
  })

  it('rejects updates and removals for missing advisors', () => {
    expect(() => updateAdvisor(documentWithBoard(), 'missing', {
      givenName: 'A', familyName: 'B', capacity: 1,
    })).toThrow('Advisor not found')
    expect(() => deleteAdvisor(documentWithBoard(), 'missing')).toThrow('Advisor not found')
  })
})
