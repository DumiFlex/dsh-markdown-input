import { describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { apply } from '../src/index.ts'

describe('host settings page policy', () => {
  it('disables generated config only for this plugin fiber and disposes with it', () => {
    const fiber = { id: Symbol('markdown-input-fiber') }
    const disposePolicy = vi.fn()
    const configure = vi.fn(() => disposePolicy)
    let effectCleanup: (() => void) | undefined
    const settingsCtx = {
      settings: { configure },
      effect(run: () => () => void) {
        effectCleanup = run()
      },
    }
    const ctx = {
      fiber,
      inject(names: string[], callback: (context: typeof settingsCtx) => void) {
        expect(names).toEqual(['settings'])
        callback(settingsCtx)
      },
    } as unknown as Context

    apply(ctx)

    expect(configure).toHaveBeenCalledWith({ auto: false }, fiber)
    effectCleanup?.()
    expect(disposePolicy).toHaveBeenCalledOnce()
  })

  it('does nothing if the settings service does not expose configure', () => {
    const ctx = {
      fiber: {},
      inject(_names: string[], callback: (context: { settings: object }) => void) {
        callback({ settings: {} })
      },
    } as unknown as Context
    expect(() => apply(ctx)).not.toThrow()
  })
})
