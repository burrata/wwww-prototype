import { Paper, Title } from '@mantine/core'
import type { Advisor } from '../../domain/advisor'
import type { StudentInput } from '../../domain/commands/student-commands'
import { StudentForm } from './StudentForm'

export function CreateStudentForm({ advisors, onSubmit }: { advisors: Advisor[]; onSubmit(value: StudentInput): boolean }) {
  return (
    <Paper component="section" withBorder radius="md" p="lg" aria-labelledby="add-student-title">
      <Title order={2} size="h3" id="add-student-title" mb="md">Add student</Title>
      <StudentForm advisors={advisors} submitLabel="Add student" resetAfterSubmit onSubmit={onSubmit} />
    </Paper>
  )
}
