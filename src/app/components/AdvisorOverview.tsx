import { Group, Paper, Text, Title } from '@mantine/core'
import type { Advisor } from '../../domain/advisor'
import { totalAdvisorCapacity } from '../../domain/selectors/advisor-selectors'

export function AdvisorOverview({ advisors }: { advisors: Advisor[] }) {
  const advisorLabel = advisors.length === 1 ? 'advisor' : 'advisors'
  const capacity = totalAdvisorCapacity(advisors)
  const slotLabel = capacity === 1 ? 'slot' : 'slots'

  return (
    <Paper component="section" withBorder radius="md" p="md" aria-labelledby="advisor-overview-title">
      <Group justify="space-between">
        <Title order={3} size="h4" id="advisor-overview-title">Advisor overview</Title>
        <Text fw={600}>{advisors.length} {advisorLabel} · {capacity} {slotLabel}</Text>
      </Group>
    </Paper>
  )
}
