export interface AuditLogEntry {
  id: string
  action: 'preempt' | 'terminate' | 'takeover' | 'calibrate'
  operator: string
  targetId: string
  targetType: 'task' | 'robot'
  beforeValue?: unknown
  afterValue?: unknown
  reason?: string
  createdAt: string  // ISO
}
