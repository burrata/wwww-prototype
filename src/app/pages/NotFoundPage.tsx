import { Anchor, Stack, Text, Title } from '@mantine/core'

export function NotFoundPage() {
  return (
    <Stack gap="md">
      <Title order={1}>Not found</Title>
      <Text>The requested item does not exist.</Text>
      <Anchor href="#/">Return to semesters</Anchor>
    </Stack>
  )
}
