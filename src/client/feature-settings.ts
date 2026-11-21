/** Independent user-controlled feature gates for the composer and chat renderers. */
export interface MarkdownInputSettings {
  readonly composerEnabled: boolean
  readonly messageMarkdownEnabled: boolean
}

/** Safe default when no supported config form is available. */
export const DEFAULT_MARKDOWN_INPUT_SETTINGS: MarkdownInputSettings = Object.freeze({
  composerEnabled: false,
  messageMarkdownEnabled: false,
})

/**
 * Read the two opt-in flags from an untrusted config value. Missing or malformed
 * values stay disabled so this plugin cannot unexpectedly claim another
 * plugin's composer or message-rendering slots.
 * @param value - the current plugin configuration form value.
 */
export function markdownInputSettingsOf(value: unknown): MarkdownInputSettings {
  if (typeof value !== 'object' || value === null) return DEFAULT_MARKDOWN_INPUT_SETTINGS
  const record = value as Record<string, unknown>
  return {
    composerEnabled: record.composerEnabled === true,
    messageMarkdownEnabled: record.messageMarkdownEnabled === true,
  }
}
