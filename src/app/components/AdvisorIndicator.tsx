import { Badge, Tooltip } from '@mantine/core'

type AdvisorIndicatorProps = {
  name: string
  active: boolean
  excluded?: boolean
}

export function AdvisorIndicator({ name, active, excluded = false }: AdvisorIndicatorProps) {
  const status = excluded ? 'Excluded from matching' : active ? 'Active on this board' : 'Not active'
  return (
    <Tooltip label={status} withArrow>
      <Badge
        component="span"
        variant={active ? 'light' : 'outline'}
        color={excluded ? 'orange' : 'blue'}
        radius="xl"
        leftSection={<span aria-hidden="true">ⓘ</span>}
        style={active ? { border: '1px solid currentColor' } : undefined}
        tabIndex={0}
        aria-label={`${name}: ${status}`}
      >
        {name}
      </Badge>
    </Tooltip>
  )
}
