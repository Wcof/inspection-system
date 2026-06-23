import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInspectionStore } from '@/stores/inspection'
import { MockService } from '@/mock/mockService'

describe('Task unification', () => {
  beforeEach(() => {
    localStorage.clear()
    MockService.initializeData()
    setActivePinia(createPinia())
  })

  it('should create task with execution_plan taskSource by default', () => {
    const store = useInspectionStore()
    store.fetchAllTasks()
    const tasks = store.tasks
    expect(tasks.length).toBeGreaterThan(0)
    // All existing tasks from initial data should have taskSource
    tasks.forEach(task => {
      expect(task.taskSource).toBeTruthy()
    })
  })

  it('should create a new task with manual taskSource', () => {
    const store = useInspectionStore()
    const task = store.saveTask({
      name: 'Manual task',
      code: 'M001',
      robotId: 'robot-1',
      routeId: 'route-001',
      type: 'normal',
      inspectionPointIds: [],
      schedule: undefined,
      config: { autoStart: false, notifyOnComplete: false, notifyOnError: false, autoResumeAfterInterrupt: false },
      exceptionStrategy: { lowBattery: 'return_to_base', signalLost: 'wait_and_resume', robotFailure: 'abort', signalLostRetryCount: 3, retryInterval: 30, retryTimes: 3 }
    })
    expect(task.taskSource).toBe('manual')
  })

  it('should create task with specific taskSource', () => {
    const store = useInspectionStore()
    const task = store.saveTask({
      name: 'Work ticket task',
      code: 'W001',
      robotId: 'robot-1',
      routeId: 'route-001',
      type: 'normal',
      inspectionPointIds: [],
      taskSource: 'work_ticket',
      schedule: undefined,
      config: { autoStart: false, notifyOnComplete: false, notifyOnError: false, autoResumeAfterInterrupt: false },
      exceptionStrategy: { lowBattery: 'return_to_base', signalLost: 'wait_and_resume', robotFailure: 'abort', signalLostRetryCount: 3, retryInterval: 30, retryTimes: 3 }
    })
    expect(task.taskSource).toBe('work_ticket')
  })

  it('should have planId as optional', () => {
    const store = useInspectionStore()
    const task = store.saveTask({
      name: 'No plan task',
      code: 'N001',
      robotId: 'robot-1',
      routeId: 'route-001',
      type: 'normal',
      inspectionPointIds: [],
      schedule: undefined,
      config: { autoStart: false, notifyOnComplete: false, notifyOnError: false, autoResumeAfterInterrupt: false },
      exceptionStrategy: { lowBattery: 'return_to_base', signalLost: 'wait_and_resume', robotFailure: 'abort', signalLostRetryCount: 3, retryInterval: 30, retryTimes: 3 }
    })
    expect(task.planId).toBeUndefined()
  })
})
