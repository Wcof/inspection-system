import { describe, it, expect, beforeEach } from 'vitest'
import { MockService } from '@/mock/mockService'

describe('MockService smoke test', () => {
  beforeEach(() => {
    localStorage.clear()
    MockService.initializeData()
  })

  it('should load initial data and return inspection points', () => {
    const points = MockService.getInspectionPoints()
    expect(Array.isArray(points)).toBe(true)
    expect(points.length).toBeGreaterThan(0)
  })
})
