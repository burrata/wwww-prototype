import { Alert, Anchor, Box, Container, Divider } from '@mantine/core'
import type { ReactNode } from 'react'

export function AppFrame({ children, message }: { children: ReactNode; message?: string }) {
  return (
    <Container size="md" px="lg">
      <Box component="header" py="lg">
        <Anchor href="#/" c="dark" fw={700} underline="never" aria-label="Who Works With Whom? home">
          Who Works With Whom?
        </Anchor>
      </Box>
      <Divider />
      <Box component="main" id="main" py="xl">
        {message && <Alert color="red" mb="lg" role="alert">{message}</Alert>}
        {children}
      </Box>
    </Container>
  )
}
