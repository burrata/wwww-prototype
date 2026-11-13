import { Stepper } from '@mantine/core'
import type { BoardStep } from '../routing'

const STEP_INDEX: Record<BoardStep, number> = {
  advisors: 0,
  students: 1,
  review: 2,
  pairing: 3,
}

export function BoardSetupProgress({ step, completed = false }: { step: BoardStep; completed?: boolean }) {
  return (
    <Stepper active={completed ? 4 : STEP_INDEX[step]} allowNextStepsSelect={false}>
      <Stepper.Step label="Advisors" />
      <Stepper.Step label="Students" />
      <Stepper.Step label="Review" />
      <Stepper.Step label="Matching" />
    </Stepper>
  )
}
