import { describe, expect, it } from 'vitest'
import { createAdvisor } from './advisor-commands'
import { createStudent, deleteStudent, updateStudent } from './student-commands'
import { documentWithAdvisor, documentWithBoard, documentWithStudent } from '../../test/fixtures'

describe('student commands', () => {
  it('stores preferences, auto-links one normalized match, and keeps absent history unlinked', () => {
    const result = createStudent(documentWithAdvisor(), {
      id: 's1', boardId: 'board-1', givenName: '  Avery ', familyName: ' Stone ',
      programStage: 'essay', studentRequestedAdvisorIds: ['advisor-1'],
      previousAdvisors: [
        { id: 'r1', name: '  MORGAN   lee ' },
        { id: 'r2', name: 'Former Advisor' },
      ],
    })
    expect(result.students.s1).toMatchObject({
      givenName: 'Avery', familyName: 'Stone', programStage: 'essay',
      studentRequestedAdvisorIds: ['advisor-1'], previousAdvisingRelationshipIds: ['r1', 'r2'],
    })
    expect(result.previousAdvisingRelationships.r1).toMatchObject({
      previousAdvisorName: 'MORGAN lee', matchedCurrentAdvisorId: 'advisor-1',
    })
    expect(result.previousAdvisingRelationships.r2).not.toHaveProperty('matchedCurrentAdvisorId')
    expect(Object.keys(result.advisors)).toEqual(['advisor-1'])
  })

  it('requires an explicit matching advisor when duplicate names exist', () => {
    const duplicates = createAdvisor(documentWithAdvisor(), {
      id: 'advisor-2', boardId: 'board-1', givenName: 'Morgan', familyName: 'Lee', capacity: 2,
    })
    const input = {
      id: 's1', boardId: 'board-1', givenName: 'Avery', familyName: 'Stone',
      programStage: 'first' as const, studentRequestedAdvisorIds: [],
      previousAdvisors: [{ id: 'r1', name: 'Morgan Lee' }],
    }
    expect(() => createStudent(duplicates, input)).toThrow('Choose which current advisor')
    const result = createStudent(duplicates, {
      ...input,
      previousAdvisors: [{ ...input.previousAdvisors[0]!, selectedAdvisorId: 'advisor-2' }],
    })
    expect(result.previousAdvisingRelationships.r1?.matchedCurrentAdvisorId).toBe('advisor-2')
  })

  it('rejects invalid names, stages, preferences, history, and references atomically', () => {
    const base = documentWithAdvisor()
    const valid = {
      id: 's1', boardId: 'board-1', givenName: 'A', familyName: 'B', programStage: 'first' as const,
      studentRequestedAdvisorIds: [] as string[], previousAdvisors: [] as { id: string; name: string }[],
    }
    expect(() => createStudent(base, { ...valid, id: '' })).toThrow('ID')
    expect(() => createStudent(base, { ...valid, boardId: 'missing' })).toThrow('Board not found')
    expect(() => createStudent(base, { ...valid, givenName: ' ' })).toThrow('first name')
    expect(() => createStudent(base, { ...valid, familyName: ' ' })).toThrow('last name')
    expect(() => createStudent(base, { ...valid, programStage: 'bad' as 'first' })).toThrow('program stage')
    expect(() => createStudent(base, { ...valid, studentRequestedAdvisorIds: ['missing'] })).toThrow('belong')
    expect(() => createStudent(base, { ...valid, studentRequestedAdvisorIds: ['advisor-1', 'advisor-1'] })).toThrow('twice')
    expect(() => createStudent(base, { ...valid, previousAdvisors: [{ id: '', name: 'Old Name' }] })).toThrow('unique ID')
    expect(() => createStudent(base, { ...valid, previousAdvisors: [{ id: 'r1', name: ' ' }] })).toThrow('cannot be blank')
    expect(() => createStudent(base, {
      ...valid, previousAdvisors: [{ id: 'r1', name: 'Old Name' }, { id: 'r2', name: ' old  name ' }],
    })).toThrow('listed twice')
    expect(base.students).toEqual({})
  })

  it('updates and removes a student with owned history', () => {
    const original = documentWithStudent()
    const updated = updateStudent(original, 'student-1', {
      givenName: 'Avery', familyName: 'Stones', programStage: 'final',
      studentRequestedAdvisorIds: [], previousAdvisors: [{ id: 'relationship-3', name: 'New Person' }],
    })
    expect(updated.students['student-1']).toMatchObject({ familyName: 'Stones', programStage: 'final' })
    expect(updated.previousAdvisingRelationships).toEqual({
      'relationship-3': {
        id: 'relationship-3', studentId: 'student-1', previousAdvisorName: 'New Person',
      },
    })
    expect(original.previousAdvisingRelationships['relationship-1']).toBeDefined()
    const deleted = deleteStudent(updated, 'student-1')
    expect(deleted.students).toEqual({})
    expect(deleted.previousAdvisingRelationships).toEqual({})
    expect(deleted.boards['board-1']?.studentIds).toEqual([])
  })

  it('rejects missing students and duplicate student IDs', () => {
    expect(() => createStudent(documentWithStudent(), {
      id: 'student-1', boardId: 'board-1', givenName: 'A', familyName: 'B', programStage: 'extra',
      studentRequestedAdvisorIds: [], previousAdvisors: [],
    })).toThrow('ID is already')
    expect(() => updateStudent(documentWithBoard(), 'missing', {
      givenName: 'A', familyName: 'B', programStage: 'extra', studentRequestedAdvisorIds: [], previousAdvisors: [],
    })).toThrow('Student not found')
    expect(() => deleteStudent(documentWithBoard(), 'missing')).toThrow('Student not found')
  })
})
