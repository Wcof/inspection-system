import { describe, it, expect } from 'vitest'
import { migrateReverseAction } from '@/utils/road-segment-migration'

describe('Reverse action template migration', () => {
  it('should map allowReverse=false, allowUTurn=false → straight_pass', () => {
    expect(migrateReverseAction(false, false)).toBe('straight_pass')
  })

  it('should map allowReverse=false, allowUTurn=true → uturn_reenter', () => {
    expect(migrateReverseAction(false, true)).toBe('uturn_reenter')
  })

  it('should map allowReverse=true, allowUTurn=false → reverse_pass', () => {
    expect(migrateReverseAction(true, false)).toBe('reverse_pass')
  })

  it('should map allowReverse=true, allowUTurn=true → slow_pass', () => {
    expect(migrateReverseAction(true, true)).toBe('slow_pass')
  })

  it('should default to straight_pass for unknown', () => {
    expect(migrateReverseAction(undefined, undefined)).toBe('straight_pass')
  })
})
