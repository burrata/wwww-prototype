import { Badge, Group, Paper, Stack, Text, Title } from '@mantine/core'
import type { Advisor } from '../../domain/advisor'
import type { AppDocument } from '../../domain/app-document'
import type { StudentInput } from '../../domain/commands/student-commands'
import { listPreviousAdvisingForStudent } from '../../domain/selectors/student-selectors'
import type { Student } from '../../domain/student'
import { programStageLabel } from '../../domain/taxonomy'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { EditStudentButton } from './EditStudentButton'
import { EmptyState } from './EmptyState'
import { AdvisorIndicator } from './AdvisorIndicator'

type StudentListProps = {
  document: AppDocument
  students: Student[]
  advisors: Advisor[]
  onEdit(id: string, value: StudentInput): boolean
  onDelete(id: string): void
}

function advisorName(advisor: Advisor): string {
  return `${advisor.givenName} ${advisor.familyName}`
}

export function StudentList({ document, students, advisors, onEdit, onDelete }: StudentListProps) {
  const advisorsById = new Map(advisors.map((advisor) => [advisor.id, advisor]))
  return (
    <Stack gap="md" component="section" aria-labelledby="students-title">
      <Title order={2} size="h3" id="students-title">Students</Title>
      {students.length === 0 ? <EmptyState>No students yet.</EmptyState> : students.map((student) => {
        const fullName = `${student.givenName} ${student.familyName}`
        const relationships = listPreviousAdvisingForStudent(document, student.id)
        const requestedAdvisors = student.studentRequestedAdvisorIds.flatMap((id) => advisorsById.get(id) ?? [])
        return (
          <Paper key={student.id} withBorder radius="md" p="md">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Stack gap={6}>
                <Group gap="xs">
                  <Text fw={700}>{fullName}</Text>
                  <Badge
                    variant="outline"
                    color="purple"
                    aria-label={`Program stage: ${programStageLabel(student.programStage)}`}
                  >
                    {programStageLabel(student.programStage)}
                  </Badge>
                </Group>
                <Group gap="xs">
                  <Text size="sm" fw={600}>Requested advisors:</Text>
                  {requestedAdvisors.length > 0 ? requestedAdvisors.map((advisor) => (
                    <AdvisorIndicator
                      key={advisor.id}
                      name={advisorName(advisor)}
                      active
                      excluded={relationships.some((item) => item.matchedCurrentAdvisorId === advisor.id)}
                    />
                  )) : <Text size="sm">None</Text>}
                </Group>
                <div>
                  <Text size="sm" fw={600}>Previous advisors:</Text>
                  {relationships.length === 0 ? <Text size="sm">None</Text> : (
                    <Group gap="xs" mt={4}>
                    {relationships.map((relationship) => {
                    const linkedAdvisor = relationship.matchedCurrentAdvisorId
                      ? advisorsById.get(relationship.matchedCurrentAdvisorId)
                      : undefined
                    return (
                      <AdvisorIndicator
                        key={relationship.id}
                        name={relationship.previousAdvisorName}
                        active={Boolean(linkedAdvisor)}
                        excluded={Boolean(linkedAdvisor)}
                      />
                    )
                    })}
                    </Group>
                  )}
                </div>
              </Stack>
              <Group gap="xs">
                <EditStudentButton
                  student={student}
                  advisors={advisors}
                  relationships={relationships}
                  onSave={(value) => onEdit(student.id, value)}
                />
                <ConfirmDeleteButton
                  itemName={fullName}
                  itemType="student"
                  description="This will remove this student and their previous-advisor history from the board."
                  onConfirm={() => onDelete(student.id)}
                />
              </Group>
            </Group>
          </Paper>
        )
      })}
    </Stack>
  )
}
