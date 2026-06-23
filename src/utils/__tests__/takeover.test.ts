import { describe, it, expect, beforeEach } from 'vitest'
import { executeTakeover } from '@/utils/takeover'

describe('Robot takeover', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should execute takeover and write audit log', () => {
    const result = executeTakeover({
      sourceRobotId: 'robot-1',
      targetRobotId: 'robot-2',
      breakpointPosition: { x: 100, y: 200 },
      reason: '低电量自动接管'
    })
    expect(result.success).toBe(true)
    expect(result.sourceRobotId).toBe('robot-1')
    expect(result.targetRobotId).toBe('robot-2')
    expect(result.continueTaskId).toBeTruthy()
    expect(result.continueTaskId).toMatch(/^task-/)
    
    const auditLogs = JSON.parse(localStorage.getItem('audit-log') || '[]')
    const log = auditLogs.find((l: any) => l.action === 'takeover')
    expect(log).toBeTruthy()
    expect(log.reason).toContain('低电量')
  })
})
