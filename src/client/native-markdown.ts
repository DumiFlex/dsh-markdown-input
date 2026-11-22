import { markdownLanguage } from '@codemirror/lang-markdown'
import { decideRichPaste, plainPasteGestureTracker, readClipboard } from './paste-decision.ts'

const inputSelector = '[data-composer-input][contenteditable="true"]'
const paint = {
  heading: 'color:var(--dsh-accent, #ba684b)',
  emphasis: 'text-decoration:underline dotted',
  code: 'background-color:color-mix(in srgb, currentColor 12%, transparent)',
  link: 'text-decoration:underline',
  marker: 'color:color-mix(in srgb, currentColor 65%, transparent)',
} as const
type Kind = keyof typeof paint
const kinds = Object.keys(paint) as Kind[]
let serial = 0

function kindOf(name: string): Kind | undefined {
  if (/^(ATX|Setext)Heading/.test(name)) return 'heading'
  if (name === 'StrongEmphasis' || name === 'Emphasis' || name === 'Strikethrough') return 'emphasis'
  if (name === 'InlineCode' || name === 'CodeText') return 'code'
  if (name === 'Link' || name === 'URL' || name === 'Autolink') return 'link'
  if (name.endsWith('Mark') || name === 'TaskMarker') return 'marker'
  return undefined
}

/** Read native Lexical text and line boundaries without touching the editable DOM or chip labels. */
export function nativeMarkdownRanges(root: HTMLElement): Record<Kind, Range[]> {
  const result: Record<Kind, Range[]> = { heading: [], emphasis: [], code: [], link: [], marker: [] }
  const spans: { node: Text; start: number; end: number }[] = []
  let source = ''
  function visit(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const start = source.length
      source += node.textContent ?? ''
      if (source.length > start) spans.push({ node: node as Text, start, end: source.length })
    } else if (node instanceof Element) {
      if (node.matches('[contenteditable="false"], [data-lexical-decorator]')) { source += '\uFFFC'; return }
      if (node.tagName === 'BR') { source += '\n'; return }
      for (const child of node.childNodes) visit(child)
      if (node !== root && node.matches('p,div')) source += '\n'
    }
  }
  visit(root)
  // Large native pastes must stay responsive: skip optional paint, never truncate the draft.
  if (source.length > 65536) return result
  markdownLanguage.parser.parse(source).iterate({ enter({ name, from, to }) {
    const kind = kindOf(name)
    if (!kind) return
    // A range spanning a decorator would recolor the host chip, so split at native text boundaries.
    let lo = 0, hi = spans.length
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if (spans[mid]!.end <= from) lo = mid + 1
      else hi = mid
    }
    for (let i = lo; i < spans.length; i++) {
      const span = spans[i]!
      if (span.start >= to) break
      const range = root.ownerDocument.createRange()
      range.setStart(span.node, Math.max(from, span.start) - span.start)
      range.setEnd(span.node, Math.min(to, span.end) - span.start)
      result[kind].push(range)
    }
  } })
  return result
}

/** Bind only to one real resident card. There is no public Lexical extension hook. */
export function bindNativeMarkdown(card: HTMLElement, insert: (markdown: string) => boolean): () => void {
  const tracker = plainPasteGestureTracker()
  const targetInput = (target: EventTarget | null) => {
    const input = target instanceof Element ? target.closest(inputSelector) : null
    return input?.closest('[data-composer-card]') === card && !input.hasAttribute('data-composer-composing')
  }
  const keydown = (event: KeyboardEvent) => { if (targetInput(event.target)) tracker.keydown(event) }
  const paste = (event: ClipboardEvent) => {
    if (event.defaultPrevented || !event.cancelable || !targetInput(event.target)) return
    const decision = decideRichPaste(readClipboard(event.clipboardData), tracker.active())
    if (decision.action !== 'convert' || !insert(decision.markdown)) return
    event.preventDefault()
    event.stopPropagation() // handled; Lexical must not also insert the clipboard's plain text
  }
  card.addEventListener('keydown', keydown, true)
  card.addEventListener('paste', paste, true)
  let clearPaint = () => {}
  if (typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight === 'function') {
    const prefix = `dsh-md-native-${++serial}-`
    const tag = card.ownerDocument.createElement('style')
    tag.textContent = kinds.map(k => `::highlight(${prefix}${k}){${paint[k]}}`).join('\n')
    card.ownerDocument.head.append(tag)
    const refresh = () => {
      const root = card.querySelector<HTMLElement>(inputSelector)
      const ranges = root && root.closest('[data-composer-card]') === card ? nativeMarkdownRanges(root) : undefined
      for (const k of kinds) {
        if (!ranges?.[k].length) { CSS.highlights.delete(prefix + k); continue }
        const layer = new Highlight()
        for (const range of ranges[k]) layer.add(range)
        CSS.highlights.set(prefix + k, layer)
      }
    }
    refresh()
    // Toolbar meters/menus also mutate the card. Reparse only editor mutations or a root swap.
    const touchesInput = (node: Node): boolean => node instanceof Element &&
      (node.hasAttribute('data-composer-input') || node.querySelector('[data-composer-input]') !== null)
    const observer = new MutationObserver(records => {
      if (records.some(record => {
        const el = record.target instanceof Element ? record.target : record.target.parentElement
        return el?.closest('[data-composer-input]') || [...record.addedNodes, ...record.removedNodes].some(touchesInput)
      })) refresh()
    })
    observer.observe(card, { subtree: true, characterData: true, childList: true, attributes: true, attributeFilter: ['contenteditable'] })
    clearPaint = () => { observer.disconnect(); tag.remove(); for (const k of kinds) CSS.highlights.delete(prefix + k) }
  }
  return () => { clearPaint(); card.removeEventListener('keydown', keydown, true); card.removeEventListener('paste', paste, true) }
}
