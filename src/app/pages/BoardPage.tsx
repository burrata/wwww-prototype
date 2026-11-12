import { Alert, Anchor, Button, Group, Stack, Title } from '@mantine/core'
import type { AppDocument } from '../../domain/app-document'
import { createAdvisor, deleteAdvisor, updateAdvisor, type AdvisorInput } from '../../domain/commands/advisor-commands'
import { listAdvisorsForBoard, totalAdvisorCapacity } from '../../domain/selectors/advisor-selectors'
import { createStudent, deleteStudent, updateStudent, type StudentInput } from '../../domain/commands/student-commands'
import {
  cancelStudentResolution,
  confirmResolution,
  confirmSoleRequest,
  deferCurrentStudent,
  restartUnresolvedPass,
  selectStudentForResolution,
  setAdvisorRequest,
  startBoardPairing,
  undoLastPairingAction,
  unassignStudent,
} from '../../domain/commands/pairing-commands'
import { listPreviousStudentsForAdvisor, listStudentsForBoard } from '../../domain/selectors/student-selectors'
import { genreLabel, termLabel } from '../../domain/taxonomy'
import { AdvisorList } from '../components/AdvisorList'
import { CreateAdvisorForm } from '../components/CreateAdvisorForm'
import { CreateStudentForm } from '../components/CreateStudentForm'
import { StudentList } from '../components/StudentList'
import { BoardFeasibility } from '../components/BoardFeasibility'
import { BoardSetupProgress } from '../components/BoardSetupProgress'
import { AdvisorOverview } from '../components/AdvisorOverview'
import { PairingPresenter } from '../components/PairingPresenter'
import { navigate, type BoardStep } from '../routing'
import { NotFoundPage } from './NotFoundPage'

type Commit = (change: (current: AppDocument) => AppDocument) => boolean

type BoardPageProps = {
  document: AppDocument
  boardId: string
  step?: BoardStep
  commit: Commit
}

export function BoardPage({ document, boardId, step: requestedStep, commit }: BoardPageProps) {
  const board = document.boards[boardId]
  if (!board) return <NotFoundPage />
  const semester = document.semesters[board.semesterId]
  if (!semester) return <NotFoundPage />
  const advisors = listAdvisorsForBoard(document, boardId)
  const students = listStudentsForBoard(document, boardId)
  const pairingSession = document.pairingSessions[boardId]
  const previousStudentsByAdvisorId = Object.fromEntries(
    advisors.map((advisor) => [advisor.id, listPreviousStudentsForAdvisor(document, advisor.id)]),
  )
  const inferredStep: BoardStep = pairingSession
    ? 'pairing'
    : advisors.length === 0
    ? 'advisors'
    : students.length === 0 ? 'students' : 'review'
  const step = pairingSession ? 'pairing' : requestedStep ?? inferredStep
  const capacityMatches = students.length > 0 && totalAdvisorCapacity(advisors) === students.length

  function addAdvisor(value: AdvisorInput): boolean {
    return commit((current) => createAdvisor(current, {
      id: crypto.randomUUID(), boardId, ...value,
    }))
  }
  function addStudent(value: StudentInput): boolean {
    return commit((current) => createStudent(current, {
      id: crypto.randomUUID(), boardId, ...value,
    }))
  }
  function beginPairing(): void {
    if (commit((current) => startBoardPairing(current, boardId))) {
      navigate(`/boards/${boardId}/pairing`)
    }
  }
  function toggleRequest(studentId: string, advisorId: string, requested: boolean): boolean {
    return commit((current) => setAdvisorRequest(current, {
      boardId,
      studentId,
      advisorId,
      requested,
      requestedAt: new Date().toISOString(),
    }))
  }
  function deferStudent(studentId: string): boolean {
    return commit((current) => deferCurrentStudent(current, { boardId, studentId }))
  }
  function confirmPairing(studentId: string, advisorId: string): boolean {
    return commit((current) => confirmSoleRequest(current, {
      id: crypto.randomUUID(),
      boardId,
      studentId,
      advisorId,
      assignedAt: new Date().toISOString(),
    }))
  }
  function selectResolution(studentId: string): boolean {
    return commit((current) => selectStudentForResolution(current, { boardId, studentId }))
  }
  function cancelResolution(): boolean {
    return commit((current) => cancelStudentResolution(current, boardId))
  }
  function resolvePairing(studentId: string, advisorId: string): boolean {
    return commit((current) => confirmResolution(current, {
      id: crypto.randomUUID(),
      boardId,
      studentId,
      advisorId,
      assignedAt: new Date().toISOString(),
    }))
  }
  function restartPass(): boolean {
    return commit((current) => restartUnresolvedPass(current, boardId))
  }
  function undoPairingAction(): boolean {
    return commit((current) => undoLastPairingAction(current, boardId))
  }
  function undoStudentAssignment(studentId: string): boolean {
    return commit((current) => unassignStudent(current, { boardId, studentId }))
  }
  const advisorList = (
    <AdvisorList
      advisors={advisors}
      previousStudentsByAdvisorId={previousStudentsByAdvisorId}
      onEdit={(id, value) => commit((current) => updateAdvisor(current, id, value))}
      onDelete={(id) => commit((current) => deleteAdvisor(current, id))}
    />
  )
  const studentList = (
    <StudentList
      document={document}
      students={students}
      advisors={advisors}
      onEdit={(id, value) => commit((current) => updateStudent(current, id, value))}
      onDelete={(id) => commit((current) => deleteStudent(current, id))}
    />
  )

  return (
    <Stack gap="lg">
      <Anchor href={`#/semesters/${semester.id}`}>← {termLabel(semester.term)} {semester.year}</Anchor>
      <div>
        <Title order={1}>{genreLabel(board.genre)}</Title>
      </div>
      <BoardSetupProgress step={step} />

      {step === 'advisors' && (
        <Stack gap="lg">
          <Title order={2}>Add advisors</Title>
          <CreateAdvisorForm onSubmit={addAdvisor} />
          {advisorList}
          <Group justify="flex-end">
            <Button onClick={() => navigate(`/boards/${board.id}/students`)} disabled={advisors.length === 0}>
              Next: Students
            </Button>
          </Group>
        </Stack>
      )}

      {step === 'students' && (
        <Stack gap="lg">
          <Title order={2}>Add students</Title>
          <AdvisorOverview advisors={advisors} />
          <CreateStudentForm advisors={advisors} onSubmit={addStudent} />
          {studentList}
          <Group justify="space-between">
            <Button component="a" href={`#/boards/${board.id}/advisors`} variant="default">Back</Button>
            <Button onClick={() => navigate(`/boards/${board.id}/review`)} disabled={students.length === 0}>
              Review
            </Button>
          </Group>
        </Stack>
      )}

      {step === 'review' && (
        <Stack gap="lg">
          <Title order={2}>Review board</Title>
          <BoardFeasibility advisors={advisors} students={students} />
          {advisorList}
          {studentList}
          <Group justify="space-between">
            <Group>
              <Button component="a" href={`#/boards/${board.id}/advisors`} variant="default">Edit advisors</Button>
              <Button component="a" href={`#/boards/${board.id}/students`} variant="default">Edit students</Button>
            </Group>
            <Button onClick={beginPairing} disabled={!capacityMatches}>
              Proceed to pairing
            </Button>
          </Group>
        </Stack>
      )}

      {step === 'pairing' && (pairingSession ? (
        <Stack gap="md">
          <Group justify="flex-end">
            <Button
              variant="default"
              disabled={pairingSession.undoStack.length === 0}
              onClick={undoPairingAction}
            >
              Undo
            </Button>
          </Group>
          <PairingPresenter
            document={document}
            session={pairingSession}
            onRequest={toggleRequest}
            onConfirm={confirmPairing}
            onDefer={deferStudent}
            onSelectResolution={selectResolution}
            onCancelResolution={cancelResolution}
            onConfirmResolution={resolvePairing}
            onRestartPass={restartPass}
            onUnassign={undoStudentAssignment}
          />
        </Stack>
      ) : (
        <Stack gap="md">
          <Alert color="red" title="Setup incomplete">
            Start pairing from Review after advisor capacity matches the student count.
          </Alert>
          <Group><Button component="a" href={`#/boards/${board.id}/review`}>Review board</Button></Group>
        </Stack>
      ))}
    </Stack>
  )
}
