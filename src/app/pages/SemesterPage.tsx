import { Anchor, Stack, Title } from '@mantine/core'
import type { AppDocument } from '../../domain/app-document'
import { createBoard, deleteBoard } from '../../domain/commands/board-commands'
import { listBoardsForSemester } from '../../domain/selectors/board-selectors'
import { GENRES, termLabel } from '../../domain/taxonomy'
import { BoardList } from '../components/BoardList'
import { CreateBoardForm, type BoardFormValue } from '../components/CreateBoardForm'
import { NotFoundPage } from './NotFoundPage'

type Commit = (change: (current: AppDocument) => AppDocument) => boolean

export function SemesterPage({ document, semesterId, commit }: { document: AppDocument; semesterId: string; commit: Commit }) {
  const semester = document.semesters[semesterId]
  if (!semester) return <NotFoundPage />
  const boards = listBoardsForSemester(document, semesterId)
  const usedGenres = new Set(boards.map((board) => board.genre))
  const availableGenres = GENRES.filter((genre) => !usedGenres.has(genre))

  function create(value: BoardFormValue): boolean {
    return commit((current) => createBoard(current, {
      id: crypto.randomUUID(), semesterId, ...value,
    }))
  }

  return (
    <Stack gap="lg">
      <Anchor href="#/">← Semesters</Anchor>
      <Title order={1}>{termLabel(semester.term)} {semester.year}</Title>
      {availableGenres.length > 0 && <CreateBoardForm genres={availableGenres} onSubmit={create} />}
      <Title order={2} size="h3">Boards</Title>
      <BoardList boards={boards} onDelete={(id) => commit((current) => deleteBoard(current, id))} />
    </Stack>
  )
}
