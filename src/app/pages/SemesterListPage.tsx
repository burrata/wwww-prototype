import { Stack, Title } from '@mantine/core'
import type { AppDocument } from '../../domain/app-document'
import { createSemester, deleteSemester } from '../../domain/commands/semester-commands'
import { listSemesters } from '../../domain/selectors/semester-selectors'
import { CreateSemesterForm, type SemesterFormValue } from '../components/CreateSemesterForm'
import { SemesterList } from '../components/SemesterList'
import { navigate } from '../routing'

type Commit = (change: (current: AppDocument) => AppDocument) => boolean

export function SemesterListPage({ document, commit }: { document: AppDocument; commit: Commit }) {
  function create(value: SemesterFormValue): void {
    const id = crypto.randomUUID()
    if (commit((current) => createSemester(current, { id, ...value }))) navigate(`/semesters/${id}`)
  }

  return (
    <Stack gap="lg">
      <Title order={1}>Semesters</Title>
      <CreateSemesterForm onSubmit={create} />
      <SemesterList semesters={listSemesters(document)} onDelete={(id) => commit((current) => deleteSemester(current, id))} />
    </Stack>
  )
}
