import { Stack, Text, Title } from '@mantine/core'
import { ConfirmDeleteButton } from '../components/ConfirmDeleteButton'

export function StorageErrorPage({ message, onDiscard }: { message: string; onDiscard(): void }) {
  return (
    <Stack gap="md">
      <Title order={1}>Saved data could not be loaded</Title>
      <Text>{message}</Text>
      <ConfirmDeleteButton
        itemName=""
        itemType="invalid saved data"
        description="This will remove the app's invalid saved data and start with an empty app."
        triggerLabel="Discard"
        confirmLabel="Discard saved data"
        title="Discard invalid saved data?"
        onConfirm={onDiscard}
      />
    </Stack>
  )
}
