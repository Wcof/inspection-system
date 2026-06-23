import { describe, it, expect, beforeEach } from 'vitest'
import { calibrateRobot } from '@/utils/calibration'

describe('Calibration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should run calibration and write audit log', () => {
    const result = calibrateRobot('robot-1', 'gimbal')
    expect(result.success).toBe(true)
    expect(result.robotId).toBe('robot-1')
    expect(result.component).toBe('gimbal')

    const auditLogs = JSON.parse(localStorage.getItem('audit-log') || '[]')
    const log = auditLogs.find((l: any) => l.action === 'calibrate' && l.targetId === 'robot-1')
    expect(log).toBeTruthy()
  })
})
