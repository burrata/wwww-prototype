import { Anchor, Group, Paper, Stack, Text } from '@mantine/core'
import type { AppDocument } from '../../domain/app-document'
import type { Board } from '../../domain/board'
import { listAssignmentsForBoard } from '../../domain/selectors/pairing-selectors'
import { genreLabel } from '../../domain/taxonomy'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { EmptyState } from './EmptyState'

function countLabel(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? '' : 's'}`
}

export function BoardList({
  document,
  boards,
  onDelete,
}: {
  document: AppDocument
  boards: Board[]
  onDelete(id: string): void
}) {
  if (boards.length === 0) return <EmptyState>No boards have been created.</EmptyState>
  return (
    <Stack gap="sm">
      {boards.map((board) => {
        const studentCount = board.studentIds.length
        const advisorCount = board.advisorIds.length
        const resolvedCount = listAssignmentsForBoard(document, board.id).length
        const unresolvedCount = studentCount - resolvedCount
        const pairingStarted = Boolean(document.pairingSessions[board.id])
        const studentSummary = pairingStarted && unresolvedCount > 0
          ? `${countLabel(studentCount, 'student')} (${unresolvedCount} unresolved, ${resolvedCount} resolved)`
          : countLabel(studentCount, 'student')
        return (
          <Paper key={board.id} withBorder radius="md" p="md">
            <Group justify="space-between" wrap="nowrap">
              <div>
                <Anchor href={`#/boards/${board.id}`} c="dark" fw={700}>{genreLabel(board.genre)}</Anchor>
                <Text size="sm" c="dimmed">{studentSummary}; {countLabel(advisorCount, 'advisor')}</Text>
              </div>
              <ConfirmDeleteButton
                itemName={genreLabel(board.genre)}
                itemType="board"
                description="This will delete this board."
                onConfirm={() => onDelete(board.id)}
              />
            </Group>
          </Paper>
        )
      })}
    </Stack>
  )
}
