import { afterEach, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { UserTextNodeProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import { resetEchoLocale, setEchoLocale } from '../src/client/echo-text-face.ts'
import { MarkdownUserTextRun } from '../src/client/message-text-adapter.tsx'

function run(text: string, display?: string): UserTextNodeProps<'text'> {
  return { node: { id: 'text', start: 0, end: text.length, data: { text, display } }, raw: text, interactive: true }
}
afterEach(() => { cleanup(); resetEchoLocale() })

it('renders only Markdown in the host text outlet, without adding a bubble or actions', () => {
  setEchoLocale(key => key)
  const { container } = render(<MarkdownUserTextRun {...run('**First**\nSecond')} />)
  expect(container.querySelector('strong')).toHaveTextContent('First')
  expect(container.querySelector('br')).toBeInTheDocument()
  expect(container.querySelector('[data-markdown-user-message], [data-markdown-user-bubble], button')).toBeNull()
})
it.each(['', ' '])('respects a host whitespace transform to %j', display => {
  setEchoLocale(key => key)
  const { container } = render(<MarkdownUserTextRun {...run('\n   ', display)} />)
  expect(container.textContent).toBe(display)
})
it('retains native plain text if no locale is available', () => {
  const { container } = render(<MarkdownUserTextRun {...run('**raw**')} />)
  expect(container.textContent).toBe('**raw**')
  expect(container.querySelector('strong')).toBeNull()
})
