import { Button, Modal } from '@mantine/core'
import { useState } from 'react'
import type { Advisor } from '../../domain/advisor'
import type { StudentInput } from '../../domain/commands/student-commands'
import type { PreviousAdvisingRelationship } from '../../domain/previous-advising-relationship'
import type { Student } from '../../domain/student'
import { StudentForm } from './StudentForm'

type EditStudentButtonProps = {
  student: Student
  advisors: Advisor[]
  relationships: PreviousAdvisingRelationship[]
  onSave(value: StudentInput): boolean
}

export function EditStudentButton({ student, advisors, relationships, onSave }: EditStudentButtonProps) {
  const [opened, setOpened] = useState(false)
  const fullName = `${student.givenName} ${student.familyName}`

  function save(value: StudentInput): boolean {
    const saved = onSave(value)
    if (saved) setOpened(false)
    return saved
  }

  return (
    <>
      <Button variant="default" size="compact-sm" aria-label={`Edit student ${fullName}`} onClick={() => setOpened(true)}>
        Edit
      </Button>
      <Modal opened={opened} onClose={() => setOpened(false)} title={`Edit ${fullName}`} size="lg" centered>
        <StudentForm
          advisors={advisors}
          student={student}
          relationships={relationships}
          submitLabel="Save student"
          onSubmit={save}
        />
      </Modal>
    </>
  )
}
