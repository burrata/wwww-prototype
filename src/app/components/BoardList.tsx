import { Anchor, Group, Paper, Stack, Text } from '@mantine/core'
import type { Board } from '../../domain/board'
import { genreLabel } from '../../domain/taxonomy'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { EmptyState } from './EmptyState'

export function BoardList({ boards, onDelete }: { boards: Board[]; onDelete(id: string): void }) {
  if (boards.length === 0) return <EmptyState>No boards have been created.</EmptyState>
  return (
    <Stack gap="sm">
      {boards.map((board) => (
        <Paper key={board.id} withBorder radius="md" p="md">
          <Group justify="space-between" wrap="nowrap">
            <div>
              <Anchor href={`#/boards/${board.id}`} c="dark" fw={700}>{board.name}</Anchor>
              <Text size="sm" c="dimmed">{genreLabel(board.genre)}</Text>
            </div>
            <ConfirmDeleteButton
              itemName={board.name}
              itemType="board"
              description="This will delete this board."
              onConfirm={() => onDelete(board.id)}
            />
          </Group>
        </Paper>
      ))}
    </Stack>
  )
}
