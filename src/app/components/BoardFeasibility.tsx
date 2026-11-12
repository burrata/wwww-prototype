import { Alert, Text } from '@mantine/core'
import type { Advisor } from '../../domain/advisor'
import type { Student } from '../../domain/student'
import { boardFeasibility } from '../../domain/selectors/student-selectors'

export function BoardFeasibility({ advisors, students }: { advisors: Advisor[]; students: Student[] }) {
  const feasibility = boardFeasibility(advisors, students)
  const studentLabel = `${feasibility.studentCount} ${feasibility.studentCount === 1 ? 'student' : 'students'}`
  const slotLabel = `${feasibility.totalCapacity} advisor ${feasibility.totalCapacity === 1 ? 'slot' : 'slots'}`
  if (feasibility.totalCapacity !== feasibility.studentCount) {
    const difference = Math.abs(feasibility.totalCapacity - feasibility.studentCount)
    const detail = feasibility.totalCapacity < feasibility.studentCount
      ? `Add ${difference} ${difference === 1 ? 'slot' : 'slots'}.`
      : `Reduce capacity by ${difference} ${difference === 1 ? 'slot' : 'slots'}.`
    return (
      <Alert color="red" title="Capacity mismatch">
        {studentLabel} · {slotLabel}. {detail}
      </Alert>
    )
  }
  return <Text c="green" fw={600}>{studentLabel} · {slotLabel} · Ready</Text>
}
