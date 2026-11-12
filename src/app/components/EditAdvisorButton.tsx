import { Button, Group, Modal, Stack, TextInput } from '@mantine/core'
import { useState, type FormEvent } from 'react'
import type { Advisor } from '../../domain/advisor'
import type { AdvisorInput } from '../../domain/commands/advisor-commands'
import { parseCapacity } from './advisor-form-validation'

export function EditAdvisorButton({ advisor, onSave }: { advisor: Advisor; onSave(value: AdvisorInput): boolean }) {
  const [opened, setOpened] = useState(false)
  const [capacityError, setCapacityError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const capacity = parseCapacity(String(form.get('capacity') ?? ''))
    if (capacity === null) {
      setCapacityError('Enter a whole number of at least 1.')
      return
    }
    setCapacityError('')
    if (onSave({
      givenName: String(form.get('givenName') ?? ''),
      familyName: String(form.get('familyName') ?? ''),
      capacity,
    })) setOpened(false)
  }

  const fullName = `${advisor.givenName} ${advisor.familyName}`
  return (
    <>
      <Button variant="default" size="compact-sm" aria-label={`Edit advisor ${fullName}`} onClick={() => setOpened(true)}>
        Edit
      </Button>
      <Modal opened={opened} onClose={() => setOpened(false)} title={`Edit ${fullName}`} centered>
        <form onSubmit={submit}>
          <Stack>
            <TextInput name="givenName" label="First name" defaultValue={advisor.givenName} required />
            <TextInput name="familyName" label="Last name" defaultValue={advisor.familyName} required />
            <TextInput
              name="capacity"
              label="Capacity"
              defaultValue={String(advisor.capacity)}
              inputMode="numeric"
              withAsterisk
              error={capacityError}
            />
            <Group justify="flex-end">
              <Button variant="default" type="button" onClick={() => setOpened(false)}>Cancel</Button>
              <Button type="submit">Save advisor</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  )
}
