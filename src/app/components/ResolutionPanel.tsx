import { Badge, Button, Group, Paper, Radio, Stack, Text, Title } from '@mantine/core'
import { useState } from 'react'
import type { AppDocument } from '../../domain/app-document'
import type { PairingSession } from '../../domain/pairing-session'
import {
  advisorIneligibilityReason,
  assignmentPreservesBoardFeasibility,
  remainingCapacityForAdvisor,
  requestsForStudent,
} from '../../domain/selectors/pairing-selectors'
import { listAdvisorsForBoard } from '../../domain/selectors/advisor-selectors'
import { programStageLabel } from '../../domain/taxonomy'

function fullName(person: { givenName: string; familyName: string }): string {
  return `${person.givenName} ${person.familyName}`
}

type ResolutionPanelProps = {
  document: AppDocument
  session: PairingSession
  studentId: string
  onCancel(): boolean
  onConfirm(studentId: string, advisorId: string): boolean
}

export function ResolutionPanel({ document, session, studentId, onCancel, onConfirm }: ResolutionPanelProps) {
  const [advisorId, setAdvisorId] = useState('')
  const student = document.students[studentId]
  if (!student) return null
  const requests = new Set(requestsForStudent(session, studentId).map((request) => request.advisorId))
  const preferences = new Set(student.studentRequestedAdvisorIds)

  return (
    <Stack gap="lg">
      <div>
        <Text size="sm" c="dimmed">Resolve pairing</Text>
        <Text size="sm" c="dimmed">{programStageLabel(student.programStage)}</Text>
        <Title order={2}>{fullName(student)}</Title>
      </div>
      <Radio.Group label="Select an advisor" value={advisorId} onChange={setAdvisorId}>
        <Stack mt="sm">
          {listAdvisorsForBoard(document, session.boardId).map((advisor) => {
            const reason = advisorIneligibilityReason(document, advisor.id, student.id)
            const blocksCompletion = !reason && !assignmentPreservesBoardFeasibility(document, student.id, advisor.id)
            return (
              <Paper key={advisor.id} withBorder radius="md" p="md">
                <Group justify="space-between" wrap="nowrap">
                  <div>
                    <Group gap="xs">
                      <Text fw={700}>{fullName(advisor)}</Text>
                      {requests.has(advisor.id) && <Badge variant="outline">Requested</Badge>}
                      {preferences.has(advisor.id) && <Badge variant="outline" color="purple">Preference</Badge>}
                      {reason && <Badge variant="outline" color="gray">{reason}</Badge>}
                      {blocksCompletion && <Badge variant="outline" color="red">Blocks completion</Badge>}
                    </Group>
                    <Text size="sm" c="dimmed">
                      {remainingCapacityForAdvisor(document, advisor)} of {advisor.capacity} slots remaining
                    </Text>
                  </div>
                  <Radio
                    value={advisor.id}
                    disabled={Boolean(reason) || blocksCompletion}
                    aria-label={`Select ${fullName(advisor)}`}
                  />
                </Group>
              </Paper>
            )
          })}
        </Stack>
      </Radio.Group>
      <Group justify="space-between">
        <Button variant="default" onClick={() => onCancel()}>Back</Button>
        <Button disabled={!advisorId} onClick={() => onConfirm(student.id, advisorId)}>Confirm pairing</Button>
      </Group>
    </Stack>
  )
}
