import {
  Alert,
  Button,
  Group,
  MultiSelect,
  NativeSelect,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core'
import { useRef, useState, type FormEvent } from 'react'
import type { Advisor } from '../../domain/advisor'
import type { StudentInput } from '../../domain/commands/student-commands'
import { findAdvisorsByName, normalizePersonName } from '../../domain/name-matching'
import type { PreviousAdvisingRelationship } from '../../domain/previous-advising-relationship'
import type { ProgramStage, Student } from '../../domain/student'
import { PROGRAM_STAGES, programStageLabel } from '../../domain/taxonomy'

type StudentFormProps = {
  advisors: Advisor[]
  student?: Student
  relationships?: PreviousAdvisingRelationship[]
  submitLabel: string
  resetAfterSubmit?: boolean
  onSubmit(value: StudentInput): boolean
}

function advisorName(advisor: Advisor): string {
  return `${advisor.givenName} ${advisor.familyName}`
}

function advisorChoiceLabel(advisor: Advisor, matching: Advisor[], advisors: Advisor[]): string {
  const entryNumber = advisors.indexOf(advisor) + 1
  const duplicateNumber = matching.indexOf(advisor) + 1
  return `${advisorName(advisor)} — match ${duplicateNumber}, board entry ${entryNumber}, capacity ${advisor.capacity}`
}

export function StudentForm({
  advisors,
  student,
  relationships = [],
  submitLabel,
  resetAfterSubmit = false,
  onSubmit,
}: StudentFormProps) {
  const givenNameRef = useRef<HTMLInputElement>(null)
  const [givenName, setGivenName] = useState(student?.givenName ?? '')
  const [familyName, setFamilyName] = useState(student?.familyName ?? '')
  const [programStage, setProgramStage] = useState<ProgramStage>(student?.programStage ?? 'first')
  const [preferenceIds, setPreferenceIds] = useState<string[]>(student?.studentRequestedAdvisorIds ?? [])
  const [historyText, setHistoryText] = useState(
    relationships.map((relationship) => relationship.previousAdvisorName).join('\n'),
  )
  const [resolutions, setResolutions] = useState<Record<string, string>>(() => Object.fromEntries(
    relationships.flatMap((relationship) => relationship.matchedCurrentAdvisorId
      ? [[normalizePersonName(relationship.previousAdvisorName), relationship.matchedCurrentAdvisorId]]
      : []),
  ))
  const [ambiguousNames, setAmbiguousNames] = useState<string[]>([])

  const previousNames = historyText
    .split(/[\n,]+/)
    .map((name) => name.trim().replace(/\s+/g, ' '))
    .filter(Boolean)

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const ambiguous = previousNames.filter((name) => {
      const matches = findAdvisorsByName(advisors, name)
      return matches.length > 1 && !matches.some((advisor) => advisor.id === resolutions[normalizePersonName(name)])
    })
    if (ambiguous.length > 0) {
      setAmbiguousNames(ambiguous)
      return
    }
    setAmbiguousNames([])
    const succeeded = onSubmit({
      givenName,
      familyName,
      programStage,
      studentRequestedAdvisorIds: preferenceIds,
      previousAdvisors: previousNames.map((name) => ({
        id: crypto.randomUUID(),
        name,
        selectedAdvisorId: resolutions[normalizePersonName(name)],
      })),
    })
    if (succeeded && resetAfterSubmit) {
      setGivenName('')
      setFamilyName('')
      setProgramStage('first')
      setPreferenceIds([])
      setHistoryText('')
      setResolutions({})
      givenNameRef.current?.focus()
    }
  }

  return (
    <form onSubmit={submit}>
      <Stack gap="md">
        <Group align="flex-start" grow>
          <TextInput ref={givenNameRef} label="First name" value={givenName} onChange={(event) => setGivenName(event.currentTarget.value)} required />
          <TextInput label="Last name" value={familyName} onChange={(event) => setFamilyName(event.currentTarget.value)} required />
          <NativeSelect
            label="Program stage"
            value={programStage}
            onChange={(event) => setProgramStage(event.currentTarget.value as ProgramStage)}
            data={PROGRAM_STAGES.map((stage) => ({ value: stage, label: programStageLabel(stage) }))}
          />
        </Group>
        <MultiSelect
          label="Requested advisors"
          description="Optional; does not affect eligibility."
          data={advisors.map((advisor) => ({ value: advisor.id, label: advisorName(advisor) }))}
          value={preferenceIds}
          onChange={setPreferenceIds}
          searchable
          clearable
        />
        <Textarea
          label="Previous advisors"
          description="Separate names with commas or new lines."
          value={historyText}
          onChange={(event) => setHistoryText(event.currentTarget.value)}
          rows={3}
        />
        {ambiguousNames.length > 0 && (
          <Alert color="yellow" title="Choose the matching advisor">
            <Stack mt="sm">
              {ambiguousNames.map((name) => {
                const normalizedName = normalizePersonName(name)
                const matches = findAdvisorsByName(advisors, name)
                return (
                  <NativeSelect
                    key={normalizedName}
                    label={`Which current advisor matches “${name}”?`}
                    value={resolutions[normalizedName] ?? ''}
                    onChange={(event) => setResolutions((current) => ({
                      ...current, [normalizedName]: event.currentTarget.value,
                    }))}
                    data={[
                      { value: '', label: 'Select an advisor' },
                      ...matches.map((advisor) => ({
                        value: advisor.id,
                        label: advisorChoiceLabel(advisor, matches, advisors),
                      })),
                    ]}
                  />
                )
              })}
            </Stack>
          </Alert>
        )}
        <Group justify="flex-end">
          <Button type="submit">{submitLabel}</Button>
        </Group>
      </Stack>
    </form>
  )
}
