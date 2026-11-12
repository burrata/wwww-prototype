import { Button, Group, NativeSelect, Paper, TextInput, Title } from '@mantine/core'
import type { FormEvent } from 'react'
import type { Term } from '../../domain/taxonomy'

export type SemesterFormValue = { term: Term; year: number }

export function CreateSemesterForm({ onSubmit }: { onSubmit(value: SemesterFormValue): void }) {
  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSubmit({ term: form.get('term') as Term, year: Number(form.get('year')) })
  }

  return (
    <Paper component="section" withBorder radius="md" p="lg" mb="xl" aria-labelledby="create-semester-title">
      <Title order={2} size="h3" id="create-semester-title" mb="md">Create semester</Title>
      <form onSubmit={submit}>
        <Group align="flex-end">
          <NativeSelect name="term" label="Term" defaultValue="spring" data={[
            { value: 'spring', label: 'Spring' }, { value: 'fall', label: 'Fall' },
          ]} />
          <TextInput name="year" label="Year" type="number" min="1000" max="9999" defaultValue={new Date().getFullYear()} required />
          <Button type="submit">Create semester</Button>
        </Group>
      </form>
    </Paper>
  )
}
