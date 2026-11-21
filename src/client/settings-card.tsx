import { useSyncExternalStore, useState } from 'react'
import { markdownInputSettingsOf } from './feature-settings.ts'
import type { ComposerKey } from './locales.ts'

interface SettingsSnapshot {
  status: 'loading' | 'ready' | 'unavailable'
  value: unknown
  writable: boolean
}

/** The Host-backed form that reads and persists this plugin's two opt-ins. */
export interface MarkdownInputSettingsForm {
  getSnapshot(): SettingsSnapshot
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<boolean>
}

/**
 * Build the Plugins-page card around the Host-owned ConfigForm. The bundle
 * page supplies the navigation/title; this card owns the actual preferences.
 */
export function createMarkdownInputSettingsCard(
  form: MarkdownInputSettingsForm | undefined,
  t: (key: ComposerKey) => string,
): () => JSX.Element {
  if (!form) {
    return function UnavailableMarkdownInputSettingsCard(): JSX.Element {
      return <p role="status">{t('settings.unavailable')}</p>
    }
  }

  return function MarkdownInputSettingsCard(): JSX.Element {
    const snapshot = useSyncExternalStore(
      listener => form.subscribe(listener),
      () => form.getSnapshot(),
      () => form.getSnapshot(),
    )
    const [error, setError] = useState<string | undefined>()
    const settings = markdownInputSettingsOf(snapshot.value)

    const setFeature = async (field: 'composerEnabled' | 'messageMarkdownEnabled', value: boolean) => {
      setError(undefined)
      try {
        const accepted = await form.set(field, value)
        if (!accepted) setError(t('settings.error.refused'))
      } catch {
        setError(t('settings.error.failed'))
      }
    }

    if (snapshot.status === 'loading') {
      return <p role="status">{t('settings.loading')}</p>
    }
    if (snapshot.status === 'unavailable') {
      return <p role="status">{t('settings.unavailable')}</p>
    }

    return (
      <section aria-label={t('settings.title')} style={{ display: 'grid', gap: 16, maxWidth: 680 }}>
        <div>
          <h2 style={{ margin: '0 0 6px' }}>{t('settings.title')}</h2>
          <p style={{ margin: 0, opacity: 0.75 }}>{t('settings.description')}</p>
        </div>
        <label style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 10, alignItems: 'start' }}>
          <input
            type="checkbox"
            checked={settings.composerEnabled}
            disabled={!snapshot.writable}
            onChange={event => { void setFeature('composerEnabled', event.currentTarget.checked) }}
          />
          <span>
            <strong>{t('settings.composer.label')}</strong>
            <br />
            <span style={{ opacity: 0.75 }}>{t('settings.composer.description')}</span>
          </span>
        </label>
        <label style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 10, alignItems: 'start' }}>
          <input
            type="checkbox"
            checked={settings.messageMarkdownEnabled}
            disabled={!snapshot.writable}
            onChange={event => { void setFeature('messageMarkdownEnabled', event.currentTarget.checked) }}
          />
          <span>
            <strong>{t('settings.messages.label')}</strong>
            <br />
            <span style={{ opacity: 0.75 }}>{t('settings.messages.description')}</span>
          </span>
        </label>
        {!snapshot.writable && <p role="status">{t('settings.readOnly')}</p>}
        {error && <p role="alert">{error}</p>}
        <p style={{ margin: 0, opacity: 0.75 }}>{t('settings.reload')}</p>
      </section>
    )
  }
}
