import { describe, it, expect } from 'vitest'
import { checkComponentLifespan, LifecycleThreshold } from '@/utils/maintenance'

describe('Maintenance - component lifespan check', () => {
  it('should return warning alert at 25% remaining', () => {
    const result = checkComponentLifespan(25)
    expect(result.level).toBe('warning')
    expect(result.threshold).toBe(LifecycleThreshold.WARNING)
  })

  it('should return urgent alert at 8% remaining', () => {
    const result = checkComponentLifespan(8)
    expect(result.level).toBe('urgent')
    expect(result.threshold).toBe(LifecycleThreshold.URGENT)
  })

  it('should return expired alert at 0% remaining', () => {
    const result = checkComponentLifespan(0)
    expect(result.level).toBe('expired')
    expect(result.threshold).toBe(LifecycleThreshold.EXPIRED)
  })

  it('should return ok above 30% remaining', () => {
    const result = checkComponentLifespan(50)
    expect(result.level).toBe('ok')
  })

  it('should return ok at exactly 30% remaining (boundary)', () => {
    const result = checkComponentLifespan(30)
    expect(result.level).toBe('ok')
  })
})
