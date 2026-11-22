/** Markdown for a host-classified plain run; the bubble and all non-text nodes remain native. */
import { useMemo } from 'react'
import type { UserTextNodeProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import { MarkdownText, UserTextRun } from '@deepseek-ai/dsh-client-ui-primitives'
import { echoLocale } from './echo-text-face.ts'
import { markdownLabels } from './message-markdown-labels.ts'
import { hardenSoftBreaks } from './user-markdown.ts'

export function MarkdownUserTextRun({ node }: UserTextNodeProps<'text'>) {
  const t = echoLocale()
  const labels = useMemo(() => t && markdownLabels(t), [t])
  const { text, display } = node.data
  // The host uses display even when it is empty (e.g. trimmed previews).
  // Whitespace alone must not disappear between adjacent inline chips.
  if (display !== undefined || !labels || !text.trim()) return <UserTextRun text={display ?? text} />
  return <MarkdownText text={hardenSoftBreaks(text)} labels={labels} />
}
