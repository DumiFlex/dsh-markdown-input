import { useEffect, useRef, type ReactNode } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation'
import { bindNativeMarkdown } from './native-markdown.ts'

/** A session-scoped overlay occupant; its hidden anchor locates only its owner card. */
export function NativeMarkdownAdapter({ inputActions }: PropsRuntime<'conversation.input.overlay'>): ReactNode {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const card = ref.current?.closest<HTMLElement>('[data-composer-card]')
    if (!card) return
    return bindNativeMarkdown(card, markdown => {
      if (typeof inputActions?.captureInsertion !== 'function' || typeof inputActions.insertText !== 'function') return false
      return inputActions.insertText(markdown, inputActions.captureInsertion())
    })
  }, [inputActions])
  return <span hidden aria-hidden="true" ref={ref} data-markdown-native-adapter />
}
