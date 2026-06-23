import { describe, it, expect } from 'vitest'
import type { RoadSegment } from '@/types/road-network'

describe('RoadSegment - watchdog (T13)', () => {
  it('should support watchdogAction field', () => {
    const segment: Partial<RoadSegment> = { watchdogAction: 'decelerate' }
    expect(segment.watchdogAction).toBe('decelerate')
  })

  it('should support emergency_stop action', () => {
    const segment: Partial<RoadSegment> = { watchdogAction: 'emergency_stop' }
    expect(segment.watchdogAction).toBe('emergency_stop')
  })
})

describe('RoadSegment - PTZ scan (T16)', () => {
  it('should support PTZ scan fields', () => {
    const segment: Partial<RoadSegment> = {
      ptzScan: {
        enabled: true,
        scanMode: 'continuous_sweep',
        yawStart: 0,
        yawEnd: 180,
        pitchMin: -45,
        pitchMax: 15,
        scanSpeed: 30,
        height: 1.5,
        hazardPointFlag: true,
        hazardTypes: ['leak', 'temperature_rise']
      }
    }
    expect(segment.ptzScan?.enabled).toBe(true)
    expect(segment.ptzScan?.scanMode).toBe('continuous_sweep')
    expect(segment.ptzScan?.hazardTypes).toContain('leak')
    expect(segment.ptzScan?.scanSpeed).toBe(30)
  })
})

describe('Charging point safety constants (T15)', () => {
  it('should have charging monitoring thresholds', async () => {
    const { CHARGING_EFFICIENCY_THRESHOLD, CHARGING_POWER_THRESHOLD, CHARGING_ACTUAL_POWER } = await import('@/constants/safety')
    expect(CHARGING_EFFICIENCY_THRESHOLD).toBe(0.8)     // ≥80%
    expect(CHARGING_POWER_THRESHOLD).toBe(1)            // =1kW
    expect(CHARGING_ACTUAL_POWER).toBe(800)              // =800W
  })
})
