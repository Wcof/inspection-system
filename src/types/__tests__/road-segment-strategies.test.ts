import { describe, it, expect } from 'vitest'
import type { RoadSegment } from '@/types/road-network'

describe('RoadSegment - running strategies', () => {
  it('should have heartbeatIntervalMs and voiceReminder fields', () => {
    const segment: Partial<RoadSegment> = {
      heartbeatIntervalMs: 500,
      voiceReminder: { type: 'approach_hazard' }
    }
    expect(segment.heartbeatIntervalMs).toBe(500)
    expect(segment.voiceReminder?.type).toBe('approach_hazard')
  })

  it('should support custom voice reminder content', () => {
    const segment: Partial<RoadSegment> = {
      voiceReminder: { type: 'custom', content: '前方窄路，注意通行' }
    }
    expect(segment.voiceReminder?.type).toBe('custom')
    expect(segment.voiceReminder?.content).toBe('前方窄路，注意通行')
  })
})
