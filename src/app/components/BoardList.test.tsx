import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { confirmSoleRequest, setAdvisorRequest, startBoardPairing } from '../../domain/commands/pairing-commands'
import { documentReadyForPairing } from '../../test/fixtures'
import { render } from '../../test/render'
import { BoardList } from './BoardList'

describe('semester board summaries', () => {
  it('shows roster counts and adds resolution progress after matching starts', () => {
    const ready = documentReadyForPairing()
    const view = render(<BoardList document={ready} boards={[ready.boards['board-1']!]} onDelete={() => undefined} />)
    expect(screen.getByText('2 students; 2 advisors')).toBeInTheDocument()

    const oneEach = {
      ...ready,
      boards: {
        ...ready.boards,
        'board-1': { ...ready.boards['board-1']!, studentIds: ['student-1'], advisorIds: ['advisor-1'] },
      },
    }
    view.rerender(<BoardList document={oneEach} boards={[oneEach.boards['board-1']]} onDelete={() => undefined} />)
    expect(screen.getByText('1 student; 1 advisor')).toBeInTheDocument()

    const started = startBoardPairing(ready, 'board-1')
    view.rerender(<BoardList document={started} boards={[started.boards['board-1']!]} onDelete={() => undefined} />)
    expect(screen.getByText('2 students (2 unresolved, 0 resolved); 2 advisors')).toBeInTheDocument()

    const requested = setAdvisorRequest(started, {
      boardId: 'board-1', studentId: 'student-2', advisorId: 'advisor-1', requested: true, requestedAt: 'now',
    })
    const partiallyResolved = confirmSoleRequest(requested, {
      id: 'assignment-1', boardId: 'board-1', studentId: 'student-2', advisorId: 'advisor-1', assignedAt: 'now',
    })
    view.rerender(
      <BoardList
        document={partiallyResolved}
        boards={[partiallyResolved.boards['board-1']!]}
        onDelete={() => undefined}
      />,
    )
    expect(screen.getByText('2 students (1 unresolved, 1 resolved); 2 advisors')).toBeInTheDocument()
  })
})
