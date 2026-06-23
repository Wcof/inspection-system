import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInspectionStore } from '@/stores/inspection'
import { MockService } from '@/mock/mockService'
import { InspectionTaskInstanceStatus, InspectionTaskType } from '@/types/inspection'
import { ExceptionStrategy } from '@/types/robot'

describe('TaskStateMachine - 8 states', () => {
  beforeEach(() => {
    localStorage.clear()
    MockService.initializeData()
    setActivePinia(createPinia())
  })

  it('should have PROCESSING and TERMINATED states', () => {
    expect(InspectionTaskInstanceStatus.PROCESSING).toBe('processing')
    expect(InspectionTaskInstanceStatus.TERMINATED).toBe('terminated')
  })

  it('should have all 8 states defined', () => {
    const states = Object.values(InspectionTaskInstanceStatus)
    expect(states).toContain('pending')
    expect(states).toContain('running')
    expect(states).toContain('completed')
    expect(states).toContain('paused')
    expect(states).toContain('processing')
    expect(states).toContain('cancelled')
    expect(states).toContain('terminated')
    expect(states).toContain('failed')
    expect(states).toHaveLength(8)
  })
})

describe('terminateTask', () => {
  beforeEach(() => {
    localStorage.clear()
    MockService.initializeData()
    setActivePinia(createPinia())
  })

  it('should set task status to TERMINATED and write audit log', () => {
    const store = useInspectionStore()
    store.fetchAllTasks()
    const tasks = store.tasks
    const runningTask = { ...tasks[0], status: InspectionTaskInstanceStatus.RUNNING }
    MockService.saveTask(runningTask)

    const result = store.terminateTask(runningTask.id)

    expect(result).not.toBeNull()
    expect(result!.status).toBe(InspectionTaskInstanceStatus.TERMINATED)

    // Verify persisted
    const persisted = MockService.getTaskById(runningTask.id)
    expect(persisted!.status).toBe(InspectionTaskInstanceStatus.TERMINATED)

    // Verify audit log was written
    const auditLogs = JSON.parse(localStorage.getItem('audit-log') || '[]')
    const matchingLog = auditLogs.find((l: any) => l.targetId === runningTask.id && l.action === 'terminate')
    expect(matchingLog).toBeTruthy()
  })

  it('should return null for non-existent task', () => {
    const store = useInspectionStore()
    const result = store.terminateTask('non-existent-id')
    expect(result).toBeNull()
  })
})

describe('deleteTask', () => {
  beforeEach(() => {
    localStorage.clear()
    MockService.initializeData()
    setActivePinia(createPinia())
  })

  it('should be deprecated and not physically delete tasks', () => {
    const store = useInspectionStore()
    store.fetchAllTasks()
    const tasksBefore = store.tasks
    const firstTaskId = tasksBefore[0].id

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    store.deleteTask(firstTaskId)

    // Task should still exist (delete is deprecated)
    store.fetchAllTasks()
    const tasksAfter = store.tasks
    expect(tasksAfter.find(t => t.id === firstTaskId)).toBeTruthy()

    warnSpy.mockRestore()
  })
})

describe('State machine transitions', () => {
  function createTestTask() {
    const taskId = `task-test-${Date.now()}`
    const task = {
      id: taskId,
      name: 'test',
      code: 'T001',
      robotId: 'robot-1',
      routeId: 'route-001',
      type: InspectionTaskType.PATROL,
      status: InspectionTaskInstanceStatus.PENDING,
      inspectionPointIds: [],
      currentInspectionPointIndex: 0,
      config: { autoStart: false, notifyOnComplete: false, notifyOnError: false, autoResumeAfterInterrupt: false },
      exceptionStrategy: {
        inspectionPointFailure: ExceptionStrategy.SKIP,
        robotFailure: ExceptionStrategy.ABORT,
        lowBattery: ExceptionStrategy.RETURN_TO_BASE,
        signalLost: ExceptionStrategy.WAIT_AND_RESUME,
        timeout: ExceptionStrategy.RETRY,
        maxRetryCount: 3,
        retryInterval: 30
      },
      exceptionLog: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    MockService.saveTask(task)
    return task
  }

  beforeEach(() => {
    localStorage.clear()
    MockService.initializeData()
    setActivePinia(createPinia())
  })

  it('pending → running → completed', () => {
    const task = createTestTask()
    expect(task.status).toBe(InspectionTaskInstanceStatus.PENDING)

    task.status = InspectionTaskInstanceStatus.RUNNING
    MockService.saveTask(task)
    expect(MockService.getTaskById(task.id)!.status).toBe(InspectionTaskInstanceStatus.RUNNING)

    task.status = InspectionTaskInstanceStatus.COMPLETED
    MockService.saveTask(task)
    expect(MockService.getTaskById(task.id)!.status).toBe(InspectionTaskInstanceStatus.COMPLETED)
  })

  it('running → paused → running', () => {
    const task = createTestTask()
    task.status = InspectionTaskInstanceStatus.RUNNING
    MockService.saveTask(task)

    task.status = InspectionTaskInstanceStatus.PAUSED
    MockService.saveTask(task)
    expect(MockService.getTaskById(task.id)!.status).toBe(InspectionTaskInstanceStatus.PAUSED)

    task.status = InspectionTaskInstanceStatus.RUNNING
    MockService.saveTask(task)
    expect(MockService.getTaskById(task.id)!.status).toBe(InspectionTaskInstanceStatus.RUNNING)
  })

  it('running → processing → running', () => {
    const task = createTestTask()
    task.status = InspectionTaskInstanceStatus.RUNNING
    MockService.saveTask(task)

    task.status = InspectionTaskInstanceStatus.PROCESSING
    MockService.saveTask(task)
    expect(MockService.getTaskById(task.id)!.status).toBe(InspectionTaskInstanceStatus.PROCESSING)

    task.status = InspectionTaskInstanceStatus.RUNNING
    MockService.saveTask(task)
    expect(MockService.getTaskById(task.id)!.status).toBe(InspectionTaskInstanceStatus.RUNNING)
  })

  it('running → terminated', () => {
    const task = createTestTask()
    task.status = InspectionTaskInstanceStatus.RUNNING
    MockService.saveTask(task)

    task.status = InspectionTaskInstanceStatus.TERMINATED
    MockService.saveTask(task)
    expect(MockService.getTaskById(task.id)!.status).toBe(InspectionTaskInstanceStatus.TERMINATED)
  })

  it('running → failed', () => {
    const task = createTestTask()
    task.status = InspectionTaskInstanceStatus.RUNNING
    MockService.saveTask(task)

    task.status = InspectionTaskInstanceStatus.FAILED
    MockService.saveTask(task)
    expect(MockService.getTaskById(task.id)!.status).toBe(InspectionTaskInstanceStatus.FAILED)
  })
})
