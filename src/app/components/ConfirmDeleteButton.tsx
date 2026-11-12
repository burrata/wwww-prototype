import { Button, Group, Modal, Text } from '@mantine/core'
import { useState } from 'react'

type ConfirmDeleteButtonProps = {
  itemName: string
  itemType: string
  description: string
  triggerLabel?: string
  confirmLabel?: string
  title?: string
  onConfirm(): void
}

export function ConfirmDeleteButton({
  itemName,
  itemType,
  description,
  triggerLabel = 'Delete',
  confirmLabel = `Delete ${itemType}`,
  title = `Delete ${itemType} “${itemName}”?`,
  onConfirm,
}: ConfirmDeleteButtonProps) {
  const [opened, setOpened] = useState(false)

  function confirm(): void {
    onConfirm()
    setOpened(false)
  }

  return (
    <>
      <Button
        variant="subtle"
        color="red"
        size="compact-sm"
        aria-label={[triggerLabel, itemType, itemName].filter(Boolean).join(' ')}
        onClick={() => setOpened(true)}
      >
        {triggerLabel}
      </Button>
      <Modal opened={opened} onClose={() => setOpened(false)} title={title} centered>
        <Text mb="lg">{description}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setOpened(false)}>Cancel</Button>
          <Button color="red" onClick={confirm}>{confirmLabel}</Button>
        </Group>
      </Modal>
    </>
  )
}
