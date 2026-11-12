export function parseCapacity(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value.trim())) return null
  const capacity = Number(value)
  return Number.isSafeInteger(capacity) ? capacity : null
}
