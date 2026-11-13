import { Table } from '@mantine/core'
import type { AppDocument } from '../../domain/app-document'
import {
  listMatchResultsForBoard,
  type MatchResultSort,
} from '../../domain/selectors/result-selectors'
import { programStageLabel } from '../../domain/taxonomy'
import type { ResultColumn } from './result-view-options'

function fullName(person: { givenName: string; familyName: string }): string {
  return `${person.givenName} ${person.familyName}`
}

export function MatchResultsTable({
  document,
  boardId,
  sort,
  columns,
  label,
}: {
  document: AppDocument
  boardId: string
  sort: MatchResultSort
  columns: ResultColumn[]
  label: string
}) {
  const rows = listMatchResultsForBoard(document, boardId, sort)

  return (
    <Table.ScrollContainer minWidth={560} className="print-table-container">
      <Table striped withTableBorder aria-label={label}>
        <Table.Thead>
          <Table.Tr>
            {columns.includes('student') && <Table.Th>Student</Table.Th>}
            {columns.includes('program-stage') && <Table.Th>Program stage</Table.Th>}
            {columns.includes('advisor') && <Table.Th>Advisor</Table.Th>}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map(({ student, advisor, assignment }) => (
            <Table.Tr key={assignment.id}>
              {columns.includes('student') && <Table.Td>{fullName(student)}</Table.Td>}
              {columns.includes('program-stage') && <Table.Td>{programStageLabel(student.programStage)}</Table.Td>}
              {columns.includes('advisor') && <Table.Td>{fullName(advisor)}</Table.Td>}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
