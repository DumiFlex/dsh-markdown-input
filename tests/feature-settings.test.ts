import { describe, expect, it } from 'vitest'
import { DEFAULT_MARKDOWN_INPUT_SETTINGS, markdownInputSettingsOf } from '../src/client/feature-settings.ts'

describe('markdownInputSettingsOf', () => {
  it('disables both features when settings are missing or malformed', () => {
    expect(markdownInputSettingsOf(undefined)).toEqual(DEFAULT_MARKDOWN_INPUT_SETTINGS)
    expect(markdownInputSettingsOf(null)).toEqual(DEFAULT_MARKDOWN_INPUT_SETTINGS)
    expect(markdownInputSettingsOf('enabled')).toEqual(DEFAULT_MARKDOWN_INPUT_SETTINGS)
  })

  it('keeps the composer and message-rendering switches independent', () => {
    expect(markdownInputSettingsOf({ composerEnabled: true })).toEqual({
      composerEnabled: true,
      messageMarkdownEnabled: false,
    })
    expect(markdownInputSettingsOf({ messageMarkdownEnabled: true })).toEqual({
      composerEnabled: false,
      messageMarkdownEnabled: true,
    })
  })

  it('accepts only explicit true values', () => {
    expect(markdownInputSettingsOf({ composerEnabled: 1, messageMarkdownEnabled: 'true' })).toEqual(
      DEFAULT_MARKDOWN_INPUT_SETTINGS,
    )
  })
})
