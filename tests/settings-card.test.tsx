import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMarkdownInputSettingsCard, type MarkdownInputSettingsForm } from '../src/client/settings-card.tsx'
import { en } from '../src/client/locales.ts'

afterEach(cleanup)

function makeForm(options: {
  status?: 'loading' | 'ready' | 'unavailable'
  writable?: boolean
  value?: unknown
  acceptWrite?: boolean
} = {}): MarkdownInputSettingsForm & { set: ReturnType<typeof vi.fn> } {
  let snapshot = {
    status: options.status ?? 'ready',
    value: options.value ?? { composerEnabled: false, messageMarkdownEnabled: false },
    writable: options.writable ?? true,
  }
  const listeners = new Set<() => void>()
  const set = vi.fn(async (field: string, value: unknown) => {
    if (options.acceptWrite === false) return false
    snapshot = { ...snapshot, value: { ...(snapshot.value as object), [field]: value } }
    for (const listener of listeners) listener()
    return true
  })
  return {
    getSnapshot: () => snapshot,
    subscribe: listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    set,
  }
}

const t = (key: keyof typeof en) => en[key]

describe('Markdown Input bundle settings page', () => {
  it('saves the composer and user-message toggles independently', async () => {
    const form = makeForm()
    const Card = createMarkdownInputSettingsCard(form, t)
    const view = render(<Card />)

    const composer = view.getByRole('checkbox', { name: /Enable the Markdown composer/ })
    const messages = view.getByRole('checkbox', { name: /Render sent user messages as Markdown/ })
    expect(composer).not.toBeChecked()
    expect(messages).not.toBeChecked()

    await act(async () => { fireEvent.click(composer) })
    await waitFor(() => expect(form.set).toHaveBeenCalledWith('composerEnabled', true))
    expect(composer).toBeChecked()
    expect(messages).not.toBeChecked()

    await act(async () => { fireEvent.click(messages) })
    await waitFor(() => expect(form.set).toHaveBeenCalledWith('messageMarkdownEnabled', true))
    expect(composer).toBeChecked()
    expect(messages).toBeChecked()
  })

  it('does not permit edits while the profile is read-only', () => {
    const Card = createMarkdownInputSettingsCard(makeForm({ writable: false }), t)
    const view = render(<Card />)
    expect(view.getByRole('checkbox', { name: /Enable the Markdown composer/ })).toBeDisabled()
    expect(view.getByRole('checkbox', { name: /Render sent user messages as Markdown/ })).toBeDisabled()
  })

  it('shows the loading and unavailable states without enabling features', () => {
    const LoadingCard = createMarkdownInputSettingsCard(makeForm({ status: 'loading' }), t)
    const loading = render(<LoadingCard />)
    expect(loading.getByRole('status').textContent).toContain('Loading Markdown Input settings')
    loading.unmount()

    const UnavailableCard = createMarkdownInputSettingsCard(makeForm({ status: 'unavailable' }), t)
    const unavailable = render(<UnavailableCard />)
    expect(unavailable.getByRole('status').textContent).toContain('unavailable')
  })

  it('reports a refused write', async () => {
    const form = makeForm({ acceptWrite: false })
    const Card = createMarkdownInputSettingsCard(form, t)
    const view = render(<Card />)
    await act(async () => {
      fireEvent.click(view.getByRole('checkbox', { name: /Enable the Markdown composer/ }))
    })
    expect(view.getByRole('alert').textContent).toContain('not saved')
  })
})
