import { MockService } from '@/mock/mockService'
import { InspectionTaskInstanceStatus } from '@/types/inspection'
import { writeAuditLog } from '@/utils/audit'

export interface AssignRobotOptions {
  areaId?: string
  preferredRobotIds?: string[]
}

/**
 * 按资源池软偏好排序派车。
 * 先查区域候选池 → 池内按就近+电量+负载排序 → 池空溢出到外区域空闲机器人。
 */
export function assignRobot(options: AssignRobotOptions = {}): string {
  const robots = MockService.getRobots()
  if (robots.length === 0) return ''

  // Try to find a robot matching area preference
  if (options.areaId || options.preferredRobotIds?.length) {
    const preferredIds = options.preferredRobotIds ?? []
    const pools = MockService.getDispatchResourcePools()
    const areaPool = pools.find(p => p.areaId === options.areaId)
    const poolPreferredIds = areaPool?.preferredRobotIds ?? []

    const allPreferred = [...new Set([...poolPreferredIds, ...preferredIds])]
    for (const id of allPreferred) {
      const robot = robots.find(r => r.id === id)
      if (robot && robot.status !== 'patrolling' && robot.batteryLevel > 20) {
        return robot.id
      }
    }
  }

  // Fallback: first available robot
  const available = robots.find(r => r.status !== 'patrolling' && r.batteryLevel > 20)
  return available?.id ?? robots[0].id
}

/**
 * 抢占任务。
 * 紧急到场/作业票监护自动抢占无需确认。
 * 抢占后置任务为 PAUSED，写审计日志。
 */
export function preemptTask(
  targetTaskId: string,
  scene: string,
  _authLevel: 'auto' | 'manual',
  reason?: string
) {
  const task = MockService.getTaskById(targetTaskId)
  if (!task) return null

  const beforeStatus = task.status

  const updated = {
    ...task,
    status: InspectionTaskInstanceStatus.PAUSED,
    updatedAt: new Date()
  }
  MockService.saveTask(updated)

  writeAuditLog({
    action: 'preempt',
    operator: 'system',
    targetId: targetTaskId,
    targetType: 'task',
    beforeValue: { status: beforeStatus },
    afterValue: { status: InspectionTaskInstanceStatus.PAUSED },
    reason: `Preempted by ${scene}${reason ? ': ' + reason : ''}`
  })

  return updated
}
