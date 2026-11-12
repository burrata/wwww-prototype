import { Anchor, Group, Paper, Stack, Text } from '@mantine/core'
import type { Semester } from '../../domain/semester'
import { termLabel } from '../../domain/taxonomy'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { EmptyState } from './EmptyState'

export function SemesterList({ semesters, onDelete }: { semesters: Semester[]; onDelete(id: string): void }) {
  if (semesters.length === 0) return <EmptyState>No semesters have been created.</EmptyState>
  return (
    <Stack gap="sm" aria-label="Semester list">
      {semesters.map((semester) => {
        const label = `${termLabel(semester.term)} ${semester.year}`
        return (
          <Paper key={semester.id} withBorder radius="md" p="md">
            <Group justify="space-between" wrap="nowrap">
              <div>
                <Anchor href={`#/semesters/${semester.id}`} c="dark" fw={700}>{label}</Anchor>
                <Text size="sm" c="dimmed">{semester.boardIds.length} {semester.boardIds.length === 1 ? 'board' : 'boards'}</Text>
              </div>
              <ConfirmDeleteButton
                itemName={label}
                itemType="semester"
                description="This will delete the semester and all of its boards."
                onConfirm={() => onDelete(semester.id)}
              />
            </Group>
          </Paper>
        )
      })}
    </Stack>
  )
}
