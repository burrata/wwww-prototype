import { describe, expect, it } from 'vitest'
import { createAdvisor, updateAdvisor } from './advisor-commands'
import { createStudent } from './student-commands'
import {
  cancelStudentResolution,
  confirmResolution,
  confirmSoleRequest,
  restartUnresolvedPass,
  selectStudentForResolution,
  deferCurrentStudent,
  setAdvisorRequest,
  startBoardPairing,
} from './pairing-commands'
import { documentWithBoard } from '../../test/fixtures'
import {
  advisorIneligibilityReason,
  assignmentForStudent,
  assignmentPreservesBoardFeasibility,
  currentPairingStudent,
  remainingCapacityForAdvisor,
  requestsForStudent,
} from '../selectors/pairing-selectors'

function pairingDocument() {
  const firstAdvisor = createAdvisor(documentWithBoard(), {
    id: 'advisor-1', boardId: 'board-1', givenName: 'Morgan', familyName: 'Lee', capacity: 1,
  })
  const advisors = createAdvisor(firstAdvisor, {
    id: 'advisor-2', boardId: 'board-1', givenName: 'Robin', familyName: 'Shah', capacity: 1,
  })
  const firstStudent = createStudent(advisors, {
    id: 'student-1', boardId: 'board-1', givenName: 'Zoe', familyName: 'Zulu', programStage: 'first',
    studentRequestedAdvisorIds: ['advisor-1'], previousAdvisors: [],
  })
  return createStudent(firstStudent, {
    id: 'student-2', boardId: 'board-1', givenName: 'Avery', familyName: 'Alpha', programStage: 'final',
    studentRequestedAdvisorIds: [], previousAdvisors: [],
  })
}

function request(document: ReturnType<typeof pairingDocument>, advisorId: string, requested = true) {
  const student = currentPairingStudent(document, 'board-1')!
  return setAdvisorRequest(document, {
    boardId: 'board-1', studentId: student.id, advisorId, requested, requestedAt: '2026-11-12T12:00:00.000Z',
  })
}

describe('pairing commands', () => {
  it('materializes last-name order when pairing starts', () => {
    const alphabetical = startBoardPairing(pairingDocument(), 'board-1')
    expect(alphabetical.pairingSessions['board-1']?.orderedStudentIds).toEqual(['student-2', 'student-1'])
    expect(currentPairingStudent(alphabetical, 'board-1')?.id).toBe('student-2')
  })

  it('stores and removes requests without creating an assignment', () => {
    const started = startBoardPairing(pairingDocument(), 'board-1')
    const requested = request(started, 'advisor-1')
    expect(requestsForStudent(requested.pairingSessions['board-1']!, 'student-2')).toHaveLength(1)
    expect(assignmentForStudent(requested, 'student-2')).toBeUndefined()
    const removed = request(requested, 'advisor-1', false)
    expect(requestsForStudent(removed.pairingSessions['board-1']!, 'student-2')).toEqual([])
  })

  it('confirms only a sole request, advances, and exhausts capacity', () => {
    const started = startBoardPairing(pairingDocument(), 'board-1')
    const requested = request(started, 'advisor-1')
    const confirmed = confirmSoleRequest(requested, {
      id: 'assignment-1', boardId: 'board-1', studentId: 'student-2', advisorId: 'advisor-1',
      assignedAt: '2026-11-12T12:01:00.000Z',
    })
    expect(assignmentForStudent(confirmed, 'student-2')?.advisorId).toBe('advisor-1')
    expect(currentPairingStudent(confirmed, 'board-1')?.id).toBe('student-1')
    expect(remainingCapacityForAdvisor(confirmed, confirmed.advisors['advisor-1']!)).toBe(0)
    expect(advisorIneligibilityReason(confirmed, 'advisor-1', 'student-1')).toBe('Full')
    expect(() => request(confirmed, 'advisor-1')).toThrow('not available')
  })

  it('defers no, sole, and multiple requests while preserving request history', () => {
    const noRequest = startBoardPairing(pairingDocument(), 'board-1')
    const afterNone = deferCurrentStudent(noRequest, { boardId: 'board-1', studentId: 'student-2' })
    expect(afterNone.pairingSessions['board-1']?.consideredStudentIds).toEqual(['student-2'])

    const sole = request(startBoardPairing(pairingDocument(), 'board-1'), 'advisor-1')
    const afterSole = deferCurrentStudent(sole, { boardId: 'board-1', studentId: 'student-2' })
    expect(requestsForStudent(afterSole.pairingSessions['board-1']!, 'student-2')).toHaveLength(1)

    const first = request(startBoardPairing(pairingDocument(), 'board-1'), 'advisor-1')
    const multiple = request(first, 'advisor-2')
    const afterMultiple = deferCurrentStudent(multiple, { boardId: 'board-1', studentId: 'student-2' })
    expect(requestsForStudent(afterMultiple.pairingSessions['board-1']!, 'student-2')).toHaveLength(2)
  })

  it('rejects previous advisors, multiple-request confirmation, and duplicate assignment IDs', () => {
    const withHistory = createStudent(
      createAdvisor(documentWithBoard(), {
        id: 'advisor-1', boardId: 'board-1', givenName: 'Morgan', familyName: 'Lee', capacity: 1,
      }),
      {
        id: 'student-1', boardId: 'board-1', givenName: 'A', familyName: 'One', programStage: 'first',
        studentRequestedAdvisorIds: [], previousAdvisors: [{ id: 'r1', name: 'Morgan Lee' }],
      },
    )
    const historyStarted = startBoardPairing(withHistory, 'board-1')
    expect(() => request(historyStarted as ReturnType<typeof pairingDocument>, 'advisor-1')).toThrow('not available')

    const started = startBoardPairing(pairingDocument(), 'board-1')
    const multiple = request(request(started, 'advisor-1'), 'advisor-2')
    expect(() => confirmSoleRequest(multiple, {
      id: 'a1', boardId: 'board-1', studentId: 'student-2', advisorId: 'advisor-1', assignedAt: 'now',
    })).toThrow('exactly one')

    const confirmed = confirmSoleRequest(request(started, 'advisor-1'), {
      id: 'a1', boardId: 'board-1', studentId: 'student-2', advisorId: 'advisor-1', assignedAt: 'now',
    })
    const secondRequested = request(confirmed, 'advisor-2')
    expect(() => confirmSoleRequest(secondRequested, {
      id: 'a1', boardId: 'board-1', studentId: 'student-1', advisorId: 'advisor-2', assignedAt: 'later',
    })).toThrow('unique')
  })

  it('rejects impossible starts and invalid transitions', () => {
    expect(() => startBoardPairing(documentWithBoard(), 'board-1')).toThrow('at least one student')
    const mismatched = createStudent(createAdvisor(documentWithBoard(), {
      id: 'advisor-1', boardId: 'board-1', givenName: 'A', familyName: 'One', capacity: 2,
    }), {
      id: 'student-1', boardId: 'board-1', givenName: 'S', familyName: 'One', programStage: 'first',
      studentRequestedAdvisorIds: [], previousAdvisors: [],
    })
    expect(() => startBoardPairing(mismatched, 'board-1')).toThrow('must match')
    const started = startBoardPairing(pairingDocument(), 'board-1')
    expect(() => startBoardPairing(started, 'board-1')).toThrow('already started')
    expect(() => deferCurrentStudent(started, { boardId: 'board-1', studentId: 'student-1' })).toThrow('not currently')
    expect(() => setAdvisorRequest(started, {
      boardId: 'board-1', studentId: 'student-2', advisorId: 'advisor-1', requested: true, requestedAt: '',
    })).toThrow('time')
    expect(() => updateAdvisor(started, 'advisor-1', {
      givenName: 'Morgan', familyName: 'Lee', capacity: 2,
    })).toThrow('Reset pairing')
  })

  it('selects any unresolved student and confirms any eligible advisor', () => {
    const started = startBoardPairing(pairingDocument(), 'board-1')
    const afterFirst = deferCurrentStudent(started, { boardId: 'board-1', studentId: 'student-2' })
    const resolving = deferCurrentStudent(afterFirst, { boardId: 'board-1', studentId: 'student-1' })
    const selected = selectStudentForResolution(resolving, { boardId: 'board-1', studentId: 'student-1' })
    const resolved = confirmResolution(selected, {
      id: 'resolution-1', boardId: 'board-1', studentId: 'student-1', advisorId: 'advisor-2', assignedAt: 'now',
    })
    expect(assignmentForStudent(resolved, 'student-1')).toMatchObject({ advisorId: 'advisor-2', source: 'resolution' })
    expect(resolved.pairingSessions['board-1']?.status).toBe('resolving')
    expect(resolved.pairingSessions['board-1']?.resolutionStudentId).toBeUndefined()
  })

  it('cleans competing and exhausted-advisor requests after resolution', () => {
    const started = startBoardPairing(pairingDocument(), 'board-1')
    const firstRequested = request(started, 'advisor-1')
    const onSecondStudent = deferCurrentStudent(firstRequested, {
      boardId: 'board-1', studentId: 'student-2',
    })
    const contested = request(request(onSecondStudent, 'advisor-1'), 'advisor-2')
    const resolving = deferCurrentStudent(contested, { boardId: 'board-1', studentId: 'student-1' })
    const selected = selectStudentForResolution(resolving, { boardId: 'board-1', studentId: 'student-1' })
    const resolved = confirmResolution(selected, {
      id: 'resolution-1', boardId: 'board-1', studentId: 'student-1', advisorId: 'advisor-1', assignedAt: 'now',
    })
    const session = resolved.pairingSessions['board-1']!

    expect(requestsForStudent(session, 'student-1').map((item) => item.advisorId)).toEqual(['advisor-1'])
    expect(requestsForStudent(session, 'student-2')).toEqual([])
  })

  it('rejects an assignment that would strand a student with a previous advisor', () => {
    const firstAdvisor = createAdvisor(documentWithBoard(), {
      id: 'advisor-1', boardId: 'board-1', givenName: 'Morgan', familyName: 'Lee', capacity: 1,
    })
    const advisors = createAdvisor(firstAdvisor, {
      id: 'advisor-2', boardId: 'board-1', givenName: 'Robin', familyName: 'Shah', capacity: 1,
    })
    const flexibleStudent = createStudent(advisors, {
      id: 'student-1', boardId: 'board-1', givenName: 'Avery', familyName: 'Alpha', programStage: 'first',
      studentRequestedAdvisorIds: [], previousAdvisors: [],
    })
    const constrainedStudent = createStudent(flexibleStudent, {
      id: 'student-2', boardId: 'board-1', givenName: 'Zoe', familyName: 'Zulu', programStage: 'final',
      studentRequestedAdvisorIds: [], previousAdvisors: [{ id: 'history-1', name: 'Morgan Lee' }],
    })
    const started = startBoardPairing(constrainedStudent, 'board-1')
    expect(assignmentPreservesBoardFeasibility(started, 'missing', 'advisor-1')).toBe(false)
    expect(assignmentPreservesBoardFeasibility(started, 'student-1', 'missing')).toBe(false)
    expect(assignmentPreservesBoardFeasibility({ ...started, boards: {} }, 'student-1', 'advisor-1')).toBe(false)
    const unsafeRequest = request(started, 'advisor-2')

    expect(() => confirmSoleRequest(unsafeRequest, {
      id: 'unsafe', boardId: 'board-1', studentId: 'student-1', advisorId: 'advisor-2', assignedAt: 'now',
    })).toThrow('leave another student without an eligible advisor')

    const safeRequest = request(request(unsafeRequest, 'advisor-2', false), 'advisor-1')
    expect(() => confirmSoleRequest(safeRequest, {
      id: 'safe', boardId: 'board-1', studentId: 'student-1', advisorId: 'advisor-1', assignedAt: 'now',
    })).not.toThrow()
  })

  it('starts another alphabetical pass with only unpaired students', () => {
    const started = startBoardPairing(pairingDocument(), 'board-1')
    const requested = request(started, 'advisor-1')
    const confirmed = confirmSoleRequest(requested, {
      id: 'assignment-1', boardId: 'board-1', studentId: 'student-2', advisorId: 'advisor-1', assignedAt: 'now',
    })
    const resolving = deferCurrentStudent(confirmed, { boardId: 'board-1', studentId: 'student-1' })
    const restarted = restartUnresolvedPass(resolving, 'board-1')
    expect(restarted.pairingSessions['board-1']).toMatchObject({
      status: 'pairing', orderedStudentIds: ['student-1'], cursor: 0, consideredStudentIds: [],
    })
    expect(currentPairingStudent(restarted, 'board-1')?.id).toBe('student-1')
    expect(requestsForStudent(restarted.pairingSessions['board-1']!, 'student-2')).toHaveLength(1)
  })

  it('cancels resolution and completes by resolving each remaining student', () => {
    const started = startBoardPairing(pairingDocument(), 'board-1')
    const afterFirst = deferCurrentStudent(started, { boardId: 'board-1', studentId: 'student-2' })
    const resolving = deferCurrentStudent(afterFirst, { boardId: 'board-1', studentId: 'student-1' })
    expect(() => selectStudentForResolution(resolving, {
      boardId: 'board-1', studentId: 'missing',
    })).toThrow('not found')

    const selected = selectStudentForResolution(resolving, { boardId: 'board-1', studentId: 'student-2' })
    const cancelled = cancelStudentResolution(selected, 'board-1')
    expect(cancelled.pairingSessions['board-1']?.resolutionStudentId).toBeUndefined()

    const reselected = selectStudentForResolution(cancelled, { boardId: 'board-1', studentId: 'student-2' })
    const firstResolved = confirmResolution(reselected, {
      id: 'r1', boardId: 'board-1', studentId: 'student-2', advisorId: 'advisor-1', assignedAt: 'now',
    })
    const secondSelected = selectStudentForResolution(firstResolved, { boardId: 'board-1', studentId: 'student-1' })
    const complete = confirmResolution(secondSelected, {
      id: 'r2', boardId: 'board-1', studentId: 'student-1', advisorId: 'advisor-2', assignedAt: 'later',
    })
    expect(complete.pairingSessions['board-1']?.status).toBe('complete')
    expect(() => restartUnresolvedPass(complete, 'board-1')).toThrow('not active')
  })
})
