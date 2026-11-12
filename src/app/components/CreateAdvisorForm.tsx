import { Button, Group, Paper, TextInput, Title } from '@mantine/core'
import { useRef, useState, type FormEvent } from 'react'
import type { AdvisorInput } from '../../domain/commands/advisor-commands'
import { parseCapacity } from './advisor-form-validation'

export function CreateAdvisorForm({ onSubmit }: { onSubmit(value: AdvisorInput): boolean }) {
  const givenNameRef = useRef<HTMLInputElement>(null)
  const [capacityError, setCapacityError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const capacity = parseCapacity(String(form.get('capacity') ?? ''))
    if (capacity === null) {
      setCapacityError('Enter a whole number of at least 1.')
      return
    }
    setCapacityError('')
    if (onSubmit({
      givenName: String(form.get('givenName') ?? ''),
      familyName: String(form.get('familyName') ?? ''),
      capacity,
    })) {
      formElement.reset()
      givenNameRef.current?.focus()
    }
  }

  return (
    <Paper component="section" withBorder radius="md" p="lg" aria-labelledby="add-advisor-title">
      <Title order={2} size="h3" id="add-advisor-title" mb="md">Add advisor</Title>
      <form onSubmit={submit}>
        <Group align="flex-start">
          <TextInput ref={givenNameRef} name="givenName" label="First name" required />
          <TextInput name="familyName" label="Last name" required />
          <TextInput
            name="capacity"
            label="Capacity"
            defaultValue="3"
            inputMode="numeric"
            withAsterisk
            error={capacityError}
          />
          <Button type="submit" mt={24}>Add advisor</Button>
        </Group>
      </form>
    </Paper>
  )
}
