import type { ThirdPartyApiConfig, ThirdPartyTaskCandidate } from '@/types/third-party'
import type { InspectionPoint } from '@/types/inspection'
import { MockService } from '@/mock/mockService'

// ===== 安全的点号路径取值 =====
export function getValueByPath(obj: any, path: string): { value: any; error?: string } {
  if (!path) return { value: undefined, error: '路径为空' }
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current === null || current === undefined) {
      return { value: undefined, error: `路径 ${path} 不存在，在 ${part} 处中断` }
    }
    // 检查属性是否存在
    if (!(part in current) && !(Array.isArray(current) && !isNaN(Number(part)))) {
      return { value: undefined, error: `路径 ${path} 不存在，在 ${part} 处中断` }
    }
    current = current[part]
  }
  return { value: current }
}

// ===== 构建请求头 =====
function buildHeaders(config: ThirdPartyApiConfig): Record<string, string> {
  const headers: Record<string, string> = {}
  // Content-Type
  if (config.contentType) {
    headers['Content-Type'] = config.contentType
  }
  // 自定义 Headers
  for (const item of config.headers || []) {
    if (item.key) headers[item.key] = item.value
  }
  // 认证
  if (config.auth) {
    if (config.auth.type === 'bearer' && config.auth.bearerToken) {
      headers['Authorization'] = `Bearer ${config.auth.bearerToken}`
    } else if (config.auth.type === 'api_key' && config.auth.apiKey && config.auth.apiKey.placement === 'header') {
      headers[config.auth.apiKey.keyName] = config.auth.apiKey.keyValue
    } else if (config.auth.type === 'basic' && config.auth.basic) {
      const encoded = btoa(`${config.auth.basic.username}:${config.auth.basic.password}`)
      headers['Authorization'] = `Basic ${encoded}`
    }
  }
  return headers
}

// ===== 构建查询参数 =====
function buildQueryParams(config: ThirdPartyApiConfig): string {
  const params = new URLSearchParams()
  for (const item of config.queryParams || []) {
    if (item.key) params.append(item.key, item.value)
  }
  // API Key 作为 Query 参数
  if (config.auth?.type === 'api_key' && config.auth.apiKey?.placement === 'query') {
    params.append(config.auth.apiKey.keyName, config.auth.apiKey.keyValue)
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

// ===== 替换占位符 =====
function replacePlaceholders(template: string): string {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const lastSyncBatches = MockService.getThirdPartySyncBatches()
  const lastSync = lastSyncBatches.length > 0 ? lastSyncBatches[lastSyncBatches.length - 1].startedAt : ''
  return template
    .replace(/\{\{now\}\}/g, now.toISOString())
    .replace(/\{\{today\}\}/g, today)
    .replace(/\{\{lastSyncAt\}\}/g, lastSync)
}

// ===== 发送请求 =====
async function sendRequest(config: ThirdPartyApiConfig, signal?: AbortSignal): Promise<{ status: number; body: any; elapsed: number }> {
  const url = `${config.url}${config.method === 'GET' ? buildQueryParams(config) : ''}`
  const headers = buildHeaders(config)
  const fetchOptions: RequestInit = {
    method: config.method,
    headers,
    signal
  }
  if (config.method === 'POST' && config.bodyTemplate) {
    const body = replacePlaceholders(config.bodyTemplate)
    fetchOptions.body = body
  }
  const start = performance.now()
  const response = await fetch(url, fetchOptions)
  const elapsed = Math.round(performance.now() - start)
  const contentType = response.headers.get('content-type') || ''
  let body: any
  if (contentType.includes('application/json')) {
    body = await response.json()
  } else {
    const text = await response.text()
    body = text
  }
  return { status: response.status, body, elapsed }
}

// ===== 测试连接 =====
export async function testConnection(config: ThirdPartyApiConfig): Promise<{
  success: boolean
  status: number
  elapsed: number
  message: string
  preview?: string
  parsedCount?: number
  mappingPreview?: any[]
}> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs || 10000)
    const result = await sendRequest(config, controller.signal)
    clearTimeout(timeoutId)

    // 检查成功条件
    if (config.responseMapping.successPath) {
      const { value } = getValueByPath(result.body, config.responseMapping.successPath)
      const expected = config.responseMapping.successValue
      if (expected !== undefined && String(value) !== String(expected)) {
        return {
          success: false,
          status: result.status,
          elapsed: result.elapsed,
          message: `业务成功条件不匹配：期望 ${config.responseMapping.successPath}=${expected}，实际=${value}`
        }
      }
    }

    // 检查错误消息
    if (config.responseMapping.messagePath) {
      const { value } = getValueByPath(result.body, config.responseMapping.messagePath)
      if (value && result.status >= 400) {
        return {
          success: false,
          status: result.status,
          elapsed: result.elapsed,
          message: `接口返回错误: ${value}`
        }
      }
    }

    // 解析列表
    const { value: list, error: listError } = getValueByPath(result.body, config.responseMapping.listPath)
    if (listError) {
      return {
        success: false,
        status: result.status,
        elapsed: result.elapsed,
        message: `列表路径错误: ${listError}`
      }
    }
    if (!Array.isArray(list)) {
      return {
        success: false,
        status: result.status,
        elapsed: result.elapsed,
        message: `列表路径 ${config.responseMapping.listPath} 的值不是数组，实际类型: ${typeof list}`
      }
    }

    // 映射预览
    const preview = JSON.stringify(result.body).slice(0, 500)
    const mappingPreview = list.slice(0, 3).map((item: any, i: number) => {
      const id = getValueByPath(item, config.fieldMapping.externalTaskIdPath).value
      const name = getValueByPath(item, config.fieldMapping.taskNamePath).value
      const code = getValueByPath(item, config.fieldMapping.pointCodePath).value
      return { index: i, externalTaskId: id, taskName: name, pointCode: code }
    })

    return {
      success: true,
      status: result.status,
      elapsed: result.elapsed,
      message: `连接成功，获取 ${list.length} 条记录`,
      preview,
      parsedCount: list.length,
      mappingPreview
    }
  } catch (e: any) {
    if (e.name === 'AbortError') {
      return { success: false, status: 0, elapsed: config.timeoutMs || 10000, message: '请求超时' }
    }
    return { success: false, status: 0, elapsed: 0, message: `请求失败: ${e.message}` }
  }
}

// ===== 预览任务（获取原始数据） =====
export async function previewTasks(config: ThirdPartyApiConfig): Promise<{
  success: boolean
  data?: any[]
  message: string
}> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs || 10000)
    const result = await sendRequest(config, controller.signal)
    clearTimeout(timeoutId)

    const { value: list, error } = getValueByPath(result.body, config.responseMapping.listPath)
    if (error) {
      return { success: false, message: `列表路径错误: ${error}` }
    }
    if (!Array.isArray(list)) {
      return { success: false, message: `列表路径 ${config.responseMapping.listPath} 的值不是数组` }
    }
    return { success: true, data: list, message: `获取 ${list.length} 条记录` }
  } catch (e: any) {
    if (e.name === 'AbortError') {
      return { success: false, message: '请求超时' }
    }
    return { success: false, message: `请求失败: ${e.message}` }
  }
}

// ===== 标准化响应为候选任务 =====
export function normalizeResponse(
  config: ThirdPartyApiConfig,
  rawData: any[]
): ThirdPartyTaskCandidate[] {
  return rawData.map((item: any, index: number) => {
    const externalTaskId = String(getValueByPath(item, config.fieldMapping.externalTaskIdPath).value || '')
    const taskName = String(getValueByPath(item, config.fieldMapping.taskNamePath).value || '')
    const pointCode = String(getValueByPath(item, config.fieldMapping.pointCodePath).value || '')
    const description = String(getValueByPath(item, config.fieldMapping.descriptionPath || '').value || '')
    const plannedExecuteAt = String(getValueByPath(item, config.fieldMapping.plannedExecuteAtPath || '').value || '')
    const rawPriority = String(getValueByPath(item, config.fieldMapping.priorityPath || '').value || '')
    const rawRisk = String(getValueByPath(item, config.fieldMapping.riskLevelPath || '').value || '')
    const rawScene = String(getValueByPath(item, config.fieldMapping.businessScenePath || '').value || '')

    const errors: string[] = []
    if (!externalTaskId) errors.push('第三方任务编号为空')
    if (!taskName) errors.push('任务名称为空')
    if (!pointCode) errors.push('巡检点编码为空')

    const priority = mapPriority(rawPriority) || config.defaults.priorityLevel
    const risk = mapRiskLevel(rawRisk) || config.defaults.riskLevel
    const scene = mapBusinessScene(rawScene) || config.defaults.businessScene
    const robotId = config.defaults.robotId

    return {
      candidateId: `candidate-${Date.now()}-${index}`,
      sourceSystemId: config.id,
      sourceSystemCode: config.systemCode,
      sourceSystemName: config.systemName,
      externalTaskId,
      taskName,
      description,
      pointCode,
      plannedExecuteAt: plannedExecuteAt || undefined,
      priorityLevel: priority,
      riskLevel: risk,
      businessScene: scene,
      robotId,
      validationStatus: errors.length > 0 ? 'invalid' : 'valid',
      validationErrors: errors,
      rawIndex: index
    }
  })
}

// ===== 校验候选任务 =====
export function validateCandidates(
  candidates: ThirdPartyTaskCandidate[],
  inspectionPoints: InspectionPoint[],
  existingTasks: any[],
  sourceSystemId: string
): ThirdPartyTaskCandidate[] {
  return candidates.map(candidate => {
    const errors: string[] = [...candidate.validationErrors]

    // 巡检点匹配
    if (candidate.pointCode) {
      const matched = inspectionPoints.filter(
        p => p.code?.trim().toLowerCase() === candidate.pointCode.trim().toLowerCase()
      )
      if (matched.length === 0) {
        errors.push('未匹配巡检点')
      } else if (matched.length > 1) {
        errors.push('巡检点编码重复')
        candidate.inspectionPointId = matched[0].id
        candidate.inspectionPointName = matched[0].name
      } else {
        candidate.inspectionPointId = matched[0].id
        candidate.inspectionPointName = matched[0].name
      }
    }

    // 重复校验
    const duplicate = existingTasks.find(
      t => t.sourceSystemId === sourceSystemId && t.thirdPartyTaskNo === candidate.externalTaskId
    )
    if (duplicate) {
      candidate.duplicateTaskId = duplicate.id
      candidate.validationStatus = 'duplicate'
      return candidate
    }

    if (errors.length > 0) {
      candidate.validationStatus = 'invalid'
      candidate.validationErrors = errors
    } else {
      candidate.validationStatus = 'valid'
    }

    return candidate
  })
}

// ===== 映射辅助函数 =====
function mapPriority(value: string): 'normal' | 'high' | 'emergency' | undefined {
  const lower = value.trim().toLowerCase()
  if (['normal', '普通', 'normal'].includes(lower)) return 'normal'
  if (['high', '高', 'high'].includes(lower)) return 'high'
  if (['emergency', '应急', '紧急', 'emergency'].includes(lower)) return 'emergency'
  return undefined
}

function mapRiskLevel(value: string): 'normal' | 'warning' | 'alarm' | 'critical_alarm' | 'hazard' | 'major_hazard' | undefined {
  const lower = value.trim().toLowerCase()
  if (['normal', '普通', '正常'].includes(lower)) return 'normal'
  if (['warning', '警告'].includes(lower)) return 'warning'
  if (['alarm', '告警'].includes(lower)) return 'alarm'
  if (['critical_alarm', '严重告警'].includes(lower)) return 'critical_alarm'
  if (['hazard', '危险'].includes(lower)) return 'hazard'
  if (['major_hazard', '重大危险'].includes(lower)) return 'major_hazard'
  return undefined
}

function mapBusinessScene(value: string): 'daily_inspection' | 'hazard_screening' | 'environment_check' | 'operation_guard' | 'work_ticket_guard' | 'emergency_arrival' | undefined {
  const lower = value.trim().toLowerCase()
  if (['daily_inspection', '日常巡检'].includes(lower)) return 'daily_inspection'
  if (['hazard_screening', '隐患排查'].includes(lower)) return 'hazard_screening'
  if (['environment_check', '环境检查'].includes(lower)) return 'environment_check'
  if (['operation_guard', '作业监护'].includes(lower)) return 'operation_guard'
  if (['work_ticket_guard', '作业票监护'].includes(lower)) return 'work_ticket_guard'
  if (['emergency_arrival', '应急到场'].includes(lower)) return 'emergency_arrival'
  return undefined
}

// ===== 生成同步批次 ID =====
export function generateSyncBatchId(): string {
  return `sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

// ===== Mock 模式：生成演示数据 =====
export function generateMockThirdPartyTasks(config: ThirdPartyApiConfig): any[] {
  const templates = [
    { taskId: 'EXT-001', name: '反应釜温度巡检', pointCode: 'POINT-001', priority: 'high', risk: 'warning', scene: 'daily_inspection' },
    { taskId: 'EXT-002', name: '储罐区液位检查', pointCode: 'POINT-002', priority: 'normal', risk: 'normal', scene: 'daily_inspection' },
    { taskId: 'EXT-003', name: '管道法兰密封性检测', pointCode: 'POINT-001', priority: 'high', risk: 'alarm', scene: 'hazard_screening' },
    { taskId: 'EXT-004', name: '气体检测装置巡检', pointCode: 'POINT-002', priority: 'emergency', risk: 'critical_alarm', scene: 'emergency_arrival' },
    { taskId: 'EXT-005', name: '消防设施检查', pointCode: 'POINT-001', priority: 'normal', risk: 'normal', scene: 'daily_inspection' }
  ]
  return templates.map((t, i) => ({
    ...t,
    description: `${t.name} - 由 ${config.systemName} 系统下发`,
    plannedExecuteAt: new Date(Date.now() + (i + 1) * 3600000).toISOString()
  }))
}