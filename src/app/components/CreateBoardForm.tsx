import { Button, Group, NativeSelect, Paper, Title } from '@mantine/core'
import type { FormEvent } from 'react'
import { genreLabel, type Genre } from '../../domain/taxonomy'

export type BoardFormValue = { genre: Genre }

export function CreateBoardForm({ genres, onSubmit }: { genres: readonly Genre[]; onSubmit(value: BoardFormValue): boolean }) {
  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    if (onSubmit({ genre: form.get('genre') as Genre })) {
      formElement.reset()
    }
  }

  return (
    <Paper component="section" withBorder radius="md" p="lg" mb="xl" aria-labelledby="create-board-title">
      <Title order={2} size="h3" id="create-board-title" mb="md">Create board</Title>
      <form onSubmit={submit}>
        <Group align="flex-end">
          <NativeSelect name="genre" label="Genre" data={genres.map((genre) => ({ value: genre, label: genreLabel(genre) }))} />
          <Button type="submit">Create board</Button>
        </Group>
      </form>
    </Paper>
  )
}
