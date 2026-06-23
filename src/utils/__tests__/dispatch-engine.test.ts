import { describe, it, expect, beforeEach } from 'vitest'
import { MockService } from '@/mock/mockService'
import { assignRobot, preemptTask } from '@/utils/dispatch-engine'
import { InspectionTaskInstanceStatus } from '@/types/inspection'

describe('DispatchEngine - assignRobot', () => {
  beforeEach(() => {
    localStorage.clear()
    MockService.initializeData()
  })

  it('should return a robot id for a task with no robot assigned', () => {
    const robotId = assignRobot({ areaId: 'area-1', preferredRobotIds: ['robot-1'] })
    expect(robotId).toBeTruthy()
    expect(typeof robotId).toBe('string')
  })

  it('should prefer robots from the resource pool', () => {
    const robots = MockService.getRobots()
    const secondRobotId = robots.length > 1 ? robots[1].id : robots[0].id
    
    // Set up a resource pool preferring the second robot
    MockService.saveDispatchResourcePool({
      id: 'pool-1',
      areaId: 'area-1',
      preferredRobotIds: [secondRobotId],
      disabledTimeWindows: [],
      robotTypeWhitelist: []
    })
    const robotId = assignRobot({ areaId: 'area-1' })
    expect(robotId).toBe(secondRobotId)
  })
})

describe('DispatchEngine - preemptTask', () => {
  beforeEach(() => {
    localStorage.clear()
    MockService.initializeData()
    // Ensure there's a running task
    const tasks = MockService.getTasks()
    if (tasks.length > 0) {
      MockService.saveTask({ ...tasks[0], status: InspectionTaskInstanceStatus.RUNNING })
    }
  })

  it('should auto-preempt for emergency scene without confirmation', () => {
    const tasks = MockService.getTasks()
    const runningTask = tasks.find(t => t.status === InspectionTaskInstanceStatus.RUNNING) || tasks[0]
    
    const result = preemptTask(runningTask.id, 'emergency_arrival', 'auto')
    expect(result).not.toBeNull()
    
    // Task should be paused
    const paused = MockService.getTaskById(runningTask.id)
    expect(paused!.status).toBe(InspectionTaskInstanceStatus.PAUSED)
    
    // Audit log should be written
    const auditLogs = JSON.parse(localStorage.getItem('audit-log') || '[]')
    const matchingLog = auditLogs.find((l: any) => l.targetId === runningTask.id && l.action === 'preempt')
    expect(matchingLog).toBeTruthy()
    expect(matchingLog.reason).toContain('emergency_arrival')
  })

  it('should return null for non-existent task', () => {
    const result = preemptTask('non-existent-id', 'work_ticket_guard', 'auto')
    expect(result).toBeNull()
  })
})
