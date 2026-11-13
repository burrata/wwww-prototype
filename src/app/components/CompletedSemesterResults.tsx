import { Alert, Button, Checkbox, Stack, Text, Title } from '@mantine/core'
import { useState } from 'react'
import type { AppDocument } from '../../domain/app-document'
import type { Board } from '../../domain/board'
import type { Semester } from '../../domain/semester'
import type { MatchResultSort } from '../../domain/selectors/result-selectors'
import { genreLabel, termLabel } from '../../domain/taxonomy'
import { MatchResultsTable } from './MatchResultsTable'
import { PrintCustomizations } from './PrintCustomizations'
import { DEFAULT_RESULT_COLUMNS, type ResultColumn } from './result-view-options'

export function CompletedSemesterResults({
  document,
  semester,
  boards,
}: {
  document: AppDocument
  semester: Semester
  boards: Board[]
}) {
  const [sort, setSort] = useState<MatchResultSort>('student')
  const [columns, setColumns] = useState<ResultColumn[]>(DEFAULT_RESULT_COLUMNS)
  const [separatePages, setSeparatePages] = useState(false)
  const completedBoards = boards.filter(
    (board) => document.pairingSessions[board.id]?.status === 'complete',
  )

  if (completedBoards.length === 0) {
    return (
      <Alert color="blue" title="Semester results">
        Complete a board to print semester matches.
      </Alert>
    )
  }

  return (
    <Stack gap="xl" className="print-results">
      <Title order={2} className="print-only">{termLabel(semester.term)} {semester.year}</Title>
      <PrintCustomizations
        sort={sort}
        columns={columns}
        onSortChange={setSort}
        onColumnsChange={setColumns}
        preferences={(
          <Checkbox
            label="Start each board on a new page"
            checked={separatePages}
            onChange={(event) => setSeparatePages(event.currentTarget.checked)}
          />
        )}
      >
        <Button variant="default" onClick={() => window.print()}>Print all boards / Save PDF</Button>
      </PrintCustomizations>
      {completedBoards.map((board, index) => {
        const listTitle = `${termLabel(semester.term)} ${semester.year} - ${genreLabel(board.genre)}`
        return (
          <Stack
            key={board.id}
            gap="sm"
            className={`semester-board-results${separatePages && index > 0 ? ' print-new-page' : ''}`}
          >
            <Title order={3}>{listTitle}</Title>
            <MatchResultsTable
              document={document}
              boardId={board.id}
              sort={sort}
              columns={columns}
              label={listTitle}
            />
          </Stack>
        )
      })}
      {completedBoards.length < boards.length && (
        <Text size="sm" c="dimmed" className="print-hidden">Incomplete boards are not included.</Text>
      )}
    </Stack>
  )
}
