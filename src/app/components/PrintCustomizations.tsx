import { Button, Checkbox, Group, NativeSelect, Paper, SimpleGrid, Stack, Title } from '@mantine/core'
import { useState, type ReactNode } from 'react'
import type { MatchResultSort } from '../../domain/selectors/result-selectors'
import type { ResultColumn } from './result-view-options'

export function PrintCustomizations({
  sort,
  columns,
  onSortChange,
  onColumnsChange,
  preferences,
  children,
}: {
  sort: MatchResultSort
  columns: ResultColumn[]
  onSortChange(value: MatchResultSort): void
  onColumnsChange(value: ResultColumn[]): void
  preferences?: ReactNode
  children: ReactNode
}) {
  const [opened, setOpened] = useState(false)

  function isOnlySelected(column: ResultColumn): boolean {
    return columns.length === 1 && columns[0] === column
  }

  return (
    <Stack gap="sm" className="print-hidden">
      <Group justify="flex-end">
        <Button variant="subtle" onClick={() => setOpened((current) => !current)}>
          {opened ? 'Hide customizations' : 'Show customizations'}
        </Button>
        {children}
      </Group>
      {opened && (
        <Paper withBorder radius="md" p="md">
          <SimpleGrid cols={{ base: 1, md: preferences ? 3 : 2 }} spacing="lg">
            <Stack gap="xs">
              <Title order={4}>Sort</Title>
              <NativeSelect
                aria-label="Sort matches by"
                value={sort}
                onChange={(event) => onSortChange(event.currentTarget.value as MatchResultSort)}
                data={[
                  { value: 'student', label: 'Student' },
                  { value: 'advisor', label: 'Advisor' },
                  { value: 'program-stage', label: 'Program stage' },
                ]}
              />
            </Stack>
            <Stack gap="xs">
              <Title order={4}>Columns</Title>
              <Checkbox.Group
                aria-label="Columns"
                value={columns}
                onChange={(value) => onColumnsChange(value as ResultColumn[])}
              >
                <Stack gap="xs">
                  <Checkbox value="student" label="Student" disabled={isOnlySelected('student')} />
                  <Checkbox value="program-stage" label="Program stage" disabled={isOnlySelected('program-stage')} />
                  <Checkbox value="advisor" label="Advisor" disabled={isOnlySelected('advisor')} />
                </Stack>
              </Checkbox.Group>
            </Stack>
            {preferences && (
              <Stack gap="xs">
                <Title order={4}>Preferences</Title>
                {preferences}
              </Stack>
            )}
          </SimpleGrid>
        </Paper>
      )}
    </Stack>
  )
}
