import { Anchor, Stack, Text, Title } from '@mantine/core'
import type { AppDocument } from '../../domain/app-document'
import { genreLabel, termLabel } from '../../domain/taxonomy'
import { NotFoundPage } from './NotFoundPage'

export function BoardPage({ document, boardId }: { document: AppDocument; boardId: string }) {
  const board = document.boards[boardId]
  if (!board) return <NotFoundPage />
  const semester = document.semesters[board.semesterId]
  if (!semester) return <NotFoundPage />
  return (
    <Stack gap="md">
      <Anchor href={`#/semesters/${semester.id}`}>← {termLabel(semester.term)} {semester.year}</Anchor>
      <Title order={1}>{board.name}</Title>
      <Text>{genreLabel(board.genre)}</Text>
    </Stack>
  )
}
