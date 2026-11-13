import { Alert, Badge, Button, Card, Checkbox, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { useRef, useState } from 'react'
import type { AppDocument } from '../../domain/app-document'
import type { PairingSession } from '../../domain/pairing-session'
import {
  advisorIneligibilityReason,
  assignmentForStudent,
  assignmentPreservesBoardFeasibility,
  currentPairingStudent,
  eligibleRequestsForStudent,
  remainingCapacityForAdvisor,
  requestsForStudent,
} from '../../domain/selectors/pairing-selectors'
import { listAdvisorsForBoard } from '../../domain/selectors/advisor-selectors'
import { listPreviousAdvisingForStudent, listPreviousStudentsForAdvisor } from '../../domain/selectors/student-selectors'
import { programStageLabel } from '../../domain/taxonomy'
import { AdvisorIndicator } from './AdvisorIndicator'
import { CompletedBoardResults } from './CompletedBoardResults'
import { ResolutionPanel } from './ResolutionPanel'

type PairingPresenterProps = {
  document: AppDocument
  session: PairingSession
  onRequest(studentId: string, advisorId: string, requested: boolean): boolean
  onConfirm(studentId: string, advisorId: string): boolean
  onDefer(studentId: string): boolean
  onSelectResolution(studentId: string): boolean
  onCancelResolution(): boolean
  onConfirmResolution(studentId: string, advisorId: string): boolean
  onRestartPass(): boolean
  onUnassign(studentId: string): boolean
  onComplete(): boolean
}

function fullName(person: { givenName: string; familyName: string }): string {
  return `${person.givenName} ${person.familyName}`
}

export function PairingPresenter({
  document,
  session,
  onRequest,
  onConfirm,
  onDefer,
  onSelectResolution,
  onCancelResolution,
  onConfirmResolution,
  onRestartPass,
  onUnassign,
  onComplete,
}: PairingPresenterProps) {
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const advisors = listAdvisorsForBoard(document, session.boardId)
  const student = currentPairingStudent(document, session.boardId)

  function run(action: () => boolean): void {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    action()
    busyRef.current = false
    setBusy(false)
  }

  if (!student) {
    if (session.resolutionStudentId) {
      return (
        <ResolutionPanel
          document={document}
          session={session}
          studentId={session.resolutionStudentId}
          onCancel={onCancelResolution}
          onConfirm={onConfirmResolution}
        />
      )
    }
    const boardStudentIds = document.boards[session.boardId]?.studentIds ?? []
    const assignedCount = boardStudentIds.filter((id) => assignmentForStudent(document, id)).length
    const unresolvedCount = boardStudentIds.length - assignedCount
    const displayStudentIds = [...boardStudentIds].sort((leftId, rightId) => {
      const left = document.students[leftId]
      const right = document.students[rightId]
      if (!left || !right) return 0
      const leftContested = requestsForStudent(session, left.id).length > 1 ? 0 : 1
      const rightContested = requestsForStudent(session, right.id).length > 1 ? 0 : 1
      if (leftContested !== rightContested) return leftContested - rightContested
      return left.familyName.localeCompare(right.familyName, undefined, { sensitivity: 'base' })
    })
    return (
      <Stack gap="lg">
        <Alert
          color={session.status === 'complete' ? 'green' : 'blue'}
          title={session.status === 'complete' ? 'Matching complete' : unresolvedCount === 0 ? 'All students matched' : 'First pass complete'}
        >
          {assignedCount} matched · {unresolvedCount} unmatched
        </Alert>
        {session.status === 'complete' && (
          <CompletedBoardResults document={document} boardId={session.boardId} />
        )}
        {session.status === 'resolving' && unresolvedCount > 0 && (
          <Group justify="flex-end">
            <Button onClick={() => onRestartPass()}>Start another pass</Button>
          </Group>
        )}
        {session.status === 'resolving' && unresolvedCount === 0 && (
          <Group justify="flex-end">
            <Button disabled={busy} onClick={() => run(onComplete)}>Complete board</Button>
          </Group>
        )}
        {session.status !== 'complete' && <Title order={3}>Request history</Title>}
        {session.status !== 'complete' && <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {displayStudentIds.map((studentId) => {
            const item = document.students[studentId]
            if (!item) return null
            const assignment = assignmentForStudent(document, item.id)
            const requests = requestsForStudent(session, item.id)
            return (
              <Card key={item.id} withBorder radius="md" p="md">
                <Stack justify="space-between" h="100%">
                  <div>
                    <Text size="sm" c="dimmed">{programStageLabel(item.programStage)}</Text>
                    <Text fw={700}>{fullName(item)}</Text>
                    {assignment ? (
                      <Badge mt="xs" variant="filled" color="green">
                        {fullName(document.advisors[assignment.advisorId]!)}
                      </Badge>
                    ) : (
                      <Stack gap="xs" align="flex-start" mt="xs">
                        {requests.length === 0 ? <Text size="sm" c="dimmed">No requests</Text> : requests.map((request) => {
                          const advisor = document.advisors[request.advisorId]
                          if (!advisor) return null
                          const full = remainingCapacityForAdvisor(document, advisor) === 0
                          return (
                            <Badge key={advisor.id} variant="outline" color={full ? 'gray' : 'blue'}>
                              {fullName(advisor)}{full ? ' · Full' : ''}
                            </Badge>
                          )
                        })}
                      </Stack>
                    )}
                  </div>
                  {assignment && session.status !== 'complete' ? (
                    <Button variant="default" size="sm" fullWidth onClick={() => onUnassign(item.id)}>
                      Undo match
                    </Button>
                  ) : !assignment ? (
                    <Button variant="default" size="sm" fullWidth onClick={() => onSelectResolution(item.id)}>
                      Resolve {fullName(item)}
                    </Button>
                  ) : null}
                </Stack>
              </Card>
            )
          })}
        </SimpleGrid>}
      </Stack>
    )
  }

  const requests = requestsForStudent(session, student.id)
  const eligibleRequests = eligibleRequestsForStudent(document, session, student.id)
  const previousRelationships = listPreviousAdvisingForStudent(document, student.id)
  const studentPreferences = new Set(student.studentRequestedAdvisorIds)
  const soleRequester = eligibleRequests.length === 1 ? document.advisors[eligibleRequests[0]!.advisorId] : undefined
  const soleRequestPreservesFeasibility = Boolean(
    soleRequester && assignmentPreservesBoardFeasibility(document, student.id, soleRequester.id),
  )

  return (
    <Stack gap="lg">
      <Text fw={600}>Student {session.cursor + 1} of {session.orderedStudentIds.length}</Text>
      <Paper withBorder radius="md" p="lg">
        <Stack gap="sm">
          <div>
            <Text size="sm" c="dimmed">{programStageLabel(student.programStage)}</Text>
            <Title order={2}>{fullName(student)}</Title>
          </div>
          <Group gap="xs">
            <Text size="sm" fw={600}>Preferences:</Text>
            {student.studentRequestedAdvisorIds.length === 0 ? <Text size="sm">None</Text> : student.studentRequestedAdvisorIds.map((id) => {
              const advisor = document.advisors[id]
              return advisor ? <AdvisorIndicator key={id} name={fullName(advisor)} active /> : null
            })}
          </Group>
          <Group gap="xs">
            <Text size="sm" fw={600}>Previous advisors:</Text>
            {previousRelationships.length === 0 ? <Text size="sm">None</Text> : previousRelationships.map((relationship) => (
              <AdvisorIndicator
                key={relationship.id}
                name={relationship.previousAdvisorName}
                active={Boolean(relationship.matchedCurrentAdvisorId)}
                excluded={Boolean(relationship.matchedCurrentAdvisorId)}
              />
            ))}
          </Group>
        </Stack>
      </Paper>

      <Stack gap="sm" component="section" aria-labelledby="advisor-requests-title">
        <Title order={3} id="advisor-requests-title">Advisor requests</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {advisors.map((advisor) => {
            const reason = advisorIneligibilityReason(document, advisor.id, student.id)
            const checked = requests.some((request) => request.advisorId === advisor.id)
            const previousStudents = listPreviousStudentsForAdvisor(document, advisor.id)
            return (
              <Card key={advisor.id} withBorder radius="md" p="md">
                <Stack justify="space-between" h="100%">
                  <div>
                    <Group gap="xs">
                      <Text fw={700}>{fullName(advisor)}</Text>
                      {studentPreferences.has(advisor.id) && <Badge variant="outline" color="purple">Preference</Badge>}
                      {reason && <Badge variant="outline" color="gray">{reason}</Badge>}
                    </Group>
                    <Text size="sm" c="dimmed">
                      {remainingCapacityForAdvisor(document, advisor)} of {advisor.capacity} slots remaining
                    </Text>
                    {previousStudents.length > 0 && (
                      <Text size="sm">Previous students: {previousStudents.map(fullName).join(', ')}</Text>
                    )}
                  </div>
                  <Checkbox
                    label="Request"
                    checked={checked}
                    disabled={Boolean(reason) || busy}
                    onChange={(event) => run(() => onRequest(student.id, advisor.id, event.currentTarget.checked))}
                    aria-label={`${checked ? 'Remove' : 'Add'} request from ${fullName(advisor)}`}
                  />
                </Stack>
              </Card>
            )
          })}
        </SimpleGrid>
      </Stack>

      <Group justify="space-between">
        <Button variant="default" disabled={busy} onClick={() => run(() => onDefer(student.id))}>Defer student</Button>
        {soleRequester && (
          <Button
            disabled={busy || !soleRequestPreservesFeasibility}
            onClick={() => run(() => onConfirm(student.id, soleRequester.id))}
          >
            Confirm {fullName(soleRequester)}
          </Button>
        )}
      </Group>
      {soleRequester && !soleRequestPreservesFeasibility && (
        <Text size="sm" c="red">This match would leave another student without an eligible advisor.</Text>
      )}
    </Stack>
  )
}
