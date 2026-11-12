import { Paper, Text } from '@mantine/core'

export function EmptyState({ children }: { children: string }) {
  return <Paper withBorder radius="md" p="lg"><Text c="dimmed">{children}</Text></Paper>
}
