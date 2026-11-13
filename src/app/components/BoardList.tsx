import { Anchor, Card, Group, SimpleGrid, Text } from '@mantine/core'
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
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
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
          <Card
            key={board.id}
            component="article"
            aria-label={`${genreLabel(board.genre)} board`}
            withBorder
            radius="md"
            p="md"
            h="100%"
          >
            <Group justify="space-between" align="flex-start" wrap="nowrap">
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
          </Card>
        )
      })}
    </SimpleGrid>
  )
}
