import { describe, it, expect, beforeEach } from 'vitest'
import { MockService } from '@/mock/mockService'
import { storage, STORAGE_KEYS } from '@/utils/storage'

describe('NavigationPoint migration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should migrate waypoints to navigation points', () => {
    // Seed old-format waypoints
    const oldWaypoints = [
      { id: 'wp-1', mapId: 'map-001', name: '旧导航点', position: { x: 100, y: 200 }, updatedAt: new Date() }
    ]
    storage.set('waypoints', oldWaypoints)

    // Run initialization which triggers migration
    MockService.initializeData()

    // Should be readable via navigation points
    const navPoints = MockService.getNavigationPoints()
    expect(navPoints.length).toBeGreaterThan(0)
  })

  it('should have waypointId deprecated and still readable', () => {
    MockService.initializeData()
    
    // getWaypoints should still work (deprecated but compatible)
    const waypoints = MockService.getWaypoints()
    expect(Array.isArray(waypoints)).toBe(true)
  })
})
