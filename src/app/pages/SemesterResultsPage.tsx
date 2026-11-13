import { Anchor, Stack, Title } from '@mantine/core'
import type { AppDocument } from '../../domain/app-document'
import { listBoardsForSemester } from '../../domain/selectors/board-selectors'
import { termLabel } from '../../domain/taxonomy'
import { CompletedSemesterResults } from '../components/CompletedSemesterResults'
import { NotFoundPage } from './NotFoundPage'

export function SemesterResultsPage({ document, semesterId }: { document: AppDocument; semesterId: string }) {
  const semester = document.semesters[semesterId]
  if (!semester) return <NotFoundPage />
  const boards = listBoardsForSemester(document, semesterId)

  return (
    <Stack gap="lg">
      <Anchor href={`#/semesters/${semester.id}`}>← {termLabel(semester.term)} {semester.year}</Anchor>
      <Title order={1}>Semester results</Title>
      <CompletedSemesterResults document={document} semester={semester} boards={boards} />
    </Stack>
  )
}
