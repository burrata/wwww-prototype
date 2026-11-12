import { Group, Paper, Stack, Text, Title } from '@mantine/core'
import type { Advisor } from '../../domain/advisor'
import type { AdvisorInput } from '../../domain/commands/advisor-commands'
import { totalAdvisorCapacity } from '../../domain/selectors/advisor-selectors'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { EditAdvisorButton } from './EditAdvisorButton'
import { EmptyState } from './EmptyState'

type AdvisorListProps = {
  advisors: Advisor[]
  onEdit(id: string, value: AdvisorInput): boolean
  onDelete(id: string): void
}

export function AdvisorList({ advisors, onEdit, onDelete }: AdvisorListProps) {
  return (
    <Stack gap="md" component="section" aria-labelledby="advisors-title">
      <Group justify="space-between">
        <Title order={2} size="h3" id="advisors-title">Advisors</Title>
        <Text>{advisors.length} {advisors.length === 1 ? 'advisor' : 'advisors'} · {totalAdvisorCapacity(advisors)} total slots</Text>
      </Group>
      {advisors.length === 0 ? <EmptyState>No advisors have been added.</EmptyState> : advisors.map((advisor) => {
        const fullName = `${advisor.givenName} ${advisor.familyName}`
        return (
          <Paper key={advisor.id} withBorder radius="md" p="md">
            <Group justify="space-between" wrap="nowrap">
              <div>
                <Text fw={700}>{fullName}</Text>
                <Text size="sm" c="dimmed">Capacity: {advisor.capacity}</Text>
              </div>
              <Group gap="xs">
                <EditAdvisorButton advisor={advisor} onSave={(value) => onEdit(advisor.id, value)} />
                <ConfirmDeleteButton
                  itemName={fullName}
                  itemType="advisor"
                  description="This will remove this advisor from the board."
                  onConfirm={() => onDelete(advisor.id)}
                />
              </Group>
            </Group>
          </Paper>
        )
      })}
    </Stack>
  )
}
