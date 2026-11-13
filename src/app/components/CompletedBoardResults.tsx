import { Button, Stack, Title } from '@mantine/core'
import { useState } from 'react'
import type { AppDocument } from '../../domain/app-document'
import type { MatchResultSort } from '../../domain/selectors/result-selectors'
import { genreLabel, termLabel } from '../../domain/taxonomy'
import { MatchResultsTable } from './MatchResultsTable'
import { PrintCustomizations } from './PrintCustomizations'
import { DEFAULT_RESULT_COLUMNS, type ResultColumn } from './result-view-options'

export function CompletedBoardResults({ document, boardId }: { document: AppDocument; boardId: string }) {
  const [sort, setSort] = useState<MatchResultSort>('student')
  const [columns, setColumns] = useState<ResultColumn[]>(DEFAULT_RESULT_COLUMNS)
  const board = document.boards[boardId]
  const semester = board ? document.semesters[board.semesterId] : undefined
  const listTitle = board && semester
    ? `${termLabel(semester.term)} ${semester.year} - ${genreLabel(board.genre)}`
    : 'Final matches'

  return (
    <Stack gap="md" className="print-results">
      <Title order={3}>{listTitle}</Title>
      <PrintCustomizations
        sort={sort}
        columns={columns}
        onSortChange={setSort}
        onColumnsChange={setColumns}
      >
        <Button variant="default" onClick={() => window.print()}>Print / Save PDF</Button>
      </PrintCustomizations>
      <MatchResultsTable document={document} boardId={boardId} sort={sort} columns={columns} label={listTitle} />
    </Stack>
  )
}
