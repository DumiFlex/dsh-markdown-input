import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindNativeMarkdown, nativeMarkdownRanges } from '../src/client/native-markdown.ts'

function fixture() {
  const card = document.createElement('div')
  card.setAttribute('data-composer-card', '')
  card.innerHTML = '<div data-composer-input contenteditable="true"><p><span>## Hello</span></p><p><span>**strong** and `code`</span><span data-lexical-decorator>**chip**</span></p></div><button>Send</button>'
  return { card, input: card.querySelector<HTMLElement>('[data-composer-input]')!, button: card.querySelector('button')! }
}
function paste(target: HTMLElement, files: File[] = []) {
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', { value: { files, getData: (type: string) => type === 'text/html' ? '<strong>rich</strong>' : 'rich' } })
  target.dispatchEvent(event)
  return event.defaultPrevented
}

afterEach(() => vi.unstubAllGlobals())

describe('native Markdown adapter', () => {
  it('paints parsed source ranges without modifying Lexical DOM or painting decorator chips', () => {
    const { input } = fixture()
    const original = input.innerHTML
    const ranges = nativeMarkdownRanges(input)
    expect(ranges.heading.map(String)).toEqual(['## Hello'])
    expect(ranges.emphasis.map(String)).toEqual(['**strong**'])
    expect(ranges.code.map(String)).toEqual(['`code`'])
    expect(input.innerHTML).toBe(original)
  })
  it('inserts converted paste once through the native selection and leaves submit and attachments alone', () => {
    const { card, input, button } = fixture()
    const insert = vi.fn(() => true), nativePaste = vi.fn(), submit = vi.fn()
    input.addEventListener('paste', nativePaste)
    button.addEventListener('click', submit)
    const dispose = bindNativeMarkdown(card, insert)
    expect(paste(input)).toBe(true)
    expect(insert.mock.calls).toEqual([['**rich**']])
    expect(nativePaste).not.toHaveBeenCalled()
    expect(paste(button)).toBe(false)
    expect(paste(input, [new File([''], 'image.png')])).toBe(false)
    button.click()
    expect(submit).toHaveBeenCalledOnce()
    dispose()
    expect(paste(input)).toBe(false)
    expect(insert).toHaveBeenCalledOnce()
  })
  it('fails open on a rejected insertion, read-only state, IME and paste-without-formatting', () => {
    const { card, input } = fixture()
    const insert = vi.fn(() => false)
    const dispose = bindNativeMarkdown(card, insert)
    expect(paste(input)).toBe(false)
    input.setAttribute('contenteditable', 'false')
    expect(paste(input)).toBe(false)
    input.setAttribute('contenteditable', 'true')
    input.setAttribute('data-composer-composing', '')
    expect(paste(input)).toBe(false)
    input.removeAttribute('data-composer-composing')
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', ctrlKey: true, shiftKey: true, bubbles: true }))
    expect(paste(input)).toBe(false)
    expect(insert).toHaveBeenCalledOnce()
    dispose()
  })
  it('repaints restored drafts, isolates simultaneous cards, and removes only its own paint', async () => {
    const registry = new Map<string, Set<Range>>()
    vi.stubGlobal('Highlight', Set)
    vi.stubGlobal('CSS', { highlights: registry })
    const a = fixture(), b = fixture()
    const stopA = bindNativeMarkdown(a.card, () => false), stopB = bindNativeMarkdown(b.card, () => false)
    const headings = () => [...registry].filter(([key]) => key.endsWith('-heading')).map(([, ranges]) => [...ranges].map(String).join(''))
    expect(headings()).toEqual(['## Hello', '## Hello'])
    a.input.textContent = '# restored'
    await Promise.resolve()
    expect(headings()).toEqual(['# restored', '## Hello'])
    stopA()
    expect(headings()).toEqual(['## Hello'])
    stopB()
    expect(registry.size).toBe(0)
  })
})
