import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createLocalDocumentStorage } from '../storage/local-storage'
import { documentWithBoard, documentWithStudent } from '../test/fixtures'
import { render } from '../test/render'
import { App } from './App'

function openBoard(document = documentWithBoard(), step = 'advisors') {
  createLocalDocumentStorage(window.localStorage).save(document)
  window.history.replaceState(null, '', `#/boards/board-1/${step}`)
  return render(<App />)
}

describe('board onboarding', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState(null, '', '#/')
  })

  it('moves from advisor-only entry to student-only entry', async () => {
    const user = userEvent.setup()
    openBoard()

    expect(screen.getByRole('region', { name: 'Add advisor' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Add student' })).not.toBeInTheDocument()
    const next = screen.getByRole('button', { name: 'Next: Students' })
    expect(next).toBeDisabled()

    const form = screen.getByRole('region', { name: 'Add advisor' })
    await user.type(within(form).getByRole('textbox', { name: /First name/ }), 'Morgan')
    await user.type(within(form).getByRole('textbox', { name: /Last name/ }), 'Lee')
    await user.click(within(form).getByRole('button', { name: 'Add advisor' }))
    expect(next).toBeEnabled()
    await user.click(next)

    expect(await screen.findByRole('region', { name: 'Add student' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Add advisor' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Advisor overview' })).toHaveTextContent('1 advisor · 3 slots')
  })

  it('blocks pairing until total capacity exactly matches the student count', async () => {
    const user = userEvent.setup()
    openBoard(documentWithStudent(), 'review')

    expect(screen.getByRole('alert')).toHaveTextContent(
      '1 student · 3 advisor slots. Reduce capacity by 2 slots.',
    )
    const proceed = screen.getByRole('button', { name: 'Proceed to pairing' })
    expect(proceed).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Edit advisor Morgan Lee' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit Morgan Lee' })
    const capacity = within(dialog).getByRole('textbox', { name: /Capacity/ })
    await user.clear(capacity)
    await user.type(capacity, '1')
    await user.click(within(dialog).getByRole('button', { name: 'Save advisor' }))

    expect(await screen.findByText(/1 student · 1 advisor slot · Ready/)).toBeInTheDocument()
    expect(proceed).toBeEnabled()
    await user.click(proceed)
    expect(await screen.findByRole('heading', { level: 2, name: 'Pairing' })).toBeInTheDocument()
  })
})
