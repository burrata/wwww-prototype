import { Button, Group, Paper, Text, Title } from '@mantine/core'
import type { AppDocument } from '../../domain/app-document'
import type { Board } from '../../domain/board'
import { navigate } from '../routing'

export function SemesterResultsSummary({
  document,
  semesterId,
  boards,
}: {
  document: AppDocument
  semesterId: string
  boards: Board[]
}) {
  const completedCount = boards.filter(
    (board) => document.pairingSessions[board.id]?.status === 'complete',
  ).length

  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2} size="h3">Completed matches</Title>
          <Text size="sm" c="dimmed">{completedCount} of {boards.length} boards complete</Text>
        </div>
        <Button
          variant="default"
          disabled={completedCount === 0}
          onClick={() => navigate(`/semesters/${semesterId}/results`)}
        >
          View completed matches
        </Button>
      </Group>
    </Paper>
  )
}
