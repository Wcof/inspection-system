import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInspectionStore } from '@/stores/inspection'
import { InspectionTaskType, InspectionPlanStatus, ScheduleType } from '@/types/inspection'
import { ExceptionStrategy } from '@/types/robot'
import { MockService } from '@/mock/mockService'

describe('Plan - decouple robot', () => {
  beforeEach(() => {
    localStorage.clear()
    MockService.initializeData()
    setActivePinia(createPinia())
  })

  it('should fetch plans with businessScene and riskLevel fields', () => {
    const store = useInspectionStore()
    store.fetchAllInspectionPlans()
    const plans = store.inspectionPlans
    expect(plans.length).toBeGreaterThan(0)
    // Plans should have the metadata fields
    plans.forEach(plan => {
      expect(plan).toHaveProperty('businessScene')
      expect(plan).toHaveProperty('riskLevel')
    })
  })

  it('should allow saving a plan without robotId', () => {
    const store = useInspectionStore()
    const planId = `plan-${Date.now()}`
    const plan = store.saveInspectionPlan({
      id: planId,
      name: '周检计划-无机器人指派',
      code: 'W001',
      type: InspectionTaskType.PATROL,
      mapId: 'map-001',
      status: InspectionPlanStatus.ACTIVE,
      inspectionPointIds: [],
      schedule: {
        type: ScheduleType.WEEKLY,
        daysOfWeek: [1, 3, 5],
        time: '09:00-17:00'
      },
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
      businessScene: 'daily_inspection',
      riskLevel: 'normal',
      ruleIds: ['rule-001'],
      createdAt: new Date(),
      updatedAt: new Date()
    })
    expect(plan.robotId).toBeUndefined()
    expect(plan.businessScene).toBe('daily_inspection')
    expect(plan.riskLevel).toBe('normal')
    expect(plan.ruleIds).toContain('rule-001')
  })

  it('should allow saving a plan with robotId', () => {
    const store = useInspectionStore()
    const planId = `plan-${Date.now()}`
    const plan = store.saveInspectionPlan({
      id: planId,
      name: '紧急到场任务',
      code: 'E001',
      type: InspectionTaskType.PATROL,
      mapId: 'map-001',
      robotId: 'robot-1',
      status: InspectionPlanStatus.ACTIVE,
      inspectionPointIds: [],
      schedule: {
        type: ScheduleType.WEEKLY,
        daysOfWeek: [1, 2, 3, 4, 5],
        time: '09:00-17:00'
      },
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
      businessScene: 'emergency_arrival',
      riskLevel: 'hazard',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    expect(plan.robotId).toBe('robot-1')
    expect(plan.businessScene).toBe('emergency_arrival')
    expect(plan.riskLevel).toBe('hazard')
  })
})
