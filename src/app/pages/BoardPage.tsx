import { Anchor, Stack, Text, Title } from '@mantine/core'
import type { AppDocument } from '../../domain/app-document'
import { createAdvisor, deleteAdvisor, updateAdvisor, type AdvisorInput } from '../../domain/commands/advisor-commands'
import { listAdvisorsForBoard } from '../../domain/selectors/advisor-selectors'
import { genreLabel, termLabel } from '../../domain/taxonomy'
import { AdvisorList } from '../components/AdvisorList'
import { CreateAdvisorForm } from '../components/CreateAdvisorForm'
import { NotFoundPage } from './NotFoundPage'

type Commit = (change: (current: AppDocument) => AppDocument) => boolean

export function BoardPage({ document, boardId, commit }: { document: AppDocument; boardId: string; commit: Commit }) {
  const board = document.boards[boardId]
  if (!board) return <NotFoundPage />
  const semester = document.semesters[board.semesterId]
  if (!semester) return <NotFoundPage />
  const advisors = listAdvisorsForBoard(document, boardId)

  function addAdvisor(value: AdvisorInput): boolean {
    return commit((current) => createAdvisor(current, {
      id: crypto.randomUUID(), boardId, ...value,
    }))
  }
  return (
    <Stack gap="md">
      <Anchor href={`#/semesters/${semester.id}`}>← {termLabel(semester.term)} {semester.year}</Anchor>
      <Title order={1}>{board.name}</Title>
      <Text>{genreLabel(board.genre)}</Text>
      <CreateAdvisorForm onSubmit={addAdvisor} />
      <AdvisorList
        advisors={advisors}
        onEdit={(id, value) => commit((current) => updateAdvisor(current, id, value))}
        onDelete={(id) => commit((current) => deleteAdvisor(current, id))}
      />
    </Stack>
  )
}
