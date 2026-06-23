import { describe, it, expect, beforeEach } from 'vitest'
import { writeAuditLog, getAuditLogs } from '@/utils/audit'

describe('AuditLog', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should write and read back an audit log entry', () => {
    writeAuditLog({
      action: 'terminate',
      operator: '调度员张三',
      targetId: 'task-001',
      targetType: 'task',
      beforeValue: { status: 'running' },
      afterValue: { status: 'terminated' },
      reason: '紧急停止'
    })

    const logs = getAuditLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].action).toBe('terminate')
    expect(logs[0].operator).toBe('调度员张三')
    expect(logs[0].targetId).toBe('task-001')
    expect(logs[0].targetType).toBe('task')
    expect(logs[0].reason).toBe('紧急停止')
    expect(logs[0].id).toBeTruthy()
    expect(logs[0].createdAt).toBeTruthy()
  })

  it('should auto-generate id and createdAt', () => {
    writeAuditLog({
      action: 'preempt',
      operator: '系统',
      targetId: 'task-002',
      targetType: 'task'
    })

    const logs = getAuditLogs()
    expect(logs[0].id).toMatch(/^audit-\d+-[a-z0-9]+$/)
    expect(() => new Date(logs[0].createdAt)).not.toThrow()
  })

  it('should append multiple entries in order', () => {
    writeAuditLog({ action: 'terminate', operator: 'A', targetId: 't1', targetType: 'task' })
    writeAuditLog({ action: 'preempt', operator: 'B', targetId: 't2', targetType: 'task' })
    writeAuditLog({ action: 'takeover', operator: 'C', targetId: 'r1', targetType: 'robot' })

    const logs = getAuditLogs()
    expect(logs).toHaveLength(3)
    expect(logs[0].action).toBe('terminate')
    expect(logs[1].action).toBe('preempt')
    expect(logs[2].action).toBe('takeover')
  })

  it('should handle different targetType values', () => {
    writeAuditLog({ action: 'calibrate', operator: '运维', targetId: 'robot-01', targetType: 'robot' })
    writeAuditLog({ action: 'terminate', operator: '调度', targetId: 'task-003', targetType: 'task' })

    const logs = getAuditLogs()
    expect(logs[0].targetType).toBe('robot')
    expect(logs[1].targetType).toBe('task')
  })
})
