import { describe, expect, it } from 'vitest'
import { ARROW_BACK, ARROW_FORWARD, labelBack } from './rtl'

describe('rtl', () => {
  it('uses RTL-oriented back and forward arrows', () => {
    expect(ARROW_BACK).toBe('→')
    expect(ARROW_FORWARD).toBe('←')
    expect(labelBack('חזרה')).toBe('→ חזרה')
  })
})
