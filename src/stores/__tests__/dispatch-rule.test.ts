import { describe, it, expect, beforeEach } from 'vitest'
import { MockService } from '@/mock/mockService'

describe('DispatchRule - fatigue segments', () => {
  beforeEach(() => {
    localStorage.clear()
    MockService.initializeData()
  })

  it('should save and read dispatch rules with fatigue segments', () => {
    const rule = {
      id: 'rule-001',
      name: '默认调度规则',
      fatigueSegments: [
        { timeRange: '12:00-14:00', frequencyMultiplier: 1.5, priorityBoost: 'high' },
        { timeRange: '22:00-06:00', frequencyMultiplier: 2, priorityBoost: 'emergency' }
      ]
    }
    MockService.saveDispatchRule(rule)
    const rules = MockService.getDispatchRules()
    expect(rules).toHaveLength(1)
    expect(rules[0].fatigueSegments).toHaveLength(2)
    expect(rules[0].fatigueSegments[0].frequencyMultiplier).toBe(1.5)
    expect(rules[0].fatigueSegments[1].priorityBoost).toBe('emergency')
  })
})
