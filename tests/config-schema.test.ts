import { describe, expect, it } from 'vitest'
import { Config } from '../src/index.ts'

describe('plugin Config form schema', () => {
  it('exposes both opt-in flags as volatile settings with false defaults', () => {
    expect(Config.dict?.composerEnabled?.meta).toMatchObject({ default: false, volatile: true })
    expect(Config.dict?.messageMarkdownEnabled?.meta).toMatchObject({ default: false, volatile: true })
  })
})
