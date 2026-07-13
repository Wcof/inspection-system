// ===== 第三方 API 配置类型 =====

export interface KeyValueItem {
  key: string
  value: string
}

export type ThirdPartyAuthType = 'none' | 'bearer' | 'api_key' | 'basic'

export interface ThirdPartyAuthConfig {
  type: ThirdPartyAuthType
  /** Bearer Token 值 */
  bearerToken?: string
  /** API Key 配置 */
  apiKey?: {
    keyName: string
    keyValue: string
    /** 'header' | 'query' */
    placement: 'header' | 'query'
  }
  /** Basic Auth 配置 */
  basic?: {
    username: string
    password: string
  }
}

export type RequestMode = 'mock' | 'direct' | 'proxy'
export type HttpMethod = 'GET' | 'POST'

export interface ThirdPartyResponseMapping {
  /** 成功状态路径，如 data.success */
  successPath?: string
  /** 成功状态值，如 true 或 'ok' */
  successValue?: string
  /** 错误消息路径，如 data.message */
  messagePath?: string
  /** 任务数组路径，如 data.records */
  listPath: string
}

export interface ThirdPartyTaskFieldMapping {
  /** 第三方任务编号路径（必填） */
  externalTaskIdPath: string
  /** 任务名称路径（必填） */
  taskNamePath: string
  /** 巡检点编码路径（必填） */
  pointCodePath: string
  /** 描述路径（可选） */
  descriptionPath?: string
  /** 执行时间路径（可选） */
  plannedExecuteAtPath?: string
  /** 优先级路径（可选） */
  priorityPath?: string
  /** 风险等级路径（可选） */
  riskLevelPath?: string
  /** 任务场景路径（可选） */
  businessScenePath?: string
  /** 机器人编码路径（可选） */
  robotCodePath?: string
}

export interface ThirdPartyTaskDefaults {
  robotId: string
  businessScene: 'daily_inspection' | 'hazard_screening' | 'environment_check' | 'operation_guard' | 'work_ticket_guard' | 'emergency_arrival'
  priorityLevel: 'normal' | 'high' | 'emergency'
  riskLevel: 'normal' | 'warning' | 'alarm' | 'critical_alarm' | 'hazard' | 'major_hazard'
  durationMinutes: number
  autoStart: boolean
  notifyOnComplete: boolean
  notifyOnError: boolean
  autoResumeAfterInterrupt: boolean
}

export interface ThirdPartyApiConfig {
  id: string
  systemName: string
  systemCode: string
  apiName: string
  enabled: boolean
  requestMode: RequestMode
  method: HttpMethod
  url: string
  timeoutMs: number
  contentType: string
  headers: KeyValueItem[]
  queryParams: KeyValueItem[]
  bodyTemplate?: string
  auth: ThirdPartyAuthConfig
  responseMapping: ThirdPartyResponseMapping
  fieldMapping: ThirdPartyTaskFieldMapping
  defaults: ThirdPartyTaskDefaults
  remark?: string
  lastTestAt?: string
  lastTestStatus?: 'success' | 'fail'
  lastTestMessage?: string
  createdAt: string
  updatedAt: string
}

// ===== 候选任务类型 =====

export type CandidateValidationStatus = 'valid' | 'invalid' | 'duplicate'

export interface ThirdPartyTaskCandidate {
  candidateId: string
  sourceSystemId: string
  sourceSystemCode: string
  sourceSystemName: string
  externalTaskId: string
  taskName: string
  description?: string
  pointCode: string
  inspectionPointId?: string
  inspectionPointName?: string
  plannedExecuteAt?: string
  priorityLevel: 'normal' | 'high' | 'emergency'
  riskLevel: 'normal' | 'warning' | 'alarm' | 'critical_alarm' | 'hazard' | 'major_hazard'
  businessScene: 'daily_inspection' | 'hazard_screening' | 'environment_check' | 'operation_guard' | 'work_ticket_guard' | 'emergency_arrival'
  robotId: string
  validationStatus: CandidateValidationStatus
  validationErrors: string[]
  duplicateTaskId?: string
  rawIndex: number
}

// ===== 同步批次 =====

export type SyncBatchStatus = 'running' | 'completed' | 'partial' | 'failed'

export interface ThirdPartySyncBatch {
  id: string
  configId: string
  sourceSystemId: string
  startedAt: string
  finishedAt?: string
  receivedCount: number
  validCount: number
  duplicateCount: number
  invalidCount: number
  createdCount: number
  status: SyncBatchStatus
  errorMessage?: string
}