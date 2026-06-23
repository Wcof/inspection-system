import { describe, it, expect } from 'vitest'

describe('Edge inspection runtime - free roam mode', () => {
  it('should support generating mock frame data', async () => {
    const { generateMockFrame } = await import('@/utils/edge-inspection')
    const frame = generateMockFrame()
    expect(frame).toHaveProperty('frameId')
    expect(frame).toHaveProperty('timestamp')
    expect(frame).toHaveProperty('detections')
    expect(Array.isArray(frame.detections)).toBe(true)
  })

  it('should support roaming anomaly events', async () => {
    const { simulateRoamingAnomaly } = await import('@/utils/edge-inspection')
    const anomaly = simulateRoamingAnomaly()
    expect(anomaly).toHaveProperty('id')
    expect(anomaly).toHaveProperty('type')
    expect(anomaly).toHaveProperty('position')
    expect(anomaly).toHaveProperty('detectedAt')
  })

  it('should support blank area protection log', async () => {
    const { createBlankAreaLog } = await import('@/utils/edge-inspection')
    const log = createBlankAreaLog('yaw_avoid')
    expect(log.type).toBe('blank_area_protection')
    expect(log.reason).toBe('yaw_avoid')
  })
})
