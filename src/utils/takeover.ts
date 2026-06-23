import { writeAuditLog } from '@/utils/audit'

export interface TakeoverRequest {
  sourceRobotId: string
  targetRobotId: string
  breakpointPosition: { x: number; y: number }
  reason: string
}

export interface TakeoverResult {
  success: boolean
  sourceRobotId: string
  targetRobotId: string
  breakpointPosition: { x: number; y: number }
  continueTaskId: string
  message: string
}

/**
 * 执行机器人故障接管。
 * 一号车故障/低电 → 二号车从断点续巡。
 * 生成续巡任务并写审计日志。
 */
export function executeTakeover(request: TakeoverRequest): TakeoverResult {
  const continueTaskId = `task-${Date.now()}`

  writeAuditLog({
    action: 'takeover',
    operator: 'system',
    targetId: request.sourceRobotId,
    targetType: 'robot',
    beforeValue: { status: 'fault' },
    afterValue: { status: 'taken_over', continueTaskId },
    reason: request.reason
  })

  return {
    success: true,
    sourceRobotId: request.sourceRobotId,
    targetRobotId: request.targetRobotId,
    breakpointPosition: request.breakpointPosition,
    continueTaskId,
    message: `接管完成: ${request.sourceRobotId} → ${request.targetRobotId}，续巡任务 ${continueTaskId}`
  }
}
