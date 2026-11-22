import type { MarkdownLabels } from '@deepseek-ai/dsh-client-ui-primitives'

/**
 * The six `chat` namespace keys the Markdown chrome reads (fence toolbar,
 * copy action, footnotes). Both the durable seat's and the echo seat's
 * translate types accept at least these, so one labels builder serves both.
 */
type MarkdownChromeKey =
  | 'copy'
  | 'copied'
  | 'codeBlock.title'
  | 'codeBlock.wrap'
  | 'codeBlock.unwrap'
  | 'markdown.footnotes'

/** Chat-seat copy for the Markdown chrome (same keys the host passes down). */
export function markdownLabels(t: (key: MarkdownChromeKey) => string): MarkdownLabels {
  return {
    code: {
      copyLabel: t('copy'),
      copiedLabel: t('copied'),
      // The fence toolbar's own labels (#77): without them CodeBlock sheds
      // the card + wrap/unwrap toggle and falls back to the bare copy
      // banner. Same `chat` keys the host's markdown-labels fold uses.
      toolbarLabels: {
        codeLabel: t('codeBlock.title'),
        wrapLabel: t('codeBlock.wrap'),
        unwrapLabel: t('codeBlock.unwrap'),
      },
    },
    footnotes: t('markdown.footnotes'),
  }
}
