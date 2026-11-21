/**
 * dsh-markdown-input, host half. Pure UI plugin: the host-side apply exists
 * so the plugin appears in the Loader; all user-facing behavior ships in the
 * browser half (exports["./client"]), discovered through the package.json
 * dsh.client declaration. User-facing feature settings control the composer
 * takeover and user-message Markdown seats; both default off so those slot
 * replacements cannot compete with other plugins unless explicitly enabled.
 * @module dsh-markdown-input
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

/** User-facing feature settings; both risky slot replacements are opt-in. */
export const Config = z.object({
  composerEnabled: z.boolean().default(false).description('Enable the Markdown composer takeover.'),
  messageMarkdownEnabled: z.boolean().default(false).description('Render sent user and queued messages as Markdown.'),
})

/** Plugin id used by cordis patch rows to locate this module. */
export const name = 'markdown-input'

/**
 * Host plugin body — no host-side behavior.
 * @param ctx - plugin context.
 */
export function apply(ctx: Context): void {
  void ctx
}
