import { describe, it, expect } from 'vitest'
import { getValueByPath, normalizeResponse, validateCandidates, generateMockThirdPartyTasks } from '../thirdPartyIntegration'
import type { ThirdPartyApiConfig } from '@/types/third-party'

const mockConfig: ThirdPartyApiConfig = {
  id: 'tp-config-test',
  systemName: '测试系统',
  systemCode: 'TEST',
  apiName: '测试接口',
  enabled: true,
  requestMode: 'mock',
  method: 'GET',
  url: 'https://api.test.com/tasks',
  timeoutMs: 10000,
  contentType: 'application/json',
  headers: [],
  queryParams: [],
  auth: { type: 'none' },
  responseMapping: {
    listPath: 'data.records'
  },
  fieldMapping: {
    externalTaskIdPath: 'taskId',
    taskNamePath: 'name',
    pointCodePath: 'pointCode'
  },
  defaults: {
    robotId: 'robot-001',
    businessScene: 'daily_inspection',
    priorityLevel: 'normal',
    riskLevel: 'normal',
    durationMinutes: 60,
    autoStart: false,
    notifyOnComplete: false,
    notifyOnError: false,
    autoResumeAfterInterrupt: false
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

describe('getValueByPath', () => {
  it('should read a simple path', () => {
    const obj = { data: { value: 42 } }
    const { value } = getValueByPath(obj, 'data.value')
    expect(value).toBe(42)
  })

  it('should read a top-level path', () => {
    const obj = { name: 'test' }
    const { value } = getValueByPath(obj, 'name')
    expect(value).toBe('test')
  })

  it('should return error for non-existent path', () => {
    const obj = { data: {} }
    const { error } = getValueByPath(obj, 'data.missing')
    expect(error).toBeTruthy()
  })

  it('should return error for empty path', () => {
    const { error } = getValueByPath({}, '')
    expect(error).toBe('路径为空')
  })
})

describe('normalizeResponse', () => {
  it('should map fields correctly', () => {
    const rawData = [
      { taskId: 'EXT-001', name: '巡检任务1', pointCode: 'POINT-001' },
      { taskId: 'EXT-002', name: '巡检任务2', pointCode: 'POINT-002' }
    ]
    const candidates = normalizeResponse(mockConfig, rawData)
    expect(candidates).toHaveLength(2)
    expect(candidates[0].externalTaskId).toBe('EXT-001')
    expect(candidates[0].taskName).toBe('巡检任务1')
    expect(candidates[0].pointCode).toBe('POINT-001')
    expect(candidates[0].validationStatus).toBe('valid')
  })

  it('should mark invalid when externalTaskId is empty', () => {
    const rawData = [{ taskId: '', name: '任务', pointCode: 'POINT-001' }]
    const candidates = normalizeResponse(mockConfig, rawData)
    expect(candidates[0].validationStatus).toBe('invalid')
    expect(candidates[0].validationErrors).toContain('第三方任务编号为空')
  })

  it('should mark invalid when taskName is empty', () => {
    const rawData = [{ taskId: 'EXT-001', name: '', pointCode: 'POINT-001' }]
    const candidates = normalizeResponse(mockConfig, rawData)
    expect(candidates[0].validationStatus).toBe('invalid')
    expect(candidates[0].validationErrors).toContain('任务名称为空')
  })

  it('should mark invalid when pointCode is empty', () => {
    const rawData = [{ taskId: 'EXT-001', name: '任务', pointCode: '' }]
    const candidates = normalizeResponse(mockConfig, rawData)
    expect(candidates[0].validationStatus).toBe('invalid')
    expect(candidates[0].validationErrors).toContain('巡检点编码为空')
  })

  it('should use default values when mapping fails', () => {
    const rawData = [{ taskId: 'EXT-001', name: '任务', pointCode: 'POINT-001', priority: 'unknown', risk: 'unknown' }]
    const configWithMapping = {
      ...mockConfig,
      fieldMapping: {
        ...mockConfig.fieldMapping,
        priorityPath: 'priority',
        riskLevelPath: 'risk'
      }
    }
    const candidates = normalizeResponse(configWithMapping, rawData)
    expect(candidates[0].priorityLevel).toBe('normal')
    expect(candidates[0].riskLevel).toBe('normal')
  })
})

describe('validateCandidates', () => {
  it('should match inspection point by code', () => {
    const candidates = [{
      candidateId: 'c1',
      sourceSystemId: 'test',
      sourceSystemCode: 'TEST',
      sourceSystemName: '测试',
      externalTaskId: 'EXT-001',
      taskName: '任务',
      pointCode: 'POINT-001',
      priorityLevel: 'normal' as const,
      riskLevel: 'normal' as const,
      businessScene: 'daily_inspection' as const,
      robotId: 'robot-001',
      validationStatus: 'valid' as const,
      validationErrors: [],
      rawIndex: 0
    }]
    const inspectionPoints = [{ id: 'point-001', code: 'POINT-001', name: '巡检点1' } as any]
    const validated = validateCandidates(candidates, inspectionPoints, [], 'test')
    expect(validated[0].inspectionPointId).toBe('point-001')
    expect(validated[0].validationStatus).toBe('valid')
  })

  it('should mark duplicate when same sourceSystemId + externalTaskId exists', () => {
    const candidates = [{
      candidateId: 'c1',
      sourceSystemId: 'test',
      sourceSystemCode: 'TEST',
      sourceSystemName: '测试',
      externalTaskId: 'EXT-001',
      taskName: '任务',
      pointCode: 'POINT-001',
      priorityLevel: 'normal' as const,
      riskLevel: 'normal' as const,
      businessScene: 'daily_inspection' as const,
      robotId: 'robot-001',
      validationStatus: 'valid' as const,
      validationErrors: [],
      rawIndex: 0
    }]
    const existingTasks = [{ sourceSystemId: 'test', thirdPartyTaskNo: 'EXT-001', id: 'task-001' }]
    const validated = validateCandidates(candidates, [], existingTasks, 'test')
    expect(validated[0].validationStatus).toBe('duplicate')
    expect(validated[0].duplicateTaskId).toBe('task-001')
  })

  it('should mark invalid when inspection point not found', () => {
    const candidates = [{
      candidateId: 'c1',
      sourceSystemId: 'test',
      sourceSystemCode: 'TEST',
      sourceSystemName: '测试',
      externalTaskId: 'EXT-001',
      taskName: '任务',
      pointCode: 'UNKNOWN-POINT',
      priorityLevel: 'normal' as const,
      riskLevel: 'normal' as const,
      businessScene: 'daily_inspection' as const,
      robotId: 'robot-001',
      validationStatus: 'valid' as const,
      validationErrors: [],
      rawIndex: 0
    }]
    const validated = validateCandidates(candidates, [], [], 'test')
    expect(validated[0].validationStatus).toBe('invalid')
    expect(validated[0].validationErrors).toContain('未匹配巡检点')
  })
})

describe('generateMockThirdPartyTasks', () => {
  it('should generate mock data', () => {
    const data = generateMockThirdPartyTasks(mockConfig)
    expect(data.length).toBeGreaterThan(0)
    expect(data[0].taskId).toBeTruthy()
    expect(data[0].name).toBeTruthy()
    expect(data[0].pointCode).toBeTruthy()
  })
})