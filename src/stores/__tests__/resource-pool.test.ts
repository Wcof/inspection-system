import { describe, it, expect, beforeEach } from 'vitest'
import { MockService } from '@/mock/mockService'

describe('DispatchResourcePool', () => {
  beforeEach(() => {
    localStorage.clear()
    MockService.initializeData()
  })

  it('should save and read a resource pool', () => {
    const pool = {
      id: 'pool-area-1',
      areaId: 'area-1',
      preferredRobotIds: ['robot-1', 'robot-2'],
      disabledTimeWindows: [
        { robotId: 'robot-1', start: '12:00', end: '13:00', reason: '充电' }
      ],
      robotTypeWhitelist: [
        { robotType: 'TypeA', allowedAreaIds: ['area-1', 'area-2'] }
      ]
    }
    MockService.saveDispatchResourcePool(pool)
    const pools = MockService.getDispatchResourcePools()
    expect(pools).toHaveLength(1)
    expect(pools[0].areaId).toBe('area-1')
    expect(pools[0].preferredRobotIds).toContain('robot-1')
    expect(pools[0].disabledTimeWindows).toHaveLength(1)
    expect(pools[0].robotTypeWhitelist).toHaveLength(1)
  })

  it('should update existing pool', () => {
    const pool = {
      id: 'pool-area-1',
      areaId: 'area-1',
      preferredRobotIds: ['robot-1'],
      disabledTimeWindows: [],
      robotTypeWhitelist: []
    }
    MockService.saveDispatchResourcePool(pool)
    
    pool.preferredRobotIds.push('robot-3')
    MockService.saveDispatchResourcePool(pool)
    
    const pools = MockService.getDispatchResourcePools()
    expect(pools).toHaveLength(1)
    expect(pools[0].preferredRobotIds).toContain('robot-3')
  })
})
